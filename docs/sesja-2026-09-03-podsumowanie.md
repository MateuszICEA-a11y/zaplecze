# Sesja 2026-09-03 – Content Watcher: blok „Źródła” za FAQ

## Punkt wyjścia

Spec z 19.08 (`docs/spec-acf-zrodla-za-faq-grupa-icea.html`) zamawiał u deva WP
dwa pola ACF na bibliografię i render za blokiem FAQ. Do tej pory lista Źródeł
lądowała w wolnym slocie treści (`page_text_N`), a motyw renderował FAQ pod
wszystkimi sekcjami – bibliografia wisiała w środku strony.

## Odbiór wdrożenia deva

- `page_sources_title` i `page_sources_text` są w REST dla `posts` i `pages`
  (109 pól ACF na wpis, dwa ostatnie to Źródła).
- Zapis hasłem aplikacji `redaktor` działa. HTML z `rel="noopener nofollow"`
  wraca bez zmian – WYSIWYG dokłada tylko znaki nowej linii między `<li>`.
- Render sprawdzony na żywym wpisie 20811 (test wpisany i od razu wycofany):
  blok `.k-single-post-sources` z H2 „Źródła” stoi za FAQ, przed boksem autora.
  Pusty nagłówek = motyw podstawia „Źródła”.
- Skan 539 wpisów: żaden nie ma sekcji „Źródła” w slocie treści i żaden nie ma
  jeszcze wypełnionego nowego pola. Migracji nie było.

## Zmiany w kodzie (3 commity na `main`, bez pusha)

Blok Źródeł dostał pseudo-slot **200** – tak jak FAQ ma 101–118. Dzięki temu
diff, decyzja redaktora, bramka hashy i zapis po nazwach pól idą tą samą
ścieżką co sekcje.

Pipeline (Python):
- `config.py`: `SOURCES_SLOT`, `SOURCES_TITLE_FIELD`, `SOURCES_TEXT_FIELD`, `SOURCES_HEADING`.
- `sections.py`: `is_sources`, `is_fixed` (FAQ + Źródła), `fields_for(200)`,
  wiersz `kind: sources` w snapshotcie, blok poza renumeracją.
- `run.py`: `step_sources` pisze zawsze do slotu 200, nie zabiera wolnego slotu
  treści; stara sekcja w slocie zgłaszana jako `legacy_sources_slot`.
  `_section_texts(faq=False)` pomija też Źródła (przypisy i linkowanie
  wewnętrzne nie grzebią w bibliografii).
- `collector/sources/wordpress.py`: blok Źródeł wchodzi do treści (słowa,
  linki, hash) – `BODY_VERSION` bez zmian, bo pusty blok nie zmienia hasha.

Worker (`dashboard/app`):
- `cw-api.js`: `SOURCES_SLOT`, `isKnownSlot(200)`, `fieldsForSlot`,
  `mapAcfSources`; `/api/cw/content` oddaje `sources`; callback akceptuje slot 200.
- `cw-style.js`: slot 200 poza dokumentem redaktorskim (lista, nie proza).
- Edytor: blok Źródeł renderowany za FAQ (`.ed-doc-sources`), etykieta
  „blok za FAQ”, nowy wiersz slotu 200 wchodzi na koniec dokumentu, przyciski
  infografiki i CTA tylko przy sekcjach treści.

Testy: pipeline 105/105, Worker 190/190, `astro build` OK.

## Część 2 – shortcody motywu (po południu)

Dev przysłał wytyczne motywu (dokument Google, kopia `Downloads/Wytyczne.md`).
Test na wpisie 20811 (slot 7, wpisane i wycofane): shortcody w `page_text_N`
są wykonywane. `k_quote_box` daje kartę cytatu z CSS strony, `k_img` zdjęcie
z podpisem, `k_link`/`k_link_word` KARTĘ „Zobacz również” (nie link inline),
`k_expert_box` wizytówkę. Brak shortcode'u CTA.

Wdrożone (commity `fae509d1` pipeline, `6b06b8cd` dashboard; Worker
zdeployowany ręcznie `wrangler deploy` z main):
- cytat eksperta: `[k_quote_box text author_name author_pos author_link
  author_link_nofollow="false" author_img]` – Worker dokłada link do strony
  autora z WP REST (`link`), pipeline bez linku;
- infografika: `[k_img src alt name]` (name = podpis);
- sanityzacja przepuszcza `div.k-table` i `ol.k-ol-h3`; reguły redakcyjne
  każą owijać tabele; przejazd stylu nie rusza shortcodów;
- edytor rysuje podgląd shortcodów w dokumencie, „kopiuj cytat/treść” dają
  shortcode.

Test E2E: `POST /wp-draft` dla zadania 964ee898 (wpis 20811) zaktualizował
szkic 41895 – surowe pole (`acf_format=light`) ma `[k_quote_box …]`, a REST
w formacie standard oddaje już wyrenderowany `blockquote.k-quote-box`
z nazwiskiem Radosława Borawskiego i domyślnym awatarem motywu. Podgląd szkicu
wymaga zalogowania do wp-admin – do obejrzenia przez Mateusza.
Linki wewnętrzne zostają zwykłym `<a>` (k_link to karta, nie anchor).

## Co dalej

- Push `main` = deploy Workera (Workers Builds) i pipeline'u (GitHub Actions
  bierze kod z repo). Do pierwszego realnego przejazdu z pakietem `sources`
  warto zajrzeć do edytora i sprawdzić, czy blok stoi pod FAQ.
- `wp-apply` (podmiana oryginału) wciąż nie ma realnego wdrożenia z bibliografią.
- Obejrzeć szkic 41895 w wp-admin (cytat jako k_quote_box); dev: shortcode CTA/konsultacji.
- Stare cytaty inline (`blockquote.expert`) w już wdrożonych wpisach zostają.
