import { describe, it, expect } from 'vitest';
import { breadcrumbListSchema, organizationSchema, articleSchema } from '@/lib/schema';

describe('breadcrumbListSchema()', () => {
  it('returns valid BreadcrumbList JSON-LD', () => {
    const result = breadcrumbListSchema(
      [
        { name: 'Home', url: '/' },
        { name: 'Page', url: '/page/' },
      ],
      'https://widocznosc.ai',
    );
    expect(result['@type']).toBe('BreadcrumbList');
    expect(result.itemListElement).toHaveLength(2);
    expect(result.itemListElement[0].position).toBe(1);
    expect(result.itemListElement[1].item).toBe('https://widocznosc.ai/page/');
  });
});

describe('organizationSchema()', () => {
  it('returns Organization with sameAs array', () => {
    const result = organizationSchema();
    expect(result['@type']).toBe('Organization');
    expect(result.sameAs).toBeInstanceOf(Array);
    expect(result.sameAs.length).toBeGreaterThanOrEqual(1);
  });
});

describe('articleSchema()', () => {
  it('returns Article JSON-LD with author and publisher', () => {
    const result = articleSchema({
      type: 'TechArticle',
      title: 'Test',
      description: 'desc',
      url: 'https://widocznosc.ai/x/',
      image: 'https://widocznosc.ai/x.jpg',
      publishedAt: new Date('2026-05-06'),
      updatedAt: new Date('2026-05-06'),
      authors: [{ name: 'X', iceaProfile: 'https://x.pl/' }],
    });
    expect(result['@type']).toBe('TechArticle');
    expect(result.author[0].name).toBe('X');
  });
});
