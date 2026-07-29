import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  buildGap,
  handleSerpGap,
  hostOf,
  normalizeKeyword,
  runStep,
  senutoKeywords,
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

/** Senuto Baza Słów Kluczowych: `data` to płaska tablica, bez pozycji. */
const senutoResponse = (rows) => ({ data: rows });

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
    { keyword: 'Błąd 403', searches: 1000 },
    { keyword: 'jak naprawic 403', searches: 500 },
    { keyword: 'error 403 forbidden', searches: 800 },
  ];
  const { rows, summary } = buildGap(own, competitors);
  assert.deepEqual(summary, { total: 3, missing: 1, weak: 1, covered: 1 });
  // Luka idzie pierwsza, dopiero po niej słaba pozycja i pokryta fraza.
  assert.equal(rows[0].keyword, 'error 403 forbidden');
  assert.equal(rows[0].status, 'missing');
  assert.equal(rows[1].status, 'weak');
  assert.equal(rows[1].our_position, 24);
  assert.equal(rows[2].status, 'covered');
});

test('buildGap: ta sama fraza w dwóch pisowniach liczy się raz', () => {
  const { rows } = buildGap([], [
    { keyword: 'seo', searches: 100 },
    { keyword: 'SEO', searches: 900 },
  ]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].searches, 900);
});

test('buildGap: brak naszych fraz = wszystko jest luką', () => {
  const { summary } = buildGap(undefined, [{ keyword: 'a', searches: 10 }]);
  assert.deepEqual(summary, { total: 1, missing: 1, weak: 0, covered: 0 });
});

/* ---------- klienci API ---------- */

test('serpCompetitors: jeden adres na domenę, bez naszej własnej', async () => {
  const fetchImpl = async () =>
    new Response(JSON.stringify(serpResponse(['a.pl', 'a.pl', 'grupa-icea.pl', 'b.pl', 'c.pl', 'd.pl'])), { status: 200 });
  const rows = await serpCompetitors('błąd 403', 'grupa-icea.pl', env(), fetchImpl);
  assert.deepEqual(rows.map((row) => row.host), ['a.pl', 'b.pl', 'c.pl']);
});

test('serpCompetitors: błąd HTTP niesie status w komunikacie', async () => {
  const fetchImpl = async () => new Response('DataProxy unavailable', { status: 503 });
  await assert.rejects(() => serpCompetitors('x', 'grupa-icea.pl', env(), fetchImpl), /HTTP 503/);
});

test('senutoKeywords: pusta lista adresów nie woła API', async () => {
  let called = false;
  await senutoKeywords([], env(), async () => {
    called = true;
    return new Response('{}', { status: 200 });
  });
  assert.equal(called, false);
});

test('senutoKeywords: format ciała jak w pipelinie, country_id 1 zamiast 200', async () => {
  let body = null;
  const fetchImpl = async (url, init) => {
    body = JSON.parse(init.body);
    return new Response(JSON.stringify(senutoResponse([{ keyword: 'a', searches: 10, cpc: 0.5 }])), { status: 200 });
  };
  const rows = await senutoKeywords(['https://a.pl/x/'], env(), fetchImpl);
  // Prostsze `{urls: […]}` API odrzuca kodem 418 – stąd parameters + filtering.
  assert.equal(body.country_id, 1);
  assert.deepEqual(body.parameters, [{ data_fetch_mode: 'url', value: ['https://a.pl/x/'] }]);
  assert.deepEqual(body.filtering, [{ filters: [] }]);
  assert.ok(body.limit <= 100);
  assert.deepEqual(rows, [{ keyword: 'a', searches: 10, cpc: 0.5 }]);
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
    asked.push(JSON.parse(init.body).parameters[0].value);
    return new Response(JSON.stringify(senutoResponse([])), { status: 200 });
  };
  await runToEnd(env(), {
    title: 'Looker Studio',
    url: 'https://www.grupa-icea.pl/x/',
    ownKeywords: [{ keyword: 'zupełnie inna fraza', position: 18 }],
  }, fetchImpl);
  assert.deepEqual(asked, [['https://temat.pl/artykul']]);
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
