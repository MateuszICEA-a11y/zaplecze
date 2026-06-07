#!/usr/bin/env python3
"""Most między generatorem newsów a silnikiem wygładzania blog-polish (smoother.py).

`smooth_news(text)` wygładza prozę newsa przez Gemini 3.1 Pro (OpenRouter), zachowując
fail-safe: brak klucza / odrzucenie przez diff-guard / błąd API -> zwraca ORYGINAŁ + log.
Nigdy nie rzuca wyjątku w górę, żeby nie wywalić codziennej generacji newsa.

Newsom podajemy TYLKO prozaiczne reguły (słownik kalk, blacklista AI, fleksja) –
bez reguł strukturalnych bloga, które kusiłyby model do dodania tabel/linków/calloutów.
"""
from __future__ import annotations

import logging
import os
import sys
from pathlib import Path

# smoother.py leży w siostrzanym pipeline'ie blog-polish
_SMOOTHER_SCRIPTS = Path(__file__).resolve().parent.parent / "widocznosc-blog-polish" / "scripts"
sys.path.insert(0, str(_SMOOTHER_SCRIPTS))

import smoother  # noqa: E402

log = logging.getLogger("news-generator")

# Nagłówki H2 z writing-rules.md, które są czystą prozą i bezpieczne dla newsa.
_NEWS_RULE_SECTIONS = ["Słownik GEO", "Zakazane zwroty AI", "Polska fleksja"]


def _extract_sections(md: str, headers: list[str]) -> str:
    """Zwraca konkatenację sekcji H2 (## ...), których nagłówek zawiera którąś z fraz `headers`.
    Sekcja trwa od swojego `## ` do następnego `## ` lub końca pliku."""
    out: list[str] = []
    capture = False
    for line in md.split("\n"):
        if line.startswith("## "):
            capture = any(h in line for h in headers)
        if capture:
            out.append(line)
    return "\n".join(out)


def news_rules() -> str:
    """Prozaiczny wyciąg z writing-rules.md: słownik kalk + blacklista AI + fleksja."""
    return _extract_sections(smoother.load_rules(), _NEWS_RULE_SECTIONS)


def smooth_news(text: str, call_fn=None) -> str:
    """Wygładza markdown newsa (frontmatter + body). Fail-safe: zawsze zwraca poprawny markdown.

    call_fn: opcjonalny wstrzykiwany wykonawca (do testów). Domyślnie OpenRouter z env-klucza.
    """
    if call_fn is None:
        key = os.environ.get("OPENROUTER_API_KEY", "").strip()
        if not key:
            log.warning("OPENROUTER_API_KEY brak – news publikowany bez wygładzania")
            return text
        call_fn = lambda pb, r: smoother.call_openrouter(pb, r, key)  # noqa: E731

    result = smoother.process_text(text, news_rules(), call_fn)
    status = result["status"]
    if status in ("rejected", "error"):
        log.warning("news bez wygładzania (%s): %s", status, result["detail"])
    elif status == "smoothed":
        log.info("news wygładzony (Gemini 3.1 Pro)")
    # process_text przy rejected/error/unchanged zwraca oryginał w 'text' – zawsze bezpieczne
    return result["text"]
