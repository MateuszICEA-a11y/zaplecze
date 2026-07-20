# Dashboard analityczny zaplecza

Dashboard postępów domen z sekcjami per projekt (Przegląd / Senuto / GSC / Ahrefs / Clarity / Leady): widoczność SEO z listą rankujących fraz (Senuto), Google Search Console z frazami i stronami (okno 28 dni), profil linków z listą domen linkujących (Ahrefs, fallback DataForSEO), zachowania użytkowników (Microsoft Clarity), leady i użycia narzędzi widocznosc.ai oraz kredyty SMSAPI i OpenRouter.

**URL produkcyjny:** https://zaplecze-dashboard.m-wisniewski.workers.dev

## Architektura

```
GH Actions cron (04:30 UTC) → collector (Python) → commit JSONL+JSON do dashboard/data/
                                                        ↓ push na main
                              Cloudflare Workers Builds (git) → build Astro → *.workers.dev
                                                                (worker.js: Basic Auth na /:domena/leady/)
```

- `domains.yaml` – konfiguracja domen i źródeł
- `collector/` – Python 3.12, stdlib urllib + pyyaml; jedno padnięte źródło nie blokuje reszty (status w snapshotcie: `ok` / `error` / `token_expired` / `not_configured`)
- `data/<domena>/snapshots.jsonl` – 1 linia dziennie per domena (szczupłe podsumowania do wykresów); `data/_global/` – salda kont
- `data/<domena>/details.json` – najświeższe listy (frazy Senuto, frazy+strony GSC, domeny linkujące, wymiary Clarity, leady); nadpisywane w całości, źródło które padło zachowuje wczorajszą listę
- `data/<domena>/leads.jsonl` – kumulacyjne archiwum leadów/użyć (KV na widocznosc.ai trzyma wpisy 90 dni, archiwum w repo bezterminowo; dedupe po `id`)
- `app/` – Astro 6 + uPlot, statyczny build czytający dane w build time; `app/worker.js` – Basic Auth na zakładkach leadów (sekret `DASH_PASSWORD`, fail-closed)

## Leady z widocznosc.ai

Funkcje Pages na widocznosc.ai zapisują do KV (binding `FANOUT_RL`, TTL 90 dni):

- `lead:<ts>:<rand>` – leady: formularz `/kontakt/` oraz raporty narzędzi (tożsamość zweryfikowana SMS-em, ze zgodą/bez)
- `usage:<ts>:<rand>` – użycia narzędzi (fanout / brand-check / url-check / ai-boty: zapytanie, domena, URL) oraz częściowe leady z wysyłki kodu SMS (ktoś zostawił numer, nie dokończył)

Eksport: `GET https://widocznosc.ai/api/admin/leads-export` z nagłówkiem `Authorization: Bearer <LEADS_EXPORT_TOKEN>`; collector zaciąga go codziennie do `leads.jsonl` + `details.json`.

## Uruchomienie lokalne

```bash
# collector (klucze z env albo .env w repo root)
python3 dashboard/collector/main.py

# frontend
pnpm install
pnpm --filter dashboard dev      # dev server
pnpm --filter dashboard build    # → dashboard/app/dist
```

## Konfiguracja jednorazowa (kroki manualne)

1. **GitHub Secrets** (repo → Settings → Secrets and variables → Actions):
   - `SENUTO_API_KEY` – JWT z Senuto (⚠️ rotacja ~31 dni; wygasły token = banner „token wygasł" na dashboardzie, cron się nie wywala)
   - `SMSAPI_TOKEN` – ten sam co w Cloudflare Pages widocznosc.ai
   - `AHREFS_API_KEY` – klucz API v3 (linki: backlinki, referring domains, Domain Rating)
   - `OPENROUTER_PROJECT_KEY` – klucz OpenRouter zdefiniowany dla projektu (np. ten z CF Pages widocznosc.ai); `GET /api/v1/key` zwraca jego zużycie
   - `GSC_SERVICE_ACCOUNT_JSON` – pełny JSON klucza konta serwisowego GCP z włączonym Search Console API; e-mail konta serwisowego musi być dodany jako użytkownik property w GSC (wystarczy „Ograniczony")
   - `CLARITY_API_TOKEN` – token Data Export API (panel Clarity → projekt → Settings → Data Export → Generate new API token); limit 10 wywołań/dzień, collector zużywa 4
   - `LEADS_EXPORT_TOKEN` – losowy token (np. `openssl rand -hex 24`); ten sam sekret w **dwóch** miejscach: GitHub Actions **i** Cloudflare Pages widocznosc.ai (Settings → Variables and Secrets)
   - (już istnieją: `DATAFORSEO_LOGIN`, `DATAFORSEO_PASSWORD`, `OPENROUTER_API_KEY`)
2. **Sekret dashboardu**: Workers → `zaplecze-dashboard` → Settings → Variables and Secrets → `DASH_PASSWORD` – hasło Basic Auth do zakładek `/:domena/leady/` (login dowolny). Bez sekretu zakładka zwraca 503 (fail-closed), reszta dashboardu pozostaje publiczna.
3. **Cloudflare Workers Builds**: Workers & Pages → Create → Import a repository → repo `zaplecze`:
   - Project name: `zaplecze-dashboard`
   - Root directory: `dashboard/app`
   - Build command: `pnpm install --frozen-lockfile && pnpm build`
   - Deploy command: `npx wrangler deploy`
   (Assets + worker.js konfigurowane w `app/wrangler.toml`.)
4. (Opcjonalnie) Settings → Build → Watch paths: include `dashboard/**` – commity portali nie będą triggerować buildów dashboardu.
5. Pierwszy przebieg: Actions → „Dashboard Collector" → Run workflow.

## Jak dodać domenę

Dodaj wpis w `domains.yaml`:

```yaml
- id: nowadomena.pl
  name: nowadomena.pl
  senuto: { enabled: true, country_id: "1" }
  backlinks: { enabled: true, target: nowadomena.pl }
  clarity: { enabled: false }
```

Collector założy `data/nowadomena.pl/` przy następnym runie, frontend wygeneruje `/nowadomena.pl/` automatycznie.

## Jak dodać źródło (np. Clarity)

1. Moduł `collector/sources/<nazwa>.py` z `fetch(cfg, env) -> dict` (rzuca `SourceError`)
2. Wpis w `DOMAIN_SOURCES` / `GLOBAL_SOURCES` w `collector/sources/__init__.py`
3. Sekcja w `domains.yaml` + sekret w workflow `dashboard-collector.yml`
4. Wykresy/staty na stronie domeny (`app/src/pages/[domain]/index.astro`)

Dla Clarity: endpoint `https://www.clarity.ms/export-data/api/v1/project-live-insights`, Bearer `CLARITY_API_TOKEN` (token generowany w panelu Clarity → Settings → Data Export). Szkielet już jest w `sources/clarity.py`.
