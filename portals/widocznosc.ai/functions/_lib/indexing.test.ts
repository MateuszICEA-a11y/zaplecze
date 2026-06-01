import { describe, it, expect } from 'vitest';
import { shouldBlockIndexing } from './indexing';

describe('shouldBlockIndexing', () => {
  it('blokuje produkcyjny alias pages.dev', () => {
    expect(shouldBlockIndexing('widocznosc-ai.pages.dev')).toBe(true);
  });

  it('blokuje preview deployment <hash>.widocznosc-ai.pages.dev', () => {
    expect(shouldBlockIndexing('a1b2c3d4.widocznosc-ai.pages.dev')).toBe(true);
  });

  it('NIE blokuje domeny produkcyjnej i www', () => {
    expect(shouldBlockIndexing('widocznosc.ai')).toBe(false);
    expect(shouldBlockIndexing('www.widocznosc.ai')).toBe(false);
  });

  it('ignoruje port i wielkość liter', () => {
    expect(shouldBlockIndexing('Widocznosc-AI.Pages.Dev:443')).toBe(true);
  });

  it('NIE łapie hosta tylko zawierającego "pages.dev" w środku', () => {
    expect(shouldBlockIndexing('pages.dev.example.com')).toBe(false);
  });

  it('pusty / brak host = nie blokuje', () => {
    expect(shouldBlockIndexing(null)).toBe(false);
    expect(shouldBlockIndexing(undefined)).toBe(false);
    expect(shouldBlockIndexing('')).toBe(false);
  });
});
