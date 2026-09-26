/**
 * Statyczny katalog treści domeny dla edytora wpisu (i Workera – cw-semantic.js
 * czyta go przez ASSETS, więc ścieżka musi zostać ta sama co w Astro).
 * Pełna treść nie trafia do bundle'a – pipeline pobiera ją z WordPressa.
 */
import { loadConfig, loadContentCatalog, loadDetails } from "@/lib/data";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return loadConfig()
    .domains.filter((domain) => (domain.content_watcher as { enabled?: boolean } | undefined)?.enabled === true)
    .map((domain) => ({ domain: domain.id }));
}

/** Ścieżka bez końcowego ukośnika – wspólny klucz dla katalogu i Senuto. */
const normPath = (value: string): string =>
  value.replace(/^https?:\/\/[^/]+/i, '').replace(/\/+$/, '') || '/';

export async function GET(_req: Request, { params }: { params: Promise<{ domain: string }> }) {
  const { domain: domainId } = await params;
  const domain = loadConfig().domains.find((item) => item.id === domainId);
  const items = domain ? loadContentCatalog(domain) : [];

  // Frazy z Senuto (z pozycjami) idą razem z katalogiem: analiza SERP-gap
  // w edytorze porównuje je z frazami konkurencji, więc nie musi ich dociągać
  // z API – to dane collectora, odświeżane w dziennym przebiegu.
  const senutoByPath = new Map<string, { keyword: string; position: number; searches: number | null }[]>();
  if (domain) {
    for (const row of loadDetails(domain.id).sources.senuto?.keywords ?? []) {
      if (!row.url || typeof row.position !== 'number') continue;
      const key = normPath(row.url.replace(/^(https?:\/\/)?(www\.)?[^/]+/i, ''));
      const list = senutoByPath.get(key) ?? [];
      list.push({ keyword: row.keyword, position: row.position, searches: row.searches });
      senutoByPath.set(key, list);
    }
  }
  return Response.json({
      domain: domainId,
      items: items.map((item) => ({
        id: item.id,
        // `id` katalogu z CMS-a ma postać `<typ>-<id wpisu>` – pipeline potrzebuje
        // obu części osobno, żeby trafić w REST WordPressa.
        post_type: /-(\d+)$/.test(item.id) ? item.id.replace(/-\d+$/, '') : null,
        post_id: /-(\d+)$/.test(item.id) ? Number(item.id.match(/-(\d+)$/)![1]) : null,
        url: item.url,
        title: item.title,
        pillar: item.pillar,
        author: item.author,
        published_at: item.published_at,
        updated_at: item.updated_at,
        modified_at: item.modified_at ?? null,
        word_count: item.word_count,
        headings: item.headings,
        sections: item.sections ?? null,
        internal_links: item.internal_links,
        external_links: item.external_links,
        content_path: item.content_path,
        meta_description: item.meta_description ?? null,
        h2: item.h2 ?? [],
        senuto_keywords: (senutoByPath.get(normPath(item.url)) ?? [])
          .sort((a, b) => a.position - b.position)
          .slice(0, 60),
      })),
  });
}
