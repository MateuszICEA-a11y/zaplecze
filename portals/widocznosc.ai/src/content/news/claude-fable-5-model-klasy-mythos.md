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

Anthropic udostępnił Claude Fable 5. To pierwszy model nowej klasy Mythos, którą firma pozycjonuje o szczebel wyżej niż dotychczasową linię Opus. Według producenta Fable 5 osiąga najwyższe wyniki w niemal wszystkich testach możliwości AI: od inżynierii oprogramowania, przez analitykę i przetwarzanie obrazu, po badania naukowe. Reguła jest prosta. **Im dłuższe i bardziej złożone zadanie, tym wyraźniejsza przewaga modelu nad pozostałymi rozwiązaniami firmy.** Cena startuje od 10 dolarów za milion tokenów wejścia i 50 dolarów za milion wyjścia – to ponad dwukrotnie mniej niż stawka za wcześniejszy Mythos Preview.

Najciekawsza jest tu jednak nie sama wydajność, lecz sposób udostępnienia tak potężnego modelu. Zamiast odmawiać odpowiedzi, Fable 5 przekierowuje ruch. Nowy zestaw klasyfikatorów wyłapuje ryzykowne zapytania – z obszaru cyberbezpieczeństwa, biologii i chemii oraz tzw. dystylacji – i w takich przypadkach **odpowiedź generuje nie Fable, lecz słabszy Claude Opus 4.8**. Użytkownik otrzymuje stosowną informację. Filtry skonfigurowano ostrożnie, dlatego czasem reagują także na nieszkodliwe pytania. Mimo to, jak podaje Anthropic, uruchamiają się średnio w niespełna 5 proc. sesji. Pozostałe ponad 95 proc. zapytań obsługuje pełny Fable.

Tego samego dnia zadebiutował także Claude Mythos 5. Technologicznie to dokładnie ten sam model, tyle że ze zniesionymi zabezpieczeniami w wybranych obszarach. Dostęp do niego mają nieliczni: zespoły cyberobrony i dostawcy kluczowej infrastruktury, początkowo w ramach programu Project Glasswing prowadzonego we współpracy z rządem USA. Anthropic określa go mianem modelu o najsilniejszych zdolnościach z zakresu cyberbezpieczeństwa na świecie.

Jak Fable 5 – i bliźniaczy Mythos 5 – wypada na tle innych czołowych modeli, pokazują benchmarki Anthropic:

<div class="bench-table">

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

</div>

**Metodologia:** kolumna Mythos 5 / Fable 5 podaje wyższy z bardzo zbliżonych wyników obu modeli (różnica wynosi zwykle 1–3 pkt proc.). Gwiazdką (\*) oznaczono benchmarki, w których Fable 5 wypada bliżej Opusa 4.8 – to efekt zabezpieczeń blokujących pytania o cyberbezpieczeństwo i biologię, które przekierowują część zapytań do słabszego modelu. ¹ GPT 5.5 mierzony przez Codex CLI, Gemini 3.1 Pro przez Gemini CLI.

> **Nasz komentarz:** Najważniejsza nie jest tu sama liczba pobitych benchmarków, ale konstrukcja wdrożenia. Anthropic rozdziela „surowy” model od tego, co bezpiecznie podać publicznie, i zamiast twardej odmowy stosuje ciche przełączenie na słabszy Opus. To inny wzorzec bezpieczeństwa niż dotąd – kontrolą staje się architektura dostępu, a nie pojedyncza odpowiedź modelu.

## Zdolności rosną, więc rośnie też warstwa kontroli

Skok możliwości najlepiej widać na liczbach. Podczas wczesnych testów firma Stripe sprawdziła Fable 5 na własnym kodzie – model skrócił miesiące pracy inżynierskiej do kilku dni. Migrację bazy kodu w Ruby, liczącej 50 milionów linii, zrealizował w jeden dzień. Ręcznie zajęłaby ona zespołowi ponad dwa miesiące. W teście jakości kodu Cognition FrontierCode Fable uzyskał najwyższy wynik wśród czołowych modeli. Osobny rekord padł w zadaniach wizyjnych: model przeszedł grę *Pokémon FireRed* wyłącznie na podstawie zrzutów ekranu, bez żadnych dodatkowych narzędzi.

<figure class="yt-embed">
  <iframe src="https://www.youtube-nocookie.com/embed/Ty_50J84fMY" title="Claude Fable 5 przechodzi Pokémon FireRed wyłącznie na podstawie zrzutów ekranu" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
  <figcaption>Timelapse: Claude Fable 5 przechodzi <em>Pokémon FireRed</em> od początku do końca, korzystając wyłącznie ze zrzutów ekranu – bez map, podpowiedzi nawigacyjnych i dodatkowych danych o stanie gry.</figcaption>
</figure>

Pamięć również odegrała kluczową rolę. W zadaniach długoterminowych dostęp do trwałych notatek podniósł skuteczność Fable trzykrotnie mocniej niż w przypadku Opusa 4.8.

Mythos 5 jeszcze lepiej radzi sobie w badaniach naukowych. Model przyspieszył projektowanie leków mniej więcej dziesięciokrotnie. W ślepych testach naukowcy wybierali jego hipotezy z biologii molekularnej w około 80 proc. przypadków. Z kolei w dziedzinie genomiki przez ponad tydzień pracował niemal samodzielnie i wytrenował własny model uczenia maszynowego – sto razy mniejszy od rozwiązania opublikowanego niedawno w „Science”, a mimo to skuteczniejszy.

Im większe możliwości, tym bardziej rygorystyczna kontrola. Najbardziej zaawansowane funkcje – pełne cyberbezpieczeństwo i biologię – Anthropic ogranicza na razie dostępem warunkowym w Mythos 5. Publiczny Fable 5 to wariant z aktywnymi zabezpieczeniami. Dochodzi do tego nowa polityka danych: cały ruch na modelach klasy Mythos podlega 30-dniowej retencji, ale **nie trafia do trenowania kolejnych modeli** – ma służyć wyłącznie wyłapywaniu nadużyć i ograniczaniu fałszywych alarmów. Firma przyznaje, że filtry są dziś celowo zbyt czułe, i zapowiada ich precyzyjniejsze strojenie. To czytelny sygnał: na tym poziomie zdolności tempo udostępniania nowości świadomie ustępuje miejsca kontroli nad ryzykiem.

## W skrócie

- **Nowa klasa modeli** – Claude Fable 5 to pierwszy publicznie dostępny model klasy Mythos, którą Anthropic pozycjonuje ponad linią Opus. Osiąga najwyższe wyniki w niemal wszystkich testach możliwości AI.
- **Bezpiecznik zamiast odmowy** – przy ryzykownych zapytaniach (cyberbezpieczeństwo, biologia i chemia, dystylacja) generowanie odpowiedzi przejmuje Opus 4.8. Dotyczy to średnio mniej niż 5 proc. sesji.
- **Mythos 5 z ograniczonym dostępem** – ten sam model ze zniesionymi zabezpieczeniami trafia na razie wyłącznie do zespołów cyberobrony w ramach Project Glasswing. Cena obu modeli wynosi 10 i 50 dolarów za milion tokenów wejścia i wyjścia.
