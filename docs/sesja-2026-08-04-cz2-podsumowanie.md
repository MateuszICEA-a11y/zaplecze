# Sesja 2026-08-04 cz.2 – BusManiak: domknięcie korekty makaronizmów (paczki 7–8)

## Co zrobiono

Odbiór dwóch ostatnich paczek z zewnętrznego pipeline'u korekty makaronizmów oraz jednorazowa normalizacja jednostek w całym contencie. Proces rozpoczęty 2026-08-03 został zamknięty.

## Wdrożenia

| Commit | Zakres | Pliki |
|---|---|---|
| `f3bccde` | paczka 7 – modele, porównania, serwis, vanlife, wynajem, zabudowy | 65 |
| `5b45a12` | normalizacja `m3`→`m³`, `m2`→`m²` w całym content | 22 |
| `b76f550` | paczka 8 – 104 newsy + 4 powtórki z paczki 7 | 108 |

Wszystko wypchnięte na `origin/main` (hashe po rebase na automaty CI).

**Bilans całego procesu: 423 z 441 wpisów.** Pozostałe 6 plików (3 strony autorów, mapa strony, o nas, polityka prywatności) decyzją Mateusza NIE idą przez pipeline – to strony statyczne, a polityka prywatności to tekst prawny, którego przeredagowanie jest ryzykowne.

## Weryfikacja przed każdą podmianą

Dla każdego pliku porównanie z oryginałem: liczba nagłówków, liczba linków, klucze frontmattera, objętość w granicach ±8%, obecność em-dashy, obecność znacznika `<|eos|>`. Do tego spot-check word-diff na 3–4 plikach z paczki – ocena, czy korekty są wyłącznie językowe i czy nie ruszono liczb, dat ani źródeł. Po podmianie build Hugo.

Paczka 7: 65 z 69 plików przyjętych. Paczka 8: komplet 108, w tym cztery powtórki, które w paczce 7 przyszły uszkodzone.

## Nowe gotche

1. **Urwana generacja na `<|eos|>`** (paczka 7, `porownania/elektryczne-dostawcze/_index`). Pipeline zakończył tekst w połowie zdania dosłownym znacznikiem, plik miał 24% objętości oryginału. Łapie to test objętości; sama niezerowość rozmiaru nie wystarcza jako bramka. Od paczki 8 skrypt weryfikacyjny grepuje `<|eos|>` wprost.

2. **Zagnieżdżony katalog-artefakt.** W repo leży nieśledzony `portals/busmaniak.pl/portals/busmaniak.pl/content/news/`. Po `cd portals/busmaniak.pl` (build Hugo) względny pathspec `portals/busmaniak.pl/content` trafia w ten duplikat zamiast zwrócić błąd – pierwszy commit paczki 7 objął przez to jeden cudzy plik newsa i zero właściwych poprawek. Wykryte przez `git show --stat`, cofnięte `reset --mixed`. Wniosek: przy masowych edytach wracać do roota repo albo używać ścieżek absolutnych, a zawartość commita zawsze weryfikować.

3. **`perl -CSD` podwaja kodowanie UTF-8.** `perl -CSD -pi -e 's/m3/m³/'` zapisuje `6d c3 82 c2 b3` (`m` + `Â³`), bo literał w `-e` jest już bajtami UTF-8, a `-CSD` koduje je ponownie. Poprawnie: `perl -pi -e 's/m3/m\xc2\xb3/g'` bez `-CSD`. Kontrola po przejeździe: `grep -rc $'\xc3\x82'` musi dać zero.

4. **Filtr wykluczeń w skrypcie** porównuj z nazwą w konwencji `__`, nie ze ścieżką po zamianie separatorów – rozjazd spowodował nadpisanie uszkodzonego pliku (przywrócony `git checkout`).

## Stan jednostek w contencie

Po `5b45a12`: 1206 poprawnych `m²`/`m³`, zero `m2`/`m3`, zero podwójnie zakodowanych znaków, zero em-dashy. Normalizacja objęła 131 wystąpień, których pipeline nie ruszył; zamiana tylko po spacji lub nawiasie, więc nagłówki tabel `[m3]` też złapane, a slugi i linki nietknięte.

## Push

Pierwszy push odbity – zdalne miało cztery commity automatów (dzienne newsy busmaniak i widocznosc.ai, snapshot dashboardu, tracking fb-postera). Rebase bez konfliktów: automat tylko dodawał nowe pliki newsów, sesja modyfikowała istniejące. Do rebase'u trafiły na stash trzy niezacommitowane zmiany innej sesji (`.gitignore`, `docs/dokumentacja-busmaniak-proces.html`, usunięty `infographic-rag-przewodnik-uni.png`) – przywrócone po pushu.
