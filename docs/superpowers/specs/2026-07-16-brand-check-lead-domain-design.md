# Domena w mailu leadowym z brand-check – spec

Data: 2026-07-16
Status: zaakceptowany kierunek (jawne pola + wiersze w mailu), do implementacji

## Problem

Mail leadowy z narzędzia Brand Check (bramka SMS OTP) nie zawiera domeny sprawdzanej
marki. Formularz narzędzia zbiera cztery pola (marka, domena, kategoria, rynek), ale
frontend przekazuje do `/api/tools/send-report` wyłącznie `query: brand`. Handlowiec
dostaje leada bez najważniejszego kontekstu – czyją stronę user sprawdzał.

Przykład z produkcji (2026-07-16): lead „Diana Malinowska / JSPS Sp. z o.o." – brak
domeny w mailu, mimo że narzędzie o nią pyta.

url-check problemu nie ma (przekazuje pełny URL jako `query`). Fan-out i ai-bots-check
nie mają pola domeny – poza zakresem.

## Rozwiązanie

Jawne, opcjonalne pola w payloadzie + dedykowane wiersze w mailu leadowym.
Bez nowego kroku dla usera – pole „Domena" już istnieje w formularzu brand-check;
dodatkowo staje się wymagane (de facto każdy je wypełnia, a bez niego sam check
jest słabszy – nie da się policzyć cytowań własnej domeny).

### 1. Frontend – `src/pages/narzedzia/brand-check.astro`

- Pole `domain-input` dostaje atrybut `required` (jak `brand-input`).
- Wywołanie `fetch('/api/tools/send-report', ...)` dokłada do body `domain`,
  `category`, `market` z `pendingBrand` (obok istniejących `tool`, `challengeId`,
  `query`, `result`).
- Dotyczy obu ścieżek: z wynikiem i bez wyniku (liczenie padło po weryfikacji SMS –
  lead i tak leci).

### 2. Backend – `functions/_lib/send-report.ts`

- `ReportPayload` dostaje opcjonalne `domain?`, `category?`, `market?` (stringi).
- Wartości: trim + limit długości 200 znaków (obcięcie, nie odrzucenie – dane
  pomocnicze, bez twardej walidacji).
- Normalizacja domeny: z wpisanej wartości wyciągamy czysty hostname
  (`https://jsps.com.pl/kontakt` → `jsps.com.pl`, zdejmujemy `www.`).
  Logikę `getHost`/`normalizeUrl` z `functions/api/tools/brand-check.ts`
  wydzielamy do małego modułu w `functions/_lib/` i importujemy w obu miejscach
  (jedno źródło prawdy, bez duplikacji).
- `buildLeadNotification` przyjmuje nowe pola i renderuje wiersze
  **Domena / Kategoria / Rynek** bezpośrednio po „Zapytanie" – tylko wypełnione
  (leady z url-check wyglądają jak dotąd).
- Wartości przechodzą przez istniejący `escapeHtml`.
- Temat maila z domeną, gdy jest znana:
  `[widocznosc.ai] Lead (zweryfikowany SMS) z brand-check: Diana Malinowska (jsps.com.pl)`.
- Wersja tekstowa maila (`text`) dostaje te same wiersze co HTML.

### 3. Endpoint – `functions/api/tools/send-report.ts`

- Przekazuje `domain`, `category`, `market` z body do `buildLeadNotification`.
- Bez zmian w walidacji twardej (`validateReportPayload`) – nowe pola nie są
  warunkiem przyjęcia leada.

## Przepływ danych

```
formularz brand-check (brand, domain*, category, market)
  → pendingBrand (JS strony)
  → bramka SMS (bez zmian)
  → POST /api/tools/send-report { tool, challengeId, query, domain, category, market, result? }
  → buildLeadNotification → mail do lead.icea@gmail.com
```

`*` – pole staje się wymagane.

## Obsługa błędów / przypadki brzegowe

- Puste/spacjowe wartości pól → wiersz pominięty w mailu (frontend z `required`
  powinien temu zapobiec dla domeny, ale backend nie ufa frontowi).
- Wartość niebędąca poprawnym URL/hostem → pokazujemy po trim/obcięciu bez
  normalizacji (lepszy surowy kontekst niż brak).
- Za długie wartości → obcięcie do 200 znaków.
- HTML/injection → `escapeHtml` (już w kodzie).
- Stare klienty (otwarta karta sprzed deployu) → pola opcjonalne w API, lead
  przechodzi bez domeny.

## Testy – `functions/_lib/send-report.test.ts`

- Wiersze Domena/Kategoria/Rynek obecne, gdy pola podane (HTML + text).
- Wierszy brak, gdy pola puste/nieprzekazane.
- Normalizacja: pełny URL → hostname bez `www.`; wartość nienormalizowalna → surowa.
- Domena w temacie maila; temat bez nawiasu, gdy domeny brak.
- Obcięcie długich wartości; escapowanie HTML.

## Poza zakresem

- Fallback domeny z adresu e-mail leada (odrzucone – pole wymagane załatwia temat).
- Zmiany w fan-out / ai-bots-check / url-check.
- Zmiany w raporcie wysyłanym userowi (`renderToolReport`).
