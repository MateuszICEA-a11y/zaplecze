/* Klocki widoków w stylu TailAdmina (karty rounded-2xl, szare obramowanie,
   w ciemnym motywie półprzezroczyste tło). Bez stanu – działają jako Server
   Components i w komponentach klienckich. */
import { cn } from "@/lib/cn";
import { fmtDate } from "@/lib/format";
import { ArrowDown, ArrowUp, TriangleAlert } from "lucide-react";
import Link from "next/link";

export function Card({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function PageTitle({ title, meta, children }: { title: string; meta?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-title-sm font-medium text-gray-800 dark:text-white/90">{title}</h1>
        {meta && <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">{meta}</p>}
      </div>
      {children}
    </div>
  );
}

export function SectionHead({ title, meta, children }: { title: string; meta?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="mt-8 mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="text-lg font-medium text-gray-800 dark:text-white/90">{title}</h2>
        {meta && <span className="text-theme-sm text-gray-500 dark:text-gray-400">{meta}</span>}
      </div>
      {children}
    </div>
  );
}

/** Krótki opis widoku pod tytułem (odpowiednik `.page-lede` / `.senuto-note`). */
export function Note({ children }: { children: React.ReactNode }) {
  return (
    <p className="max-w-4xl rounded-xl border border-brand-100 bg-brand-25 px-4 py-3 text-theme-sm text-gray-600 dark:border-brand-500/20 dark:bg-brand-500/6 dark:text-gray-400 [&_b]:font-medium [&_b]:text-gray-800 dark:[&_b]:text-white/90">
      {children}
    </p>
  );
}

const fmtValue = (value: number | string | null, precision: number) =>
  value === null
    ? "–"
    : typeof value === "number"
      ? value.toLocaleString("pl-PL", { maximumFractionDigits: precision, useGrouping: "always" })
      : value;

/** Pigułka delty: kierunek × „czy wzrost jest dobry" (goodWhen="down" dla pozycji). */
export function DeltaBadge({
  delta,
  unit = "",
  precision = 0,
  goodWhen = "up",
  label,
}: {
  delta: number | null;
  unit?: string;
  precision?: number;
  goodWhen?: "up" | "down";
  label?: string;
}) {
  if (delta === null) return null;
  const direction = delta > 0 ? "up" : delta < 0 ? "down" : "flat";
  const good = direction !== "flat" && (direction === "up") === (goodWhen === "up");
  const Icon = direction === "up" ? ArrowUp : ArrowDown;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded px-2.5 py-0.5 text-theme-xs font-medium whitespace-nowrap",
        direction === "flat"
          ? "bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-white/80"
          : good
            ? "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500"
            : "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500",
      )}
    >
      {direction !== "flat" && <Icon className="size-3" />}
      {`${delta > 0 ? "+" : delta < 0 ? "−" : ""}${Math.abs(delta).toLocaleString("pl-PL", {
        maximumFractionDigits: Math.max(precision, 1),
      })}${unit}`}
      {label && <span className="font-normal opacity-70">{label}</span>}
    </span>
  );
}

/** Sparkline z ostatnich `last` niepustych punktów – czysty SVG, zero JS. */
export function Sparkline({
  values,
  color = "#5768ff",
  last = 12,
  className = "h-10 w-28",
}: {
  values: (number | null)[];
  color?: string;
  last?: number;
  className?: string;
}) {
  const points = values.filter((v): v is number => typeof v === "number").slice(-last);
  if (points.length < 2) return null;
  const min = Math.min(...points);
  const span = Math.max(...points) - min || 1;
  const coords = points.map((v, i) => [(i / (points.length - 1)) * 100, 26 - ((v - min) / span) * 24] as const);
  const line = coords.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const id = `sp-${Math.abs(line.length * 31 + points.length)}-${Math.round(points[0])}`;
  return (
    <svg viewBox="0 0 100 28" preserveAspectRatio="none" className={cn("overflow-visible", className)} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L100,28 L0,28 Z`} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.8" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export interface StatCardProps {
  label: string;
  value: number | string | null;
  delta?: number | null;
  deltaUnit?: string;
  deltaLabel?: string;
  unit?: string;
  precision?: number;
  goodWhen?: "up" | "down";
  trend?: (number | null)[];
  hero?: boolean;
  href?: string;
  /** Kolor kropki / sparkline'a (CSS). */
  color?: string;
  /** Data ostatniego udanego pomiaru, gdy źródło leży – wartość wyciszona. */
  staleDate?: string | null;
  staleReason?: string;
  emptyDeltaLabel?: string;
  children?: React.ReactNode;
}

/** Kafel metryki (TailAdmin „EcommerceMetrics"): etykieta, liczba, delta, sparkline. */
export function StatCard({
  label,
  value,
  delta = null,
  deltaUnit = "",
  deltaLabel = "7 dni",
  unit = "",
  precision = 0,
  goodWhen = "up",
  trend,
  hero = false,
  href,
  color,
  staleDate = null,
  staleReason,
  emptyDeltaLabel,
  children,
}: StatCardProps) {
  const body = (
    <>
      <div className="flex items-center gap-2 text-theme-sm text-gray-500 dark:text-gray-400">
        {color && <span className="size-2 shrink-0 rounded-full" style={{ background: color }} />}
        <span className="line-clamp-2">{label}</span>
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <div
            className={cn(
              "font-medium tracking-tight text-gray-800 tabular-nums dark:text-white/90",
              hero ? "text-title-md" : "text-title-sm",
              staleDate && "text-gray-400 dark:text-gray-500",
            )}
          >
            {fmtValue(value, precision)}
            {value !== null && unit && <span className="ms-1 text-lg font-medium text-gray-500">{unit}</span>}
          </div>
          <div className="mt-2 flex min-h-6 flex-wrap items-center gap-2">
            {staleDate ? (
              <span className="inline-flex items-center gap-1 rounded bg-warning-50 px-2.5 py-0.5 text-theme-xs font-medium text-warning-700 dark:bg-warning-500/15 dark:text-warning-400">
                <TriangleAlert className="size-3" />
                dane z {staleDate}
                {staleReason && ` · ${staleReason}`}
              </span>
            ) : delta !== null ? (
              <DeltaBadge delta={delta} unit={deltaUnit} precision={precision} goodWhen={goodWhen} label={deltaLabel} />
            ) : (
              emptyDeltaLabel && <span className="text-theme-xs text-gray-400">{emptyDeltaLabel}</span>
            )}
          </div>
        </div>
        {trend && <Sparkline values={trend} color={color} />}
      </div>
      {children}
    </>
  );
  const classes = cn(
    "block h-full rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3",
    hero && "sm:col-span-2 xl:col-span-1",
    href && "transition hover:border-brand-300 hover:shadow-theme-sm dark:hover:border-brand-500/40",
  );
  return href ? (
    <Link href={href} className={classes}>
      {body}
    </Link>
  ) : (
    <div className={classes}>{body}</div>
  );
}

export function StatGrid({ children, cols = 5 }: { children: React.ReactNode; cols?: 3 | 4 | 5 }) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5",
        cols === 5 && "xl:grid-cols-5",
        cols === 4 && "xl:grid-cols-4",
        cols === 3 && "xl:grid-cols-3",
      )}
    >
      {children}
    </div>
  );
}

/** Stan źródła: przejściowa awaria (ostatni pomiar) albo twardy błąd konfiguracji. */
export function SourceState({
  name,
  status,
  error,
  temporary,
  lastDate,
}: {
  name: string;
  status?: string;
  error?: string;
  temporary: boolean;
  lastDate?: string | null;
}) {
  if (!status || status === "ok" || status === "not_configured") return null;
  return (
    <div
      role={temporary ? "status" : "alert"}
      className={cn(
        "mb-6 flex items-start gap-3 rounded-xl border px-4 py-3 text-theme-sm",
        temporary
          ? "border-warning-200 bg-warning-50 text-warning-800 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-warning-300"
          : "border-error-200 bg-error-50 text-error-800 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-300",
      )}
    >
      <TriangleAlert className="mt-0.5 size-4 shrink-0" />
      {temporary ? (
        <span>
          <b>{name} chwilowo niedostępne</b>
          {status === "token_expired" ? " (token wygasł)" : error?.includes("429") ? " (limit API)" : ""}. Pokazujemy
          ostatni udany pomiar{lastDate ? ` z ${fmtDate(lastDate)}` : ""}.
        </span>
      ) : (
        <span>
          <b>{name}</b>: {error || "błąd konfiguracji źródła"}
        </span>
      )}
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="flex h-full min-h-48 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-gray-200 p-6 text-center dark:border-gray-800">
      <b className="text-sm font-medium text-gray-700 dark:text-gray-300">{title}</b>
      {children && <p className="max-w-sm text-theme-sm text-gray-500 dark:text-gray-400">{children}</p>}
    </div>
  );
}
