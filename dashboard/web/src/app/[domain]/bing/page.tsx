/* Bing – port dashboard/app/src/pages/[domain]/bing.astro: AI Performance
   (cytowania w Copilot / Bing AI z importu CSV), ruch klasyczny z BWT i frazy
   z przełącznikiem okresu. */
import TimeSeriesChart from "@/components/charts/TimeSeriesChart";
import { Note, PageTitle, SectionHead, SourceState, StatCard, StatGrid } from "@/components/ui";
import {
  isTemporarySourceFailure,
  latestSnapshot,
  latestWithDelta,
  loadBingAiQueries,
  loadDetails,
  loadSnapshots,
  sourceStatuses,
} from "@/lib/data";
import { fmtDate, fmtDateRange } from "@/lib/format";
import { lastOk } from "@/lib/metrics";
import { domainParams, titleFor, type DomainProps } from "@/lib/pages";
import { C } from "@/lib/palette";
import BingAi from "./BingAi";
import BingQueries, { type BingWindow } from "./BingQueries";

export const dynamicParams = false;
export const generateStaticParams = () => domainParams("bing");
export const generateMetadata = titleFor("Bing");

const WINDOW_LABELS: [string, string][] = [
  ["7d", "7 dni"],
  ["30d", "30 dni"],
  ["3m", "3 mies."],
  ["6m", "6 mies."],
  ["12m", "12 mies."],
  ["18m", "18 mies."],
  ["24m", "24 mies."],
];

export default async function BingPage({ params }: DomainProps) {
  const { domain } = await params;
  const snapshots = loadSnapshots(domain);
  const latest = latestSnapshot(domain);
  const details = loadDetails(domain).sources.bing;
  const bing = sourceStatuses(latest).bing;
  const lastGood = lastOk(snapshots, "bing");
  const staleDate = isTemporarySourceFailure(bing) && lastGood ? fmtDate(lastGood.date) : null;
  const traffic = details?.traffic ?? [];

  const statClicks = latestWithDelta(snapshots, "bing", "clicks");
  const statImpressions = latestWithDelta(snapshots, "bing", "impressions");
  const statQueries = latestWithDelta(snapshots, "bing", "queries");
  const apiQueriesDelta = bing?.data?.queries_delta_7d;
  const queriesDelta = typeof apiQueriesDelta === "number" ? apiQueriesDelta : statQueries.delta;
  const dataDate = bing?.data?.data_date ?? null;

  // Historia z details (BWT oddaje ostatnie tygodnie) – bogatsza niż snapshoty.
  const ts = traffic.map((t) => Math.floor(new Date(`${t.date.slice(0, 10)}T00:00:00Z`).getTime() / 1000));
  const clicks = traffic.map((t) => t.clicks);
  const impressions = traffic.map((t) => t.impressions);
  const last = traffic.at(-1) ?? null;
  const weekBefore = last
    ? traffic.find((t) => new Date(`${t.date.slice(0, 10)}T00:00:00Z`).getTime() === new Date(`${last.date.slice(0, 10)}T00:00:00Z`).getTime() - 7 * 86400_000)
    : null;
  const clicksDelta = last && weekBefore ? last.clicks - weekBefore.clicks : statClicks.delta;
  const impressionsDelta = last && weekBefore ? last.impressions - weekBefore.impressions : statImpressions.delta;

  const windowsRaw = details?.queries_windows;
  const windows: BingWindow[] = windowsRaw
    ? WINDOW_LABELS.filter(([k]) => windowsRaw[k]).map(([k, labelText]) => ({
        key: k,
        label: labelText,
        range:
          windowsRaw[k].start && windowsRaw[k].end
            ? `okno ${fmtDateRange(windowsRaw[k].start, windowsRaw[k].end)}`
            : "okres wg BWT (brak dat w API)",
        queries: windowsRaw[k].queries,
      }))
    : [{ key: "all", label: "Wszystkie", range: "okres wg BWT (brak dat w API)", queries: details?.queries ?? [] }];
  const defaultKey = windows.find((w) => w.key === "30d")?.key ?? windows[0].key;

  return (
    <>
      <PageTitle
        title="Bing"
        meta={dataDate ? `Bing Webmaster Tools · ostatni pełny dzień: ${fmtDate(String(dataDate))}` : "Bing Webmaster Tools"}
      />
      <SourceState
        name="Bing"
        status={bing?.status}
        error={bing?.error}
        temporary={isTemporarySourceFailure(bing)}
        lastDate={lastGood?.date}
      />
      <Note>
        Wyróżnikiem tego widoku jest <b>AI Performance</b>: cytowania marki w Copilot i Bing AI, podział intencji i
        zapytania źródłowe (grounding). Bing nie udostępnia ich przez API – dane pochodzą z eksportu CSV, który można
        zaimportować niżej. Pod spodem ruch klasyczny i frazy z BWT.
      </Note>

      <SectionHead title="Ruch z Binga" meta="porównanie 7-dniowe" />
      <StatGrid cols={3}>
        <StatCard
          label="Wyświetlenia / dzień"
          value={statImpressions.value}
          delta={impressionsDelta}
          trend={impressions}
          color={C.brand}
          staleDate={staleDate}
          hero
        />
        <StatCard label="Kliknięcia / dzień" value={statClicks.value} delta={clicksDelta} trend={clicks} color={C.brandDark} staleDate={staleDate} />
        <StatCard
          label={`Frazy w Bing (${windows.find((w) => w.key === defaultKey)?.label ?? "okres BWT"})`}
          value={statQueries.value}
          delta={queriesDelta}
          emptyDeltaLabel="brak porównania z API"
          staleDate={staleDate}
        />
      </StatGrid>

      <BingAi domain={domain} initial={loadBingAiQueries(domain)} />

      <SectionHead title="Ruch klasyczny" meta="kliknięcia i wyświetlenia" />
      <TimeSeriesChart
        title="Kliknięcia i wyświetlenia"
        meta="dziennie"
        timestamps={ts}
        series={[
          { label: "Kliknięcia", values: clicks, color: C.brand, fill: true },
          { label: "Wyświetlenia", values: impressions, color: C.orange, dashed: true },
        ]}
        secondaryAxis
        height={280}
      />

      <BingQueries domain={domain} windows={windows} initial={defaultKey} />
    </>
  );
}
