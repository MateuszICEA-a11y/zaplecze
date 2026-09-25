---
title: 'Claude Opus 5.5: poziom Fable 5.1 za 40 proc. mniej niż Opus 5'
lead: Firma Anthropic udostępniła Claude'a Opusa 5.5 – pierwszy model z rodziny 5.5. Według producenta w większości zadań dorównuje on modelowi Fable 5.1, a typowe obciążenia kosztują o 40 proc. mniej niż w przypadku Opusa 5. Razem z modelem wprowadzono wyższe limity w planach Claude, tryb Fast i zmiany w API, a dzień później zadebiutował Claude Marketplace.
date: '2026-09-22'
sourceName: Anthropic
sourceUrl: https://www.anthropic.com/news/claude-opus-5-5
tags:
- Claude
- Anthropic
- modele językowe
- agenci AI
author: Redakcja widocznosc.ai
image: ../../assets/images/news-2026-09-22-claude-opus-5-5.webp
---
## Nowy Opus dogania Fable i tanieje

Firma Anthropic udostępniła 22 września model Claude Opus 5.5. To pierwszy przedstawiciel nowej rodziny 5.5 i – jak deklaruje producent – w większości zadań pracuje na poziomie Claude'a Fable 5.1, czyli modelu, który Anthropic przeznacza do najbardziej wymagających zadań. Różnica leży w kosztach: typowe obciążenia mają kosztować o 40 proc. mniej niż w przypadku poprzedniego Opusa 5, a tekst generowany jest ponad 30 proc. szybciej.

Cennik API spadł o jedną piątą: 4 dolary za milion tokenów wejściowych i 20 dolarów za milion tokenów wyjściowych (Opus 5 kosztował odpowiednio 5 i 25 dolarów). Jeszcze mocniej potaniał odczyt z pamięci podręcznej (cache) – z 0,50 do 0,20 dolara za milion tokenów, czyli o 60 proc. Dla porównania tokeny wejściowe i wyjściowe w modelu Fable 5.1 kosztują 10 i 50 dolarów.

Parametry techniczne według dokumentacji Anthropic:

- **Okno kontekstowe** – 1 mln tokenów domyślnie, do 128 tys. tokenów wyjściowych (w Batch API, w wersji beta, do 300 tys. tokenów).
- **Data odcięcia wiedzy** – czerwiec 2026 r. (tak jak w modelu Fable 5.1).
- **Myślenie adaptacyjne** – zawsze włączone. Głębokość rozumowania reguluje się parametrem *effort* (od *low* do *max*, domyślnie *medium*). Próba wyłączenia myślenia w API kończy się błędem 400. Anthropic wiąże zmiany w obsłudze myślenia m.in. z zabezpieczeniami przed destylacją, czyli trenowaniem konkurencyjnych modeli na podstawie toku rozumowania Claude'a. Warto pamiętać, że tokeny myślenia są rozliczane jako tokeny wyjściowe, co przy ustawieniu *max* może zauważalnie podnieść koszt zadania.
- **Dostępność** – Claude API, Claude Platform on AWS, Amazon Bedrock, Google Cloud Vertex AI i Microsoft Foundry, a także aplikacje Claude i Claude Code.

W materiałach premierowych najwięcej miejsca zajmuje praca agentowa, czyli długie, wieloetapowe zadania, które model wykonuje samodzielnie w terminalu lub repozytorium kodu. Jeden z testerów przeprowadził za pomocą Opusa 5.5 migrację 680 tys. linii kodu w niecały dzień. Gdy firma Anthropic poprosiła model o skrócenie czasu ładowania wszystkich podstron aplikacji webowej, Opus 5.5 zrobił to skutecznie w 39 na 40 prób, podczas gdy Opus 5 osiągał jedynie drobne poprawki.

Tak wygląda porównanie z benchmarków Anthropic:

<div class="bench-table">

| Benchmark | Opus 5.5 | Fable 5.1 | Opus 5 | GPT-6 Astra | GPT-5.6 Sol |
| --- | --- | --- | --- | --- | --- |
| Programowanie agentowe – Terminal-Bench 4.0 | **66,4%** | 55,8% | 52,3% | 57,9% | 37,3% |
| Programowanie agentowe – FrontierCode v1.1 | **54,4%** | 50,3% | 48,0% | 53,3% | 47,5% |
| Programowanie w IDE – CursorBench 4.0 | **57,8%** | 51,8% | 46,6% | – | 41,7% |
| Praca analityczna – GDPval-AA v2.1 (Elo) | **1846** | 1735 | 1708 | 1542 | 1588 |
| Automatyzacja procesów – AutomationBench | 40,0% | 31,4% | 26,9% | **41,4%** | 28,8% |
| Humanity's Last Exam (z użyciem narzędzi) | **67,7%** | 65,6% | 63,6% | 57,2% | – |
| Zadania naukowe w terminalu – Terminal-Bench-Science 0.1 | 58,7% | 52,6% | 29,0% | **64,6%** | 22,4% |
| Obsługa komputera – OSWorld 2.0 | **81,8%** | 80,7% | 74,0% | – | – |

</div>

**Metodologia:** wyniki według firmy Anthropic. Przy Terminal-Bench 4.0 firma podaje błąd standardowy ok. ±2,6 pkt proc. dla Opusa 5.5, a przy Terminal-Bench-Science od ±3,5 do ±5 pkt proc., więc części różnic nie należy odczytywać jako rozstrzygających.

Anthropic podkreśla też koszt pojedynczego zadania. Przy domyślnym poziomie *effort* (*medium*) Opus 5.5 ma wygrywać z modelem GPT-6 Astra w benchmarku FrontierCode za mniej więcej jedną piątą ceny. Klienci testujący model przed premierą raportują podobne wnioski: GitHub – więcej rozwiązanych zadań terminalowych niż w przypadku Opusa 5 (w VS Code) w mniej niż połowie kroków, Optiver – jakość Opusa 5 osiągniętą w o połowę mniejszej liczbie kroków konwersacyjnych i przy kosztach niższych o 40–50 proc., a Deloitte – wykrycie 72 proc. znanych błędów w przeglądach kodu (code review) wobec 56 proc. w przypadku Opusa 5 (przy wysokim poziomie *effort*).

> **Nasz komentarz:** W tej premierze ważniejsza od rekordów jest ekonomia. Opus 5.5 nie przebija modelu Fable 5.1 o klasę, tylko daje zbliżoną jakość za mniej niż połowę jego ceny i przy mniejszej liczbie kroków. W przypadku agentów AI, które pracują godzinami i zużywają miliony tokenów, właśnie to decyduje, czy wdrożenie ma uzasadnienie biznesowe.

## Co jeszcze zmieniło się przy okazji premiery

Opus 5.5 nie zadebiutował sam. W tym samym tygodniu firma Anthropic wprowadziła kilka zmian, które dotyczą zarówno użytkowników aplikacji Claude, jak i programistów:

- **Wyższe limity w subskrypcjach** – pięciogodzinne limity użycia wzrosły w planach Pro, Max, Team i Enterprise z licencjami na stanowisko. Subskrybenci dostali też jednorazowy reset limitu, który można zachować i wykorzystać w dowolnym momencie.
- **Tryb Fast** – w Claude Code i na Claude Platform Opus 5.5 może działać do 2,5 raza szybciej. W API to wersja podglądowa (research preview) w podwójnej cenie: 8 i 40 dolarów za milion tokenów.
- **Narzędzia dodawane w trakcie rozmowy** – w wersji beta API narzędzie można zdefiniować w wiadomości systemowej w środku konwersacji. Pozwala to dodać lub zmienić narzędzie bez unieważniania pamięci podręcznej promptu, co przy długich sesjach agentowych bezpośrednio przekłada się na niższe koszty.
- **Diagnostyka cache** – od 23 września wyszła z fazy beta i pokazuje, dlaczego zapytanie nie trafiło do pamięci podręcznej (tzw. cache miss).
- **Płatne odmowy** – od 24 września Anthropic nalicza opłaty także za odmowy zwrócone przed wygenerowaniem odpowiedzi w kategoriach biologii, tworzenia czołowych modeli językowych (frontier LLM) i ekstrakcji toku rozumowania.
- **Claude Marketplace** – od 23 września to jedno miejsce z ponad 2 tys. konektorów i wtyczek oraz agentami i usługami partnerów (m.in. Atlassian, Google, Microsoft, Notion, Salesforce, Cursor, Harvey, Lovable, Snowflake). Firmy mogą za nie płacić częścią zakontraktowanego budżetu w Anthropic.

W ślad za wyższymi możliwościami poszły zabezpieczenia. Większość zadań z zakresu cyberbezpieczeństwa Opus 5.5 przekazuje starszemu Opusowi 4.8 – to ten sam mechanizm, który Anthropic stosuje od premiery modeli z rodziny Fable. Dostęp do pełnych możliwości w biologii i cyberbezpieczeństwie wymaga zgłoszenia do odpowiednich programów weryfikacji (Life Sciences Verification Program oraz Cyber Verification Program).

Następne w kolejce są mniejsze modele. Anthropic zapowiada, że Claude Sonnet 5.5 i Claude Haiku 5.5 pojawią się „w najbliższych tygodniach” i przyniosą wiele z tych samych usprawnień.

## W skrócie

- Claude Opus 5.5 według firmy Anthropic w większości zadań pracuje na poziomie modelu Fable 5.1, kosztując 4/20 dolarów za milion tokenów wejściowych/wyjściowych, a odczyt z pamięci podręcznej potaniał o 60 proc.
- Model prowadzi w benchmarkach programowania agentowego (Terminal-Bench 4.0: 66,4 proc.), ma okno kontekstowe o wielkości 1 mln tokenów i zawsze włączone myślenie adaptacyjne.
- Premierze towarzyszą wyższe limity w planach Claude, tryb Fast, Claude Marketplace i zapowiedź modeli Sonnet 5.5 oraz Haiku 5.5.
