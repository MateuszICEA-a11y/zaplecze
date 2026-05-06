import { describe, it, expect } from 'vitest';
import { buildBreadcrumbs } from '@/lib/breadcrumbs';

describe('buildBreadcrumbs()', () => {
  it('builds 4-level breadcrumb for /baza-wiedzy/modele-ai/chatgpt/', () => {
    const result = buildBreadcrumbs('/baza-wiedzy/modele-ai/chatgpt/');
    expect(result).toEqual([
      { name: 'Strona główna', url: '/' },
      { name: 'Baza wiedzy', url: '/baza-wiedzy/' },
      { name: 'Modele AI', url: '/baza-wiedzy/modele-ai/' },
      { name: 'Chatgpt', url: '/baza-wiedzy/modele-ai/chatgpt/' },
    ]);
  });
  it('handles homepage', () => {
    expect(buildBreadcrumbs('/')).toEqual([{ name: 'Strona główna', url: '/' }]);
  });
});
