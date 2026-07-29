import { test } from 'node:test';
import assert from 'node:assert/strict';

import { handleUsage, jwtExpiry, senutoStatus, serpdataUsage } from './cw-usage.js';

const NOW = Date.parse('2026-07-29T10:00:00Z');

/** JWT bez podpisu – liczy się tylko `exp` w payloadzie. */
const token = (expSeconds) =>
  `header.${Buffer.from(JSON.stringify({ exp: expSeconds })).toString('base64url')}.signature`;

test('jwtExpiry: czyta exp, na śmieciach zwraca null', () => {
  assert.equal(jwtExpiry(token(1_800_000_000)).getTime(), 1_800_000_000_000);
  assert.equal(jwtExpiry('nie-jwt'), null);
  assert.equal(jwtExpiry(''), null);
});

test('senutoStatus: dni do rotacji i progi ostrzeżeń', () => {
  const inDays = (days) => Math.floor((NOW + days * 86_400_000) / 1000);
  assert.deepEqual(
    { ...senutoStatus(token(inDays(20)), NOW), expires_at: undefined },
    { configured: true, status: 'ok', days_left: 20, expires_at: undefined },
  );
  assert.equal(senutoStatus(token(inDays(5)), NOW).status, 'warn');
  assert.equal(senutoStatus(token(inDays(-1)), NOW).status, 'err');
  assert.equal(senutoStatus('', NOW).status, 'off');
  // Klucz, który nie jest JWT-em, nie może udawać ważnego bezterminowo.
  assert.equal(senutoStatus('zwykly-klucz', NOW).status, 'unknown');
});

const balance = (limit, left) =>
  async () => new Response(JSON.stringify({ limit, left: String(left) }), { status: 200 });

test('serpdataUsage: saldo prosto z API, „left" przychodzi jako łańcuch', async () => {
  const usage = await serpdataUsage({ SERPDATA_API_KEY: 'x' }, NOW, balance(30000, '8349.00'));
  assert.equal(usage.left, 8349);
  assert.equal(usage.limit, 30000);
  assert.equal(usage.used, 21651);
  assert.equal(usage.status, 'ok');
});

test('serpdataUsage: progi ostrzeżeń liczone z udziału pakietu', async () => {
  assert.equal((await serpdataUsage({ SERPDATA_API_KEY: 'x' }, NOW, balance(30000, '4000'))).status, 'warn');
  assert.equal((await serpdataUsage({ SERPDATA_API_KEY: 'x' }, NOW, balance(30000, '1000'))).status, 'err');
  assert.equal((await serpdataUsage({ SERPDATA_API_KEY: 'x' }, NOW, balance(30000, '0'))).status, 'err');
});

test('serpdataUsage: padnięte API nie udaje zerowego salda', async () => {
  const usage = await serpdataUsage({ SERPDATA_API_KEY: 'x' }, NOW, async () => new Response('nope', { status: 500 }));
  assert.equal(usage.status, 'unknown');
  assert.equal(usage.left, null);
  assert.match(usage.error, /HTTP 500/);
});

test('serpdataUsage: brak klucza to stan „off", bez wywołania API', async () => {
  let called = false;
  const usage = await serpdataUsage({}, NOW, async () => { called = true; return new Response('{}'); });
  assert.equal(usage.status, 'off');
  assert.equal(called, false);
});

test('handleUsage: zwraca oba kafelki i nie każe cache’ować', async () => {
  const response = await handleUsage(
    new Request('https://dash.example/api/cw/usage'),
    { SERPDATA_API_KEY: 'x', SENUTO_API_KEY: token(Math.floor(NOW / 1000) + 86_400 * 12) },
    NOW,
    balance(30000, '8349.00'),
  );
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const data = await response.json();
  assert.equal(data.senuto.days_left, 12);
  assert.equal(data.serpdata.left, 8349);
});

test('handleUsage: POST odrzucony', async () => {
  const response = await handleUsage(new Request('https://dash.example/api/cw/usage', { method: 'POST' }), {}, NOW);
  assert.equal(response.status, 405);
});
