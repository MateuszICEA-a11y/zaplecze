/**
 * Treść per model AI dla podstron /pozycjonowanie-ai/[slug].
 * Każdy obiekt: hero, jak działa, jak optymalizować, FAQ.
 *
 * Dane oparte na docs/widocznosc-ai/keyword-map.md (PAA pytania)
 * i publicznej dokumentacji każdego modelu (data odcięcia wiedzy, RAG, cytowania).
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
      'OpenAI ChatGPT z&nbsp;trybem ChatGPT Search – najczęściej używany asystent AI w&nbsp;Polsce, obsługujący ponad 250 milionów użytkowników tygodniowo. Cytuje ze statycznych danych treningowych oraz przez mechanizm RAG oparty na indeksie Bing w&nbsp;czasie rzeczywistym. Widoczność w&nbsp;obu ścieżkach wymaga osobnych działań optymalizacyjnych.',
    metaDescription:
      'Pozycjonowanie marki w ChatGPT i ChatGPT Search. Audyt cytowań, optymalizacja treści pod odpowiedzi AI i wyszukiwanie sieciowe. Mierzymy udział marki w odpowiedziach OpenAI.',
    howItWorks: [
      {
        title: 'Dwoista architektura wiedzy',
        desc: 'ChatGPT działa w&nbsp;dwóch trybach. Tryb standardowy opiera się na statycznych wagach treningowych (wiedza do określonej daty aktualizacji bazy) – marka musi istnieć w&nbsp;źródłach skanowanych przez Common Crawl i&nbsp;własne crawlery OpenAI. Tryb ChatGPT Search (sieciowy) realizuje pobieranie w&nbsp;czasie rzeczywistym przez mechanizm RAG.',
      },
      {
        title: 'Mechanizm RAG i zaawansowane wnioskowanie',
        desc: 'W&nbsp;trybie sieciowym zaawansowane modele rozbijają zapytanie na kilka pomocniczych zapytań do wyszukiwarki Bing, pobierają równolegle od 3 do 10 stron i&nbsp;dzielą je na krótkie, zwięzłe fragmenty. Strony, które nie odpowiadają w&nbsp;ciągu 2 sekund, są automatycznie pomijane – szybkość ładowania jest bezwzględnym czynnikiem eliminacyjnym.',
      },
      {
        title: 'Selekcja źródeł – algorytm RRF',
        desc: 'System wybiera najlepsze fragmenty przez algorytm krzyżowego oceniania wyników (RRF), premiując strony spójnie pojawiające się przy różnych wariantach zapytania. Filtr różnorodności zapobiega dominacji jednej domeny – nawet najsilniejsza marka może być zacytowana tylko raz na odpowiedź.',
      },
      {
        title: 'Custom GPT i RAG w niszach B2B',
        desc: 'Tysiące Custom GPT-ów buduje własne bazy wiedzy z&nbsp;plików i&nbsp;stron. Twoje materiały mogą tam trafić jako źródło referencyjne dla zapytań branżowych. To trudny do zmierzenia tradycyjnymi metodami, ale niezwykle kaloryczny kanał ekspozycji marki w&nbsp;segmentach B2B – mierzymy go pośrednio przez monitoring wzmianek.',
      },
    ],
    optimization: [
      {
        title: 'Gęstość faktograficzna we wstępach',
        desc: 'Pierwsze 200 słów artykułu powinno zawierać konkretne liczby, daty i&nbsp;dane źródłowe. ChatGPT cytuje krótkie, faktualne fragmenty – nie poetyckie wstępy ani tekst typowo marketingowy. Zasada: zamiast "jesteśmy liderem rynku" → "64% klientów B2B w&nbsp;Polsce korzysta z&nbsp;narzędzia X wg raportu Y". Audytujemy gęstość faktograficzną i&nbsp;rekomendujemy korekty.',
      },
      {
        title: 'Schema.org Article + Person + sameAs',
        desc: 'Każdy artykuł podpisany autorem z&nbsp;wypełnionym profilem eksperta (LinkedIn, Google Scholar). Dzięki temu AI wie, że tekst napisał prawdziwy, zweryfikowany człowiek. Strony porównawcze (VS, "najlepsze X") są cytowane o&nbsp;11 punktów procentowych częściej niż ogólne artykuły blogowe – wdrażamy ten format w&nbsp;ramach optymalizacji.',
      },
      {
        title: 'llms.txt + robots.txt (OAI-SearchBot)',
        desc: 'Plik llms.txt w&nbsp;katalogu głównym to bezpośredni drogowskaz dla crawlerów AI, który ułatwia cytowanie Twoich treści. Krytyczne rozróżnienie: GPTBot zbiera dane treningowe, a OAI-SearchBot obsługuje wyszukiwanie na żywo (jego blokada to automatyczne wypadnięcie z&nbsp;ChatGPT Search). Konfigurujemy oba agenty zgodnie z&nbsp;Twoją strategią biznesową.',
      },
      {
        title: 'Strony encji i Enhanced Entity Pages',
        desc: 'Jedna podstrona = jedna encja (produkt, usługa, pojęcie). Wszystkie kluczowe fakty widoczne w&nbsp;warstwie tekstowej, uzupełnione kodem JSON-LD. Ułatwia to modelom AI szybkie i bezbłędne zrozumienie Twojej oferty. Budujemy i&nbsp;optymalizujemy strony encji jako część pakietu widoczności GEO.',
      },
    ],
    signals: [
      'Pozycja top 5 w&nbsp;Bing Search (wejście do puli stron branych pod uwagę)',
      'Czas odpowiedzi serwera (TTFB) i ładowania poniżej 2 sekund (próg eliminacyjny AI)',
      'Wysoka gęstość faktograficzna w&nbsp;pierwszych 200 słowach',
      'Schema.org Article + Person z&nbsp;potwierdzonym profilem eksperta',
      'Dopuszczenie OAI-SearchBot w&nbsp;robots.txt oraz wdrożony plik llms.txt',
      'Linki i&nbsp;wzmianki z&nbsp;domen zaufanych (Wikipedia, .gov, .edu)',
    ],
    faq: [
      {
        q: 'Jak pozycjonować markę w&nbsp;ChatGPT?',
        a: 'Działamy na dwóch ścieżkach równolegle: (1) dane treningowe – obecność w&nbsp;wysokiej jakości źródłach skanowanych przez OpenAI przed kolejną aktualizacją bazy; (2) ChatGPT Search – optymalizacja pod indeks Bing, gęstość faktograficzna, szybkość strony i&nbsp;Schema.org. Zaczynamy od audytu cytowań, który pokazuje, na jakich zapytaniach marka już się pojawia i&nbsp;gdzie jest luka wobec konkurencji.',
      },
      {
        q: 'Jak długo trwa pojawienie się w&nbsp;ChatGPT?',
        a: 'ChatGPT Search (tryb sieciowy) – 24-72 godziny od publikacji, jeśli strona jest zaindeksowana w&nbsp;Bing. Statyczne dane treningowe – 6-18 miesięcy do kolejnej aktualizacji bazy wiedzy modelu. Custom GPT – natychmiast po dodaniu do bazy wiedzy. Nasze działania skupiają się przede wszystkim na wyszukiwaniu sieciowym, bo daje mierzalne efekty w&nbsp;tygodniach, nie miesiącach.',
      },
      {
        q: 'Czy ChatGPT cytuje konkretne strony z&nbsp;linkami?',
        a: 'W&nbsp;trybie ChatGPT Search – tak, każde stwierdzenie ma przypis z&nbsp;linkiem do źródła (1-5 cytowań na odpowiedź). W&nbsp;trybie konwersacyjnym (dane treningowe) ChatGPT wymienia marki i&nbsp;produkty bez URL, ale ten sygnał też jest mierzalny. Monitorujemy oba przypadki w&nbsp;ramach usługi stałego śledzenia widoczności.',
      },
      {
        q: 'Jak mierzycie efekty pozycjonowania w&nbsp;ChatGPT?',
        a: 'Kluczowy wskaźnik to Share of Model (SoM) – procentowy udział wzmianek marki w&nbsp;odpowiedziach dla zdefiniowanego zestawu zapytań testowych. Mierzymy też Citation Rate (udział linków URL w&nbsp;przypisach) oraz ruch od agenta OAI-SearchBot w&nbsp;logach serwera. Klient otrzymuje co miesiąc raport z&nbsp;rekomendacjami kolejnych kroków.',
      },
    ],
  },

  claude: {
    heroSubtitle:
      'Anthropic Claude – preferowany model wśród inżynierów, prawników i&nbsp;konsultantów B2B. Cytuje oszczędnie, ale precyzyjnie: 63% źródeł to niszowe blogi techniczne i&nbsp;dokumentacja pisana przez praktyków, a&nbsp;zaledwie 7% to główny nurt mediów. Pozycjonowanie tu wymaga autorytetu merytorycznego, nie marketingowego.',
    metaDescription:
      'Pozycjonowanie marki w Claude (Anthropic). Audyt cytowań, optymalizacja pod Brave Search, budowanie autorytetu eksperckiego w segmentach B2B. Widoczność AI dla osób decyzyjnych i specjalistów.',
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
        title: 'Samodzielne fragmenty odpowiedzi',
        desc: 'Każda sekcja powinna być zrozumiała po wyrwaniu z&nbsp;kontekstu: nagłówek jako pytanie użytkownika, a&nbsp;pod nim bezpośrednia odpowiedź lub definicja. Dzięki temu Claude nie musi zgadywać, o&nbsp;czym jest akapit, i&nbsp;łatwiej wykorzystuje go w&nbsp;syntezie.',
      },
      {
        title: 'Autor, pojęcia i instrukcje w danych strukturalnych',
        desc: 'Profil autora, opis pojęć branżowych i&nbsp;dane dla treści instruktażowych pomagają Claude zrozumieć, kto napisał tekst i&nbsp;czego on dotyczy. To zmniejsza ryzyko błędnej interpretacji oraz wzmacnia zaufanie do eksperckich treści.',
      },
      {
        title: 'Brave Search, IndexNow i dostęp dla botów Claude',
        desc: 'Widoczność w&nbsp;Brave Search wspiera cytowania Claude w&nbsp;czasie rzeczywistym. IndexNow przyspiesza zauważenie zmian po aktualizacji treści, a&nbsp;poprawny robots.txt zapewnia, że boty Claude mogą pobrać strony, które mają pracować na widoczność.',
      },
    ],
    signals: [
      'Pozycja w&nbsp;Brave Search (86,7% korelacja z&nbsp;cytowaniami Claude)',
      'Głębokość treści – 3000+ słów na artykuł filarowy',
      'Brak języka perswazyjnego – dane i&nbsp;cytaty ekspertów zamiast marketingu',
      'Szybkość ładowania FCP poniżej 0,4 s (6,7 cytowań vs 2,1 dla FCP ponad 1,1 s)',
      'Dane strukturalne autora, pojęć i instrukcji – pomagają modelowi rozpoznać eksperckość treści.',
      'Dostęp dla botów Claude, IndexNow i aktualna data modyfikacji – wspierają szybkie zauważenie zmian.',
    ],
    faq: [
      {
        q: 'Jak pozycjonować markę w&nbsp;Claude?',
        a: 'Priorytet to autorytet merytoryczny w&nbsp;Brave Search – bo to z&nbsp;tego indeksu Claude pobiera dane na żywo. Budujemy długie artykuły eksperckie z&nbsp;metodologią, precyzyjnymi danymi i&nbsp;cytatami, podzielone na krótkie, samodzielne fragmenty odpowiedzi. Jednocześnie dbamy o&nbsp;dostępność strony dla botów, szybkie indeksowanie i&nbsp;dane strukturalne. Audyt na starcie pokaże, ile cytowań marka już zbiera i&nbsp;gdzie są luki.',
      },
      {
        q: 'Czy Claude cytuje moją stronę z&nbsp;linkami?',
        a: 'W&nbsp;trybie wyszukiwania na żywo – tak, z&nbsp;przypisami. W&nbsp;trybie konwersacyjnym (bez internetu) Claude wymienia marki i&nbsp;ekspertów, ale rzadko podaje URL. Ruch referencyjny z&nbsp;Claude identyfikujemy przez user-agent Claude-User w&nbsp;logach serwera. Monitorujemy oba sygnały w&nbsp;ramach usługi.',
      },
      {
        q: 'Claude vs ChatGPT – który ważniejszy dla mojego B2B?',
        a: 'Claude obsługuje przede wszystkim inżynierów, prawników, konsultantów i&nbsp;analityków poszukujących rzetelnej syntezy. ChatGPT ma szerszy zasięg, ale często niższą intencję biznesową pojedynczego użytkownika. Jeśli Twoją grupą docelową są osoby decyzyjne i&nbsp;eksperci, Claude może generować ruch o&nbsp;bardzo wysokiej intencji. Audyt widoczności w&nbsp;obu modelach jednocześnie pokaże faktyczne proporcje w&nbsp;Twojej niszy.',
      },
      {
        q: 'Jak długo trwa pojawienie się w&nbsp;wynikach Claude?',
        a: 'Wyszukiwanie na żywo w&nbsp;Claude może zareagować szybciej, jeśli strona jest widoczna w&nbsp;Brave, dostępna dla botów i&nbsp;zgłaszana po aktualizacjach. Dane treningowe zmieniają się wolniej, dlatego skupiamy się na ścieżce, którą da się mierzyć w&nbsp;ciągu tygodni. Co miesiąc raportujemy udział marki w&nbsp;odpowiedziach i&nbsp;cytowaniach.',
      },
    ],
  },

  gemini: {
    heroSubtitle:
      'Google Gemini z&nbsp;bezpośrednim dostępem do indeksu Google Search w&nbsp;czasie rzeczywistym. Zasila AI Overviews w&nbsp;SERP, Workspace, Android i&nbsp;Chrome. Aż 44% cytowań w&nbsp;AI Overviews pochodzi spoza top 20 organicznych – merytoryczna struktura treści ważniejsza niż sama pozycja.',
    metaDescription:
      'Pozycjonowanie marki w Google Gemini i AI Overviews. Optymalizacja pod AI Mode, FAQ, gęstość informacji i autorytet tematyczny. Mierzymy widoczność marki w ekosystemie Google.',
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
        title: 'Wspólny obszar SEO i widoczności AI',
        desc: 'Klasyczne SEO jest warunkiem koniecznym, ale nie zawsze wystarczającym. Gemini analizuje nie tylko pozycję strony, ale też strukturę odpowiedzi, dopasowanie do intencji, wiarygodność autora i&nbsp;spójność faktów. Dlatego treść musi być dobra zarówno dla wyszukiwarki, jak i&nbsp;dla modelu generującego odpowiedź.',
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
      'Semantyczne trójki Podmiot–Orzeczenie–Dopełnienie we wstępach sekcji',
      'Topical authority – pillar + klaster artykułów wspierających',
      'E-E-A-T: autor + linki zewnętrzne + wzmianki branżowe',
      'Googlebot allow + Core Web Vitals w&nbsp;normie',
    ],
    faq: [
      {
        q: 'Jak pozycjonować markę w&nbsp;Google Gemini?',
        a: 'Dwa poziomy działania: (1) klasyczne SEO pod Google; (2) optymalizacja pod odpowiedzi AI: gęstość informacji, FAQ, trójki semantyczne i&nbsp;autorytet tematyczny. Zaczynamy od audytu cytowań w&nbsp;AI Overviews dla kluczowych fraz Twojej branży, żeby zobaczyć gdzie marka jest, a&nbsp;gdzie jej nie ma.',
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
        a: 'Mierzymy udział URL w&nbsp;blokach AI Overviews, udział wzmianek marki dla zestawu zapytań testowych oraz ruch z&nbsp;kanałów AI w&nbsp;Google Analytics 4. Raport miesięczny pokazuje benchmark konkurencji i&nbsp;rekomendacje kolejnych kroków.',
      },
    ],
  },

  perplexity: {
    heroSubtitle:
      'Perplexity AI to wyszukiwarka odpowiedzi z&nbsp;silnym naciskiem na źródła. Każda odpowiedź zawiera cytowania, więc użytkownik może szybko przejść do strony, z&nbsp;której pochodzi informacja.',
    metaDescription:
      'Pozycjonowanie marki w Perplexity AI. Optymalizacja pod cytowania, audyt widoczności i ruch z odpowiedzi AI.',
    howItWorks: [
      {
        title: 'Odpowiedzi oparte na źródłach',
        desc: 'Perplexity pokazuje źródła bezpośrednio przy odpowiedzi. Cytowanie nie jest tylko sygnałem wizerunkowym: może przełożyć się na wejścia na stronę, bo użytkownik od razu widzi, skąd pochodzi informacja.',
      },
      {
        title: 'Pro Search i głębsza analiza',
        desc: 'W&nbsp;trybach wymagających dokładniejszej analizy Perplexity porównuje więcej źródeł i&nbsp;buduje odpowiedź z&nbsp;kilku etapów. To zwiększa szansę na cytowanie stron, które mają jasne dane, aktualne informacje i&nbsp;dobrą strukturę.',
      },
      {
        title: 'Discover i tematy zyskujące uwagę',
        desc: 'Perplexity pokazuje także popularne pytania i&nbsp;źródła, które dobrze odpowiadają na aktualne tematy. Regularnie aktualizowane treści eksperckie mają większą szansę pojawiać się tam, gdzie użytkownicy szukają szybkiej syntezy.',
      },
    ],
    optimization: [
      {
        title: 'Świeżość ponad wszystko',
        desc: 'Perplexity preferuje aktualne źródła. Kluczowe artykuły warto odświeżać co kwartał i&nbsp;jasno pokazywać datę aktualizacji, żeby użytkownik oraz model widzieli, że treść nadal jest ważna.',
      },
      {
        title: 'Strukturalna treść',
        desc: 'Nagłówki, listy i&nbsp;tabele pomagają Perplexity wyciągać konkretne fragmenty. Model nie cytuje całego artykułu, tylko wybiera odpowiedzi, definicje i&nbsp;dane, które da się szybko zweryfikować.',
      },
      {
        title: 'Dostęp dla PerplexityBot',
        desc: 'Jeśli bot Perplexity nie może pobrać strony, model nie wykorzysta jej jako źródła. Sprawdzamy konfigurację robots.txt i&nbsp;dostępność najważniejszych URL, żeby nie blokować cytowań technicznym detalem.',
      },
      {
        title: 'Autorytet domeny i specjalizacja',
        desc: 'Perplexity lepiej traktuje wyspecjalizowane domeny niż ogólne farmy treści. Jeśli chcesz być cytowany, strona musi jasno pokazywać, w&nbsp;jakiej dziedzinie ma realną ekspertyzę.',
      },
    ],
    signals: [
      'Aktualność treści – świeże daty i regularne aktualizacje zwiększają zaufanie do źródła.',
      'Strukturalna treść – nagłówki, listy i tabele ułatwiają modelowi cytowanie konkretnych fragmentów.',
      'Dostęp dla PerplexityBot – bot musi móc pobrać stronę, żeby ją zacytować.',
      'Specjalizacja domeny – wąska ekspertyza zwykle działa lepiej niż szeroki, ogólny portal.',
      'Linki do badań i źródeł – pomagają potwierdzić, że treść opiera się na faktach.',
    ],
    faq: [
      {
        q: 'Jak pozycjonować się w&nbsp;Perplexity?',
        a: 'Perplexity nagradza aktualność, dobrą strukturę i&nbsp;specjalizację. Aktualizuj treści kwartalnie, używaj nagłówków, list i&nbsp;tabel, zadbaj o&nbsp;dostęp dla PerplexityBot i&nbsp;buduj wąską ekspertyzę zamiast szerokiego, ogólnego portalu.',
      },
      {
        q: 'Czy Perplexity daje realny ruch?',
        a: 'Tak, ponieważ użytkownik widzi źródła bezpośrednio przy odpowiedzi i&nbsp;może przejść do strony, żeby zweryfikować szczegóły. Wartość tego ruchu zależy od branży, jakości cytowania i&nbsp;tego, czy strona odpowiada na pytanie lepiej niż konkurencja.',
      },
      {
        q: 'Perplexity vs Google – który priorytet?',
        a: 'Dla niszowych B2B Perplexity bywa ważne, bo użytkownicy korzystają z&nbsp;niego przy badaniu rynku, porównywaniu dostawców i&nbsp;weryfikacji źródeł. Audyt pokaże proporcje w&nbsp;Twojej branży.',
      },
    ],
  },

  'bing-copilot': {
    heroSubtitle:
      'Microsoft Copilot wbudowany w&nbsp;Edge, Windows 11 i&nbsp;Microsoft 365 – domyślny asystent AI w&nbsp;wielu środowiskach firmowych. Korzysta z&nbsp;indeksu Bing i&nbsp;modeli OpenAI przez Azure. Widoczność w&nbsp;Bing Webmaster Tools ma dedykowany panel AI Performance z&nbsp;danymi o&nbsp;cytowaniach.',
    metaDescription:
      'Pozycjonowanie marki w Microsoft Copilot. Audyt cytowań w Copilot dla Edge, Windows i Microsoft 365. Optymalizacja pod indeks Bing, IndexNow, dane strukturalne i panel AI Performance.',
    howItWorks: [
      {
        title: 'Indeks Bing i mechanizm RAG',
        desc: 'Copilot korzysta z&nbsp;indeksu Bing i&nbsp;mechanizmu RAG, czyli pobierania źródeł do odpowiedzi generowanej przez model. Gdy użytkownik zadaje pytanie, system szuka stron, porównuje fragmenty i&nbsp;syntetyzuje odpowiedź. <strong>Widoczność w&nbsp;Bing jest więc wejściem do puli źródeł, z&nbsp;których Copilot może zacytować markę.</strong>',
      },
      {
        title: 'Azure OpenAI i&nbsp;model GPT-4',
        desc: 'Copilot korzysta z&nbsp;modeli OpenAI przez infrastrukturę Microsoft Azure. Mechanika cytowania jest zbliżona do wyszukiwania sieciowego w&nbsp;ChatGPT: użytkownik widzi syntetyczną odpowiedź oraz źródła. To oznacza, że liczy się nie tylko kliknięcie, ale też sama obecność marki w&nbsp;odpowiedzi.',
      },
      {
        title: 'Natywna integracja z&nbsp;ekosystemem Microsoft',
        desc: 'Copilot jest dostępny jednym kliknięciem w&nbsp;Edge, wbudowany w&nbsp;Windows 11 i&nbsp;zintegrowany z&nbsp;Microsoft 365 (Teams, SharePoint, Outlook). Niska bariera wejścia zwiększa użycie w&nbsp;firmach. Zapytania pracowników organizacji często mają wysoką intencję biznesową i&nbsp;dotyczą decyzji zakupowych lub przetargów.',
      },
      {
        title: 'Panel AI Performance w&nbsp;Bing Webmaster Tools',
        desc: 'Microsoft udostępnia dane o&nbsp;widoczności AI w&nbsp;Bing Webmaster Tools. Panel AI Performance pokazuje cytowania, strony wykorzystywane w&nbsp;odpowiedziach oraz zapytania, przy których Copilot pobiera dane z&nbsp;Twojej witryny. To pozwala mierzyć nie tylko ruch, ale też obecność marki w&nbsp;syntezach AI.',
      },
    ],
    optimization: [
      {
        title: 'Bing Webmaster Tools + IndexNow',
        desc: 'Zarejestrowanie domeny, weryfikacja i&nbsp;przesłanie mapy strony (sitemap XML) pomagają Bingowi szybciej znaleźć kluczowe adresy. IndexNow to protokół natychmiastowych powiadomień o&nbsp;zmianach w&nbsp;treści – po wdrożeniu aktualizacje mogą trafić do indeksu Bing w&nbsp;ciągu minut, nie dni. Konfigurujemy oba elementy i&nbsp;ustawiamy automatyczne zgłoszenia po każdej publikacji.',
      },
      {
        title: 'Zwięzłe bloki odpowiedzi pod nagłówkami',
        desc: 'Najważniejsze sekcje powinny zaczynać się od krótkiej, konkretnej odpowiedzi pod nagłówkiem H2 lub H3. To tzw. answer capsules, czyli zwięzłe bloki odpowiedzi. Treść musi być gotowa od razu, najlepiej renderowana po stronie serwera. Jeśli tekst ładuje się z&nbsp;opóźnieniem przez skrypty JavaScript, AI może go pominąć, bo nie ma czasu na czekanie.',
      },
      {
        title: 'Dane strukturalne dla artykułów, FAQ i produktów',
        desc: 'Bing korzysta z&nbsp;danych strukturalnych przy rozumieniu strony i&nbsp;wyborze źródeł. Dla użytkownika biznesowego oznacza to prostą korzyść: model szybciej rozpoznaje, czy strona jest poradnikiem, FAQ, produktem czy opisem usługi, a&nbsp;to zwiększa szansę na użycie właściwego fragmentu w&nbsp;odpowiedzi.',
      },
      {
        title: 'Bing Places i spójność danych teleadresowych',
        desc: 'Bing Places for Business to ważne źródło danych o&nbsp;firmie w&nbsp;środowisku Microsoft. Copilot weryfikuje istnienie Twojej firmy, krzyżowo sprawdzając dane między Bing Places, wizytówką Google i&nbsp;portalami branżowymi. Spójność danych teleadresowych (NAP – Name, Address, Phone) wzmacnia zaufanie do marki jako realnej encji.',
      },
    ],
    signals: [
      'Widoczność w&nbsp;Bing Search – zwiększa szansę wejścia do puli źródeł Copilota.',
      'Szybka strona i treść widoczna w&nbsp;HTML – bot musi móc szybko pobrać właściwy fragment.',
      'IndexNow – szybsze zgłaszanie nowych i&nbsp;zaktualizowanych treści do Bing.',
      'Dane strukturalne Article, FAQ, HowTo i Product – pomagają modelowi zrozumieć typ treści.',
      'Dostęp dla Bingbot i panel AI Performance – pozwalają mierzyć cytowania i usuwać blokady.',
      'Bing Places for Business i spójne dane teleadresowe – wzmacniają wiarygodność marki jako encji.',
    ],
    faq: [
      {
        q: 'Jak pozycjonować markę w&nbsp;Microsoft Copilot?',
        a: 'Trzy filary: (1) technika – Bing Webmaster Tools, IndexNow, szybka strona i dostęp dla Bingbot; (2) struktura treści – krótkie odpowiedzi pod nagłówkami, dane strukturalne i&nbsp;precyzyjne fakty zamiast ogólników; (3) autorytet encji – Bing Places, spójne dane firmy i&nbsp;wzmianki w&nbsp;zewnętrznych źródłach B2B. Zaczynamy od audytu panelu AI Performance, który pokazuje bieżące cytowania.',
      },
      {
        q: 'Czy Bing Copilot ma znaczenie w&nbsp;Polsce?',
        a: 'Udział Copilot jest mniejszy niż ChatGPT, ale w&nbsp;firmach korzystających z&nbsp;Windows i&nbsp;Microsoft 365 bywa domyślnym asystentem AI. Organizacje z&nbsp;branży IT, finansowej, prawnej i&nbsp;produkcyjnej mają wysoką ekspozycję na Copilot. Audyt pokaże realny udział Copilot w&nbsp;zapytaniach Twojej niszy.',
      },
      {
        q: 'Bing SEO vs Google SEO – co jest inne?',
        a: 'Bing mocniej zwraca uwagę na dokładne dopasowanie fraz w&nbsp;tytułach i&nbsp;nagłówkach, dane strukturalne, sygnały z&nbsp;LinkedIn oraz świeżość treści. Google częściej mocniej opiera się na profilu linków, Core Web Vitals i&nbsp;E-E-A-T. Optymalizacja pod Bing często wspiera też widoczność w&nbsp;ChatGPT Search, bo oba kanały korzystają z&nbsp;wyszukiwania sieciowego i&nbsp;źródeł dostępnych dla botów.',
      },
      {
        q: 'Jak mierzycie efekty dla Copilot?',
        a: 'Podstawą jest panel AI Performance w&nbsp;Bing Webmaster Tools: liczba cytowań, strony wykorzystywane w&nbsp;odpowiedziach i&nbsp;zapytania, przy których Copilot pobiera dane z&nbsp;witryny. Uzupełniamy to monitoringiem Bingbot w&nbsp;logach serwera oraz udziałem marki w&nbsp;odpowiedziach dla zestawu zapytań testowych.',
      },
    ],
  },
};
