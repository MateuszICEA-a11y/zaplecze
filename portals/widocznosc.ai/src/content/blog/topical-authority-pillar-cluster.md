---
title: 'Topical authority pod LLM-y – pillar + cluster w erze AI Overviews'
subtitle: 'Jak zbudować pokrycie tematyczne, które LLM-y będą cytować częściej niż konkurencję'
description: 'Dlaczego LLM-y faworyzują domeny z głębokim pokryciem jednej niszy. Jak zbudować architekturę pillar + cluster, która działa w erze AI Mode i AI Overviews. Konkretny szablon implementacji – od mapy tematów do interlinking.'
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

Większość stron, które kiedyś wygrywały w klasycznym SEO dzięki silnemu profilowi linkowemu, dziś przegrywa w AI Overviews. Powód jest niemiły dla agencji link buildingowych: LLM-y nie patrzą na linki w taki sam sposób jak klasyczny algorytm. Patrzą na to, czy domena „wie wszystko" o danej niszy – a to mierzy się głębokością pokrycia, nie liczbą backlinków. Dlatego topical authority, koncepcja znana w SEO od kilku lat, w erze GEO przestaje być nice-to-have i staje się fundamentem.

## Co LLM-y rozumieją przez „autorytet"

Klasyczny Google opiera ocenę autorytetu strony na trzech filarach: linkach (PageRank), zachowaniu użytkowników (CTR, dwell time, pogo-sticking) i sygnałach E-E-A-T (autor, źródła, freshness). LLM-y działające w erze AI Overviews, ChatGPT i Perplexity dodają do tego czwarty, znacznie ważniejszy filar: **konsystencję pokrycia tematycznego**.

Mechanizm jest prosty, ale ma ogromne konsekwencje. Gdy retrieval engine wyciąga pasaże dla pojedynczego synthetic query, sprawdza, z jakiej domeny pochodzi pasaż. Jeśli ta sama domena wcześniej była wybrana dla innych pasaży w tej samej dziedzinie tematycznej (powiedzmy, wcześniejszych zapytaniach z tej samej sesji albo w analizie batch), jej waga rośnie. To nieformalny mechanizm, ale empirycznie potwierdzony – Kevin Indig pokazał na 1,2 mln cytowań ChatGPT, że top 10 domen w danej niszy zabiera 46% wszystkich cytowań. Reszta domen walczy o resztki.

Co więcej, LLM-y mają tendencję do „domain trust by association" – jeśli dana domena jest wielokrotnie cytowana razem z autorytatywnymi źródłami (Wikipedia, encyklopedie branżowe, publikacje akademickie), zaczyna być traktowana jako część tego samego klastra trustu. To wzmacnia pozycje domen, które już są wewnątrz, i utrudnia wejście nowych graczy.

## Pillar + cluster – architektura, która spełnia te kryteria

Architektura pillar + cluster nie jest wymysłem ery GEO. Powstała w 2017 roku w HubSpot, oparta o badania Brian Halligan i Marka Roberge, jako odpowiedź na rosnący nacisk Google na semantyczną grupowość treści. Działa od dawna w klasycznym SEO, ale w erze LLM jej wartość rośnie nieproporcjonalnie.

**Pillar page** to rozległy, długi (3000–7000 słów), kompleksowy artykuł o szerokim temacie nadrzędnym. Nie zawiera wszystkich szczegółów – zawiera za to kompletny przegląd zagadnienia, z linkami do bardziej szczegółowych podtematów. Pillar pełni dwie funkcje: wewnętrznie jest centralnym hubem, do którego biegną linki z cluster pages; zewnętrznie jest punktem zaczepienia dla głównych zapytań kategorii.

**Cluster pages** to 8–20 (czasem więcej) bardziej szczegółowych artykułów, każdy adresujący jeden konkretny aspekt głównego tematu. Każdy cluster page linkuje do pillar page (sygnał: ten temat jest częścią większej całości) i do innych cluster pages w tym samym klastrze (sygnał: pokrycie tematyczne jest gęste).

Dla LLM ta struktura czyta się jako: „ta domena ma 10–25 artykułów silnie powiązanych tematycznie, wszystkie wskazują na centralny dokument". To bardzo silny sygnał topical authority. W zestawieniu z domeną mającą jeden samotny artykuł na ten sam temat, pillar + cluster wygrywa w 80%+ przypadków – tak pokazują testy iPullRank na embedingach tekstu.

## Jak zaprojektować mapę tematów

Pierwszy krok jest najtrudniejszy: zdefiniować, co jest pillar, a co cluster. Najczęstsze błędy polegają na zbyt szerokim albo zbyt wąskim wyborze pillar. Dwie zasady, które realnie działają w niszach komercyjnych:

**Zasada 1: pillar to fraza, którą klient wpisuje, gdy nie wie jeszcze, czego dokładnie szuka**. Pillar dla agencji SEO mógłby być *„pozycjonowanie w AI"*, dla firmy księgowej *„księgowość dla startupów"*, dla dystrybutora samochodów *„używane samochody dostawcze"*. To pytania na poziomie kategorii, z dużym search volume i komercyjną intencją.

**Zasada 2: cluster to konkretne podpytanie, które klient zadaje, gdy zna już temat i chce szczegółów**. Dla pillar *„pozycjonowanie w AI"* clustery to: *„czym GEO różni się od SEO"*, *„jak optymalizować content pod ChatGPT"*, *„llms.txt – co to jest i jak wdrożyć"*, *„narzędzia do trackingu AI search"*, *„case study GEO B2B SaaS"*. Każdy z nich ma własną intencję, własny konkretny intent i własną strukturę.

Praktyczny szablon mapowania (używamy go w ICEA dla każdego klienta zaczynającego z GEO):

1. Wybierz 3–5 głównych pillar tematów dla swojej niszy
2. Dla każdego pillar wygeneruj 30 synthetic queries (Qforia, GPT-4 z odpowiednim promptem, albo Search Console + analiza autocomplete)
3. Z 30 podzapytań wybierz 12–18, które adresują różne aspekty (intent, format, faza decyzji)
4. Każde z nich staje się titleem cluster page
5. Sprawdź pokrycie konkurencji – ile z tych 12–18 podzapytań ma już dobre wyniki w AI Mode? To są sloty już zajęte. Reszta to białe plamy do zajęcia.

## Interlinking – ukryta przewaga pillar + cluster

Sama struktura pillar + cluster nie wystarczy, jeśli artykuły nie są ze sobą powiązane linkami. Tu jest typowa pułapka – większość zespołów contentowych pisze artykuły osobno, w różnym czasie, i zapomina o systematycznym dolinkowaniu. Efekt: 20 dobrych tekstów, które na poziomie LLM wyglądają jak 20 niezależnych dokumentów, nie jak spójna baza wiedzy.

Trzy żelazne reguły interlinking dla architektury pillar + cluster pod LLM-y:

**Każdy cluster linkuje do pillar minimum 2 razy**. Pierwszy raz w intro (kontekst nadrzędny), drugi raz w zakończeniu (call-to-action do pełnego przewodnika). To buduje topology graph z wyraźnym hubem.

**Każdy cluster linkuje do 3–5 innych cluster pages w tym samym pillarze**. Nie wszystkich – tylko najbardziej powiązanych tematycznie. Linkowanie cluster do clustra w innym pillarze osłabia sygnał spójności klastra.

**Pillar linkuje do każdego cluster minimum raz, ale nie obowiązkowo do wszystkich**. Pillar może linkować do 5–8 najważniejszych clusters. Reszta pojawia się przez interlinking lateral między clusters. To naturalna hierarchia, którą LLM rozumie jako „pillar wskazuje główne odgałęzienia, clusters wskazują na siebie wzajemnie".

W praktyce: jeśli masz pillar i 12 clusters, prawidłowo zaprojektowany interlinking generuje minimum 30–40 wewnętrznych linków w obrębie tego klastra. To dużo i wymaga dyscypliny, ale efekt na widoczność w AI Mode jest mierzalny – w naszych testach domeny po wdrożeniu pełnego interlinkingu rosły w SoV o 5–8 punktów procentowych w 90 dni.

## Anchor texts i kontekst pasażu

Drugi techniczny szczegół, który większość zespołów ignoruje: jakość anchor textów linków wewnętrznych. LLM-y nie tylko liczą linki – analizują też kontekst, w którym link się pojawia. Anchor *„kliknij tutaj"* nie daje żadnej informacji semantycznej. Anchor *„pełna definicja query fan-out"* przekazuje od razu, czego dotyczy linkowany zasób.

Reguły anchor textów pod LLM:

- Maksymalnie 60 znaków, zawiera kluczowe słowo lub frazę kluczową dla linkowanej strony
- Naturalny w kontekście zdania – nie wymuszony „wciśnij na siłę frazę"
- Nie powtarzający się w obrębie jednego artykułu – każdy link do tej samej strony powinien mieć inny anchor (sygnał różnorodności semantycznej)
- Pojawia się w pasażu, który sam ma sens – LLM często wybiera fragment 3–5 zdań wokół linka jako pasaż reprezentujący linkowaną stronę

Praktyczny audit, który warto zrobić raz na pół roku: wyciągnij wszystkie anchor textów dla każdego cluster page i sprawdź, czy są zróżnicowane semantycznie. Jeśli 80% linków do strony X używa tego samego anchora, masz problem – dla LLM wygląda to jak monokultura semantyczna, która nie wzmacnia, a osłabia sygnał trustu.

## Co robić, gdy startujesz od zera

Większość projektów GEO nie startuje na zielonym polu – jest istniejąca strona z chaotyczną historią contentową, kilkadziesiąt rozproszonych artykułów, brak wyraźnej struktury. Restart strategii pillar + cluster wymaga inwentaryzacji i przesunięcia, nie pisania wszystkiego od nowa.

Kolejność działań w takiej sytuacji (sprawdzona w 7+ projektach klientów ICEA):

**Tydzień 1–2: audyt istniejącego contentu**. Wyciągnij wszystkie artykuły z bloga, oznacz je tematami nadrzędnymi (pillar). Zidentyfikuj artykuły, które są naturalnie dobre na pillar (kompleksowe, długie, ogólne), i te, które są materiałem na cluster.

**Tydzień 3–4: wybór 1 pillara do prototypu**. Nie próbuj zbudować 5 pillars naraz – zacznij od jednego, najbardziej komercyjnego. Wybierz 8–12 cluster pages z istniejącej bazy lub zaplanuj te, które trzeba dopisać.

**Tydzień 5–8: optymalizacja pillar + dopisanie brakujących cluster**. Pillar często wymaga rozbudowy do 3000–5000 słów, dodania struktury H2/H3 zgodnej z synthetic queries, dodania interlinkingu do cluster pages.

**Tydzień 9–12: interlinking i monitoring**. Wdrożenie pełnej macierzy interlinking, schema.org dla pillar i cluster, monitoring SoV i Citation Rate przez kolejne 4–6 tygodni.

## Wnioski

Topical authority w erze LLM nie jest wyborem – jest minimalnym wymogiem dla każdej domeny, która chce być cytowana w AI Overviews, ChatGPT i Perplexity. Bez 8–15 powiązanych artykułów wokół jednego pillara, statystycznie nie wchodzisz do top 10 domen w danej niszy, a top 10 zabiera 46% cytowań.

Pillar + cluster to najczystsza, najprostsza i najlepiej udokumentowana metodyka budowania topical authority. Wdrożenie zajmuje 8–12 tygodni dla jednego klastra i wymaga dyscypliny w interlinking, ale efekt – mierzony przez SoV i Citation Rate – jest powtarzalny.

W audycie GEO w ICEA pierwszą rzeczą, którą sprawdzamy, jest mapa pokrycia tematycznego: czy klient ma istniejące pillar + cluster, czy ma chaos rozproszonych artykułów, czy ma luki, których nikt jeszcze nie zajął. Mapa staje się punktem startowym roadmapy 30/60/90 – konkretnym planem, co napisać, co przepisać, co zlinkować, w jakiej kolejności.
