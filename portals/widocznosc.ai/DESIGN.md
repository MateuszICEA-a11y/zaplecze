# widocznosc.ai – Design System

> **Voice:** Premium tech AI portal pod marką ICEA. Linear-grade polish + SpaceX-bold hero moments. Brand ICEA paleta naturalnie pasuje do Linear DNA – nie wymyślamy koła, egzekutujemy precyzyjnie.

---

## 1. Core identity

**Vibe:** Elitarny, dynamiczny, innowacyjny, autentyczny. Nie korporacyjny. Nie blog-y. Premium tech portal dla decision-makerów + e-commerce owners chcących być widocznymi w AI.

**Mood references:**
- **Linear.app** – baseline (canvas blackness, surface ladder, hairline borders, accent restraint)
- **SpaceX** – hero treatment (full-viewport, gigantic typography, photography/imagery dominates)
- **Anthropic.com** – premium content reading experience

**Antypatterns:**
- ❌ Generic SaaS template (gradients everywhere, drop shadows, friendly mascots)
- ❌ Blog-y design (sidebars, recent posts widgets, social share bars in body)
- ❌ Corporate stock photo people z laptopami
- ❌ Bouncy animations, parallax scroll-jack
- ❌ Material design / iOS native components

---

## 2. Color tokens

```css
/* Brand core (z ICEA Brand Manual) */
--color-midnight: #000623;        /* Canvas – near-black z faint blue tint, Linear vibe */
--color-blue: #5768FF;             /* Primary accent, CTA, headlines emphasis, AI dot */
--color-orange: #F6704C;           /* Rare accent only – używane SPARINGLY (max 1-2 razy per page) */
--color-off: #F9F9F9;              /* Body text, headlines */
--color-white: #FFFFFF;            /* Highest contrast – hero headlines, key emphasis */

/* Surface ladder (Linear-style) */
--color-surface-0: var(--color-midnight);   /* Page canvas */
--color-surface-1: #0A1037;        /* Cards, listings */
--color-surface-2: #131C4D;        /* Elevated cards, sticky panels, hover states */
--color-surface-3: #1B2664;        /* Top-level overlays, dropdowns */

/* Borders – hairline (1px), no shadows */
--color-border: rgb(249 249 249 / 0.08);          /* Default subtle border */
--color-border-strong: rgb(249 249 249 / 0.16);   /* Card edges, dividers */
--color-border-active: rgb(87 104 255 / 0.5);     /* Hover, focus, active state */

/* Text scale (Off-white z opacity steps) */
--color-text-primary: var(--color-off);            /* Headings, key body */
--color-text-secondary: rgb(249 249 249 / 0.72);   /* Body */
--color-text-tertiary: rgb(249 249 249 / 0.52);    /* Meta, captions */
--color-text-disabled: rgb(249 249 249 / 0.32);    /* Muted */

/* Focus + interactive */
--color-ring: rgb(87 104 255 / 0.4);
--color-glow-blue: rgb(87 104 255 / 0.3);
--color-glow-orange: rgb(246 112 76 / 0.25);
```

**Color rules:**
- **Orange `#F6704C` reserved for emphasis** – używamy tylko gdy Blue jest niewystarczające (np. warning callouts, distinct stats). Max 1-2 razy per route. NIGDY na CTA buttons (Blue jest CTA color).
- **Blue na CTA + akcent text** – ".ai", "100%", "5 modeli AI mierzone".
- **Orange na rare highlights** – np. status indicator "live update", warning callout.
- **Surface ladder** – każda sekcja może użyć innej surface dla rhythm: hero on canvas, stats on surface-1, cards on surface-1 hover surface-2.
- **Hairline borders > shadows** – ZERO `box-shadow` outside focus rings. Linear DNA.

---

## 3. Typography

**Font family:**
- **Display + Body**: Manrope (variable, OFL, premium geometric sans-serif)
- Future swap: Roobert kiedy ICEA udostępni licencję webfont
- **Mono**: JetBrains Mono / IBM Plex Mono (kod, technical)

### Hierarchy (Linear-inspired, aggressive negative tracking on display)

| Token | Size | Weight | Line | Tracking | Use |
|---|---|---|---|---|---|
| `display-2xl` | clamp(3.5rem, 8vw, 6rem) | 600 | 0.95 | -0.04em | Hero homepage – jeden raz per page |
| `display-xl` | clamp(2.75rem, 6vw, 4.5rem) | 600 | 1.0 | -0.035em | Hero pillar, big section opener |
| `display-lg` | clamp(2.25rem, 4.5vw, 3.25rem) | 600 | 1.05 | -0.03em | Listing page heading |
| `h1` | clamp(2rem, 4vw, 2.75rem) | 600 | 1.1 | -0.025em | Article H1 |
| `h2` | 1.875rem (30px) | 600 | 1.2 | -0.02em | Section H2 |
| `h3` | 1.375rem (22px) | 600 | 1.3 | -0.015em | Card titles, sub-section |
| `h4` | 1.125rem (18px) | 600 | 1.4 | -0.01em | Author name, meta heading |
| `lead` | 1.25rem (20px) | 400 | 1.55 | -0.005em | Hero subheadline, article TLDR |
| `body` | 1.0625rem (17px) | 400 | 1.65 | 0 | Article body, default reading |
| `small` | 0.9375rem (15px) | 400 | 1.55 | 0 | Card descriptions, secondary |
| `caption` | 0.8125rem (13px) | 500 | 1.5 | 0.01em | Meta, dates, labels (uppercase) |
| `eyebrow` | 0.75rem (12px) | 600 | 1.4 | 0.08em | Section labels (uppercase, tracked) |
| `code` | 0.95em | 400 | inherit | 0 | Inline code |

**Typography rules:**
- Headings (display-* + h1) get **negative letter-spacing** – Linear DNA, premium feel. Aggressive on display sizes.
- Body uses **17px (1.0625rem)** for premium reading – większe niż MVP 18px (które było zbyt big), też nie 16px (zbyt cramped). Sweet spot.
- **Eyebrow = uppercase + positive tracking** – jedyny element z uppercase. Używaj jako section opener label ("BAZA WIEDZY", "AUTORZY ICEA").
- Reszta – sentence case, naturalna interpunkcja, pełna czytelność.
- **NIGDY full uppercase paragraphs** – tylko captions/eyebrows.

---

## 4. Spacing

**Base unit:** 4px (Linear standard)

```
xxs   4px    Inline tight gaps
xs    8px    Element gaps inside cards
sm   12px    Compact lists
md   16px    Default content padding
lg   24px    Card padding, section internal
xl   32px    Between blocks
2xl  48px    Section breathing
3xl  64px    Section vertical padding
4xl  96px    Major page sections
5xl 128px    Hero vertical, page top
```

**Layout containers:**
- `--max-w-content`: 720px (article body, polityka prywatności – optimal reading)
- `--max-w-default`: 1280px (homepage sections, listing)
- `--max-w-wide`: 1440px (rare full-bleed hero with side padding)

**Article reading column:** 720px max-width (premium long-form, NIE 800+ które jest za szerokie).

---

## 5. Components – patterns

### Buttons

**3-tier system (Linear DNA):**

```
Primary (Blue)
  bg: var(--color-blue)
  text: white
  hover: bg darken 10%, subtle Blue glow
  font: 0.9375rem, weight 600
  padding: 0.625rem 1.25rem
  radius: 0.5rem (8px)
  border: none
  use: main CTA (Zamów audyt, Sprawdź narzędzie)

Secondary (Surface)
  bg: var(--color-surface-1)
  text: var(--color-off)
  border: 1px solid var(--color-border-strong)
  hover: bg → surface-2, border → border-active
  use: secondary CTA, "Czytaj więcej"

Ghost (Tertiary)
  bg: transparent
  text: var(--color-text-secondary)
  border: 1px solid var(--color-border)
  hover: text → primary, border → border-active
  use: minor actions, footer links visualized as buttons

Link (button-styled inline)
  text: var(--color-blue)
  underline-offset: 4px
  text-decoration: underline-from-font
  hover: opacity 0.8
```

**Button padding** scale: sm (0.5rem 1rem), md (0.625rem 1.25rem default), lg (0.875rem 1.75rem hero).

**No icon buttons w Plan 1.5** – ikony dodajemy w Plan 5 (Phosphor library).

### Cards (listing, related)

```
bg: var(--color-surface-1)
border: 1px solid var(--color-border)
radius: 0.75rem (12px)
padding: 1.5rem (24px)

hover state:
  border: var(--color-border-active)
  bg: var(--color-surface-2)
  transition: 220ms ease
  cursor: pointer
  
NIGDY shadow. Hairline + bg shift = depth.
```

### Hero (homepage, pillar) – SpaceX-influenced

```
height: min(100vh, 920px) homepage; min(70vh, 720px) pillar
background: 
  base: var(--color-midnight)
  + gradient mesh: radial-gradient(at 20% 20%, rgb(87 104 255 / 0.18), transparent 60%),
                   radial-gradient(at 80% 80%, rgb(246 112 76 / 0.10), transparent 55%)
  + subtle grain (optional, SVG noise overlay 0.04 opacity)

content layout:
  max-width: 1280px
  text alignment: left (NIE center – Linear DNA, SpaceX too)
  
typography:
  eyebrow: "MARKA ICEA · POZYCJONOWANIE W AI"
  display-2xl headline (clamp 3.5-6rem) z negative tracking
  lead subheadline (max 2 lines)
  
CTAs: 2 max (primary Blue + secondary surface)

motion: gradient mesh subtle pan (60s loop, prefers-reduced-motion respected)
```

### Article reading (long-form)

```
max-width: 720px
font-size: 17px body (1.0625rem)
line-height: 1.65
paragraph spacing: 1.25em (Linear premium reading)
H2: 56px top margin, 16px bottom (visual rhythm)
H3: 32px top, 12px bottom
links: var(--color-blue), underline-offset 4px, decoration thinning
blockquote: border-left 3px Blue, italic, 1.5em side padding
code inline: bg surface-1, radius 4px, padding 0.15em 0.35em
code block: bg surface-1, border 1px, 12px radius, 1.5rem padding, JetBrains Mono
ul/ol: 1.25em padding-left, marker var(--color-blue)
img: full-width, radius 12px, my 2em
```

### Author meta (article header)

```
flex inline gap-3
avatar: 32px circle
name: link Blue hover
date: text-tertiary, dot separators
reading time: text-tertiary

Format: "[Author Name] · 12 października 2025 · 8 min czytania"
```

### Service offer card (pillar) – sticky right column

```
bg: var(--color-surface-1)
border: 1px solid var(--color-border-strong)
radius: 1rem (16px)
padding: 2rem
position: sticky top-24 (desktop only)
position: static on mobile (full-width below content)

internal structure:
  eyebrow: "USŁUGA ICEA" (Blue)
  h3 service name
  p description (text-secondary)
  ul deliverables (✓ markers Blue)
  optional price line ("Od 4 990 zł")
  primary CTA full-width
```

### Logo (CSS-only wordmark with pulse)

```
HTML: <a class="logo-wordmark">
  widocznosc<span class="logo-dot"></span><span class="logo-ai">ai</span>
</a>

base font-weight: 600
letter-spacing: -0.02em
"widocznosc" + "ai" share line-height for baseline alignment
.logo-dot: 0.42em circle, Blue, animated pulse 1.8s
.logo-ai: Blue color
animation respects prefers-reduced-motion
```

---

## 6. Layout patterns

### Homepage

```
1. Hero (h: ~720-920px)
   - Full-bleed gradient mesh BG
   - Eyebrow + display-2xl + lead + 2 CTAs (left-aligned)
   
2. Stats strip (h: ~200px)
   - 4 numbers w glow effect
   - Background: linear-gradient over surface, gold ratio
   
3. "Najnowsze z bazy wiedzy" (3 lub 6 articles)
   - Eyebrow "BAZA WIEDZY"
   - h2 + link "Wszystkie →"
   - 3-col grid cards, hover effects
   
4. Featured pillar / service teaser (split layout 60/40)
   - Left: copy + CTA
   - Right: stylized "AI Visibility Score" mockup (HTML+CSS, not image)
   
5. Zespół (4 authors)
   - Eyebrow "AUTORZY ICEA"
   - 4-col grid, foto + name + role + LinkedIn link
   
6. CTA strip (gradient surface, single primary CTA)
```

### Pillar

```
1. Hero shorter (h: ~520px)
   - Eyebrow "POZYCJONOWANIE AI · USŁUGA"
   - display-xl headline
   - lead subheadline
   - 1 primary CTA
   
2. TLDR/intro (max-w 720px)
   
3. Two-column (1fr 360px)
   - Left: prose article body
   - Right: ServiceOfferCard sticky
   
4. Case study teaser (1-2 cards)

5. FAQ accordion

6. Author box

7. Final CTA (gradient strip)

8. Related pillars (3 cards)
```

### Article (baza-wiedzy)

```
1. Breadcrumb subtle

2. Article header
   - Eyebrow "MODELE AI" (kategoria)
   - h1 (clamp 2-2.75rem)
   - AuthorMeta inline
   
3. Hero image (16:9, radius 12px)

4. Two-column desktop / stacked mobile
   - Left: TableOfContents sticky 240px
   - Right: prose article 720px
     - TLDR lead
     - Body markdown
     - FAQ inline
     - Sources numbered list
     
5. AuthorBox

6. Related articles (3 cards)

7. CTA (subtle, 1 line + Blue link)
```

### Author profile

```
1. Header section
   - Photo 280px square (radius 16px)
   - Right column: h1 name, role+ICEA, bio paragraph
   - Expertise pills (chips Blue/40)
   - Social links (LinkedIn + ICEA profile, plain text)
   
2. Articles grid (3-col cards, paginated 12 per page)
```

---

## 7. Motion

### Principles

- **Purposeful only** – każda animacja ma role (loading state, focus feedback, brand identity).
- **Cubic-bezier(0.4, 0, 0.2, 1)** default ease.
- **Durations:** micro 120ms, transition 220ms, accent 320ms, ambient 1.6s+ (logo pulse, hero gradient).
- **`prefers-reduced-motion: reduce`** kills wszystkie ambient + transition-duration → 0.01ms.
- **Subtle scale (1 → 1.01)** zamiast translate na hover. Linear DNA – minimal disruption.

### Specific animations

- Logo pulse: 1.8s ease-in-out infinite, opacity + scale (already implemented)
- Hero gradient mesh pan: 60s linear infinite, background-position translate
- Card hover: 220ms ease, border + bg color, no scale (avoid layout shift)
- Button hover: 180ms ease, bg + glow
- View Transitions API (Astro native): smooth nav between pages

### NO

- ❌ Parallax scroll
- ❌ Bouncy easings (cubic-bezier overshoot)
- ❌ Auto-play video / GIF
- ❌ Floating elements (sticky social bars, chatbot widgets na homepage)
- ❌ Cursor effects (custom cursors, blob trails)

---

## 8. Imagery

### Hero / article hero

- Generated abstract via gpt-image-2 (kie.ai)
- Brand palette only: Midnight + Blue + Orange + Off
- Geometric, gradient mesh, abstract tech
- Editorial style, NIE corporate stock photo
- Aspect ratio 16:9 hero, 1:1 infographic
- People allowed (per user feedback) – tech/decision-maker context, neutral poses

### Authors

- **Real photos** scraped from grupa-icea.pl (NIE generated)
- Square 1:1, radius 16px

### Decorative SVG elements (Plan 5+)

- Subtle gradient mesh CSS only (no SVG file – pure radial-gradient)
- Stylized "AI Visibility Score" widget mockup (HTML+CSS bars + numbers)
- Section dividers: hairline + dot pattern (rare, only major sections)

### NO

- ❌ Stock photos (Unsplash corporate)
- ❌ 3D renders (overrender, slow load)
- ❌ Lottie animations (heavy, distracting)
- ❌ Hero video autoplay

---

## 9. Accessibility

- WCAG 2.1 AA target (Plan 5 launch hardening fixes color-contrast known issues)
- Min 17px body, scales naturally on mobile
- Focus rings 3px Blue z 0.4 opacity, offset 2px, radius matches element
- Skip link "Przejdź do treści" w BaseLayout (already implemented)
- Semantic HTML – `<article>`, `<nav>`, `<aside>`, `<main>`, `<header>`, `<footer>`
- ARIA labels na nav + interactive bez visible text (search, menu toggle)
- Keyboard navigation pełna (mega-menu rozwija na hover OR focus-within)
- `prefers-reduced-motion` respected (logo pulse, hero gradient pan)

---

## 10. Implementation guide for Claude

When generating components:

1. **Reach for surface ladder + hairline borders first**, NOT shadows
2. **Tracking**: negative on display, neutral on body, positive only on eyebrows/captions
3. **Eyebrow precedes most h2 sections** ("BAZA WIEDZY", "AUTORZY ICEA", "USŁUGA ICEA")
4. **Orange uses minimal** – 1-2 razy per page max, dla emphasis NIE buttons
5. **Hover states zawsze hairline + bg shift**, NIE shadow elevation
6. **Hero typography aggressive** – display-2xl, negative tracking, sentence case
7. **Article reading at 720px max-width, 17px body, 1.65 line-height** – premium feel
8. **3-tier button system rygorystycznie** – nigdy mix variant per CTA group
9. **Motion subtle, purposeful, motion-reduced respected**
10. **Sentence case dla copy** (poza eyebrows + captions)

---

## 11. Implementation checklist (Plan 1.5 redesign sprint)

- [x] Logo CSS-only z pulse dot (Header + Footer)
- [x] Favicon redesign (dot na Midnight)
- [x] OG default regenerate
- [x] DESIGN.md (this file)
- [ ] global.css – update typography tokens (display-2xl/xl/lg, eyebrow, refined body)
- [ ] tailwind.config.mjs – update fontSize tokens, surface ladder, glow utilities
- [ ] Hero component v2 (homepage variant z gradient mesh + display-2xl)
- [ ] Stats strip redesign (Linear glow effect)
- [ ] Card hover states refined
- [ ] ServiceOfferCard redesign
- [ ] AuthorMeta + AuthorBox refined
- [ ] FAQ accordion polish
- [ ] Eyebrow component (nowy)
- [ ] Homepage redesign full
- [ ] Pillar landing redesign
- [ ] Article reading layout polish
- [ ] Author profile redesign
- [ ] BaseLayout – preload font, view transitions

After Plan 1.5: rebuild + visual review + merge or iterate.
