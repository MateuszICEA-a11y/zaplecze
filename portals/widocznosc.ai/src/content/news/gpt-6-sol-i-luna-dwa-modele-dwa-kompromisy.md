---
title: 'GPT-6 Sol i Luna: OpenAI tnie ceny API o połowę'
lead: OpenAI dołożyło do rodziny GPT-6 dwa tańsze modele – Sol i Lunę. Zastępują one odpowiedniki z generacji 5.6 i kosztują w API o połowę mniej. OpenAI zapewnia, że to ceny stałe, a nie promocja na start. Na razie działają w API, Codexie i trybie Work, ale nie w głównym interfejsie ChatGPT.
date: '2026-09-23'
sourceName: OpenAI
sourceUrl: https://openai.com/index/introducing-gpt-6-sol-and-luna
tags:
- OpenAI
- GPT-6
- modele językowe
- sztuczna inteligencja
author: Redakcja widocznosc.ai
image: ../../assets/images/news-2026-09-23-gpt-6-sol-i-luna-dwa-modele-dwa-kompromisy.webp
---
## Tańsze modele oparte na fundamentach Astry

OpenAI zaprezentowało 22 września modele GPT-6 Sol i GPT-6 Luna. Rodzina GPT-6 obejmuje teraz trzy warianty: flagową Astrę (w API od 3 września), zbalansowanego Sola i najtańszą Lunę. Według OpenAI Sol i Luna powstały przy użyciu tych samych metod treningowych co Astra, ale działają szybciej i kosztują mniej – firma przypisuje to optymalizacji pamięci podręcznej (cache) i procesu wnioskowania (inferencji). Wariantu Terra, znanego z generacji 5.6, w GPT-6 nie ma.

Najbardziej widoczna zmiana to cennik. Sol zastępuje model GPT-5.6 Sol, a Luna – GPT-5.6 Lunę. W obu przypadkach mówimy o obniżce rzędu 50 proc. względem dotychczasowych stawek:

<div class="bench-table">

| Model (API) | Wejście | Wyjście | Odczyt z cache | Poprzednik (wejście / wyjście) |
| --- | --- | --- | --- | --- |
| GPT-6 Astra | 10,00 USD | 50,00 USD | 1,00 USD | – |
| GPT-6 Sol | 2,00 USD | 10,00 USD | 0,20 USD | GPT-5.6 Sol: 4,00 / 20,00 USD |
| GPT-6 Luna | 0,10 USD | 0,50 USD | 0,01 USD | GPT-5.6 Luna: 0,20 / 1,20 USD |

</div>

**Metodologia:** ceny za milion tokenów według cennika OpenAI dla programistów. Tryby Batch i Flex kosztują połowę tych stawek, tryb Fast – dwukrotność. Dla GPT-5.6 Sol podano cenę promocyjną obowiązującą co najmniej do 21 listopada 2026 r.

Rzecznik OpenAI zapewnił serwis VentureBeat, że nowe stawki są stałe, a nie promocyjne. Oba modele mają okno kontekstowe o wielkości 1,05 mln tokenów i generują do 128 tys. tokenów odpowiedzi. Data odcięcia wiedzy (knowledge cutoff) dla Sola to 20 kwietnia 2026 r., a dla Luny – 18 maja 2026 r. Intensywność rozumowania (reasoning effort) można ustawić na jednym z sześciu poziomów: od none, przez low, medium (domyślny), high i xhigh, aż po max. OpenAI zmieniło też mechanizm działania cache: odsetek trafień (cache hits) jest wyższy, a zmiana poziomu rozumowania lub zestawu narzędzi nie unieważnia już zapisanego kontekstu.

## Tańsze nie znaczy lepsze w każdym teście

W benchmarkach OpenAI nowe modele zwykle wyprzedzają poprzedników z generacji 5.6, choć nie wszędzie. W programowaniu i obsłudze komputera najlepszy wynik GPT-5.6 Sol bywa wyższy od wyniku nowego Sola:

<div class="bench-table">

| Benchmark (najlepszy wynik) | GPT-6 Sol | GPT-6 Luna | GPT-5.6 Sol | GPT-6 Astra |
| --- | --- | --- | --- | --- |
| Automatyzacja procesów – AutomationBench 1.0.6 | 33,2% | 20,7% | 28,8% | **41,4%** |
| Zadania agentowe – Agents' Last Exam V1 | 56,4% | 50,9% | 53,6% | **59,3%** |
| Programowanie agentowe – FrontierCode 1.1 | 49,3% | 42,4% | 47,5% | **53,3%** |
| Inżynieria oprogramowania – DeepSWE 1.1 | 68,8% | 66,6% | 72,7% | **74,1%** |
| Obsługa komputera – OSWorld 2.0 | 64,4% | 52,7% | 66,2% | **73,5%** |
| Odsetek błędów faktograficznych (mniej = lepiej) | 4,5% | 7,6% | 8,4% | **3,9%** |

</div>

**Metodologia:** najlepsze wyniki z wykresów OpenAI, przy różnych poziomach rozumowania (najczęściej max lub xhigh), w zestawieniu serwisu ComputingForGeeks.

Kluczowy jest jednak koszt jednego zadania. W AutomationBench Sol uzyskał 33,2 proc. przy koszcie ok. 0,27 dolara za zadanie, podczas gdy GPT-5.6 Sol osiągał 28,8 proc. za 0,67 dolara, a Astra – 41,4 proc. za 1,73 dolara. OpenAI twierdzi, że w tym teście Sol pokonuje model Claude Opus 5 za około 9 proc. jego kosztu. Porównanie szybko się jednak zestarzało: firma Anthropic wydała model Claude Opus 5.5 około półtorej godziny przed zapowiedzią OpenAI (według Anthropic typowe zadania kosztują na nim o 40 proc. mniej niż na Opusie 5, a jakością dorównuje on modelowi Fable 5.1).

Wyraźna jest też poprawa w testach bezpieczeństwa. Odsetek zwodniczych zachowań przy programowaniu spadł u Sola z 10,4 do 1,3 proc., a u Luny z 9,5 do 2,8 proc.

> **Nasz komentarz:** OpenAI nie ściga się tu na rekordy – od tego jest Astra. Sol i Luna to modele przeznaczone do zadań realizowanych na masową skalę, a cena Luny (0,50 dolara za milion tokenów wyjścia) czyni ją jedną z najtańszych opcji wśród modeli dużych laboratoriów. Premiera tego samego dnia co Opus 5.5 pokazuje, że rywalizacja przeniosła się z pytania, kto ma najlepszy model, na to, kto zaoferuje optymalny stosunek jakości do ceny za pojedyncze zadanie.

## Gdzie działają nowe modele

- **API** – od dnia premiery jako `gpt-6-sol` i `gpt-6-luna`, także przez OpenRouter po cenach katalogowych.
- **ChatGPT** – w trybie Work i w Codexie dla planów Plus, Pro, Business, Enterprise i Edu. Użytkownicy Free i Go dostają Lunę w aplikacji desktopowej.
- **Standardowy ChatGPT** – jeszcze nie. Codzienna rozmowa w głównym interfejsie ChatGPT dalej opiera się na modelach z generacji 5.6.
- **GitHub Copilot** – oba modele w planach Pro+, Max, Business i Enterprise.

## W skrócie

- OpenAI wprowadziło modele GPT-6 Sol (2/10 USD za milion tokenów) i GPT-6 Luna (0,10/0,50 USD) – to o połowę mniej niż za warianty 5.6, które zastępują. Według OpenAI ceny są stałe.
- Oba mają okno kontekstowe o wielkości 1,05 mln tokenów i sześć poziomów rozumowania. W testach zwykle wyprzedzają poprzedników, ale nie dorównują flagowej Astrze.
- Modele działają w API, Codexie i trybie Work w ChatGPT, na razie nie znajdziemy ich w standardowym czacie.
