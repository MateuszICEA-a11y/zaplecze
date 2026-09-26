/* Drobne klocki widoków roboczych (projekt artykułu, edytor wpisu): plakietka
   stanu i klasy przycisków w stylu TailAdmina. */
import { cn } from "@/lib/cn";

export type Tone = "ok" | "mid" | "warn" | "err" | "idle";

export const TONE_CLS: Record<Tone, string> = {
  ok: "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400",
  mid: "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300",
  warn: "bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400",
  err: "bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400",
  idle: "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400",
};

export const btn =
  "inline-flex h-10 items-center gap-1.5 rounded border border-gray-300 px-3.5 text-theme-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:text-white/90 dark:hover:bg-white/5";
export const btnSmall =
  "inline-flex h-8 items-center gap-1.5 rounded border border-gray-300 px-2.5 text-theme-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5";
export const btnPrimary =
  "inline-flex h-10 items-center gap-1.5 rounded bg-brand-500 px-4 text-theme-sm font-medium text-gray-950 hover:bg-brand-400 disabled:opacity-40";
export const btnDanger =
  "inline-flex h-9 items-center rounded border border-error-300 px-3 text-theme-sm font-medium text-error-700 hover:bg-error-50 disabled:opacity-40 dark:border-error-500/40 dark:text-error-400";
export const input =
  "w-full rounded border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-800 focus:border-brand-500 focus:outline-hidden disabled:opacity-70 dark:border-gray-700 dark:text-white/90";
export const inlineLink =
  "text-gray-800 underline decoration-brand-500 underline-offset-2 hover:text-brand-600 dark:text-white/90 dark:hover:text-brand-400";

export function Status({ tone, children, title }: { tone: Tone; children: React.ReactNode; title?: string }) {
  return (
    <span title={title} className={cn("inline-flex rounded px-2 py-0.5 text-theme-xs font-medium whitespace-nowrap", TONE_CLS[tone])}>
      {children}
    </span>
  );
}
