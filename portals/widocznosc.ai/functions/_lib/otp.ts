/**
 * Prymitywy OTP (generacja/hash kodu) + logika challenge w KV + limity wysyłki SMS.
 * Funkcje IO-aware przyjmują KVNamespace, więc są testowalne z fake KV (jak tool-rate-limit).
 */
import { secondsUntilWarsawMidnight, evaluateLimit } from './rate-limit';

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
  if (!evaluateLimit(hRec?.count ?? 0, limits.hourlyPerPhone).allowed) return { allowed: false, reason: 'hourly', commit: noop };

  const ipRec = await kv.get<LimitRecord>(`otp-ip:${ip}`, 'json');
  if (!evaluateLimit(ipRec?.count ?? 0, limits.dailyPerIp).allowed) return { allowed: false, reason: 'ip', commit: noop };

  const gRec = await kv.get<LimitRecord>('otp-g:global', 'json');
  if (!evaluateLimit(gRec?.count ?? 0, limits.dailyGlobal).allowed) return { allowed: false, reason: 'global', commit: noop };

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
