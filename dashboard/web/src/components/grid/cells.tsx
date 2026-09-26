"use client";

/* Komórki tabel – odpowiedniki `.rbadge`, `.cell-bar`, `.diff-bar`, `.opp-dots`
   ze starego dashboardu, w kolorach TailAdmina. */
import { cn } from "@/lib/cn";
import { fmtInt, fmtNum, fmtPct, posClass } from "@/lib/format";
import { ArrowDown, ArrowUp } from "lucide-react";

const POS_STYLES: Record<string, string> = {
  top3: "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400",
  top10: "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300",
  mid: "bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400",
  low: "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400",
  "": "text-gray-400",
};

export function PositionBadge({ value, precision = 0 }: { value: number | null | undefined; precision?: number }) {
  return (
    <span
      className={cn(
        "inline-flex min-w-10 justify-center rounded px-2 py-0.5 text-theme-xs leading-5 font-medium tabular-nums",
        POS_STYLES[posClass(value)],
      )}
    >
      {precision ? fmtNum(value, precision) : fmtInt(value)}
    </span>
  );
}

/** Liczba + pasek udziału w maksimum kolumny. */
export function BarCell({ value, max, color = "bg-brand-500" }: { value: number | null | undefined; max: number; color?: string }) {
  const width = typeof value === "number" && max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0;
  return (
    <span className="inline-flex w-full items-center justify-end gap-3 tabular-nums">
      {fmtInt(value)}
      <span className="h-1.5 w-16 shrink-0 overflow-hidden rounded-full bg-gray-100 dark:bg-white/5">
        <span className={cn("block h-full rounded-full", color)} style={{ width: `${width}%` }} />
      </span>
    </span>
  );
}

/** Zmiana pozycji: dodatnia = awans (zielona strzałka w górę). */
export function RankDelta({ value }: { value: number | null | undefined }) {
  if (typeof value !== "number" || value === 0) return <span className="text-gray-400">—</span>;
  const up = value > 0;
  const Icon = up ? ArrowUp : ArrowDown;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 font-medium tabular-nums",
        up ? "text-success-600 dark:text-success-500" : "text-error-600 dark:text-error-500",
      )}
    >
      <Icon className="size-3.5" />
      {Math.abs(value)}
    </span>
  );
}

/** Trudność frazy 0–100: pasek w kolorze łatwa / średnia / trudna. */
export function DifficultyCell({ value }: { value: number | null | undefined }) {
  const tier = typeof value !== "number" ? "" : value < 40 ? "easy" : value < 60 ? "med" : "hard";
  const color = tier === "easy" ? "bg-success-500" : tier === "med" ? "bg-warning-500" : tier === "hard" ? "bg-error-500" : "";
  return (
    <span className="inline-flex w-full items-center justify-end gap-2 tabular-nums">
      <span className="h-1.5 w-12 overflow-hidden rounded-full bg-gray-100 dark:bg-white/5">
        <span className={cn("block h-full rounded-full", color)} style={{ width: `${Math.min(100, Math.max(0, value ?? 0))}%` }} />
      </span>
      <span className="w-6 text-right">{fmtNum(value, 0)}</span>
    </span>
  );
}

/** Procent z paskiem (engagement rate). */
export function PctBar({ value }: { value: number | null | undefined }) {
  return (
    <span className="inline-flex w-full items-center justify-end gap-2 tabular-nums">
      <span className="h-1.5 w-12 overflow-hidden rounded-full bg-gray-100 dark:bg-white/5">
        <span className="block h-full rounded-full bg-blue-light-500" style={{ width: `${Math.min(100, Math.max(0, value ?? 0))}%` }} />
      </span>
      <span className="w-14 text-right">{fmtPct(value)}</span>
    </span>
  );
}

/** Potencjał: 1–5 kropek (ranga percentylowa). */
export function Dots({ value, label }: { value: number; label?: string }) {
  return (
    <span className="inline-flex items-center gap-1" title={label}>
      {[1, 2, 3, 4, 5].map((i) => (
        <i key={i} className={cn("size-2 rounded-full", i <= value ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-700")} />
      ))}
    </span>
  );
}

export function UrlCell({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      title={href}
      onClick={(e) => e.stopPropagation()}
      className="truncate text-gray-700 hover:text-brand-500 hover:underline dark:text-gray-300 dark:hover:text-brand-400"
    >
      {label}
    </a>
  );
}

/** Wartości techniczne GA4 ((not set), Unassigned…) – wyciszone, nie udają treści. */
export function MaybeJunk({ value }: { value: string }) {
  const junk = /^\(|unassigned|not set|not available/i.test(value);
  return <span className={junk ? "text-gray-400 italic" : undefined}>{value}</span>;
}
