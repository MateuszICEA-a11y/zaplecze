"use client";

/* Strony i źródła ruchu z Clarity w jednej tabeli z przełącznikiem. */
import DataGrid from "@/components/grid/DataGrid";
import { BarCell } from "@/components/grid/cells";
import Segmented from "@/components/Segmented";
import type { ClarityDimensionRow } from "@/lib/data";
import { fmtInt } from "@/lib/format";
import type { ColDef } from "ag-grid-community";
import { useMemo, useState } from "react";

const numeric = { type: "rightAligned", getQuickFilterText: () => "" } as const;

export default function ClarityTables({
  domain,
  urls,
  referrers,
  urlsEmpty,
}: {
  domain: string;
  urls: ClarityDimensionRow[];
  referrers: ClarityDimensionRow[];
  urlsEmpty: string;
}) {
  const [kind, setKind] = useState<"strony" | "zrodla">("strony");
  const rows = kind === "strony" ? urls : referrers;

  const columns = useMemo<ColDef<ClarityDimensionRow>[]>(() => {
    const max = Math.max(0, ...rows.map((r) => r.sessions ?? 0));
    return [
      {
        field: "name",
        headerName: kind === "strony" ? "Strona" : "Źródło",
        flex: 1,
        minWidth: 240,
        tooltipField: "name",
        valueFormatter: ({ value }) => (kind === "strony" ? value.replace(/^https?:\/\/[^/]+/, "") || "/" : value),
      },
      {
        field: "sessions",
        headerName: "Sesje",
        width: 190,
        sort: "desc",
        ...numeric,
        cellRenderer: ({ value }: { value: number | null }) => <BarCell value={value} max={max} />,
      },
      ...(kind === "strony"
        ? [{ field: "users" as const, headerName: "Użytkownicy", width: 130, ...numeric, valueFormatter: ({ value }: { value: number | null }) => fmtInt(value) }]
        : []),
    ];
  }, [kind, rows]);

  return (
    <DataGrid<ClarityDimensionRow>
      key={kind}
      title={kind === "strony" ? "Najczęściej oglądane strony" : "Źródła ruchu"}
      meta={kind === "zrodla" ? "wymiar Source" : undefined}
      rows={rows}
      columns={columns}
      filter
      csvName={`${domain}-clarity-${kind}`}
      empty={kind === "strony" ? urlsEmpty : "Brak danych w tym oknie."}
      actions={
        <Segmented
          label="Lista"
          value={kind}
          onChange={setKind}
          options={[
            { value: "strony", label: `Strony · ${urls.length}` },
            { value: "zrodla", label: `Źródła · ${referrers.length}` },
          ]}
        />
      }
    />
  );
}
