# widocznosc.ai – Light Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dodać przełącznik light/dark mode dla widocznosc.ai z system preference jako default, zachowując dark canvas spotlight cards jako brand signature.

**Architecture:** CSS Variables override przez `:root[data-theme="light"]` selektor. Inline FOUC blocking script w `<head>`. Toggle component sun/moon w Navbar. Zero refactoru klas Tailwind – wszystkie tokeny już są zdefiniowane jako `var(--...)`.

**Tech Stack:** Astro 4 SSG, Tailwind 4 (`@theme` block w CSS), CSS custom properties, vanilla JS dla toggle/FOUC, View Transitions (`<ClientRouter />`).

**Spec:** [`docs/superpowers/specs/2026-05-08-widocznosc-ai-light-mode-design.md`](../specs/2026-05-08-widocznosc-ai-light-mode-design.md)

**Working dir:** Wszystkie ścieżki względem repo root. Build z `portals/widocznosc.ai/`.

**Test approach:** Brak test frameworku w projekcie. Verification = build OK + manual visual QA z DevTools `prefers-color-scheme` emulation. Po każdym task'u: `pnpm build` musi zbudować 22 strony bez błędu, potem `pnpm dev` i visual check.

---

## File Structure

**Modyfikowane:**
- `portals/widocznosc.ai/src/styles/Theme.css` – cleanup `@theme`, dodanie light token block, component overrides
- `portals/widocznosc.ai/src/layouts/Layout.astro` – inline FOUC script
- `portals/widocznosc.ai/src/components/Navbar.astro` – wstawienie ThemeToggle + nav-shell light overrides

**Nowe:**
- `portals/widocznosc.ai/src/components/ThemeToggle.astro` – komponent toggler

---

### Task 1: Refactor `@theme` block w Theme.css – hardcoded → var() references

**Files:**
- Modify: `portals/widocznosc.ai/src/styles/Theme.css:135-207` (`@theme { ... }` block)

**Co i dlaczego:** Obecny `@theme` block ma hardcoded `rgb(10, 10, 11)` etc. Tailwind 4 cache'uje te wartości w czasie buildu. Bez tego cleanup'u utility klasy (`bg-canvas`, `text-ink`) NIE będą reagować na `data-theme` switch. Zmiana = zamiana wszystkich color values na `var(--...)` które wskazują na `:root` tokens.

- [ ] **Step 1: Otwórz Theme.css i zlokalizuj `@theme` block**

Linia 135 zaczyna `@theme {`, linia 207 zamyka. Wewnątrz są wszystkie `--color-*`, `--font-*`, `--radius-*`, `--breakpoint-*`.

- [ ] **Step 2: Zamień hardcoded colors na var() refs**

Zamień całą sekcję color tokens w `@theme` (linia 137-185) na:

```css
@theme {
  /* New Framer tokens – cytują :root vars dla theme switch */
  --color-canvas: var(--bg-canvas);
  --color-surface-1: var(--bg-surface-1);
  --color-surface-2: var(--bg-surface-2);
  --color-inverse: var(--bg-inverse);
  --color-ink: var(--ink);
  --color-ink-muted: var(--ink-muted);
  --color-hairline: var(--hairline);
  --color-hairline-soft: var(--hairline-soft);
  --color-accent-blue: var(--accent-blue);
  --color-success: var(--success-green);

  /* Legacy Tailcast mapping → cytują te same :root vars */
  --color-primaryColor: var(--ink);
  --color-primaryColorHover: rgb(229, 229, 229);
  --color-secondaryColor: var(--ink-muted);
  --color-secondaryColorLight: rgb(204, 204, 204);
  --color-orange: rgb(255, 87, 34); /* zachowane dla SVG infografik – nie podlega theme switch */
  --color-accent: var(--ink);
  --color-accent-bright: rgb(229, 229, 229);
  --color-accent-dim: rgb(204, 204, 204);

  --color-primaryText: var(--ink);
  --color-heroText: var(--ink);
  --color-secondaryText: var(--ink-muted);

  --color-bg: var(--bg-canvas);
  --color-bg-alt: var(--bg-surface-1);
  --color-bg-card: var(--bg-surface-1);
  --color-bg-elevated: var(--bg-surface-2);

  --color-bgDark1: var(--bg-canvas);
  --color-bgDark2: var(--bg-surface-1);
  --color-bgDark3: var(--bg-surface-1);
  --color-bgDark3Hover: var(--bg-surface-2);
  --color-bgDark3HoverLight: var(--bg-surface-2);
  --color-bgDarkTransparent: rgb(10 10 11 / 0.7);
  --color-bgDarkTransparentDarker: rgb(10 10 11 / 0.85);
  --color-bgDarkTransparentLighter: rgb(19 19 22 / 0.7);
  --color-bgDark1Lighter: var(--bg-surface-1);

  --color-rule: var(--hairline);
  --color-rule-soft: var(--hairline-soft);
  --color-mainBorder: var(--hairline);
  --color-mainBorderDarker: var(--hairline-soft);
  --color-mainBorderSubtler: var(--hairline);
  --color-mainBorderFaintest: var(--hairline-soft);
  --color-mainBorderSubtle: var(--hairline);
  --color-quoteIconColor: var(--ink-muted);

  /* Fonts (Tailwind utilities: font-display, font-sans) */
  --font-display: 'Mona Sans Variable', 'Mona Sans', 'Inter', sans-serif;
  --font-sans: 'Inter Variable', 'Inter', sans-serif;
  --font-Inter: 'Inter Variable', 'Inter', sans-serif;

  /* Radius */
  --radius-xs: 4px;
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 15px;
  --radius-xl: 20px;
  --radius-xxl: 30px;
  --radius-pill: 100px;

  --breakpoint-xs: 530px;
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
  --breakpoint-2xl: 1536px;
}
```

**Uwaga:** `--color-bgDarkTransparent*` zostają z hardcoded `rgb(10 10 11)` bo są używane w sticky overlays gdzie zawsze chcemy ciemny scrim niezależnie od motywu (część dropdown UI, modal backdrop). Light mode override dla nich załatwimy w osobnym task'u przez `[data-theme="light"]` selektor.

- [ ] **Step 3: Verify build OK**

```bash
cd portals/widocznosc.ai && pnpm build
```

Expected: build success, 22 strony, brak warning'ów. Strona w dark mode powinna wyglądać identycznie (zmiana = no-op funkcjonalnie, tylko refactor).

- [ ] **Step 4: Quick visual check w dev mode**

```bash
cd portals/widocznosc.ai && pnpm dev
```

Otwórz `http://localhost:4321` – wszystko ma wyglądać identycznie jak przed Task 1. Tła, kolory tekstów, accent niebieski – bez zmian.

- [ ] **Step 5: Commit**

```bash
git add portals/widocznosc.ai/src/styles/Theme.css
git commit -m "refactor(widocznosc-ai): @theme block – hardcoded colors → var() refs

Przygotowanie pod theme switching. Tailwind utility classes
będą teraz dziedziczyć tokeny z :root przez var(), co pozwoli
na dynamiczny override przez [data-theme=\"light\"] selektor.
Zero zmian wizualnych w dark mode."
```

---

### Task 2: Dodaj `:root[data-theme="light"]` token block

**Files:**
- Modify: `portals/widocznosc.ai/src/styles/Theme.css:9-127` (po zamknięciu `:root` block, linia ~127)

**Co i dlaczego:** Light mode tokens scoped do `[data-theme="light"]`. CSS variables są resolved at usage – każdy komponent używający `var(--bg-canvas)` automatycznie dostanie `#fafafa` w light mode. Zero zmian w komponentach.

- [ ] **Step 1: Dodaj light token block po zamknięciu `:root`**

Zlokalizuj zamykającą klamrę `:root` (linia ~127). Po niej, PRZED `/* ============================================================` z komentarzem o Tailwind 4 `@theme`, wstaw:

```css
/* ============================================================
   Light mode tokens – override przez data-theme atrybut.
   Ustawiany przez inline FOUC script w Layout.astro przed
   pierwszym paintem.
   ============================================================ */
:root[data-theme="light"] {
  /* Surface ladder – inverted */
  --bg-canvas: #fafafa;
  --bg-surface-1: #f0f0f1;
  --bg-surface-2: #e6e6e8;
  --bg-inverse: #0a0a0b;

  /* Hairlines – translucent black */
  --hairline: rgba(0, 0, 0, 0.10);
  --hairline-soft: rgba(0, 0, 0, 0.06);

  /* Ink – near-black, kontrast 11.5:1 vs #fafafa */
  --ink: #1a1a1a;
  --ink-muted: #666666;

  /* Accent – ściemniony do WCAG AA na białym (4.92:1) */
  --accent-blue: #0070d6;
  --accent-blue-soft: rgba(0, 112, 214, 0.12);

  /* Semantic */
  --success-green: #15803d;

  /* Spotlight gradients zostają ciemne (signature) – brak override
     dla --gradient-violet/orange/magenta/coral/violet-linear/process-* */

  /* Elevation – soft drop shadow zamiast inset white edge */
  --shadow-l2:
    0 1px 2px rgba(0, 0, 0, 0.04),
    0 8px 24px rgba(0, 0, 0, 0.08);
  --shadow-l3: 0 0 0 2px rgba(0, 112, 214, 0.20);
}
```

- [ ] **Step 2: Verify build OK**

```bash
cd portals/widocznosc.ai && pnpm build
```

Expected: build success, 22 strony.

- [ ] **Step 3: Manual test – force light mode w DevTools**

```bash
cd portals/widocznosc.ai && pnpm dev
```

W browser DevTools:
1. Console: `document.documentElement.dataset.theme = 'light'`
2. Strona powinna natychmiast się przełączyć: białe tło, ciemny tekst, ściemniony niebieski
3. Spotlight cards (jeśli widoczne) zostają ciemne – correct

Jeśli jakiś element wygląda źle (np. niewidoczny tekst, hardcoded biały na białym) – zanotuj, naprawimy w Task 3-4-8.

Reset: Console `delete document.documentElement.dataset.theme` lub F5.

- [ ] **Step 4: Commit**

```bash
git add portals/widocznosc.ai/src/styles/Theme.css
git commit -m "feat(widocznosc-ai): light mode tokens – :root[data-theme=light]

Off-white #fafafa canvas, ink #1a1a1a, accent ściemniony do
#0070d6 (WCAG AA). Spotlight cards zostają ciemne (signature).
Toggle UI w kolejnym kroku."
```

---

### Task 3: Component overrides – btn-secondary, btn-translucent, modal-backdrop, spotlight content

**Files:**
- Modify: `portals/widocznosc.ai/src/styles/Theme.css` – dodanie overrides na końcu pliku (po `/* Reduced motion */` block)

**Co i dlaczego:** Cztery komponenty używają hardcoded białych rgba które na białym tle znikają lub wymagają inwersji. Spotlight cards dodatkowo potrzebują force `#fff` text/buttons bo wewnątrz nadal są ciemne ale `--ink` w light = `#1a1a1a` (czarny tekst nieczytelny na violet gradient).

- [ ] **Step 1: Dodaj overrides na końcu Theme.css**

Po zamknięciu `@media (prefers-reduced-motion: reduce)` block, dodaj:

```css
/* ============================================================
   Light mode component overrides – komponenty z hardcoded
   białymi rgba lub wymagające explicit inwersji.
   ============================================================ */

/* btn-secondary – białe rgba znika na białym tle */
:root[data-theme="light"] .btn-secondary {
  background: rgba(0, 0, 0, 0.04);
  border-color: rgba(0, 0, 0, 0.10);
}

:root[data-theme="light"] .btn-secondary:hover {
  background: rgba(0, 0, 0, 0.08);
  border-color: rgba(0, 0, 0, 0.18);
}

/* btn-translucent – ten sam problem */
:root[data-theme="light"] .btn-translucent:hover {
  background: rgba(0, 0, 0, 0.08);
}

/* Modal backdrop – ciemny scrim na białym tle */
:root[data-theme="light"] .modal-backdrop::backdrop {
  background: rgba(0, 0, 0, 0.5);
}

/* Spotlight cards – content force biały niezależnie od motywu.
   Cards same zostają ciemne (gradient hardcoded), ale --ink
   w light = #1a1a1a, więc text/buttons potrzebują explicit
   white żeby były czytelne na violet/orange/magenta gradient. */
.card-spotlight :where(h1, h2, h3, h4, p) {
  color: #fff;
}

.card-spotlight .btn-secondary {
  background: rgba(255, 255, 255, 0.10);
  border-color: rgba(255, 255, 255, 0.20);
  color: #fff;
}

.card-spotlight .btn-secondary:hover {
  background: rgba(255, 255, 255, 0.18);
  border-color: rgba(255, 255, 255, 0.30);
}

/* Eyebrow w spotlight – też force biały muted */
.card-spotlight .eyebrow {
  color: rgba(255, 255, 255, 0.7);
}
```

**Uwaga:** Ostatnie 3 reguły (`.card-spotlight ...`) NIE są scoped do `[data-theme="light"]` – dotyczą obu motywów. W dark mode również poprawiają sytuację (obecnie `.card-spotlight :where(h1, h2, h3, h4, p)` używa `var(--ink)` co już jest białe – ale buttony używały `var(--ink)` i mogą być nieczytelne jeśli ktoś używa `.btn-secondary` wewnątrz spotlight). To consolidation.

- [ ] **Step 2: Verify build OK**

```bash
cd portals/widocznosc.ai && pnpm build
```

- [ ] **Step 3: Manual test – light mode w DevTools**

```bash
cd portals/widocznosc.ai && pnpm dev
```

Console: `document.documentElement.dataset.theme = 'light'`

Sprawdź:
1. **Modal** – jeśli jest jakikolwiek na stronie (FAQ, Invitation), backdrop powinien być ciemny scrim (nie biały szum)
2. **Spotlight cards** (homepage Process section, hero gradient cards) – zostają ciemne, tekst biały, buttons wewnątrz czytelne
3. **Secondary buttons** – jeśli są na białym tle (`.btn-secondary`), powinny mieć subtelny ciemny outline + tło

- [ ] **Step 4: Commit**

```bash
git add portals/widocznosc.ai/src/styles/Theme.css
git commit -m "feat(widocznosc-ai): light mode component overrides

btn-secondary/translucent: black rgba zamiast white na light bg.
Modal backdrop: ciemny scrim. Spotlight cards content: force #fff
text/buttons (cards same zostają ciemne)."
```

---

### Task 4: Navbar light mode overrides – nav-shell, mobile overlay

**Files:**
- Modify: `portals/widocznosc.ai/src/components/Navbar.astro:296-315` (`.nav-shell` rules), `:507-512` (`.nav-mobile-overlay`)

**Co i dlaczego:** Navbar ma hardcoded `rgb(10 10 11 / 0.9)` jako tło i `rgba(255, 255, 255, 0.05)` jako border. Mobile overlay też ma `rgb(10 10 11 / 0.6)`. W light mode te kolory wymagają inwersji – nie używają `var()` bo były ustawione przed wprowadzeniem theme system.

- [ ] **Step 1: Otwórz Navbar.astro i zlokalizuj `<style is:global>` block**

Linia 289 zaczyna `<style is:global>`. Wewnątrz są regule `.nav-shell`, `.nav-mobile-overlay`, etc.

- [ ] **Step 2: Dodaj light mode overrides na końcu `<style is:global>` block**

Przed zamykającym `</style>` (linia 584), dodaj:

```css
/* Light mode overrides */
:root[data-theme='light'] .nav-shell {
  background: rgb(250 250 250 / 0.9);
  border-bottom-color: rgba(0, 0, 0, 0.06);
}

:root[data-theme='light'] .nav-shell[data-scrolled='true'] {
  background: rgb(250 250 250 / 0.95);
  border-bottom-color: rgba(0, 0, 0, 0.10);
}

:root[data-theme='light'] .nav-mobile-overlay {
  background: rgb(0 0 0 / 0.4);
}
```

- [ ] **Step 3: Verify build OK + visual test**

```bash
cd portals/widocznosc.ai && pnpm build && pnpm dev
```

Console: `document.documentElement.dataset.theme = 'light'`

Sprawdź:
1. Navbar tło: prawie-białe z blur, nie ciemne
2. Border bottom widoczny ale subtelny
3. Scrolluj w dół 16px+ → tło ciemnieje subtelnie (data-scrolled state)
4. Mobile (DevTools 375px) → otwórz hamburger → overlay ciemny scrim na białej stronie

- [ ] **Step 4: Commit**

```bash
git add portals/widocznosc.ai/src/components/Navbar.astro
git commit -m "feat(widocznosc-ai): navbar light mode overrides

nav-shell tło + border invertowane na #fafafa/black hairline.
Mobile overlay ciemny scrim."
```

---

### Task 5: Inline FOUC script w Layout.astro

**Files:**
- Modify: `portals/widocznosc.ai/src/layouts/Layout.astro:38-72` (`<head>` block)

**Co i dlaczego:** Astro SSG = HTML pre-rendered. Bez tego flash dark→light po hydratacji JS. Inline blocking script jako pierwszy element `<head>` (po `<meta charset>`) ustawia `data-theme` na `<html>` przed pierwszym paintem.

- [ ] **Step 1: Dodaj inline FOUC script w `<head>`**

Zlokalizuj linię 38 (`<head>`). Po `<meta name="viewport"` (linia 40), PRZED `<link rel="icon"` (linia 41), wstaw:

```astro
    <!-- Theme init – musi być pierwszy, przed CSS, bez flash -->
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

- [ ] **Step 2: Verify build OK**

```bash
cd portals/widocznosc.ai && pnpm build
```

Sprawdź że w `dist/index.html` (lub `dist/<dowolna>.html`) inline script jest w `<head>` przed `<link rel="stylesheet">`:

```bash
head -50 portals/widocznosc.ai/dist/index.html
```

Expected: `<script>(() => { try { ... })()</script>` widoczne w pierwszych ~30 liniach `<head>`.

- [ ] **Step 3: Manual FOUC test – cold load oba motywy**

```bash
cd portals/widocznosc.ai && pnpm dev
```

**Test 1 – system dark:**
1. DevTools → Rendering tab → Emulate CSS media feature `prefers-color-scheme: dark`
2. F5 (cold reload)
3. Strona ładuje się od razu w dark, zero flash

**Test 2 – system light:**
1. DevTools → Rendering tab → `prefers-color-scheme: light`
2. F5
3. Strona ładuje się od razu w light, zero flash, brak ciemnego flash'a

**Test 3 – override persistence:**
1. Console: `localStorage.setItem('theme', 'dark'); location.reload()`
2. Z `prefers-color-scheme: light` strona ładuje się w dark (override)
3. Console: `localStorage.removeItem('theme'); location.reload()`
4. Strona wraca do system preference (light)

Jeśli któryś z testów pokazuje flash – problem jest gdzieś indziej (CSS load order, race condition). Zatrzymaj się i debug'uj zanim kontynuujesz.

- [ ] **Step 4: Commit**

```bash
git add portals/widocznosc.ai/src/layouts/Layout.astro
git commit -m "feat(widocznosc-ai): inline FOUC script dla theme init

is:inline blocking script jako pierwszy element <head>.
Czyta localStorage → fallback do prefers-color-scheme.
Try/catch dla Safari private mode."
```

---

### Task 6: Stwórz ThemeToggle.astro component

**Files:**
- Create: `portals/widocznosc.ai/src/components/ThemeToggle.astro`

**Co i dlaczego:** Osobny komponent, zamknięty w sobie (markup + script + style). Sun/moon SVG, accessible, hydratacja przez `astro:page-load` event (zgodne z patternem Navbar.astro).

- [ ] **Step 1: Stwórz nowy plik `ThemeToggle.astro`**

Pełna zawartość pliku:

```astro
---
// ThemeToggle – sun/moon icon w nav, persistuje wybór w localStorage,
// reaguje na zmianę system preference jeśli brak override.
// Inline FOUC script w Layout.astro ustawia data-theme zanim ten
// komponent się zhydrate.
---

<button
  type="button"
  class="theme-toggle"
  id="theme-toggle"
  aria-label="Zmień motyw"
>
  <!-- Sun icon – widoczny w dark mode, klik → light -->
  <svg
    class="theme-toggle__sun"
    aria-hidden="true"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    stroke-width="1.6"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <circle cx="10" cy="10" r="3.5"></circle>
    <line x1="10" y1="2" x2="10" y2="4"></line>
    <line x1="10" y1="16" x2="10" y2="18"></line>
    <line x1="2" y1="10" x2="4" y2="10"></line>
    <line x1="16" y1="10" x2="18" y2="10"></line>
    <line x1="4.34" y1="4.34" x2="5.76" y2="5.76"></line>
    <line x1="14.24" y1="14.24" x2="15.66" y2="15.66"></line>
    <line x1="4.34" y1="15.66" x2="5.76" y2="14.24"></line>
    <line x1="14.24" y1="5.76" x2="15.66" y2="4.34"></line>
  </svg>
  <!-- Moon icon – widoczny w light mode, klik → dark -->
  <svg
    class="theme-toggle__moon"
    aria-hidden="true"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    stroke-width="1.6"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M16.5 11.5A6.5 6.5 0 0 1 8.5 3.5a6.5 6.5 0 1 0 8 8z"></path>
  </svg>
</button>

<script>
  const initThemeToggle = () => {
    const btn = document.getElementById('theme-toggle');
    const root = document.documentElement;
    if (!btn) return;

    const updateAria = () => {
      const current = root.dataset.theme;
      btn.setAttribute(
        'aria-label',
        current === 'dark' ? 'Włącz tryb jasny' : 'Włącz tryb ciemny'
      );
    };
    updateAria();

    btn.addEventListener('click', () => {
      const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
      root.dataset.theme = next;
      try {
        localStorage.setItem('theme', next);
      } catch {
        // private mode – ignoruj, w pamięci sesji wystarczy
      }
      updateAria();
    });

    // Listen na zmiany system preference – tylko gdy brak override
    const mq = matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', (e) => {
      try {
        if (localStorage.getItem('theme')) return;
      } catch {
        return;
      }
      root.dataset.theme = e.matches ? 'dark' : 'light';
      updateAria();
    });
  };

  document.addEventListener('astro:page-load', initThemeToggle);
</script>

<style is:global>
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
    transition: background 0.15s ease, color 0.15s ease;
    flex-shrink: 0;
  }

  .theme-toggle:hover {
    background: var(--bg-surface-1);
    color: var(--ink);
  }

  .theme-toggle:focus-visible {
    outline: none;
    box-shadow: var(--shadow-l3);
  }

  .theme-toggle__sun,
  .theme-toggle__moon {
    width: 18px;
    height: 18px;
  }

  /* Default :root (brak data-theme) = dark fallback. Pokaż słońce. */
  :root .theme-toggle__sun { display: block; }
  :root .theme-toggle__moon { display: none; }

  :root[data-theme='dark'] .theme-toggle__sun { display: block; }
  :root[data-theme='dark'] .theme-toggle__moon { display: none; }

  :root[data-theme='light'] .theme-toggle__sun { display: none; }
  :root[data-theme='light'] .theme-toggle__moon { display: block; }

  @media (pointer: coarse) {
    .theme-toggle {
      width: 44px;
      height: 44px;
    }
    .theme-toggle__sun,
    .theme-toggle__moon {
      width: 20px;
      height: 20px;
    }
  }
</style>
```

- [ ] **Step 2: Verify build OK**

```bash
cd portals/widocznosc.ai && pnpm build
```

Expected: build success. Komponent jest stworzony ale nigdzie nie używany jeszcze – nie powinien być w bundle (Astro tree-shake nie używanych komponentów).

- [ ] **Step 3: Commit**

```bash
git add portals/widocznosc.ai/src/components/ThemeToggle.astro
git commit -m "feat(widocznosc-ai): ThemeToggle component – sun/moon

Self-contained Astro component. Listen na system preference
change gdy brak localStorage override. ARIA dynamic (opisuje
akcję, nie stan). Touch target 44px na pointer:coarse.
Komponent stworzony – wstawienie do Navbar w kolejnym kroku."
```

---

### Task 7: Wire ThemeToggle do Navbar – desktop + mobile

**Files:**
- Modify: `portals/widocznosc.ai/src/components/Navbar.astro:1` (frontmatter import), `:172-176` (desktop CTA group), `:223-227` (mobile menu CTA)

**Co i dlaczego:** Wstawienie komponentu w 2 miejscach: desktop nav obok CTA "Uruchom test za darmo", mobile drawer jako pierwszy element nad linkami (lub blisko CTA).

- [ ] **Step 1: Dodaj import do frontmatter**

Otwórz `portals/widocznosc.ai/src/components/Navbar.astro`. Frontmatter zaczyna się linią 1 (`---`). Po `type NavItem...type NavGroup` deklaracjach, ale przed `const navbarLinks`, dodaj import. Najprościej: dodaj na samej górze frontmatter:

```astro
---
import ThemeToggle from './ThemeToggle.astro';

type NavItem = {
  label: string;
  href: string;
  desc?: string;
};
// ... reszta frontmatter bez zmian
```

- [ ] **Step 2: Wstaw ThemeToggle w desktop nav (przed CTA)**

Zlokalizuj `<!-- CTA right – primary white pill -->` (linia 171). Zmień blok:

```astro
    <!-- CTA right – primary white pill -->
    <div class="hidden lg:flex lg:items-center lg:gap-2">
      <a class="btn-primary" href="/narzedzia" aria-label="Uruchom darmowy test widoczności AI">
        Uruchom test za darmo
      </a>
    </div>
```

na:

```astro
    <!-- CTA right – theme toggle + primary white pill -->
    <div class="hidden lg:flex lg:items-center lg:gap-2">
      <ThemeToggle />
      <a class="btn-primary" href="/narzedzia" aria-label="Uruchom darmowy test widoczności AI">
        Uruchom test za darmo
      </a>
    </div>
```

- [ ] **Step 3: Wstaw ThemeToggle w mobile menu (przed CTA, z osobnym labelem dla kontekstu mobile)**

Zlokalizuj `<a class="btn-primary nav-mobile-cta"` (linia 224). Zmień:

```astro
    <a class="btn-primary nav-mobile-cta" href="/narzedzia">
      Uruchom test za darmo
    </a>
  </div>
```

na:

```astro
    <div class="nav-mobile-theme-row">
      <span class="nav-mobile-theme-label">Motyw</span>
      <ThemeToggle />
    </div>
    <a class="btn-primary nav-mobile-cta" href="/narzedzia">
      Uruchom test za darmo
    </a>
  </div>
```

- [ ] **Step 4: Dodaj style dla mobile theme row**

W `<style is:global>` block (linia 289+), na końcu (przed `</style>`), dodaj:

```css
/* Mobile theme row – label + toggle */
.nav-mobile-theme-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-radius: var(--r-md);
  margin-top: 8px;
}

.nav-mobile-theme-label {
  font-family: var(--font-sans);
  font-size: var(--fs-body);
  font-weight: 500;
  color: var(--ink);
}
```

- [ ] **Step 5: Verify build OK**

```bash
cd portals/widocznosc.ai && pnpm build
```

- [ ] **Step 6: Manual test – toggle działa w desktop i mobile**

```bash
cd portals/widocznosc.ai && pnpm dev
```

**Desktop test:**
1. Otwórz `http://localhost:4321`
2. W nav top-right widoczna ikona (słońce w dark / księżyc w light)
3. Klik → strona przełącza się natychmiast, ikona się zmienia
4. F5 → wybór persistuje
5. Hover na ikonie → background subtelnie się pojawia
6. Tab na ikonę → focus ring widoczny (`shadow-l3`)
7. Enter na fokusie → toggle działa

**Mobile test (DevTools 375px):**
1. Hamburger toggle → menu otwiera się
2. Pod CTA jest row "Motyw" + ikona toggle
3. Klik ikony → strona przełącza się, menu zostaje otwarte
4. Layout nie pęka, theme toggle nie kraduje miejsca

**Persistence test:**
1. Toggle do light, zamknij browser, otwórz ponownie → light zostaje
2. Wyczyść localStorage (`localStorage.removeItem('theme')` w Console), F5 → wraca do system preference

- [ ] **Step 7: Commit**

```bash
git add portals/widocznosc.ai/src/components/Navbar.astro
git commit -m "feat(widocznosc-ai): wire ThemeToggle do Navbar

Desktop: obok CTA \"Uruchom test za darmo\".
Mobile: w drawer jako row \"Motyw\" + ikona, nad primary CTA."
```

---

### Task 8: Audit hardcoded colors w komponentach + fix found instances

**Files:**
- Read-only audit: wszystkie `.astro` w `portals/widocznosc.ai/src/components/`, `src/layouts/`, `src/pages/`
- Modify: tyle ile potrzeba (zależnie od findings)

**Co i dlaczego:** Komponenty napisane przed wprowadzeniem theme system mogą mieć hardcoded `rgba(255, ...)`, `#0a0a0b`, `bg-white`, `text-black` etc. Te miejsca w light mode wyglądają źle (niewidoczne lub rażące). Audit grepem, fix ad-hoc.

- [ ] **Step 1: Uruchom audit grep**

```bash
grep -rn -E "(bg-white|bg-black|text-white|text-black|#0a0a0b|#fff[^a-fA-F0-9]|#000[^a-fA-F0-9]|rgba?\(255,? *255,? *255|rgba?\(0,? *0,? *0)" \
  portals/widocznosc.ai/src/components/ \
  portals/widocznosc.ai/src/layouts/ \
  portals/widocznosc.ai/src/pages/ \
  2>&1 | grep -v "^Binary" | head -60
```

Spodziewane wyniki to różne miejsca. Każde wymaga osobnej oceny:
- Jeśli kolor jest **w SVG ikonie/infografice** – zostawiaj (ikony mają własną paletę)
- Jeśli to **white/black na hardcoded surface** (np. tekst na spotlight card) – zostawiaj, to świadome
- Jeśli to **fallback na `var(--ink)` lub `var(--bg-canvas)`** – wymień na var()
- Jeśli to **specyficzne tło/border** – dodaj `:root[data-theme="light"]` override

- [ ] **Step 2: Test wizualny w light mode**

```bash
cd portals/widocznosc.ai && pnpm dev
```

Console: `document.documentElement.dataset.theme = 'light'`

Przejdź ręcznie przez 6 stron z spec'a:

```
✓ /                            homepage
✓ /narzedzia/url-check
✓ /narzedzia/ai-bots-check
✓ /artykul/[dowolny – np. pierwszy z /blog]
✓ /autorzy/[dowolny – np. /autorzy/...]
✓ /blog                        list page
```

Dla każdej szukaj:
1. **Niewidoczny tekst** – białe na białym, np. avatar ringi, badge'y
2. **Rażące przejścia** – ciemny element na białym tle bez harmonii (border missing, shadow zbyt mocny)
3. **Hover states** – białe rgba które znikają w light (kontynuacja problemu z btn-secondary z Task 3)

- [ ] **Step 3: Fix found instances inline**

Dla każdego problemu z Step 2:
- Otwórz dany komponent
- Zlokalizuj problematyczną regułę CSS
- Albo zamień hardcoded na `var(--...)` jeśli istnieje token
- Albo dodaj `:root[data-theme="light"]` override w komponencie albo w `Theme.css`

**Przykładowy pattern dla typowych find'ów:**

Jeśli komponent ma w `<style is:global>`:
```css
.author-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
```

Zamień na `var()` jeśli pasuje, albo dodaj override:
```css
:root[data-theme='light'] .author-card {
  background: rgba(0, 0, 0, 0.03);
  border-color: rgba(0, 0, 0, 0.08);
}
```

**Częsty find:** klasy Tailwind `bg-white/5`, `bg-white/10`, `text-white/70`. Te NIE auto-przełączają się – to literal white. Zamień na `bg-ink/5` jeśli token istnieje, albo dodaj inline `[data-theme="light"]:bg-black/5`.

- [ ] **Step 4: Verify build OK po wszystkich fixach**

```bash
cd portals/widocznosc.ai && pnpm build
```

- [ ] **Step 5: Re-test 6 stron w light mode**

Powtórz Step 2 – wszystkie 6 stron powinny wyglądać clean w light mode. Spotlight cards zostają ciemne (correct). Tekst czytelny wszędzie.

- [ ] **Step 6: Commit (lub seria commitów per komponent jeśli dużo zmian)**

```bash
git add portals/widocznosc.ai/src/components/ portals/widocznosc.ai/src/layouts/ portals/widocznosc.ai/src/pages/ portals/widocznosc.ai/src/styles/Theme.css
git commit -m "fix(widocznosc-ai): light mode hardcoded color audit

Konwersja hardcoded rgba(255,...) na var() lub explicit
[data-theme=light] overrides. Dotknięte komponenty:
[lista z findings]"
```

**Note:** Jeśli zmian jest dużo, podziel na 2-3 commity tematyczne (np. "author-cards light mode", "hero variants light mode"). Każdy commit powinien być atomowy.

---

### Task 9: WCAG AA contrast verification + final visual QA

**Files:** Brak modyfikacji – pure verification.

**Co i dlaczego:** Spec wymaga 4.5:1 dla normal text. Light mode tokens były dobrane teoretycznie – teraz weryfikujemy że w praktyce trzymają contrast'y na wszystkich istotnych kombinacjach.

- [ ] **Step 1: Build + preview**

```bash
cd portals/widocznosc.ai && pnpm build && pnpm preview
```

- [ ] **Step 2: Chrome DevTools contrast check w light mode**

W browser:
1. DevTools → Rendering → `prefers-color-scheme: light`
2. Cold reload (F5)
3. Inspector → kliknij na element → CSS panel pokazuje contrast ratio przy color value

Sprawdź te elementy (zanotuj wartości):

| Element | Selector | Cel |
| --- | --- | --- |
| Body text (np. paragraph w hero) | `p` | ≥4.5:1 |
| Muted text (np. subtitle) | `[class*='muted']`, `.eyebrow` | ≥4.5:1 |
| Accent linki | `.prose-framer a`, `.article-body a` | ≥4.5:1 |
| Primary button text | `.btn-primary` (text na bg) | ≥4.5:1 |
| Secondary button text | `.btn-secondary` | ≥4.5:1 |
| Nav links | `.nav-link`, `.nav-link:hover` | ≥4.5:1 (hover state zostaje muted, ok) |

Jeśli któryś oblewa <4.5:1 – odpowiedni token w Theme.css wymaga ściemnienia.

- [ ] **Step 3: Lighthouse audit w light mode**

Open DevTools → Lighthouse → Generate report (Mobile + Desktop).

Sprawdź:
- **Accessibility score:** powinno być ≥95 (idealnie 100, jak teraz w dark)
- **Color contrast** issues: powinno być 0
- **Best practices:** 90+

Jeśli regresja >5 punktów vs dark mode – debug przed merge.

- [ ] **Step 4: Lighthouse w dark mode (kontrolny)**

DevTools → `prefers-color-scheme: dark` → Lighthouse ponownie. Powinien zwrócić ten sam wynik co przed implementacją (zero regresji w dark).

- [ ] **Step 5: Final manual checklist**

Przejdź przez 5 scenariuszy z spec'a:

```
✓ Cold load – system dark → strona w dark, zero flash
✓ Cold load – system light → strona w light, zero flash
✓ Toggle persistence → klik w light, F5, zostaje w light
✓ Override revert → wyczyść localStorage, F5, wraca do system
✓ System change runtime → DevTools toggle prefers-color-scheme,
  strona auto-updates (tylko gdy brak override)
```

Każdy ✓ test przeszedł = ready do merge.

- [ ] **Step 6: Commit notatki z verification (opcjonalne, bez kodu)**

Jeśli nic nie wymaga zmiany – zatrzymaj się. Jeśli były tweaki contrast'u (np. `--ink-muted` ściemniony):

```bash
git add portals/widocznosc.ai/src/styles/Theme.css
git commit -m "fix(widocznosc-ai): light mode contrast tweaks

[lista zmienionych tokenów + ratios]"
```

---

### Task 10: Update memory + close out

**Files:** `~/.claude/projects/-mnt-c-projekty-icea-transformacja-zaplecza-seo/memory/project_widocznosc_ai_progress.md`

**Co i dlaczego:** Następna sesja powinna wiedzieć że light mode jest zaimplementowany. Update progress memory.

- [ ] **Step 1: Update progress memory**

Edit `~/.claude/projects/-mnt-c-projekty-icea-transformacja-zaplecza-seo/memory/project_widocznosc_ai_progress.md` – dodaj wpis o light mode (mała aktualizacja, jednolinijka w sekcji "ostatnio").

- [ ] **Step 2: Aktualizacja MEMORY.md (description w linii indeksu)**

Edit `~/.claude/projects/-mnt-c-projekty-icea-transformacja-zaplecza-seo/memory/MEMORY.md` – linia z `[widocznosc.ai Progress]` aktualizuj opis.

- [ ] **Step 3: Final summary do user'a**

Po wszystkich tasks: krótki recap (3-5 linii) co zostało zaimplementowane, link do final commit'a, ewentualne caveaty z audytu (Task 8).

---

## Self-Review

**Spec coverage:**
- ✅ Token map (sekcja 1) → Task 2
- ✅ FOUC prevention (sekcja 2) → Task 5
- ✅ Toggle component (sekcja 3) → Task 6 + 7
- ✅ Scope/Audit (sekcja 4) → Task 1 (`@theme` cleanup), Task 3 (component overrides), Task 4 (Navbar overrides), Task 8 (audit)
- ✅ Testing (sekcja 5) → Task 9 (WCAG + manual QA scenarios)

**Placeholder scan:** brak TODO/TBD/"similar to". Każdy task ma kompletny kod, exact paths, exact commands.

**Type consistency:** Komponent eksponuje `<button id="theme-toggle">`. Script używa `getElementById('theme-toggle')`. ARIA labels konsystentne ("Włącz tryb jasny" / "Włącz tryb ciemny"). `data-theme` atrybut spójnie używany jako `'dark' | 'light'` (nie `'system'` – nie ma tego stanu w runtime, system to brak override w localStorage).

**Edge case – `:root` bez data-theme** (przed wykonaniem inline FOUC script): tokens default do dark (`:root` block). ThemeToggle CSS pokazuje słońce w tym stanie (`:root .theme-toggle__sun { display: block }`). Konsystentne z dark fallback.
