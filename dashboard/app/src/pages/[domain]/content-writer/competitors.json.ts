/* Wpisy konkurencji z sitemap (collector, źródło `competitors`) dla Workera
   (cw-competitors.js czyta je przez ASSETS). Bez zmian w danych – tylko pola
   potrzebne do porównania i widoku. */
import type { APIRoute } from 'astro';
import { loadCompetitors, loadConfig } from '../../../lib/data';

export function getStaticPaths() {
  return loadConfig()
    .domains.filter((domain) => (domain.content_writer as { enabled?: boolean } | undefined)?.enabled === true)
    .map((domain) => ({ params: { domain: domain.id } }));
}

export const GET: APIRoute = ({ params }) => {
  const data = loadCompetitors(params.domain!);
  const items = data.items.map((item) => ({
    url: item.url,
    host: item.host,
    title: item.title ?? null,
    slug_title: item.slug_title ?? null,
    first_seen: item.first_seen ?? null,
    lastmod: item.lastmod ?? null,
    baseline: item.baseline ?? false,
  }));
  return new Response(JSON.stringify({ generated_at: data.generated_at ?? null, sites: data.sites, items }), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
