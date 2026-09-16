---
title: 'Czego ChatGPT naprawdę szuka za Twoim promptem – Fan-out Explorer na polskich zapytaniach'
subtitle: 'Darmowy bookmarklet, który pokazuje każde wyszukiwanie ChatGPT, strony, które wróciły, i te, które trafiły do odpowiedzi. Sześć polskich promptów i to, co z nich wynika dla marki'
description: 'Fan-out Explorer to bookmarklet widocznosc.ai do chatgpt.com. Zobacz, na jakie zapytania ChatGPT rozbija prompt o kredyt, agencję SEO, laptop czy CRM, które domeny dostają wyszukiwanie na wyłączność i kiedy Reddit albo Bankier są czytane, a kiedy cytowane.'
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
  - q: 'Czy bookmarklet wysyła moje rozmowy gdziekolwiek?'
    a: >-
      Nie. Zakładka ma cały kod w sobie, czyta rozmowę tym samym adresem, którym pobiera ją aplikacja
      ChatGPT, i trzyma kopię w localStorage Twojej przeglądarki. Nie łączy się z widocznosc.ai ani z
      żadnym innym serwerem.
  - q: 'Dlaczego w starym czacie nie widzę treści zapytań?'
    a: >-
      ChatGPT wysyła treść zapytań tylko w strumieniu odpowiedzi, a w zapisanej rozmowie zostają
      wyniki i cytowania każdej rundy. Panel nagrywa zapytania, gdy jest otwarty w chwili wysłania
      promptu. Czat z historii pokazuje rundy, domeny, liczbę stron i cytowania.
  - q: 'Czy to działa w Claude, Gemini albo w aplikacji ChatGPT na komputer?'
    a: >-
      Nie. Narzędzie czyta format rozmów chatgpt.com i działa w Chrome, Edge i Brave na komputerze.
      Aplikacja desktopowa nie ma paska zakładek.
  - q: 'Czym Fan-out Explorer różni się od narzędzia Analiza zapytań AI na widocznosc.ai?'
    a: >-
      Analiza zapytań AI pyta model przez API OpenAI i pokazuje, jak model szuka na dowolną frazę,
      bez logowania. Bookmarklet czyta Twoje prawdziwe rozmowy na chatgpt.com, czyli te same rundy,
      strony i cytowania, które widziałeś w odpowiedzi.
---
Kiedy ChatGPT odpowiada na pytanie o kredyt, laptop albo agencję SEO, nie szuka Twojej frazy. **Rozbija prompt na kilka do kilkunastu zapytań, wysyła je partiami, czyta setkę stron i cytuje kilka.** Ten proces to [query fan-out](/geo/query-fan-out/), a przez ostatnie tygodnie stał się w SEO tematem numer jeden, głównie za sprawą narzędzi, które pokazują go na żywo. Zbudowaliśmy własne, po polsku, i przepuściliśmy przez nie sześć polskich promptów. Poniżej narzędzie, dane i to, co z nich wynika dla marki, która chce być cytowana.

## Skąd ten temat i co zrobiliśmy inaczej

Impuls dały trzy narzędzia z rynku anglojęzycznego. Suganthan Mohanadasan opisał, że ChatGPT przeszukuje Reddit z oknami świeżości 365 i 3650 dni, i wydał rozszerzenie [FanoutFox](https://fanoutfox.com/). Nati Elimelech zbudował [rozszerzenie do Chrome](https://en.natielimelech.com/tools/chatgpt-query-fan-out-chrome-extension) z eksportem do CSV. Orit Mutznik dołożyła [bookmarklet Fanout Explorer](https://www.oritmutznik.com/), czyli jeden przycisk na pasku zakładek, bez instalacji. Wszystkie trzy czytają dane, które ChatGPT i tak wysyła do przeglądarki.

Nasz [Fan-out Explorer](/narzedzia/fanout-explorer/) jest napisany od zera, po polsku, i różni się w dwóch miejscach. Po pierwsze liczy osobno polskie fora: Reddit, Wykop, Quora i GoWork. Po drugie nagrywa treść zapytań ze strumienia odpowiedzi, bo w zapisanej rozmowie ChatGPT już ich nie zostawia. To odkrycie z testów, do którego wrócę niżej, bo zmienia sposób pracy z każdym narzędziem tego typu.

## Co pokazuje panel

Klikasz zakładkę na czacie i z prawej strony otwiera się panel. Na górze Twój prompt i linie podsumowania: ile wyszukiwań poszło w ilu rundach, ile stron wróciło, ile ChatGPT pokazał jako źródło, a osobno to samo dla forów. Niżej tabela, jeden wiersz na wyszukiwanie:

- **runda** – ChatGPT szuka partiami. Wysyła kilka zapytań, czyta wyniki i często dosyła kolejną partię. Numer rundy mówi, na którym etapie powstało zapytanie.
- **zapytanie** – dokładne słowa wysłane do wyszukiwarki, razem z operatorem `site:` i cudzysłowami.
- **domena** – witryna, do której ChatGPT ograniczył wyszukiwanie. To lista stron, którym model ufa w danym temacie.
- **wyniki** – ile stron wróciło. Wyniki są zapisywane raz na rundę, więc zapytania z jednej partii bez ograniczenia domeny dzielą wspólną pulę.
- **cytowane** – ile z tych stron trafiło do odpowiedzi jako źródło. Zero też jest informacją: model przeczytał i pominął.

Plus przy wierszu rozwija listę stron pogrupowaną po witrynie, z ptaszkiem przy każdej zacytowanej. Cztery przyciski eksportu dają kolumnę zapytań do narzędzia od fraz, tabelę do arkusza, CSV wyszukiwań i CSV źródeł z flagą cytowania. Wszystko zostaje w przeglądarce.

![Panel Fan-out Explorer na czacie o kredycie hipotecznym: prompt, linie podsumowania i tabela z rozwiniętym pierwszym wyszukiwaniem, w którym ptaszki oznaczają strony cytowane w odpowiedzi](../../../assets/images/blog-geo-fanout-explorer-panel.webp)

## Jak zainstalować i kiedy kliknąć

Instalacja to przeciągnięcie przycisku ze [strony narzędzia](/narzedzia/fanout-explorer/) na pasek zakładek. Na Windowsie długie zakładki nie zawsze przeżywają przeciąganie, więc jest też droga przez kopiowanie kodu do pola adresu zakładki, a dla przeglądarek firmowych z zablokowanymi zakładkami droga przez konsolę.

Ważniejsze od instalacji jest jedno: **zakładkę klikasz przed wysłaniem promptu**. ChatGPT wysyła treść zapytań tylko w strumieniu odpowiedzi, w wiadomości narzędzia, która nie jest zapisywana w rozmowie. Sprawdziliśmy to na koncie Free z modelem GPT-5.6 bez trybu „Myślenie” i na koncie Business z GPT-5.6 Thinking. W obu przypadkach zapisana rozmowa ma puste pola tam, gdzie były polecenia wyszukiwania, a zostają tylko wyniki i cytowania. Panel podpina się więc pod strumień, nagrywa zapytania i trzyma je w przeglądarce razem z czatem. Czat z historii, który nie był nagrywany, pokazuje wiersz per runda: domeny, liczbę stron i cytowania, ale bez treści zapytań.

![Strona instalacyjna Fan-out Explorer na widocznosc.ai z przyciskiem do przeciągnięcia na pasek zakładek i dwiema alternatywnymi drogami instalacji](../../../assets/images/blog-geo-fanout-explorer-install.webp)

## Sześć polskich promptów, sześć różnych fan-outów

Wszystkie przejazdy z 16 września 2026, konto Free, model GPT-5.6. Jeden prompt na czat, bez historii, bez pamięci między rozmowami.

### Kredyt hipoteczny dla singla, „chcę realne opinie klientów”

Prompt poprosił o najlepszy kredyt hipoteczny dla singla we wrześniu 2026 i realne opinie zamiast reklam. ChatGPT wysłał 10 zapytań w 3 rundach, pobrał 111 stron i zacytował 4.

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

Trzy rzeczy rzucają się w oczy. Model sam dopisał do zapytań miesiąc i rok oraz nazwy sześciu banków, których w prompcie nie było. Druga runda poszła w całości na fora, bo prompt prosił o opinie, i wybrała trzy: Reddit, forum Bankiera i społeczność ING. Z 25 stron forów zacytowane zostały dwie, obie z Bankiera, a Reddit po polsku został przeczytany i pominięty. Trzecia runda to próba trafienia w konkretny blog finansowy z frazą w cudzysłowie, która wróciła z dwiema stronami i zerem cytowań.

W odpowiedzi znalazły się ranking z mdyrda.pl, dwa artykuły Bankiera o kredytach na wrzesień 2026 i wątek „przestrzegam przed ING” ze społeczności banku. **Bank, który chciałby wpłynąć na tę odpowiedź, ma więc trzy adresy: własne forum, forum Bankiera i rankingi datowane na bieżący miesiąc.**

### Agencja SEO w Poznaniu dla sklepu z meblami

Ten prompt dotyczy nas bezpośrednio, więc pokazuję go bez retuszu. Prośba o agencję z opiniami klientów i case study dała 9 zapytań w 2 rundach, 103 strony i 11 cytowań.

Pierwsza runda to trzy ogólne zapytania w stylu „agencja SEO Poznań opinie klienci case study e-commerce meble”. Wróciły 32 strony, zacytowane zostały trzy case study o sklepach meblowych: z neseo.pl, non.agency i rezulto.pl. Żadna z nich nie jest z Poznania. Model wziął dopasowanie tematyczne (meble) nad lokalizację.

Druga runda wygląda zupełnie inaczej. ChatGPT wypisał sześć nazw agencji i dla każdej wysłał zapytanie w cudzysłowie: „Widoczni”, „Semcore”, „Sempire”, „NON.agency”, „mplace” i „ICEA”, każda z dopiskiem „opinie klienci SEO Poznań”. Z 72 stron zacytował 8: profil Sempire na Clutch, strony case study Semcore, Sempire i Widocznych oraz trzy adresy grupa-icea.pl, w tym stronę case study i ofertę pozycjonowania sklepów.

To najważniejsza obserwacja z całego przejazdu. **Marka wchodzi do gry w drugiej rundzie, gdy model szuka jej po nazwie z dopiskiem „opinie”.** Na to zapytanie odpowiada własna strona z case study albo profil na Clutch. Fora opinii, aleo.com i opiniak.com, wróciły w wynikach i nie zostały zacytowane. Agencja, której nie ma na liście nazw z drugiej rundy, nie ma czego optymalizować, bo model jej nie szuka.

### Laptop do 4000 zł, trzy modele i gdzie najtaniej

Prompt produktowy pokazał odwrotną kolejność. ChatGPT najpierw wybrał trzy modele z własnej wiedzy, a dopiero potem poszedł do sieci: pierwsza runda to trzy zapytania „Lenovo IdeaPad Slim 5 … cena Polska wrzesień 2026” i analogiczne dla ASUS-a i Acera, bez ani jednego cytowania. Druga runda ograniczyła wyszukiwanie do trzech sklepów: `site:x-kom.pl`, `site:morele.net` i `site:mediaexpert.pl`. Cytowane zostały karty produktów z Morele i Media Expert, x-kom wrócił z dziesięcioma stronami i nie został zacytowany.

Sklep, który nie jest w tej trójce, nie istnieje w odpowiedzi o cenach. **Kolumna „domena” jest tu listą sklepów, którym model ufa w kategorii laptopów, i to ona powinna trafić do briefu dla działu marketplace.**

### Czy warto pozycjonować stronę pod ChatGPT

Prompt informacyjny z naszej niszy dał jedną rundę i cztery zapytania, wszystkie po angielsku, mimo polskiego promptu. Trzy z nich były ograniczone do jednej domeny: openai.com, developers.google.com i bing.com/webmasters. Z 55 stron ChatGPT zacytował 7 i wszystkie pochodziły ze źródeł pierwotnych: FAQ dla wydawców w pomocy OpenAI, przewodnik Google po optymalizacji pod AI, wpisy z bloga Google Search Central i dokumentacja raportów AI w Bing Webmaster Tools. Ponad 40 stron agencji i blogów SEO wróciło w wynikach i żadna nie została zacytowana.

Dla treści poradnikowych o AI Search wniosek jest chłodny. **Na pytanie „czy warto i jak zacząć” model cytuje producenta wyszukiwarki, nie komentatora.** Miejsce dla agencji jest w pytaniach, na które producent nie odpowiada: porównania narzędzi, koszty, case study, procesy.

### Shoper kontra WooCommerce i porównanie CRM-ów

Dwa prompty porównawcze potwierdziły wzorzec z artykułu Orit Mutznik. Porównanie Shopera i WooCommerce z prośbą o ceny dało cztery zapytania o cenniki i hosting, 47 stron, 4 cytowania z cyberfolks.pl i niepoddawajsie.pl oraz zero forów. Porównanie trzech CRM-ów z prośbą o opinie użytkowników poszło w Reddit, G2 i Capterrę: ze 100 stron zacytowanych zostało 10, w tym pięć wątków z Reddita i cennik Livespace.

Reddit został zacytowany tylko w temacie, w którym po angielsku ma tysiące wątków. W tematach polskich (kredyt, agencje) był czytany i pomijany. **Po polsku rolę Reddita gra forum Bankiera, społeczność banku albo Clutch, zależnie od kategorii.**

## Co z tego wynika dla marki

Sześć promptów to za mało na statystykę i wystarczająco dużo na metodę. Oto, co przenosimy do audytów widoczności w AI:

1. **Zapytania z drugiej rundy są ważniejsze niż z pierwszej.** Pierwsza runda to zapytania ogólne z rokiem i miesiącem. Druga to nazwy marek w cudzysłowie z dopiskiem „opinie” albo domeny na wyłączność. Dopiero tam rozstrzyga się, czy marka jest cytowana.
2. **Kolumna „domena” to lista witryn, którym model ufa w kategorii.** Sklepy dla laptopów, fora dla kredytów, dokumentacja producentów dla pytań o AI. Jeśli marki tam nie ma, a konkurencja jest, to jest luka do zamknięcia.
3. **Czytane i pominięte to inny problem niż nieznalezione.** Strona, która wraca w wynikach i nigdy nie jest cytowana, ma problem z treścią fragmentu. Strona, która nie wraca wcale, ma problem z indeksem albo dostępem botów. Fan-out Explorer rozróżnia te dwa przypadki jedną kolumną.
4. **Prompt decyduje, czy fora w ogóle są czytane.** Prośba o opinie włącza rundę forów. Prośba o ceny wysyła model do producentów i sklepów. Zestaw promptów do monitoringu powinien mieć oba warianty.
5. **Ten sam prompt za miesiąc może dać inny fan-out.** Eksport ma datę i identyfikator czatu, więc porównanie dwóch przejazdów to dwa pliki obok siebie.

Warto też wiedzieć, czego w danych nie ma. W obecnym formacie ChatGPT nie pokazuje już typu wyszukiwania ani okna świeżości w dniach, które opisywali Suganthan i Orit Mutznik latem 2026. Została treść zapytania, domena z operatora `site:` i wyniki per runda. Model z rozumowaniem robi więcej rund: ten sam prompt o CRM dał na koncie Business 11 rund i 230 stron, a na koncie Free 2 rundy i 100 stron.

## Prosty proces na pół godziny w miesiącu

1. Wypisz 10 promptów, które zadają Twoi klienci, w dwóch wariantach: z prośbą o opinie i bez.
2. Dla każdego otwórz pusty czat, kliknij zakładkę, wyślij prompt.
3. Skopiuj zapytania do listy fraz. To frazy, które napisał model, nie narzędzie.
4. Posortuj tabelę po domenie i zapisz, które witryny dostały wyszukiwanie na wyłączność.
5. Sprawdź wiersze forów i wiersze z nazwami marek w cudzysłowie.
6. Pobierz CSV źródeł i odłóż z datą.
7. Popraw strony, na które wskazuje tabela, zaczynając od tych czytanych i pomijanych.
8. Za miesiąc powtórz i porównaj.

Jeśli wolisz szybki sondaż bez logowania do ChatGPT, na widocznosc.ai jest też [Analiza zapytań AI](/narzedzia/fanout/), która pyta model przez API i pokazuje zapytania pomocnicze oraz cytowane domeny. Bookmarklet daje to samo z prawdziwej rozmowy na Twoim koncie. A jeśli chcesz, żeby to, co pokazuje tabela, zamienić w plan treści i cytowań, zobacz, jak pracujemy nad [pozycjonowaniem w ChatGPT](/pozycjonowanie-ai/chatgpt/).
