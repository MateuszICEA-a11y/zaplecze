---
title: 'Jak LLM-y wybierają i cytują źródła'
subtitle: 'Zrozum mechanizmy wyszukiwania (retrieval) i cytowania, by Twoje treści trafiały do odpowiedzi AI'
description: 'Jak LLM-y wybierają źródła do cytowania? Mechanizmy RAG, G-Cite vs P-Cite, paradoks głębokości wyszukiwania i co z tego wynika dla Twoich treści.'
date: 2026-05-08
image: ../../../assets/images/blog-geo-jak-llm-cytuja-zrodla.webp
icon: '<path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>'
author:
  name: 'Mateusz Wiśniewski'
  role: 'Ekspert SEO/AI Search · ICEA'
  avatar: ../../../assets/images/authors/mateusz-wisniewski.avif
readTime: '10 min'
tags: ['LLM', 'Cytowania', 'RAG', 'AI Search']
pillar: 'geo'
intent: 'INFO'
level: 'L2'
---

Zanim zaczniesz optymalizować treść pod kątem LLM-ów, musisz wiedzieć, jak one w ogóle wybierają źródła – bo ten mechanizm różni się fundamentalnie od tego, czym kieruje się algorytm Google. **Modele językowe preferują źródła o wysokiej gęstości informacji, ustrukturyzowanej architekturze i jednoznaczności semantycznej, a jedynie 12% adresów URL cytowanych przez LLM-y pokrywa się z czołową dziesiątką organicznych wyników Google dla tego samego zapytania.** To nie jest intuicyjne i dlatego tak wiele stron o silnym profilu SEO nie pojawia się w odpowiedziach AI. Poniżej rozkładam mechanizmy cytowania na czynniki pierwsze – od architektury RAG, przez decyzje modelu, aż po paradoks, który sprawia, że więcej wyszukiwań niekoniecznie oznacza bardziej rzetelne cytowania.

## Dwa paradygmaty cytowania – G-Cite i P-Cite

Kiedy model generuje odpowiedź z przypisami, musi rozstrzygnąć jedno kluczowe pytanie projektowe: czy przypisywać źródło równolegle z pisaniem tekstu, czy dopiero po zakończeniu generowania tekstu? Oba podejścia mają inne konsekwencje dla jakości cytowań i opóźnień (latencji) systemu.

**Pierwsza strategia nosi nazwę Generation-Time Citation (G-Cite) – model generuje tekst odpowiedzi i znaczniki cytowań w jednym przebiegu dekodowania.** Przetwarzając dostarczone w kontekście dokumenty, podejmuje lokalne decyzje autoregresyjne: dla każdego fragmentu tekstu przewiduje kolejne tokeny treści i jednocześnie generuje powiązane tokeny odwołań, np. specjalne znaczniki XML wskazujące numer akapitu źródła. Zaletą jest precyzja dopasowania – cytowanie powstaje w momencie, gdy model „pisze" daną tezę, co minimalizuje rozbieżność między treścią a przypisem. Wadą jest to, że dodatkowe tokeny pomocnicze obciążają mechanizm uwagi, co może obniżać płynność językową i wydłużać czas odpowiedzi.

**Druga strategia – Post-hoc Citation (P-Cite) – rozdziela oba procesy.** W pierwszym kroku model generuje surowy szkic odpowiedzi bez przypisów. Dopiero w kroku drugim oddzielny moduł weryfikacyjny segmentuje wygenerowany tekst na pojedyncze twierdzenia, traktuje je jako osobne zapytania skierowane do bazy wiedzy i za pomocą modeli wnioskowania naturalnego (NLI, ang. *Natural Language Inference*) dopasowuje każde twierdzenie do odnalezionych fragmentów. Podejście to optymalizuje jakość samego tekstu – generowanie bez przypisów nie zakłóca rozkładu prawdopodobieństwa tokenów – ale wymaga co najmniej dwóch przebiegów przetwarzania.

Poniższa tabela zestawia oba podejścia pod kątem kluczowych wymiarów technicznych. Większość komercyjnych silników odpowiedzi stosuje wariant zbliżony do P-Cite lub hybrydę obu strategii.

| Wymiar | G-Cite (przypisanie równoległe) | P-Cite (przypisanie następcze) |
|---|---|---|
| **Sposób wykonania** | Jeden przebieg dekodowania | Dwa przebiegi: szkicowanie + atrybucja |
| **Główny cel** | Precyzja dopasowania tokenów | Pokrycie źródłowe i jakość tekstu |
| **Narzut na opóźnienia** | Wysoki – dodatkowe tokeny pomocnicze | Umiarkowany – zależny od liczby twierdzeń |
| **Przykłady metod** | CoT Citation, LongCite | CiteBART, CEG (Citation-Enhanced Generation) |
| **Ryzyko główne** | Degradacja płynności tekstu | Błędna atrybucja w długich odpowiedziach |

### Jak model szuka fragmentów – warstwa RAG

Zanim model zdecyduje, co zacytować, musi w ogóle pobrać kandydatów do cytowania. W tym miejscu wkracza [generowanie wspomagane wyszukiwaniem](https://pl.wikipedia.org/wiki/Retrieval-augmented_generation) (RAG, ang. *Retrieval-Augmented Generation*) – architektura, w której silnik odpowiedzi dynamicznie przeczesuje zewnętrzne źródła i dostarcza wybrane fragmenty jako kontekst do generowania tekstu.

**Silnik RAG nie czyta strony jak człowiek.** Dzieli tekst na fragmenty o długości 50–150 słów, zamienia je na reprezentacje wektorowe (ang. *embeddings* – liczbowe reprezentacje znaczenia tekstu) i wyszukuje te fragmenty, które są semantycznie najbliższe zapytaniu. Nie ocenia „jakości artykułu" jako całości – ocenia każdy fragment osobno. To fundamentalna różnica: możesz mieć świetny artykuł, ale jeśli żaden jego fragment nie odpowiada samodzielnie na konkretne pytanie, silnik go pominie.

Co decyduje o wyborze fragmentu przez RAG? Trzy właściwości są kluczowe:

- **Samodzielność semantyczna** – fragment zawiera kompletną tezę, definicję lub dane bez konieczności czytania otaczającego kontekstu; model może go powtórzyć w izolacji.
- **Gęstość faktograficzna** – liczby, daty, nazwy własne, cytowania badań; elementy, które model może bezpiecznie wyodrębnić jako weryfikowalne fakty.
- **Spójność z nagłówkiem** – nagłówek jako pytanie, a bezpośrednio pod nim odpowiedź; nagłówki H2/H3 pełnią rolę znaczników granic bloków danych i ułatwiają silnikowi lokalizację właściwego fragmentu.

Jeśli chcesz sprawdzić, jak Twoje konkretne adresy URL wypadają pod kątem cytowalności, narzędzie [Ocena cytowalności strony](/narzedzia/url-check/) analizuje stronę na podstawie tych czynników w kilkadziesiąt sekund.

## Dlaczego silne SEO nie gwarantuje cytowania

To jeden z najtrudniejszych do zaakceptowania faktów dla osób, które latami inwestowały w budowanie autorytetu domeny. **Analizy porównawcze wykazują, że jedynie 12% adresów URL cytowanych przez modele językowe pokrywa się z czołową dziesiątką organicznych wyników Google dla tego samego zapytania.** Modele nie pytają, ile linków zwrotnych (backlinków) ma strona – pytają, czy fragment jest jednoznaczny i nasycony danymi.

Badanie [Aggarwal et al. (KDD 2024)](https://arxiv.org/abs/2311.09735) z Princeton University zdefiniowało konkretne czynniki podnoszące widoczność źródła w odpowiedziach LLM:

- **Statystyki i dane liczbowe** – wzrost wskaźnika cytowań o 15–40%; liczby są łatwiejsze do ekstrakcji przez parsery wektorowe niż opisy narracyjne.
- **Cytaty eksperckie** – wzrost o 30–40%; gotowe moduły językowe o wysokim autorytecie semantycznym, które model może bezpiecznie powtórzyć.
- **Formatowanie fragmentów 50–150 słów** – 2,3-krotny wzrost prawdopodobieństwa wyboru; optymalny rozmiar pod algorytmy podziału na fragmenty.
- **Trzy lub więcej punktów danych na sekcję** – 2,5-krotny wzrost liczby cytowań; ułatwia modelowi agregację danych porównawczych.
- **Optymalizacja płynności tekstu** – wzrost o 15–30%; brak błędów językowych zmniejsza opór przetwarzania dla modelu.

**Strony z pozycji 5–10 w Google, które zastosowały statystyki i cytowania ekspertów, zwiększały widoczność w LLM o 115,1% – znacznie więcej niż domeny z pozycji 1–3, które tego nie zrobiły.** To empiryczne potwierdzenie: gęstość faktograficzna przebija autorytet domeny w logice cytowania przez LLM.

Osobne zjawisko opisane w tej samej analizie: marka lub domena pojawia się w odpowiedzi o 161% częściej, jeśli spójnie występuje w wynikach wielu podzapytań (rozszczepienie zapytania, ang. *query fan-out*) generowanych przez model na etapie dekompozycji zapytania głównego. Dokładny opis tego mechanizmu znajdziesz w artykule o [query fan-out](/geo/query-fan-out/) – z przykładem, jak jedno złożone zapytanie B2B rozkłada się na kilkanaście podzapytań.

<aside class="callout-fact">
  <div class="callout-icon">✦</div>
  <div class="callout-body">
    <div class="callout-label">Ciekawostka</div>
    <p>Rozszczepienie zapytania (query fan-out) odpowiada za <strong>51% wszystkich cytowań generowanych w komercyjnych silnikach odpowiedzi</strong>. Oznacza to, że ponad połowa decyzji o cytowaniu zapada nie na etapie odpowiedzi na pytanie główne, ale podczas budowania odpowiedzi na podzapytania wygenerowane automatycznie przez model. Jeśli marka pojawia się spójnie we wszystkich ścieżkach podzapytań, jej przewaga nad dobrze pozycjonowaną, ale tematycznie wąską stroną jest dramatyczna.</p>
  </div>
</aside>

![Co decyduje, że LLM zacytuje źródło: trafność semantyczna, autorytet domeny, świeżość treści, struktura i nagłówki oraz gęstość danych](../../../assets/images/infographic-geo-jak-llm-cytuja-zrodla.png)

## Jak model uczy się cytować – metody treningowe

Precyzyjne cytowanie nie jest naturalną cechą bazowego modelu językowego. **Podczas wstępnego trenowania (pre-training) jedynym celem optymalizacyjnym modelu jest przewidywanie kolejnego słowa – i ten proces nie uczy modelu, skąd pochodzi dana informacja.** Zdolność cytowania wymaga dodatkowego, ukierunkowanego strojenia.

Pierwszym etapem jest dostrajanie instrukcyjne (ang. *instruction tuning*) na wyspecjalizowanych zbiorach danych zawierających przykłady pytanie–kontekst–odpowiedź-z-przypisami. Przykładem takiej metodologii jest proces Coarse-to-Fine (CoF), który automatyzuje tworzenie dużych zbiorów treningowych: model najpierw generuje odpowiedzi na poziomie całych fragmentów, a następnie iteracyjnie zawęża je do precyzyjnych zdań źródłowych. Zbiór LongCite-45k stworzony w tym procesie zawiera 44 600 precyzyjnych instancji treningowych i pozwala modelom obsługiwać konteksty do 128 000 tokenów.

Drugi etap to uczenie ze wzmocnieniem (ang. *Reinforcement Learning*) ze szczegółowymi nagrodami na poziomie zdania, a nie całej odpowiedzi. **Mniejsze modele wytrenowane ze szczegółowymi nagrodami na poziomie tokenu potrafią przewyższyć jakością cytowań znacznie większe modele komercyjne trenowane z tradycyjnymi, holistycznymi funkcjami nagrody.** To istotny wynik: architektura nagrody ma większe znaczenie niż skala modelu.

Dostosowywanie modeli metodą RLHF (ang. *Reinforcement Learning from Human Feedback*) kalibruje zachowanie – ton, pomocność, rzetelność naukową – ale nie zmienia bazowej wiedzy faktograficznej modelu. Kluczowe jest tu zastosowanie regularyzacji KL (Kullback-Leibler), która stabilizuje proces treningowy poprzez karanie za zbyt duże odchylenia nowej polityki modelu od modelu wyjściowego. Bez tej regularyzacji model mógłby „nauczyć się" cytowania kosztem utraty zdolności do generowania płynnego tekstu.

## Paradoks głębokości wyszukiwania

To jeden z najważniejszych wyników badań nad agentami badawczymi – i jeden z najmniej intuicyjnych. Można by sądzić, że im więcej źródeł sprawdzi agent, tym rzetelniejsza będzie odpowiedź. Rzeczywistość jest odwrotna.

Ewaluacja 14 czołowych modeli komercyjnych i otwartoźródłowych (open-source) ujawniła charakterystyczny wzorzec. Wiarygodność cytowań mierzono w trzech wymiarach: poprawność linków, zgodność tematyczna i faktyczna weryfikowalność twierdzeń (Fact Check). Podczas gdy dwa pierwsze wymiary pozostają stabilne niezależnie od liczby wywołań wyszukiwarki, trzeci dramatycznie spada wraz z rosnącą głębokością wyszukiwania.

| Liczba wywołań wyszukiwarki | Poprawność linków | Zgodność tematyczna | Weryfikowalność faktów |
|---|---|---|---|
| 2 wywołania | > 92% | > 92% | 79% |
| 150 wywołań | > 92% | > 92% | 17% |

**Zwiększenie liczby przeszukiwanych stron z 2 do 150 obniża faktyczną weryfikowalność cytowań o około 62 punkty procentowe, przy niezmienionej poprawności linków.** Model nadal podaje prawidłowe adresy URL i tematycznie pasujące źródła – ale treść, do której się odwołuje, nie zawsze potwierdza zacytowane fakty.

Przyczyną jest semantyczne przeciążenie kontekstu. Olbrzymia ilość pobranych danych wprowadza szum informacyjny, który rozprasza mechanizmy uwagi modelu generatora. W konsekwencji model poprawnie wnioskuje fakty ze swojej wiedzy parametrycznej, ale przypisuje je do losowych adresów URL, które znajdowały się w oknie kontekstowym – zjawisko zwane błędną atrybucją (ang. *misattribution*).

Co z tego wynika w praktyce? Dla Twojej strategii GEO oznacza to, że **Twój fragment musi być nie tylko tematycznie pasujący, ale i wyraźnie odróżniający się semantycznie od pozostałych fragmentów w kontekście modelu** – inaczej model przypisze do niego inny fakt. W tym miejscu kluczową rolę odgrywa unikalna gęstość danych i precyzja sformułowania.

<aside class="callout-expert">
  <div class="callout-icon"><img src="/authors/piotr-wicenciak.avif" alt="Piotr Wicenciak" /></div>
  <div class="callout-body">
    <div class="callout-label">Opinia eksperta</div>
    <p>W projektach audytowych ICEA widzę ten błąd regularnie: klienci produkują dziesiątki artykułów o podobnym ujęciu tematycznym, licząc na efekt skali. W logice Google to sensowna strategia. W logice LLM to problem – model pobiera kilka podobnych fragmentów do kontekstu i traci zdolność do precyzyjnej atrybucji, bo semantycznie wyglądają prawie tak samo. <strong>Jedna strona z trzema unikalnymi danymi liczbowymi i wyraźnie zdefiniowaną tezą wygrywa z piętnastoma stronami ogólnikowymi w każdym audycie Citation Rate, który przeprowadziłem.</strong></p>
    <div class="callout-author">Piotr Wicenciak · SEO Operations Manager, ICEA</div>
  </div>
</aside>

## Jak oceniać jakość cytowań – pułapki ewaluacji

Skoro już wiesz, jak modele cytują, warto wiedzieć, jak mierzyć jakość tych cytowań. Standardowe metody mają istotne ograniczenia, które mogą prowadzić do błędnych wniosków o własnej widoczności.

Platformy ewaluacyjne takie jak ALCE (Academic Long-Context Evaluation) testowały spójność modeli na wymagających zbiorach pytań, wykazując, że **nawet najlepsze komercyjne modele nie zapewniają pełnego wsparcia źródłowego dla generowanych tez w blisko 50% przypadków.** Standard automatycznej oceny AutoAIS (opracowany przez Google, oparty na modelu T5-XXL) ocenia cytowanie binarnie – albo fragment wspiera tezę, albo nie. Ta uproszczona logika wnioskowania naturalnego (NLI) jest nieczuła na niuanse semantyczne.

Bardziej zaawansowane ramy ewaluacyjne, takie jak CiteEval (CiteBench), wprowadzają trzystopniową gradację: pełne poparcie, częściowe poparcie i brak poparcia. Uwzględniają też pełny kontekst zapytania i historię wyszukiwania, co eliminuje nadmierną penalizację modeli za trafne cytowania, które nie pasują do wąsko zdefiniowanej bazy NLI.

Dla praktyka GEO ma to jedno konkretne przełożenie: jeśli monitorujesz widoczność marki narzędziem, które mierzy tylko obecność lub nieobecność cytowania (binarnie), możesz przeoczyć przypadki, w których Twoja marka jest wzmiankowana poprawnie, ale bez bezpośredniego linku. Szczegółowe podejście do pomiaru opisuje artykuł o [audycie widoczności marki](/geo/audyt-widocznosci-marki/) – ze wskazówką, jak odróżnić Citation Rate od Mention Rate w praktycznym pomiarze.

Warto też pamiętać, że wyniki ewaluacji zależą od struktury danych weryfikacyjnych. Analiza błędów automatycznej ewaluacji pokazuje, że **ponad 66% pomyłek klasyfikacyjnych wynika z braku wrażliwości modeli ewaluacyjnych na drobnoziarniste informacje faktograficzne.** Innymi słowy: narzędzia pomiarowe często nie wykrywają błędów, które dla ludzkiego oceniającego byłyby oczywiste.

## Co to oznacza dla Twoich treści

Mechanizmy opisane powyżej przekładają się na konkretne decyzje redakcyjne. **Nie optymalizujesz „artykułu" – optymalizujesz każdy fragment z osobna**, bo RAG ocenia fragmenty, nie całe strony.

Zestaw reguł, które wynikają bezpośrednio z opisanych mechanizmów:

- **Front-loading w każdej sekcji** – wczesne sygnalizowanie kluczowych informacji (ang. *front-loading*): kluczowa teza lub liczba musi pojawić się w pierwszych dwóch zdaniach pod nagłówkiem; silnik pobiera fragment, ale nie wie, co jest na dole akapitu.
- **Dane liczbowe z datą i źródłem** – „wzrost o 30%" to dane do ekstrakcji; „znaczny wzrost" to szum, który model ignoruje.
- **Fragmenty 50–150 słów** – optymalny rozmiar dla algorytmów podziału na fragmenty; zbyt długie tracą samodzielność semantyczną, zbyt krótkie tracą kontekst.
- **Unikalne ujęcia tematyczne** – dwa artykuły o podobnym temacie rywalizują o ten sam slot w kontekście modelu; jeden wygrywa, drugi jest ignorowany lub generuje błędną atrybucję.
- **Spójność danych w sieci** – jeśli Twoja strona i partnerski blog podają różne liczby dotyczące tej samej kwestii, model uzna tę informację za niejednoznaczną i usunie ją z syntezy.

Jeśli chcesz sprawdzić, jak Twoja marka jest obecnie postrzegana przez cztery główne silniki AI – i na tle której kategorii pojawia się lub nie pojawia – darmowe narzędzie [Widoczność marki w AI](/narzedzia/brand-check/) robi to automatycznie. To dobry punkt startowy przed głębszą optymalizacją treści zgodną z zasadami omawianymi w tym artykule.

Pełną logikę tego, czym GEO różni się od SEO i jakie działania przynoszą efekty w jakim horyzoncie czasowym, opisuje [kompletny przewodnik po GEO](/geo/przewodnik/) – jeśli ten artykuł to Twój pierwszy kontakt z tą dyscypliną, zacznij od niego.

## FAQ o cytowaniu przez LLM-y

### Czy moja strona może być cytowana bez generowania ruchu?

Tak – i to częsty przypadek. Modele takie jak ChatGPT w trybie offline cytują źródła ze swoich danych treningowych bez generowania żadnych kliknięć. Perplexity i Google AI Overviews generują kliknięcia, ale często jest ich mniej niż w tradycyjnym SEO, bo użytkownik dostaje odpowiedź bez konieczności odwiedzania strony. Miara sukcesu w GEO to Citation Rate i Mention Rate, a nie ruch organiczny.

### Czy długie artykuły lepiej się cytują niż krótkie?

Nie – i wyniki badań nad paradoksem głębokości wyszukiwania to potwierdzają. Długi artykuł generuje więcej fragmentów w kontekście modelu, co przy semantycznie podobnych sekcjach zwiększa ryzyko błędnej atrybucji. Kilka precyzyjnych, nasyconych danymi sekcji po 100–150 słów ma wyższy wskaźnik cytowań niż jeden artykuł o długości 5000 słów z ogólnikowymi opisami.

### Czy aktualizacja treści poprawia cytowania?

Tak, szczególnie w silnikach RAG z dynamicznym pobieraniem (Perplexity, Google AI Overviews). Zaktualizowane dane z datą i źródłem sygnalizują modelowi aktualność fragmentu. Modele są trenowane, żeby preferować aktualne informacje nad przestarzałymi przy zbliżonej jakości semantycznej.

### Jak szybko widać efekty zmian?

Dla silników RAG z dynamicznym indeksowaniem – zmiany w Citation Rate można zmierzyć po 2–4 tygodniach. Dla modeli opartych na danych treningowych (ChatGPT offline, Claude) efekty zależą od cyklu aktualizacji modelu i mogą zajmować miesiące. Dlatego strategia GEO zawsze powinna obejmować oba wektory – zarówno optymalizację pod dynamiczne RAG, jak i budowanie obecności w źródłach zasilających dane treningowe.
