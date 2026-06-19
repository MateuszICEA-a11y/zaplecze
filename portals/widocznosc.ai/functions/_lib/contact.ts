/**
 * Logika formularza kontaktowego /kontakt/.
 * Czyste funkcje (bez sieci/IO) – walidacja, honeypot, budowa maili.
 * Stan (rate-limit) i wysyłka żyją w functions/api/contact.ts.
 */

import { escapeHtml, emailShell, C } from './email-shell';
import { normalizePhonePL } from './phone';

export type ContactPayload = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  type?: string;
  message?: string;
  website?: string; // honeypot – prawdziwy użytkownik zostawia puste
};

export type ValidationResult = { ok: boolean; errors: string[] };

export type ResendEmail = {
  from: string;
  to: string[];
  reply_to?: string;
  subject: string;
  html: string;
  text: string;
};

/** Whitelisty wartości selecta „Cel kontaktu" w kontakt.astro. Kolejność = kolejność w UI. */
export const CONTACT_TYPES = [
  'audyt-ai',
  'audyt-content',
  'visibility-checker',
  'konsultacja',
  'wdrozenie',
  'inne',
] as const;

const TYPE_LABELS: Record<string, string> = {
  'audyt-ai': 'Kompleksowy audyt AI',
  'audyt-content': 'Audyt treści pod AI',
  'visibility-checker': 'Szybki test widoczności (bezpłatny)',
  konsultacja: 'Bezpłatna konsultacja 30 min',
  wdrozenie: 'Audyt + wdrożenie 90 dni',
  inne: 'Inne',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const LIMITS = { name: 80, email: 254, company: 160, message: 5000 };

export function typeLabel(type: string): string {
  return TYPE_LABELS[type] ?? type;
}

export function isHoneypotTriggered(p: ContactPayload): boolean {
  return String(p.website ?? '').trim().length > 0;
}

export function validate(p: ContactPayload): ValidationResult {
  const errors: string[] = [];
  const firstName = String(p.firstName ?? '').trim();
  const lastName = String(p.lastName ?? '').trim();
  const email = String(p.email ?? '').trim();
  const phone = String(p.phone ?? '').trim();
  const company = String(p.company ?? '').trim();
  const type = String(p.type ?? '').trim();
  const message = String(p.message ?? '').trim();

  if (firstName.length < 1 || firstName.length > LIMITS.name) errors.push('firstName');
  if (lastName.length < 1 || lastName.length > LIMITS.name) errors.push('lastName');
  if (email.length < 1 || email.length > LIMITS.email || !EMAIL_RE.test(email)) errors.push('email');
  if (!normalizePhonePL(phone).ok) errors.push('phone');
  if (!CONTACT_TYPES.includes(type as (typeof CONTACT_TYPES)[number])) errors.push('type');
  if (message.length < 1 || message.length > LIMITS.message) errors.push('message');
  if (company.length > LIMITS.company) errors.push('company');

  return { ok: errors.length === 0, errors };
}

export type EmailConfig = { from: string; leadTo: string };

function fieldRows(p: ContactPayload): Array<[string, string]> {
  const fullName = `${String(p.firstName ?? '').trim()} ${String(p.lastName ?? '').trim()}`.trim();
  const phone = normalizePhonePL(String(p.phone ?? '').trim());
  return [
    ['Imię i nazwisko', fullName],
    ['E-mail', String(p.email ?? '').trim()],
    ['Telefon', phone.e164 ?? String(p.phone ?? '').trim()],
    ['Firma', String(p.company ?? '').trim() || '—'],
    ['Cel kontaktu', typeLabel(String(p.type ?? '').trim())],
    ['Wiadomość', String(p.message ?? '').trim()],
  ];
}

export function buildEmails(p: ContactPayload, cfg: EmailConfig): {
  internal: ResendEmail;
  autoresponder: ResendEmail;
} {
  const firstName = String(p.firstName ?? '').trim();
  const fullName = `${firstName} ${String(p.lastName ?? '').trim()}`.trim();
  const email = String(p.email ?? '').trim();
  const label = typeLabel(String(p.type ?? '').trim());
  const rows = fieldRows(p);

  // ── Mail wewnętrzny (lead) ──
  const internalText = rows.map(([k, v]) => `${k}: ${v}`).join('\n');

  const rowsHtml = rows
    .map(([k, v], i) => {
      const isMessage = k === 'Wiadomość';
      const border = i === 0 ? '' : `border-top:1px solid ${C.line};`;
      const valueCell = isMessage
        ? `<div style="background:${C.msgBg};border-left:3px solid ${C.accent};border-radius:6px;padding:12px 14px;font-size:15px;line-height:1.6;color:${C.ink};white-space:pre-wrap;">${escapeHtml(v)}</div>`
        : `<span style="font-size:15px;color:${C.ink};">${escapeHtml(v)}</span>`;
      return (
        `<tr><td style="padding:14px 0 4px;${border}">` +
        `<div style="font-size:11px;letter-spacing:.6px;text-transform:uppercase;color:${C.inkMuted};margin-bottom:${isMessage ? '8' : '2'}px;">${escapeHtml(k)}</div>` +
        valueCell +
        `</td></tr>`
      );
    })
    .join('');

  const internalBody =
    `<tr><td style="padding:32px 32px 8px;">` +
    `<span style="display:inline-block;background:${C.accentSoft};color:${C.accentDark};font-size:12px;font-weight:600;padding:5px 12px;border-radius:999px;">${escapeHtml(label)}</span>` +
    `<h1 style="margin:14px 0 0;font-size:22px;line-height:1.3;color:${C.ink};">Nowy lead z formularza kontaktowego</h1>` +
    `</td></tr>` +
    `<tr><td style="padding:8px 32px 4px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rowsHtml}</table></td></tr>` +
    `<tr><td style="padding:20px 32px 32px;">` +
    `<a href="mailto:${escapeHtml(email)}?subject=${encodeURIComponent('Re: ' + label + ' – widocznosc.ai')}" style="display:inline-block;background:${C.accentDark};color:#fff;font-size:15px;font-weight:600;text-decoration:none;padding:12px 24px;border-radius:8px;">Odpowiedz na zapytanie</a>` +
    `<p style="margin:12px 0 0;font-size:12px;color:${C.inkMuted};">Odpowiedź trafi bezpośrednio na adres osoby zgłaszającej (Reply-To).</p>` +
    `</td></tr>`;

  const internal: ResendEmail = {
    from: cfg.from,
    to: [cfg.leadTo],
    reply_to: email,
    subject: `[widocznosc.ai] Nowy lead: ${label} – ${fullName}`,
    text: internalText,
    html: emailShell(internalBody, `Nowy lead: ${label} – ${fullName}`),
  };

  // ── Autoresponder ──
  const autoText =
    `Cześć ${firstName},\n\n` +
    `dziękujemy za kontakt z widocznosc.ai. Odebraliśmy Twoje zgłoszenie i odpowiemy w ciągu 24 godzin roboczych (pon–pt, 9:00–17:00).\n\n` +
    `W pilnych sprawach: biuro@grupa-icea.pl\n\n` +
    `Pozdrawiamy,\nZespół widocznosc.ai\nICEA S.A., ul. Szyperska 14, 61-754 Poznań`;

  const autoBody =
    `<tr><td style="padding:32px 32px 8px;">` +
    `<h1 style="margin:0;font-size:22px;line-height:1.3;color:${C.ink};">Dziękujemy za kontakt 👋</h1>` +
    `</td></tr>` +
    `<tr><td style="padding:8px 32px;">` +
    `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:${C.ink};">Cześć ${escapeHtml(firstName)},</p>` +
    `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:${C.ink};">odebraliśmy Twoje zgłoszenie w <strong>widocznosc.ai</strong>. Odezwiemy się z odpowiedzią najpóźniej w ciągu <strong>24 godzin roboczych</strong>.</p>` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 4px;background:${C.msgBg};border-radius:10px;">` +
    `<tr><td style="padding:16px 18px;">` +
    `<div style="font-size:11px;letter-spacing:.6px;text-transform:uppercase;color:${C.inkMuted};margin-bottom:4px;">Godziny pracy</div>` +
    `<div style="font-size:15px;color:${C.ink};">pon–pt, 9:00–17:00</div>` +
    `</td></tr></table>` +
    `<p style="margin:18px 0 0;font-size:14px;line-height:1.7;color:${C.inkMuted};">W pilnej sprawie napisz na <a href="mailto:biuro@grupa-icea.pl" style="color:${C.accentDark};text-decoration:none;">biuro@grupa-icea.pl</a>.</p>` +
    `<p style="margin:20px 0 0;font-size:15px;line-height:1.6;color:${C.ink};">Pozdrawiamy,<br><strong>Zespół widocznosc.ai</strong></p>` +
    `</td></tr>`;

  const autoresponder: ResendEmail = {
    from: cfg.from,
    to: [email],
    subject: 'Dziękujemy za kontakt – widocznosc.ai',
    text: autoText,
    html: emailShell(autoBody, 'Odebraliśmy Twoje zgłoszenie – odpowiemy w ciągu 24h roboczych.'),
  };

  return { internal, autoresponder };
}
