# Spec: wygładzanie newsów widocznosc.ai (Gemini 3.1 Pro) + integracja z auto-pipeline

**Data:** 2026-06-07
**Status:** zaakceptowany (brainstorm), do napisania plan implementacji
**Kontekst:** newsy widocznosc.ai (`src/content/news/`) nie przechodzą przez wygładzanie
Gemini 3.1 Pro. Skill `widocznosc-blog-polish` celowo omija newsy
(`SKILL.md`: „NIE dla newsów", „Nie rusza newsów"). Newsy są generowane od razu
po polsku przez auto-pipeline (`pipeline/news-generator-widocznosc/`) + sporadyczne
ręczne korekty. Najświeższy news (android, 2026-06-03) poszedł prosto z generatora,
bez żadnej korekty językowej.

## Cel

1. **Część 1 (jednorazowo):** przepuścić 6 ostatnich newsów (29.05–03.06) przez
   wygładzanie Gemini 3.1 Pro.
2. **Część 2 (na stałe):** wpiąć wygładzanie w auto-pipeline newsów, żeby każdy
   przyszły news wychodził już wygładzony.

## Decyzje (z brainstormu)

| # | Decyzja | Wybór |
|---|---------|-------|
| 1 | Podejście | Pełny rewrite Gemini 3.1 Pro **+ ochrona głosu redakcji** |
| 2 | Punkt integracji | **In-process w `main.py`** (między `postprocess()` a zapisem) |
| 3 | Fail-safe | **Publikuj oryginał + loguj** (news nie przepada) |
| 4 | Zakres części 1 | **Ostatnie 6 newsów** (29.05–03.06) |
| 5 | Pole `lead:` | **Bez zmian** (frontmatter nie idzie do modelu – za darmo) |
| 6 | Ochrona głosu | Globalnie w smootherze (blockquote = cytat → poprawne też dla bloga) |

## Architektura

Sercem jest istniejący `pipeline/widocznosc-blog-polish/scripts/smoother.py`
(silnik blog-polish: protect → Gemini 3.1 Pro przez OpenRouter → diff-guard).
Newsy go **reużywają**, nie klonują.

### Zmiana w silniku: ochrona głosu redakcji

Do `PROTECT_PATTERNS` w `smoother.py` dochodzi wzorzec `BLOCKQUOTE`, który zamraża
markdownowy cytat (linie zaczynające się od `>`) przed wysłaniem do modelu – analogicznie
do dziś zamrażanego `<aside>` (CALLOUT). To chroni `> **Nasz komentarz:**` (głos ICEA)
przed parafrazą.

- Wzorzec łapie **ciąg kolejnych linii blockquote** (nie tylko pojedynczą), żeby objąć
  wielolinijkowe komentarze.
- Umiejscowienie w kolejności `PROTECT_PATTERNS`: razem z blokami (przy `CALLOUT`),
  przed wzorcami inline.
- **Wpływ na blog:** smoother jest współdzielony. Zamrażanie blockquote jest poprawnym
  zachowaniem także dla bloga (cytat = dosłowny); przejazd bloga (42/46) już zakończony,
  więc to nie regres, a poprawa przyszłych użyć.
- Akapity prozą typu „Naszym zdaniem…" **nie są** zamrażane – to normalna proza do
  wygładzenia; sensu pilnuje diff-guard (multizbiory liczb i nazw modeli).

## Komponenty

### Część 1 – jednorazowy przejazd (po zmianie silnika)

Uruchomienie `smoother.py` (CLI) na 6 plikach `src/content/news/*.md` z
`OPENROUTER_API_KEY` z lokalnego `.env`. Statusy per plik: `smoothed` / `unchanged` /
`rejected` (diff-guard) / `error`. Rejecty zostają w oryginale + raport. Commit paczką.

Pliki w zakresie:
- `internet-coraz-bardziej-pod-maszyny.md` (2026-05-29)
- `gdy-firmy-przesadzaja-z-ai.md` (2026-05-30)
- `softbank-planuje-do-75-mld-euro-na-centra-danych-we-francji.md` (2026-05-31)
- `minimax-m3-otwarty-model-milion-tokenow.md` (2026-06-01)
- `gemini-3-5-flash-agentowy-model-google.md` (2026-06-02)
- `android-dostaje-wykrywanie-podszywania-sie-w-polaczeniach.md` (2026-06-03)

### Część 2 – most `smooth_news` + integracja `main.py`

Cienki wrapper `smooth_news(text: str) -> str` (np.
`pipeline/news-generator-widocznosc/smoother_bridge.py`), który:

1. importuje funkcje ze `smoother.py` (dołożenie ścieżki skilla do `sys.path`),
2. czyta `OPENROUTER_API_KEY` z env; **brak klucza → log warning + zwrot oryginału**,
3. woła `process_text(text, load_rules(), call_fn)` gdzie
   `call_fn = lambda pb, r: call_openrouter(pb, r, key)`,
4. mapuje wynik: `smoothed` → tekst modelu (+log info); `unchanged` → oryginał;
   `rejected`/`error` → **oryginał + log warning z `detail`**.

`smooth_news` **nigdy nie rzuca wyjątku w górę** (fail-safe).

Wpięcie w `main.py`, między krokiem 10 (`postprocess`) a krokiem 11 (zapis):

```python
fm, body, errors = postprocess(...)
if errors:
    return
full_md  = build_markdown(fm, body)
final_md = smooth_news(full_md)        # fail-safe
output_path.write_text(final_md, encoding="utf-8")
```

`lead:` jest we frontmatterze, którego `smoother.split_frontmatter` nie wysyła do
modelu → zostaje nietknięty zgodnie z decyzją #5.

**Reguły promptu:** w planie zweryfikować, że `load_rules()` (reguły wygładzania prozy)
są bezpieczne dla newsa. Ryzyko z pamięci dotyczyło reguł struktury/frontmattera, a nie
prozy; smoother nie wysyła frontmattera, więc ryzyko jest niskie. Jeśli reguły zawierają
elementy blogowe psujące newsa – rozważyć osobny, lekki zestaw reguł prozy dla newsów.

### Workflow + sekret

W `.github/workflows/widocznosc-news.yml`, w `env:` kroku „Run news pipeline":

```yaml
OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
```

**Akcja użytkownika:** dodać sekret `OPENROUTER_API_KEY` w Settings repo GitHub.
Bez sekretu pipeline działa dalej (fail-safe) – tylko bez wygładzania.

## Fail-safe (decyzja #3)

Każda ścieżka błędu kończy się publikacją oryginalnego newsa + ostrzeżeniem w logu:
- brak `OPENROUTER_API_KEY`,
- status `rejected` (diff-guard wykrył ruszony fakt/nazwę modelu),
- błąd API / pusta odpowiedź modelu.

Codzienny news zawsze się publikuje; brak wygładzania to ostrzeżenie w logu CI,
nie dziura w feedzie.

## Testy (TDD)

- **smoother (jednostkowy):** `BLOCKQUOTE` protect zamraża `> **Nasz komentarz:**`
  (jedno- i wielolinijkowy); restore odtwarza go 1:1.
- **smooth_news:** brak klucza → oryginał; `rejected` → oryginał; `error` → oryginał;
  `smoothed` → tekst modelu (call_fn mockowany).
- **regresja:** istniejące testy `news-generator-widocznosc` przechodzą
  (`postprocess` niezmieniony; integracja nie psuje istniejącego flow).

## Kolejność prac

1. Smoother: `BLOCKQUOTE` protect + test (TDD).
2. Część 1: przejazd 6 newsów ulepszonym smootherem + commit + raport.
3. Część 2: most `smooth_news` + integracja `main.py` + testy + `env` w workflow YAML.
4. (Użytkownik) sekret `OPENROUTER_API_KEY` w GitHub.

## Poza zakresem (YAGNI)

- Wygładzanie pola `lead:` ani innych pól frontmattera.
- Manifest idempotencji dla newsów (część 1 to jednorazowy przejazd; część 2 wygładza
  w locie przy generacji).
- Osobny model/silnik dla newsów – reużywamy blog-polish.
