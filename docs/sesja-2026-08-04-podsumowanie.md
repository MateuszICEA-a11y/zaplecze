# Sesja 2026-08-04 – zapis wyników Content Watchera do WordPressa

## Cel

Domknięcie odłożonego kroku z sesji 2026-07-29 cz.3: zapis draftów do
WordPressa. Mateusz dostarczył hasło aplikacji użytkownika `redaktor`
(uprawnienia redaktora) na grupa-icea.pl.

## Decyzja o przepływie

Szkic służy wyłącznie do podglądu; wdrożenie działa na oryginale:

1. **Szkic** – osobny wpis ze statusem `draft`: kopia oryginału (tytuł
   z prefiksem `[Szkic CW]`, surowy `content`, skalarne pola ACF)
   z podmienionymi sekcjami wg decyzji redaktora. Podgląd na szablonie
   strony przez `?p=ID&preview=true` (wymaga zalogowania do wp-admin).
2. **Akcept** – podmiana pól ACF na opublikowanym oryginale + skasowanie
   szkicu (`DELETE ?force=true`).

## Co powstało (commit `a3f04ec`, wdrożone na prod)

- `dashboard/app/cw-wp.js` – nowy moduł Workera:
  - `POST /api/cw/jobs/:id/wp-draft` – utworzenie/odświeżenie szkicu
    (szkic skasowany ręcznie w CMS-ie jest zakładany od nowa),
  - `POST /api/cw/jobs/:id/wp-apply` – wdrożenie z trzema bramkami:
    wszystkie propozycje muszą być ocenione (409 `undecided`, `force` tego
    NIE omija), pisane są wyłącznie sekcje `decision='accepted'`, a hashe
    `text_hash_before` są porównywane z żywym CMS-em (rozjazd = 409
    `content_changed`, wdrożenie po świadomym `force=1`),
  - `contentHash()` – port `content_hash` z collectora (strip HTML +
    normalizacja + sha256[:16]); test na fixture policzonych Pythonem,
  - kopia ACF do szkicu bierze tylko wartości skalarne – obiekty/tablice
    (obrazki, relacje) nie wracają bezstratnie przez REST,
  - cytat eksperta doklejany na końcu sekcji `expert.slot` (ten sam format
    co `sectionCopyText` w edytorze),
  - hasło aplikacji zna wyłącznie Worker (sekrety, nie frontend).
- Migracja `0008-wp-draft.sql` (wykonana na zdalnej D1): `jobs.wp_draft_id`,
  `wp_draft_url`, `applied_at`.
- Edytor (`edytor.astro`): pasek „szkic w WordPressie / otwórz szkic ↗ /
  wdróż na stronie" przy `status='done'`; potwierdzenie przed wdrożeniem,
  osobne potwierdzenie przy rozjeździe hashy; stan „wdrożono {data}".
- Testy: `cw-wp.test.js` (15), cały pakiet 100/100; build Astro czysty.
- Sekrety `WP_APP_USER`/`WP_APP_PASSWORD`: Worker `zaplecze-dashboard`,
  GitHub Actions (collector/pipeline już je czytały z workflow), lokalny
  gitignorowany `.env`.

## Bloker: Apache u seohost ucina `Authorization`

Sonda wykazała, że nagłówek Basic Auth w ogóle nie dociera do PHP
(identyczna odpowiedź `rest_not_logged_in` na poprawne i celowo błędne
hasło; hasła aplikacji są włączone – endpoint autoryzacji rozgłaszany).
Klasyka PHP jako CGI/FastCGI. Naprawa przekazana devowi – dopisek na górze
`.htaccess`:

```apache
<IfModule mod_rewrite.c>
RewriteEngine On
RewriteCond %{HTTP:Authorization} .
RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]
</IfModule>
```

Podejrzany nr 2, gdyby po dopisku dalej było 401: wtyczka AIOS.

## Na następną sesję

1. Sonda `GET /wp-json/wp/v2/users/me/` (musi zwrócić usera `redaktor`).
2. Test zapisywalności pól ACF przez REST – wymaga edytowalnego
   `show_in_rest` w ACF; bez tego `acf` w POST jest ignorowane po cichu.
3. Pełny przejazd E2E: szkic → podgląd → akcept → weryfikacja podmiany
   i skasowania szkicu (wpis testowy, np. „Błąd 403", post_id 5767).
4. Uwaga techniczna: zapis przechodzi przez `sanitizeSectionHtml`
   (whitelista bez `<img>`/`<figure>`) – sekcja z obrazkiem w środku
   straciłaby go przy podmianie; do decyzji, czy poszerzyć whitelistę.
