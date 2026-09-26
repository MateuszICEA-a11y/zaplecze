/* Dane Content Writera (build): nasze frazy z Senuto do SERP-gapu oraz wpisy
   i frazy w TOP 20 do kontroli kanibalizacji. Czyta je też Worker przez
   ASSETS (cw-semantic.js) – ścieżka musi zostać ta sama co w Astro. */
import { loadConfig, loadDetails } from "@/lib/data";
import { writerData } from "@/lib/writer-gaps.js";

export const dynamic = "force-static";
export const dynamicParams = false;

const writerDomains = () =>
  loadConfig().domains.filter((d) => (d.content_writer as { enabled?: boolean } | undefined)?.enabled === true);

export function generateStaticParams() {
  return writerDomains().map((d) => ({ domain: d.id }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ domain: string }> }) {
  const { domain } = await params;
  const cfg = (writerDomains().find((d) => d.id === domain)?.content_writer ?? {}) as { exclude_paths?: string[] };
  return Response.json(writerData(loadDetails(domain), { excludePaths: cfg.exclude_paths ?? [] }));
}
