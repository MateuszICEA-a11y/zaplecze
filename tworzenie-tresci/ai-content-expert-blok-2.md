# AI Content Generation Expert - Tydzień 2

> Materiały do NotebookLM
> Wygenerowano: 20.03.2026

---

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
