# News Pipeline – BusManiak.pl

## Overview

Automatyczny pipeline generujący 1 news dziennie dla BusManiak.pl. Zbiera sygnały z RSS feedów, Google Trends i Google Alerts, wybiera najlepszy temat, generuje content przez GPT-5.4 i publikuje bez interwencji człowieka.

## Architektura

**Infrastruktura:** GitHub Actions scheduled workflow (cron: 7:00 CET daily).

**Przepływ:**

```
Signal Collector → Topic Scorer → Content Generator → Post-processor → Git Commit → CF Pages Deploy
```

**Sekcja Hugo:** `/news/` – nowa sekcja z kompaktowym layoutem (karty, wyeksponowana data, badge "news"). Pozycja "News" w menu głównym.

**Format:** Pipeline sam decyduje na podstawie wagi tematu:
- Lekki temat (premiera, wydarzenie, zmiana ceny) → 400–600 słów
- Ciężki temat (regulacje, analiza rynku) → 800–1200 słów

**Model LLM:** GPT-5.4 przez OpenAI API (klucz w GitHub Secrets, nigdy w repo).

## Signal Collector

Trzy źródła odpytywane sekwencyjnie:

### 1. RSS Feedy (główne źródło)
- Lista feedów w `pipeline/news-generator/feeds.yaml`
- Branżowe: transport.pl, autokult.pl, camprest.com, motofakty.pl, EU transport legislation
- Google News RSS z query "bus OR van OR kamper OR dostawczy"
- Parser wyciąga: tytuł, opis, datę, link źródłowy

### 2. Google Trends API
- Trending searches dla PL, kategoria: Vehicles & Transportation
- Related queries do seedów:
  - Stałe: "bus", "van", "kamper", "furgon", "dostawczy", "paliwo", "regulacje drogowe"
  - Dynamiczne: nazwy modeli z `buses.json` (Ducato, Sprinter, Transit, Crafter itd.)
- Wykrywa nagłe skoki zainteresowania

### 3. Google Alerts (jako RSS feed)
- Alerty na kluczowe frazy branżowe
- Backup/uzupełnienie powyższych źródeł

### Deduplikacja
- Fuzzy matching na tytułach (similarity > 0.7 = ten sam temat)
- `published.json` trzyma historię ostatnich 90 dni – nie powtarzamy tematów

**Output:** lista kandydatów z metadanymi (źródło, tytuł, opis, data, trend score).

## Topic Scorer

Z puli kandydatów pipeline wybiera jeden temat.

### Scoring algorytmiczny (wagi):
- **Świeżość** (30%) – preferuje informacje z dziś/wczoraj
- **Relevance** (30%) – bliskość do core tematyki BusManiaka (matching z `clusters.json` + tagi sekcji)
- **Trend momentum** (20%) – czy temat zyskuje na popularności (Google Trends spike)
- **Unikalność** (20%) – dystans od ostatnich 30 opublikowanych newsów

### LLM jako sędzia (GPT-5.4):
- Top 5 kandydatów po scoringu idzie do GPT-5.4
- Prompt: "Który z tych tematów jest najciekawszy dla czytelnika polskiego portalu o busach/vanach/kamperach? Wybierz jeden."
- LLM decyduje też o formacie (krótki vs analiza) na podstawie głębi tematu

### Matchowanie z sekcją:
- Wybrany temat dostaje przypisanie do 1–2 sekcji (modele, kampery, serwis, przeróbki...)
- Na bazie keyword similarity z `clusters.json`
- Zapewnia internal linking do evergreen contentu

## Content Generator

Jednoetapowe generowanie przez GPT-5.4.

### Prompt zawiera:
- Wybrany temat + źródła (tytuły, opisy z RSS/Trends)
- Przypisaną sekcję i powiązane artykuły
- Format (krótki/analiza)
- Zasady stylu BusManiak.pl

### Struktura wygenerowanego newsa:

**Frontmatter (YAML):**
- title, description, date, author ("Redakcja BusManiak.pl")
- main_keyword, lead
- categories, tags
- Powiązane sekcje (related_sections)
- sources (linki do oryginalnych źródeł)
- faq (1–2 pytania)

**Body:**
- Zaczyna się od H2 (bez intro paragrafów – lead to załatwia)
- Krótki format: 2–3 sekcje H2
- Analiza: 4–5 sekcji H2, min 1 tabela lub lista
- Bez hero image (uproszczenie automatu)

## Post-processor

### Walidacja:
- Sprawdza wymagane pola frontmatter (title, description, date, lead, categories, tags, sources, faq)
- Body zaczyna się od H2 – trim ewentualnych intro paragrafów

### Typografia:
- En-dash (–) only, nigdy em-dash (—)
- Brand: BusManiak.pl (camelCase)

### Czyszczenie:
- Usunięcie nieistniejących shortcodów
- Markdown lint

### Internal linking:
- Wstawia 1–2 linki do artykułów evergreen z przypisanej sekcji
- Szuka najlepszego matchu w `content/` po tagach/kategorii

### Zapis:
- Ścieżka: `portals/busmaniak.pl/content/news/YYYY-MM-DD-slug.md`

## Publish

### Git:
- `git add` nowy plik + zaktualizowany `published.json`
- Commit message: `news: [tytuł newsa]`
- Push do main → Cloudflare Pages auto-deploy

### Integracja z FB posterem:
- FB poster workflow (9:30) może wyłapać świeży news do promowania na Facebooku

### Safety:
- Jeśli żaden temat nie przekroczy progu jakości – nie publikuje nic, loguje "no topic scored above threshold"
- GH Actions logi jako główne źródło debugowania

## Struktura plików

```
pipeline/news-generator/
├── config.yaml          # progi scoringu, seedy Trends, ustawienia
├── feeds.yaml           # lista RSS feedów
├── published.json       # historia opublikowanych tematów (90 dni)
├── main.py              # orchestrator
├── collector.py         # signal collector (RSS, Trends, Alerts)
├── scorer.py            # topic scoring + LLM judge
├── generator.py         # content generation (GPT-5.4)
├── postprocessor.py     # walidacja, typografia, linking
└── requirements.txt

.github/workflows/
└── news-generator.yml   # scheduled workflow (7:00 CET daily)
```

## Wymagania

### API Keys (w GitHub Secrets):
- `OPENAI_API_KEY` – GPT-5.4
- Google Trends – nie wymaga klucza (pytrends library)
- RSS – nie wymaga kluczy

### Dependencies (Python):
- `openai` – GPT-5.4 API
- `feedparser` – RSS parsing
- `pytrends` – Google Trends API
- `rapidfuzz` – fuzzy matching do deduplikacji
- `pyyaml` – config parsing
- `python-frontmatter` – walidacja frontmatter Hugo

## Przyszłe rozszerzenia (poza scope)
- Hero image generation (DALL-E / Flux)
- Slack/email notyfikacje o opublikowanych newsach
- Skalowanie do innych portali z sieci BWP
- A/B testing tytułów
