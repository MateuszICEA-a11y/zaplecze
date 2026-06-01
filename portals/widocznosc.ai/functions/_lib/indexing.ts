/**
 * Czy dany host to domena techniczna Cloudflare Pages (*.pages.dev)?
 *
 * Alias produkcyjny `widocznosc-ai.pages.dev` oraz preview deploymenty
 * `<hash>.widocznosc-ai.pages.dev` są pełnym duplikatem produkcji
 * (widocznosc.ai) – nie mogą trafić do indeksu wyszukiwarek.
 */
export function shouldBlockIndexing(host: string | null | undefined): boolean {
  if (!host) return false;
  const bare = host.toLowerCase().split(':')[0]; // odetnij ewentualny :port
  return bare.endsWith('.pages.dev');
}
