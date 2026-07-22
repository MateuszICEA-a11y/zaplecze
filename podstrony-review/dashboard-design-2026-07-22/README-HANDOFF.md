# Handoff → Claude Design: Panel analityczny ICEA (stan 2026-07-22)

Kompletny zrzut CSS + markupu produkcyjnej apki (`dashboard/app`, Astro 5 + uPlot),
wygenerowany z builda na realnych danych. To jest AKTUALNY stan – nowszy niż
mockup `dashboard-design-2026-07-21/` (tamten nie ma sekcji GA4/Bing/Matrix/Boty AI
ani układu „Potencjał" w GSC).

## Zawartość

- `theme.css` – globalne tokeny i klasy (źródło: `dashboard/app/src/styles/theme.css`).
  Tokeny motywów (`:root` dark / `[data-theme="light"]`), `.shell/.sidebar/.nav-item`,
  `.stat-card/.chart-card/.table-card/.data-table`, `.pos-badge` (tiery top3/top10/mid/low),
  `.chip`, `.seg` (przełączniki okresów), `.pager`, `.drops-board`, `.banner`,
  `.q-table/.q-drawer/.opp-dots` (układ „Potencjał" fraz GSC).
- `component-styles.md` – bloki `<style>` scoped ze WSZYSTKICH komponentów `.astro`
  (Layout, StatCard, TimeSeriesChart z przełącznikiem zakresów, TableCard, DomainHeader…).
- `compiled-css/` – CSS po buildzie (to, co realnie serwuje produkcja; scoped style
  mają hasze `astro-*`).
- `markup/` – zbudowany HTML wszystkich sekcji (realne dane, klasy 1:1 z produkcją):
  - `index.html` – strona domen + kredyty kont (SMSAPI/OpenRouter),
  - `grupa-icea.pl_index.html` – Przegląd domeny (karty KPI + wykresy),
  - `grupa-icea.pl_senuto.html` – Senuto (karty TOP 3/10/50 filtrujące tabelę),
  - `grupa-icea.pl_gsc.html` – GSC: przełącznik okien 7d–16m, plansza „Co spadło"
    (qoq/yoy), tabela fraz w układzie „Potencjał" (opp-dots, rozwijane wiersze
    ze sparkline 14 dni), tabela stron,
  - `grupa-icea.pl_ga4.html` – GA4 (użytkownicy/kanały/zaangażowanie, trend 25 mies.),
  - `grupa-icea.pl_bing.html` – BWT: okna fraz 7d–24m, wykres z zakresami,
    AI Performance (grounding queries z importu CSV),
  - `grupa-icea.pl_ahrefs.html`, `grupa-icea.pl_clarity.html`,
  - `grupa-icea.pl_matrix.html` – Matrix: kondycja stron z sitemapy (indeksacja
    URL Inspection + GSC + GA4 + pozycje Senuto), segmenty serwisu, priorytety
    optymalizacji (spadki kw/kw i r/r),
  - `widocznosc.ai_leady.html` – leady i użycia narzędzi,
  - `widocznosc.ai_boty-ai.html` – boty AI (Cloudflare GraphQL).

## Konwencje

- Motyw: dark domyślny, light przez `data-theme="light"` na `<html>`; wykresy uPlot
  przemontowują się na `themechange` (kolory canvas nie dziedziczą z var()).
- Sidebar chowany: `.shell.collapsed` (68px), stan w `localStorage('icea-collapsed')`.
- Tabele: jeden kontroler TableCard (filtr + sort po nagłówkach + pager co 10 + CSV);
  sort respektuje `data-sort` na komórce (kolumny bez liczb, np. kropki Potencjału).
- Przełączniki okresów: `.seg` (GSC okna, Bing okna, zakresy wykresów, qoq/yoy).
- Fonty: Inter (body) + Space Grotesk (display), fontsource.
- JS client-side to progressive enhancement na markupie z builda – projektując
  zmiany, zachowaj klasy i strukturę DOM (skrypty się do nich wiążą).

## Czego NIE ma w tym zrzucie

- `worker.js` (Basic Auth) – bez zmian, poza zakresem designu.
- Danych collectora (`dashboard/data/`) – markup ma je już wyrenderowane.
