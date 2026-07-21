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

export default {
  async fetch(request, env) {
    const expected = (env.DASH_PASSWORD || '').trim();
    if (!expected) {
      return new Response(
        'Dashboard wymaga sekretu DASH_PASSWORD (Workers → Settings → Variables and Secrets).',
        { status: 503, headers: { 'Cache-Control': 'no-store' } },
      );
    }
    const given = passwordFromHeader(request.headers.get('Authorization'));
    if (given !== expected) return unauthorized();
    const response = await env.ASSETS.fetch(request);
    const guarded = new Response(response.body, response);
    guarded.headers.set('X-Robots-Tag', 'noindex');
    return guarded;
  },
};
