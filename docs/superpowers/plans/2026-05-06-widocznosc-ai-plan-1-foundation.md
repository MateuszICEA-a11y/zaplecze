# widocznosc.ai – Plan 1: Foundation + Brand + Content Infra

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Postawić fundament Astro projektu w monorepo workspace, dostarczyć brand tokens + finalne logo, content collections z Zod, 5 templates z 18 współdzielonymi komponentami, SEO infrastructure, RODO foundation, deploy na CF Pages, impeccable design QA. **Wynik:** działający portal `widocznosc.ai` na CF Pages preview z sample contentem (1 pillar + 2 articles + 4 author profiles), w pełni stylowany, testowalny end-to-end.

**Architecture:** Astro 5 SSG-first w monorepo workspace (pnpm), Cloudflare Pages deploy, Tailwind CSS z paletą ICEA, Content Collections (Zod), MDX dla artykułów, View Transitions, native image optimization. Komponenty Astro z React tylko jako P2 (narzędzie). Pipeline content writer pozostaje w `pipeline/` (osobny plan).

**Tech Stack:** Astro 5, TypeScript, Tailwind CSS, MDX, Zod, pnpm workspace, Cloudflare Pages, Cloudflare D1 (init only), GitHub Actions, Playwright (smoke), Vitest (unit), axe-playwright (a11y), Lighthouse CI, impeccable (design QA).

**Spec reference:** `docs/superpowers/specs/2026-05-06-widocznosc-ai-design.md` (sekcje 2-6, 9)

---

## Pre-flight: Decyzje blokujące start

Ten plan wymaga rozstrzygnięcia 4 pytań przed Task 1. User powinien je potwierdzić lub uzupełnić odpowiedziami.

| # | Pytanie | Default zaproponowany w planie |
|---|---|---|
| 1 | Roobert font webfont license | **Manrope variable** (OFL, geometryczny) jako MVP. Roobert dodajemy jako swap kiedy ICEA udostępni licencję. Path `public/fonts/Roobert-*.woff2` zostawiony pusty z notatką. |
| 2 | Email mailbox dla leadów | **`m.wisniewski@grupa-icea.pl` (testowy MVP)** – User-confirmed 2026-05-06. Wszystkie lead-y (formularz audytu, formularz kontaktu, alerty narzędzia) lecą tu na czas dev/MVP. Docelowy `hello@widocznosc.ai` skonfigurujemy w Plan 5 (Launch). |
| 3 | Cloudflare account dla widocznosc.ai | **Ten sam co busmaniak.pl** (account-level limit nie jest jeszcze problemem). Account ID + API token z istniejących GitHub secrets. |
| 4 | Tożsamość Administratora Danych ICEA | Plan zostawia placeholder `{{ICEA_LEGAL_NAME}}`, `{{ICEA_ADDRESS}}`, `{{ICEA_NIP}}`, `{{ICEA_RODO_EMAIL}}` w polityce prywatności – user wypełni przed publikacją (Plan 5: Launch). |

**Akcja przed startem:** User potwierdza defaults lub podaje konkretne wartości.

---

## File Structure Map

```
transformacja-zaplecza-seo/
├── package.json                            # NEW (workspace root)
├── pnpm-workspace.yaml                      # NEW
├── .gitignore                               # MODIFIED (dodać Astro/node patterns)
├── .env.example                             # NEW (lub MODIFIED jeśli exists)
├── .github/workflows/widocznosc-deploy.yml  # NEW
└── portals/widocznosc.ai/                   # NEW (cały projekt)
    ├── package.json
    ├── astro.config.mjs
    ├── tailwind.config.mjs
    ├── tsconfig.json
    ├── wrangler.toml                        # CF Pages + D1 config
    ├── playwright.config.ts
    ├── vitest.config.ts
    ├── lighthouserc.json
    ├── .gitignore
    ├── public/
    │   ├── fonts/                           # Manrope woff2 + Roobert placeholder
    │   ├── images/
    │   │   ├── logo-mark.svg
    │   │   ├── logo-wordmark.svg
    │   │   ├── logo-full.svg
    │   │   └── og-default.jpg
    │   ├── favicon.svg
    │   ├── favicon-32x32.png
    │   ├── apple-touch-icon.png
    │   └── robots.txt
    ├── src/
    │   ├── content/
    │   │   ├── config.ts                    # Zod schemas (4 collections)
    │   │   ├── pillar/_sample.mdx
    │   │   ├── articles/modele-ai/_sample.mdx
    │   │   ├── case-studies/_sample.mdx
    │   │   └── authors/{tomasz-czechowski,piotr-wicenciak,mateusz-wisniewski,michal-ziach}.mdx
    │   ├── components/
    │   │   ├── Header.astro
    │   │   ├── Footer.astro
    │   │   ├── Breadcrumb.astro
    │   │   ├── Hero.astro
    │   │   ├── AuthorBox.astro
    │   │   ├── AuthorMeta.astro
    │   │   ├── RelatedCards.astro
    │   │   ├── FAQ.astro
    │   │   ├── TableOfContents.astro
    │   │   ├── Callout.astro
    │   │   ├── Comparison.astro
    │   │   ├── Stats.astro
    │   │   ├── Quote.astro
    │   │   ├── CTA.astro
    │   │   ├── ServiceOfferCard.astro
    │   │   ├── SchemaJsonLd.astro
    │   │   ├── Image.astro
    │   │   ├── Infographic.astro
    │   │   └── HeroImage.astro
    │   ├── layouts/
    │   │   ├── BaseLayout.astro             # wspólny shell (head, header, footer)
    │   │   ├── PillarLayout.astro
    │   │   ├── ArticleLayout.astro
    │   │   ├── AuthorLayout.astro
    │   │   └── ToolLayout.astro             # placeholder (full content w Plan 4)
    │   ├── pages/
    │   │   ├── index.astro                  # homepage
    │   │   ├── o-nas.astro
    │   │   ├── polityka-prywatnosci.astro
    │   │   ├── kontakt.astro
    │   │   ├── autorzy.astro
    │   │   ├── narzedzia/audyt-widocznosci-ai.astro  # placeholder, Plan 4
    │   │   ├── pozycjonowanie-ai/[...slug].astro
    │   │   ├── baza-wiedzy/[...slug].astro
    │   │   ├── autor/[slug].astro
    │   │   ├── llms.txt.ts                  # generator
    │   │   └── llms-full.txt.ts             # generator
    │   ├── lib/
    │   │   ├── seo.ts                       # canonical, OG generator
    │   │   ├── schema.ts                    # JSON-LD generators per type
    │   │   ├── breadcrumbs.ts
    │   │   ├── reading-time.ts
    │   │   └── content-helpers.ts
    │   └── styles/
    │       ├── global.css                   # CSS variables, base
    │       └── fonts.css                    # @font-face
    └── tests/
        ├── unit/
        │   ├── lib/seo.test.ts
        │   ├── lib/schema.test.ts
        │   └── lib/breadcrumbs.test.ts
        ├── schema/
        │   └── content-collections.test.ts
        └── e2e/
            ├── homepage.spec.ts
            └── a11y.spec.ts
```

**Decyzje strukturalne:**
- `BaseLayout.astro` ma jeden `<slot>` + `<head>` + `<Header>` + `<Footer>`. Każdy template-specific layout extending BaseLayout dodaje swoją strukturę między slotami.
- Pages routing: dynamic routes `[...slug].astro` per top-level kategoria (pozycjonowanie-ai, baza-wiedzy) bo Astro lubi getStaticPaths z content collections.
- Komponenty Astro tylko (zero React/Vue/Svelte w Plan 1) – React island dorzucamy w Plan 4 dla narzędzia.
- `lib/` separates pure functions (testowalne w Vitest bez Astro renderera) od komponentów.

---

## Task 1: Bootstrap monorepo workspace

**Files:**
- Create: `package.json` (root)
- Create: `pnpm-workspace.yaml`
- Modify: `.gitignore`

- [ ] **Step 1: Install pnpm via official script (no sudo needed)**

Run: `curl -fsSL https://get.pnpm.io/install.sh | SHELL=$(which bash) sh -`
Then in every subsequent Bash call, prefix:
`export PATH="$HOME/.local/share/pnpm:$PATH"`
Verify: `pnpm --version` → `10.33.3` (or newer; plan tested with 10.x)

- [ ] **Step 2: Create `pnpm-workspace.yaml`**

```yaml
packages:
  - 'portals/widocznosc.ai'
```

- [ ] **Step 3: Create root `package.json`**

```json
{
  "name": "transformacja-zaplecza-seo",
  "version": "0.0.0",
  "private": true,
  "packageManager": "pnpm@10.33.3",
  "workspaces": [
    "portals/widocznosc.ai"
  ],
  "scripts": {
    "widocznosc:dev": "pnpm --filter widocznosc.ai dev",
    "widocznosc:build": "pnpm --filter widocznosc.ai build",
    "widocznosc:test": "pnpm --filter widocznosc.ai test"
  }
}
```

- [ ] **Step 4: Modify `.gitignore` – dodaj Node/Astro patterns**

Append to `.gitignore`:

```
# Node / pnpm
node_modules/
.pnpm-store/
*.log

# Astro
dist/
.astro/
.output/

# Cloudflare
.wrangler/
.dev.vars

# IDE
.vscode/
.idea/
```

- [ ] **Step 5: Verify busmaniak.pl Hugo build nie jest naruszony**

Run: `cd portals/busmaniak.pl && hugo --quiet`
Expected: build succeeds without errors. (Sanity check: workspace setup nie blokuje istniejącego portalu.)

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-workspace.yaml .gitignore
git commit -m "chore(monorepo): add pnpm workspace + ignore patterns"
```

---

## Task 2: Init Astro projekt w portals/widocznosc.ai/

**Files:**
- Create: `portals/widocznosc.ai/package.json`
- Create: `portals/widocznosc.ai/astro.config.mjs`
- Create: `portals/widocznosc.ai/tsconfig.json`
- Create: `portals/widocznosc.ai/.gitignore`

- [ ] **Step 1: Create directory + package.json**

```bash
mkdir -p portals/widocznosc.ai/{public/{fonts,images},src/{content,components,layouts,pages,lib,styles},tests/{unit,schema,e2e}}
```

Create `portals/widocznosc.ai/package.json`:

```json
{
  "name": "widocznosc.ai",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "astro": "astro",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "test:a11y": "playwright test tests/e2e/a11y.spec.ts",
    "typecheck": "astro check"
  },
  "dependencies": {
    "astro": "^5.0.0",
    "@astrojs/check": "^0.9.0",
    "@astrojs/cloudflare": "^11.0.0",
    "@astrojs/mdx": "^4.0.0",
    "@astrojs/rss": "^4.0.0",
    "@astrojs/sitemap": "^3.0.0",
    "@astrojs/tailwind": "^5.0.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.6.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@playwright/test": "^1.48.0",
    "@types/node": "^22.0.0",
    "axe-playwright": "^2.0.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Run pnpm install**

Run: `cd portals/widocznosc.ai && pnpm install`
Expected: All deps resolved, `node_modules/` populated, `pnpm-lock.yaml` created. No peer dep warnings critical.

- [ ] **Step 3: Create `astro.config.mjs`**

```javascript
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  site: 'https://widocznosc.ai',
  output: 'static',
  adapter: cloudflare({
    platformProxy: { enabled: true },
  }),
  integrations: [
    tailwind({ applyBaseStyles: false }),
    mdx(),
    sitemap({
      filter: (page) => !page.includes('/admin/'),
    }),
  ],
  i18n: {
    defaultLocale: 'pl',
    locales: ['pl'],
    routing: { prefixDefaultLocale: false },
  },
  build: {
    inlineStylesheets: 'auto',
  },
  vite: {
    optimizeDeps: { exclude: ['@cloudflare/workers-types'] },
  },
});
```

- [ ] **Step 4: Create `tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@layouts/*": ["src/layouts/*"],
      "@lib/*": ["src/lib/*"]
    }
  }
}
```

- [ ] **Step 5: Create local `.gitignore`**

```
node_modules/
dist/
.astro/
.wrangler/
.dev.vars
*.log
```

- [ ] **Step 6: Verify `astro check` runs (typecheck baseline)**

Run: `cd portals/widocznosc.ai && pnpm typecheck`
Expected: 0 errors (no source files yet, ale Astro się inicjuje).

- [ ] **Step 7: Commit**

```bash
git add portals/widocznosc.ai/
git commit -m "feat(widocznosc): init Astro project in monorepo workspace"
```

---

## Task 3: Tailwind config + brand tokens (paleta ICEA)

**Files:**
- Create: `portals/widocznosc.ai/tailwind.config.mjs`
- Create: `portals/widocznosc.ai/src/styles/global.css`
- Create: `portals/widocznosc.ai/src/styles/fonts.css`

- [ ] **Step 1: Write failing test for color contrast**

Create `portals/widocznosc.ai/tests/unit/lib/colors.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';

// Helper – contrast ratio per WCAG 2.1
function contrast(hex1: string, hex2: string): number {
  const lum = (hex: string) => {
    const rgb = hex.match(/[\da-f]{2}/gi)!.map((x) => {
      const c = parseInt(x, 16) / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  };
  const l1 = lum(hex1), l2 = lum(hex2);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

describe('ICEA brand palette WCAG AA contrast', () => {
  it('Off White on Midnight Blue passes AA (>=4.5:1)', () => {
    expect(contrast('#F9F9F9', '#000623')).toBeGreaterThanOrEqual(4.5);
  });
  it('Blue on Midnight Blue passes AA Large (>=3:1)', () => {
    expect(contrast('#5768FF', '#000623')).toBeGreaterThanOrEqual(3);
  });
  it('Orange on Midnight Blue passes AA Large (>=3:1)', () => {
    expect(contrast('#F6704C', '#000623')).toBeGreaterThanOrEqual(3);
  });
});
```

- [ ] **Step 2: Run test – verify it fails (no test runner config yet)**

Run: `cd portals/widocznosc.ai && pnpm test`
Expected: FAIL with config error (no vitest.config.ts yet) OR test runs and passes (jeśli vitest auto-detects).

- [ ] **Step 3: Create `vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts', 'tests/schema/**/*.test.ts'],
  },
});
```

Run: `pnpm test`
Expected: 3 tests pass (palette contrasts spełniają WCAG).

- [ ] **Step 4: Create `tailwind.config.mjs`**

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ICEA brand core
        midnight: '#000623',
        blue: '#5768FF',
        orange: '#F6704C',
        off: '#F9F9F9',
        // UI extension
        surface: { 1: '#0A1037', 2: '#131C4D' },
      },
      fontFamily: {
        sans: ['Manrope', 'Roobert', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"IBM Plex Mono"', 'monospace'],
      },
      fontSize: {
        h1: ['clamp(2.5rem, 5vw, 4rem)', { lineHeight: '1.1', letterSpacing: '-0.01em' }],
        h2: ['2rem', { lineHeight: '1.2', letterSpacing: '-0.005em' }],
        h3: ['1.5rem', { lineHeight: '1.25' }],
        h4: ['1.25rem', { lineHeight: '1.3' }],
        lead: ['1.25rem', { lineHeight: '1.25' }],
        body: ['1.125rem', { lineHeight: '1.5' }],
        small: ['1rem', { lineHeight: '1.5' }],
        caption: ['0.875rem', { lineHeight: '1.5' }],
      },
      spacing: {
        18: '4.5rem',
        128: '32rem',
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 5: Create `src/styles/global.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --color-midnight: #000623;
    --color-blue: #5768FF;
    --color-orange: #F6704C;
    --color-off: #F9F9F9;
    --color-surface-1: #0A1037;
    --color-surface-2: #131C4D;
    --color-border: rgb(249 249 249 / 0.1);
    --color-border-strong: rgb(249 249 249 / 0.18);
    --color-muted: rgb(249 249 249 / 0.6);
    --color-subtle: rgb(249 249 249 / 0.4);
    --color-ring: rgb(87 104 255 / 0.35);
  }

  html {
    background-color: var(--color-midnight);
    color: var(--color-off);
    font-family: theme('fontFamily.sans');
    -webkit-font-smoothing: antialiased;
  }

  body {
    @apply text-body antialiased;
  }

  *:focus-visible {
    outline: 3px solid var(--color-ring);
    outline-offset: 2px;
    border-radius: 4px;
  }

  ::selection {
    background-color: var(--color-blue);
    color: var(--color-off);
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
}
```

- [ ] **Step 6: Create `src/styles/fonts.css`**

```css
/* Manrope – primary (OFL, free) */
@font-face {
  font-family: 'Manrope';
  src: url('/fonts/Manrope-Variable.woff2') format('woff2-variations');
  font-weight: 200 800;
  font-display: swap;
  font-style: normal;
}

/* Roobert – placeholder, swap kiedy ICEA udostępni licencję webfont */
/*
@font-face {
  font-family: 'Roobert';
  src: url('/fonts/Roobert-Regular.woff2') format('woff2');
  font-weight: 400;
  font-display: swap;
}
@font-face {
  font-family: 'Roobert';
  src: url('/fonts/Roobert-Medium.woff2') format('woff2');
  font-weight: 500;
  font-display: swap;
}
*/
```

- [ ] **Step 7: Download Manrope variable font**

Run:
```bash
cd portals/widocznosc.ai/public/fonts
curl -L -o Manrope-Variable.woff2 https://github.com/sharanda/manrope/raw/master/fonts/web/Manrope.var.woff2
```
Verify: `ls -la Manrope-Variable.woff2` → file exists, ~80-100 KB.

- [ ] **Step 8: Commit**

```bash
git add portals/widocznosc.ai/
git commit -m "feat(widocznosc): brand tokens (paleta ICEA + Manrope) + WCAG tests"
```

---

## Task 4: Wygenerować logo widocznosc.ai (kierunek A)

**Files:**
- Create: `portals/widocznosc.ai/public/images/logo-mark.svg`
- Create: `portals/widocznosc.ai/public/images/logo-wordmark.svg`
- Create: `portals/widocznosc.ai/public/images/logo-full.svg`
- Create: `portals/widocznosc.ai/public/favicon.svg`

**Note:** Ten task wymaga ręcznej iteracji z gpt-image-2 + manual SVG cleanup. Nie jest pure-code task. Wynik to deliverable design'erski. Akceptacja przez Usera między Step 3 i Step 4.

- [ ] **Step 1: Wygeneruj 4 warianty logo Direction A przez kie.ai gpt-image-2**

Use existing `pipeline/generate-image.py` jako referencja, ale dla logo używamy bezpośrednio kie.ai API. Run skrypt ad-hoc:

```bash
KIE_API_KEY=$(grep KIE_API_KEY .env | cut -d= -f2) python3 <<'EOF'
import urllib.request, json, time, os

API = "https://api.kie.ai/api/v1/jobs"
KEY = os.environ["KIE_API_KEY"]

PROMPTS = [
    "Minimalist geometric logo wordmark 'widocznosc.ai'. Sans-serif font, deep navy (#000623) background, off-white (#F9F9F9) text, electric blue (#5768FF) accent on '.ai'. Square mark to the left: geometric shape built from triangles suggesting signal decomposition or AI lens. Brand identity, premium, scalable, vector-style flat. No 3D, no gradients, no shadows. 1024x1024.",
    "Minimalist geometric logo wordmark 'widocznosc.ai'. Sans-serif font Manrope-style, deep navy (#000623) background, off-white (#F9F9F9) text, electric blue (#5768FF) accent on '.ai'. Square mark: 4 stacked triangles forming a square (signal pyramid). Premium tech brand. Vector-style flat. 1024x1024.",
    "Logo wordmark 'widocznosc.ai' on deep navy (#000623). Off-white text, electric blue accent on '.ai'. Geometric square mark with diagonal cut suggesting forward motion. Minimal, premium, scalable. Vector-style. 1024x1024.",
    "Logo wordmark 'widocznosc.ai' deep navy (#000623) background, off-white (#F9F9F9) sans-serif text. Square mark: stacked geometric triangles (sygnał AI). Electric blue (#5768FF) accent. Premium tech brand identity. 1024x1024."
]

for i, prompt in enumerate(PROMPTS, 1):
    req = urllib.request.Request(f"{API}/createTask", method="POST",
        headers={"Authorization": f"Bearer {KEY}", "Content-Type": "application/json"},
        data=json.dumps({"model": "gpt-image-2-text-to-image", "input": {"prompt": prompt, "aspect_ratio": "1:1", "resolution": "1K"}}).encode())
    res = json.loads(urllib.request.urlopen(req, timeout=30).read())
    print(f"Variant {i}: taskId={res['data']['taskId']}")
EOF
```

Pollnij każdy task ID przez `recordInfo` co 5s aż status `success`, zapisz URL → `/tmp/logo-variant-{1,2,3,4}.png`.

- [ ] **Step 2: User reviewuje 4 warianty, wybiera 1 (lub prosi o regenerację)**

User decision point. Iterate Step 1 jeśli żaden wariant nie spełnia briefa.

- [ ] **Step 3: Trace wybrany PNG do SVG (vector clean-up)**

Use online tool (vectormagic, autotracer.org) lub `potrace` lokalnie:

```bash
# Convert chosen PNG → bitmap → SVG via potrace
convert /tmp/logo-variant-3.png -threshold 50% /tmp/logo.bmp
potrace /tmp/logo.bmp -s -o /tmp/logo-mark-raw.svg
```

Manual cleanup w editor (Inkscape lub textowo): wyrównanie pathów, palette swap (zostaw tylko Off White + Blue accent), strip unused metadata. Output:

```
portals/widocznosc.ai/public/images/logo-mark.svg     # sam mark, square ~64x64 viewBox
portals/widocznosc.ai/public/images/logo-wordmark.svg # mark + "widocznosc.ai" inline
portals/widocznosc.ai/public/images/logo-full.svg     # mark + "widocznosc.ai" + "marka ICEA" tagline
```

- [ ] **Step 4: Generate favicon set**

```bash
cd portals/widocznosc.ai/public
# SVG favicon (modern browsers)
cp images/logo-mark.svg favicon.svg

# PNG fallbacks via ImageMagick
convert -background "#000623" -resize 32x32 images/logo-mark.svg favicon-32x32.png
convert -background "#000623" -resize 180x180 images/logo-mark.svg apple-touch-icon.png
```

Verify: open `favicon.svg` w browserze, sprawdź czy renderuje się dobrze na ciemnym i jasnym tle.

- [ ] **Step 5: Generate `og-default.jpg` template (1200x630, brand)**

Use kie.ai gpt-image-2 jednorazowo lub manual kompozycja (Figma/Inkscape):

```
Background: Midnight Blue #000623
Center-left: logo-wordmark biały + "marka ICEA" caption
Right: subtle gradient mesh w Blue #5768FF + Orange #F6704C accent
Aspect: 1200x630
Format: JPG, ~150 KB
```

Save as `portals/widocznosc.ai/public/images/og-default.jpg`.

- [ ] **Step 6: Commit**

```bash
git add portals/widocznosc.ai/public/
git commit -m "feat(widocznosc): finalne logo (kierunek A) + favicon set + og-default"
```

---

## Task 5: Content collections + Zod schemas

**Files:**
- Create: `portals/widocznosc.ai/src/content/config.ts`
- Create: `portals/widocznosc.ai/src/content/authors/{tomasz-czechowski,piotr-wicenciak,mateusz-wisniewski,michal-ziach}.mdx`
- Create: `portals/widocznosc.ai/src/content/pillar/_sample-pozycjonowanie-w-chatgpt.mdx`
- Create: `portals/widocznosc.ai/src/content/articles/modele-ai/_sample-chatgpt.mdx`
- Create: `portals/widocznosc.ai/tests/schema/content-collections.test.ts`

- [ ] **Step 1: Write `src/content/config.ts` z 4 collections**

```typescript
import { defineCollection, reference, z } from 'astro:content';

const authorSchema = z.object({
  name: z.string(),
  slug: z.string(),
  role: z.string(),
  company: z.literal('ICEA'),
  bio: z.string(),
  shortBio: z.string().max(280),
  expertise: z.array(z.string()).min(1),
  photo: z.string(),
  email: z.string().email().optional(),
  linkedin: z.string().url().optional(),
  twitter: z.string().url().optional(),
  github: z.string().url().optional(),
  iceaProfile: z.string().url(),
  publishedAt: z.coerce.date(),
});

const faqSchema = z.array(z.object({
  question: z.string(),
  answer: z.string(),
}));

const sourceSchema = z.array(z.object({
  title: z.string(),
  url: z.string().url(),
  accessed: z.coerce.date().optional(),
}));

const heroImageSchema = z.object({
  src: z.string(),
  alt: z.string().min(1, 'Alt text required for a11y'),
  caption: z.string().optional(),
});

const breadcrumbSchema = z.array(z.object({
  name: z.string(),
  url: z.string(),
}));

const pillar = defineCollection({
  type: 'content',
  schema: ({ image }) => z.object({
    title: z.string().max(70),
    metaTitle: z.string().max(60),
    metaDescription: z.string().min(120).max(160),
    primaryKeyword: z.string(),
    searchVolume: z.number().int().nonnegative(),
    intent: z.literal('commercial'),
    hero: z.object({
      headline: z.string(),
      subheadline: z.string(),
      ctaText: z.string(),
      ctaHref: z.string(),
    }),
    serviceOffer: z.object({
      name: z.string(),
      description: z.string(),
      deliverables: z.array(z.string()).min(2),
      priceFrom: z.string().optional(),
      ctaText: z.string(),
      ctaHref: z.string(),
    }),
    relatedArticles: z.array(reference('articles')).optional(),
    caseStudies: z.array(reference('caseStudies')).optional(),
    faq: faqSchema.optional(),
    schema: z.object({
      type: z.enum(['Service', 'Product']),
      breadcrumbs: breadcrumbSchema,
    }),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
    authors: z.array(reference('authors')).min(1),
    draft: z.boolean().default(false),
  }),
});

const articles = defineCollection({
  type: 'content',
  schema: ({ image }) => z.object({
    title: z.string().max(70),
    metaTitle: z.string().max(60),
    metaDescription: z.string().min(120).max(160),
    primaryKeyword: z.string(),
    secondaryKeywords: z.array(z.string()).default([]),
    category: z.enum(['modele-ai', 'pojecia-ai', 'poradniki']),
    subcategory: z.string().optional(),
    intent: z.enum(['educational', 'comparison', 'tutorial']),
    hero: z.object({
      image: image(),
      alt: z.string(),
      caption: z.string().optional(),
    }),
    infographic: z.object({
      image: image(),
      alt: z.string(),
      caption: z.string().optional(),
    }).optional(),
    tldr: z.string().min(50).max(280),
    readingTimeMin: z.number().int().positive(),
    toc: z.boolean().default(true),
    faq: faqSchema.optional(),
    sources: sourceSchema.min(1),
    relatedArticles: z.array(reference('articles')).optional(),
    relatedPillars: z.array(reference('pillar')).optional(),
    schema: z.object({
      type: z.enum(['Article', 'TechArticle', 'HowTo']),
      breadcrumbs: breadcrumbSchema,
    }),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
    authors: z.array(reference('authors')).min(1),
    reviewer: reference('authors').optional(),
    draft: z.boolean().default(false),
  }),
});

const authors = defineCollection({
  type: 'content',
  schema: authorSchema,
});

const caseStudies = defineCollection({
  type: 'content',
  schema: ({ image }) => z.object({
    title: z.string(),
    metaTitle: z.string().max(60),
    metaDescription: z.string().max(160),
    client: z.object({
      name: z.string(),
      industry: z.string(),
      logo: z.string().optional(),
    }),
    challenge: z.string(),
    solution: z.string(),
    results: z.array(z.object({
      metric: z.string(),
      before: z.string(),
      after: z.string(),
    })).min(1),
    testimonial: z.object({
      quote: z.string(),
      author: z.string(),
      role: z.string(),
    }).optional(),
    hero: image(),
    publishedAt: z.coerce.date(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { pillar, articles, authors, caseStudies };
```

- [ ] **Step 2: Create 4 author MDX files**

`src/content/authors/tomasz-czechowski.mdx`:

```mdx
---
name: Tomasz Czechowski
slug: tomasz-czechowski
role: Head of SEO
company: ICEA
shortBio: Head of SEO w ICEA. Specjalizuje się w pozycjonowaniu i optymalizacji pod AI Mode w Google.
bio: |
  Tomasz Czechowski pełni funkcję Head of SEO w ICEA. Specjalizuje się w pozycjonowaniu stron internetowych i optymalizacji wyszukiwarek. Jest odpowiedzialny za strategiczne kierunki SEO w agencji.
expertise:
  - Pozycjonowanie (SEO)
  - Optymalizacja dla wyszukiwarek
  - AI Mode w Google
photo: https://www.grupa-icea.pl/wp-content/uploads/2025/05/Tomasz-Czechowski-scaled.jpg
iceaProfile: https://www.grupa-icea.pl/autor/tomasz-czechowski/
publishedAt: 2026-05-06
---
```

Powtórz dla `piotr-wicenciak.mdx`, `mateusz-wisniewski.mdx`, `michal-ziach.mdx` (dane z fetched ICEA profiles).

- [ ] **Step 3: Write schema validation test**

Create `tests/schema/content-collections.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Replicate author schema lokalnie do testu (bez Astro runtime)
const authorSchema = z.object({
  name: z.string(),
  slug: z.string(),
  role: z.string(),
  company: z.literal('ICEA'),
  bio: z.string(),
  shortBio: z.string().max(280),
  expertise: z.array(z.string()).min(1),
  photo: z.string(),
  iceaProfile: z.string().url(),
  publishedAt: z.coerce.date(),
});

describe('Author schema', () => {
  it('accepts valid author', () => {
    const valid = {
      name: 'Tomasz Czechowski',
      slug: 'tomasz-czechowski',
      role: 'Head of SEO',
      company: 'ICEA',
      bio: 'Lorem ipsum',
      shortBio: 'Short bio',
      expertise: ['SEO'],
      photo: 'https://example.com/x.jpg',
      iceaProfile: 'https://www.grupa-icea.pl/autor/tomasz-czechowski/',
      publishedAt: '2026-05-06',
    };
    expect(authorSchema.parse(valid)).toBeDefined();
  });

  it('rejects shortBio over 280 chars', () => {
    const invalid = {
      name: 'X', slug: 'x', role: 'X', company: 'ICEA',
      bio: 'X', shortBio: 'a'.repeat(281),
      expertise: ['X'], photo: 'x', iceaProfile: 'https://x.pl/',
      publishedAt: '2026-05-06',
    };
    expect(() => authorSchema.parse(invalid)).toThrow();
  });

  it('rejects empty expertise array', () => {
    const invalid = {
      name: 'X', slug: 'x', role: 'X', company: 'ICEA',
      bio: 'X', shortBio: 'X', expertise: [],
      photo: 'x', iceaProfile: 'https://x.pl/',
      publishedAt: '2026-05-06',
    };
    expect(() => authorSchema.parse(invalid)).toThrow();
  });
});
```

- [ ] **Step 4: Run test – verify all pass**

Run: `cd portals/widocznosc.ai && pnpm test`
Expected: 6 tests passing (3 z palety, 3 z author schema).

- [ ] **Step 5: Verify Astro `astro check` przejmuje content collections**

Run: `pnpm typecheck`
Expected: 0 errors. Astro powinno auto-detect collections based on `src/content/config.ts`.

- [ ] **Step 6: Commit**

```bash
git add portals/widocznosc.ai/src/content/ portals/widocznosc.ai/tests/
git commit -m "feat(widocznosc): content collections (Zod) + 4 autorów ICEA"
```

---

## Task 6: BaseLayout + Header + Footer

**Files:**
- Create: `portals/widocznosc.ai/src/layouts/BaseLayout.astro`
- Create: `portals/widocznosc.ai/src/components/Header.astro`
- Create: `portals/widocznosc.ai/src/components/Footer.astro`

- [ ] **Step 1: Create `BaseLayout.astro`**

```astro
---
import '@/styles/global.css';
import '@/styles/fonts.css';
import Header from '@components/Header.astro';
import Footer from '@components/Footer.astro';

interface Props {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  noindex?: boolean;
}

const {
  title,
  description,
  canonical = Astro.url.toString(),
  ogImage = '/images/og-default.jpg',
  noindex = false,
} = Astro.props;

const siteName = 'widocznosc.ai';
const fullTitle = title.includes(siteName) ? title : `${title} | ${siteName}`;
---
<!DOCTYPE html>
<html lang="pl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{fullTitle}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonical} />
    {noindex && <meta name="robots" content="noindex,nofollow" />}

    <!-- Favicons -->
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />

    <!-- OpenGraph + Twitter -->
    <meta property="og:type" content="website" />
    <meta property="og:title" content={fullTitle} />
    <meta property="og:description" content={description} />
    <meta property="og:url" content={canonical} />
    <meta property="og:image" content={new URL(ogImage, Astro.site).toString()} />
    <meta property="og:locale" content="pl_PL" />
    <meta property="og:site_name" content={siteName} />
    <meta name="twitter:card" content="summary_large_image" />

    <!-- Performance hints -->
    <link rel="preload" href="/fonts/Manrope-Variable.woff2" as="font" type="font/woff2" crossorigin />

    <slot name="head" />
  </head>
  <body class="bg-midnight text-off">
    <a href="#main" class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-blue focus:px-4 focus:py-2 focus:text-off">
      Przejdź do treści
    </a>
    <Header />
    <main id="main">
      <slot />
    </main>
    <Footer />
  </body>
</html>
```

- [ ] **Step 2: Create `Header.astro`**

```astro
---
const navLinks = [
  { label: 'Pozycjonowanie AI', href: '/pozycjonowanie-ai/' },
  { label: 'Baza wiedzy', href: '/baza-wiedzy/' },
  { label: 'Narzędzia', href: '/narzedzia/' },
  { label: 'O nas', href: '/o-nas/' },
];
---
<header class="sticky top-0 z-40 border-b border-white/10 bg-midnight/80 backdrop-blur">
  <nav class="mx-auto flex max-w-7xl items-center justify-between px-6 py-4" aria-label="Główna nawigacja">
    <a href="/" class="flex items-center gap-2" aria-label="widocznosc.ai – strona główna">
      <img src="/images/logo-wordmark.svg" alt="widocznosc.ai" class="h-8 w-auto" />
    </a>

    <ul class="hidden items-center gap-8 md:flex">
      {navLinks.map(({ label, href }) => (
        <li>
          <a href={href} class="text-small text-off/80 hover:text-off transition">
            {label}
          </a>
        </li>
      ))}
    </ul>

    <a href="/pozycjonowanie-ai/audyt-widocznosci-ai/" class="rounded-md bg-blue px-4 py-2 text-small font-medium text-off hover:bg-blue/90 transition">
      Zamów audyt
    </a>
  </nav>
</header>
```

(Mega-menu interakcja jest dodawana w późniejszym tasku – tutaj prosty visible nav.)

- [ ] **Step 3: Create `Footer.astro`**

```astro
---
const sections = [
  {
    heading: 'Pozycjonowanie AI',
    links: [
      { label: 'Audyt', href: '/pozycjonowanie-ai/audyt-widocznosci-ai/' },
      { label: 'Optymalizacja', href: '/pozycjonowanie-ai/optymalizacja-pod-llm/' },
      { label: 'Case studies', href: '/pozycjonowanie-ai/case-studies/' },
      { label: 'Konsultacje', href: '/kontakt/' },
    ],
  },
  {
    heading: 'Baza wiedzy',
    links: [
      { label: 'Modele AI', href: '/baza-wiedzy/modele-ai/' },
      { label: 'Pojęcia AI', href: '/baza-wiedzy/pojecia-ai/' },
      { label: 'Poradniki', href: '/baza-wiedzy/poradniki/' },
      { label: 'Wszystkie artykuły', href: '/baza-wiedzy/' },
    ],
  },
  {
    heading: 'Kontakt',
    links: [
      { label: 'm.wisniewski@grupa-icea.pl', href: 'mailto:m.wisniewski@grupa-icea.pl' },
      { label: 'Formularz audytu', href: '/pozycjonowanie-ai/audyt-widocznosci-ai/' },
    ],
  },
];
---
<footer class="mt-24 border-t border-white/10 bg-surface-1">
  <div class="mx-auto max-w-7xl px-6 py-16">
    <div class="grid grid-cols-1 gap-12 md:grid-cols-4">
      <div>
        <img src="/images/logo-full.svg" alt="widocznosc.ai – marka ICEA" class="h-10 w-auto" />
        <p class="mt-4 text-caption text-off/60">
          Komplementarne źródło wiedzy o widoczności marki w AI.
        </p>
      </div>
      {sections.map((section) => (
        <div>
          <h3 class="text-small font-medium text-off">{section.heading}</h3>
          <ul class="mt-4 space-y-2">
            {section.links.map((link) => (
              <li>
                <a href={link.href} class="text-small text-off/70 hover:text-off transition">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>

    <div class="mt-12 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-8 md:flex-row md:items-center">
      <p class="text-caption text-off/60">
        © {new Date().getFullYear()} ICEA. widocznosc.ai jest częścią ekosystemu marki ICEA.
      </p>
      <ul class="flex gap-6 text-caption text-off/60">
        <li><a href="/polityka-prywatnosci/" class="hover:text-off">Polityka prywatności</a></li>
        <li><a href="/sitemap-index.xml" class="hover:text-off">Sitemap</a></li>
      </ul>
    </div>
  </div>
</footer>
```

- [ ] **Step 4: Commit**

```bash
git add portals/widocznosc.ai/src/layouts/ portals/widocznosc.ai/src/components/Header.astro portals/widocznosc.ai/src/components/Footer.astro
git commit -m "feat(widocznosc): BaseLayout + Header + Footer (brand shell)"
```

---

## Task 7: Homepage minimalna (smoke test rendering)

**Files:**
- Create: `portals/widocznosc.ai/src/pages/index.astro`

- [ ] **Step 1: Create `src/pages/index.astro`**

```astro
---
import BaseLayout from '@layouts/BaseLayout.astro';
---
<BaseLayout
  title="widocznosc.ai – Bądź widoczny tam, gdzie szukają Twoi klienci"
  description="Kompleksowe pozycjonowanie marki w AI: ChatGPT, Claude, Gemini, Perplexity. Marka ICEA – Diament Forbesa, semKRK Awards. Sprawdź swoją widoczność w AI."
>
  <section class="mx-auto max-w-7xl px-6 py-24 text-center">
    <h1 class="text-h1 font-medium leading-none">
      Bądź widoczny tam, gdzie szukają Twoi klienci.
    </h1>
    <p class="mx-auto mt-6 max-w-2xl text-lead text-off/80">
      Pozycjonowanie marki w ChatGPT, Claude, Gemini, Perplexity. Komplementarna wiedza o widoczności w AI.
    </p>
    <div class="mt-10 flex flex-wrap items-center justify-center gap-4">
      <a href="/pozycjonowanie-ai/audyt-widocznosci-ai/" class="rounded-md bg-blue px-6 py-3 text-body font-medium text-off hover:bg-blue/90 transition">
        Zamów audyt
      </a>
      <a href="/narzedzia/audyt-widocznosci-ai/" class="rounded-md border border-white/20 px-6 py-3 text-body text-off hover:bg-white/5 transition">
        Sprawdź narzędzie
      </a>
    </div>
  </section>
</BaseLayout>
```

- [ ] **Step 2: Run dev server, verify renders**

Run: `cd portals/widocznosc.ai && pnpm dev`
Expected: server na `http://localhost:4321`, homepage renderuje hero, header, footer. Zero console errors.

Stop: `Ctrl+C`.

- [ ] **Step 3: Run build**

Run: `pnpm build`
Expected: Static output `dist/` z `index.html`. Build time < 30s.

- [ ] **Step 4: Commit**

```bash
git add portals/widocznosc.ai/src/pages/index.astro
git commit -m "feat(widocznosc): homepage placeholder + smoke render"
```

---

## Task 8: 18 współdzielonych komponentów (batch w 3 commitach)

**Files (commit 1 – meta/structural, 6 komponentów):**
- `src/components/Breadcrumb.astro`
- `src/components/Hero.astro`
- `src/components/AuthorBox.astro`
- `src/components/AuthorMeta.astro`
- `src/components/CTA.astro`
- `src/components/SchemaJsonLd.astro`

- [ ] **Step 1: Breadcrumb.astro**

```astro
---
interface Props {
  items: Array<{ name: string; url: string }>;
}
const { items } = Astro.props;
---
<nav aria-label="Ścieżka nawigacyjna" class="mx-auto max-w-7xl px-6 py-4">
  <ol class="flex flex-wrap items-center gap-2 text-caption text-off/60">
    {items.map((item, i) => (
      <li class="flex items-center gap-2">
        {i < items.length - 1 ? (
          <>
            <a href={item.url} class="hover:text-off transition">{item.name}</a>
            <span aria-hidden="true">›</span>
          </>
        ) : (
          <span aria-current="page" class="text-off">{item.name}</span>
        )}
      </li>
    ))}
  </ol>
</nav>
```

- [ ] **Step 2: Hero.astro**

```astro
---
interface Props {
  variant?: 'page' | 'article' | 'tool';
  headline: string;
  subheadline?: string;
  ctaPrimary?: { text: string; href: string };
  ctaSecondary?: { text: string; href: string };
}
const { variant = 'page', headline, subheadline, ctaPrimary, ctaSecondary } = Astro.props;

const padY = variant === 'page' ? 'py-24' : variant === 'article' ? 'py-12' : 'py-16';
---
<section class={`mx-auto max-w-7xl px-6 ${padY}`}>
  <h1 class="text-h1 font-medium">{headline}</h1>
  {subheadline && <p class="mt-6 max-w-3xl text-lead text-off/80">{subheadline}</p>}
  {(ctaPrimary || ctaSecondary) && (
    <div class="mt-10 flex flex-wrap items-center gap-4">
      {ctaPrimary && (
        <a href={ctaPrimary.href} class="rounded-md bg-blue px-6 py-3 text-body font-medium text-off hover:bg-blue/90 transition">
          {ctaPrimary.text}
        </a>
      )}
      {ctaSecondary && (
        <a href={ctaSecondary.href} class="rounded-md border border-white/20 px-6 py-3 text-body text-off hover:bg-white/5 transition">
          {ctaSecondary.text}
        </a>
      )}
    </div>
  )}
</section>
```

- [ ] **Step 3: AuthorBox.astro**

```astro
---
import { getEntry } from 'astro:content';
interface Props {
  authorSlug: string;
}
const { authorSlug } = Astro.props;
const author = await getEntry('authors', authorSlug);
if (!author) throw new Error(`Author not found: ${authorSlug}`);
---
<aside class="mt-12 rounded-lg border border-white/10 bg-surface-1 p-6">
  <div class="flex items-start gap-4">
    <img src={author.data.photo} alt={author.data.name} class="h-16 w-16 rounded-full object-cover" />
    <div class="flex-1">
      <p class="text-h4 font-medium text-off">{author.data.name}</p>
      <p class="text-small text-off/70">{author.data.role} · ICEA</p>
      <p class="mt-2 text-small text-off/80">{author.data.shortBio}</p>
      <div class="mt-3 flex gap-4 text-caption">
        <a href={`/autor/${author.data.slug}/`} class="text-blue hover:underline">Profil autora</a>
        {author.data.linkedin && <a href={author.data.linkedin} rel="noopener" class="text-off/60 hover:text-off">LinkedIn</a>}
      </div>
    </div>
  </div>
</aside>
```

- [ ] **Step 4: AuthorMeta.astro**

```astro
---
import { getEntry } from 'astro:content';
interface Props {
  authorSlug: string;
  publishedAt: Date;
  readingTimeMin: number;
}
const { authorSlug, publishedAt, readingTimeMin } = Astro.props;
const author = await getEntry('authors', authorSlug);
const dateFmt = new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' }).format(publishedAt);
---
<div class="flex items-center gap-3 text-caption text-off/60">
  {author && <img src={author.data.photo} alt="" class="h-8 w-8 rounded-full object-cover" />}
  <a href={author && `/autor/${author.data.slug}/`} class="hover:text-off">
    {author?.data.name}
  </a>
  <span aria-hidden="true">·</span>
  <time datetime={publishedAt.toISOString()}>{dateFmt}</time>
  <span aria-hidden="true">·</span>
  <span>{readingTimeMin} min czytania</span>
</div>
```

- [ ] **Step 5: CTA.astro**

```astro
---
interface Props {
  variant?: 'audit' | 'newsletter' | 'tool';
  heading: string;
  body?: string;
  ctaText: string;
  ctaHref: string;
}
const { variant = 'audit', heading, body, ctaText, ctaHref } = Astro.props;
---
<section class="mx-auto my-16 max-w-4xl rounded-2xl bg-gradient-to-br from-surface-1 to-surface-2 p-12 text-center">
  <h2 class="text-h2 font-medium">{heading}</h2>
  {body && <p class="mx-auto mt-4 max-w-2xl text-body text-off/80">{body}</p>}
  <a href={ctaHref} class="mt-8 inline-block rounded-md bg-blue px-8 py-4 text-body font-medium text-off hover:bg-blue/90 transition">
    {ctaText}
  </a>
</section>
```

- [ ] **Step 6: SchemaJsonLd.astro**

```astro
---
interface Props {
  data: Record<string, unknown> | Array<Record<string, unknown>>;
}
const { data } = Astro.props;
const json = Array.isArray(data) ? data : [data];
---
{json.map((item) => (
  <script type="application/ld+json" set:html={JSON.stringify(item, null, 0)} />
))}
```

- [ ] **Step 7: Commit**

```bash
git add portals/widocznosc.ai/src/components/{Breadcrumb,Hero,AuthorBox,AuthorMeta,CTA,SchemaJsonLd}.astro
git commit -m "feat(widocznosc): meta/structural komponenty (Breadcrumb, Hero, Author, CTA, Schema)"
```

---

## Task 9: 6 komponentów contentowych (FAQ, TOC, Callout, Comparison, Stats, Quote)

**Files:**
- `src/components/FAQ.astro`
- `src/components/TableOfContents.astro`
- `src/components/Callout.astro`
- `src/components/Comparison.astro`
- `src/components/Stats.astro`
- `src/components/Quote.astro`

- [ ] **Step 1: FAQ.astro**

```astro
---
interface Props {
  items: Array<{ question: string; answer: string }>;
  schema?: boolean;
}
const { items, schema = true } = Astro.props;
---
<section class="mx-auto my-16 max-w-4xl px-6">
  <h2 class="text-h2 font-medium">Najczęściej zadawane pytania</h2>
  <dl class="mt-8 divide-y divide-white/10">
    {items.map(({ question, answer }) => (
      <details class="group py-6">
        <summary class="flex cursor-pointer list-none items-center justify-between gap-4 text-h4 font-medium">
          {question}
          <span class="text-blue transition group-open:rotate-45" aria-hidden="true">+</span>
        </summary>
        <div class="mt-4 text-body text-off/80" set:html={answer} />
      </details>
    ))}
  </dl>
</section>
{schema && (
  <script type="application/ld+json" set:html={JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer },
    })),
  })} />
)}
```

- [ ] **Step 2: TableOfContents.astro**

```astro
---
import type { MarkdownHeading } from 'astro';
interface Props {
  headings: MarkdownHeading[];
  minDepth?: number;
  maxDepth?: number;
}
const { headings, minDepth = 2, maxDepth = 3 } = Astro.props;
const visible = headings.filter((h) => h.depth >= minDepth && h.depth <= maxDepth);
---
{visible.length > 0 && (
  <nav aria-label="Spis treści" class="sticky top-24 hidden lg:block">
    <p class="text-caption font-medium uppercase tracking-wide text-off/50">Spis treści</p>
    <ul class="mt-3 space-y-2 border-l border-white/10 pl-4 text-small">
      {visible.map((h) => (
        <li class={h.depth === 3 ? 'pl-3' : ''}>
          <a href={`#${h.slug}`} class="text-off/70 hover:text-off transition">
            {h.text}
          </a>
        </li>
      ))}
    </ul>
  </nav>
)}
```

- [ ] **Step 3: Callout.astro**

```astro
---
interface Props {
  type?: 'info' | 'warning' | 'success';
}
const { type = 'info' } = Astro.props;
const colors = {
  info: 'border-blue/50 bg-blue/10',
  warning: 'border-orange/50 bg-orange/10',
  success: 'border-emerald-400/50 bg-emerald-400/10',
};
---
<aside class={`my-6 rounded-lg border-l-4 p-4 ${colors[type]}`} role="note">
  <slot />
</aside>
```

- [ ] **Step 4: Comparison.astro**

```astro
---
interface Props {
  left: { title: string; items: string[] };
  right: { title: string; items: string[] };
}
const { left, right } = Astro.props;
---
<div class="my-8 grid grid-cols-1 gap-6 md:grid-cols-2">
  <div class="rounded-lg border border-white/10 bg-surface-1 p-6">
    <h3 class="text-h4 font-medium">{left.title}</h3>
    <ul class="mt-4 space-y-2 text-small">
      {left.items.map((item) => <li class="flex gap-2">→ {item}</li>)}
    </ul>
  </div>
  <div class="rounded-lg border border-white/10 bg-surface-1 p-6">
    <h3 class="text-h4 font-medium">{right.title}</h3>
    <ul class="mt-4 space-y-2 text-small">
      {right.items.map((item) => <li class="flex gap-2">→ {item}</li>)}
    </ul>
  </div>
</div>
```

- [ ] **Step 5: Stats.astro**

```astro
---
interface Props {
  items: Array<{ value: string; label: string }>;
}
const { items } = Astro.props;
---
<dl class="my-8 grid grid-cols-2 gap-6 md:grid-cols-4">
  {items.map(({ value, label }) => (
    <div class="rounded-lg border border-white/10 p-6 text-center">
      <dt class="text-caption uppercase tracking-wide text-off/60">{label}</dt>
      <dd class="mt-2 text-h2 font-medium text-blue">{value}</dd>
    </div>
  ))}
</dl>
```

- [ ] **Step 6: Quote.astro**

```astro
---
interface Props {
  author: string;
  role?: string;
}
const { author, role } = Astro.props;
---
<figure class="my-8 border-l-4 border-blue pl-6">
  <blockquote class="text-lead italic text-off/90">
    <slot />
  </blockquote>
  <figcaption class="mt-3 text-caption text-off/60">
    — {author}{role && `, ${role}`}
  </figcaption>
</figure>
```

- [ ] **Step 7: Commit**

```bash
git add portals/widocznosc.ai/src/components/{FAQ,TableOfContents,Callout,Comparison,Stats,Quote}.astro
git commit -m "feat(widocznosc): content komponenty (FAQ, TOC, Callout, Comparison, Stats, Quote)"
```

---

## Task 10: 6 image/listing komponentów (RelatedCards, ServiceOfferCard, Image, HeroImage, Infographic)

**Files:**
- `src/components/RelatedCards.astro`
- `src/components/ServiceOfferCard.astro`
- `src/components/Image.astro`
- `src/components/HeroImage.astro`
- `src/components/Infographic.astro`

- [ ] **Step 1: RelatedCards.astro**

```astro
---
import { getEntries } from 'astro:content';
interface Props {
  references: Array<{ collection: 'articles' | 'pillar'; slug: string }>;
  count?: number;
}
const { references, count = 3 } = Astro.props;
const entries = await getEntries(references.slice(0, count));
---
<section class="mx-auto my-16 max-w-7xl px-6">
  <h2 class="text-h3 font-medium">Powiązane</h2>
  <ul class="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
    {entries.map((entry) => (
      <li class="rounded-lg border border-white/10 bg-surface-1 p-6 hover:border-blue/50 transition">
        <a href={`/${entry.collection === 'pillar' ? 'pozycjonowanie-ai' : 'baza-wiedzy'}/${entry.slug}/`}>
          <h3 class="text-h4 font-medium text-off">{entry.data.title}</h3>
          <p class="mt-2 text-small text-off/70">{entry.data.metaDescription}</p>
        </a>
      </li>
    ))}
  </ul>
</section>
```

- [ ] **Step 2: ServiceOfferCard.astro**

```astro
---
interface Props {
  name: string;
  description: string;
  deliverables: string[];
  priceFrom?: string;
  ctaText: string;
  ctaHref: string;
  sticky?: boolean;
}
const { name, description, deliverables, priceFrom, ctaText, ctaHref, sticky = false } = Astro.props;
---
<aside class={`rounded-2xl border border-white/10 bg-surface-1 p-8 ${sticky ? 'lg:sticky lg:top-24' : ''}`}>
  <p class="text-caption uppercase tracking-wide text-blue">Usługa ICEA</p>
  <h3 class="mt-2 text-h3 font-medium">{name}</h3>
  <p class="mt-3 text-body text-off/80">{description}</p>
  <ul class="mt-6 space-y-3 text-small">
    {deliverables.map((item) => (
      <li class="flex gap-3">
        <span class="text-blue" aria-hidden="true">✓</span>
        <span>{item}</span>
      </li>
    ))}
  </ul>
  {priceFrom && (
    <p class="mt-6 text-caption text-off/60">
      Od <span class="text-h4 font-medium text-off">{priceFrom}</span>
    </p>
  )}
  <a href={ctaHref} class="mt-6 block rounded-md bg-blue px-6 py-3 text-center text-body font-medium text-off hover:bg-blue/90 transition">
    {ctaText}
  </a>
</aside>
```

- [ ] **Step 3: Image.astro – wrapper nad astro:assets**

```astro
---
import { Image as AstroImage } from 'astro:assets';

interface Props {
  src: ImageMetadata | string;
  alt: string;
  width?: number;
  height?: number;
  loading?: 'lazy' | 'eager';
  caption?: string;
  class?: string;
}
const { src, alt, width = 1024, height = 576, loading = 'lazy', caption, class: className } = Astro.props;
---
<figure class={className}>
  {typeof src === 'string' ? (
    <img src={src} alt={alt} width={width} height={height} loading={loading} />
  ) : (
    <AstroImage src={src} alt={alt} width={width} height={height} loading={loading} />
  )}
  {caption && <figcaption class="mt-2 text-caption text-off/60">{caption}</figcaption>}
</figure>
```

- [ ] **Step 4: HeroImage.astro**

```astro
---
import Image from './Image.astro';
interface Props {
  src: ImageMetadata | string;
  alt: string;
  caption?: string;
}
const { src, alt, caption } = Astro.props;
---
<Image
  src={src}
  alt={alt}
  caption={caption}
  width={1600}
  height={900}
  loading="eager"
  class="my-8 overflow-hidden rounded-2xl"
/>
```

- [ ] **Step 5: Infographic.astro**

```astro
---
import Image from './Image.astro';
interface Props {
  src: ImageMetadata | string;
  alt: string;
  caption?: string;
}
const { src, alt, caption } = Astro.props;
---
<Image
  src={src}
  alt={alt}
  caption={caption}
  width={1024}
  height={1024}
  loading="lazy"
  class="my-12 mx-auto max-w-2xl rounded-lg border border-white/10"
/>
```

- [ ] **Step 6: Commit**

```bash
git add portals/widocznosc.ai/src/components/{RelatedCards,ServiceOfferCard,Image,HeroImage,Infographic}.astro
git commit -m "feat(widocznosc): image + listing komponenty (Related, Service, Image, Hero, Infographic)"
```

---

## Task 11: Lib utilities (seo, schema, breadcrumbs, reading-time)

**Files:**
- `src/lib/seo.ts`
- `src/lib/schema.ts`
- `src/lib/breadcrumbs.ts`
- `src/lib/reading-time.ts`
- `tests/unit/lib/{seo,schema,breadcrumbs,reading-time}.test.ts`

- [ ] **Step 1: Write tests dla `seo.ts`**

`tests/unit/lib/seo.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { canonical, validateMeta } from '@/lib/seo';

describe('canonical()', () => {
  it('returns absolute URL with site prefix', () => {
    expect(canonical('/baza-wiedzy/embeddingi/', 'https://widocznosc.ai')).toBe(
      'https://widocznosc.ai/baza-wiedzy/embeddingi/'
    );
  });
  it('strips query params', () => {
    expect(canonical('/x/?utm=foo', 'https://widocznosc.ai')).toBe('https://widocznosc.ai/x/');
  });
  it('enforces trailing slash', () => {
    expect(canonical('/x', 'https://widocznosc.ai')).toBe('https://widocznosc.ai/x/');
  });
});

describe('validateMeta()', () => {
  it('passes for valid title 50-60 chars', () => {
    expect(() => validateMeta({ title: 'a'.repeat(55), description: 'b'.repeat(140) })).not.toThrow();
  });
  it('fails for title over 60 chars', () => {
    expect(() => validateMeta({ title: 'a'.repeat(61), description: 'b'.repeat(140) })).toThrow();
  });
  it('fails for description under 120 chars', () => {
    expect(() => validateMeta({ title: 'a'.repeat(50), description: 'b'.repeat(100) })).toThrow();
  });
});
```

- [ ] **Step 2: Implement `src/lib/seo.ts`**

```typescript
export function canonical(pathname: string, site: string): string {
  const url = new URL(pathname, site);
  url.search = '';
  if (!url.pathname.endsWith('/')) url.pathname += '/';
  return url.toString();
}

export interface MetaInput {
  title: string;
  description: string;
}

export function validateMeta({ title, description }: MetaInput): void {
  if (title.length > 60) throw new Error(`Title too long: ${title.length} chars (max 60)`);
  if (title.length < 30) throw new Error(`Title too short: ${title.length} chars (min 30)`);
  if (description.length > 160) throw new Error(`Description too long: ${description.length} chars (max 160)`);
  if (description.length < 120) throw new Error(`Description too short: ${description.length} chars (min 120)`);
}
```

- [ ] **Step 3: Run tests – seo passes**

Run: `pnpm test`
Expected: 3 + 3 = 6 nowych passing.

- [ ] **Step 4: Implement `src/lib/breadcrumbs.ts` + tests**

`tests/unit/lib/breadcrumbs.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { buildBreadcrumbs } from '@/lib/breadcrumbs';

describe('buildBreadcrumbs()', () => {
  it('builds 3-level breadcrumb for /baza-wiedzy/modele-ai/chatgpt/', () => {
    const result = buildBreadcrumbs('/baza-wiedzy/modele-ai/chatgpt/');
    expect(result).toEqual([
      { name: 'Strona główna', url: '/' },
      { name: 'Baza wiedzy', url: '/baza-wiedzy/' },
      { name: 'Modele AI', url: '/baza-wiedzy/modele-ai/' },
      { name: 'ChatGPT', url: '/baza-wiedzy/modele-ai/chatgpt/' },
    ]);
  });
  it('handles homepage', () => {
    expect(buildBreadcrumbs('/')).toEqual([{ name: 'Strona główna', url: '/' }]);
  });
});
```

`src/lib/breadcrumbs.ts`:

```typescript
const LABELS: Record<string, string> = {
  '': 'Strona główna',
  'pozycjonowanie-ai': 'Pozycjonowanie AI',
  'baza-wiedzy': 'Baza wiedzy',
  'modele-ai': 'Modele AI',
  'pojecia-ai': 'Pojęcia AI',
  'poradniki': 'Poradniki',
  'narzedzia': 'Narzędzia',
  'autorzy': 'Autorzy',
  'autor': 'Autor',
  'o-nas': 'O nas',
  'kontakt': 'Kontakt',
};

function humanize(slug: string): string {
  if (LABELS[slug]) return LABELS[slug];
  return slug
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ');
}

export function buildBreadcrumbs(pathname: string): Array<{ name: string; url: string }> {
  const segments = pathname.split('/').filter(Boolean);
  const result = [{ name: 'Strona główna', url: '/' }];
  let acc = '';
  for (const seg of segments) {
    acc += `/${seg}`;
    result.push({ name: humanize(seg), url: `${acc}/` });
  }
  return result;
}
```

- [ ] **Step 5: Implement `src/lib/reading-time.ts` + tests**

`tests/unit/lib/reading-time.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { readingTime } from '@/lib/reading-time';

describe('readingTime()', () => {
  it('calculates ~1 min for 200 words', () => {
    const text = 'word '.repeat(200);
    expect(readingTime(text)).toBe(1);
  });
  it('calculates ~5 min for 1000 words', () => {
    const text = 'word '.repeat(1000);
    expect(readingTime(text)).toBe(5);
  });
  it('rounds up to min 1', () => {
    expect(readingTime('one two three')).toBe(1);
  });
});
```

`src/lib/reading-time.ts`:

```typescript
const WORDS_PER_MINUTE = 200;

export function readingTime(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}
```

- [ ] **Step 6: Implement `src/lib/schema.ts` + tests**

`tests/unit/lib/schema.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { breadcrumbListSchema, organizationSchema, articleSchema } from '@/lib/schema';

describe('breadcrumbListSchema()', () => {
  it('returns valid BreadcrumbList JSON-LD', () => {
    const result = breadcrumbListSchema([
      { name: 'Home', url: '/' },
      { name: 'Page', url: '/page/' },
    ], 'https://widocznosc.ai');
    expect(result['@type']).toBe('BreadcrumbList');
    expect(result.itemListElement).toHaveLength(2);
    expect(result.itemListElement[0].position).toBe(1);
  });
});

describe('organizationSchema()', () => {
  it('returns Organization with sameAs array', () => {
    const result = organizationSchema();
    expect(result['@type']).toBe('Organization');
    expect(result.sameAs).toBeInstanceOf(Array);
  });
});
```

`src/lib/schema.ts`:

```typescript
const SITE = 'https://widocznosc.ai';

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'widocznosc.ai',
    url: SITE,
    logo: `${SITE}/images/logo-full.svg`,
    parentOrganization: {
      '@type': 'Organization',
      name: 'ICEA',
      url: 'https://www.grupa-icea.pl',
    },
    sameAs: [
      'https://www.linkedin.com/company/icea-polska/',
    ],
  };
}

export function breadcrumbListSchema(items: Array<{ name: string; url: string }>, site = SITE) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: new URL(item.url, site).toString(),
    })),
  };
}

export function personSchema(author: {
  name: string;
  role: string;
  bio: string;
  photo: string;
  iceaProfile: string;
  linkedin?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: author.name,
    jobTitle: author.role,
    description: author.bio,
    image: author.photo,
    url: author.iceaProfile,
    sameAs: [author.iceaProfile, author.linkedin].filter(Boolean),
    worksFor: { '@type': 'Organization', name: 'ICEA', url: 'https://www.grupa-icea.pl' },
  };
}

export interface ArticleSchemaInput {
  type: 'Article' | 'TechArticle' | 'HowTo';
  title: string;
  description: string;
  url: string;
  image: string;
  publishedAt: Date;
  updatedAt: Date;
  authors: Array<{ name: string; iceaProfile: string }>;
}

export function articleSchema(input: ArticleSchemaInput) {
  return {
    '@context': 'https://schema.org',
    '@type': input.type,
    headline: input.title,
    description: input.description,
    url: input.url,
    image: input.image,
    datePublished: input.publishedAt.toISOString(),
    dateModified: input.updatedAt.toISOString(),
    author: input.authors.map((a) => ({
      '@type': 'Person',
      name: a.name,
      url: a.iceaProfile,
    })),
    publisher: {
      '@type': 'Organization',
      name: 'widocznosc.ai',
      logo: { '@type': 'ImageObject', url: `${SITE}/images/logo-full.svg` },
    },
  };
}

export function faqPageSchema(faq: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer },
    })),
  };
}
```

- [ ] **Step 7: Run all tests**

Run: `pnpm test`
Expected: 6 (palette+author) + 3 (seo) + 2 (breadcrumbs) + 3 (reading-time) + 2 (schema) = 16 passing.

- [ ] **Step 8: Commit**

```bash
git add portals/widocznosc.ai/src/lib/ portals/widocznosc.ai/tests/unit/lib/
git commit -m "feat(widocznosc): lib utilities (seo, schema, breadcrumbs, reading-time) + 16 unit tests"
```

---

## Task 12: 5 layoutów template'owych (Pillar, Article, Author, Tool placeholder, Listing)

**Files:**
- `src/layouts/PillarLayout.astro`
- `src/layouts/ArticleLayout.astro`
- `src/layouts/AuthorLayout.astro`
- `src/layouts/ToolLayout.astro`
- `src/layouts/ListingLayout.astro`

- [ ] **Step 1: PillarLayout.astro**

```astro
---
import BaseLayout from './BaseLayout.astro';
import Breadcrumb from '@components/Breadcrumb.astro';
import Hero from '@components/Hero.astro';
import ServiceOfferCard from '@components/ServiceOfferCard.astro';
import AuthorBox from '@components/AuthorBox.astro';
import FAQ from '@components/FAQ.astro';
import CTA from '@components/CTA.astro';
import RelatedCards from '@components/RelatedCards.astro';
import SchemaJsonLd from '@components/SchemaJsonLd.astro';
import { breadcrumbListSchema, faqPageSchema } from '@lib/schema';

interface Props {
  frontmatter: any;
  url: string;
  authorSlugs: string[];
}
const { frontmatter, url, authorSlugs } = Astro.props;
const breadcrumbs = frontmatter.schema.breadcrumbs;
---
<BaseLayout
  title={frontmatter.metaTitle}
  description={frontmatter.metaDescription}
  canonical={url}
>
  <Breadcrumb items={breadcrumbs} />
  <Hero
    headline={frontmatter.hero.headline}
    subheadline={frontmatter.hero.subheadline}
    ctaPrimary={{ text: frontmatter.hero.ctaText, href: frontmatter.hero.ctaHref }}
  />
  <div class="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 py-12 lg:grid-cols-[1fr_360px]">
    <div class="prose prose-invert max-w-none">
      <slot />
    </div>
    <ServiceOfferCard {...frontmatter.serviceOffer} sticky />
  </div>
  {frontmatter.faq && <FAQ items={frontmatter.faq} />}
  {authorSlugs.length > 0 && <AuthorBox authorSlug={authorSlugs[0]} />}
  <CTA
    heading="Chcesz audyt widoczności w AI?"
    body="Sprawdź, czy ChatGPT, Claude, Gemini i Perplexity znają Twoją markę."
    ctaText="Zamów audyt ICEA"
    ctaHref="/pozycjonowanie-ai/audyt-widocznosci-ai/"
  />
  <SchemaJsonLd data={[
    breadcrumbListSchema(breadcrumbs),
    ...(frontmatter.faq ? [faqPageSchema(frontmatter.faq)] : []),
  ]} />
</BaseLayout>
```

- [ ] **Step 2: ArticleLayout.astro**

```astro
---
import BaseLayout from './BaseLayout.astro';
import Breadcrumb from '@components/Breadcrumb.astro';
import AuthorMeta from '@components/AuthorMeta.astro';
import HeroImage from '@components/HeroImage.astro';
import TableOfContents from '@components/TableOfContents.astro';
import AuthorBox from '@components/AuthorBox.astro';
import FAQ from '@components/FAQ.astro';
import CTA from '@components/CTA.astro';
import SchemaJsonLd from '@components/SchemaJsonLd.astro';
import { articleSchema, breadcrumbListSchema, faqPageSchema } from '@lib/schema';

interface Props {
  frontmatter: any;
  headings: any[];
  url: string;
  authorSlug: string;
  authorData: { name: string; iceaProfile: string };
}
const { frontmatter, headings, url, authorSlug, authorData } = Astro.props;
const breadcrumbs = frontmatter.schema.breadcrumbs;
---
<BaseLayout
  title={frontmatter.metaTitle}
  description={frontmatter.metaDescription}
  canonical={url}
  ogImage={typeof frontmatter.hero.image === 'string' ? frontmatter.hero.image : '/images/og-default.jpg'}
>
  <Breadcrumb items={breadcrumbs} />
  <article class="mx-auto max-w-7xl px-6 py-8">
    <header>
      <h1 class="text-h1 font-medium">{frontmatter.title}</h1>
      <div class="mt-4">
        <AuthorMeta
          authorSlug={authorSlug}
          publishedAt={new Date(frontmatter.publishedAt)}
          readingTimeMin={frontmatter.readingTimeMin}
        />
      </div>
    </header>
    <HeroImage src={frontmatter.hero.image} alt={frontmatter.hero.alt} caption={frontmatter.hero.caption} />
    <div class="grid grid-cols-1 gap-12 lg:grid-cols-[240px_1fr]">
      <TableOfContents headings={headings} />
      <div class="prose prose-invert max-w-none">
        <p class="text-lead text-off/80">{frontmatter.tldr}</p>
        <slot />
        {frontmatter.faq && <FAQ items={frontmatter.faq} schema={false} />}
        {frontmatter.sources?.length > 0 && (
          <section>
            <h2>Źródła</h2>
            <ol>
              {frontmatter.sources.map((s: any) => (
                <li><a href={s.url} rel="noopener nofollow">{s.title}</a></li>
              ))}
            </ol>
          </section>
        )}
      </div>
    </div>
    <AuthorBox authorSlug={authorSlug} />
  </article>
  <CTA
    heading="Potrzebujesz audytu widoczności w AI?"
    ctaText="Sprawdź narzędzie"
    ctaHref="/narzedzia/audyt-widocznosci-ai/"
  />
  <SchemaJsonLd data={[
    breadcrumbListSchema(breadcrumbs),
    articleSchema({
      type: frontmatter.schema.type,
      title: frontmatter.title,
      description: frontmatter.metaDescription,
      url,
      image: typeof frontmatter.hero.image === 'string' ? frontmatter.hero.image : `${Astro.site}images/og-default.jpg`,
      publishedAt: new Date(frontmatter.publishedAt),
      updatedAt: new Date(frontmatter.updatedAt),
      authors: [authorData],
    }),
    ...(frontmatter.faq ? [faqPageSchema(frontmatter.faq)] : []),
  ]} />
</BaseLayout>
```

- [ ] **Step 3: AuthorLayout.astro**

```astro
---
import BaseLayout from './BaseLayout.astro';
import Breadcrumb from '@components/Breadcrumb.astro';
import SchemaJsonLd from '@components/SchemaJsonLd.astro';
import { breadcrumbListSchema, personSchema } from '@lib/schema';

interface Props {
  author: any;
  articles: any[];
  url: string;
}
const { author, articles, url } = Astro.props;
const breadcrumbs = [
  { name: 'Strona główna', url: '/' },
  { name: 'Autorzy', url: '/autorzy/' },
  { name: author.name, url: `/autor/${author.slug}/` },
];
---
<BaseLayout title={`${author.name} – ${author.role}`} description={author.shortBio} canonical={url}>
  <Breadcrumb items={breadcrumbs} />
  <section class="mx-auto max-w-7xl px-6 py-16">
    <div class="grid grid-cols-1 gap-12 md:grid-cols-[280px_1fr]">
      <img src={author.photo} alt={author.name} class="aspect-square w-full rounded-2xl object-cover" />
      <div>
        <h1 class="text-h1 font-medium">{author.name}</h1>
        <p class="mt-2 text-h4 text-blue">{author.role} · ICEA</p>
        <p class="mt-6 text-body text-off/80">{author.bio}</p>
        <ul class="mt-6 flex flex-wrap gap-2">
          {author.expertise.map((tag: string) => (
            <li class="rounded-full border border-white/20 px-3 py-1 text-caption text-off/80">{tag}</li>
          ))}
        </ul>
        <div class="mt-6 flex gap-4 text-small">
          <a href={author.iceaProfile} class="text-blue hover:underline">Profil ICEA</a>
          {author.linkedin && <a href={author.linkedin} class="text-blue hover:underline">LinkedIn</a>}
        </div>
      </div>
    </div>
    {articles.length > 0 && (
      <div class="mt-16">
        <h2 class="text-h2 font-medium">Artykuły autora</h2>
        <ul class="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((a) => (
            <li class="rounded-lg border border-white/10 bg-surface-1 p-6">
              <a href={`/baza-wiedzy/${a.data.category}/${a.slug}/`}>
                <h3 class="text-h4 font-medium">{a.data.title}</h3>
                <p class="mt-2 text-small text-off/70">{a.data.metaDescription}</p>
              </a>
            </li>
          ))}
        </ul>
      </div>
    )}
  </section>
  <SchemaJsonLd data={[
    breadcrumbListSchema(breadcrumbs),
    personSchema(author),
  ]} />
</BaseLayout>
```

- [ ] **Step 4: ToolLayout.astro (placeholder dla Plan 4)**

```astro
---
import BaseLayout from './BaseLayout.astro';
import Hero from '@components/Hero.astro';

interface Props {
  title: string;
  description: string;
}
const { title, description } = Astro.props;
---
<BaseLayout title={title} description={description}>
  <Hero
    variant="tool"
    headline="Narzędzie w przygotowaniu"
    subheadline="AI Visibility Checker uruchomimy w drugim sprincie. Tymczasowo zostaw email a powiadomimy."
  />
  <div class="mx-auto max-w-3xl px-6 py-16">
    <slot />
  </div>
</BaseLayout>
```

- [ ] **Step 5: ListingLayout.astro**

```astro
---
import BaseLayout from './BaseLayout.astro';
import Breadcrumb from '@components/Breadcrumb.astro';

interface Props {
  title: string;
  description: string;
  breadcrumbs: Array<{ name: string; url: string }>;
  items: Array<{ slug: string; data: any; collection: string }>;
}
const { title, description, breadcrumbs, items } = Astro.props;
---
<BaseLayout title={title} description={description}>
  <Breadcrumb items={breadcrumbs} />
  <section class="mx-auto max-w-7xl px-6 py-12">
    <h1 class="text-h1 font-medium">{title}</h1>
    <p class="mt-4 max-w-3xl text-lead text-off/80">{description}</p>
    <ul class="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <li class="rounded-lg border border-white/10 bg-surface-1 p-6 hover:border-blue/50 transition">
          <a href={item.collection === 'pillar' ? `/pozycjonowanie-ai/${item.slug}/` : `/baza-wiedzy/${item.data.category}/${item.slug}/`}>
            <h2 class="text-h4 font-medium">{item.data.title}</h2>
            <p class="mt-2 text-small text-off/70">{item.data.metaDescription}</p>
          </a>
        </li>
      ))}
    </ul>
  </section>
</BaseLayout>
```

- [ ] **Step 6: Commit**

```bash
git add portals/widocznosc.ai/src/layouts/
git commit -m "feat(widocznosc): 5 layout templates (Pillar, Article, Author, Tool, Listing)"
```

---

## Task 13: Sample content (1 pillar + 2 articles + 1 case-study)

**Files:**
- `src/content/pillar/_sample-pozycjonowanie-w-chatgpt.mdx`
- `src/content/articles/modele-ai/_sample-chatgpt.mdx`
- `src/content/articles/pojecia-ai/_sample-rag.mdx`
- `src/content/case-studies/_sample-klient-x.mdx`

- [ ] **Step 1: Sample pillar**

`_sample-pozycjonowanie-w-chatgpt.mdx`:

```mdx
---
title: Pozycjonowanie w ChatGPT – kompletny przewodnik
metaTitle: Pozycjonowanie w ChatGPT 2026 – usługa GEO
metaDescription: Audyt widoczności w ChatGPT i optymalizacja marki pod LLM. Dowiedz się jak być cytowanym przez AI. Marka ICEA.
primaryKeyword: pozycjonowanie w chatgpt
searchVolume: 600
intent: commercial
hero:
  headline: Pozycjonowanie w ChatGPT
  subheadline: Bądź wymieniany kiedy klient pyta ChatGPT o Twoją branżę.
  ctaText: Zamów audyt
  ctaHref: /kontakt/
serviceOffer:
  name: Audyt widoczności w ChatGPT
  description: Pełen audyt obecności marki w ChatGPT z planem optymalizacji.
  deliverables:
    - Raport widoczności w ChatGPT (5 scenariuszy)
    - Lista źródeł cytowanych przez ChatGPT
    - Plan optymalizacji content + linkowania
    - Szacunek wpływu i timeline 90-dniowy
  ctaText: Zamów audyt
  ctaHref: /kontakt/
faq:
  - question: Jak ChatGPT wybiera źródła?
    answer: ChatGPT priorytetyzuje treści autorytatywne, dobrze ustrukturyzowane, z jasnymi definicjami i FAQ schema.
  - question: Czy ChatGPT używa Google?
    answer: ChatGPT z funkcją wyszukiwania używa Bing, ale w trybie standardowym opiera się na danych treningowych.
schema:
  type: Service
  breadcrumbs:
    - { name: Strona główna, url: / }
    - { name: Pozycjonowanie AI, url: /pozycjonowanie-ai/ }
    - { name: Pozycjonowanie w ChatGPT, url: /pozycjonowanie-ai/pozycjonowanie-w-chatgpt/ }
publishedAt: 2026-05-06
updatedAt: 2026-05-06
authors: [tomasz-czechowski]
---

## Co to jest pozycjonowanie w ChatGPT

ChatGPT odpowiada na pytania użytkowników, opierając się na swoich danych treningowych oraz – w trybie wyszukiwania – na bieżących wynikach z Bing. Pozycjonowanie w ChatGPT to optymalizacja contentu, struktury strony i linkowania tak, aby model zauważył i cytował Twoją markę.

## Dlaczego to ma znaczenie

Według badania Profound z marca 2026, 28% użytkowników ChatGPT zadaje pytania o produkty/usługi. Bycie wymienianym = nowy kanał akwizycji.

## Jak ICEA podchodzi do tego procesu

Każdy projekt zaczynamy od audytu (sekcja po prawej) i kończymy 90-dniowym planem optymalizacji.
```

- [ ] **Step 2: Sample article (modele-ai/chatgpt)**

`_sample-chatgpt.mdx`:

```mdx
---
title: ChatGPT – jak działa, jak być widocznym
metaTitle: ChatGPT – kompletny przewodnik dla brandów
metaDescription: Czym jest ChatGPT, jak działa, jak być cytowanym. Praktyczny przewodnik dla decision-makerów. Marka ICEA.
primaryKeyword: chatgpt
secondaryKeywords: [openai chatgpt, chatgpt jak dziala, chatgpt cytowanie]
category: modele-ai
subcategory: chatgpt
intent: educational
hero:
  image: /images/articles/sample-chatgpt-hero.png
  alt: Wizualizacja ChatGPT jako wyszukiwarki AI
tldr: ChatGPT to LLM od OpenAI, który odpowiada na pytania w naturalnym języku. Bycie cytowanym wymaga autorytatywnego contentu, schema markup i obecności w cytowanych przez model źródłach.
readingTimeMin: 8
toc: true
faq:
  - question: Czy ChatGPT cytuje konkretne źródła?
    answer: W trybie wyszukiwania tak, w trybie standardowym podaje informacje bez cytowania.
sources:
  - title: OpenAI ChatGPT documentation
    url: https://platform.openai.com/docs/models
    accessed: 2026-05-06
  - title: arXiv – GPT-4 Technical Report
    url: https://arxiv.org/abs/2303.08774
    accessed: 2026-05-06
schema:
  type: Article
  breadcrumbs:
    - { name: Strona główna, url: / }
    - { name: Baza wiedzy, url: /baza-wiedzy/ }
    - { name: Modele AI, url: /baza-wiedzy/modele-ai/ }
    - { name: ChatGPT, url: /baza-wiedzy/modele-ai/chatgpt/ }
publishedAt: 2026-05-06
updatedAt: 2026-05-06
authors: [mateusz-wisniewski]
reviewer: michal-ziach
---

## Czym jest ChatGPT

ChatGPT to konwersacyjny model AI od OpenAI, oparty na rodzinie GPT (Generative Pre-trained Transformer). Model rozumie i generuje tekst w naturalnym języku.

## Jak ChatGPT decyduje co odpowiedzieć

Model losuje tokeny zgodnie z rozkładem prawdopodobieństwa wyuczonym podczas treningu. W trybie wyszukiwania (od listopada 2024) rozszerza odpowiedź o aktualne wyniki z Bing.

## Jak być widocznym w ChatGPT

Trzy poziomy obecności: dane treningowe, web search, embedded sources. Każdy wymaga innej strategii.
```

- [ ] **Step 3: Sample article (pojecia-ai/rag)**

`_sample-rag.mdx`:

```mdx
---
title: RAG (Retrieval-Augmented Generation) – co to jest
metaTitle: RAG – Retrieval-Augmented Generation w 2026
metaDescription: RAG łączy wyszukiwanie z generacją AI. Dlaczego to fundament chatbotów dla biznesu. Praktyczny przewodnik. Marka ICEA.
primaryKeyword: rag retrieval augmented generation
secondaryKeywords: [co to jest rag, rag chatbot, rag wektorowa baza]
category: pojecia-ai
intent: educational
hero:
  image: /images/articles/sample-rag-hero.png
  alt: Schemat działania RAG
tldr: RAG to architektura, która rozszerza odpowiedzi LLM o informacje pobierane z wektorowej bazy danych. Pozwala AI odpowiadać na podstawie aktualnych, wewnętrznych danych firmy.
readingTimeMin: 12
toc: true
sources:
  - title: arXiv – RAG paper Lewis et al. 2020
    url: https://arxiv.org/abs/2005.11401
    accessed: 2026-05-06
schema:
  type: TechArticle
  breadcrumbs:
    - { name: Strona główna, url: / }
    - { name: Baza wiedzy, url: /baza-wiedzy/ }
    - { name: Pojęcia AI, url: /baza-wiedzy/pojecia-ai/ }
    - { name: RAG, url: /baza-wiedzy/pojecia-ai/rag/ }
publishedAt: 2026-05-06
updatedAt: 2026-05-06
authors: [michal-ziach]
---

## Co to jest RAG

RAG (Retrieval-Augmented Generation) to architektura, w której LLM rozszerza prompt o dane pobrane z zewnętrznego źródła – najczęściej wektorowej bazy danych przechowującej embeddingi dokumentów.

## Dlaczego RAG jest ważny

LLM-y są wytrenowane na danych do określonej daty cutoff. RAG omija to ograniczenie, dostarczając model aktualne, kontekstowe dane przy każdym zapytaniu.

## Architektura

Trzy fazy: indexing (chunking + embedding + zapis do vector DB), retrieval (semantic search po user query), generation (LLM odpowiada z augmented context).
```

- [ ] **Step 4: Sample case study**

`_sample-klient-x.mdx`:

```mdx
---
title: Wzrost widoczności w AI dla e-commerce – Klient X
metaTitle: Case study Klient X – widoczność w ChatGPT
metaDescription: Jak zwiększyliśmy cytowanie marki Klient X w ChatGPT o 240% w 90 dni. Case study ICEA.
client:
  name: Klient X
  industry: e-commerce
challenge: Klient X (sklep online) nie był wymieniany przez ChatGPT przy zapytaniach branżowych mimo silnej obecności w Google.
solution: Wdrożyliśmy 3-fazowy plan – audyt, optymalizacja content i schema, budowa cytowalnych zasobów (raporty, glossary).
results:
  - metric: Cytowanie w ChatGPT
    before: "0 wymienień / 10 zapytań"
    after: "7 wymienień / 10 zapytań"
  - metric: Cytowanie w Perplexity
    before: "12% sesji"
    after: "47% sesji"
testimonial:
  quote: "Po raz pierwszy mamy strategiczną obecność w AI. Marka pojawia się tam, gdzie szukają nasi klienci."
  author: CMO Klient X
  role: Chief Marketing Officer
hero: /images/case-studies/sample-klient-x-hero.png
publishedAt: 2026-05-06
---

## Wyzwanie

Klient X mierzył spadek ruchu organicznego z Google (CTR efekt z AI Overviews), ale nie było rekompensaty z LLM-ów – nikt go nie wymieniał.

## Rozwiązanie

Audyt widoczności w 5 modelach. Optymalizacja content (FAQ schema, BLUF, glossary). Linkowanie do cytowalnych źródeł.

## Wyniki w 90 dniach

Wzrost cytowania w ChatGPT z 0 do 7 wymienień na 10 zapytań branżowych. Wzrost trafficu z Perplexity 4x.
```

- [ ] **Step 5: Generate placeholder hero images**

```bash
cd portals/widocznosc.ai
mkdir -p src/content/articles/modele-ai/sample-chatgpt-hero.png src/content/articles/pojecia-ai/sample-rag-hero.png 2>/dev/null

# Use kie.ai gpt-image-2 for placeholders – or temporarily ImageMagick generated solid color w paletą
mkdir -p public/images/articles public/images/case-studies
convert -size 1600x900 xc:'#000623' -fill '#5768FF' -gravity center -pointsize 64 -annotate 0 "ChatGPT" public/images/articles/sample-chatgpt-hero.png
convert -size 1600x900 xc:'#000623' -fill '#F6704C' -gravity center -pointsize 64 -annotate 0 "RAG" public/images/articles/sample-rag-hero.png
convert -size 1600x900 xc:'#000623' -fill '#5768FF' -gravity center -pointsize 64 -annotate 0 "Klient X" public/images/case-studies/sample-klient-x-hero.png
```

- [ ] **Step 6: Run typecheck (verify content collections walidują się)**

Run: `pnpm typecheck`
Expected: 0 errors. Astro auto-validates content przeciw Zod schemas.

- [ ] **Step 7: Commit**

```bash
git add portals/widocznosc.ai/src/content/ portals/widocznosc.ai/public/images/
git commit -m "feat(widocznosc): sample content (1 pillar + 2 articles + 1 case-study + placeholders)"
```

---

## Task 14: Routes (homepage rozszerzona, autorzy, polityka prywatności, dynamic [...slug])

**Files:**
- `src/pages/index.astro` (modify – pełna homepage)
- `src/pages/o-nas.astro`
- `src/pages/kontakt.astro`
- `src/pages/autorzy.astro`
- `src/pages/autor/[slug].astro`
- `src/pages/polityka-prywatnosci.astro`
- `src/pages/pozycjonowanie-ai/[...slug].astro`
- `src/pages/baza-wiedzy/[...slug].astro`
- `src/pages/baza-wiedzy/index.astro`
- `src/pages/baza-wiedzy/[category]/index.astro`
- `src/pages/narzedzia/index.astro`
- `src/pages/narzedzia/audyt-widocznosci-ai.astro` (placeholder)

- [ ] **Step 1: Rozbuduj homepage z hero + stats + pillar teaser + tool teaser + recent articles + team**

(Use komponenty: Hero, Stats, RelatedCards, AuthorBox)

```astro
---
import BaseLayout from '@layouts/BaseLayout.astro';
import Hero from '@components/Hero.astro';
import Stats from '@components/Stats.astro';
import { getCollection } from 'astro:content';

const recentArticles = (await getCollection('articles', ({ data }) => !data.draft))
  .sort((a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime())
  .slice(0, 6);
const authors = await getCollection('authors');
---
<BaseLayout
  title="widocznosc.ai – Bądź widoczny tam, gdzie szukają Twoi klienci"
  description="Kompleksowe pozycjonowanie marki w AI: ChatGPT, Claude, Gemini, Perplexity. Marka ICEA – Diament Forbesa, semKRK Awards. Sprawdź swoją widoczność w AI."
>
  <Hero
    headline="Bądź widoczny tam, gdzie szukają Twoi klienci."
    subheadline="Pozycjonowanie marki w ChatGPT, Claude, Gemini, Perplexity. Komplementarna wiedza o widoczności w AI."
    ctaPrimary={{ text: 'Zamów audyt', href: '/pozycjonowanie-ai/audyt-widocznosci-ai/' }}
    ctaSecondary={{ text: 'Sprawdź narzędzie', href: '/narzedzia/audyt-widocznosci-ai/' }}
  />
  <Stats items={[
    { value: '15+', label: 'lat ICEA' },
    { value: '5', label: 'modele AI mierzone' },
    { value: '500+', label: 'klientów' },
    { value: '#1', label: 'na semKRK Awards' },
  ]} />
  <section class="mx-auto max-w-7xl px-6 py-16">
    <h2 class="text-h2 font-medium">Najnowsze z bazy wiedzy</h2>
    <ul class="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {recentArticles.map((a) => (
        <li class="rounded-lg border border-white/10 bg-surface-1 p-6 hover:border-blue/50 transition">
          <a href={`/baza-wiedzy/${a.data.category}/${a.slug}/`}>
            <h3 class="text-h4 font-medium">{a.data.title}</h3>
            <p class="mt-2 text-small text-off/70">{a.data.metaDescription}</p>
          </a>
        </li>
      ))}
    </ul>
  </section>
  <section class="mx-auto max-w-7xl px-6 py-16">
    <h2 class="text-h2 font-medium">Nasz zespół</h2>
    <ul class="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      {authors.map((a) => (
        <li class="rounded-lg border border-white/10 bg-surface-1 p-6">
          <a href={`/autor/${a.data.slug}/`}>
            <img src={a.data.photo} alt={a.data.name} class="aspect-square rounded-lg object-cover" />
            <h3 class="mt-4 text-h4 font-medium">{a.data.name}</h3>
            <p class="text-small text-blue">{a.data.role}</p>
            <p class="mt-2 text-small text-off/70">{a.data.shortBio}</p>
          </a>
        </li>
      ))}
    </ul>
  </section>
</BaseLayout>
```

- [ ] **Step 2: O nas, kontakt, polityka prywatności – stub pages**

`src/pages/o-nas.astro`:

```astro
---
import BaseLayout from '@layouts/BaseLayout.astro';
import Hero from '@components/Hero.astro';
---
<BaseLayout title="O nas – widocznosc.ai" description="widocznosc.ai to portal marki ICEA poświęcony pozycjonowaniu w AI. Poznaj nasz zespół i misję.">
  <Hero
    headline="Marka ICEA"
    subheadline="widocznosc.ai jest częścią ekosystemu marki ICEA – polskiej agencji digital marketingu o globalnym zasięgu."
  />
  <section class="prose prose-invert mx-auto max-w-3xl px-6 py-12">
    <p>ICEA jest agencją z ponad 15-letnim doświadczeniem w SEO, performance marketingu i AI. widocznosc.ai to nasze flagowe medium poświęcone widoczności marki w AI.</p>
  </section>
</BaseLayout>
```

`src/pages/kontakt.astro`:

```astro
---
import BaseLayout from '@layouts/BaseLayout.astro';
import Hero from '@components/Hero.astro';
---
<BaseLayout title="Kontakt – widocznosc.ai" description="Kontakt z widocznosc.ai i zespołem ICEA. Zamów audyt widoczności w AI lub konsultację.">
  <Hero headline="Kontakt" subheadline="Napisz – odpowiadamy w ciągu jednego dnia roboczego." />
  <section class="mx-auto max-w-2xl px-6 py-12">
    <p class="text-body">
      Email: <a href="mailto:m.wisniewski@grupa-icea.pl" class="text-blue underline">m.wisniewski@grupa-icea.pl</a>
    </p>
    <p class="mt-4 text-body">
      W sprawach RODO: <a href="mailto:m.wisniewski@grupa-icea.pl" class="text-blue underline">m.wisniewski@grupa-icea.pl</a>
    </p>
  </section>
</BaseLayout>
```

`src/pages/polityka-prywatnosci.astro`:

```astro
---
import BaseLayout from '@layouts/BaseLayout.astro';
---
<BaseLayout title="Polityka prywatności – widocznosc.ai" description="Polityka prywatności widocznosc.ai. Informacja o przetwarzaniu danych osobowych zgodna z RODO.">
  <article class="prose prose-invert mx-auto max-w-3xl px-6 py-16">
    <h1>Polityka prywatności</h1>

    <p>Wersja: 1.0 · Data wejścia w życie: 2026-05-06</p>

    <h2>1. Administrator Danych Osobowych</h2>
    <p>
      Administratorem Twoich danych osobowych jest <strong>{{ICEA_LEGAL_NAME}}</strong> z siedzibą w <strong>{{ICEA_ADDRESS}}</strong>, NIP <strong>{{ICEA_NIP}}</strong>. Kontakt RODO: <a href="mailto:{{ICEA_RODO_EMAIL}}">{{ICEA_RODO_EMAIL}}</a>.
    </p>

    <h2>2. Cele i podstawy prawne przetwarzania</h2>
    <ul>
      <li>Przetwarzanie zapytań kontaktowych i o audyt – podstawa: art. 6 ust. 1 lit. b RODO (umowa)</li>
      <li>Wysyłka kopii raportu z narzędzia AI Visibility Checker – podstawa: art. 6 ust. 1 lit. a RODO (zgoda)</li>
      <li>Marketing usług ICEA – podstawa: art. 6 ust. 1 lit. f RODO (uzasadniony interes)</li>
    </ul>

    <h2>3. Okres retencji</h2>
    <p>Dane lead'ów (formularz audytu, kontakt): 24 miesiące od ostatniej interakcji.</p>

    <h2>4. Sub-processors</h2>
    <ul>
      <li>Cloudflare, Inc. – hosting, CDN, D1 storage. DPA: <a href="https://www.cloudflare.com/cloudflare-customer-dpa/">cloudflare.com/cloudflare-customer-dpa</a></li>
      <li>OpenAI, L.L.C. – LLM API. DPA: <a href="https://openai.com/policies/data-processing-addendum/">openai.com/policies/data-processing-addendum</a></li>
      <li>Anthropic, PBC – LLM API. DPA: <a href="https://www.anthropic.com/legal/dpa">anthropic.com/legal/dpa</a></li>
      <li>Perplexity AI, Inc. – LLM API. DPA: <a href="https://www.perplexity.ai/dpa">perplexity.ai/dpa</a></li>
      <li>Resend, Inc. – transactional email. DPA: <a href="https://resend.com/legal/dpa">resend.com/legal/dpa</a></li>
    </ul>

    <h2>5. Prawa</h2>
    <p>Masz prawo do dostępu, sprostowania, usunięcia, ograniczenia, przenoszenia i sprzeciwu. Skarga do Prezesa UODO.</p>

    <h2>6. Cookies</h2>
    <p>Używamy wyłącznie cookies funkcjonalnych (Cloudflare Turnstile dla bot protection). GA4 i inne pomiary podpinamy w przyszłości za zgodą użytkownika.</p>

    <h2>7. Zmiany</h2>
    <p>Aktualizacje publikujemy w tej polityce, oznaczając wersję i datę zmiany.</p>
  </article>
</BaseLayout>
```

- [ ] **Step 3: Authors listing + dynamic author profile**

`src/pages/autorzy.astro`:

```astro
---
import BaseLayout from '@layouts/BaseLayout.astro';
import Breadcrumb from '@components/Breadcrumb.astro';
import { getCollection } from 'astro:content';

const authors = (await getCollection('authors')).sort((a, b) => a.data.name.localeCompare(b.data.name));
---
<BaseLayout title="Autorzy – widocznosc.ai" description="Eksperci widocznosc.ai i ICEA w zakresie SEO, AI, GEO i pozycjonowania w LLM-ach.">
  <Breadcrumb items={[
    { name: 'Strona główna', url: '/' },
    { name: 'Autorzy', url: '/autorzy/' },
  ]} />
  <section class="mx-auto max-w-7xl px-6 py-12">
    <h1 class="text-h1 font-medium">Autorzy</h1>
    <p class="mt-4 max-w-3xl text-lead text-off/80">Eksperci ICEA piszący dla widocznosc.ai. Każdy artykuł ma realnego autora i recenzenta.</p>
    <ul class="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      {authors.map((a) => (
        <li class="rounded-lg border border-white/10 bg-surface-1 p-6">
          <a href={`/autor/${a.data.slug}/`}>
            <img src={a.data.photo} alt={a.data.name} class="aspect-square rounded-lg object-cover" />
            <h2 class="mt-4 text-h4 font-medium">{a.data.name}</h2>
            <p class="text-small text-blue">{a.data.role}</p>
            <p class="mt-2 text-small text-off/70">{a.data.shortBio}</p>
          </a>
        </li>
      ))}
    </ul>
  </section>
</BaseLayout>
```

`src/pages/autor/[slug].astro`:

```astro
---
import AuthorLayout from '@layouts/AuthorLayout.astro';
import { getCollection, getEntry } from 'astro:content';

export async function getStaticPaths() {
  const authors = await getCollection('authors');
  return authors.map((a) => ({ params: { slug: a.data.slug }, props: { author: a } }));
}

const { author } = Astro.props;
const articles = (await getCollection('articles', ({ data }) => !data.draft && data.authors.some((ref: any) => ref.id === author.data.slug)))
  .sort((a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime());

const url = `${Astro.site}autor/${author.data.slug}/`;
---
<AuthorLayout author={author.data} articles={articles} url={url} />
```

- [ ] **Step 4: Pillar dynamic route**

`src/pages/pozycjonowanie-ai/[...slug].astro`:

```astro
---
import PillarLayout from '@layouts/PillarLayout.astro';
import { getCollection } from 'astro:content';

export async function getStaticPaths() {
  const pillars = await getCollection('pillar', ({ data }) => !data.draft);
  return pillars.map((entry) => ({
    params: { slug: entry.slug },
    props: { entry },
  }));
}

const { entry } = Astro.props;
const { Content } = await entry.render();
const url = `${Astro.site}pozycjonowanie-ai/${entry.slug}/`;
const authorSlugs = entry.data.authors.map((ref: any) => ref.id);
---
<PillarLayout frontmatter={entry.data} url={url} authorSlugs={authorSlugs}>
  <Content />
</PillarLayout>
```

- [ ] **Step 5: Article dynamic route**

`src/pages/baza-wiedzy/[...slug].astro`:

```astro
---
import ArticleLayout from '@layouts/ArticleLayout.astro';
import { getCollection, getEntry } from 'astro:content';

export async function getStaticPaths() {
  const articles = await getCollection('articles', ({ data }) => !data.draft);
  return articles.map((entry) => ({
    params: { slug: `${entry.data.category}/${entry.slug}` },
    props: { entry },
  }));
}

const { entry } = Astro.props;
const { Content, headings } = await entry.render();
const url = `${Astro.site}baza-wiedzy/${entry.data.category}/${entry.slug}/`;
const primaryAuthor = entry.data.authors[0];
const authorEntry = await getEntry('authors', primaryAuthor.id);
---
<ArticleLayout
  frontmatter={entry.data}
  headings={headings}
  url={url}
  authorSlug={primaryAuthor.id}
  authorData={{ name: authorEntry!.data.name, iceaProfile: authorEntry!.data.iceaProfile }}
>
  <Content />
</ArticleLayout>
```

- [ ] **Step 6: Listing pages: baza-wiedzy index, narzedzia stub**

`src/pages/baza-wiedzy/index.astro`:

```astro
---
import ListingLayout from '@layouts/ListingLayout.astro';
import { getCollection } from 'astro:content';

const articles = (await getCollection('articles', ({ data }) => !data.draft))
  .sort((a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime())
  .map((a) => ({ slug: a.slug, data: a.data, collection: 'articles' }));
---
<ListingLayout
  title="Baza wiedzy"
  description="Pełnowartościowe artykuły o modelach AI, pojęciach AI i poradniki praktyczne dla biznesu."
  breadcrumbs={[
    { name: 'Strona główna', url: '/' },
    { name: 'Baza wiedzy', url: '/baza-wiedzy/' },
  ]}
  items={articles}
/>
```

`src/pages/narzedzia/index.astro`:

```astro
---
import BaseLayout from '@layouts/BaseLayout.astro';
import Hero from '@components/Hero.astro';
---
<BaseLayout title="Narzędzia – widocznosc.ai" description="Interaktywne narzędzia do mierzenia widoczności marki w AI. AI Visibility Checker i więcej.">
  <Hero headline="Narzędzia" subheadline="Sprawdź widoczność swojej marki w AI." />
  <section class="mx-auto max-w-7xl px-6 py-12">
    <a href="/narzedzia/audyt-widocznosci-ai/" class="block rounded-2xl border border-white/10 bg-surface-1 p-8 hover:border-blue/50 transition">
      <h2 class="text-h3 font-medium">AI Visibility Checker</h2>
      <p class="mt-2 text-body text-off/80">Sprawdź czy ChatGPT, Claude, Perplexity znają Twoją markę.</p>
    </a>
  </section>
</BaseLayout>
```

`src/pages/narzedzia/audyt-widocznosci-ai.astro`:

```astro
---
import ToolLayout from '@layouts/ToolLayout.astro';
---
<ToolLayout title="AI Visibility Checker – widocznosc.ai" description="Sprawdź jak ChatGPT, Claude i Perplexity widzą Twoją markę. Bezpłatne narzędzie ICEA.">
  <p>Narzędzie zostanie uruchomione w drugim sprincie projektu (Plan 4).</p>
</ToolLayout>
```

- [ ] **Step 7: Run dev, click-through każdy route**

Run: `pnpm dev`
Manually click: `/`, `/o-nas/`, `/kontakt/`, `/polityka-prywatnosci/`, `/autorzy/`, `/autor/tomasz-czechowski/`, `/baza-wiedzy/`, `/baza-wiedzy/modele-ai/sample-chatgpt/`, `/pozycjonowanie-ai/sample-pozycjonowanie-w-chatgpt/`, `/narzedzia/`, `/narzedzia/audyt-widocznosci-ai/`.

Expected: każdy route renderuje bez 404/500. Console: 0 errors.

- [ ] **Step 8: Run build**

Run: `pnpm build`
Expected: dist/ contains static HTML dla wszystkich routes. Build < 30s.

- [ ] **Step 9: Commit**

```bash
git add portals/widocznosc.ai/src/pages/
git commit -m "feat(widocznosc): wszystkie routes (homepage, listing, dynamic [...slug], autorzy, RODO)"
```

---

## Task 15: SEO infrastructure (sitemap, robots.txt, llms.txt)

**Files:**
- `public/robots.txt`
- `src/pages/llms.txt.ts`
- `src/pages/llms-full.txt.ts`

- [ ] **Step 1: Create `public/robots.txt`**

```
User-agent: *
Allow: /

# AI crawlers explicitly allowed
User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: CCBot
Allow: /

User-agent: Bingbot
Allow: /

Sitemap: https://widocznosc.ai/sitemap-index.xml
```

- [ ] **Step 2: Create `src/pages/llms.txt.ts`**

```typescript
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async () => {
  const pillars = await getCollection('pillar', ({ data }) => !data.draft);
  const articles = await getCollection('articles', ({ data }) => !data.draft);

  const lines: string[] = [
    '# widocznosc.ai',
    '',
    '> Portal o widoczności marki w AI – pozycjonowanie w ChatGPT, Claude, Gemini, Perplexity. Część ICEA.',
    '',
    '## Pozycjonowanie AI (usługi)',
    ...pillars.map(
      (p) => `- [${p.data.title}](https://widocznosc.ai/pozycjonowanie-ai/${p.slug}/): ${p.data.metaDescription}`,
    ),
    '',
    '## Baza wiedzy (edukacja)',
    ...articles.map(
      (a) => `- [${a.data.title}](https://widocznosc.ai/baza-wiedzy/${a.data.category}/${a.slug}/): ${a.data.metaDescription}`,
    ),
    '',
  ];

  return new Response(lines.join('\n'), {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
```

- [ ] **Step 3: Create `src/pages/llms-full.txt.ts`**

```typescript
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async () => {
  const pillars = await getCollection('pillar', ({ data }) => !data.draft);
  const articles = await getCollection('articles', ({ data }) => !data.draft);

  const sections: string[] = ['# widocznosc.ai – Full Content', ''];

  for (const p of pillars) {
    sections.push(`## ${p.data.title}`);
    sections.push(`URL: https://widocznosc.ai/pozycjonowanie-ai/${p.slug}/`);
    sections.push('');
    sections.push(p.body);
    sections.push('');
  }

  for (const a of articles.slice(0, 20)) {
    sections.push(`## ${a.data.title}`);
    sections.push(`URL: https://widocznosc.ai/baza-wiedzy/${a.data.category}/${a.slug}/`);
    sections.push(`TLDR: ${a.data.tldr}`);
    sections.push('');
    sections.push(a.body);
    sections.push('');
  }

  return new Response(sections.join('\n'), {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
```

- [ ] **Step 4: Verify dev server serwuje llms.txt + sitemap**

Run: `pnpm dev`
Visit: `http://localhost:4321/llms.txt` – verify markdown response.
Visit: `http://localhost:4321/llms-full.txt` – verify pełen content.
Visit: `http://localhost:4321/robots.txt` – verify static file.

- [ ] **Step 5: Run build, verify sitemap generated**

Run: `pnpm build`
Expected: `dist/sitemap-index.xml` + `dist/sitemap-0.xml` exist.
Verify: `cat dist/sitemap-0.xml | grep -c "<url>"` ≥ 10 (homepage, pages, content collection routes).

- [ ] **Step 6: Commit**

```bash
git add portals/widocznosc.ai/public/robots.txt portals/widocznosc.ai/src/pages/llms*.ts
git commit -m "feat(widocznosc): SEO infrastructure (robots.txt, llms.txt, llms-full.txt)"
```

---

## Task 16: Cloudflare Pages deploy + GitHub Actions

**Files:**
- `portals/widocznosc.ai/wrangler.toml`
- `portals/widocznosc.ai/.dev.vars.example`
- `.github/workflows/widocznosc-deploy.yml`

**Pre-requisites (manual user actions):**
- User loguje się do Cloudflare dashboard
- Tworzy projekt CF Pages "widocznosc-ai" (Connect to Git → repo `transformacja-zaplecza-seo`)
- Build command: `pnpm --filter widocznosc.ai build`
- Build output: `portals/widocznosc.ai/dist`
- Root directory: `/` (cały monorepo)
- Environment variables: pusty na MVP (D1 binding dorzucamy w Plan 4)
- Custom domain: `widocznosc.ai` (po launch, Plan 5)
- API token dla GitHub Actions (R/W na Pages projektu) zapisany jako repo secret `CLOUDFLARE_API_TOKEN`
- Account ID jako repo secret `CLOUDFLARE_ACCOUNT_ID`

- [ ] **Step 1: Create `wrangler.toml`**

```toml
name = "widocznosc-ai"
compatibility_date = "2026-05-06"
pages_build_output_dir = "dist"

[vars]
PUBLIC_SITE_URL = "https://widocznosc.ai"
# Testowy mailbox MVP – wymieniamy na hello@widocznosc.ai w Plan 5 (Launch)
LEAD_INBOX = "m.wisniewski@grupa-icea.pl"

# D1 binding – placeholder, faktyczna konfiguracja w Plan 4
# [[d1_databases]]
# binding = "DB"
# database_name = "widocznosc-leads"
# database_id = "TBD"
```

- [ ] **Step 2: Create `.dev.vars.example`**

```
# Klucze do Plan 4 (AI Visibility Checker) – nie używane w Plan 1
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
PERPLEXITY_API_KEY=
RESEND_API_KEY=
TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
```

- [ ] **Step 3: Create `.github/workflows/widocznosc-deploy.yml`**

```yaml
name: Deploy widocznosc.ai

on:
  push:
    branches: [main]
    paths:
      - 'portals/widocznosc.ai/**'
      - 'package.json'
      - 'pnpm-workspace.yaml'
      - '.github/workflows/widocznosc-deploy.yml'
  pull_request:
    branches: [main]
    paths:
      - 'portals/widocznosc.ai/**'

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      deployments: write
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node + pnpm
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - run: corepack enable

      - name: Cache pnpm store
        uses: actions/cache@v4
        with:
          path: ~/.pnpm-store
          key: pnpm-${{ runner.os }}-${{ hashFiles('**/pnpm-lock.yaml') }}

      - run: pnpm install --frozen-lockfile

      - name: Lint (impeccable detect)
        run: cd portals/widocznosc.ai && npx impeccable detect src/ --json --fast || true
        # `|| true` na MVP – impeccable findings nie blokują deploy, tylko reportują

      - name: Typecheck
        run: pnpm --filter widocznosc.ai typecheck

      - name: Unit + schema tests
        run: pnpm --filter widocznosc.ai test

      - name: Build
        run: pnpm --filter widocznosc.ai build

      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: widocznosc-ai
          directory: portals/widocznosc.ai/dist
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}
```

- [ ] **Step 4: Push branch + verify CI runs**

```bash
git add portals/widocznosc.ai/wrangler.toml portals/widocznosc.ai/.dev.vars.example .github/workflows/widocznosc-deploy.yml
git commit -m "ci(widocznosc): GitHub Actions deploy + wrangler config"
git push origin main
```

Verify: GitHub Actions tab → "Deploy widocznosc.ai" workflow runs.
Expected: build, typecheck, tests pass; deploy succeeds; preview URL `https://<commit-hash>.widocznosc-ai.pages.dev` returned.

- [ ] **Step 5: Visit preview URL, sanity check**

Visit: `https://widocznosc-ai.pages.dev`
Expected: homepage renderuje, click-through working, no console errors.

---

## Task 17: impeccable installation + smoke playwright tests

**Files:**
- `portals/widocznosc.ai/playwright.config.ts`
- `portals/widocznosc.ai/tests/e2e/homepage.spec.ts`
- `portals/widocznosc.ai/tests/e2e/a11y.spec.ts`

- [ ] **Step 1: Install impeccable globally w sesji**

Run: `cd ~/.claude && curl -L https://github.com/pbakaus/impeccable/releases/latest/download/dist-claude-code.tar.gz | tar xz`
Or: `git clone https://github.com/pbakaus/impeccable /tmp/imp && cp -r /tmp/imp/dist/claude-code/.claude/* ~/.claude/`

Verify: `ls ~/.claude/skills/ | grep impeccable` → impeccable skill present.

- [ ] **Step 2: Install Playwright browsers**

Run: `cd portals/widocznosc.ai && pnpm exec playwright install chromium`
Expected: chromium downloaded.

- [ ] **Step 3: Create `playwright.config.ts`**

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
```

- [ ] **Step 4: Create `tests/e2e/homepage.spec.ts`**

```typescript
import { test, expect } from '@playwright/test';

test('homepage renders with hero, header, footer', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('header')).toBeVisible();
  await expect(page.locator('main h1')).toContainText('Bądź widoczny');
  await expect(page.locator('footer')).toContainText('marka ICEA');
  // No console errors
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  await page.waitForLoadState('networkidle');
  expect(errors).toEqual([]);
});

test('navigation: homepage → autorzy → tomasz-czechowski', async ({ page }) => {
  await page.goto('/');
  await page.click('text=O nas');
  await expect(page).toHaveURL(/\/o-nas\//);
  await page.goto('/autorzy/');
  await page.click('text=Tomasz Czechowski');
  await expect(page).toHaveURL(/\/autor\/tomasz-czechowski\//);
  await expect(page.locator('h1')).toContainText('Tomasz Czechowski');
});
```

- [ ] **Step 5: Create `tests/e2e/a11y.spec.ts`**

```typescript
import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

const ROUTES = [
  '/',
  '/o-nas/',
  '/kontakt/',
  '/polityka-prywatnosci/',
  '/autorzy/',
  '/autor/tomasz-czechowski/',
  '/baza-wiedzy/',
];

for (const route of ROUTES) {
  test(`a11y: ${route} – 0 violations`, async ({ page }) => {
    await page.goto(route);
    await injectAxe(page);
    await checkA11y(page, undefined, {
      detailedReport: true,
      detailedReportOptions: { html: false },
    });
  });
}
```

- [ ] **Step 6: Run smoke + a11y tests**

Run: `pnpm test:e2e`
Expected: 2 (smoke) + 7 (a11y per route) = 9 tests passing.

If a11y fails: fix violations inline (najczęściej brak alt text, contrast issues, label association). Don't proceed bez 0 violations.

- [ ] **Step 7: Run impeccable detect**

Run: `cd portals/widocznosc.ai && npx impeccable detect src/ --fast`
Expected: report z findings.
Action: zaadresować critical findings (np. brak focus-visible, nieprawidłowy color contrast). Mniej krytyczne odłóż do P2.

- [ ] **Step 8: Commit**

```bash
git add portals/widocznosc.ai/playwright.config.ts portals/widocznosc.ai/tests/e2e/
git commit -m "test(widocznosc): Playwright smoke + axe a11y (9 tests)"
```

---

## Task 18: Lighthouse CI + final verification

**Files:**
- `portals/widocznosc.ai/lighthouserc.json`

- [ ] **Step 1: Install Lighthouse CI**

Run: `cd portals/widocznosc.ai && pnpm add -D @lhci/cli`

- [ ] **Step 2: Create `lighthouserc.json`**

```json
{
  "ci": {
    "collect": {
      "startServerCommand": "pnpm preview",
      "url": [
        "http://localhost:4321/",
        "http://localhost:4321/o-nas/",
        "http://localhost:4321/baza-wiedzy/",
        "http://localhost:4321/autorzy/",
        "http://localhost:4321/autor/tomasz-czechowski/"
      ],
      "numberOfRuns": 1
    },
    "assert": {
      "preset": "lighthouse:no-pwa",
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.95 }],
        "categories:accessibility": ["error", { "minScore": 0.95 }],
        "categories:best-practices": ["warn", { "minScore": 0.9 }],
        "categories:seo": ["error", { "minScore": 0.95 }]
      }
    }
  }
}
```

- [ ] **Step 3: Run build + Lighthouse**

```bash
pnpm build
pnpm exec lhci autorun
```

Expected: 5 URLs × 4 categories = 20 assertions, wszystkie pass z 95+. Failujące: zaadresuj inline (preload font, image dimensions, alt text).

- [ ] **Step 4: Commit**

```bash
git add portals/widocznosc.ai/lighthouserc.json portals/widocznosc.ai/package.json portals/widocznosc.ai/pnpm-lock.yaml
git commit -m "test(widocznosc): Lighthouse CI z target 95+ na perf/a11y/seo"
```

---

## Task 19: Review checkpoint – User accepts Plan 1

- [ ] **Step 1: Run pełen test suite raz jeszcze**

```bash
cd portals/widocznosc.ai
pnpm test          # Vitest unit + schema (16 tests)
pnpm test:e2e      # Playwright (9 tests)
pnpm typecheck     # 0 errors
pnpm exec lhci autorun  # Lighthouse 95+
```

Expected: wszystko zielone.

- [ ] **Step 2: Verify CF Pages preview działa**

Visit: `https://widocznosc-ai.pages.dev`
Click-through: homepage → autorzy → tomasz-czechowski → baza-wiedzy → sample-chatgpt → pozycjonowanie-ai → sample pillar → narzedzia (placeholder) → polityka prywatności.

Expected: każdy route renderuje, brand consistency, dark theme, brand palette stosowana, 0 console errors.

- [ ] **Step 3: Run impeccable /audit na każdym templateie (manualnie w sesji Claude Code)**

```
/audit src/layouts/PillarLayout.astro
/audit src/layouts/ArticleLayout.astro
/audit src/layouts/AuthorLayout.astro
/audit src/pages/index.astro
```

Expected: rekomendacje znaleziska. Zaadresuj critical, odłóż minor.

- [ ] **Step 4: Sprawdź MVP scope coverage przeciw spec**

| Spec wymaganie | Plan 1 status |
|---|---|
| Astro setup + CF Pages deploy | ✅ Task 2, 16 |
| pnpm-workspace.yaml | ✅ Task 1 |
| Logo finalny SVG | ✅ Task 4 |
| Brand tokens + paleta + Roobert/Manrope decision | ✅ Task 3 (Manrope MVP) |
| OG template | ✅ Task 4 (og-default.jpg) |
| Content collections + Zod | ✅ Task 5 |
| 5 templates | ✅ Task 12 |
| 18 współdzielonych komponentów | ✅ Task 8, 9, 10 (16 z 18 – Phosphor icons + dark mode toggle przesuniete do P2) |
| llms.txt, sitemap, robots | ✅ Task 15 |
| RODO foundation (polityka prywatności + consent log) | ✅ Task 14 (polityka, consent log w D1 dorzucamy w Plan 4) |
| impeccable installed + CI | ✅ Task 16, 17 |
| Schema.org JSON-LD | ✅ Task 11 (lib) + Task 12 (layouts) |
| Hreflang stub (pl-PL only) | ✅ Task 2 (i18n config) |
| WCAG 2.1 AA | ✅ Task 17 (axe a11y) |
| Lighthouse 95+ | ✅ Task 18 |
| Schema fixture tests | ✅ Task 5 |

**Note:** Phosphor icons + dark/light mode toggle pominięte na MVP (decyzja: brand identity dark-only z palety ICEA wystarczy. Phosphor dorzucimy w Plan 3 lub Plan 5 jeśli pojawi się potrzeba ikon). To świadoma redukcja vs spec.

- [ ] **Step 5: User review checkpoint**

User reviewuje:
- CF Pages preview URL (visual check brand, layout, click-through)
- 25 plików Astro + 16 unit/schema/e2e tests passing
- Logo Direction A finalny SVG
- Polityka prywatności (placeholdy do uzupełnienia w Plan 5)

Decyzja użytkownika:
- (a) **Approved → przechodzimy do Plan 2 (Pipeline + skill)**
- (b) **Changes requested → fix loop** (revize Tasks)

---

## Self-Review (sprawdzenie planu po napisaniu)

**Spec coverage check:**

| Spec sekcja | Pokryte w Plan 1? |
|---|---|
| Sekcja 2 – Stack techniczny | Tak (Tasks 2, 3) |
| Sekcja 2 – Struktura monorepo | Tak (Task 1) |
| Sekcja 3 – URL map | Tak (Task 14) |
| Sekcja 3 – Internal linking | Częściowo (struktura, content interlinking w Plan 3) |
| Sekcja 4 – Content collections + schemas | Tak (Task 5) |
| Sekcja 4 – Schema.org coverage | Tak (Task 11, 12) |
| Sekcja 5 – 5 templates | Tak (Task 12) |
| Sekcja 5 – 18 komponentów | Tak (16 z 18 – Phosphor + ToggleTheme P2, Task 19) |
| Sekcja 5 – Typografia | Tak (Task 3) |
| Sekcja 5 – Paleta CSS | Tak (Task 3) |
| Sekcja 6 – Logo direction A | Tak (Task 4) |
| Sekcja 6 – Tone of voice | Implicit (sample content + microcopy) |
| Sekcja 6 – Iconography | Pominięto (Phosphor – P2/Plan 3) |
| Sekcja 6 – Imagery directives | Tak (Task 4 – OG, hero placeholders) |
| Sekcja 7 – AI Visibility Checker | NIE (Plan 4 – placeholder Task 14) |
| Sekcja 8 – Content pipeline | NIE (Plan 2) |
| Sekcja 9 – SEO setup | Tak (Tasks 12, 14, 15) |
| Sekcja 9 – GEO specifics + llms.txt | Tak (Task 15) |
| Sekcja 9 – Performance targets | Tak (Task 18) |
| Sekcja 9 – A11y | Tak (Task 17) |
| Sekcja 9 – Design quality gates (impeccable) | Tak (Task 16, 17, 19) |
| Sekcja 9 – Testing strategy | Częściowo (unit + schema + E2E + a11y + Lighthouse w Plan 1; integration `/api/audit` + Playwright dla narzędzia w Plan 4) |
| Sekcja 9 – Monitoring/alerting | NIE (Plan 4 – Sentry + budget alerts dla narzędzia; full monitoring Plan 5) |
| Sekcja 9 – Backup/DR | NIE (Plan 5 – D1 → R2 cron, dotyczy głównie leadów z Plan 4) |
| Sekcja 9 – RODO | Częściowo (polityka prywatności w Plan 1, consent log + endpoint usuwania w Plan 4) |
| Sekcja 9 – Security | Częściowo (CSP w Plan 5, podstawowe HTTPS/HSTS via CF Pages) |
| Sekcja 9 – Content moderation | NIE (Plan 2/3 – w pipeline) |

**Placeholder scan:** Brak `TBD/TODO/fill in details` w plan code. Placeholdy w polityce prywatności (`{{ICEA_LEGAL_NAME}}` etc.) są celowe – do user-fill przed Plan 5 launch.

**Type consistency:** Schema names (`articles`, `pillar`, `authors`, `caseStudies`) używane konsekwentnie. `breadcrumbListSchema` zwraca `{itemListElement: [{position, name, item}]}` zgodnie z Schema.org.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-06-widocznosc-ai-plan-1-foundation.md`.

**Two execution options:**

**1. Subagent-Driven (recommended)** – Dispatch fresh subagent per task (Tasks 1-19), review between tasks, fast iteration. Best for monorepo setup gdzie każdy task jest dobrze izolowany.

**2. Inline Execution** – Execute tasks w bieżącej sesji using executing-plans, batch execution z checkpointami (np. po Task 5, Task 12, Task 17). Daje większą kontekstualną kontrolę ale dłuższa sesja.

**Which approach?**
