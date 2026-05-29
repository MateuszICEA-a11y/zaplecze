---
title: 'Google mówi: rób SEO po staremu. Czego nie dopowiada o wyszukiwaniu AI'
subtitle: 'Google wydało uspokajający przewodnik po optymalizacji pod AI. Haczyk? To perspektywa giganta, który po raz pierwszy czuje na plecach oddech konkurencji. Rozkładamy dokument na czynniki pierwsze: wskazujemy, gdzie Google ma rację, a co celowo przemilcza.'
description: 'Analiza przewodnika Google o optymalizacji pod generatywną AI okiem specjalistów AI Search. Co jest prawdą, gdzie Google nie mówi wszystkiego o llms.txt, GEO i wzmiankach, i dlaczego jego rady są optymalne dla Google, a niekoniecznie dla Ciebie.'
date: 2026-05-29
image: ../../../assets/images/blog-geo-co-google-przemilcza.webp
icon: '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>'
author:
  name: 'Mateusz Wiśniewski'
  role: 'Ekspert SEO/AI Search · ICEA'
  avatar: ../../../assets/images/authors/mateusz-wisniewski.avif
readTime: '7 min'
tags: ['AI Search', 'Google AI Overviews', 'GEO', 'AEO', 'llms.txt']
pillar: 'geo'
intent: 'INFO'
level: 'L2'
faqHeading: 'Często zadawane pytania o przewodniku Google i widoczności w AI'
faq:
  - q: 'Czy <code>llms.txt</code> jest potrzebny, żeby być widocznym w AI?'
    a: >-
      Do pojawienia się w samej wyszukiwarce Google – nie, bo Google ma własnego crawlera i własny, rozległy
      indeks sieci. Ale ChatGPT, Perplexity czy Copilot nie mają tak rozwiniętej infrastruktury jak Google i pobierają treść w czasie
      rzeczywistym. Wdrożenie <code>llms.txt</code> przez główne modele jest dziś jeszcze słabe i nie ma dowodu,
      że gwarantuje lepszą widoczność – to wciąż otwarta debata, dlatego warto poznać oba stanowiska, zanim
      przyjmiesz werdykt Google za ostateczny.
  - q: 'Czy przewodnik Google wystarczy do optymalizacji pod sztuczną inteligencję?'
    a: >-
      Wystarczy, jeśli Twoim jedynym celem są funkcje generatywne w wyszukiwarce Google (AI Overviews).
      Nie pokrywa jednak ChatGPT, Perplexity, Microsoft Copilota ani Claude – każdy z nich ma własne
      crawlery, źródła i logikę cytowania. Przewodnik opisuje wycinek rynku tak, jakby był całym rynkiem.
  - q: 'Czy dane strukturalne (schema.org) mają znaczenie dla modeli AI?'
    a: >-
      Nie są technicznie wymagane – ale to tylko częściowo prawda. Schema nie jest elementem krytycznym, za to
      buduje przewagę również w klasycznym SEO i jest najtańszym sposobem, by jednoznacznie przekazać encje
      silnikom oraz agentom AI bez systemów Google. Rada Google jest więc poprawna połowicznie, nie dla całego
      ekosystemu.
  - q: 'Czy wzmianki o marce poza moją stroną wpływają na odpowiedzi AI?'
    a: >-
      Tak. Modele językowe są trenowane i osadzane w faktach m.in. na treści z Reddita, forów, recenzji
      i serwisów branżowych. To, co internet mówi o Twojej marce poza Twoją domeną, realnie wpływa na odpowiedź
      modelu. Kupowanie sztucznych wzmianek nie działa, ale autentyczna obecność off-site jest mierzalnym
      sygnałem (tzw. share of voice w AI).
---

Google opublikowało oficjalny przewodnik <strong><a href="https://developers.google.com/search/docs/fundamentals/ai-optimization-guide?hl=pl" target="_blank" rel="noopener noreferrer">„Optymalizacja witryny pod kątem funkcji opartych na generatywnej AI w wyszukiwarce Google"</a></strong>. Przekaz jest uspokajający: rób dobre SEO po staremu, nie daj się nabrać na „sztuczki" GEO, nie potrzebujesz llms.txt ani specjalnych zabiegów. Po lekturze właściciel firmy ma poczuć, że nic się nie zmieniło i wszystko jest pod kontrolą. **Problem w tym, że ten dokument nie opisuje wyszukiwania AI – opisuje wyszukiwanie AI w produktach Google.** A to dziś dwie różne rzeczy, i właśnie na tej różnicy zarabia się albo traci widoczność.

Przeanalizowaliśmy ten przewodnik akapit po akapicie. Poniżej rozkładamy go na trzy części: co Google mówi słusznie (i warto to przyjąć), czego nie dopowiada, oraz dlaczego pisze właśnie w takim tonie i właśnie teraz.

## W czym Google ma rację

Krytyka, która ignoruje fakty, jest bezwartościowa, więc zaczynamy od tego, co w przewodniku jest po prostu prawdą – i co powinieneś potraktować poważnie niezależnie od tego, gdzie chcesz być widoczny.

- **Fundamenty SEO nadal działają.** Funkcje generatywne Google rzeczywiście korzystają z jego podstawowych systemów rankingowych. Strona, która nie jest zaindeksowana i nie spełnia wymagań technicznych, nie pojawi się w odpowiedzi AI. Indeksowalność, czytelność, szybkość, brak duplikatów – to baza, nie folklor.
- **RAG i query fan-out są realne.** Google poprawnie opisuje mechanizm pobierania danych: model rozbija zapytanie na podpytania, sięga do indeksu po fragmenty i składa z nich odpowiedź z linkami źródłowymi. To dokładnie ta logika, którą opisaliśmy w artykule o [query fan-out](/geo/query-fan-out/).
- **Unikalna treść wygrywa.** Recenzja oparta na doświadczeniu bije podsumowanie cudzych treści. Materiał ekspercki, którego nie da się wygenerować jednym promptem, to najlepsza długoterminowa inwestycja w widoczność. Pełna zgoda.
- **Ostrzeżenie przed masową produkcją treści jest trafne** – generowanie tysięcy podstron pod każdą możliwą odmianę zapytania to nie strategia, to proszenie się o filtr antyspamowy. Liczba stron nie podnosi jakości domeny.

Gdyby przewodnik kończył się w tym miejscu, podpisalibyśmy się pod nim bez zastrzeżeń. Ale dalej zaczynają się przemilczenia.

## Czego Google nie dopowiada – pięć zręcznych uproszczeń

Najciekawsza jest sekcja „Obalanie mitów", w której Google mówi, czego **nie musisz** robić. Każdy z tych punktów jest technicznie prawdziwy w odniesieniu do wyszukiwarki Google – i jednocześnie wprowadza w błąd, jeśli zależy Ci na widoczności w całym ekosystemie AI. Oto pięć miejsc, gdzie rada jest poprawna dla Google, a nie dla Ciebie.

| Co mówi Google | Czego nie dopowiada |
|---|---|
| „Pliki llms.txt i specjalne znaczniki są zbędne" | Google ma własnego crawlera i własny, rozległy indeks sieci – nie potrzebuje, żebyś mu cokolwiek ułatwiał. OpenAI, Anthropic czy Perplexity **nie mają tak rozwiniętej infrastruktury jak Google**. To rada optymalna dla podmiotu, który już ma przewagę. |
| „Nie musisz dzielić treści na fragmenty" | Google samo opisuje, że RAG i fan-out pobierają **fragmenty, nie całe strony**. Struktura akapitów to nie sztuczka, to dopasowanie do mechanizmu pobierania. |
| „Dane strukturalne nie są wymagane" | Tylko **częściowo** prawda. Schema nie jest elementem krytycznym, ale to najtańszy sposób na jednoznaczne przekazanie encji silnikom i agentom AI bez systemów Google – a w klasycznym SEO również buduje przewagę. |
| „Nie goń za sztucznymi wzmiankami" | Słuszne wobec spamu – ale rozmywa fakt, że **autentyczne** wzmianki poza Twoją domeną są kluczowym sygnałem dla modeli trenowanych na Reddit, forach i recenzjach. |
| „GEO/AEO to w większości nieskuteczne sztuczki" | Google deprecjonuje dyscyplinę, której nie kontroluje. Część taktyk to faktycznie ślepe naśladownictwo (cargo cult), ale fundament – optymalizuj pod wiele silników – jest jak najbardziej realny. |

Rozwińmy trzy, które mają największe konsekwencje finansowe.

### „Zapomnij o llms.txt" – rada gracza, który już ma wszystko

To najczęściej cytowany fragment przewodnika i jednocześnie najlepszy przykład perspektywy. Google mówi prawdę: do pojawienia się **w wyszukiwarce Google** plik llms.txt nie jest potrzebny. Google ma crawlera, który widzi ogromną część sieci, i własny indeks, w którym ją przechowuje. Po co miałoby czytać uproszczoną mapę treści, skoro ma oryginał?

Ale Twoi klienci coraz częściej zadają pytania nie w Google, tylko w ChatGPT, Perplexity czy Copilocie. A te systemy **nie mają tak rozwiniętej infrastruktury jak Google**. Sięgają po treść w czasie rzeczywistym, często przez wyszukiwarki trzecie, i pracują na tym, co uda im się pobrać i sparsować w danym momencie.

Bądźmy uczciwi do końca: stopień wdrożenia pliku llms.txt przez główne modele wciąż jest słaby i nie ma dziś dowodu, że gwarantuje on lepszą widoczność. To jest debata otwarta. I właśnie dlatego sposób, w jaki Google ją zamyka – jednym zdaniem, z pozycji, na której akurat zyskuje – jest tak wymowny. Rozłożyliśmy argumenty za i przeciw w osobnym tekście o [pliku llms.txt](/geo/llms-txt/); warto zobaczyć obie strony, zanim przyjmiesz werdykt Google jako ostateczny.

### „Nie dziel treści na fragmenty" – sprzeczność z własnym opisem RAG

To wewnętrzna niespójność samego przewodnika. W jednej sekcji Google tłumaczy, że jego systemy pobierają z indeksu **konkretne fragmenty** i z nich budują odpowiedź. W drugiej zapewnia, że nie musisz dzielić treści na mniejsze części, bo „systemy zrozumieją niuanse".

Obie rzeczy są częściowo prawdziwe – i właśnie to czyni przekaz mylącym. Nie chodzi o sztuczne siekanie tekstu na atomy. Chodzi o to, że **samodzielny, dobrze osadzony akapit 3–5 zdań jest cytowalny, a ściana tekstu nie**. Jeśli kluczowy fakt wymaga przeczytania trzech wcześniejszych akapitów, żeby nabrał sensu, model go nie wybierze. Pisaliśmy o tym szczegółowo przy okazji [query fan-out](/geo/query-fan-out/) – w silnikach, które dzielą treść na fragmenty (chunkują) przy pobieraniu (a robi to większość systemów RAG poza Google), struktura fragmentów ma jeszcze większe znaczenie niż w samym Google.

### „Nie szukaj wzmianek" – pomylenie spamu z obecnością

Google słusznie mówi, że kupowanie sztucznych wzmianek nie działa. Ale przeskakuje z „spam nie działa" do „wzmianki nie mają znaczenia", a to nie to samo. Modele językowe są trenowane i osadzane w faktach na podstawie treści z Reddita, forów, recenzji i serwisów branżowych. To, co internet mówi o Twojej marce **poza Twoją stroną**, realnie wpływa na to, co model odpowie pytany o Ciebie. Nazywa się to share of voice w AI i jest mierzalne – opisaliśmy to w tekście o [udziale marki w odpowiedziach AI](/geo/share-of-voice/). Google rozmywa ten sygnał, bo autentyczna obecność off-site to obszar, którego nie kontroluje przez ranking.

## Perspektywa monopolisty – dlaczego ten dokument powstał właśnie teraz

Tu dochodzimy do sedna. Każdy akapit przewodnika mówi o „wyszukiwarce Google" i „funkcjach opartych na generatywnej AI w wyszukiwarce Google". To nie przypadek ani niezręczność stylistyczna – to precyzyjne zawężenie pola. Google opisuje swój wycinek rynku tak, jakby był całym rynkiem.

A rynek odpowiadania na pytania użytkowników przestał być jednolity. Owszem, w klasycznym wyszukiwaniu Google wciąż ma około 90% udziału. Ale generatywne odpowiedzi to dziś również:

- **ChatGPT** z wyszukiwaniem w sieci – setki milionów użytkowników tygodniowo (OpenAI oficjalnie informuje o takich liczbach), dla których to pierwszy punkt kontaktu z pytaniem;
- **Perplexity** – wyszukiwarka odpowiedzi zbudowana od zera wokół cytowań źródeł;
- **Microsoft Copilot** – wbudowany w Windows, Edge i Microsoft 365, czyli w narzędzia, których ludzie używają w pracy codziennie;
- **Google** oraz **Claude** z dostępem do sieci – kolejne kanały, w których zapada decyzja, czy Twoja marka zostanie wymieniona.

Żaden z tych systemów nie działa na „podstawowych systemach rankingowych Google", do których przewodnik sprowadza całe wyszukiwanie AI. Mają własne crawlery, własne źródła, własną logikę cytowania. Optymalizacja wyłącznie pod reguły Google oznacza, że jesteś niewidoczny dokładnie tam, gdzie Twoi klienci coraz częściej pytają.

<aside class="callout-fact">
  <div class="callout-icon">✦</div>
  <div class="callout-body">
    <div class="callout-label">Kontekst, o którym Google nie wspomina</div>
    <p>W sierpniu 2024 roku sąd federalny w USA (sędzia Amit Mehta) orzekł, że Google <strong>nielegalnie utrzymywał monopol</strong> w wyszukiwaniu ogólnym i reklamie tekstowej. Firma działa dziś pod presją regulacyjną i w obliczu pierwszej realnej konkurencji w historii. Przewodnik, który zapewnia „nic się nie zmienia, słuchajcie nas", warto czytać również jako komunikat broniący status quo, a nie tylko neutralny poradnik techniczny.</p>
  </div>
</aside>

Nie twierdzimy, że Google działa w złej wierze. Twierdzimy, że pisze szczerze ze swojej perspektywy – a jego perspektywą jest świat, w którym wyszukiwanie zaczyna się i kończy na Google. Przez dwie dekady było to wystarczająco bliskie prawdy, by traktować rady Google jako uniwersalne. Dziś już nie jest.

## Co to znaczy dla Twojej firmy

Przełóżmy to na konkretne decyzje. Jeśli prowadzisz firmę i zastanawiasz się, co z tego wynika praktycznie:

- **Przyjmij fundamenty SEO – Google ma tu rację.** Indeksowalność, jakość techniczna, unikalna treść z pierwszej ręki. To działa w Google i jest warunkiem wstępnym wszędzie indziej. Nie odpuszczaj tego.
- **Ale nie zamykaj strategii w jednym silniku.** „Optymalizacja pod AI" to nie synonim „optymalizacji pod Google AI Overviews". To widoczność w ChatGPT, Perplexity, Copilocie, Gemini i Claude – z których każdy ma inne źródła i inną logikę cytowania.
- **Traktuj rady „czego nie musisz robić" jako informację o Google, nie o rynku.** Fragmentaryczna struktura treści, dane strukturalne, autentyczna obecność off-site – w innych silnikach mogą realnie działać na Twoją korzyść, nawet jeśli Google mówi, że są zbędne.
- **Mierz, nie zgaduj.** Jedyny sposób, by wiedzieć, gdzie naprawdę jesteś widoczny, to sprawdzić to w kilku modelach naraz, na realnych pytaniach Twoich klientów.

<aside class="callout-expert">
  <div class="callout-icon"><img src="/authors/mateusz-wisniewski.avif" alt="Mateusz Wiśniewski" /></div>
  <div class="callout-body">
    <div class="callout-label">Opinia eksperta</div>
    <p>Najczęstszy błąd, który widzę po publikacji tego typu przewodników, to potraktowanie ich jako instrukcji obsługi całego wyszukiwania AI. Klient czyta „zapomnij o llms.txt i GEO", odhacza temat i wraca do klasycznego SEO – a trzy miesiące później dziwi się, że konkurencja jest cytowana w ChatGPT, a on nie. Google daje dobre rady dla Google. Naszym zadaniem jest dopowiedzieć resztę zdania: „…a dla pozostałych 4–5 silników, w których pytają Twoi klienci, gra wygląda inaczej". Pierwszy krok to zawsze pomiar widoczności w wielu modelach naraz – dopiero on pokazuje, czy rady Google w Twoim przypadku wystarczają, czy są tylko połową odpowiedzi.</p>
    <div class="callout-author">Mateusz Wiśniewski · Ekspert SEO/AI Search, ICEA</div>
  </div>
</aside>

## Podsumowanie: dobra rada, niepełna mapa

Przewodnik Google jest wartościowy i w większości technicznie poprawny. Fundamenty SEO faktycznie są podstawą widoczności w generatywnej AI, a ostrzeżenia przed masową produkcją treści i sztucznym spamem są słuszne. Gdyby Twoim jedynym celem była wyszukiwarka Google, mógłbyś potraktować ten dokument jako wystarczający.

Ale Twoim celem nie jest wyszukiwarka Google – jest widoczność tam, gdzie Twoi klienci szukają odpowiedzi. A oni robią to dziś w coraz większym stopniu poza Google. Dlatego ten przewodnik czytaj jako to, czym naprawdę jest: rzetelną instrukcję obsługi jednego, wciąż największego, ale już nie jedynego gracza. Reszta mapy zostaje do narysowania – i to właśnie ta reszta coraz częściej decyduje o tym, czy marka jest cytowana, czy pomijana.

Jeśli chcesz sprawdzić, jak Twoja marka wypada nie tylko w Google, ale w kilku modelach AI naraz, zacznij od [audytu wzmianek marki w 4 modelach](/narzedzia/brand-check/) albo sprawdź, czy konkretna strona jest gotowa na cytowanie przez AI – [oceną cytowalności strony](/narzedzia/url-check/) dostaniesz wynik od 0 do 100 i listę priorytetowych zmian. To darmowy punkt wyjścia, który pokaże, czy rady Google w Twoim przypadku wystarczają – czy są dopiero połową historii.
