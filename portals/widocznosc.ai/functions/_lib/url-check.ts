/**
 * URL Check – AI SEO Alignment Score 0-100 (8 czynników).
 *
 * Analiza hybrydowa: mierzalne sygnały liczymy deterministycznie z HTML,
 * a LLM ocenia wyłącznie semantyczne elementy, których reguły nie łapią dobrze
 * (BLUF i jakość porównań) oraz dostarcza krótkie uzasadnienia.
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
    label: 'Schema Markup',
    shortLabel: 'Schema',
    weight: 14,
    description:
      'Czy strona ma strukturalne oznaczenia schema.org (JSON-LD, microdata lub RDFa). Schema znacząco zwiększa szansę na cytowanie w AI Overviews.',
    whatToFix:
      'Wdroż schema.org: Article (lub BlogPosting/NewsArticle), FAQPage dla sekcji FAQ, ewentualnie HowTo dla instrukcji. Walidacja w Google Rich Results Test.',
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

function schemaTypeFromUrl(value: string): string | null {
  const decoded = decodeHtmlEntities(value);
  const match = decoded.match(/schema\.org\/([A-Za-z][A-Za-z0-9_-]*)/i);
  return match?.[1] || null;
}

function extractSchemaOrgTypes(html: string, jsonLdTypes: string[]): string[] {
  const types = [...jsonLdTypes];
  const attrRanges: Array<[number, number]> = [];

  const attrRe = /\b(?:itemtype|typeof)=["']([^"']+)["']/gi;
  let attrMatch: RegExpExecArray | null;
  // eslint-disable-next-line no-cond-assign
  while ((attrMatch = attrRe.exec(html)) !== null) {
    attrRanges.push([attrMatch.index, attrMatch.index + attrMatch[0].length]);
    const rawValues = attrMatch[1].split(/\s+/).filter(Boolean);
    for (const rawValue of rawValues) {
      const fromUrl = schemaTypeFromUrl(rawValue);
      if (fromUrl) types.push(fromUrl);
      else if (/^[A-Za-z][A-Za-z0-9_-]*$/.test(rawValue)) types.push(rawValue);
    }
  }

  const urlRe = /schema\.org\/([A-Za-z][A-Za-z0-9_-]*)/gi;
  let urlMatch: RegExpExecArray | null;
  // eslint-disable-next-line no-cond-assign
  while ((urlMatch = urlRe.exec(html)) !== null) {
    const isInsideTypedAttribute = attrRanges.some(
      ([start, end]) => urlMatch!.index >= start && urlMatch!.index < end
    );
    if (isInsideTypedAttribute) continue;
    types.push(urlMatch[1]);
  }

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
  schemaTypes: string[];
  jsonLdDate: string | null;
  metaModifiedTime: string | null;
  metaPublishedTime: string | null;
  ogTitle: string | null;
};

type PreparedContent = {
  cleanedHtml: string;
  mainHtml: string;
  mainText: string;
  headings: string[];
  signals: PreparsedSignals;
};

function prepare(html: string): PreparedContent {
  const blocks = extractJsonLd(html);
  const jsonLdTypes = getJsonLdTypes(blocks);
  const cleaned = cleanHtml(html);
  const mainHtml = extractMainHtml(cleaned);
  const truncated =
    mainHtml.length > MAX_HTML_FOR_LLM
      ? mainHtml.slice(0, MAX_HTML_FOR_LLM) + '\n<!-- HTML truncated by URL-check (>80KB) -->'
      : mainHtml;
  return {
    cleanedHtml: truncated,
    mainHtml,
    mainText: htmlToText(mainHtml),
    headings: extractHeadingTexts(mainHtml),
    signals: {
      jsonLdTypes,
      schemaTypes: extractSchemaOrgTypes(html, jsonLdTypes),
      jsonLdDate: getJsonLdDate(blocks),
      metaModifiedTime:
        findMetaContent(html, 'article:modified_time') || findMetaContent(html, 'og:updated_time'),
      metaPublishedTime: findMetaContent(html, 'article:published_time'),
      ogTitle: findMetaContent(html, 'og:title'),
    },
  };
}

function extractMainHtml(html: string): string {
  const candidates = [
    ...extractTagContents(html, 'article'),
    ...extractTagContents(html, 'main'),
    ...extractTagContents(html, 'body'),
  ];
  return candidates.sort((a, b) => b.length - a.length)[0] || html;
}

function extractTagContents(html: string, tag: string): string[] {
  const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi');
  return Array.from(html.matchAll(re), (match) => match[1]);
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

function htmlToText(html: string): string {
  return decodeHtmlEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  );
}

function extractHeadingTexts(html: string): string[] {
  const re = /<h[2-3]\b[^>]*>([\s\S]*?)<\/h[2-3]>/gi;
  return Array.from(html.matchAll(re), (match) => htmlToText(match[1])).filter(Boolean);
}

function countMatches(value: string, re: RegExp): number {
  return Array.from(value.matchAll(re)).length;
}

function typeSet(types: string[]): Set<string> {
  return new Set(types.map((type) => type.toLowerCase().replace(/[^a-z]/g, '')));
}

function countTypes(types: string[], type: string): number {
  const normalized = type.toLowerCase().replace(/[^a-z]/g, '');
  return types.filter((value) => value.toLowerCase().replace(/[^a-z]/g, '') === normalized).length;
}

function schemaTypeSummary(types: string[]): string {
  const counts = new Map<string, number>();
  for (const type of types) {
    const cleaned = type.trim();
    if (!cleaned) continue;
    counts.set(cleaned, (counts.get(cleaned) || 0) + 1);
  }

  const summary = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'pl'))
    .map(([type, count]) => (count > 1 ? `${type} x${count}` : type));

  return summary.length > 0 ? summary.join(', ') : 'brak';
}

function wordCount(text: string): number {
  return text.split(/\s+/).filter((word) => word.length > 1).length;
}

function parseDate(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function latestDate(values: Array<string | null>): Date | null {
  return (
    values
      .map(parseDate)
      .filter((date): date is Date => Boolean(date))
      .sort((a, b) => b.getTime() - a.getTime())[0] || null
  );
}

function scoreToEarned(def: FactorDefinition, score: 0 | 0.5 | 1): FactorScore {
  return {
    key: def.key,
    label: def.label,
    shortLabel: def.shortLabel,
    weight: def.weight,
    score,
    earned: Math.round(def.weight * score * 10) / 10,
    evidence: '',
  };
}

function deterministicFactors(prepared: PreparedContent): Partial<Record<FactorKey, FactorScore>> {
  const defs = FACTOR_BY_KEY;
  const schemaTypes = typeSet(prepared.signals.schemaTypes);
  const hasArticle = ['article', 'blogposting', 'newsarticle'].some((type) =>
    schemaTypes.has(type)
  );
  const hasFaq = schemaTypes.has('faqpage');
  const hasHowTo = schemaTypes.has('howto');
  const questionSchemaCount = countTypes(prepared.signals.schemaTypes, 'Question');
  const answerSchemaCount = countTypes(prepared.signals.schemaTypes, 'Answer');

  const factors: Partial<Record<FactorKey, FactorScore>> = {};

  const schemaScore: 0 | 0.5 | 1 =
    hasArticle && (hasFaq || hasHowTo) ? 1 : hasArticle || hasFaq || hasHowTo ? 0.5 : 0;
  factors.schema = {
    ...scoreToEarned(defs.schema, schemaScore),
    evidence:
      schemaScore === 1
        ? 'Wykryto schema głównej treści oraz FAQPage lub HowTo.'
        : schemaScore === 0.5
          ? 'Wykryto częściowe dane strukturalne, ale brakuje pełnego zestawu Article + FAQPage/HowTo.'
          : 'Nie wykryto schema.org typu Article, BlogPosting, NewsArticle, FAQPage ani HowTo.',
    details: `Schema.org @type/itemtype: ${schemaTypeSummary(prepared.signals.schemaTypes)}.`,
  };

  const contentDate = latestDate([
    prepared.signals.metaModifiedTime,
    prepared.signals.jsonLdDate,
    prepared.signals.metaPublishedTime,
  ]);
  const ageDays = contentDate
    ? Math.floor((Date.now() - contentDate.getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const freshnessScore: 0 | 0.5 | 1 =
    ageDays === null ? 0 : ageDays <= 93 ? 1 : ageDays <= 365 ? 0.5 : 0;
  factors.freshness = {
    ...scoreToEarned(defs.freshness, freshnessScore),
    evidence:
      ageDays === null
        ? 'Nie wykryto daty publikacji ani aktualizacji w meta tagach lub JSON-LD.'
        : `Najnowsza wykryta data ma ${ageDays} dni.`,
    details: contentDate ? `Data: ${contentDate.toISOString().slice(0, 10)}.` : undefined,
  };

  const listCount = countMatches(prepared.mainHtml, /<(ul|ol)\b/gi);
  const tableCount = countMatches(prepared.mainHtml, /<table\b/gi);
  const modularScore: 0 | 0.5 | 1 =
    listCount >= 5 || tableCount >= 2 ? 1 : listCount >= 1 || tableCount >= 1 ? 0.5 : 0;
  factors.modular = {
    ...scoreToEarned(defs.modular, modularScore),
    evidence:
      modularScore === 1
        ? 'Treść ma dobrze wydzielone elementy modułowe.'
        : modularScore === 0.5
          ? 'Treść ma podstawowe elementy modułowe, ale można ją mocniej podzielić.'
          : 'Nie wykryto list ani tabel w głównej treści.',
    details: `Listy: ${listCount}, tabele: ${tableCount}.`,
  };

  const questionHeadingCount = prepared.headings.filter((heading) =>
    heading.trim().endsWith('?')
  ).length;
  const headingRatio =
    prepared.headings.length > 0 ? questionHeadingCount / prepared.headings.length : 0;
  const headingScore: 0 | 0.5 | 1 = headingRatio >= 0.5 ? 1 : headingRatio >= 0.2 ? 0.5 : 0;
  factors.questionHeadings = {
    ...scoreToEarned(defs.questionHeadings, headingScore),
    evidence:
      prepared.headings.length > 0
        ? `${questionHeadingCount} z ${prepared.headings.length} nagłówków H2/H3 ma formę pytania.`
        : 'Nie wykryto nagłówków H2/H3 w głównej treści.',
    details: `Udział pytań: ${Math.round(headingRatio * 100)}%.`,
  };

  const detailsCount = countMatches(prepared.mainHtml, /<details\b/gi);
  const faqSection = /faq|najczęstsze pytania|często zadawane pytania|pytania i odpowiedzi/i.test(
    prepared.mainText
  );
  const faqQuestionCount = prepared.headings.filter((heading) => heading.endsWith('?')).length;
  const faqScore: 0 | 0.5 | 1 =
    hasFaq &&
    (faqSection ||
      faqQuestionCount >= 3 ||
      detailsCount >= 3 ||
      questionSchemaCount >= 3 ||
      answerSchemaCount >= 3)
      ? 1
      : hasFaq ||
          (faqSection && (faqQuestionCount >= 3 || detailsCount >= 3)) ||
          faqQuestionCount >= 4 ||
          (questionSchemaCount >= 3 && answerSchemaCount >= 3)
        ? 0.5
        : 0;
  factors.faq = {
    ...scoreToEarned(defs.faq, faqScore),
    evidence:
      faqScore === 1
        ? 'Wykryto FAQPage oraz pytania/odpowiedzi w schema lub widocznej treści.'
        : faqScore === 0.5
          ? 'Wykryto częściowe sygnały FAQ, ale bez pełnego zestawu FAQPage + pytania/odpowiedzi.'
          : 'Nie wykryto wyraźnej sekcji FAQ ani schema FAQPage.',
    details: `FAQPage: ${hasFaq ? 'tak' : 'nie'}, Question: ${questionSchemaCount}, Answer: ${answerSchemaCount}, nagłówki-pytania: ${faqQuestionCount}, <details>: ${detailsCount}.`,
  };

  const facts = countMatches(
    prepared.mainText,
    /\b\d{1,4}(?:[.,]\d+)?\s?(?:%|proc\.|zł|pln|eur|usd|tys\.|mln|mld)?\b|\b20\d{2}\b|\b19\d{2}\b/gi
  );
  const words = Math.max(wordCount(prepared.mainText), 1);
  const factsPerThousand = (facts / words) * 1000;
  const densityScore: 0 | 0.5 | 1 = factsPerThousand >= 30 ? 1 : factsPerThousand >= 12 ? 0.5 : 0;
  factors.density = {
    ...scoreToEarned(defs.density, densityScore),
    evidence:
      densityScore === 1
        ? 'Treść ma wysoką gęstość liczb, dat i mierzalnych konkretów.'
        : densityScore === 0.5
          ? 'Treść zawiera część mierzalnych konkretów, ale gęstość faktów jest średnia.'
          : 'Treść ma niską liczbę mierzalnych faktów w relacji do długości.',
    details: `Wykryto ${facts} sygnałów liczbowych przy ${words} słowach (${Math.round(factsPerThousand)} / 1000 słów).`,
  };

  return factors;
}

// =============================================================================
// LLM ANALYZER (Gemini 3.1 Flash via OpenRouter)
// =============================================================================

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
export const ANALYSIS_MODEL = 'google/gemini-3.1-flash-lite';
const LLM_TIMEOUT_MS = 25_000;

const SYSTEM_PROMPT = `Jesteś senior analitykiem GEO (Generative Engine Optimization). Oceniasz strony WWW pod kątem cytowalności w silnikach AI (ChatGPT, Claude, Gemini, Perplexity, Copilot).

Otrzymujesz oczyszczony HTML głównej treści oraz deterministycznie policzone sygnały. Twoja praca to ocenić WYŁĄCZNIE 2 czynniki semantyczne w skali 0 / 0.5 / 1: bluf i comparisons.

ZASADY ZAWSZE:
- Pomijaj nawigację, menu, breadcrumbs, footer, sidebar, banery cookie/RODO. Patrz na GŁÓWNY <main>/<article> content.
- Bądź konkretny w "evidence" – cytuj fragmenty albo podaj liczby (1 zdanie max).
- "details" to techniczne uzasadnienie.
- **WSZYSTKIE pola tekstowe (evidence, details) PO POLSKU.** Zero angielskiego w odpowiedzi, nawet jeśli analizujesz angielską stronę – tłumacz na polski.
- Output WYŁĄCZNIE valid JSON, bez \`\`\`json\`\`\` markers, bez wstępu.

2 CZYNNIKI DO OCENY:

1. **bluf** (BLUF / Bottom Line Up Front, 15 pkt)
   - Czy pierwsze 50 słów GŁÓWNEJ treści (po H1, ignorując nawigację) zawiera bezpośrednią odpowiedź / definicję / kluczową statystykę.
   - 1: pierwsze zdanie odpowiada na pytanie tytułowe lub definiuje temat.
   - 0.5: jest sygnał (liczba, definicja częściowa), ale rozmywa się we wstępie.
   - 0: tekst zaczyna się od narracji / wstępu historycznego ("Kiedyś...", "W dzisiejszych czasach...", "Wyobraź sobie...").

2. **comparisons** (Porównania, 13 pkt)
   - Czy treść porównuje produkty/podejścia/marki ("X vs Y", "alternatywa dla", tabele porównawcze, "różni się od").
   - 1: dedykowana sekcja porównawcza LUB tabela porównawcza LUB 5+ wyraźnych porównań.
   - 0.5: pojedyncze odniesienia porównawcze, ale brak wyraźnej sekcji.
   - 0: brak sygnałów porównawczych.

OUTPUT (valid JSON only):
{
  "bluf": {"score": 0|0.5|1, "evidence": "...", "details": "..."},
  "comparisons": {"score": 0|0.5|1, "evidence": "...", "details": "..."}
}`;

type LlmFactorOutput = {
  score: 0 | 0.5 | 1;
  evidence: string;
  details?: string;
};

type SemanticFactorKey = 'bluf' | 'comparisons';
type LlmResponse = Partial<Record<SemanticFactorKey, LlmFactorOutput>>;

function normalizeScore(value: unknown): 0 | 0.5 | 1 {
  if (value === 1 || value === '1') return 1;
  if (value === 0.5 || value === '0.5') return 0.5;
  return 0;
}

function sanitizeLlmText(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  const cleaned = value.replace(/\s+/g, ' ').trim();
  return cleaned ? cleaned.slice(0, 600) : fallback;
}

function buildUserPrompt(
  url: string,
  signals: PreparsedSignals,
  deterministic: Partial<Record<FactorKey, FactorScore>>,
  cleanedHtml: string
): string {
  const today = new Date().toISOString().slice(0, 10);
  const deterministicSummary = FACTORS.filter(
    (factor) => factor.key !== 'bluf' && factor.key !== 'comparisons'
  )
    .map((factor) => {
      const score = deterministic[factor.key];
      return `- ${factor.key}: ${score?.score ?? 0} (${score?.evidence || 'brak oceny'})`;
    })
    .join('\n');

  return `URL analizowanej strony: ${url}
DZIŚ: ${today}

DETERMINISTYCZNIE POLICZONE SYGNAŁY — NIE OCENIAJ ICH PONOWNIE:
${deterministicSummary}

WSTĘPNIE SPARSOWANE SYGNAŁY:
- JSON-LD @types: ${signals.jsonLdTypes.length > 0 ? signals.jsonLdTypes.join(', ') : '(brak)'}
- schema.org typy łącznie: ${signals.schemaTypes.length > 0 ? signals.schemaTypes.join(', ') : '(brak)'}
- JSON-LD dateModified/datePublished: ${signals.jsonLdDate || '(brak)'}
- meta article:modified_time / og:updated_time: ${signals.metaModifiedTime || '(brak)'}
- meta article:published_time: ${signals.metaPublishedTime || '(brak)'}
- og:title: ${signals.ogTitle || '(brak)'}

GŁÓWNA TREŚĆ HTML (script/style/noscript/komentarze usunięte, max 80KB):
\`\`\`html
${cleanedHtml}
\`\`\`

Zwróć JSON tylko dla "bluf" i "comparisons".`;
}

export async function analyzeContentHybrid(
  html: string,
  url: string,
  apiKey: string
): Promise<FullScore> {
  const prepared = prepare(html);
  const deterministic = deterministicFactors(prepared);
  const userPrompt = buildUserPrompt(url, prepared.signals, deterministic, prepared.cleanedHtml);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort('llm-timeout'), LLM_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://widocznosc.ai',
        'X-Title': 'widocznosc.ai URL Check',
      },
      signal: controller.signal,
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
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Przekroczono limit czasu analizy przez model.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }

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

  // Finalny wynik: 6 czynników z parsera, 2 semantyczne z LLM.
  const factors: FactorScore[] = FACTORS.map((def) => {
    const deterministicScore = deterministic[def.key];
    if (deterministicScore) {
      return deterministicScore;
    }

    const out = parsed[def.key as SemanticFactorKey];
    const score = normalizeScore(out?.score);
    return {
      key: def.key,
      label: def.label,
      shortLabel: def.shortLabel,
      weight: def.weight,
      score,
      earned: Math.round(def.weight * score * 10) / 10,
      evidence: sanitizeLlmText(out?.evidence, '(brak oceny od modelu)'),
      details: out?.details ? sanitizeLlmText(out.details, '') : undefined,
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
        (f.score === 0.5 && f.weight >= 12) || (f.score === 0 && f.weight >= 10 && f.weight < 12)
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

export const __test__ = {
  prepare,
  deterministicFactors,
};
