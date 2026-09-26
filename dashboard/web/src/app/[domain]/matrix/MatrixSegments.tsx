"use client";

/* Kafelki segmentów serwisu z przełącznikiem: stan 30 dni / vs 3 mies. / vs rok. */
import Segmented from "@/components/Segmented";
import { Card, SectionHead } from "@/components/ui";
import { cn } from "@/lib/cn";
import { fmtInt } from "@/lib/format";
import { useState } from "react";

type Cell = { label: string; value: string; pill?: { tone: "up" | "down" | "flat"; text: string } };
export interface SegmentCard {
  segment: string;
  pages: number;
  indexed: number;
  impressions: number;
  views: Record<string, Cell[]>;
}

export default function MatrixSegments({
  segments,
  modes,
}: {
  segments: SegmentCard[];
  modes: { value: string; label: string; meta: string }[];
}) {
  const [mode, setMode] = useState(modes[0].value);
  const meta = modes.find((m) => m.value === mode)?.meta;

  return (
    <>
      <SectionHead title="Segmenty serwisu" meta={meta}>
        {modes.length > 1 && (
          <Segmented label="Okres" value={mode} onChange={setMode} options={modes.map((m) => ({ value: m.value, label: m.label }))} />
        )}
      </SectionHead>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5 xl:grid-cols-3">
        {segments.map((s) => {
          const pct = s.pages ? Math.round((s.indexed / s.pages) * 100) : 0;
          return (
            <Card key={s.segment} className="p-5">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="truncate text-base font-medium text-gray-800 dark:text-white/90" title={s.segment}>
                  {s.segment}
                </h3>
                <span className="shrink-0 text-theme-sm text-gray-500 dark:text-gray-400">
                  {fmtInt(s.pages)} {s.pages === 1 ? "strona" : "stron"}
                </span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-white/5">
                <i className="block h-full rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-1.5 text-theme-xs text-gray-500 dark:text-gray-400">
                w indeksie {fmtInt(s.indexed)}/{fmtInt(s.pages)}
                {s.indexed < s.pages && ` · poza: ${fmtInt(s.pages - s.indexed)}`}
              </p>
              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
                {(s.views[mode] ?? s.views.now).map((c) => (
                  <div key={c.label}>
                    <dt className="text-theme-xs text-gray-500 dark:text-gray-400">{c.label}</dt>
                    <dd className="mt-0.5 flex flex-wrap items-baseline gap-x-2 text-lg font-medium text-gray-800 tabular-nums dark:text-white/90">
                      {c.value}
                      {c.pill && (
                        <span
                          className={cn(
                            "rounded px-1.5 text-theme-xs font-medium",
                            c.pill.tone === "up"
                              ? "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400"
                              : c.pill.tone === "down"
                                ? "bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400"
                                : "bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400",
                          )}
                        >
                          {c.pill.text}
                        </span>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </Card>
          );
        })}
      </div>
    </>
  );
}
