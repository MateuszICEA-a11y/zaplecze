import { describe, it, expect } from 'vitest';
import { normalizeUrl, getHost } from './url-host';

describe('normalizeUrl', () => {
  it('dokleja https:// do gołej domeny', () => {
    expect(normalizeUrl('jsps.com.pl')).toBe('https://jsps.com.pl/');
  });
  it('usuwa fragment (#hash)', () => {
    expect(normalizeUrl('https://x.pl/a#frag')).toBe('https://x.pl/a');
  });
  it('odrzuca URL z credentials', () => {
    expect(normalizeUrl('https://user:pass@x.pl')).toBeNull();
  });
  it('odrzuca hosty zablokowane (localhost, sieci prywatne)', () => {
    expect(normalizeUrl('localhost')).toBeNull();
    expect(normalizeUrl('192.168.1.1')).toBeNull();
  });
  it('odrzuca pusty input i śmieci', () => {
    expect(normalizeUrl(undefined)).toBeNull();
    expect(normalizeUrl('   ')).toBeNull();
  });
});

describe('getHost', () => {
  it('wyciąga hostname z pełnego URL i zdejmuje www.', () => {
    expect(getHost('https://www.jsps.com.pl/kontakt?x=1')).toBe('jsps.com.pl');
  });
  it('działa dla gołej domeny', () => {
    expect(getHost('jsps.com.pl')).toBe('jsps.com.pl');
  });
  it('zwraca undefined dla wartości nienormalizowalnej', () => {
    expect(getHost('nie url ...')).toBeUndefined();
    expect(getHost(undefined)).toBeUndefined();
  });
});
