---
title: 'Topical authority pod LLM-y – pillar + cluster w erze AI Overviews'
subtitle: 'Jak zbudować pokrycie tematyczne, które LLM-y będą cytować częściej niż konkurencję'
description: 'Dlaczego LLM-y faworyzują domeny z głębokim pokryciem jednej niszy. Jak zbudować architekturę pillar + cluster, która działa w erze AI Mode i AI Overviews. Konkretny szablon implementacji – od mapy tematów po interlinking.'
date: 2026-05-07
image: ../../assets/images/blog-topical-authority.png
icon: '<circle cx="12" cy="6" r="2.5"/><circle cx="6" cy="14" r="2"/><circle cx="12" cy="14" r="2"/><circle cx="18" cy="14" r="2"/><circle cx="4" cy="20" r="1.5"/><circle cx="9" cy="20" r="1.5"/><circle cx="14" cy="20" r="1.5"/><circle cx="19" cy="20" r="1.5"/><line x1="12" y1="9" x2="6" y2="12"/><line x1="12" y1="9" x2="12" y2="12"/><line x1="12" y1="9" x2="18" y2="12"/>'
author:
  name: 'Piotr Wicenciak'
  role: 'Team Leader SEO · ICEA'
  avatar: ../../assets/images/authors/piotr-wicenciak.avif
readTime: '10 min'
tags: ['Topical Authority', 'Pillar Page', 'Content Strategy', 'GEO']
category: 'content'
---

Większość stron wygrywających kiedyś w klasycznym SEO dzięki silnemu profilowi linkowemu **dziś przegrywa w AI Overviews**. Powód jest niemiły dla agencji link buildingowych: LLM-y nie patrzą na linki w taki sam sposób jak klasyczny algorytm. Patrzą na to, czy domena „wie wszystko" o danej niszy – a to mierzy się głębokością pokrycia, nie liczbą backlinków. Dlatego topical authority, znana w SEO od kilku lat, w erze GEO przestaje być nice-to-have i staje się fundamentem.

## Co LLM-y rozumieją przez „autorytet"

Klasyczny Google opiera ocenę autorytetu na trzech filarach: linkach (PageRank), zachowaniu użytkowników (CTR, dwell time) i sygnałach E-E-A-T (autor, źródła, świeżość). LLM-y dodają do tego czwarty, znacznie ważniejszy filar:

> **Konsystencja pokrycia tematycznego.** Domena cytowana wielokrotnie w różnych podzapytaniach tego samego tematu jest traktowana jako autorytet w niszy.

Mechanizm jest prosty, ale ma duże konsekwencje. Gdy silnik pobierający dane wyciąga fragmenty dla pojedynczego podzapytania, sprawdza, z jakiej domeny pochodzi fragment. Jeśli ta sama domena była wcześniej wybrana dla innych fragmentów w tej samej dziedzinie tematycznej, jej waga rośnie.

To nieformalny mechanizm, ale empirycznie potwierdzony. Kevin Indig pokazał na 1,2 mln cytowań ChatGPT, że **top 10 domen w danej niszy zabiera 46% wszystkich cytowań**. Reszta domen walczy o resztki.

LLM-y mają też tendencję do *„domain trust by association"* – domena wielokrotnie cytowana razem z autorytatywnymi źródłami (Wikipedia, encyklopedie branżowe, publikacje akademickie) zaczyna być traktowana jako część tego samego klastra trustu. To wzmacnia pozycje już-w-środku i utrudnia wejście nowych graczy.

## Pillar + cluster – architektura, która spełnia te kryteria

Architektura pillar + cluster nie jest wymysłem ery GEO. Powstała w 2017 roku w HubSpot, oparta o badania Brian Halligan i Marka Roberge, jako odpowiedź na rosnący nacisk Google na semantyczną grupowość treści. Działa od dawna w klasycznym SEO, ale w erze LLM jej wartość rośnie nieproporcjonalnie.

| Element | Rola | Długość | Intent | Linkowanie |
|---|---|---|---|---|
| **Pillar page** | centralny hub tematyczny, kompleksowy przegląd | 3000–7000 słów | informacyjny, kategorialny | linkuje do 5–8 najważniejszych cluster |
| **Cluster pages** | szczegółowy aspekt głównego tematu | 1000–2500 słów | konkretne podpytanie, transakcyjne | linkuje do pillar 2× + 3–5 innych cluster |

Dla LLM ta struktura czyta się jako: *„ta domena ma 10–25 artykułów silnie powiązanych tematycznie, wszystkie wskazują na centralny dokument"*. To bardzo silny sygnał autorytetu tematycznego. W zestawieniu z domeną mającą jeden samotny artykuł na ten sam temat, pillar + cluster wygrywa w 80%+ przypadków – tak pokazują testy iPullRank na embedingach tekstu.

## Jak zaprojektować mapę tematów

Pierwszy krok jest najtrudniejszy: zdefiniować, co jest pillar, a co cluster. Najczęstsze błędy polegają na zbyt szerokim albo zbyt wąskim wyborze pillar. Dwie zasady, które realnie działają w niszach komercyjnych.

### Zasada 1 – pillar to fraza, którą klient wpisuje na początku researchu

Pillar dla agencji SEO mógłby być *„pozycjonowanie w AI"*, dla firmy księgowej *„księgowość dla startupów"*, dla dystrybutora samochodów *„używane samochody dostawcze"*. To pytania na poziomie kategorii, z dużym search volume i komercyjną intencją.

### Zasada 2 – cluster to konkretne podpytanie z fazy decyzji

Dla pillara *„pozycjonowanie w AI"* clustery to:

- *„czym GEO różni się od SEO"*
- *„jak optymalizować content pod ChatGPT"*
- *„llms.txt – co to jest i jak wdrożyć"*
- *„narzędzia do trackingu AI search"*
- *„case study GEO B2B SaaS"*

Każdy z nich ma własną intencję, własny konkretny intent i własną strukturę.

### Praktyczny szablon mapowania

Używamy go w ICEA dla każdego klienta zaczynającego z GEO:

1. **Wybierz 3–5 głównych pillarów** dla swojej niszy
2. **Dla każdego pillara wygeneruj 30 podzapytań** – Qforia, GPT-4 z odpowiednim promptem albo Search Console + analiza autocomplete
3. **Z 30 podzapytań wybierz 12–18**, które adresują różne aspekty (intent, format, faza decyzji)
4. **Każde z nich staje się tytułem cluster page**
5. **Sprawdź pokrycie konkurencji** – ile z tych 12–18 podzapytań ma już dobre wyniki w AI Mode? Reszta to białe plamy do zajęcia

## Trzy żelazne reguły interlinkingu

Sama struktura pillar + cluster nie wystarczy, jeśli artykuły nie są ze sobą powiązane linkami. Większość zespołów contentowych pisze artykuły osobno, w różnym czasie, i zapomina o systematycznym dolinkowaniu. Efekt: 20 dobrych tekstów, które na poziomie LLM wyglądają jak 20 niezależnych dokumentów.

| Reguła | Co | Dlaczego |
|---|---|---|
| **Cluster → Pillar (min. 2×)** | każdy cluster linkuje do pillara minimum 2 razy: w intro (kontekst nadrzędny) + w zakończeniu (CTA do pełnego przewodnika) | buduje topology graph z wyraźnym hubem |
| **Cluster → Cluster (3–5×)** | każdy cluster linkuje do 3–5 innych cluster pages w tym samym pillarze, najbardziej powiązanych tematycznie | zagęszcza klaster, sygnalizuje gęste pokrycie |
| **Pillar → Cluster (5–8×)** | pillar linkuje do 5–8 najważniejszych cluster (nie wszystkich) | naturalna hierarchia hub-and-spoke |

W praktyce: dla pillara z 12 cluster pages prawidłowo zaprojektowany interlinking generuje 30–40 wewnętrznych linków w obrębie tego klastra. To dużo i wymaga dyscypliny, ale **efekt na widoczność w AI Mode jest mierzalny – w naszych testach domeny po wdrożeniu pełnego interlinkingu rosły w SoV o 5–8 punktów procentowych w 90 dni**.

## Anchor texts pod LLM

LLM-y nie tylko liczą linki – analizują też kontekst, w którym link się pojawia. Anchor *„kliknij tutaj"* nie daje żadnej informacji semantycznej. Anchor *„pełna definicja query fan-out"* przekazuje od razu, czego dotyczy linkowany zasób.

Reguły anchor textów pod LLM:

- **Maksymalnie 60 znaków**, zawiera kluczowe słowo lub frazę kluczową dla linkowanej strony
- **Naturalny w kontekście zdania** – nie wymuszony „wciśnij na siłę frazę"
- **Nie powtarzający się w obrębie jednego artykułu** – każdy link do tej samej strony powinien mieć inny anchor (sygnał różnorodności semantycznej)
- **Pojawia się w fragmencie, który sam ma sens** – LLM często wybiera fragment 3-5 zdań wokół linka jako pasaż reprezentujący linkowaną stronę

Praktyczny audyt do zrobienia raz na pół roku: wyciągnij wszystkie anchor texty dla każdego cluster page i sprawdź, czy są zróżnicowane semantycznie. Jeśli 80% linków do strony X używa tego samego anchora, masz problem – dla LLM wygląda to jak monokultura semantyczna, która nie wzmacnia, a osłabia sygnał trustu.

## Jak startować, gdy masz już chaos contentowy

Większość projektów GEO nie startuje na zielonym polu. Jest istniejąca strona z chaotyczną historią contentową, kilkadziesiąt rozproszonych artykułów, brak wyraźnej struktury. Restart strategii pillar + cluster wymaga inwentaryzacji i przesunięcia, nie pisania wszystkiego od nowa.

Kolejność działań w takiej sytuacji (sprawdzona w 7+ projektach klientów ICEA):

1. **Tygodnie 1–2: audyt istniejącego contentu** – wyciągnij wszystkie artykuły z bloga, oznacz je tematami nadrzędnymi (pillar). Zidentyfikuj artykuły naturalne na pillar (kompleksowe, długie) i te będące materiałem na cluster
2. **Tygodnie 3–4: wybór 1 pillara do prototypu** – nie próbuj zbudować 5 pillars naraz, zacznij od jednego, najbardziej komercyjnego. Wybierz 8–12 cluster pages z istniejącej bazy lub zaplanuj te do dopisania
3. **Tygodnie 5–8: optymalizacja pillara + dopisanie brakujących cluster** – pillar często wymaga rozbudowy do 3000–5000 słów, dodania struktury H2/H3 zgodnej z podzapytaniami, dodania interlinkingu
4. **Tygodnie 9–12: interlinking i monitoring** – wdrożenie pełnej macierzy interlinking, [schema.org](https://pl.wikipedia.org/wiki/Schema.org) dla pillara i cluster, monitoring SoV i Citation Rate przez kolejne 4–6 tygodni

## Wnioski

Topical authority w erze LLM nie jest wyborem – jest minimalnym wymogiem dla każdej domeny chcącej być cytowanej w AI Overviews, ChatGPT i Perplexity. **Bez 8–15 powiązanych artykułów wokół jednego pillara statystycznie nie wchodzisz do top 10 domen w danej niszy, a top 10 zabiera 46% cytowań.**

Pillar + cluster to najczystsza, najprostsza i najlepiej udokumentowana metodyka budowania autorytetu tematycznego. Wdrożenie zajmuje 8–12 tygodni dla jednego klastra i wymaga dyscypliny w interlinkingu, ale efekt – mierzony przez Share of Voice i Citation Rate – jest powtarzalny.

W audycie GEO w ICEA pierwszą rzeczą, którą sprawdzamy, jest mapa pokrycia tematycznego: czy klient ma istniejące pillar + cluster, czy chaos rozproszonych artykułów, czy luki, których nikt jeszcze nie zajął. Mapa staje się punktem startowym roadmapy 30/60/90 – konkretnym planem, co napisać, co przepisać, co zlinkować, w jakiej kolejności. Jeśli chcesz sprawdzić, jak wygląda Twoje pokrycie pod kątem cytowalności, [URL check](/narzedzia/url-check) analizuje pojedynczy URL pod 5 czynnikami struktury, schemy i front-loadingu.
