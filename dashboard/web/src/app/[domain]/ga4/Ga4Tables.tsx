"use client";

/* Tabele GA4: „Ruch wczoraj" (kanały / źródła / strony w jednej karcie
   z przełącznikiem) i landing pages z zaangażowaniem. */
import DataGrid from "@/components/grid/DataGrid";
import { BarCell, MaybeJunk, PctBar } from "@/components/grid/cells";
import Segmented from "@/components/Segmented";
import { SectionHead } from "@/components/ui";
import type { DomainDetails } from "@/lib/data";
import { fmtDuration, fmtInt, fmtNum } from "@/lib/format";
import type { ColDef } from "ag-grid-community";
import { useMemo, useState } from "react";

type Ga4 = NonNullable<DomainDetails["sources"]["ga4"]>;
type Channel = Ga4["channels"][number];
type Source = Ga4["sources"][number];
type Page = Ga4["pages"][number];
type Landing = NonNullable<Ga4["landing_pages"]>["rows"][number];

const numeric = { type: "rightAligned", getQuickFilterText: () => "" } as const;
const intCol = { ...numeric, valueFormatter: ({ value }: { value: number }) => fmtInt(value) };
const maxOf = <T,>(rows: T[], pick: (row: T) => number) => Math.max(0, ...rows.map(pick));

export default function Ga4Tables({
  domain,
  channels,
  sources,
  pages,
  landing,
  landingMeta,
}: {
  domain: string;
  channels: Channel[];
  sources: Source[];
  pages: Page[];
  landing: Landing[];
  landingMeta?: string;
}) {
  const [pane, setPane] = useState<"kanaly" | "zrodla" | "strony">("kanaly");

  const channelCols = useMemo<ColDef<Channel>[]>(() => {
    const max = maxOf(channels, (c) => c.sessions);
    return [
      { field: "channel", headerName: "Kanał", flex: 1, minWidth: 200, cellRenderer: ({ value }: { value: string }) => <MaybeJunk value={value} /> },
      { field: "sessions", headerName: "Sesje", width: 190, sort: "desc", ...numeric, cellRenderer: ({ value }: { value: number }) => <BarCell value={value} max={max} color="bg-blue-light-500" /> },
      { field: "users", headerName: "Użytkownicy", width: 130, ...intCol },
      { field: "pageviews", headerName: "Odsłony", width: 120, ...intCol },
    ];
  }, [channels]);

  const sourceCols = useMemo<ColDef<Source>[]>(() => {
    const max = maxOf(sources, (s) => s.sessions);
    return [
      { field: "source", headerName: "Źródło", flex: 1, minWidth: 200, cellRenderer: ({ value }: { value: string }) => <MaybeJunk value={value} /> },
      { field: "sessions", headerName: "Sesje", width: 190, sort: "desc", ...numeric, cellRenderer: ({ value }: { value: number }) => <BarCell value={value} max={max} color="bg-blue-light-500" /> },
      { field: "users", headerName: "Użytkownicy", width: 130, ...intCol },
    ];
  }, [sources]);

  const pageCols = useMemo<ColDef<Page>[]>(() => {
    const max = maxOf(pages, (p) => p.pageviews);
    return [
      { field: "path", headerName: "Strona", flex: 1, minWidth: 240 },
      { field: "pageviews", headerName: "Odsłony", width: 190, sort: "desc", ...numeric, cellRenderer: ({ value }: { value: number }) => <BarCell value={value} max={max} color="bg-blue-light-500" /> },
      { field: "users", headerName: "Użytkownicy", width: 130, ...intCol },
    ];
  }, [pages]);

  const landingCols = useMemo<ColDef<Landing>[]>(() => {
    const max = maxOf(landing, (l) => l.sessions);
    return [
      { field: "path", headerName: "Landing page", flex: 1, minWidth: 240, cellRenderer: ({ value }: { value: string }) => <MaybeJunk value={value} /> },
      { field: "sessions", headerName: "Sesje", width: 180, sort: "desc", ...numeric, cellRenderer: ({ value }: { value: number }) => <BarCell value={value} max={max} color="bg-blue-light-500" /> },
      {
        field: "engagement_rate",
        headerName: "Engagement rate",
        headerTooltip: "Odsetek sesji zaangażowanych – sesja trwająca >10 s, z konwersją lub z >1 odsłoną strony",
        width: 170,
        ...numeric,
        cellRenderer: ({ value }: { value: number }) => <PctBar value={value} />,
      },
      {
        field: "avg_engagement_s",
        headerName: "Śr. czas zaangaż.",
        headerTooltip: "Średni czas aktywnego zaangażowania użytkownika na stronie w ramach jednej sesji",
        width: 150,
        ...numeric,
        valueFormatter: ({ value }) => fmtDuration(value),
      },
      { field: "pages_per_session", headerName: "Strony / sesję", width: 130, ...numeric, valueFormatter: ({ value }) => fmtNum(value, 2) },
    ];
  }, [landing]);

  const switcher = (
    <Segmented
      label="Lista"
      value={pane}
      onChange={setPane}
      options={[
        { value: "kanaly", label: `Kanały · ${channels.length}` },
        { value: "zrodla", label: `Źródła · ${sources.length}` },
        { value: "strony", label: `Strony · ${pages.length}` },
      ]}
    />
  );

  return (
    <>
      <SectionHead title="Wczoraj – skąd i dokąd" meta="trzy listy w jednym przełączanym widoku" />
      {pane === "kanaly" && (
        <DataGrid<Channel> title="Ruch wczoraj" rows={channels} columns={channelCols} actions={switcher} csvName={`${domain}-ga4-kanaly`} />
      )}
      {pane === "zrodla" && (
        <DataGrid<Source> title="Ruch wczoraj" rows={sources} columns={sourceCols} actions={switcher} filter csvName={`${domain}-ga4-zrodla`} />
      )}
      {pane === "strony" && (
        <DataGrid<Page> title="Ruch wczoraj" rows={pages} columns={pageCols} actions={switcher} filter csvName={`${domain}-ga4-strony`} />
      )}

      <div className="mt-5">
        <DataGrid<Landing>
          title="Landing pages – zaangażowanie"
          meta={landingMeta}
          rows={landing}
          columns={landingCols}
          filter
          filterPlaceholder="Szukaj adresu…"
          csvName={`${domain}-ga4-landing`}
          empty="Dane pojawią się po najbliższym przebiegu collectora."
        />
      </div>
    </>
  );
}
