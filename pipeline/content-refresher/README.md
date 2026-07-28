# Content Refresher

Pipeline reoptymalizacji treści dla Content Watchera. Uruchamiany z dashboardu
(zakolejkowanie zadania → `repository_dispatch` → GitHub Actions), raportuje
postęp podpisanymi callbackami i **kończy się propozycją zmian, nigdy zapisem
do WordPressa**.

## Kroki

| Krok | Co robi | Źródło |
| --- | --- | --- |
| `fetch` | treść wpisu i snapshot sekcji ACF | WP REST (maper z collectora) |
| `keywords_own` | frazy, na które URL już rankuje | Ahrefs, Senuto, GSC |
| `serp` | 5 adresów konkurencji dla głównej frazy | Ahrefs `serp-overview` |
| `competitors` | nagłówki i treść tych stron | pobranie HTML + `trafilatura` |
| `keywords_competitors` | frazy konkurentów per URL | Ahrefs |
| `brief` | wytyczne: luki, frazy, struktura, ryzyka | model z websearchem |
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

# Pełny przejazd (wymaga AHREFS_API_KEY – zużywa ~900 jednostek):
python3 run.py --job test-1 --domain grupa-icea.pl --post-id 5767 \
  --url "https://www.grupa-icea.pl/blog/blad-403-jak-naprawic-co-oznacza/" \
  --title "Błąd 403 – jak naprawić? Co oznacza?" --dry-run --out /tmp/wynik.json

# Przejazd na zapisanych danych researchu (bez Ahrefs, bez kosztów jednostek):
python3 run.py --job test-2 --domain grupa-icea.pl --post-id 5767 \
  --url "https://www.grupa-icea.pl/blog/blad-403-jak-naprawic-co-oznacza/" \
  --research-file tests/fixtures/blad-403.json --dry-run --out /tmp/wynik.json
```

`--dry-run` wyłącza callbacki do dashboardu, `--research-file` podmienia
wywołania Ahrefs na zapisany plik (przydatne przy pracy nad promptami).

## Testy

```bash
cd pipeline/content-refresher && python3 -m unittest discover -s tests -t tests
```

Testy nie ruszają sieci ani kluczy: sprawdzają maper sekcji, wykrywanie
konfliktów z CMS-em, ekstrakcję treści, wstawianie linków i przypisów, budżet
oraz zgodność podpisu callbacku z implementacją w Workerze.

## Koszty

Jeden przejazd to rzędu 900 jednostek Ahrefs (przy limicie 1 mln miesięcznie)
i kilkadziesiąt tysięcy tokenów. Budżet jest twardy i sprawdzany **przed**
każdym krokiem – przekroczenie kończy zadanie stanem `budget_exceeded`
z częściowym wynikiem, zamiast urywać research w połowie.

## Sekrety

`DASHBOARD_URL`, `CW_CALLBACK_SECRET` (ten sam po stronie Workera),
`AHREFS_API_KEY`, `SENUTO_API_KEY`, `OPENROUTER_API_KEY`,
`GSC_SERVICE_ACCOUNT_JSON`. `WP_APP_USER` i `WP_APP_PASSWORD` są opcjonalne –
odczyt z WordPressa działa anonimowo, hasło będzie potrzebne dopiero do zapisu
draftów.

## Wersjonowanie

`config.PIPELINE_VERSION` plus wersja każdego promptu (nagłówek
`<!-- version: X -->` w `prompts/*.md`) trafiają do kroków zadania razem z nazwą
modelu. Zmieniasz prompt – podnieś jego wersję, inaczej po miesiącu nie
odtworzysz, skąd wziął się dany wynik.
