# Content Watcher – cele i wymagania

Data: 2026-07-27 (aktualizacja: 2026-07-28 – etap A wdrożony)
Zakres: rozszerzenie Content Watchera na domeny WordPress (start: `grupa-icea.pl`)
Kontekst techniczny: `thoughts/shared/prototypes/content-watcher-napkin-sketch.md`,
`docs/superpowers/plans/2026-07-24-content-watcher-progress.md`

## 1. Co chcemy osiągnąć

System, który sam wskazuje, **która treść wymaga odświeżenia i dlaczego**, a
następnie prowadzi ją przez pipeline reoptymalizacji – od sygnału z danych do
gotowego draftu w WordPressie zaakceptowanego przez człowieka.

Cele biznesowe:

1. Utrzymanie i odbudowa ruchu na treściach, które już istnieją, zamiast
   produkcji nowych wpisów w miejsce tracących pozycje.
2. Zwiększenie liczby cytowań w wyszukiwarkach AI – świeżość i struktura treści
   są tu istotnym czynnikiem, a my chcemy go **mierzyć**, nie zakładać.
3. Skrócenie drogi od „widzimy spadek" do „treść jest poprawiona" z tygodni do
   dni, bez utraty kontroli redakcyjnej.
4. Wyeliminowanie kanibalizacji i luk w klastrach tematycznych na podstawie
   podobieństwa semantycznego, nie ręcznego przeglądu.

Cele mierzalne (do ustalenia wartości po kalibracji na realnych danych):

- odsetek treści z realną aktualizacją w ostatnich 12 miesiącach,
- zmiana kliknięć i pozycji GSC w oknach 7 / 28 / 90 dni po reoptymalizacji,
- liczba cytowań AI i wizyt botów AI na odświeżonych URL-ach vs kontrola,
- liczba zamkniętych par kanibalizacyjnych.

## 2. Zakres funkcjonalny

### Etap A – katalog i priorytety (czytanie)

- Katalog całej treści domeny: data utworzenia, data aktualizacji, meta dane,
  H1, pełna treść, autor, kategorie, liczba słów i nagłówków.
- Połączenie z metrykami po URL-u: GSC, GA4, Senuto, Ahrefs, indeksacja,
  Clarity, ruch botów AI.
- Jawny scoring priorytetu 0–100 z widocznym uzasadnieniem dla każdej pozycji.
- Detekcja realnej zmiany treści (hash) niezależnie od daty `modified` z CMS.

### Etap B – kolejka i pipeline (zapis)

- Ręczna akceptacja kandydata, kolejka zadań, historia i status.
- Pipeline treści: odświeżenie faktów, dodanie porady eksperta, uzupełnienie
  braków, odwołania do autorytatywnych źródeł.
- Wyjście zawsze jako **draft / rewizja** w WordPressie. Publikacja to decyzja
  człowieka.
- Monitoring efektu po 7, 28 i 90 dniach.

### Etap C – warstwa semantyczna

- Embeddingi treści (chunkowanie po sekcjach), klastrowanie, detekcja
  kanibalizacji, mapowanie luk contentowych względem fraz z GSC.
- Rekomendacja „scal" zamiast „odśwież" tam, gdzie to właściwsza decyzja.

## 3. Czego potrzebujemy – dostępy i konfiguracja

### Po stronie WordPressa (`grupa-icea.pl`)

| Potrzeba | Do czego | Status |
| --- | --- | --- |
| REST API `/wp-json/wp/v2/` publicznie | czytanie treści i metadanych | ✅ działa anonimowo, 458 wpisów |
| `yoast_head_json` | meta title, description, canonical, robots, schema | ✅ dostępne (Yoast 27.9) |
| Pole `acf` w REST | pełna treść artykułu | ✅ eksponowane publicznie |
| **Application Password** dla użytkownika o roli edytora | zapis draftów przez pipeline | ⛔ do utworzenia |
| Potwierdzenie mapowania pól ACF | poprawny zapis treści do szablonu | ⛔ do ustalenia z zespołem WP |
| Decyzja o rozszerzeniu grupy pól ACF ponad 8 sekcji H2 | – | ✅ bezprzedmiotowa, szablon ma 30 sekcji |

Uwaga krytyczna: na tej instalacji treść artykułu **nie znajduje się** w
`content.rendered` (tam jest wyłącznie lead, 240–1538 znaków). Pełny tekst leży w
polach ACF `page_title_h2_1..30` / `page_text_1..30`. Generyczny konektor
WordPressa odczyta około 15% treści i policzy błędną liczbę słów – potrzebny jest
maper dopasowany do tego motywu. To samo dotyczy zapisu.

Maper w `collector/sources/wordpress.py` obsługuje cztery warianty odczytu
(przejazd z 2026-07-28 na 604 pozycjach): `acf` – sekcje szablonu (444 wpisy),
`no_section` – pole `page_content_no_section` (1), `content` – całość w
`content.rendered` (13 najstarszych wpisów), `fields` – pola wskazane w
`content_fields` dla danego CPT (146 haseł Słownika, które w ogóle nie wystawiają
`content` w REST).

Druga uwaga: `wordCount` w schemie Yoasta liczy tylko lead (130 słów przy realnych
682) – nie może być podstawą żadnego scoringu.

### Bezpieczeństwo publicznego REST API

Publiczne `/wp-json/` to domyślne i wymagane zachowanie WordPressa – edytor
blokowy, podgląd i oEmbed działają przez ten interfejs. Sonda z 2026-07-27
potwierdza, że wrażliwe zakresy są zamknięte przez All-In-One Security:

| Próba | Wynik |
| --- | --- |
| `/wp/v2/users?per_page=100` | 403 `aios_user_lists_forbidden` |
| `/?author=1` | 403 |
| `/wp/v2/posts?status=draft` | 400 – status niedozwolony |
| `/wp/v2/settings` | 401 |

Publiczne jest wyłącznie to, co i tak widać w HTML: opublikowane treści, media
i meta dane. Do poprawy, żadne krytyczne:

1. `xmlrpc.php` odpowiada (405 na GET) – wektor brute-force przez
   `system.multicall` i pingback jako amplifikator. Do wyłączenia, jeśli nie
   korzystamy z Jetpacka ani aplikacji mobilnej.
2. Fingerprint stosu – 244 trasy i namespace'y wtyczek w `/wp-json/`, plus
   dokładna wersja Yoasta (27.9) w komentarzu HTML.
3. Pola ACF trafiają do REST **automatycznie**. Dziś lecą tam tylko sekcje
   treści, ale każde nowe pole (notatka wewnętrzna, dane klienta) stanie się
   publiczne bez niczyjej decyzji. Zasada na przyszłość: `show_in_rest: false`
   dla pól nieprzeznaczonych do publikacji.

Decyzja projektowa: **collector uwierzytelniamy od razu**, mimo że odczyt
anonimowy działa. Application Password jest i tak potrzebne do zapisu draftów, a
takie ustawienie sprawia, że przyszłe dokręcenie REST API nie zatrzyma Content
Watchera.

### Po stronie danych – już mamy

Nie wymaga nowych integracji, wszystko zbiera obecny collector w `dashboard/`:
GSC, GA4, Senuto (baza 2.0), Ahrefs, Bing Webmaster, Clarity, URL Inspection,
ruch botów AI z Cloudflare.

### Nowe elementy do zbudowania

| Element | Cel | Status |
| --- | --- | --- |
| Źródło `wordpress` w collectorze | katalog treści z REST + maper ACF + hash treści | ✅ 2026-07-28 |
| Wpis `content_watcher` dla `grupa-icea.pl` w `domains.yaml` | włączenie domeny do widoku | ✅ 2026-07-28 |
| Baza stanu (Cloudflare D1) | kolejka zadań, historia, cooldown, idempotencja | ⛔ |
| API Content Watchera w Workerze | tworzenie, pomijanie, anulowanie zadań | ⛔ |
| Webhook do n8n z podpisem | uruchomienie pipeline'u reoptymalizacji | ⛔ |
| Klucz do dostawcy embeddingów | warstwa semantyczna (Etap C) | ⛔ |

### Decyzje otwarte

1. Zakres CPT – częściowo rozstrzygnięty 2026-07-28: katalog obejmuje `posts`
   (458) i `dictionary` (146, mediana 231 słów). Otwarte pozostają `casestudy`,
   `industries`, `seonewsy`, `zos`, `opinions`.
2. ~~Wagi scoringu na dojrzałej domenie.~~ Rozstrzygnięte 2026-07-28: wiek
   przestał być składową punktową i jest wyłącznie warunkiem wejścia
   (`min_age_days`), a mianownik scoringu jest stały, więc brak danych nie
   podnosi wyniku. Progi per domena w `domains.yaml`; do weryfikacji po
   pierwszym cyklu reoptymalizacji.
3. Progi automatyzacji. Start: pełna ręczna akceptacja, automat wyłączony.
4. Kto akceptuje drafty i w jakim SLA.

## 4. Ryzyka

- **Fałszywa świeżość.** WordPress podbija `modified` przy każdym zapisie, w tym
  masowej akcji wtyczki. Bez detekcji realnej zmiany treści watcher pominie stare
  wpisy, a pipeline będzie produkował kosmetyczne aktualizacje, które
  wyszukiwarki dyskontują. Mitygacja: hash treści jako źródło prawdy.
- ~~**Sztywna struktura ACF.**~~ Nieaktualne: grupa pól ma 30 par
  `page_title_h2_N` / `page_text_N`, a rekord w użyciu to 29 sekcji. Limit
  szablonu nie jest wąskim gardłem dla pipeline'u uzupełniającego treść.
- **Optymalizacja pod hipotezę.** Jeśli nie mierzymy cytowań AI i wizyt botów,
  nie wiemy, czy odświeżanie działa. Pomiar wchodzi do zakresu Etapu A.
- **Publikacja bez nadzoru.** Zamknięta przez projekt: pipeline kończy się na
  draftcie.

## 5. Kolejność wdrożenia

1. ✅ Źródło `wordpress` w collectorze – katalog `grupa-icea.pl` w Content
   Watcherze (2026-07-28, 604 pozycje: blog + Słownik).
2. ✅ Kalibracja scoringu na realnych danych – 70 kandydatów z 604.
3. Etap 2 z planu: D1, API, kolejka, ręczna akceptacja, webhook n8n.
4. Zapis draftów do WordPressa przez Application Password.
5. Warstwa semantyczna: embeddingi, kanibalizacja, luki.
