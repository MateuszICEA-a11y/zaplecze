# Sesja 2026-08-06 – alerty kredytowe dashboardu + lastmod BusManiak + odblokowanie zapisu CW do WP

## Co zrobiono

Trzy wątki, dwa pierwsze zgłoszone jako „działa nie tak, jak powinno":

1. Saldo OpenRouter spadło poniżej progu, ale mail alertowy nie przyszedł.
2. „Ostatnia aktualizacja" na BusManiak.pl stała na 03.2026 mimo późniejszych przejazdów redakcyjnych.
3. Weryfikacja, czy zdjęto bloker uwierzytelniania REST z 04.08 (zapis Content Watchera do WordPressa).

## Wdrożenia

| Commit | Zakres |
|---|---|
| `97b4d83` | naprawa wysyłki alertów kredytowych (User-Agent, body błędu, adnotacja) |
| `4f5f248` | próg `openrouter_min_usd` 20 → 40 $ |
| `46ec4c7` | busmaniak: `enableGitInfo` + szablony na `.Lastmod` |
| `4e46ab3` | busmaniak: `lastmod` wpisany do 441 plików + `pipeline/stamp-lastmod.py` |
| `f1e3f92` | `CLAUDE.md`: reguła uruchamiania stamp-lastmod przed commitem |

Wszystko na `origin/main`. Dashboard zdeployowany ręcznie (wersja `298d2adc`).

---

## Wątek 1: alerty kredytowe nie wychodziły

### Przyczyna

`dashboard/collector/alerts.py` wysyłał POST do Resend **bez nagłówka `User-Agent`**. Cloudflare stojący przed `api.resend.com` odbija domyślne `Python-urllib/3.x` z `403` i `error code: 1010`, zanim żądanie dojdzie do API. Dokładnie ta sama pułapka, którą kod obchodził już przy SerpData – komentarz o niej stał przy jednym wywołaniu, a nie przy drugim.

Błąd nie ujawnił się wcześniej, bo do 04.08 wszystkie przebiegi logowały „progi kredytów OK". Ścieżka wysyłki odpaliła po raz pierwszy 05.08 i od razu padła.

### Weryfikacja przyczyny

Żywy endpoint, ten sam (nieprawidłowy) klucz:

- bez User-Agenta → `HTTP 403: error code: 1010` (Cloudflare)
- z User-Agentem → `HTTP 401: {"name":"validation_error","message":"API key is invalid"}` (Resend)

Czyli klucz i konfiguracja były w porządku od początku.

### Zmiany

- `User-Agent: ICEA-DashboardCollector/1.0` w `_post_json` – obejmuje też webhooki
- treść body błędu HTTP doklejana do komunikatu (`urllib` gubi ją domyślnie, przez co z nocnego crona zostawało samo „403 Forbidden")
- `::error::` + wpis do `GITHUB_STEP_SUMMARY`, gdy alert nie dotarł **żadnym** kanałem; przebieg zostaje „success", bo snapshot ma się zapisać niezależnie

Potwierdzone na produkcji dwukrotnie: `[alerts] Resend: wysłano alert (1) do 2 odbiorców`.

### Próg

`openrouter_min_usd` podniesiony 20 → 40 $. Przy spalaniu rzędu 100 $/dobę próg 20 $ dawał kilka godzin ostrzeżenia.

### Rozjazd apka vs mail

Zgłoszony w trakcie: apka pokazywała 17,88 $, mail −0,11 $. To nie błąd danych – `dashboard/app/src/lib/data.ts` czyta snapshoty **w czasie builda**, więc apka pokazuje stan z ostatniej przebudowy. Deploy jest automatyczny (CF Workers Builds podpięte pod repo, w `.github/workflows/` nie ma workflowu deployującego i łatwo z tego wyciągnąć błędny wniosek). Rozjazd to normalny lag między commitem danych a przebudową.

### Stan salda

| data | remaining |
|---|---|
| 03.08 | 303,05 $ |
| 04.08 | 133,30 $ |
| 05.08 | 17,88 $ |
| 06.08 | **−0,11 $** |

**Otwarte:** konto wyczerpane, doładowanie po stronie Mateusza. Osobno warto ustalić, co spaliło ~340 $ w trzy doby – `project_usage` klucza projektowego to zaledwie 8,56 $, więc zużycie idzie prawie w całości poza nim.

**Otwarte:** `ALERT_WEBHOOK_URL` pusty – Resend jest jedynym kanałem.

---

## Wątek 2: lastmod BusManiak zamrożony na marcu

### Przyczyna

`lastmod` było ręcznym polem frontmattera: 133 pliki miały je wpisane (wszystkie z marca 2026), 308 nie miało go wcale (fallback na `date`). Brak `enableGitInfo` i brak mapowania `[frontmatter]`, więc edycja pliku niczego nie podbijała.

Zasięg szerszy niż widoczna etykieta – ta sama wartość zasila `<lastmod>` w sitemapie oraz `dateModified` w schema.org (`partials/schema/article.html:9`).

### Nieudane pierwsze podejście (i wniosek)

`enableGitInfo = true` + `lastmod = [":git", ...]` lokalnie dało poprawny rozkład (422× sierpień, 15× kwiecień, 2× marzec). **Na produkcji wszystkie 439 stron dostały jedną datę – dzisiejszą.** Cloudflare Pages klonuje repo płytko, więc Hugo widzi jeden commit i przypisuje jego datę każdemu plikowi. Stan gorszy niż wyjściowy: sygnał „cała domena zmieniona dzisiaj", powtarzalny przy każdym buildzie.

### Rozwiązanie docelowe

Daty muszą być w plikach, nie liczone przy buildzie:

- `pipeline/stamp-lastmod.py` – wpisuje `lastmod` = data ostatniego commitu dotykającego plik (`git log -1 --format=%cs`), idempotentny; ostemplowane 441 plików
- kolejność w `[frontmatter]` odwrócona na `["lastmod", ":git", ":fileModTime", ":default"]` – wpisane daty wygrywają niezależnie od głębokości klonu
- szablony przestawione z `.Params.lastmod` na `.Lastmod`

### Weryfikacja

Symulacja warunków CF przed pushem: `git clone --depth=1 --no-local file://$(pwd)` i build z klonu – wynik identyczny jak przy pełnej historii (422/15/2). Sam lokalny build tej klasy błędu nie wykrywa, co pokazało pierwsze podejście.

Na produkcji po deployu, `/modele/renault-master/`:

| powierzchnia | wartość |
|---|---|
| „Ostatnia aktualizacja" | 08.2026 |
| sitemap `<lastmod>` | 2026-08-04 |
| schema `dateModified` (podstrona `/dci/`) | 2026-08-03 |

### Nowe gotche

1. **CF Pages = płytki klon.** `enableGitInfo` daje tam datę builda dla wszystkich stron. Weryfikuj przez `git clone --depth=1`, nie przez lokalny build.
2. **`.Params.lastmod` vs `.Lastmod`.** Przy skonfigurowanym `[frontmatter]` to pierwsze zwraca surowy string i `.Format` wywraca render z `can't evaluate field Format in type string`. Build cicho gubi strony (538 → 405), a `--quiet` ukrywa błędy – po zmianach w szablonach budować bez `--quiet` i porównywać liczbę stron.

### Reguła operacyjna

Po każdym przejeździe redakcyjnym nad `portals/busmaniak.pl/content/`, przed commitem:

```
python3 pipeline/stamp-lastmod.py
```

Zapisane w `CLAUDE.md`, żeby kolejne sesje to widziały.

### Świadomy koszt decyzji

Wybrany wariant (daty z historii gita) oznacza, że sierpniowe commity techniczne – konwersja WebP, embedy YouTube, podmiana obrazków – podbiły daty prawie wszystkiego: 422 z 439 stron ma teraz sierpień. Ryzyko było zgłoszone przed wdrożeniem i zaakceptowane. Jeśli któraś kategoria zmian ma się nie liczyć jako aktualizacja, da się cofnąć wybrane strony do wcześniejszej daty.

---

## Wątek 3: bloker `Authorization` zdjęty – zapis CW do WordPressa

Sprawdzenie stanu blokera opisanego 04.08: Apache u seohost nie przekazywał nagłówka `Authorization` do PHP, przez co hasło aplikacji użytkownika `redaktor` nie działało. Dev dostał do wgrania dopisek do `.htaccess` (`RewriteCond %{HTTP:Authorization}` → `E=HTTP_AUTHORIZATION`).

### Wynik sondy

| Test | Wynik |
|---|---|
| `GET /wp-json/wp/v2/users/me/`, poprawne hasło | 200, `id: 41`, slug `redaktor` |
| To samo, celowo błędne hasło | 401 `rest_not_logged_in` |

Rozróżnienie dobrego i złego hasła jest dowodem, że nagłówek dociera – wcześniej oba przypadki dawały identyczne 401 i to był właśnie objaw. **Poprawka wgrana, bloker zdjęty.** AIOS (podejrzany nr 2 z 04.08) nie przeszkadza.

### Uprawnienia i ACF

- rola `editor`, capabilities: `edit_posts`, `edit_published_posts`, `edit_others_posts`, `edit_pages`, `edit_published_pages`, `publish_posts`, `delete_posts` – komplet pod flow szkic → akcept → skasowanie szkicu
- `GET /wp/v2/posts/5767/?context=edit&acf_format=light` zwraca `acf` z 67 polami (wypełnione `page_title_h2_1..5`, `page_text_1..5`) – `show_in_rest` do odczytu włączone

### Nowa gotcha: apex 301 zjada Basic Auth

`grupa-icea.pl` przekierowuje 301 na `www.grupa-icea.pl`. Przy przekierowaniu na inny host dane logowania wypadają z żądania, więc strzał w apex kończy się fałszywym 401. Worker jest skonfigurowany poprawnie – `CW_DOMAINS = "grupa-icea.pl=https://www.grupa-icea.pl"` (`dashboard/app/wrangler.toml:39`) – ale ręczne sondy trzeba kierować na `www`.

### Otwarte

**Zapisywalność pól ACF przez POST niesprawdzona.** Odczyt tego nie przesądza: przy nieedytowalnym `show_in_rest` WordPress ignoruje `acf` w POST po cichu, bez błędu. Wychodzi to dopiero przy realnym zapisie, a każdy taki test tworzy obiekt na produkcji – dlatego E2E poczeka na wpis wskazany przez Mateusza, zamiast lecieć na losowym (proponowany 5767 „Błąd 403" odrzucony). Przy przejeździe: zatrzymanie po utworzeniu szkicu, podgląd, dopiero potem akcept na oryginale.

---

## Higiena repo

Worktree jest dzielony z sesją Codex CLI – przez cały czas leżały w nim cudze niezacommitowane zmiany (`.gitignore`, `docs/dokumentacja-busmaniak-proces.html`, usunięty `infographic-rag-przewodnik-uni.png`). Każdy push wymagał `stash → pull --rebase → push → stash pop`; cudze zmiany nietknięte, żaden commit ich nie objął.
