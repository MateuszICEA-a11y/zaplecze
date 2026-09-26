/* Senuto – port dashboard/app/src/pages/[domain]/senuto.astro: indeks
   widoczności, frazy w TOP 3/10/50 (karty filtrują tabelę), trendy, lista fraz. */
import TimeSeriesChart from "@/components/charts/TimeSeriesChart";
import { Note, PageTitle, SectionHead, SourceState } from "@/components/ui";
import {
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
import { fmtDate } from "@/lib/format";
import { cutoffFor, deltaPct, lastOk, trimTo } from "@/lib/metrics";
import { C } from "@/lib/palette";
import type { Metadata } from "next";
import SenutoExplorer from "./SenutoExplorer";

export const dynamicParams = false;

export function generateStaticParams() {
  return loadConfig()
    .domains.filter((d) => sectionEnabled(d, "senuto"))
    .map((d) => ({ domain: d.id }));
}

type Props = { params: Promise<{ domain: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `${(await params).domain} – Senuto` };
}

export default async function SenutoPage({ params }: Props) {
  const { domain } = await params;
  const snapshots = loadSnapshots(domain);
  const latest = latestSnapshot(domain);
  const details = loadDetails(domain);
  const keywordsCount = details.sources.senuto?.keywords?.length ?? 0;

  const top3 = metricSeries(snapshots, "senuto", "top3");
  const top10 = metricSeries(snapshots, "senuto", "top10");
  const top50 = metricSeries(snapshots, "senuto", "top50");
  const visibility = metricSeries(snapshots, "senuto", "visibility");

  const statVisibility = latestWithDelta(snapshots, "senuto", "visibility");
  const senuto = sourceStatuses(latest).senuto;
  const lastGood = lastOk(snapshots, "senuto");
  const staleDate = isTemporarySourceFailure(senuto) ? (lastGood?.date ?? null) : null;

  const cutoff = cutoffFor(91, top10, visibility);
  const trend = (s: typeof top10) => trimTo(s, cutoff);

  return (
    <>
      <PageTitle title="Senuto" meta="Widoczność organiczna domeny w bazie Senuto (Polska, baza 2.0)" />
      <SourceState
        name="Senuto"
        status={senuto?.status}
        error={senuto?.error}
        temporary={isTemporarySourceFailure(senuto)}
        lastDate={lastGood?.date}
      />
      <Note>
        Indeks widoczności to kluczowy wskaźnik na tym widoku. Karty zakresów (<b>TOP 3, 10 i 50</b>) filtrują tabelę
        z pełnym zestawieniem rankujących fraz. Wyniki możesz sortować według pozycji, jej zmiany, liczby wyszukiwań i
        trudności słowa kluczowego.
      </Note>

      <SenutoExplorer
        domain={domain}
        keywordsCount={keywordsCount}
        staleDate={staleDate ? fmtDate(staleDate) : null}
        meta={details.date ? `stan z ${fmtDate(details.date)} · najlepsze pozycje z pełnej bazy fraz` : undefined}
        stats={{
          visibility: { ...statVisibility, deltaPct: deltaPct(statVisibility.value, statVisibility.delta) },
          top3: latestWithDelta(snapshots, "senuto", "top3"),
          top10: latestWithDelta(snapshots, "senuto", "top10"),
          top50: latestWithDelta(snapshots, "senuto", "top50"),
          rank: latestWithDelta(snapshots, "senuto", "domain_rank"),
        }}
        visibilityTrend={visibility.values}
      >
        <SectionHead title="Trendy" meta="3 miesiące" />
        <div className="grid grid-cols-1 gap-4 md:gap-5 xl:grid-cols-2">
          <TimeSeriesChart
            title="Frazy w TOP 3 / 10 / 50"
            timestamps={trend(top10).timestamps}
            series={[
              { label: "TOP 3", values: trend(top3).values, color: C.brandDark },
              { label: "TOP 10", values: trend(top10).values, color: C.brand, fill: true },
              { label: "TOP 50", values: trend(top50).values, color: C.gray, dashed: true },
            ]}
          />
          <TimeSeriesChart
            title="Indeks widoczności"
            timestamps={trend(visibility).timestamps}
            series={[{ label: "Widoczność", values: trend(visibility).values, color: C.violet, fill: true }]}
            precision={2}
          />
        </div>
      </SenutoExplorer>
    </>
  );
}
