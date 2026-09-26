/* Projekt artykułu Content Writera – logika i znaczniki 1:1 ze starego frontu
   (src/legacy/), w nowej powłoce i kolorach iCEA. Projekt wskazuje `?id=`. */
import LegacyHost from "@/legacy/LegacyHost";
import { legacyMarkup } from "@/legacy/markup";
import { loadConfig } from "@/lib/data";
import { titleFor, type DomainProps } from "@/lib/pages";

export const dynamicParams = false;
export const generateStaticParams = () =>
  loadConfig()
    .domains.filter((d) => (d.content_writer as { enabled?: boolean } | undefined)?.enabled === true)
    .map((d) => ({ domain: d.id }));
export const generateMetadata = titleFor("projekt artykułu");

export default async function ProjectPage({ params }: DomainProps) {
  const { domain } = await params;
  return <LegacyHost module="projekt" html={legacyMarkup("projekt", domain)} />;
}
