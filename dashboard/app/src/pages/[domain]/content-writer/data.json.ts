/* Dane Content Writera dla przeglądarki (build): nasze frazy z Senuto do
   SERP-gapu oraz wpisy i frazy w TOP 20 do kontroli kanibalizacji. */
import type { APIRoute } from 'astro';
import { loadConfig, loadDetails } from '../../../lib/data';
import { writerData } from '../../../lib/writer-gaps.js';

export function getStaticPaths() {
  return loadConfig()
    .domains.filter((domain) => (domain.content_writer as { enabled?: boolean } | undefined)?.enabled === true)
    .map((domain) => ({ params: { domain: domain.id } }));
}

export const GET: APIRoute = ({ params }) => {
  const domain = loadConfig().domains.find((item) => item.id === params.domain);
  const cfg = (domain?.content_writer ?? {}) as { exclude_paths?: string[] };
  const data = writerData(loadDetails(params.domain!), { excludePaths: cfg.exclude_paths ?? [] });
  return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};
