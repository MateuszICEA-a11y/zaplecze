# Dashboard zaplecza – przekazanie po sesji 25–26.09.2026

Punkt startu dla kolejnej sesji. Kontekst: dashboard przeszedł z Astro
(`dashboard/app/src`) na Next.js 16 + TailAdmin w identyfikacji iCEA
(`dashboard/web`). Szczegóły techniczne: `dashboard/web/README.md`.

## Stan

- **Produkcja** (`zaplecze-dashboard.m-wisniewski.workers.dev`) serwuje nowy front od
  26.09 – wersja `b18eb1fc`. Poprzednia (Astro) do cofnięcia:
  `cd dashboard/app && npx wrangler rollback dc702d22-4f83-4d80-a868-d0a35e243e09`.
- **Na `main`, ale jeszcze nie na produkcji:** projekt artykułu w React (commit
  `e73cea99`). Wdrożenie: `cd dashboard/app && npm run build && npx wrangler deploy`.
- Produkcję wdraża się **ręcznie** – push na `main` niczego nie wdraża (Workers Builds nie działa).
- Wszystkie sekcje są w nowym froncie. W menu Content Watcher i Content Writer to jedna
  pozycja **„Treści”** (zakładki „Odświeżanie wpisów” / „Nowe teksty”), Asystent osobno.
  Adresy stron bez zmian – Worker czyta spod nich `catalog.json`, `content-writer/data.json`
  i `competitors.json` (ASSETS).
- W React **nie** jest jeszcze tylko **edytor wpisu Content Watchera**
  (`/<domena>/content-watcher/edytor/?id=posts-<id>`) – działa przez
  `dashboard/web/src/legacy/`: znaczniki `edytor.html` + logika 1:1
  `edytor-script.ts` (~3900 linii) w `mount()`, host `LegacyHost.tsx`, style starego
  frontu zawężone do `.legacy` (`scripts/build-legacy-css.mjs`) z mostkiem tokenów na
  paletę iCEA (`tokens.css`). Pełnoekranowy edytor tekstu projektu (`legacy/writer-editor.ts`)
  też jest jeszcze modułem vanilla, podpiętym w `ProjectWorkspace.tsx`.

## Od czego zaczynamy: edytor wpisu w React

Plan etapami, każdy zamknięty **własnym testem w przeglądarce** na prawdziwym wpisie:

1. ✅ **Panele tylko do odczytu** (zrobione 26.09, `edytor/PostEditor.tsx`,
   `AnalysisPanels.tsx`, `ScorePanel.tsx`, `PreviewDialog.tsx`, wspólny stan
   `src/lib/cw-editor/`) – nagłówek wpisu, ocena treści (`scoreParts`,
   `renderScore`), SERP (`renderSerp`, `loadSerp/pollSerp/runSerp`), treść konkurencji
   (`renderRivals`, `loadRivals/pollRivals/runRivals`), podgląd całości + eksport
   (`openPreview`, kopiuj do Google Docs, pobierz .doc).
2. ✅ **Dokument** (zrobione 26.09, `edytor/DocPanel.tsx`, `DocSection.tsx`,
   `src/lib/cw-editor/doc.ts`, `diff.ts`, `expert.ts`; razem z nakładką przebiegu
   w sekcjach – diff inline, decyzje, korekta stylu, infografiki, CTA, cytat eksperta –
   bo żyje w DOM-ie sekcji i nie da się jej zostawić staremu skryptowi. Nie
   przetestowane: generowanie/wstawienie obrazu – kie.ai zwróciło brak kredytów) – wczytanie treści z WP (`loadCatalog`, `loadContent`), sekcje
   (`docSection`, `renderDoc`), edycja w miejscu (`enableEditing`, `formatToolbar`,
   szkice w `localStorage` – `readDraft/writeDraft`), podświetlanie fraz (CSS Custom
   Highlight API: `highlightKeywords`, `focusKeyword`), statystyki.
3. ✅ **Pipeline i karty końcowe** (zrobione 26.09, `PipelinePanel.tsx`, `EndCards.tsx`,
   `src/lib/cw-editor/jobs.ts`; legacy/edytor-script.ts i znaczniki edytor-*.html usunięte.
   Tego samego dnia `legacy/writer-editor.ts` → `content-writer/projekt/WriterEditor.tsx`.
   Następne: przenieść style edytorów z legacy.css na Tailwind) – uruchomienie (`runPipeline`, modele z OpenRouter
   `setupCombo/loadModels`, ulepszenia gaps/sources/internal_links), postęp
   (`renderProgress`, `renderSteps`, `schedulePoll`), wytyczne (`renderBrief`), diff inline
   (`renderInlineDiff`, `wordDiff`, decyzje per sekcja), ekspert (`renderExpert`,
   `callExpert`), styl i fleksja (`renderStyle`, `callStyle`), infografiki
   (`renderImagePanel`, `imageCall`), CTA (`renderCtaPanel`), WordPress (`wpDraft`,
   `wpApply`, autorzy).

Mapa funkcji: `grep -nE "^  (async )?function " dashboard/web/src/legacy/edytor-script.ts`.
Każdy etap zastępuje odpowiedni fragment znaczników i skryptu; po etapie 3 znikają
`edytor-script.ts`, `edytor.html`, `legacy.css` i `LegacyHost` (a potem przepisujemy
`writer-editor.ts`).

## Jak testować

- Podgląd: `cd dashboard/web && npm run build && npm run preview` → http://127.0.0.1:4410.
  `/api/*` idzie do **produkcyjnego** Workera (hasło `DASH_PASSWORD` z `.env`) –
  zapisy są prawdziwe.
- Zrzuty: `ONLY=edytor SCREENS=desktop THEMES=jasny WAIT=8000 npm run screenshots`
  (playwright-core + systemowy Chrome; nazwy stron w `scripts/screenshots.mjs`).
  Uwaga: przejście między adresami różniącymi się tylko `#hash` nie przeładowuje strony.
- Przeglądarka do klikania: Playwright MCP albo Chrome (claude-in-chrome).
- Dane testowe: wpis `posts-36767` (grupa-icea.pl), projekt Content Writera `id=1`
  („co to jest adres url”, tekst gotowy, szkic w WP).
- **Zgoda usera (26.09):** testuj sam w przeglądarce; wolno wygenerować infografikę
  i zapisać **szkic** w WordPressie. Wdrożenie zmian na opublikowany wpis (`wpApply`)
  nie było objęte zgodą – pytaj.

## Pułapki z tej sesji

- Klasyfikator trybu automatycznego blokuje `wrangler deploy` i commit zmian konfiguracji
  wdrożenia – wykonane dopiero, gdy user wkleił polecenia wprost. Push na `main` przechodzi.
- Polecenia usera zaczynające się od `!` przychodziły jako tekst, nie wykonane – sprawdź
  stan (`git log`) zanim uznasz, że coś się stało.
- `cn()` (`src/lib/cn.ts`) ma tailwind-merge rozszerzony o `text-theme-*`/`text-title-*`
  – bez tego gubił rozmiar tekstu przy łączeniu z kolorem.
- Parser CSS Next.js nie zna `::highlight()` – takie reguły idą do `legacy/highlights.ts`
  i są wstrzykiwane w przeglądarce.
- Next 16 static export: po buildzie `scripts/flatten-segments.mjs` (inaczej 404 prefetchu).
- `data.ts`, `format.ts`, `watcher-scoring.ts`, `writer-gaps.js` to kopie z `dashboard/app`;
  collector i Worker nadal są w `dashboard/app` i `dashboard/collector`.
