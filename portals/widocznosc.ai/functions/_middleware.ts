/**
 * Globalny middleware Pages Functions – wykonuje się dla KAŻDEGO requestu do projektu
 * (statyczne strony i /api/*), po czym przekazuje sterowanie dalej przez context.next().
 *
 * Cel: domena techniczna *.pages.dev (alias produkcyjny widocznosc-ai.pages.dev oraz
 * preview deploymenty) jest duplikatem widocznosc.ai – nie może trafić do indeksu.
 * Dla takich hostów dokładamy nagłówek `X-Robots-Tag: noindex`. Na widocznosc.ai
 * odpowiedź zwracamy bez zmian (canonical w <head> i tak wskazuje produkcję).
 */
import { shouldBlockIndexing } from './_lib/indexing';

export const onRequest: PagesFunction = async (context) => {
  const response = await context.next();

  if (!shouldBlockIndexing(context.request.headers.get('host'))) {
    return response;
  }

  const headers = new Headers(response.headers);
  headers.set('X-Robots-Tag', 'noindex, nofollow');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};
