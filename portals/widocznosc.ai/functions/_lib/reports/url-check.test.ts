import { describe, it, expect } from 'vitest';
import { renderReport } from './url-check';

const result = {
  url: 'https://example.com/blog/post',
  finalUrl: 'https://example.com/blog/post',
  score: {
    total: 68, grade: 'C',
    factors: [{ label: 'Modularność treści', score: 0.5, evidence: 'Częściowo modularna.' }],
    model: 'x',
  },
  actionItems: [{ priority: 'P0', title: 'Dodaj FAQ', description: 'Sekcja Q&A.' }],
};

describe('renderReport url-check', () => {
  it('subject zawiera URL', () => {
    expect(renderReport(result as any, result.url).subject).toContain('example.com');
  });
  it('html zawiera ocenę, grade, czynnik i action item', () => {
    const { html } = renderReport(result as any, result.url);
    expect(html).toContain('68');
    expect(html).toContain('C');
    expect(html).toContain('Modularność treści');
    expect(html).toContain('Dodaj FAQ');
  });
});
