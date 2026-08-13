import assert from 'node:assert/strict';
import { test } from 'node:test';

import { getSenutoToken, jwtExpiry, saveSenutoToken } from './senuto-token.js';

const NOW = Date.UTC(2026, 7, 13, 12, 0, 0);

const token = (exp) => {
  const payload = Buffer.from(JSON.stringify({ id: 1, exp })).toString('base64url');
  return `head.${payload}.sig`;
};

const kv = (store = new Map()) => ({
  store,
  async get(key, { type } = {}) {
    const value = store.get(key);
    if (value === undefined) return null;
    return type === 'json' ? JSON.parse(value) : value;
  },
  async put(key, value) {
    store.set(key, value);
  },
});

test('jwtExpiry czyta exp, odrzuca nie-JWT', () => {
  const exp = Math.floor(NOW / 1000) + 3600;
  assert.equal(jwtExpiry(token(exp)).getTime(), exp * 1000);
  assert.equal(jwtExpiry('nie-token'), null);
  assert.equal(jwtExpiry(''), null);
});

test('getSenutoToken: KV wygrywa z sekretem Workera', async () => {
  const fresh = token(Math.floor(NOW / 1000) + 86_400);
  const env = { DASHBOARD_IMPORTS: kv(), SENUTO_API_KEY: 'sekret-workera' };
  await env.DASHBOARD_IMPORTS.put('senuto-token', JSON.stringify({ token: fresh }));
  assert.equal(await getSenutoToken(env), fresh);
});

test('getSenutoToken: pusty KV = fallback na sekret', async () => {
  assert.equal(await getSenutoToken({ DASHBOARD_IMPORTS: kv(), SENUTO_API_KEY: 'sekret' }), 'sekret');
  assert.equal(await getSenutoToken({ SENUTO_API_KEY: 'sekret' }), 'sekret');
  assert.equal(await getSenutoToken({}), '');
});

test('saveSenutoToken: zapis, otoczka Bearer/cudzysłowy zdejmowana', async () => {
  const exp = Math.floor(NOW / 1000) + 86_400 * 30;
  const env = { DASHBOARD_IMPORTS: kv() };
  const saved = await saveSenutoToken(env, `  Bearer "${token(exp)}" `, NOW);
  assert.equal(saved.ok, true);
  assert.equal(saved.record.expires_at, new Date(exp * 1000).toISOString());
  assert.equal(await getSenutoToken(env), token(exp));
});

test('saveSenutoToken: odrzuca śmieci i token po terminie', async () => {
  const env = { DASHBOARD_IMPORTS: kv() };
  assert.equal((await saveSenutoToken(env, '', NOW)).ok, false);
  assert.equal((await saveSenutoToken(env, 'abc.def', NOW)).ok, false);
  const stale = await saveSenutoToken(env, token(Math.floor(NOW / 1000) - 60), NOW);
  assert.equal(stale.ok, false);
  assert.match(stale.error, /wygasł/);
  assert.equal(env.DASHBOARD_IMPORTS.store.size, 0);
});

test('saveSenutoToken: brak bindingu KV = czytelny błąd', async () => {
  const result = await saveSenutoToken({}, token(Math.floor(NOW / 1000) + 60), NOW);
  assert.equal(result.ok, false);
  assert.match(result.error, /DASHBOARD_IMPORTS/);
});
