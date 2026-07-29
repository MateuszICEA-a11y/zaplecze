"""Sekcje ACF: snapshot „przed", propozycja „po" i diff między nimi.

Sekcja to PARA pól: `page_title_h2_N` (nagłówek) i `page_text_N` (treść).
Numer slotu jest istotny – szablon ma 30 par i nowe treści mogą wejść wyłącznie
w wolny slot. Slot sprawdzamy ponownie w chwili akceptacji, bo redakcja mogła
w międzyczasie coś dopisać w CMS-ie.
"""
import difflib
import re
import sys
from pathlib import Path

from config import ACF_SLOTS, SLOT_TEXT, SLOT_TITLE

# Maper ACF ma jedną implementację – tę z collectora.
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "dashboard" / "collector"))
from sources.wordpress import content_hash, strip_html  # noqa: E402


def occupied_slots(acf: dict) -> list[int]:
    """Numery slotów, w których cokolwiek stoi."""
    return [
        n for n in range(1, ACF_SLOTS + 1)
        if (acf.get(SLOT_TITLE.format(n=n)) or "").strip() or (acf.get(SLOT_TEXT.format(n=n)) or "").strip()
    ]


def free_slots(acf: dict) -> list[int]:
    taken = set(occupied_slots(acf))
    return [n for n in range(1, ACF_SLOTS + 1) if n not in taken]


def snapshot(acf: dict) -> list[dict]:
    """Stan wyjściowy sekcji – trafia do `job_sections.*_before`."""
    return [
        {
            "slot": n,
            "title_field": SLOT_TITLE.format(n=n),
            "text_field": SLOT_TEXT.format(n=n),
            "title": (acf.get(SLOT_TITLE.format(n=n)) or "").strip(),
            "text": (acf.get(SLOT_TEXT.format(n=n)) or "").strip(),
            "hash": content_hash(acf.get(SLOT_TEXT.format(n=n)) or ""),
        }
        for n in occupied_slots(acf)
    ]


def _tokens(text: str) -> list[str]:
    """Tokenizacja pod diff: słowa, interpunkcja i białe znaki osobno.

    Interpunkcja musi być osobnym tokenem – inaczej dopisanie czegoś przed
    kropką wygląda w diffie jak usunięcie poprzedniego wyrazu.
    """
    return re.findall(r"\s+|\w+|[^\w\s]", strip_html(text or ""), flags=re.UNICODE)


def diff_tokens(before: str, after: str) -> list[dict]:
    """Opcode'y diffa gotowe do wyrenderowania przez frontend."""
    old, new = _tokens(before), _tokens(after)
    out = []
    for tag, i1, i2, j1, j2 in difflib.SequenceMatcher(None, old, new, autojunk=False).get_opcodes():
        out.append({
            "op": tag,
            "before": "".join(old[i1:i2]),
            "after": "".join(new[j1:j2]),
        })
    return out


SHRINK_MIN_WORDS = 80   # poniżej tego progu redukcja jest zwykle kosmetyczna
SHRINK_RATIO = 1.5      # usunięto o połowę więcej, niż dopisano


def diff_stats(opcodes: list[dict]) -> dict:
    """Ile słów doszło, ile zniknęło – do podsumowania w UI.

    `shrunk` oznacza sekcję, z której model wyciął istotnie więcej, niż dopisał.
    Model bywa nadgorliwy w „porządkowaniu" tekstu, a to gotowy artykuł
    z historią – takie sekcje mają zwrócić uwagę człowieka przed akceptacją.
    """
    words = lambda text: len([t for t in re.split(r"\s+", text or "") if t.strip()])  # noqa: E731
    added = sum(words(op["after"]) for op in opcodes if op["op"] in ("insert", "replace"))
    removed = sum(words(op["before"]) for op in opcodes if op["op"] in ("delete", "replace"))
    return {
        "added": added,
        "removed": removed,
        "shrunk": removed >= SHRINK_MIN_WORDS and removed > added * SHRINK_RATIO,
    }


def renumber(before: list[dict], proposals: dict[int, dict]) -> tuple[dict[int, dict], dict[int, int]]:
    """Finalny układ artykułu: nowe sekcje wchodzą ZA wskazaną kotwicą.

    Wolne sloty ACF leżą zawsze za treścią, więc bez renumeracji każda nowa
    sekcja lądowała po „Podsumowaniu". Tu nowa sekcja (z `after_slot`) wchodzi
    w slot tuż za kotwicą, a dalsze sekcje przesuwają się w dół – jako
    operacja `move`, którą edytor pokaże bez udawania, że to zmiana treści.

    Zwraca (propozycje z finalnymi slotami, {slot_docelowy: slot_źródłowy}).
    Nowe sekcje bez poprawnej kotwicy trafiają na koniec (stare zachowanie).
    Gdy przesunięciom zabrakłoby slotów (>30), zwraca wejście bez zmian –
    lepszy stary układ niż utrata sekcji.
    """
    occupied = [item["slot"] for item in before]
    occupied_set = set(occupied)
    inserts = {slot: proposal for slot, proposal in proposals.items() if slot not in occupied_set}
    anchored: dict[int, list[int]] = {}
    tail = []
    for slot in sorted(inserts):
        after = inserts[slot].get("after_slot")
        if isinstance(after, int) and after in occupied_set:
            anchored.setdefault(after, []).append(slot)
        else:
            tail.append(slot)

    order: list[tuple[str, int]] = []
    for slot in occupied:
        order.append(("old", slot))
        order.extend(("new", new_slot) for new_slot in anchored.get(slot, ()))
    order.extend(("new", slot) for slot in tail)

    out: dict[int, dict] = {}
    moves: dict[int, int] = {}
    by_slot = {item["slot"]: item for item in before}
    next_free = 1
    for kind, slot in order:
        target = slot if kind == "old" and slot >= next_free else next_free
        if target > ACF_SLOTS:
            return proposals, {}
        next_free = target + 1
        proposal = proposals.get(slot)
        if kind == "new":
            out[target] = {k: v for k, v in proposal.items() if k != "after_slot"}
        elif target != slot:
            moves[target] = slot
            source = by_slot[slot]
            out[target] = {
                "title": (proposal or {}).get("title") or source["title"],
                "text": (proposal or {}).get("text") or source["text"],
            }
        elif proposal:
            out[slot] = {k: v for k, v in proposal.items() if k != "after_slot"}
    return out, moves


def build_sections(before: list[dict], proposals: dict[int, dict],
                   moves: dict[int, int] | None = None) -> list[dict]:
    """Łączy snapshot z propozycjami w wiersze `job_sections`.

    `proposals`: {slot: {"title": ..., "text": ...}}. Slot spoza snapshotu to
    nowa sekcja (`operation: insert`). Sekcje bez realnej zmiany są pomijane –
    diff pusty w UI to szum, nie informacja.

    `moves`: {slot_docelowy: slot_źródłowy} z `renumber()`. Wiersz `move`
    pokazuje diff względem treści ŹRÓDŁOWEJ sekcji (to jest zmiana, którą
    człowiek ocenia), ale `text_hash_before` liczy z DOCELOWEGO slotu – bo to
    jego treść zostanie nadpisana i to ją sprawdzamy przed kopiowaniem do CMS-a.
    Docelowy slot dotąd wolny ma `text_hash_before = None`.
    """
    moves = moves or {}
    by_slot = {item["slot"]: item for item in before}
    rows = []
    for slot in sorted(proposals):
        proposal = proposals[slot]
        moved_from = moves.get(slot)
        source = by_slot.get(moved_from) if moved_from else by_slot.get(slot)
        target_old = by_slot.get(slot)
        title_before = source["title"] if source else ""
        text_before = source["text"] if source else ""
        title_after = (proposal.get("title") or title_before).strip()
        text_after = (proposal.get("text") or "").strip()
        if not text_after:
            continue
        if not moved_from and strip_html(text_after) == strip_html(text_before) and title_after == title_before:
            continue
        opcodes = diff_tokens(text_before, text_after)
        rows.append({
            "slot": slot,
            "title_field": SLOT_TITLE.format(n=slot),
            "text_field": SLOT_TEXT.format(n=slot),
            "operation": "move" if moved_from else ("update" if source else "insert"),
            "moved_from": moved_from,
            "title_before": title_before,
            "title_after": title_after,
            "text_before": text_before,
            "text_after": text_after,
            "text_hash_before": (content_hash(target_old["text"]) if target_old else None)
            if moved_from else content_hash(text_before),
            "diff": {"opcodes": opcodes, "stats": diff_stats(opcodes)},
        })
    return rows


def detect_conflicts(sections: list[dict], current_acf: dict) -> list[dict]:
    """Sekcje, które zmieniły się w CMS-ie od czasu snapshotu.

    Wołane przed skopiowaniem treści do WordPressa: jeśli hash bieżącej treści
    nie zgadza się z zapisanym `text_hash_before`, propozycja opiera się na
    nieaktualnym tekście. Dla nowych sekcji sprawdzamy, czy slot nadal jest wolny.
    """
    conflicts = []
    for section in sections:
        slot = section["slot"]
        current = (current_acf.get(SLOT_TEXT.format(n=slot)) or "").strip()
        operation = section.get("operation")
        # `move` w dotąd wolny slot sprawdzamy jak insert: slot ma być nadal wolny.
        if operation == "insert" or (operation == "move" and not section.get("text_hash_before")):
            if current or (current_acf.get(SLOT_TITLE.format(n=slot)) or "").strip():
                conflicts.append({"slot": slot, "reason": "slot_taken"})
            continue
        if content_hash(current) != section.get("text_hash_before"):
            conflicts.append({"slot": slot, "reason": "changed_in_cms"})
    return conflicts
