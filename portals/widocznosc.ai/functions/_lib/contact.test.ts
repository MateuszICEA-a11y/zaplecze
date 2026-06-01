import { describe, expect, it } from 'vitest';
import { validate, isHoneypotTriggered, typeLabel, CONTACT_TYPES } from './contact';

const valid = {
  name: 'Jan Kowalski',
  email: 'jan@firma.pl',
  company: 'Firma sp. z o.o.',
  type: 'audyt-ai',
  message: 'Chcę audyt widoczności w AI dla mojej marki.',
};

describe('validate', () => {
  it('akceptuje poprawny payload', () => {
    expect(validate(valid)).toEqual({ ok: true, errors: [] });
  });

  it('odrzuca brak imienia', () => {
    const r = validate({ ...valid, name: '   ' });
    expect(r.ok).toBe(false);
    expect(r.errors).toContain('name');
  });

  it('odrzuca zły format e-mail', () => {
    const r = validate({ ...valid, email: 'nie-email' });
    expect(r.ok).toBe(false);
    expect(r.errors).toContain('email');
  });

  it('odrzuca type spoza whitelisty', () => {
    const r = validate({ ...valid, type: 'hacker' });
    expect(r.ok).toBe(false);
    expect(r.errors).toContain('type');
  });

  it('odrzuca pustą wiadomość', () => {
    const r = validate({ ...valid, message: '' });
    expect(r.ok).toBe(false);
    expect(r.errors).toContain('message');
  });

  it('akceptuje brak company (opcjonalne)', () => {
    const { company, ...noCompany } = valid;
    expect(validate(noCompany).ok).toBe(true);
  });

  it('odrzuca zbyt długą wiadomość', () => {
    const r = validate({ ...valid, message: 'a'.repeat(5001) });
    expect(r.ok).toBe(false);
    expect(r.errors).toContain('message');
  });
});

describe('isHoneypotTriggered', () => {
  it('false gdy honeypot pusty', () => {
    expect(isHoneypotTriggered({ ...valid, website: '' })).toBe(false);
    expect(isHoneypotTriggered(valid)).toBe(false);
  });
  it('true gdy honeypot wypełniony', () => {
    expect(isHoneypotTriggered({ ...valid, website: 'http://spam.example' })).toBe(true);
  });
});

describe('typeLabel', () => {
  it('mapuje znane typy na czytelne etykiety PL', () => {
    expect(typeLabel('audyt-ai')).toBe('Kompleksowy audyt AI');
    expect(typeLabel('konsultacja')).toBe('Bezpłatna konsultacja 30 min');
  });
  it('zwraca surową wartość dla nieznanego typu', () => {
    expect(typeLabel('cokolwiek')).toBe('cokolwiek');
  });
  it('CONTACT_TYPES pokrywa opcje selecta', () => {
    expect(CONTACT_TYPES).toEqual([
      'audyt-ai', 'audyt-content', 'visibility-checker', 'konsultacja', 'wdrozenie', 'inne',
    ]);
  });
});

import { buildEmails } from './contact';

describe('buildEmails', () => {
  const cfg = { from: 'widocznosc.ai <formularz@widocznosc.ai>', leadTo: 'lead.icea@gmail.com' };

  it('mail wewnętrzny: to=lead, reply_to=email leada, label typu w temacie', () => {
    const { internal } = buildEmails(valid, cfg);
    expect(internal.to).toEqual(['lead.icea@gmail.com']);
    expect(internal.from).toBe('widocznosc.ai <formularz@widocznosc.ai>');
    expect(internal.reply_to).toBe('jan@firma.pl');
    expect(internal.subject).toContain('Kompleksowy audyt AI');
    expect(internal.subject).toContain('Jan Kowalski');
  });

  it('mail wewnętrzny: body zawiera wszystkie pola', () => {
    const { internal } = buildEmails(valid, cfg);
    for (const v of ['Jan Kowalski', 'jan@firma.pl', 'Firma sp. z o.o.', 'Kompleksowy audyt AI']) {
      expect(internal.text).toContain(v);
      expect(internal.html).toContain(v);
    }
  });

  it('autoresponder: to=email leada, from=nasz', () => {
    const { autoresponder } = buildEmails(valid, cfg);
    expect(autoresponder.to).toEqual(['jan@firma.pl']);
    expect(autoresponder.from).toBe('widocznosc.ai <formularz@widocznosc.ai>');
    expect(autoresponder.subject.toLowerCase()).toContain('dziękujemy');
  });

  it('escapuje HTML w polach (anty-injection)', () => {
    const { internal } = buildEmails({ ...valid, message: '<script>x</script>' }, cfg);
    expect(internal.html).not.toContain('<script>x</script>');
    expect(internal.html).toContain('&lt;script&gt;');
    expect(internal.text).toContain('<script>x</script>'); // plain-text bez escape
  });
});
