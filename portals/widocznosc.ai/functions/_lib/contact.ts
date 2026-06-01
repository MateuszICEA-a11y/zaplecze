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
