import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  canTransition,
  checkMutationOrigin,
  parseCallback,
  parseJobRequest,
  routeContentWatcher,
  signPayload,
  timingSafeEqual,
  verifySignature,
  DEFAULT_MODELS,
  SIGNATURE_WINDOW_S,
} from './cw-api.js';

const SECRET = 'testowy-sekret-callbacku';

/** Minimalny stub D1: reakcje dobierane po fragmencie SQL. */
function fakeDb(reactions = {}) {
  const calls = [];
  const respond = (sql, args) => {
    for (const [needle, value] of Object.entries(reactions)) {
      if (sql.includes(needle)) return typeof value === 'function' ? value(args) : value;
    }
    return undefined;
  };
  const statement = (sql) => {
    let args = [];
    const self = {
      sql,
      bind: (...values) => {
        args = values;
        return self;
      },
      first: async () => {
        calls.push({ sql, args, op: 'first' });
        return respond(sql, args) ?? null;
      },
      all: async () => {
        calls.push({ sql, args, op: 'all' });
        return { results: respond(sql, args) ?? [] };
      },
      run: async () => {
        calls.push({ sql, args, op: 'run' });
        return { meta: { changes: respond(sql, args) ?? 1 } };
      },
    };
    return self;
  };
  return {
    calls,
    prepare: (sql) => statement(sql),
    batch: async (statements) => {
      calls.push({ op: 'batch', size: statements.length });
      return [];
    },
  };
}

async function callbackRequest(body, { secret = SECRET, timestamp, signature } = {}) {
  const raw = JSON.stringify(body);
  const stamp = timestamp ?? String(Math.floor(Date.now() / 1000));
  const sig = signature ?? (await signPayload(secret, stamp, raw));
  return new Request('https://dash.example/api/cw/callback', {
    method: 'POST',
    headers: { 'X-CW-Timestamp': stamp, 'X-CW-Signature': sig, 'Content-Type': 'application/json' },
    body: raw,
  });
}

const runningJob = { id: 'job-abcdef12', status: 'running', run_id: '555', run_attempt: 1 };

/* ---------- podpis ---------- */

test('podpis: poprawny przechodzi, zmieniona treść nie', async () => {
  const stamp = String(Math.floor(Date.now() / 1000));
  const body = '{"job_id":"job-abcdef12"}';
  const signature = await signPayload(SECRET, stamp, body);

  assert.equal((await verifySignature({ secret: SECRET, timestamp: stamp, signature, body })).ok, true);
  const tampered = await verifySignature({ secret: SECRET, timestamp: stamp, signature, body: `${body} ` });
  assert.equal(tampered.ok, false);
  assert.equal(tampered.reason, 'mismatch');
});

test('podpis: poza oknem czasowym odrzucony', async () => {
  const stamp = String(Math.floor(Date.now() / 1000) - SIGNATURE_WINDOW_S - 10);
  const body = '{}';
  const signature = await signPayload(SECRET, stamp, body);
  const result = await verifySignature({ secret: SECRET, timestamp: stamp, signature, body });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'expired');
});

test('podpis: brak sekretu w Workerze nie przepuszcza niczego', async () => {
  const result = await verifySignature({ secret: '', timestamp: '1', signature: 'x', body: '{}' });
  assert.deepEqual(result, { ok: false, reason: 'no_secret' });
});

test('timingSafeEqual: równe / różne / różnej długości', () => {
  assert.equal(timingSafeEqual('abc', 'abc'), true);
  assert.equal(timingSafeEqual('abc', 'abd'), false);
  assert.equal(timingSafeEqual('abc', 'ab'), false);
});

/* ---------- przejścia stanów ---------- */

test('przejścia stanów: zamknięte zadanie zostaje zamknięte', () => {
  assert.equal(canTransition('running', 'done'), true);
  assert.equal(canTransition('running', 'stale'), true);
  assert.equal(canTransition('done', 'running'), false);
  assert.equal(canTransition('cancelled', 'done'), false);
  assert.equal(canTransition('failed', 'queued'), true); // ręczne ponowienie
});

/* ---------- walidacja wejścia ---------- */

test('parseJobRequest: komplet danych przechodzi, domyślny pakiet ulepszeń', () => {
  const result = parseJobRequest({
    domain: 'grupa-icea.pl',
    post_id: '41675',
    url: 'https://www.grupa-icea.pl/blog/test/',
    title: 'Tytuł wpisu',
  });
  assert.equal(result.ok, true);
  assert.equal(result.job.post_id, 41675);
  assert.equal(result.job.post_type, 'posts');
  assert.deepEqual(result.job.improvements, ['gaps', 'expert', 'sources', 'internal_links']);
});

test('parseJobRequest: odrzuca zły URL, brak tytułu i nieznane ulepszenia', () => {
  const bad = parseJobRequest({ domain: 'grupa-icea.pl', post_id: 1, url: 'javascript:alert(1)', title: '' });
  assert.equal(bad.ok, false);
  assert.deepEqual(bad.errors.sort(), ['title', 'url']);

  const unknown = parseJobRequest({
    domain: 'grupa-icea.pl',
    post_id: 1,
    url: 'https://x.pl/a/',
    title: 'T',
    improvements: ['rm -rf'],
  });
  assert.equal(unknown.ok, false);
  assert.deepEqual(unknown.errors, ['improvements']);
});

test('parseJobRequest: modele – walidacja formatu, brak pola daje null', () => {
  const base = { domain: 'grupa-icea.pl', post_id: 1, url: 'https://x.pl/a/', title: 'T' };

  const none = parseJobRequest(base);
  assert.equal(none.ok, true);
  assert.equal(none.job.models, null);

  const ok = parseJobRequest({ ...base, models: { research: 'perplexity/sonar-pro', writer: 'anthropic/claude-sonnet-5' } });
  assert.equal(ok.ok, true);
  assert.deepEqual(ok.job.models, { research: 'perplexity/sonar-pro', writer: 'anthropic/claude-sonnet-5' });

  // Jeden model podany → drugi uzupełniony defaultem.
  const partial = parseJobRequest({ ...base, models: { writer: 'google/gemini-3.1-pro' } });
  assert.equal(partial.job.models.research, DEFAULT_MODELS.research);
  assert.equal(partial.job.models.writer, 'google/gemini-3.1-pro');

  const bad = parseJobRequest({ ...base, models: { writer: 'nie model!! ;drop' } });
  assert.equal(bad.ok, false);
  assert.deepEqual(bad.errors, ['models']);

  // Pusty obiekt = jak brak pola.
  assert.equal(parseJobRequest({ ...base, models: {} }).job.models, null);
});

test('parseJobRequest: author opcjonalny, przycinany do 120 znaków', () => {
  const base = { domain: 'grupa-icea.pl', post_id: 1, url: 'https://x.pl/a/', title: 'T' };
  assert.equal(parseJobRequest(base).job.author, '');
  const long = parseJobRequest({ ...base, author: `  ${'A'.repeat(200)}  ` });
  assert.equal(long.job.author.length, 120);
});

test('parseCallback: wymaga job_id i run_id, przycina błąd', () => {
  assert.equal(parseCallback({ job_id: 'short' }).ok, false);
  const ok = parseCallback({
    job_id: 'job-abcdef12',
    run_id: 555,
    run_attempt: 2,
    status: 'running',
    error: 'x'.repeat(5000),
  });
  assert.equal(ok.ok, true);
  assert.equal(ok.callback.run_id, '555');
  assert.equal(ok.callback.error.length, 2000);
});

/* ---------- CSRF ---------- */

test('checkMutationOrigin: wymaga własnego nagłówka i zgodnego Origin', () => {
  const withHeader = (headers) => new Request('https://dash.example/api/cw/jobs', { method: 'POST', headers });
  assert.equal(checkMutationOrigin(withHeader({ 'X-CW-Request': '1' })), true);
  assert.equal(checkMutationOrigin(withHeader({})), false);
  assert.equal(
    checkMutationOrigin(withHeader({ 'X-CW-Request': '1', Origin: 'https://zly.example' })),
    false,
  );
  assert.equal(
    checkMutationOrigin(withHeader({ 'X-CW-Request': '1', Origin: 'https://dash.example' })),
    true,
  );
});

/* ---------- callback end-to-end na stubie D1 ---------- */

test('callback: bez podpisu 401', async () => {
  const request = new Request('https://dash.example/api/cw/callback', {
    method: 'POST',
    body: JSON.stringify({ job_id: 'job-abcdef12', run_id: '555' }),
  });
  const response = await routeContentWatcher(request, { CW_DB: fakeDb(), CW_CALLBACK_SECRET: SECRET }, { beforeAuth: true });
  assert.equal(response.status, 401);
});

test('callback: zużyty podpis odrzucony (replay)', async () => {
  const db = fakeDb({ 'INSERT OR IGNORE INTO callback_nonces': 0 });
  const request = await callbackRequest({ job_id: 'job-abcdef12', run_id: '555', status: 'running' });
  const response = await routeContentWatcher(request, { CW_DB: db, CW_CALLBACK_SECRET: SECRET }, { beforeAuth: true });
  assert.equal(response.status, 409);
  assert.match((await response.json()).error, /zużyty/);
});

test('callback: przebieg z innym run_id nie nadpisuje zadania', async () => {
  const db = fakeDb({ 'SELECT * FROM jobs WHERE id': runningJob });
  const request = await callbackRequest({ job_id: 'job-abcdef12', run_id: '999', status: 'done' });
  const response = await routeContentWatcher(request, { CW_DB: db, CW_CALLBACK_SECRET: SECRET }, { beforeAuth: true });
  assert.equal(response.status, 409);
});

test('callback: starsza próba tego samego przebiegu odrzucona', async () => {
  const db = fakeDb({ 'SELECT * FROM jobs WHERE id': { ...runningJob, run_attempt: 3 } });
  const request = await callbackRequest({ job_id: 'job-abcdef12', run_id: '555', run_attempt: 2, status: 'running' });
  const response = await routeContentWatcher(request, { CW_DB: db, CW_CALLBACK_SECRET: SECRET }, { beforeAuth: true });
  assert.equal(response.status, 409);
});

test('callback: zadanie w stanie końcowym nie wraca do biegu', async () => {
  const db = fakeDb({ 'SELECT * FROM jobs WHERE id': { ...runningJob, status: 'cancelled' } });
  const request = await callbackRequest({ job_id: 'job-abcdef12', run_id: '555', status: 'running' });
  const response = await routeContentWatcher(request, { CW_DB: db, CW_CALLBACK_SECRET: SECRET }, { beforeAuth: true });
  assert.equal(response.status, 409);
});

test('callback: poprawny zapisuje krok i sekcje', async () => {
  const db = fakeDb({ 'SELECT * FROM jobs WHERE id': runningJob });
  const request = await callbackRequest({
    job_id: 'job-abcdef12',
    run_id: '555',
    run_attempt: 1,
    status: 'running',
    step: { name: 'serp', status: 'done', cost: { serp_requests: 1 } },
    sections: [
      { slot: 3, text_before: 'stara treść', text_after: 'nowa treść', diff: [['equal', 0, 1]] },
      { slot: 99, text_after: 'poza zakresem slotów' },
    ],
  });
  const response = await routeContentWatcher(request, { CW_DB: db, CW_CALLBACK_SECRET: SECRET }, { beforeAuth: true });
  assert.equal(response.status, 200);
  const batch = db.calls.find((call) => call.op === 'batch');
  // jobs + job_steps + jedna sekcja (slot 99 odrzucony)
  assert.equal(batch.size, 3);
});

/* ---------- dispatch ---------- */

test('createJob: client_payload zawiera models, title i author', async (t) => {
  const db = fakeDb({
    'SELECT * FROM jobs WHERE id': { id: 'x', status: 'dispatching', improvements: '[]', cost: '{}' },
    'FROM job_steps': [],
    'FROM job_sections': [],
  });
  let payload = null;
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    payload = JSON.parse(init.body).client_payload;
    return new Response(null, { status: 204 });
  };
  t.after(() => { globalThis.fetch = realFetch; });

  const request = new Request('https://dash.example/api/cw/jobs', {
    method: 'POST',
    headers: { 'X-CW-Request': '1', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      domain: 'grupa-icea.pl', post_id: 5767, url: 'https://www.grupa-icea.pl/blog/a/',
      title: 'Tytuł', author: 'Mateusz Wiśniewski',
      improvements: ['gaps'],
      models: { research: 'perplexity/sonar-pro', writer: 'anthropic/claude-sonnet-5' },
    }),
  });
  const response = await routeContentWatcher(request, { CW_DB: db, GH_DISPATCH_TOKEN: 't', GH_REPO: 'a/b' });
  assert.equal(response.status, 201);
  assert.equal(payload.title, 'Tytuł');
  assert.equal(payload.author, 'Mateusz Wiśniewski');
  assert.deepEqual(payload.models, { research: 'perplexity/sonar-pro', writer: 'anthropic/claude-sonnet-5' });
});

/* ---------- routing ---------- */

test('routing: przed bramką hasła przechodzi wyłącznie callback', async () => {
  const env = { CW_DB: fakeDb(), CW_CALLBACK_SECRET: SECRET };
  const jobs = new Request('https://dash.example/api/cw/jobs');
  assert.equal(await routeContentWatcher(jobs, env, { beforeAuth: true }), null);
  const other = new Request('https://dash.example/widocznosc.ai/');
  assert.equal(await routeContentWatcher(other, env), null);
});

test('routing: brak bindingu D1 daje czytelny 503, nie wyjątek', async () => {
  const response = await routeContentWatcher(new Request('https://dash.example/api/cw/jobs'), {});
  assert.equal(response.status, 503);
});
