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
  fetchPostContent,
  sanitizeSectionHtml,
  DEFAULT_MODELS,
  SIGNATURE_WINDOW_S,
} from './cw-api.js';
import { buildExpertPrompt, expertBlockquote } from './cw-expert.js';

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
  assert.deepEqual(result.job.improvements, ['gaps', 'sources', 'internal_links']);
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

/* ---------- proxy treści wpisu ---------- */

const CONTENT_ENV = { CW_DOMAINS: 'grupa-icea.pl=https://www.grupa-icea.pl' };

test('content: domena spoza CW_DOMAINS daje 404', async () => {
  const response = await fetchPostContent(null, CONTENT_ENV, 'zla-domena.pl', 'posts', 1, async () => {
    throw new Error('nie powinno dojść do fetchu');
  });
  assert.equal(response.status, 404);
});

test('content: mapowanie ACF na sekcje i wolne sloty', async () => {
  const acf = {
    page_title_h2_1: 'Czym jest błąd 403',
    page_text_1: '<p>Serwer odmawia dostępu.</p>',
    page_title_h2_3: '',
    page_text_3: '<p>Sekcja bez nagłówka.</p>',
  };
  const wpBody = JSON.stringify({ id: 5767, link: 'https://www.grupa-icea.pl/blog/a/', title: { rendered: 'Błąd 403' }, acf });
  let requested = '';
  const response = await fetchPostContent(null, CONTENT_ENV, 'grupa-icea.pl', 'posts', 5767, async (url) => {
    requested = url;
    return new Response(wpBody, { status: 200 });
  });
  assert.equal(response.status, 200);
  assert.match(requested, /^https:\/\/www\.grupa-icea\.pl\/wp-json\/wp\/v2\/posts\/5767\/\?acf_format=standard/);
  const data = await response.json();
  assert.equal(data.title, 'Błąd 403');
  assert.equal(data.sections.length, 2);
  assert.deepEqual(data.sections.map((section) => section.slot), [1, 3]);
  assert.equal(data.sections[0].text_field, 'page_text_1');
  // Slot 2 wolny, 1 i 3 zajęte.
  assert.equal(data.free_slots.includes(2), true);
  assert.equal(data.free_slots.includes(1), false);
});

test('content: wstęp z pola content i pełna treść wpisu bez sekcji ACF', async () => {
  const withLead = JSON.stringify({
    id: 1, link: 'https://www.grupa-icea.pl/blog/a/', title: { rendered: 'Zlecę pozycjonowanie' },
    content: { rendered: '<p>Dobra pozycja jest dziś warunkiem koniecznym.</p>' },
    acf: { page_title_h2_1: 'Czym zajmuje się agencja?', page_text_1: '<p>Audyt SEO.</p>' },
  });
  let requested = '';
  const lead = await fetchPostContent(null, CONTENT_ENV, 'grupa-icea.pl', 'posts', 1, async (url) => {
    requested = url;
    return new Response(withLead, { status: 200 });
  });
  const data = await lead.json();
  // Bez `content` w _fields WordPress nie odda wstępu sprzed pierwszego H2.
  assert.match(requested, /_fields=id,link,title,content,acf/);
  assert.equal(data.lead, '<p>Dobra pozycja jest dziś warunkiem koniecznym.</p>');
  assert.equal(data.sections.length, 1);
  assert.equal(data.no_section, '');

  // Wpis bez sekcji ACF – treść siedzi w page_content_no_section.
  const single = await fetchPostContent(null, CONTENT_ENV, 'grupa-icea.pl', 'posts', 2, async () =>
    new Response(JSON.stringify({
      id: 2, content: { rendered: '<p>Wstęp.</p>' },
      acf: { page_content_no_section: '<p>Całość wpisu.</p>' },
    }), { status: 200 }));
  const singleData = await single.json();
  assert.equal(singleData.sections.length, 0);
  assert.equal(singleData.no_section, '<p>Całość wpisu.</p>');
});

test('content: błąd WP i za duża odpowiedź dają 502, 404 przechodzi', async () => {
  const err = await fetchPostContent(null, CONTENT_ENV, 'grupa-icea.pl', 'posts', 1,
    async () => new Response('awaria', { status: 500 }));
  assert.equal(err.status, 502);

  const missing = await fetchPostContent(null, CONTENT_ENV, 'grupa-icea.pl', 'posts', 1,
    async () => new Response('brak', { status: 404 }));
  assert.equal(missing.status, 404);

  const huge = await fetchPostContent(null, CONTENT_ENV, 'grupa-icea.pl', 'posts', 1,
    async () => new Response(`{"acf":{"page_text_1":"${'x'.repeat(2 * 1024 * 1024 + 10)}"}}`, { status: 200 }));
  assert.equal(huge.status, 502);
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

test('createJob: force=1 omija cooldown, bez force wpis jest blokowany', async (t) => {
  const jobBody = JSON.stringify({
    domain: 'grupa-icea.pl', post_id: 5767, url: 'https://www.grupa-icea.pl/blog/a/', title: 'Tytuł',
    improvements: ['gaps'], models: { research: 'perplexity/sonar-pro', writer: 'anthropic/claude-sonnet-5' },
  });
  // Stub udaje D1: INSERT przechodzi tylko wtedy, gdy okno cooldownu (12. bind)
  // nie obejmuje wcześniejszego przebiegu – tu udajemy przebieg sprzed doby.
  const previousRun = new Date(Date.now() - 86_400_000).toISOString();
  const reactions = {
    'INSERT INTO jobs': (args) => (args[11] <= previousRun ? 0 : 1),
    'SELECT id, status, created_at FROM jobs': (args) =>
      (args[2] <= previousRun ? { id: 'job-old', status: 'done', created_at: previousRun } : null),
    'SELECT * FROM jobs WHERE id': { id: 'x', status: 'dispatching', improvements: '[]', cost: '{}' },
    'FROM job_steps': [],
    'FROM job_sections': [],
    'SELECT COUNT(*) AS n': { n: 0 },
  };
  const realFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(null, { status: 204 });
  t.after(() => { globalThis.fetch = realFetch; });

  const call = (url) => routeContentWatcher(
    new Request(url, {
      method: 'POST',
      headers: { 'X-CW-Request': '1', 'Content-Type': 'application/json' },
      body: jobBody,
    }),
    { CW_DB: fakeDb(reactions), GH_DISPATCH_TOKEN: 't', GH_REPO: 'a/b' },
  );

  const blocked = await call('https://dash.example/api/cw/jobs');
  assert.equal(blocked.status, 409);
  assert.equal((await blocked.json()).code, 'cooldown');

  const forced = await call('https://dash.example/api/cw/jobs?force=1');
  assert.equal(forced.status, 201);
});

/* ---------- edycja sekcji ---------- */

test('sanitizeSectionHtml: zdejmuje skrypty, atrybuty i tagi spoza whitelisty', () => {
  const dirty = '<p onclick="x()">Tekst</p><script>alert(1)</script>'
    + '<a href="https://x.pl/a" onmouseover="y()">link</a>'
    + '<a href="javascript:alert(1)">zły</a>'
    + '<div><em>kursywa</em></div>'
    + '<blockquote class="expert fancy"><p>Q</p></blockquote>';
  const clean = sanitizeSectionHtml(dirty);
  assert.equal(clean.includes('script'), false);
  assert.equal(clean.includes('onclick'), false);
  assert.match(clean, /<a href="https:\/\/x\.pl\/a" target="_blank" rel="noopener nofollow">link<\/a>/);
  assert.match(clean, /<a>zły<\/a>/);
  assert.match(clean, /<em>kursywa<\/em>/);
  assert.equal(clean.includes('<div'), false);
  assert.match(clean, /<blockquote class="expert">/);
});

test('sections PATCH: text_after sanityzowany serwerowo, limit rozmiaru', async () => {
  const writes = [];
  const db = fakeDb({
    'SET text_after = ?, edited = 1': (args) => { writes.push(args[0]); return 1; },
  });
  const patch = (body) => new Request('https://dash.example/api/cw/jobs/job-abcdef12/sections/3', {
    method: 'PATCH',
    headers: { 'X-CW-Request': '1', 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const ok = await routeContentWatcher(patch({ text_after: '<p>Poprawka</p><script>x</script>' }), { CW_DB: db });
  assert.equal(ok.status, 200);
  assert.equal(writes[0], '<p>Poprawka</p>');

  const huge = await routeContentWatcher(patch({ text_after: 'x'.repeat(64 * 1024 + 1) }), { CW_DB: db });
  assert.equal(huge.status, 413);

  const empty = await routeContentWatcher(patch({}), { CW_DB: db });
  assert.equal(empty.status, 400);
});

test('sections PATCH: decyzja trójstanowa trzyma accepted w parze', async () => {
  const writes = [];
  const db = fakeDb({
    'SET decision = ?, accepted = ?': (args) => { writes.push(args); return 1; },
  });
  const patch = (body) => new Request('https://dash.example/api/cw/jobs/job-abcdef12/sections/3', {
    method: 'PATCH',
    headers: { 'X-CW-Request': '1', 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const accepted = await routeContentWatcher(patch({ decision: 'accepted' }), { CW_DB: db });
  assert.equal(accepted.status, 200);
  assert.equal(writes[0][0], 'accepted');
  assert.equal(writes[0][1], 1);

  // Odrzucenie i cofnięcie decyzji zdejmują flagę wdrożeniową.
  await routeContentWatcher(patch({ decision: 'rejected' }), { CW_DB: db });
  assert.equal(writes[1][0], 'rejected');
  assert.equal(writes[1][1], 0);
  await routeContentWatcher(patch({ decision: null }), { CW_DB: db });
  assert.equal(writes[2][0], null);

  // Stare wywołanie z samym `accepted` nadal działa.
  await routeContentWatcher(patch({ accepted: true }), { CW_DB: db });
  assert.equal(writes[3][0], 'accepted');

  const bad = await routeContentWatcher(patch({ decision: 'moze-pozniej' }), { CW_DB: db });
  assert.equal(bad.status, 400);
});

/* ---------- porada eksperta ---------- */

const expertRequest = (method = 'POST', body = undefined) =>
  new Request('https://dash.example/api/cw/jobs/job-abcdef12/expert', {
    method,
    headers: { 'X-CW-Request': '1', 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });

const doneJob = {
  id: 'job-abcdef12', status: 'done', title: 'Błąd 403', author: 'ICEA',
  models: '{"research":"perplexity/sonar-pro","writer":"anthropic/claude-sonnet-5"}', expert: null,
};

test('expert: wymaga zadania w stanie done', async () => {
  const db = fakeDb({ 'SELECT * FROM jobs WHERE id': { ...doneJob, status: 'running' } });
  const response = await routeContentWatcher(expertRequest(), { CW_DB: db });
  assert.equal(response.status, 409);
});

test('expert: równoległe generowanie odrzucone (guard w D1)', async () => {
  const db = fakeDb({
    'SELECT * FROM jobs WHERE id': doneJob,
    "json_extract(expert, '$.status') != 'running'": 0, // warunkowy UPDATE nie przeszedł
  });
  const response = await routeContentWatcher(expertRequest(), { CW_DB: db });
  assert.equal(response.status, 409);
  assert.match((await response.json()).error, /generowany/);
});

test('expert: wynik zapisany do jobs.expert z modelem i kosztem', async (t) => {
  const updates = [];
  const db = fakeDb({
    'SELECT * FROM jobs WHERE id': doneJob,
    'FROM job_sections': [{ slot: 2, title_after: 'Jak naprawić', text_after: '<p>Sprawdź uprawnienia.</p>' }],
    'UPDATE jobs SET expert = ?': (args) => { updates.push(args[0]); return 1; },
  });
  const realFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    model: 'anthropic/claude-sonnet-5',
    usage: { prompt_tokens: 900, completion_tokens: 120 },
    choices: [{ message: { content: '{"slot":2,"expert":"Karolina Goćkowska","role":"specjalistka SEO","quote":"W praktyce…","placement":"po sekcji 2"}' } }],
  }), { status: 200 });
  t.after(() => { globalThis.fetch = realFetch; });

  const response = await routeContentWatcher(expertRequest(), { CW_DB: db, OPENROUTER_API_KEY: 'k' });
  assert.equal(response.status, 200);
  const { expert } = await response.json();
  assert.equal(expert.status, 'done');
  assert.equal(expert.expert, 'Karolina Goćkowska');
  assert.equal(expert.slot, 2);
  assert.equal(expert.cost.tokens_out, 120);
  const saved = JSON.parse(updates.at(-1));
  assert.equal(saved.status, 'done');
});

test('expert: brak klucza OpenRoutera daje czytelny błąd, stan failed', async () => {
  const updates = [];
  const db = fakeDb({
    'SELECT * FROM jobs WHERE id': doneJob,
    'FROM job_sections': [{ slot: 1, text_after: '<p>Treść.</p>' }],
    'UPDATE jobs SET expert = ?': (args) => { updates.push(args[0]); return 1; },
  });
  const response = await routeContentWatcher(expertRequest(), { CW_DB: db });
  assert.equal(response.status, 502);
  assert.match((await response.json()).error, /OPENROUTER_API_KEY/);
  assert.equal(JSON.parse(updates.at(-1)).status, 'failed');
});

test('expert: PATCH {rejected:true} odrzuca gotowy cytat', async () => {
  const db = fakeDb({ "json_set(expert, '$.status', 'rejected')": 1 });
  const response = await routeContentWatcher(expertRequest('PATCH', { rejected: true }), { CW_DB: db });
  assert.equal(response.status, 200);

  const missing = await routeContentWatcher(
    expertRequest('PATCH', { rejected: true }),
    { CW_DB: fakeDb({ "json_set(expert, '$.status', 'rejected')": 0 }) },
  );
  assert.equal(missing.status, 404);
});

test('expert: prompt wyklucza autora, blockquote w formacie pipeline', () => {
  const prompt = buildExpertPrompt({ title: 'T', content: 'treść', author: 'Mateusz Wiśniewski' });
  assert.match(prompt, /nie wolno/);
  assert.doesNotMatch(prompt.split('Wybierz inną osobę')[1], /Mateusz Wiśniewski/);
  assert.equal(
    expertBlockquote({ quote: 'Q', expert: 'E', role: 'R' }),
    '<blockquote class="expert"><p>Q</p><footer>E, R</footer></blockquote>',
  );
});

/* ---------- routing ---------- */

test('routing: przed bramką hasła przechodzi wyłącznie callback', async () => {
  const env = { CW_DB: fakeDb(), CW_CALLBACK_SECRET: SECRET };
  const jobs = new Request('https://dash.example/api/cw/jobs');
  assert.equal(await routeContentWatcher(jobs, env, { beforeAuth: true }), null);
  const other = new Request('https://dash.example/widocznosc.ai/');
  assert.equal(await routeContentWatcher(other, env), null);
});

test('routing: trasa SERP sprawdza domenę na mapie CW_DOMAINS, nie na liście', async () => {
  const env = { CW_DB: fakeDb(), CW_DOMAINS: 'grupa-icea.pl=https://www.grupa-icea.pl' };
  const obca = await routeContentWatcher(
    new Request('https://dash.example/api/cw/serp/obca.pl/1', { headers: { 'X-CW-Request': '1' } }),
    env,
  );
  assert.equal(obca.status, 400);
  // Znana domena musi przejść dalej – wcześniej `contentDomains(...).includes`
  // wywalało Workera wyjątkiem, zanim ktokolwiek zobaczył odpowiedź.
  const znana = await routeContentWatcher(
    new Request('https://dash.example/api/cw/serp/grupa-icea.pl/1', { headers: { 'X-CW-Request': '1' } }),
    env,
  );
  assert.equal(znana.status, 200);
  assert.equal((await znana.json()).status, 'idle');
});

test('routing: POST na SERP bez nagłówka dashboardu to 403, nie wyjątek', async () => {
  const env = { CW_DB: fakeDb(), CW_DOMAINS: 'grupa-icea.pl=https://www.grupa-icea.pl' };
  const request = (headers) =>
    new Request('https://dash.example/api/cw/serp/grupa-icea.pl/1', {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify({ title: 'x', url: 'https://www.grupa-icea.pl/x/' }),
    });
  const odrzucone = await routeContentWatcher(request({}), env);
  assert.equal(odrzucone.status, 403);
  // Z nagłówkiem musi wrócić Response, a nie `true` z checkMutationOrigin –
  // to była przyczyna 1101 „Promise did not resolve to Response".
  const przyjete = await routeContentWatcher(request({ 'X-CW-Request': '1' }), { ...env, SERPDATA_API_KEY: '' });
  assert.ok(przyjete instanceof Response);
  assert.equal(przyjete.status, 503);
});

test('routing: brak bindingu D1 daje czytelny 503, nie wyjątek', async () => {
  const response = await routeContentWatcher(new Request('https://dash.example/api/cw/jobs'), {});
  assert.equal(response.status, 503);
});
