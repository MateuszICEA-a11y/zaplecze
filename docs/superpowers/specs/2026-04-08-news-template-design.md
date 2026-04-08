# News Template Design – BusManiak.pl

**Data:** 2026-04-08
**Status:** Approved

## Problem

Sekcja News używa tych samych szablonów co zwykłe artykuły (single.html, list.html). Wygląda jak blog, nie jak portal newsowy. Brak optymalizacji pod Google Discover.

## Scope

- Nowy szablon listy newsów (portal newsowy)
- Nowy szablon pojedynczego newsa (uproszczony vs artykuł)
- Meta tag `max-image-preview:large` (globalnie)
- Schema `NewsArticle` dla sekcji news
- Dedykowany CSS dla newsów

### Poza scope

- Pipeline generowania hero images (DALL-E edit)
- Zmiany w news-generator pipeline
- Web Stories

## Design

### Lista newsów – news/list.html

Styl portal newsowy:

1. **Hero card** – pierwszy (najnowszy) news jako full-width karta z dużym tytułem, leadem, tagami i timestampem. Badge "Najnowsze".
2. **Kompaktowa lista** – pozostałe newsy w układzie: miniaturka (po prawej, mała) + tytuł + lead (skrócony) + timestamp relatywny + tagi. Jeden news na wiersz, gęsty układ.
3. **Paginacja** – 12 newsów na stronę, "Nowsze" / "Starsze".
4. **Nagłówek sekcji** – h1 z _index.md, linia oddzielająca (accent color #ff6b00).

Timestampy relatywne:
- < 24h: "Dziś, 14:30"
- 1 dzień: "Wczoraj"
- 2-6 dni: "X dni temu"
- 7+ dni: "DD.MM.YYYY"

### Pojedynczy news – news/single.html

Uproszczony layout vs zwykły artykuł:

- **Hero image** – zachowany (wymagany przez Discover). Min. 1200px width.
- **Tytuł (h1)** – pod hero, duży.
- **Meta** – data + czas czytania. Bez autora (wszystkie newsy: "Redakcja BusManiak").
- **Tagi** – pod meta, jako pillsy/chips.
- **Lead** – wyróżniony akapit (jeśli istnieje w frontmatter).
- **Treść** – bez TOC (toc: false w frontmatter). Standardowy rendering .Content.
- **Źródła** – sekcja na dole, taki sam styl jak w artykułach.
- **Powiązane** – slider z powiązanymi newsami (tylko z sekcji news).

Elementy USUNIĘTE vs artykuł:
- TOC (spis treści)
- Author card
- FAQ
- Breadcrumbs (opcjonalnie – do rozważenia, ale newsowy layout ich zwykle nie ma)

### Google Discover – wymagania techniczne

1. **Meta robots** – dodać `max-image-preview:large` do istniejącego tagu robots na WSZYSTKICH stronach:
   - Zmiana w `head.html`: `index, follow, max-image-preview:large`
   - Dla stron z noindex: bez zmian

2. **Schema NewsArticle** – nowy partial `schema/news-article.html`:
   - `@type: "NewsArticle"` (zamiast `Article`)
   - Używany TYLKO w sekcji news
   - Pola: headline, description, url, datePublished, dateModified, image, author (Organization: "Redakcja BusManiak.pl"), publisher, mainEntityOfPage
   - `article.html` partial dostaje warunek: jeśli sekcja == news, skip (bo news-article.html go zastępuje)

3. **Hero images** – pipeline powinien generować obrazki min. 1200×630px (format Discover). Obecne hero.webp mają 1376×768 – OK.

### Struktura plików

```
shared/theme/layouts/
  news/
    list.html          # Lista newsów (portal newsowy)
    single.html        # Pojedynczy news (uproszczony)
  partials/
    schema/
      news-article.html  # NewsArticle schema
    news-card.html       # Karta newsa w kompaktowej liście

shared/theme/assets/css/
  main.css             # Dodatkowe style .news-* na końcu
```

### CSS – nowe klasy

```
.news-hero-card        – featured (pierwszy) news na liście
.news-list             – kontener kompaktowej listy
.news-item             – pojedynczy wiersz w liście
.news-item__thumb      – miniaturka
.news-item__body       – tytuł + lead + meta
.news-item__meta       – data + tagi
.news-tag              – pill/chip z tagiem
.news-timestamp        – relatywny timestamp
.news-article          – kontener single newsa
.news-article__tags    – tagi pod tytułem
```

## Decyzje

- Hero image zachowany (Discover wymaga dużych obrazków)
- `max-image-preview:large` globalnie (nie tylko news) – zwiększa szanse na Discover dla wszystkich treści
- Breadcrumbs w newsach – zachowane (pomagają w nawigacji i schema BreadcrumbList)
- Źródła – zachowane w obecnym stylu (sekcja na dole)
- Related articles – filtrowane tylko do newsów
