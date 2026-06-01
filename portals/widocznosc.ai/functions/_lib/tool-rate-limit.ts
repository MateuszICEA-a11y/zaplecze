/**
 * Reużywalny rate-limit per IP dla narzędzi. Opakowuje czyste funkcje z rate-limit.ts.
 * Semantyka: sprawdź PRZED kosztem (LLM/mail), zlicz (commit) PO sukcesie.
 * Stan w Cloudflare KV, klucz `tool:<nazwa>:<ip>`, reset o północy Europe/Warsaw.
 */
import { evaluateLimit, secondsUntilWarsawMidnight } from './rate-limit';

type LimitRecord = { count: number; resetAt: number };

export type ToolLimitGate = {
  allowed: boolean;
  remaining: number | null; // null = limit wyłączony
  limit: number;
  resetAt: string; // ISO
  commit: () => Promise<void>; // inkrement po sukcesie; no-op gdy brak limitu/KV
};

/** Limit z env z fallbackiem w kodzie. Akceptuje 0 (wyłączenie); śmieci/ujemne → fallback. */
export function resolveLimit(envValue: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(envValue ?? '', 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export async function checkToolLimit(
  kv: KVNamespace | undefined,
  tool: string,
  ip: string,
  limit: number,
  now: Date = new Date(),
): Promise<ToolLimitGate> {
  const enabled = limit > 0;
  const ttl = secondsUntilWarsawMidnight(now);
  let record: LimitRecord = { count: 0, resetAt: now.getTime() + ttl * 1000 };

  if (enabled && kv) {
    const stored = await kv.get<LimitRecord>(`tool:${tool}:${ip}`, 'json');
    if (stored && typeof stored.count === 'number' && typeof stored.resetAt === 'number') {
      record = stored;
    }
  }
  const resetAt = new Date(record.resetAt).toISOString();

  if (!enabled) {
    return { allowed: true, remaining: null, limit, resetAt, commit: async () => {} };
  }

  const decision = evaluateLimit(record.count, limit);
  const commit = async () => {
    if (!kv) return;
    await kv.put(
      `tool:${tool}:${ip}`,
      JSON.stringify({ count: Math.max(0, record.count) + 1, resetAt: record.resetAt }),
      { expirationTtl: Math.max(60, Math.ceil((record.resetAt - now.getTime()) / 1000)) },
    );
  };

  return { allowed: decision.allowed, remaining: decision.remaining, limit, resetAt, commit };
}
