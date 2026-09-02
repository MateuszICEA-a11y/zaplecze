# Sesja 2026-09-02 – redesign widocznosc.ai wg uwag marketingu

## Kontekst

Uwagi Artura Osaka (2026-08-21): mniej „jesteśmy AI”, więcej „mamy dane i mierzymy
widoczność marki w AI”. Kierunek wizualny: Dayos (typografia, czerń/biel, przestrzeń),
Planhat (moduły, sekcja leadowa), Index (sposób pokazywania danych).

## Stan

- Gałąź: `redesign/widocznosc-dayos` (3 commity, wypchnięta na origin, niezmergowana).
- Podgląd: https://redesign-dayos.widocznosc-ai.pages.dev
  (`wrangler pages deploy dist --project-name=widocznosc-ai --branch=redesign-dayos`).
- Zrzuty przed/po: `Downloads/widocznosc-redesign/`.
- Czeka na akceptację Artura/Mateusza. Merge do main = deploy na produkcję.

## Commity

1. `17b6d17a` tokeny – `--brand` jako jedyny kolor, gradienty → `--bg-panel`,
   panel odwrócony (`--bg-inverse`/`--ink-inverse`), semantyka `--ok/--warn/--bad`,
   display 600 i większy, light mode w neutralnych szarościach.
2. `3e9c6b05` strona główna – hero z formularzem brand-check (GET `?brand=&domain=`)
   i mockiem raportu, `ProofData.astro` (tabela liczb ze źródłami) zamiast
   StatsBand+Authority, narzędzia monochrom + pełny raport jako jasny panel,
   proces/branże na liniach, zespół ICEA z liczbami, CTA „Sprawdź widoczność marki”
   + „Porozmawiaj z ekspertem ICEA”, „by ICEA” w nav i stopce.
3. `7335818c` podstrony – radialne poświaty i akcenty per nth-child zastąpione
   jednym kolorem marki lub ink (skrypt: `radial-gradient(...)` z color-mix →
   `linear-gradient(transparent, transparent)`).

## Uwagi / zaległe

- Liczby w mocku raportu w hero są przykładowe (podpisane). Do rozważenia realny wynik.
- `Authority.astro` usunięty; `StatsBand.astro` zostaje (używa go `/o-nas/`).
- Prettier failuje na AuthorsStrip/Footer/index/StatsBand – stan sprzed zmiany, nie ruszane.
- Lint: 2 błędy `no-explicit-any` w ReportLeadForm i kontakt – zastane.
- `docs/design-system-dark.md` / `-light.md` opisują stary system Framer – do aktualizacji
  po akceptacji.
