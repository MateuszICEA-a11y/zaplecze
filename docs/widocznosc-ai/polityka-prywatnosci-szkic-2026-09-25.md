# Polityka prywatności widocznosc.ai – szkic uzupełnienia (2026-09-25)

**Status:** szkic do weryfikacji prawnej. Nie wdrożono w `src/pages/polityka-prywatnosci.astro`.

## Dlaczego

Audyt z 2026-09-25 (`audyt-swiezosci-2026-09-25/E.md`, P1-2) wykazał, że polityka nie wymienia podmiotów, do których narzędzia faktycznie przekazują dane. Obecnie wymienia tylko SMSAPI, a transfer do USA opisuje wyłącznie dla Google Analytics i Facebooka.

Przepływy danych według kodu:

| Narzędzie / funkcja | Plik | Odbiorca | Jakie dane |
| --- | --- | --- | --- |
| Fan-out Check | `functions/api/tools/fanout.ts` | OpenAI (bezpośrednio, Responses API) | fraza wpisana przez użytkownika |
| Brand Check | `functions/api/tools/brand-check.ts` | OpenRouter → OpenAI, Anthropic, Google, Perplexity; wyszukiwarka OpenRouter | nazwa marki, domena, kategoria, rynek |
| URL Check | `functions/_lib/url-check.ts` | OpenRouter → Google | adres URL i publiczna treść strony |
| Wysyłka raportów, formularz kontaktowy | `functions/api/tools/send-report.ts`, `functions/api/contact.ts` | Resend | adres e-mail, treść wiadomości / raportu |
| Hosting, Workers, KV | `wrangler.toml` | Cloudflare | całość ruchu i danych narzędzi |
| Fan-out Explorer (bookmarklet) | `src/lib/fanout-recorder` | brak – dane nie opuszczają chatgpt.com | – |

## Proponowany tekst

**§ 2 – nowy punkt po opisie narzędzi:**

> Do działania narzędzi Brand Check, Fan-out Check i URL Check przekazujemy wpisane przez użytkownika dane (nazwę marki, domenę, kategorię, rynek, frazę lub adres URL oraz publiczną treść wskazanej strony) dostawcom modeli językowych: OpenAI (OpenAI OpCo, LLC, USA) – bezpośrednio, a także za pośrednictwem OpenRouter, Inc. (USA) – OpenAI, Anthropic PBC (USA), Google LLC (USA) i Perplexity AI, Inc. (USA). Nie przekazujemy im adresu e-mail ani numeru telefonu. Raporty i wiadomości e-mail wysyłamy przez Resend (Plus Five Five, Inc., USA), a serwis i narzędzia działają na infrastrukturze Cloudflare, Inc. (USA). Przekazanie danych do USA odbywa się na podstawie standardowych klauzul umownych lub decyzji Komisji Europejskiej w sprawie EU-US Data Privacy Framework.

**§ 3 ust. 3 (podmioty w państwach trzecich):** dopisać tę samą listę podmiotów.

## Do potwierdzenia przez prawnika

- Nazwy prawne podmiotów (zwłaszcza Resend – Plus Five Five, Inc.; OpenAI OpCo, LLC).
- Podstawa transferu dla każdego podmiotu: udział w EU-US DPF albo SCC w umowie powierzenia.
- Czy podmioty są podmiotami przetwarzającymi (umowy powierzenia z OpenRouter, Resend, Cloudflare) czy odrębnymi administratorami.
- Czy dostawcy modeli nie używają danych do trenowania (ustawienia OpenRouter – data policy / zero data retention).
- Brand Check może od 27.09.2026 korzystać zapasowo z modelu `perplexity/sonar` – odbiorca bez zmian (Perplexity).
