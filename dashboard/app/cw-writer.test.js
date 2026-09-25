import { afterEach, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';

import { MAX_ACTIVE_PER_DOMAIN, routeContentWatcher } from './cw-api.js';
import { buildFactsPrompt } from './cw-rivals.js';
import { styleDocument } from './cw-style.js';
import { handleWpDraft } from './cw-wp.js';
import {
  dispatchPayload,
  MAX_FAQ,
  MAX_OUTLINE,
  MAX_PAYLOAD_FIELDS,
  normalizeBrief,
  parseProjectRequest,
  projectPostId,
  routeWriter,
  WRITER_KINDS,
} from './cw-writer.js';
import { sqliteD1 } from './test-d1.js';

const BASE = 'https://www.grupa-icea.pl';
const ORIGIN = 'https://dash.example';

const envFor = (db, extra = {}) => ({
  CW_DB: db,
  CW_DOMAINS: `grupa-icea.pl=${BASE}`,
  GH_DISPATCH_TOKEN: 't',
  GH_REPO: 'a/b',
  WP_APP_USER: 'u',
  WP_APP_PASSWORD: 'p',
  ...extra,
});

const call = (env, path, { method = 'GET', body, fetchImpl } = {}) =>
  routeWriter(
    new Request(`${ORIGIN}${path}`, {
      method,
      headers: { 'X-CW-Request': '1', Origin: ORIGIN, 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
    env,
    fetchImpl ? { fetchImpl } : {},
  );

const BRIEF = {
  main_keyword: 'audyt seo',
  title: 'Audyt SEO – jak go przeprowadzić',
  outline: [
    { heading: 'Czym jest audyt SEO', points: ['definicja'], keywords: ['audyt seo'], words: 250, basis: 'PAA' },
    { heading: 'Etapy audytu', points: ['crawl', 'indeksacja'], words: 400, basis: 'konkurent 1' },
  ],
  faq: [{ question: 'Ile trwa audyt SEO?', basis: 'PAA' }],
  keywords_to_cover: [{ keyword: 'audyt strony', volume: 320, where: 'Etapy audytu' }],
};

let dispatched;
let realFetch;
beforeEach(() => {
  dispatched = [];
  realFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    if (String(url).includes('/dispatches')) {
      dispatched.push(JSON.parse(init.body));
      return new Response(null, { status: 204 });
    }
    throw new Error(`nieoczekiwane żądanie: ${url}`);
  };
});
afterEach(() => {
  globalThis.fetch = realFetch;
});

async function createProject(env, keyword = 'Audyt SEO') {
  const response = await call(env, '/api/cw/writer/projects', { method: 'POST', body: { domain: 'grupa-icea.pl', keyword } });
  assert.equal(response.status, 201);
  return (await response.json()).project;
}

/** Callback z pipeline'u w skrócie: kończymy przebieg i zapisujemy krok. */
function finishJob(db, jobId, step, payload, sections = []) {
  db.sqlite.prepare("UPDATE jobs SET status = 'done' WHERE id = ?").run(jobId);
  db.sqlite.prepare("INSERT INTO job_steps (job_id, step, status, payload) VALUES (?, ?, 'done', ?)")
    .run(jobId, step, JSON.stringify(payload));
  for (const row of sections) {
    db.sqlite.prepare(
      `INSERT INTO job_sections (job_id, slot, title_field, text_field, operation, title_after, text_after)
       VALUES (?, ?, ?, ?, 'insert', ?, ?)`,
    ).run(jobId, row.slot, row.title_field, row.text_field, row.title, row.text);
  }
}

/* ---------- walidacja ---------- */

test('parseProjectRequest: fraza i domena z CW_DOMAINS', () => {
  const env = envFor(null);
  const ok = parseProjectRequest({ domain: 'grupa-icea.pl', keyword: '  Audyt   SEO ' }, env);
  assert.deepEqual(ok, { ok: true, project: { domain: 'grupa-icea.pl', keyword: 'Audyt SEO', keyword_norm: 'audyt seo' } });
  assert.deepEqual(parseProjectRequest({ domain: 'obca.pl', keyword: 'audyt' }, env).errors, ['domain']);
  assert.deepEqual(parseProjectRequest({ domain: 'grupa-icea.pl', keyword: '?!' }, env).errors, ['keyword']);
  assert.deepEqual(parseProjectRequest({ domain: 'grupa-icea.pl', keyword: 'a'.repeat(121) }, env).errors, ['keyword']);
});

test('normalizeBrief: przycina listy do limitów, gubi nieznane pola, wymaga planu', () => {
  const outline = Array.from({ length: MAX_OUTLINE + 5 }, (_, i) => ({ heading: `H2 ${i}`, words: 99999, extra: 'x' }));
  const faq = Array.from({ length: MAX_FAQ + 3 }, (_, i) => ({ question: `Pytanie ${i}?` }));
  const { ok, brief } = normalizeBrief({ outline, faq, hack: '<script>' });
  assert.equal(ok, true);
  assert.equal(brief.outline.length, MAX_OUTLINE);
  assert.equal(brief.faq.length, MAX_FAQ);
  assert.equal(brief.outline[0].words, 1500);
  assert.equal(brief.outline[0].extra, undefined);
  assert.equal(brief.hack, undefined);
  assert.deepEqual(normalizeBrief({ outline: [] }).errors, ['outline']);
  // Brief „za mało materiału" jest poprawny bez planu – to jawna odmowa modelu.
  assert.equal(normalizeBrief({ skip: true, reason: 'brak konkurencji' }).ok, true);
  assert.deepEqual(normalizeBrief({ outline, angle: 'x'.repeat(30_000) }).errors, ['brief_size']);
});

test('dispatchPayload: mieści się w limicie 10 pól client_payload', () => {
  const payload = dispatchPayload(
    { id: 'j', domain: 'd', kind: WRITER_KINDS.text, models: null },
    { id: 1, keyword: 'k', title: 't', author_name: 'a' },
    { rivals: null, gap: null },
    BRIEF,
  );
  assert.ok(Object.keys(payload).length <= MAX_PAYLOAD_FIELDS);
  assert.equal(payload.stage, 'write');
});

/* ---------- przepływ projektu ---------- */

test('projekt: jedna fraza = jeden projekt (odmiana wielkości liter i znaków też)', async () => {
  const env = envFor(sqliteD1());
  const project = await createProject(env);
  assert.equal(project.status, 'research');
  const duplicate = await call(env, '/api/cw/writer/projects', { method: 'POST', body: { domain: 'grupa-icea.pl', keyword: 'audyt  seo!' } });
  assert.equal(duplicate.status, 409);
  assert.equal((await duplicate.json()).project_id, project.id);
});

test('brief: przebieg to wiersz jobs z ujemnym post_id i kind writer_brief', async () => {
  const db = sqliteD1();
  const env = envFor(db);
  const project = await createProject(env);
  const response = await call(env, `/api/cw/writer/projects/${project.id}/brief`, { method: 'POST', body: {} });
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.project.status, 'brief_running');
  assert.equal(data.brief_job.kind, WRITER_KINDS.brief);
  assert.equal(data.brief_job.post_id, projectPostId(project.id));
  assert.equal(data.brief_job.status, 'dispatching');
  assert.equal(dispatched.length, 1);
  assert.equal(dispatched[0].event_type, 'content-write');
  assert.equal(dispatched[0].client_payload.stage, 'brief');
  assert.equal(dispatched[0].client_payload.keyword, 'Audyt SEO');
  assert.ok(Object.keys(dispatched[0].client_payload).length <= MAX_PAYLOAD_FIELDS);

  // Drugi start w trakcie przebiegu – odmowa ze stanu projektu.
  const again = await call(env, `/api/cw/writer/projects/${project.id}/brief`, { method: 'POST', body: {} });
  assert.equal(again.status, 409);

  // Lista Content Watchera nie widzi przebiegów Content Writera.
  const list = await routeContentWatcher(new Request(`${ORIGIN}/api/cw/jobs?domain=grupa-icea.pl`), env);
  assert.deepEqual((await list.json()).jobs, []);
});

test('brief: limit równoległych zadań domeny jest wspólny z Content Watcherem', async () => {
  const db = sqliteD1();
  const env = envFor(db);
  for (let i = 0; i < MAX_ACTIVE_PER_DOMAIN; i++) {
    db.sqlite.prepare(
      `INSERT INTO jobs (id, domain, post_id, url, title, status, created_at, updated_at)
       VALUES (?, 'grupa-icea.pl', ?, 'https://x', 't', 'running', ?, ?)`,
    ).run(`cw-${i}`, 100 + i, new Date().toISOString(), new Date().toISOString());
  }
  const project = await createProject(env);
  const response = await call(env, `/api/cw/writer/projects/${project.id}/brief`, { method: 'POST', body: {} });
  assert.equal(response.status, 409);
  assert.equal((await response.json()).code, 'too_many_active');
  assert.equal(dispatched.length, 0);
});

test('brief → tekst: projekt dogania stan przebiegów i kopiuje brief oraz wstęp', async () => {
  const db = sqliteD1();
  const env = envFor(db);
  const project = await createProject(env);
  const started = await (await call(env, `/api/cw/writer/projects/${project.id}/brief`, { method: 'POST', body: {} })).json();
  finishJob(db, started.brief_job.id, 'brief', BRIEF);

  const ready = await (await call(env, `/api/cw/writer/projects/${project.id}`)).json();
  assert.equal(ready.project.status, 'brief_ready');
  assert.equal(ready.project.title, BRIEF.title);
  assert.equal(ready.project.brief.outline.length, 2);

  // Redaktor skreśla punkt planu – do pisania idzie jego wersja.
  const edited = { ...ready.project.brief, outline: ready.project.brief.outline.slice(0, 1) };
  const patched = await call(env, `/api/cw/writer/projects/${project.id}`, { method: 'PATCH', body: { brief: edited } });
  assert.equal(patched.status, 200);

  const write = await (await call(env, `/api/cw/writer/projects/${project.id}/write`, { method: 'POST', body: {} })).json();
  assert.equal(write.project.status, 'writing');
  assert.equal(dispatched.at(-1).client_payload.stage, 'write');
  assert.equal(dispatched.at(-1).client_payload.brief.outline.length, 1);

  finishJob(db, write.write_job.id, 'write', { lead: '<p>Wstęp</p><script>x</script>', title: 'inny' }, [
    { slot: 1, title_field: 'page_title_h2_1', text_field: 'page_text_1', title: 'Czym jest audyt SEO', text: '<p>Treść</p>' },
  ]);
  const written = await (await call(env, `/api/cw/writer/projects/${project.id}`)).json();
  assert.equal(written.project.status, 'written');
  assert.equal(written.project.lead, '<p>Wstęp</p>');
  // Tytuł z briefu (i ewentualne poprawki redaktora) wygrywa z propozycją tekstu.
  assert.equal(written.project.title, BRIEF.title);
  assert.equal(written.write_job.sections.length, 1);
});

test('tekst: bez planu w briefie nie startuje', async () => {
  const db = sqliteD1();
  const env = envFor(db);
  const project = await createProject(env);
  const started = await (await call(env, `/api/cw/writer/projects/${project.id}/brief`, { method: 'POST', body: {} })).json();
  finishJob(db, started.brief_job.id, 'brief', { skip: true, reason: 'SERP bez treści poradnikowych' });
  const response = await call(env, `/api/cw/writer/projects/${project.id}/write`, { method: 'POST', body: {} });
  assert.equal(response.status, 409);
  assert.equal((await response.json()).code, 'no_brief');
});

/* ---------- szkic w WordPressie ---------- */

async function writtenProject(db, env) {
  const project = await createProject(env);
  const started = await (await call(env, `/api/cw/writer/projects/${project.id}/brief`, { method: 'POST', body: {} })).json();
  finishJob(db, started.brief_job.id, 'brief', BRIEF);
  await call(env, `/api/cw/writer/projects/${project.id}`);
  const write = await (await call(env, `/api/cw/writer/projects/${project.id}/write`, { method: 'POST', body: {} })).json();
  finishJob(db, write.write_job.id, 'write', { lead: '<p>Wstęp</p>' }, [
    { slot: 1, title_field: 'page_title_h2_1', text_field: 'page_text_1', title: 'Czym jest audyt', text: '<p>A</p>' },
    { slot: 101, title_field: 'page_faq_question_1', text_field: 'page_faq_answer_1', title: 'Ile trwa?', text: '<p>Tydzień.</p>' },
    { slot: 200, title_field: 'page_sources_title', text_field: 'page_sources_text', title: 'Źródła', text: '<ul><li>x</li></ul>' },
  ]);
  db.sqlite.prepare('UPDATE writer_projects SET author_id = 7, author_name = ?, category_id = 12 WHERE id = ?')
    .run('Jan Nowak', project.id);
  return { project, jobId: write.write_job.id };
}

test('szkic: nowy wpis draft z autorem, kategorią, wstępem i polami ACF (FAQ, Źródła)', async () => {
  const db = sqliteD1();
  const env = envFor(db);
  const { project } = await writtenProject(db, env);
  const requests = [];
  const fetchImpl = async (url, init) => {
    requests.push({ url: String(url), method: init?.method ?? 'GET', body: init?.body ? JSON.parse(init.body) : null });
    return new Response(JSON.stringify({ id: 555, modified: '2026-09-25T10:00:00' }), { status: 201 });
  };
  const response = await call(env, `/api/cw/writer/projects/${project.id}/wp-draft`, { method: 'POST', body: {}, fetchImpl });
  assert.equal(response.status, 200);
  assert.equal(requests.length, 1);
  const [saved] = requests;
  assert.equal(saved.method, 'POST');
  assert.equal(saved.url, `${BASE}/wp-json/wp/v2/posts/`);
  assert.equal(saved.body.status, 'draft');
  assert.equal(saved.body.title, BRIEF.title);
  assert.equal(saved.body.content, '<p>Wstęp</p>');
  assert.equal(saved.body.author, 7);
  assert.deepEqual(saved.body.categories, [12]);
  assert.equal(saved.body.acf.page_title_h2_1, 'Czym jest audyt');
  assert.equal(saved.body.acf.page_faq_question_1, 'Ile trwa?');
  assert.equal(saved.body.acf.page_sources_text, '<ul><li>x</li></ul>');
  const row = db.sqlite.prepare('SELECT wp_post_id, wp_modified FROM writer_projects WHERE id = ?').get(project.id);
  assert.equal(row.wp_post_id, 555);
  assert.equal(row.wp_modified, '2026-09-25T10:00:00');
});

test('szkic: edycja w WordPressie blokuje nadpisanie bez force, opublikowany wpis – zawsze', async () => {
  const db = sqliteD1();
  const env = envFor(db);
  const { project } = await writtenProject(db, env);
  db.sqlite.prepare("UPDATE writer_projects SET wp_post_id = 555, wp_modified = '2026-09-25T10:00:00' WHERE id = ?").run(project.id);

  let current = { id: 555, status: 'draft', modified: '2026-09-25T11:30:00' };
  const methods = [];
  const fetchImpl = async (url, init) => {
    methods.push(init?.method ?? 'GET');
    if ((init?.method ?? 'GET') === 'GET') return new Response(JSON.stringify(current), { status: 200 });
    if (init.method === 'DELETE') return new Response('{}', { status: 200 });
    return new Response(JSON.stringify({ id: 556, modified: '2026-09-25T12:00:00' }), { status: 201 });
  };
  const path = `/api/cw/writer/projects/${project.id}/wp-draft`;
  const blocked = await call(env, path, { method: 'POST', body: {}, fetchImpl });
  assert.equal(blocked.status, 409);
  assert.equal((await blocked.json()).code, 'edited_in_wp');
  assert.deepEqual(methods, ['GET']);

  const forced = await call(env, path, { method: 'POST', body: { force: true }, fetchImpl });
  assert.equal(forced.status, 200);
  assert.deepEqual(methods, ['GET', 'GET', 'DELETE', 'POST']);
  assert.equal((await forced.json()).replaced, 555);

  current = { id: 556, status: 'publish', modified: '2026-09-25T12:00:00' };
  const published = await call(env, path, { method: 'POST', body: { force: true }, fetchImpl });
  assert.equal(published.status, 409);
  assert.equal((await published.json()).code, 'not_draft');
});

test('szkic: bez autora albo kategorii nie wychodzi do WordPressa', async () => {
  const db = sqliteD1();
  const env = envFor(db);
  const { project } = await writtenProject(db, env);
  db.sqlite.prepare('UPDATE writer_projects SET category_id = NULL WHERE id = ?').run(project.id);
  const fetchImpl = async () => {
    throw new Error('nie powinno pójść do WP');
  };
  const response = await call(env, `/api/cw/writer/projects/${project.id}/wp-draft`, { method: 'POST', body: {}, fetchImpl });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).code, 'no_category');
});

/* ---------- narzędzia edytora na nowym artykule ---------- */

test('styleDocument: nowy artykuł nie sięga do WordPressa po oryginał', async () => {
  const env = envFor(null);
  const fetchImpl = async () => {
    throw new Error('nowy artykuł nie ma wersji w CMS-ie');
  };
  const { rows } = await styleDocument(env, { domain: 'grupa-icea.pl', post_id: -3, post_type: 'posts' }, [
    { slot: 1, title_field: 'page_title_h2_1', text_field: 'page_text_1', title_after: 'H2', text_after: '<p>Tekst</p>', decision: null },
    { slot: 200, title_field: 'page_sources_title', text_field: 'page_sources_text', title_after: 'Źródła', text_after: '<ul></ul>', decision: null },
  ], fetchImpl);
  assert.deepEqual(rows.map((row) => row.slot), [1]);
  assert.equal(rows[0].source, 'job');
});

test('handleWpDraft Content Watchera odsyła nowy artykuł do Content Writera', async () => {
  const db = sqliteD1();
  const env = envFor(db);
  const { jobId } = await writtenProject(db, env);
  const response = await handleWpDraft(
    new Request(`${ORIGIN}/api/cw/jobs/${jobId}/wp-draft`, { method: 'POST', headers: { 'X-CW-Request': '1' }, body: '{}' }),
    env,
    jobId,
    { fetchImpl: async () => { throw new Error('bez WP'); } },
  );
  assert.equal(response.status, 409);
  assert.equal((await response.json()).code, 'new_article');
});

test('buildFactsPrompt: nowy artykuł pyta o konkrety tematu, nie o braki naszego tekstu', () => {
  const prompt = buildFactsPrompt({ title: 'audyt seo', new_article: true }, [{ url: 'https://a.pl/x', markdown: 'treść' }]);
  assert.match(prompt, /NOWY artykuł na temat „audyt seo"/);
  assert.doesNotMatch(prompt, /## Nasz artykuł/);
  const refresh = buildFactsPrompt({ title: 'T', markdown: 'nasz' }, [{ url: 'https://a.pl/x', markdown: 'treść' }]);
  assert.match(refresh, /## Nasz artykuł/);
});

test('research: treści konkurencji liczą się z frazą projektu jako tematem', async () => {
  const db = sqliteD1();
  const env = envFor(db, { JINA_API_KEY: 'j', OPENROUTER_API_KEY: 'o' });
  const project = await createProject(env);
  const seen = [];
  const fetchImpl = async (url, init) => {
    seen.push(String(url));
    if (String(url).startsWith('https://r.jina.ai/')) {
      return new Response(JSON.stringify({ data: { title: 'Rywal', content: `## Etapy\n\n${'słowo '.repeat(300)}` } }), { status: 200 });
    }
    if (String(url).includes('openrouter.ai')) {
      const prompt = JSON.parse(init.body).messages.at(-1).content;
      assert.match(prompt, /NOWY artykuł na temat „Audyt SEO"/);
      return new Response(JSON.stringify({
        choices: [{ message: { content: '{"facts":[{"fact":"Audyt trwa 2 tygodnie.","source":"https://a.pl/x"}],"topics":[]}' } }],
        usage: { prompt_tokens: 1, completion_tokens: 1 },
      }), { status: 200 });
    }
    throw new Error(`nieoczekiwane: ${url}`);
  };
  let response;
  for (let i = 0; i < 4; i++) {
    response = await call(env, `/api/cw/writer/projects/${project.id}/rivals`, {
      method: 'POST', body: { rivals: ['https://a.pl/x'] }, fetchImpl,
    });
    if (response.status === 200) break;
  }
  const data = await response.json();
  assert.equal(data.status, 'done');
  assert.equal(data.analysis.facts.length, 1);
  // Nasza strona nie była czytana – nowy artykuł jeszcze nie istnieje.
  assert.ok(seen.every((url) => !url.includes('grupa-icea.pl')));
});
