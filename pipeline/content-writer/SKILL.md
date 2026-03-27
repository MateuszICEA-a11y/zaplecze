---
name: zaplecze-content-writer
description: >
  Full content pipeline for BusManiak.pl in Claude Code. Handles keyword research
  (SerpData + Senuto VA + DataForSEO), article drafting (Gemini Flash via OpenRouter),
  humanization self-review, post-processing (frontmatter, shortcodes), and hero image
  generation (kie.ai). Use this skill whenever creating content for BusManiak.pl or
  zaplecze.pages.dev. Triggers: "napisz artykuł", "nowy wpis", "content dla BusManiak",
  "artykuł o busach/kamperach/vanach", "keyword research dla BusManiak", "wygeneruj
  treść", or any reference to creating content for the van/bus portal. This skill
  replaces system_prompt.txt and humanize_prompt.txt – it IS the pipeline.
  Portal scope: delivery vans, buses, campers, camper conversions, vanlife.
  NOT city buses or public transport.
---

# BusManiak.pl – Content Pipeline (Claude Code)

Full 6-stage pipeline for creating SEO content for BusManiak.pl. Each stage has its own reference file with detailed instructions.

## Reference Files

Load each file **at the start of its stage** – not all at once.

| Stage | File | Path |
|-------|------|------|
| Stage 1 | Keyword Research Process | `references/keyword-research.md` |
| Stage 1 | API Credentials | `references/api-credentials.md` |
| Stage 2 | Writing Rules & Tone | `references/writing-rules.md` |
| Stage 2 | Sitemap (live) | Fetch `https://zaplecze.pages.dev/mapa-strony/` + repo knowledge |
| Stage 5 | Image Generation | `scripts/generate-image.py` |

---

## Pipeline Overview

```
Stage 1: Keyword Research ─── SerpData → Senuto VA → DataForSEO → TSV
Stage 2: Outline & Research ─ web search + Perplexity Sonar + sitemap → outline (no approval gate)
Stage 3: Draft ────────────── Gemini Flash via OpenRouter (system_prompt = writing-rules.md)
Stage 3b: Fact Enrichment ─── Sonar per H2/H3: concrete data, specs, sources injected into draft
Stage 4: Humanize ─────────── Sonnet subagent: AI fingerprint scan, deklinacja, linki, formatowanie
Stage 5: Post-processing ──── frontmatter, FAQ, shortcode cleanup, hero image (kie.ai)
Stage 6: Output ───────────── .md file ready for git push → Cloudflare Pages
```

---

## Stage 1: Keyword Research

**Load:** `references/keyword-research.md` + `references/api-credentials.md`

Follow the 6-step process defined in `keyword-research.md`:

1. **Title/H1 templates** – establish consistent patterns for the section
2. **SerpData SERP** – find top 5 content URLs ranking for the keyword
3. **Senuto VA** – extract competitor keywords (top 10 Google, max 25/URL)
4. **DataForSEO Keyword Suggestions** – long-tail fan-out (vol ≥ 100)
5. **Aggregation** – merge, deduplicate, filter transactional/navigational, top 10 extras
6. **Output TSV** – URL, Title, H1, main keyword, volume, extra keywords

All API calls use `curl` with credentials from `references/api-credentials.md`. Respect rate limits (sleep 0.3s between calls).

**Output of this stage:** TSV with keywords, used as input for Stage 2.

---

## Stage 2: Outline & Research

**Load:** `references/writing-rules.md`

### 2a. Research (web search + Perplexity Sonar)

Use **two sources** in parallel for comprehensive research:

#### Wikipedia (always first – MANDATORY)

**STOP: Do NOT proceed to outline without completing this step.**

For every article topic, fetch the Wikipedia page (Polish first, English fallback) to establish baseline facts: production years, platform, factory, engine codes, dimensions, generational changes. Wikipedia is the primary authoritative source for historical and technical data.

```bash
# Polish Wikipedia
WebFetch https://pl.wikipedia.org/wiki/{Model_Name} → extract key specs, history, generations
# English fallback if Polish page is thin
WebFetch https://en.wikipedia.org/wiki/{Model_Name} → same extraction
```

Use Wikipedia data as the factual backbone of the article.

**Wikipedia MUST appear in the final article in TWO ways:**
1. **In the source list** – `*Źródła: Wikipedia – [Model Name], ...*` (always, no exceptions)
2. **In the body as a contextual link** – link a technical concept (engine family, platform, emission standard), NOT the model name. Verify the URL exists with WebFetch before inserting.

```
✅ Silnik 2.3 MultiJet pochodzi z rodziny [Fiat F1A](https://pl.wikipedia.org/wiki/Fiat_F1A), stosowanej w ponad 15 modelach grupy Stellantis.
✅ Boxer spełnia normę [Euro 6d](https://en.wikipedia.org/wiki/European_emission_standards), obowiązującą od 2021 roku.
❌ [Peugeot Boxer](https://pl.wikipedia.org/wiki/Peugeot_Boxer) to popularny van dostawczy. ← NIGDY: model anchor → nasz pillar
```

If no Polish Wikipedia article exists for the concept → use English. If no Wikipedia article exists at all for any relevant concept → note it and skip body link (source list still required).

#### Web Search (3-7 queries)
Standard web searches for:
- Search intent – what are people looking for?
- Competing content – gaps to fill
- Trends – new models, regulation changes

#### Perplexity Sonar (2-4 queries)
Use Sonar via OpenRouter for synthesized, source-backed answers. Sonar excels at aggregating factual data that web search returns as scattered snippets.

**API call:**
```bash
curl -s https://openrouter.ai/api/v1/chat/completions \
  -H "Authorization: Bearer ${OPENROUTER_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "perplexity/sonar",
    "messages": [
      {"role": "system", "content": "Odpowiadaj po polsku. Podawaj konkretne liczby, roczniki, wymiary. Cytuj źródła."},
      {"role": "user", "content": "<QUERY>"}
    ]
  }'
```

**Credentials:** Same OpenRouter key as Gemini Flash (see `references/api-credentials.md`).

**What to ask Sonar (pick 2-4 relevant to topic):**

| Typ pytania | Przykład query |
|-------------|---------------|
| Dane techniczne | "Fiat Ducato 2.2 MultiJet3 dane techniczne silnika, moc, moment obrotowy, norma spalin" |
| Ceny aktualne | "Fiat Ducato 2024 2025 ceny nowy używany Polska" |
| Przepisy / regulacje | "Homologacja kampera Polska 2026 wymagania procedura koszt" |
| Typowe usterki / opinie | "Fiat Ducato 2.2 MultiJet typowe usterki problemy opinie użytkowników" |

**Jak łączyć wyniki:**
- Web search → search intent, konkurencja, trendy, struktura SERP
- Sonar → twarde dane (specyfikacje, ceny, przepisy, usterki) z cytowanymi źródłami
- Sonar zwraca URL-e źródeł w odpowiedzi — użyj ich jako źródła w artykule (w tekście lub na końcu)
- Jeśli web search i Sonar podają sprzeczne dane → zweryfikuj trzecim źródłem lub napisz "według dostępnych danych"

### 2b. Internal Link Research
Fetch `https://zaplecze.pages.dev/mapa-strony/` to get the current full site structure. Combine with your knowledge of the repo's content directory. Select 3-5 related pages. For each, prepare a **full sentence** with contextual link (not just anchor text).

No static CSV — the live sitemap is always up to date with the latest deployed content.

Example:
> ✅ `Jeśli rozważasz Ducato, [sprawdź dlaczego od lat jest numerem jeden pod przeróbkę](/przerobki/fiat-ducato-kamper/).`

### 2c. Build Outline (internal – do NOT present to user)

Build the outline internally as input for Stage 3. Include: Title, H1, H2/H3 structure, shortcode plan, source list, internal links with full contextual sentences, keywords with volumes. Do NOT show the outline to the user or ask for approval – proceed directly to Stage 3.

#### Article type templates

Use the appropriate template based on article type. **RÓŻNICUJ formę frazy w nagłówkach H2:** ~50% z pełną marką+modelem (odmienioną), ~50% sam model. Nie powtarzaj identycznej formy 2× pod rząd. Przykład: "Silniki Fiata Ducato" → "Wymiary Ducato" → "Ceny Fiata Ducato" → "Porównanie Ducato z konkurencją".

---

**Template: MODEL (pillar article)**

```
## Historia i generacje [Model]
### [Model] I (RRRR–RRRR)   ← każda generacja jako H3, scrape + Sonar
### [Model] II (RRRR–RRRR)
### [Model] III (RRRR–dziś)

## Dane techniczne i wymiary różnych wersji [Model]
### [Model] L1H1 / krótki   ← każdy wariant jako H3 z tabelą
### [Model] L2H1 / długi
### [Model] L2H2 / wysoki (jeśli dotyczy)

## Silniki [Model]
### Diesel                   ← tabela: oznaczenie, moc, moment, norma, roczniki
### Benzyna / elektryk (jeśli dotyczy)

## Wersje nadwoziowe i wyposażenie [Model]
### Furgon
### Osobowy / Passenger (jeśli dotyczy)
### Platforma / skrzynia (jeśli dotyczy)

## Ceny [Model]
### Nowy [Model]             ← aktualne ceny, warianty
### Używany [Model]          ← widełki cenowe rocznikami

## Typowe usterki [Model]    ← problemy per silnik/rocznik, koszty napraw

## Porównanie [Model] z konkurencją   ← tabela: kluczowe parametry vs 3-4 rywale

## FAQ (3-5 pytań)           ← H2/H3 w formie pytań, samowystarczalne odpowiedzi
```

---

**Template: WERSJA SILNIKOWA** (podstrona modelu, np. `fiat-ducato/2-3-multijet`)

```
## Dane techniczne [Model] [Silnik]
### [Model] [Silnik] [moc1] KM   ← każdy wariant mocy jako H3 z tabelą
### [Model] [Silnik] [moc2] KM
### [Model] [Silnik] [moc3] KM (jeśli dotyczy)

## Spalanie [Model] [Silnik]
### W trasie
### W mieście / mieszane

## Typowe usterki [Model] [Silnik]   ← problemy per rocznik/wariant, koszty napraw

## Opinie i ocena silnika

## Koszty serwisu i eksploatacji [Model] [Silnik]

## FAQ (3-5 pytań)
```

---

**Template: WERSJA NADWOZIOWA** (podstrona modelu, np. `fiat-ducato/brygadowka`, `fiat-ducato/skrzyniowy`)

```
## [Model] [wariant] – konstrukcja i wersje nadwozia
### Wymiary [Model] [wariant]
### Ładowność i przestrzeń ładunkowa

## Silniki do [Model] [wariant]       ← skrótowo, linki do stron silnikowych

## [Model] [wariant] w zastosowaniu   ← branże, typowe use-case'y

## Wyposażenie i opcje [Model] [wariant]

## Ceny [Model] [wariant]
### Nowy [Model] [wariant]
### Używany [Model] [wariant]

## Typowe usterki i serwis [Model] [wariant]

## FAQ (3-5 pytań)
```

---

---

**Template: SERWIS** (np. `serwis/fiat-ducato-rozrzad`, `serwis/bezpieczniki-fiat-ducato`)

```
## [Problem/Temat] w [Model]              ← lub: Gdzie/Co ile/Jak + model
### [Model] [generacja1] (RRRR–RRRR)    ← jeśli różni się per generacja
### [Model] [generacja2]

## Diagnostyka – jak rozpoznać [problem] w [Model]

## Naprawa [Model] – procedura / opcje   ← step-by-step lub warianty

## Koszty [serwis/naprawa] [Model]
### Części
### Robocizna

## Jak zapobiegać – eksploatacja [Model]

## FAQ (3-5 pytań)
```

---

**Template: PRZERÓBKI** (np. `przerobki/fiat-ducato-kamper`, `przerobki/citroen-berlingo-tuning`)

```
## Dlaczego [Model] [do przeróbki / jako kamper]?  ← zalety, popularność

## Wybór bazy [Model] do przeróbki
### Silniki – który wybrać
### Wymiary – która wersja (L1/L2/L3)

## Koszty przeróbki [Model]
### Materiały i wyposażenie
### Robocizna i warsztaty

## Etapy przeróbki [Model]
### [Główny element 1, np. instalacja elektryczna]
### [Główny element 2, np. zabudowa meblowa]

## Typowe błędy i na co uważać

## FAQ (3-5 pytań)
```

---

#### No bare H2 → table

NEVER place a Markdown table directly after an H2 heading. There MUST be 1-2 sentences of contextual intro between the heading and the table. The intro should reference specific details (model, price range, engine variant) – never generic filler like "Poniższa tabela przedstawia...".

```
❌ ## Silniki Berlingo
   | Silnik | Moc | ...

✅ ## Silniki Berlingo
   Berlingo III oferuje cztery warianty – od 1.2 PureTech po elektryczny e-Berlingo z baterią 50 kWh.
   | Silnik | Moc | ...
```

#### H3 headings – MANDATORY

Every H2 section MUST contain at least 1-2 H3 subheadings. Articles without H3s look flat and thin. H3s break content into scannable chunks and improve SEO.

Rules:
- Pillar articles: min 2-3 H3s per major H2 (e.g. "## Silniki" → "### Diesel 2.0", "### Diesel 2.3", "### Elektryczny")
- Subpage articles: min 1-2 H3s per H2 where applicable
- H3 headings should contain specific details (engine variant, generation, price range, use case)
- H3 headings follow same declension rule as H2: vary brand+model vs model-only

**Research per sekcja:** Dla każdego H2 i H3 wykonaj:
1. **WebFetch** – scrape co najmniej 1 strony konkurencji z SERP dla danego tematu
2. **Sonar query** – zapytanie o twarde dane dla tej sekcji (specyfikacje, ceny, roczniki, koszty)

Przykład dla `## Silniki [Model]`:
```
WebFetch → strona producenta lub auto-data.net dla specyfikacji silników
Sonar → "[Model] silniki diesel dCi dane techniczne moc moment obrotowy norma emisji roczniki"
```

---

## Stage 3: Draft (Gemini Flash via OpenRouter)

After outline approval, generate the draft using Gemini Flash.

### API Call

```bash
curl -s https://openrouter.ai/api/v1/chat/completions \
  -H "Authorization: Bearer ${OPENROUTER_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "google/gemini-3-flash-preview",
    "max_tokens": 16000,
    "messages": [
      {"role": "system", "content": "<SYSTEM_PROMPT>"},
      {"role": "user", "content": "<ARTICLE_BRIEF>"}
    ]
  }'
```

**SYSTEM_PROMPT:** Build from `references/writing-rules.md` – include all writing rules, formatting, blacklisted phrases, linking rules, shortcode requirements.

**ARTICLE_BRIEF:** Include:
- Approved outline (H2/H3 structure)
- Main keyword + extra keywords with volumes
- Internal links with full contextual sentences
- Source integration plan
- Explicit instruction: "Nie dodawaj sekcji Podsumowanie. FAQ zamyka artykuł."

**Credentials:** See `references/api-credentials.md` → OpenRouter section.

---

## Stage 3b: Sonar Fact Enrichment

After receiving the Gemini draft, extract every H2 and H3 heading. For each heading, send a targeted Sonar query to gather concrete facts, numbers, and sources that the draft may be missing.

### Process

1. **Parse the draft** – extract all H2/H3 headings
2. **Build queries** – for each heading, formulate a Polish-language query combining the article topic + heading content. Focus on retrievable facts: specs, dimensions, prices, dates, statistics
3. **Call Sonar in parallel** (batch 3-5 queries per API call or sequential with 0.3s sleep)

```bash
curl -s https://openrouter.ai/api/v1/chat/completions \
  -H "Authorization: Bearer ${OPENROUTER_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "perplexity/sonar",
    "messages": [
      {"role": "system", "content": "Odpowiadaj po polsku. Podawaj konkretne liczby, roczniki, wymiary, ceny. Cytuj źródła."},
      {"role": "user", "content": "<TOPIC> – <H2/H3 HEADING>: podaj konkretne dane techniczne, fakty i liczby"}
    ]
  }'
```

4. **Merge into draft** – for each heading, compare Sonar response with existing draft content:
   - **Missing facts** → inject into the relevant section (numbers, dimensions, dates, model years)
   - **Contradictions** → prefer Sonar data if it cites a source, otherwise keep draft and add "według dostępnych danych"
   - **New sources** → add Sonar-cited URLs to the source list at the end
   - **Do NOT change the structure** – only enrich existing sections with data

### What NOT to do
- Do not add new H2/H3 sections
- Do not change the article's voice or style (that's Stage 4's job)
- Do not add keywords – keyword density is already set
- Do not query Sonar for subjective/opinion topics (e.g. "which is best") – only for retrievable facts

### Output
The enriched draft with concrete data injected into each section. Pass this to Stage 4.

---

## Stage 4: Humanize (Sonnet Subagent)

After the Sonar-enriched draft, spawn a **Sonnet subagent** for humanization. A separate model with "fresh eyes" catches AI fingerprints better than the orchestrating Claude Code instance.

### How to spawn the subagent

Use Claude Code's subagent mechanism. Pass the Sonnet subagent:
1. **The enriched draft** (full Markdown, after Stage 3b)
2. **The keyword list** (main + extras, for reference only – NOT to add new ones)
3. **The humanization prompt** (below)

### Humanization prompt for Sonnet

Send this as the subagent's system prompt:

```
Jesteś redaktorem technicznym i stylistą języka polskiego. Twoim zadaniem jest finalna
weryfikacja i "wypolerowanie" artykułu wygenerowanego przez AI dla portalu BusManiak.pl.

OTRZYMUJESZ:
- Artykuł w formacie Markdown
- Frazy kluczowe (do referencji, NIE do dodawania nowych)

WERYFIKACJA NATURALNOŚCI (krytyczne – przeczytaj KAŻDE zdanie):
1. Przeczytaj cały tekst. Czy tak pisze mechanik na blogu? Jeśli nie – przepisz zdanie
2. BEZWZGLĘDNIE usuń lub przepisz:
   - "niekwestionowany lider/król" → konkretny fakt albo usuń całe zdanie
   - "w niniejszym artykule" → usuń
   - "warto podkreślić/wspomnieć/zauważyć" → podaj fakt bez wstępu
   - "nie sposób nie wspomnieć" → usuń, napisz fakt wprost
   - "doświadczenia użytkowników na forum X" → USUŃ. Napisz "w praktyce"
     lub "doświadczeni użytkownicy zalecają"
   - "na forum [Nazwa – przewodnik]" → ZAWSZE USUŃ. Fikcyjne źródło AI
   - linki do podstron portalu użyte jako fake-źródła → przenieś do kontekstu lub usuń
   - "zarówno...jak i" nadużywane → uprość
   - "popularnym Dukacie" i potoczne zdrobnienia → "Fiacie Ducato" lub "Ducato"
3. Zróżnicuj długość zdań – krótkie przeplataj z dłuższymi
4. Każdy akapit musi wnosić nową informację
5. Usuń sekcję "## Podsumowanie" jeśli istnieje. FAQ pełni tę rolę

FRAZY KLUCZOWE:
1. Sprawdź KAŻDE użycie frazy – czy jest odmieniona (deklinacja)?
2. Każda fraza max 1x w artykule. Drugie użycie TYLKO gdy w 100% naturalne
3. Usuń nadmiarowe wystąpienia – zastąp synonimami lub po prostu usuń
4. NIE dodawaj nowych fraz których nie ma w tekście

LINKOWANIE ZEWNĘTRZNE (Wikipedia):
1. Artykuł MUSI zawierać 1 link do Wikipedii (pl lub en) do pojęcia technicznego
   - ✅ silnik, platforma, norma emisji, technologia
   - ❌ NIGDY nazwa modelu – anchor modelu → nasz pillar
2. Jeśli linku do Wikipedii nie ma w drafcie – DODAJ go do odpowiedniego zdania
3. Wikipedia MUSI być w liście źródeł na końcu artykułu
4. Nie weryfikuj URL – Claude Code zrobi to w Stage 2. Użyj URL z draftu

LINKOWANIE WEWNĘTRZNE:
1. Każdy link MUSI być częścią naturalnego zdania (kontekstowy)
2. USUŃ linki w formie osobnych elementów:
   - ❌ "Wersję osobową opisujemy osobno."
   - ❌ "Sprawdź też: [link]"
   - ❌ "Więcej na ten temat przeczytasz tutaj"
3. Przepisz na kontekstowe:
   - ✅ "[Proace City Verso](/modele/proace-city-verso/) opisujemy w osobnym artykule."
   - ✅ "Jeśli szukasz bazy pod przeróbkę, [Ducato dominuje w tej roli](/przerobki/fiat-ducato-kamper/)."
4. Max 1 link wewnętrzny na akapit

FORMATOWANIE:
1. Listy: **Termin** – opis małą literą (myślnik, NIGDY dwukropek)
2. En-dash (–) nie em-dash (—)
3. Nagłówki H2/H3: pierwsza litera wielka, reszta małe (chyba że nazwa własna)
4. Zachowaj shortcodes {{% expert %}} i {{% info %}} bez zmian
5. Zachowaj linki wewnętrzne [tekst](/url/) bez zmian (chyba że naruszają regułę kontekstowości)

CZEGO NIE ROBIĆ:
- Nie zmieniaj struktury H2 (kolejność sekcji zostaje)
- Nie dodawaj nowych sekcji
- Nie dodawaj podsumowania na końcu
- Nie zmieniaj faktów i danych technicznych
- Nie usuwaj tabel
- Nie usuwaj shortcodes

ZWRÓĆ: wyłącznie poprawiony artykuł w Markdown (bez frontmatter, bez komentarzy, bez wyjaśnień).
```

### What the subagent returns

The Sonnet subagent returns ONLY the polished article in Markdown – no frontmatter, no explanations. Claude Code takes this output and passes it to Stage 5.

---

## Stage 5: Post-Processing

### 5a. Frontmatter Generation

Build Hugo frontmatter based on the article:

```yaml
---
title: "{Title with keyword}"  # NO "| BusManiak.pl" – Hugo appends site title automatically via head.html
date: {YYYY-MM-DD}
description: "{meta description – max 155 chars}"
draft: false
author: "marek-kowalczyk"
h1: "{H1 – shorter than title, more creative}"
parent: "{parent section slug}"
type: "{content type}"
image: "/images/{slug}-hero.jpg"
image_alt: "{descriptive alt text}"
main_keyword: "{primary keyword}"
lead: "{2-3 sentence BLUF summary}"
faq:
  - question: "{FAQ question 1}"
    answer: "{Concise answer, can include internal links}"
  - question: "{FAQ question 2}"
    answer: "{Concise answer}"
---
```

**FAQ in frontmatter:** Extract 3-5 FAQ items from the article's FAQ-style H2/H3 sections. Answers should be self-contained and concise.

**Schema FAQ (automatic):** The Hugo theme automatically generates `FAQPage` JSON-LD structured data from the `faq:` frontmatter field via `layouts/partials/schema/faq.html`. No manual `<script>` tags needed – just populate `faq:` correctly and schema is live. This is mandatory for every article (E-E-A-T + featured snippet eligibility).

### 5b. Shortcode Normalization

Gemini sometimes generates wrong shortcode syntax. Fix:
- `{{< expert >}}` → `{{% expert %}}`  (double %)
- `{{< info >}}` → `{{% info %}}`
- Remove any `{{< image >}}`, `{{< table >}}` – convert to standard Markdown
- Expert format: `{{% expert name="Kowalczyk" %}}treść{{% /expert %}}` — name param REQUIRED, never bare `{{% expert %}}`
- Info format: `{{% info title="Tytuł" icon="engineering" %}}treść{{% /info %}}` — title+icon params REQUIRED, never bare `{{% info %}}`
- **CRITICAL:** Bare shortcodes without params crash Hugo build (nil map access on .Params)

### 5c. Hero Image Generation

Run the image generation script:

```bash
python3 pipeline/generate-image.py \
  --prompt "{photorealistic prompt describing the article topic}" \
  --slug "{article-slug}-hero" \
  --alt "{descriptive alt text}"
```

Prompt guidelines:
- For model/pillar articles: photorealistic photo of the vehicle
- For technical/subpages: technical detail close-up
- Always: good lighting, clean composition, no text overlays
- Model: nano-banana-2, 1K resolution, 16:9 aspect ratio

**⚠️ PATH BUG:** The script saves to `pipeline/content-writer/portals/busmaniak.pl/static/images/` (wrong path). After generating, ALWAYS copy to the correct path:
```bash
cp pipeline/content-writer/portals/busmaniak.pl/static/images/{slug}.jpg portals/busmaniak.pl/static/images/{slug}.jpg
```

### 5d. YAML Safety Check

Before saving, validate the frontmatter YAML:
- **NEVER use typographic quotes** `„"` inside double-quoted YAML strings — they break the parser. Use `'single quotes'` or rephrase.
- **NEVER use `\'` escape** in YAML double-quoted strings — not valid YAML. Just use `'` without backslash.
- **All shortcodes** must have required params (name= for expert, title= icon= for info).
- Run mental check: does any `lead:` or `answer:` field contain characters that could close the YAML string?

### 5e. File Structure

- **Pillar articles** (models with potential subpages): MUST be `{model-slug}/_index.md` (directory + _index.md), never flat `{model-slug}.md`. Hugo uses `list.html` template for `_index.md`.
- **Subpages** (engine/body variants): regular `{parent}/{slug}.md` files.
- **type: "page"** required in frontmatter for pillar articles to render correctly.

### 5f. Final File Assembly

Combine frontmatter + article body into a single `.md` file. Save to the portal's content directory.

---

## Stage 6: Output

Save the final `.md` file and report completion. Do NOT stop between stages to ask for approval.

File location: `portals/busmaniak.pl/content/{section}/{slug}.md`

After saving:
1. **Validate YAML** — parse frontmatter with Python yaml.safe_load() to catch broken quotes/escapes BEFORE committing
2. **Check shortcodes** — grep for bare `{{% info %}}` or `{{% expert %}}` without params
3. **Verify image exists** — confirm the referenced hero image is at the correct path
4. **Verify H3 presence** — article must have at least 2 H3 headings
5. Tell the user the article is ready and ask if they want to commit + push

---

## Quick Reference: Good vs Bad

### Wstęp
- ❌ "W dzisiejszych czasach coraz więcej osób marzy o podróżowaniu kamperem. W niniejszym artykule przybliżymy..."
- ✅ "Fiat Ducato L3H2 to najpopularniejsza baza pod kampera w Polsce. Oto co musisz wiedzieć przed zakupem."

### Linkowanie wewnętrzne
- ❌ `Wersję osobową opisujemy osobno.`
- ❌ `Sprawdź też: [Fiat Ducato kamper](/przerobki/fiat-ducato-kamper/)`
- ❌ `Więcej o historii modelu znajdziesz w artykule: [Fiat Ducato](/modele/fiat-ducato/)`
- ✅ `Jeśli szukasz bazy pod przeróbkę, [Ducato od lat dominuje w tej roli](/przerobki/fiat-ducato-kamper/).`

### Listy
- ❌ `**Komora silnika:** Skrzynka znajduje się pod maską`
- ✅ `**Komora silnika** – skrzynka znajduje się pod maską`

### Frazy kluczowe
- ❌ `...najczęstszą przyczynę: fiat ducato przekaźniki`
- ✅ `...wadliwy przekaźnik w Fiacie Ducato`

### Shortcodes
- ❌ `{{< expert name="Jan Kowalski" >}}`
- ✅ `{{% expert name="Kowalczyk" %}}`
