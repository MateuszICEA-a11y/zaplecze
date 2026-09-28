/* Frazy wpisów konkurencji z Senuto (collector, competitor_potential.py) – okno
   „Statystyki wpisu” wczytuje je na żądanie, żeby nie obciążać listy konkurencji. */
import { loadCompetitorKeywords, loadConfig } from "@/lib/data";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return loadConfig()
    .domains.filter((d) => (d.content_writer as { enabled?: boolean } | undefined)?.enabled === true)
    .map((d) => ({ domain: d.id }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ domain: string }> }) {
  const { domain } = await params;
  return Response.json(loadCompetitorKeywords(domain));
}
