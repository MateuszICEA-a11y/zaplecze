# Design: skill `widocznosc-blog-polish` – wygładzanie polszczyzny + fact-check bloga

**Data:** 2026-06-03
**Status:** zaakceptowany design, przed planem implementacji
**Cel:** jednorazowo (z możliwością powtarzania) przejechać wszystkie **46 opublikowanych wpisów bloga** widocznosc.ai przez dwa silniki — wygładzanie polszczyzny i fact-check — w sposób bezpieczny dla faktów i z łatwym revertem.

---

## 1. Kontekst / stan obecny

- **46 wpisów** w `portals/widocznosc.ai/src/content/blog/`, w kategoriach: `geo` (16), `ai-w-biznesie` (12), `modele-llm` (11), `rag` (4), `agenci-ai` (2), `prompty` (1).
- **`pipeline/widocznosc-content-review.py`** – istniejący recenzent (Gemini 3.1 Pro przez OpenRouter), mechanizm **find/replace** (lista `original→suggested`). Karmiony `writing-rules.md`. Dla bloga `writing-rules.md` to **właściwy** kontekst (w przeciwieństwie do newsów). Nie realizuje pełnego wygładzania prozy – stąd potrzeba nowego skryptu.
- **`pipeline/web-fact-checker/`** – dwusilnikowy fact-checker: Silnik A = WebSearch (wbudowany Claude), Silnik B = `gpt-5.5` przez OpenAI Responses API z `web_search`. `reconcile()`: apply tylko przy pełnej zgodzie A+B + źródło, inaczej flaga. Pokazuje raport + diff, **nigdy nie commituje**. Wymusza confirm przy >10 plikach.
- **`portals/widocznosc.ai/docs/writing-rules.md`** (428 linii): słownik kalk ZAKAZANYCH, blacklista zwrotów AI, pułapki fleksji, self-review checklist. Baza promptu wygładzania.
- **Wczorajsza lekcja (2026-06-02):** `--apply` na ślepo psuł **fakty** (Gemini bez `:online` cofał Gemini 3.5→1.5, I/O 2026→2024). Język był OK. Wniosek: ufamy modelowi w polszczyźnie, NIE w faktach.

---

## 2. Decyzje projektowe (zatwierdzone)

| Decyzja | Wybór |
|---|---|
| Zakres sprawdzeń | **Język + fakty** (dwa silniki) na wszystkich 46 wpisach |
| Głębokość ingerencji języka | **Pełne wygładzanie, auto-apply, fakty zamrożone** |
| Architektura | **Nowy `widocznosc-smoother.py` + skill-orkiestrator** |
| Poprawki faktów | **Auto-apply tylko przy pełnej zgodzie A+B** (domyślne web-fact-checkera), reszta flaga; bez auto-commitu |
| Routing kluczy | Gemini 3.1 Pro → OpenRouter (`OPENROUTER_API_KEY`); GPT-5.5 → **bezpośrednio OpenAI** (`OPENAI_API_KEY`) |
| Granulacja commitów | Paczka = kategoria; **wygładzanie i fakty to OSOBNE commity** |

---

## 3. Komponent A: `pipeline/widocznosc-smoother.py`

Pełny rewrite prozy jednego wpisu z twardą gwarancją nienaruszalności faktów/struktury. Potok dla jednego pliku:

1. **Split frontmatter** – blok między `---` odcinany, **nie wysyłany** do modelu, doklejany 1:1 po rewrite. Pełna ochrona `title`, `description`, `date`, `image`, `author`, `tags`, `pillar`, `intent`, `level`.

2. **Placeholder-protection** – przed wysłaniem zamiana na tokeny (`§CODE0§`, `§SC1§`, `§URL2§`…), przywracane po rewrite:
   - bloki kodu ` ``` ` i kod inline `` ` ``,
   - shortcode'y `{{% ... %}}` / `{{< ... >}}`,
   - cele linków `](...)` oraz gołe URL-e.

   Kod, linki i shortcode'y są fizycznie niewidoczne dla modelu → nie ma jak ich zepsuć.

3. **Rewrite prozy** – do `google/gemini-3.1-pro-preview` (OpenRouter) leci proza akapitów + nagłówki, z promptem opartym o `writing-rules.md`: wygładź polszczyznę, usuń kalki/anglicyzmy/AI-fingerprinty; **NIE** zmieniaj liczb, dat, nazw modeli; **NIE** dodawaj/usuwaj/przestawiaj nagłówków; **NIE** zmieniaj sensu zdań z danymi. `temperature` niska (≈0.3).

4. **Diff-guard** (deterministyczny, po przywróceniu placeholderów) – porównanie multizbiorów PRZED vs PO:
   - liczby/procenty/ceny/okna kontekstu (`1M`, `65k`, `$1,50`, `87,6%`),
   - daty (`2026-05-19`, `I/O 2026`),
   - nazwy+wersje modeli (regex `Nazwa \d[\d.]*`, np. `Gemini 3.5`, `GPT-5.5`, `Claude Opus 4.7`),
   - cele linków + URL-e, shortcode'y, sekwencja tekstów nagłówków.

   **Jakakolwiek różnica → plik ODRZUCONY** (`rejected:<co się zmieniło>`), oryginał nietknięty.

**Wyjście:** zapis wygładzonego pliku (lub odrzut) + JSON na stdout: `{file, status: smoothed|rejected|unchanged|error, detail}`.

**CLI (szkic):**
```
OPENROUTER_API_KEY="…" python3 pipeline/widocznosc-smoother.py PATH.md [--dry-run]
```
`--dry-run` = nie zapisuje, tylko raportuje co by zrobił + wynik diff-guard.

**Poza zakresem skryptu:** find/replace (to content-review.py), commity (orkiestrator), fact-check (silnik B).

---

## 4. Komponent B: skill-orkiestrator `widocznosc-blog-polish`

Przejazd po 46 wpisach **w paczkach per kategoria** (kolejność rosnąco wg liczności jako „rozgrzewka": `prompty` → `agenci-ai` → `rag` → `modele-llm` → `ai-w-biznesie` → `geo`).

1. **Pre-flight** – sprawdź `OPENROUTER_API_KEY` i `OPENAI_API_KEY`; pokaż plan (lista plików, liczba, szacowany koszt fact-checku); czekaj na potwierdzenie (web-fact-checker wymusza je przy >10 plikach).

2. **Pass 1 – wygładzanie (per kategoria):**
   - dla każdego pliku: `widocznosc-smoother.py`,
   - zbierz statusy `smoothed` / `rejected` / `unchanged` / `error`,
   - pokaż `git diff --stat` paczki,
   - **commit paczki** (np. `content(widocznosc): wygładzenie polszczyzny – geo (16 wpisów)`); `git add` **tylko konkretnych ścieżek** (nie `-A`, bo worktree bywa dzielony z sesją Codex),
   - odrzucone/błędne → lista `needs-manual` (poza commitem).

3. **Pass 2 – fakty (per kategoria, na już wygładzonym tekście):**
   - `/web-fact-check` (WebSearch + GPT-5.5) na plikach paczki,
   - apply przy pełnej zgodzie A+B + źródło (do working tree), reszta flaga,
   - **osobny commit** dla poprawek faktów (np. `fix(widocznosc): fakty po fact-check – geo`),
   - werdykty + źródła do raportu.

4. **Artefakt raportu:** `portals/widocznosc.ai/podstrony-review/blog-polish-factcheck-2026-06-03.md` – tabela statusów wygładzania, lista odrzutów diff-guard z powodami, raport faktów (twierdzenie / obecna wartość / werdykt / poprawna wartość / źródła URL).

5. **Idempotencja:** manifest `pipeline/.blog-polish-state.json` (ścieżka + hash treści + status + timestamp). Pomija pliki, których treść nie zmieniła się od ostatniego udanego przejazdu (porównanie hashy); kategorie można robić w różnych sesjach. Manifest dopisać do `.gitignore`.

---

## 5. Klucze / sekrety

- `OPENROUTER_API_KEY` – smoother (Gemini). W `api-credentials.md` bywa nieaktualny → user podaje świeży przez env przy uruchomieniu.
- `OPENAI_API_KEY` – fact-check Silnik B. W gitignored `pipeline/web-fact-checker/.env`.
- Klucze **wyłącznie przez env** przy wywołaniu skryptu (`KEY="…" python3 …`). Nigdy do payloadu, pliku tymczasowego ani commita.

---

## 6. Obsługa błędów

- Pusta/zepsuta odpowiedź modelu → `error`, plik pominięty, paczka leci dalej.
- Diff-guard reject → oryginał nietknięty, powód do `needs-manual`.
- Brak `OPENAI_API_KEY` → fact-check degraduje do single-engine (sam WebSearch) + ostrzeżenie w raporcie.
- Timeout/rate-limit (OpenRouter lub OpenAI) → 2× retry z backoffem, potem skip + log.
- Kolejność pass: fakty po wygładzeniu (osobny pass, osobny commit) → diff-guard nie kłóci się z poprawką faktu.

---

## 7. Testy

- **Smoother (nowe, pytest):**
  - round-trip split/reattach frontmatter (bajt-w-bajt),
  - round-trip placeholder protect/restore (kod, shortcode, linki przeżywają),
  - diff-guard **łapie** wstrzyknięty zmieniony numer / datę / nazwę modelu / URL → `rejected`,
  - diff-guard **przepuszcza**, gdy zmieniła się tylko proza,
  - wywołanie OpenRouter zmockowane.
- **Fact-check:** istniejące 18 testów `reconcile()` – bez zmian.
- **Pilot przed pełnymi 46:** `--dry-run` na 1–2 plikach (`prompty/przewodnik.md` + jeden `geo`), ręczny przegląd diffa, dopiero potem reszta.

---

## 8. Poza zakresem (YAGNI)

- Brak GitHub Action / crona (przejazd jest ręczny, sterowany przez usera).
- Brak UI/panelu.
- Brak zmian w buildzie Astro.
- Nie ruszamy newsów (skill jest blogowy; newsy mają inny frontmatter i reguły).
- Brak własnego trybu find/replace (zostaje w content-review.py).
