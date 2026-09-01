# Sesja 2026-09-01 – BusManiak: korekta 3 wpisów priorytetu 1 + naprawa stamp-lastmod

## Korekta redakcyjna (fleksja, merytoryka) – wpisy z 31.08
Użytkownik poprawił trzy wpisy poza repo (Downloads), wersje wgrane 1:1:
- `serwis/producenci-czesci-do-busow.md` – Delphi→PHINIA (wydzielona z BorgWarner 2023), Metzger = Werner Metzger GmbH (nie Wolk), SKF→Lemförder w metalowo-gumowych, +LuK (Schaeffler), 20 marek, „audytów”, DMC małymi literami.
- `serwis/typowe-usterki-busow.md` – turbina→turbosprężarka, dwumasa→koło dwumasowe, wtryski 2.3 MultiJet elektromagnetyczne Bosch (nie piezo), DPF od 2000 (Peugeot 607) / Euro 5 w LCV, Hi-Matic = ZF 8HP (olej!), rozrząd OM651 od strony skrzyni.
- `serwis/zamienniki-czy-oryginaly.md` – OEM nie jest „trzecią drogą” (jest nią regeneracja fabryczna), przegląd okresowy zamiast technicznego, domknięcie akapitu o OC sprawcy, ceny detaliczne brutto, silnik 3.0 = Iveco F1C.

Commity: `bae9fa03`, `7361db0b`, `03791780` + osobne commity lastmod. Dogrywka `01406eec`: nagłówek „Marki, które dostarczają części na pierwszy montaż i na rynek wtórny”.

## Bug: stamp-lastmod zatruwał daty całego portalu
Skrypt brał `git log -1` bez wyjątków, więc commit z przejazdu stampowania stawał się „ostatnią zmianą” każdej strony. Przejazdy 6.08 i 30.08 nadały 437 stronom datę stampowania zamiast dat treści (3–4.08). Sitemap `<lastmod>` i `dateModified` kłamały od miesiąca.

Naprawa:
- `7e5a3f32` – skrypt pomija commity z „lastmod” w temacie (konwencja: commit stampu zawsze osobno, z „lastmod” w temacie).
- `5ce63208` – przywrócenie faktycznych dat na 441 stronach (daty w sitemapie cofnęły się do 08-03/04 – poprawnie).
- `42dba323` – bezpiecznik: >25 zmian = STOP (exit 2) bez `--force`; `--dry-run` pokazuje listę.

Zasady w CLAUDE.md (sekcja Lastmod). Wszystko wypchnięte na `main`.

## Otwarte
- Working tree ma zmiany innej sesji (`.gitignore`, `docs/dokumentacja-busmaniak-proces.html`, usunięty PNG RAG) – nie ruszane.
- BusManiak: priorytet 2 wzmianek FAST – paczka 2 z 2 do zrobienia.
