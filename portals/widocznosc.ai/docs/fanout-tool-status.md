# Narzędzie Fan-out ChatGPT — status prac

**Data:** 2026-05-26
**Status:** ✅ ZBUDOWANE, ZMERGOWANE DO `main`, ZDEPLOYOWANE I ZWERYFIKOWANE E2E NA ŻYWO

## Co to jest

Publiczne narzędzie `/narzedzia/fanout` pokazujące **fan-out queries** ChatGPT (realne sub-zapytania wysyłane do web_search) oraz **ranking cytowanych domen** dla danego zapytania. Cel: demo GEO + lead-gen. Limit **3 zapytania / IP / dzień** (Cloudflare KV).

- Spec: `docs/superpowers/specs/2026-05-26-fanout-tool-design.md`
- Plan: `docs/superpowers/plans/2026-05-26-fanout-tool.md`

## Działa na żywo

👉 https://widocznosc-ai.pages.dev/narzedzia/fanout

Endpoint zweryfikowany realnym wywołaniem (zwraca fan-outy + cytowane domeny z OpenAI). `gpt-5-mini` + web_search przez OpenAI **Responses API**.

## Architektura (pliki)

| Plik | Rola |
|------|------|
| `functions/_lib/fanout-parse.ts` (+ test) | Parser `output[]`: fan-outy, cytowania, agregacja domen |
| `functions/_lib/rate-limit.ts` (+ test) | Logika limitu dziennego + sekundy do północy (Warszawa) |
| `functions/api/tools/fanout.ts` | Endpoint `POST /api/tools/fanout` (walidacja → KV → OpenAI → parse → JSON) |
| `src/pages/narzedzia/fanout.astro` | Strona (formularz + render 2 sekcji) |
| `src/pages/narzedzia.astro` | Kafelek na liście narzędzi |
| `wrangler.toml` | Binding KV `FANOUT_RL` |

Testy: `pnpm --filter widocznosc.ai test` → 12/12. Build: 71 stron OK.

## Konfiguracja deploya (zrobione)

- **KV namespace** `FANOUT_RL`, id `4de520904f874cca893800bd54773910` — binding wpięty w `wrangler.toml` (ten projekt Pages zarządza bindingami z pliku, nie z panelu).
- **Sekret** `OPENAI_API_KEY` — ustawiony w panelu Cloudflare Pages projektu `widocznosc-ai` (Settings → Variables and Secrets).
- Domyślny model `gpt-5-mini` (override: env `FANOUT_MODEL`), limit (override: env `FANOUT_DAILY_LIMIT`).

## ⏳ Do zrobienia później

**Podpięcie domeny `widocznosc.ai`** (obecnie celowo niepodpięta — redesign w toku):
- Jeśli domena trafi na projekt **`widocznosc-ai`** → zadziała od razu (KV + sekret już są).
- Jeśli na projekt **`zaplecze`** → dodać tam sekret `OPENAI_API_KEY` w panelu (binding KV wejdzie sam z `wrangler.toml`).

## Uwagi / gotchas

- **Dwa projekty CF Pages** z tego repo: `widocznosc-ai` i `zaplecze` — oba auto-deployują `main`.
- Bindingi → `wrangler.toml`; sekrety → panel Pages (sekret wymaga świeżego deployu, by zadziałać).
- Bez podłączonego KV limit jest omijany (endpoint bez metrowania kosztów) — KV jest warunkiem koniecznym, już spełnionym.

## Możliwe rozszerzenia (pomysły, nie zrobione)

- Przykładowe zapytania branżowe pod klientów.
- Eksport wyników do CSV.
- Tryb batch / porównanie fan-outów między zapytaniami.
