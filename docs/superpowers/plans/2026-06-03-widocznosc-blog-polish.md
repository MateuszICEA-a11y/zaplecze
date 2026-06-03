# widocznosc-blog-polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Zbudować skill, który przejeżdża 46 wpisów bloga widocznosc.ai przez wygładzanie polszczyzny (Gemini 3.1 Pro, fakty zamrożone twardym diff-guardem) i fact-check (web-fact-checker), z commitami w paczkach per kategoria.

**Architecture:** Nowy skrypt `smoother.py` (stdlib-only) robi pełny rewrite prozy z placeholder-protection (kod/linki/shortcode'y/nagłówki niewidoczne dla modelu) + deterministyczny diff-guard na liczbach i nazwach modeli; plik odrzucany, gdy fakt się zmienił. Skill-orkiestrator (`SKILL.md`) prowadzi przejazd per kategoria: smoothing → commit paczki → fact-check (istniejący web-fact-checker) → osobny commit. Manifest JSON daje idempotencję.

**Tech Stack:** Python 3 (tylko stdlib: `re`, `json`, `os`, `urllib`, `hashlib`), pytest, OpenRouter (Gemini 3.1 Pro), istniejący `pipeline/web-fact-checker/`.

**Uwaga do speca:** ścieżki doprecyzowane względem `docs/superpowers/specs/2026-06-03-widocznosc-blog-polish-design.md` — skrypt mieszka w `pipeline/widocznosc-blog-polish/scripts/smoother.py` (importowalny moduł, spójnie z `web-fact-checker/scripts/web_verify.py`), nie w `pipeline/widocznosc-smoother.py`. Nagłówki są zamrażane placeholderem (mocniejsza gwarancja niż sprawdzanie ich w diff-guardzie).

---

## Struktura plików

```
pipeline/widocznosc-blog-polish/
├── SKILL.md                  # orkiestrator (Task 11)
├── README.md                 # krótki opis + uruchomienie (Task 12)
├── scripts/
│   ├── smoother.py           # silnik wygładzania (Task 1-8)
│   └── state.py              # manifest idempotencji (Task 9)
└── tests/
    ├── conftest.py           # sys.path → scripts/ (Task 1)
    ├── test_smoother.py      # Task 1-8
    └── test_state.py         # Task 9
```

Manifest runtime: `pipeline/.widocznosc-blog-polish-state.json` (gitignored, Task 10).

---

### Task 1: Scaffold + `split_frontmatter`

**Files:**
- Create: `pipeline/widocznosc-blog-polish/scripts/smoother.py`
- Create: `pipeline/widocznosc-blog-polish/tests/conftest.py`
- Test: `pipeline/widocznosc-blog-polish/tests/test_smoother.py`

- [ ] **Step 1: conftest.py – dołącz scripts/ do sys.path**

Create `pipeline/widocznosc-blog-polish/tests/conftest.py`:

```python
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))
```

- [ ] **Step 2: Write the failing test**

Create `pipeline/widocznosc-blog-polish/tests/test_smoother.py`:

```python
import smoother


def test_split_frontmatter_separates_block_and_body():
    text = "---\ntitle: 'X'\ndate: 2026-05-22\n---\nTreść akapitu.\n"
    fm, body = smoother.split_frontmatter(text)
    assert fm == "---\ntitle: 'X'\ndate: 2026-05-22\n---\n"
    assert body == "Treść akapitu.\n"


def test_split_frontmatter_no_frontmatter_returns_empty_and_full_text():
    text = "Bez frontmattera, sam tekst.\n"
    fm, body = smoother.split_frontmatter(text)
    assert fm == ""
    assert body == text


def test_split_then_reattach_is_lossless():
    text = "---\ntitle: 'X'\n---\nAkapit.\n"
    fm, body = smoother.split_frontmatter(text)
    assert fm + body == text
```

- [ ] **Step 3: Run test to verify it fails**

Run: `python3 -m pytest pipeline/widocznosc-blog-polish/tests/test_smoother.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'smoother'`

- [ ] **Step 4: Write minimal implementation**

Create `pipeline/widocznosc-blog-polish/scripts/smoother.py`:

```python
#!/usr/bin/env python3
"""widocznosc-blog-polish smoother – pełny rewrite prozy wpisu przez Gemini 3.1 Pro
(OpenRouter), z placeholder-protection i deterministycznym diff-guardem na faktach.

Frontmatter, kod, linki, shortcode'y i nagłówki NIE są wysyłane do modelu.
Jeśli model ruszy jakąkolwiek liczbę lub nazwę modelu w prozie -> plik odrzucony.

Usage:
    OPENROUTER_API_KEY="sk-or-..." python3 .../smoother.py PATH.md [--dry-run]
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
```

- [ ] **Step 5: Run test to verify it passes**

Run: `python3 -m pytest pipeline/widocznosc-blog-polish/tests/test_smoother.py -v`
Expected: PASS (3 passed)

- [ ] **Step 6: Commit**

```bash
git add pipeline/widocznosc-blog-polish/scripts/smoother.py pipeline/widocznosc-blog-polish/tests/conftest.py pipeline/widocznosc-blog-polish/tests/test_smoother.py
git commit -m "feat(blog-polish): smoother – split_frontmatter + scaffold"
```

---

### Task 2: `protect` / `restore` (placeholder-protection)

**Files:**
- Modify: `pipeline/widocznosc-blog-polish/scripts/smoother.py`
- Test: `pipeline/widocznosc-blog-polish/tests/test_smoother.py`

- [ ] **Step 1: Write the failing test**

Append to `test_smoother.py`:

```python
def test_protect_restore_roundtrip_is_identity():
    body = (
        "Zobacz [przewodnik](https://x.pl/a) oraz `kod inline`.\n\n"
        "## Nagłówek z liczbą 3.5\n\n"
        "```python\nx = 1\n```\n\n"
        "{{% youtube id=\"abc\" %}}\n\n"
        "Goły URL: https://y.pl/b koniec.\n"
    )
    protected, store = smoother.protect(body)
    assert smoother.restore(protected, store) == body


def test_protect_hides_frozen_constructs_from_model():
    body = "## Tytuł 4.7\n\nProza z [link](https://z.pl) i `code`.\n"
    protected, store = smoother.protect(body)
    # Nagłówek, cel linku, URL i kod nie mogą być widoczne jako goły tekst
    assert "## Tytuł 4.7" not in protected
    assert "https://z.pl" not in protected
    assert "`code`" not in protected
    # W store siedzą oryginały
    assert any(v == "## Tytuł 4.7" for v in store.values())


def test_protect_tokens_are_unique():
    body = "## A\n\n## B\n\nProza.\n"
    protected, store = smoother.protect(body)
    assert len(store) == len(set(store.keys()))
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m pytest pipeline/widocznosc-blog-polish/tests/test_smoother.py -k protect -v`
Expected: FAIL — `AttributeError: module 'smoother' has no attribute 'protect'`

- [ ] **Step 3: Write minimal implementation**

Add to `smoother.py` (kolejność wzorców jest istotna: bloki kodu i nagłówki przed inline, linki przed gołymi URL-ami):

```python
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python3 -m pytest pipeline/widocznosc-blog-polish/tests/test_smoother.py -k protect -v`
Expected: PASS (3 passed)

- [ ] **Step 5: Commit**

```bash
git add pipeline/widocznosc-blog-polish/scripts/smoother.py pipeline/widocznosc-blog-polish/tests/test_smoother.py
git commit -m "feat(blog-polish): protect/restore placeholder-protection"
```

---

### Task 3: `extract_facts` (liczby + nazwy modeli)

**Files:**
- Modify: `pipeline/widocznosc-blog-polish/scripts/smoother.py`
- Test: `pipeline/widocznosc-blog-polish/tests/test_smoother.py`

- [ ] **Step 1: Write the failing test**

Append to `test_smoother.py`:

```python
from collections import Counter


def test_extract_facts_collects_numbers_as_multiset():
    nums, _ = smoother.extract_facts("Cena $1,50 za 1M tokenów, wynik 87,6%.")
    assert nums == Counter(["1,50", "1", "87,6"])


def test_extract_facts_collects_model_mentions():
    _, models = smoother.extract_facts(
        "Porównujemy GPT-5.5, Gemini 3.5 oraz Claude Opus 4.7."
    )
    assert models == Counter(["GPT-5.5", "Gemini 3.5", "Claude Opus 4.7"])


def test_extract_facts_ignores_plain_prose():
    nums, models = smoother.extract_facts("To jest zwykłe zdanie bez danych.")
    assert nums == Counter()
    assert models == Counter()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m pytest pipeline/widocznosc-blog-polish/tests/test_smoother.py -k extract_facts -v`
Expected: FAIL — `AttributeError: module 'smoother' has no attribute 'extract_facts'`

- [ ] **Step 3: Write minimal implementation**

Add to `smoother.py` (na górze pliku dopisz `from collections import Counter`):

```python
NUMBER_RE = re.compile(r"\d[\d.,]*")
MODEL_MENTION_RE = re.compile(
    r"(?:GPT|Gemini|Claude|Grok|Llama|Mistral|DeepSeek|Qwen|Bard|Copilot)"
    r"[\w.\- ]*?\d[\d.]*"
)


def extract_facts(text: str) -> tuple[Counter, Counter]:
    """Multizbiory faktów do diff-guardu: (liczby, wzmianki o modelach)."""
    numbers = Counter(NUMBER_RE.findall(text))
    models = Counter(m.strip() for m in MODEL_MENTION_RE.findall(text))
    return numbers, models
```

Uwaga: `extract_facts` jest wołane na PROZIE z tokenami (po `protect`) — liczby w kodzie/nagłówkach/linkach są już tokenami, więc nie trafiają do multizbioru. To celowe: pilnujemy tylko liczb w prozie.

- [ ] **Step 4: Run test to verify it passes**

Run: `python3 -m pytest pipeline/widocznosc-blog-polish/tests/test_smoother.py -k extract_facts -v`
Expected: PASS (3 passed)

- [ ] **Step 5: Commit**

```bash
git add pipeline/widocznosc-blog-polish/scripts/smoother.py pipeline/widocznosc-blog-polish/tests/test_smoother.py
git commit -m "feat(blog-polish): extract_facts – liczby + nazwy modeli"
```

---

### Task 4: `diff_guard` (integralność tokenów + multizbiory faktów)

**Files:**
- Modify: `pipeline/widocznosc-blog-polish/scripts/smoother.py`
- Test: `pipeline/widocznosc-blog-polish/tests/test_smoother.py`

- [ ] **Step 1: Write the failing test**

Append to `test_smoother.py`:

```python
def test_diff_guard_passes_when_only_prose_changed():
    before = "Model §HEADING_0§ kosztuje 1,50 za 1M. GPT-5.5 jest szybki."
    after = "Model §HEADING_0§ kosztuje 1,50 za 1M. GPT-5.5 działa błyskawicznie."
    store = {"§HEADING_0§": "## X"}
    assert smoother.diff_guard(before, after, store) == []


def test_diff_guard_rejects_changed_number():
    before = "Okno 65k tokenów."
    after = "Okno 8k tokenów."
    assert smoother.diff_guard(before, after, {}) != []


def test_diff_guard_rejects_changed_model_version():
    before = "To Gemini 3.5."
    after = "To Gemini 1.5."
    assert smoother.diff_guard(before, after, {}) != []


def test_diff_guard_rejects_lost_placeholder_token():
    before = "Sekcja §HEADING_0§ i proza."
    after = "Sekcja i proza."  # token zniknął
    store = {"§HEADING_0§": "## Tytuł"}
    viol = smoother.diff_guard(before, after, store)
    assert any("token" in v.lower() for v in viol)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m pytest pipeline/widocznosc-blog-polish/tests/test_smoother.py -k diff_guard -v`
Expected: FAIL — `AttributeError: module 'smoother' has no attribute 'diff_guard'`

- [ ] **Step 3: Write minimal implementation**

Add to `smoother.py`:

```python
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python3 -m pytest pipeline/widocznosc-blog-polish/tests/test_smoother.py -k diff_guard -v`
Expected: PASS (4 passed)

- [ ] **Step 5: Commit**

```bash
git add pipeline/widocznosc-blog-polish/scripts/smoother.py pipeline/widocznosc-blog-polish/tests/test_smoother.py
git commit -m "feat(blog-polish): diff_guard – integralność tokenów + multizbiory faktów"
```

---

### Task 5: `clean_model_output` (zdejmij fence/preambułę)

**Files:**
- Modify: `pipeline/widocznosc-blog-polish/scripts/smoother.py`
- Test: `pipeline/widocznosc-blog-polish/tests/test_smoother.py`

- [ ] **Step 1: Write the failing test**

Append to `test_smoother.py`:

```python
def test_clean_model_output_strips_markdown_fence():
    raw = "```markdown\nTreść wygładzona.\n```"
    assert smoother.clean_model_output(raw) == "Treść wygładzona."


def test_clean_model_output_passes_clean_text():
    assert smoother.clean_model_output("Czysta treść.") == "Czysta treść."
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m pytest pipeline/widocznosc-blog-polish/tests/test_smoother.py -k clean_model_output -v`
Expected: FAIL — `AttributeError: module 'smoother' has no attribute 'clean_model_output'`

- [ ] **Step 3: Write minimal implementation**

Add to `smoother.py`:

```python
def clean_model_output(text: str) -> str:
    """Zdejmuje opakowanie ```fence``` i białe znaki brzegowe."""
    t = text.strip()
    if t.startswith("```"):
        t = re.sub(r"^```(?:\w+)?\s*", "", t)
        t = re.sub(r"\s*```$", "", t)
    return t.strip()
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python3 -m pytest pipeline/widocznosc-blog-polish/tests/test_smoother.py -k clean_model_output -v`
Expected: PASS (2 passed)

- [ ] **Step 5: Commit**

```bash
git add pipeline/widocznosc-blog-polish/scripts/smoother.py pipeline/widocznosc-blog-polish/tests/test_smoother.py
git commit -m "feat(blog-polish): clean_model_output"
```

---

### Task 6: `call_openrouter` (prompt + wywołanie, w testach mockowane)

**Files:**
- Modify: `pipeline/widocznosc-blog-polish/scripts/smoother.py`
- Test: `pipeline/widocznosc-blog-polish/tests/test_smoother.py`

- [ ] **Step 1: Write the failing test**

Append to `test_smoother.py`:

```python
def test_build_payload_uses_gemini_and_low_temperature():
    payload = smoother.build_payload("Proza §HEADING_0§.", rules="REGUŁY")
    assert payload["model"] == "google/gemini-3.1-pro-preview"
    assert payload["temperature"] <= 0.4
    msgs = payload["messages"]
    assert msgs[0]["role"] == "system"
    assert "NIE zmieniaj" in msgs[0]["content"]  # twarde zakazy w systemce
    assert "Proza §HEADING_0§." in msgs[1]["content"]
    assert "REGUŁY" in msgs[1]["content"]
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m pytest pipeline/widocznosc-blog-polish/tests/test_smoother.py -k build_payload -v`
Expected: FAIL — `AttributeError: module 'smoother' has no attribute 'build_payload'`

- [ ] **Step 3: Write minimal implementation**

Add to `smoother.py` (na górze dopisz `import json`, `import os`, `import urllib.request`, `import urllib.error`):

```python
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python3 -m pytest pipeline/widocznosc-blog-polish/tests/test_smoother.py -k build_payload -v`
Expected: PASS (1 passed)

- [ ] **Step 5: Commit**

```bash
git add pipeline/widocznosc-blog-polish/scripts/smoother.py pipeline/widocznosc-blog-polish/tests/test_smoother.py
git commit -m "feat(blog-polish): build_payload + call_openrouter (Gemini 3.1 Pro)"
```

---

### Task 7: `process_text` (pełny potok jednego pliku, model wstrzykiwany)

**Files:**
- Modify: `pipeline/widocznosc-blog-polish/scripts/smoother.py`
- Test: `pipeline/widocznosc-blog-polish/tests/test_smoother.py`

`process_text` przyjmuje `call_fn` (funkcję wołającą model), żeby test mógł ją podmienić bez sieci.

- [ ] **Step 1: Write the failing test**

Append to `test_smoother.py`:

```python
RULES = ""


def test_process_text_smoothes_body_and_keeps_frontmatter():
    text = "---\ntitle: 'X'\n---\nTen tekst jest dedykowany dla 65k tokenów.\n"

    def fake_call(protected_body, rules):
        # model wygładza prozę, zostawia tokeny i liczby
        return protected_body.replace("dedykowany dla", "przeznaczony dla")

    out = smoother.process_text(text, RULES, fake_call)
    assert out["status"] == "smoothed"
    assert out["text"].startswith("---\ntitle: 'X'\n---\n")
    assert "przeznaczony dla 65k tokenów" in out["text"]


def test_process_text_rejects_when_model_changes_number():
    text = "---\ntitle: 'X'\n---\nOkno 65k tokenów.\n"

    def bad_call(protected_body, rules):
        return protected_body.replace("65k", "8k")

    out = smoother.process_text(text, RULES, bad_call)
    assert out["status"] == "rejected"
    assert "liczby" in out["detail"]
    assert out["text"] == text  # oryginał nietknięty


def test_process_text_unchanged_when_model_returns_same():
    text = "---\ntitle: 'X'\n---\nProza bez zmian.\n"
    out = smoother.process_text(text, RULES, lambda b, r: b)
    assert out["status"] == "unchanged"


def test_process_text_error_when_call_raises():
    text = "---\ntitle: 'X'\n---\nProza.\n"

    def boom(b, r):
        raise RuntimeError("timeout")

    out = smoother.process_text(text, RULES, boom)
    assert out["status"] == "error"
    assert out["text"] == text
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m pytest pipeline/widocznosc-blog-polish/tests/test_smoother.py -k process_text -v`
Expected: FAIL — `AttributeError: module 'smoother' has no attribute 'process_text'`

- [ ] **Step 3: Write minimal implementation**

Add to `smoother.py`:

```python
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
    violations = diff_guard(protected, cleaned, store)
    if violations:
        return {"status": "rejected", "text": text, "detail": "; ".join(violations)}
    new_body = restore(cleaned, store)
    new_text = fm + new_body
    if new_text == text:
        return {"status": "unchanged", "text": text, "detail": ""}
    return {"status": "smoothed", "text": new_text, "detail": ""}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python3 -m pytest pipeline/widocznosc-blog-polish/tests/test_smoother.py -k process_text -v`
Expected: PASS (4 passed)

- [ ] **Step 5: Commit**

```bash
git add pipeline/widocznosc-blog-polish/scripts/smoother.py pipeline/widocznosc-blog-polish/tests/test_smoother.py
git commit -m "feat(blog-polish): process_text – pełny potok z diff-guardem"
```

---

### Task 8: `main()` CLI (`--dry-run`, JSON na stdout, ładowanie reguł)

**Files:**
- Modify: `pipeline/widocznosc-blog-polish/scripts/smoother.py`
- Test: `pipeline/widocznosc-blog-polish/tests/test_smoother.py`

- [ ] **Step 1: Write the failing test (subprocess, dry-run, bez sieci)**

Append to `test_smoother.py`:

```python
import json
import os
import subprocess
import sys

SCRIPT = os.path.join(os.path.dirname(__file__), "..", "scripts", "smoother.py")


def test_cli_errors_without_api_key(tmp_path):
    f = tmp_path / "a.md"
    f.write_text("---\ntitle: 'X'\n---\nProza.\n", encoding="utf-8")
    env = {k: v for k, v in os.environ.items() if k != "OPENROUTER_API_KEY"}
    r = subprocess.run([sys.executable, SCRIPT, str(f)],
                       capture_output=True, text=True, env=env)
    assert r.returncode == 1
    assert "OPENROUTER_API_KEY" in r.stderr


def test_cli_missing_file_returns_error(tmp_path):
    env = {**os.environ, "OPENROUTER_API_KEY": "x"}
    r = subprocess.run([sys.executable, SCRIPT, str(tmp_path / "nope.md")],
                       capture_output=True, text=True, env=env)
    assert r.returncode == 1
    assert "nie znaleziono" in r.stderr.lower()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m pytest pipeline/widocznosc-blog-polish/tests/test_smoother.py -k cli -v`
Expected: FAIL — skrypt nie ma jeszcze `main()` / guardów (returncode 0 lub traceback)

- [ ] **Step 3: Write minimal implementation**

Add to `smoother.py` (na górze dopisz `import argparse`, `import sys`):

```python
import os.path

RULES_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "portals", "widocznosc.ai", "docs", "writing-rules.md",
)


def load_rules() -> str:
    if not os.path.exists(RULES_PATH):
        return ""
    with open(RULES_PATH, "r", encoding="utf-8") as f:
        return f.read()


def main() -> int:
    p = argparse.ArgumentParser(description="widocznosc-blog-polish smoother")
    p.add_argument("path", help="Ścieżka do wpisu .md")
    p.add_argument("--dry-run", action="store_true",
                   help="Nie zapisuje pliku, tylko raportuje wynik")
    args = p.parse_args()

    api_key = os.environ.get("OPENROUTER_API_KEY", "").strip()
    if not api_key:
        print("ERROR: ustaw OPENROUTER_API_KEY", file=sys.stderr)
        return 1
    if not os.path.exists(args.path):
        print(f"ERROR: pliku nie znaleziono: {args.path}", file=sys.stderr)
        return 1

    with open(args.path, "r", encoding="utf-8") as f:
        text = f.read()
    rules = load_rules()

    result = process_text(text, rules, lambda b, r: call_openrouter(b, r, api_key))

    if result["status"] == "smoothed" and not args.dry_run:
        with open(args.path, "w", encoding="utf-8") as f:
            f.write(result["text"])

    print(json.dumps({"file": args.path, "status": result["status"],
                      "detail": result["detail"]}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python3 -m pytest pipeline/widocznosc-blog-polish/tests/test_smoother.py -v`
Expected: PASS (cały plik zielony)

- [ ] **Step 5: Commit**

```bash
git add pipeline/widocznosc-blog-polish/scripts/smoother.py pipeline/widocznosc-blog-polish/tests/test_smoother.py
git commit -m "feat(blog-polish): main() CLI – dry-run, JSON status, ładowanie reguł"
```

---

### Task 9: `state.py` (manifest idempotencji)

**Files:**
- Create: `pipeline/widocznosc-blog-polish/scripts/state.py`
- Test: `pipeline/widocznosc-blog-polish/tests/test_state.py`

- [ ] **Step 1: Write the failing test**

Create `pipeline/widocznosc-blog-polish/tests/test_state.py`:

```python
import state


def test_content_hash_stable_and_sensitive():
    assert state.content_hash("abc") == state.content_hash("abc")
    assert state.content_hash("abc") != state.content_hash("abd")


def test_should_skip_true_when_hash_matches_done(tmp_path):
    st = {"a.md": {"hash": state.content_hash("treść"), "status": "smoothed"}}
    assert state.should_skip(st, "a.md", "treść") is True


def test_should_skip_false_when_content_changed():
    st = {"a.md": {"hash": state.content_hash("stare"), "status": "smoothed"}}
    assert state.should_skip(st, "a.md", "nowe") is False


def test_should_skip_false_when_not_in_state():
    assert state.should_skip({}, "a.md", "treść") is False


def test_load_save_roundtrip(tmp_path):
    path = tmp_path / "manifest.json"
    st = {"a.md": {"hash": "h", "status": "smoothed"}}
    state.save_state(str(path), st)
    assert state.load_state(str(path)) == st


def test_load_missing_returns_empty(tmp_path):
    assert state.load_state(str(tmp_path / "nope.json")) == {}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m pytest pipeline/widocznosc-blog-polish/tests/test_state.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'state'`

- [ ] **Step 3: Write minimal implementation**

Create `pipeline/widocznosc-blog-polish/scripts/state.py`:

```python
#!/usr/bin/env python3
"""Manifest idempotencji dla widocznosc-blog-polish."""
from __future__ import annotations
import hashlib
import json
import os


def content_hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def load_state(path: str) -> dict:
    if not os.path.exists(path):
        return {}
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_state(path: str, st: dict) -> None:
    with open(path, "w", encoding="utf-8") as f:
        json.dump(st, f, ensure_ascii=False, indent=2)


def should_skip(st: dict, file: str, text: str) -> bool:
    """Pomiń, jeśli plik jest w manifeście i jego treść się nie zmieniła."""
    entry = st.get(file)
    return bool(entry) and entry.get("hash") == content_hash(text)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python3 -m pytest pipeline/widocznosc-blog-polish/tests/test_state.py -v`
Expected: PASS (6 passed)

- [ ] **Step 5: Commit**

```bash
git add pipeline/widocznosc-blog-polish/scripts/state.py pipeline/widocznosc-blog-polish/tests/test_state.py
git commit -m "feat(blog-polish): state.py – manifest idempotencji"
```

---

### Task 10: `.gitignore` – manifest runtime

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Dopisz wpis manifestu**

Dodaj na końcu `.gitignore`:

```
# widocznosc-blog-polish – manifest przejazdu (runtime, nie wersjonujemy)
pipeline/.widocznosc-blog-polish-state.json
```

- [ ] **Step 2: Zweryfikuj, że git ignoruje plik**

Run:
```bash
echo '{}' > pipeline/.widocznosc-blog-polish-state.json
git check-ignore pipeline/.widocznosc-blog-polish-state.json && rm pipeline/.widocznosc-blog-polish-state.json
```
Expected: wypisze ścieżkę (czyli jest ignorowana), plik usunięty.

- [ ] **Step 3: Commit**

```bash
git add .gitignore
git commit -m "chore(blog-polish): gitignore manifestu przejazdu"
```

---

### Task 11: `SKILL.md` – orkiestrator

**Files:**
- Create: `pipeline/widocznosc-blog-polish/SKILL.md`

- [ ] **Step 1: Napisz SKILL.md**

Create `pipeline/widocznosc-blog-polish/SKILL.md`:

````markdown
---
name: widocznosc-blog-polish
description: >
  Przejazd po wpisach bloga widocznosc.ai przez dwa silniki: wygładzanie polszczyzny
  (Gemini 3.1 Pro / OpenRouter, fakty zamrożone diff-guardem) oraz fact-check
  (skill web-fact-checker). Pracuje paczkami per kategoria, commituje wygładzanie
  i fakty osobno, jest idempotentny (manifest). Triggery PL: "wygładź blog",
  "przejedź blog polszczyzną", "polish blog widocznosc", "wygładź wpisy".
  Scope: katalog kategorii lub pojedyncze pliki w portals/widocznosc.ai/src/content/blog/.
---

# widocznosc-blog-polish – orkiestracja

## 1. Kiedy używać

Masowy przegląd jakości językowej + aktualności faktów opublikowanych wpisów bloga
widocznosc.ai. NIE dla newsów (inny frontmatter i reguły).

## 2. Routing kluczy

- Wygładzanie (Gemini 3.1 Pro) → `OPENROUTER_API_KEY`, OpenRouter.
- Fact-check Silnik B (GPT-5.5) → `OPENAI_API_KEY`, bezpośrednio OpenAI (patrz web-fact-checker).
- Klucze WYŁĄCZNIE przez env przy wywołaniu skryptu. Nigdy do pliku/payloadu.
- `OPENROUTER_API_KEY` w `api-credentials.md` bywa nieaktualny → poproś usera o świeży.

## 3. Kolejność paczek (per kategoria, od najmniejszej)

`prompty` (1) → `agenci-ai` (2) → `rag` (4) → `modele-llm` (11) → `ai-w-biznesie` (12) → `geo` (16).
Katalogi: `portals/widocznosc.ai/src/content/blog/<kategoria>/`.

## 4. Pre-flight

1. Sprawdź obecność `OPENROUTER_API_KEY` i `OPENAI_API_KEY` (ostrzeż, jeśli brak OpenAI – fact-check pójdzie single-engine).
2. Wylicz listę plików paczki (pomiń `_index.md` i stuby < ~500 znaków body).
3. Wczytaj manifest `pipeline/.widocznosc-blog-polish-state.json`; pomiń pliki, których treść się nie zmieniła (`state.should_skip`).
4. Pokaż plan (pliki, liczba, szacowany koszt) i czekaj na potwierdzenie usera, jeśli > 10 plików.

## 5. Pass 1 – wygładzanie (per kategoria)

Dla każdego pliku paczki:

```bash
OPENROUTER_API_KEY="$OPENROUTER_API_KEY" \
python3 pipeline/widocznosc-blog-polish/scripts/smoother.py <ścieżka.md>
```

Odczytaj JSON ze stdout (`status`: smoothed/unchanged/rejected/error).
- `smoothed` → plik nadpisany, wejdzie do commita paczki.
- `rejected`/`error` → oryginał nietknięty; dopisz do listy **needs-manual** z polem `detail`.
- Po każdym pliku zaktualizuj manifest (`state`).

Po przejściu paczki:
1. Pokaż `git diff --stat <ścieżki paczki>`.
2. Commit TYLKO wygładzonych plików (dodawaj konkretne ścieżki, NIE `git add -A` – worktree bywa dzielony z sesją Codex):

```bash
git add portals/widocznosc.ai/src/content/blog/<kategoria>/<smoothed-1>.md ...
git commit -m "content(widocznosc): wygładzenie polszczyzny – <kategoria> (N wpisów)"
```

## 6. Pass 2 – fact-check (per kategoria, po wygładzeniu)

Dla plików paczki uruchom **skill `web-fact-checker`** (jego flow: Read → ekstrakcja twierdzeń → WebSearch → `scripts/web_verify.py` → decyzje). Zastosuj jego reguły bezpieczeństwa bez zmian:
- `apply` tylko przy pełnej zgodzie A+B + źródło,
- reszta → flaga do raportu,
- bez auto-commitu w samym fact-checku.

Po fact-checku paczki, jeśli były `apply`:

```bash
git add <ścieżki z poprawkami faktów>
git commit -m "fix(widocznosc): fakty po fact-check – <kategoria>"
```

(Osobny commit niż wygładzanie – żeby dało się cofnąć jeden wymiar bez drugiego.)

## 7. Raport

Dopisz do `portals/widocznosc.ai/podstrony-review/blog-polish-factcheck-2026-06-03.md`:
- tabela wygładzania: plik | status | detail,
- lista needs-manual (odrzuty diff-guard + błędy),
- raport faktów per plik (format `web_verify.format_report`): poprawione (ze źródłami) + flagi.

## 8. Czego skill NIE robi

- Nie rusza newsów ani buildu Astro.
- Nie commituje `git add -A`.
- Nie nanosi faktów inaczej niż przez logikę `reconcile()` web-fact-checkera.
- Nie wygładza nagłówków, kodu, linków, shortcode'ów (są zamrożone w smootherze).
````

- [ ] **Step 2: Commit**

```bash
git add pipeline/widocznosc-blog-polish/SKILL.md
git commit -m "feat(blog-polish): SKILL.md orkiestrator"
```

---

### Task 12: `README.md` + pilot dry-run (weryfikacja na żywym wpisie)

**Files:**
- Create: `pipeline/widocznosc-blog-polish/README.md`

- [ ] **Step 1: Napisz README.md**

Create `pipeline/widocznosc-blog-polish/README.md`:

```markdown
# widocznosc-blog-polish

Wygładzanie polszczyzny + fact-check wpisów bloga widocznosc.ai. Szczegóły flow: `SKILL.md`.

## Smoother (pojedynczy plik)

```bash
OPENROUTER_API_KEY="sk-or-..." \
python3 pipeline/widocznosc-blog-polish/scripts/smoother.py \
  portals/widocznosc.ai/src/content/blog/prompty/przewodnik.md --dry-run
```

Wyjście: JSON `{file, status, detail}`. `status`:
- `smoothed` – wygładzono (bez `--dry-run` plik nadpisany),
- `unchanged` – model nie wprowadził zmian,
- `rejected` – diff-guard wykrył zmianę faktu/tokenu (oryginał nietknięty), powód w `detail`,
- `error` – błąd wywołania modelu (oryginał nietknięty).

## Gwarancje (diff-guard)

Frontmatter, kod, linki, shortcode'y i nagłówki są zamrażane (placeholder) – model ich nie widzi.
Liczby i nazwy modeli w prozie są porównywane przed/po; każda zmiana → `rejected`.

## Testy

```bash
python3 -m pytest pipeline/widocznosc-blog-polish/tests/ -v
```
```

- [ ] **Step 2: Uruchom cały zestaw testów**

Run: `python3 -m pytest pipeline/widocznosc-blog-polish/tests/ -v`
Expected: PASS (wszystkie testy z Tasków 1–9 zielone)

- [ ] **Step 3: Pilot dry-run na 1 pliku (wymaga świeżego OPENROUTER_API_KEY od usera)**

Run:
```bash
OPENROUTER_API_KEY="<świeży klucz>" \
python3 pipeline/widocznosc-blog-polish/scripts/smoother.py \
  portals/widocznosc.ai/src/content/blog/prompty/przewodnik.md --dry-run
```
Expected: JSON ze `status` = `smoothed` lub `unchanged` (NIE `rejected`/`error`).
Jeśli `rejected` → przeczytaj `detail`, oceń, czy diff-guard nie jest zbyt czuły (np. fałszywy alarm na nietypowej liczbie) i dostrój regex w `smoother.py` (osobny commit).

- [ ] **Step 4: Commit README**

```bash
git add pipeline/widocznosc-blog-polish/README.md
git commit -m "docs(blog-polish): README + instrukcja uruchomienia"
```

- [ ] **Step 5: STOP – decyzja usera przed pełnym przejazdem**

Po zielonym pilocie NIE odpalaj automatycznie wszystkich 46 wpisów. Pokaż userowi wynik pilota i zapytaj, od której kategorii zaczynamy realny przejazd (Pass 1 + 2 wg `SKILL.md`).

---

## Self-Review (wykonane przy pisaniu planu)

**Pokrycie speca:**
- Komponent A (smoother): split_frontmatter (T1), protect/restore (T2), extract_facts (T3), diff_guard (T4), clean_output (T5), call_openrouter (T6), process_text (T7), main/CLI (T8). ✅
- Komponent B (orkiestrator skill): SKILL.md (T11) – pre-flight, paczki per kategoria, Pass 1 commit, Pass 2 fact-check osobny commit, raport, higiena `git add`. ✅
- Routing kluczy: SKILL.md §2 + README. ✅
- Idempotencja/manifest: state.py (T9) + gitignore (T10) + użycie w SKILL.md §4–5. ✅
- Auto-apply faktów A+B: delegacja do web-fact-checkera (SKILL.md §6). ✅
- Testy: T1–T9 TDD + pilot T12. ✅
- Obsługa błędów: process_text error/rejected (T7), degradacja single-engine (SKILL.md §4/§6). ✅

**Placeholdery:** brak TBD/TODO; każdy krok ma kod lub dokładną komendę.

**Spójność typów/nazw:** `split_frontmatter`, `protect`, `restore`, `extract_facts`, `diff_guard`, `clean_model_output`, `build_payload`, `call_openrouter`, `process_text`, `load_rules`, `main` (smoother); `content_hash`, `load_state`, `save_state`, `should_skip` (state). `process_text` zwraca `{status, text, detail}` – używane spójnie w T7 i T8. `diff_guard(before, after, store)` – sygnatura zgodna w T4 i T7.
