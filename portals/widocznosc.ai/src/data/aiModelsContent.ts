/**
 * Treść per model AI dla podstron /pozycjonowanie-ai/[slug].
 * Każdy obiekt: hero, jak działa, jak optymalizować, FAQ.
 *
 * Dane oparte na docs/widocznosc-ai/keyword-map.md (PAA pytania)
 * i publicznej dokumentacji każdego modelu (training cutoff, RAG, citations).
 */

export type ModelContent = {
  heroSubtitle: string;
  metaDescription: string;
  howItWorks: { title: string; desc: string }[];
  optimization: { title: string; desc: string }[];
  signals: string[];
  faq: { q: string; a: string }[];
};

export const MODEL_CONTENT: Record<string, ModelContent> = {
  chatgpt: {
    heroSubtitle:
      'OpenAI ChatGPT z&nbsp;trybem SearchGPT – najczęściej używany asystent AI w&nbsp;Polsce, przetwarzający ponad 1,6 miliarda zapytań dziennie. Cytuje ze statycznych danych treningowych oraz przez mechanizm RAG oparty na indeksie Bing w&nbsp;czasie rzeczywistym. Widoczność w&nbsp;obu ścieżkach wymaga osobnych działań optymalizacyjnych.',
    metaDescription:
      'Pozycjonowanie marki w ChatGPT i SearchGPT. Audyt cytowań w ChatGPT, optymalizacja pod training data i RAG (indeks Bing). Mierzymy udział marki w odpowiedziach OpenAI – Share of Model.',
    howItWorks: [
      {
        title: 'Dwoista architektura wiedzy',
        desc: 'ChatGPT działa w&nbsp;dwóch trybach. Tryb standardowy opiera się na statycznych wagach treningowych (wiedza do określonego cutoff) – marka musi istnieć w&nbsp;źródłach skanowanych przez Common Crawl i&nbsp;własne crawlery OpenAI. Tryb SearchGPT (sieciowy) realizuje pobieranie w&nbsp;czasie rzeczywistym przez mechanizm RAG.',
      },
      {
        title: 'Potok RAG i agent Thinky',
        desc: 'W&nbsp;trybie sieciowym dedykowany model planistyczny rozbija zapytanie na kilka pomocniczych zapytań do Bing (query fan-out), pobiera równolegle 3-10 stron przez funkcję mclick i&nbsp;dzieli je na 128-tokenowe fragmenty. Strony które nie odpowiadają w&nbsp;ciągu 2 sekund są automatycznie pomijane – szybkość ładowania jest czynnikiem eliminacyjnym.',
      },
      {
        title: 'Selekcja źródeł – Reciprocal Rank Fusion',
        desc: 'System wybiera 5-10 najlepszych fragmentów przez fuzję odwróconych rang (RRF), premiując strony spójnie pojawiające się przy różnych wariantach zapytania. Filtr różnorodności zapobiega dominacji jednej domeny – nawet najsilniejsza marka może być zacytowana tylko raz na odpowiedź.',
      },
      {
        title: 'Custom GPT i RAG w&nbsp;niszach B2B',
        desc: 'Tysiące Custom GPT-ów buduje własne bazy wiedzy z&nbsp;plików i&nbsp;stron. Twoje materiały mogą tam trafić jako źródło referencyjne dla zapytań branżowych. To niewidoczny, ale realny kanał ekspozycji marki w&nbsp;segmentach B2B – mierzymy go pośrednio przez monitoring wzmianek.',
      },
    ],
    optimization: [
      {
        title: 'Gęstość faktograficzna w&nbsp;leadach',
        desc: 'Pierwsze 200 słów artykułu powinno zawierać konkretne liczby, daty i&nbsp;dane źródłowe. ChatGPT cytuje krótkie, faktualne fragmenty (chunki 128 tokenów) – nie poetyckie wstępy ani tekst marketingowy. Zasada: zamiast "jesteśmy liderem rynku" → "64% klientów B2B w&nbsp;Polsce korzysta z&nbsp;narzędzia X wg raportu Y". Audytujemy gęstość faktograficzną i&nbsp;rekomendujemy korekty.',
      },
      {
        title: 'Schema.org Article + Person + sameAs',
        desc: 'Każdy artykuł podpisany autorem z&nbsp;wypełnionym profilem Person: knowsAbout, sameAs (LinkedIn, Google Scholar). ChatGPT preferuje cytować strony z&nbsp;jasną atrybucją ekspercką. Strony porównawcze (VS, "najlepsze X") są cytowane o&nbsp;11 punktów procentowych częściej niż ogólne artykuły blogowe – wdrażamy ten format w&nbsp;ramach optymalizacji.',
      },
      {
        title: 'llms.txt + robots.txt (OAI-SearchBot)',
        desc: 'Plik llms.txt w&nbsp;katalogu głównym to bezpośredni interfejs dla crawlerów AI – zawiera mapę kluczowych podstron z&nbsp;opisami. Krytyczne rozróżnienie: GPTBot zbiera dane treningowe (możesz zablokować), OAI-SearchBot obsługuje wyszukiwanie na żywo (blokada = wypadnięcie z&nbsp;SearchGPT). Konfigurujemy oba agenty zgodnie z&nbsp;Twoją strategią.',
      },
      {
        title: 'Strony encji i&nbsp;Enhanced Entity Pages',
        desc: 'Jedna podstrona = jedna encja (produkt, usługa, pojęcie). Wszystkie kluczowe fakty widoczne w&nbsp;warstwie tekstowej, JSON-LD jako uzupełnienie. Badania wykazują wzrost dokładności RAG o&nbsp;~30% przy wdrożeniu tego formatu. Budujemy i&nbsp;optymalizujemy strony encji jako część pakietu GEO.',
      },
    ],
    signals: [
      'Pozycja top 5 w&nbsp;Bing Search (wejście do puli kandydatów RAG)',
      'Czas ładowania TTFB / LCP poniżej 2 sekund (próg eliminacyjny mclick)',
      'Wysoka gęstość faktograficzna w&nbsp;pierwszych 200 słowach',
      'Schema.org Article + Person z&nbsp;sameAs i&nbsp;expertise',
      'OAI-SearchBot allow w&nbsp;robots.txt + llms.txt',
      'Linki i&nbsp;wzmianki z&nbsp;domen zaufanych (Wikipedia, .gov, .edu)',
    ],
    faq: [
      {
        q: 'Jak pozycjonować markę w&nbsp;ChatGPT?',
        a: 'Działamy na dwóch ścieżkach równolegle: (1) dane treningowe – obecność w&nbsp;wysokiej jakości źródłach skanowanych przez OpenAI przed kolejnym cutoff; (2) SearchGPT – optymalizacja pod indeks Bing, gęstość faktograficzna, szybkość strony i&nbsp;Schema.org. Zaczynamy od audytu cytowań, który pokazuje, na jakich zapytaniach marka już się pojawia i&nbsp;gdzie jest luka wobec konkurencji.',
      },
      {
        q: 'Jak długo trwa pojawienie się w&nbsp;ChatGPT?',
        a: 'SearchGPT (tryb sieciowy) – 24-72 godziny od publikacji, jeśli strona jest zaindeksowana w&nbsp;Bing. Statyczne dane treningowe – 6-18 miesięcy do kolejnego cutoff modelu. Custom GPT – natychmiast po dodaniu do bazy wiedzy. Nasze działania skupiają się przede wszystkim na SearchGPT, bo daje mierzalne efekty w&nbsp;tygodniach, nie miesiącach.',
      },
      {
        q: 'Czy ChatGPT cytuje konkretne strony z&nbsp;linkami?',
        a: 'W&nbsp;trybie SearchGPT – tak, każde stwierdzenie ma przypis z&nbsp;linkiem do źródła (1-5 cytowań na odpowiedź). W&nbsp;trybie konwersacyjnym (dane treningowe) ChatGPT wymienia marki i&nbsp;produkty bez URL, ale ten sygnał też jest mierzalny. Monitorujemy oba przypadki w&nbsp;ramach usługi stałego śledzenia widoczności.',
      },
      {
        q: 'Jak mierzycie efekty pozycjonowania w&nbsp;ChatGPT?',
        a: 'Kluczowy wskaźnik to Share of Model (SoM) – procentowy udział wzmianek marki w&nbsp;odpowiedziach dla zdefiniowanego zestawu zapytań testowych. Mierzymy też Citation Rate (udział URL w&nbsp;przypisach) oraz monitoring ruchu z&nbsp;agenta OAI-SearchBot w&nbsp;logach serwera. Raport co miesiąc z&nbsp;rekomendacjami kolejnych kroków.',
      },
    ],
  },

  claude: {
    heroSubtitle:
      'Anthropic Claude – preferowany model wśród inżynierów, prawników i&nbsp;konsultantów B2B. Cytuje oszczędnie, ale precyzyjnie: 63% źródeł to niszowe blogi techniczne i&nbsp;dokumentacja pisana przez praktyków, a&nbsp;zaledwie 7% to główny nurt mediów. Pozycjonowanie tu wymaga autorytetu merytorycznego, nie marketingowego.',
    metaDescription:
      'Pozycjonowanie marki w Claude (Anthropic). Audyt cytowań, optymalizacja pod Brave Search (silnik RAG Claude), budowanie autorytetu eksperckiego w segmentach B2B. GEO dla decision-makerów i specjalistów.',
    howItWorks: [
      {
        title: 'Constitutional AI i&nbsp;filtr wiarygodności',
        desc: 'Claude działa w&nbsp;oparciu o&nbsp;zasady "helpful, harmless, honest". Wycina język perswazyjny, hiperbole i&nbsp;niespójne dane. Strona która sama cytuje badania i&nbsp;dokumentację zewnętrzną wygląda wiarygodnie – taka która pisze "najlepszy na rynku" jest ignorowana. Budujemy treści zgodne z&nbsp;tym filtrem.',
      },
      {
        title: 'Brave Search jako silnik RAG',
        desc: 'W&nbsp;trybie wyszukiwania na żywo Claude korzysta z&nbsp;indeksu Brave Search (ponad 30 mld stron) poprzez dedykowane API. Korelacja między wynikami Brave a&nbsp;cytowaniami Claude wynosi 86,7%. Brave nie używa klasycznego PageRank – premiuje strony o&nbsp;realnym zaangażowaniu użytkowników (Web Discovery Project), co daje szansę niszowym ekspertom.',
      },
      {
        title: 'Trzy wyspecjalizowane boty Anthropic',
        desc: 'ClaudeBot zbiera dane treningowe, Claude-User analizuje linki wklejone przez użytkownika, Claude-SearchBot obsługuje wyszukiwanie na żywo. Każdy wymaga osobnej konfiguracji w&nbsp;robots.txt. Zablokowanie Claude-SearchBot całkowicie usuwa stronę z&nbsp;bazy cytowań w&nbsp;czasie rzeczywistym.',
      },
      {
        title: 'Recency bias i&nbsp;preferencja dla treści świeżych',
        desc: 'Strony starsze niż 3 miesiące odnotowują gwałtowny spadek cytowań w&nbsp;dynamicznie zmieniających się tematach. Tokeny świeżości w&nbsp;URL (rok, /2025/, /2026/) zwiększają udział w&nbsp;cytowaniach o&nbsp;24%. Wdrażamy kwartalny cykl aktualizacji kluczowych artykułów.',
      },
    ],
    optimization: [
      {
        title: 'Long-form z&nbsp;metodologią i&nbsp;danymi statystycznymi',
        desc: 'Claude preferuje artykuły eksperckie powyżej 3000 słów z&nbsp;konkretną metodologią, precyzyjnymi danymi (Statistics Addition) i&nbsp;cytatami ekspertów (Quotation Addition). Badania Princeton wykazują, że te dwie taktyki zwiększają widoczność w&nbsp;LLM o&nbsp;30-40%. Każde 500 słów powinno zawierać co najmniej jedną tabelę, listę lub blok danych – projektujemy taką strukturę w&nbsp;audycie.',
      },
      {
        title: 'Self-Contained Content Units (SCU)',
        desc: 'Claude dzieli dokumenty na fragmenty 40-60 słów. Fragment musi być zrozumiały po wyjęciu z&nbsp;kontekstu, inaczej re-ranker go odrzuci. Każda sekcja powinna zaczynać się od nagłówka sformułowanego jako pytanie użytkownika, a&nbsp;bezpośrednio pod spodem – definicja lub bezpośrednia odpowiedź w&nbsp;pierwszych 200 słowach (format Answer-First).',
      },
      {
        title: 'Schema Person + DefinedTerm + HowTo',
        desc: 'Profil autora Person z&nbsp;właściwością knowsAbout wskazuje zakres specjalizacji. DefinedTerm dla autorskich pojęć branżowych eliminuje ryzyko błędnej interpretacji przez LLM. HowTo dla procesów instruktażowych. Łącznie te znaczniki budują "prywatny graf wiedzy" witryny, który Claude traktuje jako maszynowo czytelną bazę danych.',
      },
      {
        title: 'Brave Search + IndexNow + Claude-SearchBot allow',
        desc: 'Widoczność w&nbsp;Brave Search jest bezpośrednim warunkiem cytowania przez Claude w&nbsp;czasie rzeczywistym. Wdrażamy IndexNow dla szybkiej re-indeksacji po aktualizacjach (zmiany widoczne w&nbsp;Brave w&nbsp;ciągu minut). Claude-SearchBot i&nbsp;ClaudeBot muszą mieć osobne wpisy allow w&nbsp;robots.txt.',
      },
    ],
    signals: [
      'Pozycja w&nbsp;Brave Search (86,7% korelacja z&nbsp;cytowaniami Claude)',
      'Głębokość treści – 3000+ słów na artykuł filarowy',
      'Brak języka perswazyjnego – dane i&nbsp;cytaty ekspertów zamiast marketingu',
      'Szybkość ładowania FCP poniżej 0,4 s (6,7 cytowań vs 2,1 dla FCP ponad 1,1 s)',
      'Schema Person + DefinedTerm + HowTo w&nbsp;JSON-LD',
      'Claude-SearchBot allow + IndexNow + świeże updatedAt',
    ],
    faq: [
      {
        q: 'Jak pozycjonować markę w&nbsp;Claude?',
        a: 'Priorytet to autorytet merytoryczny w&nbsp;Brave Search – bo to z&nbsp;tego indeksu Claude pobiera dane na żywo. Budujemy długie artykuły eksperckie z&nbsp;metodologią, precyzyjnymi danymi i&nbsp;cytatami, strukturyzowane pod chunking 40-60 słów. Jednocześnie optymalizujemy robots.txt (Claude-SearchBot allow), wdrażamy IndexNow i&nbsp;Schema.org. Audyt na starcie pokaże, ile cytowań marka już zbiera i&nbsp;gdzie są luki.',
      },
      {
        q: 'Czy Claude cytuje moją stronę z&nbsp;linkami?',
        a: 'W&nbsp;trybie wyszukiwania na żywo – tak, z&nbsp;przypisami. W&nbsp;trybie konwersacyjnym (bez internetu) Claude wymienia marki i&nbsp;ekspertów, ale rzadko podaje URL. Ruch referencyjny z&nbsp;Claude identyfikujemy przez user-agent Claude-User w&nbsp;logach serwera. Monitorujemy oba sygnały w&nbsp;ramach usługi.',
      },
      {
        q: 'Claude vs ChatGPT – który ważniejszy dla mojego B2B?',
        a: 'Claude obsługuje przede wszystkim inżynierów, prawników, konsultantów i&nbsp;analityków poszukujących rzetelnej syntezy. ChatGPT ma szerszy zasięg, ale niższą intencję biznesową per użytkownik. Jeśli Twój ICP to decision-makerzy i&nbsp;eksperci – Claude generuje ruch o&nbsp;bardzo wysokiej intencji. Audyt widoczności w&nbsp;obu modelach jednocześnie pokaże faktyczne proporcje w&nbsp;Twojej niszy.',
      },
      {
        q: 'Jak długo trwa pojawienie się w&nbsp;wynikach Claude?',
        a: 'Wyszukiwanie na żywo (Claude-SearchBot + Brave) – 48-96 godzin po wdrożeniu IndexNow. Dane treningowe (ClaudeBot) – kilka do kilkunastu miesięcy do kolejnego cyklu treningowego. Skupiamy się na ścieżce on-demand, bo daje mierzalne efekty w&nbsp;ciągu tygodni. Monitoring SoM i&nbsp;Citation Rate co miesiąc.',
      },
    ],
  },

  gemini: {
    heroSubtitle:
      'Google Gemini z&nbsp;bezpośrednim dostępem do indeksu Google Search w&nbsp;czasie rzeczywistym. Zasila AI Overviews w&nbsp;SERP, Workspace, Android i&nbsp;Chrome. Aż 44% cytowań w&nbsp;AI Overviews pochodzi spoza top 20 organicznych – merytoryczna struktura treści ważniejsza niż sama pozycja.',
    metaDescription:
      'Pozycjonowanie marki w Google Gemini i AI Overviews. Optymalizacja pod AI Mode, FAQPage schema, fact-density i topical authority. Mierzymy Share of Model i Citation Rate w ekosystemie Google.',
    howItWorks: [
      {
        title: 'Grounding w&nbsp;czasie rzeczywistym przez Google Search',
        desc: 'Gemini nie polega wyłącznie na wiedzy treningowej – pobiera dane bezpośrednio z&nbsp;indeksu Google (mechanizm grounding). Kiedy zapytanie jest złożone, model generuje kilka pomocniczych mikro-zapytań (query fan-out) i&nbsp;przeszukuje je równolegle. Strony widoczne na te poboczne zapytania mają o&nbsp;161% wyższe prawdopodobieństwo cytowania w&nbsp;AI Overview.',
      },
      {
        title: 'AI Overviews w&nbsp;SERP',
        desc: 'AI Overviews to blok generowany przez Gemini na górze wyników Google, aktywowany dla ~21% zapytań (59% dla pytań "dlaczego", 57% dla zapytań logicznych). W&nbsp;Polsce aktywne dla wybranych fraz informacyjnych, pełny rollout postępuje. Cytowania mają link do źródła – to realny kanał ruchu referencyjnego.',
      },
      {
        title: 'Strukturalny overlap: SEO + GEO',
        desc: '94% cytowań w&nbsp;AI Overviews pochodzi z&nbsp;top 20 organicznych, ale 44% łącznie pochodzi spoza tej grupy. Oznacza to, że klasyczne SEO jest warunkiem koniecznym, ale nie wystarczającym. Gemini szuka cech strukturalnych ignorowanych przez PageRank: poprawność faktograficzna (35% wagi), dopasowanie do intencji (25%), sygnały E-E-A-T (20%).',
      },
      {
        title: 'AI Mode i&nbsp;pełna integracja konwersacyjna',
        desc: 'Następnik AI Overviews to pełny "AI Mode" w&nbsp;Google – chat-style UI z&nbsp;cytowaniami wbudowanymi w&nbsp;odpowiedź. Gemini zasila też Workspace (Docs, Gmail, Meet) i&nbsp;wyszukiwanie w&nbsp;Chrome. Budujemy widoczność marki w&nbsp;całym ekosystemie Google jednocześnie.',
      },
    ],
    optimization: [
      {
        title: 'Semantyczne trójki i&nbsp;Answer-First',
        desc: 'Gemini interpretuje świat przez grafy wiedzy. Kluczowe fakty formułujemy w&nbsp;strukturze Podmiot – Orzeczenie – Dopełnienie bezpośrednio pod nagłówkami H2/H3. Jednozdaniowa definicja lub odpowiedź w&nbsp;pierwszych 50-100 słowach sekcji (answer capsule 40-80 słów) – to format który silnik wyciąga jako snippet. Wdrożenie trójek semantycznych zwiększyło liczbę cytowań o&nbsp;642% w&nbsp;kontrolowanym badaniu HubSpot.',
      },
      {
        title: 'FAQPage schema + PAA pokrycie',
        desc: 'AI Overviews chętnie wyciągają fragmenty z&nbsp;FAQ. Każdy artykuł powinien mieć 6-12 sensownych pytań w&nbsp;FAQPage schema, pokrywających frazy People Also Ask (PAA) dla danego tematu. Audytujemy PAA pokrycie i&nbsp;wdrażamy FAQ schema jako standard.',
      },
      {
        title: 'Topical authority cluster + E-E-A-T',
        desc: 'Gemini premiuje strony z&nbsp;pogłębioną strukturą tematyczną. Pillar page + sieć wspierających artykułów na podfrazach zwiększa prawdopodobieństwo cytowania dla całego klastra. Sygnały E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) – autorzy z&nbsp;podpisanym portfolio, linki zewnętrzne, wzmianki w&nbsp;mediach branżowych.',
      },
      {
        title: 'Google-Extended a&nbsp;Googlebot – świadoma decyzja',
        desc: 'Google-Extended blokuje dane treningowe Gemini, ale nie blokuje AI Overviews – te korzystają z&nbsp;bieżącego indeksu Googlebot. Zablokowanie samego Googlebot eliminuje stronę ze wszystkich wyników Google. Doradzamy optymalną konfigurację robots.txt zależnie od Twojej strategii ochrony treści i&nbsp;celów GEO.',
      },
    ],
    signals: [
      'Pozycja organiczna 1-20 w&nbsp;Google (94% cytowań pochodzi z&nbsp;tej puli)',
      'FAQPage schema z&nbsp;pytaniami PAA',
      'Semantyczne trójki Podmiot–Orzeczenie–Dopełnienie w&nbsp;leadach sekcji',
      'Topical authority – pillar + klaster artykułów wspierających',
      'E-E-A-T: autor + linki zewnętrzne + wzmianki branżowe',
      'Googlebot allow + Core Web Vitals w&nbsp;normie',
    ],
    faq: [
      {
        q: 'Jak pozycjonować markę w&nbsp;Google Gemini?',
        a: 'Dwa poziomy działania: (1) klasyczne SEO pod Google – bo 94% cytowań pochodzi z&nbsp;top 20 organicznych; (2) GEO twist – fact-density, FAQPage schema, trójki semantyczne i&nbsp;topical authority cluster. Zaczynamy od audytu cytowań w&nbsp;AI Overviews dla kluczowych fraz Twojej branży, żeby zobaczyć gdzie marka jest, a&nbsp;gdzie jej nie ma.',
      },
      {
        q: 'Czy AI Overviews są już w&nbsp;Polsce?',
        a: 'Tak – aktywne dla wybranych zapytań informacyjnych i&nbsp;pytań bezpośrednich. Pełny rollout postępuje kwartał po kwartale. Już teraz możemy zmierzyć obecność marki dla branżowych fraz core i&nbsp;zaplanować optymalizację zanim konkurencja się zorientuje.',
      },
      {
        q: 'Czy AI Overviews obniżają ruch na mojej stronie?',
        a: 'Dla stron które są cytowane – AI Overview to dodatkowy kanał ekspozycji z&nbsp;linkiem do źródła. Dla stron które nie są cytowane – AI Overview może "zjadać" kliknięcia organiczne (CTR spada do 8% wg Pew Research przy obecności AIO). Dlatego kluczowe jest znalezienie się w&nbsp;cytowanych źródłach, a&nbsp;nie bycie "za" blokiem generatywnym.',
      },
      {
        q: 'Jak mierzycie wyniki dla Gemini?',
        a: 'Citation Rate (udział URL w&nbsp;blokach AIO), Share of Model (procentowy udział wzmianek marki dla zestawu zapytań testowych) oraz monitoring AI Referrals w&nbsp;Google Analytics 4 (source/medium z&nbsp;domen Google AI). Raport miesięczny z&nbsp;benchmarkiem konkurencji i&nbsp;rekomendacjami kolejnych kroków.',
      },
    ],
  },

  perplexity: {
    heroSubtitle:
      'Perplexity AI – najbardziej "search-first" model na rynku. Każda odpowiedź ma wbudowane cytowania (1-10 linków). Najwyższy odsetek pageviews z&nbsp;LLM-ów do stron docelowych.',
    metaDescription:
      'Pozycjonowanie marki w Perplexity AI. Optymalizacja pod cytowania (Sources panel), audyt widoczności w Pro Search. Najlepszy ROI z LLM traffic.',
    howItWorks: [
      {
        title: 'Citation-first architecture',
        desc: 'Perplexity ZAWSZE pokazuje źródła. Każde stwierdzenie ma numer w&nbsp;tekście odsyłający do listy linków. Cytowanie = traffic, bo użytkownicy klikają.',
      },
      {
        title: 'Pro Search z&nbsp;głębszym researchem',
        desc: 'Tryb płatny używa multi-step reasoning + 5-10 źródeł na odpowiedź zamiast 3-5. Więcej szans na cytowanie.',
      },
      {
        title: 'Discover feed',
        desc: 'Strona główna Perplexity to feed trending pytań z&nbsp;cytowanymi źródłami. Wysokie cytowania = pojawienie się w&nbsp;Discover.',
      },
    ],
    optimization: [
      {
        title: 'Świeżość ponad wszystko',
        desc: 'Perplexity preferuje strony z&nbsp;ostatnich 6 miesięcy. Aktualizuj kluczowe artykuły co kwartał, ustawiaj updatedAt schema.',
      },
      {
        title: 'Strukturalny content',
        desc: 'Headings, bullets, tabele. Perplexity ekstraktuje konkretne fragmenty – nie cytuje całych paragrafów.',
      },
      {
        title: 'PerplexityBot allow',
        desc: 'User-agent: PerplexityBot. Plus: Perplexity-User dla on-demand fetches.',
      },
      {
        title: 'Domain authority + niche relevance',
        desc: 'Perplexity faworyzuje wyspecjalizowane domeny w&nbsp;niszy. Generic content farms wycina.',
      },
    ],
    signals: [
      'Świeżość contentu (updatedAt < 6 mc)',
      'Strukturalna treść (headings, lists, tables)',
      'PerplexityBot allow',
      'Niche authority (specjalizacja > breadth)',
      'Outbound citations (linki do badań)',
    ],
    faq: [
      {
        q: 'Jak pozycjonować się w&nbsp;Perplexity?',
        a: 'Perplexity nagradza świeżość, strukturę i&nbsp;specjalizację. Aktualizuj content kwartalnie, używaj headings/bullets/tabel, pozwól PerplexityBot crawlować, buduj wąską ekspertyzę zamiast szerokiego portalu.',
      },
      {
        q: 'Czy Perplexity daje realny traffic?',
        a: 'Tak – najwyższy CTR z&nbsp;LLM-ów. Użytkownicy klikają w&nbsp;Sources panel, bo każdy ma wątpliwości i&nbsp;chce zweryfikować. Spodziewaj się 2-5% odwiedzin użytkowników którzy zobaczyli cytowanie.',
      },
      {
        q: 'Perplexity vs Google – który priorytet?',
        a: 'Dla niszowych B2B – Perplexity ma już 10-20% udziału w&nbsp;research queries decision-makerów. Audyt pokaże proporcje w&nbsp;Twojej branży.',
      },
    ],
  },

  'bing-copilot': {
    heroSubtitle:
      'Microsoft Copilot wbudowany w&nbsp;Edge, Windows 11 i&nbsp;Microsoft 365 – domyślny asystent AI dla setek milionów użytkowników enterprise. Korzysta z&nbsp;indeksu Bing i&nbsp;modelu GPT-4 przez Azure. Widoczność w&nbsp;Bing Webmaster Tools ma dedykowany panel AI Performance z&nbsp;twardymi danymi o&nbsp;cytowaniach.',
    metaDescription:
      'Pozycjonowanie marki w Microsoft Copilot. Audyt cytowań w Copilot dla Edge, Windows i M365. Optymalizacja pod indeks Bing, IndexNow, Schema.org i panel AI Performance. GEO dla użytkowników enterprise.',
    howItWorks: [
      {
        title: 'Bing index + mechanizm RAG',
        desc: 'Copilot działa w&nbsp;oparciu o&nbsp;architekturę RAG zasilaną indeksem Bing. Gdy użytkownik zadaje pytanie, system generuje uproszczone zapytania uziemiające (grounding queries), pobiera dokumenty z&nbsp;top 20 organicznych Bing, fragmentuje je i&nbsp;syntetyzuje odpowiedź. Korelacja między pozycją w&nbsp;Bing a&nbsp;cytowaniem w&nbsp;Copilot jest silna – widoczność w&nbsp;Bing to wejście do puli kandydatów.',
      },
      {
        title: 'Azure OpenAI i&nbsp;model GPT-4',
        desc: 'Pod spodem Copilota działa GPT-4 przez Microsoft Azure. Mechanika cytowania zbliżona do ChatGPT SearchGPT – 3-5 linków na odpowiedź w&nbsp;standardowym trybie. W&nbsp;Copilot Search Microsoft testuje ograniczenie klikalności do małych znaczników numerycznych przy zdaniach, co przesuwa ciężar z&nbsp;ruchu na widoczność marki w&nbsp;samej syntezie.',
      },
      {
        title: 'Natywna integracja z&nbsp;ekosystemem Microsoft',
        desc: 'Copilot jest dostępny one-click w&nbsp;Edge, wbudowany w&nbsp;Windows 11 i&nbsp;zintegrowany z&nbsp;Microsoft 365 (Teams, SharePoint, Outlook). Niska bariera wejścia = wysokie użycie w&nbsp;środowiskach korporacyjnych. Zapytania generowane przez pracowników enterprise mają wysoką intencję biznesową i&nbsp;często dotyczą decyzji zakupowych lub przetargów.',
      },
      {
        title: 'Panel AI Performance w&nbsp;Bing Webmaster Tools',
        desc: 'Microsoft udostępnił dedykowane narzędzie analityczne dla GEO: AI Performance agreguje dane o&nbsp;cytowaniach z&nbsp;Copilot i&nbsp;Bing Generative Search. Raportuje Total Citations, Average Cited Pages i&nbsp;rozkład cytowań na konkretne URL. Grounding Queries pokazują, pod jakie frazy semantyczne Copilot pobiera dane z&nbsp;Twojej witryny.',
      },
    ],
    optimization: [
      {
        title: 'Bing Webmaster Tools + IndexNow',
        desc: 'Zarejestrowanie domeny, weryfikacja, submit sitemap XML (tylko kanoniczne URL, dynamicznie aktualizowane). IndexNow to protokół push-notification o&nbsp;zmianach contentu – po wdrożeniu zmiany na stronie są widoczne w&nbsp;indeksie Bing w&nbsp;ciągu minut, nie dni. Konfigurujemy oba w&nbsp;ramach audytu technicznego i&nbsp;ustawiamy automatyczne zgłoszenia po każdej publikacji.',
      },
      {
        title: 'Answer capsules i&nbsp;surowy HTML',
        desc: 'Oficjalne wytyczne Microsoftu: kapsuły odpowiedzi (40-80 słów) zlokalizowane bezpośrednio pod nagłówkami H2/H3. Treść musi być renderowana po stronie serwera (SSR) – Bingbot nie wykonuje JavaScript w&nbsp;oknie pobrania dla RAG. TTFB powyżej 1 sekundy automatycznie eliminuje stronę z&nbsp;procesu uziemiania. Audytujemy wydajność serwera i&nbsp;renderowanie.',
      },
      {
        title: 'Schema.org rich results (Article, FAQ, HowTo, Product)',
        desc: 'Bing mocno korzysta z&nbsp;danych strukturalnych przy budowaniu snippetów i&nbsp;wyborze źródeł do syntezy. FAQPage schema zwiększa szansę wyciągnięcia konkretnej odpowiedzi przez Copilot. Dla e-commerce: Product schema + integracja z&nbsp;Microsoft Merchant Center (format UCP) daje dostęp do agentów zakupowych Copilot.',
      },
      {
        title: 'Bing Places + NAP consistency',
        desc: 'Bing Places for Business to kluczowe źródło danych o&nbsp;encji dla sektora B2B w&nbsp;środowiskach Windows/M365. Copilot weryfikuje tożsamość marki przez triangulację danych z&nbsp;Bing Places, Google Business Profile i&nbsp;zewnętrznych portali branżowych. Niespójność NAP (nazwa, adres, telefon) między platformami obniża zaufanie algorytmu AI do istnienia encji.',
      },
    ],
    signals: [
      'Pozycja top 20 w&nbsp;Bing Search (warunek wejścia do puli RAG)',
      'TTFB poniżej 1 sekundy + SSR (próg eliminacyjny przy uziemianiu)',
      'IndexNow – szybka re-indeksacja po aktualizacjach',
      'Schema.org Article + FAQ + HowTo + Product',
      'Bingbot allow + AI Performance panel skonfigurowany',
      'Bing Places for Business + spójne dane NAP między platformami',
    ],
    faq: [
      {
        q: 'Jak pozycjonować markę w&nbsp;Microsoft Copilot?',
        a: 'Trzy filary: (1) technika – Bing Webmaster Tools, IndexNow, szybki SSR, robots.txt z&nbsp;Bingbot allow; (2) struktura treści – answer capsules pod nagłówkami, Schema.org, precyzyjne dane zamiast ogólników; (3) autorytet encji – Bing Places, spójne NAP, wzmianki w&nbsp;zewnętrznych źródłach B2B. Zaczynamy od audytu panelu AI Performance, który pokazuje bieżące cytowania i&nbsp;grounding queries.',
      },
      {
        q: 'Czy Bing Copilot ma znaczenie w&nbsp;Polsce?',
        a: 'Market share Copilot jest mniejszy niż ChatGPT, ale w&nbsp;segmencie enterprise (Windows + M365) jest to domyślny asystent AI dla wielu organizacji. Firmy z&nbsp;branży IT, finansowej, prawnej i&nbsp;produkcyjnej – gdzie Microsoft 365 jest standardem – mają wysoką ekspozycję na Copilot. Audyt pokaże realny udział Copilot w&nbsp;zapytaniach Twojej niszy.',
      },
      {
        q: 'Bing SEO vs Google SEO – co jest inne?',
        a: 'Bing mocniej waży: exact match keywords w&nbsp;tytułach i&nbsp;nagłówkach, dane strukturalne Schema.org, social signals z&nbsp;LinkedIn (istotny w&nbsp;B2B), świeżość (preferencja treści poniżej 1 roku). Google bardziej: profil linków zwrotnych, Core Web Vitals, EEAT. Optymalizacja pod Bing często synergicznie wspiera widoczność w&nbsp;ChatGPT SearchGPT, który korzysta z&nbsp;tego samego indeksu.',
      },
      {
        q: 'Jak mierzycie efekty dla Copilot?',
        a: 'Podstawą jest panel AI Performance w&nbsp;Bing Webmaster Tools – Total Citations, Grounding Queries, Page-Level Citation Activity. Uzupełniamy monitoringiem Bingbot w&nbsp;logach serwera i&nbsp;Share of Model dla zestawu zapytań testowych. Raport miesięczny z&nbsp;benchmarkiem i&nbsp;planem na kolejne 30 dni.',
      },
    ],
  },
};
