# widocznosc.ai – handoff dla analityka (2026-06-08)

## 1. Formularze (konwersje) – użyj `generate_lead`, nie natywnego Form Submission

Oba formularze lead-gen wysyłają dane AJAX-em (`fetch` + `preventDefault`), więc
natywny trigger GTM „Form Submission" albo ich nie łapie, albo łapie też nieudane
wysyłki (walidacja, 429, 500). Dlatego w kodzie strony jest dedykowany event
`dataLayer`, który leci **tylko po realnym sukcesie** (`res.ok`):

- Formularz `/kontakt/`: `{ event: 'generate_lead', form_id: 'kontakt', lead_type: <typ> }`
- Formularz „wyślij raport" (narzędzia): `{ event: 'generate_lead', form_id: 'narzedzia', lead_type: 'raport' }`

**Do zrobienia w GTM:**
1. Trigger: **Custom Event**, Event name = `generate_lead`.
2. Pod ten trigger podepnij tag konwersji (GA4 event `generate_lead` i/lub Google Ads
   Conversion). Rozróżnienie źródeł po zmiennej `form_id`.

To jest dokładniejsze niż natywny Form Submission – z definicji liczy tylko poprawne wysyłki.

## 2. Consent Mode v2 – wdrożone po stronie strony

Strona ustawia teraz `gtag('consent','default', …)` z wszystkimi sygnałami `denied`
JESZCZE PRZED załadowaniem GTM, a baner zgody robi `consent update` po wyborze
użytkownika. Sygnały: `analytics_storage` (kategoria Analityka) oraz `ad_storage` +
`ad_user_data` + `ad_personalization` (kategoria Marketing). Ustawione jest też
`ads_data_redaction: true` oraz `personalization_storage: 'denied'`.

**Do zrobienia w GTM:**
- Włącz w kontenerze obsługę zgód (Admin → Container Settings → Enable consent overview).
- Tag GA4 Configuration domyślnie respektuje `analytics_storage`. Dla tagów
  marketingowych/Ads ustaw „Additional consent checks" na `ad_storage` itd.
- GTM ładuje się zawsze (Consent Mode robi gating + cookieless pings) – nie blokujemy kontenera.

## 3. Decyzja o `page_view` (do potwierdzenia przez Ciebie)

Strona to SPA (Astro ClientRouter / View Transitions). W `Layout.astro` jest ręczny
push `page_view` przy `astro:after-swap` (nawigacje wewnątrz SPA; pierwsze wejście
liczy `gtm.js`).

- Jeśli w GA4 **Enhanced Measurement → „Page changes based on browser history events"
  jest WŁĄCZONE** → GA4 sam łapie te nawigacje (History API/pushState) i nasz ręczny
  push **dubluje** → możemy go usunąć.
- Jeśli **WYŁĄCZONE** → nasz push jest jedynym źródłem pageview dla nawigacji SPA →
  zostawiamy i zmieniamy pola na `page_location`/`page_referrer` (zamiast `page_path`).

Daj znać, które ustawienie masz w GA4 – dostosujemy kod w 2 minuty.
