// functions/api/sms/send-code.ts
/**
 * Wysyła 6-cyfrowy kod SMS i zakłada challenge w KV. Bramka jakości leada dla narzędzi.
 *
 * Endpoint: POST /api/sms/send-code
 * Body: { tool, firstName, lastName, email, phone, consent?, website? }  (website = honeypot)
 * Zwraca: { ok:true, challengeId } | { error, fields? }
 * Wymaga env: SMSAPI_TOKEN, SMSAPI_SENDER, OTP_SALT; reużywa KV FANOUT_RL (prefiksy otp*).
 */
import { normalizePhonePL, isMobilePL } from '../../_lib/phone';
import {
  generateOtpCode, hashOtp, buildChallengeRecord, checkSendAllowed,
  type ChallengeLead, type SendLimits,
} from '../../_lib/otp';
import { sendSms } from '../../_lib/smsapi';
import { resolveLimit } from '../../_lib/tool-rate-limit';
import { logEvent } from '../../_lib/lead-log';

type Env = {
  SMSAPI_TOKEN?: string;
  SMSAPI_SENDER?: string;
  SMSAPI_TEST?: string;
  OTP_SALT?: string;
  SMS_HOURLY_PER_PHONE?: string;
  SMS_SENDCODE_IP_LIMIT?: string;
  SMS_DAILY_GLOBAL_LIMIT?: string;
  FANOUT_RL?: KVNamespace;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CHALLENGE_TTL_MS = 600_000; // 10 min

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}
function jsonError(status: number, message: string, extra: Record<string, unknown> = {}): Response {
  return json({ error: message, ...extra }, status);
}

export const onRequestGet: PagesFunction = async () =>
  new Response(JSON.stringify({ error: 'Użyj POST z danymi leada.' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json; charset=utf-8', Allow: 'POST' },
  });

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, 'Nieprawidłowe body JSON.');
  }

  // Honeypot – bot dostaje fałszywy sukces.
  if (String(body.website ?? '').trim().length > 0) return json({ ok: true, challengeId: 'noop' });

  // Walidacja pól leada.
  const firstName = String(body.firstName ?? '').trim();
  const lastName = String(body.lastName ?? '').trim();
  const email = String(body.email ?? '').trim();
  const phoneRaw = String(body.phone ?? '').trim();
  const tool = String(body.tool ?? '').trim();
  const errors: string[] = [];
  if (firstName.length < 1 || firstName.length > 80) errors.push('firstName');
  if (lastName.length < 1 || lastName.length > 80) errors.push('lastName');
  if (email.length < 1 || email.length > 254 || !EMAIL_RE.test(email)) errors.push('email');
  const norm = normalizePhonePL(phoneRaw);
  if (!norm.ok) errors.push('phone');
  else if (!isMobilePL(norm.e164!)) errors.push('phone-mobile');
  if (errors.length) return jsonError(400, 'Uzupełnij poprawnie dane.', { fields: errors });
  const phone = norm.e164!;

  // Konfiguracja – brak któregokolwiek z wymaganych bindingów to błąd przed wysyłką.
  const token = (env.SMSAPI_TOKEN || '').trim();
  const sender = (env.SMSAPI_SENDER || '').trim();
  const salt = (env.OTP_SALT || '').trim();
  const kv = env.FANOUT_RL;
  if (!token || !sender || !salt || !kv) {
    return json({ status: 'config-error', error: 'Weryfikacja SMS chwilowo niedostępna.' }, 500);
  }

  // Limity wysyłki (anty-abuse + kill-switch kosztowy).
  const limits: SendLimits = {
    hourlyPerPhone: resolveLimit(env.SMS_HOURLY_PER_PHONE, 3),
    dailyPerIp: resolveLimit(env.SMS_SENDCODE_IP_LIMIT, 10),
    dailyGlobal: resolveLimit(env.SMS_DAILY_GLOBAL_LIMIT, 30),
    cooldownSec: 60,
  };
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const now = new Date();
  const gate = await checkSendAllowed(kv, phone, ip, now, limits);
  if (!gate.allowed) {
    const msg =
      gate.reason === 'cooldown'
        ? 'Kod został już wysłany. Odczekaj chwilę przed kolejną próbą.'
        : 'Przekroczono limit wysyłek kodu. Spróbuj później lub napisz na biuro@grupa-icea.pl.';
    return jsonError(429, msg, { reason: gate.reason });
  }

  // Generacja + wysyłka.
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  const code = generateOtpCode(bytes);
  // Bez URL-a w treści: SMSAPI blokuje wiadomości z linkiem (błąd 94). ASCII = tańszy GSM-7.
  const message = `Kod weryfikacyjny ICEA: ${code}. Wazny 10 minut.`;
  const sent = await sendSms({ token, from: sender, to: phone, message, test: env.SMSAPI_TEST === '1' });
  if (!sent.ok) {
    return jsonError(502, 'Nie udało się wysłać SMS-a. Sprawdź numer i spróbuj ponownie.');
  }

  // Challenge w KV – zapis bezwarunkowy (kv gwarantowane przez guard wyżej).
  const challengeId = crypto.randomUUID();
  const hash = await hashOtp(code, salt);
  const lead: ChallengeLead = { firstName, lastName, email, phone, consent: body.consent === true, tool };
  const record = buildChallengeRecord({ phone, hash, lead, now: now.getTime(), ttlMs: CHALLENGE_TTL_MS });
  await kv.put(`otp:${challengeId}`, JSON.stringify(record), {
    expirationTtl: Math.ceil(CHALLENGE_TTL_MS / 1000),
  });
  await gate.commit();

  // Log częściowego leada (numer zostawiony w formularzu narzędzia) – best-effort.
  context.waitUntil(logEvent(kv, 'usage', 'sms-code', {
    tool, firstName, lastName, email, phone, consent: body.consent === true,
  }));

  return json({ ok: true, challengeId });
};
