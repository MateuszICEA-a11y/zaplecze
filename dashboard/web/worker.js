/**
 * Worker podglądu nowego frontu (Next.js, statyczny eksport w out/).
 * Tylko Basic Auth + pliki – API (/api/*) zostaje w obecnym workerze
 * `zaplecze-dashboard`, dopóki front nie przejdzie tam w całości.
 *
 * Hasło: sekret DASH_PASSWORD, to samo co w obecnym dashboardzie
 * (`npx wrangler secret put DASH_PASSWORD`). Brak sekretu = 503 (fail-closed).
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

/** Porównanie w stałym czasie (skróty SHA-256 mają równą długość). */
async function samePassword(given, expected) {
  const enc = new TextEncoder();
  const [a, b] = await Promise.all([
    crypto.subtle.digest('SHA-256', enc.encode(given)),
    crypto.subtle.digest('SHA-256', enc.encode(expected)),
  ]);
  const x = new Uint8Array(a);
  const y = new Uint8Array(b);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

export default {
  async fetch(request, env) {
    if (!env.DASH_PASSWORD) {
      return new Response('Brak sekretu DASH_PASSWORD – ustaw go w Workers → Settings → Variables and Secrets.', {
        status: 503,
      });
    }
    const header = request.headers.get('Authorization') ?? '';
    if (!header.startsWith('Basic ')) return unauthorized();
    let password = '';
    try {
      const decoded = atob(header.slice(6));
      password = decoded.slice(decoded.indexOf(':') + 1);
    } catch {
      return unauthorized();
    }
    if (!(await samePassword(password, env.DASH_PASSWORD))) return unauthorized();
    return env.ASSETS.fetch(request);
  },
};
