# widocznosc.ai – podsumowanie sesji 2026-06-01

**Temat:** lead-gen (działający formularz `/kontakt/`) + analityka (GTM + dataLayer).
**Branch:** `main` (deploy z main). Commity: `7b2af6f..` (spec/plan) → `c4060b3` (+ docs GTM).

## 1. Backend leadów `/kontakt/` (z atrapy → działający lejek)
- Spec + plan: `docs/superpowers/specs/2026-06-01-...` i `docs/superpowers/plans/2026-06-01-...`.
- Endpoint `functions/api/contact.ts` (POST) + czysty moduł `functions/_lib/contact.ts` (`validate`, `isHoneypotTriggered`, `typeLabel`, `buildEmails`, `emailShell`). Testy `functions/_lib/contact.test.ts` – **16 testów, zielone**.
- **Resend API**: From `formularz@widocznosc.ai`, To (lead) `lead.icea@gmail.com`, Reply-To = e-mail leada, + autoresponder.
- **Antyspam**: honeypot (pole `website`) + rate-limit 5/IP/dzień (reużycie KV `FANOUT_RL`, prefiks `contact:`, `_lib/rate-limit.ts`).
- **Front**: realny `fetch` + stany loading/success/error + honeypot.
- **Szablon maili brandowany** (table-layout, inline CSS, email-safe): ciemny nagłówek `widocznosc.ai`, badge typu, przycisk „Odpowiedz" (mailto z Reply-To), stopka ICEA. ✅ potwierdzone w skrzynce.

## 2. Konfiguracja Resend / DNS (rozwiązany nietrywialny problem)
- Domena `widocznosc.ai`: rejestrator **seohost** = tylko delegacja NS; **NS-y wskazują na Cloudflare** → cała strefa DNS jest w Cloudflare.
- Resend „Auto configure" dodał SPF (`send`) – Verified, ale **DKIM ciągle Pending**.
- **Przyczyna**: `_domainkey.widocznosc.ai` był **sub-delegowany** rekordami `NS → ns1/ns2.seohost.pl` (relikt). Delegacja przesłaniała rekord `resend._domainkey` TXT leżący w Cloudflare → DKIM się nie rozwiązywał.
- **Naprawa**: usunięto 2 rekordy `NS _domainkey` w Cloudflare → DKIM ożył (potwierdzone przez DoH: pełny klucz 218 zn., delegacja zniknęła). Domena Resend: **Verified**.
- Sekret `RESEND_API_KEY` dodany w Cloudflare Pages (Production).
- Smoke-testy na produkcji: poprawny → 200 + maile; zły e-mail → 400; honeypot → 200 bez wysyłki. Wszystko OK.

## 3. Dane publiczne / kontakt
- Adres biura na froncie poprawiony: `Mińska 25, Warszawa` → **ICEA S.A., ul. Szyperska 14, 61-754 Poznań**.
- Wyeksponowany publiczny mail **`biuro@grupa-icea.pl`**.
- **Usunięto `hello@widocznosc.ai`** (na życzenie usera) z frontu `/kontakt/`, ze schemy ContactPage **oraz** z globalnej schemy Organization (`src/lib/schema.ts`) – pełna spójność, 0 wystąpień w buildzie.

## 4. Analityka
- **GTM `GTM-58684HSJ`** wdrożony globalnie w `Layout.astro` (head script + body noscript).
- **dataLayer**:
  - `generate_lead` (parametry `form_id`, `lead_type`) po udanym wysłaniu formularza – w handlerze sukcesu `kontakt.astro` (bez PII).
  - `page_view` (`page_path`, `page_title`) przy nawigacji SPA (`astro:after-swap` w `Layout.astro`) – initial pageview zostawiony gtm.js (bez dublowania).
- **Instrukcja dla analityka**: `docs/widocznosc-ai/gtm-datalayer-instrukcja-analityk.md` – specyfikacja dataLayer, zmienne, triggery, tagi GA4, konwersja, **Consent Mode v2** (EOG/RODO), **Google Ads** (import z GA4 / tag konwersji / enhanced conversions), testowanie w Preview.

## Stan / otwarte
- ✅ Lead-gen działa e2e na produkcji.
- 🔧 Po stronie analityka: konfiguracja tagów w panelu GTM wg instrukcji + Measurement ID GA4 (`G-…`), ewentualny CMP/Consent Mode, konwersja Google Ads.
- ⏳ Opcjonalnie: DMARC dla `widocznosc.ai` (też wymaga usunięcia sub-delegacji `_dmarc → seohost`); enhanced conversions wymagają dosłania zahashowanego e-maila (zmiana w kodzie + decyzja RODO).
- ⏳ Nadal otwarte (z wcześniejszych sesji): decyzje nt. fraz / newslettera / lead capture w narzędziach; scraper artificialanalysis/datacamp.
