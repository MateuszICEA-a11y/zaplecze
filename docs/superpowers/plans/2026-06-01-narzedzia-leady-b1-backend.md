# Łapanie leadów w narzędziach – Plan B1 (backend) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Backend lead-genu w narzędziach: endpoint `/api/tools/send-report` wysyła pełny raport per narzędzie do usera + powiadomienie leadowe (z flagą zgody) do ICEA, z rate-limitem i anty-abuse.

**Architecture:** Wyciągamy wspólny szablon maila z `_lib/contact.ts` do `_lib/email-shell.ts`. Dodajemy composable helpery (`_lib/reports/components.ts`), 4 czyste renderery `_lib/reports/<tool>.ts` (result → {subject, html}) i dispatcher. Czysta walidacja + powiadomienie leadowe w `_lib/send-report.ts`. Endpoint `functions/api/tools/send-report.ts` spina to z Resend + `checkToolLimit` (z Planu A). Frontend = osobny Plan B2.

**Tech Stack:** Cloudflare Pages Functions (TypeScript), Resend, KV, vitest.

---

## File Structure

- Create: `functions/_lib/email-shell.ts` – `escapeHtml`, paleta `C`, `emailShell()` (przeniesione z contact.ts).
- Modify: `functions/_lib/contact.ts` – import z email-shell zamiast lokalnych kopii.
- Create: `functions/_lib/reports/components.ts` – composable bloki email-HTML (heading, paragraph, pill, statGrid, list, actionItems).
- Create: `functions/_lib/reports/brand-check.ts` / `fanout.ts` / `url-check.ts` / `ai-bots-check.ts` – `renderReport(result, query)`.
- Create: `functions/_lib/reports/index.ts` – `TOOLS`, `toolLabel()`, `renderToolReport(tool, result, query)` (dispatcher).
- Create: `functions/_lib/send-report.ts` – typy payloadu, `validateReportPayload()`, `buildLeadNotification()`.
- Create: `functions/api/tools/send-report.ts` – endpoint POST.
- Test: `*.test.ts` obok każdego nowego `_lib` pliku.

Reużycie z Planu A: `_lib/tool-rate-limit.ts` (`resolveLimit`, `checkToolLimit`). Reużycie Resend z `api/contact.ts` (`FROM`, `LEAD_TO`, wzorzec `sendViaResend`).

---

### Task 1: Wyciągnięcie wspólnego szablonu maila

**Files:**
- Create: `functions/_lib/email-shell.ts`
- Modify: `functions/_lib/contact.ts`
- Test: `functions/_lib/email-shell.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// functions/_lib/email-shell.test.ts
import { describe, it, expect } from 'vitest';
import { escapeHtml, emailShell, C } from './email-shell';

describe('escapeHtml', () => {
  it('escapuje znaki HTML', () => {
    expect(escapeHtml('<a "x" & \'y\'>')).toBe('&lt;a &quot;x&quot; &amp; &#39;y&#39;&gt;');
  });
});

describe('emailShell', () => {
  it('opakowuje treść w szkielet z nagłówkiem i stopką ICEA', () => {
    const html = emailShell('<tr><td>TREŚĆ</td></tr>', 'preheader');
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('TREŚĆ');
    expect(html).toContain('ICEA S.A.');
    expect(html).toContain('preheader');
  });
  it('paleta C ma kolory brandu', () => {
    expect(C.accent).toBe('#0a9cff');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd portals/widocznosc.ai && npx vitest run functions/_lib/email-shell.test.ts`
Expected: FAIL – `Cannot find module './email-shell'`.

- [ ] **Step 3: Utwórz email-shell.ts (przenieś kod z contact.ts)**

Skopiuj z `functions/_lib/contact.ts` funkcję `escapeHtml` (linie 77–84), obiekt `C` (96–108) i funkcję `emailShell` (110–135) do nowego pliku, eksportując je:

```typescript
// functions/_lib/email-shell.ts
/**
 * Wspólny szkielet brandowanego maila widocznosc.ai (table-layout, inline CSS,
 * kompatybilny z Gmail/Outlook). Używany przez formularz /kontakt i raporty narzędzi.
 */

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── Paleta brandu (email-safe, wartości z Theme.css) ──
export const C = {
  dark: '#0b1020',
  accent: '#0a9cff',
  accentDark: '#0068cc',
  accentSoft: '#e6f4ff',
  page: '#eef2f7',
  card: '#ffffff',
  ink: '#0f172a',
  inkMuted: '#64748b',
  line: '#e2e8f0',
  msgBg: '#f1f5f9',
};

/** Wspólny szkielet maila. `bodyInner` to wiersze <tr>…</tr> wstrzyknięte między nagłówek a stopkę. */
export function emailShell(bodyInner: string, preheader = ''): string {
  return (
    `<!DOCTYPE html><html lang="pl"><head><meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width,initial-scale=1"></head>` +
    `<body style="margin:0;padding:0;background:${C.page};">` +
    (preheader
      ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>`
      : '') +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.page};padding:24px 12px;">` +
    `<tr><td align="center">` +
    `<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${C.card};border-radius:14px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;box-shadow:0 1px 3px rgba(15,23,42,.08);">` +
    `<tr><td style="background:${C.dark};padding:22px 32px;">` +
    `<span style="font-size:20px;font-weight:700;letter-spacing:-.4px;color:#fff;">widocznosc<span style="color:${C.accent};">.ai</span></span>` +
    `</td></tr>` +
    bodyInner +
    `<tr><td style="padding:22px 32px;border-top:1px solid ${C.line};">` +
    `<p style="margin:0;font-size:12px;line-height:1.6;color:${C.inkMuted};">` +
    `ICEA S.A. · ul. Szyperska 14 · 61-754 Poznań<br>` +
    `Flagowy projekt <a href="https://grupa-icea.pl" style="color:${C.accentDark};text-decoration:none;">grupa-icea.pl</a> · pozycjonowanie marek w wyszukiwarkach AI` +
    `</p></td></tr>` +
    `</table></td></tr></table></body></html>`
  );
}
```

- [ ] **Step 4: Refaktor contact.ts – usuń lokalne kopie, importuj z email-shell**

W `functions/_lib/contact.ts`:
1. Dodaj na górze (po istniejących importach/typach, przed `CONTACT_TYPES`):

```typescript
import { escapeHtml, emailShell, C } from './email-shell';
```

2. Usuń lokalne definicje: `function escapeHtml` (77–84), `const C = {…}` (96–108), `function emailShell` (110–135). Komentarz „── Paleta brandu ──" też usuń.

- [ ] **Step 5: Run tests to verify pass**

Run: `npx vitest run functions/_lib/email-shell.test.ts functions/_lib/contact.test.ts && npx tsc --noEmit`
Expected: nowe testy PASS, istniejące testy contact PASS, tsc bez błędów (contact.ts używa importowanych `escapeHtml`/`emailShell`/`C`).

- [ ] **Step 6: Commit**

```bash
git add functions/_lib/email-shell.ts functions/_lib/email-shell.test.ts functions/_lib/contact.ts
git commit -m "refactor(widocznosc): wspólny szablon maila w _lib/email-shell (z contact.ts)"
```

---

### Task 2: Composable helpery raportu

**Files:**
- Create: `functions/_lib/reports/components.ts`
- Test: `functions/_lib/reports/components.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// functions/_lib/reports/components.test.ts
import { describe, it, expect } from 'vitest';
import { heading, paragraph, pill, statGrid, list, actionItems } from './components';

describe('komponenty raportu', () => {
  it('heading escapuje treść', () => {
    expect(heading('<b>X</b>')).toContain('&lt;b&gt;X&lt;/b&gt;');
  });
  it('statGrid renderuje pary label/wartość', () => {
    const html = statGrid([['Wynik', '72/100'], ['Modele', '3/4']]);
    expect(html).toContain('72/100');
    expect(html).toContain('Modele');
  });
  it('list escapuje pozycje', () => {
    expect(list(['a & b'])).toContain('a &amp; b');
  });
  it('actionItems pokazuje priorytet i tytuł', () => {
    const html = actionItems([{ priority: 'P0', title: 'Zrób X', description: 'opis' }]);
    expect(html).toContain('P0');
    expect(html).toContain('Zrób X');
    expect(html).toContain('opis');
  });
  it('pusta lista actionItems → pusty string', () => {
    expect(actionItems([])).toBe('');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run functions/_lib/reports/components.test.ts`
Expected: FAIL – `Cannot find module './components'`.

- [ ] **Step 3: Implement**

```typescript
// functions/_lib/reports/components.ts
/** Composable bloki email-HTML dla raportów narzędzi. Wszystkie wartości escapowane. */
import { escapeHtml, C } from '../email-shell';

/** Sekcja-wiersz: tytuł + dowolny HTML wewnątrz (już zbudowany przez wołającego). */
export function section(titleText: string, innerHtml: string): string {
  return (
    `<tr><td style="padding:8px 32px 4px;">` +
    `<div style="font-size:11px;letter-spacing:.6px;text-transform:uppercase;color:${C.inkMuted};margin:16px 0 8px;">${escapeHtml(titleText)}</div>` +
    innerHtml +
    `</td></tr>`
  );
}

export function heading(text: string, badgeText?: string): string {
  const badge = badgeText
    ? `<span style="display:inline-block;background:${C.accentSoft};color:${C.accentDark};font-size:12px;font-weight:600;padding:5px 12px;border-radius:999px;margin-bottom:10px;">${escapeHtml(badgeText)}</span><br>`
    : '';
  return (
    `<tr><td style="padding:32px 32px 4px;">` +
    badge +
    `<h1 style="margin:6px 0 0;font-size:22px;line-height:1.3;color:${C.ink};">${escapeHtml(text)}</h1>` +
    `</td></tr>`
  );
}

export function paragraph(text: string): string {
  return (
    `<tr><td style="padding:6px 32px;">` +
    `<p style="margin:0;font-size:15px;line-height:1.7;color:${C.ink};">${escapeHtml(text)}</p>` +
    `</td></tr>`
  );
}

export function pill(text: string): string {
  return `<span style="display:inline-block;background:${C.accentSoft};color:${C.accentDark};font-size:12px;font-weight:600;padding:4px 10px;border-radius:999px;margin:0 6px 6px 0;">${escapeHtml(text)}</span>`;
}

/** Tabela par [label, wartość]. Zwraca surowy HTML (do wstrzyknięcia w section()). */
export function statGrid(rows: Array<[string, string]>): string {
  const cells = rows
    .map(
      ([k, v]) =>
        `<td style="padding:10px 14px;background:${C.msgBg};border-radius:8px;">` +
        `<div style="font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:${C.inkMuted};">${escapeHtml(k)}</div>` +
        `<div style="font-size:18px;font-weight:700;color:${C.ink};margin-top:2px;">${escapeHtml(v)}</div>` +
        `</td>`,
    )
    .join('<td style="width:8px;"></td>');
  return `<table role="presentation" cellpadding="0" cellspacing="0"><tr>${cells}</tr></table>`;
}

export function list(items: string[]): string {
  if (items.length === 0) return `<p style="margin:0;font-size:14px;color:${C.inkMuted};">—</p>`;
  return (
    `<ul style="margin:0;padding-left:18px;">` +
    items.map((i) => `<li style="font-size:14px;line-height:1.6;color:${C.ink};">${escapeHtml(i)}</li>`).join('') +
    `</ul>`
  );
}

export function actionItems(
  items: Array<{ priority: string; title: string; description: string }>,
): string {
  if (items.length === 0) return '';
  return items
    .map(
      (a) =>
        `<div style="border-left:3px solid ${C.accent};background:${C.msgBg};border-radius:6px;padding:10px 14px;margin:0 0 8px;">` +
        `<div style="font-size:11px;font-weight:700;color:${C.accentDark};">${escapeHtml(a.priority)}</div>` +
        `<div style="font-size:15px;font-weight:600;color:${C.ink};margin:2px 0;">${escapeHtml(a.title)}</div>` +
        `<div style="font-size:14px;line-height:1.6;color:${C.inkMuted};">${escapeHtml(a.description)}</div>` +
        `</div>`,
    )
    .join('');
}
```

- [ ] **Step 4: Run test to verify pass**

Run: `npx vitest run functions/_lib/reports/components.test.ts`
Expected: PASS (5 testów).

- [ ] **Step 5: Commit**

```bash
git add functions/_lib/reports/components.ts functions/_lib/reports/components.test.ts
git commit -m "feat(widocznosc): composable helpery email-HTML dla raportów narzędzi"
```

---

### Task 3: Renderer raportu – brand-check

**Files:**
- Create: `functions/_lib/reports/brand-check.ts`
- Test: `functions/_lib/reports/brand-check.test.ts`

Typ wyniku (z `functions/api/tools/brand-check.ts:64`): `BrandCheckResponse { brand, market, summary{score,knownBy,totalModels,sentiment,competitors[]}, models[]{label,knowsBrand,sentiment,confidence,summary}, actionItems[]{priority,title,description} }`.

- [ ] **Step 1: Write the failing test**

```typescript
// functions/_lib/reports/brand-check.test.ts
import { describe, it, expect } from 'vitest';
import { renderReport } from './brand-check';

const result = {
  brand: 'ICEA',
  market: 'Polska',
  summary: { score: 72, knownBy: 3, totalModels: 4, sentiment: 'positive', competitors: ['Konkurent A'] },
  models: [
    { label: 'ChatGPT', knowsBrand: 'yes', sentiment: 'positive', confidence: 0.9, summary: 'Zna markę.' },
  ],
  actionItems: [{ priority: 'P1', title: 'Dodaj schema', description: 'Organization JSON-LD.' }],
};

describe('renderReport brand-check', () => {
  it('subject zawiera nazwę marki', () => {
    expect(renderReport(result as any, 'ICEA').subject).toContain('ICEA');
  });
  it('html zawiera wynik, model i action item', () => {
    const { html } = renderReport(result as any, 'ICEA');
    expect(html).toContain('72');
    expect(html).toContain('ChatGPT');
    expect(html).toContain('Dodaj schema');
    expect(html).toContain('ICEA S.A.'); // stopka shell
  });
  it('escapuje nazwę marki', () => {
    const { html } = renderReport({ ...result, brand: '<x>' } as any, '<x>');
    expect(html).toContain('&lt;x&gt;');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run functions/_lib/reports/brand-check.test.ts`
Expected: FAIL – brak modułu.

- [ ] **Step 3: Implement**

```typescript
// functions/_lib/reports/brand-check.ts
import { emailShell } from '../email-shell';
import { heading, paragraph, section, statGrid, list, actionItems } from './components';

const SENTIMENT_PL: Record<string, string> = {
  positive: 'pozytywny', neutral: 'neutralny', negative: 'negatywny', mixed: 'mieszany', unknown: 'nieznany',
};
const KNOWS_PL: Record<string, string> = { yes: 'zna', partial: 'częściowo', no: 'nie zna' };

type BrandResult = {
  brand: string; market: string;
  summary: { score: number; knownBy: number; totalModels: number; sentiment: string; competitors: string[] };
  models: Array<{ label: string; knowsBrand: string; sentiment: string; confidence: number; summary: string }>;
  actionItems: Array<{ priority: string; title: string; description: string }>;
};

export function renderReport(result: BrandResult, _query: string): { subject: string; html: string } {
  const s = result.summary;
  const modelsHtml = result.models
    .map(
      (m) =>
        `<div style="border:1px solid #e2e8f0;border-radius:8px;padding:10px 14px;margin:0 0 8px;">` +
        `<strong style="font-size:15px;color:#0f172a;">${escape(m.label)}</strong> ` +
        `<span style="font-size:13px;color:#64748b;">· ${escape(KNOWS_PL[m.knowsBrand] ?? m.knowsBrand)} · ${escape(SENTIMENT_PL[m.sentiment] ?? m.sentiment)} · pewność ${Math.round((m.confidence ?? 0) * 100)}%</span>` +
        `<div style="font-size:14px;line-height:1.6;color:#0f172a;margin-top:4px;">${escape(m.summary)}</div>` +
        `</div>`,
    )
    .join('');

  const body =
    heading(`Raport widoczności marki: ${result.brand}`, `Rynek: ${result.market}`) +
    paragraph(`Tak modele AI postrzegają Twoją markę. Wynik widoczności: ${s.score}/100.`) +
    section('Podsumowanie', statGrid([
      ['Wynik', `${s.score}/100`],
      ['Rozpoznawalność', `${s.knownBy}/${s.totalModels} modeli`],
      ['Sentyment', SENTIMENT_PL[s.sentiment] ?? s.sentiment],
    ])) +
    section('Konkurenci wskazani przez modele', list(s.competitors)) +
    section('Odpowiedzi modeli', modelsHtml || list([])) +
    (result.actionItems.length ? section('Rekomendacje', actionItems(result.actionItems)) : '');

  return {
    subject: `Raport widoczności marki w AI: ${result.brand} – widocznosc.ai`,
    html: emailShell(body, `Wynik widoczności ${result.brand}: ${s.score}/100`),
  };
}

// lokalny escape dla wstawek budowanych inline (components escapują u siebie)
import { escapeHtml as escape } from '../email-shell';
```

- [ ] **Step 4: Run test to verify pass**

Run: `npx vitest run functions/_lib/reports/brand-check.test.ts`
Expected: PASS (3 testy).

- [ ] **Step 5: Commit**

```bash
git add functions/_lib/reports/brand-check.ts functions/_lib/reports/brand-check.test.ts
git commit -m "feat(widocznosc): renderer raportu e-mail dla brand-check"
```

---

### Task 4: Renderer raportu – fanout

**Files:**
- Create: `functions/_lib/reports/fanout.ts`
- Test: `functions/_lib/reports/fanout.test.ts`

Typ wyniku (z `fanout.ts` json): `{ query, answer, fanoutQueries[], citedDomains[]{domain,count}, citations[]{title,url,domain} }`.

- [ ] **Step 1: Write the failing test**

```typescript
// functions/_lib/reports/fanout.test.ts
import { describe, it, expect } from 'vitest';
import { renderReport } from './fanout';

const result = {
  query: 'najlepszy crm',
  answer: 'Odpowiedź modelu.',
  fanoutQueries: ['crm dla małych firm', 'ranking crm 2026'],
  citedDomains: [{ domain: 'example.com', count: 3, urls: [] }],
  citations: [{ title: 'Ranking CRM', url: 'https://example.com/crm', domain: 'example.com' }],
};

describe('renderReport fanout', () => {
  it('subject zawiera frazę', () => {
    expect(renderReport(result as any, result.query).subject).toContain('najlepszy crm');
  });
  it('html zawiera odpowiedź, fan-out query i cytowaną domenę', () => {
    const { html } = renderReport(result as any, result.query);
    expect(html).toContain('Odpowiedź modelu.');
    expect(html).toContain('ranking crm 2026');
    expect(html).toContain('example.com');
    expect(html).toContain('ICEA S.A.');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run functions/_lib/reports/fanout.test.ts`
Expected: FAIL – brak modułu.

- [ ] **Step 3: Implement**

```typescript
// functions/_lib/reports/fanout.ts
import { emailShell, escapeHtml } from '../email-shell';
import { heading, paragraph, section, list } from './components';

type FanoutResult = {
  query: string;
  answer: string;
  fanoutQueries: string[];
  citedDomains: Array<{ domain: string; count: number }>;
  citations: Array<{ title: string; url: string; domain: string }>;
};

export function renderReport(result: FanoutResult, _query: string): { subject: string; html: string } {
  const domains = result.citedDomains.map((d) => `${d.domain} (${d.count})`);
  const citationsHtml = result.citations.length
    ? result.citations
        .map(
          (c) =>
            `<li style="font-size:14px;line-height:1.6;margin-bottom:4px;">` +
            `<a href="${escapeHtml(c.url)}" style="color:#0068cc;text-decoration:none;">${escapeHtml(c.title || c.url)}</a> ` +
            `<span style="color:#64748b;">– ${escapeHtml(c.domain)}</span></li>`,
        )
        .join('')
    : '';

  const body =
    heading(`Raport fan-out: ${result.query}`) +
    paragraph('Tak ChatGPT rozkłada Twoją frazę na zapytania składowe i jakie źródła cytuje.') +
    section('Odpowiedź modelu', paragraphRaw(result.answer)) +
    section('Zapytania fan-out', list(result.fanoutQueries)) +
    section('Najczęściej cytowane domeny', list(domains)) +
    (citationsHtml
      ? section('Źródła', `<ul style="margin:0;padding-left:18px;">${citationsHtml}</ul>`)
      : '');

  return {
    subject: `Raport fan-out „${result.query}" – widocznosc.ai`,
    html: emailShell(body, `Fan-out dla: ${result.query}`),
  };
}

/** Akapit dla treści wieloliniowej (zachowuje złamania). */
function paragraphRaw(text: string): string {
  return `<div style="font-size:15px;line-height:1.7;color:#0f172a;white-space:pre-wrap;">${escapeHtml(text)}</div>`;
}
```

- [ ] **Step 4: Run test to verify pass**

Run: `npx vitest run functions/_lib/reports/fanout.test.ts`
Expected: PASS (2 testy).

- [ ] **Step 5: Commit**

```bash
git add functions/_lib/reports/fanout.ts functions/_lib/reports/fanout.test.ts
git commit -m "feat(widocznosc): renderer raportu e-mail dla fanout"
```

---

### Task 5: Renderer raportu – url-check

**Files:**
- Create: `functions/_lib/reports/url-check.ts`
- Test: `functions/_lib/reports/url-check.test.ts`

Typ wyniku: `CheckResponse { url, finalUrl, score: FullScore{ total, grade, factors[]{label,score,evidence} }, actionItems[]{priority,title,description} }`.

- [ ] **Step 1: Write the failing test**

```typescript
// functions/_lib/reports/url-check.test.ts
import { describe, it, expect } from 'vitest';
import { renderReport } from './url-check';

const result = {
  url: 'https://example.com/blog/post',
  finalUrl: 'https://example.com/blog/post',
  score: {
    total: 68, grade: 'C',
    factors: [{ label: 'Modularność treści', score: 0.5, evidence: 'Częściowo modularna.' }],
    model: 'x',
  },
  actionItems: [{ priority: 'P0', title: 'Dodaj FAQ', description: 'Sekcja Q&A.' }],
};

describe('renderReport url-check', () => {
  it('subject zawiera URL', () => {
    expect(renderReport(result as any, result.url).subject).toContain('example.com');
  });
  it('html zawiera ocenę, grade, czynnik i action item', () => {
    const { html } = renderReport(result as any, result.url);
    expect(html).toContain('68');
    expect(html).toContain('C');
    expect(html).toContain('Modularność treści');
    expect(html).toContain('Dodaj FAQ');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run functions/_lib/reports/url-check.test.ts`
Expected: FAIL – brak modułu.

- [ ] **Step 3: Implement**

```typescript
// functions/_lib/reports/url-check.ts
import { emailShell, escapeHtml } from '../email-shell';
import { heading, paragraph, section, statGrid, actionItems } from './components';

const SCORE_PL: Record<string, string> = { '1': 'tak', '0.5': 'częściowo', '0': 'nie' };

type UrlResult = {
  url: string; finalUrl: string;
  score: { total: number; grade: string; factors: Array<{ label: string; score: number; evidence: string }> };
  actionItems: Array<{ priority: string; title: string; description: string }>;
};

export function renderReport(result: UrlResult, _query: string): { subject: string; html: string } {
  const factorsHtml = result.score.factors
    .map(
      (f) =>
        `<div style="border-bottom:1px solid #e2e8f0;padding:8px 0;">` +
        `<strong style="font-size:14px;color:#0f172a;">${escapeHtml(f.label)}</strong> ` +
        `<span style="font-size:13px;color:#0068cc;">— ${escapeHtml(SCORE_PL[String(f.score)] ?? String(f.score))}</span>` +
        `<div style="font-size:13px;line-height:1.6;color:#64748b;">${escapeHtml(f.evidence)}</div>` +
        `</div>`,
    )
    .join('');

  const body =
    heading(`Raport AI-readiness: ${result.finalUrl}`, `Ocena: ${result.score.grade}`) +
    paragraph(`Jak dobrze strona jest przygotowana pod cytowanie przez AI. Wynik: ${result.score.total}/100.`) +
    section('Podsumowanie', statGrid([
      ['Wynik', `${result.score.total}/100`],
      ['Ocena', result.score.grade],
    ])) +
    section('Czynniki', factorsHtml) +
    (result.actionItems.length ? section('Rekomendacje', actionItems(result.actionItems)) : '');

  return {
    subject: `Raport AI-readiness: ${result.finalUrl} – widocznosc.ai`,
    html: emailShell(body, `AI-readiness ${result.score.total}/100 (${result.score.grade})`),
  };
}
```

- [ ] **Step 4: Run test to verify pass**

Run: `npx vitest run functions/_lib/reports/url-check.test.ts`
Expected: PASS (2 testy).

- [ ] **Step 5: Commit**

```bash
git add functions/_lib/reports/url-check.ts functions/_lib/reports/url-check.test.ts
git commit -m "feat(widocznosc): renderer raportu e-mail dla url-check"
```

---

### Task 6: Renderer raportu – ai-bots-check

**Files:**
- Create: `functions/_lib/reports/ai-bots-check.ts`
- Test: `functions/_lib/reports/ai-bots-check.test.ts`

Typ wyniku: `{ domain, summary{allowed,blocked,criticalBlocked,total}, bots[]{name,allowed,critical}, actionItems[]{priority,title,description} }`.

- [ ] **Step 1: Write the failing test**

```typescript
// functions/_lib/reports/ai-bots-check.test.ts
import { describe, it, expect } from 'vitest';
import { renderReport } from './ai-bots-check';

const result = {
  domain: 'example.com',
  summary: { allowed: 5, blocked: 2, criticalBlocked: 1, total: 7 },
  bots: [{ name: 'GPTBot', allowed: false, critical: true }],
  actionItems: [{ priority: 'P0', title: 'Odblokuj GPTBot', description: 'Usuń Disallow.' }],
};

describe('renderReport ai-bots-check', () => {
  it('subject zawiera domenę', () => {
    expect(renderReport(result as any, result.domain).subject).toContain('example.com');
  });
  it('html zawiera statystyki, bota i action item', () => {
    const { html } = renderReport(result as any, result.domain);
    expect(html).toContain('GPTBot');
    expect(html).toContain('Odblokuj GPTBot');
    expect(html).toContain('ICEA S.A.');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run functions/_lib/reports/ai-bots-check.test.ts`
Expected: FAIL – brak modułu.

- [ ] **Step 3: Implement**

```typescript
// functions/_lib/reports/ai-bots-check.ts
import { emailShell, escapeHtml } from '../email-shell';
import { heading, paragraph, section, statGrid, actionItems } from './components';

type BotsResult = {
  domain: string;
  summary: { allowed: number; blocked: number; criticalBlocked: number; total: number };
  bots: Array<{ name: string; allowed: boolean; critical: boolean }>;
  actionItems: Array<{ priority: string; title: string; description: string }>;
};

export function renderReport(result: BotsResult, _query: string): { subject: string; html: string } {
  const botsHtml = result.bots
    .map(
      (b) =>
        `<div style="padding:6px 0;border-bottom:1px solid #e2e8f0;font-size:14px;color:#0f172a;">` +
        `${b.allowed ? '✅' : '⛔'} ${escapeHtml(b.name)}` +
        `${b.critical ? ' <span style="color:#64748b;font-size:12px;">(krytyczny)</span>' : ''}` +
        `</div>`,
    )
    .join('');

  const body =
    heading(`Raport dostępu botów AI: ${result.domain}`) +
    paragraph('Które boty AI mają dostęp do Twojej strony wg robots.txt.') +
    section('Podsumowanie', statGrid([
      ['Dozwolone', String(result.summary.allowed)],
      ['Zablokowane', String(result.summary.blocked)],
      ['Krytyczne zablok.', String(result.summary.criticalBlocked)],
    ])) +
    section('Boty', botsHtml) +
    (result.actionItems.length ? section('Rekomendacje', actionItems(result.actionItems)) : '');

  return {
    subject: `Raport dostępu botów AI: ${result.domain} – widocznosc.ai`,
    html: emailShell(body, `${result.summary.blocked} botów zablokowanych na ${result.domain}`),
  };
}
```

- [ ] **Step 4: Run test to verify pass**

Run: `npx vitest run functions/_lib/reports/ai-bots-check.test.ts`
Expected: PASS (2 testy).

- [ ] **Step 5: Commit**

```bash
git add functions/_lib/reports/ai-bots-check.ts functions/_lib/reports/ai-bots-check.test.ts
git commit -m "feat(widocznosc): renderer raportu e-mail dla ai-bots-check"
```

---

### Task 7: Dispatcher + walidacja payloadu + powiadomienie leadowe

**Files:**
- Create: `functions/_lib/reports/index.ts`
- Create: `functions/_lib/send-report.ts`
- Test: `functions/_lib/send-report.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// functions/_lib/send-report.test.ts
import { describe, it, expect } from 'vitest';
import { validateReportPayload, buildLeadNotification, MAX_PAYLOAD_BYTES } from './send-report';

const ok = { tool: 'brand-check', email: 'jan@firma.pl', consent: true, query: 'ICEA', result: { brand: 'ICEA' } };

describe('validateReportPayload', () => {
  it('akceptuje poprawny payload', () => {
    expect(validateReportPayload(ok).ok).toBe(true);
  });
  it('odrzuca nieznane narzędzie', () => {
    expect(validateReportPayload({ ...ok, tool: 'hack' }).ok).toBe(false);
  });
  it('odrzuca zły e-mail', () => {
    expect(validateReportPayload({ ...ok, email: 'nie-email' }).ok).toBe(false);
  });
  it('odrzuca brak result', () => {
    expect(validateReportPayload({ ...ok, result: null }).ok).toBe(false);
  });
  it('odrzuca za duży payload', () => {
    const big = { ...ok, result: { x: 'a'.repeat(MAX_PAYLOAD_BYTES + 1) } };
    expect(validateReportPayload(big).ok).toBe(false);
  });
  it('consent niewymagany (raport idzie zawsze)', () => {
    expect(validateReportPayload({ ...ok, consent: false }).ok).toBe(true);
  });
});

describe('buildLeadNotification', () => {
  it('zawiera narzędzie, e-mail i flagę zgody', () => {
    const mail = buildLeadNotification(ok as any, { from: 'F', leadTo: 'lead@x' });
    expect(mail.to).toEqual(['lead@x']);
    expect(mail.subject).toContain('brand-check');
    expect(mail.html).toContain('jan@firma.pl');
    expect(mail.html).toContain('TAK'); // zgoda
  });
  it('pokazuje NIE gdy brak zgody', () => {
    const mail = buildLeadNotification({ ...ok, consent: false } as any, { from: 'F', leadTo: 'lead@x' });
    expect(mail.html).toContain('NIE');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run functions/_lib/send-report.test.ts`
Expected: FAIL – brak modułu.

- [ ] **Step 3: Implement dispatcher (reports/index.ts)**

```typescript
// functions/_lib/reports/index.ts
import { renderReport as brandCheck } from './brand-check';
import { renderReport as fanout } from './fanout';
import { renderReport as urlCheck } from './url-check';
import { renderReport as aiBotsCheck } from './ai-bots-check';

export const TOOLS = ['brand-check', 'fanout', 'url-check', 'ai-bots-check'] as const;
export type Tool = (typeof TOOLS)[number];

const LABELS: Record<Tool, string> = {
  'brand-check': 'Brand Check',
  fanout: 'Fan-out Check',
  'url-check': 'URL Check',
  'ai-bots-check': 'AI Bots Check',
};

const RENDERERS: Record<Tool, (result: any, query: string) => { subject: string; html: string }> = {
  'brand-check': brandCheck,
  fanout,
  'url-check': urlCheck,
  'ai-bots-check': aiBotsCheck,
};

export function isTool(x: unknown): x is Tool {
  return typeof x === 'string' && (TOOLS as readonly string[]).includes(x);
}
export function toolLabel(tool: Tool): string {
  return LABELS[tool];
}
export function renderToolReport(tool: Tool, result: unknown, query: string) {
  return RENDERERS[tool](result, query);
}
```

- [ ] **Step 4: Implement send-report.ts**

```typescript
// functions/_lib/send-report.ts
/** Czysta logika endpointu send-report: walidacja payloadu + powiadomienie leadowe. */
import { emailShell, escapeHtml, C } from './email-shell';
import { isTool, toolLabel, type Tool } from './reports';
import type { ResendEmail } from './contact';

export const MAX_PAYLOAD_BYTES = 32_000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ReportPayload = {
  tool?: string;
  email?: string;
  consent?: boolean;
  query?: string;
  result?: unknown;
  website?: string; // honeypot
};

export type EmailConfig = { from: string; leadTo: string };

export function isHoneypotTriggered(p: ReportPayload): boolean {
  return String(p.website ?? '').trim().length > 0;
}

export function validateReportPayload(p: ReportPayload): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!isTool(p.tool)) errors.push('tool');
  const email = String(p.email ?? '').trim();
  if (email.length < 1 || email.length > 254 || !EMAIL_RE.test(email)) errors.push('email');
  if (p.result === null || typeof p.result !== 'object') errors.push('result');
  if (typeof JSON.stringify(p.result ?? null) === 'string'
      && JSON.stringify(p.result ?? null).length > MAX_PAYLOAD_BYTES) errors.push('size');
  return { ok: errors.length === 0, errors };
}

/** Mail wewnętrzny (lead) do ICEA – z flagą zgody. */
export function buildLeadNotification(p: ReportPayload, cfg: EmailConfig): ResendEmail {
  const tool = p.tool as Tool;
  const email = String(p.email ?? '').trim();
  const query = String(p.query ?? '').trim() || '—';
  const consentYes = p.consent === true;
  const consent = consentYes ? 'TAK' : 'NIE';

  const rows: Array<[string, string]> = [
    ['Narzędzie', toolLabel(tool)],
    ['Zapytanie', query],
    ['E-mail', email],
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
    subject: `[widocznosc.ai] Lead z narzędzia ${tool}: ${email} (zgoda: ${consent})`,
    text: rows.map(([k, v]) => `${k}: ${v}`).join('\n'),
    html: emailShell(body, `Lead z ${toolLabel(tool)} – zgoda: ${consent}`),
  };
}
```

- [ ] **Step 5: Run test to verify pass**

Run: `npx vitest run functions/_lib/send-report.test.ts`
Expected: PASS (8 testów).

- [ ] **Step 6: Commit**

```bash
git add functions/_lib/reports/index.ts functions/_lib/send-report.ts functions/_lib/send-report.test.ts
git commit -m "feat(widocznosc): dispatcher raportów + walidacja i powiadomienie leadowe send-report"
```

---

### Task 8: Endpoint send-report

**Files:**
- Create: `functions/api/tools/send-report.ts`

- [ ] **Step 1: Implement endpoint**

```typescript
// functions/api/tools/send-report.ts
/**
 * Wysyła pełny raport narzędzia na e-mail usera + powiadomienie leadowe do ICEA.
 *
 * Endpoint: POST /api/tools/send-report
 * Body: { tool, email, consent, query, result, website (honeypot) }
 * Wymaga: env RESEND_API_KEY. Reużywa KV FANOUT_RL (klucz tool:send-report:<ip>).
 */
import { resolveLimit, checkToolLimit } from '../../_lib/tool-rate-limit';
import {
  validateReportPayload, isHoneypotTriggered, buildLeadNotification,
  type ReportPayload, MAX_PAYLOAD_BYTES,
} from '../../_lib/send-report';
import { renderToolReport, type Tool } from '../../_lib/reports';
import type { ResendEmail } from '../../_lib/contact';

type Env = {
  RESEND_API_KEY?: string;
  TOOL_REPORT_DAILY_LIMIT?: string;
  FANOUT_RL?: KVNamespace;
};

const RESEND_URL = 'https://api.resend.com/emails';
const LEAD_TO = 'lead.icea@gmail.com';
const FROM = 'widocznosc.ai <formularz@widocznosc.ai>';
const REPORT_DEFAULT_LIMIT = 5;
const SEND_TIMEOUT_MS = 15_000;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}
function jsonError(status: number, message: string, extra: Record<string, unknown> = {}): Response {
  return json({ error: message, ...extra }, status);
}

async function sendViaResend(apiKey: string, email: ResendEmail): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort('resend-timeout'), SEND_TIMEOUT_MS);
  try {
    const res = await fetch(RESEND_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify(email),
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

export const onRequestGet: PagesFunction = async () =>
  new Response(JSON.stringify({ error: 'Użyj POST z { tool, email, result }.' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json; charset=utf-8', Allow: 'POST' },
  });

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // 1. Limit rozmiaru (anty-abuse) — czytamy jako tekst, potem parsujemy.
  const rawText = await request.text();
  if (rawText.length > MAX_PAYLOAD_BYTES) {
    return jsonError(413, 'Payload zbyt duży.');
  }
  let body: ReportPayload;
  try {
    body = JSON.parse(rawText) as ReportPayload;
  } catch {
    return jsonError(400, 'Nieprawidłowe body JSON.');
  }

  // 2. Honeypot — bot dostaje fałszywy sukces.
  if (isHoneypotTriggered(body)) return json({ ok: true });

  // 3. Walidacja.
  const v = validateReportPayload(body);
  if (!v.ok) return jsonError(400, 'Nieprawidłowe dane.', { fields: v.errors });

  // 4. Konfiguracja.
  const apiKey = (env.RESEND_API_KEY || '').trim();
  if (!apiKey) {
    return json({ status: 'config-error', error: 'Wysyłka raportów chwilowo niedostępna.' }, 500);
  }

  // 5. Rate-limit (anty-abuse relay).
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const limit = resolveLimit(env.TOOL_REPORT_DAILY_LIMIT, REPORT_DEFAULT_LIMIT);
  const gate = await checkToolLimit(env.FANOUT_RL, 'send-report', ip, limit, new Date());
  if (!gate.allowed) {
    return jsonError(429, `Dzienny limit wysyłek raportów (${limit}) wyczerpany. Reset o północy.`, {
      limit, resetAt: gate.resetAt,
    });
  }

  // 6. Render raportu + maile.
  const tool = body.tool as Tool;
  const query = String(body.query ?? '').trim();
  const report = renderToolReport(tool, body.result, query);
  const userMail: ResendEmail = {
    from: FROM,
    to: [String(body.email).trim()],
    subject: report.subject,
    html: report.html,
    text: 'Twój raport widocznosc.ai jest dostępny w wersji HTML tej wiadomości.',
  };

  // Raport do usera jest krytyczny (to zamówiona usługa).
  const userOk = await sendViaResend(apiKey, userMail);
  if (!userOk) {
    return jsonError(502, 'Nie udało się wysłać raportu. Spróbuj ponownie.');
  }

  // Powiadomienie leadowe — best-effort, nie wywraca odpowiedzi.
  await sendViaResend(apiKey, buildLeadNotification(body, { from: FROM, leadTo: LEAD_TO }));

  // 7. Zlicz limit dopiero po udanej wysyłce raportu.
  await gate.commit();

  return json({ ok: true });
};
```

- [ ] **Step 2: Verify typy + testy + build**

Run: `npx tsc --noEmit && npm test && npm run build`
Expected: tsc bez błędów, wszystkie testy PASS, build OK.

- [ ] **Step 3: E2E przez wrangler (dummy klucz – Resend zwróci błąd, sprawdzamy walidację/limit/200-ścieżkę kontraktu)**

```bash
printf 'RESEND_API_KEY=dummy\n' > .dev.vars   # .dev.vars jest w .gitignore (Plan A)
npx wrangler pages dev dist --port 8791 --kv FANOUT_RL > /tmp/wr-sr.log 2>&1 &
for i in $(seq 1 25); do curl -s -o /dev/null http://localhost:8791/ && break; sleep 2; done
echo "--- nieznane narzędzie → 400 ---"
curl -s -o /dev/null -w "%{http_code}\n" -X POST -H "Content-Type: application/json" \
  --data '{"tool":"hack","email":"a@b.pl","result":{}}' http://localhost:8791/api/tools/send-report
echo "--- zły e-mail → 400 ---"
curl -s -o /dev/null -w "%{http_code}\n" -X POST -H "Content-Type: application/json" \
  --data '{"tool":"fanout","email":"zle","result":{}}' http://localhost:8791/api/tools/send-report
echo "--- honeypot → 200 (fałszywy sukces) ---"
curl -s -o /dev/null -w "%{http_code}\n" -X POST -H "Content-Type: application/json" \
  --data '{"tool":"fanout","email":"a@b.pl","result":{},"website":"bot"}' http://localhost:8791/api/tools/send-report
pkill -f "wrangler pages dev"; rm -f .dev.vars
```

Expected: nieznane narzędzie → **400**, zły e-mail → **400**, honeypot → **200**. (Poprawny payload z dummy-kluczem zwróci 502, bo Resend odrzuci klucz – realna wysyłka do weryfikacji na preview z prawdziwym RESEND_API_KEY.)

- [ ] **Step 4: Commit**

```bash
git add functions/api/tools/send-report.ts
git commit -m "feat(widocznosc): endpoint /api/tools/send-report (raport + lead, limit 5/IP, anty-abuse)"
```

---

## Self-Review

**Spec coverage:** Pokrywa backendową część specu „2–5": pełny raport per narzędzie (4 renderery), powiadomienie leadowe z flagą zgody, rate-limit `send-report` 5/IP, anty-abuse (honeypot, walidacja e-maila, limit rozmiaru 32 KB, render z ustrukturyzowanych pól + escapeHtml). Frontend (komponent, checkbox zgody w UI, CTA) + weryfikacja polityki prywatności = Plan B2.

**Placeholder scan:** Brak TBD/TODO. Każdy renderer ma pełny kod i test z realnymi polami z typów odpowiedzi.

**Type consistency:** `renderReport(result, query) → { subject, html }` – ta sama sygnatura w 4 rendererach i w dispatcherze `renderToolReport`. `ResendEmail` importowany z `_lib/contact.ts` (istniejący typ). `Tool`/`TOOLS`/`isTool`/`toolLabel` z `reports/index.ts` używane w send-report.ts. `escapeHtml`/`emailShell`/`C` z email-shell.ts używane przez contact.ts (po refaktorze), components.ts i renderery. `checkToolLimit`/`resolveLimit` z Planu A. Klucz limitu `tool:send-report:<ip>`.

## Uwagi do egzekucji

- Numery linii w `contact.ts` (Task 1) to stan na 2026-06-01 – kotwicz po fragmentach kodu.
- `_query` w rendererach jest nieużywane (zachowane w sygnaturze dla spójności i przyszłego użycia); jeśli lint krzyczy na nieużywany parametr, prefiks `_` to wycisza.
- Po Task 1 `contact.test.ts` musi dalej przechodzić bez zmian (to weryfikuje, że refaktor szablonu niczego nie zepsuł).
