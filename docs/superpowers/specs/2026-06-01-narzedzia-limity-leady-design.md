# Narzędzia widocznosc.ai – limity per IP, łapanie leadów, zgoda na kontakt

Data: 2026-06-01
Status: zatwierdzony projekt (pre-implementacja)

## Cel i kontekst

W `/narzedzia/` działają 4 narzędzia (Pages Functions + strony Astro):

| Narzędzie | Endpoint | Koszt / użycie | Limit dziś |
|---|---|---|---|
| brand-check | `api/tools/brand-check.ts` | **4 płatne wywołania LLM** (ChatGPT/Claude/Gemini/Perplexity przez OpenRouter) | brak |
| fanout | `api/tools/fanout.ts` | 1 płatne (OpenAI gpt-5.4) | infra jest, `FANOUT_DAILY_LIMIT=0` (wyłączony) |
| url-check | `api/tools/url-check.ts` | 1 płatne (OpenRouter) | brak |
| ai-bots-check | `api/tools/ai-bots-check.ts` | darmowe (fetch robots.txt) | brak |

Dwa cele:
1. **Przywrócić limity użyć per IP** (ochrona kosztów płatnych narzędzi) – reużywając istniejący mechanizm z `_lib/rate-limit.ts` + KV `FANOUT_RL`.
2. **Łapać leady przez narzędzia** – bez gatingu wyniku, z opcjonalną zgodą na kontakt handlowy (RODO).

## Decyzje produktowe (zatwierdzone)

- **Rola narzędzi: Balans.** Wynik zawsze widoczny od razu, bez email-walla. Obok nienachalna ścieżka do kontaktu.
- **Mechanizm leada: oba na raz** – (a) pole „Wyślij raport na e-mail" pod wynikiem + (b) kontekstowe CTA do `/kontakt`.
- **Zgoda: opcjonalny, NIEzaznaczony checkbox.** Raport wysyłany zawsze (usługa zamówiona przez usera); zgoda dotyczy wyłącznie kontaktu handlowego. Zaznaczeni = gorący lead. Niewiązanie usługi ze zgodą (zgodne z RODO – „dobrowolność").
- **Raport: pełny per narzędzie** – bogaty, brandowany HTML powielający wynik, osobny layout dla każdego z 4 narzędzi.
- **Limity dzienne / IP:** brand-check **3**, fanout **5**, url-check **10**, ai-bots-check **∞** (darmowe), endpoint raportu **5**.

### Treść checkboxa zgody (finalna)

> ☐ Chcę porozmawiać z ekspertem ICEA o widoczności mojej marki w AI – zgadzam się na kontakt e-mailem lub telefonicznie. Zgodę mogę wycofać w każdej chwili.

Mikro-nota pod checkboxem (osobno, mniejszym fontem):

> Administratorem danych jest ICEA S.A. Szczegóły w [polityce prywatności](/polityka-prywatnosci/).

## Architektura

Wspólny szkielet zamiast logiki kopiowanej per narzędzie. Reużycie istniejącej infry: `_lib/rate-limit.ts` (`evaluateLimit`, `secondsUntilWarsawMidnight`), KV `FANOUT_RL`, Resend (`api/contact.ts`: stały `FROM = formularz@widocznosc.ai`, `LEAD_TO = lead.icea@gmail.com`, zweryfikowana domena DKIM/SPF), walidacja z `_lib/contact.ts`.

### Backend (Pages Functions)

**`_lib/tool-rate-limit.ts`** – uogólnienie logiki rate-limitu obecnej dziś tylko w `fanout.ts`:
- `enforceToolLimit(kv, tool, ip, limit) → { allowed, remaining, retryAfterSeconds }`
- klucz KV `tool:${tool}:${ip}` (np. `tool:brand-check:1.2.3.4`), licznik z resetem o północy Europe/Warsaw (reużycie `secondsUntilWarsawMidnight`), `limit <= 0` ⇒ brak limitu (przepuszcza).
- Wpinany na początku handlerów: brand-check, fanout (zastępuje obecną inline-logikę), url-check. ai-bots-check bez limitu.

**`functions/api/tools/send-report.ts`** (POST) – jeden endpoint leadowy:
- Body: `{ tool: 'brand-check'|'fanout'|'url-check'|'ai-bots-check', email, consent: boolean, query, result, website (honeypot) }`.
- Kroki: honeypot → walidacja e-maila (reuse `_lib/contact.ts`) → rate-limit `enforceToolLimit(kv, 'send-report', ip, 5)` → walidacja/typowanie `result` per `tool` → render raportu → wysłka 2 maili przez Resend.
- Mail 1 (do usera): pełny raport HTML (per narzędzie). **Zawsze**, niezależnie od `consent`.
- Mail 2 (do `lead.icea@gmail.com`): powiadomienie o leadzie – narzędzie, `query`, e-mail usera, **zgoda TAK/NIE**, snippet wyniku.

**`_lib/reports/<tool>.ts`** – po jednej czystej funkcji `renderReport(result, query) → { subject, html }` na narzędzie (brand-check, fanout, url-check, ai-bots-check). Testowalne jednostkowo. Wspólny brandowany layout (nagłówek/stopka) w `_lib/reports/layout.ts`, sekcja środkowa specyficzna per narzędzie.

### Frontend (Astro)

**Współdzielony komponent** `src/components/tools/ReportLeadForm.astro` (+ towarzyszący skrypt klienta), wstrzykiwany pod wynik w każdym z 4 narzędzi:
- Pole e-mail + przycisk „Wyślij raport na e-mail".
- Opcjonalny, niezaznaczony checkbox zgody (treść j.w.) + mikro-nota z linkiem do polityki.
- Honeypot (ukryte pole `website`, jak w `/kontakt`).
- Kontekstowe CTA (blok pod wynikiem): link do `/kontakt/` ze statyczną treścią per narzędzie (nie zależną dynamicznie od wyniku – to ewentualnie później).
- Po sukcesie: komunikat „Raport wysłany na <email>".
- Posatuje **już policzony wynik** (z odpowiedzi narzędzia trzymanej w stanie strony) → brak ponownego wywołania płatnego API.

## Przepływ danych

1. User uruchamia narzędzie → handler sprawdza `enforceToolLimit` → liczy wynik → zwraca JSON (strona trzyma wynik w stanie).
2. User wpisuje e-mail (opcjonalnie zaznacza zgodę) → klient POST `/api/tools/send-report` z `{ tool, email, consent, query, result }`.
3. Endpoint: honeypot/walidacja/rate-limit → render per-tool → Resend: raport do usera + powiadomienie leadowe do ICEA.

## Obsługa błędów

- **Limit narzędzia osiągnięty:** HTTP 429, JSON `{ error, retryAfterSeconds }`, komunikat PL + ile do resetu (jak dziś w fanout).
- **Limit send-report:** 429 z analogicznym komunikatem.
- **Walidacja (zły e-mail / brak pól / honeypot):** 400 (honeypot „udaje" sukces – jak w contact).
- **Błąd Resend / timeout:** 502/504, komunikat „Nie udało się wysłać raportu, spróbuj ponownie", licznik rate-limit **nie** jest naliczany przy błędzie wysłki.
- **Nieznany `tool` / niespójny `result`:** 400.

## Anty-abuse (endpoint send-report = potencjalny relay mailowy)

- Twardy rate-limit 5/dzień/IP.
- Honeypot + walidacja e-maila.
- Limit rozmiaru payloadu (np. ≤ 32 KB) → 413 powyżej.
- Raport renderowany z **ustrukturyzowanych, zsanityzowanych pól** wyniku – nigdy surowy HTML od klienta (escapowanie wszystkich wartości w szablonie).

## Testy (vitest, konwencja `_lib/*.test.ts`)

- `tool-rate-limit.test.ts` – limit przepuszcza/blokuje, `limit<=0` = bez limitu, reset o północy, izolacja kluczy per `tool`.
- `reports/<tool>.test.ts` – render zwraca subject+html, escapowanie wartości, brak surowego HTML z inputu.
- `send-report` walidacja – honeypot, zły e-mail, nieznany tool, za duży payload.

## Poza zakresem (YAGNI)

- Dynamiczne, zależne od wyniku treści CTA (np. „słaba widoczność → audyt”) – ewentualnie później.
- Newsletter / double opt-in / zapis do CRM – osobny temat.
- Limity globalne (per-konto OpenRouter) – tu tylko per IP.

## Zadania towarzyszące (poza kodem)

- **Polityka prywatności:** zweryfikować, czy `/polityka-prywatnosci/` pokrywa to przetwarzanie (zbieranie e-maila w narzędziach, cel kontaktu handlowego, administrator ICEA S.A., prawo wycofania zgody). Uzupełnić, jeśli brakuje.
- **Env / Cloudflare Pages:** ustawić `FANOUT_DAILY_LIMIT=5`, dodać `BRAND_CHECK_DAILY_LIMIT=3`, `URL_CHECK_DAILY_LIMIT=10`, `TOOL_REPORT_DAILY_LIMIT=5` (wszystkie z sensownymi defaultami w kodzie, env tylko nadpisuje).
