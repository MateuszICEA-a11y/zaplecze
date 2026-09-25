import { test } from 'node:test';
import assert from 'node:assert/strict';

import { applyVerdict, casesHash, classifyPhrases, cosine, decide, pathTopic, postText, syncIndex, THRESHOLDS } from './cw-semantic.js';
import { phraseKey } from './src/lib/phrase-match.js';
import { sqliteD1 } from './test-d1.js';

/* Model „embeddingów" do testów: wektor słów z małego słownika – podobne
   teksty mają podobne wektory, więc cosinus zachowuje się jak w prawdziwym. */
const VOCAB = ['adres', 'ip', 'url', 'domena', 'seo', 'link', 'audyt', 'strona', 'przeglądarka', 'kawa'];
const vec = (text) => VOCAB.map((word) => (String(text).toLowerCase().includes(word) ? 1 : 0.01));

function fakeAI() {
  const calls = [];
  return {
    calls,
    run: async (model, { text }) => {
      calls.push(text.length);
      return { data: text.map(vec) };
    },
  };
}

function fakeIndex() {
  const store = new Map();
  return {
    store,
    upsert: async (rows) => rows.forEach((row) => store.set(row.id, row)),
    deleteByIds: async (ids) => ids.forEach((id) => store.delete(id)),
    getByIds: async (ids) => ids.map((id) => store.get(id)).filter(Boolean),
    query: async (vector, { topK, filter }) => ({
      matches: [...store.values()]
        .filter((row) => !filter?.domain || row.metadata.domain === filter.domain)
        .map((row) => ({ id: row.id, score: cosine(vector, row.values), metadata: row.metadata }))
        .sort((a, b) => b.score - a.score)
        .slice(0, topK),
    }),
  };
}

const CATALOG = {
  items: [
    { id: 'posts-1', post_id: 1, url: 'https://www.grupa-icea.pl/blog/co-to-jest-adres-ip/', title: 'Co to jest adres IP', h2: ['Adres IP a domena'] },
    { id: 'posts-2', post_id: 2, url: 'https://www.grupa-icea.pl/blog/audyt-seo/', title: 'Audyt SEO strony', h2: [] },
    { id: 'posts-3', post_id: 3, url: 'https://www.grupa-icea.pl/blog/kawa/', title: 'Kawa w biurze', h2: [] },
  ],
};

function env(catalog = CATALOG, data = { rankings: [] }) {
  return {
    AI: fakeAI(),
    POSTS_INDEX: fakeIndex(),
    CW_DB: sqliteD1(),
    ASSETS: {
      fetch: async (request) => {
        const path = new URL(request.url).pathname;
        if (path.endsWith('/catalog.json')) return new Response(JSON.stringify(catalog));
        if (path.endsWith('/data.json')) return new Response(JSON.stringify(data));
        return new Response('{}', { status: 404 });
      },
    },
  };
}

test('postText: sam tytuł (kalibracja – opis rozmywał podobieństwo)', () => {
  assert.equal(postText({ title: ' Co to jest adres IP? ', meta_description: 'Opis | ICEA', h2: ['B'] }), 'Co to jest adres IP?');
  assert.equal(postText({}), '');
});

test('pathTopic: temat strony spoza katalogu z adresu, strona główna bez tematu', () => {
  assert.equal(pathTopic('/slownik/cross-selling'), 'slownik cross selling');
  assert.equal(pathTopic('/'), '');
});

test('decide: wpis rankujący i umiarkowanie bliski → sprawdź, z nim jako celem', () => {
  const ranking = { path: '/blog/wayback-machine', position: 16, score: 0.53, post_id: 7 };
  const out = decide([{ post_id: 9, score: 0.58 }], ranking);
  assert.equal(out.action, 'check');
  assert.equal(out.target.post_id, 7);
  assert.equal(out.reason, 'ranking_related');
  // Bez rankingu 0,53 to już „nowy".
  assert.equal(decide([{ post_id: 7, score: 0.53 }], null).action, 'new');
});

test('decide: rankujący wpis o tym samym temacie → odśwież właśnie jego', () => {
  const ranking = { path: '/blog/x/', position: 23, score: 0.8, post_id: 7 };
  const out = decide([{ post_id: 9, score: 0.85 }], ranking);
  assert.equal(out.action, 'refresh');
  assert.equal(out.target.post_id, 7);
});

test('decide: strona łapiąca frazę przy okazji nie blokuje – decyduje bliski wpis', () => {
  const offTopic = { path: '/', position: 23, score: null, post_id: null };
  assert.equal(decide([{ post_id: 1, score: THRESHOLDS.refresh + 0.05 }], offTopic).action, 'refresh');
  assert.equal(decide([{ post_id: 1, score: THRESHOLDS.check - 0.05 }], offTopic).action, 'new');
  assert.equal(decide([{ post_id: 1, score: THRESHOLDS.check - 0.05 }], offTopic).reason, 'ranks_off_topic');
});

test('decide: temat pokrewny → sprawdź, brak czegokolwiek → nowy', () => {
  assert.equal(decide([{ post_id: 1, score: (THRESHOLDS.check + THRESHOLDS.refresh) / 2 }], null).action, 'check');
  assert.equal(decide([], null).action, 'new');
});

test('syncIndex: liczy tylko nowe i zmienione wpisy, usuwa znikające', async () => {
  const environment = env();
  const first = await syncIndex(environment, 'grupa-icea.pl');
  assert.deepEqual(first, { catalog: 3, embedded: 3, remaining: 0, deleted: 0 });
  assert.equal(environment.POSTS_INDEX.store.size, 3);

  // Bez zmian – zero wywołań modelu.
  const calls = environment.AI.calls.length;
  const second = await syncIndex(environment, 'grupa-icea.pl');
  assert.equal(second.embedded, 0);
  assert.equal(environment.AI.calls.length, calls);

  // Zmieniony tytuł jednego wpisu, drugi zniknął z katalogu.
  const changed = { items: [{ ...CATALOG.items[0], title: 'Adres IP – co to jest' }, CATALOG.items[1]] };
  const environment2 = { ...environment, ASSETS: env(changed).ASSETS };
  const third = await syncIndex(environment2, 'grupa-icea.pl');
  assert.equal(third.embedded, 1);
  assert.equal(third.deleted, 1);
  assert.equal(environment.POSTS_INDEX.store.has('grupa-icea.pl:3'), false);
});

test('classifyPhrases: wpis o adresie IP wygrywa z rankingiem strony głównej', async () => {
  const data = { rankings: [{ keyword: 'adres ip', position: 23, path: '/' }] };
  const environment = env(CATALOG, data);
  await syncIndex(environment, 'grupa-icea.pl');
  const [result] = await classifyPhrases(environment, 'grupa-icea.pl', ['adres ip'], data.rankings);
  assert.equal(result.action, 'refresh');
  assert.equal(result.target.post_id, 1);
  // Strona główna rankuje, ale nie ma jej w katalogu – bez oceny podobieństwa.
  assert.equal(result.ranking.path, '/');
  assert.equal(result.ranking.score, null);
});

test('classifyPhrases: rankujący wpis spoza TOP 5 dostaje własną ocenę podobieństwa', async () => {
  const data = { rankings: [{ keyword: 'kawa seo', position: 30, path: '/blog/kawa' }] };
  const environment = env(CATALOG, data);
  await syncIndex(environment, 'grupa-icea.pl');
  const [result] = await classifyPhrases(environment, 'grupa-icea.pl', ['kawa seo'], data.rankings);
  assert.equal(result.ranking.post_id, 3);
  assert.equal(typeof result.ranking.score, 'number');
});

test('applyVerdict: same → odśwież wskazany wpis, different → nowy, skip → bez zmian', () => {
  const base = { phrase: 'x', action: 'check', target: { path: '/a' }, reason: 'related_post' };
  const options = [{ n: 1, row: { path: '/a', title: 'A' } }, { n: 2, row: { path: '/b', title: 'B' } }];
  const same = applyVerdict(base, options, { verdict: 'same', pick: 2, basis: 'to samo' });
  assert.equal(same.action, 'refresh');
  assert.equal(same.target.path, '/b');
  assert.equal(same.judge.basis, 'to samo');
  assert.equal(applyVerdict(base, options, { verdict: 'different', pick: null, basis: '' }).action, 'new');
  assert.equal(applyVerdict(base, options, { verdict: 'skip', pick: null, basis: '' }), base);
  assert.equal(applyVerdict(base, options, undefined), base);
});

test('classifyPhrases: „Sprawdź" idzie do sędziego jednym wywołaniem i dostaje jego werdykt', async () => {
  // Dwa z czterech słów wspólne z „Audyt SEO strony" – cosinus ~0,71, pasmo niepewności.
  const data = { rankings: [] };
  const environment = { ...env(CATALOG, data), OPENROUTER_API_KEY: 'k' };
  await syncIndex(environment, 'grupa-icea.pl');
  const prompts = [];
  const fetchImpl = async (url, init) => {
    const body = JSON.parse(init.body);
    prompts.push(body.messages[0].content);
    return new Response(JSON.stringify({
      choices: [{ message: { content: JSON.stringify({ results: [{ id: 1, verdict: 'same', pick: 1, basis: 'ten sam temat' }] }) } }],
    }));
  };
  const [result] = await classifyPhrases(environment, 'grupa-icea.pl', ['audyt seo link url'], data.rankings, {
    fetchImpl,
    thresholds: THRESHOLDS,
  });
  assert.equal(prompts.length, 1);
  assert.match(prompts[0], /„audyt seo link url"/);
  assert.equal(result.action, 'refresh');
  assert.equal(result.reason, 'judge_same');
});

test('classifyPhrases: werdykt sędziego zapamiętany – drugie wejście bez wywołania modelu', async () => {
  const data = { rankings: [] };
  const environment = { ...env(CATALOG, data), OPENROUTER_API_KEY: 'k' };
  await syncIndex(environment, 'grupa-icea.pl');
  let calls = 0;
  const fetchImpl = async () => {
    calls += 1;
    return new Response(JSON.stringify({
      choices: [{ message: { content: JSON.stringify({ results: [{ id: 1, verdict: 'different', pick: null, basis: 'inny temat' }] }) } }],
    }));
  };
  const first = await classifyPhrases(environment, 'grupa-icea.pl', ['audyt seo link url'], data.rankings, { fetchImpl });
  const second = await classifyPhrases(environment, 'grupa-icea.pl', ['audyt seo link url'], data.rankings, { fetchImpl });
  assert.equal(calls, 1);
  assert.equal(first[0].action, 'new');
  assert.equal(second[0].action, 'new');
  assert.equal(second[0].judge.cached, true);
});

test('classifyPhrases: decyzja redaktora wygrywa z modelem', async () => {
  const data = { rankings: [] };
  const environment = { ...env(CATALOG, data), OPENROUTER_API_KEY: 'k' };
  await syncIndex(environment, 'grupa-icea.pl');
  await environment.CW_DB.prepare(
    `INSERT INTO phrase_verdicts (domain, phrase_key, source, phrase, verdict, target, created_at)
     VALUES ('grupa-icea.pl', ?, 'editor', 'audyt seo link url', 'same', ?, '2026-09-25T10:00:00Z')`,
  ).bind(phraseKey('audyt seo link url'), JSON.stringify({ title: 'Audyt SEO strony', url: 'https://x/b/', path: '/b' })).run();
  let calls = 0;
  const fetchImpl = async () => { calls += 1; return new Response('{}'); };
  const [result] = await classifyPhrases(environment, 'grupa-icea.pl', ['audyt seo link url'], data.rankings, { fetchImpl });
  assert.equal(calls, 0);
  assert.equal(result.action, 'refresh');
  assert.equal(result.reason, 'editor_same');
  assert.equal(result.target.title, 'Audyt SEO strony');
});

test('casesHash: zmiana kandydatów unieważnia werdykt, kolejność nie', async () => {
  const item = { phrase: 'audyt seo', options: [{ path: '/a', title: 'A' }, { path: '/b', title: 'B' }] };
  const same = await casesHash({ ...item, options: [...item.options].reverse() });
  assert.equal(await casesHash(item), same);
  assert.notEqual(await casesHash({ ...item, options: [{ path: '/a', title: 'A' }] }), same);
});
