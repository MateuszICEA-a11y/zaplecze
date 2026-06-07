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
MiniMax, chińska firma AI, pokazała M3 – model z otwartymi wagami, który rzuca wyzwanie zamkniętej czołówce. Kluczową rolę odgrywa tu architektura MiniMax Sparse Attention (MSA). Zamiast przetwarzać cały kontekst, model sięga wyłącznie po istotne bloki danych. **To właśnie ten mechanizm ma utrzymać wydajność przy oknie liczącym milion tokenów.** M3 jest również natywnie multimodalny, co oznacza, że tekst i obraz przeplatają się już na poziomie danych wejściowych.

Najmocniej przemawiają jednak wyniki. Na SWE-Bench Pro M3 osiąga 59 proc., a w teście autonomicznego przeszukiwania sieci BrowseComp – 83,5 punktu. Na PostTrainBench plasuje się tuż za Opus 4.7 i GPT-5.5, a w porównaniach pojawiają się też Opus 4.8 i Gemini 3.1 Pro. Osobno MiniMax raportuje testy długiej autonomii. **Mowa tu o 12-godzinnej reprodukcji pracy naukowej z wynikiem 0,650 oraz 24-godzinnej optymalizacji kerneli GPU, gdzie model dobił do 71,3 proc. wykorzystania sprzętu.**
> **Nasz komentarz:** Najciekawsze w M3 nie jest samo okno miliona tokenów, lecz to, że model otwarty dogania zamkniętą czołówkę w zadaniach trwających godzinami, a nie w pojedynczym prompcie.

## Dlaczego długa autonomia liczy się bardziej niż rozmiar okna

M3 doskonale pokazuje, gdzie obecnie przesuwa się rywalizacja modeli. Sama liczba tokenów w oknie robi wrażenie, ale o realnej przewadze decyduje mechanizm rzadkiej uwagi. Bez niego milion tokenów byłby po prostu wolny i absurdalnie drogi. **To konkretna inżynierska odpowiedź na problem wszystkich dostawców: jak utrzymać sensowną cenę i szybkość przy rosnącym kontekście.**

Drugi sygnał jest jeszcze ważniejszy. Benchmarki 12- i 24-godzinne mierzą zupełnie coś innego niż klasyczne testy wiedzy. Sprawdzają, czy model potrafi prowadzić wieloetapowe zadanie bez utraty spójności po drodze. **To właśnie długa autonomia agentowa staje się nowym polem, na którym modele będą się ostatecznie różnicować.**

- **Otwarte wagi blisko czołówki** – jeśli wyniki potwierdzą się po publikacji raportu, przewaga zamkniętych modeli na części zadań skurczy się do zaledwie kilku punktów.
- **Architektura, nie tylko skala** – sparse attention udowadnia, że dalszy postęp to nie wyłącznie „więcej parametrów", lecz sprytniejsze przetwarzanie kontekstu.

API M3 jest dostępne od razu. Wagi i raport techniczny mają trafić do sieci w ciągu około dziesięciu dni – dopiero wtedy deklarowane wyniki będzie można niezależnie zweryfikować. **Cennik startuje od 20 USD miesięcznie (ok. 1,7 mld tokenów) i sięga 120 USD (ok. 9,8 mld), przy czym konteksty powyżej 512 tys. tokenów kosztują odpowiednio więcej.**
## W skrócie

- **MiniMax M3** – otwarty, multimodalny model z oknem miliona tokenów i architekturą rzadkiej uwagi (MSA).
- **Mocne wyniki** – (SWE-Bench Pro 59 proc., BrowseComp 83,5; PostTrainBench tuż za Opus 4.7 i GPT-5.5) plasują go blisko zamkniętej czołówki.
- **Testy 12- i 24-godzinne** – to najważniejszy sygnał, że rywalizacja modeli przenosi się na długą autonomię agentową.
