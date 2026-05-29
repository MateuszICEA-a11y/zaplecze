# News pipeline dla widocznosc.ai – projekt

**Data:** 2026-05-29
**Status:** zaakceptowany (brainstorming) → do rozpisania planu implementacji

## Cel

Codzienny, w pełni automatyczny pipeline, który: pobiera newsy z branżowych źródeł AI (EN), wybiera najlepszy temat dnia, pisze polski wpis (streszczenie + ekspercki komentarz ICEA), generuje hero w stylu widocznosc.ai i publikuje go w nowej sekcji **News** na portalu (Astro + Cloudflare Pages).

Model relacji: News wzmacnia autorytet portalu (warstwa 1 lejka GEO→ICEA, por. `project-widocznosc-leadgen`), buduje świeżość i cytowalność w LLM-ach.

## Decyzje (z brainstormingu)

1. **Architektura:** klon istniejącego `pipeline/news-generator/` (BusManiak) do osobnego folderu. BusManiak nietknięty.
2. **Źródła:** kuratorowane RSS EN (jakość) – przetwarzane EN→PL z komentarzem eksperckim.
3. **Format wpisu:** News + komentarz ekspercki ICEA, ~400–600 słów.
4. **Sekcja:** osobna kolekcja Astro `news`, routing `/news/` (listing) + `/news/[slug]`, schema `NewsArticle`.
5. **Selekcja tematu:** pełny scorer jak BusManiak (świeżość + trafność + trendy DataForSEO + unikalność + dedup).
6. **Obraz:** kie.ai `gpt-image-2`, 16:9 2K, HERO_STYLE widocznosc (obsidian `#070810` + sky-blue `#0a9cff`, abstrakcyjna ilustracja, bez tekstu) → webp.
7. **Publikacja:** pełny automat – GitHub Actions cron + auto-commit/push → rebuild Cloudflare.
8. **Nawigacja:** News w dropdownie „Baza wiedzy".
9. **Autor:** „Redakcja widocznosc.ai" (zbiorczy), nota „opracowanie redakcyjne na podstawie [źródło]". Świadomie NIE podpisujemy auto-generowanego komentarza konkretnym ekspertem.

## Architektura

Dwie części:
- **A. Pipeline (Python)** – `pipeline/news-generator-widocznosc/` – generuje plik markdown + obraz, aktualizuje historię.
- **B. Front (Astro)** – nowa kolekcja `news` + routing + schema + nawigacja w `portals/widocznosc.ai/`.

Spinają je: ścieżki zapisu (pipeline pisze do `portals/widocznosc.ai/src/content/news/` i `src/assets/images/`) oraz GitHub Action (uruchamia pipeline, commituje wynik).

### A. Pipeline – komponenty (kopie z BusManiak, dostosowane)

| Plik | Rola | Zmiany względem BusManiak |
|------|------|---------------------------|
| `feeds.yaml` | źródła RSS | nowe: Search Engine Land, Search Engine Journal, TechCrunch (AI), The Verge (AI), VentureBeat AI; kategorie `ai-search`, `llm`, `geo`, `general-ai` |
| `config.yaml` | konfiguracja | portal `widocznosc.ai`, `content_dir: portals/widocznosc.ai/src/content`, `output_section: news`, `assets_dir: portals/widocznosc.ai/src/assets/images`, autor „Redakcja widocznosc.ai", format 400–600 słów, seeds trendów PL (AI/GEO) |
| `collector.py` | pobiera RSS | bez zmian (parametryzowane przez feeds.yaml) |
| `scorer.py` | wybór tematu | bez zmian logiki; nowe seeds w configu |
| `generator.py` | pisze wpis | nowy prompt: EN→PL, streszczenie + „Co to oznacza dla widoczności w AI"; output frontmatter kolekcji `news`; atrybucja źródła |
| `image_generator.py` | hero | HERO_STYLE widocznosc (z `pipeline/widocznosc-kie-images.py`), zapis `news-{slug}.webp` do assets; bez infografiki; walidacja jak w oryginale |
| `postprocessor.py` | frontmatter + slug | schemat frontmatteru kolekcji `news` (patrz niżej) |
| `main.py` | orkiestracja | ścieżki zapisu Astro; guard raz/dzień; brak tematu > próg → koniec bez publikacji |
| `published.json` | dedup/historia | własny, pusty na start |
| `requirements.txt`, `tests/` | zależności + testy | port testów scorera/parsera + nowe dla frontmatteru news i atrybucji |

### B. Front Astro – komponenty

- **`src/content.config.ts`** – nowa kolekcja `news`:
  ```
  news = defineCollection({ loader: glob('**/*.md', './src/content/news'), schema: ({image}) => z.object({
    title, lead (string), date (date), image (image()),
    sourceName (string), sourceUrl (string url),
    tags (string[]), author (default 'Redakcja widocznosc.ai')
  })})
  ```
  Lekki, bez `pillar/intent/level/faq` (to nie evergreen blog).
- **`src/pages/news/index.astro`** – listing chronologiczny (najnowsze u góry), karty: data, tytuł, lead, źródło. CollectionPage + ItemList w schema.
- **`src/pages/news/[slug].astro`** – pojedynczy news: lead, treść, nota „opracowanie redakcyjne na podstawie [sourceName]" z dofollow linkiem do `sourceUrl`, hero. Emituje `newsArticleNode`.
- **`src/lib/schema.ts`** – nowy `newsArticleNode` (`@type: NewsArticle`: headline, datePublished, image, author Organization/Person redakcja, publisher Organization, isPartOf, `mentions`/cytowanie źródła) + breadcrumb.
- **`src/components/NewsCTA.astro`** – box CTA wyświetlany w każdym `/news/[slug]`. Statyczny (na teraz, bez formularza inline – backend leadów odłożony). Treść: „Zamów audyt widoczności w AI" → link `/kontakt/?type=audyt-ai`. Reużywalny, łatwy do późniejszej podmiany na formularz e-mail, gdy powstanie backend leadów.
- **Nawigacja** (`Navbar`) – pozycja „News" w dropdownie „Baza wiedzy", link `/news/`.

> **Zależność:** box CTA kieruje do `/kontakt/?type=audyt-ai`, a formularz `/kontakt/` jest obecnie atrapą (nie wysyła danych – por. `project-widocznosc-leadgen`). Aby CTA z News miał wartość biznesową, naprawa formularza kontaktu powinna nastąpić przed/wraz z uruchomieniem News. To osobne zadanie, ale tu odnotowane jako warunek sensu CTA.

## Data flow (jedno uruchomienie)

```
cron (GitHub Action)
  → collector: pobiera wszystkie feeds.yaml → lista sygnałów (tytuł, url, źródło, data)
  → scorer: świeżość + trafność + trendy DataForSEO + unikalność + dedup(published.json) → 1 temat (lub brak → STOP)
  → generator: LLM(gpt-5.4) z oryginałem EN → PL: {title, lead, body (streszczenie + komentarz ICEA), tags}
  → image_generator: LLM→prompt sceny (HERO_STYLE) → kie.ai → webp → src/assets/images/news-{slug}.webp
  → postprocessor: frontmatter news + slug → markdown
  → main: zapis src/content/news/{slug}.md, update published.json
  → GitHub Action: git add news/ + images + published.json → commit → push → Cloudflare rebuild
```

## Atrybucja źródła (prawo + wiarygodność)

Każdy wpis: nie kopiuje oryginału (streszczenie + własny komentarz). W treści i schemie: nazwa źródła + **dofollow** link do oryginału. Nota redakcyjna „opracowanie redakcyjne na podstawie [sourceName]". W `NewsArticle` schema: relacja do źródła (`isBasedOn`/`citation`).

## Error handling / bezpieczeństwo

- Guard „opublikowano dziś" + „plik istnieje" → brak duplikatów.
- Brak tematu ≥ próg → pipeline kończy bez publikacji (nie wymusza wpisu „na siłę").
- kie.ai / LLM: retry + timeout jak w istniejących skryptach; gdy obraz padnie → fallback placeholder (np. istniejący hero ogólny) zamiast blokować publikację.
- Sekrety w GitHub Secrets: `OPENAI_API_KEY`, `DATAFORSEO_LOGIN`, `DATAFORSEO_PASSWORD`, `KIE_API_KEY`.
- Build Astro waliduje frontmatter (zod) – błędny frontmatter zatrzyma deploy, nie wpuści śmiecia.

## Testy

- Port z BusManiak: testy scorera, parsera fanout/url (te istotne).
- Nowe: walidacja frontmatteru kolekcji `news` (zgodność ze schematem zod), obecność atrybucji źródła w outpucie, slug-generacja, dedup.
- `astro build` jako test integracyjny kolekcji (75+ → 76+ stron, listing + przykładowy news).

## Poza zakresem (YAGNI)

- Box CTA w News **jest** w zakresie (statyczny link do `/kontakt/?type=audyt-ai`). Poza zakresem zostaje **inline formularz e-mail / capture w boxie** – czeka na decyzję o backendzie leadów (`project-widocznosc-leadgen`).
- Brak newslettera.
- Brak infografiki dla News (tylko hero).
- Brak human-gate / progu hybrydowego (user wybrał pełny automat).
- Brak generalizacji wspólnego pipeline multi-portal (user wybrał klon).
- Brak rankingów agencji, brak treści komercyjnej w News (warstwa 1 zostaje redakcyjna).

## Otwarte parametry do ustalenia w planie

- Dokładne URL-e RSS (zweryfikować, że feedy działają i mają kategorie AI).
- Próg `min_score_threshold` i wagi scorera dla źródeł EN (start: jak BusManiak, strojenie po obserwacji).
- Godzina crona (proponowane 6:00 UTC).
