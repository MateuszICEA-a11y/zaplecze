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

## Co dalej

- Push `main` = deploy Workera (Workers Builds) i pipeline'u (GitHub Actions
  bierze kod z repo). Do pierwszego realnego przejazdu z pakietem `sources`
  warto zajrzeć do edytora i sprawdzić, czy blok stoi pod FAQ.
- `wp-apply` (podmiana oryginału) wciąż nie ma realnego wdrożenia z bibliografią.
