/* Helpery formatowania (build time). */

export const fmtInt = (v: number | null | undefined): string =>
  typeof v === 'number' ? v.toLocaleString('pl-PL') : '–';

export const fmtNum = (v: number | null | undefined, precision = 2): string =>
  typeof v === 'number' ? v.toLocaleString('pl-PL', { maximumFractionDigits: precision }) : '–';

export const fmtPct = (v: number | null | undefined): string =>
  typeof v === 'number' ? `${v.toLocaleString('pl-PL', { maximumFractionDigits: 2 })}%` : '–';

/** Data ISO (YYYY-MM-DD) → zwarty polski zapis „22.07.2026”. */
export const fmtDate = (value: string | null | undefined): string => {
  if (!value) return '–';
  const d = new Date(`${value.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('pl-PL', {
    timeZone: 'UTC',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

/** Zakres ISO → „20.06–19.07.2026” (bez powtarzania wspólnego roku). */
export const fmtDateRange = (start: string | null | undefined, end: string | null | undefined): string => {
  if (!start || !end) return '–';
  const a = new Date(`${start.slice(0, 10)}T00:00:00Z`);
  const b = new Date(`${end.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return `${start} → ${end}`;
  const dd = (d: Date) => String(d.getUTCDate()).padStart(2, '0');
  const mm = (d: Date) => String(d.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = (d: Date) => d.getUTCFullYear();
  if (yyyy(a) === yyyy(b) && mm(a) === mm(b)) return `${dd(a)}–${dd(b)}.${mm(b)}.${yyyy(b)}`;
  if (yyyy(a) === yyyy(b)) return `${dd(a)}.${mm(a)}–${dd(b)}.${mm(b)}.${yyyy(b)}`;
  return `${dd(a)}.${mm(a)}.${yyyy(a)}–${dd(b)}.${mm(b)}.${yyyy(b)}`;
};

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
