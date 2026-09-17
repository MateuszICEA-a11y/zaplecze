# Sesja 2026-09-17 – Fan-out Explorer 1.5.4–1.5.5, Analiza zapytań AI na GPT-5.6 Luna, newsy

## Wdrożone (main, widocznosc.ai)

| Commit | Zmiana |
|---|---|
| `1b4c0aa0` | Strona Fan-out Explorer na mobile: h3 kart 17px (Theme.css bił styl scoped regułą (0,2,1)), CTA zawija się zamiast wychodzić poza ekran |
| `dd94cca4` | Bookmarklet 1.5.4: komunikat „ChatGPT udostępnił treść zapytań tylko dla X z Y rund” zamiast listy możliwych przyczyn; FAQ i wpis doprecyzowane |
| `afc25566` | FAQ/wpis: zapytania tylko na początku serii wyszukiwań, na Free i Business |
| `e4d6c65e` → `92786799` | Nowe zdjęcie autora – wycofane (kadr zbyt bliski względem reszty zespołu) |
| `cfe4a9f7` → `63c16b69` | Analiza zapytań AI (`/narzedzia/fanout/`): gpt-5.4 → gpt-5.6 (Sol) → **gpt-5.6-luna** |
| `6773d397` | Bookmarklet 1.5.5: układ rozmowy bez wiadomości `tool` (Plus, GPT-5.6) – potwierdzone u kolegi |

## Ustalenia o danych ChatGPT

- **Model z rozumowaniem** (Free i Business): `search_model_queries` tylko w pierwszej rundzie serii wyszukiwań. Kolejne rundy `web.run` mają same wyniki. Surowy strumień SSE (nagrany na Business, `gpt-5-6-thinking`) potwierdza: argumenty `web.run` są puste już w strumieniu, `reasoning_titles` bez zapytań, `inline_cot_expandable_content` to tylko wyniki. Odczyt zapytań kolejnych rund jest niemożliwy.
- **Pełna pula stron** jest w `search_result_groups` odpowiedzi końcowej, `ref_id.turn_index` = numer rundy (0..n). Wiadomość `tool` ma tylko podgląd. Panel przypisuje strony poprawnie.
- **Symulacja „kredyt hipoteczny dla singla”** (Business, rozumowanie): 9 rund, 8 zapytań tylko w rundzie 1 (w tym 5× `site:reddit.com/r/PolskaFinanse`), 271 stron, 7 cytowań. Rundy 2, 6, 8 po domenach wyglądają na `site:` (Reddit, BNP Paribas, Trustpilot), ale treści brak. Przykład we wpisie (zapytania w 3 rundach) pochodzi z szybkiego modelu.
- **Plus / GPT-5.6 Sol**: brak wiadomości `tool`; `search_queries`, `search_model_queries` i `search_result_groups` w samej wiadomości `web.run`; `content_references` puste, cytowania jako linki markdown w odpowiedzi.
- **Google 413** przy zakładce = kod wklejony w pasek adresu (Chrome wycina `javascript:` i wysyła 90 KB do wyszukiwarki).

## Analiza zapytań AI – porównanie modeli (produkcja)

| Model | Czas | Zapytania | Cytowane | Przeszukane domeny |
|---|---|---|---|---|
| gpt-5.4 | 9,5 s* | 3 | 3 | 17* |
| gpt-5.6-sol | 24,5 s | 7 | 3 | 27 |
| gpt-5.6-luna | 18,8 s | 3 | 3 | 15 |

\* inne zapytanie (kredyt hipoteczny). Preview Pages nie ma `OPENAI_API_KEY` – model testowalny tylko na produkcji (ręczny `wrangler pages deploy --branch main` z WSL, potem push).

## newsy (C:\PROJEKTY\newsy)

- Commit `788e92f`, wdrożone (wersja `9b9f70dd`): strona `/widocznosc` – adres wpisu + opcjonalnie narzędzia → podgląd karty (tytuł, obrazek, domena + minuty, zajawka, przyciski „Czytaj na widocznosc.ai” / „Sprawdź narzędzie”) → wysyłka osobnym przyciskiem.
- Deploy: Windowsowy wrangler niezalogowany; WSL domyślnie Node 20 (za stary). Działa: kopia projektu do `/tmp` w WSL, Node 22 z nvm, `npm ci`, `npx wrangler deploy`.

## Otwarte

- Strona narzędzia: zdanie przy instalacji, żeby nie wklejać kodu w pasek adresu (413).
- Wpis: zastrzeżenie pod przykładem kredytu, że przy rozumowaniu tabela wygląda inaczej.
- Karta newsy: obrazek webp – nie wiadomo, czy Google Chat go wyświetli.
- Konto Business: testowe czaty „Poleć agencje GEO”, „Najlepszy kredyt hipoteczny” do usunięcia; blokada 429 odczytu rozmów po testach.
- Nieśledzony szkic `src/content/blog/geo/co-google-przemilcza-o-ai-search.md` wskazuje na `authors/mateusz-wisniewski.webp` (jest tylko `.avif`) – psuje build.
- Klucz kie.ai w `~/.config/content-gen/env.sh` martwy; działa `~/.config/widocznosc-ai/kie.key`.
- Lista przeszukanych stron w API fanout liczy ten sam adres z `?utm_source=openai` i bez podwójnie (niewidoczne na stronie).
