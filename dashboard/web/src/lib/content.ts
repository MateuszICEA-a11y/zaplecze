/* Które widoki sekcji „Treści" ma domena (content_watcher / content_writer w domains.yaml). */
import type { DomainConfig } from "./data";

export function contentViews(domain: DomainConfig | undefined): string[] {
  const on = (key: string) => (domain?.[key] as { enabled?: boolean } | undefined)?.enabled === true;
  return [on("content_watcher") && "content-watcher", on("content_writer") && "content-writer"].filter(Boolean) as string[];
}
