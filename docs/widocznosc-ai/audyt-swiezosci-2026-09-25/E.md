# Audyt świeżości widocznosc.ai – część E (blog: ai-w-biznesie, rag, prompty, agenci-ai + kod, dane, narzędzia, polityka prywatności)

Data audytu: 2026-09-25. Punkt odniesienia: `docs/widocznosc-ai/stan-modeli-2026-09-25.md` (dalej: baseline). Ostatnie odświeżenie treści: 2026-09-17.
Ścieżki plików względem `portals/widocznosc.ai/`. Nic nie edytowano – tylko raport.

Priorytety: **P1** – błąd lub nieaktualne twierdzenie, **P2** – brak ważnej nowości, **P3** – drobne.

Podsumowanie: **P1 – 9**, **P2 – 8**, **P3 – 9** (razem 26).

---

## P1 – błędy i nieaktualne twierdzenia

### P1-1. Brand Check odpytuje Perplexity przez Sonar API wyłączane 2026-09-27
- **Plik:linia:** `functions/api/tools/brand-check.ts:109`
- **Cytat:** `{ id: 'perplexity', label: 'Perplexity', model: 'perplexity/sonar-pro', useOpenRouterSearch: false }`
- **Problem:** Sonar API zostaje wyłączone 2026-09-27 i zastąpione przez Agent API (`sonar-pro` → preset `low`). Wywołanie idzie przez OpenRouter. Strona modelu na OpenRouter nie ma na razie komunikatu o wycofaniu, ale jeśli OpenRouter korzysta z API Perplexity, od 27.09 kolumna „Perplexity” w raporcie (widocznym dla użytkownika i wysyłanym e-mailem) może zwracać błąd. Na stronie narzędzia obiecujemy „Analiza 4 modeli: ChatGPT, Claude, Gemini, Perplexity” (`src/pages/narzedzia/brand-check.astro:16`).
- **Proponowana poprawka:** kod – 27–28.09 sprawdzić, czy `perplexity/sonar-pro` na OpenRouter nadal odpowiada; jeśli nie, przejść na Perplexity Agent API (preset `low`) albo na model Perplexity, który OpenRouter wskaże jako następcę. Do czasu naprawy dodać na stronie narzędzia komunikat: „Perplexity zmienia 27 września 2026 interfejs API – w najbliższych dniach wynik dla Perplexity może być chwilowo niedostępny.”
- **Źródło:** https://community.perplexity.ai/t/sonar-is-moving-to-the-agent-api/5802 (baseline §5); https://openrouter.ai/perplexity/sonar-pro (sprawdzone 2026-09-25 – brak komunikatu o wycofaniu)

### P1-2. Polityka prywatności nie wymienia dostawców AI ani poczty, do których narzędzia faktycznie wysyłają dane
- **Plik:linia:** `src/pages/polityka-prywatnosci.astro:115–127` (narzędzia) oraz `:239–293` (odbiorcy danych, państwa trzecie)
- **Cytat:** „W narzędziach dostępnych w serwisie (Brand Check, Fan-out Check, URL Check, AI Bots Check) użytkownik może podać adres e-mail…”; wśród podmiotów w państwach trzecich tylko „Google LLC. … dla narzędzi Google Analytics…” oraz „Facebook Inc.”
- **Problem:** zestawienie z kodem:
  - `functions/api/tools/fanout.ts:21–22` – zapytanie użytkownika trafia do **OpenAI** (Responses API, `gpt-5.6-luna`, z web search);
  - `functions/api/tools/brand-check.ts:100, 106–109` – nazwa marki, domena, kategoria i rynek trafiają przez **OpenRouter** do **OpenAI** (`gpt-5-mini`), **Anthropic** (`claude-haiku-4.5`), **Google** (`gemini-3-flash-preview`) i **Perplexity** (`sonar-pro`), plus wyszukiwarka OpenRouter (`openrouter:web_search`);
  - `functions/_lib/url-check.ts:548, 655` – treść wskazanej strony trafia przez **OpenRouter** do **Google** (`gemini-3.1-flash-lite`);
  - `functions/api/tools/send-report.ts:24`, `functions/api/contact.ts:19` – e-mail z raportem i formularz kontaktowy idą przez **Resend** (USA);
  - hosting i Workers: **Cloudflare** (`wrangler.toml`).

  Polityka nie wymienia żadnego z tych podmiotów (wymienia tylko SMSAPI), a przekazanie do USA opisuje wyłącznie dla Google Analytics i Facebooka. Narzędzie Fan-out Explorer (bookmarklet) deklaruje, że nie wysyła danych poza chatgpt.com – kod `src/lib/fanout-recorder` jest z tym zgodny.
- **Proponowana poprawka (nowy punkt w § 2 po pkt o narzędziach):**
  „Do działania narzędzi Brand Check, Fan-out Check i URL Check przekazujemy wpisane przez użytkownika dane (nazwę marki, domenę, kategorię, rynek, frazę lub adres URL oraz publiczną treść wskazanej strony) dostawcom modeli językowych: OpenAI (OpenAI OpCo, LLC, USA) – bezpośrednio, a także za pośrednictwem OpenRouter, Inc. (USA) – OpenAI, Anthropic PBC (USA), Google LLC (USA) i Perplexity AI, Inc. (USA). Nie przekazujemy im adresu e-mail ani numeru telefonu. Raporty i wiadomości e-mail wysyłamy przez Resend (Plus Five Five, Inc., USA), a serwis i narzędzia działają na infrastrukturze Cloudflare, Inc. (USA). Przekazanie danych do USA odbywa się na podstawie standardowych klauzul umownych lub decyzji Komisji Europejskiej w sprawie EU-US Data Privacy Framework.”
  Tę samą listę dopisać w § 3 ust. 3 (podmioty w państwach trzecich). Nazwy prawne i podstawy transferu – do potwierdzenia przez prawnika.
- **Źródło:** kod repozytorium (ścieżki powyżej); tekst polityki.

### P1-3. Google-Extended opisany tylko jako blokada trenowania – pominięte uziemianie (grounding) w aplikacji Gemini
- **Plik:linia:** `src/data/aiModelsContent.ts:335–336` (podstrona /pozycjonowanie-ai/gemini/)
- **Cytat:** „Zablokowanie robota `Google-Extended` sprawia, że Google nie użyje Twoich tekstów do trenowania modelu Gemini. Nie blokuje to jednak Twojej obecności w AI Overviews…”
- **Problem:** według dokumentacji Google (aktualizacja 2026-07-14) Google-Extended steruje też **uziemianiem odpowiedzi w Gemini Apps** i w „Grounding with Google Search” na Vertex AI. Na stronie o pozycjonowaniu w Gemini to istotne: blokada Google-Extended usuwa stronę ze źródeł odpowiedzi w aplikacji Gemini. Poza tym Google-Extended to token w robots.txt, a nie osobny robot.
- **Proponowana poprawka:** „Zablokowanie tokenu `Google-Extended` w robots.txt (to nie jest osobny robot, tylko sygnał dla Googlebota) sprawia, że Google nie użyje Twoich treści do trenowania przyszłych modeli Gemini ani do uziemiania odpowiedzi w aplikacji Gemini i w Vertex AI. Nie wpływa to na obecność w Google Search, AI Overviews ani AI Mode – o nich decyduje Googlebot i nowy przełącznik w Search Console. Zablokowanie samego Googlebota usunęłoby Cię z całej wyszukiwarki.”
- **Źródło:** https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers

### P1-4. Perplexity-User przedstawiony jako bot sterowany przez robots.txt
- **Plik:linia:** `src/data/aiModelsContent.ts:396–397`
- **Cytat:** „`PerplexityBot` do regularnego skanowania internetu oraz `Perplexity-User` do pobierania danych w czasie rzeczywistym. Odpowiednio konfigurujemy Twój plik robots.txt. Bez tego technicznego kroku model po prostu ominie Twoją stronę.”
- **Problem:** Perplexity pisze wprost, że Perplexity-User „generally ignores robots.txt rules”. robots.txt steruje tylko PerplexityBotem.
- **Proponowana poprawka:** „Perplexity korzysta z dwóch agentów: `PerplexityBot` indeksuje strony do wyników wyszukiwania i przestrzega robots.txt, a `Perplexity-User` pobiera stronę na żądanie użytkownika i według dokumentacji Perplexity z reguły ignoruje robots.txt. O widoczności w wynikach decyduje więc dopuszczenie PerplexityBota w robots.txt i brak blokad na zaporze (WAF). Bez tego model po prostu ominie Twoją stronę.”
- **Źródło:** https://docs.perplexity.ai/guides/bots

### P1-5. Narzędzie AI Bots Check traktuje boty „na żądanie” tak, jakby robots.txt nimi sterował
- **Plik:linia:** `functions/_lib/ai-bots.ts:100–124` (ChatGPT-User, Claude-User, Perplexity-User); `functions/_lib/ai-bots.ts:39–40` (opis kategorii); `functions/api/tools/ai-bots-check.ts:206, 216` (zalecenia w raporcie)
- **Cytat:** kategoria on-demand: „Pobierają dane w czasie rzeczywistym tylko wtedy, gdy użytkownik wpisze zapytanie zawierające link do Twojej strony.”; zalecenie: „dodaj Allow dla botów wyszukiwawczych i user-triggered”
- **Problem:** OpenAI pisze o ChatGPT-User: „robots.txt rules may not apply”, a Perplexity o Perplexity-User: „generally ignores robots.txt rules”. Wynik „zablokowany w robots.txt” dla tych botów wprowadza więc w błąd: nie oznacza realnej blokady, a „Allow” niczego nie zmienia. Tylko Claude-User respektuje robots.txt. Do tego opis kategorii jest zbyt wąski: boty pobierają stronę na potrzeby konkretnej rozmowy albo akcji użytkownika, nie tylko wtedy, gdy użytkownik wklei link.
- **Proponowana poprawka:**
  - opis kategorii: „Pobierają stronę na potrzeby konkretnej rozmowy lub akcji użytkownika. Uwaga: według dokumentacji OpenAI i Perplexity ich boty ChatGPT-User i Perplexity-User mogą nie stosować się do robots.txt – realnie zatrzyma je dopiero reguła na zaporze (WAF). Claude-User respektuje robots.txt.”
  - przy wyniku „zablokowany” dla ChatGPT-User i Perplexity-User: „Reguła w robots.txt może nie zadziałać – ten bot według dostawcy nie zawsze stosuje się do robots.txt.”
- **Źródło:** https://developers.openai.com/api/docs/bots; https://docs.perplexity.ai/guides/bots; https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler

### P1-6. Microsoft Copilot opisany jako „modele z rodziny GPT-5” – także dla Microsoft 365
- **Plik:linia:** `src/data/aiModelsContent.ts:430` (heroSubtitle), `:439–440` („Modele GPT-5 i router rozumowania”), `src/data/aiModels.ts:80`
- **Cytat:** „wbudowany w przeglądarkę Edge, Windows 11 i pakiet Microsoft 365 … Korzysta z indeksu wyszukiwarki Bing oraz modeli z rodziny GPT-5”; „Połączenie modeli rodziny GPT-5 z indeksem Binga.”
- **Problem:** Microsoft 365 Copilot korzysta z wielu modeli: od lipca 2026 preferowany jest GPT-5.6, a we wrześniu 2026 doszły Claude Opus 5.5 i GPT-6 Sol (GPT-6 Astra i Claude Fable 5.1 w Copilot Cowork i Copilot Studio). Model konsumenckiego Copilota nie jest oficjalnie potwierdzony. Baseline wprost oznacza zdanie „Microsoft 365 Copilot działa na GPT-4o / GPT-5” jako nieaktualne.
- **Proponowana poprawka:**
  - aiModelsContent.ts:430: „…Korzysta z indeksu wyszukiwarki Bing i modeli językowych dobieranych do zadania – w Microsoft 365 Copilot są to m.in. GPT-5.6 i GPT-6 Sol od OpenAI oraz Claude Opus 5.5 od Anthropic.”
  - :439 tytuł: „Wiele modeli i router rozumowania”; :440 opis: „Copilot kieruje prostsze pytania do szybszych modeli, a złożone do modeli rozumujących. Microsoft 365 Copilot od 2026 roku łączy modele OpenAI (GPT-5.6, GPT-6 Sol) i Anthropic (Claude Opus 5.5). Cytowania wynikają z ugruntowania odpowiedzi w źródłach: Bing wskazuje kandydatów, a model wybiera fragmenty, które najlepiej podpierają syntezę.”
  - aiModels.ts:80: „Połączenie modeli OpenAI i Anthropic z indeksem Binga. …”
- **Źródło:** https://techcommunity.microsoft.com/blog/microsoft-copilot-blog/more-models-one-copilot/4559035 (w baseline z fragmentów wyszukiwarki); https://openai.com/index/gpt-5-6-preferred-model-microsoft-365-copilot/

### P1-7. „Flagowce pokroju GPT-5.6 Sol czy Claude Opus 5”
- **Plik:linia:** `src/content/blog/ai-w-biznesie/bezpieczenstwo-danych-llm.md:168`
- **Cytat:** „modele open-source nadal ustępują flagowcom pokroju GPT-5.6 Sol czy Claude Opus 5”
- **Problem:** od 2026-09-03 najmocniejszy model OpenAI to GPT-6 Astra (od 22.09 są też GPT-6 Sol i Luna). U Anthropic flagowcem jest Fable 5.1, a od 2026-09-22 Opus 5.5 zastępuje Opus 5.
- **Proponowana poprawka:** „modele open-source nadal ustępują flagowcom pokroju GPT-6 Astra czy Claude Fable 5.1 w zadaniach wymagających złożonego wnioskowania (luka maleje, ale wciąż istnieje).”
- **Źródło:** https://developers.openai.com/api/docs/models; https://platform.claude.com/docs/en/about-claude/pricing

### P1-8. „SearchGPT” jako nazwa działającej usługi
- **Plik:linia:** `src/data/homepageFaq.ts:22` (FAQ na stronie głównej)
- **Cytat:** „W przypadku silników działających w czasie rzeczywistym, jak Perplexity czy SearchGPT…”
- **Problem:** SearchGPT był prototypem z 2024 roku. Usługa działa jako wyszukiwanie w ChatGPT (ChatGPT Search), obsługiwane przez OAI-SearchBot.
- **Proponowana poprawka:** „…jak Perplexity czy wyszukiwanie w ChatGPT (ChatGPT Search)…”
- **Źródło:** https://developers.openai.com/api/docs/bots (OAI-SearchBot – „ChatGPT's search features”)

### P1-9. Porady „nie blokuj” pomijają dwa z trzech botów Anthropic i mieszają token Google-Extended z crawlerami
- **Plik:linia:** `src/pages/pozycjonowanie-ai.astro:104`, `:160`, `:387`
- **Cytat:** „modele muszą móc pobrać stronę, więc GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot i Google-Extended nie mogą być blokowane”
- **Problem:** Claude cytuje strony dzięki Claude-SearchBot (wyszukiwanie) i Claude-User (pobieranie na żądanie), a nie dzięki ClaudeBot, który zbiera dane do trenowania. Baseline wymienia trzy boty Anthropic. Google-Extended nie pobiera stron – to token sterujący trenowaniem i uziemianiem w Gemini Apps.
- **Proponowana poprawka (:160):** „Po pierwsze, dostęp: modele muszą móc pobrać stronę, więc w robots.txt i na zaporze nie mogą być blokowane OAI-SearchBot i GPTBot (OpenAI), Claude-SearchBot, Claude-User i ClaudeBot (Anthropic) oraz PerplexityBot, a token Google-Extended warto zostawić dopuszczony, jeśli zależy Ci na cytowaniach w aplikacji Gemini.” Listy w :104 i :387 zmienić tak samo („GPTBot, OAI-SearchBot, ClaudeBot, Claude-SearchBot, Claude-User, PerplexityBot, Google-Extended”).
- **Źródło:** https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler; https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers

---

## P2 – brak ważnych nowości

### P2-1. Brak OAI-AdsBot na liście botów narzędzia (i w liczbie „13 botów”)
- **Plik:linia:** `functions/_lib/ai-bots.ts:45–158` (tablica `AI_BOTS`), liczba 13 w `functions/_lib/ai-bots.ts:2`, `src/pages/narzedzia/ai-bots-check.astro:17, 39, 60, 109`
- **Cytat:** „13 botów AI w 4 kategoriach funkcjonalnych”
- **Problem:** dokumentacja OpenAI wymienia nowego bota **OAI-AdsBot** (`OAI-AdsBot/1.0`). Sprawdza bezpieczeństwo stron docelowych reklam w ChatGPT, a zebrane dane nie służą do trenowania. Reklamy w ChatGPT są testowane od 2026-02-09. Zablokowanie tego bota może utrudnić prowadzenie kampanii w ChatGPT.
- **Proponowana poprawka:** dodać wpis: nazwa „OAI-AdsBot”, właściciel OpenAI, kategoria „on-demand” albo nowa „Reklamy”, cel „Weryfikacja stron docelowych reklam w ChatGPT”, wpływ „Dotyczy tylko reklamodawców; dane nie służą do trenowania”. Liczbę zmienić na „14 botów AI” we wszystkich miejscach.
- **Źródło:** https://developers.openai.com/api/docs/bots; https://openai.com/index/testing-ads-in-chatgpt/

### P2-2. Przestarzałe aliasy botów Anthropic (`anthropic-ai`, `Claude-Web`)
- **Plik:linia:** `functions/_lib/ai-bots.ts:58`, `:111`
- **Cytat:** `aliases: ['anthropic-ai']`, `aliases: ['Claude-Web']`
- **Problem:** Anthropic wymienia obecnie tylko ClaudeBot, Claude-User i Claude-SearchBot. Reguła `User-agent: anthropic-ai` nie steruje ClaudeBotem, a narzędzie liczy ją jako regułę dla ClaudeBota. Może więc pokazać „zablokowany” albo „dopuszczony”, choć faktyczny bot jest traktowany inaczej.
- **Proponowana poprawka:** usunąć aliasy z logiki dopasowania. Opcjonalnie pokazywać ostrzeżenie: „W robots.txt jest reguła dla przestarzałego tokenu `anthropic-ai` / `Claude-Web` – Anthropic go już nie używa. Dodaj regułę dla ClaudeBot, Claude-User lub Claude-SearchBot.”
- **Źródło:** https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler

### P2-3. Podstrona ChatGPT: brak ChatGPT-User, OAI-AdsBot i reklam w ChatGPT w sekcji o robots.txt
- **Plik:linia:** `src/data/aiModelsContent.ts:75–76`, `:88`, `:117–118`
- **Cytat:** „Krytyczne pozostaje rozróżnienie botów w robots.txt: GPTBot zbiera dane treningowe, a OAI-SearchBot obsługuje wyszukiwanie w ChatGPT Search.”
- **Problem:** OpenAI ma dziś cztery boty. ChatGPT-User według OpenAI może nie stosować się do robots.txt, OAI-AdsBot jest nowy, a jeśli dopuścisz oba boty (GPTBot i OAI-SearchBot), OpenAI może użyć jednego crawla do obu celów. Zmiany w robots.txt działają po około 24 h.
- **Proponowana poprawka (:76, zdanie po „…ChatGPT Search.”):** „Trzeci agent, ChatGPT-User, pobiera strony na potrzeby konkretnej rozmowy – według OpenAI reguły robots.txt mogą go nie obejmować, więc realną blokadę daje dopiero zapora (WAF). Czwarty, OAI-AdsBot, sprawdza strony docelowe reklam w ChatGPT i nie zbiera danych do trenowania. Gdy dopuścisz zarówno GPTBot, jak i OAI-SearchBot, OpenAI może użyć jednego pobrania do obu celów; zmiany w robots.txt system uwzględnia po około 24 godzinach.”
- **Źródło:** https://developers.openai.com/api/docs/bots

### P2-4. Podstrona Gemini: brak nowego przełącznika „Search generative AI control” w Search Console
- **Plik:linia:** `src/data/aiModelsContent.ts:334–336` (sekcja optymalizacji), ewentualnie nowe pytanie w FAQ (`:347–364`)
- **Cytat:** – (brak informacji)
- **Problem:** od 2026-08-31 właściciele witryn na całym świecie mogą w Search Console zdecydować, czy strona pojawia się w AI Overviews, AI Mode i generatywnych funkcjach Discover. Na stronie o pozycjonowaniu w Gemini i AI Overviews to kluczowa nowość.
- **Proponowana poprawka (nowe FAQ):** „**Czy mogę wyłączyć swoją stronę z AI Overviews?** Tak. Od 31 sierpnia 2026 roku Search Console ma przełącznik »Search generative AI control«. Decyduje on, czy witryna może pojawiać się i być źródłem odpowiedzi w AI Overviews, AI Mode i generatywnych funkcjach Discover. Wyłączenie nie wpływa na ranking w zwykłych wynikach, ale oznacza zero wyświetleń i ruchu z tych funkcji. Nie dotyczy trenowania modeli – tym steruje token Google-Extended. W Search Console są też nowe raporty wyświetleń w funkcjach generatywnych.”
- **Źródło:** https://support.google.com/webmasters/answer/16908024; https://blog.google/products-and-platforms/products/search/new-controls-website-owners/

### P2-5. Brand Check: modele API nie odpowiadają temu, co działa w produktach, a identyfikatory widać w raporcie
- **Plik:linia:** `functions/api/tools/brand-check.ts:106–108`; wyświetlanie: `src/pages/narzedzia/brand-check.astro:1301` (`brand-model-pill`)
- **Cytat:** `'openai/gpt-5-mini'`, `'anthropic/claude-haiku-4.5'`, `'google/gemini-3-flash-preview'`
- **Problem:** narzędzie deklaruje „jak ChatGPT, Claude, Gemini i Perplexity opisują Twoją markę”, a odpytuje starsze lub mniejsze modele:
  - `gpt-5-mini` z 2025-08-07 zostanie wyłączony 2026-12-11. ChatGPT Free i Go działa na GPT-5.6 Luna, a sam serwis w Fan-out Check używa już `gpt-5.6-luna`;
  - Claude Haiku 4.5 może zostać wycofany najwcześniej 2026-10-15;
  - Gemini 3 Flash Preview to podgląd sprzed serii 3.5–3.8. AI Mode domyślnie działa na Gemini 3.5 Flash.

  Użytkownik widzi te identyfikatory w raporcie.
- **Proponowana poprawka:** kod – ChatGPT: `openai/gpt-5.6-luna` (odpowiednik darmowego ChatGPT), Claude: Sonnet 5 albo Haiku 4.5 do czasu premiery Haiku 5.5, Gemini: `google/gemini-3.5-flash` (domyślny w AI Mode). Na stronie narzędzia dodać zdanie: „Odpytujemy modele przez API (wersje zbliżone do domyślnych w darmowych planach), więc odpowiedzi mogą się różnić od tego, co zobaczysz w aplikacji.”
- **Źródło:** https://developers.openai.com/api/docs/deprecations; https://platform.claude.com/docs/en/about-claude/model-deprecations; https://blog.google/innovation-and-ai/technology/ai/google-io-2026-all-our-announcements/

### P2-6. Notatki źródeł „Aktualne modele…” ze stanem na 17 września – przed premierami Opus 5.5 i GPT-6 Sol/Luna
- **Plik:linia:** `src/content/blog/agenci-ai/anatomia-agenta.md:48, 51`; `src/content/blog/ai-w-biznesie/bezpieczenstwo-danych-llm.md:63, 66`; `src/content/blog/prompty/przewodnik.md:45`; `src/content/blog/rag/embeddingi.md:39`
- **Cytat:** „stan na 17 września 2026. Aktualna rodzina GPT-5.6 (Sol, Terra, Luna) i GPT-6 Astra.”; „Aktualne modele Claude Fable 5.1, Opus 5, Sonnet 5 i Haiku 4.5.”
- **Problem:** notatki są datowane, ale zawierają słowo „aktualne”. Od 2026-09-22 w API są GPT-6 Sol i GPT-6 Luna (zastępują GPT-5.6 Sol i Luna), a Opus 5.5 zastępuje Opus 5.
- **Proponowana poprawka:**
  - OpenAI: „OpenAI, dokumentacja API, stan na 25 września 2026. Aktualne modele API: GPT-6 Astra, GPT-6 Sol i GPT-6 Luna; w ChatGPT domyślnie GPT-5.6 Luna (Free, Go) i GPT-5.6 Sol (Plus, Pro).”
  - Anthropic: „Anthropic, dokumentacja, stan na 25 września 2026. Aktualne modele Claude Fable 5.1, Opus 5.5, Sonnet 5 i Haiku 4.5.”
- **Źródło:** https://developers.openai.com/api/docs/models; https://platform.claude.com/docs/en/about-claude/pricing

### P2-7. Tabela modeli w przewodniku po promptach bez generacji GPT-6
- **Plik:linia:** `src/content/blog/prompty/przewodnik.md:303–306`
- **Cytat:** „| GPT-5.6 | Instrukcje złożone, formatowanie |…”, „| Claude Sonnet/Opus |…”, „| Llama 4 (open source) |…”
- **Problem:** GPT-5.6 to nadal model w ChatGPT, ale w API aktualna generacja to GPT-6. Llama 4 nie ma otwartej licencji w sensie OSI, a Meta AI działa już na modelach Muse. Gemini 3.1 Pro jest poprawny.
- **Proponowana poprawka:** „| GPT-5.6 / GPT-6 (Sol, Luna, Astra) | …”; „| Claude (Fable 5.1, Opus 5.5, Sonnet 5) | …”; „| Llama 4 (open-weight) | …”.
- **Źródło:** https://developers.openai.com/api/docs/models; https://dev.meta.ai/docs/models

### P2-8. Podstrona ChatGPT: brak informacji o reklamach w ChatGPT
- **Plik:linia:** `src/data/aiModelsContent.ts:44` (heroSubtitle) albo FAQ `:91–123`
- **Cytat:** – (brak)
- **Problem:** od 2026-02-09 w ChatGPT testowane są reklamy (USA, a od 2026-08-11 także m.in. UK, Meksyk, Brazylia, Japonia i Korea Płd.). To nowy, płatny sposób na widoczność obok cytowań organicznych. Dostępność reklam w Polsce – niezweryfikowane.
- **Proponowana poprawka (nowe FAQ):** „**Czy w ChatGPT można się reklamować?** OpenAI testuje reklamy w ChatGPT od lutego 2026 roku – najpierw w USA, od sierpnia 2026 także w kolejnych krajach. Strony docelowe reklam sprawdza osobny bot OpenAI – OAI-AdsBot. Cytowania organiczne w odpowiedziach nie zależą od reklam.” (Czy reklamy są oznaczone i oddzielone od odpowiedzi – niezweryfikowane, dopisać po sprawdzeniu u OpenAI.)
- **Źródło:** https://openai.com/index/testing-ads-in-chatgpt/; https://help.openai.com/en/articles/20001047-ads-in-chatgpt

---

## P3 – drobne

### P3-1. Sonda WAF używa starych wersji UA botów OpenAI
- **Plik:linia:** `functions/_lib/ai-bots-probe.ts:35`, `:40`
- **Cytat:** `GPTBot/1.2`, `OAI-SearchBot/1.0`
- **Problem:** obecne wersje to `GPTBot/1.4` i `OAI-SearchBot/1.4`. Reguły WAF zwykle dopasowują sam token, więc wpływ na wynik jest mały.
- **Proponowana poprawka:** podmienić na `GPTBot/1.4; +https://openai.com/gptbot` oraz `OAI-SearchBot/1.4; +https://openai.com/searchbot`.
- **Źródło:** https://developers.openai.com/api/docs/bots

### P3-2. Opis celu GPTBota odwołuje się do „GPT-5+”
- **Plik:linia:** `functions/_lib/ai-bots.ts:51`
- **Cytat:** „Trening modeli GPT-5+”
- **Proponowana poprawka:** „Trening modeli bazowych OpenAI (GPT-6 i kolejnych)”
- **Źródło:** https://developers.openai.com/api/docs/bots

### P3-3. Link do dokumentacji botów OpenAI pod starym adresem
- **Plik:linia:** `src/data/aiModelsContent.ts:50`
- **Cytat:** `href="https://platform.openai.com/docs/bots"`
- **Proponowana poprawka:** `https://developers.openai.com/api/docs/bots`
- **Źródło:** https://developers.openai.com/api/docs/bots

### P3-4. „RAG oparty na indeksie Bing” w ChatGPT Search – twierdzenie niezweryfikowane
- **Plik:linia:** `src/data/aiModelsContent.ts:44`, `:54`, `:94`, `:98`; `src/pages/pozycjonowanie-ai/[slug].astro:50`
- **Cytat:** „przez mechanizm RAG oparty na indeksie Bing w czasie rzeczywistym”
- **Problem:** OpenAI opisuje własnego crawlera OAI-SearchBot, który służy do pokazywania stron w wynikach ChatGPT. Oficjalnego potwierdzenia, że ChatGPT Search opiera się dziś na indeksie Binga, nie ma w baseline – **niezweryfikowane**.
- **Proponowana poprawka (:44):** „…oraz przez wyszukiwanie w czasie rzeczywistym (ChatGPT Search), które korzysta z własnego crawlera OpenAI (OAI-SearchBot) i zewnętrznych dostawców wyników wyszukiwania.”
- **Źródło:** https://developers.openai.com/api/docs/bots

### P3-5. Claude i Brave Search: liczby niezweryfikowane
- **Plik:linia:** `src/data/aiModelsContent.ts:241`, `:271`; `src/pages/pozycjonowanie-ai/[slug].astro:24`
- **Cytat:** „indeksu wyszukiwarki Brave Search (ponad 30 mld stron)… Korelacja … wynosi aż 86,7%”
- **Problem:** Brave widnieje na liście podwykonawców Anthropic od 2025-03-19 (według źródeł wtórnych nadal w lipcu 2026, obok TurboPuffer), ale Anthropic nie potwierdza go oficjalnie jako silnika wyszukiwania. Źródła wtórne podają indeks „ponad 40 mld stron” i około 79% zgodności cytowań (czerwiec 2026). Liczba 86,7% nie ma źródła – **niezweryfikowane**.
- **Proponowana poprawka:** „W trybie wyszukiwania Claude najpewniej korzysta z indeksu Brave Search (Brave jest na liście podwykonawców Anthropic od marca 2025, choć Anthropic oficjalnie nie wskazuje dostawcy wyszukiwania). Testy branżowe pokazują, że większość cytowań Claude pokrywa się z wynikami Brave.” W `[slug].astro:24` zamiast „86,7% korelacji z Brave” wpisać „zbieżność z wynikami Brave”.
- **Źródło:** https://simonwillison.net/2025/Mar/21/anthropic-use-brave/ (źródło wtórne); https://xponent21.com/insights/claude-web-search-brave-turbopuffer/ (źródło wtórne)

### P3-6. Sprzeczna liczba cytowań ChatGPT na jednej podstronie
- **Plik:linia:** `src/pages/pozycjonowanie-ai/[slug].astro:23, 41` vs `src/data/aiModelsContent.ts:102`
- **Cytat:** „5-10 cytowań na odpowiedź” vs „(1-5 cytowań na odpowiedź)”
- **Proponowana poprawka:** ujednolicić zapis, np. „zwykle 3–10 cytowań na odpowiedź” w obu miejscach (wartość szacunkowa, bez oficjalnego źródła – niezweryfikowane).
- **Źródło:** –

### P3-7. Nazwa trybu „Pro Search” w Perplexity
- **Plik:linia:** `src/data/aiModelsContent.ts:371`, `:378–379`
- **Cytat:** „audyt widoczności w trybie Pro Search”; „Tryb Pro Search i pogłębiona analiza”
- **Problem:** według źródeł wtórnych aplikacja Perplexity działa w trybie „Best”, który dobiera model do zapytania, a lista modeli Pro/Max jest inna niż kiedyś. Aktualna nazwa trybu – **niezweryfikowane** (centrum pomocy Perplexity zwraca 403).
- **Proponowana poprawka:** „Tryb Pro i pogłębiona analiza” oraz „…w płatnych trybach wyszukiwania Perplexity (Pro, Research)…” – po sprawdzeniu nazw w aplikacji.
- **Źródło:** baseline §5 (źródło wtórne)

### P3-8. GPT-5.6 jako przykład „współczesnego” modelu w tekstach poradnikowych
- **Plik:linia:** `src/content/blog/agenci-ai/anatomia-agenta.md:67`; `src/content/blog/prompty/przewodnik.md:53`; `src/content/blog/rag/embeddingi.md:155`; `src/content/blog/ai-w-biznesie/build-vs-buy.md:130`
- **Cytat:** „Współczesne GPT-5.6 czy Claude Opus 5 radzą sobie z tym znacznie lepiej”; „Zewnętrzny model bazowy (OpenAI GPT-5.6, Anthropic Claude, Google Gemini)”
- **Problem:** to nie błąd (GPT-5.6 nadal działa w ChatGPT), ale Opus 5 został zastąpiony przez Opus 5.5, a w API najnowsza jest generacja GPT-6.
- **Proponowana poprawka:** anatomia-agenta.md:67 – „Współczesne modele, takie jak GPT-6 czy Claude Opus 5.5, radzą sobie z tym znacznie lepiej…”; build-vs-buy.md:130 – „(OpenAI GPT-6, Anthropic Claude, Google Gemini)”. W prompty:53 i embeddingi:155 wystarczy „GPT” bez numeru wersji.
- **Źródło:** https://developers.openai.com/api/docs/models; https://platform.claude.com/docs/en/about-claude/pricing

### P3-9. Cena Microsoft 365 Copilot – poprawna, warto dodać tańszy wariant
- **Plik:linia:** `src/content/blog/ai-w-biznesie/build-vs-buy.md:50`
- **Cytat:** „Licencja Microsoft Copilot kosztuje 30 dolarów miesięcznie za użytkownika”
- **Problem:** 30 USD za użytkownika miesięcznie (rozliczenie roczne) nadal obowiązuje dla Microsoft 365 Copilot. Dla małych i średnich firm jest też Copilot Business za 21 USD, a Copilot Chat jest bez dopłaty w kwalifikujących się planach M365.
- **Proponowana poprawka:** „Licencja Microsoft 365 Copilot kosztuje 30 dolarów miesięcznie za użytkownika (w wersji Copilot Business dla MŚP – 21 dolarów)…”
- **Źródło:** https://www.microsoft.com/en-us/microsoft-365-copilot/pricing

---

## Sprawdzone bez uwag
- `src/components/Hero.astro`, `src/components/Authority.astro` – nazwy produktów bez wersji; statystyki opisane jako dane z 2025 roku (Previsible 2025, patent Google 2024) – poprawnie datowana historia.
- `functions/api/tools/fanout.ts` – domyślny model `gpt-5.6-luna` zgodny z domyślnym modelem darmowego ChatGPT. Strona narzędzia nie podaje wersji modelu.
- `src/pages/narzedzia/url-check.astro:133–134` – „Gemini Flash Lite” zgodne z kodem (`google/gemini-3.1-flash-lite`, wycofanie nie wcześniej niż 2027-05-07).
- `src/pages/narzedzia/fanout-explorer.astro` – deklaracja „nie przekazuje danych poza chatgpt.com” zgodna z kodem bookmarkletu.
- Kategorie i opisy Claude-SearchBot, Claude-User, CCBot, Applebot-Extended i Google-Extended w `ai-bots.ts` – zgodne z baseline (poza uwagami wyżej).
- Blog RAG: `rerank-english-v3.0` (Cohere) nadal aktualny; MTEB „stan na czerwiec 2025” poprawnie datowany; `text-embedding-3-small` / `-3-large` bez wpisu o wycofaniu.
- `aiModelsContent.ts:245` – trzy boty Anthropic opisane poprawnie.
- Gemini 3.1 Pro w `prompty/przewodnik.md:305` – zgodne z baseline (nadal najnowszy Pro, Preview).
