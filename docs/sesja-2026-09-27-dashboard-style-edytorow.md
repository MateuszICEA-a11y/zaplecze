# Dashboard zaplecza – style edytorów na Tailwind (start nowej sesji)

Zadanie: przenieść style obu edytorów z `dashboard/web/src/legacy/legacy.css` na Tailwind
(TailAdmin + paleta iCEA, jak reszta dashboardu) i usunąć katalog `src/legacy/`.

## Wynik (26.09.2026, wieczór) – ZROBIONE I WDROŻONE

- Commity `f63b8e8e` (edytor wpisu CW) i `a011894f` (edytor tekstu CWr + usunięcie
  `src/legacy/` i `scripts/build-legacy-css.mjs`), wypchnięte na `main`.
- Produkcja: wersja `bc4bd2cc` (poprzednia `1269c580` do `npx wrangler rollback`),
  sprawdzona w przeglądarce na workers.dev.
- Style: utility Tailwinda w komponentach (nowe klocki w `kit.tsx`: `checkChip`,
  `btnSmallPrimary`, `Waiting`); typografia HTML z WP/modeli – `.doc-prose` i rynienka
  `.doc-gutter` w `src/app/editor-content.css`; `::highlight()` – `src/lib/highlights.ts`.
- Klasy `ed-doc-section`, `ed-sec-head`, `ed-doc-body`, `ed-doc-expert`, `ed-faq-head`,
  `ed-doc-intro`, `ed-doc-faq` zostały jako znaczniki bez stylu (czyta je `snapshot.ts`).
- Test w przeglądarce (jasny/ciemny, 1600 px i 390 px): belka, combobox modeli, oś kroków,
  dokument (diff, edycja z paskiem formatowania, FAQ, CTA, korekta stylu), kolumna boczna,
  podgląd całości; edytor CWr – frazy z podświetleniem, zakładki, szuflada mobilna, wyjście.
  Bez akcji zapisujących. Skrypty testów: `dashboard/web/.scratch/{edytor,writer}-test.mjs`
  (nieśledzone), `npm run screenshots` ma nową stronę `edytor-przebieg` (posts-20811).
- Uwaga techniczna: `sed -i` w Git Bash zamienia CRLF na LF – przy edycji plików CRLF
  (część TSX) używaj Pythona albo narzędzia Edit.

## Stan na koniec 26.09.2026

- Produkcja: wersja `1269c580` (commit `f7644b1c` na `main`). Wdrożenie ręczne:
  `cd dashboard/app && npm run build && npx wrangler deploy` – push niczego nie wdraża.
  Cofnięcie: `npx wrangler rollback <id wersji>` w `dashboard/app`.
- Obie strony edytorów są w całości w React, bez logiki legacy:
  - edytor wpisu Content Watchera – `src/app/[domain]/content-watcher/edytor/`
    (`PostEditor`, `AnalysisPanels`, `PipelinePanel`, `DocPanel`, `DocSection`, `ScorePanel`,
    `EndCards`, `PreviewDialog`), stan i czyste funkcje w `src/lib/cw-editor/`,
  - edytor tekstu projektu Content Writera – `src/app/[domain]/content-writer/projekt/WriterEditor.tsx`
    (pełny ekran nad `ProjectWorkspace.tsx`).
- Część paneli jest już w Tailwind (nagłówek, SERP, konkurencja, ocena, podgląd całości).
  Reszta renderuje **te same klasy co stary front** (`ed-*`, `we-*`, `wr-*`, `prose`,
  `fchip`, `section-head`…) w kontenerach `.legacy` i bierze wygląd z `legacy.css`.

## Co jest w src/legacy/

| plik | linie | rola |
|---|---|---|
| `legacy.css` | 3090 | WYGENEROWANY z `css/*` przez `scripts/build-legacy-css.mjs` (selektory zawężone do `.legacy`) |
| `css/theme.css` | 1696 | stary motyw Astro – z niego potrzebne są głównie `prose`, `fchip`, `section-head`, `data-table` |
| `css/edytor-global.css` + `edytor-scoped.css` | 689 | edytor wpisu (`ed-*`) |
| `css/writer-editor.css` | 522 | edytor tekstu projektu (`we-*`) |
| `css/writer.css` | 434 | przyciski/formularze Content Writera (`wr-*`) |
| `tokens.css` | 82 | mostek zmiennych starego motywu na paletę iCEA (jasny/ciemny) |
| `highlights.ts` | – | reguły `::highlight()` (podświetlenia fraz); parser CSS Next.js ich nie zna, wstrzykuje je `ensureHighlights()` z `LegacyHost.tsx` |

Kontenery `.legacy` / importy: `PostEditor.tsx`, `DocPanel`/`DocSection`/`EndCards`/`PipelinePanel`/
`PreviewDialog` (klasy), `ProjectWorkspace.tsx` i `WriterEditor.tsx`.

## Proponowany plan

1. Inwentaryzacja: które klasy z `legacy.css` są faktycznie używane w TSX (grep po `className`),
   resztę pominąć – `theme.css` to w większości martwy kod starego motywu.
2. Etapami, każdy z testem w przeglądarce i zrzutem jasny/ciemny:
   a. edytor wpisu – belka, karty końcowe, dokument (`ed-*`, rynienka typów bloków przez
      `[data-block]::before`, diff `del/ins`, tagi, panele infografiki/CTA),
   b. typografia treści (`prose`) – dokument, podgląd całości, oba edytory,
   c. edytor tekstu projektu (`we-*`, `wr-*`) – pełny ekran, łuk oceny, chipy fraz, szuflada mobilna,
   d. usunięcie `src/legacy/` (poza `highlights` → np. `src/lib/highlights.ts`), `scripts/build-legacy-css.mjs`
      i wpisu w README.
3. Klocki wspólne już są: `src/components/kit.tsx` (Status, klasy przycisków), `ui.tsx` (Card, SectionHead).

## Jak testować

- `cd dashboard/web && npm run build && npm run preview` → http://127.0.0.1:4410 (`/api/*` idzie
  do **produkcyjnego** Workera – zapisy są prawdziwe).
- Zrzuty: `ONLY=edytor SCREENS=desktop THEMES=jasny,ciemny WAIT=8000 npm run screenshots` albo Playwright MCP.
- Dane: wpis `posts-20811` (grupa-icea.pl, zakończony przebieg z 17.08 – propozycje, korekta stylu,
  cytat eksperta, szkic WP), wpis `posts-36767` (bez przebiegu), projekt Content Writera `id=1`.
- **Nie klikaj „Rozpocznij optymalizację”** – limit 30 dni nie chroni wpisów sprzed ponad miesiąca
  (26.09 test uruchomił prawdziwy przebieg). Przejazd stylu i cytat eksperta nadpisują wyniki – też nie.
- Wolno: szkic w WordPressie, infografika (kie.ai – nowy klucz od 26.09), CTA wstaw/usuń,
  decyzje ✓/✕ z cofnięciem. Wdrożenie na opublikowany wpis (`wp-apply`) – pytać.

## Pułapki

- Push na `main`: tokenem `gh auth token --user MateuszICEA-a11y` (zwykły `git push` prosi o hasło),
  przed pushem fetch + rebase (cron commituje na `main`).
- Pola `contentEditable` w obu edytorach są niekontrolowane – nie zamieniać ich na kontrolowane
  przy przenoszeniu stylów (kursor skakałby przy każdym przerysowaniu).
- `cn()` (`src/lib/cn.ts`) ma tailwind-merge rozszerzony o `text-theme-*`/`text-title-*`.
