/* Google Search Console – port dashboard/app/src/pages/[domain]/gsc.astro:
   KPI dzienne, wykresy, „Co spadło" (kw/kw, r/r), frazy z potencjałem i strony
   z przełącznikiem okresu. */
import TimeSeriesChart from "@/components/charts/TimeSeriesChart";
import { PageTitle, SectionHead, SourceState, StatCard, StatGrid } from "@/components/ui";
import {
  type GscCompareRow,
  isTemporarySourceFailure,
  latestSnapshot,
  latestWithDelta,
  loadConfig,
  loadDetails,
  loadSnapshots,
  metricSeries,
  sectionEnabled,
  sourceStatuses,
} from "@/lib/data";
import { fmtDate, fmtDateRange, fmtInt, fmtNum } from "@/lib/format";
import { cutoffFor, lastOk, stripOrigin, trimTo } from "@/lib/metrics";
import { C, SOURCE_COLOR } from "@/lib/palette";
import type { Metadata } from "next";
import { GSC_WINDOWS } from "@/lib/gsc";
import GscDrops, { type DropMode } from "./GscDrops";
import GscTables from "./GscTables";

export const dynamicParams = false;

export function generateStaticParams() {
  return loadConfig()
    .domains.filter((d) => sectionEnabled(d, "gsc"))
    .map((d) => ({ domain: d.id }));
}

type Props = { params: Promise<{ domain: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `${(await params).domain} – Google Search Console` };
}

const WINDOW_LABELS: Record<string, string> = {
  "7d": "7 dni",
  "30d": "30 dni",
  "3m": "3 mies.",
  "6m": "6 mies.",
  "12m": "12 mies.",
  "16m": "16 mies.",
};

function dropPanel(rows: GscCompareRow[], isPage: boolean) {
  const withDelta = rows.map((r) => ({ ...r, dImpr: r.impressions - r.prev_impressions }));
  const drops = withDelta.filter((r) => r.dImpr < 0).sort((a, b) => a.dImpr - b.dImpr);
  return {
    dropCount: drops.length,
    gainCount: withDelta.filter((r) => r.dImpr > 0).length,
    rows: drops.slice(0, 6).map((r) => ({
      name: isPage ? stripOrigin(r.key) : r.key,
      delta: `${fmtInt(Math.abs(r.dImpr))} wyśw.`,
      flow: `${fmtInt(r.prev_impressions)} → ${fmtInt(r.impressions)} · poz. ${fmtNum(r.prev_position, 1)} → ${fmtNum(r.position, 1)}`,
    })),
  };
}

export default async function GscPage({ params }: Props) {
  const { domain } = await params;
  const snapshots = loadSnapshots(domain);
  const latest = latestSnapshot(domain);
  const gscDetails = loadDetails(domain).sources.gsc;

  const clicks = metricSeries(snapshots, "gsc", "clicks");
  const impressions = metricSeries(snapshots, "gsc", "impressions");
  const position = metricSeries(snapshots, "gsc", "position");
  const queriesSeries = metricSeries(snapshots, "gsc", "queries");

  /* Wykresy: ostatnie pół roku – pełna historia (od backfillu) jest nieczytelna. */
  const cutoff = cutoffFor(183, clicks);
  const chart = (s: typeof clicks) => trimTo(s, cutoff);

  const statClicks = latestWithDelta(snapshots, "gsc", "clicks");
  const statImpressions = latestWithDelta(snapshots, "gsc", "impressions");
  const statCtr = latestWithDelta(snapshots, "gsc", "ctr");
  const statPosition = latestWithDelta(snapshots, "gsc", "position");
  const statQueries = latestWithDelta(snapshots, "gsc", "queries");

  const gsc = sourceStatuses(latest).gsc;
  const dataDate = gsc?.data?.data_date ?? null;
  const lastGood = lastOk(snapshots, "gsc");
  const staleDate = isTemporarySourceFailure(gsc) && lastGood ? fmtDate(lastGood.date) : null;

  const windows = gscDetails?.windows;
  const windowOptions = GSC_WINDOWS.filter((k) => windows?.[k]).map((k) => ({
    value: k as string,
    label: WINDOW_LABELS[k],
    range: fmtDateRange(windows![k].start, windows![k].end),
    queries: windows![k].queries.length,
    pages: windows![k].pages.length,
  }));
  if (!windowOptions.length && gscDetails?.window) {
    windowOptions.push({
      value: "30d",
      label: WINDOW_LABELS["30d"],
      range: fmtDateRange(gscDetails.window.start, gscDetails.window.end),
      queries: gscDetails.queries.length,
      pages: gscDetails.pages.length,
    });
  }

  const compare = gscDetails?.compare;
  const dropModes: DropMode[] = (
    [
      { id: "qoq", short: "3 mies. vs 3 mies.", label: "Ostatnie 3 mies. vs poprzednie 3 mies.", data: compare?.qoq },
      { id: "yoy", short: "3 mies. vs rok temu", label: "Ostatnie 3 mies. vs ten sam okres rok temu", data: compare?.yoy },
    ] as const
  )
    .filter((m) => m.data && compare)
    .map((m) => ({
      id: m.id,
      short: m.short,
      meta: `${m.label} · ${fmtDateRange(m.data!.prev.start, m.data!.prev.end)} vs ${fmtDateRange(compare!.cur.start, compare!.cur.end)} · sortowane wg największego spadku wyświetleń`,
      queries: dropPanel(m.data!.queries ?? [], false),
      pages: dropPanel(m.data!.pages ?? [], true),
    }));

  return (
    <>
      <PageTitle
        title="Google Search Console"
        meta={dataDate ? `Dzienne metryki z ${fmtDate(String(dataDate))} (opóźnienie GSC ~3 dni)` : undefined}
      />
      <SourceState
        name="GSC"
        status={gsc?.status}
        error={gsc?.error}
        temporary={isTemporarySourceFailure(gsc)}
        lastDate={lastGood?.date}
      />

      <SectionHead title="Ruch z wyszukiwarki" meta="porównanie 7-dniowe" />
      <StatGrid cols={5}>
        <StatCard
          label="Kliknięcia / dzień"
          value={statClicks.value}
          delta={statClicks.delta}
          trend={clicks.values}
          color={SOURCE_COLOR.gsc}
          staleDate={staleDate}
          hero
        />
        <StatCard
          label="Wyświetlenia / dzień"
          value={statImpressions.value}
          delta={statImpressions.delta}
          trend={impressions.values}
          color={C.sky}
          staleDate={staleDate}
        />
        <StatCard label="CTR" value={statCtr.value} delta={statCtr.delta} unit="%" precision={2} staleDate={staleDate} />
        <StatCard
          label="Średnia pozycja"
          value={statPosition.value}
          delta={statPosition.delta}
          precision={1}
          goodWhen="down"
          trend={position.values}
          color={C.violet}
          staleDate={staleDate}
        />
        <StatCard
          label="Frazy z wyświetleniami"
          value={statQueries.value}
          delta={statQueries.delta}
          trend={queriesSeries.values}
          color={C.teal}
          staleDate={staleDate}
        />
      </StatGrid>

      <div className="mt-5 grid grid-cols-1 gap-4 md:gap-5 xl:grid-cols-3">
        <TimeSeriesChart
          title="Kliknięcia i wyświetlenia"
          meta="dziennie · 6 mies."
          timestamps={chart(clicks).timestamps}
          series={[
            { label: "Kliknięcia", values: chart(clicks).values, color: C.brand, fill: true },
            { label: "Wyświetlenia", values: chart(impressions).values, color: C.sky, dashed: true },
          ]}
          secondaryAxis
        />
        <TimeSeriesChart
          title="Średnia pozycja"
          meta="niżej = lepiej · 6 mies."
          timestamps={chart(position).timestamps}
          series={[{ label: "Pozycja", values: chart(position).values, color: C.violet, fill: true }]}
          precision={1}
          invert
        />
        <TimeSeriesChart
          title="Frazy z wyświetleniami"
          meta="dziennie · 6 mies."
          timestamps={chart(queriesSeries).timestamps}
          series={[{ label: "Frazy", values: chart(queriesSeries).values, color: C.teal, fill: true }]}
        />
      </div>

      {dropModes.length > 0 && <GscDrops modes={dropModes} />}

      {windowOptions.length > 0 && <GscTables domain={domain} windows={windowOptions} />}
    </>
  );
}
