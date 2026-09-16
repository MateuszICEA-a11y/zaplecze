# Sesja 2026-09-16 cz. 3 – Fan-out Explorer 1.4.0 → 1.5.2

## Co wdrożono (main, wypchnięte)

- **1.4.0** – odczyt z `/backend-api/conversations/<id>` (ten adres zawiera `search_model_queries`, stary `/conversation/<id>` nie). Zapytania widać też w czatach z historii. Tryb na żywo nie odpytuje w trakcie odpowiedzi.
- **1.5.0** – pole „Twoja marka”: w wynikach / cytowana / wymieniona w odpowiedzi, podświetlenie wierszy i domen.
- **1.5.1** – panel przejmuje odczyt rozmowy wykonany przez samą aplikację, własny odczyt z nagłówkami aplikacji.
- **1.5.2** – po 429 bez automatycznego ponawiania; przy blokadzie tabela z zapytań nagranych ze strumienia.
- Wpis `fanout-explorer-chatgpt.md`: bez historii wersji, nowa sekcja o marce, zapytania z czatu o CRM, wszystkie zrzuty z 1.5.0 (+ nowy `blog-geo-fanout-explorer-marka.webp`).
- Strona narzędzia: FAQ o marce, featureList, opis; naprawiony błąd składni FAQ.

## Diagnoza 429 (konto Business)

`GET /backend-api/conversations/<id>` zwraca 429 `{"detail":"Too many requests"}` bez Retry-After **także samej aplikacji** – czat się nie otwiera; lista czatów i `/me` działają. To limit odczytu rozmów na koncie, nie format zapytań panelu. Prawdopodobna przyczyna: dzień intensywnych odczytów (stare wersje co 15 s, testy).

## Do sprawdzenia 2026-09-17 rano

1. Czy ChatGPT Business sam otwiera czat (bez bookmarkletu).
2. Jeśli tak: zakładka 1.5.2, przeładowanie karty, otwarcie czatu z wyszukiwaniem → „Odczyt: odczyt aplikacji ChatGPT” lub „świeży odczyt”, zapytania w tabeli.
3. Nowy prompt z otwartym panelem na Business – zapytania, wyniki i cytowania po zakończeniu odpowiedzi.
4. Jeśli blokada wraca po normalnym użyciu – rozważyć tryb bez własnych odczytów na Business (tylko odczyt aplikacji + nagranie strumienia).

## Test bookmarkleta na żywej karcie

CSP chatgpt.com blokuje eval/fetch z localhosta, COOP zrywa opener. Działa: `<input type=file>` → `file_upload` z `public/tools/fanout-explorer.min.js` → `<script nonce>` z nonce strony.
