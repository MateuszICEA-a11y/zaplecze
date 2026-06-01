# Limity użyć per IP w narzędziach – Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Przywrócić dzienne limity użyć per IP dla płatnych narzędzi widocznosc.ai (brand-check 3, fanout 5, url-check 10), współdzieląc jeden testowalny moduł rate-limitu.

**Architecture:** Wyciągamy logikę limitu (dziś inline w `fanout.ts`) do reużywalnego `_lib/tool-rate-limit.ts` z semantyką „sprawdź przed kosztem, zlicz po sukcesie". Wpinamy go w 3 endpointy. KV `FANOUT_RL` współdzielone, klucze prefiksowane `tool:<nazwa>:<ip>`. Limity konfigurowalne przez env z defaultami w kodzie.

**Tech Stack:** Cloudflare Pages Functions (TypeScript), KV, vitest. Część B (łapanie leadów) to osobny plan.

---

## File Structure

- Create: `functions/_lib/tool-rate-limit.ts` – `resolveLimit()` + `checkToolLimit()` (read + decision + commit-closure).
- Create: `functions/_lib/tool-rate-limit.test.ts` – testy jednostkowe (fake KV).
- Modify: `functions/api/tools/fanout.ts` – refaktor inline rate-limitu na `checkToolLimit`, default limit 0→5.
- Modify: `functions/api/tools/brand-check.ts` – wpięcie limitu (default 3) + `jsonError` z `extra`.
- Modify: `functions/api/tools/url-check.ts` – wpięcie limitu (default 10) + `jsonError` z `extra`.

Istniejący `functions/_lib/rate-limit.ts` (`evaluateLimit`, `secondsUntilWarsawMidnight`) pozostaje bez zmian – nowy moduł go opakowuje.

---

### Task 1: Reużywalny moduł rate-limitu

**Files:**
- Create: `functions/_lib/tool-rate-limit.ts`
- Test: `functions/_lib/tool-rate-limit.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// functions/_lib/tool-rate-limit.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd portals/widocznosc.ai && npx vitest run functions/_lib/tool-rate-limit.test.ts`
Expected: FAIL – `Cannot find module './tool-rate-limit'`.

- [ ] **Step 3: Write minimal implementation**

```typescript
// functions/_lib/tool-rate-limit.ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run functions/_lib/tool-rate-limit.test.ts`
Expected: PASS (wszystkie ~11 testów).

- [ ] **Step 5: Commit**

```bash
git add functions/_lib/tool-rate-limit.ts functions/_lib/tool-rate-limit.test.ts
git commit -m "feat(widocznosc): reużywalny moduł rate-limit per IP dla narzędzi"
```

---

### Task 2: Refaktor fanout.ts na wspólny moduł

**Files:**
- Modify: `functions/api/tools/fanout.ts`

- [ ] **Step 1: Podmień import rate-limitu**

Zamień (linia 9):

```typescript
import { evaluateLimit, secondsUntilWarsawMidnight } from '../../_lib/rate-limit';
```

na:

```typescript
import { resolveLimit, checkToolLimit } from '../../_lib/tool-rate-limit';
```

- [ ] **Step 2: Usuń nieużywany typ i podnieś domyślny limit**

Usuń linię 19 (`type LimitRecord = { count: number; resetAt: number };`).
Zmień linię 23 z `const DEFAULT_LIMIT = 0;` na:

```typescript
const DEFAULT_LIMIT = 5;
```

- [ ] **Step 3: Zastąp blok odczytu limitu (sekcja „3. Rate-limit", linie ~80–111)**

Zamień fragment od `const model = ...` przez cały blok rate-limit (do końca `if (rateLimitEnabled && !decision.allowed) { ... }`) na:

```typescript
  const model = (env.FANOUT_MODEL || DEFAULT_MODEL).trim();
  const limit = resolveLimit(env.FANOUT_DAILY_LIMIT, DEFAULT_LIMIT);

  // 3. Rate-limit (odczyt) — KV współdzielone, klucz tool:fanout:<ip>
  const kv = env.FANOUT_RL;
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const now = new Date();
  const gate = await checkToolLimit(kv, 'fanout', ip, limit, now);
  if (!gate.allowed) {
    return jsonError(429, `Wykorzystałeś dzienny limit (${limit} zapytań). Reset o północy.`, {
      remaining: 0,
      limit,
      resetAt: gate.resetAt,
    });
  }
```

- [ ] **Step 4: Zastąp inkrement po sukcesie (sekcja „5.", linie ~153–159)**

Zamień blok:

```typescript
  // 5. Inkrement limitu DOPIERO po udanej odpowiedzi
  if (rateLimitEnabled && kv) {
    const newCount = Math.max(0, record.count) + 1;
    await kv.put(kvKey, JSON.stringify({ count: newCount, resetAt: record.resetAt }), {
      expirationTtl: Math.max(60, Math.ceil((record.resetAt - now.getTime()) / 1000)),
    });
  }
```

na:

```typescript
  // 5. Zliczenie limitu DOPIERO po udanej odpowiedzi
  await gate.commit();
```

- [ ] **Step 5: Zaktualizuj pole `usage` w odpowiedzi (sekcja „6.")**

Zamień linię `usage: { remaining: decision.remaining, limit, resetAt },` na:

```typescript
    usage: { remaining: gate.remaining, limit, resetAt: gate.resetAt },
```

- [ ] **Step 6: Verify typy i testy**

Run: `npx tsc --noEmit && npm test`
Expected: tsc bez błędów; wszystkie testy PASS. (Brak referencji do usuniętych `record`, `resetAt`, `decision`, `rateLimitEnabled`, `kvKey`, `ttl`.)

- [ ] **Step 7: Commit**

```bash
git add functions/api/tools/fanout.ts
git commit -m "refactor(widocznosc): fanout używa wspólnego checkToolLimit (default 5/IP)"
```

---

### Task 3: Limit w brand-check (3/IP/dzień)

**Files:**
- Modify: `functions/api/tools/brand-check.ts`

- [ ] **Step 1: Dodaj import na górze pliku (po linii 9 z importami)**

```typescript
import { resolveLimit, checkToolLimit } from '../../_lib/tool-rate-limit';
```

- [ ] **Step 2: Rozszerz typ Env (linie 89–91)**

Zamień:

```typescript
type Env = {
  OPENROUTER_API_KEY?: string;
};
```

na:

```typescript
type Env = {
  OPENROUTER_API_KEY?: string;
  BRAND_CHECK_DAILY_LIMIT?: string;
  FANOUT_RL?: KVNamespace;
};

const BRAND_CHECK_DEFAULT_LIMIT = 3;
```

- [ ] **Step 3: Rozszerz jsonError o `extra` (linie 823–828)**

Zamień:

```typescript
function jsonError(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: jsonHeaders(),
  });
}
```

na:

```typescript
function jsonError(status: number, message: string, extra: Record<string, unknown> = {}): Response {
  return new Response(JSON.stringify({ error: message, ...extra }), {
    status,
    headers: jsonHeaders(),
  });
}
```

- [ ] **Step 4: Wstaw bramkę limitu przed kosztem (po walidacji marki, między linią 781 a 783)**

Po bloku:

```typescript
  const brand = normalizeBrand(body.brand || '');
  if (!brand || brand.length < 2) {
    return jsonError(400, 'Podaj nazwę marki.');
  }
```

dodaj:

```typescript
  const ip = context.request.headers.get('CF-Connecting-IP') || 'unknown';
  const limit = resolveLimit(context.env.BRAND_CHECK_DAILY_LIMIT, BRAND_CHECK_DEFAULT_LIMIT);
  const gate = await checkToolLimit(context.env.FANOUT_RL, 'brand-check', ip, limit, new Date());
  if (!gate.allowed) {
    return jsonError(429, `Wykorzystałeś dzienny limit (${limit} sprawdzeń). Reset o północy.`, {
      remaining: 0,
      limit,
      resetAt: gate.resetAt,
    });
  }
```

- [ ] **Step 5: Zlicz użycie po wygenerowaniu wyniku (linia ~801)**

Zamień:

```typescript
  return jsonResponse(aggregate(brand, domain, category, market, profile, modelResponses));
```

na:

```typescript
  await gate.commit();
  return jsonResponse(aggregate(brand, domain, category, market, profile, modelResponses));
```

- [ ] **Step 6: Verify**

Run: `npx tsc --noEmit && npm test`
Expected: bez błędów typów, testy PASS.

- [ ] **Step 7: Commit**

```bash
git add functions/api/tools/brand-check.ts
git commit -m "feat(widocznosc): limit 3/IP/dzień dla brand-check (4 wywołania LLM)"
```

---

### Task 4: Limit w url-check (10/IP/dzień)

**Files:**
- Modify: `functions/api/tools/url-check.ts`

- [ ] **Step 1: Dodaj import (po istniejących importach na górze pliku)**

```typescript
import { resolveLimit, checkToolLimit } from '../../_lib/tool-rate-limit';
```

- [ ] **Step 2: Rozszerz typ Env (linie 183–185)**

Zamień:

```typescript
type Env = {
  OPENROUTER_API_KEY?: string;
};
```

na:

```typescript
type Env = {
  OPENROUTER_API_KEY?: string;
  URL_CHECK_DAILY_LIMIT?: string;
  FANOUT_RL?: KVNamespace;
};

const URL_CHECK_DEFAULT_LIMIT = 10;
```

- [ ] **Step 3: Rozszerz jsonError o `extra` (linie 392–397)**

Zamień:

```typescript
function jsonError(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: jsonHeaders(),
  });
}
```

na:

```typescript
function jsonError(status: number, message: string, extra: Record<string, unknown> = {}): Response {
  return new Response(JSON.stringify({ error: message, ...extra }), {
    status,
    headers: jsonHeaders(),
  });
}
```

- [ ] **Step 4: Wstaw bramkę limitu przed pobraniem strony (po walidacji URL, między linią 213 a 215)**

Po bloku:

```typescript
  const url = normalizeUrl(body.url || '');
  if (!url) {
    return jsonError(400, 'Podaj poprawny publiczny URL (http/https).');
  }
```

dodaj:

```typescript
  const ip = context.request.headers.get('CF-Connecting-IP') || 'unknown';
  const limit = resolveLimit(context.env.URL_CHECK_DAILY_LIMIT, URL_CHECK_DEFAULT_LIMIT);
  const gate = await checkToolLimit(context.env.FANOUT_RL, 'url-check', ip, limit, new Date());
  if (!gate.allowed) {
    return jsonError(429, `Wykorzystałeś dzienny limit (${limit} sprawdzeń). Reset o północy.`, {
      remaining: 0,
      limit,
      resetAt: gate.resetAt,
    });
  }
```

- [ ] **Step 5: Zlicz użycie dopiero po udanej analizie LLM (po linii 324, przed budową `response`)**

Po linii:

```typescript
  const actionItems = buildActionItems(score.factors);
```

dodaj:

```typescript
  await gate.commit();
```

(Wszystkie wcześniejsze `return jsonResponse(buildErrorResponse(...))` – cloudflare-blocked, fetch-error, too-large, not-html, too-small, llm-error – kończą bez `commit()`, więc nieudane sprawdzenia nie zużywają limitu.)

- [ ] **Step 6: Verify**

Run: `npx tsc --noEmit && npm test`
Expected: bez błędów typów, testy PASS.

- [ ] **Step 7: Commit**

```bash
git add functions/api/tools/url-check.ts
git commit -m "feat(widocznosc): limit 10/IP/dzień dla url-check"
```

---

### Task 5: Weryfikacja end-to-end + env

**Files:** brak zmian w kodzie (weryfikacja).

- [ ] **Step 1: Pełny build i testy**

Run: `npm test && npm run build`
Expected: wszystkie testy PASS; build bez błędów.

- [ ] **Step 2: E2E przez wrangler (limit działa lokalnie)**

```bash
npx wrangler pages dev dist --port 8788 --kv FANOUT_RL > /tmp/wr.log 2>&1 &
for i in $(seq 1 20); do curl -s -o /dev/null http://localhost:8788/ && break; sleep 2; done
# brand-check: 4 strzały z tym samym IP, 4. powinien dać 429 (limit 3)
for n in 1 2 3 4; do
  curl -s -o /dev/null -w "proba $n -> %{http_code}\n" \
    -H "CF-Connecting-IP: 203.0.113.7" -H "Content-Type: application/json" \
    -X POST --data '{"brand":"TestBrand"}' http://localhost:8788/api/tools/brand-check
done
pkill -f "wrangler pages dev"
```

Expected: próby 1–3 → 200, próba 4 → **429**. (Wymaga `OPENROUTER_API_KEY` w `.dev.vars`; jeśli brak klucza, endpoint zwróci 500 config-error PRZED inkrementem i limit się nie naliczy – wtedy zweryfikuj limit na deployu preview.)

- [ ] **Step 3: Udokumentuj zmienne env (komentarz w wrangler.toml)**

Dopisz w `portals/widocznosc.ai/wrangler.toml` w sekcji komentarzy `[vars]`:

```toml
# Limity narzędzi per IP/dzień (0 = wyłączony; default w kodzie):
#   FANOUT_DAILY_LIMIT=5  BRAND_CHECK_DAILY_LIMIT=3  URL_CHECK_DAILY_LIMIT=10
# Ustawiane w panelu Cloudflare Pages → Settings → Variables (Production + Preview).
```

- [ ] **Step 4: Commit**

```bash
git add portals/widocznosc.ai/wrangler.toml
git commit -m "docs(widocznosc): limity narzędzi per IP w komentarzu wrangler.toml"
```

---

## Self-Review

**Spec coverage:** Plan pokrywa część „1. Rate limits" specu (brand 3 / fanout 5 / url 10 / bots ∞, reset Warsaw, klucz per IP, env override, komunikat 429 z resetem). ai-bots-check świadomie pominięty (darmowe, bez limitu). Część „2–6" (leady, raporty, zgoda) = osobny plan B.

**Placeholder scan:** Brak TBD/TODO – każdy krok ma pełny kod lub konkretną komendę z oczekiwanym wynikiem.

**Type consistency:** `checkToolLimit` zwraca `ToolLimitGate { allowed, remaining, limit, resetAt, commit }` – używane spójnie we wszystkich 3 handlerach. `resolveLimit(envValue, fallback)` – ta sama sygnatura wszędzie. KV binding to `FANOUT_RL` (z wrangler.toml) w każdym endpoincie. Klucze `tool:fanout|brand-check|url-check:<ip>` – rozłączne.

## Uwagi do egzekucji

- Numery linii są orientacyjne (stan na 2026-06-01); jeśli się rozjadą, kotwicz po pokazanych fragmentach kodu, nie po numerach.
- `fanout.ts` po refaktorze nie może już zawierać referencji do `record`, `decision`, `rateLimitEnabled`, `kvKey`, `ttl`, `resetAt` (stara ścieżka) – `tsc --noEmit` to wychwyci.
