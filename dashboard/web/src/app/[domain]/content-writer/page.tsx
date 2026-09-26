/* Content Writer – port dashboard/app/src/pages/[domain]/content-writer.astro:
   nowy projekt od frazy (z kontrolą „odśwież czy nowy"), podpowiedzi z danych,
   konkurencja z sitemap i lista projektów z D1 (Worker, /api/cw/writer/*). */
import ContentTabs from "@/components/ContentTabs";
import { Note } from "@/components/ui";
import { contentViews } from "@/lib/content";
import { loadConfig, loadDetails } from "@/lib/data";
import { fmtDate } from "@/lib/format";
import { titleFor, type DomainProps } from "@/lib/pages";
import { suggestGaps } from "@/lib/writer-gaps.js";
import WriterWorkspace from "./WriterWorkspace";

export const dynamicParams = false;
export const generateStaticParams = () =>
  loadConfig()
    .domains.filter((d) => (d.content_writer as { enabled?: boolean } | undefined)?.enabled === true)
    .map((d) => ({ domain: d.id }));
export const generateMetadata = titleFor("Treści – nowe teksty");

export default async function ContentWriterPage({ params }: DomainProps) {
  const { domain } = await params;
  const domainConfig = loadConfig().domains.find((d) => d.id === domain);
  const cfg = (domainConfig?.content_writer ?? {}) as { exclude_paths?: string[] };
  const details = loadDetails(domain);
  const suggestions = suggestGaps(details, { excludePaths: cfg.exclude_paths ?? [] });

  return (
    <>
      <ContentTabs domain={domain} active="content-writer" enabled={contentViews(domainConfig)} />
      <Note>
        Nowy artykuł od frazy do szkicu w WordPressie: sprawdzamy konkurencję w wynikach wyszukiwania, przygotowujemy <b>brief do akceptacji</b>, piszemy tekst i
        dopracowujemy go w edytorze.
      </Note>
      <WriterWorkspace
        domain={domain}
        suggestions={suggestions}
        measuredAt={details.date ? fmtDate(details.date) : null}
        base={`/${domain}`}
      />
    </>
  );
}
