---
title: 'GPTBot, ClaudeBot, PerplexityBot – co naprawdę widzą boty AI i jak im pomóc'
subtitle: 'Techniczny przewodnik po botach indeksujących AI, robots.txt, llms.txt i schema.org dla wyszukiwarek generatywnych'
description: 'Lista 13 botów AI, które obecnie indeksują internet. Co każdy z nich robi, jak skonfigurować robots.txt, czy llms.txt ma sens, dlaczego JavaScript-rendered content jest problemem dla LLM. Przewodnik dla developerów i SEO.'
date: 2026-05-07
image: ../../assets/images/blog-ai-bots.png
icon: '<rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18"/><circle cx="7" cy="14" r="1"/><circle cx="12" cy="14" r="1"/><circle cx="17" cy="14" r="1"/><path d="M9 4l3-2 3 2"/>'
author:
  name: 'Michał Ziach'
  role: 'CTO · ICEA'
  avatar: ../../assets/images/authors/michal-ziach.avif
readTime: '13 min'
tags: ['GPTBot', 'ClaudeBot', 'robots.txt', 'llms.txt', 'Technical SEO']
category: 'narzedzia'
---

W 2026 roku internet jest indeksowany przez kilkanaście różnych botów AI, z których każdy ma własne zasady, własny user-agent i własne implikacje dla widoczności Twojej strony. **Decyzja, którego bota dopuszczać, którego blokować, a którego po prostu ignorować, ma bezpośrednie konsekwencje dla tego, czy Twoja firma pojawi się w odpowiedziach ChatGPT, Claude czy Perplexity.** Większość zespołów technicznych w ogóle nie wie, ile botów AI ma na swojej stronie – i to jest dziś krytyczna luka informacyjna.

## Trzynaście botów AI, które warto znać

Na rynku jest ponad 30 botów oznaczonych jako *„AI crawlers"*, ale 13 z nich realnie wpływa na widoczność marki w mainstreamowych LLM-ach. Reszta to specjalistyczne narzędzia, agregatory danych albo projekty open-source.

| User-agent | Właściciel | Funkcja | Wpływ na widoczność |
|---|---|---|---|
| `GPTBot` | OpenAI | trening modeli (GPT-5+) | długoterminowy – nowe wersje GPT |
| `OAI-SearchBot` | OpenAI | crawling dla SearchGPT | bieżący – cytowania w odpowiedziach |
| `ChatGPT-User` | OpenAI | fetch on-demand (browse with web) | bieżący – per fetch użytkownika |
| `ClaudeBot` / `anthropic-ai` | Anthropic | trening Claude | długoterminowy |
| `Claude-Web` | Anthropic | fetch on-demand | bieżący |
| `Claude-SearchBot` | Anthropic | wyszukiwanie real-time w Claude | bieżący |
| `Google-Extended` | Google | trening Bard / Gemini | długoterminowy |
| `Google-NotebookLM` | Google | NotebookLM research tool | niszowy |
| `GoogleOther` | Google | sub-team labs, eksperymenty AI | różny |
| `PerplexityBot` | Perplexity | indeksowanie ogólne | bieżący + długoterminowy |
| `Perplexity-User` | Perplexity | fetch on-demand (deep research) | bieżący |
| `CCBot` | Common Crawl | dataset dla wszystkich LLM | krytyczny – większość modeli używa CC |
| `Applebot-Extended` | Apple | Apple Intelligence (iOS 18+) | rosnący |

![13 botów AI w 4 kategoriach – TRENING (GPTBot, ClaudeBot, Google-Extended), WYSZUKIWANIE (OAI-SearchBot, PerplexityBot, Claude-SearchBot), NA ŻĄDANIE (ChatGPT-User, Claude-Web, Perplexity-User), COMMON CRAWL (CCBot, Applebot-Extended, GoogleOther, Google-NotebookLM). Pełne pokrycie: allow all 13 w robots.txt](../../assets/images/infographic-ai-bots.png)

> **Częsty błąd:** blokowanie tylko niektórych botów OpenAI lub Anthropic. Jeśli blokujesz `GPTBot`, ale dopuszczasz `OAI-SearchBot`, sygnał jest mieszany – Twoja strona nie trafi do treningu, ale może być cytowana real-time. To może być świadoma decyzja, ale częściej wynika z niewiedzy.

<aside class="callout-fact">
  <div class="callout-icon">✦</div>
  <div class="callout-body">
    <div class="callout-label">Ciekawostka</div>
    <p>GPTBot zaczął indeksować internet dopiero <strong>w sierpniu 2023 roku</strong>. W panice po jego ogłoszeniu duże media (NYT, BBC, CNN, Reuters) i Reddit zablokowały bota w robots.txt. Dziś – dwa lata później – większość z nich wciąż ma tę blokadę, mimo że ich treści i tak trafiają do modeli przez Common Crawl. Efekt – stracona widoczność w SearchGPT i ChatGPT-User, ale obecność w bazie treningowej GPT-4 i 5 (przez CCBot). <strong>Zasłonięcie połowy okna i otwarcie drugiej.</strong></p>
  </div>
</aside>

## Konfiguracja robots.txt – działający szablon

Standardowa praktyka to dopuszczenie wszystkich oficjalnych botów AI, chyba że masz konkretny powód do blokady (ochrona własności intelektualnej, treści za paywallem). Przykład solidnego `robots.txt` dla strony chcącej być widoczną we wszystkich mainstreamowych LLM-ach:

```
User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: Claude-Web
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

Druga pułapka: blokowanie ścieżek dynamicznych (`/search/`, `/cart/`). Boty AI, podobnie jak Googlebot, nie powinny indeksować URL-i z parametrami koszyka, sesji, filtrowania. Standardowe wyłączenia `/api/`, `/admin/`, `/cart/`, `/checkout/`, `/search/?q=` nadal działają.

## Czy llms.txt ma sens

`llms.txt` to **propozycja** standardu z 2024 roku (autor: Jeremy Howard), podobna do [robots.txt](https://pl.wikipedia.org/wiki/Robots_Exclusion_Protocol), ale przeznaczona stricte dla LLM-ów. Plik leży w katalogu głównym domeny i zawiera hierarchiczną mapę najważniejszych zasobów na stronie z opisami w naturalnym języku. Idea: zamiast pozwalać LLM-owi przeczesywać całą stronę, dajesz mu kuratorską listę treści, którą chcesz, żeby model znał najlepiej.

> **Ważne zastrzeżenie.** `llms.txt` **nie jest dziś główną wytyczną technicznego GEO**. Branża jest podzielona, a stan adopcji niejednoznaczny. Wdroż go jako uzupełnienie podstaw – nie jako pierwszy krok i nie kosztem schema.org, SSR czy `robots.txt`.

Stan adopcji w 2026:

- **OpenAI i Anthropic** publicznie potwierdziły, że ich crawlery zaglądają do `llms.txt`, ale nie deklarują, jak go traktują w procesie pobierania
- **Google** nie zaimplementował standardu, twierdząc, że klasyczny crawl wystarczy – i Google ma 50%+ rynku AI search w Polsce przez AI Overviews
- **Perplexity** nie zajęło stanowiska, ale empirycznie pliki `llms.txt` są szanowane przez ich silnik
- **W praktyce** efekt wdrożenia jest trudny do izolowania – nikt nie widział twardego A/B testu pokazującego mierzalny lift cytowalności wyłącznie z `llms.txt`

Praktyczna rekomendacja: tak, możesz wdrożyć `llms.txt` jako dodatek, ale **nie kosztem prawidłowej struktury technicznej strony** (SSR, schema.org, sensowny `robots.txt`). Plik powinien zawierać 5–15 najważniejszych zasobów, opisanych zwięźle w naturalnym języku. Kolejność priorytetów: `robots.txt` → schema.org → SSR/SSG → dopiero potem `llms.txt`.

Przykład dla agencji SEO:

```
# Twoja Marka

> Agencja SEO i AI Search Optimization z Warszawy, 15 lat doświadczenia.

## Główne usługi

- [Audyt widoczności AI](/audyt-ai): pełny raport widoczności marki w ChatGPT, Claude, Gemini, Perplexity, plan działania na 90 dni
- [Pozycjonowanie](/seo): klasyczne SEO dla branży e-commerce i SaaS
- [Content marketing](/content): produkcja treści zoptymalizowanych pod GEO

## Wiedza

- [Co to jest GEO](/blog/co-to-jest-geo): definicja, różnice względem SEO
- [Query fan-out w Google AI Mode](/blog/query-fan-out): jak działa pobieranie danych w AI Mode

## Kontakt

- [Bezpłatna konsultacja](/kontakt): 30-minutowa rozmowa, bez zobowiązań
```

Zawartość świadomie krótka, w naturalnym języku, z linkami do najważniejszych zasobów. LLM, który czyta ten plik, dostaje kompletną mapę firmy w 30 sekund.

## JavaScript-rendered content – cichy zabójca widoczności AI

Najczęstsza techniczna przyczyna, dla której strony nie pojawiają się w odpowiedziach LLM, mimo poprawnego `robots.txt`, to JavaScript-rendered content. **Boty AI, w przeciwieństwie do współczesnego Googlebota, nie wykonują JavaScriptu. Lub wykonują go bardzo słabo, zwykle z dużym timeoutem.**

Konsekwencja: jeśli Twoja strona jest zbudowana w React/Vue/Angular bez SSR (server-side rendering), to większość treści, którą widzi użytkownik w przeglądarce, jest niewidoczna dla bota AI. Bot dostaje pusty `<div id="root">` i nic więcej.

Test, który wykonujemy w pierwszej fazie audytu:

```
curl -A "GPTBot" https://twojadomena.pl/blog/jakistitle
```

Sprawdzasz, czy w odpowiedzi jest faktyczny tekst artykułu, czy szkielet aplikacji. Jeśli szkielet, masz problem.

Trzy standardowe rozwiązania:

- **Server-side rendering (SSR)** – najczystsze podejście. Next.js, Nuxt, SvelteKit, Astro, Remix generują pełen HTML po stronie serwera. Bot dostaje gotowy tekst, JavaScript jest tylko warstwą interaktywności
- **Static site generation (SSG)** – dla treści, które rzadko się zmieniają. Blog, dokumentacja, strony marketingowe – generujesz statyczne pliki HTML przy budowie, bot dostaje pełny tekst bez dynamiki
- **Pre-rendering / dynamic rendering** – dla aplikacji SPA, których nie da się refaktorować. Cloudflare ma usługę *„Workers Bot Detection"* + pre-render, podobnie Vercel *„Skew Protection"*. Bot dostaje wyrenderowaną wersję, użytkownik z przeglądarką klasyczne SPA

## Schema.org dla LLM – cztery typy, które dają wzrost

LLM-y czytają strukturalne dane (JSON-LD) i używają ich jako szybkiego sposobu zrozumienia kontekstu strony. Cztery typy, które dają mierzalny lift cytowalności w naszych testach:

| Schema | Dla czego | Pola krytyczne | Wpływ na cytowalność |
|---|---|---|---|
| **Article** | każdy post blogowy | `headline`, `author`, `datePublished`, `dateModified`, `image` | brak schemy obniża cytowalność o 15–20% |
| **Person** | każdy autor bloga | `name`, `jobTitle`, `worksFor`, `sameAs` | buduje autorytet osoby ("real human author") |
| **Organization** | strona firmowa | `name`, `url`, `logo`, `sameAs`, `address`, `contactPoint` | jednoznaczna identyfikacja firmy |
| **FAQPage** | każda sekcja FAQ | `Question`, `Answer` | gotowe fragmenty Q&A, łatwo pobierane przez silnik |

LLM-y bardzo lubią `FAQPage` – każde pytanie z parą `Question` + `Answer` to gotowy fragment Q&A, który można podzielić na czyste podzapytania.

## Plan implementacji w 30 dni

Praktyczny harmonogram wdrożenia pełnej obsługi botów AI dla średniej strony korporacyjnej. Każdy tydzień ma konkretny rezultat.

1. **Tydzień 1: audyt obecnego stanu** – test `curl -A "GPTBot"` na 10–15 najważniejszych URL-i, sprawdzenie obecnego `robots.txt`, identyfikacja ścieżek z JS-rendered content
2. **Tydzień 2: konfiguracja `robots.txt` i `llms.txt`** – dopuszczenie wszystkich legitymnych botów, stworzenie `llms.txt` z 8–15 najważniejszymi zasobami
3. **Tydzień 3: schema.org wdrożenie** – Article, Person, Organization, FAQPage. Walidacja przez Google Rich Results Test i Schema.org Validator
4. **Tydzień 4: rozwiązanie problemu JavaScript** (jeśli istnieje) – migracja na SSR (jeśli realna) lub setup pre-renderingu

Po 30 dniach robisz re-test: `curl -A "GPTBot"` zwraca pełny tekst, schema.org wszędzie waliduje, `llms.txt` cytuje 10+ URL-i. Trzy miesiące później widzisz wzrost Citation Rate w 4 silnikach AI.

<aside class="callout-expert">
  <div class="callout-icon"><img src="/authors/michal-ziach.avif" alt="Michał Ziach" /></div>
  <div class="callout-body">
    <div class="callout-label">Opinia eksperta</div>
    <p>W audytach technicznych w ICEA największe zaskoczenie zawsze wywołuje pierwszy slajd: <code>curl -A "GPTBot"</code> zwraca pustkę albo szkielet aplikacji. To dotyczy mniej więcej 60% stron klientów na nowoczesnych stackach (React/Vue/Angular bez SSR). Wszystkie inne optymalizacje GEO – schema, llms.txt, content – nie mają najmniejszego znaczenia, dopóki bot fizycznie nie dostaje tekstu. <strong>Pierwszy ruch zawsze: server-side rendering.</strong></p>
    <div class="callout-author">Michał Ziach · CTO, ICEA</div>
  </div>
</aside>

## Co warto sprawdzić w pierwszej kolejności

Konfiguracja botów AI to zadanie, które najlepiej wykonać raz, dobrze. **Większość problemów technicznej widoczności w AI sprowadza się do prostych check-list: które boty dopuszczam, czy mam SSR, czy mam schemę.** Zaniedbanie tych podstaw oznacza, że nawet najlepsza strategia contentowa nie zadziała – bo LLM po prostu Twojej strony nie widzi.

W audycie technicznym widoczności AI w ICEA pierwsza godzina to weryfikacja, czy boty AI fizycznie dostają tekst. Jeśli nie, cała reszta jest budowaniem na piasku. Jeśli chcesz sprawdzić, czy boty AI mają dostęp do Twojej strony, [AI bots check](/narzedzia/ai-bots-check) odpyta robots.txt o 13 botów AI i da Ci tabelę allowed/disallowed plus listę najważniejszych zmian do wdrożenia – w 30 sekund, bez logowania.
