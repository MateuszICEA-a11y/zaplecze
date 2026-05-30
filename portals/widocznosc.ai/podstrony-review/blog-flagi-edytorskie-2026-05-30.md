# Blog widocznosc.ai – flagi edytorskie z fact-checku (2026-05-30)

Lista twierdzeń **oznaczonych przez `/web-fact-check`, ale NIE poprawionych automatycznie** – wymagają decyzji redakcyjnej, mają sprzeczne źródła albo to dane własne ICEA bez atrybucji. Slam-dunki (jednoznaczne błędy) zostały już naniesione i wypchnięte; ta lista to pozostałości do Twojego przeglądu.

Legenda priorytetu: 🔴 wysoki (ryzyko wiarygodności) · 🟠 średni · 🟡 niski/kosmetyczny.

---

## modele-llm/

**chatgpt.md**
- 🟠 L149 – „5,6% wszystkich zapytań w USA trafia do LLM" → wg WSJ to **5,6% wyszukiwań desktopowych**, nie wszystkich zapytań. Doprecyzować atrybucję.
- 🟡 L60 – „GPT Image zastąpił DALL-E" – DALL-E formalnie istnieje jeszcze jako osobny GPT; niuans.

**chatgpt-vs-claude.md**
- 🟠 L66 – Morphllm ~95%/~85% (nieweryfikowalne) + Chatbot Arena Elo 1561 (wartość z ery Opus 4.6; skala areny się zmienia). Doprecyzować model/usunąć liczbę.

**claude-vs-chatgpt-programowanie.md**
- 🟡 L74 – GPT-5.5 „1 050 000 tokenów" → rozważyć „~1 mln" (OpenAI komunikuje 1M).

**claude.md**
- 🟠 L154 – „GPT-4o wyprzedza Claude'a w rzadszych językach" – nazwa modelu stara (→ GPT-5.5) + samo twierdzenie nieweryfikowalne.

**perplexity.md**
- 🔴 L61 – ARR „500 mln USD / +335% r/r" – źródła sprzeczne (150 mln / ~200 mln / 450 mln; cel zarządu 656 mln). Zweryfikować lub usunąć konkretną liczbę.

**co-potrafi-chatgpt.md**
- 🟠 L85 – plan Pro „brak limitów" → Pro ma limity (5× / 20× planu Plus). Doprecyzować.
- 🟡 L84 – Business „25 USD" (miesięcznie; przy rozliczeniu rocznym ok. 20 USD/stanowisko). Dodać niuans.
- 🟡 L95 – „700 mln tygodniowo (2025)" – poprawne historycznie; dziś ~900 mln. Opcjonalnie doprecyzować rok.

**gemini.md**
- 🟠 L90-93 – limity planów (Deep Research/dzień, storage) po Google I/O 2026 przeszły na model **compute-based**; dokładne nowe wartości do weryfikacji na Google One. (Ceny + Free/Pro/Ultra modele już poprawione.)
- 🟠 L178 – „20 serwisów = 66,18% cytowań" oraz korelacja „0,334" – nieuźródłowione/sporne. Dodać źródło lub usunąć.

**przewodnik.md (modele-llm)**
- 🟡 L30/L83 – GPT-5.5 „400 000 tokenów" – zostawione świadomie (kontekst konsumencki vs API = 1 mln; kontrast z Claude/Gemini jest celowy).

---

## geo/

**przewodnik.md**
- 🟠 L110 – „115,1% dla stron o niskim autorytecie" → w papierze dotyczy **pozycji 5 + taktyki Cite Sources**, nie ogólnie niskiego autorytetu.
- 🟠 L124/L125/L126 – wzrosty „30–41% / 30–40%" → w wersji v3 papieru Princeton wartości pojedyncze (Quotation +41/43%, Statistics +33%, Cite Sources +28%). Decyzja: ujednolicić reprezentację.
- 🟠 L197 – AirOps „37% zapytań" – w raporcie 32,9% dla zbliżonej metryki. Zweryfikować/uogólnić.
- 🟡 L102 – lista botów (GPTBot/ClaudeBot/PerplexityBot) niepełna – dopisać „i inne".

**boty-ai-przewodnik.md**
- 🟠 L108 – „OpenAI i Anthropic potwierdziły, że ich crawlery zaglądają do llms.txt" – nieudowodnione; pomiary 2026 wskazują ~0,1% requestów do llms.txt.
- 🟠 L109 – „Google >50% rynku AI search w Polsce" – brak twardego źródła dla PL.
- 🟠 L110 – „Perplexity empirycznie respektuje llms.txt" – Cloudflare udokumentował stealth crawlery Perplexity omijające robots.txt.
- 🟡 L50 – blokady GPTBota przez NYT/BBC/CNN/Reuters/Reddit – sprawdzić aktualne robots.txt (część mogła się zmienić).
- 🟡 brak w tabeli botów: `Claude-User`, `Google-Agent` (nowy, marzec 2026).

**narzedzia-monitoring-wzmianek.md** (ceny narzędzi zmieniają się szybko – warto przejrzeć całość)
- 🔴 L71 – Otterly.AI „$29–$422" → górny tier to dziś **$989**; brak stałego planu Free (tylko trial).
- 🔴 L70 – Mangools „w cenie pakietu" → AI Search Watcher jest też **standalone od $15,60/mies.**
- 🟠 L65 – Profound „od $99" → $99 obejmuje tylko ChatGPT; pełne pokrycie od $399 (Growth).
- 🟠 listy modeli per narzędzie (Semrush, Hall, Otterly) niepełne; Serpstat „100+" → 140+.
- 🟠 L29/L52 – statystyki „7,2%" i „17,6×" bez weryfikowalnego źródła pierwotnego.

**jak-llm-cytuja-zrodla.md**
- 🔴 L47/L83/L85 – statystyka „12% URL" przypisana sąsiadująco do Aggarwal et al. (KDD 2024) → faktycznie pochodzi z **Ahrefs Brand Radar (2025)**. Rozdzielić atrybucję.
- 🔴 L95/L101 – „161%" i „51%" przypisane „tej samej analizie" → faktycznie **Surfer/Search Engine Land fan-out** dot. Google AI Overviews (nie „komercyjnych silników" ogólnie).
- 🟠 L87-91 – mnożniki (2,3×, 2,5×, zakresy %) – częściowo ekstrapolacje, nie wprost z tabel papieru.
- 🟡 L125-126 – wartości 79%/17% (kierunek potwierdzony, dokładne liczby nie).

**llms-txt.md**
- 🟠 L118 – „eksperymentalną kategorię Agentic Browsing w Lighthouse 13.3" → 13.3.0 (07.05.2026) przeniósł ją do **domyślnej** konfiguracji.
- 🟡 L44 – lista firm Mintlify (ElevenLabs niepotwierdzony; źródła: Anthropic/Cursor/Coinbase/Pinecone/Windsurf).
- 🟡 L178 – „LangGraph" w podziale wzorców – do weryfikacji.

**audyt-widocznosci-marki.md**
- 🔴 L79 – „Badanie Gemini z 2024 roku, 40–60% zmienności" – brak pierwotnego źródła (prawdopodobnie zmyślona atrybucja). Usunąć atrybucję lub podać źródło.
- 🟠 L42 – „37% zapytań **zakupowych**" → 37% dotyczy ogólnych wyszukiwań (Eight Oh Two / SEL 01/2026).
- 🟠 L167a – Nightwatch „od 32 USD (mid-tier)" → $32 to plan bazowy bez LLM; LLM tracking to add-on +$99.
- 🟠 L56 – pensja Stripe „143 400–215 200 USD" → oficjalne ogłoszenie 157 800–236 800 USD (różne widełki regionalne).
- 🟡 L48 – „104 marki" (5W AI Visibility Index) – nieweryfikowalne; L114 – dopisać Claude-SearchBot.

**share-of-voice.md**
- 🟠 L37/L38/L39 – benchmarki SoV „15–20%", Citation Rate „12–18% (lider 25%+)", Mention Rate „3–5×" – brak źródła publicznego; to prawdopodobnie dane własne ICEA. **Dodać atrybucję „z obserwacji ICEA / projektów klienckich".** (Fakty SparkToro zweryfikowane jako aktualne.)

**query-fan-out.md**
- 🟠 L29/L38 – „20–30" / „20–40" podzapytań – Google nie podaje oficjalnej liczby; oznaczyć jako szacunek branżowy.
- 🟡 L74 – keyword stuffing „−10%" – silnik B kwestionuje precyzję względem papieru.
- 🟡 L92 – Qforia „darmowe" → wymaga klucza Gemini API; dodać zastrzeżenie.

**schema-org-dane-strukturalne.md**
- 🔴 L25a – „według badań konsorcjum Data World, 2–5× redukcja tokenów" – źródło **niezweryfikowalne** (prawdopodobnie zmyślone). Usunąć lub zastąpić.
- 🟠 L19/L130 – „+1500% AI Overviews" (Otterly.ai) – pojedyncze case study na 1 marce SaaS; dodać kontekst.
- 🟠 L271 – „artykuły <30 dni 3× wyższy citation rate (Perplexity)" → liczba 3× pochodzi z badania ChatGPT, nie Perplexity.
- 🟡 L25b – „3× częściej wybierane" – framing przyczynowy vs korelacja (Ahrefs); L270 – OAI-SearchBot też własny crawl.

**czym-jest-geo.md**
- 🟠 L114 – „cytowania ekspertów 30–41%" → papier: +42,6% (pojedyncza wartość); L118 „10%" → +11,8%.
- 🟡 L100 – keyword stuffing „−8% / −10%" (papier: −8,7% / −9,1%, niespójne zaokrąglenie); L120 scope 115%; L108 affiliations niepełne.

**geo-dla-ecommerce.md**
- 🔴 L137 – (POPRAWIONE: usunięto błędną atrybucję AGREE) – zweryfikować nowe brzmienie.
- 🟠 L96 – „+447% cytowań (ubezpieczenia)" – źródło to agencja promująca własne usługi; dodać atrybucję lub osłabić.
- 🟠 faq – „Rufus działa w oparciu o algorytm COSMO" → Rufus to LLM+RAG; COSMO to osobna warstwa wiedzy, z której korzysta.
- 🟡 L178 – lista platform Azoma niepełna (brak Perplexity, Walmart Sparky).

**geo-dla-lokalnego-biznesu.md**
- 🟠 L27 – „3× wyższy wskaźnik zaangażowania" → myli dwa badania (MS Clarity 3× = konwersja; Adobe +16,8% = zaangażowanie). Doprecyzować metrykę.

**najczestsze-bledy-geo.md**
- 🟠 L149 – „73% organizacji **w ogóle nie mierzy**" → źródła: 73% nie śledzi **konsekwentnie** (25% nie śledzi wcale). Doprecyzować.
- 🟠 L111b – „ton autorytatywny 10–20%" → papier ~11%.
- 🟡 L82 – „~40% audytów ma problem z robots.txt" (brak źródła); L89 – CCBot to Common Crawl, nie bot konkretnego dostawcy; L55b scope 115%.

**roi-z-geo.md**
- 🔴 L80/L140 – „ruch z AI konwertuje 12,8× lepiej" – liczba nieweryfikowalna (publikowane: Ahrefs 23×, Semrush 4,4×, WebFX 1,2×). Usunąć/zastąpić zakresem z atrybucją.
- 🟠 L162 – ROAS „8–11 / 1,05", break-even 7–11 mies. – brak twardego źródła dla ROAS.
- 🟡 L168 – „15–25% Branded Search Lift" – dane własne ICEA; dodać atrybucję.

**topical-authority.md**
- 🟠 L31b – HubSpot „4× więcej fraz długiego ogona" – nieweryfikowalne z oryginału.
- 🟡 L50 – „80% przypadków (testy iPullRank na embeddings)" – brak źródła; dodać link lub osłabić.

---

## ai-w-biznesie/

**roi-z-ai.md**
- 🟠 L19a – „65% organizacji notuje dodatni zwrot z gen AI" – nieuźródłowione; inne badania rozbieżne (Google 74%, McKinsey ~5,5% liderów).
- 🟠 L19b – „95% projektów błędnie klasyfikowanych jako porażki" – reinterpretacja statystyki MIT (95% pilotów bez wpływu na P&L).
- 🟠 L98c – „313–363% ROI dojrzałych wdrożeń" – zlepek dwóch case studies (LogicMonitor + OutSystems); mylące jako ogólny benchmark.
- 🟡 L107 – „60–85% procesu" (brak źródła); L141 – ulga B+R „do 200%" dotyczy tylko wynagrodzeń (reszta 100%).

**przewodnik.md (ai-w-biznesie)**
- 🟠 L46 – „2,52 biliona USD" → Gartner zrewidował do 2,59 bln (maj 2026).
- 🟠 L115/L116/L126 – statystyki Capgemini per-funkcja (37%/52%, 35-42%) i Airbus A350 (33%/70%) – niezweryfikowane wobec źródeł; podać dokładne źródła.
- 🟡 L50/L52 – framing McKinsey (20%/2%, „30% pass pilot"); L100b – „7% CFO" miękka atrybucja.

**bezpieczenstwo-danych-llm.md**
- 🟠 L49 – „Gemini foundation models domyślnie 24h retencji" – mylące; 24h dotyczy tylko cache sesyjnego (Live API) i free tier, nie ogólnego API.
- 🟡 L19 – framing OpenAI 30 dni (konsument vs API); L19c – LayerX 22% (B potwierdza, A nie).

**build-vs-buy.md**
- 🟠 L25 – „SaaS drożeje 11,4% r/r" → aktualne ~13,2% (Vertice, marzec 2026); dodać rok.
- 🟠 L25c – Microsoft Copilot „$30" → to plan Enterprise; Business $18–21. Doprecyzować tier.
- 🟡 L19b („6%") / L61b („60% szybszy ROI") – do weryfikacji/atrybucji.

**ai-w-hr.md**
- 🟠 L19 – „69% HR używa AI (SHRM State of AI in HR 2026)" → 69% to raport SHRM 2025 Talent Trends (użycie indywidualne); raport 2026 = 27% adopcji org. Poprawić atrybucję.
- 🟡 L31b – HRstandard.pl „58%" (vs 18% z innego źródła); L45 – infeedo 45%/25% (vs ~43%).

**ai-w-obsludze-klienta.md**
- 🟠 L139 – CSAT „8,5/10 vs 6,2/10" – brak weryfikowalnego źródła; osłabić lub dodać źródło.
- 🟡 L140 – „<1 min vs 7–10 min" – doprecyzować „czas odpowiedzi" vs „czas rezolucji".

**ai-w-sprzedazy.md**
- 🟠 L122 – „Kary mogą się kumulować" (AI Act 7% + RODO 4%) – dodać „w określonych okolicznościach".
- 🟠 L43 – Salesforce „Einstein" → dziś Einstein 1 / Agentforce; doprecyzować nazewnictwo i tier.
- 🟡 L63 (41%), L79 (Gong 60-65%, 6700h, ceny Sovva), L19/71 (30% win rate) – statystyki nieuźródłowione.

**etyka-ai-w-firmie.md**
- 🔴 L133 – „CSA 2025: 76% planuje ISO 42001" – brak takiego badania CSA (76% dotyczy budżetów SaaS). Zweryfikować.
- 🟠 L34 – Gartner „85% projektów AI = porażka" – to legacy forecast (2018-2022); aktualnie ~50% porzuca po PoC. Oznaczyć źródło/rok lub zaktualizować.
- 🟠 L60 – Stanford AI Index „233 incydenty" → to dane za 2024 (AI Index 2026: 362 za 2025). Dodać „(2024 r.)".
- 🟡 L19 – „77%/36%" atrybucja do EY niepewna (IAPP + Pacific AI).

**jak-rozmawiac-z-zarzadem.md**
- 🟡 L19 – „5,5%" liderów → McKinsey zaokrągla do ~6%; L39 – „21%" scope (finanse vs ogół); L39b – „91%" (raport EU/ME 2025) vs 84% (State of AI 2026) – dodać scope.

**od-czego-zaczac.md**
- 🟡 L166 – pensje Data Scientist (junior 11-13k zł może zawyżony; agregatory 7-11,5k).

---

## rag/ + agenci-ai/ + prompty/

**rag/przewodnik.md**
- 🟠 L82 – Qwen3-Embedding-8B „Liderem MTEB 70,6" – kontestowane (70,6 = multilingual; English MTEB prowadzi NVIDIA Nemotron). Doprecyzować „lider wielojęzycznego MTEB".
- 🟠 L82 – Gemini Embedding „$0,15–$0,20" – zależne od wariantu modelu; doprecyzować.
- 🟡 L96 – HyDE „DL-19" vs DL-20 (sprawdzić w papierze); L84/88/123/141 – benchmarki/atrybucje papierów (BadRAG 98,2% itp.) – dodać atrybucję.

**rag/chunking-strategie.md**
- 🔴 L103/L110 – „badania Stanford University (2025)" + tabela F1 (0,61–0,86) – **brak weryfikowalnego źródła** (możliwy fabrykat). Zastąpić konkretnym arXiv (np. HiChunk) lub uogólnić atrybucję.
- 🟡 L44 – text-embedding-3-small „512 tokenów" (to rekomendacja chunka; limit modelu 8191); L83 – 43,56 (legal vs medical); L147 – „38% SQL" bez źródła.

**rag/reranking.md**
- 🟡 L19 – „+7,6 pp na 3 750 zapytań" – brak źródła; L148 – `rerank-english-v3.0` w kodzie → nowsze v3.5/v4.0 (model nadal działa).

**agenci-ai/przewodnik.md**
- 🟠 L112 – Mastra „3300 modeli / 94 dostawców" → ~4000+/120+ (maj 2026); zaktualizować lub zakotwiczyć datą.
- 🟠 L110 – „AutoGen i społecznościowy fork AG2" → AG2 stworzyli oryginalni autorzy AutoGen; AutoGen w trybie maintenance, następca = Microsoft Agent Framework (MAF).
- 🟡 L136 – „71%→93% dokładność (LangGraph, klient)" – brak źródła; L164 – „wykryto 1 marca" to data disclosure (ujawnienie publiczne 9 marca).

**agenci-ai/anatomia-agenta.md**
- 🟠 L119 – tabela: „AutoGen" → dodać notkę o maintenance / Microsoft Agent Framework.
- 🟡 L56 – „LangGraph v0.4" → główny pakiet v1.2 (v0.4 to sdk/maintenance); L135 – ChemCrow „13 narzędzi" (finalna wersja Nature: 18); L107 – „efemeryczne VM" → Modal Sandboxes; L121 – Semantic Kernel/MAF.

**prompty/przewodnik.md**
- 🟠 L176b – „BootstrapFewShot 33%→82%" → liczby dotyczą BootstrapFewShot**WithRandomSearch**. Poprawić nazwę algorytmu.
- 🟡 L83 – CoT „20–40%" (uogólnienie; źródło Kojima 2022 ~10-30pp na matematyce). (Tabela modeli GPT/Gemini/Llama oraz CVE już poprawione.)

---

## Wzorce przekrojowe (warte decyzji systemowej)

1. **Statystyki z papieru Princeton GEO** (KDD 2024) cytowane w wielu wpisach jako **zakresy zbiorcze** zamiast pojedynczych wartości z wersji v3. Decyzja: ujednolicić sposób prezentacji w całym filarze GEO.
2. **Benchmarki/dane własne ICEA** (SoV, Citation Rate, Branded Lift, ROI) podawane bez atrybucji jako fakty rynkowe. Decyzja: dodać spójną formułę „z obserwacji ICEA / projektów klienckich".
3. **Ceny narzędzi SEO/AEO** (Otterly, Mangools, Profound, Nightwatch, Serpstat...) zmieniają się szybko – warto okresowo (co kwartał) przepuszczać `narzedzia-monitoring-wzmianek.md` i tabele cen przez `/web-fact-check`.
4. **Nieuźródłowione/zmyślone atrybucje** do zweryfikowania w pierwszej kolejności (🔴): „konsorcjum Data World", „Stanford University 2025" (chunking), „Badanie Gemini 2024" (audyt), CSA 76% (etyka), 12,8× ROI (roi-z-geo), ARR Perplexity 500M.
