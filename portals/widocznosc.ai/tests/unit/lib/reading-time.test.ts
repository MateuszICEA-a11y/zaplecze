import { describe, it, expect } from 'vitest';
import { readingTime } from '@/lib/reading-time';

describe('readingTime()', () => {
  it('calculates ~1 min for 200 words', () => {
    const text = 'word '.repeat(200);
    expect(readingTime(text)).toBe(1);
  });
  it('calculates ~5 min for 1000 words', () => {
    const text = 'word '.repeat(1000);
    expect(readingTime(text)).toBe(5);
  });
  it('rounds up to min 1', () => {
    expect(readingTime('one two three')).toBe(1);
  });
});
