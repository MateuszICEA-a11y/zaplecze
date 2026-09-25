import { test } from 'node:test';
import assert from 'node:assert/strict';

import { itemText, pendingItems } from './cw-competitors.js';

const items = [
  { url: 'https://a.pl/blog/nowy/' },
  { url: 'https://a.pl/blog/zmieniony/' },
  { url: 'https://a.pl/blog/stary-new/' },
  { url: 'https://a.pl/blog/stary-refresh/' },
  { url: 'https://a.pl/blog/swiezy-new/' },
];
const hashes = new Map(items.map((item) => [item.url, 'h1']));
const stored = new Map([
  ['https://a.pl/blog/zmieniony/', { text_hash: 'h0', action: 'new', classified_at: '2026-09-25T10:00:00Z' }],
  ['https://a.pl/blog/stary-new/', { text_hash: 'h1', action: 'new', classified_at: '2026-09-20T10:00:00Z' }],
  ['https://a.pl/blog/stary-refresh/', { text_hash: 'h1', action: 'refresh', classified_at: '2026-09-20T10:00:00Z' }],
  ['https://a.pl/blog/swiezy-new/', { text_hash: 'h1', action: 'new', classified_at: '2026-09-25T10:00:00Z' }],
]);

test('pendingItems: nowe, zmienione i „nie mamy” sprzed zmiany naszego indeksu', () => {
  const pending = pendingItems(items, stored, hashes, '2026-09-24T05:20:00Z').map((item) => item.url);
  assert.deepEqual(pending, ['https://a.pl/blog/nowy/', 'https://a.pl/blog/zmieniony/', 'https://a.pl/blog/stary-new/']);
});

test('itemText: prawdziwy tytuł ma pierwszeństwo przed slugiem', () => {
  assert.equal(itemText({ title: 'Co to jest URL?', slug_title: 'co to jest url' }), 'Co to jest URL?');
  assert.equal(itemText({ title: null, slug_title: 'co to jest url' }), 'co to jest url');
});
