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
      'OpenAI GPT-4/5 z trybem SearchGPT. Najczęściej używany asystent AI w&nbsp;Polsce. Cytuje z&nbsp;training data oraz przez wyszukiwanie web w&nbsp;czasie rzeczywistym (Bing index + własny crawler).',
    metaDescription:
      'Pozycjonowanie marki w ChatGPT i SearchGPT. Audyt cytowań w GPT-4/5, optymalizacja pod training data i RAG. Mierzymy widoczność marki w odpowiedziach OpenAI.',
    howItWorks: [
      {
        title: 'Training data + cutoff',
        desc: 'GPT-4/5 ma wiedzę do określonej daty (cutoff). Marka musi być w&nbsp;training data – czyli na stronach skanowanych przez Common Crawl, OpenAI WebText i&nbsp;własne crawlery.',
      },
      {
        title: 'SearchGPT (web mode)',
        desc: 'Tryb z&nbsp;dostępem do internetu pyta Bing index w&nbsp;czasie rzeczywistym. Cytowania pojawiają się jako linki w&nbsp;odpowiedzi (1-5 źródeł na zapytanie).',
      },
      {
        title: 'RAG przez Custom GPT',
        desc: 'Tysiące Custom GPT-ów używa Twojej strony jako knowledge base. Niewidoczne, ale realny driver brand awareness w&nbsp;niszach B2B.',
      },
    ],
    optimization: [
      {
        title: 'Schema.org Article + Person',
        desc: 'Każdy artykuł podpisany autorem z&nbsp;authority signals (sameAs, expertise). GPT preferuje cytować strony z&nbsp;jasną atrybucją.',
      },
      {
        title: 'Fact-density w&nbsp;leadach',
        desc: 'Pierwsze 3 paragrafy z&nbsp;konkretnymi liczbami, datami, nazwiskami. GPT cytuje krótkie, faktualne fragmenty – nie poetyckie wstępy.',
      },
      {
        title: 'llms.txt + ai.txt',
        desc: 'Sygnał dla crawlerów AI że strona jest do indeksowania. Akceptujemy GPTBot user-agent w&nbsp;robots.txt.',
      },
      {
        title: 'Definicje pierwsze, opinie potem',
        desc: 'Strony typu "co to jest X" w&nbsp;czystym definicyjnym formacie (jeden paragraf na początku, potem rozwinięcie) zwiększają szanse cytowania w&nbsp;odpowiedziach edukacyjnych.',
      },
    ],
    signals: [
      'Wysoka liczba domen linkujących (klasyczny PageRank nadal liczy)',
      'Jasna atrybucja autora + expertise',
      'Strony cytowane przez Wikipedia, gov.pl, edu',
      'Aktualizacja contentu (publishedAt + updatedAt schema)',
      'GPTBot allow w robots.txt',
    ],
    faq: [
      {
        q: 'Jak pozycjonować się w&nbsp;ChatGPT?',
        a: 'Trzy filary: (1) trafić do training data – publikować na domenach skanowanych przez OpenAI; (2) optymalizować pod SearchGPT – schema, fact-density, świeżość; (3) pojawiać się w&nbsp;Custom GPT knowledge base wybranych nisz.',
      },
      {
        q: 'Jak długo trwa pojawienie się w&nbsp;ChatGPT?',
        a: 'SearchGPT (web mode) – 24-72h od publikacji jeśli strona jest w&nbsp;Bing index. Training data – 6-18 miesięcy do następnego cutoff. Custom GPT – natychmiast po dodaniu do knowledge base.',
      },
      {
        q: 'Czy ChatGPT cytuje konkretne strony?',
        a: 'W&nbsp;trybie SearchGPT tak – każde stwierdzenie ma link do źródła. W&nbsp;trybie standardowym (training data) ChatGPT rzadko podaje URL, ale wymienia nazwy marek i&nbsp;produktów. Mierzymy oba przypadki.',
      },
      {
        q: 'Czy GPTBot crawler szanuje robots.txt?',
        a: 'Tak. OpenAI publicznie ogłosił że GPTBot honoruje dyrektywy disallow. Można zablokować indeksowanie – ale dla GEO chcemy zezwolić.',
      },
    ],
  },

  claude: {
    heroSubtitle:
      'Anthropic Claude 4.5/4.6/4.7 – preferowany model dla decision-makerów B2B i&nbsp;zespołów technicznych. Mniejszy market share niż ChatGPT, ale wyższa wartość per użytkownik. Wbudowany web search od 2025.',
    metaDescription:
      'Pozycjonowanie marki w Claude (Anthropic). Audyt cytowań w Claude 4.5/4.6/4.7, optymalizacja pod web search Anthropic. B2B GEO dla zespołów decision-makerów.',
    howItWorks: [
      {
        title: 'Constitutional AI + safety',
        desc: 'Claude jest zaprojektowany jako "helpful, harmless, honest". Cytuje źródła oszczędnie ale precyzyjnie – preferuje strony eksperckie i&nbsp;recenzowane.',
      },
      {
        title: 'Web search (od 2025)',
        desc: 'Claude może wyszukiwać w&nbsp;internecie real-time. Korzysta z&nbsp;własnego crawlera (ClaudeBot) + agregatorów. Cytuje 1-3 źródła na zapytanie.',
      },
      {
        title: 'Artifacts i&nbsp;Projects',
        desc: 'Użytkownicy budują workflows na Claude Projects z&nbsp;własnymi knowledge base. Twoje materiały mogą tam trafić jako referencja – mierzymy ten signal pośrednio.',
      },
    ],
    optimization: [
      {
        title: 'Long-form content z&nbsp;głębią',
        desc: 'Claude preferuje dłuższe, eksperckie artykuły (3000+ słów) z&nbsp;konkretną metodologią. Krótkie SEO landing-y gorzej się cytują.',
      },
      {
        title: 'Cytaty i&nbsp;źródła w&nbsp;artykule',
        desc: 'Strona która sama cytuje innych ekspertów wyglądie wiarygodnie dla Claude. Linkuj do badań, dokumentacji, oryginalnych źródeł.',
      },
      {
        title: 'Brak hyperboli, konkretne dane',
        desc: 'Claude wycina marketing-speak. "Najlepszy na świecie" → ignoruje. "Wzrost CTR o 23% w&nbsp;Q3 2025" → cytuje.',
      },
      {
        title: 'ClaudeBot allow',
        desc: 'User-agent: ClaudeBot w&nbsp;robots.txt. Anthropic publicznie respektuje dyrektywy.',
      },
    ],
    signals: [
      'Długość i&nbsp;głębia treści (3k+ słów na pillar)',
      'Linki wychodzące do badań i&nbsp;źródeł',
      'Eksperckie autorskie podpisy (PhD, MD, CTO)',
      'Brak click-bait headers',
      'ClaudeBot allow',
    ],
    faq: [
      {
        q: 'Jak pozycjonować się w&nbsp;Claude?',
        a: 'Stawiaj na long-form i&nbsp;głębokie artykuły z&nbsp;konkretną metodologią. Linkuj do oryginalnych badań i&nbsp;dokumentacji. Pozwól ClaudeBot crawlować. Buduj autorytet ekspercki – Claude preferuje strony pisane przez specjalistów, nie marketingowców.',
      },
      {
        q: 'Czy Claude cytuje moją stronę?',
        a: 'W&nbsp;trybie web search – tak, z&nbsp;linkami. W&nbsp;trybie konwersacji – wymienia marki ale rzadko URL. Możemy zmierzyć obie kategorie.',
      },
      {
        q: 'Claude vs ChatGPT – który ważniejszy dla mojego B2B?',
        a: 'Zależy od ICP. Jeśli klienci to inżynierowie, devsi, konsultanci, prawnicy, lekarze – Claude. Jeśli mass-market i&nbsp;młodsi użytkownicy – ChatGPT. Audyt pokaże faktyczne proporcje w&nbsp;Twojej niszy.',
      },
    ],
  },

  gemini: {
    heroSubtitle:
      'Google Gemini z&nbsp;dostępem do indeksu Google Search w&nbsp;czasie rzeczywistym. Wbudowany w&nbsp;AI Overviews, Workspace, Android i&nbsp;Chrome. Cytuje bezpośrednio z&nbsp;rankingu Google.',
    metaDescription:
      'Pozycjonowanie marki w Google Gemini i AI Overviews. Mierzymy cytowania w Gemini Pro, Nano i AI Mode. Optymalizacja pod indeks Google.',
    howItWorks: [
      {
        title: 'Native Google Search integration',
        desc: 'Gemini pyta Google Search index na żywo. Strony rankujące wysoko w&nbsp;klasycznych wynikach mają przewagę – ale to nie SEO 1:1.',
      },
      {
        title: 'AI Overviews w&nbsp;SERP',
        desc: 'AI Overviews to Gemini-driven snippet na górze SERP. Pojawia się dla informational queries. W&nbsp;PL już aktywne dla części fraz core (m.in. nasza nisza).',
      },
      {
        title: 'Search Generative Experience (SGE)',
        desc: 'Następcą AI Overviews jest pełen "AI Mode" w&nbsp;Google. Cytowania wbudowane bezpośrednio w&nbsp;chat-style UI.',
      },
    ],
    optimization: [
      {
        title: 'Klasyczne SEO + GEO twist',
        desc: 'Gemini bierze z&nbsp;Google index. Topical authority, EEAT, Core Web Vitals nadal liczą. Plus: fact-density i&nbsp;jednoznaczne odpowiedzi w&nbsp;leadach.',
      },
      {
        title: 'FAQPage schema',
        desc: 'AI Overviews chętnie wyciągają fragmenty z&nbsp;FAQ. Każdy artykuł z&nbsp;6-12 sensownych pytań w&nbsp;FAQ schema.',
      },
      {
        title: 'Direct Answer w&nbsp;pierwszych 50 słowach',
        desc: 'Gemini bierze pierwsze 50-100 słów jako definitional answer. Kluczowe: jednozdaniowa odpowiedź w&nbsp;pierwszym paragrafie + rozwinięcie poniżej.',
      },
      {
        title: 'Google-Extended allow',
        desc: 'Osobny crawler dla Gemini training. Allow w&nbsp;robots.txt + zarejestrowanie w&nbsp;Search Console.',
      },
    ],
    signals: [
      'Pozycja 1-3 w&nbsp;klasycznym Google',
      'FAQPage schema z&nbsp;pytaniami w&nbsp;PAA',
      'Direct answer w&nbsp;leadach',
      'Google-Extended allow',
      'Topical authority cluster',
    ],
    faq: [
      {
        q: 'Jak pozycjonować się w&nbsp;Gemini?',
        a: 'Najpierw klasyczne SEO – Gemini cytuje z&nbsp;Google index. Potem dodaj fact-density w&nbsp;leadach, FAQ schema i&nbsp;Google-Extended allow. AI Overviews zazwyczaj cytują top 3-5 stron z&nbsp;SERP.',
      },
      {
        q: 'Czy AI Overviews są już w&nbsp;Polsce?',
        a: 'Tak, dla wybranych zapytań informacyjnych. Pełen rollout to kwestia 2-4 kwartałów. Już teraz możemy mierzyć obecność dla branżowych fraz core.',
      },
      {
        q: 'Czy zablokować Google-Extended?',
        a: 'Większość sytuacji – nie. Blokujesz wtedy Gemini training i&nbsp;tracisz visibility w&nbsp;AI Overviews. Wyjątek: jeśli content jest za paywallem premium i&nbsp;nie chcesz żeby Gemini pokazywał odpowiedzi za free.',
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
      'Microsoft Copilot (dawniej Bing Chat) wbudowany w&nbsp;Edge, Windows 11 i&nbsp;Microsoft 365. Mniejszy market share niż ChatGPT, ale unikalna ekspozycja na użytkowników enterprise i&nbsp;default browser users.',
    metaDescription:
      'Pozycjonowanie marki w Microsoft Bing Copilot. Audyt cytowań w Copilot dla Edge, Windows i M365. GEO dla użytkowników enterprise i Microsoft ecosystem.',
    howItWorks: [
      {
        title: 'Bing index foundation',
        desc: 'Copilot pyta Bing search index w&nbsp;czasie rzeczywistym. Pozycja w&nbsp;Bing search ranking ma duże znaczenie.',
      },
      {
        title: 'Azure OpenAI backbone',
        desc: 'Pod spodem GPT-4/5 z&nbsp;Microsoft Azure. Mechanika cytowania podobna do SearchGPT – 3-5 źródeł na odpowiedź.',
      },
      {
        title: 'Native w&nbsp;Edge i&nbsp;Windows',
        desc: 'Default browser dla użytkowników Windows ma Copilot dostępny one-click. Niska bariera = wyższe usage w&nbsp;workplace.',
      },
    ],
    optimization: [
      {
        title: 'Bing Webmaster Tools',
        desc: 'Zarejestrować domenę, sprawdzić indexation, submit sitemap. Bing index jest mniejszy niż Google – każda strona musi być wyraźnie zgłoszona.',
      },
      {
        title: 'IndexNow protocol',
        desc: 'Push-style notifications o zmianach contentu. Bing+Yandex+inne wspierają. Szybsza re-indeksacja dla świeżych artykułów.',
      },
      {
        title: 'Schema.org rich results',
        desc: 'Bing nadal mocno używa structured data dla snippets. FAQPage, HowTo, Article zwiększają cytowalność.',
      },
      {
        title: 'BingBot allow + crawl rate',
        desc: 'BingBot user-agent allow. W&nbsp;Bing Webmaster można ustawić crawl rate dla dużych site\'ów.',
      },
    ],
    signals: [
      'Bing search ranking top 5',
      'IndexNow integration',
      'Schema.org rich results',
      'BingBot allow + crawl rate',
      'Microsoft 365 ecosystem (Teams/SharePoint mentions)',
    ],
    faq: [
      {
        q: 'Jak pozycjonować się w&nbsp;Bing Copilot?',
        a: 'Zacznij od Bing Webmaster Tools – submit sitemap, zweryfikuj domenę. Wdrożyć IndexNow dla szybkiej re-indeksacji. Schema rich results (FAQ, HowTo, Article). BingBot allow.',
      },
      {
        q: 'Czy Bing Copilot ma znaczenie w&nbsp;Polsce?',
        a: 'Mniejszy market share od ChatGPT, ale: enterprise (Windows + M365) ma silną reprezentację. W&nbsp;niszach B2B/IT widoczność w&nbsp;Copilot przekłada się na decision-maker eyeballs.',
      },
      {
        q: 'Bing SEO vs Google SEO – różne?',
        a: 'W&nbsp;dużej mierze pokrywają się. Bing mocniej waży: structured data, exact match keywords w&nbsp;tytułach, social signals (LinkedIn). Google bardziej: backlinks profile, EEAT, Core Web Vitals.',
      },
    ],
  },
};
