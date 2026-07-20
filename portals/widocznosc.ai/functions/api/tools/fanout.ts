/**
 * Fan-out Check – pokazuje fan-out queries ChatGPT i cytowane domeny.
 *
 * Endpoint: POST /api/tools/fanout   Body: { query: string }
 * Wymaga: env OPENAI_API_KEY, binding KV FANOUT_RL.
 * Opcjonalne env: FANOUT_MODEL (domyślnie gpt-5.4), FANOUT_DAILY_LIMIT (0 = bez limitu).
 */
import { parseResponsesOutput } from '../../_lib/fanout-parse';
import { resolveLimit, checkToolLimit } from '../../_lib/tool-rate-limit';
import { logEvent } from '../../_lib/lead-log';

type Env = {
  OPENAI_API_KEY?: string;
  FANOUT_MODEL?: string;
  FANOUT_DAILY_LIMIT?: string;
  FANOUT_RL?: KVNamespace;
};

type FanoutRequest = { query?: string };

const OPENAI_URL = 'https://api.openai.com/v1/responses';
const DEFAULT_MODEL = 'gpt-5.4';
const DEFAULT_LIMIT = 5;
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
  const limit = resolveLimit(env.FANOUT_DAILY_LIMIT, DEFAULT_LIMIT);

  // 3. Rate-limit (odczyt) — KV współdzielone, klucz tool:fanout:<ip>
  const kv = env.FANOUT_RL;
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const now = new Date();
  const gate = await checkToolLimit(kv, 'fanout', ip, limit, now);
  if (!gate.allowed) {
    return jsonError(429, `Wykorzystałeś dzienny limit (${limit} zapytań). Reset o północy.`, {
      remaining: 0,
      limit,
      resetAt: gate.resetAt,
    });
  }

  // 3b. Log użycia narzędzia (dashboard zaplecza) – best-effort, poza ścieżką krytyczną.
  context.waitUntil(logEvent(kv, 'usage', 'fanout', { query }));

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

  // 5. Zliczenie limitu DOPIERO po udanej odpowiedzi
  await gate.commit();

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
    usage: { remaining: gate.remaining, limit, resetAt: gate.resetAt },
    fetchedAt: now.toISOString(),
  });
};
