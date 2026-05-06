# widocznosc.ai – Design Spec

**Data:** 2026-05-06
**Autor:** Mateusz Wiśniewski (ICEA) + Claude Code
**Status:** zaakceptowany przez User'a, gotowy do writing-plans
**Domena:** widocznosc.ai (zarejestrowana)
**Repo:** monorepo `transformacja-zaplecza-seo`, projekt w `portals/widocznosc.ai/`

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

| Opcja | Powód odrzucenia |
|---|---|
| Next.js 15 (App Router) | Overkill dla portalu contentowego, gorszy SEO performance, lock-in na React |
| Hugo (jak busmaniak.pl) | User explicitly wybrał Astro + narzędzie audytu wymaga server endpointów |
| Astro + Vercel | CF Pages = brak limitu transferu, ICEA już ma CF account, spójność z busmaniak.pl |

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
/pozycjonowanie-ai/audyt-widocznosci-ai/          Landing + osadzenie narzędzia
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
- **`/narzedzia/audyt-widocznosci-ai/`** to osobne pełnoprawne narzędzie z UX flow, oddzielne od `/pozycjonowanie-ai/audyt-widocznosci-ai/` (sales landing usługi audytu manualnego ICEA).
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
  infographic: { image: image(), alt, caption? },     // 2-gi obraz, brand visual
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

### User flow

```
STEP 1: Form (5 pól)
  • Domena/nazwa marki (required)
  • Branża (select)
  • Email (required, lead capture)
  • Imię (required)
  • Zgoda RODO (checkbox)
  [Sprawdź widoczność →]

STEP 2: Loading screen (animowany)
  "Sprawdzamy 5 modeli AI: ChatGPT, Claude, Gemini, Perplexity, Copilot"
  Progress bar + obrotowy status per model

STEP 3: Wyniki
  • Score widoczności AI: X/100
  • Per-model breakdown (ChatGPT, Claude, Gemini, Perplexity, Copilot)
  • Top sources (gdzie cytowany)
  • 3 wnioski / insight
  • CTA: "Chcesz pełen audyt + plan optymalizacji? → ICEA"
  • Auto-email z kopią raportu
```

### Architektura

```
FRONTEND (Astro Island)
  /narzedzia/audyt-widocznosci-ai/
  src/components/AIVisibilityChecker.tsx
  – React island (jedyne miejsce z React)

      ↓ POST

CLOUDFLARE PAGES FUNCTION
  functions/api/audit.ts
  – Rate-limit: 1/IP/15min (D1)
  – Walidacja Zod
  – Lead save: D1 + email do mailbox ICEA (Resend)
  – Orchestracja: 5 paralelnych queries

      ↓ parallel

[ChatGPT (OpenAI)] [Claude (Anthropic)] [Gemini (Google)] [Perplexity Sonar] [Copilot (Bing)]

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
| API | CF Pages Functions (TS) |
| Storage | CF D1 |
| LLM clients | OpenAI SDK, Anthropic SDK, Google Generative AI SDK, Perplexity API, Bing API |
| Email | Resend (delivery do ICEA mailboxa) |
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

### Brak email-gate

Wyniki na ekranie od razu, email służy do lead capture + kopii raportu, nie blokuje wyników.

### Koszty estymacja

~$0.05-0.10 per zapytanie (5 LLM calls × ~500 tokens out). Rate-limit 1/IP/15min, 100 audytów/dzień ≈ $10/dzień.

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
| Hero/infografika | nano-banana-2 | **gpt-image-2** (przez kie.ai), 2 obrazy per artykuł (hero + infografika) |
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
   → 2 obrazy per artykuł: hero (gpt-image-2, 16:9) + infografika (gpt-image-2, 1:1)
   → vision-validation (GPT-5.4): paleta ICEA + brand consistency
   → output: ready-to-publish .mdx
```

### Stage 0 (przed launch): Topic master plan

Jednorazowy job:
- Research Senuto/DataForSEO dla 8 modeli (ChatGPT, Claude, Gemini, Perplexity, Codex, Claude Code, Copilot) + 30+ pojęć (RAG, embeddingi…) + 10+ poradników biznesowych
- Output: `pipeline/content-writer/portals/widocznosc-ai/topic-master-plan.yaml` z 80 tematami
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
| Output | 2 obrazy: hero + infografika |
| Hero | 16:9, 1K |
| Infografika | 1:1, 1K |
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
4. ✅ Min 2 obrazy (hero 16:9 + infografika 1:1), vision check passed (paleta + brand consistency)
5. ✅ Author + reviewer w frontmatter
6. ✅ Min 1500 słów dla `/baza-wiedzy/`, min 2500 słów dla `/pozycjonowanie-ai/*`

Pipeline failujący na bramce → artykuł nie publikowany, log w `pipeline/content-writer/logs/`.

### Skill structure (zarys)

```
pipeline/content-writer/portals/widocznosc-ai/
├── SKILL.md                       # główny dokument
├── topic-master-plan.yaml          # 80 tematów planned
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

---

## 10. MVP scope + roadmap

### MVP (dzień 1 launch)

- ✅ Astro setup + Cloudflare Pages deploy + `pnpm-workspace.yaml` w monorepo
- ✅ Brand identity: logo (kierunek A wykonany przez gpt-image-2 + dopracowanie SVG)
- ✅ Layout system: 5 templates (homepage, pillar, article, author, tool) + komponenty
- ✅ Content collections (pillar, articles, case-studies, authors) z Zod schema
- ✅ Pipeline content writing skill (`pipeline/content-writer/portals/widocznosc-ai/SKILL.md`)
- ✅ Image generation (`generate-images.py` z gpt-image-2, hero + infografika)
- ✅ AI Visibility Checker (Astro Island + CF Pages Function + 5 LLM-ów + D1)
- ✅ ~80 artykułów: 8 landingów `/pozycjonowanie-ai/*`, 30 modele AI, 25 pojęcia AI, 15 poradniki
- ✅ 4 profile autorów + 1-2 case studies (jeśli ICEA ma gotowe)
- ✅ SEO + Schema.org + llms.txt + sitemap + robots
- ✅ Performance: CWV target met
- ✅ Accessibility: WCAG 2.1 AA

### Explicit NOT in MVP (P2)

- ❌ Newsletter (form sign-up + integracja)
- ❌ GA4 + Search Console wiring (podpinamy "później" po launch)
- ❌ Light mode toggle (dark-only na MVP)
- ❌ EN locale (architektura ready, content nie)
- ❌ News feed (`/baza-wiedzy/aktualnosci/`)
- ❌ FB autoposting
- ❌ PDF export raportu z AI Visibility Checker
- ❌ User dashboard / monitoring widoczności w czasie
- ❌ Drugie / kolejne narzędzia
- ❌ ICEA case studies w pełnej skali (zaczynamy od 1-2)

### Implementation roadmap

| Faza | Estymacja | Dostarczone |
|---|---|---|
| Faza 1: Foundation | 1 tydz. | Monorepo workspace, Astro setup, CF Pages deploy, brand tokens, layout shell, 1-2 templates działają |
| Faza 2: Content infrastructure | 1 tydz. | Content collections + Zod, wszystkie 5 templates, MDX components, schema injection, llms.txt, sitemap |
| Faza 3: Pipeline + skill | 1-2 tydz. | Content skill SKILL.md, topic master plan zaakceptowany, pipeline integracja, image-gen z gpt-image-2, fact-checker dual-pass + Sonar |
| Faza 4: Content production | 2-3 tydz. | ~80 artykułów wyprodukowanych, peer-review, autorzy assignment, hero + infografiki |
| Faza 5: AI Visibility Checker | 1-2 tydz. | Form, API, 5 LLM clients, scoring, lead capture, email flow |
| Faza 6: Logo + polish | 0.5 tydz. | Final logo SVG, OG image template, favicon set, accessibility audit |
| Faza 7: Launch | 0.5 tydz. | Domain wiring, GSC submission, Bing/IndexNow, social media announcement |

**Total MVP:** ~7-10 tygodni real-time. Krytyczna ścieżka: Foundation → Content infrastructure → Pipeline → Content production → Launch. Niektóre fazy mogą iść równolegle (Foundation || Brand identity work, Content infrastructure || Pipeline).

---

## 11. Otwarte pytania (do rozstrzygnięcia w writing-plans / w trakcie)

1. **Roobert font webfont license** – czy ICEA ma, czy używamy Manrope jako fallback od dnia 1?
2. **LinkedIn URLs autorów** – do uzupełnienia (manual lub scrape z grupa-icea.pl)
3. **ICEA case studies** – czy są gotowe materiały do wrzucenia (klient, wyniki), czy startujemy od zera i case studies dorzucamy w P2?
4. **Email mailbox dla leadów** – konkretna skrzynka ICEA: jaka? (np. `widocznosc@grupa-icea.pl`)
5. **Resend vs SendGrid** dla transactional email – preferencja ICEA?
6. **Cloudflare account** – ten sam co dla busmaniak.pl, czy osobny?
7. **Branża dropdown w narzędziu** – konkretna lista (e-commerce, B2B SaaS, lokalne usługi, finanse, healthcare, edukacja, …)?
8. **Topic master plan** – akceptacja przed produkcją (osobny review checkpoint, prawdopodobnie Faza 3 koniec)
9. **Rate-limit narzędzia** – 1/IP/15min OK, czy bardziej restrykcyjnie (1/IP/dzień)? Wpływ na koszty.

Te pytania nie blokują startu writing-plans – mogą być rozstrzygane w trakcie wdrożenia.

---

## Metadane

- **Punkt wyjścia:** rozmowa brainstorm 2026-05-06 w sesji Claude Code
- **Stack referencyjny:** busmaniak.pl (Hugo) jako pipeline framework, ICEA Brand Manual 2025 jako guideline wizualny
- **Następny krok:** writing-plans (skill `superpowers:writing-plans`) → szczegółowy plan implementacji z review checkpointami

### Notatka dla writing-plans

Scope MVP jest duży (~7-10 tygodni). Writing-plans może / powinno podzielić go na kilka mniejszych planów wykonawczych z osobnymi review checkpointami, np.:

- **Plan 1: Foundation + content infrastructure** (Fazy 1-2): monorepo workspace, Astro setup, CF Pages deploy, brand tokens, content collections, 5 templates, MDX components
- **Plan 2: Pipeline + skill + topic master plan** (Faza 3): content skill SKILL.md, integracja pipeline, generate-images.py z gpt-image-2, fact-checker dual-pass + Sonar, master plan 80 tematów
- **Plan 3: Content production** (Faza 4): ~80 artykułów + peer-review + author assignment + image-gen
- **Plan 4: AI Visibility Checker** (Faza 5): form, API, 5 LLM clients, scoring, lead capture
- **Plan 5: Logo + brand polish + launch** (Fazy 6-7): logo SVG, OG template, favicon, GSC submission, IndexNow, announcement

Plany 1, 2, 4 mogą iść częściowo równolegle (różne obszary).
