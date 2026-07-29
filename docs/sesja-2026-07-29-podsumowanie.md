# Sesja 2026-07-29 – Content Watcher: pilność, czytelność, analiza SERP-gap

Stan: **wszystko na produkcji i wypchnięte** (commity `164223e`, `39cb73e`,
`b4ba403`; Worker `9c4b7395`, migracje D1 `0004` + `0005` wykonane, sekrety
`SERPDATA_API_KEY` i `SENUTO_API_KEY` wgrane do Workera).

## 1. Karty „Stan treści" jako filtry (`b42a9c5`, `07efb66`, `75783b1`, `4a474b8`)

Punktem wyjścia była prośba, żeby kafelki KPI filtrowały listę. W trakcie
wyszło, że sama taksonomia była nieczytelna, więc przebudowaliśmy ją całą.

**Okres ochronny 365 → 90 dni** dla grupa-icea.pl (`domains.yaml`). Rok bez
oceny to przesada; `min_score` usunięty, bo pilność nie bierze się już z punktów.

**Dwa rzędy kart, oba klikalne i składane iloczynem** (wiek × pilność × stan
pomiaru × filar):

| Wiek treści | Pilność |
|---|---|
| Wszystkie publikacje (604) | Krytyczny (225) |
| Świeże treści – do 3 mies. (7) | Wysoki (57) |
| Do przeglądu – 3–6 mies. (2) | Normalny (258) |
| Zaplanuj update – 6–12 mies. (83) | Niski (31) |
| Pilny audyt / recykling – ponad 12 mies. (512) | Poza indeksem (32) |

**Macierz pilności** (wyniki × wiek):

| wyniki | do 3 mies. | 3–6 mies. | 6–12 mies. | ponad 12 mies. |
|---|---|---|---|---|
| słabe | niski | normalny | wysoki | **krytyczny** |
| OK | niski | niski | niski | normalny |

Drugi wiersz to decyzja implementacyjna (Mateusz określił tylko regułę dla
słabych wyników): treść, która dowozi ruch, schodzi o stopień, żeby sam wiek
nie robił z niej pilnej roboty. **Do ewentualnej korekty.**

**„Niski ranking" liczony z kliknięć i wyświetleń, nie z pozycji** – decyzja
Mateusza: średnia pozycja jest średnią po frazach, więc wpis może być pierwszy
na frazę bez popytu. Próg to mediana domeny **z wpisów, które mają ruch**
(2 klik. / 152 wyśw.); mediana z całego katalogu wychodzi zero i „1 klik"
znaczyłoby „wyniki OK".

**Kolory**: zielony → żółty → pomarańczowy → czerwony na obu rzędach kart,
badge'ach pilności i chipie daty aktualizacji. Żółtego nie było w palecie –
doszły `--status-mid-fg/bg` (i brakujące `--status-ok-bg`) do wszystkich
czterech motywów w `theme.css`.

**Daty**: rozbite na dwie sortowalne kolumny (Publikacja / Aktualizacja),
data jako chip, aktualizacja w kolorze kubełka wieku.

## 2. Czytelność szczegółów wpisu (`60caac4`, `164223e`)

**Bug**: rozbicie wyniku 0–100 nigdy nie było stylowane – węzły buduje JS przy
otwarciu dialogu, więc nie mają `data-astro-cid` i scoped CSS ich nie łapał
(znana gotcha, patrz `reference-astro-scoped-style-js`). Reguły przeniesione
do `<style is:global>`.

Każda składowa ma teraz pasek, punktację „x / max pkt", źródło pod spodem
i badge „i" z opisem po ludzku (bez wzorów – po pierwszej wersji Mateusz
słusznie zauważył, że `min(26; klik × 1,5 + …)` niczego nie tłumaczy).

Payload strony schudł z 3,2 MB do 2,5 MB – opisy składowych powielały się
604 razy, teraz jadą raz w osobnym bloku JSON.

## 3. Analiza SERP-gap – „kto zajmuje ten temat" (`39cb73e`)

Pomysł Mateusza: wpis może rankować na frazy z czapy, a na jego właściwy temat
stoją w SERP-ie konkurenci z zupełnie innym zestawem fraz.

**Backend** – `dashboard/app/cw-serp.js`, endpoint `/api/cw/serp/:domena/:postId`:
1. SerpData × 2 – zapytanie **tytułem** (temat) i **naszą najlepszą frazą**.
   Gdy obie są takie same, leci jedno zapytanie.
2. Senuto Baza Słów Kluczowych – frazy konkurentów z SERP-u **tematu**,
   jedno wywołanie na komplet adresów.
3. Zestawienie: nie mamy / poza TOP 10 / mamy, luki na górze, w grupach
   po wolumenie.
4. **Rozjazd** = domeny obecne w SERP-ie tytułu, których nie ma w SERP-ie
   naszej frazy.

**Frazy tylko z SERP-u tematu** – poprawka po pierwszym przejeździe: nasza
fraza „zmiana linku" wyciągnęła skracacze URL-i (tiny.pl, bityl.pl) i luki
wypełniły się słownictwem z obcej branży. SERP własnej frazy służy wyłącznie
do wykrycia rozjazdu.

**Analiza etapami** – SerpData odpowiada ~20 s, komplet (2× SERP + Senuto) nie
mieści się w czasie życia Workera i `ctx.waitUntil` był ubijany w połowie.
Teraz jedno żądanie = jeden etap (`serp_title` → `serp_own` → `keywords` →
`done`), stan w D1, klient POST-uje co 3 s. Pełny przejazd ~40–60 s.

**Nasze frazy z pozycjami** idą z `catalog.json` (dane collectora) – Baza Słów
Kluczowych Senuto pozycji nie zwraca, a płacenie za drugie pobranie tego samego
nie miało sensu.

**Edytor**: sekcja „Kto zajmuje ten temat" nad belką pipeline'u – przycisk
„Sprawdź SERP" (Shift+klik wymusza świeży przejazd), obie listy konkurentów,
ostrzeżenie o rozjeździe, tabela fraz. Wynik zapisany na tydzień.

**Pipeline** (`run.py`): `step_serp` też pyta dwa razy, a **tytuł jest bazą,
nie fallbackiem** – wcześniej szło `keywords_own[0] → gsc[0] → title`, więc
przy frazach z czapy cały research jechał w bok. Rozjazd trafia do promptu
briefu jako osobna sekcja.

### Trzy błędy złapane przy wdrożeniu (każdy ma test regresyjny)

Wszystkie objawiały się jako `error code: 1101` (Worker threw exception):
1. `contentDomains()` zwraca **Mapę**, nie tablicę – użyłem `.includes()`.
2. `checkMutationOrigin()` zwraca **boolean**, a nie obiekt błędu – handler
   zwracał `true` zamiast `Response` („Promise did not resolve to Response").
3. `payload TEXT NOT NULL`, a stan „running" zapisywał NULL – idzie tam teraz
   literał JSON-owego `null`.

Diagnostyka: `wrangler tail` nic nie łapał, dopiero `wrangler dev` z lokalną
bazą i realnymi kluczami (`--var`) pokazał stack.

## 4. Salda Senuto i SerpData (`b4ba403`)

Kafelki na `/system/`, dane z `/api/cw/usage` (Worker, nie collector):
- **Senuto · token** – dni do rotacji z pola `exp` w JWT, zero wywołań API.
  Dziś **14 dni** (ważny do 13.08.2026). Ostrzeżenie od 7 dni.
- **SerpData** – saldo z `/v1/api-key/balance`: **8349 z 30 000** (zużyte 72%).
  Ostrzeżenie przy 15% pakietu, alarm przy 5%.

Mój pierwszy wniosek („API nie udostępnia salda") był błędny – sondowałem
`/v1/balance`, `/v1/account` itd., a endpoint nazywa się `/v1/api-key/balance`.
Mateusz go wskazał, licznik z D1 wyleciał na rzecz realnego salda.

## Testy

- Worker: 69 (`npm test` w `dashboard/app`)
- Pipeline: 42 (`python3 -m pytest tests/`)

## Do zrobienia w następnej sesji

1. **Przejazd analizy SERP z poziomu UI edytora** – endpoint sprawdzony
   bezpośrednio, ale przycisk, polling i widok wyników czekają na kliknięcie
   w realnym przepływie.
2. **Decyzja o drugim wierszu macierzy pilności** (treści z dobrymi wynikami
   po roku: „normalny" czy „niski"?).
3. **Senuto zna tylko domeny ze swojej bazy** – dla niszowych konkurentów
   (mediainmotion.pl, poruszamybiznes.pl) zwraca zero fraz i luki są puste.
   Do rozważenia: fallback na frazy domeny konkurenta albo GSC jako źródło
   naszych fraz.
4. **Rotacja tokenu Senuto do 13.08.2026** – po tej dacie research i analiza
   SERP przestaną działać (endpoint zwróci czytelny 502).
5. Podpis nad „Pilnością odświeżenia" nadal w starej konwencji – do
   przeredagowania jak reszta.
