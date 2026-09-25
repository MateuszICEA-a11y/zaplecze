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
import { phraseKey } from './src/lib/phrase-match.js';

const json = (value, status = 200) =>
  new Response(JSON.stringify(value), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });

export const EMBED_MODEL = '@cf/baai/bge-m3';
const CALIBRATION_MODELS = ['@cf/baai/bge-m3', '@cf/qwen/qwen3-embedding-0.6b', '@cf/google/embeddinggemma-300m'];
/* Zmiana sposobu składania tekstu = nowa wersja → przeliczenie całego indeksu. */
export const EMBED_VERSION = 2;
const EMBED_BATCH = 50;
const TOP_K = 5;
const MAX_PHRASES = 60;

/*
 * Progi (cosinus bge-m3, fraza ↔ tytuł wpisu), kalibracja 2026-09-25 na 13
 * parach z grupa-icea.pl – docs/dashboard-ocena-i-content-writer-2026-09-25.html:
 *   ten sam temat: 0,53–0,81 (śr. 0,67; dół to literówki: „webmachine", „fanpejdża"),
 *   temat pokrewny: 0,56–0,74 („co to jest adres url" ↔ „przyjazne adresy URL" 0,68).
 * Pasma się nakładają i ranking ich nie rozdziela (pokrewne wpisy też rankują),
 * więc „Odśwież" tylko przy wysokim podobieństwie, a wszystko pomiędzy to
 * „Sprawdź" z dowodami (pozycja, podobieństwo) – decyzja redaktora.
 */
export const THRESHOLDS = { refresh: 0.75, check: 0.6, rankedCheck: 0.5 };

/*
 * Tekst wpisu do embeddingu: sam tytuł. Kalibracja: dołożenie meta description
 * obniżało podobieństwo trafnych par z 0,67 do 0,53 (opisy są ogólnikowe,
 * „| ICEA", CTA), a krótka fraza najlepiej porównuje się z krótkim tytułem.
 * Nagłówki H2 zbiera collector – do ewentualnej drugiej reprezentacji.
 */
export function postText(item) {
  return typeof item.title === 'string' ? item.title.trim().slice(0, 300) : '';
}

/** Temat strony spoza katalogu (słownik, oferta) z jej ścieżki: „/slownik/cross-selling/" → „slownik cross selling". */
export function pathTopic(path) {
  const text = decodeURIComponent(String(path ?? '')).replace(/[-_/]+/g, ' ').trim();
  return text.length >= 3 ? text : '';
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
  const rankScore = ranking && typeof ranking.score === 'number' ? ranking.score : null;
  // Wpis, który Google pokazuje na tę frazę i który jest o tym samym temacie.
  if (rankScore !== null && rankScore >= thresholds.refresh) {
    return { action: 'refresh', target: ranking, reason: 'ranking_on_topic' };
  }
  if (best && best.score >= thresholds.refresh) {
    return { action: 'refresh', target: best, reason: ranking ? 'close_post_other_ranks' : 'close_post' };
  }
  // Rankujący wpis umiarkowanie bliski: ten sam temat innymi słowami albo
  // temat pokrewny – ranking tego nie rozstrzyga, pokazujemy dowody.
  if (rankScore !== null && rankScore >= thresholds.rankedCheck) {
    return { action: 'check', target: ranking, reason: 'ranking_related' };
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
export async function classifyPhrases(env, domain, phrases, rankings, options = {}) {
  const vectors = await embed(env, phrases);
  // Frazy równolegle – każda to zapytanie do Vectorize (+ ewentualnie wektor
  // rankującej strony); po kolei 22 frazy liczyły się ~12 s.
  const results = await Promise.all(phrases.map(async (phrase, i) => {
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
        // wiedzieć, czy jest o tym, czy łapie frazę przy okazji.
        const postId = await postIdForPath(env, domain, best.path);
        if (postId !== null) {
          const [stored] = await env.POSTS_INDEX.getByIds([vectorId(domain, postId)]);
          if (stored?.values) {
            score = round(cosine(vector, stored.values));
            meta = stored.metadata ?? null;
          }
        } else if (pathTopic(best.path)) {
          // Strona spoza katalogu wpisów (słownik, oferta): temat z adresu.
          // Strona główna ma pustą ścieżkę – zostaje null i nie blokuje.
          const [pathVector] = await embed(env, [pathTopic(best.path)]);
          score = round(cosine(vector, pathVector));
          meta = { url: `https://${domain}${best.path}/`, title: best.path, post_id: null, catalog_id: null };
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
    return { phrase, ...decide(candidates, ranking), ranking, candidates: candidates.slice(0, 3) };
  }));

  // Decyzja redaktora wygrywa z embeddingami i z sędzią – i nie wygasa.
  const stored = options.db === false ? new Map() : await storedVerdicts(env, domain, results.map((result) => result.phrase));
  results.forEach((result, index) => {
    const editor = stored.get(`${phraseKey(result.phrase)}|editor`);
    if (editor) results[index] = applyEditor(result, editor);
  });

  const unsure = results.map((result, index) => ({ result, index })).filter(({ result }) => result.action === 'check');
  if (!unsure.length || options.judge === false) return results;
  const catalog = await catalogByPath(env, domain);
  const cases = unsure.map(({ result }, i) => {
    const seen = new Set();
    const rows = [result.target, result.ranking, ...result.candidates]
      .filter((row) => row?.path && row.title && !seen.has(row.path) && seen.add(row.path))
      .slice(0, 4);
    return {
      id: i + 1,
      phrase: result.phrase,
      options: rows.map((row, n) => ({
        n: n + 1,
        row,
        title: row.title,
        path: row.path,
        position: result.ranking?.path === row.path ? result.ranking.position : null,
        description: catalog.get(row.path)?.meta_description ?? null,
        h2: catalog.get(row.path)?.h2 ?? [],
      })),
    };
  });
  // Zapamiętany werdykt sędziego, jeśli oparł się na tych samych kandydatach.
  const cutoff = new Date(Date.now() - VERDICT_TTL_DAYS * 86_400_000).toISOString();
  const pending = [];
  for (let i = 0; i < cases.length; i++) {
    const item = cases[i];
    item.hash = await casesHash(item);
    const row = stored.get(`${phraseKey(item.phrase)}|judge`);
    if (row && row.cases_hash === item.hash && row.created_at >= cutoff) {
      const pick = item.options.find((option) => option.path === row.pick_path)?.n ?? null;
      const applied = applyVerdict(results[unsure[i].index], item.options, { verdict: row.verdict, pick, basis: row.basis ?? '' });
      results[unsure[i].index] = applied.judge ? { ...applied, judge: { ...applied.judge, cached: true, at: row.created_at } } : applied;
    } else {
      pending.push(i);
    }
  }
  if (!pending.length) return results;

  const verdicts = await judgeCases(env, pending.map((i) => cases[i]), options);
  const now = new Date().toISOString();
  const writes = [];
  for (const i of pending) {
    const item = cases[i];
    const verdict = verdicts.get(item.id);
    results[unsure[i].index] = applyVerdict(results[unsure[i].index], item.options, verdict);
    if (verdict && options.db !== false) {
      const picked = item.options.find((option) => option.n === verdict.pick) ?? null;
      writes.push(env.CW_DB.prepare(
        `INSERT INTO phrase_verdicts (domain, phrase_key, source, phrase, verdict, cases_hash, pick_path, target, basis, created_at)
         VALUES (?, ?, 'judge', ?, ?, ?, ?, NULL, ?, ?)
         ON CONFLICT(domain, phrase_key, source) DO UPDATE SET phrase = excluded.phrase, verdict = excluded.verdict,
           cases_hash = excluded.cases_hash, pick_path = excluded.pick_path, basis = excluded.basis, created_at = excluded.created_at`,
      ).bind(domain, phraseKey(item.phrase), item.phrase, verdict.verdict, item.hash, picked?.path ?? null, verdict.basis, now));
    }
  }
  if (writes.length) await env.CW_DB.batch(writes);
  return results;
}

/* ---------- zapamiętane werdykty (migracja 0014) ---------- */

/* Werdykt sędziego jest ważny, dopóki opiera się na tych samych kandydatach
   (hash), ale nie dłużej niż tyle dni – żeby stare oceny nie wisiały wiecznie. */
export const VERDICT_TTL_DAYS = 60;
export const JUDGE_PROMPT_VERSION = 1;

/** Hash tego, co sędzia widział: fraza, kandydaci (ścieżka + tytuł), prompt i model. */
export async function casesHash(item, model = JUDGE_MODEL) {
  const text = [
    `v${JUDGE_PROMPT_VERSION}`, model, phraseKey(item.phrase),
    ...item.options.map((option) => `${option.path}|${option.title}`).sort(),
  ].join('\n');
  const digest = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('').slice(0, 20);
}

/** Werdykty z bazy dla listy fraz: Map „klucz|źródło" → wiersz. */
async function storedVerdicts(env, domain, phrases) {
  const keys = [...new Set(phrases.map(phraseKey).filter(Boolean))];
  const out = new Map();
  if (!keys.length || !env.CW_DB) return out;
  try {
    const rows = (await env.CW_DB.prepare(
      `SELECT * FROM phrase_verdicts WHERE domain = ? AND phrase_key IN (${keys.map(() => '?').join(',')})`,
    ).bind(domain, ...keys).all()).results ?? [];
    for (const row of rows) out.set(`${row.phrase_key}|${row.source}`, row);
  } catch (error) {
    // Brak tabeli (migracja nie wykonana) nie może wyłączyć rekomendacji.
    console.error('phrase_verdicts', error instanceof Error ? error.message : error);
  }
  return out;
}

/** Decyzja redaktora → wynik: „ten sam temat" = odśwież wskazany wpis, „inny" = napisz nowy. */
export function applyEditor(result, row) {
  const editor = { verdict: row.verdict, at: row.created_at };
  if (row.verdict === 'same') {
    let target = null;
    try { target = row.target ? JSON.parse(row.target) : null; } catch { target = null; }
    return { ...result, action: 'refresh', target: target ?? result.target, reason: 'editor_same', judge: null, editor };
  }
  if (row.verdict === 'different') {
    return { ...result, action: 'new', target: null, reason: 'editor_different', judge: null, editor };
  }
  return result;
}

/** POST /api/cw/writer/verdict {domain, phrase, verdict: same|different|null, target?} */
async function saveEditorVerdict(env, domain, body) {
  const phrase = String(body.phrase ?? '').trim().slice(0, 120);
  const key = phraseKey(phrase);
  if (!key) return json({ error: 'Pusta fraza.' }, 400);
  if (body.verdict === null) {
    await env.CW_DB.prepare("DELETE FROM phrase_verdicts WHERE domain = ? AND phrase_key = ? AND source = 'editor'")
      .bind(domain, key).run();
    return json({ ok: true, verdict: null });
  }
  if (!['same', 'different'].includes(body.verdict)) return json({ error: 'Pole „verdict" przyjmuje: same, different albo null.' }, 400);
  let target = null;
  if (body.verdict === 'same') {
    const raw = body.target ?? {};
    if (!raw.title || !(raw.url || raw.path)) return json({ error: 'Wskaż wpis, który jest o tym samym temacie.' }, 400);
    target = {
      title: String(raw.title).slice(0, 300),
      url: raw.url ? String(raw.url).slice(0, 500) : null,
      path: raw.path ? String(raw.path).slice(0, 300) : null,
      catalog_id: raw.catalog_id ? String(raw.catalog_id).slice(0, 80) : null,
      post_id: Number.isInteger(raw.post_id) ? raw.post_id : null,
      score: typeof raw.score === 'number' ? raw.score : null,
    };
  }
  await env.CW_DB.prepare(
    `INSERT INTO phrase_verdicts (domain, phrase_key, source, phrase, verdict, cases_hash, pick_path, target, basis, created_at)
     VALUES (?, ?, 'editor', ?, ?, NULL, ?, ?, NULL, ?)
     ON CONFLICT(domain, phrase_key, source) DO UPDATE SET phrase = excluded.phrase, verdict = excluded.verdict,
       pick_path = excluded.pick_path, target = excluded.target, created_at = excluded.created_at`,
  ).bind(domain, key, phrase, body.verdict, target?.path ?? null, target ? JSON.stringify(target) : null, new Date().toISOString()).run();
  return json({ ok: true, verdict: body.verdict });
}

const round = (value) => Math.round(value * 1000) / 1000;

/* Mapa ścieżka → wpis katalogu (listowania w Vectorize nie ma) – raz na
   żądanie; daje numer wpisu i opis z nagłówkami dla sędziego. */
const pathCache = new WeakMap();
function catalogByPath(env, domain) {
  // Cache obietnicy, nie wyniku – frazy idą równolegle i każda pobierałaby katalog.
  let pending = pathCache.get(env);
  if (!pending) {
    pending = catalogItems(env, domain).then((items) => new Map(items.map((item) => [normPath(item.url), item])));
    pathCache.set(env, pending);
  }
  return pending;
}
async function postIdForPath(env, domain, path) {
  return (await catalogByPath(env, domain)).get(path)?.post_id ?? null;
}

/* ---------- sędzia w paśmie niepewności ---------- */

/*
 * Embeddingi dobrze znajdują kandydata (właściwy wpis jest pierwszy prawie
 * zawsze), ale w paśmie 0,5–0,75 nie rozstrzygają, czy to ten sam temat
 * („ghostwriting co to" ↔ „Kim jest ghostwriter?" 0,65) czy pokrewny
 * („historia stron internetowych" ↔ „weryfikacja historii domeny" 0,75).
 * Dlatego frazy z wynikiem „check" idą do jednego wywołania modelu z tytułem,
 * opisem i nagłówkami kandydatów. Model musi podać podstawę i może odmówić
 * (`skip`) – wtedy zostaje „Sprawdź".
 */
export const JUDGE_MODEL = 'google/gemini-3.7-flash';
const JUDGE_TIMEOUT_MS = 25_000;

export function buildJudgePrompt(cases) {
  const blocks = cases.map((item) => {
    const options = item.options.map((option) => [
      `  [${option.n}] ${option.title} (${option.path})${option.position ? ` – rankuje na tę frazę, pozycja ${option.position}` : ''}`,
      option.description ? `      opis: ${option.description}` : null,
      option.h2?.length ? `      nagłówki: ${option.h2.slice(0, 12).join(' | ')}` : null,
    ].filter(Boolean).join('\n')).join('\n');
    return `#${item.id} fraza: „${item.phrase}"\n${options}`;
  }).join('\n\n');
  return `Oceniasz, czy na blogu agencji marketingowej istnieje już strona na temat frazy z wyszukiwarki.
Dla każdej frazy masz kandydatów (tytuł, adres, opis i nagłówki, jeśli są). Rozstrzygnij:
- "same" – kandydat odpowiada na tę samą intencję wyszukiwania. Nowy artykuł na tę frazę konkurowałby z nim
  w Google (kanibalizacja). Literówki, odmiana, synonimy, skróty i nazwy potoczne to wciąż ten sam temat
  („fanpejdża" = fanpage, „webmachine" = Wayback Machine, „sprzedaż krzyżowa" = cross-selling).
- "related" – temat pokrewny: kandydat dotyka frazy, ale jest o czymś innym lub szerszym/węższym,
  a fraza zasługuje na własny tekst albo najwyżej sekcję („historia stron internetowych" ≠ „jak sprawdzić historię domeny").
- "different" – żaden kandydat nie jest o tym temacie.
- "skip" – nie da się rozstrzygnąć z podanych danych.
Nie zgaduj ponad to, co widać w tytułach, opisach i nagłówkach. Podstawę opisz jednym zdaniem po polsku.

${blocks}

Odpowiedz wyłącznie JSON-em:
{"results":[{"id":1,"verdict":"same|related|different|skip","pick":1,"basis":"…"}]}
"pick" = numer kandydata dla "same" i "related", null dla "different" i "skip".`;
}

function extractJson(text) {
  const raw = String(text ?? '').trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  try {
    return JSON.parse(raw);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

export async function judgeCases(env, cases, { fetchImpl = fetch } = {}) {
  const apiKey = (env.OPENROUTER_API_KEY || '').trim();
  if (!apiKey || !cases.length) return new Map();
  let response;
  try {
    response = await fetchImpl('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://zaplecze-dashboard.m-wisniewski.workers.dev',
        'X-Title': 'Content Writer - odswiez czy nowy',
      },
      body: JSON.stringify({
        model: (env.CW_JUDGE_MODEL || '').trim() || JUDGE_MODEL,
        messages: [{ role: 'user', content: buildJudgePrompt(cases) }],
        temperature: 0,
        // Zapas na tokeny rozumowania (Gemini potrafi zjeść większość limitu).
        max_tokens: 6000,
        response_format: { type: 'json_object' },
      }),
      signal: AbortSignal.timeout(JUDGE_TIMEOUT_MS),
    });
  } catch (error) {
    console.error('cw judge', error instanceof Error ? error.message : error);
    return new Map();
  }
  if (!response.ok) {
    console.error('cw judge openrouter', response.status, (await response.text().catch(() => '')).slice(0, 300));
    return new Map();
  }
  const payload = await response.json().catch(() => null);
  const data = extractJson(payload?.choices?.[0]?.message?.content);
  const out = new Map();
  for (const row of Array.isArray(data?.results) ? data.results : []) {
    const verdict = ['same', 'related', 'different', 'skip'].includes(row?.verdict) ? row.verdict : null;
    if (!verdict || !Number.isInteger(row.id)) continue;
    out.set(row.id, {
      verdict,
      pick: Number.isInteger(row.pick) ? row.pick : null,
      basis: String(row.basis ?? '').trim().slice(0, 300),
    });
  }
  return out;
}

/** Werdykt sędziego → decyzja. Bez werdyktu albo przy `skip` zostaje „Sprawdź". */
export function applyVerdict(result, options, verdict) {
  if (!verdict || verdict.verdict === 'skip') return result;
  const picked = options.find((option) => option.n === verdict.pick) ?? null;
  const judge = { verdict: verdict.verdict, basis: verdict.basis };
  if (verdict.verdict === 'same' && picked) {
    return { ...result, action: 'refresh', target: picked.row, reason: 'judge_same', judge };
  }
  if (verdict.verdict === 'related') {
    return { ...result, action: 'check', target: picked?.row ?? result.target, reason: 'judge_related', judge };
  }
  if (verdict.verdict === 'different') {
    return { ...result, action: 'new', target: null, reason: 'judge_different', judge };
  }
  return result;
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
  // Kalibracja: cosinus par tekstów dla wybranego modelu (za hasłem dashboardu).
  if (url.pathname === '/api/cw/writer/similarity' && request.method === 'POST') {
    if (!checkOrigin(request)) return json({ error: 'Żądanie odrzucone.' }, 403);
    const body = (await request.json().catch(() => null)) ?? {};
    const model = CALIBRATION_MODELS.includes(body.model) ? body.model : EMBED_MODEL;
    const pairs = (Array.isArray(body.pairs) ? body.pairs : []).slice(0, 40)
      .filter((pair) => Array.isArray(pair) && pair.length === 2).map(([a, b]) => [String(a), String(b)]);
    const texts = pairs.flat();
    if (!texts.length) return json({ results: [] });
    const result = await env.AI.run(model, { text: texts });
    const data = result?.data ?? [];
    return json({
      model,
      results: pairs.map(([a, b], i) => ({ a, b, score: round(cosine(data[2 * i], data[2 * i + 1])) })),
    });
  }
  const action = url.pathname.match(/^\/api\/cw\/writer\/(classify|reindex|verdict)\/?$/)?.[1];
  if (!action) return null;
  if (request.method !== 'POST') return json({ error: 'Dozwolona metoda: POST.' }, 405);
  if (!checkOrigin(request)) return json({ error: 'Żądanie odrzucone.' }, 403);
  if (!env.AI || !env.POSTS_INDEX) return json({ error: 'Brak bindingów AI albo POSTS_INDEX w Workerze.' }, 503);
  const body = (await request.json().catch(() => null)) ?? {};
  const domain = String(body.domain ?? '').toLowerCase();
  if (!domains.has(domain)) return json({ error: 'Domena spoza CW_DOMAINS.' }, 400);

  try {
    if (action === 'reindex') return json(await syncIndex(env, domain));
    if (action === 'verdict') return await saveEditorVerdict(env, domain, body);
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
