# BusManiak.pl – Dokumentacja procesu dla zarządu

## 1. O projekcie

**BusManiak.pl** to portal tematyczny o busach, vanach, kamperach i motoryzacji dostawczej – pierwszy portal z nowej sieci BWP 2.0, która zastępuje dotychczasową spaloną sieć zapleczową SEO.

**Cel:** Zbudować autorytatywny serwis branżowy generujący ruch organiczny, który może wspierać SEO klientów ICEA poprzez linkowanie i budowanie topical authority.

**Podejście:** Zamiast tanich zapleczówek – pełnoprawny portal z unikalnymi narzędziami (kalkulatory, porównywarki), profesjonalnym contentem i automatycznym dopływem newsów.

**Stan na kwiecień 2026:**

| Element | Wartość |
|---|---|
| Artykuły opublikowane | 272+ |
| Pillar pages (filary) | 43 |
| Sekcje tematyczne | 12 |
| Interaktywne narzędzia | 4 (kalkulatory + porównywarka) |
| YouTube embedów | 246 |
| Automatyzacja | News generator + FB poster (codziennie) |
| Koszt hostingu | 0 PLN (Cloudflare Pages) |
| Koszt contentu | ~1–2 PLN/artykuł (API LLM + obrazki) |

---

## 2. Architektura techniczna

### Stack

| Warstwa | Technologia | Koszt |
|---|---|---|
| Generator stron | Hugo (static site generator) | darmowy |
| Hosting | Cloudflare Pages | darmowy |
| Domena | busmaniak.pl | ~50 PLN/rok |
| Repozytorium | GitHub (prywatne) | darmowe |
| Automatyzacja | GitHub Actions (crony) | darmowe (2000 min/msc) |
| AI – drafty | Gemini Flash (via OpenRouter) | ~$0.075/1M tokenów |
| AI – humanizacja | Claude Sonnet (subagent) | ~$3/1M tokenów |
| AI – fact-checking | Gemini Pro (via OpenRouter) | ~$0.08/artykuł |
| AI – newsy | GPT-5.4 (OpenAI) | ~$0.05/news |
| AI – pillary | GPT-5.4 (OpenAI) | ~$0.05/artykuł |
| AI – obrazki | kie.ai (nano-banana-2) | darmowe |
| Research | DataForSEO, SerpData, Senuto | subskrypcje firmowe |

### Schemat przepływu

```
[Keyword Research] → [Outline] → [Draft AI] → [Humanizacja AI] → [Post-processing] → [Git] → [Cloudflare Pages]
                                                                                          ↓
                                                                              [GitHub Actions crony]
                                                                                    ↓           ↓
                                                                             [News Generator] [FB Poster]
```

---

## 3. Proces tworzenia treści

### 3.1 Content Writer Pipeline (6 etapów)

Każdy artykuł przechodzi przez zautomatyzowany pipeline uruchamiany komendą `/write-content`. Nie piszemy treści ręcznie.

**Etap 1 – Keyword Research**
- SerpData analizuje top 5 wyników Google
- Senuto VA wyciąga keywords z artykułów konkurencji
- DataForSEO dostarcza long-tail frazy (min. 100 wyszukiwań/msc)
- Wynik: lista fraz z wolumenami + cele linkowania wewnętrznego

**Etap 2 – Outline & Research**
- Wikipedia – obowiązkowe źródło (weryfikowane przez WebFetch)
- Web search (3–7 zapytań)
- Perplexity Sonar (2–4 zapytań) – konkretne dane: ceny, wymiary, specyfikacje
- Analiza sitemappy portalu – szukanie artykułów do linkowania wewnętrznego
- Budowa outlienu z H2/H3

**Etap 3 – Draft (Gemini Flash)**
- Model: Gemini 3 Flash (szybki, tani)
- Input: outline + keywords + źródła + linki wewnętrzne
- Output: pełny draft artykułu w markdown

**Etap 3b – Fact Enrichment (Perplexity Sonar)**
- Każdy H2/H3 dostaje dedykowane zapytanie Sonar
- Wstrzykiwanie konkretnych danych: ceny w PLN, wymiary, specyfikacje techniczne
- Rozstrzyganie konfliktów źródłowych

**Etap 4 – Humanizacja (Claude Sonnet)**
- Osobny subagent (świeże spojrzenie łapie sztuczności AI)
- Usuwa AI-speak: "niekwestionowany lider", "warto podkreślić"
- Weryfikuje odmianę słów kluczowych
- Pilnuje naturalnego linkowania wewnętrznego
- Wyrównuje styl do tonu eksperta-mechanika

**Etap 5 – Post-processing**
- Generowanie frontmatter (tytuł, opis, FAQ, źródła)
- Generowanie hero image (kie.ai)
- Walidacja YAML i shortcodów
- Sprawdzenie struktury pliku

**Etap 6 – Output**
- Gotowy plik .md trafia do repozytorium
- Push na main → automatyczny deploy na Cloudflare Pages

### 3.2 Fact-Checker Pipeline (2-pass)

Weryfikacja istniejących artykułów pod kątem błędów faktycznych i braków.

**Pass 1 – Detekcja (Gemini Pro)**
- Thinking model z aktualną bazą wiedzy
- Wykrywa: błędy faktyczne, halucynacje, niespójności, braki
- Dostarcza konkretne dane do uzupełnienia braków

**Pass 2 – Enrichment (Gemini Pro)**
- Aplikuje poprawki z Pass 1
- Dopisuje brakujące treści na bazie dostarczonych danych
- Zachowuje styl i strukturę artykułu

**Dotychczas:** 272 artykuły przeszły fact-checking.

### 3.3 Pillar Page Expander (GPT-5.4)

Rozbudowa artykułów filarowych (modele busów) do pełnej struktury referencyjnej.

**Struktura docelowa pillar page:**
1. Historia i generacje (z latami i kluczowymi zmianami)
2. Dane techniczne i wymiary (tabela wariantów)
3. Silniki (tabela: moc, moment, norma Euro, spalanie)
4. Wersje nadwoziowe (van, kombi, chassis, kamper)
5. Typowe usterki (z kosztami napraw w PLN)
6. Porównanie z konkurencją (tabela min. 2 rywali)
7. Ceny (tabela: nowe + używane po rocznikach)

**Dotychczas:** 43/43 pillar pages rozbudowane.

---

## 4. Automatyzacja (działa bez interwencji człowieka)

### 4.1 News Generator – codzienny news

| Parametr | Wartość |
|---|---|
| Godzina | 7:00 CEST (codziennie) |
| Źródła sygnałów | RSS (Google News PL), DataForSEO Google Trends |
| Model AI | GPT-5.4 (OpenAI) |
| Format | 400–600 słów (krótki) lub 800–1200 (analiza) – pipeline decyduje |
| Autor | Redakcja BusManiak |
| Deduplikacja | Fuzzy matching tytułów + historia 90 dni |
| Obrazki | Placeholder per sekcja (z istniejących hero images) |

**Przepływ:**
1. Zbiera sygnały z RSS feedów i Google Trends (DataForSEO API)
2. Scoruje tematy: świeżość (30%), relevance (30%), trend (20%), unikalność (20%)
3. GPT-5.4 wybiera najlepszy temat i decyduje o formacie
4. GPT-5.4 generuje artykuł z linkami wewnętrznymi
5. Post-processing: typografia, walidacja, przypisanie obrazka
6. Git commit + push → auto-deploy

**Zabezpieczenia:**
- Max 1 news dziennie (guard w published.json)
- Nie nadpisuje istniejących plików
- Nie publikuje gdy brak tematu powyżej progu jakości

### 4.2 Facebook Auto-Poster

| Parametr | Wartość |
|---|---|
| Godzina | 11:30 CEST (codziennie) |
| Źródło treści | Losowy artykuł z portalu |
| Opis posta | Generowany przez Gemini Flash |
| Tracking | posted.json (nie postuje dwa razy tego samego) |

**Przepływ:**
1. Skanuje wszystkie artykuły w repozytorium
2. Wybiera losowy, jeszcze niepostowany
3. Gemini Flash generuje opis (2–3 zdania + emoji)
4. Postuje na Facebooku przez Graph API
5. Zapisuje tracking i commituje

---

## 5. YouTube Finder

Wzbogacanie artykułów o osadzone filmy YouTube.

- Wyszukuje filmy przez YouTube Data API v3
- Priorytet: polskie recenzje i testy
- Automatyczny scoring relevance (title overlap, kanał, długość)
- Osadzanie shortcodem `{{% youtube %}}` przed ostatnim H2
- Dotychczas: 246/322 artykułów wzbogaconych

---

## 6. Interaktywne narzędzia

Unikalna wartość portalu – narzędzia których nie ma konkurencja.

### Kalkulator DMC
Sprawdza czy załadowany bus mieści się w limicie 3.5t. Dane z bazy buses.json (20+ modeli). Wizualizacja: pasek postępu zielony/żółty/czerwony.

### Kalkulator paliwa
Oblicza koszt paliwa na podstawie trasy i modelu busa.

### Kalkulator zabudowy kampera
Szacuje koszty i czas przebudowy busa na kampera.

### Porównywarka busów
Porównanie dwóch modeli side-by-side: wymiary, ładowność, spalanie, ceny. Podświetla lepsze wartości.

---

## 7. SEO techniczne

| Element | Status |
|---|---|
| Canonical URLs | ✅ Poprawne na wszystkich stronach |
| FAQ Schema (JSON-LD) | ✅ Automatyczne z frontmatter |
| BreadcrumbList Schema | ✅ Poprawne URL-e |
| Article Schema | ✅ Z autorem i datą |
| robots.txt | ✅ Niestandardowy (z ASCII artem) |
| Sitemap XML | ✅ Automatyczny Hugo |
| RSS feeds | ✅ Per sekcja + strona główna |
| PageSpeed | 95–100 (zero JS w templacie, czysty CSS) |
| Core Web Vitals | ✅ Wszystkie zielone |
| Google Search Console | ✅ Zweryfikowany |
| Indeksacja zaplecze.pages.dev | ✅ Zablokowana (X-Robots-Tag) |

---

## 8. Wykorzystywane API

| API | Do czego | Koszt orientacyjny |
|---|---|---|
| OpenRouter (LLM gateway) | Gemini Flash (drafty), Gemini Pro (fact-check), Sonar (research) | ~$5–10/msc |
| OpenAI | GPT-5.4 (newsy, pillary, scoring) | ~$5–10/msc |
| DataForSEO | Keyword research, Google Trends | subskrypcja firmowa |
| SerpData | Analiza SERP top 5 | subskrypcja firmowa |
| Senuto | Visibility analysis, keyword extraction | subskrypcja firmowa |
| YouTube Data API v3 | Wyszukiwanie filmów do osadzania | darmowe (10k units/dzień) |
| Facebook Graph API | Auto-posting na fanpage | darmowe |
| kie.ai | Generowanie hero images | darmowe |

**Łączny koszt operacyjny:** ~$10–20/msc (przy 1 newsie dziennie + okazjonalne nowe artykuły)

---

## 9. Skille (komendy pipeline'u)

| Skill | Komenda | Co robi |
|---|---|---|
| Content Writer | `/write-content [temat]` | Pełny 6-etapowy pipeline tworzenia artykułu |
| Fact-Checker | `/fact-check [ścieżka]` | 2-pass weryfikacja i wzbogacanie artykułu |
| YouTube Finder | `/add-youtube [ścieżka]` | Wyszukanie i osadzenie filmu YouTube |

---

## 10. Skalowanie na nowe portale

Architektura jest od początku projektowana pod sieć portali (BWP 2.0).

### Co jest współdzielone (shared)

| Element | Ścieżka | Opis |
|---|---|---|
| Theme Hugo | `shared/theme/` | Wspólny motyw z shortcodami, schematami, CSS |
| Pipeline bwp | `pipeline/bwp_pipeline/` | Współdzielone utilities |
| Content Writer | `pipeline/content-writer/` | Skill działa z dowolnym portalem |
| Fact-Checker | `pipeline/fact-checker/` | Uniwersalny |
| News Generator | `pipeline/news-generator/` | Config per portal (feeds, seedy, sekcje) |
| FB Poster | `pipeline/fb-poster/` | Config per portal (Page ID, token) |

### Dodanie nowego portalu (np. motomaniak.pl)

1. **Domena + Cloudflare** – rejestracja, DNS
2. **Hugo config** – `portals/motomaniak.pl/hugo.toml` (base URL, menu, parametry)
3. **Klastry** – keyword research → `data/clusters.json`
4. **Content** – `/write-content` generuje artykuły
5. **News** – osobny `config.yaml` z feedami RSS i seedami Trends
6. **FB** – nowa strona FB + token w secrets
7. **Deploy** – nowy Cloudflare Pages projekt wskazujący na `portals/motomaniak.pl/`

**Szacowany czas uruchomienia nowego portalu:** 1–2 dni (konfiguracja) + czas na generowanie contentu.

### Potencjalne portale (zgodnie ze strategią BWP 2.0)

Każdy portal to osobna nisza z unikalnymi narzędziami i contentem:
- Motoryzacja dostawcza (busmaniak.pl) ✅
- Kampery i vanlife
- Ciężarówki i logistyka
- Maszyny budowlane
- Motocykle
- itd.

---

## 11. Harmonogram codzienny (automatyczny)

| Godzina (CEST) | Akcja | Interwencja |
|---|---|---|
| 7:00 | News Generator – nowy artykuł newsowy | automatyczna |
| 11:30 | FB Poster – post na Facebooku | automatyczna |
| ciągłe | Cloudflare Pages – deploy po każdym pushu | automatyczny |

Całość działa bez interwencji człowieka. Operator (Claude Code) jest potrzebny tylko do:
- Tworzenia nowych artykułów evergreen (`/write-content`)
- Audytu istniejących treści (`/fact-check`)
- Zmian w konfiguracji (feedy RSS, seedy Trends, nowe sekcje)

---

## 12. KPI i metryki sukcesu

| KPI | Cel | Jak mierzyć |
|---|---|---|
| Indeksacja | ≥ 80% stron zaindeksowanych | Google Search Console |
| Ruch organiczny | MoM wzrost ≥ 15% | GSC / Analytics |
| siteFocus | ≥ 0.80 | Senuto (tematyczna spójność) |
| siteRadius | ≤ 0.25 | Senuto (rozproszenie tematyczne) |
| Artykuły/msc | min. 30 newsów + X evergreen | Git commits |
| Koszt operacyjny | < $20/msc | Suma API costs |

---

*Dokumentacja przygotowana: 3 kwietnia 2026*
*Portal: https://busmaniak.pl*
*Repozytorium: GitHub (MateuszICEA-a11y/zaplecze)*
