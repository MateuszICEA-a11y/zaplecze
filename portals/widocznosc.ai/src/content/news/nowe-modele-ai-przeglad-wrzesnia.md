---
title: 'Przegląd premier: Grok 4.7, głosowe Gemini 3.8, Qwen i MiMo w niecałe dwa tygodnie'
lead: Druga połowa września przyniosła największe od dawna nagromadzenie premier modeli AI. Obok modeli Claude Opus 5.5, GPT-6 Sol oraz GPT-6 Luna zadebiutowały Grok 4.7, trzy głosowe warianty Gemini 3.8, nowe modele Qwen i Xiaomi MiMo-V2.6, a firma Meta zapowiedziała podczas konferencji Connect awatary i tryb głosowy dla asystenta Muse. Zebraliśmy najważniejsze premiery z okresu 15–25 września.
date: '2026-09-25'
sourceName: xAI
sourceUrl: https://x.ai/news/grok-4-7
tags:
- modele językowe
- Grok
- Gemini
- Qwen
- sztuczna inteligencja
author: Redakcja widocznosc.ai
image: ../../assets/images/news-2026-09-25-nowe-modele-ai-przeglad-wrzesnia.webp
---
## Niecałe dwa tygodnie i kilkanaście premier

Między 15 a 25 września nowe modele udostępniły niemal wszystkie czołowe laboratoria AI. Najgłośniejsze były dwie premiery z 22 września, którym poświęciliśmy osobne artykuły:

- **Claude Opus 5.5** (Anthropic) – według producenta model dorównuje Fable 5.1 w większości zadań, przy cenie 4 i 20 dolarów odpowiednio za milion tokenów wejściowych i wyjściowych. Szczegóły w tekście [Claude Opus 5.5: poziom Fable 5.1 za 40 proc. mniej niż Opus 5](/news/claude-opus-5-5-poziom-fable-za-ulamek-ceny/).
- **GPT-6 Sol i GPT-6 Luna** (OpenAI) – tańsze modele z rodziny GPT-6, o połowę tańsze w dostępie przez API w porównaniu z poprzednikami z generacji 5.6. Szczegóły w tekście [GPT-6 Sol i Luna: OpenAI tnie ceny API o połowę](/news/gpt-6-sol-i-luna-dwa-modele-dwa-kompromisy/).

Poniżej zestawiamy pozostałe premiery z tego okresu, uporządkowane według producentów.

## xAI: Grok 4.7

Firma xAI, która na stronach produktowych występuje już jako SpaceXAI, udostępniła 21 września model Grok 4.7. Koszt dostępu przez API wynosi 2 dolary za milion tokenów wejściowych i 6 dolarów za milion tokenów wyjściowych (odczyt z pamięci podręcznej: 0,50 dolara). Gdy prompt przekracza 200 tys. tokenów, całe zapytanie jest rozliczane według podwójnych stawek (4, 12 i 1 dolar). Dokumentacja xAI podaje okno kontekstowe o wielkości 500 tys. tokenów. Wariant Fast, oferujący dwukrotnie szybsze generowanie tokenów za podwójną stawkę, jest dostępny tylko w Cursorze i Grok Build.

Firma xAI podkreśla przede wszystkim wyniki w benchmarkach specjalistycznych: 71,0 proc. w DeepSWE v1.1, 46,3 proc. w CursorBench 4.0, 56,7 proc. w HealthBench Professional oraz 19,6 proc. w prawniczym Harvey Legal Agent. Model od dnia premiery jest dostępny w Cursorze oraz w narzędziu Grok Build. Zgodnie z listą zmian (changelogiem) GitHuba tego samego dnia trafił również do GitHub Copilota w planach Pro, Pro+, Max, Business i Enterprise.

## Google: trzy premiery głosowe Gemini 3.8

Firma Google nie zaprezentowała w tym czasie nowego modelu tekstowego. Zamiast tego w ciągu dziesięciu dni udostępniła trzy modele głosowe:

- **Gemini 3.8 Live i 3.8 Live Extended Thinking (15 września)** – modele do konwersacji głosowych w czasie rzeczywistym. Wariant Extended Thinking analizuje problem (reasoning) w trakcie konwersacji i według Google zajmuje pierwsze miejsce w rankingu jakości modeli Speech-to-Speech serwisu Artificial Analysis (82,6 pkt). Obsługują 97 języków z automatycznym przełączaniem. Są dostępne m.in. w aplikacji Gemini.
- **Gemini 3.8 Flash TTS i Flash-Lite TTS (23 września)** – synteza mowy oferująca ponad 2 tys. gotowych głosów i tworzenie własnych głosów w ponad 100 językach i dialektach.
- **Gemini 3.8 Live z Live Avatar (24 września)** – konwersacja z generowanym w czasie rzeczywistym awatarem wideo, z pełną synchronizacją ruchu warg (lip-sync). Usługa dostępna w Gemini Enterprise, z serwerami zlokalizowanymi w USA i UE. Generowany dźwięk i obraz są oznaczane znakiem wodnym SynthID.

## Chiny: DeepSeek, Qwen i Xiaomi

Firma **DeepSeek** udostępniła 10 września model V4.1-Flash. Pierwotnie zapowiedziała, że od 14 września zapytania do endpointu `deepseek-v4-pro` obsłuży nowy Flash, ale wycofała się z tego planu – V4 Pro działa dalej w dotychczasowych cenach, a data premiery V4.1-Pro nie jest znana. V4.1-Flash to model oparty na architekturze Mixture-of-Experts (MoE) z 552 mld parametrów, z których 8 mld jest aktywnych podczas przetwarzania promptu (faza prefill), a 16 mld podczas generowania tokenów (dekodowanie).

Firma **Alibaba** wprowadziła kolejne modele z rodziny Qwen:

- **Qwen3.8-Omni-Flash (18 września)** – model multimodalny z oknem kontekstowym o wielkości 1 mln tokenów, rozumiejący dźwięk i wideo oraz korzystający z narzędzi. Dostępny wyłącznie przez API, bez otwartych wag.
- **Qwen3.8-LiveTranslate (19 września)** – tłumaczenie na żywo w 60 językach (z obsługą mowy w 29 z nich). Opóźnienie (latency) spadło z 2,8 do 2,3 s. Model dostępny wyłącznie przez API.
- **Qwen-Image-2.1 (20 września)** – 7-miliardowy model do generowania obrazów, z obsługą kanału alfa (natywna przezroczystość) i wsparciem dla maksymalnie 10 obrazów referencyjnych. Licencja Qwen Research zezwala wyłącznie na zastosowania niekomercyjne (badania i ewaluację).

Firma **Xiaomi** zaprezentowała 22 września rodzinę modeli MiMo-V2.6: warianty Pro, Flash oraz Pro Ultraspeed (według producenta do 20 razy szybszy). Oficjalny changelog nie podaje dokładnych parametrów. Według serwisu SiliconANGLE wersja Pro ma 1,02 bln parametrów (42 mld aktywnych), okno kontekstowe o wielkości 1 mln tokenów i otwartą licencję MIT, a koszt dostępu wynosi 0,435 i 0,87 dolara odpowiednio za milion tokenów wejściowych i wyjściowych.

> **Nasz komentarz:** Wrzesień dobrze pokazuje, jak rynek uległ wyraźnej segmentacji. Anthropic i OpenAI konkurują kosztami realizacji zadań przez agentów AI, Google przesuwa ciężar na interakcje głosowe i wideo w czasie rzeczywistym, a część chińskich laboratoriów (DeepSeek, Xiaomi) udostępnia modele o otwartych wagach (open weights), często wielokrotnie tańsze od zachodnich odpowiedników. Jednej „najlepszej” premiery tu nie ma – o wyborze decyduje konkretne zastosowanie (use case).

## Meta i Perplexity: agenci, głos i wyszukiwanie

Firma **Meta** podczas konferencji Connect (23–24 września) nie zaprezentowała nowego dużego modelu językowego. Zapowiedziała za to nowy model głosowy dla asystenta Muse (Muse Realtime Voice), model Muse Realtime Avatar, funkcję sterowania komputerem (computer use) na systemie macOS oraz integrację asystenta Muse z okularami AI. Żadna z tych zapowiedzi nie ma jeszcze daty premiery.

Firma **Perplexity** 24 września uruchomiła funkcję Fast Search w ramach Search API. Rozwiązanie opiera się na Photonie – nowym, autorskim silniku wyszukiwania i rankingu. Według Perplexity 95 proc. zapytań zwraca wyniki w czasie do 230 ms (mediana: 160 ms). Jednocześnie 27 września wygasa wsparcie dla Sonar API. Jego funkcje przejmuje Agent API, przy czym zmiana ta nie dotyczy Search API.

## Podsumowanie

- W dniach 15–25 września nowe modele udostępniły firmy: Anthropic (Opus 5.5), OpenAI (GPT-6 Sol i Luna), xAI (Grok 4.7), Google (trzy modele głosowe Gemini 3.8), Alibaba (Qwen) oraz Xiaomi (MiMo-V2.6).
- Model Grok 4.7 kosztuje 2 i 6 dolarów za milion tokenów (odpowiednio wejściowych i wyjściowych), ma okno kontekstowe o wielkości 500 tys. tokenów i od dnia premiery jest dostępny w Cursorze oraz w GitHub Copilocie.
- Firma Google w tym okresie postawiła na interakcje głosowe i wideo w czasie rzeczywistym, z kolei Perplexity – na własny silnik wyszukiwania Photon.
