# Sesja 2026-08-03 cz.3 – BusManiak: korekta makaronizmów (paczki 1–6)

## Co zrobiono

Wdrożenie treści z zewnętrznego pipeline'u korekty makaronizmów (paczki z Google Drive, pliki `=slug-poprawiony.md`). Każda paczka przechodziła weryfikację przed podmianą:

- diff z oryginałem (word-diff, ocena jakości korekt),
- integralność: liczba nagłówków i linków, brak em-dashy, objętość ±5%, klucze frontmattera,
- zmiany liczb tylko formatowanie (2.0l → 2,0 l; 2900 → 2 900), zero zmian faktów.

## Wynik

- **250 wpisów podmienionych** w `portals/busmaniak.pl/content/` (6 paczek: 44 + 25 + 29 + 30 + 50 + 72).
- **179 plików zostało** w `C:\Users\sibil\Downloads\busmaniak-do-korekty\` – Mateusz puszcza je paczkami przez pipeline.
- Konwencja nazw w folderze do korekty: ścieżka zakodowana przez `__`, np. `modele__fiat-ducato__2-3.md` = `content/modele/fiat-ducato/2-3.md` (w content jest ~30 zdublowanych basename'ów, płaskie nazwy by się gryzły).
- Pominięto 12 cienkich `_index.md` (sekcje bez treści) oraz świadomie zostawiono terminy DIY / camper van / vanlife / off-grid (decyzja Mateusza: są OK).

## Gotche pipeline'u (do pilnowania przy kolejnych paczkach)

1. **Nulle**: część plików przychodzi jako dosłownie `null` (4 bajty) – awaria generacji. W paczce 3 były 2, w paczce 6 były 4. Pominięte pliki zostają w folderze do korekty i wracają w kolejnej paczce (powtórki z paczki 4 przeszły OK). Zawsze sprawdzać `wc -c < plik` przed podmianą.
2. **Em-dashe**: pipeline czasem wstawia — wbrew regule BusManiaka (tylko –). Od paczki 4 hurtowa konwersja `sed 's/—/–/g'` przy zapisie. Po paczce 6 cały content jest wolny od em-dashy (wyczyściły się też odziedziczone w VW Amarok/Caddy).
3. **Duplikaty `(1)`** w paczkach z Drive – zawsze bajt-w-bajt identyczne, ignorować.
4. Bonusy pipeline'u na plus: m3 → m³, cudzysłowy drukarskie, cyrylickie homoglify („на" → „na" w winiety-slowenia), facelift → lifting, infotainment → systemy multimedialne.

## Nulle do powtórki (zostały w folderze)

- `modele__peugeot-boxer__2-0.md`
- `modele__peugeot-boxer__2-2-hdi.md`
- `modele__peugeot-partner__1-6.md`
- `modele__renault-master___index.md`

## Workflow odbioru paczki (powtarzalny)

1. Paczka w `/mnt/c/Users/sibil/Downloads/drive-download-*/`.
2. Weryfikacja: nulle, brak oryginału, nagłówki/linki/em-dash/objętość, spot-check word-diff.
3. Podmiana z `sed 's/—/–/g'`, `cmp` po zapisie.
4. Usunięcie gotowych z `busmaniak-do-korekty` (folder odtwarzalny: wszystkie .md z content minus zmodyfikowane w git minus cienkie `_index`).
