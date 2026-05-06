import { describe, it, expect } from 'vitest';

function contrast(hex1: string, hex2: string): number {
  const lum = (hex: string) => {
    const rgb = hex.match(/[\da-f]{2}/gi)!.map((x) => {
      const c = parseInt(x, 16) / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  };
  const l1 = lum(hex1),
    l2 = lum(hex2);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

describe('ICEA brand palette WCAG AA contrast', () => {
  it('Off White on Midnight Blue passes AA (>=4.5:1)', () => {
    expect(contrast('#F9F9F9', '#000623')).toBeGreaterThanOrEqual(4.5);
  });
  it('Blue on Midnight Blue passes AA Large (>=3:1)', () => {
    expect(contrast('#5768FF', '#000623')).toBeGreaterThanOrEqual(3);
  });
  it('Orange on Midnight Blue passes AA Large (>=3:1)', () => {
    expect(contrast('#F6704C', '#000623')).toBeGreaterThanOrEqual(3);
  });
});
