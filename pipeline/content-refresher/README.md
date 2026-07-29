# Content Refresher

Pipeline reoptymalizacji treści dla Content Watchera. Uruchamiany z dashboardu
(zakolejkowanie zadania → `repository_dispatch` → GitHub Actions), raportuje
postęp podpisanymi callbackami i **kończy się propozycją zmian, nigdy zapisem
do WordPressa**.

## Kroki

| Krok | Co robi | Źródło |
| --- | --- | --- |
| `fetch` | treść wpisu i snapshot sekcji ACF | WP REST (maper z collectora) |
| `keywords_own` | frazy, na które URL już rankuje | Senuto (Baza Słów Kluczowych + pozycje), GSC |
| `serp` | 5 adresów konkurencji, AI Overview, PAA, frazy powiązane | SerpData (żywy SERP Google PL) |
| `competitors` | nagłówki i treść tych stron | pobranie HTML + `trafilatura` |
| `keywords_competitors` | frazy konkurentów (jedno wywołanie na komplet adresów) | Senuto |
| `brief` | wytyczne: luki, frazy, struktura, ryzyka | model z websearchem + fakty z analizy konkurencji edytora (env `RIVALS_JSON`, o ile analiza Jina była zrobiona) |
| `rewrite` | przepisane i uzupełnione sekcje | model piszący |
| `expert` | cytat eksperta ICEA (≠ autor wpisu) | model piszący |
| `sources` | przypisy + linki definicyjne wstawione w treść | model z websearchem |
| `internal_links` | linki wewnętrzne wstawione w treść | katalog treści serwisu |
| `diff` | porównanie „przed/po" per sekcja | `difflib` |

Kroki `rewrite`, `expert`, `sources` i `internal_links` są opcjonalne – zależą
od pakietu ulepszeń wybranego w edytorze.

## Uruchomienie lokalne

```bash
cd pipeline/content-refresher
set -a && . ../../.env && set +a

# Pełny przejazd (wymaga SENUTO_API_KEY i SERPDATA_API_KEY):
python3 run.py --job test-1 --domain grupa-icea.pl --post-id 5767 \
  --url "https://www.grupa-icea.pl/blog/blad-403-jak-naprawic-co-oznacza/" \
  --title "Błąd 403 – jak naprawić? Co oznacza?" --dry-run --out /tmp/wynik.json

# Przejazd na zapisanych danych researchu (bez odpytywania Senuto i SerpData):
python3 run.py --job test-2 --domain grupa-icea.pl --post-id 5767 \
  --url "https://www.grupa-icea.pl/blog/blad-403-jak-naprawic-co-oznacza/" \
  --research-file tests/fixtures/blad-403.json --dry-run --out /tmp/wynik.json
```

`--dry-run` wyłącza callbacki do dashboardu, `--research-file` podmienia
wywołania Senuto i SerpData na zapisany plik (przydatne przy pracy nad promptami).

## Testy

```bash
cd pipeline/content-refresher && python3 -m unittest discover -s tests -t tests
```

Testy nie ruszają sieci ani kluczy: sprawdzają maper sekcji, wykrywanie
konfliktów z CMS-em, ekstrakcję treści, wstawianie linków i przypisów, budżet
oraz zgodność podpisu callbacku z implementacją w Workerze.

## Koszty

Jeden przejazd to **jedno zapytanie do SerpData**, trzy zapytania do Senuto
(rozliczane abonamentem, bez licznika jednostek) i kilkadziesiąt tysięcy
tokenów. Budżet SERP-u i tokenów jest twardy i sprawdzany **przed** każdym
krokiem – przekroczenie kończy zadanie stanem `budget_exceeded` z częściowym
wynikiem, zamiast urywać research w połowie.

Ahrefs został usunięty z pipeline'u 2026-07-28: sam research fraz kosztował
tam ~900 jednostek na wpis (frazy własne + pięć wywołań `organic-keywords` per
konkurent), przy pakiecie 1000 jednostek. Senuto zwraca frazy dla dowolnego
adresu (`data_fetch_mode: url`) i przyjmuje **listę URL-i w jednym wywołaniu**,
więc komplet konkurentów to jeden request. Gotcha: Baza Słów Kluczowych nie
obsługuje bazy 2.0 – tam `country_id` musi być `1`, mimo że Analiza
Widoczności używa `200`.

## Sekrety

`DASHBOARD_URL`, `CW_CALLBACK_SECRET` (ten sam po stronie Workera),
`SENUTO_API_KEY`, `SERPDATA_API_KEY`, `OPENROUTER_API_KEY`,
`GSC_SERVICE_ACCOUNT_JSON`. `WP_APP_USER` i `WP_APP_PASSWORD` są opcjonalne –
odczyt z WordPressa działa anonimowo, hasło będzie potrzebne dopiero do zapisu
draftów.

## Wersjonowanie

`config.PIPELINE_VERSION` plus wersja każdego promptu (nagłówek
`<!-- version: X -->` w `prompts/*.md`) trafiają do kroków zadania razem z nazwą
modelu. Zmieniasz prompt – podnieś jego wersję, inaczej po miesiącu nie
odtworzysz, skąd wziął się dany wynik.
