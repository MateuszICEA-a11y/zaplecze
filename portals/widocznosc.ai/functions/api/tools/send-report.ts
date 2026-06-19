/**
 * Wysyła pełny raport narzędzia na e-mail usera + powiadomienie leadowe do ICEA.
 *
 * Endpoint: POST /api/tools/send-report
 * Body: { tool, email, consent, query, result, website (honeypot) }
 * Wymaga: env RESEND_API_KEY. Reużywa KV FANOUT_RL (klucz tool:send-report:<ip>).
 */
import { resolveLimit, checkToolLimit } from '../../_lib/tool-rate-limit';
import { consumeVerifiedChallenge } from '../../_lib/otp';
import {
  validateReportPayload, isHoneypotTriggered, buildLeadNotification,
  type ReportPayload, MAX_PAYLOAD_BYTES,
} from '../../_lib/send-report';
import { renderToolReport, type Tool } from '../../_lib/reports';
import type { ResendEmail } from '../../_lib/contact';

type Env = {
  RESEND_API_KEY?: string;
  TOOL_REPORT_DAILY_LIMIT?: string;
  FANOUT_RL?: KVNamespace;
};

const RESEND_URL = 'https://api.resend.com/emails';
const LEAD_TO = 'lead.icea@gmail.com';
const FROM = 'widocznosc.ai <formularz@widocznosc.ai>';
const REPORT_DEFAULT_LIMIT = 5;
const SEND_TIMEOUT_MS = 15_000;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}
function jsonError(status: number, message: string, extra: Record<string, unknown> = {}): Response {
  return json({ error: message, ...extra }, status);
}

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

export const onRequestGet: PagesFunction = async () =>
  new Response(JSON.stringify({ error: 'Użyj POST z { tool, email, result }.' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json; charset=utf-8', Allow: 'POST' },
  });

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // 1. Limit rozmiaru (anty-abuse) — czytamy jako tekst, potem parsujemy.
  const rawText = await request.text();
  if (rawText.length > MAX_PAYLOAD_BYTES) {
    return jsonError(413, 'Payload zbyt duży.');
  }
  let body: ReportPayload;
  try {
    body = JSON.parse(rawText) as ReportPayload;
  } catch {
    return jsonError(400, 'Nieprawidłowe body JSON.');
  }

  // 2. Honeypot — bot dostaje fałszywy sukces.
  if (isHoneypotTriggered(body)) return json({ ok: true });

  // 3. Walidacja.
  const v = validateReportPayload(body);
  if (!v.ok) return jsonError(400, 'Nieprawidłowe dane.', { fields: v.errors });

  // 3b. Bramka OTP – raport leci tylko po potwierdzeniu numeru kodem SMS.
  const challengeId = String(body.challengeId ?? '').trim();
  const kv = env.FANOUT_RL;
  if (!kv) return jsonError(503, 'Weryfikacja SMS niedostępna. Spróbuj później.');
  const verified = await consumeVerifiedChallenge(kv, challengeId, new Date());
  if (!verified.ok) {
    return jsonError(403, 'Potwierdź najpierw numer telefonu kodem SMS.', { reason: 'unverified' });
  }

  // 4. Konfiguracja.
  const apiKey = (env.RESEND_API_KEY || '').trim();
  if (!apiKey) {
    return json({ status: 'config-error', error: 'Wysyłka raportów chwilowo niedostępna.' }, 500);
  }

  // 5. Rate-limit (anty-abuse relay).
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const limit = resolveLimit(env.TOOL_REPORT_DAILY_LIMIT, REPORT_DEFAULT_LIMIT);
  const gate = await checkToolLimit(env.FANOUT_RL, 'send-report', ip, limit, new Date());
  if (!gate.allowed) {
    return jsonError(429, `Dzienny limit wysyłek raportów (${limit}) wyczerpany. Reset o północy.`, {
      limit, resetAt: gate.resetAt,
    });
  }

  // 6. Tożsamość leada z challenge (zaufana). result jest opcjonalny.
  const lead = verified.lead!;
  const tool = lead.tool as Tool;
  const query = String(body.query ?? '').trim();
  const hasResult = body.result != null && typeof body.result === 'object';

  // 6a. Kopia raportu do usera – best-effort (na ekranie i tak widzi wynik).
  if (hasResult) {
    const report = renderToolReport(tool, body.result, query);
    const userMail: ResendEmail = {
      from: FROM,
      to: [lead.email],
      subject: report.subject,
      html: report.html,
      text: 'Twój raport widocznosc.ai jest dostępny w wersji HTML tej wiadomości.',
    };
    await sendViaResend(apiKey, userMail);
  }

  // 6b. Powiadomienie leadowe do ICEA – zawsze (lead nie ginie nawet gdy liczenie padło).
  await sendViaResend(apiKey, buildLeadNotification(lead, query, { from: FROM, leadTo: LEAD_TO }));

  // 7. Zlicz limit po obsłudze leada.
  await gate.commit();

  return json({ ok: true });
};
