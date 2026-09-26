"use client";

/* Frazy i strony GSC w jednej tabeli (przełącznik Frazy/Strony) z przełącznikiem okresu. Każde okno to osobny plik JSON
   (dane/<okno>.json), dociągany przy pierwszym wyborze. Kliknięcie frazy
   otwiera kartę szczegółów z wyświetleniami z ostatnich 14 dni. */
import DataGrid from "@/components/grid/DataGrid";
import { BarCell, Dots, PositionBadge, UrlCell } from "@/components/grid/cells";
import Segmented from "@/components/Segmented";
import { Card, SectionHead, Sparkline } from "@/components/ui";
import type { GscRow } from "@/lib/data";
import { fmtInt, fmtNum, fmtPct } from "@/lib/format";
import { C } from "@/lib/palette";
import type { ColDef } from "ag-grid-community";
import { Info, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

interface WindowOption {
  value: string;
  label: string;
  range: string;
  queries: number;
  pages: number;
}

interface WindowData {
  start: string;
  end: string;
  queries: GscRow[];
  pages: GscRow[];
}

interface History {
  window: { start: string; end: string };
  series: Record<string, [string, number][]>;
}

type QueryRow = GscRow & { opp: number; dots: number; oppLabel: string };

/* Potencjał: wyświetlenia × waga pozycji, kropki = ranga percentylowa w bieżącej
   liście – skali nie niszczy jedna bardzo duża fraza. */
const oppMult = (pos: number | null) =>
  typeof pos !== "number" ? 0.32 : pos <= 3 ? 0.35 : pos <= 20 ? 1.0 : pos <= 50 ? 0.65 : 0.32;

function withOpportunity(rows: GscRow[]): QueryRow[] {
  const scored = rows.map((q) => ({ ...q, opp: (q.impressions ?? 0) * oppMult(q.position) })).sort((a, b) => b.opp - a.opp);
  const n = Math.max(scored.length, 1);
  return scored.map((q, index) => {
    const percentile = 1 - index / n;
    const dots = percentile > 0.9 ? 5 : percentile > 0.75 ? 4 : percentile > 0.5 ? 3 : percentile > 0.25 ? 2 : 1;
    return { ...q, dots, oppLabel: dots >= 4 ? "Wysoki" : dots === 3 ? "Średni" : "Niski" };
  });
}

const numeric = { type: "rightAligned", getQuickFilterText: () => "" } as const;

export default function GscTables({ domain, windows }: { domain: string; windows: WindowOption[] }) {
  const initial = windows.find((w) => w.value === "30d")?.value ?? windows[0].value;
  const [active, setActive] = useState(initial);
  const [cache, setCache] = useState<Record<string, WindowData | null>>({});
  const [selected, setSelected] = useState<QueryRow | null>(null);
  // undefined = jeszcze nie pobierana, "loading" = w drodze, null = brak / błąd.
  const [history, setHistory] = useState<History | null | "loading" | undefined>(undefined);
  const [helpOpen, setHelpOpen] = useState(false);
  const [kind, setKind] = useState<"frazy" | "strony">("frazy");

  useEffect(() => {
    if (active in cache) return;
    fetch(`/${domain}/gsc/dane/${active}.json`)
      .then((r) => r.json())
      .then((data: WindowData | null) => setCache((c) => ({ ...c, [active]: data })))
      .catch(() => setCache((c) => ({ ...c, [active]: null })));
  }, [active, cache, domain]);

  const win = cache[active];
  const loading = !(active in cache);
  const queries = useMemo(() => (win ? withOpportunity(win.queries) : null), [win]);
  const pages = win?.pages ?? (loading ? null : []);
  const maxQ = useMemo(() => Math.max(0, ...(queries ?? []).map((q) => q.impressions)), [queries]);
  const maxP = useMemo(() => Math.max(0, ...(pages ?? []).map((p) => p.impressions)), [pages]);
  const option = windows.find((w) => w.value === active)!;

  const openQuery = useCallback(
    (row: QueryRow) => {
      setSelected((current) => (current?.key === row.key ? null : row));
      if (history === undefined) {
        setHistory("loading");
        fetch(`/${domain}/gsc/dane/historia.json`)
          .then((r) => r.json())
          .then(setHistory)
          .catch(() => setHistory(null));
      }
    },
    [domain, history],
  );

  const queryColumns = useMemo<ColDef<QueryRow>[]>(
    () => [
      {
        field: "key",
        headerName: "Fraza",
        flex: 1,
        minWidth: 240,
        cellClass: "font-medium text-gray-800 dark:text-white/90",
      },
      {
        field: "clicks",
        headerName: "Kliknięcia",
        width: 120,
        ...numeric,
        valueFormatter: ({ value }) => fmtInt(value),
        cellClassRules: { "text-gray-400": ({ value }) => !value },
      },
      {
        field: "position",
        headerName: "Pozycja",
        width: 110,
        ...numeric,
        cellRenderer: ({ value }: { value: number | null }) => <PositionBadge value={value} precision={1} />,
      },
      {
        field: "impressions",
        headerName: "Wyświetlenia",
        width: 190,
        ...numeric,
        cellRenderer: ({ value }: { value: number }) => <BarCell value={value} max={maxQ} />,
      },
      {
        field: "opp",
        headerName: "Potencjał",
        headerTooltip: "Wyświetlenia × waga pozycji; kropki = ranga w wybranym okresie (5 = najlepsze 10%)",
        width: 130,
        sort: "desc",
        ...numeric,
        cellRenderer: ({ data }: { data?: QueryRow }) =>
          data && <Dots value={data.dots} label={`${data.oppLabel} (${fmtInt(Math.round(data.opp))})`} />,
      },
    ],
    [maxQ],
  );

  const pageColumns = useMemo<ColDef<GscRow>[]>(
    () => [
      {
        field: "key",
        headerName: "Strona",
        flex: 1,
        minWidth: 260,
        cellRenderer: ({ value }: { value: string }) => (
          <UrlCell href={value} label={value.replace(/^https?:\/\/[^/]+/, "") || "/"} />
        ),
      },
      { field: "clicks", headerName: "Kliknięcia", width: 120, sort: "desc", ...numeric, valueFormatter: ({ value }) => fmtInt(value) },
      {
        field: "impressions",
        headerName: "Wyświetlenia",
        width: 190,
        ...numeric,
        cellRenderer: ({ value }: { value: number }) => <BarCell value={value} max={maxP} color="bg-blue-light-500" />,
      },
      {
        field: "ctr",
        headerName: "CTR",
        width: 100,
        ...numeric,
        valueFormatter: ({ value }) => fmtPct(value),
        cellClassRules: { "text-success-600 dark:text-success-500": ({ value }) => typeof value === "number" && value > 0 },
      },
      {
        field: "position",
        headerName: "Pozycja",
        width: 110,
        ...numeric,
        cellRenderer: ({ value }: { value: number | null }) => <PositionBadge value={value} precision={1} />,
      },
    ],
    [maxP],
  );

  const meta = `okno ${option.range}`;
  const kindSwitch = (
    <Segmented
      label="Rodzaj listy"
      value={kind}
      onChange={setKind}
      options={[
        { value: "frazy", label: `Frazy · ${(queries?.length ?? option.queries).toLocaleString("pl-PL")}` },
        { value: "strony", label: `Strony · ${(pages?.length ?? option.pages).toLocaleString("pl-PL")}` },
      ]}
    />
  );

  return (
    <>
      <SectionHead title="Frazy i strony" meta={meta}>
        {windows.length > 1 && (
          <Segmented
            label="Okres tabel"
            value={active}
            onChange={(value) => {
              setActive(value);
              setSelected(null);
            }}
            options={windows.map((w) => ({ value: w.value, label: w.label }))}
          />
        )}
      </SectionHead>

      {kind === "frazy" && selected && (
        <QueryDetail row={selected} history={history} onClose={() => setSelected(null)} />
      )}

      {kind === "frazy" ? (
        <DataGrid<QueryRow>
          key="frazy"
          title="Frazy w Google"
          meta={
            <span className="inline-flex flex-wrap items-center gap-1">
              {meta} · kliknij frazę, żeby zobaczyć szczegóły ·
              <button
                type="button"
                onClick={() => setHelpOpen((v) => !v)}
                className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-700 dark:text-brand-400"
              >
                <Info className="size-3.5" /> jak liczymy potencjał?
              </button>
            </span>
          }
          rows={queries}
          columns={queryColumns}
          actions={kindSwitch}
          filter
          filterPlaceholder="Szukaj frazy…"
          rowKey={(q) => q.key}
          selectedKey={selected?.key ?? null}
          onRowClicked={openQuery}
          csvName={`${domain}-gsc-frazy-${active}`}
          empty="Lista fraz pojawi się po najbliższym przebiegu collectora (codziennie 6:30)."
        />
      ) : (
        <DataGrid<GscRow>
          key="strony"
          title="Strony w Google"
          meta={meta}
          rows={pages}
          columns={pageColumns}
          actions={kindSwitch}
          filter
          filterPlaceholder="Szukaj adresu…"
          rowKey={(p) => p.key}
          csvName={`${domain}-gsc-strony-${active}`}
          empty="Lista stron pojawi się po najbliższym przebiegu collectora."
        />
      )}
      {kind === "frazy" && helpOpen && (
        <Card className="mt-3 p-5 text-theme-sm text-gray-600 dark:text-gray-400 [&_b]:font-medium [&_b]:text-gray-800 dark:[&_b]:text-white/90">
          <p>
            <b>Wynik bazowy</b> to liczba wyświetleń pomnożona przez wagę pozycji: TOP 3 × 0,35; pozycje 4–20 × 1; 21–50 ×
            0,65; dalsze × 0,32.
          </p>
          <p className="mt-2">
            <b>Kropki pokazują rangę w wybranym okresie</b>: 5 kropek = najlepsze 10% fraz, 4 = kolejne 15%, 3 = kolejne
            25%, 2 = kolejne 25%, 1 = pozostałe 25%. To priorytet względny, nie ocena jakości frazy.
          </p>
        </Card>
      )}
    </>
  );
}

function QueryDetail({
  row,
  history,
  onClose,
}: {
  row: QueryRow;
  history: History | null | "loading" | undefined;
  onClose: () => void;
}) {
  const days = useMemo(() => {
    if (!history || history === "loading") return null;
    const raw = history.series?.[row.key];
    if (!raw?.length) return null;
    const byDate = new Map(raw);
    const values: number[] = [];
    const end = new Date(`${history.window.end}T00:00:00Z`);
    for (let d = new Date(`${history.window.start}T00:00:00Z`); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
      values.push(byDate.get(d.toISOString().slice(0, 10)) ?? 0);
    }
    return values;
  }, [history, row.key]);

  const facts: [string, string][] = [
    ["Kliknięcia", fmtInt(row.clicks)],
    ["CTR", fmtPct(row.ctr)],
    ["Pozycja", fmtNum(row.position, 1)],
    ["Wyświetlenia", fmtInt(row.impressions)],
    ["Potencjał", row.oppLabel],
  ];

  return (
    <Card className="mb-5 p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-theme-xs text-gray-500 dark:text-gray-400">Szczegóły frazy</p>
          <h3 className="truncate text-lg font-medium text-gray-800 dark:text-white/90">{row.key}</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Zamknij szczegóły"
          className="flex size-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5"
        >
          <X className="size-4" />
        </button>
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div>
          <p className="mb-2 text-theme-xs text-gray-500 dark:text-gray-400">Wyświetlenia – ostatnie 14 dni</p>
          {history === "loading" || history === undefined ? (
            <div className="h-20 animate-pulse rounded-lg bg-gray-100 dark:bg-white/5" />
          ) : days ? (
            <Sparkline values={days} last={days.length} color={C.brand} className="h-20 w-full" />
          ) : (
            <p className="flex h-20 items-center text-theme-sm text-gray-500 dark:text-gray-400">
              Brak danych dziennych dla tej frazy.
            </p>
          )}
        </div>
        <dl className="grid grid-cols-3 gap-x-6 gap-y-3 sm:grid-cols-5 lg:grid-cols-3">
          {facts.map(([label, value]) => (
            <div key={label}>
              <dt className="text-theme-xs text-gray-500 dark:text-gray-400">{label}</dt>
              <dd className="text-base font-medium text-gray-800 tabular-nums dark:text-white/90">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Card>
  );
}
