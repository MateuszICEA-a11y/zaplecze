/* Content Watcher – port dashboard/app/src/pages/[domain]/content-watcher.astro:
   katalog treści z oceną (wiek × wyniki), filtry kartami i szczegóły wpisu.
   Scoring (lib/watcher-scoring.ts) jest wspólny z Asystentem. */
import { Note, PageTitle } from "@/components/ui";
import { latestSnapshot, loadConfig, loadContentCatalog, loadDetails } from "@/lib/data";
import { fmtDate, fmtInt } from "@/lib/format";
import { LEGACY_URL } from "@/lib/nav";
import { titleFor, type DomainProps } from "@/lib/pages";
import { scoreContent } from "@/lib/watcher-scoring";
import WatcherExplorer from "./WatcherExplorer";

export const dynamicParams = false;
export const generateStaticParams = () =>
  loadConfig()
    .domains.filter((d) => (d.content_watcher as { enabled?: boolean } | undefined)?.enabled === true)
    .map((d) => ({ domain: d.id }));
export const generateMetadata = titleFor("Content Watcher");

export default async function ContentWatcherPage({ params }: DomainProps) {
  const { domain } = await params;
  const domainConfig = loadConfig().domains.find((d) => d.id === domain)!;
  const latest = latestSnapshot(domain);
  const details = loadDetails(domain);
  const catalog = loadContentCatalog(domainConfig);
  const asOf = latest?.date ?? new Date().toISOString().slice(0, 10);
  const scored = scoreContent({ domainConfig, details, catalog, asOf });
  // Katalog z CMS-a: świeżość z hasha treści, nie z pola `modified` WordPressa.
  const fromCms = (domainConfig.content_watcher as { source?: string } | undefined)?.source === "wordpress";
  const baseline = scored.items.filter((item) => item.hash_baseline).length;

  return (
    <>
      <PageTitle title="Content Watcher" meta={`Katalog i ocena z ${fmtDate(asOf)}`} />
      <Note>
        Artykuły z danymi o indeksacji, ruchu z GSC i GA4 oraz frazach z Senuto. <b>Pilność</b> i <b>wynik</b> podpowiadają,
        które teksty odświeżyć najpierw.
        {fromCms && (
          <>
            {" "}
            Treść pochodzi z WordPressa; „aktualizacja” to data rzeczywistej zmiany tekstu, a nie systemowa data zapisu w CMS-ie.
            {baseline > 0 && ` Dla ${fmtInt(baseline)} wpisów mamy dopiero punkt odniesienia – do pierwszej edycji pokazujemy datę z systemu.`}
          </>
        )}
      </Note>
      <WatcherExplorer
        domain={domain}
        editorBase={fromCms ? `${LEGACY_URL}/${domain}/content-watcher/edytor/?id=` : null}
        items={scored.sortedItems}
        ageBuckets={scored.AGE_BUCKETS.map(({ key, label, hint, range, tone }) => ({ key, label, hint, range, tone }))}
        byAge={scored.byAge}
        byUrgency={scored.byUrgency}
        notIndexed={scored.notIndexed}
        noData={scored.noData}
        withTraffic={scored.withTraffic}
        pillars={scored.pillars}
        partTexts={scored.SCORE_PART_TEXTS}
        medianClicks={scored.medianClicks}
        medianImpressions={scored.medianImpressions}
        minAgeDays={scored.minAgeDays}
      />
    </>
  );
}
