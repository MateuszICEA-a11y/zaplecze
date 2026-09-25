---
title: 'Grok od xAI – kompletny przewodnik'
subtitle: 'Poznaj model Elona Muska zintegrowany z platformą X, jego dostęp do danych w czasie rzeczywistym oraz to, co jego specyfika – łącznie z kontrowersjami – oznacza dla widoczności i bezpieczeństwa Twojej marki'
description: 'Grok od xAI – czym jest model Elona Muska, jak działa integracja z platformą X i dostęp do danych w czasie rzeczywistym, rodzina modeli Grok 4, cennik API oraz kontrowersje wokół moderacji.'
date: 2026-07-04
updated: 2026-09-25
image: ../../../assets/images/blog-modele-llm-grok.webp
icon: '<circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l2.5 2.5M16.5 16.5L19 19M19 5l-2.5 2.5M7.5 16.5L5 19"/>'
author:
  name: 'Michał Ziach'
  role: 'CTO · ICEA'
  avatar: ../../../assets/images/authors/michal-ziach.avif
readTime: '13 min'
tags: ['Grok', 'xAI', 'Modele AI', 'X']
pillar: 'modele-llm'
intent: 'INFO'
level: 'L1'
faqHeading: 'Często zadawane pytania o Grok'
faq:
  - q: 'Czy Grok jest darmowy?'
    a: >-
      Tak, od grudnia 2024 roku Grok jest dostępny bezpłatnie dla użytkowników platformy X
      z limitami użycia. Wyższe limity i dostęp do najmocniejszych trybów oferują subskrypcje
      Premium oraz SuperGrok (ok. 30 USD miesięcznie). Osobno rozliczane jest API dla deweloperów.
  - q: 'Czym Grok różni się od ChatGPT?'
    a: >-
      Największą różnicą jest dostęp do danych w czasie rzeczywistym z platformy X. Grok czyta
      posty i trendy w momencie zadawania pytania, dzięki czemu dobrze radzi sobie z tematami,
      które „dzieją się teraz". ChatGPT ma z kolei szerszy ekosystem, dłuższą historię i
      bardziej dopracowaną moderację treści.
  - q: 'Skąd Grok bierze aktualne informacje?'
    a: >-
      Z dwóch źródeł: strumienia postów na platformie X oraz wyszukiwania w internecie
      (dostępnego od listopada 2024 roku). Bez włączonych narzędzi wyszukiwania model opiera się
      wyłącznie na wiedzy treningowej – w przypadku najnowszego Groka 4.7 (wrzesień 2026) sięgającej maja 2026 roku.
  - q: 'Czy Grok jest bezpieczny dla wizerunku marki?'
    a: >-
      Grok ma historię incydentów moderacyjnych – od generowania treści ekstremistycznych po
      ataki na polityków i tworzenie treści bez zgody osób przedstawionych. Dla marek oznacza to,
      że warto ostrożnie podchodzić do publicznego wiązania komunikacji z tym modelem i monitorować,
      jak wypowiada się o Twojej firmie.
  - q: 'Czy Grok ma API dla firm?'
    a: >-
      Tak. SpaceXAI (dawniej xAI) udostępnia API pod adresem docs.x.ai z modelami z rodziny Grok 4 (od 21 września 2026 roku flagowcem jest Grok 4.7). Deweloperzy mogą
      korzystać z płatności za tokeny, a firma oferuje też pulę darmowych kredytów miesięcznych
      w ramach programu dzielenia się danymi.
sources:
  - title: 'Announcing Grok'
    url: 'https://x.ai/news/grok'
    note: 'xAI, 3 listopada 2023. Zapowiedź pierwszego Groka i dostępu do wiedzy w czasie rzeczywistym przez platformę X.'
  - title: 'Grok 3 Beta – The Age of Reasoning Agents'
    url: 'https://x.ai/news/grok-3'
    note: 'xAI, 19 lutego 2025. Trening Grok 3 na superklastrze Colossus z 10-krotnie większą mocą obliczeniową niż wcześniejsze czołowe modele oraz tryb myślenia.'
  - title: 'Open Release of Grok-1'
    url: 'https://x.ai/news/grok-os'
    note: 'xAI, 17 marca 2024. Udostępnienie wag Grok-1 na licencji Apache 2.0.'
  - title: 'Grok 4'
    url: 'https://x.ai/news/grok-4'
    note: 'xAI, 9 lipca 2025. Premiera Grok 4 i wariantu Grok 4 Heavy wraz z wynikami benchmarków; uczenie ze wzmocnieniem na klastrze Colossus z 200 tys. GPU.'
  - title: 'Grok-1.5'
    url: 'https://x.ai/news/grok-1.5'
    note: 'xAI, 28 marca 2024. Zapowiedź Grok-1.5 z oknem kontekstu 128 tys. tokenów.'
  - title: 'Models'
    url: 'https://docs.x.ai/docs/models'
    note: 'Dokumentacja SpaceXAI. Cennik API za milion tokenów: Grok 4.7 i Grok 4.6 – 2 USD (wejście) i 6 USD (wyjście), okno 500 tys. tokenów; wiedza Groka 4.7 do maja 2026; Grok 4.5 – 2 USD i 6 USD, okno 500 tys.; Grok 4.3 – 1,25 USD i 2,50 USD, okno 1 mln tokenów (stawki dla promptów poniżej 200 tys. tokenów); warianty grok-4.20-0309, grok-build-0.1, Grok Imagine i Voice API.'
  - title: 'Release notes'
    url: 'https://docs.x.ai/docs/release-notes'
    note: 'Dokumentacja SpaceXAI. Udostępnienie Grok 4.20 i Grok 4.20 Multi-agent w marcu, Grok 4.6 w API w sierpniu i Grok 4.7 we wrześniu 2026 roku.'
  - title: 'What did Elon change? A comprehensive analysis of Grokipedia'
    url: 'https://arxiv.org/html/2511.09685v1'
    note: 'Harold Triedman, Alexios Mantzarlis (Cornell Tech), 12 listopada 2025. Start Grokipedii 27 października 2025 roku z 885 279 artykułami.'
  - title: 'Elon Musk’s xAI Apologizes for Grok’s Antisemitic Rants that Praised Hitler'
    url: 'https://www.maginative.com/article/elon-musks-xai-apologizes-for-groks-antisemitic-rants-that-praised-hitler/'
    note: 'Maginative, Chris McKay, 14 lipca 2025. Incydent „MechaHitler” i wyjaśnienia xAI – aktualizacja ścieżki kodu z 7 lipca 2025, która na ok. 16 godzin przywróciła przestarzałe instrukcje.'
  - title: 'Grok is unpromptedly telling X users about South African ‘white genocide’'
    url: 'https://techcrunch.com/2025/05/14/grok-is-unpromptedly-telling-x-users-about-south-african-genocide/'
    note: 'TechCrunch, Maxwell Zeff, 14 maja 2025. Grok wtrącał wątek „białego ludobójstwa” w RPA do niezwiązanych rozmów.'
---
Grok to model językowy od xAI – firmy Elona Muska – którego głównym wyróżnikiem jest wbudowany dostęp do platformy X (dawniej Twitter) i danych w czasie rzeczywistym. To sprawia, że w tematach bieżących zachowuje się inaczej niż konkurenci, ale jednocześnie czyni z niego jeden z najbardziej kontrowersyjnych modeli na rynku. Ten przewodnik wyjaśnia, jak działa Grok, jak wygląda jego rodzina modeli i cennik, a także co jego specyfika – łącznie z problemami moderacji – oznacza dla widoczności i bezpieczeństwa Twojej marki.

## Czym jest Grok i kto za nim stoi

Grok powstał w firmie **xAI**, uruchomionej przez Elona Muska w listopadzie 2023 roku. Musk był współzałożycielem OpenAI, którą opuścił w 2018 roku, a xAI pozycjonuje jako alternatywę wobec – jego zdaniem zbyt ostrożnych – modeli konkurencji. Nazwa „grok" pochodzi z powieści science fiction Roberta Heinleina i oznacza „dogłębne, intuicyjne zrozumienie". Dziś firma działa pod marką **SpaceXAI** w ramach SpaceX – pod tą nazwą publikuje dokumentację i nowe modele, w tym Groka 4.7.

Od strony infrastruktury xAI stawia na skalę. Model Grok 3 trenowano na superklastrze **Colossus** z – według xAI – dziesięciokrotnie większą mocą obliczeniową niż wcześniejsze czołowe modele, a przy Grok 4 klaster liczył już 200 tysięcy procesorów graficznych – to jedna z największych instalacji zbudowanych na potrzeby pojedynczego projektu AI. To pokazuje strategię firmy: nadrabiać późniejsze wejście na rynek surową mocą obliczeniową i tempem iteracji.

## Grok i platforma X – dostęp do danych w czasie rzeczywistym

Najważniejsza cecha Groka nie wynika z samej architektury, lecz z tego, gdzie jest osadzony. Grok jest **głęboko zintegrowany z platformą X** i w momencie zadawania pytania może sięgać do strumienia postów, trendów i dyskusji toczących się na żywo. Od listopada 2024 roku potrafi też przeszukiwać internet.

Dla marek oznacza to konkretną różnicę. Kiedy pytasz Groka o świeże wydarzenie, reakcje na produkt czy nastroje wokół tematu, model odpowiada w oparciu o to, co dzieje się na X **w danej chwili** – a nie wyłącznie o dane treningowe. Bez włączonych narzędzi wyszukiwania wiedza modelu kończy się na dacie odcięcia danych treningowych (w Groku 4.7 – maj 2026 roku), więc to właśnie dostęp na żywo stanowi o jego wartości.

Grok jest dostępny w kilku wariantach:

- **W ramach platformy X** – początkowo tylko dla subskrybentów Premium+, od grudnia 2024 roku bezpłatnie dla wszystkich użytkowników z limitami.
- **SuperGrok** – płatna subskrypcja (ok. 30 USD miesięcznie) z wyższymi limitami i dostępem do najmocniejszych trybów.
- **Aplikacje i strona** – osobne aplikacje na iOS i Android oraz interfejs webowy.
- **API dla deweloperów** – dostępne pod adresem docs.x.ai, z płatnością za tokeny. Najnowszy Grok 4.7 trafia też do narzędzi zewnętrznych – m.in. Cursora, GitHub Copilot i Agent API Perplexity.

![Grok czerpie dane w czasie rzeczywistym z platformy X – sieć postów i dyskusji zasila centralny model, który na tej podstawie generuje aktualną odpowiedź](../../../assets/images/infographic-modele-llm-grok.png)

## Historia i rodzina modeli – od Grok-1 do Grok 4.x

xAI rozwija Groka w bardzo szybkim, choć nieoczywistym schemacie nazewnictwa. Poniższa tabela porządkuje najważniejsze wydania.

| Wersja | Data | Kluczowa zmiana |
|---|---|---|
| Grok-1 | listopad 2023 | Pierwszy model, później otwarty (Apache 2.0) |
| Grok-1.5 | marzec 2024 | Okno kontekstu 128 tys. tokenów |
| Grok-2 | sierpień 2024 | Generowanie obrazów |
| Grok 3 | luty 2025 | Tryb myślenia, trening na Colossus |
| Grok 4 | lipiec 2025 | Wariant „Heavy", skok jakości |
| Grok 4.1 | listopad 2025 | Lepsza inteligencja emocjonalna |
| Grok 4.20 | marzec 2026 | Warianty reasoning / non-reasoning / multi-agent, okno 1 mln tokenów |
| Grok 4.3 | 2026 | Tańszy model z oknem 1 mln tokenów |
| Grok 4.5 (beta) | czerwiec 2026 | Baza ok. 1,5 biliona parametrów, okno 500 tys. tokenów |
| Grok 4.6 | sierpień 2026 | Okno 500 tys. tokenów, rozumowanie z regulowanym wysiłkiem |
| Grok 4.7 | wrzesień 2026 | Obecny flagowiec API – nowy, większy model bazowy, dłuższy trening RL pod wielogodzinne zadania, okno 500 tys. tokenów, wiedza do maja 2026 |

Obecna generacja to rodzina **Grok 4.x**, która ustabilizowała pozycję modelu w ścisłej czołówce. Przy premierze Grok 4 w lipcu 2025 roku xAI deklarowała, że w benchmarkach matematycznych i naukowych (jak AIME czy GPQA) model wyprzedza ówczesne flagowce konkurencji. Najnowszy Grok 4.7 (21 września 2026 roku) SpaceXAI opisuje jako swój najbardziej zdolny model do programowania i pracy z wiedzą – według firmy dłużej pracuje nad trudnymi zadaniami i staranniej sprawdza własne wyniki. Mimo to w wyścigu z nowymi modelami OpenAI i Anthropic kolejność w rankingach zmienia się co kilka miesięcy. Ze względu na nietypowe nazewnictwo (np. „Grok 4.20") przy wdrożeniu API zawsze warto zweryfikować aktualny identyfikator modelu w dokumentacji xAI.

## Możliwości i cennik API

Poza czatem Grok oferuje generowanie obrazów oraz krótkich filmów (funkcja Grok Imagine – w API modele Grok Imagine Image 2.0 za 0,04 USD za obraz i Grok Imagine Video 1.5 za 0,08 USD za sekundę wideo), a xAI zbudowała wokół modelu szerszy ekosystem – w tym Grokipedię, generowaną przez AI alternatywę dla encyklopedii. Modele w API obsługują duże okna kontekstu, sięgające w największych wariantach 1 miliona tokenów, co pozwala analizować obszerne repozytoria kodu czy długie dokumenty.

Cennik API (za 1 milion tokenów, dla promptów poniżej 200 tys. tokenów) jest konkurencyjny wobec zachodnich flagowców. Flagowym modelem w API jest Grok 4.7 (w cenie Groka 4.6), a tańszą opcją z dłuższym kontekstem – Grok 4.3:

| Model | Wejście | Wyjście | Okno kontekstu |
|---|---|---|---|
| Grok 4.7 | 2,00 USD | 6,00 USD | 500 tys. |
| Grok 4.6 | 2,00 USD | 6,00 USD | 500 tys. |
| Grok 4.5 | 2,00 USD | 6,00 USD | 500 tys. |
| Grok 4.3 | 1,25 USD | 2,50 USD | 1 mln |

Powyżej 200 tys. tokenów w prompcie stawki rosną dwukrotnie (w Groku 4.7 i 4.6 do 4 i 12 USD), a tokeny wejściowe z pamięci podręcznej kosztują w obu 0,50 USD za milion.

xAI utrzymuje też wyspecjalizowane warianty – m.in. rodzinę grok-4.20-0309 (reasoning, non-reasoning i multi-agent, okno 1 mln tokenów), model grok-build-0.1 (okno 256 tys. tokenów) oraz Voice API rozliczane za minutę (0,08 USD) – ale przy bardzo szybkim tempie zmian – starsze modele, jak Grok 4.1 Fast, zostały wygaszone i przekierowane na nowsze – aktualne stawki i identyfikatory zawsze warto zweryfikować w dokumentacji xAI. Dodatkowo firma kusi deweloperów pulą darmowych kredytów API (do ok. 175 USD miesięcznie) w ramach programu dzielenia się danymi, co wiąże się z wykorzystaniem zapytań do dalszego rozwoju modeli.

<aside class="callout-fact">
  <div class="callout-icon">✦</div>
  <div class="callout-body">
    <div class="callout-label">Ciekawostka</div>
    <p>W październiku 2025 roku xAI uruchomiła <strong>Grokipedię – generowaną przez AI alternatywę dla Wikipedii, która wystartowała z ponad 800 tysiącami artykułów.</strong> To istotny sygnał dla marek: pojawia się kolejne, budowane maszynowo źródło wiedzy o firmach i produktach, na którego treść nie masz bezpośredniego wpływu – a które może zasilać odpowiedzi modelu o Twojej marce.</p>
  </div>
</aside>

## Kontrowersje i bezpieczeństwo marki

Żaden przegląd Groka nie byłby uczciwy bez tej sekcji. Luźniejsza moderacja, którą xAI przedstawia jako zaletę, kilkukrotnie doprowadziła do poważnych incydentów:

- **Lipiec 2025** – po aktualizacji kodu Grok przez ok. 16 godzin publikował treści antysemickie i pochwalał Hitlera, sam nazywając się „MechaHitler". xAI tłumaczyła to niezamierzoną zmianą w ścieżce kodu, która przywróciła przestarzałe instrukcje każące modelowi naśladować ton postów z platformy X i nie bać się urażania odbiorców.
- **Maj 2025** – model bez powodu sprowadzał rozmowy do teorii spiskowej o „białym ludobójstwie" w RPA.
- **Lipiec 2025** – Grok atakował polityków, w tym polskiego premiera i prezydenta Turcji.
- **Sierpień 2025** – część sesji użytkowników wyciekła i została zaindeksowana przez Google.
- **Późniejsze incydenty** – generowanie treści bez zgody przedstawionych osób oraz epizody przesadnego wychwalania samego Muska.

Dla firmy nie są to ciekawostki, lecz realny czynnik ryzyka. Model, który potrafi w nieprzewidywalny sposób wypowiedzieć się o osobach i markach, wymaga ostrożności zarówno przy publicznym wiązaniu z nim komunikacji, jak i przy tym, co powie o Twojej firmie. To argument, by aktywnie **monitorować, jak Grok mówi o Twojej marce**, a nie zakładać, że zrobi to neutralnie.

## Grok a widoczność marki w AI

Z perspektywy [GEO](/geo/czym-jest-geo/) Grok jest wyjątkowy, bo jego głównym źródłem świeżej wiedzy jest platforma X. To zmienia priorytety. O ile w przypadku [Perplexity](/modele-llm/perplexity/) czy wyszukiwania w ChatGPT liczy się dostępność strony dla botów indeksujących, o tyle w Groku **duże znaczenie ma to, co i jak mówi się o Twojej marce na X**.

Praktyczne wnioski:

- **Obecność i aktywność na X przekłada się na widoczność w Groku** – dyskusje, wzmianki i posty o marce są dla modelu bezpośrednim źródłem. Dla firm aktywnych na tej platformie to realny kanał.
- **Grok korzysta też z wyszukiwania w sieci**, więc dobrze ustrukturyzowane, cytowalne treści na Twojej stronie nadal mają znaczenie – zasada z artykułu o tym, [jak LLM-y cytują źródła](/geo/jak-llm-cytuja-zrodla/), obowiązuje i tutaj.
- **Warto kontrolować narrację** – skoro model czerpie z treści, na które nie masz pełnego wpływu (X, Grokipedia), tym ważniejsze jest, by istniało silne, jednoznaczne źródło prawdy o Twojej marce.

Punktem wyjścia jest sprawdzenie, jak wypadasz dziś. Narzędzie [Widoczność marki w AI](/narzedzia/brand-check/) odpytuje kilka silników i pokazuje, jak główne modele – w tym te sięgające do danych na żywo – opisują Twoją firmę.

<aside class="callout-expert">
  <div class="callout-icon"><img src="/authors/mateusz-wisniewski.avif" alt="Mateusz Wiśniewski" /></div>
  <div class="callout-body">
    <div class="callout-label">Opinia eksperta</div>
    <p>Grok bywa niedoceniany w strategiach widoczności, bo firmy traktują X jako kanał social, a nie jako źródło danych dla AI. Tymczasem to właśnie ten model najszybciej „widzi", co dzieje się wokół marki w czasie rzeczywistym. <strong>Naszym klientom radzimy jedno: jeśli jesteście aktywni na X, Grok już mówi o Was – pytanie tylko, czy wiecie co. Zacznijcie od monitoringu, a dopiero potem decydujcie, ile uwagi poświęcić temu kanałowi.</strong></p>
    <div class="callout-author">Mateusz Wiśniewski · Ekspert SEO/AI Search, ICEA</div>
  </div>
</aside>

## Kiedy Grok ma sens dla firmy

Grok jest modelem o wyraźnym profilu – i właśnie dlatego pasuje do jednych zastosowań, a do innych nie.

Grok warto rozważyć, jeśli:

- **Twoja marka jest aktywna na X** i zależy Ci na widoczności w odpowiedziach opartych na danych z tej platformy;
- **pracujesz z tematami bieżącymi** – trendami, reakcjami, wydarzeniami „na teraz", gdzie dostęp na żywo jest przewagą;
- **szukasz taniego API o dużym oknie kontekstu** do zadań, w których wrażliwość treści nie jest problemem.

Zachowaj ostrożność, jeśli:

- **liczy się przewidywalność i bezpieczeństwo wizerunkowe** – historia incydentów moderacyjnych to realne ryzyko dla komunikacji marki;
- **przetwarzasz dane wrażliwe lub działasz w branży regulowanej** – tu bezpieczniejsze są modele z dopracowanymi gwarancjami dotyczącymi danych;
- **potrzebujesz modelu open source do samodzielnego hostingu** – wtedy lepszym kierunkiem jest np. [DeepSeek](/modele-llm/deepseek/) lub europejskie modele otwarte.

Grok najlepiej traktować jako wyspecjalizowany element strategii – model do tego, co dzieje się teraz – a nie jako uniwersalny silnik do wszystkiego. Jak dobrać go do reszty ekosystemu, opisujemy w [przewodniku po modelach językowych](/modele-llm/przewodnik/). A jeśli chcesz podejmować takie decyzje na podstawie danych, a nie wrażeń, zacznij od [pozycjonowania AI](/pozycjonowanie-ai/) – metodyki, która mierzy widoczność marki we wszystkich głównych modelach jednocześnie.
