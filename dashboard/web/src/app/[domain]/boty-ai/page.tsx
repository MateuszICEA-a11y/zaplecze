/* Boty AI – port dashboard/app/src/pages/[domain]/boty-ai.astro: ruch
   crawlerów AI z logów Cloudflare, grupowanie wg dostawcy, ścieżki z
   odróżnieniem sond skanujących podatności od realnego crawlu. */
import BarList from "@/components/BarList";
import TimeSeriesChart from "@/components/charts/TimeSeriesChart";
import { Card, Note, PageTitle, SectionHead, SourceState, StatCard, StatGrid } from "@/components/ui";
import {
  isTemporarySourceFailure,
  latestSnapshot,
  latestWithDelta,
  loadDetails,
  loadSnapshots,
  metricSeries,
  sourceStatuses,
} from "@/lib/data";
import { fmtDate, fmtInt } from "@/lib/format";
import { lastOk } from "@/lib/metrics";
import { domainParams, titleFor, type DomainProps } from "@/lib/pages";
import { C } from "@/lib/palette";
import BotTables, { type BotRow, type PathRow } from "./BotTables";

export const dynamicParams = false;
export const generateStaticParams = () => domainParams("cloudflare_ai");
export const generateMetadata = titleFor("Boty AI");

/* Mapowanie bot → dostawca AI po nazwie user-agenta. */
const VENDORS: { key: string; name: string; match: RegExp }[] = [
  { key: "anthropic", name: "Anthropic", match: /^claude/i },
  { key: "openai", name: "OpenAI", match: /^(gptbot|oai-|chatgpt)/i },
  { key: "perplexity", name: "Perplexity", match: /^perplexity/i },
  { key: "apple", name: "Apple", match: /^applebot/i },
  { key: "bytedance", name: "ByteDance", match: /^bytespider/i },
  { key: "mistral", name: "Mistral", match: /^mistral/i },
  { key: "common", name: "Common Crawl", match: /^ccbot/i },
  { key: "other", name: "Pozostali", match: /./ },
];
const vendorOf = (bot: string) => VENDORS.find((v) => v.match.test(bot)) ?? VENDORS.at(-1)!;

/* Sondy skanujące podatności (klucze, pliki konfiguracyjne) – nie realny crawl AI. */
const PROBE = /\.(pem|bak|env|s3cfg|zshrc)$|\.vscode|wp-config|config\.php|\/i\.php|test\.php/i;

export default async function BotsPage({ params }: DomainProps) {
  const { domain } = await params;
  const snapshots = loadSnapshots(domain);
  const latest = latestSnapshot(domain);
  const details = loadDetails(domain).sources.cloudflare_ai;
  const ai = sourceStatuses(latest).cloudflare_ai;
  const lastGood = lastOk(snapshots, "cloudflare_ai");
  const staleDate = isTemporarySourceFailure(ai) && lastGood ? fmtDate(lastGood.date) : null;

  const bots = details?.bots ?? [];
  const paths = details?.paths ?? [];
  const requests = metricSeries(snapshots, "cloudflare_ai", "requests");
  const statRequests = latestWithDelta(snapshots, "cloudflare_ai", "requests");
  const statBots = latestWithDelta(snapshots, "cloudflare_ai", "bots");
  const dataDate = ai?.data?.data_date ?? null;
  const topBot = (ai?.data?.top_bot ?? null) as string | null;

  const total = bots.reduce((sum, b) => sum + (b.requests ?? 0), 0);
  const byVendor = new Map<string, { name: string; total: number; bots: { bot: string; requests: number }[] }>();
  for (const b of bots) {
    const v = vendorOf(b.bot);
    const entry = byVendor.get(v.key) ?? { name: v.name, total: 0, bots: [] };
    entry.total += b.requests ?? 0;
    entry.bots.push({ bot: b.bot, requests: b.requests ?? 0 });
    byVendor.set(v.key, entry);
  }
  const vendors = [...byVendor.values()].sort((a, b) => b.total - a.total);
  const vendorCount = vendors.filter((v) => v.name !== "Pozostali").length;
  const topBotVendor = topBot ? vendorOf(topBot).name : null;
  const topBotReq = bots.find((b) => b.bot === topBot)?.requests ?? null;

  const botRows: BotRow[] = bots.map((b) => ({ bot: b.bot, vendor: vendorOf(b.bot).name, requests: b.requests }));
  const pathRows: PathRow[] = paths.map((p) => ({ ...p, probe: PROBE.test(p.path) }));

  return (
    <>
      <PageTitle
        title="Boty AI"
        meta={dataDate ? `Pełna doba ${fmtDate(String(dataDate))} · logi Cloudflare · porównanie 7-dniowe` : "Logi Cloudflare"}
      />
      <SourceState
        name="Cloudflare"
        status={ai?.status}
        error={ai?.error}
        temporary={isTemporarySourceFailure(ai)}
        lastDate={lastGood?.date}
      />
      <Note>
        Boty są grupowane według <b>dostawcy AI</b>, żeby było widać, które firmy czytają serwis i jak często. Lista
        ścieżek oddziela realny crawl od <b>sond skanujących podatności</b> (np. <code>/key.pem</code>,{" "}
        <code>/.zshrc</code>) – to szum bezpieczeństwa, a nie ruch AI.
      </Note>

      <SectionHead title="Ruch crawlerów AI" />
      <StatGrid cols={3}>
        <StatCard
          label="Requesty botów AI / dzień"
          value={statRequests.value}
          delta={statRequests.delta}
          trend={requests.values}
          color={C.brand}
          staleDate={staleDate}
          hero
        />
        <StatCard label="Aktywne boty" value={statBots.value} staleDate={staleDate}>
          {vendorCount > 0 && (
            <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">z {vendorCount} dostawców AI</p>
          )}
        </StatCard>
        <StatCard label="Najaktywniejszy bot" value={topBot} staleDate={staleDate}>
          {topBotVendor && (
            <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
              {topBotVendor}
              {typeof topBotReq === "number" ? ` · ${fmtInt(topBotReq)} req` : ""}
            </p>
          )}
        </StatCard>
      </StatGrid>

      <div className="mt-5">
        <TimeSeriesChart
          title="Requesty crawlerów AI"
          meta="dziennie"
          timestamps={requests.timestamps}
          series={[{ label: "Requesty", values: requests.values, color: C.brand, fill: true }]}
          height={280}
        />
      </div>

      {vendors.length > 0 && (
        <>
          <SectionHead title="Boty wg dostawcy AI" meta={`${bots.length} botów · ${vendorCount} dostawców`} />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 xl:grid-cols-3">
            {vendors.map((v) => (
              <Card key={v.name} className="p-5">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-base font-medium text-gray-800 dark:text-white/90">{v.name}</h3>
                  <span className="text-theme-sm text-gray-500 tabular-nums dark:text-gray-400">
                    {total ? Math.round((v.total / total) * 100) : 0}% ruchu
                  </span>
                </div>
                <p className="mt-2 mb-4 text-title-sm font-medium text-gray-800 tabular-nums dark:text-white/90">
                  {fmtInt(v.total)} <span className="text-base font-normal text-gray-500">req</span>
                </p>
                <BarList
                  labelWidth="w-32"
                  items={v.bots.sort((a, b) => b.requests - a.requests).map((b) => ({ label: b.bot, value: b.requests, hint: b.bot }))}
                />
              </Card>
            ))}
          </div>
        </>
      )}

      <SectionHead title="Szczegóły" />
      <BotTables domain={domain} bots={botRows} paths={pathRows} />
    </>
  );
}
