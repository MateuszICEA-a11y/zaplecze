/* Wpisy konkurencji z sitemap (collector, źródło `competitors`) dla Workera
   (cw-competitors.js czyta je przez ASSETS). Tylko pola potrzebne do
   porównania i widoku – ścieżka musi zostać ta sama co w Astro. */
import { loadCompetitors, loadConfig } from "@/lib/data";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return loadConfig()
    .domains.filter((d) => (d.content_writer as { enabled?: boolean } | undefined)?.enabled === true)
    .map((d) => ({ domain: d.id }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ domain: string }> }) {
  const { domain } = await params;
  const data = loadCompetitors(domain);
  const items = data.items.map((item) => ({
    url: item.url,
    host: item.host,
    title: item.title ?? null,
    slug_title: item.slug_title ?? null,
    first_seen: item.first_seen ?? null,
    lastmod: item.lastmod ?? null,
    baseline: item.baseline ?? false,
    kind: item.kind ?? null,
    kind_basis: item.kind_basis ?? null,
  }));
  return Response.json({ generated_at: data.generated_at ?? null, sites: data.sites, items });
}
