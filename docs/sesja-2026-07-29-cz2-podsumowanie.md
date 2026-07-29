# Sesja 2026-07-29 cz. 2 – alerty sald + edytor Content Watchera jak narzędzie contentowe

Stan: **wszystko na produkcji i wypchnięte** (commity `1ffebf8`, `4482dd0`,
`1a53aee`, `e75c395`, `7f2e369`, `8364795`; migracja D1 `0006` wykonana,
sekret `JINA_API_KEY` wgrany do Workera).

## 1. Progi alertów Senuto i SerpData (`1ffebf8`)

Kafelki „Salda usług" na stronie systemowej: jednostki („dni do rotacji",
„zapytań zostało") renderowały się ciężko, bo `<small>` tworzy skrypt, więc
nie dostaje `data-astro-cid` i scoped `.balance-value small` go omijało.
Reguła przeniesiona do `<style is:global>`.

Nowe progi w `domains.yaml` → `global.alerts`:

| próg | wartość | znaczenie |
|---|---|---|
| `senuto_days_left_min` | 1 | mail dzień przed wygaśnięciem tokenu (i codziennie potem) |
| `serpdata_min_left` | 100 | mail, gdy w pakiecie zostanie ≤100 zapytań |

Obie usługi nie idą przez snapshoty collectora, więc `alerts.py` czyta je
sam: termin Senuto z `exp` w JWT (zero wywołań API, ta sama arytmetyka co
`cw-usage.js`), saldo SerpData jednym GET-em na `/v1/api-key/balance`.
`SERPDATA_API_KEY` dodany do `dashboard-collector.yml`.

## 2. Edytor jako dokument (`4482dd0`)

**Pełna treść wpisu.** Dokument zaczynał się od pierwszego H2, bo proxy
czytało tylko sekcje ACF. Wstęp siedzi w polu `content` WordPressa – teraz
jedzie razem z tytułem (H1). Wpisy bez sekcji ACF pokazują
`page_content_no_section`.

**Układ edytorski:** rynienka z typami bloków (h1/h2/p/ul), miara 74ch,
rytm 1.75, sticky pasek ze statystykami (słowa, nagłówki, akapity, sekcje,
„X/Y ocenionych propozycji"), filtr „tylko zmienione sekcje", „zatwierdź
wszystkie", „kopiuj zatwierdzone".

**Diff w kolorach:** dopisane na zielonym tle, usunięte przekreślone
i wyciszone (wcześniej niebieskie vs czerwone tło – dwa akcenty biły się).

**Decyzja per sekcja ✓/✕** zamiast checkboxa, trzy stany. Migracja D1
`0006-sections-decision.sql` dodaje kolumnę `decision`; `accepted` zostaje
flagą wdrożeniową, więc pipeline bez zmian.

**Gotcha:** reguły dla wyników SERP budowanych w JS leżały w bloku
`<style is:global>` z pseudo-klasą `:global()`, której przeglądarka nie zna –
odrzucała każdą taką regułę (28 sztuk). Stąd „wszystko się zlewa" na karcie
SERP. Rozpakowane.

## 3. Nasza pozycja, ocena treści, edycja w miejscu (`1a53aee`)

**`serpCompetitors` wyrzucał nasz adres** (`host === ownHost`), więc po
sprawdzeniu SERP-a nie było widać, gdzie stoimy. Teraz wynik wraca osobno
(`ours`) i ląduje na liście we właściwej kolejności, podświetlony plakietką
„nasz wpis"; brak w wynikach mówi, ile pozycji sprawdzono. Potwierdzone na
żywym SERP-ie: „zlecę pozycjonowanie" → jesteśmy na 4.

**Cztery zera „fraz konkurencji"** obok „2 fraz naszego wpisu" czytały się
jak wynik analizy – to brak fraz w Senuto. Kafelki znikają, zostaje
komunikat.

**Ocena treści** (0–100) liczona na żywo z dokumentu: objętość, nagłówki
(1 na ~250 słów), linki wewnętrzne (cel 3), świeżość, pokrycie fraz. Lista
„Frazy do pokrycia" = luki z SERP-a + wytyczne + własne frazy spoza podium
(pozycja 4+); odhaczają się w trakcie pisania.

**Edycja w miejscu:** pasek formatowania (B, I, H2, H3, akapit, listy,
odnośnik, wyczyść) dla każdej sekcji. Treść z WordPressa zapisuje się jako
szkic w `localStorage` (`cw-draft:<domena>:<post_id>:<slot>`), bo zapisu
zwrotnego do CMS-u nie ma; propozycje pipeline'u dalej idą do zadania.

**Widgety „Zobacz również"** (`k-post-link`, `k-post-list`, `k-post-item`)
wycinane z dokumentu razem z pustymi akapitami po nich – na stronie to boks
poboczny, nie tekst artykułu, a wchodziły w środek akapitu i do licznika słów.

## 4. Treść konkurencji przez Jina Reader (`e75c395`)

Nowy moduł `dashboard/app/cw-rivals.js` + `/api/cw/rivals/:domain/:postId`.

- **Odczyt stron:** `r.jina.ai` zwraca markdown, więc bez własnego crawlera.
  Reader oddaje CAŁĄ stronę (menu, cookiebot, stopka) – na naszym wpisie
  3611 „słów" zamiast 1092. Stąd `X-Remove-Selector` (nawigacja, cookies,
  newsletter) + heurystyka `proseWords`: linia krótsza niż 8 słów albo
  w ponad 40% złożona z tekstu linków nie jest zdaniem artykułu → 1301.
  **Nie używać** selektorów `[class*="content"]`/`[class*="post"]` – trafiają
  w kontener treści (nasz szablon ma klasy `k-*`) i zostaje pusta strona.
  `X-Target-Selector: article, main` daje 422, gdy strona ich nie ma.
- **Cel objętości** w ocenie treści = mediana konkurentów (przejazd na żywo:
  my 1301, zleca.pl 834, useme.com 1035, sunrisesystem.pl 617 → 834).
  Nasz wpis czytany tą samą drogą, żeby porównanie było uczciwe.
- **Fakty:** model dostaje nasz tekst i teksty konkurencji, zwraca konkrety
  z rodzajem (liczba/definicja/procedura/przykład/narzędzie/ryzyko),
  uzasadnieniem i źródłem. Przejazd wyciągnął m.in. GEO/AEO jako nieobecny
  temat, Ahrefs DR, budżety 400–1000 zł netto.
- **Etapy w D1** (`serp_snapshots`, klucz `rivals:<domena>:<post_id>`, bez
  migracji): nasza strona → po jednym konkurencie → porównanie. Cache 7 dni,
  Shift+klik wymusza świeży przejazd. Do przeglądarki idą metryki, nie
  markdowny.
- **Koszt:** 4 odczyty Jiny + ~23k tokenów wejścia / ~2,7k wyjścia ≈ $0,09.
  Dlatego osobny przycisk, aktywny dopiero po sprawdzeniu SERP-a.
- **Gotcha:** przy `max_tokens: 2500` model ucinał odpowiedź (finish_reason
  `length`) i JSON się nie parsował → pusta lista faktów udająca „konkurencja
  nie ma nic nowego". Teraz 4000, prompt wymusza zwięzłość, a nieparsowalna
  odpowiedź daje czytelny błąd.

## 5. Combobox modeli + retry pobrania wpisu (`7f2e369`)

Natywny `datalist` przy 367 modelach rozjeżdżał układ. Własny combobox:
filtrowanie w trakcie pisania, ↑↓, Enter, Esc, lista 260 px z przewijaniem.
Identyfikatory modeli łamały się w pół – motyw dashboardu ma domyślne
łamanie na dywizach, wyłączone przez `word-break: keep-all`.

Pipeline wywracał się na pierwszym kroku (`nie udało się pobrać wpisu 2838:
<urlopen error timed out>`, przebieg 30450431620). `wp.fetch_post` ma teraz
60 s i trzy podejścia z narastającym odstępem.

## 6. Przebieg jako oś kroków (`8364795`)

Lista kroków szła przez całą szerokość strony. Teraz oś w kolumnie 560 px:
pionowa nić, znacznik stanu (✓ / ✕ / **kręcące się kółko** przy kroku
w toku), czas trwania i koszt pod nazwą.

Nieudany przebieg ma własną kartę: który krok padł, pełny komunikat,
ponowienie i link do logu w Actions (`run_url` składane w `readJob`
z `run_id` + `GH_REPO`).

**Gotcha:** elementy chowane atrybutem `hidden` miały własne reguły
`display: flex`, które biją wbudowane `[hidden] { display: none }` – przez
to podsumowanie, pasek decyzji i filtr sekcji zostawały na ekranie.

## Stan testów

82/82 (`dashboard/app`): doszły `cw-rivals.test.js` (liczenie prozy,
nagłówki, mediana, nagłówki żądania do Readera, przejście etapów, strona nie
do odczytania, prompt), test wstępu i treści bez sekcji ACF, test decyzji
trójstanowej, trzy testy naszej pozycji w SERP.

## Otwarte / do decyzji

- **Zapis zwrotny do WordPressa.** Edycja zapisuje szkic w przeglądarce;
  realny zapis wymaga Application Password i uprawnień do zapisu w REST.
- **Timeout pobrania wpisu** – jeśli po retry nadal będzie padać, to nie
  chwilowa zadyszka, tylko WAF/WordPress odbijający runnery; wtedy pobranie
  treści trzeba przenieść na Workera (proxy, z którego korzysta edytor).
- **Wiersz „OK" w macierzy pilności** (z cz. 1) nadal do ewentualnej korekty.
- **Fakty konkurencji** nie są automatycznie wpinane w treść – to lista do
  ręcznej weryfikacji u źródła.
