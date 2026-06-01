import { describe, it, expect } from 'vitest';
import { validateReportPayload, buildLeadNotification, MAX_PAYLOAD_BYTES } from './send-report';

const ok = { tool: 'brand-check', email: 'jan@firma.pl', consent: true, query: 'ICEA', result: { brand: 'ICEA' } };

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
    const mail = buildLeadNotification(ok as any, { from: 'F', leadTo: 'lead@x' });
    expect(mail.to).toEqual(['lead@x']);
    expect(mail.subject).toContain('brand-check');
    expect(mail.html).toContain('jan@firma.pl');
    expect(mail.html).toContain('TAK');
  });
  it('pokazuje NIE gdy brak zgody', () => {
    const mail = buildLeadNotification({ ...ok, consent: false } as any, { from: 'F', leadTo: 'lead@x' });
    expect(mail.html).toContain('NIE');
  });
});
