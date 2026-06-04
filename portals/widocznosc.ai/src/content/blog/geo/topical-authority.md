---
title: 'Topical authority pod LLM-y – pillar + cluster w erze AI Overviews'
subtitle: 'Jak zbudować pokrycie tematyczne, które LLM-y będą cytować częściej niż treści konkurencji'
description: 'Dlaczego LLM-y faworyzują domeny z głębokim pokryciem jednej niszy. Jak zbudować architekturę pillar + cluster, która działa w erze AI Mode i AI Overviews. Konkretny szablon implementacji – od mapy tematów po linkowanie wewnętrzne.'
date: 2026-05-03
image: ../../../assets/images/blog-geo-topical-authority.webp
icon: '<circle cx="12" cy="6" r="2.5"/><circle cx="6" cy="14" r="2"/><circle cx="12" cy="14" r="2"/><circle cx="18" cy="14" r="2"/><circle cx="4" cy="20" r="1.5"/><circle cx="9" cy="20" r="1.5"/><circle cx="14" cy="20" r="1.5"/><circle cx="19" cy="20" r="1.5"/><line x1="12" y1="9" x2="6" y2="12"/><line x1="12" y1="9" x2="12" y2="12"/><line x1="12" y1="9" x2="18" y2="12"/>'
author:
  name: 'Tomasz Czechowski'
  role: 'Head of SEO · ICEA'
  avatar: ../../../assets/images/authors/tomasz-czechowski.avif
readTime: '10 min'
tags: ['Topical Authority', 'Pillar Page', 'Content Strategy', 'GEO']
pillar: 'geo'
intent: 'INFO'
level: 'L2'
---
**Większość stron wygrywających kiedyś w klasycznym SEO dzięki silnemu profilowi linkowemu dziś przegrywa w AI Overviews.** Powód jest bolesny dla agencji link buildingowych. LLM-y nie patrzą na linki w taki sam sposób jak klasyczny algorytm. Zwracają uwagę na to, czy domena „wie wszystko" o danej niszy – a to mierzy się głębokością pokrycia, a nie liczbą backlinków. Dlatego koncepcja topical authority, znana w SEO od kilku lat, w erze GEO przestaje być miłym dodatkiem i staje się fundamentem.

## Co LLM-y rozumieją przez „autorytet"?

Klasyczna wyszukiwarka Google opiera ocenę autorytetu na trzech filarach: linkach (PageRank), zachowaniu użytkowników (CTR, dwell time) i sygnałach E-E-A-T (autor, źródła, świeżość). LLM-y dodają do tego czwarty, znacznie ważniejszy filar.

> **Spójność pokrycia tematycznego. Domena cytowana wielokrotnie w różnych podzapytaniach tego samego tematu jest traktowana jako autorytet w niszy.**

<aside class="callout-fact">
  <div class="callout-icon">✦</div>
  <div class="callout-body">
    <div class="callout-label">Ciekawostka</div>
    <p>Pillar + cluster to nie wymysł ery LLM-ów. Architekturę wprowadził <strong>HubSpot w 2017 roku</strong> jako odpowiedź na semantyczne grupowanie wyników w klasycznym Google. Badacze z HubSpot pokazali, że strony zorganizowane w model pillar-cluster osiągają pozycje dla 4× więcej fraz długiego ogona niż strony zorganizowane chronologicznie po dacie publikacji. Dziewięć lat później ten sam mechanizm działa w warstwie pobierania informacji (retrieval) modeli językowych – tyle że stawka jest dużo wyższa.</p>
  </div>
</aside>

Mechanizm jest prosty, ale niesie za sobą potężne konsekwencje. Gdy moduł pobierający dane wyciąga fragmenty dla pojedynczego podzapytania, weryfikuje ich źródło. Jeśli ta sama domena pojawiała się już w innych odpowiedziach z tej samej dziedziny, jej waga rośnie.

To nieformalny, lecz empirycznie potwierdzony mechanizm. **Kevin Indig pokazał na bazie ~1,2 mln odpowiedzi ChatGPT, że w kategoriach porównań produktów top 10 domen zabiera 46% wszystkich cytowań (w innych branżach koncentracja jest niższa).** Reszta walczy o resztki.

LLM-y wykazują również tendencję do zaufania przez asocjację (ang. *domain trust by association*). Domena wielokrotnie cytowana obok autorytatywnych źródeł (Wikipedia, encyklopedie branżowe, publikacje akademickie) staje się częścią tego samego klastra zaufania. To potężnie wzmacnia pozycję ugruntowanych graczy. Nowym znacznie trudniej przebić ten szklany sufit.

## Pillar + cluster – architektura, która spełnia te kryteria

Architektura pillar + cluster nie jest wymysłem ery GEO. Powstała w 2017 roku w HubSpot, oparta na badaniach ekspertów tej firmy, jako odpowiedź na rosnący nacisk Google na semantyczne grupowanie treści. **Choć działa od dawna w klasycznym SEO, w erze LLM-ów jej wartość rośnie nieproporcjonalnie.**

| Element | Rola | Długość | Intencja | Linkowanie |
|---|---|---|---|---|
| **Pillar page** | centralny hub tematyczny, kompleksowy przegląd | 3000–7000 słów | informacyjna, kategorialna | linkuje do 5–8 najważniejszych stron typu cluster |
| **Cluster pages** | szczegółowy aspekt głównego tematu | 1000–2500 słów | konkretne podzapytanie, transakcyjna | linkuje do pillara 2× + 3–5 innych stron w klastrze |

Modele językowe odczytują tę strukturę jednoznacznie: „ta domena ma 10–25 artykułów silnie powiązanych tematycznie, wszystkie wskazują na centralny dokument". To niezwykle silny sygnał autorytetu tematycznego. **W starciu z domeną posiadającą jeden samotny tekst na dany temat, pillar + cluster wygrywa w ponad 80% przypadków.** Tak pokazują testy iPullRank na osadzeniach wektorowych (ang. embeddings) tekstu.

![Pillar + cluster – architektura topical authority: centralna strona pillar, 8 cluster pages dookoła w układzie hub-and-spoke, linkowanie cluster→pillar (2×) i cluster→cluster (3-5×), top 10 domen w niszy zabiera 46% cytowań AI](../../../assets/images/infographic-geo-topical-authority.png)

## Jak zaprojektować mapę tematów?

Pierwszy krok bywa najtrudniejszy. Musisz precyzyjnie zdefiniować, co jest pillarem, a co clusterem. Najczęstsze błędy polegają na zbyt szerokim lub zbyt wąskim określeniu tematu nadrzędnego. Poniżej znajdziesz dwie zasady, które realnie sprawdzają się w niszach komercyjnych.

### Zasada 1 – pillar to fraza, którą klient wpisuje na początku poszukiwań (researchu)

Pillarem dla agencji SEO mogłoby być „pozycjonowanie w AI", dla biura rachunkowego „księgowość dla startupów", a dla dystrybutora aut „używane samochody dostawcze". To zagadnienia na poziomie głównej kategorii. Charakteryzują się dużym search volume i wyraźną intencją komercyjną.

### Zasada 2 – cluster to konkretne podzapytanie z fazy decyzji

Z kolei dla pillara „pozycjonowanie w AI" naturalnymi clusterami będą konkretne podtematy.

- „czym GEO różni się od SEO"
- „jak optymalizować content pod ChatGPT"
- „llms.txt – co to jest i jak wdrożyć"
- „narzędzia do śledzenia (trackingu) wyszukiwań AI"
- „case study GEO B2B SaaS"

Każdy z tych tekstów ma własną, ściśle określoną intencję oraz strukturę.

### Praktyczny szablon mapowania

W ICEA stosujemy ten proces u każdego klienta, który rozpoczyna wdrożenie GEO.

1. **Wybierz 3–5 głównych pillarów** – zdefiniuj je dla swojej niszy.
2. **Dla każdego pillara wygeneruj 30 podzapytań** – wykorzystaj narzędzia takie jak Qforia, GPT-4 z odpowiednim promptem albo Search Console i analizę autocomplete.
3. **Z 30 podzapytań wybierz 12–18** – skup się na tych, które poruszają różne aspekty (intencja, format, faza decyzji).
4. **Każde z nich staje się tytułem strony typu cluster** – potraktuj to jako sztywną regułę.
5. **Sprawdź pokrycie konkurencji** – ile z tych 12–18 podzapytań ma już dobre wyniki w AI Mode? Reszta to białe plamy do zajęcia.

## Trzy żelazne reguły linkowania wewnętrznego

Sama struktura pillar + cluster nie wystarczy, jeśli artykuły nie są ze sobą powiązane. Większość zespołów contentowych tworzy teksty w izolacji i zapomina o systematycznym linkowaniu wewnętrznym. **Efekt to 20 świetnych tekstów, które dla LLM-ów wyglądają jak 20 zupełnie niezależnych dokumentów.**

| Reguła | Co | Dlaczego |
|---|---|---|
| **Cluster → Pillar (min. 2×)** | każda strona typu cluster linkuje do pillara minimum 2 razy: we wstępie (kontekst nadrzędny) + w zakończeniu (CTA do pełnego przewodnika) | buduje graf topologiczny z wyraźnym hubem |
| **Cluster → Cluster (3–5×)** | każda strona typu cluster linkuje do 3–5 innych stron w tym samym pillarze, najbardziej powiązanych tematycznie | zagęszcza klaster, sygnalizuje gęste pokrycie |
| **Pillar → Cluster (5–8×)** | pillar linkuje do 5–8 najważniejszych stron typu cluster (nie wszystkich) | naturalna hierarchia typu hub-and-spoke |

W praktyce dla pillara z 12 stronami typu cluster prawidłowo zaprojektowane linkowanie wewnętrzne generuje 30–40 linków w obrębie tej grupy. To sporo pracy wymagającej żelaznej dyscypliny. **Jednak efekt na widoczność w AI Mode jest mierzalny – w naszych testach domeny po wdrożeniu pełnego linkowania wewnętrznego rosły w SoV o 5–8 punktów procentowych w 90 dni.**

<aside class="callout-expert">
  <div class="callout-icon"><img src="/authors/piotr-wicenciak.avif" alt="Piotr Wicenciak" /></div>
  <div class="callout-body">
    <div class="callout-label">Opinia eksperta</div>
    <p>Najczęstszy błąd przy migracji do pillar+cluster: zespół content marketingu próbuje od razu zbudować 5 pillarów. To zabija projekt, bo każdy pillar wymaga 8–12 tygodni dyscypliny, a zespół robi pierwsze 3 i zostawia 2 niedokończone. <strong>Buduj jeden pillar do końca, mierz efekt na SoV przez kwartał, dopiero potem startuj drugi.</strong> Lepiej mieć jeden pillar na 100% niż pięć na 40%.</p>
    <div class="callout-author">Piotr Wicenciak · SEO Operations Manager, ICEA</div>
  </div>
</aside>

## Teksty zakotwiczenia (anchory) pod LLM-y

LLM-y nie tylko liczą odnośniki, ale też wnikliwie analizują ich kontekst. Anchor (tekst zakotwiczenia) „kliknij tutaj" nie niesie ze sobą absolutnie żadnej wartości semantycznej. Z kolei anchor „pełna definicja query fan-out" natychmiast przekazuje silnikowi, czego dokładnie dotyczy linkowany zasób.

Poznaj kluczowe reguły tworzenia anchor textów pod LLM-y.

- **Maksymalnie 60 znaków** – anchor musi zawierać słowo kluczowe lub frazę istotną dla linkowanej strony.
- **Naturalny kontekst zdania** – unikaj sztucznego wciskania fraz na siłę.
- **Brak powtórzeń w obrębie artykułu** – każdy link do tej samej podstrony powinien mieć inny anchor (sygnał różnorodności semantycznej).
- **Sensowny fragment otaczający** – LLM często wybiera blok 3-5 zdań wokół linka jako reprezentację docelowej strony.

Przeprowadzaj praktyczny audyt raz na pół roku. Wyciągnij wszystkie anchory dla każdej ze stron typu cluster i sprawdź ich zróżnicowanie semantyczne. **Jeśli 80% linków do strony X używa dokładnie tego samego anchora, masz poważny problem.** Dla modelu językowego wygląda to jak sztuczna monokultura semantyczna, która wręcz osłabia sygnał zaufania.

## Jak startować, gdy masz już chaos contentowy?

Większość projektów GEO wcale nie startuje od zera. Zazwyczaj zastajemy stronę z chaotyczną historią contentową, kilkudziesięcioma rozproszonymi artykułami i brakiem wyraźnej struktury. **Restart strategii pillar + cluster wymaga mądrej inwentaryzacji i przesunięcia akcentów, a nie pisania wszystkiego od nowa.**

Wdrożenie naprawcze opieramy na konkretnej kolejności działań (sprawdzona w ponad 7 projektach klientów ICEA).

1. **Tygodnie 1–2 – audyt istniejącego contentu** – wyciągnij wszystkie artykuły z bloga i przypisz im tematy nadrzędne (pillar). Zidentyfikuj teksty naturalnie nadające się na bazę (kompleksowe, długie) oraz te stanowiące materiał na cluster.
2. **Tygodnie 3–4 – wybór 1 pillara jako prototypu** – nie próbuj budować 5 klastrów naraz. Zacznij od jednego, najbardziej komercyjnego. Wybierz 8–12 stron typu cluster z istniejącej bazy lub zaplanuj nowe do napisania.
3. **Tygodnie 5–8 – optymalizacja pillara i dopisanie brakujących clusterów** – główny tekst często wymaga rozbudowy do 3000–5000 słów. Zadbaj o strukturę H2/H3 zgodną z podzapytaniami oraz solidne linkowanie wewnętrzne.
4. **Tygodnie 9–12 – linkowanie wewnętrzne i monitoring** – wdróż pełną macierz linkowania oraz dane strukturalne [schema.org](https://pl.wikipedia.org/wiki/Schema.org) dla pillara i clusterów. Następnie monitoruj wskaźniki SoV i Citation Rate przez kolejne 4–6 tygodni.

## Jak mierzyć efekty wdrożenia?

Topical authority w erze LLM-ów przestało być opcją. To absolutnie minimalny wymóg dla każdej domeny, która chce pojawiać się w AI Overviews, ChatGPT czy Perplexity. **Bez 8–15 powiązanych artykułów wokół jednego pillara statystycznie nie wchodzisz do top 10 domen w swojej kategorii, a w kategoriach porównań produktów top 10 zabiera aż 46% cytowań.**

Architektura pillar + cluster to najczystsza, najprostsza i najlepiej udokumentowana metodyka budowania autorytetu tematycznego. Wdrożenie zajmuje 8–12 tygodni dla jednego klastra. Wymaga żelaznej dyscypliny w linkowaniu wewnętrznym. Jednak ostateczny efekt – mierzony przez udział w głosie (Share of Voice) i wskaźnik cytowań (Citation Rate) – jest wysoce powtarzalny.

Podczas audytu GEO w ICEA zawsze zaczynamy od mapy pokrycia tematycznego. Sprawdzamy, czy klient posiada już struktury pillar + cluster, czy tonie w chaosie rozproszonych artykułów. Szukamy też luk, których nikt jeszcze nie zagospodarował. Taka mapa staje się punktem startowym planu działania (roadmapy) 30/60/90. To konkretna rozpiska pokazująca co napisać, co zoptymalizować i jak to wszystko połączyć. Jeśli chcesz zweryfikować własne pokrycie pod kątem cytowalności, [Ocena cytowalności strony](/narzedzia/url-check/) analizuje pojedynczy URL pod kątem 5 czynników struktury, schemy i wczesnego sygnalizowania informacji (front-loading).
