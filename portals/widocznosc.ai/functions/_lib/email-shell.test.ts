import { describe, it, expect } from 'vitest';
import { escapeHtml, emailShell, C } from './email-shell';

describe('escapeHtml', () => {
  it('escapuje znaki HTML', () => {
    expect(escapeHtml('<a "x" & \'y\'>')).toBe('&lt;a &quot;x&quot; &amp; &#39;y&#39;&gt;');
  });
});

describe('emailShell', () => {
  it('opakowuje treść w szkielet z nagłówkiem i stopką ICEA', () => {
    const html = emailShell('<tr><td>TREŚĆ</td></tr>', 'preheader');
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('TREŚĆ');
    expect(html).toContain('ICEA S.A.');
    expect(html).toContain('preheader');
  });
  it('paleta C ma kolory brandu', () => {
    expect(C.accent).toBe('#0a9cff');
  });
});
