"use client";

/* Frazy w Bing z przełącznikiem okresu (jak w BWT). */
import DataGrid from "@/components/grid/DataGrid";
import { BarCell, PositionBadge } from "@/components/grid/cells";
import Segmented from "@/components/Segmented";
import { SectionHead } from "@/components/ui";
import { fmtInt } from "@/lib/format";
import type { ColDef } from "ag-grid-community";
import { useMemo, useState } from "react";

type Row = { query: string; clicks: number; impressions: number; position: number | null };
export type BingWindow = { key: string; label: string; range: string; queries: Row[] };

const numeric = { type: "rightAligned", getQuickFilterText: () => "" } as const;

export default function BingQueries({ domain, windows, initial }: { domain: string; windows: BingWindow[]; initial: string }) {
  const [active, setActive] = useState(initial);
  const win = windows.find((w) => w.key === active) ?? windows[0];

  const columns = useMemo<ColDef<Row>[]>(() => {
    const max = Math.max(0, ...win.queries.map((q) => q.impressions));
    return [
      { field: "query", headerName: "Fraza", flex: 1, minWidth: 240, cellClass: "font-medium" },
      { field: "clicks", headerName: "Kliknięcia", width: 120, sort: "desc", ...numeric, valueFormatter: ({ value }) => fmtInt(value) },
      {
        field: "impressions",
        headerName: "Wyświetlenia",
        width: 190,
        ...numeric,
        cellRenderer: ({ value }: { value: number }) => <BarCell value={value} max={max} />,
      },
      {
        field: "position",
        headerName: "Śr. pozycja klikn.",
        width: 150,
        ...numeric,
        cellRenderer: ({ value }: { value: number | null }) => <PositionBadge value={value} precision={1} />,
      },
    ];
  }, [win]);

  return (
    <>
      <SectionHead title="Frazy w Bing" meta={win.range}>
        {windows.length > 1 && (
          <Segmented label="Okres" value={active} onChange={setActive} options={windows.map((w) => ({ value: w.key, label: w.label }))} />
        )}
      </SectionHead>
      <DataGrid<Row>
        key={active}
        title="Frazy"
        meta={win.range}
        rows={win.queries}
        columns={columns}
        filter
        filterPlaceholder="Szukaj frazy…"
        rowKey={(q) => q.query}
        csvName={`${domain}-bing-frazy-${active}`}
        empty="Dane pojawią się po najbliższym przebiegu collectora (wymaga BING_WEBMASTER_API_KEY i zweryfikowanej witryny w BWT)."
      />
    </>
  );
}
