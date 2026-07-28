/**
 * Statyczny katalog treści domeny dla edytora wpisu.
 *
 * Edytor jest jedną stroną z parametrem `?id=`, więc metadane wpisu bierze
 * stąd, a nie z 604 osobnych stron w buildzie. Pełna treść nie trafia do
 * bundle'a – tę pipeline pobiera z WordPressa w chwili uruchomienia.
 */
import type { APIRoute } from 'astro';
import { loadConfig, loadContentCatalog } from '../../../lib/data';

export function getStaticPaths() {
  return loadConfig()
    .domains.filter((domain) => (domain.content_watcher as { enabled?: boolean } | undefined)?.enabled === true)
    .map((domain) => ({ params: { domain: domain.id } }));
}

export const GET: APIRoute = ({ params }) => {
  const domain = loadConfig().domains.find((item) => item.id === params.domain);
  const items = domain ? loadContentCatalog(domain) : [];
  return new Response(
    JSON.stringify({
      domain: params.domain,
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
      })),
    }),
    { headers: { 'Content-Type': 'application/json; charset=utf-8' } },
  );
};
