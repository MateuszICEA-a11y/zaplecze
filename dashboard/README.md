# Dashboard analityczny zaplecza

Publiczny dashboard postępów domen: SEO (Senuto), Google Search Console (kliknięcia/wyświetlenia/CTR/pozycja/frazy), linki (Ahrefs, fallback DataForSEO), kredyty SMSAPI i OpenRouter (konto + klucz projektu), docelowo Microsoft Clarity.

**URL produkcyjny:** https://zaplecze-dashboard.m-wisniewski.workers.dev

## Architektura

```
GH Actions cron (04:30 UTC) → collector (Python) → commit JSONL do dashboard/data/
                                                        ↓ push na main
                              Cloudflare Workers Builds (git) → build Astro → *.workers.dev
```

- `domains.yaml` – konfiguracja domen i źródeł
- `collector/` – Python 3.12, stdlib urllib + pyyaml; jedno padnięte źródło nie blokuje reszty (status w snapshotcie: `ok` / `error` / `token_expired` / `not_configured`)
- `data/<domena>/snapshots.jsonl` – 1 linia dziennie per domena; `data/_global/` – salda kont
- `app/` – Astro 6 + uPlot, statyczny build czytający JSONL w build time

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
   - (już istnieją: `DATAFORSEO_LOGIN`, `DATAFORSEO_PASSWORD`, `OPENROUTER_API_KEY`)
2. **Cloudflare Workers Builds**: Workers & Pages → Create → Import a repository → repo `zaplecze`:
   - Project name: `zaplecze-dashboard`
   - Root directory: `dashboard/app`
   - Build command: `pnpm install --frozen-lockfile && pnpm build`
   - Deploy command: `npx wrangler deploy`
   (Konfiguracja assets w `app/wrangler.toml` – statyczne pliki z `dist/`, bez kodu Workera.)
3. (Opcjonalnie) Settings → Build → Watch paths: include `dashboard/**` – commity portali nie będą triggerować buildów dashboardu.
4. Pierwszy przebieg: Actions → „Dashboard Collector" → Run workflow.

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
