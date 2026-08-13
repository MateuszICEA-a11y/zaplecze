/**
 * Token Senuto wklejany ręcznie na stronie /system/ – trzymany w KV
 * DASHBOARD_IMPORTS pod kluczem `senuto-token`.
 *
 * Po co: JWT Senuto żyje ~31 dni, a GitHub Secrets nie da się podmienić
 * z poziomu aplikacji. Token z KV wygrywa więc z sekretem Workera
 * (SENUTO_API_KEY zostaje fallbackiem), a collector i pipeline pobierają
 * go GET-em /api/senuto-token podpisanym HMAC jak callbacki CW – rotacja
 * sprowadza się do wklejenia tokenu w przeglądarce.
 */

const KV_KEY = 'senuto-token';

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

export async function readSenutoRecord(env) {
  if (!env.DASHBOARD_IMPORTS) return null;
  try {
    return await env.DASHBOARD_IMPORTS.get(KV_KEY, { type: 'json' });
  } catch {
    return null;
  }
}

/** Token do użycia: najpierw KV (wklejony ręcznie), potem sekret Workera. */
export async function getSenutoToken(env) {
  const record = await readSenutoRecord(env);
  const fromKv = typeof record?.token === 'string' ? record.token.trim() : '';
  return fromKv || (env.SENUTO_API_KEY || '').trim();
}

/**
 * Walidacja i zapis wklejonego tokenu. Zwraca `{ ok, error?, record? }` –
 * decyzję o kodzie HTTP zostawia routerowi.
 */
export async function saveSenutoToken(env, rawToken, now = Date.now()) {
  if (!env.DASHBOARD_IMPORTS) {
    return { ok: false, error: 'Brak bindingu DASHBOARD_IMPORTS w konfiguracji Workera.' };
  }
  // Tolerujemy kopiuj-wklej z otoczką: cudzysłowy, prefiks "Bearer", białe znaki.
  const token = String(rawToken ?? '').trim().replace(/^Bearer\s+/i, '').replace(/^["']|["']$/g, '').trim();
  if (!token) return { ok: false, error: 'Wklej token JWT z Senuto.' };
  const expiresAt = jwtExpiry(token);
  if (!expiresAt) return { ok: false, error: 'To nie wygląda na token JWT (brak części payload z polem exp).' };
  if (expiresAt.getTime() <= now) {
    return { ok: false, error: `Ten token już wygasł (${expiresAt.toLocaleDateString('pl-PL')}).` };
  }
  const record = {
    token,
    expires_at: expiresAt.toISOString(),
    saved_at: new Date(now).toISOString(),
  };
  await env.DASHBOARD_IMPORTS.put(KV_KEY, JSON.stringify(record));
  return { ok: true, record: { expires_at: record.expires_at, saved_at: record.saved_at } };
}
