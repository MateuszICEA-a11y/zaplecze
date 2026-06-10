---
title: Claude Fable 5 – Anthropic udostępnia model klasy Mythos szerokiej publiczności
lead: Anthropic wprowadził Claude Fable 5 – pierwszy publicznie dostępny model z nowej klasy Mythos, plasującej się powyżej Opusa. Model jest najlepszy w niemal wszystkich testach możliwości AI, a przy ryzykownych zapytaniach z obszarów takich jak cyberbezpieczeństwo automatycznie oddaje głos słabszemu Opusowi 4.8. Równolegle ruszył Mythos 5 – ten sam model z poluzowanymi zabezpieczeniami, na razie tylko dla cyberobrońców w ramach Project Glasswing.
date: '2026-06-09'
sourceName: Anthropic
sourceUrl: https://www.anthropic.com/news/claude-fable-5-mythos-5
tags:
- Claude
- modele językowe
- bezpieczeństwo AI
- Anthropic
author: Redakcja widocznosc.ai
image: ../../assets/images/news-2026-06-09-claude-fable-5-model-klasy-mythos.webp
---
## Najmocniejszy model Anthropic trafia do wszystkich

Anthropic wprowadził Claude Fable 5. To pierwszy model nowej klasy Mythos – tej, którą firma stawia o szczebel wyżej niż dotychczasową klasę Opus. Według producenta Fable 5 osiąga najwyższe wyniki w niemal wszystkich testach możliwości AI: od inżynierii oprogramowania, przez analitykę i przetwarzanie obrazu, po badania naukowe. Reguła jest prosta. **Im dłuższe i bardziej złożone zadanie, tym wyraźniejsza przewaga modelu nad pozostałymi modelami firmy.** A cena? Startuje od 10 dolarów za milion tokenów wejścia i 50 dolarów za milion wyjścia – mniej niż połowa stawki za wcześniejszy Mythos Preview.

Najciekawsza jest tu jednak nie wydajność, lecz sposób udostępnienia tak zdolnego modelu. Zamiast odmawiać, Fable 5 przekierowuje. Nowy zestaw klasyfikatorów wyłapuje ryzykowne zapytania – z obszaru cyberbezpieczeństwa, biologii i chemii oraz tak zwanej dystylacji – i wtedy **odpowiedź generuje nie Fable, lecz słabszy Claude Opus 4.8**. Użytkownik dostaje o tym informację. Filtry nastawiono ostrożnie, więc czasem łapią też pytania nieszkodliwe. Mimo to, jak podaje Anthropic, uruchamiają się średnio w niespełna 5 proc. sesji. Pozostałe ponad 95 proc. działa na pełnym Fable.

Tego samego dnia zadebiutował także Claude Mythos 5. Pod spodem to dokładnie ten sam model, tyle że z zabezpieczeniami zdjętymi w wybranych obszarach. Dostają go nieliczni: zespoły cyberobrony i dostawcy kluczowej infrastruktury, na początek w ramach programu Project Glasswing prowadzonego we współpracy z rządem USA. Anthropic nazywa go modelem o najsilniejszych zdolnościach z zakresu cyberbezpieczeństwa na świecie.

Najprościej widać tę różnicę w zestawieniu obu modeli:

| | Claude Fable 5 | Claude Mythos 5 |
| --- | --- | --- |
| **Klasa** | Mythos (ponad Opusem) | Mythos – ten sam model |
| **Dla kogo** | wszyscy, publicznie | cyberobrońcy i dostawcy infrastruktury (Project Glasswing) |
| **Zabezpieczenia** | pełne; ryzykowne zapytania → Opus 4.8 | zdjęte w wybranych obszarach (m.in. cyber) |
| **Cena (wejście / wyjście za mln tokenów)** | 10 / 50 dolarów | 10 / 50 dolarów |

> **Nasz komentarz:** Najważniejsza nie jest tu sama liczba pobitych benchmarków, ale konstrukcja wdrożenia. Anthropic rozdziela „surowy” model od tego, co bezpiecznie podać publicznie, i zamiast twardej odmowy stosuje ciche przełączenie na słabszy Opus. To inny wzorzec bezpieczeństwa niż dotąd – kontrolą staje się architektura dostępu, a nie pojedyncza odpowiedź modelu.

## Zdolności rosną, więc rośnie też warstwa kontroli

Skok możliwości najlepiej widać na liczbach. Podczas wczesnych testów firma Stripe sprawdziła Fable 5 na własnym kodzie – i model skrócił miesiące pracy inżynierskiej do kilku dni. Migrację bazy kodu w Ruby, liczącej 50 milionów linii, ogarnął w jeden dzień. Ręcznie zajęłaby ona zespołowi ponad dwa miesiące. W teście jakości kodu Cognition FrontierCode Fable uzyskał najwyższy wynik w stawce czołowych modeli. Osobny rekord padł w zadaniach wizyjnych: model przeszedł grę *Pokémon FireRed* wyłącznie na podstawie zrzutów ekranu, bez żadnych dodatkowych narzędzi.

<figure class="yt-embed">
  <iframe src="https://www.youtube-nocookie.com/embed/Ty_50J84fMY" title="Claude Fable 5 przechodzi Pokémon FireRed wyłącznie na podstawie zrzutów ekranu" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
  <figcaption>Timelapse: Claude Fable 5 przechodzi <em>Pokémon FireRed</em> od początku do końca, korzystając wyłącznie ze zrzutów ekranu – bez map, podpowiedzi nawigacyjnych i dodatkowych danych o stanie gry.</figcaption>
</figure>

Pamięć też zrobiła swoje. W zadaniach długoterminowych dostęp do trwałych notatek podniósł skuteczność Fable trzykrotnie mocniej niż w przypadku Opusa 4.8.

Jeszcze mocniej wypada Mythos 5 w nauce. Projektowanie leków przyspieszył mniej więcej dziesięciokrotnie. W ślepych porównaniach naukowcy wybierali jego hipotezy z biologii molekularnej w około 80 proc. przypadków. A genomika? Tu przez ponad tydzień pracował niemal samodzielnie i wytrenował własny model uczenia maszynowego – sto razy mniejszy od rozwiązania opublikowanego niedawno w „Science”, a mimo to skuteczniejszy.

Im większe możliwości, tym grubsza warstwa kontroli. Najmocniejsze z nich – pełne cyberbezpieczeństwo i biologię – Anthropic zostawia na razie za dostępem warunkowym w Mythos 5. Publiczny Fable 5 to wariant z domkniętymi bezpiecznikami. Dochodzi do tego nowa polityka danych: cały ruch na modelach klasy Mythos podlega 30-dniowej retencji, ale **nie trafia do trenowania kolejnych modeli** – ma służyć wyłapywaniu nadużyć i ograniczaniu fałszywych alarmów. Firma sama przyznaje, że filtry są dziś celowo zbyt czułe, i zapowiada ich zawężanie. To czytelny sygnał: na tym poziomie zdolności tempo udostępniania świadomie ustępuje kontroli nad ryzykiem.

## W skrócie

- **Nowa klasa modeli** – Claude Fable 5 to pierwszy publicznie dostępny model klasy Mythos, którą Anthropic stawia ponad Opusem. Najwyższe wyniki w niemal wszystkich testach możliwości AI.
- **Bezpiecznik zamiast odmowy** – przy ryzykownych zapytaniach (cyberbezpieczeństwo, biologia i chemia, dystylacja) odpowiedź przejmuje Opus 4.8. Dotyczy średnio mniej niż 5 proc. sesji.
- **Mythos 5 z ograniczonym dostępem** – ten sam model z poluzowanymi zabezpieczeniami trafia na razie tylko do cyberobrońców w Project Glasswing. Cena obu: 10 i 50 dolarów za milion tokenów wejścia i wyjścia.
