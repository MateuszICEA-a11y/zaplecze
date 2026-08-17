import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  buildBriefPrompt,
  createImageTask,
  figureHtml,
  finalPrompt,
  generateBrief,
  handleInfographic,
  KIE_MODEL,
  MAX_IMAGE_BYTES,
  pollImageTask,
  STYLE_ICEA,
  uploadToMedia,
} from './cw-infographic.js';

/** Minimalny stub D1 – reakcje dobierane po fragmencie SQL (jak w cw-api.test.js). */
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
      bind: (...values) => { args = values; return self; },
      first: async () => { calls.push({ sql, args, op: 'first' }); return respond(sql, args) ?? null; },
      all: async () => { calls.push({ sql, args, op: 'all' }); return { results: respond(sql, args) ?? [] }; },
      run: async () => { calls.push({ sql, args, op: 'run' }); return { meta: { changes: respond(sql, args) ?? 1 } }; },
    };
    return self;
  };
  return { calls, prepare: (sql) => statement(sql), batch: async () => [] };
}

const ENV = {
  OPENROUTER_API_KEY: 'or-key',
  KIE_API_KEY: 'kie-key',
  WP_APP_USER: 'redaktor',
  WP_APP_PASSWORD: 'haslo aplikacji',
  CW_DOMAINS: 'grupa-icea.pl=https://www.grupa-icea.pl',
};

const JOB = {
  id: 'job-abcdef12', domain: 'grupa-icea.pl', post_id: 123, post_type: 'posts',
  status: 'done', title: 'Jak AI cytuje marki', models: null,
};

const SECTION = { slot: 4, title: 'Jak działa RAG', text: '<p>Model <b>dociąga</b> dokumenty przed odpowiedzią.</p>' };

const post = (body) => new Request('https://dash.example/api/cw/jobs/job-abcdef12/infographic/4', {
  method: 'POST',
  headers: { 'X-CW-Request': '1', 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

/* ---------- prompt ---------- */

test('prompt końcowy: styl marki i reguła pisowni obudowują opis', () => {
  const prompt = finalPrompt('Flow diagram with labels.');
  assert.ok(prompt.startsWith(STYLE_ICEA));
  assert.match(prompt, /Flow diagram with labels\./);
  // Gotcha z pipeline'u: gpt-image-2 dokłada akcenty nad literami bez akcentów.
  assert.match(prompt, /Never add accents/);
  assert.match(prompt, /#5768FF/);
});

test('brief: sekcja idzie bez znaczników, z limitem etykiet', () => {
  const prompt = buildBriefPrompt({ title: JOB.title, section: SECTION });
  assert.match(prompt, /Jak działa RAG/);
  assert.match(prompt, /Model dociąga dokumenty przed odpowiedzią\./);
  assert.doesNotMatch(prompt, /<b>/);
  assert.match(prompt, /Maksymalnie 8 etykiet/);
  assert.match(prompt, /Nie wymyślaj liczb/);
});

test('brief: model oddaje opis, alt i podpis', async () => {
  const fetchImpl = async () => new Response(JSON.stringify({
    model: 'google/gemini-3.7-flash',
    choices: [{ message: { content: JSON.stringify({ brief: 'Diagram.', alt: 'Schemat RAG', caption: 'Jak RAG dociąga dane' }) } }],
    usage: { prompt_tokens: 5, completion_tokens: 7 },
  }), { status: 200 });
  const result = await generateBrief(ENV, JOB, SECTION, { fetchImpl });
  assert.equal(result.ok, true);
  assert.equal(result.data.alt, 'Schemat RAG');
  assert.equal(result.cost.tokens_out, 7);
});

test('brief: odpowiedź bez opisu to błąd', async () => {
  const fetchImpl = async () => new Response(JSON.stringify({
    choices: [{ message: { content: '{"alt":"tylko alt"}' } }],
  }), { status: 200 });
  const result = await generateBrief(ENV, JOB, SECTION, { fetchImpl });
  assert.equal(result.ok, false);
  assert.match(result.error, /opisu grafiki/);
});

/* ---------- kie.ai ---------- */

test('kie.ai: zlecenie niesie model, format i pełny prompt', async () => {
  let sent = null;
  const fetchImpl = async (url, options) => {
    sent = { url, body: JSON.parse(options.body), auth: options.headers.Authorization };
    return new Response(JSON.stringify({ code: 200, data: { taskId: 'task-1' } }), { status: 200 });
  };
  const result = await createImageTask(ENV, 'Diagram with labels po polsku.', { fetchImpl });
  assert.equal(result.taskId, 'task-1');
  assert.match(sent.url, /createTask$/);
  assert.equal(sent.body.model, KIE_MODEL);
  assert.equal(sent.body.input.aspect_ratio, '16:9');
  assert.ok(sent.body.input.prompt.startsWith(STYLE_ICEA));
  assert.equal(sent.auth, 'Bearer kie-key');
});

test('kie.ai: odmowa niesie komunikat usługi', async () => {
  const fetchImpl = async () => new Response(JSON.stringify({ code: 402, msg: 'insufficient credits' }), { status: 200 });
  const result = await createImageTask(ENV, 'Diagram.', { fetchImpl });
  assert.equal(result.ok, false);
  assert.match(result.error, /insufficient credits/);
});

test('kie.ai: brak klucza zgłaszany wprost', async () => {
  const result = await createImageTask({ ...ENV, KIE_API_KEY: '' }, 'Diagram.', { fetchImpl: async () => new Response('{}') });
  assert.equal(result.ok, false);
  assert.match(result.error, /KIE_API_KEY/);
});

test('kie.ai: stany zlecenia – gotowe, nieudane, w toku', async () => {
  const ready = await pollImageTask(ENV, 'task-1', {
    fetchImpl: async () => new Response(JSON.stringify({
      data: { state: 'success', creditsConsumed: 12, resultJson: JSON.stringify({ resultUrls: ['https://kie.example/a.png'] }) },
    }), { status: 200 }),
  });
  assert.deepEqual(ready, { state: 'ready', url: 'https://kie.example/a.png', credits: 12 });

  const failed = await pollImageTask(ENV, 'task-1', {
    fetchImpl: async () => new Response(JSON.stringify({ data: { state: 'failed', failMsg: 'content policy' } }), { status: 200 }),
  });
  assert.equal(failed.state, 'failed');
  assert.match(failed.error, /content policy/);

  const running = await pollImageTask(ENV, 'task-1', {
    fetchImpl: async () => new Response(JSON.stringify({ data: { state: 'waiting' } }), { status: 200 }),
  });
  assert.equal(running.state, 'generating');

  // Sukces bez adresu to błąd, nie „gotowe" z pustym obrazem.
  const empty = await pollImageTask(ENV, 'task-1', {
    fetchImpl: async () => new Response(JSON.stringify({ data: { state: 'success', resultJson: '{}' } }), { status: 200 }),
  });
  assert.equal(empty.state, 'failed');
});

test('kie.ai: zerwane połączenie nie ubija zlecenia', async () => {
  const result = await pollImageTask(ENV, 'task-1', { fetchImpl: async () => { throw new Error('socket'); } });
  assert.equal(result.state, 'generating');
});

/* ---------- blok w treści ---------- */

test('figure: podpis opcjonalny, znaczniki w alt nie przechodzą', () => {
  const withCaption = figureHtml({ src: 'https://cdn.example/a.png', alt: 'Schemat "RAG" <b>groźny</b>', caption: 'Podpis' });
  assert.match(withCaption, /<figure style="[^"]+">/);
  // Znaczniki i cudzysłowy wypadają, treść zostaje – alt to tekst dla czytnika.
  assert.match(withCaption, /alt="Schemat RAG groźny"/);
  assert.match(withCaption, /<figcaption[^>]*>Podpis<\/figcaption>/);
  const bare = figureHtml({ src: 'https://cdn.example/a.png', alt: '', caption: '' });
  assert.doesNotMatch(bare, /figcaption/);
});

/* ---------- biblioteka mediów ---------- */

test('media: plik idzie z nagłówkiem Content-Disposition, alt osobnym zapisem', async () => {
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    calls.push({ url, method: options.method ?? 'GET', headers: options.headers ?? {} });
    if (url.startsWith('https://kie.example')) return new Response(new Uint8Array([1, 2, 3]), { status: 200 });
    if (url.endsWith('/media/')) {
      return new Response(JSON.stringify({ id: 77, source_url: 'https://www.grupa-icea.pl/wp-content/a.png' }), { status: 201 });
    }
    return new Response(JSON.stringify({ id: 77 }), { status: 200 });
  };
  const result = await uploadToMedia(
    ENV, 'https://www.grupa-icea.pl', 'https://kie.example/a.png',
    { filename: 'infografika-4.png', alt: 'Schemat', caption: 'Podpis' }, fetchImpl,
  );
  assert.equal(result.ok, true);
  assert.equal(result.id, 77);
  assert.match(result.url, /wp-content\/a\.png$/);
  const upload = calls.find((call) => call.url.endsWith('/media/'));
  assert.match(upload.headers['Content-Disposition'], /filename="infografika-4\.png"/);
  assert.equal(upload.headers['Content-Type'], 'image/png');
  assert.ok(upload.headers.Authorization.startsWith('Basic '));
  // Alt i podpis nie przechodzą multipartem – idą drugim żądaniem na media/77.
  assert.ok(calls.some((call) => call.url.endsWith('/media/77/')));
});

test('media: odmowa WordPressa niesie kod (uprawnienia vs WAF)', async () => {
  const fetchImpl = async (url) => {
    if (url.startsWith('https://kie.example')) return new Response(new Uint8Array([1]), { status: 200 });
    return new Response(JSON.stringify({ code: 'rest_cannot_create' }), { status: 403 });
  };
  const result = await uploadToMedia(ENV, 'https://www.grupa-icea.pl', 'https://kie.example/a.png', { filename: 'a.png' }, fetchImpl);
  assert.equal(result.ok, false);
  assert.equal(result.code, 'rest_cannot_create');
  assert.match(result.error, /403/);
});

test('media: brak hasła aplikacji zatrzymuje krok przed pobraniem obrazu', async () => {
  let called = false;
  const fetchImpl = async () => { called = true; return new Response('{}'); };
  const result = await uploadToMedia({ ...ENV, WP_APP_PASSWORD: '' }, 'https://x', 'https://kie.example/a.png', {}, fetchImpl);
  assert.equal(result.ok, false);
  assert.match(result.error, /WP_APP_USER/);
  assert.equal(called, false);
});

test('media: obraz ponad limit nie leci do WordPressa', async () => {
  const calls = [];
  const fetchImpl = async (url) => {
    calls.push(url);
    return new Response(new Uint8Array(MAX_IMAGE_BYTES + 1), { status: 200 });
  };
  const result = await uploadToMedia(ENV, 'https://www.grupa-icea.pl', 'https://kie.example/a.png', { filename: 'a.png' }, fetchImpl);
  assert.equal(result.ok, false);
  assert.match(result.error, /większy niż/);
  assert.equal(calls.length, 1, 'tylko pobranie obrazu, bez zapisu w CMS-ie');
});

/* ---------- handler ---------- */

test('handler: GET bez zapisu oddaje pustkę, nie błąd', async () => {
  const db = fakeDb({ 'SELECT * FROM jobs': JOB, 'SELECT * FROM job_images': null });
  const request = new Request('https://dash.example/api/cw/jobs/job-abcdef12/infographic/4');
  const response = await handleInfographic(request, { CW_DB: db, ...ENV }, 'job-abcdef12', 4);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).image, null);
});

test('handler: GET w trakcie generowania dopisuje gotowy obraz', async () => {
  const writes = [];
  const db = fakeDb({
    'SELECT * FROM jobs': JOB,
    'SELECT * FROM job_images': (args) => (writes.length
      ? { job_id: 'job-abcdef12', slot: 4, status: 'ready', image_url: 'https://kie.example/a.png' }
      : { job_id: 'job-abcdef12', slot: 4, status: 'generating', task_id: 'task-1' }),
    'INSERT INTO job_images': (args) => { writes.push(args); return 1; },
  });
  const fetchImpl = async () => new Response(JSON.stringify({
    data: { state: 'success', creditsConsumed: 9, resultJson: JSON.stringify({ resultUrls: ['https://kie.example/a.png'] }) },
  }), { status: 200 });
  const request = new Request('https://dash.example/api/cw/jobs/job-abcdef12/infographic/4');
  const response = await handleInfographic(request, { CW_DB: db, ...ENV }, 'job-abcdef12', 4, { fetchImpl });
  assert.equal((await response.json()).image.status, 'ready');
  assert.equal(writes.length, 1);
});

test('handler: mutacje wymagają nagłówka dashboardu i zakończonej analizy', async () => {
  const db = fakeDb({ 'SELECT * FROM jobs': { ...JOB, status: 'running' } });
  const bare = new Request('https://dash.example/api/cw/jobs/job-abcdef12/infographic/4', { method: 'POST' });
  assert.equal((await handleInfographic(bare, { CW_DB: db, ...ENV }, 'job-abcdef12', 4)).status, 403);
  const running = await handleInfographic(post({ step: 'brief' }), { CW_DB: db, ...ENV }, 'job-abcdef12', 4);
  assert.equal(running.status, 409);
  assert.match((await running.json()).error, /po zakończeniu analizy/);
});

test('handler: za krótki opis nie idzie do kie.ai', async () => {
  let called = false;
  const db = fakeDb({ 'SELECT * FROM jobs': JOB });
  const fetchImpl = async () => { called = true; return new Response('{}'); };
  const response = await handleInfographic(post({ step: 'generate', brief: 'diagram' }), { CW_DB: db, ...ENV }, 'job-abcdef12', 4, { fetchImpl });
  assert.equal(response.status, 400);
  assert.equal(called, false);
});

test('handler: wstawienie bez gotowego obrazu to 409', async () => {
  const db = fakeDb({ 'SELECT * FROM jobs': JOB, 'SELECT * FROM job_images': { status: 'brief', image_url: null } });
  const response = await handleInfographic(post({ step: 'insert' }), { CW_DB: db, ...ENV }, 'job-abcdef12', 4);
  assert.equal(response.status, 409);
  assert.match((await response.json()).error, /wygeneruj obraz/);
});

test('handler: nieznany krok odrzucony', async () => {
  const db = fakeDb({ 'SELECT * FROM jobs': JOB });
  const response = await handleInfographic(post({ step: 'namaluj' }), { CW_DB: db, ...ENV }, 'job-abcdef12', 4);
  assert.equal(response.status, 400);
});

test('handler: zlecenie zapisuje taskId i oddaje 202', async () => {
  const writes = [];
  const db = fakeDb({
    'SELECT * FROM jobs': JOB,
    'INSERT INTO job_images': (args) => { writes.push(args); return 1; },
    'SELECT * FROM job_images': { job_id: 'job-abcdef12', slot: 4, status: 'generating', task_id: 'task-9' },
  });
  const fetchImpl = async () => new Response(JSON.stringify({ code: 200, data: { taskId: 'task-9' } }), { status: 200 });
  const brief = 'Horizontal flow diagram with four labelled cards and Polish labels.';
  const response = await handleInfographic(post({ step: 'generate', brief }), { CW_DB: db, ...ENV }, 'job-abcdef12', 4, { fetchImpl });
  assert.equal(response.status, 202);
  assert.ok(writes[0].includes('task-9'));
  assert.equal((await response.json()).image.status, 'generating');
});

test('handler: usunięcie zdejmuje blok z treści, plik zostaje w bibliotece', async () => {
  const figure = '<figure style="margin:28px 0;padding:0"><img src="https://x/a.png" alt="a" /></figure>';
  const updates = [];
  const deletes = [];
  const db = fakeDb({
    'SELECT * FROM jobs': JOB,
    'SELECT * FROM job_images': { job_id: 'job-abcdef12', slot: 4, status: 'inserted', media_id: 77, figure_html: figure },
    'SELECT text_after, text_before FROM job_sections': { text_after: `<p>tekst</p>\n${figure}` },
    'UPDATE job_sections SET text_after = ?': (args) => { updates.push(args); return 1; },
    'DELETE FROM job_images': (args) => { deletes.push(args); return 1; },
  });
  const response = await handleInfographic(post({ step: 'drop' }), { CW_DB: db, ...ENV }, 'job-abcdef12', 4);
  assert.equal(response.status, 200);
  assert.equal(updates[0][0], '<p>tekst</p>');
  assert.deepEqual(deletes[0], ['job-abcdef12', 4]);
  assert.equal((await response.json()).media_kept, 77);
});
