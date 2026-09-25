"use client";

/* Przełącznik segmentowy (TailAdmin „ChartTab"): okresy, tryby, zakresy TOP. */
import { cn } from "@/lib/cn";

export default function Segmented<T extends string | number | null>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: React.ReactNode }[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
}) {
  return (
    <div role="group" aria-label={label} className="no-scrollbar flex max-w-full gap-0.5 overflow-x-auto rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900">
      {options.map((option) => (
        <button
          key={String(option.value)}
          type="button"
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-md px-3 py-1.5 text-theme-sm font-medium whitespace-nowrap",
            option.value === value
              ? "bg-white text-gray-900 shadow-theme-xs dark:bg-gray-800 dark:text-white"
              : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
