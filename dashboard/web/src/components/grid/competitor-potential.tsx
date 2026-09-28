"use client";

/* Kolumny „Ruch” i „Potencjał” wpisów konkurencji (collector: competitor_potential.py).
   rank – frazy adresu z Senuto (raz w tygodniu), estimate – szacunek z frazy głównej
   dla wpisów do 90 dni bez frazy w TOP10. Wspólne dla asystenta i Content Writera. */
import { fmtInt } from "@/lib/format";
import type { ColDef } from "ag-grid-community";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

const muted = "text-theme-xs text-gray-500 dark:text-gray-400";

/** Szacunek wygrywa tylko, dopóki wpis nie ma frazy w TOP10 – potem liczą się dane z Senuto. */
function potentialOf(item: Any): { value: number | null; estimate: boolean } {
  if (item?.estimate && !item?.rank?.top10) return { value: item.estimate.demand ?? 0, estimate: true };
  return { value: item?.rank ? (item.rank.demand ?? 0) : null, estimate: false };
}

function Stacked({ main, sub, title }: { main: string; sub?: string | null; title?: string }) {
  return (
    <span className="flex min-w-0 flex-col justify-center leading-tight" title={title}>
      <span className="tabular-nums">{main}</span>
      {sub && <small className={`${muted} truncate`}>{sub}</small>}
    </span>
  );
}

export function competitorPotentialColumns(): ColDef<Any>[] {
  return [
    {
      headerName: "Ruch / mies.",
      colId: "traffic",
      width: 170,
      headerTooltip: "Szacowany ruch z Senuto: suma widoczności fraz adresu w TOP10. Odświeżane raz w tygodniu.",
      valueGetter: ({ data }) => data?.rank?.traffic ?? null,
      cellRenderer: ({ data, value }: { data?: Any; value: number | null }) => {
        if (value === null) return <span className="text-gray-400">–</span>;
        const rank = data.rank;
        const sub = rank.keyword ? `${rank.keyword} (${rank.position}.)` : rank.keywords ? `${fmtInt(rank.keywords)} fraz poza TOP10` : "brak fraz w Senuto";
        return <Stacked main={fmtInt(Math.round(value))} sub={sub} title={`${fmtInt(rank.keywords)} fraz, w TOP10: ${fmtInt(rank.top10)} · dane z ${rank.at}`} />;
      },
    },
    {
      headerName: "Potencjał",
      colId: "potential",
      width: 170,
      headerTooltip:
        "Popyt tematu: suma wyszukiwań 10 największych fraz adresu z pozycji 1–20. Dla wpisów do 90 dni bez TOP10 – szacunek z frazy głównej i powiązanych.",
      valueGetter: ({ data }) => potentialOf(data).value,
      cellRenderer: ({ data, value }: { data?: Any; value: number | null }) => {
        if (value === null) return <span className="text-gray-400">–</span>;
        if (potentialOf(data).estimate) {
          const e = data.estimate;
          return (
            <Stacked
              main={e.related ? `~${fmtInt(value)}` : "brak danych"}
              sub={`szac. · „${e.phrase}”`}
              title={`Wpis jeszcze nie rankuje. Fraza główna „${e.phrase}”: ${e.searches ?? "brak"} wyszukiwań, z powiązanymi ${fmtInt(value)} / mies.`}
            />
          );
        }
        return <Stacked main={fmtInt(value)} sub="wyszukiwań / mies." />;
      },
    },
  ];
}
