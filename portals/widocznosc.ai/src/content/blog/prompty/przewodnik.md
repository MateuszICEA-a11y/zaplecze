---
title: 'Prompt engineering – kompletny przewodnik'
subtitle: 'Naucz się pisać prompty, które dają przewidywalne, powtarzalne wyniki – od podstaw po zaawansowane techniki wnioskowania.'
description: 'Kompletny przewodnik po prompt engineeringu: techniki zero-shot, few-shot, Chain-of-Thought, strukturyzacja, bezpieczeństwo i praktyczne przykłady dla marketerów i SEO.'
date: 2026-05-22
image: ../../../assets/images/blog-prompty-przewodnik.webp
icon: '<path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>'
author:
  name: 'Tomasz Czechowski'
  role: 'Head of SEO · ICEA'
  avatar: ../../../assets/images/authors/tomasz-czechowski.avif
readTime: '19 min'
tags: ['Prompt engineering', 'Prompty', 'LLM', 'AI']
pillar: 'prompty'
intent: 'HOWTO'
level: 'L1'
---
Prompt engineering (inżynieria podpowiedzi) to dyscyplina, która decyduje o tym, czy LLM (Large Language Model, czyli duży model językowy) wygeneruje użyteczną odpowiedź, czy bezwartościowy szum. Tu nie ma magicznych słów. Liczy się zrozumienie mechanizmów przetwarzania instrukcji i takie zaprojektowanie promptu, by model otrzymał precyzyjne wytyczne. Ten przewodnik przeprowadzi Cię od podstawowych technik, przez zaawansowane architektury wnioskowania, aż po bezpieczeństwo systemów opartych na LLM – z konkretnymi przykładami gotowymi do wdrożenia.

## Czym jest inżynieria podpowiedzi i dlaczego ma znaczenie?

Prompt to każda instrukcja, pytanie lub kontekst, które przekazujesz modelowi AI. Brzmi banalnie. **Jakość promptu bezpośrednio determinuje jednak jakość odpowiedzi – i to w sposób, który da się zmierzyć oraz zoptymalizować.**

[Inżynieria podpowiedzi](https://pl.wikipedia.org/wiki/In%C5%BCynieria_podpowiedzi) wyrosła z obserwacji, że te same modele generują diametralnie różne odpowiedzi w zależności od sformułowania zapytania. GPT-4 poproszony o „napisz artykuł o SEO" oraz poproszony o „napisz artykuł o SEO dla dyrektora marketingu B2B SaaS, który zna podstawy pozycjonowania, ale nie zna GEO; artykuł ma zawierać 3 konkretne taktyki z wynikami badań" – to dwa zupełnie inne zadania. Dają one skrajnie różne jakościowo wyniki.

**To nie jest problem modeli, lecz problem komunikacji.** Modele językowe są ekstremalnie dosłowne. Nie domyślają się intencji. Twój prompt to jedyna specyfikacja, jaką dysponują.

Dla marketerów, specjalistów SEO i właścicieli firm AI staje się codziennym narzędziem pracy przy generowaniu treści, analizie danych, automatyzacji raportów czy badaniu słów kluczowych. Bez solidnych podstaw inżynierii podpowiedzi każde z tych zastosowań wygeneruje przypadkowe wyniki. Z nimi zyskasz powtarzalność i skalowalność.

### Architektura instrukcji – co trafia do modelu

Nowoczesny model widzi trzy rodzaje wiadomości: systemową (`system`), użytkownika (`user`) i asystenta (`assistant`). Wiadomość systemowa ustawia rolę oraz reguły zachowania. Jest najsilniejsza hierarchicznie. Wiadomość użytkownika to Twoje zapytanie, a odpowiedź asystenta to treść wygenerowana przez model.

Trzy składniki dobrego promptu, które warto znać od początku:

- **Rola** – kim ma być model w tej interakcji; „Jesteś starszym analitykiem SEO" działa lepiej niż brak przypisanej funkcji, ponieważ zawęża przestrzeń możliwych odpowiedzi
- **Zadanie** – co dokładnie ma zrobić; musi być konkretne, mierzalne i pozbawione ogólników w stylu „napisz coś dobrego"
- **Format wyjściowy** – jak ma wyglądać odpowiedź; może to być lista, tabela, JSON lub akapit o dokładnej długości

## Podstawowe techniki promptowania

Zanim przejdziesz do zaawansowanych metod, musisz opanować trzy podstawowe tryby interakcji z modelem. Różnią się one liczbą przykładów dostarczonych w prompcie i odpowiadają różnym sytuacjom.

### Zero-shot – bez przykładów

Zero-shot (tryb bez przykładów) polega na zadaniu pytania lub zleceniu zadania bez podawania żadnego wzorca odpowiedzi. Działa świetnie w przypadku prostych, jednoznacznych poleceń.

```
Zidentyfikuj intencję wyszukiwania dla frazy "kurs prompt engineering".
Podaj jedną z czterech kategorii: Informacyjna, Nawigacyjna, Transakcyjna, Komercyjna.
```

Model odpowie „Informacyjna" lub „Komercyjna" i ewentualnie uzasadni swój wybór. Nie potrzebujesz przykładów. Zadanie jest wystarczająco proste. **Zero-shot sprawdza się przy klasyfikacji, tłumaczeniach i prostych przekształceniach tekstu.**

### Few-shot – uczenie na przykładach

Few-shot (tryb kilku przykładów) to technika, w której przed właściwym pytaniem podajesz modelowi 2–5 par pytań i odpowiedzi. Model uczy się wzorca z przykładów, a następnie aplikuje go do nowego przypadku.

```
Przeklasyfikuj frazy do kategorii intencji wyszukiwania.

Fraza: "co to jest SEO" → Intencja: Informacyjna
Fraza: "narzędzia SEO ranking 2026" → Intencja: Komercyjna
Fraza: "kup kurs SEO online" → Intencja: Transakcyjna

Fraza: "jak poprawić widoczność w ChatGPT" → Intencja:
```

Few-shot działa szczególnie dobrze w zadaniach, gdzie trudno słowami opisać reguły klasyfikacji. Łatwiej pokazać wzorzec, niż go tłumaczyć. Wadą pozostaje zużycie tokenów na przykłady, co przy dłuższych promptach podnosi koszty operacyjne.

### Chain-of-Thought – wnioskowanie krok po kroku

Chain-of-Thought (łańcuch myślenia, w skrócie CoT) to technika, w której prosisz model o rozpisanie kroków wnioskowania przed podaniem odpowiedzi końcowej. **Znacząco poprawia ona jakość wyników przy zadaniach wymagających logiki, obliczeń lub wieloetapowego rozumowania.**

```
Oceń, czy strona firmowa B2B SaaS spełnia kryteria cytowalności przez LLM.
Przemyśl to krok po kroku: najpierw sprawdź dostępność techniczną dla botów,
potem oceń gęstość faktograficzną treści, na końcu oceń strukturę nagłówków.
Dopiero po tym sformułuj ocenę końcową.
```

Badania pokazują, że samo dołączenie frazy „przemyśl to krok po kroku" może podnieść dokładność modelu w zadaniach logicznych o 20–40%. To jedna z najlepiej udokumentowanych technik w literaturze branżowej.

Porównanie trzech podstawowych technik:

| Technika | Przykłady w prompcie | Kiedy stosować | Koszt tokenów |
|---|---|---|---|
| Zero-shot | 0 | Proste klasyfikacje, tłumaczenia, formatowanie | Niski |
| Few-shot | 2–5 | Niestandardowe formaty, zniuansowane klasyfikacje | Średni |
| Chain-of-Thought | 0 lub 1+ | Wnioskowanie, obliczenia, wieloetapowe problemy | Średni–wysoki |
| CoT + few-shot | 2–5 z rozpisanym rozumowaniem | Złożone zadania wymagające precyzji | Wysoki |

![Anatomia skutecznego promptu: pięć warstw – rola, kontekst, zadanie, format i przykłady – im precyzyjniej, tym lepsza odpowiedź](../../../assets/images/infographic-prompty-przewodnik.png)

## Struktura promptu – jak pisać instrukcje, które działają

Dobra struktura promptu to nie format dla samego formatu. To sposób na ograniczenie przestrzeni decyzyjnej modelu. Im precyzyjniej zdefiniujesz swoje oczekiwania, tym mniej pozostawisz systemowi do „domyślenia się".

Najważniejsza zasada: **mów modelowi, co ma robić, a nie czego ma unikać.** Zamiast „nie pisz ogólnikowo" użyj „każda sekcja musi zawierać co najmniej jedną liczbę z rokiem i źródłem". Instrukcje pozytywne działają lepiej niż negacje. Model nie ma dobrego mechanizmu do ignorowania zabronionych wzorców, ale świetnie radzi sobie z replikowaniem tych pożądanych.

### Precyzja zamiast opisów

Frazy opisowe, jak „krótka odpowiedź" czy „bardziej szczegółowo", są dla modelu niejasne. Ktoś może uważać, że 200 słów to krótko, a ktoś inny, że zaledwie 50. Model nie wie, która konwencja obowiązuje w Twoim kontekście.

Zamień:

- „krótka odpowiedź" → „odpowiedź w maksymalnie 3 zdaniach"
- „bardziej szczegółowo" → „podaj 3 konkretne przykłady z danymi liczbowymi"
- „profesjonalny ton" → „ton formalny, bez słownictwa potocznego, bez emotikonów"
- „odpowiedz jako ekspert" → „jesteś analitykiem SEO z 10-letnim doświadczeniem w B2B SaaS"

**Kwantyfikacja instrukcji to najszybszy sposób na poprawę powtarzalności odpowiedzi.**

### Znaczniki XML jako separatory

Przy długich promptach zawierających dane, instrukcje i kontekst wszystko zaczyna się zlewać. Modele mogą potraktować fragment analizowanego dokumentu jako nową instrukcję. Rozwiązaniem są znaczniki XML pełniące funkcję separatorów:

```xml
<instrukcje>
  Przeanalizuj poniższy artykuł pod kątem cytowalności przez LLM.
  Sprawdź: gęstość faktograficzną, strukturę nagłówków, obecność danych liczbowych.
  Zwróć wynik jako listę 3 mocnych stron i 3 obszarów do poprawy.
</instrukcje>

<artykul>
  [tu wklej tekst do analizy]
</artykul>
```

**Separacja instrukcji od danych zmniejsza ryzyko błędów interpretacji i poprawia spójność odpowiedzi przy powtarzalnych zadaniach.**

## Zaawansowane architektury wnioskowania

Podstawowe techniki wystarczają do codziennych zadań. Przy złożonych problemach – analizie wieloetapowej, ocenie strategicznej czy generowaniu treści wymagającym eksperckich decyzji – potrzebujesz jednak bardziej wyrafinowanych architektur.

### Tree of Thoughts – drzewo myśli

Tree of Thoughts (drzewo myśli, ToT) to technika, w której model generuje wiele alternatywnych ścieżek wnioskowania jednocześnie, ocenia je i wybiera najlepszą. Zamiast jednego łańcucha myślenia otrzymuje wiele rozgałęzionych opcji.

Uproszczony wariant możesz uruchomić jednym promptem:

```
Wyobraź sobie, że trzech różnych ekspertów SEO analizuje tę strategię contentową.
Każdy zapisuje swój pierwszy krok analizy, potem konfrontuje go z innymi.
Jeśli ekspert zda sobie sprawę z błędu w swoim rozumowaniu, opuszcza grupę.
Kontynuuj, aż zostanie jedna spójna rekomendacja.

[tu opis strategii]
```

To podejście świetnie sprawdza się przy ocenie strategii, gdzie istnieje kilka równoprawnych perspektyw, a ryzyko przeoczenia ważnego czynnika jest wysokie. Badania na benchmarku Game of 24 pokazały, że ToT poprawia skuteczność modelu z 4% (dla standardowego CoT) do 74%.

### ReAct – wnioskowanie ze środowiskiem

ReAct (od „Reason and Act", czyli wnioskuj i działaj) to paradygmat, w którym model na przemian rozumuje i wykonuje akcje (wywołuje narzędzia, przeszukuje bazy danych, odpytuje API). Każdy krok wygląda następująco: model analizuje stan, decyduje o akcji, wykonuje ją, odbiera wynik i planuje kolejny etap.

W praktyce marketerskiej ReAct to agent AI, który na Twoje polecenie „przeanalizuj widoczność marki w LLM" działa samodzielnie. Odpytuje narzędzie do monitoringu, pobiera dane, przetwarza je i generuje raport – bez Twojego udziału na każdym etapie. Wzorzec do budowania takich agentów opisuje osobny artykuł o [agentach AI](/agenci-ai/przewodnik/).

### Meta-prompting – model projektuje swój własny prompt

Meta-prompting polega na tym, że prosisz model, aby najpierw zaprojektował optymalny prompt dla zadanego problemu, a dopiero potem wykonał zadanie na jego podstawie. To rekurencja z konkretnym zastosowaniem.

```
Twoim zadaniem jest analiza strony pod kątem GEO.
Najpierw napisz prompt, który optymalnie poprowadziłby model LLM
przez taką analizę. Potem wykonaj tę analizę korzystając z zaprojektowanego promptu.
```

**Meta-prompting sprawdza się szczególnie dobrze, gdy sam nie wiesz dokładnie, jak sformułować zadanie, albo chcesz poprawić istniejący prompt bez ręcznego testowania wielu wariantów.**

<aside class="callout-fact">
  <div class="callout-icon">✦</div>
  <div class="callout-body">
    <div class="callout-label">Badanie</div>
    <p>Stanford DSPy (Declarative Self-improving Python, 2023) pokazał, że automatyczna optymalizacja promptów przez algorytm BootstrapFewShot podnosi jakość odpowiedzi modelu do 82% (wzrost z pułapu ok. 33%) w porównaniu do ręcznie pisanych bazowych promptów. <strong>Frameworki do automatycznej kompilacji promptów są skuteczniejsze niż ręczne majsterkowanie, gdy masz dostęp do zestawu testowego z co najmniej 20 przykładami.</strong></p>
  </div>
</aside>

## Techniki specjalistyczne dla treści i SEO

Inżynieria podpowiedzi ma bezpośrednie zastosowanie w codziennej pracy SEO i contentowej. Tu liczy się nie tyle znajomość zaawansowanych architektur, ile precyzja w definiowaniu kontekstu, odbiorcy oraz formatu.

### Prompty do tworzenia treści

Najczęstszy błąd przy zlecaniu treści modelowi to zbyt mało kontekstu o odbiorcy. Wynik staje się generyczny. Model po prostu nie wie, dla kogo pisze.

Wzorzec promptu contentowego, który działa:

```
Napisz sekcję artykułu blogowego o [temat].
Odbiorca: specjalista SEO z 3+ latami doświadczenia, zna podstawy, 
          ale nie zna [aspekt do wyjaśnienia].
Ton: ekspercki, konkretny, bez lania wody.
Format: akapit wprowadzający (3 zdania), lista z 4 elementami 
        w formacie "**Termin** – opis", akapit podsumowujący (2 zdania).
Każdy element listy musi zawierać co najmniej jedną liczbę lub datę.
Długość całości: 200–250 słów.
```

Im bardziej konkretna specyfikacja formatu i odbiorcy, tym mniej iteracji potrzebujesz.

### Prompty do analizy i badań słów kluczowych

Modele językowe dobrze radzą sobie z grupowaniem i klasyfikacją słów kluczowych, pod warunkiem że otrzymają jasne kryteria:

```
Poniżej lista 50 fraz kluczowych. Pogrupuj je według intencji wyszukiwania 
(Informacyjna / Komercyjna / Transakcyjna) i klastra tematycznego.
Dla każdej frazy podaj: [fraza] | [intencja] | [klaster] | [proponowany typ treści].
Zwróć wynik jako tabelę markdown.

[lista fraz]
```

**Zamiast „pogrupuj te frazy sensownie" – zdefiniuj kryteria grupowania i format wyjściowy.** Wtedy możesz porównywać wyniki między sesjami i błyskawicznie wychwycić niespójności.

### Prompty do humanizacji i korekty

Modele zostawiają w tekstach charakterystyczne wzorce: jednolitą długość zdań, nadużywane konstrukcje, specyficzne frazy. Prompt do korekty musi być równie konkretny:

```
Przepisz poniższy akapit, zachowując 100% informacji merytorycznych.
Wprowadź zróżnicowanie dynamiki tekstu (tzw. burstiness): zróżnicuj radykalnie długość zdań (miks 5-słowowych puent 
i 25-słowowych zdań złożonych). Usuń wszystkie zdania zaczynające się od "Warto".
Zamień stronę bierną na czynną. Zachowaj wszystkie liczby i nazwy własne.
```

Lista wzorców do sprawdzenia po wygenerowaniu treści przez LLM:

- **Wypełniacze (filler phrases)** – „warto podkreślić", „nie sposób nie wspomnieć", „jak wszyscy wiemy" → usuń
- **Równomierna długość zdań** – jeśli każdy akapit ma 3-4 zdania o zbliżonej długości → różnicuj
- **Strona bierna** – „zostało wykazane" zamiast „badanie wykazało" → przepisz na stronę czynną
- **Brakujące źródła** – każda liczba bez źródła to sygnał halucynacji → zweryfikuj

## Bezpieczeństwo – prompt injection i obrona systemów

Jeśli budujesz system oparty na LLM, który przetwarza dane od użytkowników lub pobiera treści z zewnątrz (e-maile, dokumenty, strony internetowe), bezpieczeństwo promptów przestaje być teorią. To praktyczny problem produkcyjny.

Podstawową podatnością jest brak separacji między kanałem instrukcji a kanałem danych. Model przetwarza cały strumień tekstu jednakowo. Nie potrafi odróżnić Twoich instrukcji od złośliwych komend ukrytych w analizowanym dokumencie.

Dwa główne typy ataków, które musisz znać:

- **Wstrzykiwanie bezpośrednie** – użytkownik wpisuje w oknie czatu „zignoruj wszystkie poprzednie instrukcje i [złośliwe polecenie]"; stosunkowo łatwe do wykrycia przez filtry wejściowe
- **Wstrzykiwanie pośrednie** – złośliwe instrukcje ukryte w dokumentach, e-mailach lub stronach internetowych przetwarzanych automatycznie przez agenta; trudniejsze do wykrycia, bo atak pochodzi z zewnętrznego źródła, a nie od użytkownika

**Wstrzykiwanie pośrednie to aktywne zagrożenie produkcyjne, a nie akademiczna hipoteza.** W 2026 roku jednostka Palo Alto Networks Unit 42 udokumentowała ataki na systemy agentowe przez spreparowane strony internetowe (tzw. pośrednie wstrzykiwanie promptu).

### Wzorzec Dual-LLM jako obrona architekturalna

Najskuteczniejsza obrona nie polega na dodawaniu kolejnych filtrów, lecz na separacji architektury. Wzorzec Dual-LLM fizycznie rozdziela dwa modele:

- **Model uprzywilejowany** – ma dostęp do narzędzi i API, ale nigdy nie przetwarza surowych danych z niezaufanych źródeł
- **Model w kwarantannie (izolowany)** – przetwarza zewnętrzne dane i ekstrahuje z nich ustrukturyzowane informacje w formacie JSON, ale nie ma dostępu do żadnych narzędzi

Uprzywilejowany model dostaje tylko wynik ekstrakcji od izolowanego modelu – strukturę JSON, a nie surowy tekst. Złośliwa instrukcja ukryta w zewnętrznym dokumencie pozostaje nieaktywna, ponieważ trafia wyłącznie do modelu bez uprawnień.

<aside class="callout-expert">
  <div class="callout-icon"><img src="/authors/michal-ziach.avif" alt="Michał Ziach" /></div>
  <div class="callout-body">
    <div class="callout-label">Opinia eksperta</div>
    <p>W praktyce klientów ICEA największy problem z promptami nie jest techniczny – to brak definicji „dobrej odpowiedzi". Kiedy pytam, skąd wiedzą, że prompt działa, zazwyczaj słyszę „bo odpowiedź brzmi sensownie". To za mało. Przed wdrożeniem jakiegokolwiek promptu produkcyjnego zbuduj 10–20 przykładów oczekiwanych odpowiedzi i testuj nowe wersje promptu na tym zbiorze. <strong>Bez zestawu testowego każda zmiana promptu to strzał w ciemno – możesz poprawić jeden wymiar i zepsuć trzy inne.</strong></p>
    <div class="callout-author">Michał Ziach · CTO, ICEA</div>
  </div>
</aside>

## Modele i ich osobowości promptowe

Różne modele reagują inaczej na te same prompty. To nie jest niedoróbka. To wynik różnych danych treningowych, odmiennych procedur wyrównywania (alignment) i specyficznych zachowań domyślnych. Znając te różnice, możesz pisać prompty działające przewidywalnie w konkretnym systemie.

Zestawienie kluczowych różnic między popularnymi modelami:

| Model | Mocna strona | Zachowanie domyślne | Kluczowa wskazówka |
|---|---|---|---|
| GPT-5 / GPT-5.5 | Instrukcje złożone, formatowanie | Bezpośredni, zorientowany na zadanie | Definiuj osobowość i styl wprost |
| Claude Sonnet/Opus | Długie dokumenty, wnioskowanie | Ostrożny, zadaje pytania przy niejednoznaczności | Podawaj kontekst celu, nie tylko treści |
| Gemini 3.1 Pro | Dane multimodalne, kod | Analityczny, struktura Markdown | Dane kontekstowe umieszczaj przed instrukcją |
| Llama 4 (open source) | Koszt, prywatność danych | Wymaga precyzyjnych szablonów | Few-shot obowiązkowy dla niestandardowych formatów |

Szczegółowe porównanie możliwości tych modeli, w tym parametry techniczne i okna kontekstowe, zawiera artykuł o [modelach LLM](/modele-llm/przewodnik/). Dla codziennej pracy z ChatGPT konkretny poradnik znajdziesz w artykule o [ChatGPT dla SEO](/modele-llm/chatgpt/).

### Modele z rozszerzonym wnioskowaniem

Modele z natywnym rozszerzonym wnioskowaniem (extended thinking – mechanizm, w którym model przed odpowiedzią prowadzi wewnętrzne obliczenia niewidoczne dla użytkownika) mają inną charakterystykę niż standardowe rozwiązania.

Przy takich modelach szczegółowe rozpisywanie kroków CoT w prompcie bywa redundantne. Model i tak prowadzi wewnętrzne wnioskowanie. Co więcej, zbyt szczegółowe narzucanie procesu może zawęzić przestrzeń rozwiązań i obniżyć jakość odpowiedzi. **Dla modeli z rozszerzonym wnioskowaniem lepiej działa definicja celu końcowego niż szczegółowa specyfikacja procesu.**

## Mierzenie i iterowanie promptów

Dobry prompt rzadko powstaje za pierwszym razem. Rzemiosło prompt engineeringu polega na systematycznym iterowaniu, a nie na intuicyjnym majstrowaniu.

Proces optymalizacji, który daje powtarzalne wyniki:

1. Zdefiniuj co najmniej 10 przykładów oczekiwanych odpowiedzi – Twój zestaw testowy
2. Oceń aktualny prompt na tym zbiorze i zlicz, ile odpowiedzi jest akceptowalnych
3. Zmień jeden element promptu (np. tylko format wyjściowy, tylko definicję roli, tylko instrukcję długości)
4. Ponownie oceń na całym zbiorze testowym
5. Zatwierdź zmianę tylko jeśli wynik na całym zbiorze wzrósł

**Zmiana jednego elementu naraz to klucz.** Jeśli zmienisz trzy rzeczy jednocześnie i wynik się poprawi, nie wiesz, która modyfikacja pomogła. Przy następnej iteracji znów działasz w ciemno.

Jeśli chcesz sprawdzić, jak treści generowane z pomocą LLM wypadają pod kątem cytowalności przez wyszukiwarki AI, [Ocena cytowalności strony](/narzedzia/url-check/) analizuje strukturę strony pod kątem kluczowych czynników w kilkadziesiąt sekund.

Kilka sygnałów, że prompt wymaga poprawy:

- **Odpowiedzi są za długie lub za krótkie** mimo braku instrukcji długości → dodaj wprost polecenie `"maksymalnie X zdań"`
- **Format zmienia się między sesjami** → dodaj przykładową odpowiedź lub szczegółową specyfikację formatowania
- **Model „dodaje od siebie" treść nieobecną w prompcie** → zwęź zakres instrukcją „operuj tylko na dostarczonych danych"
- **Odpowiedzi brzmią generycznie** → dodaj charakterystykę odbiorcy i cel komunikacji
