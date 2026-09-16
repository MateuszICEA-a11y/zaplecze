# Sesja 2026-09-16 – Fan-out Explorer (bookmarklet) + wpis na widocznosc.ai

## Wdrożone na produkcję (main, deploy CF Pages)
- `2c89cf06` – bookmarklet 1.0→1.1.0, strona `/narzedzia/fanout-explorer/`, karta 05 na `/narzedzia/`, wpis `/geo/fanout-explorer-chatgpt/` (po polishu autora), `include: web_search_call.action.sources` w narzędziu `/narzedzia/fanout/`.
- `b7c7dcfe` – bookmarklet 1.2.0: wygląd w palecie serwisu, kafelki statystyk, ukrywanie pustych kolumn, zakładka Domeny (7 kategorii heurystycznych, filtr „tylko cytowane”, CSV domen). Wpis i strona opisują nową zakładkę.

## Ustalenia techniczne
- CSP chatgpt.com blokuje `connect-src`/`script-src` spoza własnych domen (także jsDelivr) → tylko zakładka standalone (55 KB) lub wklejenie w konsolę.
- Zapisana rozmowa ma puste `parts` dla `web.run` na każdym modelu (free gpt-5-6, Business gpt-5-6-thinking). Treść zapytań płynie tylko w SSE odpowiedzi (`metadata.search_model_queries.queries` w wiadomości tool, niepersystowana). Bookmarklet hookuje `window.fetch`, nagrywa partie do `localStorage wai-fanout:q:<id>` i dopasowuje do rund. Zakładka musi być kliknięta przed promptem.
- Nowy format nie ma typu (fast/slow) ani okna świeżości w dniach; został operator `site:`.
- Push z Windows: `gh auth switch --user MateuszICEA-a11y` + `git -c credential.helper= -c 'credential.helper=!gh auth git-credential' push origin main` (GCM wiesza push na koncie prywatnym).
- Cudzy nieśledzony plik `co-google-przemilcza-o-ai-search.md` wywraca `astro build` (brak avatara .webp) – na czas buildu odłożyć.

## Dane
- `docs/widocznosc-ai/fanout-explorer-dane-2026-09-16.md` – 6 promptów (kredyt, agencje SEO Poznań, laptop, GEO, Shoper/WooCommerce, CRM) z zapytaniami, rundami, domenami i cytowaniami.

## Do zrobienia w kolejnej sesji
1. Zrzuty w wpisie są z 1.1.0 – podmienić na 1.2.0 (panel + zakładka Domeny), gdy user podeśle zrzut lub gdy uda się wgrać kod do karty ChatGPT bez przeładowań.
2. Narzędzie `/narzedzia/fanout/` chodzi na gpt-5.4 (stary wzorzec bez `site:`). Przełączenie: `FANOUT_MODEL=gpt-5.6` w CF Pages (wymaga `wrangler login` lub panelu) + test na prod; brak klucza OpenAI lokalnie.
3. Zdanie o indeksie Binga w punkcie 2 wpisu – autor decyduje, czy złagodzić.
4. Ewentualne poprawki kategoryzacji domen po uwagach usera (heurystyka po hoście i ścieżce).
5. `pipeline/pillar-expander/expand.py` ma niezacommitowaną zmianę z innej sesji – nie ruszać.
