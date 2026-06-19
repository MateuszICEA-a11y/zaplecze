# Lead-gen widocznosc.ai: rozszerzenie pól + weryfikacja SMS (OTP) – Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Zbierać na obu formularzach lead-gen imię, nazwisko, e-mail i telefon, a wysyłkę audytu w narzędziach blokować za bramką kodu SMS (OTP), żeby odsiać przypadkowe numery.

**Architecture:** Czysta logika (walidacja telefonu, prymitywy OTP, limity, klient SMSAPI) ląduje w `functions/_lib/*.ts` pod testami vitest z fake KV; endpointy w `functions/api/**` pozostają cienką warstwą IO (parse → walidacja → KV → fetch). Stan OTP trzymamy w istniejącym bindingu KV `FANOUT_RL` pod nowymi prefiksami kluczy. SMSAPI tylko wysyła SMS – kod generujemy i weryfikujemy sami.

**Tech Stack:** Astro 6 + Cloudflare Pages Functions (TypeScript), vitest, Web Crypto (SHA-256), Cloudflare KV, SMSAPI.pl REST (`/sms.do`), Resend (istniejąca wysyłka maili).

## Global Constraints

- Katalog roboczy wszystkich ścieżek: `portals/widocznosc.ai/`.
- Wzorzec: czyste/IO-aware funkcje w `functions/_lib/`, testowane z fake KV; endpoint = cienka warstwa.
- Testy: vitest, pliki `*.test.ts` obok źródła, `environment: 'node'`. Uruchomienie pojedynczego pliku: `npm run test -- <ścieżka>`. Cały zestaw: `npm run test`.
- KV: jeden binding `FANOUT_RL`. Prefiksy OTP: `otp:<challengeId>` (challenge), `otp-cd:<e164>` (cooldown), `otp-h:<e164>` (godzinowy/numer), `otp-ip:<ip>` (dzienny/IP), `otp-g:global` (dzienny globalny).
- Parametry OTP: kod 6 cyfr; TTL challenge 10 min (600 000 ms); max 5 prób weryfikacji; cooldown 60 s; max 3 SMS/numer/h; IP 10/dzień; globalny 30/dzień (start, override z env).
- Sekrety (panel Cloudflare Pages → Variables and Secrets; lokalnie gitignored `.dev.vars`): `SMSAPI_TOKEN`, `SMSAPI_SENDER`, `OTP_SALT`. Opcjonalnie `SMSAPI_TEST=1` (SMSAPI nie wysyła realnie, nie zużywa kredytów).
- OTP wymuszane TYLKO w narzędziach. `/kontakt/`: telefon wymagany + walidacja formatu, BEZ OTP.
- Typografia: en-dash (–), nigdy em-dash. Marka: ICEA, widocznosc.ai. Komentarze i UI po polsku.
- `KVNamespace` jest typem globalnym (z `@cloudflare/workers-types`) – nie importować.

---

### Task 1: Walidacja i normalizacja telefonu PL (`phone.ts`)

**Files:**
- Create: `functions/_lib/phone.ts`
- Test: `functions/_lib/phone.test.ts`

**Interfaces:**
- Produces:
  - `type PhoneResult = { ok: boolean; e164?: string }`
  - `normalizePhonePL(raw: string): PhoneResult` – dowolny 9-cyfrowy numer PL (po zdjęciu `+48`/`48`/`0048` i separatorów), pierwsza cyfra 1–9; zwraca `+48XXXXXXXXX`.
  - `isMobilePL(e164: string): boolean` – czy numer krajowy zaczyna się cyfrą 4–8 (komórka, może odebrać SMS).

- [ ] **Step 1: Napisz failing test**

```ts
// functions/_lib/phone.test.ts
import { describe, it, expect } from 'vitest';
import { normalizePhonePL, isMobilePL } from './phone';

describe('normalizePhonePL', () => {
  it('normalizuje 9 cyfr ze spacjami do E.164', () => {
    expect(normalizePhonePL('512 345 678')).toEqual({ ok: true, e164: '+48512345678' });
  });
  it('akceptuje prefiksy +48 / 48 / 0048', () => {
    expect(normalizePhonePL('+48512345678').e164).toBe('+48512345678');
    expect(normalizePhonePL('48512345678').e164).toBe('+48512345678');
    expect(normalizePhonePL('0048512345678').e164).toBe('+48512345678');
  });
  it('usuwa myślniki i nawiasy', () => {
    expect(normalizePhonePL('(12) 345-67-89').e164).toBe('+48123456789');
  });
  it('odrzuca złą długość i śmieci', () => {
    expect(normalizePhonePL('12345678').ok).toBe(false); // 8 cyfr
    expect(normalizePhonePL('abc').ok).toBe(false);
    expect(normalizePhonePL('').ok).toBe(false);
  });
  it('odrzuca numer zaczynający się od 0', () => {
    expect(normalizePhonePL('012345678').ok).toBe(false);
  });
});

describe('isMobilePL', () => {
  it('rozpoznaje komórki (4-8)', () => {
    expect(isMobilePL('+48512345678')).toBe(true);
    expect(isMobilePL('+48887654321')).toBe(true);
  });
  it('odrzuca stacjonarne (1-3, 9)', () => {
    expect(isMobilePL('+48123456789')).toBe(false); // Kraków
    expect(isMobilePL('+48912345678')).toBe(false);
  });
});
```

- [ ] **Step 2: Uruchom test – ma FAIL**

Run: `npm run test -- functions/_lib/phone.test.ts`
Expected: FAIL („Failed to resolve import './phone'").

- [ ] **Step 3: Implementacja**

```ts
// functions/_lib/phone.ts
/** Walidacja i normalizacja polskich numerów telefonu do formatu E.164 (+48XXXXXXXXX). */

export type PhoneResult = { ok: boolean; e164?: string };

/**
 * Sprowadza polski numer do E.164. Akceptuje separatory (spacje, myślniki, nawiasy)
 * oraz prefiksy +48 / 48 / 0048. Wymaga dokładnie 9 cyfr krajowych, pierwsza ≠ 0.
 */
export function normalizePhonePL(raw: string): PhoneResult {
  const digits = String(raw ?? '')
    .replace(/[\s\-()./]/g, '')
    .replace(/^\+/, '');

  let local: string;
  if (/^0048\d{9}$/.test(digits)) local = digits.slice(4);
  else if (/^48\d{9}$/.test(digits)) local = digits.slice(2);
  else if (/^\d{9}$/.test(digits)) local = digits;
  else return { ok: false };

  if (/^0/.test(local)) return { ok: false };
  return { ok: true, e164: `+48${local}` };
}

/** Czy E.164 (+48…) to numer komórkowy PL (pierwsza cyfra krajowa 4–8). */
export function isMobilePL(e164: string): boolean {
  const m = /^\+48(\d)\d{8}$/.exec(String(e164 ?? ''));
  if (!m) return false;
  const first = Number(m[1]);
  return first >= 4 && first <= 8;
}
```

- [ ] **Step 4: Uruchom test – ma PASS**

Run: `npm run test -- functions/_lib/phone.test.ts`
Expected: PASS (wszystkie przypadki).

- [ ] **Step 5: Commit**

```bash
git add functions/_lib/phone.ts functions/_lib/phone.test.ts
git commit -m "feat(widocznosc): walidacja i normalizacja telefonu PL -> E.164"
```

---

### Task 2: Prymitywy OTP + limity wysyłki (`otp.ts`)

**Files:**
- Create: `functions/_lib/otp.ts`
- Test: `functions/_lib/otp.test.ts`

**Interfaces:**
- Consumes: `evaluateLimit`, `secondsUntilWarsawMidnight` z `./rate-limit`.
- Produces:
  - `generateOtpCode(bytes: Uint8Array): string` – 6-cyfrowy kod (zero-pad) z losowych bajtów.
  - `hashOtp(code: string, salt: string): Promise<string>` – SHA-256 hex.
  - `type ChallengeLead = { firstName: string; lastName: string; email: string; phone: string; consent: boolean; tool: string }`
  - `type ChallengeRecord = { phone: string; hash: string; attempts: number; verified: boolean; createdAt: number; expiresAt: number; lead: ChallengeLead }`
  - `buildChallengeRecord(p: { phone: string; hash: string; lead: ChallengeLead; now: number; ttlMs: number }): ChallengeRecord`
  - `type SendLimits = { hourlyPerPhone: number; dailyPerIp: number; dailyGlobal: number; cooldownSec: number }`
  - `checkSendAllowed(kv: KVNamespace | undefined, phone: string, ip: string, now: Date, limits: SendLimits): Promise<{ allowed: boolean; reason?: string; commit: () => Promise<void> }>`
  - `type VerifyResult = { ok: boolean; reason?: 'not-found' | 'expired' | 'too-many-attempts' | 'bad-code' }`
  - `verifyChallenge(kv: KVNamespace, challengeId: string, inputCode: string, salt: string, now: Date): Promise<VerifyResult>`
  - `consumeVerifiedChallenge(kv: KVNamespace, challengeId: string, now: Date): Promise<{ ok: boolean; lead?: ChallengeLead }>`
  - `MAX_ATTEMPTS = 5`

- [ ] **Step 1: Napisz failing test**

```ts
// functions/_lib/otp.test.ts
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
```

- [ ] **Step 2: Uruchom test – ma FAIL**

Run: `npm run test -- functions/_lib/otp.test.ts`
Expected: FAIL („Failed to resolve import './otp'").

- [ ] **Step 3: Implementacja**

```ts
// functions/_lib/otp.ts
/**
 * Prymitywy OTP (generacja/hash kodu) + logika challenge w KV + limity wysyłki SMS.
 * Funkcje IO-aware przyjmują KVNamespace, więc są testowalne z fake KV (jak tool-rate-limit).
 */
import { secondsUntilWarsawMidnight } from './rate-limit';

export const MAX_ATTEMPTS = 5;

export type ChallengeLead = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  consent: boolean;
  tool: string;
};

export type ChallengeRecord = {
  phone: string;
  hash: string;
  attempts: number;
  verified: boolean;
  createdAt: number;
  expiresAt: number;
  lead: ChallengeLead;
};

type LimitRecord = { count: number; resetAt: number };

/** 6-cyfrowy kod z losowych bajtów (≥4 bajty); deterministyczny względem wejścia. */
export function generateOtpCode(bytes: Uint8Array): string {
  let n = 0;
  for (const b of bytes) n = (n * 256 + b) >>> 0;
  return String(n % 1_000_000).padStart(6, '0');
}

/** SHA-256(code + salt) jako hex – kod nigdy nie ląduje w KV w plaintext. */
export async function hashOtp(code: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${code}:${salt}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function buildChallengeRecord(p: {
  phone: string;
  hash: string;
  lead: ChallengeLead;
  now: number;
  ttlMs: number;
}): ChallengeRecord {
  return {
    phone: p.phone,
    hash: p.hash,
    attempts: 0,
    verified: false,
    createdAt: p.now,
    expiresAt: p.now + p.ttlMs,
    lead: p.lead,
  };
}

export type SendLimits = {
  hourlyPerPhone: number;
  dailyPerIp: number;
  dailyGlobal: number;
  cooldownSec: number;
};

function ttlSeconds(targetMs: number, now: Date): number {
  return Math.max(60, Math.ceil((targetMs - now.getTime()) / 1000));
}

/** Decyzja PRZED wysłaniem SMS-a + commit liczników PO sukcesie. */
export async function checkSendAllowed(
  kv: KVNamespace | undefined,
  phone: string,
  ip: string,
  now: Date,
  limits: SendLimits,
): Promise<{ allowed: boolean; reason?: string; commit: () => Promise<void> }> {
  const noop = async () => {};
  if (!kv) return { allowed: true, commit: noop };

  if (await kv.get(`otp-cd:${phone}`)) return { allowed: false, reason: 'cooldown', commit: noop };

  const hRec = await kv.get<LimitRecord>(`otp-h:${phone}`, 'json');
  if ((hRec?.count ?? 0) >= limits.hourlyPerPhone) return { allowed: false, reason: 'hourly', commit: noop };

  const ipRec = await kv.get<LimitRecord>(`otp-ip:${ip}`, 'json');
  if ((ipRec?.count ?? 0) >= limits.dailyPerIp) return { allowed: false, reason: 'ip', commit: noop };

  const gRec = await kv.get<LimitRecord>('otp-g:global', 'json');
  if ((gRec?.count ?? 0) >= limits.dailyGlobal) return { allowed: false, reason: 'global', commit: noop };

  const commit = async () => {
    const dayMs = now.getTime() + secondsUntilWarsawMidnight(now) * 1000;
    await kv.put(`otp-cd:${phone}`, '1', { expirationTtl: limits.cooldownSec });

    const hResetAt = hRec?.resetAt && hRec.resetAt > now.getTime() ? hRec.resetAt : now.getTime() + 3_600_000;
    await kv.put(`otp-h:${phone}`, JSON.stringify({ count: (hRec?.count ?? 0) + 1, resetAt: hResetAt }), {
      expirationTtl: ttlSeconds(hResetAt, now),
    });

    const ipResetAt = ipRec?.resetAt ?? dayMs;
    await kv.put(`otp-ip:${ip}`, JSON.stringify({ count: (ipRec?.count ?? 0) + 1, resetAt: ipResetAt }), {
      expirationTtl: ttlSeconds(ipResetAt, now),
    });

    const gResetAt = gRec?.resetAt ?? dayMs;
    await kv.put('otp-g:global', JSON.stringify({ count: (gRec?.count ?? 0) + 1, resetAt: gResetAt }), {
      expirationTtl: ttlSeconds(gResetAt, now),
    });
  };

  return { allowed: true, commit };
}

export type VerifyResult = {
  ok: boolean;
  reason?: 'not-found' | 'expired' | 'too-many-attempts' | 'bad-code';
};

export async function verifyChallenge(
  kv: KVNamespace,
  challengeId: string,
  inputCode: string,
  salt: string,
  now: Date,
): Promise<VerifyResult> {
  const key = `otp:${challengeId}`;
  const rec = await kv.get<ChallengeRecord>(key, 'json');
  if (!rec) return { ok: false, reason: 'not-found' };
  if (now.getTime() > rec.expiresAt) {
    await kv.delete(key);
    return { ok: false, reason: 'expired' };
  }
  if (rec.attempts >= MAX_ATTEMPTS) {
    await kv.delete(key);
    return { ok: false, reason: 'too-many-attempts' };
  }
  const ttl = ttlSeconds(rec.expiresAt, now);
  const inputHash = await hashOtp(inputCode, salt);
  if (inputHash !== rec.hash) {
    await kv.put(key, JSON.stringify({ ...rec, attempts: rec.attempts + 1 }), { expirationTtl: ttl });
    return { ok: false, reason: 'bad-code' };
  }
  await kv.put(key, JSON.stringify({ ...rec, verified: true }), { expirationTtl: ttl });
  return { ok: true };
}

/** Dla send-report: wymaga zweryfikowanego, niewygasłego challenge; zużywa go (delete). */
export async function consumeVerifiedChallenge(
  kv: KVNamespace,
  challengeId: string,
  now: Date,
): Promise<{ ok: boolean; lead?: ChallengeLead }> {
  const key = `otp:${challengeId}`;
  const rec = await kv.get<ChallengeRecord>(key, 'json');
  if (!rec || !rec.verified || now.getTime() > rec.expiresAt) return { ok: false };
  await kv.delete(key);
  return { ok: true, lead: rec.lead };
}
```

- [ ] **Step 4: Uruchom test – ma PASS**

Run: `npm run test -- functions/_lib/otp.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add functions/_lib/otp.ts functions/_lib/otp.test.ts
git commit -m "feat(widocznosc): prymitywy OTP + challenge w KV + limity wysylki SMS"
```

---

### Task 3: Klient SMSAPI (`smsapi.ts`)

**Files:**
- Create: `functions/_lib/smsapi.ts`
- Test: `functions/_lib/smsapi.test.ts`

**Interfaces:**
- Produces:
  - `type SmsSendInput = { token: string; from: string; to: string; message: string; test?: boolean }`
  - `buildSmsRequest(input: SmsSendInput): { url: string; init: RequestInit }`
  - `parseSmsResponse(json: unknown): { ok: boolean; id?: string; error?: string }`
  - `sendSms(input: SmsSendInput, fetchImpl?: typeof fetch): Promise<{ ok: boolean; id?: string; error?: string }>`

- [ ] **Step 1: Napisz failing test**

```ts
// functions/_lib/smsapi.test.ts
import { describe, it, expect } from 'vitest';
import { buildSmsRequest, parseSmsResponse, sendSms } from './smsapi';

describe('buildSmsRequest', () => {
  it('buduje POST x-www-form-urlencoded z Bearer i polami SMSAPI', () => {
    const { url, init } = buildSmsRequest({ token: 'TKN', from: 'ICEA', to: '+48512345678', message: 'Kod: 123456' });
    expect(url).toBe('https://api.smsapi.pl/sms.do');
    expect(init.method).toBe('POST');
    expect((init.headers as any).Authorization).toBe('Bearer TKN');
    expect((init.headers as any)['Content-Type']).toBe('application/x-www-form-urlencoded');
    const body = String(init.body);
    expect(body).toContain('to=%2B48512345678');
    expect(body).toContain('from=ICEA');
    expect(body).toContain('format=json');
    expect(body).toContain('encoding=utf-8');
    expect(body).not.toContain('test=1');
  });
  it('dodaje test=1 gdy test', () => {
    const { init } = buildSmsRequest({ token: 'T', from: 'ICEA', to: '+48512345678', message: 'x', test: true });
    expect(String(init.body)).toContain('test=1');
  });
});

describe('parseSmsResponse', () => {
  it('sukces gdy jest niepusta lista', () => {
    expect(parseSmsResponse({ count: 1, list: [{ id: 'm1' }] })).toEqual({ ok: true, id: 'm1' });
  });
  it('błąd gdy pole error', () => {
    expect(parseSmsResponse({ error: 13, message: 'Brak srodkow' }).ok).toBe(false);
  });
  it('błąd gdy pusta lista lub śmieci', () => {
    expect(parseSmsResponse({ list: [] }).ok).toBe(false);
    expect(parseSmsResponse(null).ok).toBe(false);
  });
});

describe('sendSms', () => {
  it('zwraca ok przy 200 + lista', async () => {
    const fake = async () => new Response(JSON.stringify({ list: [{ id: 'm9' }] }), { status: 200 });
    const r = await sendSms({ token: 'T', from: 'ICEA', to: '+48512345678', message: 'x' }, fake as any);
    expect(r).toEqual({ ok: true, id: 'm9' });
  });
  it('zwraca błąd http przy != 2xx', async () => {
    const fake = async () => new Response('nope', { status: 401 });
    const r = await sendSms({ token: 'T', from: 'ICEA', to: '+48512345678', message: 'x' }, fake as any);
    expect(r.ok).toBe(false);
    expect(r.error).toBe('http-401');
  });
  it('łapie wyjątek sieci', async () => {
    const fake = async () => { throw new Error('boom'); };
    const r = await sendSms({ token: 'T', from: 'ICEA', to: '+48512345678', message: 'x' }, fake as any);
    expect(r).toEqual({ ok: false, error: 'network' });
  });
});
```

- [ ] **Step 2: Uruchom test – ma FAIL**

Run: `npm run test -- functions/_lib/smsapi.test.ts`
Expected: FAIL („Failed to resolve import './smsapi'").

- [ ] **Step 3: Implementacja**

```ts
// functions/_lib/smsapi.ts
/** Cienki klient SMSAPI.pl (REST /sms.do). Jedyna warstwa IO do dostawcy SMS. */

export type SmsSendInput = {
  token: string;
  from: string;
  to: string; // E.164, np. +48512345678
  message: string;
  test?: boolean;
};

export function buildSmsRequest(input: SmsSendInput): { url: string; init: RequestInit } {
  const params = new URLSearchParams({
    to: input.to,
    from: input.from,
    message: input.message,
    format: 'json',
    encoding: 'utf-8',
  });
  if (input.test) params.set('test', '1');
  return {
    url: 'https://api.smsapi.pl/sms.do',
    init: {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${input.token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    },
  };
}

export function parseSmsResponse(json: unknown): { ok: boolean; id?: string; error?: string } {
  if (!json || typeof json !== 'object') return { ok: false, error: 'invalid-response' };
  const o = json as Record<string, unknown>;
  if ('error' in o) return { ok: false, error: String(o.message ?? o.error) };
  const list = o.list as Array<{ id?: string }> | undefined;
  if (Array.isArray(list) && list.length > 0) return { ok: true, id: String(list[0]?.id ?? '') };
  return { ok: false, error: 'no-message-sent' };
}

export async function sendSms(
  input: SmsSendInput,
  fetchImpl: typeof fetch = fetch,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const { url, init } = buildSmsRequest(input);
  try {
    const res = await fetchImpl(url, init);
    if (!res.ok) return { ok: false, error: `http-${res.status}` };
    const json = await res.json().catch(() => null);
    return parseSmsResponse(json);
  } catch {
    return { ok: false, error: 'network' };
  }
}
```

- [ ] **Step 4: Uruchom test – ma PASS**

Run: `npm run test -- functions/_lib/smsapi.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add functions/_lib/smsapi.ts functions/_lib/smsapi.test.ts
git commit -m "feat(widocznosc): klient SMSAPI.pl (wysylka SMS)"
```

---

### Task 4: Rozszerzenie payloadu i maila leadowego raportu (`send-report.ts`)

**Files:**
- Modify: `functions/_lib/send-report.ts`
- Test: `functions/_lib/send-report.test.ts` (dopisać przypadki)

**Interfaces:**
- Consumes: `validatePhonePL` z Task 1 nie jest tu potrzebne (telefon już zweryfikowany OTP-em); pola leada trafiają z challenge.
- Produces (zmiana kształtu `ReportPayload`):
  - `ReportPayload` zyskuje: `firstName?: string; lastName?: string; phone?: string; challengeId?: string`
  - `validateReportPayload` wymaga dodatkowo `firstName`, `lastName`, `challengeId` (telefon waliduje się na etapie send-code; tu sprawdzamy obecność).
  - `buildLeadNotification` pokazuje imię, nazwisko, telefon i „Numer zweryfikowany SMS: TAK".

- [ ] **Step 1: Dopisz failing testy**

Najpierw zobacz istniejący `functions/_lib/send-report.test.ts`, potem dopisz na końcu pliku (wewnątrz istniejących `describe` lub nowe):

```ts
// dopisać do functions/_lib/send-report.test.ts
import { validateReportPayload, buildLeadNotification } from './send-report';

describe('validateReportPayload – rozszerzone pola', () => {
  const base = {
    tool: 'brand-check', email: 'jan@firma.pl', result: { x: 1 },
    firstName: 'Jan', lastName: 'Kowalski', phone: '+48512345678', challengeId: 'abc',
  };
  it('przechodzi z kompletem pól', () => {
    expect(validateReportPayload(base as any).ok).toBe(true);
  });
  it('wymaga firstName', () => {
    expect(validateReportPayload({ ...base, firstName: '' } as any).errors).toContain('firstName');
  });
  it('wymaga lastName', () => {
    expect(validateReportPayload({ ...base, lastName: '' } as any).errors).toContain('lastName');
  });
  it('wymaga challengeId', () => {
    expect(validateReportPayload({ ...base, challengeId: '' } as any).errors).toContain('challengeId');
  });
});

describe('buildLeadNotification – dane zweryfikowanego leada', () => {
  it('zawiera imię, nazwisko, telefon i flagę weryfikacji SMS', () => {
    const mail = buildLeadNotification(
      { tool: 'brand-check', email: 'jan@firma.pl', firstName: 'Jan', lastName: 'Kowalski',
        phone: '+48512345678', consent: true, query: 'Marka X' } as any,
      { from: 'f@widocznosc.ai', leadTo: 'lead.icea@gmail.com' },
    );
    expect(mail.text).toContain('Jan Kowalski');
    expect(mail.text).toContain('+48512345678');
    expect(mail.text).toContain('Numer zweryfikowany SMS: TAK');
  });
});
```

- [ ] **Step 2: Uruchom test – ma FAIL**

Run: `npm run test -- functions/_lib/send-report.test.ts`
Expected: FAIL (brakuje pól w typie / errors nie zawiera `firstName` itd.).

- [ ] **Step 3: Implementacja – zmień typ i walidację**

W `functions/_lib/send-report.ts` zamień blok typu i walidacji:

```ts
export type ReportPayload = {
  tool?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  challengeId?: string;
  consent?: boolean;
  query?: string;
  result?: unknown;
  website?: string; // honeypot
};
```

```ts
export function validateReportPayload(p: ReportPayload): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!isTool(p.tool)) errors.push('tool');
  const email = String(p.email ?? '').trim();
  if (email.length < 1 || email.length > 254 || !EMAIL_RE.test(email)) errors.push('email');
  if (String(p.firstName ?? '').trim().length < 1) errors.push('firstName');
  if (String(p.lastName ?? '').trim().length < 1) errors.push('lastName');
  if (String(p.challengeId ?? '').trim().length < 1) errors.push('challengeId');
  if (p.result === null || typeof p.result !== 'object') errors.push('result');
  else if (JSON.stringify(p.result).length > MAX_PAYLOAD_BYTES) errors.push('size');
  return { ok: errors.length === 0, errors };
}
```

- [ ] **Step 4: Implementacja – zmień `buildLeadNotification`**

Zamień ciało wierszy i tekstu (sekcja `rows` + subject) tak, by zawierało nowe dane:

```ts
export function buildLeadNotification(p: ReportPayload, cfg: EmailConfig): ResendEmail {
  const tool = p.tool as Tool;
  const email = String(p.email ?? '').trim();
  const fullName = `${String(p.firstName ?? '').trim()} ${String(p.lastName ?? '').trim()}`.trim() || '—';
  const phone = String(p.phone ?? '').trim() || '—';
  const query = String(p.query ?? '').trim() || '—';
  const consentYes = p.consent === true;
  const consent = consentYes ? 'TAK' : 'NIE';

  const rows: Array<[string, string]> = [
    ['Narzędzie', toolLabel(tool)],
    ['Imię i nazwisko', fullName],
    ['E-mail', email],
    ['Telefon', phone],
    ['Numer zweryfikowany SMS', 'TAK'],
    ['Zapytanie', query],
    ['Zgoda na kontakt', consent],
  ];
  const rowsHtml = rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:10px 0;border-top:1px solid ${C.line};">` +
        `<div style="font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:${C.inkMuted};">${escapeHtml(k)}</div>` +
        `<div style="font-size:15px;color:${C.ink};">${escapeHtml(v)}</div></td></tr>`,
    )
    .join('');

  const badgeColor = consentYes ? '#0a7d33' : C.inkMuted;
  const body =
    `<tr><td style="padding:32px 32px 4px;">` +
    `<span style="display:inline-block;background:${C.accentSoft};color:${badgeColor};font-size:12px;font-weight:700;padding:5px 12px;border-radius:999px;">Zgoda na kontakt: ${consent}</span>` +
    `<h1 style="margin:14px 0 0;font-size:22px;color:${C.ink};">Lead z narzędzia: ${escapeHtml(toolLabel(tool))}</h1></td></tr>` +
    `<tr><td style="padding:8px 32px 24px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rowsHtml}</table>` +
    `<a href="mailto:${escapeHtml(email)}" style="display:inline-block;margin-top:16px;background:${C.accentDark};color:#fff;font-size:15px;font-weight:600;text-decoration:none;padding:12px 24px;border-radius:8px;">Napisz do leada</a></td></tr>`;

  return {
    from: cfg.from,
    to: [cfg.leadTo],
    reply_to: email,
    subject: `[widocznosc.ai] Lead (zweryfikowany SMS) z ${tool}: ${fullName}`,
    text: rows.map(([k, v]) => `${k}: ${v}`).join('\n'),
    html: emailShell(body, `Lead z ${toolLabel(tool)} – numer zweryfikowany SMS`),
  };
}
```

- [ ] **Step 5: Uruchom testy – mają PASS**

Run: `npm run test -- functions/_lib/send-report.test.ts`
Expected: PASS (stare + nowe przypadki).

- [ ] **Step 6: Commit**

```bash
git add functions/_lib/send-report.ts functions/_lib/send-report.test.ts
git commit -m "feat(widocznosc): raport leadowy z imieniem/telefonem + flaga weryfikacji SMS"
```

---

### Task 5: Imię/nazwisko/telefon w formularzu kontaktowym (`contact.ts`)

**Files:**
- Modify: `functions/_lib/contact.ts`
- Test: `functions/_lib/contact.test.ts` (zaktualizować)

**Interfaces:**
- Consumes: `normalizePhonePL` z `./phone` (Task 1).
- Produces (zmiana `ContactPayload`):
  - `name?` zastąpione przez `firstName?: string; lastName?: string`; dochodzi `phone?: string`.
  - `validate` wymaga `firstName`, `lastName`, `phone` (poprawny PL); `buildEmails` używa pełnego imienia + pokazuje telefon, autoresponder wita po imieniu.

- [ ] **Step 1: Zaktualizuj testy**

Otwórz `functions/_lib/contact.test.ts`. Zamień przypadki używające `name` na `firstName`/`lastName` i dodaj walidację telefonu. Przykładowe nowe/zmienione asercje:

```ts
// w functions/_lib/contact.test.ts – payload bazowy do walidacji:
const valid = {
  firstName: 'Jan', lastName: 'Kowalski', email: 'jan@firma.pl',
  phone: '512 345 678', type: 'audyt-ai', message: 'Dzień dobry',
};

it('przechodzi z kompletem pól', () => {
  expect(validate(valid as any).ok).toBe(true);
});
it('wymaga firstName i lastName', () => {
  expect(validate({ ...valid, firstName: '' } as any).errors).toContain('firstName');
  expect(validate({ ...valid, lastName: '' } as any).errors).toContain('lastName');
});
it('wymaga poprawnego telefonu PL', () => {
  expect(validate({ ...valid, phone: '12345' } as any).errors).toContain('phone');
});
it('buildEmails: pełne imię w temacie + telefon i powitanie po imieniu', () => {
  const { internal, autoresponder } = buildEmails(valid as any, { from: 'f@x', leadTo: 'l@x' });
  expect(internal.subject).toContain('Jan Kowalski');
  expect(internal.text).toContain('+48512345678');
  expect(autoresponder.text).toContain('Cześć Jan');
});
```

(Usuń/zmień stare asercje opierające się na polu `name`.)

- [ ] **Step 2: Uruchom test – ma FAIL**

Run: `npm run test -- functions/_lib/contact.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementacja – typ, limity, walidacja**

W `functions/_lib/contact.ts`:

```ts
import { escapeHtml, emailShell, C } from './email-shell';
import { normalizePhonePL } from './phone';

export type ContactPayload = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  type?: string;
  message?: string;
  website?: string; // honeypot
};
```

Zamień `LIMITS` i `validate`:

```ts
const LIMITS = { name: 80, email: 254, company: 160, message: 5000 };
```

```ts
export function validate(p: ContactPayload): ValidationResult {
  const errors: string[] = [];
  const firstName = String(p.firstName ?? '').trim();
  const lastName = String(p.lastName ?? '').trim();
  const email = String(p.email ?? '').trim();
  const phone = String(p.phone ?? '').trim();
  const company = String(p.company ?? '').trim();
  const type = String(p.type ?? '').trim();
  const message = String(p.message ?? '').trim();

  if (firstName.length < 1 || firstName.length > LIMITS.name) errors.push('firstName');
  if (lastName.length < 1 || lastName.length > LIMITS.name) errors.push('lastName');
  if (email.length < 1 || email.length > LIMITS.email || !EMAIL_RE.test(email)) errors.push('email');
  if (!normalizePhonePL(phone).ok) errors.push('phone');
  if (!CONTACT_TYPES.includes(type as (typeof CONTACT_TYPES)[number])) errors.push('type');
  if (message.length < 1 || message.length > LIMITS.message) errors.push('message');
  if (company.length > LIMITS.company) errors.push('company');

  return { ok: errors.length === 0, errors };
}
```

- [ ] **Step 4: Implementacja – maile**

Zamień `fieldRows` oraz fragmenty `buildEmails` posługujące się `name`:

```ts
function fieldRows(p: ContactPayload): Array<[string, string]> {
  const fullName = `${String(p.firstName ?? '').trim()} ${String(p.lastName ?? '').trim()}`.trim();
  const phone = normalizePhonePL(String(p.phone ?? '').trim());
  return [
    ['Imię i nazwisko', fullName],
    ['E-mail', String(p.email ?? '').trim()],
    ['Telefon', phone.e164 ?? String(p.phone ?? '').trim()],
    ['Firma', String(p.company ?? '').trim() || '—'],
    ['Cel kontaktu', typeLabel(String(p.type ?? '').trim())],
    ['Wiadomość', String(p.message ?? '').trim()],
  ];
}
```

W `buildEmails` zamień linię ustalającą `name`:

```ts
  const firstName = String(p.firstName ?? '').trim();
  const fullName = `${firstName} ${String(p.lastName ?? '').trim()}`.trim();
  const email = String(p.email ?? '').trim();
  const label = typeLabel(String(p.type ?? '').trim());
  const rows = fieldRows(p);
```

Następnie w treści maila wewnętrznego użyj `fullName` zamiast `name` (subject + nagłówek), a w autoresponderze użyj `firstName` w powitaniu („Cześć ${firstName},"). Konkretnie podmień wystąpienia zmiennej `name` na: `fullName` w `subject`/`emailShell` mejla wewnętrznego oraz na `firstName` w `autoText`/`autoBody` powitaniu.

- [ ] **Step 5: Uruchom testy – mają PASS**

Run: `npm run test -- functions/_lib/contact.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add functions/_lib/contact.ts functions/_lib/contact.test.ts
git commit -m "feat(widocznosc): kontakt zbiera imie/nazwisko/telefon (walidacja PL)"
```

---

### Task 6: Endpoint `POST /api/sms/send-code`

**Files:**
- Create: `functions/api/sms/send-code.ts`

**Interfaces:**
- Consumes: `normalizePhonePL`, `isMobilePL` (Task 1); `generateOtpCode`, `hashOtp`, `buildChallengeRecord`, `checkSendAllowed`, `type ChallengeLead`, `type SendLimits` (Task 2); `sendSms` (Task 3); `resolveLimit` (`./_lib/tool-rate-limit`).
- Produces: endpoint zwracający `{ ok: true, challengeId }` lub błąd JSON.

- [ ] **Step 1: Utwórz endpoint**

```ts
// functions/api/sms/send-code.ts
/**
 * Wysyła 6-cyfrowy kod SMS i zakłada challenge w KV. Bramka jakości leada dla narzędzi.
 *
 * Endpoint: POST /api/sms/send-code
 * Body: { tool, firstName, lastName, email, phone, consent?, website? }  (website = honeypot)
 * Zwraca: { ok:true, challengeId } | { error, fields? }
 * Wymaga env: SMSAPI_TOKEN, SMSAPI_SENDER, OTP_SALT; reużywa KV FANOUT_RL (prefiksy otp*).
 */
import { normalizePhonePL, isMobilePL } from '../../_lib/phone';
import {
  generateOtpCode, hashOtp, buildChallengeRecord, checkSendAllowed,
  type ChallengeLead, type SendLimits,
} from '../../_lib/otp';
import { sendSms } from '../../_lib/smsapi';
import { resolveLimit } from '../../_lib/tool-rate-limit';

type Env = {
  SMSAPI_TOKEN?: string;
  SMSAPI_SENDER?: string;
  SMSAPI_TEST?: string;
  OTP_SALT?: string;
  SMS_HOURLY_PER_PHONE?: string;
  SMS_SENDCODE_IP_LIMIT?: string;
  SMS_DAILY_GLOBAL_LIMIT?: string;
  FANOUT_RL?: KVNamespace;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CHALLENGE_TTL_MS = 600_000; // 10 min

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}
function jsonError(status: number, message: string, extra: Record<string, unknown> = {}): Response {
  return json({ error: message, ...extra }, status);
}

export const onRequestGet: PagesFunction = async () =>
  new Response(JSON.stringify({ error: 'Użyj POST z danymi leada.' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json; charset=utf-8', Allow: 'POST' },
  });

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, 'Nieprawidłowe body JSON.');
  }

  // Honeypot – bot dostaje fałszywy sukces.
  if (String(body.website ?? '').trim().length > 0) return json({ ok: true, challengeId: 'noop' });

  // Walidacja pól leada.
  const firstName = String(body.firstName ?? '').trim();
  const lastName = String(body.lastName ?? '').trim();
  const email = String(body.email ?? '').trim();
  const phoneRaw = String(body.phone ?? '').trim();
  const tool = String(body.tool ?? '').trim();
  const errors: string[] = [];
  if (firstName.length < 1 || firstName.length > 80) errors.push('firstName');
  if (lastName.length < 1 || lastName.length > 80) errors.push('lastName');
  if (email.length < 1 || email.length > 254 || !EMAIL_RE.test(email)) errors.push('email');
  const norm = normalizePhonePL(phoneRaw);
  if (!norm.ok) errors.push('phone');
  else if (!isMobilePL(norm.e164!)) errors.push('phone-mobile');
  if (errors.length) return jsonError(400, 'Uzupełnij poprawnie dane.', { fields: errors });
  const phone = norm.e164!;

  // Konfiguracja.
  const token = (env.SMSAPI_TOKEN || '').trim();
  const sender = (env.SMSAPI_SENDER || '').trim();
  const salt = (env.OTP_SALT || '').trim();
  if (!token || !sender || !salt) {
    return json({ status: 'config-error', error: 'Weryfikacja SMS chwilowo niedostępna.' }, 500);
  }

  // Limity wysyłki (anty-abuse + kill-switch kosztowy).
  const limits: SendLimits = {
    hourlyPerPhone: resolveLimit(env.SMS_HOURLY_PER_PHONE, 3),
    dailyPerIp: resolveLimit(env.SMS_SENDCODE_IP_LIMIT, 10),
    dailyGlobal: resolveLimit(env.SMS_DAILY_GLOBAL_LIMIT, 30),
    cooldownSec: 60,
  };
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const now = new Date();
  const gate = await checkSendAllowed(env.FANOUT_RL, phone, ip, now, limits);
  if (!gate.allowed) {
    const msg =
      gate.reason === 'cooldown'
        ? 'Kod został już wysłany. Odczekaj chwilę przed kolejną próbą.'
        : 'Przekroczono limit wysyłek kodu. Spróbuj później lub napisz na biuro@grupa-icea.pl.';
    return jsonError(429, msg, { reason: gate.reason });
  }

  // Generacja + wysyłka.
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  const code = generateOtpCode(bytes);
  const message = `widocznosc.ai – Twój kod weryfikacyjny: ${code}. Ważny 10 minut.`;
  const sent = await sendSms({ token, from: sender, to: phone, message, test: env.SMSAPI_TEST === '1' });
  if (!sent.ok) {
    return jsonError(502, 'Nie udało się wysłać SMS-a. Sprawdź numer i spróbuj ponownie.');
  }

  // Challenge w KV.
  const challengeId = crypto.randomUUID();
  const hash = await hashOtp(code, salt);
  const lead: ChallengeLead = { firstName, lastName, email, phone, consent: body.consent === true, tool };
  const record = buildChallengeRecord({ phone, hash, lead, now: now.getTime(), ttlMs: CHALLENGE_TTL_MS });
  if (env.FANOUT_RL) {
    await env.FANOUT_RL.put(`otp:${challengeId}`, JSON.stringify(record), {
      expirationTtl: Math.ceil(CHALLENGE_TTL_MS / 1000),
    });
  }
  await gate.commit();

  return json({ ok: true, challengeId });
};
```

- [ ] **Step 2: Lint (weryfikacja typów/składni)**

Run: `npm run lint -- functions/api/sms/send-code.ts`
Expected: brak błędów dla nowego pliku.

- [ ] **Step 3: Commit**

```bash
git add functions/api/sms/send-code.ts
git commit -m "feat(widocznosc): endpoint /api/sms/send-code (wysylka kodu OTP)"
```

---

### Task 7: Endpoint `POST /api/sms/verify-code`

**Files:**
- Create: `functions/api/sms/verify-code.ts`

**Interfaces:**
- Consumes: `verifyChallenge` (Task 2).
- Produces: endpoint `{ ok: true }` lub błąd z `reason`.

- [ ] **Step 1: Utwórz endpoint**

```ts
// functions/api/sms/verify-code.ts
/**
 * Weryfikuje kod SMS względem challenge w KV i oznacza go jako potwierdzony.
 *
 * Endpoint: POST /api/sms/verify-code
 * Body: { challengeId, code }
 * Zwraca: { ok:true } | { error, reason }
 * Wymaga env: OTP_SALT; reużywa KV FANOUT_RL (klucz otp:<challengeId>).
 */
import { verifyChallenge } from '../../_lib/otp';

type Env = { OTP_SALT?: string; FANOUT_RL?: KVNamespace };

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

export const onRequestGet: PagesFunction = async () =>
  new Response(JSON.stringify({ error: 'Użyj POST z { challengeId, code }.' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json; charset=utf-8', Allow: 'POST' },
  });

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  let body: { challengeId?: string; code?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Nieprawidłowe body JSON.' }, 400);
  }

  const challengeId = String(body.challengeId ?? '').trim();
  const code = String(body.code ?? '').trim();
  if (!challengeId || !/^\d{6}$/.test(code)) {
    return json({ error: 'Podaj 6-cyfrowy kod z SMS-a.', reason: 'bad-input' }, 400);
  }

  const salt = (env.OTP_SALT || '').trim();
  const kv = env.FANOUT_RL;
  if (!salt || !kv) return json({ status: 'config-error', error: 'Weryfikacja chwilowo niedostępna.' }, 500);

  const res = await verifyChallenge(kv, challengeId, code, salt, new Date());
  if (res.ok) return json({ ok: true });

  const msg: Record<string, string> = {
    'not-found': 'Sesja weryfikacji wygasła. Wyślij kod ponownie.',
    expired: 'Kod wygasł. Wyślij nowy kod.',
    'too-many-attempts': 'Za dużo prób. Wyślij nowy kod.',
    'bad-code': 'Nieprawidłowy kod. Spróbuj ponownie.',
  };
  return json({ error: msg[res.reason ?? 'bad-code'] ?? 'Nieprawidłowy kod.', reason: res.reason }, 400);
};
```

- [ ] **Step 2: Lint**

Run: `npm run lint -- functions/api/sms/verify-code.ts`
Expected: brak błędów.

- [ ] **Step 3: Commit**

```bash
git add functions/api/sms/verify-code.ts
git commit -m "feat(widocznosc): endpoint /api/sms/verify-code (weryfikacja kodu OTP)"
```

---

### Task 8: Bramka OTP w `send-report` endpoint

**Files:**
- Modify: `functions/api/tools/send-report.ts`

**Interfaces:**
- Consumes: `consumeVerifiedChallenge` (Task 2); rozszerzony `ReportPayload` (Task 4).
- Produces: wysyłka raportu dozwolona tylko po potwierdzonym challenge.

- [ ] **Step 1: Dodaj sprawdzenie challenge przed renderem maili**

W `functions/api/tools/send-report.ts` dodaj import:

```ts
import { consumeVerifiedChallenge } from '../../_lib/otp';
```

Po walidacji (`if (!v.ok) ...`) a przed konfiguracją Resend, wstaw:

```ts
  // 3b. Bramka OTP – raport leci tylko po potwierdzeniu numeru kodem SMS.
  const challengeId = String(body.challengeId ?? '').trim();
  const kv = env.FANOUT_RL;
  if (!kv) return jsonError(503, 'Weryfikacja SMS niedostępna. Spróbuj później.');
  const verified = await consumeVerifiedChallenge(kv, challengeId, new Date());
  if (!verified.ok) {
    return jsonError(403, 'Potwierdź najpierw numer telefonu kodem SMS.', { reason: 'unverified' });
  }
```

(Pole `challengeId` jest już w `ReportPayload` po Task 4; `FANOUT_RL` jest już w typie `Env`.)

- [ ] **Step 2: Lint**

Run: `npm run lint -- functions/api/tools/send-report.ts`
Expected: brak błędów.

- [ ] **Step 3: Cały zestaw testów nadal zielony**

Run: `npm run test`
Expected: PASS (zmiana endpointu nie psuje testów `_lib`).

- [ ] **Step 4: Commit**

```bash
git add functions/api/tools/send-report.ts
git commit -m "feat(widocznosc): send-report wymaga potwierdzonego challenge OTP"
```

---

### Task 9: Frontend narzędzi – pola + flow OTP (`ReportLeadForm.astro`)

**Files:**
- Modify: `src/components/tools/ReportLeadForm.astro`

**Interfaces:**
- Consumes endpointy: `POST /api/sms/send-code`, `POST /api/sms/verify-code`, `POST /api/tools/send-report`.

- [ ] **Step 1: Zamień markup formularza (pola + sekcje stanów)**

W `ReportLeadForm.astro` zastąp `<form data-report-lead-form …>…</form>` (linie ~28–52) tym:

```astro
    <form data-report-lead-form class="report-lead__form" novalidate>
      <!-- Krok 1: dane -->
      <div data-step="data">
        <div class="report-lead__grid">
          <input type="text" name="firstName" required autocomplete="given-name"
            placeholder="Imię" class="report-lead__input" aria-label="Imię" />
          <input type="text" name="lastName" required autocomplete="family-name"
            placeholder="Nazwisko" class="report-lead__input" aria-label="Nazwisko" />
        </div>
        <div class="report-lead__grid">
          <input type="email" name="email" required autocomplete="email"
            placeholder="twoj@email.pl" class="report-lead__input" aria-label="Adres e-mail" />
          <input type="tel" name="phone" required autocomplete="tel"
            placeholder="np. 512 345 678" class="report-lead__input" aria-label="Telefon komórkowy" />
        </div>

        <!-- honeypot: prawdziwy użytkownik zostawia puste -->
        <input type="text" name="website" tabindex="-1" autocomplete="off" class="report-lead__hp" aria-hidden="true" />

        <label class="report-lead__consent">
          <input type="checkbox" name="consent" />
          <span>Chcę porozmawiać z ekspertem ICEA o widoczności mojej marki w AI – zgadzam się na kontakt e-mailem lub telefonicznie. Zgodę mogę wycofać w każdej chwili.</span>
        </label>
        <button type="button" data-action="send-code" class="report-lead__btn">Wyślij kod SMS</button>
      </div>

      <!-- Krok 2: kod -->
      <div data-step="code" hidden>
        <p class="report-lead__sub">Wpisz 6-cyfrowy kod, który wysłaliśmy SMS-em na podany numer.</p>
        <div class="report-lead__grid">
          <input type="text" name="code" inputmode="numeric" pattern="[0-9]*" maxlength="6"
            placeholder="______" class="report-lead__input" aria-label="Kod z SMS" autocomplete="one-time-code" />
          <button type="submit" class="report-lead__btn" disabled data-role="confirm">Wyślij audyt</button>
        </div>
        <button type="button" data-action="resend" class="report-lead__link" disabled>Wyślij kod ponownie (60 s)</button>
      </div>

      <p class="report-lead__note">Administratorem danych jest ICEA S.A. Numer telefonu wykorzystujemy do weryfikacji i kontaktu. Szczegóły w <a href="/polityka-prywatnosci/">polityce prywatności</a>.</p>
      <p class="report-lead__status" data-status role="status"></p>
    </form>
```

- [ ] **Step 2: Dodaj style nowych elementów**

W bloku `<style>` dopisz:

```css
  .report-lead__grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 0.5rem; }
  @media (max-width: 480px) { .report-lead__grid { grid-template-columns: 1fr; } }
  .report-lead__link {
    margin-top: 0.6rem; background: none; border: 0; padding: 0; cursor: pointer;
    color: var(--accent-blue); font-size: 0.85rem; text-decoration: underline;
  }
  .report-lead__link[disabled] { color: var(--color-ink-muted); cursor: default; text-decoration: none; }
```

- [ ] **Step 3: Zamień `<script>` na logikę 3-stanową**

Zastąp cały blok `<script>…</script>` (linie ~110–171) tym:

```astro
<script>
  (() => {
    const w = window as unknown as { __reportLeadInit?: boolean };
    if (w.__reportLeadInit) return;
    w.__reportLeadInit = true;

    let latest: { query: string; result: unknown } = { query: '', result: null };
    let challengeId = '';
    let cooldownTimer: number | undefined;

    document.addEventListener('tool:result', (e) => {
      const detail = (e as CustomEvent).detail || {};
      latest = { query: String(detail.query || ''), result: detail.result ?? null };
      const section = document.querySelector<HTMLElement>('[data-report-lead]');
      if (section) section.hidden = false;
    });

    function startCooldown(form: HTMLFormElement) {
      const resend = form.querySelector<HTMLButtonElement>('[data-action="resend"]');
      if (!resend) return;
      let left = 60;
      resend.disabled = true;
      resend.textContent = `Wyślij kod ponownie (${left} s)`;
      clearInterval(cooldownTimer);
      cooldownTimer = window.setInterval(() => {
        left -= 1;
        if (left <= 0) {
          clearInterval(cooldownTimer);
          resend.disabled = false;
          resend.textContent = 'Wyślij kod ponownie';
        } else {
          resend.textContent = `Wyślij kod ponownie (${left} s)`;
        }
      }, 1000);
    }

    function setStatus(form: HTMLFormElement, msg: string) {
      const s = form.querySelector<HTMLElement>('[data-status]');
      if (s) s.textContent = msg;
    }

    async function sendCode(form: HTMLFormElement, section: HTMLElement) {
      const fd = new FormData(form);
      const firstName = String(fd.get('firstName') || '').trim();
      const lastName = String(fd.get('lastName') || '').trim();
      const email = String(fd.get('email') || '').trim();
      const phone = String(fd.get('phone') || '').trim();
      if (!firstName || !lastName || !email || !phone) {
        setStatus(form, 'Uzupełnij imię, nazwisko, e-mail i telefon.');
        return;
      }
      const btn = form.querySelector<HTMLButtonElement>('[data-action="send-code"]');
      if (btn) btn.disabled = true;
      setStatus(form, 'Wysyłam kod SMS…');
      try {
        const res = await fetch('/api/sms/send-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tool: section.getAttribute('data-tool') || '',
            firstName, lastName, email, phone,
            consent: fd.get('consent') === 'on',
            website: String(fd.get('website') || ''),
          }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
        challengeId = String(body.challengeId || '');
        form.querySelector<HTMLElement>('[data-step="data"]')!.hidden = true;
        form.querySelector<HTMLElement>('[data-step="code"]')!.hidden = false;
        setStatus(form, `Kod wysłany na ${phone}.`);
        startCooldown(form);
      } catch (err) {
        setStatus(form, err instanceof Error ? err.message : 'Nie udało się wysłać kodu.');
      } finally {
        if (btn) btn.disabled = false;
      }
    }

    async function verifyAndSend(form: HTMLFormElement, section: HTMLElement) {
      const fd = new FormData(form);
      const code = String(fd.get('code') || '').trim();
      if (!/^\d{6}$/.test(code)) { setStatus(form, 'Wpisz 6-cyfrowy kod.'); return; }
      const confirm = form.querySelector<HTMLButtonElement>('[data-role="confirm"]');
      if (confirm) confirm.disabled = true;
      setStatus(form, 'Weryfikuję kod…');
      try {
        const vr = await fetch('/api/sms/verify-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ challengeId, code }),
        });
        const vb = await vr.json().catch(() => ({}));
        if (!vr.ok) throw new Error(vb.error || 'Nieprawidłowy kod.');

        setStatus(form, 'Wysyłam audyt…');
        const fdAll = new FormData(form);
        const res = await fetch('/api/tools/send-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tool: section.getAttribute('data-tool') || '',
            firstName: String(fdAll.get('firstName') || '').trim(),
            lastName: String(fdAll.get('lastName') || '').trim(),
            email: String(fdAll.get('email') || '').trim(),
            phone: String(fdAll.get('phone') || '').trim(),
            consent: fdAll.get('consent') === 'on',
            challengeId,
            query: latest.query,
            result: latest.result,
            website: String(fdAll.get('website') || ''),
          }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
        const wAny = window as any;
        wAny.dataLayer = wAny.dataLayer || [];
        wAny.dataLayer.push({ event: 'generate_lead', form_id: 'narzedzia', lead_type: 'raport', phone_verified: true });
        setStatus(form, 'Gotowe! Audyt wysłany na podany e-mail. Sprawdź skrzynkę (i spam).');
        form.querySelector<HTMLElement>('[data-step="code"]')!.hidden = true;
      } catch (err) {
        setStatus(form, err instanceof Error ? err.message : 'Nie udało się wysłać audytu.');
      } finally {
        if (confirm) confirm.disabled = false;
      }
    }

    // Aktywuj „Wyślij audyt" dopiero gdy w polu kodu jest 6 cyfr.
    document.addEventListener('input', (e) => {
      const t = e.target as HTMLInputElement;
      if (t?.name !== 'code') return;
      const form = t.closest<HTMLFormElement>('[data-report-lead-form]');
      const confirm = form?.querySelector<HTMLButtonElement>('[data-role="confirm"]');
      if (confirm) confirm.disabled = !/^\d{6}$/.test(t.value.trim());
    });

    document.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-action]');
      if (!btn) return;
      const form = btn.closest<HTMLFormElement>('[data-report-lead-form]');
      const section = form?.closest<HTMLElement>('[data-report-lead]');
      if (!form || !section) return;
      const action = btn.getAttribute('data-action');
      if (action === 'send-code' || action === 'resend') { e.preventDefault(); void sendCode(form, section); }
    });

    document.addEventListener('submit', (e) => {
      const form = e.target as HTMLElement;
      if (!(form instanceof HTMLFormElement) || !('reportLeadForm' in form.dataset)) return;
      e.preventDefault();
      const section = form.closest<HTMLElement>('[data-report-lead]');
      if (section) void verifyAndSend(form, section);
    });
  })();
</script>
```

- [ ] **Step 2 (build check): Astro check**

Run: `npm run build`
Expected: build kończy się sukcesem (komponent kompiluje się bez błędów TS w `<script>`).

- [ ] **Step 3: Commit**

```bash
git add src/components/tools/ReportLeadForm.astro
git commit -m "feat(widocznosc): formularz raportu z polami leada + flow OTP (kod SMS)"
```

---

### Task 10: Frontend kontaktu – imię/nazwisko/telefon (`kontakt.astro`)

**Files:**
- Modify: `src/pages/kontakt.astro`

- [ ] **Step 1: Zamień pole „Imię i nazwisko" na dwa pola + dodaj telefon**

W `kontakt.astro` zastąp blok `<div class="mb-5">…name…</div>` (linie ~136–150) tym:

```astro
              <div class="mb-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <label for="firstName" class="text-ink mb-2 block font-medium">Imię</label>
                  <input type="text" id="firstName" name="firstName" placeholder="Jan" required
                    autocomplete="given-name" class="text-input" style="background: var(--bg-canvas);" />
                </div>
                <div>
                  <label for="lastName" class="text-ink mb-2 block font-medium">Nazwisko</label>
                  <input type="text" id="lastName" name="lastName" placeholder="Kowalski" required
                    autocomplete="family-name" class="text-input" style="background: var(--bg-canvas);" />
                </div>
              </div>
```

Po bloku e-mail (po linii ~163, przed „Firma") wstaw pole telefonu:

```astro
              <div class="mb-5">
                <label for="phone" class="text-ink mb-2 block font-medium">Telefon</label>
                <input type="tel" id="phone" name="phone" placeholder="np. 512 345 678" required
                  autocomplete="tel" class="text-input" style="background: var(--bg-canvas);" />
              </div>
```

- [ ] **Step 2: Dodaj `phone_provided` do dataLayer**

W `<script>` w pushu `generate_lead` (linie ~317–321) dodaj pole:

```ts
          w.dataLayer.push({
            event: 'generate_lead',
            form_id: 'kontakt',
            lead_type: String(data.type || 'inne'),
            phone_provided: true,
          });
```

(Skrypt już wysyła całe `FormData` przez `Object.fromEntries`, więc `firstName`, `lastName` i `phone` trafią do `/api/contact` automatycznie – backend obsłużony w Task 5.)

- [ ] **Step 3: Build check**

Run: `npm run build`
Expected: sukces.

- [ ] **Step 4: Commit**

```bash
git add src/pages/kontakt.astro
git commit -m "feat(widocznosc): kontakt – osobne imie/nazwisko + telefon (wymagany)"
```

---

### Task 11: Polityka prywatności – telefon + SMSAPI

**Files:**
- Modify: `src/pages/polityka-prywatnosci.astro`

- [ ] **Step 1: Uzupełnij zakres danych i podmiot przetwarzający**

Otwórz `src/pages/polityka-prywatnosci.astro`. W sekcji wymieniającej zbierane dane (obecnie: imię, nazwisko, e-mail, firma, wiadomość, cel kontaktu – ~linie 54–123) dodaj „numer telefonu". W opisie celów dopisz: kontakt telefoniczny oraz weryfikacja numeru kodem SMS. Dodaj zdanie o powierzeniu przetwarzania:

```astro
            <p>
              Numer telefonu przetwarzamy w celu kontaktu oraz weryfikacji za pomocą
              jednorazowego kodu SMS. Do wysyłki SMS korzystamy z usługi SMSAPI
              (ClickApps Sp. z o.o.) jako podmiotu przetwarzającego dane na nasze zlecenie.
            </p>
```

(Dostosuj brzmienie do istniejącej numeracji/akapitów strony; treść ma być spójna ze stylem dokumentu.)

- [ ] **Step 2: Build check**

Run: `npm run build`
Expected: sukces.

- [ ] **Step 3: Commit**

```bash
git add src/pages/polityka-prywatnosci.astro
git commit -m "docs(widocznosc): polityka prywatnosci – telefon + weryfikacja SMS (SMSAPI)"
```

---

### Task 12: Konfiguracja env + dokumentacja (`wrangler.toml`)

**Files:**
- Modify: `wrangler.toml`

- [ ] **Step 1: Dodaj sekcję komentarzy o sekretach i limitach SMS**

W `wrangler.toml` po istniejących komentarzach (przed blokiem `[[kv_namespaces]]`) dopisz:

```toml
# Weryfikacja SMS (OTP) dla narzędzi (/api/sms/send-code, /api/sms/verify-code).
# Sekrety ustawiane w panelu Cloudflare Pages → Settings → Variables and Secrets:
#   SMSAPI_TOKEN   – token OAuth z panelu SMSAPI.pl
#   SMSAPI_SENDER  – zarejestrowane pole nadawcy (np. "ICEA")
#   OTP_SALT       – losowy sekret do hashowania kodów
#   SMSAPI_TEST=1  – (opcjonalnie) SMSAPI nie wysyła realnie, nie zużywa kredytów
# Limity (0 = wyłączony; default w kodzie): SMS_HOURLY_PER_PHONE=3
#   SMS_SENDCODE_IP_LIMIT=10  SMS_DAILY_GLOBAL_LIMIT=30 (start; kill-switch kosztowy)
# Stan OTP w bindingu FANOUT_RL pod kluczami otp:<id>, otp-cd/-h/-ip/-g.
# Lokalnie: skopiuj sekrety do gitignored .dev.vars i uruchom `npx wrangler pages dev dist`.
```

- [ ] **Step 2: Commit**

```bash
git add wrangler.toml
git commit -m "docs(widocznosc): wrangler – sekrety i limity weryfikacji SMS (OTP)"
```

---

### Task 13: Weryfikacja end-to-end (manualna, na trybie testowym SMSAPI)

**Files:** brak zmian w kodzie – krok weryfikacyjny.

- [ ] **Step 1: Pełny zestaw testów jednostkowych**

Run: `npm run test`
Expected: wszystkie pliki PASS (w tym phone, otp, smsapi, contact, send-report).

- [ ] **Step 2: Lint całości**

Run: `npm run lint`
Expected: brak błędów.

- [ ] **Step 3: Lokalny e2e przez wrangler (tryb testowy)**

Utwórz `.dev.vars` (gitignored) z: `RESEND_API_KEY`, `SMSAPI_TOKEN`, `SMSAPI_SENDER`, `OTP_SALT`, `SMSAPI_TEST=1`.
Run: `npm run build && npx wrangler pages dev dist`
Sprawdź ręcznie:
- `/narzedzia/brand-check` → wykonaj test → formularz raportu pokazuje pola imię/nazwisko/e-mail/telefon → „Wyślij kod SMS" (w trybie `SMSAPI_TEST=1` SMS nie wychodzi, ale challenge powstaje – w logach wrangler widać request) → przejście do kroku kodu.
  Uwaga: przy `SMSAPI_TEST=1` nie znasz kodu, więc do realnego sprawdzenia weryfikacji ustaw `SMSAPI_TEST=0` na własnym numerze (zużywa 1 kredyt) albo dodaj tymczasowy log kodu wyłącznie lokalnie (NIE commitować).
- `/kontakt/` → formularz ma pola Imię, Nazwisko, Telefon (wymagane), wysyłka kończy się sukcesem (mail przez Resend) i NIE wymaga kodu SMS.
Expected: oba flow działają zgodnie z opisem.

- [ ] **Step 4: Commit (jeśli pojawiły się drobne poprawki)**

```bash
git add -A
git commit -m "fix(widocznosc): poprawki po weryfikacji e2e lead-gen SMS OTP"
```

---

## Self-Review

**Spec coverage:**
- Pola na obu formularzach → Task 5 (kontakt), Task 9 (narzędzia), Task 4 (payload raportu). ✔
- OTP tylko w narzędziach, kontakt bez OTP → Task 6/7/8/9 (OTP) vs Task 5/10 (kontakt bez OTP). ✔
- SMSAPI.pl → Task 3 (klient), Task 6 (użycie). ✔
- Własny OTP w KV → Task 2 (challenge w FANOUT_RL). ✔ (reuse `FANOUT_RL` zamiast nowego `OTP_KV` – mieści się w wariancie dopuszczonym w specu „alternatywnie reuse FANOUT_RL"; zero zmian infrastruktury.)
- Parametry OTP (6 cyfr / 10 min / 5 prób / 60 s / 3 h / 10 IP / 30 global) → Task 2 + Task 6. ✔
- RODO / treść zgody / GTM → Task 11 (polityka), Task 9 (zgoda + `phone_verified`), Task 10 (`phone_provided`). ✔
- Testy TDD → Task 1–5 mają testy; endpointy (6,7,8) opierają się na przetestowanej logice `_lib` (zgodnie z istniejącym wzorcem, gdzie endpointy nie mają testów jednostkowych). ✔

**Placeholder scan:** brak TBD/TODO; każdy krok kodu ma pełną implementację. ✔

**Type consistency:** `ChallengeLead`/`ChallengeRecord`/`SendLimits`/`VerifyResult` zdefiniowane w Task 2 i używane spójnie w Task 6/7/8; `ReportPayload` rozszerzony w Task 4 i konsumowany w Task 8; `normalizePhonePL`/`isMobilePL` z Task 1 używane w Task 5/6; `sendSms` z Task 3 w Task 6. ✔

**Uwaga wdrożeniowa (nie blokuje planu):** nadawca alfanumeryczny w SMSAPI wymaga rejestracji pola nadawcy (1–2 dni). Do czasu zatwierdzenia testować z `SMSAPI_TEST=1` lub na własnym numerze. Pula 50 kredytów → na start warto ustawić `SMS_DAILY_GLOBAL_LIMIT=30`.
