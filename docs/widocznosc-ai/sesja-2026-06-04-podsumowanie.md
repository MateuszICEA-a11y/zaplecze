# Sesja 2026-06-04 – masowy przejazd blog-polish (Pass 1 wygładzanie 42/46 + Pass 2 fact-check sanity)

## Punkt wyjścia
Kontynuacja sesji 2026-06-03 (budowa skilla `widocznosc-blog-polish`). Nierozwiązane z wczoraj: model bierze redakcyjne wolności poza zasięgiem diff-guarda – (1) dodaje zdania wprowadzające przed tabelami, (2) parafrazuje angielski cytat bez cudzysłowu. Plan: zacieśnić prompt → re-pilot → realny przejazd 46 wpisów.

## Co zrobione

### 1. Dopracowanie skilla (TDD, 41 testów zielonych)
- **Prompt cytaty/struktura** (`a5ef8a1`): twardy zakaz zdań wprowadzających/podsumowujących wokół tokenów + akapity 1:1 + cytaty DOSŁOWNIE (też angielskie) w cudzysłowie. Re-pilot na `geo/share-of-voice` potwierdził: obie wczorajsze dziury zamknięte.
- **Krytyczny bug linków** (`a5ef8a1`): re-pilot ujawnił, że model gubi otwierający `[` w `[anchor](url)` → goły `anchor](url)`. Root cause: `protect()` zamrażał tylko `](url)`, anchor zostawał w prozie. Fix: nowy wzorzec `LINK` zamraża cały `[anchor](url)` atomowo + test `test_protect_freezes_full_markdown_link_including_anchor`.
- **Prompt glosy/terminy** (`0579cdb`): checkpoint na `prompty/przewodnik` wyłapał, że Gemini systematycznie wycina glosy w nawiasach (tłumaczenia PL, oryginały EN, przykłady) i polszczy frazy-klucze (`prompt engineering`→`inżynieria podpowiedzi`). Dodana sekcja TERMINOLOGIA I GLOSY. Re-test: 31/31 glos zachowanych (było ~20/31).

### 2. Pass 1 – wygładzanie polszczyzny (42/46)
Paczki per kategoria, 5 runnerów równolegle w tle (osobne manifesty → scalone). Commity content `e1cf791`, `92e34a5`, `b5daa81`, `eff80fa`, `e159be2`, `fad14ec` + retry `d5a7c4c`.

| Kategoria | Smoothed | Rejected |
|---|---|---|
| prompty | 1/1 | – |
| agenci-ai | 2/2 | – |
| rag | 3/4 | 1 |
| modele-llm | 11/11 | – |
| ai-w-biznesie | 12/12 | – |
| geo | 13/16 | 3 |
| **Razem** | **42/46** | **4** |

- **Jakość:** linki we wszystkich 42 całe; fakty/daty/kary AI Act nietknięte (diff-guard); 2 łagodne mikro-straty pobocznych nawiasów (`(dla deweloperów integrujących…)`, `(dashboardów)`). Gemini ujednolica zamykający cudzysłów na poprawny polski `”`.
- **4 uparte rejecty** (decyzja usera: zostawić w oryginale): `rag/przewodnik`, `geo/boty-ai-przewodnik`, `geo/najczestsze-bledy-geo`, `geo/schema-org-dane-strukturalne` – wszystkie najbogatsze w inline HTML (SVG hero + bloki `<documents>/<p>/<code>`), model gubi pojedynczy tag, diff-guard chroni. Retry nie pomógł (systematyczne).
- Raport: `portals/widocznosc.ai/podstrony-review/blog-polish-2026-06-04.md`.

### 3. Pass 2 – fact-check (sanity 2 wpisów, `7a1f578`)
Decyzja usera: sanity zamiast pełnego 46 (był świeży 2026-05-30, wygładzanie nie rusza faktów). Sprawdzono `modele-llm/chatgpt-vs-claude` + `modele-llm/przewodnik` przez WebSearch (Silnik A).
- **Blog świeży** – wszystkie modele/ceny aktualne na VI 2026: GPT-5.5 flagowy, Opus 4.8/Sonnet 4.6, Gemini 3.1 Pro/3.5 Flash, Mistral Large 2512 (0,50$/262K idealnie zgodne).
- **1 poprawka:** Sora w tabeli „marcu 2026" → „kwietniu 2026" (wewnętrzna sprzeczność – callout tego samego wpisu mówił poprawnie „26 kwietnia"; OpenAI: app off 26.04, ogłoszenie 24.03).
- **Flagi zostawione** (niepewne): Chatbot Arena 1561 Elo (teraz ~1569), DeepSeek R1 vs o3 (vs o1 + przestarzały V4), Gemini GPQA 94,3%.
- Pełny Silnik B (web_verify.py) nieuruchamiany – sanity Silnika A wystarczył. Wniosek: pełny przejazd 46 zbędny.

## Decyzje użytkownika
- Pogrubienia Gemini – **zostawione**. Konsolidacja powtórzonych liczb – **diff-guardowi** (rejected→ręcznie).
- Zakres Pass 1 – **tylko wygładzanie**, Pass 2 pominięty/sanity.
- 4 uparte HTML-rejecty – **zostawić w oryginale** (nie ruszać skilla).
- Pass 2 – **sanity 1-2 wpisy** zamiast pełnego 46.

## Commity (chronologicznie, na main, wypchnięte)
`a5ef8a1` prompt cytaty+link-fix → `0579cdb` glosy → `e1cf791` prompty → `92e34a5` agenci-ai → `b5daa81` rag → `eff80fa` modele-llm → `e159be2` ai-w-biznesie → `fad14ec` geo → `d5a7c4c` retry → `acabd31` raport → `7a1f578` fix Sora.

## Stan / odłożone
- **Pass 1 + Pass 2 sanity ZAMKNIĘTE.** Blog wygładzony i zweryfikowany faktycznie.
- **Możliwe ulepszenie skilla (TODO):** zamrażać całe bloki `<svg>…</svg>` i `<p>…</p>`/`<documents>…</documents>` jako pojedyncze tokeny (jak `<aside>`) – wtedy 4 uparte HTML-rejecty by przeszły.
- Throwaway w `/tmp`: `run_polish.py` (manifest z env `POLISH_MANIFEST`), `gloss_check.py` (post-check glos, normalizuje cudzysłowy), `diag_smoother2.py`.
- Klucz `OPENROUTER_API_KEY` z sesji (`sk-or-v1-3127…`) – do rotacji.
