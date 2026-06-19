import { describe, expect, it } from 'vitest';
import { validate, isHoneypotTriggered, typeLabel, CONTACT_TYPES } from './contact';

const valid = {
  firstName: 'Jan',
  lastName: 'Kowalski',
  email: 'jan@firma.pl',
  phone: '512 345 678',
  company: 'Firma sp. z o.o.',
  type: 'audyt-ai',
  message: 'Chcę audyt widoczności w AI dla mojej marki.',
};

describe('validate', () => {
  it('akceptuje poprawny payload', () => {
    expect(validate(valid as any)).toEqual({ ok: true, errors: [] });
  });

  it('przechodzi z kompletem pól', () => {
    expect(validate(valid as any).ok).toBe(true);
  });

  it('wymaga firstName i lastName', () => {
    expect(validate({ ...valid, firstName: '' } as any).errors).toContain('firstName');
    expect(validate({ ...valid, lastName: '' } as any).errors).toContain('lastName');
  });

  it('odrzuca brak firstName (spacje)', () => {
    const r = validate({ ...valid, firstName: '   ' } as any);
    expect(r.ok).toBe(false);
    expect(r.errors).toContain('firstName');
  });

  it('odrzuca brak lastName (spacje)', () => {
    const r = validate({ ...valid, lastName: '   ' } as any);
    expect(r.ok).toBe(false);
    expect(r.errors).toContain('lastName');
  });

  it('odrzuca zły format e-mail', () => {
    const r = validate({ ...valid, email: 'nie-email' } as any);
    expect(r.ok).toBe(false);
    expect(r.errors).toContain('email');
  });

  it('wymaga poprawnego telefonu PL', () => {
    expect(validate({ ...valid, phone: '12345' } as any).errors).toContain('phone');
  });

  it('odrzuca pusty telefon', () => {
    const r = validate({ ...valid, phone: '' } as any);
    expect(r.ok).toBe(false);
    expect(r.errors).toContain('phone');
  });

  it('odrzuca type spoza whitelisty', () => {
    const r = validate({ ...valid, type: 'hacker' } as any);
    expect(r.ok).toBe(false);
    expect(r.errors).toContain('type');
  });

  it('odrzuca pustą wiadomość', () => {
    const r = validate({ ...valid, message: '' } as any);
    expect(r.ok).toBe(false);
    expect(r.errors).toContain('message');
  });

  it('akceptuje brak company (opcjonalne)', () => {
    const { company, ...noCompany } = valid;
    expect(validate(noCompany as any).ok).toBe(true);
  });

  it('odrzuca zbyt długą wiadomość', () => {
    const r = validate({ ...valid, message: 'a'.repeat(5001) } as any);
    expect(r.ok).toBe(false);
    expect(r.errors).toContain('message');
  });
});

describe('isHoneypotTriggered', () => {
  it('false gdy honeypot pusty', () => {
    expect(isHoneypotTriggered({ ...valid, website: '' } as any)).toBe(false);
    expect(isHoneypotTriggered(valid as any)).toBe(false);
  });
  it('true gdy honeypot wypełniony', () => {
    expect(isHoneypotTriggered({ ...valid, website: 'http://spam.example' } as any)).toBe(true);
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
    const { internal } = buildEmails(valid as any, cfg);
    expect(internal.to).toEqual(['lead.icea@gmail.com']);
    expect(internal.from).toBe('widocznosc.ai <formularz@widocznosc.ai>');
    expect(internal.reply_to).toBe('jan@firma.pl');
    expect(internal.subject).toContain('Kompleksowy audyt AI');
    expect(internal.subject).toContain('Jan Kowalski');
  });

  it('buildEmails: pełne imię w temacie + telefon i powitanie po imieniu', () => {
    const { internal, autoresponder } = buildEmails(valid as any, cfg);
    expect(internal.subject).toContain('Jan Kowalski');
    expect(internal.text).toContain('+48512345678');
    expect(autoresponder.text).toContain('Cześć Jan');
  });

  it('mail wewnętrzny: body zawiera wszystkie pola', () => {
    const { internal } = buildEmails(valid as any, cfg);
    for (const v of ['Jan Kowalski', 'jan@firma.pl', 'Firma sp. z o.o.', 'Kompleksowy audyt AI', '+48512345678']) {
      expect(internal.text).toContain(v);
      expect(internal.html).toContain(v);
    }
  });

  it('autoresponder: to=email leada, from=nasz', () => {
    const { autoresponder } = buildEmails(valid as any, cfg);
    expect(autoresponder.to).toEqual(['jan@firma.pl']);
    expect(autoresponder.from).toBe('widocznosc.ai <formularz@widocznosc.ai>');
    expect(autoresponder.subject.toLowerCase()).toContain('dziękujemy');
  });

  it('autoresponder: wita po imieniu', () => {
    const { autoresponder } = buildEmails(valid as any, cfg);
    expect(autoresponder.text).toContain('Cześć Jan');
    expect(autoresponder.html).toContain('Cześć Jan');
  });

  it('escapuje HTML w polach (anty-injection)', () => {
    const { internal } = buildEmails({ ...valid, message: '<script>x</script>' } as any, cfg);
    expect(internal.html).not.toContain('<script>x</script>');
    expect(internal.html).toContain('&lt;script&gt;');
    expect(internal.text).toContain('<script>x</script>'); // plain-text bez escape
  });
});
