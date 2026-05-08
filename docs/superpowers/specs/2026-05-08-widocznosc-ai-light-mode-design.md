# widocznosc.ai – Light Mode Design

**Data:** 2026-05-08
**Branch:** `feat/widocznosc-framer` (lub nowy `feat/widocznosc-light-mode`)
**Repo path:** `portals/widocznosc.ai/`
**Spec poprzedzający:** [2026-05-07-widocznosc-ai-framer-design.md](2026-05-07-widocznosc-ai-framer-design.md)

## Cel

Dodać przełącznik light/dark mode dla widocznosc.ai. Light mode ma być **pełnoprawnym brand modem**, nie afterthoughtem – pozycjonuje stronę jako poważne narzędzie B2B (jak Ahrefs, GSC, SEMrush) i daje ulgę użytkownikom z dyskomfortem na dark canvas (astygmatyzm, halacja na 27"+ monitorach).

## Decyzje strategiczne (zatwierdzone w brainstormingu)

| Decyzja | Wybór | Powód |
| --- | --- | --- |
| Initial state | **System preference** (`prefers-color-scheme`) | Standard u tier-1 SaaS. Zaspokaja accessibility, conversion i brand reach bez kompromisu. |
| Visual language | **Stripe/Vercel-like** (off-white `#fafafa`, near-black `#1a1a1a`, accent `#0070d6`) | Engineering tool feel, max kontrast vs istniejący dark mode, mniejsze męczenie oczu niż pure white. |
| Spotlight cards | **Zostają ciemne** w obu motywach | Signature element – violet/orange/magenta/coral gradients to brand DNA. Na białym tle wyglądają jak ekspresyjne kolorowe "okna". |
| Toggle UI | **Sun/moon icon, nav top-right** | Najbardziej znany pattern, mały footprint, binarna interakcja (light ↔ dark) |
| Implementation | **CSS Variables override przez `[data-theme="light"]`** | Wszystkie tokeny już są w `Theme.css`. Zero refactoru klas Tailwind. |

## Architecture

### Token override pattern

```css
:root {
  /* Dark tokens – default + safe fallback */
  --bg-canvas: #0a0a0b;
  --ink: #ffffff;
  /* ...existing tokens */
}

:root[data-theme="light"] {
  /* Light overrides – wszystkie tokeny które się zmieniają */
  --bg-canvas: #fafafa;
  --ink: #1a1a1a;
  /* ...override block */
}
```

`@theme` block (Tailwind 4) musi cytować `:root` vars przez `var(--...)` zamiast hardcoded `rgb(...)`. Bez tego Tailwind cache'uje wartości w czasie buildu i override nie zadziała na utility klasach.

### FOUC prevention

Astro SSG = HTML pre-rendered. Bez tego flash dark→light po hydratacji JS. Inline blocking script w `<head>` jako pierwszy element po `<meta charset>`:

```html
<script is:inline>
  (() => {
    try {
      const stored = localStorage.getItem('theme');
      const system = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      const resolved = stored === 'light' || stored === 'dark' ? stored : system;
      document.documentElement.dataset.theme = resolved;
    } catch {
      document.documentElement.dataset.theme = 'dark';
    }
  })();
</script>
```

Charakterystyka: ~150 bajtów po minify, IIFE bez globalnych side-effectów, try/catch dla Safari private mode, fallback do `dark` (brand default). Synchroniczne `matchMedia` wykonuje się przed pierwszym paintem.

## Token Map – Light Overrides

```css
:root[data-theme="light"] {
  /* Surface ladder – inverted */
  --bg-canvas: #fafafa;
  --bg-surface-1: #f0f0f1;
  --bg-surface-2: #e6e6e8;
  --bg-inverse: #0a0a0b;

  /* Hairlines – translucent black */
  --hairline: rgba(0, 0, 0, 0.10);
  --hairline-soft: rgba(0, 0, 0, 0.06);

  /* Ink */
  --ink: #1a1a1a;
  --ink-muted: #666666;

  /* Accent – ściemniony do WCAG AA na białym */
  --accent-blue: #0070d6;
  --accent-blue-soft: rgba(0, 112, 214, 0.12);

  /* Semantic */
  --success-green: #15803d;

  /* Spotlight gradients ZOSTAJĄ ciemne (signature) */
  /* --gradient-violet, orange, magenta, coral – bez zmian */

  /* Elevation – soft drop shadow zamiast inset white */
  --shadow-l2:
    0 1px 2px rgba(0, 0, 0, 0.04),
    0 8px 24px rgba(0, 0, 0, 0.08);
  --shadow-l3: 0 0 0 2px rgba(0, 112, 214, 0.20);
}
```

### Wartości – uzasadnienie

- **`#fafafa`** zamiast `#ffffff` – Inter Variable + Mona Sans renderują się ostrzej, mniej męczą wzrok, standard u Stripe.
- **`#1a1a1a`** zamiast pure black – kontrast 11.5:1 vs `#fafafa` (`#000` daje 12.6:1, agresywny). Miękej, bardziej "engineered".
- **Accent `#0070d6`** – `#0099ff` na białym ma kontrast 3.32:1 (WCAG FAIL). `#0070d6` daje 4.92:1 (AA pass dla normal text).
- **`--bg-inverse: #0a0a0b`** – odwrotność dark mode (`#ffffff`). Używane w `btn-primary`. W light mode = ciemny button + biały tekst (zachowuje hierarchię odwrotnego kontrastu).

## Komponenty – Audit & Override List

### Bez zmian (używają tylko `var()`)

`.btn-primary`, `.btn-icon-circular`, `.text-input`, `.form-input`, `.card-pricing`, `.card-template`, `.card-mockup`, `.card-floating`, `.card`, `.badge-primary`, `.badge-neutral`, `.eyebrow`, `.logo-wordmark`, `.contained-button`, `.outlined-button`, `.faq-row`, `.pricing-tab`, `.content-container`, typography (`h1-h4`, `.display-*`, `.block-title`, `.content-text-*`), `.prose-framer a`, `.article-body a`.

### Wymagają explicit overrides

**1. `.btn-secondary`** – używa hardcoded `rgba(255, 255, 255, 0.05)` (background) i `rgba(255, 255, 255, 0.10)` (border). W light mode te białe rgba znikają na białym tle. Override:

```css
[data-theme="light"] .btn-secondary {
  background: rgba(0, 0, 0, 0.04);
  border-color: rgba(0, 0, 0, 0.10);
}
[data-theme="light"] .btn-secondary:hover {
  background: rgba(0, 0, 0, 0.08);
  border-color: rgba(0, 0, 0, 0.18);
}
```

**2. `.btn-translucent:hover`** – `rgba(255, 255, 255, 0.12)`. Override do `rgba(0, 0, 0, 0.08)`.

**3. `.modal-backdrop::backdrop`** – obecnie `rgba(10, 10, 11, 0.85)`. W light mode `rgba(0, 0, 0, 0.5)` (klasyczne dimming).

**4. Spotlight cards content** – cards zostają ciemne, ale tekst i CTA wewnątrz musi być **białe niezależnie od motywu**:

```css
.card-spotlight :where(h1, h2, h3, h4, p) { color: #fff; }
.card-spotlight .btn-secondary {
  background: rgba(255, 255, 255, 0.10);
  border-color: rgba(255, 255, 255, 0.20);
  color: #fff;
}
```

Hardcoded `#fff` zamiast `var(--ink)` – w light mode `--ink` to `#1a1a1a`, czarny tekst na violet gradient = nieczytelny.

### Audyt poza Theme.css

```bash
grep -rn "bg-white\|bg-black\|text-white\|text-black\|#0a0a0b\|#ffffff\|rgba(255" \
  portals/widocznosc.ai/src/components/ \
  portals/widocznosc.ai/src/layouts/ \
  portals/widocznosc.ai/src/pages/
```

Spodziewane miejsca do poprawki (do potwierdzenia w fazie implementacji):
- Hero spotlight section
- AuthorsStrip (avatar ringi)
- Authority research cards (niebieski accent border)
- RecentArticles 3-up grid (border colors)
- Tools page hero (`url-check`, `ai-bots-check`)

## Toggle Component

Plik: `src/components/ThemeToggle.astro`

```astro
---
// src/components/ThemeToggle.astro
---
<button id="theme-toggle" type="button" class="theme-toggle" aria-label="Zmień motyw">
  <svg class="theme-toggle__sun" aria-hidden="true" viewBox="0 0 20 20"><!-- sun path --></svg>
  <svg class="theme-toggle__moon" aria-hidden="true" viewBox="0 0 20 20"><!-- moon path --></svg>
</button>

<script>
  const btn = document.getElementById('theme-toggle');
  const root = document.documentElement;

  function updateAria() {
    const current = root.dataset.theme;
    btn.setAttribute('aria-label',
      current === 'dark' ? 'Włącz tryb jasny' : 'Włącz tryb ciemny'
    );
  }
  updateAria();

  btn.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    localStorage.setItem('theme', next);
    updateAria();
  });

  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
      root.dataset.theme = e.matches ? 'dark' : 'light';
      updateAria();
    }
  });
</script>
```

### Style

```css
.theme-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  color: var(--ink-muted);
  border-radius: var(--r-full);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.theme-toggle:hover {
  background: var(--bg-surface-1);
  color: var(--ink);
}

.theme-toggle__sun,
.theme-toggle__moon { width: 18px; height: 18px; }

[data-theme="dark"] .theme-toggle__sun { display: block; }
[data-theme="dark"] .theme-toggle__moon { display: none; }
[data-theme="light"] .theme-toggle__sun { display: none; }
[data-theme="light"] .theme-toggle__moon { display: block; }

@media (pointer: coarse) {
  .theme-toggle { width: 44px; height: 44px; }
}
```

### Placement

- **Desktop:** w nav między linkami a CTA "Sprawdź widoczność" (po prawej, przed buttonem)
- **Mobile:** w drawer menu jako pierwszy element nad linkami

### Behavior

- Click: `dark ↔ light`, persist do localStorage, update `data-theme`
- ARIA label: dynamic, opisuje **akcję** ("Włącz tryb jasny"), nie stan
- Crossfade ikony 200ms, no rotation gimmick
- W dark mode pokazuje słońce (kliknij → light); w light mode pokazuje księżyc (kliknij → dark)
- Touch target 44px na mobile (CSS `@media (pointer: coarse)`)

## Cleanup wymagany w istniejącym `Theme.css`

`@theme` block musi przepisać hardcoded `rgb(...)` na `var(--...)`:

```css
@theme {
  /* PRZED: --color-canvas: rgb(10, 10, 11); */
  /* PO:    --color-canvas: var(--bg-canvas); */
  --color-canvas: var(--bg-canvas);
  --color-surface-1: var(--bg-surface-1);
  --color-surface-2: var(--bg-surface-2);
  /* ... wszystkie color tokens */
}
```

Bez tego Tailwind 4 nie respektuje override'ów.

## Testing & Verification

### Manual visual QA – scenariusze

1. **Cold load – system dark** → strona od razu w dark, zero flash
2. **Cold load – system light** → strona od razu w light, zero flash
3. **Toggle persistence** → klik w light, F5, strona zostaje w light
4. **Override revert** → wyczyść localStorage, F5, strona wraca do system preference
5. **System change runtime** → DevTools `prefers-color-scheme` toggle, strona auto-aktualizuje (tylko gdy brak override w localStorage)

### Strony do przejścia

```
✓ /                            homepage
✓ /narzedzia/url-check         + uruchomić test, sprawdzić result UI
✓ /narzedzia/ai-bots-check     + uruchomić test
✓ /artykul/[dowolny]           article body, FAQ, author bio
✓ /autorzy/[autor]             AuthorsStrip, author cards
✓ Mobile (DevTools 375px)      drawer + theme toggle
```

### WCAG AA contrast verification

Chrome DevTools `Inspect → Contrast ratio`:
- Body text (`--ink` na `--bg-canvas`) – cel ≥4.5:1
- Muted text (`--ink-muted` na `--bg-canvas`) – cel ≥4.5:1
- Accent links (`--accent-blue` na `--bg-canvas`) – cel ≥4.5:1
- Buttons (text na bg buttonu) – cel ≥4.5:1

### Build verification

```bash
cd portals/widocznosc.ai
pnpm build
```

Cel: 22 strony build OK (jak przed zmianą), brak warning'ów, FOUC script pierwszy w `<head>` w `dist/index.html`.

### Lighthouse

`pnpm preview` + Lighthouse audit homepage w obu motywach. Cel: brak regresji w accessibility (utrzymać 100 albo blisko).

## Out of Scope

- Browser compat poniżej Safari 14 / Chrome 88 (data-theme + CSS vars wszędzie działają)
- E2E playwright test dla theme toggle (manual QA wystarczy dla 1-feature change)
- Print stylesheet override (niski priorytet, fix tylko jeśli się okaże że ktoś faktycznie drukuje)
- 3-state segmented control (Light | System | Dark) – binarne toggle wystarczy przy default = system preference
- Light variant spotlight gradients – zostają ciemne w obu motywach (signature)

## Lista plików dotkniętych zmianą

**Modyfikacje:**
- `portals/widocznosc.ai/src/styles/Theme.css` – dodanie `:root[data-theme="light"]` block, cleanup `@theme` (hardcoded → var()), overrides dla `.btn-secondary`/`.btn-translucent`/`.modal-backdrop`/spotlight content
- `portals/widocznosc.ai/src/layouts/Layout.astro` – inline FOUC script w `<head>`
- `portals/widocznosc.ai/src/components/Navbar.astro` – wstawienie `<ThemeToggle />` w desktop nav i mobile drawer

**Nowe:**
- `portals/widocznosc.ai/src/components/ThemeToggle.astro` – komponent toggler

**Audyt + ewentualne poprawki:**
- Komponenty z hardcoded kolorami w `src/components/`, `src/layouts/`, `src/pages/` (do zmapowania w fazie implementacji)
