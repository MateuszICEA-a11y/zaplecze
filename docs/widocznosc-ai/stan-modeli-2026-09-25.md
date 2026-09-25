# Stan rynku modeli AI – baseline do audytu widocznosc.ai

Data stanu: **2026-09-25**. Źródła: oficjalne dokumentacje, cenniki, changelogi i blogi dostawców (WebFetch/WebSearch 2026-09-25). Fakty z serwisów trzecich oznaczone „(źródło wtórne)”. Czego nie dało się potwierdzić – „NIEZWERYFIKOWANE”. Ceny API w USD za 1 mln tokenów (wejście / wyjście), taryfa standardowa.

Sekcje oznaczone „[zweryfikowane wcześniej]” pochodzą z weryfikacji zleceniodawcy (2026-09-25) i nie były ponownie badane, chyba że wskazano sprzeczność.

---

## 1. Anthropic (Claude)

### Modele aktualne [zweryfikowane wcześniej + potwierdzone w cenniku]
| Model | Cena API | Kontekst / wyjście | Uwagi |
|---|---|---|---|
| Claude Fable 5.1 | $10 / $50 | 1M / 128K | domyślny effort high |
| Claude Opus 5.5 | $4 / $20 | 1M / 128K | premiera 2026-09-22; adaptive thinking zawsze włączony, domyślny effort medium |
| Claude Sonnet 5 | $2 / $10 | 1M | $2/$10 to już cena standardowa – zapowiadana podwyżka do $3/$15 od 2026-09-01 **nie weszła w życie** |
| Claude Haiku 4.5 | $1 / $5 | 200K | |

- Legacy, ale dostępne: Fable 5, Opus 5, Opus 4.8, 4.7, 4.6, 4.5, Sonnet 4.6, 4.5.
- Sonnet 5.5 i Haiku 5.5 zapowiedziane „w najbliższych tygodniach”. Claude Marketplace uruchomiony 2026-09-23. [zweryfikowane wcześniej]
- Źródło cen: https://platform.claude.com/docs/en/about-claude/pricing (2026-09-25)

### Claude Mythos 5.1 – status
- Status w tabeli lifecycle: **Active**, retirement „nie wcześniej niż 2027-09-01”.
- **Ograniczona dostępność** – tylko na zaproszenie w ramach Project Glasswing (kontakt przez opiekuna Anthropic, AWS lub Google Cloud). Cena jak Fable 5.1: $10 / $50.
- To ten sam model bazowy co Fable 5.1, ale bez części zabezpieczeń (cyber, biologia); wymaga zgody na 30-dniową retencję danych do monitoringu bezpieczeństwa.
- Mythos 5 – też aktywny, też tylko Glasswing. `claude-mythos-preview` – **Deprecated** od 2026-06-09 (data wycofania do ogłoszenia).
- Źródła: https://platform.claude.com/docs/en/about-claude/pricing, https://platform.claude.com/docs/en/about-claude/model-deprecations, https://platform.claude.com/docs/en/models/mythos-5-1/overview (fragment z wyników wyszukiwania), https://www.anthropic.com/glasswing

### Wyszukiwanie w sieci (Claude web search)
- W aplikacji Claude: web search dostępny globalnie **na wszystkich planach, także darmowym**, od 2025-05-27. Źródło: https://claude.com/blog/web-search
- API: narzędzie web search kosztuje $10 za 1000 wyszukiwań plus tokeny; wersje `web_search_20250305`, `web_search_20260209` (dynamic filtering), `web_search_20260318` (response inclusion). Niedostępne na Amazon Bedrock; na Google Cloud tylko wersja podstawowa. Źródło: https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-search-tool (2026-09-25)

### Crawlery Anthropic
| Bot | Rola | robots.txt |
|---|---|---|
| ClaudeBot | zbiera treści, które mogą trafić do trenowania modeli | respektuje |
| Claude-User | pobiera strony, gdy użytkownik Claude zada pytanie | respektuje (wg artykułu wszystkie boty respektują robots.txt) |
| Claude-SearchBot | indeksuje sieć na potrzeby jakości wyników wyszukiwania w Claude | respektuje |

- Obsługuje też niestandardowe `Crawl-delay`. Artykuł datowany **2026-04-07**.
- Źródło: https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler

---

## 2. OpenAI (ChatGPT, API)

### Modele API – aktualne
| Model | ID | Cena | Kontekst / wyjście | Data |
|---|---|---|---|---|
| GPT-6 Astra | `gpt-6-astra` | $10 / $50 | 1,05M / 128K | API od 2026-09-03 [zweryfikowane wcześniej] |
| GPT-6 Sol | `gpt-6-sol` | $2 / $10 | 1,05M / 128K | 2026-09-22 |
| GPT-6 Luna | `gpt-6-luna` | $0,10 / $0,50 | 1,05M / 128K | 2026-09-22 |

- Źródło: https://developers.openai.com/api/docs/models (2026-09-25)
- GPT-6 Sol/Luna zastępują GPT-5.6 Sol/Luna; **nie ma GPT-6 Terra** [zweryfikowane wcześniej]. Uwaga: `gpt-5.6-terra` nadal istnieje w API i jest wskazywany jako zamiennik wielu wycofywanych modeli (https://developers.openai.com/api/docs/deprecations).
- Seria GPT-5.6 (Sol, Terra, Luna) – premiera 2026-07-09; nowa konwencja nazw: numer = generacja, Sol/Terra/Luna = poziomy możliwości. Ceny premierowe 5.6 (lipiec): Sol $5/$30, Terra $2,50/$15, Luna $1/$6. **Aktualne ceny API (cennik OpenAI, sprawdzone przez audyt 2026-09-25): Sol $4/$20 (promocja co najmniej do 21.11.2026), Terra $2/$12, Luna $0,20/$1,20.** Źródła: https://openai.com/index/gpt-5-6/ (fragment z wyszukiwarki), https://community.openai.com/t/introducing-gpt-5-6-series-sol-terra-and-luna-coming-july-9-10am-pt/1384931 (data z tytułu wątku).

### ChatGPT – co działa domyślnie (stan 2026-09-25)
- **Free i Go**: domyślny model czatu to **GPT-5.6 Luna** (napędza też przycisk „Think”); brak dostępu do GPT-5.6 Sol. Źródło: https://openai.com/index/improving-gpt-5-6-sol-in-chatgpt/ (strona zwraca 403 – treść z opisu w wynikach wyszukiwania na openai.com).
- **Plus i Pro**: w czacie działa zaktualizowany **GPT-5.6 Sol** z suwakiem ilości „myślenia”. Źródło jw.
- **GPT-6 w ChatGPT**: GPT-6 Sol i Luna działają w **ChatGPT Work i Codex** (Plus, Pro, Business, Enterprise, Edu), osobno od modeli w zwykłym czacie; Free i Go mają GPT-6 Luna tylko w aplikacji desktopowej. Źródło: https://openai.com/index/introducing-gpt-6-sol-and-luna/ (fragment z wyszukiwarki), potwierdzone przez TechCrunch 2026-09-22 (źródło wtórne).
- **GPT-6 Pro** (napędzany GPT-6 Astra) – w ChatGPT dla planów Pro ($100 i $200), Business i Enterprise. Źródło: https://help.openai.com/en/articles/20001354-gpt-56-and-gpt-6-pro-in-chatgpt (tytuł i fragment z wyszukiwarki; strona 403).
- GPT-4.5 niedostępny w ChatGPT od 2026-06-26 (rozmowy przeniesione na GPT-5.5). Źródło: https://help.openai.com/en/articles/6825453-chatgpt-release-notes (fragment z wyszukiwarki; strona 403).
- Dokładna, kompletna tabela modeli per plan: **NIEZWERYFIKOWANE** (help.openai.com blokuje pobieranie).

### ChatGPT Search
- Funkcje wyszukiwania ChatGPT działają; to do nich służy OAI-SearchBot (dokumentacja botów, 2026-09-25). Konkretnych zmian w samym ChatGPT Search w 2026: **NIEZWERYFIKOWANE**.
- Reklamy w ChatGPT: testy w USA od 2026-02-09, rozszerzenie m.in. na UK, Meksyk, Brazylię, Japonię, Koreę Płd. (2026-08-11). Źródła: https://openai.com/index/testing-ads-in-chatgpt/, https://help.openai.com/en/articles/20001047-ads-in-chatgpt (fragmenty z wyszukiwarki).

### Crawlery OpenAI (https://developers.openai.com/api/docs/bots, 2026-09-25)
| Bot | UA (wersja) | Rola | robots.txt |
|---|---|---|---|
| OAI-SearchBot | `OAI-SearchBot/1.4` | pokazywanie stron w wynikach wyszukiwania ChatGPT | respektuje |
| GPTBot | `GPTBot/1.4` | treści, które mogą trafić do trenowania modeli bazowych | respektuje |
| ChatGPT-User | `ChatGPT-User/1.0` | akcje inicjowane przez użytkownika (ChatGPT, Custom GPTs) | **„robots.txt rules may not apply”** |
| OAI-AdsBot | `OAI-AdsBot/1.0` | **nowy** – weryfikacja bezpieczeństwa stron docelowych reklam w ChatGPT; dane nie służą do trenowania | brak deklaracji |

- Zmiany istotne dla audytu: (1) wersje UA to już 1.4 dla SearchBot/GPTBot; (2) **ChatGPT-User nie jest już opisywany jako respektujący robots.txt**; (3) nowy OAI-AdsBot; (4) OpenAI może użyć jednego crawla do obu celów (search i trening), jeśli oba boty są dopuszczone; (5) zmiany w robots.txt – ok. 24 h.
- Listy IP: openai.com/searchbot.json, /gptbot.json, /chatgpt-user.json, /adsbot.json.

---

## 3. Google (Gemini, AI Overviews, AI Mode)

### Najnowsze modele tekstowe w API
- **Najnowszy model Pro to nadal Gemini 3.1 Pro – wciąż jako Preview** (`gemini-3.1-pro-preview`, premiera 2026-02-19). Gemini 3.5 Pro **nie został wydany** – na stronie DeepMind widnieje „3.5 Pro coming soon”; zapowiadany na I/O (2026-05-19) „w przyszłym miesiącu”, 2026-07-21 Google napisał, że jest „testowany z partnerami”. Źródła: https://ai.google.dev/gemini-api/docs/models (akt. 2026-09-24), https://deepmind.google/models/gemini/, https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-6-flash-3-5-flash-lite-3-5-flash-cyber/
- **Gemini 3.8 Flash** – GA **2026-09-02** (`gemini-3.8-flash`), „najbardziej inteligentny model Flash”. Równolegle Gemini 3.8 Flash Cyber (tylko dla zaufanych obrońców w programie Fairwind). Źródła: https://ai.google.dev/gemini-api/docs/changelog, https://blog.google/innovation-and-ai/models-and-research/gemini-models/3-8-flash-and-3-8-flash-cyber/
- Kolejne Flash w 2026: 3.5 Flash (GA 2026-05-19, alias `gemini-flash-latest`), 3.6 Flash i 3.5 Flash-Lite (GA 2026-07-21), 3.7 Flash (GA 2026-08-13), 3.8 Flash (GA 2026-09-02). 3.1 Flash-Lite GA 2026-05-07.
- Na stronie DeepMind jako bieżące wymienione są: 3.8 Flash, 3.5 Flash-Lite, 3.1 Pro, 3.1 Deep Think.
- Audio/inne [zweryfikowane wcześniej + changelog]: 3.8 Live i Live Extended Thinking (GA 2026-09-15), 3.8 Flash TTS / Flash-Lite TTS (changelog API: 2026-09-22; zleceniodawca: 09-23), Live Avatar (09-24), Omni Flash `gemini-omni-1.1-flash` (GA 2026-08-27), Lyria 3.5 (2026-09-03), Gemma 4 (2026-04-02).
- Gemini 2.5 (Pro, Flash, Flash-Lite): **ograniczony dostęp tylko dla dotychczasowych aktywnych użytkowników** od 2026-09-18; nowe projekty mają używać 3.5 Flash-Lite lub 3.8 Flash.

### Ceny API (https://ai.google.dev/gemini-api/docs/pricing, 2026-09-25)
| Model | Wejście | Wyjście | Uwagi |
|---|---|---|---|
| Gemini 3.1 Pro Preview | $2 (≤200K) / $4 (>200K) | $12 / $18 | |
| Gemini 3.8 Flash | $0,75 | $3,75 | cena promocyjna do 2026-12-31; od 2027-01-01 $1,50 / $7,50 |
| Gemini 3.7 Flash | $0,75 | $3,75 | jw. |
| Gemini 3.6 Flash | $0,75 | $3,75 | jw. |
| Gemini 3.5 Flash | $1,50 | $9,00 | |
| Gemini 3.5 Flash-Lite | $0,30 | $2,50 | |
| Gemini 3.1 Flash-Lite | $0,25 | $1,50 | wycofanie nie wcześniej niż 2027-05-07 |
| Gemini 3 Flash Preview | $0,50 | $3,00 | |

### Aplikacja Gemini, AI Mode, AI Overviews
- **AI Mode**: od I/O 2026 (2026-05-19) domyślnym modelem globalnie jest **Gemini 3.5 Flash** („Gemini 3.5 Flash as the new default model, globally”). Źródło: https://blog.google/innovation-and-ai/technology/ai/google-io-2026-all-our-announcements/
- Czy domyślny model AI Mode zmieniono po 3.5 Flash: **NIEZWERYFIKOWANE** (Search Engine Journal 2026-09-02: darmowi użytkownicy nie mają wyboru modelu – źródło wtórne).
- 3.7 Flash (2026-08-13) i 3.8 Flash (2026-09-02) trafiły do AI Mode i aplikacji Gemini **dla subskrybentów Google AI Pro i Ultra** jako opcja w menu modeli. Źródło: blog 3.8 Flash (jw.); 3.7 Flash – https://blog.google/innovation-and-ai/models-and-research/gemini-models/introducing-gemini-3-7-flash/ (fragment z wyszukiwarki).
- **Aplikacja Gemini**: 3.6 Flash (2026-07-21) udostępniony „for everyone via the Gemini app”. Czy jest domyślny dla darmowych użytkowników – oficjalnie **NIEZWERYFIKOWANE** (serwisy trzecie twierdzą, że tak – źródło wtórne). Strona pomocy Google opisuje wybór „Flash-Lite / Flash / 3 Pro” i różnice w poziomach myślenia oraz kontekście (Free 32K, AI Plus 128K, AI Pro/Ultra 1M) – https://support.google.com/gemini/answer/16275805.
- **AI Overviews**: oficjalnej informacji, który konkretny model 3.x obecnie je napędza – **NIEZWERYFIKOWANE**.

### Crawlery i kontrola dla wydawców
- **Nowość 2026 – „Search generative AI control” w Search Console**: przełącznik decydujący, czy witryna może pojawiać się i uziemiać odpowiedzi w AI Overviews, AI Mode i funkcjach generatywnych Discover. Testy w UK od 2026-06-03, **globalnie od 2026-08-31**. Nie jest sygnałem rankingowym dla reszty wyszukiwarki; wyłączenie = zero ruchu i wyświetleń z tych funkcji. Nie dotyczy trenowania (do tego Google-Extended). Źródła: https://support.google.com/webmasters/answer/16908024, https://blog.google/products-and-platforms/products/search/new-controls-website-owners/
- Search Console: nowe raporty wyświetleń stron w funkcjach generatywnych AI (te same źródła).
- **Google-Extended**: steruje trenowaniem przyszłych modeli Gemini (Gemini Apps, Vertex AI) oraz uziemianiem w Gemini Apps i „Grounding with Google Search” na Vertex AI; **nie wpływa** na obecność w Google Search ani na ranking. Pozostałe tokeny: Google-CloudVertexBot, GoogleOther. Strona zaktualizowana 2026-07-14. Źródło: https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers
- **llms.txt**: Google – „You don't need to create new machine readable files, AI text files, or markup to appear in these features” oraz brak specjalnych danych strukturalnych dla AI. Źródło: https://developers.google.com/search/docs/appearance/ai-features (akt. 2025-12-10).

---

## 4. Microsoft Copilot

- **Microsoft 365 Copilot** (Word, Excel, PowerPoint, Chat, Cowork, Copilot Studio): wielomodelowy. GPT-5.6 jako „preferred model” od lipca 2026 (https://openai.com/index/gpt-5-6-preferred-model-microsoft-365-copilot/, fragment z wyszukiwarki; TechCrunch 2026-07-09 – źródło wtórne). Wrzesień 2026: dochodzą **Claude Opus 5.5 i GPT-6 Sol**; GPT-6 Astra i Claude Fable 5.1 w Copilot Cowork i Copilot Studio (od 2026-09-01). Źródło: https://techcommunity.microsoft.com/blog/microsoft-copilot-blog/more-models-one-copilot/4559035 (treść nie dała się pobrać – dane z fragmentów wyszukiwarki i Windows Report – źródło wtórne). Wcześniej także Claude Opus 4.8.
- Własne modele Microsoft (MAI): m.in. MAI-Code-1 (Copilot, VS Code), MAI-Voice-2, MAI Transcribe 1.5 (Build 2026, https://blogs.microsoft.com/blog/2026/06/02/microsoft-build-2026-be-yourself-at-work/ – fragment z wyszukiwarki).
- **Konsumencki Copilot (copilot.microsoft.com, aplikacja) i Copilot Search w Bing**: jaki model je obecnie napędza – **NIEZWERYFIKOWANE** (brak oficjalnej informacji w źródłach Microsoft).

---

## 5. Perplexity

- **Sonar API wycofywane 2026-09-27** → Agent API [zweryfikowane wcześniej]. Mapowanie: `sonar` → preset `fast`, `sonar-pro` → `low`, `sonar-reasoning-pro` → `medium`, `sonar-deep-research` → `high`. Źródło: https://community.perplexity.ai/t/sonar-is-moving-to-the-agent-api/5802 (oficjalne forum, fragment z wyszukiwarki).
- Fast Search / Photon 2026-09-24 [zweryfikowane wcześniej]. Changelog: `search_type: "fast"` w Search API i narzędziu `web_search` Agent API.
- Agent API we wrześniu 2026 dodało GPT-6 Sol, GPT-6 Luna, Claude Opus 5.5, Grok 4.7 i Gemini 3.8 Flash; w sierpniu GLM 5.3 / 5.3 Flash; w lipcu Router API (modele open-weight). Źródło: https://docs.perplexity.ai/changelog
- **Modele w aplikacji Perplexity**: tryb „Best” dobiera model per zapytanie. Lista modeli dla Pro/Max (stan 2026-09-04): Sonar 2, GPT-5.6 Terra, Gemini 3.7 Flash, Claude Sonnet 5, Kimi K3, GLM 5.3, Grok 4.6, Nemotron 3 Ultra; Max dodatkowo GPT-5.6 Sol i Claude Opus 5 (źródło wtórne – centrum pomocy Perplexity zwraca 403). Oficjalnie: **NIEZWERYFIKOWANE**.

### Crawlery Perplexity (https://docs.perplexity.ai/guides/bots)
| Bot | Rola | robots.txt |
|---|---|---|
| PerplexityBot | pokazywanie i linkowanie stron w wynikach Perplexity; nie służy do trenowania | respektuje |
| Perplexity-User | akcje użytkownika (pobranie strony na żądanie); nie crawluje, nie trenuje | „generally ignores robots.txt rules” |

- Zmiany w robots.txt – do 24 h. IP: perplexity.com/perplexitybot.json, /perplexity-user.json.

---

## 6. xAI / SpaceXAI [zweryfikowane wcześniej]
- Marka: **SpaceXAI**. Grok 4.7 – premiera 2026-09-21, $2 / $6, kontekst 500K.

---

## 7. Meta
- **Muse** – nowa rodzina modeli Meta Superintelligence Labs. Muse Spark ogłoszony **2026-04-08**, napędza asystenta Meta AI (aplikacja Meta AI, meta.ai; start w USA, potem kolejne kraje i aplikacje). Źródło: https://about.fb.com/news/2026/04/introducing-muse-spark-meta-superintelligence-labs/ (fragment z wyszukiwarki).
- Muse Spark 1.1 – lipiec 2026 (https://ai.meta.com/blog/introducing-muse-spark-meta-model-api/; data 2026-07-09 wg Fortune – źródło wtórne).
- **Najnowszy: `muse-spark-1.3`** (dostępne też 1.2 i 1.1), kontekst 1 048 576 tokenów, przez Meta Model API (kompatybilne z SDK OpenAI i Anthropic). Inne: Muse Image 1.0, Muse Voice Transcribe 1.0, SAM 3.1, **Muse Glimmer** (open-weight, do uruchamiania lokalnie). Źródło: https://dev.meta.ai/docs/models (2026-09-25).
- **Llama**: Meta Model API nie wymienia już modeli Llama; istnieje strona „Upcoming changes to Llama API” (https://dev.meta.ai/docs/llama-api-deprecation/ – wymaga logowania). Szczegóły wycofania Llama API: **NIEZWERYFIKOWANE**. Ostatnia oficjalnie opisana generacja Llama w wynikach: Llama 4 (Scout, Maverick). Nowszej Llamy w 2026: **NIEZWERYFIKOWANE**.

## 8. Mistral (https://docs.mistral.ai/models, 2026-09-25)
- Najnowszy Large: **Mistral Large 3** (`mistral-large-2512`, grudzień 2025, MoE 41B aktywnych / 675B łącznie, open-weight).
- Najnowszy Medium: **Mistral Medium 3.5** (v26.04, kwiecień 2026, open-weight, licencja Modified MIT).
- Mistral Small 4 (marzec 2026). **Brak Mistral Large 4 i Medium 4.**

## 9. Alibaba Qwen (https://www.alibabacloud.com/help/en/model-studio/newly-released-models)
- Najnowszy flagowiec: **Qwen3.8-Max** (snapshot `qwen3.8-max-0902`, 2026-09-02).
- Qwen3.8-Flash (2026-08-26), Qwen3.7-Max (2026-05-21). Open-weight: Qwen3.5-397B-A17B (luty 2026), Qwen3.6-27B; Qwen3.8-Flash-Next jako podgląd architektury Qwen4 (https://qwen.ai/blog?id=qwen3.8-flash-next – fragment z wyszukiwarki). **Qwen4 nie jest wydany.**

## 10. DeepSeek (https://api-docs.deepseek.com)
- **DeepSeek-V4.1-Flash** – 2026-09-10 [zweryfikowane wcześniej], ID `deepseek-flash`, 1M kontekstu, 384K wyjścia, multimodalny.
- V4 (Pro i Flash) – premiera 2026-04-24; V4-Pro GA 2026-08-13; V4-Flash oficjalnie 2026-07-31.
- Stare aliasy `deepseek-chat` i `deepseek-reasoner` – wycofane **2026-07-24**.
- `deepseek-v4-flash` i `deepseek-v4-flash-vision-exp` – modele wycofane, aliasy kierowane do V4.1-Flash.
- **Przekierowanie V4 Pro odwołane**: ogłoszenie z 2026-09-10 (https://api-docs.deepseek.com/news/news260910) zapowiadało, że od 2026-09-14 wszystkie zapytania `deepseek-v4-pro` trafią do V4.1-Flash po cenach Flasha. Cennik (https://api-docs.deepseek.com/quick_start/pricing/, sprawdzony 2026-09-25) nadal mapuje `deepseek-v4-pro` na wersję DeepSeek-V4-Pro-0813 z osobnymi cenami (0,66/1,98 USD poza szczytem) – przekierowanie nie weszło w życie; źródła wtórne (TokenCost, AI Pricing Guru) potwierdzają, że DeepSeek się z niego wycofał. Data V4.1-Pro: brak.

---

## 11. Zmiany polityk crawlerów / robots / llms.txt w 2026 – podsumowanie
| Dostawca | Zmiana | Data | Źródło |
|---|---|---|---|
| Google | przełącznik „Search generative AI control” w Search Console (AI Overviews, AI Mode, Discover) | test UK 2026-06-03, globalnie 2026-08-31 | support.google.com/webmasters/answer/16908024 |
| Google | Google-Extended obejmuje także uziemianie (grounding) w Gemini Apps i Vertex AI; bez wpływu na Search | strona akt. 2026-07-14 | developers.google.com/crawling/... |
| Google | llms.txt i pliki „AI text” niepotrzebne | 2025-12-10 | developers.google.com/search/docs/appearance/ai-features |
| OpenAI | nowy OAI-AdsBot (reklamy w ChatGPT od 2026-02-09); UA SearchBot/GPTBot 1.4; ChatGPT-User – „robots.txt may not apply” | data zmian w dokumentacji: NIEZWERYFIKOWANE | developers.openai.com/api/docs/bots |
| Anthropic | 3 boty (ClaudeBot, Claude-User, Claude-SearchBot), wszystkie respektują robots.txt; Crawl-delay | artykuł 2026-04-07 | support.claude.com/.../8896518 |
| Perplexity | PerplexityBot respektuje, Perplexity-User „generally ignores” robots.txt | data: NIEZWERYFIKOWANE | docs.perplexity.ai/guides/bots |
| llms.txt (OpenAI, Anthropic, Perplexity) | oficjalnej deklaracji używania llms.txt jako sygnału w produkcyjnych wynikach: **brak / NIEZWERYFIKOWANE** (serwisy branżowe podają różne twierdzenia – źródło wtórne) | – | – |

---

## 12. Modele WYCOFANE (API wyłączone) na dzień 2026-09-25

### OpenAI (https://developers.openai.com/api/docs/deprecations)
- 2026-02-12: `codex-mini-latest`
- 2026-02-17: `chatgpt-4o-latest`
- 2026-05-07 / 05-12: `gpt-4o-realtime-preview*`, `gpt-4o-mini-realtime-preview`, `gpt-4o-audio-preview*`, `gpt-4o-mini-audio-preview`, **DALL·E 2 i DALL·E 3**
- 2026-07-23: `gpt-5-chat-latest`, `gpt-5-codex`, `gpt-5.1-chat-latest` i warianty GPT-5.1, `gpt-5.2-codex`, `o3-deep-research`, `o4-mini-deep-research`, `computer-use-preview`, `gpt-4o-(mini-)search-preview`
- 2026-08-10: `gpt-5.2-chat-latest`, `gpt-5.3-chat-latest`
- 2026-08-26: **Assistants API** (→ Responses API + Conversations API)
- 2026-09-24: Videos API i **Sora 2** (`sora-2`, `sora-2-pro`)
- Wcześniej: `gpt-4.5-preview` (2025-07-14), `o1-preview`, `o1-mini` (2025), GPT-3/Codex/embeddings pierwszej generacji.
- W ChatGPT: GPT-4.5 niedostępny od 2026-06-26.
- **Wkrótce** (nadal działają 2026-09-25): 2026-09-28 `gpt-3.5-turbo-instruct`, `babbage-002`, `davinci-002`, `gpt-3.5-turbo-1106`; 2026-10-01 `gpt-5.4-cyber`; **2026-10-23** `gpt-3.5-turbo-0125`, `gpt-4-0613`, `gpt-4-turbo`, `gpt-4-1106-preview`, `gpt-4.1-nano`, `gpt-4o-2024-05-13`, `o1`, `o1-pro`, `o3-mini`, `o4-mini`, `gpt-image-1`; 2026-12-01 `gpt-image-1-mini`, `gpt-image-1.5`; **2026-12-11** `gpt-5` / `gpt-5-mini` / `gpt-5-nano` (2025-08-07), `gpt-5-pro`, `o3`, `o3-pro`; 2027-01-20 starsze `gpt-realtime`/`gpt-audio`; 2027-02-26 `whisper-1`, `gpt-4o-transcribe`.
- Brak wpisu o wycofaniu (wg zapytania do strony): `gpt-4o`, `gpt-4o-mini`, `gpt-4.1`, `gpt-4.1-mini`, `gpt-5.1`, `gpt-5.2`, `gpt-5.5` – działają, ale są to modele starszych generacji.

### Anthropic (https://platform.claude.com/docs/en/about-claude/model-deprecations)
- Wycofane: Claude 1.x i Instant (2024-11-06), Claude 2.0, 2.1, Claude 3 Sonnet (2025-07-21), Claude 3.5 Sonnet (obie wersje, 2025-10-28), **Claude 3 Opus (2026-01-05)**, **Claude 3.7 Sonnet i Claude 3.5 Haiku (2026-02-19)**, **Claude 3 Haiku (2026-04-20)**, **Claude Sonnet 4 i Claude Opus 4 (2026-06-15)**, **Claude Opus 4.1 (2026-08-05)**.
- Uwaga: Opus 4.1, Sonnet 4, Haiku 3.5 mogą być jeszcze dostępne na Bedrock/Google Cloud; Opus 4 – na Google Cloud.
- Deprecated: `claude-mythos-preview` (od 2026-06-09).
- Najbliższe możliwe daty wycofania: Sonnet 4.5 – nie wcześniej niż 2026-09-29; Haiku 4.5 – 2026-10-15; Opus 4.5 – 2026-11-24.

### Google Gemini API (https://ai.google.dev/gemini-api/docs/changelog, /deprecations)
- Wyłączone: `text-embedding-004` (2026-01-14), `gemini-2.5-flash-image-preview` (2026-01-15), `gemini-2.5-flash-preview-09-25` i część Imagen (2026-02-17), **`gemini-3-pro-preview` (Gemini 3 Pro Preview, 2026-03-09)**, `gemini-2.5-flash-lite-preview-09-2025` (2026-03-31), `gemini-robotics-er-1.5-preview` (2026-04-30), `gemini-3.1-flash-lite-preview` (2026-05-25), **Gemini 2.0 Flash i 2.0 Flash-Lite (wszystkie warianty, 2026-06-01)**, `gemini-3.1-flash-image-preview` i `gemini-3-pro-image-preview` (2026-06-25), **Veo 2.0 i Veo 3.0 (2026-06-30)**, **Imagen 4 i modele Gemini 3 Image (2026-08-17)**, `gemini-robotics-er-1.6-preview` (2026-08-31).
- Wkrótce: `gemini-omni-flash-preview` (2026-09-30), `gemini-2.5-flash-image` (2026-10-02), `antigravity-preview-05-2026` (2026-10-05).
- Gemini 2.5 Pro/Flash/Flash-Lite – nie wyłączone, ale od 2026-09-18 **dostępne tylko dla dotychczasowych aktywnych użytkowników**.

---

## Czerwone flagi dla audytu

Frazy/twierdzenia, które na 2026-09-25 są nieaktualne lub błędne. Szukać także wariantów odmienionych po polsku.

### OpenAI
- „GPT-5.6 to najnowszy model OpenAI” / „GPT-5.6 Sol to flagowiec OpenAI” – nieaktualne: od 2026-09-03 GPT-6 Astra, od 2026-09-22 GPT-6 Sol i Luna. (Wyjątek: poprawne jest „GPT-5.6 Sol/Luna napędza domyślny czat ChatGPT”.)
- „GPT-5.5 / GPT-5 / GPT-4o to model ChatGPT” (w czasie teraźniejszym) – nieaktualne; Free/Go: GPT-5.6 Luna, Plus/Pro: GPT-5.6 Sol.
- „GPT-6 Terra” – nie istnieje.
- Ceny GPT-5.6 podane jako ceny flagowca OpenAI – nieaktualne (flagowiec to GPT-6 Astra $10/$50). Aktualne ceny GPT-5.6: Sol $4/$20 (promocja), Terra $2/$12, Luna $0,20/$1,20 – artykuły z tymi stawkami są poprawne.
- „GPT-4.5”, „o1-preview”, „o1-mini”, „chatgpt-4o-latest”, „DALL·E 3”, „Sora 2”, „Assistants API” jako dostępne – wycofane.
- „o3 / o4-mini to najlepsze modele rozumujące OpenAI” – przestarzałe (o4-mini wyłączany 2026-10-23, o3 – 2026-12-11).
- „ChatGPT-User respektuje robots.txt” – dokumentacja OpenAI mówi „robots.txt rules may not apply”.
- Lista botów OpenAI bez OAI-AdsBot lub z wersjami UA 1.0/1.1 jako aktualnymi – niekompletna.
- „ChatGPT nie ma reklam” – nieaktualne (testy od 2026-02-09).

### Anthropic
- „Claude Opus 4.x / Claude 4 to najnowszy model Anthropic”, „Claude Sonnet 4.5 / 4.6 jako flagowiec” – nieaktualne (Fable 5.1, Opus 5.5, Sonnet 5).
- „Claude 3.5 Sonnet”, „Claude 3.7 Sonnet”, „Claude 3 Opus”, „Claude 3 Haiku”, „Claude 3.5 Haiku”, „Claude Sonnet 4”, „Claude Opus 4”, „Claude Opus 4.1” jako dostępne w API – wycofane.
- „Sonnet 5 zdrożeje do $3/$15 od września” – nie weszło w życie; $2/$10 to cena standardowa.
- „Claude Mythos jest ogólnodostępny” – nie, tylko na zaproszenie (Project Glasswing).
- „Anthropic ma tylko jednego bota (ClaudeBot)” lub nazwy „anthropic-ai”, „Claude-Web” jako aktualne boty – nieaktualne; obecne: ClaudeBot, Claude-User, Claude-SearchBot.
- „Claude nie ma dostępu do internetu / web search tylko w płatnych planach” – nieaktualne (wszystkie plany od 2025-05-27).

### Google
- „Gemini 3.1 Pro jako flagowiec” – **nadal poprawne** (wciąż Preview; 3.5 Pro niewydany). Czerwona flaga natomiast: „Gemini 3.5 Pro jest dostępny / wydany”, „Gemini 4”.
- „Gemini 3 Pro” jako aktualny model API – `gemini-3-pro-preview` wyłączony 2026-03-09.
- „Gemini 2.0 Flash” jako aktualny – wyłączony 2026-06-01. „Gemini 2.5 Pro/Flash” jako aktualne – już tylko legacy z ograniczonym dostępem.
- „Najnowszy Flash to 3.5 / 3.6 / 3.7 Flash” – nieaktualne; najnowszy to 3.8 Flash (2026-09-02).
- „AI Mode działa na Gemini 3 Flash / 2.5” – nieaktualne; od 2026-05-19 domyślny jest 3.5 Flash (płatni mogą wybrać 3.7/3.8 Flash).
- „Nie da się zrezygnować z AI Overviews bez utraty widoczności w Google” / „jedyne opcje to nosnippet lub noindex” – nieaktualne; od 2026-08-31 jest przełącznik w Search Console.
- „Google-Extended blokuje AI Overviews” – błędne; Google-Extended dotyczy trenowania i uziemiania Gemini/Vertex, nie Search.
- „Google wymaga llms.txt / specjalnego schema dla AI” – błędne.
- „Imagen 4”, „Veo 2/3.0” jako dostępne – wycofane.

### Perplexity
- „Sonar API” jako aktualny produkt do integracji – wyłączany 2026-09-27 (→ Agent API).
- „Sonar oparty na Llama 3.3 70B to domyślny model Perplexity” – przestarzały opis (lista modeli w aplikacji obejmuje Sonar 2 i modele zewnętrzne – źródło wtórne).
- „Perplexity-User respektuje robots.txt” – błędne („generally ignores”).

### Microsoft
- „Copilot działa wyłącznie na modelach OpenAI” – nieaktualne dla M365 Copilot (Claude Opus 5.5, Fable 5.1 itd.).
- „Microsoft 365 Copilot działa na GPT-4o / GPT-5” – nieaktualne (GPT-5.6 preferowany, GPT-6 Sol/Astra dostępne).

### Pozostali
- „Llama to główny model Meta AI” / „Meta AI działa na Llama 4” – nieaktualne; od 2026-04-08 Muse Spark (obecnie 1.3).
- „Mistral Large 2 to najnowszy Mistral” – nieaktualne (Large 3; Medium 3.5). „Mistral Large 4” – nie istnieje.
- „Qwen3 / Qwen2.5-Max to flagowiec Alibaby” – nieaktualne (Qwen3.8-Max). „Qwen4 wydany” – błędne.
- „DeepSeek V3 / R1 / deepseek-chat / deepseek-reasoner” jako aktualne API – aliasy wycofane 2026-07-24; aktualny V4.1-Flash. Twierdzenie, że od 14 września V4 Pro jest obsługiwany przez V4.1-Flash – błędne (plan odwołany).
- „xAI” bez informacji o marce SpaceXAI; „Grok 4 / 4.5 / 4.6 najnowszy” – nieaktualne (Grok 4.7, 2026-09-21).

### Ogólne
- Każda deklaracja „najnowszy model” bez daty – do oznaczenia; rynek zmienia się co 2–4 tygodnie (Google: trzy wydania Flash w trzy miesiące).


## Uzupełnienia po audycie 2026-09-25

- GPT-6 Astra jest dostępna w ChatGPT jako GPT-6 Pro (plany Pro, Business, Enterprise) oraz w trybie Work i Codex – twierdzenie „Astra tylko w API” jest błędne.
- Imagen wyłączony 2026-08-17; obrazy w Gemini generują modele Gemini Image („Nano Banana”).
- Search Console: raport „Generative AI performance” (od czerwca 2026, globalnie od 31.08) pokazuje wyświetlenia w AI Overviews, AI Mode i Discover (bez kliknięć/CTR) – twierdzenie „GSC nie pokazuje widoczności w AI” jest nieaktualne.
- ChatGPT dodaje `utm_source=chatgpt.com` do linków (FAQ OpenAI dla wydawców).
- Grok 4.7: knowledge cutoff maj 2026 (docs.x.ai).
- Sora API wyłączone 2026-09-24.
