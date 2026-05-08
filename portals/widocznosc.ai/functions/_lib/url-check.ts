/**
 * URL Check – AI SEO Alignment Score 0-100 (8 czynników).
 *
 * Pochodzenie metodologii: webinary-materialy.md (Robert Niechciał) + research
 * Princeton/KDD 2024 (Aggarwal et al.) + iPullRank AI Search Manual.
 *
 * Każdy z 8 czynników oceniamy w skali 0/0.5/1 i mnożymy przez wagę.
 * Suma wag = 100. Output: total score 0-100 + breakdown per kategoria
 * + 5 priorytetowych zmian (P0/P1/P2).
 *
 * Format pasuje 1:1 do api/tools/url-check.ts + pages/narzedzia/url-check.astro.
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
  /** Co user dostaje gdy nie ma tego elementu */
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
  /** Krótkie wyjaśnienie wyniku */
  evidence: string;
  /** Detal techniczny – widoczny w "rozwinięciu" karty */
  details?: string;
};

export type FullScore = {
  total: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  factors: FactorScore[];
};

export type ActionItem = {
  priority: 'P0' | 'P1' | 'P2';
  factor: FactorKey;
  title: string;
  description: string;
};

// =============================================================================
// HELPERS – HTML parsing (regex-based, bez DOMParser w CF Workers)
// =============================================================================

/** Wyciąga visible text z HTML – bez script/style/nav/footer */
export function extractText(html: string): string {
  let cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<aside[\s\S]*?<\/aside>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ');

  cleaned = cleaned.replace(/<[^>]+>/g, ' ');

  // HTML entities – najczęstsze
  cleaned = cleaned
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—');

  return cleaned.replace(/\s+/g, ' ').trim();
}

export function extractMatches(html: string, regex: RegExp): string[] {
  const matches: string[] = [];
  let m: RegExpExecArray | null;
  // eslint-disable-next-line no-cond-assign
  while ((m = regex.exec(html)) !== null) {
    matches.push(m[1] || m[0]);
  }
  return matches;
}

export function extractH1(html: string): string {
  const m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  return m ? extractText(m[1]) : '';
}

export function extractHeadings(html: string, levels: number[]): string[] {
  const out: string[] = [];
  for (const lvl of levels) {
    const re = new RegExp(`<h${lvl}[^>]*>([\\s\\S]*?)<\\/h${lvl}>`, 'gi');
    const all = extractMatches(html, re);
    for (const item of all) {
      const text = extractText(item);
      if (text) out.push(text);
    }
  }
  return out;
}

export function countTags(html: string, tag: string): number {
  const re = new RegExp(`<${tag}\\b`, 'gi');
  const matches = html.match(re);
  return matches ? matches.length : 0;
}

export function extractJsonLd(html: string): unknown[] {
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  const blocks: unknown[] = [];
  let m: RegExpExecArray | null;
  // eslint-disable-next-line no-cond-assign
  while ((m = re.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(m[1].trim());
      blocks.push(parsed);
    } catch {
      // ignore malformed JSON-LD
    }
  }
  return blocks;
}

/** Płaska lista wszystkich @type z całego JSON-LD (włącznie z @graph) */
export function getJsonLdTypes(blocks: unknown[]): string[] {
  const types: string[] = [];
  const visit = (node: unknown) => {
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

export function findMetaContent(html: string, property: string): string | null {
  // og:property, name=, property= – wszystkie warianty
  const patterns = [
    new RegExp(
      `<meta[^>]+property=["']${property}["'][^>]*content=["']([^"']+)["']`,
      'i'
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`,
      'i'
    ),
    new RegExp(
      `<meta[^>]+name=["']${property}["'][^>]*content=["']([^"']+)["']`,
      'i'
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${property}["']`,
      'i'
    ),
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m) return m[1];
  }
  return null;
}

// =============================================================================
// 8 DETECTORS
// =============================================================================

/** Pierwsze N słów z głównego contentu (po H1) */
function firstNWords(text: string, n: number): string {
  return text.split(/\s+/).slice(0, n).join(' ');
}

function detectBluf(html: string, text: string): { score: 0 | 0.5 | 1; evidence: string; details: string } {
  // Tnijemy tekst po pierwszym H1 (jeśli jest) – żeby brać główny content, nie nawigację
  const h1Match = html.match(/<h1[^>]*>[\s\S]*?<\/h1>/i);
  let body = text;
  if (h1Match) {
    const idx = text.indexOf(extractText(h1Match[0]));
    if (idx >= 0) body = text.slice(idx + extractText(h1Match[0]).length);
  }
  body = body.trim();

  const first50 = firstNWords(body, 50);
  const wordsCount = first50.split(/\s+/).filter(Boolean).length;

  if (wordsCount < 10) {
    return {
      score: 0,
      evidence: 'Brak treści po H1 lub strona pusta.',
      details: 'Nie udało się wyodrębnić pierwszych 50 słów po nagłówku H1.',
    };
  }

  // Wskaźniki dobrego BLUF: definicja, liczba, bezpośrednia odpowiedź
  const lower = first50.toLowerCase();
  const isDefinition = /\b(to|jest|oznacza|polega na|nazywamy)\b/.test(lower);
  const hasNumber = /\d/.test(first50);
  const hasDirectAnswer = /^(tak|nie|tak,|nie,)\b/i.test(first50.trim());
  const startsWithStory =
    /\b(kiedyś|w latach|jeszcze niedawno|przed laty|od zarania|na początku xxi|gdy patrzymy)\b/i.test(
      lower.slice(0, 80)
    );

  if (startsWithStory) {
    return {
      score: 0,
      evidence: 'Tekst zaczyna się od narracji/wstępu zamiast bezpośredniej odpowiedzi.',
      details: `Pierwsze słowa: "${first50.slice(0, 120)}…"`,
    };
  }

  const positives = [isDefinition, hasNumber, hasDirectAnswer].filter(Boolean).length;

  if (positives >= 2) {
    return {
      score: 1,
      evidence: 'Pierwsze 50 słów zawiera bezpośrednią odpowiedź / definicję.',
      details: `"${first50.slice(0, 140)}…"`,
    };
  }
  if (positives === 1) {
    return {
      score: 0.5,
      evidence: 'Pierwsze 50 słów ma częściowo cechy BLUF, ale brakuje konkretu.',
      details: `"${first50.slice(0, 140)}…"`,
    };
  }
  return {
    score: 0,
    evidence: 'Pierwsze 50 słów to wstęp ogólny – brak definicji ani konkretnej odpowiedzi.',
    details: `"${first50.slice(0, 140)}…"`,
  };
}

function detectFaq(html: string, jsonLdTypes: string[]): { score: 0 | 0.5 | 1; evidence: string; details: string } {
  const hasFaqSchema = jsonLdTypes.some((t) => /FAQPage/i.test(t));
  const detailsCount = countTags(html, 'details');

  // Heurystyki: nagłówek "FAQ" / "Najczęstsze pytania" / "Często zadawane"
  const headings = extractHeadings(html, [2, 3]);
  const faqHeadings = headings.filter((h) =>
    /(faq|najczęstsze pytania|często zadawane|pytania i odpowiedzi)/i.test(h)
  );

  // Pytania w nagłówkach jako proxy dla Q&A struktury
  const questionHeadings = headings.filter((h) => /\?$/.test(h.trim()));

  if (hasFaqSchema) {
    return {
      score: 1,
      evidence: 'Strona ma schema FAQPage + sekcję pytań.',
      details: `JSON-LD FAQPage wykryty. ${detailsCount > 0 ? `${detailsCount} elementów <details>. ` : ''}${questionHeadings.length} nagłówków-pytań.`,
    };
  }

  if (faqHeadings.length > 0 && (detailsCount >= 3 || questionHeadings.length >= 3)) {
    return {
      score: 0.5,
      evidence: 'Sekcja FAQ jest, ale brakuje schema FAQPage (JSON-LD).',
      details: `Wykryto sekcję "${faqHeadings[0]}" + ${detailsCount} <details> / ${questionHeadings.length} pytań.`,
    };
  }

  if (questionHeadings.length >= 5) {
    return {
      score: 0.5,
      evidence: 'Sporo pytań w nagłówkach, ale brak wyraźnej sekcji FAQ.',
      details: `${questionHeadings.length} nagłówków-pytań rozsianych po treści. Bez wyraźnego FAQ + bez schema.`,
    };
  }

  return {
    score: 0,
    evidence: 'Brak sekcji FAQ ani schema FAQPage.',
    details: `${questionHeadings.length} nagłówków zakończonych "?", ${detailsCount} <details>.`,
  };
}

function detectDensity(text: string): { score: 0 | 0.5 | 1; evidence: string; details: string } {
  const words = text.split(/\s+/).filter(Boolean).length;
  if (words < 200) {
    return {
      score: 0,
      evidence: 'Strona ma za mało treści, żeby zmierzyć gęstość faktów.',
      details: `Tylko ${words} słów po stripowaniu HTML.`,
    };
  }

  // Liczby z opcjonalną jednostką: 12, 1.5, 250 mln, 30%, 4×, 800k, 2024
  const numbers = (text.match(/\b\d+([.,]\d+)?(\s?(%|×|x|mln|tys|k|mld|zł|usd|eur|godz|dni|tyg))?\b/gi) || []).length;
  // Daty roczne 2018-2030
  const years = (text.match(/\b(20[12][0-9])\b/g) || []).length;
  // Daty miesięczne PL
  const monthDates = (text.match(/\b\d{1,2}\s+(stycznia|lutego|marca|kwietnia|maja|czerwca|lipca|sierpnia|września|października|listopada|grudnia)\b/gi) || []).length;

  const totalFacts = numbers + years + monthDates;
  const per1000 = (totalFacts / words) * 1000;

  if (per1000 >= 30) {
    return {
      score: 1,
      evidence: `Wysoka gęstość faktów – ${per1000.toFixed(1)} liczb/dat na 1000 słów.`,
      details: `${numbers} liczb, ${years} dat rocznych, ${monthDates} dat dziennych w treści (${words} słów).`,
    };
  }
  if (per1000 >= 12) {
    return {
      score: 0.5,
      evidence: `Średnia gęstość – ${per1000.toFixed(1)} liczb/dat na 1000 słów.`,
      details: `${numbers} liczb, ${years} dat rocznych, ${monthDates} dat dziennych w treści (${words} słów). Próg dobry: 30+.`,
    };
  }
  return {
    score: 0,
    evidence: `Niska gęstość – tylko ${per1000.toFixed(1)} faktów na 1000 słów.`,
    details: `${numbers} liczb, ${years} dat rocznych w treści (${words} słów). Tekst głównie ogólny, bez konkretów.`,
  };
}

function detectSchema(jsonLdTypes: string[]): { score: 0 | 0.5 | 1; evidence: string; details: string } {
  if (jsonLdTypes.length === 0) {
    return {
      score: 0,
      evidence: 'Brak jakichkolwiek bloków JSON-LD na stronie.',
      details: 'Nie wykryto <script type="application/ld+json">.',
    };
  }

  const lower = jsonLdTypes.map((t) => t.toLowerCase());
  const hasArticle = lower.some((t) =>
    /^(article|newsarticle|blogposting|techarticle|scholarlyarticle)$/.test(t)
  );
  const hasFaq = lower.some((t) => t === 'faqpage');
  const hasHowTo = lower.some((t) => t === 'howto');
  const hasOrgOrPerson = lower.some((t) => t === 'organization' || t === 'person');
  const hasBreadcrumb = lower.some((t) => t === 'breadcrumblist');

  const points =
    (hasArticle ? 0.4 : 0) +
    (hasFaq ? 0.3 : 0) +
    (hasHowTo ? 0.2 : 0) +
    (hasOrgOrPerson ? 0.05 : 0) +
    (hasBreadcrumb ? 0.05 : 0);

  let score: 0 | 0.5 | 1;
  if (points >= 0.7) score = 1;
  else if (points >= 0.3) score = 0.5;
  else score = 0;

  const detected = [
    hasArticle && 'Article',
    hasFaq && 'FAQPage',
    hasHowTo && 'HowTo',
    hasOrgOrPerson && 'Organization/Person',
    hasBreadcrumb && 'BreadcrumbList',
  ].filter(Boolean) as string[];

  return {
    score,
    evidence:
      detected.length > 0
        ? `Wykryte typy schema: ${detected.join(', ')}.`
        : `Schema obecne, ale typy nie pasują do priorytetowych (${jsonLdTypes.slice(0, 3).join(', ')}).`,
    details: `Wszystkie wykryte @type: ${jsonLdTypes.join(', ') || '(brak)'}.`,
  };
}

function detectFreshness(html: string, jsonLdTypes: string[], jsonLdBlocks: unknown[]): { score: 0 | 0.5 | 1; evidence: string; details: string } {
  // Próby wyciągnięcia daty z różnych źródeł
  let dateStr: string | null = null;
  let source = '';

  // 1. JSON-LD dateModified > datePublished
  const visit = (node: unknown): void => {
    if (!node || typeof node !== 'object') return;
    const obj = node as Record<string, unknown>;
    if (typeof obj.dateModified === 'string' && !dateStr) {
      dateStr = obj.dateModified;
      source = 'JSON-LD dateModified';
      return;
    }
    if (typeof obj.datePublished === 'string' && !dateStr) {
      dateStr = obj.datePublished;
      source = 'JSON-LD datePublished';
    }
    if (Array.isArray(obj['@graph']))
      for (const n of obj['@graph']) {
        visit(n);
        if (dateStr && source.includes('Modified')) return;
      }
  };
  for (const b of jsonLdBlocks) visit(b);

  // 2. og:updated_time / article:modified_time
  if (!dateStr) {
    const updated =
      findMetaContent(html, 'article:modified_time') ||
      findMetaContent(html, 'og:updated_time') ||
      findMetaContent(html, 'article:published_time');
    if (updated) {
      dateStr = updated;
      source = 'meta article:*';
    }
  }

  if (!dateStr) {
    return {
      score: 0,
      evidence: 'Brak daty publikacji/aktualizacji w meta tagach ani JSON-LD.',
      details: 'AI wykluczają strony bez wyraźnego sygnału świeżości – warto dodać article:modified_time.',
    };
  }

  const date = new Date(dateStr as string);
  if (isNaN(date.getTime())) {
    return {
      score: 0,
      evidence: 'Data znaleziona, ale nie udało się jej sparsować.',
      details: `Wartość "${dateStr}" (${source}).`,
    };
  }

  const monthsDiff = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24 * 30);
  const dateLocal = date.toISOString().slice(0, 10);

  if (monthsDiff <= 3) {
    return {
      score: 1,
      evidence: `Bardzo świeża – ${dateLocal} (${monthsDiff.toFixed(1)} mies. temu).`,
      details: `Źródło: ${source}.`,
    };
  }
  if (monthsDiff <= 12) {
    return {
      score: 0.5,
      evidence: `Świeża, ale nie ostatnia – ${dateLocal} (${monthsDiff.toFixed(1)} mies. temu).`,
      details: `Źródło: ${source}. Perplexity i AI Overviews preferują content z ostatnich 3 miesięcy.`,
    };
  }
  return {
    score: 0,
    evidence: `Nieaktualna – ${dateLocal} (${monthsDiff.toFixed(0)} mies. temu).`,
    details: `Źródło: ${source}. AI silnie penalizują content starszy niż rok.`,
  };
}

function detectModular(html: string): { score: 0 | 0.5 | 1; evidence: string; details: string } {
  const ulCount = countTags(html, 'ul');
  const olCount = countTags(html, 'ol');
  const tableCount = countTags(html, 'table');

  // Ignorujemy listy w nawigacji – odejmujemy ~2 (nav + footer typically)
  const contentLists = Math.max(0, ulCount + olCount - 2);
  const score = contentLists + tableCount * 2; // tabele warte więcej

  if (score >= 5) {
    return {
      score: 1,
      evidence: `Treść mocno modułowa: ${contentLists} list i ${tableCount} tabel w body.`,
      details: `UL: ${ulCount}, OL: ${olCount}, TABLE: ${tableCount}. (Nawigacja odjęta heurystycznie.)`,
    };
  }
  if (score >= 2) {
    return {
      score: 0.5,
      evidence: `Częściowa modułowość: ${contentLists} list, ${tableCount} tabel.`,
      details: `UL: ${ulCount}, OL: ${olCount}, TABLE: ${tableCount}. Próg "dobry": 5+ list lub 2+ tabele.`,
    };
  }
  return {
    score: 0,
    evidence: 'Treść głównie tekstowa – mało list i tabel.',
    details: `UL: ${ulCount}, OL: ${olCount}, TABLE: ${tableCount}. AI trudniej wyciągnąć fragment jako odpowiedź.`,
  };
}

function detectComparisons(text: string, html: string): { score: 0 | 0.5 | 1; evidence: string; details: string } {
  // Słowa porównawcze
  const comparisonPatterns = [
    /\bvs\.?\b/gi,
    /\bversus\b/gi,
    /\bporównanie\b/gi,
    /\bporównaj\b/gi,
    /\balternatyw[aiy]\b/gi,
    /\bzamiast\b/gi,
    /\bw porównaniu\b/gi,
    /\bna tle\b/gi,
    /\bróżni się\b/gi,
    /\bróżnice między\b/gi,
  ];

  let totalMatches = 0;
  for (const re of comparisonPatterns) {
    const matches = text.match(re);
    if (matches) totalMatches += matches.length;
  }

  const tableCount = countTags(html, 'table');

  if (totalMatches >= 5 || (totalMatches >= 2 && tableCount >= 1)) {
    return {
      score: 1,
      evidence: `Treść porównuje produkty/podejścia (${totalMatches} sygnałów porównawczych${tableCount > 0 ? ` + ${tableCount} tabel` : ''}).`,
      details: `Wykryte słowa: vs/versus/porównanie/alternatywa/zamiast itd. AI często cytują takie sekcje pod zapytania "X vs Y".`,
    };
  }
  if (totalMatches >= 2) {
    return {
      score: 0.5,
      evidence: `Pojedyncze odniesienia porównawcze (${totalMatches}), ale brakuje wyraźnej sekcji.`,
      details: 'Próg "dobry": 5+ sygnałów porównawczych lub tabela porównawcza.',
    };
  }
  return {
    score: 0,
    evidence: 'Brak sygnałów porównawczych.',
    details: `Wykryto ${totalMatches} odniesień typu vs/porównanie/alternatywa. Pytania porównawcze to jedne z najczęstszych zapytań do LLM.`,
  };
}

function detectQuestionHeadings(html: string): { score: 0 | 0.5 | 1; evidence: string; details: string } {
  const headings = extractHeadings(html, [2, 3]);
  if (headings.length < 3) {
    return {
      score: 0,
      evidence: 'Strona ma za mało nagłówków H2/H3, żeby ocenić.',
      details: `Wykryto ${headings.length} nagłówków H2/H3.`,
    };
  }

  const questions = headings.filter((h) => /\?$/.test(h.trim()));
  const ratio = questions.length / headings.length;
  const pct = Math.round(ratio * 100);

  if (ratio >= 0.5) {
    return {
      score: 1,
      evidence: `${pct}% nagłówków H2/H3 to pytania (${questions.length}/${headings.length}).`,
      details: 'AI dopasowują nagłówki-pytania bezpośrednio do podzapytań usera (query fan-out).',
    };
  }
  if (ratio >= 0.2) {
    return {
      score: 0.5,
      evidence: `${pct}% nagłówków to pytania (${questions.length}/${headings.length}). Próg dobry: 50%.`,
      details: `Przykłady: ${questions.slice(0, 3).join(' / ')}`,
    };
  }
  return {
    score: 0,
    evidence: `Tylko ${pct}% H2/H3 to pytania (${questions.length}/${headings.length}).`,
    details: 'Przepisz przynajmniej 50% nagłówków w formę pytań – każde z konkretną odpowiedzią w 1. zdaniu.',
  };
}

// =============================================================================
// MAIN ANALYZER
// =============================================================================

export function analyzeContent(html: string): FullScore {
  const text = extractText(html);
  const jsonLdBlocks = extractJsonLd(html);
  const jsonLdTypes = getJsonLdTypes(jsonLdBlocks);

  const detectors: Record<FactorKey, { score: 0 | 0.5 | 1; evidence: string; details: string }> = {
    bluf: detectBluf(html, text),
    faq: detectFaq(html, jsonLdTypes),
    density: detectDensity(text),
    schema: detectSchema(jsonLdTypes),
    freshness: detectFreshness(html, jsonLdTypes, jsonLdBlocks),
    modular: detectModular(html),
    comparisons: detectComparisons(text, html),
    questionHeadings: detectQuestionHeadings(html),
  };

  const factors: FactorScore[] = FACTORS.map((def) => {
    const result = detectors[def.key];
    return {
      key: def.key,
      label: def.label,
      shortLabel: def.shortLabel,
      weight: def.weight,
      score: result.score,
      earned: Math.round(def.weight * result.score * 10) / 10,
      evidence: result.evidence,
      details: result.details,
    };
  });

  const total = Math.round(factors.reduce((acc, f) => acc + f.earned, 0));

  let grade: FullScore['grade'];
  if (total >= 85) grade = 'A';
  else if (total >= 70) grade = 'B';
  else if (total >= 55) grade = 'C';
  else if (total >= 40) grade = 'D';
  else grade = 'F';

  return { total, grade, factors };
}

// =============================================================================
// ACTION ITEMS
// =============================================================================

export function buildActionItems(factors: FactorScore[]): ActionItem[] {
  const items: ActionItem[] = [];

  // P0 – missing high-weight factors (weight >= 12, score 0)
  const p0 = factors.filter((f) => f.score === 0 && f.weight >= 12).sort((a, b) => b.weight - a.weight);
  for (const f of p0.slice(0, 3)) {
    items.push({
      priority: 'P0',
      factor: f.key,
      title: `${f.label}: brak`,
      description: FACTOR_BY_KEY[f.key].whatToFix,
    });
  }

  // P1 – partial high-weight (score 0.5, weight >= 12) + missing medium-weight (weight 10-11)
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

  // P2 – wszystkie pozostałe partials
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

  // Jeśli wszystko gra – jeden P2 "next step"
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
