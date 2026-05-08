# Sesja 2026-05-07v2 – widocznosc.ai pivot DNA na pure Framer

**Branch:** `feat/widocznosc-framer` (off `feat/widocznosc-ai-tailcast`)
**HEAD:** `24e2a40`
**Commity:** 4
**Build:** 21 stron statycznych OK
**Preview:** `feat-widocznosc-framer.widocznosc-ai.pages.dev`
**Rollback path:** `git checkout feat/widocznosc-ai-tailcast` (preview `feat-widocznosc-ai-tailcast.widocznosc-ai.pages.dev` nadal aktywny)

## Decyzja

Pivot DNA z "Linear baseline + SpaceX hero hybrid + ICEA paleta orange" na **pure Framer marketing canvas**. User wkleił pełen Framer DESIGN.md i odrzucił poprzedni kierunek ("ten obecny mnie nie przekonuje").

## Brainstorming – 6 decyzji

| # | Pytanie | Wybór |
|---|---|---|
| 1 | DNA shift | **A** Pure Framer port (orange ze structural use OUT, white pill primary, sky-blue link/focus only) |
| 2 | Scope | **A** Big bang – cały portal naraz (rollback przez checkout) |
| 3 | Typography | **A** Mona Sans variable (GitHub OFL) + Inter Variable z OpenType (cv01/05/09/11, ss03/07, dlig, tnum) |
| 4 | Gradient cards | **A** Hero violet + Premium audyt orange (2 cards na cały homepage, magenta/coral reserved) |
| 5 | Logo | **A** Plain wordmark Mona Sans 18px (zero pulse, zero radar, zero dot accent) |
| 6 | Branch | **A** Nowy `feat/widocznosc-framer` off `feat/widocznosc-ai-tailcast` |

## Spec design doc

`docs/superpowers/specs/2026-05-07-widocznosc-ai-framer-design.md` (323 linie):
- Foundation tokens (4-level surface ladder, ink/ink-muted, accent-blue, gradient family)
- Typography stack (12-token type scale, Mona Sans + Inter Variable + OpenType)
- Spacing 5px base, radius 4-100-9999, elevation L0-L3
- Komponenty (4 buttons + cards + spotlight + eyebrow + inputs + pricing tabs + faq-row)
- Gradient spotlight cards z konkretnymi linear-gradient stops
- Page-level changes per 11 sekcji homepage + blog listing + article + nav + footer + podstrony
- Anti-patterns wprost ZABRONIONE
- Migration / commit sequence
- Rollback path

## Implementacja – 4 commity

### 1. `3e37ba5 docs(widocznosc-framer): spec pivotu DNA na pure Framer`
Spec design doc (323 linie).

### 2. `d10dd4e feat(widocznosc-framer): foundation tokens + Mona Sans + Navbar/Hero/Audits`
**Foundation:**
- `Theme.css` full rewrite – surface ladder, ink/ink-muted, accent-blue, gradient family, type scale 12-token, spacing 5px, radius 4-100, elevation L0-L3.
- Legacy Tailcast aliases (bg-bgDark1, text-primaryText, .card, .contained-button) zachowane ale podmapowane na nowe wartości (bg-bgDark1 → canvas, text-primaryText → ink itd.) – pozwala istniejącym komponentom kompilować się bez refactoru klas Tailwind.
- `Layout.astro` – Mona Sans + Inter Variable preload, OpenType variants w `font-feature-settings`.
- `package.json` – usunięte `@fontsource/inter`, `@fontsource/inter-tight`, `@fontsource/jetbrains-mono`. Dodane `@fontsource-variable/mona-sans`, `@fontsource-variable/inter`.
- `diagonals.css` – usunięty.

**Komponenty produkcyjne:**
- **Navbar** – 56px sticky, plain wordmark Mona Sans, body-sm 14px nav links, surface-1 dropdown z hairline. Telemetry rotator OUT. CTA: btn-primary "Uruchom test za darmo".
- **Hero** – 2-col asymetryczny: lewa display-xxl headline (clamp 2rem do 4.25rem) + body-lg subhead (biały, kluczowy tekst) + 2 pill CTAs. Prawa = `card-spotlight` violet z subtle pan motion 60s. Logo wall pod heroem (5 silników display).
- **Audits** – 3-up grid `audit-card` charcoal (surface-1 → surface-2 hover) + 4. premium audyt jako `card-spotlight-orange` z mock UI (PDF preview + SoV bar chart + 23 action items) w semi-transparent inset surface.

### 3. `d4c715b refactor(widocznosc-framer): homepage komponenty 5-11 na pure Framer`
- **StatsBand** – 4 stats display-md ink + caption ink-muted labels, hairline-soft borders.
- **Process** – numery display-lg ink z hairline connector zamiast accent linii, bullets z subtle dot prefix.
- **Differentiators** – 4-up grid charcoal, numerki display-md ink-muted (zamiast feat-icon orange).
- **Industries** – 3-col grid charcoal, no symbols.
- **Authority** – 4 stat-cards z accent-blue source links (właściwe użycie blue jako link), hairline source-border.
- **AuthorsStrip** – charcoal grid 4-up, Mateusz featured = surface-2 lift (NIE neon-glow). Avatary 80px radius full.
- **RecentArticles** – featured 16:9 + 2 thumb 4:3 surface-1 + hover surface-2. Category jako micro pill.
- **FAQ** – faq-row na canvas, hairline-soft dividers, ink-muted icon.
- **CTABand** – pure canvas + display-xl 85px + 2 pill CTAs. NIE gradient (limit zużyty).
- **Footer** – dense link grid monochrome, btn-icon-circular dla socials, newsletter z text-input + btn-primary, plain wordmark.

### 4. `24e2a40 refactor(widocznosc-framer): blog listing + Article + [slug] na pure Framer`
- **blog/index.astro** – hero pure canvas + display-xl, filtry kategorii jako `pricing-tab` style, featured artykuł `card-mockup` full-width, 3-col grid `post-card` surface-1. Glass cards backdrop-blur OUT, gradient overlays OUT.
- **Article.astro** – reading column 720px max-width + 17px body line-height 1.65 (Framer premium long-form). Sidebar 320px sticky surface-1 (autor + 3 testy + share btn-icon-circular). Inline content :global(): zwykłe bullets, surface-2 thead tabel, hairline-soft callouts, terminal code z ink-muted dots, accent-blue inline links.
- **blog/[slug].astro** – related posts jako `card-template` surface-1 lift, display-md "Zobacz również", brak orange chipów.

## Co usunięte ze structural use

- `.btn-primary orange + glow shadow` → white pill
- `.btn-ghost border` → out (zastąpione `.btn-secondary` charcoal)
- `.chip` / `.chip-dot` → out
- `.feat-icon` orange → out
- `.card-featured` orange gradient → surface-2 lift
- `.status` / `.status-dot` → out
- `.logo-mark` orange tile → out
- `.logo-wordmark` pulse + radar → plain Mona Sans
- `.image-glow-border` custom radial → out
- `diagonals.css` → out
- `.badge-primary` orange → charcoal
- `.contained-button` / `.outlined-button` → mapowane na pill system
- `.meta` mono uppercase orange → `.eyebrow` caption sentence-case ink-muted

## Stan podstron (NIE refaktorowane w sesji)

`kontakt.astro`, `o-nas.astro`, `narzedzia.astro`, `narzedzia/*`, `pozycjonowanie-ai/*`, `autor/*` – dziedziczą Theme.css + Navbar/Footer = automatycznie pociągnięte przez @theme legacy mapping. Build przechodzi, ale per-page wizualne poprawki mogą być potrzebne po Lighthouse review.

## Nie zrobione (kontynuacja)

1. **Visual review po deploy** – zwłaszcza hero violet spotlight + audyt orange spotlight + reading column 720/17px na artykułach.
2. **Lighthouse / a11y audit** po visual review (Core Web Vitals, kontrast, focus rings).
3. **Podstrony per-page poprawki** – jeśli legacy mapping zostawia jakieś orange odwołania widoczne wizualnie.
4. **Visibility Checker MVP** (Plan 4) – real scraper LLM + Cloudflare D1 + Turnstile + Resend.
5. **Polityka prywatności + RODO + ICEA legal data**.
6. **Schema.org Article + Person JSON-LD** per blog/author.
7. **llms.txt + ai.txt** dla widocznosc.ai (eat your own dogfood).
8. **Kontakt formularz submit** (CF Worker albo Resend API).

## Memory zaktualizowane

- `feedback_widocznosc_design_dna.md` – z Linear+SpaceX+ICEA paleta na pure Framer (foundation, komponenty, antypatterns).
- `project_widocznosc_ai_progress.md` – nowy HEAD, branch, sesja 3, stan po pivocie, otwarte zadania.
- `reference_widocznosc_ai_paths.md` – nowe preview URL, oba branche, spec doc, font deps.
- `MEMORY.md` index – linie 12 i 54 zaktualizowane.

## Stack po pivocie

- Astro 6.1 + Tailwind 4 (vite plugin, CSS-first @theme)
- Mona Sans Variable + Inter Variable z OpenType variants `cv01/05/09/11`, `ss03/07`, `dlig`, `tnum`
- pnpm 10.33.3 / Node 22.12+
- Sharp image optymalization
- 21 stron statycznych: index, blog/index, 4 artykuły blog, 4 strony autor, 5 stron pozycjonowanie-ai/*, 1 narzedzia/ai-bots-check, narzedzia, kontakt, o-nas, 404, pozycjonowanie-ai
