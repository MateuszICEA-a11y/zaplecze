# widocznosc.ai – Session Resume Doc (Tailcast pivot)

**Last session:** 2026-05-06 (godz. ~12:00 → 19:55)
**Branch:** `feat/widocznosc-ai-tailcast`
**Status:** Tailcast baseline + HANDOFF B Structural + nasza struktura per model AI + autorzy ICEA. 22 strony build OK, deployed na CF Pages preview.

## Kontekst

Wczoraj użytkownik dał Tailcast template (https://github.com/matt765/Tailcast) jako bazę zamiast custom Linear+SpaceX designu z plan-1 (zachowane na branchu `feat/widocznosc-ai-plan-1`). Następnie HANDOFF.md + tokens.css z kierunkiem **B Structural** – ICEA orange jako dominujący accent.

## Co zrobione dziś (chronologicznie)

### Faza 1 – Tailcast baseline (commits 5800d33 → 06e5c60)

1. **Pivot z plan-1 na Tailcast** (commit 5800d33): nowy branch off main, replace `portals/widocznosc.ai/` z Tailcast 2.0 (Astro 6.1 + Tailwind 4 + Inter/Playfair, dark SaaS template). Adjustments: package.json name, engines >=20, sharp, wrangler, site URL.
2. **Node 22 pin** (4eade2f): `.nvmrc` + `.tool-versions` dla CF Pages bo Astro 6 wymaga >=22.12.0.
3. **Warstwa 1 – identity** (954e651): logo CSS `widocznosc•ai` z radar pulse + lang=pl + canonical widocznosc.ai + favicon port z plan-1 + page titles.
4. **Logo iteracje** (76c0715, 06e5c60): symmetric spacing, radar dual-color, ai shimmer, większe text-2xl/3xl.
5. **Warstwa 2 – ICEA paleta** (2315bc1): Blue+Orange+Midnight z plan-1 DESIGN.md → mapping na Tailcast tokens.
6. **Orange wzmacnianie** (8805125, 3fc9840): hero mesh dual-tone, Live demo orange button, CtaBottom mesh – po feedbacku "prawie wcale nie widać".

### Faza 2 – HANDOFF B Structural (6b5931d → de5a4e9)

User dał `tokens.css` + `HANDOFF.md` z konkretnym design system: orange jako structural accent, near-black `#070810`, Inter Tight + JetBrains Mono.

7. **Etap 1 tokens** (6b5931d): Theme.css przebudowany 390 linii. Nowy system bg/ink/rule/accent + legacy mapping primaryColor→accent.
8. **Etap 2 fonts** (7de0b46): Inter Tight + JetBrains Mono via @fontsource, drop Playfair.
9. **Etap 3 Nav** (844c5ee): .logo-mark kafelek "w" + "widoczność.ai" tekst, status pill "5 modeli · live", CTA "Zamów audyt", PL nav links.
10. **Etap 4 Hero PL** (de5a4e9): "Bądź widoczny tam, gdzie pytają AI." – **OVER-REACH**. User: *"bzdury treści mnie nie interesowały, tylko style"*. Patrz `feedback_design_not_content.md` w memory.

### Faza 3 – PL routes + struktura (2409cd0 → 0fba50e)

11. **Mega menu + style sweep** (2409cd0): mega menu Pozycjonowanie AI z dropdown 2 kolumny, /pozycjonowanie-ai = kopia services.astro 1:1, /kontakt = kopia contact.astro, blog Daty PL + .meta + .chip styling, Pricing card-featured Standard plan, Article.astro PL (Wróć do bloga, Udostępnij), social icons currentColor.
12. **Cleanup major** (723c9c3): rebuild homepage z handoff sekcja 4 – wycofane Tailcast Pricing/BentoFeatures/Testimonials/Brands/Gallery/FAQ/Features1-2-Diagonal/CtaBottom/Blog. Stworzone 6 nowych komponentów: StatsBand, FeatureGrid, ToolTeaser, RecentArticles, AuthorsStrip, CTABand. Wszystkie strony PL: /pozycjonowanie-ai (overview placeholder), /narzedzia (3 narzędzia), /o-nas (4 zasady + zespół), /kontakt PL form.
13. **Footer + Modal PL** (część 723c9c3): Usługi/Narzędzia/Firma kolumny, newsletter PL z btn-primary, ICEA brand block, social hover orange.
14. **/kontakt + blog categories** (f33e964): /kontakt rebuild PL z select 6 typów + URL param ?type=, blog 6 enum kategorii (ai-search/geo/content/narzedzia/case-study/definicje) + CATEGORY_LABELS export.
15. **/careers usunięte** (37b8e21): Tailcast SaaS hiring page, nielinkowane.
16. **Keyword research** (37b8e21): `docs/widocznosc-ai/keyword-map.md` – 126 fraz Senuto, top 5 priorytetów, gap analysis, konkurenci PL.
17. **Blog category chips** (02811da): UI display kategorii w RecentArticles + blog/index cards.
18. **OG image** (02811da): port z plan-1.
19. **Authors port** (0fba50e): 4 ekspertów ICEA z plan-1 (Mateusz Wiśniewski, Michał Ziach, Piotr Wicenciak, Tomasz Czechowski). Authors collection w content.config z bogatszą E-E-A-T schemą. Pliki .mdx → .md (brak @astrojs/mdx integration).

### Faza 4 – Per-model + autorzy (4ce50ed → 5a0565d)

20. **Per-model AI struktura** (4ce50ed) – po feedbacku *"zaplanowaliśmy strukture stron usługowych, pozycjonowanie ai, w chat gpt itd, wdrożyłeś coś całkowicie innego"*:
    - Source of truth `data/aiModels.ts` (5 modeli) + `data/aiModelsContent.ts` (per-model content)
    - Pillar `/pozycjonowanie-ai` rebuild: hero + grid 5 modeli + 4 services condensed
    - Dynamic route `/pozycjonowanie-ai/[slug]` z getStaticPaths → 5 stron:
      - /chatgpt – training data + SearchGPT + Custom GPT
      - /claude – Constitutional AI + web search + Artifacts
      - /gemini – Google Search + AI Overviews + SGE
      - /perplexity – citation-first + Pro Search + Discover
      - /bing-copilot – Bing index + Azure + IndexNow
    - Każda podstrona: hero + howItWorks (3) + optimization (4) + signals (top 5) + FAQ (3) + pozostałe modele + CTA
    - Mega menu Nav: dwie kolumny – "Modele AI" (5) + "Metodologia" (4 services condensed)
    - Footer: kolumna "Modele AI" zamiast "Usługi"

21. **Autorzy /autor/[slug]** (5a0565d) – po feedbacku *"a gdzie ci autorzy?"*:
    - Dynamic route `/autor/[slug].astro` z getStaticPaths → 4 strony per ekspert
    - Każda strona: breadcrumb + hero z foto 192px + bio + expertise pills + linki (Profil ICEA + opcjonalnie LinkedIn/Twitter/Email) + sekcja "Artykuły · N" (placeholder gdy 0 postów) + "Pozostali eksperci" (3 inne) + CTABand
    - AuthorsStrip relink z external grupa-icea.pl → wewnętrzne /autor/[slug]

## Stan końcowy

**22 strony statyczne** zbudowane:
- `/` (homepage – Hero + StatsBand + FeatureGrid + ToolTeaser + RecentArticles + AuthorsStrip + CTABand)
- `/pozycjonowanie-ai` (pillar overview)
- `/pozycjonowanie-ai/{chatgpt,claude,gemini,perplexity,bing-copilot}` (5 podstron per model)
- `/narzedzia` (3 narzędzia: Visibility Checker bezpłatny + 2 płatne audyty)
- `/o-nas` (4 zasady + AuthorsStrip + CTA)
- `/kontakt` (PL form z URL param ?type= auto-select, ICEA biuro)
- `/autor/{mateusz,michal,piotr,tomasz}` (4 strony ekspertów)
- `/blog` (Baza wiedzy listing) + 6 Tailcast EN posts (do wymiany na PL content)
- `/404`

## Otwarte pytania / TODO

### Blokujące (do następnej sesji)

- **Hero images / OG / illustrations** – aktualnie wszystko text + radial gradients. User wspomniał "generujemy zdjęcia na homepage angażujące". Decyzja co konkretnie generować i przez jakie API (kie.ai key w memory, lub nano banana via skill `claude-seo:seo-image-gen`).
- **Tailcast EN blog posts** – 6 generic posts w content/blog (Real-time data processing, Future of business intelligence etc.). Do wymiany na PL artykuły z keyword-map quick wins (pozycjonowanie w chatgpt 140/m, przegląd od ai 390/m, geo seo 320/m, llmo, geo vs seo, llm seo).
- **PL artykuły** – z keyword-map sekcja 8 (10 quick wins) + sekcja 5 (klastry per kategoria). Plan: 24 artykuły / 3 mc, 2× tydzień.
- **Visibility Checker MVP** – `/narzedzia/visibility-checker` (linkowany z hero CTA + ToolTeaser CTA + Nav). Wymaga Astro Island + LLM API (3 modele) + Cloudflare D1 + Turnstile + Resend. Plan 4 z plan-1 roadmap.

### Mniej pilne

- **Polityka prywatności + RODO** – /polityka-prywatnosci link w Footer ale strona nie istnieje. ICEA legal data placeholdery do uzupełnienia.
- **404 page styling** – Tailcast generic, do PL + handoff style.
- **InvitationModal działanie** – submit nie wysyła nigdzie (placeholder UI). Resend integration w Plan 5.
- **Schema.org Article + Person** – JSON-LD dla blog posts i author pages (handoff sekcja 6 "next moves").
- **llms.txt + ai.txt** – sygnały dla LLM crawlerów (handoff sekcja 6).
- **Kontakt formularz submit** – aktualnie tylko UI fade-in success state. Wymaga Cloudflare Worker albo external service.
- **a11y test** – po wszystkich zmianach Lighthouse CI nie przechodził (test config z plan-1, niezgodny z nowym Tailcast).
- **/services i /contact** – stare routes usunięte, ale 404 pewnie linkują do nich z indexów. Sprawdzić sitemap + robots.

## CF Pages config

- Project: `widocznosc-ai`
- Branch: `feat/widocznosc-ai-tailcast`
- Build cmd: `pnpm --filter widocznosc.ai build`
- Output: `portals/widocznosc.ai/dist`
- Node: 22 (z .nvmrc + .tool-versions w root)
- LEAD_INBOX env: `m.wisniewski@grupa-icea.pl` (MVP test)

## Niezakomitowane (z poprzednich sesji, niezwiązane z widocznosc.ai)

`git status` w drzewie roboczym – do ignorowania w kontekście tej sesji:
- M docs/dokumentacja-busmaniak-proces.html
- ?? .playwright-mcp/, .superpowers/, branding guidelines/
- ?? docs/sesja-3-podsumowanie-2026-03-25.md
- ?? docs/superpowers/plans/2026-04-01-fb-autoposter.md
- ?? moto-pl-after.jpg
- ?? pipeline/content-writer/portals/
- ?? pipeline/content-writer/references/keyword-research.md
- ?? pipeline/regenerate-images.py
- ?? portals/busmaniak.pl/portals/

## Pełne reference do kontynuacji

- **Spec design**: `docs/superpowers/specs/2026-05-06-widocznosc-ai-design.md` (1069 linii, plan-1)
- **Plan 1**: `docs/superpowers/plans/2026-05-06-widocznosc-ai-plan-1-foundation.md` (3415 linii)
- **HANDOFF B Structural**: `~/Downloads/HANDOFF.md` + `~/Downloads/tokens.css` (user lokalnie)
- **Keyword map**: `docs/widocznosc-ai/keyword-map.md` (top 5 fraz, gap analysis, 24-art plan)
- **DESIGN.md plan-1**: `portals/widocznosc.ai/DESIGN.md` na branchu `feat/widocznosc-ai-plan-1` (Linear+SpaceX hybrid)
- **Memory**: `~/.claude/projects/-mnt-c-projekty-icea-transformacja-zaplecza-seo/memory/`:
  - `project_widocznosc_ai_progress.md` – status
  - `feedback_widocznosc_design_dna.md` – design DNA preference
  - `feedback_design_not_content.md` – nie ruszać contentu przy zmianach style
  - `reference_widocznosc_ai_paths.md` – ścieżki, autorzy, brand reference

## How to resume next session

```bash
cd /mnt/c/projekty/icea/transformacja-zaplecza-seo
git checkout feat/widocznosc-ai-tailcast
git log --oneline | head -10
```

Następna sesja zaczyna od:
- Wybór: hero images generation OR PL content production OR Visibility Checker MVP OR a11y/legal/schema cleanup
- User decyzja co priorytetem

## Commit log dziś (24 commitów)

```
5a0565d feat(widocznosc): /autor/[slug] – 4 strony per ekspert ICEA
4ce50ed fix(widocznosc): struktura per model AI – 5 podstron + pillar overview
0fba50e feat(widocznosc): port autorów z plan-1 + authors collection
02811da feat(widocznosc): blog category chips + og-image port
37b8e21 chore(widocznosc): remove /careers Tailcast + keyword research output
f33e964 feat(widocznosc): /kontakt PL rebuild + blog categories taxonomy
723c9c3 feat(widocznosc): nasza struktura + komponenty handoff sekcja 3 + PL routes
2409cd0 feat(widocznosc): mega menu + PL routes + style sweep blog/Article + Pricing featured
de5a4e9 feat(widocznosc): HANDOFF Etap 4 – Hero copy PL + structure
844c5ee feat(widocznosc): HANDOFF Etap 3 – Nav redesign (logo + status + CTA)
7de0b46 feat(widocznosc): HANDOFF Etap 2 – Inter Tight + JetBrains Mono
6b5931d feat(widocznosc): HANDOFF Etap 1 – nowa paleta tokens (B Structural)
3fc9840 fix(widocznosc): orange znacznie wzmocniony – widoczny statycznie
8805125 feat(widocznosc): orange akcent (logo + hero mesh + CTA glow)
2315bc1 feat(widocznosc): warstwa 2 – ICEA paleta (Midnight + Blue + Orange)
06e5c60 fix(widocznosc): logo larger – text-2xl mobile / text-3xl desktop
76c0715 fix(widocznosc): logo – symmetric spacing + radar pulse + ai shimmer
954e651 feat(widocznosc): warstwa 1 – identity (logo + lang + URLs)
4eade2f ci(widocznosc): pin Node 22 for Cloudflare Pages
5800d33 chore(widocznosc): replace with Tailcast 1:1 baseline
55c28e8 chore(monorepo): add pnpm workspace + ignore patterns
13f1e55 plan(widocznosc-ai): set lead inbox to m.wisniewski@grupa-icea.pl (MVP test)
ca46b7d plan(widocznosc-ai): Plan 1 – Foundation + brand + content infra
99b8559 spec(widocznosc-ai): rev po Codex review + impeccable integration
ef9d752 spec: widocznosc.ai design (2026-05-06)
```
