/**
 * Stan usług researchu: token Senuto i zużycie SerpData.
 *
 * Dlaczego nie collector: obie liczby żyją w Workerze, nie w snapshotach.
 * - Senuto: klucz to JWT z terminem ważności (~31 dni). Datę czytamy z samego
 *   tokenu, więc sprawdzenie nie kosztuje ani jednego wywołania API. Wygasły
 *   token objawia się myląco – `countries` dalej działa, a dane lecą w 404.
 * - SerpData: saldo pakietu z `/v1/api-key/balance` (`{limit, left}`).
 */

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

/** Termin ważności JWT bez weryfikacji podpisu – interesuje nas samo `exp`. */
export function jwtExpiry(token) {
  const parts = String(token ?? '').split('.');
  if (parts.length !== 3) return null;
  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.exp === 'number' ? new Date(payload.exp * 1000) : null;
  } catch {
    return null;
  }
}

export function senutoStatus(token, now = Date.now()) {
  const expiresAt = jwtExpiry(token);
  if (!token) return { configured: false, status: 'off', days_left: null, expires_at: null };
  if (!expiresAt) return { configured: true, status: 'unknown', days_left: null, expires_at: null };
  const daysLeft = Math.floor((expiresAt.getTime() - now) / 86_400_000);
  return {
    configured: true,
    // Rotacja tokenu to ręczna robota, więc ostrzegamy z tygodniowym wyprzedzeniem.
    status: daysLeft < 0 ? 'err' : daysLeft <= 7 ? 'warn' : 'ok',
    days_left: daysLeft,
    expires_at: expiresAt.toISOString(),
  };
}

const SERPDATA_BALANCE = 'https://api.serpdata.io/v1/api-key/balance';
// Bez własnego User-Agenta WAF SerpData odbija żądanie z 403.
const USER_AGENT = 'ICEA-ContentWatcher/1.0';

/**
 * Saldo SerpData prosto z API: `{limit, left}` – `left` przychodzi jako
 * łańcuch („8349.00"), więc trzeba go sparsować.
 */
export async function serpdataUsage(env, now = Date.now(), fetchImpl = fetch) {
  if (!env.SERPDATA_API_KEY) return { configured: false, status: 'off', left: null, limit: null, used: null };
  try {
    const response = await fetchImpl(SERPDATA_BALANCE, {
      headers: { Authorization: `Bearer ${env.SERPDATA_API_KEY}`, Accept: 'application/json', 'User-Agent': USER_AGENT },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const left = Number.parseFloat(data.left);
    const limit = Number.parseFloat(data.limit);
    if (!Number.isFinite(left)) throw new Error('brak pola „left" w odpowiedzi');
    const pct = Number.isFinite(limit) && limit > 0 ? left / limit : null;
    return {
      configured: true,
      left,
      limit: Number.isFinite(limit) ? limit : null,
      used: Number.isFinite(limit) ? limit - left : null,
      // Alarm przy 5% pakietu, ostrzeżenie przy 15% – zapytań schodzi
      // kilka na wpis, więc niżej kończą się w kilka dni.
      status: left <= 0 ? 'err' : pct !== null && pct <= 0.05 ? 'err' : pct !== null && pct <= 0.15 ? 'warn' : 'ok',
    };
  } catch (error) {
    return {
      configured: true,
      status: 'unknown',
      left: null,
      limit: null,
      used: null,
      error: error instanceof Error ? error.message : 'Nie udało się odczytać salda.',
    };
  }
}

/** GET /api/cw/usage – kafelki „Salda usług" na stronie systemowej. */
export async function handleUsage(request, env, now = Date.now(), fetchImpl = fetch) {
  if (request.method !== 'GET') return json({ error: 'Dozwolona metoda: GET.' }, 405);
  return json({
    senuto: senutoStatus(env.SENUTO_API_KEY, now),
    serpdata: await serpdataUsage(env, now, fetchImpl),
    checked_at: new Date(now).toISOString(),
  });
}
