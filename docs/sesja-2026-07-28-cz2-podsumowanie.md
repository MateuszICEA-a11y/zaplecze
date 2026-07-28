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

## Wdrożenie na produkcji (2026-07-28, po południu)

Kod wypchnięty na `main`, Workers Builds zbudował Workera. Zweryfikowane na
żywej instalacji:

| Element | Stan |
| --- | --- |
| Trasy `/api/cw/*` | ✅ `GET /api/cw/jobs` → 200 |
| Baza D1 + 5 tabel | ✅ |
| Sekrety w Workerze (`CW_CALLBACK_SECRET`, `GH_DISPATCH_TOKEN`, `DASH_PASSWORD`) | ✅ |
| Sekrety w GitHubie (`CW_CALLBACK_SECRET`, `DASHBOARD_URL`) | ✅ |
| Podpis callbacku | ✅ poprawny → 404 (brak zadania), powtórzony → 409, brak → 401 |
| Uruchomienie pipeline'u z panelu | ⛔ token bez `Contents: write` |

### Defekty wykryte przy pierwszym uruchomieniu

**Uprawnienia tokenu dispatchu.** `repository_dispatch` dla tokenów
fine-grained wymaga **Contents: Read and write**, nie „Actions" (zweryfikowane
w dokumentacji GitHuba po tym, jak Worker dostał `403 Resource not accessible
by personal access token`). „Actions: write" jest potrzebne osobno – do
anulowania przebiegu z panelu.

**Cooldown blokował po nieudanej próbie.** Zadanie, które nigdy nie
wystartowało, blokowało wpis na 30 dni. Poprawione: cooldown liczą wyłącznie
zadania aktywne albo zakończone realnym wynikiem (`failed`, `cancelled`,
`stale` nie blokują). Testowe rekordy usunięte z D1.

**Cloudflare odrzuca `python-urllib`** kodem 1010 (blokada po sygnaturze
klienta), zanim żądanie dojdzie do Workera. Pipeline wysyła własny User-Agent
`content-refresher` i przechodzi – ale każda nowa integracja musi o tym
pamiętać.

## Commity

`9a85a5c` API kolejki na D1 · `d325db1` pipeline content-refresher ·
`d098c2f` edytor wpisu z diffem · `b5d2999` podpięcie bazy D1 ·
`7689fa5` korekta uprawnień tokenu · `9a5844c` cooldown nie blokuje po błędzie

## Do zrobienia

1. **Dodać `Contents: Read and write`** do istniejącego fine-grained tokenu
   (github.com/settings/personal-access-tokens → token → Repository permissions).
   Wartość tokenu się nie zmienia, więc nie trzeba go ponownie wgrywać do
   Workera. To jedyna rzecz blokująca pierwszy przejazd z panelu.
2. Pełny przejazd e2e na wpisie „Błąd 403" (5767): dispatch → kroki w Actions →
   callbacki → diff w panelu.
3. Application Password w WordPressie – odblokuje zapis draftów (etap 4).
4. Obserwacja jakości: czy zakaz skracania w promptcie 1.1.0 realnie ogranicza
   wycinanie treści.
