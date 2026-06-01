# Backend leadów /kontakt/ + korekta danych publicznych — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Zamienić atrapę formularza `/kontakt/` w działający lejek leadów (e-mail przez Resend na `lead.icea@gmail.com`) i poprawić nieprawdziwe dane publiczne biura na froncie.

**Architecture:** Nowy endpoint Cloudflare Pages Function `functions/api/contact.ts` (cienki handler) deleguje walidację, honeypot i budowę maili do czystego, testowalnego modułu `functions/_lib/contact.ts`. Antyspam: honeypot + dzienny rate-limit per IP w istniejącym KV `FANOUT_RL` (prefiks `contact:`). Front `kontakt.astro` wykonuje realny `fetch` z obsługą stanów loading/success/error. Endpointy są same-origin (jak `fanout.ts`), więc bez CORS.

**Tech Stack:** Astro 6.2, Cloudflare Pages Functions (TypeScript), Resend HTTP API, Cloudflare KV, Vitest.

**Spec:** `docs/superpowers/specs/2026-06-01-widocznosc-kontakt-lead-backend-design.md`

**Wszystkie ścieżki względem `portals/widocznosc.ai/`.**

---

## File Structure

- **Create** `functions/_lib/contact.ts` — typy + czyste funkcje: `validate`, `isHoneypotTriggered`, `typeLabel`, `buildEmails`. Zero sieci/IO. Jedyne miejsce reguł biznesowych formularza.
- **Create** `functions/_lib/contact.test.ts` — testy jednostkowe powyższego (vitest).
- **Create** `functions/api/contact.ts` — handler `onRequestPost` + `onRequestGet` (405); parse → honeypot → validate → rate-limit (KV) → wysyłka Resend → JSON. Cienki, bez testów jednostkowych.
- **Modify** `src/pages/kontakt.astro` — (1) korekta danych biura + mail biuro@, (2) ukryte pole honeypot, (3) realny submit handler z fetch + stany.
- **Modify** `wrangler.toml` — komentarz dokumentujący sekret `RESEND_API_KEY`.

Kolejność commitów (revert-friendly): **Task 1** = korekta danych publicznych (samodzielny commit), **Task 2–6** = backend + front-flow + testy.

---

## Task 1: Korekta danych publicznych na froncie

**Files:**
- Modify: `src/pages/kontakt.astro` (sekcja „Biuro ICEA", ~l.105–116)

- [ ] **Step 1: Podmień blok „Biuro ICEA" + dodaj mail biuro@**

W `src/pages/kontakt.astro` znajdź blok (ok. l.105–116):

```html
            <!-- Biuro -->
            <div>
              <div class="text-ink-muted mb-1 text-sm">Biuro ICEA</div>
              <p class="text-ink leading-relaxed">
                ul. Mińska 25, 03-808 Warszawa<br />
                część <a
                  class="text-accent-blue hover:opacity-85 underline underline-offset-2 transition"
                  href="https://grupa-icea.pl"
                  target="_blank"
                  rel="noopener noreferrer">grupa-icea.pl</a>
              </p>
            </div>
```

Zastąp go (poprawny adres ICEA S.A. + wyeksponowany publiczny mail `biuro@grupa-icea.pl`):

```html
            <!-- Mail biuro -->
            <div>
              <div class="text-ink-muted mb-1 text-sm">E-mail biura</div>
              <a class="text-ink hover:opacity-85 text-lg transition" href="mailto:biuro@grupa-icea.pl">
                biuro@grupa-icea.pl
              </a>
            </div>

            <!-- Biuro -->
            <div>
              <div class="text-ink-muted mb-1 text-sm">Biuro ICEA</div>
              <p class="text-ink leading-relaxed">
                ICEA S.A.<br />
                ul. Szyperska 14<br />
                61-754 Poznań<br />
                część <a
                  class="text-accent-blue hover:opacity-85 underline underline-offset-2 transition"
                  href="https://grupa-icea.pl"
                  target="_blank"
                  rel="noopener noreferrer">grupa-icea.pl</a>
              </p>
            </div>
```

- [ ] **Step 2: Weryfikacja buildu**

Run: `npm run build`
Expected: build przechodzi bez błędów; w wygenerowanym `/kontakt/` widoczne „ICEA S.A.", „ul. Szyperska 14", „61-754 Poznań", „biuro@grupa-icea.pl".

- [ ] **Step 3: Commit**

```bash
git add src/pages/kontakt.astro
git commit -m "fix(widocznosc): prawdziwe dane biura ICEA + mail biuro@ na /kontakt/"
```

---

## Task 2: Moduł `_lib/contact.ts` — typy, walidacja, honeypot, label

**Files:**
- Create: `functions/_lib/contact.ts`
- Test: `functions/_lib/contact.test.ts`

- [ ] **Step 1: Napisz failing test**

Utwórz `functions/_lib/contact.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { validate, isHoneypotTriggered, typeLabel, CONTACT_TYPES } from './contact';

const valid = {
  name: 'Jan Kowalski',
  email: 'jan@firma.pl',
  company: 'Firma sp. z o.o.',
  type: 'audyt-ai',
  message: 'Chcę audyt widoczności w AI dla mojej marki.',
};

describe('validate', () => {
  it('akceptuje poprawny payload', () => {
    expect(validate(valid)).toEqual({ ok: true, errors: [] });
  });

  it('odrzuca brak imienia', () => {
    const r = validate({ ...valid, name: '   ' });
    expect(r.ok).toBe(false);
    expect(r.errors).toContain('name');
  });

  it('odrzuca zły format e-mail', () => {
    const r = validate({ ...valid, email: 'nie-email' });
    expect(r.ok).toBe(false);
    expect(r.errors).toContain('email');
  });

  it('odrzuca type spoza whitelisty', () => {
    const r = validate({ ...valid, type: 'hacker' });
    expect(r.ok).toBe(false);
    expect(r.errors).toContain('type');
  });

  it('odrzuca pustą wiadomość', () => {
    const r = validate({ ...valid, message: '' });
    expect(r.ok).toBe(false);
    expect(r.errors).toContain('message');
  });

  it('akceptuje brak company (opcjonalne)', () => {
    const { company, ...noCompany } = valid;
    expect(validate(noCompany).ok).toBe(true);
  });

  it('odrzuca zbyt długą wiadomość', () => {
    const r = validate({ ...valid, message: 'a'.repeat(5001) });
    expect(r.ok).toBe(false);
    expect(r.errors).toContain('message');
  });
});

describe('isHoneypotTriggered', () => {
  it('false gdy honeypot pusty', () => {
    expect(isHoneypotTriggered({ ...valid, website: '' })).toBe(false);
    expect(isHoneypotTriggered(valid)).toBe(false);
  });
  it('true gdy honeypot wypełniony', () => {
    expect(isHoneypotTriggered({ ...valid, website: 'http://spam.example' })).toBe(true);
  });
});

describe('typeLabel', () => {
  it('mapuje znane typy na czytelne etykiety PL', () => {
    expect(typeLabel('audyt-ai')).toBe('Kompleksowy audyt AI');
    expect(typeLabel('konsultacja')).toBe('Bezpłatna konsultacja 30 min');
  });
  it('zwraca surową wartość dla nieznanego typu', () => {
    expect(typeLabel('cokolwiek')).toBe('cokolwiek');
  });
  it('CONTACT_TYPES pokrywa opcje selecta', () => {
    expect(CONTACT_TYPES).toEqual([
      'audyt-ai', 'audyt-content', 'visibility-checker', 'konsultacja', 'wdrozenie', 'inne',
    ]);
  });
});
```

- [ ] **Step 2: Uruchom test — ma FAIL**

Run: `npx vitest run functions/_lib/contact.test.ts`
Expected: FAIL — `Cannot find module './contact'`.

- [ ] **Step 3: Implementacja `functions/_lib/contact.ts`**

```typescript
/**
 * Logika formularza kontaktowego /kontakt/.
 * Czyste funkcje (bez sieci/IO) — walidacja, honeypot, budowa maili.
 * Stan (rate-limit) i wysyłka żyją w functions/api/contact.ts.
 */

export type ContactPayload = {
  name?: string;
  email?: string;
  company?: string;
  type?: string;
  message?: string;
  website?: string; // honeypot — prawdziwy użytkownik zostawia puste
};

export type ValidationResult = { ok: boolean; errors: string[] };

export type ResendEmail = {
  from: string;
  to: string[];
  reply_to?: string;
  subject: string;
  html: string;
  text: string;
};

/** Whitelisty wartości selecta „Cel kontaktu" w kontakt.astro. Kolejność = kolejność w UI. */
export const CONTACT_TYPES = [
  'audyt-ai',
  'audyt-content',
  'visibility-checker',
  'konsultacja',
  'wdrozenie',
  'inne',
] as const;

const TYPE_LABELS: Record<string, string> = {
  'audyt-ai': 'Kompleksowy audyt AI',
  'audyt-content': 'Audyt treści pod AI',
  'visibility-checker': 'Szybki test widoczności (bezpłatny)',
  konsultacja: 'Bezpłatna konsultacja 30 min',
  wdrozenie: 'Audyt + wdrożenie 90 dni',
  inne: 'Inne',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const LIMITS = { name: 120, email: 254, company: 160, message: 5000 };

export function typeLabel(type: string): string {
  return TYPE_LABELS[type] ?? type;
}

export function isHoneypotTriggered(p: ContactPayload): boolean {
  return String(p.website ?? '').trim().length > 0;
}

export function validate(p: ContactPayload): ValidationResult {
  const errors: string[] = [];
  const name = String(p.name ?? '').trim();
  const email = String(p.email ?? '').trim();
  const company = String(p.company ?? '').trim();
  const type = String(p.type ?? '').trim();
  const message = String(p.message ?? '').trim();

  if (name.length < 1 || name.length > LIMITS.name) errors.push('name');
  if (email.length < 1 || email.length > LIMITS.email || !EMAIL_RE.test(email)) errors.push('email');
  if (!CONTACT_TYPES.includes(type as (typeof CONTACT_TYPES)[number])) errors.push('type');
  if (message.length < 1 || message.length > LIMITS.message) errors.push('message');
  if (company.length > LIMITS.company) errors.push('company');

  return { ok: errors.length === 0, errors };
}
```

- [ ] **Step 4: Uruchom test — ma PASS**

Run: `npx vitest run functions/_lib/contact.test.ts`
Expected: PASS (wszystkie `describe` z `validate`, `isHoneypotTriggered`, `typeLabel`).

- [ ] **Step 5: Commit**

```bash
git add functions/_lib/contact.ts functions/_lib/contact.test.ts
git commit -m "feat(widocznosc): walidacja + honeypot + etykiety typów formularza kontaktu"
```

---

## Task 3: `_lib/contact.ts` — `buildEmails`

**Files:**
- Modify: `functions/_lib/contact.ts`
- Test: `functions/_lib/contact.test.ts`

- [ ] **Step 1: Dopisz failing test**

Dopisz na końcu `functions/_lib/contact.test.ts`:

```typescript
import { buildEmails } from './contact';

describe('buildEmails', () => {
  const cfg = { from: 'widocznosc.ai <formularz@widocznosc.ai>', leadTo: 'lead.icea@gmail.com' };

  it('mail wewnętrzny: to=lead, reply_to=email leada, label typu w temacie', () => {
    const { internal } = buildEmails(valid, cfg);
    expect(internal.to).toEqual(['lead.icea@gmail.com']);
    expect(internal.from).toBe('widocznosc.ai <formularz@widocznosc.ai>');
    expect(internal.reply_to).toBe('jan@firma.pl');
    expect(internal.subject).toContain('Kompleksowy audyt AI');
    expect(internal.subject).toContain('Jan Kowalski');
  });

  it('mail wewnętrzny: body zawiera wszystkie pola', () => {
    const { internal } = buildEmails(valid, cfg);
    for (const v of ['Jan Kowalski', 'jan@firma.pl', 'Firma sp. z o.o.', 'Kompleksowy audyt AI']) {
      expect(internal.text).toContain(v);
      expect(internal.html).toContain(v);
    }
  });

  it('autoresponder: to=email leada, from=nasz', () => {
    const { autoresponder } = buildEmails(valid, cfg);
    expect(autoresponder.to).toEqual(['jan@firma.pl']);
    expect(autoresponder.from).toBe('widocznosc.ai <formularz@widocznosc.ai>');
    expect(autoresponder.subject.toLowerCase()).toContain('dziękujemy');
  });

  it('escapuje HTML w polach (anty-injection)', () => {
    const { internal } = buildEmails({ ...valid, message: '<script>x</script>' }, cfg);
    expect(internal.html).not.toContain('<script>x</script>');
    expect(internal.html).toContain('&lt;script&gt;');
    expect(internal.text).toContain('<script>x</script>'); // plain-text bez escape
  });
});
```

- [ ] **Step 2: Uruchom — ma FAIL**

Run: `npx vitest run functions/_lib/contact.test.ts`
Expected: FAIL — `buildEmails is not a function` / brak eksportu.

- [ ] **Step 3: Dopisz `buildEmails` + helper escape do `functions/_lib/contact.ts`**

Dopisz na końcu pliku:

```typescript
export type EmailConfig = { from: string; leadTo: string };

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function fieldRows(p: ContactPayload): Array<[string, string]> {
  return [
    ['Imię i nazwisko', String(p.name ?? '').trim()],
    ['E-mail', String(p.email ?? '').trim()],
    ['Firma', String(p.company ?? '').trim() || '—'],
    ['Cel kontaktu', typeLabel(String(p.type ?? '').trim())],
    ['Wiadomość', String(p.message ?? '').trim()],
  ];
}

export function buildEmails(p: ContactPayload, cfg: EmailConfig): {
  internal: ResendEmail;
  autoresponder: ResendEmail;
} {
  const name = String(p.name ?? '').trim();
  const email = String(p.email ?? '').trim();
  const rows = fieldRows(p);

  const internalText = rows.map(([k, v]) => `${k}: ${v}`).join('\n');
  const internalHtml =
    `<h2>Nowy lead z widocznosc.ai</h2><table cellpadding="6" style="border-collapse:collapse">` +
    rows
      .map(
        ([k, v]) =>
          `<tr><td style="vertical-align:top;font-weight:600">${escapeHtml(k)}</td>` +
          `<td style="white-space:pre-wrap">${escapeHtml(v)}</td></tr>`,
      )
      .join('') +
    `</table>`;

  const internal: ResendEmail = {
    from: cfg.from,
    to: [cfg.leadTo],
    reply_to: email,
    subject: `[widocznosc.ai] Nowy lead: ${typeLabel(String(p.type ?? '').trim())} – ${name}`,
    text: internalText,
    html: internalHtml,
  };

  const autoText =
    `Cześć ${name},\n\n` +
    `dziękujemy za kontakt z widocznosc.ai. Odebraliśmy Twoje zgłoszenie i odpowiemy w ciągu 24 godzin roboczych (pon–pt, 9:00–17:00).\n\n` +
    `W pilnych sprawach: biuro@grupa-icea.pl\n\n` +
    `Pozdrawiamy,\nZespół widocznosc.ai\nICEA S.A., ul. Szyperska 14, 61-754 Poznań`;
  const autoHtml =
    `<p>Cześć ${escapeHtml(name)},</p>` +
    `<p>dziękujemy za kontakt z <strong>widocznosc.ai</strong>. Odebraliśmy Twoje zgłoszenie i odpowiemy w ciągu 24 godzin roboczych (pon–pt, 9:00–17:00).</p>` +
    `<p>W pilnych sprawach: <a href="mailto:biuro@grupa-icea.pl">biuro@grupa-icea.pl</a></p>` +
    `<p>Pozdrawiamy,<br>Zespół widocznosc.ai<br>ICEA S.A., ul. Szyperska 14, 61-754 Poznań</p>`;

  const autoresponder: ResendEmail = {
    from: cfg.from,
    to: [email],
    subject: 'Dziękujemy za kontakt – widocznosc.ai',
    text: autoText,
    html: autoHtml,
  };

  return { internal, autoresponder };
}
```

- [ ] **Step 4: Uruchom — ma PASS**

Run: `npx vitest run functions/_lib/contact.test.ts`
Expected: PASS (w tym test escape HTML).

- [ ] **Step 5: Commit**

```bash
git add functions/_lib/contact.ts functions/_lib/contact.test.ts
git commit -m "feat(widocznosc): buildEmails – mail wewnętrzny + autoresponder (HTML-escape)"
```

---

## Task 4: Endpoint `functions/api/contact.ts`

**Files:**
- Create: `functions/api/contact.ts`

Brak testu jednostkowego (handler cienki: integracja KV+Resend). Weryfikacja przez typecheck/build.

- [ ] **Step 1: Utwórz `functions/api/contact.ts`**

```typescript
/**
 * Formularz kontaktowy – przyjmuje zgłoszenie i wysyła 2 maile przez Resend.
 *
 * Endpoint: POST /api/contact
 * Body: { name, email, company?, type, message, website? }  (website = honeypot)
 * Wymaga: env RESEND_API_KEY. Reużywa bindingu KV FANOUT_RL (prefiks contact:).
 */
import { validate, isHoneypotTriggered, buildEmails, type ContactPayload, type ResendEmail } from '../_lib/contact';
import { evaluateLimit, secondsUntilWarsawMidnight } from '../_lib/rate-limit';

type Env = {
  RESEND_API_KEY?: string;
  FANOUT_RL?: KVNamespace;
};

type LimitRecord = { count: number; resetAt: number };

const RESEND_URL = 'https://api.resend.com/emails';
const LEAD_TO = 'lead.icea@gmail.com';
const FROM = 'widocznosc.ai <formularz@widocznosc.ai>';
const DAILY_LIMIT = 5;
const SEND_TIMEOUT_MS = 15_000;

function jsonHeaders(): HeadersInit {
  return { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };
}
function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders() });
}
function jsonError(status: number, message: string, extra: Record<string, unknown> = {}): Response {
  return json({ error: message, ...extra }, status);
}

export const onRequestGet: PagesFunction = async () =>
  new Response(JSON.stringify({ error: 'Użyj POST z danymi formularza.' }), {
    status: 405,
    headers: { ...jsonHeaders(), Allow: 'POST' },
  });

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

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // 1. Parse
  let body: ContactPayload;
  try {
    body = await request.json<ContactPayload>();
  } catch {
    return jsonError(400, 'Nieprawidłowe body JSON.');
  }

  // 2. Honeypot — bot dostaje fałszywy sukces, nic nie wysyłamy.
  if (isHoneypotTriggered(body)) {
    return json({ ok: true });
  }

  // 3. Walidacja
  const result = validate(body);
  if (!result.ok) {
    return jsonError(400, 'Uzupełnij poprawnie pola formularza.', { fields: result.errors });
  }

  // 4. Konfiguracja
  const apiKey = (env.RESEND_API_KEY || '').trim();
  if (!apiKey) {
    return json(
      { status: 'config-error', error: 'Formularz jest chwilowo niedostępny. Napisz na biuro@grupa-icea.pl.' },
      500,
    );
  }

  // 5. Rate-limit (KV, prefiks contact:) — best-effort: brak bindingu = przepuszczamy.
  const kv = env.FANOUT_RL;
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const kvKey = `contact:${ip}`;
  const now = new Date();
  const ttl = secondsUntilWarsawMidnight(now);
  let record: LimitRecord = { count: 0, resetAt: now.getTime() + ttl * 1000 };
  if (kv) {
    const stored = await kv.get<LimitRecord>(kvKey, 'json');
    if (stored && typeof stored.count === 'number' && typeof stored.resetAt === 'number') record = stored;
  }
  const decision = evaluateLimit(record.count, DAILY_LIMIT);
  if (kv && !decision.allowed) {
    return jsonError(429, `Przekroczono dzienny limit zgłoszeń (${DAILY_LIMIT}). Napisz na biuro@grupa-icea.pl.`);
  }

  // 6. Wysyłka — mail wewnętrzny jest krytyczny.
  const { internal, autoresponder } = buildEmails(body, { from: FROM, leadTo: LEAD_TO });
  const internalOk = await sendViaResend(apiKey, internal);
  if (!internalOk) {
    return jsonError(502, 'Nie udało się wysłać wiadomości. Spróbuj ponownie lub napisz na biuro@grupa-icea.pl.');
  }

  // 7. Autoresponder — best-effort, błąd nie wywraca zgłoszenia.
  await sendViaResend(apiKey, autoresponder);

  // 8. Inkrement limitu dopiero po udanym mailu wewnętrznym.
  if (kv) {
    await kv.put(kvKey, JSON.stringify({ count: Math.max(0, record.count) + 1, resetAt: record.resetAt }), {
      expirationTtl: Math.max(60, Math.ceil((record.resetAt - now.getTime()) / 1000)),
    });
  }

  return json({ ok: true });
};
```

- [ ] **Step 2: Typecheck / build**

Run: `npm run build`
Expected: build przechodzi (Astro + funkcje kompilują się bez błędów typów).

- [ ] **Step 3: Pełny zestaw testów**

Run: `npm test`
Expected: PASS — w tym istniejące testy `_lib/*` oraz nowe `contact.test.ts`.

- [ ] **Step 4: Commit**

```bash
git add functions/api/contact.ts
git commit -m "feat(widocznosc): endpoint /api/contact – Resend + rate-limit + honeypot"
```

---

## Task 5: Front — honeypot + realny submit handler

**Files:**
- Modify: `src/pages/kontakt.astro`

- [ ] **Step 1: Dodaj ukryte pole honeypot do formularza**

W `src/pages/kontakt.astro`, w `<form id="contact-form" ...>`, tuż po otwarciu formularza (przed polem `name`), dodaj:

```html
              <!-- Honeypot: ukryte pole-pułapka. Prawdziwy użytkownik go nie widzi. -->
              <div aria-hidden="true" style="position:absolute;left:-9999px;top:-9999px;height:0;width:0;overflow:hidden;">
                <label for="website">Nie wypełniaj tego pola</label>
                <input type="text" id="website" name="website" tabindex="-1" autocomplete="off" />
              </div>
```

- [ ] **Step 2: Podmień atrapę submit handlera na realny fetch**

W `src/pages/kontakt.astro` zastąp cały blok `<script>` (l. ~249–280, od `const form = ...` do końca handlera) tym:

```html
  <script>
    const form = document.getElementById('contact-form') as HTMLFormElement;
    const success = document.getElementById('contact-success');
    const wrapper = document.getElementById('contact-wrapper');
    const submitBtn = form?.querySelector('button[type="submit"]') as HTMLButtonElement | null;
    const params = new URLSearchParams(window.location.search);
    const typeParam = params.get('type');
    const typeSelect = document.getElementById('type') as HTMLSelectElement | null;

    if (typeParam && typeSelect) {
      const valid = Array.from(typeSelect.options).some((o) => o.value === typeParam);
      if (valid) typeSelect.value = typeParam;
    }

    let errorBox = document.getElementById('contact-error');
    if (!errorBox && form) {
      errorBox = document.createElement('p');
      errorBox.id = 'contact-error';
      errorBox.className = 'mt-4 text-center text-sm';
      errorBox.style.color = '#e5484d';
      errorBox.hidden = true;
      form.appendChild(errorBox);
    }

    function showError(msg: string) {
      if (!errorBox) return;
      errorBox.textContent = msg;
      errorBox.hidden = false;
    }

    function showSuccess() {
      const wrapperHeight = wrapper?.offsetHeight;
      if (wrapper && wrapperHeight) wrapper.style.minHeight = `${wrapperHeight}px`;
      form.style.transition = 'opacity 0.3s ease';
      form.style.opacity = '0';
      setTimeout(() => {
        form.classList.add('hidden');
        success?.classList.remove('hidden');
        success?.classList.add('flex');
        requestAnimationFrame(() => {
          success?.classList.remove('opacity-0');
          success?.classList.add('opacity-100');
        });
      }, 300);
    }

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (errorBox) errorBox.hidden = true;

      const data = Object.fromEntries(new FormData(form).entries());

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.dataset.label = submitBtn.textContent || '';
        submitBtn.textContent = 'Wysyłanie…';
      }

      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (res.ok) {
          showSuccess();
          return;
        }
        if (res.status === 429) {
          showError('Wysłano już kilka zgłoszeń z tego adresu. Napisz bezpośrednio na biuro@grupa-icea.pl.');
        } else {
          showError('Nie udało się wysłać wiadomości. Spróbuj ponownie lub napisz na biuro@grupa-icea.pl.');
        }
      } catch {
        showError('Brak połączenia. Sprawdź internet i spróbuj ponownie.');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = submitBtn.dataset.label || 'Wyślij wiadomość';
        }
      }
    });
  </script>
```

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: build przechodzi bez błędów.

- [ ] **Step 4: Commit**

```bash
git add src/pages/kontakt.astro
git commit -m "feat(widocznosc): realny submit formularza /kontakt/ – fetch + stany + honeypot"
```

---

## Task 6: Dokumentacja sekretu w `wrangler.toml`

**Files:**
- Modify: `wrangler.toml`

- [ ] **Step 1: Dopisz komentarz o sekrecie RESEND_API_KEY**

W `wrangler.toml`, po istniejącym komentarzu o `OPENAI_API_KEY` (po l.9), dodaj:

```toml
# Sekret RESEND_API_KEY dla formularza kontaktu (/api/contact) ustawiany w panelu
# Cloudflare Pages (Settings → Variables and Secrets). Wymaga zweryfikowanej w Resend
# domeny nadawcy widocznosc.ai (rekordy DKIM/SPF na subdomenie wysyłkowej).
# Endpoint reużywa bindingu KV FANOUT_RL (poniżej) z prefiksem klucza contact:.
```

- [ ] **Step 2: Commit**

```bash
git add wrangler.toml
git commit -m "docs(widocznosc): udokumentuj sekret RESEND_API_KEY w wrangler.toml"
```

---

## Po implementacji (kroki usera, poza repo)

Endpoint działa na produkcji dopiero po:
1. **Resend** → dodanie i weryfikacja domeny wysyłkowej `widocznosc.ai` (rekordy DKIM/SPF w DNS Cloudflare; **nie ruszać** głównych MX). From `formularz@widocznosc.ai` musi należeć do zweryfikowanej domeny.
2. **Cloudflare Pages** → Settings → Variables and Secrets → dodać sekret `RESEND_API_KEY`.
3. Deploy z `main` (Astro + funkcje budują się razem).
4. Smoke-test: wysłać formularz, sprawdzić mail na `lead.icea@gmail.com` + autoresponder na adresie testowym.

## Weryfikacja końcowa
- `npm test` — wszystkie testy zielone.
- `npm run build` — build OK.
- Manualnie: `/kontakt/` pokazuje ICEA S.A. / Szyperska 14 / Poznań / biuro@grupa-icea.pl; formularz w stanie loading→success; błąd sieci → komunikat.
