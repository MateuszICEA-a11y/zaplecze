import { test } from 'node:test';
import assert from 'node:assert/strict';

import { buildFactsPrompt, handleRivals, markdownHeadings, median, proseWords, publicView, readPage, rivalsSummary, runRivalsStep } from './cw-rivals.js';

const NAV_NOISE = `[](https://example.pl/)

*   [Zgoda](https://example.pl/#)
*   [Szczegóły](https://example.pl/#)

# Zlecę pozycjonowanie: O czym należy pamiętać?

Dobra pozycja w wyszukiwaniach jest dzisiaj warunkiem koniecznym, by zostać zauważonym wśród swojej konkurencji.

## Czym zajmuje się agencja?

Zadania agencji sięgają naprawdę szerokich obszarów cyfryzacji, jednak do najbardziej podstawowych zalicza się audyt i optymalizację.

*   [Poprzedni wpis](https://example.pl/a) [Następny wpis](https://example.pl/b)`;

test('proseWords: liczy zdania artykułu, pomija menu i listy linków', () => {
  const words = proseWords(NAV_NOISE);
  // Dwa akapity i dwa nagłówki – bez nawigacji, zgód i „poprzedni wpis".
  assert.ok(words > 35 && words < 60, `nieoczekiwana liczba słów: ${words}`);
  assert.equal(proseWords(''), 0);
});

test('proseWords: linia z samych linków nie jest treścią', () => {
  assert.equal(proseWords('[a](https://x.pl) [b](https://y.pl) [c](https://z.pl) [d](https://w.pl)'), 0);
});

test('markdownHeadings: same H2 i H3, bez znaczników', () => {
  assert.deepEqual(markdownHeadings(NAV_NOISE), ['Czym zajmuje się agencja?']);
});

test('median: parzysta i nieparzysta liczba elementów, puste dane', () => {
  assert.equal(median([1200, 1800, 2400]), 1800);
  assert.equal(median([1000, 2000]), 1500);
  assert.equal(median([]), null);
});

test('readPage: wysyła klucz i selektory, zwraca metryki', async () => {
  let sent = null;
  const page = await readPage('https://rywal.pl/wpis/', { JINA_API_KEY: 'jina_test' }, async (url, init) => {
    sent = { url, init };
    return new Response(JSON.stringify({
      data: { title: 'Wpis rywala', content: NAV_NOISE, usage: { tokens: 900 } },
    }), { status: 200 });
  });
  assert.equal(sent.url, 'https://r.jina.ai/https://rywal.pl/wpis/');
  assert.equal(sent.init.headers.Authorization, 'Bearer jina_test');
  assert.match(sent.init.headers['X-Remove-Selector'], /ookie/);
  assert.equal(page.title, 'Wpis rywala');
  assert.ok(page.words > 35);
  assert.equal(page.tokens, 900);
});

test('readPage: brak klucza i błąd Readera dają czytelny komunikat', async () => {
  await assert.rejects(() => readPage('https://x.pl', {}, async () => new Response('{}')), /JINA_API_KEY/);
  await assert.rejects(
    () => readPage('https://x.pl', { JINA_API_KEY: 'k' }, async () =>
      new Response(JSON.stringify({ code: 422, readableMessage: 'No content available' }), { status: 422 })),
    /No content available/,
  );
});

/* ---------- etapy ---------- */

const fakeDb = () => ({
  prepare() { return this; },
  bind() { return this; },
  async run() { return { meta: { changes: 1 } }; },
  async first() { return null; },
});

test('runRivalsStep: kolejka schodzi po jednej stronie, potem fakty', async () => {
  const env = { CW_DB: fakeDb(), JINA_API_KEY: 'k', OPENROUTER_API_KEY: 'o' };
  const reader = async (url) => {
    if (String(url).startsWith('https://r.jina.ai/')) {
      return new Response(JSON.stringify({ data: { title: 't', content: NAV_NOISE } }), { status: 200 });
    }
    return new Response(JSON.stringify({
      model: 'anthropic/claude-sonnet-5',
      choices: [{ message: { content: '{"facts":[{"fact":"Ryczałt bywa tańszy","why":"brakuje u nas","source":"https://rywal.pl","kind":"liczba"}],"topics":["modele rozliczeń"]}' } }],
      usage: { prompt_tokens: 100, completion_tokens: 20 },
    }), { status: 200 });
  };

  let state = { our_url: 'https://my.pl/a/', queue: ['https://rywal.pl/1/', 'https://rywal.pl/2/'], rivals: [], ours: null, model: 'anthropic/claude-sonnet-5', stage: 'ours' };
  state = await runRivalsStep(env, 'my.pl', 1, state, reader); // nasza strona
  assert.ok(state.ours.words > 0);
  assert.equal(state.stage, 'rivals');
  state = await runRivalsStep(env, 'my.pl', 1, state, reader); // pierwszy rywal
  assert.equal(state.rivals.length, 1);
  assert.equal(state.rivals[0].host, 'rywal.pl');
  state = await runRivalsStep(env, 'my.pl', 1, state, reader); // drugi rywal
  assert.equal(state.stage, 'facts');
  state = await runRivalsStep(env, 'my.pl', 1, state, reader); // fakty
  assert.equal(state.stage, 'done');
  assert.equal(state.facts.length, 1);

  const view = publicView(state);
  assert.equal(view.rivals.length, 2);
  assert.equal(view.median_words, view.rivals[0].words);
  // Markdown zostaje w Workerze – do przeglądarki idą same metryki.
  assert.equal(JSON.stringify(view).includes('Dobra pozycja w wyszukiwaniach'), false);
});

test('runRivalsStep: strona nie do odczytania nie zatrzymuje analizy', async () => {
  const env = { CW_DB: fakeDb(), JINA_API_KEY: 'k', OPENROUTER_API_KEY: 'o' };
  const reader = async () => new Response(JSON.stringify({ readableMessage: 'timeout' }), { status: 500 });
  let state = { our_url: 'https://my.pl/a/', queue: ['https://rywal.pl/1/'], rivals: [], ours: null, model: 'm/x', stage: 'ours' };
  state = await runRivalsStep(env, 'my.pl', 1, state, reader);
  state = await runRivalsStep(env, 'my.pl', 1, state, reader);
  assert.equal(state.rivals[0].error.includes('timeout'), true);
  // Bez czytelnej treści nie ma czego porównywać – kończymy bez wywołania modelu.
  state = await runRivalsStep(env, 'my.pl', 1, state, reader);
  assert.equal(state.stage, 'done');
  assert.deepEqual(state.facts, []);
});

/** Baza z jednym wierszem snapshotu, zapamiętująca ostatni zapis. */
const dbWith = (row) => {
  const store = { row, writes: [] };
  store.db = {
    prepare(sql) { this.sql = sql; return this; },
    bind(...args) { this.args = args; return this; },
    async run() { store.writes.push(this.args); return { meta: { changes: 1 } }; },
    async first() { return store.row; },
  };
  return store;
};

const rivalsPost = (body) => new Request('https://dash/api/cw/rivals/my.pl/1', {
  method: 'POST',
  body: JSON.stringify(body),
});

test('handleRivals: krok idzie w żądaniu, nie w tle – klient dostaje etap', async () => {
  const store = dbWith(null);
  const env = { CW_DB: store.db, JINA_API_KEY: 'k', OPENROUTER_API_KEY: 'o' };
  const reader = async () => new Response(JSON.stringify({ data: { title: 't', content: NAV_NOISE } }), { status: 200 });
  const ctx = { waitUntil: () => assert.fail('krok nie może iść przez waitUntil – Worker go ucina') };

  const response = await handleRivals(
    rivalsPost({ our_url: 'https://my.pl/a/', rivals: ['https://rywal.pl/1/'] }),
    env, 'my.pl', 1, ctx, reader,
  );
  assert.equal(response.status, 202);
  const data = await response.json();
  // Nasza strona przeczytana w tym samym żądaniu, kolejka czeka na następne.
  assert.equal(data.status, 'running');
  assert.equal(data.stage, 'rivals');
});

test('handleRivals: krok w toku nie startuje drugiego przejazdu', async () => {
  const store = dbWith({
    status: 'running',
    created_at: new Date().toISOString(),
    payload: JSON.stringify({ stage: 'facts', busy_since: new Date().toISOString(), queue: [], rivals: [], ours: {} }),
  });
  const env = { CW_DB: store.db, JINA_API_KEY: 'k', OPENROUTER_API_KEY: 'o' };
  const response = await handleRivals(
    rivalsPost({ our_url: 'https://my.pl/a/', rivals: ['https://rywal.pl/1/'] }),
    env, 'my.pl', 1, null,
    async () => assert.fail('odpytanie w trakcie kroku nie może wołać Jiny ani modelu'),
  );
  assert.equal(response.status, 202);
  assert.equal((await response.json()).stage, 'facts');
  assert.equal(store.writes.length, 0, 'blokada nie zapisuje stanu');
});

test('rivalsSummary: skrót gotowej analizy dla pipeline\'u, null bez wyników', async () => {
  const withRow = (row) => ({ CW_DB: { prepare() { return this; }, bind() { return this; }, async first() { return row; } } });
  // Brak snapshotu → null.
  assert.equal(await rivalsSummary(withRow(null), 'd.pl', 1), null);
  // Analiza skończona bez faktów i tematów → null (nie ma czego nieść do briefu).
  assert.equal(await rivalsSummary(withRow({
    status: 'done', created_at: '2026-07-29T10:00:00Z',
    payload: JSON.stringify({ stage: 'done', facts: [], topics: [], rivals: [] }),
  }), 'd.pl', 1), null);
  // Komplet: fakty + mediana bez markdownów.
  const summary = await rivalsSummary(withRow({
    status: 'done', created_at: '2026-07-29T10:00:00Z',
    payload: JSON.stringify({
      stage: 'done', generated_at: '2026-07-29T10:00:00Z',
      ours: { url: 'https://my.pl/a/', words: 900, markdown: 'nasze' },
      rivals: [{ url: 'https://a.pl', words: 1500, markdown: 'sekret' }, { url: 'https://b.pl', words: 2100, markdown: 'sekret' }],
      facts: [{ fact: 'Limit 2 MB', why: 'brak u nas', source: 'https://a.pl', kind: 'liczba' }],
      topics: ['modele rozliczeń'],
    }),
  }), 'd.pl', 1);
  assert.equal(summary.facts.length, 1);
  assert.equal(summary.median_words, 1800);
  assert.equal(summary.our_words, 900);
  assert.equal(JSON.stringify(summary).includes('sekret'), false);
});

test('buildFactsPrompt: niesie naszą treść i wszystkie adresy konkurentów', () => {
  const prompt = buildFactsPrompt(
    { title: 'Nasz wpis', markdown: 'nasza treść' },
    [{ url: 'https://a.pl', markdown: 'treść A' }, { url: 'https://b.pl', markdown: 'treść B' }],
  );
  assert.match(prompt, /Nasz wpis/);
  assert.match(prompt, /https:\/\/a\.pl/);
  assert.match(prompt, /https:\/\/b\.pl/);
  assert.match(prompt, /wyłącznie JSON/);
});
