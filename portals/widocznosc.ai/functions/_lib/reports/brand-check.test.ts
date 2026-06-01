import { describe, it, expect } from 'vitest';
import { renderReport } from './brand-check';

const result = {
  brand: 'ICEA',
  market: 'Polska',
  summary: { score: 72, knownBy: 3, totalModels: 4, sentiment: 'positive', competitors: ['Konkurent A'] },
  models: [
    { label: 'ChatGPT', knowsBrand: 'yes', sentiment: 'positive', confidence: 0.9, summary: 'Zna markę.' },
  ],
  actionItems: [{ priority: 'P1', title: 'Dodaj schema', description: 'Organization JSON-LD.' }],
};

describe('renderReport brand-check', () => {
  it('subject zawiera nazwę marki', () => {
    expect(renderReport(result as any, 'ICEA').subject).toContain('ICEA');
  });
  it('html zawiera wynik, model i action item', () => {
    const { html } = renderReport(result as any, 'ICEA');
    expect(html).toContain('72');
    expect(html).toContain('ChatGPT');
    expect(html).toContain('Dodaj schema');
    expect(html).toContain('ICEA S.A.');
  });
  it('escapuje nazwę marki', () => {
    const { html } = renderReport({ ...result, brand: '<x>' } as any, '<x>');
    expect(html).toContain('&lt;x&gt;');
  });
});
