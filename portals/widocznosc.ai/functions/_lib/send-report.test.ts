import { describe, it, expect } from 'vitest';
import { validateReportPayload, buildLeadNotification, MAX_PAYLOAD_BYTES } from './send-report';

describe('validateReportPayload – tool+challengeId wymagane, result opcjonalny', () => {
  it('ok bez result (np. liczenie padło) – tool + challengeId wystarczą', () => {
    expect(validateReportPayload({ tool: 'brand-check', challengeId: 'abc' } as any).ok).toBe(true);
  });
  it('ok z poprawnym result', () => {
    expect(validateReportPayload({ tool: 'url-check', challengeId: 'abc', result: { x: 1 } } as any).ok).toBe(true);
  });
  it('wymaga tool', () => {
    expect(validateReportPayload({ challengeId: 'abc' } as any).errors).toContain('tool');
  });
  it('wymaga challengeId', () => {
    expect(validateReportPayload({ tool: 'brand-check' } as any).errors).toContain('challengeId');
  });
  it('odrzuca result który nie jest obiektem (gdy obecny)', () => {
    expect(validateReportPayload({ tool: 'brand-check', challengeId: 'abc', result: 'nie' } as any).errors).toContain('result');
  });
  it('NIE wymaga firstName/lastName/email w ciele (są z challenge)', () => {
    const r = validateReportPayload({ tool: 'brand-check', challengeId: 'abc' } as any);
    expect(r.errors).not.toContain('firstName');
    expect(r.errors).not.toContain('email');
  });
});

describe('buildLeadNotification – tożsamość z challenge lead', () => {
  const lead = {
    firstName: 'Jan', lastName: 'Kowalski', email: 'jan@firma.pl',
    phone: '+48512345678', consent: true, tool: 'brand-check',
  };
  it('renderuje imię, telefon, flagę weryfikacji i zapytanie', () => {
    const mail = buildLeadNotification(lead as any, 'Marka X', { from: 'f@x', leadTo: 'lead@x' });
    expect(mail.to).toEqual(['lead@x']);
    expect(mail.reply_to).toBe('jan@firma.pl');
    expect(mail.text).toContain('Jan Kowalski');
    expect(mail.text).toContain('+48512345678');
    expect(mail.text).toContain('Numer zweryfikowany SMS: TAK');
    expect(mail.text).toContain('Marka X');
    expect(mail.subject).toContain('zweryfikowany SMS');
    expect(mail.subject).toContain('Jan Kowalski');
  });
  it('zgoda NIE gdy consent=false', () => {
    const mail = buildLeadNotification({ ...lead, consent: false } as any, '', { from: 'f@x', leadTo: 'lead@x' });
    expect(mail.text).toContain('Zgoda na kontakt: NIE');
  });
});
