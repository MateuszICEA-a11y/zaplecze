import { describe, it, expect } from 'vitest';
import { resolveLimit, checkToolLimit } from './tool-rate-limit';

type Rec = { count: number; resetAt: number };

/** Minimalny fake KV: trzyma sparsowane obiekty, put przyjmuje string (jak prawdziwe KV). */
function fakeKv(initial: Record<string, Rec> = {}) {
  const store = new Map<string, Rec>(Object.entries(initial));
  return {
    store,
    async get(key: string, _type: 'json') {
      return store.has(key) ? store.get(key)! : null;
    },
    async put(key: string, value: string) {
      store.set(key, JSON.parse(value) as Rec);
    },
  };
}

const NOON = new Date('2026-06-01T12:00:00Z');

describe('resolveLimit', () => {
  it('zwraca fallback gdy env puste', () => {
    expect(resolveLimit(undefined, 5)).toBe(5);
    expect(resolveLimit('', 3)).toBe(3);
  });
  it('parsuje liczbę z env', () => {
    expect(resolveLimit('10', 5)).toBe(10);
  });
  it('akceptuje 0 jako wyłączenie limitu', () => {
    expect(resolveLimit('0', 5)).toBe(0);
  });
  it('odrzuca śmieci → fallback', () => {
    expect(resolveLimit('abc', 7)).toBe(7);
    expect(resolveLimit('-2', 7)).toBe(7);
  });
});

describe('checkToolLimit', () => {
  it('limit<=0 → przepuszcza bez zliczania, remaining=null', async () => {
    const kv = fakeKv();
    const gate = await checkToolLimit(kv as any, 'fanout', '1.2.3.4', 0, NOON);
    expect(gate.allowed).toBe(true);
    expect(gate.remaining).toBeNull();
    await gate.commit();
    expect(kv.store.size).toBe(0);
  });

  it('pierwsze użycie dozwolone, remaining = limit-1', async () => {
    const kv = fakeKv();
    const gate = await checkToolLimit(kv as any, 'brand-check', '1.2.3.4', 3, NOON);
    expect(gate.allowed).toBe(true);
    expect(gate.remaining).toBe(2);
  });

  it('commit zwiększa licznik pod kluczem tool:<nazwa>:<ip>', async () => {
    const kv = fakeKv();
    const gate = await checkToolLimit(kv as any, 'brand-check', '1.2.3.4', 3, NOON);
    await gate.commit();
    expect(kv.store.get('tool:brand-check:1.2.3.4')!.count).toBe(1);
  });

  it('po wyczerpaniu limitu allowed=false', async () => {
    const kv = fakeKv({ 'tool:url-check:9.9.9.9': { count: 10, resetAt: NOON.getTime() + 3600_000 } });
    const gate = await checkToolLimit(kv as any, 'url-check', '9.9.9.9', 10, NOON);
    expect(gate.allowed).toBe(false);
    expect(gate.remaining).toBe(0);
  });

  it('klucze różnych narzędzi są izolowane', async () => {
    const kv = fakeKv({ 'tool:fanout:1.1.1.1': { count: 5, resetAt: NOON.getTime() + 3600_000 } });
    const gate = await checkToolLimit(kv as any, 'brand-check', '1.1.1.1', 3, NOON);
    expect(gate.allowed).toBe(true);
  });

  it('brak KV → przepuszcza i commit jest no-op', async () => {
    const gate = await checkToolLimit(undefined, 'fanout', '1.2.3.4', 5, NOON);
    expect(gate.allowed).toBe(true);
    await gate.commit(); // nie rzuca
  });
});
