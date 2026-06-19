/** Walidacja i normalizacja polskich numerów telefonu do formatu E.164 (+48XXXXXXXXX). */

export type PhoneResult = { ok: boolean; e164?: string };

/**
 * Sprowadza polski numer do E.164. Akceptuje separatory (spacje, myślniki, nawiasy)
 * oraz prefiksy +48 / 48 / 0048. Wymaga dokładnie 9 cyfr krajowych, pierwsza ≠ 0.
 */
export function normalizePhonePL(raw: string): PhoneResult {
  const digits = String(raw ?? '')
    .replace(/[\s\-()./]/g, '')
    .replace(/^\+/, '');

  let local: string;
  if (/^0048\d{9}$/.test(digits)) local = digits.slice(4);
  else if (/^48\d{9}$/.test(digits)) local = digits.slice(2);
  else if (/^\d{9}$/.test(digits)) local = digits;
  else return { ok: false };

  if (/^0/.test(local)) return { ok: false };
  return { ok: true, e164: `+48${local}` };
}

/** Czy E.164 (+48…) to numer komórkowy PL (pierwsza cyfra krajowa 4–8). */
export function isMobilePL(e164: string): boolean {
  const m = /^\+48(\d)\d{8}$/.exec(String(e164 ?? ''));
  if (!m) return false;
  const first = Number(m[1]);
  return first >= 4 && first <= 8;
}
