/**
 * URL Check – AI SEO Alignment Score 0-100 (8 czynników).
 *
 * Analiza wykonywana przez Gemini 3.1 Flash przez OpenRouter (LLM rozumie
 * jaki fragment HTML to GŁÓWNA treść – nie myli nawigacji z lead'em, łapie
 * FAQ bez schemy, ocenia gęstość konkretnych faktów w sensowny sposób).
 *
 * Pochodzenie metodologii: webinary-materialy.md (Robert Niechciał) + research
 * Princeton/KDD 2024 (Aggarwal et al.) + iPullRank AI Search Manual.
 *
 * Każdy z 8 czynników oceniamy w skali 0/0.5/1 i mnożymy przez wagę.
 * Suma wag = 100. Output: total score 0-100 + breakdown per kategoria
 * + 5 priorytetowych zmian (P0/P1/P2).
 */

export type FactorKey =
  | 'bluf'
  | 'faq'
  | 'density'
  | 'schema'
  | 'freshness'
  | 'modular'
  | 'comparisons'
  | 'questionHeadings';

export type FactorDefinition = {
  key: FactorKey;
  label: string;
  shortLabel: string;
  weight: number;
  description: string;
  whatToFix: string;
};

/** Suma wag = 100 */
export const FACTORS: FactorDefinition[] = [
  {
    key: 'bluf',
    label: 'BLUF (Bottom Line Up Front)',
    shortLabel: 'BLUF',
    weight: 15,
    description:
      'Czy bezpośrednia odpowiedź na temat strony znajduje się w pierwszych 50 słowach. AI cytują głównie frontload – dłuższe wstępy zostają pominięte.',
    whatToFix:
      'Przepisz pierwszy akapit – zacznij od konkretnej definicji lub odpowiedzi. Tło historyczne i wstępy przerzuć dalej w treść.',
  },
  {
    key: 'faq',
    label: 'Sekcja FAQ',
    shortLabel: 'FAQ',
    weight: 12,
    description:
      'Czy strona ma sekcję pytań i odpowiedzi (FAQ). LLM-y chętnie cytują pojedyncze pary Q&A jako odpowiedzi na podzapytania użytkowników.',
    whatToFix:
      'Dodaj sekcję FAQ z 5-8 pytaniami w formie pełnych zdań ("Czym jest…?", "Ile kosztuje…?"). Każde Q powinno mieć 2-3 zdania odpowiedzi.',
  },
  {
    key: 'density',
    label: 'Information Density',
    shortLabel: 'Gęstość faktów',
    weight: 14,
    description:
      'Czy w tekście są konkretne liczby, daty, statystyki i dane źródłowe. Tekst ogólnikowy bez liczb nie buduje wiarygodności w AI.',
    whatToFix:
      'Dodaj konkretne liczby, procenty, daty i odwołania do badań. Zastąp ogólniki ("często", "wiele firm") konkretami ("57% firm w 2024 roku").',
  },
  {
    key: 'schema',
    label: 'Schema Markup (JSON-LD)',
    shortLabel: 'Schema',
    weight: 14,
    description:
      'Czy strona ma strukturalne oznaczenia JSON-LD (Article, FAQPage, HowTo). Schema znacząco zwiększa szansę na cytowanie w AI Overviews.',
    whatToFix:
      'Wdroż JSON-LD: Article (lub BlogPosting/NewsArticle), FAQPage dla sekcji FAQ, ewentualnie HowTo dla instrukcji. Walidacja w Google Rich Results Test.',
  },
  {
    key: 'freshness',
    label: 'Świeżość treści',
    shortLabel: 'Świeżość',
    weight: 10,
    description:
      'Kiedy treść była ostatnio aktualizowana. Perplexity i AI Overviews silnie preferują content z ostatnich 12 miesięcy.',
    whatToFix:
      'Dodaj widoczną datę publikacji i aktualizacji w meta tagach (article:modified_time) oraz w schema (dateModified). Przejrzyj content i zaktualizuj.',
  },
  {
    key: 'modular',
    label: 'Treści modułowe',
    shortLabel: 'Modułowość',
    weight: 10,
    description:
      'Czy treść ma listy, tabele i wyraźnie wydzielone sekcje. AI łatwiej "wycina" gotowy fragment jako odpowiedź gdy treść jest podzielona.',
    whatToFix:
      'Przekształć ściankę tekstu w listy punktowane, tabele porównawcze i krótkie sekcje pod jasnymi nagłówkami. Każda sekcja samodzielna jako odpowiedź.',
  },
  {
    key: 'comparisons',
    label: 'Porównania',
    shortLabel: 'Porównania',
    weight: 13,
    description:
      'Czy są porównania z konkurencją lub alternatywami ("X vs Y", tabele porównawcze). Pytania porównawcze to jedne z najczęstszych zapytań do LLM.',
    whatToFix:
      'Dodaj sekcję porównawczą lub tabelę "X vs Y" / "alternatywa dla Z". Wprost porównaj cechy, ceny, zastosowania. Nie unikaj nazwy konkurenta.',
  },
  {
    key: 'questionHeadings',
    label: 'Nagłówki jako pytania',
    shortLabel: 'Pytania w H2/H3',
    weight: 12,
    description:
      'Jaki procent nagłówków H2/H3 jest sformułowany jako pytanie. AI dopasowują nagłówki-pytania bezpośrednio do podzapytań użytkownika (query fan-out).',
    whatToFix:
      'Przepisz przynajmniej 50% H2/H3 na formę pytań ("Jak…?", "Czym różni się…?"). Każde pytanie powinno mieć krótką odpowiedź w pierwszym zdaniu sekcji.',
  },
];

export const FACTOR_BY_KEY: Record<FactorKey, FactorDefinition> = Object.fromEntries(
  FACTORS.map((f) => [f.key, f])
) as Record<FactorKey, FactorDefinition>;

export type FactorScore = {
  key: FactorKey;
  label: string;
  shortLabel: string;
  weight: number;
  /** 0 = brak / 0.5 = częściowy / 1 = ok */
  score: 0 | 0.5 | 1;
  /** Punkty po przemnożeniu (0..weight) */
  earned: number;
  /** Krótkie wyjaśnienie wyniku (1 zdanie, na podstawie analizy LLM) */
  evidence: string;
  /** Detal techniczny (cytat z treści lub konkretna liczba) */
  details?: string;
};

export type FullScore = {
  total: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  factors: FactorScore[];
  /** Model użyty do analizy (debugging/transparency) */
  model: string;
};

export type ActionItem = {
  priority: 'P0' | 'P1' | 'P2';
  factor: FactorKey;
  title: string;
  description: string;
};

// =============================================================================
// PRE-PROCESSING – HTML cleanup + JSON-LD/meta extraction (deterministic)
// =============================================================================

const MAX_HTML_FOR_LLM = 80_000;

/** Strippuje script/style/noscript – żeby LLM nie marnował tokenów na binary noise */
function cleanHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Wyciąga JSON-LD blocks (zachowujemy bo są tanie do parsowania regexem) */
function extractJsonLd(html: string): unknown[] {
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  const blocks: unknown[] = [];
  let m: RegExpExecArray | null;
  // eslint-disable-next-line no-cond-assign
  while ((m = re.exec(html)) !== null) {
    try {
      blocks.push(JSON.parse(m[1].trim()));
    } catch {
      /* malformed */
    }
  }
  return blocks;
}

function getJsonLdTypes(blocks: unknown[]): string[] {
  const types: string[] = [];
  const visit = (node: unknown): void => {
    if (!node || typeof node !== 'object') return;
    const obj = node as Record<string, unknown>;
    if (typeof obj['@type'] === 'string') types.push(obj['@type']);
    if (Array.isArray(obj['@type']))
      for (const t of obj['@type']) if (typeof t === 'string') types.push(t);
    if (Array.isArray(obj['@graph'])) for (const n of obj['@graph']) visit(n);
    for (const v of Object.values(obj)) {
      if (Array.isArray(v)) for (const n of v) visit(n);
      else if (typeof v === 'object') visit(v);
    }
  };
  for (const b of blocks) visit(b);
  return types;
}

function getJsonLdDate(blocks: unknown[]): string | null {
  let modified: string | null = null;
  let published: string | null = null;
  const visit = (node: unknown): void => {
    if (!node || typeof node !== 'object') return;
    const obj = node as Record<string, unknown>;
    if (typeof obj.dateModified === 'string' && !modified) modified = obj.dateModified;
    if (typeof obj.datePublished === 'string' && !published) published = obj.datePublished;
    if (Array.isArray(obj['@graph'])) for (const n of obj['@graph']) visit(n);
    for (const v of Object.values(obj)) {
      if (Array.isArray(v)) for (const n of v) visit(n);
      else if (typeof v === 'object') visit(v);
    }
  };
  for (const b of blocks) visit(b);
  return modified || published;
}

function findMetaContent(html: string, prop: string): string | null {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${prop}["'][^>]*content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${prop}["']`, 'i'),
    new RegExp(`<meta[^>]+name=["']${prop}["'][^>]*content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${prop}["']`, 'i'),
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m) return m[1];
  }
  return null;
}

type PreparsedSignals = {
  jsonLdTypes: string[];
  jsonLdDate: string | null;
  metaModifiedTime: string | null;
  metaPublishedTime: string | null;
  ogTitle: string | null;
};

function prepare(html: string): { cleanedHtml: string; signals: PreparsedSignals } {
  const blocks = extractJsonLd(html);
  const cleaned = cleanHtml(html);
  const truncated =
    cleaned.length > MAX_HTML_FOR_LLM
      ? cleaned.slice(0, MAX_HTML_FOR_LLM) + '\n<!-- HTML truncated by URL-check (>80KB) -->'
      : cleaned;
  return {
    cleanedHtml: truncated,
    signals: {
      jsonLdTypes: getJsonLdTypes(blocks),
      jsonLdDate: getJsonLdDate(blocks),
      metaModifiedTime:
        findMetaContent(html, 'article:modified_time') ||
        findMetaContent(html, 'og:updated_time'),
      metaPublishedTime: findMetaContent(html, 'article:published_time'),
      ogTitle: findMetaContent(html, 'og:title'),
    },
  };
}

// =============================================================================
// LLM ANALYZER (Gemini 3.1 Flash via OpenRouter)
// =============================================================================

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
export const ANALYSIS_MODEL = 'google/gemini-3.1-flash-lite';

const SYSTEM_PROMPT = `Jesteś senior analitykiem GEO (Generative Engine Optimization). Oceniasz strony WWW pod kątem cytowalności w silnikach AI (ChatGPT, Claude, Gemini, Perplexity, Copilot).

Otrzymujesz HTML strony oraz wstępnie sparsowane sygnały (JSON-LD, daty meta). Twoja praca to ZIDENTYFIKOWAĆ GŁÓWNĄ TREŚĆ artykułu/strony (pomijając nawigację, footer, sidebar, breadcrumbs, menu) i ocenić 8 czynników cytowalności w skali 0 / 0.5 / 1.

ZASADY ZAWSZE:
- Pomijaj nawigację, menu, breadcrumbs, footer, sidebar, banery cookie/RODO. Patrz na GŁÓWNY <main>/<article> content.
- Bądź konkretny w "evidence" – cytuj fragmenty albo podaj liczby (1 zdanie max).
- "details" to techniczne uzasadnienie (np. "Schema FAQPage obecny, 6 par Q&A").
- **WSZYSTKIE pola tekstowe (evidence, details) PO POLSKU.** Zero angielskiego w odpowiedzi, nawet jeśli analizujesz angielską stronę – tłumacz na polski.
- Output WYŁĄCZNIE valid JSON, bez \`\`\`json\`\`\` markers, bez wstępu.

8 CZYNNIKÓW DO OCENY:

1. **bluf** (BLUF / Bottom Line Up Front, 15 pkt)
   - Czy pierwsze 50 słów GŁÓWNEJ treści (po H1, ignorując nawigację) zawiera bezpośrednią odpowiedź / definicję / kluczową statystykę.
   - 1: pierwsze zdanie odpowiada na pytanie tytułowe lub definiuje temat.
   - 0.5: jest sygnał (liczba, definicja częściowa), ale rozmywa się we wstępie.
   - 0: tekst zaczyna się od narracji / wstępu historycznego ("Kiedyś...", "W dzisiejszych czasach...", "Wyobraź sobie...").

2. **faq** (Sekcja FAQ, 12 pkt)
   - Czy jest dedykowana sekcja Q&A (FAQPage schema LUB <details>/accordion LUB jasno wydzielony "FAQ" / "Najczęstsze pytania" / "Często zadawane pytania" z 3+ pytaniami).
   - 1: schema FAQPage + sekcja Q&A widoczna w treści.
   - 0.5: jest sekcja Q&A ale brak schema, ALBO są pytania w nagłówkach ale bez wyraźnej sekcji FAQ.
   - 0: brak Q&A pairs i brak schema FAQPage.

3. **density** (Information Density, 14 pkt)
   - Gęstość konkretnych liczb / dat / statystyk / odwołań do badań w głównej treści.
   - 1: 30+ konkretnych faktów na ~1000 słów (liczby, %, daty, badania).
   - 0.5: 12-30/1000 słów. Średnio.
   - 0: tekst ogólnikowy ("często", "wiele firm", "wszyscy") bez konkretów.

4. **schema** (Schema Markup JSON-LD, 14 pkt)
   - Patrzysz na sparsowane jsonLdTypes (już dostarczone). Punktacja:
     - 1: wykryte Article/BlogPosting/NewsArticle + FAQPage (lub HowTo), opcjonalnie BreadcrumbList/Organization.
     - 0.5: tylko Article LUB tylko FAQPage (bez Article).
     - 0: brak Article/BlogPosting/FAQPage/HowTo (lub żadnego JSON-LD).

5. **freshness** (Świeżość, 10 pkt)
   - Patrzysz na podane jsonLdDate / metaModifiedTime / metaPublishedTime + treść (data publikacji/aktualizacji widoczna w treści).
   - 1: <3 mies. od dziś (DZIŚ podane w prompcie).
   - 0.5: 3-12 mies.
   - 0: >12 mies. lub brak daty.

6. **modular** (Treści modułowe, 10 pkt)
   - Czy treść ma listy (<ul>/<ol>), tabele (<table>) i wyraźne sekcje. Sprawdzaj w GŁÓWNEJ treści, nie w nawigacji.
   - 1: 5+ list i/lub 2+ tabele w treści głównej.
   - 0.5: 1-4 listy LUB 1 tabela.
   - 0: ścianka tekstu bez wydzielonych elementów.

7. **comparisons** (Porównania, 13 pkt)
   - Czy treść porównuje produkty/podejścia/marki ("X vs Y", "alternatywa dla", tabele porównawcze, "różni się od").
   - 1: dedykowana sekcja porównawcza LUB tabela porównawcza LUB 5+ wyraźnych porównań.
   - 0.5: pojedyncze odniesienia porównawcze, ale brak wyraźnej sekcji.
   - 0: brak sygnałów porównawczych.

8. **questionHeadings** (Nagłówki jako pytania, 12 pkt)
   - Procent H2/H3 sformułowanych jako pytanie (kończą się "?"). Liczysz tylko nagłówki w głównej treści.
   - 1: 50%+ nagłówków to pytania.
   - 0.5: 20-50%.
   - 0: <20% lub brak H2/H3 w głównej treści.

OUTPUT (valid JSON only):
{
  "bluf": {"score": 0|0.5|1, "evidence": "...", "details": "..."},
  "faq": {"score": ..., "evidence": "...", "details": "..."},
  "density": {...},
  "schema": {...},
  "freshness": {...},
  "modular": {...},
  "comparisons": {...},
  "questionHeadings": {...}
}`;

type LlmFactorOutput = {
  score: 0 | 0.5 | 1;
  evidence: string;
  details?: string;
};

type LlmResponse = Record<FactorKey, LlmFactorOutput>;

function buildUserPrompt(url: string, signals: PreparsedSignals, cleanedHtml: string): string {
  const today = new Date().toISOString().slice(0, 10);
  return `URL analizowanej strony: ${url}
DZIŚ: ${today}

WSTĘPNIE SPARSOWANE SYGNAŁY (deterministycznie z HTML):
- JSON-LD @types: ${signals.jsonLdTypes.length > 0 ? signals.jsonLdTypes.join(', ') : '(brak)'}
- JSON-LD dateModified/datePublished: ${signals.jsonLdDate || '(brak)'}
- meta article:modified_time / og:updated_time: ${signals.metaModifiedTime || '(brak)'}
- meta article:published_time: ${signals.metaPublishedTime || '(brak)'}
- og:title: ${signals.ogTitle || '(brak)'}

CZYSTY HTML (script/style/noscript/komentarze usunięte, max 80KB):
\`\`\`html
${cleanedHtml}
\`\`\`

Zwróć JSON z oceną 8 czynników. Tylko valid JSON.`;
}

export async function analyzeContentWithLLM(
  html: string,
  url: string,
  apiKey: string
): Promise<FullScore> {
  const { cleanedHtml, signals } = prepare(html);
  const userPrompt = buildUserPrompt(url, signals, cleanedHtml);

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://widocznosc.ai',
      'X-Title': 'widocznosc.ai URL Check',
    },
    body: JSON.stringify({
      model: ANALYSIS_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`OpenRouter HTTP ${response.status}: ${text.slice(0, 200)}`);
  }

  const body = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };

  const content = body.choices?.[0]?.message?.content?.trim() || '';
  if (!content) throw new Error('Pusty response z OpenRouter');

  let cleaned = content;
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/\s*```\s*$/, '');
  }

  let parsed: LlmResponse;
  try {
    parsed = JSON.parse(cleaned) as LlmResponse;
  } catch (e) {
    throw new Error(`LLM zwrócił niepoprawny JSON: ${cleaned.slice(0, 200)}`);
  }

  // Map LLM output → FactorScore[] (zachowujemy kompatybilność z UI)
  const factors: FactorScore[] = FACTORS.map((def) => {
    const out = parsed[def.key];
    const score: 0 | 0.5 | 1 =
      out?.score === 1 ? 1 : out?.score === 0.5 ? 0.5 : 0;
    return {
      key: def.key,
      label: def.label,
      shortLabel: def.shortLabel,
      weight: def.weight,
      score,
      earned: Math.round(def.weight * score * 10) / 10,
      evidence: out?.evidence || '(brak oceny od modelu)',
      details: out?.details,
    };
  });

  const total = Math.round(factors.reduce((acc, f) => acc + f.earned, 0));
  let grade: FullScore['grade'];
  if (total >= 85) grade = 'A';
  else if (total >= 70) grade = 'B';
  else if (total >= 55) grade = 'C';
  else if (total >= 40) grade = 'D';
  else grade = 'F';

  return { total, grade, factors, model: ANALYSIS_MODEL };
}

// =============================================================================
// ACTION ITEMS (deterministic on top of LLM scores)
// =============================================================================

export function buildActionItems(factors: FactorScore[]): ActionItem[] {
  const items: ActionItem[] = [];

  const p0 = factors
    .filter((f) => f.score === 0 && f.weight >= 12)
    .sort((a, b) => b.weight - a.weight);
  for (const f of p0.slice(0, 3)) {
    items.push({
      priority: 'P0',
      factor: f.key,
      title: `${f.label}: brak`,
      description: FACTOR_BY_KEY[f.key].whatToFix,
    });
  }

  const p1 = factors
    .filter(
      (f) =>
        (f.score === 0.5 && f.weight >= 12) ||
        (f.score === 0 && f.weight >= 10 && f.weight < 12)
    )
    .sort((a, b) => b.weight - a.weight);
  for (const f of p1.slice(0, 3)) {
    items.push({
      priority: 'P1',
      factor: f.key,
      title: `${f.label}: do dopracowania`,
      description: FACTOR_BY_KEY[f.key].whatToFix,
    });
  }

  const p2 = factors
    .filter((f) => f.score === 0.5 && f.weight < 12)
    .sort((a, b) => b.weight - a.weight);
  for (const f of p2.slice(0, 2)) {
    items.push({
      priority: 'P2',
      factor: f.key,
      title: `${f.label}: drobne ulepszenie`,
      description: FACTOR_BY_KEY[f.key].whatToFix,
    });
  }

  if (items.length === 0) {
    items.push({
      priority: 'P2',
      factor: 'schema',
      title: 'Wszystkie 8 czynników w porządku',
      description:
        'Strona spełnia priorytetowe sygnały AI SEO Alignment. Następny krok: monitoring cytowalności w 5 silnikach AI (full report) + analiza konkurencji.',
    });
  }

  return items.slice(0, 5);
}
