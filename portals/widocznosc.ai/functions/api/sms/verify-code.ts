/**
 * Weryfikuje kod SMS względem challenge w KV i oznacza go jako potwierdzony.
 *
 * Endpoint: POST /api/sms/verify-code
 * Body: { challengeId, code }
 * Zwraca: { ok:true } | { error, reason }
 * Wymaga env: OTP_SALT; reużywa KV FANOUT_RL (klucz otp:<challengeId>).
 */
import { verifyChallenge } from '../../_lib/otp';

type Env = { OTP_SALT?: string; FANOUT_RL?: KVNamespace };

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

export const onRequestGet: PagesFunction = async () =>
  new Response(JSON.stringify({ error: 'Użyj POST z { challengeId, code }.' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json; charset=utf-8', Allow: 'POST' },
  });

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  let body: { challengeId?: string; code?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Nieprawidłowe body JSON.' }, 400);
  }

  const challengeId = String(body.challengeId ?? '').trim();
  const code = String(body.code ?? '').trim();
  if (!challengeId || !/^\d{6}$/.test(code)) {
    return json({ error: 'Podaj 6-cyfrowy kod z SMS-a.', reason: 'bad-input' }, 400);
  }

  const salt = (env.OTP_SALT || '').trim();
  const kv = env.FANOUT_RL;
  if (!salt || !kv) return json({ status: 'config-error', error: 'Weryfikacja chwilowo niedostępna.' }, 500);

  const res = await verifyChallenge(kv, challengeId, code, salt, new Date());
  if (res.ok) return json({ ok: true });

  const msg: Record<string, string> = {
    'not-found': 'Sesja weryfikacji wygasła. Wyślij kod ponownie.',
    expired: 'Kod wygasł. Wyślij nowy kod.',
    'too-many-attempts': 'Za dużo prób. Wyślij nowy kod.',
    'bad-code': 'Nieprawidłowy kod. Spróbuj ponownie.',
  };
  return json({ error: msg[res.reason ?? 'bad-code'] ?? 'Nieprawidłowy kod.', reason: res.reason }, 400);
};
