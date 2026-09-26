# Dashboard zaplecza – nowy front (Next.js + TailAdmin)

Następca `dashboard/app` (Astro). Ten sam model danych: collector zapisuje
`dashboard/data/<domena>/*`, a front czyta je **w trakcie builda** i wypuszcza
statyczne pliki. Wygląd bazuje na [TailAdmin Free](https://github.com/TailAdmin/free-nextjs-admin-dashboard)
(MIT, licencja w `LICENSE-tailadmin`).

- Next.js 16 (App Router, `output: "export"`), React 19, Tailwind 4
- wykresy: ApexCharts (`react-apexcharts`), tabele: AG Grid Community (lokalizacja PL)
- ikony: lucide-react, font Outfit (latin-ext – polskie znaki)
- motyw jasny/ciemny (klasa `dark` na `<html>`, pamiętany w `localStorage`)

## Co jest przeniesione

Wszystkie sekcje starego dashboardu:

- `/` – domeny i kredyty, `/system/` – salda, alerty, kwoty API, pipeline, rotacja tokenu Senuto
- per domena: przegląd, Senuto, GSC (frazy i strony w jednej tabeli), GA4, Bing (z importem
  CSV AI Performance), Ahrefs, Clarity, Boty AI, Matrix, Leady
- Asystent treści (kreator w `#hash`) oraz sekcja **Treści** – zakładki „Odświeżanie wpisów”
  (Content Watcher) i „Nowe teksty” (Content Writer); adresy stron zostały osobne

**Edytor wpisu** (`/content-watcher/edytor/`) jest prawie cały w React (`PostEditor.tsx`):
nagłówek, SERP, treść konkurencji, ocena treści z frazami, dokument (`DocPanel.tsx`,
`DocSection.tsx` – edycja, szkice, diff, decyzje, korekta stylu, infografiki, CTA)
i podgląd całości. W `src/legacy/edytor-script.ts` (znaczniki `edytor-{top,side}.html`)
zostały belka pipeline'u z wytycznymi oraz karty eksperta, stylu i WordPressa.
Wspólny stan: `src/lib/cw-editor/store.ts` – zadanie zmienia się tylko przez `set()`
z nowym obiektem, legacy subskrybuje stan i odmalowuje swoje karty. Czyste funkcje
(układ dokumentu, diff, frazy, migawka, sanityzacja) w `src/lib/cw-editor/`.

**Edytor tekstu projektu** (`/content-writer/projekt/`) to nadal moduł vanilla
`src/legacy/writer-editor.ts` podpięty w `ProjectWorkspace.tsx`. Style legacy są zawężone
do `.legacy` (`node scripts/build-legacy-css.mjs` po zmianie `src/legacy/css/*`), kolory
z mostka tokenów na paletę iCEA (`tokens.css`).

Worker czyta z buildu frontu pliki `/<domena>/content-watcher/catalog.json`,
`/<domena>/content-writer/data.json` i `competitors.json` (ASSETS) – route handlery
w `src/app/[domain]/…` odtwarzają je 1:1 (sprawdzone porównaniem z buildem Astro).

Duże listy (frazy Senuto, okna GSC, historia fraz) nie są wklejane w HTML –
build zapisuje je jako osobne pliki JSON (`senuto/frazy.json`,
`gsc/dane/<okno>.json`), a tabela dociąga je po załadowaniu strony.

## Uruchomienie

```bash
cd dashboard/web
npm install
npm run dev          # http://127.0.0.1:4410 (hot reload)
npm run build        # → out/ (+ scripts/flatten-segments.mjs)
npm run preview      # podgląd out/ na http://127.0.0.1:4410, /api/* → produkcyjny worker (DASH_PASSWORD z .env)
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
