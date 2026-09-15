# Kosztorys BWP 2.0 – kalkulator kosztu wpisu, portalu i zespołu

Gotowe pliki: `kosztorys-bwp-2026-09-15.html` i `kosztorys-bwp-2026-09-15.pdf`.
HTML jest samodzielny: zawiera ilustrację, obliczenia i formularz. Przyciski zapisują CSV oraz HTML z aktualnymi parametrami, w tym dodanymi pracownikami. PDF pokazuje ustawienia bazowe.

**Korekta 15.09 po przeglądzie:** baza liczy zespół senior 250 zł/rbh + junior 9 000 zł/mies. (1:3), B ma 10 wpisów/mies., C ma 60 wpisów na start, 6/mies. i 2 min na wpis (publikacja bez czytania) oraz 98 h nadzoru (w tym 80 h próbkowej QA). Doszły: narzędzia researchu (B 180, C 2 500 zł/mies.), wariant górny 250 zł/rbh, miesiące uruchomienia i sekcja 05 z krzywą 1/10/100 i obsadą.

## Obsługa

- Ustaw liczbę portali, wpisów startowych i nowych miesięcznie.
- Publikacje dla klientów wpisuj jako dodatkowe tylko wtedy, gdy nie są już w planie redakcyjnym.
- Dodawaj pracowników z osobnymi stawkami godzinowymi lub kosztem miesięcznym, dostępnością i wagą udziału w pracy.
- Waga 1/1 oznacza podział 50/50. Koszt miesięczny jest przeliczany na rbh przez dostępność; do projektu przypisuje się tylko wykorzystaną pracę, nie całą pensję.
- Rozwiń założenia, aby zmienić czas obsługi wpisu, koszty infrastruktury, ceny modeli i tokeny.
- Profil B/C zmienia liczbę portali, wpisy, czas na wpis, godziny techniczne i narzędzia; zachowuje pracowników, grafiki i ceny modeli.

## Podstawa i wynik bazowy

Potwierdzone: 250 zł/rbh, około 100 wpisów na start, Claude 100 USD/mies. jako koszt wspólny oraz obecny hosting Pages 0 zł.
Założenia: zespół senior + junior (średnio 104,69 zł/rbh), 15 min pracy na wpis w B, 10 wpisów miesięcznie na portal, 1 grafika 1K, 25% rezerwy API i kurs budżetowy 4 PLN/USD. Wpis B kosztuje 27,01 zł (26,17 zł pracy + 0,84 zł API/grafika); wariant górny przy 250 zł/rbh dla całej pracy: 63,34 zł. Wpis C (2 min + redakcja API): 4,81 zł. Portal B w 12 mies.: 8 136 zł (bez kosztów wspólnych), C: 1 363 zł. Sieć B: CAPEX 58 tys., OPEX 6,8 tys./mies., rok 140 tys. To koszty bez VAT.

Ceny modeli sprawdzono 15.09.2026 na oficjalnych stronach Google, Anthropic, Perplexity i Kie.ai; linki są w dokumencie. Ceny są bez doliczania VAT. Domenę przyjęto jako rezerwę 100 zł na pierwszy rok. C ma rezerwę infrastruktury 200 zł/mies., nie ofertę dostawcy.

## Źródła utrzymywane

- `build_estimate.py` – treść dokumentu, formularz i składanie samodzielnego HTML.
- `visual-shell.html` – zachowana oprawa wizualna i osadzona ilustracja. Jest fragmentem źródłowym, nie plikiem do wysyłki.
- `cost-model.js` – czyste obliczenia, cenniki i parametry domyślne.
- `calculator-ui.js` – obsługa formularza, pracowników i eksportów.
- `cost-model.test.cjs`, `verify-ui.cjs` – obliczenia oraz sprawdzenie w Chrome.

Budowanie: `python output/kosztorys-bwp-v3/build_estimate.py`.
Testy obliczeń: `node --test output/kosztorys-bwp-v3/cost-model.test.cjs`.
Testy interfejsu i odświeżenie PDF: `node output/kosztorys-bwp-v3/verify-ui.cjs` (lokalny Chrome na porcie 9347).
`check.cjs` jest skrótem do aktualnej weryfikacji. Dawne `refine.py` i `finalize.py` są historycznymi skryptami i nie należy ich uruchamiać na aktualnym dokumencie.

Sprawdzono: koszt wpisu, CAPEX/OPEX, skalowanie liczby wpisów, dwóch pracowników z różnymi kosztami, przeliczenie kosztu miesięcznego, wybór grafiki, błędne dane, CSV, ponowne otwarcie zapisanego HTML z zespołem, szerokość 1440/390 px i układ PDF. `qa-snapshot.html` zawiera dane testowe, nie jest kosztorysem do przekazania.
