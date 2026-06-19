import { describe, it, expect } from 'vitest';
import {
  generateOtpCode, hashOtp, buildChallengeRecord,
  checkSendAllowed, verifyChallenge, consumeVerifiedChallenge,
  type ChallengeLead, type SendLimits,
} from './otp';

/** Fake KV: rozróżnia get('json') (obiekt) od get() (string); ma delete. */
function fakeKv(initial: Record<string, unknown> = {}) {
  const store = new Map<string, unknown>(Object.entries(initial));
  return {
    store,
    async get(key: string, type?: 'json') {
      if (!store.has(key)) return null;
      const v = store.get(key);
      return type === 'json' ? v : String(v);
    },
    async put(key: string, value: string) {
      store.set(key, JSON.parse(safe(value)));
    },
    async delete(key: string) {
      store.delete(key);
    },
  };
  function safe(s: string) {
    try { JSON.parse(s); return s; } catch { return JSON.stringify(s); }
  }
}

const NOW = new Date('2026-06-19T10:00:00Z');
const LIMITS: SendLimits = { hourlyPerPhone: 3, dailyPerIp: 10, dailyGlobal: 30, cooldownSec: 60 };
const LEAD: ChallengeLead = {
  firstName: 'Jan', lastName: 'Kowalski', email: 'jan@firma.pl',
  phone: '+48512345678', consent: true, tool: 'brand-check',
};

describe('generateOtpCode', () => {
  it('mapuje bajty na 6 cyfr (zero-pad)', () => {
    expect(generateOtpCode(new Uint8Array([0, 0, 0, 5]))).toBe('000005');
    expect(generateOtpCode(new Uint8Array([0, 1, 226, 64]))).toBe('123456');
  });
});

describe('hashOtp', () => {
  it('deterministyczny i zależny od soli', async () => {
    const a = await hashOtp('123456', 'sól');
    const b = await hashOtp('123456', 'sól');
    const c = await hashOtp('123456', 'inna');
    expect(a).toBe(b);
    expect(a).not.toBe(c);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('checkSendAllowed', () => {
  it('przepuszcza przy czystym KV i ustawia liczniki w commit', async () => {
    const kv = fakeKv();
    const gate = await checkSendAllowed(kv as any, '+48512345678', '1.2.3.4', NOW, LIMITS);
    expect(gate.allowed).toBe(true);
    await gate.commit();
    expect(kv.store.get('otp-cd:+48512345678')).toBeDefined();
    expect((kv.store.get('otp-h:+48512345678') as any).count).toBe(1);
    expect((kv.store.get('otp-ip:1.2.3.4') as any).count).toBe(1);
    expect((kv.store.get('otp-g:global') as any).count).toBe(1);
  });
  it('blokuje gdy aktywny cooldown', async () => {
    const kv = fakeKv({ 'otp-cd:+48512345678': '1' });
    const gate = await checkSendAllowed(kv as any, '+48512345678', '1.2.3.4', NOW, LIMITS);
    expect(gate.allowed).toBe(false);
    expect(gate.reason).toBe('cooldown');
  });
  it('blokuje po 3 SMS na numer/godz.', async () => {
    const kv = fakeKv({ 'otp-h:+48512345678': { count: 3, resetAt: NOW.getTime() + 1000_000 } });
    const gate = await checkSendAllowed(kv as any, '+48512345678', '1.2.3.4', NOW, LIMITS);
    expect(gate.allowed).toBe(false);
    expect(gate.reason).toBe('hourly');
  });
  it('blokuje po wyczerpaniu limitu IP', async () => {
    const kv = fakeKv({ 'otp-ip:1.2.3.4': { count: 10, resetAt: NOW.getTime() + 1000_000 } });
    const gate = await checkSendAllowed(kv as any, '+48512345678', '1.2.3.4', NOW, LIMITS);
    expect(gate.allowed).toBe(false);
    expect(gate.reason).toBe('ip');
  });
  it('blokuje po wyczerpaniu globalnego limitu dziennego', async () => {
    const kv = fakeKv({ 'otp-g:global': { count: 30, resetAt: NOW.getTime() + 1000_000 } });
    const gate = await checkSendAllowed(kv as any, '+48512345678', '1.2.3.4', NOW, LIMITS);
    expect(gate.allowed).toBe(false);
    expect(gate.reason).toBe('global');
  });
});

describe('verifyChallenge + consumeVerifiedChallenge', () => {
  async function seed(kv: ReturnType<typeof fakeKv>, code: string) {
    const hash = await hashOtp(code, 'sól');
    const rec = buildChallengeRecord({ phone: '+48512345678', hash, lead: LEAD, now: NOW.getTime(), ttlMs: 600_000 });
    kv.store.set('otp:abc', rec);
  }
  it('poprawny kod → verified, consume zwraca leada i kasuje wpis', async () => {
    const kv = fakeKv(); await seed(kv, '123456');
    const r = await verifyChallenge(kv as any, 'abc', '123456', 'sól', NOW);
    expect(r.ok).toBe(true);
    expect((kv.store.get('otp:abc') as any).verified).toBe(true);
    const c = await consumeVerifiedChallenge(kv as any, 'abc', NOW);
    expect(c.ok).toBe(true);
    expect(c.lead?.email).toBe('jan@firma.pl');
    expect(kv.store.has('otp:abc')).toBe(false);
  });
  it('zły kod inkrementuje attempts', async () => {
    const kv = fakeKv(); await seed(kv, '123456');
    const r = await verifyChallenge(kv as any, 'abc', '000000', 'sól', NOW);
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('bad-code');
    expect((kv.store.get('otp:abc') as any).attempts).toBe(1);
  });
  it('po 5 próbach unieważnia wpis', async () => {
    const kv = fakeKv(); await seed(kv, '123456');
    (kv.store.get('otp:abc') as any).attempts = 5;
    const r = await verifyChallenge(kv as any, 'abc', '123456', 'sól', NOW);
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('too-many-attempts');
    expect(kv.store.has('otp:abc')).toBe(false);
  });
  it('wygasły challenge → expired', async () => {
    const kv = fakeKv(); await seed(kv, '123456');
    const later = new Date(NOW.getTime() + 700_000);
    const r = await verifyChallenge(kv as any, 'abc', '123456', 'sól', later);
    expect(r.reason).toBe('expired');
  });
  it('consume bez weryfikacji zwraca ok:false', async () => {
    const kv = fakeKv(); await seed(kv, '123456');
    const c = await consumeVerifiedChallenge(kv as any, 'abc', NOW);
    expect(c.ok).toBe(false);
  });
});
