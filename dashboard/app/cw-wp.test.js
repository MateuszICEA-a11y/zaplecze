import { test } from 'node:test';
import assert from 'node:assert/strict';

import { acfFieldPayload, contentHash, handleWpApply, handleWpDraft, requestedAuthorId, scalarAcf, DRAFT_TITLE_PREFIX } from './cw-wp.js';

/* ---------- hash ---------- */

test('contentHash: zgodny z content_hash z collectora (fixture z Pythona)', async () => {
  // Wartości policzone sources.wordpress.content_hash – obie strony MUSZĄ
  // widzieć ten sam hash, inaczej guard wdrożenia zawsze krzyczy o konflikcie.
  assert.equal(await contentHash('<p>Ala ma&nbsp;kota &amp; psa.</p>'), '33d2c0831b6cf853');
  assert.equal(await contentHash('  ALA   ma kota – <b>i</b> psa? '), 'aee80e589bb04764');
  assert.equal(await contentHash(''), 'e3b0c44298fc1c14');
});

/* ---------- złożenie pól ---------- */

const section = (slot, extra = {}) => ({
  slot,
  title_field: `page_title_h2_${slot}`,
  text_field: `page_text_${slot}`,
  operation: 'update',
  title_before: `Stary ${slot}`,
  title_after: `Nowy ${slot}`,
  text_before: `<p>przed ${slot}</p>`,
  text_after: `<p>po ${slot}</p>`,
  text_hash_before: null,
  decision: null,
  ...extra,
});

test('acfFieldPayload: szkic bierze propozycje, odrzucone zostawia CMS-owi', () => {
  const { fields, slots, undecided } = acfFieldPayload({ expert: null }, [
    section(1, { decision: 'accepted' }),
    section(2, { decision: 'rejected' }),
    section(3),
  ]);
  assert.deepEqual(slots, [1, 3]);
  assert.equal(undecided, 1);
  assert.equal(fields.page_text_1, '<p>po 1</p>');
  assert.equal(fields.page_title_h2_3, 'Nowy 3');
  assert.equal(fields.page_text_2, undefined);
});

test('acfFieldPayload: wdrożenie pisze wyłącznie zatwierdzone sekcje', () => {
  const { fields, slots } = acfFieldPayload({ expert: null }, [
    section(1, { decision: 'accepted' }),
    section(3),
  ], { forApply: true });
  assert.deepEqual(slots, [1]);
  assert.equal(fields.page_text_3, undefined);
});

test('acfFieldPayload: cytat eksperta ląduje na końcu wskazanej sekcji', () => {
  const expert = JSON.stringify({ status: 'done', quote: 'Cytat.', expert: 'Jan Nowak', role: 'Head of SEO', slot: 1 });
  const { fields } = acfFieldPayload({ expert }, [section(1, { decision: 'accepted' })]);
  // Wygląd cytatu idzie w `style` – przechodzi przez sanityzację nietknięty.
  assert.match(fields.page_text_1, /<p>po 1<\/p>\n<blockquote class="expert" style="[^"]*background:#eef0ff/);
  assert.match(fields.page_text_1, /<p style="[^"]*">Cytat\.<\/p>/);
  assert.match(fields.page_text_1, /<span style="[^"]*">Jan Nowak<\/span> · Head of SEO, ICEA<\/footer>/);
  // Ekspert odrzucony albo w toku nie wchodzi do treści.
  const rejected = JSON.stringify({ status: 'rejected', quote: 'Cytat.', slot: 1 });
  assert.equal(acfFieldPayload({ expert: rejected }, [section(1, { decision: 'accepted' })]).fields.page_text_1, '<p>po 1</p>');
});

test('acfFieldPayload: sekcja z polem spoza wzorca ACF wypada w całości', () => {
  const { slots } = acfFieldPayload({ expert: null }, [
    section(1, { decision: 'accepted', text_field: 'page_text_1"; DROP TABLE' }),
  ]);
  assert.deepEqual(slots, []);
});

test('acfFieldPayload: treść przechodzi przez sanityzację (script znika)', () => {
  const { fields } = acfFieldPayload({ expert: null }, [
    section(1, { decision: 'accepted', text_after: '<p>ok</p><script>alert(1)</script>' }),
  ]);
  assert.equal(fields.page_text_1, '<p>ok</p>');
});

test('scalarAcf: obrazki i relacje (obiekty/tablice) nie wchodzą do kopii', () => {
  assert.deepEqual(
    scalarAcf({ page_text_1: 'tekst', hero_image: { id: 5 }, related: [1, 2], flaga: true, licznik: 3, pusty: null, 'zły klucz!': 'x' }),
    { page_text_1: 'tekst', flaga: true, licznik: 3, pusty: null },
  );
});

/* ---------- handlery na mockach ---------- */

/** Stub D1 jak w cw-api.test.js – reakcje dobierane po fragmencie SQL. */
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
      bind: (...values) => { args = values; return self; },
      first: async () => { calls.push({ sql, args }); return respond(sql, args) ?? null; },
      all: async () => { calls.push({ sql, args }); return { results: respond(sql, args) ?? [] }; },
      run: async () => { calls.push({ sql, args }); return { meta: { changes: respond(sql, args) ?? 1 } }; },
    };
    return self;
  };
  return { calls, prepare: statement, batch: async () => [] };
}

const JOB = {
  id: 'job-123456', domain: 'grupa-icea.pl', post_id: 41, post_type: 'posts',
  title: 'Testowy wpis', status: 'done', expert: null, wp_draft_id: null, applied_at: null,
};

const env = (db, extra = {}) => ({
  CW_DB: db,
  CW_DOMAINS: 'grupa-icea.pl=https://www.grupa-icea.pl',
  WP_APP_USER: 'redaktor',
  WP_APP_PASSWORD: 'sekret',
  ...extra,
});

const post = (path, { origin = 'https://dash.example' } = {}) =>
  new Request(`${origin}${path}`, { method: 'POST', headers: { 'X-CW-Request': '1' } });

/** Mock WP REST: rejestruje wywołania, odpowiada wg mapy metoda+ścieżka. */
function fakeWp(routes) {
  const calls = [];
  const impl = async (url, options = {}) => {
    const { pathname, search } = new URL(url);
    const method = options.method ?? 'GET';
    calls.push({ method, path: pathname + search, body: options.body ? JSON.parse(options.body) : null });
    for (const [needle, value] of Object.entries(routes)) {
      const [routeMethod, routePath] = needle.split(' ');
      if (routeMethod === method && pathname.startsWith(routePath)) {
        const data = typeof value === 'function' ? value(calls.at(-1)) : value;
        // Kształt {status: liczba, body} to odpowiedź HTTP; wszystko inne
        // (w tym wpis z polem `status: 'draft'`) jedzie jako body z 200.
        const isHttpShape = typeof data.status === 'number';
        return new Response(JSON.stringify(isHttpShape ? (data.body ?? {}) : data), { status: isHttpShape ? data.status : 200 });
      }
    }
    return new Response('{"code":"rest_no_route"}', { status: 404 });
  };
  return { calls, impl };
}

test('wp-draft: bez sekretów WP jest 503 z czytelnym komunikatem', async () => {
  const db = fakeDb({ 'FROM jobs': JOB });
  const response = await handleWpDraft(post('/api/cw/jobs/job-123456/wp-draft'), env(db, { WP_APP_PASSWORD: '' }), 'job-123456');
  assert.equal(response.status, 503);
});

test('wp-draft: zadanie przed „done" nie zapisuje niczego', async () => {
  const db = fakeDb({ 'FROM jobs': { ...JOB, status: 'running' } });
  const response = await handleWpDraft(post('/api/cw/jobs/job-123456/wp-draft'), env(db), 'job-123456');
  assert.equal(response.status, 409);
});

test('wp-draft: tworzy szkic z kopią skalarnych ACF i zapisuje ID w bazie', async () => {
  const db = fakeDb({
    'FROM jobs': JOB,
    'FROM job_sections': [section(1, { decision: 'accepted' })],
  });
  const wp = fakeWp({
    'GET /wp-json/wp/v2/posts/41/': { id: 41, title: { raw: 'Oryginał' }, content: { raw: '<p>lead</p>' }, acf: { page_text_1: 'stare', hero: { id: 9 } } },
    'POST /wp-json/wp/v2/posts/': { id: 777, status: 'draft' },
  });
  const response = await handleWpDraft(post('/api/cw/jobs/job-123456/wp-draft'), env(db), 'job-123456', { fetchImpl: wp.impl });
  const data = await response.json();
  assert.equal(response.status, 200);
  assert.equal(data.draft_id, 777);
  assert.equal(data.preview_url, 'https://www.grupa-icea.pl/?p=777&preview=true');

  const create = wp.calls.find((call) => call.method === 'POST');
  assert.equal(create.body.status, 'draft');
  assert.equal(create.body.title, `${DRAFT_TITLE_PREFIX}Oryginał`);
  assert.equal(create.body.acf.page_text_1, '<p>po 1</p>');
  assert.equal(create.body.acf.hero, undefined); // obiekt nie wraca bezstratnie
  assert.ok(db.calls.some((call) => call.sql.includes('wp_draft_id') && call.args[0] === 777));
});

test('wp-draft: istniejący szkic jest aktualizowany, skasowany ręcznie – zakładany od nowa', async () => {
  const db = fakeDb({
    'FROM jobs': { ...JOB, wp_draft_id: 500 },
    'FROM job_sections': [section(1, { decision: 'accepted' })],
  });
  const wp = fakeWp({
    'GET /wp-json/wp/v2/posts/41/': { id: 41, title: { raw: 'Oryginał' }, content: { raw: '' }, acf: {} },
    'POST /wp-json/wp/v2/posts/500/': { status: 404, body: { code: 'rest_post_invalid_id' } },
    'POST /wp-json/wp/v2/posts/': { id: 501 },
  });
  const response = await handleWpDraft(post('/api/cw/jobs/job-123456/wp-draft'), env(db), 'job-123456', { fetchImpl: wp.impl });
  assert.equal((await response.json()).draft_id, 501);
  assert.deepEqual(wp.calls.filter((call) => call.method === 'POST').map((call) => call.path.split('?')[0]),
    ['/wp-json/wp/v2/posts/500/', '/wp-json/wp/v2/posts/']);
});

test('wp-apply: niezdecydowane sekcje blokują wdrożenie (bez wyjątku dla force)', async () => {
  const db = fakeDb({
    'FROM jobs': JOB,
    'FROM job_sections': [section(1, { decision: 'accepted' }), section(2)],
  });
  const response = await handleWpApply(post('/api/cw/jobs/job-123456/wp-apply?force=1'), env(db), 'job-123456');
  const data = await response.json();
  assert.equal(response.status, 409);
  assert.equal(data.code, 'undecided');
});

test('wp-apply: rozjazd hasha z CMS-em daje 409, force wdraża mimo to', async () => {
  const rows = [section(1, { decision: 'accepted', text_hash_before: 'deadbeefdeadbeef' })];
  const wpRoutes = {
    'GET /wp-json/wp/v2/posts/41/': { id: 41, acf: { page_text_1: '<p>ktoś to zmienił</p>' } },
    'POST /wp-json/wp/v2/posts/41/': { id: 41 },
  };
  const blockedWp = fakeWp(wpRoutes);
  const blocked = await handleWpApply(
    post('/api/cw/jobs/job-123456/wp-apply'),
    env(fakeDb({ 'FROM jobs': JOB, 'FROM job_sections': rows })), 'job-123456', { fetchImpl: blockedWp.impl });
  assert.equal(blocked.status, 409);
  assert.equal((await blocked.json()).code, 'content_changed');
  assert.equal(blockedWp.calls.filter((call) => call.method === 'POST').length, 0);

  const forcedWp = fakeWp(wpRoutes);
  const forced = await handleWpApply(
    post('/api/cw/jobs/job-123456/wp-apply?force=1'),
    env(fakeDb({ 'FROM jobs': JOB, 'FROM job_sections': rows })), 'job-123456', { fetchImpl: forcedWp.impl });
  assert.equal(forced.status, 200);
});

test('wp-apply: sukces pisze tylko ACF, kasuje szkic i stempluje applied_at', async () => {
  const text = '<p>przed 1</p>';
  const rows = [section(1, { decision: 'accepted', text_hash_before: await contentHash(text) })];
  const db = fakeDb({ 'FROM jobs': { ...JOB, wp_draft_id: 777 }, 'FROM job_sections': rows });
  const wp = fakeWp({
    'GET /wp-json/wp/v2/posts/41/': { id: 41, acf: { page_text_1: text } },
    'POST /wp-json/wp/v2/posts/41/': { id: 41 },
    'DELETE /wp-json/wp/v2/posts/777/': { deleted: true },
  });
  const response = await handleWpApply(post('/api/cw/jobs/job-123456/wp-apply'), env(db), 'job-123456', { fetchImpl: wp.impl });
  const data = await response.json();
  assert.equal(response.status, 200);
  assert.equal(data.draft_deleted, true);

  const update = wp.calls.find((call) => call.method === 'POST');
  assert.deepEqual(Object.keys(update.body), ['acf']); // bez title/status – oryginał zostaje opublikowany
  const removal = wp.calls.find((call) => call.method === 'DELETE');
  assert.match(removal.path, /777\/\?force=true/);
  assert.ok(db.calls.some((call) => call.sql.includes('applied_at')));
});

test('wp-apply: ponowne wdrożenie wymaga force', async () => {
  const db = fakeDb({ 'FROM jobs': { ...JOB, applied_at: '2026-08-01T10:00:00Z' } });
  const response = await handleWpApply(post('/api/cw/jobs/job-123456/wp-apply'), env(db), 'job-123456');
  assert.equal(response.status, 409);
  assert.equal((await response.json()).code, 'already_applied');
});

test('requestedAuthorId: liczba całkowita > 0 z body, inaczej null', async () => {
  const withBody = (body) => new Request('https://dash.example/x', { method: 'POST', body, headers: { 'Content-Type': 'application/json' } });
  assert.equal(await requestedAuthorId(withBody(JSON.stringify({ author_id: 7 }))), 7);
  assert.equal(await requestedAuthorId(withBody(JSON.stringify({ author_id: '7' }))), null);
  assert.equal(await requestedAuthorId(withBody(JSON.stringify({ author_id: 0 }))), null);
  assert.equal(await requestedAuthorId(withBody(JSON.stringify({}))), null);
  assert.equal(await requestedAuthorId(post('/api/cw/jobs/job-123456/wp-draft')), null);
});
