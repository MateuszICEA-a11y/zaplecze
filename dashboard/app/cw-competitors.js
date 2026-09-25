/**
 * Content Writer – treści konkurencji wobec naszych wpisów.
 *
 * Adresy i tytuły zbiera collector z sitemap konkurentów (źródło
 * `competitors`, plik w buildzie /<domena>/content-writer/competitors.json).
 * Tu każdy tytuł dostaje embedding (bge-m3) i najbliższy nasz wpis z Vectorize –
 * ten sam indeks i te same progi co „odśwież czy nowy" w podpowiedziach:
 *
 *   new     – nie mamy nic bliskiego: temat do napisania,
 *   refresh – mamy wpis o tym samym temacie (≥ 0,75),
 *   check   – mamy wpis pokrewny (0,60–0,75): decyzja redaktora.
 *
 * Wynik leży w D1 (competitor_matches), więc lista jest stała między wejściami
 * i nie kosztuje nic przy odświeżeniu strony. Przeliczamy tylko tytuły nowe
 * albo zmienione oraz te, które porównano przed ostatnią zmianą naszego
 * indeksu (nowy wpis u nas może zamknąć temat). Bez sędziego LLM – przy
 * tysiącach adresów to byłyby setki wywołań; pasmo „check" pokazuje dowód
 * (nasz najbliższy wpis i podobieństwo).
 */
import { decide, embed, THRESHOLDS } from './cw-semantic.js';

const json = (value, status = 200) =>
  new Response(JSON.stringify(value), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });

/* Ile tytułów na jedno wywołanie: embedding po 50 + zapytanie Vectorize na
   tytuł. Przy 200 co trzecie wywołanie kończyło się 1102 (limit CPU – głównie
   parsowanie 1024-wymiarowych wektorów); 100 mieści się z zapasem. Resztę
   dociąga kolejne wywołanie (klient w pętli albo następny cron). */
export const SYNC_LIMIT = 100;
const QUERY_PARALLEL = 25;
const TOP_K = 3;
const MATCH_VERSION = 1;

const round = (value) => Math.round(value * 1000) / 1000;

/** Tekst do porównania: prawdziwy tytuł, a bez niego slug zamieniony na słowa. */
export const itemText = (item) => String(item.title || item.slug_title || '').trim().slice(0, 200);

async function hash(text) {
  const digest = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(`${MATCH_VERSION}\n${text}`));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('').slice(0, 20);
}

async function competitorFile(env, domain) {
  const response = await env.ASSETS.fetch(new Request(`https://assets.local/${domain}/content-writer/competitors.json`));
  if (!response.ok) return { sites: [], items: [], generated_at: null };
  return response.json();
}

async function storedMatches(env, domain) {
  const rows = (await env.CW_DB.prepare('SELECT * FROM competitor_matches WHERE domain = ?').bind(domain).all()).results ?? [];
  return new Map(rows.map((row) => [row.url, row]));
}

async function indexStamp(env, domain) {
  const row = await env.CW_DB.prepare('SELECT MAX(indexed_at) AS at FROM post_vectors WHERE domain = ?').bind(domain).first();
  return row?.at ?? null;
}

/**
 * Które adresy trzeba (prze)liczyć. Czysta funkcja – testy.
 * `hashes` = Map url → hash bieżącego tekstu.
 */
export function pendingItems(items, stored, hashes, indexedAt) {
  return items.filter((item) => {
    const row = stored.get(item.url);
    if (!row || row.text_hash !== hashes.get(item.url)) return true;
    // Nasz indeks zmienił się po porównaniu – temat „new"/„check" mógł się zamknąć.
    return row.action !== 'refresh' && indexedAt && row.classified_at < indexedAt;
  });
}

/** Porównanie porcji adresów z indeksem i zapis wyniku. */
export async function syncCompetitors(env, domain, { limit = SYNC_LIMIT } = {}) {
  if (!env.AI || !env.POSTS_INDEX) throw new Error('Brak bindingów AI albo POSTS_INDEX w Workerze.');
  const file = await competitorFile(env, domain);
  const items = (file.items ?? []).filter((item) => itemText(item));
  const stored = await storedMatches(env, domain);
  const hashes = new Map();
  for (const item of items) hashes.set(item.url, await hash(itemText(item)));
  const indexedAt = await indexStamp(env, domain);
  if (!indexedAt) throw new Error('Indeks naszych wpisów jest pusty – najpierw „Przelicz indeks” w podpowiedziach.');

  const pending = pendingItems(items, stored, hashes, indexedAt);
  // Najpierw najnowsze u konkurencji – one są najciekawsze od razu.
  pending.sort((a, b) => String(b.first_seen ?? '').localeCompare(String(a.first_seen ?? ''))
    || String(b.lastmod ?? '').localeCompare(String(a.lastmod ?? '')));
  const batch = pending.slice(0, limit);
  const now = new Date().toISOString();
  const vectors = batch.length ? await embed(env, batch.map(itemText)) : [];

  const results = [];
  for (let i = 0; i < batch.length; i += QUERY_PARALLEL) {
    const slice = batch.slice(i, i + QUERY_PARALLEL);
    results.push(...await Promise.all(slice.map(async (item, j) => {
      const found = await env.POSTS_INDEX.query(vectors[i + j], { topK: TOP_K, returnMetadata: 'all', filter: { domain } });
      const candidates = (found?.matches ?? []).map((match) => ({ ...match.metadata, score: round(match.score) }));
      const verdict = decide(candidates, null);
      const best = verdict.target ?? candidates[0] ?? null;
      return { item, action: verdict.action, best };
    })));
  }

  for (let i = 0; i < results.length; i += 50) {
    await env.CW_DB.batch(results.slice(i, i + 50).map(({ item, action, best }) => env.CW_DB.prepare(
      `INSERT INTO competitor_matches
         (domain, url, text_hash, action, score, target_post_id, target_catalog_id, target_title, target_url, classified_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(domain, url) DO UPDATE SET text_hash = excluded.text_hash, action = excluded.action,
         score = excluded.score, target_post_id = excluded.target_post_id, target_catalog_id = excluded.target_catalog_id,
         target_title = excluded.target_title, target_url = excluded.target_url, classified_at = excluded.classified_at`,
    ).bind(
      domain, item.url, hashes.get(item.url), action,
      best?.score ?? null, best?.post_id ?? null, best?.catalog_id ?? null, best?.title ?? null, best?.url ?? null, now,
    )));
  }

  // Adresy, które zniknęły z sitemap, nie wiszą w tabeli w nieskończoność.
  const alive = new Set(items.map((item) => item.url));
  const gone = [...stored.keys()].filter((url) => !alive.has(url));
  for (let i = 0; i < gone.length; i += 50) {
    await env.CW_DB.batch(gone.slice(i, i + 50).map((url) => env.CW_DB
      .prepare('DELETE FROM competitor_matches WHERE domain = ? AND url = ?').bind(domain, url)));
  }
  return { total: items.length, classified: batch.length, remaining: pending.length - batch.length, deleted: gone.length };
}

/** Lista dla UI: adresy z pliku + zapisany werdykt. */
export async function competitorView(env, domain) {
  const file = await competitorFile(env, domain);
  const stored = await storedMatches(env, domain);
  const items = (file.items ?? []).filter((item) => itemText(item)).map((item) => {
    const row = stored.get(item.url);
    return {
      url: item.url,
      host: item.host,
      title: itemText(item),
      title_from: item.title ? 'page' : 'slug',
      // Typ strony z collectora (LLM): poradnik, slownik, news, firmowe, case_study, oferta, niepewne.
      kind: item.kind ?? null,
      kind_basis: item.kind_basis ?? null,
      first_seen: item.first_seen ?? null,
      lastmod: item.lastmod ?? null,
      baseline: Boolean(item.baseline),
      action: row?.action ?? null,
      score: row?.score ?? null,
      target: row?.target_title ? { title: row.target_title, url: row.target_url, catalog_id: row.target_catalog_id } : null,
    };
  });
  return {
    generated_at: file.generated_at ?? null,
    sites: file.sites ?? [],
    thresholds: THRESHOLDS,
    pending: items.filter((item) => !item.action).length,
    items,
  };
}

export async function routeCompetitors(request, env, { checkOrigin, domains }) {
  const url = new URL(request.url);
  const match = url.pathname.match(/^\/api\/cw\/writer\/competitors\/([a-z0-9.-]{1,253})(\/sync)?\/?$/i);
  if (!match) return null;
  const domain = match[1].toLowerCase();
  if (!domains.has(domain)) return json({ error: 'Domena spoza CW_DOMAINS.' }, 400);
  try {
    if (match[2]) {
      if (request.method !== 'POST') return json({ error: 'Dozwolona metoda: POST.' }, 405);
      if (!checkOrigin(request)) return json({ error: 'Żądanie odrzucone.' }, 403);
      return json(await syncCompetitors(env, domain));
    }
    if (request.method !== 'GET') return json({ error: 'Dozwolona metoda: GET.' }, 405);
    return json(await competitorView(env, domain));
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Błąd porównania konkurencji.' }, 502);
  }
}
