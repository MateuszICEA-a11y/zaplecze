/* Status tekstem + kropką (kolor nie jest jedynym nośnikiem informacji). */
import { cn } from "@/lib/cn";

export type Tone = "ok" | "warn" | "err" | "off";

const STYLES: Record<Tone, string> = {
  ok: "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400",
  warn: "bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400",
  err: "bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400",
  off: "bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400",
};

export function Pill({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1.5 rounded px-2 py-0.5 text-theme-xs font-medium", STYLES[tone])}>
      <span className="size-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}
