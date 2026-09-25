/* Strona startowa – port dashboard/app/src/pages/index.astro: karty domen
   i salda kont (SMSAPI, OpenRouter). */
import TimeSeriesChart from "@/components/charts/TimeSeriesChart";
import { Card, PageTitle, SectionHead, StatCard, StatGrid } from "@/components/ui";
import { cn } from "@/lib/cn";
import { latestSnapshot, latestWithDelta, loadConfig, loadSnapshots, metricSeries } from "@/lib/data";
import { fmtDate } from "@/lib/format";
import { C } from "@/lib/palette";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

const SOURCE_LABELS: Record<string, string> = {
  senuto: "Senuto",
  gsc: "GSC",
  ga4: "GA4",
  bing: "Bing",
  ahrefs: "Ahrefs",
  backlinks: "DataForSEO",
  clarity: "Clarity",
  cloudflare_ai: "Boty AI",
  indexing: "Indeksacja",
  leads: "Leady",
  wordpress: "WordPress",
  competitors: "Konkurencja",
  smsapi: "SMSAPI",
  openrouter: "OpenRouter",
  serpdata: "SerpData",
};

function StatusChips({ sources }: { sources: Record<string, { status: string; error?: string }> }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {Object.entries(sources)
        .filter(([, r]) => r.status !== "not_configured")
        .map(([key, r]) => (
          <span
            key={key}
            title={r.error}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-theme-xs font-medium",
              r.status === "ok"
                ? "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400"
                : r.status === "token_expired"
                  ? "bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400"
                  : "bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400",
            )}
          >
            <span className="size-1.5 rounded-full bg-current" />
            {SOURCE_LABELS[key] ?? key}
          </span>
        ))}
    </div>
  );
}

export default function Home() {
  const { domains } = loadConfig();
  const global = loadSnapshots("_global");
  const globalLatest = latestSnapshot("_global");

  const smsPoints = latestWithDelta(global, "smsapi", "points");
  const smsRemaining = latestWithDelta(global, "smsapi", "sms_remaining");
  const smsCost = latestWithDelta(global, "smsapi", "sms_cost");
  const orRemaining = latestWithDelta(global, "openrouter", "remaining");
  const orUsage = latestWithDelta(global, "openrouter", "total_usage");
  const orProject = latestWithDelta(global, "openrouter", "project_usage");
  const smsSeries = metricSeries(global, "smsapi", "points");
  const orSeries = metricSeries(global, "openrouter", "remaining");
  const orProjectSeries = metricSeries(global, "openrouter", "project_usage");

  return (
    <>
      <PageTitle title="Domeny" meta="Dashboard postępów zaplecza – wybierz domenę, żeby zobaczyć szczegóły." />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
        {domains.map((d) => {
          const latest = latestSnapshot(d.id);
          const snaps = loadSnapshots(d.id);
          const top10 = latestWithDelta(snaps, "senuto", "top10");
          const clicks = latestWithDelta(snaps, "gsc", "clicks");
          return (
            <Link key={d.id} href={`/${d.id}/`} className="group">
              <Card className="h-full p-6 transition group-hover:border-brand-300 group-hover:shadow-theme-md dark:group-hover:border-brand-500/40">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">{d.name}</h2>
                    <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
                      {latest ? `pomiar z ${fmtDate(latest.date)}` : "brak pomiarów"}
                    </p>
                  </div>
                  <span className="flex size-10 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition group-hover:bg-brand-500 group-hover:text-white dark:bg-white/5">
                    <ArrowRight className="size-5" />
                  </span>
                </div>
                <dl className="mt-6 grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-theme-xs text-gray-500 dark:text-gray-400">Frazy w TOP 10</dt>
                    <dd className="mt-1 text-2xl font-semibold text-gray-800 tabular-nums dark:text-white/90">
                      {top10.value?.toLocaleString("pl-PL") ?? "–"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-theme-xs text-gray-500 dark:text-gray-400">Kliknięcia / dzień (GSC)</dt>
                    <dd className="mt-1 text-2xl font-semibold text-gray-800 tabular-nums dark:text-white/90">
                      {clicks.value?.toLocaleString("pl-PL") ?? "–"}
                    </dd>
                  </div>
                </dl>
                <div className="mt-5">
                  <StatusChips sources={latest?.sources ?? {}} />
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      <SectionHead title="Kredyty (konto)" meta={globalLatest ? `stan z ${fmtDate(globalLatest.date)}` : undefined}>
        <StatusChips sources={globalLatest?.sources ?? {}} />
      </SectionHead>
      <StatGrid cols={5}>
        <StatCard label="SMSAPI – punkty" value={smsPoints.value} delta={smsPoints.delta} precision={2} color={C.success} />
        <StatCard
          label={`SMSAPI – zostało ok. SMS-ów${smsCost.value ? ` (${smsCost.value.toLocaleString("pl-PL")} zł/szt.)` : ""}`}
          value={smsRemaining.value}
          delta={smsRemaining.delta}
          color={C.success}
        />
        <StatCard
          label="OpenRouter – pozostało"
          value={orRemaining.value}
          delta={orRemaining.delta}
          unit="$"
          precision={2}
          color={C.violet}
        />
        <StatCard
          label="OpenRouter – zużycie łącznie"
          value={orUsage.value}
          delta={orUsage.delta}
          goodWhen="down"
          unit="$"
          precision={2}
          color={C.violet}
        />
        <StatCard
          label="OpenRouter – klucz projektu"
          value={orProject.value}
          delta={orProject.delta}
          goodWhen="down"
          unit="$"
          precision={2}
          color={C.violet}
        />
      </StatGrid>
      <div className="mt-5 grid grid-cols-1 gap-4 md:gap-5 xl:grid-cols-3">
        <TimeSeriesChart
          title="SMSAPI – saldo punktów"
          meta="dziennie"
          timestamps={smsSeries.timestamps}
          series={[{ label: "Punkty", values: smsSeries.values, color: C.success, fill: true }]}
          precision={2}
        />
        <TimeSeriesChart
          title="OpenRouter – pozostałe kredyty"
          meta="$ · dziennie"
          timestamps={orSeries.timestamps}
          series={[{ label: "Pozostało", values: orSeries.values, color: C.violet, fill: true }]}
          unit="$"
          precision={2}
        />
        <TimeSeriesChart
          title="OpenRouter – zużycie klucza"
          meta="$ · dziennie"
          timestamps={orProjectSeries.timestamps}
          series={[{ label: "Zużycie", values: orProjectSeries.values, color: C.orange, fill: true }]}
          unit="$"
          precision={2}
        />
      </div>
    </>
  );
}
