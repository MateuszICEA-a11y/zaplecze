---
title: 'GPTBot, ClaudeBot, PerplexityBot – co naprawdę widzą boty AI i jak im pomóc'
subtitle: 'Techniczny przewodnik po crawlerach AI, robots.txt, llms.txt i schema.org dla wyszukiwarek generatywnych'
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

W 2026 roku internet jest scrapowany przez kilkanaście różnych botów AI, z których każdy ma własne zasady, własny user-agent i własne implikacje dla widoczności Twojej strony. Decyzja, którego bota dopuszczać, którego blokować, a którego po prostu ignorować, ma bezpośrednie konsekwencje dla tego, czy Twoja firma pojawi się w odpowiedziach ChatGPT, Claude czy Perplexity. Tymczasem większość zespołów technicznych w ogóle nie wie, ilu botów AI ma na swojej stronie – i to jest dziś krytyczna luka informacyjna.

## Trzynaście botów AI, które warto znać

Na rynku jest obecnie ponad 30 botów oznaczonych jako "AI crawlers", ale 13 z nich realnie wpływa na widoczność Twojej marki w mainstream LLM-ach. Reszta to specjalistyczne narzędzia, agregatory danych albo projekty open-source, które nie zasiilują dużych modeli.

**OpenAI – trzy boty, każdy o innej roli**:

`GPTBot` to crawler treningowy. Indeksuje strony do datasetu używanego w treningu kolejnych wersji GPT. Jeśli go zablokujesz, Twoja strona może w ogóle nie trafić do "wiedzy ogólnej" przyszłych modeli ChatGPT. To bardzo długoterminowa decyzja – wpływ pojawi się przy następnym major release modelu (GPT-5, GPT-6).

`OAI-SearchBot` to crawler dla SearchGPT, czyli funkcji ChatGPT, która real-time wyszukuje w internecie podczas odpowiedzi. Blokowanie go uniemożliwia cytowanie Twojej strony w aktualnych odpowiedziach ChatGPT z włączoną opcją wyszukiwania.

`ChatGPT-User` to bot, który pojawia się, gdy użytkownik ChatGPT klika "browse with web" i model fetchuje konkretną stronę. To bot fetch-on-demand – jeśli go blokujesz, użytkownicy ChatGPT po prostu nie mogą zobaczyć Twojej strony.

**Anthropic – trzy boty z podobną logiką**:

`ClaudeBot` (lub `anthropic-ai`) to crawler treningowy Claude. Działa analogicznie do GPTBot.

`Claude-Web` to fetch-on-demand bot dla Claude, gdy użytkownik prosi model o przeczytanie konkretnego URL.

`Claude-SearchBot` (uruchomiony pod koniec 2025) to crawler dla nowej funkcji wyszukiwania w Claude, analogiczny do OAI-SearchBot.

**Google – cztery boty AI**:

`Google-Extended` to specjalny user-agent, który Google używa, gdy crawluje strony do treningu Bard/Gemini. Klasyczny `Googlebot` go nie zastępuje – jeśli zablokujesz tylko Googlebot, Google-Extended nadal indeksuje. Decyzja o blokadzie Google-Extended wpływa na obecność marki w Gemini i Bard, ale nie na klasyczne wyniki Google.

`Google-NotebookLM` to bot dla Google NotebookLM (research tool dla użytkowników Pro).

`GoogleOther` to ogólny user-agent dla różnych badawczych aktywności Google (sub-team labs, eksperymenty AI).

`Googlebot-Image` (klasyczny) – nadal istotny dla AI Overviews, gdzie Google często wykorzystuje obrazy ze stron.

**Pozostałe znaczące boty**:

`PerplexityBot` to crawler Perplexity. Mała firma, ale jeden z najszybciej rosnących LLM search engines.

`Perplexity-User` to fetch-on-demand bot, gdy użytkownik Perplexity klika "deep research" i model real-time fetchuje konkretny URL.

`CCBot` (Common Crawl) to nie bezpośrednio bot AI, ale Common Crawl jest największym public datasetem używanym do trenowania prawie wszystkich LLM-ów (GPT-3, GPT-4, LLaMA, Claude, Gemini wszystkie używają w różnym stopniu). Blokowanie CCBot zamyka Twoje treści dla większości projektów AI, w tym open source.

`Applebot-Extended` to bot Apple, używany dla Apple Intelligence (Siri+Spotlight w iOS 18+).

`Bytespider` to bot ByteDance/TikTok – używany dla Doubao i tak zwanych AI features w TikTok. W Polsce mniej istotny, w Azji kluczowy.

## robots.txt – jak to skonfigurować

Standardowa praktyka to dopuszczenie wszystkich legitymnych botów AI, chyba że masz konkretny powód do blokady (np. ochrona własności intelektualnej, serwisy płatne behind paywall). Konkretny przykład solidnego `robots.txt` dla strony, która chce być widoczna we wszystkich mainstream LLM-ach:

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

Częsty błąd: blokowanie tylko niektórych botów. Jeśli blokujesz GPTBot, ale dopuszczasz OAI-SearchBot, sygnał jest mieszany – Twoja strona nie trafi do treningu, ale może być cytowana real-time. To może być świadoma decyzja (np. nie chcę, żeby moje treści szły do treningu, ale OK, żeby były cytowane), ale często wynika z niewiedzy.

Druga pułapka: blokowanie ścieżek dynamicznych (`/search/`, `/cart/`). Boty AI, podobnie jak Googlebot, nie powinny indeksować URL-i z parametrami koszyka, sesji, filtrowania. Standardowe wyłączenia `/api/`, `/admin/`, `/cart/`, `/checkout/`, `/search/?q=` nadal działają.

## Czy llms.txt ma sens

`llms.txt` to propozycja standardu z 2024, podobna do `robots.txt`, ale dedykowana stricte LLM. Plik leży w roocie domeny i zawiera hierarchiczną mapę najważniejszych zasobów na stronie z opisami w naturalnym języku. Idea: zamiast pozwalać LLM-owi crawlować całą stronę, dajesz mu kuratorską listę treści, którą chcesz, żeby model znał najlepiej.

Stan adopcji w 2026: OpenAI i Anthropic publicznie potwierdziły, że ich crawlery czytają `llms.txt`. Google oficjalnie odrzucił standard, twierdząc, że klasyczny crawl wystarczy. Perplexity nie zajęło stanowiska, ale empirycznie pliki `llms.txt` są szanowane przez ich silnik retrieval.

Praktyczna rekomendacja: tak, wdrażaj `llms.txt`, ale traktuj go jako dodatek, nie substytut prawidłowej struktury technicznej strony. Plik powinien zawierać 5–15 najważniejszych zasobów, opisanych zwięźle w naturalnym języku. Przykład dla agencji SEO:

```
# Twoja Marka

> Agencja SEO i AI Search Optimization z Warszawy, 15 lat doświadczenia.

## Główne usługi

- [Audyt widoczności AI](/audyt-ai): pełny raport widoczności marki w ChatGPT, Claude, Gemini, Perplexity, plan działania na 90 dni
- [Pozycjonowanie](/seo): klasyczne SEO dla branży e-commerce i SaaS
- [Content marketing](/content): produkcja treści zoptymalizowanych pod GEO

## Wiedza

- [Co to jest GEO](/blog/co-to-jest-geo): definicja, różnice względem SEO
- [Query fan-out w Google AI Mode](/blog/query-fan-out): jak działa retrieval w AI Mode

## Kontakt

- [Bezpłatna konsultacja](/kontakt): 30-minutowa rozmowa, bez zobowiązań
```

Zawartość świadomie krótka, w naturalnym języku, z linkami do najważniejszych zasobów. LLM, który czyta ten plik, dostaje kompletną mapę firmy w 30 sekund.

## JavaScript-rendered content – cichy zabójca widoczności AI

Najczęstsza techniczna przyczyna, dla której strony nie pojawiają się w odpowiedziach LLM, mimo poprawnego `robots.txt`, to JavaScript-rendered content. Boty AI, w przeciwieństwie do współczesnego Googlebota, nie wykonują JavaScript. Lub wykonują go bardzo słabo, zwykle z dużym timeoutem.

Konsekwencja: jeśli Twoja strona jest zbudowana w React/Vue/Angular bez SSR (server-side rendering), to większość treści, którą widzi użytkownik w przeglądarce, jest niewidoczna dla bota AI. Bot dostaje pusty `<div id="root">` i nic więcej. Nawet jeśli technicznie ma dostęp (robots.txt OK), nie ma czego scrapować.

Test, który wykonujemy w pierwszej fazie audytu: `curl -A "GPTBot" https://twojadomena.pl/blog/jakistitle` i sprawdzenie, czy w odpowiedzi jest faktyczny tekst artykułu, czy szkielet aplikacji. Jeśli szkielet, masz problem.

Trzy standardowe rozwiązania:

**Server-side rendering (SSR)** to najczystsze podejście. Next.js, Nuxt, SvelteKit, Astro, Remix – wszystkie nowoczesne frameworki SSR generują pełen HTML po stronie serwera. Bot dostaje gotowy tekst, JavaScript jest tylko warstwą interaktywności.

**Static site generation (SSG)** dla treści, która rzadko się zmienia. Blog, dokumentacja, strony marketingowe – generujesz statyczne HTML pliki przy build, bot dostaje pełny tekst bez żadnej dynamiki.

**Pre-rendering / dynamic rendering** dla SPA aplikacji, których nie da się refaktorować. Cloudflare ma usługę "Workers Bot Detection" + pre-render, podobnie Vercel "Skew Protection". Bot dostaje wyrenderowaną wersję strony, użytkownik z przeglądarką dostaje klasyczne SPA.

## Schema.org – dla LLM tak samo ważne jak dla Googlebota

LLM-y czytają strukturalne dane (JSON-LD) i używają ich jako szybkiego sposobu na zrozumienie kontekstu strony. Cztery typy schemy, które dają mierzalny lift cytowalności w naszych testach:

**Article schema** dla każdego posta blogowego. Pola krytyczne: `headline`, `author` (z `@type: Person` i `url` do strony autora), `datePublished`, `dateModified`, `image` z URL i wymiarami. Brak schemy artykułu obniża prawdopodobieństwo cytowania o 15–20%.

**Person schema** dla każdego autora bloga. Pola krytyczne: `name`, `jobTitle`, `worksFor`, `sameAs` (lista linków do LinkedIn, Twitter, profile zawodowe). To buduje autorytet osoby w oczach LLM, który traktuje cytowania od "real human author" jako bardziej wiarygodne.

**Organization schema** dla strony firmowej. Pola krytyczne: `name`, `url`, `logo`, `sameAs` (LinkedIn firmy, Wikipedia jeśli istnieje), `address`, `contactPoint`. To pozwala LLM jednoznacznie identyfikować firmę.

**FAQPage schema** dla każdej sekcji FAQ. Każde pytanie z `Question` i `Answer` schemą. LLM-y bardzo lubią ten format, bo gotowe pasaże Q&A są naturalnie chunkable do retrieval engine.

## Plan implementacji w 30 dni

Praktyczny harmonogram wdrożenia pełnej obsługi botów AI dla średniej strony korporacyjnej:

**Tydzień 1: audyt obecnego stanu**. Test `curl -A "GPTBot"` na 10–15 najważniejszych URL-i. Sprawdzenie obecnego `robots.txt`. Identyfikacja ścieżek z JS-rendered content.

**Tydzień 2: konfiguracja `robots.txt` i `llms.txt`**. Dopuszczenie wszystkich legitymnych botów. Stworzenie `llms.txt` z 8–15 najważniejszymi zasobami.

**Tydzień 3: schema.org wdrożenie**. Article, Person, Organization, FAQPage. Walidacja przez Google Rich Results Test i Schema.org Validator.

**Tydzień 4: rozwiązanie problemu JavaScript** (jeśli istnieje). SSR migration (jeśli realne) lub pre-rendering setup.

Po 30 dniach robisz re-test: `curl -A "GPTBot"` zwraca pełny tekst, schema.org wszędzie validuje, `llms.txt` cytuje 10+ URL-i. Trzy miesiące później widzisz wzrost Citation Rate w 4 silnikach AI.

## Wnioski

Konfiguracja botów AI to zadanie, które najlepiej wykonać raz, dobrze. Większość problemów technicznej widoczności w AI sprowadza się do prostych check-list: które boty dopuszczam, czy mam SSR, czy mam schemę. Zaniedbanie tych podstaw oznacza, że nawet najlepsza strategia contentowa nie zadziała – bo LLM po prostu Twojej strony nie widzi.

W audycie technicznym widoczności AI w ICEA pierwsza godzina to weryfikacja, czy boty AI fizycznie dostają tekst. Jeśli nie, cała reszta jest budowaniem na piasku. Jeśli chcesz sprawdzić, czy boty AI mają dostęp do Twojej strony, [uruchom darmowy AI bots check](/narzedzia/ai-bots-check) – w 30 sekund dostaniesz tabelę 13 botów z statusem allowed/disallowed dla Twojej domeny i listą najważniejszych zmian do wdrożenia.
