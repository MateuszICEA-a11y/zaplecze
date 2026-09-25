"""Typ strony konkurenta (LLM): poradnik, słownik, news, firmowe, case study, oferta.

Sitemapy blogów agencji mieszają poradniki z relacjami z eventów, przeglądami
nowinek i ogłoszeniami. Do „tematów, których nie mamy” nadają się tylko treści
ponadczasowe (poradnik, słownik) – reszta to szum w podpowiedziach.

Najpierw reguły deterministyczne po adresie (sekcja serwisu, słowa w slugu) –
pewne, darmowe i stabilne między przebiegami; na próbie 3563 stron zgodne z
modelem w 97–99%. Model dostaje tylko resztę: ścieżkę i tytuł, paczkami.
Wynik: `kind`, `kind_basis` (krótkie uzasadnienie) i `kind_title` – tytuł, na
którym oceniono. Zmiana tytułu (np. prawdziwy zamiast sluga) = ocena od nowa.
"""
import json
import re
import threading
import urllib.request
from concurrent.futures import ThreadPoolExecutor

from ._http import DEFAULT_HEADERS

MODEL = "google/gemini-3.8-flash"
BATCH = 40
TIMEOUT_S = 120
KINDS = ("poradnik", "slownik", "news", "firmowe", "case_study", "oferta", "niepewne")
# Do luk tematycznych – treści, które mają sens jako nasz wpis.
CONTENT_KINDS = ("poradnik", "slownik")

MONTHS = ("styczen|styczniu|luty|lutym|marzec|marcu|kwiecien|kwietniu|maj|maju|czerwiec|czerwcu|lipiec|lipcu|"
          "sierpien|sierpniu|wrzesien|wrzesniu|pazdziernik|pazdzierniku|listopad|listopadzie|grudzien|grudniu")
# Kolejność ma znaczenie: relacja z konferencji z datą w slugu to „firmowe”, nie „news”.
RULES = (
    ("slownik", re.compile(r"^/slownik(-pojec)?/"), "sekcja słownika pojęć"),
    ("case_study", re.compile(r"case-study|historia-sukcesu"), "case study w adresie"),
    ("firmowe", re.compile(r"relacja|prelegen|patroni|traffic-day|madtechcommerce|brighton|festiwal|targach|wosp"
                           r"|urodzin|lat-z-nami|nominac|(^|[-/])nagrod(a|y|zeni)|jubileusz|kariera|rekrutac"),
     "wydarzenie lub sprawy agencji w adresie"),
    ("news", re.compile(r"przeglad-nowinek|tygodniowy-przeglad|seo-newsy|newsy-seo|prasowka|core-update|spam-update"
                        rf"|aktualizacja-algorytmu|({MONTHS})-20\d\d|20\d\d-({MONTHS})"),
     "przegląd nowości lub data w adresie"),
)


def rule_kind(path: str) -> tuple[str, str] | None:
    """(typ, uzasadnienie) z samego adresu albo None, gdy adres nic nie przesądza."""
    lowered = (path or "").lower()
    for kind, pattern, basis in RULES:
        if pattern.search(lowered):
            return kind, f"reguła: {basis}"
    return None


PROMPT = """Klasyfikujesz podstrony z blogów polskich agencji marketingu internetowego (SEO, SEM, social media, e-commerce).
Dla każdej pozycji (ścieżka adresu + tytuł) wybierz dokładnie jeden typ:

- poradnik – artykuł edukacyjny, ponadczasowy: jak coś zrobić, czym jest, porównanie, lista porad, analiza zjawiska
- slownik – hasło słownikowe / definicja jednego pojęcia (zwykle ścieżka ze słownikiem pojęć)
- news – treść związana z datą: przegląd nowinek (np. „SEO Newsy Listopad 2024”, „Tygodniowy przegląd PPC”), zapowiedź albo relacja ze zmiany w Google/Meta, aktualizacja algorytmu, raport z danego roku
- firmowe – o samej agencji: jej eventy, konferencje, relacje, prelegenci, własne webinary i kursy, rekrutacja, nagrody, akcje charytatywne, zespół, jubileusze
- case_study – opis realizacji dla klienta, wyniki kampanii konkretnej firmy
- oferta – strona usługowa lub sprzedażowa, cennik, landing
- niepewne – z tytułu i adresu nie da się tego rozstrzygnąć

Tytuł bywa odtworzony ze sluga (małe litery, bez polskich znaków) – oceniaj treść, nie formę.
Nie zgaduj: gdy brakuje podstaw, wybierz „niepewne”.

Zwróć wyłącznie JSON: {"items": [{"i": <numer>, "kind": "<typ>", "basis": "<max 12 słów po polsku, bez cudzysłowów: co w tytule/adresie przesądza>"}]}
Każdy numer z wejścia dokładnie raz.

Pozycje:
"""


def item_text(item: dict) -> str:
    return (item.get("title") or item.get("slug_title") or "").strip()


def needs_kind(item: dict) -> bool:
    """Ocena modelu brakuje albo była na innym tytule. Na tytuł czekamy, dopóki
    go nie pobrano ani nie zapisano błędu – inaczej model ocenia slug, a za dzień
    i tak trzeba by oceniać drugi raz. Strony z reguły nie potrzebują modelu."""
    if item.get("kind_source") == "rule" or rule_kind(item.get("path", "")):
        return False
    if not item.get("title") and not item.get("title_error"):
        return False
    return item.get("kind_title") != item_text(item) or item.get("kind") not in KINDS


def apply_rules(items: list[dict]) -> int:
    """Typ z adresu dla wszystkich pasujących stron (także bez tytułu). Zwraca liczbę."""
    applied = 0
    for item in items:
        verdict = rule_kind(item.get("path", ""))
        if not verdict:
            continue
        item["kind"], item["kind_basis"] = verdict
        item["kind_source"] = "rule"
        item["kind_title"] = item_text(item)
        applied += 1
    return applied


def _call(api_key: str, batch: list[dict]) -> dict[int, dict]:
    lines = "\n".join(f"{n}. {item['path']} | {item_text(item)}" for n, item in enumerate(batch, 1))
    body = json.dumps({
        "model": MODEL,
        "messages": [{"role": "user", "content": PROMPT + lines}],
        "response_format": {"type": "json_object"},
        "temperature": 0,
        # Klasyfikacja nie potrzebuje myślenia – reasoning zjadał limit tokenów (gotcha 2026-09).
        "reasoning": {"effort": "minimal", "exclude": True},
        "max_tokens": 6000,
    }).encode("utf-8")
    req = urllib.request.Request(
        "https://openrouter.ai/api/v1/chat/completions",
        data=body,
        headers={**DEFAULT_HEADERS, "Content-Type": "application/json", "Authorization": f"Bearer {api_key}",
                 "X-Title": "zaplecze-dashboard competitor kinds"},
    )
    with urllib.request.urlopen(req, timeout=TIMEOUT_S) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    content = data["choices"][0]["message"]["content"] or ""
    content = re.sub(r"^```(?:json)?\s*|\s*```$", "", content.strip())
    out = {}
    for row in json.loads(content).get("items", []):
        try:
            index = int(row.get("i"))
        except (TypeError, ValueError):
            continue
        kind = str(row.get("kind", "")).strip().lower().replace(" ", "_")
        if 1 <= index <= len(batch) and kind in KINDS:
            out[index] = {"kind": kind, "basis": str(row.get("basis", ""))[:160]}
    return out


def _call_split(api_key: str, batch: list[dict], log=None, depth: int = 0) -> dict[int, dict]:
    """Paczka z zepsutym JSON-em (np. cudzysłów w uzasadnieniu) idzie drugi raz
    połówkami – jedna zła pozycja nie kosztuje oceny czterdziestu."""
    try:
        return _call(api_key, batch)
    except Exception as err:  # noqa: BLE001 – jedna paczka nie przerywa reszty
        if log:
            log(f"paczka {len(batch)} poz. (poziom {depth}): {str(err)[:120]}")
        if depth >= 2 or len(batch) < 2:
            return {}
    half = len(batch) // 2
    left = _call_split(api_key, batch[:half], log, depth + 1)
    right = _call_split(api_key, batch[half:], log, depth + 1)
    return {**left, **{index + half: verdict for index, verdict in right.items()}}


def classify(items: list[dict], api_key: str, limit: int | None = None, log=None, workers: int = 4) -> dict:
    """Uzupełnia `kind`/`kind_basis`/`kind_title`/`kind_source` w miejscu: najpierw
    reguły po adresie, potem model (paczki równolegle). Paczka, która padła,
    zostaje bez oceny do następnego przebiegu. Zwraca liczniki."""
    ruled = apply_rules(items)
    todo = [item for item in items if needs_kind(item)]
    if limit is not None:
        todo = todo[:limit]
    stats = {"classified": 0, "failed": 0, "todo": len(todo), "rules": ruled}
    batches = [todo[start:start + BATCH] for start in range(0, len(todo), BATCH)]
    lock = threading.Lock()

    def run(batch: list[dict]) -> None:
        result = _call_split(api_key, batch, log)
        with lock:
            for index, item in enumerate(batch, 1):
                verdict = result.get(index)
                if not verdict:
                    stats["failed"] += 1
                    continue
                item["kind"] = verdict["kind"]
                item["kind_basis"] = verdict["basis"]
                item["kind_source"] = "llm"
                item["kind_title"] = item_text(item)
                stats["classified"] += 1
            if log:
                log(f"sklasyfikowano {stats['classified']}/{len(todo)}")

    with ThreadPoolExecutor(max_workers=max(1, workers)) as pool:
        list(pool.map(run, batches))
    return stats
