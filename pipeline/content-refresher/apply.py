"""Wstawianie ulepszeń w treść sekcji: linki wewnętrzne, definicje i sekcja Źródeł.

Model zwraca propozycje (anchor + adres). Tutaj zamieniamy je na realny HTML,
z dwoma zasadami bezpieczeństwa:

1. Podmieniamy wyłącznie tekst POZA znacznikami – anchor trafiony w atrybucie
   `href` albo w nazwie klasy rozwaliłby dokument.
2. Nie ruszamy fragmentów, które już są linkiem – zagnieżdżone `<a>` jest
   niepoprawne, a podwójne linkowanie tej samej frazy szkodzi czytelności.

Czego nie da się wstawić (brak anchora w tekście), wraca na listę `skipped` –
człowiek zobaczy to w edytorze zamiast cichej straty.
"""
import html as html_lib
import re

MAX_CITATIONS = 8
# Decyzja redakcyjna 2026-08-03: jedyny link zewnętrzny w treści to pojedyncza
# definicja z Wikipedii – reszta źródeł idzie do sekcji „Źródła" na końcu.
MAX_DEFINITIONS = 1
MAX_INTERNAL_LINKS = 5

_TAG_SPLIT = re.compile(r"(<[^>]+>)")
_LINK_BLOCK = re.compile(r"<a\b[^>]*>.*?</a>", re.I | re.S)


def _segments(html: str):
    """Dzieli HTML na kawałki: (tekst, czy_to_znacznik)."""
    return [(part, part.startswith("<")) for part in _TAG_SPLIT.split(html) if part != ""]


def replace_outside_tags(html: str, needle: str, replacement: str, limit: int = 1) -> tuple[str, int]:
    """Podmiana `needle` na `replacement` tylko w tekście widocznym dla czytelnika.

    Zwraca (nowy HTML, liczba podmian). Wielkość liter ignorowana, ale
    zachowujemy oryginalne brzmienie tekstu tam, gdzie `replacement` zawiera
    znacznik `{}` – to pozwala owinąć dokładnie ten wariant, który stoi w tekście.
    """
    if not needle.strip():
        return html, 0
    done = 0
    out = []
    inside_link = 0
    pattern = re.compile(re.escape(needle), re.IGNORECASE)
    for part, is_tag in _segments(html):
        if is_tag:
            tag = part.lower()
            if tag.startswith("<a"):
                inside_link += 1
            elif tag.startswith("</a"):
                inside_link = max(0, inside_link - 1)
            out.append(part)
            continue
        if done >= limit or inside_link:
            out.append(part)
            continue

        def _sub(match):
            nonlocal done
            if done >= limit:
                return match.group(0)
            done += 1
            return replacement.replace("{}", match.group(0)) if "{}" in replacement else replacement

        out.append(pattern.sub(_sub, part, count=limit - done))
    return "".join(out), done


def _dedupe(rows: list[dict], key: str, limit: int) -> list[dict]:
    seen = set()
    out = []
    for row in rows or []:
        value = (row.get(key) or "").strip()
        if not value or value in seen:
            continue
        seen.add(value)
        out.append(row)
        if len(out) >= limit:
            break
    return out


def apply_internal_links(sections: dict[int, str], links: list[dict]) -> tuple[dict[int, str], list[dict]]:
    """Zamienia anchory na linki wewnętrzne. Jeden link na adres docelowy."""
    applied, skipped = [], []
    result = dict(sections)
    for link in _dedupe(links, "target_url", MAX_INTERNAL_LINKS):
        slot = int(link.get("slot") or 0)
        anchor = (link.get("anchor") or "").strip()
        target = (link.get("target_url") or "").strip()
        if slot not in result or not anchor or not target.startswith("http"):
            skipped.append({**link, "reason": "brak sekcji albo danych linku"})
            continue
        html, count = replace_outside_tags(
            result[slot], anchor, f'<a href="{html_lib.escape(target, quote=True)}">{{}}</a>'
        )
        if count:
            result[slot] = html
            applied.append(link)
        else:
            skipped.append({**link, "reason": "anchor nie występuje w treści sekcji"})
    return result, {"applied": applied, "skipped": skipped}


def apply_definitions(sections: dict[int, str], definitions: list[dict]) -> tuple[dict[int, str], dict]:
    """Linki definicyjne (Wikipedia) przy pierwszym wystąpieniu pojęcia."""
    applied, skipped = [], []
    result = dict(sections)
    for definition in _dedupe(definitions, "url", MAX_DEFINITIONS):
        slot = int(definition.get("slot") or 0)
        term = (definition.get("anchor") or definition.get("term") or "").strip()
        url = (definition.get("url") or "").strip()
        if slot not in result or not term or "wikipedia.org" not in url:
            skipped.append({**definition, "reason": "brak sekcji albo adres spoza Wikipedii"})
            continue
        html, count = replace_outside_tags(
            result[slot], term, f'<a href="{html_lib.escape(url, quote=True)}">{{}}</a>'
        )
        if count:
            result[slot] = html
            applied.append(definition)
        else:
            skipped.append({**definition, "reason": "pojęcie nie występuje w treści sekcji"})
    return result, {"applied": applied, "skipped": skipped}


def apply_citations(sections: dict[int, str], citations: list[dict],
                    sources_slot: int | None = None) -> tuple[dict[int, str], dict]:
    """Sekcja „Źródła" na końcu artykułu – sama lista, bez znaczników w treści.

    Decyzja redakcyjna (2026-08-03): w tekście nie stawiamy odnośników [n]
    ani linków przy tezach – bibliografia z rel="nofollow" stoi w osobnej
    sekcji, a jedynym linkiem zewnętrznym w treści pozostaje pojedyncza
    definicja z Wikipedii (apply_definitions). Bez wolnego slotu lista nie
    powstaje – lepiej zgłosić to człowiekowi niż zgubić bibliografię.
    """
    result = dict(sections)
    applied, skipped = [], []
    for citation in _dedupe(citations, "source_url", MAX_CITATIONS):
        if (citation.get("source_url") or "").strip().startswith("http"):
            applied.append(citation)
        else:
            skipped.append({**citation, "reason": "brak adresu źródła"})

    if applied and sources_slot:
        items = "\n".join(
            f"<li>"
            f'<a href="{html_lib.escape(row["source_url"], quote=True)}" rel="nofollow noopener" target="_blank">'
            f'{html_lib.escape(row.get("source_title") or row["source_url"])}</a>'
            f'{" – " + html_lib.escape(row["publisher"]) if row.get("publisher") else ""}'
            f'{" (" + html_lib.escape(str(row["published"])) + ")" if row.get("published") else ""}'
            f"</li>"
            for row in applied
        )
        result[sources_slot] = f"<ol class=\"zrodla\">\n{items}\n</ol>"
    elif applied:
        skipped.append({"reason": "brak wolnego slotu na sekcję Źródła", "count": len(applied)})
        applied = []

    return result, {"applied": applied, "skipped": skipped, "sources_slot": sources_slot if applied else None}
