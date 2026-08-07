# Sesja 2026-08-07 – Content Watcher: rywale, frazy, zapis do WP, ekspert

Pięć commitów na `main`, wszystkie wdrożone przez Workers Builds.
Wpis roboczy przez całą sesję: **20811** („Pozycjonowanie branży fotowoltaicznej").

## 1. Pobieranie treści konkurentów stało w „running" (8d2c474b)

Objaw: „Pobieranie trwa dłużej niż zwykle" po każdym podejściu.

Przyczyna: krok analizy szedł przez `ctx.waitUntil`, a Cloudflare ucina pracę
w tle po ~30 s od zwrócenia odpowiedzi. Wypis faktów modelem rozumującym trwa
dłużej – zmierzone na realnym snapshotcie: **48 s** dla `x-ai/grok-4.5` przy
prompcie 53 tys. znaków. Etap „facts" nigdy się nie zapisywał, a klient
odpytujący co 3 s startował za każdym razem nowy, płatny przejazd modelu
(do 40 na jedno kliknięcie).

Naprawa w `cw-rivals.js`:
- krok wykonywany w obrębie żądania (czekanie na `fetch` nie zużywa CPU),
- `busy_since` w snapshotcie blokuje równoległe kroki,
- osobne limity: 180 s na model, 60 s na odczyt strony przez Jinę.

## 2. Panel „Frazy do pokrycia" pokazywał zero (a85f5d0f)

Edytor brał **3** pierwsze adresy z SERP-a, pipeline **5** (`COMPETITOR_LIMIT`).
Senuto zna frazy podstrony dopiero od czwartego wyniku – sprawdzone bezpośrednio:

| adres | frazy w TOP 20 |
|---|---|
| proformat.pl | 0 |
| delante.pl | 0 |
| seohouse.pl | 0 |
| **sembility.com** (4. wynik) | **9** |
| seo-www.pl | 0 |

Pusta lista szła do briefu jako „brak", więc bramka pokrycia mierzyła jedną
frazę i meldowała 1/1. `COMPETITORS_LIMIT` 3 → 5; testy wiążą się ze stałą,
nie z liczbą w asercji.

## 3. Brief odrzucał frazy za gramatykę (f15fdc86)

Po naprawie limitu brief dostał 9 fraz i odrzucił 7 – z powodów językowych
(„zawiera błąd fleksyjny", „forma niepoprawna składniowo"). Tymczasem matcher
liczy pokrycie po rdzeniach z przyimkami między słowami, więc „darmowych leadów
na fotowoltaikę" zalicza „darmowe leady fotowoltaiką". `rewrite.md` i
`coverage.md` o tym mówiły, `brief.md` nie.

`brief.md` → **1.6.0**: forma frazy przestaje być powodem odrzucenia, powody
zawężone do treści (inna usługa, duplikat, temat obok artykułu), usunięta
furtka „pomiń bez komentarza", która przeczyła regule akapit wyżej.

## 4. Zapis do WordPressa – bloker zdjęty, E2E przeszło

Klik „szkic w WordPressie" wyglądał na bezczynny. Dwie warstwy:

- **UI**: odpowiedź lądowała w panelu błędów u góry strony, daleko od paska
  dokumentu. Teraz komunikat staje obok przycisku, a przycisk mówi
  „zapisuję w WP…" w trakcie.
- **Auth**: WP zwracał 401. Diagnoza „to znowu `.htaccess`" była **błędna** –
  hasło aplikacji zostało po prostu rotowane. Objaw myli, bo nieaktualne hasło
  daje `rest_not_logged_in`, czyli to samo co ucinany nagłówek, i tak samo
  reaguje na celowo błędne hasło.

Nowe hasło (`redaktor`, rola `editor`) wgrane do `.env` i sekretów Workera.
**Zaległe: GitHub Secrets w repo `zaplecze`** – Claude nie ma uprawnień do
`gh secret set`, a `pipeline/content-refresher/wp.py` czyta stamtąd.

E2E szkicu: `POST /wp-draft` → szkic **41688**, 20 wypełnionych pól ACF
(`page_text_1..10` + `page_faq_*`). To domyka pytanie z 4 sierpnia: pola ACF
są zapisywalne przez REST, nic nie jest ignorowane po cichu.
Niesprawdzone zostaje `wp-apply` (podmiana oryginału).

## 5. Cytat eksperta: wygląd i wybór osoby (952b85f6, 52a39750)

**Wygląd** – klasa `blockquote.expert` nie istnieje w motywie `knight-theme`,
więc cytat lądował jako goły akapit. Do CSS motywu nie mamy dostępu (rola
editor, brak FTP), więc styl idzie inline: lewa krawędź `#5768ff`, tło
`#f0f1ff`, etykieta „ZDANIEM EKSPERTA", nazwisko wytłuszczone – kolory
z palety serwisu. `sanitizeSectionHtml` przepuszcza `style` na
`blockquote/p/footer/span`, ale tylko bez nawiasów: to wycina `url()`
i `expression()`. Trzy kopie markupu zredukowane do jednej (`cw-expert.js`).

**Wybór osoby** – dotąd model dobierał ją z czterech nazwisk w kodzie.
Teraz `GET /api/cw/authors/:domain` zaciąga autorów z WP (37 kont, po odsianiu
firmowych zostaje 31 osób), a w edytorze stoi select + pole stanowiska.
Autor wpisu jest z listy wycięty; nazwisko z żądania musi stać na liście
(wchodzi do treści wpisu); podpis bierzemy z wyboru, nie z odpowiedzi modelu –
grok potrafił podpisać po swojemu mimo instrukcji.

Czego portal nie daje: **stanowisk** (bio ma 5 kont z 37, strona autora podaje
samo „Autor w serwisie ICEA") i **liczby wpisów per autor** (AIOS blokuje
`?author=` → 403). Stąd `KNOWN_ROLES` w kodzie + pole tekstowe, i lista
alfabetyczna zamiast sortowania po dorobku.

## Stan na koniec

- Testy: 110 JS + 94 Python, build Astro czysty.
- Zaległe: `WP_APP_PASSWORD` w GitHub Secrets; test `wp-apply` na wpisie
  wskazanym przez Mateusza; sprawdzenie briefu 1.6.0 na świeżym przejeździe
  (poprzedni job ad6ede32 szedł jeszcze na 1.4.0).
