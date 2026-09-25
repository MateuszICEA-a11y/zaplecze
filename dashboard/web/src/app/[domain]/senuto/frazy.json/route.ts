/* Lista rankujących fraz Senuto jako osobny plik JSON (setki KB) – tabela
   dociąga ją po załadowaniu strony, zamiast wklejać dane w HTML. */
import { loadConfig, loadDetails, sectionEnabled } from "@/lib/data";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return loadConfig()
    .domains.filter((d) => sectionEnabled(d, "senuto"))
    .map((d) => ({ domain: d.id }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ domain: string }> }) {
  const { domain } = await params;
  return Response.json(loadDetails(domain).sources.senuto?.keywords ?? []);
}
