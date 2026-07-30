# Content Watcher – teksty interfejsu do redakcji

> **Status: wprowadzone 2026-07-30.** Wszystkie wypełnione pola trafiły do kodu,
> razem z globalnymi zamiennikami z sekcji 16. Dokument zostaje jako zapis
> decyzji redakcyjnych – przy kolejnej rundzie wystarczy dopisać nowe wersje.

Zrzut wszystkich napisów widocznych dla użytkownika w module Content Watcher:
lista priorytetów, edytor wpisu i komunikaty zwracane przez Workera.

**Jak z tego korzystać:** wpisz nową wersję w kolumnie „Nowy tekst”. Puste pole
= zostawiamy jak jest. Po odesłaniu pliku wrzucam zmiany do kodu jedną paczką.

**Legenda:** ⚑ = miejsce, w którym sam widzę żargon, kalkę albo niekonsekwencję.
`{coś}` oznacza wartość wstawianą w locie (liczbę, datę, nazwę modelu) – w nowej
wersji zachowaj te wstawki.

Pliki źródłowe:
- `dashboard/app/src/pages/[domain]/content-watcher.astro` – lista priorytetów
- `dashboard/app/src/pages/[domain]/content-watcher/edytor.astro` – edytor wpisu
- `dashboard/app/cw-api.js`, `cw-serp.js`, `cw-rivals.js`, `cw-expert.js` – Worker

---

## 1. Lista priorytetów – nagłówki i wstęp

| # | Gdzie | Obecny tekst | Nowy tekst |
|---|---|---|---|
| L1 | Wstęp, akapit 1 | Moduł Content Watcher łączy metadane artykułów ze statusem indeksacji oraz danymi z GSC, GA4 i Senuto. Wskaźnik priorytetu podpowiada, które teksty warto zweryfikować ręcznie przed ich ponowną optymalizacją (integrację z kolejką n8n dodamy w kolejnym etapie). | |
| L2 | Wstęp, ciąg dalszy ⚑ | Baza tekstów jest pobierana przez REST API WordPressa, a treści budujemy z pól ACF. | |
| L3 | Wstęp, akapit 2 ⚑ | Co ważne, „Data aktualizacji” odzwierciedla rzeczywistą zmianę tekstu weryfikowaną na podstawie sumy kontrolnej (tzw. hasha). Ignorujemy dzięki temu systemowe pole `modified`, które aktualizuje się przy każdym kliknięciu „Zapisz” w CMS-ie. | |
| L4 | Wstęp, akapit 2 c.d. ⚑ | Dla {n} wpisów obecny hash to dopiero stan początkowy – do czasu ich pierwszej edycji wyświetlamy tam standardową datę modyfikacji. | |
| L5 | Nagłówek sekcji | Stan treści | |
| L6 | Podpis sekcji ⚑ | katalog i scoring na {data} | |
| L7 | Nagłówek sekcji | Pilność odświeżenia | |
| L8 | Podpis sekcji | wyniki × wiek · słabe wyniki = kliknięcia i wyświetlenia z 30 dni poniżej mediany domeny ({n} klik. / {n} wyśw.) | |
| L9 | Nagłówek sekcji ⚑ | Priorytety reoptymalizacji | |
| L10 | Podpis sekcji | Pilność zależy od relacji wyników do wieku wpisu • Wynik (0–100) decyduje o kolejności wpisów o tej samej pilności i uwzględnia: utratę ruchu, potencjał, pokrycie fraz oraz zaangażowanie • Obowiązuje {n}-dniowy okres ochronny • Kliknij „Szczegóły”, aby zobaczyć składowe oceny. | |
| L11 | Wskaźnik w rogu ⚑ | Automatyzacja / OFF | |
| L12 | Dymek wskaźnika ⚑ | Automatyzacja zostanie uruchomiona po wdrożeniu kolejki i callbacków n8n | |

## 2. Lista priorytetów – karty wieku treści

Każda karta ma nazwę (nagłówek) i podpis pod liczbą.

| # | Nazwa karty | Podpis | Nowy tekst (nazwa / podpis) |
|---|---|---|---|
| L13 | Wszystkie publikacje | baza wiedzy | |
| L14 | Świeże treści | aktualne (do 3 mies.) | |
| L15 | Do przeglądu | starzejące się (3–6 mies.) | |
| L16 | Zaplanuj update ⚑ | tracące wartość (6–12 mies.) | |
| L17 | Pilny audyt / recykling ⚑ | krytyczne zaległości (ponad 12 mies.) | |

## 3. Lista priorytetów – karty pilności

| # | Nazwa karty | Podpis | Nowy tekst (nazwa / podpis) |
|---|---|---|---|
| L18 | Krytyczny | słabe wyniki, ponad 12 mies. | |
| L19 | Wysoki | słabe wyniki, 6–12 mies. | |
| L20 | Normalny | słabe wyniki, 3–6 mies. | |
| L21 | Niski | świeże lub z ruchem | |
| L22 | Poza indeksem | wymaga osobnej diagnozy | |

## 4. Lista priorytetów – tabela artykułów

| # | Gdzie | Obecny tekst | Nowy tekst |
|---|---|---|---|
| L23 | Tytuł tabeli | Artykuły | |
| L24 | Pusta tabela | Nie znaleziono artykułów w skonfigurowanej kolekcji. | |
| L25 | Nagłówki kolumn | Pilność · Treść · Publikacja · Aktualizacja · GSC · 30 dni · Zmiana · 90 dni · GA4 · Status | |
| L26 | Przyciski w wierszu | Szczegóły · Edytor | |
| L27 | Etykieta pilności | krytyczny / wysoki / normalny / niski / poza oceną ⚑ | |
| L28 | Pod pilnością | wynik {n}/100 | |
| L29 | Stan wpisu | w indeksie / poza indeksem / brak pomiaru | |
| L30 | Dymek przy dacie ⚑ | Data z pola modified – hash treści jest dopiero punktem odniesienia | |
| L31 | Pod datą | {n} dni temu | |
| L32 | Kolumna GSC | {n} klik. · {n} wyśw. · CTR {n}% | |
| L33 | Kolumna zmiany | pozycja: – / pozycja {±n} | |
| L34 | Kolumna GA4 | {n} sesji · eng. {n}% ⚑ | |
| L35 | Status, druga linia | bez zmian {do 3 mies. / 3–6 mies. / 6–12 mies. / ponad 12 mies.} | |
| L36 | Status, dopisek | · słabe wyniki / · wyniki OK ⚑ | |

## 5. Lista priorytetów – okno szczegółów

| # | Gdzie | Obecny tekst | Nowy tekst |
|---|---|---|---|
| L37 | Tytuł okna | Szczegóły artykułu | |
| L38 | Nagłówek sekcji | Wyniki | |
| L39 | Etykiety danych | Publikacja · Aktualizacja · Wiek treści · Indeksacja · GSC · Zmiana 90 dni · GA4 · Senuto · Struktura · Plik | |
| L40 | Nagłówek sekcji | Dlaczego taki priorytet? | |
| L41 | Nagłówek sekcji | Na jakie frazy rankuje ⚑ | |
| L42 | Opis wyniku | Suma czterech składowych. Mianownik jest stały – brak danych w źródle nie podnosi wyniku, tylko odbiera jego maksimum. | |
| L43 | Kolejka | Kolejka automatyzacji | |
| L44 | Kolejka, opis ⚑ | W etapie 2 ten przycisk wyśle zatwierdzone zadanie do n8n i pokaże tutaj status oraz link do PR. | |
| L45 | Przycisk ⚑ | Dodaj do kolejki · etap 2 | |
| L46 | Powód priorytetu | utrata {n} kliknięć | |
| L47 | Powód priorytetu | pozycja spadła o {n} | |
| L48 | Powód priorytetu | {n} wyświetleń przy pozycji {n} | |
| L49 | Powód priorytetu | pozycja {n} — blisko TOP 10 ⚑ (myślnik zamiast półpauzy) | |
| L50 | Powód priorytetu | CTR {n}% mimo {n} wyświetleń | |
| L51 | Brak powodów | Brak silnego sygnału do reoptymalizacji. ⚑ | |
| L52 | Brak fraz | Senuto nie widzi tego adresu w wynikach wyszukiwania. | |
| L53 | Brak porównania | brak porównania | |

## 6. Lista priorytetów – składowe oceny

Każda składowa ma nazwę, krótki podpis i wyjaśnienie w dymku.

| # | Nazwa | Podpis | Wyjaśnienie | Nowy tekst |
|---|---|---|---|---|
| L54 | Utrata ruchu | Search Console: spadek kliknięć i pozycji względem poprzednich 90 dni | Ile kliknięć i pozycji wpis stracił przez ostatnie 90 dni. Im większy spadek, tym więcej punktów. Dane: Search Console. Brak danych = wpis nie miał wyświetleń w jednym z porównywanych okresów. | |
| L55 | Potencjał | Search Console, 30 dni: wyświetlenia, pozycja 4–30, niskie CTR | Ile wpis może jeszcze zyskać. Punkty rosną, gdy strona ma dużo wyświetleń, stoi tuż za TOP 10 albo jest często pokazywana, a rzadko klikana. Dane: Search Console, ostatnie 30 dni. | |
| L56 | Pokrycie fraz | Senuto: frazy na pozycjach 11–30 i poza TOP 10 | Ile fraz stoi tuż pod progiem widoczności – pozycje 11–30 i frazy poza TOP 10. Dane: Senuto. Zero punktów = adres rankuje na jakieś frazy, ale żadna nie jest tuż pod progiem. Brak danych = Senuto nie widzi tego adresu w wynikach wyszukiwania. | |
| L57 | Zaangażowanie ⚑ | GA4: engagement rate poniżej 60% (od 10 sesji w górę) | Jak słabo wpis angażuje czytelników – im niższy engagement rate, tym więcej punktów. Dane: GA4, liczone od 10 sesji w górę. | |

---

## 7. Edytor – nagłówek wpisu

| # | Gdzie | Obecny tekst | Nowy tekst |
|---|---|---|---|
| E1 | Powrót | ← wróć do listy priorytetów | |
| E2 | Brak wpisu | Nie wskazano wpisu. Wejdź tu z listy priorytetów, klikając „Edytor” przy wybranym artykule. | |
| E3 | Dane wpisu | Publikacja · Zmiana treści · Objętość · Autor | |
| E4 | Objętość | {n} słów · {n} nagłówków | |

## 8. Edytor – sekcja SERP

| # | Gdzie | Obecny tekst | Nowy tekst |
|---|---|---|---|
| E5 | Nagłówek | Kto rankuje na ten temat ⚑ | |
| E6 | Opis | Dwa zapytania do Google – tytuł wpisu i nasza najlepsza fraza. Widać, kto stoi w czołówce i na której pozycji jesteśmy my. | |
| E7 | Przycisk | Sprawdź SERP | |
| E8 | Przycisk w trakcie | sprawdzam SERP… | |
| E9 | Etap pracy | sprawdzam, kto zajmuje temat… | |
| E10 | Etap pracy | sprawdzam naszą frazę… | |
| E11 | Etap pracy | pobieram frazy konkurencji… | |
| E12 | Nagłówki kolumn wyników | Temat wpisu (z tytułu) · Nasza najlepsza fraza dziś | |
| E13 | Nasz wynik | nasz wpis | |
| E14 | Brak nas w wynikach | nas nie ma w {n} sprawdzonych wynikach / naszego adresu nie ma w wynikach | |
| E15 | Brak wyników | brak wyników organicznych | |
| E16 | Rozjazd tematu ⚑ | Rankujemy obok tematu: {domeny} trzymają temat wpisu, ale nie ma ich w wynikach naszej dzisiejszej frazy. | |
| E17 | Liczniki | trafnych fraz konkurentów · nie mamy wcale · poza TOP 10 · mamy w TOP 10 · fraz rankujących wpisu | |
| E18 | Nagłówki tabeli fraz | Fraza · Poz. konkurenta · Wyszukiwań/mies. · Nasza pozycja · Status | |
| E19 | Status frazy | nie mamy / poza TOP 10 / mamy | |
| E20 | Zwijanie listy | pokaż wszystkie frazy ({n}) / zwiń listę fraz | |
| E21 | Brak fraz | Senuto nie zna fraz w TOP 20 dla podstron tych konkurentów, więc porównania fraz nie ma – zostaje lista wyników i rozjazd tematu. Dane o naszych frazach pochodzą z dziennego odczytu Senuto. | |
| E22 | Same strony główne | W czołówce stoją same strony główne ({n}) – rankują na cały biznes serwisu, nie na temat wpisu, więc ich fraz nie zbieramy. Zostaje lista wyników i rozjazd tematu. | |
| E23 | Błąd | Poprzednia analiza SERP zakończyła się błędem. | |
| E24 | Błąd | Analiza SERP nie powiodła się. | |
| E25 | Błąd | Nie udało się sprawdzić SERP-a. | |
| E26 | Błąd | Nie udało się odczytać wyniku analizy. | |
| E27 | Zbyt długo | Analiza SERP trwa dłużej niż zwykle. Kliknij „Sprawdź SERP”, aby dokończyć. | |

## 9. Edytor – sekcja treści konkurentów

| # | Gdzie | Obecny tekst | Nowy tekst |
|---|---|---|---|
| E28 | Nagłówek | Co mają konkurenci | |
| E29 | Opis | Czytamy trzy teksty z czołówki i nasz wpis, porównujemy długość i wypisujemy konkrety, których u nas brakuje. | |
| E30 | Przycisk | Pobierz treści konkurentów | |
| E31 | Przycisk w trakcie | pobieram treści… | |
| E32 | Etapy pracy | pobieram nasz wpis… · pobieram teksty konkurentów… · porównuję fakty… | |
| E33 | Wiersze długości | nasz wpis · mediana konkurencji ⚑ · {n} słów · cel objętości w ocenie treści | |
| E34 | Błąd strony | nie udało się przeczytać: {powód} | |
| E35 | Tematy | Tematy, których nasz wpis w ogóle nie dotyka: {lista}. | |
| E36 | Typy faktów ⚑ | liczba / definicja / procedura / przykład / narzędzie / ryzyko | |
| E37 | Odnośnik | źródło | |
| E38 | Zastrzeżenie | Fakty pochodzą z cudzych stron – przed wklejeniem do wpisu zweryfikuj je u źródła. Model: {model}. | |
| E39 | Brak faktów | Model nie znalazł konkretów, których nie mielibyśmy w tekście. | |
| E40 | Brak adresów | Najpierw sprawdź SERP – stamtąd biorą się adresy konkurentów. | |
| E41 | Błąd | Poprzedni odczyt zakończył się błędem. / Odczyt nie powiódł się. / Nie udało się odczytać wyniku. | |
| E42 | Błąd | Nie udało się przeczytać stron konkurencji. | |
| E43 | Zbyt długo | Pobieranie trwa dłużej niż zwykle. Kliknij „Pobierz treści konkurentów”, aby dokończyć. | |

## 10. Edytor – konfiguracja przebiegu

| # | Gdzie | Obecny tekst | Nowy tekst |
|---|---|---|---|
| E44 | Grupa pól ⚑ | Pakiet ulepszeń | |
| E45 | Zakres prac ⚑ | Uzupełnienie luk treści (rozpoznanie wyników Google → wytyczne → przepisanie sekcji) | |
| E46 | Zakres prac | Źródła i przypisy (autorytatywne linki + definicja z Wikipedii) | |
| E47 | Zakres prac | Linki wewnętrzne (dopasowanie z katalogu treści serwisu) | |
| E48 | Pola modeli | Model analizy · Model pisania · Pokaż listę modeli | |
| E49 | Podpis pod modelami ⚑ | modele przez OpenRouter · {n} dostępnych | |
| E50 | Podpis pod modelami ⚑ | modele przez OpenRouter · lista niedostępna, wpisz ID ręcznie | |
| E51 | Lista modeli | lista modeli niedostępna | |
| E52 | Przycisk startu ⚑ | Uruchom optymalizację | |
| E53 | Koszt ⚑ | Koszt: jedno zapytanie SERP (SerpData), frazy z Senuto i kilkadziesiąt tysięcy tokenów. Ten sam wpis raz na 30 dni. Wynik to propozycja – nic nie trafia do WordPressa automatycznie. | |
| E54 | Błąd walidacji | Wybierz przynajmniej jedno ulepszenie. ⚑ | |
| E55 | Błąd walidacji ⚑ | Identyfikator modelu ma format „dostawca/model" (np. anthropic/claude-sonnet-5). | |
| E56 | Pytanie o ponowienie ⚑ | Ten wpis przeszedł reoptymalizację {data}, a limit to jeden przebieg na 30 dni. Uruchomić mimo to? Nowy przebieg to kolejne zapytania SERP, frazy z Senuto i kilkadziesiąt tysięcy tokenów. Poprzedni wynik zostanie zastąpiony w widoku. | |

## 11. Edytor – postęp i podsumowanie

| # | Gdzie | Obecny tekst | Nowy tekst |
|---|---|---|---|
| E57 | Stan zadania ⚑ | w kolejce / uruchamianie / w toku / zakończone / błąd / anulowane / runner przestał odpowiadać / przerwane – budżet | |
| E58 | Pasek postępu | uruchamianie… · krok {n} z {n} · anuluj | |
| E59 | Nazwy kroków ⚑ | Pobranie treści · Frazy własne · Wyniki wyszukiwania · Treść konkurencji · Frazy konkurencji · Wytyczne · Przepisanie sekcji · Porada eksperta · Źródła i przypisy · Linki wewnętrzne · Porównanie zmian | |
| E60 | Krok pominięty | pominięty | |
| E61 | Podsumowanie kosztu ⚑ | analiza: {model} · pisanie: {model} · {n} tokenów · {n} zap. SERP | |
| E62 | Przycisk | uruchom ponownie (zmień modele i zakres) | |
| E63 | Karta błędu ⚑ | przebieg nieudany · krok: {nazwa} · log przebiegu ↗ | |
| E64 | Karta błędu | Przebieg zakończył się bez podania przyczyny. | |
| E65 | Błąd | Nie udało się zakolejkować zadania. ⚑ | |
| E66 | Błąd | Nie udało się anulować zadania. | |
| E67 | Błąd | Nie udało się odczytać stanu zadań. | |

## 12. Edytor – wytyczne i porada eksperta

| # | Gdzie | Obecny tekst | Nowy tekst |
|---|---|---|---|
| E68 | Nagłówek | Wytyczne z analizy (luki wobec konkurencji i frazy do pokrycia) | |
| E69 | Ostrzeżenie ⚑ | Ucięta treść · Uwaga: wpis jest długi i analiza objęła tylko jego początek – końcowe sekcje mogły nie wejść do wytycznych. | |
| E70 | Podsekcje | Frazy do pokrycia · Pominięte zalecenia nagłówków · Luki wobec konkurencji | |
| E71 | Nagłówek | Etap końcowy · porada eksperta ⚑ | |
| E72 | Podpis | cytat osoby z ICEA (innej niż autor), wybrany model pisania | |
| E73 | Przyciski | Dodaj poradę eksperta · odrzuć · spróbuj ponownie | |
| E74 | W trakcie | generowanie cytatu… | |
| E75 | Błąd | Nie udało się wygenerować cytatu. | |

## 13. Edytor – ocena treści

| # | Gdzie | Obecny tekst | Nowy tekst |
|---|---|---|---|
| E76 | Nagłówek | Ocena treści (liczona z aktualnej treści w edytorze) | |
| E77 | Wskaźnik | {n} na 100 | |
| E78 | Składowe | Objętość · Nagłówki · Linki wewnętrzne · Świeżość · Pokrycie fraz | |
| E79 | Objętość | {n} z {n} słów (mediana czołówki) / {n} z ~{n} słów | |
| E80 | Świeżość | dziś / {n} dni od zmiany treści | |
| E81 | Frazy | Frazy do pokrycia · {n} z {n} użytych w treści | |
| E82 | Brak listy | uruchom rozpoznanie wyników, żeby zobaczyć listę ⚑ | |
| E83 | Brak listy | uruchom „Sprawdź SERP”, żeby zobaczyć listę | |
| E84 | Brak fraz | brak fraz do pokrycia – Senuto nie zna fraz tych konkurentów | |
| E85 | Notatka przy frazie | nie mamy / poza TOP 10 (poz. {n}) / z wytycznych / nasza poz. {n} | |

## 14. Edytor – dokument i decyzje

| # | Gdzie | Obecny tekst | Nowy tekst |
|---|---|---|---|
| E86 | Nagłówek | Dokument · treść wpisu z WordPressa | |
| E87 | Podpis | {n} sekcji · pełna treść z WordPressa | |
| E88 | Wczytywanie | wczytywanie treści… | |
| E89 | Brak sekcji ⚑ | Ten wpis nie ma sekcji ACF (page_text_N) – dokument zostanie zbudowany z wyniku optymalizacji. | |
| E90 | Błąd wczytania ⚑ | Nie udało się wczytać treści wpisu ({powód}). Pipeline można uruchomić mimo to – dokument pojawi się z propozycjami. | |
| E91 | Statystyki | {n} słów · {n} nagłówków · {n} akapitów | |
| E92 | Pasek decyzji | {n} propozycji czeka na decyzję / wszystko ocenione · {n} do wdrożenia | |
| E93 | Przyciski | zatwierdź wszystkie · kopiuj zatwierdzone · tylko zmienione sekcje | |
| E94 | Dymki decyzji | Zatwierdź propozycję dla tej sekcji · Odrzuć propozycję dla tej sekcji | |
| E95 | Przełącznik widoku | podgląd / oryginał | |
| E96 | Przyciski sekcji | kopiuj nagłówek · kopiuj treść · edytuj tekst · zapisz szkic · zapisz poprawki · odrzuć szkic · skopiowano | |
| E97 | Znaczniki sekcji | szkic lokalny ⚑ · ręcznie poprawiona · przesunięta z sekcji {n} | |
| E98 | Zmiana objętości | +{n} / −{n} słów · model wyciął więcej, niż dopisał | |
| E99 | Edytor tekstu | Wstaw odnośnik · Adres odnośnika (https://…) · wyczyść · Usuń formatowanie zaznaczenia | |
| E100 | Błąd | Nie udało się zapisać decyzji. / Nie udało się zapisać poprawek. | |
| E101 | Błąd | Nie udało się zapisać szkicu w przeglądarce (brak miejsca?). | |

---

## 15. Komunikaty Workera (widoczne jako błędy w edytorze)

| # | Kiedy | Obecny tekst | Nowy tekst |
|---|---|---|---|
| W1 | Wpis już się liczy | Ten wpis ma już zadanie w toku. | |
| W2 | Okres ochronny ⚑ | Ten wpis przechodził reoptymalizację {data}. Kolejne zadanie możliwe po 30 dniach. | |
| W3 | Limit równoległy ⚑ | Limit {n} równoległych zadań na domenę. | |
| W4 | Limit dzienny | Dzienny limit {n} zadań wyczerpany. | |
| W5 | Odrzucone ⚑ | Zadania nie udało się zakolejkować. | |
| W6 | Zła domena | Edytor nie obsługuje tej domeny. | |
| W7 | Zły adres | Nieprawidłowy adres wpisu. | |
| W8 | WordPress ⚑ | Nie udało się pobrać treści z WordPressa. / WordPress odpowiedział {kod}. / WordPress zwrócił nieprawidłową odpowiedź. | |
| W9 | Za duża treść | Treść wpisu jest za duża. / Poprawiona treść jest za duża. | |
| W10 | Start przebiegu ⚑ | Nie udało się uruchomić workflow w GitHub Actions. / Nie udało się uruchomić pipeline'u. | |
| W11 | Brak sekcji | Nie ma takiej sekcji. | |
| W12 | Ekspert ⚑ | Porada eksperta jest dostępna po zakończeniu pipeline'u. | |
| W13 | Ekspert | Cytat jest właśnie generowany. / Nie ma cytatu do odrzucenia. | |
| W14 | Anulowanie | Zadania w stanie „{stan}" nie da się anulować. | |
| W15 | Runner ⚑ | Runner przestał raportować postęp. | |
| W16 | Odrzucone żądanie ⚑ | Żądanie odrzucone. / Nieprawidłowy JSON. / Body musi być poprawnym JSON-em. / Payload za duży. | |
| W17 | Brak zadania | Nie ma takiego zadania. | |
| W18 | Model ⚑ | OpenRouter odpowiedział {kod}. / OpenRouter nie odpowiedział: {powód} | |
| W19 | Model | Model nie zmieścił odpowiedzi w limicie – spróbuj ponownie. / Model nie zwrócił poprawnej listy faktów. / Model nie zwrócił poprawnego cytatu. | |
| W20 | Konkurenci | Nie udało się przeczytać treści konkurencji. / Najpierw sprawdź SERP – nie ma adresów konkurentów. | |
| W21 | SERP | Nieznany błąd analizy SERP. | |
| W22 | Ekspert | Zadanie nie ma treści sekcji do skomentowania. | |

---

## 16. Nazwy pojawiające się w wielu miejscach

Te słowa wracają w kilkunastu napisach naraz – jeśli któreś ma zniknąć,
wystarczy podać zamiennik tutaj, a podmienię wszędzie.

| # | Słowo | Gdzie występuje | Zamiennik |
|---|---|---|---|
| S1 | pipeline ⚑ | komunikaty błędów, opis dokumentu, ekspert | |
| S2 | reoptymalizacja ⚑ | nagłówek listy, komunikat okresu ochronnego, powody priorytetu | |
| S3 | przebieg | pasek postępu, karta błędu, potwierdzenie ponowienia | |
| S4 | zadanie / zakolejkować ⚑ | komunikaty Workera, kolejka automatyzacji | |
| S5 | runner ⚑ | stan „runner przestał odpowiadać", komunikat o braku raportów | |
| S6 | callback ⚑ | dymek automatyzacji na liście | |
| S7 | payload / body / JSON ⚑ | komunikaty odrzuconych żądań | |
| S8 | ulepszenia / pakiet ulepszeń ⚑ | konfiguracja przebiegu, walidacja | |
| S9 | scoring ⚑ | podpis „katalog i scoring na {data}" | |
| S10 | engagement rate ⚑ | składowa oceny, kolumna GA4 („eng.") | |
| S11 | hash ⚑ | wstęp listy, dymek przy dacie | |
| S12 | update ⚑ | karta „Zaplanuj update" | |
| S13 | rankować ⚑ | „Kto rankuje na ten temat", „Na jakie frazy rankuje", „fraz rankujących wpisu" | |
