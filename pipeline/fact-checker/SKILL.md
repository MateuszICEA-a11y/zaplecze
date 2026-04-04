---
name: fact-checker
description: >
  Two-pass fact-checking, content enrichment, and style correction for BusManiak.pl articles.
  Pass 1: GPT-5.4 (via OpenAI API directly) identifies factual errors, hallucinations,
  prompt leaks, inconsistencies AND missing knowledge gaps – provides concrete data to fill them.
  Pass 2: GPT-5.4 (via OpenAI API directly) applies fixes, writes missing content using data from Pass 1, and polishes style.
  Both passes use OpenAI API directly (api.openai.com), NOT OpenRouter.
  API key from memory (reference_openai_api.md), NEVER hardcoded in committed files.
  Triggers: "sprawdź artykuł", "fact-check", "zweryfikuj treść", "korekta artykułu".
  Portal scope: delivery vans, buses, campers, vanlife, regulations, rentals.
---

# BusManiak.pl – Fact-Checker, Content Enrichment & Style Correction

Two-pass verification pipeline for finished articles. Run AFTER the content pipeline (write-content) produces output.

**Kluczowa zasada:** Oba passy używają GPT-5.4 via OpenAI API (`api.openai.com`). Pass 1 identyfikuje luki i dostarcza konkretne dane. Pass 2 pisze tekst na podstawie danych od Pass 1, ale NIE szuka faktów samodzielnie. Klucz API z pamięci (reference_openai_api.md) – NIGDY nie commituj kluczy do repo.

## When to Use

- After content pipeline produces a finished `.md` article
- On any existing article that needs quality verification
- Before publishing a batch of articles

## Requirements

- OpenRouter API key (from `../content-writer/references/api-credentials.md`)
- A finished article in Markdown format

---

## Pipeline Overview

```
Pass 1: Fact-check + gaps ── Gemini 3.1 Pro (thinking) → JSON: errors[] + gaps[]
Pass 2: Enrich + style fix ─ Gemini 2.5 Pro → corrected & enriched article Markdown
```

**Pass 1** wykrywa błędy i luki. Dla każdej luki podaje konkretne dane/fakty (liczby, daty, parametry) – bo 3.1 Pro ma aktualniejszą wiedzę.
**Pass 2** stosuje poprawki, **pisze** brakujące treści korzystając WYŁĄCZNIE z danych dostarczonych przez Pass 1, i poleruje styl.

---

## Pass 1: Fact-check (GPT-5.4 via OpenAI)

**Load:** OpenAI API key from memory (reference_openai_api.md). **NEVER** hardcode the key in committed files – pass via env var.

```bash
curl -s https://api.openai.com/v1/chat/completions \
  -H "Authorization: Bearer ${OPENAI_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-5.4",
    "max_tokens": 12000,
    "messages": [
      {"role": "system", "content": "<FACTCHECK_PROMPT>"},
      {"role": "user", "content": "ARTYKUL:\n<pelny artykul MD>"}
    ]
  }'
```

**Uwagi:**
- Use OpenAI directly (`api.openai.com`), NOT OpenRouter
- `max_tokens: 12000` – thinking model zużywa dużo tokenów na reasoning (~5-8k) + output (~3-5k)
- Jeśli output ucięty → zwiększ do 16000
- Odpowiedź może być opakowana w ```json ... ``` – strip code fence przed parsowaniem

### Prompt fact-checkera

```
Jesteś fact-checkerem i ekspertem merytorycznym artykułów dla portalu BusManiak.pl (busy dostawcze, kampery, vanlife, przepisy drogowe, wynajem). Otrzymujesz draft artykułu i musisz:
1. Zidentyfikować WSZYSTKIE błędy faktyczne, halucynacje AI, wycieki promptu i niespójności.
2. Zidentyfikować LUKI MERYTORYCZNE – ważne informacje, które w artykule brakuje, a powinny być.

TWOJE ZADANIE: Przeczytaj artykuł i zwróć JSON z dwoma tablicami: "errors" i "gaps". NIE poprawiaj tekstu, NIE przepisuj artykułu.

WAŻNE: Masz aktualniejszą wiedzę niż model, który będzie pisał tekst (jego odcięcie: grudzień 2025). Dlatego w polu "data" dla każdej luki MUSISZ podać KONKRETNE fakty, liczby, daty, parametry – wszystko, czego potrzebuje redaktor, żeby napisać brakujący fragment BEZ własnego researchu.

CO SZUKAĆ – BŁĘDY:
1. WYCIEKI PROMPTU / META-TEKST AI: "Oto kontynuacja artykułu o...", *Punchline: ...*, [TODO], "w niniejszym artykule", "warto podkreślić"
2. BŁĘDY FAKTYCZNE POJAZDY: błędne dane techniczne (DMC, ładowność, silniki, wymiary), mylenie generacji/faceliftów, błędne lata produkcji, nieistniejące wersje silnikowe
3. BŁĘDY FAKTYCZNE PRZEPISY: nieaktualne limity prędkości, błędne kategorie prawa jazdy, wymyślone kary/mandaty, nieistniejące przepisy, błędne ceny winiet/opłat drogowych
4. BŁĘDY FAKTYCZNE KAMPERY/VANLIFE: zmyślone ceny wynajmu, błędne wymiary zabudów, nieistniejące modele kamperów, fałszywe normy homologacji
5. BŁĘDY FAKTYCZNE SERWIS: błędne interwały serwisowe, wymyślone koszty napraw, nieistniejące kody błędów, zmyślone parametry eksploatacyjne (pojemność oleju, typ filtra)
6. HALUCYNACJE: dodane fakty bez źródeł (np. zmyślone statystyki procentowe, nieistniejące badania, fałszywe rankingi), fikcyjne nazwy forów/źródeł ("na forum X – przewodnik")
7. NIESPÓJNOŚĆ WEWNĘTRZNA: intro/lead vs FAQ, różne wersje tych samych faktów w różnych sekcjach, sprzeczne dane liczbowe

CO SZUKAĆ – LUKI MERYTORYCZNE:
8. BRAKUJĄCE DANE TECHNICZNE: artykuł omawia pojazd/model ale pomija kluczowe parametry (silniki, DMC, wymiary, ładowność, zużycie paliwa)
9. BRAKUJĄCE INFORMACJE PRAKTYCZNE: brak cen orientacyjnych, kosztów eksploatacji, typowych usterek, interwałów serwisowych – jeśli temat tego wymaga
10. BRAKUJĄCE KONTEKST PRAWNY: artykuł dotyka regulacji ale nie podaje konkretnych przepisów, limitów, kar
11. BRAKUJĄCE PORÓWNANIA/ALTERNATYWY: czytelnik nie dostaje kontekstu rynkowego (konkurencyjne modele, przedziały cenowe segmentu)
12. NIEWYSTARCZAJĄCA GŁĘBIA: sekcja H2/H3 jest powierzchowna – 1-2 zdania ogólników zamiast konkretów

FORMAT – wyłącznie JSON obiekt z dwoma tablicami:
{
  "errors": [
    {"type":"prompt_leak|fact_error|hallucination|inconsistency","location":"sekcja H2/H3","original":"cytat z artykułu","issue":"opis problemu","fix":"poprawka lub USUŃ"}
  ],
  "gaps": [
    {"type":"missing_specs|missing_practical|missing_legal|missing_comparison|thin_content","location":"sekcja H2/H3 gdzie wstawić lub która jest zbyt płytka","topic":"czego brakuje","data":"KONKRETNE fakty, liczby, parametry, daty do wykorzystania przez redaktora","priority":"high|medium"}
  ]
}

Jeśli artykuł nie zawiera błędów ani luk, zwróć: {"errors":[],"gaps":[]}

ZASADY:
- Zgłaszaj tylko luki, które NAPRAWDĘ wzbogacą artykuł – nie wymuszaj uzupełnień dla każdej sekcji
- Priorytet "high" = artykuł jest niepełny bez tej informacji, "medium" = wzbogaci ale nie jest krytyczne
- W polu "data" podawaj KONKRETNE wartości (np. "silnik 2.2 CDTi: 120 KM / 350 Nm, spalanie 7.5-9.2 l/100km"), NIE ogólniki ("warto dodać dane o silniku")
```

---

## Pass 2: Uzupełnienie treści + korekta stylistyczna (GPT-5.4 via OpenAI)

```bash
curl -s https://api.openai.com/v1/chat/completions \
  -H "Authorization: Bearer ${OPENAI_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-5.4",
    "max_tokens": 16000,
    "messages": [
      {"role": "system", "content": "<STYLE_PROMPT>"},
      {"role": "user", "content": "BŁĘDY OD FACT-CHECKERA:\n<errors JSON>\n\nLUKI MERYTORYCZNE OD FACT-CHECKERA:\n<gaps JSON>\n\nFRAZY KLUCZOWE:\n<lista z frontmatter extra_keywords>\n\nARTYKUŁ:\n<pełny artykuł MD>"}
    ]
  }'
```

### Prompt korekty i uzupełnienia

```
Jesteś Redaktorem Naczelnym portalu BusManiak.pl (busy dostawcze, kampery, vanlife, przepisy drogowe, wynajem). Otrzymujesz draft artykułu, listę błędów znalezionych przez fact-checkera ORAZ listę luk merytorycznych z konkretnymi danymi do uzupełnienia.

TWOJE ZADANIE:
1. Zastosuj WSZYSTKIE poprawki z listy błędów (errors)
2. Uzupełnij artykuł o brakujące treści na podstawie listy luk (gaps) – PISZ nowe akapity korzystając WYŁĄCZNIE z danych podanych w polu "data" każdej luki
3. Wypoleruj styl całego tekstu

WAŻNE – ŹRÓDŁA WIEDZY:
- Twoja wiedza ma odcięcie w grudniu 2025 – NIE szukaj faktów samodzielnie
- Dla luk merytorycznych (gaps): korzystaj WYŁĄCZNIE z danych w polu "data" dostarczonychprzez fact-checkera (Gemini 3.1 Pro, który ma aktualniejszą wiedzę)
- Dla poprawek błędów (errors): korzystaj z pola "fix"
- NIE DODAWAJ faktów, których nie ma ani w artykule, ani w listach errors/gaps

JAK UZUPEŁNIAĆ LUKI:
- Wstawiaj nowe treści w sekcji wskazanej w polu "location"
- Pisz 2-4 zdania na lukę (nie rozwlekaj)
- Integruj nowe treści naturalnie z istniejącym tekstem – nie oznaczaj ich jako "dodane"
- Priorytet "high" = obowiązkowe uzupełnienie, "medium" = uzupełnij jeśli pasuje do kontekstu sekcji

STYL – EKSPERCKI BLOG MOTORYZACYJNY:
Pisz jak doświadczony mechanik/kierowca na blogu – rzeczowo, konkretnie, z praktyczną wiedzą.
ZAKAZANE (barok): "Ten wspaniały pojazd zachwyca niezrównaną przestronnością swojego monumentalnego wnętrza."
ZAKAZANE (korporacja): "W przedmiocie eksploatacji jednostki napędowej typu diesel w pojazdach kategorii N1."
ZAKAZANE (lanie wody): "Warto podkreślić, że nie sposób nie wspomnieć o niekwestionowanej pozycji lidera..."
DOBRZE: "Ducato trzeciej generacji to 17 m³ ładowni w wersji L3H3 – zmieścisz 4 europalety bez kombinowania."
DOBRZE: "Wymiana rozrządu w 2.3 MultiJet co 240 tys. km to nie sugestia. Przeskoczony łańcuch = wygięte zawory i rachunek za 8000 zł."

KRYTYCZNE – FRONTMATTER:
- ZACHOWAJ CAŁY oryginalny frontmatter (blok --- ... ---) DOKŁADNIE jak w oryginale
- NIE usuwaj, NIE modyfikuj pól: title, date, author, image, lead, faq, description
- Jedyne dopuszczalne zmiany w frontmatter: poprawka literówki w lead lub FAQ answer
- NIE przenoś FAQ z frontmatter do body – FAQ MUSI pozostać w frontmatter
- NIE dodawaj sekcji ## FAQ w treści artykułu

REGUŁY TREŚCI:
- Frazy kluczowe odmieniane naturalnie (NIE surowe w mianowniku)
- Półpauza (–) nie pauza (—)
- Akapity max 2-4 zdania, zróżnicowana długość
- Po H2 → akapit wprowadzający PRZED pierwszym H3
- Zachowaj DOKŁADNIE oryginalne tytuły H2 i H3 (słowo w słowo), możesz jedynie poprawić błąd merytoryczny w nagłówku
- Zachowaj kolejność sekcji, nie dodawaj nowych sekcji H2, nie usuwaj istniejących
- Nie dodawaj podsumowania (FAQ pełni tę rolę)
- Link do Wikipedii: 1 w body, do pojęcia technicznego (NIGDY nazwa modelu)
- Linki wewnętrzne: kontekstowe, max 1 per akapit
- Każda sekcja H2/H3 zaczyna się od kluczowej informacji (BLUF)
- Tabele: zachowaj dane techniczne bez zmian, chyba że fact-checker wskazał błąd
- Pogrubienia zakresów liczbowych: CAŁY zakres (**200–500 zł**), nie tylko końcówka
- Body po frontmatter MUSI zaczynać się od ## H2 (nie intro paragraf)
- Polskie znaki: sprawdź cały tekst pod kątem brakujących diakrytyków

Zwróć WYŁĄCZNIE poprawiony i uzupełniony artykuł Markdown (bez komentarzy, bez wyjaśnień). Artykuł MUSI zaczynać się od --- (frontmatter).
```

---

## Koszty i czasy

| Pass | Model | API | Cost | Czas |
|---|---|---|---|---|
| 1 (fact-check + gaps) | gpt-5.4 | OpenAI direct | ~$0.05-0.10 | ~15-30s |
| 2 (enrich + styl) | gpt-5.4 | OpenAI direct | ~$0.05-0.10 | ~20-40s |
| **Razem** | | | **~$0.10-0.20** | **~35-70s** |

---

## Execution Steps – Single Article

1. **Load credentials** – read `../content-writer/references/api-credentials.md`, extract OpenRouter key
2. **Read article** – load the target `.md` file, extract frontmatter (extra_keywords) and body
3. **Pass 1** – send article to Gemini 3.1 Pro fact-checker via OpenRouter, parse JSON response (errors + gaps)
4. **Review results** – if both arrays empty (`{"errors":[],"gaps":[]}`) → skip Pass 2 (article is clean)
5. **Pass 2** – send article + errors JSON + gaps JSON + keywords to Gemini 2.5 Pro → receives corrected & enriched Markdown
6. **Validate output** – before writing, run post-Pass 2 validation (see below). If validation fails, keep the original file and log the error.
7. **Write output** – overwrite the original `.md` file with validated corrected version
8. **Report** – show summary: number of errors by type, number of gaps filled, changes applied

---

## Batch Mode – Sekcja lub cały portal

Batch mode przetwarza wiele artykułów sekwencyjnie. Każdy artykuł przechodzi pełny pipeline (Pass 1 + Pass 2) niezależnie – jakość identyczna jak single mode.

### Wywołanie

```
fact-check sekcję /kampery/
fact-check sekcje /kampery/ i /przerobki/
fact-check wszystkie artykuły
sprawdź całą sekcję vanlife
```

### Execution Steps – Batch

1. **Load credentials** – read `../content-writer/references/api-credentials.md`, extract OpenRouter key
2. **Collect files** – glob `portals/busmaniak.pl/content/<sekcja>/**/*.md` (lub `content/**/*.md` dla "wszystkie"). Pomiń pliki `_index.md` (hub pages)
3. **Show plan** – wylistuj znalezione artykuły, pokaż liczbę i szacowany koszt (ilość × ~$0.20)
4. **Process sequentially** – dla każdego artykułu:
   - a) Read article, extract frontmatter + body
   - b) **Pass 1** → Gemini 3.1 Pro → JSON (errors + gaps)
   - c) If both empty → log "✅ clean" i skip Pass 2
   - d) **Pass 2** → Gemini 2.5 Pro (or GPT-5.4) → corrected & enriched Markdown
   - e) **Validate output** → run post-Pass 2 validation. If fails, attempt auto-repair. If repair fails, skip file and log warning.
   - f) Write output → overwrite original file with validated version
   - g) Log result: `✅ plik.md – 3 errors, 2 gaps filled` lub `⏭️ plik.md – clean` lub `⚠️ plik.md – validation failed`
5. **Batch report** – po zakończeniu pokaż tabelę zbiorczą:

```
| Artykuł | Errors | Gaps filled | Status |
|---------|--------|-------------|--------|
| camper-van.md | 2 | 3 | ✅ fixed |
| kamper-cena.md | 0 | 0 | ⏭️ clean |
| mini-kamper.md | 1 | 5 | ✅ fixed |
| RAZEM | 3 | 8 | 14/15 done |
```

---

## Post-Pass 2 Validation

After Pass 2 returns corrected Markdown, validate BEFORE writing to disk. Some models (especially GPT-5.4) strip frontmatter or inject FAQ into body.

### Validation checks (all must pass)

```python
def validate_output(original: str, corrected: str) -> tuple[bool, str]:
    """Returns (is_valid, error_message)."""

    # 1. Frontmatter exists
    if not corrected.strip().startswith("---"):
        return False, "MISSING FRONTMATTER: output doesn't start with ---"

    parts = corrected.split("---", 2)
    if len(parts) < 3:
        return False, "MALFORMED FRONTMATTER: no closing ---"

    fm = parts[1]

    # 2. Required fields present
    required = ["title:", "author:", "date:"]
    for field in required:
        if field not in fm:
            return False, f"MISSING FIELD: {field} not in frontmatter"

    # 3. FAQ preserved (if original had it)
    orig_parts = original.split("---", 2)
    if len(orig_parts) >= 3 and "faq:" in orig_parts[1]:
        if "faq:" not in fm:
            return False, "FAQ STRIPPED: original had faq: in frontmatter but output doesn't"

    # 4. No FAQ in body (FAQ belongs in frontmatter only)
    body = parts[2]
    if "\n## FAQ" in body or "\n## FAQ\n" in body:
        return False, "FAQ IN BODY: model moved FAQ from frontmatter into body"

    # 5. Body starts with ## H2 (after optional whitespace)
    body_stripped = body.strip()
    if not body_stripped.startswith("## "):
        return False, f"BODY NOT H2: body starts with '{body_stripped[:50]}...'"

    # 6. Lead preserved (if original had it)
    if "lead:" in orig_parts[1] and "lead:" not in fm:
        return False, "LEAD STRIPPED: original had lead: but output doesn't"

    # 7. Image preserved (if original had it)
    if "image:" in orig_parts[1] and "image:" not in fm:
        return False, "IMAGE STRIPPED: original had image: but output doesn't"

    return True, "OK"
```

### On validation failure

1. **DO NOT overwrite** the original file
2. Log: `⚠️ filename.md – VALIDATION FAILED: {error_message}`
3. **Auto-repair attempt**: if only frontmatter is missing, prepend original frontmatter to corrected body and re-validate
4. If auto-repair succeeds, write the repaired version
5. If auto-repair fails, skip the article and continue to next

### Auto-repair logic

```python
def auto_repair(original: str, corrected: str) -> str | None:
    """Try to fix by prepending original frontmatter to corrected body."""
    orig_parts = original.split("---", 2)
    if len(orig_parts) < 3:
        return None  # original has no frontmatter either

    original_frontmatter = "---" + orig_parts[1] + "---\n\n"

    # Strip any FAQ section from corrected body
    body = corrected
    faq_pos = body.find("\n## FAQ")
    if faq_pos != -1:
        body = body[:faq_pos].rstrip()

    repaired = original_frontmatter + body.strip() + "\n"

    is_valid, _ = validate_output(original, repaired)
    return repaired if is_valid else None
```

---

### Zasady batch mode

- **Sekwencyjnie, nie równolegle** – jeden artykuł naraz, żeby nie przekroczyć rate limitów OpenRouter i móc przerwać w razie problemów
- **Pomiń `_index.md`** – hub pages mają inną strukturę, nie przechodzą fact-checka
- **Pomiń pliki < 500 znaków body** – to stuby, nie artykuły
- **Kontynuacja po błędzie** – jeśli API zwróci błąd dla jednego artykułu, zaloguj go i przejdź do następnego
- **Przerwanie** – użytkownik może przerwać batch w dowolnym momencie; przetworzone artykuły zostają zapisane
