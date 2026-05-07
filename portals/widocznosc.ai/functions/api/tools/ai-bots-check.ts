/**
 * AI Bots Check – sprawdza, które z 13 botów AI mają dostęp do strony
 * na podstawie robots.txt.
 *
 * Endpoint: POST /api/tools/ai-bots-check
 * Body: { url: "domena.pl" } | { url: "https://domena.pl" }
 *
 * Response: pełna mapa 13 botów + summary + action items.
 *
 * Pages Function – deployowane razem z Astro przez Cloudflare Pages.
 */

import { AI_BOTS, CATEGORY_LABELS, type BotCategory } from '../../_lib/ai-bots';
import { checkBotAccess } from '../../_lib/robots-parser';

type CheckRequest = {
  url?: string;
};

type BotResult = {
  name: string;
  userAgent: string;
  owner: string;
  category: BotCategory;
  categoryLabel: string;
  purpose: string;
  impact: string;
  critical: boolean;
  allowed: boolean;
  matchedUserAgent: string | null;
};

type ActionItem = {
  priority: 'P0' | 'P1' | 'P2';
  title: string;
  description: string;
};

type CheckResponse = {
  domain: string;
  robotsUrl: string;
  fetchedAt: string;
  status: 'ok' | 'no-robots' | 'fetch-error' | 'cloudflare-blocked';
  statusCode?: number;
  summary: {
    allowed: number;
    blocked: number;
    criticalBlocked: number;
    total: number;
  };
  bots: BotResult[];
  actionItems: ActionItem[];
};

// User-Agent imitujący prawdziwą przeglądarkę – większość WAF nie blokuje
// fetcha robots.txt z takim UA (robots.txt jest publiczny ze swojej natury).
const FETCH_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36';

/**
 * Normalizuje wejście usera (URL lub gołą domenę) do hostname.
 * Akceptuje: "icea.pl", "https://icea.pl", "https://www.icea.pl/blog".
 */
function normalizeDomain(input: string): string | null {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return null;

  let urlString = trimmed;
  if (!/^https?:\/\//.test(urlString)) {
    urlString = `https://${urlString}`;
  }

  try {
    const url = new URL(urlString);
    // Strip leading www. by default? Nie – robots.txt jest per-host.
    // Zostawiamy host taki jaki jest, bo robots.txt może się różnić.
    return url.hostname;
  } catch {
    return null;
  }
}

async function fetchRobotsTxt(domain: string): Promise<{
  text: string;
  finalUrl: string;
  status: number;
  cloudflareBlocked: boolean;
}> {
  const robotsUrl = `https://${domain}/robots.txt`;

  const response = await fetch(robotsUrl, {
    headers: {
      'User-Agent': FETCH_USER_AGENT,
      Accept: 'text/plain, */*;q=0.8',
    },
    redirect: 'follow',
    // Timeout: CF Workers domyślnie 30s subrequest
  });

  const text = await response.text();
  const finalUrl = response.url || robotsUrl;

  // Cloudflare challenge / blok: HTML response z signaturami CF
  const cloudflareBlocked =
    response.status === 403 &&
    (text.includes('Cloudflare') ||
      text.includes('cf-error') ||
      text.includes('cloudflare-static') ||
      response.headers.get('cf-mitigated') === 'challenge');

  return {
    text,
    finalUrl,
    status: response.status,
    cloudflareBlocked,
  };
}

function buildActionItems(bots: BotResult[]): ActionItem[] {
  const items: ActionItem[] = [];
  const blockedCritical = bots.filter((b) => !b.allowed && b.critical);
  const blockedNonCritical = bots.filter((b) => !b.allowed && !b.critical);

  if (blockedCritical.length > 0) {
    const names = blockedCritical.map((b) => b.name).join(', ');
    items.push({
      priority: 'P0',
      title: `Krytyczne boty AI zablokowane: ${names}`,
      description: `Twoja strona NIE TRAFI do trenowania ani cytowań w ${blockedCritical
        .map((b) => b.owner)
        .filter((v, i, arr) => arr.indexOf(v) === i)
        .join(', ')}. Edytuj robots.txt i dodaj sekcje Allow: / dla każdego z user-agentów.`,
    });
  }

  if (blockedNonCritical.length > 0) {
    const names = blockedNonCritical.map((b) => b.name).join(', ');
    items.push({
      priority: 'P1',
      title: `Pomniejsze boty zablokowane: ${names}`,
      description:
        'Te boty nie są krytyczne (on-demand fetch lub niszowe), ale dopuszczenie ich rozszerza widoczność w mniej popularnych ścieżkach AI search.',
    });
  }

  if (items.length === 0) {
    items.push({
      priority: 'P2',
      title: 'Wszystkie 13 botów AI ma dostęp – poprawnie skonfigurowane',
      description:
        'Twoja konfiguracja robots.txt jest otwarta dla całego ekosystemu AI. Następny krok: schema.org (Article, Person, FAQPage) i sprawdzenie, czy strony są SSR (a nie pusty <div id="root">).',
    });
  }

  return items;
}

export const onRequestPost: PagesFunction = async (context) => {
  let body: CheckRequest;
  try {
    body = await context.request.json<CheckRequest>();
  } catch {
    return jsonError(400, 'Invalid JSON body');
  }

  const domain = normalizeDomain(body.url || '');
  if (!domain) {
    return jsonError(400, 'Podaj poprawny URL lub domenę (np. icea.pl)');
  }

  const fetchedAt = new Date().toISOString();
  let robotsResult: Awaited<ReturnType<typeof fetchRobotsTxt>>;

  try {
    robotsResult = await fetchRobotsTxt(domain);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown fetch error';
    return jsonError(502, `Nie udało się pobrać robots.txt: ${message}`);
  }

  const { text: robotsText, finalUrl, status, cloudflareBlocked } = robotsResult;

  // Cloudflare challenge → robots.txt jest zablokowany przez WAF
  if (cloudflareBlocked) {
    const response: CheckResponse = {
      domain,
      robotsUrl: finalUrl,
      fetchedAt,
      status: 'cloudflare-blocked',
      statusCode: status,
      summary: { allowed: 0, blocked: 13, criticalBlocked: 6, total: 13 },
      bots: AI_BOTS.map((bot) => ({
        name: bot.name,
        userAgent: bot.userAgent,
        owner: bot.owner,
        category: bot.category,
        categoryLabel: CATEGORY_LABELS[bot.category],
        purpose: bot.purpose,
        impact: bot.impact,
        critical: bot.critical ?? false,
        allowed: false,
        matchedUserAgent: null,
      })),
      actionItems: [
        {
          priority: 'P0',
          title: 'Cloudflare blokuje dostęp do robots.txt',
          description:
            'WAF Cloudflare zwrócił challenge dla pliku robots.txt. Boty AI też tego nie przejdą. Wyłącz challenge dla ścieżki /robots.txt w Cloudflare Dashboard → Security → WAF → Custom rules. Bez tego nie będziesz cytowany przez ChatGPT, Claude ani Perplexity.',
        },
      ],
    };
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: jsonHeaders(),
    });
  }

  // Status nie-200 → brak robots.txt (404) lub błąd serwera
  if (status >= 400) {
    // Brak robots.txt = wszystkie boty allowed (zgodnie z konwencją)
    const allBots: BotResult[] = AI_BOTS.map((bot) => ({
      name: bot.name,
      userAgent: bot.userAgent,
      owner: bot.owner,
      category: bot.category,
      categoryLabel: CATEGORY_LABELS[bot.category],
      purpose: bot.purpose,
      impact: bot.impact,
      critical: bot.critical ?? false,
      allowed: true,
      matchedUserAgent: null,
    }));

    const response: CheckResponse = {
      domain,
      robotsUrl: finalUrl,
      fetchedAt,
      status: 'no-robots',
      statusCode: status,
      summary: { allowed: 13, blocked: 0, criticalBlocked: 0, total: 13 },
      bots: allBots,
      actionItems: [
        {
          priority: 'P1',
          title: 'Brak pliku robots.txt – wszystkie boty mają dostęp',
          description: `Status HTTP ${status}. W praktyce boty AI dostają wolną drogę, ale ZALECANE jest stworzenie jawnego robots.txt z sekcjami Allow dla każdego user-agenta + sitemap.xml. Bez robots.txt zachowanie crawlerów może się różnić między platformami.`,
        },
      ],
    };
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: jsonHeaders(),
    });
  }

  // Sprawdzamy każdy bot przez parser robots.txt
  const bots: BotResult[] = AI_BOTS.map((bot) => {
    const tokens = [bot.userAgent, ...(bot.aliases ?? [])];
    const access = checkBotAccess(robotsText, tokens, '/');
    return {
      name: bot.name,
      userAgent: bot.userAgent,
      owner: bot.owner,
      category: bot.category,
      categoryLabel: CATEGORY_LABELS[bot.category],
      purpose: bot.purpose,
      impact: bot.impact,
      critical: bot.critical ?? false,
      allowed: access.allowed,
      matchedUserAgent: access.matchedUserAgent,
    };
  });

  const allowed = bots.filter((b) => b.allowed).length;
  const blocked = bots.length - allowed;
  const criticalBlocked = bots.filter((b) => !b.allowed && b.critical).length;

  const response: CheckResponse = {
    domain,
    robotsUrl: finalUrl,
    fetchedAt,
    status: 'ok',
    statusCode: status,
    summary: {
      allowed,
      blocked,
      criticalBlocked,
      total: bots.length,
    },
    bots,
    actionItems: buildActionItems(bots),
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: jsonHeaders(),
  });
};

// Disable GET / preflight – zwracamy 405
export const onRequestGet: PagesFunction = async () => {
  return jsonError(405, 'Use POST with { "url": "domain.pl" }');
};

function jsonHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-store',
  };
}

function jsonError(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: jsonHeaders(),
  });
}
