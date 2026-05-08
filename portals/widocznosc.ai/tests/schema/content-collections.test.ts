import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const authorSchema = z.object({
  name: z.string(),
  role: z.string(),
  company: z.literal('ICEA'),
  bio: z.string(),
  shortBio: z.string().max(280),
  expertise: z.array(z.string()).min(1),
  photo: z.string(),
  iceaProfile: z.string().url(),
  publishedAt: z.coerce.date(),
});

describe('Author schema', () => {
  it('accepts valid author', () => {
    const valid = {
      name: 'Tomasz Czechowski',
      role: 'Head of SEO',
      company: 'ICEA',
      bio: 'Lorem ipsum',
      shortBio: 'Short bio',
      expertise: ['SEO'],
      photo: 'https://example.com/x.jpg',
      iceaProfile: 'https://www.grupa-icea.pl/autor/tomasz-czechowski/',
      publishedAt: '2026-05-06',
    };
    expect(authorSchema.parse(valid)).toBeDefined();
  });

  it('rejects shortBio over 280 chars', () => {
    const invalid = {
      name: 'X',
      role: 'X',
      company: 'ICEA',
      bio: 'X',
      shortBio: 'a'.repeat(281),
      expertise: ['X'],
      photo: 'x',
      iceaProfile: 'https://x.pl/',
      publishedAt: '2026-05-06',
    };
    expect(() => authorSchema.parse(invalid)).toThrow();
  });

  it('rejects empty expertise array', () => {
    const invalid = {
      name: 'X',
      role: 'X',
      company: 'ICEA',
      bio: 'X',
      shortBio: 'X',
      expertise: [],
      photo: 'x',
      iceaProfile: 'https://x.pl/',
      publishedAt: '2026-05-06',
    };
    expect(() => authorSchema.parse(invalid)).toThrow();
  });
});
