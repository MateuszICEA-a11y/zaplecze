/**
 * URL Check – AI SEO Alignment Score 0-100 dla pojedynczego URL.
 *
 * Endpoint: POST /api/tools/url-check
 * Body: { url: "https://example.com/blog/post" }
 *
 * Wymaga env var OPENROUTER_API_KEY (Cloudflare Pages → Settings →
 * Environment variables, Production + Preview).
 *
 * Pages Function – deployowane razem z Astro przez Cloudflare Pages.
 */

import {
  analyzeContentHybrid,
  buildActionItems,
  ANALYSIS_MODEL,
  type FullScore,
  type ActionItem,
} from '../../_lib/url-check';
import { resolveLimit, checkToolLimit } from '../../_lib/tool-rate-limit';
import { logEvent } from '../../_lib/lead-log';

type CheckRequest = {
  url?: string;
};

type CheckResponse = {
  url: string;
  finalUrl: string;
  fetchedAt: string;
  status:
    | 'ok'
    | 'fetch-error'
    | 'cloudflare-blocked'
    | 'not-html'
    | 'too-small'
    | 'too-large'
    | 'llm-error'
    | 'config-error';
  statusCode?: number;
  htmlBytes?: number;
  score: FullScore;
  actionItems: ActionItem[];
};

const FETCH_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36';

const MAX_HTML_BYTES = 2_500_000;
const FETCH_TIMEOUT_MS = 15_000;

function normalizeUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed || trimmed.length > 2048) return null;

  let urlString = trimmed;
  if (!/^https?:\/\//.test(urlString)) {
    urlString = `https://${urlString}`;
  }

  try {
    const url = new URL(urlString);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    if (url.username || url.password) return null;
    if (isBlockedHostname(url.hostname)) return null;
    url.hash = '';
    return url.toString();
  } catch {
    return null;
  }
}

function isBlockedHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, '');
  if (!host) return true;
  if (
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    host.endsWith('.internal')
  ) {
    return true;
  }

  if (host.includes(':')) {
    // Nie obsługujemy literalnych IPv6 w tym publicznym narzędziu; to zamyka ::1, link-local i ULA.
    return true;
  }

  const parts = host.split('.');
  if (parts.length === 4 && parts.every((part) => /^\d+$/.test(part))) {
    const octets = parts.map(Number);
    if (octets.some((part) => part < 0 || part > 255)) return true;
    const [a, b, c] = octets;
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 192 && b === 0 && c === 0) ||
      (a === 192 && b === 0 && c === 2) ||
      (a === 198 && (b === 18 || b === 19)) ||
      (a === 198 && b === 51 && c === 100) ||
      (a === 203 && b === 0 && c === 113) ||
      a >= 224
    );
  }

  return false;
}

async function fetchHtml(url: string): Promise<{
  html: string;
  finalUrl: string;
  status: number;
  contentType: string;
  cloudflareBlocked: boolean;
  truncated: boolean;
  totalBytes: number;
}> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort('fetch-timeout'), FETCH_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        'User-Agent': FETCH_USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pl-PL,pl;q=0.9,en;q=0.8',
      },
      redirect: 'follow',
      signal: controller.signal,
      cf: { cacheTtl: 300, cacheEverything: false },
    });

    const contentType = response.headers.get('content-type') || '';
    const finalUrl = response.url || url;

    const reader = response.body?.getReader();
    let html = '';
    let totalBytes = 0;
    if (reader) {
      const decoder = new TextDecoder('utf-8');
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        totalBytes += value.length;
        if (totalBytes > MAX_HTML_BYTES) {
          await reader.cancel();
          break;
        }
        html += decoder.decode(value, { stream: true });
      }
      html += decoder.decode();
    } else {
      html = await response.text();
      totalBytes = new TextEncoder().encode(html).length;
    }

    const cloudflareBlocked =
      response.status === 403 &&
      (html.includes('Cloudflare') ||
        html.includes('cf-error') ||
        html.includes('cloudflare-static') ||
        response.headers.get('cf-mitigated') === 'challenge');

    return {
      html,
      finalUrl,
      status: response.status,
      contentType,
      cloudflareBlocked,
      truncated: totalBytes > MAX_HTML_BYTES,
      totalBytes,
    };
  } finally {
    clearTimeout(timeout);
  }
}

type Env = {
  OPENROUTER_API_KEY?: string;
  URL_CHECK_DAILY_LIMIT?: string;
  FANOUT_RL?: KVNamespace;
};

const URL_CHECK_DEFAULT_LIMIT = 10;

export const onRequestPost: PagesFunction<Env> = async (context) => {
  let body: CheckRequest;
  try {
    body = await context.request.json<CheckRequest>();
  } catch {
    return jsonError(400, 'Invalid JSON body');
  }

  const apiKey = (context.env.OPENROUTER_API_KEY || '').trim();
  if (!apiKey) {
    return jsonResponse(
      buildErrorResponse(
        body.url || '',
        body.url || '',
        new Date().toISOString(),
        'config-error',
        500,
        0,
        'Brak OPENROUTER_API_KEY w środowisku Cloudflare Pages. Skontaktuj się z administratorem.'
      )
    );
  }

  const url = normalizeUrl(body.url || '');
  if (!url) {
    return jsonError(400, 'Podaj poprawny publiczny URL (http/https).');
  }

  const ip = context.request.headers.get('CF-Connecting-IP') || 'unknown';
  const limit = resolveLimit(context.env.URL_CHECK_DAILY_LIMIT, URL_CHECK_DEFAULT_LIMIT);
  const gate = await checkToolLimit(context.env.FANOUT_RL, 'url-check', ip, limit, new Date());
  if (!gate.allowed) {
    return jsonError(429, `Wykorzystałeś dzienny limit (${limit} sprawdzeń). Reset o północy.`, {
      remaining: 0,
      limit,
      resetAt: gate.resetAt,
    });
  }

  // Log użycia narzędzia (dashboard zaplecza) – best-effort.
  context.waitUntil(logEvent(context.env.FANOUT_RL, 'usage', 'url-check', { url }));

  const fetchedAt = new Date().toISOString();
  let result: Awaited<ReturnType<typeof fetchHtml>>;

  try {
    result = await fetchHtml(url);
  } catch (error) {
    const message =
      error instanceof DOMException && error.name === 'AbortError'
        ? 'Przekroczono limit czasu pobierania strony.'
        : error instanceof Error
          ? error.message
          : 'Unknown fetch error';
    return jsonError(502, `Nie udało się pobrać strony: ${message}`);
  }

  const { html, finalUrl, status, contentType, cloudflareBlocked, truncated, totalBytes } = result;

  if (cloudflareBlocked) {
    return jsonResponse(
      buildErrorResponse(
        url,
        finalUrl,
        fetchedAt,
        'cloudflare-blocked',
        status,
        totalBytes,
        'Cloudflare WAF zablokował dostęp – sprawdź czy strona nie wymaga JavaScript challenge.'
      )
    );
  }

  if (status >= 400) {
    return jsonResponse(
      buildErrorResponse(
        url,
        finalUrl,
        fetchedAt,
        'fetch-error',
        status,
        totalBytes,
        `Strona zwróciła HTTP ${status}.`
      )
    );
  }

  if (truncated) {
    return jsonResponse(
      buildErrorResponse(
        url,
        finalUrl,
        fetchedAt,
        'too-large',
        status,
        totalBytes,
        `HTML strony przekracza limit ${Math.round(MAX_HTML_BYTES / 1_000_000)} MB. Przetestuj lżejszy URL albo ogranicz rozmiar renderowanego HTML.`
      )
    );
  }

  const looksLikeHtml = /<!doctype html|<html[\s>]|<head[\s>]|<body[\s>]/i.test(
    html.slice(0, 4096)
  );
  if (!/text\/html|application\/xhtml/i.test(contentType) && !looksLikeHtml) {
    return jsonResponse(
      buildErrorResponse(
        url,
        finalUrl,
        fetchedAt,
        'not-html',
        status,
        totalBytes,
        `Content-Type: "${contentType || 'brak'}" – analizujemy tylko strony HTML.`
      )
    );
  }

  if (html.length < 1000) {
    return jsonResponse(
      buildErrorResponse(
        url,
        finalUrl,
        fetchedAt,
        'too-small',
        status,
        totalBytes,
        `Strona ma tylko ${html.length} bajtów – pewnie SPA bez SSR. Sprawdź czy content jest renderowany server-side.`
      )
    );
  }

  // LLM analysis (async, ~5-15s)
  let score: FullScore;
  try {
    score = await analyzeContentHybrid(html, url, apiKey);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown LLM error';
    return jsonResponse(
      buildErrorResponse(
        url,
        finalUrl,
        fetchedAt,
        'llm-error',
        status,
        totalBytes,
        `Model nie był w stanie przeanalizować strony: ${message.slice(0, 200)}`
      )
    );
  }

  const actionItems = buildActionItems(score.factors);
  await gate.commit();

  const response: CheckResponse = {
    url,
    finalUrl,
    fetchedAt,
    status: 'ok',
    statusCode: status,
    htmlBytes: totalBytes,
    score,
    actionItems,
  };

  return jsonResponse(response);
};

export const onRequestGet: PagesFunction = async () => {
  return jsonError(405, 'Use POST with { "url": "https://example.com/blog/post" }');
};

function buildErrorResponse(
  url: string,
  finalUrl: string,
  fetchedAt: string,
  status: CheckResponse['status'],
  statusCode: number,
  htmlBytes: number,
  errorMessage: string
): CheckResponse {
  return {
    url,
    finalUrl,
    fetchedAt,
    status,
    statusCode,
    htmlBytes,
    score: {
      total: 0,
      grade: 'F',
      factors: [],
      model: ANALYSIS_MODEL,
    },
    actionItems: [
      {
        priority: 'P0',
        factor: 'schema',
        title: 'Nie udało się przeanalizować strony',
        description: errorMessage,
      },
    ],
  };
}

function jsonHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-store',
  };
}

function jsonResponse(body: CheckResponse): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: jsonHeaders(),
  });
}

function jsonError(status: number, message: string, extra: Record<string, unknown> = {}): Response {
  return new Response(JSON.stringify({ error: message, ...extra }), {
    status,
    headers: jsonHeaders(),
  });
}
