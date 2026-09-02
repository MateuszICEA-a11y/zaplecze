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

## Część 2 – eksploracja kierunków z 21st.dev (wieczór)

- Skille 21st zainstalowane (`npx @21st-dev/cli install-skill`); klucz API działa
  przez `TWENTYFIRST_TOKEN` (search, `21st get` 2/dzień na free; `21st generate` płatne).
- Kontekst projektu w `portals/widocznosc.ai/.21st/design.json` (tokeny, ograniczenia,
  decyzje) – `21st search --context auto` z niego korzysta.
- Trzy kierunki zbudowane jako podglądy Astro (`/podglad/kierunek-a|b|c`), pokazane
  Mateuszowi; **wybrany A „Raport w ramce”** (ref. 21st: Hero with Dashboard Mockup,
  Sticky Scroll). B (bento) i C (poster + ticker) usunięte z repo po decyzji.
- Wdrożenie A na stronie głównej: `Hero.astro` (split + `ReportMock frame compact`,
  raport wychodzi poza kontener ≥1280px), `HowItWorks.astro` (sticky panel podmieniany
  IntersectionObserverem, klik w krok też przełącza; mobile bez sticky), `LogosBand`
  z realnymi logotypami w monochromie, `Process.astro` usunięty z home.
- Kolejność home: Hero → Logos → HowItWorks → ProofData → Audits → Industries →
  AuthorsStrip → RecentArticles → FAQ → CTABand.
- Zrzuty: `Downloads/widocznosc-redesign/final-A-dark.jpeg`, `final-A-light.jpeg`,
  `kierunek-A|B|C.jpeg` (archiwum odrzuconych).

## Część 3 – ocena szablonu Pixel Point (21st)

- `21st.dev/@pixelpoint/templates/pixel-point-agency` = otwarte repo MIT
  `pixel-point/pixelpoint-website` (Gatsby 5 + React + Tailwind 3 + Rive). Płatny plan
  21st nie jest potrzebny do pobrania; przejęcie = przepisanie serwisu, nie reskin.
- Styl: czerń/biel + dwa akcenty + abstrakcyjne ilustracje – sprzeczne z briefem
  (jeden kolor, dane zamiast grafik). Do pożyczenia: rytm pasów ciemny/jasny, listy
  numerowane 1-2-3, siatka case studies z logotypami klientów, blok CTA z obrazem.
- Plan 21st: Builder 6 USD/mies. (rocznie), +AI 15 USD, Team 7,50 USD/seat. Decyzja:
  na razie bez planu; ewentualnie miesiąc Buildera w fazie dopieszczania.

## Następne kroki

1. Pokazać Arturowi podgląd https://redesign-dayos.widocznosc-ai.pages.dev (kierunek A).
2. Po akceptacji: merge `redesign/widocznosc-dayos` → main (deploy prod z main).
3. Opcjonalnie: sekcja case studies z logotypami ICEA (potrzebna lista klientów ze zgodą)
   i dodatkowy jasny pas w rytmie Pixel Point.
4. Realne liczby w mocku raportu w hero (dziś przykładowe, podpisane).
