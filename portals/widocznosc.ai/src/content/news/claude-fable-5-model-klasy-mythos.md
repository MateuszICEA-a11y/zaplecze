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

Jak Fable 5 – i bliźniaczy Mythos 5 – wypada na tle innych czołowych modeli, pokazują benchmarki Anthropic:

| Benchmark | Mythos 5 / Fable 5 | Mythos Preview | Opus 4.8 | GPT 5.5 | Gemini 3.1 Pro |
| --- | --- | --- | --- | --- | --- |
| Kodowanie agentowe – SWE-Bench Pro | **80,3%** | 77,8% | 69,2% | 58,6% | 54,2% |
| Kodowanie agentowe – FrontierCode (Diamond, xhigh) | **29,3%** | – | 13,4% | 5,7% | – |
| Praca analityczna – GDPval-AA | **1932** | – | 1890 | 1769 | 1314 |
| Praca analityczna, wizja – GDP.pdf (bez narzędzi) | **29,8%** | – | 22,5% | 24,9% | 16,7% |
| Rozumowanie przestrzenne – Blueprint-Bench 2 | **38,6%** | – | 14,5% | 36,2% | 26,5% |
| Użycie narzędzi – AutomationBench | **17,4%** | – | 15,5% | 12,9% | 9,6% |
| Obsługa komputera – OSWorld-Verified | 85,0% | **85,4%** | 83,4% | 78,7% | 76,2% |
| Prawo – Legal Agent Benchmark | **13,3%** | – | 10,4% | 2,1% | 0,0% |
| Rozumowanie interdyscyplinarne – Humanity's Last Exam (bez narzędzi) | **59,0%\*** | 56,8% | 49,8% | 41,4% | 44,4% |
| Humanity's Last Exam (z narzędziami) | 64,5%\* | **64,7%** | 57,9% | 52,2% | 51,4% |
| Biologia – BioMysteryBench (trudne) | **46,1%\*** | 29,6% | 40,0% | – | – |
| BioMysteryBench (rozwiązane przez człowieka) | **83,9%\*** | 82,6% | 80,4% | – | – |
| Kodowanie agentowe – Terminal-Bench 2.1 | **88,0%\*** | – | 82,7% | 83,4%¹ | 70,7%¹ |
| Cyberbezpieczeństwo – ExploitBench (Cap%) | **78,0%\*** | 69,0% | 40,0% | 34,0% | – |
| Zdrowie – HealthBench Professional | **66,0%\*** | 64,7% | 56,9% | 51,8% | – |

**Metodologia:** kolumna Mythos 5 / Fable 5 podaje wyższy z bardzo zbliżonych wyników obu modeli (różnica zwykle 1–3 pkt proc.). Gwiazdką (\*) oznaczono benchmarki, na których Fable 5 wypada bliżej Opusa 4.8 – to efekt blokujących zabezpieczeń dla pytań o cyberbezpieczeństwo i biologię, kierujących część zapytań do słabszego modelu. ¹ GPT 5.5 mierzony przez Codex CLI, Gemini 3.1 Pro przez Gemini CLI.

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
