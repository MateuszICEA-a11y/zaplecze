"use client";

/* Kolumny potencjału wpisów konkurencji (collector: competitor_potential.py) i okno
   „Statystyki wpisu”. rank – frazy adresu z Senuto (raz w tygodniu), estimate –
   szacunek z frazy głównej dla wpisów do 90 dni bez frazy w TOP10. Wspólne dla
   asystenta i Content Writera. Lista fraz wpisu (competitor-keywords.json) jest
   wczytywana dopiero po otwarciu okna. */
import DataGrid from "@/components/grid/DataGrid";
import { PositionBadge } from "@/components/grid/cells";
import { fmtInt } from "@/lib/format";
import type { ColDef } from "ag-grid-community";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;
export type KeywordRow = [string, number, number, number];

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

const countColumn = (key: "top3" | "top10" | "top50", headerName: string): ColDef<Any> => ({
  headerName,
  colId: key,
  width: 68,
  minWidth: 60,
  type: "rightAligned",
  valueGetter: ({ data }) => (data?.rank ? (data.rank[key] ?? null) : null),
  valueFormatter: ({ value }) => (value === null ? "–" : fmtInt(value)),
});

/** `onDetails` otwiera okno „Statystyki wpisu” (CompetitorDetailDialog). */
export function competitorPotentialColumns(onDetails: (item: Any) => void): ColDef<Any>[] {
  return [
    {
      headerName: "Frazy",
      colId: "keywords",
      width: 76,
      minWidth: 70,
      type: "rightAligned",
      headerTooltip: "Frazy adresu w Senuto (TOP50). Klik – statystyki wpisu i lista fraz.",
      valueGetter: ({ data }) => data?.rank?.keywords ?? null,
      cellRenderer: ({ data, value }: { data?: Any; value: number | null }) => (
        <button
          type="button"
          onClick={() => onDetails(data)}
          className="text-brand-600 tabular-nums underline decoration-dotted underline-offset-2 hover:text-brand-700 dark:text-brand-400"
          title="Statystyki wpisu"
        >
          {value === null ? "–" : fmtInt(value)}
        </button>
      ),
    },
    countColumn("top3", "TOP3"),
    countColumn("top10", "TOP10"),
    countColumn("top50", "TOP50"),
    {
      headerName: "Ruch / mies.",
      colId: "traffic",
      width: 150,
      headerTooltip: "Szacowany ruch z Senuto: suma widoczności fraz adresu w TOP10. Odświeżane raz w tygodniu.",
      valueGetter: ({ data }) => data?.rank?.traffic ?? null,
      cellRenderer: ({ data, value }: { data?: Any; value: number | null }) => {
        if (value === null) return <span className="text-gray-400">–</span>;
        const rank = data.rank;
        const sub = rank.keyword ? `${rank.keyword} (${rank.position}.)` : rank.keywords ? `${fmtInt(rank.keywords)} fraz poza TOP10` : "brak fraz w Senuto";
        return <Stacked main={fmtInt(Math.round(value))} sub={sub} title={`dane z Senuto z ${rank.at}`} />;
      },
    },
    {
      headerName: "Potencjał",
      colId: "potential",
      width: 150,
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

// Jedno pobranie listy fraz na sesję strony – plik ma ~1–2 MB.
const keywordFiles = new Map<string, Promise<Record<string, KeywordRow[]>>>();
export function loadKeywords(domain: string) {
  if (!keywordFiles.has(domain)) {
    keywordFiles.set(
      domain,
      fetch(`/${domain}/content-writer/competitor-keywords.json`)
        .then((r) => (r.ok ? r.json() : { items: {} }))
        .then((d) => d.items ?? {})
        .catch(() => {
          keywordFiles.delete(domain);
          return {};
        }),
    );
  }
  return keywordFiles.get(domain)!;
}

const keywordColumns: ColDef<KeywordRow>[] = [
  { headerName: "Fraza", colId: "kw", flex: 1, minWidth: 220, valueGetter: ({ data }) => data?.[0] },
  { headerName: "Pozycja", colId: "pos", width: 110, valueGetter: ({ data }) => data?.[1], cellRenderer: ({ value }: { value: number }) => <PositionBadge value={value} /> },
  { headerName: "Wyszukiwania", colId: "searches", width: 140, type: "rightAligned", valueGetter: ({ data }) => data?.[2], valueFormatter: ({ value }) => fmtInt(value) },
  { headerName: "Ruch", colId: "traffic", width: 110, type: "rightAligned", sort: "desc", valueGetter: ({ data }) => data?.[3], valueFormatter: ({ value }) => fmtInt(Math.round(value)) },
];

export function CompetitorDetailDialog({ item, domain, onClose }: { item: Any | null; domain: string; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [keywords, setKeywords] = useState<KeywordRow[] | null>(null);

  useEffect(() => {
    if (item && !ref.current?.open) ref.current?.showModal();
    if (!item && ref.current?.open) ref.current.close();
    if (!item) return;
    let alive = true;
    setKeywords(null);
    loadKeywords(domain).then((all) => alive && setKeywords(all[item.url] ?? []));
    return () => {
      alive = false;
    };
  }, [item, domain]);

  const rank = item?.rank;
  const potential = potentialOf(item);
  const tiles: [string, string, string?][] = item
    ? [
        ["Ruch / mies.", rank ? fmtInt(Math.round(rank.traffic)) : "–", "suma widoczności fraz w TOP10"],
        [
          "Potencjał",
          potential.value === null ? "–" : `${potential.estimate ? "~" : ""}${fmtInt(potential.value)}`,
          potential.estimate ? "szacunek z frazy głównej" : "wyszukiwań / mies. (poz. 1–20)",
        ],
        ["Frazy", rank ? fmtInt(rank.keywords) : "–", "w TOP50 Senuto"],
        ["TOP3", rank ? fmtInt(rank.top3 ?? 0) : "–"],
        ["TOP10", rank ? fmtInt(rank.top10) : "–"],
        ["TOP50", rank ? fmtInt(rank.top50 ?? rank.keywords) : "–"],
      ]
    : [];

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-auto max-h-[calc(100vh-32px)] w-[min(1000px,calc(100vw-32px))] rounded-lg border border-gray-200 bg-white p-0 text-gray-800 backdrop:bg-gray-950/70 dark:border-gray-800 dark:bg-gray-900 dark:text-white/90"
    >
      {item && (
        <>
          <header className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5 dark:border-gray-800">
            <div className="min-w-0">
              <p className="text-theme-xs text-brand-600 dark:text-brand-400">
                {item.host}
                {item.published ? ` · opublikowano ${item.published}` : ""}
              </p>
              <h2 className="mt-1 text-xl font-medium">{item.title}</h2>
              <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-theme-sm break-all text-gray-500 hover:text-brand-600 dark:text-gray-400">
                {item.url}
              </a>
            </div>
            <button type="button" onClick={onClose} aria-label="Zamknij" className="flex size-9 shrink-0 items-center justify-center rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5">
              <X className="size-5" />
            </button>
          </header>
          <div className="flex flex-col gap-6 overflow-y-auto p-6">
            <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {tiles.map(([label, value, hint]) => (
                <div key={label} className="rounded bg-gray-50 px-3 py-2.5 dark:bg-white/3">
                  <dt className={muted}>{label}</dt>
                  <dd className="mt-1 text-lg font-medium tabular-nums">{value}</dd>
                  {hint && <dd className={muted}>{hint}</dd>}
                </div>
              ))}
            </dl>
            {rank?.keyword && (
              <p className="text-theme-sm text-gray-600 dark:text-gray-300">
                Najwięcej ruchu daje „{rank.keyword}” ({rank.position}. pozycja). Dane z Senuto z {rank.at}.
              </p>
            )}
            {item.estimate && (
              <p className="rounded border border-gray-200 px-4 py-3 text-theme-sm text-gray-600 dark:border-gray-800 dark:text-gray-300">
                Szacunek dla młodego wpisu: fraza główna „{item.estimate.phrase}” – {item.estimate.searches ?? "brak danych o"} wyszukiwań / mies.,
                z powiązanymi {fmtInt(item.estimate.demand)} ({fmtInt(item.estimate.related)} fraz w bazie Senuto).
              </p>
            )}
            {keywords === null ? (
              <p className={muted}>Wczytuję frazy…</p>
            ) : (
              <DataGrid<KeywordRow>
                title="Frazy wpisu"
                meta="Senuto (baza 2.0), do 100 fraz od największego ruchu"
                rows={keywords}
                columns={keywordColumns}
                filter
                rowKey={(r) => r[0]}
                pageSize={25}
                empty={rank ? "Senuto nie widzi tego adresu na żadną frazę w TOP50." : "Ranking z Senuto jeszcze nie pobrany."}
                csvName={`frazy-${item.host}-${item.url.split("/").filter(Boolean).pop() ?? "wpis"}`}
              />
            )}
          </div>
        </>
      )}
    </dialog>
  );
}
