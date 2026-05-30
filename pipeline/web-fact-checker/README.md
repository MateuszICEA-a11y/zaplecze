# web-fact-checker

Skill do automatycznej weryfikacji twierdzeń faktograficznych w artykułach (ceny, modele, benchmarki AI).

## Architektura

Dual-engine fact-checking:
- **Silnik A (WebSearch)** – wbudowane narzędzie Claude do wyszukiwania
- **Silnik B (GPT-5.5)** – OpenAI Responses API z `web_search` (opcjonalny)

Wyniki obu silników są łączone przez `reconcile()`. `apply` następuje tylko przy pełnej zgodzie obu silników.

## Klucz OpenAI API

Silnik B wymaga zmiennej środowiskowej `OPENAI_API_KEY`.

```bash
export OPENAI_API_KEY=sk-...
```

**Nigdy nie hardcoduj klucza w kodzie ani plikach konfiguracyjnych.**

Gdy `OPENAI_API_KEY` jest nieobecny, skill automatycznie przechodzi w tryb **single-engine** (tylko Silnik A/WebSearch). W tym trybie:
- `call_gpt5()` zwraca `[]` i wypisuje ostrzeżenie na stderr
- `reconcile(a, None)` stosuje uproszczoną logikę decyzji
- Wyniki są bezpieczne, ale mniej pewne (brak potwierdzenia z drugiego źródła)

## Uruchamianie testów

Testy importują moduł jako `scripts.web_verify`. Pytest musi być uruchamiany z katalogu `pipeline/web-fact-checker/`:

```bash
cd pipeline/web-fact-checker
.venv/bin/pytest -v
```

Rozwiązanie importu: katalog `pipeline/web-fact-checker/` jest dodany do `sys.path` przez `conftest.py` w katalogu głównym testów. Dzięki temu `import scripts.web_verify` działa bez instalacji pakietu.

## Użycie CLI

```bash
echo '{"claims":[...], "verdicts_a":[...]}' | python scripts/web_verify.py
```

Wejście (stdin): JSON z kluczami `claims` (lista twierdzeń) i `verdicts_a` (lista werdyktów Silnika A).

Wyjście (stdout): JSON z kluczami `decisions` (lista decyzji) i `verdicts_b` (lista werdyktów Silnika B).

## Struktura plików

```
pipeline/web-fact-checker/
├── README.md
├── scripts/
│   ├── __init__.py
│   └── web_verify.py   # czyste funkcje + main()
├── tests/
│   ├── __init__.py
│   ├── conftest.py     # sys.path fix dla importu scripts.*
│   ├── fixtures/
│   │   └── gpt5_response_sample.json
│   └── test_web_verify.py
└── .venv/              # wirtualne środowisko (gitignored)
```

## Model danych

### Claim
```json
{"id":"chatgpt.md:98","file":"...","line":98,"type":"price","quote":"GPT-4o","current_value":"GPT-4o","historical_suspect":false}
```

### Verdict
```json
{"claim_id":"chatgpt.md:98","status":"stale","correct_value":"GPT-5.5","source_url":"https://...","as_of":"2026-05","classification":"current"}
```
`status` ∈ `current|stale|wrong|ambiguous`
`classification` ∈ `current|historical`

### Decision
```json
{"claim_id":"chatgpt.md:98","action":"apply","value":"GPT-5.5","reason":"...","sources":["https://..."]}
```
`action` ∈ `apply|flag|leave`

## Acceptance (zweryfikowane 2026-05-29)

End-to-end na reprezentatywnych twierdzeniach (tryb single-engine, brak klucza):
- **Przestarzałe-jako-bieżące** (chatgpt.md „Free = GPT-4o") → `apply` „GPT-5.3 Instant" ✅
- **Historyczne** (programowanie.md „HumanEval 90,2% GPT-4o", `classification=historical`) → `leave` (reguła nr 1: historyczne nietknięte) ✅
- Degradacja bez `OPENAI_API_KEY` → ostrzeżenie + nadal poprawne decyzje ✅

Logika dwusilnikowa (A vs B) pokryta 18 testami jednostkowymi `reconcile()`. Silnik B live wymaga ustawienia `OPENAI_API_KEY`.
