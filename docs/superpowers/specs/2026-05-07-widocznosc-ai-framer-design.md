# widocznosc.ai – Pure Framer DNA Pivot

**Data:** 2026-05-07
**Branch:** `feat/widocznosc-framer` (off `feat/widocznosc-ai-tailcast`)
**Decyzja:** Pivot DNA z "Linear baseline + SpaceX hero + ICEA paleta" na **pure Framer marketing canvas**.

## Overview

Przejście na Framer marketing system: near-pure black canvas, oversized poster-grade display type z aggressive negative letter-spacing, white pill jako jedyny primary CTA, sky-blue jedynie jako signal color (link/focus/selection), gradient spotlight cards (violet/orange) jako sygnaturowy depth device zamiast shadow elevation. ICEA orange znika ze structural use – wraca tylko jako jeden gradient (audyt premium). Logo dot pulse + radar animation – out. Jedna rzeczywista accent reguła: monochrome + 1 blue + family gradientów.

## Decyzje (z brainstormingu)

1. **DNA shift**: Pure Framer port – ICEA orange ze structural use OUT, white pill primary, sky-blue link/focus only.
2. **Scope**: Big bang – cały portal naraz (homepage + blog listing + artykuły + nav + footer + podstrony) na nowym branchu, łatwy rollback przez checkout.
3. **Typography**: Mona Sans variable (GitHub OFL) na display + Inter Variable na body z OpenType variants `cv01/05/09/11`, `ss03/07`, `dlig`, `tnum`.
4. **Gradient spotlight cards**: 2 sztuki na homepage – hero violet (zastępuje orbit visual) + premium audyt orange (zastępuje orange-edge banner). Magenta/coral reserved.
5. **Logo**: Plain wordmark `widocznosc.ai` Mona Sans Medium, zero pulse, zero radar, zero dot accent.
6. **Branch strategy**: Nowy `feat/widocznosc-framer` off `feat/widocznosc-ai-tailcast`, content (artykuły, infografiki, pipeline) jedzie z branchem.

## Foundation tokens

### Surface ladder (4 levels)

```css
--bg-canvas       #0a0a0b     /* near-black z faint warmth */
--bg-surface-1    #131316     /* pricing cards, secondary buttons, mockup tiles */
--bg-surface-2    #1c1c20     /* featured pricing card, hero pill backdrop */
--bg-inverse      #ffffff     /* light-on-dark pill CTA, light-mode template thumbs */
```

### Hairlines

```css
--hairline        rgba(255,255,255,0.08)     /* input groups, table dividers */
--hairline-soft   rgba(255,255,255,0.04)     /* FAQ rows, footer column rules */
```

### Ink

```css
--ink             #ffffff     /* headlines + emphasized body */
--ink-muted       #999999     /* meta, deselected tabs, footer columns */
```

### Accent (single chromatic signal)

```css
--accent-blue     #0099ff     /* hyperlinks, focus, selection ONLY */
```

### Gradient spotlight family

```css
--gradient-violet:
  radial-gradient(ellipse 120% 100% at 25% 30%,
    #8b5cf6 0%, #6d28d9 35%, #1e1b4b 75%, #0a0a0b 100%);

--gradient-orange:
  radial-gradient(ellipse 110% 90% at 70% 25%,
    #ff8a3d 0%, #ff5722 30%, #b91c1c 65%, #1a0a0a 100%);

--gradient-magenta:  /* reserved future subpages */
  radial-gradient(ellipse at 30% 30%,
    #ec4899 0%, #be185d 40%, #4c1d24 80%, #0a0a0b 100%);

--gradient-coral:    /* reserved future subpages */
  radial-gradient(ellipse at 70% 30%,
    #fb7185 0%, #e11d48 40%, #4c1d24 80%, #0a0a0b 100%);
```

### Semantic

```css
--success-green   #1aaa55     /* comparison checkmarks ONLY (glyph fill) */
```

### Typography

**Display:** Mona Sans variable (GitHub OFL) – preload woff2, weight 500.
**Body:** Inter Variable – `font-feature-settings: "cv01","cv05","cv09","cv11","ss03","ss07","dlig","tnum"`.
**Mono:** OUT (JetBrains Mono usunięty – Framer nie używa mono dla kickerów).

| Token | Size | Weight | LH | Tracking |
|---|---|---|---|---|
| `--fs-display-xxl` | 110px | 500 | 0.85 | -5.5px |
| `--fs-display-xl` | 85px | 500 | 0.95 | -4.25px |
| `--fs-display-lg` | 62px | 500 | 1.00 | -3.1px |
| `--fs-display-md` | 32px | 500 | 1.13 | -1.0px |
| `--fs-headline` | 22px | 700 | 1.20 | -0.8px |
| `--fs-subhead` | 24px | 400 | 1.30 | -0.01px |
| `--fs-body-lg` | 18px | 400 | 1.30 | -0.18px |
| `--fs-body` | 15px | 400 | 1.30 | -0.15px |
| `--fs-body-sm` | 14px | 500 | 1.40 | -0.14px |
| `--fs-caption` | 13px | 500 | 1.20 | -0.13px |
| `--fs-micro` | 12px | 400 | 1.20 | -0.12px |
| `--fs-button` | 14px | 500 | 1.0 | -0.14px |

### Spacing (5px base)

```css
--sp-hair  1px    --sp-xs   8px    --sp-sm  12px
--sp-md    15px   --sp-lg   20px   --sp-xl  30px
--sp-xxl   40px   --sp-section 96px
```

### Radius

```
4 / 6 / 10 / 15 / 20 / 30 / 100 / 9999
pill = 100px (wszystkie text CTA)
full = 9999 (icon buttons, avatary)
```

### Elevation (4 levels)

```
L0 flat                       canvas type, FAQ rows
L1 surface-1 lift             pricing cards, secondary buttons
L2 light-edge                 rgba(255,255,255,0.10) 0.5px top-edge
                              + rgba(0,0,0,0.25) 0 10px 30px drop
L3 selected/focus             rgba(0,153,255,0.15) 0 0 0 1px ring
```

ZERO box-shadows poza L2 floating cards i L3 focus ring. Stary `--shadow-cta` orange-glow OUT.

## Komponenty

### Buttons

```css
.btn-primary       /* white pill, dominant CTA */
  bg: var(--ink) #ffffff; color: var(--bg-canvas);
  type: var(--fs-button); padding: 10px 15px; radius: 100px;
  pressed: transform: scale(0.98) (NIE darken)

.btn-secondary     /* charcoal pill */
  bg: var(--bg-surface-1); color: var(--ink);
  padding: 10px 15px; radius: 100px

.btn-translucent   /* lifted secondary on busy bg */
  bg: var(--bg-surface-2); color: var(--ink);
  padding: 8px 14px; radius: 30px

.btn-icon-circular /* 40px circle, social/carousel */
  bg: var(--bg-surface-1); color: var(--ink);
  size: 40px (44px touch); radius: 9999
```

### Inputs / forms

```css
.text-input
  bg: var(--bg-surface-1); type: var(--fs-body);
  radius: 10px; padding: 10px 14px;
  focus: rgba(0,153,255,0.15) 0 0 0 1px (L3, brak chromatic surface change)
```

### Cards

```css
.card-pricing            bg surface-1, radius 20px, padding 24px
.card-pricing-featured   bg surface-2 (lift, NIE chromatic outline)
.card-template           bg surface-1, radius 15px, padding 12px
.card-mockup             bg surface-1, radius 20px, padding 16px
.faq-row                 bg canvas, radius 10px, padding 24px
```

### Pricing tabs

```css
.pricing-tab          bg canvas, color ink-muted, radius 100px
.pricing-tab-selected bg surface-2, color ink (lift = active, no chromatic fill)
```

### Eyebrows / kickery

```css
.eyebrow
  type: var(--fs-caption) 13px/500/-0.13px Inter
  color: var(--ink-muted)
  case: sentence case (NIE uppercase)
  spacing: brak positive tracking, brak orange
```

### Gradient spotlight cards (sygnatura)

```css
.card-spotlight
  bg: var(--gradient-violet)        /* default */
  color: var(--ink)
  type: var(--fs-subhead) 24px/400/-0.01em
  radius: 30px                       /* softer niż 20px content cards */
  padding: 32px
  ZERO border, ZERO shadow

.card-spotlight-orange   { bg: var(--gradient-orange); }
.card-spotlight-magenta  { bg: var(--gradient-magenta); }   /* reserved */
.card-spotlight-coral    { bg: var(--gradient-coral); }     /* reserved */

@media (prefers-reduced-motion: no-preference) {
  /* hero violet ma subtle pan motion 60s, audyt orange static */
}
```

## Komponenty USUWANE z aktualnego Theme.css

```
.btn-primary orange + glow             → rewrite na white pill
.btn-ghost                             → out (zastąpione .btn-secondary)
.chip / .chip-dot                      → out
.feat-icon (orange tile)               → out
.card-featured (orange gradient)       → rewrite na surface-2 lift
.status / .status-dot                  → out
.logo-mark (orange tile z literą)      → out
.logo-wordmark (pulse + radar)         → rewrite plain Mona Sans
.image-glow-border                     → out
.diagonals.css                         → out
.badge-primary (orange)                → rewrite charcoal
.contained-button                      → out
.outlined-button                       → out
.image-border                          → simplify 1px hairline
.meta (mono uppercase orange)          → zastąpione .eyebrow caption
```

## Page-level changes

### Homepage `src/pages/index.astro` (11 sekcji)

| # | Sekcja | Zmiana |
|---|---|---|
| 1 | **Hero** | 2-col: lewa = `display-xxl 110px` headline + `body-lg 18px` subhead (`--ink` białe) + 2 pill CTAs (white primary, charcoal secondary). Prawa = `card-spotlight` violet. Logo wall pod heroem zostaje. **Orbit visual OUT.** |
| 2 | **StatsBand** | 4 stats `display-md 32px` ink + `caption 13px` ink-muted labels. Zero accent. |
| 3 | **Audits** | 3-up grid `card-template` charcoal (Brand/URL/AI bots) + `card-spotlight-orange` premium audyt jako pełnoszerokie tile pod gridem. |
| 4 | **Process** | 4-step stepper: numery `display-lg 62px` ink, krok titles `headline 22px`, descriptions `body 15px` ink-muted. Connector w `--hairline`. **Orange OUT.** |
| 5 | **Differentiators** | 4-up grid `card-template` charcoal. |
| 6 | **Industries** | 6-up 3-col grid surface-1, `headline 22px` + `body-sm 14px` ink-muted. |
| 7 | **Authority** | 4 stat-cards: stat `display-md 32px` ink, source link `caption 13px` `accent-blue` (właściwe użycie blue jako link). |
| 8 | **AuthorsStrip** | 4 autorzy w `card-template` charcoal grid. Avatary `radius full` 80px. Mateusz featured = `surface-2` lift (NIE neon-glow). LinkedIn `accent-blue`. |
| 9 | **RecentArticles** | Featured 16:9 `radius xl 20px` + 2 thumb 4:3 `radius lg 15px`. Hover surface-1 → surface-2. |
| 10 | **FAQ** | 5 details/summary jako `faq-row` (canvas, radius 10px, padding 24px) z `hairline-soft` divider. |
| 11 | **CTABand** | Pure canvas + `display-xl 85px` + 2 pill CTAs. **NIE gradient** (limit 2/page już zużyty). |

### Blog listing `src/pages/blog/index.astro`

- Hero `display-xl 85px` + `subhead 24px` lead. Pure canvas. Filtry kategorii jako `pricing-tab` style.
- Featured artykuł 1 max-szer.: `card-mockup` hero 16:9 `radius xl` + `display-md 32px` + body 15px lead.
- Grid 3-col `card-template` surface-1 + hover surface-2 lift.
- Glass cards backdrop-blur OUT.

### Blog article `src/pages/blog/[slug].astro` + `Article.astro`

- Hero image 1280px max, `radius xl 20px`, NIE full-bleed.
- **Reading column 720px max-width**, body 17-18px line-height 1.65 (Framer premium long-form).
- Sidebar 320px (lg+, sticky top-24): autor (avatar + nazwisko + rola + LinkedIn `accent-blue`), 3 darmowe testy `card-template` mini, share `btn-icon-circular`. Surface-1 bg.
- Inline content :global() w `Article.astro`:
  - Listy: zwykły bullet •, brak orange `::marker`.
  - Tabele: `radius xl 20px`, thead `surface-2`, tbody `surface-1`, hairline-soft dividers.
  - Callouts: `surface-1` bg, `hairline` border-left 1px (NIE accent border).
  - Code: terminal header, 3 kropki `--ink-muted` (NIE traffic lights).
  - Linki inline: `accent-blue` underline.
- Infografiki PNG/SVG zostają (content layer, niezależne od DNA).
- Hero image w body przed 3rd H2 zostaje.

### Navbar `src/components/Navbar.astro`

- Sticky 56px height, bg canvas, `body-sm 14px` text.
- Lewy wordmark `widocznosc.ai` Mona Sans Medium 18px `-0.02em` plain (zero pulse/dot/radar).
- Środek: primary nav links 4-5 pozycji.
- Prawa: `btn-secondary` "Zaloguj się" + `btn-primary` "Uruchom test za darmo".
- Mega menu uproszczony do 1-poziomowego dropdown'u, surface-1 bg, hairline-soft.
- Mobile <810px: hamburger overlay, primary pill zostaje.

### Footer

- Wordmark lewa, 5-6 columns `caption 13px` ink-muted. Hover → ink.
- Padding 64px 32px, hairline-soft column rules.
- Bez orange chip'ów, bez `.meta` mono.

### Podstrony (kontakt.astro, o-nas.astro, narzedzia.astro, pozycjonowanie-ai.astro, autor/, narzedzia/)

Dziedziczą Theme.css + Navbar/Footer = automatycznie pociągnięte. Per-page komponenty (jeśli używają orange/glow) – review w trakcie refactoringu, mechaniczna podmiana klas.

## Anti-patterns wprost ZABRONIONE

- ❌ Gradient na CTABand lub jako section background. Tylko jako CARD.
- ❌ Trzy lub więcej gradient cards w jednym viewporcie.
- ❌ Magenta/coral w iteracji 1.
- ❌ ICEA orange jako CTA fill, kicker color, lub border accent.
- ❌ Light mode (Framer = dark only).
- ❌ Mid-tone gray text outside `--ink-muted`.
- ❌ Bordered ghost buttons. Pill (100px) lub full circle to brand vocabulary.
- ❌ Reduced negative letter-spacing "for accessibility". Reduce SIZE jeśli potrzeba, keep percentage.
- ❌ Box-shadows poza L2/L3.
- ❌ Drugi chromatyczny accent. Monochrome + 1 blue + gradient family.

## Migration / commit sequence

1. `feat(widocznosc-framer): foundation tokens – Theme.css full rewrite + Mona Sans + Inter Variable z OpenType`
2. `feat(widocznosc-framer): nowe komponenty buttons/inputs/cards + gradient spotlight + eyebrow`
3. `feat(widocznosc-framer): usuń stare orange utilities, diagonals, glow effects`
4. `refactor(widocznosc-framer): Navbar plain wordmark + white pill CTA`
5. `refactor(widocznosc-framer): homepage 11 sekcji – Framer DNA`
6. `refactor(widocznosc-framer): blog listing cinematic → monochrome`
7. `refactor(widocznosc-framer): blog article reading column 720 + sidebar surface-1`
8. `refactor(widocznosc-framer): footer dense link grid monochrome`
9. `chore(widocznosc-framer): podstrony (kontakt, o-nas, narzedzia, pozycjonowanie-ai, autor)`
10. `chore(widocznosc-framer): build verification + asset cleanup`

Każdy commit deployowalny – CF Pages auto-deploy daje preview na `feat-widocznosc-framer.widocznosc-ai.pages.dev`.

## Rollback path

Jeśli nowy DNA nie zadziała:
```
git checkout feat/widocznosc-ai-tailcast
```
Stary preview URL `feat-widocznosc-ai-tailcast.widocznosc-ai.pages.dev` nadal aktywny.

## Po pivotcie – update memory

- `feedback_widocznosc_design_dna.md` – zmiana z "Linear baseline + SpaceX hero hybrid + ICEA paleta" na "pure Framer marketing canvas: black + white + accent-blue + gradient family".
- `project_widocznosc_ai_progress.md` – nowy HEAD, nowy branch, nowa sekcja Stan o pivotcie.
- `reference_widocznosc_ai_paths.md` – nowy preview URL alias.
