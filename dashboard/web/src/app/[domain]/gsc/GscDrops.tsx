"use client";

/* „Co spadło – szybki podgląd": top 6 fraz i stron z największym spadkiem
   wyświetleń, przełączane między porównaniem kw/kw i r/r. */
import Segmented from "@/components/Segmented";
import { Card, SectionHead } from "@/components/ui";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useState } from "react";

interface DropPanel {
  dropCount: number;
  gainCount: number;
  rows: { name: string; delta: string; flow: string }[];
}

export interface DropMode {
  id: string;
  short: string;
  meta: string;
  queries: DropPanel;
  pages: DropPanel;
}

export default function GscDrops({ modes }: { modes: DropMode[] }) {
  const [active, setActive] = useState(modes[0].id);
  const mode = modes.find((m) => m.id === active) ?? modes[0];

  return (
    <>
      <SectionHead title="Co spadło – szybki podgląd">
        {modes.length > 1 && (
          <Segmented
            label="Okres porównania"
            value={active}
            onChange={setActive}
            options={modes.map((m) => ({ value: m.id, label: m.short }))}
          />
        )}
      </SectionHead>
      <p className="-mt-2 mb-4 text-theme-xs text-gray-500 dark:text-gray-400">{mode.meta}</p>
      <div className="grid grid-cols-1 gap-4 md:gap-5 xl:grid-cols-2">
        {(
          [
            ["Frazy, które spadły", mode.queries],
            ["Strony, które spadły", mode.pages],
          ] as const
        ).map(([title, panel]) => (
          <Card key={title} className="p-5">
            <header className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">{title}</h3>
              <div className="flex gap-2 text-theme-xs font-medium">
                <span
                  className="inline-flex items-center gap-1 rounded-full bg-error-50 px-2.5 py-0.5 text-error-600 dark:bg-error-500/15 dark:text-error-500"
                  title="Liczba spadków wyświetleń"
                >
                  <ArrowDown className="size-3" />
                  {panel.dropCount.toLocaleString("pl-PL")}
                </span>
                <span
                  className="inline-flex items-center gap-1 rounded-full bg-success-50 px-2.5 py-0.5 text-success-600 dark:bg-success-500/15 dark:text-success-500"
                  title="Liczba wzrostów wyświetleń"
                >
                  <ArrowUp className="size-3" />
                  {panel.gainCount.toLocaleString("pl-PL")}
                </span>
              </div>
            </header>
            {panel.rows.length === 0 ? (
              <p className="py-6 text-center text-theme-sm text-gray-500 dark:text-gray-400">
                Brak spadków wyświetleń w tym oknie.
              </p>
            ) : (
              <ol className="divide-y divide-gray-100 dark:divide-gray-800">
                {panel.rows.map((row, i) => (
                  <li key={row.name} className="flex items-center gap-3 py-2.5">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-theme-xs font-medium text-gray-600 dark:bg-white/5 dark:text-gray-400">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-theme-sm text-gray-700 dark:text-gray-300" title={row.name}>
                      {row.name}
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block text-theme-sm font-medium text-error-600 tabular-nums dark:text-error-500">
                        −{row.delta}
                      </span>
                      <span className="block text-theme-xs text-gray-500 tabular-nums dark:text-gray-400">{row.flow}</span>
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        ))}
      </div>
    </>
  );
}
