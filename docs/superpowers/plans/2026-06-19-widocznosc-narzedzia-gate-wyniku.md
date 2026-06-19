# Bramka „dane → wynik" dla narzędzi widocznosc.ai – Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dla brand-check i url-check odsłaniać ekranowy wynik dopiero po zostawieniu danych i weryfikacji SMS (gate), licząc wynik po weryfikacji; ai-bots-check i fanout zostają bez zmian.

**Architecture:** `ReportLeadForm` zyskuje prop `mode`: `report` (domyślny, dzisiejsze zachowanie) i `gate` (po weryfikacji emituje `lead:verified {challengeId}` zamiast wołać send-report). Strony brand-check/url-check odraczają liczenie – „Sprawdź" odsłania bramkę, a liczenie + render + `send-report` dzieją się na `lead:verified`. Endpoint `send-report` bierze tożsamość leada ze zweryfikowanego challenge (nie z ciała) i traktuje `result` jako opcjonalny.

**Tech Stack:** Astro 6 + Cloudflare Pages Functions (TypeScript), vitest, Cloudflare KV, istniejące endpointy OTP (`/api/sms/send-code`, `/api/sms/verify-code`), Resend.

## Global Constraints

- Katalog roboczy wszystkich ścieżek: `portals/widocznosc.ai/`.
- Gałąź: `feat/leadgen-sms-otp` (ta sama co PR #3 – ten plan dokłada się do niej).
- Wzorzec: czysta logika w `functions/_lib/` testowana vitest (`*.test.ts` obok źródła, `environment: 'node'`); endpointy = cienka warstwa (gate = lint + pełny `npm run test`).
- Uruchomienie testu: `npm run test -- <ścieżka>`; pełny zestaw: `npm run test`; build front: `npm run build`.
- Gateowane: `brand-check`, `url-check`. Niegateowane (bez zmian behawioralnych): `ai-bots-check`, `fanout`.
- Liczenie wyniku gateowanego **po** weryfikacji; dostarczenie: na ekranie **+** kopia mailem; ICEA dostaje powiadomienie leadowe zawsze.
- Bramka soft: endpointy `/api/tools/*` zostają wywoływalne wprost (własny rate-limit per IP) – bez twardej blokady serwerowej.
- Tożsamość leada w `send-report` pochodzi ze zweryfikowanego challenge (`consumeVerifiedChallenge` zwraca `lead`).
- `ChallengeLead` (z `functions/_lib/otp.ts`): `{ firstName, lastName, email, phone, consent, tool }`.
- Typografia: en-dash (–), nigdy em-dash. Komentarze/UI po polsku. `KVNamespace`/`PagesFunction` to typy globalne – nie importować.

---

### Task 1: `send-report.ts` (_lib) – result opcjonalny + lead z challenge

**Files:**
- Modify: `functions/_lib/send-report.ts`
- Test: `functions/_lib/send-report.test.ts`

**Interfaces:**
- Consumes: `type ChallengeLead` z `./otp`.
- Produces:
  - `validateReportPayload(p)` – wymaga `tool` + `challengeId`; `result` OPCJONALNY (null/undefined OK; jeśli obecny, musi być obiektem ≤ `MAX_PAYLOAD_BYTES`). NIE wymaga już `firstName`/`lastName`/`email`.
  - `buildLeadNotification(lead: ChallengeLead, query: string, cfg: EmailConfig): ResendEmail` – nowa sygnatura: tożsamość z `lead`, nie z payloadu.

- [ ] **Step 1: Zaktualizuj testy**

Otwórz `functions/_lib/send-report.test.ts`. Zastąp blok `describe('validateReportPayload …')` i `describe('buildLeadNotification …')` tym (dopasuj importy na górze: `import { validateReportPayload, buildLeadNotification } from './send-report';`):

```ts
describe('validateReportPayload – tool+challengeId wymagane, result opcjonalny', () => {
  it('ok bez result (np. liczenie padło) – tool + challengeId wystarczą', () => {
    expect(validateReportPayload({ tool: 'brand-check', challengeId: 'abc' } as any).ok).toBe(true);
  });
  it('ok z poprawnym result', () => {
    expect(validateReportPayload({ tool: 'url-check', challengeId: 'abc', result: { x: 1 } } as any).ok).toBe(true);
  });
  it('wymaga tool', () => {
    expect(validateReportPayload({ challengeId: 'abc' } as any).errors).toContain('tool');
  });
  it('wymaga challengeId', () => {
    expect(validateReportPayload({ tool: 'brand-check' } as any).errors).toContain('challengeId');
  });
  it('odrzuca result który nie jest obiektem (gdy obecny)', () => {
    expect(validateReportPayload({ tool: 'brand-check', challengeId: 'abc', result: 'nie' } as any).errors).toContain('result');
  });
  it('NIE wymaga firstName/lastName/email w ciele (są z challenge)', () => {
    const r = validateReportPayload({ tool: 'brand-check', challengeId: 'abc' } as any);
    expect(r.errors).not.toContain('firstName');
    expect(r.errors).not.toContain('email');
  });
});

describe('buildLeadNotification – tożsamość z challenge lead', () => {
  const lead = {
    firstName: 'Jan', lastName: 'Kowalski', email: 'jan@firma.pl',
    phone: '+48512345678', consent: true, tool: 'brand-check',
  };
  it('renderuje imię, telefon, flagę weryfikacji i zapytanie', () => {
    const mail = buildLeadNotification(lead as any, 'Marka X', { from: 'f@x', leadTo: 'lead@x' });
    expect(mail.to).toEqual(['lead@x']);
    expect(mail.reply_to).toBe('jan@firma.pl');
    expect(mail.text).toContain('Jan Kowalski');
    expect(mail.text).toContain('+48512345678');
    expect(mail.text).toContain('Numer zweryfikowany SMS: TAK');
    expect(mail.text).toContain('Marka X');
    expect(mail.subject).toContain('zweryfikowany SMS');
    expect(mail.subject).toContain('Jan Kowalski');
  });
  it('zgoda NIE gdy consent=false', () => {
    const mail = buildLeadNotification({ ...lead, consent: false } as any, '', { from: 'f@x', leadTo: 'lead@x' });
    expect(mail.text).toContain('Zgoda na kontakt: NIE');
  });
});
```

- [ ] **Step 2: Uruchom test – ma FAIL**

Run: `npm run test -- functions/_lib/send-report.test.ts`
Expected: FAIL (stara sygnatura `buildLeadNotification` / stare wymagania walidacji).

- [ ] **Step 3: Implementacja – import typu + walidacja**

W `functions/_lib/send-report.ts` dodaj import (po istniejących):

```ts
import type { ChallengeLead } from './otp';
```

Zamień `validateReportPayload`:

```ts
export function validateReportPayload(p: ReportPayload): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!isTool(p.tool)) errors.push('tool');
  if (String(p.challengeId ?? '').trim().length < 1) errors.push('challengeId');
  // result opcjonalny: brak = OK (np. liczenie padło po weryfikacji – i tak rejestrujemy lead).
  if (p.result != null) {
    if (typeof p.result !== 'object') errors.push('result');
    else if (JSON.stringify(p.result).length > MAX_PAYLOAD_BYTES) errors.push('size');
  }
  return { ok: errors.length === 0, errors };
}
```

- [ ] **Step 4: Implementacja – `buildLeadNotification` z challenge lead**

Zamień całą funkcję `buildLeadNotification`:

```ts
/** Mail wewnętrzny (lead) do ICEA – tożsamość ze zweryfikowanego challenge. */
export function buildLeadNotification(lead: ChallengeLead, query: string, cfg: EmailConfig): ResendEmail {
  const tool = lead.tool as Tool;
  const email = String(lead.email ?? '').trim();
  const fullName = `${String(lead.firstName ?? '').trim()} ${String(lead.lastName ?? '').trim()}`.trim() || '—';
  const phone = String(lead.phone ?? '').trim() || '—';
  const q = String(query ?? '').trim() || '—';
  const consentYes = lead.consent === true;
  const consent = consentYes ? 'TAK' : 'NIE';

  const rows: Array<[string, string]> = [
    ['Narzędzie', toolLabel(tool)],
    ['Imię i nazwisko', fullName],
    ['E-mail', email],
    ['Telefon', phone],
    ['Numer zweryfikowany SMS', 'TAK'],
    ['Zapytanie', q],
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
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add functions/_lib/send-report.ts functions/_lib/send-report.test.ts
git commit -m "refactor(widocznosc): send-report – result opcjonalny + lead z challenge"
```

---

### Task 2: endpoint `send-report` – użyj challenge lead, result opcjonalny, maile best-effort

**Files:**
- Modify: `functions/api/tools/send-report.ts`

**Interfaces:**
- Consumes: `consumeVerifiedChallenge` (zwraca `{ ok, lead? }`), nowy `buildLeadNotification(lead, query, cfg)`, nowy `validateReportPayload` (Task 1).

- [ ] **Step 1: Zamień blok od „4. Konfiguracja" do końca handlera**

W `functions/api/tools/send-report.ts` zamień fragment od komentarza `// 4. Konfiguracja.` (linia ~94) do `return json({ ok: true });` (koniec handlera) tym:

```ts
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

  // 6. Tożsamość leada z challenge (zaufana). result jest opcjonalny.
  const lead = verified.lead!;
  const tool = lead.tool as Tool;
  const query = String(body.query ?? '').trim();
  const hasResult = body.result != null && typeof body.result === 'object';

  // 6a. Kopia raportu do usera – best-effort (na ekranie i tak widzi wynik).
  if (hasResult) {
    const report = renderToolReport(tool, body.result, query);
    const userMail: ResendEmail = {
      from: FROM,
      to: [lead.email],
      subject: report.subject,
      html: report.html,
      text: 'Twój raport widocznosc.ai jest dostępny w wersji HTML tej wiadomości.',
    };
    await sendViaResend(apiKey, userMail);
  }

  // 6b. Powiadomienie leadowe do ICEA – zawsze (lead nie ginie nawet gdy liczenie padło).
  await sendViaResend(apiKey, buildLeadNotification(lead, query, { from: FROM, leadTo: LEAD_TO }));

  // 7. Zlicz limit po obsłudze leada.
  await gate.commit();

  return json({ ok: true });
};
```

(`verified` i `tool` typu `Tool` są już w pliku; `renderToolReport`/`Tool` importowane. `lead` typu `ChallengeLead` zwraca `consumeVerifiedChallenge`.)

- [ ] **Step 2: Lint + pełny zestaw testów**

Run: `npm run lint -- functions/api/tools/send-report.ts`
Expected: brak nowych błędów dla pliku.
Run: `npm run test`
Expected: PASS (120 + ew. zmienione w Task 1).

- [ ] **Step 3: Commit**

```bash
git add functions/api/tools/send-report.ts
git commit -m "feat(widocznosc): send-report – lead z challenge, result opcjonalny, maile best-effort"
```

---

### Task 3: `ReportLeadForm.astro` – prop `mode` + tryb `gate`

**Files:**
- Modify: `src/components/tools/ReportLeadForm.astro`

**Interfaces:**
- Produces zdarzenia:
  - nasłuch `lead:gate:show` (detail `{ tool, query }`) – odsłania bramkę w trybie `gate`.
  - emit `lead:verified` (detail `{ challengeId }`) – po weryfikacji w trybie `gate`.
- Prop `mode?: 'report' | 'gate'` (domyślnie `'report'`).

- [ ] **Step 1: Frontmatter – dodaj `mode` + kontekstowe teksty**

Zamień blok `interface Props { … }` i destrukturyzację:

```astro
interface Props {
  tool: 'brand-check' | 'fanout' | 'url-check' | 'ai-bots-check';
  mode?: 'report' | 'gate';
  ctaLead: string; // zdanie kontekstowe nad przyciskiem CTA
  ctaButton: string; // etykieta przycisku CTA
  ctaHref?: string;
  maxWidth?: string;
}
const { tool, mode = 'report', ctaLead, ctaButton, ctaHref = '/kontakt/', maxWidth } = Astro.props;
const isGate = mode === 'gate';
const title = isGate ? 'Zostaw dane, by zobaczyć wynik' : 'Wyślij sobie ten raport na e-mail';
const sub = isGate
  ? 'Wynik audytu pokażemy od razu po weryfikacji numeru. Bez zobowiązań.'
  : 'Dostaniesz pełny wynik w czytelnej formie. Bez zobowiązań.';
const confirmLabel = isGate ? 'Pokaż wynik' : 'Wyślij audyt';
```

- [ ] **Step 2: Markup – `data-mode`, dynamiczne teksty, etykieta przycisku**

W `<section …>` dodaj atrybut `data-mode={mode}` (obok `data-tool={tool}`). Zamień nagłówek/sub:

```astro
    <h3 class="report-lead__title">{title}</h3>
    <p class="report-lead__sub">{sub}</p>
```

Zamień etykietę przycisku „confirm" (linia z `data-role="confirm"`):

```astro
          <button type="submit" class="report-lead__btn" disabled data-role="confirm">{confirmLabel}</button>
```

- [ ] **Step 3: Skrypt – rozgałęzienie reveal i ścieżki po weryfikacji**

W bloku `<script>` zastąp listener `tool:result` (linie ~142–147) tymi dwoma listenerami:

```ts
    // Tryb 'report' (domyślny): bramka pod gotowym wynikiem.
    document.addEventListener('tool:result', (e) => {
      const detail = (e as CustomEvent).detail || {};
      latest = { query: String(detail.query || ''), result: detail.result ?? null };
      const section = document.querySelector<HTMLElement>('[data-report-lead]');
      if (!section || section.getAttribute('data-mode') === 'gate') return;
      section.hidden = false;
    });

    // Tryb 'gate': bramka odsłaniana PRZED wynikiem (strona narzędzia steruje liczeniem).
    document.addEventListener('lead:gate:show', (e) => {
      const detail = (e as CustomEvent).detail || {};
      latest = { query: String(detail.query || ''), result: null };
      const section = document.querySelector<HTMLElement>('[data-report-lead]');
      if (!section || section.getAttribute('data-mode') !== 'gate') return;
      section.hidden = false;
      section.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
```

Zamień funkcję `verifyAndSend` tak, by rozgałęziała się wg trybu sekcji:

```ts
    function fireGenerateLead() {
      const wAny = window as any;
      wAny.dataLayer = wAny.dataLayer || [];
      wAny.dataLayer.push({ event: 'generate_lead', form_id: 'narzedzia', lead_type: 'raport', phone_verified: true });
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

        fireGenerateLead();
        form.querySelector<HTMLElement>('[data-step="code"]')!.hidden = true;

        if (section.getAttribute('data-mode') === 'gate') {
          // Bramka: oddaj sterowanie stronie – ona liczy, renderuje i woła send-report.
          setStatus(form, 'Numer potwierdzony – generuję wynik…');
          document.dispatchEvent(new CustomEvent('lead:verified', { detail: { challengeId } }));
          return;
        }

        // Tryb 'report': wynik już jest na ekranie – wyślij kopię mailem + powiadom ICEA.
        setStatus(form, 'Wysyłam raport…');
        const res = await fetch('/api/tools/send-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tool: section.getAttribute('data-tool') || '',
            challengeId,
            query: latest.query,
            result: latest.result,
          }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
        setStatus(form, 'Gotowe! Kopia raportu poszła na podany e-mail. Sprawdź skrzynkę (i spam).');
      } catch (err) {
        setStatus(form, err instanceof Error ? err.message : 'Nie udało się dokończyć.');
        if (confirm) confirm.disabled = false;
      }
    }
```

(Uwaga: w trybie `report` payload do send-report nie zawiera już pól tożsamości – pochodzą z challenge. `confirm` ponownie włączamy tylko przy błędzie; po sukcesie krok kodu jest schowany.)

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: sukces (komponent kompiluje się; brak błędów TS w `<script>`).

- [ ] **Step 5: Commit**

```bash
git add src/components/tools/ReportLeadForm.astro
git commit -m "feat(widocznosc): ReportLeadForm – tryb gate (lead:verified) obok report"
```

---

### Task 4: `brand-check.astro` – gated (odroczenie liczenia)

**Files:**
- Modify: `src/pages/narzedzia/brand-check.astro`

**Interfaces:**
- Consumes: `ReportLeadForm` z `mode="gate"`; zdarzenia `lead:gate:show` (emit) i `lead:verified` (nasłuch).

- [ ] **Step 1: Ustaw `mode="gate"` na komponencie**

Znajdź `<ReportLeadForm tool="brand-check" … />` (ok. linii 112–116) i dodaj `mode="gate"`:

```astro
  <ReportLeadForm
    tool="brand-check"
    mode="gate"
    ctaLead="Twoja marka zasługuje na lepszą widoczność w AI. Umów bezpłatną konsultację z ekspertem ICEA."
    ctaButton="Umów konsultację"
  />
```

- [ ] **Step 2: Refaktor skryptu – „Sprawdź" odsłania bramkę; liczenie na `lead:verified`**

W `initBrandCheck` zamień handler `form.addEventListener('submit', …)` (linie ~1022–1057) tym:

```ts
    let pendingBrand: { brand: string; domain: string; category: string; market: string } | null = null;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const payload = {
        brand: String(data.get('brand') || '').trim(),
        domain: String(data.get('domain') || '').trim(),
        category: String(data.get('category') || '').trim(),
        market: String(data.get('market') || '').trim() || 'Polska',
      };
      if (!payload.brand) { renderError('Podaj nazwę marki.'); return; }
      // Bramka: nie liczymy, dopóki user nie zostawi danych i nie potwierdzi numeru.
      pendingBrand = payload;
      document.dispatchEvent(new CustomEvent('lead:gate:show', { detail: { tool: 'brand-check', query: payload.brand } }));
    });

    async function runBrandCheck(challengeId: string) {
      if (!pendingBrand) return;
      const payload = pendingBrand;
      setLoading(true);
      results.classList.remove('hidden');
      results.innerHTML = renderLoading(payload.brand);
      overview?.classList.add('hidden');
      let result: unknown = null;
      try {
        const response = await fetch('/api/tools/brand-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || `HTTP ${response.status}`);
        result = body;
        renderResults(body);
      } catch (error) {
        renderError(error instanceof Error ? error.message : 'Nie udało się wykonać testu.');
      } finally {
        setLoading(false);
      }
      // Rejestracja leada + kopia mailem (result=null gdy liczenie padło – ICEA i tak dostaje lead).
      try {
        await fetch('/api/tools/send-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tool: 'brand-check', challengeId, query: payload.brand, result }),
        });
      } catch { /* best-effort */ }
    }

    document.addEventListener('lead:verified', (e) => {
      const challengeId = String((e as CustomEvent).detail?.challengeId || '');
      void runBrandCheck(challengeId);
    });
```

(`renderError`, `renderResults`, `renderLoading`, `setLoading`, `results`, `overview` są zdefiniowane w `initBrandCheck` – `runBrandCheck` i listener muszą być wewnątrz tej funkcji, by mieć do nich dostęp.)

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: sukces.

- [ ] **Step 4: Commit**

```bash
git add src/pages/narzedzia/brand-check.astro
git commit -m "feat(widocznosc): brand-check – bramka danych przed wynikiem"
```

---

### Task 5: `url-check.astro` – gated (odroczenie liczenia)

**Files:**
- Modify: `src/pages/narzedzia/url-check.astro`

**Interfaces:**
- Consumes: `ReportLeadForm` z `mode="gate"`; zdarzenia `lead:gate:show` (emit), `lead:verified` (nasłuch).

- [ ] **Step 1: Ustaw `mode="gate"` na komponencie**

Znajdź `<ReportLeadForm tool="url-check" … />` (ok. linii 84–89) i dodaj `mode="gate"`:

```astro
  <ReportLeadForm
    tool="url-check"
    mode="gate"
    ctaLead="Chcesz podnieść ocenę AI-readiness swojej strony? Umów audyt z ekspertem ICEA."
    ctaButton="Umów audyt"
    maxWidth="100%"
  />
```

- [ ] **Step 2: Refaktor skryptu – „Sprawdź" odsłania bramkę; liczenie na `lead:verified`**

Zamień handler `form.addEventListener('submit', …)` (linie ~1043–1091) tym:

```ts
  let pendingUrl: string | null = null;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const url = input.value.trim();
    if (!url) { input.focus(); return; }
    // Bramka: nie liczymy, dopóki user nie zostawi danych i nie potwierdzi numeru.
    pendingUrl = url;
    document.dispatchEvent(new CustomEvent('lead:gate:show', { detail: { tool: 'url-check', query: url } }));
  });

  async function runUrlCheck(challengeId: string) {
    if (!pendingUrl) return;
    const url = pendingUrl;
    submitBtn.setAttribute('aria-busy', 'true');
    submitBtn.disabled = true;
    resultsEl.classList.remove('hidden');
    resultsEl.innerHTML =
      '<div class="results-card" style="text-align:center; color: var(--ink-muted);">Pobieramy stronę, liczymy sygnały techniczne i analizujemy semantykę – 10–20 sekund…</div>';
    let result: unknown = null;
    try {
      const res = await fetch('/api/tools/url-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        resultsEl.innerHTML = `
          <div class="results-error">
            <h3 class="results-error-title">Nie udało się sprawdzić URL</h3>
            <p class="results-error-desc">${escapeHtml(errBody.error || `HTTP ${res.status}`)}</p>
          </div>
        `;
      } else {
        const data = (await res.json()) as CheckResponse;
        result = data;
        resultsEl.innerHTML = renderResults(data);
        overviewEl.classList.add('hidden');
        resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } catch (err) {
      resultsEl.innerHTML = `
        <div class="results-error">
          <h3 class="results-error-title">Błąd połączenia</h3>
          <p class="results-error-desc">${escapeHtml((err as Error).message || 'Spróbuj ponownie za chwilę.')}</p>
        </div>
      `;
    } finally {
      submitBtn.setAttribute('aria-busy', 'false');
      submitBtn.disabled = false;
    }
    // Rejestracja leada + kopia mailem (result=null gdy liczenie padło).
    try {
      await fetch('/api/tools/send-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool: 'url-check', challengeId, query: url, result }),
      });
    } catch { /* best-effort */ }
  }

  document.addEventListener('lead:verified', (e) => {
    const challengeId = String((e as CustomEvent).detail?.challengeId || '');
    void runUrlCheck(challengeId);
  });
```

(`input`, `resultsEl`, `submitBtn`, `overviewEl`, `renderResults`, `escapeHtml`, `CheckResponse` są w zasięgu skryptu url-check – `runUrlCheck` i listener muszą być w tym samym zasięgu.)

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: sukces.

- [ ] **Step 4: Commit**

```bash
git add src/pages/narzedzia/url-check.astro
git commit -m "feat(widocznosc): url-check – bramka danych przed wynikiem"
```

---

## Self-Review

**Spec coverage:**
- Flow gateowany (fraza → dane → kod → liczenie → wynik + mail) → Task 4 (brand-check), Task 5 (url-check) + tryb `gate` w Task 3. ✔
- Liczenie po weryfikacji → `runBrandCheck`/`runUrlCheck` wołane z `lead:verified`. ✔
- Dostarczenie na ekranie + kopia mailem → render w stronie + `send-report` z `result`. ✔
- Nie gubimy leada przy błędzie liczenia → `send-report` wołany z `result:null`, endpoint zawsze notyfikuje (Task 2). ✔
- Tożsamość leada z challenge → Task 1 (`buildLeadNotification(lead, …)`) + Task 2 (endpoint `verified.lead`). ✔
- `result` opcjonalny → Task 1 (walidacja) + Task 2 (endpoint `hasResult`). ✔
- ai-bots-check + fanout bez zmian → nietknięte; `ReportLeadForm` domyślnie `mode="report"` (Task 3 zachowuje ścieżkę). ✔
- `mode` prop, soft gate → Task 3; brak zmian w endpointach narzędzi. ✔
- GTM `generate_lead {phone_verified:true}` → `fireGenerateLead` w obu trybach (Task 3). ✔

**Placeholder scan:** brak TBD/TODO; każdy krok kodu ma pełną implementację. ✔

**Type consistency:** `lead:gate:show`/`lead:verified` z detalem `{tool,query}`/`{challengeId}` spójnie między Task 3 (emit/odbiór) a Task 4/5; `buildLeadNotification(lead, query, cfg)` z Task 1 wołane tak samo w Task 2; `validateReportPayload` wymaga `tool`+`challengeId` (result opcjonalny) – payloady z Task 3 (report) i Task 4/5 (gate) zawierają oba. ✔

**Uwaga (zgodność wsteczna, nieblokująca):** w trybie `report` (ai-bots/fanout) payload do `send-report` nie wysyła już pól tożsamości (Task 3) – endpoint i tak bierze je z challenge (Task 2), więc dane leadowe są identyczne. Kopia raportu i powiadomienie leadowe są teraz best-effort (błąd maila nie zwraca 502) – wynik i tak jest na ekranie; lead nie ginie.
