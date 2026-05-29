# Web Fact-Checker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Powtarzalny skill, który weryfikuje w sieci nietrwałe fakty (nazwy modeli, ceny, benchmarki, okna kontekstowe, daty) w treściach widocznosc.ai dwoma niezależnymi silnikami (WebSearch + GPT-5.5 z `web_search`), nanosi poprawki i pokazuje diff.

**Architecture:** Ekstrakcja twierdzeń (Claude) → weryfikacja A (Claude+WebSearch) i B (GPT-5.5+web_search) → **deterministyczny `reconcile()`** (Python, testowany) → auto-apply (Claude/Edit) + raport + git diff. Logika krytyczna dla poprawności (reconcile, parsowanie odpowiedzi, budowa requestu, format raportu) żyje w testowanym skrypcie `web_verify.py`; SKILL.md orkiestruje część będącą osądem LLM.

**Tech Stack:** Python 3 (stdlib + pytest), OpenAI Responses API (`gpt-5.5`, tool `web_search`), Markdown (SKILL.md + slash command). Wbudowany WebSearch po stronie Claude.

**Spec:** `docs/superpowers/specs/2026-05-29-web-fact-checker-design.md`

---

## File Structure

- `pipeline/web-fact-checker/SKILL.md` – orkiestracja (taksonomia, reguły bezpieczeństwa, prompty A/B, flow single+batch, format raportu). Wykonywany przez Claude.
- `pipeline/web-fact-checker/scripts/web_verify.py` – czyste funkcje: `normalize_value`, `reconcile`, `build_gpt5_request`, `parse_gpt5_response`, `format_report` + `main()` (wywołanie sieciowe GPT-5.5).
- `pipeline/web-fact-checker/tests/test_web_verify.py` – pytest dla czystych funkcji.
- `pipeline/web-fact-checker/tests/fixtures/gpt5_response_sample.json` – przykładowa odpowiedź Responses API do testu parsera.
- `.claude/commands/web-fact-check.md` – slash command → wskazuje SKILL.md, przekazuje `$ARGUMENTS`.

**Data model (wspólny kontrakt JSON, używany przez wszystkie funkcje):**

```python
# Claim – wyekstrahowane twierdzenie nietrwałe
{
  "id": "chatgpt.md:98",        # f"{basename}:{line}"
  "file": "src/content/blog/modele-llm/chatgpt.md",
  "line": 98,
  "type": "price",              # model_name|price|benchmark|context_window|date|plan|status|other
  "quote": "GPT-4o (z limitem)",# dokładny fragment z artykułu
  "current_value": "GPT-4o",    # co artykuł twierdzi
  "historical_suspect": False    # czy ekstrakcja podejrzewa kontekst historyczny
}

# Verdict (A lub B) – ocena jednego twierdzenia przez jeden silnik
{
  "claim_id": "chatgpt.md:98",
  "status": "stale",            # current|stale|wrong|ambiguous
  "correct_value": "GPT-5.5",   # None jeśli current/ambiguous
  "source_url": "https://openai.com/pricing",  # None jeśli brak
  "as_of": "2026-05",           # data źródła, None jeśli brak
  "classification": "current"    # current|historical – jak silnik czyta rolę twierdzenia
}

# Decision – wynik reconcile()
{
  "claim_id": "chatgpt.md:98",
  "action": "apply",            # apply|flag|leave
  "value": "GPT-5.5",           # None gdy leave/flag-bez-wartości
  "reason": "A i B zgodne: stale -> GPT-5.5",
  "sources": ["https://openai.com/pricing"]
}
```

---

## Task 1: Scaffold + środowisko + źródło klucza OpenAI

**Files:**
- Create: `pipeline/web-fact-checker/scripts/web_verify.py` (pusty szkielet)
- Create: `pipeline/web-fact-checker/tests/test_web_verify.py` (pusty)
- Create: `pipeline/web-fact-checker/README.md`

- [ ] **Step 1: Utwórz strukturę katalogów i venv**

```bash
mkdir -p pipeline/web-fact-checker/scripts pipeline/web-fact-checker/tests/fixtures
cd pipeline/web-fact-checker
python3 -m venv .venv
.venv/bin/pip install -q pytest
```

- [ ] **Step 2: Ustal źródło klucza OpenAI (NIE hardkoduj)**

Sprawdź kolejno i wybierz pierwszy działający:
```bash
grep -rl 'OPENAI_API_KEY\|sk-' ~/.claude/projects/-home-sibilian-projekty-icea-transformacja-zaplecza-seo/memory/ 2>/dev/null
cat pipeline/content-writer/references/api-credentials.md 2>/dev/null | grep -i openai
echo "${OPENAI_API_KEY:+env OPENAI_API_KEY ustawiony}"
```
Zapisz w `README.md` ustalone źródło (ścieżka pliku pamięci LUB env var). Klucz ładowany do env w runtime, **nigdy** do pliku commitowanego. Jeśli żadne źródło nie istnieje → udokumentuj w README, że silnik B wymaga ustawienia `OPENAI_API_KEY` i skill degraduje do single-engine.

- [ ] **Step 3: Szkielet web_verify.py**

```python
"""Web Fact-Checker – czyste funkcje weryfikacji + wywołanie GPT-5.5 (Responses API)."""
from __future__ import annotations
import json
import os
import re
import sys
import urllib.request

GPT_MODEL = "gpt-5.5"
```

- [ ] **Step 4: Commit**

```bash
cd /home/sibilian/projekty/icea/transformacja-zaplecza-seo
echo "pipeline/web-fact-checker/.venv/" >> .gitignore
git add pipeline/web-fact-checker/scripts/web_verify.py pipeline/web-fact-checker/tests/test_web_verify.py pipeline/web-fact-checker/README.md .gitignore
git commit -m "feat(web-fact-checker): scaffold skilla + środowisko"
```

---

## Task 2: `normalize_value()` – normalizacja do porównań

**Files:**
- Modify: `pipeline/web-fact-checker/scripts/web_verify.py`
- Test: `pipeline/web-fact-checker/tests/test_web_verify.py`

- [ ] **Step 1: Write the failing test**

```python
from scripts.web_verify import normalize_value

def test_normalize_strips_currency_percent_and_case():
    assert normalize_value("$5/$25") == "5/25"
    assert normalize_value("88,6%") == "88.6"
    assert normalize_value("GPT-5.5") == "gpt-5.5"
    assert normalize_value("  1 mln tokenów ") == "1mlntokenow"
    assert normalize_value(None) == ""
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd pipeline/web-fact-checker && .venv/bin/pytest tests/test_web_verify.py::test_normalize_strips_currency_percent_and_case -v`
Expected: FAIL z `ImportError`/`AttributeError` (funkcja nie istnieje).

- [ ] **Step 3: Write minimal implementation**

```python
def normalize_value(value: str | None) -> str:
    """Sprowadza wartość do porównywalnej formy: lower, bez walut/%/spacji/diakrytyków."""
    if not value:
        return ""
    s = value.strip().lower()
    s = s.replace(",", ".")           # 88,6 -> 88.6
    diac = str.maketrans("ąćęłńóśźż", "acelnoszz")
    s = s.translate(diac)
    s = re.sub(r"[\s$%]", "", s)       # usuń spacje, $, %
    return s
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd pipeline/web-fact-checker && .venv/bin/pytest tests/test_web_verify.py::test_normalize_strips_currency_percent_and_case -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add pipeline/web-fact-checker/scripts/web_verify.py pipeline/web-fact-checker/tests/test_web_verify.py
git commit -m "feat(web-fact-checker): normalize_value + test"
```

---

## Task 3: `reconcile()` – deterministyczny merge werdyktów A/B (rdzeń bezpieczeństwa)

**Files:**
- Modify: `pipeline/web-fact-checker/scripts/web_verify.py`
- Test: `pipeline/web-fact-checker/tests/test_web_verify.py`

- [ ] **Step 1: Write the failing tests (tabela decyzji ze specu)**

```python
from scripts.web_verify import reconcile

def _a(status, val=None, cls="current", url="https://x", as_of="2026-05"):
    return {"claim_id": "f.md:1", "status": status, "correct_value": val,
            "source_url": url, "as_of": as_of, "classification": cls}

def test_both_current_leave():
    d = reconcile(_a("current"), _a("current"))
    assert d["action"] == "leave"

def test_both_stale_same_value_apply():
    d = reconcile(_a("stale", "GPT-5.5"), _a("stale", "GPT-5.5"))
    assert d["action"] == "apply"
    assert d["value"] == "GPT-5.5"
    assert "https://x" in d["sources"]

def test_both_stale_different_value_flag():
    d = reconcile(_a("stale", "GPT-5.5"), _a("stale", "GPT-5.4"))
    assert d["action"] == "flag"

def test_classification_dispute_flag():
    d = reconcile(_a("current", cls="current"), _a("stale", "X", cls="historical"))
    assert d["action"] == "flag"
    assert "klasyfikacj" in d["reason"].lower()

def test_one_current_one_stale_flag():
    d = reconcile(_a("current"), _a("stale", "X"))
    assert d["action"] == "flag"

def test_ambiguous_flag():
    d = reconcile(_a("ambiguous"), _a("stale", "X"))
    assert d["action"] == "flag"

def test_single_engine_apply_when_a_solid():
    d = reconcile(_a("stale", "GPT-5.5", url="https://x"), None)
    assert d["action"] == "apply"
    assert "single-engine" in d["reason"]

def test_single_engine_flag_when_no_source():
    d = reconcile(_a("stale", "GPT-5.5", url=None), None)
    assert d["action"] == "flag"

def test_apply_requires_both_classification_current():
    # oba stale, ta sama wartość, ale B czyta jako historyczne -> nie apply
    d = reconcile(_a("stale", "X", cls="current"), _a("stale", "X", cls="historical"))
    assert d["action"] == "flag"
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd pipeline/web-fact-checker && .venv/bin/pytest tests/test_web_verify.py -k reconcile -v` (oraz testy nazwane wyżej)
Expected: FAIL (`reconcile` nie istnieje).

- [ ] **Step 3: Write minimal implementation**

```python
def _decision(claim_id, action, value, reason, sources):
    return {"claim_id": claim_id, "action": action, "value": value,
            "reason": reason, "sources": [s for s in sources if s]}

def reconcile(a: dict, b: dict | None) -> dict:
    """Łączy werdykt A (WebSearch) i B (GPT-5.5). Apply tylko przy pełnej zgodzie."""
    cid = a["claim_id"]

    # --- single-engine (B niedostępny) ---
    if b is None:
        if a["status"] in ("stale", "wrong") and a.get("correct_value") \
           and a.get("source_url") and a.get("classification") == "current":
            return _decision(cid, "apply", a["correct_value"],
                             f"single-engine: {a['status']} -> {a['correct_value']}",
                             [a.get("source_url")])
        if a["status"] == "current":
            return _decision(cid, "leave", None, "single-engine: aktualne", [])
        return _decision(cid, "flag", None,
                         "single-engine: brak twardego źródła lub niejednoznaczne", [a.get("source_url")])

    # --- oba silniki ---
    if a["status"] == "current" and b["status"] == "current":
        return _decision(cid, "leave", None, "A i B: aktualne", [])

    if a.get("classification") != b.get("classification"):
        return _decision(cid, "flag", None,
                         "rozbieżna klasyfikacja historyczne/aktualne", [a.get("source_url"), b.get("source_url")])

    if "ambiguous" in (a["status"], b["status"]):
        return _decision(cid, "flag", None, "co najmniej jeden silnik: niejednoznaczne",
                         [a.get("source_url"), b.get("source_url")])

    a_bad = a["status"] in ("stale", "wrong")
    b_bad = b["status"] in ("stale", "wrong")
    if a_bad and b_bad:
        if normalize_value(a.get("correct_value")) == normalize_value(b.get("correct_value")) \
           and a.get("correct_value") \
           and a.get("classification") == "current" and b.get("classification") == "current":
            return _decision(cid, "apply", a["correct_value"],
                             f"A i B zgodne: {a['status']} -> {a['correct_value']}",
                             [a.get("source_url"), b.get("source_url")])
        return _decision(cid, "flag", None, "A i B: różne wartości poprawne",
                         [a.get("source_url"), b.get("source_url")])

    # jeden current, drugi stale/wrong
    return _decision(cid, "flag", None, "A i B: rozbieżny status (current vs stale)",
                     [a.get("source_url"), b.get("source_url")])
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd pipeline/web-fact-checker && .venv/bin/pytest tests/test_web_verify.py -v`
Expected: PASS (wszystkie testy reconcile + normalize).

- [ ] **Step 5: Commit**

```bash
git add pipeline/web-fact-checker/scripts/web_verify.py pipeline/web-fact-checker/tests/test_web_verify.py
git commit -m "feat(web-fact-checker): reconcile() z tabelą decyzji + testy"
```

---

## Task 4: `build_gpt5_request()` – payload Responses API z web_search

**Files:**
- Modify: `pipeline/web-fact-checker/scripts/web_verify.py`
- Test: `pipeline/web-fact-checker/tests/test_web_verify.py`

- [ ] **Step 1: Write the failing test**

```python
from scripts.web_verify import build_gpt5_request

def test_build_request_has_model_tool_and_claims():
    claims = [{"id": "f.md:1", "type": "price", "quote": "GPT-4o", "current_value": "GPT-4o"}]
    req = build_gpt5_request(claims)
    assert req["model"] == "gpt-5.5"
    assert {"type": "web_search"} in req["tools"]
    # claims trafiają do inputu jako JSON
    user_msg = req["input"][-1]["content"]
    assert "f.md:1" in user_msg
    assert "GPT-4o" in user_msg
    # instrukcja wymusza JSON i klasyfikację historyczne/aktualne
    sys_msg = req["input"][0]["content"]
    assert "JSON" in sys_msg
    assert "historical" in sys_msg
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd pipeline/web-fact-checker && .venv/bin/pytest tests/test_web_verify.py::test_build_request_has_model_tool_and_claims -v`
Expected: FAIL (`build_gpt5_request` nie istnieje).

- [ ] **Step 3: Write minimal implementation**

```python
_SYS_PROMPT_B = (
    "Jesteś niezależnym fact-checkerem treści o modelach AI. Dla KAŻDEGO podanego twierdzenia "
    "użyj narzędzia web_search i ustal, czy jest AKTUALNE na dziś. Zwróć WYŁĄCZNIE JSON: tablicę "
    "obiektów {claim_id, status, correct_value, source_url, as_of, classification}. "
    "status: current|stale|wrong|ambiguous. "
    "classification: 'current' jeśli twierdzenie jest podane jako stan bieżący; "
    "'historical' jeśli świadomie opisuje przeszłość (np. nasycony benchmark, 'poprzedni model'). "
    "Jeśli twierdzenie jest historyczne i poprawne w swoim kontekście -> status=current, classification=historical. "
    "correct_value tylko gdy stale/wrong; zawsze podawaj source_url z wyszukiwania. Bez komentarzy poza JSON."
)

def build_gpt5_request(claims: list[dict]) -> dict:
    return {
        "model": GPT_MODEL,
        "tools": [{"type": "web_search"}],
        "input": [
            {"role": "system", "content": _SYS_PROMPT_B},
            {"role": "user", "content": "TWIERDZENIA DO WERYFIKACJI:\n" + json.dumps(claims, ensure_ascii=False)},
        ],
    }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd pipeline/web-fact-checker && .venv/bin/pytest tests/test_web_verify.py::test_build_request_has_model_tool_and_claims -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add pipeline/web-fact-checker/scripts/web_verify.py pipeline/web-fact-checker/tests/test_web_verify.py
git commit -m "feat(web-fact-checker): build_gpt5_request (Responses API + web_search)"
```

---

## Task 5: `parse_gpt5_response()` – wyjęcie werdyktów z odpowiedzi Responses API

**Files:**
- Modify: `pipeline/web-fact-checker/scripts/web_verify.py`
- Create: `pipeline/web-fact-checker/tests/fixtures/gpt5_response_sample.json`
- Test: `pipeline/web-fact-checker/tests/test_web_verify.py`

- [ ] **Step 1: Utwórz fixture przykładowej odpowiedzi**

Plik `pipeline/web-fact-checker/tests/fixtures/gpt5_response_sample.json`:
```json
{
  "output": [
    {"type": "web_search_call", "id": "ws_1", "status": "completed"},
    {"type": "message", "role": "assistant",
     "content": [{"type": "output_text",
       "text": "```json\n[{\"claim_id\":\"f.md:1\",\"status\":\"stale\",\"correct_value\":\"GPT-5.5\",\"source_url\":\"https://openai.com/pricing\",\"as_of\":\"2026-05\",\"classification\":\"current\"}]\n```"}]}
  ]
}
```

- [ ] **Step 2: Write the failing test**

```python
import json, pathlib
from scripts.web_verify import parse_gpt5_response

FIX = pathlib.Path(__file__).parent / "fixtures" / "gpt5_response_sample.json"

def test_parse_extracts_verdicts_and_strips_fence():
    resp = json.loads(FIX.read_text())
    verdicts = parse_gpt5_response(resp)
    assert len(verdicts) == 1
    assert verdicts[0]["claim_id"] == "f.md:1"
    assert verdicts[0]["status"] == "stale"
    assert verdicts[0]["correct_value"] == "GPT-5.5"

def test_parse_handles_empty_or_malformed():
    assert parse_gpt5_response({"output": []}) == []
    assert parse_gpt5_response({"output": [{"type": "message", "content":
        [{"type": "output_text", "text": "nie-json"}]}]}) == []
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd pipeline/web-fact-checker && .venv/bin/pytest tests/test_web_verify.py -k parse -v`
Expected: FAIL (`parse_gpt5_response` nie istnieje).

- [ ] **Step 4: Write minimal implementation**

```python
def parse_gpt5_response(resp: dict) -> list[dict]:
    """Wyciąga tablicę werdyktów z output_text odpowiedzi Responses API. Tolerancyjny na ```json fence i śmieci."""
    text = ""
    for item in resp.get("output", []):
        if item.get("type") == "message":
            for part in item.get("content", []):
                if part.get("type") == "output_text":
                    text += part.get("text", "")
    if not text.strip():
        return []
    # strip code fence
    m = re.search(r"```(?:json)?\s*(.*?)```", text, re.DOTALL)
    payload = m.group(1) if m else text
    try:
        data = json.loads(payload.strip())
    except json.JSONDecodeError:
        return []
    return data if isinstance(data, list) else []
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd pipeline/web-fact-checker && .venv/bin/pytest tests/test_web_verify.py -k parse -v`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add pipeline/web-fact-checker/scripts/web_verify.py pipeline/web-fact-checker/tests/
git commit -m "feat(web-fact-checker): parse_gpt5_response + fixture"
```

---

## Task 6: `format_report()` – raport per plik

**Files:**
- Modify: `pipeline/web-fact-checker/scripts/web_verify.py`
- Test: `pipeline/web-fact-checker/tests/test_web_verify.py`

- [ ] **Step 1: Write the failing test**

```python
from scripts.web_verify import format_report

def test_report_groups_apply_and_flag():
    claims = {"f.md:1": {"line": 98, "quote": "GPT-4o", "type": "price"},
              "f.md:2": {"line": 70, "quote": "90,2% (GPT-4o)", "type": "benchmark"}}
    decisions = [
        {"claim_id": "f.md:1", "action": "apply", "value": "GPT-5.5",
         "reason": "A i B zgodne", "sources": ["https://openai.com/pricing"]},
        {"claim_id": "f.md:2", "action": "flag", "value": None,
         "reason": "rozbieżna klasyfikacja", "sources": []},
    ]
    out = format_report("chatgpt.md", claims, decisions)
    assert "Poprawiono 1" in out
    assert "Do decyzji 1" in out
    assert "L98" in out and "GPT-5.5" in out
    assert "L70" in out
    assert "openai.com/pricing" in out
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd pipeline/web-fact-checker && .venv/bin/pytest tests/test_web_verify.py -k report -v`
Expected: FAIL (`format_report` nie istnieje).

- [ ] **Step 3: Write minimal implementation**

```python
def format_report(filename: str, claims: dict, decisions: list[dict]) -> str:
    applied = [d for d in decisions if d["action"] == "apply"]
    flagged = [d for d in decisions if d["action"] == "flag"]
    lines = [f"📄 {filename}  · {len(claims)} twierdzeń · {len(decisions)} werdyktów"]
    lines.append(f"🔧 Poprawiono {len(applied)}:")
    for d in applied:
        c = claims.get(d["claim_id"], {})
        src = f"  [{'; '.join(d['sources'])}]" if d["sources"] else ""
        lines.append(f"  L{c.get('line','?')} {c.get('quote','')} -> {d['value']}{src}")
    lines.append(f"🚩 Do decyzji {len(flagged)}:")
    for d in flagged:
        c = claims.get(d["claim_id"], {})
        lines.append(f"  L{c.get('line','?')} {c.get('quote','')} – {d['reason']}")
    return "\n".join(lines)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd pipeline/web-fact-checker && .venv/bin/pytest tests/test_web_verify.py -k report -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add pipeline/web-fact-checker/scripts/web_verify.py pipeline/web-fact-checker/tests/test_web_verify.py
git commit -m "feat(web-fact-checker): format_report + test"
```

---

## Task 7: `main()` – wywołanie sieciowe GPT-5.5 + CLI (integracja)

**Files:**
- Modify: `pipeline/web-fact-checker/scripts/web_verify.py`

- [ ] **Step 1: Dodaj main() (CLI: stdin claims JSON → stdout verdicts JSON)**

```python
def call_gpt5(claims: list[dict]) -> list[dict]:
    """Wywołuje OpenAI Responses API z web_search. Zwraca [] przy braku klucza/błędzie (degradacja do single-engine)."""
    key = os.environ.get("OPENAI_API_KEY")
    if not key:
        sys.stderr.write("⚠️ OPENAI_API_KEY brak – silnik B pominięty (single-engine)\n")
        return []
    body = json.dumps(build_gpt5_request(claims)).encode()
    req = urllib.request.Request(
        "https://api.openai.com/v1/responses", data=body,
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            return parse_gpt5_response(json.loads(r.read()))
    except Exception as e:  # noqa: BLE001 – degradacja, nie wywalaj skilla
        sys.stderr.write(f"⚠️ GPT-5.5 błąd: {e} – silnik B pominięty\n")
        return []

def main():
    """stdin: {'claims':[...], 'verdicts_a':[...]} → stdout: {'decisions':[...], 'verdicts_b':[...]}"""
    payload = json.load(sys.stdin)
    claims = payload["claims"]
    verdicts_a = {v["claim_id"]: v for v in payload["verdicts_a"]}
    verdicts_b = {v["claim_id"]: v for v in call_gpt5(claims)}
    decisions = [reconcile(verdicts_a[c["id"]], verdicts_b.get(c["id"]))
                 for c in claims if c["id"] in verdicts_a]
    json.dump({"decisions": decisions, "verdicts_b": list(verdicts_b.values())},
              sys.stdout, ensure_ascii=False)

if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Smoke test pełnego pytest (czyste funkcje nadal zielone)**

Run: `cd pipeline/web-fact-checker && .venv/bin/pytest -v`
Expected: PASS wszystkie.

- [ ] **Step 3: Smoke test CLI bez klucza (degradacja → single-engine)**

Run:
```bash
cd pipeline/web-fact-checker
echo '{"claims":[{"id":"f.md:1","type":"price","quote":"GPT-4o","current_value":"GPT-4o"}],"verdicts_a":[{"claim_id":"f.md:1","status":"stale","correct_value":"GPT-5.5","source_url":"https://openai.com/pricing","as_of":"2026-05","classification":"current"}]}' | env -u OPENAI_API_KEY .venv/bin/python scripts/web_verify.py
```
Expected: stderr `⚠️ OPENAI_API_KEY brak…`; stdout JSON z `"action": "apply"` i `"value": "GPT-5.5"` (single-engine, bo A ma twarde źródło).

- [ ] **Step 4: Commit**

```bash
git add pipeline/web-fact-checker/scripts/web_verify.py
git commit -m "feat(web-fact-checker): main() + wywołanie GPT-5.5 z degradacją"
```

---

## Task 8: SKILL.md – orkiestracja (część osądu LLM)

**Files:**
- Create: `pipeline/web-fact-checker/SKILL.md`

- [ ] **Step 1: Napisz SKILL.md z pełną logiką**

Treść `SKILL.md` MUSI zawierać sekcje (każda rozpisana, nie skrótowo):

1. **Frontmatter** – `name: web-fact-checker`, `description:` z triggerami PL („fact-check web", „sprawdź aktualność", „zweryfikuj fakty w sieci", „przejedź fact-checkiem") + zakres (treści o modelach AI / fakty nietrwałe).
2. **When to use** – wpisy z szybko starzejącymi się faktami; po premierze nowego modelu; przed publikacją paczki.
3. **Flow single** – kroki:
   - a) Read pliku, zapamiętaj numery linii.
   - b) **Ekstrakcja** wg taksonomii (model_name|price|benchmark|context_window|date|plan|status) → lista Claim JSON (z `historical_suspect`).
   - c) **Dedupe** identycznych faktów.
   - d) **Weryfikacja A**: dla każdego unikalnego – WebSearch, ustal status+correct_value+source_url+as_of+classification → Verdict A JSON.
   - e) **Weryfikacja B + reconcile**: zbuduj payload `{claims, verdicts_a}` i wywołaj `echo '<json>' | .venv/bin/python scripts/web_verify.py` → odbierz `decisions`.
   - f) **Apply**: dla `action=apply` – Edit w pliku (zamień `quote`→`value`, dokładny string match). Dla `flag`/`leave` – nie ruszaj.
   - g) **Raport**: użyj `format_report` (lub odtwórz jego format) + pokaż `git diff <plik>`.
4. **Reguły bezpieczeństwa** – przepisz 8 reguł ze specu (sekcja "Reguły bezpieczeństwa") dosłownie.
5. **Flow batch** – glob → pomiń `_index.md` i stuby <500 znaków → plan (lista+liczba+szac. koszt) → sekwencyjnie → tabela zbiorcza `plik | sprawdzone | poprawione | flagi | status` → na końcu zbiorczy `git diff --stat`.
6. **Klucz OpenAI** – ładuj do env z ustalonego źródła (patrz README), `export OPENAI_API_KEY=...` przed wywołaniem skryptu; NIGDY nie wpisuj klucza do żadnego pliku.
7. **Degradacja** – jeśli skrypt zwróci pusty `verdicts_b`, raport oznacza `⚠️ weryfikator B pominięty (single-engine)`.
8. **Czego NIE robi** – nie commituje, nie regeneruje obrazków (flaga TODO), nie rusza stylu/struktury, nie weryfikuje twierdzeń ponadczasowych.

- [ ] **Step 2: Walidacja frontmatter SKILL.md**

Run: `head -15 pipeline/web-fact-checker/SKILL.md`
Expected: poprawny blok `---` z `name:` i `description:` (triggery PL obecne).

- [ ] **Step 3: Commit**

```bash
git add pipeline/web-fact-checker/SKILL.md
git commit -m "feat(web-fact-checker): SKILL.md – orkiestracja flow single+batch"
```

---

## Task 9: Slash command

**Files:**
- Create: `.claude/commands/web-fact-check.md`

- [ ] **Step 1: Napisz command (wzór jak fact-check.md)**

Treść `.claude/commands/web-fact-check.md`:
```markdown
Web fact-checker treści o modelach AI. Read and follow the full skill at `pipeline/web-fact-checker/SKILL.md`.

Dwa silniki: WebSearch (Claude) + GPT-5.5 z web_search (przez `pipeline/web-fact-checker/scripts/web_verify.py`).
Klucz OpenAI: załaduj do env wg `pipeline/web-fact-checker/README.md`. NIGDY nie hardkoduj.

$ARGUMENTS to ścieżka do pliku, katalog lub glob (np. "src/content/blog/modele-llm/*.md").
Jeśli $ARGUMENTS puste – zapytaj, które treści sprawdzić.

Dla wielu plików: tryb batch (sekwencyjnie). Skill NIE commituje – na końcu pokaż git diff do akceptacji.
```

- [ ] **Step 2: Commit**

```bash
git add .claude/commands/web-fact-check.md
git commit -m "feat(web-fact-checker): slash command /web-fact-check"
```

---

## Task 10: Acceptance verification (manualna, na realnym wpisie)

**Files:** brak (weryfikacja end-to-end)

- [ ] **Step 1: Przygotuj artykuł testowy ze znanym stanem przestarzałym**

```bash
cd /home/sibilian/projekty/icea/transformacja-zaplecza-seo
git show 9bf1433:portals/widocznosc.ai/src/content/blog/modele-llm/chatgpt.md > /tmp/chatgpt-stale.md
```
(To wersja sprzed dzisiejszych poprawek – pełna GPT-4o/o1/DALL-E.)

- [ ] **Step 2: Uruchom skill na kopii i oceń wynik**

Skopiuj `/tmp/chatgpt-stale.md` do tymczasowej lokalizacji w `src/content/blog/`, uruchom `/web-fact-check <ścieżka>`, zweryfikuj że:
- ✅ wykrywa i proponuje apply: GPT-4o→GPT-5.x w tabeli planów (L98–100), cutoff (FAQ), DALL-E→GPT Image.
- ✅ **zostawia** wzmianki historyczne (jeśli były) i flaguje niejednoznaczne.
- ✅ każda poprawka ma URL źródła + datę w raporcie.
- ✅ pokazuje `git diff`, **nie** commituje.

- [ ] **Step 3: Cross-check na wpisie o programowaniu (reguła historyczna)**

Uruchom `/web-fact-check` na kopii `claude-vs-chatgpt-programowanie.md` i potwierdź, że GPT-4o w HumanEval (L39, L70) jest **zostawiony** (classification=historical → leave/flag, nie apply).

- [ ] **Step 4: Sprzątanie + zapis wyniku**

Usuń pliki tymczasowe. Jeśli wszystko zielone – zaktualizuj `README.md` o sekcję „Acceptance: zweryfikowano na chatgpt.md (stale) + programowanie.md (historyczne)".

```bash
git add pipeline/web-fact-checker/README.md
git commit -m "docs(web-fact-checker): wynik acceptance verification"
```

---

## Self-Review (wykonane przy pisaniu planu)

- **Spec coverage:** ekstrakcja+taksonomia (T8), weryfikacja A (T8/SKILL), weryfikacja B (T4/T5/T7), reconcile+reguły (T3 + T8), auto-apply+diff (T8), batch (T8), raport (T6/T8), fallback single-engine (T3/T7), klucz OpenAI (T1), „czego nie robi" (T8), kryteria sukcesu (T10). Wszystkie sekcje specu mają zadanie.
- **Placeholdery:** brak – każdy krok z kodem ma pełny kod; SKILL.md (T8) ma wypunktowaną, kompletną listę sekcji do napisania (treść prozą, nie kod).
- **Type consistency:** kontrakt JSON (Claim/Verdict/Decision) zdefiniowany raz w File Structure i używany spójnie; sygnatury `reconcile(a,b)`, `build_gpt5_request(claims)`, `parse_gpt5_response(resp)`, `format_report(filename,claims,decisions)`, `normalize_value(value)` zgodne między definicją a wywołaniami w main() i testach.
```
