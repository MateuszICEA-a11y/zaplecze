/**
 * Sonda dostępu botów AI do samej strony (nie do robots.txt).
 *
 * robots.txt to deklaracja. Realna blokada siedzi zwykle piętro wyżej:
 * WAF/CDN odrzuca żądanie po User-Agencie, albo strona zwraca 200,
 * ale z nagłówkiem `X-Robots-Tag: noai` / meta robots.
 *
 * Dwa kroki, rozdzielone bo mają różną wiarygodność:
 *   1. `analyzePage` – jeden fetch przeglądarkowym UA; czyta X-Robots-Tag,
 *      meta robots i sygnatury CDN. Zero podszywania się, zero fałszywek.
 *   2. `probeBotAccess` – porównanie odpowiedzi dla UA przeglądarki i UA botów.
 *      Idzie z IP Cloudflare, więc dla WAF-u jesteśmy podszywaczem, nie
 *      zweryfikowanym botem. Wynik jest sygnałem, nie werdyktem – patrz
 *      `PROBE_DISCLAIMER`.
 */

export const PROBE_DISCLAIMER =
  'Sonda wysyła żądania z infrastruktury Cloudflare i podszywa się pod User-Agent bota. ' +
  'Prawdziwe boty AI są weryfikowane po zakresach IP i reverse DNS, więc wynik bywa ' +
  'ostrzejszy (blok podszywacza) albo łagodniejszy (reguła celuje w zweryfikowaną kategorię) ' +
  'niż rzeczywistość. Potwierdź w Cloudflare Dashboard → AI Crawl Control oraz Security → Events.';

export const BROWSER_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36';

/**
 * Boty brane do sondy. Świadomie podzbiór z AI_BOTS – każdy bot to osobny
 * strzał w cudzy serwer, a te cztery pokrywają reguły WAF, które faktycznie
 * decydują o cytowaniach (trening OpenAI/Anthropic + wyszukiwarki AI).
 */
export const PROBE_BOTS: Array<{ name: string; userAgent: string; ua: string }> = [
  {
    name: 'GPTBot',
    userAgent: 'GPTBot',
    ua: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.2; +https://openai.com/gptbot',
  },
  {
    name: 'OAI-SearchBot',
    userAgent: 'OAI-SearchBot',
    ua: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot',
  },
  {
    name: 'ClaudeBot',
    userAgent: 'ClaudeBot',
    ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36; compatible; ClaudeBot/1.0; +claudebot@anthropic.com',
  },
  {
    name: 'PerplexityBot',
    userAgent: 'PerplexityBot',
    ua: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot',
  },
];

/* ------------------------------------------------------------------ */
/* Krok 1: X-Robots-Tag + meta robots                                  */
/* ------------------------------------------------------------------ */

export type RobotsDirective = {
  source: 'header' | 'meta';
  /** user-agent, do którego odnosi się dyrektywa; `*` = wszystkie */
  agent: string;
  tokens: string[];
  raw: string;
};

export type DirectiveSummary = {
  noindex: boolean;
  nofollow: boolean;
  noai: boolean;
  noimageai: boolean;
  noarchive: boolean;
  nosnippet: boolean;
};

const KNOWN_TOKENS = new Set([
  'noindex',
  'nofollow',
  'noai',
  'noimageai',
  'noarchive',
  'nosnippet',
  'none',
  'index',
  'follow',
  'all',
]);

/**
 * Parsuje wartość nagłówka `X-Robots-Tag`.
 *
 * Format dopuszcza wariant z prefiksem user-agenta:
 *   `X-Robots-Tag: noindex, nofollow`
 *   `X-Robots-Tag: googlebot: noindex, otherbot: nofollow`
 * Kilka nagłówków fetch skleja przecinkiem, więc rozbijamy po przecinku
 * i traktujemy segment z dwukropkiem jako początek nowej grupy.
 */
export function parseXRobotsTag(headerValue: string | null | undefined): RobotsDirective[] {
  if (!headerValue) return [];
  const groups = new Map<string, string[]>();
  let agent = '*';

  for (const rawSegment of headerValue.split(',')) {
    const segment = rawSegment.trim();
    if (!segment) continue;

    const colonIdx = segment.indexOf(':');
    let token = segment;
    if (colonIdx !== -1) {
      const maybeAgent = segment.slice(0, colonIdx).trim();
      const rest = segment.slice(colonIdx + 1).trim();
      // `max-snippet: 20` to dyrektywa z wartością, nie prefiks user-agenta.
      if (maybeAgent && !/^max-(snippet|image-preview|video-preview)$/i.test(maybeAgent)) {
        agent = maybeAgent.toLowerCase();
        token = rest;
      }
    }
    if (!token) continue;
    const list = groups.get(agent) ?? [];
    list.push(token.toLowerCase());
    groups.set(agent, list);
  }

  return [...groups.entries()].map(([groupAgent, tokens]) => ({
    source: 'header' as const,
    agent: groupAgent,
    tokens,
    raw: headerValue,
  }));
}

/**
 * Wyciąga `<meta name="robots|googlebot|...">` z sekcji head.
 * Atrybuty bierzemy regexem – parser DOM nie jest dostępny w Workerze,
 * a struktura meta jest płaska i przewidywalna.
 */
export function parseMetaRobots(html: string): RobotsDirective[] {
  const head = html.slice(0, 200_000);
  const directives: RobotsDirective[] = [];
  const metaRe = /<meta\b[^>]*>/gi;

  for (const match of head.match(metaRe) ?? []) {
    const nameMatch = /\bname\s*=\s*["']?([^"'\s>]+)/i.exec(match);
    const contentMatch = /\bcontent\s*=\s*["']([^"']*)["']/i.exec(match);
    if (!nameMatch || !contentMatch) continue;

    const name = nameMatch[1]!.toLowerCase();
    const content = contentMatch[1]!.toLowerCase();
    const tokens = content
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    // Bierzemy tylko meta, które faktycznie niosą dyrektywę robotową –
    // inaczej złapalibyśmy description, viewport i całą resztę.
    if (!tokens.some((t) => KNOWN_TOKENS.has(t.split(':')[0]!.trim()))) continue;

    directives.push({ source: 'meta', agent: name, tokens, raw: match });
  }

  return directives;
}

export function summarizeDirectives(directives: RobotsDirective[]): DirectiveSummary {
  const all = directives.flatMap((d) => d.tokens);
  const has = (token: string) => all.includes(token);
  return {
    noindex: has('noindex') || has('none'),
    nofollow: has('nofollow') || has('none'),
    noai: has('noai'),
    noimageai: has('noimageai'),
    noarchive: has('noarchive'),
    nosnippet: has('nosnippet'),
  };
}

/* ------------------------------------------------------------------ */
/* Wykrycie CDN / edge                                                 */
/* ------------------------------------------------------------------ */

export type EdgeInfo = {
  cloudflare: boolean;
  server: string | null;
  signals: string[];
};

export function detectEdge(headers: Headers, html: string): EdgeInfo {
  const signals: string[] = [];
  const server = headers.get('server');

  if (server && /cloudflare/i.test(server)) signals.push('server: cloudflare');
  if (headers.get('cf-ray')) signals.push('cf-ray');
  if (headers.get('cf-cache-status')) signals.push('cf-cache-status');
  if (headers.get('cf-mitigated')) signals.push(`cf-mitigated: ${headers.get('cf-mitigated')}`);
  if (/\/cdn-cgi\//.test(html.slice(0, 200_000))) signals.push('/cdn-cgi/ w HTML');

  return { cloudflare: signals.length > 0, server, signals };
}

/** Interstitial Cloudflare („Just a moment…", managed challenge, turnstile). */
export function isChallengeBody(html: string): boolean {
  const head = html.slice(0, 100_000);
  return (
    /just a moment/i.test(head) ||
    /__cf_chl/i.test(head) ||
    /cf-browser-verification/i.test(head) ||
    /challenge-platform/i.test(head) ||
    /cf-error/i.test(head) ||
    /attention required.*cloudflare/is.test(head)
  );
}

/** Zgrubna długość prozy – tagi, script i style poza nawiasem. */
export function visibleTextLength(html: string): number {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim().length;
}

/* ------------------------------------------------------------------ */
/* Krok 2: klasyfikacja sondy                                          */
/* ------------------------------------------------------------------ */

export type ProbeSample = {
  status: number;
  challenge: boolean;
  cfMitigated: string | null;
  textLength: number;
  error?: string;
};

export type ProbeVerdict = 'ok' | 'ua-blocked' | 'challenged' | 'both-blocked' | 'thin' | 'unknown';

export type ProbeResult = {
  name: string;
  userAgent: string;
  verdict: ProbeVerdict;
  status: number | null;
  note: string;
};

/** Ile prozy musi zniknąć, żeby uznać odpowiedź dla bota za okrojoną. */
const THIN_RATIO = 0.4;
const THIN_MIN_DIFF = 800;

export function classifyProbe(baseline: ProbeSample, sample: ProbeSample): ProbeVerdict {
  if (sample.error) return 'unknown';
  if (sample.challenge || sample.cfMitigated) {
    return baseline.challenge || baseline.cfMitigated ? 'both-blocked' : 'challenged';
  }
  if (sample.status >= 400) {
    if (baseline.error || baseline.status >= 400) return 'both-blocked';
    return 'ua-blocked';
  }
  if (baseline.error || baseline.status >= 400) return 'unknown';
  if (
    baseline.textLength > 0 &&
    sample.textLength < baseline.textLength * THIN_RATIO &&
    baseline.textLength - sample.textLength >= THIN_MIN_DIFF
  ) {
    return 'thin';
  }
  return 'ok';
}

export function verdictNote(verdict: ProbeVerdict, sample: ProbeSample): string {
  switch (verdict) {
    case 'ok':
      return `HTTP ${sample.status} – odpowiedź jak dla przeglądarki`;
    case 'ua-blocked':
      return `HTTP ${sample.status} dla bota przy 200 dla przeglądarki – blokada po User-Agencie`;
    case 'challenged':
      return `Challenge CDN${sample.cfMitigated ? ` (cf-mitigated: ${sample.cfMitigated})` : ''} – bot nie przejdzie`;
    case 'both-blocked':
      return `HTTP ${sample.status} także dla przeglądarki – blokada nie jest wycelowana w boty`;
    case 'thin':
      return `HTTP ${sample.status}, ale treści ${sample.textLength} zn. wobec baseline – możliwy rendering JS lub cloaking`;
    default:
      return sample.error ? `Nie udało się sprawdzić: ${sample.error}` : 'Brak rozstrzygnięcia';
  }
}

/* ------------------------------------------------------------------ */
/* Orkiestracja fetchy                                                 */
/* ------------------------------------------------------------------ */

export type PageAnalysis = {
  pageUrl: string;
  finalUrl: string;
  status: number | null;
  edge: EdgeInfo | null;
  directives: RobotsDirective[];
  directiveSummary: DirectiveSummary;
  probes: ProbeResult[];
  baselineChallenge: boolean;
  error?: string;
};

const PROBE_TIMEOUT_MS = 8_000;
const MAX_PROBE_BYTES = 400 * 1024;

async function fetchSample(
  url: string,
  userAgent: string
): Promise<{ sample: ProbeSample; response: Response | null; html: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort('probe-timeout'), PROBE_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': userAgent,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
      signal: controller.signal,
    });
    const html = await readCapped(response, MAX_PROBE_BYTES);
    return {
      response,
      html,
      sample: {
        status: response.status,
        challenge: isChallengeBody(html),
        cfMitigated: response.headers.get('cf-mitigated'),
        textLength: visibleTextLength(html),
      },
    };
  } catch (error) {
    const message =
      error instanceof DOMException && error.name === 'AbortError'
        ? 'timeout'
        : error instanceof Error
          ? error.message
          : 'nieznany błąd';
    return {
      response: null,
      html: '',
      sample: { status: 0, challenge: false, cfMitigated: null, textLength: 0, error: message },
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function readCapped(response: Response, maxBytes: number): Promise<string> {
  if (!response.body) return '';
  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8', { fatal: false });
  let out = '';
  let received = 0;
  while (received < maxBytes) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    out += decoder.decode(value, { stream: true });
  }
  out += decoder.decode();
  await reader.cancel().catch(() => {});
  return out;
}

/**
 * Pełny przejazd: baseline przeglądarkowy (krok 1) + sondy botów (krok 2).
 * Fail-soft – każdy błąd ląduje w `error`/`unknown`, nigdy nie wywraca raportu.
 */
export async function analyzePageAccess(pageUrl: string): Promise<PageAnalysis> {
  const baseline = await fetchSample(pageUrl, BROWSER_USER_AGENT);

  if (!baseline.response) {
    return {
      pageUrl,
      finalUrl: pageUrl,
      status: null,
      edge: null,
      directives: [],
      directiveSummary: summarizeDirectives([]),
      probes: [],
      baselineChallenge: false,
      error: baseline.sample.error,
    };
  }

  const directives = [
    ...parseXRobotsTag(baseline.response.headers.get('x-robots-tag')),
    ...parseMetaRobots(baseline.html),
  ];

  const probes = await Promise.all(
    PROBE_BOTS.map(async (bot) => {
      const { sample } = await fetchSample(pageUrl, bot.ua);
      const verdict = classifyProbe(baseline.sample, sample);
      return {
        name: bot.name,
        userAgent: bot.userAgent,
        verdict,
        status: sample.error ? null : sample.status,
        note: verdictNote(verdict, sample),
      };
    })
  );

  return {
    pageUrl,
    finalUrl: baseline.response.url || pageUrl,
    status: baseline.sample.status,
    edge: detectEdge(baseline.response.headers, baseline.html),
    directives,
    directiveSummary: summarizeDirectives(directives),
    probes,
    baselineChallenge: baseline.sample.challenge || Boolean(baseline.sample.cfMitigated),
  };
}

/* ------------------------------------------------------------------ */
/* Action items                                                        */
/* ------------------------------------------------------------------ */

export type ProbeActionItem = {
  priority: 'P0' | 'P1' | 'P2';
  title: string;
  description: string;
};

export function buildPageActionItems(analysis: PageAnalysis): ProbeActionItem[] {
  const items: ProbeActionItem[] = [];

  if (analysis.error) {
    items.push({
      priority: 'P1',
      title: 'Nie udało się sprawdzić samej strony',
      description: `Analiza objęła wyłącznie robots.txt. Pobranie ${analysis.pageUrl} nie powiodło się (${analysis.error}), więc warstwa WAF, nagłówka X-Robots-Tag i meta robots pozostaje niesprawdzona.`,
    });
    return items;
  }

  const s = analysis.directiveSummary;

  if (s.noindex) {
    items.push({
      priority: 'P0',
      title: 'Strona ma dyrektywę noindex',
      description: `Poza robots.txt działa ${describeSources(analysis.directives, 'noindex')} z wartością noindex. Wyszukiwarki i wyszukiwarki AI wykluczą tę stronę z indeksu niezależnie od tego, co pozwala robots.txt.`,
    });
  }

  if (s.noai || s.noimageai) {
    const which = [s.noai ? 'noai' : null, s.noimageai ? 'noimageai' : null]
      .filter(Boolean)
      .join(' i ');
    items.push({
      priority: 'P1',
      title: `Dyrektywa ${which} wyłącza treść z użycia przez AI`,
      description: `${describeSources(analysis.directives, s.noai ? 'noai' : 'noimageai')} niesie ${which}. To sygnał respektowany m.in. przez Bing i część dostawców AI – jeśli celem jest widoczność w wyszukiwaniu AI, usuń go.`,
    });
  }

  if (s.nosnippet) {
    items.push({
      priority: 'P1',
      title: 'Dyrektywa nosnippet blokuje fragmenty w odpowiedziach',
      description:
        'Strona może być zaindeksowana, ale bez prawa do cytowania fragmentu. W AI Overviews i odpowiedziach asystentów oznacza to brak przytoczenia treści.',
    });
  }

  const uaBlocked = analysis.probes.filter((p) => p.verdict === 'ua-blocked');
  const challenged = analysis.probes.filter((p) => p.verdict === 'challenged');
  const thin = analysis.probes.filter((p) => p.verdict === 'thin');
  const bothBlocked = analysis.probes.filter((p) => p.verdict === 'both-blocked');

  if (uaBlocked.length > 0 || challenged.length > 0) {
    const names = [...uaBlocked, ...challenged].map((p) => p.name).join(', ');
    const edgeHint = analysis.edge?.cloudflare
      ? 'Wykryto Cloudflare przed domeną – sprawdź Security → WAF → Custom rules oraz przełącznik „Block AI bots" w AI Crawl Control.'
      : 'Sprawdź reguły WAF, ModSecurity i blokady User-Agent po stronie hostingu.';
    items.push({
      priority: 'P0',
      title: `Serwer odrzuca żądania botów: ${names}`,
      description: `Przeglądarka dostaje treść, a te User-Agenty dostają blokadę lub challenge. robots.txt jest tu bez znaczenia – żądanie nie dochodzi do treści. ${edgeHint} ${PROBE_DISCLAIMER}`,
    });
  }

  if (thin.length > 0) {
    items.push({
      priority: 'P1',
      title: `Boty dostają okrojoną treść: ${thin.map((p) => p.name).join(', ')}`,
      description:
        'Status jest poprawny, ale odpowiedź dla bota zawiera wyraźnie mniej tekstu niż dla przeglądarki. Typowa przyczyna to renderowanie treści przez JavaScript (boty AI go nie wykonują) albo serwowanie innej wersji strony botom.',
    });
  }

  if (bothBlocked.length > 0 && uaBlocked.length === 0 && challenged.length === 0) {
    items.push({
      priority: 'P1',
      title: 'Strona nie odpowiada poprawnie także przeglądarce',
      description: `Sondy zwróciły błąd zarówno dla botów, jak i dla przeglądarki (HTTP ${analysis.status}). To awaria lub blokada ogólna, nie reguła wycelowana w boty AI.`,
    });
  }

  if (items.length === 0) {
    items.push({
      priority: 'P2',
      title: 'Warstwa serwera nie blokuje botów AI',
      description: `Sonda dla ${analysis.probes.length} botów otrzymała te same odpowiedzi co przeglądarka, a strona nie niesie dyrektyw noindex/noai. ${PROBE_DISCLAIMER}`,
    });
  }

  return items;
}

function describeSources(directives: RobotsDirective[], token: string): string {
  const sources = directives
    .filter((d) => d.tokens.includes(token))
    .map((d) => (d.source === 'header' ? 'nagłówek X-Robots-Tag' : `meta name="${d.agent}"`));
  const unique = [...new Set(sources)];
  return unique.length ? unique.join(' i ') : 'dyrektywa robotowa';
}
