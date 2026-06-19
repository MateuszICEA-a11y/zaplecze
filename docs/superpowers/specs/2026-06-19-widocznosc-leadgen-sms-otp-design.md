# Lead-gen widocznosc.ai: rozszerzenie pól + weryfikacja SMS (OTP)

**Data:** 2026-06-19
**Portal:** `portals/widocznosc.ai/` (Astro + Cloudflare Pages)
**Status:** zaakceptowany design, gotowy do planu implementacji

## Kontekst i problem

Uwaga „z góry": lead składający się wyłącznie z adresu e-mail to lead niskiej jakości.
W czasach mailingu dostawaliśmy odpowiedzi od dobrych brandów, które nie zamieniły się
w nic sensownego (maile, follow-upy – zero odzewu). Jeśli coś dajemy (audyt), możemy
oczekiwać konkretu: imię, nazwisko, e-mail i telefon. Dodatkowo numer telefonu powinien
być realny – inaczej użytkownicy będą wpisywać przypadkowe numery, byle dostać raport.

Stan obecny:

- **Formularz kontaktowy** (`/kontakt/`) zbiera: `name` (jedno pole), `email`, `company`,
  `type`, `message`. Brak telefonu.
- **ReportLeadForm** w narzędziach (`/narzedzia/brand-check`, `/narzedzia/url-check`,
  `fanout`, `ai-bots-check`) zbiera wyłącznie `email` + `consent`. Pojawia się po wyniku
  narzędzia, wysyła raport mailem i powiadomienie leadowe na `lead.icea@gmail.com`.
- Brak jakiejkolwiek integracji SMS.

## Decyzje (ustalone w brainstormingu)

1. **Zakres:** oba formularze rozszerzamy o imię, nazwisko, e-mail, telefon.
2. **Weryfikacja SMS (OTP):** tylko w narzędziach – jako bramka przed wysłaniem audytu.
   Na `/kontakt/` telefon jest wymaganym polem z walidacją formatu, ale BEZ kodu SMS
   (tam użytkownik sam prosi o kontakt, więc poda prawdziwy numer; OTP dodałby tarcia).
3. **Dostawca SMS:** SMSAPI.pl (REST API, nadawca alfanumeryczny po jednorazowej
   rejestracji pola nadawcy).
4. **Stan OTP:** własny OTP w Cloudflare KV. My generujemy kod, SMSAPI tylko wysyła SMS,
   hash kodu + metadane trzymamy w KV (spójnie z istniejącym rate-limitem).
5. **Imię i nazwisko:** dwa osobne pola (`firstName`, `lastName`) na obu formularzach.
   Na `/kontakt/` rozbijamy dotychczasowe jednopolowe `name`.
6. **Telefon na `/kontakt/`:** wymagany.
7. **Parametry OTP:** kod 6 cyfr, TTL 10 min, max 5 prób weryfikacji, cooldown ponownej
   wysyłki 60 s, max 3 SMS / numer / godzinę, globalny dzienny kill-switch kosztowy.

## Architektura

### Pola formularzy

**Narzędzia – `src/components/tools/ReportLeadForm.astro`**
Pola: `firstName`, `lastName`, `email`, `phone` (wszystkie wymagane), `consent`,
`website` (honeypot, bez zmian).

**Kontakt – `src/pages/kontakt.astro`**
Pola: `firstName`, `lastName` (zamiast `name`), `email`, `phone` (wymagany), `company`
(opcjonalny), `type`, `message`, `website` (honeypot). Bez OTP.

**Walidacja telefonu (PL):** akceptujemy `9 cyfr`, lub z prefiksem `+48` / `48`;
normalizujemy do E.164 (`+48XXXXXXXXX`) na potrzeby SMSAPI oraz maila leadowego.
Odrzucamy numery spoza zakresu PL i o nieprawidłowej długości.

### Flow OTP w narzędziach

Trzy stany w komponencie `ReportLeadForm`, trzy endpointy o jasnych granicach:

1. **Dane** – user wypełnia imię/nazwisko/email/telefon/zgodę → przycisk
   „Wyślij kod SMS".
2. `POST /api/sms/send-code` – backend:
   - waliduje payload (imię, nazwisko, email, telefon, zgoda, honeypot),
   - normalizuje telefon do E.164,
   - sprawdza limity (cooldown 60 s, max 3/numer/h, limit per IP, globalny dzienny cap),
   - generuje 6-cyfrowy kod,
   - wysyła SMS przez SMSAPI,
   - zapisuje w KV: `hash(kod)` + numer E.164 + dane leada + licznik prób + `verified:false`,
     TTL 10 min,
   - zwraca `challengeId` (losowy identyfikator wpisu KV; klient nie zna kodu ani hasza).
   UI odsłania pole na kod + link „Wyślij ponownie (60 s)".
3. `POST /api/sms/verify-code {challengeId, code}` – backend:
   - pobiera wpis KV po `challengeId`,
   - sprawdza TTL i licznik prób (>5 → unieważnienie),
   - porównuje `SHA-256(code + OTP_SALT)` z zapisanym haszem,
   - przy sukcesie ustawia `verified:true` (TTL np. 15 min), zwraca `{ok:true}`.
   UI pokazuje „✓ numer potwierdzony" i aktywuje przycisk „Wyślij audyt".
4. `POST /api/tools/send-report {...dane, challengeId}` – rozszerzony:
   - sprawdza, że wpis KV po `challengeId` istnieje, jest `verified:true` i nie wygasł,
   - wysyła raport mailem do użytkownika (jak dziś),
   - wysyła powiadomienie leadowe na `lead.icea@gmail.com` – teraz z imieniem, nazwiskiem,
     telefonem (E.164) i adnotacją „numer zweryfikowany SMS: TAK",
   - unieważnia challenge po użyciu.

**Wynik samego narzędzia pozostaje darmowy i widoczny bez podawania danych** – bramkujemy
wyłącznie wysyłkę raportu mailem.

### Parametry OTP

- kod: 6 cyfr; TTL 10 min; max 5 prób weryfikacji (potem challenge unieważniony)
- ponowna wysyłka: cooldown 60 s; max 3 SMS / numer / godzinę
- kill-switch kosztowy: globalny dzienny limit wysłanych SMS (start: 200/dzień) + limit
  `send-code` per IP (start: 10/dzień). Wartości startowe do strojenia po wdrożeniu;
  ochrona przed toll-fraud / pompowaniem kosztów.
- kod przechowywany wyłącznie jako `SHA-256(kod + OTP_SALT)`, nigdy plaintext
- honeypot `website` zostaje na froncie OTP

### Infrastruktura

- **KV:** nowy binding `OTP_KV` (osobny lifecycle/TTL od `FANOUT_RL`).
- **Sekrety** (Cloudflare env, analogicznie do `RESEND_API_KEY`):
  - `SMSAPI_TOKEN` – token OAuth SMSAPI,
  - `SMSAPI_SENDER` – nazwa nadawcy (wymaga jednorazowej rejestracji pola nadawcy),
  - `OTP_SALT` – sól do hashowania kodów.
  Lokalnie w gitignored `.dev.vars`.
- **Nowe biblioteki** w `functions/_lib/`:
  - `phone.ts` – walidacja i normalizacja PL → E.164 (czyste funkcje),
  - `otp.ts` – generacja / hash / weryfikacja kodu + logika limitów (czyste funkcje),
  - `smsapi.ts` – cienki klient wysyłki SMS (jedyna warstwa IO do SMSAPI).
  Wzorzec „czyste funkcje + cienka warstwa IO" – spójnie z `contact.ts` / `send-report.ts`.

### RODO / zgody / analityka

- **Polityka prywatności** (`src/pages/polityka-prywatnosci.astro`): dodać „numer telefonu"
  do zbieranych danych; cel: kontakt telefoniczny + weryfikacja SMS; wzmianka o SMSAPI
  jako podmiocie przetwarzającym (powierzenie przetwarzania).
- **Treść zgody** przy formularzach – uspójnić; na `/kontakt/` dodać zgodę na kontakt
  telefoniczny.
- **GTM / dataLayer:** `generate_lead` w narzędziach rozszerzyć o `phone_verified: true`;
  w kontakcie dodać `phone_provided: true`.

## Testy (TDD)

Jednostkowe, zgodnie z istniejącym wzorcem `_lib/*`:

- walidacja + normalizacja telefonu PL → E.164 (poprawne, błędne, brzegowe długości,
  prefiksy `+48`/`48`/brak),
- generacja / hashowanie / weryfikacja OTP (zgodność, niezgodność, sól),
- logika limitów: cooldown 60 s, licznik prób (>5 → unieważnienie), max 3/numer/h,
  dzienny cap,
- budowa treści SMS (kod + nadawca),
- walidacja rozszerzonych payloadów obu formularzy (wymagane pola, honeypot).

## Poza zakresem (YAGNI)

- OTP na formularzu kontaktowym.
- Wysyłka pełnego raportu SMS-em (raport zostaje w mailu; SMS służy tylko weryfikacji).
- Integracja z CRM / eksport leadów poza obecny mail na `lead.icea@gmail.com`.
- Gotowe 2FA API SMSAPI (świadomie wybrano własny OTP w KV).

## Typografia

En-dash (–) w treściach. Marka: ICEA, widocznosc.ai.
