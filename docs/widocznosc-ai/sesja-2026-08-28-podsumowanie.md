# Sesja 2026-08-28 – artykuły sponsorowane, „Pozycjonowanie pod LLM”, wpis „Jak działa ChatGPT”, przejazd GPT-5.6

## Cel
Trzy artykuły sponsorowane do publikacji na zewnętrznych serwisach z linkami do widocznosc.ai, plus przygotowanie stron docelowych: rozbudowa `/pozycjonowanie-ai/` pod frazę „pozycjonowanie pod LLM” i nowy wpis, do którego ma prowadzić anchor „jak działa ChatGPT”.

## Zrobione (wszystko na prod poza docs)

### 1. Nowy wpis `/modele-llm/jak-dziala-chatgpt/` (`bea79fa3`, `7cbd3174`)
- Pillar `modele-llm`, L2/INFO, ~2800 słów, 7 FAQ w frontmatter, callout eksperta (Mateusz; autor Tomasz Czechowski).
- Zakres: tokenizacja (polski 2–3 tokeny/słowo), embeddingi, Transformer/attention, sampling i temperatura, pre-training → SFT → RLHF, okno kontekstu/Memory/prompt injection, tryby rozumowania, ChatGPT Search jako RAG (OAI-SearchBot vs GPTBot), narzędzia, halucynacje, wnioski dla marki.
- Hero + infografika z kie.ai (`pipeline/widocznosc-kie-images.py`, dwa nowe specy, 20 kredytów); infografika sprawdzona wizualnie – diakrytyki OK.
- Gotcha: `scripts/convert-blog-png-to-webp.mjs` konwertuje **wszystkie** `blog-*.png` w assets i kasuje PNG – złapał 13 tracked zrzutów Clarity; cofnięte przez `git checkout`. Przed uruchomieniem sprawdzić, czy w katalogu nie ma cudzych PNG.

### 2. `/pozycjonowanie-ai/` – „Pozycjonowanie pod LLM” (`30d2c015`)
- H1: „Pozycjonowanie w AI” → „Pozycjonowanie pod LLM”; title/description/schema name z frazą; lead hero zaczyna od „Pozycjonowanie AI to…”, żeby stara fraza została.
- Nowa sekcja P/01 „Czym jest pozycjonowanie pod LLM?” – definicja, dwie ścieżki modelu, SEO vs LLM (karta), „Na co wpływamy” (lista), link do nowego wpisu i przewodnika GEO. Stare sekcje przenumerowane P/02–P/04. CSS `.llm-*` w scoped style.

### 3. Research GPT-5.6 + przejazd po serwisie (`fac798ec`)
- Fakty zapisane w pamięci (`reference-gpt-5-6-fakty.md`): rodzina Sol/Terra/Luna, preview 26.06, GA 9.07.2026, kontekst 1,05 mln, output 128k, cutoff 16.02.2026, API 5/30, 2,50/15, 1/6 USD, tryby low/max/ultra, Terminal-Bench 2.1 88,8/91,9%.
- 11 wpisów zaktualizowanych z GPT-5.5 na GPT-5.6 (tabele planów, ceny API, kontekst – przy okazji poprawione błędne 400k w przewodniku), `updated: 2026-08-28`. Snapshoty benchmarków z maja 2026 zostawione jako oznaczone historyczne.
- openai.com i chatgpt.com/pricing odbijają 403 dla WebFetch – źródła wtórne (The Decoder, Eden AI, umesh-malik).

### 4. Artykuły sponsorowane (`docs/widocznosc-ai/artykuly-sponsorowane-2026-08-28.{md,html}`)
| Temat | Anchor | Cel |
|---|---|---|
| Jak pozycjonować stronę w ChatGPT? | pozycjonowanie w ChatGPT | /pozycjonowanie-ai/chatgpt/ |
| Pozycjonowanie pod LLM-y – czym jest i dlaczego SEO już nie wystarcza | pozycjonowanie pod LLM | /pozycjonowanie-ai/ |
| Jak działa ChatGPT? Wyjaśnienie bez żargonu | jak działa ChatGPT | /modele-llm/jak-dziala-chatgpt/ |

- HTML (jeden `<a href>` na artykuł, `<hr>` między tekstami) do wklejenia w Google Docs; kopia w `C:\Users\sibil\Downloads\`.
- Wszystkie trzy przeszły korektę redakcyjną Mateusza (wklejone 1:1, z drobnymi poprawkami: `<code>` zamiast backticków, „model Claude”, aktualizacja o1 → GPT-5.6, wyrzucone „Advanced Data Analysis”, usunięte „Podsumowanie” z tekstu 1).
- Decyzja redakcyjna: **ChatGPT nieodmienne** („w ChatGPT”, „z ChatGPT”), LLM odmienne (LLM-y, LLM-ów). Anchory dokładnie jak zadane, mimo odmiany w tekście.
- Zastrzeżenia do korekty (nie wdrożone, zgłoszone): „snippety” sugerują opisy SERP, a ChatGPT Search dzieli na chunki pobrane strony; w tekście 1 punkt 2 i krok 4 mówią o tym niespójnie.

## Stan repo
- Prod (origin/main): `fac798ec` – wpis, strona ofertowa, przejazd GPT-5.6.
- Lokalnie niewypchnięte: commity docs (`3df99b78` … `fcdbbd6d`) + to podsumowanie – tylko `docs/`.
- Worktree ma cudze pre-existing zmiany (`.gitignore`, `dokumentacja-busmaniak-proces.html`, usunięty `infographic-rag-przewodnik-uni.png`) – nietknięte; do pulla używać stash.

## Otwarte
- Publikacja artykułów sponsorowanych u wydawców (po stronie Mateusza).
- Ewentualny `/web-fact-check` nowego wpisu – nie robiony.
- `chatgpt-vs-claude.md` l. 66 i `claude-vs-chatgpt-programowanie.md` – benchmarki GPT-5.5 z maja 2026 czekają na wyniki SWE-bench dla 5.6.
