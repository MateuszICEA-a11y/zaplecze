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
import json
import os
import urllib.request
import urllib.error
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


def clean_model_output(text: str) -> str:
    """Zdejmuje opakowanie ```fence``` i białe znaki brzegowe."""
    t = text.strip()
    if t.startswith("```"):
        t = re.sub(r"^```(?:\w+)?\s*", "", t)
        t = re.sub(r"\s*```$", "", t)
    return t.strip()


def diff_guard(before: str, after: str, store: dict) -> list[str]:
    """Lista naruszeń (pusta = OK). Sprawdza: (1) każdy token obecny dokładnie raz,
    (2) niezmienione multizbiory liczb i nazw modeli w prozie."""
    violations = []
    for token in store:
        if after.count(token) != 1:
            violations.append(f"token zgubiony/zduplikowany: {token} ({after.count(token)}x)")
    bn, bm = extract_facts(before)
    an, am = extract_facts(after)
    if bn != an:
        violations.append(f"liczby zmienione: -{bn - an} +{an - bn}")
    if bm != am:
        violations.append(f"nazwy modeli zmienione: -{bm - am} +{am - bm}")
    return violations


API_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL = os.environ.get("SMOOTHER_MODEL", "google/gemini-3.1-pro-preview")

SYSTEM_PROMPT = """Jesteś senior redaktorem polskojęzycznego portalu widocznosc.ai (GEO, AI Search, SEO). Dostajesz treść artykułu (proza + tokeny §...§). Zadanie: WYGŁADŹ polszczyznę i usuń kalki, zachowując sens.

ROBISZ:
- usuwasz anglicyzmy i kalki leksykalne, poprawiasz nienaturalne kolokacje (słownik w regułach poniżej),
- poprawiasz fleksję, szyk, interpunkcję, rytm zdań (burstiness),
- usuwasz AI-fingerprinty z blacklisty w regułach.

CZEGO BEZWZGLĘDNIE NIE WOLNO:
- NIE zmieniaj ŻADNYCH liczb, dat, cen, procentów, okien kontekstu (np. 1M, 65k, $1,50, 87,6%),
- NIE zmieniaj nazw modeli ani wersji (GPT-5.5, Gemini 3.5, Claude Opus 4.7),
- NIE ruszaj tokenów §...§ – przepisz je DOKŁADNIE i w tym samym miejscu (to kod, linki, nagłówki, shortcode'y),
- NIE dodawaj, nie usuwaj ani nie przestawiaj treści; nie dopisuj wstępów ani podsumowań,
- NIE zmieniaj sensu zdań zawierających dane liczbowe lub faktyczne.

ZWRÓĆ WYŁĄCZNIE przepisaną treść – bez komentarza, bez ```fence```, bez nagłówka typu „Oto poprawiona wersja"."""


def build_payload(protected_body: str, rules: str) -> dict:
    user_msg = (
        f"# Reguły redakcyjne (kontekst)\n\n{rules[:8000]}\n\n"
        f"# Treść do wygładzenia\n\n{protected_body}\n\n"
        "Zwróć WYŁĄCZNIE wygładzoną treść."
    )
    return {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_msg},
        ],
        "temperature": 0.3,
    }


def call_openrouter(protected_body: str, rules: str, api_key: str) -> str:
    """Zwraca surową treść z modelu (przed clean_model_output)."""
    req = urllib.request.Request(
        API_URL,
        data=json.dumps(build_payload(protected_body, rules)).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://widocznosc.ai",
            "X-Title": "widocznosc.ai blog polish",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=180) as resp:
        body = json.loads(resp.read().decode("utf-8"))
    content = body["choices"][0]["message"].get("content")
    if not content:
        raise RuntimeError(f"Pusta odpowiedź modelu: {json.dumps(body)[:300]}")
    return content


def process_text(text: str, rules: str, call_fn) -> dict:
    """Pełny potok jednego pliku. call_fn(protected_body, rules) -> surowy tekst modelu.
    Zwraca {status, text, detail}. Przy rejected/error zwraca oryginał w 'text'."""
    fm, body = split_frontmatter(text)
    protected, store = protect(body)
    try:
        raw = call_fn(protected, rules)
    except Exception as e:  # noqa: BLE001 – nie wywalaj całej paczki
        return {"status": "error", "text": text, "detail": str(e)}
    cleaned = clean_model_output(raw)
    # Przywróć końcowy newline usunięty przez clean_model_output (tekst pliku zawsze go ma)
    if cleaned and not cleaned.endswith("\n"):
        cleaned += "\n"
    violations = diff_guard(protected, cleaned, store)
    if violations:
        return {"status": "rejected", "text": text, "detail": "; ".join(violations)}
    new_body = restore(cleaned, store)
    new_text = fm + new_body
    if new_text == text:
        return {"status": "unchanged", "text": text, "detail": ""}
    return {"status": "smoothed", "text": new_text, "detail": ""}
