/**
 * Logika limitu zapytań. Czyste funkcje + helper czasu.
 * Stan trzymany w Cloudflare KV przez wołającego (functions/api/tools/fanout.ts).
 */

export type LimitDecision = { allowed: boolean; remaining: number };

/** Sekundy do najbliższej północy na podstawie godziny/minuty/sekundy w danej strefie. */
export function secondsToMidnight(hours: number, minutes: number, seconds: number): number {
  const elapsed = hours * 3600 + minutes * 60 + seconds;
  return 86400 - elapsed;
}

/** Sekundy do północy w strefie Europe/Warsaw dla podanego momentu. */
export function secondsUntilWarsawMidnight(now: Date): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Warsaw',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(now);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? '0');
  const ttl = secondsToMidnight(get('hour'), get('minute'), get('second'));
  return Math.max(60, ttl); // KV wymaga min. 60s TTL
}

/**
 * Decyzja przed zużyciem próby.
 * @param count aktualna liczba zużytych prób w oknie (z KV)
 * @param limit dzienny limit
 * @returns allowed + remaining PO zużyciu bieżącej próby
 */
export function evaluateLimit(count: number, limit: number): LimitDecision {
  const used = Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;
  const allowed = used < limit;
  const remaining = allowed ? Math.max(0, limit - used - 1) : 0;
  return { allowed, remaining };
}
