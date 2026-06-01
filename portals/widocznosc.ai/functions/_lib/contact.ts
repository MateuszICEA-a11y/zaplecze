/**
 * Logika formularza kontaktowego /kontakt/.
 * Czyste funkcje (bez sieci/IO) — walidacja, honeypot, budowa maili.
 * Stan (rate-limit) i wysyłka żyją w functions/api/contact.ts.
 */

export type ContactPayload = {
  name?: string;
  email?: string;
  company?: string;
  type?: string;
  message?: string;
  website?: string; // honeypot — prawdziwy użytkownik zostawia puste
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

const LIMITS = { name: 120, email: 254, company: 160, message: 5000 };

export function typeLabel(type: string): string {
  return TYPE_LABELS[type] ?? type;
}

export function isHoneypotTriggered(p: ContactPayload): boolean {
  return String(p.website ?? '').trim().length > 0;
}

export function validate(p: ContactPayload): ValidationResult {
  const errors: string[] = [];
  const name = String(p.name ?? '').trim();
  const email = String(p.email ?? '').trim();
  const company = String(p.company ?? '').trim();
  const type = String(p.type ?? '').trim();
  const message = String(p.message ?? '').trim();

  if (name.length < 1 || name.length > LIMITS.name) errors.push('name');
  if (email.length < 1 || email.length > LIMITS.email || !EMAIL_RE.test(email)) errors.push('email');
  if (!CONTACT_TYPES.includes(type as (typeof CONTACT_TYPES)[number])) errors.push('type');
  if (message.length < 1 || message.length > LIMITS.message) errors.push('message');
  if (company.length > LIMITS.company) errors.push('company');

  return { ok: errors.length === 0, errors };
}

export type EmailConfig = { from: string; leadTo: string };

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function fieldRows(p: ContactPayload): Array<[string, string]> {
  return [
    ['Imię i nazwisko', String(p.name ?? '').trim()],
    ['E-mail', String(p.email ?? '').trim()],
    ['Firma', String(p.company ?? '').trim() || '—'],
    ['Cel kontaktu', typeLabel(String(p.type ?? '').trim())],
    ['Wiadomość', String(p.message ?? '').trim()],
  ];
}

export function buildEmails(p: ContactPayload, cfg: EmailConfig): {
  internal: ResendEmail;
  autoresponder: ResendEmail;
} {
  const name = String(p.name ?? '').trim();
  const email = String(p.email ?? '').trim();
  const rows = fieldRows(p);

  const internalText = rows.map(([k, v]) => `${k}: ${v}`).join('\n');
  const internalHtml =
    `<h2>Nowy lead z widocznosc.ai</h2><table cellpadding="6" style="border-collapse:collapse">` +
    rows
      .map(
        ([k, v]) =>
          `<tr><td style="vertical-align:top;font-weight:600">${escapeHtml(k)}</td>` +
          `<td style="white-space:pre-wrap">${escapeHtml(v)}</td></tr>`,
      )
      .join('') +
    `</table>`;

  const internal: ResendEmail = {
    from: cfg.from,
    to: [cfg.leadTo],
    reply_to: email,
    subject: `[widocznosc.ai] Nowy lead: ${typeLabel(String(p.type ?? '').trim())} – ${name}`,
    text: internalText,
    html: internalHtml,
  };

  const autoText =
    `Cześć ${name},\n\n` +
    `dziękujemy za kontakt z widocznosc.ai. Odebraliśmy Twoje zgłoszenie i odpowiemy w ciągu 24 godzin roboczych (pon–pt, 9:00–17:00).\n\n` +
    `W pilnych sprawach: biuro@grupa-icea.pl\n\n` +
    `Pozdrawiamy,\nZespół widocznosc.ai\nICEA S.A., ul. Szyperska 14, 61-754 Poznań`;
  const autoHtml =
    `<p>Cześć ${escapeHtml(name)},</p>` +
    `<p>dziękujemy za kontakt z <strong>widocznosc.ai</strong>. Odebraliśmy Twoje zgłoszenie i odpowiemy w ciągu 24 godzin roboczych (pon–pt, 9:00–17:00).</p>` +
    `<p>W pilnych sprawach: <a href="mailto:biuro@grupa-icea.pl">biuro@grupa-icea.pl</a></p>` +
    `<p>Pozdrawiamy,<br>Zespół widocznosc.ai<br>ICEA S.A., ul. Szyperska 14, 61-754 Poznań</p>`;

  const autoresponder: ResendEmail = {
    from: cfg.from,
    to: [email],
    subject: 'Dziękujemy za kontakt – widocznosc.ai',
    text: autoText,
    html: autoHtml,
  };

  return { internal, autoresponder };
}
