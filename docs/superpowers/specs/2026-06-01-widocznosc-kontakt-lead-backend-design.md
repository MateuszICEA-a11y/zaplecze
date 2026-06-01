# Spec: backend leadów `/kontakt/` + korekta danych publicznych (widocznosc.ai)

**Data:** 2026-06-01
**Portal:** `portals/widocznosc.ai/` (Astro 6.2 + Cloudflare Pages Functions)
**Status:** zaakceptowany design, do implementacji

## Problem

Formularz na `/kontakt/` to atrapa: submit handler robi `preventDefault()` + animację „Wiadomość wysłana", ale **nie wysyła żadnych danych** (brak `fetch`/API). Wszystkie leady przepadają. Wszystkie CTA „Zamów audyt/raport" → `/kontakt/?type=...` prowadzą do martwego lejka.

Dodatkowo dane publiczne biura na froncie są nieprawdziwe (`ul. Mińska 25, Warszawa`) i rozjechane ze schemą (która ma już `Szyperska 14, Poznań`).

## Decyzje (ustalone z userem)

- **Mechanizm dostarczania:** własny endpoint Cloudflare Pages Function → **Resend API** (free 3000/mc). Dane nie przechodzą przez zewnętrzny form-broker.
- **Odbiorca leada (To):** `lead.icea@gmail.com` (na sztywno).
- **Nadawca (From):** `formularz@widocznosc.ai` (dedykowany techniczny). Domena nadawcy = `widocznosc.ai` (DNS pod kontrolą usera, Cloudflare). Weryfikacja Resend na **subdomenie wysyłkowej** (np. `send.widocznosc.ai`) – główna poczta domeny nietknięta.
- **Reply-To:** e-mail osoby zgłaszającej (odpowiedź zespołu trafia wprost do leada).
- **Autoresponder:** TAK – drugi mail do zgłaszającego z potwierdzeniem.
- **Antyspam:** honeypot + rate-limit (KV), bez Turnstile na start.
- **Mail publiczny na froncie:** `biuro@grupa-icea.pl` (do wyeksponowania).

## Architektura

### Nowy endpoint: `functions/api/contact.ts`
- `onRequestPost` – główny handler (cienki: parse → validate → honeypot → rate-limit → wyślij → JSON).
- `onRequestOptions` – CORS preflight (wzorzec jak `functions/api/tools/*`).
- `onRequestGet` – 405 (endpoint tylko POST).
- Helpery `jsonResponse` / `jsonError` jak w istniejących toolach.
- Stałe na górze pliku (łatwa zmiana 1 linii):
  - `LEAD_TO = 'lead.icea@gmail.com'`
  - `FROM = 'formularz@widocznosc.ai'`
  - `FROM_NAME = 'widocznosc.ai'`
- Env: `RESEND_API_KEY` (sekret Cloudflare).

### Wydzielona logika: `functions/_lib/contact.ts` (czyste, testowalne funkcje)
- `type ContactPayload = { name, email, company?, type, message, website? }` (`website` = honeypot).
- `validate(payload): { ok: boolean; errors: string[] }`
  - `name`: niepuste, trim, max ~120 zn.
  - `email`: niepuste + format (prosty regex), max ~254 zn.
  - `type`: musi należeć do whitelisty wartości z selecta formularza (`audyt-ai`, `audyt-content`, `visibility-checker`, `konsultacja`, `wdrozenie`, `inne`).
  - `message`: niepuste, max ~5000 zn.
  - `company`: opcjonalne, max ~160 zn.
- `isHoneypotTriggered(payload): boolean` – `website` niepuste → bot.
- `buildEmails(payload): { internal: ResendEmail; autoresponder: ResendEmail }`
  - **internal**: `to: LEAD_TO`, `from: FROM`, `reply_to: payload.email`, `subject: '[widocznosc.ai] Nowy lead: <label typu> – <name>'`, `html` + `text` ze wszystkimi polami (name, email, company, typ, message + znacznik czasu).
  - **autoresponder**: `to: payload.email`, `from: FROM`, `subject: 'Dziękujemy za kontakt – widocznosc.ai'`, treść: podziękowanie, czas odpowiedzi do 24h roboczych, dane kontaktowe (biuro@grupa-icea.pl, ICEA S.A. Poznań).
- Mapowanie `type` → czytelny label PL (np. `audyt-ai` → „Kompleksowy audyt AI") współdzielone, by temat maila był ludzki.

### Wysyłka Resend
- `POST https://api.resend.com/emails`, nagłówki `Authorization: Bearer ${RESEND_API_KEY}`, `Content-Type: application/json`.
- Najpierw mail **wewnętrzny** (krytyczny). Jeśli się powiedzie → próbujemy autoresponder. Błąd autorespondera **nie** wywraca odpowiedzi do usera (lead już zapisany u nas mailowo) – logujemy, zwracamy success. Błąd maila wewnętrznego → 502 + komunikat „spróbuj ponownie / napisz na biuro@".

### Rate-limit + honeypot
- KV: **reużycie istniejącego bindingu `FANOUT_RL`** z prefiksem klucza `contact:<ip>` (bez tworzenia nowego namespace).
- Limit: **5 zgłoszeń / IP / dzień**, reset o północy (Warsaw) – reużycie `functions/_lib/rate-limit.ts` (`evaluateLimit`, `secondsUntilWarsawMidnight`).
- IP z `request.headers.get('CF-Connecting-IP')`.
- Honeypot: pole `website` (ukryte CSS-em + `tabindex=-1` + `autocomplete=off`). Jeśli wypełnione → zwracamy **200 „sukces"** bez wysyłki (nie zdradzamy botowi mechanizmu).
- Przekroczony limit → 429 + komunikat.

## Front: `src/pages/kontakt.astro`

### Submit handler (podmiana atrapy)
- `e.preventDefault()` → zebranie pól → `fetch('/api/contact', { method:'POST', headers:{'Content-Type':'application/json'}, body })`.
- Stany:
  - **loading**: przycisk `disabled`, tekst „Wysyłanie…".
  - **success** (HTTP ok): istniejący ekran „Wiadomość wysłana" (zostaje bez zmian wizualnych).
  - **error** (HTTP !ok / network): komunikat błędu nad/pod przyciskiem, przycisk wraca do stanu aktywnego, dane w polach zostają (użytkownik może ponowić). Przy 429 osobny komunikat.
- Honeypot: dodać ukryte pole `website` w formularzu (label off-screen, `aria-hidden`, `tabindex=-1`).

### Korekta danych publicznych (sekcja „Biuro ICEA", ~l.105–116)
- Adres: `ul. Mińska 25, 03-808 Warszawa` → **`ICEA S.A.`** / **`ul. Szyperska 14`** / **`61-754 Poznań`**.
- Dodać wyeksponowany mail **`biuro@grupa-icea.pl`** (np. jako osobny kanał kontaktu obok `hello@widocznosc.ai`, klikalny `mailto:`).
- Zachować link „część grupa-icea.pl".

## Konfiguracja (poza repo – kroki usera, ostatni krok)
1. Resend: dodać i zweryfikować domenę/subdomenę wysyłkową `widocznosc.ai` (rekordy DKIM/SPF w DNS Cloudflare). **Nie ruszać** głównych rekordów MX.
2. Cloudflare Pages → Settings → Variables and Secrets: dodać sekret `RESEND_API_KEY`.
3. Komentarz w `wrangler.toml` dokumentujący sekret (jak dla `OPENAI_API_KEY`/`OPENROUTER_API_KEY`).

Kod ma działać natychmiast po wykonaniu tych kroków – żadnych zmian w kodzie nie wymaga.

## Testy
- `functions/_lib/contact.test.ts` (vitest, wzorzec jak `_lib/*.test.ts`):
  - `validate`: poprawny payload, brakujące pola, zły format e-mail, `type` spoza whitelisty, przekroczone limity długości.
  - `isHoneypotTriggered`: puste `website` → false, wypełnione → true.
  - `buildEmails`: poprawny `to`/`from`/`reply_to`/`subject`, label typu w temacie, obecność pól w body, autoresponder na adres leada.
- Handler pozostaje cienki (integracja z KV/Resend nietestowana jednostkowo).

## Podział na paczki (revert-friendly, preferencja usera)
1. **Korekta danych publicznych** na froncie (sekcja C) – samodzielny commit.
2. **Backend + front-flow + testy** (A, B, D) + komentarz w `wrangler.toml` – drugi commit.

## Poza zakresem (YAGNI)
- Cloudflare Turnstile (dodać tylko gdy pojawi się spam).
- Zapis leadów do D1/CRM (na razie tylko e-mail).
- Newsletter / lead capture w narzędziach (osobny, odłożony temat).
