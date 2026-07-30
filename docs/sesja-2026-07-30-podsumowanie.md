# Sesja 2026-07-30 – edytor Content Watchera: użyteczność, dane i koszty

Pięć commitów na `main`, wszystkie wdrożone (Worker `39b5d4f4`).
Zakres: naprawa ślepych zaułków w edytorze, wymiana źródła fraz konkurencji,
redakcja całego interfejsu, podświetlanie fraz w treści i ukrócenie kosztu
kroków z wyszukiwaniem w sieci.

## 1. Ponowne uruchomienie przebiegu (`66dc6d4`)

Po statusie `done` znikała konfiguracja pipeline'u (checkboxy + wybór modeli),
a przycisk ponowienia pokazywał się wyłącznie dla zadań anulowanych – wpisu nie
dało się przepuścić drugi raz. Do tego cooldown w Workerze (`COOLDOWN_DAYS = 30`)
i tak odbijał żądanie kodem 409.

- „uruchom ponownie (zmień modele i zakres)" wraca też po udanym przebiegu,
  odsłania konfigurację i przewija do niej,
- `POST /api/cw/jobs?force=1` omija **wyłącznie** cooldown; limit dzienny
  i limit równoległych zadań zostają, `force: true` ląduje w `audit_log`,
- edytor sam wykrywa okno ochronne i pyta o zgodę, pokazując koszt.

## 2. Frazy konkurentów z pozycjami (`b45caa4`)

**Diagnoza:** frazy szły z Senuto Baza Słów Kluczowych (`getKeywords`), która
nie zwraca pozycji – pula sortowana po wolumenie wsypywała do tabeli frazy
brandowe („semcore", „seo poznań"). Dodatkowo SerpData potrafi zwrócić w wynikach
stronę główną konkurenta zamiast artykułu, a wtedy Senuto oddaje frazy całego
serwisu. Zweryfikowane sondą: dla `https://semcore.pl/` API zwraca dokładnie te
frazy, które trafiły do zrzutu użytkownika.

**Zmiana:** źródłem jest teraz Analiza Widoczności
(`visibility_analysis/reports/positions/getData`, `fetch_mode: url`,
`country_id: 200`) – zwraca frazy **z pozycją rywala** i działa dla cudzych
adresów. Zasady: pytamy osobno o każdy adres z SERP-u tematu, strony główne
pomijamy (rankują na cały biznes serwisu), zostają pozycje z TOP 20, dedup po
frazie z lepszą pozycją, sort po pozycji, maksymalnie 10 fraz. W tabeli doszła
kolumna „Poz. konkurenta" z hostem. Ta sama zmiana w `research.competitor_keywords`
i w prompcie briefu.

Efekt na wpisie „Zlecę pozycjonowanie": 66 fraz brandowych → 7 tematycznych.

Gotcha: `positions/getData` nie umie sortować ani filtrować po pozycji – trzeba
pobrać do 3 stron po 100 i uporządkować u siebie.

## 3. Redakcja interfejsu (`3d29e60`)

Zrzut wszystkich napisów do `docs/content-watcher-teksty-interfejsu.md`
(sekcje 1–16, pozycje L1–L57, E1–E101, W1–W22, S1–S13), użytkownik wypełnił
kolumnę „Nowy tekst", zmiany trafiły do kodu.

Globalne zamienniki: pipeline → proces optymalizacji, runner → proces w tle,
callback → potwierdzenie z systemu, payload/JSON → dane żądania, scoring → ocena,
engagement rate → wskaźnik zaangażowania, hash → suma kontrolna,
update → aktualizacja, rankować → być widocznym.

Dokument zostaje w repo jako zapis decyzji redakcyjnych.

## 4. Metryki z docelowej treści (`ef51d5f`)

**Diagnoza:** ocena treści liczyła wprost z DOM-u, a sekcja pokazana jako lista
różnic nie ma w nim tekstu – jej nagłówki, akapity i linki przepadały, a słowa
liczyły się podwójnie (wersja przed i po naraz). Stąd „12 nagłówków" przy
realnych 26 (5 sekcji ACF + 21 H3 w treści) i zawyżona objętość.

Metryki idą teraz z kopii docelowej treści (`docSnapshot`): z podglądu tam, gdzie
jest, a przy widoku różnic – z wersji, która wejdzie na stronę (odrzucona
propozycja = dotychczasowy tekst). Do nagłówków wliczane jest też H4.

Przy okazji: `IncompleteRead` z OpenRoutera wywracał krok zadania – doszły
3 próby z rosnącym odstępem dla błędów sieciowych i 429/5xx.

## 5. Podświetlanie fraz + reguły w promptach (`da0e96d`)

- Frazy z panelu „Frazy do pokrycia" są zaznaczane w dokumencie: niebieski =
  były w tekście, zielony = dopisane w tym przebiegu.
- Użyte **CSS Custom Highlight API**, nie `<mark>` – dokument jest edytowalny
  i zapisywany do zadania, więc jego HTML musi zostać nietknięty.
- Dopasowanie znosi odmianę (rdzeń po obcięciu do dwóch końcówek). Zweryfikowane
  w przeglądarce: trafia w nagłówek „Zlecenia pozycjonowania" i w zdanie
  przechodzące przez `<strong>`. Wystąpienie w nagłówku liczy się tak samo.
- Prompty (rewrite 1.4.0, brief 1.3.0): frazę wolno pominąć, jeśli nie da się
  jej wpleść bez sztucznego zdania; najwyżej dwa wystąpienia na sekcję; zakaz
  zbierania fraz w listy; rozszerzona lista nagłówków generycznych do przepisania
  i zakaz nagłówka będącego samą frazą w mianowniku.

## 6. Koszt wyszukiwania w sieci (`551bce7`)

**Diagnoza:** krok „Źródła i przypisy" na `x-ai/grok-4.5` zjadł 532 810 tokenów
wejścia; ten sam krok na `google/gemini-3-flash` – 3 824. Wyniki wyszukiwania
wracają do modelu jako kontekst w każdej turze, więc model szukający kilka razy
mnoży rachunek. Budżet 400 tys. padł przed „Linkami wewnętrznymi" i wywrócił
cały przejazd mimo gotowych sekcji.

- okno wyszukiwania: 4 wyniki zamiast 6, `search_context_size: low`,
- wyczerpany budżet w kroku **opcjonalnym** pomija pozostałe dokładki z podanym
  powodem i domyka zadanie przez `diff`; krok obowiązkowy nadal kończy przejazd
  stanem `budget_exceeded`,
- krok powyżej 150 tys. tokenów dostaje ostrzeżenie na osi przebiegu.

Rekomendacja: do modelu analizy `perplexity/sonar-pro` (wyszukiwanie wbudowane,
nie dostaje narzędzia), grok-4.5 do zadań bez sieci.

## Czyszczenie

Na życzenie usunięte z D1 wszystko dla `post_id 2838`
(`zlece-pozycjonowanie-o-czym-nalezy-pamietac`): 4 zadania, 33 kroki, 17 sekcji,
2 zapisane analizy. Wcześniej wyczyszczone 4 snapshoty SERP w starym formacie.

## Stan i co dalej

- Testy: Worker 85/85, pipeline 66/66, build 23 strony.
- Nowe reguły promptów i limity wyszukiwania obowiązują od kolejnego przejazdu.
- Otwarte z poprzedniej sesji: zapis draftów do WordPressa (czeka na Application
  Password).
