import { describe, it, expect } from 'vitest';
import { renderReport } from './fanout';

const result = {
  query: 'najlepszy crm',
  answer: 'Odpowiedź modelu.',
  fanoutQueries: ['crm dla małych firm', 'ranking crm 2026'],
  citedDomains: [{ domain: 'example.com', count: 3, urls: [] }],
  citations: [{ title: 'Ranking CRM', url: 'https://example.com/crm', domain: 'example.com' }],
};

describe('renderReport fanout', () => {
  it('subject zawiera frazę', () => {
    expect(renderReport(result as any, result.query).subject).toContain('najlepszy crm');
  });
  it('html zawiera odpowiedź, fan-out query i cytowaną domenę', () => {
    const { html } = renderReport(result as any, result.query);
    expect(html).toContain('Odpowiedź modelu.');
    expect(html).toContain('ranking crm 2026');
    expect(html).toContain('example.com');
    expect(html).toContain('ICEA S.A.');
  });
});
