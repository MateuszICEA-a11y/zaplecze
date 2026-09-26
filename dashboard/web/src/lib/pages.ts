/* Wspólne dla stron sekcji: parametry statyczne i tytuły. */
import { loadConfig, sectionEnabled } from "./data";

/** Domeny, dla których sekcja powstaje – źródło wyłączone w domains.yaml jej nie ma. */
export function domainParams(source?: string) {
  return loadConfig()
    .domains.filter((d) => !source || sectionEnabled(d, source))
    .map((d) => ({ domain: d.id }));
}

export type DomainProps = { params: Promise<{ domain: string }> };

export const titleFor = (label: string) =>
  async function generateMetadata({ params }: DomainProps) {
    return { title: `${(await params).domain} – ${label}` };
  };
