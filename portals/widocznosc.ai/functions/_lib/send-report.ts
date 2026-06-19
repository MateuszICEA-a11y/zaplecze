/** Czysta logika endpointu send-report: walidacja payloadu + powiadomienie leadowe. */
import { emailShell, escapeHtml, C } from './email-shell';
import { isTool, toolLabel, type Tool } from './reports';
import type { ResendEmail } from './contact';

export const MAX_PAYLOAD_BYTES = 32_000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ReportPayload = {
  tool?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  challengeId?: string;
  consent?: boolean;
  query?: string;
  result?: unknown;
  website?: string; // honeypot
};

export type EmailConfig = { from: string; leadTo: string };

export function isHoneypotTriggered(p: ReportPayload): boolean {
  return String(p.website ?? '').trim().length > 0;
}

export function validateReportPayload(p: ReportPayload): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!isTool(p.tool)) errors.push('tool');
  const email = String(p.email ?? '').trim();
  if (email.length < 1 || email.length > 254 || !EMAIL_RE.test(email)) errors.push('email');
  if (String(p.firstName ?? '').trim().length < 1) errors.push('firstName');
  if (String(p.lastName ?? '').trim().length < 1) errors.push('lastName');
  if (String(p.challengeId ?? '').trim().length < 1) errors.push('challengeId');
  if (p.result === null || typeof p.result !== 'object') errors.push('result');
  else if (JSON.stringify(p.result).length > MAX_PAYLOAD_BYTES) errors.push('size');
  return { ok: errors.length === 0, errors };
}

/** Mail wewnętrzny (lead) do ICEA – numer zweryfikowany SMS, pełne dane leada. */
export function buildLeadNotification(p: ReportPayload, cfg: EmailConfig): ResendEmail {
  const tool = p.tool as Tool;
  const email = String(p.email ?? '').trim();
  const fullName = `${String(p.firstName ?? '').trim()} ${String(p.lastName ?? '').trim()}`.trim() || '—';
  const phone = String(p.phone ?? '').trim() || '—';
  const query = String(p.query ?? '').trim() || '—';
  const consentYes = p.consent === true;
  const consent = consentYes ? 'TAK' : 'NIE';

  const rows: Array<[string, string]> = [
    ['Narzędzie', toolLabel(tool)],
    ['Imię i nazwisko', fullName],
    ['E-mail', email],
    ['Telefon', phone],
    ['Numer zweryfikowany SMS', 'TAK'],
    ['Zapytanie', query],
    ['Zgoda na kontakt', consent],
  ];
  const rowsHtml = rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:10px 0;border-top:1px solid ${C.line};">` +
        `<div style="font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:${C.inkMuted};">${escapeHtml(k)}</div>` +
        `<div style="font-size:15px;color:${C.ink};">${escapeHtml(v)}</div></td></tr>`,
    )
    .join('');

  const badgeColor = consentYes ? '#0a7d33' : C.inkMuted;
  const body =
    `<tr><td style="padding:32px 32px 4px;">` +
    `<span style="display:inline-block;background:${C.accentSoft};color:${badgeColor};font-size:12px;font-weight:700;padding:5px 12px;border-radius:999px;">Zgoda na kontakt: ${consent}</span>` +
    `<h1 style="margin:14px 0 0;font-size:22px;color:${C.ink};">Lead z narzędzia: ${escapeHtml(toolLabel(tool))}</h1></td></tr>` +
    `<tr><td style="padding:8px 32px 24px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rowsHtml}</table>` +
    `<a href="mailto:${escapeHtml(email)}" style="display:inline-block;margin-top:16px;background:${C.accentDark};color:#fff;font-size:15px;font-weight:600;text-decoration:none;padding:12px 24px;border-radius:8px;">Napisz do leada</a></td></tr>`;

  return {
    from: cfg.from,
    to: [cfg.leadTo],
    reply_to: email,
    subject: `[widocznosc.ai] Lead (zweryfikowany SMS) z ${tool}: ${fullName}`,
    text: rows.map(([k, v]) => `${k}: ${v}`).join('\n'),
    html: emailShell(body, `Lead z ${toolLabel(tool)} – numer zweryfikowany SMS`),
  };
}
