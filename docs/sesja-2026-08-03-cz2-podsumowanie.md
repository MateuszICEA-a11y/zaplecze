# Sesja 2026-08-03 cz.2 – Content Watcher: edytor, źródła, frazy, stabilność pipeline'u

Wszystkie zmiany wdrożone na prod (worker `zaplecze-dashboard` + push do main).
Commity: `afa9ddc`, `c83b712`, `d453723`, `e9fd2ab`, `fa37e35`, `f6de9b5`, `0604831`, `541b733`.
(W pierwszym pushu pojechały też dwa zaległe commity news-generatora z porannej sesji: `f6fca77`, `f5bc1b2`.)

## Naprawy w edytorze

- **Duplikat sekcji „Źródła" po ponownym przebiegu** – rerun tworzy NOWY job, a edytor
  nakładał jego propozycje na dokument, w którym wisiała wstawka starego joba
  (druga, wyszarzona sekcja). Fix: `appliedJobId` + przebudowa dokumentu przy zmianie
  id joba. Na zapas w pipeline: `step_sources` nadpisuje istniejącą sekcję
  „Źródła/Bibliografia" zamiast zajmować kolejny slot.
- **Cooldown po nieudanym przebiegu blokował ponowienie** – lokalne `cooldownActive()`
  widzi tylko ostatni job („failed" → brak pytania o force), a Worker odrzucał przez
  wcześniejszy ukończony przejazd. Teraz `api()` niesie kod odmowy, a przy `cooldown`
  edytor pyta o zgodę i ponawia z `force=1`.

## Nowe funkcje edytora

- **Podgląd całości** – modal z docelową treścią wpisu jednym ciągiem (wersja po
  decyzjach; odrzucone sekcje w starym brzmieniu), bez podziału na sekcje.
- **Eksport do Google Docs** – „kopiuj do Google Docs" (schowek text/html, wklejka
  do docs.new zachowuje formatowanie) i „pobierz .doc" (otwiera się w Wordzie
  i Dokumentach Google).
- **Raport linków per sekcja** – blok „Linki" wypisuje dodane (+) i usunięte (−)
  adresy z anchorami; zniknięty link daje ostrzeżenie przy nagłówku sekcji.
- **Wariant odmiany na liście fraz** – przy policzonej frazie widać, jak brzmi
  w tekście („w tekście: «pozyskać klientów na fotowoltaikę»").

## UX widoku całościowego

- Pasek formatowania (B/I/H2…) pokazuje się dopiero przy fokusie w treści.
- Na ekranie ≥1500px „Ocena treści" z frazami stoi w przypiętej kolumnie obok
  dokumentu (`.ed-workspace`, aside sticky).
- Sekcje „Konkurencja w SERP" i „Co mają konkurenci" zwijają się automatycznie po
  zakończonym przebiegu (przycisk zwiń/rozwiń, ręczny wybór ma pierwszeństwo).
- Sekcje bez propozycji: mniejsze wyciszenie + etykieta „bez zmian".
- Kolory podświetleń fraz: „było w tekście" = bursztyn, „dopisane" = zieleń
  (gotcha: `--accent-blue` w motywie ICEA to limonka `#76b900` – odcienie się zlewały).

## Decyzje redakcyjne (Mateusz)

- **Źródła**: wyłącznie lista z `rel="nofollow"` w sekcji „Źródła" na końcu wpisu.
  ZERO odnośników `[n]`/linków przy tezach w treści. Jedyny link zewnętrzny w treści
  to JEDNA definicja z Wikipedii dla technicznego pojęcia (`MAX_DEFINITIONS=1`).
- Anchor definicji: samo pojęcie (≤3 słowa), nigdy fraza kluczowa/ofertowa wpisu –
  bramka w `apply_definitions` (`banned_phrases` = main_keyword/own_keyword/tytuł).

## Pipeline – jakość i stabilność

- **Ochrona linków** (rewrite 1.5.0→1.6.1): każdy `<a href>` z oryginalnej sekcji musi
  wrócić w przepisanej treści; usunięcie tylko z uzasadnieniem w `change`.
- **Odmiana fraz** (rewrite 1.6.x): surowa fraza z wyszukiwarki nigdy dosłownie –
  „leadów na fotowoltaikę", nie „leadów fotowoltaika". Odmiana nie zwalnia z pokrycia:
  każda fraza z wytycznych ma realnie paść w treści (ogólnik się nie liczy).
- **Matcher fraz w edytorze** znosi przyimki/spójniki między słowami frazy
  (`PHRASE_FILLERS`, maks. 2) – „ciepłe leady fotowoltaika" trafia w „ciepłych leadów
  na fotowoltaikę"; pokrycie/wynik/podświetlenia liczą się z odmianą.
- **Retry urwanych odpowiedzi OpenRoutera** – `JSONDecodeError` body („Expecting
  value: line 197…", keep-alive z pustych linii) jest retryowalny zamiast walić krok.
- **WAF seohost vs runnery** – fetch WP REST z runnerów GitHuba timeoutował
  (3×60 s), bo UA `content-refresher` jest dławiony; wyrównanie do collectora
  (przeglądarkowy UA w `wp.py`).

## Testy / weryfikacja

- Pipeline: 71 testów, worker: 85 – zielone po każdej rundzie.
- Weryfikacja UI na żywo: `wrangler dev --remote` + Playwright (gotcha: URL
  z `user:pass@` psuje `fetch()` strony; mutacje na lokalnym dev dostają 403
  z `checkMutationOrigin` – rozjazd hostów, na prodzie OK).

## Na następny raz

- Przejazd wpisu 20811 (fotowoltaika) z kompletem nowych reguł – sprawdzić pokrycie
  fraz, źródła bez znaczników i zachowanie linków.
- Decyzja: zapis draftów do WP (Application Password) wciąż otwarta z 2026-07-29.
