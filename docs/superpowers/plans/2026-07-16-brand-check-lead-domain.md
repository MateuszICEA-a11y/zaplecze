# Domena marki w mailu leadowym z brand-check – Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mail leadowy z narzędzia Brand Check zawiera domenę (znormalizowaną), kategorię i rynek wpisane przez usera; pole „Domena" w formularzu staje się wymagane.

**Architecture:** Helper URL/host wydzielony z `brand-check.ts` do `functions/_lib/url-host.ts` (jedno źródło prawdy). `ReportPayload` i `buildLeadNotification` dostają opcjonalny kontekst `{ domain, category, market }` renderowany jako dodatkowe wiersze maila + domena w temacie. Frontend brand-check przekazuje pola, które już zbiera.

**Tech Stack:** Cloudflare Pages Functions (TypeScript), Astro 6 (strona narzędzia), vitest.

**Spec:** `docs/superpowers/specs/2026-07-16-brand-check-lead-domain-design.md`

## Global Constraints

- Katalog roboczy testów i builda: `portals/widocznosc.ai/` (testy: `npx vitest run`, build: `npm run build`).
- Repo ma niezacommitowane zmiany z innych prac – `git add` TYLKO plików wymienionych w tasku, nigdy `git add -A`/`git add .`.
- Teksty PL: wyłącznie półpauza (–), nigdy em-dash (—).
- Komentarze w kodzie po polsku, w stylu istniejących plików (krótkie, tylko tam gdzie kod sam się nie tłumaczy).
- Pola kontekstu leada są opcjonalne w API – stare otwarte karty (payload bez `domain`) muszą przechodzić bez błędu.

---

### Task 1: Wydziel helper URL/host do `functions/_lib/url-host.ts`

**Files:**
- Create: `portals/widocznosc.ai/functions/_lib/url-host.ts`
- Create: `portals/widocznosc.ai/functions/_lib/url-host.test.ts`
- Modify: `portals/widocznosc.ai/functions/api/tools/brand-check.ts:142-211` (usunięcie lokalnych funkcji, import)

**Interfaces:**
- Consumes: nic (funkcje przenoszone verbatim z `brand-check.ts`).
- Produces: `normalizeUrl(input: string | undefined): string | null` oraz `getHost(input: string | undefined): string | undefined` eksportowane z `functions/_lib/url-host.ts`. Task 2 importuje `getHost` stąd.

- [ ] **Step 1: Napisz failing test**

Utwórz `portals/widocznosc.ai/functions/_lib/url-host.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { normalizeUrl, getHost } from './url-host';

describe('normalizeUrl', () => {
  it('dokleja https:// do gołej domeny', () => {
    expect(normalizeUrl('jsps.com.pl')).toBe('https://jsps.com.pl/');
  });
  it('usuwa fragment (#hash)', () => {
    expect(normalizeUrl('https://x.pl/a#frag')).toBe('https://x.pl/a');
  });
  it('odrzuca URL z credentials', () => {
    expect(normalizeUrl('https://user:pass@x.pl')).toBeNull();
  });
  it('odrzuca hosty zablokowane (localhost, sieci prywatne)', () => {
    expect(normalizeUrl('localhost')).toBeNull();
    expect(normalizeUrl('192.168.1.1')).toBeNull();
  });
  it('odrzuca pusty input i śmieci', () => {
    expect(normalizeUrl(undefined)).toBeNull();
    expect(normalizeUrl('   ')).toBeNull();
  });
});

describe('getHost', () => {
  it('wyciąga hostname z pełnego URL i zdejmuje www.', () => {
    expect(getHost('https://www.jsps.com.pl/kontakt?x=1')).toBe('jsps.com.pl');
  });
  it('działa dla gołej domeny', () => {
    expect(getHost('jsps.com.pl')).toBe('jsps.com.pl');
  });
  it('zwraca undefined dla wartości nienormalizowalnej', () => {
    expect(getHost('nie url ...')).toBeUndefined();
    expect(getHost(undefined)).toBeUndefined();
  });
});
```

- [ ] **Step 2: Uruchom test – ma failować**

Run: `cd portals/widocznosc.ai && npx vitest run functions/_lib/url-host.test.ts`
Expected: FAIL – `Cannot find module './url-host'` (albo równoważny błąd resolvera).

- [ ] **Step 3: Utwórz moduł – kod przeniesiony verbatim z brand-check.ts**

Utwórz `portals/widocznosc.ai/functions/_lib/url-host.ts`. Funkcje są dziś w `functions/api/tools/brand-check.ts` (linie 142-211) – przenosimy je bez zmian logiki, dodając `export` do `normalizeUrl` i `getHost` (`isBlockedHostname` zostaje prywatne):

```ts
/** Normalizacja URL/hostname – wspólne dla brand-check (profil marki) i send-report (mail leadowy). */

export function normalizeUrl(input: string | undefined): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed || trimmed.length > 2048) return null;

  let urlString = trimmed;
  if (!/^https?:\/\//i.test(urlString)) {
    urlString = `https://${urlString}`;
  }

  try {
    const url = new URL(urlString);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    if (url.username || url.password) return null;
    if (isBlockedHostname(url.hostname)) return null;
    url.hash = '';
    return url.toString();
  } catch {
    return null;
  }
}

export function getHost(input: string | undefined): string | undefined {
  const normalized = normalizeUrl(input);
  if (!normalized) return undefined;
  try {
    return new URL(normalized).hostname.replace(/^www\./i, '');
  } catch {
    return undefined;
  }
}

function isBlockedHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, '');
  if (
    !host ||
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    host.endsWith('.internal')
  ) {
    return true;
  }

  if (host.includes(':')) return true;

  const parts = host.split('.');
  if (parts.length === 4 && parts.every((part) => /^\d+$/.test(part))) {
    const octets = parts.map(Number);
    if (octets.some((part) => part < 0 || part > 255)) return true;
    const [a, b, c] = octets;
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 192 && b === 0 && c === 0) ||
      (a === 192 && b === 0 && c === 2) ||
      (a === 198 && (b === 18 || b === 19)) ||
      (a === 198 && b === 51 && c === 100) ||
      (a === 203 && b === 0 && c === 113) ||
      a >= 224
    );
  }

  return false;
}
```

UWAGA: przed zapisem porównaj ciała funkcji z aktualnym stanem `brand-check.ts:142-211` – jeśli kod w repo się różni od powyższego, wygrywa wersja z repo (przenosimy verbatim).

- [ ] **Step 4: Uruchom test – ma przechodzić**

Run: `cd portals/widocznosc.ai && npx vitest run functions/_lib/url-host.test.ts`
Expected: PASS (8 testów).

- [ ] **Step 5: Przełącz brand-check.ts na import**

W `portals/widocznosc.ai/functions/api/tools/brand-check.ts`:
1. Usuń całe definicje `normalizeUrl`, `getHost`, `isBlockedHostname` (linie 142-211).
2. Dodaj do importów na górze pliku (obok istniejącego importu z `../../_lib/tool-rate-limit`):

```ts
import { normalizeUrl, getHost } from '../../_lib/url-host';
```

Pozostałe użycia (`fetchBrandProfile` – `normalizeUrl(domain)`, handler – `getHost(domain)`) zostają bez zmian.

- [ ] **Step 6: Pełny run testów**

Run: `cd portals/widocznosc.ai && npx vitest run`
Expected: PASS – wszystkie istniejące suity (m.in. `send-report.test.ts`, `smsapi.test.ts`) + nowa.

- [ ] **Step 7: Commit**

```bash
cd portals/widocznosc.ai
git add functions/_lib/url-host.ts functions/_lib/url-host.test.ts functions/api/tools/brand-check.ts
git commit -m "refactor(widocznosc): wydziel normalizeUrl/getHost do _lib/url-host"
```

---

### Task 2: Backend – kontekst leada (domena/kategoria/rynek) w mailu

**Files:**
- Modify: `portals/widocznosc.ai/functions/_lib/send-report.ts`
- Modify: `portals/widocznosc.ai/functions/api/tools/send-report.ts:130`
- Test: `portals/widocznosc.ai/functions/_lib/send-report.test.ts`

**Interfaces:**
- Consumes: `getHost(input: string | undefined): string | undefined` z `./url-host` (Task 1).
- Produces: `buildLeadNotification(lead: ChallengeLead, query: string, cfg: EmailConfig, ctx?: LeadContext): ResendEmail` gdzie `LeadContext = { domain?: string; category?: string; market?: string }`. Czwarty parametr opcjonalny – dotychczasowe wywołania (testy, url-check) działają bez zmian. `ReportPayload` rozszerzony o `domain?`, `category?`, `market?` – Task 3 wysyła te pola z frontu.

- [ ] **Step 1: Napisz failing testy**

Dopisz na końcu `portals/widocznosc.ai/functions/_lib/send-report.test.ts`:

```ts
describe('buildLeadNotification – kontekst narzędzia (domena/kategoria/rynek)', () => {
  const lead = {
    firstName: 'Jan', lastName: 'Kowalski', email: 'jan@firma.pl',
    phone: '+48512345678', consent: true, tool: 'brand-check',
  };
  const cfg = { from: 'f@x', leadTo: 'lead@x' };

  it('renderuje wiersze Domena/Kategoria/Rynek gdy podane (text i html)', () => {
    const mail = buildLeadNotification(lead as any, 'Marka X', cfg, {
      domain: 'jsps.com.pl', category: 'usługi księgowe', market: 'Polska',
    });
    expect(mail.text).toContain('Domena: jsps.com.pl');
    expect(mail.text).toContain('Kategoria: usługi księgowe');
    expect(mail.text).toContain('Rynek: Polska');
    expect(mail.html).toContain('jsps.com.pl');
    expect(mail.html).toContain('usługi księgowe');
  });

  it('normalizuje pełny URL do czystego hostname bez www', () => {
    const mail = buildLeadNotification(lead as any, 'Marka X', cfg, {
      domain: 'https://www.jsps.com.pl/kontakt?x=1',
    });
    expect(mail.text).toContain('Domena: jsps.com.pl');
    expect(mail.text).not.toContain('https://');
  });

  it('wartość nienormalizowalna → pokazana surowa po trim', () => {
    const mail = buildLeadNotification(lead as any, 'Marka X', cfg, { domain: '  nie url ...  ' });
    expect(mail.text).toContain('Domena: nie url ...');
  });

  it('bez kontekstu brak wierszy – kompatybilność z url-check', () => {
    const mail = buildLeadNotification(lead as any, 'https://x.pl', cfg);
    expect(mail.text).not.toContain('Domena:');
    expect(mail.text).not.toContain('Kategoria:');
    expect(mail.text).not.toContain('Rynek:');
  });

  it('puste/spacjowe wartości pomijane', () => {
    const mail = buildLeadNotification(lead as any, 'X', cfg, { domain: '   ', category: '' });
    expect(mail.text).not.toContain('Domena:');
    expect(mail.text).not.toContain('Kategoria:');
  });

  it('domena trafia do tematu; bez domeny temat kończy się nazwiskiem', () => {
    const withDomain = buildLeadNotification(lead as any, 'X', cfg, { domain: 'jsps.com.pl' });
    expect(withDomain.subject).toContain('(jsps.com.pl)');
    const noDomain = buildLeadNotification(lead as any, 'X', cfg);
    expect(noDomain.subject.endsWith('Jan Kowalski')).toBe(true);
  });

  it('tnie długie wartości do 200 znaków i escapuje HTML', () => {
    const long = 'a'.repeat(300);
    const mail = buildLeadNotification(lead as any, 'X', cfg, {
      category: long, market: '<b>PL</b>',
    });
    expect(mail.text).toContain(`Kategoria: ${'a'.repeat(200)}`);
    expect(mail.text).not.toContain('a'.repeat(201));
    expect(mail.html).toContain('&lt;b&gt;PL&lt;/b&gt;');
  });
});
```

- [ ] **Step 2: Uruchom testy – nowe mają failować**

Run: `cd portals/widocznosc.ai && npx vitest run functions/_lib/send-report.test.ts`
Expected: FAIL – nowe testy padają (brak 4. parametru / wierszy), stare przechodzą.

- [ ] **Step 3: Implementacja w send-report.ts (_lib)**

W `portals/widocznosc.ai/functions/_lib/send-report.ts`:

1. Dodaj import na górze (obok istniejących):

```ts
import { getHost } from './url-host';
```

2. Rozszerz `ReportPayload` (po polu `query?: string;`):

```ts
  domain?: string;
  category?: string;
  market?: string;
```

3. Dodaj typ i helper nad `buildLeadNotification`:

```ts
export type LeadContext = { domain?: string; category?: string; market?: string };

/** Kontekst jest pomocniczy: przycinamy zamiast odrzucać, puste pomijamy. */
function cleanCtxValue(value: string | undefined): string | undefined {
  const v = String(value ?? '').trim().slice(0, 200);
  return v || undefined;
}
```

4. Zamień całą funkcję `buildLeadNotification` na:

```ts
/** Mail wewnętrzny (lead) do ICEA – tożsamość ze zweryfikowanego challenge. */
export function buildLeadNotification(
  lead: ChallengeLead,
  query: string,
  cfg: EmailConfig,
  ctx?: LeadContext,
): ResendEmail {
  const tool = lead.tool as Tool;
  const email = String(lead.email ?? '').trim();
  const fullName = `${String(lead.firstName ?? '').trim()} ${String(lead.lastName ?? '').trim()}`.trim() || '—';
  const phone = String(lead.phone ?? '').trim() || '—';
  const q = String(query ?? '').trim() || '—';
  const consentYes = lead.consent === true;
  const consent = consentYes ? 'TAK' : 'NIE';

  const rawDomain = cleanCtxValue(ctx?.domain);
  const domain = rawDomain ? (getHost(rawDomain) ?? rawDomain) : undefined;
  const category = cleanCtxValue(ctx?.category);
  const market = cleanCtxValue(ctx?.market);

  const rows: Array<[string, string]> = [
    ['Narzędzie', toolLabel(tool)],
    ['Imię i nazwisko', fullName],
    ['E-mail', email],
    ['Telefon', phone],
    ['Numer zweryfikowany SMS', 'TAK'],
    ['Zapytanie', q],
  ];
  if (domain) rows.push(['Domena', domain]);
  if (category) rows.push(['Kategoria', category]);
  if (market) rows.push(['Rynek', market]);
  rows.push(['Zgoda na kontakt', consent]);

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
    subject: `[widocznosc.ai] Lead (zweryfikowany SMS) z ${tool}: ${fullName}${domain ? ` (${domain})` : ''}`,
    text: rows.map(([k, v]) => `${k}: ${v}`).join('\n'),
    html: emailShell(body, `Lead z ${toolLabel(tool)} – numer zweryfikowany SMS`),
  };
}
```

(Zmiany vs obecna wersja: parametr `ctx`, blok `rawDomain/domain/category/market`, warunkowe wiersze przed `Zgoda na kontakt`, dopisek `(${domain})` w subject. Reszta verbatim.)

5. W `portals/widocznosc.ai/functions/api/tools/send-report.ts` zamień linię 130:

```ts
  await sendViaResend(apiKey, buildLeadNotification(lead, query, { from: FROM, leadTo: LEAD_TO }));
```

na:

```ts
  await sendViaResend(
    apiKey,
    buildLeadNotification(lead, query, { from: FROM, leadTo: LEAD_TO }, {
      domain: typeof body.domain === 'string' ? body.domain : undefined,
      category: typeof body.category === 'string' ? body.category : undefined,
      market: typeof body.market === 'string' ? body.market : undefined,
    }),
  );
```

- [ ] **Step 4: Uruchom testy – mają przechodzić**

Run: `cd portals/widocznosc.ai && npx vitest run`
Expected: PASS – całość, w tym 7 nowych testów kontekstu.

- [ ] **Step 5: Commit**

```bash
cd portals/widocznosc.ai
git add functions/_lib/send-report.ts functions/_lib/send-report.test.ts functions/api/tools/send-report.ts
git commit -m "feat(widocznosc): mail leadowy z brand-check z domeną, kategorią i rynkiem"
```

---

### Task 3: Frontend – wymagana domena + przekazanie kontekstu

**Files:**
- Modify: `portals/widocznosc.ai/src/pages/narzedzia/brand-check.astro:75-82` (input), `:1046` (walidacja), `:1082` (body send-report)

**Interfaces:**
- Consumes: `ReportPayload` z polami `domain`, `category`, `market` (Task 2) – frontend wysyła je w body POST `/api/tools/send-report`.
- Produces: nic (koniec łańcucha).

- [ ] **Step 1: Pole „Domena" wymagane**

W `portals/widocznosc.ai/src/pages/narzedzia/brand-check.astro` w inpucie `domain-input` dodaj `required` (formularz ma `novalidate`, więc atrybut jest semantyczny/a11y – realną walidację robi JS w Step 2):

```html
              <input
                id="domain-input"
                name="domain"
                type="text"
                required
                autocomplete="url"
                spellcheck="false"
                placeholder="np. grupa-icea.pl"
              />
```

- [ ] **Step 2: Walidacja JS**

W handlerze `submit` (obecna linia 1046), po istniejącym checku marki, dodaj check domeny:

```ts
      if (!payload.brand) { renderError('Podaj nazwę marki.'); return; }
      if (!payload.domain) { renderError('Podaj domenę marki – bez niej nie sprawdzimy cytowań Twojej strony.'); return; }
```

- [ ] **Step 3: Przekaż kontekst do send-report**

W `runBrandCheck` (obecna linia 1082) zamień body wywołania `/api/tools/send-report`:

```ts
          body: JSON.stringify({ tool: 'brand-check', challengeId, query: payload.brand, result }),
```

na:

```ts
          body: JSON.stringify({
            tool: 'brand-check',
            challengeId,
            query: payload.brand,
            domain: payload.domain,
            category: payload.category,
            market: payload.market,
            result,
          }),
```

- [ ] **Step 4: Weryfikacja – testy + build**

Run: `cd portals/widocznosc.ai && npx vitest run && npm run build`
Expected: testy PASS, build kończy się sukcesem (astro build bez błędów).

- [ ] **Step 5: Commit**

```bash
cd portals/widocznosc.ai
git add src/pages/narzedzia/brand-check.astro
git commit -m "feat(widocznosc): brand-check – wymagana domena, kontekst w leadzie"
```
