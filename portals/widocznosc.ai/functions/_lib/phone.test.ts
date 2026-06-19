import { describe, it, expect } from 'vitest';
import { normalizePhonePL, isMobilePL } from './phone';

describe('normalizePhonePL', () => {
  it('normalizuje 9 cyfr ze spacjami do E.164', () => {
    expect(normalizePhonePL('512 345 678')).toEqual({ ok: true, e164: '+48512345678' });
  });
  it('akceptuje prefiksy +48 / 48 / 0048', () => {
    expect(normalizePhonePL('+48512345678').e164).toBe('+48512345678');
    expect(normalizePhonePL('48512345678').e164).toBe('+48512345678');
    expect(normalizePhonePL('0048512345678').e164).toBe('+48512345678');
  });
  it('usuwa myślniki i nawiasy', () => {
    expect(normalizePhonePL('(12) 345-67-89').e164).toBe('+48123456789');
  });
  it('odrzuca złą długość i śmieci', () => {
    expect(normalizePhonePL('12345678').ok).toBe(false); // 8 cyfr
    expect(normalizePhonePL('abc').ok).toBe(false);
    expect(normalizePhonePL('').ok).toBe(false);
  });
  it('odrzuca numer zaczynający się od 0', () => {
    expect(normalizePhonePL('012345678').ok).toBe(false);
  });
});

describe('isMobilePL', () => {
  it('rozpoznaje komórki (4-8)', () => {
    expect(isMobilePL('+48512345678')).toBe(true);
    expect(isMobilePL('+48887654321')).toBe(true);
  });
  it('odrzuca stacjonarne (1-3, 9)', () => {
    expect(isMobilePL('+48123456789')).toBe(false); // Kraków
    expect(isMobilePL('+48912345678')).toBe(false);
  });
});
