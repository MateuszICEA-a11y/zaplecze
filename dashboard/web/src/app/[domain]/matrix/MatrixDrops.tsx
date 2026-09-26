"use client";

/* Dekodowanie spadków: dlaczego ruch spadł – nie tylko „o ile". Przyczyna
   liczona w build time (page.tsx), tu przełącznik kw/kw ↔ r/r i tabela. */
import DataGrid from "@/components/grid/DataGrid";
import { PctBar, PositionBadge, UrlCell } from "@/components/grid/cells";
import Segmented from "@/components/Segmented";
import { SectionHead } from "@/components/ui";
import { cn } from "@/lib/cn";
import { fmtInt, fmtNum } from "@/lib/format";
import type { ColDef } from "ag-grid-community";
import { useMemo, useState } from "react";

export interface DropRow {
  url: string;
  path: string;
  cause: "ctr" | "pos" | "demand" | "mixed";
  clicks: number;
  dClicks: number;
  impressions: number;
  dImpr: number;
  position: number | null;
  dPos: number | null;
  engagement: number | null;
}

const CAUSES: Record<DropRow["cause"], { label: string; hint: string; cls: string }> = {
  ctr: {
    label: "Spadek CTR",
    hint: "wyświetlenia rosną, kliknięcia nie → popraw tytuł i opis",
    cls: "bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
  },
  pos: {
    label: "Spadek pozycji",
    hint: "pozycja spadła → treść i linki",
    cls: "bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400",
  },
  demand: {
    label: "Popyt / sezon",
    hint: "pozycja trzyma, mniej wyszukiwań → sezonowość popytu",
    cls: "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300",
  },
  mixed: { label: "Mieszane", hint: "", cls: "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400" },
};

const numeric = { type: "rightAligned", getQuickFilterText: () => "" } as const;
/** Zmiana ze znakiem; `lowerBetter` – dla pozycji spadek liczbowy to awans. */
function Delta({ value, lowerBetter = false, precision = 0 }: { value: number | null; lowerBetter?: boolean; precision?: number }) {
  if (value === null) return <span className="text-gray-400">–</span>;
  const good = lowerBetter ? value < 0 : value > 0;
  const text = `${value > 0 ? "+" : value < 0 ? "−" : ""}${precision ? fmtNum(Math.abs(value), precision) : fmtInt(Math.abs(value))}`;
  return (
    <span
      className={cn(
        "font-medium tabular-nums",
        value === 0 ? "text-gray-500" : good ? "text-success-600 dark:text-success-500" : "text-error-600 dark:text-error-500",
      )}
    >
      {text}
    </span>
  );
}

export default function MatrixDrops({
  domain,
  drops,
  labels,
}: {
  domain: string;
  drops: Record<"qoq" | "yoy", DropRow[]>;
  labels: Record<"qoq" | "yoy", string>;
}) {
  const [mode, setMode] = useState<"qoq" | "yoy">(drops.qoq.length ? "qoq" : "yoy");

  const columns = useMemo<ColDef<DropRow>[]>(
    () => [
      {
        field: "path",
        headerName: "Strona",
        flex: 1,
        minWidth: 260,
        cellRenderer: ({ data }: { data?: DropRow }) => data && <UrlCell href={data.url} label={data.path} />,
      },
      {
        field: "cause",
        headerName: "Przyczyna",
        width: 150,
        getQuickFilterText: ({ value }) => CAUSES[value as DropRow["cause"]].label,
        tooltipValueGetter: ({ value }) => CAUSES[value as DropRow["cause"]].hint,
        cellRenderer: ({ value }: { value: DropRow["cause"] }) => (
          <span className={cn("rounded px-2 py-0.5 text-theme-xs leading-5 font-medium", CAUSES[value].cls)}>{CAUSES[value].label}</span>
        ),
      },
      { field: "clicks", headerName: "Kliknięcia", width: 110, ...numeric, valueFormatter: ({ value }) => fmtInt(value) },
      {
        field: "dClicks",
        headerName: "Δ kliknięć",
        width: 110,
        sort: "asc",
        ...numeric,
        cellRenderer: ({ value }: { value: number }) => <Delta value={value} />,
      },
      { field: "impressions", headerName: "Wyświetlenia", width: 125, ...numeric, valueFormatter: ({ value }) => fmtInt(value) },
      { field: "dImpr", headerName: "Δ wyświetleń", width: 120, ...numeric, cellRenderer: ({ value }: { value: number }) => <Delta value={value} /> },
      {
        field: "position",
        headerName: "Pozycja",
        width: 100,
        ...numeric,
        cellRenderer: ({ value }: { value: number | null }) => <PositionBadge value={value} precision={1} />,
      },
      {
        field: "dPos",
        headerName: "Δ pozycji",
        width: 105,
        ...numeric,
        cellRenderer: ({ value }: { value: number | null }) => <Delta value={value} lowerBetter precision={1} />,
      },
      {
        field: "engagement",
        headerName: "Engagement",
        width: 150,
        ...numeric,
        cellRenderer: ({ value }: { value: number | null }) => (value === null ? <span className="text-gray-400">–</span> : <PctBar value={value} />),
      },
    ],
    [],
  );

  return (
    <>
      <SectionHead title="Dekodowanie spadków" meta="dlaczego ruch spadł – nie tylko „o ile”">
        <Segmented
          label="Porównanie"
          value={mode}
          onChange={setMode}
          options={[
            { value: "qoq" as const, label: "kw/kw (3 mies.)" },
            { value: "yoy" as const, label: "r/r" },
          ]}
        />
      </SectionHead>
      <ul className="mb-4 flex flex-wrap gap-x-5 gap-y-2 text-theme-sm text-gray-600 dark:text-gray-400">
        {(["ctr", "pos", "demand"] as const).map((key) => (
          <li key={key} className="flex items-center gap-2">
            <span className={cn("rounded px-2 py-0.5 text-theme-xs font-medium", CAUSES[key].cls)}>{CAUSES[key].label}</span>
            {CAUSES[key].hint}
          </li>
        ))}
      </ul>
      <DataGrid<DropRow>
        key={mode}
        title="Strony tracące ruch"
        meta={`GSC: ${labels[mode]} · engagement: GA4 (28 dni)`}
        rows={drops[mode]}
        columns={columns}
        filter
        rowKey={(r) => r.url}
        csvName={`${domain}-spadki-${mode}`}
        empty="Brak spadków w tym porównaniu."
      />
    </>
  );
}
