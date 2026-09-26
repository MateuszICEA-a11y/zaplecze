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

**Edytor wpisu** (`/content-watcher/edytor/`) jest w React (`PostEditor.tsx` i panele
obok: `AnalysisPanels`, `PipelinePanel`, `DocPanel`/`DocSection`, `ScorePanel`,
`EndCards`, `PreviewDialog`). Wspólny stan: `src/lib/cw-editor/store.ts` – zadanie
zmienia się tylko przez `set()` z nowym obiektem; odpytywanie Workera w `jobs.ts`;
czyste funkcje (układ dokumentu, diff, frazy, migawka, sanityzacja) obok. Klasy
`ed-doc-section`, `ed-sec-head`, `ed-doc-body`, `ed-doc-expert` i `ed-faq-head` nie
niosą stylu – to znaczniki, po których `snapshot.ts` czyta dokument (ocena, podgląd).

**Edytor tekstu projektu** (`/content-writer/projekt/`, pełny ekran) to `WriterEditor.tsx`:
pola `contentEditable` są niekontrolowane (rejestr bloków w refie, autozapis ~1,5 s po
zmianie, `flush()` przed każdą akcją czytającą treść z bazy), panel boczny odświeża się
licznikiem.

Style obu edytorów to utility Tailwinda w komponentach (klocki w `src/components/kit.tsx`).
Wyjątek: typografia treści z WordPressa i modeli (HTML bez klas) – `.doc-prose` i rynienka
typów bloków `.doc-gutter` w `src/app/editor-content.css` (`@apply`, jasny/ciemny).
Podświetlenia fraz (`::highlight()`) wstrzykuje `src/lib/highlights.ts` – parser CSS
Next.js ich nie zna.

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
