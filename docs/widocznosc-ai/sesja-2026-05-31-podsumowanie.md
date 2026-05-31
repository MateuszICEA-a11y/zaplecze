# Sesja 2026-05-31 – widocznosc.ai: typografia mobile, ujednolicenie hero, news pipeline, UX mobile

Cztery paczki na produkcję (deploy z `main` na Cloudflare Pages). Wszystko zweryfikowane Playwright (mobile 390px + desktop 1280px) i buildem (80 stron, zero błędów).

## Commity

| Hash | Zakres |
|---|---|
| `bf75c08` | Hierarchia nagłówków na mobile (h1>h2>h3) |
| `b722c25` | Ujednolicenie hero – „subhead hero" + spójny h1 na podstronach |
| `b634ab0` | News SoftBank jako news + anty-naginanie + CNBC w feedach |
| `e5fce84` | UX mobile – stopka accordion, panel autora, staty, akcent + link bloga |

## 1. Hierarchia nagłówków na mobile (`bf75c08`)

Plik: `src/styles/Theme.css`, blok `@media (max-width: 639px)`.

Problem: na mobile h2 sekcji (`.display-xl`, 44px) przebijało h1 hero (`.display-xxl`, ~33px), a karty h3 były sztywno 32px (globalna reguła `h3:not(...)` = `--fs-display-md` bije scoped style – znany gotcha).

Fix: zejście całościowe – `display-xxl` 34–40px, `display-xl` 27–32px, `display-lg` 22–27px + override kart h3 (card-/process-/industry-/cta-) do 22px przez wyrównaną specyficzność (0,2,1). Efekt @390px: **h1 35 > h2 27 > h3 22**.

## 2. Ujednolicenie hero „subhead hero" (`b722c25`)

Cel: lead pod h1 na WSZYSTKICH podstronach = forma hero z homepage: `clamp(16px, 1.3vw, 19px)` / 16px mobile / line-height 1.45 / kolor ink.

- Nowa globalna klasa `.hero-lead` w `Theme.css` (kontakt, autor).
- Edycje reguł dedykowanych w miejscu: pillar (`pillar-hero-lead`), o-nas (`.about-hero-copy p`), narzędzia (`.tools-hero-copy p`), polityka (`legal-hero-lead`), blog + hub pillarów (`blog-hero-lead` ×2), usługi (`service-hero-subtitle`), news (`news-listing-sub`).
- Pillar h1 zrównany z homepage: zdjęty `white-space: nowrap` (desktop) i bespoke mobile clamp → `display-xxl` (35px mobile / 56px desktop, łamany).
- FAQ na stronie głównej: „Najczęstsze pytania" → „Najczęściej zadawane pytania".

## 3. News SoftBank + pipeline (`b634ab0`)

Wpis `src/content/news/softbank-planuje-do-75-mld-euro-na-centra-danych-we-francji.md`:
- Poprawne fakty (45 mld€ I faza z programu 75 mld€, 5 GW, 3,1 GW do 2031 Hauts-de-France, Schneider Electric, cytat Sona, akcje +70%, Arm/OpenAI, energia jako bariera).
- Źródło: **CNBC** (zamiast błędnego TechCrunch).
- Wycięta naciągana sekcja „znaczenie dla Twojej marki" → krótki komentarz analityczny.

Pipeline `pipeline/news-generator-widocznosc/`:
- `generator.py` – prompt: powiązanie newsa z marką/SEO/GEO jest WARUNKOWE (tylko gdy realne), inaczej analiza rynkowa. Koniec wymuszania.
- `collector.py` + `feeds.yaml` – dodany CNBC (feed Tech, id 19854910) z `ai_filter: true`; nowy mechanizm `_is_ai_relevant` (granice słów dla „AI", nie łapie „said/available"). Dywersyfikacja wobec dominacji TechCruncha.

Reguły zapisane w pamięci: `feedback-news-nie-naginaj-do-marki`, `feedback-news-zrodla`.

## 4. UX mobile (`e5fce84`)

- **Footer** (`Footer.astro`): kolumny jako `<details>` – na mobile rozwijane (accordion jak Semrush), na desktopie zawsze otwarte (skrypt sync z viewportem + `pointer-events:none`, chevron ukryty). Obsługa `astro:page-load`.
- **AuthorBox** (`AuthorBox.astro`): przebudowa na `grid-template-areas` – avatar+nagłówek w rzędzie 1, bio+tagi pełną szerokością w rzędzie 2; ukryty wiszący „·" na mobile.
- **narzedzia.astro**: staty hero na mobile jako wiersz label–wartość (wyrównane w pionie); akcent (niebieski) na „AI" w h1.
- **blog/index.astro**: link karty „Prompt engineering" → `/prompty/przewodnik/` (był błędnie `/prompty/`).

## Odłożone na następną sesję

🔴 **Scraper** dla źródeł newsów bez RSS:
- `artificialanalysis.ai/articles` (apka JS, brak RSS).
- `datacamp.com/blog` (403 Cloudflare; sitemap: `https://www.datacamp.com/sitemap/blog.xml`).
- W repo jest `seo-scraper` / Scrapling do wykorzystania. Cel: pobierać wpisy z tych źródeł i wpinać do pipeline'u newsów. Szczegóły w pamięci `reference-news-zrodla-inspiracja`.

Dodatkowo niezależnie warto: naprawić martwy feed Search Engine Land (403) w `feeds.yaml`.
