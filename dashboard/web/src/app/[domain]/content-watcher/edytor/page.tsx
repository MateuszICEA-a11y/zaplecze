/* Edytor wpisu Content Watchera – panele React (PostEditor) i przenoszona
   etapami logika starego frontu (src/legacy/). Wpis wskazuje `?id=`. */
import { editorMarkup } from "@/legacy/markup";
import { loadConfig } from "@/lib/data";
import { titleFor, type DomainProps } from "@/lib/pages";
import PostEditor from "./PostEditor";

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
  return <PostEditor domain={domain} markup={editorMarkup(domain)} />;
}
