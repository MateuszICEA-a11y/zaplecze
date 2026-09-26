/* Edytor wpisu Content Watchera – logika i znaczniki 1:1 ze starego frontu
   (src/legacy/), w nowej powłoce i kolorach iCEA. Wpis wskazuje `?id=`. */
import LegacyHost from "@/legacy/LegacyHost";
import { legacyMarkup } from "@/legacy/markup";
import { loadConfig } from "@/lib/data";
import { titleFor, type DomainProps } from "@/lib/pages";

export const dynamicParams = false;
export const generateStaticParams = () =>
  loadConfig()
    .domains.filter((d) => {
      // Edytor ma sens tylko dla domen na CMS-ie – treści z repozytorium poprawia się w plikach.
      const cfg = d.content_watcher as { enabled?: boolean; source?: string } | undefined;
      return cfg?.enabled === true && cfg.source === "wordpress";
    })
    .map((d) => ({ domain: d.id }));
export const generateMetadata = titleFor("edytor wpisu");

export default async function EditorPage({ params }: DomainProps) {
  const { domain } = await params;
  return <LegacyHost module="edytor" html={legacyMarkup("edytor", domain)} />;
}
