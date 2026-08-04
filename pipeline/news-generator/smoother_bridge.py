"""Wygładzanie polszczyzny newsa BusManiaka przed zapisem do repo.

Do sierpnia 2026 tekst z modelu piszącego szedł prosto do pliku – żaden etap
nie oglądał gotowej prozy (sędzia LLM ze scorer.py ocenia wyłącznie wybór tematu
PRZED napisaniem). Tak na produkcję trafiło zdanie „Wysoki diesel uderza
w koszty firm transportowych".

Silnik ochrony tokenów i diff-guard bierzemy z pipeline'u blog-polish, ale
prompt i reguły są busmaniakowe – tamte dotyczą terminologii GEO/AI Search.

Fail-safe jak w wariancie widocznosc.ai: brak klucza, odrzucenie przez guard
albo błąd API zwracają ORYGINAŁ i log. Nigdy nie wywala codziennej generacji.
"""

from __future__ import annotations

import json
import logging
import os
import sys
import urllib.request
from pathlib import Path

_SMOOTHER_SCRIPTS = Path(__file__).resolve().parent.parent / "widocznosc-blog-polish" / "scripts"
sys.path.insert(0, str(_SMOOTHER_SCRIPTS))

import smoother  # noqa: E402

log = logging.getLogger("news-generator.smoother")

RULES_PATH = Path(__file__).resolve().parent / "writing-rules.md"

SYSTEM_PROMPT = """Jesteś redaktorem prowadzącym portalu BusManiak.pl – serwisu o busach, vanach, kamperach i motoryzacji dostawczej. Dostajesz treść newsa (proza + tokeny §...§). Zadanie: WYGŁADŹ polszczyznę, zachowując sens i wszystkie fakty.

ROBISZ:
- rozwijasz potoczne skróty myślowe i metonimie („wysoki diesel" → „wysoka cena oleju napędowego"),
- usuwasz kalki i anglicyzmy, poprawiasz nienaturalne kolokacje,
- poprawiasz fleksję, szyk, interpunkcję i rytm zdań,
- wycinasz wypełniacze i zwroty z blacklisty AI podanej w regułach.

CZEGO BEZWZGLĘDNIE NIE WOLNO:
- NIE zmieniaj ŻADNYCH liczb, dat, cen, oznaczeń dróg (S6, DK94, A4), numerów ani jednostek,
- NIE zmieniaj FORMY ZAPISU liczb i jednostek: „20 proc." zostaje „20 proc." (nie „20%"), „8 zł/l" zostaje „8 zł/l", „6 osób" nie staje się „sześć osób". Przepisz je znak w znak,
- NIE zmieniaj nazw marek, modeli i wersji (Fiat Ducato L3H2, Mercedes Sprinter),
- NIE zmieniaj nazw miejscowości, instytucji ani nazwisk,
- NIE ruszaj tokenów §...§ – przepisz je DOKŁADNIE i w tym samym miejscu (to linki, nagłówki, listy, shortcode'y),
- NIE dodawaj, nie usuwaj ani nie przestawiaj treści; nie dopisuj wstępów ani podsumowań,
- NIE dopowiadaj okoliczności zdarzenia, których w tekście nie ma.

ZACHOWANIE STRUKTURY (twardo):
- Zachowaj liczbę akapitów 1:1 – jeden akapit wejściowy = jeden akapit wyjściowy.
- NIE dodawaj zdań wprowadzających wokół tokenów §...§.

CYTATY (twardo):
- Tekst w cudzysłowie zostaw DOSŁOWNIE. Poprawiasz wyłącznie prozę wokół cytatu.

ZWRÓĆ WYŁĄCZNIE przepisaną treść – bez komentarza, bez ```fence```, bez nagłówka typu „Oto poprawiona wersja"."""


def news_rules() -> str:
    if not RULES_PATH.exists():
        return ""
    return RULES_PATH.read_text(encoding="utf-8")


def _build_payload(protected_body: str, rules: str) -> dict:
    return {
        "model": smoother.MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": (
                    f"# Reguły redakcyjne (kontekst)\n\n{rules[:8000]}\n\n"
                    f"# Treść do wygładzenia\n\n{protected_body}\n\n"
                    "Zwróć WYŁĄCZNIE wygładzoną treść."
                ),
            },
        ],
        "temperature": 0.3,
    }


def _call_openrouter(protected_body: str, rules: str, api_key: str) -> str:
    req = urllib.request.Request(
        smoother.API_URL,
        data=json.dumps(_build_payload(protected_body, rules)).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://busmaniak.pl",
            "X-Title": "BusManiak.pl news polish",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=smoother.TIMEOUT) as resp:
        body = json.loads(resp.read().decode("utf-8"))
    content = body["choices"][0]["message"].get("content")
    if not content:
        raise RuntimeError(f"Pusta odpowiedź modelu: {json.dumps(body)[:300]}")
    return content


def smooth_news(text: str, call_fn=None) -> str:
    """Wygładza markdown newsa (frontmatter + body). Zawsze zwraca poprawny markdown."""
    if call_fn is None:
        key = os.environ.get("OPENROUTER_API_KEY", "").strip()
        if not key:
            log.warning("OPENROUTER_API_KEY brak – news publikowany bez wygładzania")
            return text
        call_fn = lambda pb, r: _call_openrouter(pb, r, key)  # noqa: E731

    result = smoother.process_text(text, news_rules(), call_fn)
    status = result["status"]
    if status in ("rejected", "error"):
        log.warning("news bez wygładzania (%s): %s", status, result["detail"])
    elif status == "smoothed":
        log.info("news wygładzony (%s)", smoother.MODEL)
    return _normalize_frontmatter_gap(result["text"])


def _normalize_frontmatter_gap(text: str) -> str:
    """Model bywa, że zjada pustą linię po zamykającym `---`.

    Bez znaczenia dla Hugo, ale reszta wpisów w repo ma tam pustą linię –
    przywracamy ją, żeby diffy przy kolejnych przejazdach nie szumiały.
    """
    return text.replace("\n---\n## ", "\n---\n\n## ", 1)
