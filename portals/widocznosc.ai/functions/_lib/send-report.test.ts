import { describe, it, expect } from 'vitest';
import { validateReportPayload, buildLeadNotification, MAX_PAYLOAD_BYTES } from './send-report';

const ok = {
  tool: 'brand-check', email: 'jan@firma.pl', consent: true, query: 'ICEA', result: { brand: 'ICEA' },
  firstName: 'Jan', lastName: 'Kowalski', phone: '+48512345678', challengeId: 'abc',
};

describe('validateReportPayload', () => {
  it('akceptuje poprawny payload', () => {
    expect(validateReportPayload(ok).ok).toBe(true);
  });
  it('odrzuca nieznane narzędzie', () => {
    expect(validateReportPayload({ ...ok, tool: 'hack' }).ok).toBe(false);
  });
  it('odrzuca zły e-mail', () => {
    expect(validateReportPayload({ ...ok, email: 'nie-email' }).ok).toBe(false);
  });
  it('odrzuca brak result', () => {
    expect(validateReportPayload({ ...ok, result: null }).ok).toBe(false);
  });
  it('odrzuca za duży payload', () => {
    const big = { ...ok, result: { x: 'a'.repeat(MAX_PAYLOAD_BYTES + 1) } };
    expect(validateReportPayload(big).ok).toBe(false);
  });
  it('consent niewymagany (raport idzie zawsze)', () => {
    expect(validateReportPayload({ ...ok, consent: false }).ok).toBe(true);
  });
});

describe('buildLeadNotification', () => {
  it('zawiera narzędzie, e-mail i flagę zgody', () => {
    const mail = buildLeadNotification(
      { ...ok, firstName: 'Jan', lastName: 'Kowalski', phone: '+48512345678', challengeId: 'abc' } as any,
      { from: 'F', leadTo: 'lead@x' },
    );
    expect(mail.to).toEqual(['lead@x']);
    expect(mail.subject).toContain('brand-check');
    expect(mail.html).toContain('jan@firma.pl');
    expect(mail.html).toContain('TAK');
  });
  it('pokazuje NIE gdy brak zgody', () => {
    const mail = buildLeadNotification(
      { ...ok, firstName: 'Jan', lastName: 'Kowalski', phone: '+48512345678', consent: false } as any,
      { from: 'F', leadTo: 'lead@x' },
    );
    expect(mail.html).toContain('NIE');
  });
});

describe('validateReportPayload – rozszerzone pola', () => {
  const base = {
    tool: 'brand-check', email: 'jan@firma.pl', result: { x: 1 },
    firstName: 'Jan', lastName: 'Kowalski', phone: '+48512345678', challengeId: 'abc',
  };
  it('przechodzi z kompletem pól', () => {
    expect(validateReportPayload(base as any).ok).toBe(true);
  });
  it('wymaga firstName', () => {
    expect(validateReportPayload({ ...base, firstName: '' } as any).errors).toContain('firstName');
  });
  it('wymaga lastName', () => {
    expect(validateReportPayload({ ...base, lastName: '' } as any).errors).toContain('lastName');
  });
  it('wymaga challengeId', () => {
    expect(validateReportPayload({ ...base, challengeId: '' } as any).errors).toContain('challengeId');
  });
});

describe('buildLeadNotification – dane zweryfikowanego leada', () => {
  it('zawiera imię, nazwisko, telefon i flagę weryfikacji SMS', () => {
    const mail = buildLeadNotification(
      { tool: 'brand-check', email: 'jan@firma.pl', firstName: 'Jan', lastName: 'Kowalski',
        phone: '+48512345678', consent: true, query: 'Marka X' } as any,
      { from: 'f@widocznosc.ai', leadTo: 'lead.icea@gmail.com' },
    );
    expect(mail.text).toContain('Jan Kowalski');
    expect(mail.text).toContain('+48512345678');
    expect(mail.text).toContain('Numer zweryfikowany SMS: TAK');
  });
});
