# widocznosc.ai – konfiguracja GTM (instrukcja dla analityka)

**Kontener GTM:** `GTM-58684HSJ`
**Strona:** https://widocznosc.ai (Astro + Cloudflare Pages, nawigacja SPA przez View Transitions)
**Data:** 2026-06-01

Snippet GTM (head + noscript) jest już wdrożony globalnie na wszystkich stronach. Kod strony **wysyła zdarzenia do `dataLayer`** – Twoim zadaniem jest skonfigurować w GTM zmienne, triggery i tagi GA4, które te zdarzenia skonsumują.

> Uwaga: kod celowo **nie wysyła danych osobowych** (imię, e-mail, treść wiadomości) do dataLayer. Dostępny jest wyłącznie typ zapytania.

---

## 1. Co kod wypycha do dataLayer

### Zdarzenie: `generate_lead`
Wypychane **po udanym wysłaniu formularza** kontaktowego (`/kontakt/`), tj. gdy backend potwierdzi przyjęcie zgłoszenia (HTTP 200). Honeypot/spam i błędy walidacji **nie** generują tego zdarzenia.

```js
dataLayer.push({
  event: 'generate_lead',
  form_id: 'kontakt',
  lead_type: 'audyt-ai' // wartość pola „Cel kontaktu"
});
```

Możliwe wartości `lead_type`:
| wartość | znaczenie |
|---|---|
| `audyt-ai` | Kompleksowy audyt AI |
| `audyt-content` | Audyt treści pod AI |
| `visibility-checker` | Szybki test widoczności (bezpłatny) |
| `konsultacja` | Bezpłatna konsultacja 30 min |
| `wdrozenie` | Audyt + wdrożenie 90 dni |
| `inne` | Inne |

### Zdarzenie: `page_view`
Wypychane przy **nawigacji SPA** między podstronami (Astro `astro:after-swap`). **Pierwsze** wejście na stronę (pełne załadowanie) NIE generuje tego zdarzenia – initial pageview wysyła standardowo tag GA4 Configuration z gtm.js. Dzięki temu nie ma podwójnego liczenia pierwszej odsłony.

```js
dataLayer.push({
  event: 'page_view',
  page_path: '/blog/',          // location.pathname + search
  page_title: 'Blog – widocznosc.ai'
});
```

---

## 2. Wymagania wstępne
- Tag **GA4 Configuration** (lub „Google Tag" z Measurement ID `G-XXXXXXXXXX`) na triggerze *Initialization – All Pages*. Jeśli go nie ma – utwórz; tu wpisz właściwy Measurement ID GA4 widocznosc.ai.
- (Opcjonalnie) Consent Mode v2 / CMP – jeśli jest wdrażane, podepnij tagi pod odpowiednie zgody. Nie jest częścią tej instrukcji.

---

## 3. Zmienne dataLayer (Variables → New → *Data Layer Variable*)
Utwórz cztery zmienne (Data Layer Variable Name = dokładnie jak niżej):

| Nazwa zmiennej GTM | Data Layer Variable Name |
|---|---|
| `DLV - lead_type` | `lead_type` |
| `DLV - form_id` | `form_id` |
| `DLV - page_path` | `page_path` |
| `DLV - page_title` | `page_title` |

---

## 4. Konwersja: lead z formularza

**4.1 Trigger** (Triggers → New → *Custom Event*)
- Nazwa: `CE - generate_lead`
- Event name: `generate_lead`
- This trigger fires on: *All Custom Events*

**4.2 Tag** (Tags → New → *Google Analytics: GA4 Event*)
- Nazwa: `GA4 - generate_lead`
- Configuration/Measurement ID: GA4 widocznosc.ai
- Event Name: `generate_lead`
- Event Parameters:
  - `lead_type` = `{{DLV - lead_type}}`
  - `form_id` = `{{DLV - form_id}}`
- Triggering: `CE - generate_lead`

**4.3 Oznaczenie konwersji**
W GA4 → Admin → *Key events* (Kluczowe zdarzenia) oznacz `generate_lead` jako kluczowe zdarzenie. (Jeśli potrzebny import do Google Ads – po oznaczeniu w GA4 zaimportuj jako konwersję w Google Ads.)

---

## 5. SPA pageview

**5.1 Trigger** (Custom Event)
- Nazwa: `CE - page_view`
- Event name: `page_view`

**5.2 Tag** (GA4 Event)
- Nazwa: `GA4 - page_view (SPA)`
- Measurement ID: GA4 widocznosc.ai
- Event Name: `page_view`
- Event Parameters:
  - `page_location` = `{{Page URL}}` (wbudowana zmienna GTM, aktualna po swapie)
  - `page_path` = `{{DLV - page_path}}`
  - `page_title` = `{{DLV - page_title}}`
- Triggering: `CE - page_view`

> Jeśli GA4 Configuration ma włączone „Enhanced measurement → Page changes based on browser history events", możliwe podwójne liczenie SPA odsłon. W takim wypadku **wyłącz** historię w Enhanced measurement i polegaj na tym tagu, albo odwrotnie – nie twórz tego tagu i zostaw Enhanced measurement. Wybierz jedną metodę.

---

## 6. Testowanie (GTM Preview / Tag Assistant)
1. W GTM kliknij **Preview**, podaj `https://widocznosc.ai`.
2. **Lead:** wejdź na `/kontakt/`, wypełnij i wyślij formularz. W Tag Assistant powinien pojawić się event `generate_lead`, a tag `GA4 - generate_lead` – *Fired*. Sprawdź, że `lead_type` ma wartość wybraną w formularzu.
3. **SPA pageview:** klikaj w menu między podstronami – przy każdym przejściu event `page_view` i tag `GA4 - page_view (SPA)` – *Fired*; pierwsze wejście NIE odpala tego eventu (to poprawne).
4. W GA4 → Realtime / DebugView potwierdź napływ zdarzeń.
5. Po weryfikacji **Submit/Publish** kontenera GTM.

---

## 7. Uwagi
- Honeypot i odrzucenia walidacji nie generują `generate_lead` (zliczasz wyłącznie realne leady).
- `lead_type` pozwala segmentować konwersje wg intencji (np. ile „audyt-ai" vs „konsultacja").
- Brak PII w dataLayer – zgodne z zasadą minimalizacji danych.
