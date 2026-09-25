# Dashboard zaplecza – nowy front (Next.js + TailAdmin)

Następca `dashboard/app` (Astro). Ten sam model danych: collector zapisuje
`dashboard/data/<domena>/*`, a front czyta je **w trakcie builda** i wypuszcza
statyczne pliki. Wygląd bazuje na [TailAdmin Free](https://github.com/TailAdmin/free-nextjs-admin-dashboard)
(MIT, licencja w `LICENSE-tailadmin`).

- Next.js 16 (App Router, `output: "export"`), React 19, Tailwind 4
- wykresy: ApexCharts (`react-apexcharts`), tabele: AG Grid Community (lokalizacja PL)
- ikony: lucide-react, font Outfit (latin-ext – polskie znaki)
- motyw jasny/ciemny (klasa `dark` na `<html>`, pamiętany w `localStorage`)

## Co jest przeniesione (etap 1)

| Widok | Ścieżka | Uwagi |
|---|---|---|
| Domeny i kredyty | `/` | karty domen, salda SMSAPI / OpenRouter |
| Przegląd domeny | `/<domena>/` | zdrowie źródeł, KPI 7 dni, trendy 3 mies., „Co wymaga uwagi" |
| Senuto | `/<domena>/senuto/` | karty TOP 3/10/50 filtrują tabelę fraz |
| GSC | `/<domena>/gsc/` | „Co spadło" kw/kw i r/r, okna 7d–16m, szczegóły frazy po kliknięciu |
| GA4 | `/<domena>/ga4/` | nowi/powracający, trendy miesięczne, kanały/źródła/strony, landing pages |

Pozostałe sekcje (Bing, Ahrefs, Clarity, Boty AI, Matrix, Asystent, Content
Watcher, Content Writer, Leady, System) są w menu z dopiskiem „stara ↗” i
otwierają obecny dashboard. Przycisk „Ten widok w starej wersji” w nagłówku
prowadzi do odpowiednika bieżącej strony.

Duże listy (frazy Senuto, okna GSC, historia fraz) nie są wklejane w HTML –
build zapisuje je jako osobne pliki JSON (`senuto/frazy.json`,
`gsc/dane/<okno>.json`), a tabela dociąga je po załadowaniu strony.

## Uruchomienie

```bash
cd dashboard/web
npm install
npm run dev          # http://127.0.0.1:4410 (hot reload)
npm run build        # → out/ (+ scripts/flatten-segments.mjs)
npm run preview      # podgląd out/ na http://127.0.0.1:4410
npm run screenshots  # zrzuty wszystkich stron (wymaga preview i Chrome) → screenshots/
```

`npm run build` po `next build` uruchamia `scripts/flatten-segments.mjs`:
Next 16 zapisuje pliki prefetchu segmentów w podkatalogach, a klient pyta o
płaskie nazwy – bez serwera Node nikt tego nie przepisze, więc skrypt dokłada
kopie. Bez tego nawigacja działa, ale sypie 404 w konsoli.

## Wdrożenie

Nic nie jest wdrożone. Przygotowany jest **osobny** worker podglądu
`zaplecze-dashboard-next` (`wrangler.toml` + `worker.js`: Basic Auth tym samym
hasłem `DASH_PASSWORD` co obecny dashboard, potem pliki z `out/`). Produkcyjny
`zaplecze-dashboard` zostaje nietknięty.

```bash
npm run build
npx wrangler secret put DASH_PASSWORD   # tylko za pierwszym razem
npx wrangler deploy
```

Docelowo, gdy front pokryje wszystkie sekcje: `dashboard/app/wrangler.toml`
wskazuje `assets.directory` na `../web/out`, build Workers Builds przechodzi na
`dashboard/web`, a `worker.js` z API (`/api/*`, D1, KV, Vectorize) zostaje bez
zmian.

## Struktura

```
src/app/                  strony (Server Components czytają dane w build time)
  [domain]/page.tsx       przegląd domeny
  [domain]/senuto/        strona + SenutoExplorer (klient) + frazy.json
  [domain]/gsc/           strona + GscDrops, GscTables (klient) + dane/[plik]
  [domain]/ga4/           strona + Ga4Tables (klient)
src/components/
  shell/AppShell.tsx      pasek boczny TailAdmina, przełącznik domen, nagłówek
  ui.tsx                  Card, StatCard, Sparkline, DeltaBadge, SourceState…
  charts/TimeSeriesChart  ApexCharts – serie czasowe, 2. oś, odwrócona oś
  grid/DataGrid.tsx       AG Grid w karcie: filtr, CSV, stronicowanie, motyw
  grid/cells.tsx          plakietki pozycji, paski, trudność, kropki potencjału
src/lib/
  data.ts                 port 1:1 z dashboard/app/src/lib/data.ts (server-only)
  format.ts               kopia z dashboard/app/src/lib/format.ts
  metrics.ts, nav.ts, palette.ts, gsc.ts
```

`data.ts` i `format.ts` są kopiami z `dashboard/app` – zmiany w modelu danych
trzeba na razie nanieść w obu miejscach (do czasu wygaszenia Astro).
