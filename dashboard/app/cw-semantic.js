/**
 * Content Writer – „odśwież czy napisz nowy" po znaczeniu, nie po słowach.
 *
 * Dopasowanie leksykalne (writer-gaps.js) nie łączy „co to jest ip" z wpisem
 * „Co to jest adres IP i do czego służy", a podpowiedzi potrafiły wskazać do
 * napisania od zera temat, który na blogu już jest. Tu każdy wpis katalogu
 * ma embedding (tytuł, meta description, nagłówki H2 – zakres tematu), a fraza
 * dostaje decyzję z dwóch sygnałów:
 *
 *   1. podobieństwo znaczeniowe frazy do wpisów (Vectorize, bge-m3),
 *   2. co dziś na nią rankuje (Senuto, TOP 50) – i czy ta strona jest o tym.
 *
 * Rankujący adres, który jest daleko od tematu (strona główna, wpis łapiący
 * frazę przy okazji), nie blokuje nowego tekstu – blokuje go dopiero wpis
 * bliski znaczeniowo, rankujący albo nie.
 *
 * Indeks: `syncIndex` porównuje hash tekstu do embeddingu z tabelą
 * `post_vectors` (migracja 0012) i liczy tylko to, co się zmieniło. Idzie
 * z crona Workera (raz dziennie po collectorze) i z przycisku w UI.
 */
import { normPath, rankingsFor } from './src/lib/writer-gaps.js';

const json = (value, status = 200) =>
  new Response(JSON.stringify(value), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });

export const EMBED_MODEL = '@cf/baai/bge-m3';
/* Zmiana sposobu składania tekstu = nowa wersja → przeliczenie całego indeksu. */
export const EMBED_VERSION = 1;
const EMBED_BATCH = 50;
const TOP_K = 5;
const MAX_PHRASES = 60;

/*
 * Progi podobieństwa (cosinus bge-m3). Skalibrowane na parach z grupa-icea.pl
 * 2026-09-25 – patrz testy i docs. REFRESH: wpis jest o tym samym temacie.
 * CHECK: temat pokrewny – może wystarczy nowa sekcja w istniejącym wpisie.
 */
export const THRESHOLDS = { refresh: 0.72, check: 0.62 };

/** Tekst wpisu do embeddingu: to, co mówi o zakresie tematu, bez treści. */
export function postText(item) {
  const parts = [
    item.title,
    item.meta_description,
    Array.isArray(item.h2) && item.h2.length ? item.h2.join('; ') : null,
  ];
  return parts.filter((part) => typeof part === 'string' && part.trim()).join('\n').slice(0, 2000);
}

async function sha1(text) {
  const digest = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(`${EMBED_VERSION}\n${text}`));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('').slice(0, 20);
}

export async function embed(env, texts) {
  const out = [];
  for (let i = 0; i < texts.length; i += EMBED_BATCH) {
    const result = await env.AI.run(EMBED_MODEL, { text: texts.slice(i, i + EMBED_BATCH) });
    out.push(...(result?.data ?? []));
  }
  if (out.length !== texts.length) throw new Error('Model embeddingów oddał inną liczbę wektorów niż tekstów.');
  return out;
}

export function cosine(a, b) {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}

const vectorId = (domain, postId) => `${domain}:${postId}`;

async function asset(env, path) {
  const response = await env.ASSETS.fetch(new Request(`https://assets.local${path}`));
  if (!response.ok) throw new Error(`Brak pliku ${path} w buildzie (HTTP ${response.status}).`);
  return response.json();
}

/** Wpisy katalogu z numerem wpisu WP – tylko one mają sens jako „odśwież". */
async function catalogItems(env, domain) {
  const catalog = await asset(env, `/${domain}/content-watcher/catalog.json`);
  return (catalog.items ?? []).filter((item) => Number.isInteger(item.post_id) && item.url && item.title);
}

/**
 * Synchronizacja indeksu z katalogiem: nowe i zmienione wpisy → embedding +
 * upsert, usunięte z katalogu → delete. `limit` chroni przed przekroczeniem
 * czasu Workera przy pierwszym, pełnym przeliczeniu (reszta w kolejnym wywołaniu).
 */
export async function syncIndex(env, domain, { limit = 400 } = {}) {
  if (!env.AI || !env.POSTS_INDEX) throw new Error('Brak bindingów AI albo POSTS_INDEX w Workerze.');
  const items = await catalogItems(env, domain);
  const stored = new Map(
    ((await env.CW_DB.prepare('SELECT post_id, text_hash FROM post_vectors WHERE domain = ?').bind(domain).all())
      .results ?? []).map((row) => [row.post_id, row.text_hash]),
  );

  const pending = [];
  for (const item of items) {
    const text = postText(item);
    if (!text) continue;
    const hash = await sha1(text);
    if (stored.get(item.post_id) !== hash) pending.push({ item, text, hash });
  }
  const batch = pending.slice(0, limit);
  const now = new Date().toISOString();
  for (let i = 0; i < batch.length; i += EMBED_BATCH) {
    const chunk = batch.slice(i, i + EMBED_BATCH);
    const vectors = await embed(env, chunk.map((row) => row.text));
    await env.POSTS_INDEX.upsert(chunk.map((row, index) => ({
      id: vectorId(domain, row.item.post_id),
      values: vectors[index],
      metadata: {
        domain,
        post_id: row.item.post_id,
        catalog_id: row.item.id,
        url: row.item.url,
        path: normPath(row.item.url),
        title: row.item.title,
      },
    })));
    await env.CW_DB.batch(chunk.map((row) => env.CW_DB.prepare(
      `INSERT INTO post_vectors (domain, post_id, text_hash, indexed_at) VALUES (?, ?, ?, ?)
       ON CONFLICT(domain, post_id) DO UPDATE SET text_hash = excluded.text_hash, indexed_at = excluded.indexed_at`,
    ).bind(domain, row.item.post_id, row.hash, now)));
  }

  const alive = new Set(items.map((item) => item.post_id));
  const gone = [...stored.keys()].filter((postId) => !alive.has(postId));
  if (gone.length) {
    await env.POSTS_INDEX.deleteByIds(gone.map((postId) => vectorId(domain, postId)));
    await env.CW_DB.batch(gone.map((postId) => env.CW_DB
      .prepare('DELETE FROM post_vectors WHERE domain = ? AND post_id = ?').bind(domain, postId)));
  }
  return {
    catalog: items.length,
    embedded: batch.length,
    remaining: pending.length - batch.length,
    deleted: gone.length,
  };
}

/**
 * Decyzja dla jednej frazy – czysta funkcja (testy, kalibracja).
 *   candidates: [{post_id, catalog_id, url, path, title, score}] – malejąco,
 *   ranking: {path, position, score|null, url, title} | null – najlepsza
 *            nasza strona w TOP 50 na tę frazę z podobieństwem do frazy.
 */
export function decide(candidates, ranking, thresholds = THRESHOLDS) {
  const best = candidates[0] ?? null;
  const rankingOnTopic = ranking && ranking.score !== null && ranking.score >= thresholds.refresh && ranking.post_id;
  if (rankingOnTopic) {
    return { action: 'refresh', target: ranking, reason: 'ranking_on_topic' };
  }
  if (best && best.score >= thresholds.refresh) {
    return { action: 'refresh', target: best, reason: ranking ? 'close_post_other_ranks' : 'close_post' };
  }
  if (best && best.score >= thresholds.check) {
    return { action: 'check', target: best, reason: 'related_post' };
  }
  return { action: 'new', target: null, reason: ranking ? 'ranks_off_topic' : 'no_close_post' };
}

/**
 * Klasyfikacja listy fraz jednym wywołaniem modelu. `rankings` = wiersze
 * {keyword, position, path} z data.json (Senuto, TOP 50, bez stron ofertowych).
 */
export async function classifyPhrases(env, domain, phrases, rankings) {
  const vectors = await embed(env, phrases);
  const results = [];
  for (let i = 0; i < phrases.length; i++) {
    const phrase = phrases[i];
    const vector = vectors[i];
    const found = await env.POSTS_INDEX.query(vector, {
      topK: TOP_K,
      returnMetadata: 'all',
      filter: { domain },
    });
    const candidates = (found?.matches ?? []).map((match) => ({ ...match.metadata, score: round(match.score) }));

    const best = rankingsFor(phrase, rankings)[0] ?? null;
    let ranking = null;
    if (best) {
      const known = candidates.find((row) => row.path === best.path);
      let score = known?.score ?? null;
      let meta = known ?? null;
      if (!known) {
        // Rankującej strony nie ma w TOP 5 – dociągamy jej wektor, żeby
        // wiedzieć, czy jest o tym (wpis łapiący frazę przy okazji), czy to
        // strona spoza katalogu (główna, oferta) – wtedy score zostaje null.
        const postId = await postIdForPath(env, domain, best.path);
        if (postId !== null) {
          const [stored] = await env.POSTS_INDEX.getByIds([vectorId(domain, postId)]);
          if (stored?.values) {
            score = round(cosine(vector, stored.values));
            meta = stored.metadata ?? null;
          }
        }
      }
      ranking = {
        path: best.path,
        position: best.position,
        keyword: best.keyword,
        score,
        post_id: meta?.post_id ?? null,
        catalog_id: meta?.catalog_id ?? null,
        url: meta?.url ?? null,
        title: meta?.title ?? null,
      };
    }
    results.push({ phrase, ...decide(candidates, ranking), ranking, candidates: candidates.slice(0, 3) });
  }
  return results;
}

const round = (value) => Math.round(value * 1000) / 1000;

/* Mapa ścieżka → numer wpisu z metadanych indeksu byłaby droga (brak listowania
   w Vectorize), więc bierzemy ją z katalogu – raz na żądanie. */
const pathCache = new WeakMap();
async function postIdForPath(env, domain, path) {
  let map = pathCache.get(env);
  if (!map) {
    map = new Map((await catalogItems(env, domain)).map((item) => [normPath(item.url), item.post_id]));
    pathCache.set(env, map);
  }
  return map.get(path) ?? null;
}

/* ---------- trasy ---------- */

/**
 * POST /api/cw/writer/classify  {domain, phrases[]} → {results[]}
 * POST /api/cw/writer/reindex   {domain}           → stan synchronizacji
 * GET  /api/cw/writer/index/:domain                → ile wpisów w indeksie
 */
export async function routeSemantic(request, env, { checkOrigin, domains }) {
  const url = new URL(request.url);
  const index = url.pathname.match(/^\/api\/cw\/writer\/index\/([a-z0-9.-]{1,253})\/?$/i);
  if (index) {
    const row = await env.CW_DB.prepare('SELECT COUNT(*) AS n, MAX(indexed_at) AS at FROM post_vectors WHERE domain = ?')
      .bind(index[1]).first();
    return json({ indexed: row?.n ?? 0, indexed_at: row?.at ?? null });
  }
  const action = url.pathname.match(/^\/api\/cw\/writer\/(classify|reindex)\/?$/)?.[1];
  if (!action) return null;
  if (request.method !== 'POST') return json({ error: 'Dozwolona metoda: POST.' }, 405);
  if (!checkOrigin(request)) return json({ error: 'Żądanie odrzucone.' }, 403);
  if (!env.AI || !env.POSTS_INDEX) return json({ error: 'Brak bindingów AI albo POSTS_INDEX w Workerze.' }, 503);
  const body = (await request.json().catch(() => null)) ?? {};
  const domain = String(body.domain ?? '').toLowerCase();
  if (!domains.has(domain)) return json({ error: 'Domena spoza CW_DOMAINS.' }, 400);

  try {
    if (action === 'reindex') return json(await syncIndex(env, domain));
    const phrases = [...new Set((Array.isArray(body.phrases) ? body.phrases : [])
      .map((phrase) => String(phrase ?? '').trim().slice(0, 120))
      .filter((phrase) => phrase.length >= 3))].slice(0, MAX_PHRASES);
    if (!phrases.length) return json({ results: [] });
    const indexed = await env.CW_DB.prepare('SELECT COUNT(*) AS n FROM post_vectors WHERE domain = ?').bind(domain).first();
    if (!indexed?.n) return json({ error: 'Indeks wpisów jest pusty – uruchom „Przelicz indeks".', code: 'empty_index' }, 409);
    const data = await asset(env, `/${domain}/content-writer/data.json`);
    return json({ results: await classifyPhrases(env, domain, phrases, data.rankings ?? []), thresholds: THRESHOLDS });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Błąd klasyfikacji fraz.' }, 502);
  }
}

/** Cron Workera: dzienna synchronizacja indeksu każdej domeny Content Writera. */
export async function scheduledSync(env, domains) {
  const out = {};
  for (const domain of domains) {
    try {
      out[domain] = await syncIndex(env, domain);
    } catch (error) {
      out[domain] = { error: error instanceof Error ? error.message : String(error) };
    }
  }
  console.log('post_vectors sync', JSON.stringify(out));
  return out;
}
