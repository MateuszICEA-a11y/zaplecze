/**
 * Fan-out Check – pokazuje fan-out queries ChatGPT i cytowane domeny.
 *
 * Endpoint: POST /api/tools/fanout   Body: { query: string }
 * Wymaga: env OPENAI_API_KEY, binding KV FANOUT_RL.
 * Opcjonalne env: FANOUT_MODEL (domyślnie gpt-5.4), FANOUT_DAILY_LIMIT (0 = bez limitu).
 */
import { parseResponsesOutput } from '../../_lib/fanout-parse';
import { evaluateLimit, secondsUntilWarsawMidnight } from '../../_lib/rate-limit';

type Env = {
  OPENAI_API_KEY?: string;
  FANOUT_MODEL?: string;
  FANOUT_DAILY_LIMIT?: string;
  FANOUT_RL?: KVNamespace;
};

type FanoutRequest = { query?: string };
type LimitRecord = { count: number; resetAt: number };

const OPENAI_URL = 'https://api.openai.com/v1/responses';
const DEFAULT_MODEL = 'gpt-5.4';
const DEFAULT_LIMIT = 0;
const LLM_TIMEOUT_MS = 45_000;
const MIN_QUERY = 3;
const MAX_QUERY = 300;
const FANOUT_INSTRUCTIONS = [
  'Jesteś silnikiem analitycznym narzędzia SEO/GEO. Twoim zadaniem jest wykonać wyszukiwanie w sieci dla podanej frazy i zwrócić krótką odpowiedź opartą o znalezione źródła.',
  'Nie zadawaj pytań doprecyzowujących. Jeśli brakuje kontekstu, przyjmij najpopularniejszy kontekst dla polskiego użytkownika i jasno zaznacz założenie w odpowiedzi.',
  'Dla fraz rankingowych, porównawczych i komercyjnych wykonaj wyszukiwanie. Uwzględnij aktualność, rankingi, opinie, ceny, porównania i wiarygodne źródła.',
  'Odpowiedz po polsku, zwięźle, maksymalnie w 6 zdaniach.',
].join('\n');

function jsonHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  };
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders() });
}

function jsonError(status: number, message: string, extra: Record<string, unknown> = {}): Response {
  return json({ error: message, ...extra }, status);
}

export const onRequestGet: PagesFunction = async () =>
  new Response(JSON.stringify({ error: 'Użyj POST z { "query": "twoje zapytanie" }' }), {
    status: 405,
    headers: { ...jsonHeaders(), Allow: 'POST' },
  });

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // 1. Walidacja wejścia
  let body: FanoutRequest;
  try {
    body = await request.json<FanoutRequest>();
  } catch {
    return jsonError(400, 'Nieprawidłowe body JSON.');
  }
  const query = String(body.query || '').replace(/\s+/g, ' ').trim();
  if (query.length < MIN_QUERY) return jsonError(400, 'Podaj zapytanie (min. 3 znaki).');
  if (query.length > MAX_QUERY) return jsonError(400, 'Zapytanie jest zbyt długie (max 300 znaków).');

  // 2. Konfiguracja
  const apiKey = (env.OPENAI_API_KEY || '').trim();
  if (!apiKey) {
    return json(
      {
        status: 'config-error',
        error: 'Narzędzie jest chwilowo niedostępne (brak konfiguracji OPENAI_API_KEY).',
      },
      500
    );
  }
  const model = (env.FANOUT_MODEL || DEFAULT_MODEL).trim();
  const configuredLimit = Number.parseInt(env.FANOUT_DAILY_LIMIT || '', 10);
  const limit = Number.isFinite(configuredLimit) && configuredLimit > 0 ? configuredLimit : DEFAULT_LIMIT;
  const rateLimitEnabled = limit > 0;

  // 3. Rate-limit (odczyt) — wymaga bindingu KV
  const kv = env.FANOUT_RL;
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const kvKey = `fanout:${ip}`;
  const now = new Date();
  const ttl = secondsUntilWarsawMidnight(now);

  let record: LimitRecord = { count: 0, resetAt: now.getTime() + ttl * 1000 };
  if (rateLimitEnabled && kv) {
    const stored = await kv.get<LimitRecord>(kvKey, 'json');
    if (stored && typeof stored.count === 'number' && typeof stored.resetAt === 'number') {
      record = stored;
    }
  }
  // Jeden, spójny resetAt (z zapisanego okna) używany i w 429, i w 200.
  const resetAt = new Date(record.resetAt).toISOString();

  const decision = rateLimitEnabled
    ? evaluateLimit(record.count, limit)
    : { allowed: true, remaining: null };
  if (rateLimitEnabled && !decision.allowed) {
    return jsonError(429, `Wykorzystałeś dzienny limit (${limit} zapytań). Reset o północy.`, {
      remaining: 0,
      limit,
      resetAt,
    });
  }

  // 4. Wywołanie OpenAI Responses API
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort('llm-timeout'), LLM_TIMEOUT_MS);
  let openaiResponse: Response;
  try {
    openaiResponse = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        tools: [{ type: 'web_search' }],
        tool_choice: 'auto',
        instructions: FANOUT_INSTRUCTIONS,
        input: query,
      }),
    });
  } catch (error) {
    clearTimeout(timeout);
    const aborted =
      error instanceof DOMException && error.name === 'AbortError'
      || error instanceof Error && /abort|timeout|timed out/i.test(error.message);
    return jsonError(
      500,
      aborted ? 'Przekroczono czas odpowiedzi. Spróbuj ponownie.' : 'Nie udało się połączyć z OpenAI. Spróbuj ponownie.'
    );
  }
  clearTimeout(timeout);

  if (!openaiResponse.ok) {
    // Nie przekazujemy surowego ciała błędu OpenAI do klienta (info-leak).
    return jsonError(500, `Błąd OpenAI (HTTP ${openaiResponse.status}). Spróbuj ponownie.`);
  }

  const raw = await openaiResponse.json().catch(() => null);
  const parsed = parseResponsesOutput(raw);

  // 5. Inkrement limitu DOPIERO po udanej odpowiedzi
  if (rateLimitEnabled && kv) {
    const newCount = Math.max(0, record.count) + 1;
    await kv.put(kvKey, JSON.stringify({ count: newCount, resetAt: record.resetAt }), {
      expirationTtl: Math.max(60, Math.ceil((record.resetAt - now.getTime()) / 1000)),
    });
  }

  // 6. Odpowiedź
  return json({
    query,
    model: (raw && typeof raw === 'object' && 'model' in raw ? (raw as { model?: string }).model : model) || model,
    status: parsed.searched ? 'ok' : 'no-search',
    answer: parsed.answer,
    fanoutQueries: parsed.fanoutQueries,
    citedDomains: parsed.citedDomains,
    searchedDomains: parsed.searchedDomains,
    searchedSources: parsed.searchedSources,
    citations: parsed.citations,
    usage: { remaining: decision.remaining, limit, resetAt },
    fetchedAt: now.toISOString(),
  });
};
