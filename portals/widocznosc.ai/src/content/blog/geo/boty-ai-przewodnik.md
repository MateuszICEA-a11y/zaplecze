---
title: 'GPTBot, ClaudeBot, PerplexityBot – co naprawdę widzą boty AI i jak im pomóc'
subtitle: 'Techniczny przewodnik po botach indeksujących AI, robots.txt, llms.txt i schema.org dla wyszukiwarek generatywnych'
description: 'Lista 13 botów i tokenów AI, które decydują o dostępie do Twoich treści. Co każdy z nich robi, jak skonfigurować robots.txt, czy llms.txt ma sens, dlaczego treści renderowane przez JavaScript są problemem dla LLM. Przewodnik dla deweloperów i SEO.'
date: 2026-05-12
updated: 2026-09-25
image: ../../../assets/images/blog-geo-boty-ai-przewodnik.webp
icon: '<rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18"/><circle cx="7" cy="14" r="1"/><circle cx="12" cy="14" r="1"/><circle cx="17" cy="14" r="1"/><path d="M9 4l3-2 3 2"/>'
author:
  name: 'Mateusz Wiśniewski'
  role: 'Ekspert SEO/AI Search · ICEA'
  avatar: ../../../assets/images/authors/mateusz-wisniewski.avif
readTime: '13 min'
tags: ['GPTBot', 'ClaudeBot', 'robots.txt', 'llms.txt', 'Technical SEO']
pillar: 'geo'
intent: 'HOWTO'
level: 'L3'
sources:
  - title: 'Overview of OpenAI Crawlers'
    url: 'https://developers.openai.com/api/docs/bots'
    note: 'OpenAI, dokumentacja. Funkcje GPTBot (trening), OAI-SearchBot (wyniki wyszukiwania w ChatGPT), ChatGPT-User (działania na żądanie użytkownika, do których reguły robots.txt mogą nie mieć zastosowania) i OAI-AdsBot (weryfikacja stron docelowych reklam).'
  - title: 'Does Anthropic crawl data from the web, and how can site owners block the crawler?'
    url: 'https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler'
    note: 'Anthropic, centrum pomocy. Opis botów ClaudeBot, Claude-User i Claude-SearchBot oraz respektowania robots.txt.'
  - title: 'List of Google’s common crawlers'
    url: 'https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers'
    note: 'Google, dokumentacja. Opis GoogleOther oraz tokenu Google-Extended, który steruje wykorzystaniem treści do trenowania i ugruntowania modeli Gemini.'
  - title: 'Google’s user-triggered fetchers'
    url: 'https://developers.google.com/crawling/docs/crawlers-fetchers/google-user-triggered-fetchers'
    note: 'Google, dokumentacja. Fetcher Google-GeminiNotebook (dawny token Google-NotebookLM), fetcher Google-Agent i zastrzeżenie, że fetchery uruchamiane przez użytkownika zwykle ignorują robots.txt.'
  - title: 'Search generative AI control'
    url: 'https://support.google.com/webmasters/answer/16908024'
    note: 'Pomoc Google Search Console. Przełącznik wyłączający witrynę z AI Overviews, AI Mode i funkcji AI w Discover; globalnie od 31 sierpnia 2026 roku, bez wpływu na ranking w pozostałej części wyszukiwarki.'
  - title: 'Optymalizacja witryny pod kątem funkcji opartych na generatywnej AI w wyszukiwarce Google'
    url: 'https://developers.google.com/search/docs/fundamentals/ai-optimization-guide?hl=pl'
    note: 'Google Search Central. Przewodnik, w którym Google uznaje pliki llms.txt za niepotrzebne do widoczności w funkcjach AI wyszukiwarki.'
  - title: 'Perplexity Crawlers'
    url: 'https://docs.perplexity.ai/guides/bots'
    note: 'Perplexity, dokumentacja. Różnica między PerplexityBot (indeksowanie do wyników) a Perplexity-User (pobieranie na żądanie użytkownika, które zwykle ignoruje robots.txt).'
  - title: 'CCBot'
    url: 'https://commoncrawl.org/ccbot'
    note: 'Common Crawl. Opis crawlera CCBot, jego user-agenta i sposobu blokowania w robots.txt.'
  - title: 'About Applebot'
    url: 'https://support.apple.com/en-us/119829'
    note: 'Apple, wsparcie. Applebot-Extended nie crawluje stron – decyduje, czy treści zebrane przez Applebota mogą trenować modele Apple Intelligence.'
  - title: 'Major media organizations are putting up ‘do not enter’ signs for ChatGPT'
    url: 'https://fortune.com/2023/08/25/major-media-organizations-are-blocking-openai-bot-from-scraping-content'
    note: 'Fortune, 25 sierpnia 2023. Start GPTBota na początku sierpnia 2023 i blokady wprowadzone m.in. przez NYT, CNN i Reuters.'
  - title: 'robots.txt – The New York Times'
    url: 'https://www.nytimes.com/robots.txt'
    note: 'The New York Times, plik robots.txt (stan z 17 września 2026). Blokady m.in. dla GPTBot, OAI-SearchBot i CCBot.'
  - title: 'The /llms.txt file, v2'
    url: 'https://llmstxt.org/'
    note: 'Jeremy Howard, propozycja z 3 września 2024. Specyfikacja pliku llms.txt w formacie Markdown.'
  - title: 'The rise of the AI crawler'
    url: 'https://vercel.com/blog/the-rise-of-the-ai-crawler'
    note: 'Vercel, 17 grudnia 2024. Analiza pokazująca, że główne crawlery AI (OpenAI, Anthropic, Perplexity) nie renderują JavaScriptu.'
---

W 2026 roku internet jest indeksowany przez kilkanaście różnych botów AI, z których każdy ma własne zasady, własnego user-agenta i własne implikacje dla widoczności Twojej strony. **Decyzja, którego bota dopuszczać, którego blokować, a którego po prostu ignorować, ma bezpośrednie konsekwencje dla tego, czy Twoja firma pojawi się w odpowiedziach ChatGPT, Claude czy Perplexity.** Większość zespołów technicznych w ogóle nie wie, ile botów AI ma na swojej stronie – i to jest dziś krytyczna luka informacyjna.

## Trzynaście botów AI, które warto znać

Na rynku jest ponad 30 botów oznaczonych jako *„AI crawlers"*, ale 13 z nich realnie wpływa na widoczność marki w najpopularniejszych modelach LLM. Reszta to specjalistyczne narzędzia, agregatory danych albo projekty open-source.


| User-agent | Właściciel | Funkcja | Wpływ na widoczność |
|---|---|---|---|
| `GPTBot` | OpenAI | trening modeli (GPT-5+) | długoterminowy – nowe wersje GPT |
| `OAI-SearchBot` | OpenAI | crawling dla wyszukiwania w ChatGPT | bieżący – cytowania w odpowiedziach |
| `ChatGPT-User` | OpenAI | pobieranie na żądanie (browse with web) | bieżący – per zapytanie użytkownika |
| `ClaudeBot` | Anthropic | trening Claude | długoterminowy |
| `Claude-User` | Anthropic | pobieranie na żądanie | bieżący |
| `Claude-SearchBot` | Anthropic | wyszukiwanie w czasie rzeczywistym w Claude | bieżący |
| `Google-Extended` | Google | token kontrolny, nie osobny crawler – zgoda na trening i ugruntowanie (grounding) modeli Gemini | długoterminowy + bieżący |
| `Google-GeminiNotebook` | Google | pobieranie źródeł wskazanych przez użytkownika w Gemini Notebook (dawniej `Google-NotebookLM`) | niszowy |
| `GoogleOther` | Google | sub-team labs, eksperymenty AI | różny |
| `PerplexityBot` | Perplexity | indeksowanie ogólne | bieżący + długoterminowy |
| `Perplexity-User` | Perplexity | pobieranie na żądanie (deep research) | bieżący |
| `CCBot` | Common Crawl | dataset dla wszystkich LLM | krytyczny – większość modeli używa CC |
| `Applebot-Extended` | Apple | token kontrolny, nie crawluje – zgoda na trening modeli Apple Intelligence | rosnący |

Poza tą listą zostawiamy boty, które nie decydują o widoczności w odpowiedziach AI. OpenAI ma nowego `OAI-AdsBot`, który sprawdza bezpieczeństwo stron docelowych reklam w ChatGPT (zebrane dane nie trafiają do treningu), a Google opisuje fetcher `Google-Agent`, używany przez agentów działających na infrastrukturze Google. Aktualne wersje user-agentów OpenAI to `GPTBot/1.4`, `OAI-SearchBot/1.4` i `ChatGPT-User/1.0`.

![13 botów AI w 4 kategoriach – TRENING (GPTBot, ClaudeBot, Google-Extended), WYSZUKIWANIE (OAI-SearchBot, PerplexityBot, Claude-SearchBot), NA ŻĄDANIE (ChatGPT-User, Claude-User, Perplexity-User, Google-GeminiNotebook), POZOSTAŁE (CCBot, Applebot-Extended, GoogleOther)](../../../assets/images/infographic-geo-boty-ai-przewodnik.png)

> **Częsty błąd:** blokowanie tylko niektórych botów OpenAI lub Anthropic. Jeśli blokujesz `GPTBota`, ale dopuszczasz `OAI-SearchBota`, sygnał jest mieszany – Twoja strona nie trafi do treningu, ale może być cytowana w czasie rzeczywistym. To może być świadoma decyzja, ale częściej wynika z niewiedzy.

<aside class="callout-fact">
  <div class="callout-icon">✦</div>
  <div class="callout-body">
    <div class="callout-label">Ciekawostka</div>
    <p>GPTBot zaczął indeksować internet dopiero <strong>w sierpniu 2023 roku</strong>. Tuż po jego ogłoszeniu duże media (m.in. NYT, CNN i Reuters) zablokowały bota w robots.txt. Blokada GPTBota dotyczy jednak treningu modeli – o obecności w wyszukiwaniu ChatGPT decyduje osobny OAI-SearchBot. Część wydawców, w tym NYT, blokuje też CCBota, zamykając drugą drogę do danych treningowych – przez zbiory Common Crawl. <strong>Każdy bot to osobna decyzja – warto podejmować ją świadomie, a nie hurtem.</strong></p>
  </div>
</aside>

## Konfiguracja robots.txt – działający szablon

Standardowa praktyka to dopuszczenie wszystkich oficjalnych botów AI, chyba że masz konkretny powód do blokady (ochrona własności intelektualnej, treści za paywallem). Przykład solidnego `robots.txt` dla strony chcącej być widoczną we wszystkich najpopularniejszych modelach LLM:

```
User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Claude-User
Allow: /

User-agent: Claude-SearchBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Perplexity-User
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: GoogleOther
Allow: /

User-agent: CCBot
Allow: /

User-agent: Applebot-Extended
Allow: /

Sitemap: https://twojadomena.pl/sitemap.xml
```

Pamiętaj, że `robots.txt` nie zatrzyma wszystkich. Fetchery działające na żądanie użytkownika – `ChatGPT-User`, `Perplexity-User` czy `Google-GeminiNotebook` – według dokumentacji ich właścicieli mogą nie stosować się do reguł z tego pliku, bo pobranie strony zlecił człowiek.

Druga pułapka: blokowanie ścieżek dynamicznych (`/search/`, `/cart/`). Boty AI, podobnie jak Googlebot, nie powinny indeksować adresów URL z parametrami koszyka, sesji, filtrowania. Standardowe wyłączenia `/api/`, `/admin/`, `/cart/`, `/checkout/`, `/search/?q=` nadal działają.

Trzecia pułapka dotyczy Google. Token `Google-Extended` nie wyłącza Twojej strony z AI Overviews ani AI Mode – steruje tylko trenowaniem i uziemianiem modeli Gemini. Od 31 sierpnia 2026 roku do rezygnacji z funkcji generatywnych wyszukiwarki służy przełącznik Search generative AI control w Google Search Console. Wyłączenie nie wpływa na ranking w zwykłych wynikach, ale oznacza zero wyświetleń i ruchu z AI Overviews, AI Mode i funkcji AI w Discover.

## Czy llms.txt ma sens?

`llms.txt` to **propozycja** standardu z 2024 roku (autor: Jeremy Howard), podobna do [robots.txt](https://pl.wikipedia.org/wiki/Robots_Exclusion_Protocol), ale przeznaczona stricte dla modeli LLM. Plik leży w katalogu głównym domeny i zawiera hierarchiczną mapę najważniejszych zasobów na stronie z opisami w naturalnym języku. Idea: zamiast pozwalać modelowi LLM przeczesywać całą stronę, dajesz mu kuratorską listę treści, którą chcesz, żeby model znał najlepiej.

> **Ważne zastrzeżenie.** `llms.txt` **nie jest dziś główną wytyczną technicznej optymalizacji GEO**. Branża jest podzielona, a stopień wdrożenia niejednoznaczny. Zastosuj go jako uzupełnienie podstaw – nie jako pierwszy krok i nie kosztem schema.org, SSR czy `robots.txt`.

Poziom adaptacji w 2026 roku:

- **OpenAI i Anthropic** – brak oficjalnego potwierdzenia, że ich crawlery uwzględniają `llms.txt` przy pobieraniu treści
- **Google** nie zaimplementowało standardu – w przewodniku po optymalizacji pod funkcje AI w wyszukiwarce uznaje `llms.txt` za zbędny, bo wystarcza mu klasyczny crawl
- **Perplexity** – brak oficjalnej deklaracji, że silnik korzysta z `llms.txt`; publicznie dostępne analizy logów nie pokazują, by boty AI regularnie pobierały ten plik
- **W praktyce** efekt wdrożenia jest trudny do wyizolowania – nikt nie widział twardego testu A/B pokazującego mierzalny wzrost cytowalności wyłącznie dzięki `llms.txt`

Praktyczna rekomendacja: tak, możesz wdrożyć `llms.txt` jako dodatek, ale **nie kosztem prawidłowej struktury technicznej strony** (SSR, schema.org, poprawny plik `robots.txt`). Plik powinien zawierać 5–15 najważniejszych zasobów, opisanych zwięźle w naturalnym języku. Kolejność priorytetów: `robots.txt` → schema.org → SSR/SSG → dopiero potem `llms.txt`.

Przykład dla agencji SEO:

```
# Twoja Marka

> Agencja SEO i AI Search Optimization z Warszawy, 15 lat doświadczenia.

## Główne usługi

- [Audyt widoczności AI](/audyt-ai/): pełny raport widoczności marki w ChatGPT, Claude, Gemini, Perplexity, plan działania na 90 dni
- [Pozycjonowanie](/seo/): klasyczne SEO dla branży e-commerce i SaaS
- [Content marketing](/content/): produkcja treści zoptymalizowanych pod GEO

## Wiedza

- [Co to jest GEO](/geo/czym-jest-geo/): definicja, różnice względem SEO
- [Query fan-out w trybie Google AI](/geo/query-fan-out/): jak działa pobieranie danych w AI Mode

## Kontakt

- [Bezpłatna konsultacja](/kontakt/): 30-minutowa rozmowa, bez zobowiązań
```

Zawartość świadomie krótka, w naturalnym języku, z linkami do najważniejszych zasobów. Model LLM, który czyta ten plik, dostaje kompletną mapę firmy w 30 sekund.

## Treści renderowane przez JavaScript – cichy zabójca widoczności w AI

Najczęstsza techniczna przyczyna, dla której strony nie pojawiają się w odpowiedziach LLM, mimo poprawnego `robots.txt`, to treści renderowane przez JavaScript (JavaScript-rendered content). **Boty AI, w przeciwieństwie do współczesnego Googlebota, nie wykonują JavaScriptu. Lub wykonują go bardzo słabo, zwykle z dużym limitem czasu (timeoutem).**

Konsekwencja: jeśli Twoja strona jest zbudowana w React/Vue/Angular bez SSR (renderowania po stronie serwera), to większość treści, którą widzi użytkownik w przeglądarce, jest niewidoczna dla bota AI. Bot dostaje pusty `<div id="root">` i nic więcej.

Test, który wykonujemy w pierwszej fazie audytu:

```
curl -A "GPTBot" https://twojadomena.pl/blog/jakistitle
```

Sprawdzasz, czy w odpowiedzi jest faktyczny tekst artykułu, czy szkielet aplikacji. Jeśli szkielet, masz problem.

Trzy standardowe rozwiązania:

- **Renderowanie po stronie serwera (SSR)** – najczystsze podejście. Next.js, Nuxt, SvelteKit, Astro, Remix generują pełen HTML po stronie serwera. Bot dostaje gotowy tekst, JavaScript jest tylko warstwą interaktywności
- **Generowanie statycznych stron (SSG)** – dla treści, które rzadko się zmieniają. Blog, dokumentacja, strony marketingowe – generujesz statyczne pliki HTML przy budowie, bot dostaje pełny tekst bez dynamiki
- **Renderowanie wstępne / dynamiczne (pre-rendering)** – dla aplikacji SPA, których nie da się zrefaktoryzować. Usługa pre-renderingu albo własny middleware rozpoznaje bota po user-agencie i serwuje mu wyrenderowany HTML, a użytkownik z przeglądarką dostaje klasyczne SPA

## Schema.org dla modeli LLM – cztery typy, które dają wzrost

Modele LLM czytają dane strukturalne (JSON-LD) i używają ich jako szybkiego sposobu na zrozumienie kontekstu strony. Cztery typy, które w naszych testach dają mierzalny wzrost cytowalności:

| Schema | Dla czego | Pola krytyczne | Wpływ na cytowalność |
|---|---|---|---|
| **Article** | każdy post blogowy | `headline`, `author`, `datePublished`, `dateModified`, `image` | jednoznaczny autor i daty publikacji oraz aktualizacji |
| **Person** | każdy autor bloga | `name`, `jobTitle`, `worksFor`, `sameAs` | buduje autorytet osoby (autentyczny autor) |
| **Organization** | strona firmowa | `name`, `url`, `logo`, `sameAs`, `address`, `contactPoint` | jednoznaczna identyfikacja firmy |
| **FAQPage** | każda sekcja FAQ | `Question`, `Answer` | gotowe fragmenty Q&A, łatwo pobierane przez silnik |

Modele LLM bardzo lubią `FAQPage` – każde pytanie z parą `Question` + `Answer` to gotowy fragment Q&A, który można podzielić na czyste podzapytania.

## Plan implementacji w 30 dni

Praktyczny harmonogram wdrożenia pełnej obsługi botów AI dla średniej strony korporacyjnej. Każdy tydzień ma konkretny rezultat.

1. **Tydzień 1: audyt obecnego stanu** – test `curl -A "GPTBot"` na 10–15 najważniejszych adresach URL, sprawdzenie obecnego `robots.txt`, identyfikacja ścieżek z treściami renderowanymi w JS
2. **Tydzień 2: konfiguracja `robots.txt` i `llms.txt`** – dopuszczenie wszystkich oficjalnych botów, stworzenie `llms.txt` z 8–15 najważniejszymi zasobami
3. **Tydzień 3: wdrożenie schema.org** – Article, Person, Organization, FAQPage. Walidacja przez Google Rich Results Test i Schema.org Validator
4. **Tydzień 4: rozwiązanie problemu JavaScript** (jeśli istnieje) – migracja na SSR (jeśli realna) lub konfiguracja pre-renderingu

Po 30 dniach robisz re-test: `curl -A "GPTBot"` zwraca pełny tekst, schema.org przechodzi walidację na wszystkich podstronach, `llms.txt` zawiera ponad 10 adresów URL. Trzy miesiące później widzisz wzrost wskaźnika cytowań (Citation Rate) w 4 silnikach AI.

<aside class="callout-expert">
  <div class="callout-icon"><img src="/authors/michal-ziach.avif" alt="Michał Ziach" /></div>
  <div class="callout-body">
    <div class="callout-label">Opinia eksperta</div>
    <p>W audytach technicznych w ICEA największe zaskoczenie zawsze wywołuje pierwszy slajd: <code>curl -A "GPTBot"</code> zwraca pustkę albo szkielet aplikacji. To dotyczy mniej więcej 60% stron klientów na nowoczesnych stackach (React/Vue/Angular bez SSR). Wszystkie inne optymalizacje GEO – dane strukturalne, llms.txt, content – nie mają najmniejszego znaczenia, dopóki bot fizycznie nie dostaje tekstu. <strong>Pierwszy ruch zawsze: renderowanie po stronie serwera (SSR).</strong></p>
    <div class="callout-author">Michał Ziach · CTO, ICEA</div>
  </div>
</aside>

## Co warto sprawdzić w pierwszej kolejności?

Konfiguracja botów AI to zadanie, które najlepiej wykonać raz a dobrze. **Większość problemów technicznej widoczności w AI sprowadza się do prostych list kontrolnych: które boty dopuszczam, czy mam SSR, czy mam wdrożone dane strukturalne.** Zaniedbanie tych podstaw oznacza, że nawet najlepsza strategia contentowa nie zadziała – bo model LLM po prostu Twojej strony nie widzi.

W audycie technicznym widoczności AI w ICEA pierwsza godzina to weryfikacja, czy boty AI fizycznie dostają tekst. Jeśli nie, cała reszta jest budowaniem na piasku. Jeśli chcesz sprawdzić, czy boty AI mają dostęp do Twojej strony, [Dostęp botów AI](/narzedzia/ai-bots-check/) odpyta robots.txt o 14 botów AI (13 z tej listy plus OAI-AdsBot) i da Ci tabelę allowed/disallowed plus listę najważniejszych zmian do wdrożenia – w 30 sekund, bez logowania.
