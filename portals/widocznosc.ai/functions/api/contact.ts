/**
 * Formularz kontaktowy – przyjmuje zgłoszenie i wysyła 2 maile przez Resend.
 *
 * Endpoint: POST /api/contact
 * Body: { name, email, company?, type, message, website? }  (website = honeypot)
 * Wymaga: env RESEND_API_KEY. Reużywa bindingu KV FANOUT_RL (prefiks contact:).
 */
import { validate, isHoneypotTriggered, buildEmails, type ContactPayload, type ResendEmail } from '../_lib/contact';
import { evaluateLimit, secondsUntilWarsawMidnight } from '../_lib/rate-limit';
import { logEvent } from '../_lib/lead-log';

type Env = {
  RESEND_API_KEY?: string;
  FANOUT_RL?: KVNamespace;
};

type LimitRecord = { count: number; resetAt: number };

const RESEND_URL = 'https://api.resend.com/emails';
const LEAD_TO = 'lead.icea@gmail.com';
const FROM = 'widocznosc.ai <formularz@widocznosc.ai>';
const DAILY_LIMIT = 5;
const SEND_TIMEOUT_MS = 15_000;

function jsonHeaders(): HeadersInit {
  return { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };
}
function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders() });
}
function jsonError(status: number, message: string, extra: Record<string, unknown> = {}): Response {
  return json({ error: message, ...extra }, status);
}

export const onRequestGet: PagesFunction = async () =>
  new Response(JSON.stringify({ error: 'Użyj POST z danymi formularza.' }), {
    status: 405,
    headers: { ...jsonHeaders(), Allow: 'POST' },
  });

async function sendViaResend(apiKey: string, email: ResendEmail): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort('resend-timeout'), SEND_TIMEOUT_MS);
  try {
    const res = await fetch(RESEND_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify(email),
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // 1. Parse
  let body: ContactPayload;
  try {
    body = await request.json<ContactPayload>();
  } catch {
    return jsonError(400, 'Nieprawidłowe body JSON.');
  }

  // 2. Honeypot — bot dostaje fałszywy sukces, nic nie wysyłamy.
  if (isHoneypotTriggered(body)) {
    return json({ ok: true });
  }

  // 3. Walidacja
  const result = validate(body);
  if (!result.ok) {
    return jsonError(400, 'Uzupełnij poprawnie pola formularza.', { fields: result.errors });
  }

  // 4. Konfiguracja
  const apiKey = (env.RESEND_API_KEY || '').trim();
  if (!apiKey) {
    return json(
      { status: 'config-error', error: 'Formularz jest chwilowo niedostępny. Napisz na biuro@grupa-icea.pl.' },
      500,
    );
  }

  // 5. Rate-limit (KV, prefiks contact:) — best-effort: brak bindingu = przepuszczamy.
  const kv = env.FANOUT_RL;
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const kvKey = `contact:${ip}`;
  const now = new Date();
  const ttl = secondsUntilWarsawMidnight(now);
  let record: LimitRecord = { count: 0, resetAt: now.getTime() + ttl * 1000 };
  if (kv) {
    const stored = await kv.get<LimitRecord>(kvKey, 'json');
    if (stored && typeof stored.count === 'number' && typeof stored.resetAt === 'number') record = stored;
  }
  const decision = evaluateLimit(record.count, DAILY_LIMIT);
  if (kv && !decision.allowed) {
    return jsonError(429, `Przekroczono dzienny limit zgłoszeń (${DAILY_LIMIT}). Napisz na biuro@grupa-icea.pl.`);
  }

  // 6. Wysyłka — mail wewnętrzny jest krytyczny.
  const { internal, autoresponder } = buildEmails(body, { from: FROM, leadTo: LEAD_TO });
  const internalOk = await sendViaResend(apiKey, internal);
  if (!internalOk) {
    return jsonError(502, 'Nie udało się wysłać wiadomości. Spróbuj ponownie lub napisz na biuro@grupa-icea.pl.');
  }

  // 6b. Trwały zapis leada do KV (dashboard zaplecza) – best-effort.
  context.waitUntil(logEvent(kv, 'lead', 'kontakt', {
    firstName: body.firstName,
    lastName: body.lastName,
    email: body.email,
    phone: body.phone,
    company: body.company,
    type: body.type,
    message: body.message,
  }));

  // 7. Autoresponder — best-effort, błąd nie wywraca zgłoszenia.
  await sendViaResend(apiKey, autoresponder);

  // 8. Inkrement limitu dopiero po udanym mailu wewnętrznym.
  if (kv) {
    await kv.put(kvKey, JSON.stringify({ count: Math.max(0, record.count) + 1, resetAt: record.resetAt }), {
      expirationTtl: Math.max(60, Math.ceil((record.resetAt - now.getTime()) / 1000)),
    });
  }

  return json({ ok: true });
};
