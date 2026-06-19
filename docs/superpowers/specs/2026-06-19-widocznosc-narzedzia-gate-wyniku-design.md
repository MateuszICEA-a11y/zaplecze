# Bramka „dane → wynik" dla narzędzi widocznosc.ai (gate wyniku)

**Data:** 2026-06-19
**Portal:** `portals/widocznosc.ai/` (Astro + Cloudflare Pages)
**Status:** zaakceptowany design, gotowy do planu implementacji
**Powiązane:** rozszerza [lead-gen SMS OTP](2026-06-19-widocznosc-leadgen-sms-otp-design.md) (gałąź `feat/leadgen-sms-otp`, PR #3) – reużywa formularz, OTP i `send-report`.

## Kontekst i zmiana modelu

Uwaga „z góry": skoro dajemy audyt, najpierw bierzemy kontakt. Dlatego dla najmocniejszych
narzędzi **wynik na ekranie odsłaniamy dopiero po zostawieniu danych i weryfikacji numeru SMS**.

To **świadome odwrócenie** wcześniejszej decyzji „value first – wynik instant, capture
opcjonalnie, NIE gated" – ale tylko dla dwóch narzędzi.

- **Gateowane:** `brand-check`, `url-check` – wynik za bramką (dane + OTP → dopiero wynik).
- **Niegateowane (bez zmian):** `ai-bots-check`, `fanout` – wynik od razu, capture opcjonalny pod wynikiem.

## Decyzje (ustalone w brainstormingu)

1. **Liczenie po weryfikacji:** wynik gateowanego narzędzia liczony dopiero po przejściu OTP
   (brand-check = 4×LLM, nie palimy kosztu na porzucających; wynik nigdy nie trafia do
   przeglądarki bez weryfikacji).
2. **Dostarczenie:** wynik odsłaniany na ekranie **oraz** wysyłany kopią na e-mail; ICEA
   dostaje powiadomienie leadowe.
3. **ai-bots-check + fanout:** bez zmian behawioralnych.
4. **Bramka jako tryb istniejącego `ReportLeadForm`** (prop `mode`), nie osobny komponent.
5. **Bramka soft:** endpointy `/api/tools/*` zostają wywoływalne wprost (mają własny
   rate-limit per IP). Bramka to front-endowy mechanizm lead-capture, nie DRM.

## Architektura

### Flow gateowanego narzędzia (brand-check, url-check)

1. User wypełnia parametry narzędzia (brand-check: marka/domena/kategoria/rynek; url-check:
   URL) → klika „Sprawdź".
2. Strona **waliduje i zapamiętuje parametry**, ale **nie liczy**. Odsłania bramkę
   (`lead:gate:show {tool}`), z kontekstowym nagłówkiem (np. „Zostaw dane, by zobaczyć
   wynik dla *<marka>*").
3. Bramka (`ReportLeadForm` w trybie `gate`): imię, nazwisko, e-mail, telefon, zgoda →
   „Wyślij kod SMS" (`/api/sms/send-code`) → kod → `/api/sms/verify-code`.
4. Po udanej weryfikacji bramka emituje `lead:verified {challengeId}` i pokazuje stan
   „weryfikacja OK – generuję wynik…". Nie liczy, nie renderuje, nie woła `send-report`.
5. Strona na `lead:verified`:
   - liczy `/api/tools/<tool>` (loading 10–45 s),
   - renderuje wynik w kontenerze `#results`,
   - woła `/api/tools/send-report {tool, challengeId, query, result}` (kopia mailem +
     powiadomienie leadowe + zużycie challenge).
6. **Obsługa błędu liczenia po weryfikacji:** jeśli `/api/tools/<tool>` zwróci błąd, strona
   i tak woła `send-report {tool, challengeId, query, result:null}` – ICEA dostaje lead
   (nie gubimy go), użytkownikowi pokazujemy komunikat/retry.

### Komponent `ReportLeadForm` – prop `mode`

- `mode="report"` (domyślny – `ai-bots-check`, `fanout`): **bez zmian**. Pojawia się pod
  gotowym wynikiem (po `tool:result`), opcjonalny capture, sam woła `send-report` z
  `{tool, challengeId, query, result}` po weryfikacji.
- `mode="gate"` (`brand-check`, `url-check`): ukryty do `lead:gate:show`; wykonuje wyłącznie
  capture + send-code + verify-code; po weryfikacji emituje `lead:verified {challengeId}`;
  **nie** woła `send-report`, **nie** renderuje wyniku.

Wspólna logika (markup pól, send-code, verify-code, cooldown, walidacja) pozostaje DRY;
różni się tylko wyzwalacz odsłonięcia i akcja po weryfikacji.

### Strony narzędzi

- **`brand-check.astro`, `url-check.astro`:** refaktor skryptu – „Sprawdź" odracza liczenie
  (waliduje params, emituje `lead:gate:show`, pokazuje bramkę). Nasłuch `lead:verified` →
  liczenie → render `#results` → `send-report`. Obsługa błędu jak w pkt 6.
- **`ai-bots-check.astro`, `fanout.astro`:** **nietknięte** (`ReportLeadForm mode="report"`).

### Rafinacja `send-report` (`_lib/send-report.ts` + endpoint)

- Źródłem **tożsamości leada** (imię, nazwisko, e-mail, telefon) jest zweryfikowany
  challenge – `consumeVerifiedChallenge` już zwraca `lead`. `buildLeadNotification` i adres
  odbiorcy maila z wynikiem biorą dane z challenge, nie z ciała żądania (bezpieczniej –
  ciało może być spreparowane).
- `validateReportPayload`: wymaga `tool` + `challengeId`; `result` **opcjonalny**
  (jest → mail z wynikiem; brak → tylko powiadomienie leadowe). Pola `firstName`/`lastName`/
  `email` **nie są już wymagane w ciele** (pochodzą z challenge). `query` opcjonalny.
- Endpoint: po `consumeVerifiedChallenge` (zwraca lead) renderuje i wysyła raport tylko gdy
  `result` obecny; powiadomienie leadowe wysyła zawsze; challenge zużyty raz.
- **Zgodność wstecz:** tryb `report` (ai-bots/fanout) nadal działa – wysyła `result` z
  `tool:result`, lead pochodzi z challenge (te same dane, które bramka zapisała w send-code).

### Analityka

`generate_lead { form_id: 'narzedzia', lead_type: 'raport', phone_verified: true }` odpala
się na ukończeniu bramki (po weryfikacji), spójnie w obu trybach.

## Testy

- `_lib`: aktualizacja `send-report.test.ts` pod nowy kontrakt `validateReportPayload`
  (`result` opcjonalny, wymagane `tool`+`challengeId`, brak wymogu pól tożsamości w ciele).
  Reszta `_lib` (phone/otp/smsapi) bez zmian.
- Front (3 strony gateowane + komponent): weryfikacja przez `npm run build` oraz manualny
  e2e na preview (gateowane: fraza → dane → kod → wynik; niegateowane: wynik od razu).

## Poza zakresem (YAGNI)

- Twarda blokada serwerowa endpointów `/api/tools/*` (wymaga challenge) – bramka jest
  front-endowa; endpointy chronione własnym rate-limitem per IP.
- Gateowanie `ai-bots-check` i `fanout`.
- Zmiana treści/UX niegateowanych narzędzi.

## Typografia

En-dash (–) w treściach. Marka: ICEA, widocznosc.ai.
