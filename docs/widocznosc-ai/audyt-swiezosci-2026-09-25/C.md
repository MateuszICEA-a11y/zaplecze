# Audyt świeżości – paczka C (grok, copilot, deepseek, perplexity, jev)

Data audytu: 2026-09-25. Baseline: `docs/widocznosc-ai/stan-modeli-2026-09-25.md`. Pliki: `portals/widocznosc.ai/src/content/blog/modele-llm/`. Żaden plik serwisu nie był edytowany.

Priorytety: **P1** – błąd / nieaktualne „najnowszy” / cena; **P2** – brak ważnej nowości; **P3** – drobne.

Podsumowanie: **P1 – 9**, **P2 – 9**, **P3 – 9** (razem 27).

| Plik | P1 | P2 | P3 |
|---|---|---|---|
| grok.md | 6 | 2 | 3 |
| copilot.md | 0 | 3 | 1 |
| deepseek.md | 2 | 1 | 2 |
| perplexity.md | 1 | 3 | 1 |
| jev.md | 0 | 0 | 2 |

---

## grok.md

### G1 – P1
- **Miejsce:** grok.md:35 (FAQ „Skąd Grok bierze aktualne informacje?”)
- **Cytat:** „w przypadku najnowszego Groka 4.6 sięgającej lutego 2026 roku”
- **Problem:** Najnowszy jest Grok 4.7 (premiera 2026-09-21), a jego wiedza sięga maja 2026 r.
- **Poprawka:** „Bez włączonych narzędzi wyszukiwania model opiera się wyłącznie na wiedzy treningowej – w przypadku najnowszego Groka 4.7 (wrzesień 2026) sięgającej maja 2026 roku.”
- **Źródło:** https://docs.x.ai/docs/models („The knowledge cut-off date of Grok 4.7 is May 2026”), https://docs.x.ai/docs/release-notes

### G2 – P1
- **Miejsce:** grok.md:44 (FAQ „Czy Grok ma API dla firm?”)
- **Cytat:** „xAI udostępnia API pod adresem docs.x.ai z modelami z rodziny Grok 4 (flagowiec to Grok 4.6)”
- **Problem:** Od 2026-09-21 flagowcem jest Grok 4.7; dokumentacja działa już pod marką SpaceXAI.
- **Poprawka:** „Tak. SpaceXAI (dawniej xAI) udostępnia API pod adresem docs.x.ai z modelami z rodziny Grok 4 (od 21 września 2026 roku flagowcem jest Grok 4.7).”
- **Źródło:** https://docs.x.ai/docs/release-notes, https://docs.x.ai/developers/models (tytuł strony: „Grok Models & Pricing | SpaceXAI Docs”)

### G3 – P1
- **Miejsce:** grok.md:91
- **Cytat:** „(w Groku 4.6 – luty 2026 roku)”
- **Problem:** Nieaktualny model i data odcięcia wiedzy.
- **Poprawka:** „(w Groku 4.7 – maj 2026 roku)”
- **Źródło:** https://docs.x.ai/docs/models

### G4 – P1
- **Miejsce:** grok.md:117 (tabela „Historia i rodzina modeli”)
- **Cytat:** „| Grok 4.6 | sierpień 2026 | Obecny flagowiec API, …”
- **Problem:** Grok 4.6 nie jest już flagowcem; brak wiersza Grok 4.7.
- **Poprawka:** zmienić wiersz 4.6 na „| Grok 4.6 | sierpień 2026 | Okno 500 tys. tokenów, rozumowanie z regulowanym wysiłkiem |” i dodać: „| Grok 4.7 | wrzesień 2026 | Obecny flagowiec API – nowy, większy model bazowy, dłuższy trening RL pod wielogodzinne zadania, okno 500 tys. tokenów, wiedza do maja 2026 |”
- **Źródło:** https://docs.x.ai/docs/release-notes, https://siliconangle.com/2026/09/21/spacex-launches-grok-4-7-with-long-horizon-processing-safety-upgrades/ (źródło wtórne – opis modelu)

### G5 – P1
- **Miejsce:** grok.md:119
- **Cytat:** „Najnowszy Grok 4.6 xAI opisuje jako swój najinteligentniejszy i najszybszy model”
- **Problem:** Nieaktualne „najnowszy”.
- **Poprawka:** „Najnowszy Grok 4.7 (21 września 2026 roku) SpaceXAI opisuje jako swój najbardziej zdolny model do programowania i pracy z wiedzą – według firmy dłużej pracuje nad trudnymi zadaniami i staranniej sprawdza własne wyniki. Mimo to w wyścigu z nowymi modelami OpenAI i Anthropic kolejność w rankingach zmienia się co kilka miesięcy.”
- **Źródło:** https://docs.x.ai/docs/models („the most capable model we've built”), https://www.unite.ai/spacexai-releases-grok-4-7-for-coding-and-knowledge-work/ (źródło wtórne)

### G6 – P1
- **Miejsce:** grok.md:125–131 (akapit i tabela cennika)
- **Cytat:** „Flagowym modelem w API jest Grok 4.6”
- **Problem:** Flagowcem jest Grok 4.7; brak go w tabeli. Ceny 4.6/4.5/4.3 w tabeli są nadal poprawne.
- **Poprawka:** „Flagowym modelem w API jest Grok 4.7 (w cenie Groka 4.6), a tańszą opcją z dłuższym kontekstem – Grok 4.3:” oraz nowy pierwszy wiersz tabeli: „| Grok 4.7 | 2,00 USD | 6,00 USD | 500 tys. |”. W wierszu 133: „(w Groku 4.7 i 4.6 do 4 i 12 USD), a tokeny wejściowe z pamięci podręcznej kosztują w obu 0,50 USD za milion.”
- **Źródło:** https://docs.x.ai/docs/models (grok-4.7: $2 / cached $0,50 / $6; >200K: $4 / $12)

### G7 – P2
- **Miejsce:** grok.md:2–4, 79, 83 (tytuł, opis, lead, sekcja „Czym jest Grok i kto za nim stoi”)
- **Cytat:** „Grok to model językowy od xAI – firmy Elona Muska”
- **Problem:** Brak informacji, że xAI działa obecnie pod marką SpaceXAI (Grok 4.7 ogłoszony przez SpaceX; dokumentacja „SpaceXAI Docs”).
- **Poprawka (dopisać w sekcji z linii 83):** „Dziś firma działa pod marką **SpaceXAI** w ramach SpaceX – pod tą nazwą publikuje dokumentację i nowe modele, w tym Groka 4.7.” W tytule/opisie można zostawić „xAI” (rozpoznawalność), ale dodać „(SpaceXAI)” przy pierwszej wzmiance w leadzie.
- **Źródło:** https://docs.x.ai/developers/models, https://siliconangle.com/2026/09/21/spacex-launches-grok-4-7-with-long-horizon-processing-safety-upgrades/ (źródło wtórne). Szczegóły prawne połączenia xAI ze SpaceX – niezweryfikowane w źródle oficjalnym.

### G8 – P2
- **Miejsce:** grok.md:63–68 (frontmatter `sources`, „Models” i „Release notes”)
- **Cytat:** „Cennik API za milion tokenów: Grok 4.6 – 2 USD …” / „… oraz Grok 4.6 w API w sierpniu.”
- **Problem:** Notatki źródeł nie obejmują Groka 4.7.
- **Poprawka:** Models: „Dokumentacja SpaceXAI. Cennik API za milion tokenów: Grok 4.7 i Grok 4.6 – 2 USD (wejście) i 6 USD (wyjście), okno 500 tys. tokenów; wiedza Groka 4.7 do maja 2026; Grok 4.5 – 2 USD i 6 USD, okno 500 tys.; Grok 4.3 – 1,25 USD i 2,50 USD, okno 1 mln tokenów (stawki dla promptów poniżej 200 tys. tokenów); warianty grok-4.20-0309, grok-build-0.1, Grok Imagine i Voice API.” Release notes: „… Grok 4.6 w API w sierpniu i Grok 4.7 we wrześniu 2026 roku.”
- **Źródło:** https://docs.x.ai/docs/models, https://docs.x.ai/docs/release-notes

### G9 – P3
- **Miejsce:** grok.md:24, 96
- **Cytat:** „SuperGrok – płatna subskrypcja (ok. 30 USD miesięcznie)”
- **Problem:** SuperGrok nadal ok. 30 USD, ale według serwisów trzecich doszły progi SuperGrok Lite (10 USD), Plus (100 USD) i Heavy (300 USD). Oficjalnie niezweryfikowane.
- **Poprawka (po weryfikacji na grok.com):** „SuperGrok – płatne subskrypcje od ok. 10 USD (Lite) do 300 USD miesięcznie (Heavy); podstawowy SuperGrok kosztuje ok. 30 USD.”
- **Źródło:** https://suprmind.ai/hub/grok/pricing/ (źródło wtórne) – **niezweryfikowane**

### G10 – P3
- **Miejsce:** grok.md:159
- **Cytat:** „w przypadku Perplexity czy SearchGPT”
- **Problem:** SearchGPT to nazwa prototypu z 2024 r.; produkt działa jako ChatGPT Search (bot OAI-SearchBot).
- **Poprawka:** „w przypadku Perplexity czy wyszukiwania w ChatGPT”
- **Źródło:** https://developers.openai.com/api/docs/bots

### G11 – P3
- **Miejsce:** grok.md:98 / 135
- **Cytat:** „API dla deweloperów – dostępne pod adresem docs.x.ai”
- **Problem:** Warto dodać, gdzie jeszcze działa najnowszy model (dystrybucja wpływa na zasięg): Grok 4.7 jest też w Cursorze, Grok Build, GitHub Copilot i w Agent API Perplexity.
- **Poprawka (dopisać po linii 98):** „Najnowszy Grok 4.7 trafia też do narzędzi zewnętrznych – m.in. Cursora, GitHub Copilot i Agent API Perplexity.”
- **Źródło:** https://docs.github.com/en/copilot/reference/ai-models/supported-models, https://docs.perplexity.ai/changelog

---

## copilot.md

### C1 – P2
- **Miejsce:** copilot.md:90
- **Cytat:** „w Microsoft 365 Copilot domyślny tryb „Auto” sam dobiera model do zapytania, w części usług dla firm dostępne są modele Anthropic”
- **Problem:** Brak najważniejszej wrześniowej zmiany: od 2026-09-22 Microsoft wprowadza Claude Opus 5.5 i GPT-6 Sol w Word, Excel, PowerPoint, Chat, Cowork i Copilot Studio; GPT-6 Astra i Claude Fable 5.1 w Cowork i Copilot Studio (od 2026-09-01); GPT-5.6 jest „preferred model” od lipca 2026.
- **Poprawka:** „Dziś Microsoft nie wiąże się z jednym dostawcą: w Microsoft 365 Copilot domyślny tryb „Auto” sam dobiera model do zapytania, a w selektorze modeli są modele OpenAI i Anthropic. Od lipca 2026 roku preferowanym modelem jest GPT-5.6, a od 22 września 2026 roku Microsoft wprowadza w Wordzie, Excelu, PowerPoincie, czacie, Cowork i Copilot Studio także Claude Opus 5.5 i GPT-6 Sol (dostępność zależy od licencji i regionu). GitHub Copilot oferuje modele OpenAI, Anthropic, Google, xAI i Moonshot AI oraz własny model Microsoftu.”
- **Źródło:** https://techcommunity.microsoft.com/blog/microsoft-copilot-blog/more-models-one-copilot/4559035, https://windowsreport.com/microsoft-rolls-out-claude-opus-5-5-and-gpt-6-sol-to-copilot-across-word-excel-and-more/ (źródło wtórne), https://openai.com/index/gpt-5-6-preferred-model-microsoft-365-copilot/

### C2 – P2
- **Miejsce:** copilot.md:54 (frontmatter `sources`, GitHub „Supported AI models”)
- **Cytat:** „m.in. GPT-6 Astra i GPT-5.6 (OpenAI), Claude Fable 5.1 i Opus 5 (Anthropic), … Grok 4.6 (xAI)”
- **Problem:** Lista na docs.github.com obejmuje już GPT-6 Sol i GPT-6 Luna, Claude Opus 5.5 i Grok 4.7.
- **Poprawka:** „GitHub Docs. Modele dostępne w GitHub Copilot, m.in. GPT-6 Astra, GPT-6 Sol i GPT-6 Luna (OpenAI), Claude Fable 5.1 i Opus 5.5 (Anthropic), Gemini 3.8 Flash (Google), Grok 4.7 (xAI), Kimi K3 (Moonshot AI) i MAI-Code-1.1-Flash (Microsoft).”
- **Źródło:** https://docs.github.com/en/copilot/reference/ai-models/supported-models (2026-09-25)

### C3 – P2
- **Miejsce:** copilot.md:134–136
- **Cytat:** „Model biznesowy usługi Copilot for Microsoft 365 wymaga posiadania bazowej licencji Microsoft 365 …”
- **Problem:** Microsoft Learn (akt. 2026-09-17) opisuje trzy poziomy: Copilot Chat (Basic), Microsoft 365 Copilot (Basic) – bez dodatku, ale ze „standard access” do Copilota w Word, Excel, PowerPoint i OneNote – oraz Microsoft 365 Copilot (Premium) z dodatkiem, priorytetowym dostępem, Work IQ/Graph i Cowork (rozliczany za zużycie). Artykuł sugeruje, że Copilot w aplikacjach wymaga dokupienia licencji. Ceny (30 USD Enterprise, 21/18 USD Business) są poprawne.
- **Poprawka (dopisać po linii 134):** „Microsoft rozróżnia dziś trzy poziomy: Copilot Chat (Basic) – czat oparty na danych z sieci, Microsoft 365 Copilot (Basic) – standardowy dostęp do Copilota w Wordzie, Excelu, PowerPoincie i OneNote bez dodatkowej licencji oraz Microsoft 365 Copilot (Premium) – płatny dodatek z priorytetowym dostępem, pracą na danych firmowych (Microsoft Graph, Work IQ) i agentem Cowork rozliczanym za zużycie.”
- **Źródło:** https://learn.microsoft.com/en-us/microsoft-365/copilot/microsoft-365-copilot-overview

### C4 – P3
- **Miejsce:** copilot.md:51 (frontmatter `sources`, „What is Microsoft Copilot?”)
- **Cytat:** „Microsoft Learn, aktualizacja z września 2026.”
- **Problem:** Poprawne, ale warto doprecyzować datę i nową strukturę licencji (spójność z C3).
- **Poprawka:** „Microsoft Learn, aktualizacja z 17 września 2026. Poziomy Copilot Chat (Basic), Microsoft 365 Copilot (Basic) i (Premium), wybór modelu (Auto, Quick response, Think deeper) z routerem modeli oraz modele Anthropic jako podprocesor w wybranych usługach Microsoft 365.”
- **Źródło:** https://learn.microsoft.com/en-us/microsoft-365/copilot/microsoft-365-copilot-overview

---

## deepseek.md

Uwaga: stan DeepSeeka w artykule jest poprawny – `deepseek-v4-pro` opisany jako V4-Pro-0813 z własnymi cenami (1,32/3,96 USD w szczycie; poza szczytem 0,66/1,98), `deepseek-flash` 0,30/1,20 USD, aliasy V4-Flash kierowane do V4.1-Flash. Artykuł **nie** powtarza odwołanego przekierowania z 14.09.

### D1 – P1
- **Miejsce:** deepseek.md:144
- **Cytat:** „a GPT-5.6 Sol – 4 i 20 USD (stawka promocyjna). Oznacza to, że V4.1-Flash jest w warstwie wejściowej kilkanaście razy tańszy od GPT-5.6 Sol … a V4-Pro – około trzykrotnie tańszy od Sola.”
- **Problem:** Cena GPT-5.6 Sol (4/20 USD, promocja do co najmniej 21.11.2026) jest prawdziwa, ale porównanie jest przestarzałe: od 2026-09-22 aktualnym modelem średniej półki OpenAI jest GPT-6 Sol za 2/10 USD. Wobec GPT-6 Sol V4-Pro jest tańszy tylko ok. 1,5 raza, a V4.1-Flash ok. 7 razy (poza szczytem ok. 13 razy). Jest też GPT-6 Luna za 0,10/0,50 USD – tańsza od V4.1-Flash.
- **Poprawka:** „Dla porównania: najmocniejszy model OpenAI w API, GPT-6 Astra, kosztuje 10 USD za milion tokenów wejściowych i 50 USD za wyjściowe, a wydany 22 września 2026 roku GPT-6 Sol – 2 i 10 USD. Oznacza to, że **V4.1-Flash jest w warstwie wejściowej ok. 7 razy tańszy** od GPT-6 Sol (poza szczytem – ok. 13 razy) i ponad 30 razy tańszy od GPT-6 Astra, a V4-Pro – ok. 1,5 raza tańszy od GPT-6 Sol. Przewaga cenowa nie jest już jednak bezwzględna: najmniejszy GPT-6 Luna (0,10 USD wejście, 0,50 USD wyjście) kosztuje mniej niż V4.1-Flash.”
- **Źródło:** https://developers.openai.com/api/docs/models, https://developers.openai.com/api/docs/models/gpt-5.6-sol, https://api-docs.deepseek.com/quick_start/pricing/

### D2 – P1
- **Miejsce:** deepseek.md:78–80 (frontmatter `sources`, „GPT-5.6 Sol”)
- **Cytat:** „Cena GPT-5.6 Sol – 4 USD … (stawka promocyjna do 21 listopada 2026).”
- **Problem:** Źródło służy do porównania cenowego z D1 – po zmianie tekstu powinno wskazywać GPT-6 Sol. (Notatka „do 21 listopada” jest nieprecyzyjna – OpenAI pisze „at least through November 21, 2026”.)
- **Poprawka:** zastąpić wpisem: title „GPT-6 Sol”, url `https://developers.openai.com/api/docs/models`, note: „OpenAI API Docs. GPT-6 Sol (od 22 września 2026) – 2 USD za milion tokenów wejściowych i 10 USD za wyjściowe; GPT-6 Luna – 0,10 i 0,50 USD; okno 1,05 mln tokenów.”
- **Źródło:** https://developers.openai.com/api/docs/models

### D3 – P2
- **Miejsce:** deepseek.md:170
- **Cytat:** „Jako model otwarty nie ma własnego bota indeksującego sieć w czasie rzeczywistym. Jego wiedza o Twojej marce pochodzi przede wszystkim z danych treningowych”
- **Problem:** Brak własnego crawlera jest prawdą, ale asystent DeepSeek (chat.deepseek.com, aplikacje) ma przycisk „Search”, który pobiera wyniki z sieci – więc dla użytkowników aplikacji wiedza nie pochodzi wyłącznie z treningu.
- **Poprawka:** „DeepSeek nie publikuje własnego bota indeksującego sieć, więc nie odblokujesz go w `robots.txt`, jak `PerplexityBot` czy `GPTBot`. Jego wiedza o Twojej marce pochodzi głównie z danych treningowych – zbiorów takich jak Common Crawl. Wyjątkiem jest tryb wyszukiwania w aplikacji i na chat.deepseek.com: po włączeniu przycisku „Search” asystent pobiera aktualne wyniki z sieci, więc dobrze zaindeksowane, cytowalne treści także tu mają znaczenie.”
- **Źródło:** https://www.techradar.com/computing/social-media/what-is-deepseek-everything-you-need-to-know-about-the-new-chatgpt-rival-thats-taken-the-app-store-by-storm (źródło wtórne) – źródło danych wyszukiwarki DeepSeek: **niezweryfikowane**

### D4 – P3
- **Miejsce:** deepseek.md:36, 74, 123
- **Cytat:** „552 mld parametrów, 8–16 mld aktywnych”
- **Problem:** Uproszczenie – według DeepSeeka architektura Causal Encoder–Decoder ma 8 mld aktywnych parametrów dla wejścia i 16 mld dla wyjścia (to nie zakres).
- **Poprawka:** „552 mld parametrów, 8 mld aktywnych przy przetwarzaniu wejścia i 16 mld przy generowaniu”; w tabeli: „552 mld (8 mld wejście / 16 mld wyjście)”.
- **Źródło:** https://api-docs.deepseek.com/news/news260910

### D5 – P3
- **Miejsce:** deepseek.md:170
- **Cytat:** „DeepSeek zachowuje się inaczej niż SearchGPT”
- **Problem:** SearchGPT – nazwa prototypu; obecnie ChatGPT Search.
- **Poprawka:** „DeepSeek zachowuje się inaczej niż wyszukiwanie w ChatGPT”
- **Źródło:** https://developers.openai.com/api/docs/bots

---

## perplexity.md

### X1 – P1
- **Miejsce:** perplexity.md:108
- **Cytat:** „autorskich modeli Perplexity z serii Sonar. Te ostatnie bazują na architekturze open-source Llama od Meta”
- **Problem:** Przestarzały opis (czerwona flaga z baseline). W aplikacji tryb „Best” dobiera model per zapytanie; lista modeli obejmuje Sonar 2 i modele zewnętrzne (GPT-5.6, Gemini 3.7 Flash, Claude Sonnet 5, Kimi K3, GLM 5.3, Grok 4.6, Nemotron 3 Ultra; w Max także GPT-5.6 Sol i Claude Opus 5 – źródło wtórne). Opis Sonara jako „Llama” nie odpowiada obecnej ofercie; Sonar API jest wyłączane 2026-09-27.
- **Poprawka:** „Perplexity nie jest pojedynczym modelem. To warstwa nadrzędna zarządzająca wieloma modelami językowymi. Domyślny tryb „Best” sam dobiera model do zapytania, a w planach Pro i Max użytkownik może wybrać m.in. modele OpenAI (GPT), Anthropic (Claude), Google (Gemini), xAI (Grok), Moonshot AI (Kimi) oraz autorski model Perplexity Sonar 2, dostrojony do odpowiedzi opartych na danych z sieci. Lista modeli zmienia się co kilka tygodni.”
- **Źródło:** https://docs.perplexity.ai/changelog; lista modeli w aplikacji – baseline, źródło wtórne (centrum pomocy Perplexity zwraca 403) – **niezweryfikowane oficjalnie**

### X2 – P2
- **Miejsce:** perplexity.md:56–58 (frontmatter `sources`, „Perplexity Crawlers”) i 178
- **Cytat:** „Rola PerplexityBot i sterowanie jego dostępem przez robots.txt.” / „sprawdź, czy `PerplexityBot` nie jest blokowany”
- **Problem:** Artykuł pomija drugi bot – Perplexity-User (pobieranie stron na żądanie użytkownika), który według dokumentacji „generally ignores robots.txt rules”. Dla właściciela strony to istotne: blokada w robots.txt nie zatrzyma pobrań na żądanie.
- **Poprawka (note):** „Perplexity, dokumentacja. Dwa boty: PerplexityBot (indeksowanie na potrzeby wyników, respektuje robots.txt) i Perplexity-User (pobieranie stron na żądanie użytkownika, zwykle ignoruje robots.txt); żaden nie służy do trenowania modeli.” Oraz dopisać w linii 178: „Pamiętaj, że drugi bot, `Perplexity-User`, pobiera strony na żądanie użytkownika i zwykle ignoruje reguły `robots.txt` – żeby go zatrzymać, trzeba blokować po adresach IP (lista: perplexity.com/perplexity-user.json).”
- **Źródło:** https://docs.perplexity.ai/guides/bots

### X3 – P2
- **Miejsce:** perplexity.md:106–110 (sekcja „Jakie modele LLM wykorzystuje Perplexity”) – brak treści
- **Cytat:** – (brak wzmianki o API)
- **Problem:** Brak ważnej zmiany dla firm integrujących Perplexity: Sonar API (chat completions) zostaje wyłączone 2026-09-27, a jego miejsce zajmuje Agent API (mapowanie: `sonar` → preset `fast`, `sonar-pro` → `low`, `sonar-reasoning-pro` → `medium`, `sonar-deep-research` → `high`). We wrześniu Agent API dodało GPT-6 Sol, GPT-6 Luna, Claude Opus 5.5, Grok 4.7 i Gemini 3.8 Flash.
- **Poprawka (nowy akapit po linii 110):** „Deweloperzy korzystają z Perplexity przez API. 27 września 2026 roku firma wyłącza dotychczasowe Sonar API – zastępuje je Agent API, które łączy wyszukiwanie w sieci z wieloetapowym researchem, narzędziami i dostępem do wielu modeli (we wrześniu doszły m.in. GPT-6 Sol, Claude Opus 5.5, Grok 4.7 i Gemini 3.8 Flash). Dotychczasowe modele Sonar mają odpowiedniki w postaci presetów Agent API.”
- **Źródło:** https://community.perplexity.ai/t/sonar-is-moving-to-the-agent-api/5802, https://docs.perplexity.ai/changelog

### X4 – P2
- **Miejsce:** perplexity.md:131–143 (sekcja „Spaces, Comet i ekosystem agentowy”) – brak treści
- **Cytat:** –
- **Problem:** Brak nowości z 2026-09-24: Fast Search w Search API (`search_type: "fast"`, także w narzędziu `web_search` Agent API, 1 USD za 1000 zapytań) na nowym silniku wyszukiwania i rankingu Photon (Rust). Istotne dla GEO – kolejna warstwa wyszukiwania, z której korzystają agenci AI.
- **Poprawka (dopisać):** „We wrześniu 2026 roku Perplexity udostępniło też Fast Search – szybki tryb Search API dla agentów AI, działający na nowym silniku wyszukiwania i rankingu Photon. Dla marek to sygnał, że indeks Perplexity coraz częściej zasila nie tylko własną aplikację, ale też cudze agenty i narzędzia.”
- **Źródło:** https://docs.perplexity.ai/changelog, https://community.perplexity.ai/t/introducing-fast-search-in-the-perplexity-search-api/6195; szczegóły Photon (Rust, opóźnienia) – źródło wtórne: https://pasqualepillitteri.it/en/news/18225/perplexity-fast-search-photon-rust-engine-en

### X5 – P3
- **Miejsce:** perplexity.md:22–25, 118–119 (FAQ i tabela planów)
- **Cytat:** „~5 zapytań Pro dziennie” / „Pro | 20 USD | Nieograniczone zapytania … | Bez limitu”
- **Problem:** Limity planów Free/Pro nie dały się potwierdzić w oficjalnym źródle (centrum pomocy blokuje pobieranie); ceny Pro 20 USD i Max 200 USD oraz Model Council w Max są zgodne ze źródłami.
- **Poprawka:** do ręcznej weryfikacji na perplexity.ai/pro; do tego czasu złagodzić: „Limit zapytań w trybie Pro (…) w planie darmowym wynosi zwykle kilka dziennie”.
- **Źródło:** **niezweryfikowane** (https://www.perplexity.ai/help-center – 403)

---

## jev.md

Stan faktów zgodny z dokumentacją: `jev-1.13.0` nadal najnowszy (`jev-latest` i `jev-preview` → 1.13.0), 0,042 USD/MTok wejścia, wyjście bezpłatne, 64K kontekstu, 250 tys. tokenów/s, 1200 zapytań/min, tylko tekst. Porównania z GPT-5.6 Terra i Claude Opus 5 to wyniki ewaluacji producenta – poprawnie opisane jako dane TypeSafe, nie flagujemy.

### J1 – P3
- **Miejsce:** jev.md:5 (frontmatter)
- **Cytat:** „date: 2026-09-22” – brak pola `updated`
- **Problem:** Brak pola `updated` (pozostałe artykuły klastra je mają; wpływa na „Ostatnia aktualizacja” i `dateModified`, jeśli szablon go używa).
- **Poprawka:** dodać `updated: 2026-09-25` (po weryfikacji) lub świadomie pozostawić do pierwszej aktualizacji treści.
- **Źródło:** –

### J2 – P3
- **Miejsce:** jev.md:149–153, 58–59 (tabela ewaluacji, `sources` „Workflow Evals”)
- **Cytat:** „| Jev | 0,0004 USD | 0,4 s | 67,8% |”
- **Problem:** Strona evals.typesafe.ai pokazuje obecnie wyniki per zadanie i per podejście (workflow/prompt), m.in. Jev workflow od 0,0001 USD i 0,3 s, oraz więcej modeli (Sonnet 5, DeepSeek V4 Flash/Pro, GPT-5.6 Sol/Luna). Nie udało się odtworzyć zagregowanych wartości z tabeli; brak też na stronie najnowszych modeli (Opus 5.5, GPT-6 Sol/Luna). Warto dopisać, że ewaluacja nie obejmuje modeli z 22 września.
- **Poprawka (dopisać pod tabelą):** „Ewaluacja TypeSafe powstała przed premierą Claude Opus 5.5 oraz GPT-6 Sol i Luna (22 września 2026), więc nie uwzględnia najnowszych modeli.”
- **Źródło:** https://evals.typesafe.ai/ – zagregowane liczby: **niezweryfikowane**

---

## Rzeczy sprawdzone, bez uwag
- grok.md: ceny Grok 4.6/4.5/4.3 i >200K, cache 0,50 USD, grok-build-0.1 256K, Voice API 0,08 USD/min – zgodne z docs.x.ai.
- copilot.md: 30 USD Enterprise, Business 21 USD / 18 USD promocyjnie (1.07–31.12.2026), GitHub Pro 10 USD / 1500 kredytów, Pro+ 39 USD / 7000, Max 100 USD / 20 000, Free 2000 uzupełnień, Auto / Quick response / Think deeper – zgodne.
- deepseek.md: ceny, ID, kontekst 1M / 384K wyjścia, godziny szczytu, aliasy V4-Flash, wycofanie `deepseek-chat`/`deepseek-reasoner` 24.07.2026, brak twierdzenia o przekierowaniu V4-Pro – zgodne.
- perplexity.md: Model Council tylko w Max, Max 200 USD – zgodne; dane historyczne (780 mln zapytań w maju 2025, wycena) poprawnie datowane.
