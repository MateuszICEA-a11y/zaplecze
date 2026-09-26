"use client";

/* Domeny linkujące z filtrami: wszystkie / DR ≥ 70 / nowe w tym roku. */
import DataGrid from "@/components/grid/DataGrid";
import { BarCell } from "@/components/grid/cells";
import Segmented from "@/components/Segmented";
import type { RefDomain } from "@/lib/data";
import { cn } from "@/lib/cn";
import { fmtNum } from "@/lib/format";
import type { ColDef } from "ag-grid-community";
import { useMemo, useState } from "react";

const numeric = { type: "rightAligned", getQuickFilterText: () => "" } as const;

function ageOf(date: string | null): string | null {
  if (!date) return null;
  const days = Math.round((Date.now() - new Date(date).getTime()) / 86400_000);
  if (days < 0) return null;
  if (days < 30) return `${days} dni`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months} mies.`;
  return `${(days / 365).toFixed(1).replace(".", ",")} lat`;
}

export default function AhrefsTable({
  rows,
  drLabel,
  meta,
  csvName,
}: {
  rows: RefDomain[];
  drLabel: string;
  meta?: string;
  csvName: string;
}) {
  const year = String(new Date().getFullYear());
  const [mode, setMode] = useState<"all" | "dr70" | "new">("all");
  const filter = useMemo(
    () =>
      mode === "dr70"
        ? (d: RefDomain) => (d.domain_rating ?? -1) >= 70
        : mode === "new"
          ? (d: RefDomain) => (d.first_seen ?? "").startsWith(year)
          : null,
    [mode, year],
  );
  const maxLinks = useMemo(() => Math.max(0, ...rows.map((r) => r.links ?? 0)), [rows]);

  const columns = useMemo<ColDef<RefDomain>[]>(
    () => [
      {
        field: "domain",
        headerName: "Domena",
        flex: 1,
        minWidth: 220,
        cellRenderer: ({ value }: { value: string }) => (
          <span className="flex min-w-0 items-center gap-2.5">
            <span className="flex size-6 shrink-0 items-center justify-center rounded bg-gray-100 text-theme-xs font-medium text-gray-600 uppercase dark:bg-white/5 dark:text-gray-300">
              {value.charAt(0)}
            </span>
            <a
              href={`https://${value}`}
              target="_blank"
              rel="noopener nofollow"
              className="truncate text-gray-800 hover:text-brand-600 hover:underline dark:text-white/90 dark:hover:text-brand-400"
            >
              {value}
            </a>
          </span>
        ),
      },
      {
        field: "domain_rating",
        headerName: drLabel,
        width: 130,
        sort: "desc",
        ...numeric,
        cellRenderer: ({ value }: { value: number | null }) => (
          <span
            className={cn(
              "inline-flex min-w-10 justify-center rounded px-2 py-0.5 text-theme-xs leading-5 font-medium tabular-nums",
              typeof value !== "number"
                ? "text-gray-400"
                : value >= 70
                  ? "bg-brand-500 text-gray-950"
                  : value >= 40
                    ? "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"
                    : "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400",
            )}
          >
            {fmtNum(value, 1)}
          </span>
        ),
      },
      {
        field: "links",
        headerName: "Linki do celu",
        width: 180,
        ...numeric,
        cellRenderer: ({ value }: { value: number | null }) => <BarCell value={value} max={maxLinks} />,
      },
      {
        field: "first_seen",
        headerName: "Pierwszy link",
        width: 190,
        ...numeric,
        cellRenderer: ({ value }: { value: string | null }) => (
          <span className="tabular-nums">
            {value ?? "–"}
            {ageOf(value) && <span className="text-gray-400"> · {ageOf(value)}</span>}
          </span>
        ),
      },
    ],
    [drLabel, maxLinks],
  );

  return (
    <DataGrid<RefDomain>
      title="Domeny"
      meta={meta}
      rows={rows}
      columns={columns}
      filter
      filterPlaceholder="Szukaj domeny…"
      externalFilter={filter}
      rowKey={(d) => d.domain}
      csvName={csvName}
      empty="Lista domen pojawi się po najbliższym przebiegu collectora (codziennie 6:30)."
      actions={
        <Segmented
          label="Filtr domen"
          value={mode}
          onChange={setMode}
          options={[
            { value: "all", label: "Wszystkie" },
            { value: "dr70", label: "DR ≥ 70" },
            { value: "new", label: `Nowe (${year})` },
          ]}
        />
      }
    />
  );
}
