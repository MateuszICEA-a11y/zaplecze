# Audyt świeżości – widocznosc.ai, pillar GEO (część D)

Data audytu: **2026-09-25**. Punkt odniesienia: `docs/widocznosc-ai/stan-modeli-2026-09-25.md` (dalej: baseline). Zakres: 18 plików z `portals/widocznosc.ai/src/content/blog/geo/`. Oceniane wyłącznie fakty o modelach AI, produktach AI, crawlerach, politykach dostawców i funkcjach narzędzi. Plików nie edytowano.

Priorytety: **P1** – błąd lub nieaktualne twierdzenie, **P2** – brak ważnej nowości, **P3** – drobne.

## Podsumowanie

| Priorytet | Liczba |
|---|---|
| P1 | 19 |
| P2 | 6 |
| P3 | 8 |

Najważniejszy temat przekrojowy: **sześć artykułów twierdzi, że Google Search Console nie pokazuje widoczności w AI**. Od czerwca 2026 (globalnie od 2026-08-31) Search Console ma raport „Generative AI performance” z wyświetleniami w AI Overviews, AI Mode i funkcjach AI w Discover (bez kliknięć i CTR). W tym samym terminie globalnie ruszył przełącznik „Search generative AI control”, o którym nie wspomina żaden artykuł.

Nie znaleziono wzmianek o Sonar API Perplexity (wyłączane 2026-09-27) ani o konkretnych modelach napędzających AI Overviews, AI Mode, Copilota czy Perplexity – tu nie ma nic do poprawy. Wersje UA (1.4) nigdzie nie są podane, więc nie są błędne.

Brak pola `updated`: **fanout-explorer-chatgpt.md** (tylko `date: 2026-09-16`) – przy najbliższej zmianie dodać `updated`.

---

## P1 – błędy i nieaktualne twierdzenia

### 1. share-of-voice.md:95 (oraz nota źródła w :30)
- **Cytat:** „Search Console nie wydziela wyświetleń z AI Overviews ani AI Mode: wlicza je do ogólnego ruchu w typie wyszukiwania „Internet”.”
- **Problem:** Nieaktualne. Od czerwca 2026 (globalnie od 2026-08-31) Search Console ma osobny raport Generative AI performance z wyświetleniami w AI Overviews, AI Mode i Discover, z podziałem na strony, kraje i daty. Raport nie ma kliknięć, CTR ani pozycji. Nota źródła w linii 30 powtarza stare twierdzenie.
- **Poprawka (:95):** „**Mieszanie SoV z wyświetleniami** – od 2026 roku Search Console ma osobny raport Generative AI performance, który pokazuje wyświetlenia stron w AI Overviews, AI Mode i funkcjach AI w Discover, ale bez kliknięć, CTR i pozycji. Liczba „10 000 wyświetleń miesięcznie z AI Overviews” jest więc dostępna, lecz nic nie znaczy, dopóki nie zestawisz jej z konkurencją. **SoV to relacja, a wyświetlenia to liczba absolutna – tylko relacja mówi coś o pozycji konkurencyjnej.**”
- **Poprawka (:30, note):** „Google Search Central. Opis AI Overviews i AI Mode; osobne wyświetlenia w funkcjach generatywnych pokazuje raport Generative AI performance w Search Console.” Dodać źródło: raport Generative AI performance (URL niżej).
- **Źródła:** https://support.google.com/webmasters/answer/16984139, https://developers.google.com/search/blog/2026/06/gen-ai-performance-reports, https://support.google.com/webmasters/answer/16908024

### 2. roi-z-geo.md:76
- **Cytat:** „Klasyczne raporty SEO nie pokazują cytowań w modelach LLM – Google Search Console ich nie wydziela”
- **Problem:** Jak wyżej – raport Generative AI performance wydziela wyświetlenia w AI Overviews i AI Mode. Brakuje go też w tabeli KPI (:118–127) jako źródła danych.
- **Poprawka:** „Klasyczne raporty SEO pokazują tylko wycinek widoczności w AI. Google Search Console od 2026 roku ma raport Generative AI performance z wyświetleniami w AI Overviews i AI Mode, ale bez kliknięć i bez danych o ChatGPT czy Perplexity. W Ahrefs trzeba sięgnąć po osobny moduł (Brand Radar).” Do tabeli KPI dodać wiersz: „| Wyświetlenia w AI Google | Wyświetlenia stron w AI Overviews, AI Mode i Discover | Google Search Console – raport Generative AI performance |”.
- **Źródło:** https://support.google.com/webmasters/answer/16984139

### 3. przewodnik.md:223
- **Cytat:** „Klasyczne raporty SEO – takie jak Google Search Console czy standardowe śledzenie pozycji – nie mierzą widoczności w LLM.”
- **Problem:** Search Console mierzy już wyświetlenia w funkcjach generatywnych Google.
- **Poprawka:** „Klasyczne raporty SEO mierzą widoczność w LLM tylko częściowo. Google Search Console pokazuje od 2026 roku wyświetlenia w AI Overviews i AI Mode (raport Generative AI performance, bez kliknięć), ale nie obejmuje ChatGPT, Perplexity ani Claude. Ahrefs i Semrush oferują pomiar AI w osobnych modułach.”
- **Źródło:** https://support.google.com/webmasters/answer/16984139

### 4. czym-jest-geo.md:153
- **Cytat:** „Klasyczne narzędzia SEO – Google Search Console, Ahrefs, Semrush – nie mierzą widoczności w LLM-ach.”
- **Problem:** Błędne dla wszystkich trzech: GSC ma raport Generative AI performance, Ahrefs – Brand Radar, Semrush – AI Visibility Toolkit (oba opisane w innych artykułach serwisu: roi-z-geo.md:72–74, narzedzia-monitoring-wzmianek.md:81).
- **Poprawka:** „Klasyczne narzędzia SEO mierzą widoczność w LLM-ach tylko fragmentarycznie. Google Search Console pokazuje wyświetlenia w AI Overviews i AI Mode, a Ahrefs i Semrush mają osobne, płatne moduły AI. Do pełnego obrazu GEO nadal potrzebujesz innych danych i nowego podejścia do analityki.”
- **Źródła:** https://support.google.com/webmasters/answer/16984139, https://ahrefs.com/brand-radar, https://www.semrush.com/pricing/ai/

### 5. geo-dla-lokalnego-biznesu.md:169
- **Cytat:** „Klasyczne narzędzia SEO – Google Search Console, Ahrefs, Semrush – nie mierzą widoczności w LLM.”
- **Problem:** Jak w pkt 4.
- **Poprawka:** Ten sam tekst co w pkt 4, z końcówką: „…Do pomiaru w ChatGPT i Perplexity nadal potrzebujesz własnego zestawu zapytań testowych.”
- **Źródło:** jw.

### 6. audyt-widocznosci-marki.md:77
- **Cytat:** „Klasyczne narzędzia monitoringu – Google Search Console, Ahrefs czy Semrush – mierzą kliknięcia z listy wyników.”
- **Problem:** Jak w pkt 4. GSC raportuje dziś także wyświetlenia w AI Overviews i AI Mode.
- **Poprawka:** „Klasyczne narzędzia monitoringu – Google Search Console, Ahrefs czy Semrush – zostały zbudowane wokół kliknięć z listy wyników. Search Console pokazuje co prawda od 2026 roku wyświetlenia w AI Overviews i AI Mode, ale nie widzi ChatGPT ani Perplexity. Użytkownik pytający ChatGPT o najlepsze oprogramowanie CRM dla agencji marketingowej nigdy nie trafi do Search Console.”
- **Źródło:** https://support.google.com/webmasters/answer/16984139

### 7. boty-ai-przewodnik.md:80 (alt infografiki i sama grafika)
- **Cytat:** „NA ŻĄDANIE (ChatGPT-User, Claude-Web, Perplexity-User), COMMON CRAWL (…, Google-NotebookLM)”
- **Problem:** `Claude-Web` nie jest obecnym botem Anthropic – obecne to ClaudeBot, Claude-User i Claude-SearchBot (tabela w :69–71 jest poprawna, infografika nie). `Google-NotebookLM` to dawny token, wspierany tylko do sierpnia 2026, obecnie `Google-GeminiNotebook`. Grafika jest niespójna z tekstem artykułu.
- **Poprawka:** Przegenerować infografikę i zmienić alt na: „13 botów AI w 4 kategoriach – TRENING (GPTBot, ClaudeBot, Google-Extended), WYSZUKIWANIE (OAI-SearchBot, PerplexityBot, Claude-SearchBot), NA ŻĄDANIE (ChatGPT-User, Claude-User, Perplexity-User, Google-GeminiNotebook), POZOSTAŁE (CCBot, Applebot-Extended, GoogleOther)”.
- **Źródła:** https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler, https://developers.google.com/crawling/docs/crawlers-fetchers/google-user-triggered-fetchers

### 8. boty-ai-przewodnik.md:150
- **Cytat:** „**Perplexity** nie zajęło stanowiska, ale empirycznie pliki `llms.txt` są respektowane przez ich silnik”
- **Problem:** Brak źródła. Żaden oficjalny dokument Perplexity nie deklaruje używania llms.txt (baseline: brak deklaracji). Twierdzenie jest **niezweryfikowane** i kłóci się z danymi w llms-txt.md (OtterlyAI: ok. 0,1% wizyt botów AI dotyczyło llms.txt).
- **Poprawka:** „- **Perplexity** – brak oficjalnej deklaracji, że silnik korzysta z `llms.txt`; publicznie dostępne analizy logów nie pokazują, by boty AI regularnie pobierały ten plik”
- **Źródła:** https://docs.perplexity.ai/guides/bots, https://otterly.ai/blog/the-llms-txt-experiment/

### 9. przewodnik.md:111
- **Cytat:** „ChatGPT w wariancie offline i Claude opierają wiedzę na tym, co model zobaczył przed datą odcięcia”
- **Problem:** Claude ma wyszukiwanie w sieci na wszystkich planach, także darmowym, od 2025-05-27, oraz własne boty Claude-SearchBot i Claude-User. Stawianie Claude obok „ChatGPT offline” jako modelu tylko z danych treningowych to czerwona flaga z baseline.
- **Poprawka:** „Drugi mechanizm to dane treningowe. Gdy wyszukiwanie w sieci jest wyłączone albo model uzna je za zbędne, ChatGPT, Claude czy Gemini opierają wiedzę na tym, co zobaczyły przed datą odcięcia (cutoff date) – i co uznały za wiarygodne źródło.”
- **Źródła:** https://claude.com/blog/web-search, https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler

### 10. czym-jest-geo.md:100
- **Cytat:** „ChatGPT bez dostępu do wyszukiwarki (w trybie bazowym) oraz Claude opierają wiedzę na tym, co przyswoiły przed datą graniczną wiedzy”
- **Problem:** Jak w pkt 9.
- **Poprawka:** „Drugi mechanizm to dane treningowe. Gdy model odpowiada bez wyszukiwania w sieci – w ChatGPT, Claude czy Gemini – opiera się na tym, co przyswoił przed datą graniczną wiedzy (ang. *cutoff date*).”
- **Źródło:** https://claude.com/blog/web-search

### 11. jak-llm-cytuja-zrodla.md:43
- **Cytat:** „Dla modeli opartych na danych treningowych (ChatGPT offline, Claude) efekty zależą od cyklu aktualizacji modelu”
- **Problem:** Jak w pkt 9 – Claude korzysta z wyszukiwania w czasie rzeczywistym.
- **Poprawka:** „Dla odpowiedzi opartych wyłącznie na danych treningowych (ChatGPT, Claude czy Gemini bez wyszukiwania w sieci) efekty zależą od cyklu aktualizacji modelu i mogą zajmować miesiące.”
- **Źródło:** https://claude.com/blog/web-search

### 12. narzedzia-monitoring-wzmianek.md:71
- **Cytat:** „Gdy ChatGPT lub Claude odsyła użytkownika na stronę docelową, usuwa nagłówki odsyłające HTTP (*referer headers*). Twoja analityka w Google Analytics 4 rejestruje ten ruch jako bezpośredni”
- **Problem:** Błędne dla ChatGPT. OpenAI (FAQ dla wydawców) podaje, że ChatGPT dodaje `utm_source=chatgpt.com` do linków, więc ruch jest identyfikowalny w GA4. GA4 ma też od maja 2026 domyślny kanał AI Assistant (roi-z-geo.md:143). Artykuł przeczy innemu tekstowi serwisu (roi-z-geo.md:76 – „rosnący ruch z domen takich jak chatgpt.com”). Zachowanie Claude: **niezweryfikowane**.
- **Poprawka:** „Dodatkowe wyzwanie to luka atrybucyjna. ChatGPT oznacza linki parametrem `utm_source=chatgpt.com`, a GA4 część ruchu z asystentów przypisuje do kanału AI Assistant. Nie wszystkie platformy i aplikacje przekazują jednak źródło – część wejść trafia do ruchu bezpośredniego, a wzmianka bez kliknięcia w ogóle nie zostawia śladu. **Narzędzia monitorujące uzupełniają tę lukę metodami korelacyjnymi, zestawiając harmonogram zapytań próbnych z logami serwera.**”
- **Źródła:** https://help.openai.com/en/articles/12627856-publishers-and-developers-faq, https://support.google.com/analytics/answer/9756891

### 13. najczestsze-bledy-geo.md:116 (oraz nota źródła :64)
- **Cytat:** „od 15 września 2026 roku Cloudflare zastępuje je szczegółowymi ustawieniami (…) nieuważna konfiguracja może więc odciąć także te ostatnie”
- **Problem:** Data minęła – zmiana już weszła w życie. Artykuł nie mówi też o nowych domyślnych ustawieniach: dla nowych domen boty z kategorii Training i **Agent** są blokowane na stronach z reklamami, a Search jest dozwolony. Kategoria Agent obejmuje pobieranie na żądanie użytkownika, więc domyślna blokada może dotknąć cytowań w czasie rzeczywistym.
- **Poprawka:** „Samo w sobie nie obejmuje botów wyszukiwawczych, ale 15 września 2026 roku Cloudflare zastąpił je osobnymi ustawieniami dla trzech kategorii: Training, Agent i Search. Każdą można zablokować na wszystkich stronach, tylko na stronach z reklamami albo dopuścić. Dla nowych domen domyślnie blokowane są boty Training i Agent na stronach z reklamami, a Search pozostaje dozwolony – sprawdź więc, czy blokada agentów nie odcina pobierania stron na żądanie użytkowników ChatGPT czy Perplexity.” W nocie :64 zamienić „wycofywane od 15 września 2026 roku” na „wycofane 15 września 2026 roku”.
- **Źródło:** https://developers.cloudflare.com/bots/additional-configurations/block-ai-bots/

### 14. query-fan-out.md:45 (nota źródła)
- **Cytat:** „stan na 17 września 2026. Aktualna rodzina GPT-5.6 (Sol, Terra, Luna) i GPT-6 Astra.”
- **Problem:** Nieaktualne od 2026-09-22: w API GPT-6 Sol i GPT-6 Luna zastąpiły GPT-5.6 Sol i Luna; aktualna linia to GPT-6 Astra, Sol i Luna. GPT-6 Terra nie istnieje; `gpt-5.6-terra` nadal działa.
- **Poprawka:** „OpenAI, dokumentacja API, stan na 25 września 2026. Aktualna rodzina GPT-6: Astra (od 3 września 2026) oraz Sol i Luna (od 22 września 2026).”
- **Źródło:** https://developers.openai.com/api/docs/models

### 15. topical-authority.md:39 (nota źródła)
- **Cytat:** jak w pkt 14.
- **Problem / poprawka / źródło:** jak w pkt 14.

### 16. geo-dla-ecommerce.md:135
- **Cytat:** „**Dane strukturalne JSON-LD to nie opcjonalny dodatek, ale warunek konieczny, żeby Google AI w ogóle rozważyło Twój produkt jako kandydata do odpowiedzi.**”
- **Problem:** Sprzeczne z dokumentacją Google: do obecności w AI Overviews i AI Mode nie są potrzebne specjalne dane strukturalne. Dane produktowe mogą też pochodzić z Merchant Center. Artykuł schema-org-dane-strukturalne.md tego samego serwisu mówi to wprost (:45, :78).
- **Poprawka:** „**Dane strukturalne JSON-LD nie są warunkiem obecności w AI Overviews ani AI Mode – Google wprost tego nie wymaga – ale w e-commerce to najprostszy sposób, by przekazać cenę, dostępność i parametry produktu spójnie z Merchant Center.**”
- **Źródło:** https://developers.google.com/search/docs/appearance/ai-features

### 17. geo-dla-ecommerce.md:143, :144, :192
- **Cytat:** „`FAQPage` | … | Umożliwia ekstrakcję odpowiedzi definicyjnych bezpośrednio w wynikach AI.” oraz „Format `FAQPage` w JSON-LD pozwala na ekstrakcję tych odpowiedzi wprost do wyników AI.”
- **Problem:** Google przestał wyświetlać wyniki rozszerzone FAQ 2026-05-07, a wyniki HowTo w 2023. W eksperymencie Otterly żadna platforma AI nie odpowiedziała na podstawie informacji z samego schematu FAQPage (tak opisuje to schema-org-dane-strukturalne.md:178). Tekst przeczy innemu artykułowi serwisu.
- **Poprawka (:143):** „| `FAQPage` | `mainEntity`, `Question`, `acceptedAnswer` | Porządkuje widoczną sekcję FAQ; od maja 2026 Google nie pokazuje wyników rozszerzonych FAQ, a platformy AI nie odpowiadają na podstawie samego schematu. |” **(:144):** „| `HowTo` | `step`, `tool`, `totalTime` | Porządkuje instrukcję widoczną na stronie; wyniki rozszerzone HowTo Google wycofał w 2023 roku. |” **(:192):** „…Oznacz ją `FAQPage` w JSON-LD, ale traktuj schemat jako opis widocznej treści – to tekst na stronie, nie znacznik, trafia do odpowiedzi AI.”
- **Źródła:** https://developers.google.com/search/updates, https://otterly.ai/blog/schema-markup-real-impact-ai-search/

### 18. geo-dla-lokalnego-biznesu.md:163
- **Cytat:** „Analiza logów serwerowych pokazuje, że wdrożenie `llms.txt` (…) zmniejsza jednak opóźnienie odpytywania przez systemy AI i eliminuje błędy atrybucji.”
- **Problem:** Brak źródła, twierdzenie **niezweryfikowane**. Sprzeczne z danymi w llms-txt.md (OtterlyAI: ok. 0,1% żądań botów AI dotyczyło llms.txt; SE Ranking: brak związku z cytowaniami) i ze stanowiskiem Google (pliki „AI text” niepotrzebne). Żaden duży dostawca (OpenAI, Anthropic, Perplexity) nie deklaruje używania llms.txt.
- **Poprawka:** „Dotychczasowe analizy logów serwerowych pokazują, że boty AI rzadko pobierają `llms.txt`, a badania nie wykazały jego wpływu na cytowania. Plik warto traktować jako tani dodatek porządkujący opis firmy, a nie jako sposób na lepszą widoczność – ważniejsze są spójne dane NAP, schemat `LocalBusiness` i treść strony.”
- **Źródła:** https://otterly.ai/blog/the-llms-txt-experiment/, https://seranking.com/blog/llms-txt/, https://developers.google.com/search/docs/appearance/ai-features

### 19. co-google-przemilcza.md:123–125
- **Cytat:** „**Google oraz Claude z dostępem do sieci** – kolejne kanały…” oraz „Żaden z tych systemów nie działa na „podstawowych systemach rankingowych Google””
- **Problem:** Na liście systemów „spoza Google” jest Google. Jeśli chodzi o aplikację Gemini – ta korzysta z Google Search do uziemiania odpowiedzi (Google-Extended steruje m.in. groundingiem w Gemini Apps), więc zdanie z :125 jest dla niej fałszywe.
- **Poprawka:** „- **Claude z dostępem do sieci** – od 2025 roku wyszukiwanie w sieci jest dostępne na wszystkich planach, także darmowym.” oraz w :125: „Żaden z tych systemów poza produktami Google nie działa na „podstawowych systemach rankingowych Google”…”
- **Źródła:** https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers, https://claude.com/blog/web-search

---

## P2 – brak ważnych nowości

### 20. boty-ai-przewodnik.md:59–78 (tabela) i :4 (description)
- **Cytat:** „Trzynaście botów AI, które warto znać” – tabela bez OAI-AdsBot.
- **Problem:** OpenAI ma nowego bota **OAI-AdsBot/1.0** (weryfikacja stron docelowych reklam w ChatGPT; dane nie służą do trenowania). Google ma też fetcher **Google-Agent** (agenci na infrastrukturze Google). Aktualne UA: GPTBot/1.4, OAI-SearchBot/1.4, ChatGPT-User/1.0.
- **Poprawka:** Dodać wiersz: „| `OAI-AdsBot` | OpenAI | weryfikacja bezpieczeństwa stron docelowych reklam w ChatGPT; dane nie trafiają do treningu | pośredni – dotyczy reklamodawców ChatGPT |” i pod tabelą zdanie: „Aktualne wersje user-agentów OpenAI to `GPTBot/1.4`, `OAI-SearchBot/1.4` i `ChatGPT-User/1.0`. Google opisuje też fetcher `Google-Agent`, używany przez agentów działających na infrastrukturze Google.” Zaktualizować liczbę botów w tytule sekcji, :4, :237 i narzędziu (albo zaznaczyć, że OAI-AdsBot jest poza listą 13 kluczowych dla widoczności).
- **Źródła:** https://developers.openai.com/api/docs/bots, https://developers.google.com/crawling/docs/crawlers-fetchers/google-user-triggered-fetchers

### 21. boty-ai-przewodnik.md:72 / po :136
- **Problem:** Brak informacji o przełączniku **Search generative AI control** w Search Console (globalnie od 2026-08-31). To jedyny sposób na wyłączenie strony z AI Overviews, AI Mode i funkcji AI w Discover bez utraty zwykłych wyników. Google-Extended tego nie robi.
- **Poprawka (nowy akapit po :136):** „Trzecia rzecz dotyczy Google. Token `Google-Extended` nie wyłącza Twojej strony z AI Overviews ani AI Mode – steruje tylko trenowaniem i uziemianiem modeli Gemini. Od 31 sierpnia 2026 roku do rezygnacji z funkcji generatywnych wyszukiwarki służy przełącznik Search generative AI control w Google Search Console. Wyłączenie nie wpływa na ranking w zwykłych wynikach, ale oznacza zero wyświetleń i ruchu z AI Overviews, AI Mode i funkcji AI w Discover.”
- **Źródła:** https://support.google.com/webmasters/answer/16908024, https://blog.google/products-and-platforms/products/search/new-controls-website-owners/

### 22. najczestsze-bledy-geo.md:112
- **Cytat:** „Z kolei zablokowanie `Google-Extended` nie wpływa na obecność w wyszukiwarce Google, w tym w AI Overviews.”
- **Problem:** Zdanie jest poprawne, ale brakuje drugiej strony: od 2026-08-31 istnieje przełącznik w Search Console, który przypadkowo ustawiony wyklucza stronę z AI Overviews i AI Mode – to nowy „cichy” błąd konfiguracji.
- **Poprawka (dopisać):** „Nowa pułapka od 31 sierpnia 2026 roku to przełącznik Search generative AI control w Google Search Console – jego wyłączenie usuwa stronę z AI Overviews, AI Mode i funkcji AI w Discover, choć zwykłe wyniki zostają bez zmian. Sprawdź to ustawienie podczas audytu.”
- **Źródło:** https://support.google.com/webmasters/answer/16908024

### 23. co-google-przemilcza.md:114–135 (sekcja „Perspektywa monopolisty”)
- **Problem:** Brak najważniejszej nowości z perspektywy tezy artykułu: Google dał wydawcom opt-out z AI Overviews i AI Mode (test w UK od 2026-06-03, globalnie od 2026-08-31) oraz raport wyświetleń w funkcjach generatywnych. Uczciwie wzmacnia to i komplikuje narrację „Google broni status quo”.
- **Poprawka (akapit po :135):** „Trzeba też oddać Google, że pod presją regulacyjną dał wydawcom nowe narzędzia. Od 31 sierpnia 2026 roku każda witryna może w Search Console wyłączyć swoje treści z AI Overviews, AI Mode i funkcji AI w Discover bez wpływu na zwykłe wyniki, a raport Generative AI performance pokazuje wyświetlenia w tych funkcjach. Kliknięć jednak w nim nie ma – więc nadal nie wiesz, ile ruchu przynosi obecność w odpowiedziach AI.”
- **Źródła:** https://support.google.com/webmasters/answer/16908024, https://support.google.com/webmasters/answer/16984139

### 24. audyt-widocznosci-marki.md:143–147 (Krok 4)
- **Problem:** Audyt techniczny nie obejmuje nowych elementów Search Console: przełącznika Search generative AI control i raportu Generative AI performance (dane wyjściowe o wyświetleniach w AI Overviews i AI Mode).
- **Poprawka (nowy podpunkt):** „### Search Console – ustawienia i raport AI. Sprawdź, czy w Google Search Console przełącznik Search generative AI control nie wyklucza witryny z AI Overviews i AI Mode (dostępny globalnie od 31 sierpnia 2026 roku). Zapisz też punkt startowy z raportu Generative AI performance – wyświetlenia stron w funkcjach generatywnych Google, bez kliknięć.”
- **Źródła:** https://support.google.com/webmasters/answer/16908024, https://support.google.com/webmasters/answer/16984139

### 25. llms-txt.md:140
- **Cytat:** „John Mueller z Google w nieformalnej wypowiedzi na Reddicie porównał go do meta keywords”
- **Problem:** Stanowisko Google opiera się tylko na nieformalnej wypowiedzi z 2025 roku. Brakuje oficjalnej dokumentacji: „You don't need to create new machine readable files, AI text files, or markup to appear in these features” (ai-features, akt. 2025-12-10). Ten sam przewodnik cytuje boty-ai-przewodnik.md:31.
- **Poprawka:** „**Google nie korzysta z tego standardu.** Oficjalna dokumentacja Google Search Central stwierdza, że do pojawienia się w funkcjach AI wyszukiwarki nie trzeba tworzyć nowych plików czytelnych dla maszyn ani plików tekstowych dla AI. Wcześniej John Mueller w nieformalnej wypowiedzi na Reddicie porównał `llms.txt` do meta keywords…” W `sources` dodać dokumentację ai-features.
- **Źródło:** https://developers.google.com/search/docs/appearance/ai-features

---

## P3 – drobne

### 26. boty-ai-przewodnik.md:66
- **Cytat:** „trening modeli (GPT-5+)”
- **Problem:** Aktualna generacja to GPT-6; zapis „GPT-5+” szybko się starzeje.
- **Poprawka:** „trening modeli bazowych OpenAI”
- **Źródło:** https://developers.openai.com/api/docs/bots

### 27. boty-ai-przewodnik.md:82
- **Problem:** Warto dodać zastrzeżenie OpenAI: jeśli dopuszczone są oba boty, OpenAI może użyć jednego crawla do wyszukiwania i trenowania.
- **Poprawka (dopisać):** „Uwaga: gdy dopuszczasz i `GPTBota`, i `OAI-SearchBota`, OpenAI może wykorzystać wyniki jednego crawla do obu celów.”
- **Źródło:** https://developers.openai.com/api/docs/bots

### 28. najczestsze-bledy-geo.md:109
- **Cytat:** „`OAI-SearchBot`, `PerplexityBot`, `ChatGPT-User` | … | `Allow`”
- **Problem:** Brak Claude-SearchBot i Claude-User w klasie botów wyszukiwawczych; brak uwagi, że reguły robots.txt mogą nie mieć zastosowania do ChatGPT-User ani Perplexity-User.
- **Poprawka:** „| Boty wyszukiwawcze i użytkownika | `OAI-SearchBot`, `PerplexityBot`, `Claude-SearchBot`, `ChatGPT-User`, `Claude-User` | Pobieranie treści w czasie rzeczywistym… (fetchery użytkownika `ChatGPT-User` i `Perplexity-User` mogą nie stosować się do robots.txt) | `Allow` – blokada = zero ruchu referencyjnego |”
- **Źródła:** https://developers.openai.com/api/docs/bots, https://docs.perplexity.ai/guides/bots

### 29. geo-dla-ecommerce.md:92 i :217; geo-dla-lokalnego-biznesu.md:194; audyt-widocznosci-marki.md:145
- **Cytat:** „bot AI (OAI-SearchBot, ClaudeBot, PerplexityBot) musi technicznie dostać się do strony”
- **Problem:** ClaudeBot zbiera dane do trenowania; o obecności w wyszukiwaniu Claude decydują Claude-SearchBot i Claude-User.
- **Poprawka:** „bot AI (OAI-SearchBot, Claude-SearchBot, PerplexityBot)…”; w listach kontrolnych: „`OAI-SearchBot`, `GPTBot`, `ClaudeBot`, `Claude-SearchBot` i `PerplexityBot`”.
- **Źródło:** https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler

### 30. geo-dla-ecommerce.md:207
- **Cytat:** „Profound (ponad 10 silników AI…)”
- **Problem:** Niespójne z narzedzia-monitoring-wzmianek.md:82 („Do 9 silników”, cennik Profound, wrzesień 2026).
- **Poprawka:** „Profound (do 9 silników AI, głęboka analiza autorytetu encji)”. Azoma i Goodie AI – funkcje **niezweryfikowane** w tym audycie.
- **Źródło:** https://www.tryprofound.com/pricing

### 31. query-fan-out.md:119 i topical-authority.md:101
- **Cytat:** „własnego promptu w GPT-5.6”
- **Problem:** Nie jest to błąd (GPT-5.6 Sol/Luna nadal napędza czat ChatGPT), ale nazwa modelu starzeje się co kilka tygodni.
- **Poprawka:** „własnego promptu w ChatGPT lub Gemini”.
- **Źródło:** baseline, sekcja 2.

### 32. query-fan-out.md (ogólnie, np. po :57)
- **Problem:** Artykuł o AI Mode nie podaje, na jakim modelu działa. To przydatny kontekst.
- **Poprawka:** „Od Google I/O 2026 (19 maja 2026 roku) domyślnym modelem AI Mode na całym świecie jest Gemini 3.5 Flash; subskrybenci Google AI Pro i Ultra mogą wybrać nowsze modele Flash.”
- **Źródło:** https://blog.google/innovation-and-ai/technology/ai/google-io-2026-all-our-announcements/

### 33. fanout-explorer-chatgpt.md:42 i :137 (oraz brak `updated`)
- **Cytat:** „na koncie ChatGPT Free (GPT-5.6)”
- **Problem:** Plan Free używa konkretnie GPT-5.6 Luna. Model na koncie Business („GPT-5.6 Thinking”) – oficjalna tabela modeli per plan **niezweryfikowana**. Plik nie ma pola `updated`.
- **Poprawka:** „na koncie ChatGPT Free (GPT-5.6 Luna)” i „z wykorzystaniem modelu GPT-5.6 Luna”. Przy najbliższej zmianie dodać `updated`.
- **Źródło:** https://openai.com/index/improving-gpt-5-6-sol-in-chatgpt/ (według baseline; strona zwraca 403)

---

## Poza zakresem (do wiadomości, nie liczone)
- **fanout-explorer-chatgpt.md:84, :176, :194, :197** – w tekście są znaki em-dash; zasada redakcyjna wymaga en-dash (–).
- **llms-txt.md:149** – sklejone dwa punkty listy („…na stronie- **Landing page…**”) – brakuje podziału wiersza, lista renderuje się błędnie.

## Zweryfikowane bez zastrzeżeń (wybór)
- Opis botów OpenAI, w tym ChatGPT-User i robots.txt (boty-ai-przewodnik.md:21, :136) – zgodny z dokumentacją.
- Google-Extended jako token treningu i uziemiania Gemini, bez wpływu na Search (boty-ai-przewodnik.md:72, najczestsze-bledy-geo.md:110–112) – zgodne.
- Perplexity-User „zwykle ignoruje robots.txt” – zgodne.
- Microsoft Clarity Topic Insights: GPT-5.3 z Web IQ, beta, 10 raportów tygodniowo – zgodne ze stanem na 2026-09-25 (https://clarity.microsoft.com/blog/topic-insights-announcement/).
- GA4, kanał AI Assistant od maja 2026 (roi-z-geo.md:143) – bez zmian.
- Google-GeminiNotebook jako następca Google-NotebookLM (boty-ai-przewodnik.md:30, :73) – zgodne (strona Google zaktualizowana 2026-08-19).
