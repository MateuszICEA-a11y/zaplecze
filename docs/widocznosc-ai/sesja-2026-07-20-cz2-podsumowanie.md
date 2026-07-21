# Sesja 2026-07-20 cz.2 – przebudowa dashboardu zaplecza (v2) + system leadów

Commity: `ab417bf..093e9a2` (pushnięte na main, prod działa).

## Co powstało

### Dashboard v2 (zaplecze-dashboard.m-wisniewski.workers.dev)

- **Sekcje per domena jako podstrony**: Przegląd / Senuto / GSC / Ahrefs / Clarity / Leady,
  nawigacja zakładkowa ze status-dotami źródeł (zdrowie integracji bez wchodzenia w sekcję).
- **Senuto**: kafle TOP 3/10/50 + widoczność + ranking, wykresy, tabela rankujących fraz
  (badge pozycji TOP3/TOP10, zmiana, wolumen z paskiem, trudność, URL, filtr).
- **GSC**: dzienne metryki + **tabele fraz i stron z okna 28 dni** (kliknięcia, wyświetlenia,
  CTR, pozycja). Po pierwszym przebiegu: 66 fraz, 78 stron.
- **Ahrefs**: hero DR, backlinki, domeny linkujące + tabela refdomains (endpoint `refdomains`
  działa na kluczu z CI; fallback DataForSEO w kodzie na wypadek „Insufficient plan").
- **Clarity**: pełna integracja Data Export API w collectorze (sesje/użytkownicy/boty/scroll/
  frustracje + top strony/referrery/urządzenia; 4 z 10 dziennego limitu wywołań).
  Czeka tylko na sekret `CLARITY_API_TOKEN` w GH.
- **Leady**: tabele leadów (kto, kontakt, domena, zapytanie, zgoda, SMS ✓) i użyć narzędzi.
- Stat-tile ze sparklinem (SVG w build time), semantyka delty (`goodWhen` – spadek pozycji
  = zielony), filtr tekstowy tabel, empty-states z instrukcjami konfiguracji.

### System leadów (widocznosc.ai → dashboard)

- `functions/_lib/lead-log.ts`: rekordy `lead:<ts>:<rand>` / `usage:<ts>:<rand>` w KV
  FANOUT_RL, TTL 90 dni, zapis best-effort (nie psuje formularzy). 7 testów (127 pass).
- Logowane: formularz `/kontakt/`, raporty narzędzi (SMS-verified), wysyłka kodu SMS
  (częściowy lead – numer bez finalizacji), użycia fanout/brand-check/url-check/ai-boty.
- Eksport: `GET /api/admin/leads-export` (Bearer `LEADS_EXPORT_TOKEN`); collector zaciąga
  codziennie, archiwum kumulacyjne `dashboard/data/<domena>/leads.jsonl` (dedupe po id).
- Zakładka `/leady/` za Basic Auth: `app/worker.js` (fail-closed 503 bez sekretu,
  no-store + noindex). Login dowolny, hasło = `DASH_PASSWORD`.

### Collector

- `main.py`: źródła mogą zwracać `{summary, details}`; `details.json` per domena
  (merge odporny – padnięte źródło zachowuje wczorajszą listę).
- Nowe/rozszerzone źródła: senuto (positions/getData), gsc (28 dni query+page),
  ahrefs (refdomains + fallback DataForSEO), clarity (live-insights), leads (eksport KV).

## Sekrety – stan na koniec sesji

- `DASH_PASSWORD` – ✅ ustawione na Workerze (wrangler), **wartość w gitignored `.env`
  w repo root** (sekcja „Dashboard zaplecza")
- `LEADS_EXPORT_TOKEN` – ✅ CF Pages widocznosc-ai (production, aktywny po redeployu,
  eksport zweryfikowany 200), wartość w `.env`; ❌ **GH Secrets – musi dodać Mateusz**
  (token CLI bez uprawnień: HTTP 403) – do tego czasu źródło `leads` = error w snapshotcie
- `CLARITY_API_TOKEN` – ❌ do wygenerowania w panelu Clarity (Settings → Data Export)
  i dodania w GH Secrets

## Gotche

- Sekrety CF Pages działają dopiero od **następnego deploymentu** (redeploy pustym commitem).
- `wrangler secret put` na Workerze działa od razu (nowa wersja).
- Scratchpad `/tmp` bywa czyszczony między sesjami – wygenerowane sekrety od razu do `.env`.
- Workflow dispatch przez `gh` wymaga admina repo (403) – przebieg collectora wymusza się
  pushem w ścieżki collectora albo czeka na cron 6:30.
- Pierwotny klucz Ahrefs MCP miał „Insufficient plan" na refdomains, ale klucz z GH Secrets
  ma pełny dostęp – lista domen przyszła z Ahrefs (`ref_domains_source: ahrefs`).

## Weryfikacja e2e (prod, 2026-07-20 wieczór)

- Sekcje publiczne 200, `/leady/` 401 bez hasła / 200 z hasłem / 401 złe hasło.
- `leads-export`: 401 bez tokena, 200 z tokenem z `.env`.
- Przebieg collectora po pushu: senuto ok (2 frazy), gsc ok (66/78), ahrefs ok (2 domeny),
  clarity not_configured, leads error (brak GH secret – patrz wyżej).
