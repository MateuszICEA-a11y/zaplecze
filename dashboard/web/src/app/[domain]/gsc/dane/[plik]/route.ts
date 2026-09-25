/* Dane tabel GSC jako osobne pliki JSON – okna okresów (7d…16m, razem ~2 MB)
   i dzienna historia fraz. Strona dociąga tylko to, co akurat pokazuje. */
import { loadConfig, loadDetails, sectionEnabled } from "@/lib/data";
import { GSC_WINDOWS } from "@/lib/gsc";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return loadConfig()
    .domains.filter((d) => sectionEnabled(d, "gsc"))
    .flatMap((d) => [...GSC_WINDOWS, "historia"].map((name) => ({ domain: d.id, plik: `${name}.json` })));
}

export async function GET(_req: Request, { params }: { params: Promise<{ domain: string; plik: string }> }) {
  const { domain, plik } = await params;
  const gsc = loadDetails(domain).sources.gsc;
  const name = plik.replace(/\.json$/, "");
  if (name === "historia") return Response.json(gsc?.query_history ?? null);
  const win = gsc?.windows?.[name];
  // Fallback na stare pojedyncze okno, dopóki collector nie dogra `windows`.
  if (!win && name === "30d" && gsc?.window) {
    return Response.json({ ...gsc.window, queries: gsc.queries, pages: gsc.pages });
  }
  return Response.json(win ?? null);
}
