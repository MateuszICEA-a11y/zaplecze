# widocznosc.ai – Design Spec

**Data:** 2026-05-06 (revizja po Codex review + impeccable integration)
**Autor:** Mateusz Wiśniewski (ICEA) + Claude Code
**Status:** zaakceptowany przez User'a, gotowy do writing-plans
**Domena:** widocznosc.ai (zarejestrowana)
**Repo:** monorepo `transformacja-zaplecza-seo`, projekt w `portals/widocznosc.ai/`

**Changelog:**
- `2026-05-06 v1` – pierwsza wersja po brainstorming session
- `2026-05-06 v2` – po Codex review: zacieśnienie scope (80 → 40 artykułów na MVP), 3 LLM providers w narzędziu na start (5 jako P2), infografiki tylko dla pillar content, dodane sekcje testing/monitoring/security/RODO/content moderation, integracja impeccable jako design QA tooling, rozwiązane wewnętrzne sprzeczności

---

## 1. Cel i positioning

widocznosc.ai to portal flagowy ICEA – komplementarne źródło wiedzy o AI/GEO/LLM oraz lead-gen channel dla usług ICEA w obszarze pozycjonowania w AI. **Hybryda 50/50:** content hub edukacyjny + sekcja komercyjna z usługami i narzędziami.

### Target audience

- **Decision-makers:** CMO, head of SEO, brand managerzy w średnich/dużych firmach
- **Właściciele e-commerce / sites:** osoby zarządzające widocznością marki online, które chcą być cytowane przez ChatGPT, Claude, Gemini, Perplexity

### KPI

- Ruch organiczny na frazy: "pozycjonowanie ai", "pozycjonowanie w chatgpt", "pozycjonowanie w ai" (łącznie >2,300 vol/mies. trend wzrostowy)
- Brand mention rate w LLM-ach (mierzymy własnym narzędziem AI Visibility Checker)
- Leady do ICEA z formularza audytu + narzędzia
- E-E-A-T: 4 podpisanych autorów ICEA z LinkedIn sameAs

---

## 2. Architektura wysokiego poziomu

### Stack techniczny

- **Astro 5+** (SSG-first z Islands, MDX, View Transitions, native image optimization)
- **Cloudflare Pages** (hosting, auto-deploy z `main`) + **Cloudflare Adapter** dla SSR endpointów
- **Cloudflare D1** (SQLite at edge) – lead storage + rate-limit dla AI Visibility Checker
- **Tailwind CSS** z custom configiem dopasowanym do brand manuala ICEA
- **Content Collections** (Zod schemas) – type-safe content
- **Astro Islands** – React tylko dla AI Visibility Checker, reszta statyczna
- **astro:i18n** – włączony od startu (default `pl`, gotowe na `en` w P2 bez refaktoru)

### Alternatywy rozważone i odrzucone

| Opcja | Powód odrzucenia / decyzja |
|---|---|
| Next.js 15 (App Router) | Overkill dla portalu contentowego, gorszy SEO performance, lock-in na React |
| Hugo (jak busmaniak.pl) | User explicitly wybrał Astro + narzędzie audytu wymaga server endpointów |
| Astro + Vercel | CF Pages = brak limitu transferu, ICEA już ma CF account, spójność z busmaniak.pl |
| **CF Workers + Queues** dla async audit | **Rozważone, MVP zostaje przy Pages Functions z timeout 30s + per-provider timeout 8s + graceful degradation. Workers + Queues włączamy w P2 jeśli p95 latency > 25s lub potrzebujemy retry/backoff per provider** |

### Struktura monorepo

```
transformacja-zaplecza-seo/
├── package.json                    # workspace root (NEW)
├── pnpm-workspace.yaml              # NEW
├── portals/
│   ├── busmaniak.pl/               # Hugo (bez zmian)
│   └── widocznosc.ai/              # Astro (NEW)
│       ├── package.json
│       ├── astro.config.mjs
│       ├── tailwind.config.mjs
│       ├── src/
│       │   ├── content/            # collections (markdown + Zod)
│       │   ├── components/         # Astro components
│       │   ├── layouts/
│       │   ├── pages/              # routing
│       │   └── lib/                # SEO, schema, i18n helpers
│       ├── public/
│       └── functions/              # CF Pages Functions (audit tool)
├── pipeline/
│   ├── content-writer/
│   │   ├── SKILL.md                # busmaniak (existing, bez zmian)
│   │   └── portals/
│   │       └── widocznosc-ai/
│   │           └── SKILL.md        # NEW – content skill dla AI/GEO
│   └── ...                          # reuse: fact-checker, image-gen, fb-poster
└── shared/theme/                    # Hugo theme dla busmaniak.pl
```

### Zmiany na poziomie repo

- `pnpm-workspace.yaml` (nowy) i konwersja root `package.json` na workspace root
- `.github/workflows/widocznosc-deploy.yml` – auto-deploy CF Pages
- Nowe ENV: API kluczy dla 5 LLM-ów (OpenAI, Anthropic, Google AI, Perplexity, Bing/Copilot), Resend
- Reuse istniejących: Senuto, kie.ai, fact-checker GPT-5.4

---

## 3. Information Architecture + URL map

### Zasada przewodnia

Ostry split komercyjne ↔ edukacyjne. **Brak mieszania fraz blogowych ze sprzedażowymi w jednej kategorii.**

### Pełna mapa URL (MVP)

```
/                                      Homepage – filar tematyczny

/pozycjonowanie-ai/                    Pillar komercyjny (target: "pozycjonowanie ai", 860/m)
/pozycjonowanie-ai/pozycjonowanie-w-chatgpt/      Landing usługowy (600/m)
/pozycjonowanie-ai/pozycjonowanie-w-claude/
/pozycjonowanie-ai/pozycjonowanie-w-gemini/
/pozycjonowanie-ai/pozycjonowanie-w-perplexity/
/pozycjonowanie-ai/pozycjonowanie-w-copilot/
/pozycjonowanie-ai/audyt-widocznosci-ai/          Landing usługowy (link + CTA do narzędzia, NIE embed)
/pozycjonowanie-ai/optymalizacja-pod-llm/
/pozycjonowanie-ai/case-studies/                  Listing
/pozycjonowanie-ai/case-studies/[slug]/

/baza-wiedzy/                          Listing (paginowany, filtry)
/baza-wiedzy/modele-ai/                Kategoria
/baza-wiedzy/modele-ai/[slug]/         Artykuł (chatgpt, claude, gemini, perplexity, codex, claude-code, chatgpt-vs-claude…)
/baza-wiedzy/pojecia-ai/               Kategoria
/baza-wiedzy/pojecia-ai/[slug]/        Artykuł (rag, embeddingi, tokeny, vector-database, fine-tuning, transformer, attention, prompt-engineering, hallucinacje, context-window…)
/baza-wiedzy/poradniki/                Kategoria
/baza-wiedzy/poradniki/[slug]/         Artykuł (e-commerce-w-ai, b2b-w-ai, agencja-w-ai…)

/narzedzia/                            Listing narzędzi (MVP: 1)
/narzedzia/audyt-widocznosci-ai/       AI Visibility Checker (interactive tool)

/o-nas/                                ICEA + widocznosc.ai story
/autorzy/                              Listing 4 autorów
/autor/[slug]/                         Profil autora + jego artykuły
/kontakt/                              Form → plain mailbox
/newsletter/                           P2 placeholder

/sitemap.xml /sitemap-index.xml /robots.txt /llms.txt /llms-full.txt
/404, /500
```

### Kluczowe decyzje IA

- **`/pozycjonowanie-ai/` jest pillarem komercyjnym** – tylko strony pozycjonujące pod sprzedażowe intencje + case studies. Żadnych blogów tu.
- **Frazy edukacyjne** ("co to jest RAG", "jak działa ChatGPT", "Claude vs ChatGPT") siedzą w `/baza-wiedzy/` i są oddzielone od pillara.
- **`/baza-wiedzy/pojecia-ai/`** to **pełnowartościowe artykuły** (1500-3000+ słów), NIE krótki słownik. Każdy taki artykuł celuje w long-tail "co to jest X", ALE buduje rzeczywistą wartość.
- **`/narzedzia/audyt-widocznosci-ai/`** to osobne pełnoprawne narzędzie z UX flow. **`/pozycjonowanie-ai/audyt-widocznosci-ai/` to landing usługowy** opisujący usługę audytu manualnego ICEA (po automatycznym audycie z narzędzia) – ma sticky CTA "Wypróbuj narzędzie" linkujący do `/narzedzia/audyt-widocznosci-ai/`. Narzędzie nie jest embedowane w landingu (jasna separacja UX: landing = sprzedażowo, narzędzie = utility flow).
- Pillar `/pozycjonowanie-ai/` = pełnoprawny **landing usługowy z treścią pod SEO** (nie tylko hub linków).

### Header navigation

Sticky, transparent → solid on scroll. Mega-menu dla "Pozycjonowanie AI" i "Baza wiedzy", proste linki dla "Narzędzia", "O nas". CTA "Zamów audyt" zawsze widoczne.

### Footer

3 kolumny (Pozycjonowanie AI / Baza wiedzy / Kontakt) + brand row "Marka ICEA" z logo ICEA TM.

### Internal linking strategy (kluczowe dla GEO)

1. **Pillar → children (forward):** każda strona pillar linkuje do swoich dzieci kontekstowo (różne anchory dla różnych dzieci, anti-cannibalization)
2. **Children → pillar (backward):** każda strona usługowa ma w pierwszym akapicie link do pillara
3. **Edu → pillar (cross-linking):** artykuły z `/baza-wiedzy/` linkują do pillara w naturalnych miejscach
4. **Hub modela:** artykuły o ChatGPT wzajemnie się linkują + linkują do pillara `/pozycjonowanie-ai/pozycjonowanie-w-chatgpt/`
5. **Autor → artykuły:** każdy artykuł linkuje do `/autor/[slug]/`, każdy profil listuje jego artykuły

---

## 4. Content model + Schemas

### Astro Content Collections (4 collections)

```
src/content/
├── pillar/                      # /pozycjonowanie-ai/* (komercyjne)
├── articles/                    # /baza-wiedzy/* (edukacyjne)
│   ├── modele-ai/
│   ├── pojecia-ai/
│   └── poradniki/
├── case-studies/                # /pozycjonowanie-ai/case-studies/*
└── authors/                     # 4 autorzy ICEA
```

### Schema – pillar (commercial landing)

```typescript
{
  title, slug, metaTitle, metaDescription,
  primaryKeyword, searchVolume,
  hero: { headline, subheadline, ctaText, ctaHref },
  intent: 'commercial',
  serviceOffer: { name, description, deliverables[], priceFrom?, ctaText, ctaHref },
  relatedArticles: reference('articles')[],
  caseStudies: reference('case-studies')[],
  faq: { question, answer }[],
  schema: { type: 'Service' | 'Product', breadcrumbs },
  publishedAt, updatedAt,
  authors: reference('authors')[],
  draft: boolean
}
```

### Schema – article (educational)

```typescript
{
  title, slug, metaTitle, metaDescription,
  primaryKeyword, secondaryKeywords[],
  category: 'modele-ai' | 'pojecia-ai' | 'poradniki',
  subcategory?: string,
  intent: 'educational' | 'comparison' | 'tutorial',
  hero: { image: image(), alt, caption? },
  infographic?: { image: image(), alt, caption? },    // OPCJONALNY 2-gi obraz – tylko dla pillar i wybranych deep-dive (nie per artykuł)
  tldr: string,                                        // BLUF, 1-2 zdania
  readingTimeMin: number,
  toc: boolean,
  faq: { question, answer }[],
  sources: { title, url, accessed }[],                 // E-E-A-T
  relatedArticles: reference('articles')[],
  relatedPillars: reference('pillar')[],
  schema: { type: 'Article' | 'TechArticle' | 'HowTo', breadcrumbs },
  publishedAt, updatedAt,
  authors: reference('authors')[],
  reviewer?: reference('authors'),                     // peer-review
  draft: boolean
}
```

### Schema – author

```typescript
{
  name, slug, role, company: 'ICEA',
  bio: string,                                         // długa
  shortBio: string,                                    // 1-2 zdania
  expertise: string[],
  photo: image(),
  email?, linkedin?, twitter?, github?,
  iceaProfile: string,                                 // grupa-icea.pl/autor/...
  publishedAt: date
}
```

### Schema – case-study

```typescript
{
  title, slug, client: { name, industry, logo? },
  metaTitle, metaDescription,
  challenge, solution, results: { metric, before, after }[],
  testimonial?: { quote, author, role },
  hero: image(),
  publishedAt, draft
}
```

### Schema.org coverage MVP

- `Organization` (ICEA jako publisher) + `WebSite` (widocznosc.ai)
- `Article` / `TechArticle` per artykuł, `Service` per pillar
- `Person` z `sameAs` (LinkedIn, ICEA profile) per autor
- `BreadcrumbList` na każdej podstronie poza homepage
- `FAQPage` jeśli artykuł ma FAQ
- `HowTo` dla poradników w `/baza-wiedzy/poradniki/`

### Pipeline adapter (markdown → Astro)

Pipeline `pipeline/content-writer/portals/widocznosc-ai/` produkuje markdown. Adapter:

1. Mapuje frontmatter (`title`, `date`, `image`) → Astro schema (`publishedAt`, `hero.image`)
2. Wyciąga `tldr` (BLUF) jako oddzielne pole zamiast first paragraph
3. Konwertuje Hugo shortcodes (`{{< youtube >}}`, `{{< image >}}`) → MDX components
4. Waliduje przeciw Zod schema przed publikacją (fail-fast)

---

## 5. Layout + komponenty kluczowe

### Tryb wizualny

**Dark-first** (Midnight Blue jako tło). Light mode jako P2.

### 5 templates głównych

#### 1. Homepage (`/`)

```
HEADER
HERO (full-bleed, dark, motion subtelne)
  Headline + subheadline + CTA primary + secondary
STATS BAR (proof / authority – ICEA awards)
PILLAR TEASER (3 kolumny – ChatGPT • Claude • Gemini)
TOOL TEASER (mini-form + CTA do /narzedzia/audyt-widocznosci-ai/)
NAJNOWSZE z BAZY WIEDZY (6 kart)
NASZ ZESPÓŁ (4 autorzy z ICEA)
FINAL CTA
FOOTER
```

#### 2. Pillar landing (`/pozycjonowanie-ai/...`)

Hybrid SEO + conversion:

```
Breadcrumb
HERO (krótszy niż homepage, focus na primary keyword)
TLDR / "Najważniejsze w 30 sek" (3-5 bulletów)
SERVICE OFFER CARD (sticky on desktop, "Co dostaniesz")
TREŚĆ SEO (markdown, 2-4k słów, MDX components: <Callout>, <Comparison>, <Stats>, <FAQ>)
CASE STUDIES (jeśli relacja w frontmatterze)
FAQ (z frontmatter + FAQPage schema)
AUTHOR BOX
FINAL CTA + RELATED PILLARS
```

#### 3. Article (`/baza-wiedzy/...`)

Czysty editorial:

```
Breadcrumb
HERO IMAGE (16:9)
H1 + meta (autor avatar, data, reading time)
TWO-COL: TOC sticky | Body
  TLDR (BLUF)
  ARTICLE BODY (MDX)
  INFOGRAPHIC (po 2-gim H2)
  FAQ
  SOURCES (numbered)
  AUTHOR BOX
RELATED ARTICLES (3-4 karty)
CTA SUBTELNE
```

#### 4. Author profile (`/autor/[slug]/`)

```
HERO (foto + bio + sameAs links)
EXPERTISE TAGS
ARTYKUŁY AUTORA (chronologicznie, paginowane)
```

#### 5. Tool (`/narzedzia/audyt-widocznosci-ai/`)

Pełnoekranowy widget – szczegóły w sekcji 7.

### Współdzielone komponenty (Astro)

`<Header>`, `<Footer>`, `<Breadcrumb>`, `<Hero variant>`, `<AuthorBox>`, `<AuthorMeta>`, `<RelatedCards>`, `<FAQ>`, `<TableOfContents>`, `<Callout>`, `<Comparison>`, `<Stats>`, `<Quote>`, `<CTA variant>`, `<ServiceOfferCard sticky>`, `<SchemaJsonLd>`, `<Image>` (wrapper nad astro:assets), `<Infographic>`, `<HeroImage>`, `<MDXProvider>`.

### Typografia (z brand manuala ICEA)

| Element | Font | Wielkość desktop | Line-height | Letter-spacing |
|---|---|---|---|---|
| H1 | Roobert Medium | clamp(2.5rem, 5vw, 4rem) | 110% | -0.01em |
| H2 | Roobert Medium | 2rem | 120% | -0.005em |
| H3 | Roobert Medium | 1.5rem | 125% | 0 |
| H4 | Roobert Medium | 1.25rem | 130% | 0 |
| Lead/Paragraph(M) | Roobert Medium | 1.25rem | 125% | 0 |
| Body | Roobert Regular | 1.125rem (18px) | 150% | 0 |
| Body Small | Roobert Regular | 1rem | 150% | 0 |
| Caption | Roobert Regular | 0.875rem | 150% | 0 |
| Code | JetBrains Mono / IBM Plex Mono | 0.95em | inherit | 0 |

**Roobert font:** sprawdzić licencję webfont (ICEA powinno mieć). Fallback jeśli unavailable: **Manrope** (variable, OFL, geometryczny san-serif najbliższy Roobertowi).

### Paleta CSS (Tailwind config)

```js
colors: {
  // Brand core (z manuala ICEA)
  midnight: '#000623',
  blue: '#5768FF',
  orange: '#F6704C',
  off: '#F9F9F9',
  white: '#FFFFFF',
  // Pochodne UI
  surface: { 1: '#0A1037', 2: '#131C4D' },
  border: 'rgba(249,249,249,0.10)',
  borderStrong: 'rgba(249,249,249,0.18)',
  muted: 'rgba(249,249,249,0.60)',
  subtle: 'rgba(249,249,249,0.40)',
  // Stany
  success: '#1FB99E',
  warning: '#F6A04C',
  error: '#F6704C',
  ring: 'rgba(87,104,255,0.35)',
}
```

---

## 6. Brand identity + logo

### Logo direction (rekomendowany kierunek A)

**Brief:** wordmark "widocznosc.ai" (dwa segmenty: `widocznosc` + `.ai` jako akcent) + symbol-mark geometryczny + tagline "Marka ICEA".

**Kierunek A (wybrany):** Ostre, geometryczne, zgodne z ICEA "ciężki, skonstruowany". Symbol: kwadratowy mark zbudowany z trójkątów, sugeruje "rozkład sygnału AI". Kolor: Off White na Midnight Blue, akcent Blue dla `.ai`.

**Plan wykonania:**

1. Generacja 3-4 wariantów przez kie.ai (gpt-image-2) z promptami opartymi na briefingu
2. Selekcja → 1 finalny kierunek
3. Doszlifowanie ręczne w SVG (inline w Astro)
4. Output deliverables:
   - `logo-mark.svg` (sam mark)
   - `logo-wordmark.svg` (mark + "widocznosc.ai")
   - `logo-full.svg` (mark + "widocznosc.ai" + "marka ICEA")
   - `favicon.svg` + `favicon-32x32.png` + `apple-touch-icon.png`
   - `og-default.jpg` (1200x630, social preview)

### Tone of voice (z brand manuala ICEA)

| Wartość | Implikacja w copy |
|---|---|
| Data-driven | Każde stwierdzenie poparte liczbą/cytatem. Brak sloganów typu "rewolucyjne AI". |
| Pasja dzielenia się wiedzą | Tłumaczymy bez patosu, ujawniamy "jak to robimy". Format: krok po kroku. |
| Pewny partner | Krótkie, konkretne zdania. Bez korpo-żargonu. |
| Autentyczność | Pierwsza osoba (autor "ja/my"), nie pasywne formy. |
| Dynamiczna > wyważona | Active verbs ("Sprawdź", "Dowiedz się"). |
| Innowacyjna > klasyczna | Nazewnictwo świeże ale precyzyjne. |
| Elitarna > masowa | Jakość > ilość, peer-review widoczny, eksperci podpisani. |

### Iconography

**Phosphor Icons** (regular weight) – nowoczesny, geometryczny, OFL. Konsystencja: tylko jedna biblioteka (busmaniak.pl używa Material Symbols – tu Phosphor dla differentation).

### Imagery directives

| Typ | Reguła |
|---|---|
| Hero artykuł | Generated `gpt-image-2`, abstract tech, brand palette, 16:9. **Ludzie dozwoleni** w kontekście (decision maker, biuro, tech setting). |
| Infografika | Generated `gpt-image-2`, brand palette, geometryczna, 1:1. |
| Foto autora | **Realne** zdjęcie z grupa-icea.pl, NIE generated. |
| Logo klientów (case studies) | SVG / PNG 2x. |
| OG / social previews | Static template (Astro page → SSG image) z paletą + tytułem. |

### Motion / animacje

- View Transitions API natywne Astro (smooth nav)
- Hero homepage: subtle gradient mesh animation (CSS only, prefers-reduced-motion respected)
- Form interactions: 200ms transitions, blue focus ring
- Brak parallax, scroll-jacking, auto-play video

---

## 7. AI Visibility Checker (narzędzie MVP)

### User flow (MVP)

```
STEP 1: Form (5 pól) + Cloudflare Turnstile (bot protection)
  • Domena/nazwa marki (required)
  • Branża (select – lista do uzupełnienia)
  • Email (required, lead capture, walidacja format + MX check)
  • Imię (required)
  • Zgoda RODO + link do polityki prywatności (checkbox required)
  • Turnstile widget (invisible, bot protection)
  [Sprawdź widoczność →]

STEP 2: Loading screen (animowany)
  "Sprawdzamy 3 modele AI: ChatGPT, Claude, Perplexity"
  Progress bar + obrotowy status per model
  Per-provider timeout 8s, total 30s; jeśli provider failuje → graceful degradation (wynik częściowy + nota)

STEP 3: Wyniki (renderowane od razu na ekranie)
  • Score widoczności AI: X/100 (na podstawie 3 modeli na MVP)
  • Per-model breakdown (ChatGPT, Claude, Perplexity)
  • Top sources (gdzie cytowany)
  • 3 wnioski / insight
  • CTA: "Chcesz pełen audyt + plan optymalizacji? → ICEA"
  • Auto-email z kopią raportu (lead nurturing)
```

### Decyzja: 3 LLM-y na MVP, 5 jako P2

Codex review zwrócił uwagę, że 5 paralelnych providerów inline w Pages Function ma realne ryzyko timeoutów. Decyzja: **MVP startuje z 3 modelami** (ChatGPT, Claude, Perplexity – kluczowi gracze + Perplexity reprezentuje "search-grounded"). Po walidacji scoring/latency/koszt **dodajemy Gemini i Copilot w P2**. Architektura przygotowana pod 5 providerów (interfejs LLMProvider + plugin per provider).

### Rozstrzygnięcie sprzeczności: "Brak email-gate" vs email required

Email JEST required w kroku 1 (lead capture). Wyniki SĄ widoczne od razu po submit (brak post-submit gate'u – nie blokujemy wyników za drugim formularzem ani magic link). To jest **lead capture pre-results**, nie post-results email-wall. Doprecyzowanie kontra wcześniejszy zapis "brak email-gate".

### Architektura

```
FRONTEND (Astro Island)
  /narzedzia/audyt-widocznosci-ai/
  src/components/AIVisibilityChecker.tsx
  – React island (jedyne miejsce z React)

      ↓ POST

CLOUDFLARE PAGES FUNCTION
  functions/api/audit.ts
  – Turnstile validation (bot protection)
  – Rate-limit: 1/IP/dzień + 5/email/dzień + global budget cap (D1)
  – Walidacja Zod
  – Lead save: D1 + email do mailbox ICEA (Resend)
  – Orchestracja: 3 paralelne queries z timeout 8s per provider, total 30s
  – Graceful degradation: partial results jeśli ≥2 z 3 providerów odpowiedziało

      ↓ parallel

[ChatGPT (OpenAI)] [Claude (Anthropic)] [Perplexity Sonar]
                                                    Gemini, Copilot → P2

      ↓ aggregate

SCORING ENGINE
  – Per-model: extract mentions, sentiment, sources
  – Aggregate score 0-100 (weighted avg)
  – Generate insight strings (LLM-templated)
  – Return JSON
```

### Probing prompt

```
Recommendation task. Without searching the web, list 5 most reputable
{industry} brands in Poland that you would recommend. For each include:
name, what they're known for, source/citation. Then specifically:
what do you know about "{brand}"? If unknown say so.
```

### Mierzymy

- Spontaniczna lista top-5 (best-case signal)
- Wprost zapytanie o brand (baseline)
- Cytowane źródła
- Sentiment

### Stack

| Element | Tech |
|---|---|
| Frontend | Astro Island + React |
| API | CF Pages Functions (TS) – timeout strategy: per-provider 8s, total 30s |
| Storage | CF D1 (leads, rate-limit counters, audit logs) |
| Bot protection | **Cloudflare Turnstile** (invisible widget) |
| LLM clients (MVP) | OpenAI SDK, Anthropic SDK, Perplexity API |
| LLM clients (P2) | + Google Generative AI SDK, Bing/Copilot API |
| Email | Resend (delivery do ICEA mailboxa + user copy raportu) |
| Budget guard | D1 counter z global daily cap → blokada nowych zapytań po przekroczeniu, alert do mailboxa |
| Animacje | CSS + lekkie tweens |

### Lead flow

```
form submit → /api/audit →
  ├─ save lead in D1 (timestamp, IP, brand, industry, email, name, score)
  ├─ trigger 5 LLM queries in parallel
  ├─ aggregate + compute score
  ├─ render results JSON
  ├─ send email to widocznosc lead inbox
  ├─ send email to user (kopia raportu)
  └─ return JSON to frontend
```

### Email capture flow (NIE email-gate)

Email jest **pre-result data capture** (krok 1 formularza). Po submit wyniki widoczne od razu na ekranie – brak drugiego formularza, magic linka czy "wprowadź email aby zobaczyć wyniki". Lead capture trafia do D1 + mailboxa, kopia raportu wysyłana do user'a (Resend).

### Koszty estymacja + budget guard

~$0.03-0.06 per zapytanie (3 LLM calls × ~500 tokens out na MVP). Przy 50 audytach/dzień ≈ $2-3/dzień.

**Wielowarstwowy rate-limit (zacieśniony po Codex review):**
- 1 audit / IP / 24h (D1 counter, klucz: IP + day)
- 5 audytów / email / 24h (D1 counter, klucz: email + day)
- Global daily cap: 200 audytów/dzień → po przekroczeniu narzędzie zwraca "tymczasowo niedostępne" + alert do mailboxa
- Cloudflare Turnstile blokuje boty pre-API
- WAF rule (CF) na podejrzane patterny (rapid sequential requests z różnych IP)

### P2 dla narzędzia

PDF export raportu, dashboard usera, monitoring widoczności w czasie, alerts.

---

## 8. Content pipeline + skill

### Zasada

Reuse framework z `pipeline/content-writer/` (6-stage flow), ale **nowy SKILL specyficzny dla AI/GEO** w `pipeline/content-writer/portals/widocznosc-ai/SKILL.md`.

### Kluczowe różnice vs busmaniak.pl

| Aspekt | busmaniak.pl | widocznosc.ai |
|---|---|---|
| Tematyka | Pojazdy/kampery | AI/LLM/GEO |
| Audience | Hobbyści + nabywcy | Decision-makerzy, e-commerce owners (B2B) |
| Ton | Praktyczny, dostępny | Elitarny ICEA, ekspercki, ale autentyczny |
| Quality bar | "Solidnie", duża skala | "Tip top", mniejsza skala, każdy tekst peer-review |
| Fact-checking | GPT-5.4 + Wikipedia | GPT-5.4 + **Perplexity Sonar** (web-aware) + dokumentacja modeli AI |
| Sources | Wikipedia + producent | Papers (arXiv), oficjalna dokumentacja (OpenAI/Anthropic/Google), benchmarks (LMSys, MMLU) |
| Hero/infografika | nano-banana-2 | **gpt-image-2** (przez kie.ai). Hero per artykuł. **Infografika TYLKO dla pillarów + wybranych deep-dive** (nie per artykuł – Codex review wskazał że to scope creep) |
| Authors | Generic redaction | **Realny autor z 4 z ICEA** + peer-reviewer (drugie nazwisko) |
| Author assignment | Round-robin | Per specjalizacja (matching expertise → topic) |

### 6-stage flow (zaadaptowane)

```
1. KEYWORD RESEARCH (Senuto + DataForSEO + ręczne uzupełnienie)
   → topic cluster z volume + difficulty + intent + SERP analysis
   → output: kw_research.yaml per topic

2. OUTLINE & RESEARCH (Perplexity Sonar + GPT-5.4 deep research)
   → struktura H2/H3, fakty linkowane do źródeł
   → output: outline.md + sources.json (papers, docs, benchmarks)

3. DRAFT (GPT-5.4 dla tekstu eksperckiego, NIE Gemini Flash)
   → mocniejszy model z lepszym reasoning niż dla busmaniak
   → prompt template osadzony w SKILL.md

4. HUMANIZE (Sonnet)
   → ten sam pattern co busmaniak, ale prompt z brand voice ICEA
   → "elitarny, autentyczny", "data-driven", anty-buzzword

5. FACT-CHECK (GPT-5.4 + Perplexity Sonar dual-pass)
   → pass 1: weryfikacja każdego faktu z numerami
   → pass 2: walidacja źródeł, czy nie zdezaktualizowane (np. ChatGPT-4o → 5)
   → flag: jeśli >2 błędy → article goes back to stage 3

6. POST-PROCESSING + AUTHOR ASSIGNMENT + IMAGE-GEN
   → walidacja schema (Zod), brak shortcodes Hugo
   → auto-assignment autora: matching frontmatter.primaryKeyword × author.expertise
     (Czechowski/Wicenciak → SEO; Wiśniewski → AI Search; Ziach → AI/tech-deep)
   → reviewer: drugi autor z complementary specjalizacji (peer-review = E-E-A-T boost)
   → obrazy: hero (gpt-image-2, 16:9) per artykuł; infografika (gpt-image-2, 1:1) TYLKO dla pillar i deep-dive ≥3000 słów
   → vision-validation (GPT-5.4): paleta ICEA + brand consistency
   → output: ready-to-publish .mdx
```

### Stage 0 (przed launch): Topic master plan

Jednorazowy job:
- Research Senuto/DataForSEO dla 8 modeli (ChatGPT, Claude, Gemini, Perplexity, Codex, Claude Code, Copilot) + pojęć (RAG, embeddingi…) + poradników biznesowych
- Output: `pipeline/content-writer/portals/widocznosc-ai/topic-master-plan.yaml` z 40 tematami MVP (8 landingów + 12 modele + 12 pojęcia + 8 poradniki) + 40 tematów P2 odroczonych
- Akceptacja master planu przez User'a + Claude Code zanim ruszy produkcją

### Reuse z istniejących pipeline

| Komponent | Status |
|---|---|
| `pipeline/content-writer/` framework | Reuse |
| `pipeline/fact-checker/` (GPT-5.4 dual-pass) | Reuse + dodanie Perplexity Sonar |
| `pipeline/generate-image.py` (nano-banana-2) | Bez zmian (busmaniak only) |
| `pipeline/youtube-finder/` | Reuse (CMS-agnostic) |
| `pipeline/news-generator/` | Skip na MVP, P2 |
| `pipeline/fb-poster/` | Reuse jeśli zechcemy FB autoposting |

### Nowy skrypt: `generate-images.py`

Lokalizacja: `pipeline/content-writer/portals/widocznosc-ai/generate-images.py`

| Parametr | Wartość |
|---|---|
| Endpoint | `https://api.kie.ai/api/v1/jobs/createTask` |
| Model | `gpt-image-2-text-to-image` |
| Output | Hero (zawsze) + infografika (warunkowo, tylko pillar/deep-dive) |
| Hero | 16:9, 1K, per każdy artykuł |
| Infografika | 1:1, 1K, **tylko** pillar + artykuły ≥3000 słów (typowo deep-dives o modelach AI) |
| Style guard | Brand visual ICEA, geometryczne, abstract tech, ludzie dozwoleni w kontekście |
| Vision validation | GPT-5.4: paleta + brand consistency |

### Brand prompt templates (wbudowane)

```python
HERO_TEMPLATE = """Editorial cover image illustrating {topic}.
Abstract tech composition: geometric shapes, gradient mesh,
deep navy (#000623) base, electric blue (#5768FF) primary,
selective orange (#F6704C) accent, off-white (#F9F9F9) elements.
Premium editorial style, no photorealistic vehicles, no text overlay.
16:9 aspect, 1K resolution."""

INFOGRAPHIC_TEMPLATE = """Educational infographic illustrating {concept}.
Brand colors: deep navy (#000623) background, electric blue (#5768FF)
primary elements, orange (#F6704C) accents, off-white (#F9F9F9)
labels and icons. Minimal geometric layout, icons, arrows, key labels
in clean sans-serif. No clutter, no vehicles.
1:1 square aspect, 1K resolution."""
```

### Quality gates – peer-review

Każdy artykuł przed publikacją musi mieć:

1. ✅ Zod schema validation passed
2. ✅ Fact-checker: 0 błędów krytycznych
3. ✅ Min 4 sources, w tym min 1 z arXiv lub oficjalnej dokumentacji
4. ✅ Min 1 obraz hero (16:9). Infografika (1:1) wymagana tylko dla pillar/deep-dive ≥3000 słów. Vision check passed (paleta + brand consistency)
5. ✅ Author + reviewer w frontmatter
6. ✅ Min 1500 słów dla `/baza-wiedzy/`, min 2500 słów dla `/pozycjonowanie-ai/*`

Pipeline failujący na bramce → artykuł nie publikowany, log w `pipeline/content-writer/logs/`.

### Skill structure (zarys)

```
pipeline/content-writer/portals/widocznosc-ai/
├── SKILL.md                       # główny dokument
├── topic-master-plan.yaml          # 40 tematów MVP + 40 P2
├── prompts/
│   ├── outline-research.md
│   ├── draft-pillar.md
│   ├── draft-article.md
│   ├── humanize-icea-voice.md
│   └── fact-check.md
├── references/
│   ├── icea-brand-voice.md         # wyciąg z brand manuala
│   ├── glossary.md                 # AI/LLM definicje (single-source-of-truth)
│   ├── source-allowlist.md         # arXiv, OpenAI docs, ...
│   └── quality-rules.md
├── scripts/
│   ├── generate-images.py          # gpt-image-2
│   ├── assign-author.py            # author + reviewer matcher
│   ├── validate-schema.py          # Zod-equivalent w Python
│   └── adapter-hugo-to-astro.py    # frontmatter mapper
└── logs/
```

### Autorzy (E-E-A-T)

| Autor | Rola w ICEA | Specjalizacja | URL profilu ICEA | Foto |
|---|---|---|---|---|
| Tomasz Czechowski | Head of SEO | Pozycjonowanie, AI Mode w Google | grupa-icea.pl/autor/tomasz-czechowski/ | wp-content/uploads/2025/05/Tomasz-Czechowski-scaled.jpg |
| Piotr Wicenciak | Team Leader SEO | SEO strategy | grupa-icea.pl/autor/piotr-wicenciak/ | wp-content/uploads/2024/06/piotr-wicenciak.png |
| Mateusz Wiśniewski | SEO Team Leader | SEO, AI Search, query fan-out, AI Overviews | grupa-icea.pl/autor/mateusz-wisniewski/ | wp-content/uploads/2025/02/mwisniewski.jpeg |
| Michał Ziach | CTO | AI/ML, transformacja cyfrowa | grupa-icea.pl/autor/michal-ziach/ | wp-content/uploads/2023/11/michal-ziach.jpg |

LinkedIn URL-e do ustalenia (pobierzemy z grupa-icea.pl lub doprecyzujemy z autorami).

---

## 9. SEO + GEO + Performance + A11y

### SEO setup (od dnia 1)

| Element | Implementacja |
|---|---|
| `<title>`, `<meta description>` | Z frontmatter (Zod required), 50-60 / 150-160 chars enforced |
| Canonical URL | Auto-generated z trasy + opcjonalny override |
| `<meta robots>` | Default `index,follow` |
| Open Graph + Twitter | Auto z frontmatter, OG image SSG-render z templatu (1200x630) |
| `sitemap.xml` | `@astrojs/sitemap` z lastmod, splitting per content type |
| `robots.txt` | Allow all + sitemap link, AI crawlers explicitly allowed |
| Hreflang | Stub na MVP (`pl-PL` only), gotowe na `en` w P2 |
| Schema.org JSON-LD | Per type (lista w sekcji 4) |

### GEO specifics

**llms.txt + llms-full.txt:**
- Auto-generowane z content collections przy build
- Strukturyzowane: top categories → key articles z 1-zdaniowym summary
- llms-full.txt: markdown kluczowych pillarów + top 20 artykułów

**AI crawler accessibility:**
- `robots.txt`: `Allow` dla `GPTBot`, `ClaudeBot`, `Google-Extended`, `PerplexityBot`, `CCBot`, `Bingbot`
- Brak walls / paywalls / cookie walls before content
- Static HTML rendering (Astro SSG) – LLM-y dostają pełen content bez JS

**Passage-level citability:**
- TLDR/BLUF na początku artykułu (1-2 zdania, idealnie cytowalne)
- H2/H3 sformułowane jako pytania ("Co to jest RAG?")
- Definicje na początku każdej sekcji (samodzielne, cytowalne)
- Tabele i listy z konkretnymi liczbami
- FAQ na końcu (FAQPage schema)

**Brand mention signals:**
- Schema `Organization` z `sameAs[]`: LinkedIn ICEA, Twitter, Facebook, GitHub, Wikipedia
- Footer: "marka ICEA" widoczne
- Author bio: każdy → grupa-icea.pl + LinkedIn (sameAs)
- Konsystencja NAP

### Performance targets (CWV)

| Metric | Target | Strategy |
|---|---|---|
| LCP | <1.5s | Astro SSG + CF Pages CDN, hero priority + preload font |
| INP | <100ms | Minimal JS, Islands tylko dla checkera |
| CLS | <0.1 | Image dimensions explicit, font-display swap z fallback metrics |
| TTFB | <200ms | CF Pages edge, brak SSR poza /api/audit |
| Page weight | <300 KB (excl. images) | Tailwind purge, font subsetting (PL only), code-splitting |

Test: Lighthouse 95+ na każdym template.

### Accessibility (WCAG 2.1 AA z dnia 1)

- Kontrasty AA (Off White na Midnight: ratio ~17:1)
- Focus rings widoczne (3px Blue z opacity 0.35)
- Semantic HTML (`<article>`, `<nav>`, `<aside>`, `<main>`, `<header>`, `<footer>`)
- Skip link "Przejdź do treści"
- Alt text wymagany w schemie (Zod fail jeśli brak)
- ARIA labels na formularzach + AI Visibility Checker
- Keyboard navigation pełna
- `prefers-reduced-motion` respected

### Design quality gates (impeccable integration)

Spec używa skill `pbakaus/impeccable` jako systematyczny design QA tooling – uzupełnia ad-hoc inspekcję strukturalnym lintem + LLM critique w 7 domenach (typografia, kolory, kontrast, spacing, animacje, interakcje, responsive, UX writing).

**Workflow per komponent / template:**
1. `/shape <component>` przed budową – walidacja założeń designerskich
2. Build (Claude Code lub Codex)
3. `/critique <component>` po wstępnej implementacji – 27 deterministycznych reguł + LLM critique
4. `/polish <component>` przed merge – finalna obróbka
5. `/audit` na całym template po implementacji (a11y + responsive + typografia)

**CI/CD integration:**
```bash
npx impeccable detect portals/widocznosc.ai/src/ --json
```
Działa bez API key (deterministyczne reguły) → tańsze niż każdorazowe LLM. Dodane jako blocking check w GitHub Actions.

**Instalacja:** globalnie `~/.claude/` (nie wymaga zmian w repo widocznosc.ai).

### Testing strategy

Codex review wskazał, że dotychczas mieliśmy tylko "Lighthouse 95+" – uzupełniamy:

| Warstwa | Narzędzie | Pokrycie |
|---|---|---|
| Unit (Astro components, lib utils) | Vitest | min 70% lib/, schema validators, schema.org generators, BLUF/TLDR extractor |
| Schema fixture tests | Vitest + sample MDX | każdy content type ma test fixture (pillar, article, author, case-study) walidowany przeciw Zod |
| Integration (`/api/audit`) | Vitest + msw | mock LLM providers, test happy path + każdy provider failure scenario, rate-limit, Turnstile |
| E2E (krytyczne flows) | Playwright | homepage, 1 pillar, 1 article, formularz audytu (mock), nawigacja mega-menu, focus management |
| A11y testy | axe-playwright | każdy template (5×) – 0 violations target |
| Pipeline regression | Pytest + sample inputs | content-writer skill: outline → draft → fact-check → schema fail-fast |
| Performance | Lighthouse CI | każdy template, regression vs baseline (LCP, INP, CLS, page weight) |
| Visual regression (P2) | Percy / Chromatic | po launch jeśli design często iteruje |

CI pipeline (GitHub Actions): lint (impeccable detect + ESLint + Prettier) → unit → schema → integration → E2E → Lighthouse → deploy preview.

### Monitoring & alerting

Codex review wskazał, że "GA4/GSC P2" jest niewystarczające jako observability:

| Warstwa | Narzędzie | Co monitorujemy |
|---|---|---|
| Error tracking (frontend + functions) | Sentry (free tier) | JS errors, function exceptions, unhandled rejections |
| Performance (real user) | CF Web Analytics (free) | CWV field data, page views, geo |
| Provider latency dashboard | Custom (D1 + small Astro page `/admin/audit-stats/`, basic auth) | per-provider p50/p95/p99 latency, success rate, timeout rate |
| Budget alerts | D1 trigger + Resend email | alert do mailbox jeśli daily LLM cost > $10 |
| Rate-limit alerts | D1 trigger + Resend | alert jeśli >50 IP rate-limited / dzień (sygnał ataku) |
| Uptime | UptimeRobot (free) | homepage, pillar, narzędzie endpoint co 5 min |
| Search Console | wpięte od dnia 1 (sitemap submission, indexing inspection) | indexation, search analytics |

**GSC submission jest dnia 1** (bo to nie pomiar tylko submission sitemapy + indeksowanie, krytyczne dla launch). GA4 jako pełen tracking podpinamy "później" zgodnie z user instructions (P2). To rozwiązuje sprzeczność z poprzedniego speca.

### Backup & disaster recovery

| Asset | Backup strategy | Retention |
|---|---|---|
| Repo (kod) | Git on GitHub | natywne git history |
| Content collections (markdown) | w git | natywne git history |
| Generated images | w git (`public/images/articles/`) | natywne git history |
| D1 leads + audit logs | **Daily export** via CF Workers Cron → R2 bucket (CSV + JSON) | 90 dni rolling, P2 dłuższa archiwizacja |
| Logi pipeline (`pipeline/content-writer/logs/`) | w git lub Workers Cron → R2 | 30 dni |
| Brand assets (logo SVG, fonts) | w git + dump w `branding guidelines/` | natywne |

DR scenariusz: utrata D1 = utrata leadów. Mitigation: daily R2 export + Resend mailbox (każdy lead generuje email do ICEA mailbox = naturalny secondary store).

### RODO / GDPR compliance

Codex review wskazał, że "tylko checkbox w formularzu" jest niewystarczający:

**Polityka prywatności (`/polityka-prywatnosci/`)** – pełen dokument:
- Tożsamość Administratora Danych (ICEA – pełne dane firmy + kontakt RODO)
- Cel przetwarzania (lead processing, kontakt ws. usług, kopia raportu)
- Podstawa prawna (zgoda + uzasadniony interes)
- Okres retencji (lead: 24 miesiące od ostatniej interakcji)
- Lista odbiorców / sub-processors:
  - Cloudflare (hosting, D1, Pages Functions) – DPA: cloudflare.com/cloudflare-customer-dpa/
  - OpenAI / Anthropic / Perplexity (LLM API) – DPA każdy provider
  - Resend (transactional email) – DPA: resend.com/legal/dpa
- Prawa user'a (dostęp, sprostowanie, usunięcie, eksport, sprzeciw, skarga do PUODO)
- Cookies / tracking (na MVP minimalne: tylko functional + Turnstile, GA4 dopiero po podpięciu)

**Endpoint `/api/data-deletion/` + email** – wniosek o usunięcie danych:
- Form lub email do RODO mailboxa
- SLA odpowiedzi: 30 dni
- Trigger: usunięcie z D1 + powiadomienie do user'a

**Endpoint `/api/data-export/`** – eksport danych (P2):
- User wnioskuje, dostaje JSON ze wszystkimi swoimi danymi z D1

**Cookie banner** – minimalny:
- Functional cookies (tylko niezbędne) → akceptacja domyślna
- GA4 / analytics → dopiero po opt-in (kiedy dorzucimy)

**Consent log** – każdy submit formularza zapisuje do D1: timestamp, IP, hash zgody, treść polityki w wersji X (versioning polityki).

### Security

| Layer | Technique |
|---|---|
| Bot protection | Cloudflare Turnstile (invisible) + WAF managed rules |
| Injection | Zod walidacja przy każdym endpoint, escape przy renderowaniu (Astro/MDX natywnie) |
| Email injection | Sanitizacja header injection (newlines), email format walidacja, MX check |
| CSP | strict CSP w `_headers`: `default-src 'self'; img-src 'self' data: https://api.kie.ai; script-src 'self' 'unsafe-inline' challenges.cloudflare.com; …` (refine podczas implementacji) |
| HSTS | `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` |
| CORS | `/api/*` accepts tylko origin `widocznosc.ai` (+ preview deploys) |
| Secrets | CF Pages env vars (encrypted), nigdy w git, rotacja kwartalna (calendar reminder) |
| Rate-limit | D1-based (sekcja 7) + WAF rate limiting na CF |
| Dependency audit | `npm audit` w CI, Dependabot włączony |
| Logging | brak PII w logach (email/IP zhashowane), audit trail w D1 |

### Content moderation

Codex zauważył brak content moderation dla generowanych draftów i obrazów:

**Drafty AI-generated:**
- Quality gate (sekcja 8): fact-checker dual-pass z 0 błędów krytycznych
- Toxicity check: GPT-5.4 prompt "Czy ten tekst zawiera mowę nienawiści, dyskryminację, fałsze, plagiaty z konkretnych źródeł?" → flag → manual review
- Plagiat: spot-check via simple fingerprinting przeciw `sources[]` (czy sentencja nie jest dokładnym kopiem z URL ze źródeł)
- Manual peer-review (autorka + reviewer ICEA) – ostateczny gate dla każdego artykułu

**Obrazy AI-generated:**
- Vision validation (już w pipeline): GPT-5.4 sprawdza paletę + brand consistency
- Bezpieczeństwo: GPT-5.4 też sprawdza "czy obraz zawiera nieodpowiednie elementy" (NSFW, przemocy, dyskryminacji)
- Ludzie na obrazach (po user feedback dozwoleni) – check że są przedstawiani z szacunkiem, w neutralnych pozach, brak stereotypów

**Lead z formularza audytu:**
- Brand input: blocklist (rezerwujemy listę toxic queries: nazwy konkurencji ICEA, oczywiste joke inputs)
- Email format walidacja
- Industry: tylko z dropdown (closed list)

---

## 10. MVP scope + roadmap

### MVP (dzień 1 launch) – zacieśnione po Codex review

- ✅ Astro setup + Cloudflare Pages deploy + `pnpm-workspace.yaml` w monorepo
- ✅ **Logo + brand tokens we wczesnej fazie** (Faza 2, nie Faza 6 jak wcześniej): finalny SVG logo, paleta CSS, OG image template – potrzebne dla image-gen QA
- ✅ Layout system: 5 templates (homepage, pillar, article, author, tool) + komponenty
- ✅ Content collections (pillar, articles, case-studies, authors) z Zod schema
- ✅ Pipeline content writing skill (`pipeline/content-writer/portals/widocznosc-ai/SKILL.md`)
- ✅ Image generation (`generate-images.py` z gpt-image-2): hero per artykuł, infografika TYLKO dla pillar i deep-dive
- ✅ AI Visibility Checker: Astro Island + CF Pages Function + **3 LLM-y MVP** (ChatGPT, Claude, Perplexity) + Turnstile + D1 + Resend + RODO compliance
- ✅ **~40 artykułów MVP** (zacieśnione z 80):
  - 8 landingów `/pozycjonowanie-ai/*` (komercyjne, wszystkie kluczowe frazy)
  - 12 artykułów `/baza-wiedzy/modele-ai/` (każdy z 8 modeli + 4 porównania)
  - 12 artykułów `/baza-wiedzy/pojecia-ai/` (12 najważniejszych pojęć)
  - 8 poradników `/baza-wiedzy/poradniki/`
- ✅ 4 profile autorów + 1-2 case studies (jeśli ICEA ma gotowe)
- ✅ SEO + Schema.org + llms.txt + sitemap + robots + **GSC submission od dnia 1** (sitemap + indexing inspection)
- ✅ Performance: CWV target met
- ✅ Accessibility: WCAG 2.1 AA + impeccable design QA gates
- ✅ Testing: unit + schema fixtures + integration (`/api/audit`) + E2E (Playwright) + a11y (axe) + Lighthouse CI
- ✅ Monitoring: Sentry + CF Web Analytics + provider latency dashboard + budget alerts + UptimeRobot
- ✅ Security: Turnstile + WAF + CSP + HSTS + Dependabot + secrets w env vars
- ✅ RODO/GDPR: pełna polityka prywatności, consent log, endpoint usuwania danych, lista DPA sub-processors
- ✅ Backup/DR: daily D1 → R2 export, Resend mailbox jako secondary store

### Explicit NOT in MVP (P2)

- ❌ Newsletter (form sign-up + integracja)
- ❌ GA4 pełny tracking (GSC submission JEST w MVP – to nie pomiar, tylko submission. GA4 jako pomiar dorzucamy po launch)
- ❌ Light mode toggle (dark-only na MVP)
- ❌ EN locale (architektura ready, content nie)
- ❌ News feed (`/baza-wiedzy/aktualnosci/`)
- ❌ FB autoposting
- ❌ PDF export raportu z AI Visibility Checker
- ❌ User dashboard / monitoring widoczności w czasie
- ❌ Drugie / kolejne narzędzia
- ❌ ICEA case studies w pełnej skali (zaczynamy od 1-2)
- ❌ **Gemini + Copilot** w narzędziu (P2 po walidacji 3 providerów MVP)
- ❌ **Drugi batch artykułów** (40 → docelowe 80) – po launch jako sustained content cadence
- ❌ Cloudflare Workers + Queues (jeśli p95 latency > 25s lub potrzebne retry/backoff)
- ❌ Endpoint `/api/data-export/` (wniosek o eksport danych RODO)
- ❌ Visual regression (Percy/Chromatic)

### Implementation roadmap (rev po Codex review)

| Faza | Estymacja | Dostarczone |
|---|---|---|
| Faza 1: Foundation | 1 tydz. | Monorepo workspace, Astro setup, CF Pages deploy + Turnstile + D1, brand tokens (paleta + Roobert/Manrope decyzja), layout shell, 1-2 templates działają, impeccable installed + CI |
| Faza 2: Content infra + brand | 1 tydz. | **Logo finalny SVG** + favicon set + OG template, content collections + Zod, wszystkie 5 templates, MDX components, schema injection, llms.txt, sitemap, RODO foundation (polityka prywatności, consent log) |
| Faza 3: Pipeline + skill | 1-2 tydz. | Content skill SKILL.md, topic master plan (40 tematów MVP) zaakceptowany, pipeline integracja, generate-images.py z gpt-image-2, fact-checker dual-pass + Sonar, content moderation guards, testing scaffolding |
| Faza 4: Content production | 2-3 tydz. | ~40 artykułów wyprodukowanych, peer-review, autorzy assignment, hero + warunkowo infografiki |
| Faza 4b (równolegle z 4): AI Visibility Checker | 1-2 tydz. | Form + Turnstile + RODO consent, API z 3 LLM clients, scoring engine, lead capture + Resend, budget guard + alerts, monitoring dashboard `/admin/audit-stats/` |
| Faza 5: Launch hardening | 0.5 tydz. | Security audit (CSP, HSTS, CORS, secrets rotation), accessibility audit (axe + impeccable /audit), Lighthouse 95+, monitoring/alerting wired, backup R2 export działa |
| Faza 6: Launch | 0.5 tydz. | Domain wiring, GSC submission, Bing/IndexNow, llms.txt visible, social media announcement |

**Total MVP zacieśnione:** ~6-8 tygodni real-time (vs 7-10 wcześniej, dzięki redukcji 80→40 artykułów + 5→3 LLM-y w narzędziu).

**Krytyczna ścieżka:** Foundation → Content infra + brand (logo wcześniej) → Pipeline → Content production → Launch hardening → Launch.

**Faza 4b (narzędzie) idzie równolegle z Fazą 4 (content production)** – to były 2 osobne fazy w v1, teraz scalone temporally bo nie blokują się. Wymaga to early decyzji o env/provider keys (po Fazie 1).

---

## 11. Otwarte pytania (do rozstrzygnięcia w writing-plans / w trakcie)

1. **Roobert font webfont license** – czy ICEA ma, czy używamy Manrope jako fallback od dnia 1?
2. **LinkedIn URLs autorów** – do uzupełnienia (manual lub scrape z grupa-icea.pl)
3. **ICEA case studies** – czy są gotowe materiały do wrzucenia (klient, wyniki), czy startujemy od zera i case studies dorzucamy w P2?
4. **Email mailbox dla leadów** – konkretna skrzynka ICEA: jaka? (np. `widocznosc@grupa-icea.pl`, osobna `kontakt-rodo@…` dla wniosków RODO)
5. **Resend vs SendGrid** dla transactional email – preferencja ICEA? (DPA, deliverability PL)
6. **Cloudflare account** – ten sam co dla busmaniak.pl (account-level limits), czy osobny dla widocznosc.ai?
7. **Branża dropdown w narzędziu** – konkretna lista (e-commerce, B2B SaaS, lokalne usługi, finanse, healthcare, edukacja, …)?
8. **Topic master plan** – akceptacja przed produkcją (osobny review checkpoint, koniec Fazy 3) – 40 tematów na MVP
9. **Rate-limit narzędzia** – zacieśniony do 1/IP/dzień + 5/email/dzień + global cap 200/dzień. Walidacja kosztów po pierwszym tygodniu działania.
10. **Pełna lista DPA sub-processors** – do uzupełnienia w polityce prywatności (CF, OpenAI, Anthropic, Perplexity, Resend, Sentry, kie.ai)
11. **Tożsamość Administratora Danych** – pełne dane firmy ICEA (nazwa prawna, adres, NIP, kontakt RODO, kontakt z IODO jeśli wyznaczony)
12. **Cookies / Turnstile** – czy Turnstile wymaga consent w Polsce? (do weryfikacji prawnej, zwykle traktowany jako "strictly necessary")
13. **Rotacja secretów** – kto ją robi (osoba/proces), kalendarz przypomnień
14. **Admin endpoint `/admin/audit-stats/`** – Basic Auth czy CF Access? Kto ma dostęp (kto z ICEA)?
15. **Content moderation review** – kto z ICEA ostatecznie aprobuje artykuły jako reviewer (peer-review w pipeline)?
16. **Resolution path jeśli p95 latency > 25s** – Workers + Queues, czy reduce providers?
17. **Co robimy jeśli budget cap przekroczony** – komunikat "tymczasowo niedostępne", czy kolejka requestów?
18. **CSP refinement** – konkretne `connect-src` dla LLM API (kie.ai, OpenAI, Anthropic, Perplexity), Resend, Sentry, Turnstile

Te pytania nie blokują startu writing-plans – mogą być rozstrzygane w trakcie wdrożenia (większość trafia do Fazy 1-2 jako pierwsze kroki dyskutowane z User'em).

---

## Metadane

- **Punkt wyjścia:** rozmowa brainstorm 2026-05-06 w sesji Claude Code
- **Stack referencyjny:** busmaniak.pl (Hugo) jako pipeline framework, ICEA Brand Manual 2025 jako guideline wizualny
- **Następny krok:** writing-plans (skill `superpowers:writing-plans`) → szczegółowy plan implementacji z review checkpointami

### Notatka dla writing-plans (rev po Codex review)

Scope MVP zacieśniony do ~6-8 tygodni. Writing-plans powinno podzielić go na kilka mniejszych planów wykonawczych z osobnymi review checkpointami:

- **Plan 1: Foundation + brand + content infra** (Fazy 1-2): monorepo workspace, Astro setup, CF Pages + Turnstile + D1, **logo finalny SVG**, brand tokens (paleta + Roobert/Manrope decyzja), OG template, content collections + Zod, 5 templates, MDX components, llms.txt, sitemap, RODO foundation (polityka prywatności), impeccable installed + CI
- **Plan 2: Pipeline + skill + topic master plan** (Faza 3): content skill SKILL.md, integracja pipeline, generate-images.py z gpt-image-2 (hero zawsze, infografika tylko pillar), fact-checker dual-pass + Sonar, content moderation guards, testing scaffolding, **40-tematowy master plan zaakceptowany**
- **Plan 3: Content production** (Faza 4): ~40 artykułów MVP + peer-review + author assignment + image-gen
- **Plan 4: AI Visibility Checker** (Faza 4b, równolegle z Plan 3): form + Turnstile + RODO consent, API z 3 LLM clients (ChatGPT/Claude/Perplexity), scoring engine, lead capture + Resend, budget guard + alerts, monitoring `/admin/audit-stats/`
- **Plan 5: Launch hardening + launch** (Fazy 5-6): security audit (CSP/HSTS/CORS), accessibility audit (axe + impeccable /audit), Lighthouse CI, monitoring/alerting wired, backup R2 export, GSC submission, IndexNow, announcement

**Zależności:**
- Plan 1 musi się zakończyć przed Plan 2 (pipeline potrzebuje brand tokens + paletę dla image-gen)
- Plan 2 musi się zakończyć przed Plan 3 (content production potrzebuje skill + topic master plan)
- Plan 4 (narzędzie) startuje równolegle z Plan 3, ale wymaga env/provider keys ustalonych w Plan 1
- Plan 5 wymaga zakończenia 3 i 4

**Review checkpointy między planami:**
- Po Plan 1: User reviewuje brand tokens + logo + 1-2 templates działające
- Po Plan 2: User akceptuje 40-tematowy master plan + ~3 sample artykułów wygenerowanych przez nowy skill
- Po Plan 3: User reviewuje pełen batch 40 artykułów (peer-review)
- Po Plan 4: User testuje narzędzie end-to-end z 3 testowymi brandami
- Po Plan 5: Pre-launch checklist (security, a11y, performance, monitoring działają)

### Codex review – addressed items

| Codex feedback | Status | Gdzie |
|---|---|---|
| Workers + Queues alternatywa | Rozważone, MVP zostaje przy Pages Functions, Q+W jako P2 | Sekcja 2 alternatywy |
| Rate-limit zacieśnienie | 1/IP/dzień + 5/email/dzień + global cap | Sekcja 7 koszty + budget guard |
| Roobert font – fallback decision | Otwarte pytanie #1 (resolved early w Plan 1) | Sekcja 11 |
| Scope creep MVP | Zacieśniono 80→40 artykułów, infografiki tylko pillar, 3 LLM-y zamiast 5 | Sekcja 10 MVP |
| Testing strategy | Dodana sekcja: unit, schema fixtures, integration, E2E, a11y, pipeline regression, Lighthouse CI | Sekcja 9 testing |
| Monitoring/alerting | Dodane: Sentry, CF Analytics, provider latency dashboard, budget alerts, UptimeRobot | Sekcja 9 monitoring |
| Backup/DR | Dodane: daily D1 → R2, Resend mailbox secondary | Sekcja 9 backup |
| RODO/GDPR | Pełna polityka, consent log, endpoint usuwania, lista DPA, sub-processors | Sekcja 9 RODO |
| Security | CSP, HSTS, Turnstile, CORS, secrets rotation, deps audit | Sekcja 9 security |
| Content moderation | Toxicity check, plagiat spot-check, manual peer-review, vision NSFW | Sekcja 9 content moderation |
| Sprzeczność embed widget vs link | Rozstrzygnięta: landing linkuje, NIE embeduje | Sekcja 3 |
| Sprzeczność "brak email-gate" | Doprecyzowana: pre-result data capture, NIE post-result gate | Sekcja 7 |
| Sprzeczność GSC P2 vs Launch | Rozstrzygnięta: GSC submission od dnia 1, GA4 P2 | Sekcja 9 monitoring + 10 P2 |
| 7 faz vs 5 planów mapping | Skonsolidowane: 6 faz + 5 planów z zależnościami | Sekcja 10 + notatka writing-plans |
| Logo zaplanowane późno | Logo przeniesione do Fazy 2 (z 6) | Sekcja 10 roadmap |
| Checker po content production | Zmienione: równolegle z content production (Faza 4b) | Sekcja 10 roadmap |

### Impeccable integration – addressed items

| Aspekt | Status | Gdzie |
|---|---|---|
| Skill jako design QA tooling | Dodane: workflow shape/critique/polish per komponent | Sekcja 9 design quality gates |
| CLI w CI/CD | Dodane: `npx impeccable detect` jako blocking check | Sekcja 9 design quality gates |
| Instalacja | Globalnie `~/.claude/`, brak zmian w repo | Sekcja 9 design quality gates |
