"""Wstawianie ulepszeń w treść sekcji: linki wewnętrzne, definicje i przypisy.

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
MAX_DEFINITIONS = 2
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
    """Przypisy: odnośnik przy tezie + sekcja „Źródła" na końcu artykułu.

    Numeracja jest wspólna dla całego artykułu, a lista źródeł trafia do
    wskazanego wolnego slotu ACF. Bez wolnego slotu przypisy nie są wstawiane –
    lepiej zgłosić to człowiekowi niż zgubić bibliografię.
    """
    result = dict(sections)
    usable = _dedupe(citations, "source_url", MAX_CITATIONS)
    applied, skipped = [], []
    numbered = []
    for citation in usable:
        slot = int(citation.get("slot") or 0)
        anchor = (citation.get("anchor") or "").strip()
        url = (citation.get("source_url") or "").strip()
        if slot not in result or not url.startswith("http"):
            skipped.append({**citation, "reason": "brak sekcji albo adresu źródła"})
            continue
        number = len(numbered) + 1
        marker = f'<sup class="przypis"><a href="#zrodlo-{number}">[{number}]</a></sup>'
        html, count = replace_outside_tags(result[slot], anchor, f"{{}}{marker}") if anchor else (result[slot], 0)
        if not count:
            # Anchor się nie trafił – dopinamy odnośnik na końcu pierwszego akapitu
            # sekcji, żeby źródło nie zniknęło z artykułu.
            html, count = re.subn(r"</p>", f"{marker}</p>", result[slot], count=1)
        if not count:
            skipped.append({**citation, "reason": "nie udało się osadzić odnośnika"})
            continue
        result[slot] = html
        numbered.append({**citation, "number": number})
        applied.append(citation)

    if numbered and sources_slot:
        items = "\n".join(
            f'<li id="zrodlo-{row["number"]}">'
            f'<a href="{html_lib.escape(row["source_url"], quote=True)}" rel="nofollow noopener" target="_blank">'
            f'{html_lib.escape(row.get("source_title") or row["source_url"])}</a>'
            f'{" – " + html_lib.escape(row["publisher"]) if row.get("publisher") else ""}'
            f'{" (" + html_lib.escape(str(row["published"])) + ")" if row.get("published") else ""}'
            f"</li>"
            for row in numbered
        )
        result[sources_slot] = f"<ol class=\"zrodla\">\n{items}\n</ol>"
    elif numbered:
        skipped.append({"reason": "brak wolnego slotu na sekcję Źródła", "count": len(numbered)})

    return result, {"applied": applied, "skipped": skipped, "sources_slot": sources_slot if numbered else None}
