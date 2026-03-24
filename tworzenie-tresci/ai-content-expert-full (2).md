# AI Content Generation Expert

> Pełne materiały kursu do NotebookLM

---


## 📅 Tydzień 1

# 1.1 Wprowadzenie - organizacja kursu

<div class="lesson-meta">
  <div class="lesson-mentor">
    <img class="lesson-mentor__avatar" src="https://framerusercontent.com/images/t2GGO1yled5Z8wSFTTJMQHHzd4.png?scale-down-to=512&width=2976&height=2949" alt="Maciej Chmurkowski" />
    <span class="lesson-mentor__info">
      <span class="lesson-mentor__label">Mentor</span>
      <span class="lesson-mentor__name-text">Maciej Chmurkowski</span>
    </span>
  </div>
  <div class="lesson-rating" data-lesson-id="ai-content-expert/blok-1/lekcja-1"></div>
  <div class="lesson-completion" data-lesson-id="ai-content-expert/blok-1/lekcja-1"></div>
</div>

<div style="position:relative;padding-top:56.25%;"><iframe src="https://player.mediadelivery.net/embed/565073/2c7c5fd5-b387-4be0-9e87-c934dacd8909?autoplay=false&loop=false&muted=false&preload=true&responsive=true" loading="lazy" style="border:0;position:absolute;top:0;height:100%;width:100%;" allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;" allowfullscreen="true"></iframe></div>

<br />



## 🎯 Cel lekcji

Zapoznanie z formułą programu, celami edukacyjnymi oraz przygotowanie do pracy z narzędziami AI do generowania treści.

---

## 📒 Notatka z lekcji

### Filozofia pracy: Podejście modułowe

Kurs został zaprojektowany w oparciu o jedną kluczową zasadę: **Jeden film = jedno zagadnienie.**

Taka struktura ma na celu umożliwienie samodzielnego budowania procesów. Traktuj poszczególne lekcje jak klocki, z których możesz układać własne rozwiązania.

**Zasady łączenia modułów:**

- **Elastyczność:** Jeśli chcesz wykorzystać konkretny element (np. ekstrakcję encji lub pobieranie treści ze stron) w zupełnie innym procesie, możesz to zrobić.
- **Łączenie:** Twoim zadaniem jest nauka łączenia tych klocków w dowolne konfiguracje, tworząc własny "wodospad procesów" (pipeline).
- **Etapowość:** W pierwszym etapie nauki skupiamy się na poznaniu poszczególnych "klocków", a nie na budowie całościowego systemu od razu.

**Metodyka w każdym module:**

Każde nagranie (poza wstępem teoretycznym) opiera się na pracy koncepcyjnej według schematu:

1. **Output:** Określenie celu (co chcemy uzyskać).
2. **Input:** Określenie zasobów (co mamy do dyspozycji).
3. **Realizacja:** Dobór odpowiednich narzędzi i wykonanie zadania.

Będziemy zajmować się nie tylko technikaliami, ale też "vibe codingiem", budowaniem architektury procesu oraz inżynierią wsteczną promptów.

---

### Pipeline systemu generowania treści

Poniżej znajduje się szczegółowy opis procesu, który służy do wygenerowania gotowego artykułu lub wpisu blogowego. Jest to schemat, który będziemy realizować krok po kroku w trakcie kursu.

#### Krok 1: Dane wejściowe (Input)
Na początku dysponujemy jedynie **słowem kluczowym** oraz **wybranym językiem treści**. System jest przystosowany do generowania materiałów w dowolnym języku.

#### Krok 2: Budowa RAG (Retrieval-Augmented Generation)
Pobieramy adresy URL z wyników wyszukiwania (SERP) na podstawie słowa kluczowego.

#### Krok 3: Ekstrakcja treści
Jest to jeden z najtrudniejszych technicznie etapów. Polega na wyciągnięciu "mięsa" (właściwej treści) z pobranych stron internetowych.

#### Krok 4: Czyszczenie danych i budowa Grafu Wiedzy
Surowe dane są czyszczone, a następnie wykorzystywane do budowy grafu wiedzy. Składa się on z trzech głównych elementów:

- **Encje:** Kluczowe obiekty i pojęcia.
- **Fakty:** Zweryfikowane informacje wyciągnięte z tekstu.
- **Pytania i podzapytania (Query Fanout):** Zastosowanie techniki Query Fanout (rozszerzania zapytań), która zostanie szczegółowo omówiona w dedykowanym materiale.

#### Krok 5: Generowanie struktury (Outline)
Na podstawie zgromadzonej wiedzy tworzymy hierarchiczny szkielet treści (outline).

#### Krok 6: Generowanie wersji roboczej (Draft)
System tworzy wstępną wersję tekstu na podstawie przygotowanego wcześniej outline'u.

#### Krok 7: Optymalizacja i humanizacja
To kluczowy moment dla jakości tekstu.

- **Humanizacja:** Proces nadawania treści naturalnego, ludzkiego brzmienia (jest to jeden z priorytetów kursu).
- **Czytelność:** Poprawa struktury zdań i akapitów, aby tekst był łatwy w odbiorze.

#### Krok 8: Gotowa treść (Output)
Finalnym produktem jest artykuł gotowy do publikacji na stronie internetowej, blogu lub w innym medium.

---

### Plan kursu (Spis treści)

Struktura kursu odpowiada dokładnie opisanemu wyżej przepływowi danych. Przy każdym etapie zostaną wskazane technologie niezbędne do jego realizacji.

**Blok 1: Wprowadzenie i teoria**
Fundamenty pracy z modelami i procesami.

**Blok 2: RAG i budowa grafu wiedzy**
Obejmuje pobieranie URL, ekstrakcję treści, czyszczenie danych oraz tworzenie struktury wiedzy (fakty, encje, pytania).

**Blok 3: Generowanie i optymalizacja treści**
Tworzenie outline'u, draftu, a następnie procesy humanizacji i finalnej optymalizacji tekstu.

**Blok 4: Lekcje dodatkowe**
Zestaw zagadnień, które nie są bezpośrednią częścią głównego pipeline'u, ale są kluczowe dla jakości i użyteczności treści:

- **Detekcja treści AI:** Analiza działania detektorów i sposoby na ich ominięcie.
- **Similarity Score:** Wykorzystanie wskaźnika podobieństwa do optymalizacji treści (napiszemy do tego prosty skrypt).
- **Generowanie metadanych:** Automatyczne tworzenie tytułów, opisów (meta description) oraz sekcji FAQ.
- **Analiza intencji:** Określanie intencji użytkownika na podstawie słowa kluczowego (z wykorzystaniem API Senuto).
- **Konsensus wiedzy:** Praca z cytatami i odniesieniami do źródeł.

---

### Podsumowanie i następne kroki

Zrozumienie tego przepływu jest kluczowe, ponieważ każdy kolejny film będzie realizował jeden z jego elementów. Pamiętaj, że choć uczymy się na przykładzie artykułu, ten sam pipeline możesz zaadaptować do dowolnego formatu treści.

**Co teraz?**

- Przygotuj się na pierwszy blok merytoryczny, w którym zdefiniujemy cele i zasoby dla pierwszego etapu procesu.
- Zastanów się, jakie "klocki" z powyższego schematu mogą być najbardziej przydatne w Twoich obecnych projektach

---

<details>
<summary>📝 Transkrypcja wideo</summary>

Cześć! Zasada jest bardzo ważna, o którą musicie zapamiętać. Ten kurs jest zaprojektowany modułowo. Czyli jest jedna zasada. Jeden film, jedno zagadnienie. Być może będą takie zagadnienia, które będą wymagały kontynuacji albo outputu z poprzedniego filmu. Wtedy będę Was o tym informował. O co chodzi? Chodzi o to, żebyście mogli samodzielnie składać sobie te pipeliny, czyli ten wodospad Waszych procesów jak klocki. Jeżeli chcecie wykorzystać ekstrakcję ENCI do innego procesu, będziecie mogli to zrobić. Tak samo jeżeli będziecie chcieli wykorzystać ekstrakcję kontentu ze strony internetowych, też będziecie mogli to zrobić i te klocki połączyć sobie tak, jakbyście chcieli. Czyli w pierwszym tygodniu nie budujemy nic całościowego systemu, w dzisiejszym tygodniu bawimy się klockami. Jak będziemy pracować z materiałami? Większość naszych nagrań to będzie praca koncepcyjna oprócz tego pierwszego bloku, który jest takim blokiem wprowadzającym i teoretycznym. Najpierw zawsze w tych filmach naszych, w tych klockach określimy cel, czyli nasz output, co chcemy uzyskać i oczywiście zasoby, jakie mamy do dyspozycji, czyli ten input. I na tym podstawie dobierzemy narzędzia odpowiednie i zrealizujemy wspomniany cel. I tak, część materiałów dotyczy sposobu myślenia, vibe codingu nawet, czy decyzji, czy budowania architektury procesu. Na przykład za pomocą modeli językowych czy reasoningowych, będziemy tworzyć prompty bądź wykorzystywać inżynierię wsteczną do ich tworzenia. Teraz pokrótce omówimy sobie pipeline całego systemu, który służy do wygenerowania treści. To jest to mój pipeline, to jest najnowszy system, który stworzyłem. Jak spojrzycie sobie na ekran, to zobaczycie, że jest tu wiele kroków i większość z tych kroków, chyba w sumie wszystkie, będziemy po kolei realizować. To będą te nasze krocki. Zaczniemy od tego, że mamy do dyspozycji słowo kluczowe i język treści, dlatego że będziemy w stanie po tym kursie generować treści w każdym języku. Jeżeli przyjrzycie się na ten pipeline, na ten wykres, który to pokazuje, będziecie widzieli po kolei cały przepływ, który jest to samy, zaraz pokażę, ze spisem treści i z filmikami. Czyli najpierw będziemy musieli stworzyć raga, czyli pobierzemy sobie url z serpów, później wyekstraktujemy treści, to chyba jeden będzie z największych i z najtrudniejszych klocków, ponieważ będzie wymagał dość wielu technicznych aspektów. Postaram się Wam to ułatwić. Później będziemy te treści czyścić i zbudujemy graf wiedzy, który będzie zbudowany z NC, który będzie również zbudowany z faktów, który będzie również zbudowany z pytań i podzapytań z queryfanout. Query Funout to jest bardzo ciekawe i nowe zagadnienie, które poznacie bliżej w osobnym filmiku. Następnie wygenerujemy outline, czyli tą strukturę hierarchiczną naszej treści, wygenerujemy draft i później zaczyna się już zabawa z optymalizacją, humanizacją, a w humanizacji wiecie, że jestem naprawdę dobry. Poprawimy sobie czytelność tego tekstu i na koniec dostaniemy już tak naprawdę gotową treść. Będziemy uczyć się na podstawie tworzenia artykułu na stronę internetową, ale tak naprawdę możecie to wykorzystać cały ten pipeline do tworzenia czy wpisów blogowych, czy jakiegokolwiek innego rodzaju treści. Na koniec, i teraz przejdę, na chwilę poczekajcie, przejdę do naszego spisu treści. Jeżeli się przyjrzycie teraz samemu spisowi, to jest tożsame z tym przepływem, o którym Wam pokazałem, czyli blok pierwszy wprowadzenie teoria, blok drugi rak i budowa grafu wiedzy, blok trzeci generowanie i optymalizacja treści. Tych filmików będzie sporo, jedne będą dłuższe, długie, krótsze, natomiast tak jak tutaj też widzicie, postarałem się dopisać technologię, jaka będzie potrzebna do tego i to, co chciałem powiedzieć, to są lekcje dodatkowe, blok czwarty, w której wprowadzimy parę lekcji, które nie wpisały się w ten nasz pipeline, które nie miały bezpośredniego udziału w tym przepływie naszym, czyli na przykład detekcja treści AI, trochę przyjrzymy się detektorom, zoptymalizujemy, użymy magicznego, pojęcia similarity score, którego ja też często używam i spróbujemy zoptymalizować treści, napiszemy sobie prosty skrypt. Wygenerujemy treści dodatkowe. Ja to nazywam, czyli te podsumowania, title, meta description oraz fact. I zastanowimy się, jak uzyskać intencje na podstawie słowa kluczowego. Podpowiadam, prawdopodobnie będziemy korzystać już z senosowskiego API. I ostatni filmik, konsensus wiedzy, cytaty i odniesienia do źródeł. Dziękuję. 

</details>

---

<div class="lesson-completion-bottom" data-lesson-id="ai-content-expert/blok-1/lekcja-1"></div>

<div id="sensai-comments"></div>


---

# 1.2 Narzędzia LLM - API czy Chat

<div class="lesson-meta">
  <div class="lesson-mentor">
    <img class="lesson-mentor__avatar" src="https://framerusercontent.com/images/t2GGO1yled5Z8wSFTTJMQHHzd4.png?scale-down-to=512&width=2976&height=2949" alt="Maciej Chmurkowski" />
    <span class="lesson-mentor__info">
      <span class="lesson-mentor__label">Mentor</span>
      <span class="lesson-mentor__name-text">Maciej Chmurkowski</span>
    </span>
  </div>
  <div class="lesson-rating" data-lesson-id="ai-content-expert/blok-1/lekcja-2"></div>
  <div class="lesson-completion" data-lesson-id="ai-content-expert/blok-1/lekcja-2"></div>
</div>

<div style="position:relative;padding-top:56.25%;"><iframe src="https://player.mediadelivery.net/embed/565073/6319c048-6fa3-4826-90fa-edca91d9b0a3?autoplay=false&loop=false&muted=false&preload=true&responsive=true" loading="lazy" style="border:0;position:absolute;top:0;height:100%;width:100%;" allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;" allowfullscreen="true"></iframe></div>

<br />



## 🎯 Cel lekcji

Zrozumienie różnic między interfejsem Chat a API oraz poznanie ekosystemu narzędzi zewnętrznych.

---

## 📒 Notatka z lekcji

### Dobór narzędzi do generowania treści

W tej części kursu przechodzimy od teorii (omówionego wcześniej pipeline'u) do praktyki. Skupimy się na wyborze odpowiednich narzędzi technicznych, które umożliwią realizację procesu generowania treści w sposób skalowalny i powtarzalny.

### Czat czy API? Dwa podejścia do pracy

Podstawową decyzją, którą musimy podjąć, jest wybór metody komunikacji z modelem językowym (LLM). Mamy do dyspozycji dwie główne ścieżki:

**1. Korzystanie z interfejsu czatu**

Jest to metoda znana większości użytkowników. Czaty posiadają pewne udogodnienia, takie jak pamięć wewnętrzna, możliwość zapisywania projektów (np. w modelach typu Claude) czy polecenia systemowe.

**Ograniczenia:**
- Czaty mają tendencję do "filtrowania" danych, co oznacza, że odpowiedzi mogą się różnić nawet przy tym samym zapytaniu.
- Co ważniejsze, czaty nie pozwalają na stworzenie "hurtowni treści" — trudno w nich o szybką powtarzalność i automatyzację na dużą skalę.

**2. Bezpośrednie odwołanie do API (Python/Colab)**

To preferowana metoda w tym kursie dla bardziej zaawansowanych procesów. Wykorzystamy język Python oraz środowisko Google Colab do wysyłania zapytań bezpośrednio do API modeli.

**Zalety:**
- Różnica w wydajności jest kolosalna.
- To podejście pozwala na masowe przetwarzanie danych ("hurtownię") i zapewnia znacznie większą kontrolę nad procesem oraz powtarzalność wyników.

### Kiedy czat to za mało?

Choć w trakcie kursu — tam, gdzie to możliwe — będą pokazywane metody realizacji zadań za pomocą czatu, musisz być świadomy, że nie wszystkie "klocki" naszego procesu da się w ten sposób obsłużyć.

**Zadania trudne lub niemożliwe do wykonania w czacie:**

- **Pobieranie treści z zewnętrznych URL:** Czaty często mają problem z precyzyjnym dostępem do żywych stron.
- **Skuteczne sprawdzanie intencji:** Wymaga precyzji, której czat może nie zapewnić.
- **Augmentacja danych i Query Fanout:** Zaawansowane techniki rozszerzania zapytań.

W powyższych przypadkach czaty (np. ChatGPT) mają tendencję do silnego halucynowania, dlatego będziemy polegać na rozwiązaniach kodowych.

### Zarządzanie przepływem danych (Data Flow)

Kluczowym aspektem budowania pipeline'u jest zrozumienie, jak dane wędrują między poszczególnymi etapami. Należy traktować ten proces jako sekwencję zdarzeń.

**Zasada Input-Output:**

Dane, które otrzymujemy jako wynik (output) z jednego klocka, muszą zostać zapisane, aby stały się danymi wejściowymi (input) dla kolejnego klocka.

**Sposób zapisu danych:**

Chociaż w profesjonalnych zastosowaniach używa się baz danych, w tym kursie zastosujemy prostsze, ale skuteczne metody, aby nie komplikować procesu:

- **Pliki tekstowe:** Do prostego zapisu treści.
- **Pliki z tablicami:** Do bardziej ustrukturyzowanych danych.

Dzięki temu będziemy mogli łatwo przenosić informacje pomiędzy poszczególnymi etapami generowania treści bez konieczności stawiania skomplikowanej infrastruktury bazodanowej.

### Podsumowanie

W tym kursie stawiamy na automatyzację i skalowalność, dlatego głównym narzędziem będzie Python i Google Colab komunikujące się z API. Pamiętaj jednak, że celem jest zrozumienie procesu — tam, gdzie technologia na to pozwoli, otrzymasz również wskazówki, jak wykonać zadanie w tradycyjnym czacie.

---

<details>
<summary>📝 Transkrypcja wideo</summary>

W tej części naszego kursu zastanowimy się jak dobrać odpowiednie narzędzia do generowania treści. W poprzednim filmiku opowiedziałem Wam o całym pipeline, czyli tym wodospadzie sekwencji generowania treści, natomiast zapewne nie każdy z Was korzystał kiedykolwiek z API LEM-ów, czyli bezpośrednio odwołania do modelu językowego. część z Was pewnie korzysta z czatu. Z czatem jest jeden problem, dlatego że czaty nie są... za pomocą czatów nie jesteśmy w stanie zrobić hurtowni, hurtowni treści, czyli zrobić szybkiej powtarzalności. Zrobimy ją natomiast za pomocą Pythona, Colaba i zapytań do API. Różnica jest kolosalna, ponieważ tak, fachat oczywiście zachowuje wątek, ale też filtruje dane. Czyli te dane, które dostajemy, na które dostajemy odpowiedź, zawsze mogą się różnić przy tym samym zapytaniu. I teraz tak, są różne rozwiązania, żeby to zrobić, żeby sobie z tym poradzić. Nie wiem, czy znacie pojęcie pamięci wewnętrznej w czatach, zapisywania projektów, matocloud m.in. 4,5, czy np. polecenie systemowe. Za każdym razem postaram się Wam ułatwić sprawę. Jeżeli się da, będę opowiadał, jak dany klocek zrealizować w czacie, jeżeli będzie taka możliwość, bo nie zawsze będzie. Nie wszystkie obszary da się zrealizować za pomocą czatu. Na pewno nie takie jak pobieranie treści z zewnętrznych URL, czy skuteczne sprawdzanie intencji, albo augmentacja, czy query fanout. przy takich zadaniach chat GPT czy jakieś inne czaty potrafią dość mocno halucynować. Musicie sobie uświadomić, że ten proces nasz cały zbudowany z sekwencji, ten pipeline jest równoznaczny z zapisem, czyli dane, które dostajemy na outputcie z jednego klocka musimy zapisać i one w sekwencji będą inputem w kolejnym. Można to robić na wiele sposobów. Ja korzystam z baz danych, ale nie będę tego Was wymagał. Zrobimy zapisywanie podobnie do plików bądź do plików tekstowych bądź do plików z tablicami i w ten sposób będziemy przenosić sobie te dane pomiędzy naszymi klockami. 

</details>

---

<div class="lesson-completion-bottom" data-lesson-id="ai-content-expert/blok-1/lekcja-2"></div>

<div id="sensai-comments"></div>


---

# 1.3 Jak działają modele językowe

<div class="lesson-meta">
  <div class="lesson-mentor">
    <img class="lesson-mentor__avatar" src="https://framerusercontent.com/images/t2GGO1yled5Z8wSFTTJMQHHzd4.png?scale-down-to=512&width=2976&height=2949" alt="Maciej Chmurkowski" />
    <span class="lesson-mentor__info">
      <span class="lesson-mentor__label">Mentor</span>
      <span class="lesson-mentor__name-text">Maciej Chmurkowski</span>
    </span>
  </div>
  <div class="lesson-rating" data-lesson-id="ai-content-expert/blok-1/lekcja-3"></div>
  <div class="lesson-completion" data-lesson-id="ai-content-expert/blok-1/lekcja-3"></div>
</div>

<div style="position:relative;padding-top:56.25%;"><iframe src="https://player.mediadelivery.net/embed/565073/e7435c7d-1aa7-4028-b6fb-a6dc717b9298?autoplay=false&loop=false&muted=false&preload=true&responsive=true" loading="lazy" style="border:0;position:absolute;top:0;height:100%;width:100%;" allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;" allowfullscreen="true"></iframe></div>

<br />



---

## 🎯 Cel lekcji

Zrozumienie podstaw działania NLP, modeli językowych oraz modeli reasoningowych.

---

## 📒 Notatka z lekcji

### Przetwarzanie języka naturalnego w modelach LLM

Zanim przejdziesz do promptowania czy tworzenia skryptów metodą vibecodingu, musisz zrozumieć, jak modele LLM zamieniają treść analogową na postać cyfrową. Proces ten, czyli NLP (Natural Language Processing), pozwala maszynom interpretować składnię, semantykę, intencje oraz kontekst wypowiedzi.

### Kluczowe etapy przetwarzania tekstu

Proces zamiany surowego zdania na dane zrozumiałe dla modelu składa się z trzech najważniejszych kroków.

#### 1. Tokenizacja

To rozbicie tekstu na najmniejsze jednostki zwane tokenami.

**Czym są tokeny:** W uproszczeniu to słowa, ale w praktyce modele często dzielą wyrazy na mniejsze fragmenty (subword tokenization). Pomaga to systemowi radzić sobie z odmianą słów przez przypadki.

**Unikalne ID:** Każdy token otrzymuje swój numer identyfikacyjny, aby model mógł go rozpoznać w obliczeniach.

**Różnorodność:** Każdy model (np. GPT, Claude czy modele Google) posiada własny, unikalny tokenizator.

#### 2. Wektoryzacja i embeddingi

Na tym etapie tokeny są zamieniane na ciągi liczb i umieszczane w przestrzeni wielowymiarowej.

**Przestrzeń wektorowa:** Możesz to sobie wyobrazić jako trójwymiarową mapę, na której pojęcia o podobnym znaczeniu leżą blisko siebie.

**Kontekst nad zapisem:** Słowo "Apple" jako marka znajdzie się w innej części tej przestrzeni niż owoce (jabłka), mimo identycznej pisowni.

**Matematyka bliskości:** Podobieństwo słów mierzy się nie tylko odległością punktów, ale przede wszystkim kątem (cosinusem) między ich wektorami.

**Multimodalność:** Ta sama zasada dotyczy obrazów (np. model Nano Banana), dźwięku czy wideo – wszystko sprowadzane jest do wektorów.

#### 3. Transformery i mechanizm uwagi

To najważniejszy mechanizm, który analizuje relacje między wszystkimi słowami w zdaniu jednocześnie.

**Ważenie znaczeń:** Model decyduje, które słowa są kluczowe dla zrozumienia całości.

**Dynamiczna aktualizacja:** Jeśli model wstępnie przypisał błędny wektor do słowa, po analizie całego zdania potrafi go zaktualizować, aby lepiej pasował do kontekstu (np. dopasowanie zaimka "on" do konkretnej osoby).

### Rozpoznawanie encji (NER) i fakty

Po zbudowaniu kontekstu model wyłuskuje konkretne informacje, czyli encje. Są one podstawą do tworzenia grafów wiedzy. Najpopularniejsze kategorie encji to:

- Osoby
- Organizacje
- Lokalizacje
- Daty

W praktyce najlepiej ograniczyć się do definiowania od kilku do dziesięciu najważniejszych typów encji.

### Proces NLP na przykładzie (Case Study)

Spójrzmy, jak system przetwarza zdanie: "W 2026 roku Apple otworzy biuro w Berlinie".

**Tokenizacja:** Rozbicie zdania na poszczególne elementy.

**Wektoryzacja:** Każdy token otrzymuje swoją listę liczb.

**Transformer:** Na podstawie kontekstu ("otworzy biuro") system wie, że "Apple" to organizacja, a nie owoc.

**Ekstrakcja encji:**
- 2026 rok → Data
- Apple → Organizacja
- Berlin → Lokalizacja

### Jak modele "zgadują" treść?

Modele językowe nie są "inteligentne" w ludzki sposób – to zaawansowane systemy statystyczne. Ich zadaniem jest dopisanie kolejnego tokenu na podstawie prawdopodobieństwa wynikającego z kontekstu.

**Przykład mechanizmu prawdopodobieństwa:**

Zdanie: "Kiedy występujesz na scenie, mów spokojnie i powoli i weź duży..."

- Wdech: 62% (Model wybierze to słowo jako najbardziej prawdopodobne)
- Oddech: 18%
- Przysiad: 5%

Model "wie", co napisać, ponieważ został wytrenowany na miliardach tekstów i nauczył się wzorców występujących w ludzkim języku.

### Co dalej?

Skoro rozumiesz już, jak LLM przetwarza dane pod spodem, możemy przejść do kolejnego kroku, czyli tworzenia skryptów i poznania struktury API. Czy chcesz, abym wyjaśnił bardziej szczegółowo różnicę między tokenami a słowami?

---

<details>
<summary>📝 Transkrypcja wideo</summary>

*(Transkrypcja zostanie uzupełniona)*

</details>

---

<div class="lesson-completion-bottom" data-lesson-id="ai-content-expert/blok-1/lekcja-3"></div>

<div id="sensai-comments"></div>


---

# 1.4 Budowa promptu i dobre praktyki

<div class="lesson-meta">
  <div class="lesson-mentor">
    <img class="lesson-mentor__avatar" src="https://framerusercontent.com/images/t2GGO1yled5Z8wSFTTJMQHHzd4.png?scale-down-to=512&width=2976&height=2949" alt="Maciej Chmurkowski" />
    <span class="lesson-mentor__info">
      <span class="lesson-mentor__label">Mentor</span>
      <span class="lesson-mentor__name-text">Maciej Chmurkowski</span>
    </span>
  </div>
  <div class="lesson-rating" data-lesson-id="ai-content-expert/blok-1/lekcja-4"></div>
  <div class="lesson-completion" data-lesson-id="ai-content-expert/blok-1/lekcja-4"></div>
</div>

## 🎯 Cel lekcji

Opanowanie technik budowania skutecznych promptów oraz zrozumienie parametrów modeli (temperature, top_p, etc.).

---

<div style="position:relative;padding-top:56.25%;"><iframe src="https://player.mediadelivery.net/embed/565073/82b2abab-bb24-46f1-942a-a956183bf15b?autoplay=false&loop=false&muted=false&preload=true&responsive=true" loading="lazy" style="border:0;position:absolute;top:0;height:100%;width:100%;" allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;" allowfullscreen="true"></iframe></div>

<br />



---

## 📒 Notatka z lekcji

### Cel i struktura notatki

W tej lekcji dowiesz się, jak tworzyć precyzyjne instrukcje (prompty) dedykowane do pracy z API oraz jak sterować parametrami modeli językowych i reasoningowych (rozumujących). Wiedza ta jest niezbędna do budowania stabilnych procesów automatyzacji, gdzie kluczowa jest czystość i przewidywalność odpowiedzi.

### Anatomia idealnego promptu

Budowa skutecznego promptu opiera się na pięciu kluczowych sekcjach. Model czyta instrukcje "od góry do dołu", dlatego najważniejsze elementy (Rola i Cel) umieszczamy na początku, a techniczne ograniczenia na końcu.

Struktura promptu składa się z następujących elementów:

**Rola (Role)**: Wprowadzenie modelu w rolę eksperta. Służy zawężeniu jego wiedzy, co skutkuje bardziej precyzyjnymi odpowiedziami.

**Cel (Objective/Goal)**: Jasno wyrażone zadanie, nie krótsze niż 2–3 zdania. Musi być jednoznaczne.

**Reguły (Guidelines)**: Zbiór nakazów i zakazów. Tutaj określamy, co model musi zrobić, a czego mu nie wolno.

**Przykłady (Examples/Few-shots)**: Sekcja krytyczna dla jakości. Podanie przykładów "dobrego" (positive) i "złego" (negative) wykonania zadania pozwala sterować formatem odpowiedzi i stylem.

**Reguły odpowiedzi (Output/Response Rules)**: Techniczne wymogi dotyczące formatu wyjściowego (np. "nie komentuj", "zwróć tylko kod"). Jest to kluczowe dla zachowania ciągłości pipeline'u – zbędny komentarz modelu może zepsuć kolejny krok procesu.

### Formatowanie i hierarchia w prompcie

Aby model lepiej "rozumiał" strukturę polecenia, używamy formatowania Markdown. Model interpretuje nagłówki i pogrubienia jako sygnały ważności.

**Nagłówki ("Płotki")**: Używaj znaków #. Traktuj # jako H1 (tytuł sekcji), ## jako H2 (podsekcja).

**Wyróżnienia**: Używaj **tekst** do pogrubienia kluczowych słów (np. Critical, Important).

Przykładowa struktura logiczna:

```
# Role

# Objective

# Guidelines

## TextStyle Guidelines (reguły stylu)

## Content Guidelines (reguły merytoryczne)

# Examples

# Response Rules
```

### Parametry modeli językowych (np. GPT-4)

W pracy z API (poprzez platformę OpenAI) mamy dostęp do suwaków, które zniknęły ze zwykłego Czatu. Pozwalają one sterować "charakterem" odpowiedzi.

**1. Temperatura (Temperature)**
Określa poziom kreatywności modelu. Skala zazwyczaj wynosi od 0 do 2.

- **0 – 0.3**: Model jest bardzo przewidywalny, mało kreatywny. Idealne do zadań klasyfikacyjnych i ekstrakcji danych.
- **ok. 0.7**: Standardowe ustawienie do generowania tekstów (artykuły, opisy).
- **1.0**: Wysoka kreatywność, ale rośnie ryzyko błędów. Przy długich tekstach model może zacząć "gubić wątek".
- **2.0**: Ustawienie ryzykowne. Model staje się "zbyt kreatywny", generuje losowe znaki, cyrylicę i niezrozumiałe ciągi słów (halucynuje).

**2. Top P**
Odpowiada za zakres słownictwa (pulę tokenów), z której model wybiera kolejne słowa. Zmniejszenie wartości (do 1) sprawia, że model używa bardziej oczywistych słów i jest bardziej przewidywalny.

**Wskazówka**: Manipulując temperaturą i Top P, możesz generować różne wersje tego samego tekstu dla różnych klientów, korzystając z jednego promptu.

### Parametry modeli reasoningowych (np. o1/o3)

Modele te służą do głębszego przetwarzania logicznego. Posiadają specyficzne parametry:

**1. Reasoning Effort (Poziom rozumowania)**
Określa, jak dużo zasobów model ma przeznaczyć na "przemyślenie" zadania.

- Wartości: Low, Medium, High, xHigh.
- Im wyższy poziom, tym lepsza jakość, ale dłuższy czas oczekiwania i wyższy koszt.

**2. Verbosity (Złożoność odpowiedzi)**
Określa, jak rozbudowana ma być odpowiedź. Wysoka wartość (High) poskutkuje długim, szczegółowym, wielosekcyjnym tekstem.

**Kiedy używać?** Modele te świetnie sprawdzają się przy tworzeniu Outline'u (szkieletu artykułu) lub analizie danych. Do pisania samej treści zazwyczaj wystarczą standardowe modele językowe. Ustawienie domyślne to zazwyczaj "Auto".

### Środowisko pracy: OpenAI Platform (Playground)

Zanim użyjesz promptu w kodzie (Python/Colab), przetestuj go w **OpenAI Platform** (dawniej Playground).

**To nie jest ChatGPT**. To interfejs ("nakładka") na API.

Jest to poligon doświadczalny, gdzie możesz:

- Zapisywać i edytować prompty systemowe.
- Testować różne ustawienia temperatury i parametrów.
- Sprawdzać "czystość" odpowiedzi (czy model nie dodaje zbędnych komentarzy).

### Podsumowanie i zadanie domowe

Zrozumienie parametrów i struktury promptu jest fundamentem do dalszej pracy z automatyzacją. W kolejnych lekcjach będziemy używać tych umiejętności do budowania skryptów.

**Co możesz zrobić teraz (Zadanie domowe):**

1. Zarejestruj się/zaloguj na platform.openai.com.
2. Wejdź w zakładkę z czatem (interfejs API).
3. Przetestuj działanie parametrów: wygeneruj krótki tekst SEO przy temperaturze 0.3, a następnie przy 1.0 i porównaj wyniki.
4. Pobaw się modelami reasoningowymi – sprawdź różnicę w odpowiedzi przy ustawieniach "Auto" oraz "High Reasoning/Verbosity".

---

## 📚 Materiały dodatkowe



---

<details>
<summary>📝 Transkrypcja wideo</summary>

W tej części pokażę Wam jak ja konstruuję prompty, czyli te zapytania do modeli językowych. Oczywiście jest to budowa promptu, która jest dedykowana do API, czyli bezpośrednio do zapytania do modeli językowych, ale nie ma problemu, żebyście mogli tej formy używać również w czatach. Jak to wygląda? Jeżeli przyjrzycie się teraz na ekran, zobaczycie, że ja ten prompt dzielę na pięć takich sekcji. Pierwsza to jest rola, czyli rola służy temu, żeby wpuścić model językowy w rolę eksperta, czyli zawęzić jego wiedzę, żeby dawał nam bardziej precyzyjne odpowiedzi. Później Objective czy Goal, możecie już używać zamienie nazwy, czyli nasz cel. Tutaj jasno wyrażony, jednoznaczny, to jest bardzo ważne, cel nie krótszy niż 2-3 zdania i dopiero później mamy reguły, czyli Guidelines. W tych regułach możecie zarówno i zaprzeczać to, czego model nie może i zmuszać go do reguł, które ma wykonać. Super, sprawdzała się kolejna sekcja, czyli przykłady, examples. Zaraz je mówię trochę dokładniej. Tutaj dajemy przykład i to decyduje nie tylko o jakości naszej odpowiedzi, bo model, jeżeli są podane examples, przykłady, bardzo mocno się nimi sugeruje, ale również możemy w ten sposób sterować formatem jego odpowiedzi. I jeżeli mówimy już o formacie, to na koniec output, czyli sponsor, czyli reguły dotyczące odpowiedzi. Zazwyczaj piszemy tam, nie komentuj. Zazwyczaj model zwraca nam pożądany wynik z jakimś komentarzem. Wypróbujemy to oczywiście w praktyce. Zobaczycie jak to działa. To jest oczywiście moja sprawdzona metoda. I teraz, jeżeli przyjrzycie się już samej strukturze, Jak to będzie wyglądało? Ja wprowadzam strukturę płotków. To jest tożsame z nagłówkami w Markdownie. Czyli jeden płotek możecie traktować jako H1, dwa płotki jako H2 i trzy płotki jako H3. Dwie gwiazdki i pogrubienie zakończone gwiazdkami. W ten sposób model dokładnie czyta, jeżeli tekst jest pogrubiony, to jest ważniejszy i też zna hierarchię nagłówku. Przykład. Tutaj widzicie rola, następnie cel i zaczynają się guidelines. I tutaj już widzimy pierwszą hierarchię. Wprowadziłem TextStyle Guidelines, czyli osobne reguły dla stylu tekstu, co w naszym przypadku generowania treści bardzo będzie ważne, oraz Content Guidelines, czyli tutaj już reguły odnośnie samego contentu. Jak widzicie, Guidelines ma H1, a natomiast pod jego hierarchicznie, pod zbiory mają H2, możemy tak to nazwać, tymi podkami. Jest też takie pojęcie jak Critical albo Important. Ja to zazwyczaj dodaję jeszcze w dwóch gwiazdkach, czyli w pogrubieniu. To jest specjalna reguła. Jeżeli się długo męczycie z jakimś promptem i macie regułę, ale model jej nie wykonuje, to możecie podkreślić, że ta reguła jest dla Was ważna. I przechodzimy już do examples. Tu ta hierarchia, o której mówiłem wcześniej, jest bardzo ważna. I możemy jeszcze wprowadzić pojęcia pozytywnych exempli lub negatywnych. W ogóle examples w niektórych źródłach spotkacie jako few shots tak zwane. To są przykłady dobrego użycia i przykłady złego użycia. Też warto to stosować. Oczywiście im więcej tekstów wprowadzicie w każdym promcie, tym więcej tokenów będzie zadane i tym droższa będzie produkcja danej odpowiedzi, bo już może nie samego tekstu. I na koniec response rules. Pamiętacie jeszcze jedną rzecz, że model językowy czyta prompt od góry do dołu. Czyli oczywiście na górze umieściłem najważniejsze rzeczy, czyli jego rolę i cel. Na dole mniej ważne, bo to jest tak naprawdę zestaw twardych reguł, czyli response rules, Czyli na przykład zwróć tylko finalny content, tak jak mówiłem, często zwraca jakieś komentarze, nie dodawa jakichś wyjaśnień i to nam już bardzo mocno czyści tą odpowiedź. A czysta odpowiedź w naszym przepływie w tych klockach jest bardzo ważna, dlatego że jeżeli na odpłucie dostaniemy jakieś zakłócenia i damy to do inputu kolejnego kroku, nasz pijak się przerwie, a ostateczny content, który generujemy może nie być taki, jakiego oczekiwaliśmy. Teraz porozmawiamy sobie trochę o parametrach modeli. Ja je tylko tutaj wymienię, ale przejdziemy do praktyki. W modelach językowych to jest temperatura, to P, max tokens, frequency penalty i present penalty, o których już dzisiaj nie będę mówił, bo są ukryte, zniknęły, tak samo jak zniknął playground tak zwany w platformie. Temperatura służy do tego, jak bardzo kreatywny jest model. Im wyższa temperatura, średnio ustawiona jest na dzień dobry na 1 i może do dwóch przybierać w skali. Natomiast do degenerowania tekstów używamy 0,7 mniej więcej. To jest jak bardzo model jest kreatywny. Jeżeli temperatura jest na 0, to model tej kreatywności jest praktycznie pozbawiony. I do czego to się używa? Do klasyfikacji, do ekstrakcji treści. Tam, gdzie w ogóle nie oczekujemy kreatywności, tylko jasnego zadania. Top P to jest zakres, widzieliście pewnie na filmiku, czy na mojej prezentacji, że jeżeli model produkuje tekst, to on dobiera token, czy tam słowo, z puli słów, które ma predysponowane. Więc to P, zmniejszając jego zakres, też ma do jednego. Zmniejszamy ilość zasobów tych słów, więc model jest bardziej przewidywalny i używa bardziej oczywistych słów. Jeżeli chodzi o modele reasoningowe, to sami zobaczycie za chwilę. Reasoning effort, czyli to jest poziom, level rozumowania tego modelu. Im wyższy level wiadomo, że te rozumowanie będzie wyższe, będzie zabierać nam więcej zasobów oczywiście i będzie dłużej trwało. I verbal city to jest skomplikowanie złożoność jego odpowiedzi. Jeżeli jest wysokie, to też ta odpowiedź będzie dłuższa. Jak to wygląda w praktyce? Część z Was zapewne nigdy nie korzystała z platformy OpenAI i na platformie OpenAI swojego czasu było coś takiego jak playground. Playground, czyli nasz plac zabaw, możemy tak powiedzieć. I Playground w tej chwili zniknął, pojawił się zwykły czat, ale dalej to jest to samo, może trochę w innej wersji. To nie jest czat. To nie jest ten czat, który wy znacie jako czat GPT, czy jakikolwiek inny czat. To jest miejsce, w którym możecie próbować wasze prompty, które będziecie później wysyłać do API. To jest właśnie wasze miejsce zabaw. Czyli zanim będziemy pracować gdziekolwiek indziej, czy w Colabie, czy w Pythonie, czy będziemy układać prąty, to jest świetne miejsce do testowania Waszych prąptów. Po pierwsze, możecie tu zapisywać Wasze prąty. Po drugie, jest funkcja optymalizacji tych prąptów, ale ja jej nie polecam, bo model sam językowy zmienia prąty, dostosowuje je niby do swoich oczekiwań, ale często to nie jest to, na co liczymy. Ale my jesteśmy w parametrach. Wróćmy do parametrów. Najpierw musimy sobie zmienić model na typowo językowy. Ostatni model językowy w platformie OpenAI, który ja pamiętam, to jest GPT-4 i 1. Ikonka ustawień i sami widzicie, tak jak mówiłem, temperatura jest ustawiona na 1.0. Ilość tokenów, czyli maksymalna ilość tokenów, która będzie przeznaczona na to zapytanie i top. Pobawmy się trochę temperaturą. Ja na potrzeby teraz tego ćwiczenia nie będę wprowadzał całej struktury promptu, bo nie jest nam to potrzebne, ale zrobimy sobie ćwiczenie na zasadzie stworzenia krótkiego tekstu OSEO. Ustawimy temperaturę, najpierw dla porównania na taką średnią, powiedzmy sobie 0,3. Prawdopodobnie pomiędzy temperaturami 0,3 0,07 przy tak krótkim tekście nie zauważycie różnicy. Generujemy. ale to jest podpowiedź jeżeli chcielibyście na to samo zapytanie uzyskać zupełnie inne teksty wysyłając to do API modelu to możecie za każdym razem dodać losową temperaturę zmienimy sobie temperaturę na powiedzmy minimalną i zobaczymy jak ten tekst będzie wyglądał teraz zwiększymy temperaturę powiedzmy sobie do jednego, jeden to już jest ryzyko. Jeżeli będziecie używać temperaturę równą jeden przy generowaniu długich tekstów, to zauważycie, że bardzo często, zwłaszcza już przy końcowych fragmentach, powiedzmy sobie po 200-300 słowach nawet, model zaczyna się gubić. I to jest bardzo ryzykowne, nie robimy tego. Tutaj zostawimy, żeby porównać sobie, jak będzie generowany ten tekst. Jak widzicie, może ciężko jest zauważyć, o musiecie wierzyć mi na słowo, ten tekst jest zupełnie inny. I do czego to służy, do czego możecie to wykorzystywać? Tak samo manipulując trochę to P, czyli tym zasobem słów, możecie na to samo zapytanie dostać zupełnie inny odpowiedzi. I to jest fajne, jeżeli realizujecie ten sam tekst dla pięciu klientów. Możecie w ten sposób, używając API, a o API jeszcze porozmawiam sobie w następnym filmie, wszystkiego was nauczę, możecie generować różne teksty. I teraz jeszcze jedną rzecz pokażę Wam, jeżeli chcecie, żeby model był zbyt kreatywny. Ja nie wiem, dlaczego OpenAI pozwala ustawienie temperatury na 2.0, ale zobaczcie, co się stanie. Po paru zdaniach, już tutaj to widać, cyrlica i inne slaczki. Model zaczyna być zbyt kreatywny i te tokeny już są dobierane totalnie losowo nawet z innych zasobów językowych. I robione bardzo długo. Jeszcze chyba to mieli, zatrzymajmy. Także widzicie, poznaliście już w temperaturę przy modelach językowych. Będziemy używać różnych zapytań, bo w tej chwili modele rezonningowe mają inne zapytanie do API, a inne modele językowe. Natomiast nie wszystkie zadania, które będziemy wykonywać, a właściwie mała ich część, wymaga modeli rezonningowych i o tym się dowiecie już w odpowiednim momencie. A teraz przyjrzyjmy się jeszcze na chwilę parametrom modeli rezonningowych. Mówimy o modelu GPT-5 i 2 w tej chwili. Jak wyglądają te parametry? To jest te, o których wspomniałem. Rezoning effort i verbal city. Jeżeli poziom jego rozumowania ustawimy na bardzo wysoki xhigh, bo doszedł ostatnio taki parametr, a złożoność odpowiedzi na high, to dostaniemy maksymalnie złożoną odpowiedź. Defaultowo te wartości są ustawione na auto, czyli model dobiera sobie tyle taki poziom Resonting Effort i taki poziom Verbacity, jaki uzna za wystarczający do zrealizowania danego zadania. To jest przydatne w momencie w naszym wypadku, żebyśmy chcieli generować dużo lepsze treści, dużo bardziej jakościowe, aczkolwiek nie będziemy pisać modelami wyzorieningowymi treści, a mówimy na przykład o outline, żebyśmy chcieli, żeby ten outline był naprawdę kompleksowy i dokładny. w niektórych przypadkach, w niektórych niszach warto na to postawić, to wtedy będziemy to ustawiać. Jeżeli nie, to zostawimy na auto, a na auto to znaczy, że nie będziemy tutaj parametrów definiować tak naprawdę. Zobaczmy, jak wygląda odpowiedź modelu przy takich ustawieniach. Tak jak mówiłem, on już tutaj trochę dłużej myśli, model językowy praktycznie zaczyna nam tą odpowiedź już generować. Jak widzicie, odpowiedź jest złożona, Wcześniej dostawaliśmy krótki akapit 1, to już mamy trzy sekcje, dużo więcej tekstu i nie będziemy się zagłamić w czytaniu, ale mu zaufacie mi, że ten tekst jest dużo, dużo lepszy. Teraz zobaczymy to samo, zmniejszając wartości. I mamy porównanie. Dziś wszystko się sprawdza. Waszym zadaniem domowym jest zarejestrować się na platformie open.com, wejść sobie w ten czat, pobawić się promptami, pogenerować krótkie teksty z modelu językowym, Pamiętajcie GPT-4.1, 4.0 i w modelu rezonningowym. Chcę, żebyście się zaznajomili dobrze z tymi modelami, ale przede wszystkim z pracą z API. Bo to jest tak naprawdę nakładka na API, nasz interfejs, to nie jest czat i to jest Wasze zadanie domowe, które będzie potrzebne. Przejście tego będzie potrzebne nam w kolejnych etapach. 

</details>

---

<div class="lesson-completion-bottom" data-lesson-id="ai-content-expert/blok-1/lekcja-4"></div>

<div id="sensai-comments"></div>


---

# 1.5 API - z czym to się je?

<div class="lesson-meta">
  <div class="lesson-mentor">
    <img class="lesson-mentor__avatar" src="https://framerusercontent.com/images/t2GGO1yled5Z8wSFTTJMQHHzd4.png?scale-down-to=512&width=2976&height=2949" alt="Maciej Chmurkowski" />
    <span class="lesson-mentor__info">
      <span class="lesson-mentor__label">Mentor</span>
      <span class="lesson-mentor__name-text">Maciej Chmurkowski</span>
    </span>
  </div>
  <div class="lesson-rating" data-lesson-id="ai-content-expert/blok-1/lekcja-5"></div>
  <div class="lesson-completion" data-lesson-id="ai-content-expert/blok-1/lekcja-5"></div>
</div>

<div style="position:relative;padding-top:56.25%;"><iframe src="https://player.mediadelivery.net/embed/565073/764b4431-7a5d-4781-8bf8-988850462566?autoplay=false&loop=false&muted=false&preload=true&responsive=true" loading="lazy" style="border:0;position:absolute;top:0;height:100%;width:100%;" allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;" allowfullscreen="true"></iframe></div>

<br />



## 🎯 Cel lekcji

Praktyczne wprowadzenie do korzystania z API - od konfiguracji po pierwsze zapytania.

---

## 📒 Notatka z lekcji

### Czym jest i do czego służy API?

W tej lekcji wchodzimy w świat techniczny, który jest fundamentem automatycznego generowania treści.

**Definicja:** API (*Application Programming Interface*) to sposób komunikacji pomiędzy dwoma systemami. Nie posiada interfejsu graficznego (jak typowa strona www) – jest to "surowy" protokół wymiany danych.

**Zasada działania:** My (lub nasz program) wysyłamy zapytanie (*request/prompt*), a drugi system zwraca nam odpowiedź (*response*), którą możemy przetworzyć i zapisać.

W naszym kursie API posłuży do budowania "klocków" systemu, np. do pobierania wyników wyszukiwania, analizy treści czy generowania tekstu.

### Kluczowe elementy pracy z API

Zanim zaczniesz pisać kod, musisz zrozumieć cztery podstawowe pojęcia, które pojawią się przy każdej usłudze.

1.  **Endpoint (Punkt końcowy)**
    To konkretny adres internetowy, pod którym dostępna jest dana usługa. Jeden dostawca (np. NodesHub) może mieć wiele endpointów: jeden do pobierania listy URL z Google, inny do generowania grafu wiedzy.

2.  **Klucz API (API Key)**
    To twoje hasło i identyfikator w jednym. Musisz go wygenerować po rejestracji w danej usłudze.
    **Ważne:** Klucz często wyświetlany jest tylko raz (w momencie generowania). Musisz go od razu bezpiecznie zapisać. Jeśli go zgubisz, będziesz musiał generować nowy.

3.  **Parametry**
    To filtry i ustawienia, które dołączasz do zapytania, aby sprecyzować, czego potrzebujesz.
    *Przykład:* Wysyłając zapytanie o wyniki wyszukiwania dla hasła "Agencja SEO", musisz dodać parametr języka (np. `pl`), aby otrzymać wyniki z polskiego Google, a nie amerykańskiego.

4.  **Odpowiedź (Response / JSON)**
    Format, w jakim API zwraca dane. Zazwyczaj jest to **JSON** – ustrukturyzowana forma tekstowa, przypominająca tabele lub listy. Choć dla człowieka może wyglądać skomplikowanie, dla komputera jest idealna do dalszego przetwarzania.

### Bezpieczeństwo i koszty (Ważne!)

API to usługi płatne, rozliczane zazwyczaj za zużycie (kredyty). Błędy w kodzie mogą być kosztowne.

*   **Ryzyko pętli:** Źle napisany skrypt (np. w Pythonie) może wpaść w pętlę i wysyłać zapytania w nieskończoność, "zjadając" Twoje środki w kilka minut.
*   **Zabezpieczenia (Limity):** Zawsze ustawiaj limity w panelu użytkownika danej platformy:
    *   **Soft Limit:** Otrzymasz powiadomienie mailowe po przekroczeniu pewnej kwoty.
    *   **Hard Limit:** API przestanie działać po przekroczeniu ustalonego budżetu (np. 10$). To najbezpieczniejsza opcja.

### Jak pracować z dokumentacją? (Vibe Coding)

Każde API posiada dokumentację techniczną ("Docsy"), która opisuje dostępne endpointy i wymagane parametry. Może ona być trudna dla osób nietechnicznych, ale mamy na to sposób.

**Trik z ChatGPT:** Nie musisz umieć czytać skomplikowanej dokumentacji.

1.  Skopiuj adres URL dokumentacji (np. [NodesHub](https://nodeshub.io) lub [Genuino](https://genuino.ai)).
2.  Wklej go do ChatGPT.
3.  Poproś o wyjaśnienie, jak uzyskać konkretną daną (np. *"Jak za pomocą tego API uzyskać listę URL z SERP?"*).

Model AI przeanalizuje dokumentację za Ciebie, wyjaśni parametry, a nawet napisze gotowy skrypt w Pythonie (w tym kursie stosujemy podejście "Vibe Coding", gdzie AI pomaga nam pisać kod).

### Testowanie: Playground

Zanim zaczniesz pisać skrypty, warto przetestować API w bezpiecznym środowisku zwanym **Playground** (plac zabaw). Większość dostawców (NodesHub, OpenAI) udostępnia taki panel.

**Do czego służy Playground?** Pozwala "wyklikać" zapytanie: wpisać parametry, wybrać endpoint i zobaczyć, czy otrzymujesz poprawną odpowiedź (JSON), bez konieczności pisania ani jednej linijki kodu. To najlepszy sposób na zrozumienie, jak działa dana usługa.

### Przykładowe narzędzia w kursie

Będziemy korzystać z kilku konkretnych API:

*   **[NodesHub](https://nodeshub.io)** – Platforma oferująca usługi związane z danymi z wyszukiwarek. Użyjemy jej endpointu `v1 search` do pobrania listy adresów URL na podstawie słowa kluczowego (co będzie naszym wsadem do generowania treści).
*   **[Genuino](https://genuino.ai)** – Narzędzie do detekcji treści AI oraz analizy. W dokumentacji znajdziesz parametry takie jak `text` (wymagany) czy `include guidelines` (opcjonalny).

### Następne kroki (Zadanie domowe)

Aby przygotować się do części praktycznej (codingu):

1.  Zarejestruj się na platformach: **NodesHub** oraz **Genuino**.
2.  Wygeneruj **Klucze API** w obu serwisach i zapisz je w bezpiecznym pliku tekstowym.
3.  Odszukaj sekcję **Playground** na NodesHubie.
4.  Wykonaj testowe zapytanie: wpisz słowo kluczowe (np. "Agencja SEO"), ustaw język na polski i zobacz, jak wygląda zwrócony wynik (JSON).

---

<details>
<summary>📝 Transkrypcja wideo</summary>

W tym odcinku przyjrzymy się i zapoznamy się dokładnie co to jest API, bo być może część z Was nigdy nie korzystała z API czy LLMów, czy narzędzi zewnętrznych i być może to pojęcie jest dla Was obcy. Do czego służy API? API służy do komunikacji, czyli tak naprawdę do komunikacji pomiędzy jednym systemem, a drugim. W API składamy zapytanie, albo wysyłamy prompt i dostajemy odpowiedź, możemy to przetworzyć i zapisać. Jest to bardzo szybki protokół komunikacji, nie wymaga żadnego interfejsu. Interfejs tworzymy my. API jest tak naprawdę też techniką, która jest wykorzystywana w budowaniu aplikacji i my będziemy to wykorzystywać również w tych naszych klockach, w budowaniu naszego systemu do generowania treści. Co musicie wiedzieć o API? Takie główne pojęcie. Każde API ma dokumentację, z którą należy się zapoznać. W tej dokumentacji znajdziecie endpoint. Endpointy to są usługi, które oferuje API. i jedna platforma, jeden provider danych usług może tych usług mieć wiele. Może to być na przykład w przypadku Nodeshuba otrzymywanie odpowiedzi ION, czyli overviews na podstawie keyworda i języka, czy może to być lista URL z SERP-ów. Jak uruchomić API? Jedną rzecz, którą potrzebujecie na samym początku, to jest klucz, bo musicie się tak naprawdę zalogować do tego API, zweryfikować. Więc potrzebny Wam jest klucz API. Zazwyczaj klucz API dostajecie na samym początku. Większość platform daje możliwość wypróbowania tego API i ten klucz musicie zapisać sobie gdzieś. Często jest tak, że widzicie go tylko raz, więc jeżeli go nie zapiszecie, to później nie macie możliwości odtworzyć i trzeba będzie zakładać nowy. Każdy endpoint posiada parametry, Czyli jeżeli wysyłacie zapytanie do takiego API, możecie dodatkowo parametryzować to zapytanie. Czyli na przykład, jeżeli wysyłamy zapytanie o listę URL serpa i jest tam słowo kluczowe, dodatkowym parametrem, zapewne wymaganym jest język. Dlatego, żebyśmy mogli odczytać listę URL dla danego Google'a, dla danej lokalizacji z Google'a. Uwaga! API to też są wpadki, które ja też zaliczyłem nieraz. jeżeli nie ustawicie nie ustawicie pewnych limitów to może się okazać, że zapętlicie się w niektórych wykonaniach, zwłaszcza w Pythonie i będziecie zjadać kredyty a to są już tak naprawdę duże koszta więc najpierw upewnijcie się że nie będą Wam naliczać tego w nieskończoność w niektórych platformach możecie ustawić soft limit i hard limit soft limit to dostaniecie powiadomienie a przy hard limicie po prostu API przestanie działać. Tak jest również w OpenAI. Jak to wygląda w praktyce? Pokażę Wam teraz dwie usługi. Jedną już widzieliście. Tak naprawdę jedną platformę OpenAI już widzieliście. Tam też to, z czym się bawiliśmy w poprzednim filmiku, to były zapytania do API LLMów. Przyjrzyjmy się NodeShabowi. Jest to taka platforma, która ma szereg usług. jeżeli chodzi o same endpointy to znajdziecie tu m.in. odpowiedź overviews, people also ask, knowledge graph. My będziemy korzystać z Notes Hub'a do tego, żeby na podstawie naszego słowa kluczowego, na podstawie którego też będziemy tworzyć treści, żeby pobrać sobie listę URL-i, następnie z tych URL-i pobrać treści. Jeżeli sobie przyjrzecie czy Notes Hub'a czy zaraz jeszcze do Genuine'u dojdziemy, zobaczycie, że zazwyczaj jest dokumentacja, doksy, o której mówiłem, lepiej lub gorzej opisana, ale bardzo dobra dokumentacja, to jest też bardzo fajny trik, który możecie wykorzystać, jeżeli nie potraficie się poruszać w obszarach dokumentacji endpointów, wcale nie musicie. Bierzemy sobie dokumentację, czy adres danego, danej platformy, wrzajmy do czatu GPT, zapytajmy się, czy zapoznał się, czy zna dokumentację Nodeshuba. dobra mogę tu wkleić adres oczywiście chat GPT łączy się w tej chwili z siecią i już macie spis tak naprawdę wszystkich endpointów i chat GPT w tej chwili na podstawie też dokumentacji pomoże wam i zarejestrować uzyskać klucz API i też stworzyć pierwsze zapytania do tego API. Jak widzicie, to co wszystkim mówiłem, już ten czat wypisuję. Możemy się do tego zapytać, w jaki sposób mogę uzyskać listę URL SERP-ów. W jaki sposób za pomocą tego API mogę uzyskać listę URL SERP-ów. najprościej, robisz jedno wywołanie do endpointu v1 search, czyli to jest tak naprawdę adres z JSON wyciągasz pola URL organizm, przykład kurla czyli to jest ten adres, pod który będziemy wysyłać zapytanie czy tutaj ma parametry, czyli pizza Warszawa i dostaję odpowiedź, w API ważna jest również odpowiedź zazwyczaj ta odpowiedź będzie w tablicach, tablica to jest JSON To też pojęcie pewnie nieznane dla wielu z Was. Ja zakładam, że też sporo osób związanych z copywritingiem będzie robić nasz kurs. Czasem to jest tablica ustrukturyzowana, dzięki której te odpowiedzi możemy później w bardzo łatwy sposób przetworzyć. W dokumentacji znajdziecie dokładnie jak wygląda ta odpowiedź i ta dokumentacja też służy do tego, żebyśmy w vibe codingu mogli te dane przetworzyć, żeby nasz model, który będzie nam pomagał stworzyć skrypt, stworzył odpowiedni kąt. Także tutaj nie macie czego bać. Jak widzicie, nie jest to trudne. Tutaj mamy już prosty skrypt do Pythona. W następnej lekcji sobie to poćwiczymy. Chciałbym jeszcze Wam zwrócić uwagę, jak to wygląda, jeżeli chodzi na przykład o Genuino, który też ma swoją dokumentację. Najczęściej ta dokumentacja wygląda w ten sposób, że po lewej stronie mamy nasze endpointy, detektor i tutaj analiza. I jak zobaczycie sobie w dokumentacji, to jest to, o czym wspomniałem wcześniej. Jeżeli mamy parametr tekst, który jest wymagany, no to musicie go wysłać, inaczej dostanie się pewnie błędną odpowiedź z tego API. No i są kolejne parametry, na przykład include guidelines. Jeżeli oznaczony zostanie na trutu, to dostanie pewnie ta odpowiedź wzbogacone o dodatkowe guidelines. Tak to wygląda. Zapraszam do testowania. Porejestrujcie się. Genuino macie za free sprawdzenie detekstów po angielsku, ale to nie to chodzi. Zarejestrujcie się, uzyskajcie klucz API, zapiszcie to sobie, zobaczcie. Zaznajomcie się po prostu, jak to wygląda. Możecie też wykorzystać jakiekolwiek innej API. Ja mówię o tych, które są najbliższe, miejsce, z którego ja pracuję. Zapraszam. W filmiku dotyczącym platformy OpenAI, gdzie testowaliśmy parametry i proste zapytania do API LM-ów, też mówiłem o tym, że nie ma już tak zwanego playgroundu, czyli placu zabaw, ale większość platform i większość platform providerów dostarczających API takie Wam playground udostępni. Chciałbym teraz pokazać, jak to wygląda w praktyce. To pozwoli Wam dużo bardziej i dużo łatwiej wyobrazić sobie, jak działa API, niż praca tak naprawdę na dokumentacji. Zobaczcie, w tej chwili to jest zapytanie do endpointa, SERP daty, czyli to jeszcze na Notchubie jesteśmy, który też udostępnia usługi SERP data. Search, czyli będziemy wyszukiwać, będziemy otrzymywać wyniki wyszukiwania dla danego zapytania. Zmienimy sobie tylko zapytanie. powiedzmy sobie agencja SEO. Zmienimy wyniki na polski. I taki playground to jest interfejs tego co się dzieje w tle, czyli tak naprawdę jak działa nasza API. Uruchamiamy. Oczywiście to wszystkie wymaga rozgłop. I w tej chwili wysyłane jest zapytanie o wyniki agencji SEO w Polsce i dostajemy odpowiedź i ona ma ustrukturyzowane w JSON-ie dane. Jak widzicie dostaliśmy tu odpowiedź i tu, jeżeli byśmy to przeanalizowali, to jest JSON, jest bardzo złożony po kolei mamy jakie strony znajdują się na którym miejscu będziemy to przetwarzać oczywiście w następnych materiałach powiedzcie sobie na odsuba tak samo potestujcie, zobaczcie ja wiadomo, że na filmiku jest bardzo trudno to pokazać ja być może dla mnie to jest już zbyt oczywiste ale warto się tym pobawić 

</details>

---

<div class="lesson-completion-bottom" data-lesson-id="ai-content-expert/blok-1/lekcja-5"></div>

<div id="sensai-comments"></div>


---

# 1.6 Python i Google Colab

<div class="lesson-meta">
  <div class="lesson-mentor">
    <img class="lesson-mentor__avatar" src="https://framerusercontent.com/images/t2GGO1yled5Z8wSFTTJMQHHzd4.png?scale-down-to=512&width=2976&height=2949" alt="Maciej Chmurkowski" />
    <span class="lesson-mentor__info">
      <span class="lesson-mentor__label">Mentor</span>
      <span class="lesson-mentor__name-text">Maciej Chmurkowski</span>
    </span>
  </div>
  <div class="lesson-rating" data-lesson-id="ai-content-expert/blok-1/lekcja-6"></div>
  <div class="lesson-completion" data-lesson-id="ai-content-expert/blok-1/lekcja-6"></div>
</div>

<div style="position:relative;padding-top:56.25%;"><iframe src="https://player.mediadelivery.net/embed/565073/4fbfb264-897e-4809-ba80-ddcebbdfee0d?autoplay=false&loop=false&muted=false&preload=true&responsive=true" loading="lazy" style="border:0;position:absolute;top:0;height:100%;width:100%;" allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;" allowfullscreen="true"></iframe></div>

<br />



---

## 🎯 Cel lekcji

Konfiguracja Google Colab jako środowiska do pracy z kodem Python i API modeli językowych.

---

## 📒 Notatka z lekcji

### Google Colab w generowaniu treści: Podstawy i konfiguracja

Zadania związane z zaawansowanym generowaniem treści wymagają podejścia programistycznego. Najlepszym narzędziem do tego celu jest Python, ze względu na szybkość działania, łatwą komunikację z API oraz ogromną liczbę gotowych bibliotek.

Jako środowisko pracy wykorzystujemy **Google Colab**. Pozwala ono na uruchamianie kodu w chmurze (bez instalacji na dysku), budowanie sekwencyjnych procesów (pipeline'ów) oraz pełną kontrolę nad promptami i wynikami, której nie zapewniają zwykłe czaty z AI.

### Jak zacząć pracę w Google Colab

#### 1. Utworzenie i organizacja notatnika

**Logowanie:** Wystarczy posiadać konto Google.

**Nowy notatnik:** Po utworzeniu pliku od razu nadaj mu nazwę (np. "Start"), aby łatwo go później odnaleźć w bibliotece.

**Historia zmian:** Każdy notatnik zapisuje historię. Jeśli kod przestanie działać po wielu edycjach, możesz przywrócić wcześniejszą wersję.

#### 2. Struktura notatnika (Sekcje i Komórki)

Colab umożliwia łączenie kodu z opisami, co porządkuje pracę.

**Sekcje tekstowe (Markdown):** Służą do tworzenia nagłówków (np. `# Tytuł`) i opisów. Pozwala to stworzyć czytelny spis treści w menu bocznym.

**Okienka z kodem:** To miejsca, w których wklejasz i uruchamiasz skrypty.

**Zarządzanie:** Sekcje i bloki kodu można dowolnie przesuwać między sobą.

#### 3. Schemat budowy narzędzia (Pipeline)

Każdy notatnik powinien zachować logiczną strukturę, uruchamianą sekwencyjnie (od góry do dołu):

**Instalacja bibliotek:** Pierwszy krok to zainstalowanie narzędzi niezbędnych do komunikacji (np. z OpenAI).

Przykładowa komenda: `pip install openai`

**Konfiguracja:** Miejsce na zdefiniowanie zmiennych, które będą przechowywane w pamięci notatnika i używane w kolejnych krokach.

Tu wpisuje się np. klucze API lub ustawienia języka (np. `lang = "polish"`).

**Właściwy kod (Skrypty):** Tutaj odbywa się generowanie treści. Możesz poprosić AI (np. Claude, ChatGPT) o napisanie kodu (tzw. Vibe Coding), wkleić go i uruchomić przyciskiem Play. Wynik działania (log) pojawi się bezpośrednio pod okienkiem.

### Ważne uwagi i ograniczenia

**Sesja i czas bezczynności:** W darmowej wersji Colaba sesja wygasa po około 30 minutach bezczynności.

**Utrata danych:** Po wygaśnięciu sesji kod zostaje zachowany, ale zainstalowane biblioteki i zmienne z pamięci są usuwane.

**Wznowienie pracy:** Po ponownym połączeniu musisz uruchomić notatnik od początku ("przeklikać" Play), zaczynając od instalacji bibliotek i konfiguracji.

### Co dalej?

Masz przygotowane środowisko startowe. W kolejnych krokach wykorzystasz je do Vibe Codingu, czyli tworzenia bardziej zaawansowanych skryptów przy wsparciu AI, bez konieczności bycia programistą.

---

<details>
<summary>📝 Transkrypcja wideo</summary>

W tej ścieżce specjalistycznej dotyczącej generowania treści niektóre zadania, będziemy cały czas używać pojęcia klocki, będą wymagały użycia podejścia programistycznego i najlepsze efekty daje nam Python. Python dlaczego? Dlatego, że ma bardzo dużo bibliotek, które są instalowane jednym poleceniem w mnieniu oka, po drugie jest bardzo szybki. I też świetnie się komunikuje z API, o czym mówiłem, a API słyszeliście już w poprzednim filmiku. Czym jest notatnik Google Colab? Notatnik Google Colab to jest świetne środowisko, tych notatników też jest wiele na rynku, natomiast dla mnie, być może to jest kwestia przyzwyczajeń, najbardziej przyjazny jest w tej chwili Google Colab. pozwala on przede wszystkim na egzekucję kodu Python bez potrzeby instalowania środowiska po drugie macie możliwość tworzenia wielu notatników, w których macie zapisany swój kod po trzecie możecie odpalać sekwencyjnie po kolei, czyli pamiętacie o czym mówiłem na samym początku, będziemy budować ten wodospad czyli zbudować cały pipeline, to jest środowisko w którym możecie zbudować cały pipeline generowania treści, większy lub mniejszy i tak naprawdę każdy krok tutaj możecie też zapisywać, czyli możemy to zapisać albo Python łączy się poprzez colabę z bazą danych albo możemy zapisować do pliku. Co daje colab w pracy z AI? To jest dla mnie, to jest moim zdaniem pełna kontrola na tworzeniu części, której nie będziecie mieli używając chatu w GPT. Wszystko w jednym miejscu. Możecie też zmieniać prom, bo prom będzie definiowany w każdym skrypcie, więc ten prompt możecie zmieniać od razu, kliknąć i zobaczyć, jaki będziecie mieli wynik, bo on błyskawicznie się połączy z danym endpointem, z danym API i uzyskacie tą odpowiedź. Możecie testować różne wersje. Za pomocą wipek i dyników pewnie będziemy mogli sobie zrobić możliwość przełączania się na przykład pomiędzy różnymi modelami, żeby uzyskać maksymalnie dobra odpowiedź, bo nie wszystkie modele, mimo że jest tutaj wyścig, który trwa, pomiędzy Gemini, Cloudem i Upinajem, to nie wszystkie odpowiedzi będą nadawały się do wszystkich zadań. No i mamy transparentność. Dobrze wiemy, z czego bierze się wynik. Przenieśmy się do Colaba. Wystarczy się zalogować kontem googlowym. Zaczniemy od nowego notatnika. Pierwszą rzeczą, którą warto zrobić, to jest nadać nazwę naszemu notatnikowi, żebyśmy później mogli to wyszukiwać. Ten notatnik będzie zapisany w bibliotece. Słuchajcie, każdy notatnik też ma historię. Jeżeli coś się stanie, a byłem w tym miejscu wiele razy, po dwóch tygodniach, zaszedłem za daleko, rozrosły się te skrypty, ma historię, można przewrócić. Nazwijmy to jest, powiedzmy sobie, startup albo start, czyli nasz startowy może być notatnik, w którym będziemy sobie testować. Jak widzicie, notatnik posiada przede wszystkim rozwijane menu, w którym możecie stwarzać jakby sekcje. I każda sekcja może zawierać wiele okienek. W tych okienkach będzie wykonywany kod pythonowski. Wystarczy dodać sekcję. Tą sekcję nazywacie, to jest markdown oczywiście. jest na przykład, tutaj sobie zrobimy instalacja bibliotek. Zazwyczaj zaczynamy od instalacji bibliotek. Łączymy się z środowiskiem wykonawczym, czyli w tej chwili stwarzamy sobie takie środowisko, które jest naszym serwerem. Jedna uwaga, przy darmowej wersji Colaba, jeżeli jesteście bezczynni przez chyba więcej niż pół godziny, ta sesja wygasa, wszystko jest usuwane. Oczywiście nie usuwa się wasz kod, ale wszystkie zapisane wyniki czy pliki zostaną utracone. Możecie przesuwać te sekcje pomiędzy sobą i one, jak zobaczycie, już od razu pojawiają się w menu. Struktura jest tak samo jak w Macdownie i w nagłówkach, czyli możecie jednym haszem robić H1, dwoma H2 i wtedy zaraz zobaczycie. Można to dodawać też bezpośrednio pod daną sekcją, kod albo tekst, ja dodam jeszcze sobie tekst, tutaj dodamy sobie konfiguracja, dodamy z dwoma haszami i zobaczcie jak już na liście menu to się pojawiało. Pomiędzy sekcjami możecie się przyłączać i pomiędzy nie wciskać, sobie przesuwać również strzałkami bloki kodu, który będzie wykonywany. Instalacja to jest też kod, konfiguracja to jest też kod, więc mamy w ten sposób stworzone, w razie sobie pozamykamy tutaj. Tu jest oczywiście też Gemini, który może nam pomagać tworzyć ten kod w collabu tego Pythona, natomiast ja używam zewnętrznych narzędzi Cloud, a zazwyczaj Opus 4.5 bardzo dobrze mi teraz pomaga. Żeby zaznajomić się i odpalić z tym to środowisko, stworzymy sobie pierwszą instalację i być może bez konfiguracji. Odruchomimy sobie jakiś prosty skrypt. Nie musicie znać Pythona, wystarczy, że porozmawiałem z Cloudem, chociaż nie wiem, bo dzisiaj Cloud miał czekawkę. Twórz mi tosty, krypt Pytonie. Wyświetli cześć wszystkim. To są oczywiście podstawy postaw, będziemy robić dużo bardziej skomplikowane. skomplikowane skrypty. Widzicie. Cloud się zacina, idziemy do czatu. Oczywiście to jest bardzo proste zapytanie. Stworzymy sobie nową sekcję. Nazwiemy ją pierwszy kod. Po tą sekcją dodamy sobie nasz kod. Cześć wszystkim. Uruchamiając Play. Encont się wykonuje. Pod bezpośrednio pod kodem, pod tym okienkiem z naszym kodem macie to, co jest tak zwanym logiem, co wyświetla nam Python. Brawo, jesteście programistami. Żartuję. Co trzeba jeszcze wiedzieć o samym Colabie? On ma dwa sposoby wyświetlania i zapisywania informacji. W sensie pierwszy to jest wyświetlanie bezpośrednio to, co tu zrobiliśmy logiem. I to zazwyczaj warto przy każdych skryptach dopisać, żeby wyświetlił informacje nawet Wasz tekst, czy fragment tekstu, który będziecie generować, ale też jak to w języku programistycznym, możecie zapisać coś do danego pliku. Wrócę jeszcze do tej instalacji bibliotek, bo bym chciał, żebyśmy przeszli bardzo prosto, podstawowe ustawienia w tym kolabie, bo później, że będziemy pracować na przykład na API. Instalacja bibliotek, więc jakbyśmy chcieli zainstalować, Jeśli byśmy się odwołać do czatu GPT, poprzez nie czatu GPT, tylko do platformy OpenAI, czyli do LMA, czyli do na przykład GPT 5.2, poprzez API, to najpierw musimy mieć możliwość, musimy wprowadzić biblioteki, które pomogą nam skomunikować nasze środowisko z OpenAI. Także tutaj też pamiętajcie, że nie będziemy udawać programistów. Potrzebujemy, jakie biblioteki trzeba zainstalować, żeby móc komunikować się przez API z OpenAI w Pythonie. Co wam pokazać, jak to wygląda, że to nie jest nic strasznego. Dzisiaj mamy pecha, bo zazwyczaj ta odpowiedź trwa dużo krócej. to jest bardzo prosty kod. PIP install i dana biblioteka. PIP install openail. Dodamy sobie to do naszego startowego. Uruchamiając ponownie ten kolab, bo on jest zapisany, możecie go udostępniać. Żeby na nowo się połączyć, żeby na nowo uruchomić środowisko, musicie też zainstalować wszystkie biblioteki jeszcze raz. Czyli sekwencyjnie klikamy play. Zobaczcie co on się teraz, co będzie tutaj robił. jest zainstalowany. W tej chwili będziemy mogli włączyć się z OpenAI. Co do konfiguracji. Python, jak każdy język, posiada tak zwane zmienne, w których możecie zapisywać pewne wartości. Na przykład taką zmienną może być lang. I lang na przykład nazywa się polish. zmienna została wczytana do pamięci notatnika i teraz możemy jej używać. Tak samo tutaj będziemy zapisywać API.com. Więc nasza struktura naszych skryptów naszego środowiska, w którym będziemy budować sekwencje zawsze będzie wyglądała tak samo. Będzie komórka instalacyjna, komórka konfiguracyjna w której będziemy na przykład API open.ai wpisywać tutaj. One będą zapamiętane i będziecie mogli używać już w każdym kolejnym skrypcie z danego notatnika. A teraz zapraszam Was na bardziej skomplikowane kodowanie, czyli sekcja Vibe Coding. 

</details>

---

<div class="lesson-completion-bottom" data-lesson-id="ai-content-expert/blok-1/lekcja-6"></div>

<div id="sensai-comments"></div>


---

# 1.7 Vibe Coding - nie jesteś programistą

<div class="lesson-meta">
  <div class="lesson-mentor">
    <img class="lesson-mentor__avatar" src="https://framerusercontent.com/images/t2GGO1yled5Z8wSFTTJMQHHzd4.png?scale-down-to=512&width=2976&height=2949" alt="Maciej Chmurkowski" />
    <span class="lesson-mentor__info">
      <span class="lesson-mentor__label">Mentor</span>
      <span class="lesson-mentor__name-text">Maciej Chmurkowski</span>
    </span>
  </div>
  <div class="lesson-rating" data-lesson-id="ai-content-expert/blok-1/lekcja-7"></div>
  <div class="lesson-completion" data-lesson-id="ai-content-expert/blok-1/lekcja-7"></div>
</div>

<div style="position:relative;padding-top:56.25%;"><iframe src="https://player.mediadelivery.net/embed/565073/9ee1e2f6-16ec-4c4e-97ac-20f8cbc88c52?autoplay=false&loop=false&muted=false&preload=true&responsive=true" loading="lazy" style="border:0;position:absolute;top:0;height:100%;width:100%;" allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;" allowfullscreen="true"></iframe></div>

<br />



---

## 🎯 Cel lekcji

Poznanie koncepcji Vibe Coding - tworzenia kodu z pomocą LLM bez głębokiej wiedzy programistycznej.

---

## 📒 Notatka z lekcji

Ta lekcja skupia się na praktycznym zastosowaniu Vibe Codingu. Jest to metoda, w której nie piszemy kodu ręcznie, lecz wykorzystujemy czaty AI (takie jak ChatGPT czy Claude) do generowania skryptów w Pythonie. Skrypty te służą do budowania procesów (pipeline'ów) automatyzujących generowanie treści lub pobieranie danych.

Celem jest stworzenie narzędzi, które komunikują się z API różnych dostawców, wykonują zadania i zapisują wyniki, dając pełną kontrolę nad procesem.

### Zadanie 1: Generowanie treści przez API OpenAI

Pierwszym ćwiczeniem jest stworzenie skryptu, który łączy się z modelem językowym (LLM) i zapisuje wygenerowaną odpowiedź do pliku.

#### 1. Przygotowanie środowiska w Google Colab

Zacznij od instalacji niezbędnej biblioteki w notatniku.

Komenda: `pip install openai`

Uruchom komórkę, aby zainstalować pakiet.

#### 2. Pozyskanie klucza API

Aby połączyć się z OpenAI, potrzebujesz klucza dostępu.

Przejdź na platformę OpenAI do sekcji API Keys.

Utwórz nowy klucz (Create new secret key).

**Ważne:** Nadaj kluczowi nazwę (np. "Sensai") i przypisz go do projektu. Pozwala to kontrolować zużycie tokenów i koszty.

Skopiuj klucz natychmiast – jest widoczny tylko raz. Zapisz go w bezpiecznym miejscu.

#### 3. Konfiguracja w Colab

Wprowadź klucz do zmiennej w notatniku (sekcja konfiguracyjna), aby skrypty mogły z niego korzystać.

#### 4. Generowanie kodu (Vibe Coding)

Udaj się do ChatuGPT (lub Claude) i wpisz prompt instruujący AI, co ma zrobić.

**Przykład promptu:** "Napisz skrypt w Pythonie, który wyśle zapytanie do API LLM (OpenAI) i zapisze odpowiedź do pliku. Środowisko: Google Colab. Klucz jest zapisany w zmiennej."

Skopiuj otrzymany kod do nowej sekcji w Colabie (np. "Zapytanie do LLM") i uruchom go.

#### 5. Weryfikacja wyników

Po wykonaniu kodu:

Sprawdź log pod komórką kodu (powinien wyświetlić komunikat o sukcesie lub treść).

Otwórz ikonę folderu po lewej stronie w Colabie. Znajdziesz tam wygenerowany plik (np. `seo_tekst.txt`).

**Uwaga:** Pliki w Colabie są tymczasowe. Po rozłączeniu sesji znikają (skrypty zostają, pliki są usuwane).

**Ulepszenie:** Warto poprosić AI o zmodyfikowanie kodu tak, aby treść promptu (tego wysyłanego do OpenAI) była osobną zmienną. Ułatwia to późniejszą edycję zapytań bez konieczności ingerencji w kod Pythona.

### Zadanie 2: Pobieranie danych SEO (DataforSEO)

Drugim zadaniem jest pobranie listy adresów URL z wyników wyszukiwania (SERP) dla danego słowa kluczowego. Dane te posłużą w przyszłości do dalszej obróbki treści.

#### 1. Wybór narzędzia

W lekcji wykorzystano DataforSEO – popularnego dostawcę danych SERP (wymaga rejestracji i doładowania konta).

#### 2. Generowanie kodu z dokumentacją

Modele AI radzą sobie najlepiej, gdy mają kontekst.

Skopiuj link do dokumentacji API DataforSEO.

Wpisz prompt w ChacieGPT: "Zapoznaj się z dokumentacją API [link]. Zbuduj prosty skrypt Python, który na dane słowo kluczowe i dla danego języka pobierze listę URL z top 10 SERP Google. Wyświetli i zapisze do pliku."

#### 3. Autoryzacja

W przeciwieństwie do OpenAI, DataforSEO (w omawianym przykładzie) może wymagać loginu i hasła zamiast klucza API.

Uzupełnij dane autoryzacyjne w wygenerowanym skrypcie.

#### 4. Uruchomienie i wynik

Wklej kod do nowej sekcji w Colabie (np. `serp.urls`).

Wpisz słowo kluczowe (np. "jak zrobić dobrą pizzę").

Uruchom skrypt.

Wynikiem będzie lista URLi (np. top 10 wyników organicznych) zapisana w pliku `.txt` oraz wyświetlona w logu.

### Podsumowanie kluczowych zasad Vibe Codingu

**Iteracyjność:** Kod wygenerowany przez AI może nie działać za pierwszym razem. Należy czytać błędy i prosić czat o poprawki.

**Dostarczanie kontekstu:** Im więcej informacji podasz w prompcie (nazwa środowiska, nazwy zmiennych, link do dokumentacji), tym lepszy kod otrzymasz.

**Bezpieczeństwo danych:** Pamiętaj, że pliki generowane w Colabie znikają po zakończeniu sesji – warto zadbać o mechanizm ich trwałego zapisu (np. na Google Drive), jeśli są istotne.

---

<details>
<summary>📝 Transkrypcja wideo</summary>

Witam w kolejnej lekcji. W poprzedniej zapoznaliśmy się z Colabem, ze środowiskiem, które pomoże nam komunikować się z API i RLM-ów i nie tylko. Ta sekcja poświęcona jest vibe codingowi, aczkolwiek nie będę bardzo długo rozwodził się nad tym, czym jest vibe coding. Widzieliście, już to robiliśmy w trochę poprzednim filmie. Będziemy za pomocą czatów, czatu GPT czy Clouda generować proste i może bardziej skomplikowane skrypty pythonowskie, które pomogą nam w pracy w celu, który chcemy osiągnąć, czyli w generowaniu naszego kontentu, bądź jakby poukładania sobie naszych procesów z kląsku. Stworzyłem specjalnie, to macie też w pliku dotyczącym tej lekcji, stworzyłem dwa zadania, chciałbym, żebyście te zadania sobie zrobili sami. Ja zrobię je razem z wami, zaczynając zupełnie od zera, popełnię wszystkie błędy, które trzeba popełnić, po to, żebyście ich albo wy nie musieli, albo zobaczyli, że webcoding ma swoje prawa i tworzenie takich skryptów też ma swoje prawa i nie zawsze wszystko będzie działało. Nie chcę wam wklejać gotowych rozwiązań, gotowych skryptów, bo będzie to się miało z celem. Mówiliśmy wcześniej o API, mówiliśmy o odpytywaniach, modeli językowych. Teraz nasze zadanie brzmi, napisz skrypt w Pythonie, który wyślę zapytanie do API-LM. Wybierzcie sobie który. Myślę, że my zaczniemy od OpenAI-a i zapiszę odpowiedź do pliku. Przenosimy się do naszego kolaba, który już mieliśmy stworzony w poprzednim filmiku. Zaczniemy od instalacji bibliotek. pip install openAI, bo biblioteka OpenAI będzie nam potrzebna, żebyśmy mogli się łączyć z ich API. Później mamy sobie konfigurację. Czego teraz potrzebujemy? Tak zgadliście. Potrzebujemy klucza. Ten klucz też, tak jak wcześniej mówiłem w filmiku dotyczącym API, wygenerujecie bądź pobierzecie z platformy. Także przenosimy się na platformę OpenAI. Wchodzimy do sekcji API keys. Zazwyczaj taka sekcja istnieje u każdego prowajdera. Stworzymy sobie nowy klucz. Nazwę ten klucz oczywiście. Sensai. Default Project. Możecie ten klucz przepisać do nowego projektu. O co chodzi? Jeżeli klucz macie dobrze nazwany, przepisany do projektu, macie dużo większą kontrolę nad zużyciami, możecie sobie przefiltrować i zobaczyć ile tak naprawdę tokenów zużył wasz projekt, bądź wasz klucz. Generujemy Secret Key. Mamy go i pamiętajcie to, co mówiłem wcześniej. Taki security trzeba sobie gdzieś zapisać, bo zazwyczaj na platformach on jest widoczny tylko raz w momencie jego generowania. Skobywaliśmy to. Możemy już dodać do naszej konfiguracji. Odpalamy. Jeżeli tu jest zielony ptaszek, to nie ma błędów. Klucz jest wpisany do notatnika. Jak już miało nasze polecenie? Napisz skrypt w Pythonie, który wyśle zapytanie do API LM. i zapiszę odpowiedź do pliku. Ponieważ dzisiaj, akurat w dniu nagrywek Cloud się na nas obraził, będziemy używać czatu GPT, natomiast ja raczej do Pythonowych rzecz korzystam z Cloud'a 4,5 opus, który mi daje najlepsze tak naprawdę rozwiązania. Dobrze. Wpiszemy sobie nasze zadanie. Możemy je trochę rozbudować. Im więcej, tak jak mówiłem wcześniej na temat promptowania, Im więcej danych dostarczycie do czatu czy tam do modelu przez API, tym lepsza będzie odpowiedź. Musisz napisać tak. Środowisko. Google. Ja jeszcze dodaję, że skrypty wczytują się w pamięć do technika, bo zazwyczaj te środowiska też mają swoje bliki. Tutaj nie mamy plików, tu mamy okienka, w których po kolei realizujemy kod Pythona. Google. w lab zmienne zapisują się w pamięci notatnika. Warto wziąć też od razu mu podać nazwę naszego apikija, czyli tej zmiennej. Czyli już wyprzedzamy działania, jakby on prawdopodobnie sobie tą zmienną gdzieś tam ustawi i zapisze, że tu wprowadź swój klucz. Klucz open i jest zapisany w zmienny. I teraz co? Wyślę zapytanie do API LM, ale jakie zapytanie? Ja myślę, że stworzymy po prostu bardzo prosty prompt. Nasze zapytanie będzie: znowu stwórz prosty tekst o SEO. Z naszego pierwszego live-codingu to tyle. Zobaczymy, co nam odpowie w CzartGPT. Oczywiście zapytanie idzie do reasoningowego, bo tego też nie sprecyzowaliśmy, co ma być model językowy i jaki model. Tutaj, jak widzicie, tak jak wcześniej omawialiśmy, są parametry, rola user, user wysyła kontent, napisz prosty tekst o SEO. Odpowiedź będzie zapisana do pliku, o czym jeszcze nie było wcześniej, jeżeli chodzi o colab, zaraz zobaczycie też, gdzie są zapisywane pliki i jak się połączyć z Google Drive'em, żeby zapisywać je w jednym miejscu i mieć zawsze do nich dostęp. Bo ważna rzecz, jeżeli zapiszecie plik tylko i wyłącznie w tej warstwie colaba, jeżeli stracicie połączenie, to to środowisko jest usuwane. Tak jak mówiłem, wasze skrypty istnieją, cała ta struktura, natomiast wszystkie pliki zostaną usunięte. Słuchajcie, nic prostszego. Mamy nasz pierwszy skrypt, kopiujemy go, przenosimy go do naszego notatnika. Stwórzmy sobie nową sekcję. Nazwijmy ją, przepraszam. Zapytanie do LEM. Pierwszy kod przesunię na górę, żeby nam to się nie mieszało. Zapytanie do LEM też potrzebuje mieć swój kod, swój komórkę z kodem. Wstawiamy. Nie pozostaje nam nic innego. Jak zobaczyć, jak sobie poradził ChargyPT z naszym pierwszym wyzadaniem? Odpowiedź może dłużej potrwać, dlatego że to jest model reasoningowy. Mamy to. Odpowiedź nie dość, że mamy wyświetloną tą tutaj, za co odpowiada pewnie tutaj jakiś print, czyli jest print text output. Oczywiście nie określiliśmy żadnych RAM. Ten nasz prompt był bardzo prosty, bo nasz prompt jest tutaj. Oczywiście moglibyśmy ten prompt zrobić w naszej strukturze, rola, guidelines i tak dalej i stworzyć już skomplikowany. Jeżeli dojdziecie do tego momentu, możecie się tutaj już bawić. Możecie próbować wstawić. Nie musicie tego robić w kodzie, tylko wstawić swój prompt do chat-u GPT i powiedzieć, że użyj tego promptu. On wam wtedy go stawi prawdopodobnie z nowej zmieny. Zresztą zaraz to zrobimy. I to jest wasza pierwsza treść. Gratuluję. Wygenerowaliście pierwszą treść bezpośrednio kontaktując się z modelem językowym przez API. Gdzie zapisywane są te treści? Jeżeli otworzycie sobie tutaj taką ikonkę foldera, pliki, to wasz SEO tekst TXT jest zapisany tutaj. Możecie sobie zrobić jego podgląd również. Czy pobrać go na komputę. Mówiłem o tym, że możemy sobie jeszcze spróbować. Wrócimy do naszego menu, do naszego kodu. Możemy go skopiować, ten kod wrzucić do innego, ale mamy go już tutaj w naszym czacie GPT i chcielibyśmy użyć tak naprawdę bardziej rozbudowanego promptu. Skopiujemy sobie go wszystkie te pliki, które widzicie w moim tym notatniku. Wszystkie te pliki są w dokumentach. Możecie pobrać. Tam właśnie jest też struktura promptu, więc możecie to sobie skopiować. Poprosimy go, żeby wykorzystał tą strukturę. Ja nawet na te potrzeby nie będę może być prościej. Poprosimy go, żeby wykorzystał tą strukturę w promptcie i żeby prompt zapisał w osobnym, w osobnej zmiennej. Wtedy zobaczycie, jak dużo łatwiej wam będzie zmieniać już prompt bezpośrednio w kolabie, nie pracując już z chatem GPT, czy z nm. Zmień prompt na bardziej rozbudowany. Skorzystaj z poniższej struktury. Teraz pozmieniam na płotki i zapisz go w osobnej zmieny. Możecie dopisać, żeby łatwo było mi go konfigurować. żeby było mi go aktualizować. Wrzucamy do naszej struktury. Prawdopodobnie to, co teraz zrobi ChatGPT, to on w tych strukturach naszego promptu sam uzupełni informację. zobaczymy jak widzicie jest już zapisany do to co mówiłem stało się to co mówiłem, to jest prompt zapisany do osobnej zmiennej, jest rola display natural language, widzicie poczytajcie to sobie też później jak wyglądają odpowiedzi i pełny skrypt czyli najpierw musimy skopiować sobie skrypt nie zrobię tego w jednym tutaj widzicie, że zamiast tego pierwszego bardzo prostego prompta mamy już tą zmienną, ona się podświetla nam dlatego, że nie jest ona zdefiniowana, więc musimy jeszcze z czatu GPT skopiować sobie tą zmienną i jej zawartość, czyli nasz prompt równie dobrze, możecie go w tej chwili wrzucić do zupełnie nowej komórki, na przykład tutaj kod, gdzie będziecie mieli jeszcze większą kontrolę. Czyli jak widzicie, teraz mamy sekcję zapytanie pod LM, pierwszy mamy prompt SEO i to co mówiłem, możecie już sobie tutaj z tym promptem bardzo dużo zmieniać. Możecie poprosić o inny tekst, możecie dawać zupełnie inne reguły i dostaniecie też zupełnie tę inną odpowiedź. Wczytujemy to najpierw, żeby to się wczytało do pamięci notatnika. Teraz już tutaj nasza zmiana nie podkreśla się. Wysyłamy zapytanie i dostaniemy odpowiedź. Możecie zmieniać nazwę pliku, może zapisywać do innego pliku. Możecie bawić się tak naprawdę bardzo dużą ilością i gratuluję, to już jest dużo bardziej zaawansowana praca z API i LM-ów niż poprzednio. Pobawcie się, będzie to nam potrzebne. Pierwsze zadanie z takiego podstawowego naszego vibe-codingu mamy już za sobą, teraz zajmijmy się drugim. Chciałbym, żebyście też sami takie zadanie wykonali w domu. Ja przygotowałem coś takiego. Napisz skrypt w Pythonie, który użyje API zewnętrznego narzędzia. To daje wam dowolność. My jakby na potrzeby też dalszych działań naszych będziemy chcieli pobrać listę URL-i dla danego słowa kluczowego w Polsce, w lokalizacji polskiej. Oczywiście to będzie można zmieniać dla różnych krajów. Ten skrypt przyda nam się później. Będziemy mieli ułatwione zadanie w kolejnych filmach. Przechodzimy do naszego czatu GPT. Tak jak poprzednio. Zaczynam od zerowego czatu, żebyście widzieli, że nie wczytałem wcześniej dokumentacji, że wszystko robię od początku. Na początku. Zastanówmy się. Mówiłem Wam w pierwszym filmie, że warto dobrze dobierać narzędzia. Z serwisów, z providerów, którzy dostarczają SERPy, tak naprawdę, uczytują, serpy jest bardzo dużo. My udarzymy chyba do jednego z największych, nazywa się Data4SEO. Tak jak we wszystkich innych, u wszystkich innych providerów, musicie tam zarejestrować, uzyskać klucze API bądź hasła. Jeżeli nie ma darmowych kredytów, to trzeba doładować. Data4SEO to jest bardzo proste, bo tam wystarczy chyba 50 dolarów, które starczy Wam na bardzo, bardzo dużo pobierania danych. Prawdzimy, czy mają doksy. Ja już to zrobiłem. tak naprawdę, że będziecie pod główną stronę. Samego data forseo. Docsy są na górze. Kopiujcie do nich adres. I w naszym czasie GPT. Najpierw wpiszę tekst, później Wam go przeczytam. Czytam. Zapoznaj się z dokumentacją API. Dodaję adres po to, żebyśmy wskazali dokładnie, gdzie ma tą dokumentację przeszukać, żeby on nie latał, nie szukał tych dokumentacji. Wiadomo, że z tym dokumentacjami jest różnie. Sam prompt do webcodingu. Zbuduj prosty skrypt Python, który na dane słowo kluczowe i dla danego języka pobierze listę URL stop10sertgoogle. Wyświetli i zapisze do pliku ser list.xdm. I już. Pamiętając o naszych przypadkach z poprzednich lekcji, pamiętaj, pracujemy w notatniku Google Colab. SerpData ma bardzo dużo endpoints różnego rodzaju, nie tylko do analizy serpów, ale też i pamiętam, że do reklam, do People Also Ask tutaj też pamiętam, że budowałem być może my też query fanout na podstawie DataForSeo, więc być może też tutaj się tym zajmiemy co jest z przewagą, ma dostęp tak naprawdę do wszystkich krajów więc możecie korzystać budując pipeline generatorów treści do różnych języków. Mamy już odpowiedź. Collab Friendly, poda mi się ta nazwa. Wszystko będzie konfigurowalne. I właśnie jeszcze jedna rzecz, tutaj zobaczcie. Tym razem w Data for SEO jest wymagany login, czyli Wasz adres mailowy, w którym się zrejestrowaliście i hasło. Nie wymagają klucza API, wszystko zależy od dostawcy tych danych. Skrypt już się skończył. W naszym Collabie sobie uruchamiamy nową sekcję, poprzednią tylko przesuńmy w odpowiednie miejsce. żeśmy mieli czysto nowa sekcja sep.urls nazwijmy ją sobie on oczywiście będzie pobierał wszystkie wyniki seków natomiast na potrzeby nasze pobierze z tego jsona tylko listę url. kliknąłem dobra uzupełnić dane autoryzacyjne. Już mamy je przygotowane. Zmienię jeszcze zapytanie z tej pizzy Warszawa. Może jak zrobić dobrą pizzę? trzymajcie kciuki ta dam nie dość, że jeszcze nam wymusił pobranie pliku możemy go zapisać bo nie sprecyzowałem gdzie ma zapisać ten plik na naszym komputerze, to też wylistował top 10 organików to żeby było, żeby to nam zapisał to zapisał nam tutaj w naszym środowisku. Taką serplistę będziemy mogli wykorzystać, żeby z niej pobrać się później adresu URL, przetworzyć treść dotyczącą tego zapytania. Jak to wygląda? Jeszcze w samym pliku, żeby nie był gołosłowny. Dziękuję. Nie wiem, dlaczego pobrał 7. Znaczy wiem, przepraszam, sam sobie odpowiedziałem na to pytanie. Pewnie wchodzą akcje i ograniczona jest ilość wyników na tej pierwszej stronie. Także jesteście, gratuluję. Jesteście vibecoderami. 

</details>

---

<div class="lesson-completion-bottom" data-lesson-id="ai-content-expert/blok-1/lekcja-7"></div>

<div id="sensai-comments"></div>


---


## 📅 Tydzień 2

# 2.1 Zewnętrzne źródła wiedzy

<div class="lesson-meta">
  <div class="lesson-mentor">
    <img class="lesson-mentor__avatar" src="https://framerusercontent.com/images/t2GGO1yled5Z8wSFTTJMQHHzd4.png?scale-down-to=512&width=2976&height=2949" alt="Maciej Chmurkowski" />
    <span class="lesson-mentor__info">
      <span class="lesson-mentor__label">Mentor</span>
      <span class="lesson-mentor__name-text">Maciej Chmurkowski</span>
    </span>
  </div>
  <div class="lesson-rating" data-lesson-id="ai-content-expert/blok-2/lekcja-1"></div>
  <div class="lesson-completion" data-lesson-id="ai-content-expert/blok-2/lekcja-1"></div>
</div>

<div style="position:relative;padding-top:56.25%;"><iframe src="https://player.mediadelivery.net/embed/565073/f3b7fd4c-6d50-46f5-a475-0348974531d0?autoplay=false&loop=false&muted=false&preload=true&responsive=true" loading="lazy" style="border:0;position:absolute;top:0;height:100%;width:100%;" allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;" allowfullscreen="true"></iframe></div>

<br />



## 🎯 Cel lekcji

Celem tego materiału jest wprowadzenie do koncepcji grafu wiedzy oraz wyjaśnienie, dlaczego wykorzystanie zewnętrznych źródeł danych (technika RAG) jest kluczowe dla generowania rzetelnych, szczegółowych i wysokiej jakości artykułów przy użyciu modeli językowych (LLM).

---

## 📒 Notatka z lekcji

### Ograniczenia modeli językowych

Aby zrozumieć potrzebę budowania grafu wiedzy, należy najpierw uświadomić sobie fundamentalne ograniczenia modeli AI, które prowadzą do tzw. halucynacji (zmyślania odpowiedzi).

**Odcinka wiedzy (Knowledge cutoff)**  
Modele są trenowane przez wiele miesięcy na ogromnych zbiorach danych, ale proces ten kończy się w konkretnej dacie. Model nie posiada wiedzy o wydarzeniach, które nastąpiły po zakończeniu jego treningu (np. wynikach igrzysk olimpijskich, które odbyły się później).

**Brak dostępu do danych w czasie rzeczywistym**  
Modele w swojej podstawowej wersji nie mają wiedzy o bieżących cenach, aktualnych statystykach czy najnowszych wiadomościach.

**Samodzielne generowanie faktów**  
Gdy model nie zna odpowiedzi i nie ma dostępu do zewnętrznych źródeł, próbuje samodzielnie stworzyć odpowiedź, co często prowadzi do przekłamań.

### Czym jest RAG (Retrieval Augmented Generation)

Rozwiązaniem powyższych problemów jest wprowadzenie zewnętrznych danych do modelu. Proces ten określa się skrótem RAG:

- **Retrieval (Wyszukiwanie)** – Polega na odnalezieniu relewantnych dokumentów lub informacji w zewnętrznych źródłach.
- **Augmented (Wzbogacenie)** – Oznacza wzbogacenie kontekstu modelu o znalezione informacje. Innymi słowy, „dokarmiamy” model wiedzą, której mu brakuje.
- **Generation (Generowanie)** – To etap, w którym model tworzy odpowiedź, opierając się już nie tylko na swojej wbudowanej wiedzy, ale przede wszystkim na dostarczonych dokumentach.

**Aspekt techniczny**  
W profesjonalnym ujęciu proces ten wykorzystuje embeddingi (zamianę tekstu na wektory) i wyszukiwanie semantyczne. Jednak w szerszym, potocznym znaczeniu, RAG-iem nazywamy każdą sytuację, w której do promptu dołączana jest zewnętrzna wiedza (dokument, treść strony), aby model miał ją „podaną na tacy”.

### Źródła zewnętrznej wiedzy

Jako bazę wiedzy dla modelu można wykorzystać różnorodne materiały, w zależności od celu:

1. **Dokumenty firmowe** – Wewnętrzne procedury, regulaminy, bazy produktowe. Pozwala to na stworzenie np. wewnętrznej wyszukiwarki dla pracowników.
2. **Dokumenty prywatne i prawne** – Możesz wprowadzić do modelu np. 50-stronicową umowę kredytową, aby szybko wyszukać w niej konkretne zapisy lub klauzule.
3. **Artykuły i raporty** – Treści branżowe, analizy rynku i publikacje specjalistyczne.
4. **Treść stron internetowych** – W kontekście tego kursu, źródłem wiedzy będą treści pobrane z Internetu.

### Zastosowanie w generowaniu artykułów

W omawianym bloku tematycznym skupimy się na wykorzystaniu treści ze stron internetowych (Top 10 wyników Google) do budowy grafu wiedzy.

- **Cel:** Stworzenie asystenta (wiedzy wspomagającej), który posłuży do wygenerowania ostatecznego artykułu o wysokiej jakości.
- **Ekstrakcja encji:** Pobieranie treści z najlepszych wyników w Google daje gwarancję, że kluczowe pojęcia (encje), które tam występują, trafią również do naszego artykułu.
- **Oszczędność zasobów:** Nie będziemy przesyłać do modelu całych stron internetowych wraz z kodem HTML. Spowodowałoby to ogromne zużycie tokenów (koszty) i wprowadziło szum informacyjny. Skupimy się na samej treści (tekście).

### Podsumowanie

Wykorzystanie zewnętrznej bazy wiedzy (grafu wiedzy/RAG) pozwala ominąć ograniczenia treningowe modeli AI. Dzięki temu generowane treści są aktualne, rzetelne i nasycone odpowiednimi słowami kluczowymi, co jest niemożliwe do osiągnięcia przy użyciu samej "wiedzy wbudowanej" modelu.

---

<details>
<summary>📝 Transkrypcja wideo</summary>

*(Transkrypcja zostanie uzupełniona)*

</details>

---

<div class="lesson-completion-bottom" data-lesson-id="ai-content-expert/blok-2/lekcja-1"></div>

<div id="sensai-comments"></div>


---

# 2.2 Pobieranie listy stron z SERP

<div class="lesson-meta">
  <div class="lesson-mentor">
    <img class="lesson-mentor__avatar" src="https://framerusercontent.com/images/t2GGO1yled5Z8wSFTTJMQHHzd4.png?scale-down-to=512&width=2976&height=2949" alt="Maciej Chmurkowski" />
    <span class="lesson-mentor__info">
      <span class="lesson-mentor__label">Mentor</span>
      <span class="lesson-mentor__name-text">Maciej Chmurkowski</span>
    </span>
  </div>
  <div class="lesson-rating" data-lesson-id="ai-content-expert/blok-2/lekcja-2"></div>
  <div class="lesson-completion" data-lesson-id="ai-content-expert/blok-2/lekcja-2"></div>
</div>

<div style="position:relative;padding-top:56.25%;"><iframe src="https://player.mediadelivery.net/embed/565073/a72f9b66-e2b4-42f3-a3f7-0dcee8cd1cb1?autoplay=false&loop=false&muted=false&preload=true&responsive=true" loading="lazy" style="border:0;position:absolute;top:0;height:100%;width:100%;" allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;" allowfullscreen="true"></iframe></div>

<br />



## 🎯 Cel lekcji

Naszym celem jest stworzenie bazy informacji (faktów, encji, idei), która pozwoli generować treści wysokiej jakości, pozbawione halucynacji i wyróżniające się na tle konkurencji.

---

## 📒 Notatka z lekcji

W tej lekcji kontynuujemy pracę nad budową grafu wiedzy. Skoro większość twórców contentu korzysta z Top 10 Google, my spróbujemy pójść o krok dalej, sięgając po dane z innych wyszukiwarek.

### Dlaczego warto dywersyfikować źródła?

Jeśli wszyscy generują treści w oparciu o te same wyniki (Top 10 Google), tworzony content staje się powtarzalny i wtórny.

- **Unikalność:** Pobranie danych z alternatywnych wyszukiwarek (np. Bing) pozwala dotrzeć do innych stron i perspektyw.
- **Wyróżnienie się:** Twój artykuł może zyskać w oczach algorytmów, jeśli będzie zawierał informacje, których nie ma konkurencja.

### Przygotowanie środowiska i Vibe Coding

Pracujemy w środowisku Google Colab, wykorzystując model językowy (w tym przypadku Claude Opus/Sonnet) do pisania i modyfikowania kodu.

**Krok 1: Weryfikacja dokumentacji API**  
Chcemy zmodyfikować skrypt z poprzedniej lekcji, aby pobierał dane z Bing i DuckDuckGo za pośrednictwem API Data4SEO.
1. Wklejamy do modelu (Claude) dokumentację Data4SEO.
2. Prosimy o sprawdzenie dostępnych endpointów.

*Wnioski z analizy dokumentacji:*
- **Bing:** Jest wspierany przez Data4SEO.
- **DuckDuckGo:** Nie posiada dedykowanego endpointu w tym API (wymagałoby to trudniejszego scrapowania lub innego dostawcy).
- **Inne:** Dostępne są Yahoo, Seznam, Naver, Baidu, ale są mniej istotne dla naszego rynku.

**Krok 2: Modyfikacja skryptu**  
Zlecamy modelowi zadanie:  
*"Twoim zadaniem jest modyfikacja skryptu tak, aby pobierał również strony Top 10 z Bing, o ile taki endpoint istnieje."*  
Model generuje zaktualizowany kod, który łączy zapytania do Google i Binga.

### Ustalenie tematu przewodniego kursu

Od tego momentu, aby zachować spójność i móc porównywać wyniki na każdym etapie, pracujemy na jednym, konkretnym słowie kluczowym:

> **Słowo kluczowe:** Jak obniżyć kortyzol po 40

To hasło posłuży nam do zbudowania całego pipeline'u: od pobrania URLi, przez ekstrakcję treści, budowę grafu wiedzy, aż po finalny artykuł.

### Uruchomienie skryptu i analiza błędów (Case Study: Bing)

Po uruchomieniu zaktualizowanego skryptu dla polskiego zapytania, otrzymaliśmy wyniki z Google oraz z Binga. Tutaj pojawił się istotny problem techniczny, który jest cenną lekcją.

**Problem:** Wyniki zwrócone przez Bing dla polskiego zapytania okazały się całkowicie nietrafione (w tym treści nieodpowiednie/dla dorosłych).

**Diagnoza (Debugging z Claude):**  
Po zgłoszeniu problemu modelowi, analiza wykazała, że:
- **Ograniczenia językowe:** Endpoint Binga w Data4SEO ma ograniczone wsparcie dla języków (głównie angielski, francuski, niemiecki).
- **Brak wsparcia dla PL:** Język polski nie jest w pełni wspierany, co powoduje, że API zwraca wyniki domyślne (fallback) lub losowe, ignorując kontekst lokalny i filtry bezpieczeństwa (SafeSearch).

**Rozwiązanie dla naszego projektu:**  
Ze względu na te ograniczenia, w dalszej części kursu (dla języka polskiego) pozostajemy przy wynikach wyłącznie z Google.

> [!TIP]
> **Wskazówka:** Jeśli tworzysz treści w języku angielskim lub niemieckim, możesz śmiało korzystać z Binga w Data4SEO. Jeśli zależy Ci na Bingu w Polsce, musisz poszukać innego dostawcy API (np. SERP API) i połączyć wyniki z dwóch różnych źródeł.

### Podsumowanie i wnioski

1. **Automatyzacja:** Potrafimy szybko modyfikować skrypty za pomocą "vibe codingu" (wklejanie kodu + dokumentacji + prośby do LLM).
2. **Weryfikacja:** Zawsze sprawdzaj jakość danych zwracanych przez API. To, że kod działa, nie znaczy, że dane są użyteczne (przykład Binga w PL).
3. **Decyzja projektowa:** Dla polskiego case study ("Jak obniżyć kortyzol po 40") bazujemy na Google, aby zapewnić najwyższą jakość danych wejściowych.

Co dalej? Mamy już listę URLi (z Google). W kolejnych krokach zajmiemy się pobieraniem z nich "mięsa", czyli samej treści, która posłuży do karmienia naszego modelu AI.

---

## 📚 Materiały dodatkowe





---

<details>
<summary>📝 Transkrypcja wideo</summary>

*(Transkrypcja zostanie uzupełniona)*

</details>

---

<div class="lesson-completion-bottom" data-lesson-id="ai-content-expert/blok-2/lekcja-2"></div>

<div id="sensai-comments"></div>


---

# 2.3 Ekstrakcja treści z URL

<div class="lesson-meta">
  <div class="lesson-mentor">
    <img class="lesson-mentor__avatar" src="https://framerusercontent.com/images/t2GGO1yled5Z8wSFTTJMQHHzd4.png?scale-down-to=512&width=2976&height=2949" alt="Maciej Chmurkowski" />
    <span class="lesson-mentor__info">
      <span class="lesson-mentor__label">Mentor</span>
      <span class="lesson-mentor__name-text">Maciej Chmurkowski</span>
    </span>
  </div>
  <div class="lesson-rating" data-lesson-id="ai-content-expert/blok-2/lekcja-3"></div>
  <div class="lesson-completion" data-lesson-id="ai-content-expert/blok-2/lekcja-3"></div>
</div>

<div style="position:relative;padding-top:56.25%;"><iframe src="https://player.mediadelivery.net/embed/565073/acdd7150-1744-4e3c-bfa9-cc08c25b7b09?autoplay=false&loop=false&muted=false&preload=true&responsive=true" loading="lazy" style="border:0;position:absolute;top:0;height:100%;width:100%;" allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;" allowfullscreen="true"></iframe></div>

<br />



## 🎯 Cel lekcji

Masz już listę adresów URL (z poprzedniej lekcji). Teraz czas na pobranie z nich „mięsa”, czyli samej treści merytorycznej. To krytyczny moment – jeśli na tym etapie do Twojego systemu trafią śmieci, Twój finalny model będzie halucynował.

---

## 📒 Notatka z lekcji

### Dlaczego "Ctrl+C, Ctrl+V" to za mało?

Strony internetowe są pełne elementów, które nie są treścią właściwą artykułu. Są to:
- Paski boczne (sidebary) i reklamy.
- Stopki, nagłówki (headery).
- Polityki prywatności i zgody RODO.
- Linki nawigacyjne.

Jeśli nie oczyścisz danych przed podaniem ich do modelu (RAG), te przypadkowe fragmenty tekstu zakłócą działanie grafu wiedzy.

### Narzędzie: Crawl4AI

Do pobierania treści wykorzystujemy bibliotekę Pythonową **Crawl4AI**.

**Dlaczego to narzędzie?**
- **Imitacja przeglądarki:** Crawl4AI udaje prawdziwą przeglądarkę (może zmieniać User Agent), co pozwala ominąć wiele blokad, które zatrzymałyby proste boty.
- **Wbudowane filtry:** Posiada algorytmy pomagające automatycznie oddzielić treść od szumu.

> [!CAUTION]
> **Ostrzeżenie: Pułapka "Lenistwa" z ChatGPT**  
> Zanim przejdziesz do kodu, ważna lekcja. Możesz pomyśleć: *"Po co mi kod, poproszę ChatGPT, żeby wszedł na link i streścił artykuł"*.  
> **UWAGA:** ChatGPT często halucynuje, twierdząc, że wszedł na stronę. W lekcji przeprowadziliśmy test: poprosiliśmy czat o wyciągnięcie treści z konkretnego URL-a. Model wygenerował piękne, sensowne streszczenie. Po ręcznym sprawdzeniu okazało się, że wymyślił treść, która nie miała nic wspólnego z rzeczywistym tekstem na stronie.  
> **Wniosek:** Do precyzyjnej pracy na danych musisz używać kodu (Pythona), a nie polegać na deklaracjach czatu w trybie konwersacyjnym.

### Metody filtrowania treści w Crawl4AI

Aby pobrać tylko to, co istotne, Crawl4AI oferuje różne strategie. W lekcji przetestowaliśmy dwie:

#### 1. Algorytm BM25 (Podejście oparte na zapytaniu)
Wykorzystuje ranking treści względem Twojego zapytania (keywordu) lub nagłówka H1.

- **Jak działa:** Szuka bloków tekstu, które są matematycznie (kosinusowo) zbliżone do Twojego tematu (np. "jak obniżyć kortyzol").
- **Zaleta:** Bardzo wysoka precyzja (dostajesz tylko to, co dotyczy tematu).
- **Wada:** Może wyciąć zbyt dużo. Jeśli artykuł ma dygresje lub szeroki kontekst oddalony od słowa kluczowego, BM25 może to pominąć.

#### 2. Pruning Content Filter (Podejście heurystyczne)
Analizuje strukturę strony, aby odciąć szum.

- **Jak działa:** Oblicza "score" dla każdego bloku tekstu, biorąc pod uwagę gęstość tekstu, liczbę linków i znaczenie tagów HTML.
- **Zaleta:** Skutecznie usuwa menu, stopki i nawigację, zachowując większość artykułu.
- **Wynik testu:** W naszej lekcji ta metoda dała lepsze rezultaty (więcej użytecznej treści) niż restrykcyjny BM25.

### Proces Krok po Kroku (Prototypowanie)

Pracujemy w Google Colab. Zamiast pisać kod ręcznie, wykorzystujemy LLM (ChatGPT/Claude) do wygenerowania skryptu.

**Krok 1: Przygotowanie Prompta**  
Wklej do czatu dokumentację Crawl4AI (szczególnie sekcje o BM25 lub Pruning Content Filter) i poproś:  
*"Stwórz skrypt w Pythonie dla Google Colab, który użyje biblioteki Crawl4AI do pobrania treści z danego adresu URL [WSTAW URL]. Wykorzystaj [NAZWA FILTRA] do oczyszczenia treści."*

**Krok 2: Instalacja Bibliotek**  
Skrypt wygenerowany przez AI będzie wymagał instalacji. W Colabie uruchom komendy (zazwyczaj zaczynające się od `!pip install ...`), które poda Ci model.

**Krok 3: Test na jednym URL-u**  
Nie uruchamiaj od razu pętli dla 100 stron.
1. Wybierz jeden URL (np. Top 1 z Google).
2. Uruchom skrypt z filtrem **BM25**. Sprawdź wynik. (W lekcji wynik był zbyt okrojony).
3. Uruchom skrypt z filtrem **Pruning Content Filter**. Sprawdź wynik. (Ten wynik był satysfakcjonujący).

**Krok 4: Weryfikacja**  
Przeczytaj pobrany tekst. Sprawdź, czy nie ma tam stopek, zgód na pliki cookie czy nawigacji.

### Wskazówki Eksperta (Pro Tips)

- **Ile treści potrzebujesz?** Mając 10 URLi, zazwyczaj wystarczy skutecznie pobrać dane z 4-5 z nich, aby zbudować solidny graf wiedzy.
- **Zaawansowane czyszczenie (Metoda Mateusza):** W profesjonalnych zastosowaniach można pisać własne skrypty (Regex), które "na sztywno" wycinają sekcje Head, Footer, skrypty JS i porównują bloki tekstu między sobą. Jednak na potrzeby tego kursu biblioteka Crawl4AI jest wystarczająca.
- **Zapisywanie:** Pobrane treści warto oddzielać od siebie wyraźnym separatorem (np. `---`), co ułatwi ich późniejsze przetwarzanie jako tablicy danych (Array).

### Zadanie Domowe (Next Step)

Twoim zadaniem jest przekształcenie prototypu w działający automat:
1. Weź listę URLi wygenerowaną w poprzedniej lekcji.
2. Poproś AI o zmodyfikowanie skryptu tak, aby działał w pętli.
3. Skrypt ma wejść na każdy URL z listy, pobrać treść (używając sprawdzonego filtra, np. Pruning) i zapisać wyniki w jednym pliku/zmiennej, oddzielając artykuły trzema myślnikami (`---`).

W następnym kroku z tych "klocków" będziemy budować graf wiedzy.

---

## 📚 Materiały dodatkowe







---

<details>
<summary>📝 Transkrypcja wideo</summary>

W poprzednim filmie dość zabawnym pokazałem wam jak pobierać listę url dla danego zapytania. W tym momencie przechodzimy do kolejnego kroku w naszym pipeline już z tej listy url. Dla poszczególnych url będziemy pobierać treść danej strony internetowej. Na co tu trzeba uważać? Trzeba uważać, żeby do tego naszego raga, z którego będziemy robić gra w wiedzy, żeby nie trafiły śmieci. Bo taka strona, jeżeli będziemy z niej pobierać, różne są sposoby pobierania, zaraz to omówimy, żeby pobierzyć sam content, który dotyczy danego zapytania. Nigdy to nie jest tak proste jak się wydaje. Jeżeli pobierzemy skrawki jakiegoś sidebara, polityki prywatności, to później, jeżeli nie oczyścimy tego przed podaniem do następnego kroku, możemy mieć dość sporo halucynacji bądź zakłóceń finalnego grafu wiedzy. Ja używam do tego i polecam Wam z całego serca takiej biblioteki w Pythonie, która nazywa się Crawford AI. Ta biblioteka jest dość duża, teraz sobie ją przejrzymy. Na czym polega różnica? Przede wszystkim na tym, że Crawford AI imituje przeglądarkę. Defaultowo jest skonfigurowana, nie pamiętam jaka przeglądarka, ale może się to zmieniać albo wrzucać losowo. Crawford AI dzięki temu to jest najważniejsza dla mnie funkcja, bo poza tym to chyba niewiele używam, ale zaraz Wam je pokrótce omówię. to powoduje, że jestem w stanie dojść do wielu stron mój crawler nie jest blokowany jeżeli mam 10 adresów URL do przekrawlowania staram się wyciągnąć treść przynajmniej z 4-5 stron więcej moim zdaniem nie trzeba, więc to też będziemy uznaniać w naszym skrypcie my na początku skupimy się tylko na pojedynczym adresie URL czyli weźmiemy sobie pierwszy adres URL i spróbujemy z tego adresu za pomocą Pythona, Crawford AI i jeszcze uwaga, weryfikacji albo odpytania do LMA. Tu są naprawdę różne metody. Wybrać tylko tą część treści, która dotyczy naszego zapytania, czyli czego? Kortyzolu. Jak obniżyć kortyzolu po 40? Jeżeli przyjrzycie się dokumentacji Crawford AI, jest ona bardzo mocno rozbudowana. Crawford AI też ma w sobie taką funkcję. Jeżeli podpinacie klucz danego LMA, to razem z konfiguracją Crawlera w kodzie możecie też wysłać prompt, który może mówić wyciągnij mi z danej strony tylko informacje dotyczące na przykład cen. Więc ten crawler, który ustawicie jednocześnie crawluje stronę, ale sam ma silnik kontaktowania się przez API do wybranego LMA i oczyszczania tych danych. Ja tego nie używam, bo nie mam na tym kontroli. Ten prompt jest bardzo prosty, pewnie można go rozbudować, ale wolę to zrobić osobno. I teraz tak jest parę funkcji które ułatwiają pobieranie tych treści. Przypominam my chcemy pobrać tak naprawdę tylko treści które dotyczą danego zapytania pozbyć się wszystkiego innego. I była tu taka funkcja. To się nazywała BM25. Zaraz ją odnajdę. Jest i pralink content filter i będzie BM25. To są zbliżone funkcje, które wykorzystują embeddingi. Jedna z nich, i zaraz Wam powiem, która, używa H1 jako punktu odniesienia w szukaniu zbliżonych kosinusem innych bloków treści na tej stronie. to ma swoje minusy i plusy, dlatego że niektóre bloki, które są zbyt oddalone od tej hajdynki, a takie też się zdarzają, czyli mamy rozwinięcie jakiegoś wątku, jest pomijana. Więc to nie jest tak, że jesteśmy w stanie 100% dostać całą tą treść, która nas interesuje, ale to już jest bardzo, bardzo, bardzo dużo. I teraz ja nie będę się wczytywał, oczywiście mógłbym, ale po co? Zróbmy, wykorzystamy chat GPT, którego poprosimy, żeby zbadał nam. jakie są różnice. Czyli przynajmniej dokumentację Crawford AI, podaję oczywiście adres do tej dokumentacji dokładnie do tego miejsca. Wskaż różnice pomiędzy BM25 i Content Pro-Link. To już tak, żebyśmy mieli teorię ze sobą. Pro-Link Content Filter heurystyczne odcinanie szumu. Cel usunąć treść o małej wartości informacyjnej niezależnie od tematu i jak działa, analizuje elementy strony i oblicza score dla każdego bloku tekstu brany pod uwagę między gęstość tekstu, gęstość linków, znaczenie tagów. BM25, ranking treści względem zapytania użytkownika. Czyli to jest to, o czym mówiłem. Może wybierać tylko te fragmenty zawartości, które najbardziej relewantne względem konkretnego zapytania. Czyli tu też musimy wskazać, na przykład wyekstraktować sobie H1, albo jeżeli mamy nasz słowo kluczowy, to też możemy je wrzucić. Jak powinienem wrzucić kortyzol po 40 i BM25 wyszuka nam po kosinusie. Wiecie dobrze, co to jest kosinus. Wyszuka nam tylko te bloki tekstu, które są tym związane. Na potrzeby nasze dzisiejsze będziemy wykorzystywać BM25. Więc wiemy już, co będziemy robić. Teraz musimy zrobić prototyp. Zrobimy prototyp dlatego, że mówiłem, zrobimy prototyp tylko na podstawie jednego adresu URL i będziemy chcieli bm25 wykorzystać i zobaczymy, co nam z tego wyjdzie. I oczywiście użyjemy czatu GPT do napisania tej funkcji. Przenosimy się do... Jeżeli jesteśmy już tak naprawdę w wątku czatu, on już się zapoznał, zobaczcie, z dokumentacją, więc dużo łatwiej nam też będzie od razu napisać ten skrypt. Więc piszę teraz prompt, proszę go o napisanie, stworzenie takiego skryptu, który używając Crawford AI i BM25 pobierze nam content z danego adresu URL. Na razie tylko z jednego. Dlaczego? Myślę, że dużo łatwiej jest zrobić prototyp na podstawie jednego adresu URL, Później poprosić go znowu, już zatrzymując ten prototyp, sobie zostawiając nawet, bo tam łatwo jest testować. Poprosić o kolejny skrypt, który wykorzysta ten już istniejący i w pętli odpyta wszystkie adresy URL z listy, którą mamy z poprzedniego kroku i wygeneruje nam ten content. Także piszemy prompt. Stwórz skrypt w itonie Google Colab, który pobierze treść z danego adresu url i wykorzysta nasze słowo kluczowe jak obniżyć korte do zbocz 60 w ramach funkcji bm25. Oczywiście najważniejsza rzecz, nie wspomniałem, że mamy użyć biblioteki crowdfoy.ai. Który? Użycie zresztą bardzo wygodne jest pisanie odnowelniki, odmyślenika tych promptów. użyje crawl for AI. Pobierze treść danego adresu url. Dobrze zobaczymy co teraz nam odpowie na to. Czat zobaczcie że od razu też zaznaczyłem że to jest Google call'a bo te będą się różnić jeżeli to będziecie pisali na potrzeby nie notatnika tylko tylko plików wykonywanych na serwerze. Myślałem, że czat będzie mądrzejszy, bo na górze miał wczytane dokumentację BN25, przeszukiwał na przed chwilą internet i co znalazł Docs, Crawford AI, więc robił jeszcze raz tą robotę, której nie musiał wykonywać, więc jednak warto w każdym zapytaniu dodać tą dokumentację. I zobaczcie, teraz pierwsza rzecz, która mamy, dochodzą nam instalacje do Collab. Czyli pamiętacie jak robiliśmy Collab, mieliśmy to okienko, gdzie wprowadzaliśmy tę instalację, więc zrobimy sobie to skopiujemy od razu i wrzucimy to do naszego okienka instalacyjnego. Możemy też od razu uruchomić, niech on tam kończy skrypt. Coś tutaj źle. Zrobimy tak, że przerzucimy od OpenAI do tego miejsca. Mi się kliknęło akurat, nie zwrócę się na to uwagi. Będzie instalował teraz biblioteki, czyli instaluję Crawford AI. Tych instalacji będzie sporo, ale jak mówiłem Crawford AI udaje, emuluje przeglądarkę, nie wyszukiwarkę, jak chciałem powiedzieć, wyszukiwarkę. Wrócimy do naszego czatu GPT i nasz kod wygląda mniej więcej w ten sposób. Tutaj wprowadzimy adres URL, nasz query jest już podany. Sryp nie jest zbyt duży, ale ja spodziewam się, znając w ogóle crowdfor.ai i znając dostępność stron internetowych, przeładowanie javascriptami, spodziewam się jakichś fajerwerków, więc najwyżej będziemy to poprawiać na bieżąco. Jak widzicie Collab się jeszcze wykonuje Czyli jest tutaj na szaro Fawii ikonka, ale my sobie w międzyczasie Stworzymy nową sekcję Przesuniemy ją na dół Zywamy ją Content Extractor Jeden URL poniżej kod i sobie oczywiście w tym kodzie wprowadzimy już nasz top 1 z wyników wyszukiwania. Dobrze. Nie wiem jak to wygląda, jeżeli chodzi o pobieranie treści strony internetowych w orkiestrach typu make i n8n. Być może też znajdziecie gdzieś w sieci jakieś API, które wam na to pozwoli. Ja jednak jestem za tym Pythonem, Zdaję sobie sprawę, że nie każdy z Was też będzie chciał budować ten pipeline. Możecie też wykorzystać ChatGPT, bo zaraz wypróbujemy jeszcze w nowym wątku sam chat i zapytamy się, czy jest on w stanie wyekstraktować nam treść. Dla osób, które by chciały zrobić mniejszej ilości artykułów, a chciałby to zrobić bardzo dobrze więc może sprawdzimy czy da się to zrobić czy będzie w jakiś sposób nas blokował. To się instalują biblioteki w międzyczasie. Czy jesteś w stanie wyekstraktować treść dotyczącą zapytania jak dobrze obniżyć kortyzol po 40 z tej strony internetowej i podałem ten adres url który jest top 1. I zobaczcie. Tak, wyekstraktowałem dla Ciebie kluczową treść z artykułu na temat tego, jak realnie obliżyć korytetoport 40 z podanej strony Mańska Klinika. Ej, sprawdzę to. Coś mi to wygląda na halucynację. Oto streszczenie najwyższych wskazówek. I tutaj już mamy treść, która by się nadawała Tak naprawdę świetnie jest wyekstraktowana, ona jest jeszcze streszczona, poukładana, która by się nadawała do budowy naszego grafu wiedzy, jaką wyekstraktowana część. Zaraz zobaczymy sobie, tworzymy tą stronę. I mniej więcej porównamy. Krótko to robi w twoim organizmie, męski stres pracy po czterdziestce. ciężko mi będzie w tej chwili to dobrze porównać ale zrobimy jeszcze inaczej zaznaczę sobie tą treść tak też możecie robić też możecie ją kopiować bezpośrednio zapisywać do plików ja nienawidzę tego, ja automatyzuję wszystko ale jeżeli chcecie zrobić sobie to w czesie GPT to nie musicie tak naprawdę robić tego w Pythonie. No jest dość duży tekst. Dobra. Myśmy sobie tak. Skopiuję. Proszę. Mówię sprawdzam. To jest treść skopiowana z tej strony, czy to jest na pewno to samo? Nie. Bingo. Także uważajcie na takie rzeczy. Czernczy Pity nas poszukał, że przekrawlował tą stronę. Coś sobie poszukał niby w internecie. Prawdopodobnie to zmyślił. więc lepiej już jest skopiować tą treść nawet w tej chwili moglibyśmy sobie ją gdzieś na boku zapisać do jakiegoś notatnika żebyśmy mogli później ją wykorzystywać. Zaraz ale wrócimy najpierw do naszego Pythona. Bioteki się zainstalowały kontakt, ekstraktor. Spróbujemy go uruchomić. Inicjacja Cloud4AI, on w tej chwili przeszedł. I zobaczcie co się stało. Jest tej treści, tak jak mówiłem, dużo mniej. Bo on działa na wykorzystaniu funkcji BM25, czyli porównuje. Wyciągnął tylko te bloki tekstu, które są bardzo bliskie kosinusem do naszego zapytania. Ale żeby zamknąć jeszcze ten wątek pobierania tych treści, możemy jeszcze wykorzystać jedną funkcję, czyli ten content pruning. Przejdźmy sobie do naszego wątku w czacie. Jak w międzyczasie, kiedy ChatGPT tworzy tą treść? Jak ja to robię, natomiast dam Wam trochę podpowiedzi, To nie chodzi o to, że nie chce się dzielić. Myślę, że zostawię skrypt Pythonowe, w którym będziecie mieli bardzo mocno rozbudowany, w którym nie miałby istoty. Ciężko było nam by tutaj to stworzyć. Siedzieliśmy pewnie pół godziny, bo to jest skrypt, który ja tworzyłem parę dni. Co ja robię? Ja wycinam. Oczywiście Crawford AI nie korzystam z tych funkcji, dlatego że one wycinają zbyt dużo, nie dostarczają tej treści, którą chcę. Wycinam wszystko, co niepotrzebne. wycinam head, jeżeli znacie się na HTML to wiecie, że to jest bardzo dużo w nagłówku, wycinam wszystkie niepotrzebne sidebary, stopki, polityki prywatności, to jest wycinanie regexem, czyli trzeba też wczytać w Pythonie. I wyciągam tylko bloki tekstów i oczywiście te bloki tekstów porównuję nie tylko do zapytania, ale też do h1 i też porównuję ich w similaracji score pomiędzy sobą, nie tylko względem głównego zapytania. W ten sposób jestem w stanie wyciągnąć naprawdę duże bloki tekstów i jeżeli coś zostanie pominięte, to i tak pamiętajcie, że ściągamy z tych stron, nie wiem, pięć, dziesięć, wyciągamy z nich tylko później najważniejsze informacje, encje, które będą mogły, pomogą nam zbudować gra w wiedzy. Mamy już ten drugi skrypt, chcemy to porównać, chcę wam to pokazać. Myślę, że ta wiedza się wam też przyda. wstawimy to sobie jako kolejny skrypt możecie też zwijać te komórki i bezpośrednio otworzyć sekcje pod nimi dodajemy kod ekstraktor drugi kod, za szybciej tylko uruchomimy tylko skupię sobie ten url pierwszy i zobaczymy jak dużo mamy tej treści hmm, czekajcie, już się pobawiłem odpalamy i zobaczymy Jest lepiej. Jest dużo lepiej. I taki tekst już się nadaje. To jest tekst, nie ma żadnych licencji, tylko teksty, które zostały pobrane z tej strony. Oczywiście są duplikacje. Możecie to na każdym poziomie wrzucić, czy do LMA, a nawet Python jest w stanie Wam sprawdzić, czy nie ma duplikacji w linikach i to wyciąć. Waszym zadaniem domowym jest stworzenie podobnego skryptu, ale też jeszcze druga część. zrobienie, wykorzystanie listy URL-i, możecie nawet, jeżeli nie macie z poprzedniego kroku, to sobie taką listę URL-i wrzucić, bo pamiętacie, to są klocki, możecie sobie składać, możecie te listy mieć z innych źródeł i tą treść, napisać skrypt, stworzyć skrypt, napisać coś za dużo powiedziane za pomocą jakiegoś czata, który pobierze wszystkie te treści, zapisze oddzielone na przykład trzema myślnikami. Dlaczego trzema myślnikami? Bo później będziemy to wykorzystywać, czyli uznamy to jako array, czyli tablicę, otworzymy to sobie w kolejnym kroku i z każdego tekstu będziemy ekstraktować dane. 

</details>

---

<div class="lesson-completion-bottom" data-lesson-id="ai-content-expert/blok-2/lekcja-3"></div>

<div id="sensai-comments"></div>


---

# 2.4 Czyszczenie pobranej treści

<div class="lesson-meta">
  <div class="lesson-mentor">
    <img class="lesson-mentor__avatar" src="https://framerusercontent.com/images/t2GGO1yled5Z8wSFTTJMQHHzd4.png?scale-down-to=512&width=2976&height=2949" alt="Maciej Chmurkowski" />
    <span class="lesson-mentor__info">
      <span class="lesson-mentor__label">Mentor</span>
      <span class="lesson-mentor__name-text">Maciej Chmurkowski</span>
    </span>
  </div>
  <div class="lesson-rating" data-lesson-id="ai-content-expert/blok-2/lekcja-4"></div>
  <div class="lesson-completion" data-lesson-id="ai-content-expert/blok-2/lekcja-4"></div>
</div>

<div style="position:relative;padding-top:56.25%;"><iframe src="https://player.mediadelivery.net/embed/565073/4bacbab9-01d6-456e-a6e0-389fe7d73d1d?autoplay=false&loop=false&muted=false&preload=true&responsive=true" loading="lazy" style="border:0;position:absolute;top:0;height:100%;width:100%;" allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;" allowfullscreen="true"></iframe></div>

<br />



## 🎯 Cel lekcji

Celem tej lekcji jest stworzenie skryptu, który wyczyści te dane, wykorzystując zaawansowaną technologię embeddingów (wektoryzacji tekstu).

---

## 📒 Notatka z lekcji

W poprzednim kroku nauczyliśmy się pobierać treść stron internetowych (tzw. content scraping) przy użyciu biblioteki Crawl4AI. Mimo użycia filtrów (takich jak BM25 czy Pruning), pobrane dane często wciąż zawierają "śmieci":
- Zduplikowane fragmenty.
- Pozostałości menu, stopek czy sekcji "Czytaj także".
- Kod HTML lub niepożądane znaki.
- Treści ucięte lub niekompletne.

### Dlaczego musimy to robić?

- **Oszczędność pieniędzy i zasobów:** Modele językowe (LLM) rozliczane są za tokeny. Przesyłanie zduplikowanych lub bezwartościowych fragmentów tekstu to marnowanie budżetu.
- **Jakość grafu wiedzy:** Jeśli do Twojego RAG-a (Retrieval Augmented Generation) trafią śmieci, model będzie halucynował. Czysty wsad = czysty wynik.
- **Redukcja szumu:** W lekcji udało nam się zredukować objętość tekstu o 43%, usuwając duplikaty i zbędne elementy, zachowując jednocześnie kluczowe informacje.

### Jak działa nasz proces czyszczenia?

Zamiast polegać tylko na prostych filtrach słów kluczowych, wykorzystamy modele embeddingowe (np. OpenAI `text-embedding-3-small` lub `text-embedding-ada-002`).

**Zasada działania:**
1. Skrypt dzieli pobrany tekst na mniejsze bloki (paragrafy).
2. Każdy blok jest zamieniany na wektor (ciąg liczb reprezentujący jego znaczenie semantyczne).
3. Porównujemy wektory między sobą, obliczając tzw. Cosine Similarity (podobieństwo kosinusowe).
4. Jeśli dwa bloki są zbyt podobne (np. similarity > 0.9), usuwamy jeden z nich.
5. Jeśli blok ma zbyt niskie powiązanie z naszym tematem głównym (np. similarity < 0.3), traktujemy go jako szum i usuwamy.

### Tworzenie skryptu w Google Colab (Vibe Coding)

Twoim zadaniem jest stworzenie skryptu Pythonowego, który wykona tę pracę. Poniżej znajduje się instrukcja, jak wygenerować taki kod przy pomocy AI (Claude/ChatGPT).

**Wymagania wstępne:**
- Plik tekstowy z pobranymi artykułami (oddzielonymi separatorem, np. `---`).
- Klucz API do OpenAI (dla modelu embeddingowego).

**Prompt do wygenerowania skryptu:**  
Skopiuj i dostosuj poniższy prompt:

> "Napisz skrypt w Pythonie dla środowiska Google Colab, który:
> 1. Wczyta treść z pliku tekstowego `[NAZWA_PLIKU.txt]`, gdzie artykuły są oddzielone separatorem `---`.
> 2. Oczyści tekst z pozostałości HTML i zbędnych znaków.
> 3. Wykorzysta embeddingi OpenAI do analizy semantycznej.
> 4. Porówna bloki tekstu między sobą i usunie te, które są zbyt podobne (duplikaty treści).
> 5. Wewnątrz każdego artykułu usunie paragrafy, które mają niski similarity score (np. poniżej 0.3) względem naszego słowa kluczowego `[TWOJE_SŁOWO_KLUCZOWE]`.
> 6. Zapisze oczyszczone bloki do nowego pliku, zachowując strukturę oddzieloną separatorem `---`.
> 7. Wyświetli w logach statystyki: ile bloków było na początku, ile usunięto i o ile procent zredukowano treść."

### Praca z kodem i Debugging (Lekcje z boju)

Podczas tworzenia skryptu możesz napotkać problemy. Oto jak sobie z nimi radzić (na podstawie doświadczeń z lekcji):

- **Problem 1: Wynik w jednej linii**  
  AI może "spłaszczyć" wynik do jednej linii tekstu, usuwając znaki nowej linii.  
  *Rozwiązanie:* Wskaż w prompcie: "Zachowaj oryginalną konstrukcję bloków i paragrafów. Nie usuwaj znaków nowej linii (\n) wewnątrz treści."

- **Problem 2: Puste bloki w tablicy**  
  Skrypt może usunąć treść, ale zostawić puste miejsce w tablicy wyników.  
  *Rozwiązanie:* Doprecyzuj: "Usuwaj całkowicie puste bloki z tablicy wyjściowej, nie zostawiaj pustych stringów."

- **Problem 3: Konfiguracja API**  
  AI może hardkodować klucz API lub prosić o niego w inputach.  
  *Rozwiązanie:* Używaj zmiennych środowiskowych (`os.environ`) lub wczytuj klucz z bezpiecznego miejsca w Colabie (Secrets).

### Analiza wyników (Logi)

Dobry skrypt powinien generować logi, które pozwolą Ci ocenić jego skuteczność. Szukaj informacji takich jak:
- **Bloków wejściowych:** np. 8
- **Par zbyt podobnych bloków:** np. 2 (to oznacza wykryte duplikaty)
- **Redukcja treści:** np. 43% (świetny wynik!)

Nie przejmuj się, jeśli w wynikowym tekście pojawią się drobne ucięcia zdań. Na potrzeby RAG i tak będziemy ekstraktować z tego konkretne fakty i encje, a nie kopiować tekst 1:1.

### Następny krok

Masz teraz plik z czystym, skondensowanym "mięsem" wiedzy. To jest Twój fundament. W kolejnych lekcjach użyjemy tych danych do budowy właściwego grafu wiedzy, ekstraktując z nich fakty i encje.

### Co możesz zrobić teraz?

1. Pobierz gotowy skrypt z sekcji "Skrypty" (lub spróbuj napisać własny z promptem powyżej).
2. Wgraj swój plik z treścią do Colaba.
3. Uruchom czyszczenie i sprawdź, o ile procent udało Ci się "odchudzić" tekst.

---

## 📚 Materiały dodatkowe



---

<details>
<summary>📝 Transkrypcja wideo</summary>

W poprzednim filmie pokazywałem Wam, jak pobierać treść z danego adresu URL, tak naprawdę z danej strony internetowej. Przypominam, pokazywałem też, jak oszukuje nasz chat GPT, który mówi, że pobrał treść z tej strony, natomiast ją scholecynował. Cofnę się jeszcze na chwilę, bo myślę, że jest jeszcze jedna ważna rzecz, którą chcę Wam pokazać. Chodzi o same ustawienia. używaliśmy biblioteki Crawl4.ai do crawlowania tych stron i pobrania treści. Jedna rzecz, której nie zdążyłem omówić, ale możemy to zrobić teraz, jest odnośnie konfiguracji samego tego filtra, pruning filter. Pamiętacie, mówiłem o tym, że on porównuje ten similarity score pomiędzy blokami tekstów. Jest jeszcze jedna rzecz, która jest istotna. Możecie poziom tego similarity score ustawiać. Tak jak teraz widzicie, to jest tak zwany trisholt. To jest kosinus, który przyjmuje, dobrze już wiecie, od minus jednego do jednego. Jeżeli pójdziecie w górę do jedynki, to będzie odrzucał wszystko, co nie jest identyczne z nanym zapytaniem. W tej chwili mamy tutaj 0,40, 0,4, czyli dość bardzo tak powiedziałbym, że przepuszczamy sporo kontentu. Poczytajcie sobie jeszcze o ustawieniach. Tu też chodzi o ilość słów w blokach, żebyśmy przepuszczali również bloki, które zawierają jedno słowo. Dlaczego? Bo często na stronach internetowych mamy listy. W tych listach, jeżeli chodzi nawet o artykuły medyczne, są na przykład wylistowane składniki. Szkoda by było to zostawiać. I przechodzą do dzisiejszej już lekcji. I nie przejmujcie się tym, jeżeli ta funkcja czy jakikolwiek inny sposób przepuści Wam tak zwane szumy, a niektórzy to nazywają żwirem. Zobaczcie jak wygląda. Ja już sobie przygotowałem treść pobraną z około pięciu stron za pomocą Crawford AI. Oczywiście możecie się silić na czyszczenie tej treści już od razu przy pobieraniu, żeby ją wgrywać do bazy danych, czy zapisywać do pliku. tak żeby ona była czysta i pozbawiona tych szumów, czy też duplikatów, czyli rzeczy niezwiązanych z daną tematyką. Tak jak tutaj. Zaczynamy od duplikatu. Tu jest coś ucięte. Niestety będziecie mieli, się spotykali z tym bardzo dużo i zaraz powiem dlaczego to nie jest tak najważniejsze. Bardzo dużo adresów URL, jakieś elementy, menu się zdarzają, prawda? Więc nie przyjmujcie się tym. To nie musi być idealne i nigdy, nigdy nie będzie. W moim mniemaniu, jeżeli mamy bardzo dużo bloków tekstów, które już na pierwszy rzut oka opowiadają o tym temacie, wystarczy. Mówiłem też w poprzednim filmie, że będziemy te treści między sobą oddzielać. Możecie zrobić sobie tak zwany separator. Ja tutaj, jak widzicie, teraz to znaczyłem. To są trzy myślniki. Chodzi o to, że jak będziemy ten plik później przetwarzać, to żeby używając, znając ten separator, żebyśmy mogli tekst jeden po drugim odtworzyć. Przejrzymy to sobie. Widzimy tutaj również, czytaj także, czyli jak strona ma sekcje polecane i też jest o zdrowiu, to przy tak małym similarity score, tym trisholdzie, tym progu naszym ustawionym, będziemy też pobierać części leadów innych artykułów. Co widać tutaj? Jest tego sporo. Zobaczcie, dalej z tego tekstu. Co trzeba zrobić z takim blokiem tekstów, które nie nadają się absolutnie do użycia do stworzenia naszego grafu wiedzy? Musimy to wyczyścić. Ja już to robiłem wiele razy, więc podpowiem Wam. Stworzymy razem od początku skrypt, który to zrobi. Tak jak mówiłem, pobrana przez nas treść może być zduplikowana. Tak jak będziecie mieli tutaj to w plikach Markdown, które są do każdej lekcji. Jest pełna zakłóceń tych szumów. Może też zawierać szczątki HTML lub innego kodu i nie być związane z tematem. Naszym zadaniem dzisiejszym na tej lekcji i waszym też mam nadzieję w domu będzie stworzenie skryptu, który za pomocą embeddingów. Pierwszy raz będziemy robić embeddingi sami. Porówna. Zobaczcie, wykorzystujemy zupełnie inne technologie. Embeddingi wysyłamy też do modeli, ale do modeli wektoryzacyjnych, embeddingowych, do zupełnie innych niż modele językowe. Zaraz to też zrobimy. I usunie niepotrzebne bloki. To jest mój autorski pomysł, pewnie ktoś inny też to robi. Ale chodzi o to znowu, żebyśmy mniej więcej to co robi funkcja w Crawford AI, tylko mieli na tym już dużo większą kontrolę, żebyśmy wykorzystali to w naszym skrypcie. Naszym zadaniem jest zamiana tego szumu, tego chaosu, który tu jest, w bloki oddzielone, które będą się różnić między sobą treścią, bo to też jest ważne. Zaraz do tego dojdziemy i będą oczyszczone, będą się nadawały do dalszej obróbki, czyli do generowania grafów wiedzy. Od czego zaczynamy? Zaczynamy od tego, że udajemy się do wybranego przez Was czatu, w którym wypiszemy zadanie. Ważne jest też, żebyśmy używając tak dużej ilości tekstów, to też jest input. Jeżeli oglądaliście pierwszy odcinek, wiecie, że ten pseudo-rack, który robimy, to też jest część promptu i to wszystko będzie wysyłane do LLM-ów. jeżeli będziecie produkować takich artykułów 100, 200, 1000 dziennie to ta różnica w tych tokenach jeżeli będziecie przesyłać 5 bloków tekstów z 5 różnych stron ale to będzie o tym samym mimo, że jest inaczej napisane nie ma sensu jakby zduplikowana tylko w inny sposób nie da się tego dostrzec gołym okiem to jest ta sama treść tylko przepisana przez kogoś innego szkoda, to są bardzo duże pieniądze zajmujemy też na długo model więc to czyszczenie to jest nie tylko czyszczenie śmieci, tych rzeczy, które nie są potrzebne w tych tekstach, ale też porównamy między sobą wszystkie te strony, bloki tekstów i zobaczymy jak można wykorzystać wektoryzację do tego, żeby takich bloków się pozbywać. Czyli pamiętacie, że był hałas przed, zobaczymy na koniec filmu co uda nam się zrobić. Zaczynam pisać prąd, zaraz wam go przeczytam. Myślę, że to ma też zrobioną przeskok, bo dość długo to pisałem, musiałem się chwilę zastanowić. Czytam. Napisz skrypt w Pythonie, w środowisku Google Colab, a jakże, który? Po pierwsze, wczyta bloki tekstu z pliku, podaje nazwę pliku, który wgram do Colaba. Zaraz pokażę Wam, jak to się robi, co jest kolejna nauka. oddzielone separatorem w cudzysłowie te trzy myślniki. To jest mój separator, można by być bardziej skomplikowany. Mi się wydaje, że trzy myślniki nie występują zazwyczaj. Następnie, punkt drugi. Oczyścić z elementów HTML, czyli z różnych śmieci, zostawiając zawartość treści linka. Nie wiem, za bardzo widziałem, jak to jest formułowe, myślę, że to zrozumie. Wykorzysta wektoryzację embeddingów. Masło maślane, bo embeddingi to sobie wektory. Open a do porównania między sobą bloków tekstu, czyli tych dużych bloków tekstów. Porównam między sobą, zobaczymy, które są zbyt podobne, które trzeba sunąć. Wskażę główne bloki oddzielone znowu też, przypominam mu, które są do siebie zbyt podobne, to co przed chwilą mówiłem, oraz w ramach każdego z tych bloków, czyli już wewnątrz tej treści, która została pobrana ze stron, nadążacie, paragrafy, pełne linie i tym podobne. Usunię te bloki tekstu, które mają similarity score, czyli ten kosinus. Znowu mu przypominam niższy niż 0,3. Czyli to są już te śmieci. Będziemy mogli zapewne tym sobie manewrować. Co jeszcze? Zapisz wyświetl odpowiedź. Wyświetl oczyszczony bloki. A teraz zapisz do tego pliku. Dodaj konfigurację słowa kluczowego oraz triskodów, czyli tych progów similar triskod. Wysyłamy. Teraz dzieje się magia. W tym czasie, kiedy tutaj już cloud nam tworzy, pokażę Wam jak przesłać plik. jest bardzo proste, wchodzimy w tą ikonkę folderu tutaj możemy sobie grać plik, ja już go sobie przygotowałem w naszym kurtizowskim pipeline'ie, to jest ten content to jest ten content, który wam pokazywałem na samym początku on jest nieoczyszczony mamy go wgranego, ja podałem nazwę tego pliku prawdopodobnie będziemy musieli jeszcze się odnieść do całej ścieżki, zobaczymy jak on to zrobi wracamy do clouda na bank będzie potrzebne nam wczytanie klucza już open.i mamy nie chciałem robić jiminaju, żeby znowu nie musieć kopiować kolejnego klucza tak naprawdę modele ambeddingowe bardzo dobrze czy w open.i czy w jiminaju się sprawują nie sprawdzałem tych z z Clouda nie ma to w tej chwili dla takiego zadania nie ma żadnego znaczenia wykorzystajmy już to co mamy jeszcze raz to się upewnia, że został wczytany ten klucz dodamy sobie sekcję kolejną naszą oczywiście na spot ją sam teraz mamy oczyszczenie kontentu i czekamy na to co nam zaproponuje Cloud nazwa to Content Similarity Cleaner bardzo ładna nazwa opisał nam tutaj dokładnie o co chodzi mamy konfigurację, keyword między blokami paragraf z naszym keywordem nazwa pliku wchodzącego nazwa wchodzącego i model zobaczymy jak to się sprawdzi. Oczywiście zaraz musimy się przejrzeć też gdzie zdefiniowany jest ten klucz nasz. To są te ustawienia, o których mówiłem. Aby dodał minimalny rozmaity paragrafów w znakach do analizy. Bardzo dobrze, nie chcemy analizować każdego pojedynczego słowa. API key tutaj jest. Config API key. To musimy to podmienić dokładnie z tej nazwy, jaką mamy w konfiguracji. Oczywiście jeżeli będziemy zaraz zmieniać ten skrypt, jeżeli coś nie będzie działać, to wgramy od razu tą nazwę, poprosimy, czy JGPT, czy tutaj Clouda, żeby używał już tej nazwy. Chcamy, podmieniamy sobie ten nasz API key. I zobaczymy, co nam tu wyszło. O, widzicie, to jest konfiguracja, także można to jeszcze wczytywać. To nie to. Nie sprecyzowałem znowu tego. Cloud na nowym wątku stworzył możliwość konfiguracji. To będzie bardzo upierdliwe. Zaraz to pewnie zmienimy, chyba że zadziała nam skrót, czy więcej do niego nie wrócimy. Ale tak, to muszę skopiować cały klucz. Zobaczymy co tu się dzieje w logach. Cały 40 sekund. Już wiemy, że zapisał nam plik. Ale sobie przyczynamy się jak to weszło. Podsumowanie. Bloków właściowych 8. par zbyt podobnych bloków. Dwa, widzicie, znalazł nam. Czyszczone bloki, blok pierwszy, blok drugi, pusty blok, blok trzeci. Wszystko oczywiście w jednej linii. Możemy na tym pokracować. A ja bym się przyjrzał, jak wygląda ten nasz plik wyjściowy. Tak i zobaczcie co się stało. Mamy wyczyszczone bloki mamy plik i wszystko jest w jednej linijce. Ja bym to chyba zapisał i skopiował i pokazał znowu do do cloud'a. To nie do końca nam o to chodziło. Musimy wskazać teraz wszystko co nam się tu nie podoba. Ale dobra najpierw ja mu to napiszę. Musimy też pokazać ten output z tego skryptu. Zapamiętajmy też o tym kluczu. Pierwsza, czyli UCH API znajduje się w zmienę. Nie muszę skopiować tą zmienną. Już nie będziemy więcej mieli, ile razy będziemy mieli poprawiany ten skrypt. Już więcej nie będziemy musieli do tego wracać. W tym przypadku. Dwa. Czy puste bloki to te usunięte? 3. Zachowaj oryginalną konstrukcję bloków z przeniesiami do nowej linii. 4. Nie koduj. Odpowiedz najpierw na pytanie. Cloud, wspominałem to w którymś filmie, jest nadgorliwy. Zanim wam odpowiem na pytanie, zacznij kodować. Później od tego pytania zależy, co wy chcecie. Poprosicie go jeszcze raz, trzeba będzie wszystko napisywać. Apiki, podmienię, puste bloki. Niepuste bloki to nie są usunięte bloki. w obecnej logice. No dobrze, OK. Czyli on dobrze to zrobił tylko nie zrozumiał, że w ogóle chcemy się pozbyć bloków z tej tablicy oddzielonej myślnikami. Czytam sobie, jeżeli chcesz mogę dodać opcję faktycznego usuwania duplikatów bloków. Dobrze. Odpowiem mu teraz na pytanie, które on mi zadał odnośnie całego skryptu. Usuwać paragrafy. Zachować konstrukcję. z oryginałów oprócz usuniętych. Widzicie, wcześniej też już odnotował, że ten API key będzie już czytywany ze zmiennej. I co jeszcze chciałem usuwać z tablicy całkowicie podobne bloki, nie zostawiając pustych przestrzeni. I dodam mu, sprecyzuję, że tablica to bloki oddzielone tym naszym separatorem, czyli trzech myślnikami. Dla bezpieczeństwa możecie dać z pięć myślników, albo dać jeszcze jakiś nawiasek kwartorowy. Zobaczymy, co on nam teraz na to. Prawdopodobnie zacznie nam kodować. Jeżeli korzystacie z cloud'a to wszystkie artefakty, czyli wszystkie te skrypty, które on tworzy i różne wersje są po kliknięciu w tą ikonkę w prawym górnym rogu. Teraz poprawię skrypt. To nie jest prosty skrypt. Muszę wam powiedzieć, że dojście do takiego momentu, w którym naprawdę będziemy zadowoleni zajmuje trochę czasu. Natomiast moim zdaniem osobiście warto się tym pobawić, żebyście widzieli z czym czasami trzeba się zmierzyć. Jeżeli nie, to czy na kohorcie, czy w zajęciach grupowych dostarczę wam swoje rozwiązanie gotowe, ale wolałbym tego nie robić jeszcze na tym etapie, żebyście nie chodzili drogą na skróty. 20 minut później. Słuchajcie, tego można było się spodziewać. Trochę musiałem powalczyć tutaj z tym skryptem. Wy też pewnie będziecie musieli albo nie, bo przy tej lekcji dostanie się gotowe rozwiązanie. Co robiłem? Cały czas nie mogłem się dogadać z cloudem, który mi nie do końca realizował to, co ja chciałem, a jeżeli to realizował, to wymysł jeszcze do jakichś dodatkowych rzeczy. Później zacząłem pracować na zasadzie pokazania mu dokładnie, jeszcze raz pokazania mu jaki był output, jakie były zanieczyszczenia, jaki był jego output. Napisałem, że to nie dokładnie o to mi chodziło, że zupełnie to powinno inaczej wyglądać. On to wtedy zrozumiał, zaczął przebudować ten skrypt. Po paru takich iteracjach udało się to zrobić. Ten skrypt pokażę wam, jak też ma dość dużo logów. Będzie widać po prostu, co zostało wyczyszczone, jak zostało wyczyszczone. I pokażę wam finalny skrypt wyczyszczony, finalny output, bloki tekstów. tu są nasze ustawienia jak wiadomo było 8 bloków tutaj widać jak zamienione building porównywał między sobą fajnie jest jak prosicie przy vibe codingu o generowanie dużej ilości blogów czy debugging czyli tak zwane pokazywanie wszystkich możliwych rzeczy żebyście w logach widzieli co się dzieje wokół wyjściowych, zduplikowanych linii tu wszystko mamy w raportach redukcja o 43 procent. To jest bardzo dużo i to też, tak jak powiedziałem, my ten blok, te bloki contentu będziemy wrzucać na szczęście chyba tylko raz albo dwa razy do LMA, po to, żeby zwycił tą informację. Nie będziemy musieli tego ponawiać na każdym kroku, ale 43% to daje nam ogromne oszczędności wszystkiego, ale przede wszystkim też to, że nie każdy model językowy czy reżynigowy ma takie duże okno dialogowe. Czyli nie każdy przyjmie takiej ilości tekstu. Jeżeli to jest duża fraza, tego kontentu jest dużo, to będziemy mieli problem. Jak to wygląda w praktyce? Finalny. I teraz tak, zacznę od góry. Widzimy, że to coś zostało ucięte. Nie do końca jestem pewien, na którym etapie to zostało ucięte, czy na etapie scrapingu, w KRAW4AI, bo też się zdarzają takie rzeczy, czy na innym etapie nie przejmujemy się tym absolutnie, bo jeszcze raz my tej treści nie będziemy używać, a broń Boże nie chcemy też, żeby dostarczać tę treść jako rak, żeby nie były kopiowane jednym do jednego niektóre zdania. Jeżeli przyjrzymy się dalej, to ten content wygląda całkiem nieźle i ma już tą treść, która nas interesuje odnośnie samego kortyzolu. Wiadomo, że też ja skrapowałem dużo mniejszą ilość stron. Tam chyba było 5. Po wyczyszczeniu zostały chyba nam 4. Tak naprawdę istotne bloki 2 albo 3. Dobrze. I to by było na tyle na tym etapie. Jeszcze raz wrócę do tego, dlaczego to robimy. Dlatego, żebyśmy budując graf wiedzy w tym grafie nie dostali żadnych śmieci. czy żadnych zakłóceń, bo to wpływa na jakość naszego naszego kontentu całego końcowego na tym całym wodospadzie. Ale jeszcze zanim to nastąpi poproszę Klauda żeby podsumował co robi ten skrypt i wkleje to do notatnika do markdowna z tej lekcji. Dopiszę to tam żebyście wiedzieli żebyście też mogli wykorzystać. żebyście skorzystali z tego, na czym ja się teraz namęczyłem. Może być może z gotowca, ale jeżeli będziecie z niego korzystać, to żebyście dobrze wiedzieli, czy go zmieniać, przekształcać, to żebyście dobrze wiedzieli dokładnie, co robi ten skrypt. Napiszmy readme do tego skryptu, co robi, jakie technologie wykorzystuje i co w nim ostatecznie zastosowaliśmy oczywiście po polsku. Ja wam teraz pokażę. Ten plik za chwilę już od razu umieszczam. Tutaj w naszym dokumencie dotyczącym tej danej lekcji, przypominam każda lekcja ma moje notatki większe, mniejsze. Tutaj też będziecie mogli sobie zajrzeć do spisu treści. Te pliki są wgrane w folderze dokumenty. Lekcja po lekcji. Będę się staro update'ować to też i zrobić tak, żeby jakiekolwiek informacje, które jeszcze wynikły z nagrywek były w tych plikach. My jesteśmy przy czyszczeniu pobranej treści i tutaj wstawię Wam to, co mi napisze przez PhiloCloud, a natomiast sam skrypt będzie do pobrania w dziale skrypty. Kupuję zawartość. I tu już macie wszystko. Możecie to też wziąć, wykorzystać, jeżeli będziecie się bawić, tak jak ja robiłem od początku, to możecie ten Ritmy, tak naprawdę już ze wszystkie technologii, wszystko co zrobiliśmy wykorzystać, wrócić do Cloud czy do Chachubit czy PT, żeby zobaczyć jak uda Wam się stworzyć taki skrypt, który będzie czyścił te dane. Trzymam kciuki. 

</details>

---

<div class="lesson-completion-bottom" data-lesson-id="ai-content-expert/blok-2/lekcja-4"></div>

<div id="sensai-comments"></div>


---

# 2.5 Ekstrakcja faktów i ideations

<div class="lesson-meta">
  <div class="lesson-mentor">
    <img class="lesson-mentor__avatar" src="https://framerusercontent.com/images/t2GGO1yled5Z8wSFTTJMQHHzd4.png?scale-down-to=512&width=2976&height=2949" alt="Maciej Chmurkowski" />
    <span class="lesson-mentor__info">
      <span class="lesson-mentor__label">Mentor</span>
      <span class="lesson-mentor__name-text">Maciej Chmurkowski</span>
    </span>
  </div>
  <div class="lesson-rating" data-lesson-id="ai-content-expert/blok-2/lekcja-5"></div>
  <div class="lesson-completion" data-lesson-id="ai-content-expert/blok-2/lekcja-5"></div>
</div>

<div style="position:relative;padding-top:56.25%;"><iframe src="https://player.mediadelivery.net/embed/565073/1fae3777-11c0-407e-ba32-d2032be35088?autoplay=false&loop=false&muted=false&preload=true&responsive=true" loading="lazy" style="border:0;position:absolute;top:0;height:100%;width:100%;" allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;" allowfullscreen="true"></iframe></div>

<br />



## 🎯 Cel lekcji

Celem tej lekcji jest przetworzenie „surowego” tekstu w ustrukturyzowaną bazę wiedzy przy użyciu modelu językowego (LLM). Dzięki temu procesowi zredukujesz ilość przesyłanych tokenów do 5-10% pierwotnej objętości, jednocześnie drastycznie zwiększając jakość finalnych treści i eliminując ryzyko halucynacji.

---

## 📒 Notatka z lekcji

Przechodzimy od technicznego przygotowania danych (pobieranie i czyszczenie) do pracy koncepcyjnej.

### Czym jest graf wiedzy w tym kontekście?

Wiele osób utożsamia graf wiedzy wyłącznie z encjami (pojęciami). W naszym podejściu graf wiedzy składa się z trzech filarów, które będziemy ekstraktować z tekstów:

1. **Fakty** – Konkretne, sprawdzone informacje zawarte w tekście (np. definicje, zależności przyczynowo-skutkowe).
2. **Dane mierzalne** – Liczby, statystyki, wymiary i czasy. Są to dane twarde, które budują autorytet artykułu (np. „zalecana długość snu: 7-8 godzin”).
3. **Ideations (Idee i pomysły na content)** – To koncepcje wynikające z tekstu, które sugerują, jak można urozmaicić treść. Nie chodzi o pisanie artykułu, ale o wyłapanie pomysłów na dodatki, takie jak checklisty, mini-kursy, ramki „warto wiedzieć” czy nawyki do wdrożenia.

### Przygotowanie Promptu: Struktura i Logika

Aby wyciągnąć te dane, nie potrzebujemy skomplikowanych skryptów Pythonowych (choć można to zautomatyzować). Kluczem jest precyzyjny prompt wysłany do modelu (np. GPT-4).

Oto elementy składowe promptu, który budujemy w tej lekcji:

1. **Rola (Role):** Nadajemy modelowi rolę analityka danych, który ma również doświadczenie w edycji tekstu.  
   *Przykład:* „Działasz jako doświadczony analityk danych i edytor treści”.

2. **Cel (Objective):** Jasno określamy zadanie: ekstrakcja konkretnych typów danych z dostarczonych bloków tekstu.  
   *Instrukcja:* „Twoim zadaniem jest ekstrakcja danych z poniższych bloków tekstu: faktów, danych mierzalnych oraz ideations”.

3. **Kontekst i Ograniczenia (Context & Constraints):** To najważniejszy bezpiecznik. Musisz podać główne słowo kluczowe/temat (np. Jak obniżyć kortyzol po 40).  
   *Zasada:* Model ma ignorować wszystko, co nie jest związane z tym tematem. To ostatni etap czyszczenia danych ze „śmieci”, które mogły przetrwać wcześniejsze etapy.

4. **Wytyczne dla Danych Mierzalnych (Guidelines):** Aby dane były użyteczne maszynowo, narzucamy format.  
   *Wzór:* Definicja – Wartość – Jednostka.  
   *Przykład:* „Średnia waga mężczyzny po 40 – 80 – kg”.

### Proces Ekstrakcji Krok po Kroku

**Krok 1: Zgromadzenie wsadu**  
Jako input (wejście) wykorzystujemy bloki tekstu oczyszczone w poprzedniej lekcji. Mogą one pochodzić ze stron internetowych, ale także z zeskanowanych książek czy dokumentów PDF. Oddzielamy je separatorem (np. `---`).

**Krok 2: Konstrukcja promptu**  
Piszemy prompt (można po polsku, model sobie poradzi, choć docelowo w automatyzacji warto używać angielskiego). Zawieramy w nim instrukcje, aby nie duplikować danych i zwracać wynik w czystej formie (bez zbędnych komentarzy).

**Krok 3: Analiza wyników (Output)**  
Po wysłaniu zapytania do modelu otrzymujemy uporządkowaną listę.
- **Fakty:** Np. „Kortyzol jest hormonem steroidowym produkowanym przez nadnercza”.
- **Dane:** Np. „Czas wykonania badania: 15 minut”.
- **Ideations:** Np. „Stwórz checklistę codziennych nawyków obniżających stres” lub „Mini-kurs technik oddechowych”.

### Dlaczego ta metoda jest skuteczna?

- **Oszczędność Tokenów:** Zamiast wysyłać do modelu generującego artykuł 10 stron surowego tekstu, wysyłasz tylko listę wyekstraktowanych faktów. To ogromna oszczędność kosztów API.
- **Eliminacja Halucynacji:** Model generujący treść nie musi „wymyślać” faktów. Dostaje je podane na tacy. Jeśli w bazie wiedzy jest napisane, że badanie trwa 15 minut, model użyje tej konkretnej liczby.
- **Wysoka Jakość:** Dzięki sekcji Ideations Twój artykuł zyskuje unikalne elementy (ramki, listy), które wyróżniają go na tle konkurencji kopiującej „suchy” tekst.

### Następny krok

Twoim zadaniem jest przetestowanie tego podejścia ręcznie w ChatGPT. Skopiuj oczyszczone bloki tekstu z poprzedniej lekcji, użyj skonstruowanego promptu i zobacz, jakiej jakości dane otrzymasz.

---

## 📚 Materiały dodatkowe





---

<details>
<summary>📝 Transkrypcja wideo</summary>

*(Transkrypcja zostanie uzupełniona)*

</details>

---

<div class="lesson-completion-bottom" data-lesson-id="ai-content-expert/blok-2/lekcja-5"></div>

<div id="sensai-comments"></div>


---

# 2.6 Ekstrakcja encji i relacji

<div class="lesson-meta">
  <div class="lesson-mentor">
    <img class="lesson-mentor__avatar" src="https://framerusercontent.com/images/t2GGO1yled5Z8wSFTTJMQHHzd4.png?scale-down-to=512&width=2976&height=2949" alt="Maciej Chmurkowski" />
    <span class="lesson-mentor__info">
      <span class="lesson-mentor__label">Mentor</span>
      <span class="lesson-mentor__name-text">Maciej Chmurkowski</span>
    </span>
  </div>
  <div class="lesson-rating" data-lesson-id="ai-content-expert/blok-2/lekcja-6"></div>
  <div class="lesson-completion" data-lesson-id="ai-content-expert/blok-2/lekcja-6"></div>
</div>

<div style="position:relative;padding-top:56.25%;"><iframe src="https://player.mediadelivery.net/embed/565073/38d677c6-c43d-41ea-936b-45795234dd09?autoplay=false&loop=false&muted=false&preload=true&responsive=true" loading="lazy" style="border:0;position:absolute;top:0;height:100%;width:100%;" allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;" allowfullscreen="true"></iframe></div>

<br />



## 🎯 Cel lekcji

Nauczenie się ekstrakcji encji (podmiotów, obiektów, koncepcji) oraz relacji między nimi za pomocą promptów.

---

## 📒 Notatka z lekcji

W poprzednich lekcjach nauczyliśmy się pobierać URL-e, ekstraktować z nich treść oraz wyciągać fakty i dane mierzalne. Teraz przechodzimy do poziomu wyżej – zajmiemy się encjami (entities) i ich relacjami.

To właśnie te elementy tworzą strukturę, którą algorytmy (takie jak Google czy LLM) rozumieją najlepiej. Budujemy w ten sposób właściwy graf wiedzy, który posłuży nam do generowania treści najwyższej jakości.

### Czym są encje? (To nie są słowa kluczowe!)

Dla algorytmu "ładny język" to tylko ciąg tokenów bez znaczenia. Encje nadają temu szumowi strukturę.

**Definicja:** Encja to byt, węzeł w sieci, który można zdefiniować. To obiekt, pojęcie, osoba lub miejsce.

**Różnica:** Encja to sens i kontekst, a nie tylko ciąg znaków (słowo kluczowe). Na przykład "Kortyzol" to dla modelu nie tylko słowo, ale "hormon steroidowy wpływający na stres".

**Przykładowe typy encji:**
- **Person:** Osoba (np. Marcin Iwiński).
- **Organization:** Firma, instytucja (np. CD Projekt SA).
- **Location:** Miejsce (np. Warszawa, Polska).
- **Product:** Produkt (np. gra Wiedźmin).
- **Concept:** Idea, pojęcie abstrakcyjne (np. stres, sen) – tu należy uważać na halucynacje modeli.

### Czym są relacje?

Sama lista encji to za mało. Aby zbudować graf wiedzy, musimy wiedzieć, jak te byty na siebie oddziałują.

*Przykład:* Kortyzol (Encja 1) -> wpływa na (Relacja) -> Sen (Encja 2).

Typy relacji: "jest częścią", "zlokalizowany w", "stworzony przez", "pracuje dla".

### Metoda 1: Ekstrakcja za pomocą LLM (Prompting)

Najprostszym, a zarazem bardzo skutecznym sposobem jest wykorzystanie modelu językowego (np. GPT-4). Model ten "rozumie" tekst semantycznie i potrafi zwrócić wynik w ustrukturyzowanej formie (JSON).

**Struktura Promptu:**
- **Rola:** "Jesteś analitykiem semantycznym".
- **Zadanie:** Wyekstraktuj encje i przypisz im relacje na podstawie tekstu.
- **Format:** Wymuszamy format JSON (ułatwia to dalszą automatyzację).

**Ograniczenia:**
- Ekstraktuj tylko z podanego tekstu (zakaz wymyślania/halucynowania).
- Używaj tylko zdefiniowanych typów encji (Person, Org, Loc, etc.).

**Zaleta:** Wysoka jakość zrozumienia kontekstu, świetne opisy (evidence).  
**Wada:** Wyższy koszt (tokeny) i wolniejsze działanie przy masowej skali.

#### 📥 Sekcja Pobierania: Metoda LLM

W tym miejscu możesz pobrać gotowy prompt omawiany w lekcji, służący do ekstrakcji encji wraz z relacjami do formatu JSON.



### Metoda 2: Ekstrakcja za pomocą Pythona (NLP)

Dla większej skali i oszczędności kosztów używamy bibliotek Pythonowych. W lekcji testowaliśmy dwa podejścia w środowisku Google Colab:

1. **spaCy:**
   - Działa szybko i "sztywno".
   - Jest restrykcyjna – znajduje mniej encji, ale są one zazwyczaj pewniejsze.
   - Wymaga odpowiedniego modelu językowego (np. `pl_core_news_sm` dla języka polskiego).

2. **Transformers:**
   - Podejście eksperymentalne.
   - Znajduje bardzo dużo encji, ale generuje sporo szumu (np. całe zdania jako encje).

**Problem "Sierot" (Orphan Nodes):** Często algorytmy NLP znajdują encję (np. "Gra Cyberpunk"), ale nie potrafią przypisać jej relacji do głównego wątku. Takie "osierocone" węzły należy albo usunąć, albo naprawić w kolejnym kroku.

#### 📥 Sekcja Pobierania: Metoda Python

Tutaj znajdziesz skrypt do Google Colab, który wykorzystuje biblioteki spaCy oraz Transformers do automatycznej analizy tekstu.



### Wnioski i rekomendowana strategia (Hybrid Pipeline)

Ekstrakcja encji jest trudna i żadna metoda nie jest idealna. Najlepsze rezultaty daje połączenie obu światów:

1. **Ekstrakcja wstępna:** Użyj Pythona (spaCy/Transformers), aby szybko wyciągnąć kandydatów na encje z dużej ilości tekstu.
2. **Deduplikacja i łączenie:** Usuń powtórzenia i połącz podobne byty.
3. **Weryfikacja LLM:** Przepuść wynikowy JSON przez model językowy (np. GPT-4o mini), aby:
   - Usunąć błędy i szum.
   - Naprawić relacje (połączyć "sieroty").
   - Dodać brakujące konteksty.

Tak przygotowany wsad (JSON z faktami, danymi i encjami) jest gotowy do użycia w procesie generowania ostatecznego artykułu.

---

<details>
<summary>📝 Transkrypcja wideo</summary>

Postaram się podsumować do czego doszliśmy już w naszym pipeline, w całej strukturze nagrywania naszych filmików. Jak widzicie tutaj na spisie treści doszliśmy do ekstrakcji encii i relacji, a to co zrobiliśmy wcześniej to ekstrakcja faktów i danych z bloku tekstu, a blok tekstu pozyskaliśmy wcześniej z URL, a URL pozyskaliśmy z SERPów na dane słowo kluczowe, na które też piszemy na jednym tuchu. nasz artykuł. Chciałbym nagrywać ten film, ale nagraliśmy z Mateuszem świetny webinar, w którym po pierwsze mamy całą teorię, czym są encje, po drugie stworzyliśmy podczas, pokazywałem podczas webinaru, jak wygląda prompt i jak wygląda pozyskiwanie tych encji za pomocą modeli językowych i stworzyliśmy skrypt, który pozyskuje NCię za pomocą Pythona. Dlatego też tutaj mam pusto. Myślę, że nie ma sensu powtarzania tego wszystkiego i nagrywania. Zapraszam Was do obejrzenia webinaru, a wszystkie pliki, wszystkie skrypty i prompty, które są w webinarze będą dostępne oczywiście w ramach tego kursu w odpowiednich miejscach, czyli w katalogu prompty i w katalogu skrypty. Jak już wspomniałem, jak wspomnieliśmy tak naprawdę, Śmierć, podatki, NC to trzy pewne rzeczy w życiu. To jest parafraza pewnego żartu, ale my się skupimy na NC. Musicie zrozumieć przede wszystkim, jak NLP widzi swój tekst. Ja to powtarzam na wielu moich prezentacjach, na konferencjach. Ostatnio też w Gdańsku, w przypadku mówiłem o tym samym temacie. Nie będę wchodził w szczegóły, ale musicie zrozumieć, że bardzo ważne jest zrozumienie tego, jak z analogowego tekstu przechodzimy do cyfrowego jego przetwarzania, ale przede wszystkim rozumienia, rozumienia w kontekście semantyki. Nie będę wchodził w szczegóły, ale tekst to jest ciąg z tokenów i jeżeli są tokeny, to nie ma hierarchii, tak naprawdę nie ma jeszcze oznaczenia, który token jest najważniejszy. Później następuje ta warstwa, przy tym NLP, warstwa zrozumienia i tutaj w pewnym momencie też ekstraktowane są, rozpoznawane są encje. Czyli tutaj zrobiłem takie świetne podsumowanie. Dla algorytmu ładny język to tylko szum bez struktury. Czym są encje? Encje to są byty. Ja wielokrotnie próbowałem to zdefiniować. Ja to nazywam węzłem, czyli coś, co może być zdefiniowane i coś, co może mieć relacje. A encje też mają relacje przede wszystkim do głównego tematu, ale też encje mają relacje między sobą. I tak jak tutaj widzicie, będziemy dzisiaj się posługiwać w wielu przykładach tematyką kortyzolu. To jest mój ulubiony temat, jak obniżyć kortyzol po 40. Też na prezentacjach go stosuję. Jak tutaj widzicie na screenie mamy fragment tekstu. Badanie wykazały, że kortyzol i sen mają znaczący wpływ na układ nerwowy. Szukamy bytów, szukamy pojęć i szukamy obiektów. Tutaj zdefiniowałem to jako kortyzol i sen i układ nerwowy. Czyli coś, co może być zdefiniowane i coś, co może mieć relacje pomiędzy sobą. Możemy powiedzieć, że to są takie nasze punkty odniesienia w morzu tekstu. Musicie wiedzieć, że encje to nie są słowa kluczowe. I tu też będziemy to pokazywać na podstawie ekstrakcji encji z modeli językowych, ponieważ model językowy tak naprawdę trochę zgoduje, czym są encje. próbuje to zrobić dobrze, zależy od promptu, ten prompt dostaniecie, ale musicie wiedzieć jedno, że to nie jest to słowo kluczowe. Encie to jest sens, to nie jest fraza, to nie jest słowo kluczowe, które będziecie wrzucać do tekstu. To coś, co ma koncert, tak jak tutaj widzicie, kortyzol, a nie hormon stresu. Encie mają swoje typy i mają pewną klasyfikację. W zależności od tak naprawdę systemu czy modelu NLP, który te NC Outboard poznaje albo tworzy, są różne typy i klasyfikacje, ale jeżeli poczytacie sobie w internecie, to będziecie wiedzieli, że jest paru głównych, tutaj na przykładu je dałem, typu osoba, organizacja, location, czyli polska, lokalizacja, czy to jest produkt, czy nawet koncept. Od końca będzie dawał nam dość dużo, zwłaszcza w obrębie LMów, bardzo dużo halucynacji, więc ja bym też bardzo mocno z tym uważał. I takie typy możecie sami definiować, albo możecie dotrzeć do bibliotek, które mają to zdefiniować i taką bibliotekę tych typów sobie ułożyć i jej używać. Ja zazwyczaj układam, m.in. te, które są tutaj, po to, żeby je stosować we wszystkich możliwych miejscach, w których albo rozpoznaję ENCię, albo ich szukam. I sama lista ENCI to jest za mało. Coś, co wspominałem wcześniej, coś, co wspominałem też na swoich prezentacjach. ENCIA musi mieć relacje. Są różne relacje, ENCIA do ENCI, ENCIA do głównej tematyki. Czyli na przykładzie kortyzolu. Kortyzol wpływa na sen. I relacje możecie ustawiać, jakie robimy relacje, ustawiam na poziomie numerycznym, czyli na przykład od 0 do 100, czyli jak bardzo kortyzol jest powiązany ze snem. To nie dawało takich efektów jak teraz. Daje mi relacja, która jest zdefiniowana tekstowo. Jest też dużo łatwiejsza do interpretacji w grafie wiedzy przez modele językowe. Typy relacji jeszcze są kolejne, czyli to coś zostało stworzone przez coś, ktoś pracuje dla kogoś. Tu też możecie je zdefiniować na twardo, nie musicie tego robić, Nie musicie tworzyć tej biblioteki w locie, bo możecie mieć tych typów znowu bardzo dużo. Czy coś jest relacją do czegoś, czy coś jest powiązane, czy coś wymaga. To są rzeczy, które też świetnie opisują encję. Zajmiemy się dzisiaj na naszej praktycznej części dwiema ekstrakcjami. Porównamy to sobie, jak to wygląda. Pierwsza to będzie ekstrakcja przez LLM, czyli mamy tekst i wyciągamy z niego za pomocą jednego promptu, nic prostszego. A następnie będziemy to robić za pomocą bit.nrpi. Zobaczycie sami, może na tym przykładzie się też to uda wywołać, że ten pierwszy sposób daje nam dość dużo helocynacji. Ważne jest to, że te relacje muszą wynikać nie z wiedzy modelu, np. tylko z danego tekstu. Im mniejszy tekst, tym trudniej te encje wydobyć. I teraz jak to będzie wyglądało w praktyce? Mamy czysty tekst, później następuje ekstrakcja tych encji, budujemy, tak to też jest w promcie, budujemy relacje, czyli mapujemy te relacje i z tego co można zbudować? Można zbudować knowledge graph. Dla mnie knowledge, graf, czyli graf wiedzy to nie jest tylko oparty na ENC. Zapraszam oczywiście do mojej ścieżki content generation expert. Graf wiedzy to są również fakty, są również ideacje, czyli pomysły na napisanie danego tekstu no i oczywiście wspomniane ENC. Przejdźmy teraz do praktyki. Ja potrzebuję się przełączyć na chwilę na inną zakładkę, także przerwam udostępnianie. Tutaj widzę, że Teszek prosił, żeby było trochę głośniej. Zaraz uciekam jak zawsze do Ciebie jestem. Możliwe. Czekajcie sobie zweryfikuję tylko okno, bo mam gdzieś oczywiście bardzo dużo. Dobra. Będziemy posługiwać się Collabem, ale na początek zaczniemy od samego promptu, który ja też tutaj zapisałem w Google Collab. To jest notatnik, to jest takie środowisko, w którym możecie wywołać skrypt Pythonowy bez posiadania serwera i bez tak naprawdę wielkiej wiedzy na temat programowania. Ale ja tutaj umieściłem sam skrypt po to, żebyście zrozumieli, jak on wygląda. Przepraszam, prompt. Oczywiście prompt zostanie przesłany do was mailowo, również po tym webinarze, ale wygląda on mniej więcej tak samo. Ja nie wiem, czy będzie dobrze widać na ekranie. Staram się, żeby to było jak najmniej. Ja myślę, że jest wiele dobrze. Zawsze mogę to trochę jeszcze powiększyć, żebyśmy mogli się przyjrzeć. Schowałem ciebie na razie i powiększałem jeszcze bardziej. Super. Zaczynamy oczywiście też w kursie. Będziecie widzieli, jaki SMS stosuję do promptowania, wejścia w rolę. Ja tutaj dałem, że jesteś analitykiem semantycznym, czyli zaciśniamy tę rolę modelu językowego. zadanie, musisz wyekstraktować encję oraz przypisać dla nich relacje na podstawie tekstu. Nasz ten prompt wymusza zadanie tej struktury jsonowej, jakby tej temu odputowej, czyli te odpowiedzi, czyli to nie będą tylko encje wymienione, w tym jsonie będą też również relacje. Może to się wydać Wam skomplikowane, ale wystarczy, że w tym promcie zmienicie sposób odputu i może Wam wyświecić szczęcie w postaci csvki bądź po prostu w postaci listy. Ja wiem, że trudniej się pracuje z JSON-em, ja jestem do tego przyzwyczajony, jeżeli ktoś jest koperaterem, to chciałbym pewnie mieć listę NC z samymi relacjami, co by było dużo prostsze. Następnie następuje lista reguł. Oczywiście prosimy go, bo model językowy zacznie halucynować, żeby wyekstraktował tylko NC, które znajdą się w tym tekście. przede wszystkim, żeby nie tworzył nowych emci, które są może w obszarze tematycznym, ale nie ma ich w nowym tekście. Wiadomo, że to trzeba parę rzeczy, wiele razy trzeba powtarzać modelowi, żeby pewne rzeczy nie robił. Tak jak na przykład nie ma żadnego tekstu na zewnątrz JSON-a, żadnego markdowna, żadnego komentu, to jest standard oczywiście. I teraz tak, to o czym mówiłem. Wymieniam od razu w prompcie, jakie są dozwolone typy tych NC, czyli person, organization, location, product, concept, event. I on już w tym momencie nie wyjdzie i nie stworzy nam żadnego typu. Jeżeli tego nie zrobicie, to macie szansę, że on będzie w nieskończonej te typy wymyślał. Później jakie są typy relacji, czyli jest part of, czy jest częścią czegoś, czy jest locate in, czyli jest zlokalizowany w, stworzony przez, pracuje dla kogoś. Sami widzicie się tutaj, możecie to sobie przeanalizować. No i później już same reguły dotyczące NC i ich relacji. Nie będę się w to zagłębiał, możecie to przeanalizować. Zależy mi na tym, żebyście zobaczyli, jak to działa w praktyce. Zaraz się przełączymy na byłe Playground, czyli chat, czyli API w OpenAI. Jeszcze końcówka JSON-schema, czyli jak to ma wyglądać. Pewnie Wam teraz niewiele to powiem, może być niewidoczne. natomiast tutaj wskazujemy modelowi jaki ma być output. Przypomnienie i oczywiście input. Jak to wygląda w praktyce? Ja tylko się upewnię, że teraz widać chat GPG. Tak. Znaczy to nie jest na chat GPG. To jest playground. Playground nie istnieje. W ogóle coś dziwi mi się ostatnio, bo dawa mnie wynął w gruncie. Są tylko teraz chaty i można te prompty zapisywać, ale oczywiście mamy też tutaj dostępne wszystkie parametry. Zaczniemy od modelu GPG 4.1. Dlaczego model językowy, a nie reasoningowy? Tokeny, koszty. Zaraz zobaczycie jak to wygląda na jednym, na drugim. GPT-4.1 chyba ostatni jest modeli tych stricte językowych w OpenAI. Macie parametry. Zmniejszymy temperaturę, bo według mnie do ekstrakcji nie jest potrzebna. Jedynka to jest model bardzo z rozbudowaną wyobraźnią. Jeżeli mamy tekst i wyciągamy coś z niego, to nawet nie wiem czy 0,5 nie jest za dużo. Oczywiście zwiększamy liczbę tekstów. To są takie standardowe ustawienia modeli językowych. Jak widzicie tutaj jest nasz prompt z wszystkimi wymaganiami, z outputem i nasz tekst. Tekst celowo został wygenerowany tak, żebyśmy mogli wygenerować z niego bardzo dużo ENCI. Jest tekst na temat CD Projekt firmy, która wydała i Wiedźmina. Jest to tutaj wzmianka. Jeżeli przeczytacie ten tekst, to będziecie wiedzieć, że to jest nasadzone po prostu encjami. No i cóż, no i odpalamy. Oczywiście mamy analizę samego contentu. To nas na razie mało interesuje, ale zaczynamy od encji, które znalazł. Każda encja będzie miała swoje ID. I to, co chcieliśmy. Jaka Entsja CD Projekt SA? Organization, jak widzicie, evidence, czyli trochę taki opis, to się też przydaje później w tworzeniu grafu wiec, bo to wszystko można zaimportować, czyli tak przekazana informacja do Waszego systemu, który na przykład generuje teksty, bardzo dużo daje, czy nawet dla copywritera, bo jest wytłumaczenie CD Projekt SA, to polska firma, deweloperska i wydawnicza gier komputerowe. Świetny opis Entsji. Mamy następnie dla przykładu person Marcin Iwiński. Marcin Iwiński jest współzażycielnym CD Projekt. Person, tak? Tutaj jeszcze nie mamy relacji pomiędzy samimi sami. Więc tutaj jest Wiedźmin produkt. Tak naprawdę pewnie powinna być gra Wiedźmin. Ale wiadomo, że pewne rzeczy trzeba dopracować. Mógłbym to czytać. Sapkowski. Ale nie ma sensu. Możecie to wygenerować sami. Dostaniecie i prompt i tekst. Możecie się z tym pobawić. Możecie pozmawiać. Do czego co jest teraz ważne? skończą nam się zaraz encje i dojdziemy do relacji o, przewinę tak jest akurat to jest tak skurowane, że tutaj nie widzimy dokładnie która encja z nazw, ale mamy oczywiście id czyli ID, który był jeden jest do jedenastki, related to, czyli to pewnie jest CD Projekt, jest notowane na geodzie papieru wartościowych. Jak ja się domyślam, pod jedynką był CD Projekt, chyba był, a pod jedynastką pewnie geodzie papieru wartościowych. I to jest ta relacja, która jest zapisana w JSON-ie. To nam znowu robi strukturę drzewa, czyli takiej tablicy, którą można wykorzystać później w danych, w następnych swoich projektach. Kończę na razie z OpenAI. Przejdźmy teraz do Pythona. Instalujemy biblioteki Spacy i Transformers. Spacy i Transformers to są biblioteki NLP, które pomogą nam ekstratować ten tekst. Ja później po tym użyciu tego Pythona, tego skryptu, bardzo prostego też, zrobimy jeszcze jedną prezentację, która nam podsumuje to wszystko, jakby te Pythonowe nasze wyniki. Czyli instalujemy biblioteki to poniżej 1 minuty powinno być nam tutaj. Uruchamiamy skrypt który nam instaluje to teraz na tym serwerze z Colaba. Mamy konfigurację oczywiście szybko to zaplanuję żeby się odpaliło żebyście nie widzieli mojego klucza do OpenAI. Potrzebny nam jest klucz. W sumie to już nie dlatego że będziemy to ekstratować bibliotekami. I to jest przygotowany skrypt. Ja na razie go nie będę omawiał. Omówimy go sobie po jego użyciu. Chciałbym, żebyście zobaczyli, jak to wygląda. Tu jeszcze się ładuje. Chyba biblioteki się instalują. Teraz to sobie zobaczymy. Tak jest. Jeszcze chwilkę, musi się rozwrócić ciekliwość. Mamy. No i dobra. Przechodzimy do naszego głównego skryptu. Pokażę wam tylko, że ten sam tekst też tutaj jest. Też mamy zdefiniowane typy. język.pl Jedna ważna rzecz. Szerzej o tym oczywiście na szkoleniu Sensai. Te biblioteki nie zawsze będą działać dla wszystkich języków. Bo każda biblioteka musiała być na czymś trenowana. My pewnie używamy spaCy.pl News, czyli została wytrenowana na newsach. Pewnie też wiele bibliotek jest trenowanych na Wikipedii. Widzicie, tu jest ten nasz tekst. No i odpalamy tak naprawdę. To nie powinno zająć długo. I mamy już. Biblioteki załadowane, kod byściał będzie 96 znaków. Ency. Tutaj trochę będzie lepiej widać. I też pamiętajcie o tym, że tutaj używam dwóch bibliotek, więc będzie dwa razy. Później taki Ency. Jeżeli używacie dwóch bibliotek, na razie ja używam nawet trzech. Po co? Dlatego, że Spacy czasami jest bardzo uboga i nie widzi wszystkich encji. Transformers jest z kolei przerysowany, jakby widzi ich za dużo. Możemy to wszystko zmergerować i usunąć. I pokażę Wam, jak wyłapać encje, które są nam zupełnie niepotrzebne. Czyli tak, Spacey, 17 encji, Polska, Location, Warszawy, Location. Nie będę czytał wszystkiego, tylko dla przykładu. Gone, Person, nie wiem. Może to jest źle. Rok, tutaj data, bo zostało to rozpoznane. Czyli tak, typów NCI location 6, person 5, organization 4, concept 2. No i tutaj mamy już też relacje. A teraz transformer. Czy mamy tu gdzieś podsumowanie? Tak, znaleźli się ono, 26 NCI, czyli dużo więcej. Jak widzicie, to też jest trochę zabawa, bo nie zawsze te NCI będą takie, jakich ich oczekujemy. Jak to wygląda na grafie? Możemy taki graf ENCEI sobie zrobić, gdzie mamy relacje pomiędzy nimi, jak widzicie. No i są ENCE, tak zwane ORPHAN, czyli ORPHAN Pages to też wspólnicie z SEO. I tutaj też ENCEI, które są samotne, których nie udało się na danej bibliotece powiązać np. gra Cyberpunk. Nie wiem dlaczego nie udało się powiązać CD Projektem. Ale ja zazwyczaj takie ORPHAN ENCEI albo jeszcze raz sprawdzam, czy one leżą w tym tekście, bo w całości jeszcze jakby po ekstrakcji HSNLP ja całość i tak jeszcze wrzucam do LMA razem z tekstem, po to, żeby je zweryfikować i po to, żeby je uprawić. I to jest chyba najlepszy sposób. Jeżeli chodzi o sam prompt, to przy dużych tekstach macie dużo halucynacji, dużo encji i wytłumaczeń tych encji i relacji, które nie są ze sobą powiązane. Więc ENC, ekstrakcja ENC, to co dzisiaj chcę wam powiedzieć jest naprawdę bardzo trudna i nie ma jednego dobrego rozwiązania. Jeszcze raz, ja to robię na oba sposoby, merdżuję, czyszczę, a na koniec jeszcze raz wykorzystuję LLM do tego, żeby to zweryfikować. I ostateczna liczba ENC jest całkiem przyjemna przy takim pipeline'ie i można ją jeszcze również zawężać albo, zawężać tak naprawdę, Czyli ograniczać, żeby nasz graz wiedzy nie był zbyt rozbudowany. Dobrze. Teraz wrócimy jeszcze do takiego post post praktyki, do takiej prezentacji, która nam pomoże omówić to wszystko, co było zrobione za pomocą Pythona. Już będę udostępniał ekran kolejny raz. Muszę przygotować, zawsze muszę łączać. Dobra, ja Wam jeszcze jakby dodam, że jeżeli nie jesteście jeszcze na naszej platformie materials.sens.io, to serdecznie Was tam zapraszam, bo oprócz właśnie tego dzisiejszego webinaru, mamy też webinar z zeszłego tygodnia, gdzie Robert opowiadał o tym, jak być widocznym w AI Search, ale też mamy całe kursy. Właśnie w poniedziałek wczoraj pojawił się kurs na temat narzędzi NoCode całkowicie darmowy, macie też jakby kurs tworzenia treści od Roberta Niechciała. Jakby to, co było wcześniej w zasadzie w kursach Sensei, zanim tutaj dołączył do nas Maciek, teraz jakby to będzie całkowicie na nowo zaprezentowane, więc na was naprawdę dużo darmowej i wartościowej treści. A teraz wracamy do Maciek. Dokładnie tak, czyli możemy przejść do tej takiej postpraktycznej prezentacji. Do czego my dążymy? Do czego dążymy z encjami? Tak jak wcześniej wspomniałem, chodzi o stworzenie grafobiedzy, który będzie nam służył do budowania treści. To jest case study na podstawie tego tekstu na CD Projektie. Jak wyglądało przetwarzanie? Tutaj widzieliście, pamiętacie, 996 znaków za pomocą Spacey. Zostało przetworzone. Tutaj widzicie dokładnie już, może trochę bardziej graficznie, jak wyglądają te ENCE, że ENCE CD Projekt, Labor Organizacja, Warszawa Log Location. Uzyskaliśmy tam 17 ENCE, finalnie 8 relacji plus wizualizacja po zmerdżowaniu tego wszystkiego. Jak to wygląda w samym Pipeline? Jak to możecie też sobie zaprojektować? Wiadomo, że oczywiście trzeba wyczyścić ten tekst z HTML, z jakichś innych dodatkowych znaków. Różnie ekstraktujemy to na różne sposoby. Tutaj jest napisany model, którego ja użyłem w PLCoreNews.sm. Ekstraktujemy osobno relacje. Możemy to zrobić na dwa sposoby. Możemy to zrobić pomocą LMA i możemy też pomocą Pythona. Deduplikacja. Spacy daje nam podobne. Model daje nam podobne. Transformers daje podobne. Deduplikujemy. Łączymy, jeżeli na przykład jeden opis jest dużo lepszy niż drugi. jeżeli ta relacja jest lepiej opisana to to mergeujemy na koniec mamy wizualację, wszyscy wyjawiają wizualację a ja nienawidzę, dlatego nie przygotowałem wam tego grafu wiedzy ostatecznego wszystko jest zapisane w JSON-ie i to przekazujemy później jako input do kolejnych kroków w tworzeniu treści tu jest przykład jakby to mogło wyglądać oczywiście to jest stworzone nie jest odzwierowanie jeden do jednego natomiast jeżeli chcecie to zwizualizować ma sobie biblioteki w Pythonie, tylko tak jak mówię, nie wiem do czego to by było potrzebne, chyba że na poczet, nie wiem, może copywritera, który by łatwiej było zobaczyć te poencyjne relacje między innymi, łatwiej pisać daną treść. I jeżeli byśmy chcieli porównać Spacey z Transformerem, no to wiadomo, ja bym polecał Spacey, ale tak jak mówiłem, możemy powiedzieć, że Spacey jest bardzo strict, a Transformers to jest bardzo taka eksperymentalna, tam jest dużo więcej tych ency i jest też dużo więcej błędy. Zresztą były tam błędy, bo widzieliśmy fragmenty tekstów całe jako ency. Oczywiście dostaniecie te wszystkie slajdy, wszystkie prezentacje, więc będziecie mogli sobie na spokojnie porównać i samemu zdecydować, czego chcecie używać. Spacey i Transformers możecie zrobić system tak naprawdę, skrypt, przepraszam, vibe codingiem, po prostu poprosić LM, żeby znowu stworzył taki prosty skrypt do ekstrakcyjności. Naprawdę parę linijek promptu, żeby stworzyć już ten skrypt. Jeżeli byśmy chcieli ostateczne wnioski, to co działa, to na pewno super rozpoznawane są osoby i firmy i lokalizacje. Jeżeli jest prosta relacja, też jest prosta do wykazania. Na pewno to poprawy Są niektóre koncepty. Widzieliście, że Wiedźmień też w pewnym momencie było oznaczone jako lokalizacja, było trochę Orfan, czyli tych samotnych, NC, a nie powinno ich mieć, więc tutaj mamy osierocone węzły, dziewięć NC bez relacji. Generalnie nie powinno to mieć miejsca, ale tak jak mówiłem, po weryfikacji przez LLM takiego stworzonego JSON-a czy tam grafą wiedzy możecie się tego pozbyć. Tak naprawdę możecie tutaj spróbować jeszcze swoich rozwiązań. Ja bym zatrzymał się na tym, co tutaj pokazałem, w dość prostej budowie po to, żeby sobie nie komplikować życia. I gdzie to możemy zastosować? Z tym, co lubię, czyli w kontencie wpisanym pod SEO, ale w researchu też, jeżeli chcecie zbudować brick dla copywritera w danym temacie, to ekstrakcja NCI też jest super. Wiadomo, rzeczywiście najpierw trzeba zdobyć te teksty, czyli bazę wiedzy, z której będziemy ekstraktować. My robimy tak, że skanujemy SERP-y, głównie Google'a. Wiadomo, Google, jeżeli strony są w top 10, to pewnie mają te pokrycie NCI, te treści mają najlepsze. Możecie analizować rynki, ale też używać, budować na tej podstawie nawilencje, czarboty na przykład do bazy wiedzy z zakresu danego tematu. I stąd już jest bardzo blisko, żeby sobie z takiego prototypu Pythonowego zrobić narzędzi do produkcji. Jeżeli znacie jakieś zewnętrzne narzędzie do ekstrakcji ANSI w wielu językach, powtarzam, bo angielski pewnie jest łatwiej, to możecie mi podać na czacie, bo ja nie znam jednego uniwersalnego rozwiązania, które miałby API i które by działało w ten sposób, jak tutaj prezentowałem. Więc tutaj skalowanie tego rozwiązania wymaga jednak stworzenia jakiegoś API bądź takiego Pythonowego rozwiązania, które będziemy pobierać też teksty z bazy danych i przetwarzać to i przekazywać do następnego krotu. Jakie są kluczowe wnioski? Musicie postawić na to, co proste. Nie budować, nie szukać rozwiązań na siłę. Macie wszystko pod ręką, zwłaszcza po dzisiejszym webinarze. Tak naprawdę z mojej strony to chyba wszystko. to więcej się chyba na ten temat nie da powiedzieć. Być może ktoś jeszcze może się zagłamić w temat mocniej. Na nasze potrzeby generowanej treści myślę, że to jest wystarczające. 

</details>

---

<div class="lesson-completion-bottom" data-lesson-id="ai-content-expert/blok-2/lekcja-6"></div>

<div id="sensai-comments"></div>


---

# 2.7 Alternatywna ekstrakcja NER

<div class="lesson-meta">
  <div class="lesson-mentor">
    <img class="lesson-mentor__avatar" src="https://framerusercontent.com/images/t2GGO1yled5Z8wSFTTJMQHHzd4.png?scale-down-to=512&width=2976&height=2949" alt="Maciej Chmurkowski" />
    <span class="lesson-mentor__info">
      <span class="lesson-mentor__label">Mentor</span>
      <span class="lesson-mentor__name-text">Maciej Chmurkowski</span>
    </span>
  </div>
  <div class="lesson-rating" data-lesson-id="ai-content-expert/blok-2/lekcja-7"></div>
  <div class="lesson-completion" data-lesson-id="ai-content-expert/blok-2/lekcja-7"></div>
</div>

## ℹ️ Informacja

Temat **ekstrakcji encji (NER)** za pomocą bibliotek **Spacy** i **Transformers** został szczegółowo omówiony w poprzedniej lekcji.



---

## 📚 Materiały dodatkowe

Poniższe skrypty są również omówione w lekcji 2.6, ale możesz je pobrać bezpośrednio stąd:







---

<div class="lesson-completion-bottom" data-lesson-id="ai-content-expert/blok-2/lekcja-7"></div>

<div id="sensai-comments"></div>


---

# 2.8 Query Fan-Out

<div class="lesson-meta">
  <div class="lesson-mentor">
    <img class="lesson-mentor__avatar" src="https://framerusercontent.com/images/t2GGO1yled5Z8wSFTTJMQHHzd4.png?scale-down-to=512&width=2976&height=2949" alt="Maciej Chmurkowski" />
    <span class="lesson-mentor__info">
      <span class="lesson-mentor__label">Mentor</span>
      <span class="lesson-mentor__name-text">Maciej Chmurkowski</span>
    </span>
  </div>
  <div class="lesson-rating" data-lesson-id="ai-content-expert/blok-2/lekcja-8"></div>
  <div class="lesson-completion" data-lesson-id="ai-content-expert/blok-2/lekcja-8"></div>
</div>

<div style="position:relative;padding-top:56.25%;"><iframe src="https://player.mediadelivery.net/embed/565073/b78986a2-e6a4-463a-8d57-ab63e8a1ae1a?autoplay=false&loop=false&muted=false&preload=true&responsive=true" loading="lazy" style="border:0;position:absolute;top:0;height:100%;width:100%;" allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;" allowfullscreen="true"></iframe></div>

<br />



## 🎯 Cel lekcji

Opanowanie techniki Query Fan-Out do rozszerzania zapytań i lepszego pokrycia tematu.

---


Oto praktyczny przewodnik po procesie Query fan-out, który jest kluczowym etapem przygotowania treści semantycznych. Dzięki tej metodzie rozbijesz jedno ogólne zapytanie na precyzyjne obszary tematyczne, co pozwoli Ci stworzyć artykuł idealnie dopasowany do intencji użytkownika oraz zaplanować strukturę linkowania wewnętrznego (tematyczny autorytet).

### Czym jest query fan-out w praktyce
Query fan-out to proces rozbicia głównego zapytania użytkownika na zestaw równoległych osi interpretacyjnych. Systemy wyszukiwania (i modele LLM) traktują te osie jako osobne problemy do rozwiązania.

To **NIE jest**: lista synonimów, klastrowanie słów kluczowych ani gotowy spis treści (outline).

To **JEST**: fundament projektowania artykułu (mikrosemantyka) oraz kontekstu całej domeny (makrosemantyka).

### Trzy wymiary fan-outu
Każde zapytanie należy przeanalizować w trzech wymiarach, aby uzyskać pełny kontekst semantyczny:

**1. Fan-out intencyjny**
Odpowiada na pytanie: „Po co użytkownik to wpisuje?”. Wyróżniamy 6 głównych intencji:
- **Definicyjna**: Co to jest? Jaka jest rola X?
- **Problemowa**: Dlaczego mam problem? Jakie są przyczyny?
- **Instrukcyjna**: Jak to zrobić krok po kroku?
- **Decyzyjna**: Co wybrać? Co działa najlepiej?
- **Diagnostyczna**: Jak sprawdzić/zinterpretować wyniki?
- **Porównawcza**: Czym się różni A od B?

**2. Fan-out tematyczny**
Określa stabilne obszary (treści evergreen), które muszą zostać pokryte, aby odpowiedź była kompletna. Tematy te odpowiadają na pytania pomocnicze (np. często pojawiające się w sekcjach People Also Ask).

**3. Fan-out semantyczno-encjowy**
To praca na modelu świata – określenie konkretnych obiektów (encji) i relacji między nimi (np. kortyzol → jest wydzielany przez → nadnercza).

### Procedura robocza krok po kroku
Poniżej znajduje się algorytm postępowania przy tworzeniu analizy dla konkretnego zapytania (np. „kortyzol”).

**Krok 1: Normalizacja zapytania**
Zapisz zapytanie w jednym prostym zdaniu. Określ:
- Główną encję: (np. hormon).
- Kontekst/Kategorię: (np. zdrowie).
- Typ ryzyka: Czy temat należy do kategorii YMYL (Your Money, Your Life)? Jeśli tak, wymaga on szczególnej rzetelności i warstw zabezpieczających (źródeł).

**Krok 2: Generowanie intencji i obszarów**
Wypisz unikalne intencje użytkownika. Dla każdej z nich przypisz maksymalnie 5 istotnych obszarów tematycznych.
- **Zasada**: Nie wypełniaj obszarów na siłę. Wybieraj tylko te, które mają własną logikę i są silnie powiązane z zapytaniem.
- Dla każdego obszaru sformułuj jedno konkretne pytanie pomocnicze.

**Krok 3: Klasyfikacja mikro i makro (Test samodzielności)**
Dla każdego wygenerowanego obszaru zadaj pytanie: „Czy użytkownik mógłby wpisać to jako osobne zapytanie i oczekiwać pełnej, osobnej odpowiedzi?”.
- Jeśli **TAK (MAKRO)**: Oznacz temat jako osobny artykuł do napisania (backlog). W artykule bazowym umieść tylko krótką wzmiankę i zaplanuj link wewnętrzny.
- Jeśli **NIE (MIKRO)**: Oznacz temat jako sekcję w obecnie przygotowywanym artykule bazowym.

**Krok 4: Projektowanie artykułu bazowego**
- Wybierz jedną, dominującą intencję (np. dla zapytania „jak obniżyć...” będzie to intencja instrukcyjna).
- Użyj tematów z tej intencji jako głównych sekcji artykułu.
- Zastosuj strukturę BLUF (Bottom Line Up Front): zacznij fragment od bezpośredniej odpowiedzi, a następnie dodaj kontekst.
- Dodaj warstwę zabezpieczającą, jeśli temat jest z grupy YMYL.

### Narzędzia i automatyzacja
Proces ten możesz realizować na trzy sposoby, korzystając z załączonych do lekcji materiałów:

#### 1. Prosty Prompt
Idealny do szybkiego rozbicia słowa kluczowego na listę tematów i pytań w ChatGPT.



<details>
<summary>👀 Podgląd promptu</summary>

```markdown
# Rola
Jesteś ekspertem semantyki w języku polskim.

# Cel
Rozbij podane zapytanie na podtematy według intencji użytkownika.

# Reguły
- Rozważ KAŻDĄ intencję, ale wybierz tylko pasujące do słowa kluczowego:
  - **Definicyjna** - czym jest, co to znaczy
  - **Problemowa** - objawy, przyczyny, skutki problemu
  - **Instrukcyjna** - jak zrobić, jak osiągnąć
  - **Decyzyjna** - który wybrać, porównanie opcji
  - **Diagnostyczna** - jak sprawdzić, jak zmierzyć
  - **Porównawcza** - różnice, porównania, plusy i minusy
- Dla każdej intencji wypisz obszary (podtematy), które:
  - mają własną logikę
  - są SILNIE POWIĄZANE z głównym słowem kluczowym
  - limit 5 obszarów na intencję, tylko istotne, bez wypełniania na siłę
- Dla każdego obszaru podaj pytanie i YMYL (tak/nie)
- YMYL: tak tylko gdy błąd może zaszkodzić zdrowiu, finansom lub mieć konsekwencje prawne

# Przykłady

Input:
Słowo kluczowe: "kortyzol"

Output:

Zapytanie: "kortyzol"
Encja główna: kortyzol
Kategoria: zdrowie

Intencja: Definicyjna

Definicja i rola
Czym jest kortyzol i jaką pełni funkcję?
YMYL: tak

Rytm dobowy
Jak zmienia się poziom kortyzolu w ciągu dnia?
YMYL: tak

Intencja: Problemowa

Objawy wysokiego kortyzolu
Jakie są objawy podwyższonego kortyzolu?
YMYL: tak

Przyczyny
Co powoduje wysoki kortyzol?
YMYL: tak

Intencja: Instrukcyjna

Dieta
Jak dieta wpływa na kortyzol?
YMYL: tak

Sen
Jak sen reguluje kortyzol?
YMYL: tak

Intencja: Diagnostyczna

Badania
Jak zbadać poziom kortyzolu?
YMYL: tak

# Output
Format odpowiedzi:

Zapytanie: "[słowo kluczowe]"
Encja główna: [encja]
Kategoria: [kategoria]

Intencja: [nazwa]

[Obszar/temat]
[Pytanie?]
YMYL: [tak/nie]

----------

# Słowo kluczowe:
Jak obniżyć kortyzol po 40tce?
```
</details>

#### 2. Zaawansowane Prompty (Część 1 i 2)
Pozwalają na precyzyjną klasyfikację mikro/makro i budowanie strategii contentowej bez umiejętności programistycznych.



<details>
<summary>👀 Podgląd promptu cz. 1</summary>

```markdown
# Rola
Jesteś ekspertem semantyki w języku polskim.

# Cel
Rozbij podane zapytanie na podtematy według zdefiniowanych intencji użytkownika.

# Algorytm

## Krok 1: Normalizacja
- Zapisz zapytanie
- Ustal główną encję
- Ustal kategorię tematyczną

## Krok 2: Intencje
Rozważ KAŻDĄ z poniższych intencji - użytkownik wpisujący zapytanie może mieć różne cele, ale wybierz tylko te pasujące do głównego słowa kluczowego:
- **Definicyjna** - czym jest, co to znaczy
- **Problemowa** - objawy, przyczyny, skutki problemu
- **Instrukcyjna** - jak zrobić, jak osiągnąć
- **Decyzyjna** - który wybrać, porównanie opcji
- **Diagnostyczna** - jak sprawdzić, jak zmierzyć
- **Porównawcza** - porównanie, testy A/B

## Krok 3: Obszary
Dla każdej intencji wypisz **główne obszary (podtematy)**, które:
- mają własną logikę
- mogą istnieć jako część tematu głównego (zapytania) lub samodzielnie
- pasują do danej intencji
- limit 5 obszarów (podtematów) na intencję, tylko istotne, bez wypełniania limitu na siłę dla każdej intencji

Dla każdego obszaru (podtematu) podaj:
- **Pytanie** na które odpowiada ten obszar
- **YMYL** (tak/nie) - czy błędna odpowiedź może mieć poważne konsekwencje

## YMYL - definicja
YMYL = Your Money Your Life. Oznacz YMYL: tak TYLKO gdy błędna informacja może:
- Zaszkodzić zdrowiu (choroby, leki, objawy medyczne)
- Spowodować straty finansowe (inwestycje, podatki, kredyty)
- Mieć konsekwencje prawne (prawo, umowy, regulacje)

YMYL: nie dla zwykłych porad domowych, przepisów, hobby, rozrywki.

# Zasady
- Maksymalnie 5 obszarów na intencję
- Obszary = frazy opisujące temat (mogą być 2-4 słowa)
- Pytanie = konkretne pytanie użytkownika na które odpowiada obszar

# Format outputu

Zapytanie: "[zapytanie]"
Encja główna: [encja]
Kategoria: [kategoria]

Intencja: [nazwa]

* [Obszar]
[Pytanie?]
YMYL: [tak/nie]

* [Obszar]
[Pytanie?]
YMYL: [tak/nie]

Intencja: [nazwa]

* [Obszar]
[Pytanie?]
YMYL: [tak/nie]

# Przykład

Zapytanie: "kortyzol"
Encja główna: kortyzol
Kategoria: zdrowie

Intencja: Definicyjna

* Definicja i rola
Czym jest kortyzol i jaką pełni funkcję?
YMYL: tak

* Rytm dobowy
Jak zmienia się poziom kortyzolu w ciągu dnia?
YMYL: tak

* Regulacja hormonalna
Co wpływa na poziom kortyzolu?
YMYL: tak

Intencja: Problemowa

* Objawy wysokiego kortyzolu
Jakie są objawy podwyższonego kortyzolu?
YMYL: tak

* Przyczyny
Co powoduje wysoki kortyzol?
YMYL: tak

* Skutki zdrowotne
Jakie są skutki długotrwale wysokiego kortyzolu?
YMYL: tak

Intencja: Instrukcyjna

* Dieta i używki
Jak dieta wpływa na kortyzol?
YMYL: tak

* Sen i regeneracja
Jak sen reguluje kortyzol?
YMYL: tak

* Redukcja stresu
Jak obniżyć kortyzol przez redukcję stresu?
YMYL: nie

Intencja: Diagnostyczna

* Badania i pomiar
Jak zbadać poziom kortyzolu?
YMYL: tak

* Normy i interpretacja
Jakie są prawidłowe wartości kortyzolu i jak je interpretować?
YMYL: tak

# Zasady odpowiedzi
- Zwróć TYLKO format outputu
- Intencje TYLKO z listy 5 zdefiniowanych
- Maksymalnie 5 obszarów na intencję
- Każdy obszar z pytaniem i oznaczeniem YMYL

----------------------------------

#Słowo kluczowe
Jak obniżyć kortyzol po 40tce?
```
</details>



<details>
<summary>👀 Podgląd promptu cz. 2</summary>

```markdown
# Rola
Jesteś ekspertem semantyki w języku polskim.

# Cel
Na podstawie podanych intencji i obszarów/tematów sklasyfikuj każdy obszar/temat jako MICRO (sekcja w artykule głównym) lub MACRO (osobny artykuł).

# Algorytm

## Test samodzielności
Dla każdego obszaru/tematu zadaj pytanie:
"Czy użytkownik mógłby wpisać to jako OSOBNE zapytanie i oczekiwać OSOBNEJ, pełnej odpowiedzi?"

- **TAK** → MACRO (osobny artykuł)
- **NIE** → MICRO (sekcja w artykule głównym)

## Zasady klasyfikacji
- MICRO = obszar/temat jest częścią odpowiedzi na główne zapytanie
- MACRO = obszar/temat zasługuje na własny artykuł, bo ma osobny intent wyszukiwania
- Artykuł główny = tytuł identyczny z zapytaniem
- W artykule głównym umieść tylko obszary/tematy MICRO
- Obszary/tematy MACRO to propozycje osobnych artykułów

# Format inputu
Otrzymasz wynik z części 1 (intencje i obszary).

# Format outputu

ARTYKUŁ GŁÓWNY: "[zapytanie]"

Intencja: [nazwa]

* [Obszar/temat MICRO]
[Pytanie?]
YMYL: [tak/nie]

* [Obszar/temat MICRO]
[Pytanie?]
YMYL: [tak/nie]

ARTYKUŁY DODATKOWE:

* [Obszar/temat MACRO - ogólny, bez kontekstu z zapytania głównego]
[Pytanie - ogólne]
YMYL: [tak/nie]

* [Obszar/temat MACRO]
[Pytanie]
YMYL: [tak/nie]

# Przykład

Input:
Zapytanie: "Jak obniżyć kortyzol po 40tce?"

Intencja: Instrukcyjna
* Styl życia (sen, stres)
Jak poprawić sen i ograniczyć stres, aby obniżyć kortyzol po 40. roku życia?
YMYL: tak

* Dieta
Co jeść, aby wspierać niższy poziom kortyzolu po 40.?
YMYL: tak

Intencja: Problemowa
* Objawy podwyższonego kortyzolu
Jakie objawy mogą sugerować zbyt wysoki kortyzol po 40. roku życia?
YMYL: tak

Intencja: Diagnostyczna
* Badania kortyzolu
Jak zbadać kortyzol (krew, ślina, mocz)?
YMYL: tak

Output:

ARTYKUŁ GŁÓWNY: "Jak obniżyć kortyzol po 40tce?"

Intencja: Instrukcyjna

* Styl życia (sen, stres)
Jak poprawić sen i ograniczyć stres, aby obniżyć kortyzol po 40. roku życia?
YMYL: tak

* Dieta
Co jeść, aby wspierać niższy poziom kortyzolu po 40.?
YMYL: tak

ARTYKUŁY DODATKOWE:

* Objawy podwyższonego kortyzolu
Jakie objawy mogą sugerować zbyt wysoki kortyzol?
YMYL: tak

* Badania kortyzolu
Jak zbadać kortyzol (krew, ślina, mocz)?
YMYL: tak

Wyjaśnienie:
- Instrukcyjna → MICRO (główna odpowiedź na "jak obniżyć") - skopiowane 1:1
- Problemowa → MACRO - usunięto "po 40. roku życia" (evergreen)
- Diagnostyczna → MACRO - już było ogólne
- To są obszary tematyczne, nie struktura artykułu

# Zasady odpowiedzi
- Zwróć TYLKO format outputu (ARTYKUŁ GŁÓWNY + ARTYKUŁY DODATKOWE)
- Tytuł artykułu głównego = zapytanie
- **MICRO: Kopiuj obszary/tematy 1:1 z inputu** - nie modyfikuj, zachowaj kontekst
- **MACRO: Usuń kontekst specyficzny z zapytania głównego** - artykuły dodatkowe powinny być evergreen, nie powiązane z konkretnym kontekstem zapytania (np. "po 40tce", "dla kobiet", "w ciąży")
- Wynik to obszary tematyczne według intencji, NIE struktura artykułu


--------------------
[User prompt]
Wstaw odpowiedź z części pierwszej (poprzedni prompt)
```
</details>

#### 3. Skrypt Python (z PAA)
Pobiera dane PAA (People Also Ask) bezpośrednio z Google (przez API DataForSEO) i używa LLM do automatycznego przypisania realnych pytań użytkowników do konkretnych obszarów tematycznych.

**Wymagania**: Klucz API OpenAI oraz dostęp do DataForSEO.

**Wskazówka**: Wykorzystanie realnych pytań PAA sprawia, że Twój artykuł staje się "magnesem" na ruch z wyszukiwarki, ponieważ odpowiada na faktyczne dylematy użytkowników.



<details>
<summary>👀 Podgląd skryptu</summary>

```python
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Query Fan-Out Pipeline
======================
Input: słowo kluczowe
Output: lista tematów z pytaniami + PAA
"""

import json
import re
import requests
from base64 import b64encode
from datetime import datetime

# ========== KONFIGURACJA ==========
KEYWORD = "Jak obniżyć kortyzol po 40tce?"  # <-- ZMIEŃ TUTAJ
LANG = "pl"

# Ustawienia
USE_FAKE_PAA = False  # True = testowe PAA, False = DataForSEO
DEBUG_MODE = True

print("=" * 60)
print(f"🎯 QUERY FAN-OUT: {KEYWORD}")
print("=" * 60)

# ========== PROMPT 1: Intencje i Obszary ==========

PROMPT_PART1 = """# Rola
Jesteś ekspertem semantyki w języku polskim.

# Cel
Rozbij podane zapytanie na podtematy według zdefiniowanych intencji użytkownika.

# Algorytm

## Krok 1: Normalizacja
- Zapisz zapytanie
- Ustal główną encję
- Ustal kategorię tematyczną

## Krok 2: Intencje
Rozważ KAŻDĄ z poniższych intencji - użytkownik wpisujący zapytanie może mieć różne cele, ale wybierz tylko te pasujące do głównego słowa kluczowego:
- **Definicyjna** - czym jest, co to znaczy
- **Problemowa** - objawy, przyczyny, skutki problemu
- **Instrukcyjna** - jak zrobić, jak osiągnąć
- **Decyzyjna** - który wybrać, porównanie opcji
- **Diagnostyczna** - jak sprawdzić, jak zmierzyć

## Krok 3: Obszary
Dla każdej intencji wypisz **główne obszary (podtematy)**, które:
- mają własną logikę
- mogą istnieć jako część tematu głównego (zapytania) lub samodzielnie
- pasują do danej intencji
- **są SILNIE POWIĄZANE z głównym słowem kluczowym** - nie wymyślaj na siłę
- limit 5 obszarów (podtematów) na intencję, tylko istotne, bez wypełniania limitu na siłę dla każdej intencji

Dla każdego obszaru (podtematu) podaj:
- **Pytanie** na które odpowiada ten obszar
- **YMYL** (tak/nie) - czy błędna odpowiedź może mieć poważne konsekwencje

## YMYL - definicja
YMYL = Your Money Your Life. Oznacz YMYL: tak TYLKO gdy błędna informacja może:
- Zaszkodzić zdrowiu (choroby, leki, objawy medyczne)
- Spowodować straty finansowe (inwestycje, podatki, kredyty)
- Mieć konsekwencje prawne (prawo, umowy, regulacje)

YMYL: nie dla zwykłych porad domowych, przepisów, hobby, rozrywki.

# Zasady
- Maksymalnie 5 obszarów na intencję
- Obszary = frazy opisujące temat (mogą być 2-4 słowa)
- Pytanie = konkretne pytanie użytkownika na które odpowiada obszar

# Zasady odpowiedzi
- Zwróć TYLKO format JSON
- Intencje TYLKO z listy 5 zdefiniowanych
- Maksymalnie 5 obszarów na intencję
- Każdy obszar z pytaniem i oznaczeniem YMYL

Zwróć JSON:
{
  "zapytanie": "...",
  "encja": "...",
  "kategoria": "...",
  "intencje": [
    {
      "nazwa": "Definicyjna",
      "obszary": [
        {"temat": "...", "pytanie": "...", "ymyl": true/false}
      ]
    }
  ]
}"""

# ========== PROMPT 2: Przypisanie PAA ==========

PROMPT_PART2 = """# Rola
Jesteś ekspertem semantyki w języku polskim.

# Cel
Przypisz pytania PAA do odpowiednich obszarów tematycznych.

# Input zawiera:
- glowne_slowo_kluczowe: główne zapytanie użytkownika
- obszary: lista obszarów tematycznych (każdy ma "temat" i "pytanie")
- pytania_paa: pytania People Also Ask do przypisania

# Zasady:
1. Dla każdego pytania PAA znajdź NAJBARDZIEJ pasujący obszar
2. Pytanie PAA przypisz TYLKO jeśli jest SPECYFICZNE dla danego obszaru
3. Ogólne pytania (które pasują do głównego słowa kluczowego, ale nie do konkretnego obszaru) → "niepasujące"
4. Jeden PAA może pasować tylko do jednego obszaru

# Przykład
Główne słowo: "Jak obniżyć kortyzol po 40tce?"
Obszary: ["Dieta", "Sen", "Stres", "Objawy"]

"Co jeść żeby obniżyć kortyzol?" → pasuje do "Dieta" (specyficzne)
"Jak najszybciej zbić kortyzol?" → niepasujące (ogólne, nie specyficzne dla żadnego obszaru)
"Po czym poznać wysoki kortyzol?" → pasuje do "Objawy" (specyficzne)

# Output
Zwróć JSON z mapowaniem - dla każdego obszaru lista pasujących PAA:
{
  "przypisania": {
    "Dieta": ["Co jeść żeby obniżyć kortyzol?"],
    "Sen": [],
    "Objawy": ["Po czym poznać wysoki kortyzol?"]
  },
  "niepasujace_paa": ["Jak najszybciej zbić kortyzol?"]
}

Użyj DOKŁADNYCH nazw obszarów z inputu jako kluczy."""


# ========== FUNKCJE ==========

def call_llm(system_prompt: str, user_prompt: str) -> dict:
    """Wywołuje LLM i zwraca JSON"""
    from openai import OpenAI
    client = OpenAI(api_key=API_OPENAI_KEY)
    
    try:
        # Połącz system i user prompt
        full_prompt = f"{system_prompt}\n\n{user_prompt}\n\nZwróć TYLKO valid JSON, bez dodatkowego tekstu."
        
        response = client.responses.create(
            model="gpt-5.2",
            input=full_prompt,
            reasoning={
                "effort": "medium"
            }
        )
        
        # Wyciągnij tekst z odpowiedzi
        result_text = None
        if hasattr(response, 'output_text'):
            result_text = response.output_text
        elif hasattr(response, 'output'):
            result_text = response.output
        elif hasattr(response, 'content'):
            result_text = response.content
        else:
            # Spróbuj jako string
            result_text = str(response)
        
        if DEBUG_MODE:
            print(f"   LLM response type: {type(response)}")
        
        # Znajdź JSON w odpowiedzi
        json_match = re.search(r'\{.*\}', result_text, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
        else:
            print(f"⚠️ Nie znaleziono JSON w odpowiedzi")
            if DEBUG_MODE:
                print(f"   Odpowiedź: {result_text[:500] if result_text else 'BRAK'}...")
            return {}
            
    except Exception as e:
        print(f"❌ Błąd LLM: {e}")
        import traceback
        if DEBUG_MODE:
            traceback.print_exc()
        return {}


def get_paa_questions(keyword: str, lang: str = 'pl') -> list:
    """Pobiera pytania PAA z DataForSEO"""
    
    if USE_FAKE_PAA:
        return [
            f"Czym jest {keyword.split()[0]}?",
            f"Jak naturalnie obniżyć kortyzol?",
            f"Jakie są objawy wysokiego kortyzolu?",
            f"Co jeść żeby obniżyć kortyzol?",
            f"Czy kawa podnosi kortyzol?",
            f"Jak stres wpływa na kortyzol?",
            f"Kiedy badać kortyzol?",
            f"Jakie suplementy obniżają kortyzol?"
        ]
    
    # Użyj bezpośrednio zmiennych z Colab
    credentials = b64encode(f"{DFS_LOGIN}:{DFS_PASSWORD}".encode()).decode('ascii')
    headers = {
        'Authorization': f'Basic {credentials}',
        'Content-Type': 'application/json'
    }
    
    location_codes = {'pl': 2616, 'en': 2840, 'de': 2276, 'fr': 2250}
    
    payload = [{
        "keyword": keyword,
        "language_code": lang,
        "location_code": location_codes.get(lang, 2616),
        "device": "desktop",
        "people_also_ask_click_depth": 2
    }]
    
    try:
        response = requests.post(
            "https://api.dataforseo.com/v3/serp/google/organic/live/advanced",
            json=payload,
            headers=headers,
            timeout=60
        )
        
        if response.status_code != 200:
            print(f"⚠️ DataForSEO status: {response.status_code}")
            return []
        
        data = response.json()
        questions = []
        
        if "tasks" in data and data["tasks"]:
            task = data["tasks"][0]
            if "result" in task and task["result"]:
                items = task["result"][0].get("items", [])
                for item in items:
                    if item.get("type") == "people_also_ask":
                        for paa_item in item.get("items", []):
                            question = paa_item.get("title", "")
                            if question:
                                questions.append(question)
        
        return list(dict.fromkeys(questions))[:20]
    
    except Exception as e:
        print(f"❌ Błąd PAA: {e}")
        return []


def format_output(result: dict) -> str:
    """Formatuje wynik do zapisu"""
    lines = []
    lines.append(f"ARTYKUŁ GŁÓWNY: \"{result.get('artykul_glowny', '')}\"")
    lines.append("")
    
    # Grupuj po intencjach jeśli są
    current_intencja = None
    
    for obszar in result.get('obszary_z_paa', []):
        # Sprawdź czy jest intencja
        intencja = obszar.get('intencja')
        if intencja and intencja != current_intencja:
            if current_intencja is not None:
                lines.append("")
            lines.append(f"--- {intencja} ---")
            lines.append("")
            current_intencja = intencja
        
        temat = obszar.get('temat') or obszar.get('nazwa') or '(brak tematu)'
        pytanie = obszar.get('pytanie_glowne') or obszar.get('pytanie') or '(brak pytania)'
        ymyl = obszar.get('ymyl', False)
        
        lines.append(str(temat))
        lines.append(str(pytanie))
        lines.append(f"YMYL: {'tak' if ymyl else 'nie'}")
        
        pytania_paa = obszar.get('pytania_paa', [])
        if pytania_paa:
            lines.append("PAA:")
            for paa in pytania_paa:
                if paa:
                    lines.append(f"- {paa}")
        
        lines.append("")
    
    niepasujace = result.get('niepasujace_paa', [])
    if niepasujace:
        lines.append("=" * 40)
        lines.append("NIEPASUJĄCE PAA:")
        for paa in niepasujace:
            if paa:
                lines.append(f"- {paa}")
    
    return "\n".join(lines)


# ========== GŁÓWNY PIPELINE ==========

def run_pipeline(keyword: str, lang: str = 'pl'):
    """Główny pipeline Query Fan-Out"""
    
    # 1. Pobierz PAA
    print("\n1️⃣ Pobieranie PAA...")
    paa_questions = get_paa_questions(keyword, lang)
    print(f"   Pobrano {len(paa_questions)} pytań PAA")
    if DEBUG_MODE and paa_questions:
        for q in paa_questions[:3]:
            print(f"   - {q}")
        if len(paa_questions) > 3:
            print(f"   ... i {len(paa_questions) - 3} więcej")
    
    # 2. LLM #1: Intencje i Obszary
    print("\n2️⃣ LLM #1: Generowanie intencji i obszarów...")
    result1 = call_llm(
        PROMPT_PART1,
        f"Zapytanie: \"{keyword}\""
    )
    
    if DEBUG_MODE:
        print(f"   Intencje: {len(result1.get('intencje', []))}")
        for intencja in result1.get('intencje', []):
            print(f"   - {intencja['nazwa']}: {len(intencja.get('obszary', []))} obszarów")
    
    # Przygotuj listę wszystkich obszarów do przypisania PAA
    wszystkie_obszary = []
    for intencja in result1.get('intencje', []):
        for obszar in intencja.get('obszary', []):
            wszystkie_obszary.append({
                "intencja": intencja['nazwa'],
                "temat": obszar['temat'],
                "pytanie": obszar['pytanie'],
                "ymyl": obszar.get('ymyl', False)
            })
    
    # 3. LLM #2: Przypisanie PAA (tylko jeśli są pytania PAA)
    if paa_questions:
        print("\n3️⃣ LLM #2: Przypisanie PAA do obszarów...")
        print(f"   Wysyłam {len(wszystkie_obszary)} obszarów do wzbogacenia PAA")
        
        input_for_paa = {
            "glowne_slowo_kluczowe": keyword,
            "obszary": wszystkie_obszary,
            "pytania_paa": paa_questions
        }
        
        result2 = call_llm(
            PROMPT_PART2,
            f"Input:\n{json.dumps(input_for_paa, ensure_ascii=False, indent=2)}"
        )
        
        # Pobierz mapowanie PAA -> obszar
        przypisania = result2.get('przypisania', {})
        niepasujace = result2.get('niepasujace_paa', [])
        
        if DEBUG_MODE:
            przypisane_count = sum(len(v) for v in przypisania.values())
            print(f"   Przypisano PAA: {przypisane_count}")
            print(f"   Niepasujące PAA: {len(niepasujace)}")
        
        # Zbuduj finalny wynik - każdy obszar z przypisanymi PAA
        obszary_z_paa = []
        for obszar in wszystkie_obszary:
            temat = obszar['temat']
            # Znajdź PAA dla tego obszaru (sprawdź różne warianty klucza)
            paa_dla_obszaru = []
            for klucz, pytania in przypisania.items():
                if klucz.lower() == temat.lower() or temat.lower() in klucz.lower() or klucz.lower() in temat.lower():
                    paa_dla_obszaru = pytania
                    break
            
            obszary_z_paa.append({
                "intencja": obszar.get('intencja', ''),
                "temat": temat,
                "pytanie_glowne": obszar['pytanie'],
                "ymyl": obszar.get('ymyl', False),
                "pytania_paa": paa_dla_obszaru if paa_dla_obszaru else []
            })
        
        result2 = {
            "obszary_z_paa": obszary_z_paa,
            "niepasujace_paa": niepasujace
        }
    else:
        print("\n3️⃣ Brak PAA - pomijam przypisanie")
        # Utwórz wynik bez PAA
        result2 = {
            "obszary_z_paa": [
                {
                    "intencja": o.get('intencja', ''),
                    "temat": o['temat'],
                    "pytanie_glowne": o['pytanie'],
                    "ymyl": o['ymyl'],
                    "pytania_paa": []
                }
                for o in wszystkie_obszary
            ],
            "niepasujace_paa": []
        }
    
    # Dodaj tytuł artykułu
    result2['artykul_glowny'] = keyword
    
    # 4. Formatowanie i zapis
    print("\n4️⃣ Formatowanie wyniku...")
    output_text = format_output(result2)
    
    # Wyświetl
    print("\n" + "=" * 60)
    print("WYNIK:")
    print("=" * 60)
    print(output_text)
    
    # Zapisz do pliku
    filename = f"query_fanout_{keyword.replace(' ', '_').replace('?', '')[:30]}.txt"
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(output_text)
    print(f"\n💾 Zapisano do: {filename}")
    
    return result2


# ========== URUCHOMIENIE ==========

if __name__ == "__main__":
    run_pipeline(KEYWORD, LANG)
```
</details>


---

<details>
<summary>📝 Transkrypcja wideo</summary>

Cześć, witam Was w kolejnej lekcji i na samym początku będę prosił Was o skupienie, ponieważ ten temat jest nie tylko rozległy, ale według mnie jest to jeden z trzech, czterech tematów, które są najważniejsze w całym naszym kursie. Na początek też parę informacji organizacyjnych co do samej lekcji. My jesteśmy w bloku drugim i zostały nam oprócz tej lekcji jeszcze dwie lekcje, które zakończą nam nasze solidne, naprawdę solidne przygotowania do generowania treści. W samym bloku trzecim będziemy tę treść już bezpośrednio generować, wykorzystując wszystko, co osiągnęliśmy, wygenerowaliśmy i nauczyliśmy się w poprzednich blokach. Jeżeli spojrzycie sobie na opis lekcji, zobaczycie, że tym razem jest on rozległy, bo opisałem każdy prompt i każdy plik. Prompty mają input, output, natomiast również script Python, który jest przypisany do tej lekcji, ma również wszystkie wymagania. Później jest naprawdę dość rozległa część teoretyczna, która Wam być może, jeżeli zaczniecie od niej, niewiele powie, ale może po lekcji rzeczywiście będziecie mogli sobie do tego sięgnąć i utrwalić. Co to jest ten cały query fanout? Jak? Tak naprawdę z czym to się je? Query fanout to jest rozbicie głównego zapytania, które jest spisywane na przykład w Google, wysyłane do modeli językowych, na pod zapytania, pod tematy. Po co? Po to, żeby te modele czy wyszukiwarka jak najlepiej dobrały odpowiedzi. My będziemy to wykorzystywać przede wszystkim po to, żeby stworzyć obszary tematyczne, które pomogą nam zaprojektować cały artykuł. Nie jest to natomiast outline, czyli spis treści artykułu. Nie jest to lista tematów, które powinny być stworzone. Wyobraźcie sobie to po prostu jako obszary podzielone na trzy części. Na intencje. Do tych intencji będziemy przypisywać tematy. Też będziemy je nazywali obszarami. I na koniec są również encje. ale my ENCE robimy zupełnie inaczej, ponieważ ja nie wierzę w ENCE, które są przygotowywane przez modele językowe. Daje to pole do wielu halucynacji i stwarza nam problem na samym początku już przygotowywania się do wygenerowania treści. Więc na czym polega cały ten query fanout, jeżeli chcielibyśmy spojrzeć o stronę teoretycznej? Najpierw normalizujemy sobie zapytanie, definiujemy główną encję, tak jak tu widzicie na stworzonej przeze mnie infografice, dodajemy kontekst, czyli na przykład kategorie, w przypadku kortyzolu przeze mnie ulubionego będzie to zdrowie, no i jaki cel ma użytkownik wpisując to zapytanie. Przypisujemy sześć intencji. Teraz pokażę Wam, te intencje są wymienione, tak jak mówiłem, w części teoretycznej. Intencja definicyjna, problemowa, instrukcyjna, decyzyjna, diagnostyczna, porównawcza. Oczywiście te intencje, w mojej opinii, wyczerpują cały zakres możliwości stworzenia podzapytań, pod intencje i wydaje mi się, że ciężko by było coś tu jeszcze dodać. Jeżeli przyjrzycie się części teoretycznej, zobaczycie również pytania, to daje nam dość dużą informację, jak ta intencja wygląda. Na przykład dla intencji problemowej, dlaczego mam problem, jakie są objawy i przyczyny, co powoduje. Dla instrukcyjnej, jak to zrobić, jakie kroki podjąć i w jaki sposób. Następnie dla każdej tej intencji jesteśmy w stanie przypisać parę obszarów tematycznych, co już daje nam szeroki wachlarz wyboru, jeżeli chodzi o tematykę, o to, o czym będziemy pisać w naszym artykule. I tak jak mówiłem, jeszcze w teorii możemy też dodać encję, czyli ten fanant encjowy, natomiast my to będziemy zupełnie pomijać, my encję już mamy wygenerowane. I na koniec, co my mamy? Pełny kontekst semantyczny. Czy to będzie nasz taki fundament? Obok grafu wiedzy to da nam bardzo solidną bazę do tego, żeby zrobić świetny artykuł, który będzie konkretny, związany bardzo mocno z tym tematem i słuchajcie, najważniejsze, dopasowany do intencji. Lekcja przygotowana jest w taki sposób, aby osoby nie tylko zaawansowane technologicznie, którzy używają Pythona, albo którzy budują skomplikowany pipeline do generowania treści, aby również osoby, które zajmują się copywritingiem, czy przygotowaniem briefów dla copywriterów, mogli to wykorzystać bezpośrednio już po tej lekcji, bez wymagań technicznych. Dlatego zajmiemy się na początek promptem bardzo prostym, który mam nadzieję, że Wam też pomoże zobrazować cały temat. Nie wiem jak Wy, ale ja najlepiej nowych rzeczy, przyswajam nowe rzeczy najlepiej za pomocą praktyki. Więc przejdźmy sobie teraz do tego pierwszego promptu. Omówimy go sobie po kolei i zobaczymy, jaki daje nam wynik. Więc zaczynamy od tego, że rola to jesteś ekspertem semantyki w języku polskim. Oczywiście, jeżeli będziecie generować ten query fanout dla innych języków, to musicie sobie ten język tutaj podmienić, trzeba o tym pamiętać. Ewentualnie ja to zazwyczaj wstawiam jakąś zmienę. Oczywiście prompt jest w języku polskim. Stwierdziłem, że łatwiej będzie mi tłumaczyć. Jeżeli chcecie, możecie ten prompt sobie po prostu zamienić w modelu językowym na język angielski. Jak wiemy już, badania były, że nawet język polski lepiej komunikuje się z modelem językowym. Nie wiem, czy można w to wierzyć. To jest up to you. Możecie używać sobie języka polskiego, angielskiego. Kwestia przyzwyczaje. Dobrze, przechodzimy dalej do promptu. Cel. Celem jest rozbij podane zapytanie na podtematy według intencji użytkownika. To jest bardzo krótki cel, bardzo, moim zdaniem, dobrze sformułowany i w którym ja nie proszę o zrobienie fanoutu, dlatego że według mnie większość modeli nie zna tego pojęcia, a jeżeli będziecie się uprzeć, żeby to zrobić, to proszę pamiętajcie o tym, żeby również w tym samym prompcie za każdym razem wysyłać mu definicję tego, co to jest query fanout. Możecie to zrobić w bardzo prosty sposób, tą definicję stworzyć, po prostu skopiujcie część teoretyczną, która jest załączona do lekcji i poproście model językowy o zrobienie krótkiej definicji. Zresztą tak samo możecie, pamiętajcie, tak samo możecie pracować z wieloma promptami, a ewentualnie regułami. Ja tak często robię, przygotowuję sobie jakąś teorię, Ewentualnie gdzieś się z nią, gdzieś się uczę, gdzieś pobieram i proszę o stworzenie reguł do promptu. Może nie cały prompt. Dobrze, a propos reguł. Zobaczcie. Rozważ każdą intencję, ale wybierz tylko pasujące do słowa kluczowego. Te tylko pasujące intencje do słowa kluczowego to jest istotne, dlatego że nie chcemy, żeby model językowy na siłę wykorzystywał każdą intencję i stwarzał, jakby budował nam ten kontekst dla każdej intencji. Mają być tylko te intencje, które rzeczywiście pasują do tego słowa. Szybki przegląd tych intencji, definicje, też to musicie robić, dlatego jeżeli tego nie zrobicie, model będzie stwarzał swoje intencje i dostaniecie naprawdę mnóstwo halucynacji. I teraz zobaczcie, tak jak wam mówiłem, na początku określamy, wybieramy, przypisujemy, dużo słów wiem, przepraszam, intencje do słowa kluczowego, a później dla każdej intencji, to jest ważne, bo to jest taka pętla, jakby się nam robi, wypisz obszary pod tematy, które istotne mają własną logikę. Są silne, poza związane z głównym słowem kluczowym. Znów taki nakaz, żeby ten model nie tworzył nam pod tematów do każdej z tej intencji, która nie będzie nam związana, która będzie śmieciem, po prostu będzie nam zaśmiecać cały kontekst. I tutaj jest świetny przykład tego, jak limitować obszary. Jeżeli wpiszecie maksymalnie 5 obszarów, większość razy model Wam wygeneruje 5 obszarów. Ja to konstruuję w ten sposób. Limit 5 obszarów na intencje, tylko istotny, bez wypełniania na siłę. Nie wiem, czy da się to bardziej zgrabnie skonstruować, być może, ale działa. Dla każdego obszaru dodatkowo jeszcze, żeby ułatwić później w przyszłości generowanie tej treści, proszę o podanie pytania. i określenie ryzyka, czy to jest temat your money, your life. Tak albo nie nam w zupełności wystarczy. Po co? Żebyśmy również w przyszłości mogli to sobie wyeksportować, gdzieś w naszym pipeline zapisać i żebyśmy mieli tą flagę i mogli ten temat zupełnie inaczej skonstruować, dając jakieś źródła, które będą potwierdzały różne tezy wpisane w naszym artykule. Oczywiście przykłady. Bez przykładów sama teoria, same cel, rola i reguły nie będą Wam dobrze działać, więc ja oczywiście kortyzol, już nie będę teraz tego z Wami analizował, ale daję mu przykład, jak powinna wyglądać odpowiedź i na koniec macie jeszcze format odpowiedzi, nasz output, czyli dostaniemy zapytanie, encja główna, czyli to jest ta nasza, ten pierwszy krok nasz, później intencja i dla każdej intencji obszar, pytanie, your money life. I oczywiście słowo kluczowe, jak obniżyć kortyzol po 40. Wspominałem, że będziemy to wykorzystywać w bardzo prosty sposób, tak aby każdy z Was mógł sobie ten taki podstawowy query funout zrobić. I przejdziemy sobie teraz do czatu GPT. I zobaczymy jak to działa w praktyce. Normalizacja zapytania. Główna encja, kortyzol, oczywiście zdrowie. Intencja definicyjna i dwa obszary. Tak jak mówiłem, nie zrobił ich pięć na siłę. Kortyzola, wiek, wpływ hormonów. Jest to, myślę, że wydaje trafione, dlatego że rozważamy temat obniżania kortyzolu po 40. Ten aspekt 40 jest dość ważny tutaj. Wpływ hormonów. Problemowa. Objawy wysokiego kortyzolu po 40. Przyczyny podwyższonego kortyzolu. Skutki długoterminowe. 3 z 5 możliwych. Świetnie. Instrukcyjna. Styl życia. Aktywność fizyczna. Dieta. Sen i regeneracja. Redukcja stresu. Wszystko, co oczywiście powinno to być. Instrukcyjna. Według mnie to jest główna intencja naszego zapytania. nasz kontent powinien być instrukcyjny, ale to jeszcze przejdziemy w drugiej części. W trzecim bloku będziemy to wykorzystywać. I na koniec diagnostyczna jeszcze i porównawcza. Tutaj mamy po dwa badania hormonalne, interpretacja wyników. A, jeszcze decyzyjne. Przepraszam, oczywiście, bo tam jakby kolejna została odwrócona. Suplementacja. Bardzo ważne. Kiedyś do lekarza. Zobaczcie, jak świetny to jest kontekst, jeżeli chodzi o samo tworzenie artykułu. Oczywiście moglibyście z tego zrobić outline, ale ja bym to jeszcze przefiltrował, zestawił z naszym grafem wiedzę, co będziemy robić w następnej lekcji. I teraz kolejny pomysł. Też macie w lekcji opisany query fanout script Pythonu, przepraszam, właściwie chwilę zamyśliłem. Query fanout simple. O co chodzi? Pomyślałem sobie, że skoro możemy zrobić query funnel za pomocą modelu, ale mamy też PPA, czyli People Also Ask. PAA powinno być, Maciek. Wybaczcie, ja już nie będę przerywał nagrania. Co to jest z PAA? To są pytania dodatkowe, które są generowane przez Google'a i to jest sposób, w jaki Google też można powiedzieć rozbija na pod zapytania. Tylko to już są pytania i to macie przy naszym. Jeżeli wy wpiszecie sobie nasze zapytanie główne, to zobaczycie, że te pytania podpowiada Google. My jesteśmy w stanie te pytania pobrać z Data for Sale. Data for SEO ma możliwość po wpisaniu, wysłaniu przez API. Zaraz sobie do tego dojdziemy. Pokażę wam to. Tak jest. To jest ten endpoint. I możemy sobie tutaj w payloadzie mamy keyword, lang przede wszystkim, no i location calls. My też musicie to zestawić, zmapować z Data for SEO, ale my się tym nie zajmujemy. Ja tutaj to zrobiłem dla paru głównych języków. Jeżeli będziecie, macie ten skrypt, możecie zobaczyć, jak to jest zrobione. Możecie też go wrzucić do LMA z prośbą, żeby wyciągnął wam tylko zapytanie API do DataForSeo. I co ten robi skrypt, tak naprawdę? Oprócz tego promptu, który tam mieliśmy, tego prostego, skrypt dodatkowo generuje nam pytania i przypisuje je do tych naszych obszarów tematycznych. Jeżeli mieliśmy te obszary tutaj, to jeżeli zostaną wygenerowane jakiekolwiek pytania, to zostaną jeszcze te pytania przypisane do tych obszarów. Będzie to robione przez model znowu językowy, więc właściwie rezonningowy, więc mamy dwa zapytania do modelu i jedno zapytanie do API. Oczywiście teoria już była, teraz praktyka, zobaczymy sobie jak to wygląda. Czyli najpierw pobieramy sobie te nasze pytania z Google'a poprawne 9 pytań oczywiście tu nie wyświetlam wszystkich teraz generujemy intencje obszary czyli to co robiliśmy za pomocą to co robiliśmy w czasie GPT dostaliśmy podobne wyniki aczkolwiek pamiętajcie o tym że czat GPT może nam skrajnie inny, może nie skrajnie, ale może nam dawać różne wyniki, dlatego, że my bezpośrednio pytamy teraz model, przepraszam, jeszcze przewinę tutaj, zanim przejdziemy dalej, mamy 4 z 6 intencje wykorzystane i niech każdy obszar jest po 5. Następnie przypisanie PA do obszarów, czyli wysyłamy to jeszcze raz, no i zobaczmy nasz główny artykuł, jak obniżysz kortese za po 40 i przeglądamy się definicyjna PA. Pierwsze mamy przepisane, jak obniżyć kortyzol po menopauzie. Pasuje? Pasuje, ponieważ chodzi nam o kortyzol po 40, definicyjna, menopauza jak najbardziej z tym związana. Tutaj mamy kolejne objawy wysokiego kortyzolu. Po czym poznać, że mam wysoki kortyzol? Pasuje? Pasuje. Techniki redukcji stresu, co natychmiast obniża poziom kortyzolu. Jeżeli się przyjrzycie, to te pytania, które pasują, zostały Natomiast nie zostały przypisane pytania, które. Po pierwsze, to jak było w definicji, zaraz jeszcze ten prąd Wam pokażę, które powtarzają główne nasze zapytanie, albo które nie pasują, albo są duplikatem tak naprawdę. Jeszcze zwróćmy sobie uwagę na te drugie zapytanie. Przypisz pytania PA do odpowiednich obszarów. I tu jest cała instrukcja. Również o tym, żeby pomijać przykład i output. Super skrypt według mnie jeszcze bardziej nam określa te nasze obszary. Przepraszam, może przejdę do wyników. Jeszcze bardziej określa nam te obszary i daje nam jeszcze lepszy kontekst do napisania artykułu. Zobaczcie, takie coś, taki wynik tego skryptu. Też pamiętajcie, że możecie go sobie skopiować. Jest w plikach uruchamiać. Bardzo prosto sobie kolaba z tym założyć. potrzebujecie tylko API do modelu językowego, w tym przypadku to jest z OpenAI no i potrzebujecie też data for sale to jest według mnie świetny brief już dla copywritera dobrze, ale żeby nie było za łatwo przejdziemy sobie jeszcze do algorytmu który tutaj też opisałem i stworzyłem ale algorytm będzie już nam pokazywał kontekst makro i mikro i chwilę się na nim skupimy. Jeżeli kiedykolwiek w całej tej lekcji będę mówił o mikro semantyce, to ona będzie dotyczyła danego artykułu, czyli tego jednego konkretnego, którym się zajmujemy. Makro to będą pozostałe obszary. W naszym przypadku tego query fanouta teraz to będzie to będą artykuły dodatkowe, które warto by stworzyć, żeby otoczyć ekspertyzą, ekspertkością, o Jezu, nie wiem jak to powiedzieć, za dużo gadam, ten nasz artykuł. I słuchajcie, polega to, pipeline jest podobny do tego, co robiliśmy wcześniej, z jedną dużą różnicą. Jeżeli już zrobimy sobie ten fanout intencyjny i fanout tematyczny, to później jeszcze robimy tak zwany test samodzielności. Po co? po to, żeby wyobrębnić te obszary, które na 100% powinny być w naszym artykule, czyli dobrane bardziej do tej intencji. W tym przypadku kortyzolu będzie to pewnie instrukcyjna, bo mamy jak obniżyć, ale też daje nam taką możliwość stworzenia listy tematów dodatkowych, które mogłyby nasz ten artykuł jakby wspomagać, bo zbudujemy bardzo duży makroobszar tematyczny. Czyli słuchajcie, w praktyce możemy wykorzystać query Funout do budowania content planu, który będzie naprawdę semantycznie powiązany z tym naszym zapytaniem. Jeżeli za każdym razem będziecie to robić, a pokażę Wam jak za chwilę za pomocą promptu, więc też wcale nie musi być Python, to zobaczycie, że możecie zbudować sobie świetny obszar, który Wam zagospodaruje całą kategorię, stronę, co tu owej będziecie chcieli. pytanie też z samodzielności polega na tym że dla każdego obszaru sprawdzamy obszaru, pamiętacie, czyli była intencja, do intencje jest tam maksymalnie 5 obszarów może być więcej, ale ja używam 5 czy użytkownik mógłby wpisać to jako osobne zapytanie jeżeli tak to temat kwalifikuje się jako osobny artykuł jeżeli nie, no to jest nasz mikroobszar ale nawet jeżeli temat kwalifikuje się jako osobny artykuł, to nie jest nic powiedziane że nie warto go lekko wspomnieć w naszym artykule. Więc możemy też zbudować jakieś sekcje z tym makroobszarem, wspominając tylko o nim, w samym osobnym dokumencie rozbudować go i opisać i to aż się prosi, żeby dać link wewnętrzny. Więc ja zapisuję sobie te powiązania między makro i mikro, po to, żeby w przyszłości później w bardzo łatwy sposób semantycznie dodać link wewnętrzny. Więc mamy tak naprawdę wynik końcowy to artykuł bazowy. Możemy tak nazwać, w sensie ta lista obszarów i plan publikacji, taki backlog na kolejne artykuły. I zaraz pokażę Wam to w praktyce. Teraz zajmiemy się zaawansowanym generowaniem tych obszarów mikro i makro, o których wspominałem wcześniej. To będą te dwa prompty, pierwszy i drugi. Część pierwsza, część druga. One są ze sobą powiązane. I oczywiście też macie opis, tak jak wspominam na samym początku, co jest inputem. Ważna jest rzecz, że tutaj w części drugiej inputem będzie output z tej części pierwszej. Ale najlepiej oczywiście w praktyce. Więc przejdziemy sobie do platformy OpenAI. Dlaczego? Dlatego, że ja jednak wolę pracować na czystym modelu. Możecie oczywiście to używać, tych dwóch promptów. W czacie GPT nie ma z tym, moim zdaniem, problemu. Jeżeli coś będzie zakłócone, no macie czat GPT i możecie sobie przefiltrować. Pierwszy prompt to tak naprawdę nasz ten prompt, którego używaliśmy wcześniej. Ja widzę tylko tutaj, że jeszcze mi brakuje jednej intencji. Szybko ją dopiszę. Dobrze. Sobie tylko to też zapiszę. I teraz mały protip, a może nawet nie taki mały. Jeżeli korzystacie z platformy OpenAI, warto te prompty zapisywać. Jeżeli je zapiszecie, to zobaczcie, co dostaniecie. API, który jest skonfigurowany już z tym promptem, gotowy do użycia. Nie musicie wysyłać dużego promptu, tego który znajduje się w polu system. Możecie po prostu korzystać z tego API w dowolnym miejscu, a prompt zmieniać, edytować tylko tutaj. Dla mnie to jest game changer, bardzo fajne rozwiązanie. Dawno nie zaglądałem do samej platformy, więc teraz uważam, że OpenAI zrobił bardzo duży krok naprzód. Jeżeli stworzycie sobie takie API, tak jak mówię, możecie to przypisywać w różnych pipeline'ach, nie martwiąc się o tym, że macie ten sam prompt w wielu miejscach, zarządzacie z jednego. Zapisaliśmy to. Oczywiście w user promptie jest nasze słowo kluczowe, jak obniżyć po 40. Trochę teraz zrobimy to samo, co robiliśmy w czasie GPT, ale tylko po to, żeby skopiować ten output, ponieważ naszą mikro-semantykę wszystko, co dostaniemy, przepraszam, może tak, inaczej, wszystko, co dostaniemy, będziemy teraz przefiltrowywać w następnym prompcie, klasyfikować jako mikro- i makro-semantykę. Więc dostajemy podobne wyniki do tego, co mieliśmy. Ja to wszystko skopiuję. I przejdziemy do naszego drugiego który tak naprawdę promptu, jest klasyfikacją na mikro i makro, tak jak wam mówiłem i dokładnie to opisujemy w samym prompcie. Ten promp też macie w lekcji, ja nie będę go bardzo tutaj szczegółowo omawiał. Dodaję pewne wtrącenia. To też przetestowane było, dlatego trzeba było dopisać. Wynik to obszary tematyczne według intencji, nie struktura artykułu. Tylko, że model się upierał i próbował mi wciskać kit, że to już jest mój gotowy artykuł. Czasami nawet mi przygotował outline, czyli ten spis treści. Test samodzielności, o którym mówiłem. Dla każdego obszaru tematu zadaj pytanie. Czy użytkownik mógłby wpisać to jako osobne zapytanie i oczekiwać osobnej, pełnej odpowiedzi? Ja wiem, że na ekranie nie powiększam też za każdym razem tych fontów dla Was, nie przybliżam obrazu, ale może będziecie oglądać drugi raz ten film. Otwórzcie sobie w notatniku ten prompt i będziecie widzieli dokładnie o czym mówimy. Jeżeli użytkownik może wpisać jako osobne zapytanie, to jest obszar makro, jeżeli nie, to jest mikro. Zasady klasyfikacji i oczywiście przykład. Dobrze. Tutaj dodajemy jako user message nasz output z poprzedniego. Zapomniałem jeszcze, że musimy to dobrze sformatować, dlatego wklejam sobie do notatnika. Jak się kopiuję z odpowiedzi z platformy, nie wiem dlaczego, znika nam formatowanie, przenoszenia do nowych linii. Teraz już jest dużo lepiej. I wysyłamy to do modelu językowego, bo jest dodatkowe jakieś wiadomości. Nie jest nam potrzebne, tutaj już mamy user, mamy system. I zobaczymy, co tutaj się zadzieje. Oczywiście model rezonningowy. Rezonning effort podniesiony na high, bo ja dlatego, że chciałbym, żeby to było naprawdę bardzo dobrze zrobione, ponieważ to będzie fundament nie tylko tego jednego naszego dokumentu, tego artykułu, ale również nam zrobi cały scope, taki przestrzeń do napisania innych artykułów. Przyjrzyjmy się od góry. Artykuł główny, jak obniżyć kortyzę po 40. Intencja instrukcyjna i tu mamy raz, dwa, trzy, cztery, pięć obszarów. Zobaczcie. Instrukcyjna pasuje najbardziej, to co mówiłem wcześniej, więc jakby ja sam tego nie wymyśliłem, model świetnie to dobrał. Do tego decyzyjna, wybór strategii redukcji, od czego zacząć, rodzaj treningu, wybór badań, wybór suplementów. Świetnie. I zobaczcie, tak naprawdę to dopiero teraz mamy to, co powinniśmy dostać. Czyli nasz artykuł powinien się ograniczyć tylko do intencji instrukcyjnej i decyzyjnej, żadnych innych, ponieważ te intencje tu przeważają i nie ma sensu tworzyć tak zwanych filerów, czyli jakby części artykułów, które nie mają, nie wnoszą nic do tematu, które nie są potrzebne. I to jest jak tak naprawdę, to jest semantyka, taka prawdziwa semantyka sama w sobie, dlatego też wam mówiłem na samym początku, że to według mnie jest jedna z najważniejszych lekcji. Testowałem to też na te prompty, ponieważ ja jakby wcześniej używałem trochę innych, ale to zaktualizowałem je, testowałem je przed lekcją. Samą lekcję przygotowywałem parę godzin. na innych zapytaniach, zupełnie innych, po to, żebyście mogli to wykorzystywać już u siebie. Your money, your life, czy jest ryzyko? Tam, gdzie nie ma, to nie ma. Tam, gdzie jest potrzebne, to tak. No i przyjrzymy się artykułom dodatkowym. Czy coś, co mogłoby stworzyć być samodzielne? Oczywiście model przerzucił nam tutaj wszystkie obszary, które nie były wpasowane w te nasze główne intencje. Wysoki kortyzol, objawy, skutki zdrowotne. Ja uważam, że to jeszcze można by było przefiltrować. Natomiast jeżeli byście chcieli pisać o kortyzolu, to mi się wydaje, że mielibyśmy ten topic authority zagospodarowany tutaj, dlatego że nasz artykuł, to pamiętacie, że jak obniżyć i po 40, natomiast tutaj wszystko tak naprawdę, co dotyczy samego kortyzolu. I na tym zakończę tę naszą lekcję. Wrócę jeszcze chwilę do tego algorytmu. Ten algorytm macie, algorytm mikro-makro. Macie go też opisanego w naszej lekcji, w teorii, na samym końcu. Więc możecie sobie temu przyjrzeć, ewentualnie to sobie skopiować, rzucić do modelu, wykorzystać w jakikolwiek sposób. Jest też flow, jak to powinno wyglądać w skrócie. Więc mam nadzieję, że ta lekcja Wam zmieni podejście do przygotowywania contentu, a w następnej wykorzystamy już nasz query fanout, wykorzystamy wszystko, co mamy, encje, fakty, ideations i inne rzeczy, które pobraliśmy wcześniej z treści zewnętrznych i zbudujemy graf wiedzy, zbudujemy wielką przestrzeń, spróbujemy ją zwizualizować. Dzięki. 

</details>

---

<div class="lesson-completion-bottom" data-lesson-id="ai-content-expert/blok-2/lekcja-8"></div>

<div id="sensai-comments"></div>


---

# 2.9 Budowanie grafu wiedzy

<div class="lesson-meta">
  <div class="lesson-mentor">
    <img class="lesson-mentor__avatar" src="https://framerusercontent.com/images/t2GGO1yled5Z8wSFTTJMQHHzd4.png?scale-down-to=512&width=2976&height=2949" alt="Maciej Chmurkowski" />
    <span class="lesson-mentor__info">
      <span class="lesson-mentor__label">Mentor</span>
      <span class="lesson-mentor__name-text">Maciej Chmurkowski</span>
    </span>
  </div>
  <div class="lesson-rating" data-lesson-id="ai-content-expert/blok-2/lekcja-9"></div>
  <div class="lesson-completion" data-lesson-id="ai-content-expert/blok-2/lekcja-9"></div>
</div>

<div style="position:relative;padding-top:56.25%;"><iframe src="https://player.mediadelivery.net/embed/565073/c23adc2d-cc74-4bcc-a9ae-3189eb21ddda?autoplay=false&loop=false&muted=false&preload=true&responsive=true" loading="lazy" style="border:0;position:absolute;top:0;height:100%;width:100%;" allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;" allowfullscreen="true"></iframe></div>

<br />

## 🎯 Cel lekcji

Nauczenie się budowania grafu wiedzy z wyekstrahowanych encji i relacji.

---

## 📒 Notatka z lekcji

### Co to jest graf wiedzy

Graf wiedzy to uporządkowana reprezentacja informacji, gdzie:

- **encje** (osoby, marki, pojęcia, procesy) są węzłami,
- **relacje** między encjami są krawędziami,
- reszta (fakty, dane mierzalne, pomysły, fan-out) to "warstwa treści", którą przypinasz do grafu.

### Po co go robimy (praktycznie, pod artykuł + LLM)

- **Jedno źródło prawdy**: zamiast 5 plików i notatek w różnych formatach — 1 spójny obiekt.
- **Kontrola kontekstu dla LLM**: dajesz modelowi _to samo_ zawsze, w tej samej strukturze → mniej halucynacji, lepsza spójność.    
- **Łatwe cięcie kontekstu**: możesz później wycinać pod-zbiory (np. tylko encje + relacje + 1 intencja).    
- **Analiza embeddingowa**: encje/relacje mają opisy-konspekty → embeddingi są sensowne i możesz wyłapywać outliery.    

---

## Dobre praktyki

1. **Minimalny, stabilny schemat**    
    - Im mniej pól, tym mniej "miejsc do zepsucia JSON".        
    - Bogactwo ma być w danych, nie w strukturze.        
      
2. **Opisy (konspekty) tylko tam, gdzie to pomaga LLM najbardziej**
    
    -  `entities[].description` i `entities_relationships[].description`**.     
    - To poprawia "rozumienie" bez puchnięcia reszty.
    
3. **Relacje tylko dla encji**
    
    - Reszta (facts, ideations, measurables, fan-out*) to nie graf relacyjny 1:1, tylko elementy warstwy treści.    
    - Dzięki temu graf encji jest czysty i łatwy do rysowania.
    
   
4. **Weryfikacja i sanity check**
    
    - Unikalne ID, brak duplikatów encji, relacje sensowne semantycznie.    
    - Minimum: "czy każda relacja wskazuje na istniejące entity_id?"        

---

## Nasze składowe grafu 

Z poprzednich kroków zbieramy do pliku tekstowego  `kg_input.txt`:

- **Encje i relacje encji** (z konspektami)    
- **Fakty** (krótkie, jednozdaniowe)    
- **Ideations** (pomysły/angle na sekcje)    
- **Dane mierzalne** (metryki, które potem możesz uzupełniać)

---

## Pipeline skryptu

```
scraped_content_all.txt
    ├──→ ner_builder_colab.py ──→ entities.json
    └──→ data_extractor.py ──→ extracted_data.txt
                │
                ▼
        kg_assembler.py ──→ kg_output.json
```

---

### Input 1: entities.json

```json
{
  "entities": [
    {"entity_id": "E001", "entity_name": "...", "type": "...", "description": "..."}
  ],
  "entities_relationships": [
    {"entity_id2text": ["Source", "Target"], "predicate": "CAUSES", "description": "..."}
  ]
}
```

**Typy encji:** HORMONE, PRODUCT, PROCESS, SYMPTOM, DISEASE, TOPIC, PERSON, ORGANIZATION, ROLE, MEDIA

**Predykaty:** CAUSES, REDUCES, RELATED_TO, PART_OF, AFFECTS, TREATS, PRODUCES, REQUIRES

---

### Input 2: extracted_data.txt

```
#Facts
- Fakt pierwszy.
- Fakt drugi.

#Measurable data
- Opis - [wartość][jednostka]

#Ideations
- Pomysł na content.
```

**Format measurable:** `Poziom kortyzolu - [10-20][µg/dL]`

---

### OUTPUT: kg_output.json

Scala oba pliki: `entities`, `entities_relationships`, `facts`, `measurables`, `ideations`

---

## 📚 Materiały dodatkowe

### Powiązane pliki

**PLIKI JSON**



---

**PROMPTY**





---

**SKRYPTY PYTHON**







---

<details>
<summary>📝 Transkrypcja wideo</summary>

Dotarliśmy do grafu wiedzy, więc na tej lekcji pokażę Ci, jak ja buduję te grafy wiedzy, jakie są najważniejsze, dobre praktyki w budowaniu takiego grafu wiedzy, ale na początek oczywiście kilka informacji organizacyjnych. Tak jak to już mam w zwyczaju, na górze w tym opisie tekstowym naszej lekcji masz informacje o powiązanych plikach. Więc będzie też plik JSON, którym sobie omówimy taką bardzo podstawową strukturę i budowę grafu wiedzy. Dwa prompty, które ja użyję w tej lekcji i dwa skrypty Pythona. I teraz bardzo ważna uwaga, ponieważ tutaj zaczynają się nam rzeczy komplikować i input do grafu wiedzy, tego, który będziemy robić za pomocą Pythona, już potrzebuje danych z innych skryptów, które robiliśmy też wcześniej, z innych lekcji. Załączyłem tutaj pipeline, w którym widzicie z czego się biorą te dane i oczywiście też krótki opis, jaka ma być postać tych plików, ponieważ to nie jest jednoznaczne, że każdy z Was mógłby robić to w zupełnie inny sposób, więc albo dostosujecie sobie ten skrypt Pythona, albo skorzystacie z tego schematu, który tutaj załączyłem do tych dwóch plików, które są, ale to jeszcze sobie też omówimy. Kilka słów wstępu teoretycznych. Co to jest ten graf wiedzy i po co nam jest tak naprawdę? Więc graf wiedzy to jest sposób prezentowania, porządkowania danych, które już mamy. Możemy to zrobić w różny sposób. Ja robię to za pomocą tablicy JSON. Możecie też zrobić za pomocą pliku CSV, gdzie w danych kolumnach będą dane kolejne dane. Natomiast JSON pozwala też na zagnieżdżenie tablic. Dzięki temu możemy zbudować sobie siatkę tych połączeń. W CSV będzie to trochę trudniejsze. Co zawiera graf wiedzy? W naszym przypadku będzie zawierać encje, relacje tych encji. To już mamy zrobione, więc tutaj będziemy to podawać jako input. I reszta rzeczy, które też mamy zebrane, czyli fakty, dane mierzalne, pomysły. Tutaj też piszę o fanoutcie, natomiast to jest kwestia waszego podejścia. Ja fanout robię osobno i fanout nie jest, w moim rozumieniu, nie jest bazą wiedzy. Fanout jest rozbiciem na obszary tematyczne, które mają być wykorzystane w tym danym naszym artykule. Więc ja go nie wrzucam do tego grafu wiedzy, ale wy możecie to zrobić jak najbardziej. To, tak jak powiedziałem, to zależy od waszego podejścia. Po co robimy ten graf wiedzy? Mamy jedno źródło, które możemy później wykorzystywać i na różnych krokach. To jest też istotne, dlatego że będziemy później budować różne kroki, różne te cegiełki, o których mówiłem. które generują content i za każdym razem będziemy mogli sobie dodać jako kontekst ten plik nasz z tym grafem wiedzy. Nie trzeba będzie tego w żaden sposób inny podawać modelowi, uploadować i zawsze mamy tą samą strukturę. Więc już mamy uproszczenie, że w tych naszych promptach zawsze wykorzystujemy tą samą strukturę, więc odchodzi nam bardzo dużo roboty zastanawiania się co gdzie jest. Na pewno łatwiej też jest zarządzać. Tutaj też załączyłem Wam informacje, łatwe cięcie kontekstu. Mówimy o zagnieżdżeniach, możemy znaleźć podzbiory, wykorzystać. Też następna lekcja będzie dotyczyła panowania nad długością kontentu, nad tak naprawdę wiedzą, która jest tam wykorzystana. Więc mając postać w JSON grafowiedzy, możecie to robić w bardzo łatwy sposób. I na koniec jeszcze jedna rzecz. Jeżeli możemy wszystkie te elementy grafowiedzy zembedingować, a możemy, to zobaczcie, już to niesie, przychodzi dużo pomysłu do głowy, jak można by było z tym zarządzać. Moglibyśmy sobie zbadać na przykład similarity score pomiędzy elementami, zobaczyć, czy nie mamy jakichś tak zwanych outlayerów, czyli czegoś, co nie jest nam potrzebne do tego grafu wiedzy i to po prostu z niego wyrzucić. Jakie są dobre praktyki, jeżeli chodzi o graf wiedzy? Pamiętajcie, im mniej schematu rozbudowanego, tym lepiej, bo my to wysyłamy do modelu językowego. Później, jeżeli będziemy generować oczywiście te treści, tak? Więc tutaj nie przestańcie ze strukturą. Łatwo, dobrze jest tak naprawdę uprosić sam schemat. dodawajcie opisy to jest bardzo ważne dlatego, że w wielu systemach w wielu jakby podejściach spotykamy, że relacje które są podawane w tablicach one są pomiędzy ID jednej NC i ID drugiej nie zawsze model językowy będzie sobie mógł z tego ID wyciągnąć nazwę tej NC Więc ja podaję tutaj, to jest bardzo ważne, punkt numer dwa. Podajcie opisy, podajcie jak najwięcej, czyli jeszcze też kontekst, którym jest na przykład dana encja. Więc ja to stosuję do encji i do opisu, do relacji tych encji. To jest najważniejsze, bo fakty, ideations, one same w sobie są już opisane. Relacje tylko do encji, no to już mamy te encje zrobione, także widzieliście w poprzednich lekcjach, że tutaj encja bez relacji nie jest dla mnie encją. Nie jest nam do niczego przydatne. No i jeszcze jest bardzo ważna weryfikacja. Na sam koniec. Podsumowując, nasze składowe grafy to są encje i relacje. Mamy. Fakty? Mamy. Ideations i dane mierzone. Ideations, pomysły na sekcję. Dobra. I teraz przejdziemy sobie już do praktyki. Dobrze. Przyjrzyjmy się teraz grafowi wiedzy. W praktyce, jak widzicie, to jest plik JSON. To są tablice, które są również zagnieżdżone. Mamy tu oprócz meta, który jest naszym wprowadzeniem, zaraz też o nim powiem, mamy pięć elementów. Meta nie jest do niczego, nie będzie przez nas używane, ale dobrze zostawić takim pliku ślad. Gdybyście kiedyś chcieli do takiego pliku wrócić, to będziecie wiedzieli, czego ten graf wiedzy dotyczy, a możecie spodować sobie tak naprawdę bazę tysiąca takich plików i wtedy sięgając bezpośrednio do pliku będziecie mogli zobaczyć, jakie to było słowo kluczowe, czy zrobić jakiś prosty mechanizm wyszukiwania. Więc mamy encję, id, dobrze by było, żeby każda encja miała swoje id, aczkolwiek tutaj my nie będziemy znowu tego id używać, bo my będziemy się posługiwać nazwą tej encji, czyli tak naprawdę jest wartością tej nazwy i jakiś tam opis. To, co mówiłem na początku w teorii, dajemy description. będziemy tworzyć te opisy przez LME, dlatego, że sama nazwa NC niewiele nam daje i sam jakby sama struktura NC w jej relacji jest spoko, ale lepiej jest jak wszystko opiszemy, czyli opisujemy i NC i tutaj mamy description do relacji, czyli kontekst w jakim NC łączą się między sobą opis ich powiązania, bo jak widzicie tutaj, to jest entity name 1, entity name 2 i tutaj predicate, czyli jakie jest powiązanie pomiędzy jedną encją drugą. I to już nam sporo daje, ale lepiej jak będziemy mieli i opis tego powiązania kontekst i opis każdej encji osobno. I to już gwarantuję Wam, że każdy model językowy sobie z tym poradzi. Fakty dane, fakty dane, mierzalne, pomysły, to są rzeczy, które są po prostu w prostych tablicach, tu jest dużo łatwiej, są po prostu wylistowane. I tak, moi drodzy, wygląda nasz graf wiedzy. On jest będzie rozbudowany, oczywiście tych elementów będzie N. Przechodzimy do promptu pierwszego z naszej lekcji dotyczącej grafu wiedzy. Jak wiecie, w każdej lekcji staram się podzielić konspekt tej lekcji na dwie części. Jedną to taką, którą ktoś nie do końca techniczny będzie mógł wykorzystać i korzystać z czatu GPT. I też teraz zajmiemy się generowaniem grafu wiedzy w czacie GPT. a później przejdziemy już do tej części bardziej skomplikowanej, zaawansowanej, gdzie użyjemy Pythona. I teraz jeszcze jedna ważna informacja, bo do tej pory tworzyliśmy tak zwany pipeline, czyli taki flow, w którym po kolei dochodziliśmy do kroków, w których przetwarzaliśmy treść. Możecie graf wiedzy zrobić bez wyciągania na przykład NC, tylko możecie NC, już tutaj jak widać na ekranie, NCS budować również bezpośrednio w tej grafie wiedzy. I co tutaj będzie naszym inputem? Naszym inputem będzie tutaj po prostu ten tekst. I ten tekst to może być to, co pobraliście ze strony internetowej. Ten tekst to może być wasz tekst albo treść jakiegoś artykułu, który macie i uważacie za wartościowy. Dlatego też przygotowałem te pierwsze dwa, bo jeden jest w formie tekstowej, a drugi w formie JSON-a. Przygotowałem tak, żeby były uniwersalne, żebyście nie musieli podpinać całego tego pipeline'u. A przypomnę, jak to robiliśmy na początku, do czego doszliśmy i co będzie inputem w tym już zaawansowanym skrypcie. Słuchajcie, zrobiliśmy najpierw sobie, pobraliśmy dla słowa kluczowego, jak obniżyć kortetol po 40, pobraliśmy sobie URL z top 10 i to było Google i parę URL z Binga. W skrócie szybko powiem. Później wyciągnęliśmy z tych URL content, tak jak tu widzicie, To są bloki tekstu pobrane z każdej z tych stron. Jest tego sporo. Pokażę wam, przewinę. I na końcu są jakieś śmieci, które nam się... To się zdarza. Dlatego potrzebne nam jest czyszczenie. Jest o tym też lekcja o czyszczeniu. Wyczyściliśmy sobie content. Zrobiliśmy to używając embeddingów. Więc tutaj widzicie już tylko o kortyzolu rzeczy. Bardzo fajnie wyczyszczone. A na koniec... Właściwie jeszcze nie koniec, ale wyekstraktowaliśmy dane. Tak one wyglądają. Czyli z tego tekstu, z tych bloków tekstu wyciągnęliśmy sobie jest na tym lekcją, jeszcze raz przypominam. Fakty, dane mierzalne, jak tu widzicie, zalecana ilość snu dla dorosłych, 7-9 godzin na dobę. Ideations, czyli pomysły na to, co może się znaleźć w takim artykule. I to jest świetny input i jest dużo lepszy według mnie niż, zobaczcie, to. niż duża ilość tekstu, dlatego że to też jest zjadacz tokenów. Jeżeli to będziecie wysyłać za każdym razem bardzo dużej ilości tekstu, będziecie więcej płacić, a dwa, że tutaj to już jest ustrukturyzowane, to jest konkretne i naprawdę robi robotę. Mamy też ENCIE. ENCIE mamy w tej postaci, to są ENCIE z tego nagrania, które widzieliście w webinarze, więc jeszcze raz powtórzę. Te dane w postaci takiej strukturalnej, już wyciągnięte fakty, dane mierzalne i relations i encie będą potrzebne nam do skryptu Pythona. Natomiast teraz zrobimy sobie ten prosty graf wiedzy. Tu mamy tekstowy graf wiedzy. Najpierw omówię z Wami ten prompt, później go przerobimy w czacie GPT. Więc oczywiście rola, Chciałem na początku zażartować i zrobić wam, jesteś bestią semantyczną, ale zróbmy, no tak jak powinno być. Jesteś ekspertem semantycznym, zajmującym się analizą danych leksykalnych i tekstowych. Pamiętacie, że rolę sami możecie nadać, nie upierajcie się na konieczność, którą ja używam. Ja to robię po prostu z doświadczenia i wiem, że to przynosi dużo lepszy efekt. I znowu cel, uporządkuj dostarczone informacje w czytelny, tekstowy graf wiedzy. Możecie używać graf wiedzy, modele dokładnie wiedzą, co to jest graf wiedzy, nie tak w przypadku query fun out. Graf wiedzy możliwy do bezpośredniego użycia w czasie GPT, który będzie reprezentacją wiedzy dla podanego słowa kluczowego. W tym miejscu mam moje nawiązanie do słowa kluczowego, bo my chcemy, żeby spośród tych wszystkich tekstów, bloków tekstu, modeli językowe wyciągną tylko te, które będą powiązane z tym naszym słowem kluczowym. Więc to jest już pierwsze uczepienie. To jest bardzo ważne, bo słowo kluczowe oczywiście jest podane jako input tutaj na dole. Tutaj będziemy wklejać tekst, a tutaj jest nasze słowo kluczowe. Jeżeli chcecie to puścić do API, to to jest user prompt, a reszta jest system prompt. A jeżeli to puszczacie w czasie JPT, to bierzecie to całość, tylko zmieniacie sobie słowo kluczowe i wklejacie treść, którą pobraliście, którą chcecie wykorzystać. Dobra, lecimy dalej. Oczywiście reguły. Ja nie chcę czytać wszystkiego, bo to się powtarza, ale chcę, żebyście widzieli, jaka jest konstrukcja. Bardzo ważne tylko przy tym rzeczy. Nie dodawaj żadnych informacji poza tymi, które znajdują się w dodanych blokach tekstowych. Opieraj się tylko na poniższych tekstach. To powoduje, że ograniczamy ten model do tego, żeby nie halucynował, żeby nie brał niczego ze swojej bazy wiedzy. I tutaj macie rzecz, którą możecie oczywiście zakazać, pobierania, ceny zazwyczaj dane wrażliwe. Możecie sobie taką listę zrobić, nawet jedno po drugim wpisać. I tu jest już duża, duża. Zobaczcie, że sam prompt nie jest skomplikowany. Jak na prompty, które ja piszę, to podczas tego kursu te prompty nie są bardzo rozbudowane, ale jeszcze dojdziemy na pewno do rozbudowanych. Więc zobaczcie, tu są NCI, to jest trochę to, co mieliśmy już podczas robienia NC, tylko to jest skrócone, bardzo jakby zawężone, żeby tam to zrobił szybko i dobrze. Definicje to są dane mierzalne i oczywiście output, wejście, wyjście, wejście to jest jeden blok tekstu. Możemy to nawet poprawić, bo tak naprawdę bloki tekstu to powinny być zarabierające. i nawet nie ENCIE. No tak, dobrze. Wloki tekstu zawierają się ENCIE, relacje, fakty, zdane, mierzalne. To nie ma takiego znaczenia. Wyjście i tutaj mamy strukturę, jaką chcemy mieć. Jak mają wyglądać ENCIE. To, co wam mówiłem. Powinniśmy może w sumie nawet jeszcze dodać gdzieś description, ale ja na razie to zostawię. Nie chcę tego robić live. Myślę, że obejrzyjcie sobie jeszcze raz. Cofnicie się do tego, o czym mówiłem. o opisaniu dychencji. Jak trochę posiedzicie z generowaniem tego grafu wiedzy, to zobaczycie, o co chodzi. Myślę, że najlepiej będzie, jak to teraz sobie wypróbujemy w czacie GPT. Jest nasz czat GPT, więc tutaj wklejam sobie ten cały prompt, idę na dół i tutaj jeszcze potrzebujemy to zamienić na bloki tekstu, więc przejdę do tego, co już mieliśmy oczyszczone, żeby było łatwiej. Wklejamy i lecimy. Nieciekawy w jakiej kondycji jest nasz czatek GPT. Także może w międzyczasie, żeby umienić Państwu czekanie, jeszcze raz powiem, to jest sposób, który generuje graf wiedzy, który nam przyda się do generowania artykułów za pomocą czatu. Jeżeli jesteście, nie robicie tego hurtowo, jeżeli chcecie po prostu pisać od czasu do czasu dobre artykuły, to musimy zbudować sobie ten świetny graf kontekst, po to, żeby później lepiej pisać. Więc wystarczy, że macie tylko bloki tekstów powiązane z danym tematem. Użyjecie tego promptu. i zaczyna się zabawa. To, co mówiłem, meta, wszystko mamy opisane. NC jest kontekstem. Jak już widzimy, te NC są bardzo fajnie. Fajnie zrobione. Super powiązany jest kontekst do nich dopisany. Tego jest dużo, bo tekstów też było sporo, ale zobaczcie, NC jest świetnie zrobił. Zaraz będą relacje do tych NC. Wszystko, co chcemy. Jest też okohol, kofeina. Znacie ten temat kortyzolu już ze mną. Myślę, że po kursie wszyscy będziemy wiedzieli, jak obniżyć kortyzol. I to będzie się generować. Ner w tym temacie znajdował mi nawet i po 50-80 enci. Ale mamy już relacje i to jest sporo. Czyli ta kortyzol jest wytwarzany przez nadnercza. a dokładniej przez korene odnaczy. Także widzicie, wszystko to jest jakby strukturalnym przedstawieniem tamtego tematu, ale to już nie są takie bloki teksty powtarzające się. Zresztą w samych tych artykułach jakby to sprawdzić. Robiliśmy oczywiście czyszczenie, ale pewnie można by było to stracić wszystko do jednego dużego artykułu, prawda? Więc wracając do naszego do naszego grafu wiedzy, no i mamy fakty. I jeszcze raz ten graf wiedzy może być briefem do napisania nie tylko przez model językowy, ale przez copywriter. Dane mierzalne. Wygląda świetnie. Ja już nie będę czekał. Jeszcze chciałem zobaczyć na pomysły. Dlatego, że te pomysły to zawsze jest taki sporny temat. ale tutaj macie pomysły też jak zobaczcie sami, jak można uatrakcyjnić, jaką narrację wprowadzić do danego artykułu tu są akurat porady także mamy świetną rzecz już zrobioną i to jest pierwszy krok, teraz zrobimy to samo ale dla JSON-a, czyli dla tej struktury, którą byście chcieli gdzieś zapisać i wykorzystać dalej. Więc to jest ten drugi nasz gra w wiedzy JSON. Zasada jest ta sama. Tak naprawdę prompt jest niemalże identyczny poza outputem, więc tutaj prosimy, żeby już te opisy zrobił w ręcjach, o tym co wam mówiłem, i żeby to JSON i tu wyślemy to już bezpośrednio do API. Czyli idziemy sobie na platformę. Możecie też użyć Pythona, żeby to wysłać. I oczywiście to wszystko przechodzi nam do user promptu. Główne słowo kluczowe się nie zmienia i dodamy tutaj jeszcze sobie nasz ten cały content, który mieliśmy. Zostawmy sobie jeszcze rezonning. Zobaczcie, jak tego dużo jest kontentu. Rezonning sobie dobrze jest okej. Nie chcę za długo czekać. Jak bardzo chcecie długo czekać, jak dużo macie kasy na przypalenie, to myślę, że w tym przypadku medium wystarczy. I lecimy. I teraz będzie ten sam proces. Też to trochę zajmie. Więc myślę, że Mateusz nam tutaj wytnie ten moment, aż dojdziemy do samego końca. Aż będziemy mieli całość. Zobaczcie, dużo szybciej nam poszło, niż wcześniej z czatem GPT. Świetnie opisy do każdego NC. Tak jak mówiłem, jest E3, to jest identity ID, Core Run NERC, i to są na razie nazwy ENCI. Zaburzenia snu, tertosteron. Podobnie, prawda? Ważne są teraz relacje. Jest, mamy. Przyjrzyj się do paparu tylko, czyli jeżeli nam się uda zatrzymać ekran na chwilę. Tak, mamy... Zobaczcie, tutaj jest akurat po polsku, czyli kortyzol jest produkowany na narzach, bo mamy pierwszą ENCIę i drugą, która jest z nią opowiedzowana, powiązana, w jaki sposób jest powiązana, ale tutaj macie już całość, więc z tego JSON-a możecie wyciągnąć. Kortyzol jest produkowany w tendnerchach i jeszcze raz description. Więc być może to się może powtarzać, ale czasami ten description daje dodatkowy kontekst. To się jeszcze robi? Nie będziemy czekać. Macie zatem dwa prompty, który jeden Wam wygeneruje tekstową graf wiedzy, czyli taką naprawdę basolinną bazę tej więzy, którą możecie używać, bo taki tekstowy również możecie wysłać do modelu językowego przez API, Pythona i tak dalej. Nie ma problemu, natomiast ja zawsze uważam, że dane, które mają strukturę są dużo lepsze. I ten drugi możecie, wiecie jak używać Pythona już, możecie zastosować w swoich systemach. Najważniejsza rzecz, którą przypominam, że te dwa prompty robią nam z bloków tekstów, nie z już wyekstraktowanych. To jest tylko różnica dwóch kroków tak naprawdę. Ja mam encję inaczej robione niż tutaj, dokładniej moim zdaniem, bo to są zrobione po prostu przez model językowy, a tam, gdzie robiliśmy nery prawdziwe, są robione przez biblioteki Pythona, gdzie mają modele swoje też wytrenowane do znajdowania tych encji. I na tym zakończę tą część i za chwilę przejdziemy już do części tej zaawansowanej, gdzie mówimy sobie skrypt Pythona. I teraz przechodzimy już bezpośrednio naszego skrytu Pythona. Jeszcze raz, żebyśmy wszystko dobrze zrozumieli i żebyśmy to wszystko dobrze powiązali. Tutaj macie input, ale też ten input, to są dwa pliki, macie opisane w pliku tekstowym wprowadzającym do lekcji, czyli pewnie u was na platformie SNS-AI w opisie lekcji. I to są te dwa pliki, czyli entities, JSON, czyli ENCIE i Extracted Data, to macie tą strukturę. Gdybyście chcieli sami produkować te pliki, to tutaj macie strukturę. Możecie sobie podpiąć i wykorzystać pozaśrednio ten skrypt Pythona, o którym ja mówiłem i który teraz będziemy uruchamiać. Outputem jest kga output, czyli znowu nasz JSON w tej strukturze, którą wam pokazywałem na początku. Tą strukturę mamy gdzieś tutaj, już wam pokazuję. To jest to. I ten JSON będziemy później wykorzystywać w następnych etapach. albo tekstowy, graf wiedzy. To wszystko zależy od tego, jakie będziecie mieli podejście. Przewracamy do naszego skryptu. Szybko go omówię. On wczytuje endcję, tak jak mówiłem, relacje z entities, JSON, fakty i dane, wszystkie z extractu data, txt. Później parsuje. To jest bardzo szybki skrypt. On tak naprawdę zna już strukturę tych plików, obu. Więc to będzie trwało prawdopodobnie sekundę. Nawet niecałą. Więc jak sobie przeskoczymy do odkłudu, tutaj będziecie mieli wszystko już podsumowane. Dokładnie ile jest sensi, relacji, ile jest faktów, ile jest topików. Czyli dobrze nam to przetworzył. I teraz, jako część lekcji, ale nieprzydatna tak naprawdę w generowaniu, może trochę przydatna, pokażę Wam jeszcze skrypt i załączyłem Wam skrypt do wizualizacji grafów wiedzy w dwóch częściach. Jedna to jest 2D, druga to jest 3D. Jak widzicie też skrypt uruchamia się w moment. Specjalne biblioteki są do tego użyte. Macie ich opiś tam pewnie na samym początku. I mamy parę plików, trzy tak naprawdę wizualizacja samej hęcii, samego całej naszego grafu wiedzy i całego grafu wiedzy w 3D. Te pliki się pojawiają tutaj. Jeden, drugi, trzeci. Trzeba by było je zapisać na dysku i je tworzyć. Nie martwcie się, ja to zrobiłem dla was. Czemu ja to podglądam i czemu też zachęcam was do tego, żebyście to podglądali? Dlatego, że tutaj będzie widać dokładnie jak wygląda nasz to jest graficzna reprezentacja naszego grafu wiedzy i tutaj wszystko widać dokładnie, ale zacznijmy od naszego tematu, jakby zobaczcie, jak on tu jest skonstruowany, możecie to przybliżać, oddalać. Czyli mamy nasz temat główny, main keyword, jak obniżyć kortyzol po 40. Tu są prawdopodobnie fakty, jeżeli sobie na to najedziemy, to się nam pokazuje. Fakt pierwszy, dobre relacje i hobby stanowią naturalny regulator. Czemu ja nie pokazuję faktów na samym grafie, tylko ich ID, bo to jest ID, to są długie. Tak samo, jeżeli chodzi o to, to są M measurable, czyli dane mierzalne. I jak widzicie, i kwadraciki, to i DA, i relation, czy nasze pomysły. I dalej, kortyzol, nasz temat, jak obniżycz kortyzopo 20, jego główną encyą, bo to już przechodzimy do encyi. Zobaczcie, jak pięknie encyi są zrobione. Kortyzol jest nasz główną encyą. I tu już macie powiązania encyi ze sobą, czyli widzicie dokładnie, jak jest to od siebie oddalone i jakie są relacje. Tak naprawdę te oddalenia nie są tutaj jeszcze istotne. Bardzo są istotne te relacje. A te oddalenia można jeszcze zrobić za pomocą embeddingów, czyli zobaczyć, czy któryś z tych, na przykład to męska klinika u pacjenta, to są encie, które są prawdopodobnie nam niepotrzebne. Więc można by było to zawęzić i zresztą będziemy to robić. Więc teraz, jeżeli to jeszcze raz oddalę i przejdziecie sobie się tutaj wszystkiemu, chyba do poprawnej poszczyzny nie używam, ale dobra, nie przyjmujemy się te. Wiadomo, że będą jakieś ency, które są być może niepasujące. Ok, północy. I pora i doby istotna w kontekście rytmu kortyzolu i jego nocnego obniżania. Słuchajcie, musicie sobie to przejrzeć i zobaczyć, czy coś wam nie pasuje i ewentualnie zmodyfikować albo prompty, albo sam plik wynikowy, żebyście mieli tak naprawdę jak najlepiej to zrobione, jak najdokładniej. I zobaczcie, to jest tak naprawdę, na tym będziemy kończyć zaraz naszą lekcję, żebyście widzieli od tego, czego wyszliśmy, tak naprawdę od samego słowa kluczowego, dotarliśmy do graficznej reprezentacji danego tematu, gdzie mamy po pierwsze wszystkie tematy, pomysły, fakty wokół naszego słowa kluczowego i mamy sporyncji. Pięknie to wygląda, ale to jeszcze nie koniec. Drugi plik, który się wygenerował, to jest plik 3D. To już jest zabawa, ale takie rzeczy zawsze robią wrażenie według mnie. Też tak jak tu widzicie, jest nasz kortyzol. Czekajcie, bo tego się nie da przesuwać. Tu gdzieś nawigacja jest, chyba tak. Nasz kortyzol. I możecie to sobie przesuwać. Obracać pewnie. Plus, minus. To jest biblioteka. Ja też, jak widać, muszę się jeszcze jej nauczyć. W każdym razie. Robi wrażenie. powodzenia w generowaniu graf o wiedzy myślę, że zdopingowałem was do tego bo już jeżeli jesteście w stanie sobie wyobrazić jak taki graf o wiedzy wygląda i jak się go generuje, że to wcale nie jest takie trudne, a na koniec jeszcze sobie przejrzeć daną tematykę mi się lepiej dużo patrzy, ale chyba na 2D wizualnie to wiecie, czy dane zagospodarowanie tematu jest dobrze zrobione, czy nie, czy czegoś brakuje, czy coś trzeba wyciąć. Dzięki. 

</details>

---

<div class="lesson-completion-bottom" data-lesson-id="ai-content-expert/blok-2/lekcja-9"></div>

<div id="sensai-comments"></div>


---

# 2.10 Sterowanie długością i szczegółowością

<div class="lesson-meta">
  <div class="lesson-mentor">
    <img class="lesson-mentor__avatar" src="https://framerusercontent.com/images/t2GGO1yled5Z8wSFTTJMQHHzd4.png?scale-down-to=512&width=2976&height=2949" alt="Maciej Chmurkowski" />
    <span class="lesson-mentor__info">
      <span class="lesson-mentor__label">Mentor</span>
      <span class="lesson-mentor__name-text">Maciej Chmurkowski</span>
    </span>
  </div>
  <div class="lesson-rating" data-lesson-id="ai-content-expert/blok-2/lekcja-10"></div>
  <div class="lesson-completion" data-lesson-id="ai-content-expert/blok-2/lekcja-10"></div>
</div>

<div style="position:relative;padding-top:56.25%;"><iframe src="https://player.mediadelivery.net/embed/565073/9c5a4d37-8a6f-450b-8d4f-41069ec70a33?autoplay=false&loop=false&muted=false&preload=true&responsive=true" loading="lazy" style="border:0;position:absolute;top:0;height:100%;width:100%;" allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;" allowfullscreen="true"></iframe></div>

<br />

## 🎯 Cel lekcji

Opanowanie technik sterowania długością i szczegółowością generowanej treści.

---

## 📒 Notatka z lekcji

Model językowy działa deterministycznie na poziomie sensu i zakresu odpowiedzi w odniesieniu do otrzymanego kontekstu. Oznacza to, że dla tych samych danych wejściowych i podobnych parametrów model porusza się wokół tego samego tematu i podobnego zakresu informacji.

Nie gwarantuje jednak identycznej formy wypowiedzi ani stałej długości tekstu. Odpowiedzi mogą różnić się sformułowaniami, kolejnością treści, a także **objętością**.
Dlatego polecenia typu „**napisz wyczerpujący artykuł**” są dla modelu niejednoznaczne i nie zapewniają kontroli nad długością.
Aby uzyskać przewidywalną objętość treści, długość artykułu musi wynikać z jasno określonego kontekstu i potrzeb użytkownika.

## Dlaczego długość artykułu ma znaczenie

Modele językowe nie wiedzą, jaka długość treści jest „wystarczająca”.
Jeśli nie zostanie to jasno określone, model:

- napisze tekst zbyt krótki i niekompletny
- albo zbyt długi, rozwlekły i pełen powtórzeń

Dlatego długość artykułu **nie powinna być stała**, lecz **dopasowana do zapytania użytkownika**.

---

## Podstawowa zasada

**Długość artykułu powinna wynikać z ilości kontekstu potrzebnego do podjęcia decyzji.**

Nie każde słowo kluczowe wymaga:

- edukacji,
- wyjaśniania podstaw,
- rozbudowanych porównań.

Czasem użytkownik dokładnie wie, czego szuka i oczekuje krótkiej, konkretnej odpowiedzi.

---

## 1. Abstrakcja: Klasyfikacja zapytań według potrzeb użytkownika

Skutecznym sposobem sterowania długością treści jest klasyfikacja zapytania według poziomu potrzeb decyzyjnych użytkownika (abstrakcyjne pojęcie w prompcie).

### Poziomy zapytań

| Poziom | Charakter zapytania |
|---|---|
| **A** | Użytkownik wie, czego chce |
| **B** | Użytkownik potrzebuje porównania lub wskazówek |
| **C** | Użytkownik potrzebuje edukacji i szerokiego kontekstu |

### Interpretacja

- **Poziom A**
    Zapytania bardzo precyzyjne. Wystarczy krótki, konkretny tekst.
- **Poziom B**
    Zapytania ogólne, ale z jasno zarysowanym celem. Potrzebne są wyjaśnienia i porównania.
- **Poziom C**
    Zapytania szerokie, niejednoznaczne. Wymagają edukacji, omówienia wielu czynników i wsparcia decyzyjnego.

---

## Powiązanie poziomu zapytania z długością artykułu

Każdemu poziomowi zapytania można przypisać orientacyjną długość treści:

| Poziom | Charakter treści |
|---|---|
| **A** | Krótki artykuł |
| **B** | Średniej długości artykuł |
| **C** | Długi, wyczerpujący artykuł |

Dzięki temu długość tekstu **wynika z potrzeb użytkownika**, a nie z arbitralnie ustalonej liczby znaków.

---

## 2. Kontrola długości poprzez strukturę artykułu

Długość treści można regulować również przez **strukturę artykułu**.

- większa liczba sekcji i nagłówków → dłuższy tekst
- łączenie tematów w jedną sekcję → krótszy tekst

Panowanie nad strukturą pozwala świadomie zwiększać lub ograniczać objętość treści bez obniżania jej jakości.

---

## 3. Wpływ podziału tematu na długość artykułu (Query Fan-Out Micro/Macro)

Rozbijanie tematu na mniejsze obszary (mikrotematy) naturalnie prowadzi do wydłużenia artykułu.
Każdy dodatkowy obszar tematyczny to:

- kolejny fragment treści,
- dodatkowy kontekst dla użytkownika.

Im więcej istotnych mikrotematów, tym większa głębia i długość artykułu.

---

## Najważniejsze wnioski

- Długość artykułu powinna być **konsekwencją potrzeb użytkownika**
- Najpierw określamy **poziom zapytania**, dopiero potem generujemy treść
- Struktura i podział tematu są naturalnymi regulatorami objętości
- Jedna długość artykułu nie pasuje do wszystkich słów kluczowych

---

## 📂 Powiązane pliki

<details>
<summary>📄 Prompt: Artykuł SEO zależny od złożoności</summary>

```markdown
# ZADANIE
Napisz artykuł SEO na podany temat. Długość artykułu zależy od złożoności tematu.

# KLASYFIKACJA TEMATU
Najpierw sklasyfikuj temat według potrzeb kupującego:

## LEVELS
| Level | Potrzeby kupującego | Min. znaków |
|-------|---------------------|-------------|
| A | Wie czego chce, szuka produktu | 500 |
| B | Potrzebuje porównania, wybiera między opcjami | 1000 |
| C | Potrzebuje edukacji, wiele czynników do rozważenia | 2000 |

## DECISION RULES
Zastosuj po kolei:

1. CENA I RYZYKO
   - Niska cena (<50 PLN), brak ryzyka → A
   - Średnia cena (50-500 PLN), pewne ryzyko → B
   - Wysoka cena (>500 PLN), długoterminowe zobowiązanie, ryzyko zdrowotne/finansowe → C

2. SPECYFICZNOŚĆ
   - Konkretny produkt (model, rozmiar, wariant) → A
   - Kategoria produktów (wymaga porównania) → B
   - Abstrakcyjny temat, edukacyjny, lifestyle → C

3. LICZBA CZYNNIKÓW DECYZYJNYCH
   - 1-2 czynniki (rozmiar, ilość) → A
   - 3-5 czynników (funkcje, marka, przedział cenowy) → B
   - 5+ czynników (ROI, kompatybilność, długoterminowe efekty) → C

## PRZYKŁADY
- "nakrętka M8" → A (konkretny produkt, tani, 1 czynnik)
- "taśma klejąca" → A (commodity, tani, brak porównania)
- "cukier" → A (commodity, tani, każdy zna)
- "baterie AA" → A (standardowy produkt, niska cena)
- "wiertarka" → B (kategoria, porównanie marek/mocy)
- "ekspres do kawy" → B (porównanie typów, funkcji, marek)
- "robot sprzątający" → B (porównanie modeli, 3-5 czynników)
- "laptop" → C (wysoka cena, wiele specyfikacji, długoterminowy)
- "pompy ciepła" → C (wysoka cena, instalacja, ROI)
- "dieta przy insulinooporności" → C (zdrowie, edukacja, wiele czynników)

# TEMAT
[[keyword]]

# INSTRUKCJE
1. Sklasyfikuj temat (A/B/C) stosując DECISION RULES po kolei
2. Napisz artykuł o MINIMALNEJ liczbie znaków odpowiadającej klasyfikacji
3. Artykuł w języku polskim
4. Naturalny styl, bez sztucznego wydłużania
5. Jeśli temat wymaga więcej treści niż minimum - pisz więcej

# FORMAT ODPOWIEDZI
Klasyfikacja: [A|B|C] ([500|1000|2000] znaków min.)

[Artykuł]
```
</details>

---

<details>
<summary>📝 Transkrypcja wideo</summary>

*(Transkrypcja zostanie uzupełniona)*

</details>

---

<div class="lesson-completion-bottom" data-lesson-id="ai-content-expert/blok-2/lekcja-10"></div>

<div id="sensai-comments"></div>


---


## 📅 Tydzień 3

# 3.1 Outline i dystrybucja grafu wiedzy

<div class="lesson-meta">
  <div class="lesson-mentor">
    <img class="lesson-mentor__avatar" src="https://framerusercontent.com/images/t2GGO1yled5Z8wSFTTJMQHHzd4.png?scale-down-to=512&width=2976&height=2949" alt="Maciej Chmurkowski" />
    <span class="lesson-mentor__info">
      <span class="lesson-mentor__label">Mentor</span>
      <span class="lesson-mentor__name-text">Maciej Chmurkowski</span>
    </span>
  </div>
  <div class="lesson-rating" data-lesson-id="ai-content-expert/blok-3/lekcja-1"></div>
  <div class="lesson-completion" data-lesson-id="ai-content-expert/blok-3/lekcja-1"></div>
</div>

<div style="position:relative;padding-top:56.25%;"><iframe src="https://player.mediadelivery.net/embed/565073/60202c07-84ce-4b10-935a-941ea00242ae?autoplay=false&loop=false&muted=false&preload=true&responsive=true" loading="lazy" style="border:0;position:absolute;top:0;height:100%;width:100%;" allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;" allowfullscreen="true"></iframe></div>

<br />

## 🎯 Cel lekcji

Nauczenie się tworzenia outline'u treści na podstawie danych z Query Fan-Out oraz dystrybucji elementów grafu wiedzy do poszczególnych sekcji artykułu. Zrozumienie zasady BLUF (Bottom Line Up Front) i jej wpływu na architekturę treści.

---

## 📒 Notatka z lekcji

### Miejsce outline'u w pipeline generowania treści

Outline to jeden z kluczowych etapów w procesie automatycznego generowania artykułów. Na tym etapie łączysz dwa elementy stworzone w poprzednich lekcjach:

- **Query Fan-Out** -- zawiera mikro-obszary, intencje i pytania People Also Ask (PAA)
- **Graf wiedzy** -- zawiera encje, fakty, relacje, ideacje i dane mierzalne

Z tych dwóch plików wejściowych (JSON) powstają dwa pliki wyjściowe:

1. **`output_outline.json`** -- sam spis treści (outline)
2. **`output_distribution.json`** -- sekcje z przypisanymi danymi z grafu wiedzy

:::tip[Dwa sposoby pracy]
Lekcja oferuje dwa narzędzia: **prompt do ChatGPT** (generuje sam outline bez dystrybucji) oraz **skrypt Python** (generuje outline + dystrybucję danych z grafu wiedzy). Wybierz metodę odpowiednią do swoich potrzeb.
:::

---

### Krok 1: Zrozumienie zasad budowy outline'u

Outline to automatycznie wygenerowany spis treści artykułu, oparty na twardych danych z Query Fan-Out. Nie wymyślasz nagłówków -- one wynikają z danych.

**Reguły mapowania:**

| Element z Query Fan-Out | Element w outline |
|---|---|
| Mikro-obszar (temat) | Nagłówek **H2** |
| Pytanie People Also Ask | Nagłówek **H3** pod odpowiednim H2 |
| H1 | Już istnieje -- to tytuł artykułu |

**Reguły formatowania H3:**

Nie każde pytanie PAA musi pozostać w formie pytania. Model decyduje dla każdego H3:

- **Zostaw jako pytanie** -- gdy jest jasne, konkretne i dobrze brzmi jako nagłówek
- **Zamień na kontekst** -- gdy pytanie jest niezgrabne gramatycznie, za długie lub lepiej brzmi jako stwierdzenie

:::caution[Unikaj Title Case w polskim contencie]
Modele językowe mają tendencję do stosowania wielkich liter w nagłówkach (styl angielski). W polskich artykułach upewnij się, że w prompcie wyraźnie zaznaczasz formatowanie nagłówków bez wielkich liter na każdym wyrazie.
:::

---

### Krok 2: Sortowanie sekcji według intencji (BLUF)

Kolejność sekcji w outline to najważniejsza decyzja architektoniczna. Opiera się na zasadzie **BLUF -- Bottom Line Up Front**.

**Czym jest BLUF?**

Termin pochodzi z komunikacji wojskowej US Marines. Zasada mówi: najważniejszą informację podaj jako pierwszą, szczegóły rozwiń później. W kontekście artykułów internetowych oznacza to:

- **Odpowiedź na pytanie użytkownika pojawia się na samym początku** artykułu, nie po trzech akapitach wstępu

**Jak sortować sekcje:**

1. Zidentyfikuj **intencję główną** z Query Fan-Out (np. instrukcyjna, definicyjna, problemowa)
2. Sekcje pasujące do intencji głównej umieść **na początku** artykułu
3. Pozostałe intencje (np. definicyjne, kontekstowe) umieść **na końcu** jako sekcje kontekstowe

**Przykład -- zapytanie "jak obniżyć kortyzol po 40":**

- Intencja główna: **instrukcyjna** (użytkownik chce wiedzieć JAK)
- Na początku: sekcje z konkretnymi sposobami obniżenia kortyzolu
- Na końcu: "Czym jest kortyzol?" -- krótka sekcja kontekstowa, nie otwierająca artykuł

:::tip[Sekcje kontekstowe jako strategia linkowania]
Sekcje kontekstowe (np. "Czym jest kortyzol?") na końcu artykułu służą dwóm celom: (1) wyczerpują temat bez lania wody na początku, (2) stanowią doskonałe miejsce na linkowanie wewnętrzne do osobnego, dedykowanego artykułu o tym zagadnieniu.
:::

---

### Krok 3: Przygotowanie danych wejściowych

Do wygenerowania outline'u potrzebujesz dwóch plików JSON:

**1. Query Fan-Out (`input_query_fan_out.json`)**
Zawiera mikro-obszary z intencjami i pytaniami PAA. Struktura została stworzona w lekcjach z Bloku 2.

**2. Graf wiedzy (`input_knowledge_graph.json`)**
Zawiera encje, fakty, relacje, ideacje i dane mierzalne. Również pochodzi z wcześniejszych lekcji.

:::note[Testowe pliki]
Jeżeli chcesz przetestować skrypt bez generowania własnych plików JSON, użyj przykładowych plików dołączonych do lekcji. Ich struktura jest zgodna z wymaganiami skryptu.
:::

---

### Krok 4: Generowanie outline'u promptem (metoda prosta)

Prompt do ChatGPT generuje sam outline bez dystrybucji danych z grafu wiedzy. To prostsza metoda, przydatna gdy nie potrzebujesz pełnego pipeline'u.

**Struktura promptu:**

1. **Rola** -- "Jesteś ekspertem w architekturze artykułów semantycznych"
2. **Metadane** -- słowo kluczowe (H1), język, intencja główna
3. **Dane wejściowe** -- cały Query Fan-Out (JSON lub tekst)
4. **Reguły** -- intencja główna na początku, sekcje kontekstowe na końcu, format nagłówków
5. **Przykład output** -- wzorcowy outline dla referencji modelu
6. **Format output** -- struktura JSON z type, order, header, h3s

:::tip[Elastyczność formatu]
Format output w prompcie możesz dowolnie modyfikować -- zamiast JSON możesz wygenerować CSV, tekst czy dowolną inną strukturę. Pamiętaj jednak, że ten output będzie używany w kolejnych krokach pipeline'u, więc zachowaj spójny format.
:::

---

### Krok 5: Generowanie outline'u ze skryptem Python (metoda pełna)

Skrypt Python (`outline_distribution_final.py`) wykonuje dwa kroki w jednym przebiegu:

1. **Generuje outline** -- na podstawie Query Fan-Out, z sortowaniem wg intencji
2. **Dystrybuuje dane z grafu wiedzy** -- przypisuje encje, fakty, relacje, ideacje i dane mierzalne do poszczególnych sekcji

**Konfiguracja skryptu:**

Przed uruchomieniem ustaw zmienne w sekcji `KONFIGURACJA`:
- Słowo kluczowe i tytuł H1
- Język artykułu
- Intencja główna (z Query Fan-Out)
- Ścieżki do plików wejściowych

:::caution[Kontekst modelu]
Skrypt używa modelu o ograniczonym oknie kontekstowym. Przy bardzo dużych grafach wiedzy może to być za mało. Monitoruj rozmiar danych wejściowych i w razie potrzeby skróć graf wiedzy.
:::

---

### Krok 6: Zrozumienie dystrybucji grafu wiedzy

Dystrybucja to proces przypisywania elementów grafu wiedzy do konkretnych sekcji outline'u.

**Reguły dystrybucji:**

| Reguła | Opis |
|---|---|
| **Pokrycie 60-80%** | Nie wszystkie elementy grafu muszą trafić do artykułu. Docelowe pokrycie to 60-80% danych |
| **Jeden element = jedna sekcja** | Encja lub fakt przypisany do jednej sekcji nie pojawia się w innej. Eliminuje duplikację treści |
| **Dopasowanie semantyczne** | Encja musi trafić do sekcji, w której jest tematycznie istotna |
| **Intro = minimum** | Sekcja intro dostaje tylko 2-3 encje i 1-2 fakty -- jako mini-streszczenie artykułu |

:::note[Dlaczego nie 100% pokrycia?]
Query Fan-Out i graf wiedzy to dwa niezależne elementy -- nie "wiedzą o sobie nawzajem". Wielkość grafu wiedzy nie zawsze jest dopasowana do liczby sekcji w outline. Lepiej mieć duży graf wiedzy i wykorzystać z niego 60-80%, niż na siłę wciskać wszystkie elementy.
:::

**Po co dystrybucja?**

- **Unikanie halucynacji** -- model generujący treść dostaje konkretne fakty i encje, nie musi ich wymyślać
- **Świeże dane** -- fakty z grafu wiedzy pochodzą z aktualnych źródeł (Top 10 SERP)
- **Brak duplikacji** -- każdy element jest użyty dokładnie raz
- **Generowanie sekcja po sekcji** -- przy długich artykułach jakość drastycznie spada, gdy generujesz wszystko naraz

---

### Format wyjściowy

Każda sekcja w pliku `output_distribution.json` zawiera kompletny "pakiet danych" potrzebny do wygenerowania treści:

```
Sekcja (H2)
├── header (nagłówek)
├── type (h2 / intro)
├── order (kolejność)
├── source_area (z którego mikro-obszaru)
├── source_intent (intencja)
├── h3s[] (nagłówki H3 z PAA)
├── entities[] (encje)
├── facts[] (fakty)
├── relationships[] (relacje)
├── ideations[] (pomysły na content)
└── data_markers[] (dane mierzalne)
```

Ten pakiet w następnym kroku pipeline'u trafi do promptu generującego treść danej sekcji.

---

### Podsumowanie

W tej lekcji poznaliśmy dwa powiązane procesy:

1. **Outline** -- automatyczne tworzenie spisu treści artykułu na podstawie Query Fan-Out, z sortowaniem sekcji według zasady BLUF (intencja główna na początku)
2. **Dystrybucja grafu wiedzy** -- przypisywanie encji, faktów, relacji i innych danych do poszczególnych sekcji

**Kluczowe zasady:**

- Mikro-obszar = H2, pytanie PAA = H3
- Intencja główna determinuje kolejność sekcji (BLUF)
- Pokrycie danych z grafu: 60-80%, nie 100%
- Jeden element grafu = jedna sekcja (zero duplikacji)
- Sekcja intro: 2-3 encje + 1-2 fakty (mini-streszczenie)
- Długie artykuły generuj sekcja po sekcji, nie wszystko naraz

:::tip[Następny krok w pipeline]
Mając gotowy outline z dystrybucją, w kolejnej lekcji przejdziesz do generowania draftu -- model będzie otrzymywał sekcję po sekcji wraz z przypisanymi danymi z grafu wiedzy.
:::

---

## 📦 Materiały do pobrania

### Prompt (do użycia w ChatGPT / Gemini)



<details>
<summary>👀 Podgląd promptu</summary>

```markdown
# Role
Jesteś ekspertem zajmującym się architekturą semantyczną artykułów.

# KLUCZOWA ZASADA: INTENCJA GŁÓWNA vs KONTEKST

Artykuł ma **odpowiadać na główną intencję użytkownika**. Pozostałe intencje to tylko kontekst wspierający.

## Obszary z INTENCJI GŁÓWNEJ → pełne sekcje
- Każdy obszar = osobny H2
- Każde PAA = osobny H3
- Pełne rozwinięcie tematu

## Obszary z POZOSTAŁYCH INTENCJI → sekcje kontekstowe
- Zgrupuj wszystkie obszary z danej intencji w **1 sekcję H2**
- Nagłówek H2 = podsumowujący dla całej grupy
- **Bez H3** — tylko wspomnij kluczowe punkty w treści sekcji
- Cel: dać kontekst, nie wyczerpywać tematu

# RULES

## Rule 1: Obszary z intencji głównej = pełne H2
## Rule 2: Obszary z pozostałych intencji = sekcje kontekstowe
## Rule 3: H3 Format Decision (tylko dla intencji głównej)
## Rule 4: SENTENCE CASE for all headers
## Rule 5: Intro = krótkie wprowadzenie do tematu głównego
## Rule 6: Kolejność sekcji (Intro → Główna → Kontekstowe)

# INPUT
- Main keyword: "[WPISZ KEYWORD]"
- H1 title: "[WPISZ TYTUŁ H1]"
- Language: [Polish/English/German]
- Primary search intent: [Definicyjna/Problemowa/Instrukcyjna/...]

## Query Fan-Out
[tu query fan-out w postaci json lub tekstowej]
```

</details>

### Skrypt Python (outline + dystrybucja)



### Przykładowe dane wejściowe






---

<details>
<summary>📝 Transkrypcja wideo</summary>

W tej lekcji będziemy generować outline. I na początek, jak zawsze, trochę ogłoszeń informacyjnych, związanych z samą konstrukcją lekcji. W powiązanych plikach znajdziecie dwa pliki. Pierwszy to jest prompt, który możecie użyć w czacie GPT czy w innych modelach. To prosty prompt, który wam będzie generował outline z tego query fanout, który robiliśmy w poprzednich lekcjach. Nie ma znaczenia czy to JSON czy zwykły tekst. Drugi skrypt jest ważny dla nas w naszym pipeline. To jest skrypt Python, który nie tylko robi outline według metody BLUF, ale również dystrybuuje wszystko co mamy pomiędzy sekcje tego outline'u.

Okay, przejdźmy do outline i dystrybucji grafu wiedzy. Co robimy na tym etapie? Będziemy generować outline, ale najważniejsze co robimy to dystrybucja naszych danych. Jak to wygląda w praktyce? Mamy query fanout. Pamiętacie, były tam mikro-obszary i intencje. To było w jednej z naszych lekcji. Mamy również graf wiedzy. I ten query fanout to będzie główne dane, które wykorzystamy do stworzenia outliner. A graf wiedzy, z niego pobierzemy sobie wszystkie, tak naprawdę już w strukturze rzeczy, które tam mamy. Fakty, encje, relacje, ideacje i zrobimy dystrybucję. Czyli będziemy robić to wszystko w dwóch krokach.

Jak to będzie po kolei wyglądało? Wgrywamy query fanout i graf wiedzy. Macie pliki JSON przygotowane przeze mnie oczywiście do kortyzola w katalogu inne. Więc jeżeli chcecie potestować sam script bez generowania zgodnego ze strukturą JSON-a, bo to niestety musi się zgadzać, użyjcie tych moich plików inputowych. Natomiast też możecie na podstawie tego stworzyć swoje pliki bądź wrócić do poprzednich kroków i nadać odpowiednią strukturę. Każdy LM oczywiście Wam w tym pomoże. Później zaczyna się sortowanie, generujemy outline i przechodzimy oczywiście już do dystrybucji. I na koniec dostajemy dwa pliki. Jeden plik to będzie sam outline. Gdyby chciał gdzieś to wykorzystać, zapisać do bazy danych np. jakiejś. Ja zapisuję osobno outline i osobno też z dystrybucją.

A czym jest outline? Outline to tak naprawdę nasz spis treści, ale jeżeli mamy ten query fanout i mamy go dobrze zrobionego, to on zawiera nie tylko listę tematów, z których można utworzyć nagłówki, tylko również posiada, jest wzbogacony o nazwy tych obszarów i jest wzbogacony również o pytania people also ask. Są tam również intencje. Te intencje wykorzystujemy w naszym skrypcie, głównie w prompcie. Robię to w taki sposób. Każdy mikro-obszar, czyli nasz temat, pamiętacie, z query fanout, były intencje. To oznacza 1 H2. H1 już mamy, bo to tytuł. I w query fanout również przypisane mamy pytania people ask do tego mikro obszaru. Uznajemy zasadę, że to jest 1 H3.

Kolejność sekcji i to jest naprawdę najważniejsza rzecz. Pamiętacie, mówiłem o tym, że trzeba jak najszybciej dać odpowiedź w tej chwili, że to co najważniejsze musi być na początku. Więc kolejność sekcji wygląda tak, że najpierw intencja główna. To jest najważniejsze, bo jeżeli mamy pytanie dotyczące obniżenia kortyzolu po 40, to nie możemy pisać od początku czym jest kortyzol. Czyli nasz outline tak naprawdę będzie wynikać z danych jakie posiadamy. I całkowity outline z dystrybucją będzie wynikał z dwóch plików wsadowych.

Czym jest dystrybucja? Pamiętacie, tak jak powiedziałem na wstępie, mamy encje, mamy fakty, relacje, ideations i dane mierzalne. Dokładnie wszystkie te grupy danych. Więc tak naprawdę podczas dystrybucji następuje przypisanie każdego, tak naprawdę jeszcze nie każdego, ale nie w 100%, ale dojdziemy do tego, encji i faktów do danej sekcji. Po co to się robi? Unikamy halucynacji, dostarczamy świeże dane no i mamy naprawdę jakościowy artykuł.

Tak naprawdę bardzo ciężko jest pokryć 100% danych, czyli w tej dystrybucji ciężko wszystkie encje, które mamy, a widzieliście ich może być naprawdę dużo, nawet i 100, ciężko je rozdać do odpowiednich sekcji. Więc ja zakładam, że pomiędzy 60 a 80% danych z dystrybucji to jest docelowe nasze pokrycie. I jeżeli jeden element już był użyty gdzieś, bo to jest bardzo ważne również, to nie używamy go już w kolejnym. I to nam porządkuje i tak naprawdę rozwiązuje problem duplikacji treści.

Jeszcze chwilę musimy omówić samą intencję i BLUF, bo ja uważam cały czas, że to jest najważniejsze, czyli przypisywanie do intencji. Wiecie co to jest BLUF? BLUF to ostatnio popularna definicja. Bottom Line Up Front. To się wzięło z marines ze Stanów Zjednoczonych. Chodziło o to, że jeżeli ktoś przynosi meldunek, to musi w paru zdaniach jak najszybciej odpowiedzieć najważniejsze informacje, przekazać, a później dopiero je rozwinąć. To skraca komunikację, przyspiesza komunikację.

Pomyślmy sobie jak to wygląda w przypadku naszego zapytania, jak obniżyć kortyzol po 40. Jest to intencja instrukcyjna. Więc od tej intencji powinniśmy zacząć. A cała reguła? Odpowiedź na początku, nie po trzech akapitach wstępu.

Jeżeli artykuł ma być długi, to na podstawie moich już naprawdę testów, tysięcy tak naprawdę wygenerowanych treści, ja widzę jak bardzo mocno spada jakość treści, jeżeli one są długie i generowane za jednym razem. Więc my będziemy później przesyłać do modelu językowego sekcję po sekcji. Sekcja to ma H2 i może zabierać też H3. I wykorzystuję też nasze People Also Ask, czyli te pytania, które mamy przypisane, jako H3.

Docelowe pokrycie danych z dystrybucji to 60-80%. Nie wszystko musi być użyte. Modele są na tyle dobre, że nie używają elementów i nie robią tego samego, jeżeli im powiemy. Query Fan-Out i graf wiedzy to dwa niezależne elementy, one nie wiedzą o sobie nawzajem, więc niekoniecznie wielkość naszego grafu wiedzy jest dopasowana do query fanout. Ale lepiej zawsze mieć bardzo duży graf wiedzy, bardzo dużo elementów, a w dystrybucji zajdą tylko te, które są nam potrzebne.

Ja jeszcze daję intro, czyli jest pewien fragment tekstu, sekcja tak naprawdę, przed pierwszą H2. I tam też daję 2-3 encje i 1-2 fakty. To jest takie wprowadzenie i też się staram żeby to było takie mini streszczenie wszystkiego o czym będziemy tutaj pisać w tym artykule. No i oczywiście dopasowanie semantyczne. Encja musi trafić do pasującej dla niej sekcji. To najważniejsze.

Wracając do naszej głównej architektury promptu. Intencja główna już była. Grupuję pozostałe intencje w sekcje kontekstowe. Krótkie, bez H3. Na końcu artykułu. Po co nam to jest potrzebne? Jeżeli mamy intencję instrukcyjną, to nie będziemy jej zaczynać od definicyjnej, czyli np. co to jest kortyzol. To znowu wprowadza niepotrzebne lanie wody i nie odpowiada na główne zapytanie. Ale żeby utrzymać kontekst i żeby wyczerpać trochę ten temat, to możecie na końcu po prostu przypomnieć, co to jest kortyzol, czy inne ważne rzeczy z pozostałych intencji.

Do czego to się jeszcze przydaje? Również do tego, żeby w przyszłości linkować wewnętrznie z artykułu. W tym artykule będziecie mieli tylko krótką sekcję kontekstową. Jednak jeżeli stworzycie osobny dokument dla tych innych intencji, z query fanoutu, który robiliśmy dla mikro i makro semantyki, to bardzo ładnie to działa. Z tej sekcji linkujecie do głównego artykułu i powiązujecie semantycznie.

No i na koniec już ten skrypt nasz Pythona, który jest już bardziej skomplikowany, bo robi dwie rzeczy, nie tylko outline, ale po zrobieniu outline'a jeszcze później następuje w kolejnym kroku dystrybucja tych danych z knowledge graphu, czyli z naszego grafu wiedzy. Nasz model użył 96% danych, które są w grafie wiedzy. Mamy intro, trzy encje, dwa fakty, jedna relacja. Kortyzol, nadnercza, oś HPA. I dalej, też mamy przypisane encje i fakty do kolejnych sekcji.

</details>

---

<div class="lesson-completion-bottom" data-lesson-id="ai-content-expert/blok-3/lekcja-1"></div>

<div id="sensai-comments"></div>


---

# 3.2 Generowanie draftu treści

<div class="lesson-meta">
  <div class="lesson-mentor">
    <img class="lesson-mentor__avatar" src="https://framerusercontent.com/images/t2GGO1yled5Z8wSFTTJMQHHzd4.png?scale-down-to=512&width=2976&height=2949" alt="Maciej Chmurkowski" />
    <span class="lesson-mentor__info">
      <span class="lesson-mentor__label">Mentor</span>
      <span class="lesson-mentor__name-text">Maciej Chmurkowski</span>
    </span>
  </div>
  <div class="lesson-rating" data-lesson-id="ai-content-expert/blok-3/lekcja-2"></div>
  <div class="lesson-completion" data-lesson-id="ai-content-expert/blok-3/lekcja-2"></div>
</div>

<div style="position:relative;padding-top:56.25%;"><iframe src="https://player.mediadelivery.net/embed/565073/1062c5a0-deb1-46d7-9302-9adc2fbd4c0e?autoplay=false&loop=false&muted=false&preload=true&responsive=true" loading="lazy" style="border:0;position:absolute;top:0;height:100%;width:100%;" allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;" allowfullscreen="true"></iframe></div>

<br />

## 🎯 Cel lekcji

Nauczenie się generowania pierwszej wersji (draftu) treści na podstawie przygotowanego outline'u i grafu wiedzy. Zrozumienie generowania blok po bloku z chainingiem, analizy nagłówków, zasad użycia encji i reguł jakościowych (BLUF, NO FILLER, NO DUPLICATE).

---

## 📒 Notatka z lekcji

### Czym jest generowanie draftu?

Generowanie draftu to zamiana danych przypisanych do sekcji (output z dystrybucji) na tekst artykułu w HTML. Model LLM otrzymuje dla każdej sekcji "pakiet danych" — encje, fakty, relacje, ideacje, pytania — i na ich podstawie pisze treść. Artykuł powstaje blok po bloku, z kontrolą jakości opartą na regułach BLUF, NO FILLER i NO DUPLICATE oraz na analizie nagłówków, która determinuje strukturę każdej sekcji.

**Powiązane pliki:**

- **Wejście:** `output_distribution.json` (output z etapu dystrybucji — sekcje z danymi z grafu wiedzy)
- **Wyjście:** `output_draft.html` (wygenerowany draft artykułu w HTML)
- **Wyjście (opcjonalne):** `output_image_prompts.json` (prompty do generowania infografik)

Skrypt realizuje 6 etapów: wczytanie danych → deduplikacja faktów → analiza nagłówków → podział na bloki → generowanie LLM → składanie HTML.

:::caution[Draft to nie finalna wersja]
Nie da się wygenerować w jednym wywołaniu LLM dobrej jakości treści. Draft to dopiero początek — w kolejnych lekcjach artykuł przejdzie jeszcze przez rewrite, optymalizację i humanizację.
:::

---

### Krok 1: Dlaczego generujemy sekcja po sekcji?

Generowanie całego artykułu naraz powoduje trzy problemy:

**Problem kontekstu:** Przy dużej ilości treści model traci sens i jakość tekstu spada, szczególnie w końcowych sekcjach. Nie masz kontroli nad długością poszczególnych sekcji.

**Problem duplikacji:** Model zapomina, co już napisał, i powtarza informacje. Generując blokami, do każdego wywołania dołączasz pełny outline z adnotacją, które dane należą do innych sekcji. Dodatkowo, wysyłasz `previous_response_id`, dzięki czemu model "pamięta" co już napisał.

**Problem kontroli jakości:** Blok po bloku pozwala monitorować długość każdego bloku osobno, przerwać generowanie gdy artykuł osiągnie docelową długość, a w razie błędu powtórzyć tylko jeden blok zamiast całego artykułu.

**Zasada:** Każda sekcja (od H2 do następnego H2) to kompletny, samodzielny pakiet — musi być zrozumiała bez czytania reszty artykułu. H3 wchodzą w skład bloku swojego H2.

---

### Krok 2: Response ID chaining (OpenAI)

Kluczowa zaleta OpenAI Responses API to parametr `previous_response_id`. Pozwala na łączenie wywołań w wątek, gdzie model "pamięta" wcześniejsze bloki bez wysyłania ich ponownie w prompcie.

**Jak to działa:**

```
Blok 1: wywołanie bez previous_response_id → response_id = "resp_abc123"
Blok 2: previous_response_id = "resp_abc123" → response_id = "resp_def456"
Blok 3: previous_response_id = "resp_def456" → response_id = "resp_ghi789"
```

**Efekt:** mniej duplikacji, spójny styl i ton, oszczędność tokenów.

| Podejście | Duplikacja | Koszt tokenów | Spójność |
|---|---|---|---|
| Cały artykuł naraz | Wysoka | Średni | Niska (model gubi kontekst) |
| Bloki BEZ chainingu | Bardzo wysoka | Niski | Brak |
| **Bloki Z chainingiem (nasze)** | **Niska** | **Niski** | **Wysoka** |
| Bloki + pełna historia w prompcie | Niska | Bardzo wysoki | Wysoka |

:::tip[Inne modele]
Chaining działa z modelami reasoning OpenAI (GPT-5, o-series). Przy Claude lub Gemini ustaw `USE_REASONING_PARAMS = False` w skrypcie — wtedy generowanie odbywa się bez chainingu, ale outline nadal zapewnia kontekst.
:::

---

### Krok 3: Antyduplikacja — trzy mechanizmy

Duplikacja to jeden z najgorszych problemów przy generowaniu treści. W skrypcie stosowane są trzy mechanizmy jednocześnie:

**1. Chaining (response ID):** Model pamięta kontekst poprzednich bloków, więc nie powtarza informacji.

**2. Outline jako kontekst:** Przy każdym bloku model dostaje cały outline z dystrybucją danych i informacją, która sekcja jest bieżąca. Widzi, które dane należą do innych sekcji.

**3. Programatyczna deduplikacja faktów (H3 vs H2):** Skrypt zbiera fakty użyte w H2 do zbioru `already_covered`. Fakty H3 obecne w tym zbiorze są usuwane przed wysłaniem do modelu — dzięki temu fakt pojawia się w artykule tylko raz. Encje nie są usuwane, ale oznaczane flagą `_covered_in_h2 = true`, więc model użyje nazwy encji, ale nie będzie jej ponownie definiować.

:::note[Duplikacja mimo wszystko]
Nawet z tymi trzema mechanizmami duplikacja nie zniknie w 100% na etapie draftu. W kolejnych etapach pipeline'u (rewrite, optymalizacja) jest osobny prompt, w którym eliminacja duplikacji to jedno z najważniejszych zadań.
:::

---

### Krok 4: Analiza nagłówka → format sekcji

To algorytm, który programatycznie analizuje nagłówek H2/H3 i przypisuje wymagany format sekcji ZANIM dane trafią do LLM. Model nie musi "zgadywać" jak napisać sekcję — dostaje konkretną instrukcję strukturalną.

**Dlaczego to ważne:** Bez analizy nagłówka sekcja "Jak zadbać o sen..." i "Kortyzol i jego rola..." wyglądałyby identycznie — kilka akapitów prozy. Z analizą — pierwsza dostaje format instrukcji, a druga format definicji.

| Wzorzec nagłówka | Typ | Wymagany format sekcji |
|---|---|---|
| "Co to jest..." / "Czym jest..." | Definicja | Zdanie definiujące → Rozwinięcie z atrybutami → Podsumowanie |
| "Jak..." / "W jaki sposób..." | Instrukcja | Kontekst + cel → Kroki/metody → Rezultat |
| "Dlaczego..." / "Przyczyny..." | Przyczyna | Twierdzenie → Wyjaśnienie przyczynowe → Dowód/statystyka → Wniosek |
| "X a Y" / "Co pomaga, co szkodzi" | Porównanie | Ramka porównania → Tabela różnic → Analiza → Werdykt |
| "Jak rozpoznać..." / "Objawy..." | Diagnostyka | Ogólna zasada → Warunki/objawy (lista) → Metody weryfikacji |
| "Najlepsze..." / "Rodzaje..." | Lista | Kontekst wyboru → Lista z encjami i atrybutami → Rekomendacja |
| Pytanie (kończy się na "?") | Bezpośrednia odpowiedź | Odpowiedź w 1. zdaniu → Rozwinięcie z kontekstem → Dodatkowy kąt |

W skrypcie analiza jest realizowana przez dopasowanie regex wzorców (dla wersji polskiej i angielskiej), a nie przez dodatkowe wywołanie LLM — żeby nie mnożyć zapytań i nie komplikować pipeline'u.

---

### Krok 5: Struktura sekcji — 5 elementów

Każda sekcja (H2 lub H3) powinna zawierać 5 elementów w tej kolejności:

**1. Zdanie otwierające (1-2 zdania):** Nazwij główną encję w pierwszym zdaniu. Ustal kontekst: kto/co/dla kogo/kiedy. To zdanie powinno działać jako samodzielna odpowiedź na pytanie z nagłówka (zasada BLUF).

**2. Treść merytoryczna (3-5 zdań):** Wyjaśnienie, kroki, analiza — główna zawartość sekcji. Krótkie zdania, aktywna strona, jasne przejścia. Jeden temat na akapit, zero dygresji.

**3. Dane wspierające (1 element):** Konkretna statystyka z liczbą, fakt z dostarczonych danych lub porównanie z nazwaną alternatywą. Na etapie draftu dane mogą być wymyślone — w kolejnej lekcji zbierzemy prawdziwe dane z internetu (Web Search API).

**4. Elementy wizualne (jeśli dostępne):** Tabele jako HTML `<table>`, checklisty jako HTML `<ul>`, infografiki → osobny prompt do narzędzia graficznego. To "ideacje" z grafu wiedzy — powodują, że artykuł jest czytelny i przyjazny dla LLM-ów.

**5. Podsumowanie (1 zdanie):** Kluczowa myśl prostym językiem. Tylko dla sekcji FULL (pomijaj w sekcjach CONTEXT).

---

### Krok 6: Zasady użycia encji — 5 typów kotwic

Same użycie encji z grafu wiedzy nie wystarczy. Encje muszą być "zakotwiczone" w tekście, żeby nie były tylko wstawioną wysepką.

**Zasady nazewnictwa:** Przy pierwszym użyciu encji w sekcji podaj: nazwa + czym jest + atrybut wyróżniający. Po pierwszej definicji: używaj tylko nazwy, nigdy nie definiuj ponownie. Nie zastępuj encji zaimkami w pierwszych 2 zdaniach sekcji.

| Typ kotwicy | Wzorzec | Przykład |
|---|---|---|
| Atrybutowa | Encja + cecha mierzalna | "Ashwagandha obniża kortyzol o 11-32%" |
| Porównawcza | Encja A vs Encja B | "W przeciwieństwie do HIIT, umiarkowany spacer..." |
| Sytuacyjna | Encja + grupa docelowa | "Osoby po 40. roku życia powinny..." |
| Czasowa | Encja + czas/okres | "Po 8 tygodniach suplementacji..." |
| Przyczynowa | Encja + przyczyna + skutek | "Przewlekły stres podnosi bazowy kortyzol o 50-80%" |

Minimum 2 kotwice na sekcję. To powoduje, że struktura artykułu jest semantyczna — encje mają relację z informacjami zawartymi w tekście.

---

### Krok 7: Reguły jakościowe i unikanie błędów

W prompcie zdefiniowane są cztery grupy reguł jakościowych:

**BLUF (Bottom Line Up Front):** Zdanie otwierające odpowiada na pytanie z nagłówka natychmiast. Źle: "Istnieje wiele czynników wpływających na kortyzol..." Dobrze: "7-9 godzin snu obniża kortyzol o 20-30% u osób po 40-tce."

**NO FILLER:** Test: usuń zdanie — czy tekst stracił informację? Nie → to filler. Każde zdanie musi zawierać konkretny fakt, liczbę, porównanie, przykład lub krok do wykonania. Zabronione: "Warto zwrócić uwagę...", "W tej sekcji omówimy...", "Jest to kluczowe..."

**NO DUPLICATE:** Każdy fakt dokładnie raz w całym artykule. Outline w prompcie pokazuje, które fakty należą do innych sekcji.

**H2/H3 HIERARCHY:** H2 = kompleksowy przegląd. H3 = bezpośrednia odpowiedź + nowy kąt widzenia. H3 nigdy nie powtarza treści H2.

Prompt definiuje również 4 błędy do unikania:

| Błąd | Co to jest | Reguła |
|---|---|---|
| Ściana tekstu | Brak wizualnych przerw | Każda sekcja musi mieć akapity, listy lub tabele |
| Rozmycie tematu | Mieszanie wątków w akapicie | Jeden temat na akapit |
| Encja bez nazwy | "ten suplement" zamiast konkretnej nazwy | Zawsze nazwa encji, nigdy ogólnik |
| Przerost formy | Zdania powyżej 25 słów | Podmiot + Orzeczenie + Dopełnienie + Kontekst |

---

### Krok 8: Konfiguracja skryptu

Przed uruchomieniem ustaw parametry w sekcji konfiguracyjnej:

**Pliki wejściowe/wyjściowe:**
- `INPUT_FILE` — output z poprzedniej lekcji (`output_distribution.json`)
- `OUTPUT_FILE` — draft w HTML (`output_draft.html`)
- `OUTPUT_IMAGE_PROMPTS` — prompty do infografik

**Model:** `gpt-5.2` (lub dowolny model reasoning OpenAI). Przy innym modelu ustaw `USE_REASONING_PARAMS = False`.

**Verbosity (objętość tekstu):** `low` = krótkie sekcje, `medium` = balans (domyślne), `high` = obszerne sekcje. To bezpośrednio wpływa na zużycie tokenów.

**Reasoning effort:** `low` = szybka odpowiedź, `medium` = balans, `high` = najgłębsze rozumowanie (najdroższe). Do generowania treści zazwyczaj wystarczy `medium`.

:::tip[Czas wykonania]
Skrypt generuje cały artykuł w ok. 2-3 minuty. Każdy blok to osobne zapytanie do API, z pauzą 0.8s między blokami (ochrona przed rate limitem).
:::

---

### Krok 9: Sekcje "full" vs "context"

Artykuł składa się z dwóch typów sekcji, zgodnie z dystrybucją intencji z outline'u:

| Typ sekcji | Kiedy | Efekt |
|---|---|---|
| `full` | Intencja główna artykułu | 3-5 akapitów, pełne dane, struktura 5 elementów z podsumowaniem |
| `context` | Inne intencje (uzupełniające) | 1-2 akapity, krótkie wspomnienie tematu, BEZ podsumowania |

Dla przykładowego artykułu o kortyzolu (intencja instrukcyjna): 5 sekcji full (konkretne sposoby obniżenia kortyzolu) + 3 sekcje context (definicje, diagnostyka, przyczyny). Sekcje kontekstowe nie dominują — służą wyczerpaniu tematu i wewnętrznemu linkowaniu.

---

### Krok 10: Mosty kontekstowe między sekcjami

Sekcje nie powinny być wyizolowanymi wyspami. Jeśli encja zdefiniowana wcześniej pasuje do kontekstu bieżącej sekcji, warto nawiązać do niej 1-zdaniowym mostem, np.: "Wspomniany wcześniej [encja] odgrywa rolę również w..."

**Ograniczenia:** max 2-3 mosty na cały artykuł. Most nie powtarza treści i nie definiuje encji ponownie — tylko wskazuje połączenie.

---

### Podsumowanie

W tej lekcji poznaliśmy pełny proces generowania draftu artykułu:

- **Generowanie blok po bloku** z chainingiem (response ID) zamiast całego artykułu naraz
- **Analiza nagłówków** determinuje format każdej sekcji (instrukcja, definicja, porównanie, lista...)
- **Struktura sekcji** — 5 elementów: zdanie otwierające (BLUF), treść merytoryczna, dane wspierające, elementy wizualne, podsumowanie
- **Kotwiczenie encji** — 5 typów kotwic (atrybutowa, porównawcza, sytuacyjna, czasowa, przyczynowa)
- **Reguły jakościowe** — BLUF, NO FILLER, NO DUPLICATE, H2/H3 HIERARCHY
- **3 mechanizmy antyduplikacji** — chaining, outline jako kontekst, programatyczna deduplikacja faktów

Draft to dopiero Mercedes — w kolejnych lekcjach (rewrite, optymalizacja, humanizacja) zamienimy go w Porsche.

---

## 📦 Materiały do pobrania

### Skrypt Python (generowanie draftu)



### Przykładowe dane (input + output)






---

<details>
<summary>📝 Transkrypcja wideo</summary>

Cieszę się, że udało nam się wspólnie dotrzeć do tej lekcji. Ta lekcja dotyczy generowania draftu treści. Dlaczego draftu? Dlatego, że ja uznaję, iż nie da się wygenerować w jednym wywołaniu LMA dobrej jakości treści. Treść, później jeżeli widzieliście spis treści naszych zajęć, to zobaczycie, że będziemy generować tą treść, a później ją przepisywać jeszcze trzy razy. Zbiór reguł i do generowania i do optymalizacji, czy humanizacji byłby zbyt duży i w tej chwili żaden model językowy, i myślę, że jeszcze długo, długo, żaden model językowy nie będzie mógł tego wykonać należycie, żeby spełnić wszystkie nasze reguły.

Parę słów wstępu jeszcze na sam początek, zanim przejdziemy do prezentacji. Powiązane pliki tradycyjnie — jest tutaj skrypt Pythona, ale nie ma tym razem promptu. Myślę, że jeżeli ktoś już dotarł do tej lekcji, to będzie na tyle obyty, żeby ten prompt sobie z tego skryptu wyciągnąć i zmienić, dostosować swoje potrzeby do swojego pipeline'u.

Co jest wejściem? Oczywiście output distribution to jest to, co wygenerowaliśmy w poprzedniej lekcji, czyli rozdana dystrybucja wszystkich elementów, które zbieraliśmy w poprzednich blokach, dostosowana, przypisana do odpowiednich sekcji spisu treści, od odpowiednich nagłówków. Na wyjściu będzie draft już w postaci HTML.

Jeszcze jedna rzecz, która jest dość istotna. Warto też jako treść traktować grafiki, a tak naprawdę infografiki. Oczywiście jest inna ścieżka do generowania infografii, dlatego nie będziemy się tym zajmować, natomiast mamy możliwość utrzymując cały kontekst, całego artykułu, wiedząc dokładnie gdzie takie infografiki by się przydały, mamy możliwość stworzenia promptów do generowania tych grafik, a później możecie to sobie wygenerować w jakimś nanobanana albo w innym systemie, appce, która generuje te zdjęcia.

Zaczynamy od prezentacji. Tak jak wspomniałem na wstępie zajmiemy się generowaniem już draftu treści, czyli przeszliśmy od zebrania wszystkich danych do stworzenia outline'u, który ma przypisane end, fakty i wszystkie te pozostałe elementy.

Co będziemy robić w tym etapie? Przede wszystkim pamiętajcie czym tutaj jest input. Input jest outputem z poprzedniej lekcji, więc musimy mieć wygenerowany ten output z dystrybucją. Później takim istotnym dość elementem też jest deduplikacja, o której powiem przy dedykowanym slajdzie. Bardzo ważną, oczywiście też ważną sekcją całego systemu, całego skryptu jest analiza nagłówków, bo ta analiza nagłówków pozwoli nam ukształtować naszą treść w taki sposób, aby idealnie odpowiadała na zadane pytania, trafiała z intencjami, żeby była też również zróżnicowana. No i na koniec, tak jak na wstępie też powiedziałem, dostaniemy gotowy draft artykułu, który będzie już z kolei inputem do kolejnych etapów, etapów, w których będziemy optymalizować, deduplikować znowu, bo to zawsze jest niedoskonałe i humanizować.

Dlaczego generujemy blokami? Już to wyjaśniałem wcześniej, ale to jest ta lekcja, której to dotyczy. Generujemy blokami, dlatego że przy dużej ilości treści do wygenerowania model językowy, a próbowałem uwierzcie mi wielu, traci sens, traci przede wszystkim jakość tekstu, który jest generowany. Więc ta końcówka zazwyczaj już jest bardzo słaba. Generowanie blokami pozwala nam również na wiele innych rzeczy. Między innymi na to, żeby móc zrestartować na przykład tylko jedną część artykułu.

I bardzo ważna zasada, którą się będziemy trzymali. Każda sekcja, a przypominam sekcja to jest H2, czyli od nagłówka H2 do następnego nagłówka H2. I każda sekcja będzie zawierała również nagłówki H3, ale każda sekcja to kompletny pakiet. Musimy to trochę traktować w taki sposób, żeby się dało zrozumieć o co chodzi czytając tylko jedną sekcję. Oczywiście będziemy też robić swojego rodzaju kotwice, powiązania między sekcjami, ale to jest niezwykle istotne, bo jak widzieliście wcześniej, każda sekcja też ma przypisaną intencję. Oczywiście pierwsze sekcje są zgodne z intencją główną naszego zapytania, ale później mogą być też inne intencje, więc one mogą też być w inny sposób generowane i zupełnie inaczej opowiadać o problemie.

Cały artykuł. Jaka jest różnica przy generowaniu całego artykułu i oczywiście przy generowaniu blok po bloku? Tak jak wspomniałem, jeżeli zrobimy to cały naraz artykuł, wrzucimy, czy nawet mamy ten nasz outline i wrzucimy go i poprosimy o wygenerowanie całego artykułu, to rzeczywiście potrafi zgubić dane z początku, potrafi powtarzać rzeczy, bo już zapomina co było. No i tak jak mówiłem, przede wszystkim jest słaba jakość. Nie mamy też kontroli nad tą duplikacją, a tutaj przy generowaniu blok po bloku, przy tym podzieleniu i tak zwanym wykorzystaniu stanu chainingu to jest specjalna tak naprawdę funkcja w API modelu OpenAI i też za chwilę o niej opowiem to mamy bardzo redukujemy ilość duplikacji.

Co to jest ten chaining? Wyobraźcie sobie, że API modelu językowego, praktycznie każdego, nie wiąże między sobą wątków. Tak jak macie chat GPT, w którym macie całą konwersację w jednym wątku, to rzeczywiście model językowy tak jest skonstruowany, że pamięta, rozumie kontekst całej konwersacji. Natomiast w API tak nie jest i to był zawsze bardzo duży problem, jeżeli chodzi o generowanie treści. Sytuacja się zmieniła, jak pojawiły się modele rezonningowe. Okazało się, że jak wyszła wersja GPT-5, to ma taką funkcję, że można podać poprzednie ID odpowiedzi. I wtedy model będzie utrzymywał ten kontekst. Dlatego też dzisiaj polecam wam generowanie za pomocą OpenAI.

I jak to wygląda w praktyce? Jeżeli mamy w pierwszym bloku wygenerowaną już odpowiedź, to ta odpowiedź ma przypisane ID. Więc przy następnym bloku mamy możliwość podania tego, a już mamy ten id, czyli inputu z poprzedniego bloku, bo to są osobne zapytania. I podajemy to jako response id. I oczywiście dostaniemy nową odpowiedź z nowym response id, czyli to będzie resp.dev i tak dalej. Do kolejnego bloku podajemy to, co było na outputcie. To jest właśnie ten chaining.

I warto też sobie porównać podejścia do generowania. Sama duplikacja, wiecie, że modele nie są deterministyczne. Ona raz bywa, raz nie. Bardzo ciężko samymi promptami ją ograniczyć. Ja robię to w dwóch miejscach. Tutaj się staramy jak najwięcej zduplikować informacji, a i tak zobaczycie, że będą się zdarzały powtórki. Natomiast później jest cały duży i będzie lekcja osobna, cały duży prompt do optymalizacji tego artykułu, w którym ta duplikacja jest chyba jedną z najważniejszych rzeczy.

Problem polega na tym, że jeżeli wysyłacie całą historię robiąc sekcja po sekcji, że wysyłacie całą historię, czyli poprzednią sekcję wygenerowaną, to przy generowaniu setek treści wasz koszt wzrasta naprawdę, jest bardzo wysoki, bo jest więcej tokenów, które model musi przetworzyć. I na koniec artykułu praktycznie wysyłacie za każdym razem większość artykułów.

Teraz bardzo ważna rzecz, która zmienia wszystko. Będziemy analizować dwie rzeczy, żeby dobrze wygenerować daną sekcję, żeby ona dobrze odpowiadała na nagłówek. Musimy przeanalizować sam nagłówek i wszystkie dane, które do niej mamy. Zobaczcie, jeżeli mamy taki nagłówek, który ma wzorzec, który się zaczyna na przykład od "jak", to my wiemy, że to jest instrukcja i że powinien być kontekst, cel, kroki i jakiś rezultat. Nie mylcie tego z intencjami, chociaż to trochę się pokrywa, ale to jest bardzo prosty algorytm, który analizuje nasze nagłówki. Dla przykładu, jeżeli jest "X a Y" to jest porównanie — ramka, może tabelę warto zastosować. Jeżeli jest pytanie, to musi być odpowiedź i zgodnie z zasadą BLUF odpowiedź ma być w pierwszym zdaniu, a dopiero później ją rozwijamy.

Jak powinna wyglądać struktura sekcji? Powiedzmy sobie, że to będzie pięć elementów. Zdanie otwierające, o którym cały czas mówię, czyli BLUF plus encja plus odpowiedź. Encja zazwyczaj mamy przypisaną do danej sekcji. Później następuje treść merytoryczna, czyli tu wyjaśniamy. Mamy dane wspierające — statystyki lub fakt. I jeszcze jedna rzecz — sprawdzimy promptem, które dane nadają się do tego, żeby podać je statystycznie i żeby one nie były wymyślane. Zbierzemy je z internetu wykorzystując Web Search w API modelu. Dochodzą nam elementy wizualne — tabele, checklisty, HTML. I na koniec małe, krótkie podsumowanie.

Same encje, użycie tych encji, mając nawet w kontekście ich opis, same użycie encji nie wystarcza. Warto te encje kotwierzyć w naszym kontekście. Co to znaczy kotwierzyć? To znaczy tak ich używać, żeby one nie były tylko wstawioną wysepką. I tu wprowadzimy sobie pięć typów tych kotwic: atrybutowa, czyli encja plus cecha mierzalna; porównawcza — encja A versus encja B; sytuacyjna, czyli encja plus grupa docelowa; czasowa — encja plus czas; i przyczynowa — encja, przyczyna i skutek.

Jakość i kontrola. Możemy w naszym prompcie zastosować przykłady błędów do unikania. Przy generowaniu tekstów dużo lepiej modele wykorzystują informacje z promptu jeżeli podamy też błędy, czyli przykłady negatywne. Ściana tekstu — wiecie jak to wygląda, model zrobi 5 nagłówków i w każdym będzie podobna ilość tekstu. Rozmycie tematu — jeden temat na akapit. Encja bez nazwy — musi być wymieniona z nazwy, zakotwiczona i zdefiniowana. Przerost formy — ograniczamy zdania powyżej 25 słów.

Reguły jakościowe: BLUF, czyli odpowiedź pierwsza. No filler — jeżeli zdanie możesz wyciąć z treści i nic się nie zmienia, to jest filler. Reguły duplikacji — jednorazowe użycie faktu. H2/H3 hierarchia — H2 to jest przegląd, a H3 to jest nowy kąt widzenia.

Jak skrypt działa w praktyce: najpierw następuje analiza wszystkich nagłówków. Później skrypt dzieli na bloki — mamy 9 bloków, wszystko jest skojarzone z sekcjami H2 i poniżej. Mamy informację o typie sekcji — full, intro, kontekst. Każdy blok jest generowany osobnym zapytaniem, z chainingiem, z informacją ile mamy encji, ile faktów. Czas wykonania: pomiędzy 2 a 3 minuty. Statystyki: 18 220 znaków w artykule.

Na wyjściu mamy dwa pliki. Output draft to nasz HTML, który zaczyna się od nagłówka. I mamy output prompty do obrazków — jedną infografikę do wygenerowania.

Co do konfiguracji: model GPT-5.2, ale może być każdy reasoning. Ustawiamy flagę `USE_REASONING_PARAMS` na true. Verbosity: low = niska objętość, medium = średnia, high = wysoka. Reasoning effort: średni. Wzorce nagłówków realizowane przez dopasowania patternów regex dla wersji polskiej i angielskiej.

Wynik: artykuł z różnorodną strukturą — tabele, kroki instrukcji, listy, porównania. Każda sekcja jest inna, nie ma powtarzalności. Encje zakotwiczone czasowo, atrybutowo, porównawczo. Sekcje full z pełnym rozwinięciem tematu, sekcje context z krótkim uzupełnieniem. Artykuł zaczyna się od odpowiedzi (BLUF), bez filerów, bez niepotrzebnych wstępów. Draft to Mercedes — po kolejnych etapach (rewrite, optymalizacja, humanizacja) będzie Porsche.

</details>

---

<div class="lesson-completion-bottom" data-lesson-id="ai-content-expert/blok-3/lekcja-2"></div>

<div id="sensai-comments"></div>


---

# 3.3 Wzbogacanie treści danymi

<div class="lesson-meta">
  <div class="lesson-mentor">
    <img class="lesson-mentor__avatar" src="https://framerusercontent.com/images/t2GGO1yled5Z8wSFTTJMQHHzd4.png?scale-down-to=512&width=2976&height=2949" alt="Maciej Chmurkowski" />
    <span class="lesson-mentor__info">
      <span class="lesson-mentor__label">Mentor</span>
      <span class="lesson-mentor__name-text">Maciej Chmurkowski</span>
    </span>
  </div>
  <div class="lesson-rating" data-lesson-id="ai-content-expert/blok-3/lekcja-3"></div>
  <div class="lesson-completion" data-lesson-id="ai-content-expert/blok-3/lekcja-3"></div>
</div>

## 🎯 Cel lekcji

Opanowanie technik wzbogacania wygenerowanej treści o dodatkowe dane za pomocą LLM API.

---

## 📒 Notatka z lekcji

*(Treść zostanie uzupełniona)*

---

<details>
<summary>📝 Transkrypcja wideo</summary>

*(Transkrypcja zostanie uzupełniona)*

</details>

---

<div class="lesson-completion-bottom" data-lesson-id="ai-content-expert/blok-3/lekcja-3"></div>

<div id="sensai-comments"></div>


---

# 3.4 Optymalizacja i sprawdzanie treści

<div class="lesson-meta">
  <div class="lesson-mentor">
    <img class="lesson-mentor__avatar" src="https://framerusercontent.com/images/t2GGO1yled5Z8wSFTTJMQHHzd4.png?scale-down-to=512&width=2976&height=2949" alt="Maciej Chmurkowski" />
    <span class="lesson-mentor__info">
      <span class="lesson-mentor__label">Mentor</span>
      <span class="lesson-mentor__name-text">Maciej Chmurkowski</span>
    </span>
  </div>
  <div class="lesson-rating" data-lesson-id="ai-content-expert/blok-3/lekcja-4"></div>
  <div class="lesson-completion" data-lesson-id="ai-content-expert/blok-3/lekcja-4"></div>
</div>

## 🎯 Cel lekcji

Nauczenie się technik optymalizacji treści: deduplikacji, weryfikacji faktów i poprawy jakości.

---

## 📒 Notatka z lekcji

*(Treść zostanie uzupełniona)*

---

<details>
<summary>📝 Transkrypcja wideo</summary>

*(Transkrypcja zostanie uzupełniona)*

</details>

---

<div class="lesson-completion-bottom" data-lesson-id="ai-content-expert/blok-3/lekcja-4"></div>

<div id="sensai-comments"></div>


---

# 3.5 Przejścia pomiędzy sekcjami

<div class="lesson-meta">
  <div class="lesson-mentor">
    <img class="lesson-mentor__avatar" src="https://framerusercontent.com/images/t2GGO1yled5Z8wSFTTJMQHHzd4.png?scale-down-to=512&width=2976&height=2949" alt="Maciej Chmurkowski" />
    <span class="lesson-mentor__info">
      <span class="lesson-mentor__label">Mentor</span>
      <span class="lesson-mentor__name-text">Maciej Chmurkowski</span>
    </span>
  </div>
  <div class="lesson-rating" data-lesson-id="ai-content-expert/blok-3/lekcja-5"></div>
  <div class="lesson-completion" data-lesson-id="ai-content-expert/blok-3/lekcja-5"></div>
</div>

## 🎯 Cel lekcji

Opanowanie technik tworzenia płynnych przejść między sekcjami treści.

---

## 📒 Notatka z lekcji

*(Treść zostanie uzupełniona)*

---

<details>
<summary>📝 Transkrypcja wideo</summary>

*(Transkrypcja zostanie uzupełniona)*

</details>

---

<div class="lesson-completion-bottom" data-lesson-id="ai-content-expert/blok-3/lekcja-5"></div>

<div id="sensai-comments"></div>


---

# 3.6 Humanizacja treści

<div class="lesson-meta">
  <div class="lesson-mentor">
    <img class="lesson-mentor__avatar" src="https://framerusercontent.com/images/t2GGO1yled5Z8wSFTTJMQHHzd4.png?scale-down-to=512&width=2976&height=2949" alt="Maciej Chmurkowski" />
    <span class="lesson-mentor__info">
      <span class="lesson-mentor__label">Mentor</span>
      <span class="lesson-mentor__name-text">Maciej Chmurkowski</span>
    </span>
  </div>
  <div class="lesson-rating" data-lesson-id="ai-content-expert/blok-3/lekcja-6"></div>
  <div class="lesson-completion" data-lesson-id="ai-content-expert/blok-3/lekcja-6"></div>
</div>

## 🎯 Cel lekcji

Poznanie technik humanizacji treści generowanych przez AI oraz inżynierii wstecznej.

---

## 📒 Notatka z lekcji

*(Treść zostanie uzupełniona)*

---

<details>
<summary>📝 Transkrypcja wideo</summary>

*(Transkrypcja zostanie uzupełniona)*

</details>

---

<div class="lesson-completion-bottom" data-lesson-id="ai-content-expert/blok-3/lekcja-6"></div>

<div id="sensai-comments"></div>


---


## 📅 Tydzień 4

# 4.1 Detekcja treści AI

<div class="lesson-meta">
  <div class="lesson-mentor">
    <img class="lesson-mentor__avatar" src="https://framerusercontent.com/images/t2GGO1yled5Z8wSFTTJMQHHzd4.png?scale-down-to=512&width=2976&height=2949" alt="Maciej Chmurkowski" />
    <span class="lesson-mentor__info">
      <span class="lesson-mentor__label">Mentor</span>
      <span class="lesson-mentor__name-text">Maciej Chmurkowski</span>
    </span>
  </div>
  <div class="lesson-rating" data-lesson-id="ai-content-expert/blok-4/lekcja-1"></div>
  <div class="lesson-completion" data-lesson-id="ai-content-expert/blok-4/lekcja-1"></div>
</div>

## 🎯 Cel lekcji

Poznanie narzędzi i technik wykrywania treści generowanych przez AI.

---

## 📒 Notatka z lekcji

*(Treść zostanie uzupełniona)*

---

<details>
<summary>📝 Transkrypcja wideo</summary>

*(Transkrypcja zostanie uzupełniona)*

</details>

---

<div class="lesson-completion-bottom" data-lesson-id="ai-content-expert/blok-4/lekcja-1"></div>

<div id="sensai-comments"></div>


---

# 4.2 Optymalizacja za pomocą Similarity Score

<div class="lesson-meta">
  <div class="lesson-mentor">
    <img class="lesson-mentor__avatar" src="https://framerusercontent.com/images/t2GGO1yled5Z8wSFTTJMQHHzd4.png?scale-down-to=512&width=2976&height=2949" alt="Maciej Chmurkowski" />
    <span class="lesson-mentor__info">
      <span class="lesson-mentor__label">Mentor</span>
      <span class="lesson-mentor__name-text">Maciej Chmurkowski</span>
    </span>
  </div>
  <div class="lesson-rating" data-lesson-id="ai-content-expert/blok-4/lekcja-2"></div>
  <div class="lesson-completion" data-lesson-id="ai-content-expert/blok-4/lekcja-2"></div>
</div>

## 🎯 Cel lekcji

Nauczenie się wykorzystania Similarity Score do optymalizacji i porównywania treści.

---

## 📒 Notatka z lekcji

*(Treść zostanie uzupełniona)*

---

<details>
<summary>📝 Transkrypcja wideo</summary>

*(Transkrypcja zostanie uzupełniona)*

</details>

---

<div class="lesson-completion-bottom" data-lesson-id="ai-content-expert/blok-4/lekcja-2"></div>

<div id="sensai-comments"></div>


---

# 4.3 Generowanie meta treści

<div class="lesson-meta">
  <div class="lesson-mentor">
    <img class="lesson-mentor__avatar" src="https://framerusercontent.com/images/t2GGO1yled5Z8wSFTTJMQHHzd4.png?scale-down-to=512&width=2976&height=2949" alt="Maciej Chmurkowski" />
    <span class="lesson-mentor__info">
      <span class="lesson-mentor__label">Mentor</span>
      <span class="lesson-mentor__name-text">Maciej Chmurkowski</span>
    </span>
  </div>
  <div class="lesson-rating" data-lesson-id="ai-content-expert/blok-4/lekcja-3"></div>
  <div class="lesson-completion" data-lesson-id="ai-content-expert/blok-4/lekcja-3"></div>
</div>

## 🎯 Cel lekcji

Opanowanie technik generowania treści dodatkowych: TL;DR, tytułów, meta description i FAQ.

---

## 📒 Notatka z lekcji

*(Treść zostanie uzupełniona)*

---

<details>
<summary>📝 Transkrypcja wideo</summary>

*(Transkrypcja zostanie uzupełniona)*

</details>

---

<div class="lesson-completion-bottom" data-lesson-id="ai-content-expert/blok-4/lekcja-3"></div>

<div id="sensai-comments"></div>


---

# 4.4 Intencja i semantyczna klasa zapytania

<div class="lesson-meta">
  <div class="lesson-mentor">
    <img class="lesson-mentor__avatar" src="https://framerusercontent.com/images/t2GGO1yled5Z8wSFTTJMQHHzd4.png?scale-down-to=512&width=2976&height=2949" alt="Maciej Chmurkowski" />
    <span class="lesson-mentor__info">
      <span class="lesson-mentor__label">Mentor</span>
      <span class="lesson-mentor__name-text">Maciej Chmurkowski</span>
    </span>
  </div>
  <div class="lesson-rating" data-lesson-id="ai-content-expert/blok-4/lekcja-4"></div>
  <div class="lesson-completion" data-lesson-id="ai-content-expert/blok-4/lekcja-4"></div>
</div>

## 🎯 Cel lekcji

Nauczenie się określania intencji użytkownika i semantycznej klasy zapytania na podstawie słowa kluczowego.

---

## 📒 Notatka z lekcji

*(Treść zostanie uzupełniona)*

---

<details>
<summary>📝 Transkrypcja wideo</summary>

*(Transkrypcja zostanie uzupełniona)*

</details>

---

<div class="lesson-completion-bottom" data-lesson-id="ai-content-expert/blok-4/lekcja-4"></div>

<div id="sensai-comments"></div>


---

# 4.5 EEAT - Consensus wiedzy i cytaty

<div class="lesson-meta">
  <div class="lesson-mentor">
    <img class="lesson-mentor__avatar" src="https://framerusercontent.com/images/t2GGO1yled5Z8wSFTTJMQHHzd4.png?scale-down-to=512&width=2976&height=2949" alt="Maciej Chmurkowski" />
    <span class="lesson-mentor__info">
      <span class="lesson-mentor__label">Mentor</span>
      <span class="lesson-mentor__name-text">Maciej Chmurkowski</span>
    </span>
  </div>
  <div class="lesson-rating" data-lesson-id="ai-content-expert/blok-4/lekcja-5"></div>
  <div class="lesson-completion" data-lesson-id="ai-content-expert/blok-4/lekcja-5"></div>
</div>

## 🎯 Cel lekcji

Poznanie technik budowania autorytetu treści zgodnie z wytycznymi EEAT (Experience, Expertise, Authoritativeness, Trustworthiness).

---

## 📒 Notatka z lekcji

*(Treść zostanie uzupełniona)*

---

<details>
<summary>📝 Transkrypcja wideo</summary>

*(Transkrypcja zostanie uzupełniona)*

</details>

---

<div class="lesson-completion-bottom" data-lesson-id="ai-content-expert/blok-4/lekcja-5"></div>

<div id="sensai-comments"></div>


---


## 📅 Tydzień 

# Spotkanie #1 - 28.01

<div class="lesson-meta">
  <div class="lesson-mentor">
    <img class="lesson-mentor__avatar" src="https://framerusercontent.com/images/t2GGO1yled5Z8wSFTTJMQHHzd4.png?scale-down-to=512&width=2976&height=2949" alt="Maciej Chmurkowski" />
    <span class="lesson-mentor__info">
      <span class="lesson-mentor__label">Mentor</span>
      <span class="lesson-mentor__name-text">Maciej Chmurkowski</span>
    </span>
  </div>
  <div class="lesson-rating" data-lesson-id="ai-content-expert/live/spotkanie-1"></div>
  <div class="lesson-completion" data-lesson-id="ai-content-expert/live/spotkanie-1"></div>
</div>


<div style="position:relative;padding-top:56.25%;"><iframe src="https://player.mediadelivery.net/embed/565073/bbf0bbd5-c29d-4dad-b095-c6fbcc968a04?autoplay=false&loop=false&muted=false&preload=true&responsive=true" loading="lazy" style="border:0;position:absolute;top:0;height:100%;width:100%;" allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;" allowfullscreen="true"></iframe></div>

<br />



<br />

## 📝 Notatki ze spotkania

### Plan i struktura kursu
Proces edukacyjny został podzielony na cztery kluczowe bloki tematyczne, które prowadzą od podstaw technicznych do zaawansowanej optymalizacji:

**Blok 1: Podstawy i łączność**
Konfiguracja API, praca z Pythonem oraz zrozumienie różnic między interfejsem czatu a bezpośrednim dostępem do API.

**Blok 2: Przygotowanie danych**
Etap bez generowania treści, skupiony na zbieraniu "paliwa" dla modeli (analiza SERP, ekstrakcja wiedzy).

**Blok 3: Generowanie treści**
Kluczowy etap obejmujący techniki RAG (Retrieval-Augmented Generation), triki optymalizacyjne oraz zaawansowaną humanizację tekstów.

**Blok 4: Lekcje dodatkowe i SEO**
Detekcja treści AI (obalanie mitów), optymalizacja pod Google Discover oraz dostosowanie treści pod AI Overviews (SGE).

---

### Architektura procesu generowania (pipeline)
Skuteczne tworzenie treści w skali wymaga podejścia modułowego. Zamiast jednego długiego zapytania (promptu), proces dzielimy na mniejsze kroki:

#### Zarządzanie krokami i danymi

1. **Orkiestracja**: Do łączenia kroków można wykorzystać bazy danych (SQL dla zaawansowanych), skrypty Python (np. w Google Colab z podpiętym Google Drive) lub narzędzia typu No-Code (n8n, Make).
2. **Statusy**: Każdy etap (np. pobieranie danych, tworzenie outline'u, generowanie draftu) powinien mieć przypisany status. Pozwala to na wznowienie pracy w przypadku błędów API lub timeoutów.
3. **Format danych**: Zaleca się przesyłanie i odbieranie danych w formacie JSON. Jest to najbezpieczniejszy sposób na zachowanie struktury i łatwe przekazywanie informacji do kolejnych kroków.

#### Wykorzystanie modeli reasoningowych (np. o1, o3)
Modele te są droższe, ale niezbędne w konkretnych momentach:
- **Tworzenie outline'u**: Gdy model musi podjąć decyzje na wielu poziomach struktury.
- **Wzbogacanie danymi**: Do określenia, jakich statystyk brakuje i jak je wpleść w treść.
- **Przejścia (transitions)**: Aby uniknąć statycznego stylu "sekcja po sekcji" i nadać tekstowi naturalny przepływ.

---

### Praktyczna ekstrakcja wiedzy i RAG
Aby treść była merytoryczna, musi bazować na danych zewnętrznych, a nie tylko na wiedzy ogólnej modelu.

#### Skuteczny scraping z Crawl4AI
Zamiast standardowych bibliotek, warto używać **Crawl4AI**, który imituje przeglądarkę Chromium i omija blokady.
- **Czyszczenie HTML**: Skrypt powinien usuwać skrypty, style, nawigację i stopki, redukując objętość kodu o około 80%.
- **Analiza gęstości linków (Link Density)**: Pomaga odróżnić właściwy artykuł od menu czy sekcji reklamowych.
- **Obsługa błędów**: Jeśli strona blokuje dostęp (komunikaty typu "Verify you are human"), należy pominąć dany URL i przejść do następnego z listy TOP 10.

#### Budowa bazy wiedzy (Graph of Knowledge)
- **Analiza TOP 10**: Pobieranie treści z pierwszej dziesiątki wyników Google daje lepsze rezultaty semantyczne niż poleganie wyłącznie na krótkich podsumowaniach z AI Overviews.
- **Ekstrakcja faktów**: Z pobranych treści wyciągamy encje (podmioty) i konkretne fakty, które posłużą jako fundament artykułu.

---

### Optymalizacja jakości i SEO

#### Strategia generowania: Sekcja po sekcji
Pisanie całego artykułu (powyżej 1000 znaków) naraz prowadzi do spadku jakości.
1. Generuj treść małymi fragmentami (H2 + paragrafy).
2. Przekazuj modelowi krótkie streszczenie tego, co napisał w poprzedniej sekcji, aby uniknąć powtórzeń.
3. Stosuj **Similarity Score** (embeddingi), aby matematycznie sprawdzić, czy poszczególne akapity nie są do siebie zbyt podobne.

#### Koszty i wydajność
- **Koszt artykułu**: Przy zaawansowanym procesie (wiele wywołań modeli reasoningowych) koszt może wzrosnąć z 0,50 zł do około 5,00 zł za sztukę. Jest to jednak koszt akceptowalny przy wysokiej jakości, która nie wymaga dużej korekty ludzkiej.
- **Czas**: Tworzenie jednego, dopracowanego artykułu w pipeline trwa średnio około 20 minut.

#### Publikacja na WordPress
Dla masowej publikacji zaleca się przygotowanie struktury pliku CSV i import za pomocą wtyczek takich jak **WP All Import**. Pozwala to na masowe ustawienie dat, URL-i i kategorii.

---

### Kolejne kroki i narzędzia
W ramach lekcji udostępnione zostały skrypty ułatwiające pracę:
- **Content Extractor Cloud4AI**: Zaawansowany skrypt do czystej ekstrakcji treści.
- **BM25 / Embedding Search**: Narzędzia do przeszukiwania pobranej wiedzy.

> [!TIP]
> **Zadanie dla Ciebie:** Przetestuj skrypt do ekstrakcji treści na kilku trudnych URL-ach. Sprawdź, ile "śmieci" (nawigacja, stopki) udaje się odsiać.

---



<div class="lesson-completion-bottom" data-lesson-id="ai-content-expert/live/spotkanie-1"></div>

<div id="sensai-comments"></div>


---

# Spotkanie #2 - 04.02

<div class="lesson-meta">
  <div class="lesson-mentor">
    <img class="lesson-mentor__avatar" src="https://framerusercontent.com/images/t2GGO1yled5Z8wSFTTJMQHHzd4.png?scale-down-to=512&width=2976&height=2949" alt="Maciej Chmurkowski" />
    <span class="lesson-mentor__info">
      <span class="lesson-mentor__label">Mentor</span>
      <span class="lesson-mentor__name-text">Maciej Chmurkowski</span>
    </span>
  </div>
  <div class="lesson-rating" data-lesson-id="ai-content-expert/live/spotkanie-2"></div>
  <div class="lesson-completion" data-lesson-id="ai-content-expert/live/spotkanie-2"></div>
</div>

<div style="position:relative;padding-top:56.25%;"><iframe src="https://player.mediadelivery.net/embed/565073/cab40a54-6498-4b7e-a2cc-2cca263d6896?autoplay=false&loop=false&muted=false&preload=true&responsive=true" loading="lazy" style="border:0;position:absolute;top:0;height:100%;width:100%;" allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;" allowfullscreen="true"></iframe></div>

<br />

## 📝 Notatki ze spotkania

Ta notatka stanowi praktyczne podsumowanie spotkania live, podczas którego omówiono proces tworzenia zautomatyzowanego ciągu działań (pipeline) w środowisku Google Colab. Przewodnik przeprowadzi Cię przez etapy pozyskiwania danych z wyszukiwarek, ich ekstrakcji, czyszczenia oraz zaawansowanej analizy pod kątem encji i relacji.

### Wymagania i założenia

Przed rozpoczęciem pracy upewnij się, że posiadasz:

- **Dostęp do Google Colab.**
- **Klucze API do usług:** Senuto (opcjonalnie, skrypt posiada fallback), Crawl4AI oraz OpenAI (do walidacji i LLM).
- **Zainstalowane biblioteki:** `transformers`, `spacy` oraz polskie modele językowe (`pl_core_news_lg`).

### Krok 1: Pozyskiwanie adresów URL (SERP URLs)
Celem tego kroku jest zebranie listy wartościowych stron internetowych na podstawie wybranego słowa kluczowego.

- **Działanie:** Skrypt SERP URLs odpytuje wyszukiwarki Google, Bing oraz DuckDuckGo.
- **Kluczowe ustawienia:** Możesz zdefiniować limit unikalnych adresów (np. 8 sztuk), aby optymalizować koszty dalszego przetwarzania.
- **Mechanizm Fallback:** Jeśli API (np. Senuto) nie zadziała, skrypt automatycznie przełącza się na skrapowanie wyników za pomocą Crawl4AI.
- **Wynik:** Plik tekstowy lub CSV zawierający listę oczyszczonych adresów URL.

### Krok 2: Ekstrakcja treści (Content Extraction)
W tym etapie pobieramy surowy tekst z zebranych wcześniej adresów URL.

- **Działanie:** Użyj skryptu Extractor Batch, który czyta listę z pliku wejściowego.
- **Inteligentna selekcja:** Skrypt analizuje bloki tekstu na stronie i decyduje, które z nich zachować (`keep`), a które pominąć (`skip` jako nieistotne, np. menu, stopki).
- **Zapis:** Treść wszystkich stron jest zapisywana w jednym pliku (np. `script_content_all.csv`), gdzie poszczególne źródła są oddzielone separatorami.

### Krok 3: Czyszczenie i weryfikacja (Content Cleaning)
Surowy tekst często zawiera szum informacyjny. Ten krok zapewnia, że do analizy trafią tylko merytoryczne fragmenty.

- **Działanie:** Skrypt sprawdza podobieństwo (embeddingi) bloków tekstu do głównego zapytania.
- **Parametr Threshold:** Możesz regulować próg podobieństwa (np. 0.4 dla luźniejszych powiązań lub powyżej 0.8 dla bardzo precyzyjnych).
- **Efekt:** Usunięcie duplikatów, komunikatów o cookies oraz treści niezwiązanych z tematem.

### Krok 4: Wyciąganie encji (NER - Named Entity Recognition)
Kluczowy etap budowania bazy wiedzy, polegający na identyfikacji konkretnych obiektów (osób, produktów, procesów) w tekście.

- **Wybór modelu:** Dla języka polskiego zaleca się model `pl_core_news_lg`. W przypadku problemów z precyzją (np. błędne przypisywanie kategorii), warto zastosować podejście hybrydowe.

**Podejście hybrydowe:**
1. **Etap A:** Modele lokalne (Spacy/Transformers) generują listę "kandydatów" na encje.
2. **Etap B:** Model językowy (LLM) weryfikuje tych kandydatów, usuwa "śmieci" i dopisuje brakujące relacje.

> [!WARNING]
> Należy dbać o poprawne mapowanie etykiet (np. PERSON, ORG, PRODUCT), aby były zgodne ze specyfikacją danego modelu.

### Krok 5: Budowa i wizualizacja grafu wiedzy
Ostatni etap pozwalający zrozumieć strukturę informacji i przygotować bazę pod generowanie treści.

- **Relacje:** Każda encja powinna mieć przynajmniej jedną relację (powiązanie) z inną encją. Encje bez powiązań nazywamy "osieroconymi" (orphan) i zazwyczaj są usuwane.
- **Wizualizacja:** Narzędzia wizualne pozwalają wykryć tzw. "wyspy" (odizolowane grupy informacji).
- **Zastosowanie:** Tak przygotowany graf wiedzy posłuży jako precyzyjny brief dla sekcji artykułu, eliminując lanie wody i powtórzenia.

### Praktyczna porady i "pro tipy"

- **Zarządzanie statusami:** W profesjonalnym pipeline warto pracować na statusach w bazie danych (np. "pobrane", "wyczyszczone", "gotowe"). Dzięki temu skrypt w Colabie wie, od którego momentu zacząć pracę dla danego artykułu.
- **Format plików:** Preferowanym formatem wymiany danych jest JSON, ponieważ lepiej radzi sobie z zagnieżdżonymi strukturami (np. encje i ich atrybuty) niż płaskie pliki CSV.

### Następne kroki

W oparciu o przygotowane encje i graf wiedzy, w kolejnych etapach będziemy tworzyć Outline (spis treści) oraz generować finalne sekcje tekstu.

<details>
<summary>📝 Transkrypcja wideo</summary>

Dobra, słuchajcie, nie będziemy tracić czasu. Myślę, że zrobimy tak, bo widziałem na Discordzie fajne tematy, takie do zrobienia razem, i myślę, że one przydałyby się też wreszcie, ale chciałbym, ponieważ one zajmą trochę nam czasu, to może byśmy zrobili je później, a najpierw byśmy sobie poodpowiadali na pytania albo jakieś notujące problemy, które można by było szybciej po prostu rozwiązać, a później przejdziemy do tamtych tematów z Discord, bo co Wy na to? Tak, ok. Powiem szczerze, że nie wiem jak to z komunikacją, wszyscy są wyciszone. Mateusz, jesteś? Jestem, jestem. Ja będę chwilę teraz na początku, a potem już będę raciał, bo mam plan zdjęciowy dzisiaj. Dobra, to piszemy na czacie chyba na razie, żebyśmy wszyscy po prostu nie umówili na raz. Albo podnosimy ręce. Albo podnosimy ręce, żebyśmy sobie taką dyscyplinę wypracowali, żeby siebie nie zagłaszać i nie przerywać. I jeżeli macie teraz jakieś pytania, tak naprawdę może zaczniemy od organizacji lekcji, od tego tematu, od organizacji kursu. Jeżeli macie jakieś pytania, to jest jeszcze właśnie teraz Mateusz, to będziemy mogli na nie odpowiedzieć, więc możemy od tego zacząć. Dobrze, już moment, jeszcze pytanie. Mateusz, pamiętasz, że te pytania też się nam powtarza? O właśnie, to jest to. Kiedy zaczynamy samodzielną pracę? Z tego, co rozmawialiśmy z Damianem i Robertem, to generalnie jedno, że dostaniecie jakieś projekty, które możecie sobie sami realizować i ewentualnie Maciek będzie Wam mógł w tym pomóc, z Maćkiem razem to przygotujemy i Wam dostarczymy, potem będą też prace grupowe. Prace grupowe na platformie będzie system, w którym będziecie mogli się zgłosić, że chcecie dołączyć do jakiejś grupy, to Was przydzieli, będziecie mogli pracować, ale też wiem, że różnie to bywa czasowo, ciężko się zgadać, więc tak samo będzie to można po prostu zrobić samemu. Więc tutaj w żaden sposób Was do tych form nie przymuszamy, jeżeli nie będziecie chcieli, nie macie jak, bo pracujecie od 3. w nocy nad takimi rzeczami, to spoko. Przede wszystkim chcemy, żebyście po prostu się przećwiczyli i nauczyli, a nie koniecznie Was do czegoś zmuszać po prostu. To zacznę od końca, bo ta praca z grupami wydaje mi się bardzo fajna i moglibyście się sami dobierać. Dziś na Discordzie spróbujemy to zorganizować, może jakieś dane ogłoszenia po prostu, że grupy się zbierają w jakimś wątku i tam będziecie mogli sobie dołączać, dlatego że fajnie wykorzystać doświadczenie. Możecie sobie spotykać się na Google Meet'ie i będziecie mieli po prostu do stworzenia pipeline całego systemu do generowania. do konto na koniec, albo opisy produktów, opisy kategorii, opisy blogowe, ja bym tak to podzielił i stworzycie sobie grupę kto chce do jakiej grupy należeć, możecie też pewnię do wielu no i tworzycie od początku do końca, na podstawie kursu, wymieniając się swoim doświadczeniem ten pipeline i ja robię z wami z całą grupą jedno spotkanie, gdzie to podsumowujemy, rozwiązujemy jakieś problemy i dostarcie pięteczki? Tak to sobie wyobrażam. Samemu jest bardzo ciężko, jak sami widzicie, też ja się staram tutaj rozwiązać dużo problemów, ale nie da się zda, ale to będzie tak jakby trzecia część kursu, ale ta środkowa druga, która zaraz zaczniemy pewnie, nie wiem, czy ma to już w następnym tygodniu, bo tak, po tej części merytorycznej, to jest samodzielny projekt. I tu są fragmenty tego, co będziecie robić już w grupowo, więc będziecie na przykład mogli sobie wybrać, czy chcecie zrobić generowanie ENCI, czy chcecie grafu wiedzy zrobić, czy chcecie napisać artykuł. Tutaj jest po prostu przewidziany fragment na osobę, który musi być przynajmniej z dwóch cegiełek, tych elementów się składać. I to też będziecie mogli, jeszcze nie wiem jak to zorganizować, bo ja miałem tu wszystko czas, żeby to przejrzeć, ale no pomyślimy jeszcze Mateusz, jak to zrobić, gdybyśmy te spotkania jakoś organizowali z jedności od tych samodzielek projektów. Ewentualnie będziecie to podsyłać do mnie w jakiś tam sposób i ja przeznaczę jakiś czas na każdy taki projekt, żeby zobaczyć. Albo rozwiązać problem, bo tak naprawdę może nie muszę tego widzieć, bo jeżeli jest atakt fajny, no to nie. Mam nadzieję, że to odpowiada Wam na te pytania. Tylko kwestia czasu startu to ogłosimy. Indywidualnych i grupowych. I do wszystkiego dostaniecie... Pewnie prześlamy grupowego maila, ale też na misko. Będą do ogłoszenia. Dobra, to jeszcze te pytania. Jeszcze Paweł Pawlak. Kiedy mniej więcej kolejny drop materiałów wideo na tych ewentualnie innych ścieżkach? No to jakby tutaj zależy w każdej od prowadzących. Od Maćka wczoraj dostałem jeszcze... Wczoraj tam byłam blok drugi i się nagrywam już blok trzeci. Mam nadzieję, bo słuchajcie, generalnie przygotowuję się od dwóch do trzech godzin, czasami nawet czterech, do jednej lekcji. Niestety, nie jest duży powtórzeń, duży jest... Ciężko tak mówić, po prostu dzisiaj nie zająknąć. No dobra, ale też staram się przećwiczyć te rzeczy, ponieważ ja je wyjmuję ze swoich też systemów i one nie są przygotowane, nie są stand alone, to to mi trochę zajmuje, ale to też po to, żebyście mogli te systemy wykorzystywać. Więc dzisiaj będzie już content generation i na pewno do weekendów przynajmniej jedna lekcja dziennie. Tylko się z tym ogarnąłem. A tu czwartą część, gdzie są dodatki, zostawimy sobie na deser, bo one nie są potrzebne do tego, żebyście stworzyli swoje projekt. To są takie jakby rzeczy dodatkowe. No może poza wpisami produktów i kategorii temorytologiczne, gram jako pierwot. Także tak, to to będzie teraz, myślę, że powinniśmy w przeciągu tych paru dni bardzo mocno nas gonić marytorykę, żebyśmy mogli rozpocząć pracę nad samodzielnymi projektami. To mam nadzieję, że też odpowiedzieliśmy na te pytania. Dobra, macie jeszcze jakieś pytania odnośnie samego organizacji? No właśnie, Paweł, bo to też jest tak, że ja też może wyczerpić, bo nie wiem, że my też będziemy zależni prawdopodobnie, no i też jesteśmy zależni od innych grup. Też o tym mówiłem na poprzednim nagraniu, to nie chodzi o to, że ja jestem zależny od innych ścieżek ekworyckich, chodzi, że część z Was jest na tych i na tych ścieżkach. Ponieważ to wszystko się poopóźniało, to musimy się teraz rozplanować, żeby nie wdrażać do samej terminu. To jest najważniejsze. Dobra, czyli co, przechodzimy do merytoryki? Chyba nie ma więcej pytań, nie? Bo słuchajcie, możecie też podnieść rękę, tu jest taka ikonka. Chcecie coś powiedzieć, nie musicie pisać, może porozmawiać. Ale Michał. Mam pytanie dotyczące tego content extractora z Twojego skriptu Pythona, który jest świetna sprawa trochę, bo 2 tygodnie temu mi tam nie chciał pobrać, pamiętam, że opacienta.pl i dr.max.pl nie chciał pobrać, to tam jakiś cloud się odwalił, trzeba je sobie potestować, bo pomyślałem, co może Gina Reader to da radę z tym, ale działa ten skript po 2 tygodniach i pobiera te dane. Czy te biblioteki są aktualizowane, czy może na tej stronach się coś zmieni? Nie, ja tego nie aktualizowałem i powiem ci, że to było, ja wiem, bo tu pisałeś na ten wątek w dyskodzie, nie? I dobra, zacznę od tego, że strony będą blokowane, nie? To będą nas blokowały, naszego robotu, mimo że jesteśmy na Chromie, już zajmujemy Chrom, a to będziemy blokowani, więc trzeba się na to przygotować, nie dostaniecie 100%. Ale to teraz tak, bo to jest Collab i Collab prawdopodobnie ma jakiś zakres IP przydzielany, i być może tu się zmieniło, bo to jeszcze dobyt się instaluje za każdym razem, może został przydzielony inny zakres. Nie wiem, tak gdyby był merytorycznie na to przygotowany, ale podejrzewam, że to jest to. I dlatego tam było cloud. A może mieli jakieś ataki i włączyli na jakiś czas uwierzytylnianie, no bo to tak zwana ta kapszta i tego nie przejdziemy. Dobre, wiesz co możesz sobie zrobić? Poprosić jakiś cloud'a czy inny model o to, żeby ci zrobił fallback, żeby wyłowił takie typu "jesteś człowiekiem", "kapszta" itd. Jeżeli to jest, to nie pobierać w ogóle kominety w tej stronie, to to chyba jest dobre rozwiązanie. - Wczoraj też próbowałem na żywych URL-ach, które normalnie sobie używam, to ze Stanów Zjednoczonych, chyba ze 20 URL-ów spowiedziłem. Najśmieszniejsze jest to, że ten Crawford.ai większość pobrał, a Gnarieler nie dała radę pobrać z grupy Facebookowej, bo czasami są jakieś treści, a ta drufie z grym dał radę pobrać. I na cola macie go darmowego, to jest naśmieszniejsze. Generalnie, Crawford AI, jak sobie wejdziecie w specyfikację, to tam jest tyle opcji, że można ustawiać swoje IP, więc to jest temat rzeka. Samo Crawford AI ma też budowaną możliwość podpięcia klucza np. do OpenAI i sam może Wam realizować prompt, czyli w konfiguracji zapytania do Crawford wysyłacie URL, ale też prom. Ja on na przykład wyciągnie mi informację na temat tego. Tylko to jest drogie u nich, nie? Nie macie na tym kontroli. Więc ten sposób tutaj zrobiłem. To teraz jeszcze dla wszystkich przypomnę. To jest, ja zaraz udosamnie ekran może. Który to jest skrypt? Pobieranie... Aha, bo dobra, mam. Czekajcie, może o tym nie wiem. Boże nie mówimy o czymś, co ciężko zwizualizować. Coś nie idzie. Jeśli mam problemy, duże w ogóle. Dęp. Spróbujemy. jest to to jest ten skrypt, który tu jest podpięty w lekcji pobieranie listy stron i to jest ten zaawansowany tam macie tam musicie podpiąć klucz apice nuto i też tak jak ci mówiłem, pisiałem chyba tam możecie znawać senuto dodać tam data for seo a data for seo nie obsługiwało chyba nie pamiętam o co tam chodziło - Jak pan DuckDuckGo nie obsługi... - Zamiennie, zamiennie jest. Dobra, to teraz wam powiem tak, już wspomniałem, zaraz mogę zajrzeć od tego skrytu. Bing i DuckDuckGo nie jest robione przez żadne API, tylko to jest crowd for a life. Czyli za pomocą cenu to jest takie same API jak dla T4 SEO. biorę Google'a, a Bing i DuckDuckGo skrapuje po prostu listę stron z odpowiedzi w search'a do pomocą korejai. Znowu też rozwiązanie dla nas, jak można korejai. Dobra. No to właśnie jeszcze z tym pytaniem, bo tam pamiętam, że mówię, że po pobraniu pięciu treści z różnych stron, żeby już przerwać proces, czyli może się czasami zdarzyć tak, że po prostu tych danych z tego Binga nie będzie, bo pierwsze 10 jest tych URL, czy 7, tak było chyba. Wiesz, to ja bym pobrał chyba, bo dlatego, że to o czym mówiłem na kursie, żeby urozmaicić trochę tą wiedzę, która jest w Google, żeby porać inne strony, bo wszyscy my, popieramy z Google, wszystkie systemy tworzące treści, dlatego Google zaczął też walczyć z crawlerami, nie wiem czy słyszeliście o SERP API, o pozwie, nie? To tak jakby tutaj Google broni dostęp od swoich danych i będzie broniło coraz bardziej, Głównie chodzi o to, żeby mieć inne źródła i żeby się z czymś odróżniać. Czyli nie chęć się blokować po pięciu, możemy pobrać więcej, ale to podejrzewam, że jakieś tam współgadzie miało na koszty. Tak, bo przede wszystkim bardzo duże koszty ograniczysz, jeżeli dużo treści robisz. Bo jeżeli masz 10 stron pobranych i każda strona ma powiedzmy 10 tysięcy znaków, masz 100 tysięcy znaków do przerobienia entities, zbudowania grafów wiedzy itd. A w dużej ilości, mimo że nawet my później robimy te czyszczenie, bo jak czyszczenie contentu, to też była taka lekcja, to usuwamy te duplikaty, to i tak jest tego dużo. I razy to nie wiem, zróbcie sobie 1000 artykułów, 1000 krawów w generocie, to jest jakiś tam koszt. Może nie masz tego, ale chodzi też o czas przetwarzania, więc dla mnie 5 w zupełności by wystarczyło, czy z Google'a i zatem... Czyli powinniśmy to w systemie ustawiać, co pamiętam. Nie, nie mam. Czyli jest hard kodet w kodzie. Przyjeżdżajcie to sobie, wrzućcie to sobie do LMA i zobaczcie, jakie macie możliwości zmiany czy na data for sale, czy zrobienia takiego blokera, że jak mam już 5, to porzuć to. Nie, już jest wystarczająca ilość. I tyle. I to będzie chyba najlepszy pomysł na to. Dobra, to ten temat jest jasny? Czy ktoś jeszcze chcemy z EXTRAKT? Ktoś może inny ma jakieś pytanie na temat wyciągania treści ze stron innych? No dobra. To, ok, coś nowego? Może jakieś jeszcze pytania macie? Słuchajcie, mamy jeszcze godzinę 10, możecie mnie wykorzystać do różnych rzeczy, możemy nawet coś zaraz porobić razem, zaraz jeszcze do tego dyskona wyłkimy, ale najpierw bym umował chyba do tego 3 pytania. Jakoś w okazji jestem, bo tam widzę, że ten wątek, co dzisiaj cały czas pojawia i chcę, że są wątpliwości, czy to da się zrobić na Collabie, więc jestem. Wiem, że pisamy, że się da, ale jednak widzę, że co chwila są pytania. Czekajcie, ja sobie wejdę w te pytania. No to może na razie, póki nie powinno się pojawić pytania, to ja będę już lecił od Discorda. Dobra. Rafał i Encier, to zostawimy sobie, bo to pamiętam, że chcę to z Wami zrobić. Zobaczymy dlaczego tak tam wychodzi. A czy Rafał jesteś na tym spotkaniu? O, super. Byłbyś w stanie podesłać mi ten tekst? Co byśmy zrobili, daj was tym? Może być w niecałej, ale jakby... Czy to są bloki tekstów, które wystekstowałeś? Ja za Wam wszystkim powiem, o co chodzi. Nie wiem, czy wszyscy czytali się na Discordzie. Tam jest taki problem, że bardzo słabo działa ten nerw ze spacie. Jakieś dziwne są robione encje, typu kąt dachu to jest person, jak to jest person. Ewidentnie coś jest nie tak i prawdopodobnie to jest problem z modelem. Sobie byśmy porównali, który ja mam model wybrany, to też było przetestowane, ja to sprawdzałem. I jeszcze zrobimy sobie jedną rzecz, której chyba nie było na lekcji. Zrobimy sobie walidację tych encji przez model językowy. Dobra, zrobimy sobie akurat te obrace scory, fajne. Dobra, to zrobimy sobie cały pipeline live'ie, Ale to mówię, to jeszcze dojdziemy do tego, bo to nam zajmie trochę czasu. Dobra, i Michał, Ty chciałeś zobaczyć, jak zautomatyzować przekazywanie danych pomiędzy krokami w Colabie. To też możemy zrobić. No i rozumiem, że da się ten cały system postawić w Colabie. Tak, ja mam to postawione w Colabie i nie jeden, tylko x. I to jest tak, że ja obsługuję tę bazę danych. Jeżeli nie jesteś obyty z bazami danych, generalnie na dzień dzisiejszym nie musisz być. Tylko dobrze by było wiedzieć, jak taką bazę postawić, w sensie serwer, nawet po prostu MySQL, i jak założyć tabelę, albo możesz też poprosić dać dostępy do Roku Lab, w sensie skryptowy, i on Ci zrobi skrypt, który Ci zainicjuje, w sensie zbuduje tabelę odpowiednie, gdzie będą przyszymywane informacje, będą odczytywane, czyli output będzie zapisywany na tabeli, a tam odpowiednio później będziemy to przekazywać, ale najlepszy sposób teraz taki na Wasze potrzeby, to można też to zrobić na na klikach tekstowych. Po prostu zapisać klik tekstowy i zadać się nazwę, a w kolejnym kroku tą nazwę otworzyć. Jordan, dlaczego nie używasz odkierza stowarzów? Dlatego, że nie jestem w stanie umieć wszystkiego i nawet nie ociekam się, spróbowałem się bawić make'iem i nawet coś tam zaplanowałem, natomiast mój czas jest ograniczony i nie jestem w stanie tego zrobić, a druga rzecz, że No jakoś to nie jest po mojemu, z czym mieliście, więc ja używam baz danych i Pythona ogólnie. I to jest dla mnie wystarczające, to nie ważne czy to jest Collab, czy to jest gdzieś odpalane serwerze, czy to jest PHP nawet. Trzeba sobie jakieś ceny skutować. On nie rozwiąże się z dodatkową nauką i dodatkowymi problemami. tam też wiem, że trzeba dużo fallbacków robić i ospodziennio też chyba zatrzymywać jak są jakieś zapytania, fejle i tak dalej, bo całe życie może się wykrzymać. Ale orki za astrologę macie chyba na innych ścieżkach, jestem tego pewien, bo widziałem gdzieś tematy. Więc też akurat dobrze, że nie będę tego poruszał. Dobra, to czekaj, wrócimy jeszcze Michał do tego. To też sobie zaraz zrobimy. prosto po prostu zrobimy dwa, trzy kroki z tym zapisywaniu. Możemy to połączyć, wiecie co? Zrobimy sobie od początku na ten... Czekaj, żebym się nie pogłubił. Od Rafała Piechowskiego weźmiemy sobie te słowo kluczowe i przetworzymy to tak, żeby zapisywać krok po kroku do plików na przykład tekstowych i przekazywać dane. I wyprzywujemy sobie takie coś, co się zródziemy do niego. I wtedy zrobimy dwie pytania na jedno ogólne, Czyli Michał, to twoje pytania, to sobie zapisywać i tutaj zobaczymy te ancie. Dobra, ja chcę tylko na koniec diskota, bo wiem, że to były jeszcze krótsze rzeczy. Jeszcze tutaj... Glacius... Ok. Kasyś, nie wiem, czy Ty jesteś? Nie wiem, nie wiadomo. Słuchajcie, bo Kasyś się zapytał o budowanie mapy tematycznej dla swoich stron. Ja tego nie mam w swoim zakresie, bo się skupiłem głównie na mikro o obszarach, czyli na generowaniu tej tej treści. Na pewno ma to w ścieżkach semantyczna. Nie pamiętam, czy tam jest Robert, czy Deren, czy oni razem. Ale odpowiadam też na pytanie, to jest jeszcze nagrywane, więc może mi się to obejrzy. Zapraszam do lekcji queryfana. Tam bardzo mocno też dotykamy tych planów, więc ja myślę, że od jakiegoś czasu już zmienię podejście, że z jednego dokumentu można stworzyć cały obszar tematyczny, go zabudować i później przechodzi do następnego. Ogólnie jeżeli chodzi o planowanie, to mam taki swój system, który mi generuje w połączeniu z AI, z DataForSory, z BazelSynu, to nie jest tylko na Polskę, to mi generuje klastry i później przypisywanie odpowiednie słowa gotowe do tych klastrów, ale słowo gotowe już jest startnym pipeline'u do zrobienia treści, natomiast to niestety nie obejmuje tej ścieżki. Dobra, no to co, przechodzimy do tych dwóch złych rzeczy. Jak uratować drzewo w GARD-S-COL? To, co widzicie, to jest mój collab sensajowy, w którym ja, też przygotowując skrypty, gotowo jest dla Was. Jak widzicie, powoli już tutaj zaczęło się budować... Za każdą lekcję dodaję klocek. Ich jest więcej, rozumiem, bo z content-lxt-faction tam są 3, 4, 5 różnych możliwości. i doszliśmy już do ostatniej lekcji, która wczoraj była nagrywana, nie wiem czy ma też nie odpłodowało, by zabawa wygrać. My dojdziemy dzisiaj sobie do nerw i zaczniemy od początku. Cloud4AI, co tutaj jeszcze, Spacy, wszystko co mam, co jest potrzebne w biblioteki Pythona, mam wszystko w jednym startowym pliku w inkalacji. Który sobie to odpalam, jeżeli coś dochodzi, to doklejam tutaj po prostu instalację, gdyby to za jednym krokiem mieć zainstalowane jej z głowy. Później szybko odpalę konfigurację, a na lewini podszycie na klucze z "e". Zaraz ja tu powiększę, tu pierwszy kod, dobra. I "sert URLs". I tutaj sobie zrobimy to, już z naszym tym słowem, nie? Ale... Sprawdzę sobie tylko jeszcze jedną rzecz, on musi zapisać to do pliku. Tak, ja, dobra. To, co było na samym początku, powierzemy sobie... Ja w ogóle nie wiem, czy wy jesteście w stanie przecwajać wiedzę, bo ja tworzenie live pierwsze chyba robię, ale ten pierwszy sklep wykorzystamy na zasadzie do pisania do pliku, tutaj nic nie musimy zmienić. Więc opalmy go. Słuchajcie jeszcze jakieś pytania. A, dobra, Marek Maciejewski, z jakich dokładnie korzystam klików? Dobrze. To mogę tak robić. Teraz korzystamy z SERP URLs i... Nie będzie Wam to pisać. O, czekajcie, tak. Jeszcze się odpalił sprób. Słuchajcie, jak to się kręci, to jeszcze się instaluje biblioteki i konfiguracja się nie wstrzymała. Dopiero jak to pójdzie. Dzięki za to. Teraz jeszcze z wyświetleniem klików. Dobra, to jest skrypt, muszę się skupić trochę. Oto. To nie, to jest podwiedzenie z tej strony, dobra. To jest skrypt numer "krok pierwszy", który nie pisał. Tak. Dobra, zaczęło się. W tej chwili pobieranie, czyli tak, mamy... Już Wam mówię. To sobie ten, zablokuję, czekaj, czy sąki. Zblokuj. Tak jak mówiłem, ja pobieram dość dużo. Tu mamy 8 z Google. Zawiesiłem się, bo czytam URL-e, wiem, że to coś jest nie tak. Znowu z tym biegiem niestety. Ale to nam odrzuci... Odrzuci nam to, myślę jeszcze, weryfikowanie, bo to nie był rozwiązany tekst, ale po to mamy je przewracać. Poprawmy to. To trzeba naprawić problem. Robimy tak. Jak ja pracuję? Zajmijmy sobie ten nasz skrypt. Zajmijmy sobie do cloud'a. Knoję mu ten skrypt. I tak. Napiszę mu krótko, o co chodzi. "Czy to jest skrypt pobierający URL z trzech źródeł? Dla Bing dostaliśmy nieadekwane odpowiedzi". Ja mu tu wkleję to, co dostaliśmy z Binga. Wkleję mu nasze zapytania też, nie? Może jeszcze jakieś pytania na przyszłość. I tak będziemy to puszcząć jeszcze raz. Dobra, ja pracuję z opusem, chociaż do kodu można też wykorzystywać śmiało Sonet. Ja jestem cwaniakiem, bo ja mam konto premium za 80 chyba euro. No to nie kupuję, więc mogę cwaniakować trochę, ale wiem, że te limity są dużo niższe. Dobra, w normalnym, ogólnie też korzystam z kursora, ale większość czasu takiego, nie wiem, pojedynczego zadania nie korzystam, korzystam, po prostu traktuję to jako osobno, tylko jako krok, który mogę rzucić do tego wątku, mogę później kontynuować kolejne. mam też wątki, w Cloudzie mam porobione projekty swoje projekty nie będę już wam pokazywał, ale jest wiele jest super, bo w każdym projekcie jest pamiętacie, że każdy projekt ma pamięć i możecie napisać aktualnie pamięć projektu i on ostatni wątek zaktualizuje, wchodzicie, zakładacie nowy wątek i musicie ten wątek przenieść do tego projektu znowu i on już będzie ten nowy wątek na całą pamięć projektu więc jest dużo łatwiej też mi to robić A jeżeli chodzi o kursor, to staramy się wysyłać z cloud'a do cloud'a w kursorze. Tutaj na przykład widzę, że przygotowanie... Napuszczą mi dwóch na siebie. Cloud w kursorze jest developerem, a cloud w tym. Ten cloud'owy jest moim project managerem, product ownerem. I nie pisze, że wysyłam do kursora, tylko pisze, że wyślemy to do deva. i odwrotnie, jak zapytania dawa z Project Managera. W takim trybie ostatnio to mi się sprawdza i jest bardzo szybko. Dobra, zobaczymy co tutaj. Location Code, prawdopodobnie. Dobra, naprawiam skrypt. Sprawdzam dokumentację, czy tutaj to po prostu... Ale widzicie, to jest chyba ten inny skrót, niż ja miałem, bo to jest data for sale, a tam mieliśmy jeszcze... Tutaj mam po prostu w colaby chyba nie zmienię, niepodmieniony skrót. Tamten był z... z api senuto. Dobra, zrobimy tak. Ja się trochę zgubię na live, ale już tu zacznę to porządkować. Zróbmy to do końca i zaraz sobie wstawię od razu tutaj. Zrobimy tak. Wstawię dwa skrypty i później Wam to wszystko wyślę. Albo z Mateuszem pomyślę, jak to wysłać. Jeszcze te skrypty poprawione i zrobione tutaj. To jest markdown C2, czyli to będzie data4seo. I zobaczcie, już mamy serp urls i mamy data4seo ten jeden skrypt. Zaraz ja sobie dodam obrazu. Na grób powyżej, cnuto.api +.forje. I zaraz wynajdę ten drugi skrypt i go sobie tutaj zrobimy doda i przetestujemy oba. Dobra, wróćmy do tego skryptu i do tego co nam zrobił Cloud. Dobra, dabak robimy, czyli zobaczymy co to się pokaże. No, no właśnie, to już było to... Południłem ten sam błąd, to zrobiłem na lekcji. Nie zaktualizowałem skryptu. Czekajcie, ja go sobie poszukam. Bink nie obsługuję. To nawet nie mam co tutaj pisać, zmienimy skrypt. Tylko szukam, czekajcie. Dobra. To jest ten skryt, o którym mówiliśmy. On jest w Lekki, a ja miałem w kolabie z tym, który miałem podczas nagrywania. Dobra. Zapisuję. O, widzicie, to jest wszystko to jest, dlatego nie mogę znaleźć. Maksymalna liczba ureli do zebrania. Mamy 12, ale lubimy sobie na przykład tam jest 8. Senoto API jest wczytany. Nie mamy. Prosówki. Możesz tutaj poczekać. Teraz go sobie tutaj wczytam. Wiecie co? Żeby nie pokazywać, kucze, bo ja mam tylko kuczki. Enterprise'owy, to na chwilę wyłączę ekran, uzasadnianie. Nie wiem, jak inaczej to rozwiązać. Panie Cieńczyk, tylko? Zobaczymy tylko, czy to poszło, żebym wiedział, czy ten kurc działań. Gdybym, jeszcze moment. Ale już wiem, że będziemy mieli swoją rzecz do zrobienia interskrypcia, wszystko połowę pokazać. Ostatni test... Dobra. Ja zostawiam ekran. Zasłuję za zamieszanie. Dobra. Zaopniemy oczy. Tak. Akurat ten klucz, to nie... Nie da się go zastąpić, bo to jest przepisane specjalne. Dobra. Tak, dobra, jeszcze odpowiednie pytania. Paweł Pawlak, elementy dodaje w skrypcie. Już przestałem ten type string, żeby to sobie uzupełniać jako... To jest tylko wypełnienie. Idę po nasz... Akurat to węczę w oskorę. Czy tam dalej jeszcze proszę uwagi? Jest to Bartek? Tak, ja słyszałem, ale nigdy nie mam czasu do tego usiąść. No ale rzeczywiście potrzeby kursów, nie wiem co zrobić. Ok, i teraz zobaczcie, to jest ten skrypt, który macie załączony do lekcji, ten, który jest przypisany na dwa. Google AdCle zawsze pobiera top 7 wyników z Google, próbuje 3 z Binga i tak, tak, tak. I teraz nie zadziałał mi klucz Zenuto, a i tak pobrał mi z Google, jest fallback w tym skrypcie, pobrał mi za pomocą Craft4AI. Zresztą możemy przetestować, ale najpierw sobie uruchomimy cały skrypt. Z Google, z API Senu to pobrało 8. Tu już mamy bazę z Binga, widzicie, tak jak mówiłem, idzie tu Cloud4AI i to już nie ma już tych problemów z tym, że nie obsługuje jakiegoś języka. Po prostu wchodzi na stronę dla danego języka i tyle. No i tu jeszcze z tag, tag, go. I tak, finalnie zebrano 8 unikalnych, 8 URLs. Dlaczego dopisało 8? Bo mu 8 dałem w konfiguracji. No 8 wystarczy. Gdzieś to w tym było. Zgubiłem. To jest 8, jeżeli to zwiększycie, to pobierze zawsze 7 z Google za pomocą API, ale możecie też zmienić, możemy zmienić ten stosunek, tylko tutaj to jest hardcoded, tutaj jest keyword, tutaj pewnie mamy gdzieś ten limit. Może nie w tym. Ktoś się to przestwarzał. To, co mówiłem jeszcze, macie też zabezpieczenie, gdyby się nutizował. Zepsujmy senudo. Apiki. I zobaczycie co się stanie. Idzie go z Google'a. No i z Google'a, z tą pomocą Crawford AI. I zaraz sobie zobaczymy co to są za url. Cep urls. I czekajcie, bo tu coś się dzieje na czacie. To pobrało Ci ze stronami do przekierowania. Zobaczymy, jak Michał. Pobrało Ci ze przekierowaniem Binga, ale zobaczę, jak u nas jest. Tak, też mamy to przekierowanie. Nie wiem czy to obsłuży ten nasz... Tu mamy kortyzę pewnie... Nie, tylko jest... Stare, to jest z tego starego skryptu, dobra. To to może było zrobić. I sprawdzić dlaczego serp... Pan jest taki okrojony, tylko tu trzy. Dobra. Zamykam, wracamy do naszego skrytu. Tyle problemów na samym początku, słuchajcie, nie wiem, spróbuję to zrobić, a jak nie, to się przygotuję, nagram Wam odcinek o tym po prostu specjalnie. To było to. Tu mamy problemy takie. Pierwszy problem. Ten skrypt... Czekajcie. Ten skrypt... Nie zapisuję ureni z punktu Widzimy tylko ping. Unale z ping są przekierowaniami. Czy chce tylko listę URL? Każdy znowu w jednym z tym. I tyle. Liczymy, że tutaj nam model poprawi ten skrypt. zaktualizuje go, no jeśli Mateuszowi, więc będziecie mogli go popraść w lekcji też. Tak, znaczy te przekierowania jakby zabezpiecza się Bing, ale ja bym, nie wiem, jak chyba się Cloud4AI, więc wolałbym chyba jednak dostać, jakby to wszystko by było po Bożemu, to trzeba by było, żeby te listy uredni były związane, żeby znacznie doskroszone, ale listy tych stron. Dobra, ja wiem, że nie działa Google, nie działa, bo specjalnie dyptułem. Prawdopodobnie zdarzyło się tak, że jak było ze noty włączone, to ta lista Aureli się zapisywała, a Falbach nie było dobra zapisywania. Ale ja to chcę poprawić, żebyście mogli korzystać bez scenu z tego aspektu. A API, jeżeli macie sen, to pewnie gdzieś tam jest to wygenerowane. Albo połączcie sobie po prostu tutaj data for software do samego w ogóle. jeżeli chcecie to ja mogę Wam przepiąć z tamtego skryptu DataForceo tutaj ale to ja nie wiem, ilu z Was będzie na przykład korzystało z DataForceo, a ilu będzie łatwiej wziąć kurs CEMUTO dobra mamy zapisane nie będę już czytał wszystkiego, bo trochę czasu tracę na te wszystkie rzeczy ale chciałbym, żebyśmy zrobili i to zapisywanie, przekazywanie i doszli do tych enci nieszczęsnych. Nie, nie dostaliśmy wyników. Dobra. Dwa wyniki, pięć. A, dobra, dwa unikalne. Czyli źródła. Bing 3, tak, tak, dowództwo. Zastastrzegam, dlaczego nie zadziałało nam Google. Może blokuje nas przez Kaufer.ai, ale chciałbym jeszcze zobaczyć ten klik razem. Jak uratować, jak uratować. Jest ok, nie? Tylko jeszcze wybierzmy ten Google. Dziękuję bardzo. robią nam jakiś debug, żeby nam wyświetlić, co się dzieje. A jak nie, to słuchajcie, zostaniemy na tych pięciu, bo chciałbym iść dalej, a wy sobie to przerobicie. Ja sobie tylko zapisuję skrypty do do wrzucenia, nie? To nazywamy to repozytorium, do plików po prostu w kursie. Ten poprawiony wam wrzucę też. Jeszcze dajmy sobie chwilę, zobaczmy, co tam się może wyrazić. Bo wsteczno zimno? Minus 25 u mnie dzisiaj w nocy. Druga noc. Tak zagrają po prostu. Znajdźmy się w produku, jak widzicie. Ktoś już tam wymyślił? Dobra, słuchajcie. Dobra, jakiś fallback chyba. 3 strategie. I 3 strategia zadziałała, mamy 12 wyników z Google. Dobra, to mamy. By była blokada. Przejrzę sobie plik. Tutaj dostaniecie też na liście, jak spolicie tęskut, że będzie jakiś problem, to dostaniecie podłąd HTML z tych zepów. Z trzech. Tak, do trzech. Tak, i mamy 8 ustawiony limit, więc mamy 8 URL. Cieszę się, że możemy przejść dalej. To jest nasz plik wejściowy. W sumie skupuję tą ścieżkę i teraz to, co Michał mówiliśmy, przechodzimy do następnego kroku. Czyli to był ten pierwszy, mamy słowo kluczowe, input, wyjście, to mamy listę URL. I to jest w tym pliku. to teraz bierzemy skąd ten Extraction. I tutaj ja robiłem wiele, pokazywałem jak to popierać, natomiast też był taki mój autorski skrypt, który widzieliście naprawdę. On najlepiej według mnie pobiera, tylko że on pobiera pojedyncze URL, bo to była kwestia demo. Więc ja stworzyłem już taki Extractor Batch na potrzeby następnych lekcji, czyli do niego tak naprawdę wrzucałem albo list, to tak jest, Mam tutaj input file, jest ten. I możesz to na stałe, Michał, zapisać, czyli to krok pierwszy masz w Colabie tamtą komórkę, w krok uzuwitą i tak by po kolei kaskadowo odpalasz. To jest to właśnie o czym mówimy. Z Colabie da się to zrobić i nawet na plikach, tylko musisz odpalać, wtedy nie dajesz rady spalić się i x projektów. Słowo kluczowe musi przejść do końca, żeby później to zrobić. Ale mi się wydaje, że to też jest fajne, że ktoś nie krytykuje to o artykuł udzielniany. I tutaj masz output file, czyli znowu będziemy, gdzie ten kontent zostanie zapisany. Jest taka CSV też, bo to w co pamiętanie można gdzieś tam zaotworzyć i do rekrystatora wrzucić na przykład. Nie będę czekał, puszczamy to, bo to musi nam się odpalić, więc spadamy do drugiego skryptu. Zmów Chrome for AI to jest 8 sztuk, fakt, że mogą to trochę ograniczyć. I widzieliście, co robią mój skrót, on sam decyduje, które bloki tekstu trzeba zostawić, czyli keep, a które skip, które nie pasują do naszego kontentu, do głównego pytania. Zaraz sobie też podejrzymy ten klink, żebyśmy wiedzieli, że wszystko jest ok. Słuchajcie, niech on sobie to się pobiera i teraz przechodzimy do kolejnego kroku, czyli numer 3, tak? Czekajcie, że ja wam nie pisałem gdzieś... We Wrocławiu tylko minus 1? Nie. Zmiejmy się. Dobra. Jeszcze się z pana miałem stworzyć tego pipeline i przekazać te wszystkie skrypty. To jest dobry pomysł później. Osobną zrobić, jak już. Albo column wam udostępnić? Jeszcze pomyślę, dobra? dobra, czyszczenie contentu i tutaj znowu musimy mieć wejście. I zobacz, Michał, ja też sobie przygotowałem. Tylko output będziemy musieli zapisać. To jest input na czyszczeniu, nie? A czyszczeń, a ten zaawansowany kończy w ten sposób, to jest ten sam plik, nie? Script content all. Więc on na czyszczeniu contentu wchodzi nam na input, Podaję ten plik, to nam to wyczyśnię. Zgadza się, zgadza się. Tylko zapiszmy sobie wyczyszczone, nie już z kortyzolem. I tutaj też... O kurde, czekajcie. Tutaj nam nie było potrzebne, ale tu już jest nam potrzebne, są wykluczone. Dlaczego? To też przypominam, że to czyszczenie sprawdza nam podobieństwo embeddingowo bloków tekstu do głównego zapytania. Zobaczymy, jak tam nasz blacz. Jeszcze idzie. 5/8, 6/8, 7/8. Zapisano. Dobra. Podejrzyjmy sobie to. Script content all. Jak widzicie, tu są rzeczy, tylko zamknij tę stronę, jak leczyć, to jest dużo fajnych tekstów. Shared this page, to wiadomo, że to wyleci. Tutaj jest ten kontent przemieszczony, są te bloki tekstów, każda strona jest oddzielona separatorem. Przechodzimy teraz do 6.3. To był drugi krok, teraz trzeci testowanie. Zobaczmy sobie ustawienia tego testowania. Tutaj macie też Trisholt, czyli ten próg decyzyjności, to jest Simility Score, który jest podobieństwa, który jest np. niepodobny. Tutaj 0.4 i 0.85, więc bardziej podobne. Pomiędzy tymi też się znajdą. Przepraszam, i tutaj różne zabezpieczenia odnośnie długości, to możecie sobie przejrzeć, nie mamy za bardzo czasu, ja to odpalam. Lekcje były na ten temat, więc możecie się do tego cofnąć. I ambedingi bardzo szybko pójdą, więc on teraz, to jeszcze raz mówię, jakby wyczyszcza nam, i zrobi nam czyszczenie. Zobaczcie, zostawił tylko takie bloki, które dotyczą bezpośrednio. Wiadomo, że to jest większe, więcej tego treści to jest tylko placeholder, więc coś nam się jeszcze zostało. Ale jest bardzo dużo o blokach, jest jakiś hazard. Nie wiem dlaczego skrót mnie złapał, ale dobra, bo ja bym chciał przyjść do NC, dlatego że... Dobrze, zróbmy to jeszcze. Znowu nie chcę Wam zostawiać coś, co będzie tam przepuszczało zły kątem. Jeśli muszę być znowu do klubu. ... To nie powinien hazardu przepuścić, jest w ogóle niepodobny do... ...kory drzewa, więc... No, czy to chyba nie był hazard, to był trunk, łunc, czyli jakby... Tak? Przepraszam, ale... No tak, nie, ale... Znaczy to szczepiono chyba z jakiejś... To to na skrycie jest. No tak, tak, tak, wiem, tylko... A, bo dobra, czekaj. Ale to w takim razie też bym mógł wybić wadą wiedzy naszą. O, to właśnie. O, czekaj, nie, to nie jest suburban i suburban. Dobra, zaśmiewam, po prostu chwyciłem jedno słowo i od razu... Tak, bo muszę trochę trochę, trochę trochę, trochę trochę. Tylko chodzi mi o to, że tutaj też były jakieś kukisy, ale już teraz nie widzę. Jak się jedno coś było chyba. Dobra, bo to jest tylko taki podłąd, nie? Dobra, załóżmy, że jest dobrze. Nie, no dobra, okej. Dzięki, że zauważyłeś, bo niepotrzebne jest to, żebyśmy chciał na to dopierania tego. Dobra. I teraz tak, to nam przy scenie zapisało... Do pliku, zaraz gdzieś tu jest ten plik. Tak, konfiguracja będzie. Czyli output mamy tutaj. Idziemy do ANSI. Tutaj jest jeszcze... To nie. I ANSI mamy nerspacing, możemy wypróbować. Tak, możemy na to wypróbować. A tutaj możemy też, później jeszcze raz przejdziemy ten skrypt z elementów. Ale zróbmy ten spacy, bo to był problem. Kto miał ten problem na Discordzie? Rafał. Rafał, dotarliśmy do Ciebie w końcu. A. Nie, nie ma problemu z tym contentem po angielsku. Znaczy jest problem, jak będziemy nery wyciągnąć. bo jest polski model, ale gdybyśmy to wrzucali do LMA i wyciągali NC, to tam nie będzie problemu. Natomiast tutaj może być problem. Dobrze, że zauważyłeś to. No ale zobaczmy, pójdźmy to. Pójdźmy się na błędach, zobaczmy jakie NC nam wyciągnie. Gdzie tu mamy? konfigurację. Żebym trochę się przygotował, jakbym powiedział, że tak będziemy robić, to pewnie bym to ogarnął. To jest tekst. Dobra. Zrobimy tak. Zrobimy sobie Nervs.pc.prom.pile Czyli poddamy mu nasz plik, który by wynikał z czyszczenia. Czyli na pewno sobie to skopiuję, jedna osoba sam tego robił, bo po co? Powiedziałem, że to już powiedziałeś, ja to nie ogarnął, to ja chciałem. Przerób, skrypt, tak, żeby czytał z pliku. I tam było output z czystania. Trochę zabawię jest z tym, dlatego też te bazy danych, to czytało ułożenie pod bazę danych, ale też jak to teraz zrobimy, to później jest łatwiej, ale samo ułożenie na początku jest trochę trochę problemu, czasem trochę napracować, coś nie wyjdzie, coś poprawiać, ale po iluś tam przejściach całego cyklu macie już działający ten twarzy, bo jakby ilość rzeczy, które może się wyjedniczyć po drodze, to jest niesamowita. Ja już nawet nie precyzowałem, czy to z pliku, czy tam oddzielone, po prostu ten był content podawany w skrypcie, tej zwykłej wersji, o w tej, nie? Tam na dole, gdzie cały kontent trzeba było wrócić, ale my chcemy, żeby połączyć to z naszym pipeline'em, czyli ten ostatni nasz krok, żeby on czytał z czystania. Dobra. Coś na mnie poszło? Tak myślałem, to się znajduje content. Nie zapisałem. Kotent clean, przepraszam, widzicie? Już skopiowałem nazwę z innego przecież kropu z ekstrakcji danych. Nie wiem, czy te poranne spotkania się z Prawypą. To są tyle takich małych... Dobra, próbuję jeszcze raz, nie musisz pojść. Widzę, że jest problem z tym konceptem. Ja też uważam, że na R będzie dokładniejszy, ten Spacey, w sensie na R, czy MTDs, niż model może zrobić to, co teraz ma nagranie, tutaj musimy to uszczelnić. Koncept daje temu modelowi Spacey dość duże pole do podpisu. I tutaj rozwiążmy ten temat, bo to jest ten Rafała problem. To jest dokładnie to, co... Znaczy są inne encje, które nie są encjami, ale dokładnie ten sam problem. Wpłatnie, że go zrobimy. Daniel, output squarey fanout to potem, w którym kroku jest w sumie wykorzystywany? Czy to jest na zasadzie informacji powożnej, a nie docelowej dla konkretnego tekstu? Output squarey fanout to będziemy robić outline, a na podstawie outline, czyli spis treści, czyli będziemy mieć hierarchie na wózku za pomocą korekonałów, robić z tych mikro, a później będziemy na podstawie tego tworzyć treści. Ponieważ ja nie robię treści całej, tylko robię ją po sekcjach i pokażę wam super sposób w popłynaju na wysyłanie "conversation ID", czyli wątku, czyli trochę tak jakby przez API otrzymujecie, jakby to był czap. On jakby nie powtarza informacji, on już wie, co napisał. i wtedy fajnie się robi to systeopocewnie. To było niemożliwe, dopóki się nie pojawiły modele designowe. Nikt jeszcze nie działał, więc listowaliśmy fragmenty z outline'a i części tego tekstu, i trzeba było je doduplikować, to też to będziemy robić. Także query fanout jest bardzo ważny. Query fanout to jest nasza, może nie cała 1:1 struktura, ale na podstawie tego zrobimy sobie strukturę, artykuł, a knowledge graph, graf wiedzy to jest wszystko, co jest potrzebne, żeby to napisać. I finalnie, bo już to są lekcje, które ja już mam rozpisane i będę nie nagrywał, finalnie rozpisany outline, czyli spis treści, będzie miał przyporządkowane te treści, te ENCE, fakty i inne rzeczy z grafów wiedzy. I wtedy każda sekcja będzie miała super brief, żeby nie powtarzać się i każda będzie miała dokładnie to, co powinna mieć. I to jest najfajniejsze w tym wszystkim, że macie naprawdę dobrze wykorzystane enzje w odpowiednich miejscach, a nie w sianer przypadkowo po całej artykule. Dobra, wracam do tego. Ja się z tym problemem zmierzałem kiedyś z tym konceptem i są dwie rzeczy. Tutaj Rafał też słusznie zauważył, że ten model być może źle to robi. Mamy tutaj takie modele. Ja bym najpierw wymyślał, żebyśmy zmienili model, nie? I zobaczymy, co będzie. Oczywiście ja się nie będę męczył. Szukał ręcznie, co zrobi za was. Knał, na przykład. Ja wrzucam skrypt, podaję mu output. Skopujemy filmiki z komórki. I piszę problem. I też się zastanawiam, czy nam jest potrzebna encja z konceptem. Koncept daje nam wszystkim tym modelom duże pole do podpisy. On się skupił chyba na innych anciach, ale najpierw przetestujmy, zobaczymy, co nam Cloud powie. Może jakiś inny model nam da, albo wypróbujemy parę zaraz. Ja to, co jeszcze zrobiłem... na przygotowaniu do którejś lekcji, dostaję te nery i wrzucam je do walidacji przez LN. W sensie, żeby LN nie wymyślał, ale żeby wyrzucił śmieci i dopisał relacje, których brakuje. Czasami to jest bardzo trudne zazdrowienie. i wtedy, jeżeli macie tą zasadę, że przynajmniej ENCY musi mieć jedną relację, bo generalnie nie jest ENCY, w czym nie ma relacji. Jordan, już Ci mówię, to było przed chwilą. To były teniusowe do czułta Polski, bo ogólnie problem jest z polskim językiem, na angielskim języku nie ma już takich problemów, ja zawsze znowu to robiłem na angielskim. To są te modele tutaj, nie? Core News, Medium, Large, Small. Zgoczymy, co nam powie jeszcze. Ok, mam pierwszą rzecz. Ja źle zmapowałem etykiety, czyli ja etykiety zmapowałem zgodnie z innymi modelami angielskimi, a PRC is po prostu słaby. Pugging face, tego nie widziałem, czarnik Herbert Beisner, taki jest proponowany. Ja wstawię, zobaczymy sobie co nam wyjdzie i też aktualnie ten skrypt. A, dobra, widzicie, to co mówiłem, musimy zainstalować jeszcze. Tak, ja robię, musicie sobie wyobrazić, macie konfigurację, często też języka, mówię teraz do Ciebie, tam jest konfiguracja języka i tak samo dla API możecie, nie tylko angielski, ale dużo innych języków robić. generalnie robiłem nawet i cerulice, i niskie, wszystko sprawdza czy dane API ma odpowiedź na ten link, ale widzicie, z URL pewnie byśmy już pobrali, tutaj będzie problem z nerami, bo to trzeba wziąć dla każdego języka i teraz widzimy, że jeszcze etykiety. Shift+Enter, w Colabie nie jest. Przeniesie, nie wiem, do nowej linii, tylko odpalenie skryptu. Dobra, niecham to... Wczoraj bym musiał uruchomić, bo nie mogę go zatrzymać. Czasem tak Colab mam, że się nie da zatrzymać. Właściwie skupiuję sobie ten nowy skrypt na RAM-ie. W opisie skryptu macie model, i teraz ten corneus latch i ten jest tylko tak naprawdę fallbackiem i poprawione mapowanie dobra, to tylko teraz jeszcze ta instalacja raz wcześniej nie poszło z transformers to się skończy puszczamy od razu nery i powinniśmy zobaczyć zupełnie inne wyniki Dobra, czyli jeszcze raz, etykiety miałem źle przypisane, czyli rodzaj ENCI, tam był PERSON i tak dalej, trzeba sprawdzać etykiety danych modelu jakie ma. I tu popełniłem błąd, bo miałem z angielskich modeli, na polskie, a druga rzecz to model. Instaluje. Ja dawno jeszcze odnośnie Ciebie, dawno nie robiłem tekstów po polsku, muszę się przyznać. Ale miałem tam, generowałem bardzo dobrze te akcje, więc musiałem trochę inaczej sklepnieć. Czyli pewnie te etykiety były dostosowane. Kto nam się instaluje? Czy to nie ma jakichś problemów? Nie, to modele trochę zajmują. A już teraz on będzie do końca. Dobra, jeszcze będzie na... Dobra, słuchajcie, ja lubimy tak. A, dobra, Jordan, już wiem, o co ci chodzi. Tak, ja mam tak, że każdy skrypt pobiera z bazy danych wiersz, w sensie artykuł, który ma status zbuduj, nie, na przykład pobierz URL. i jeżeli ja pobiorę URL dla niego, to zmieniam od razu w tym samym skrypcie status na następny, a następny jest ekstraktuj content. W ten sposób ja mogę puścić w colabie 100 razy pobieranie URL dla 100 tekstów. Jak się skończy, mogę pójść dalej i tam mogę od razu 100 robić następny krok. Więc jakby tutaj pracuję na statusach i zapisuję po prostu status. I taki skrypt, jeżeli będzie uruchomiony i nie będzie miał swojego statusu, nie znajdzie w takiej bazie danych artykuł, które potrzebują zrobienia w której, po prostu się zatrzyma i pójdzie dalej. Mogę sobie odpalać te skrypty w różnej kolejności, zależy na jakim etapie mam różne artykuły. Jeżeli jeden artykuł jest na jednym statusie, w sensie na początkowym, a drugi jest na końcu, to mogę sobie na przykład też niezależnie odpalać. Mogę też puścić dwa, trzy kolaby i... No, uważać, ale finalnie w enterprise'ie mamy to tak zrobione, że to działa na cron'a, w podobny sposób. Czyli w ogóle nie w kolabie, tylko te skrypty są odpalane. Podobne skrypty, zbudowano w podobny sposób, tylko już przepisane przez deweloperów. i Chrome sprawdza potrzeby wykonania jakiegoś procesu i one są odpalane tak naprawdę co minutę, co dwie minuty, więc ta produkcja wtedy idzie bardzo, bardzo szybko. Więc tak to jest zrobione w tym planie, takim prawdziwym developerskim. My tylko widzimy statusy, jak one się zmieniają dla danego typu. Jeżeli coś się zatchnie, to widzimy, że error jest, to możemy to zresantować już w CMS-ie, więc tak to mamy ubudowane. Ja myślę, że na następnym... Na następnym... Dobra, zaraz wrócę. Może na następnym, na jak Wam pokażę, jak to wygląda... Jak wygląda połączanie Colaba z CMS-em. Czyli Colab mi produkuje np. treści, a w CMS-ie sobie je oglądam i kopiuję, zrestatuję statusy. To musi się dać, że będzie ciekawe, żebyście mogli sobie to wyobrazić. Dobra. Cegłami, organizacja. Niektóre dobrze zrobiły, ale to tylko te z englijskiego. To nie jest organizacja. To nie jest duże. Likary. Dobra. Nie poddajemy się, bo wyniki są bardzo własne. Takim... No, ten Herbert Bates nie daje rady. Dobra, powiedzcie mi, ja też muszę za 8 minut uciekać, mam spotkania dzisiaj, bo został z Wami dłużej, ale bym chciał ten NER doprowadzić do końca. Czy Was interesuje bardziej rozwiązanie tego problemu z tym NER-em, żeby na pojedynczym skrypcie robi to dobrze, czy chcielibyście na przykład przygotowy skrypt, który ja mam, ja go sobie wyjmę, wyłączę obsługę bazy i zrobię obsługę plików i możemy go sobie wtedy omówić? Nie chciałbym też tak, żebyśmy zresztowali z tym problemem, bo na dzień dobry teraz mamy problemy z modelami dla tego tematu. Oczywiście na kortyzolu wszystko działa pięknie, ale to jest problem. Ja bym się obowiązujący ogólnie, żebyście wiedzieli z czego to się bierze. ewentualnie możemy zrobić sobie zawody. Kto pierwszy rozwiąże ten problem? To chwilę, trzeba posiedzieć, potestować różne wersje modeli. Akurat na tym wskresie. Dobra, to są bardzo fajne pytania. Ja mam po prostu skrypt, który pobiera mi, unbendinguje mi, do bazy też zapisuje w tabeli wektory dla słowa kluczowego, dla hidingki. Ja sobie to porównuję. Jeżeli dochodzą nowe systemu aktykuły, to one są porównywane z tymi istniejącymi, każdy jeden. ale to bardzo szybko na trendingach idzie. Mam zbudowany tego CMS, ale to jest taki botanest na potrzeby takich pojedynczych generacji, bo na przykład u nas bardzo proszę przychodzi klient i chce mnie jeszcze, nie wiem, no zdarza się, że mamy nawet po prostu 200 tekstów, jakiś opisu kategorii, opisu produktów czy opisu blogowych, to my się tym nie przejmujemy, nie? my wysyłamy tylko treści, ja nie muszę sobie sobie wyrażać. Ale ja Ci pokażę, bo ja mogę pokażę, jak ja to zrobiłem. Też możemy omówić logikę działania takich skryptów. Czyli to, co było na przykład z query fan-out'a trafia do... ... ... ... ... ... ... ... ... ... Może nie tak, że muszę... Spróbujmy jeszcze tego, co nam zaproponuje Cloud, a później ja sobie wezmę ten skrypt, który robiłem, przerobię go. On prawdopodobnie tu jest w kolabie. Na którym należy zaczniemy cały proces do podbrania URL do stworzenia artykułu opisu kategorii produktów? Część będziemy mieć już zrobioną dzisiaj, myślę że za dwa tygodnie raczej ten live. Możemy wtedy zrobić taki live, żeby zamknąć cały proces, a później będziemy chcieli, żebyście zrobili samodzielnie fragmenty i później grupy. To by było dobrze. Masz własny CMS? Tak, my mamy dużo CMS-ów, do opisu produktów z CMS, do opisu kategorii z CMS, do blogów jest to spięte, pewnie wiem, bo to też jest na API, dużo tych informacji jest. Dobrze, to umówmy się, że to, jakbyś był mógł, napisać to na Discordzie, żeby nam to nie przepadło. to byśmy na następnym live omówili sobie te CMS-ing, poprzerabiali sobie tak. Wracam do NER-a. Ostatnią próbę robię, obliczę, z tym skupmy i zaraz pokażę Wam ten swój, bo on był. Ten jest Transformer. Zrobimy to. Dziękuję. weryfikatora i uzupełniania. Tylko poczekam na tu bibliotekę jeszcze. Dobra, niech sobie to leci. Ja sobie zajrzę do tego finalowego skryptu. Dobra, hybrydowy. Tak, bo ja go używałem też, żeby przygotowywać ten pipeline, który później robiłem, grafy wiedzy. I to jest tak, ja Wam tutaj przybliżę, to wszystko jest opisane. Tego skrypty nie macie w lekcji, bo to był webinar, więc ja go podepnę. Tylko razem z tymi, które dzisiaj poprawialiśmy. Ten gotowy palet, może zrobię do nerów. To jest tak. Pierwszy krok. Space i Transformers to są po prostu kandydaci, to nie używamy żadnego API, to co tu robiliśmy. Później mamy krowy drugi, w tym skrócie są blacklisty i pewne zasady, czego nie powinno być w tych neraf. I pierwsze później połączenie z elementem, czyli też element prosimy, żeby wyciągnął ency. No i później łączymy to wszystko i usuwanie wysp. Wyspa to jest nie tyle co samodzielna encja, bo czasami są encje, które są nie... one są olszman, czyli osierocone i one nam nie są potrzebne, bo one jeżeli nie mają relacji, to nie są potrzebne, więc nie też wadzą, ale też jest wyspa, to jest parę... jedna jest olszman i druga ma relacje do dwóch. Nie, to było gdzieś. Na grafie wiedzy. Na lekcji grafie wiedzy na koniec pokazuje takie schematy. Nie wiem, czy to widzieliście. I tam jest właśnie ta wyspa i tak dalej. To ten skrypt robi tak, żeby tych wysp i osieroconych było te mnie. Tutaj dobra... Wizelingowy jest 5.2. Dobra, tutaj sobie zaraz jeszcze niech on nam tam czyta. Przyciskuje nasze słowo. Przygotuję ten drugi skryt do upalania. Jakbym wam pokażę, gdzie to działa. Tylko tutaj musi pokazać jeszcze 20, nie? Z tego pliku. I output is entity station, czyli z toblica. Co się zrobiło z poprzedniego? Zobaczymy, co to jest. Entity station, 0, 0, 0. Dobra, nie ma co drążyć tutaj, ja też pewnie nie zostawię, zrobię z tym pojedynczym nerem, jakby niehybrydowy też, ale tuż na spokojnie. I teraz przejdźmy do tego hybrydowego, to o czym mówiliśmy od chwilki. Dobrze. Local network section. I tu też używamy Policor News i Spacey da nam 20 kandydatów. To jest Transformers. Właśnie wszystko pobrać. Jeżeli tu space i dobrze zadziała i transformer, to przeniosę do tego pojedynczego i wtedy będziemy mieli dwa skrypty, jeden będzie bez LL, a drugi będzie z LL. Dobra, drugi stage, profiltering. Widzicie, jest trochę trochę śmieci. Teraz LNM to nam zwaliduje. Zobaczę tylko jedną rzecz, bo powinniśmy mieć prompt, w którym powinniśmy opisać dokładnie, co to są te end'ie. Żeby model dobrze mógł to znalizować, nie? Prąd go. Tak, jest ekspertem, NER, masz tyle kandydatów, wybierz maksymalnie tyle, bo mamy, możemy to ustawić. Zasady wyboru ENCIE. Ale to robiłem trochę też pod ten kortyzol, jak to robiłem, ale to jest jako przykład. Typy "encji" tutaj mamy, typy "relacji" i format "wejścia". I zobaczcie, wybierz tylko najważniejszym cyzla tematu. Space Transformers daje nam kandydatów, ale nie dość, że je weryfikuje, to jeszcze może dorobić swoje. Ktoś nam to zrobiło. Mieliśmy wyspy, o których mówiłem, opatrunek na ranę, usunięcie uszkodzonej kory, to tak jakby to raczej tematy niż NC. No i dobra. I NC mamy. Proces. Uszkodzenie kory, usunięcie uszkodzonej kory, zamykanie rany, zobaczcie, dobrze to wygląda, rozpad drewna. Produkt, opatrunek na ranę, pewnie jest na drzewo. preparat typu farba do drzew stosowany, mamy opis, mamy arborysta certyfikowany, specjalista oceniający byś wyszczędnictwo drzewa itd., symptom, to znaczy, ency są fajne, topik, rana pnia, kora, cambium, grzyb, gróbka cieśla, owady, których obecność może wskazywać na problem z obdatą chorą, zagrożenie, jakby mamy entikis jakbyśmy sobie zbudowali jeszcze gra w wiedzy sobie sobie wizualizację, bo powinno to tutaj być to było też w ostatnich odcinkach i ja sobie to dobiorę Dobra, inny będzie tutaj. Już Wam to odpokazuję. I tu są nasze MC, nie? Mamy wszystkie powiązania, jak widzicie. No to wizualizacja jest tylko po to, żebyśmy nie zobaczyli, czy nie ma wysp samotnych, czy nie ma jakichś orfan. Także tak to finalnie wygląda i na ten sposób to oglądaję. Nie wiem, czy jest sens więcej omawiać, co w nim jest. Przepraszam, czasami myślę, to nie potrafię mówić. Tu ten finałowy skryt. Macie tutaj opis wszystkiego i też w odwócie macie informację, co po kolei robi. więc doszliśmy do tego momentu i mamy już fajną enzine. I zamknie to chyba tym. Widzimy z Mateuszem przygotować Wam podsumowanie tego jako jakiś plik i tam będą wymienione te do pobrania skrytki wszystkich. I następnym tygodniu możemy na przykład, bo będą teraz lekcje zgenerowania contentu, to w następnym tygodniu możemy kontynuować ten pipeline, czyli skończyliśmy na EMC, robimy sobie jeszcze gra wiedzy razem, gdzieś się to zadziałało, to jest gotowe, to już było po lekcjach i pójdziemy później przed generowanie, może zrobimy sobie w ten sposób, zbudujemy te skrypty, będziemy tylko dokładać, a na koniec zrobimy sobie szybkie polewa z innym tematem. Dobra, macie jeszcze jakieś pytania dzisiaj? Słuchajcie, jest Discord? Wyście coś chcieli jeszcze odnośnie dzisiaj? O, dobra. Kiedy w Collabie do CSV, kiedy do JSON? To jest twój wybór. Ja preferuję JSON, bo masz tablicę, które mają pod tablicy, mogą być zagnieżdżone, łatwo to się czyta i łatwo to też przekazywać do LM-ów, gdziekolwiek indziej. Na tym CSV-ka zawsze będzie miała kolumny, więc da się to też zrobić, ale zawsze trzeba będzie w tej jednej kolumnie poprzedzającej zostawiać puste albo... No zawsze jest sprawa, bo trzeba wyjaśniać dokładnie. A jak model widzi Jsona, on sam sobie od razu przerabia jego strukturę, ja wiem dokładnie co i jak. Ja preferuję Json. Ale jeżeli pracujecie z plikami, chociaż nie możeciem, Json też jest pleksem tylko w postaci tablicy. Więc nie wiem. Może niektóre systemy wymagają CSV-ki. Podsumuję. Mamy set urls, mamy content extraction, batch, ten taki, to będzie ten skrypt, który pobiera z pliku urlę, je przeekstruktuje, później mamy czyszczenie, tam wiem, że coś jeszcze muszę zależeć, zobaczyć z tymi quizami, to widziałem, ale sprawdzę, później mamy i faktycznie jest to lekcja bardzo prosta, więc to też jest, bo to jest nam potrzebne do grafów wiedzy. Ale jest graf wiedzy, teraz jak generowałem to tylko osobno graf wiedzy, a osobno N, więc wykorzystam tylko do N. I za tydzień spotykamy się znowu. Jak będzie potrzeba, to piszcie, zrobimy jeszcze jakieś spotkanie na tygodniu, nie musi być tylko jedno, gdybyście mieli jakieś problemy. No i zapraszam, pójdziemy teraz na sąd, ale chciałem nie przerać. Dobra. Mateusza nie ma, więc ja Was muszę pożegnać. Dzięki. Korki za małe problemy. Mam nadzieję, że z tym razem pójdziemy trochę szybciej wszystko. Na razie. Cześć. 

</details>

---

<div class="lesson-completion-bottom" data-lesson-id="ai-content-expert/live/spotkanie-2"></div>

<div id="sensai-comments"></div>


---

# Spotkanie #3 - 12.02

<div class="lesson-meta">
  <div class="lesson-mentor">
    <img class="lesson-mentor__avatar" src="https://framerusercontent.com/images/t2GGO1yled5Z8wSFTTJMQHHzd4.png?scale-down-to=512&width=2976&height=2949" alt="Maciej Chmurkowski" />
    <span class="lesson-mentor__info">
      <span class="lesson-mentor__label">Mentor</span>
      <span class="lesson-mentor__name-text">Maciej Chmurkowski</span>
    </span>
  </div>
  <div class="lesson-rating" data-lesson-id="ai-content-expert/live/spotkanie-3"></div>
  <div class="lesson-completion" data-lesson-id="ai-content-expert/live/spotkanie-3"></div>
</div>

<div style="position:relative;padding-top:56.25%;"><iframe src="https://player.mediadelivery.net/embed/565073/5f6955ce-9942-4ec1-860e-a2dacf7be2f4?autoplay=false&loop=false&muted=false&preload=true&responsive=true" loading="lazy" style="border:0;position:absolute;top:0;height:100%;width:100%;" allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;" allowfullscreen="true"></iframe></div>

<br />

## 🎯 Cel spotkania

Omówienie postępu bloku 3 (generowanie treści), organizacja projektów grupowych i zadań domowych, demo tworzenia skilla Query Fanout w Claude oraz dyskusja o sprzedaży usług content AI klientom.

## 📝 Notatki ze spotkania

Trzecie spotkanie live poświęcono aktualizacji statusu kursu, omówieniu organizacji prac grupowych i zadań domowych, a także praktycznym demonstracjom — ekstrakcji encji (NER) na żywo oraz budowie skilla w Claude Code. Uczestnicy poruszyli również temat sprzedaży usług generowania treści AI klientom i strategii publikacji, która nie wzbudzi podejrzeń algorytmów Google.

### 1. Status bloku 3 — generowanie treści

Maciej poinformował o postępach w nagrywaniu lekcji z bloku trzeciego. Na platformie opublikowano już materiały dotyczące generowania draftu artykułu oraz wzbogacania treści danymi. Zaprezentował efekt końcowy po drugiej lekcji — dobrze sformatowany draft artykułu, w którym:

- Każda sekcja jest dopasowana do typu nagłówka i odpowiada na konkretną intencję.
- Treść zawiera tabele, listy i zróżnicowane akapity — nie jest jednorodna.
- Każda sekcja stanowi „mini-artykuł" semantycznie dopasowany do swojego nagłówka.

Przed kursantami zostały jeszcze 2–3 lekcje dotyczące czytelności, poprawek ortograficznych i humanizacji tekstu, po których blok trzeci zostanie zamknięty. Nowe lekcje mają pojawiać się w tempie jedna dziennie, z 1–2-dniowym opóźnieniem wynikającym z montażu.

### 2. Organizacja: grupy projektowe i zadania domowe

**Grupy projektowe** ruszą w następnym tygodniu, po opublikowaniu wszystkich lekcji z bloku trzeciego. Plan organizacji:

- Grupy będą tworzone na Discordzie — uczestnicy sami dobierają się w zespoły.
- Warto dobierać się według narzędzi (Make vs. n8n) lub podejścia (bazy danych vs. pliki).
- Każda grupa otrzyma te same zadania — stworzenie pipeline'a generowania treści.
- Maciej przeprowadzi jedno spotkanie podsumowujące z każdą grupą.

**Zadania domowe** zostaną przesłane w ciągu tygodnia. Będą to 2–3 zadania obejmujące więcej niż jeden-dwa kroki pipeline'a, tak aby kursanci przećwiczyli przekazywanie danych między etapami. Wykonane zadania będzie można przesyłać do oceny.

### 3. Demo: ekstrakcja encji promptem (problem Gabrieli)

Gabriela zgłosiła problem — prompt do ekstrakcji encji (NER) nie wyciągnął żadnych encji z tekstu o wielorybach wygenerowanego przez ChatGPT.

Maciej zademonstrował na żywo:

**Test w Playground (GPT-4.1):** Wklejony prompt z lekcji + tekst o wielorybie. Wynik: encje zostały poprawnie wyciągnięte — „wieloryb błękitny" (koncept), „słoń afrykański" (koncept), „kryl" (koncept), a także relacje między nimi (np. wieloryb waży tyle co ~30 słoni afrykańskich).

**Test w ChatGPT:** Ten sam prompt i tekst — wyniki bardzo podobne, z jedną encją więcej.

**Pro Tip:** W promcie do ekstrakcji encji warto zadbać o to, aby relacje zawierały pełne nazwy encji (nie tylko ich ID typu A1, A3), ponieważ model językowy na dalszych etapach pipeline'a lepiej rozumie relacje opisane tekstem niż samymi identyfikatorami.

### 4. Dyskusja: jak sprzedawać usługi content AI klientom

Bartosz poruszył temat podejścia sprzedażowego — jak przekonać klientów do treści generowanych z AI, skoro panuje negatywne nastawienie („AI slop").

**Case study Daniela:** Agencja Daniela miała klienta (duża korporacja), sparzonego przez poprzednią agencję, która generowała artykuły metodą „ChatGPT, napisz mi artykuł". Podejście:

1. Poproszono klienta o jeden dokument PDF opisujący ich produkt (baza wiedzy).
2. Na bazie tego dokumentu wygenerowano artykuł przez zaawansowany pipeline — zasilając model wiedzą klienta.
3. W bonusie wygenerowano post na LinkedIna i opis na TikToka.
4. Wysłano próbkę do klienta. Reakcja: „Czy człowiek w ogóle brał udział?" — szczerze odpowiedzieli, że człowiek jedynie przeczytał tekst dwukrotnie, poprawił jeden wyraz i kilka przecinków.
5. Klient podpisał umowę.

**Kluczowe wnioski z dyskusji:**

- Najskuteczniejsza metoda to **próbka jakości** — pokazać efekt zamiast tłumaczyć proces.
- Nie mówić otwarcie „wszystko robi AI" — lepiej mówić, że „wspieram się AI" lub że mamy osobę, która edytuje i weryfikuje treści (copy manager / edytor).
- Kluczowy jest **wsad** (baza wiedzy klienta) — dokumentacja, PDFy, dane produktowe. Bez dobrego wsadu nawet najlepszy pipeline nie wyprodukuje dobrej treści.
- Koszt produkcji artykułu w pipeline (~5 zł) vs. koszt copywritera (setki złotych) — ogromna różnica przy porównywalnej jakości.

### 5. Demo: tworzenie skilla Query Fanout w Claude

Maciej zademonstrował na żywo budowę **skilla** (Claude Skill) do Query Fanout — procesu, który dzieli słowo kluczowe na mikroobszary i makroobszary z przypisanymi intencjami.

**Czym jest skill w Claude:** Skill to pakiet zawierający prompty, skrypty Python, ewentualnie CSS/HTML — który można zapisać, a potem wywoływać w dowolnym wątku poleceniem „czytaj skilla do…".

**Proces budowy skilla:**

1. Wklejenie dwóch promptów (klasyfikacja intencji + generowanie obszarów) z opisem kroków.
2. Zdefiniowanie inputu — słowo kluczowe, intencja główna, kategoria intencji.
3. Zdefiniowanie outputu — tablica z podziałem na mikro- i makroobszary w formacie JSON.
4. Claude automatycznie zbudował skilla i zapisał go w repozytorium Skills.

**Test skilla na żywo:** Temat „opony", kategoria „samochody", intencja instrukcyjna. Wynik:

- **Mikro:** Rodzaje opon, oznaczenia na oponach, budowa opony, dobór opon do samochodu, sezonowa wymiana opon, opony premium vs. budżetowe.
- **Makro:** Rankingi opon, porównania marek — tematy do osobnych artykułów.

**Pro Tip:** Skille można też budować z większą liczbą kroków (np. cały pipeline w jednym skillu) albo łączyć z API. Alternatywnie, prompty można udostępnić jako osobne API endpoints.

### 6. Strategia publikacji treści AI — częstotliwość i flagi Google

Uczestnicy omówili, jak publikować treści generowane przez AI, aby uniknąć „oflagowania" przez Google.

**Kluczowe zasady:**

- **Nie publikować masowo** — tysiąc artykułów naraz to pewna flaga. Google logicznie ocenia: „skąd właściciel bloga naraz miał tysiąc dobrych artykułów?"
- **Racjonalne tempo:** 3–5 artykułów tygodniowo to bezpieczna granica. Tempo publikacji powinno rosnąć stopniowo, proporcjonalnie do wzrostu ruchu na stronie.
- **Pseudo-humanizacja publikacji:** Planowanie artykułów z wyprzedzeniem (np. w WordPressie co 2–3 dni), ręczne indeksowanie zamiast automatycznego przez API.
- **Quality Raters:** Pytanie o wpływ Google Quality Raters na treści AI — w Polsce ich liczba jest prawdopodobnie niewielka. Algorytmy na rynku amerykańskim są bardziej restrykcyjne niż na polskim.

**Doświadczenia uczestników:** Michał prowadzi stronę z treściami AI od kwietnia 2024 — prawie dwa lata ciągłego wzrostu ruchu, bez spadków, przy tempie publikacji max 3 artykuły tygodniowo. Treści są jednak mocno edytowane po generacji.

### 7. Zapowiedzi i kolejne kroki

**Blok 4 (lekcje dodatkowe):** Maciej zapowiedział specjalne lekcje dotyczące:

- **Opisy kategorii e-commerce** — czytanie filtrów i danych produktowych ze stron, generowanie opisów.
- **Opisy produktów** — wykorzystanie tabel parametrów, scraping informacji z innych stron, generowanie długich, unikalnych opisów HTML.

**Zarządzanie duplikatami w skali:** Maciej pokazał zarys swojego CMS-a, w którym artykuły „matki" generują artykuły pochodne (z Query Fanout). System wykrywa duplikaty za pomocą embeddingów (text-embedding-small) — porównuje nowe artykuły z istniejącymi i wskazuje, które można usunąć.

**Udostępnienie pipeline'a:** Maciej obiecał przygotować dedykowaną podstronę w kursie ze schematem całego procesu i skryptami do pobrania, w tym poprawionymi wersjami skryptów omawianych na spotkaniu.

### 8. Sesja Q&A — najważniejsze wątki

**Q: Jak będą wyglądały projekty grupowe?**
**A (Maciej):** Grupy na Discordzie, dobieranie się wg narzędzi (Make/n8n) i podejścia (bazy danych/pliki). Każda grupa tworzy pipeline od A do Z, potem wspólne spotkanie podsumowujące.

**Q: Dlaczego nie wyciągasz AI Overviews do budowy artykułów? (Daniel)**
**A (Maciej):** AI Overviews to skrót — wszystko, co jest w Overviews, jest 10 razy powtórzone w treściach z topów Google. Topy dają znacznie więcej materiału i są lepszym źródłem, bo z jakiegoś powodu rankują wysoko.

**Q: Czy te skrypty można wykorzystać do budowy treści po angielsku? (Michał)**
**A (Maciej):** Tak, sam pipeline działa bez zmian. Problem dotyczy tylko NER (ekstrakcji encji) — modele Spacy wymagają odpowiedniego modelu językowego. Dla angielskiego jest to prostsze. Alternatywnie — ekstrakcja przez LLM działa niezależnie od języka.

**Q: Jak zarządzać treściami w skali i nie duplikować? (Jordan)**
**A (Maciej):** Embeddingami. Nowe artykuły są porównywane z istniejącymi w bazie wektorowej. System pokazuje duplikaty do usunięcia. Dodatkowo — statusy w bazie danych pozwalają śledzić, na jakim etapie pipeline'a jest każdy artykuł.

**Q: Jak automatyzujesz proces dla 500 artykułów? (Jordan)**
**A (Maciej):** Baza danych ze statusami — każdy skrypt czyta artykuł o statusie „do przetworzenia", przetwarza go i zmienia status na następny etap. Można odpalać skrypty w dowolnej kolejności, a w wersji produkcyjnej — na cronach co minutę/dwie.

**Q: Kiedy zapisywać w CSV, a kiedy w JSON? (Rafał)**
**A (Maciej):** JSON jest preferowany — obsługuje zagnieżdżone struktury (encje z atrybutami), łatwo go przekazywać do LLM-ów. CSV sprawdza się do prostych, płaskich danych.

<details>
<summary>📝 Transkrypcja wideo</summary>

Jeszcze chwilę wspominamy, pokażę Wam do tego, co doszliśmy, bo większość z Was, albo pewnie nikt, jeśli nie zdążył się zapoznać z tymi filmami nowymi, więc my jesteśmy już, macie opublikowane nawet do generowania traf to treści już na platformie i to wzbogacanie treści danymi też jest nagrane i Mateusz to dzisiaj składał. Pokażę Wam jeszcze może jak wygląda już ten draft artykułu po tej lekcji drugiej. Jest już dobrze sformatowany, jest dopasowany, treść każdego, w każdej z sekcji jest dopasowana do tego, jak to ma... generalnie, jaki jest rodzaj nagłówka, na jakie pytanie i jaką intencję ma to odpowiadać. Kacie by ktoś coś chciał powiedzieć? Nie, coś mi zaskoczyło, więc mamy tutaj tabele, mamy listy, mamy... co tam jeszcze było? Fajny podział na akapity, wszystko nie jest tej samej długości, więc doszliśmy do takiego fajnego już momentu. Jak obejrzycie to zobaczycie, że tak naprawdę każda z tych sekcji jest dostosowana do nagłówka. Każda sekcja jest mini-semantyką, mini-artykułem i to później jest złożone, więc tylko chciałem Wam pokazać, że doszliśmy do tegoś takiego. i to fajnie wygląda. Dobrze się to czyta też, a jeszcze jesteśmy przed lekcjami, gdzie będziemy układać czytelność, poprawiać ortografię i jeszcze humanizować nakładki. Myślę, że dwie, trzy lekcje, trzy chyba, bo musimy trzy razy jeszcze to przypisać i będziemy mieli zamknięty blok trzeci. No i teraz jestem w tym takim cugu, że będę nagrywał jeden dziennie, dzisiaj też mam przygotowane materiały na ten kolejny odcinek i to będzie się pojawiać, tylko pewnie z jednym dwudniowym opóźnieniem, bo Mateusz musi to przejrzeć, to składać, czasami coś z głosem, bo oczywiście nagrywanie w domu to nie jest komfort, jeżeli jestem w studiu, to Mateusz wszystkiego pilna, ja w domu potrafię nagrać materiał, później trzeba go nagrywać od nowa. Czekajcie, bo tam jakieś pytania. Dobra, do wracania tylko do rozkładu tych lekcji. Dobra, organizacje. Tak, projekty grupowe w ramach ćwiczeń. Grupy zaczniemy robić na samym tygodniu, jak już będziecie mieli wszystkie te odcinki odnośnie tego bloku. Ja wiem, że macie napięty harmonogram z innymi kursami. I spoko, możesz pisać. Ja wiem, że to tak wygląda, ale jakby tutaj też chyba nie przewidzieliśmy tego wszyscy. Chorób, bo tam przede wszystkim Romek się rozchorował i Krzysiek i to się później nawrowskiło. Niby było dobrze, a później każdy z nas gdzieś tam miał problemy, więc to trochę się tak nawrowskiło. Natomiast wiecie, to będzie teraz, bo Robert chyba u siebie na... Robert chyba, nie pamiętam, który ma, Semantic chyba, ekspert, zrobił coś takiego jak zadania domowe. Rozmawiałem już z Mateuszem i dobrze by było, żebyście wy też w mniejszych pipeline'ach zrobili takie zadania domowe. A grupy będziemy łączyć w następnym tygodniu. Więc myślę, że te grupy to sobie zrobimy na Discordzie, jakieś specjalne posty do tego, żebyście się pogłaszali, kto z kimś chce. i każda grupa będzie miała tak naprawdę te same zadania, więc stworzyć też jakiś pipeline. Tutaj myślę, że fajnie Wam się przyda to, o czym już mówiliśmy parę razy, ten sposób przekazywania outputów, zapisy danych, żeby ten pipeline ułożyć sobie tak, jak Wy chcecie. Dobrze było się chyba w grupy podobierać, tak żeby ci, którzy robią remake'u czy N8M, żeby zarazem się dobrali, którzy chcą, nie wiem, zrobić to za pomocą bazy danych, więc tak by to wyglądało. Dobra, teraz Gabyela. A ja mam pytanie odnośnie przygotowania treści pod wyciągnięcie NC, bo w nagraniu wspomniałeś Małską o tekście o CD projekcie, który był spokojnie specjalnie naszplikowany NC-ami. "Rzuciłem treść o wielorybie wyglądowanym z czata i nie wyciągnął mi enc." Okej, treść o wielorybie. Gdzieś zawsze jakieś ency powinny być. A użyłaś tego mojego promptu, który tam był w lekcji? Rozumiem, że nie robiłaś tego Pythonem, tylko po prostu promptem. Czyli zresztą możemy to zrobić teraz, jeżeli mi pokażesz ten tekst, to zobaczę, co się dzieje. Dobra, okej. Sam prąty też powinien odciągnąć. Czekajcie, sobie znajdę teraz ten prąd. W lekcjach. Dziękuję. Tak się połączę, może sobie... Już wiem dlaczego, bo było to nagrywane na webinarze. Nie mam tych plików odnośnie... Samego tego. W samych lekcji tutaj. Tak, dobra, czekajcie, już urozumiam. Tylko wiesz co, gabinetem potrzebował tego tekstu twojego, żeby to wypróbować. Abytualnie chcecie, to możemy jakiś inny zrobić, bo mam ten CD Projekt, ale rzeczywiście ten tekst do CD Projektu był specjalnie wygenerowany też przeze mnie, żeby wyciągnąć tych ręce, jakby to jest naszpitowany. Musiałbym zobaczyć jakikolwiek inny. Inaczej, ten, który Ci nie działa. Chyba, że po prostu zrobimy sobie jakiś inny. Ja jeszcze nie widziałem wszystkich materiałów, ale w tym procesie Ty wyciągasz Maciek i overviews do stworzenia artykułów? Nie, nie wyciągam i overviews. Ten proces był taki, że wyciągamy tak naprawdę artykuły stopów Google'a, Bing'a i BlackDuckGo. Stamtąd bierzemy treści, na których opieramy. Tak naprawdę już nie korzystamy później na końcu z samych tych treści, tylko korzystamy z tego, co one mają. Wyciągamy fakty, wyciągamy endcje, wyciągamy dane mierzalne, takie pomysły na artykuły i te pomysły to też jest super, tutaj wychodzi później właśnie jakieś, jeżeli tu jest intencja jak zadbać o sen po 40, to jest instrukcyjna, no to mamy w krokach także tutaj jest to wszystko fajnie, wygląda na czytasz tabela więc nie musimy też dużo wrzucać, dużej ilości treści które zjadają tokeny i tak to wychodzi całkiem fajnie Dobra, mam wieloryby. Dlaczego? Że to jest gotowa baza wiedzy, która lubi AI? Czy ja wie? Overviews jest takim skrótem tak naprawdę. Myślę, że wszystko, co jest overviews, jest 10 razy powtórzone w tych treściach, które my mamy z topów. I to jest dość ograniczone. mi się wydaje, że nie bardzo jest taka potrzeba, te wszystkie więcej na 100% są pokryte, tylko i dużo więcej mamy jeszcze w tym, tak naprawdę, w tych treściach. Powiem też, że to są topy, więc z jakiegoś powodu te zwane są tam, no zazwyczaj jest takie, że są dobrze napisane treści, nie? Dobra. Patrzymy w wielolet. Dobra, udostępniłem, udostępniłem trochę większe. Tutaj mamy ten prompt nasz, jeśli go sprawdzam jeszcze GPT 4.1 to robimy na razie. Temperatura jest przesadzona, ale powinno być jakieś 0.3, bo on ma tylko wyciągnąć, a nie tworzyć. To jest ten prompt i tutaj wrzucimy ten tekst, dzięki temu "user message". Zobaczymy, co się stanie. "Leloryb" - koncept. "Wetfall Bankitne" - koncept. "Słoń Afrykański" - koncept. i jest, pewnie będzie relacja na przykład tutaj, zobaczcie, to jeszcze fajnie widać, będzie relacja do wieloryba, czyli pewnie wieloryb waży tyle, co około 30 słoni afrykańskich. Kryl, nie wiem, co to jest, ale to pewnie coś do jedzenia, bo może zjadać 3-4 domen. Kto my? Kto dziennie? I tu już mamy relację, czyli tak, wieloryb, Płet falu węki ma na relację do wieloryba super wyciągnął, czyli częścią zawiera się w gotunek wieloryba, wyrawy kręl amcki, co było, kręl, nie jest tego dużo, ale w tekście chyba nie ma zbyt dużo anti. No nie, wyciągnął moim zdaniem te wszystkie, które powinien wyciągnąć. I jeszcze zobaczcie, jak zrobicie, przy takim tekście wyciągniecie fakty, te wszystkie rzeczy, typu "potrafią zonurzać się w wodzie", to zostanie wszystko wyciągnięte z tych tekstów, jako fakty na przykład, nie? A później jeszcze sporo rzeczy z tego może być zrobione jako idea, jak to się może tutaj przygotować. A Gabriela, masz ten skrypt? Dokładnie, bo jakby mi się wydaje, że ten powinien być skrypt w sensie prompt. On nie jest skomplikowany. I pytanie, czego używałeś? Trzeba to GPT? Możemy też na czacie GPT wypróbować. Przezmy sobie ten prompt. I już tekst jest, tak? Tak, że nie zajmowałem tego teksta. No dobrze. 5,2. Podobnie. Trochę więcej, tu trochę inne są. Ale bardzo podobnie. Chyba jedną enzymę więcej. Tylko tutaj zobaczcie, jeszcze jedną rzecz, jak to zwrócę uwagę, to co później już tego nie wykorzystujemy w skrypcie, że każda encia zapisuje na początek i powiększa, tak żeby było widać. Powiem jeszcze, na co warto jeszcze zwrócić uwagę, o czym ja mówiłem w lekcji, ale nie wiem, czy to nie ma mnie uśmiało, że każda encia ma swoje ID, na przykład A1, no i to jest ta encia w NLORED. i później jak mamy relacje, to dobrze by było, żeby te relacje tak naprawdę nie zawierały tylko i wyłącznie id, tylko, wreszcie, żeby tu były nazwy, co do czego jest relacją, ewentualnie id może Cię gdzieś tam podać, dlatego że to wrzucimy później do modelu językowego. To jest trochę mój błąd, że tego nie zrobiłem w tym promcie, później jest to skrypcje zrobione, jeżeli to wrzucimy, to model nie do końca będzie łapał. Bo on nie jest w stanie... Jest i nie jest. Nie zawsze to robi dobrze. Te a1, czyli tej NC1 z NC3 nie jest w stanie dobrze skojarzyć, że to jest wszystko tekstem napisane i później jest ta relacja i ten description, który jest bardzo ważny, to tutaj jest, to to mamy już wszystko zamknięte. Tak naprawdę same relacje mogłyby nam wystarczyć prezencji. Dobra. Gabriela, no to wiesz co... Dobrze, to jeżeli to jest prompt, spróbuj sobie w czacie dpt to wrzucić. Pamiętaj, żeby... Nie wiem, w sumie prompt i na dole tekst, tak jak ja to wrzuciłem tutaj, to nie powinno być problemów. Jeżeli byś miał jeszcze jakieś problemy, to dajmy znacz na Discordzie. Dobra, Bart, dawaj do kolei, lecimy. Cześć, cześć. Takie bardziej pytanie i otwarcie dyskusje dla wszystkich nawet. Dobra. Ponieważ zacząłem pracować jako freelancer, bo czytelator wariancji marketingowej. No i wiadomo, wariancji są ludzie, też różnymi specjalizacjami, no i też copywriterzy. Z tego względu ten kurcz jest bardzo im przydatny, bo większość klientów jednak potrzebują też contentu. no i też wiadomo, "contents the king", jak to się mówi. No ale teraz to jest takie, ludzie upatrują AI i pozytywnie i negatywnie, dużo jest tak zwany AI-slope, no i pytanie, jak to sprzedać też klientom taki pomysł, no bo większość osób pomyśli od razu: "a, robisz AI, to wpisujesz, zrób mi artykuł na temat ten i ten i tamten" i tyle. No i się zastanawiam właśnie, jak wy wszyscy macie takie podejście narracyjne do klientów, jak to wytłumaczyć, w sposób też przejrzysty i taki, żeby sprzedać ten temat, no bo też ja sam się tego uczę, te wszystkie takie ragi, wszystkie kosinusy, no to takie rzeczy, które nawet i my tak musimy zrozumieć, przez nich musimy wejść w ten temat, a co dopiero to wytłumaczy klientom, żeby sprzedać ten temat, bo to różnie w to wychodzi. takie pytanie właśnie do wszystkich, jak się podchodzi od takiej sprzedażowej do klientów. Może nie do końca ten temat kursowy? Nie, to jest bardzo dobry temat, nie się gadaje, zgadamy treści. No więc to takie pytanie otwarcie dyskusji można powiedzieć do wszystkich, więc... Ja ci powiem co ja od dawna robię i próbuję, aczkolwiek to idzie różnie. Ja edukuję klientów, czyli ja chcę pokazać, że te treści z wykorzystaniem NCV mają większe prawdopodobieństwo zaryngowania w obecnych czasach. Oczywiście nie są bełkotem robionym na jednym formacie, niż w nieraz treści pisane przez copywriterach, nie umówiąc copywriterom. Bo tutaj zobaczcie, tak naprawdę pierwsze dwa bloki mamy przybytowanie, a później można pisać pod ręcznie. Można sobie zrobić brief i po prostu na podstawie tego pisać. Maciek, jeśli mogę, to ja mam dla Ciebie taki case, że tak powiem, na gorąco, bo ja dokładnie się pewnie zdarzamy z tą sytuacją, że jak już ktoś słyszy, że jakikolwiek tekst jest generowany, no to już jest zły. No więc ja ci powiem, że jest nowy klient, duża korporacja, sparzeni po jakimś tam poprzedniej agencji, która im generowała tekty na zasadzie "czat napisz mi artykuł". No i faktycznie ta strona jest tam spalona tymi tekstami. No i jakby główne pytanie jest, co jest jakimś czynnikiem, no wiadomo, że content, no to skąd my mamy brać ten content? Tutaj jakby przede wszystkim taka rozmowa z tym klientem, a co wy macie, tak? Czy tylko to co na stronie, czy macie jeszcze jakieś dokumentacje, czy macie jakieś jeszcze rzeczy, które obrazują wasze produkty. No i po odnitce do kłębka okazuje się, że do każdego kursu, który sprzedają, mają obszerny dokument PDF, który mówi od A do Z o wykładowcy, o tym co jest w kursie. No taka baza wiedzy jest dalej już gotowa. No i teraz dobrze, no to dobrze, no to w takim razie, skoro chcecie mieć dobry content, to dajcie nam jeden taki pdf, jaki macie i my wam pokażemy, jaki możemy wam z tego zrobić artykuł. I na zasadzie próbki, tak, generujemy, no wiadomo, że bierzemy ten content, puszczamy to przez te wszystkie nasze przygotowane, czy przez Maćka, czy tam przez Roberta narzędzia, opieramy to o tą wiedzę, którą mamy, czyli zasilamy model i tak dalej, i tak dalej, no i generujemy sobie piękny artykuł z tego. Do tego w bonusie dogenerowaliśmy jeszcze post na LinkedIna, opis na TikToka, na social, że tak powiem w jednej takiej paczce. I to wysyłamy im jako próbkę. Proszę bardzo, już tekstę możecie dostać. I ci ludzie dali się przekonać od razu po tym, jak przeczytali, jak będą wyglądały teksty. No właśnie. W końcu z całej historii zadali pytanie, czy człowiek w ogóle brał udział w tym tekście. Więc my szczerze powiedzieliśmy, bo normalnie otwartym tekstem tego nie mówimy, ale szczerze powiedzieliśmy, że człowiek tak naprawdę ten tekst przeczytał po modelu dwa razy, naniósł tam jakieś przecinki i jeden chyba wyraz był przekręcony i to jest koniec pracy człowieka. Ludzie po prostu stali jak gmurowani. Wczoraj wysłaliśmy umowę. I to jest dokładnie z tym co mówisz. Sparzeni totalnie, strona jest zasrana, czat, GPD, napisz mi artykuł. I to takim schematem, jak to normalnie... Pytanie, czy nie jest spalona już, nie? O, ja wiem. Odwaga idzie i później ciężko zubieść tego, nie? Oni są świadomi, że tu stoimy przed orką taką na rok czasu. Oni są świadomi tego. bo tu mają jakby wiecie, mają otwartą furtkę, bo sprzedaż robią przez akcy, wydają na akcy fortunę, więc jakby tutaj stoimy przed tym, żeby dopracować organik teraz i zmniejszyć przynajmniej budżet na akcje i zrobić zasięg w organiku, więc jakby tak Maciek, to też przed tym stoję, faktycznie już dzisiaj mam dostać, bo to wszystko w ogóle póki co robione było na zasadzie zewnętrznymi narzędziami, dzisiaj mam dostać właśnie analitykę całą i całą resztę, No ale wiem czego się spodziewać, raczej to wiesz, a Hrefcy mi mówi i Senutomi mówi czarno na białym, na czym stoję. Tam jest złamanie pewnie jakieś. Także podsumowując, to jest chyba najlepszy sposób. Co ciekawe, od razu Wam dodam, bo jakby my też mamy drugi dział, gdzie generujemy wideo w bardzo dużej ilości, to u innych klientów, jeśli chodzi o formaty wideo, robimy dokładnie tak samo, tak? Jakby jest niedowiara do tego, że można wygenerować avatar, który wygląda jak człowiek i że tu nie widać, że on się w ogóle myli, więc generujesz próbkę, generujesz avatar, wysyłasz, proszę, tak może wyglądać rolka, tak? No i ludzie mówią, no dobra, no to biorę to. Wiecie co, ja chciałem 11labs wziąć, żeby mi ten tekst, głos podkładały, jak byłem chory, ale za dużo z tym roboty trochę. Ale szczerze mówiąc, to można zrobić tak, że nagrywam sobie film w KASK-srypcie i 11labs podkłada i dokładnie wszystko jest w tym samym momencie. Moim głosem jeszcze, nie? Także myślę, że już niedługo będziemy tak robić. Teraz nie mam czasu, żeby sobie coś zrobić na to, ale... My to już robimy do takich filmów reklamowych, do jakichś rolek, robimy to na bieżąco, także działa to bardzo sprytnie. Nawet niektóre są w agregatorach już takie narzędzia, do których, wiesz, po prostu wrzucasz ścieżkę nagraną z jeden Lapsa, wrzucasz produkt, tam już masz dostępne awatary i to wygląda UGC, po prostu nie jesteś w stanie na to wpłynąć. No ale podsumowując, żeby się nie rozgadywać, bo odbiegliśmy, myślę, że my stoimy jako agencję przed takim faktem w tej chwili, że musimy udowodnić, że potrafimy to zrobić dobrze i że to dobrze wygląda. i że nie musicie się obawiać o te teksty, tak? Bo wiesz, oni nawet nie pytali o to, czy tekst, który oni dostają od nas, on zarankuje. Im chodzi o to, jak on będzie wyglądał i oni muszą czasu poświęcić na to, żeby ten tekst zweryfikować. A tu było, wiesz, jeden do jeden, nie? Zero błędu tak naprawdę. No i to ciekawe, to tak, tak, byłem dumny z tej konfiguracji, że po tej wiedzy, którą dostał, to wypluł to tak, że no, mówię wam, tam była jakaś jedno słowo, przykręcone i gdzieś tam przecinki były nie tak. No ale to właśnie chodzi o to, że trzeba mieć wsad, nie? To niekoniecznie, że mamy internetowe. Trzeba mieć wsad, jak samochód. Nauka nie idzie w las. Super, fajnie słyszeć, że mogę takie proszę. Dzięki za uwierzenie, bo ja tak właśnie myślałem, jak też być trochę transparentnym z tą kwestią. No wiadomo, klient ma jakiś tam budżet, ale by chciał się wziąć takiej naprawdę wysokiej jakości treść, kopiorajtera to spokojnie to się przepali nawet setki złotych czy więcej. A stworzenie takiej treści wysokiej, co tam Maciek mówiłeś, chyba 5 złotych kosztuje załóżmy więcej, i coś co będzie rękowa i dawać dużo wartości, to ma znaczenie. Tylko się zastanawiam, czy np. umie na stronie internetowej, czy to mówić od razu: "tworzę content AI", bo nie wiem czy to właśnie nie odrzuci ludzi od razu. Ja bym powiedziała, że wspieram się. Ja później mówię, że jak tworzę treść, jak już mam jakiś taki discovery call na przykład, z kimś już rozmawiam i mogę wtedy przetłumaczyć sytuację i też stworzyć właśnie taki przykładowy, jak Daniel mówiłeś. Znaczy, to zasady takim klientom, którzy przychodzą z drogów i to my od razu otwarcie nie mówimy, że to jest całkowicie generacja. copywritera, to już teraz nie jest copywriter, edytor, copy manager, tak bym to nazwał, manager contentu, bo dziewczyna praktycznie nic nie pisze, ona tylko przegląda, edytuje, więc jakby też nie kłamiemy tego klienta, tylko mówimy, no mamy taką osobę na pokładzie, czasem jak jest potrzeba, to do wideo ona wchodzi, ona mówi jakie tam ma zadania, co ona robi, opowiada o tym, jak jest bardzo duża potrzeba, ale co do zasady, bezpieczniej jest mówić, że masz kogoś, kto ci te teksty edytuje. Trochę trzeba to tak zawalować, bo jak wrzucisz, że wszystko lecisz maszyną, to nie, to jest to, co ty powiedziałeś. Wszyscy są sparzeni po "Chargeptit" i tu masz słowo kluczowe, wygeneruj mi artykuł. - No, bo przed walcem ja tego klienta, co tam wejdzie. Ja z jakimiś tam ludźmi, z agencyjnymi, gdzie się spotykam, to to jest nagminne, ciągle się to robi. 70% podobno, takie badanie było, że tylko tak robi, nie? W sensie, że świadomość jest bardzo niska ludzi. I dlatego jest taka władka, nie? Bo po prostu źle to jest robione. Nawet na pytanie ty, no wiesz co, to czemu se, a masz senuto? No mam. Bo czemu sam nie dokupisz tych koiniów i nie zrobisz tego tym procesem, co tam leci w... W rejterze? Co tam leci w rejterze, w senuto, nie? Rajter jest dwa lata do tyłu, albo nawet trzy za nami teraz. Tak, ale jeżeli... Bo wszyscy, wszystkie, trzeba było zainteresować, ale zawsze tam jest, wiesz, keywords, jakieś inne rzeczy. W tej chwili wygeneruj mi, a artykuł wygenerowany w rejterze, to one są zupełnie inne, przynajmniej ten rejterze jest po polsku napisany. Ale rajter robi raga, nie? Rajter robi raga, zbiera to co ja robimy, to akurat robi też, bo to od dawna było... Na koniec, masz odpowiedź, ale też to jest w trzy razy droższe. No i potem taka usługa jak nasza, wiecie, jest sprzedana dla powiedzmy jakiegoś e-commerce'a za, no nie wiem, strzela 1500 zł, 5 artykułów na miesiąc, no artykuły poszły, nie? ja zrobiłem swoje, miałem napisać, napisałem, nie? no i po pół roku, wiesz, człowiek jest zawiedziony, jak słyszy, że ma gdzieś iść do drugiej agencji za 5 koła 10, no to wydam na to samo, tak że to tak, taka naklejka jest i trudno ich przekonać do tego. Słuchajcie, mam dla was dzisiaj propozycję. Czekaj, sorry? Ja chciałem się spytać na stronę sprzedażowej, jak tego podejść, bo jest taka łatka, że to co przez AI stworzono content jest kiepski. Taka generalna, bo np. na Reddit jak wejdę, to praktycznie codziennie z różnych sabredditu słyszę, że ludzie mają dość tego inflacji treści, takiego gówno się przelewa. a sami widzimy w tym kursie, możemy stworzyć naprawdę wysokiej jakości kurs, tylko że my to wiemy, a większość społeczeństwa nie wie, i to trzeba umieć sprzedać, tak? Więc taka sytuacja. Odśniło mnie, słuchajcie, ostatnio, bo naprawdę zakochałem się tym naprawdę miłością w spraudzie z jej skillami, te prezentacje, które są nawet teraz, to są robione. Ale widzicie, co mnie leśniło? Że wy możecie i my możemy zrobić, zamiast też collaba, zrobić skilla do generowania artykułów. I pomyślałem sobie, że dzisiaj wam pokażę, bo ja jeszcze go nie robiłem, ale pomyślałem sobie, że tak naprawdę skille też składają się ze skryptów Python. Skille mają naprawdę duże możliwości i ten skill możecie sobie zapisać, a później sobie robić pewien proces na tym, nie? wykorzystując tylko na przykład cloud'a. Nie wiem, czy chcielibyście, żebyśmy to zrobili przez moment? Bo to podejrzewam, że będzie chwilę na przykład do query fanouta. No pewnie, że możemy zobaczyć, jak to wygląda. Może chcecie jeszcze, żebyśmy najpierw przerobili sobie i zobaczyli, nam czasu zostanie jakieś pytania jeszcze po drodze i możemy to na koniec zrobić, bo też nie chciałbym przed szereg wychodzić. Jeżeli macie jeszcze jakieś propozycje, ktoś chce się przygadać, jeszcze odnośnie kurzu, albo coś to było. No nie, nic widzę, że bardziej wyłączyłem. Dobra. Zrobiłem sobie skill do query fanouta, bo ten query fanout tam się składa z dwóch promptów. Jeden to jest do konsyfikacji, drugi to jest do już do tych intencji, do tych obszarów. I teraz zobaczcie, to idealnie się nadaje, bo to są dwa kroki, ale moglibyśmy to połączyć i zrobimy sobie to w ten sposób, że najpierw tak naprawdę to nic skomplikowanego będzie. bo mamy sobie ten queryFanout, ten pierwszy skrypt, pierwszy prompt, przepraszam, ja go sobie skopiuję i mamy też... czekajcie, co mieliśmy w promptzie tutaj? Nie, musimy mieć tylko tak naprawdę to. Intencja definicji. Dobrze. Robimy tak. Skupię ten prompt. Będę musiał mu napisać. Powiększę wam. Będziemy robić skilla. Najpierw wpiszę, później wam przeczytam. Dobra? Na intencje obszary. Dwa kroki. Dwa prąbki. output pierwszego promptu, drugiego, i teraz tak, prompt pierwszy, tak, i jego input. I tutaj będziemy chcieli wymusić, żeby Cloud nas pytał o trzy rzeczy. O te nasze słowo kluczowe. To, co mamy tutaj na dole. Intencję główną. Kategorię intencje. Oczywiście będziecie mogli to sobie później uprosić, żeby Wam tak naprawdę, żeby na podstawie słowa kluczowego on to wszystko wypełnił, bo dlatego on to wypełnił, ale z tym "n" i "n" nie jestem pewien. Ja mu to dopiszę: "Musisz zapytać użytkownika o te cztery rzeczy z inputu". Zaraz zobaczymy, jak on to zinterpretuje. A teraz mu napiszę prompt drugi. Powinno być to wszystko. Prompt drugi, słuchajcie, to był ten drugi prompt, który był zapisany. Tak jest. A, i też drugi sposób jest na to, żebyście, że prompt możecie zbudować sobie API. Ten prompt jest zapisany i on jest osobnym API, możecie zapytać. wysłać tak samo tylko input i dostaniecie opowiedzieć indywidualne apice, bo na ciebie też był nowy. Dobra, dom drugi. Ja go jeszcze czasami pytam, czy rozumiesz... I on zacznie robić, to powinien nas jeszcze zapytać, czy to jest ok. Tak, podsumowując, no, po to listu intencje z obszarami bardzo dobrze i pytaniami, tylko tu nie będziemy mieli oczywiście tego, people as last, ale na razie to sobie zostawimy, tak jest, wszystko jest, jaki format? właśnie, co chcemy mieć? Chcemy mieć tablica z podziałem głównym na mikroobszary i makro. Dobra, zapytanie to pierwsze. Interat tego nie pyta po kolei, nie, wszystko zrobimy sobie jedny message. I on już w tej chwili buduje nam tego skilla. I tego skilla możecie sobie zapisać. Ja Wam od razu pokażę, jak będziemy poczekać na budowanie. Jak to się robi. wchodzicie w ustawienia capabilities i na samym dole macie skille, nie? Ja mam dwa skille, jeden do PDF-ów, świetne, że też PDF-y robi sobie mój skill i drugi do PPTX bo wtedy jeszcze ostatnio też zrobiłem przejścia na animację i mam też możliwość wygania layoutu, czyli jakiegoś PPTX-a, kopiuję go wrzucam do też do cloud-a i on mi generuje layout, który później mogę wybrać. Zrobiłem właśnie ten sens iowy, i to co robi Cloud z prezentacjami, jest po PX-er zwłaszcza, niesamowite, on naprawdę poszli teraz w super kierunku. Więc tutaj możecie przede wszystkim dodać wasze skille, możecie je też uaktualniać, replace, i jedna uwaga, on nie zawsze po zrobieniu skilla umieszcza go tutaj w tych takich repozytorii, więc będziemy musieli sobie pewnie zgrać ten plik ze skillem i później go wygrać manualnie i wtedy w dowolnym czy nowym oknie "wywołaj mi skilla do tego", "czytaj skilla do tego" i jedziemy. Zobaczymy jak tam to idzie. To trochę może potrwać, bo nie trzeba się tylko porozmawiać, bo to nie jest taki bardzo skomplikowany skill. Wszystko jasne na razie? Czy za szybko coś? No mamy tego skilla, to jest, zazwyczaj się nazywa plik skill, krok skill, ale czasami jest z zipie, bo to jest cała struktura, tam są skrypty Pythona, tam są jakieś inne rzeczy, możecie nawet zrobić CSS, HTML, jakby to jest naprawdę cały system. O, widzicie. Jeszcze mnie tutaj zadał pytania. Zobaczymy, jaki tam jest format JSON. To co on proponuje. Czyli tak, zobaczcie, przykład pełny: input użytkownika, to będzie nasz input, a output to będzie mikro i makro. Makro możecie używać sobie do generowania innych artykułów i dokumentów. Tutaj jeszcze wyjaśnimy sobie te pytania z nim. Makro nie będziemy grupować, bo każdy tak naprawdę makrodokument możemy znowu przelecieć tym samym sposobem i tam będzie ta intencja dobrana. Czyli dla makro nam wystarczy obszar, czy nasz temat plus intencja. I to nam wystarczy, żeby wystartować na przykład nowe, naszym pipeline'em wystartować nasz nowy nowy artykuł. 2. Żydłowa intencja, może być żydłowa intencja w makro, właściwie powinna być. Właśnie o to chodzi. Pierwsze i trzecie pytanie, czy to ma działać jako instrukcja dla cloud w rozmowie, czy w pewność będzie działać API pipeline synuto? W należności zostawmy go jako instrukcja. Możemy sobie z kila, słuchajcie, później wrzucić więcej tych kroków, nie? Też jest dobry pomysł, żeby sobie to zrobić na przyszłym live'ie na przykład. To się z to dorzucimy, żeby pokonfikować. On tu jeszcze poprawki robi. Ja przyjdę z Wami wszystko, nie będę go wczytywał, tego skilla, tego dopisać, zazwyczajmy, czy on się pojawi, czy będziemy w stanie go dodać. Czasami sam cloud ma problemy bezpieczeństwa pewne i nie dodaje tych skilli, czy je grać ręcznie, nie? Dobra, pytamy. Czy możesz dopisać tego skilla w moich skillach? Skill zapisany. No, zobra. QueryFanout powinien się nazywać. Zobaczymy, czy nas nie okłamał. Jeśli nie mamy go skilla, zrobimy skilla manualnie. Pobieramy go. I teraz będziemy w stanie sobie wybrać to w tych skillach. Dobra, mam jakiś problem. Może dlatego mu się nie udało wgrać. Czyli wrócę do naszego wątku Wrzuciłem mu Ten problem, który wyskoczył Zobaczymy Z jakimś formatowaniem A no właśnie Naprawia jeszcze raz to zrobię Dziękuję. Tak spróbujemy zrobić. No i mamy, zobaczcie, mamy w granice w skiercie query fanout, i teraz, żeby nie być głosownym, otwieram sobie zupełnie nowy wątek, nie ten, w którym skoczyliśmy tego skilla, jesteśmy czysto. Coś nowego. I teraz tak: czytaj skilla. Dajcie mi jakiś temat, bo ja zacząłem trochę z tematem. Na jaki artykuł chcę napisać? Może o wiele ryba. Możemy z Was. No i zobaczcie, doszliśmy do tego, że QR-Fan odczytamy. Gotowy do pracy? Podaj 4 elementy, żebym mógł rozpocząć zapytanie. Pierwsza. Opony. Dwa. Nfia główna opona. Kategoria. Samochody? No tak. I intencja dominująca, jaką chcemy, definicyjną, instrukcyjną, bo instrukcyjna to będzie na przykład zmiana, o tym to powinien być. Zakupowa. Zakupowa. Ale nie mamy idei zakupowej, bo to nie są te same intencje co ty, słuchajcie. Nie mam zdefiniowanych tych skillu. No daj im instrukcyjną, koleżankę. Dobra, dobra. Sam jestem ciekaw, co się wyraży. No jedziemy. Dziękuję. No i dobra, co tu mamy mikro? Najpierw definicyjna, obszary, rodzaje opon, oznaczenia na oponach, budowa opony, instrukcyjna, dobor opon do samochodu, sezonowa wymiana opon, no to takie decyzyjne, opony premium, opony budżetowe, to powiem, to powiem, to powiem, to powiem, to powiem, to powiem, to powiem, to powiem, No i z tych rzeczy, które można by było testować rankingi opon, czyli makro będzie nam obudowywać dokumentami. Fajnie to wygląda i teraz zobaczcie też, gdzie mamy instrukcyjne. Mamy instrukcyjne dwie. W tych lekcjach, które doszły, pewnie ktoś nie widzieliście jeszcze, ten query/funout robi nam outline. Przede wszystkim QRF-anout. I na początek, jeżeli intencja jest zgodna w tych obszarach z naszą intencją główną, to zaczynamy od tych sekcji. Pierwsze sekcje będą dobór opłon do samochodu, sezonowa, wymianowę itd., a później będzie dopiero jakieś uzupełnianie. No i wszystko, moim zdaniem fajnie, można sobie poeksperymentować, można sobie poddawać intencje i taki skilli możecie sobie budować x albo 1 duży na przykład. Nie wiem jak on się zachowa z czytaniem na przykład, nie wiem czy on sobie poradzi, scroll for AI z czytaniem innych stron, bo to by było najfajniejsze układkienie, ale jeżeli nie robicie tak dużego pipeline'u, tylko produkujecie sobie tam kilkadziesiąt artykułów, to takie zrobienie skinny jest moim zdaniem bardzo fajne. I wyciągacie skilla wtedy, kiedy go potrzebujecie, wykorzystam cegiełka. I co o tym myślicie? No mega sprawa to jest i otwiera jakieś dodatkowe możliwości, teraz widzę. No fajne. Wasza wyobraźnia jest waszym ograniczeniem, bo to co się dzieje tutaj, to co się wydarza, to jest kolejny przełom, bo prawdopodobnie będzie można zrobić skill'a do robienia skill'i. Wszystkie asystenci, mallbot i tak dalej, to nam daje tyle rzeczy do zrobienia. Przecież on też może skarpować, chodzić nam pobierać treści ze staryfnie. Odwalić go na jakiejś wirtualnej maszynie, gdzieś, już o tym myślałem. I wrzucać mu tylko taski, żeby przeczytał jakąś stronę i zabrał sam kontakt. Tutaj jeszcze jest bardzo duże okienko na robienie tego wszystkiego, co my robimy. Dobra, chcecie coś jeszcze, żebyśmy omówili? Jeżeli nie macie Klauda, to polecam, bo ja wreszcie przez API robię na OpenAIu, a na Klaudzie generalnie siedzę do wszystkiego innego. To mówią: cisza na sali, psorze, także... No słuchajcie, ja wiem, że tam powinniśmy mieć więcej tych lekcji, byśmy sobie gadali o tych nowych lekcjach, no ale to jest dużo, że ktoś się wydarzył po drodze, więc może po prostu słuchajcie, jeżeli nie mamy nic na głowie, to możemy to skończyć, a ja mogę też zrobić jeszcze jeden dodatkowy spotkanie z Wami, jak będziecie chcieli, na przykład w przyszłym tygodniu. bo wydaje mi się, że fajnie będzie to porobić po pierwsze spotkanie po tych lekcjach nowych, po tym całym bloku trzeciem, na przykład możemy się umówić na jakiś poniedziałek, wtorek, a później sobie zrobimy drugie spotkanie, bo chyba nawet nie mamy zaplanowanych na jakiś koniec tygodnia, żebyśmy te grupy porobili. No i dostaniecie jeszcze zadania domowe. Dla helpy tak naprawdę, bo to nie jest równe zaliczenie, ale dostaniecie zadań domowych, ja pomyślę, jakich dwa czy trzy takie wybrania, które będą trudniejsze, w sensie nie tylko jeden, dwa kroki. Halo Michał. Widziałem, Maciek, że pisaliście na Discordzie, że udostępnisz jakąś część swojego procesu, tego pipeline'a, tak? Tak, bo ja wam go obiecałem w ostatnim tygodniu, bo muszę to poskładać, ale skupiłem się na tych lekcjach, bo ja nie wiem, po prostu z tym nie chciałem jeść przez to, nie mogłem jeść nagrywać. Więc tak, nawet w taskach miałem na wczoraj zrobienie tego. Więc ja jeszcze się zastanawiam tylko jak to zrobić, jakąś dedykowaną podstronę zrobimy może na tym kursie, gdzie będzie cały schemat po prostu i obok skryptu. co jest inputem, żebyście sobie to mogli skopiować i poukładać, bo zwłaszcza, że tam, pamiętam, były te skrypty, które nie były na lekcji udostępnione, które doskonalałem, gdzieś poprawiałem, żeby do tego pipeline pasowały, żeby nie były tak jakby stand alone, więc to jest i dogram to. Dzisiaj nagrywam jeszcze jedną lekcję, zaraz po tej lekcji skrót i może wieczorem dzisiaj to ogarnąć i wrzucimy. Bo widziałem tam, że ten skrypt do pobierania url z Google przez ten noteshuba czy serpdata i dodatkowo miał część, żeby pobrać chyba 3 url z Binga, to widziałem, że tam się nie zmienił, nie wiem, bo chcemy ciągle pobierać. Bo ja nie wrzucałem tego tam, tylko chcę ten nowy skrypt rzucić do... Bo tam był ten advance taki skrypt, to był ten mój. I tam był ten, bo tam były dwa. Jeden był prosty, który na mnie zadziałał, zwłaszcza na fizy, chyba porno dostałem z bingo. Nie wiem czy to potem już tego nie dociąło w ogóle. Nie wiem, widzieliście to? No tak, tak było. Dobra, no to dobrze, nie bycie mówiłem, żeby nie bycie nawyciwane. ale drugi jest skrypt i on był tylko w opisie lekcji. On nie był omawiany na filmie, tylko ja później go dodałem. - A, zaawansowany? - Tak, zaawansowany. To ten, z którego ja używam. Więc dodałem, żebyście mogli to wykorzystywać. No i właśnie to on będzie też w tym całym paklinie, które sobie teraz zbudujemy, bo wam to się przyda do tych zadań i innych rzeczy. Dobra, czekajcie, bo tutaj jeszcze mnie interesuje działanie na skali. Jak aktualizujesz plan publikacji, aby się nie duplikować? W serwisie dochodzą nowe kategorie po jakimś czasie i zarządzasz? Dobra. W niektórych tworzą się bazy tekstów, bo trzeba automatyzować. Ja to robię embeddingami. Zaraz Wam może pokażę. tylko ja mam taki CMS, który jest tam w trakcie budowania, bo przynoszę to z Pythona. Zobaczyć, czy to dobrze działa na tym cemosie. Dlaczego wam to pokazać? Ale jakby mam tutaj teraz... I tak spróbuję. Znaczy, dlaczego nie mamy... Dobra, nie pokażę jak to działa, tylko pokażę sam zamysł, bo to już jest w trakcie budowy. Bo to może coś Wam podpowiem. To jest to, więc mamy sobie na przykład artykuł, który jest point killers historię, powiększę może trochę. i on jest jakby matką, rodzicem, nie? I z tego, z query fanauta zostało wygenerowane po prostu jeszcze cztery artykuły, które będą jakby otaczały go, nie? I za każdy z tych artykułów, każdy jeden, może znowu mieć taką funkcję, że znowu też wygeneruje propozycje nowych artykułów i one, to jest tutaj, będą się powtarzać. Więc ja zrobiłem taki panel, duplikaty, w którym sobie wybieram stronę całą, więc za każdym razem mogę tu wejść, te artykuły, on sprawdza artykuły z wyświadomem nowy, a wiem dlaczego nie idą, bo już nie są nowe, coś tam robiłem i wykorzystuję text embedding small i tak naprawdę, bo mam tu już hidingki, to embeduję do embeddingów w modlitwie "h To jest proces chwilowy i to idzie szybciutko i sprzedzam duplikaty. On mi to pokazuje później, które są duplikatami i które można usunąć od razu z rozdziałami. Tak, Gabiela, tutaj zaraz Ci pokażę. Jest zaplanowane, bo to razem uzgodniliśmy. Jest blok czwarty, idziemy do lekcji grędkowej. Tutaj chcę Wam pokazać proces, który możecie sobie robić, bo też możecie to wszystko przerobić pod e-commerce, ale do kategorii i do opisów produktów. Ma zupełnie inny schemat, trochę podejście podobne, ale jest inny rak. Pokażę Wam to. Będą specjalne lekcje nagrane. I tutaj gdzieś to miałem. Wpisy kategorii jest ostatnio, nawet z wykrzyknikami sobie zastanawiamy. Nie wiem, czy to nie przesunę trochę wcześniej, na sam początek. I tutaj będzie duża lekcja, bo pokażę Wam jak to robić wykorzystując np. Wasze strony interdowalowe albo strony klientów. Jak zczytać filtry i zczytać informacje o produktach, które będą naszym psadem i napisanie tekstu o kategorii. Na tym też zęby zjadłem, bo robimy opisy kategorii dla bardzo dużych mark i wiele tego robimy. i fajnie to wychodzi. I tak samo jest z opisami produktów, gdzie wystarczy nam np. tabela z parametrami. No i oczywiście też sklepowanie z innych stron informacji o produktach. Możemy super, unikalny, bardzo długi HTML-owy opis robić i to też będzie częścią tego kursu. Dobra, mamy jeszcze jakieś pytania? Płysię. To znowu ja. To znowu ty. Słyszałem ostatnio podcastu Marii Heise i ona właśnie mówiła o tym, że są takie sytuacje, że wpisuje się te artykuły właśnie w sposób taki, jaki my robimy i to naprawdę fajnie rankuje, ale często są ci quality raters, które sprawdzają prawdziwe osoby, które sprawdzają tej jakości stron, no i często widzą, że to jest jakby gorsza jakość, Wiadomo, tam są różne czynniki, które wpływają, bo tam mamy taki cały guidelines. No i nie wiem, takie pytanie do Was, czy na przykład mieliście takie sytuacje, że wytworzyliście tam setki może artykułów, które naprawdę dobrze rankowało, a później po kilku miesiącach załóżmy, później były spadki w rankingach na przykład, czy to właśnie względu na to, że było oceniane, audytowane czy nie. Takie pamiętasz? To byłby dość ciekawe. Michał, by pierwsze pytanie nie opowiem. z tym quality raters to w ogóle jest pytanie czy w Polsce są ci quality raters i ile ich w ogóle jest tu jest też pytanie, że algorytmy na USA na przykład, a Polski z tego co widzę różni się, bo ja mam trochę z polskich stron i mam trochę na rynek amerykański i te strony na amerykański rynek są dużo bardziej dopracowane i słabo to idzie te z polskiej, które są trochę taką lżejszą metodą, szybciej robione i dobrze rankują. Także tu z tymi Equality Raters też jest pytanie właśnie ile w naszym kraju jest tych raters. Nie wiem, odpowiedź na drugie pytanie, czy te treści rankują. Mam strony, które zacząłem pisać chyba kwietniu 24 roku, więc już się wybliżamy powoli do dwóch lat. Pisałem to narzędziem Koala.ai, które jest słabe, na którymś tu micie ostatnio rozmawiałem, trzeba tam dużo edytować i cały czas te strony rankują. Nie mam ich dużo, bo nie mam tych stron polskich dużo, ale mam taką jedną stronę na rynek tu polski, do której jeszcze ostatnio dodawałem ruch, no i pięknie rośnie, pięknie. Od dwóch lat już prawie cały czas idzie do góry i ostatnio rekordy znowu bije i wszystko jest AI. Ale jest sporo poedytowane. No bo ja głównie pracuję na brytyjski rynek, nie wiem jak to jest w polskim właśnie, więc to jest taka ta różnica. Ale to jest bardzo restrykcyjne, jest inaczej trochę traktowane. Oni sami go sobie tak wychowali, bo oni bardzo są zapobiegawczy, o tym, że z linkowaniem. Więc u nich każde sztuczne linkowanie też jest widoczne. Oni się bardzo boją tego. Mi się wydaje, że to jest ta przyczyna. No ale też na przykład udostępnianie artykułów, no to było tam wspominane, że jest jakaś taka, no wiadomo, to wszystko to zależy w życiu, magiczna liczba, żeby nie udostępnić, właśnie, tysiąc od razu artykułów przy ciągu dwóch dni, czy właśnie, bo to też... To jest najbraniejsze. To myślę, że w Google zobaczysz nagle, na przykład jakaś nowa domena... Także flagowane jest, wiesz, tak, że dostajesz flagę i ona idzie do sprawa, to nie oznacza, że dostaniesz karę, ale jeżeli jest flagowane, oni nie mają problemu z e, ale mają problem z masą AI, bo myślą, że to będzie słowa jakość. Więc rzeczywiście ta flaga idzie i później już bardzo ciężko się z tego wydostać, chociaż się artykuły obronią. Trzeba ci wybrać taką odpowiednią, racjonalną liczbę, pewien udostępnienia, przypuszczam. Musisz to zwiększać, tą częstotliwość. Jeżeli publikowałeś jedentygodniowo, to publikujesz dalej jedentygodniowo, bo od czasu zwiększasz, ale nie wszystko na rok. I to musi być z wzrostem ruchu. I wtedy nic nie będzie. Te strony, które ja mam właśnie robię tak, że publikuję w tempie, w takim jakby to człowiek pisał. Nigdy nie publikuję więcej niż 5 artykułów na tydzień, ale zazwyczaj nawet mniej. Ja mam magiczną lead-wę 3 na tydzień i też no, nie przekraczam tego. Mimo, że już je mam napisane, jeżeli to są w przykład wordpressy, to już je mam poplanowane i tak je planuję, żeby tam powiedzmy co drugi, trzeci dzień na artykuł się pojawiał. Nawet to, że tak powiem, leniwie ręcznie indeksuje, żeby to nie puszczać przez API i w ogóle nie dotykać tego jakąś taką automatyzacją już. Sama automatyzacja napisania i mania tej treści gotowej już z obrazami, uważam, że to już nam wystarcza, że takie wrzucenie dużo na raz, od razu jesteśmy oflagowani, tak jak mówił Marcin. Tak myślałem, myślę. To co powiedział Michał, taka pseudo-humanizacja już tej publikacji, bo jeżeli nam nie wykryje albo mało wykryje tego AI-a w samej treści, no to możemy się zdradzić tym, że naraz wrzuciliśmy tysiąc artykułów. Bo nawet same takie ludzkie rozumowanie, skąd właściciel bloga naraz miał tysiąc dobrych artykułów. No bo też oni wiedzą o tym. pomysł, zasoby żeby napisać, zgromadzenie grafik, wiecie, no to ta logika mówi, żeby nie na raz. Tak, tak, tak. Tylko bardziej właśnie tak jak tu wspomniałem, między 3-5 na tydzień czy coś, bo to ma jakieś racjonalne podejście w tym temacie. Póki co na jakichś takich tematycznych stronach pół roku jakby mam przyjętą tą zasadę max 3 na tydzień i nic się nie dzieje. One sobie wchodzą, siedzą, potem sobie tam się pinają powoli, dzień po dniu. Nie zauważyłem gdzieś, żeby była jakaś kupa. Mam jeden portal, który pewnie jest blokowany i tam muszę coś popracować, ale na pozostałych nic się nie dzieje specjalnie. No i na klienckich na przykład też nic. Tam co prawda nie ma takiej dużej częstotliwości, bo tam to zależy, czy chcą więcej zapłacić, żeby mieć więcej, więc to jest uzależnione. ale mam jednego takiego klienta, który ma zakontraktowane trzy na tydzień i to nic się nie dzieje. Buduję sobie ten zasięg, long tail i tak dalej, bra dłubną do góry, powoli. No ma sens. Dobrze, słuchajcie. Jak my stoimy przed dziękami, które chcę mówić? No, że po prostu już dzisiaj skończymy. Nie to, że nie chcę, jeżeli chcecie jeszcze coś porozmawić, to jeszcze mamy 14 minut, jeżeli chcecie pociągnąć, ale myślę sobie, że bardziej też będzie logiczne, może bardziej wydane, jak się spotkamy w tym samym tygodniu dwa razy i przerobimy na tym jeszcze jednym całym spotkaniem poświęcimy tym nowym lekcernom, nowemu blokomu generowaniu, bo tam będziecie mieli dużo. Jestem pewien, że tam pojawił się pytanie, że coś trzeba jeszcze przerabiać będzie, coś wyjaśnić. Więc fajnie by było, żebyście to sobie poprzerabiali do następnego tygodnia. Później zrobimy sobie już te zadania i wchodzimy się na grupę. Zadania dostaniecie w tym tygodniu. To jest też tak, że będziecie to wysyłać, nie? Wykonanie zadania. Żebym ja też będę się wspomagał pewnie. Może jakieś skilla zrobię do tego oceny. żebym mógł zobaczyć i ewentualnie Wam doradzić później, nie? Abym mogli to sobie przegadać gdzieś na Discordzie. Tak więc wchodzimy już w drugi jedno powoli. No dobra, to słuchajcie. Dobrego tygodnia Wam życzę, chociaż jest już połowa. Widzimy się w następnym tygodniu. Pamiętajcie o Discordzie. Ja jestem blisko, odpisywam i gdybyście chcieli jakieś pytania, byście mieli nie wytkając na nasze live'y, to też piszcie. Dobra, dziękuję bardzo. Trzymajcie się. Dzień dobry. Cześć. Dzięki, na razie. Cześć. Dzięki.

</details>

---

<div class="lesson-completion-bottom" data-lesson-id="ai-content-expert/live/spotkanie-3"></div>

<div id="sensai-comments"></div>


---
