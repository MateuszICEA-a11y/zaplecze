# Fan-out Tool Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publiczne narzędzie `/narzedzia/fanout` na widocznosc.ai pokazujące fan-out queries ChatGPT i zagregowane cytowane domeny z OpenAI Responses API, z limitem 3/IP/dzień przez Cloudflare KV.

**Architecture:** Astro page (frontend) + Cloudflare Pages Function (backend). Funkcja waliduje query, sprawdza limit w KV, woła OpenAI Responses API z `web_search`, parsuje `output[]` na fan-outy + cytowania, agreguje domeny, zwraca JSON. Logika parsowania i rate-limitu wydzielona do czystych, testowalnych modułów w `functions/_lib/`.

**Tech Stack:** Astro 6, TypeScript, Cloudflare Pages Functions, Cloudflare KV, vitest, OpenAI Responses API (`gpt-5-mini`).

**Spec:** `docs/superpowers/specs/2026-05-26-fanout-tool-design.md`

**Working directory:** `portals/widocznosc.ai` (pakiet pnpm `widocznosc.ai`). Wszystkie ścieżki poniżej względem tego katalogu, chyba że zaznaczono inaczej.

---

## File Structure

| Plik | Odpowiedzialność |
|------|------------------|
| `functions/_lib/fanout-parse.ts` | Czyste funkcje: parsowanie `output[]` Responses API → fan-outy, cytowania, agregacja domen |
| `functions/_lib/rate-limit.ts` | Czyste funkcje: decyzja o limicie + obliczanie sekund do północy (Warszawa) |
| `functions/api/tools/fanout.ts` | Endpoint `POST /api/tools/fanout`: walidacja, KV, wywołanie OpenAI, montaż odpowiedzi |
| `functions/_lib/__fixtures__/fanout-response.json` | Syntetyczny fixture odpowiedzi Responses API do testów parsera |
| `src/pages/narzedzia/fanout.astro` | Strona narzędzia (UI + fetch + render) |
| `src/pages/narzedzia.astro` | Modyfikacja: dodanie kafelka narzędzia (lista) |
| `wrangler.toml` | Modyfikacja: binding KV `FANOUT_RL` |
| `vitest.config.ts` | Nowy: konfiguracja testów |
| `package.json` | Modyfikacja: skrypt `test` + devDependency `vitest` |

---

## Task 1: Setup vitest

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `functions/_lib/__tests__/smoke.test.ts` (tymczasowy, usuwany w kroku 5)

- [ ] **Step 1: Dodaj vitest jako devDependency**

Run (w `portals/widocznosc.ai`):
```bash
pnpm add -D vitest@^3
```
Expected: vitest pojawia się w `devDependencies`.

- [ ] **Step 2: Dodaj skrypt `test` do `package.json`**

W `package.json` w sekcji `"scripts"` dodaj po linii `"format:check": ...`:
```json
    "test": "vitest run",
    "test:watch": "vitest"
```

- [ ] **Step 3: Utwórz `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['functions/**/*.test.ts', 'src/**/*.test.ts'],
    environment: 'node',
  },
});
```

- [ ] **Step 4: Utwórz tymczasowy test smoke**

`functions/_lib/__tests__/smoke.test.ts`:
```ts
import { describe, expect, it } from 'vitest';

describe('vitest setup', () => {
  it('działa', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: Uruchom i potwierdź, że przechodzi, potem usuń smoke**

Run: `pnpm --filter widocznosc.ai test`
Expected: PASS (1 test). Następnie:
```bash
rm functions/_lib/__tests__/smoke.test.ts
```

- [ ] **Step 6: Commit**

```bash
git add portals/widocznosc.ai/package.json portals/widocznosc.ai/pnpm-lock.yaml portals/widocznosc.ai/vitest.config.ts
git add ../../pnpm-lock.yaml 2>/dev/null || true
git commit -m "chore(widocznosc): dodaj vitest do testów funkcji"
```

---

## Task 2: Parser odpowiedzi Responses API (fan-outy + cytowania + domeny)

**Files:**
- Create: `functions/_lib/__fixtures__/fanout-response.json`
- Create: `functions/_lib/fanout-parse.ts`
- Test: `functions/_lib/fanout-parse.test.ts`

- [ ] **Step 1: Utwórz fixture odpowiedzi**

`functions/_lib/__fixtures__/fanout-response.json` — syntetyczny, ale wierny strukturze realnej odpowiedzi (mieszanka `action.query` i `action.queries`, cytowania z duplikatem domeny):
```json
{
  "id": "resp_test_123",
  "model": "gpt-5-mini-2025-08-07",
  "output": [
    {
      "type": "web_search_call",
      "status": "completed",
      "action": { "type": "search", "query": "najlepsza agencja seo w polsce 2026 ranking" }
    },
    {
      "type": "web_search_call",
      "status": "completed",
      "action": { "type": "search", "queries": ["agencja seo opinie ranking", "icea seo opinie"] }
    },
    {
      "type": "message",
      "content": [
        {
          "type": "output_text",
          "text": "Oto kilka agencji...",
          "annotations": [
            { "type": "url_citation", "title": "Ranking agencji", "url": "https://www.example.com/ranking?utm=1" },
            { "type": "url_citation", "title": "Opinie", "url": "https://example.com/opinie" },
            { "type": "url_citation", "title": "ICEA", "url": "https://icea.pl/o-nas" }
          ]
        }
      ]
    }
  ]
}
```

- [ ] **Step 2: Napisz failujący test parsera**

`functions/_lib/fanout-parse.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import fixture from './__fixtures__/fanout-response.json';
import { parseResponsesOutput } from './fanout-parse';

describe('parseResponsesOutput', () => {
  const parsed = parseResponsesOutput(fixture);

  it('wyciąga fan-out queries z action.query i action.queries', () => {
    expect(parsed.fanoutQueries).toEqual([
      'najlepsza agencja seo w polsce 2026 ranking',
      'agencja seo opinie ranking',
      'icea seo opinie',
    ]);
  });

  it('oznacza, że model wykonał wyszukiwanie', () => {
    expect(parsed.searched).toBe(true);
  });

  it('wyciąga cytowania z domeną bez www', () => {
    expect(parsed.citations).toHaveLength(3);
    expect(parsed.citations[0]).toMatchObject({
      title: 'Ranking agencji',
      url: 'https://www.example.com/ranking?utm=1',
      domain: 'example.com',
    });
  });

  it('agreguje domeny z liczbą cytowań i sortuje malejąco', () => {
    expect(parsed.citedDomains).toEqual([
      {
        domain: 'example.com',
        count: 2,
        urls: ['https://www.example.com/ranking?utm=1', 'https://example.com/opinie'],
      },
      { domain: 'icea.pl', count: 1, urls: ['https://icea.pl/o-nas'] },
    ]);
  });

  it('dla odpowiedzi bez web_search zwraca searched=false i puste listy', () => {
    const empty = parseResponsesOutput({ output: [{ type: 'message', content: [{ type: 'output_text', text: 'hej' }] }] });
    expect(empty.searched).toBe(false);
    expect(empty.fanoutQueries).toEqual([]);
    expect(empty.citedDomains).toEqual([]);
  });

  it('jest odporny na śmieciowe wejście', () => {
    expect(parseResponsesOutput(null).fanoutQueries).toEqual([]);
    expect(parseResponsesOutput({}).citations).toEqual([]);
  });
});
```

- [ ] **Step 3: Uruchom test — ma failować**

Run: `pnpm --filter widocznosc.ai test fanout-parse`
Expected: FAIL — `Cannot find module './fanout-parse'`.

- [ ] **Step 4: Zaimplementuj parser**

`functions/_lib/fanout-parse.ts`:
```ts
/**
 * Parser odpowiedzi OpenAI Responses API (web_search).
 * Wyciąga fan-out queries (web_search_call.action) oraz cytowania (url_citation)
 * i agreguje cytowania per domena. Czyste funkcje, bez zależności od env.
 */

export type Citation = { title: string; url: string; domain: string };
export type CitedDomain = { domain: string; count: number; urls: string[] };
export type ParsedFanout = {
  searched: boolean;
  fanoutQueries: string[];
  citations: Citation[];
  citedDomains: CitedDomain[];
};

type AnyRecord = Record<string, unknown>;

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function normalizeHost(rawUrl: string): string | null {
  try {
    return new URL(rawUrl).hostname.replace(/^www\./i, '').toLowerCase();
  } catch {
    return null;
  }
}

export function parseResponsesOutput(data: unknown): ParsedFanout {
  const root = (data && typeof data === 'object' ? data : {}) as AnyRecord;
  const output = asArray(root.output);

  const fanoutQueries: string[] = [];
  const citations: Citation[] = [];
  let searched = false;

  for (const rawItem of output) {
    if (!rawItem || typeof rawItem !== 'object') continue;
    const item = rawItem as AnyRecord;

    if (item.type === 'web_search_call') {
      searched = true;
      const action = (item.action && typeof item.action === 'object' ? item.action : {}) as AnyRecord;
      if (typeof action.query === 'string' && action.query.trim()) {
        fanoutQueries.push(action.query.trim());
      }
      for (const q of asArray(action.queries)) {
        if (typeof q === 'string' && q.trim()) fanoutQueries.push(q.trim());
      }
      continue;
    }

    if (item.type === 'message') {
      for (const rawContent of asArray(item.content)) {
        if (!rawContent || typeof rawContent !== 'object') continue;
        const content = rawContent as AnyRecord;
        for (const rawAnn of asArray(content.annotations)) {
          if (!rawAnn || typeof rawAnn !== 'object') continue;
          const ann = rawAnn as AnyRecord;
          if (ann.type !== 'url_citation' || typeof ann.url !== 'string') continue;
          const domain = normalizeHost(ann.url);
          if (!domain) continue;
          citations.push({
            title: typeof ann.title === 'string' && ann.title.trim() ? ann.title.trim() : domain,
            url: ann.url,
            domain,
          });
        }
      }
    }
  }

  return { searched, fanoutQueries, citations, citedDomains: aggregateDomains(citations) };
}

function aggregateDomains(citations: Citation[]): CitedDomain[] {
  const map = new Map<string, CitedDomain>();
  for (const c of citations) {
    const existing = map.get(c.domain);
    if (existing) {
      existing.count += 1;
      if (!existing.urls.includes(c.url)) existing.urls.push(c.url);
    } else {
      map.set(c.domain, { domain: c.domain, count: 1, urls: [c.url] });
    }
  }
  return Array.from(map.values()).sort(
    (a, b) => b.count - a.count || a.domain.localeCompare(b.domain, 'pl')
  );
}
```

- [ ] **Step 5: Uruchom test — ma przejść**

Run: `pnpm --filter widocznosc.ai test fanout-parse`
Expected: PASS (6 testów).

- [ ] **Step 6: Commit**

```bash
git add portals/widocznosc.ai/functions/_lib/fanout-parse.ts portals/widocznosc.ai/functions/_lib/fanout-parse.test.ts portals/widocznosc.ai/functions/_lib/__fixtures__/fanout-response.json
git commit -m "feat(widocznosc): parser fan-outów i cytowań z Responses API"
```

---

## Task 3: Moduł rate-limit (KV)

**Files:**
- Create: `functions/_lib/rate-limit.ts`
- Test: `functions/_lib/rate-limit.test.ts`

- [ ] **Step 1: Napisz failujący test**

`functions/_lib/rate-limit.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { evaluateLimit, secondsToMidnight } from './rate-limit';

describe('secondsToMidnight', () => {
  it('liczy sekundy do północy z godziny lokalnej', () => {
    expect(secondsToMidnight(23, 59, 30)).toBe(30);
    expect(secondsToMidnight(0, 0, 0)).toBe(86400);
    expect(secondsToMidnight(12, 0, 0)).toBe(43200);
  });
});

describe('evaluateLimit', () => {
  it('pozwala, gdy poniżej limitu, i zwraca remaining po zużyciu', () => {
    expect(evaluateLimit(0, 3)).toEqual({ allowed: true, remaining: 2 });
    expect(evaluateLimit(2, 3)).toEqual({ allowed: true, remaining: 0 });
  });

  it('blokuje, gdy licznik osiągnął limit', () => {
    expect(evaluateLimit(3, 3)).toEqual({ allowed: false, remaining: 0 });
    expect(evaluateLimit(5, 3)).toEqual({ allowed: false, remaining: 0 });
  });

  it('traktuje ujemny/niepoprawny licznik jak zero', () => {
    expect(evaluateLimit(-1, 3)).toEqual({ allowed: true, remaining: 2 });
    expect(evaluateLimit(Number.NaN, 3)).toEqual({ allowed: true, remaining: 2 });
  });
});
```

- [ ] **Step 2: Uruchom — ma failować**

Run: `pnpm --filter widocznosc.ai test rate-limit`
Expected: FAIL — `Cannot find module './rate-limit'`.

- [ ] **Step 3: Zaimplementuj moduł**

`functions/_lib/rate-limit.ts`:
```ts
/**
 * Logika limitu zapytań. Czyste funkcje + helper czasu.
 * Stan trzymany w Cloudflare KV przez wołającego (functions/api/tools/fanout.ts).
 */

export type LimitDecision = { allowed: boolean; remaining: number };

/** Sekundy do najbliższej północy na podstawie godziny/minuty/sekundy w danej strefie. */
export function secondsToMidnight(hours: number, minutes: number, seconds: number): number {
  const elapsed = hours * 3600 + minutes * 60 + seconds;
  return 86400 - elapsed;
}

/** Sekundy do północy w strefie Europe/Warsaw dla podanego momentu. */
export function secondsUntilWarsawMidnight(now: Date): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Warsaw',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(now);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? '0');
  const ttl = secondsToMidnight(get('hour'), get('minute'), get('second'));
  return Math.max(60, ttl); // KV wymaga min. 60s TTL
}

/**
 * Decyzja przed zużyciem próby.
 * @param count aktualna liczba zużytych prób w oknie (z KV)
 * @param limit dzienny limit
 * @returns allowed + remaining PO zużyciu bieżącej próby
 */
export function evaluateLimit(count: number, limit: number): LimitDecision {
  const used = Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;
  const allowed = used < limit;
  const remaining = allowed ? Math.max(0, limit - used - 1) : 0;
  return { allowed, remaining };
}
```

- [ ] **Step 4: Uruchom — ma przejść**

Run: `pnpm --filter widocznosc.ai test rate-limit`
Expected: PASS (6 testów).

- [ ] **Step 5: Commit**

```bash
git add portals/widocznosc.ai/functions/_lib/rate-limit.ts portals/widocznosc.ai/functions/_lib/rate-limit.test.ts
git commit -m "feat(widocznosc): logika dziennego limitu zapytań"
```

---

## Task 4: Endpoint funkcji `fanout.ts`

**Files:**
- Create: `functions/api/tools/fanout.ts`

Brak testu jednostkowego dla samego handlera (integruje KV + sieć — pokryty manualnie w Task 7). Logika krytyczna jest już przetestowana w Task 2-3.

- [ ] **Step 1: Utwórz endpoint**

`functions/api/tools/fanout.ts`:
```ts
/**
 * Fan-out Check – pokazuje fan-out queries ChatGPT i cytowane domeny.
 *
 * Endpoint: POST /api/tools/fanout   Body: { query: string }
 * Wymaga: env OPENAI_API_KEY, binding KV FANOUT_RL.
 * Opcjonalne env: FANOUT_MODEL (domyślnie gpt-5-mini), FANOUT_DAILY_LIMIT (domyślnie 3).
 */
import { parseResponsesOutput } from '../../_lib/fanout-parse';
import { evaluateLimit, secondsUntilWarsawMidnight } from '../../_lib/rate-limit';

type Env = {
  OPENAI_API_KEY?: string;
  FANOUT_MODEL?: string;
  FANOUT_DAILY_LIMIT?: string;
  FANOUT_RL?: KVNamespace;
};

type FanoutRequest = { query?: string };
type LimitRecord = { count: number; resetAt: number };

const OPENAI_URL = 'https://api.openai.com/v1/responses';
const DEFAULT_MODEL = 'gpt-5-mini';
const DEFAULT_LIMIT = 3;
const LLM_TIMEOUT_MS = 45_000;
const MIN_QUERY = 3;
const MAX_QUERY = 300;

function jsonHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  };
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders() });
}

function jsonError(status: number, message: string, extra: Record<string, unknown> = {}): Response {
  return json({ error: message, ...extra }, status);
}

export const onRequestGet: PagesFunction = async () =>
  jsonError(405, 'Użyj POST z { "query": "twoje zapytanie" }');

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // 1. Walidacja wejścia
  let body: FanoutRequest;
  try {
    body = await request.json<FanoutRequest>();
  } catch {
    return jsonError(400, 'Nieprawidłowe body JSON.');
  }
  const query = String(body.query || '').replace(/\s+/g, ' ').trim();
  if (query.length < MIN_QUERY) return jsonError(400, 'Podaj zapytanie (min. 3 znaki).');
  if (query.length > MAX_QUERY) return jsonError(400, 'Zapytanie jest zbyt długie (max 300 znaków).');

  // 2. Konfiguracja
  const apiKey = (env.OPENAI_API_KEY || '').trim();
  if (!apiKey) {
    return json(
      {
        status: 'config-error',
        error: 'Narzędzie jest chwilowo niedostępne (brak konfiguracji OPENAI_API_KEY).',
      },
      500
    );
  }
  const model = (env.FANOUT_MODEL || DEFAULT_MODEL).trim();
  const limit = Number.parseInt(env.FANOUT_DAILY_LIMIT || '', 10) || DEFAULT_LIMIT;

  // 3. Rate-limit (odczyt) — wymaga bindingu KV
  const kv = env.FANOUT_RL;
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const kvKey = `fanout:${ip}`;
  const now = new Date();
  const ttl = secondsUntilWarsawMidnight(now);
  const resetAt = new Date(now.getTime() + ttl * 1000).toISOString();

  let record: LimitRecord = { count: 0, resetAt: now.getTime() + ttl * 1000 };
  if (kv) {
    const stored = await kv.get<LimitRecord>(kvKey, 'json');
    if (stored && typeof stored.count === 'number') record = stored;
  }

  const decision = evaluateLimit(record.count, limit);
  if (!decision.allowed) {
    return jsonError(429, `Wykorzystałeś dzienny limit (${limit} zapytań). Reset o północy.`, {
      remaining: 0,
      limit,
      resetAt,
    });
  }

  // 4. Wywołanie OpenAI Responses API
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort('llm-timeout'), LLM_TIMEOUT_MS);
  let openaiResponse: Response;
  try {
    openaiResponse = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        tools: [{ type: 'web_search' }],
        tool_choice: 'auto',
        input: query,
      }),
    });
  } catch (error) {
    clearTimeout(timeout);
    const aborted = error instanceof DOMException && error.name === 'AbortError';
    return jsonError(
      500,
      aborted ? 'Przekroczono czas odpowiedzi. Spróbuj ponownie.' : 'Nie udało się połączyć z OpenAI. Spróbuj ponownie.'
    );
  }
  clearTimeout(timeout);

  if (!openaiResponse.ok) {
    const text = await openaiResponse.text().catch(() => '');
    return jsonError(500, `Błąd OpenAI (HTTP ${openaiResponse.status}). Spróbuj ponownie.`, {
      detail: text.slice(0, 200),
    });
  }

  const raw = await openaiResponse.json().catch(() => null);
  const parsed = parseResponsesOutput(raw);

  // 5. Inkrement limitu DOPIERO po udanej odpowiedzi
  if (kv) {
    const newCount = (Number.isFinite(record.count) && record.count > 0 ? record.count : 0) + 1;
    await kv.put(kvKey, JSON.stringify({ count: newCount, resetAt: record.resetAt }), {
      expirationTtl: Math.max(60, Math.ceil((record.resetAt - now.getTime()) / 1000)),
    });
  }

  // 6. Odpowiedź
  return json({
    query,
    model: (raw && typeof raw === 'object' && 'model' in raw ? (raw as { model?: string }).model : model) || model,
    status: parsed.searched ? 'ok' : 'no-search',
    fanoutQueries: parsed.fanoutQueries,
    citedDomains: parsed.citedDomains,
    citations: parsed.citations,
    usage: { remaining: decision.remaining, limit, resetAt },
    fetchedAt: now.toISOString(),
  });
};
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter widocznosc.ai exec astro check 2>&1 | tail -20`
Expected: brak błędów w `functions/api/tools/fanout.ts` (KVNamespace pochodzi z `@cloudflare/workers-types`, już w `tsconfig`).

- [ ] **Step 3: Commit**

```bash
git add portals/widocznosc.ai/functions/api/tools/fanout.ts
git commit -m "feat(widocznosc): endpoint /api/tools/fanout (Responses API + KV limit)"
```

---

## Task 5: Binding KV w `wrangler.toml`

**Files:**
- Modify: `wrangler.toml`

- [ ] **Step 1: Dodaj binding KV (placeholdery ID do uzupełnienia przy deployu)**

Dopisz na końcu `wrangler.toml`:
```toml

# KV dla rate-limitu narzędzia fan-out (3/IP/dzień).
# ID utworzysz komendami w Task 7 i wstawisz poniżej.
[[kv_namespaces]]
binding = "FANOUT_RL"
id = "REPLACE_WITH_PROD_KV_ID"
preview_id = "REPLACE_WITH_PREVIEW_KV_ID"
```

- [ ] **Step 2: Commit**

```bash
git add portals/widocznosc.ai/wrangler.toml
git commit -m "chore(widocznosc): binding KV FANOUT_RL dla rate-limitu"
```

---

## Task 6: Strona narzędzia `fanout.astro`

**Files:**
- Create: `src/pages/narzedzia/fanout.astro`

Strona reużywa istniejących klas CSS narzędzi (`tool-hero`, `tool-breadcrumb`, `content-container`, `eyebrow`, `btn-primary`) + własny scoped `<style>` na wyniki. JS w `<script>` inicjalizowany na `astro:page-load` (wzorzec z `brand-check.astro`).

- [ ] **Step 1: Utwórz stronę**

`src/pages/narzedzia/fanout.astro`:
```astro
---
import Layout from '../../layouts/Layout.astro';
import Navbar from '../../components/Navbar.astro';
import Footer from '../../components/Footer.astro';
import ScrollUpButton from '../../components/ScrollUpButton.astro';

const examples = [
  'najlepsza agencja SEO w Polsce',
  'jak wybrać system CRM dla firmy',
  'najlepszy bank dla firmy 2026',
];
---

<Layout
  title="Fan-out ChatGPT – jak AI naprawdę szuka i kogo cytuje"
  description="Zobacz fan-out queries, które ChatGPT generuje przy wyszukiwaniu, oraz ranking domen cytowanych w odpowiedzi. Bezpłatne demo widocznosc.ai."
>
  <Navbar />

  <main class="flex-grow">
    <section class="tool-hero">
      <div class="content-container tool-hero-inner">
        <nav class="tool-breadcrumb" aria-label="Ścieżka nawigacji">
          <a href="/narzedzia" class="tool-breadcrumb-link">Narzędzia</a>
          <span class="tool-breadcrumb-sep" aria-hidden="true">/</span>
          <span class="tool-breadcrumb-current">Fan-out ChatGPT</span>
        </nav>

        <header class="text-center">
          <span class="eyebrow tool-eyebrow">Narzędzie · beta</span>
          <h1 class="tool-hero-title">
            Jak ChatGPT&nbsp;<span class="tool-hero-accent">naprawdę szuka</span> i kogo cytuje
          </h1>
          <p class="tool-hero-copy">
            Wpisujesz zapytanie, a&nbsp;my pokazujemy fan-out queries – realne sub-zapytania,
            które ChatGPT wysyła do&nbsp;wyszukiwarki – oraz ranking domen cytowanych w&nbsp;odpowiedzi.
          </p>
        </header>

        <form id="fanout-form" class="fanout-form" novalidate>
          <label class="fanout-field">
            <span>Zapytanie</span>
            <input
              id="fanout-input"
              name="query"
              type="text"
              required
              maxlength="300"
              autocomplete="off"
              placeholder="np. najlepsza agencja SEO w Polsce"
            />
          </label>
          <button type="submit" class="btn-primary fanout-submit">Pokaż fan-out</button>
          <div class="fanout-examples" aria-label="Przykładowe zapytania">
            {examples.map((ex) => (
              <button type="button" class="fanout-example" data-query={ex}>{ex}</button>
            ))}
          </div>
        </form>

        <div id="fanout-results" class="fanout-results hidden" aria-live="polite"></div>

        <p class="fanout-note">
          Wyniki odzwierciedlają warstwę wyszukiwania ChatGPT (model gpt-5-mini). Limit: 3 zapytania dziennie.
        </p>
      </div>
    </section>
  </main>

  <Footer />
  <ScrollUpButton />
</Layout>

<style>
  .fanout-form { max-width: 720px; margin: 2.5rem auto 0; display: flex; flex-direction: column; gap: 0.75rem; }
  .fanout-field { display: flex; flex-direction: column; gap: 0.4rem; text-align: left; font-weight: 600; }
  .fanout-field input {
    width: 100%; padding: 0.9rem 1rem; border-radius: 0.75rem;
    border: 1px solid color-mix(in srgb, currentColor 18%, transparent);
    background: color-mix(in srgb, currentColor 4%, transparent); font-size: 1rem;
  }
  .fanout-submit { align-self: flex-start; }
  .fanout-examples { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.25rem; }
  .fanout-example {
    font-size: 0.85rem; padding: 0.35rem 0.75rem; border-radius: 999px; cursor: pointer;
    border: 1px solid color-mix(in srgb, currentColor 20%, transparent);
    background: transparent; color: inherit; opacity: 0.8;
  }
  .fanout-example:hover { opacity: 1; }
  .fanout-results { max-width: 820px; margin: 2.5rem auto 0; text-align: left; display: grid; gap: 1.5rem; }
  .fanout-results.hidden { display: none; }
  .fanout-panel {
    border: 1px solid color-mix(in srgb, currentColor 14%, transparent);
    border-radius: 1rem; padding: 1.5rem;
    background: color-mix(in srgb, currentColor 3%, transparent);
  }
  .fanout-panel h2 { font-size: 1.15rem; margin: 0 0 1rem; }
  .fanout-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.5rem; counter-reset: fq; }
  .fanout-list li {
    padding: 0.6rem 0.9rem; border-radius: 0.6rem;
    background: color-mix(in srgb, currentColor 5%, transparent); font-family: ui-monospace, monospace; font-size: 0.9rem;
  }
  .domain-row { display: flex; align-items: center; gap: 0.75rem; padding: 0.55rem 0; border-bottom: 1px solid color-mix(in srgb, currentColor 10%, transparent); }
  .domain-row:last-child { border-bottom: 0; }
  .domain-name { font-weight: 700; }
  .domain-count {
    margin-left: auto; font-size: 0.8rem; font-weight: 700; padding: 0.15rem 0.6rem; border-radius: 999px;
    background: color-mix(in srgb, currentColor 12%, transparent);
  }
  .domain-urls { display: grid; gap: 0.2rem; margin: 0.1rem 0 0.6rem; padding-left: 0.5rem; }
  .domain-urls a { font-size: 0.8rem; opacity: 0.75; word-break: break-all; }
  .fanout-error { padding: 1rem 1.25rem; border-radius: 0.75rem; background: color-mix(in srgb, #ef4444 14%, transparent); color: #b91c1c; }
  .fanout-cta { margin-top: 0.75rem; }
  .fanout-note { margin-top: 1.25rem; text-align: center; font-size: 0.8rem; opacity: 0.6; }
</style>

<script>
  const initFanout = () => {
    const form = document.getElementById('fanout-form');
    const input = document.getElementById('fanout-input');
    const results = document.getElementById('fanout-results');
    if (!form || !results || !input) return;

    const submit = form.querySelector('button[type="submit"]');

    function escapeHtml(value) {
      return String(value ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function setLoading(isLoading) {
      if (!submit) return;
      submit.disabled = isLoading;
      submit.setAttribute('aria-busy', isLoading ? 'true' : 'false');
    }

    function renderError(message) {
      results.classList.remove('hidden');
      results.innerHTML = `<div class="fanout-error">${escapeHtml(message)}</div>`;
    }

    function renderResults(data) {
      if (data.status === 'no-search') {
        results.innerHTML = `<div class="fanout-panel"><h2>Brak fan-outów</h2><p>Dla tego zapytania ChatGPT nie uruchomił wyszukiwania w sieci. Spróbuj bardziej „wyszukiwalnego" pytania.</p></div>`;
        return;
      }

      const fanouts = (data.fanoutQueries || []).map((q) => `<li>${escapeHtml(q)}</li>`).join('');
      const domains = (data.citedDomains || [])
        .map((d) => `
          <div>
            <div class="domain-row">
              <span class="domain-name">${escapeHtml(d.domain)}</span>
              <span class="domain-count">${escapeHtml(String(d.count))} cyt.</span>
            </div>
            <div class="domain-urls">
              ${(d.urls || []).map((u) => `<a href="${escapeHtml(u)}" target="_blank" rel="nofollow noopener">${escapeHtml(u)}</a>`).join('')}
            </div>
          </div>`)
        .join('');

      const remaining = data.usage?.remaining ?? 0;
      const ctaHtml = remaining <= 0
        ? `<p class="fanout-cta"><a class="btn-primary" href="/kontakt">Chcesz pełny audyt widoczności w AI? Napisz do nas</a></p>`
        : `<p class="fanout-note">Pozostały Ci dziś ${escapeHtml(String(remaining))} zapytania.</p>`;

      results.innerHTML = `
        <section class="fanout-panel">
          <h2>Fan-out queries (${escapeHtml(String((data.fanoutQueries || []).length))})</h2>
          <p style="opacity:.7;margin:-0.5rem 0 1rem;font-size:.9rem">Sub-zapytania, które ChatGPT wysłał do wyszukiwarki dla: „${escapeHtml(data.query)}".</p>
          <ul class="fanout-list">${fanouts || '<li>brak</li>'}</ul>
        </section>
        <section class="fanout-panel">
          <h2>Kto jest cytowany (${escapeHtml(String((data.citedDomains || []).length))} domen)</h2>
          <p style="opacity:.7;margin:-0.5rem 0 1rem;font-size:.9rem">Domeny, które ChatGPT zacytował, posortowane wg liczby cytowań.</p>
          ${domains || '<p>Brak cytowań w odpowiedzi.</p>'}
        </section>
        ${ctaHtml}
      `;
    }

    form.querySelectorAll('.fanout-example').forEach((btn) => {
      btn.addEventListener('click', () => {
        input.value = btn.getAttribute('data-query') || '';
        form.requestSubmit();
      });
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const query = String(input.value || '').trim();
      if (query.length < 3) { renderError('Podaj zapytanie (min. 3 znaki).'); return; }

      setLoading(true);
      results.classList.remove('hidden');
      results.innerHTML = `<div class="fanout-panel"><h2>Pytamy ChatGPT o „${escapeHtml(query)}"…</h2><p style="opacity:.7">Trwa wyszukiwanie i analiza fan-outów (10-30 s).</p></div>`;

      try {
        const response = await fetch('/api/tools/fanout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query }),
        });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || `HTTP ${response.status}`);
        renderResults(body);
      } catch (error) {
        renderError(error instanceof Error ? error.message : 'Nie udało się wykonać zapytania.');
      } finally {
        setLoading(false);
      }
    });
  };

  document.addEventListener('astro:page-load', initFanout);
</script>
```

- [ ] **Step 2: Typecheck / build**

Run: `pnpm --filter widocznosc.ai build 2>&1 | tail -20`
Expected: build kończy się sukcesem, strona `/narzedzia/fanout` w `dist`.

- [ ] **Step 3: Commit**

```bash
git add portals/widocznosc.ai/src/pages/narzedzia/fanout.astro
git commit -m "feat(widocznosc): strona narzędzia /narzedzia/fanout"
```

---

## Task 7: Kafelek na liście narzędzi

**Files:**
- Modify: `src/pages/narzedzia.astro`

- [ ] **Step 1: Dodaj wpis do tablicy `tools`**

W `src/pages/narzedzia.astro` w tablicy `const tools = [` dodaj jako pierwszy obiekt (albo po `brand-check`, wg kolejności którą chcesz pokazać):
```ts
  {
    id: 'fanout',
    status: 'beta',
    eyebrow: 'Bezpłatne · 30s',
    title: 'Fan-out ChatGPT',
    subtitle: 'Jak ChatGPT naprawdę szuka i kogo cytuje',
    desc:
      'Wpisujesz zapytanie, a my przez OpenAI Responses API pokazujemy fan-out queries – realne sub-zapytania, które ChatGPT wysyła do wyszukiwarki – oraz ranking domen cytowanych w odpowiedzi. Zobacz, kto wygrywa widoczność w AI dla Twoich fraz.',
    cta: { label: 'Pokaż fan-out', href: '/narzedzia/fanout' },
    bullets: [
      'Realne fan-out queries ChatGPT (web_search)',
      'Ranking cytowanych domen wg liczby cytowań',
      'Bez logowania, wynik w ~30 s',
      'Limit 3 zapytania dziennie',
    ],
  },
```

- [ ] **Step 2: Build sanity**

Run: `pnpm --filter widocznosc.ai build 2>&1 | tail -5`
Expected: sukces; kafelek „Fan-out ChatGPT" renderuje się na `/narzedzia`.

- [ ] **Step 3: Commit**

```bash
git add portals/widocznosc.ai/src/pages/narzedzia.astro
git commit -m "feat(widocznosc): kafelek Fan-out ChatGPT na liście narzędzi"
```

---

## Task 8: Provisioning KV + sekret + weryfikacja end-to-end

Ten task to działania deployowe i ręczna weryfikacja (część poza repo). Wykonuje człowiek z dostępem do Cloudflare; kroki `wrangler` mogą wymagać `wrangler login`.

- [ ] **Step 1: Utwórz KV namespace (prod + preview)**

Run (w `portals/widocznosc.ai`):
```bash
pnpm dlx wrangler kv namespace create FANOUT_RL
pnpm dlx wrangler kv namespace create FANOUT_RL --preview
```
Expected: dwa ID (`id` i `preview_id`).

- [ ] **Step 2: Wstaw ID do `wrangler.toml`**

Podmień `REPLACE_WITH_PROD_KV_ID` / `REPLACE_WITH_PREVIEW_KV_ID` w `wrangler.toml` na ID z kroku 1. Commit:
```bash
git add portals/widocznosc.ai/wrangler.toml
git commit -m "chore(widocznosc): wpisz ID namespace KV FANOUT_RL"
```

- [ ] **Step 3: Dodaj sekret `OPENAI_API_KEY` w projekcie Pages**

W panelu Cloudflare Pages (Settings → Environment variables → Production i Preview) dodaj `OPENAI_API_KEY` jako secret. NIE commituj klucza. (Opcjonalnie `FANOUT_MODEL`, `FANOUT_DAILY_LIMIT`.)
W panelu Pages → Functions → KV namespace bindings podłącz `FANOUT_RL` do utworzonego namespace dla Production i Preview.

- [ ] **Step 4: Lokalna weryfikacja funkcji (opcjonalnie, z prawdziwym kluczem)**

Run (z `OPENAI_API_KEY` w środowisku):
```bash
pnpm --filter widocznosc.ai build
pnpm dlx wrangler pages dev dist --kv FANOUT_RL
# w drugim terminalu:
curl -s -X POST http://localhost:8788/api/tools/fanout \
  -H 'Content-Type: application/json' \
  -d '{"query":"najlepsza agencja SEO w Polsce"}' | head -40
```
Expected: JSON z niepustym `fanoutQueries` i `citedDomains`, `usage.remaining` = 2.

- [ ] **Step 5: Weryfikacja limitu**

Powtórz `curl` 4 razy. Expected: 4. odpowiedź to HTTP 429 z `{ error, remaining: 0, resetAt }`.

- [ ] **Step 6: Uruchom pełny zestaw testów**

Run: `pnpm --filter widocznosc.ai test`
Expected: wszystkie testy (parser + rate-limit) PASS.

- [ ] **Step 7: Finalizacja brancha**

Po zielonych testach i weryfikacji użyj skilla `superpowers:finishing-a-development-branch` (merge / PR wg preferencji).

---

## Self-Review (wykonany przy pisaniu planu)

**Spec coverage:** ✅ endpoint (Task 4), KV 3/IP/dzień (Task 3+4+5+8), parser fan-outy+domeny (Task 2), strona z 2 sekcjami (Task 6), kafelek (Task 7), `gpt-5-mini` domyślny + konfigurowalny (Task 4), stany błędów/`429`/`config-error` (Task 4), testy parsera/limitu (Task 2-3), brak sekretów w repo (Task 5+8), kryteria akceptacji pokryte w Task 8.

**Placeholder scan:** jedyne celowe placeholdery to ID KV w `wrangler.toml` (uzupełniane w Task 8 — nie da się znać ID przed utworzeniem namespace). Brak innych TBD.

**Type consistency:** `parseResponsesOutput` zwraca `{ searched, fanoutQueries, citations, citedDomains }` — używane spójnie w Task 4 i 6. `evaluateLimit(count, limit) → { allowed, remaining }` i `secondsUntilWarsawMidnight(Date) → number` zgodne z użyciem w `fanout.ts`. Pola odpowiedzi (`fanoutQueries`, `citedDomains`, `usage.remaining`, `status`) spójne między backendem (Task 4) a frontendem (Task 6).
