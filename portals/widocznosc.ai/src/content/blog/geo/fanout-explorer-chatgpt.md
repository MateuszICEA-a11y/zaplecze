---
title: 'Czego ChatGPT szuka w sieci, zanim Ci odpowie – Fan-out Explorer na polskich zapytaniach'
subtitle: 'Darmowy bookmarklet, który pokazuje każde wyszukiwanie ChatGPT, strony, które zostały zwrócone, i te, które trafiły do odpowiedzi. Sześć polskich promptów i to, co z nich wynika dla marki'
description: 'Fan-out Explorer to bookmarklet widocznosc.ai do chatgpt.com. Zobacz, na jakie zapytania ChatGPT rozbija prompt o kredyt, agencję SEO, laptop czy CRM, do których domen zawęża wyszukiwanie i kiedy Reddit albo Bankier są analizowane, a kiedy cytowane.'
date: 2026-09-16
image: ../../../assets/images/blog-geo-fanout-explorer-chat.webp
icon: '<circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/><line x1="8" y1="11" x2="14" y2="11"/><line x1="11" y1="8" x2="11" y2="14"/>'
author:
  name: 'Mateusz Wiśniewski'
  role: 'Ekspert SEO/AI Search · ICEA'
  avatar: ../../../assets/images/authors/mateusz-wisniewski.avif
readTime: '12 min'
tags: ['ChatGPT', 'Query Fan-out', 'Narzędzia', 'GEO']
pillar: 'geo'
intent: 'HOWTO'
level: 'L2'
faqHeading: 'Pytania o Fan-out Explorer'
faq:
  - q: 'Czy bookmarklet przesyła moje rozmowy na zewnątrz?'
    a: >-
      Nie. Zakładka ma cały kod w sobie, odczytuje rozmowę z tego samego adresu URL, z którego pobiera ją aplikacja
      ChatGPT, i trzyma kopię w localStorage Twojej przeglądarki. Nie łączy się z widocznosc.ai ani z
      żadnym innym serwerem.
  - q: 'Dlaczego w historii czatu nie widzę treści zapytań?'
    a: >-
      ChatGPT wysyła treść zapytań tylko w strumieniu odpowiedzi. W zapisanej rozmowie zostają
      jedynie wyniki i cytowania z każdej rundy. Panel rejestruje zapytania, gdy jest otwarty w chwili wysłania
      promptu. Czat z historii pokazuje wyłącznie rundy, domeny, liczbę stron i cytowania.
  - q: 'Czy to działa w Claude, Gemini albo w aplikacji ChatGPT na komputer?'
    a: >-
      Nie. Narzędzie analizuje format rozmów chatgpt.com i działa w przeglądarkach Chrome, Edge i Brave na komputerze.
      Aplikacja desktopowa nie ma paska zakładek.
  - q: 'Czym Fan-out Explorer różni się od narzędzia Analiza zapytań AI na widocznosc.ai?'
    a: >-
      Analiza zapytań AI pyta model przez API OpenAI i pokazuje, jak model szuka informacji na dowolną frazę,
      bez logowania. Bookmarklet analizuje Twoje prawdziwe rozmowy na chatgpt.com, czyli te same rundy,
      strony i cytowania, które widziałeś w wygenerowanej odpowiedzi.
---
Kiedy ChatGPT odpowiada na pytanie o kredyt, laptop albo agencję SEO, nie wyszukuje dokładnie Twojej frazy. **Rozbija prompt na kilka do kilkunastu zapytań, wysyła je partiami, analizuje dziesiątki stron i cytuje zaledwie kilka.** Ten proces to [query fan-out](/geo/query-fan-out/), który od dłuższego czasu jest w SEO głośnym tematem, głównie za sprawą narzędzi pozwalających śledzić go na żywo. Zbudowaliśmy własne rozwiązanie, dostosowane do języka polskiego, i przetestowaliśmy za jego pomocą sześć polskich promptów. Poniżej znajdziesz narzędzie, dane i wnioski dla marki, która chce być cytowana w odpowiedziach AI.

## Skąd ten temat i co zrobiliśmy inaczej

Impuls dały trzy narzędzia z rynku anglojęzycznego, które zadebiutowały w 2026 roku. Suganthan Mohanadasan opisał, że ChatGPT przeszukuje Reddit z parametrami przedziału czasowego (ang. time window) 365 i 3650 dni, po czym udostępnił rozszerzenie [FanoutFox](https://fanoutfox.com/). Nati Elimelech zbudował [rozszerzenie do Chrome](https://en.natielimelech.com/tools/chatgpt-query-fan-out-chrome-extension) z eksportem do CSV. Orit Mutznik stworzyła własny skrypt zakładkowy [Fanout Explorer](https://www.oritmutznik.com/), czyli jeden przycisk na pasku zakładek, niewymagający instalacji. Wszystkie trzy przechwytują dane, które ChatGPT i tak wysyła do przeglądarki.

Nasz [Fan-out Explorer](/narzedzia/fanout-explorer/) został napisany od zera, po polsku, i różni się w dwóch kluczowych aspektach. Po pierwsze, liczy osobno polskie fora: Wykop, Quorę, GoWork oraz polskiego Reddita. Po drugie, rejestruje treść zapytań bezpośrednio ze strumienia danych, ponieważ w zapisanej historii rozmowy ChatGPT już ich nie zostawia. To odkrycie z naszych testów, do którego wrócę niżej, bo zmienia ono sposób pracy z każdym narzędziem tego typu.

## Co pokazuje panel

Po kliknięciu zakładki w oknie czatu, z prawej strony otwiera się panel. Na górze widnieje Twój prompt i podsumowanie: ile wyszukiwań wykonano w ilu rundach, ile stron zostało zwróconych, ile z nich ChatGPT pokazał jako źródło, a osobno te same statystyki dla forów. Niżej znajduje się tabela, w której jeden wiersz odpowiada jednemu wyszukiwaniu:

- **runda** – ChatGPT szuka partiami. Wysyła kilka zapytań, analizuje wyniki i często generuje kolejną partię. Numer rundy mówi, na którym etapie procesu powstało zapytanie.
- **zapytanie** – dokładne słowa wysłane do wyszukiwarki, łącznie z operatorem `site:` i cudzysłowami.
- **domena** – witryna, do której ChatGPT zawęził wyszukiwanie. To lista stron, którym model ufa w danym temacie.
- **wyniki** – ile stron zostało zwróconych. Wyniki są zapisywane raz na rundę, więc zapytania z jednej partii bez ograniczenia domeny dzielą wspólną pulę.
- **cytowane** – ile z tych stron trafiło do odpowiedzi jako źródła. Zero też jest cenną informacją: model przeanalizował stronę, ale ją pominął.

Ikona plusa przy wierszu rozwija listę stron pogrupowaną według witryny, ze znacznikiem wyboru (ang. check mark) przy każdej zacytowanej. Kolumny, których w danym czacie nie ma (np. okno czasowe w dniach, którego ChatGPT już nie podaje), panel ukrywa automatycznie. Cztery przyciski eksportu pozwalają wyeksportować zapytania do narzędzi słów kluczowych, pobrać tabelę do arkusza kalkulacyjnego oraz wygenerować pliki CSV z wyszukiwaniami i źródłami (z informacją o cytowaniu). Wszystkie dane pozostają w Twojej przeglądarce.

Druga zakładka, **Domeny**, zbiera wszystkie strony z czatu z podziałem na witryny: ile ChatGPT pobrał, ile zacytował i w ilu wyszukiwaniach ograniczył się do tej witryny operatorem `site:`. Witryny są wstępnie pogrupowane w siedem kategorii: fora i społeczności, opinie i rankingi, sklepy i platformy handlowe (marketplace), media, dokumentacja producentów, instytucje oraz strony firm i marek. To klasyfikacja na podstawie adresu, nie po treści, więc traktuj ją jako pierwsze sortowanie, ale w praktyce od razu widać, czy w danej kategorii model czerpie wiedzę z forów, rankingów czy stron producentów. Filtr „tylko cytowane” zostawia witryny, które trafiły do odpowiedzi, a bez filtra widać też te czytane i pomijane, czyli często ciekawszą listę.

![Panel Fan-out Explorer na czacie o kredycie hipotecznym: prompt, linie podsumowania i tabela z rozwiniętym pierwszym wyszukiwaniem, w którym znaczniki wyboru oznaczają strony cytowane w odpowiedzi](../../../assets/images/blog-geo-fanout-explorer-panel.webp)

## Jak zainstalować i kiedy kliknąć

Instalacja polega na przeciągnięciu przycisku ze [strony narzędzia](/narzedzia/fanout-explorer/) na pasek zakładek. W systemie Windows długie kody zakładek nie zawsze działają poprawnie po przeciągnięciu, dlatego dostępna jest też metoda polegająca na ręcznym skopiowaniu kodu do pola adresu zakładki, a dla przeglądarek firmowych z zablokowanymi zakładkami – instalacja przez konsolę.

Ważniejsze od samej instalacji jest jedno: **zakładkę należy kliknąć przed wysłaniem promptu**. ChatGPT przesyła treść zapytań wyłącznie w strumieniu odpowiedzi, w wywołaniu funkcji narzędzia (ang. tool call), które nie jest zapisywane w historii rozmowy. Sprawdziliśmy to na koncie Free z modelem GPT-5.6 bez trybu rozumowania (Thinking) oraz na koncie Business z włączonym GPT-5.6 Thinking. W obu przypadkach zapisana rozmowa ma puste pola tam, gdzie znajdowały się polecenia wyszukiwania; zostają tylko wyniki i cytowania. Panel podpina się więc pod strumień, rejestruje zapytania i przechowuje je w przeglądarce razem z czatem. Czat z historii, który nie był rejestrowany na żywo, pokazuje jeden wiersz na rundę: domeny, liczbę stron i cytowania, ale bez dokładnej treści zapytań.

![Strona instalacyjna Fan-out Explorer na widocznosc.ai z przyciskiem do przeciągnięcia na pasek zakładek i dwiema alternatywnymi metodami instalacji](../../../assets/images/blog-geo-fanout-explorer-install.webp)

## Sześć polskich promptów, sześć różnych fan-outów

Wszystkie testy przeprowadzono 16 września 2026 roku na koncie Free, z wykorzystaniem modelu GPT-5.6. Jeden prompt na czat, bez historii, bez pamięci między rozmowami.

### Kredyt hipoteczny dla singla, „chcę realne opinie klientów”

Prompt zawierał prośbę o najlepszy kredyt hipoteczny dla singla we wrześniu 2026 roku oraz o realne opinie zamiast reklam. ChatGPT wygenerował 10 zapytań w 3 rundach, pobrał 111 stron i zacytował 4 z nich.

| Runda | Zapytanie | Domena | Strony | Cytowane |
|---|---|---|---|---|
| 1 | ranking kredytów hipotecznych wrzesień 2026 singiel Polska marża oprocentowanie | – | 55 | 2 |
| 1 | kredyt hipoteczny wrzesień 2026 opinie klientów bank PKO Pekao ING Santander Millennium mBank | – | 55 | 2 |
| 1 | forum kredyt hipoteczny opinie ING PKO Pekao Santander Millennium mBank 2026 | – | 55 | 2 |
| 2 | site:reddit.com/r/Polska kredyt hipoteczny Pekao ING PKO … opinie 2026 | reddit.com | 24 | 0 |
| 2 | site:bankier.pl/forum kredyt hipoteczny Pekao ING PKO … opinie 2026 | bankier.pl | 12 | 2 |
| 2 | site:spolecznosc.ing.pl kredyt hipoteczny 2026 opinie procesowanie | spolecznosc.ing.pl | 11 | 0 |
| 2 | site:reddit.com kredyt hipoteczny ING Pekao PKO singiel zdolność 2026 | reddit.com | 24 | 0 |
| 3 | site:marciniwuc.com "WRZESIEŃ 2026" "singiel" kredyt hipoteczny | marciniwuc.com | 2 | 0 |
| 3 | "wrzesień 2026" "singiel" "kredyt hipoteczny" ING Pekao PKO | – | 11 | 0 |

Trzy rzeczy rzucają się w oczy. Model sam dopisał do zapytań miesiąc i rok oraz nazwy sześciu banków, których w prompcie nie było. Druga runda została w całości skierowana na fora, ponieważ prompt prosił o opinie. Model wybrał trzy platformy: Reddit, forum Bankiera i społeczność ING. Z 25 stron forów zacytowane zostały dwie (obie z Bankiera), a polski Reddit został przeanalizowany i pominięty. Trzecia runda to próba trafienia w konkretny blog finansowy z frazą z użyciem cudzysłowu, która zwróciła dwie strony i zero cytowań.

W odpowiedzi znalazły się: ranking z mdyrda.pl, dwa artykuły Bankiera o kredytach na wrzesień 2026 oraz wątek „przestrzegam przed ING” ze społeczności banku. **Bank, który chciałby wpłynąć na tę odpowiedź, musi zadbać o obecność w trzech miejscach: na własnym forum, na forum Bankiera i w rankingach datowanych na bieżący miesiąc.**

### Agencja SEO w Poznaniu dla sklepu z meblami

Ten prompt dotyczy nas bezpośrednio, więc pokazuję go bez retuszu. Prośba o agencję z opiniami klientów i studiami przypadków (case study) wygenerowała 9 zapytań w 2 rundach, 103 strony i 11 cytowań.

Pierwsza runda to trzy ogólne zapytania w stylu „agencja SEO Poznań opinie klienci case study e-commerce meble”. Zwrócono 32 strony, a zacytowane zostały trzy studia przypadków o sklepach meblowych: z neseo.pl, non.agency i rezulto.pl. Żadna z tych agencji nie jest z Poznania. Model priorytetowo potraktował dopasowanie tematyczne (meble) kosztem lokalizacji.

Druga runda wygląda zupełnie inaczej. ChatGPT wypisał sześć nazw agencji i dla każdej wysłał zapytanie w cudzysłowie: „Widoczni”, „Semcore”, „Sempire”, „NON.agency”, „mplace” i „ICEA”, każde z dopiskiem „opinie klienci SEO Poznań”. Z 72 stron zacytował 8: profil Sempire na Clutch, strony ze studiami przypadków Semcore, Sempire i Widocznych oraz trzy adresy grupa-icea.pl, w tym stronę ze studium przypadku i ofertę pozycjonowania sklepów.

To najważniejsza obserwacja z całej sesji. **Marka zyskuje znaczenie dopiero w drugiej rundzie, gdy model szuka jej po nazwie z dopiskiem „opinie”.** Na to zapytanie odpowiada własna strona ze studium przypadku albo profil na Clutch. Fora opinii, takie jak aleo.com czy opiniak.com, pojawiły się w wynikach, ale nie zostały zacytowane. Agencja, której nie ma na liście nazw z drugiej rundy, nie ma czego optymalizować, bo model w ogóle jej nie szuka.

### Laptop do 4000 zł, trzy modele i gdzie najtaniej

Prompt produktowy pokazał odwrotną kolejność. ChatGPT najpierw wybrał trzy modele, opierając się na własnych danych treningowych, a dopiero potem skorzystał z wyszukiwarki. Pierwsza runda to trzy zapytania: „Lenovo IdeaPad Slim 5 … cena Polska wrzesień 2026” i analogiczne dla Asusa oraz Acera, bez ani jednego cytowania. Druga runda zawęziła wyszukiwanie do trzech sklepów: `site:x-kom.pl`, `site:morele.net` i `site:mediaexpert.pl`. Cytowane zostały karty produktów z Morele i Media Expert; x-kom zwrócił dziesięć stron, ale żadna nie została zacytowana.

Sklep, który nie znajduje się w tej trójce, nie istnieje w odpowiedzi o cenach. **Kolumna „domena” jest w tym przypadku listą sklepów, którym model ufa w kategorii laptopów, i to ona powinna trafić do briefu dla działu marketplace.**

### Czy warto pozycjonować stronę pod ChatGPT

Prompt informacyjny z naszej niszy wygenerował jedną rundę i cztery zapytania, wszystkie po angielsku, mimo polskiego promptu. Trzy z nich były ograniczone do konkretnych domen: openai.com, developers.google.com i bing.com/webmasters. Z 55 stron ChatGPT zacytował 7 i wszystkie pochodziły ze źródeł pierwotnych: sekcji FAQ dla wydawców w pomocy OpenAI, przewodnik Google po optymalizacji pod AI, wpisy z bloga Google Search Central i dokumentacja raportów AI w Bing Webmaster Tools. Ponad 40 stron agencji i blogów SEO pojawiło się w wynikach, ale żadna nie została zacytowana.

Dla treści poradnikowych o AI Search wnioski są brutalne. **Na pytanie „czy warto i jak zacząć” model cytuje producenta wyszukiwarki, a nie komentatora.** Miejsce dla agencji jest w pytaniach, na które producent nie odpowiada: porównaniach narzędzi, kosztach, studiach przypadków czy procesach.

### Shoper kontra WooCommerce i porównanie CRM-ów

Dwa prompty porównawcze potwierdziły wzorzec z artykułu Orit Mutznik. Porównanie Shopera i WooCommerce z prośbą o ceny wygenerowało cztery zapytania o cenniki i hosting, 47 stron, 4 cytowania (z cyberfolks.pl i niepoddawajsie.pl) oraz zero forów. Porównanie trzech systemów CRM z prośbą o opinie użytkowników skupiło się na platformach Reddit, G2 i Capterra: ze 100 stron zacytowanych zostało 10, w tym pięć wątków z Reddita i cennik Livespace.

Reddit został zacytowany tylko w temacie, w którym w języku angielskim ma tysiące wątków. W tematach polskich (kredyt, agencje) był analizowany, ale ostatecznie pomijany. **W polskim internecie rolę Reddita pełni forum Bankiera, dedykowana społeczność banku albo Clutch, zależnie od kategorii.**

## Co z tego wynika dla marki

Sześć promptów to za mało na pełną statystykę, ale wystarczająco dużo, by wypracować metodę. Oto, co uwzględniamy w audytach widoczności w AI (GEO):

1. **Zapytania z drugiej rundy są ważniejsze niż z pierwszej.** Pierwsza runda to zapytania ogólne z rokiem i miesiącem. Druga to nazwy marek w cudzysłowie z dopiskiem „opinie” albo domeny, do których model zawęża wyszukiwanie. Dopiero tam rozstrzyga się, czy marka zostanie zacytowana.
2. **Kolumna „domena” to lista witryn, którym model ufa w danej kategorii.** Sklepy dla laptopów, fora dla kredytów, dokumentacja producentów dla pytań o AI. Jeśli Twojej marki tam nie ma, a konkurencja jest, masz lukę do zamknięcia. Pamiętaj też, że ChatGPT korzysta w tle z indeksu Binga – brak widoczności w Bing Webmaster Tools oznacza brak widoczności w ChatGPT.
3. **Strony przeanalizowane i pominięte to inny problem niż te, których model w ogóle nie znalazł.** Strona, która pojawia się w wynikach i nigdy nie jest cytowana, ma problem z treścią fragmentu (snippetu) lub optymalizacją pod RAG (Retrieval-Augmented Generation). Strona, która nie pojawia się wcale, ma problem z indeksem albo dostępem dla botów (crawlerów). Fan-out Explorer rozróżnia te dwa przypadki za pomocą jednej kolumny.
4. **Prompt decyduje, czy fora w ogóle są analizowane.** Prośba o opinie uruchamia rundę przeszukiwania forów. Prośba o ceny wysyła model bezpośrednio do producentów i sklepów. Zestaw promptów do monitoringu powinien uwzględniać oba warianty.
5. **Ten sam prompt za miesiąc może wygenerować inny fan-out.** Eksport zawiera datę i identyfikator czatu, więc porównanie dwóch sesji sprowadza się do zestawienia dwóch plików.

Warto też wiedzieć, czego w danych nie ma. W obecnym formacie ChatGPT nie pokazuje już typu wyszukiwania ani parametru przedziału czasowego w dniach, które opisywali Suganthan i Orit Mutznik latem 2026 roku. Została treść zapytania, domena z operatora `site:` i wyniki dla każdej rundy. Model z trybem rozumowania (Thinking) wykonuje więcej rund: ten sam prompt o CRM wygenerował na koncie Business 11 rund i 230 stron, a na koncie Free – 2 rundy i 100 stron.

## Prosty proces na pół godziny w miesiącu

1. Wypisz 10 promptów, które wpisują Twoi klienci, w dwóch wariantach: z prośbą o opinie i bez.
2. Dla każdego otwórz pusty czat, kliknij zakładkę i wyślij prompt.
3. Skopiuj zapytania do listy fraz. Pamiętaj, że to frazy, które wygenerował model (LLM), a nie tradycyjne narzędzie SEO.
4. Posortuj tabelę według domen i zapisz, do których witryn model zawęził wyszukiwanie (użył operatora `site:`).
5. Sprawdź wiersze forów i wiersze z nazwami marek w cudzysłowie.
6. Pobierz plik CSV ze źródłami i zarchiwizuj go z odpowiednią datą.
7. Popraw strony, na które wskazuje tabela, zaczynając od tych przeanalizowanych, ale pomijanych.
8. Za miesiąc powtórz proces i porównaj wyniki.

Jeśli wolisz szybki test bez logowania do ChatGPT, na widocznosc.ai dostępna jest też [Analiza zapytań AI](/narzedzia/fanout/), która pyta model przez API i pokazuje zapytania pomocnicze oraz cytowane domeny. Bookmarklet daje dokładnie to samo, ale na podstawie prawdziwej rozmowy na Twoim koncie. A jeśli chcesz, żeby to, co pokazuje tabela, zamienić w plan treści i cytowań, zobacz, jak pracujemy nad [pozycjonowaniem w ChatGPT](/pozycjonowanie-ai/chatgpt/).
