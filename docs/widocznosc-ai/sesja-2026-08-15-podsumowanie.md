# Sesja 2026-08-15 – audyt redakcyjny /chatgpt/, Microsoft Copilot, naprawa news-pipeline'u

## Część 1: strona /pozycjonowanie-ai/chatgpt/ (wypchnięte, 9 commitów po rebase, HEAD `5b83dade`)

### Audyt redakcyjny (zewnętrzna recenzja LLM)
- Zaaplikowane: „wagi treningowe" → dane treningowe + data odcięcia (*knowledge cutoff*), „Dwoista" → „Podwójna architektura", limit 2 s złagodzony („z reguły", TTFB), *chunks* nazwane wprost, „kaloryczny kanał ekspozycji" → wartościowy kanał widoczności, odmiana „Claude'a" (escape apostrofu w literałach TS!), „etap lejka" → „etap ścieżki zakupowej".
- Fałszywe alarmy recenzenta (dostał zrzut tekstowy): „zlepiony wyprysk z Poznaniem" to ostylowana makieta okna ChatGPT; „zlane listy sygnałów" to osobne komponenty.
- Statystyka „o 11 pp częściej" została bez źródła – **do podpięcia przypis** do konkretnego raportu.

### Bing Copilot → Microsoft Copilot (cały serwis)
- `aiModels.ts` (nazwa, GPT-4→rodzina GPT-5), Navbar, Footer, schema.ts, o-nas, narzędzia, pillar, 2 wpisy blogowe.
- Celowo bez zmian: URL `/pozycjonowanie-ai/bing-copilot/`, pole `keyword`, metaTitle „Pozycjonowanie w Bing Copilot (Microsoft Copilot)…" (fraza wyszukiwana).

### UX/copy strony
- Makieta odpowiedzi: „zwykłe leczenie" → „leczenie zachowawcze", naturalne kryteria zawężenia.
- Wyróżnienie linków w treści (podkreślenie w akcencie modelu, `:global()` dla set:html, fallback `--model-accent`→`--accent-blue` poza hero).
- Kalki: „twarde dane"→„konkretne dane", „test ręczny"→„test manualny"; punktory (–) w listach lejka.
- Prompt-box: przycisk Kopiuj (clipboard + „Skopiowano") i „Otwórz w ChatGPT ↗" (`chatgpt.com/?q=`); usunięte wcięcie `<pre>`.
- Tabela SEO vs GEO – trzy iteracje: (1) doszlifowana siatka – odrzucona, (2) lista transformacji ze strzałkami – odrzucona, (3) **zebra à la Semrush** (pasek nagłówka, naprzemienne tło, bez linii) – zaakceptowana.

### Gotche
- `git add src` dwukrotnie zgarnął cudze usunięcie `infographic-rag-przewodnik-uni.png` (worktree współdzielony z Codexem) – wyjęte amendem, przywrócone jako niezacommitowane.
- Alias `chatgpt-reengineering.widocznosc-ai.pages.dev` cache'uje – weryfikować po hashu deployu.

## Część 2: news-pipeline widocznosc.ai (wypchnięte: `da44e0a5`, `83d69eda`, `9603b464`)

### Diagnoza „czemu nie mamy premier Gemini 3.7 Flash / Grok 4.6"
- Serwisy PL (android.com.pl, telepolis, imagazine) piszą wprost z kanałów producentów: blog.google (The Keyword), x.ai/news, Artificial Analysis – bez specjalnego feedu.
- **KRYTYCZNY BUG:** sędzia LLM miał personę „redaktora BusManiak.pl (busy, vany, kampery)" – kopiuj-wklej; 13.08 wybrał Cloudflare zamiast Groka 4.6, 14.08 Mico zamiast Gemini 3.7 Flash.

### Naprawy
- Sędzia: persona widocznosc.ai + reguła pierwszeństwa premier dużych modeli; log top 5 kandydatów.
- `feeds.yaml`: + blog.google Gemini (`/products-and-platforms/products/gemini/rss/`) i AI (`/innovation-and-ai/technology/ai/rss/`); xAI pominięty (sitemap za Cloudflare 403).
- Writer: `model_writer: google/gemini-3.7-flash:online` przez OpenRouter (routing po `/` w nazwie), sędzia zostaje na gpt-5.4.
- Nadrobione wpisy (fakty z ogłoszeń pierwotnych, backdate na dni premier): `google-prezentuje-gemini-3-7-flash.md` (14.08), `xai-wydaje-grok-4-6.md` (13.08); dopisane do `published.json`.

### Przejazd redaktorski (prompt Mateusza)
- `smoother_bridge.py`: drugi prompt przed publikacją – „redaktor językowy + dziennikarz tech" zamiast prostego wygładzania; model `NEWS_REVIEW_MODEL` = gemini-3.7-flash:online; maszyneria protect/diff-guard bez zmian.
- Adaptacje pod automat: zwraca tylko poprawiony tekst; wątpliwe twierdzenia łagodzi językowo bez ruszania liczb.
- **Gotcha diff-guard:** porównuje formy nazw modeli dosłownie – odrzuca i odmianę („Grok 4.6"→„Groka 4.6"), i „prostowanie" („Groka 4.5"→„Grok 4.5"); prompt musi zakazywać obu. Chroni też markery „naszym zdaniem".
- Smoke-testy e2e ×3 na newsie Groka – trzeci przechodzi w całości.

## Do weryfikacji
- Jutro 6:00 UTC: pierwszy przebieg z nowym sędzią, writerem i przejazdem – sprawdzić log top 5 i jakość newsa.
- Przypis do „11 pp" na /chatgpt/.
