/* Wspólne przeliczenia stron (build time) – wydzielone z frontmatterów .astro,
   żeby każda strona nie trzymała własnej kopii. */
import type { Snapshot } from './data';

export type Series = { timestamps: number[]; values: (number | null)[] };

/** Przycina serię do punktów od `cutoff` (uniksowe sekundy). */
export function trimTo(series: Series, cutoff: number): Series {
  const found = series.timestamps.findIndex((ts) => ts >= cutoff);
  const start = found === -1 ? 0 : found;
  return { timestamps: series.timestamps.slice(start), values: series.values.slice(start) };
}

/** Granica „ostatnich `days` dni" liczona od najpóźniejszego punktu z `anchors`. */
export function cutoffFor(days: number, ...anchors: Series[]): number {
  const last = Math.max(0, ...anchors.flatMap((s) => s.timestamps));
  return last - days * 86400;
}

/** Ostatni snapshot, w którym źródło miało status ok (data + dane). */
export function lastOk(
  snapshots: Snapshot[],
  source: string,
): { date: string; data: Record<string, unknown> } | null {
  for (let i = snapshots.length - 1; i >= 0; i--) {
    const src = snapshots[i].sources[source];
    if (src?.status === 'ok') return { date: snapshots[i].date, data: src.data ?? {} };
  }
  return null;
}

/** Delta procentowa z bezwzględnej: (Δ / wartość sprzed okresu) × 100. */
export function deltaPct(value: number | null, delta: number | null): number | null {
  if (value === null || delta === null) return null;
  const previous = value - delta;
  return previous ? (delta / previous) * 100 : null;
}

/** Polska liczba mnoga: 1 fraza / 2 frazy / 5 fraz (z wyjątkiem nastek). */
export function plural(n: number, one: string, few: string, many: string): string {
  if (n === 1) return one;
  const d = n % 10;
  const dd = n % 100;
  return d >= 2 && d <= 4 && !(dd >= 12 && dd <= 14) ? few : many;
}

export const stripOrigin = (url: string): string => url.replace(/^https?:\/\/[^/]+/, '') || '/';

/** '2026-07-22' → '22.07'. */
export const fmtShort = (date: string | null | undefined): string =>
  date ? `${date.slice(8, 10)}.${date.slice(5, 7)}` : '–';
