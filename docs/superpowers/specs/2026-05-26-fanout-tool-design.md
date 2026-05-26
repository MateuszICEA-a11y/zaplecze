# Spec: narzędzie Fan-out ChatGPT na widocznosc.ai

**Data:** 2026-05-26
**Branch:** `feat/fanout-tool`
**Autor:** Mateusz + Claude

## Cel

Publiczne narzędzie na `widocznosc.ai`, które pokazuje **fan-out queries** ChatGPT
(sub-zapytania, jakie model generuje przy `web_search`) oraz **które domeny są cytowane**
w odpowiedzi. Główny przekaz GEO: „zobacz, jak ChatGPT naprawdę szuka i kogo cytuje".
Narzędzie służy jako demo edukacyjne i lead-gen, spójne z istniejącymi narzędziami w `/narzedzia/`.

Punktem wyjścia jest metoda z artykułu Nectiv (Chris Long): od ChatGPT 5.4 fan-outy zniknęły
z konsoli, ale są dostępne przez OpenAI **Responses API** w obiektach `web_search_call.action`.

## Zakres (co robimy / czego nie)

**Robimy:**
- Stronę narzędzia `src/pages/narzedzia/fanout.astro` (URL: `/narzedzia/fanout`).
- Funkcję backendową `functions/api/tools/fanout.ts` (endpoint `POST /api/tools/fanout`).
- Rate-limiting przez Cloudflare KV: **3 zapytania / IP / dzień**.
- Wpis narzędzia na liście w `src/pages/narzedzia.astro`.
- Minimalny setup testowy (vitest) + test parsera odpowiedzi na fixture.

**Nie robimy (YAGNI):**
- Logowania / kont użytkowników.
- Zapisu historii zapytań w bazie.
- Porównywania wielu modeli (to robi już brand-check).
- Eksportu wyników (CSV/PDF) — ewentualnie w przyszłości.

## Architektura

Dwie warstwy, zgodnie z istniejącym wzorcem (`url-check`, `brand-check`, `ai-bots-check`):

```
Przeglądarka (fanout.astro, fetch)
        │  POST /api/tools/fanout  { query }
        ▼
Cloudflare Pages Function (fanout.ts)
        │  1. walidacja query
        │  2. rate-limit (KV: fanout:<IP>)
        │  3. fetch → OpenAI Responses API (web_search)
        │  4. parsowanie output[] → fan-outy + cytowania
        │  5. agregacja domen
        ▼
JSON { query, status, fanoutQueries[], citedDomains[], citations[], usage, fetchedAt }
```

### Backend: `functions/api/tools/fanout.ts`

**Wejście:** `POST { query: string }`.

**Walidacja:** trim; min 3 znaki; max 300 znaków; w przeciwnym razie `400`.

**Rate-limit (KV):**
- Binding KV o nazwie `FANOUT_RL`.
- Klucz: `fanout:<CF-Connecting-IP>`. Wartość: licznik. TTL: do najbliższej północy (Europe/Warsaw, liczone w sekundach).
- Limit: `FANOUT_DAILY_LIMIT` (domyślnie **3**). Po przekroczeniu → `429` z JSON `{ error, remaining: 0, resetAt }` i komunikatem PL.
- **Licznik inkrementujemy dopiero po udanej odpowiedzi z OpenAI** — błąd API nie zżera próby użytkownika.

**Wywołanie OpenAI:**
- `fetch('https://api.openai.com/v1/responses', …)` (nie SDK — w Workers lżej, spójnie z brand-check).
- Nagłówek `Authorization: Bearer <OPENAI_API_KEY>`.
- Body: `{ model, tools:[{type:"web_search"}], tool_choice:"auto", input: query }`.
- Model: stała `MODEL` z env `FANOUT_MODEL`, **domyślnie `gpt-5-mini`** (kontrola kosztów; bogatszy output; spójne z brand-check). Flip na `gpt-5.4` = zmiana env, bez kodu.
- Timeout 45 s przez `AbortController`.

**Parsowanie `output[]`:**
- Fan-outy: items typu `web_search_call` → `action.query` (string) oraz `action.queries` (lista) — zbieramy oba warianty (różne wersje API).
- Cytowania: items typu `message` → `content[].annotations[]` gdzie `type === "url_citation"` → `{ title, url, domain }`.
- Agregacja domen: grupowanie cytowań per domena (`hostname` bez `www.`), liczba wystąpień, lista URL; sort malejąco po liczbie.

**Wyjście (200):**
```jsonc
{
  "query": "…",
  "model": "gpt-5-mini-…",
  "status": "ok",            // ok | no-search | partial
  "fanoutQueries": ["…"],
  "citedDomains": [{ "domain": "…", "count": 3, "urls": ["…"] }],
  "citations": [{ "title": "…", "url": "…", "domain": "…" }],
  "usage": { "remaining": 2, "limit": 3, "resetAt": "2026-05-27T00:00:00+02:00" },
  "fetchedAt": "2026-05-26T…"
}
```
- `status: "no-search"` gdy model nie uruchomił web_search (brak fan-outów) — frontend pokazuje czytelny komunikat.

**Stany błędów (spójne z brand-check):**
- `config-error` / `500` — brak `OPENAI_API_KEY` (przyjazny komunikat, brak inkrementu KV).
- `429` — przekroczony limit.
- `500` — błąd/timeout OpenAI (komunikat „spróbuj ponownie", brak inkrementu KV).
- Zawsze: `Content-Type: application/json; charset=utf-8`, `Cache-Control: no-store`.
- `onRequestGet` → `405` z podpowiedzią użycia POST.

### Frontend: `src/pages/narzedzia/fanout.astro`

- Layout, dark/light, meta SEO, hero — kopiujemy konwencję z `brand-check.astro`.
- **Hero:** nagłówek „Zobacz, jak ChatGPT naprawdę szuka — i kogo cytuje" + 1 zdanie wyjaśnienia.
- **Input:** pole na zapytanie + 2-3 klikalne przykłady (np. „najlepsza agencja SEO w Polsce", „jak wybrać system CRM", „najlepszy bank dla firmy 2026").
- **Po wysłaniu** (vanilla JS `fetch` → `/api/tools/fanout`):
  - **Sekcja 1 — Fan-out queries:** numerowana lista sub-zapytań.
  - **Sekcja 2 — Kto jest cytowany:** ranking domen wg liczby cytowań (główny insight), z rozwijalną listą URL-i źródeł.
  - Licznik pozostałych prób; po wyczerpaniu — CTA do kontaktu/usług.
- Jedno zdanie pod wynikami: „Wyniki odzwierciedlają warstwę wyszukiwania ChatGPT (model `gpt-5-mini`)."
- **Miękki limit** w `localStorage` (blokada przycisku dla UX); twardy limit zawsze po stronie KV.

### Lista narzędzi: `src/pages/narzedzia.astro`
- Dodanie kafelka narzędzia (tytuł, opis, link do `/narzedzia/fanout`), zgodnie z istniejącym formatem.

## Konfiguracja / sekrety

- **`OPENAI_API_KEY`** — env var w Cloudflare Pages (Production + Preview). Nie w repo.
- **`FANOUT_MODEL`** — opcjonalny env, domyślnie `gpt-5-mini`.
- **`FANOUT_DAILY_LIMIT`** — opcjonalny env, domyślnie `3`.
- **KV namespace `FANOUT_RL`** — utworzyć przez `wrangler kv namespace create FANOUT_RL` (+ `--preview`), dodać binding w `wrangler.toml` i w ustawieniach projektu Pages.

## Testy

- Brak obecnego setupu testowego → dodać minimalny **vitest** (`vitest.config.ts` + skrypt `test` w `package.json`).
- **Test parsera** na fixture z prawdziwej odpowiedzi (`~/fanout/results/raw_*.json` skopiowany do `functions/api/tools/__fixtures__/`):
  - poprawne wyciągnięcie fan-outów (string i lista),
  - poprawne wyciągnięcie cytowań,
  - agregacja domen (liczby, sort, deduplikacja URL).
- **Test walidacji inputu** (za krótkie / za długie / puste).
- **Test logiki rate-limitu** z mockiem KV (poniżej i powyżej limitu, brak inkrementu przy błędzie).

## Koszty

`gpt-5-mini` + `web_search`: rząd kilku groszy / zapytanie (web_search to główny koszt, taki sam dla każdego modelu). Przy 3/IP/dzień i ochronie KV — pomijalne, odporne na spike.

## Kryteria akceptacji

1. `POST /api/tools/fanout { query }` zwraca fan-outy + zagregowane cytowane domeny dla realnego zapytania.
2. Czwarte zapytanie z tego samego IP w ciągu doby → `429` z czytelnym komunikatem PL i `resetAt`.
3. Brak `OPENAI_API_KEY` → przyjazny `config-error`, bez wywołania OpenAI.
4. Strona `/narzedzia/fanout` renderuje obie sekcje, działa w dark/light, jest na liście narzędzi.
5. Testy parsera, walidacji i rate-limitu przechodzą (`pnpm --filter widocznosc.ai test`).
6. Brak sekretów w repo; klucz tylko w env Cloudflare.
