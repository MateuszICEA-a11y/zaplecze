import { test } from 'node:test';
import assert from 'node:assert/strict';

import { findPhrase, hasPhrase, phraseKey } from './src/lib/phrase-match.js';
import { cannibalization, normPath, suggestGaps, writerData } from './src/lib/writer-gaps.js';

/* Lustro pipeline/content-refresher/tests/test_matching.py – te same przypadki. */
const TEXT = 'Ciepłe leady na fotowoltaikę są najcenniejsze. Jak pozyskać klientów na fotowoltaikę '
  + 'bez przepalania budżetu? Gdzie szukać klientów na fotowoltaikę – zaczynamy od SEO. '
  + 'Darmowe leady w fotowoltaice to mit, ale leady sprzedażowe w fotowoltaice da się '
  + 'pozyskiwać taniej. Pozyskiwanie klientów na fotowoltaikę wymaga planu.';

test('matcher: fraza z wyszukiwarki trafia w odmianę z przyimkiem', () => {
  assert.ok(hasPhrase(TEXT, 'leady fotowoltaika'));
  const [hit] = findPhrase(TEXT, 'pozyskiwanie klientów fotowoltaika');
  assert.equal(TEXT.slice(hit.start, hit.end), 'Pozyskiwanie klientów na fotowoltaikę');
});

test('matcher: miejscownik z wymianą spółgłoski', () => {
  assert.ok(hasPhrase(TEXT, 'darmowe leady fotowoltaiką'));
  assert.ok(hasPhrase(TEXT, 'leady sprzedażowe fotowoltaika'));
  assert.ok(hasPhrase('Reklama na drodze do klienta.', 'reklama droga'));
});

test('matcher: sam przymiotnik nie pokrywa frazy', () => {
  assert.equal(hasPhrase('Leady w branży fotowoltaicznej.', 'leady fotowoltaika'), false);
});

test('matcher: klucz wariantów znosi odmianę i szyk', () => {
  assert.equal(phraseKey('agencje seo'), phraseKey('seo agencja'));
  assert.notEqual(phraseKey('audyt seo'), phraseKey('audyt sem'));
});

/* ---------- podpowiedzi i kanibalizacja ---------- */

const DETAILS = {
  sources: {
    wordpress: {
      items: [
        { id: 1, type: 'posts', url: 'https://www.grupa-icea.pl/blog/audyty-seo/', slug: 'audyty-seo', title: 'Audyty SEO – co sprawdzamy' },
        { id: 2, type: 'posts', url: 'https://www.grupa-icea.pl/blog/meta-description/', slug: 'meta-description', title: 'Jak pisać meta description' },
      ],
    },
    senuto: {
      keywords: [
        { keyword: 'audyt seo', position: 14, searches: 900, url: 'grupa-icea.pl/blog/audyty-seo/' },
        { keyword: 'optymalizacja meta tagów', position: 18, searches: 400, url: 'grupa-icea.pl/blog/meta-description/' },
        { keyword: 'grupa icea opinie', position: 12, searches: 200, url: 'grupa-icea.pl/' },
        { keyword: 'linkowanie wewnętrzne', position: 5, searches: 700, url: 'grupa-icea.pl/blog/x/' },
        { keyword: 'rzadka fraza', position: 20, searches: 10, url: 'grupa-icea.pl/' },
      ],
    },
    gsc: {
      queries: [
        { key: 'jak optymalizacja meta tagów', impressions: 300, position: 16 },
        { key: 'co to jest mapa strony xml', impressions: 500, position: 22 },
        // Zapytanie usługowe bez strony docelowej – nie jest tematem na bloga.
        { key: 'agencja seo kraków', impressions: 900, position: 19 },
      ],
    },
  },
};

test('suggestGaps: luki bez własnego wpisu, bez marki, bez TOP 10 i szumu', () => {
  const rows = suggestGaps(DETAILS);
  const keywords = rows.map((row) => row.keyword);
  // „audyt seo" ma wpis „Audyty SEO…" – to odświeżenie, nie nowy tekst.
  assert.deepEqual(keywords, ['optymalizacja meta tagów', 'co to jest mapa strony xml']);
  // Senuto i GSC na tę samą frazę (pytanie z „jak") – jeden wiersz z obiema miarami.
  assert.deepEqual(rows[0].sources, ['Senuto', 'GSC']);
  assert.equal(rows[0].impressions, 300);
  assert.equal(rows[0].ranking_title, 'Jak pisać meta description');
});

test('cannibalization: wpis z frazą w tytule i adres w TOP 20', () => {
  const data = writerData(DETAILS);
  const result = cannibalization('Audyt SEO', data);
  assert.equal(result.pages[0].id, 'posts-1');
  assert.equal(result.rankings[0].position, 14);
  assert.equal(result.rankings[0].id, 'posts-1');
  assert.deepEqual(cannibalization('mapa strony xml', data), { pages: [], rankings: [] });
});

test('normPath: Senuto bez schematu i pełny adres dają tę samą ścieżkę', () => {
  assert.equal(normPath('grupa-icea.pl/blog/x/'), normPath('https://www.grupa-icea.pl/blog/x'));
  assert.equal(normPath('grupa-icea.pl/'), '/');
});
