# AI Content Generation Expert - Tydzień 3

> Materiały do NotebookLM
> Wygenerowano: 20.03.2026

---

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

<div style="position:relative;padding-top:56.25%;"><iframe src="https://player.mediadelivery.net/embed/565073/5aa1af82-16af-4897-bd3d-58da4d10adf5?autoplay=false&loop=false&muted=false&preload=true&responsive=true" loading="lazy" style="border:0;position:absolute;top:0;height:100%;width:100%;" allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;" allowfullscreen="true"></iframe></div>

<br />

## 🎯 Cel lekcji

Zrozumienie i wdrożenie procesu automatycznego wzbogacania treści o zweryfikowane dane i źródła. Lekcja pokazuje, jak za pomocą skryptu Python wyodrębnić z artykułu fragmenty wymagające weryfikacji (tzw. claims), wygenerować pytania weryfikacyjne i potwierdzić dane przez WebSearch API — z automatycznym wstawianiem cytatów i źródeł.

---

## 📒 Notatka z lekcji

Lekcja dotyczy jednego z kluczowych kroków w pipeline generowania treści — wzbogacania artykułu o aktualne, zweryfikowane dane ze źródłami. Inputem jest draft wygenerowany w poprzedniej lekcji (HTML), a outputem ten sam tekst z poprawionymi danymi i wstawionymi cytatami.

**Powiązane pliki:**

- **Wejście:** `output_draft.html` (draft artykułu z poprzedniego kroku)
- **Wyjście:** wzbogacony artykuł HTML + raport JSON z wynikami weryfikacji
- **Skrypt:** notebook Python (Google Colab)

:::caution[Krok opcjonalny, ale wartościowy]
Wzbogacanie danymi nie zmienia samej treści artykułu — modyfikuje jedynie fragmenty dotyczące danych. Jeśli pominiesz ten krok, artykuł będzie działać, ale bez zweryfikowanych informacji i źródeł.
:::

---

### 1. Dlaczego wzbogacamy treść danymi?

Modele językowe generują liczby, daty i statystyki, które często są niedokładne — około 60% odpowiedzi LLM-ów zawiera błędy w danych. Manualna weryfikacja jest czasochłonna i mija się z celem automatyzacji.

Cel tego kroku:

- **Aktualne dane** — zastąpienie lub potwierdzenie wygenerowanych statystyk
- **Wiarygodne źródła** — każda zweryfikowana informacja otrzymuje cytat z URL-em, datą i tytułem źródła
- **E-E-A-T** — źródła potwierdzają wiarygodność treści, co jest jednym z kluczowych czynników rankingowych

:::tip
Ten sam skrypt działa również dla artykułów napisanych ręcznie — inputem jest dowolny HTML zaczynający się od H1. Warto go wykorzystać nawet wtedy, gdy nie korzystasz z pipeline generowania treści.
:::

---

### 2. Mechanika pipeline wzbogacania

Cały proces składa się z czterech etapów:

**Ekstrakcja claims** — skrypt wyszukuje w treści fragmenty zawierające dane do weryfikacji. Wyszukiwanie odbywa się za pomocą **wyrażeń regularnych (regex)**, a nie modelu językowego — dzięki temu wynik jest deterministyczny i powtarzalny.

**Generowanie pytań weryfikacyjnych** — surowy claim (np. "300-600 mg ekstraktu na dzień") nie ma wystarczającego kontekstu. Skrypt dodaje do niego nagłówek sekcji i otaczający paragraf, a następnie GPT-4.1 mini tworzy precyzyjne pytanie weryfikacyjne (np. "Jaka jest zalecana dzienna dawka standaryzowanego ekstraktu ashwagandhy na obniżenie kortyzolu?").

**Weryfikacja przez WebSearch** — pytania trafiają do modelu z włączonym WebSearch API (GPT 5.2), który wyszukuje odpowiedzi w internecie. Wyniki mają jeden z trzech statusów:
- **Potwierdzone** — źródło potwierdza dane, wstawiany jest cytat
- **Dane niedokładne** — wstawiany jest cytat z flagą `to review` do ręcznej weryfikacji
- **Brak źródła** — treść pozostaje bez zmian

**Wstawianie cytatów** — pod zweryfikowanymi fragmentami pojawia się źródło z tytułem, datą dostępu i adresem URL (link nieaktywny, żeby nie wyprowadzać mocy ze strony).

---

### 3. Osiem kategorii claims i system scoringu

Skrypt rozpoznaje osiem kategorii wzorców w tekście. Każda ma przypisaną wagę punktową:

- **Statystyka** (waga 3) — liczby z jednostkami, np. "500 tysięcy osób"
- **Konkretna data** (waga 2) — daty mogące być halucynacją
- **Trend** (waga 2) — sformułowania o wzrostach, spadkach, najwyższych poziomach
- **Norma medyczna** (waga 2) — zakresy referencyjne, normy
- **Porównanie ilościowe** (waga 2) — porównania z liczbami, np. "o 50-80% powyżej normy"
- **Datowane zdarzenie** (waga 1) — konkretne wydarzenia z datami
- **Legislacja** (waga 1) — odniesienia do aktów prawnych
- **Organizacja** (waga 1) — nazwy organizacji w kontekście danych

Kategorie o wadze 1 samodzielnie nie są weryfikowane — ale jeśli dwie lub więcej pojawią się w jednym zdaniu, ich punkty sumują się i claim trafia do kolejki.

**Przykład scoringu:** zdanie "Kortyzol osiąga najwyższy poziom 30-45 minut po przebudzeniu, a przewlekły stres zwiększa kortyzol bazowy o 50-80% powyżej normy" łączy trend (2) + normę (2) + porównanie (2) = **6 punktów**. To wysoki wynik — taki claim ma priorytet weryfikacji.

Skrypt sortuje claims malejąco według scoringu i bierze **maksymalnie 15 najważniejszych** do weryfikacji (limit konfigurowalny).

---

### 4. Konfiguracja i uruchomienie skryptu

Kluczowe ustawienia w notebooku:

- **`input_file`** — ścieżka do draftu HTML z poprzedniej lekcji
- **`output_file`** — ścieżka do wzbogaconego artykułu
- **`report_file`** — raport JSON z wynikami weryfikacji (przydatny do dalszej analizy)
- **Model główny** — GPT 5.2 z WebSearch (weryfikacja claims)
- **Model pomocniczy** — GPT-4.1 mini (generowanie pytań weryfikacyjnych)
- **Język** — wymuszenie źródeł w języku artykułu (domyślnie: polski)
- **Keyword** — słowo kluczowe artykułu (na potrzeby tej lekcji wpisane ręcznie, w pełnym pipeline będzie pobierane automatycznie)

:::note[Wzorce regex można rozszerzać]
Jeśli w Twoich artykułach claims nie są wykrywane w wystarczającej ilości, możesz dodać nowe jednostki i metryki do patternów w odpowiedniej sekcji skryptu. Każda kategoria ma osobną definicję wzorców dla języka polskiego i angielskiego.
:::

---

### 5. Analiza wyników — raport JSON

Po uruchomieniu skrypt generuje raport JSON zawierający:

- **Potwierdzone claims** — z URL-em źródła i wstawionymi danymi
- **Poprawione claims** — z informacją co zostało zmienione i skąd pochodzi korekta
- **Niezweryfikowane claims** — oznaczone, ale bez zmian w treści

Raport można przekazać do LLM-a w celu dodatkowej weryfikacji lub wykorzystać do manualnego przeglądu.

---

### 6. Zasady wzbogacania — podsumowanie

- **Nieinwazyjny** — zmienia tylko fragmenty dotyczące danych, nie ruszając reszty treści
- **Bezpieczny** — niepewne wyniki są flagowane, nie aplikowane na siłę
- **Deterministyczny** — regex daje zawsze ten sam wynik (w przeciwieństwie do LLM)
- **Skalowalny** — jedno wywołanie API do WebSearch + jedno do mini
- **Językowo spójny** — źródła w języku artykułu (polski/angielski, z możliwością rozszerzenia)
- **Celny** — pytania weryfikacyjne precyzyjnie kierują wyszukiwanie

### Podsumowanie

Wzbogacanie treści danymi to samodzielny krok w pipeline, który automatycznie wykrywa fragmenty wymagające weryfikacji, sprawdza je w internecie i wstawia potwierdzone źródła. Nie każdy claim zostanie zweryfikowany (szczególnie w polskich źródłach), ale nawet kilka potwierdzonych danych ze źródłami podnosi wiarygodność artykułu — zarówno dla użytkowników, jak i dla wyszukiwarek.

## 📚 Materiały dodatkowe








---

<details>
<summary>📝 Transkrypcja wideo</summary>

Cześć, witam Was w kolejnym odcinku z bloku trzeciego. Mamy już wygenerowany, tak jak tu widzicie na ekranie, mamy wygenerowany już draft treści. Wcześniej zrobiliśmy outline, dystrybucję elementów pomiędzy sekcje. Teraz czas się zająć czymś zupełnie innym, mianowicie wzbogacaniem, ja to tak nazwałem, wzbogacaniem treści danymi. I oczywiście za chwilę przejdziemy do prezentacji, żebyśmy mogli sobie to łatwiej omówić i być może zapamiętać, ale wszystko to co jest w prezentacji znajdziecie również oczywiście w materiałach przygotowanych przeze mnie do lekcji. Powiązane pliki, te razem również tylko skrypt Pythona. Nie wiem jak to zrobić na orkiestronach, myślę, że moglibyście sobie na tym popracować. Proces nie jest prosty, jest dość skomplikowany, bo przez tak naprawdę już chyba z dwa czy trzy lata doświadczenia w tym zbogacaniu danymi przeszedłem już wszystkie możliwe problemy i w tej chwili to działa całkiem nieźle, ale też wykorzystujemy WebSearch API od OpenAI. A możecie inne modele prawdopodobnie też do tego podpiąć. To pewnie nie będzie trudne. Nie testowałem tego. Jeżeli chodzi o websearch, również dobrze mi się sprawdza OpenAI, więc nie będę eksperymentował. Co jeszcze możemy powiedzieć o tej lekcji? Na pewno będzie... Po co to robimy? O tak, może od tej strony zacznę. Po co to robimy? Chcemy, żeby nasz artykuł był wartościowy. miał najnowsze dane i żeby dane, które będziemy tu prezentować miały też potwierdzone źródła, bo finałem, takim wynikiem tego dzisiejszego działania będzie oprócz wstawienia odpowiednich ilości, mogą to być ilości do NC, do faktów czy zweryfikowanie danych mierzalnych, które zbieraliśmy wcześniej, to jeszcze skrypt finalnie podaje adres URL, rok i datę też skąd podchodzi źródło. Nie będę chyba tłumaczył, nie będę wchodził, bo to nie jest kurs OSEO, ale jeżeli chcecie mieć zaspokoić IEAT to jest jeden z tych czynników, które na pewno wam w tym pomoże. Także za chwilę przechodzimy już do prezentacji. Dobrze, to teraz omówimy sobie całe te wzbogacanie treści danymi. Jak to wygląda? Tak jak mówiłem na początek przejdziemy przez prezentację, prezentację porozmawiamy w sumie to nie jest dialog ale pokażę wam teorie a następnie pokażę wam już dokładnie pewne fragmenty kodu żeby wyjaśnić uzupełnię tu po prostu prezentację także jaki my mamy problem do rozwiązania problem polega na tym że chcielibyśmy aby nasz artykuł po pierwsze miał dane które są aktualne i które mają źródła. Źródła, tak jak już wielokrotnie mówiłem, są bardzo ważnym czynnikiem w tej chwili. Wskazują, że mamy sprawdzone informacje. Jest to jeden z elementów E-A-A-T, więc warto to robić iść z duchem czasu i jednak robić te artykuły, które będą zawierały poprawne dane, bo jak wiemy, same modele językowe nie są w stanie tego zapewnić. Około 60% odpowiedzi modeli językowych zawiera błędy. Jeżeli to nie jest oczywiście tak jak my robimy wspierane zewnętrzną bazą wiedzy lub tak jak tutaj wyszukiwaniem odpowiednich statystyk danych w internecie. Jak to wygląda w praktyce? ELM generuje liczby, daty, statystyki. Dobrze o tym wiecie i te liczby są przypadkowe. Tak samo zdarzają się bardzo duże błędy w danych. w datach w statystykach brak źródeł czyli to co ja powiedziałem brak wiarygodności i najważniejsza rzecz jakakolwiek manualna weryfikacja jakiekolwiek manualne wzbogacanie tego mija się z celem ja nie wiem czy to nie zajmie więcej niż gdyby copywriter napisał sam artykuł natomiast musi się jakoś tym wspierać więc tutaj też jest ten krok jest bardzo ważny dlatego że może nawet jeżeli osoby chcą jakieś które piszą sami a tutaj robią brief, uczą się z nami tego wyszukiwania informacji, to ten krok bardzo im się przyda i myślę, że warto sobie przerobić tą lekcję, zmienić trochę skrypt, żeby na przykład dla gotowego już artykułu, który został napisany przez człowieka, robić podobne rzeczy. Tak naprawdę chyba nawet nie ma różnicy żadnej, jeżeli wrzucicie, bo tutaj inputem jest HTML, czyli artykuł, który zaczyna się od H1 i ma nagłówki. Więc zrobicie równie dobrze to samo. Oszczędzicie mnóstwo czasu. Jak wygląda mechanika całego tego wzbogacania danymi? To jest mini pipeline. To jest jakby samodzielny krok, ale on sam w sobie jest może nie bardzo, ale dość skomplikowany. Więc to wygląda tak. Mamy ekstrakcję klejmów. Klejmy będę używał dzisiaj często. Klejmy to są nasze obszary, które mogą zawierać jakieś dane i które warto właśnie wzbogacić. Więc dojdziemy jeszcze do rodzajów tych klejmów. Zobaczycie też na przykładzie, ale tych klejmów jest naprawdę sporo, zwłaszcza przy artykułach generowanych przez AI. I taki klejm jest znajdywany nie przez model językowy. To jest najważniejsze. Szukamy go przez regex. Ja wam pokażę, jak wyglądają te paterny, bo to tak się mówi. To są paterny, to są takie jakby, gotowe szablony pewnych słów, pewnych sformułowań, może danych, może metryk, które potrafią wyszukać bardzo szybko w Python. W PHP to oczywiście jest można zrobić, ale Python robi to niezmiernie szybko i wyszukuje nam te klejmy. Więc tutaj nie używamy do tego LLMów. I nasze podejście jest deterministyczne, czyli tutaj zawsze znajdziemy te same klejmy. Chyba, że sobie zmienimy coś w kodzie, że będziemy wyszukiwać więcej rzeczy. Możecie to też zmieniać, ja wam pokażę gdzie. Następnie, żeby ten websearch, bo wysyłamy sobie te klejmy do LLM, do OpenAI, który ma websearch, do GPT 5.2, możecie do innego każdego modelu, który ma websearch włączony, żeby te klejmy dały nam, żeby można było je uzupełnić danymi. Nie możemy wysłać tego, co znajdziemy w treście, bo to są zdania twierdzące, jakieś przykłady, które nie mają sensu, więc ja złożyłem mechanizm, który na podstawie tych klejmów stworzy pytania weryfikacyjne, czyli jeżeli chcemy wysłać klejm dotyczący jakiejś dziennej dawki, na przykład wody do picia, to nie możemy wysłać, że dzienna dawka wody do picia wynosi powiedzmy 2 litry, tylko zadać pytanie, jaka jest dzienna dawka wody do picia. I to robi nam bardzo szybko, szybki model GPT-4.1 mini. Wysyłamy wszystkie te klejmy razem i on zwraca nam przypisane do tych klejmów pytania weryfikacyjne. To też pokażę wam po uruchomieniu skryptu. Później następuje weryfikacja źródeł, czyli tak naprawdę ten websearch, on ma trzy statusy, zaraz też w następnym slajdzie chyba będzie, albo w kolejnym. I ta weryfikacja w zależności od statusu albo wstawia bezpośrednio te dane, albo znacza abowo zostawia tak jak było. No i później mamy wstawianie cytatów. Te cytaty to tak naprawdę źródła, podanie źródła, ewentualnie daty. Link nie jest aktywny. Nie ma co tutaj wyprowadzać jakiekolwiek mocy z naszej strony z artykułu, a Google czy modele językowe, które będą czytywały doskonale sobie poradzą z tym adresem URL. Mam przygotowane dla Was osiem kategorii wzorców i wszystkie tych klejmów, bo to są te właśnie paterny, o których mówiłem. Osiem różnych kategorii, przyjrzymy się temu i jest tak zwany scoring, zastosowując system oceniania, żebyśmy wiedzieli, czy tak naprawdę warto w ogóle wyszukiwać dany klejm, czy on nie jest po prostu ogólnym stwierdzeniem, które jest zgodne z konsensusem i jakimś czy z ogólną wiedzą. Więc ten scoring pozwala nam wybrać te klejmy, które są dla nas najważniejsze, które mogą zawierać dużo danych fałszywych i sortujemy sobie od klejmu, który ma najwięcej punktów w tym scoringu. I też mamy limit, tutaj 15 max klejmów do weryfikacji, można to zwiększyć, można to zmniejszyć. Pamiętajcie, że 15 to nie znaczy też, że wszystkie zostaną ustawione, bo nie zawsze jesteśmy w stanie wyszukiwać daną informację, zwłaszcza, że ja to zawężam do języka danego artykułu, czy do języka polskiego. I jak jest ten scoring w praktyce wygląda? Tutaj pokażę Wam na przykładzie. Tutaj na górze widzicie taki przykład. Kortyzol osiąga najwyższy poziom 30-45 minut po przebudzeniu, a przewlekły stres zwiększa kortyzol bazowy o 50-80% powyżej normy. Tutaj mamy aż trzy różne rzeczy, które są w jednym zdaniu, które są punktowane, czyli mamy trend, mamy normę, trend to znaczy, że jakiś najwyższy poziom, wzrost i tak dalej, coś trenduje nam albo się obniża. Norma jakaś jest podana, no i jest porównanie. Więc łącznie dostaję ten z klejm 6 aż punktów, to jest dużo i jasne jest, że trzeba go zweryfikować, zbogacić jakimiś danymi. Następny przykład, normy kortyzolu porannego wynoszą 10 do 20, nie znam tej metryki. Krew, coś tam, tak, wiemy. OK. Statystyka, czyli to jest statystyka najwięcej punktowana. Plus 3, plus norma 2 daje nam 5. Jak najbardziej ten klejm jest, bo potrzebuje potwierdzenia źródła, albo sprawdzenia, czy to są dokładnie te liby. I na koniec, skoro nas jest 0, pominięty. No to jest przykład właśnie, jakie będziemy pomieniać. To świetnie działa. Woda jest najlepszym napojem przy wysokim kortyzolu. Tak to wygląda. No i dobrze. Jak są tworzone pytania weryfikacyjne? Bo jeżeli mamy tego klejma, znaleźliśmy go już i często to jest jedno zdanie, tak jak tutaj, zobaczcie. W pierwszej wersji surowy klejm wyglądał tak. 300-600 mg ekstraktu na dzień standaryzowanego z posiłkiem. Co, jak, skąd, co to jest, jaki ekstrakt? Wyślemy, nawet to wyślemy do modelu językowego, żeby stworzył nam pytanie, to nie jest w stanie tego zrobić. Dlatego, że nie ma kontekstu żadnego. Więc dodajemy do tego nagłówek, ten poprzedzający danego claima, czyli najbliższy w hierarchii u góry oraz dajemy sobie na przykład cały paragraf, w którym jest ten claim. I oczywiście sam claim, żeby było wiadomo, żeby model językowy wiedział o co chodzi. No i wtedy to wygląda zupełnie inaczej, bo tak jak powiedziałem GPT-4.1 mini jest w stanie wygenerować takie pytanie weryfikacyjne. Jaka jest zalecana dzienna dawka standaryzowanego ekstraktu aszwagandy na obniżenie kortyzolu? Bo tu proszę Państwa chodziło o aszwagandy. Dobrze i teraz te statusy weryfikacji, o których powiedziałem jeszcze. Potwierdzone źródło potwierdza dane. Dodajemy cytat. Dane niedokładne, coś mamy nie tak. Dodajemy cytat, ale dodajemy taką flagę do review i tą flagę możemy albo zauważyć manualnie, tutaj białkość przydaje i zweryfikować to w inny sposób, albo w kolejnym kroku zostanie to po prostu, te zdanie zostanie zmienione, poprawione tak, aby nie sugerowało niepotrzebnych danych. Jeżeli nie mamy źródła w sieci, zostawiamy bez zmian. To niestety też się powtarza, zwłaszcza dla polskich wyników, jeżeli zresztą właśnie. Na początku szukałem we wszystkich językach, głównie w angielskim. I generalnie każdy klejm znajdowałem, do każdego klejmu znajdowałem źródło. Ale te źródła się cały czas powtarzają. Dokładnie te same adresy. I nie jest to według mnie dobrze. Fajnie by było to potwierdzać w polskich źródłach, więc wymuszenie języka polskiego powoduje, że będzie tych źródeł trochę mniej. Ale ja wolę tak to zrobić, mieć polskie źródła, które są być może dokładniejsze, czy model jakiś przejdzie, czy Google na dane źródło, to zobaczy, że to jest dokładnie to samo, co szukaliśmy, łącznie z tym, że użytkownik też może sobie to sprawdzić i to jest bardzo wiarygodne. Jak wygląda samo wstawianie źródeł? Tutaj jest, podaję wam przykład, w 2019 roku WHO oszacowało, że ponad 500 tysięcy osób umiera rocznie z powodu i tak dalej. No to po to będziemy mieli po pierwsze zweryfikowaną liczbę albo poprawioną, no i na dole będzie źródło WHO, tam data i oczywiście dalej adres internetowy tego. Dobra, to tak podsumowując jeszcze te zasady naszego enrichmentu, czyli tego wzbogacenia danymi, to jest przede wszystkim nieinwazyjny krok. On nie zmienia samej treści, zmienia tylko fragmenty dotyczące danych, więc tak naprawdę jeżeli go pominiemy nic się nie stanie, tylko tyle, że nie będziemy mieli poprawionych informacji i wiarygodnych źródeł. Jest bezpieczny, bo tak naprawdę jeżeli coś jest niepewne, no to mamy flagowanie, a nie aplikowanie na siłę, gdzie to później trudno znaleźć, jest deterministyczny, proszę Państwa, ponieważ to jest regex i to zawsze będzie ten sam wynik. Co byście nie robili, to będzie ten sam wynik, chyba że zmienicie paterny w regexie, więc model językowy za każdym razem by pewnie oznaczał inne źródła. I powtarzanie tego samego kroku wiązałoby się z wieloma zabawnymi sytuacjami bądź problemami. No jest na pewno skalowalne, bo mamy jedno wywołanie API, szybko to działa, naprawdę muszę przyznać, plus jedno wywołanie API do mini. językowo spójny, tak jak mówiłem, źródło w języku artykułu. W tej chwili skrypt jest dostosowany do języka angielskiego i polskiego, ale nie ma problemu, żebyście go dostosowali sobie do innych języków. No i celny przede wszystkim to pytania kierują te wyszukiwanie przez ten model. GPT Mini świetnie wyrobi te pytania i szuka odpowiedzi na te pytania za pomocą już modelu tego reasoningowego 5 i 2. I teraz przejdziemy sobie trochę jeszcze najpierw może nie do skryptu, bo ja bym chciał parę rzeczy jeszcze Wam pokazać w tej teorii, której mamy załączonej do naszego materiału do tej lekcji, a później pokażę Wam parę rzeczy w skrypcie jeszcze jak to wygląda, te paterny, zanim go uruchomimy. Teraz przyjrzyjmy się kategoriom, o których mówiłem, tych klejmów tak jak to było przedstawione w prezentacji jest ich osiem i każdy ma z nich przypisaną pewną wagę. Tutaj macie w tej informacji do lekcji również informacje co wykrywa taka kategoria taki claim jak to wygląda i przykład z tekstu żeby było wiadomo co chodzi. Jak mówiłem statystyka jest najwięcej punktowana i ona zawsze musi być potwierdzona. Więc to są liczby plus jednostki i to tak jak widzicie już tutaj w przykładzie. Konkretna data, to też jest do sprawdzenia, żeby to nie było halucynacji. Później mamy ten trend, który też tam był w naszym przykładzie, norma medyczna i porównanie ilościowe. I to się jakby... Kończą się nam samodzielne klemy, te, które mogą funkcjonować samodzielnie. Później są tylko datowane zdarzenia, powiedzmy ROXAM, jakaś legislacja, czyli odniesienie do aktów prawnych i organizacja. One samodzielnie nie będą wyszukiwane i sprawdzane ale wystarczy że dwa z nich się zsumują w jednym zdaniu obok siebie i już mamy coś co warto sprawdzić a teraz przejdźmy już sobie do naszego skryptu tak naprawdę pokażę wam jeszcze jak to wygląda jeżeli mówimy o samym tak nasz kochany darmowy kolab dajcie mi chwilkę odpala mnie za czasie żeby się załadowały nasze biblioteki wszystko poszło dobra będziemy mieli wracamy do naszego skryptu więc zaczniemy od konfiguracji bo to jest bardzo ważne input file to jest ten plik z draftem, który wygenerowaliśmy w poprzedniej lekcji co zwrócimy czyli ten sam tekst tylko już wzbogacony oraz raport mi się wydaje, że taki raport może się Wam przydać w postaci JSON można to sobie później przetworzyć poszukać w łatwy sposób czy nawet dać do weryfikacji do modelu językowego, żeby jeszcze raz na przykład sprawdził, czy wszystko jest na pewno dobrze wstawione. Tak jak mówiłem, model główny, który nam będzie z websearchem, to jest 5 i 2, a ten do generowania pytań 4 i 1 mini. Oczywiście jest też tutaj wybór języka. To jest bardzo ważne, bo to jest, tak jak mówiłem, wymuszenie źródeł w danym języku. No i wpisujemy nasz keyword. Jakby na potrzeby tej lekcji ten keyword jest tutaj, ale jak będziemy łączyć cały pipeline, to wymyślimy sposób, pewnie jakiś sobie plik tekstowy, w którym będziemy mieli raz wpisane keyword intencje i te wszystkie rzeczy, które są nam potrzebne przy każdym kroku, żeby to było sprawniej. I teraz jeszcze poszukam tych patternów. Tak, to są te patterny. Chciałem tylko, żebyście zobaczyli, jak to wygląda. Każdy z tych kategorii ma swój pattern. I to jest też po języku, nie mówię po języku, w języku polskim, w języku angielskim. Więc widzicie czego tutaj szuka tych odpowiednich jednostek. Jeżeli nie znajdywałbym wam w jakimkolwiek artykule tych klejmów, to warto się przyjrzeć czy nie warto dodać tutaj jeszcze jakiś jednostek, metryk, po prostu których ja nie dodałem. Ja będę to robić za każdym razem, jeżeli zobaczę, że tych klejmów jest za mało. więc trzeba by było stworzyć dość dużą bibliotekę obszerną sobie tego wszystkiego żeby to dobrze działało na razie nasze potrzeby jest tego tyle no i dobrze i jeszcze oczywiście jedna rzecz wgramy sobie za chwilę nasz draft z poprzedniego kroku i odpalamy sobie całą procedurę w ten sposób na koniec czyli do kolejnego okienka i wtedy łatwiej do góry pość no i zobaczymy co tu się dzieje już wczytano draft i znaleziono zobaczcie jak szybko to mówiłem to jest regeks nie on po prostu błyskawicznie znajduje te klejmy i posegregował jest nawet jeden ze skorą 6 trend bo norma medyczna porównanie no i to jest to co mieliśmy też w przykładzie więc tych klejmów znalazł dużo zobaczcie tu już jest przy dwójce, to tylko porównanie trend, trend, trend, akurat dla nas tak naprawdę najważniejsze będą pewnie te teraz nastąpiło zobaczcie również jak szybko wygenerowanie pytań i to każdy klejm ma swoje pytanie o ile procent konflikt zol bazowy może wzrosnąć powyżej normy wskutek przewlekłego stresu jaka jest rekomendowana dziewna dawka standaryzowa waga ekstraktu asfagandy. Na przykład o ile procent cen trwający 7-9 godzin obniża poziom kortyzolu? Idealnie. Więc mamy już też odpowiedź. Potwierdzonych mamy aż 2. Nie zweryfikowanych mamy 12. I to są tutaj mamy wstawianie źródeł. Zobaczcie Medonet, Baby Keto. I tutaj też mamy nfo.pl, także działa to dobrze. Niestety potwierdzone mamy tylko dwa. To się będzie zdarzało. Niestety w internecie tych informacji odpowiadających na tak zadane pytanie nie zawsze jest dużo, ale mamy aż 12 niezweryfikowanych. Czyli możemy tak naprawdę spróbować sobie te dane wyszukać w jakikolwiek inny sposób i zaraz zobaczymy jak to wygląda już w samym artykule mamy już nasz artykuł szukamy sobie po frazie to powinno wyglądać jak już się tym zajmuje źródło no i mamy pierwsze tutaj mamy ustal jasne godziny na kofeinę i nie używaj do maskowania zmęczenia to jest to napisane wcześniej to jest odnośnie samego źródła Omega 3 bo to dotyczyło Omega 3 więc mamy tutaj tytuł tego źródła daty nie ma kiedy był dostęp do tej strony i sam adres URL szukamy dalej drugi mamy nie tutaj tutaj mamy dawkowanie typ zakresu dla dorosłych 300 600 dawkowanie asfagandy 300 600 miligramów. Czyli jest potwierdzone źródło. Fajnie, że to się potwierdziło. I mamy kolejne źródło. Med on end. Badanie kortyzolu normy. Tutaj mamy tą normę. Zobaczcie, super, że mamy to potwierdzone. Więc mamy trzy klejmy wstawione. Dużo i mało, ale zawsze lepiej trzy niż wcale. Ale zobaczmy nasz ten JSON też z tym odputem. gdzie tutaj macie informacje co nie zostało znalezione, nie zweryfikowane. Zacznę od tego, że tutaj jest korekta. Czyli mieliśmy, czekajcie, to trochę powiększe. Bez przesady. Tak, mamy źródło, klejem, który został poprawiony. Ten ostatni źródło Medonet, badanie kortyzolu. Tutaj mamy URL i oczywiście co zostało poprawione. więc super i tu mamy te źródła które zostały potwierdzone potwierdzone a reszta zobaczcie ile jest mamy niezweryfikowanych no i ten plik tak jak mówiłem pozwala wam jest są oznaczone te klejmy dokładnie czego nie znaleźliśmy być może warto by pochylić się jeszcze żeby było trochę więcej czasu nad sposobem wyszukiwania tych danych można też pamiętajcie że kierować naszego nasz websearch, nasz API LLM-a na konkretne strony, żeby tam wyszukiwał bądź w jakikolwiek inny sposób podnieść wyszukiwanie nie mówiąc już o nie wiem jak wygląda wyszukiwanie w LLM-ach przy websearchu, nie wiem, że to jest użycie Google albo Binga ale nie jestem pewien, natomiast jeżeli się dowiem, to was poinformuję bo to też jest bardzo ciekawe Na pewno można jeszcze się pochylić na tym, żeby te dane znaleźć. Także ja myślę, że można być zadowolonym z tego wyniku. Pewnie na niektórych artykułach będzie tych uzupełnionych, poprawionych bądź potwierdzonych klejmów więcej. Niektórych nie. Fajnie, że mamy trzy źródła wstawione. Już sugerujemy, że ten artykuł był sprawdzany w poszukiwaniu tych źródeł. i ma to nam dać dużego boosta nie tylko dla Google i modeli językowych, ale też dla użytkownika, który będzie nasz artykuł przeglądał. Także dziękuję Wam za tę lekcję. Mam nadzieję, że będziecie z tego korzystać. Myślę, że warto.

</details>

---

<div class="lesson-completion-bottom" data-lesson-id="ai-content-expert/blok-3/lekcja-3"></div>

<div id="sensai-comments"></div>


---

# 3.4 Optymalizacja i przejścia

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

<div style="position:relative;padding-top:56.25%;"><iframe src="https://player.mediadelivery.net/embed/565073/c064b7d3-b293-4aa3-bb29-1bb033d4a3f2?autoplay=false&loop=false&muted=false&preload=true&responsive=true" loading="lazy" style="border:0;position:absolute;top:0;height:100%;width:100%;" allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;" allowfullscreen="true"></iframe></div>

<br />

## 🎯 Cel lekcji

Zrozumienie i wdrożenie dwóch kroków post-produkcji artykułu: optymalizacji copywriterskiej (article check) oraz przejść narracyjnych (intermediate). Lekcja pokazuje, jak za pomocą dwóch skryptów Python i dwóch dedykowanych promptów poprawić styl, usunąć duplikaty i "AI-izmy", a następnie dodać naturalne przejścia między sekcjami — przy jednoczesnym zabezpieczeniu wszystkich danych i źródeł przed modyfikacją przez model.

---

## 📒 Notatka z lekcji

Lekcja łączy dwa kolejne kroki pipeline generowania treści — optymalizację (article check) i przejścia (intermediate). Oba kroki edytują istniejący artykuł, dlatego kluczową rolę odgrywa mechanizm ochrony danych przed modelem językowym.

**Powiązane pliki:**

- **Wejście:** `output_enriched.html` (wzbogacony artykuł z poprzedniej lekcji)
- **Wyjście krok 1:** `output_article_check.html` (artykuł po optymalizacji copywriterskiej)
- **Wyjście krok 2:** `output_intermediate.html` (artykuł z przejściami i formatowaniem)
- **Skrypty:** `article_check_educational.py` + `article_intermediate_educational.py`
- **Prompty:** `PROMPT_ARTICLE_CHECK.md` + `PROMPT_INTERMEDIATE.md`

:::caution[Dlaczego dwa kroki, a nie jeden?]
Model językowy nie jest w stanie wykonać wszystkich reguł w jednym zapytaniu — jest ich za dużo. Pogrupowanie reguł w osobne kroki (optymalizacja → przejścia → humanizacja) zapewnia lepszą jakość i kontrolę. Każdy krok ma jedną odpowiedzialność.
:::

---

### 1. Miejsce w pipeline

```
Draft → Wzbogacanie danymi → **Optymalizacja (article check)** → **Przejścia (intermediate)** → Humanizacja → Publikacja
```

Inputem jest artykuł wzbogacony źródłami z poprzedniej lekcji (`output_enriched.html`). Po obu krokach otrzymujemy artykuł z poprawionym stylem, usuniętymi duplikatami, naturalnymi przejściami i formatowaniem wizualnym (`output_intermediate.html`).

---

### 2. Problem utraty danych — dlaczego chronimy źródła i liczby

Każdy krok, w którym model edytuje tekst, niesie ryzyko utraty danych:

- **Liczby i daty** — model potrafi zmieniać wartości (halucynacja)
- **Cytaty źródłowe** — zmiana adresów URL, roku statystyk, przeformatowanie
- **Linki źródłowe** — nadpisanie prowadzi do 404

:::danger[Naczelna zasada]
Prompt traktuj jako prośbę — model może go zignorować. Mechanizm (regex) to gwarancja. Jeśli masz twarde dane, zabezpieczaj je programistycznie, nie instrukcją w prompcie.
:::

---

### 3. Hybrydowa ochrona danych (Hybrid)

Oba skrypty stosują ten sam dwupoziomowy mechanizm ochrony:

**Placeholdery SRC — dla źródeł (model nie musi ich widzieć)**

Regex wyszukuje cytaty źródłowe w artykule i zastępuje je tokenami `[[SRC_001]]`, `[[SRC_002]]` itd. Mapa `{placeholder → oryginalny cytat}` jest zapisana osobno. Model fizycznie nie widzi treści cytatu — nie może go zmienić.

**Spany z data-token-id — dla liczb i dat (model musi je widzieć)**

Liczby i daty opakowywane są w `<span data-token-id="NUM_abc123">20%</span>`. Model widzi wartość w kontekście zdania i może naturalnie dobierać słowa wokół niej, ale tag span z unikalnym ID pozwala po kroku zweryfikować, czy wartość przetrwała.

:::tip[Kolejność tokenizacji]
Zawsze najpierw placeholdery SRC (cytaty znikają z tekstu), potem spany NUM/DAT (działają na tekście bez cytatów). Gdyby regex NUM/DAT działał pierwszy, "wgryzłby się" w środek cytatu (np. rok 2024 wewnątrz źródła).
:::

---

### 4. Walidacja po każdym kroku

Po przywróceniu danych skrypt sprawdza:

| Brakujący element | Akcja |
|---|---|
| `[[SRC_x]]` (placeholder cytatu) | **HARD FAIL** — artykuł odrzucony |
| NUM/DAT (span danych) | **SOFT WARNING** — kontynuacja z ostrzeżeniem |

Krok 2 (intermediate) ma dodatkowe guardy: brak `<h1>` w output, wzrost długości > +10%, utrata liczb lub źródeł, dodane linki `<a>`, wykryto SEO intro — każdy powoduje hard fail.

:::note[Zapisuj każdą wersję artykułu]
Nie nadpisuj plików — zapisuj output każdego kroku osobno (output_enriched, output_article_check, output_intermediate). Jeśli coś pójdzie nie tak w późniejszym kroku, cofniesz się o jeden krok zamiast powtarzać cały pipeline.
:::

---

### 5. Krok 1: Optymalizacja copywriterska (article check)

Skrypt: `article_check_educational.py` | Prompt: `PROMPT_ARTICLE_CHECK.md`

Reguły copywriterskie redukują typowe "AI-izmy". Pięć kluczowych:

**O1: Zero pierwszej osoby (Reguła A)** — "Polecam X" → "X sprawdza się w praktyce". Pierwsza osoba (l.poj. i l.mn.) to jeden z najsilniejszych sygnałów tekstu AI.

**O2: Tonowanie śmiałych obietnic (Reguła E)** — "gwarantowane wyniki" → "oczekiwane wyniki", "rewolucyjny" → "skuteczny", "jedyny sposób" → "jeden ze sposobów". Model językowy nagminnie nadużywa superlatywów.

**O3: Redukcja rozkazów (Reguła F)** — Max 2-3 zdania rozkazujące na sekcję H2. "Sprawdź szybkość" → "Szybkość można sprawdzić za pomocą...". Dozwolone pytania retoryczne (max 1 na sekcję) — one robią lepszą robotę niż rozkazy.

**O4: Jedna definicja — jedno miejsce (Reguła C)** — Każdy termin definiowany tylko raz, przy pierwszym użyciu. Model potrafi wyjaśniać to samo pojęcie w nawiasie 2-3 razy w różnych miejscach tekstu.

**O5: Porządkowanie nawiasów (Reguła D)** — Nawiasy dłuższe niż 5 słów zamieniane na osobne zdanie lub usuwane. Max 1 nawias definicyjny na akapit. Cytaty źródłowe `(Źródło: ...)` są wyłączone — w podejściu Hybrid ten wyjątek obsługuje się automatycznie.

:::tip[Prompty też działają stand-alone]
Oba prompty można stosować bez skryptów zabezpieczających — bezpośrednio w ChatGPT jako "wersję light". Warto jednak potem porównać tekst przed i po, żeby sprawdzić, czy model nie zmienił danych.
:::

---

### 6. Krok 2: Przejścia i formatowanie wizualne (intermediate)

Skrypt: `article_intermediate_educational.py` | Prompt: `PROMPT_INTERMEDIATE.md`

Przejścia poprawiają flow artykułu — tekst przestaje wyglądać jak "raport AI" i zyskuje oddech.

**P1: Hierarchia informacji + oddech (Reguła G)** — Tekst nie może być jednorodnie gęsty. Po 2-3 gęstych akapitach z faktami powinien pojawić się lżejszy akapit przejściowy (mini-podsumowanie, pytanie retoryczne, zdanie łączące). Struktura: fakt (WAŻNE) → rozwinięcie (ŚREDNIE) → przejście (LEKKIE).

**P2: Naturalne przejścia narracyjne (Reguła H)** — 1-2 wtrącenia na sekcję H2. Typy: mini-podsumowania, przyznanie trudności ("To może brzmieć skomplikowanie, ale w praktyce..."), kontekstualizacja, pytania retoryczne. W prompcie są szablony — ale model musi je dopasować do tematu artykułu, nie kopiować dosłownie.

**P3: Formatowanie wizualne (Reguła K)** — Cztery narzędzia:
- `<strong>` — pogrubienie kluczowych terminów przy pierwszym użyciu i zaskakujących faktów (2-4 na sekcję H2)
- `<i>` — akcent na ważne stwierdzenia, terminy obcojęzyczne (1-2 na sekcję H2)
- `<blockquote>` — cytaty historyczne lub definicje (0-2 na cały artykuł)
- `<br />` — oddech wewnątrz gęstych akapitów, przed zdaniem kontrastującym (5-15 na artykuł)

**P4: Strażnik objętości** — Intermediate to przejścia, nie nowy content. Max +10% wzrostu długości artykułu. Przy 20 tys. znaków to max 2 tys. znaków na przejścia — ma upłynnić to, co jest, a nie tworzyć nowe treści.

---

### 7. Konfiguracja skryptów

Oba skrypty mają analogiczną strukturę konfiguracji:

- **Model** — GPT 5.2 (reasoning + websearch) lub Claude 4.5 Sonnet, temperatura niska
- **Input/output** — ścieżki do plików HTML (output poprzedniego kroku = input następnego)
- **Raport JSON** — generowany po każdym kroku z metrykami: ile źródeł chroniono, ile spanów przetrwało, wzrost długości, zastosowane reguły

:::note[Inne modele]
Oba kroki działają dobrze również na GPT-4.1 (temperatura 0.5) — tańsza alternatywa. Przy zmianie modelu warto przetestować, czy prompt jest odpowiednio wykonywany, bo różne modele różnie traktują te reguły.
:::

---

### Podsumowanie

Optymalizacja i przejścia to dwa kroki post-produkcji artykułu, które pracują na istniejącym tekście — nie dodają nowej treści, a poprawiają styl i flow. Kluczowy jest mechanizm hybrydowej ochrony danych (placeholdery SRC + spany NUM/DAT), który gwarantuje, że źródła i liczby przetrwają edycję modelu. Każdy krok generuje raport JSON i waliduje output — brak źródeł = hard fail. W następnej lekcji zajmiemy się humanizacją treści.

## 📚 Materiały dodatkowe























---

<details>
<summary>📝 Transkrypcja wideo</summary>

Cześć, doszliśmy do lekcji, w której będziemy już pracować na całym gotowym artykule. W poprzednim kroku zrobiliśmy, tak naprawdę zrobiliśmy artykuł, później go wzbogaciliśmy danymi, więc teraz już mamy gotowy materiał do obróbki.

I w tej lekcji pierwszy raz zajmiemy się dwoma skryptami, dwoma krokami na raz, dlatego że łatwiej będzie mi to nagrać jako jedną lekcję i myślę, że oba kroki są dość podobne. W obu musimy zastosować te same zabezpieczenia do danych, ale mają po prostu różne reguły.

Także z ogłoszeń organizacyjnych oczywiście macie dwa skrypty i macie dwa prompty. Ja promptów na tej lekcji omawiać nie będę, omówię po pięć najważniejszych reguł z każdego z tych kroków. Natomiast jeżeli chcecie sobie przeczytać dokładnie wszystkie reguły, których ja używam do tych obu kroków, to musicie sobie przeanalizować prompt. Promptów też możecie używać bezpośrednio w czacie GPT na przykład. No i w tym razem też dodałem dość duży opis, już nie tutaj w lekcji, tylko w samym pliku z promptem. Macie nie sam prompt, ale też dokładnie opisany. Pomógł mi Cloud dokładnie, co to jest, co jest inputem, co jest outputem.

Także w tej lekcji zajmiemy się optymalizacją. To jest pierwszy krok. Taką deduplikacją przede wszystkim, bo mimo wszystko, że wykorzystujemy nie ChatGPT, tylko OpenAI GPT-5, tą serię tych wszystkich modeli reasoningowych po to, żeby przekazać poprzednie ID wątku, było to na lekcji, to tak naprawdę powstają pewne duplikacje. Jakby nie da się tego uniknąć, bo wiadomo model językowy nie jest deterministyczny. Więc ta odpowiedź nigdy nie jest taka, jaką byśmy chcieli. Więc te duplikacje trzeba jeszcze raz sprawdzić i usunąć.

Także to jest pierwszy krok, a drugi to jest, ja to nazywałem przejścia. To jest intermediate, czyli wiecie, jak pisze człowiek, to potrafi gdzieś wrócić do jakiegoś poprzedniej sekcji, gdzieś nawiązać. Natomiast model językowy tego nie robi. No i tutaj to główne zadanie tego kroku to jest zrobienie tych przejść. Przede wszystkim przejść pomiędzy sekcjami a kapitami, ale też jakieś odwołania do rzeczy, które były już wcześniej w treści. To też jest pewien proces na humanizację.

Dlaczego to wszystko jest w osobnych krokach? Bo jest jeszcze humanizacja, która jest duża i tam jest bardzo dużo reguł, więc jeszcze jest osobnym krokiem. Dlatego, że model nie jest w stanie sam tak naprawdę zrobić to wszystko w jednym kroku, w jednym zapytaniu. Z tych reguł jest za dużo, więc ja je pogrupowałem w te trzy rzeczy, czyli ta optymalizacja z duplikacją, to jest taki article check, czyli sprawdzenie też wszystkiego, co tam nam powstało w poprzednich krokach. Drugi to są te przejścia i trzeci to jest humanizacja. I pomiędzy nimi gdzieś w nich są zawarte też reguły do czytelności, do poprawy czytelności, przenoszenia na przykład do nowych linii, czy jakieś inne wszystkie rzeczy, które mają wizualnie uatrakcyjnić nasz ten artykuł i sprawić, że użytkownik też będzie mógł go bardzo dobrze przyswoić i odebrać.

Także za chwilę zaczynamy już tradycyjnie w tym bloku prezentację i opowiem wam co tam się dzieje.

Dobrze, to jedziemy z teorią, czyli jeszcze raz wracamy do dzisiejszej lekcji. To jest optymalizacja i przejścia, czyli dwa kroki, więc ta prezentacja też będzie trochę dłuższa. Zaczniemy przede wszystkim od omówienia tego, jak będzie wyglądał ten wewnętrzny pipeline w przypadku tych dwóch kroków i co jest najważniejsze, tutaj dużą uwagę musimy zwrócić na ochronę danych.

Dlaczego chronimy dane? Dlatego, że każdy z tych kroków, tak jak już wcześniej wspomniałem, może spowodować, że jakikolwiek model będzie użyty przez własny językowy, on może zmieniać te dane, może je nadpisywać. A pamiętajcie ile czasu, ile staraliśmy się jak bardzo, ile czasu poświęciliśmy na to, żeby te dane przygotować, żeby mieć ten knowledge graph, czyli ten nasz graf wiedzy, żeby zrobić bardzo dobrze query fan-out i teraz ostatnio nawet wzbogacić te dane faktycznie statystykami, danymi popranymi gdzieś z sieci. Więc szkoda by było to po prostu w taki głupi sposób stracić.

Więc tak, jesteśmy w pipeline. Wzbogaciliśmy dane i teraz następuje taki krok, który ja nazywam article check, czyli to jest optymalizacja. Tutaj sprawdzamy wszystko, co do tej pory było, żeby przede wszystkim, tak jak mówiłem na początku, usunąć duplikaty i zobaczyć, czy nie ma jakichś ważniejszych, dużych błędów. Później drugi krok, tak jak wam powiedziałem, połączymy to razem, czyli to są dwa osobne skrypty, a to są dwa kroki. I tutaj są przejścia i o tych przejściach za chwilę opowiem.

I tutaj bardzo ważne dwie rzeczy. To ta ochrona, hybrydowa ochrona, która chroni nam źródła i chroni nam dane. I na koniec nasz input i output, czyli zaczęliśmy z artykułem, który jest wzbogacony, a dostaniemy output po tych dwóch krokach z artykułem, który ma już ten intermediate, czyli to są te przejścia, o których mówiłem.

Problem utraty danych. Tak jak wspomniałem, liczby i daty są często zmieniane przez modele językowe i dostajemy fałszywą informację, czyli dostajemy to naszą halucynację. Tak samo jeżeli chodzi o cytaty źródłowe. Niejednokrotnie mi się zdarzało, że były zmieniane adresy URL, bądź na przykład rok tych statystyk, które pobieraliśmy. No i same URL też były zmieniane i też wcześniej miałem się te źródła, więc później to jest nieaktywny link 404, która co prawda my jej nie mamy jako hiperłącze, ale i tak jakby tracimy wszystko to, co zrobiliśmy w poprzednim kroku.

Więc nawet jeżeli dajemy instrukcję wielokrotnie, serio naprawdę z tymi dwoma krokami się namęczyłem bardzo mocno, to model tego nie pilnuje. Także musicie pamiętać jedną naczelną rzecz, która i tak jakby powinna wam przyświecać od samego początku, że traktujcie prompt raczej jako prośbę, ale jeżeli zrobicie to za pomocą mechanizmu, czyli tak wspomnianych już wcześniej na różnych lekcjach przeze mnie regexów, to to jest już gwarancja.

Więc jak to wygląda? Mamy dwa mechanizmy. Jeden mechanizm, tak jak wspomniałem, chroni źródła, czyli tutaj macie też SRC, czyli jest taki placeholder. Co to jest placeholder? Regex wyszukuje źródła w naszym artykule i zamienia go w taki po prostu w podwójny nawias kwadratowy z takim prefiksem SRC i oznacza go X, czyli tam źródło pierwsze, drugie, trzecie. I w ten sposób będziemy mieli to chronione źródło. Model nie zmieni tego. Jeszcze spróbowałem, więc tego oznaczenia model nie zmieni, więc ono jest zabezpieczone. No i wyszukuje to regex, czyli Python. Czego szukamy? Cytatów źródłowych. Wiemy jak dobrze one wyglądają, bo sami je ustawiliśmy. One są w nawiasie, jest data, więc znalezienie tego nie jest żadnym problemem.

I druga rzecz. Tutaj ten drugie podejście, ten drugi mechanizm to jest span data-token-id. Czyli tutaj mam trochę już inne podejście, dlatego że gdybyśmy w podobny sposób zamienili na pewien token, pewną zmienną wszystkie dane, które mamy, to zobaczcie, przy takich ważnych krokach jak optymalizacja artykułu lub przejścia, to model nie widzi ich i kurczę chyba nie jest na kontekstu. I wtedy może nam zmieniać ten artykuł nie w taki sposób, jaki byśmy chcieli, albo zacznie wstawiać nam jakieś liczby w innych sekcjach artykułu. Więc my chcemy tak naprawdę przesłać to do modelu dalej, żeby to były nasze statystyki, dane itd., ale jednocześnie je zabezpieczyć. Więc ja je łapię w takim spanie z ID, data-token-id na przykład tak, z takim specjalnym oznaczeniu, więc mamy dwie pieczenie na jednym ogniu, bo mamy i zabezpieczone to w pewien sposób i tutaj jest regex, który łatwo to może wyciągnąć i jednocześnie mamy to przekazane do modelu.

Także tak to by wyglądało. Jak to wygląda w kolejności tokenizacji, jak to wygląda w praktyce? Jak zachowuje się to nasz skrypt Python? Jeden i drugi tak naprawdę. Czyli na początku to co mówiłem następuje ten regex dla źródeł, SRC to źródło i cytaty zamieniamy na ten token, możemy to nazwać tokenem. Później wyszukujemy wszystkich liczb, dat, wszystkich danych mierzalnych, które mamy. Oczywiście to jest kwestia zdefiniowana i w naszym skrypcie, więc jeżeli czegoś nie wychwytuje u was, to zobaczcie czy ten regex, który mam na pewno nie jest unikalny, na pewno nie jest samowystarczalny, na pewno trzeba będzie dopisywać jakieś rzeczy, których nie znajdzie, ale możecie to też robić sami.

I później mamy przekazanie tego już artykułu, który ma to tak oznaczone i zamienione do modelu, czy to są te placeholdery i tokeny plus spany. No i dobrze, ważną jakby częścią tego mechanizmu, tego zabezpieczenia tych danych, i mówię to też z punktu widzenia wykorzystania tych mechanizmów w innych krokach, czy w innych rzeczach, które przesyłacie do modelu. Jeżeli macie już twarde dane, to pamiętajcie o tym, żeby je zabezpieczać. Nie musi być tylko w tych krokach. Możecie to łączyć dowoli.

Warto to sobie zwalidować, bo skoro mamy regex, to wiemy dokładnie, gdzie są te dane. Mamy pozycję ich w tekście. Możemy je sprawdzić z powrotem, więc po przywróceniu warto to sprawdzić i sobie sprawdzić, czy jest taka sama ilość tych spanów, które były, czy tych tokenów SRC. Więc to jest bardzo ważne. My to robimy, skrypt to robi i jeżeli czegoś brakuje, to jest niestety hard fail i ja nie zrobiłem obsługi wznowienia, więc jeżeli nie będzie wam przechodzić, to coś jest nie tak z tymi danymi. Czyli model może trzeba będzie zmienić prompt, czy może np. inny model niż GPT 5.2 przykład może zupełnie inaczej to traktować. Trzeba będzie ten prompt dostosować.

Jeżeli brakuje nam danych, no to zrobiłem soft warning. Ale tu też możecie sobie zrobić taki krok, który wam zatrzyma i poinformuje was, że jednak ej słuchaj Maciek, coś się zmieniło w tym tekście i to nie na korzyść, bo tam brakuje danych. Więc tutaj wszystko zależy od was, to macie w skryptach, możecie to sobie zatrzymać.

I jeszcze dodam jedną rzecz, o której wspomniałem wcześniej, są dwa prompty. Więc to co się dzieje w środku też, jeżeli chodzi o same reguły, o których zaraz powiem, możecie stosować bez tych mechanizmów zabezpieczeń, bez Pythonów, więc możecie sobie wziąć swój prompt, możecie się nie zabezpieczać i po prostu zrobić taką wersję light tych kroków bez zabezpieczania się, ale zobaczcie, radzę wam później sobie porównać nawet w jakimś czacie tekst, który ma dane i po tych krokach, czy tam za dużo się zmieniło, ale to ładnie każdy model wam zrobi.

No i dobra, zaczynamy od tego pierwszego kroku, czyli od tego naszego article check. Tam reguł jest sporo. Te reguły są też nazywane literami, więc możecie sobie do nich trafić. Ja dla każdego z tych kroków wziąłem pięć, no nie wiem czy najważniejszych, ale po prostu dla przykładu chciałem wam pokazać co tam się dzieje i pięć omówię, natomiast całą listę macie w prompcie, jednym i drugim. Możecie również też coś dopisywać, tylko pamiętajcie, żeby nie przesadzić z tą ilością tych poleceń, tych reguł, dlatego że model przestanie je wykonywać. Też zwracacie uwagę na konflikty, żeby reguły siebie nie wykluczały nawzajem, bo model dostanie kręćka.

Pierwsza reguła to zero pierwszej osoby. To też zależy od tego, w jakim przeznaczeniu jest wasz tekst. Ja te reguły zbierałem jakby współpracując z dużymi firmami, które zamawiały teksty. Pewne rzeczy wyciągnęłem od nich i bardzo mi się to one podobały, bo całość na koniec końców, całość wychodzi bardzo dobrze. Tonowanie obietnic. To jest chyba jedna z najważniejszych reguł w tym kroku, ponieważ wiecie jak potrafię pisać każdy model językowy. Redukcja rozkazów. To takie też zabezpieczenie. Że teraz musisz coś zrobić i tak dalej, no nie wiem z kortyzolem na przykład nie?

Jedna definicja naraz. Model potrafi się rozpisywać z definicjami i też potrafi te definicje powielać. Jeżeli omawiamy pojęcie kortyzolu, to on potrafi je wyjaśnić w nawiasie jeden raz i przy następnym wystąpieniu jeszcze ze dwa, trzy razy. To jest raz, że jedna definicja na raz w całym tekście, ale też, że jedna definicja raz, żeby tekst nie był nasycony definicjami obok siebie. Bo tak się zdarza. Czyli na przykład pewne pojęcie można wyjaśnić później, jeżeli dużo definicji było już wcześniej.

No i te nawiasy nieszczęsne, które model sadzi i sadzi, więc to jest taka reguła, która w tych nawiasach redukuje do maksymalnych pięciu słów, żeby to było raczej takie uzupełnienie.

No i teraz trzy reguły jeszcze chwilkę trochę uzupełnimy, rozwiniemy. Czyli wrócę do tej jednej definicji naraz. Jedna definicja, jedno miejsce. Tak jak mówiłem termin wyjaśniamy raz. I tylko przy pierwszym użyciu. Później jakby prosimy model, żeby tego nie robił.

Nawiasy. To co mówiłem maksymalnie pięć słów. I teraz słuchajcie, jeżeli model jakby twierdzi, że lepiej jest dać — dziwne powiedziane — ale jeżeli model próbuje na siłę zrobić więcej tych słów, to trzeba mu powiedzieć, że zrób z tego osobne zdanie. Że po co wyjaśniać w długim nawiasie, jeżeli to może być osobne zdanie obok. Słuchajcie, fajnie to będzie wyglądało. To jest trochę takie uzupełnienie. Znowu jakiś przepływ fajny jest. Znowu odświeżamy nasz artykuł. No i oczywiście to są wyjątki, czyli nasze te cytaty, które też są w nawiasach, pamiętacie? To jest źródła.

I redukcja rozkazów. Czyli max 2-3 zdania rozkazujące na sekcję H2. Dozwolone pytania retoryczne. Bo to jest coś, co nam robi robotę. Czyli wolimy, żeby model nam raczej zamienił takie rozkazy na pytania retoryczne. To takie dające trochę zastanowienie się, niż żeby to było w trybie nakazu.

Jak to wygląda w praktyce? To tak parę tylko sztuk dla porównania, bo tego jest więcej. Oczywiście, czyli jakby AI heavy, czy to takie bardzo znamienne dla AI pisanie, czyli "polecam X", więc po zamianie będzie to wyglądało "X sprawdza się w praktyce". "Uważam, że warto?" — "Warto rozważyć". "Gwarantowane wyniki?" — "Oczekiwane wyniki". Nie ma gwarancji, pamiętajcie. "Rewolucyjny?" — jak czytacie teksty AI, wiecie, że słowo rewolucyjny jest nadużywane — "Skuteczny". "Jedyny sposób" — "Jeden ze sposobów". I tak dalej, i tak dalej. Więc ten krok, jak widzicie, bardzo dużo nam zmienia. I nie tylko wizualnie, jeżeli chodzi o sam tekst, ale też przede wszystkim o jego zawartość. I to też jest pewna część humanizacji.

I teraz przejścia. Porozmawiamy sobie o przejścia. Tutaj też omówimy sobie parę reguł. Będą cztery, przepraszam. Ja się pomyliłem. To też jest tak, słuchajcie, że ja nie uczę się na pamięć tych prezentacji. Generuję, powtarzam, ale nie zawsze zapamiętam, ile było tych reguł. Chciałbym po prostu, żebyście mieli to w jasny sposób przekazane wizualnie, a nie na tle tekstu.

Dobra, mamy cztery narzędzia. Reguła, ona jest oznaczona jako G, czyli hierarchia plus oddech. Zaraz to sobie omówimy. Przejścia narracyjne, tak jak sama nazwa wskazuje tego kroku, to jest chyba najważniejsza rzecz w tym wszystkim. Formatowanie wizualne. Tutaj ta czytelność jest bardzo ważna, więc żeby ten artykuł zupełnie lepiej się czytało i żeby łatwiejszy był w odbiorze, to też robimy te formatowanie wizualne. No i jeszcze jest jedna rzecz, strażnik nasz. Musimy też stawiać strażnika, dlatego że to są tylko przejścia. I tutaj 10% wzrostu to już jest maks. Jeżeli artykuł ma 20 tysięcy znaków, no to do 2 tysiące znaków na przejście. To jest bardzo dużo. To raczej ma upłynnić i zamienić to, co jest, niż tworzyć nowy content.

I teraz reguła G. Hierarchia informacji. I to jest ważne, słuchajcie. Ważny jest fakt. Później dopiero jest, że średnią wagę ma rozwinięcie i później jest lekkie przejście. Czyli jeżeli mamy gęste akapity, takie naprawdę nasiąknięte ciężkimi rzeczami, faktami, to trzeba dać jakiś lżejszy akapit przejściowy. Czytelnik potrzebuje przerwy. To mi się bardzo podoba. Trochę oddechu, żeby mózg mógł też przetworzyć te wszystkie dane, żeby to nie było wszystko zwalone naraz po prostu. Mimo, że my też staramy się wymusić ten bluff i ten dostarczenie informacji wszystkich, to jednak jeżeli są jakieś definicje, ciężkie rzeczy, fakty, to warto jest od siebie trochę odgrodzić, aby zrobić te czytelnikowi chwile.

No i te przejścia narracyjne, jeden do max dwa wtrącenia na sekcję, jakieś mini podsumowania, kontekst, kontekstualizacja, trudne słowo. Chodzi o to, żebyśmy zostali w kontekście, żebyśmy — to są te takie wtrącenia, o których mówiłem albo odwołania do innych sekcji. To jak zobaczycie sobie prompt, to są szablony w tym prompcie, ale te szablony to mają być raczej jako przykład i model musi je po prostu dopasować do tematu. Jeżeli będziecie robić dużo artykułów i będziecie używać tego promptu i okaże się, że powstał jakiś pattern odnośnie tych przejść, to proszę zaedytujcie te przejścia, dodajcie inne bądź zmieńcie prompt tak, aby on używał czegoś innego. Natomiast ciężko jest dać modelowi w tym samowolkę, on nie za bardzo rozumie o co chodzi, więc tutaj te szablony muszą być.

No i to formatowanie wizualne, o którym powiedziałem, to wszyscy już wiecie, przecież na pewno to znacie. Strongi, kursywy, cytaty, ten blockquote, który jest fajny. Też cytuję definicję, to się fajnie czyta. No i BR, czyli przejście, nie nowy akapit, nie nowa P, paragraf, przepraszam, tylko BR, czyli jesteśmy dalej w myśli, ale jakby żeby łatwiej się czytało te nowe zdanie, które nie dotyczy bezpośrednio jednego wątku, gdzieś tam przeniesione, żeby był ten oddech znowu.

No i teraz są jeszcze te nasze strażnicy. Ale to jest tak, że rzeczywiście to jest bardzo ważne, żebyście sprawdzali. Ja tych guardów robię dość dużo, żeby był hard fail. I to mi się sprawdza. Zdarza się, że na produkcji robi się sto artykułów i patrzę, że się zatkało. Jest hard fail na jednym, dwóch artykułach. To wtedy poprawiam coś albo w artykule, albo w samym prompcie, albo we ścieżce, żeby to jednak przechodziło i w ten sposób udoskonalam sobie cały pipeline. To nie jest tak, że mam np. tutaj model dopisuje za dużo treści, to ja to zostawię. Nie, może tak być i muszę tak zmienić prompt, tak zmienić skrypty, żeby tego nie robił i dopiero wtedy puszczam dalej. To wtedy będę wiedział, że jakość tego artykułu po nawet różnych failach, no będzie dobra, nie ma tu kompromisów. Prawda?

Dobra, i teraz tak, jak to wygląda, już podsumowując, jak to wygląda, jeżeli chodzi o same pliki i o całą dzisiejszą lekcję. Zaczęliśmy od inputu z tego output enriched, czyli tego zbogaconego danymi. Później idzie article check. To też jest takie przejście. A, i słuchajcie, bardzo ważne, wiem co chciałem powiedzieć w tym kroku. Ja sobie zapisuję wszędzie wszystkie wersje artykułów. Jeżeli mieliśmy draft, zapisuję draft. Później mieliśmy wzbogacony, zapisuję wzbogacony osobno. Nie nadpisuję plików. Znaczy ja to trzymam w bazie danych, więc nie nadpisuję tych wartości. Później mogę to zrobić jeszcze 3-4 razy. Dlaczego? Dlatego, że wtedy łatwo się cofnąć o krok. Jeżeli po artykule stwierdziłem, że w humanizacji mi coś nie wyszło, no to usuwam tylko ostatnie kroki. Na każdym kroku mam poprzedni output i input. Więc to jest bardzo ważne, żebyście to zapisywali. Dajcie sobie nazwę kroku, tak jak ja tutaj robię, na przykład albo article check dodać jeszcze output albo dodać słowo kluczowe. Trzymacie się tego, to jest bardzo ważne. Oszczędzi wam to dużo czasu później i tokenów.

No i następuje intermediate, czyli tutaj jest wejściem jest plik z poprzedniego, czyli ta wersja artykułu z article checka. Tutaj output jest intermediate. No i też tak jak w poprzednich krokach staram się jak najwięcej raportować do pliku JSON. Po to, żebym mógł widzieć co tam się wydarzyło. Jeżeli mam problem z jakimś krokiem i model mi nie generuje tego co — nie zmienia tego o co prosiłem — to jest złoto informacje w takim raporcie, to jest złoto po prostu. Poza tym tam jest ochrona jeszcze, tam są źródła zapisane te, które mieliśmy chronić, więc gdyby nam coś wypadło, nadpisało się i tak dalej, to zawsze możemy się cofnąć używając tego.

No i tak jak mówiłem, powiązane pliki są dwa skrypty i dwa prompty. Skrypty za chwilę sobie uruchomimy i odpalimy i spróbuję to w jakiś sposób porównać za pomocą nie modelu językowego, bo nie będę wam czytał tych artykułów, tylko zobaczymy co się zmieniło. Może nam tu model fajnie to gdzieś wskaże, żeby to zwizualizować.

Także to jest wszystko. Widzimy się za chwilę. Będziemy robić skrypty.

I została nam ostatnia część tej lekcji. Praktyczna, ale powiem wam szczerze, że chyba szybko nam przejdzie, bo chciałbym, żebyście się sami pobawili tymi skryptami i tymi promptami.

Szybkie omówienie, czyli ten skrypt optymalizacja i sprawdzenie. Jak zawsze tutaj jest GPT 5.2. Sprawdźcie inne modele, co tam lubicie tak naprawdę. Input, output i ten plik z raportem, który tak jak mówiłem zawsze się gdzieś tam przydaje prędzej czy później. Choćby do debugu, choćby żeby znaleźć problem albo przywrócić na przykład poprzednią wersję.

Tu to macie też temperatura, ustawienia tokenów i tyle. Ja wam pokażę jak to wygląda już na wyjściu, ponieważ same skrypty, już doszliśmy do momentu, w którym te artykuły są długie. Jeżeli to wysyłamy wszystko do modelu, to wiadomo, że ten model będzie to miał dużo dłużej i tutaj też są zjadacze tokenów, pamiętacie. Więc jeżeli to jest reasoningowy model, to też to uwzględnijcie. Fajnie to działa też na GPT na przykład 4.1 na takiej temperaturze 0.5.

No i tak jak tu widzicie, article check, wszystko mamy w logach, to co zostało użyte, to o czym mówiłem, te źródła, które zostały, są tu te przykłady pokazane tych źródeł. Wysłanie, odpowiedź, debug, znalazł wszystkie nasze źródła i zamienił. I tak samo jest z tymi danymi. Więc tutaj walidacja i przywracanie danych, wszystko jest OK, wszystkie źródła placeholder, wszystkie — zobaczcie nawet jest 86 tych spanów z danymi i żadnego nie zgubiliśmy, wszystko jest przywrócone.

No i następny skrypt, podobna zasada działania, taki sam sposób robienia, czyli ten input jest inny, bo to jest z tego z article checka, więc na to zwróćcie uwagę. No i tu macie output i oczywiście raport.

Co jest ważne? Ważne jest to, że możecie tutaj wrzucać każdy tekst, który robiliście na przykład na czacie albo gdzie indziej. Możecie te dwa kroki wykorzystywać do tego, żeby usprawniać te artykuły wasze bez jakby potrzeby zachowania tego pipeline'u. Ja bym z tego zrobił na przykład jakiegoś skilla, choć nie wiem czy jeden skill to nie za mało, może więcej kroków, ale możecie to po prostu jakieś stand alone zrobić z tych dwóch kroków.

I teraz specjalnie, jakby popracowałem chwilę z modelem, po to żeby wam pokazać, jak to wygląda w praktyce, bo naprawdę bardzo ciężko jest mi czytać ten tekst i pokazywać, co się zmieniło, to zobaczcie na to. Tu przygotowałem dla was tutaj z Claudem takie podsumowanie, tylko sobie przewinę na początek. Nie będziemy oczywiście tego wszystkiego czytać. Chciałem wam pokazać skalę, dlatego użyliśmy kolorów oczywiście, wszystko to co zostało article checkiem czy optymalizacją zrobione, to jest na żółto. To co wykreślone, to jest na czerwono. I też tutaj macie na przykład ilość zmian po tej stronie. Więc tutaj widać też, jaka jest różnica w długości, w zmianach. Wszystko jest tutaj pokazane.

Ale najważniejsza jest rzecz dla nas taka, że widzicie wizualnie, jak dużo zmian dokonują obie metody. I to jest porobione nagłówkami, sekcjami. Więc pokazane najpierw jakich zmian dokonała article check w pierwszej sekcji i jakich zmian intermediate. I tu już widzicie też ile zmian, ile strongów dodał, jak to tutaj fajnie wyszło. Macie kolejne zmiany, 14 zmian, jedna zmiana. Ten intermediate będzie mniej zmieniał, ale te przejścia są bardzo ważne. Więc tutaj bardzo też mocno kontekstowo pracuje intermediate.

No i widzicie następne. Więc sporo nam zwłaszcza article check zmienia. I to też tak jak mówiłem wcześniej, to jest kwestia, to już jest pewien krok do humanizacji. Robimy go wcześniej, zobaczcie jakie duże ilości. Praktycznie wszystko tutaj przepisał, żeby było zgodnie z tym co mieliśmy. No i tak dalej.

Także widzicie teraz jakie to są możliwości, jakie są skale zmian. Do końca artykułu jeszcze gdzieś będą zmiany. Więc przybliżamy do super jakości ten nasz artykuł, a w następnej lekcji zajmiemy się już jego humanizacją, czyli ostatnia lekcja w tym bloku. Ta humanizacja to będzie też duża lekcja. Dzięki.

</details>

---

<div class="lesson-completion-bottom" data-lesson-id="ai-content-expert/blok-3/lekcja-4"></div>

<div id="sensai-comments"></div>


---

# 3.5 Humanizacja treści

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

<div style="position:relative;padding-top:56.25%;"><iframe src="https://player.mediadelivery.net/embed/565073/4df156ee-3407-465b-876f-25f4adf81496?autoplay=false&loop=false&muted=false&preload=true&responsive=true" loading="lazy" style="border:0;position:absolute;top:0;height:100%;width:100%;" allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;" allowfullscreen="true"></iframe></div>

<br />

## 🎯 Cel lekcji

Zrozumienie, jak detektory AI rozpoznają maszynowy tekst (perplexity, burstiness), oraz poznanie 20 konkretnych reguł anty-AI pogrupowanych w 4 tiery — od sygnałów krytycznych po metryki detektorów. Na koniec: automatyzacja humanizacji za pomocą skryptu Pythona z promptem zawierającym wszystkie reguły.

---

## 📂 Materiały do pobrania


  
  
  
  
  
  
  
  


---

## 📒 Notatka z lekcji

Tekst generowany przez AI jest wykrywalny, bo jest statystycznie przewidywalny. Detektory mierzą konkretne sygnały językowe — i każdy z nich da się celowo zaburzyć. Ta lekcja pokazuje 20 reguł pogrupowanych w 4 tiery priorytetów, a na koniec — skrypt Pythona, który stosuje je automatycznie.

### 1. Jak detektory AI rozpoznają maszynowy tekst

Detektory opierają się na dwóch głównych metrykach:

**Perplexity (zaskoczenie językowe)** — mierzy, jak „zaskakujący" jest kolejny wyraz w zdaniu. Tekst AI ma niski perplexity — jest przewidywalny. Tekst ludzki ma wysoki perplexity — nietypowe słowa, idiomy, skróty myślowe.

**Przykład:** AI napisze: _„Regularna aktywność fizyczna przynosi liczne korzyści dla zdrowia organizmu."_ Człowiek napisze: _„Ruszaj się codziennie, a ciało ci podziękuje — cholesterol spadnie, sen się poprawi, a plecy przestaną wyć po 8 godzinach przy biurku."_

**Burstiness (zmienność strukturalna)** — mierzy, jak zróżnicowana jest długość i struktura zdań. AI pisze monotonnie — zdania podobnej długości. Ludzie piszą „skokowo" — krótkie przeplatane długimi.

**Przykład:** AI: _„Witamina D wspiera układ odpornościowy. Witamina D pomaga w absorpcji wapnia. Witamina D jest syntetyzowana pod wpływem promieni słonecznych."_ (3 zdania: 6, 8, 8 wyrazów). Człowiek: _„Witamina D to nie tylko wapń i kości. Robi znacznie więcej — reguluje odporność, wpływa na nastrój, a jej niedobór wiąże się z wyższym ryzykiem depresji sezonowej. Większość Polaków ma za mało. Zwłaszcza zimą."_ (8, 18, 5, 2 wyrazy).

**Dlaczego „napisz po ludzku" nie działa:** LLM optymalizuje pod najbardziej prawdopodobny output. Generyczna instrukcja = generyczny wynik. Podejście w tej lekcji to konkretne, mierzalne reguły z priorytetyzacją (Tier 1-4), stosowane jednocześnie w jednym przejściu.

**Pro Tip:** Przy rozbudowie promptu nie dodawaj kolejnych reguł — wpleć nowy sygnał w istniejącą regułę. W wersji v5.3 pipeline'u dodano 3 osobne reguły: wykrywalność AI skoczyła z 10% do 58%, bo model zaczął gubić reguły z Tier 1 na rzecz nowych.

---

### 2. Tier 1 — sygnały krytyczne

Tier 1 ma największy wpływ na klasyfikację. Sama reguła rytmu zdań (Reguła 3) potrafi zmienić wynik z „AI" na „HUMAN".

**Reguła 1 — Zakazane słownictwo AI.** AI używa pewnych słów **2.7x częściej** niż ludzie. Lista obejmuje ok. 60 wyrazów. Cel: 0 wystąpień.

| Zakazane | Zamiennik |
|---|---|
| additionally, furthermore, moreover | usunąć lub zacząć zdanie bezpośrednio |
| utilize | użyć / stosować |
| comprehensive | dokładny / szczegółowy / pełny |
| facilitate | ułatwić / pomóc |
| leverage | wykorzystać |
| transformative | opisać konkretną zmianę |
| unprecedented | podać skalę liczbowo |

**Reguła 2 — Zakazane tranzycje-drogowskazy.** AI zaczyna zdania od „However", „Moreover", „Furthermore" **1.6x częściej**. Limit: max 1 na 500 słów (preferowane: 0). Zamienniki: „Ale", „I", „Więc", „Tyle że" — lub po prostu zacznij zdanie bezpośrednio.

**Reguła 3 — Rytm zdań (najsilniejszy sygnał).** Ludzie mają **40%+ wyższą wariancję** długości zdań. Mieszaj agresywnie: krótkie (4-8 wyrazów), średnie (12-18), długie (22-30 z podzdaniami i myślnikami). Nigdy 3+ kolejne zdania o podobnej długości. Cel: współczynnik zmienności (CV) > 0.45.

**Przed (CV ≈ 0.08):** _„Kwas foliowy jest niezbędny w ciąży. Odpowiada za prawidłowy rozwój cewy nerwowej. Zalecana dawka to 400 mikrogramów dziennie."_ (5, 6, 6 wyrazów)

**Po (CV ≈ 0.70):** _„Kwas foliowy w ciąży? Absolutnie kluczowy. Odkryto to w latach 90., kiedy badania na dużych populacjach pokazały dramatyczny spadek wad cewy nerwowej. Dziś WHO zaleca 400 µg dziennie — i ta rekomendacja prawdopodobnie się nie zmieni."_ (4, 2, 17, 12 wyrazów)

**Reguła 4 — Otwieranie akapitów.** AI zaczyna abstrakcyjnie: _„Rola/Rozwój/Znaczenie/Wpływ..."_. Zacznij konkretem: datą, liczbą, nazwiskiem, krótkim stwierdzeniem lub pytaniem.

**Reguła 5 — Zamykanie akapitów.** AI zamyka wzorami: _„Ta kombinacja...", „To podejście..."_. Człowiek kończy konkretem albo punchline'em. Ostatni akapit nie powinien podsumowywać tego, co już powiedziano.

---

### 3. Tier 2 — wzorce strukturalne

Tier 2 wpływa na to, jak tekst „czuje się" podczas czytania.

**Reguła 6 — Wtrącenia w nawiasach i myślnikach.** Ludzie używają **2x więcej wtrąceń** niż AI. Cel: 3-6 na 500 słów, każde musi dodawać konkretny fakt (5-15 wyrazów). Przykład: _„Aspiryna - wciąż najpopularniejszy lek - ma za sobą 120 lat."_

**Reguła 7 — Konkrety zamiast abstrakcji.** Zamień _„liczne korzyści zdrowotne"_ na konkretne efekty: _„niższy cholesterol, lepszy sen, mniej bólów pleców"_. Zamień _„Powszechnie wiadomo, że"_ na fakt lub źródło.

**Reguła 8 — Strona czynna, proste czasowniki.** Zamień _„pełni funkcję"_ na _„jest"_, _„charakteryzuje się"_ na _„ma"_, _„wykorzystywać"_ na _„używać"_. Strona czynna zamiast biernej.

**Reguła 9 — Eliminacja fraz-wypełniaczy.** „W celu zapewnienia" → „Żeby". „Ze względu na fakt, że" → „Bo". „Należy mieć na uwadze, że" → po prostu podaj fakt.

**Reguła 10 — Różnorodność początków zdań.** Nigdy 2+ zdania z rzędu od tego samego słowa. Dotyczy też form rozkazujących (_„Ustal... Ustal..."_ → zmień początek drugiego). Max 2 zdania na akapit od „To" / „Ten".

---

### 4. Tier 3 — głos i ton

**Reguła 11 — Naturalna interpunkcja.** AI pisze prawie wyłącznie kropkami i przecinkami. Dodaj myślniki (2-3), dwukropki (1-2) i średniki (1) na 500 słów.

**Reguła 12 — Zmienne zagęszczenie informacji.** Nie każde zdanie musi nieść maksimum danych. Wstaw „oddechy" — krótkie reakcje typu _„To sporo."_ lub _„I to wystarczy."_ między gęstymi zdaniami faktograficznymi.

**Reguła 13 — Fakty zamiast zachwytu.** Zamień _„przełomowe odkrycie"_ na _„odkrycie, które zmieniło protokół leczenia w 40 krajach"_. Zamień _„rewolucyjny lek"_ na _„lek, który obniżył śmiertelność o 34%"_.

**Reguła 14 — Brak artefaktów chatbotowych.** Zakazane: _„W tym artykule omówimy..."_, _„Warto wiedzieć, że..."_, _„Zagłębmy się w temat"_, _„Podsumowując powyższe rozważania"_.

**Reguła 15 — Spójny rejestr językowy.** Wybierz ton na początku (formalny lub przystępny) i trzymaj go do końca. Zmiana rejestru jest silnym sygnałem AI.

---

### 5. Tier 4 — sygnały detektorów AI

Reguły 16-20 odpowiadają na konkretne metryki mierzone przez klasyfikatory AI.

**Reguła 16 — Zaimki osobowe.** AI pisze bezosobowo (_„zaleca się"_, _„system umożliwia"_). Ludzie używają „my", „Twój", „nasz". Wpleć zaimki w naturalnych miejscach. Przed: _„Suplementacja witaminy D jest zalecana w okresie jesienno-zimowym."_ Po: _„Jeśli mieszkasz w Polsce, zimą prawie na pewno masz za mało witaminy D."_

**Reguła 17 — Mieszanie czasów.** AI utrzymuje cały tekst w jednym czasie. Ludzie przeskakują: fakt historyczny (przeszły) → stan obecny (teraźniejszy) → prognoza (przyszły) — nawet w jednym akapicie.

**Reguła 18 — Nazwy własne i konkrety.** AI unika nazw: _„badacze odkryli"_. Ludzie podają kto, gdzie, kiedy: _„Zespół z Harvard T.H. Chan School przeanalizował dane 40 000 pacjentów — wyniki opublikowano w JAMA Cardiology."_

**Reguła 19 — Ograniczenie strony biernej.** Max 1 zdanie bierne na 3 zdania. „Lek został zatwierdzony przez FDA" → „FDA zatwierdziła lek w marcu 2024."

**Reguła 20 — Pytania retoryczne.** AI prawie nigdy nie zadaje pytań. Cel: 1-2 pytania na 500 słów. Nie odpowiadaj na nie natychmiast — pozwól pytaniu „zawisnąć" na zdanie lub dwa.

---

### 6. Implementacja — skrypt + prompt

Cały mechanizm sprowadza się do jednego wywołania skryptu Pythona:

1. Wczytaj artykuł HTML z pliku
2. Ochroń liczby i źródła markerami (`[[NUM_X]]`, `[[SRC_X]]`)
3. Wyślij do modelu z promptem zawierającym 20 reguł
4. Przywróć chronione wartości
5. Opcjonalnie: retry jeśli metryki poza zakresem
6. Zapisz wynik

```
python article_humanization_file.py input.txt output.txt
```

**System tierów w prompcie** sygnalizuje modelowi, które reguły są najważniejsze. Jeśli musi coś pominąć — niech pominie Tier 4, nie Tier 1. Zasada BLUF (Bottom Line Up Front) — najważniejsze na górze. Instrukcja **SIMULTANEOUS APPLICATION** wymusza holistyczne zastosowanie wszystkich reguł naraz.

**Parametry konfiguracyjne:**

| Parametr | Wartość | Co kontroluje |
|---|---|---|
| `ASL_MIN` | 12 | Min średnia długość zdania |
| `ASL_MAX` | 20 | Max średnia długość zdania |
| `SENTENCE_HARD_CAP` | 24 | Bezwzględny limit wyrazów na zdanie |
| `BOLD_SHARE_MAX` | 0.08 | Max 8% tekstu pogrubione |
| `MIN/MAX_STRONG_PER_BLOCK` | 1-4 | Zakres boldów na ~500 słów |

**Retry readability:** Jeśli po humanizacji ASL > 20, zdania > 24 wyrazów lub za mało boldów — jedno dodatkowe wywołanie z krótkim promptem naprawczym.

**Walidacje (warn-only):** Pipeline nigdy nie blokuje. Sprawdza zachowanie źródeł, zachowanie liczb, zmianę długości, brak dodanych linków. Lepiej artykuł 90% dobry niż brak artykułu.

---

### Podsumowanie

| Tier | Reguły | Wpływ |
|------|--------|-------|
| **Tier 1 — Krytyczne** | Zakazane słowa, tranzycje, rytm zdań, otwieranie/zamykanie akapitów | Największy — sama reguła rytmu zmienia klasyfikację |
| **Tier 2 — Strukturalne** | Wtrącenia, konkrety, strona czynna, wypełniacze, różnorodność | Wpływa na „odczucie" tekstu |
| **Tier 3 — Głos i ton** | Interpunkcja, gęstość informacji, rejestr, artefakty chatbotowe | Daje tekstowi ludzki charakter |
| **Tier 4 — Detektory** | Zaimki, czasy, nazwy własne, strona bierna, pytania retoryczne | Celuje w konkretne metryki klasyfikatorów |

Kluczowa zasada: nie dodawaj nowych reguł — wplataj sygnały w istniejące. Monitoruj wyniki po każdej zmianie promptu.

---

<details>
<summary>📝 Transkrypcja wideo</summary>

*(Transkrypcja zostanie uzupełniona)*

</details>



<div class="lesson-completion-bottom" data-lesson-id="ai-content-expert/blok-3/lekcja-5"></div>

<div id="sensai-comments"></div>
