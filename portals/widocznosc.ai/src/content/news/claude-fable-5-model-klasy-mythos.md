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

Anthropic zaprezentował Claude Fable 5 – pierwszy model z nowej klasy Mythos, którą firma pozycjonuje **wyżej niż dotychczasową klasę Opus**. Według producenta Fable 5 osiąga najwyższe wyniki w niemal wszystkich testowanych punktach odniesienia dla AI. Wyróżnia się zwłaszcza w inżynierii oprogramowania, analityce, przetwarzaniu obrazu oraz badaniach naukowych. **Im dłuższe i bardziej złożone zadanie, tym większa przewaga Fable 5 nad pozostałymi modelami firmy.** Cena startuje od 10 dolarów za milion tokenów wejścia i 50 dolarów za milion tokenów wyjścia. To mniej niż połowa stawki za wcześniejszy wariant Mythos Preview.

Najciekawszy jest jednak sposób, w jaki Anthropic zdecydował się udostępnić tak zaawansowany model. Zamiast generować standardową odmowę, Fable 5 korzysta z nowych klasyfikatorów. Wykrywają one ryzykowne zapytania z obszaru cyberbezpieczeństwa, biologii, chemii oraz tak zwanej dystylacji. **Gdy klasyfikator wykryje zagrożenie, odpowiedź generuje nie Fable, lecz słabszy Claude Opus 4.8, o czym użytkownik jest od razu informowany.** Zabezpieczenia skonfigurowano bardzo ostrożnie, dlatego czasem blokują również bezpieczne zapytania. Według firmy aktywują się one jednak w niespełna 5 proc. sesji. Ponad 95 proc. sesji przebiega bez zmiany modelu.

Tego samego dnia zadebiutował również Claude Mythos 5. To ten sam model co Fable 5, ale z wyłączonymi zabezpieczeniami w wybranych obszarach. Trafia on wyłącznie do wąskiej grupy ekspertów ds. cyberbezpieczeństwa oraz dostawców infrastruktury. Początkowo dostęp realizowany jest przez Project Glasswing, prowadzony we współpracy z rządem USA. **Anthropic określa go jako model o najsilniejszych na świecie zdolnościach z zakresu cyberbezpieczeństwa.**

> **Nasz komentarz:** Najważniejsza nie jest tu sama liczba pobitych benchmarków, ale konstrukcja wdrożenia. Anthropic rozdziela „surowy" model od tego, co bezpiecznie podać publicznie, i zamiast twardej odmowy stosuje ciche przełączenie na słabszy Opus. To inny wzorzec bezpieczeństwa niż dotąd – kontrolą staje się architektura dostępu, a nie pojedyncza odpowiedź modelu.

## Zdolności rosną, więc rośnie też warstwa kontroli

Anthropic obrazuje ten skok wydajności konkretnymi danymi. W testach przeprowadzonych z firmą Stripe Fable 5 skrócił miesiące pracy inżynierskiej do zaledwie kilku dni. Migrację bazy kodu Ruby liczącej 50 milionów linii wykonał w jeden dzień, podczas gdy zespołowi zajęłaby ona ręcznie ponad dwa miesiące. W ocenie Cognition FrontierCode model uzyskał najwyższy wynik wśród rynkowej czołówki. Z kolei w przetwarzaniu obrazu wyznaczył nowy standard – ukończył grę Pokémon FireRed wyłącznie na podstawie zrzutów ekranu, bez użycia dodatkowych narzędzi. **W zadaniach wymagających pamięci długoterminowej dostęp do trwałych notatek poprawił skuteczność Fable trzykrotnie mocniej niż w przypadku Opusa 4.8.**

Jeszcze większe wrażenie robią wyniki modelu Mythos 5 w badaniach naukowych. Według firmy Anthropic przyspieszył on wybrane etapy projektowania leków około dziesięciokrotnie. W ślepych testach naukowcy wybierali jego hipotezy z zakresu biologii molekularnej w około 80 proc. przypadków. W badaniach genomicznych Mythos 5 przez ponad tydzień pracował w dużej mierze autonomicznie. Wytrenował własny model uczenia maszynowego, który okazał się lepszy od rozwiązania opublikowanego niedawno w „Science”, mimo że był od niego sto razy mniejszy.

Właśnie dlatego Anthropic rozbudował warstwę kontroli. Najpotężniejsze funkcje – pełne cyberbezpieczeństwo i biologia – pozostają na razie objęte dostępem warunkowym w modelu Mythos 5. Z kolei publiczny Fable 5 to wariant z rygorystycznymi zabezpieczeniami. Firma wprowadza również nową politykę danych. Cały ruch w modelach klasy Mythos podlega 30-dniowej retencji, ale **nie jest wykorzystywany do trenowania kolejnych modeli**. Zebrane informacje służą głównie do wykrywania nadużyć i ograniczania fałszywych alarmów. Sama firma przyznaje, że filtry są obecnie celowo zbyt czułe i z czasem będą zawężane. To wyraźny sygnał, że przy tak wysokim poziomie zaawansowania tempo udostępniania nowości świadomie schodzi na dalszy plan wobec kontroli ryzyka.

## W skrócie

- **Nowa klasa modeli** – Claude Fable 5 to pierwszy publicznie dostępny model klasy Mythos, którą Anthropic stawia powyżej Opusa. Osiąga on najwyższe wyniki w niemal wszystkich testowanych punktach odniesienia.
- **Bezpiecznik zamiast odmowy** – przy ryzykownych zapytaniach (cyberbezpieczeństwo, biologia i chemia, dystylacja) odpowiedź przejmuje Opus 4.8. Przełączenie dotyczy średnio mniej niż 5 proc. sesji.
- **Mythos 5 z ograniczonym dostępem** – ten sam model z poluzowanymi zabezpieczeniami trafia na razie tylko do ekspertów ds. cyberbezpieczeństwa w ramach Project Glasswing. Cena obu modeli wynosi 10 i 50 dolarów za milion tokenów wejścia i wyjścia.
