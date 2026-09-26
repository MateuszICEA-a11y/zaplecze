"use client";

/* Boty i crawlowane ścieżki w jednej tabeli z przełącznikiem. */
import DataGrid from "@/components/grid/DataGrid";
import { BarCell } from "@/components/grid/cells";
import Segmented from "@/components/Segmented";
import { fmtInt } from "@/lib/format";
import type { ColDef } from "ag-grid-community";
import { CircleCheck, TriangleAlert } from "lucide-react";
import { useMemo, useState } from "react";

export type BotRow = { bot: string; vendor: string; requests: number };
export type PathRow = { path: string; requests: number; probe: boolean };

const numeric = { type: "rightAligned", getQuickFilterText: () => "" } as const;

export default function BotTables({ domain, bots, paths }: { domain: string; bots: BotRow[]; paths: PathRow[] }) {
  const [kind, setKind] = useState<"boty" | "sciezki">("boty");
  const probes = paths.filter((p) => p.probe).length;

  const botCols = useMemo<ColDef<BotRow>[]>(() => {
    const max = Math.max(0, ...bots.map((b) => b.requests));
    return [
      { field: "bot", headerName: "Bot", flex: 1, minWidth: 200, cellClass: "font-medium" },
      { field: "vendor", headerName: "Dostawca", width: 160 },
      {
        field: "requests",
        headerName: "Requesty",
        width: 190,
        sort: "desc",
        ...numeric,
        cellRenderer: ({ value }: { value: number }) => <BarCell value={value} max={max} />,
      },
    ];
  }, [bots]);

  const pathCols = useMemo<ColDef<PathRow>[]>(
    () => [
      {
        field: "path",
        headerName: "Ścieżka",
        flex: 1,
        minWidth: 240,
        cellClass: ({ data }) => (data?.probe ? "font-mono text-error-600 dark:text-error-400" : "font-mono"),
      },
      { field: "requests", headerName: "Requesty", width: 120, sort: "desc", ...numeric, valueFormatter: ({ value }) => fmtInt(value) },
      {
        field: "probe",
        headerName: "Rodzaj",
        width: 130,
        getQuickFilterText: ({ value }) => (value ? "sonda" : "realna"),
        cellRenderer: ({ value }: { value: boolean }) =>
          value ? (
            <span className="inline-flex items-center gap-1 text-error-600 dark:text-error-400">
              <TriangleAlert className="size-3.5" /> Sonda
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-gray-600 dark:text-gray-400">
              <CircleCheck className="size-3.5" /> Realna
            </span>
          ),
      },
    ],
    [],
  );

  const switcher = (
    <Segmented
      label="Lista"
      value={kind}
      onChange={setKind}
      options={[
        { value: "boty", label: `Boty · ${bots.length}` },
        { value: "sciezki", label: `Ścieżki · ${paths.length}` },
      ]}
    />
  );

  return kind === "boty" ? (
    <DataGrid<BotRow>
      key="boty"
      title="Wszystkie boty"
      rows={bots}
      columns={botCols}
      actions={switcher}
      filter
      csvName={`${domain}-boty-ai`}
      empty="Dane pojawią się po najbliższym przebiegu collectora (codziennie 6:30)."
    />
  ) : (
    <DataGrid<PathRow>
      key="sciezki"
      title="Najczęściej crawlowane ścieżki"
      meta={probes > 0 ? `${probes} z ${paths.length} ścieżek to sondy – skany podatności, nie realny crawl AI` : undefined}
      rows={paths}
      columns={pathCols}
      actions={switcher}
      filter
      csvName={`${domain}-boty-ai-sciezki`}
      empty="Dane pojawią się po najbliższym przebiegu collectora."
    />
  );
}
