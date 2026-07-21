# Sesja 2026-07-21 cz. 2 – dashboard: design v4/v4.1, Senuto 2.0, grupa-icea.pl, backfill historii

Kontynuacja po porannej sesji (dashboard v3). Wszystko z tej listy jest **na produkcji** (`zaplecze-dashboard.m-wisniewski.workers.dev`).

## 1. Clarity: Citations / Topic Insights – rozpoznanie

- Data Export API **nie wystawia** danych z zakładek Citations/Topic Insights (AI Visibility to funkcja wyłącznie w UI). Sonda na żywym API (jednorazowy workflow, usunięty): 16 metryk, zero pól AI; endpointy `citations`/`topic-insights`/`ai-visibility` → 404.
- Przy okazji wyszło, że `CLARITY_API_TOKEN` wskazuje projekt **grupa-icea.pl** – Mateusz potwierdził, że celowo („tam jest więcej danych").
- Alternatywy na Citations: scraping UI (Playwright) albo Ahrefs Brand Radar (MCP jest).

## 2. Design v4 + v4.1 (mockup z sesji „claude design")

Referencje: `podstrony-review/dashboard-design-2026-07-21/` (mockup HTML, HANDOFF-claude-code.md, dash-data.js, style-dump.md, zrzuty v3→v6).

- **v4** (28c04de): brand „Panel analityczny ICEA", chowany sidebar 244→68 px (`icea-collapsed`, zero FOUC), sortowalne tabele, pos-badge w tierach top3/top10/mid/low + drClass, ctr-pos, chipy frustracji good/warn/bad, uPlot 2.4 px / dash [6,4] / fill 14% / punkty ≤8 / oś `d.MM`, paleta serii z mockupu, DomainCard z globusem.
- **v4.1** (3dfd3da): main na pełną szerokość (zdjęty limit 1240 px – dashboard skaluje się na duże monitory), podpisy źródeł przy tytułach wykresów (prop `meta`), delty zawsze widoczne („• – / 7 dni" przy krótkiej historii), ikony sidebara 1:1 z mockupu (stroke 2.0).
- **Paginacja tabel** (37ea347): prop `pageSize` w TableCard – filtr+sort+pager w jednym kontrolerze; włączona 15/str. na „Frazy w Google".
- Celowo NIE przeniesione z mockupu: faliste sparkline'y i delty liczbowe – tam były syntetyczne serie 21-dniowe, produkcja rysuje prawdziwe dane.

## 3. Senuto: dwie bazy Polski (a8abf84)

Dashboard pokazywał inne frazy niż app.senuto.com. Przyczyna: **country_id=1 to „Poland (database 1.0)" (legacy), apka używa country_id=200 „Poland (database 2.0)"** – rozłączne zestawy fraz. `fetch_mode` bez znaczenia. Poprawione w domains.yaml na 200; frazy zgodne z apką („tomasz czechowski" itd.).

## 4. Nowa domena grupa-icea.pl (8bc222d, b5ee3c2)

- `domains.yaml`: senuto (db 2.0), gsc, ahrefs, clarity (globalny token = projekt grupa-icea); leady wyłączone.
- `token_env` w clarity/leads – domena może wskazać własny sekret; widocznosc.ai czeka na `CLARITY_API_TOKEN_WIDOCZNOSC` (token z projektu widocznosc.ai w panelu Clarity → +1 sekret GH).
- Sekrety per domena: tylko Clarity (per projekt) i ewentualnie leady; Senuto/Ahrefs/GSC/SMSAPI/OpenRouter współdzielone.
- **GOTCHA GSC**: service account `claude-icea@claude-gws-489807.iam.gserviceaccount.com` nie był dodany do property (Mateusz dodał w trakcie); grupa-icea.pl ma **tylko property prefiks `https://www.grupa-icea.pl/`** (sc-domain nie istnieje → 403). `site` jawnie w domains.yaml; diagnostyka 403 w backfill.py wypisuje listę properties widocznych dla SA.

## 5. Backfill historii (3b4026b + iteracje)

`dashboard/collector/backfill.py` + workflow `dashboard-backfill.yml` (trigger: push na backfill.py/workflow/domains.yaml – `gh workflow run` wymaga admina, brak). Idempotentny: linie `backfilled:true` tylko za brakujące daty, prawdziwe snapshoty nietykane, drugi przebieg dokłada brakujące źródła.

- **Senuto**: `domain_positions/getPositionsHistoryChartData` (**GET z query params – POST daje 418**), dzienne top3/10/50, visibility, domain_rank. grupa-icea +338 dni (pełny rok), widocznosc +61 (2026-05-17 = początek istnienia w indeksie).
- **GSC**: `searchanalytics` z `dimensions:["date"]` – grupa-icea +363 dni, widocznosc +49.
- **Ahrefs history**: „Insufficient plan" – DR/domeny linkujące rosną od daty zbierania. **Clarity**: API max 3 dni wstecz, bez historii. Salda/leady: od wdrożenia.

## 6. Clarity 429 + ochrona snapshotów (c1d28c9)

429 = wyczerpany limit **10 req/dzień/projekt** (collector bierze 4/przebieg; dzisiejsze pushe w `collector/**` i `domains.yaml` odpalały go wielokrotnie). Token dobry, jutrzejszy cron przejdzie. Fix: `write_snapshot` per źródło **nie nadpisuje wyniku ok błędem z tego samego dnia** (test w repo). Limity są per projekt Clarity, więc druga domena z własnym tokenem nie koliduje.

## Otwarte

- `CLARITY_API_TOKEN_WIDOCZNOSC` do GH Secrets (panel Clarity, projekt widocznosc.ai) – do tego czasu Clarity na widocznosc.ai = placeholder.
- Tabele Clarity url/referrer pokazują `?` (API anonimizuje) – zostaje wg handoffu.
- Citations/Topic Insights: ewentualny scraping UI albo sekcja Brand Radar – decyzja Mateusza.

Commity sesji: 686e067..c1d28c9 (w tym sonda Clarity dodana i usunięta). Zrzuty przed/po: `podstrony-review/dashboard-design-2026-07-21/`.
