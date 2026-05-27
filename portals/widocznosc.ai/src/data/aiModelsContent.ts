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
      'Pozycjonowanie marki w ChatGPT i ChatGPT Search. Audyt cytowań, optymalizacja treści pod odpowiedzi AI i wyszukiwanie w czasie rzeczywistym. Mierzymy udział marki w odpowiedziach OpenAI.',
    howItWorks: [
      {
        title: 'Dwoista architektura wiedzy',
        desc: 'ChatGPT działa w&nbsp;dwóch ścieżkach. Tryb standardowy opiera się na statycznych wagach treningowych (wiedza do określonej daty aktualizacji bazy) – marka musi istnieć w&nbsp;źródłach skanowanych przez Common Crawl i&nbsp;własne crawlery OpenAI. ChatGPT Search pobiera aktualne źródła w&nbsp;czasie rzeczywistym przez mechanizm RAG.',
      },
      {
        title: 'Mechanizm RAG i zaawansowane wnioskowanie',
        desc: 'W&nbsp;ChatGPT Search zaawansowane modele rozbijają zapytanie na kilka pomocniczych zapytań do wyszukiwarki Bing, pobierają równolegle od 3 do 10 stron i&nbsp;dzielą je na krótkie, zwięzłe fragmenty. Strony, które nie odpowiadają w&nbsp;ciągu 2 sekund, są automatycznie pomijane – szybkość ładowania jest bezwzględnym czynnikiem eliminacyjnym.',
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
        desc: 'Każdy artykuł podpisany autorem z&nbsp;wypełnionym profilem eksperta (LinkedIn, Google Scholar). Dzięki temu AI widzi, że tekst napisała zweryfikowana osoba z&nbsp;konkretnym dorobkiem. Strony porównawcze (VS, "najlepsze X") są cytowane o&nbsp;11 punktów procentowych częściej niż ogólne artykuły blogowe – wdrażamy ten format w&nbsp;ramach optymalizacji.',
      },
      {
        title: 'llms.txt + robots.txt (OAI-SearchBot)',
        desc: 'Plik llms.txt w&nbsp;katalogu głównym traktujemy jako nieinwazyjną praktykę porządkowania najważniejszych zasobów serwisu, ale obecne testy nie dowodzą, że boty AI często go odwiedzają ani że sam plik bezpośrednio zwiększa cytowania. Krytyczne pozostaje rozróżnienie botów w&nbsp;robots.txt: GPTBot zbiera dane treningowe, a OAI-SearchBot obsługuje wyszukiwanie w&nbsp;ChatGPT Search. Konfigurujemy dostęp crawlerów zgodnie z&nbsp;Twoją strategią biznesową.',
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
      'Dopuszczenie OAI-SearchBot w&nbsp;robots.txt oraz opcjonalny, uporządkowany plik llms.txt',
      'Linki i&nbsp;wzmianki z&nbsp;domen zaufanych (Wikipedia, .gov, .edu)',
    ],
    faq: [
      {
        q: 'Jak pozycjonować markę w&nbsp;ChatGPT?',
        a: 'Działamy na dwóch ścieżkach równolegle: (1) dane treningowe – obecność w&nbsp;wysokiej jakości źródłach skanowanych przez OpenAI przed kolejną aktualizacją bazy; (2) ChatGPT Search – optymalizacja pod indeks Bing, gęstość faktograficzna, szybkość strony i&nbsp;Schema.org. Zaczynamy od audytu cytowań, który pokazuje, na jakich zapytaniach marka już się pojawia i&nbsp;gdzie jest luka wobec konkurencji.',
      },
      {
        q: 'Jak długo trwa pojawienie się w&nbsp;ChatGPT?',
        a: 'ChatGPT Search – 24-72 godziny od publikacji, jeśli strona jest zaindeksowana w&nbsp;Bing. Statyczne dane treningowe – 6-18 miesięcy do kolejnej aktualizacji bazy wiedzy modelu. Custom GPT – natychmiast po dodaniu do bazy wiedzy. Nasze działania skupiają się przede wszystkim na wyszukiwaniu w&nbsp;czasie rzeczywistym, bo daje mierzalne efekty w&nbsp;tygodniach, nie miesiącach.',
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
      'Anthropic Claude to preferowany model sztucznej inteligencji wśród inżynierów, prawników i&nbsp;konsultantów B2B. Cytuje oszczędnie, ale niezwykle precyzyjnie: 63% źródeł to niszowe blogi techniczne i&nbsp;dokumentacja pisana przez praktyków, a&nbsp;zaledwie 7% to główny nurt mediów. Pozycjonowanie w&nbsp;tym ekosystemie wymaga budowy autorytetu merytorycznego, a&nbsp;nie typowo marketingowego.',
    metaDescription:
      'Pozycjonowanie marki w Claude (Anthropic). Audyt cytowań, optymalizacja pod Brave Search (silnik RAG Claude), budowanie autorytetu eksperckiego. Widoczność AI (GEO) dla sektora B2B.',
    howItWorks: [
      {
        title: 'Konstytucyjne AI (Constitutional AI) i filtr wiarygodności',
        desc: 'Claude działa w&nbsp;oparciu o&nbsp;zasady "pomocny, nieszkodliwy, uczciwy" (tzw. zasada 3H). Model automatycznie ignoruje język perswazyjny, typowo sprzedażowy i&nbsp;wyolbrzymione dane. Strona, która sama cytuje rzetelne badania i&nbsp;dokumentację zewnętrzną, wygląda dla algorytmu wiarygodnie – ta, która pisze o&nbsp;sobie "najlepszy na rynku", jest pomijana. Budujemy treści ściśle zgodne z&nbsp;tym filtrem.',
      },
      {
        title: 'Brave Search jako silnik wyszukiwania',
        desc: 'W&nbsp;trybie wyszukiwania na żywo Claude korzysta z&nbsp;indeksu wyszukiwarki Brave Search (ponad 30 mld stron) poprzez dedykowane API. Korelacja między wysoką pozycją w&nbsp;Brave a&nbsp;cytowaniem przez Claude wynosi aż 86,7%. Brave nie używa klasycznego systemu linków (PageRank) – premiuje strony o&nbsp;realnym zaangażowaniu użytkowników na podstawie zanonimizowanych danych z&nbsp;przeglądarek (Web Discovery Project). Daje to ogromną szansę niszowym ekspertom.',
      },
      {
        title: 'Trzy wyspecjalizowane boty Anthropic',
        desc: 'Ekosystem opiera się na trzech agentach: <code>ClaudeBot</code> zbiera dane treningowe, <code>Claude-User</code> analizuje linki wklejone przez użytkowników w&nbsp;czacie, a&nbsp;<code>Claude-SearchBot</code> obsługuje wyszukiwanie na żywo. Każdy z&nbsp;nich wymaga osobnej konfiguracji w&nbsp;pliku robots.txt. Przypadkowe zablokowanie <code>Claude-SearchBot</code> całkowicie usuwa stronę z&nbsp;bazy cytowań w&nbsp;czasie rzeczywistym.',
      },
      {
        title: 'Preferencja dla świeżych treści (Recency bias)',
        desc: 'Strony starsze niż 3 miesiące odnotowują w&nbsp;Claude gwałtowny spadek cytowań w&nbsp;tematach, które dynamicznie się zmieniają. Dodanie znaczników świeżości w&nbsp;adresie URL (np. dodanie roku /2026/) zwiększa udział w&nbsp;cytowaniach średnio o&nbsp;24%. W&nbsp;ramach współpracy wdrażamy kwartalny cykl aktualizacji kluczowych artykułów.',
      },
    ],
    optimization: [
      {
        title: 'Długie formaty eksperckie z danymi i metodologią',
        desc: 'Claude preferuje obszerne artykuły (powyżej 3000 słów) z&nbsp;konkretną metodologią, precyzyjnymi danymi oraz cytatami ekspertów. Badania naukowców z&nbsp;Uniwersytetu Princeton wykazują, że taktyki wplatania statystyk i&nbsp;cytatów zwiększają widoczność w&nbsp;modelach AI o&nbsp;30-40%. Każde 500 słów tekstu powinno zawierać co najmniej jedną tabelę, listę lub blok danych – projektujemy taką strukturę podczas audytu.',
      },
      {
        title: 'Samodzielne bloki treści (SCU)',
        desc: 'Claude analizuje tekst, dzieląc go na małe partie (40-60 słów). Taki fragment musi być zrozumiały sam w&nbsp;sobie – jeśli AI będzie musiało szukać kontekstu w&nbsp;innej części strony, algorytm go odrzuci. Wdrażamy zasadę "odpowiedź na początku": każda sekcja zaczyna się od nagłówka-pytania, a&nbsp;bezpośrednio pod nim znajduje się konkretna definicja lub odpowiedź.',
      },
      {
        title: 'Schema.org: Person + DefinedTerm + HowTo',
        desc: 'Wdrażamy znaczniki ustrukturyzowane. Profil autora (<code>Person</code>) wskazuje AI konkretny zakres specjalizacji. Znacznik <code>DefinedTerm</code> dla autorskich pojęć branżowych eliminuje ryzyko błędnej interpretacji przez model. <code>HowTo</code> idealnie sprawdza się dla procesów instruktażowych. Dzięki temu modele AI traktują Twoją stronę nie jak zwykły tekst, ale jak ustrukturyzowaną, maszynowo czytelną bazę wiedzy.',
      },
      {
        title: 'Brave Search + IndexNow + zezwolenie dla Claude-SearchBot',
        desc: 'Wysoka widoczność w&nbsp;Brave Search to bezpośredni warunek cytowania przez Claude w&nbsp;czasie rzeczywistym. Wdrażamy protokół IndexNow, który błyskawicznie informuje wyszukiwarki o&nbsp;zmianach (aktualizacje widoczne w&nbsp;ciągu minut). Dbamy też o&nbsp;to, aby agenty <code>Claude-SearchBot</code> i&nbsp;<code>ClaudeBot</code> miały odpowiednie zezwolenia (allow) w&nbsp;pliku robots.txt.',
      },
    ],
    signals: [
      'Wysoka pozycja w&nbsp;Brave Search (86,7% korelacji z&nbsp;cytowaniami Claude)',
      'Głębokość treści – merytoryczne artykuły powyżej 3000 słów',
      'Brak języka sprzedażowego – twarde dane i&nbsp;cytaty ekspertów zamiast haseł marketingowych',
      'Czas pierwszego renderowania (FCP) poniżej 0,4 sekundy',
      'Ustrukturyzowane dane Schema.org (Person, DefinedTerm, HowTo)',
      'Zezwolenie (allow) dla <code>Claude-SearchBot</code>, IndexNow oraz aktualna data modyfikacji (<code>updatedAt</code>)',
    ],
    faq: [
      {
        q: 'Jak pozycjonować markę w&nbsp;Claude?',
        a: 'Priorytetem jest budowa autorytetu merytorycznego w&nbsp;wyszukiwarce Brave Search – to stamtąd Claude pobiera dane na żywo. Tworzymy długie artykuły eksperckie z&nbsp;metodologią, statystykami i&nbsp;cytatami, podzielone na krótkie, zrozumiałe bloki tekstu. Równolegle dbamy o&nbsp;technikalia: optymalizację robots.txt, wdrożenie IndexNow i&nbsp;danych Schema.org. Audyt na starcie pokaże, ile cytowań marka już zbiera i&nbsp;gdzie są luki.',
      },
      {
        q: 'Czy Claude cytuje moją stronę z&nbsp;linkami?',
        a: 'W&nbsp;trybie wyszukiwania na żywo – tak, każda informacja ma przypis z&nbsp;linkiem. W&nbsp;trybie konwersacyjnym (bez dostępu do internetu) Claude wymienia marki i&nbsp;ekspertów, ale rzadko podaje adres URL. Ruch bezpośredni z&nbsp;Claude zidentyfikujemy w&nbsp;logach Twojego serwera. W&nbsp;ramach usługi monitorujemy obie te ścieżki.',
      },
      {
        q: 'Claude vs ChatGPT – który ważniejszy dla mojego B2B?',
        a: 'Claude obsługuje przede wszystkim inżynierów, prawników, konsultantów i&nbsp;analityków poszukujących rzetelnej syntezy danych. ChatGPT ma szerszy zasięg, ale często niższą intencję biznesową ze strony użytkownika. Jeśli Twoją grupą docelową są osoby decyzyjne i&nbsp;specjaliści, Claude generuje ruch o&nbsp;bardzo wysokiej wartości konwersyjnej. Audyt widoczności w&nbsp;obu modelach precyzyjnie pokaże proporcje dla Twojej branży.',
      },
      {
        q: 'Jak długo trwa pojawienie się w&nbsp;wynikach Claude?',
        a: 'W&nbsp;przypadku wyszukiwania na żywo (Brave Search) – od 48 do 96 godzin po wdrożeniu zmian i&nbsp;protokołu IndexNow. Aktualizacja statycznych danych treningowych zajmuje od kilku do kilkunastu miesięcy. Dlatego skupiamy się na optymalizacji wyszukiwania w&nbsp;czasie rzeczywistym, co daje klientom mierzalne efekty już w&nbsp;ciągu kilku tygodni.',
      },
    ],
  },

  gemini: {
    heroSubtitle:
      'Google Gemini to model AI z&nbsp;bezpośrednim dostępem do wyszukiwarki Google w&nbsp;czasie rzeczywistym. Zasila on Podsumowania AI (AI Overviews) i&nbsp;AI Mode w&nbsp;wynikach wyszukiwania, a&nbsp;także usługi Workspace, Android i&nbsp;Chrome. Z&nbsp;badań wynika, że aż 44% linków pojawiających się w&nbsp;odpowiedziach AI pochodzi spoza standardowego TOP 20 wyników. Oznacza to, że merytoryczna struktura Twoich treści jest dziś ważniejsza niż sama pozycja w&nbsp;tradycyjnym rankingu.',
    metaDescription:
      'Pozycjonowanie marki w Google Gemini i AI Overviews. Optymalizacja pod intencje AI, znaczniki FAQ, autorytet tematyczny i gęstość faktów. Mierzymy widoczność w ekosystemie Google.',
    howItWorks: [
      {
        title: 'Pobieranie danych na żywo (Grounding)',
        desc: 'Gemini nie polega wyłącznie na wiedzy, na której został wytrenowany – pobiera aktualne dane bezpośrednio z&nbsp;indeksu Google. Kiedy zapytanie użytkownika jest złożone, model rozbija je na kilka mniejszych pytań pomocniczych i&nbsp;przeszukuje sieć równolegle. Strony, które są widoczne na te poboczne, szczegółowe pytania, mają o&nbsp;161% wyższe prawdopodobieństwo zacytowania w&nbsp;gotowej odpowiedzi AI.',
      },
      {
        title: 'Podsumowania AI (AI Overviews) i AI Mode w Google',
        desc: 'AI Overviews to generowany przez Gemini blok odpowiedzi w wynikach wyszukiwania Google, a AI Mode to osobny, konwersacyjny tryb wyszukiwania dla bardziej złożonych pytań i dopytań. Oba formaty korzystają z&nbsp;generatywnej warstwy Google Search i mogą kierować użytkownika do cytowanych źródeł. Dla marek oznacza to konieczność optymalizacji nie tylko pod klasyczne pozycje organiczne, ale też pod fragmenty, które Google może wykorzystać w odpowiedzi AI.',
      },
      {
        title: 'Część wspólna tradycyjnego SEO i widoczności AI (GEO)',
        desc: 'Klasyczne SEO jest warunkiem koniecznym, ale nie wystarczającym do pojawienia się w&nbsp;Gemini. Badania pokazują, że choć większość Podsumowań AI zawiera przynajmniej jedno źródło z&nbsp;TOP 20, to aż 44% wszystkich linków w&nbsp;AI Overviews pochodzi z&nbsp;dalszych pozycji. W&nbsp;odpowiedziach generatywnych szczególnie rośnie znaczenie sygnałów znanych również z&nbsp;SEO: poprawności faktograficznej, dopasowania do intencji, jasnej struktury odpowiedzi i&nbsp;autorytetu źródła.',
      },
      {
        title: 'Pełna integracja z ekosystemem Google',
        desc: 'Google zmierza w&nbsp;kierunku interfejsu w&nbsp;formie czatu (AI Mode), gdzie cytowania są naturalnie wbudowane w&nbsp;konwersację. Ponadto, Gemini zasila aplikacje Workspace (Docs, Gmail, Meet) oraz wyszukiwarkę w&nbsp;przeglądarce Chrome. Optymalizując stronę pod Gemini, budujemy widoczność Twojej marki w&nbsp;całym ekosystemie Google jednocześnie.',
      },
    ],
    optimization: [
      {
        title: 'Semantyczne trójki i zasada "Odpowiedź na początku"',
        desc: 'Gemini "rozumie" świat poprzez grafy wiedzy. Dlatego kluczowe fakty w&nbsp;tekstach formułujemy w&nbsp;prostej strukturze (Podmiot – Orzeczenie – Dopełnienie) bezpośrednio pod nagłówkami. Tworzymy zwięzłe bloki odpowiedzi w&nbsp;pierwszych 50-100 słowach. Dzięki temu algorytm Google nie musi zgadywać, o&nbsp;czym jest tekst, i&nbsp;łatwiej umieszcza go w&nbsp;gotowej odpowiedzi. Badania HubSpot wykazały, że ten zabieg zwiększa liczbę cytowań nawet o&nbsp;600%.',
      },
      {
        title: 'Znaczniki FAQ i odpowiadanie na pytania użytkowników',
        desc: 'AI Overviews bardzo chętnie wyciąga fragmenty stron ze zoptymalizowanych sekcji pytań i&nbsp;odpowiedzi (FAQ). Każdy artykuł ekspercki powinien zawierać 6-12 merytorycznych pytań oznaczonych kodem Schema.org, które pokrywają się z&nbsp;sekcją "Podobne pytania" (People Also Ask) z&nbsp;wyszukiwarki. W&nbsp;ramach współpracy audytujemy i&nbsp;wdrażamy ten standard na Twojej stronie.',
      },
      {
        title: 'Autorytet tematyczny i sygnały E-E-A-T',
        desc: 'Gemini premiuje serwisy z&nbsp;pogłębioną strukturą treści. Główny, obszerny artykuł wspierany przez sieć mniejszych tekstów szczegółowych drastycznie zwiększa szansę na cytowanie całego klastra tematycznego. Równie ważne są sygnały E-E-A-T (Doświadczenie, Ekspertyza, Autorytet, Wiarygodność) – dbamy o&nbsp;profile autorów, linki zewnętrzne i&nbsp;wzmianki o&nbsp;Twojej marce w&nbsp;mediach branżowych.',
      },
      {
        title: 'Google-Extended a Googlebot – świadoma konfiguracja',
        desc: 'Zablokowanie robota <code>Google-Extended</code> sprawia, że Google nie użyje Twoich tekstów do trenowania modelu Gemini. Nie blokuje to jednak Twojej obecności w&nbsp;AI Overviews (które korzystają ze standardowego <code>Googlebota</code>). Zablokowanie głównego Googlebota usunęłoby Cię z&nbsp;całej wyszukiwarki. Pomagamy podjąć świadomą decyzję i&nbsp;optymalnie skonfigurować plik robots.txt, aby chronić Twoje treści, nie tracąc przy tym ruchu.',
      },
    ],
    signals: [
      'Pozycja organiczna 1-20 w&nbsp;Google (największa szansa na wejście do puli AI)',
      'Wdrożone znaczniki FAQPage odpowiadające na realne pytania użytkowników',
      'Proste struktury zdań (semantyczne trójki) w&nbsp;pierwszych akapitach sekcji',
      'Autorytet tematyczny – szerokie pokrycie danego zagadnienia w&nbsp;obrębie domeny',
      'Sygnały E-E-A-T: weryfikowalni autorzy, silne linki z&nbsp;zewnątrz i&nbsp;wzmianki branżowe',
      'Dopuszczenie Googlebota w&nbsp;robots.txt oraz szybka i&nbsp;stabilna strona (Core Web Vitals)',
    ],
    faq: [
      {
        q: 'Jak pozycjonować markę w&nbsp;Google Gemini?',
        a: 'Działamy na dwóch poziomach: (1) klasyczne SEO pod wyszukiwarkę Google – ponieważ wysokie pozycje organiczne znacznie ułatwiają wejście do odpowiedzi AI; (2) optymalizacja ściśle pod AI (GEO) – zwiększamy gęstość faktów, wdrażamy odpowiednią strukturę nagłówków, znaczniki FAQ i&nbsp;budujemy autorytet tematyczny. Zaczynamy od audytu Twoich najważniejszych fraz, by sprawdzić, gdzie marka już występuje w&nbsp;AI Overviews, a&nbsp;gdzie traci do konkurencji.',
      },
      {
        q: 'Czy AI Overviews są już w&nbsp;Polsce?',
        a: 'Tak. Google uruchomił AI Overviews w&nbsp;Polsce 26 marca 2025 roku. Funkcja pojawia się dla wybranych zapytań, gdy system uzna, że odpowiedź generatywna będzie pomocna dla użytkownika. Równolegle Google rozwija AI Mode, czyli konwersacyjny tryb wyszukiwania dla bardziej złożonych pytań i&nbsp;dopytań. Już teraz możemy mierzyć obecność Twojej marki w&nbsp;odpowiedziach AI i&nbsp;planować optymalizację pod oba formaty.',
      },
      {
        q: 'Czy AI Overviews obniżają ruch na mojej stronie?',
        a: 'Dla stron, które są cytowane w&nbsp;odpowiedziach AI, jest to potężny, dodatkowy kanał ruchu (użytkownicy klikają w&nbsp;przypisy). Jednak dla stron, które znajdują się w&nbsp;tradycyjnych wynikach, ale nie zostały wybrane przez AI, wskaźnik klikalności (CTR) może znacząco spaść – badania branżowe wskazują, że blok AI przejmuje dużą część uwagi użytkownika. Dlatego celem nie jest już tylko bycie na pierwszej stronie Google, ale bycie źródłem w&nbsp;samej odpowiedzi AI.',
      },
      {
        q: 'Jak mierzycie wyniki dla Gemini?',
        a: 'Śledzimy wskaźnik cytowań (udział Twojej domeny w&nbsp;blokach AI Overviews), udział w&nbsp;odpowiedziach modelu (Share of Model) dla wytypowanej puli pytań testowych, a&nbsp;także monitorujemy realny ruch z&nbsp;usług AI w&nbsp;Google Analytics 4. Co miesiąc otrzymujesz czytelny raport z&nbsp;analizą konkurencji i&nbsp;rekomendacjami kolejnych kroków.',
      },
    ],
  },

  perplexity: {
    heroSubtitle:
      'Perplexity AI to model najbardziej zorientowany na wyszukiwanie spośród wszystkich dostępnych na rynku. Każda wygenerowana odpowiedź ma wbudowane widoczne cytowania (od 1 do 10 linków). Dzięki takiemu interfejsowi, to właśnie z&nbsp;Perplexity notujemy najwyższy odsetek przejść użytkowników (kliknięć) na strony docelowe.',
    metaDescription:
      'Pozycjonowanie marki w Perplexity AI. Optymalizacja pod cytowania (panel Źródła), audyt widoczności w trybie Pro Search. Najwyższy zwrot z inwestycji (ROI) z ruchu od sztucznej inteligencji.',
    howItWorks: [
      {
        title: 'Architektura oparta na cytowaniach',
        desc: 'Perplexity ZAWSZE pokazuje źródła, z&nbsp;których korzysta. Każde stwierdzenie w&nbsp;tekście ma przypis numeryczny odsyłający do konkretnego linku. Obecność w&nbsp;tych przypisach przekłada się na realny ruch, ponieważ użytkownicy chętnie klikają, aby zweryfikować podane informacje lub zgłębić temat.',
      },
      {
        title: 'Tryb Pro Search i pogłębiona analiza',
        desc: 'Płatny tryb wyszukiwania (Pro Search) wykorzystuje wieloetapowe wnioskowanie. Model wykonuje głębszy research i&nbsp;podaje zazwyczaj 5-10 źródeł na odpowiedź (zamiast standardowych 3-5). Dla zoptymalizowanych stron oznacza to znacznie więcej szans na zacytowanie w&nbsp;przypadku skomplikowanych zapytań B2B.',
      },
      {
        title: 'Zakładka Discover (Odkrywaj)',
        desc: 'Strona główna Perplexity to zestawienie najpopularniejszych, trendujących pytań wraz z&nbsp;gotowymi odpowiedziami i&nbsp;zacytowanymi źródłami. Wysoki wskaźnik cytowań w&nbsp;konkretnej niszy zwiększa szansę na pojawienie się Twojej marki w&nbsp;sekcji Discover, co może wygenerować skokowy przyrost ruchu.',
      },
    ],
    optimization: [
      {
        title: 'Świeżość treści ponad wszystko',
        desc: 'Perplexity traktuje priorytetowo strony zaktualizowane w&nbsp;ciągu ostatnich 6 miesięcy. W&nbsp;ramach współpracy wdrażamy kwartalny cykl aktualizacji Twoich kluczowych artykułów oraz ustawiamy odpowiednie znaczniki Schema.org (updatedAt), aby model natychmiast widział, że treść jest aktualna.',
      },
      {
        title: 'Ustrukturyzowana treść ułatwiająca skanowanie',
        desc: 'Perplexity wyciąga z&nbsp;tekstów konkretne dane – nie cytuje długich, lanych akapitów. Optymalizujemy strukturę Twoich stron: wdrażamy jasne nagłówki, listy punktowane i&nbsp;tabele danych. Taki format jest dla algorytmów AI najłatwiejszy do przyswojenia i&nbsp;zacytowania.',
      },
      {
        title: 'Dopuszczenie robotów (PerplexityBot allow)',
        desc: 'Model korzysta z&nbsp;dwóch głównych agentów: <code>PerplexityBot</code> do regularnego skanowania internetu oraz <code>Perplexity-User</code> do pobierania danych w&nbsp;czasie rzeczywistym. Odpowiednio konfigurujemy Twój plik robots.txt. Bez tego technicznego kroku model po prostu ominie Twoją stronę.',
      },
      {
        title: 'Autorytet w wąskiej niszy',
        desc: 'Perplexity faworyzuje domeny, które specjalizują się w&nbsp;jednym, konkretnym temacie. Algorytm skutecznie odrzuca ogólnikowe "farmy treści". Budujemy Twój wizerunek jako wysoce wyspecjalizowanego eksperta, co bezpośrednio podbija szansę na cytowanie.',
      },
    ],
    signals: [
      'Świeżość treści (data aktualizacji poniżej 6 miesięcy)',
      'Ustrukturyzowana treść (przejrzyste nagłówki, listy punktowane, tabele)',
      'Zezwolenie dla agentów <code>PerplexityBot</code> w&nbsp;pliku robots.txt',
      'Autorytet w&nbsp;niszy (wąska specjalizacja jest premiowana wyżej niż szeroka tematyka)',
      'Cytowania zewnętrzne (linkowanie do merytorycznych badań i&nbsp;raportów uwiarygadnia Twój tekst)',
    ],
    faq: [
      {
        q: 'Jak pozycjonować się w&nbsp;Perplexity?',
        a: 'Algorytm Perplexity nagradza świeżość, strukturę danych i&nbsp;specjalizację. Należy aktualizować kluczowe treści co kwartał, używać czytelnych nagłówków i&nbsp;tabel, pozwolić robotom Perplexity na skanowanie strony oraz budować wąską, głęboką ekspertyzę zamiast szerokiego portalu ogólnotematycznego.',
      },
      {
        q: 'Czy Perplexity generuje realny ruch na stronie?',
        a: 'Tak, ze wszystkich modeli językowych to właśnie Perplexity notuje najwyższy wskaźnik klikalności (CTR). Użytkownicy chętnie klikają w&nbsp;panel "Źródła", aby zweryfikować fakty. Możesz spodziewać się, że od 2% do 5% użytkowników, którzy zobaczyli cytowanie Twojej marki, przejdzie na Twoją stronę.',
      },
      {
        q: 'Perplexity czy Google – co powinno być priorytetem?',
        a: 'W&nbsp;przypadku niszowych firm B2B, Perplexity odpowiada już za 10-20% zapytań badawczych (researchowych) wykonywanych przez osoby decyzyjne. Nasz audyt precyzyjnie wskaże proporcje użycia obu wyszukiwarek w&nbsp;Twojej konkretnej branży, co pozwoli odpowiednio alokować budżet.',
      },
    ],
  },

  'bing-copilot': {
    heroSubtitle:
      'Microsoft Copilot wbudowany w&nbsp;przeglądarkę Edge, Windows 11 i&nbsp;pakiet Microsoft 365 – domyślny asystent AI dla setek milionów użytkowników biznesowych. Korzysta z&nbsp;indeksu wyszukiwarki Bing oraz zaawansowanych modeli z&nbsp;rodziny GPT-5, przełączając się między szybkimi odpowiedziami a&nbsp;głębszym rozumowaniem dla złożonych zapytań. W&nbsp;Bing Webmaster Tools Microsoft udostępnił panel AI Performance, który pokazuje, jak często AI cytuje Twoją stronę.',
    metaDescription:
      'Pozycjonowanie marki w Microsoft Copilot. Audyt cytowań w Copilot dla Edge, Windows i M365. Optymalizacja pod indeks Bing, IndexNow, Schema.org i panel AI Performance. Widoczność w AI dla sektora B2B.',
    howItWorks: [
      {
        title: 'Indeks Bing + mechanizm RAG',
        desc: 'Copilot działa w&nbsp;oparciu o&nbsp;architekturę RAG zasilaną indeksem wyszukiwarki Bing. Gdy użytkownik zadaje pytanie, system generuje zapytania pomocnicze (tzw. grounding queries), pobiera dokumenty z&nbsp;top 20 wyników organicznych Bing, dzieli je na mniejsze fragmenty i&nbsp;syntetyzuje odpowiedź. <strong>Korelacja między pozycją w&nbsp;Bing a&nbsp;cytowaniem w&nbsp;Copilot jest bardzo silna – widoczność w&nbsp;tradycyjnych wynikach wyszukiwania to bilet wstępu do odpowiedzi AI.</strong>',
      },
      {
        title: 'Modele GPT-5 i router rozumowania',
        desc: 'Copilot działa obecnie na nowszej generacji modeli OpenAI, z&nbsp;routerem dobierającym tryb odpowiedzi do zadania: szybkie generowanie dla codziennych pytań oraz głębsze rozumowanie dla złożonych analiz. Mechanika cytowania pozostaje powiązana z&nbsp;wyszukiwaniem: Copilot korzysta z&nbsp;indeksu Bing, generuje zapytania pomocnicze i&nbsp;wybiera źródła, które najlepiej uzasadniają odpowiedź.',
      },
      {
        title: 'Natywna integracja z ekosystemem Microsoft',
        desc: 'Copilot jest dostępny na jedno kliknięcie w&nbsp;Edge, wbudowany w&nbsp;system Windows 11 i&nbsp;zintegrowany z&nbsp;Microsoft 365 (Teams, SharePoint, Outlook). Niska bariera wejścia oznacza bardzo wysokie użycie w&nbsp;środowiskach korporacyjnych. Zapytania generowane przez pracowników B2B mają konkretną intencję biznesową i&nbsp;często dotyczą ważnych decyzji zakupowych lub przetargów.',
      },
      {
        title: 'Panel AI Performance w Bing Webmaster Tools',
        desc: 'Microsoft udostępnił dedykowane narzędzie analityczne dla widoczności AI: panel AI Performance w&nbsp;Bing Webmaster Tools agreguje dane o&nbsp;cytowaniach z&nbsp;Microsoft Copilot, odpowiedzi generowanych przez AI w&nbsp;Bing oraz wybranych integracji partnerskich. Pokazuje całkowitą liczbę cytowań, najczęściej wybierane podstrony i&nbsp;zapytania pomocnicze (Grounding Queries). Dzięki temu wiesz, na jakie pytania AI odpowiada, korzystając z&nbsp;Twoich tekstów.',
      },
    ],
    optimization: [
      {
        title: 'Bing Webmaster Tools + protokół IndexNow',
        desc: 'Rejestrujemy domenę, przesyłamy mapę strony (sitemap XML) i&nbsp;wdrażamy IndexNow. To protokół natychmiastowych powiadomień o&nbsp;zmianach na stronie. Dzięki temu, gdy opublikujesz nowy artykuł lub ofertę, sztuczna inteligencja dowiaduje się o&nbsp;tym w&nbsp;ciągu kilku minut, a&nbsp;nie dni. Konfigurujemy ten system w&nbsp;ramach audytu technicznego.',
      },
      {
        title: 'Zwięzłe bloki odpowiedzi i błyskawiczne ładowanie',
        desc: 'Dostosowujemy teksty do wytycznych Microsoftu, tworząc tzw. answer capsules (zwięzłe odpowiedzi na 40-80 słów) bezpośrednio pod głównymi nagłówkami. Treść musi być gotowa od razu (renderowanie po stronie serwera). Jeśli Twój tekst ładuje się z&nbsp;opóźnieniem przez skrypty JavaScript, sztuczna inteligencja go zignoruje, bo nie ma czasu na czekanie. Czas odpowiedzi serwera (TTFB) powyżej 1 sekundy drastycznie zmniejsza szanse na pobranie strony przez AI.',
      },
      {
        title: 'Dane strukturalne Schema.org (Article, FAQ, HowTo, Product)',
        desc: 'Wyszukiwarka Bing mocno korzysta ze znaczników strukturalnych przy wyborze źródeł do syntezy. Wdrażamy odpowiedni kod (np. FAQPage lub Product). Dzięki temu sztuczna inteligencja od razu "rozumie", że ma do czynienia z&nbsp;ofertą sklepu, instrukcją lub odpowiedzią eksperta, co bezpośrednio zwiększa szansę na cytowanie Twojej domeny.',
      },
      {
        title: 'Bing Places + spójność danych teleadresowych (NAP)',
        desc: 'Wizytówka Bing Places for Business to kluczowe źródło danych o&nbsp;Twojej firmie w&nbsp;ekosystemie Windows. Copilot weryfikuje istnienie marki, krzyżowo sprawdzając dane między Bing Places, wizytówką Google i&nbsp;portalami branżowymi. Jakakolwiek niespójność (stary adres, inna nazwa telefonu – tzw. NAP) obniża zaufanie algorytmu. Dbamy o&nbsp;ujednolicenie tych informacji.',
      },
    ],
    signals: [
      'Pozycja top 20 w&nbsp;Bing Search (warunek wejścia do puli stron pobieranych przez AI)',
      'Czas odpowiedzi serwera (TTFB) poniżej 1 sekundy oraz renderowanie po stronie serwera (SSR)',
      'Wdrożony IndexNow – szybka indeksacja po aktualizacjach',
      'Ustrukturyzowane dane Schema.org (Article, FAQ, HowTo, Product)',
      'Dopuszczenie Bingbota w&nbsp;pliku robots.txt i&nbsp;skonfigurowany panel AI Performance',
      'Bing Places for Business i&nbsp;spójne dane teleadresowe (NAP) we wszystkich katalogach',
    ],
    faq: [
      {
        q: 'Jak pozycjonować markę w&nbsp;Microsoft Copilot?',
        a: 'Opieramy się na trzech filarach: (1) technika – Bing Webmaster Tools, IndexNow, szybkie ładowanie stron, plik robots.txt z&nbsp;dopuszczeniem Bingbota; (2) struktura treści – zwięzłe odpowiedzi pod nagłówkami, precyzyjne dane zamiast ogólników; (3) autorytet marki – Bing Places, spójne dane teleadresowe, wzmianki w&nbsp;zewnętrznych źródłach B2B. Zaczynamy od audytu w&nbsp;panelu AI Performance, który pokazuje bieżące cytowania Twojej domeny.',
      },
      {
        q: 'Czy Bing Copilot ma znaczenie w&nbsp;Polsce?',
        a: 'Udział Copilota w&nbsp;rynku jest mniejszy niż ChatGPT, ale w&nbsp;środowisku biznesowym (Windows + Microsoft 365) to domyślny asystent wielu organizacji. Firmy z&nbsp;branży IT, finansowej, prawnej i&nbsp;produkcyjnej mają ogromną ekspozycję na Copilota. Audyt pokaże realny udział tego asystenta w&nbsp;zapytaniach z&nbsp;Twojej niszy.',
      },
      {
        q: 'Bing SEO vs Google SEO – co jest inne?',
        a: 'Algorytmy Bing mocniej premiują: słowa kluczowe w&nbsp;dokładnym dopasowaniu (w&nbsp;tytułach i&nbsp;nagłówkach), dane strukturalne Schema.org oraz sygnały z&nbsp;mediów społecznościowych (np. LinkedIn w&nbsp;sektorze B2B). Z&nbsp;kolei Google bardziej skupia się na profilu linków i&nbsp;doświadczeniu użytkownika. Co ważne, optymalizacja pod Bing synergicznie wspiera widoczność w&nbsp;wyszukiwarce ChatGPT Search, która korzysta z&nbsp;tego samego indeksu.',
      },
      {
        q: 'Jak mierzycie efekty dla Copilot?',
        a: 'Podstawą jest panel AI Performance w&nbsp;narzędziach Bing – sprawdzamy całkowitą liczbę cytowań oraz konkretne zapytania użytkowników (Grounding Queries). Uzupełniamy to monitoringiem logów serwera i&nbsp;badaniem udziału marki w&nbsp;odpowiedziach AI (Share of Model). Co miesiąc dostarczamy raport z&nbsp;wynikami i&nbsp;planem na kolejne 30 dni.',
      },
    ],
  },
};
