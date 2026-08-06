import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  buildGap,
  competitorKeywords,
  gapSummary,
  handleSerpGap,
  hostOf,
  isHomepage,
  normalizeKeyword,
  runStep,
  senutoUrlKeywords,
  serpCompetitors,
  titleQuery,
} from './cw-serp.js';

/** Minimalny stub D1 dla snapshotów SERP – trzyma jeden wiersz w pamięci. */
function fakeDb(initial = null) {
  const state = { row: initial, writes: [] };
  return {
    state,
    prepare: (sql) => {
      let args = [];
      const self = {
        bind: (...values) => {
          args = values;
          return self;
        },
        first: async () => (sql.includes('SELECT') ? state.row : null),
        run: async () => {
          if (sql.includes('INSERT')) {
            state.writes.push(args);
            const [, , , payload, status, error, createdAt] = args;
            state.row = { payload, status, error, created_at: createdAt };
          }
          return { meta: { changes: 1 } };
        },
      };
      return self;
    },
  };
}

const env = () => ({
  CW_DB: fakeDb(),
  SERPDATA_API_KEY: 'serp-key',
  SENUTO_API_KEY: 'senuto-key',
  CW_DOMAINS: 'grupa-icea.pl',
});

const serpResponse = (hosts) => ({
  data: {
    results: {
      organic_results: hosts.map((host, index) => ({
        pos: index + 1,
        url: `https://${host}/artykul`,
        domain: host,
        title: `Tytuł z ${host}`,
      })),
    },
  },
});

/** Senuto Analiza Widoczności: pozycja i wolumen siedzą w `statistics`. */
const senutoResponse = (rows) => ({
  data: rows.map((row) => ({
    keyword: row.keyword,
    statistics: {
      position: { current: row.position ?? 1 },
      searches: { current: row.searches ?? null },
    },
  })),
});

const OWN = [{ keyword: 'looker studio cennik', position: 8, searches: 30 }];

const postRequest = (body, query = '') =>
  new Request(`https://dash.example/api/cw/serp/grupa-icea.pl/5767${query}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

/* ---------- pomocnicze ---------- */

test('normalizeKeyword: ogonki i interpunkcja nie robią z jednej frazy dwóch', () => {
  assert.equal(normalizeKeyword('Błąd 403 – jak naprawić?'), 'blad 403 jak naprawic');
  assert.equal(normalizeKeyword('BŁĄD 403 jak naprawic'), 'blad 403 jak naprawic');
});

test('titleQuery: ucina dopisek po półpauzie i znaki zapytania', () => {
  assert.equal(titleQuery('Błąd 403 – jak naprawić? Co oznacza?'), 'Błąd 403');
  assert.equal(titleQuery('Czym jest Looker Studio'), 'Czym jest Looker Studio');
});

test('titleQuery: bardzo długi tytuł przycięty na granicy słowa', () => {
  const query = titleQuery('a'.repeat(50) + ' ' + 'b'.repeat(60));
  assert.ok(query.length <= 90);
  assert.ok(!query.endsWith(' '));
});

test('hostOf: zdejmuje www, na śmieciach nie wybucha', () => {
  assert.equal(hostOf('https://www.grupa-icea.pl/blog/x'), 'grupa-icea.pl');
  assert.equal(hostOf('nie-url'), '');
});

/* ---------- zestawienie fraz ---------- */

test('buildGap: dzieli frazy na brakujące, słabe i pokryte', () => {
  const own = [
    { keyword: 'błąd 403', position: 4 },
    { keyword: 'jak naprawić 403', position: 24 },
  ];
  const competitors = [
    { keyword: 'Błąd 403', searches: 1000, position: 5 },
    { keyword: 'jak naprawic 403', searches: 500, position: 2 },
    { keyword: 'error 403 forbidden', searches: 800, position: 9 },
  ];
  const { rows, summary } = buildGap(own, competitors);
  assert.deepEqual(summary, { total: 3, missing: 1, weak: 1, covered: 1 });
  // Kolejność wyznacza pozycja rywala – najpierw fraza, którą trzyma najwyżej.
  assert.deepEqual(rows.map((row) => row.rival_position), [2, 5, 9]);
  assert.equal(rows[0].status, 'weak');
  assert.equal(rows[0].our_position, 24);
  assert.equal(rows[2].keyword, 'error 403 forbidden');
  assert.equal(rows[2].status, 'missing');
});

test('buildGap: ta sama fraza u dwóch rywali liczy się raz – z lepszą pozycją', () => {
  const { rows } = buildGap([], [
    { keyword: 'seo', searches: 100, position: 8 },
    { keyword: 'SEO', searches: 900, position: 3 },
  ]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].rival_position, 3);
});

test('buildGap: brak naszych fraz = wszystko jest luką', () => {
  const { summary } = buildGap(undefined, [{ keyword: 'a', searches: 10, position: 1 }]);
  assert.deepEqual(summary, { total: 1, missing: 1, weak: 0, covered: 0 });
});

/* ---------- klienci API ---------- */

test('serpCompetitors: jeden adres na domenę, nasza pozycja osobno', async () => {
  const fetchImpl = async () =>
    new Response(JSON.stringify(serpResponse(['a.pl', 'a.pl', 'grupa-icea.pl', 'b.pl', 'c.pl', 'd.pl'])), { status: 200 });
  const { competitors, ours } = await serpCompetitors('błąd 403', 'grupa-icea.pl', env(), fetchImpl);
  assert.deepEqual(competitors.map((row) => row.host), ['a.pl', 'b.pl', 'c.pl']);
  assert.equal(ours.host, 'grupa-icea.pl');
  assert.equal(ours.position, 3);
});

test('serpCompetitors: nas poza wynikami = ours null, komplet konkurentów', async () => {
  const fetchImpl = async () =>
    new Response(JSON.stringify(serpResponse(['a.pl', 'b.pl', 'c.pl', 'd.pl'])), { status: 200 });
  const { competitors, ours } = await serpCompetitors('x', 'grupa-icea.pl', env(), fetchImpl);
  assert.equal(competitors.length, 3);
  assert.equal(ours, null);
});

test('serpCompetitors: nasz adres dalej niż konkurenci nadal wraca', async () => {
  const fetchImpl = async () =>
    new Response(JSON.stringify(serpResponse(['a.pl', 'b.pl', 'c.pl', 'd.pl', 'e.pl', 'grupa-icea.pl'])), { status: 200 });
  const { ours } = await serpCompetitors('x', 'grupa-icea.pl', env(), fetchImpl);
  assert.equal(ours.position, 6);
});

test('serpCompetitors: błąd HTTP niesie status w komunikacie', async () => {
  const fetchImpl = async () => new Response('DataProxy unavailable', { status: 503 });
  await assert.rejects(() => serpCompetitors('x', 'grupa-icea.pl', env(), fetchImpl), /HTTP 503/);
});

test('isHomepage: strona główna tak, podstrona nie', () => {
  assert.equal(isHomepage('https://semcore.pl/'), true);
  assert.equal(isHomepage('https://semcore.pl'), true);
  assert.equal(isHomepage('https://semcore.pl/jak-zlecic/'), false);
  assert.equal(isHomepage('nie-url'), false);
});

test('senutoUrlKeywords: pyta o pozycje adresu bez schematu, na bazie 2.0', async () => {
  let body = null;
  const fetchImpl = async (url, init) => {
    body = JSON.parse(init.body);
    assert.match(String(url), /visibility_analysis/);
    return new Response(JSON.stringify(senutoResponse([{ keyword: 'a', position: 4, searches: 10 }])), { status: 200 });
  };
  const rows = await senutoUrlKeywords('https://a.pl/x/', env(), fetchImpl);
  assert.equal(body.domain, 'a.pl/x/');
  assert.equal(body.fetch_mode, 'url');
  assert.equal(body.country_id, 200);
  assert.deepEqual(rows, [{ keyword: 'a', position: 4, searches: 10 }]);
});

test('competitorKeywords: strony główne pomijane, zostaje TOP wg pozycji rywala', async () => {
  const asked = [];
  const fetchImpl = async (url, init) => {
    const target = JSON.parse(init.body).domain;
    asked.push(target);
    return new Response(JSON.stringify(senutoResponse(
      target.startsWith('a.pl')
        ? [{ keyword: 'trafna', position: 3, searches: 100 }, { keyword: 'daleka', position: 44, searches: 9000 }]
        : [{ keyword: 'druga', position: 12, searches: 50 }],
    )), { status: 200 });
  };
  const rows = await competitorKeywords(
    ['https://a.pl/artykul/', 'https://home.pl/', 'https://b.pl/wpis/'],
    env(),
    fetchImpl,
  );
  // Strona główna rankuje na cały biznes serwisu – nie pytamy o nią wcale.
  assert.deepEqual(asked, ['a.pl/artykul/', 'b.pl/wpis/']);
  // Fraza z czwartej dziesiątki odpada mimo największego wolumenu.
  assert.deepEqual(rows.map((row) => row.keyword), ['trafna', 'druga']);
  assert.deepEqual(rows.map((row) => row.host), ['a.pl', 'b.pl']);
});

/* ---------- analiza ---------- */

/** Przepycha analizę przez wszystkie etapy – w produkcji robi to klient,
    odpytując Workera co kilka sekund. */
async function runToEnd(environment, input, fetchImpl) {
  let state = { input, stage: 'serp_title', queries: [] };
  try {
    while (state && state.stage !== 'done') {
      state = await runStep(environment, 'grupa-icea.pl', 5767, state, fetchImpl);
    }
    return state;
  } catch (error) {
    await environment.CW_DB.prepare('INSERT').bind(
      'grupa-icea.pl:5767', 'grupa-icea.pl', 5767, 'null', 'error', String(error.message), new Date().toISOString(),
    ).run();
    return null;
  }
}


test('analiza: dwa zapytania SERP – tytuł i nasza najlepsza fraza', async () => {
  const queries = [];
  const fetchImpl = async (url) => {
    if (String(url).includes('serpdata')) {
      queries.push(new URL(url).searchParams.get('keyword'));
      return new Response(JSON.stringify(serpResponse(['konkurent.pl'])), { status: 200 });
    }
    return new Response(JSON.stringify(senutoResponse([{ keyword: 'looker studio', searches: 5000 }])), { status: 200 });
  };
  const analysis = await runToEnd(env(), {
    title: 'Looker Studio – czym jest?',
    url: 'https://www.grupa-icea.pl/slownik/looker-studio/',
    ownKeywords: OWN,
  }, fetchImpl);
  assert.deepEqual(queries, ['Looker Studio', 'looker studio cennik']);
  assert.deepEqual(analysis.queries.map((row) => row.kind), ['title', 'own']);
  assert.equal(analysis.gap[0].keyword, 'looker studio');
  assert.equal(analysis.gap[0].status, 'missing');
});

test('analiza: fraza własna równa tytułowi = jedno zapytanie SERP', async () => {
  let serpCalls = 0;
  const fetchImpl = async (url) => {
    if (String(url).includes('serpdata')) {
      serpCalls += 1;
      return new Response(JSON.stringify(serpResponse(['konkurent.pl'])), { status: 200 });
    }
    return new Response(JSON.stringify(senutoResponse([])), { status: 200 });
  };
  await runToEnd(env(), {
    title: 'Looker Studio',
    url: 'https://www.grupa-icea.pl/x/',
    ownKeywords: [{ keyword: 'Looker Studio', position: 2 }],
  }, fetchImpl);
  assert.equal(serpCalls, 1);
});

test('analiza: rozjazd = hosty z tematu nieobecne na naszej frazie', async () => {
  const fetchImpl = async (url) => {
    if (String(url).includes('serpdata')) {
      const keyword = new URL(url).searchParams.get('keyword');
      return new Response(
        JSON.stringify(serpResponse(keyword === 'Looker Studio' ? ['temat-a.pl', 'temat-b.pl'] : ['temat-b.pl'])),
        { status: 200 },
      );
    }
    return new Response(JSON.stringify(senutoResponse([])), { status: 200 });
  };
  const analysis = await runToEnd(env(), {
    title: 'Looker Studio',
    url: 'https://www.grupa-icea.pl/x/',
    ownKeywords: [{ keyword: 'looker studio raporty', position: 15 }],
  }, fetchImpl);
  assert.deepEqual(analysis.drift, ['temat-a.pl']);
});

test('analiza: padnięte źródło zapisuje stan błędu, nie wyjątek', async () => {
  const environment = env();
  const fetchImpl = async (url) =>
    String(url).includes('serpdata')
      ? new Response('unavailable', { status: 503 })
      : new Response(JSON.stringify(senutoResponse([])), { status: 200 });
  const analysis = await runToEnd(environment, {
    title: 'Looker Studio', url: 'https://www.grupa-icea.pl/x/', ownKeywords: [],
  }, fetchImpl);
  assert.equal(analysis, null);
  assert.equal(environment.CW_DB.state.row.status, 'error');
  assert.match(environment.CW_DB.state.row.error, /HTTP 503/);
});

test('analiza: frazy tylko od konkurentów z SERP-u tematu, nie z naszej frazy', async () => {
  const asked = [];
  const fetchImpl = async (url, init) => {
    if (String(url).includes('serpdata')) {
      const keyword = new URL(url).searchParams.get('keyword');
      return new Response(
        JSON.stringify(serpResponse(keyword === 'Looker Studio' ? ['temat.pl'] : ['obca-branza.pl'])),
        { status: 200 },
      );
    }
    asked.push(JSON.parse(init.body).domain);
    return new Response(JSON.stringify(senutoResponse([])), { status: 200 });
  };
  await runToEnd(env(), {
    title: 'Looker Studio',
    url: 'https://www.grupa-icea.pl/x/',
    ownKeywords: [{ keyword: 'zupełnie inna fraza', position: 18 }],
  }, fetchImpl);
  assert.deepEqual(asked, ['temat.pl/artykul']);
});

/* ---------- endpoint ---------- */

test('handleSerpGap: POST z ctx oddaje 202 i liczy w tle', async () => {
  const environment = env();
  const pending = [];
  const fetchImpl = async (url) =>
    new Response(
      JSON.stringify(String(url).includes('serpdata') ? serpResponse(['konkurent.pl']) : senutoResponse([])),
      { status: 200 },
    );
  const response = await handleSerpGap(
    postRequest({ title: 'Looker Studio', url: 'https://www.grupa-icea.pl/x/', own_keywords: OWN }),
    environment,
    'grupa-icea.pl',
    5767,
    { waitUntil: (promise) => pending.push(promise) },
    fetchImpl,
  );
  assert.equal(response.status, 202);
  assert.equal((await response.json()).status, 'running');
  await Promise.all(pending);
  // Jedno żądanie = jeden etap: po SERP-ie tytułu czeka SERP naszej frazy.
  assert.equal(environment.CW_DB.state.row.status, 'running');
  assert.equal(JSON.parse(environment.CW_DB.state.row.payload).stage, 'serp_own');
});

test('handleSerpGap: kolejne żądania przesuwają analizę aż do końca', async () => {
  const environment = env();
  const pending = [];
  const ctx = { waitUntil: (promise) => pending.push(promise) };
  const fetchImpl = async (url) =>
    new Response(
      JSON.stringify(String(url).includes('serpdata') ? serpResponse(['konkurent.pl']) : senutoResponse([])),
      { status: 200 },
    );
  const body = { title: 'Looker Studio', url: 'https://www.grupa-icea.pl/x/', own_keywords: OWN };
  for (let i = 0; i < 4 && environment.CW_DB.state.row?.status !== 'done'; i += 1) {
    await handleSerpGap(postRequest(body), environment, 'grupa-icea.pl', 5767, ctx, fetchImpl);
    await Promise.all(pending.splice(0));
  }
  assert.equal(environment.CW_DB.state.row.status, 'done');
  assert.equal(JSON.parse(environment.CW_DB.state.row.payload).gap_summary.total, 0);
});

test('handleSerpGap: gotowy wynik wraca z cache bez zapytań do API', async () => {
  const environment = env();
  let calls = 0;
  const fetchImpl = async (url) => {
    calls += 1;
    return new Response(
      JSON.stringify(String(url).includes('serpdata') ? serpResponse(['konkurent.pl']) : senutoResponse([])),
      { status: 200 },
    );
  };
  const body = { title: 'Looker Studio', url: 'https://www.grupa-icea.pl/x/', own_keywords: OWN };
  await handleSerpGap(postRequest(body), environment, 'grupa-icea.pl', 5767, null, fetchImpl);
  const before = calls;
  const second = await handleSerpGap(postRequest(body), environment, 'grupa-icea.pl', 5767, null, fetchImpl);
  const payload = await second.json();
  assert.equal(calls, before);
  assert.equal(payload.from_cache, true);
});

test('handleSerpGap: ?force=1 pomija cache', async () => {
  const environment = env();
  let calls = 0;
  const fetchImpl = async (url) => {
    calls += 1;
    return new Response(
      JSON.stringify(String(url).includes('serpdata') ? serpResponse(['konkurent.pl']) : senutoResponse([])),
      { status: 200 },
    );
  };
  const body = { title: 'Looker Studio', url: 'https://www.grupa-icea.pl/x/', own_keywords: OWN };
  await handleSerpGap(postRequest(body), environment, 'grupa-icea.pl', 5767, null, fetchImpl);
  const before = calls;
  await handleSerpGap(postRequest(body, '?force=1'), environment, 'grupa-icea.pl', 5767, null, fetchImpl);
  assert.ok(calls > before);
});

test('handleSerpGap: GET bez zapisanej analizy zwraca stan idle', async () => {
  const response = await handleSerpGap(
    new Request('https://dash.example/api/cw/serp/grupa-icea.pl/5767'),
    env(),
    'grupa-icea.pl',
    5767,
  );
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'idle', analysis: null });
});

test('handleSerpGap: brak sekretu daje czytelny 503', async () => {
  const response = await handleSerpGap(
    postRequest({ title: 'x', url: 'https://www.grupa-icea.pl/x/' }),
    { ...env(), SERPDATA_API_KEY: '' },
    'grupa-icea.pl',
    5767,
  );
  assert.equal(response.status, 503);
  assert.match((await response.json()).error, /SERPDATA_API_KEY/);
});

test('writeSnapshot: stan „running" nie łamie NOT NULL na payloadzie', async () => {
  const environment = env();
  // Stub D1 odrzuca NULL w payloadzie tak jak prawdziwa tabela.
  const base = environment.CW_DB.prepare;
  environment.CW_DB.prepare = (sql) => {
    const statement = base(sql);
    const run = statement.run;
    let bound = [];
    const wrapped = {
      bind: (...values) => { bound = values; statement.bind(...values); return wrapped; },
      first: statement.first,
      run: async () => {
        if (sql.includes('INSERT') && bound[3] === null) throw new Error('NOT NULL constraint failed');
        return run();
      },
    };
    return wrapped;
  };
  const response = await handleSerpGap(
    postRequest({ title: 'Looker Studio', url: 'https://www.grupa-icea.pl/x/', own_keywords: [] }),
    environment,
    'grupa-icea.pl',
    5767,
    { waitUntil: () => {} },
    async (url) => new Response(
      JSON.stringify(String(url).includes('serpdata') ? serpResponse(['a.pl']) : senutoResponse([])),
      { status: 200 },
    ),
  );
  assert.equal(response.status, 202);
});

test('handleSerpGap: wznawia zaczętą analizę zamiast zaczynać od zera', async () => {
  const environment = env();
  const started = { input: { title: 'Looker Studio', url: 'https://www.grupa-icea.pl/x/', ownKeywords: [] },
    stage: 'keywords', queries: [{ kind: 'title', keyword: 'Looker Studio', competitors: [] }] };
  environment.CW_DB.state.row = {
    payload: JSON.stringify(started), status: 'running', error: null, created_at: new Date().toISOString(),
  };
  const calls = [];
  const pending = [];
  await handleSerpGap(
    postRequest({ title: 'Looker Studio', url: 'https://www.grupa-icea.pl/x/', own_keywords: [] }),
    environment,
    'grupa-icea.pl',
    5767,
    { waitUntil: (promise) => pending.push(promise) },
    async (url) => {
      calls.push(String(url));
      return new Response(JSON.stringify(senutoResponse([])), { status: 200 });
    },
  );
  await Promise.all(pending);
  // Etap SERP jest już zrobiony – wznowienie idzie prosto do fraz w Senuto.
  assert.equal(calls.filter((url) => url.includes('serpdata')).length, 0);
  assert.equal(environment.CW_DB.state.row.status, 'done');
});

test('gapSummary: do pipeline\'u idą tylko frazy niepokryte, w kolejności z panelu', async () => {
  const analysis = {
    generated_at: '2026-08-06T09:00:00.000Z',
    gap: [
      { keyword: 'leady fotowoltaika', searches: 140, status: 'missing', our_position: null, rival_position: 2 },
      { keyword: 'pozycjonowanie', searches: 900, status: 'covered', our_position: 4, rival_position: 1 },
      { keyword: 'ciepłe leady fotowoltaika', searches: 20, status: 'weak', our_position: 18, rival_position: 5 },
    ],
  };
  const environment = env();
  environment.CW_DB = fakeDb({
    payload: JSON.stringify(analysis), status: 'done', error: null,
    created_at: '2026-08-06T09:00:00.000Z',
  });

  const summary = await gapSummary(environment, 'grupa-icea.pl', 20811);
  assert.deepEqual(summary.keywords.map((row) => row.keyword),
    ['leady fotowoltaika', 'ciepłe leady fotowoltaika']);
  assert.equal(summary.keywords[1].status, 'weak');
  assert.equal(summary.generated_at, analysis.generated_at);
});

test('gapSummary: brak analizy albo same frazy pokryte = null, nie pusta lista', async () => {
  assert.equal(await gapSummary(env(), 'grupa-icea.pl', 20811), null);

  const environment = env();
  environment.CW_DB = fakeDb({
    payload: JSON.stringify({ gap: [{ keyword: 'a', status: 'covered' }] }),
    status: 'done', error: null, created_at: '2026-08-06T09:00:00.000Z',
  });
  assert.equal(await gapSummary(environment, 'grupa-icea.pl', 20811), null);
});
