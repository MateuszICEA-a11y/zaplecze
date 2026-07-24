# Content Watcher — postęp prac 2026-07-24

## Status

Etap 1 został wdrożony i wypchnięty na `main` w commicie `39493e7`.

Widok produkcyjny:

`https://zaplecze-dashboard.m-wisniewski.workers.dev/widocznosc.ai/content-watcher/`

## Zrealizowane

- Zakładka `Content Watcher` dostępna wyłącznie dla `widocznosc.ai`.
- Build-time katalog 49 artykułów z `portals/widocznosc.ai/src/content/blog`.
- Metadane:
  - tytuł, URL i ścieżka pliku,
  - filar i autor,
  - data publikacji i opcjonalna data aktualizacji,
  - liczba słów, nagłówków oraz linków.
- Połączenie danych po URL-u z:
  - GSC,
  - GA4,
  - Senuto,
  - Matrix / URL Inspection.
- Jawny scoring priorytetu 0–100 wraz ze składowymi i uzasadnieniem.
- Statusy: kandydat, monitoruj, za świeży, poza indeksem.
- Wyszukiwarka, filtry statusu i filtra tematycznego.
- Panel szczegółów artykułu.
- Widok desktopowy i mobilny.
- Nawigacja oraz konfiguracja domeny.

## Stan danych podczas wdrożenia

- 49 artykułów,
- 4 kandydatów do ręcznej oceny,
- 25 artykułów w obserwacji,
- 6 artykułów młodszych niż 60 dni,
- 14 adresów poza indeksem,
- 21 artykułów z sygnałem GSC.

Brakujące dane GA4 lub Senuto są pokazywane jako brak danych i nie są
interpretowane jako zero.

## Weryfikacja

- `pnpm test` — 4/4 testy zakończone powodzeniem.
- `pnpm build` — 21 stron zbudowanych poprawnie.
- Trasa Content Watchera powstaje dla `widocznosc.ai`.
- Trasa nie powstaje dla `grupa-icea.pl`.
- Sprawdzono render desktopowy 1440×1100.
- Sprawdzono render mobilny 390×844.

## Dokument projektowy

Pełny plan, wireframe, scoring, kontrakt webhooka i etapy procesu:

`thoughts/shared/prototypes/content-watcher-napkin-sketch.md`

## Następny etap

Etap 2 — ręczna kolejka reoptymalizacji:

1. Utworzyć Cloudflare D1 dla stanu i historii zadań.
2. Dodać API Content Watchera w `dashboard/app/worker.js`.
3. Dodać tworzenie, pomijanie i anulowanie zadań.
4. Zdefiniować sekrety oraz podpis webhooka n8n.
5. Wysyłać zatwierdzone zadanie serwerowo z Workera.
6. Obsłużyć callbacki statusu i idempotencję.
7. Skonfigurować n8n tak, aby tworzył branch i PR, bez bezpośredniej publikacji
   na `main`.

Automatyczne kolejkowanie i publikacja pozostają wyłączone. Najpierw wdrażamy
ręczne zatwierdzanie oraz pełną obserwowalność procesu.
