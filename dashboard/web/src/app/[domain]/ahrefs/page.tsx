/* Ahrefs – port dashboard/app/src/pages/[domain]/ahrefs.astro: Domain Rating,
   backlinki, domeny linkujące, rozkład jakości wg DR, trend z dziennych
   snapshotów i lista domen linkujących. */
import BarList from "@/components/BarList";
import TimeSeriesChart from "@/components/charts/TimeSeriesChart";
import { Card, EmptyState, Note, PageTitle, SectionHead, SourceState, StatCard, StatGrid } from "@/components/ui";
import {
  isTemporarySourceFailure,
  latestSnapshot,
  latestWithDelta,
  latestWithDeltaFrom,
  loadDetails,
  loadSnapshots,
  metricSeriesFrom,
  sourceStatuses,
} from "@/lib/data";
import { fmtDate } from "@/lib/format";
import { lastOk } from "@/lib/metrics";
import { domainParams, titleFor, type DomainProps } from "@/lib/pages";
import { C } from "@/lib/palette";
import AhrefsTable from "./AhrefsTable";

export const dynamicParams = false;
export const generateStaticParams = () => domainParams("ahrefs");
export const generateMetadata = titleFor("Ahrefs");

const BUCKETS = [
  { range: "90–100", min: 90, color: "bg-brand-700" },
  { range: "70–89", min: 70, color: "bg-brand-500" },
  { range: "50–69", min: 50, color: "bg-brand-400" },
  { range: "30–49", min: 30, color: "bg-brand-300" },
  { range: "0–29", min: 0, color: "bg-gray-300 dark:bg-gray-600" },
];

export default async function AhrefsPage({ params }: DomainProps) {
  const { domain } = await params;
  const snapshots = loadSnapshots(domain);
  const latest = latestSnapshot(domain);
  const details = loadDetails(domain);
  const refList = details.sources.ahrefs?.ref_domains ?? [];
  const refSource = details.sources.ahrefs?.ref_domains_source ?? "ahrefs";

  // Ahrefs pierwszego wyboru, DataForSEO fallback (starsze snapshoty).
  const linkSpec = (field: string): [string, string][] => [
    ["ahrefs", field],
    ["backlinks", field],
  ];
  const backlinks = metricSeriesFrom(snapshots, linkSpec("backlinks"));
  const refDomains = metricSeriesFrom(snapshots, linkSpec("referring_domains"));
  const statBacklinks = latestWithDeltaFrom(snapshots, linkSpec("backlinks"));
  const statRefDomains = latestWithDeltaFrom(snapshots, linkSpec("referring_domains"));
  const statDR = latestWithDelta(snapshots, "ahrefs", "domain_rating", 30);
  const statRank = latestWithDelta(snapshots, "ahrefs", "ahrefs_rank", 30);

  const ahrefs = sourceStatuses(latest).ahrefs;
  const lastGood = lastOk(snapshots, "ahrefs");
  const staleDate = isTemporarySourceFailure(ahrefs) && lastGood ? fmtDate(lastGood.date) : null;

  // Historia w API Ahrefs = „Insufficient plan" – szeregi rosną z dziennych
  // snapshotów, wykres pokazujemy od 3 punktów.
  const showCharts = backlinks.values.filter((v) => typeof v === "number").length >= 3;
  const firstDate = snapshots.find((s) => s.sources.ahrefs?.status === "ok")?.date ?? null;
  const collecting = firstDate ? `zbieramy od ${fmtDate(firstDate).slice(0, 5)}` : "zbieramy historię";

  const buckets = BUCKETS.map((b, i) => {
    const max = i === 0 ? 101 : BUCKETS[i - 1].min;
    const value = refList.filter(
      (d) => typeof d.domain_rating === "number" && d.domain_rating >= b.min && d.domain_rating < max,
    ).length;
    return { label: `DR ${b.range}`, value, color: b.color };
  });

  return (
    <>
      <PageTitle title="Ahrefs" meta="Profil linków domeny – stan bieżący i historia z dziennych pomiarów" />
      <SourceState
        name="Ahrefs"
        status={ahrefs?.status}
        error={ahrefs?.error}
        temporary={isTemporarySourceFailure(ahrefs)}
        lastDate={lastGood?.date}
      />
      <Note>
        Domain Rating to bieżąca siła profilu linków w skali 0–100. Historię budujemy z własnych codziennych pomiarów, bo
        obecny pakiet Ahrefs nie udostępnia danych historycznych. Niżej: podział domen linkujących wg <b>DR</b>, liczba
        linków do celu i wiek najstarszego odnośnika.
      </Note>

      <SectionHead title="Profil linków" meta="stan bieżący" />
      <StatGrid cols={4}>
        <StatCard
          label="Domain Rating"
          value={statDR.value}
          max={100}
          delta={statDR.delta}
          deltaLabel="30 dni"
          precision={1}
          color={C.orange}
          staleDate={staleDate}
          hero
        >
          {typeof statDR.value === "number" && (
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-white/5">
              <i className="block h-full rounded-full bg-orange-500" style={{ width: `${Math.min(100, statDR.value)}%` }} />
            </div>
          )}
        </StatCard>
        <StatCard
          label="Backlinki"
          value={statBacklinks.value}
          delta={statBacklinks.delta}
          trend={showCharts ? backlinks.values : undefined}
          emptyDeltaLabel={showCharts ? undefined : collecting}
          color={C.brand}
          staleDate={staleDate}
        />
        <StatCard
          label="Domeny linkujące"
          value={statRefDomains.value}
          delta={statRefDomains.delta}
          trend={showCharts ? refDomains.values : undefined}
          emptyDeltaLabel={showCharts ? undefined : collecting}
          color={C.brandDark}
          staleDate={staleDate}
        />
        <StatCard
          label="Ahrefs Rank"
          value={statRank.value}
          delta={statRank.delta}
          deltaLabel="30 dni"
          goodWhen="down"
          emptyDeltaLabel={showCharts ? undefined : collecting}
          staleDate={staleDate}
        />
      </StatGrid>

      <SectionHead title="Jakość i trend" />
      <div className="grid grid-cols-1 gap-4 md:gap-5 xl:grid-cols-2">
        <Card className="p-5">
          <h3 className="text-base font-medium text-gray-800 dark:text-white/90">Rozkład domen linkujących wg DR</h3>
          <p className="mt-1 mb-5 text-theme-xs text-gray-500 dark:text-gray-400">
            ile linkujących domen w każdym przedziale autorytetu (top {refList.length})
          </p>
          {refList.length > 0 ? (
            <BarList items={buckets} labelWidth="w-20" />
          ) : (
            <EmptyState title="Brak listy domen">Rozkład pojawi się razem z listą domen linkujących.</EmptyState>
          )}
        </Card>
        <TimeSeriesChart
          title="Backlinki i domeny linkujące"
          meta="dziennie"
          timestamps={backlinks.timestamps}
          series={[
            { label: "Backlinki", values: backlinks.values, color: C.brand, fill: true },
            { label: "Domeny", values: refDomains.values, color: C.orange, dashed: true },
          ]}
          secondaryAxis
          emptyTitle="Trend backlinków – zbieramy historię"
          emptyDescription={`API Ahrefs nie udostępnia historii na obecnym planie. Szeregi rosną z dziennych pomiarów${firstDate ? ` (pierwszy: ${fmtDate(firstDate)})` : ""}.`}
        />
      </div>

      <SectionHead title="Domeny linkujące" />
      <AhrefsTable
        rows={refList}
        drLabel={refSource === "dataforseo" ? "Rank (DataForSEO)" : "DR"}
        meta={details.date ? `stan z ${fmtDate(details.date)} · opublikowane linki` : undefined}
        csvName={`${domain}-ahrefs-domeny`}
      />
    </>
  );
}
