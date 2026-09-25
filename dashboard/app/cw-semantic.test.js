import { test } from 'node:test';
import assert from 'node:assert/strict';

import { classifyPhrases, cosine, decide, postText, syncIndex, THRESHOLDS } from './cw-semantic.js';
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

test('postText: tytuł, opis i nagłówki H2 – bez pustych części', () => {
  assert.equal(postText({ title: 'A', meta_description: null, h2: ['B', 'C'] }), 'A\nB; C');
  assert.equal(postText({ title: 'A', h2: [] }), 'A');
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
