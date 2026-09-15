# Sesja 15.09.2026 – kosztorys BWP 2.0

## Stan na koniec

Gotowy lokalny kalkulator kosztu wpisu, portalu i całej sieci. Użytkownik zaakceptował postęp i poprosił o jego zapisanie. Ostatnia funkcja: wielu pracowników z różnymi kosztami, udziałem w pracy i dostępnością. Nie ma otwartego zlecenia kolejnej zmiany.

Pliki do użycia:

- `C:/projekty/icea/transformacja-zaplecza-seo/output/kosztorys-bwp-v3/kosztorys-bwp-2026-09-15.html`
- `C:/projekty/icea/transformacja-zaplecza-seo/output/kosztorys-bwp-v3/kosztorys-bwp-2026-09-15.pdf`

HTML jest samodzielny: ma osadzoną ilustrację i JavaScript. PDF ma 7 stron i pokazuje ustawienia bazowe. Przycisk zapisu HTML zachowuje zmienione pola i dodanych pracowników; CSV zawiera parametry i wyniki.

## Ustalenia użytkownika

- **250 zł za roboczogodzinę** operatora Claude. Wcześniejsze sformułowanie „250 zł miesięcznie” zostało wyjaśnione i nie obowiązuje.
- Około **100 wpisów na start** portalu, potem cykliczna publikacja. Liczba nowych wpisów miesięcznie ma być zmienną kalkulatora.
- Linkowanie dla klienta obejmuje koszt przygotowania treści i publikacji. Wpis już uwzględniony w planie redakcyjnym nie może być naliczony drugi raz.
- **Claude 100 USD/mies.** to stały koszt wspólny, także po uruchomieniu portalu. Nie mnożymy go przez liczbę domen. Dodatkowe konta lub API mogą zwiększyć koszt.
- Hosting Cloudflare Pages obecnie **0 zł**. Dla większej skali możliwa zmiana architektury i wydatków.
- BusManiak powstawał podczas promocji limitów Claude; nie wolno z tego wyprowadzać standardowej przepustowości.
- Użytkownik dopuścił oszacowanie kosztu jednostkowego z internetowych cenników modeli językowych i Kie.ai oraz automatyzację przez API poza Claude Code.
- Kalkulator ma umożliwiać dodanie np. dwóch pracowników z różnymi kosztami.

## Zaimplementowany model

- Profile B (domyślnie 15 portali) i C (250); liczbę można zmieniać od 1 do 1000.
- Wpisy startowe, miesięczne redakcyjne i dodatkowe publikacje dla klientów.
- Osobno koszt pracy i API/grafik, uruchomienie portalu, miesięczne utrzymanie, pełny i dodatkowy koszt roku, CAPEX/OPEX sieci, wydatki zewnętrzne i praca wewnętrzna.
- Wybór Nano Banana 2 / GPT Image 2 oraz rozdzielczości 1K/2K/4K.
- Redakcja w abonamencie Claude albo przez płatne API. Wariant abonamentowy nie dolicza drugi raz redakcji Sonnet API.
- Dowolna liczba pracowników: nazwa, koszt godzinowy lub miesięczny, dostępne godziny, waga udziału. Wagi 1/1 oznaczają po 50% pracy.
- Koszt miesięczny pracownika przeliczany na rbh przez dostępne godziny; do projektu przypisywany jest jego nakład, nie automatycznie cała pensja. Jednolity podział udziałów obowiązuje dla wszystkich prac projektu.
- Sygnalizacja przekroczenia miesięcznej dostępności każdego pracownika. Całkowity czas uruchomienia nie jest porównywany z jednym miesiącem bez harmonogramu.
- Eksport CSV i samodzielnego HTML; druk do PDF. Nieprawidłowe/puste wartości usuwają poprzednie wyniki i blokują eksport.

## Założenia planistyczne, nie pomiary

- Wpis około 1200–1800 słów, 15 min pracy: przygotowanie 5, kontrola i poprawki 7, publikacja 3. Klient: dodatkowe 10 min.
- Domyślnie 1 nowy wpis miesięcznie, 0 dodatkowych dla klienta, 1 grafika 1K.
- Kurs budżetowy 4 PLN/USD, rezerwa API 25%, bez doliczania VAT.
- Domena: rezerwa 100 zł na pierwszy rok. C: wspólna infrastruktura 200 zł/mies. To nie są oferty dostawców.
- B: 8 h uruchomienia technicznego/portal, 36 h wspólnego procesu, 1 h obsługi/portal/mies. i 6 h wspólnego nadzoru.
- C: odpowiednio 3 h, 240 h, 0,25 h i 18 h. Panel stanowi 108 h w obrębie wspólnych 240 h.
- Produkcja treści jest liczona oddzielnie od pracy technicznej. Dawne widełki całościowe 12–20 h nie są dodatkowo stosowane.
- Pierwszy rok oznacza uruchomienie + 12 miesięcy działania całej sieci, nie harmonogram narastania portali. Trafialność jest analizą wrażliwości, nie prognozą.

## Zweryfikowane ceny i wynik jednostkowy

Cenniki odczytane 15.09.2026; źródła są też w HTML i notatce założeń:

- Gemini 3.5 Flash: 1,50/9 USD za mln tokenów wejścia/wyjścia. Założone 16000/8000 = 0,096 USD. https://ai.google.dev/gemini-api/docs/pricing
- Sonar: 1/1 USD za mln tokenów i 0,008 USD/zapytanie medium. Założone 12000/4000 łącznie + 2 zapytania = 0,032 USD. https://docs.perplexity.ai/docs/getting-started/pricing
- Sonnet 4.6: 3/15 USD za mln tokenów. Założone 12000/4000 = 0,096 USD w wariancie API. https://platform.claude.com/docs/en/about-claude/pricing
- Nano Banana 2: 1K 0,04, 2K 0,06, 4K 0,09 USD/obraz. https://kie.ai/nano-banana-2
- GPT Image 2: 1K 0,03, 2K 0,05, 4K 0,08 USD/obraz. Użytkownik napisał „gpt2”; przyjęto ten model. https://kie.ai/gpt-image-2

Przy ustawieniach bazowych jeden wpis kosztuje **63,34 zł** (62,50 zł pracy + 0,84 zł API/grafika). W pełnym API **63,82 zł**. Wpis klienta w B **105,01 zł**. Te kwoty nie zawierają udziału stałych kosztów sieci.

Dwie osoby za 250 i 100 zł/rbh, z równym udziałem, dają średnią stawkę 175 zł/rbh i koszt wpisu B **44,59 zł**.

## Weryfikacja

- 8/8 testów modelu: arytmetyka, koszt wspólny liczony raz, skalowanie wpisów, trasy modeli, grafiki, walidacja i zespół.
- Testy Chrome: kwoty bazowe, zmiana miesięcznej liczby wpisów bez zmiany CAPEX, dodatkowe wpisy klientów, dodanie drugiej osoby, różne stawki, koszt miesięczny przeliczony na godziny, model grafiki, profil C, błędne dane.
- Sprawdzono CSV oraz ponowne otwarcie zapisanego HTML z dwiema osobami i ich ustawieniami.
- Układ 1440/390 px bez poziomego przepełnienia strony; przejrzano render PDF.
- Luna wykonała research cen Kie, implementację silnika i niezależny przegląd integracji. Poprawiono wykryty fałszywy alarm dostępności wynikający z porównania całego uruchomienia z jednym miesiącem. Końcowy przegląd nie wykazał materialnych defektów.

## Jak kontynuować

Źródła w `output/kosztorys-bwp-v3/`:

- `build_estimate.py` – treść, formularz i budowanie HTML.
- `visual-shell.html` – źródłowy fragment oprawy wizualnej, nie dokument do wysyłki.
- `cost-model.js` – obliczenia i domyślne parametry.
- `calculator-ui.js` – formularz, pracownicy i eksporty.
- `README.md`, `zalozenia-do-weryfikacji.md` – aktualny opis.

Polecenia z katalogu projektu:

```powershell
python output/kosztorys-bwp-v3/build_estimate.py
node --test output/kosztorys-bwp-v3/cost-model.test.cjs
node output/kosztorys-bwp-v3/verify-ui.cjs
```

Ostatnie polecenie wymaga lokalnego Chrome z portem diagnostycznym 9347; odświeża również PDF i obrazy kontrolne. `check.cjs` jest skrótem do tej weryfikacji. `qa-snapshot.html` zawiera dane testowe, nie wersję do przekazania. Historycznych `refine.py` i `finalize.py` nie uruchamiać na obecnym dokumencie.

Do ewentualnej dalszej walidacji biznesowej: zmierzyć czas i zużycie dla próbki 10–20 wpisów, potwierdzić koszty domen/infrastruktury i zdolność obsługi skali C. Pages ma limit 100 projektów na konto; przy jednym projekcie na portal C wymaga innej architektury. https://developers.cloudflare.com/pages/platform/limits/

Stan zapisany lokalnie. Nie wykonano commita ani publikacji. W repozytorium istnieje niezwiązana zmiana `pipeline/pillar-expander/expand.py`; nie jest częścią tej pracy. Katalog `output/` zawiera również pliki robocze i profil Chrome – nie dodawać całego katalogu do Gita bez selekcji.

## Przegląd i korekta (15.09, po południu)

Weryfikacja wyliczeń Codexa: arytmetyka i ceny modeli poprawne (Gemini 3.5 Flash 1,50/9, Sonar 1/1 + 0,008, Sonnet 4.6 3/15 i Nano Banana 2 „od 0,04” potwierdzone u źródła; cennika GPT Image 2 na Kie nie udało się pobrać, 403). Koszt API 0,84 zł/wpis spójny z pomiarem BusManiaka (ok. 250 zł na 463 strony). Portal B w 12 mies. zgadzał się ze skrótem z 04.09 (≈12 tys. zł).

Trzy problemy zasadności, poprawione:

1. **1 wpis/mies. zaniżał OPEX** (skrót z 04.09 zakładał 15 tekstów + 30 newsów). Teraz B: 10 wpisów/mies.
2. **Profil C nie był scenariuszem C**: zachowywał 15 min człowieka na wpis, więc portal C kosztował 72% portalu B, a brief wymaga spadku o rząd wielkości. Teraz C: 60 wpisów na start, 6/mies., 2 min na wpis (publikacja bez czytania), 98 h nadzoru (18 h + 80 h próbkowej QA = pół etatu redaktora). W dokumencie jawny warunek istnienia C.
3. **250 zł/rbh dla całej pracy** bez zaznaczenia, że to górna granica (praca = 96% kosztu). Baza to teraz zespół senior 250 zł/rbh + junior 9 000 zł/mies. w proporcji 1:3 (brief: 1 etat juniora); wariant górny 250 zł/rbh pokazany obok jako osobna karta i w CSV.

Uzupełnienia: narzędzia researchu (B 180, C 2 500 zł/mies., pole `toolsMonthly`), miesiące uruchomienia przy pełnej dostępności zespołu, sekcja 05 „krzywa kosztu i obsada” (pozycje 6 i 8 briefu: portal 1/10/100 i role po miesiącach), wiersz „Poza modelem” (newsy, recykling, odnowienia domen, drugi seat Claude, sędzia LLM), notka o tańszych modelach (Gemini 3.6–3.8 Flash 0,75/3,75 do końca 2026, Sonnet 5 2/10).

Nowe wyniki bazowe (bez VAT):

| | B (15 portali) | C (250 portali) |
|---|---|---|
| Wpis | 27,01 zł (górny 63,34) | 4,81 zł |
| Portal 12 mies. bez wspólnych | 8 136 zł | 1 363 zł |
| CAPEX sieci | 58 349 zł | 200 784 zł |
| OPEX sieci / mies. | 6 830 zł | 18 742 zł |
| Rok sieci | 140 312 zł | 425 685 zł |
| Godziny startu | 531 (≈1,7 mies. przy 320 h) | 1 490 (≈4,7 mies.) |

Weryfikacja: 9/9 testów modelu, `verify-ui.cjs` w headless Chrome (uruchamiany ręcznie: `chrome.exe --headless=new --remote-debugging-port=9347 --user-data-dir=output/kosztorys-bwp-v3/chrome-qa`), PDF 9 stron, CSV i round-trip HTML z trzema pracownikami. Profil B/C przełącza teraz także wpisy, minuty i narzędzia (`profileFields` w UI).

Do decyzji na przeglądzie z Michałem: drugi seat Claude dla juniora (nie w bazie, 100 USD to ustalenie), 2 min/wpis w C jako warunek, 10 wpisów/mies. w B. W Downloads leży też „kosztorys platformy - wzór.xlsx” (szablon Platformy Wzrostu: role × miesiące × godziny); kalkulator nie produkuje tego układu.

Nadal bez commita; katalog `output/` z profilem Chrome nie do dodania w całości.

## Decyzja końcowa (15.09, wieczór)

Mateusz zakwestionował 8 136 zł/portal (BusManiak powstawał, gdy Claude Code liczył w tle; firmy nie kosztował 8 tys.). Policzyłem warianty: 6 min z ticketu (52 h / 463 stron) daje 4,7 tys., 3 min „czasu uwagi” przy 120 zł/rbh 3,3 tys. Decyzja: **nie zmieniamy bazy** (15 min, zespół senior + junior); 15 min bronimy jako założenie konserwatywne do sprawdzenia na próbce. Pliki bez dalszych zmian.
