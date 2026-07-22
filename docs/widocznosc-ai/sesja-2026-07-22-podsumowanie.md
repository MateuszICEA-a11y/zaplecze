# Sesja 2026-07-21/22 – dashboard zaplecza: Matrix, Bing, GSC „Potencjał", lifting

Kontynuacja rozbudowy `dashboard/` (repo zaplecze, app na Workers Builds).
Wszystko wypchnięte na produkcję do commita `7283228` (+ `25871f3` fix 429 metryk).

## Zrobione (chronologicznie)

### Bing – okna czasowe jak w BWT
- Diagnoza: `GetQueryStats` zwraca wiersze per fraza **per tydzień** (pole `Date`),
  kolektor zrzucał je na płasko → duplikaty fraz, nieznany okres, `AvgClickPosition=-1`
  (u Binga „brak danych") renderowane jako zielony badge top3.
- `bing.py`: agregacja do okien 7d/30d/3m/6m/12m/18m/24m (`queries_windows`,
  emitowane tylko pokryte historią ~16 mies., start przycięty do danych, pozycja
  ważona klikami). Frontend: przełącznik okna tabeli fraz + karta „Frazy w Bing (30 dni)".
- `TimeSeriesChart`: prop `ranges` – przyciski zakresu osi X (uPlot setScale) +
  zakres dat w podpisie. Użyte na wykresie ruchu Binga.

### Matrix – dane
- **Fix joinu GA4**: landing pages przychodzą BEZ trailing slasha, sitemap ze slashem
  → engagement był tylko dla `/`. Normalizacja obu stron + scalanie duplikatów.
- **Pozycja z Senuto per URL** (nie GSC): `senuto.py` agreguje frazy per URL
  z PEŁNEJ paginacji (~6000 fraz, przed ucięciem do 200) → `senuto.urls`
  (best_position/best_keyword/liczniki top3/10/50); join po ścieżce (Senuto daje
  URL bez schematu/www).
- **Priorytety optymalizacji**: tabela spadków z `gsc.compare` (qoq 3 mies. i r/r),
  delty kliknięć/wyświetleń/pozycji + engagement, sort po stracie kliknięć.
- **Segmenty serwisu**: agregacja po 1. poziomie ścieżki (`/oferta/`, `/blog/`…),
  ≥2 strony = segment, reszta → „pozostałe".
- Etykieta leadów `sms-code` → „SMS – kod wysłany" (weryfikacja OTP nic nie loguje,
  „niedokończony" był mylący; ewentualny TODO: event `sms-verified` w verify-code.ts).

### Indeksacja (URL Inspection) – hardening + harmonogram
- Pełna sitemapa działa: widocznosc.ai 135/135 (27-28 poza indeksem), grupa-icea.pl
  834/834 (77 poza) – jednorazowo 21.07 wieczorem.
- `_TokenProvider`: refresh SA co 45 min (token wygasał w ~1h pętli 834 inspekcji).
  **GOTCHA regresji**: sentinel `_refreshed_at=None`, NIE 0.0 – `time.monotonic()`
  to uptime, na świeżym runnerze CI < progu → `Bearer None` → 401 obu domen.
- Pojedyncze błędy URL pomijane; 5 z rzędu → partial (≥50 wierszy) z `summary.aborted`
  + banner „przejazd częściowy" w UI; 429 metryk searchanalytics nie zabija źródła.
- Retry pobierania sitemapy (3×60 s) + **UA przeglądarkowy** (WAF seohost ubijał
  timeoutem botowe UA z runnerów; lokalnie te same requesty 200 w ~1 s) +
  `sitemap_index.xml` bezpośrednio (Yoast 301 z /sitemap.xml).
- **`schedule: weekly`** w domains.yaml (obie domeny): pełny przejazd tylko
  poniedziałkowy cron / komplet starszy niż 7 dni; przejazd NIEkompletny dociągany
  każdym runem aż do skutku; skip przenosi ostatni komplet do snapshotu (`as_of`).
- **Kwota URL Inspection – NIEROZWIĄZANA zagadka resetu**: 2000/d/property, ale
  429 trwało po 07:00 UTC (PDT) i po 08:00 UTC (PST) – wygląda na okno kroczące.
  Stan na koniec sesji: grupa-icea partial 558/834 w panelu; retry 12:30 w tle
  (jeśli nie zdążył – **jutrzejszy cron 6:30 dogra komplet automatycznie**).
  Docelowo problem znika: przejazd raz w tygodniu nie dzieli kwoty.
- Clarity: limit 10 wywołań/d (4/przebieg) palony przez push-triggery → **once-daily
  w main.py** (udany dzisiejszy odczyt = kolejne runy pomijają). Grupa-icea zielona.
- **GOTCHA runów**: push podczas działającego collector-runa = konflikt rebase na
  dashboard/data/ przy jego końcowym push (stracony przejazd). Nie pushować w trakcie;
  commity lokalne zabiera kolejny trigger (`git pull --rebase --autostash` w tasku).

### GSC – tabela fraz „Potencjał" (handoff §7)
- Kolumny stałe: Fraza (chevron) · Kliknięcia 108px (`.zero`) · Pozycja 104px ·
  Wyświetlenia 172px · Potencjał 128px (5 kropek). Sort domyślny po `opp` malejąco.
- `opp = wyświetlenia × waga pozycji` (top3→0.35, 4–20→1.0, 21–50→0.65, >50→0.32);
  etykiety Wysoki/Średni/Niski; ⓘ z wzorem w nagłówku.
- Rozwijany wiersz: sparkline „Wyświetlenia – 14 dni" + fakty (CTR przeniesiony tu).
  Szuflady zamykane przed sortem/filtrem/pagerem (capture-phase), nie psują pagera.
- `gsc.py`: `query_history` (query×date, 14 dni, top 300 fraz) – dane sparkline'ów.
- TableCard: sort respektuje `data-sort` komórki; sort/CSV po OSTATNIM wierszu thead.

### Lifting wizualny (handoff §8) – enhance, nie overwrite
- `lifting.css` → theme.css + **mostek**: `.pos-badge/.cell-bar/.opp-dots` przejmują
  nowy wygląd (inset ring, gradienty, poświata) bez zmiany markupu – skrypty
  przełączników okien renderują stare klasy.
- StatCard: pigułki `.rtrend` (svg strzałki; kolor wg sentymentu z goodWhen);
  **delta null → „zbieramy dane", nigdy „– / 7 dni"**; hero 3rem. Hero per sekcja:
  GSC/Bing→Kliknięcia, Senuto→Widoczność, Boty AI→Requesty, Matrix→Zaindeksowane.
- Wykresy: siatka tylko pozioma, bez ticków, gradient canvas pod serią
  (**guard na bbox NaN** w ukrytych kontenerach – bez niego TypeError), `.empty-chart`.
- Odstępstwa świadome: legenda uPlot z hover-wartościami zostaje (zamiast statycznej
  `.rlegend`); stany stale/down-card (§8.4a/c) odłożone (wymagają plumbing
  „ostatni udany snapshot per źródło"); skeletony n/d (build statyczny).

### Matrix – układ (handoff §10)
- KPI: hero „Zaindeksowane X z Y" + pasek pokrycia `.idxbar`.
- Segmenty jako **karty** `.seg-card` (pokrycie indeksem + siatka 2×2 metryk
  z kropką koloru źródła) zamiast 10-kolumnowej tabeli.
- Matrix stron: grupowane nagłówki **Senuto | GSC | GA4** (tokeny `--sen #b07cff /
  light #7c3aed`, `--gsc/--ga4/--ahrefs` aliasy), kropka indeksacji `.st` przy
  adresie (tooltip coverage+crawl), pozycja `.na` przy braku danych, engagement
  `.erate` mini-track (procenty NIE w tierach pozycji), filtry `.fchip`
  (Wszystkie/TOP10/Szansa 11–30/Poza indeksem) przez `tablecard:refilter`.
- Dekodowanie spadków: kolumna Przyczyna (`dImpr>0&&dClicks<0`→Spadek CTR,
  `dPos>1`→Spadek pozycji, `dImpr<0`→Popyt/sezon) + legenda z akcjami; na realnych
  danych qoq: 20× pozycja, 28× popyt, 2× CTR. Delty `.ddelta` z minusem „−".
- Odłożone (§10.5): kolumna „Link zwrotny Ahrefs" – w details linki są per domena;
  wymaga „top pages" z Ahrefs API. Filtr „Bez linku" zastąpiony „Poza indeksem".

### Handoff dla Claude Design
- `podstrony-review/dashboard-design-2026-07-22/`: README-HANDOFF + theme.css +
  component-styles.md (bloki <style> ze wszystkich .astro) + compiled-css/ +
  markup/ (11 zbudowanych stron HTML z realnymi danymi).

### Decyzja: AG Grid odrzucony
Master-detail (nasze szuflady) i grupowanie = płatny Enterprise; ~300 kB gz;
wirtualizacja zbędna przy ≤300 wierszach; tracimy statyczny HTML z builda.
Ewentualna przyszłość: TanStack Table (headless), gdy dojdzie edycja/filtry per kolumna.

## Stan na koniec / do zrobienia
- [ ] Indeksacja grupa-icea: komplet 834 – dogra się automatycznie (retry 12:30
      albo cron 6:30 jutro); wtedy segmenty `/slownik/` i `/case-study/` się pojawią.
- [ ] Sparkline'y fraz GSC: `query_history` zbiera się od 22.07 – komplet po runie.
- [ ] GA4 – układ (handoff §9): hero Sesje + karta split nowi/powracający, pasek
      mikro-kart, 3 listy „wczoraj" w jedną z przełącznikiem, `.muted-tag` na
      dane-śmieci. NIE ruszone w tej sesji.
- [ ] Stany danych §8.4a/c (stale-tag, down-card) – wymaga danych „ostatni udany
      odczyt per źródło" w widoku.
- [ ] Ahrefs top pages per URL (kolumna „Link zwrotny" w Matrixie).
- [ ] Ewentualnie: event `sms-verified` w verify-code.ts (pełne domknięcie leada SMS).
