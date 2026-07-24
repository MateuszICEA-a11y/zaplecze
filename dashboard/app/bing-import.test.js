import assert from 'node:assert/strict';
import test from 'node:test';

import { parseBingAiCsv, parseCsv } from './bing-import.js';

test('parseCsv handles BOM, quoted commas and escaped quotes', () => {
  const rows = parseCsv('\uFEFF"A","B"\r\n"tekst, test","a ""cytat"""\r\n');
  assert.deepEqual(rows, [
    ['A', 'B'],
    ['tekst, test', 'a "cytat"'],
  ]);
});

test('parseBingAiCsv parses the Bing AI Performance export', () => {
  const csv = [
    '"Grounding Query","Intent","Topic","Citations","Citation Share"',
    '"paginacja stron","Learn and Solve","E-commerce","74","16,09%"',
    '"search console","Informational","SEO","30","0,22%"',
  ].join('\n');
  const result = parseBingAiCsv(
    csv,
    'www.example.pl_AISearchQueriesReport_21.07.2026.csv',
    new Date('2026-07-24T10:00:00Z'),
  );
  assert.equal(result.date, '2026-07-21');
  assert.equal(result.rows.length, 2);
  assert.deepEqual(result.rows[0], {
    query: 'paginacja stron',
    intent: 'Learn and Solve',
    topic: 'E-commerce',
    citations: 74,
    citation_share: 16.09,
  });
});

test('parseBingAiCsv accepts semicolon-separated Polish headers', () => {
  const result = parseBingAiCsv(
    'Zapytanie;Intencja;Temat;Cytowania;Udział cytowań\nfraza;Informational;SEO;12;4,5%\n',
    'raport-2026-07-23.csv',
  );
  assert.equal(result.date, '2026-07-23');
  assert.equal(result.rows[0].citation_share, 4.5);
});

test('parseBingAiCsv rejects a different Bing report', () => {
  assert.throws(
    () => parseBingAiCsv('Date,Clicks,Impressions\n2026-07-20,1,20\n'),
    /Nie rozpoznaję eksportu AI Performance/,
  );
});
