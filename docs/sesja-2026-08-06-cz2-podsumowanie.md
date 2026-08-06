# Sesja 2026-08-06 cz. 2 – Content Watcher: próg pokrycia fraz, FAQ w obiegu, dobór eksperta

## Punkt wyjścia

Zgłoszenie: reoptymalizacja wpisu „Pozycjonowanie w branży fotowoltaicznej"
(`posts-20811`) podniosła ocenę treści z 58 na 62 i uznała robotę za zrobioną,
zostawiając frazy trywialne do wplecenia („gdzie szukać klientów na
fotowoltaikę", „pozyskiwanie klientów fotowoltaika") nietknięte. Do tego dwie
uwagi do panelu fraz i – w drugiej części sesji – ucięta treść (brak FAQ) oraz
temat mapowania autorów.

## Wdrożenia

| Commit | Zakres |
|---|---|
| `b0c63f96` | próg pokrycia fraz w pipelinie (GAP_JSON + krok `coverage` + `matching.py`) |
| `8513a6dc` | panel fraz: czerwony minus zamiast plusa, klik przenosi do frazy w treści |
| `44517c47` | naprawa dispatchu – `client_payload` ma limit 10 pól |
| `ab1731a4` | FAQ w pełnym obiegu + świadomy dobór eksperta w callout |

Wszystko na `origin/main`. Worker wdrożony ręcznie – ostatnia wersja `5b2c3654`.

---

## Wątek 1: dlaczego było 62/100

### Przyczyna

Frazy, po których edytor liczy pokrycie, pochodzą z analizy SERP w Workerze
(`serp_snapshots.gap`) i **nigdy nie docierały do pipeline'u**. Model
przepisujący dostawał wyłącznie własną listę z briefu, więc oceniane były inne
frazy niż zamawiane. Drugi, cichszy błąd: matcher nie znał polskiej wymiany
spółgłoskowej, przez co „leady w fotowoltaice" (forma wymagana przez reguły
redakcyjne) nie liczyło się jako pokrycie frazy „leady fotowoltaika".

### Co zrobiono

- `gapSummary()` w `cw-serp.js` → `client_payload.research.gap` → env `GAP_JSON`
  (workflow `content-refresher.yml`).
- Brief traktuje tę listę jako obowiązkową; frazy odrzucone lądują w nowym polu
  `keywords_rejected` z powodem.
- Nowy krok **`coverage`** (`run.py`, prompt `prompts/coverage.md`): sprawdza
  gotową propozycję i odsyła braki do domknięcia, maksymalnie dwie rundy. Czego
  się nie da wpleść, wraca z uzasadnieniem widocznym w panelu wytycznych.
- `pipeline/content-refresher/matching.py` – lustro matchera z `edytor.astro`.
  Obie strony liczą identycznie; `soft()` obsługuje wymiany k→c, g→dz, ch→sz.

**Warunek działania:** analiza SERP w edytorze musi być zrobiona PRZED startem
przejazdu. Bez snapshotu `gap` przychodzi pusty i bramka sprawdza tylko frazy
z briefu, czyli wraca stare zachowanie.

---

## Wątek 2: panel „Frazy do pokrycia"

- Brak frazy to czerwony „−", nie plus (plus czytał się jak przycisk „dodaj").
- Fraza obecna w treści działa jak łącze: klik albo Enter przewija do jej
  wystąpienia i podświetla je na ~2,5 s; kolejne kliknięcia idą po następnych
  wystąpieniach.
- Panel wytycznych pokazuje wynik bramki: frazy domknięte w drugim przebiegu,
  pominięte z powodem i te, których nie udało się wpleść.

---

## Wątek 3: dispatch przestał działać (regresja z wątku 1)

`repository_dispatch` przyjmuje w `client_payload` **najwyżej 10 właściwości
najwyższego poziomu**. Dołożenie `gap` dało jedenastą → HTTP 422 → zadanie
zapisane jako `failed` z komunikatem „Nie udało się uruchomić procesu
optymalizacji." zanim runner wystartował.

Wyniki researchu jadą teraz jednym polem `research: {rivals, gap}`. Test
`createJob` w `cw-api.test.js` pilnuje limitu.

Przy okazji: **runner bierze workflow i pipeline z GitHuba, nie z dysku**. Sam
deploy Workera bez pusha dawał rozjazd ścieżek i cichy brak faktów rywali.

---

## Wątek 4: FAQ w pełnym obiegu

Dokument w edytorze urywał się na ostatniej sekcji ACF – blok FAQ (200–400 słów,
renderowany jako `schema.org/FAQPage`) nie był widoczny dla redaktora, oceny
treści ani modelu. Pola `page_faq_*` **wystawił w REST dev** na prośbę z tej
sesji (wcześniej nie było ich ani w `content`, ani w ACF, ani w schemacie Yoast).

Model danych: FAQ to pseudo-sekcje ze slotami **101+** (`FAQ_SLOT_BASE = 100`,
18 par). Zapis do WordPressa idzie po NAZWACH pól, nie po numerach slotów, więc
offset nigdzie nie ląduje w CMS-ie – diff, decyzje ✓/✗, guard hashy i zapis
działają istniejącą ścieżką sekcji. Lustro stałej: `config.py`, `cw-api.js`,
`edytor.astro`.

Świadome wyłączenia: odpowiedzi FAQ nie dostają przypisów, linków wewnętrznych
ani cytatu eksperta – mają zostać krótkie i samodzielne, bo to je cytują
wyszukiwarki. `renumber()` pomija sloty FAQ. Model może dopisać najwyżej trzy
nowe pytania, wyłącznie w wolnych parach pól.

### Gotcha kolektora

Dołożenie FAQ do treści zmienia `content_hash` każdego wpisu z FAQ. Bez
zabezpieczenia najbliższy przejazd oznaczyłby je jako „zmienione dziś" i
wyzerował wiek treści, który jest bramką w scoringu pilności. Stąd
`BODY_VERSION = 2` i wydzielona funkcja `change_state()` w
`dashboard/collector/sources/wordpress.py`.

---

## Wątek 5: ekspert w callout

Osoba i stanowisko pochodzą teraz z listy `EXPERTS` w `config.py` (imię,
stanowisko, obszar), a nie z odpowiedzi modelu – nazwisko spoza zespołu jest
podmieniane na kandydata z listy i odnotowywane w payloadzie jako
`expert_replaced`. Autor wpisu dalej wykluczony, dopasowanie po nazwisku zamiast
kruchego `startswith`. Model wybiera tylko, czyj obszar pasuje do tematu.

Autor pochodzi z `yoast_head_json.author` (kolektor) – `/wp/v2/users/<id>`
blokuje AIOS (`403 aios_user_details_forbidden`).

---

## Stan bazy

Wpis `posts-20811` zresetowany dwukrotnie na życzenie: skasowane wszystkie
zadania, kroki, sekcje oraz oba snapshoty researchu (SERP-gap i treść rywali).
Backupy w scratchpadzie sesji: `backup-20811-*.json` i `backup2-20811-*.json`.

## Testy

94 testy Pythona (`pipeline/content-refresher/tests`), 104 testy Node
(`dashboard/app`), build Astro. Nowe: matcher fraz i bramka pokrycia, FAQ
w snapshocie/renumeracji/diffie/konfliktach, `gapSummary`, limit pól
`client_payload`, FAQ w proxy treści, dobór eksperta, `change_state`.

---

## Do zrobienia jutro

1. **Pierwszy przejazd z FAQ** – uruchomić dla `posts-20811` w kolejności:
   „Sprawdź SERP" → optymalizacja. To pierwszy raz, gdy model widzi blok FAQ
   i może go przepisać. Sprawdzić: czy odpowiedzi FAQ zostały zwięzłe (dwa–trzy
   zdania), czy nowe pytania nie dublują nagłówków sekcji i czy ocena treści
   realnie skoczyła (bramka celuje w pełne pokrycie, nie w +4 punkty).
2. **Weryfikacja wizualna edytora** – czerwony minus, skok do frazy, render
   bloku FAQ. Nie sprawdzone: dashboard jest za Basic Auth, hasło poza sesją.
3. **Zapis FAQ do WordPressa e2e** – ścieżka jest gotowa i przetestowana
   jednostkowo, ale przez prawdziwy zapis (szkic → wdrożenie) jeszcze nie
   przeszła.
4. **Kolektor przeliczy metryki** przy cronie 6:30 – wpisy z FAQ dostaną nowy
   punkt odniesienia hasha. Warto potwierdzić, że żaden nie dostał daty zmiany
   „dziś" (to sprawdza `change_state`, ale pierwszy przejazd na produkcji
   wypada obejrzeć).
