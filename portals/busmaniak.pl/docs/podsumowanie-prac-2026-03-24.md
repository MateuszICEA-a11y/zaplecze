# BusManiak.pl – podsumowanie prac

Data: 2026-03-24
Autor: Claude Code (operator) + MW (koordynator)

---

## 1. Infrastruktura

- **Hugo SSG** + Cloudflare Pages (auto-deploy z GitHub)
- **Theme**: shared/theme (zero JS, inline CSS, Material Symbols)
- **Design**: Stitch v2 – hero badge, bento grid, featured banner, split logo BUS+MANIAK
- **Deploy**: https://zaplecze.pages.dev (noindex=true, dev environment)

## 2. Struktura serwisu

### Klaster Modele – deep research zakończony

| Metryka | Wartość |
|---------|---------|
| Modele (pillary) | 46 |
| Podstrony silnikowe | 18 |
| Podstrony wariantowe | ~60 |
| Cross-cluster (serwis) | ~15 |
| Cross-cluster (przeróbki) | ~5 |
| **Razem stron w Hugo** | **365** |
| **Łączny wolumen fraz głównych** | **~760K/msc** |

### Ekosystem Fiat Ducato – kompletny (pilot)

22 artykuły z treścią + hero obrazkami:
- 1 pillar (_index.md) – 1392 słów
- 4 silniki (2.3 MultiJet, 3.0 MultiJet, 2.2 MultiJet, 2.8 JTD)
- 10 wariantów (Maxi, 9-osobowy, brygadówka, skrzyniowy, blaszak, plandeka, kontener, doka, laweta, chłodnia)
- 2 przeróbki (kamper, tuning)
- 5 serwis (bezpieczniki, przekaźniki, kontrolki, spalanie, rozrząd)

Pozostałe modele: stuby z frontmatter (bez treści), czekają na generowanie.

## 3. Proces tworzenia treści (wypracowany)

### Keyword Research Pipeline
1. **DataForSEO Keyword Suggestions** (fan out 200 per model) – odkrywanie silników, wariantów, cross-cluster
2. **SerpData SERP** – top 5 content URLs per fraza
3. **DataForSEO SERP Advanced** – snippety + PAA questions
4. **Senuto VA** – frazy konkurentów (Base 2.0)
5. **Senuto MCP** – wolumeny Base 1 (wyższe, dokładniejsze)

### Content Generation Pipeline
1. **Brief JSON** – frazy, wolumeny, struktura H2, FAQ z PAA, entities, internal links
2. **Gemini 3 Flash** (via OpenRouter) – szybki draft
3. **Claude Sonnet** (via subagent) – humanizacja, usunięcie AI artefaktów
4. **Post-processing** (Python) – lead→frontmatter, FAQ→frontmatter, fix formatowania
5. **kie.ai** (nano-banana-2) – hero image 16:9 1K
6. **Git push** → Cloudflare Pages auto-deploy

### Zasady jakości treści
- **BLUF** – najważniejsza informacja na początku (lead w frontmatter)
- **Kolejność**: lead → spis treści → H2 sekcje → FAQ (accordion)
- **Zakaz keyword stuffing** – frazy odmienione, max 1x, naturalnie wplecione
- **Listy**: **Termin** – opis małą literą (myślnik, nigdy dwukropek)
- **En-dash** (–) nie em-dash (—)
- **Brak "## Podsumowanie"** – FAQ pełni tę rolę
- **FAQ** w frontmatter YAML (nie w body) – renderuje się jako accordion CSS
- **Źródła** – nofollow na linkach zewnętrznych (wyjątek: Wikipedia)
- **Brak sztucznych sformułowań AI** – humanizacja Sonnetem usuwa artefakty
- **Brak limitu ZZS** – artykuł ma pokrywać temat kompletnie

### Szablon artykułu (Hugo)
- `layouts/_default/single.html` – wpisy (post): hero z autorem, lead, TOC, expert box, info box, link boxy, author card, related grid, FAQ accordion
- `layouts/_default/list.html` – strony (page): hero bez autora, TOC, treść, link boxy (podstrony + cross-cluster), FAQ accordion
- Shortcodes: `{{% expert name="Kowalczyk" %}}`, `{{% info title="Uwaga" icon="engineering" %}}`
- Render hook: nofollow na linkach zewnętrznych (poza Wikipedia)

## 4. API i narzędzia

| API | Zastosowanie |
|-----|-------------|
| DataForSEO | SERP Advanced, Keyword Suggestions (fan out), search intent |
| SerpData | SERP top 5 URL |
| Senuto MCP | Keyword volumes (Base 1), VA (Base 2.0) |
| OpenRouter | Gemini 3 Flash (generowanie treści) |
| Claude Code | Sonnet subagents (humanizacja) |
| kie.ai | Hero images (nano-banana-2, 16:9, 1K) |

## 5. Pliki kluczowe

| Plik | Opis |
|------|------|
| `config/system_prompt.txt` | Prompt do generowania treści (BLUF, anty-stuffing) |
| `config/humanize_prompt.txt` | Prompt do humanizacji (usuwanie AI artefaktów) |
| `data/authors.json` | 3 autorzy (Kowalczyk, Zieliński, Wóźniak) |
| `data/clusters.json` | 10 klastrów z keyword data |
| `docs/struktura-modele.csv` | 207 wierszy – pełna struktura z frazami |
| `docs/proof-of-concept.md` | Metodologia researchu, top keywords |
| `pipeline/generate-image.py` | Skrypt kie.ai (generowanie obrazków) |
| `pipeline/generate_kie.py` | Alternatywny skrypt (z requests) |

## 6. Co dalej

### Priorytet 1: Generowanie treści dla pozostałych modeli
- Berlingo, Caddy, Trafic, Proace (Tier 1) – po ~10 podstron każdy
- Pipeline identyczny jak Ducato: brief → Gemini → Sonnet → kie.ai → deploy

### Priorytet 2: Pozostałe klastry (non-model)
- Kampery (14 art.), Przeróbki (11), Zabudowy (10), Porównania (13)
- Serwis (15), Wynajem (10), Przepisy (12), Narzędzia (4), Vanlife (5)

### Priorytet 3: Narzędzia interaktywne
- Kalkulator DMC, Kalkulator paliwa, Porównywarka busów
- Hugo shortcodes + vanilla JS

### Deadline
Prezentacja: **16 kwietnia 2026**
