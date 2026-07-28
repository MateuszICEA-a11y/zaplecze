# Sesja 2026-07-28 cz. 2 – edytor wpisu i pipeline reoptymalizacji

Kontynuacja [etapu A](sesja-2026-07-28-podsumowanie.md). Lista 604 pozycji
pokazywała, *który* wpis wymaga pracy, ale nie dawało się z nim nic zrobić.
Ta sesja domyka drogę: wejście w konkretny artykuł → pipeline oparty na danych
SERP → diff propozycji do akceptacji przez człowieka.

## Decyzje przed implementacją

Plan skonsultowany z Codexem (recenzja read-only). Przyjęte zastrzeżenia:
konflikt Basic Auth vs bearer w callbacku, sekcje ACF jako pary pól ze slotami,
trójstronne wykrywanie zmian w CMS-ie, dzierżawa zadań, budżet sprawdzany przed
krokiem, ekstraktor treści zamiast regexów, polityka wykorzystania treści
konkurencji. Odrzucone: zarzut o niespójność przełączników pakietu ulepszeń –
wybór per artykuł był świadomym wymaganiem.

Wybory użytkownika: runtime w GitHub Actions (nie Worker, nie PHP), pełny pakiet
czterech ulepszeń, finał na diffie z kopiowaniem sekcji (zapis draftem czeka na
Application Password).

## Co powstało

### API kolejki na D1 (`dashboard/app/cw-api.js`, `schema.sql`)

Tabele `jobs` / `job_steps` / `job_sections` + `callback_nonces` i `audit_log`.
Baza `zaplecze-content-watcher` utworzona na produkcji (EEUR), schema wgrana.

Kluczowa poprawka względem pierwotnego planu: **callback musi być obsłużony
przed bramką Basic Auth**. `worker.js` sprawdzał hasło dla całego ruchu, a
runner nie może podać jednocześnie hasła dashboardu i własnego tokenu na
nagłówku `Authorization`. Callback uwierzytelnia więc podpis HMAC ciała żądania
(`X-CW-Timestamp` + `X-CW-Signature`, okno 5 minut, nonce przeciw replayowi).

Ochrona przed zadaniami-zombie: callback przypięty do `run_id`/`run_attempt`,
whitelista przejść stanów, dzierżawa z heartbeatem (15 min → `stale`), cooldown
30 dni per wpis i limity egzekwowane **warunkowym INSERT-em**, nie odczytem
i zapisem. Mutacje wymagają nagłówka `X-CW-Request` i zgodnego `Origin`.

17 testów (`cw-api.test.js`) na stubie D1: podpisy, replay, spóźnione przebiegi,
przejścia stanów, walidacja wejścia, CSRF.

### Pipeline (`pipeline/content-refresher/`)

Jedenaście kroków: treść wpisu → frazy własne (Ahrefs + Senuto + GSC) → SERP dla
głównej frazy → treść i frazy 5 konkurentów → wytyczne → przepisanie sekcji →
ekspert → źródła → linki wewnętrzne → diff.

Ulepszenia **trafiają do treści**, nie na listę obok: przypisy z odnośnikami i
sekcją „Źródła" w wolnym slocie ACF, linki definicyjne z Wikipedii, linki
wewnętrzne z katalogu 604 pozycji, cytat eksperta. Podmiany działają wyłącznie
na tekście poza znacznikami i nie zagnieżdżają linków; czego nie da się wstawić,
wraca jako lista pominiętych z powodem.

Bariery: budżet jednostek i tokenów sprawdzany przed krokiem, wersjonowanie
promptów i modeli w każdym kroku, tryb `--research-file` do pracy nad promptami
bez palenia jednostek Ahrefs, 32 testy bez sieci.

### Edytor (`content-watcher/edytor.astro`)

Link „Edytor" przy każdym wpisie na liście. Pakiet ulepszeń, postęp kroków
z kosztami, wytyczne, diff per sekcja z akceptacją i kopiowaniem. Polling tylko
dla zadań w toku, z narastającym odstępem i pauzą przy ukrytej karcie.

## Przejazd weryfikacyjny – wpis „Błąd 403"

11/11 kroków, 54 tys. tokenów. Research wykrył 3 luki wobec konkurencji
(warianty kodu 403, podział na użytkownika i administratora, frazy poboczne),
7 fraz bez pokrycia i **3 błędy faktograficzne w istniejącej treści** (m.in.
przypisanie kodu 404 do złych danych logowania). Wstawione: 5 przypisów,
4 linki wewnętrzne, cytat eksperta, nowa sekcja „Źródła".

Problem wychwycony przy okazji: model wyciął z jednej sekcji 697 słów przy 187
dodanych – usunął praktyczne instrukcje krok po kroku. Reakcja: zakaz skracania
w promptcie (wersja 1.1.0) i flaga `shrunk` na sekcjach, w których model wyciął
więcej, niż dopisał. Flaga trafiła dokładnie w tę sekcję.

## Gotche

- **Ahrefs wymaga końcowego ukośnika** w adresie: `/blad-403…` → 0 fraz,
  `/blad-403…/` → 4 frazy. Bez tego cały research byłby pusty.
- **Scoped style Astro nie obejmują elementów tworzonych w JavaScripcie** –
  brak atrybutu `data-astro-cid` sprawiał, że diff renderował się bez stylów.
  Reguły dla treści generowanej dynamicznie muszą iść do `<style is:global>`.
- Nagłówki HTTP w `urllib` idą jako latin-1 – półpauza w `X-Title` wywracała
  wywołanie OpenRoutera.
- Inline diff przy gruntownym przepisaniu jest nieczytelny; przy zmianie
  powyżej 50% treści domyślnie włącza się widok „przed | po" obok siebie.

## Commity

`9a85a5c` API kolejki na D1 · `d325db1` pipeline content-refresher ·
`d098c2f` edytor wpisu z diffem · `b5d2999` podpięcie bazy D1

## Do zrobienia przed pierwszym uruchomieniem z panelu

1. **GitHub Secrets** (konto `sibilianspirit` nie ma uprawnień do sekretów
   tego repo): `CW_CALLBACK_SECRET` (wartość ustawiona już w Workerze) oraz
   `DASHBOARD_URL`.
2. **Fine-grained PAT** na to repo → `wrangler secret put GH_DISPATCH_TOKEN`.
   Uprawnienia: **Contents: Read and write** (bez tego `repository_dispatch`
   zwraca 403 – to Contents, nie Actions, wbrew intuicji) oraz **Actions:
   Read and write** (anulowanie przebiegu z panelu).
3. **Deploy Workera** (`npx wrangler deploy` z `dashboard/app`).
4. Application Password w WordPressie – dopiero to odblokuje zapis draftów.
