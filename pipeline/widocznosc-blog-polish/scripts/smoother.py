#!/usr/bin/env python3
"""widocznosc-blog-polish smoother – pełny rewrite prozy wpisu przez Gemini 3.1 Pro
(OpenRouter), z placeholder-protection i deterministycznym diff-guardem na faktach.

Frontmatter, kod, linki, shortcode'y i nagłówki NIE są wysyłane do modelu.
Jeśli model ruszy jakąkolwiek liczbę lub nazwę modelu w prozie -> plik odrzucony.

Usage:
    OPENROUTER_API="sk-or-..." python3 .../smoother.py PATH.md [--dry-run]
"""
from __future__ import annotations
import re

FRONTMATTER_RE = re.compile(r"^---\n.*?\n---\n", re.DOTALL)


def split_frontmatter(text: str) -> tuple[str, str]:
    """Zwraca (blok_frontmattera_lub_'', body). Frontmatter nie jest wysyłany do modelu."""
    m = FRONTMATTER_RE.match(text)
    if not m:
        return "", text
    return m.group(0), text[m.end():]
