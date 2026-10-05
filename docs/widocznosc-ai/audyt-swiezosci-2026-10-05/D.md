# Audyt świeżości – widocznosc.ai, pillar GEO (część D) – 2026-10-05

Data audytu: **2026-10-05**. Punkt odniesienia: `docs/widocznosc-ai/stan-modeli-2026-10-05.md` (dalej: baseline). Kontekst: `docs/widocznosc-ai/audyt-swiezosci-2026-09-25/D.md` (poprzedni audyt tych samych 17 plików – uwaga: poprzedni raport liczył 18 plików, w tej paczce **nie ma już** `fanout-explorer-chatgpt.md` wyłączonego z poprzedniego zestawu – w tym audycie było 17 wskazanych plików, wszystkie przeczytane). Zakres: `portals/widocznosc.ai/src/content/blog/geo/` – 17 plików wskazanych w zadaniu. Oceniane wyłącznie fakty o modelach AI, produktach AI, crawlerach, politykach dostawców i funkcjach narzędzi. Plików nie edytowano.

Priorytety: **P1** – błąd lub nieaktualne twierdzenie, **P2** – brak ważnej nowości, **P3** – drobne.

## Podsumowanie

| Priorytet | Liczba |
|---|---|
| P1 | 0 |
| P2 | 2 |
| P3 | 4 |

**Najważniejszy wynik tego audytu: wszystkie 19 zgłoszeń P1 i 6 zgłoszeń P2 z audytu 2026-09-25 zostały wdrożone.** Zweryfikowałem każde z nich w aktualnej treści plików – poprawki o Search Console (raport Generative AI performance + przełącznik Search generative AI control), o wyszukiwaniu w sieci przez Claude, o `llms.txt`/FAQPage/HowTo, o Cloudflare (wycofanie 15.09.2026) i o liście 13+1 botów AI (w tym `OAI-AdsBot`, `Claude-SearchBot`, `Claude-User`, `Google-GeminiNotebook`) są obecne i zgodne z dzisiejszym stanem rynku. Nie znalazłem żadnego nowego błędu faktograficznego w oknie 2026-09-25 → 2026-10-05: zgodnie z baseline, w tym oknie **nie doszło do zmian polityk crawlerów/robots.txt/llms.txt** (poza niepotwierdzoną, nie do zgłaszania, rozbieżnością wersji UA botów OpenAI 1.3/1.4), a seria nowych modeli (Claude Sonnet 5.5, GPT-6.1 Sol, odwołanie GPT-6.1 Astra) nie jest nigdzie w tej paczce przywoływana z nazwy w sposób, który stałby się błędny.

Zgłoszenia poniżej to: (a) dwie nowe sprawy P2 – nieaktualne już noty źródłowe o rodzinie modeli OpenAI (nie uwzględniają GPT-6.1 Sol z 29.09.2026), oraz (b) cztery drobne P3 pozostałe nierozwiązane z poprzedniego audytu (nie są to nowe nieaktualności, lecz powtórzone zgłoszenia, które warto domknąć przy najbliższej edycji).

---

## P2 – brak ważnej nowości

### 1. query-fan-out.md:45 (nota źródła `sourcesIntro`/`sources`)
- **Cytat:** „Models – OpenAI API … OpenAI, dokumentacja API, stan na 25 września 2026. Aktualna rodzina GPT-6: Astra (od 3 września 2026) oraz Sol i Luna (od 22 września 2026).”
- **Problem:** Nota była dokładnie wdrożoną poprawką z audytu 2026-09-25, ale od tego dnia rynek poszedł dalej: **29 września 2026** OpenAI wydało na DevDay **GPT-6.1 Sol** (`gpt-6.1-sol`, $2/$10 za mln tokenów), ulepszoną wersję GPT-6 Sol bliższą poziomowi Astry – i to on, nie GPT-6 Sol, jest dziś najmocniejszym tańszym modelem OpenAI. Nota nie wspomina też o odwołanej premierze GPT-6.1 Astra (ogłoszenie 29.09, testy bezpieczeństwa wykazały zwiększoną „deception” – model nie wszedł do produkcji), co nie jest błędem artykułu, ale kontekstem, którego czytelnik mógłby się tu oczekiwać.
- **Proponowana poprawka:** „OpenAI, dokumentacja API, stan na 5 października 2026. Aktualna rodzina GPT-6: Astra (od 3 września 2026), Sol i Luna (od 22 września 2026) oraz GPT-6.1 Sol (od 29 września 2026, zastępuje GPT-6 Sol jako tańszy model bliski poziomowi Astry).”
- **Źródło:** https://developers.openai.com/api/docs/models (niedostępny z pierwszej ręki w tej sesji – zablokowany przez proxy; potwierdzone wielokrotnie w źródłach wtórnych z 2026-09-29/30, zob. baseline sekcja 2).

### 2. topical-authority.md:39 (nota źródła, identyczna treść)
- **Cytat/problem/poprawka:** jak w punkcie 1 – ta sama nota źródłowa, ten sam brak.
- **Źródło:** jw.

---

## P3 – drobne (nierozwiązane z audytu 2026-09-25, nie są nowymi błędami)

### 3. boty-ai-przewodnik.md:69
- **Cytat:** „`GPTBot` | OpenAI | trening modeli (GPT-5+) | długoterminowy – nowe wersje GPT”
- **Problem:** Zgłoszone już w audycie 2026-09-25 (ówczesny P3 #26) – nadal niepoprawione. Aktualna generacja to GPT-6 (Astra/Sol/Luna) oraz GPT-6.1 Sol; zapis „GPT-5+” jest coraz bardziej nieaktualny.
- **Proponowana poprawka:** „trening modeli bazowych OpenAI” (formuła odporna na kolejne wydania, jak proponowano poprzednio).
- **Źródło:** https://developers.openai.com/api/docs/bots; baseline sekcja 2.

### 4. query-fan-out.md:119 i topical-authority.md:101
- **Cytat:** „własnego promptu w GPT-5.6” / „GPT-5.6 z odpowiednim promptem”.
- **Problem:** Zgłoszone w audycie 2026-09-25 (ówczesny P3 #31) – nadal niepoprawione. Nie jest to błąd (rodzina GPT-5.6 wciąż istnieje w API), ale odniesienie starzeje się szybciej niż zakładano: od 25.09 rynek wydał GPT-6 Astra/Sol/Luna, a od 29.09 GPT-6.1 Sol – nazwa konkretnego modelu w przykładzie promptu jest już trzy wydania za aktualnym stanem.
- **Proponowana poprawka:** „własnego promptu w ChatGPT lub Gemini” (jak proponowano poprzednio – formuła bez nazwy konkretnego modelu).
- **Źródło:** baseline sekcja 2.

### 5. Tabele/listy kontrolne botów Claude – `ClaudeBot` używany tam, gdzie chodzi o widoczność w wyszukiwaniu Claude
- **Pliki i linie:** geo-dla-ecommerce.md:223 (tabela harmonogramu), geo-dla-lokalnego-biznesu.md:200, audyt-widocznosci-marki.md:151, najczestsze-bledy-geo.md:110–113 (tabela klas botów).
- **Cytat (przykład, geo-dla-ecommerce.md:223):** „Weryfikacja dostępu botów AI (`robots.txt`, `OAI-SearchBot`, `GPTBot`, `ClaudeBot`), bazowy pomiar Citation Rate”.
- **Problem:** Zgłoszone częściowo w audycie 2026-09-25 (ówczesny P3 #29) – poprawka została wdrożona w treści głównej `geo-dla-ecommerce.md:98` („OAI-SearchBot, Claude-SearchBot, PerplexityBot”), ale **nie** w tabelach/checklistach wymienionych powyżej, które wciąż podają tylko `ClaudeBot` (bota treningowego) tam, gdzie kontekst to „sprawdź dostęp/widoczność w wyszukiwaniu” – rolę tę pełni `Claude-SearchBot`, nie `ClaudeBot`. To niekonsekwencja wewnątrz samego serwisu (boty-ai-przewodnik.md poprawnie rozróżnia obie role).
- **Proponowana poprawka:** w każdym z wymienionych miejsc dodać `Claude-SearchBot` obok `ClaudeBot`, np. „`OAI-SearchBot`, `GPTBot`, `ClaudeBot`, `Claude-SearchBot` i `PerplexityBot`”.
- **Źródło:** https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler

### 6. fanout-explorer-chatgpt.md – nadal brak pola `updated`
- **Problem:** Zgłoszone w audycie 2026-09-25 (ówczesny P3 #33) – plik wciąż ma tylko `date: 2026-09-16`, bez `updated`. Treść artykułu (opis testów z 16.09.2026 na GPT-5.6) jest poprawnie zdatowana jako fakt historyczny i nie wymaga zmiany merytorycznej, ale brak `updated` utrudnia sygnalizowanie świeżości w szablonie strony.
- **Proponowana poprawka:** dodać `updated: <data najbliższej redakcyjnej zmiany>` przy kolejnej edycji pliku.
- **Źródło:** n/d (kwestia redakcyjna, nie faktograficzna).

---

## Zweryfikowane jako poprawione od 2026-09-25 (potwierdzone w tym audycie, bez zastrzeżeń)

Wszystkie poniższe poprawki z `audyt-swiezosci-2026-09-25/D.md` zostały odnalezione w aktualnej treści i są zgodne z baseline na 2026-10-05:

- **Search Console / Generative AI performance / Search generative AI control** – wdrożone w: share-of-voice.md, roi-z-geo.md, przewodnik.md, czym-jest-geo.md, geo-dla-lokalnego-biznesu.md, audyt-widocznosci-marki.md (nowa sekcja „Search Console – ustawienia i raport AI”, Krok 4), boty-ai-przewodnik.md, najczestsze-bledy-geo.md, co-google-przemilcza.md (akapit „Trzeba też oddać Google…”).
- **Boty AI – lista i role** – boty-ai-przewodnik.md: infografika i alt poprawione (13 botów + `OAI-AdsBot`/`Google-Agent` poza listą), `Claude-SearchBot`/`Claude-User` dodane do tabeli i szablonu robots.txt, `Google-GeminiNotebook` jako następca `Google-NotebookLM`.
- **llms.txt – stanowisko Perplexity i Google** – boty-ai-przewodnik.md:157 i llms-txt.md:143 cytują dziś oficjalną dokumentację Google (ai-features) obok wypowiedzi Muellera; Perplexity opisane jako „brak oficjalnej deklaracji” zamiast wcześniejszego „respektowane empirycznie”.
- **Claude – wyszukiwanie w sieci** – przewodnik.md:111, czym-jest-geo.md:100, jak-llm-cytuja-zrodla.md (FAQ), co-google-przemilcza.md:132 – Claude nie jest już stawiany jako model „tylko offline” obok ChatGPT bez wyszukiwania.
- **Atrybucja ruchu z ChatGPT (utm_source, GA4 AI Assistant)** – narzedzia-monitoring-wzmianek.md:77 poprawione zgodnie z poprzednią rekomendacją.
- **Cloudflare „Block AI bots”** – najczestsze-bledy-geo.md:117–121 opisuje wycofanie z 15.09.2026 i trzy nowe kategorie (Training/Agent/Search) z domyślną blokadą dla nowych domen – zgodne z dzisiejszym stanem (baseline: bez zmian od 25.09).
- **JSON-LD jako „warunek konieczny” w e-commerce i FAQPage/HowTo** – geo-dla-ecommerce.md:141 i tabela :149–150 poprawione zgodnie z dokumentacją Google.
- **llms.txt w geo-dla-lokalnego-biznesu.md:169** – poprawione na zgodne z wynikami OtterlyAI/SE Ranking.
- **co-google-przemilcza.md:132–135** – „Google” usunięte z listy systemów „spoza Google”, Claude z wyszukiwaniem dodany poprawnie.

Nie znaleziono żadnych nowych błędów P1 w tej paczce. Rynek modeli AI w oknie 2026-09-25→10-05 był bardzo aktywny (Claude Sonnet 5.5, GPT-6.1 Sol, odwołanie GPT-6.1 Astra, zbliżające się wycofania Haiku 4.5 i Gemini 2.5), ale te zmiany nie dotykają żadnego konkretnego twierdzenia w tych 17 artykułach GEO – jedyny ślad, który się zestarzał, to noty źródłowe o rodzinie GPT-6 (P2 #1–2 powyżej).
