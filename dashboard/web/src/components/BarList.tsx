/* Lista poziomych pasków (rozkład DR, boty dostawcy, urządzenia) – bez JS. */
import { cn } from "@/lib/cn";
import { fmtInt } from "@/lib/format";

export interface BarItem {
  label: React.ReactNode;
  value: number;
  /** Klasa tła paska, domyślnie Blue iCEA. */
  color?: string;
  hint?: string;
  suffix?: React.ReactNode;
}

export default function BarList({ items, labelWidth = "w-28" }: { items: BarItem[]; labelWidth?: string }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((item, index) => (
        <li key={index} className="flex items-center gap-3 text-theme-sm" title={item.hint}>
          <span className={cn("shrink-0 truncate text-gray-600 dark:text-gray-400", labelWidth)}>{item.label}</span>
          <span className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-white/5">
            <span
              className={cn("block h-full rounded-full", item.color ?? "bg-brand-500")}
              style={{ width: `${item.value ? Math.max(3, Math.round((item.value / max) * 100)) : 0}%` }}
            />
          </span>
          <span className="w-16 shrink-0 text-right font-medium text-gray-800 tabular-nums dark:text-white/90">
            {fmtInt(item.value)}
            {item.suffix}
          </span>
        </li>
      ))}
    </ul>
  );
}
