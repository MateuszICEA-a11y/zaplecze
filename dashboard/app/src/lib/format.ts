/* Helpery formatowania (build time). */

export const fmtInt = (v: number | null | undefined): string =>
  typeof v === 'number' ? v.toLocaleString('pl-PL') : '–';

export const fmtNum = (v: number | null | undefined, precision = 2): string =>
  typeof v === 'number' ? v.toLocaleString('pl-PL', { maximumFractionDigits: precision }) : '–';

export const fmtPct = (v: number | null | undefined): string =>
  typeof v === 'number' ? `${v.toLocaleString('pl-PL', { maximumFractionDigits: 2 })}%` : '–';

/** ISO ts → „20.07.2026, 14:32" (czas warszawski). */
export const fmtDateTime = (ts: string | undefined): string => {
  if (!ts) return '–';
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return ts;
  return d.toLocaleString('pl-PL', {
    timeZone: 'Europe/Warsaw',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/** Sekundy → „12 min 30 s". */
export const fmtDuration = (seconds: number | null | undefined): string => {
  if (typeof seconds !== 'number') return '–';
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m > 0 ? `${m} min ${s} s` : `${s} s`;
};

/** Klasa badge'a pozycji w tierach: top3 / top10 / mid (≤30) / low. */
export const posClass = (position: number | null | undefined): string => {
  if (typeof position !== 'number') return '';
  if (position <= 3) return 'top3';
  if (position <= 10) return 'top10';
  if (position <= 30) return 'mid';
  return 'low';
};

/** Klasa badge'a Domain Rating: ≥50 zielony, ≥20 niebieski, reszta neutralna. */
export const drClass = (dr: number | null | undefined): string => {
  if (typeof dr !== 'number') return '';
  if (dr >= 50) return 'top3';
  if (dr >= 20) return 'top10';
  return '';
};

/** Udział wartości w maksimum kolumny (szerokość paska w %). */
export const barWidth = (value: number | null | undefined, max: number): number => {
  if (typeof value !== 'number' || max <= 0) return 0;
  return Math.max(2, Math.round((value / max) * 100));
};
