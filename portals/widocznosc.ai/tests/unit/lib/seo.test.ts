import { describe, it, expect } from 'vitest';
import { canonical, validateMeta } from '@/lib/seo';

describe('canonical()', () => {
  it('returns absolute URL with site prefix', () => {
    expect(canonical('/baza-wiedzy/embeddingi/', 'https://widocznosc.ai')).toBe(
      'https://widocznosc.ai/baza-wiedzy/embeddingi/',
    );
  });
  it('strips query params', () => {
    expect(canonical('/x/?utm=foo', 'https://widocznosc.ai')).toBe('https://widocznosc.ai/x/');
  });
  it('enforces trailing slash', () => {
    expect(canonical('/x', 'https://widocznosc.ai')).toBe('https://widocznosc.ai/x/');
  });
});

describe('validateMeta()', () => {
  it('passes for valid title 50-60 chars', () => {
    expect(() => validateMeta({ title: 'a'.repeat(55), description: 'b'.repeat(140) })).not.toThrow();
  });
  it('fails for title over 60 chars', () => {
    expect(() => validateMeta({ title: 'a'.repeat(61), description: 'b'.repeat(140) })).toThrow();
  });
  it('fails for description under 120 chars', () => {
    expect(() => validateMeta({ title: 'a'.repeat(50), description: 'b'.repeat(100) })).toThrow();
  });
});
