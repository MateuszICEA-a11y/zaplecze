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
