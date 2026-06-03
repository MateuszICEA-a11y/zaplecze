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

Odczytaj JSON ze stdout (`status`: smoothed/unchanged/rejected/error). Skrypt zwraca kod wyjścia `2` przy `error`, `0` w pozostałych przypadkach.
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
