"use client";

/* Część interaktywna Senuto: karty TOP 3/10/50 i chipy nad tabelą to jeden
   filtr (przełącznik), tabela fraz dociągana z frazy.json. */
import DataGrid from "@/components/grid/DataGrid";
import Segmented from "@/components/Segmented";
import { BarCell, DifficultyCell, PositionBadge, RankDelta } from "@/components/grid/cells";
import { SectionHead, StatCard, StatGrid } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { SenutoKeyword } from "@/lib/data";
import { C } from "@/lib/palette";
import type { ColDef } from "ag-grid-community";
import { useEffect, useMemo, useRef, useState } from "react";

type Stat = { value: number | null; delta: number | null };

const TIERS = [3, 10, 50] as const;
const TIER_COLOR = { 3: C.brandDark, 10: C.brand, 50: C.gray } as const;

export default function SenutoExplorer({
  domain,
  keywordsCount,
  staleDate,
  meta,
  stats,
  visibilityTrend,
  children,
}: {
  domain: string;
  keywordsCount: number;
  staleDate: string | null;
  meta?: string;
  stats: { visibility: Stat & { deltaPct: number | null }; top3: Stat; top10: Stat; top50: Stat; rank: Stat };
  visibilityTrend: (number | null)[];
  children: React.ReactNode;
}) {
  const [rows, setRows] = useState<SenutoKeyword[] | null>(keywordsCount ? null : []);
  const [tier, setTier] = useState<number | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!keywordsCount) return;
    fetch(`/${domain}/senuto/frazy.json`)
      .then((r) => r.json())
      .then(setRows)
      .catch(() => setRows([]));
  }, [domain, keywordsCount]);

  const maxSearches = useMemo(() => Math.max(0, ...(rows ?? []).map((k) => k.searches ?? 0)), [rows]);
  const filter = useMemo(
    () => (tier === null ? null : (k: SenutoKeyword) => typeof k.position === "number" && k.position <= tier),
    [tier],
  );

  const columns = useMemo<ColDef<SenutoKeyword>[]>(
    () => [
      {
        field: "keyword",
        headerName: "Fraza",
        flex: 1,
        minWidth: 260,
        cellClass: "flex items-center",
        cellRenderer: ({ data }: { data?: SenutoKeyword }) =>
          data && (
            <span className="flex min-w-0 flex-col justify-center leading-tight">
              <span className="truncate font-medium text-gray-800 dark:text-white/90">{data.keyword}</span>
              {data.url && (
                <a
                  href={`https://${data.url}`}
                  target="_blank"
                  rel="noopener"
                  className="truncate text-theme-xs text-gray-500 hover:text-brand-500 dark:text-gray-400"
                >
                  {data.url}
                </a>
              )}
            </span>
          ),
        getQuickFilterText: ({ data }) => `${data?.keyword ?? ""} ${data?.url ?? ""}`,
      },
      {
        field: "position",
        headerName: "Pozycja",
        width: 110,
        type: "rightAligned",
        cellRenderer: ({ value }: { value: number | null }) => <PositionBadge value={value} />,
        getQuickFilterText: () => "",
      },
      {
        field: "diff",
        headerName: "Zmiana",
        headerTooltip: "Różnica pozycji z API Senuto – porównanie z poprzednią aktualizacją indeksu (~7 dni)",
        width: 110,
        type: "rightAligned",
        cellRenderer: ({ value }: { value: number | null }) => <RankDelta value={value} />,
        getQuickFilterText: () => "",
      },
      {
        field: "searches",
        headerName: "Wolumen / mies.",
        width: 180,
        type: "rightAligned",
        sort: "desc",
        cellRenderer: ({ value }: { value: number | null }) => (
          <BarCell value={value} max={maxSearches} color="bg-theme-purple-500" />
        ),
        getQuickFilterText: () => "",
      },
      {
        field: "difficulty",
        headerName: "Trudność",
        width: 140,
        type: "rightAligned",
        cellRenderer: ({ value }: { value: number | null }) => <DifficultyCell value={value} />,
        getQuickFilterText: () => "",
      },
    ],
    [maxSearches],
  );

  const pickTier = (value: number | null) => setTier((current) => (current === value ? null : value));
  const tierCard = (t: (typeof TIERS)[number], stat: Stat) => (
    <button
      key={t}
      type="button"
      onClick={() => {
        pickTier(t);
        tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }}
      className={cn(
        "h-full rounded-2xl text-left transition focus-visible:outline-none",
        tier === t ? "ring-2 ring-brand-500" : "hover:ring-1 hover:ring-brand-300 dark:hover:ring-brand-500/40",
      )}
      aria-pressed={tier === t}
      title={tier === t ? "Pokaż wszystkie frazy" : `Filtruj tabelę do TOP ${t}`}
    >
      <StatCard label={`Frazy w TOP ${t}`} value={stat.value} delta={stat.delta} staleDate={staleDate} color={TIER_COLOR[t]} />
    </button>
  );

  return (
    <>
      <SectionHead title="Widoczność organiczna" meta="porównanie 7-dniowe" />
      <StatGrid cols={5}>
        <StatCard
          label="Indeks widoczności"
          value={stats.visibility.value}
          delta={stats.visibility.deltaPct}
          deltaUnit="%"
          precision={1}
          trend={visibilityTrend}
          color={C.violet}
          staleDate={staleDate}
          hero
        />
        {tierCard(3, stats.top3)}
        {tierCard(10, stats.top10)}
        {tierCard(50, stats.top50)}
        <StatCard label="Ranking domeny" value={stats.rank.value} delta={stats.rank.delta} goodWhen="down" staleDate={staleDate} />
      </StatGrid>

      {children}

      <div ref={tableRef} className="scroll-mt-24">
        <SectionHead title="Rankujące frazy" />
        <DataGrid<SenutoKeyword>
          title="Frazy"
          meta={meta}
          rows={rows}
          columns={columns}
          filter
          filterPlaceholder="Szukaj frazy lub adresu…"
          externalFilter={filter}
          rowKey={(k) => k.keyword}
          rowHeight={52}
          csvName={`${domain}-senuto-frazy`}
          empty="Lista fraz pojawi się po najbliższym przebiegu collectora (codziennie 6:30)."
          actions={
            <Segmented
              label="Zakres pozycji"
              value={tier}
              onChange={setTier}
              options={[{ value: null, label: "Wszystkie" }, ...TIERS.map((t) => ({ value: t, label: `TOP ${t}` }))]}
            />
          }
        />
      </div>
    </>
  );
}
