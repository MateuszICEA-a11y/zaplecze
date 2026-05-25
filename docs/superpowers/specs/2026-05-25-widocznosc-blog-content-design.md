# Spec: Blog widocznosc.ai – produkcja contentu + restrukturyzacja URL

**Data:** 2026-05-25
**Gałąź:** `feat/landing-redesign-2026-05-09` (kontynuacja) lub nowa `feat/blog-content`
**Status:** zatwierdzony design, przed planem wykonawczym

---

## 1. Cel

Wystartować bazę wiedzy widocznosc.ai: napisać ~31 nowych artykułów blogowych w 6 pillarach
(+ migracja 4 istniejących)
(pełny pipeline pod GEO/SEO) oraz uzupełnić 4 strony usługowe `/pozycjonowanie-ai/[slug]`
pod ofertę. Jednocześnie przebudować routing bloga z płaskiego `/blog/[slug]` na strukturę
pillarową `/[pillar]/[slug]`.

Źródło merytoryczne: `portals/widocznosc.ai/widocznosc-ai-blog-wiedza/` (~35 plików reference,
research wygenerowany zewnętrznie – traktowany jako baza faktów, NIE kopiowany 1:1).

Zakres: tylko artykuły, do których mamy materiał reference. Reszta struktury – później.
Grafiki wyróżniające i infografiki – NIE teraz (wspólny placeholder).

---

## 2. Inwentaryzacja i mapa contentu

### Tor A – blog (markdown, pełny pipeline)

| Pillar (URL) | Pillar page (`przewodnik`) | Spokes / huby (slug) |
|---|---|---|
| `/geo/` | Generative Engine Optimization – kompletny przewodnik | `czym-jest-geo`, `jak-llm-cytuja-zrodla`, `audyt-widocznosci-marki`, `narzedzia-monitoring-wzmianek`, `schema-org-dane-strukturalne`, `llms-txt`, `geo-dla-ecommerce`, `geo-dla-lokalnego-biznesu`, `roi-z-geo`, `najczestsze-bledy-geo` |
| `/modele-llm/` | Modele językowe (LLM) – przewodnik po ekosystemie | `chatgpt` (hub), `co-potrafi-chatgpt`, `claude` (hub), `copilot` (hub), `perplexity` (hub) |
| `/prompty/` | Prompt engineering – kompletny przewodnik | – |
| `/agenci-ai/` | Agenci AI – czym są, jak działają | `anatomia-agenta` |
| `/rag/` | RAG – przewodnik wdrożeniowy | `embeddingi`, `chunking-strategie`, `reranking` |
| `/ai-w-biznesie/` | Wdrożenie AI w firmie – przewodnik dla decydenta | `od-czego-zaczac`, `ai-act-rodo`, `roi-z-ai`, `ai-w-marketingu`, `ai-w-sprzedazy`, `ai-w-obsludze-klienta` |

**Migracja istniejących 4 wpisów** z `/blog/` do `/geo/`:
`topical-authority-pillar-cluster`, `query-fan-out-google-ai-mode`,
`share-of-voice-zamiast-rankingu`, `gptbot-claudebot-perplexitybot-przewodnik`.

**Cleanup:** „Reranking" ma 2 reference duplikaty – używamy lepszego, drugi pomijamy.

### Tor B – strony usługowe (enrich `MODEL_CONTENT` w `src/data/aiModelsContent.ts`)

Format strukturalny TS (NIE markdown): `heroSubtitle`, `howItWorks[]`, `optimization[]`,
`signals[]`, `faq[]`. Pisane pod ofertę (komercyjny, sprzedażowy ton, CTA do audytu).

| Model (slug) | Reference file |
|---|---|
| `chatgpt` | Pozycjonowanie w chat gpt |
| `claude` | Pozycjonowanie w Antropic Claude |
| `gemini` | Pozycjonowanie w gemini |
| `bing-copilot` | Pozycjonowanie w Bing Co-Pilot |

(Perplexity ma już treść w `MODEL_CONTENT` – pomijamy lub lekko wzbogacamy.)

---

## 3. Architektura routingu (restrukturyzacja URL)

- **Struktura plików:** `src/content/blog/<pillar>/<slug>.md` → `post.id` = `"geo/czym-jest-geo"`.
  Glob loader (`**/*.md`) obsługuje podfoldery bez zmian.
- **Route:** jeden plik `src/pages/[pillar]/[slug].astro` z `getStaticPaths` mapującym
  `post.id` → `{ pillar, slug }`. Pillar page = wpis o slugu `przewodnik` (URL `/geo/przewodnik/`).
- **Schema (`src/content.config.ts`):**
  - usuń `category` (enum 6 starych wartości) → dodaj `pillar` (enum: `geo, modele-llm, prompty, agenci-ai, rag, ai-w-biznesie`)
  - dodaj `intent` (enum: `INFO, COMPARE, HOWTO, TOOL, COMMERCIAL`, opcjonalne)
  - dodaj `level` (enum: `L1, L2, L3`, opcjonalne)
  - `image` zostaje wymagane (placeholder, patrz §4)
- **Listing:** `/blog/index.astro` → globalny hub „Baza wiedzy" linkujący do `/[pillar]/[slug]`.
  Opcjonalnie później: per-pillar listing `/[pillar]/index.astro`.
- **Usunięcie** `src/pages/blog/[slug].astro`. Redirecty 301 dla 4 migrowanych wpisów
  w `public/_redirects` (CF Pages): `/blog/<old-slug>` → `/geo/<new-slug>`.
- **Brak kolizji:** pillary nie kolidują ze statycznymi segmentami
  (`/narzedzia`, `/pozycjonowanie-ai`, `/o-nas`, `/kontakt`) – statyczne wygrywają nad dynamicznym.
- **Aktualizacja nawigacji + linków:** `Navbar.astro`, `Blog.astro`, `RecentArticles.astro`,
  homepage, oraz interlinki w 4 istniejących artykułach (z `/blog/` na `/[pillar]/`).

---

## 4. Obrazki (placeholder)

- `image` pozostaje wymaganym polem schemy.
- Wszystkie nowe wpisy: **jeden wspólny placeholder** (neutralny obrazek z `src/assets/images/`,
  do wyboru najmniej tematyczny – kandydat `blog1.png`).
- Avatary autorów (4 osoby: Mateusz Wiśniewski, Michał Ziach, Piotr Wicenciak, Tomasz Czechowski)
  – istnieją, przydzielane rotacyjnie wg dopasowania ekspertyzy do tematu.
- Styl docelowych grafik – osobny etap, później. Podmiana per wpis bez zmian w schemie.

---

## 5. Pipeline pisania (per artykuł, Tor A)

Zgodnie z `docs/writing-rules.md`. Reference file = baza merytoryczna, tekst pisany od nowa
w głosie widocznosc.ai.

1. **Ekstrakcja faktów** z reference file (statystyki, badania Princeton/KDD, liczby, daty).
2. **Draft** wg `writing-rules.md`: BLUF, burstiness, min. 2 listy + min. 1 tabela,
   pogrubienia całych zdań, struktura H2/H3, wstęp 1 akapit bez nagłówka.
3. **Callouty OBOWIĄZKOWE (oba):**
   - `callout-fact` („Ciekawostka", ikona `✦`) – nieoczywisty fakt/kontekst historyczny.
   - `callout-expert` („Opinia eksperta", avatar autora) – pierwszoosobowa obserwacja
     z praktyki ICEA + `callout-author` (Imię · Rola, ICEA).
   - Markup wg wzorca z istniejących wpisów (`src/components/Article.astro` ma CSS).
4. **Humanizacja Sonnet** (subagent).
5. **Self-review** wg checklisty `writing-rules.md`: kalki językowe, półpauzy (–, nigdy —),
   fleksja, linkowanie wewn. 3-5 + min. 1 Wikipedia (pojęcie techniczne) + źródła badań (arxiv/blog).
6. **Post-processing:** zamiana zmyślonych shortcode'ów na markdown, em-dash → en-dash,
   weryfikacja frontmatter (pillar, intent, level, image, author, tags, readTime).

---

## 6. Batching i kolejność

Partiami per pillar (najpierw pillar page, potem spokes). Kolejność priorytetu:

1. **GEO** (przewaga konkurencyjna ICEA) – 1 pillar + 10 spokes + 4 migracje
2. **Modele LLM** – 1 pillar + 5 (huby + spoke)
3. **AI w biznesie** – 1 pillar + 6 spokes
4. **RAG** – 1 pillar + 3 spokes
5. **Agenci AI** – 1 pillar + 1 spoke
6. **Prompty** – 1 pillar
7. **Tor B – strony usługowe** (osobna, ostatnia partia)

Każda partia = osobny commit na gałęzi. Restrukturyzacja routingu (§3) jako pierwsza partia
techniczna PRZED pisaniem (żeby wpisy od razu lądowały w docelowej strukturze).

---

## 7. Aktualizacja `writing-rules.md` (self-healing)

- Zmiana reguły calloutów: z „max 1-2" na **„oba callouty obowiązkowe: Ciekawostka + Opinia eksperta"**.
- Dodanie pól frontmatter `pillar`, `intent`, `level` do opisu struktury.

---

## 8. Poza zakresem (na później)

- Generowanie docelowych grafik wyróżniających i infografik (osobny etap stylu).
- Artykuły bez materiału reference (reszta struktury z 7 pillarów).
- Pillar 7 (Multimedia generatywne).
- Per-pillar listing pages, badge'y intent/level w UI.
- Pozostałe huby/spokes/versusy z pełnej struktury (Grok, open-source, tematy przekrojowe,
  porównania versus).
