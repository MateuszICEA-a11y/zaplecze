/* Asystent treści – port dashboard/app/src/pages/[domain]/asystent.astro:
   kreator „co chcesz zrobić?" prowadzący do jednej decyzji (nowy tekst,
   odświeżenie wpisu, luka względem konkurencji). Dane: scoring Content
   Watchera i podpowiedzi fraz z buildu, konkurencja i werdykty z Workera. */
import { PageTitle } from "@/components/ui";
import { latestSnapshot, loadConfig, loadContentCatalog, loadDetails } from "@/lib/data";
import { titleFor, type DomainProps } from "@/lib/pages";
import { scoreContent } from "@/lib/watcher-scoring";
import { suggestGaps } from "@/lib/writer-gaps.js";
import Assistant from "./Assistant";

const on = (feature: unknown) => (feature as { enabled?: boolean } | undefined)?.enabled === true;

export const dynamicParams = false;
export const generateStaticParams = () =>
  loadConfig()
    .domains.filter((d) => on(d.content_watcher) && on(d.content_writer))
    .map((d) => ({ domain: d.id }));
export const generateMetadata = titleFor("Asystent treści");

export default async function AssistantPage({ params }: DomainProps) {
  const { domain } = await params;
  const domainConfig = loadConfig().domains.find((d) => d.id === domain)!;
  const details = loadDetails(domain);
  const asOf = latestSnapshot(domain)?.date ?? new Date().toISOString().slice(0, 10);
  const { sortedItems, byUrgency } = scoreContent({ domainConfig, details, catalog: loadContentCatalog(domainConfig), asOf });
  const writerCfg = (domainConfig.content_writer ?? {}) as { exclude_paths?: string[] };
  const competitorHosts = (((domainConfig.competitors as { sites?: { host: string }[] } | undefined)?.sites) ?? []).map((s) => s.host);

  // Do przeglądarki tylko to, co pokazuje kreator – pełny payload listy CW to megabajty.
  return (
    <>
      <PageTitle title="Asystent treści" meta="Kilka pytań i jedna decyzja: nowy tekst, odświeżenie albo luka względem konkurencji" />
      <Assistant
        domain={domain}
        base={`/${domain}`}
        competitorHosts={competitorHosts}
        urgency={byUrgency}
        posts={sortedItems.map((item) => ({
          id: item.id,
          title: item.title,
          url: item.url,
          urgency: item.urgency,
          age_days: item.age_days,
          clicks: item.clicks,
          impressions: item.impressions,
          reasons: item.reasons.slice(0, 3),
        }))}
        ideas={suggestGaps(details, { excludePaths: writerCfg.exclude_paths ?? [] }).map((row) => ({
          keyword: row.keyword,
          searches: row.searches,
          impressions: row.impressions,
          position: row.position,
          ranking_title: row.ranking_title,
        }))}
      />
    </>
  );
}
