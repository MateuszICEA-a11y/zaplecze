# Sesja 2026-07-28 cz. 3 – research bez Ahrefs + redesign edytora Content Watchera

Stan: **wszystko na produkcji** (commity `fe95669…3b68ab8`, wypchnięte, Worker
zdeployowany przez Workers Builds, migracje D1 wykonane). Jutro planowane
poprawki – ta notatka jest punktem startu.

## Część 1: research fraz z Senuto + SerpData zamiast Ahrefs (`fe95669`)

Problem zgłoszony przez Mateusza: jeden przejazd content-refreshera zjadał
~900 jednostek Ahrefs przy pakiecie 1000/mies. – błąd projektowy.

- **Frazy → Senuto** `keywords_analysis/reports/keywords/getKeywords`:
  `data_fetch_mode: "url"` działa też dla cudzych adresów, a `value` przyjmuje
  listę URL-i w JEDNYM wywołaniu (5× Ahrefs `organic-keywords` → 1 request).
  Gotcha: ta baza NIE zna bazy 2.0 – `country_id` musi być `1` (Analiza
  Widoczności nadal `200`). Tryb `narrow`, nie `wide` (wide dorzuca śmieci).
- **SERP → SerpData** (`api.serpdata.io/v1/search`, klucz wspólny z bas-3,
  w `.env` i GH Secrets jako `SERPDATA_API_KEY`): ten sam TOP10 co Ahrefs,
  a do briefu dodatkowo **AI Overview, People Also Ask, related searches**
  (prompt brief v1.1.0 każe traktować PAA jako popyt i pisać pod cytowalność
  przy obecnym AI Overview). Gotcha: bez własnego User-Agenta SerpData
  zwraca 403; bywa też chwilowe 503 → retry ×3.
- Budżet: `ahrefs_units` → `serp_requests` (limit 2/zadanie); Senuto tylko
  liczone informacyjnie. Fixture `tests/fixtures/blad-403.json` przegenerowany
  z nowych źródeł.
- **Naprawiony bug przy okazji**: `USER_AGENT` w config.py miał polskie znaki –
  nagłówki HTTP idą jako latin-1, więc KAŻDE pobranie strony konkurencji
  (krok `competitors`) padało po cichu wyjątkiem kodowania. Brief nigdy nie
  widział nagłówków konkurencji. Teraz ASCII.

## Część 2: redesign edytora (5 paczek, `7f041d5…3b68ab8`)

Uwagi Mateusza do pierwszej wersji: UX leży, brak treści w edytorze, brak
realnego paska postępu, nieznana konfiguracja modeli, ekspert nie powinien być
checkboxem z góry.

1. **Modele per zadanie** (`7f041d5`): `POST /api/cw/jobs {models}` → kolumna
   `jobs.models` → `client_payload` → `run.py --model-research/--model-writer`.
   Walidacja formatem ID (nie whitelistą – lista jest dynamiczna). Naprawiony
   bug: dispatch nie wysyłał `title`/`author`. Migracja 0002 (author, models,
   expert) wykonana na zdalnej D1 PRZED deployem.
2. **Proxy treści** (`088ed44`): `GET /api/cw/content/:domain/:post_type/:id` –
   Worker pobiera wpis z WP REST (`acf_format=standard&_fields=…`), mapuje
   pary `page_title_h2_N`/`page_text_N` (port `sections.snapshot`), cache 60 s,
   limit 2 MB, UA `content-refresher` (WAF seohost). Whitelist domen:
   `CW_DOMAINS` w `wrangler.toml [vars]` (format `domena=base_url`).
   **Zweryfikowane z produkcji: WAF nie blokuje IP Cloudflare.**
3. **Edytor = dokument** (`6d69b56`): treść od razu, typografia `.prose`
   (nowa w theme.css, z `blockquote.expert`), sanityzacja DOM-owa z whitelistą
   tagów (jedna funkcja dla każdego renderu HTML). Jeden pasek postępu
   (krok X z Y liczone z wybranych ulepszeń · nazwa kroku · timer), szczegóły
   kroków w `<details>`. Selecty modeli zasilane z `openrouter.ai/api/v1/models`
   (fetch z przeglądarki, ~341 modeli, wybór w localStorage). Diff inline
   w sekcjach dokumentu: tryby zmiany/podgląd po/oryginał, heurystyka
   changeRatio>0.5 → start od „podgląd po", side-by-side usunięty. Tokeny CSS
   naprawione (poprzednio `--line`/`--surface`/`--accent` NIE ISTNIAŁY
   w design systemie → przezroczyste bordery).
4. **Ekspert jako etap finalny** (`0c68132`): zniknął z checkboxów
   (`IMPROVEMENTS` bez `expert`; run.py wciąż go wspiera dla ręcznego
   workflow_dispatch). Po `done` karta „Etap finalny" → `POST
   /api/cw/jobs/:id/expert` → Worker woła OpenRouter bezpośrednio
   (`cw-expert.js` – port promptu expert.md + EXPERTS z run.py, komentarze
   krzyżowe), wynik w `jobs.expert` JSON. **text_after zostaje czysty** –
   „kopiuj treść" dokleja blockquote po stronie frontu. Guard przed podwójnym
   kliknięciem: warunkowy UPDATE na `json_extract`. `PATCH {rejected:true}`
   odrzuca. Sekret `OPENROUTER_API_KEY` wgrany do Workera.
5. **Edycja inline** (`e5e3f93`): tryb „podgląd po" jest contenteditable,
   „zapisz poprawki" → `PATCH sections {text_after}` z sanityzacją serwerową
   (regexowa – Worker nie ma DOMParsera) + limit 64 KB, kolumna
   `job_sections.edited` (migracja 0003, wykonana). Serwer odsyła wersję po
   sanityzacji i ona jest prawdą.
   Fix `3b68ab8`: cytat eksperta nakładany ponownie, gdy treść dokumentu
   wczyta się później niż stan zadania.

## Weryfikacja

31/31 testów Workera (`node --test cw-api.test.js`), 38 testów pipeline'u
(unittest), build Astro OK. E2E na lokalnym Workerze z zasianą D1 (zrzuty:
stan przed uruchomieniem, stan done z diffami i kartą eksperta, edycja inline
z zapisem). Z produkcji: proxy treści zwraca 200 z sekcjami ACF.

## Otwarte / na jutro

- Przejazd pipeline'u end-to-end z nowego UI (dispatch → callbacki → diff
  w dokumencie) nie był jeszcze robiony po redesignie – pierwsza rzecz do
  sprawdzenia.
- Ekspert: pierwszy realny cytat z produkcji do oceny jakości promptu.
- Lista modeli OpenRoutera w datalist bez filtra (pełne ~341 pozycji) – można
  zawęzić do modeli chat/tekstowych.
- `senuto_positions` (pozycje z bazy 2.0 filtrowane per URL) zwraca pustkę dla
  wpisu o 403 mimo pozycji 26 w GSC – jeśli powtórzy się na innych wpisach,
  sprawdzić filtrowanie po ścieżce.
- Duplikaty z komentarzami krzyżowymi do pilnowania: STEP_ORDER/OPTIONAL_STEP
  (edytor ↔ config.py), EXPERTS + prompt (cw-expert.js ↔ run.py),
  DEFAULT_MODELS (edytor ↔ cw-api.js ↔ config.py), whitelist sanityzacji
  (edytor ↔ cw-api.js).
- `callback_nonces` w D1 nadal bez GC (rośnie w nieskończoność) – drobiazg.
