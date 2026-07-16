/**
 * Brand Check – sprawdza, co modele AI wiedzą o marce.
 *
 * Endpoint: POST /api/tools/brand-check
 * Body: { brand: "ICEA", domain?: "icea.pl", category?: "agencja SEO", market?: "Polska" }
 *
 * Wymaga env var OPENROUTER_API_KEY.
 */
import { resolveLimit, checkToolLimit } from '../../_lib/tool-rate-limit';
import { normalizeUrl, getHost } from '../../_lib/url-host';

type BrandCheckRequest = {
  brand?: string;
  domain?: string;
  category?: string;
  market?: string;
};

type Citation = {
  title: string;
  url: string;
  domain: string;
};

type Hallucination = {
  claim: string;
  severity: 'low' | 'medium' | 'high';
  why: string;
};

type CompetitorMention = {
  name: string;
  context: string;
};

type ModelResult = {
  id: string;
  label: string;
  model: string;
  status: 'ok' | 'error';
  error?: string;
  knowsBrand: 'yes' | 'partial' | 'no';
  sentiment: 'positive' | 'neutral' | 'negative' | 'unknown';
  confidence: number;
  summary: string;
  brandCited: boolean;
  citedOwnDomain: boolean;
  citations: Citation[];
  competitors: CompetitorMention[];
  hallucinations: Hallucination[];
  recommendation: string;
};

type BrandProfile = {
  url?: string;
  finalUrl?: string;
  title?: string;
  description?: string;
  headings: string[];
  textSample?: string;
  status: 'ok' | 'missing' | 'fetch-error';
  error?: string;
};

type BrandCheckResponse = {
  brand: string;
  domain?: string;
  category?: string;
  market: string;
  fetchedAt: string;
  status: 'ok' | 'partial' | 'config-error';
  profile: BrandProfile;
  summary: {
    score: number;
    knownBy: number;
    totalModels: number;
    averageConfidence: number;
    sentiment: 'positive' | 'neutral' | 'negative' | 'mixed' | 'unknown';
    hallucinations: number;
    competitors: string[];
    ownDomainCitedBy: number;
  };
  models: ModelResult[];
  actionItems: {
    priority: 'P0' | 'P1' | 'P2';
    title: string;
    description: string;
  }[];
};

type Env = {
  OPENROUTER_API_KEY?: string;
  BRAND_CHECK_DAILY_LIMIT?: string;
  FANOUT_RL?: KVNamespace;
};

const BRAND_CHECK_DEFAULT_LIMIT = 3;

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const FETCH_TIMEOUT_MS = 10_000;
const LLM_TIMEOUT_MS = 45_000;
const MAX_HTML_BYTES = 900_000;

const MODEL_PROVIDERS = [
  { id: 'chatgpt', label: 'ChatGPT', model: 'openai/gpt-5-mini', useOpenRouterSearch: true },
  { id: 'claude', label: 'Claude', model: 'anthropic/claude-haiku-4.5', useOpenRouterSearch: true },
  { id: 'gemini', label: 'Gemini', model: 'google/gemini-3-flash-preview', useOpenRouterSearch: true },
  { id: 'perplexity', label: 'Perplexity', model: 'perplexity/sonar-pro', useOpenRouterSearch: false },
] as const;

const FALLBACK_RESULT = (provider: (typeof MODEL_PROVIDERS)[number], error: string): ModelResult => ({
  id: provider.id,
  label: provider.label,
  model: provider.model,
  status: 'error',
  error,
  knowsBrand: 'no',
  sentiment: 'unknown',
  confidence: 0,
  summary: 'Nie udało się pobrać odpowiedzi z modelu.',
  brandCited: false,
  citedOwnDomain: false,
  citations: [],
  competitors: [],
  hallucinations: [],
  recommendation: 'Powtórz test albo sprawdź konfigurację OpenRouter.',
});

function normalizeText(value: unknown, max = 180): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim().slice(0, max);
}

function normalizeBrand(value: string): string {
  return value.replace(/\s+/g, ' ').trim().slice(0, 80);
}

function normalizeLoose(value: string | undefined, max: number): string | undefined {
  const cleaned = normalizeText(value, max);
  return cleaned || undefined;
}


async function fetchBrandProfile(domain: string | undefined): Promise<BrandProfile> {
  const url = normalizeUrl(domain);
  if (!url) return { status: 'missing', headings: [] };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort('fetch-timeout'), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pl-PL,pl;q=0.9,en;q=0.8',
      },
      redirect: 'follow',
      signal: controller.signal,
      cf: { cacheTtl: 300, cacheEverything: false },
    });

    const contentType = response.headers.get('content-type') || '';
    if (response.status >= 400 || !/text\/html|application\/xhtml/i.test(contentType)) {
      return {
        status: 'fetch-error',
        url,
        finalUrl: response.url || url,
        headings: [],
        error: `HTTP ${response.status}, content-type: ${contentType || 'brak'}`,
      };
    }

    const html = await readLimited(response, MAX_HTML_BYTES);
    return parseBrandProfile(html, url, response.url || url);
  } catch (error) {
    const message =
      error instanceof DOMException && error.name === 'AbortError'
        ? 'Przekroczono limit czasu pobierania strony.'
        : error instanceof Error
          ? error.message
          : 'Nieznany błąd pobierania strony.';
    return { status: 'fetch-error', url, headings: [], error: message };
  } finally {
    clearTimeout(timeout);
  }
}

async function readLimited(response: Response, maxBytes: number): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return (await response.text()).slice(0, maxBytes);

  const decoder = new TextDecoder('utf-8');
  let html = '';
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > maxBytes) {
      await reader.cancel();
      break;
    }
    html += decoder.decode(value, { stream: true });
  }
  html += decoder.decode();
  return html;
}

function parseBrandProfile(html: string, url: string, finalUrl: string): BrandProfile {
  const clean = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');

  const title = normalizeText(clean.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1], 180);
  const description =
    extractMeta(clean, 'description') ||
    extractMeta(clean, 'og:description') ||
    extractMeta(clean, 'twitter:description');

  const headings = Array.from(clean.matchAll(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi))
    .map((m) => htmlToText(m[1]))
    .filter(Boolean)
    .slice(0, 8);

  const textSample = htmlToText(clean).slice(0, 1800);
  return {
    status: 'ok',
    url,
    finalUrl,
    title: title || undefined,
    description: description || undefined,
    headings,
    textSample: textSample || undefined,
  };
}

function extractMeta(html: string, name: string): string | undefined {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(
    `<meta[^>]+(?:name|property)=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`,
    'i'
  );
  return normalizeText(html.match(re)?.[1], 240) || undefined;
}

function htmlToText(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildPrompt(input: {
  brand: string;
  domain?: string;
  category?: string;
  market: string;
  profile: BrandProfile;
}): string {
  const profileLines = [
    input.profile.title ? `- title: ${input.profile.title}` : '',
    input.profile.description ? `- meta description: ${input.profile.description}` : '',
    input.profile.headings.length ? `- nagłówki: ${input.profile.headings.join(' | ')}` : '',
    input.profile.textSample ? `- próbka treści strony: ${input.profile.textSample}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  return `Użyj web search. Odpowiedz WYŁĄCZNIE valid JSON, bez markdown.

Analizowana marka: ${input.brand}
Domena marki: ${input.domain || '(brak)'}
Kategoria: ${input.category || '(nie podano)'}
Rynek: ${input.market}

Profil referencyjny z publicznej strony marki:
${profileLines || '(nie udało się pobrać publicznej strony marki)'}

Zadanie:
1. Sprawdź, co aktualne źródła i wyniki web mówią o tej marce.
2. Oceń, czy rozpoznajesz markę w podanej kategorii i rynku.
3. Wskaż konkurentów / alternatywy, które prawdopodobnie poleciłby użytkownikowi silnik AI.
4. Porównaj odpowiedź z profilem referencyjnym i oznacz możliwe halucynacje: błędna oferta, lokalizacja, skala działalności, właściciel, ceny, branża, mylenie z inną firmą.
5. Jeśli źródła są słabe albo niejednoznaczne, napisz to wprost.

JSON schema:
{
  "knowsBrand": "yes" | "partial" | "no",
  "sentiment": "positive" | "neutral" | "negative" | "unknown",
  "confidence": 0-100,
  "summary": "2 krótkie zdania po polsku",
  "brandCited": true | false,
  "competitors": [{"name": "nazwa", "context": "dlaczego pojawia się zamiast marki"}],
  "hallucinations": [{"claim": "podejrzane twierdzenie", "severity": "low" | "medium" | "high", "why": "dlaczego to wygląda na błąd"}],
  "recommendation": "jedno konkretne zalecenie dla zwiększenia widoczności marki w AI"
}`;
}

async function callOpenRouter(
  provider: (typeof MODEL_PROVIDERS)[number],
  apiKey: string,
  prompt: string,
  ownDomain: string | undefined
): Promise<ModelResult> {
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
        'X-Title': 'widocznosc.ai Brand Check',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: provider.model,
        messages: [
          {
            role: 'system',
            content:
              'Jesteś analitykiem GEO i reputacji marki. Używasz wyszukiwania web, oceniasz ostrożnie i zwracasz wyłącznie JSON po polsku.',
          },
          { role: 'user', content: prompt },
        ],
        ...(provider.useOpenRouterSearch
          ? {
              tools: [
                {
                  type: 'openrouter:web_search',
                  parameters: {
                    max_results: 6,
                    search_context_size: 'medium',
                  },
                },
              ],
            }
          : {}),
        ...(provider.id === 'perplexity' ? {} : { response_format: { type: 'json_object' } }),
        temperature: 0.2,
      }),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Przekroczono limit czasu odpowiedzi modelu.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`OpenRouter HTTP ${response.status}: ${text.slice(0, 240)}`);
  }

  const body = (await response.json()) as {
    choices?: {
      message?: {
        content?: string;
        annotations?: {
          type?: string;
          url_citation?: { url?: string; title?: string; content?: string };
        }[];
      };
    }[];
  };

  const message = body.choices?.[0]?.message;
  const content = message?.content?.trim() || '';
  if (!content) throw new Error('Pusta odpowiedź z OpenRouter.');

  const parsed = parseJsonObject(content);
  const citations = extractCitations(message?.annotations || []);
  const citedOwnDomain =
    !!ownDomain && citations.some((citation) => citation.domain === ownDomain || citation.domain.endsWith(`.${ownDomain}`));

  const knowsBrand = normalizeEnum(parsed.knowsBrand, ['yes', 'partial', 'no'], 'no');
  const sentiment = normalizeEnum(
    parsed.sentiment,
    ['positive', 'neutral', 'negative', 'unknown'],
    'unknown'
  );

  return {
    id: provider.id,
    label: provider.label,
    model: provider.model,
    status: 'ok',
    knowsBrand,
    sentiment,
    confidence: clampNumber(parsed.confidence, 0, 100),
    summary: normalizeText(parsed.summary, 500) || 'Model nie podał czytelnego podsumowania.',
    brandCited: Boolean(parsed.brandCited),
    citedOwnDomain,
    citations,
    competitors: normalizeCompetitors(parsed.competitors),
    hallucinations: normalizeHallucinations(parsed.hallucinations),
    recommendation:
      normalizeText(parsed.recommendation, 320) ||
      'Wzmocnij publiczny opis marki, dane strukturalne i cytowalne treści ofertowe.',
  };
}

function parseJsonObject(content: string): Record<string, unknown> {
  let cleaned = content.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '');
  }

  try {
    const parsed = JSON.parse(cleaned);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) {
      const sliced = cleaned.slice(start, end + 1);
      const parsed = JSON.parse(sliced);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : {};
    }
    throw new Error(`Model zwrócił niepoprawny JSON: ${cleaned.slice(0, 180)}`);
  }
}

function extractCitations(
  annotations: {
    type?: string;
    url_citation?: { url?: string; title?: string; content?: string };
  }[]
): Citation[] {
  const seen = new Set<string>();
  const citations: Citation[] = [];
  for (const annotation of annotations) {
    if (annotation.type !== 'url_citation' || !annotation.url_citation?.url) continue;
    try {
      const url = new URL(annotation.url_citation.url);
      const normalized = url.toString();
      if (seen.has(normalized)) continue;
      seen.add(normalized);
      citations.push({
        url: normalized,
        title: normalizeText(annotation.url_citation.title, 140) || url.hostname,
        domain: url.hostname.replace(/^www\./i, ''),
      });
    } catch {
      /* ignore malformed citations */
    }
  }
  return citations.slice(0, 8);
}

function normalizeCompetitors(value: unknown): CompetitorMention[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const obj = item as Record<string, unknown>;
      const name = normalizeText(obj.name, 90);
      if (!name) return null;
      return {
        name,
        context: normalizeText(obj.context, 180) || 'Wskazany jako alternatywa w odpowiedzi modelu.',
      };
    })
    .filter((item): item is CompetitorMention => Boolean(item))
    .slice(0, 8);
}

function normalizeHallucinations(value: unknown): Hallucination[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const obj = item as Record<string, unknown>;
      const claim = normalizeText(obj.claim, 180);
      if (!claim) return null;
      return {
        claim,
        severity: normalizeEnum(obj.severity, ['low', 'medium', 'high'], 'medium'),
        why: normalizeText(obj.why, 220) || 'Twierdzenie nie wynika jasno z profilu referencyjnego marki.',
      };
    })
    .filter((item): item is Hallucination => Boolean(item))
    .slice(0, 8);
}

function normalizeEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && allowed.includes(value as T) ? (value as T) : fallback;
}

function clampNumber(value: unknown, min: number, max: number): number {
  const numeric = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  if (!Number.isFinite(numeric)) return min;
  return Math.max(min, Math.min(max, Math.round(numeric)));
}

function aggregate(
  brand: string,
  domain: string | undefined,
  category: string | undefined,
  market: string,
  profile: BrandProfile,
  models: ModelResult[]
): BrandCheckResponse {
  const okModels = models.filter((m) => m.status === 'ok');
  const knownBy = okModels.filter((m) => m.knowsBrand === 'yes').length;
  const partiallyKnownBy = okModels.filter((m) => m.knowsBrand === 'partial').length;
  const averageConfidence = okModels.length
    ? Math.round(okModels.reduce((sum, m) => sum + m.confidence, 0) / okModels.length)
    : 0;
  const hallucinations = okModels.reduce((sum, m) => sum + m.hallucinations.length, 0);
  const ownDomainCitedBy = okModels.filter((m) => m.citedOwnDomain).length;
  const competitors = topCompetitors(okModels);
  const sentiment = aggregateSentiment(okModels);

  const score = calculateScore({
    totalModels: okModels.length || MODEL_PROVIDERS.length,
    knownBy,
    partiallyKnownBy,
    averageConfidence,
    hallucinations,
    ownDomainCitedBy,
    competitorCount: competitors.length,
  });

  return {
    brand,
    domain,
    category,
    market,
    fetchedAt: new Date().toISOString(),
    status: models.every((m) => m.status === 'ok') ? 'ok' : 'partial',
    profile,
    summary: {
      score,
      knownBy,
      totalModels: MODEL_PROVIDERS.length,
      averageConfidence,
      sentiment,
      hallucinations,
      competitors,
      ownDomainCitedBy,
    },
    models,
    actionItems: buildActionItems(score, hallucinations, ownDomainCitedBy, competitors, profile),
  };
}

function calculateScore(input: {
  totalModels: number;
  knownBy: number;
  partiallyKnownBy: number;
  averageConfidence: number;
  hallucinations: number;
  ownDomainCitedBy: number;
  competitorCount: number;
}): number {
  const knownScore =
    ((input.knownBy + input.partiallyKnownBy * 0.45) / Math.max(input.totalModels, 1)) * 38;
  const confidenceScore = (input.averageConfidence / 100) * 22;
  const citationScore = (input.ownDomainCitedBy / Math.max(input.totalModels, 1)) * 22;
  const hallucinationPenalty = Math.min(24, input.hallucinations * 6);
  const competitorPenalty = Math.min(14, input.competitorCount * 2);
  return Math.max(0, Math.min(100, Math.round(knownScore + confidenceScore + citationScore + 18 - hallucinationPenalty - competitorPenalty)));
}

function aggregateSentiment(models: ModelResult[]): BrandCheckResponse['summary']['sentiment'] {
  const sentiments = models.map((m) => m.sentiment).filter((s) => s !== 'unknown');
  if (sentiments.length === 0) return 'unknown';
  const unique = new Set(sentiments);
  if (unique.size > 1) return 'mixed';
  return sentiments[0] as 'positive' | 'neutral' | 'negative';
}

function topCompetitors(models: ModelResult[]): string[] {
  const counts = new Map<string, number>();
  for (const model of models) {
    for (const competitor of model.competitors) {
      const key = competitor.name.trim();
      if (!key) continue;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'pl'))
    .map(([name]) => name)
    .slice(0, 8);
}

function buildActionItems(
  score: number,
  hallucinations: number,
  ownDomainCitedBy: number,
  competitors: string[],
  profile: BrandProfile
): BrandCheckResponse['actionItems'] {
  const items: BrandCheckResponse['actionItems'] = [];

  if (profile.status !== 'ok') {
    items.push({
      priority: 'P0',
      title: 'Strona marki nie była czytelna dla audytu',
      description:
        'Modelom trudniej zweryfikować markę, jeśli homepage nie zwraca czytelnego HTML albo jest blokowany. Sprawdź SSR, WAF i podstawowe meta dane.',
    });
  }

  if (ownDomainCitedBy === 0) {
    items.push({
      priority: 'P0',
      title: 'Modele nie cytują domeny marki',
      description:
        'Dodaj silniejszy profil firmy: strona O nas, schema Organization, FAQ ofertowe, dane liczbowe i treści porównawcze, które łatwo zacytować.',
    });
  }

  if (hallucinations > 0) {
    items.push({
      priority: 'P1',
      title: 'Wykryto możliwe halucynacje o marce',
      description:
        'Ujednolić opis usług, lokalizacji, klientów i specjalizacji w publicznych źródłach. Modele mylą marki, gdy sygnały w webie są rozproszone.',
    });
  }

  if (competitors.length > 0) {
    items.push({
      priority: 'P1',
      title: 'AI podpowiada konkurentów',
      description: `Najczęściej pojawiają się: ${competitors.slice(0, 4).join(', ')}. Dodaj na stronie porównania i treści "alternatywa dla", żeby wejść do tego samego koszyka rekomendacji.`,
    });
  }

  if (score < 50) {
    items.push({
      priority: 'P1',
      title: 'Niska rozpoznawalność w odpowiedziach AI',
      description:
        'Zbuduj bazę cytowalnych stron: definicje usług, case studies z liczbami, sekcję FAQ i artykuły odpowiadające na pytania porównawcze klientów.',
    });
  }

  if (items.length === 0) {
    items.push({
      priority: 'P2',
      title: 'Marka ma dobry punkt startowy',
      description:
        'Kolejny krok to monitoring cykliczny: te same prompty co 2-4 tygodnie, porównanie zmian sentymentu i udziału konkurentów.',
    });
  }

  return items.slice(0, 5);
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  let body: BrandCheckRequest;
  try {
    body = await context.request.json<BrandCheckRequest>();
  } catch {
    return jsonError(400, 'Invalid JSON body');
  }

  const apiKey = (context.env.OPENROUTER_API_KEY || '').trim();
  if (!apiKey) {
    return jsonResponse(
      {
        brand: normalizeBrand(body.brand || ''),
        market: normalizeLoose(body.market, 80) || 'Polska',
        fetchedAt: new Date().toISOString(),
        status: 'config-error',
        profile: { status: 'missing', headings: [] },
        summary: {
          score: 0,
          knownBy: 0,
          totalModels: MODEL_PROVIDERS.length,
          averageConfidence: 0,
          sentiment: 'unknown',
          hallucinations: 0,
          competitors: [],
          ownDomainCitedBy: 0,
        },
        models: [],
        actionItems: [
          {
            priority: 'P0',
            title: 'Brak OPENROUTER_API_KEY',
            description:
              'Dodaj OPENROUTER_API_KEY w środowisku Cloudflare Pages dla Production i Preview.',
          },
        ],
      },
      500
    );
  }

  const brand = normalizeBrand(body.brand || '');
  if (!brand || brand.length < 2) {
    return jsonError(400, 'Podaj nazwę marki.');
  }

  const ip = context.request.headers.get('CF-Connecting-IP') || 'unknown';
  const limit = resolveLimit(context.env.BRAND_CHECK_DAILY_LIMIT, BRAND_CHECK_DEFAULT_LIMIT);
  const gate = await checkToolLimit(context.env.FANOUT_RL, 'brand-check', ip, limit, new Date());
  if (!gate.allowed) {
    return jsonError(429, `Wykorzystałeś dzienny limit (${limit} sprawdzeń). Reset o północy.`, {
      remaining: 0,
      limit,
      resetAt: gate.resetAt,
    });
  }

  const domain = normalizeLoose(body.domain, 200);
  const category = normalizeLoose(body.category, 120);
  const market = normalizeLoose(body.market, 80) || 'Polska';
  const ownDomain = getHost(domain);
  const profile = await fetchBrandProfile(domain);
  const prompt = buildPrompt({ brand, domain, category, market, profile });

  const modelResponses = await Promise.all(
    MODEL_PROVIDERS.map(async (provider) => {
      try {
        return await callOpenRouter(provider, apiKey, prompt, ownDomain);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Nieznany błąd modelu.';
        return FALLBACK_RESULT(provider, message.slice(0, 320));
      }
    })
  );

  await gate.commit();
  return jsonResponse(aggregate(brand, domain, category, market, profile, modelResponses));
};

export const onRequestGet: PagesFunction = async () => {
  return jsonError(405, 'Use POST with { "brand": "Nazwa marki", "domain": "example.com" }');
};

function jsonHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-store',
  };
}

function jsonResponse(body: BrandCheckResponse, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: jsonHeaders(),
  });
}

function jsonError(status: number, message: string, extra: Record<string, unknown> = {}): Response {
  return new Response(JSON.stringify({ error: message, ...extra }), {
    status,
    headers: jsonHeaders(),
  });
}
