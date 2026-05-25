# Writing Rules – widocznosc.ai

Zasady pisania, formatowania, linkowania i self-review dla artykułów blogowych na widocznosc.ai. Adaptacja z bas3-astro-writer skill, dostosowana do tematyki GEO / AI Search / SEO / Marketing.

---

## Portal scope

widocznosc.ai – portal o pozycjonowaniu marek w wyszukiwarkach AI (ChatGPT, Claude, Gemini, Perplexity, Copilot). Cztery główne obszary tematyczne:

- **AI Search** – jak działają silniki AI, query fan-out, retrieval, AI Overviews, mechanizmy cytowania
- **GEO / AEO** – metodyki pozycjonowania pod LLM, Share of Voice, Citation Rate, mierzenie widoczności
- **Content pod LLM** – pillar+cluster, topical authority, struktura tekstu, front-loading, schema.org
- **Narzędzia** – robots.txt, llms.txt, schema.org, audyty techniczne, narzędzia branżowe (Profound, Otterly, Qforia)

Czytelnik docelowy: marketer, CMO, SEO specjalist, founder B2B SaaS / e-commerce. Zna SEO, ale GEO jest dla niego nową dyscypliną. Oczekuje konkretu, danych z badań, możliwych do wdrożenia rekomendacji.

---

## Voice & Style

- **Ekspercki ale przystępny** – piszesz dla osoby, która zna SEO, ale nie zna jeszcze technicznych szczegółów GEO
- **Konkretny** – liczby, daty, źródła (Princeton/KDD 2024, Indig 2024, Fishkin 2026), wymiary, próbki, benchmarki
- **Precyzyjny** – zamiast "wiele", "kilka", "dużo" podawaj konkrety (np. "12–18 zapytań", "+30% widoczności w LLM")
- **BLUF (Bottom Line Up Front)** – każda sekcja zaczyna się od kluczowej informacji, potem rozwinięcie. **NIGDY** nie pisz literalnie "BLUF:" w tekście
- **Per "Ty"** – "Sprawdź", "Zwróć uwagę", "Zacznij od…"
- **Naturalny polski** – bez zbędnych anglicyzmów (zob. słownik niżej)
- **Bez filler text** – każde zdanie wnosi wartość
- **Pokrycie tematyczne** – artykuł musi pokrywać główne aspekty tematu. Długość jest WYNIKIEM pokrycia, nie celem

## Burstiness i rytm (KRYTYCZNE – odróżnia tekst od AI)

AI pisze monotonnie: każdy akapit 3-4 zdania, stałe tempo, jednolity rytm. Ludzie piszą w **burstach** – porywach i pauzach. Twój tekst MUSI mieć wysoką burstiness:

- **Różnicuj długość zdań radykalnie** – jednozdaniowy punchline obok pięciozdaniowego opisu technicznego obok dwuzdaniowego komentarza
- **Różnicuj długość akapitów**: 1-zdaniowy → 5-zdaniowy → 2-zdaniowy → lista → narracja
- **Organiczne dzielenie** – nowa myśl = nowy akapit. NIE narzucaj sztywnego schematu długości
- **Jednozdaniowe punchline'y** – max 1-2 per sekcja H2. Reszta to bloki 2-5 zdań. NIE twórz ciągu jednozdaniowych akapitów
- **Głos aktywny** – "Princeton pokazał, że…" NIE "Zostało pokazane przez Princeton…"
- **Przejścia** – "jednak", "tu pojawia się pytanie", "co ważne", "w praktyce", "to znaczy"
- **Cel**: Flesch-Kincaid Reading Ease 40-50

## Pogrubienia (KRYTYCZNE)

Boldowanie wyróżnia kluczowe informacje. Stosuj dla całych ważnych zdań, nie pojedynczych słów:

- **PRIORYTET: Bolduj CAŁE ważne zdania** – np. "**Top 10 domen w danej niszy zabiera 46% wszystkich cytowań ChatGPT.**"
- **Pojęcia techniczne** jako uzupełnienie – np. "**front-loading**", "**query fan-out**", "**Share of Voice**"
- **Początki fraz w listach** – "- **Front-loading** – pierwsze 30% tekstu to strefa, w której AI najczęściej szuka cytatów."
- **3-5 pogrubień per sekcja H2** – nie za dużo, nie za mało
- **NIE pogrubiaj samych liczb** – pogrubiaj zdanie z liczbą
- ZŁE: `Domena z 30 artykułami **gęstym** linkowaniem wygrywa.` ← pojedyncze słowa
- DOBRE: `**Domena z 30 artykułami i gęstym linkowaniem wygrywa nad tą z 3 artykułami i 200 backlinkami.**`

---

## Struktura artykułu

**Frontmatter (Astro content collection `blog`):** `title`, `subtitle`, `description`, `date`, `image` (wspólny placeholder `../../../assets/images/blog1.png` – 3× `../`, bo plik leży w `src/content/blog/<pillar>/`), `icon` (inline SVG), `author {name, role, avatar}`, `readTime`, `tags[]`, `pillar` (geo / modele-llm / prompty / agenci-ai / rag / ai-w-biznesie), `intent` (INFO / COMPARE / HOWTO / TOOL / COMMERCIAL), `level` (L1 / L2 / L3). NIE dodawaj pola `faq:` – schema go nie ma, wywala build. URL artykułu = `/<pillar>/<slug>` (linki wewnętrzne BEZ prefiksu `/blog/`).

1. **Wstęp (1 akapit, BEZ nagłówka)** – PRZED pierwszym H2. Zasada BLUF: najważniejsza informacja na początku. Czytelnik po wstępie wie o czym jest artykuł i co z niego wyniesie. **TYLKO JEDEN AKAPIT** – krótkie wprowadzenie
2. **Sekcje H2** z treścią merytoryczną (4-7 sekcji) – każda z min. 1-2 H3 (gdy temat tego wymaga, niekoniecznie wszędzie)
3. **Po każdym H2** → akapit wprowadzający (min. 2-3 zdania) PRZED pierwszym H3
4. **Brak H4** – spłaszczaj do H3
5. **NIE dodawaj sekcji "Podsumowanie"** – ostatnia sekcja H2 albo FAQ pełni tę rolę
6. **FAQ (opcjonalne, 4-5 pytań)** – pytania inspirowane realnymi problemami klientów. Krótkie odpowiedzi 2-4 zdania

**Artykuł NIE ma sztywnego limitu znaków.** Ma być kompletny i pokrywać temat. Nie pompuj objętości sztucznie.

---

## Formatowanie (KRYTYCZNE – tego brakuje w pierwszych draftach)

### Listy (MIN. 2 PER ARTYKUŁ)

- **Format:** `**Termin** – opis małą literą` (myślnik ze spacjami, **NIGDY dwukropek**)
- **Dwukropek ZAKAZANY jako separator w tekście** – używaj myślnika (–)
- DOBRE: `**Front-loading** – pierwsze 30% tekstu to strefa cytatów`
- ZŁE: `**Front-loading:** pierwsze 30% tekstu to strefa cytatów`

Używaj list do:
- Wyliczeń (kroki procesu, lista botów, narzędzia)
- Specyfikacji (cechy, parametry, opcje)
- Porównywania (przewagi/wady, alternatywy)

### Tabele (MIN. 1 PER ARTYKUŁ)

Tabele są kluczowe w naszej tematyce – porównania botów, metryki vs definicje, narzędzia vs ceny. **ZAWSZE intro 1-2 zdań przed tabelą**, nigdy `H2 → tabela` bezpośrednio.

Przykładowe zastosowania:
- Porównanie metryk (SoV vs Citation Rate vs Mention Rate)
- Lista botów AI (user-agent, właściciel, funkcja)
- Wskaźniki badań (źródło, sample size, wynik, link)
- Metodyki agencji (nazwa, agencja, fokus)

### Callouty (OBOWIĄZKOWE – oba w każdym artykule)

Każdy artykuł MUSI zawierać **oba** callouty jako surowy HTML `<aside>` (NIE blockquote `>`):
- **`callout-fact` („Ciekawostka", ikona ✦)** – nieoczywisty fakt z liczbą/datą lub kontekst historyczny, zakończony pogrubionym punchline'em.
- **`callout-expert` („Opinia eksperta", avatar autora)** – pierwszoosobowa obserwacja z praktyki ICEA + pogrubione zalecenie + `callout-author` (Imię · Rola, ICEA).

Wzorce do wklejenia (podmień treść, autora i slug avatara):

```html
<aside class="callout-fact">
  <div class="callout-icon">✦</div>
  <div class="callout-body">
    <div class="callout-label">Ciekawostka</div>
    <p>Fakt z liczbą/datą. <strong>Pogrubiony punchline.</strong></p>
  </div>
</aside>
```

```html
<aside class="callout-expert">
  <div class="callout-icon"><img src="/authors/<slug>.avif" alt="Imię Nazwisko" /></div>
  <div class="callout-body">
    <div class="callout-label">Opinia eksperta</div>
    <p>Obserwacja z praktyki ICEA. <strong>Pogrubione zalecenie.</strong></p>
    <div class="callout-author">Imię Nazwisko · Rola, ICEA</div>
  </div>
</aside>
```

⚠️ **KRYTYCZNE: wewnątrz `<aside>` używaj WYŁĄCZNIE czystego tekstu i `<strong>`.** Astro renderuje surowy HTML literalnie – markdown (linki `[..](..)`, pogrubienia `**`) NIE sparsuje się i wyświetli jako goły tekst. Źródła cytuj po nazwie (np. „badanie Princeton, KDD 2024"), nie linkiem.

⚠️ Avatar autora: większość ma `.avif`, ale **Mateusz Wiśniewski używa `.webp`** (`mateusz-wisniewski.webp`). Zły slug/rozszerzenie wywala build (`ImageNotFound`).

### Code (inline + bloki)

- Inline: `\`robots.txt\``, `\`llms.txt\``, `\`User-agent: GPTBot\``
- Bloki kodu: dla snipetów `robots.txt`, `llms.txt`, JSON-LD schema, przykładowych konfiguracji

### Pauza vs półpauza

- **Półpauza (–) ZAWSZE** – dotyczy całego tekstu, nagłówków, list
- **Pauza (—) NIGDY** – Gemini i ChatGPT często generują pauzy, zawsze zamieniaj na półpauzy
- **Hyphen (-) tylko w słowach złożonych** ("AI-powered", "GPT-4")

### Nagłówki

- **H2:** pierwsza litera wielka, reszta mała (chyba że nazwa własna). Brzmi naturalnie i pełnie. Różnicuj formy (raz pełna fraza, raz skrócona)
- **H3:** pierwsza litera wielka, separator `–` (półpauza, mała litera po), nie dwukropek
- DOBRE: `## Jak działa query fan-out w Google AI Mode` / `### Query fan-out – etap retrieval`
- ZŁE: `### query fan-out – ETAP RETRIEVAL` (mała na początku, wielkie po separatorze)

---

## Słownik GEO / AI Search – kalki ZAKAZANE

Najważniejsza sekcja dla naszej tematyki. LLM-y generują angielskie kalki nawet w polskich tekstach. Każda z poniższych jest do natychmiastowej zamiany.

### Terminy wyszukiwania i AI

| Kalka (ZŁA) | Polski (DOBRY) | Uzasadnienie |
|---|---|---|
| synthetic queries | wygenerowane podzapytania / podzapytania syntetyczne | Można też "rozwinięcia zapytania" |
| query fan-out | rozszczepienie zapytania (z ang. *query fan-out*) | Termin techniczny – przy pierwszym użyciu wyjaśnij PL + zostaw EN w nawiasie |
| passage / pasaż | fragment / wycinek tekstu | "Pasaż" istnieje po polsku, ale w sensie literackim, nie technicznym |
| passage retrieval | wybór fragmentów / pobieranie fragmentów | – |
| chunkable structure | struktura łatwa do dzielenia / podzielna struktura | – |
| chunk | fragment (techniczny) – nie "kawałek" | "Chunk" możesz zostawić w technicznych kontekstach (chunking strategy) |
| front-loading | wczesne sygnalizowanie kluczowych informacji / TL;DR na górze | Pojęcie zostaje, ale rozwiń przy pierwszym użyciu |
| ranking | pozycja w wynikach / pozycja rankingowa | "Ranking" jako kalka jest OK, ale w prozie używaj "pozycja" |
| reasoning | wnioskowanie / przetwarzanie logiczne | – |
| retrieval engine | silnik pobierający dane / warstwa retrieval | – |
| embedding | wektor osadzony / embedding (z wyjaśnieniem) | Termin techniczny – zostaje, wyjaśnij raz |
| temperature (LLM) | temperatura modelu | Zostaje, to oficjalny termin |
| sample size | liczebność próby / wielkość próby | – |
| benchmark | punkt odniesienia / wzorzec | – |
| deep dive | pogłębiona analiza / szczegółowa analiza | – |

### Terminy SEO/marketingowe

| Kalka | Polski |
|---|---|
| topical authority | autorytet tematyczny / ekspertyza w temacie |
| topical clusters | klastry tematyczne |
| pillar page / pillar | strona pillar / strona filarowa (z ang. *pillar*) |
| cluster pages | strony cluster / strony tematyczne |
| buyer journey | ścieżka zakupowa |
| buyer persona | persona klienta / profil decydenta |
| funnel | lejek (sprzedażowy / marketingowy) |
| long-tail | frazy z długiego ogona |
| comparative content | treści porównawcze |
| list-format | format listy / format wyliczenia |
| best of / listicles | rankingi / zestawienia "najlepsze X" |
| share of voice (SoV) | udział głosu (Share of Voice) | Zostaje EN przy pierwszym użyciu, potem skrót |
| citation rate | wskaźnik cytowań |
| mention rate | wskaźnik wzmianek |
| awareness | świadomość marki |
| intent | intencja (zakupowa / informacyjna) |

### Terminy techniczne i narzędziowe

| Kalka | Polski |
|---|---|
| dedykowany | wyspecjalizowany / przeznaczony do |
| adresować problem | rozwiązywać problem / odpowiadać na potrzebę |
| dostarczać wartość | dawać wartość / generować wartość |
| poziom retrieval | warstwa pobierania danych |
| real-time | w czasie rzeczywistym |
| fetch on demand | pobieranie na żądanie |
| crawl | indeksowanie / przeczesywanie strony |
| crawler | bot indeksujący / robot |
| stack technologiczny | zestaw narzędzi / architektura techniczna |
| case study | studium przypadku |

### Terminy, KTÓRE ZOSTAJĄ po angielsku (z wyjaśnieniem przy pierwszym użyciu)

Niektóre terminy nie mają sensownego polskiego odpowiednika i są przyjęte w branży:

- **GEO** (Generative Engine Optimization) – rozwiń przy pierwszym użyciu
- **AEO** (Answer Engine Optimization) – j.w.
- **LLM** (Large Language Model, czyli duży model językowy) – rozwiń raz
- **AI Overview / AI Overviews** – termin Google
- **GPTBot, ClaudeBot, PerplexityBot** – nazwy własne user-agentów
- **schema.org / JSON-LD** – nazwy własne standardu
- **llms.txt / robots.txt** – nazwy plików
- **Share of Voice (SoV)** – termin pomiarowy, zostaje
- **Citation Rate, Mention Rate** – terminy pomiarowe
- **E-E-A-T** – Google framework
- **TL;DR** – akronim, OK
- **API** – ogólnie znane
- **CMO, B2B, B2C, SaaS** – akronimy biznesowe

---

## Frazy kluczowe

- Każda fraza pojawia się **optymalnie 1 raz** w artykule
- Drugie użycie TYLKO gdy 100% naturalne i w innym kontekście
- Frazy **MUSZĄ być odmienione** (deklinacja)
- **Priorytet: naturalność > SEO**. Jeśli fraza nie wchodzi naturalnie – nie wplataj
- ZAKAZANE: keyword stuffing, sztuczne upychanie

---

## Linkowanie wewnętrzne

Linki do zasobów widocznosc.ai. Zawsze relatywne ścieżki (np. `/narzedzia/brand-check`).

**Zasada nadrzędna:** linki MUSZĄ być kontekstowe – część naturalnego zdania, nie osobny element.

### Reguły

- **3-5 linków wewnętrznych per artykuł**
- Rozłożone równomiernie – nie grupuj w jednej sekcji
- **Anchor text 1-3 słowa, max ~40 znaków** – nazwa własna, nie literacka fraza
- Max 1 link wewnętrzny na akapit
- Link musi płynąć z treści zdania
- **NIE upychaj linków na siłę** – jeśli link nie pasuje naturalnie, nie wstawiaj

### Strony do linkowania

- `/narzedzia/brand-check` – po artykułach o widoczności marki, sentymencie
- `/narzedzia/url-check` – po artykułach o content / strukturze tekstu / front-loading
- `/narzedzia/ai-bots-check` – po artykułach technicznych / robots.txt / boty AI
- `/kontakt?type=full-audit` – CTA do pełnego audytu
- `/pozycjonowanie-ai` – pillar GEO
- `/pozycjonowanie-ai/{chatgpt,claude,gemini,perplexity,bing-copilot}` – per-model strony
- `/blog/{slug}` – inne artykuły blogowe (gdy tematycznie pasują)

### Przykłady

ZŁE: `Sprawdź też: [URL check](/narzedzia/url-check)` ← osobne zdanie pod link

DOBRE: `Jeśli chcesz sprawdzić, jak Twój content wypada pod kątem cytowalności, [URL check](/narzedzia/url-check) analizuje stronę pod kątem 5 czynników w 30 sekund.`

ZŁE (anchor 8 słów, literacka fraza): `[narzędziem do sprawdzania widoczności w wyszukiwarkach AI](/narzedzia/brand-check)`

DOBRE (anchor 2 słowa, nazwa własna): `darmowy [brand check](/narzedzia/brand-check) odpyta cztery silniki AI o Twoją markę`

---

## Linkowanie zewnętrzne

### Wikipedia – min. 1 link per artykuł

Każdy artykuł powinien zawierać 1 link do Wikipedii do **pojęcia technicznego** (nie do tematu artykułu).

- pl.wikipedia.org preferowane
- en.wikipedia.org jeśli brak polskiej strony

DOBRE:
- "Mechanizm opiera się na [embeddingach wektorowych](https://pl.wikipedia.org/wiki/S%C5%82owo_zanurzaj%C4%85ce) generowanych przez model."
- "Standard wzorowany na [robots.txt](https://pl.wikipedia.org/wiki/Robots_Exclusion_Protocol) z 1994 roku."

ZŁE:
- "[Query fan-out](https://en.wikipedia.org/wiki/...) to mechanizm…" ← link do tematu artykułu
- "Więcej na Wikipedii: [link]" ← osobny element

### Cytowania badań – linkuj źródło

Każde przywołanie badania (Princeton, Indig, Fishkin) powinno mieć link do source. Akademickie papers idą do arxiv.org. Industry research – do source bloga / firmy.

Przykład: "Badanie [Aggarwal et al. (KDD 2024)](https://arxiv.org/abs/2311.09735) wykazało, że dodanie cytowań źródeł podnosi widoczność w LLM o 30-40%."

---

## Zakazane zwroty AI (blacklista)

Bezwzględnie nie używaj. To "fingerprint" AI:

| Zakazany zwrot | Co zrobić |
|---|---|
| "niekwestionowany lider" | Konkretny fakt lub usuń |
| "w niniejszym artykule" | Usuń |
| "warto podkreślić / wspomnieć / zauważyć" | Fakt bez wstępu |
| "nie sposób nie wspomnieć" | Fakt wprost |
| "zarówno...jak i" (nadużywane) | Uprość |
| "W dzisiejszych czasach…" | Usuń, zacznij od meritum |
| "innowacyjne rozwiązanie" | Konkretna technologia |
| "nowoczesna technologia" | Konkretna nazwa |
| "rewolucyjne podejście" | Konkretny mechanizm |
| "transformacja cyfrowa" | Konkretna zmiana |
| "doświadczenia użytkowników" | "w praktyce" / "doświadczeni specjaliści zalecają" |
| "zaleca się" / "nie należy" | "sprawdź", "unikaj", "nie rób" |
| "jak wszyscy wiemy" | Usuń |
| "świat się zmienia" | Konkretna zmiana |
| "BLUF:" jako tekst w artykule | USUŃ – BLUF to instrukcja, NIE tekst |
| "Wnioski" jako H2 na końcu | NIE pisz – ostatnia sekcja H2 spina temat |

---

## Polska fleksja – pułapki LLM

LLM-y w długich passusach gubią przypadki po przyimkach, mieszają konstrukcje czasowe i odmieniają nazwy kategorii jak osoby.

### Konstrukcje czasowe

- "kiedy?" → liczebnik PORZĄDKOWY + miejscownik: "w 28. **sekundzie**", "w 3. **rundzie**"
- "ile czasu?" → liczebnik główny + dopełniacz: "po 28 **sekundach**", "trwała 3 **minuty**"
- ZŁE: "w 28 sekund pierwszej rundy"
- DOBRE: "w 28. sekundzie pierwszej rundy"

### Po "jako" / "za" → BIERNIK

- DOBRE: "uważany za **eksperta**" (biernik = dopełniacz dla rzeczowników żywotnych męskich)
- ZŁE: "uważany za **ekspert**"

### Spójnik "i" / "oraz" – te same przypadki

- DOBRE: "audyt **techniczny** i **strategiczny**" (oba w mianowniku)
- ZŁE: "z **dokumentacją** i **wynik**" (mieszanka narzędnik + mianownik)

### Halucynacje literowe

- Sprawdź podejrzane wyrazy: "kompetencja" (nie "kompetenacja"), "specyficzny" (nie "specyfiyczny")

---

## Self-Review checklist (przed publikacją)

### Naturalność
- [ ] Każde zdanie brzmi jak napisane przez człowieka-eksperta
- [ ] Żaden zwrot z blacklisty nie pojawia się w tekście
- [ ] Zróżnicowana długość zdań i akapitów
- [ ] Każdy akapit wnosi nową informację

### Polszczyzna
- [ ] Konstrukcje czasowe: "w X. sekundzie" (porządkowy + miejscownik)
- [ ] Po "jako"/"za" + osoba → biernik
- [ ] "i"/"oraz" – oba człony w tym samym przypadku
- [ ] Sprawdzone podejrzane wyrazy w słowniku

### Kalki i terminy GEO/AI
- [ ] Brak kalk: synthetic queries → podzapytania, passage → fragment, chunkable → podzielna
- [ ] Każda kalka z słownika powyżej zamieniona na PL odpowiednik
- [ ] Terminy które zostają po EN (GEO, LLM, AEO, GPTBot) – wyjaśnione przy pierwszym użyciu
- [ ] Spójność terminologiczna w obrębie artykułu (jeden termin per pojęcie)

### Struktura
- [ ] Wstęp (1 akapit) BEZ nagłówka, PRZED H2
- [ ] **MIN. 2 listy punktowe** w treści
- [ ] **MIN. 1 tabela** (porównanie / metryki / lista)
- [ ] **Oba callouty OBOWIĄZKOWE** (`<aside class="callout-fact">` Ciekawostka + `<aside class="callout-expert">` Opinia eksperta), wewnątrz tylko tekst + `<strong>` (zero markdownu)
- [ ] Min. 1 inline `\`code\`` przy nazwach plików / user-agentów
- [ ] Pogrubienia: całe ważne zdania (nie pojedyncze słowa)
- [ ] Brak serii identycznych krótkich akapitów
- [ ] Brak sekcji "Podsumowanie"

### BLUF
- [ ] Każda sekcja H2/H3 zaczyna się od kluczowej informacji
- [ ] Wstęp: 2-3 zdania, najważniejsza info na początku

### Linkowanie
- [ ] 3-5 linków wewnętrznych kontekstowych (część zdania, nie osobny element)
- [ ] Anchor 1-3 słowa, max 40 znaków
- [ ] Min. 1 link do darmowego narzędzia (`/narzedzia/...`) w naturalnym kontekście
- [ ] Min. 1 link do Wikipedii (do pojęcia technicznego, nie tematu)
- [ ] Linki do badań mają source URL (arxiv, blog firmy)

### Formatowanie
- [ ] Listy: `**Termin** – opis` (myślnik, nie dwukropek)
- [ ] Półpauza (–), nie pauza (—)
- [ ] Nagłówki H2: pierwsza wielka, reszta małe
- [ ] Nagłówki H3: pierwsza wielka, myślnik separator, mała po
- [ ] H2: zróżnicowane formy frazy
- [ ] Po H2 → akapit wprowadzający PRZED H3
- [ ] Brak H4

### Frazy kluczowe
- [ ] Każda fraza odmieniona i w kontekście
- [ ] Każda fraza max 1x (chyba że 100% naturalne)
- [ ] Brak keyword stuffingu

---

## Lessons learned

### Maj 2026 – feedback usera po pierwszej fali artykułów

User wskazał krytyczne braki w pierwszych 4 artykułach (query-fan-out, share-of-voice, topical-authority, gptbot-przewodnik):

1. **Brak struktury wizualnej** – ścianki tekstu, brak list, tabel, calloutów. Reguła: min. 2 listy + min. 1 tabela per artykuł
2. **Kalki językowe** – "synthetic queries", "passage", "chunkable", "front-loading" bez wyjaśnienia. Reguła: pełen słownik kalk powyżej + reguła "wyjaśnij przy pierwszym użyciu"
3. **"Podpytania" jako kalka** – lepiej "podzapytania" lub "wygenerowane przez model rozszerzenia zapytania"
4. **Brak hero images w listingu** (technical, fix template) – ale też: artykuł powinien wykorzystywać `image:` w frontmatterze
5. **Wąski układ** – content max-w-3xl 768px to ścianka tekstu. Fix: sidebar z CTA + content max-w-4xl

### Wzorzec poprawnego artykułu

1. Wstęp 3-5 zdań, BLUF
2. H2 → akapit intro (3-5 zdań) → H3 z konkretem → akapit → lista (gdy lista ma sens) → akapit
3. Po 2-3 sekcjach H2 wstaw tabelę porównawczą lub callout
4. Pod koniec: konkretny CTA do narzędzia w naturalnym zdaniu
5. Opcjonalnie FAQ 3-5 pytań (dla artykułów definicyjnych / how-to)
