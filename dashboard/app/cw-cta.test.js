import { test } from 'node:test';
import assert from 'node:assert/strict';

import { sanitizeSectionHtml } from './cw-api.js';
import { CTA_MARKER, ctaHtml, handleCta, hasCta, stripCta } from './cw-cta.js';

test('cta: szablon przeżywa sanityzację ze stylami i znacznikiem', () => {
  const clean = sanitizeSectionHtml(ctaHtml());
  assert.match(clean, /<div style="[^"]*background:#000623/);
  assert.match(clean, /<a href="https:\/\/www\.grupa-icea\.pl\/kontakt\/#cw-cta"/);
  assert.match(clean, /<span style="[^"]*background:#5768ff[^"]*">Umów bezpłatną konsultację<\/span>/);
  assert.equal(hasCta(clean), true);
  // Sanityzacja drugi raz nie zmienia bloku – insert zapisuje formę stabilną.
  assert.equal(sanitizeSectionHtml(clean), clean);
});

test('cta: bloki z epizodu 1.1.0 (mailto) dają się wykryć i zdjąć', () => {
  const legacy = '<div style="margin:28px 0"><p>CTA</p>'
    + '<a href="mailto:biuro@grupa-icea.pl"><span>Umów</span></a></div>';
  const text = `<p>Treść.</p>\n${legacy}`;
  assert.equal(hasCta(text), true);
  const stripped = stripCta(text);
  assert.equal(hasCta(stripped), false);
  assert.match(stripped, /Treść\./);
});

test('cta: stripCta zdejmuje blok i zostawia resztę treści', () => {
  const block = sanitizeSectionHtml(ctaHtml());
  const text = `<p>Akapit pierwszy.</p>\n${block}\n<p>Akapit drugi.</p>`;
  const stripped = stripCta(text);
  assert.equal(hasCta(stripped), false);
  assert.match(stripped, /Akapit pierwszy/);
  assert.match(stripped, /Akapit drugi/);
  // Zwykły div bez znacznika zostaje nietknięty.
  const other = '<div style="margin:0"><p>karta</p></div>';
  assert.equal(stripCta(other), other);
});

test('cta: handler odrzuca FAQ i nieznany krok', async () => {
  const db = { prepare: () => ({ bind: () => ({ first: async () => ({ id: 'j', status: 'done' }) }) }) };
  const request = (body) => new Request('https://dash.example/api/cw/jobs/job-abcdef12/cta/105', {
    method: 'POST',
    headers: { 'X-CW-Request': '1', 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const faq = await handleCta(request({ step: 'insert' }), { CW_DB: db }, 'job-abcdef12', 105);
  assert.equal(faq.status, 400);
  assert.match((await faq.json()).error, /FAQ/);
});

test('cta: znacznik to kotwica, bez utm-ów (nie psuje sesji GA4)', () => {
  assert.match(CTA_MARKER, /#cw-cta$/);
  assert.doesNotMatch(ctaHtml(), /utm_/);
});
