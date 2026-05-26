import { describe, expect, it } from 'vitest';
import { evaluateLimit, secondsToMidnight } from './rate-limit';

describe('secondsToMidnight', () => {
  it('liczy sekundy do północy z godziny lokalnej', () => {
    expect(secondsToMidnight(23, 59, 30)).toBe(30);
    expect(secondsToMidnight(0, 0, 0)).toBe(86400);
    expect(secondsToMidnight(12, 0, 0)).toBe(43200);
  });
});

describe('evaluateLimit', () => {
  it('pozwala, gdy poniżej limitu, i zwraca remaining po zużyciu', () => {
    expect(evaluateLimit(0, 3)).toEqual({ allowed: true, remaining: 2 });
    expect(evaluateLimit(2, 3)).toEqual({ allowed: true, remaining: 0 });
  });

  it('blokuje, gdy licznik osiągnął limit', () => {
    expect(evaluateLimit(3, 3)).toEqual({ allowed: false, remaining: 0 });
    expect(evaluateLimit(5, 3)).toEqual({ allowed: false, remaining: 0 });
  });

  it('traktuje ujemny/niepoprawny licznik jak zero', () => {
    expect(evaluateLimit(-1, 3)).toEqual({ allowed: true, remaining: 2 });
    expect(evaluateLimit(Number.NaN, 3)).toEqual({ allowed: true, remaining: 2 });
  });
});
