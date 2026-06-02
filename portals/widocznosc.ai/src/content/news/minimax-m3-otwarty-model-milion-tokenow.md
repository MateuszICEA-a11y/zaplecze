---
title: MiniMax M3 – otwarty model z milionem tokenów rzuca wyzwanie liderom
lead: Chiński MiniMax udostępnił M3 – model z otwartymi wagami, oknem miliona tokenów i wynikami zbliżonymi do Opus 4.7 oraz GPT-5.5. To kolejny sygnał, że dystans między modelami otwartymi a zamkniętą czołówką szybko topnieje.
date: '2026-06-01'
sourceName: The Decoder
sourceUrl: https://the-decoder.com/minimax-m3-open-weight-model-with-a-million-token-context-challenges-proprietary-leaders/
tags:
- MiniMax
- modele open-weight
- okno kontekstowe
- benchmarki
author: Redakcja widocznosc.ai
image: ../../assets/images/news-2026-06-01-minimax-m3-otwarty-model-milion-tokenow.webp
---

## MiniMax M3 celuje w czołówkę z otwartymi wagami

MiniMax, chińska firma AI, pokazała M3 – model z otwartymi wagami, który ma rywalizować z zamkniętą czołówką. Kluczowa jest architektura MiniMax Sparse Attention (MSA): zamiast przetwarzać cały kontekst, model sięga tylko po istotne bloki danych, co ma utrzymać wydajność przy oknie liczącym **milion tokenów**. M3 jest też natywnie multimodalny – tekst i obraz są ze sobą przeplatane już na poziomie danych wejściowych.

Najmocniej przemawiają wyniki. Na SWE-Bench Pro M3 osiąga 59 proc., a w teście autonomicznego przeszukiwania sieci BrowseComp – 83,5 punktu. Na PostTrainBench plasuje się tuż za Opus 4.7 i GPT-5.5, a w porównaniach pojawiają się też Opus 4.8 i Gemini 3.1 Pro. Osobno MiniMax raportuje testy długiej autonomii: 12-godzinną reprodukcję pracy naukowej z wynikiem 0,650 oraz 24-godzinną optymalizację kerneli GPU, w której model dobił do 71,3 proc. wykorzystania sprzętu.

> **Nasz komentarz:** Najciekawsze w M3 nie jest samo okno miliona tokenów, lecz to, że model otwarty dogania zamkniętą czołówkę w zadaniach trwających godzinami, a nie w pojedynczym prompcie.

## Dlaczego długa autonomia liczy się bardziej niż rozmiar okna

Naszym zdaniem M3 dobrze pokazuje, gdzie naprawdę przesuwa się rywalizacja modeli. Liczba tokenów w oknie robi wrażenie, ale o realnej różnicy decyduje mechanizm rzadkiej uwagi – bez niego milion tokenów byłby kosztowny i wolny. To inżynierska odpowiedź na problem, z którym mierzą się wszyscy dostawcy: jak utrzymać sensowną cenę i szybkość, gdy kontekst rośnie.

Drugi sygnał jest jeszcze ważniejszy. Benchmarki 12- i 24-godzinne mierzą coś innego niż klasyczne testy wiedzy – sprawdzają, czy model potrafi prowadzić wielogodzinne, wieloetapowe zadanie bez utraty spójności po drodze. W naszej ocenie to właśnie ten wymiar – długa autonomia agentowa – staje się nowym polem, na którym modele będą się różnicować.

- **Otwarte wagi blisko czołówki** – jeśli wyniki potwierdzą się po publikacji raportu, przewaga zamkniętych modeli na części zadań kurczy się do kilku punktów.
- **Architektura, nie tylko skala** – sparse attention pokazuje, że dalszy postęp to nie wyłącznie „więcej parametrów", lecz sprytniejsze przetwarzanie kontekstu.

API M3 jest dostępne od razu, a wagi i raport techniczny mają trafić do sieci w ciągu około dziesięciu dni – dopiero wtedy deklarowane wyniki da się niezależnie zweryfikować. Cennik startuje od 20 USD miesięcznie (ok. 1,7 mld tokenów) i sięga 120 USD (ok. 9,8 mld), przy czym konteksty powyżej 512 tys. tokenów kosztują więcej.

## W skrócie

- MiniMax wypuścił M3 – otwarty, multimodalny model z oknem miliona tokenów i architekturą rzadkiej uwagi (MSA).
- Wyniki (SWE-Bench Pro 59 proc., BrowseComp 83,5; PostTrainBench tuż za Opus 4.7 i GPT-5.5) plasują go blisko zamkniętej czołówki.
- Naszym zdaniem najważniejszym sygnałem są testy 12- i 24-godzinne – rywalizacja modeli przenosi się na długą autonomię agentową.
