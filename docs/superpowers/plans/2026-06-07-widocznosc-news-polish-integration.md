# Wygładzanie newsów widocznosc.ai (Gemini 3.1 Pro) – Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Newsy widocznosc.ai mają wychodzić wygładzone przez Gemini 3.1 Pro – jednorazowo dla 6 ostatnich, a docelowo automatycznie przy każdej generacji.

**Architecture:** Reużywamy istniejący silnik `smoother.py` (blog-polish). Dokładamy jeden wzorzec ochrony (blockquote = głos redakcji), cienki most `smooth_news` (fail-safe) i wpinamy go in-process w `main.py` generatora newsów między `postprocess()` a zapisem pliku. Prompt dla newsów dostaje tylko prozaiczne sekcje reguł (słownik kalk, blacklista AI, fleksja) – bez reguł strukturalnych bloga.

**Tech Stack:** Python 3.12, pytest, OpenRouter (Gemini 3.1 Pro), GitHub Actions, Astro content collection `news`.

**Spec:** `docs/superpowers/specs/2026-06-07-widocznosc-news-polish-integration-design.md`

---

## File Structure

| Plik | Rola | Zmiana |
|------|------|--------|
| `pipeline/widocznosc-blog-polish/scripts/smoother.py` | silnik wygładzania (współdzielony z blogiem) | Modyfikacja: +wzorzec `BLOCKQUOTE` w `PROTECT_PATTERNS` |
| `pipeline/widocznosc-blog-polish/tests/test_smoother.py` | testy silnika | Modyfikacja: +2 testy blockquote |
| `pipeline/news-generator-widocznosc/smoother_bridge.py` | most: `news_rules()` + `smooth_news()` (fail-safe) | **Nowy** |
| `pipeline/news-generator-widocznosc/tests/test_smoother_bridge.py` | testy mostu (mock call_fn, bez sieci) | **Nowy** |
| `pipeline/news-generator-widocznosc/main.py` | orkiestrator newsów | Modyfikacja: import + wpięcie `smooth_news` przed zapisem |
| `.github/workflows/widocznosc-news.yml` | cron CI | Modyfikacja: +`OPENROUTER_API_KEY` w `env` |
| `portals/widocznosc.ai/src/content/news/*.md` | 6 newsów | Modyfikacja (część 1, przejazd) |

**Uwaga o współdzieleniu:** `smoother.py` używa też blog-polish. Wzorzec `BLOCKQUOTE` zamraża każdy markdownowy cytat `>` – to poprawne także dla bloga (cytat = dosłowny), a przejazd bloga (42/46) już zakończony, więc to nie regres. Regresję pilnuje pełna suite 41 testów blog-polish (Task 1, krok 6).

**Kolejność wykonania (różni się od „Kolejność prac" w specu – uzasadnienie):** kod + testy (Task 1–4) **nie wymagają klucza** i idą pierwsze; faktyczny przejazd 6 newsów (Task 5) wymaga, by użytkownik podał świeży `OPENROUTER_API_KEY` (klucza nie ma w żadnym `.env` ani w env powłoki – SKILL.md: „poproś usera o świeży"). Dlatego przejazd jest na końcu, gdy klucz będzie dostępny. Część 1 i tak korzysta z ulepszonego silnika z Task 1.

---

## Task 1: Ochrona głosu redakcji – wzorzec `BLOCKQUOTE` w smootherze

**Files:**
- Modify: `pipeline/widocznosc-blog-polish/scripts/smoother.py:35-50` (lista `PROTECT_PATTERNS`)
- Test: `pipeline/widocznosc-blog-polish/tests/test_smoother.py`

Import w testach działa przez `conftest.py` (dodaje `scripts/` do `sys.path`); pliki testowe robią `import smoother`.

- [ ] **Step 1: Dopisz dwa failujące testy**

Dopisz na końcu `pipeline/widocznosc-blog-polish/tests/test_smoother.py`:

```python
def test_blockquote_protected_and_restored():
    body = (
        "Akapit wstępny.\n\n"
        "> **Nasz komentarz:** AI staje się systemowym filtrem zaufania.\n\n"
        "Akapit końcowy.\n"
    )
    protected, store = smoother.protect(body)
    # cały cytat zamrożony jako jeden token, nie trafia do modelu
    assert "Nasz komentarz" not in protected
    assert any(tok.startswith("§BLOCKQUOTE_") for tok in store)
    # restore odtwarza 1:1
    assert smoother.restore(protected, store) == body


def test_blockquote_multiline_is_single_frozen_block():
    body = (
        "> Pierwsza linia cytatu.\n"
        "> Druga linia cytatu.\n\n"
        "Proza po cytacie.\n"
    )
    protected, store = smoother.protect(body)
    blockquote_tokens = [t for t in store if t.startswith("§BLOCKQUOTE_")]
    assert len(blockquote_tokens) == 1  # ciąg linii > = jeden blok
    assert "Druga linia cytatu" not in protected
    assert smoother.restore(protected, store) == body
```

- [ ] **Step 2: Uruchom testy – mają failować**

Run: `cd pipeline/widocznosc-blog-polish && python3 -m pytest tests/test_smoother.py -k blockquote -v`
Expected: FAIL – brak tokenów `§BLOCKQUOTE_` (wzorca jeszcze nie ma), `assert any(...)` / `len == 1` nie przechodzi.

- [ ] **Step 3: Dodaj wzorzec `BLOCKQUOTE` do `PROTECT_PATTERNS`**

W `pipeline/widocznosc-blog-polish/scripts/smoother.py`, w liście `PROTECT_PATTERNS`, **bezpośrednio po linii `CALLOUT`** (linia 37) dodaj:

```python
    # Markdownowy cytat (głos redakcji w newsach: „> **Nasz komentarz:**") – zamrażany jako
    # jeden blok kolejnych linii „>", analogicznie do <aside>. Cytat = dosłowny, model go nie tyka.
    ("BLOCKQUOTE", re.compile(r"(?:^[ \t]*>[^\n]*\n?)+", re.MULTILINE)),
```

Kontekst – fragment ma wyglądać tak:

```python
    ("CALLOUT", re.compile(r"<aside\b[^>]*>.*?</aside>", re.DOTALL | re.IGNORECASE)),
    # Markdownowy cytat (głos redakcji w newsach: „> **Nasz komentarz:**") – zamrażany jako
    # jeden blok kolejnych linii „>", analogicznie do <aside>. Cytat = dosłowny, model go nie tyka.
    ("BLOCKQUOTE", re.compile(r"(?:^[ \t]*>[^\n]*\n?)+", re.MULTILINE)),
    ("HEADING", re.compile(r"^#{1,6}[^\n]*$", re.MULTILINE)),
```

- [ ] **Step 4: Uruchom testy blockquote – mają przejść**

Run: `cd pipeline/widocznosc-blog-polish && python3 -m pytest tests/test_smoother.py -k blockquote -v`
Expected: PASS (2 passed).

- [ ] **Step 5: Uruchom CAŁĄ suite blog-polish – regresja**

Run: `cd pipeline/widocznosc-blog-polish && python3 -m pytest -q`
Expected: PASS – wszystkie (było 41) + 2 nowe = 43 passed. Jeśli któryś istniejący test protect/restore failuje, sprawdź czy wzorzec nie połyka czegoś spoza cytatu.

- [ ] **Step 6: Commit**

```bash
cd /home/sibilian/projekty/icea/transformacja-zaplecza-seo
git add pipeline/widocznosc-blog-polish/scripts/smoother.py pipeline/widocznosc-blog-polish/tests/test_smoother.py
git commit -m "feat(blog-polish): zamroź markdownowy blockquote (głos redakcji) w protect

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Most `smoother_bridge.py` – `news_rules()` + `smooth_news()`

**Files:**
- Create: `pipeline/news-generator-widocznosc/smoother_bridge.py`
- Test: `pipeline/news-generator-widocznosc/tests/test_smoother_bridge.py`

Most dokłada ścieżkę `scripts/` smoothera do `sys.path` i importuje `smoother`. `news_rules()` wyciąga z `writing-rules.md` tylko sekcje prozy. `smooth_news()` jest fail-safe (nigdy nie rzuca) i przyjmuje opcjonalny `call_fn` do testów bez sieci.

- [ ] **Step 1: Napisz failujące testy mostu**

Utwórz `pipeline/news-generator-widocznosc/tests/test_smoother_bridge.py`:

```python
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import smoother_bridge


def test_news_rules_keeps_prose_drops_structure():
    rules = smoother_bridge.news_rules()
    # proza – zostaje
    assert "kalki ZAKAZANE" in rules
    assert "blacklista" in rules.lower()
    assert "fleksja" in rules.lower()
    # struktura/linkowanie bloga – wycięte
    assert "Struktura artykułu" not in rules
    assert "Wikipedia" not in rules


def test_smooth_news_without_key_returns_original(monkeypatch):
    monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)
    text = "Akapit newsa bez zmian.\n"
    assert smooth_news_out(text) == text


def smooth_news_out(text, call_fn=None):
    return smoother_bridge.smooth_news(text, call_fn=call_fn)


def test_smooth_news_rejected_returns_original():
    # call_fn rusza liczbę -> diff-guard odrzuca -> oryginał
    text = "Model kosztuje 100 zł miesięcznie.\n"
    out = smooth_news_out(text, call_fn=lambda pb, r: pb.replace("100", "999"))
    assert out == text
    assert "100" in out and "999" not in out


def test_smooth_news_smoothed_returns_model_text():
    # call_fn poprawia prozę, nie rusza liczb/modeli/tokenów -> smoothed
    text = "To zdanie jest źle napisane.\n"
    out = smooth_news_out(text, call_fn=lambda pb, r: pb.replace("źle", "dobrze"))
    assert "dobrze" in out
    assert out != text
```

- [ ] **Step 2: Uruchom – mają failować**

Run: `cd pipeline/news-generator-widocznosc && python3 -m pytest tests/test_smoother_bridge.py -v`
Expected: FAIL z `ModuleNotFoundError: No module named 'smoother_bridge'`.

- [ ] **Step 3: Zaimplementuj most**

Utwórz `pipeline/news-generator-widocznosc/smoother_bridge.py`:

```python
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
```

- [ ] **Step 4: Uruchom testy mostu – mają przejść**

Run: `cd pipeline/news-generator-widocznosc && python3 -m pytest tests/test_smoother_bridge.py -v`
Expected: PASS (4 passed).

- [ ] **Step 5: Commit**

```bash
cd /home/sibilian/projekty/icea/transformacja-zaplecza-seo
git add pipeline/news-generator-widocznosc/smoother_bridge.py pipeline/news-generator-widocznosc/tests/test_smoother_bridge.py
git commit -m "feat(news-widocznosc): most smooth_news (fail-safe) + prozaiczne reguły newsa

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Wpięcie `smooth_news` w `main.py` (in-process)

**Files:**
- Modify: `pipeline/news-generator-widocznosc/main.py:20-21` (import) i `:178-190` (krok przed zapisem)

- [ ] **Step 1: Dodaj import mostu**

W `pipeline/news-generator-widocznosc/main.py`, w bloku importów lokalnych (po linii `from image_generator import generate_hero_image`), dodaj:

```python
from smoother_bridge import smooth_news
```

- [ ] **Step 2: Wepnij wygładzanie przed zapisem pliku**

W funkcji `run()` znajdź blok (linie ~178-190):

```python
    # 10. Post-process (Astro frontmatter)
    fm, body, errors = postprocess(
        fm,
        body,
        image_path=image_rel,
        author=pipeline_cfg.get("author", "Redakcja widocznosc.ai"),
    )
    if errors:
        log.error("Frontmatter validation errors, not writing: %s", errors)
        return

    # 11. Write file
    news_dir.mkdir(parents=True, exist_ok=True)
    output_path.write_text(build_markdown(fm, body), encoding="utf-8")
```

Zamień końcówkę (od `# 11. Write file`) na:

```python
    # 10b. Wygładzanie polszczyzny (Gemini 3.1 Pro) – fail-safe:
    # brak OPENROUTER_API_KEY / rejected (diff-guard) / błąd API -> oryginał + log.warning.
    final_md = smooth_news(build_markdown(fm, body))

    # 11. Write file
    news_dir.mkdir(parents=True, exist_ok=True)
    output_path.write_text(final_md, encoding="utf-8")
```

- [ ] **Step 3: Smoke – import `main` nie wywala, most się ładuje**

Run: `cd pipeline/news-generator-widocznosc && python3 -c "import main; print('main OK'); from smoother_bridge import smooth_news; print('smooth_news OK')"`
Expected: wypisuje `main OK` i `smooth_news OK` bez tracebacka. (Jeśli `main` zgłosi brak zależności RSS/yaml – zainstaluj `pip install -r requirements.txt`, to nie błąd integracji.)

- [ ] **Step 4: Regresja – pełna suite news-generatora**

Run: `cd pipeline/news-generator-widocznosc && python3 -m pytest -q`
Expected: PASS – istniejące testy + 4 nowe z Task 2. `postprocess` niezmieniony, więc testy postprocesora przechodzą.

- [ ] **Step 5: Fail-safe na sucho – pipeline bez klucza pisze oryginał**

Sprawdza, że brak klucza nie wywala zapisu (symulacja: `smooth_news` na przykładowym pliku newsa bez `OPENROUTER_API_KEY`):

Run:
```bash
cd /home/sibilian/projekty/icea/transformacja-zaplecza-seo
env -u OPENROUTER_API_KEY python3 -c "
import sys; sys.path.insert(0,'pipeline/news-generator-widocznosc')
from smoother_bridge import smooth_news
t = open('portals/widocznosc.ai/src/content/news/android-dostaje-wykrywanie-podszywania-sie-w-polaczeniach.md',encoding='utf-8').read()
out = smooth_news(t)
assert out == t, 'fail-safe powinien zwrócić oryginał'
print('fail-safe OK: oryginał zwrócony, log.warning powyżej')
"
```
Expected: `WARNING ... OPENROUTER_API_KEY brak ...` + `fail-safe OK`.

- [ ] **Step 6: Commit**

```bash
cd /home/sibilian/projekty/icea/transformacja-zaplecza-seo
git add pipeline/news-generator-widocznosc/main.py
git commit -m "feat(news-widocznosc): wpnij wygładzanie Gemini 3.1 Pro przed zapisem newsa (fail-safe)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Sekret `OPENROUTER_API_KEY` w workflow CI

**Files:**
- Modify: `.github/workflows/widocznosc-news.yml` (blok `env` kroku „Run news pipeline")

- [ ] **Step 1: Dodaj zmienną do `env`**

W `.github/workflows/widocznosc-news.yml`, w kroku „Run news pipeline", w bloku `env:` po linii `KIE_API_KEY: ${{ secrets.KIE_API_KEY }}` dodaj:

```yaml
          OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
```

Blok ma wyglądać tak:

```yaml
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          DATAFORSEO_LOGIN: ${{ secrets.DATAFORSEO_LOGIN }}
          DATAFORSEO_PASSWORD: ${{ secrets.DATAFORSEO_PASSWORD }}
          KIE_API_KEY: ${{ secrets.KIE_API_KEY }}
          OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
        run: python pipeline/news-generator-widocznosc/main.py
```

- [ ] **Step 2: Walidacja składni YAML**

Run: `cd /home/sibilian/projekty/icea/transformacja-zaplecza-seo && python3 -c "import yaml; yaml.safe_load(open('.github/workflows/widocznosc-news.yml')); print('YAML OK')"`
Expected: `YAML OK`.

- [ ] **Step 3: Commit**

```bash
cd /home/sibilian/projekty/icea/transformacja-zaplecza-seo
git add .github/workflows/widocznosc-news.yml
git commit -m "ci(news-widocznosc): przekaż OPENROUTER_API_KEY do generatora newsów

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

> **Akcja użytkownika (poza tym planem):** w GitHub → Settings → Secrets and variables → Actions dodać sekret `OPENROUTER_API_KEY` ze świeżym kluczem OpenRouter. Bez sekretu workflow działa dalej (fail-safe), tylko bez wygładzania.

---

## Task 5: Część 1 – jednorazowy przejazd 6 ostatnich newsów

> **Wymaga świeżego `OPENROUTER_API_KEY` od użytkownika.** Jeśli klucza brak – ten task czeka; Task 1–4 są już wdrożone, więc nic nie blokuje.

**Files:**
- Modify: 6× `portals/widocznosc.ai/src/content/news/*.md`

- [ ] **Step 1: Ustaw klucz w bieżącej powłoce**

Użytkownik podaje świeży klucz. W sesji:

```bash
export OPENROUTER_API_KEY="sk-or-...<świeży klucz od użytkownika>"
```

- [ ] **Step 2: Przejazd 6 newsów (zapis in-place przy statusie `smoothed`)**

```bash
cd /home/sibilian/projekty/icea/transformacja-zaplecza-seo
for f in \
  internet-coraz-bardziej-pod-maszyny \
  gdy-firmy-przesadzaja-z-ai \
  softbank-planuje-do-75-mld-euro-na-centra-danych-we-francji \
  minimax-m3-otwarty-model-milion-tokenow \
  gemini-3-5-flash-agentowy-model-google \
  android-dostaje-wykrywanie-podszywania-sie-w-polaczeniach ; do
  python3 pipeline/widocznosc-blog-polish/scripts/smoother.py \
    "portals/widocznosc.ai/src/content/news/$f.md"
done
```
Expected: po każdym pliku linia JSON `{"file": "...", "status": "smoothed|unchanged|rejected", "detail": "..."}`. `rejected` = diff-guard złapał ruszony fakt → plik zostaje w oryginale (to OK, odnotuj).

- [ ] **Step 3: Przegląd diffów – głos redakcji nietknięty, fakty całe**

Run: `git diff -- portals/widocznosc.ai/src/content/news/`
Sprawdź wzrokowo: blockquote `> **Nasz komentarz:**` bez zmian, liczby/nazwy modeli/daty bez zmian, `lead:` we frontmatterze bez zmian. Jeśli coś podejrzanego – `git checkout -- <plik>` i odnotuj.

- [ ] **Step 4: Sanity build Astro (nie psujemy contentu)**

Run: `cd portals/widocznosc.ai && npx astro check 2>&1 | tail -15 || true`
Expected: brak NOWYCH błędów dotyczących plików news/. (Jeśli `astro check` niedostępny/wolny, pomiń – diff z kroku 3 jest głównym zabezpieczeniem.)

- [ ] **Step 5: Commit paczką**

```bash
cd /home/sibilian/projekty/icea/transformacja-zaplecza-seo
git add portals/widocznosc.ai/src/content/news/
git commit -m "content(widocznosc): wygładzenie polszczyzny – 6 ostatnich newsów (Gemini 3.1 Pro)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 6: Raport przejazdu**

Dopisz krótki raport (statusy per plik z kroku 2, ewentualne rejecty) do
`portals/widocznosc.ai/podstrony-review/news-polish-2026-06-07.md` i dodaj do commita amend lub osobnym commitem docs.

---

## Self-Review (wykonane przy pisaniu planu)

**Spec coverage:**
- Decyzja #1 (rewrite + ochrona głosu) → Task 1 (BLOCKQUOTE) + reużycie smoothera.
- Decyzja #2 (in-process w main.py) → Task 3.
- Decyzja #3 (fail-safe publikuj oryginał) → Task 2 (`smooth_news`) + Task 3 krok 5.
- Decyzja #4 (6 newsów) → Task 5.
- Decyzja #5 (lead bez zmian) → automatyczne: `split_frontmatter` nie wysyła frontmattera; brak osobnego kroku (świadomie).
- Decyzja #6 (blockquote globalnie) → Task 1.
- „Reguły promptu do weryfikacji" ze specu → rozstrzygnięte: `news_rules()` podaje tylko prozę (Task 2).
- Workflow + sekret → Task 4 (+ akcja użytkownika).
- Testy (blockquote, smooth_news ×3, regresja) → Task 1 kroki 1/5, Task 2 krok 1, Task 3 krok 4.

**Placeholder scan:** brak TBD/TODO; każdy krok ma pełny kod/komendę/expected.

**Type consistency:** `smooth_news(text, call_fn=None) -> str` i `news_rules() -> str` używane spójnie w moście, teście i `main.py`. `process_text(text, rules, call_fn) -> dict{status,text,detail}` zgodne z sygnaturą w `smoother.py:190`. Status `smoothed/unchanged/rejected/error` zgodny z `smoother.py:198-210`.
