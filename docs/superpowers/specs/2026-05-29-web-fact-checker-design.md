# Web Fact-Checker – design (spec)

**Data:** 2026-05-29
**Status:** do akceptacji
**Autor:** Mateusz (ICEA) + Claude

## Problem

Treści o modelach AI na widocznosc.ai (`src/content/blog/modele-llm/` i pokrewne) zawierają fakty, które szybko się starzeją: nazwy modeli, ceny API i planów, benchmarki, okna kontekstowe, daty wydania i cutoff. W jednej sesji (2026-05-29) ręcznie wykryto i poprawiono m.in.: wpis o ChatGPT opisujący GPT-4o/o1/DALL-E (stan 2024) mimo daty 2026, Opus 4.7 zamiast 4.8 po premierze nowego modelu, okno kontekstowe Claude podane jako 200K zamiast aktualnych 500K (czat) / 1M (API).

Przyczyna źródłowa: **wiedza parametryczna każdego modelu ma cutoff**. Jedyne wiarygodne źródło aktualności to **live web**. Potrzebny jest powtarzalny skill, który systematycznie weryfikuje fakty nietrwałe w sieci i nanosi poprawki.

## Cel

Skill, który dla wskazanego pliku / katalogu / glob:
1. wyciąga twierdzenia nietrwałe,
2. weryfikuje je w sieci **dwoma niezależnymi, ugruntowanymi w sieci silnikami** (WebSearch + GPT-5.5 z `web_search`),
3. nanosi poprawki w working tree (auto-apply),
4. zwraca raport z cytowaniami + `git diff` do przeglądu przez użytkownika (skill NIE commituje).

## Decyzje (uzgodnione)

| Wymiar | Decyzja |
|---|---|
| Zakres | Dowolna ścieżka podana przy wywołaniu (plik / katalog / glob) |
| Silnik web (primary) | Wbudowany WebSearch |
| Silnik web (weryfikator) | GPT-5.5 przez OpenAI Responses API z narzędziem `web_search` |
| Output | Auto-apply w working tree + raport + `git diff` |
| Granularność | Single + batch |
| Commit | Nie – diff zostaje dla użytkownika (flow: review → „push") |

## Architektura – podejście A (ekstrakcja → weryfikacja → reconcile → apply)

```
Faza 1  Ekstrakcja        (Claude)            → lista twierdzeń {linia, typ, cytat, wartość, podejrzenie_historyczne}
Faza 2  Dedupe            (Claude)            → unikalne fakty (ten sam fakt w N miejscach = 1 weryfikacja)
Faza 3a Weryfikacja A     (Claude+WebSearch)  → werdykt + poprawna wartość + URL + data źródła
Faza 3b Weryfikacja B     (GPT-5.5+web_search)→ niezależny werdykt + przeoczone twierdzenia
Faza 4  Reconcile         (Claude)            → zgoda=apply; rozbieżność=flaga
Faza 5  Apply + raport    (Claude/Edit)       → poprawki w working tree + raport + git diff
```

### Dwa silniki – uzasadnienie

Oba silniki mają **własny live web** → niezależne ugruntowanie, realna szersza perspektywa. „Czysty" LLM bez wyszukiwania (parametryczny) jest świadomie wykluczony, bo reintrodukowałby bug staleness (GPT-5.5 cutoff = grudzień 2025; nie zna np. Opus 4.8 z 28.05.2026 bez wyszukiwania).

Podział ról:
- **WebSearch (A)** – primary retrieval + szkic werdyktów.
- **GPT-5.5 + web_search (B)** – adwersarska weryfikacja **osądu**, nie retrievalu: (1) historyczne vs podane-jako-aktualne, (2) czy źródło faktycznie potwierdza liczbę, (3) twierdzenia przeoczone przez A.

## Taksonomia twierdzeń nietrwałych (przewodnik ekstrakcji)

Lista mówi *czego szukać*, ale ekstrakcja nie jest do niej ograniczona:
- Nazwy modeli + status „najnowszy / flagowy / aktualny".
- Ceny: API (per-token in/out, cached) oraz plany subskrypcji.
- Benchmarki (SWE-bench Verified/Pro, HumanEval, MRCR itp.) – **liczba i nazwa modelu traktowane razem**.
- Okna kontekstowe / limity tokenów (z rozróżnieniem czat vs API gdzie istotne).
- Daty wydania, daty odcięcia (cutoff).
- Tiery planów i ich limity / nazwy.
- Twierdzenia „X wycofany / zamknięty / dostępny od [data]".

## Reguły bezpieczeństwa (twarde – trafiają do SKILL.md)

1. **Historyczne zostają.** Twierdzenie świadomie opisujące przeszłość (np. „Claude 3.5 Sonnet i GPT-4o osiągają…" w sekcji o nasyconych benchmarkach; „poprzedni Opus 4.7 – 87,6%") NIE jest poprawiane. Poprawiamy tylko fakt **podany jako bieżący**.
2. **Benchmark: nazwa + liczba razem.** Nigdy nie podstawiamy starej liczby pod nową nazwę modelu. Zmiana wymaga aktualnej liczby z aktualnym źródłem.
3. **`date:` we frontmatter to NIE dowód aktualności.** Ignorowane przy decyzjach faktycznych.
4. **Niuanse i atrybucja zachowane** (np. „500K w czacie / 1M w API i Claude Code", nie zlanie do jednej liczby).
5. **Alt-teksty statycznych obrazków (PNG) nietknięte.** Jeśli alt opisuje nieaktualną wartość z infografiki – tylko flaga „regeneracja obrazka TODO", bez edycji alt (uniknięcie rozjazdu obraz↔alt).
6. **Niejednoznaczne / brak twardego źródła → flaga, nie ruszać.** Auto-apply tylko przy jednoznacznym werdykcie z URL.
7. **Rozbieżność silników A vs B → flaga.** Apply wyłącznie przy zgodzie obu (wartość ORAZ klasyfikacja historyczne/aktualne).
8. Skill modyfikuje **wyłącznie fakty nietrwałe** – nie rusza stylu, struktury, treści merytorycznej poza zakresem.

## Reconcile – logika decyzji

| Werdykt A | Werdykt B | Akcja |
|---|---|---|
| AKTUALNE | AKTUALNE | zostaw |
| PRZESTARZAŁE/BŁĘDNE (wartość X) | to samo (wartość X) | **apply X** + log źródeł |
| różne wartości | różne wartości | **flaga** (pokaż oba + źródła) |
| „aktualne" | „historyczne" (lub odwrotnie) | **flaga** (klasyfikacja sporna) |
| nie wykrył | wykrył nowe twierdzenie | dodaj do listy → zweryfikuj → wg powyższych |
| jednoznaczne, brak B (B padł) | – | apply tylko jeśli A ma twarde źródło; inaczej flaga |

## Wywołanie

- Slash: `/web-fact-check <ścieżka | katalog | glob>`. Puste → zapytaj o cel.
- Triggery PL: „fact-check web", „sprawdź aktualność", „zweryfikuj fakty w sieci <path>", „przejedź fact-checkiem".

## Tryb batch

1. Glob → lista plików; pomiń `_index.md` i stuby (< ~500 znaków body).
2. Pokaż plan: lista, liczba, szacowany koszt (liczba zapytań × stawka GPT-5.5 web_search).
3. Sekwencyjnie, jeden plik = pełny flow (A+B). Kontynuuj po błędzie pojedynczego pliku.
4. Tabela zbiorcza: `plik | sprawdzone | poprawione | flagi | status`.

## Format raportu (per plik)

```
📄 chatgpt.md  · 7 twierdzeń · 4 wyszukiwania (A) · zgodność A/B 6/7
🔧 Poprawiono 3:
  L98 plan Plus: GPT-4o → GPT-5.5        [openai.com/pricing · 2026-05]
  L82 okno: 200K → 500K (czat)/1M (API)  [support.claude.com · 2026-05]
  ...
🚩 Do decyzji 1:
  L70 HumanEval 90,2% (GPT-4o) – A: historyczne (zostaw); B: aktualne. Rozbieżność → potwierdź.
```
Na końcu (single) lub po batchu: `git diff` zmienionych plików.

## Pliki skilla

- `pipeline/web-fact-checker/SKILL.md` – pełna logika (taksonomia, reguły, prompty A/B, reconcile, batch, format).
- `.claude/commands/web-fact-check.md` – slash command → wskazuje SKILL.md, przekazuje `$ARGUMENTS`.

(Wzór wiringu jak `.claude/commands/fact-check.md` → `pipeline/fact-checker/SKILL.md`.)

## Klucz OpenAI (do rozwiązania w 1. kroku implementacji)

- Skill BusManiak odwołuje się do `reference_openai_api.md` w pamięci – plik **nieobecny** w bieżącym indeksie. Notatka „stan kluczy/infra" w `project-2026-05-29-sesja-podsumowanie.md`.
- Pierwszy krok implementacji: ustalić właściwe źródło klucza (pamięć / `pipeline/content-writer/references/api-credentials.md` / env). **NIGDY nie hardkodować klucza w plikach commitowanych** – przekazywać przez zmienną środowiskową.
- Fallback degradacji: jeśli klucz/silnik B niedostępny → skill działa w trybie single-engine (A) i wyraźnie to raportuje (`⚠️ weryfikator B pominięty`), bez cichego pomijania.

## Czego skill świadomie NIE robi (YAGNI / poza zakresem v1)

- Nie regeneruje obrazków (tylko flaga TODO).
- Nie commituje ani nie pushuje.
- Nie poprawia stylu, gramatyki, struktury, linków – tylko fakty nietrwałe.
- Nie weryfikuje twierdzeń „ponadczasowych" (definicje, mechanizmy działania) – fokus na danych z datą ważności.

## Kryteria sukcesu

- Na wpisie `chatgpt.md` (przed dzisiejszymi poprawkami) skill wykrywa i poprawia: GPT-4o→GPT-5.x w tabeli planów, cutoff, ekosystem; zostawia wzmianki historyczne.
- Na `claude-vs-chatgpt-programowanie.md` zostawia GPT-4o w HumanEval (historyczne), poprawia cennik bieżący.
- Każda zniesiona poprawka ma w raporcie URL źródła + datę.
- Zero edycji przy werdyktach niejednoznacznych (trafiają na listę flag).
```
