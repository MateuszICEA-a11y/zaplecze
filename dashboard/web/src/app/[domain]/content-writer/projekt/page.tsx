/* Projekt artykułu Content Writera: research → brief → tekst → szkic w WP.
   Jedna strona na domenę, projekt wskazuje parametr `?id=`. */
import { loadConfig } from "@/lib/data";
import { titleFor, type DomainProps } from "@/lib/pages";
import ProjectWorkspace from "./ProjectWorkspace";

export const dynamicParams = false;
export const generateStaticParams = () =>
  loadConfig()
    .domains.filter((d) => (d.content_writer as { enabled?: boolean } | undefined)?.enabled === true)
    .map((d) => ({ domain: d.id }));
export const generateMetadata = titleFor("projekt artykułu");

export default async function ProjectPage({ params }: DomainProps) {
  const { domain } = await params;
  return <ProjectWorkspace domain={domain} />;
}
