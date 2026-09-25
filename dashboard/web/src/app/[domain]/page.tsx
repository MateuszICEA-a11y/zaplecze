/* Przegląd domeny – port dashboard/app/src/pages/[domain]/index.astro:
   pasek zdrowia źródeł, KPI z 7 dni, trendy z 3 miesięcy, „Co wymaga uwagi". */
import TimeSeriesChart from "@/components/charts/TimeSeriesChart";
import { Card, Note, PageTitle, SectionHead, StatCard, StatGrid } from "@/components/ui";
import { cn } from "@/lib/cn";
import {
  latestSnapshot,
  latestWithDelta,
  latestWithDeltaFrom,
  loadConfig,
  loadDetails,
  loadSnapshots,
  metricSeries,
  metricSeriesFrom,
  sourceStatuses,
} from "@/lib/data";
import { fmtDate, fmtInt } from "@/lib/format";
import { LEGACY_URL } from "@/lib/nav";
import { cutoffFor, deltaPct, fmtShort, lastOk, plural, stripOrigin, trimTo } from "@/lib/metrics";
import { C, SOURCE_COLOR } from "@/lib/palette";
import { CircleCheck, Search, TriangleAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const dynamicParams = false;

export function generateStaticParams() {
  return loadConfig().domains.map((d) => ({ domain: d.id }));
}

type Props = { params: Promise<{ domain: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { domain } = await params;
  return { title: `${domain} – przegląd` };
}

const HEALTH_LABELS: [string, string][] = [
  ["senuto", "Senuto"],
  ["gsc", "GSC"],
  ["ahrefs", "Ahrefs"],
  ["ga4", "GA4"],
  ["clarity", "Clarity"],
  ["bing", "Bing"],
];

export default async function DomainOverview({ params }: Props) {
  const { domain } = await params;
  const snapshots = loadSnapshots(domain);
  const latest = latestSnapshot(domain);
  const details = loadDetails(domain);
  const statuses = sourceStatuses(latest);

  const linkSpec = (field: string): [string, string][] => [
    ["ahrefs", field],
    ["backlinks", field],
  ];
  const top3 = metricSeries(snapshots, "senuto", "top3");
  const top10 = metricSeries(snapshots, "senuto", "top10");
  const top50 = metricSeries(snapshots, "senuto", "top50");
  const backlinks = metricSeriesFrom(snapshots, linkSpec("backlinks"));
  const refDomains = metricSeriesFrom(snapshots, linkSpec("referring_domains"));
  const gscClicks = metricSeries(snapshots, "gsc", "clicks");
  const gscImpressions = metricSeries(snapshots, "gsc", "impressions");

  const statTop10 = latestWithDelta(snapshots, "senuto", "top10");
  const statClicks = latestWithDelta(snapshots, "gsc", "clicks");
  const statImpressions = latestWithDelta(snapshots, "gsc", "impressions");
  const statDR = latestWithDelta(snapshots, "ahrefs", "domain_rating", 30);
  const statRefDomains = latestWithDeltaFrom(snapshots, linkSpec("referring_domains"));
  const statSessions = latestWithDelta(snapshots, "clarity", "sessions");

  const drHistory = metricSeries(snapshots, "ahrefs", "domain_rating").values.filter(
    (v): v is number => typeof v === "number",
  );
  const drDelta = statDR.delta ?? (drHistory.length >= 2 ? drHistory.at(-1)! - drHistory[0]! : null);
  const firstRefTs = refDomains.timestamps.find((_, i) => typeof refDomains.values[i] === "number");
  const firstRefDate = firstRefTs
    ? new Date(firstRefTs * 1000).toLocaleDateString("pl-PL", { timeZone: "UTC", day: "2-digit", month: "2-digit" })
    : null;

  /* Trendy: ostatnie 3 miesiące realnych serii, nie cały backfill. */
  const cutoff = cutoffFor(91, top10, gscClicks, backlinks);
  const trend = (s: typeof top10) => trimTo(s, cutoff);

  const leads = details.sources.leads?.leads ?? [];
  const weekAgo = Date.now() - 7 * 86400_000;
  const leadsRecent = leads.filter((l) => new Date(l.ts).getTime() >= weekAgo).length;
  const leadsConfigured = statuses.leads != null && statuses.leads.status !== "not_configured";
  const clarityConfigured = statuses.clarity != null && statuses.clarity.status !== "not_configured";

  const health = HEALTH_LABELS.flatMap(([key, label]) => {
    const src = statuses[key];
    if (!src || src.status === "not_configured") return [];
    const tone = src.status === "ok" ? "ok" : src.status === "token_expired" ? "warn" : "err";
    const when =
      src.status === "ok"
        ? fmtShort(latest!.date)
        : src.status === "token_expired"
          ? `token wygasł · ${fmtShort(lastOk(snapshots, key)?.date)}`
          : src.error?.includes("429")
            ? `limit API · ${fmtShort(lastOk(snapshots, key)?.date)}`
            : `błąd · ${fmtShort(lastOk(snapshots, key)?.date)}`;
    return [{ label, tone, when }];
  });

  const clarityDown = clarityConfigured && statuses.clarity?.status !== "ok";
  const clarityLast = clarityDown ? lastOk(snapshots, "clarity") : null;
  const claritySessions = clarityDown
    ? typeof clarityLast?.data.sessions === "number"
      ? clarityLast.data.sessions
      : null
    : statSessions.value;

  /* „Co wymaga uwagi" – automatyczne sygnały z danych szczegółowych. */
  const compare = details.sources.gsc?.compare;
  const cmpPeriod = compare?.qoq ?? compare?.yoy ?? null;
  const cmpKind = compare?.qoq ? "kw/kw" : "r/r";
  const pageDrops = (cmpPeriod?.pages ?? [])
    .map((r) => ({ key: r.key, dClicks: r.clicks - r.prev_clicks }))
    .filter((r) => r.dClicks < 0)
    .sort((a, b) => a.dClicks - b.dClicks);
  const dropsTotal = pageDrops.reduce((s, r) => s + r.dClicks, 0);
  const topDrop = pageDrops[0] ?? null;

  const gscQueries = details.sources.gsc?.windows?.["30d"]?.queries ?? details.sources.gsc?.queries ?? [];
  const nearTop = gscQueries.filter(
    (q) => typeof q.position === "number" && q.position > 10 && q.position <= 20 && q.impressions > 0,
  );

  const idxRows = details.sources.indexing?.rows ?? [];
  const idxDone = idxRows.filter((r) => r.indexed).length;
  const idxPct = idxRows.length > 0 ? Math.round((idxDone / idxRows.length) * 100) : null;
  const notIndexed = idxRows.filter((r) => !r.indexed);
  const segOf = (url: string) => {
    const seg = stripOrigin(url).split("/").filter(Boolean)[0];
    return seg ? `/${seg}/` : "strona główna";
  };
  const missBySeg = new Map<string, number>();
  notIndexed.forEach((r) => missBySeg.set(segOf(r.url), (missBySeg.get(segOf(r.url)) ?? 0) + 1));
  const topMissSeg = [...missBySeg.entries()].sort((a, b) => b[1] - a[1])[0] ?? null;

  /* 5 kart w rzędzie, 6 → 3×2, 7 → 4+3. */
  const kpiCount = 5 + Number(clarityConfigured) + Number(leadsConfigured);
  const kpiCols = kpiCount === 5 ? 5 : kpiCount === 6 ? 3 : 4;

  const hasAttention = pageDrops.length > 0 || nearTop.length > 0 || idxRows.length > 0;
  const legacy = (section: string) => `${LEGACY_URL}/${domain}/${section}/`;

  return (
    <>
      <PageTitle title={domain} meta={latest ? `Ostatni pomiar collectora: ${fmtDate(latest.date)}` : "Brak pomiarów"}>
        {health.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {health.map((h) => (
              <span
                key={h.label}
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-theme-xs dark:border-gray-800 dark:bg-white/3"
              >
                <span
                  className={cn(
                    "size-2 rounded-full",
                    h.tone === "ok" ? "bg-success-500" : h.tone === "warn" ? "bg-warning-500" : "bg-error-500",
                  )}
                />
                <b className="font-medium text-gray-800 dark:text-white/90">{h.label}</b>
                <span className="text-gray-500 dark:text-gray-400">{h.when}</span>
              </span>
            ))}
          </div>
        )}
      </PageTitle>

      <Note>
        Stan źródeł, najważniejsze wskaźniki z ostatnich 7 dni i trendy z 3 miesięcy. Gdy źródło nie odpowiada, karta
        pokazuje ostatni udany pomiar. Wykryte problemy są na dole strony.
      </Note>

      <SectionHead title="Najważniejsze wskaźniki" meta="porównanie 7-dniowe" />
      <StatGrid cols={kpiCols}>
        <StatCard
          label="Wyświetlenia / dzień · GSC"
          value={statImpressions.value}
          delta={deltaPct(statImpressions.value, statImpressions.delta)}
          deltaUnit="%"
          precision={1}
          trend={gscImpressions.values}
          color={SOURCE_COLOR.gsc}
          href={`/${domain}/gsc/`}
          hero
        />
        <StatCard
          label="Kliknięcia / dzień · GSC"
          value={statClicks.value}
          delta={statClicks.delta}
          trend={gscClicks.values}
          color={SOURCE_COLOR.gsc}
          href={`/${domain}/gsc/`}
        />
        <StatCard
          label="Frazy w TOP 10 · Senuto"
          value={statTop10.value}
          delta={statTop10.delta}
          trend={top10.values}
          color={SOURCE_COLOR.senuto}
          href={`/${domain}/senuto/`}
        />
        <StatCard
          label="Domain Rating · Ahrefs"
          value={statDR.value}
          delta={drDelta}
          deltaLabel=""
          precision={1}
          color={SOURCE_COLOR.ahrefs}
        />
        <StatCard
          label="Domeny linkujące · Ahrefs"
          value={statRefDomains.value}
          delta={statRefDomains.delta}
          emptyDeltaLabel={firstRefDate ? `zbieramy od ${firstRefDate}` : "zbieramy dane"}
          color={SOURCE_COLOR.ahrefs}
        />
        {clarityConfigured && (
          <StatCard
            label="Sesje · Clarity (3 dni)"
            value={claritySessions}
            delta={clarityDown ? null : statSessions.delta}
            staleDate={clarityDown ? fmtShort(clarityLast?.date) : null}
            staleReason={clarityDown && statuses.clarity?.error?.includes("429") ? "limit API" : undefined}
            color={SOURCE_COLOR.clarity}
          />
        )}
        {leadsConfigured && <StatCard label="Leady · 7 dni" value={leadsRecent} color={SOURCE_COLOR.leads} />}
      </StatGrid>

      <SectionHead title="Trendy" meta="3 miesiące" />
      <div className="grid grid-cols-1 gap-4 md:gap-5 xl:grid-cols-3">
        <TimeSeriesChart
          title="Frazy w TOP 3 / 10 / 50"
          meta="Senuto"
          timestamps={trend(top10).timestamps}
          series={[
            { label: "TOP 3", values: trend(top3).values, color: C.success },
            { label: "TOP 10", values: trend(top10).values, color: C.brand, fill: true },
            { label: "TOP 50", values: trend(top50).values, color: C.gray, dashed: true },
          ]}
        />
        <TimeSeriesChart
          title="Kliknięcia i wyświetlenia"
          meta="GSC · dziennie"
          timestamps={trend(gscClicks).timestamps}
          series={[
            { label: "Kliknięcia", values: trend(gscClicks).values, color: C.brand, fill: true },
            { label: "Wyświetlenia", values: trend(gscImpressions).values, color: C.sky, dashed: true },
          ]}
          secondaryAxis
        />
        <TimeSeriesChart
          title="Backlinki i domeny linkujące"
          meta="Ahrefs"
          timestamps={trend(backlinks).timestamps}
          series={[
            { label: "Backlinki", values: trend(backlinks).values, color: C.orange, fill: true },
            { label: "Domeny", values: trend(refDomains).values, color: C.violet, dashed: true },
          ]}
          secondaryAxis
          emptyTitle="Backlinki – zbieramy historię"
          emptyDescription={`Ahrefs zwraca stan bieżący (DR ${fmtInt(statDR.value)} · ${fmtInt(statRefDomains.value)} domen). Wykres pojawi się po drugim pomiarze.`}
        />
      </div>

      {hasAttention && (
        <>
          <SectionHead title="Co wymaga uwagi" meta="automatyczne sygnały z ostatniego okna" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
            {pageDrops.length > 0 && (
              <AttentionCard
                tone="err"
                icon={<TriangleAlert className="size-5" />}
                title="Spadki ruchu"
                big={`${fmtInt(pageDrops.length)} ${plural(pageDrops.length, "strona", "strony", "stron")}`}
                link={{ href: legacy("matrix"), label: "Otwórz dekodowanie spadków", external: true }}
              >
                Straciły łącznie <b>{fmtInt(Math.abs(dropsTotal))} kliknięć</b> {cmpKind}.
                {topDrop && (
                  <>
                    {" "}
                    Najwięcej: <b className="break-all">{stripOrigin(topDrop.key)}</b> ({fmtInt(topDrop.dClicks)}).
                  </>
                )}
              </AttentionCard>
            )}
            {nearTop.length > 0 && (
              <AttentionCard
                tone="warn"
                icon={<Search className="size-5" />}
                title="Blisko TOP"
                big={`${fmtInt(nearTop.length)} ${plural(nearTop.length, "fraza", "frazy", "fraz")}`}
                link={{ href: `/${domain}/gsc/`, label: "Zobacz frazy z potencjałem" }}
              >
                Na pozycjach 11–20 z realnym popytem – najbliżej awansu do TOP 10. Priorytet contentowy.
              </AttentionCard>
            )}
            {idxPct !== null && (
              <AttentionCard
                tone={idxPct >= 90 ? "ok" : "warn"}
                icon={<CircleCheck className="size-5" />}
                title="Indeksacja"
                big={`${idxPct}%`}
                link={{ href: legacy("matrix"), label: "Otwórz Matrix", external: true }}
              >
                {fmtInt(idxDone)} z {fmtInt(idxRows.length)} adresów w indeksie Google.
                {notIndexed.length > 0 && topMissSeg && (
                  <>
                    {" "}
                    {fmtInt(notIndexed.length)} poza – głównie <b>{topMissSeg[0]}</b>.
                  </>
                )}
              </AttentionCard>
            )}
          </div>
        </>
      )}
    </>
  );
}

const TONES = {
  ok: "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500",
  warn: "bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-warning-400",
  err: "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500",
};

function AttentionCard({
  tone,
  icon,
  title,
  big,
  link,
  children,
}: {
  tone: keyof typeof TONES;
  icon: React.ReactNode;
  title: string;
  big: string;
  link: { href: string; label: string; external?: boolean };
  children: React.ReactNode;
}) {
  return (
    <Card className="flex flex-col p-5">
      <div className="flex items-center gap-3">
        <span className={cn("flex size-10 items-center justify-center rounded-xl", TONES[tone])}>{icon}</span>
        <span className="text-theme-sm font-medium text-gray-500 dark:text-gray-400">{title}</span>
      </div>
      <div className="mt-4 text-title-sm font-semibold text-gray-800 dark:text-white/90">{big}</div>
      <p className="mt-2 flex-1 text-theme-sm text-gray-600 dark:text-gray-400 [&_b]:font-medium [&_b]:text-gray-800 dark:[&_b]:text-white/90">
        {children}
      </p>
      {link.external ? (
        <a href={link.href} target="_blank" rel="noopener" className="mt-4 text-theme-sm font-medium text-brand-500 hover:text-brand-600">
          {link.label} ↗
        </a>
      ) : (
        <Link href={link.href} className="mt-4 text-theme-sm font-medium text-brand-500 hover:text-brand-600">
          {link.label} →
        </Link>
      )}
    </Card>
  );
}
