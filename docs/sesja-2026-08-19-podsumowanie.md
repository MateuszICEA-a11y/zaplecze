# Sesja 2026-08-19 – Content Watcher: ekspert 3.0.0, CTA, naprawy edytora

Wszystko wdrożone na prod (`zaplecze-dashboard`), testy 188/188.

## Ekspert (cytat)

- Model kroku: **Grok 4.6** (`x-ai/grok-4.6`, temperatura 0.6, timeout 120 s –
  model rozumujący liczy ponad minutę). Nadpisanie per job: `models.expert`;
  celowo nie dziedziczy `models.writer`.
- **Prompt 3.0.0**: persona „Head of SEO i strateg GEO", ŻELAZNA ZASADA (zakaz
  sklejania żargonu branży klienta z SEO – incydent „mnożnik miasto × moc kWp ×
  dotacja"), 2–3 zdania, kąt AI bez doklejania na siłę. Materiał przebiegu +
  `basis` + `skip` zostają.
- **Tryb wskazanej sekcji**: select „Miejsce cytatu" w edytorze (tytuły
  sekcji); model dostaje wyłącznie treść tej sekcji (styleDocument = WP +
  propozycje), slot wiążący, bez pól `slot`/`placement` w odpowiedzi.
- Cytat wchodzi do podglądu całości i eksportu (blok `.ed-doc-expert` był
  gubiony – docSnapshot bierze go teraz razem z treścią sekcji).
- UX: po odrzuceniu cytatu przycisk „wygeneruj nowy cytat" + notka (wcześniej
  „spróbuj ponownie" wyglądało jak obsługa błędu).

## Niezawodność

- **Odwieszanie martwej blokady `running`** (ekspert i styl): invocation
  Workera zabity w trakcie (zerwane połączenie) zostawiał wieczny spinner;
  teraz blokada starsza niż 3 min jest przejmowana (staleCutoff w cw-api,
  staleRunning w UI).
- **Bramka świeżości akceptacji stylu** (409 `stale_style`): akceptacja starej
  korekty nadpisała sekcję tekstem sprzed wstawienia infografiki – grafika
  znikła po cichu (przywrócona ręcznie w D1, wpis posts-20811, media 41893).
  Teraz rozjazd `text_before` vs aktualna treść = odmowa z komunikatem.

## Uzupełnienia i raport przejazdu

- „Proponowane uzupełnienia": przycisk **„wstaw do sekcji"** – osobne
  wywołanie modelu (styl-model bez `:online`) wplata fakt w sekcję; wynik jako
  propozycja w job_style z diffem i ✓/✕. Blokada, gdy sekcja ma nieocenioną
  korektę.
- Odnośniki w raporcie („Fakty do sprawdzenia", uzupełnienia): tytuły sekcji
  zamiast „sekcja 4", klik przewija do sekcji.

## CTA per sekcja

- Przycisk „CTA" obok „infografika": gotowa, ostylowana wstawka (granatowa
  karta, paleta ICEA) bez LLM; wstaw/zdejmij → `job_sections.text_after` →
  podgląd/eksport/zapis WP. Endpoint `POST /api/cw/jobs/:id/cta/:slot`.
- Link przycisku: **`/kontakt/#cw-cta`** (kotwica = znacznik obecności; utm-y
  na linku wewnętrznym ucinałyby sesję GA4). Epizod z mailto (1.1.0) cofnięty
  tego samego dnia; bloki mailto zdejmowalne jako legacy.
- Frontendowa sanityzacja przepuszcza bezpieczny `style` (lustro STYLE_SAFE
  z cw-api) – wcześniej CTA/karty w edytorze i podglądzie były gołym tekstem.

## Źródła vs FAQ – ograniczenie motywu

- Motyw renderuje blok FAQ zawsze pod sekcjami treści; Źródła jako sekcja
  zawsze wylądują przed FAQ. Zmiana kolejności w edytorze/podglądzie cofnięta
  (obiecywała układ niepublikowalny).
- **Spec dla programisty WP**: `docs/spec-acf-zrodla-za-faq-grupa-icea.html` –
  pola `page_sources_title`/`page_sources_text` + render za FAQ, wymogi REST,
  kryteria odbioru. Po wdrożeniu: przełączenie zapisu Źródeł w CW + migracja.

## Podgląd całości – naprawy

- Obrazki nie gubią `src`/`alt` (infografika znikała z podglądu i .doc).
- `style` zachowywany w podglądzie/eksporcie – karty wklejają się do Google
  Docs z wyglądem.
