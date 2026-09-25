# Sesja 2026-09-25 – dashboard: ocena, UX scrape300, Content Writer, „odśwież czy nowy”

Raport z oceny i wdrożenia: `docs/dashboard-ocena-i-content-writer-2026-09-25.html` (kopia w Downloads).
Wszystko na `main` i na produkcji (zaplecze-dashboard.m-wisniewski.workers.dev).

## 1. Ocena mechanizmu dashboardu

Przepływ danych (collector → JSONL/details.json → build Astro → Worker + D1) jest solidny: każde źródło ma własną obsługę błędów, karty pokazują ostatni udany pomiar, callbacki HMAC z oknem czasowym i nonce.

Naprawione w sesji:
- **wstrzyknięcie poleceń w workflow Content Watchera** – tytuł wpisu z WP był wklejany w `run:` (`ebcb2ba0`); argumenty idą teraz przez `env`,
- Basic Auth porównywany w stałym czasie (`ebcb2ba0`),
- `schema.sql` bez `serp_snapshots` i `job_sections.decision` (uzupełnione przy Content Writerze).

Otwarte (plan w raporcie): testy w CI (żaden workflow nie uruchamia `npm test`/`pytest`), sprzątanie D1 (`callback_nonces`, `audit_log`), rozbicie `edytor.astro` (4964 l.), duplikacja stemmingu ×3 i shortcode eksperta ×3, dane `details.json` (5,2 MB) w gicie, jeden sekret dla callbacków i tokenu Senuto.

## 2. Wygląd – system z panelu scrape300 (decyzja usera: paleta panelu, nie iCEA)

- `d405d4a9` – usunięte martwe motywy PlayStation i Dell ’96 (351 linii theme.css).
- `9c65d8d6` – paleta ról (ciemny: limonka `#c4f800` na `#03080a`, jasny: fiolet `#7018f0` na `#fcf8fe`), Roobert 400/500 (woff2 w `dashboard/app/public/fonts/`, polskie znaki sprawdzone fontTools), bez wersalików, kwadratowe znaczniki stanu, `--on-accent`, grupowanie tysięcy zawsze, kropka w menu tylko przy problemie. Nazwy tokenów bez zmian (`--accent-blue` = akcent).
- `d4d1a8f1` – krótkie wstępy (`.page-lede`), jeden przełącznik motywu, pasek źródeł jako linie, ludzkie nazwy źródeł, wzrost zużycia OpenRoutera na czerwono, bez fragmentu klucza API.

## 3. Content Writer dla grupa-icea.pl (nowy moduł)

Fraza (wpisana albo z podpowiedzi) → research w Workerze (SerpData + Senuto, Jina) → brief w GitHub Actions (każdy punkt z `basis`, możliwy `skip`) → tekst w slotach ACF 1–30, FAQ 101+, Źródła 200 → styl i fleksja / ekspert / infografiki / CTA z Content Watchera → nowy szkic w WP.

- Commity: `69397a52` (API, migracja 0011), `379fdefc` (pipeline `pipeline/content-writer-wp/`, workflow `content-writer-wp.yml`), `ca2384f2` (UI), `b7dec46b` (podpowiedzi, kanibalizacja).
- Przebiegi to wiersze `jobs` z `post_id = -id projektu` i `kind` = writer_brief / writer_text.
- Migracja 0011 na zdalnym D1 przed deployem (11 starych zadań → `kind = refresh`).

### Pierwszy przebieg – projekt #1 „co to jest adres url”
- Research: 5 konkurentów, 10 fraz luki, 8 faktów. Brief: 10 sekcji, 8 FAQ. Tekst ~1700 słów, 5 linków wewnętrznych, 8 źródeł nofollow w bloku Źródeł, zero em-dashy.
- Styl i fleksja wyłapał wciskanie fraz („Odpowiadając na pytanie url co to jest”), „konkretny podstronę” i dwa błędy merytoryczne (SMTP/IMAP/POP3 jako schematy URL, „GET lub POST” z paska adresu) – 3 poprawki przyjęte, zdanie o protokołach pocztowych przepisane ręcznie.
- **Szkic WP 42240** (autor Mateusz id 31, kategoria SEO id 21) – czeka na ocenę: https://www.grupa-icea.pl/?p=42240&preview=true

### Błędy znalezione w pierwszym przebiegu
- `57f4dbe6` – **wyścig kroków analizy SERP**: klient odpytuje co 5 s, krok SerpData trwa ~20 s, spóźniony krok nadpisywał gotowy wynik stanem „running” → pusty `GAP_JSON` i podwójne płatności za SerpData. Dzierżawa kroku (`step_at`, 45 s) + zapis warunkowy (`expectStage`). Dotyczyło też edytora Content Watchera.
- `0a2ee8d9` – brief przerywany 503 z SerpData: Worker dosyła konkurentów z własnej analizy (`SERP_JSON`), pipeline używa ich przy awarii.

## 4. „Odśwież czy napisz nowy” – embeddingi + ranking + sędzia

Podpowiedzi dopasowywane po słowach wskazywały do napisania tematy, które blog już ma („co to jest ip” ↔ „Co to jest adres IP?”).

- `2e7d5661` – collector zapisuje tekst nagłówków H2, katalog oddaje H2 i meta description.
- `ff4cedc9` – `dashboard/app/cw-semantic.js`: bge-m3 (Workers AI) + Vectorize `zaplecze-posts` (binding `POSTS_INDEX`, metadata index `domain`), tabela `post_vectors` (migracja 0012), cron Workera 05:20 UTC, kolumna „Rekomendacja” z filtrem w podpowiedziach, decyzja przy wpisywaniu frazy.
- `c2dc5b52` – kalibracja na 13 parach (3 modele × 3 warianty tekstu):
  - najlepszy bge-m3 na samym tytule (trafne śr. 0,67; z meta description 0,53) → `EMBED_VERSION` 2,
  - pasma „ten sam temat” 0,53–0,81 i „pokrewny” 0,56–0,74 się nakładają → Odśwież ≥ 0,75, Sprawdź ≥ 0,60 albo rankujący ≥ 0,50,
  - „Sprawdź” rozstrzyga sędzia gemini-3.7-flash (same / related / different / skip + uzasadnienie w UI),
  - strony spoza katalogu (/slownik/, /branze/) oceniane po ścieżce adresu; strona główna nie blokuje.
- Wynik: 22 frazy testowe 12 / 8 / 2 zgodnie z ręczną oceną; 30 podpowiedzi → 4 do napisania, 17 do odświeżenia, 9 do sprawdzenia. ~10 s na listę.

## Gotche z sesji
- Rebase na commity botów zmienia hashe – w dokumentach podawać hashe po pushu.
- Vectorize widzi upserty dopiero po ~1–2 min (`npx wrangler vectorize info zaplecze-posts` → `processedUpToDatetime`).
- Git Bash przerabia argument `/api/...` na ścieżkę Windows – `MSYS_NO_PATHCONV=1`.
- Lokalne `WP_APP_*` w `.env` nie ma prawa edycji (401 na `context=edit`) – szkice sprawdzać w panelu WP.
- Playwright MCP nie przechodzi Basic Auth dashboardu; Claude in Chrome tak (przeglądarka usera ma zapamiętane hasło).

## Do zrobienia
1. Ocena szkicu 42240 (Mateusz).
2. Bramka pokrycia fraz wymusza nienaturalne zdania – rozważyć łagodniejszą albo przenieść frazy do „styl i fleksja”.
3. Cele „Odśwież” spoza bloga (/branze/, /zapytaj-o-seo/) – Content Watcher ich nie edytuje.
4. Z audytu: testy w CI, sprzątanie D1, rozbicie edytora, wspólny klient OpenRoutera.
