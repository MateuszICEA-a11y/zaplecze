/**
 * Analiza SERP-gap – kto zajmuje temat wpisu i jakich fraz nam brakuje.
 *
 * Problem, który to rozwiązuje: wpis potrafi rankować na frazy peryferyjne,
 * a na jego właściwy temat stoją w SERP-ie konkurenci z zupełnie innym
 * zestawem fraz. Patrząc tylko na własne pozycje, nie widać tego rozjazdu.
 *
 * Dlatego pytamy SERP dwa razy:
 * - tytułem wpisu – „kto zajmuje ten temat",
 * - naszą najlepszą frazą – „z kim realnie konkurujemy dziś".
 * Hosty obecne tylko w pierwszym SERP-ie to właśnie rozjazd.
 *
 * Podział pracy między źródła:
 * - SerpData – żywe wyniki organiczne; jedno zapytanie idzie ~20 s, więc dwa
 *   nie mieszczą się w czasie życia żądania. Analiza leci w tle
 *   (ctx.waitUntil), klient odpytuje GET-em o stan.
 * - Senuto Analiza Widoczności (`positions/getData`, fetch_mode `url`) – frazy
 *   przypisane do konkretnego adresu konkurenta RAZEM Z JEGO POZYCJĄ. To ta
 *   pozycja decyduje, które frazy pokazujemy: strona rankująca na frazę w
 *   czołówce trafia w intencję, fraza z czwartej dziesiątki to zwykle przypadek.
 * - Nasze frazy z pozycjami przychodzą z katalogu (dane collectora), więc
 *   nie płacimy za nie drugi raz.
 *
 * Sekrety: SERPDATA_API_KEY, SENUTO_API_KEY.
 * Gotcha Senuto: Analiza Widoczności działa na country_id=200 (baza 2.0 – ta
 * z aplikacji), a URL podajemy bez schematu. API nie sortuje po pozycji, więc
 * porządkujemy u siebie po pobraniu stron.
 */

export const SERP_CACHE_HOURS = 24 * 7; // powtórka w tygodniu to ten sam SERP
// Lustro COMPETITOR_LIMIT z pipeline (config.py) – obie ścieżki muszą patrzeć
// na ten sam kawałek czołówki. Przy trzech adresach edytor pokazywał zero fraz
// tam, gdzie pipeline widział dziewięć: Senuto zna frazy podstrony dopiero od
// czwartego wyniku, więc lista obowiązkowa szła do briefu pusta.
export const COMPETITORS_LIMIT = 5;
export const KEYWORDS_LIMIT = 100; // twardy limit strony w API Senuto
export const KEYWORDS_PAGES = 3; // dalej niż 300 fraz na adres nie ma po co iść
// Frazy konkurentów: pokazujemy garść najtrafniejszych, nie całą pulę. Dalej
// niż druga strona wyników fraza rzadko opisuje temat strony.
export const KEYWORDS_TOP = 10;
export const RIVAL_POSITION_MAX = 20;
export const GAP_SHOWN = KEYWORDS_TOP;
const SENUTO_COUNTRY_ID = 200;
const TIMEOUT_MS = 60_000;
const SERPDATA_SEARCH = 'https://api.serpdata.io/v1/search';
const SENUTO_POSITIONS = 'https://api.senuto.com/api/visibility_analysis/reports/positions/getData';
// Bez własnego User-Agenta SerpData odbija żądanie z 403 (WAF nie przepuszcza
// domyślnego klienta) – ta sama gotcha co w pipeline'ie.
const USER_AGENT = 'ICEA-ContentWatcher/1.0';

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

const nowIso = () => new Date().toISOString();

/** Normalizacja frazy do porównań: bez ogonków, znaków i podwójnych spacji. */
export function normalizeKeyword(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ł/g, 'l')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export const hostOf = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
};

/**
 * Tytuł → zapytanie do SERP-a. Ucinamy ozdobniki, które w wyszukiwarce tylko
 * rozmywają intencję: dopisek po półpauzie, pytajnik, cudzysłowy.
 * Bliźniak `title_query` z pipeline/content-refresher/research.py.
 */
export function titleQuery(title) {
  const base = String(title ?? '')
    .replace(/\s*[–—|]\s*.*$/, '')
    .replace(/[?!"„”]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return base.length > 90 ? base.slice(0, 90).replace(/\s+\S*$/, '') : base;
}

async function fetchJson(url, init, fetchImpl) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetchImpl(url, { ...init, signal: controller.signal });
    const text = await response.text();
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${text.slice(0, 200)}`);
    return JSON.parse(text);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Wyniki organiczne dla frazy: konkurenci (jeden adres na domenę) i nasza
 * własna pozycja. Bez tej drugiej nie wiadomo, czy w ogóle jesteśmy w grze –
 * a to pierwsze pytanie, które zadaje człowiek patrzący na SERP.
 */
export async function serpCompetitors(keyword, ownHost, env, fetchImpl = fetch) {
  const query = new URLSearchParams({ keyword, hl: 'pl', gl: 'pl' });
  const payload = await fetchJson(`${SERPDATA_SEARCH}?${query}`, {
    headers: {
      Authorization: `Bearer ${env.SERPDATA_API_KEY}`,
      Accept: 'application/json',
      'User-Agent': USER_AGENT,
    },
  }, fetchImpl);
  const results = (payload?.data?.results ?? payload?.results ?? {});
  const rows = [];
  const seen = new Set();
  let ours = null;
  let checked = 0;
  for (const row of results.organic_results ?? []) {
    const url = row.url ?? '';
    const host = row.domain ? String(row.domain).replace(/^www\./, '') : hostOf(url);
    if (!url || !host) continue;
    checked += 1;
    const position = row.pos ?? row.global_pos ?? checked;
    if (host === ownHost) {
      if (!ours) ours = { position, url, host, title: row.title ?? null };
      continue;
    }
    if (seen.has(host)) continue;
    seen.add(host);
    if (rows.length < COMPETITORS_LIMIT) {
      rows.push({ position, url, host, title: row.title ?? null });
    }
    // Konkurentów mamy komplet, ale wyniki przeglądamy do końca strony –
    // nasz adres bywa dopiero na dziewiątej pozycji.
    if (rows.length >= COMPETITORS_LIMIT && ours) break;
  }
  return { competitors: rows, ours, checked };
}

/** Adres strony głównej? Taki wynik rankuje na cały biznes serwisu (brand,
    „agencja seo poznań"), a nie na temat wpisu – do fraz go nie bierzemy. */
export const isHomepage = (url) => {
  try {
    return new URL(url).pathname.replace(/\/+$/, '') === '';
  } catch {
    return false;
  }
};

/**
 * Frazy jednego adresu wraz z pozycją konkurenta (Senuto Analiza Widoczności).
 * API nie przyjmuje sortowania ani filtra pozycji, więc bierzemy do
 * KEYWORDS_PAGES stron i porządkujemy u siebie.
 */
export async function senutoUrlKeywords(url, env, fetchImpl = fetch) {
  const target = String(url ?? '').trim().replace(/^https?:\/\//, '');
  if (!target) return [];
  const rows = [];
  for (let page = 1; page <= KEYWORDS_PAGES; page += 1) {
    const payload = await fetchJson(SENUTO_POSITIONS, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.SENUTO_API_KEY}`,
        'content-type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        domain: target,
        fetch_mode: 'url',
        country_id: SENUTO_COUNTRY_ID,
        limit: KEYWORDS_LIMIT,
        page,
      }),
    }, fetchImpl);
    // Senuto owija listę raz płasko (`data`), raz w `data.data` – zależnie
    // od raportu; obsługujemy oba kształty, jak w research.py.
    const batch = Array.isArray(payload?.data) ? payload.data
      : Array.isArray(payload?.data?.data) ? payload.data.data : [];
    for (const row of batch) {
      const stats = row?.statistics ?? {};
      const position = stats.position?.current ?? null;
      if (!row?.keyword || position == null) continue;
      rows.push({ keyword: row.keyword, position, searches: stats.searches?.current ?? null });
    }
    if (batch.length < KEYWORDS_LIMIT) break;
  }
  return rows;
}

/**
 * Frazy kompletu konkurentów zwężone do tych, które realnie opisują temat:
 * tylko podstrony (nie strony główne), tylko pozycje z RIVAL_POSITION_MAX,
 * jedna fraza raz – z najlepszą pozycją, jaką ma na nią którykolwiek rywal.
 */
export async function competitorKeywords(urls, env, fetchImpl = fetch) {
  const pages = (urls ?? []).filter((url) => url && !isHomepage(url));
  const best = new Map();
  for (const url of pages) {
    for (const row of await senutoUrlKeywords(url, env, fetchImpl)) {
      if (row.position > RIVAL_POSITION_MAX) continue;
      const key = normalizeKeyword(row.keyword);
      if (!key) continue;
      const current = best.get(key);
      if (!current || row.position < current.position) best.set(key, { ...row, host: hostOf(url) });
    }
  }
  return [...best.values()]
    .sort((a, b) => a.position - b.position || (b.searches ?? 0) - (a.searches ?? 0))
    .slice(0, KEYWORDS_TOP);
}

/**
 * Zestawienie fraz konkurencji z naszymi. Luka = fraza, której nie mamy
 * w ogóle; „słaba" = mamy, ale poza TOP 10. Nasze pozycje pochodzą z katalogu
 * (Senuto z collectora), pozycja rywala – z `competitorKeywords`.
 */
export function buildGap(ownRows, competitorRows) {
  const own = new Map();
  for (const row of ownRows ?? []) {
    const key = normalizeKeyword(row.keyword);
    if (!key) continue;
    const current = own.get(key);
    if (!current || (row.position ?? 999) < (current.position ?? 999)) own.set(key, row);
  }
  const best = new Map();
  for (const row of competitorRows ?? []) {
    const key = normalizeKeyword(row.keyword);
    if (!key) continue;
    const current = best.get(key);
    // Ta sama fraza u dwóch rywali – zostaje ta z lepszą (niższą) pozycją.
    if (!current || (row.position ?? 999) < (current.position ?? 999)) best.set(key, row);
  }
  const rows = [];
  for (const [key, row] of best) {
    const ours = own.get(key) ?? null;
    const ourPosition = ours?.position ?? null;
    rows.push({
      keyword: row.keyword,
      searches: row.searches ?? null,
      rival_position: row.position ?? null,
      rival_host: row.host ?? null,
      our_position: ourPosition,
      status: ours === null ? 'missing' : ourPosition !== null && ourPosition > 10 ? 'weak' : 'covered',
    });
  }
  // Kolejność to trafność: najpierw frazy, na których rywal stoi najwyżej.
  rows.sort((a, b) => (a.rival_position ?? 999) - (b.rival_position ?? 999)
    || (b.searches ?? 0) - (a.searches ?? 0));
  return {
    rows: rows.slice(0, GAP_SHOWN),
    summary: {
      total: rows.length,
      missing: rows.filter((row) => row.status === 'missing').length,
      weak: rows.filter((row) => row.status === 'weak').length,
      covered: rows.filter((row) => row.status === 'covered').length,
    },
  };
}

const cacheKey = (domain, postId) => `${domain}:${postId}`;

async function readSnapshot(env, domain, postId) {
  const row = await env.CW_DB.prepare(
    'SELECT payload, status, error, created_at FROM serp_snapshots WHERE id = ?',
  ).bind(cacheKey(domain, postId)).first();
  if (!row) return null;
  let analysis = null;
  try {
    analysis = row.payload ? JSON.parse(row.payload) : null;
  } catch {
    analysis = null;
  }
  return { status: row.status ?? 'done', error: row.error ?? null, created_at: row.created_at, analysis };
}

async function writeSnapshot(env, domain, postId, { status, analysis = null, error = null }) {
  await env.CW_DB.prepare(
    `INSERT INTO serp_snapshots (id, domain, post_id, payload, status, error, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, status = excluded.status,
       error = excluded.error, created_at = excluded.created_at`,
  )
    // `payload` jest NOT NULL, a stan „running" nie ma jeszcze wyniku – idzie
    // wtedy literał JSON-owego null, nie wartość NULL kolumny.
    .bind(cacheKey(domain, postId), domain, postId, JSON.stringify(analysis ?? null), status, error, nowIso())
    .run();
}

const isFresh = (createdAt, maxAgeHours = SERP_CACHE_HOURS) => {
  const age = (Date.now() - Date.parse(createdAt ?? '')) / 3_600_000;
  return Number.isFinite(age) && age <= maxAgeHours;
};

/**
 * Jeden etap analizy. SerpData odpowiada ~20 s na zapytanie, a Worker ma
 * ograniczony czas życia – komplet (dwa SERP-y + Senuto) go przekracza, więc
 * każde żądanie wykonuje dokładnie jeden krok i zapisuje stan w D1.
 * Klient odpytuje dalej, aż etap dojdzie do `done`.
 */
export async function runStep(env, domain, postId, state, fetchImpl = fetch) {
  const { input, stage, queries = [] } = state;
  const ownHost = hostOf(input.url);
  const topic = titleQuery(input.title) || input.title;
  const ownBest = [...(input.ownKeywords ?? [])].sort((a, b) => (a.position ?? 999) - (b.position ?? 999))[0] ?? null;
  const ownKeyword =
    ownBest?.keyword && normalizeKeyword(ownBest.keyword) !== normalizeKeyword(topic) ? ownBest.keyword : null;

  if (stage === 'serp_title') {
    const { competitors, ours, checked } = await serpCompetitors(topic, ownHost, env, fetchImpl);
    const next = {
      ...state,
      queries: [{ kind: 'title', keyword: topic, competitors, ours, results_checked: checked }],
      stage: ownKeyword ? 'serp_own' : 'keywords',
    };
    await writeSnapshot(env, domain, postId, { status: 'running', analysis: next });
    return next;
  }

  if (stage === 'serp_own') {
    const { competitors, ours, checked } = await serpCompetitors(ownKeyword, ownHost, env, fetchImpl);
    const next = {
      ...state,
      queries: [...queries, { kind: 'own', keyword: ownKeyword, competitors, ours, results_checked: checked }],
      stage: 'keywords',
    };
    await writeSnapshot(env, domain, postId, { status: 'running', analysis: next });
    return next;
  }

  const titleHosts = new Set((queries.find((row) => row.kind === 'title')?.competitors ?? []).map((row) => row.host));
  const ownHosts = new Set((queries.find((row) => row.kind === 'own')?.competitors ?? []).map((row) => row.host));
  // Frazy zbieramy WYŁĄCZNIE od konkurentów z SERP-u tematu. Wyniki naszej
  // dzisiejszej frazy służą do wykrycia rozjazdu, a nie do budowania luk –
  // przy frazie peryferyjnej („zmiana linku" → skracacze URL-i) wciągałyby
  // do briefu słownictwo z zupełnie innej branży.
  const competitorUrls = [
    ...new Set((queries.find((row) => row.kind === 'title')?.competitors ?? []).map((item) => item.url)),
  ];
  const rivalKeywords = await competitorKeywords(competitorUrls, env, fetchImpl);
  const gap = buildGap(input.ownKeywords ?? [], rivalKeywords);
  const analysis = {
    title: input.title,
    url: input.url,
    queries,
    drift: ownHosts.size ? [...titleHosts].filter((host) => !ownHosts.has(host)) : [],
    own_keywords_total: (input.ownKeywords ?? []).length,
    // Ile adresów rywali dało frazy, a ile odpadło jako strony główne –
    // bez tego pusta tabela wygląda na awarię, a jest świadomym pominięciem.
    keywords_scanned: competitorUrls.filter((url) => !isHomepage(url)).length,
    keywords_skipped_home: competitorUrls.filter((url) => isHomepage(url)).length,
    gap: gap.rows,
    gap_summary: gap.summary,
    stage: 'done',
    generated_at: nowIso(),
  };
  await writeSnapshot(env, domain, postId, { status: 'done', analysis });
  return analysis;
}

/**
 * Frazy do pokrycia z zapisanej analizy SERP – to samo, co edytor pokazuje
 * w panelu „Frazy do pokrycia".
 *
 * Idą do pipeline'u w `client_payload`, bo bez nich model przepisujący widzi
 * wyłącznie własną listę z briefu i pisze pod inne frazy, niż ocenia edytor.
 * Efekt był taki, że przejazd podnosił ocenę o kilka punktów i zostawiał
 * najłatwiejsze frazy nietknięte.
 */
export async function gapSummary(env, domain, postId, limit = 12) {
  const snapshot = await readSnapshot(env, domain, postId);
  if (snapshot?.status !== 'done') return null;
  const rows = (snapshot.analysis?.gap ?? [])
    .filter((row) => row.status !== 'covered' && (row.keyword || '').trim())
    .slice(0, limit)
    .map((row) => ({
      keyword: row.keyword,
      searches: row.searches ?? null,
      status: row.status,
      our_position: row.our_position ?? null,
      rival_position: row.rival_position ?? null,
    }));
  if (!rows.length) return null;
  return { keywords: rows, generated_at: snapshot.analysis?.generated_at ?? null };
}

/** Wykonanie kroku z zapisem błędu – wywoływane zawsze przez ctx.waitUntil. */
async function stepSafely(env, domain, postId, state, fetchImpl) {
  try {
    return await runStep(env, domain, postId, state, fetchImpl);
  } catch (error) {
    await writeSnapshot(env, domain, postId, {
      status: 'error',
      error: error instanceof Error ? error.message : 'Nieznany błąd analizy SERP.',
    });
    return null;
  }
}

/**
 * GET  /api/cw/serp/:domain/:postId – stan (`idle` | `running` | `done` | `error`).
 * POST /api/cw/serp/:domain/:postId – start albo kolejny krok analizy.
 *   body: {title, url, own_keywords}; `?force=1` pomija zapisany wynik.
 *
 * Klient POST-uje w pętli co kilka sekund: pierwsze żądanie zakłada stan,
 * każde kolejne przesuwa analizę o jeden etap.
 */
export async function handleSerpGap(request, env, domain, postId, ctx, fetchImpl = fetch) {
  const url = new URL(request.url);
  const snapshot = await readSnapshot(env, domain, postId);

  if (request.method === 'GET') {
    if (!snapshot) return json({ status: 'idle', analysis: null });
    const done = snapshot.status === 'done';
    return json({
      status: snapshot.status,
      analysis: done ? snapshot.analysis : null,
      stage: snapshot.analysis?.stage ?? null,
      error: snapshot.error,
      checked_at: snapshot.created_at,
    });
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Przekazano nieprawidłowe dane (błąd formatu lub zbyt duży rozmiar).' }, 400);
  }
  const title = String(body.title ?? '').trim();
  const pageUrl = String(body.url ?? '').trim();
  if (!title || !pageUrl) return json({ error: 'Wymagane pola: title, url.' }, 400);
  if (!env.SERPDATA_API_KEY) return json({ error: 'Brak sekretu SERPDATA_API_KEY w Workerze.' }, 503);
  if (!env.SENUTO_API_KEY) return json({ error: 'Brak sekretu SENUTO_API_KEY w Workerze.' }, 503);

  const force = url.searchParams.get('force') === '1';
  if (!force && snapshot?.status === 'done' && isFresh(snapshot.created_at)) {
    return json({ status: 'done', analysis: snapshot.analysis, from_cache: true });
  }

  const input = {
    title,
    url: pageUrl,
    ownKeywords: Array.isArray(body.own_keywords) ? body.own_keywords : [],
  };
  // Kontynuujemy zaczętą analizę, o ile nie jest starsza niż kwadrans –
  // dłuższa cisza znaczy, że krok padł razem z Workerem.
  const resumable =
    !force && snapshot?.status === 'running' && snapshot.analysis?.stage && isFresh(snapshot.created_at, 0.25);
  const state = resumable ? snapshot.analysis : { input, stage: 'serp_title', queries: [] };
  if (!resumable) await writeSnapshot(env, domain, postId, { status: 'running', analysis: state });

  const work = stepSafely(env, domain, postId, state, fetchImpl);
  if (ctx?.waitUntil) {
    ctx.waitUntil(work);
    return json({ status: 'running', stage: state.stage, analysis: null }, 202);
  }
  // Bez kontekstu Workera (testy) liczymy krok po kroku od razu.
  let current = await work;
  while (current && current.stage && current.stage !== 'done') {
    current = await stepSafely(env, domain, postId, current, fetchImpl);
  }
  return current?.stage === 'done'
    ? json({ status: 'done', analysis: current })
    : json({ status: 'error', analysis: null }, 502);
}
