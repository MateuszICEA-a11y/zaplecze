/**
 * URL Check – AI SEO Alignment Score 0-100 dla pojedynczego URL.
 *
 * Endpoint: POST /api/tools/url-check
 * Body: { url: "https://example.com/blog/post" }
 *
 * Response: pełny score z breakdown 8 czynników + 5 priorytetowych zmian.
 *
 * Pages Function – deployowane razem z Astro przez Cloudflare Pages.
 */

import { analyzeContent, buildActionItems, type FullScore, type ActionItem } from '../../_lib/url-check';

type CheckRequest = {
  url?: string;
};

type CheckResponse = {
  url: string;
  finalUrl: string;
  fetchedAt: string;
  status: 'ok' | 'fetch-error' | 'cloudflare-blocked' | 'not-html' | 'too-small';
  statusCode?: number;
  htmlBytes?: number;
  score: FullScore;
  actionItems: ActionItem[];
};

const FETCH_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36';

const MAX_HTML_BYTES = 2_500_000; // 2.5MB – większe ścinamy

function normalizeUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  let urlString = trimmed;
  if (!/^https?:\/\//.test(urlString)) {
    urlString = `https://${urlString}`;
  }

  try {
    const url = new URL(urlString);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url.toString();
  } catch {
    return null;
  }
}

async function fetchHtml(url: string): Promise<{
  html: string;
  finalUrl: string;
  status: number;
  contentType: string;
  cloudflareBlocked: boolean;
}> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': FETCH_USER_AGENT,
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'pl-PL,pl;q=0.9,en;q=0.8',
    },
    redirect: 'follow',
    cf: { cacheTtl: 300, cacheEverything: false },
  });

  const contentType = response.headers.get('content-type') || '';
  const finalUrl = response.url || url;

  // Read maksymalnie 2.5MB – chronimy worker przed dużymi stronami
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
        html += decoder.decode(value, { stream: true });
        await reader.cancel();
        break;
      }
      html += decoder.decode(value, { stream: true });
    }
    html += decoder.decode();
  } else {
    html = await response.text();
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
  };
}

export const onRequestPost: PagesFunction = async (context) => {
  let body: CheckRequest;
  try {
    body = await context.request.json<CheckRequest>();
  } catch {
    return jsonError(400, 'Invalid JSON body');
  }

  const url = normalizeUrl(body.url || '');
  if (!url) {
    return jsonError(400, 'Podaj poprawny URL (http/https).');
  }

  const fetchedAt = new Date().toISOString();
  let result: Awaited<ReturnType<typeof fetchHtml>>;

  try {
    result = await fetchHtml(url);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown fetch error';
    return jsonError(502, `Nie udało się pobrać strony: ${message}`);
  }

  const { html, finalUrl, status, contentType, cloudflareBlocked } = result;

  // Cloudflare WAF blok
  if (cloudflareBlocked) {
    return jsonResponse(buildErrorResponse(url, finalUrl, fetchedAt, 'cloudflare-blocked', status, html.length, 'Cloudflare WAF zablokował dostęp – sprawdź czy strona nie wymaga JavaScript challenge.'));
  }

  // Status nie-200
  if (status >= 400) {
    return jsonResponse(buildErrorResponse(url, finalUrl, fetchedAt, 'fetch-error', status, html.length, `Strona zwróciła HTTP ${status}.`));
  }

  // Nie-HTML content type
  if (!/text\/html|application\/xhtml/i.test(contentType)) {
    return jsonResponse(buildErrorResponse(url, finalUrl, fetchedAt, 'not-html', status, html.length, `Content-Type: "${contentType}" – analizujemy tylko strony HTML.`));
  }

  // Za mało HTML do analizy
  if (html.length < 1000) {
    return jsonResponse(buildErrorResponse(url, finalUrl, fetchedAt, 'too-small', status, html.length, `Strona ma tylko ${html.length} bajtów – pewnie SPA bez SSR. Sprawdź czy content jest renderowany server-side.`));
  }

  const score = analyzeContent(html);
  const actionItems = buildActionItems(score.factors);

  const response: CheckResponse = {
    url,
    finalUrl,
    fetchedAt,
    status: 'ok',
    statusCode: status,
    htmlBytes: html.length,
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

function jsonError(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: jsonHeaders(),
  });
}
