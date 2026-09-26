/* Content Writer – port dashboard/app/src/pages/[domain]/content-writer.astro:
   nowy projekt od frazy (z kontrolą „odśwież czy nowy"), podpowiedzi z danych,
   konkurencja z sitemap i lista projektów z D1 (Worker, /api/cw/writer/*). */
import { Note, PageTitle } from "@/components/ui";
import { loadConfig, loadDetails } from "@/lib/data";
import { fmtDate } from "@/lib/format";
import { LEGACY_URL } from "@/lib/nav";
import { titleFor, type DomainProps } from "@/lib/pages";
import { suggestGaps } from "@/lib/writer-gaps.js";
import WriterWorkspace from "./WriterWorkspace";

export const dynamicParams = false;
export const generateStaticParams = () =>
  loadConfig()
    .domains.filter((d) => (d.content_writer as { enabled?: boolean } | undefined)?.enabled === true)
    .map((d) => ({ domain: d.id }));
export const generateMetadata = titleFor("Content Writer");

export default async function ContentWriterPage({ params }: DomainProps) {
  const { domain } = await params;
  const cfg = (loadConfig().domains.find((d) => d.id === domain)?.content_writer ?? {}) as { exclude_paths?: string[] };
  const details = loadDetails(domain);
  const suggestions = suggestGaps(details, { excludePaths: cfg.exclude_paths ?? [] });

  return (
    <>
      <PageTitle title="Content Writer" meta="Nowy artykuł od frazy do szkicu w WordPressie" />
      <Note>
        Sprawdzamy konkurencję w wynikach wyszukiwania, przygotowujemy <b>brief do akceptacji</b>, piszemy tekst i
        dopracowujemy go w edytorze. Projekt otwiera się na razie w obecnej wersji dashboardu.
      </Note>
      <WriterWorkspace
        domain={domain}
        suggestions={suggestions}
        measuredAt={details.date ? fmtDate(details.date) : null}
        legacyBase={`${LEGACY_URL}/${domain}`}
      />
    </>
  );
}
