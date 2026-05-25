---
title: 'Topical authority pod LLM-y – pillar + cluster w erze AI Overviews'
subtitle: 'Jak zbudować pokrycie tematyczne, które LLM-y będą cytować częściej niż treści konkurencji'
description: 'Dlaczego LLM-y faworyzują domeny z głębokim pokryciem jednej niszy. Jak zbudować architekturę pillar + cluster, która działa w erze AI Mode i AI Overviews. Konkretny szablon implementacji – od mapy tematów po linkowanie wewnętrzne.'
date: 2026-05-07
image: ../../../assets/images/blog-topical-authority.png
icon: '<circle cx="12" cy="6" r="2.5"/><circle cx="6" cy="14" r="2"/><circle cx="12" cy="14" r="2"/><circle cx="18" cy="14" r="2"/><circle cx="4" cy="20" r="1.5"/><circle cx="9" cy="20" r="1.5"/><circle cx="14" cy="20" r="1.5"/><circle cx="19" cy="20" r="1.5"/><line x1="12" y1="9" x2="6" y2="12"/><line x1="12" y1="9" x2="12" y2="12"/><line x1="12" y1="9" x2="18" y2="12"/>'
author:
  name: 'Piotr Wicenciak'
  role: 'SEO Operations Manager · ICEA'
  avatar: ../../../assets/images/authors/piotr-wicenciak.avif
readTime: '10 min'
tags: ['Topical Authority', 'Pillar Page', 'Content Strategy', 'GEO']
pillar: 'geo'
intent: 'INFO'
level: 'L2'
---

Większość stron wygrywających kiedyś w klasycznym SEO dzięki silnemu profilowi linkowemu **dziś przegrywa w AI Overviews**. Powód jest bolesny dla agencji link buildingowych: LLM-y nie patrzą na linki w taki sam sposób jak klasyczny algorytm. Zwracają uwagę na to, czy domena „wie wszystko" o danej niszy – a to mierzy się głębokością pokrycia, a nie liczbą backlinków. Dlatego koncepcja topical authority, znana w SEO od kilku lat, w erze GEO przestaje być miłym dodatkiem i staje się fundamentem.

## Co LLM-y rozumieją przez „autorytet"

Klasyczna wyszukiwarka Google opiera ocenę autorytetu na trzech filarach: linkach (PageRank), zachowaniu użytkowników (CTR, dwell time) i sygnałach E-E-A-T (autor, źródła, świeżość). LLM-y dodają do tego czwarty, znacznie ważniejszy filar:

> **Spójność pokrycia tematycznego.** Domena cytowana wielokrotnie w różnych podzapytaniach tego samego tematu jest traktowana jako autorytet w niszy.

<aside class="callout-fact">
  <div class="callout-icon">✦</div>
  <div class="callout-body">
    <div class="callout-label">Ciekawostka</div>
    <p>Pillar + cluster to nie wymysł ery LLM-ów. Architekturę wprowadził <strong>HubSpot w 2017 roku</strong> jako odpowiedź na semantyczne grupowanie wyników w klasycznym Google. Badacze z HubSpot pokazali, że strony zorganizowane w model pillar-cluster osiągają pozycje dla 4× więcej fraz długiego ogona niż strony zorganizowane chronologicznie po dacie publikacji. Dziewięć lat później ten sam mechanizm działa w warstwie pobierania informacji (retrieval) modeli językowych – tyle że stawka jest dużo wyższa.</p>
  </div>
</aside>

Mechanizm jest prosty, ale ma duże konsekwencje. Gdy silnik pobierający dane wyciąga fragmenty dla pojedynczego podzapytania, sprawdza, z jakiej domeny one pochodzą. Jeśli ta sama domena była wcześniej wybrana dla innych fragmentów w tej samej dziedzinie tematycznej, jej waga rośnie.

To nieformalny mechanizm, ale empirycznie potwierdzony. Kevin Indig pokazał na 1,2 mln cytowań ChatGPT, że **top 10 domen w danej niszy zabiera 46% wszystkich cytowań**. Reszta domen walczy o resztki.

LLM-y wykazują też tendencję do zaufania przez asocjację (ang. *domain trust by association*) – domena wielokrotnie cytowana razem z autorytatywnymi źródłami (Wikipedia, encyklopedie branżowe, publikacje akademickie) zaczyna być traktowana jako część tego samego klastra zaufania. To wzmacnia pozycję ugruntowanych graczy i utrudnia wejście nowym.

## Pillar + cluster – architektura, która spełnia te kryteria

Architektura pillar + cluster nie jest wymysłem ery GEO. Powstała w 2017 roku w HubSpot, oparta na badaniach ekspertów tej firmy, jako odpowiedź na rosnący nacisk Google na semantyczne grupowanie treści. Działa od dawna w klasycznym SEO, ale w erze LLM-ów jej wartość rośnie nieproporcjonalnie.

| Element | Rola | Długość | Intencja | Linkowanie |
|---|---|---|---|---|
| **Pillar page** | centralny hub tematyczny, kompleksowy przegląd | 3000–7000 słów | informacyjna, kategorialna | linkuje do 5–8 najważniejszych stron typu cluster |
| **Cluster pages** | szczegółowy aspekt głównego tematu | 1000–2500 słów | konkretne podzapytanie, transakcyjna | linkuje do pillara 2× + 3–5 innych stron w klastrze |

Dla LLM-ów ta struktura jest odczytywana jako: *„ta domena ma 10–25 artykułów silnie powiązanych tematycznie, wszystkie wskazują na centralny dokument"*. To bardzo silny sygnał autorytetu tematycznego. W zestawieniu z domeną mającą jeden samotny artykuł na ten sam temat, pillar + cluster wygrywa w ponad 80% przypadków – tak pokazują testy iPullRank na osadzeniach wektorowych (ang. embeddings) tekstu.

![Pillar + cluster – architektura topical authority: centralna strona pillar, 8 cluster pages dookoła w układzie hub-and-spoke, linkowanie cluster→pillar (2×) i cluster→cluster (3-5×), top 10 domen w niszy zabiera 46% cytowań AI](../../../assets/images/infographic-topical-authority.png)

## Jak zaprojektować mapę tematów

Pierwszy krok jest najtrudniejszy: zdefiniować, co jest pillarem, a co clusterem. Najczęstsze błędy polegają na zbyt szerokim albo zbyt wąskim wyborze pillara. Oto dwie zasady, które realnie działają w niszach komercyjnych:

### Zasada 1 – pillar to fraza, którą klient wpisuje na początku poszukiwań (researchu)

Pillarem dla agencji SEO mogłoby być *„pozycjonowanie w AI"*, dla firmy księgowej *„księgowość dla startupów"*, dla dystrybutora samochodów *„używane samochody dostawcze"*. To pytania na poziomie kategorii, z dużym search volume i komercyjną intencją.

### Zasada 2 – cluster to konkretne podzapytanie z fazy decyzji

Dla pillara *„pozycjonowanie w AI"* clusterami są:

- *„czym GEO różni się od SEO"*
- *„jak optymalizować content pod ChatGPT"*
- *„llms.txt – co to jest i jak wdrożyć"*
- *„narzędzia do śledzenia (trackingu) wyszukiwań AI"*
- *„case study GEO B2B SaaS"*

Każdy z nich ma własną, konkretną intencję i strukturę.

### Praktyczny szablon mapowania

Używamy go w ICEA dla każdego klienta rozpoczynającego wdrożenie GEO:

1. **Wybierz 3–5 głównych pillarów** dla swojej niszy.
2. **Dla każdego pillara wygeneruj 30 podzapytań** – wykorzystując narzędzia takie jak Qforia, GPT-4 z odpowiednim promptem albo Search Console i analizę autocomplete.
3. **Z 30 podzapytań wybierz 12–18**, które poruszają różne aspekty (intencja, format, faza decyzji).
4. **Każde z nich staje się tytułem strony typu cluster**.
5. **Sprawdź pokrycie konkurencji** – ile z tych 12–18 podzapytań ma już dobre wyniki w AI Mode? Reszta to białe plamy do zajęcia.

## Trzy żelazne reguły linkowania wewnętrznego

Sama struktura pillar + cluster nie wystarczy, jeśli artykuły nie są ze sobą powiązane linkami. Większość zespołów contentowych pisze artykuły osobno, w różnym czasie, i zapomina o systematycznym linkowaniu wewnętrznym. Efekt: 20 dobrych tekstów, które na poziomie LLM wyglądają jak 20 niezależnych dokumentów.

| Reguła | Co | Dlaczego |
|---|---|---|
| **Cluster → Pillar (min. 2×)** | każda strona typu cluster linkuje do pillara minimum 2 razy: we wstępie (kontekst nadrzędny) + w zakończeniu (CTA do pełnego przewodnika) | buduje graf topologiczny z wyraźnym hubem |
| **Cluster → Cluster (3–5×)** | każda strona typu cluster linkuje do 3–5 innych stron w tym samym pillarze, najbardziej powiązanych tematycznie | zagęszcza klaster, sygnalizuje gęste pokrycie |
| **Pillar → Cluster (5–8×)** | pillar linkuje do 5–8 najważniejszych stron typu cluster (nie wszystkich) | naturalna hierarchia typu hub-and-spoke |

<figure class="infographic">
<svg viewBox="0 0 800 480" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Pillar + cluster – 1 strona pillar w centrum z 8 cluster pages dookoła w układzie hub-and-spoke; linie ciągłe pomarańczowe to linkowanie cluster→pillar (2× z każdego), linie przerywane to cross-clustering 3-5×"><text x="20" y="32" fill="#ff6a2e" font-family="JetBrains Mono, monospace" font-size="11" letter-spacing="0.18em" font-weight="600">PILLAR + CLUSTER</text><text x="20" y="50" fill="#9da4b3" font-family="JetBrains Mono, monospace" font-size="10" letter-spacing="0.08em">ARCHITEKTURA TOPICAL AUTHORITY · HUB-AND-SPOKE</text><g stroke="#ff6a2e" stroke-opacity="0.55" stroke-width="1.8"><line x1="400" y1="80" x2="400" y2="240"/><line x1="513" y1="127" x2="400" y2="240"/><line x1="560" y1="240" x2="400" y2="240"/><line x1="513" y1="353" x2="400" y2="240"/><line x1="400" y1="400" x2="400" y2="240"/><line x1="287" y1="353" x2="400" y2="240"/><line x1="240" y1="240" x2="400" y2="240"/><line x1="287" y1="127" x2="400" y2="240"/></g><g stroke="#3a4055" stroke-width="1" stroke-dasharray="4,3" stroke-opacity="0.65" fill="none"><path d="M 400 80 Q 460 95 513 127"/><path d="M 513 127 Q 555 175 560 240"/><path d="M 560 240 Q 555 305 513 353"/><path d="M 513 353 Q 460 385 400 400"/><path d="M 400 400 Q 340 385 287 353"/><path d="M 287 353 Q 245 305 240 240"/><path d="M 240 240 Q 245 175 287 127"/><path d="M 287 127 Q 340 95 400 80"/></g><g font-family="JetBrains Mono, monospace" font-size="13" font-weight="600" fill="#ff6a2e" text-anchor="middle"><circle cx="400" cy="80" r="26" fill="#11131f" stroke="#ff6a2e" stroke-width="1.5"/><text x="400" y="85">01</text><circle cx="513" cy="127" r="26" fill="#11131f" stroke="#ff6a2e" stroke-width="1.5"/><text x="513" y="132">02</text><circle cx="560" cy="240" r="26" fill="#11131f" stroke="#ff6a2e" stroke-width="1.5"/><text x="560" y="245">03</text><circle cx="513" cy="353" r="26" fill="#11131f" stroke="#ff6a2e" stroke-width="1.5"/><text x="513" y="358">04</text><circle cx="400" cy="400" r="26" fill="#11131f" stroke="#ff6a2e" stroke-width="1.5"/><text x="400" y="405">05</text><circle cx="287" cy="353" r="26" fill="#11131f" stroke="#ff6a2e" stroke-width="1.5"/><text x="287" y="358">06</text><circle cx="240" cy="240" r="26" fill="#11131f" stroke="#ff6a2e" stroke-width="1.5"/><text x="240" y="245">07</text><circle cx="287" cy="127" r="26" fill="#11131f" stroke="#ff6a2e" stroke-width="1.5"/><text x="287" y="132">08</text></g><rect x="310" y="210" width="180" height="60" rx="10" fill="rgba(255,106,46,0.18)" stroke="#ff6a2e" stroke-width="2"/><text x="400" y="234" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="9" fill="#ff6a2e" letter-spacing="0.2em" font-weight="600">PILLAR</text><text x="400" y="256" text-anchor="middle" font-family="Inter Tight, system-ui" font-size="14" fill="#e6e7ed" font-weight="600">Główny temat</text><text x="400" y="446" text-anchor="middle" fill="#9da4b3" font-family="JetBrains Mono, monospace" font-size="9" letter-spacing="0.12em">SOLID = CLUSTER → PILLAR (2×) · DASH = CLUSTER → CLUSTER (3-5×)</text><text x="400" y="465" text-anchor="middle" fill="#5d6275" font-family="JetBrains Mono, monospace" font-size="9" letter-spacing="0.15em">TOP 10 DOMEN W NISZY = 46% CYTOWAŃ AI · KEVIN INDIG, 2026</text></svg>
<figcaption>1 pillar w centrum, 8 cluster pages dookoła. Pomarańczowe linie ciągłe – linkowanie cluster→pillar (2× z&nbsp;każdego). Przerywane – cross-clustering 3-5× między sąsiadującymi clustrami.</figcaption>
</figure>

W praktyce: dla pillara z 12 stronami typu cluster prawidłowo zaprojektowane linkowanie wewnętrzne generuje 30–40 linków w obrębie tego klastra. To dużo i wymaga dyscypliny, ale **efekt na widoczność w AI Mode jest mierzalny – w naszych testach domeny po wdrożeniu pełnego linkowania wewnętrznego rosły w SoV o 5–8 punktów procentowych w 90 dni**.

<aside class="callout-expert">
  <div class="callout-icon"><img src="/authors/piotr-wicenciak.avif" alt="Piotr Wicenciak" /></div>
  <div class="callout-body">
    <div class="callout-label">Opinia eksperta</div>
    <p>Najczęstszy błąd przy migracji do pillar+cluster: zespół content marketingu próbuje od razu zbudować 5 pillarów. To zabija projekt, bo każdy pillar wymaga 8–12 tygodni dyscypliny, a zespół robi pierwsze 3 i zostawia 2 niedokończone. <strong>Buduj jeden pillar do końca, mierz efekt na SoV przez kwartał, dopiero potem startuj drugi.</strong> Lepiej mieć jeden pillar na 100% niż pięć na 40%.</p>
    <div class="callout-author">Piotr Wicenciak · SEO Operations Manager, ICEA</div>
  </div>
</aside>

## Teksty zakotwiczenia (anchory) pod LLM-y

LLM-y nie tylko liczą linki – analizują też kontekst, w którym link się pojawia. Anchor (tekst zakotwiczenia) *„kliknij tutaj"* nie daje żadnej informacji semantycznej. Anchor *„pełna definicja query fan-out"* przekazuje od razu, czego dotyczy linkowany zasób.

Reguły anchor textów pod LLM-y:

- **Maksymalnie 60 znaków**, zawiera kluczowe słowo lub frazę kluczową dla linkowanej strony.
- **Naturalny w kontekście zdania** – niewymuszony zasadą „wciśnij na siłę frazę".
- **Niepowtarzający się w obrębie jednego artykułu** – każdy link do tej samej strony powinien mieć inny anchor (sygnał różnorodności semantycznej).
- **Pojawia się we fragmencie, który sam ma sens** – LLM często wybiera fragment 3-5 zdań wokół linka jako część reprezentującą linkowaną stronę.

Praktyczny audyt do zrobienia raz na pół roku: wyciągnij wszystkie anchory dla każdej ze stron typu cluster i sprawdź, czy są zróżnicowane semantycznie. Jeśli 80% linków do strony X używa tego samego anchora, masz problem – dla LLM wygląda to jak monokultura semantyczna, która nie wzmacnia, a osłabia sygnał zaufania.

## Jak startować, gdy masz już chaos contentowy

Większość projektów GEO nie startuje od zera. Istnieje już strona z chaotyczną historią contentową, kilkadziesiąt rozproszonych artykułów, brak wyraźnej struktury. Restart strategii pillar + cluster wymaga inwentaryzacji i przesunięcia, a nie pisania wszystkiego od nowa.

Kolejność działań w takiej sytuacji (sprawdzona w ponad 7 projektach klientów ICEA):

1. **Tygodnie 1–2: audyt istniejącego contentu** – wyciągnij wszystkie artykuły z bloga, oznacz je tematami nadrzędnymi (pillar). Zidentyfikuj artykuły naturalnie nadające się na pillar (kompleksowe, długie) i te będące materiałem na cluster.
2. **Tygodnie 3–4: wybór 1 pillara jako prototypu** – nie próbuj zbudować 5 pillarów naraz, zacznij od jednego, najbardziej komercyjnego. Wybierz 8–12 stron typu cluster z istniejącej bazy lub zaplanuj te do dopisania.
3. **Tygodnie 5–8: optymalizacja pillara + dopisanie brakujących clusterów** – pillar często wymaga rozbudowy do 3000–5000 słów, dodania struktury H2/H3 zgodnej z podzapytaniami, dodania linkowania wewnętrznego.
4. **Tygodnie 9–12: linkowanie wewnętrzne i monitoring** – wdrożenie pełnej macierzy linkowania, danych strukturalnych [schema.org](https://pl.wikipedia.org/wiki/Schema.org) dla pillara i clusterów, monitoring wskaźników SoV i Citation Rate przez kolejne 4–6 tygodni.

## Jak mierzyć efekty wdrożenia

Topical authority w erze LLM-ów nie jest wyborem – jest minimalnym wymogiem dla każdej domeny chcącej być cytowaną w AI Overviews, ChatGPT i Perplexity. **Bez 8–15 powiązanych artykułów wokół jednego pillara statystycznie nie wchodzisz do top 10 domen w danej niszy, a top 10 zabiera 46% cytowań.**

Pillar + cluster to najczystsza, najprostsza i najlepiej udokumentowana metodyka budowania autorytetu tematycznego. Wdrożenie zajmuje 8–12 tygodni dla jednego klastra i wymaga dyscypliny w linkowaniu wewnętrznym, ale efekt – mierzony przez udział w głosie (Share of Voice) i wskaźnik cytowań (Citation Rate) – jest powtarzalny.

W audycie GEO w ICEA pierwszą rzeczą, którą sprawdzamy, jest mapa pokrycia tematycznego: czy klient ma istniejące struktury pillar + cluster, czy chaos rozproszonych artykułów, czy luki, których nikt jeszcze nie zajął. Mapa staje się punktem startowym planu działania (roadmapy) 30/60/90 – konkretnym planem, co napisać, co przepisać, co zlinkować, w jakiej kolejności. Jeśli chcesz sprawdzić, jak wygląda Twoje pokrycie pod kątem cytowalności, [URL check](/narzedzia/url-check) analizuje pojedynczy URL pod kątem 5 czynników struktury, schemy i wczesnego sygnalizowania informacji (front-loading).
