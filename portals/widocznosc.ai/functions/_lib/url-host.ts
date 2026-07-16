/** Normalizacja URL/hostname – wspólne dla brand-check (profil marki) i send-report (mail leadowy). */

export function normalizeUrl(input: string | undefined): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed || trimmed.length > 2048) return null;

  let urlString = trimmed;
  if (!/^https?:\/\//i.test(urlString)) {
    urlString = `https://${urlString}`;
  }

  try {
    const url = new URL(urlString);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    if (url.username || url.password) return null;
    if (isBlockedHostname(url.hostname)) return null;
    url.hash = '';
    return url.toString();
  } catch {
    return null;
  }
}

export function getHost(input: string | undefined): string | undefined {
  const normalized = normalizeUrl(input);
  if (!normalized) return undefined;
  try {
    return new URL(normalized).hostname.replace(/^www\./i, '');
  } catch {
    return undefined;
  }
}

function isBlockedHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, '');
  if (
    !host ||
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    host.endsWith('.internal')
  ) {
    return true;
  }

  if (host.includes(':')) return true;

  const parts = host.split('.');
  if (parts.length === 4 && parts.every((part) => /^\d+$/.test(part))) {
    const octets = parts.map(Number);
    if (octets.some((part) => part < 0 || part > 255)) return true;
    const [a, b, c] = octets;
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 192 && b === 0 && c === 0) ||
      (a === 192 && b === 0 && c === 2) ||
      (a === 198 && (b === 18 || b === 19)) ||
      (a === 198 && b === 51 && c === 100) ||
      (a === 203 && b === 0 && c === 113) ||
      a >= 224
    );
  }

  return false;
}
