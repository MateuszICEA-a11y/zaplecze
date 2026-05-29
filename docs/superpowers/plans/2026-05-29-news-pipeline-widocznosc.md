# News Pipeline dla widocznosc.ai – Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Codzienny automatyczny pipeline, który pobiera newsy z branżowych RSS EN, pisze polski wpis (streszczenie + komentarz ICEA), generuje hero w stylu portalu i publikuje w nowej sekcji `/news/` na widocznosc.ai.

**Architecture:** Dwie warstwy. (1) Front Astro: nowa kolekcja `news` + routing `/news/` i `/news/[slug]` + schema `NewsArticle` + box CTA. (2) Pipeline Python: klon `pipeline/news-generator/` (BusManiak) do `pipeline/news-generator-widocznosc/`, dostosowany do źródeł EN, tonu i frontmatteru Astro. Spina je GitHub Action (cron → uruchom pipeline → commit/push → rebuild Cloudflare).

**Tech Stack:** Astro 6 + content collections (zod) + Cloudflare Pages; Python 3.12 (feedparser, openai, PyYAML, Pillow); kie.ai `gpt-image-2`; OpenAI `gpt-5.4`; DataForSEO (trendy); GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-05-29-news-pipeline-widocznosc-design.md`

---

## File Structure

**Front (Astro) – tworzone/modyfikowane:**
- Modify `portals/widocznosc.ai/src/content.config.ts` – dodać kolekcję `news`
- Create `portals/widocznosc.ai/src/content/news/.gitkeep` – katalog kolekcji
- Create `portals/widocznosc.ai/src/components/NewsCTA.astro` – box CTA
- Modify `portals/widocznosc.ai/src/lib/schema.ts` – dodać `newsArticleNode` + `newsListingNode`
- Create `portals/widocznosc.ai/src/pages/news/index.astro` – listing chronologiczny
- Create `portals/widocznosc.ai/src/pages/news/[slug].astro` – pojedynczy news
- Modify `portals/widocznosc.ai/src/components/Navbar.astro` – News w dropdownie „Baza wiedzy"
- Create `portals/widocznosc.ai/src/content/news/2026-05-29-przyklad.md` – przykładowy wpis (do testu, usuwany na końcu fazy)

**Pipeline (Python) – klon + zmiany w `pipeline/news-generator-widocznosc/`:**
- `feeds.yaml`, `config.yaml`, `published.json`, `requirements.txt` – nowe wartości
- `collector.py`, `scorer.py` – kopie bez zmian logiki
- `generator.py` – nowy prompt (EN→PL + komentarz ICEA) + parse do frontmatteru Astro
- `image_generator.py` – HERO_STYLE widocznosc, bez vehicle-detection, zapis do assets
- `postprocessor.py` – frontmatter Astro (nie Hugo)
- `main.py` – ścieżki Astro, bez clusters/buses.json
- `tests/` – testy slug, frontmatter Astro, atrybucji

**Automatyzacja:**
- Create `.github/workflows/widocznosc-news.yml`

---

## FAZA A — Front Astro (fundament, testowalny przez `astro build`)

### Task A1: Kolekcja `news` w content.config.ts

**Files:**
- Modify: `portals/widocznosc.ai/src/content.config.ts`
- Create: `portals/widocznosc.ai/src/content/news/.gitkeep`

- [ ] **Step 1: Dodaj definicję kolekcji `news`**

W `content.config.ts`, po definicji `const blog = defineCollection({...})` a przed `export const collections`, dodaj:

```ts
const news = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/news' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      lead: z.string(),
      date: z.date(),
      image: image(),
      sourceName: z.string(),
      sourceUrl: z.string().url(),
      tags: z.array(z.string()).default([]),
      author: z.string().default('Redakcja widocznosc.ai'),
    }),
});
```

- [ ] **Step 2: Zarejestruj kolekcję w eksporcie**

Zmień linię:
```ts
export const collections = { blog, authors };
```
na:
```ts
export const collections = { blog, authors, news };
```

- [ ] **Step 3: Utwórz katalog kolekcji**

```bash
mkdir -p portals/widocznosc.ai/src/content/news
touch portals/widocznosc.ai/src/content/news/.gitkeep
```

- [ ] **Step 4: Commit**

```bash
git add portals/widocznosc.ai/src/content.config.ts portals/widocznosc.ai/src/content/news/.gitkeep
git commit -m "feat(widocznosc): kolekcja news w content.config"
```

---

### Task A2: Przykładowy wpis news (fixture do testów build)

**Files:**
- Create: `portals/widocznosc.ai/src/content/news/2026-05-29-przyklad.md`

- [ ] **Step 1: Utwórz przykładowy wpis**

Potrzebny obraz: użyj istniejącego hero jako tymczasowego. Sprawdź dostępny:
```bash
ls portals/widocznosc.ai/src/assets/images/blog-geo-przewodnik.webp
```

Utwórz plik `2026-05-29-przyklad.md`:
```markdown
---
title: 'Przykładowy news testowy'
lead: 'Krótki lead opisujący wydarzenie w jednym–dwóch zdaniach.'
date: 2026-05-29
image: ../../assets/images/blog-geo-przewodnik.webp
sourceName: 'Search Engine Land'
sourceUrl: 'https://searchengineland.com/'
tags: ['AI Search', 'Test']
---

## Co się wydarzyło

Treść streszczenia wydarzenia w kilku zdaniach.

## Co to oznacza dla widoczności w AI

Komentarz ekspercki ICEA – interpretacja i wnioski dla marek.
```

> Uwaga ścieżki: z `src/content/news/` do `src/assets/images/` to `../../assets/images/`.

- [ ] **Step 2: Commit**

```bash
git add portals/widocznosc.ai/src/content/news/2026-05-29-przyklad.md
git commit -m "test(widocznosc): przykladowy wpis news (fixture)"
```

---

### Task A3: `newsArticleNode` + `newsListingNode` w schema.ts

**Files:**
- Modify: `portals/widocznosc.ai/src/lib/schema.ts`

- [ ] **Step 1: Dodaj fabryki węzłów**

Na końcu `schema.ts`, przed `buildGraph` (które jest na końcu pliku), dodaj:

```ts
export type NewsArticleInput = {
  slug: string;
  title: string;
  lead: string;
  imageUrl: string;
  datePublished: string;
  sourceName: string;
  sourceUrl: string;
  tags: string[];
  author: string;
};

/** NewsArticle – wpis sekcji News. Autor zbiorczy (Redakcja). */
export const newsArticleNode = (input: NewsArticleInput) => {
  const url = `${SITE_URL}/news/${input.slug}/`;
  return {
    '@type': 'NewsArticle',
    '@id': `${url}#article`,
    headline: input.title,
    description: input.lead,
    url,
    image: input.imageUrl,
    datePublished: input.datePublished,
    inLanguage: 'pl-PL',
    author: { '@type': 'Organization', name: input.author, '@id': ORG_ID },
    publisher: { '@id': ORG_ID },
    isPartOf: { '@id': WEBSITE_ID },
    keywords: input.tags.join(', '),
    isBasedOn: input.sourceUrl,
    citation: { '@type': 'CreativeWork', name: input.sourceName, url: input.sourceUrl },
  };
};

export type NewsListItem = { slug: string; title: string; datePublished: string };

/** CollectionPage + ItemList dla /news/ (listing chronologiczny). */
export const newsListingNode = (items: NewsListItem[]) => {
  const url = `${SITE_URL}/news/`;
  return {
    '@type': 'CollectionPage',
    '@id': `${url}#collection`,
    url,
    name: 'News – widoczność marek w AI',
    isPartOf: { '@id': WEBSITE_ID },
    inLanguage: 'pl-PL',
    hasPart: {
      '@type': 'ItemList',
      numberOfItems: items.length,
      itemListOrder: 'https://schema.org/ItemListOrderDescending',
      itemListElement: items.map((it, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'NewsArticle',
          '@id': `${SITE_URL}/news/${it.slug}/#article`,
          headline: it.title,
          datePublished: it.datePublished,
        },
      })),
    },
  };
};
```

> Wzorzec `item` bez `url` na poziomie `ListItem` (świadomie – por. wcześniejszy fix konfliktu `url`+`item`).

- [ ] **Step 2: Weryfikacja typecheck**

Run: `cd portals/widocznosc.ai && npx astro check 2>&1 | tail -5`
Expected: brak NOWYCH błędów dot. `newsArticleNode`/`newsListingNode` (baseline pre-existing errors mogą zostać).

- [ ] **Step 3: Commit**

```bash
git add portals/widocznosc.ai/src/lib/schema.ts
git commit -m "feat(widocznosc): schema NewsArticle + listing dla /news/"
```

---

### Task A4: Komponent NewsCTA.astro

**Files:**
- Create: `portals/widocznosc.ai/src/components/NewsCTA.astro`

- [ ] **Step 1: Utwórz komponent**

```astro
---
/**
 * NewsCTA – box konwersji w każdym wpisie News.
 * Statyczny link do audytu komercyjnego (warstwa 3 lejka).
 * Docelowo do podmiany na formularz e-mail, gdy powstanie backend leadów.
 */
---

<aside class="news-cta" aria-label="Zamów audyt widoczności w AI">
  <div class="news-cta-body">
    <p class="news-cta-eyebrow">Twoja marka w wyszukiwarkach AI</p>
    <h2 class="news-cta-title">Sprawdź, czy AI poleca właśnie Ciebie</h2>
    <p class="news-cta-text">
      Zamów audyt widoczności w ChatGPT, Claude, Gemini i Perplexity. Pokażemy, gdzie
      jesteś cytowany, gdzie tracisz do konkurencji i co zmienić.
    </p>
  </div>
  <a class="news-cta-button" href="/kontakt/?type=audyt-ai">Zamów audyt widoczności w AI</a>
</aside>

<style>
  .news-cta {
    margin: 48px 0 0;
    padding: 28px;
    border: 1px solid var(--hairline);
    border-radius: var(--r-xl);
    background: var(--bg-surface-1);
    display: flex;
    flex-direction: column;
    gap: 18px;
  }
  @media (min-width: 768px) {
    .news-cta {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      gap: 28px;
    }
  }
  .news-cta-eyebrow {
    font-family: var(--font-sans);
    font-size: var(--fs-caption);
    letter-spacing: var(--ls-caption);
    text-transform: uppercase;
    color: var(--ink-muted);
    margin: 0 0 6px;
  }
  .news-cta-title {
    font-family: var(--font-display);
    font-weight: 500;
    font-size: 22px;
    line-height: 1.2;
    color: var(--ink);
    margin: 0 0 8px;
  }
  .news-cta-text {
    font-family: var(--font-sans);
    font-size: var(--fs-body-sm);
    line-height: 1.55;
    color: var(--ink-muted);
    margin: 0;
    max-width: 60ch;
  }
  .news-cta-button {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 14px 22px;
    border-radius: var(--r-md);
    background: var(--accent-blue, #0a9cff);
    color: #fff;
    font-family: var(--font-sans);
    font-weight: 500;
    text-decoration: none;
    white-space: nowrap;
    transition: opacity 0.18s ease;
  }
  .news-cta-button:hover {
    opacity: 0.9;
  }
</style>
```

> Klasa tytułu `news-cta-title` to `<h2>` – ma jawny `font-size: 22px`, ale dla pewności wobec globalnej reguły `h2` w Theme.css zweryfikuj w Task A6 (jeśli za duże, podbij specyficzność `.news-cta .news-cta-title`).

- [ ] **Step 2: Commit**

```bash
git add portals/widocznosc.ai/src/components/NewsCTA.astro
git commit -m "feat(widocznosc): komponent NewsCTA (box audyt)"
```

---

### Task A5: Strona pojedynczego newsa `/news/[slug]`

**Files:**
- Create: `portals/widocznosc.ai/src/pages/news/[slug].astro`

- [ ] **Step 1: Utwórz stronę**

```astro
---
import Layout from '../../layouts/Layout.astro';
import Navbar from '../../components/Navbar.astro';
import Footer from '../../components/Footer.astro';
import ScrollUpButton from '../../components/ScrollUpButton.astro';
import NewsCTA from '../../components/NewsCTA.astro';
import { Image, getImage } from 'astro:assets';
import { getCollection, render } from 'astro:content';
import { buildGraph, newsArticleNode, breadcrumbNode } from '../../lib/schema';

export const getStaticPaths = async () => {
  const items = await getCollection('news');
  return items.map((item) => ({ params: { slug: item.id }, props: { item } }));
};

const { item } = Astro.props;
const { Content } = await render(item);

const formatDate = (date: Date) =>
  date.toLocaleDateString('pl-PL', { year: 'numeric', month: 'long', day: 'numeric' });

const optimizedOg = await getImage({ src: item.data.image, format: 'webp', width: 1200 });
const ogImageUrl = `https://widocznosc.ai${optimizedOg.src}`;

const schema = buildGraph(
  newsArticleNode({
    slug: item.id,
    title: item.data.title,
    lead: item.data.lead,
    imageUrl: ogImageUrl,
    datePublished: item.data.date.toISOString(),
    sourceName: item.data.sourceName,
    sourceUrl: item.data.sourceUrl,
    tags: item.data.tags,
    author: item.data.author,
  }),
  breadcrumbNode([
    { name: 'Strona główna', path: '/' },
    { name: 'News', path: '/news/' },
    { name: item.data.title, path: `/news/${item.id}/` },
  ]),
);
---

<Layout
  title={`${item.data.title} – News – widocznosc.ai`}
  description={item.data.lead}
  ogType="article"
  articleMeta={{ publishedTime: item.data.date.toISOString(), author: item.data.author, tags: item.data.tags }}
>
  <script type="application/ld+json" is:inline set:html={schema} />
  <Navbar />
  <main class="news-article">
    <nav class="news-breadcrumb" aria-label="Ścieżka nawigacji">
      <a href="/news/" class="news-breadcrumb-link">News</a>
      <span class="news-breadcrumb-sep" aria-hidden="true">›</span>
      <span class="news-breadcrumb-current">{item.data.title}</span>
    </nav>

    <header class="news-head">
      <div class="news-meta">
        <time datetime={item.data.date.toISOString()}>{formatDate(item.data.date)}</time>
        <span aria-hidden="true">·</span>
        <span>{item.data.author}</span>
      </div>
      <h1 class="news-title">{item.data.title}</h1>
      <p class="news-lead">{item.data.lead}</p>
    </header>

    <Image src={item.data.image} alt={item.data.title} class="news-hero" loading="eager" width={1200} />

    <div class="news-body">
      <Content />
    </div>

    <p class="news-source">
      Opracowanie redakcyjne na podstawie:{' '}
      <a href={item.data.sourceUrl} rel="noopener" target="_blank">{item.data.sourceName}</a>
    </p>

    <NewsCTA />
  </main>
  <Footer />
  <ScrollUpButton />
</Layout>

<style>
  .news-article {
    max-width: 760px;
    margin: 0 auto;
    padding: 40px 24px 80px;
  }
  .news-breadcrumb {
    display: flex;
    gap: 8px;
    align-items: center;
    font-size: var(--fs-caption);
    color: var(--ink-muted);
    margin-bottom: 28px;
  }
  .news-breadcrumb-link { color: var(--ink-muted); text-decoration: none; }
  .news-breadcrumb-link:hover { color: var(--ink); }
  .news-meta {
    display: flex;
    gap: 8px;
    font-size: var(--fs-caption);
    color: var(--ink-muted);
    margin-bottom: 14px;
  }
  .news-title {
    font-family: var(--font-display);
    font-weight: 500;
    font-size: clamp(1.9rem, 4vw, 2.6rem);
    line-height: 1.1;
    color: var(--ink);
    margin: 0 0 16px;
  }
  .news-lead {
    font-family: var(--font-sans);
    font-size: 1.15rem;
    line-height: 1.5;
    color: var(--ink-muted);
    margin: 0 0 28px;
  }
  .news-hero {
    width: 100%;
    height: auto;
    border-radius: var(--r-xl);
    margin-bottom: 32px;
  }
  .news-body :global(h2) {
    font-family: var(--font-display);
    font-size: 1.5rem;
    margin: 32px 0 12px;
    color: var(--ink);
  }
  .news-body :global(p) {
    font-family: var(--font-sans);
    line-height: 1.7;
    color: var(--ink);
    margin: 0 0 16px;
  }
  .news-source {
    margin-top: 32px;
    font-size: var(--fs-body-sm);
    color: var(--ink-muted);
  }
  .news-source a { color: var(--ink); text-decoration: underline; }
</style>
```

- [ ] **Step 2: Build sprawdzający renderowanie pojedynczego newsa**

Run: `cd portals/widocznosc.ai && npx astro build 2>&1 | tail -6`
Expected: build OK, liczba stron wzrosła (jest `/news/2026-05-29-przyklad/`).

- [ ] **Step 3: Weryfikacja, że strona istnieje i ma NewsArticle**

Run:
```bash
cd portals/widocznosc.ai && grep -c '"@type":"NewsArticle"' dist/news/2026-05-29-przyklad/index.html
```
Expected: `1` (lub więcej – w grafie).

- [ ] **Step 4: Commit**

```bash
git add portals/widocznosc.ai/src/pages/news/[slug].astro
git commit -m "feat(widocznosc): strona pojedynczego newsa /news/[slug]"
```

---

### Task A6: Listing `/news/` + weryfikacja CTA/typografii

**Files:**
- Create: `portals/widocznosc.ai/src/pages/news/index.astro`

- [ ] **Step 1: Utwórz listing**

```astro
---
import Layout from '../../layouts/Layout.astro';
import Navbar from '../../components/Navbar.astro';
import Footer from '../../components/Footer.astro';
import ScrollUpButton from '../../components/ScrollUpButton.astro';
import { Image } from 'astro:assets';
import { getCollection } from 'astro:content';
import { buildGraph, newsListingNode, breadcrumbNode } from '../../lib/schema';

const items = (await getCollection('news')).sort(
  (a, b) => b.data.date.getTime() - a.data.date.getTime(),
);

const formatDate = (date: Date) =>
  date.toLocaleDateString('pl-PL', { year: 'numeric', month: 'long', day: 'numeric' });

const schema = buildGraph(
  newsListingNode(
    items.map((it) => ({ slug: it.id, title: it.data.title, datePublished: it.data.date.toISOString() })),
  ),
  breadcrumbNode([
    { name: 'Strona główna', path: '/' },
    { name: 'News', path: '/news/' },
  ]),
);
---

<Layout
  title="News – widoczność marek w AI – widocznosc.ai"
  description="Codzienne newsy ze świata AI search, GEO i modeli językowych z eksperckim komentarzem ICEA."
>
  <script type="application/ld+json" is:inline set:html={schema} />
  <Navbar />
  <main class="news-listing">
    <header class="news-listing-head">
      <p class="news-listing-eyebrow">News</p>
      <h1 class="news-listing-title">Widoczność marek w AI – na bieżąco</h1>
      <p class="news-listing-sub">
        Najważniejsze wydarzenia ze świata AI search, GEO i modeli językowych – z komentarzem,
        co oznaczają dla widoczności Twojej marki.
      </p>
    </header>

    <div class="news-grid">
      {
        items.map((it) => (
          <a href={`/news/${it.id}/`} class="news-card">
            <div class="news-card-media">
              <Image src={it.data.image} alt={it.data.title} class="news-card-image" loading="lazy" width={600} />
            </div>
            <div class="news-card-body">
              <div class="news-card-meta">{formatDate(it.data.date)}</div>
              <div class="news-card-title">{it.data.title}</div>
              <p class="news-card-lead">{it.data.lead}</p>
            </div>
          </a>
        ))
      }
    </div>
  </main>
  <Footer />
  <ScrollUpButton />
</Layout>

<style>
  .news-listing { max-width: 1100px; margin: 0 auto; padding: 48px 24px 80px; }
  .news-listing-eyebrow {
    font-size: var(--fs-caption); letter-spacing: var(--ls-caption);
    text-transform: uppercase; color: var(--ink-muted); margin: 0 0 8px;
  }
  .news-listing-title {
    font-family: var(--font-display); font-weight: 500;
    font-size: clamp(2rem, 4vw, 3rem); line-height: 1.05; color: var(--ink); margin: 0 0 16px;
  }
  .news-listing-sub {
    font-family: var(--font-sans); font-size: 1.1rem; line-height: 1.5;
    color: var(--ink-muted); max-width: 65ch; margin: 0 0 48px;
  }
  .news-grid { display: grid; grid-template-columns: 1fr; gap: 20px; }
  @media (min-width: 700px) { .news-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (min-width: 1000px) { .news-grid { grid-template-columns: repeat(3, 1fr); } }
  .news-card {
    display: flex; flex-direction: column; background: var(--bg-surface-1);
    border: 1px solid var(--hairline-soft); border-radius: var(--r-xl);
    overflow: hidden; text-decoration: none; transition: border-color 0.2s ease, transform 0.2s ease;
  }
  .news-card:hover { border-color: var(--hairline); transform: translateY(-2px); }
  .news-card-media { aspect-ratio: 16 / 9; overflow: hidden; }
  .news-card-image { width: 100%; height: 100%; object-fit: cover; }
  .news-card-body { padding: 18px 20px 22px; display: flex; flex-direction: column; gap: 8px; }
  .news-card-meta { font-size: var(--fs-caption); color: var(--ink-muted); }
  .news-card-title {
    font-family: var(--font-display); font-weight: 500; font-size: 1.2rem;
    line-height: 1.2; color: var(--ink);
  }
  .news-card-lead {
    font-family: var(--font-sans); font-size: var(--fs-body-sm);
    line-height: 1.5; color: var(--ink-muted); margin: 0;
  }
</style>
```

- [ ] **Step 2: Build + weryfikacja listingu i CTA**

Run:
```bash
cd portals/widocznosc.ai && npx astro build 2>&1 | tail -4
grep -c 'news-card' dist/news/index.html
grep -c 'news-cta-button' dist/news/2026-05-29-przyklad/index.html
```
Expected: build OK; `news-card` ≥1; `news-cta-button` =1.

- [ ] **Step 3: Weryfikacja font-size CTA tytułu (globalna reguła h2)**

Run:
```bash
cd portals/widocznosc.ai && grep -oE '\.news-cta-title\{[^}]*\}' dist/_astro/*.css | head -1
```
Jeśli okaże się nadpisane przez globalne `h2` (jak `factor-card-title` wcześniej): zmień w `NewsCTA.astro` selektor `.news-cta-title` → `.news-cta .news-cta-title` i przebuduj.

- [ ] **Step 4: Commit**

```bash
git add portals/widocznosc.ai/src/pages/news/index.astro
git commit -m "feat(widocznosc): listing /news/ (chronologiczny)"
```

---

### Task A7: News w nawigacji (dropdown „Baza wiedzy")

**Files:**
- Modify: `portals/widocznosc.ai/src/components/Navbar.astro:38-49`

- [ ] **Step 1: Dodaj kolumnę News do dropdownu**

Znajdź w `Navbar.astro` blok:
```ts
    label: 'Baza wiedzy',
    href: '/blog/',
    items: [
      {
        heading: 'Kategorie',
        links: activePillars.map((p) => ({
          label: PILLAR_LABELS[p],
          href: `/${p}/`,
        })),
      },
    ],
```
Zmień tablicę `items` na dwukolumnową (Kategorie + Aktualności):
```ts
    label: 'Baza wiedzy',
    href: '/blog/',
    items: [
      {
        heading: 'Kategorie',
        links: activePillars.map((p) => ({
          label: PILLAR_LABELS[p],
          href: `/${p}/`,
        })),
      },
      {
        heading: 'Aktualności',
        links: [{ label: 'News', href: '/news/' }],
      },
    ],
```

- [ ] **Step 2: Build + weryfikacja linku w nav**

Run:
```bash
cd portals/widocznosc.ai && npx astro build 2>&1 | tail -3
grep -c 'href="/news/"' dist/index.html
```
Expected: build OK; `href="/news/"` ≥1 (w nav).

- [ ] **Step 3: Commit**

```bash
git add portals/widocznosc.ai/src/components/Navbar.astro
git commit -m "feat(widocznosc): News w dropdownie Baza wiedzy"
```

---

### Task A8: Usuń fixture, potwierdź pusty listing buduje się

**Files:**
- Delete: `portals/widocznosc.ai/src/content/news/2026-05-29-przyklad.md`

- [ ] **Step 1: Usuń przykładowy wpis**

```bash
git rm portals/widocznosc.ai/src/content/news/2026-05-29-przyklad.md
```

- [ ] **Step 2: Build z pustą kolekcją (tylko pierwszy news doda pipeline)**

Run: `cd portals/widocznosc.ai && npx astro build 2>&1 | tail -4`
Expected: build OK; `/news/` renderuje się jako pusty listing (brak kart), strona istnieje.

- [ ] **Step 3: Commit**

```bash
git commit -m "chore(widocznosc): usun fixture news (pipeline doda realne wpisy)"
```

---

## FAZA B — Pipeline Python (klon + adaptacja)

### Task B1: Sklonuj pipeline i ustaw zależności

**Files:**
- Create: `pipeline/news-generator-widocznosc/` (kopia)

- [ ] **Step 1: Skopiuj folder**

```bash
cp -r pipeline/news-generator pipeline/news-generator-widocznosc
rm -rf pipeline/news-generator-widocznosc/__pycache__ pipeline/news-generator-widocznosc/.pytest_cache
echo '[]' > pipeline/news-generator-widocznosc/published.json
```

- [ ] **Step 2: Sprawdź requirements (powinny wystarczyć te same)**

Run: `cat pipeline/news-generator-widocznosc/requirements.txt`
Jeśli brakuje `Pillow` lub `feedparser` lub `openai` lub `PyYAML` – dopisz brakujące (porównaj z importami w `*.py`).

- [ ] **Step 3: Commit (kopia bazowa)**

```bash
git add pipeline/news-generator-widocznosc/
git commit -m "chore(widocznosc): sklonuj news-generator jako baze pipeline widocznosc"
```

---

### Task B2: feeds.yaml – branżowe RSS EN

**Files:**
- Modify: `pipeline/news-generator-widocznosc/feeds.yaml`

- [ ] **Step 1: Zastąp treść**

```yaml
feeds:
  - url: "https://searchengineland.com/category/ai/feed"
    category: "ai-search"
    name: "Search Engine Land – AI"
  - url: "https://www.searchenginejournal.com/category/news/feed/"
    category: "ai-search"
    name: "Search Engine Journal – News"
  - url: "https://techcrunch.com/category/artificial-intelligence/feed/"
    category: "general-ai"
    name: "TechCrunch AI"
  - url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml"
    category: "general-ai"
    name: "The Verge AI"
  - url: "https://venturebeat.com/category/ai/feed/"
    category: "llm"
    name: "VentureBeat AI"
```

- [ ] **Step 2: Zweryfikuj, że feedy odpowiadają**

Run:
```bash
for u in "https://searchengineland.com/category/ai/feed" "https://www.searchenginejournal.com/category/news/feed/" "https://techcrunch.com/category/artificial-intelligence/feed/" "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml" "https://venturebeat.com/category/ai/feed/"; do echo "== $u =="; curl -s -o /dev/null -w "%{http_code}\n" "$u"; done
```
Expected: każdy `200`. Jeśli któryś ≠200 – znajdź aktualny URL feedu danego serwisu i podmień (zanotuj w komentarzu yaml).

- [ ] **Step 3: Commit**

```bash
git add pipeline/news-generator-widocznosc/feeds.yaml
git commit -m "feat(widocznosc): feeds.yaml – branzowe RSS EN (AI/GEO)"
```

---

### Task B3: config.yaml – Astro paths, seeds PL, autor

**Files:**
- Modify: `pipeline/news-generator-widocznosc/config.yaml`

- [ ] **Step 1: Zastąp treść**

```yaml
pipeline:
  name: "widocznosc.ai News Generator"
  portal: "widocznosc.ai"
  content_dir: "portals/widocznosc.ai/src/content"
  assets_dir: "portals/widocznosc.ai/src/assets/images"
  output_section: "news"
  author: "Redakcja widocznosc.ai"

scoring:
  min_score_threshold: 0.4
  freshness_weight: 0.3
  relevance_weight: 0.3
  trend_weight: 0.2
  uniqueness_weight: 0.2
  max_age_hours: 48
  published_history_days: 90
  dedup_similarity_threshold: 0.7

trends:
  location_code: 2616  # Poland (DataForSEO)
  language_code: "pl"
  seeds_static:
    - "sztuczna inteligencja"
    - "ChatGPT"
    - "wyszukiwarka AI"
    - "GEO"
    - "Perplexity"
    - "Gemini"
    - "AI Overviews"
    - "modele językowe"

llm:
  model: "gpt-5.4"
  temperature_judge: 0.3
  temperature_writer: 0.7
  max_tokens_judge: 500
  max_tokens_short: 2000
  max_tokens_analysis: 4000

format:
  short_max_words: 600
  short_min_words: 400
  short_h2_count: "2-3"
```

> Usunięto `data_dir`, `seeds_dynamic_from`, mapę `images` (BusManiak-specific). Hero generowany dynamicznie.

- [ ] **Step 2: Commit**

```bash
git add pipeline/news-generator-widocznosc/config.yaml
git commit -m "feat(widocznosc): config.yaml – Astro paths, seeds PL AI/GEO"
```

---

### Task B4: postprocessor.py – frontmatter Astro

**Files:**
- Modify: `pipeline/news-generator-widocznosc/postprocessor.py`
- Test: `pipeline/news-generator-widocznosc/tests/test_postprocessor_astro.py`

- [ ] **Step 1: Napisz failing test**

Utwórz `tests/test_postprocessor_astro.py`:
```python
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from postprocessor import postprocess, generate_slug, build_markdown


def test_astro_frontmatter_fields():
    fm = {
        "title": "Google rozszerza AI Overviews",
        "lead": "Krótki lead.",
        "date": "2026-05-29",
        "sourceName": "Search Engine Land",
        "sourceUrl": "https://searchengineland.com/x",
        "tags": ["AI Overviews"],
    }
    body = "## Co się wydarzyło\n\nTreść."
    out_fm, out_body, errors = postprocess(fm, body, image_path="../../assets/images/news-x.webp")
    assert errors == []
    assert out_fm["author"] == "Redakcja widocznosc.ai"
    assert out_fm["image"] == "../../assets/images/news-x.webp"
    assert "draft" not in out_fm and "categories" not in out_fm and "toc" not in out_fm
    assert out_fm["sourceName"] == "Search Engine Land"


def test_slug_polish():
    assert generate_slug("Świeżość treści w AI") == "swiezosc-tresci-w-ai"
```

- [ ] **Step 2: Uruchom test – ma failować**

Run: `cd pipeline/news-generator-widocznosc && python -m pytest tests/test_postprocessor_astro.py -v`
Expected: FAIL (`postprocess` ma inną sygnaturę / Hugo fields).

- [ ] **Step 3: Przepisz postprocessor.py**

Zastąp `REQUIRED_FIELDS` i funkcje `assign_placeholder_image` + `postprocess`:
```python
REQUIRED_FIELDS = ["title", "lead", "date", "sourceName", "sourceUrl"]
```
Usuń funkcję `assign_placeholder_image` w całości. Zastąp `postprocess`:
```python
def postprocess(
    fm: dict,
    body: str,
    image_path: str | None = None,
    author: str = "Redakcja widocznosc.ai",
) -> tuple[dict, str, list[str]]:
    """Astro frontmatter post-processing. Returns (fm, body, errors)."""
    errors = validate_frontmatter(fm)

    for key, val in list(fm.items()):
        if isinstance(val, str):
            fm[key] = fix_typography(val)
        elif isinstance(val, list):
            fm[key] = [fix_typography(v) if isinstance(v, str) else v for v in val]

    fm["author"] = author
    if "tags" not in fm or fm["tags"] is None:
        fm["tags"] = []
    if image_path:
        fm["image"] = image_path
    # Astro: brak Hugo-specific pól
    for k in ("draft", "categories", "toc", "faq", "image_alt", "main_keyword", "description"):
        fm.pop(k, None)

    body = fix_typography(body)
    body = clean_body(body)
    body = ensure_body_starts_with_h2(body)
    return fm, body, errors
```

- [ ] **Step 4: Uruchom test – ma przejść**

Run: `cd pipeline/news-generator-widocznosc && python -m pytest tests/test_postprocessor_astro.py -v`
Expected: PASS (2 testy).

- [ ] **Step 5: Commit**

```bash
git add pipeline/news-generator-widocznosc/postprocessor.py pipeline/news-generator-widocznosc/tests/test_postprocessor_astro.py
git commit -m "feat(widocznosc): postprocessor – frontmatter Astro + test"
```

---

### Task B5: generator.py – prompt EN→PL + komentarz ICEA

**Files:**
- Modify: `pipeline/news-generator-widocznosc/generator.py`

- [ ] **Step 1: Przepisz `build_prompt` i system prompt**

Zastąp funkcję `build_prompt` (zachowaj sygnaturę `generate_article`/`parse_llm_output` bez zmian – one tylko wołają build_prompt i parsują wynik). Nowy `build_prompt`:
```python
SYSTEM_PROMPT = (
    "Jesteś redaktorem widocznosc.ai – polskiego portalu o widoczności marek "
    "w wyszukiwarkach AI (ChatGPT, Claude, Gemini, Perplexity), GEO i modelach "
    "językowych. Piszesz po polsku, rzeczowo, bez marketingowego bełkotu. "
    "NIGDY nie kopiujesz oryginału – streszczasz fakty własnymi słowami i dodajesz "
    "ekspercki komentarz. Używasz wyłącznie en-dash (–), nigdy em-dash."
)


def build_prompt(topic, related_articles, format_config) -> str:
    src_title = topic.signal.title
    src_url = getattr(topic.signal, "url", "")
    src_name = getattr(topic.signal, "source", "źródło")
    src_summary = getattr(topic.signal, "summary", "") or getattr(topic.signal, "description", "")
    lo = format_config.get("short_min_words", 400)
    hi = format_config.get("short_max_words", 600)
    return f"""Na podstawie poniższego anglojęzycznego newsa napisz polski wpis dla sekcji News portalu widocznosc.ai.

ŹRÓDŁO: {src_name}
TYTUŁ ORYGINAŁU: {src_title}
URL: {src_url}
STRESZCZENIE/FRAGMENT: {src_summary}

Wymagania:
- Długość całości: {lo}–{hi} słów.
- Zacznij od frontmatteru YAML między --- z polami: title (polski, zwięzły), lead (1–2 zdania), date ({topic_date_placeholder}), sourceName ("{src_name}"), sourceUrl ("{src_url}"), tags (2–4 polskie tagi).
- Po frontmatterze body w markdown, zaczynające się od `## Co się wydarzyło` (streszczenie faktów własnymi słowami), następnie `## Co to oznacza dla widoczności w AI` (ekspercki komentarz ICEA: praktyczne wnioski dla marek).
- NIE kopiuj zdań z oryginału. NIE wymyślaj faktów spoza źródła.
- Nie dodawaj sekcji FAQ ani CTA – zostaną dołożone automatycznie.
""".replace("{topic_date_placeholder}", "RRRR-MM-DD (dzisiejsza data)")
```

> `generate_article` musi używać `SYSTEM_PROMPT` jako wiadomości `system`. Jeśli obecny kod ma inny system prompt zaszyty, podmień go na `SYSTEM_PROMPT`.

- [ ] **Step 2: Usuń BusManiak-specific (related/clusters jeśli zawodzą dla Astro)**

`find_related_articles` skanuje `content_dir` po plikach Hugo – dla Astro `news` na starcie pusty. Zostaw funkcję, ale w `main.py` (Task B7) wywołanie owiń w try/except i przekaż `[]` przy błędzie. Tu bez zmian.

- [ ] **Step 3: Test parsowania frontmatteru (smoke)**

Run:
```bash
cd pipeline/news-generator-widocznosc && python -c "from generator import parse_llm_output; fm,b=parse_llm_output('---\ntitle: X\nlead: Y\ndate: 2026-05-29\nsourceName: S\nsourceUrl: https://x\ntags: [a]\n---\n\n## Co się wydarzyło\n\ntekst'); print(fm['title'], fm['sourceName']); print(b[:20])"
```
Expected: wypisze `X S` i początek body.

- [ ] **Step 4: Commit**

```bash
git add pipeline/news-generator-widocznosc/generator.py
git commit -m "feat(widocznosc): generator – prompt EN->PL + komentarz ICEA"
```

---

### Task B6: image_generator.py – HERO_STYLE widocznosc

**Files:**
- Modify: `pipeline/news-generator-widocznosc/image_generator.py`

- [ ] **Step 1: Zastąp prompty stylu i usuń vehicle-detection**

Zastąp górne stałe (prompty kategorii BusManiak) jednym stylem:
```python
HERO_STYLE = (
    "Premium editorial tech illustration. Deep obsidian black background "
    "(#070810). Subtle sky-blue accents (#0a9cff) used sparingly for glow "
    "and key elements. Minimalist, sophisticated, high-end AI consultancy "
    "aesthetic. No people, no text, no letters, no logos, no UI mockups. "
    "Abstract geometric, wide cinematic composition. Soft volumetric lighting. "
)
MODEL = "gpt-image-2-text-to-image"
```
Zastąp `build_prompt` (image):
```python
def build_prompt(title: str, section: str = "news", *, _category=None, _vehicle_hint=None) -> str:
    return (
        HERO_STYLE
        + f"Abstract visual metaphor for an AI/search-industry news headline: \"{title}\". "
        "Translate the concept into geometric forms, nodes, light beams or data flows. "
        "No readable text."
    )
```
Usuń funkcje `_extract_vehicle_from_title`, `_detect_category` oraz wywołanie walidacji vehicle w `_validate_image` (zostaw walidację „czy obraz powstał", ale bez vehicle_hint). W `_create_task` zmień model na `MODEL` jeśli zaszyty literał.

- [ ] **Step 2: Upewnij się, że `generate_hero_image` zapisuje do assets_dir z prefiksem `news-`**

W `generate_hero_image` (lub jego callerze w main) ścieżka docelowa: `Path(assets_dir) / f"news-{slug}.webp"`. Jeśli sygnatura przyjmuje `dest` – główny caller w main.py poda właściwą ścieżkę (Task B7).

- [ ] **Step 3: Smoke (bez realnego API – import się ładuje)**

Run: `cd pipeline/news-generator-widocznosc && python -c "import image_generator; print('ok')"`
Expected: `ok` (brak błędów importu/składni).

- [ ] **Step 4: Commit**

```bash
git add pipeline/news-generator-widocznosc/image_generator.py
git commit -m "feat(widocznosc): image_generator – HERO_STYLE portalu, bez vehicle"
```

---

### Task B7: main.py – ścieżki Astro, bez clusters

**Files:**
- Modify: `pipeline/news-generator-widocznosc/main.py`

- [ ] **Step 1: Usuń clusters/buses.json i ustaw ścieżki Astro**

W `run()`:
- Usuń `data_dir`, `load_model_names`, `load_clusters`, rozszerzanie `trends_seeds` o modele (zostaw tylko `seeds_static`).
- `content_dir = REPO_ROOT / pipeline_cfg["content_dir"]` (= `portals/widocznosc.ai/src/content`).
- `assets_dir = REPO_ROOT / pipeline_cfg["assets_dir"]`.
- `news_dir = content_dir / pipeline_cfg.get("output_section", "news")`.
- `related = []` (lub try/except wokół `find_related_articles`).
- Slug + data: `date_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")`, `slug = generate_slug(fm["title"])`, `filename = f"{date_str}-{slug}.md"`.
- Generowanie obrazu PRZED postprocess:
```python
image_rel = f"../../assets/images/news-{date_str}-{slug}.webp"
image_dest = assets_dir / f"news-{date_str}-{slug}.webp"
try:
    generate_hero_image(title=fm["title"], section="news", dest=image_dest)
except Exception as e:
    log.warning("Image generation failed (%s). Using fallback.", e)
    image_rel = "../../assets/images/blog-geo-przewodnik.webp"
```
- `fm, body, errors = postprocess(fm, body, image_path=image_rel, author=pipeline_cfg["author"])`.
- Zapis: `output_path = news_dir / filename`; guard „dziś" + „plik istnieje" bez zmian; `build_markdown(fm, body)`.
- `published.append({...})` jak w oryginale.

> Dostosuj nazwy zmiennych do realnego kodu kopii – zachowaj istniejący szkielet `run()`, zmień tylko ścieżki, usuń clusters, dołóż blok obrazu.

- [ ] **Step 2: Dry-run bez sekretów (oczekiwane wyjście wcześnie)**

Run: `cd /home/sibilian/projekty/icea/transformacja-zaplecza-seo && python pipeline/news-generator-widocznosc/main.py 2>&1 | tail -15`
Expected: pipeline startuje, pobiera feedy; bez kluczy API kończy się kontrolowanym błędem/exitem na etapie scoringu LLM lub kończy „No topic". Brak błędów importu/ścieżek.

- [ ] **Step 3: Commit**

```bash
git add pipeline/news-generator-widocznosc/main.py
git commit -m "feat(widocznosc): main – sciezki Astro, bez clusters, blok obrazu"
```

---

### Task B8: Pełny test integracyjny (z sekretami, lokalnie)

**Files:** brak nowych (uruchomienie)

- [ ] **Step 1: Uruchom z kluczami (lokalnie, jeśli dostępne)**

```bash
cd /home/sibilian/projekty/icea/transformacja-zaplecza-seo
OPENAI_API_KEY=... DATAFORSEO_LOGIN=... DATAFORSEO_PASSWORD=... KIE_API_KEY=... \
  python pipeline/news-generator-widocznosc/main.py 2>&1 | tail -25
```
Expected: powstaje `portals/widocznosc.ai/src/content/news/<data>-<slug>.md` + `src/assets/images/news-<data>-<slug>.webp`, `published.json` zaktualizowany.

- [ ] **Step 2: Zbuduj portal z realnym newsem**

Run: `cd portals/widocznosc.ai && npx astro build 2>&1 | tail -5`
Expected: build OK; `/news/<slug>/` istnieje; listing pokazuje 1 kartę.

- [ ] **Step 3: Walidacja frontmatteru i atrybucji**

Run:
```bash
cd portals/widocznosc.ai
grep -c '"@type":"NewsArticle"' dist/news/*/index.html | head
grep -l 'Opracowanie redakcyjne na podstawie' dist/news/*/index.html | head
```
Expected: NewsArticle obecny; nota atrybucji obecna.

- [ ] **Step 4: Commit wygenerowanego newsa (jeśli OK jako pierwszy wpis)**

```bash
cd /home/sibilian/projekty/icea/transformacja-zaplecza-seo
git add portals/widocznosc.ai/src/content/news/ portals/widocznosc.ai/src/assets/images/news-* pipeline/news-generator-widocznosc/published.json
git commit -m "content(widocznosc): pierwszy news z pipeline (weryfikacja)"
```

---

## FAZA C — Automatyzacja (GitHub Actions)

### Task C1: Workflow widocznosc-news.yml

**Files:**
- Create: `.github/workflows/widocznosc-news.yml`

- [ ] **Step 1: Utwórz workflow**

```yaml
name: Widocznosc News Generator

on:
  schedule:
    # 6:00 UTC = 8:00 CEST (po BusManiak 5:00 UTC)
    - cron: '0 6 * * *'
  workflow_dispatch:

permissions:
  contents: write

jobs:
  generate-news:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'

      - name: Install dependencies
        run: pip install -r pipeline/news-generator-widocznosc/requirements.txt

      - name: Run news pipeline
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          DATAFORSEO_LOGIN: ${{ secrets.DATAFORSEO_LOGIN }}
          DATAFORSEO_PASSWORD: ${{ secrets.DATAFORSEO_PASSWORD }}
          KIE_API_KEY: ${{ secrets.KIE_API_KEY }}
        run: python pipeline/news-generator-widocznosc/main.py

      - name: Commit and push
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add portals/widocznosc.ai/src/content/news/ portals/widocznosc.ai/src/assets/images/news-* pipeline/news-generator-widocznosc/published.json
          git diff --cached --quiet || git commit -m "news: auto-generated daily news (widocznosc)"
          git push
```

- [ ] **Step 2: Walidacja składni YAML**

Run: `python -c "import yaml,sys; yaml.safe_load(open('.github/workflows/widocznosc-news.yml')); print('yaml ok')"`
Expected: `yaml ok`.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/widocznosc-news.yml
git commit -m "ci(widocznosc): workflow news-generator (cron dzienny)"
```

- [ ] **Step 4: (Ręcznie, poza planem) Ustaw sekrety w GitHub**

Potwierdź w ustawieniach repo, że istnieją: `OPENAI_API_KEY`, `DATAFORSEO_LOGIN`, `DATAFORSEO_PASSWORD`, `KIE_API_KEY` (te same co BusManiak). Pierwsze uruchomienie: `workflow_dispatch` ręcznie i sprawdź wynik commitu.

---

## Notatki końcowe

- **Zależność biznesowa:** box CTA kieruje do `/kontakt/?type=audyt-ai`, którego formularz jest dziś atrapą (`project-widocznosc-leadgen`). Naprawa formularza to osobne zadanie – warunek sensu CTA.
- **Strojenie:** po kilku dniach obserwuj trafność wyboru tematu; w razie potrzeby dostrój `min_score_threshold`/wagi w `config.yaml`.
- **Em-dash:** generator i postprocessor wymuszają en-dash (–) – zgodne z regułą projektu.
