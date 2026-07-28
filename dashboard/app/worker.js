import { parseBingAiCsv } from './bing-import.js';
import { routeContentWatcher } from './cw-api.js';

/**
 * Worker dashboardu: cała aplikacja za Basic Auth (dashboard zawiera dane
 * leadów i wyniki klientów – nic nie jest publiczne).
 *
 * Hasło: sekret DASH_PASSWORD (Workers → zaplecze-dashboard → Settings → Variables
 * and Secrets). Brak sekretu = 503 z instrukcją (fail-closed). Login jest dowolny
 * (sprawdzane tylko hasło).
 */
function unauthorized() {
  return new Response('Podaj hasło do dashboardu zaplecza.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="zaplecze-dashboard", charset="UTF-8"',
      'Cache-Control': 'no-store',
    },
  });
}

function passwordFromHeader(header) {
  if (!header?.startsWith('Basic ')) return null;
  try {
    const decoded = atob(header.slice(6));
    return decoded.slice(decoded.indexOf(':') + 1);
  } catch {
    return null;
  }
}

const json = (value, status = 200) =>
  new Response(JSON.stringify(value), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });

async function bingImport(request, env, domain) {
  if (!env.DASHBOARD_IMPORTS) {
    return json({ error: 'Brak bindingu DASHBOARD_IMPORTS w konfiguracji Workera.' }, 503);
  }
  const key = `bing-ai:${domain}`;
  if (request.method === 'GET') {
    const data = await env.DASHBOARD_IMPORTS.get(key, { type: 'json' });
    return data ? json({ data }) : json({ data: null }, 404);
  }
  if (request.method !== 'POST') {
    return json({ error: 'Dozwolone metody: GET, POST.' }, 405);
  }

  const contentType = request.headers.get('Content-Type') || '';
  let filename = 'bing-ai-performance.csv';
  let text = '';
  if (contentType.includes('multipart/form-data')) {
    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) return json({ error: 'Wybierz plik CSV.' }, 400);
    if (file.size > 5 * 1024 * 1024) return json({ error: 'Plik jest większy niż 5 MB.' }, 413);
    filename = file.name;
    text = await file.text();
  } else {
    const length = Number.parseInt(request.headers.get('Content-Length') || '0', 10);
    if (length > 5 * 1024 * 1024) return json({ error: 'Plik jest większy niż 5 MB.' }, 413);
    filename = request.headers.get('X-Filename') || filename;
    text = await request.text();
  }

  try {
    const data = { ...parseBingAiCsv(text, filename), domain };
    if (data.rows.length > 10_000) {
      return json({ error: 'Eksport zawiera ponad 10 000 wierszy.' }, 413);
    }
    await env.DASHBOARD_IMPORTS.put(key, JSON.stringify(data));
    return json({ data, message: `Zaimportowano ${data.rows.length} zapytań.` });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Nie udało się odczytać CSV.' }, 400);
  }
}

export default {
  async fetch(request, env) {
    // Callback pipeline'u idzie PRZED bramką hasła: runner GitHub Actions nie
    // może podać hasła dashboardu i własnego tokenu na jednym nagłówku
    // Authorization. Uwierzytelnia go podpis HMAC ciała żądania.
    const beforeAuth = await routeContentWatcher(request, env, { beforeAuth: true });
    if (beforeAuth) return beforeAuth;

    const expected = (env.DASH_PASSWORD || '').trim();
    if (!expected) {
      return new Response(
        'Dashboard wymaga sekretu DASH_PASSWORD (Workers → Settings → Variables and Secrets).',
        { status: 503, headers: { 'Cache-Control': 'no-store' } },
      );
    }
    const given = passwordFromHeader(request.headers.get('Authorization'));
    if (given !== expected) return unauthorized();
    const url = new URL(request.url);
    const contentWatcher = await routeContentWatcher(request, env);
    if (contentWatcher) return contentWatcher;

    const importMatch = url.pathname.match(/^\/api\/imports\/bing-ai\/([^/]+)\/?$/);
    if (importMatch) {
      const domain = decodeURIComponent(importMatch[1]);
      if (!/^[a-z0-9.-]{1,253}$/i.test(domain)) {
        return json({ error: 'Nieprawidłowa domena.' }, 400);
      }
      return bingImport(request, env, domain);
    }
    const response = await env.ASSETS.fetch(request);
    const guarded = new Response(response.body, response);
    guarded.headers.set('X-Robots-Tag', 'noindex');
    return guarded;
  },
};
