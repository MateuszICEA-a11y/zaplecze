/* GA4 – port dashboard/app/src/pages/[domain]/ga4.astro: ruch z ostatniej doby,
   nowi/powracający, zaangażowanie, trendy miesięczne, kanały/źródła/strony
   i landing pages. */
import TimeSeriesChart from "@/components/charts/TimeSeriesChart";
import { Card, Note, PageTitle, SectionHead, SourceState, StatCard, StatGrid } from "@/components/ui";
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
import { fmtDate, fmtDateRange, fmtDuration, fmtInt, fmtNum } from "@/lib/format";
import { lastOk } from "@/lib/metrics";
import { C, SOURCE_COLOR } from "@/lib/palette";
import type { Metadata } from "next";
import Ga4Tables from "./Ga4Tables";

export const dynamicParams = false;

export function generateStaticParams() {
  return loadConfig()
    .domains.filter((d) => sectionEnabled(d, "ga4"))
    .map((d) => ({ domain: d.id }));
}

type Props = { params: Promise<{ domain: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `${(await params).domain} – GA4` };
}

const MAIN_CHANNELS = [
  { name: "Organic Search", label: "Organic", color: C.brand },
  { name: "Direct", label: "Direct", color: C.sky },
  { name: "Referral", label: "Referral", color: C.orange },
  { name: "Paid Search", label: "Paid Search", color: C.warning },
  { name: "Organic Social", label: "Social", color: C.violet },
];

export default async function Ga4Page({ params }: Props) {
  const { domain } = await params;
  const snapshots = loadSnapshots(domain);
  const latest = latestSnapshot(domain);
  const ga4Details = loadDetails(domain).sources.ga4;
  const ga4 = sourceStatuses(latest).ga4;
  const lastGood = lastOk(snapshots, "ga4");
  const staleDate = isTemporarySourceFailure(ga4) && lastGood ? fmtDate(lastGood.date) : null;

  const daily = ga4Details?.daily ?? [];
  const monthly = ga4Details?.monthly ?? [];
  const channelsMonthly = ga4Details?.channels_monthly ?? [];

  // Historia dzienna z GA4 Data API; snapshoty zostają fallbackiem dla danych
  // zebranych przed rozszerzeniem collectora.
  type DailyKey = Exclude<keyof (typeof daily)[number], "date">;
  const dailyTs = daily.map((row) => Math.floor(new Date(`${row.date}T00:00:00Z`).getTime() / 1000));
  const dailySeries = (field: DailyKey) => daily.map((row) => Number(row[field] ?? 0));
  const dailyStat = (field: DailyKey) => {
    if (!daily.length) return latestWithDelta(snapshots, "ga4", field);
    const last = daily.at(-1)!;
    const lastTime = new Date(`${last.date}T00:00:00Z`).getTime();
    const reference = [...daily].reverse().find((row) => new Date(`${row.date}T00:00:00Z`).getTime() <= lastTime - 7 * 86400_000);
    const value = Number(last[field]);
    return { value, delta: reference ? value - Number(reference[field]) : null };
  };
  const sessions = daily.length ? { timestamps: dailyTs, values: dailySeries("sessions") } : metricSeries(snapshots, "ga4", "sessions");
  const organic = daily.length
    ? { timestamps: dailyTs, values: dailySeries("organic_sessions") }
    : metricSeries(snapshots, "ga4", "organic_sessions");

  const statSessions = dailyStat("sessions");
  const statUsers = dailyStat("active_users");
  const statNew = dailyStat("new_users");
  const statReturning = dailyStat("returning_users");
  const statOrganic = dailyStat("organic_sessions");
  const statEngRate = dailyStat("engagement_rate");
  const statEngTime = dailyStat("avg_engagement_s");
  const statEngPerUser = dailyStat("engaged_per_user");
  const statPagesPerSession = dailyStat("pages_per_session");
  const dataDate = daily.at(-1)?.date ?? ga4?.data?.data_date ?? null;

  const splitTotal = (statNew.value ?? 0) + (statReturning.value ?? 0);
  const splitNewPct = splitTotal > 0 ? Math.round(((statNew.value ?? 0) / splitTotal) * 100) : 0;

  // Trend miesięczny (25 mies. z Data API) + delta r/r na ostatnim pełnym miesiącu.
  const monthlyTs = monthly.map((m) => Math.floor(Date.UTC(+m.month.slice(0, 4), +m.month.slice(4, 6) - 1, 1) / 1000));
  const lastFull = monthly.length >= 2 ? monthly[monthly.length - 2] : null;
  const lastFullYoY = lastFull ? monthly.find((m) => +m.month === +lastFull.month - 100) : null;
  const yoy = (field: "sessions" | "users") => (lastFull && lastFullYoY ? lastFull[field] - lastFullYoY[field] : null);
  const signed = (n: number) => `${n > 0 ? "+" : ""}${fmtInt(n)}`;
  const monthlyMeta = [
    monthly.length > 1 ? `${monthly.length} miesięcy` : "historia ruchu",
    lastFull && `ostatni pełny miesiąc: ${lastFull.month.slice(0, 4)}-${lastFull.month.slice(4, 6)}`,
    yoy("sessions") !== null && `sesje r/r: ${signed(yoy("sessions")!)}`,
    yoy("users") !== null && `użytkownicy r/r: ${signed(yoy("users")!)}`,
  ]
    .filter(Boolean)
    .join(" · ");

  const channelSeries = MAIN_CHANNELS.map((ch) => ({
    label: ch.label,
    color: ch.color,
    values: monthly.map((m) => channelsMonthly.find((c) => c.month === m.month && c.channel === ch.name)?.sessions ?? 0),
  }));
  const otherSeries = monthly.map((m) =>
    channelsMonthly
      .filter((c) => c.month === m.month && !MAIN_CHANNELS.some((mc) => mc.name === c.channel))
      .reduce((sum, c) => sum + c.sessions, 0),
  );
  const landing = ga4Details?.landing_pages;

  return (
    <>
      <PageTitle
        title="Google Analytics 4"
        meta={dataDate ? `Pełna doba ${fmtDate(String(dataDate))} · delty 7-dniowe z API GA4` : undefined}
      />
      <SourceState
        name="GA4"
        status={ga4?.status}
        error={ga4?.error}
        temporary={isTemporarySourceFailure(ga4)}
        lastDate={lastGood?.date}
      />
      <Note>
        Ruch z ostatniej pełnej doby: odwiedziny, nowi i powracający użytkownicy, zaangażowanie i trendy miesięczne.
        Kanały, źródła i strony są w jednej tabeli z przełącznikiem.
      </Note>

      <SectionHead title="Ruch w witrynie" meta="porównanie 7-dniowe" />
      <StatGrid cols={4}>
        <StatCard
          label="Sesje / dzień"
          value={statSessions.value}
          delta={statSessions.delta}
          trend={sessions.values}
          color={SOURCE_COLOR.ga4}
          staleDate={staleDate}
          hero
        />
        <StatCard label="Użytkownicy" value={statUsers.value} delta={splitTotal > 0 ? null : statUsers.delta} staleDate={staleDate}>
          {splitTotal > 0 && (
            <div className="mt-3">
              <div className="flex h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-white/5">
                <i className="block bg-brand-500" style={{ width: `${splitNewPct}%` }} />
                <i className="block bg-orange-400" style={{ width: `${100 - splitNewPct}%` }} />
              </div>
              <div className="mt-2 flex justify-between gap-3 text-theme-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-brand-500" />
                  Nowi <b className="font-medium text-gray-800 dark:text-white/90">{fmtInt(statNew.value)}</b>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-orange-400" />
                  Powracający <b className="font-medium text-gray-800 dark:text-white/90">{fmtInt(statReturning.value)}</b>
                </span>
              </div>
            </div>
          )}
        </StatCard>
        <StatCard
          label="Engagement rate"
          value={statEngRate.value}
          delta={statEngRate.delta}
          unit="%"
          precision={1}
          staleDate={staleDate}
        />
        <StatCard
          label="Sesje organiczne"
          value={statOrganic.value}
          delta={statOrganic.delta}
          trend={organic.values}
          color={C.brand}
          staleDate={staleDate}
        />
      </StatGrid>
      <Card className="mt-5 grid grid-cols-1 divide-y divide-gray-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0 dark:divide-gray-800">
        {(
          [
            ["Śr. czas zaangażowania / sesję", fmtDuration(statEngTime.value)],
            ["Strony / sesję", fmtNum(statPagesPerSession.value, 2)],
            ["Engaged sessions / użytkownika", fmtNum(statEngPerUser.value, 2)],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="px-5 py-4">
            <div className="text-theme-xs text-gray-500 dark:text-gray-400">{label}</div>
            <div className="mt-1 text-xl font-semibold text-gray-800 tabular-nums dark:text-white/90">{value}</div>
          </div>
        ))}
      </Card>

      <SectionHead title="Trendy" meta={monthlyMeta} />
      <div className="grid grid-cols-1 gap-4 md:gap-5 xl:grid-cols-2">
        {monthly.length > 1 && (
          <>
            <TimeSeriesChart
              title="Użytkownicy: nowi vs powracający"
              meta="miesięcznie"
              monthly
              timestamps={monthlyTs}
              series={[
                { label: "Nowi", values: monthly.map((m) => m.new_users), color: C.brand, fill: true },
                { label: "Powracający", values: monthly.map((m) => Math.max(0, m.users - m.new_users)), color: C.orange },
              ]}
            />
            <TimeSeriesChart
              title="Sesje per kanał"
              meta="miesięcznie"
              monthly
              timestamps={monthlyTs}
              series={[...channelSeries, { label: "Inne", values: otherSeries, color: C.gray }].filter((s) =>
                s.values.some((v) => v > 0),
              )}
            />
            <TimeSeriesChart
              title="Ruch organiczny"
              meta="miesięcznie"
              monthly
              timestamps={monthlyTs}
              series={[{ label: "Sesje organiczne", values: channelSeries[0].values, color: C.brand, fill: true }]}
            />
          </>
        )}
        <TimeSeriesChart
          title="Sesje i sesje organiczne"
          meta="dziennie"
          timestamps={sessions.timestamps}
          series={[
            { label: "Sesje", values: sessions.values, color: C.sky, fill: true },
            { label: "Organiczne", values: organic.values, color: C.brand },
          ]}
        />
      </div>

      <Ga4Tables
        domain={domain}
        channels={ga4Details?.channels ?? []}
        sources={ga4Details?.sources ?? []}
        pages={ga4Details?.pages ?? []}
        landing={landing?.rows ?? []}
        landingMeta={landing?.window ? `okno ${fmtDateRange(landing.window.start, landing.window.end)}` : undefined}
      />
    </>
  );
}
