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
from collections import Counter

FRONTMATTER_RE = re.compile(r"^---\n.*?\n---\n", re.DOTALL)


def split_frontmatter(text: str) -> tuple[str, str]:
    """Zwraca (blok_frontmattera_lub_'', body). Frontmatter nie jest wysyłany do modelu."""
    m = FRONTMATTER_RE.match(text)
    if not m:
        return "", text
    return m.group(0), text[m.end():]


# (kind, regex) – stosowane w tej kolejności
PROTECT_PATTERNS = [
    ("CODEBLOCK", re.compile(r"```.*?```", re.DOTALL)),
    ("HEADING", re.compile(r"^#{1,6}[^\n]*$", re.MULTILINE)),
    ("SHORTCODE", re.compile(r"\{\{[<%].*?[%>]\}\}", re.DOTALL)),
    ("INLINECODE", re.compile(r"`[^`\n]+`")),
    ("MDLINK", re.compile(r"\]\([^)]+\)")),
    ("URL", re.compile(r"https?://\S+")),
]


def protect(body: str) -> tuple[str, dict]:
    """Podmienia zamrożone konstrukcje na unikalne tokeny §KIND_N§. Zwraca (tekst, store)."""
    store: dict[str, str] = {}
    counter = [0]
    text = body
    for kind, pat in PROTECT_PATTERNS:
        def repl(m: re.Match) -> str:
            token = f"§{kind}_{counter[0]}§"
            store[token] = m.group(0)
            counter[0] += 1
            return token
        text = pat.sub(repl, text)
    return text, store


def restore(text: str, store: dict) -> str:
    """Przywraca oryginały w miejsce tokenów."""
    for token, original in store.items():
        text = text.replace(token, original)
    return text


NUMBER_RE = re.compile(r"\d[\d.,]*")
MODEL_MENTION_RE = re.compile(
    r"(?:GPT|Gemini|Claude|Grok|Llama|Mistral|DeepSeek|Qwen|Bard|Copilot)"
    r"[\w.\- ]*?\d[\d.]*"
)


def extract_facts(text: str) -> tuple[Counter, Counter]:
    """Multizbiory faktów do diff-guardu: (liczby, wzmianki o modelach)."""
    numbers = Counter(NUMBER_RE.findall(text))
    models = Counter(m.strip().rstrip(".,;:!?") for m in MODEL_MENTION_RE.findall(text))
    return numbers, models
