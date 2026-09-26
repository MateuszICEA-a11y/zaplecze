"use client";

/* Matrix stron: jeden adres, źródła obok siebie (grupy kolumn Senuto / GSC /
   GA4) i filtry: wygrywające (TOP 10), szansa (11–30), poza indeksem. */
import DataGrid from "@/components/grid/DataGrid";
import { BarCell, PctBar, PositionBadge } from "@/components/grid/cells";
import Segmented from "@/components/Segmented";
import { cn } from "@/lib/cn";
import { fmtInt, fmtPct } from "@/lib/format";
import type { ColDef, ColGroupDef } from "ag-grid-community";
import { useMemo, useState } from "react";

export interface MatrixRow {
  url: string;
  path: string;
  indexed: boolean;
  coverage: string | null;
  lastCrawl: string | null;
  clicks: number;
  impressions: number;
  ctr: number | null;
  sessions: number | null;
  engagement: number | null;
  senutoPosition: number | null;
  senutoKeyword: string | null;
  senutoKeywords: number | null;
  senutoTop10: number | null;
}

const numeric = { type: "rightAligned", getQuickFilterText: () => "" } as const;
type Filter = "all" | "top10" | "chance" | "noindex";
const FILTERS: Record<Filter, ((r: MatrixRow) => boolean) | null> = {
  all: null,
  top10: (r) => r.senutoPosition !== null && r.senutoPosition <= 10,
  chance: (r) => r.senutoPosition !== null && r.senutoPosition >= 11 && r.senutoPosition <= 30,
  noindex: (r) => !r.indexed,
};

export default function MatrixTable({ domain, rows }: { domain: string; rows: MatrixRow[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const maxImpr = useMemo(() => Math.max(0, ...rows.map((r) => r.impressions ?? 0)), [rows]);

  const columns = useMemo<(ColDef<MatrixRow> | ColGroupDef<MatrixRow>)[]>(
    () => [
      {
        field: "path",
        headerName: "Strona",
        flex: 1,
        minWidth: 280,
        pinned: "left",
        cellRenderer: ({ data }: { data?: MatrixRow }) =>
          data && (
            <span className="flex min-w-0 items-center gap-2">
              <i
                className={cn("size-2 shrink-0 rounded-full", data.indexed ? "bg-success-500" : "bg-error-500")}
                title={data.indexed ? `w indeksie · ostatni crawl: ${data.lastCrawl ?? "–"}` : (data.coverage ?? "poza indeksem")}
              />
              <a
                href={data.url}
                target="_blank"
                rel="noopener"
                className="truncate text-gray-700 hover:text-brand-600 hover:underline dark:text-gray-300 dark:hover:text-brand-400"
              >
                {data.path}
              </a>
            </span>
          ),
      },
      {
        headerName: "Senuto",
        children: [
          {
            field: "senutoPosition",
            headerName: "Pozycja",
            headerTooltip: "Najlepsza pozycja frazy rankującej na ten adres",
            width: 110,
            ...numeric,
            tooltipValueGetter: ({ data }) =>
              data?.senutoKeyword
                ? `„${data.senutoKeyword}" · fraz: ${data.senutoKeywords}, w TOP 10: ${data.senutoTop10}`
                : "brak fraz Senuto dla tego adresu",
            cellRenderer: ({ value }: { value: number | null }) => <PositionBadge value={value} />,
          },
        ],
      },
      {
        headerName: "GSC · 30 dni",
        children: [
          {
            field: "impressions",
            headerName: "Wyświetlenia",
            width: 180,
            sort: "desc",
            ...numeric,
            cellRenderer: ({ value }: { value: number }) => <BarCell value={value} max={maxImpr} />,
          },
          { field: "clicks", headerName: "Kliknięcia", width: 115, ...numeric, valueFormatter: ({ value }) => fmtInt(value) },
          { field: "ctr", headerName: "CTR", width: 95, ...numeric, valueFormatter: ({ value }) => fmtPct(value) },
        ],
      },
      {
        headerName: "GA4 · 28 dni",
        children: [
          { field: "sessions", headerName: "Sesje", width: 100, ...numeric, valueFormatter: ({ value }) => (value === null ? "–" : fmtInt(value)) },
          {
            field: "engagement",
            headerName: "Engagement",
            width: 160,
            ...numeric,
            cellRenderer: ({ value }: { value: number | null }) => (value === null ? <span className="text-gray-400">–</span> : <PctBar value={value} />),
          },
        ],
      },
    ],
    [maxImpr],
  );

  return (
    <DataGrid<MatrixRow>
      title="Strony"
      rows={rows}
      columns={columns}
      filter
      filterPlaceholder="Szukaj adresu…"
      externalFilter={FILTERS[filter]}
      rowKey={(r) => r.url}
      csvName={`${domain}-matrix`}
      empty="Dane pojawią się po najbliższym przebiegu collectora (codziennie 6:30)."
      actions={
        <Segmented
          label="Filtr"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "Wszystkie" },
            { value: "top10", label: "Wygrywające (TOP 10)" },
            { value: "chance", label: "Szansa (11–30)" },
            { value: "noindex", label: "Poza indeksem" },
          ]}
        />
      }
    />
  );
}
