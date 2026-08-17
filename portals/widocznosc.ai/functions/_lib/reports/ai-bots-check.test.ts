import { describe, it, expect } from 'vitest';
import { renderReport } from './ai-bots-check';

const result = {
  domain: 'example.com',
  summary: { allowed: 5, blocked: 2, criticalBlocked: 1, total: 7 },
  bots: [{ name: 'GPTBot', allowed: false, critical: true }],
  actionItems: [{ priority: 'P0', title: 'Odblokuj GPTBot', description: 'Usuń Disallow.' }],
};

describe('renderReport ai-bots-check', () => {
  it('subject zawiera domenę', () => {
    expect(renderReport(result as any, result.domain).subject).toContain('example.com');
  });
  it('html zawiera statystyki, bota i action item', () => {
    const { html } = renderReport(result as any, result.domain);
    expect(html).toContain('GPTBot');
    expect(html).toContain('Odblokuj GPTBot');
    expect(html).toContain('ICEA S.A.');
  });

  it('bez warstwy serwera nie ma pustej sekcji', () => {
    expect(renderReport(result as any, result.domain).html).not.toContain('Warstwa serwera');
  });

  it('warstwa serwera trafia do maila razem z zastrzeżeniem', () => {
    const withPage = {
      ...result,
      page: {
        edge: { cloudflare: true, server: 'cloudflare' },
        directiveSummary: { noindex: false, noai: true },
        probes: [{ name: 'GPTBot', verdict: 'ua-blocked', status: 403, note: '' }],
        disclaimer: 'Sonda podszywa się pod User-Agent bota.',
      },
    };
    const { html } = renderReport(withPage as any, result.domain);
    expect(html).toContain('Warstwa serwera');
    expect(html).toContain('Cloudflare przed domeną: tak');
    expect(html).toContain('noai');
    expect(html).toContain('blokada po User-Agencie');
    expect(html).toContain('podszywa się');
  });
});
