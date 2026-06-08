# Baner zgody + Consent Mode v2 (widocznosc.ai) – Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dodać własny baner zgody RODO + sygnały Google Consent Mode v2 dla GTM/GA4 na widocznosc.ai, plus domknąć pomiar drugiego formularza lead-gen i przygotować instrukcję dla analityka.

**Architecture:** Czysta, testowalna logika sygnałów w `src/lib/consent.ts`. Komponent `CookieConsent.astro` (pasek + panel, dual-theme z tokenów) wpięty raz globalnie w `Layout.astro`. Inline skrypt w `<head>` NAD snippetem GTM ustawia `consent default: denied` i dla powracających robi natychmiastowy `update` z cookie. Skrypt komponentu używa delegacji zdarzeń na `document` (przeżywa swapy ClientRouter) i re-inicjalizuje widoczność na `astro:page-load`.

**Tech Stack:** Astro 6.2, TypeScript, Vitest (test runner: `npm test` → `vitest run`), Cloudflare Pages. Pracujemy w katalogu `portals/widocznosc.ai/` (wszystkie ścieżki względem niego, chyba że podano inaczej; commity z roota repo).

**Konwencje commitów:** styl projektu (`feat(widocznosc): …`, PL). Każdy commit kończy trailer:
`Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.
Commitujemy WYŁĄCZNIE pliki dotknięte w danym tasku (repo ma niezależne, niezacommitowane zmiany – nie zagarniać `git add -A`).

---

## File Structure

- **Create** `portals/widocznosc.ai/src/lib/consent.ts` – czyste funkcje: parse/serialize cookie + mapowanie kategorii → sygnały Consent Mode v2. Jedyne źródło prawdy logiki zgód.
- **Create** `portals/widocznosc.ai/src/lib/consent.test.ts` – testy jednostkowe powyższego.
- **Create** `portals/widocznosc.ai/src/components/CookieConsent.astro` – markup paska + panelu, scoped style (tokeny design systemu), bundled client-script.
- **Modify** `portals/widocznosc.ai/src/layouts/Layout.astro` – inline consent-default skrypt nad GTM (head) + import i render `<CookieConsent />` (body).
- **Modify** `portals/widocznosc.ai/src/components/Footer.astro` – przycisk „Ustawienia cookies" dispatchujący event `open-cookie-settings` + styl.
- **Modify** `portals/widocznosc.ai/src/components/tools/ReportLeadForm.astro` – `dataLayer.push({event:'generate_lead', …})` po sukcesie.
- **Create** `docs/widocznosc-ai/analityka-handoff-2026-06-08.md` – instrukcja dla analityka (trigger `generate_lead`, Consent Mode, decyzja `page_view`).

---

## Task 1: Czysta logika zgód (`consent.ts`) – TDD

**Files:**
- Create: `portals/widocznosc.ai/src/lib/consent.ts`
- Test: `portals/widocznosc.ai/src/lib/consent.test.ts`

- [ ] **Step 1: Write the failing test**

Plik `src/lib/consent.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  CONSENT_VERSION,
  parseConsentCookie,
  serializeConsent,
  toConsentSignals,
  type ConsentState,
} from './consent';

const state: ConsentState = {
  v: CONSENT_VERSION,
  analytics: true,
  marketing: false,
  ts: 1700000000000,
};

describe('parseConsentCookie', () => {
  it('zwraca null gdy brak cookie', () => {
    expect(parseConsentCookie('theme=dark; foo=bar')).toBeNull();
  });
  it('zwraca null przy zepsutym JSON', () => {
    expect(parseConsentCookie('wai_consent=not-json')).toBeNull();
  });
  it('zwraca null przy niezgodnej wersji', () => {
    const v = encodeURIComponent(JSON.stringify({ v: 0, analytics: true, marketing: true, ts: 1 }));
    expect(parseConsentCookie('wai_consent=' + v)).toBeNull();
  });
  it('parsuje poprawne cookie spośród innych', () => {
    const cookie = 'theme=dark; wai_consent=' + serializeConsent(state) + '; x=1';
    expect(parseConsentCookie(cookie)).toEqual(state);
  });
});

describe('serializeConsent round-trip', () => {
  it('serialize → parse zwraca równy stan', () => {
    expect(parseConsentCookie('wai_consent=' + serializeConsent(state))).toEqual(state);
  });
});

describe('toConsentSignals', () => {
  it('sama analityka', () => {
    expect(toConsentSignals({ analytics: true, marketing: false })).toEqual({
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    });
  });
  it('marketing mapuje na trzy sygnały ad_*', () => {
    expect(toConsentSignals({ analytics: false, marketing: true })).toEqual({
      analytics_storage: 'denied',
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted',
    });
  });
  it('wszystko odrzucone', () => {
    expect(toConsentSignals({ analytics: false, marketing: false })).toEqual({
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    });
  });
  it('wszystko zaakceptowane', () => {
    expect(toConsentSignals({ analytics: true, marketing: true })).toEqual({
      analytics_storage: 'granted',
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted',
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/consent.test.ts`
Expected: FAIL – `Failed to resolve import "./consent"` / „does not provide an export".

- [ ] **Step 3: Write minimal implementation**

Plik `src/lib/consent.ts`:

```ts
// Czysta logika zgód cookie (RODO + Consent Mode v2). Bez DOM/efektów ubocznych.
// UWAGA: stała CONSENT_VERSION musi być zsynchronizowana z inline head-skryptem
// w Layout.astro (tam wersja jest zapisana na sztywno jako `s.v === 1`).
export const CONSENT_VERSION = 1;
export const CONSENT_COOKIE = 'wai_consent';

export type ConsentState = {
  v: number;
  analytics: boolean;
  marketing: boolean;
  ts: number;
};

export type ConsentSignals = {
  analytics_storage: 'granted' | 'denied';
  ad_storage: 'granted' | 'denied';
  ad_user_data: 'granted' | 'denied';
  ad_personalization: 'granted' | 'denied';
};

export function parseConsentCookie(cookieString: string): ConsentState | null {
  const m = new RegExp('(?:^|; )' + CONSENT_COOKIE + '=([^;]+)').exec(cookieString);
  if (!m) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(m[1]));
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      parsed.v !== CONSENT_VERSION ||
      typeof parsed.analytics !== 'boolean' ||
      typeof parsed.marketing !== 'boolean'
    ) {
      return null;
    }
    return {
      v: CONSENT_VERSION,
      analytics: parsed.analytics,
      marketing: parsed.marketing,
      ts: typeof parsed.ts === 'number' ? parsed.ts : 0,
    };
  } catch {
    return null;
  }
}

export function serializeConsent(state: ConsentState): string {
  return encodeURIComponent(
    JSON.stringify({
      v: state.v,
      analytics: state.analytics,
      marketing: state.marketing,
      ts: state.ts,
    }),
  );
}

export function toConsentSignals(state: { analytics: boolean; marketing: boolean }): ConsentSignals {
  return {
    analytics_storage: state.analytics ? 'granted' : 'denied',
    ad_storage: state.marketing ? 'granted' : 'denied',
    ad_user_data: state.marketing ? 'granted' : 'denied',
    ad_personalization: state.marketing ? 'granted' : 'denied',
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/consent.test.ts`
Expected: PASS (11 testów zielonych).

- [ ] **Step 5: Commit**

```bash
git add portals/widocznosc.ai/src/lib/consent.ts portals/widocznosc.ai/src/lib/consent.test.ts
git commit -m "feat(widocznosc): logika zgód cookie + Consent Mode v2 (consent.ts + testy)" \
           -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Komponent `CookieConsent.astro`

**Files:**
- Create: `portals/widocznosc.ai/src/components/CookieConsent.astro`

- [ ] **Step 1: Utwórz komponent**

Plik `src/components/CookieConsent.astro` (całość):

```astro
---
// Baner zgody RODO + Consent Mode v2. Renderowany raz globalnie w Layout (body).
// Logika sygnałów: ../lib/consent.ts. Skrypt `consent default` (head, przed GTM)
// jest w Layout.astro. Skrypt poniżej obsługuje interakcję i zapis cookie.
// Odporność na ClientRouter: delegacja klików na `document` + re-init na astro:page-load.
---

<div id="cookie-consent" class="cc" data-cc hidden>
  <!-- Pasek -->
  <div class="cc__bar" role="region" aria-label="Zgoda na pliki cookie">
    <p class="cc__text">
      Używamy plików cookie do analityki i&nbsp;marketingu. Możesz zaakceptować wszystkie,
      odrzucić albo wybrać szczegóły. Więcej w&nbsp;<a href="/polityka-prywatnosci/" class="cc__link"
        >polityce prywatności</a
      >.
    </p>
    <div class="cc__actions">
      <button type="button" class="cc__btn cc__btn--ghost" data-consent-action="settings">Ustawienia</button>
      <button type="button" class="cc__btn cc__btn--solid" data-consent-action="reject">Odrzuć wszystko</button>
      <button type="button" class="cc__btn cc__btn--primary" data-consent-action="accept">Zaakceptuj wszystko</button>
    </div>
  </div>

  <!-- Panel kategorii -->
  <div class="cc__panel" data-cc-panel hidden role="dialog" aria-modal="false" aria-label="Ustawienia plików cookie">
    <fieldset class="cc__cat">
      <label class="cc__cat-row">
        <input type="checkbox" checked disabled />
        <span><strong>Niezbędne</strong> – wymagane do działania strony. Zawsze aktywne.</span>
      </label>
      <label class="cc__cat-row">
        <input type="checkbox" data-consent-cat="analytics" />
        <span><strong>Analityka</strong> – anonimowe statystyki ruchu (GA4).</span>
      </label>
      <label class="cc__cat-row">
        <input type="checkbox" data-consent-cat="marketing" />
        <span><strong>Marketing</strong> – pomiar i&nbsp;personalizacja reklam.</span>
      </label>
    </fieldset>
    <div class="cc__actions">
      <button type="button" class="cc__btn cc__btn--solid" data-consent-action="reject">Odrzuć wszystko</button>
      <button type="button" class="cc__btn cc__btn--primary" data-consent-action="save">Zapisz wybór</button>
    </div>
  </div>
</div>

<style>
  .cc {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 9999;
    padding: 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    pointer-events: none;
  }
  .cc[hidden] {
    display: none;
  }

  .cc__bar,
  .cc__panel {
    pointer-events: auto;
    width: 100%;
    max-width: 920px;
    background: var(--bg-surface-1);
    border: 1px solid var(--hairline-soft);
    border-radius: 14px;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.28);
    padding: 16px 18px;
  }

  .cc__bar {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  @media (min-width: 760px) {
    .cc__bar {
      flex-direction: row;
      align-items: center;
      gap: 18px;
    }
  }

  .cc__text {
    margin: 0;
    font-family: var(--font-sans);
    font-size: 13px;
    line-height: 1.5;
    color: var(--ink-muted);
    flex: 1;
  }

  .cc__link {
    color: var(--accent-blue);
    text-decoration: underline;
  }

  .cc__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }

  .cc__btn {
    font-family: var(--font-sans);
    font-size: 13px;
    font-weight: 500;
    border-radius: 9px;
    padding: 9px 16px;
    cursor: pointer;
    border: 1px solid transparent;
    white-space: nowrap;
    transition:
      background 0.15s ease,
      color 0.15s ease,
      border-color 0.15s ease;
  }

  /* Accept i Reject = równorzędna waga wizualna (wymóg RODO) */
  .cc__btn--primary {
    background: var(--accent-blue);
    color: #fff;
  }
  .cc__btn--primary:hover {
    filter: brightness(1.08);
  }

  .cc__btn--solid {
    background: var(--bg-surface-2);
    color: var(--ink);
    border-color: var(--hairline-soft);
  }
  .cc__btn--solid:hover {
    background: var(--bg-surface-1);
  }

  .cc__btn--ghost {
    background: transparent;
    color: var(--ink-muted);
  }
  .cc__btn--ghost:hover {
    color: var(--ink);
  }

  .cc__btn:focus-visible {
    outline: 2px solid var(--accent-blue);
    outline-offset: 2px;
  }

  .cc__panel[hidden] {
    display: none;
  }

  .cc__cat {
    border: 0;
    margin: 0 0 14px;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .cc__cat-row {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    font-family: var(--font-sans);
    font-size: 13px;
    line-height: 1.45;
    color: var(--ink-muted);
    cursor: pointer;
  }

  .cc__cat-row input {
    margin-top: 2px;
    flex: 0 0 auto;
    accent-color: var(--accent-blue);
  }

  .cc__cat-row strong {
    color: var(--ink);
    font-weight: 600;
  }
</style>

<script>
  import {
    CONSENT_COOKIE,
    CONSENT_VERSION,
    parseConsentCookie,
    serializeConsent,
    toConsentSignals,
    type ConsentState,
  } from '../lib/consent';

  type Gtag = (...args: unknown[]) => void;
  const w = window as unknown as { dataLayer?: unknown[]; gtag?: Gtag };

  function gtagUpdate(analytics: boolean, marketing: boolean) {
    w.dataLayer = w.dataLayer || [];
    const gtag: Gtag =
      w.gtag ||
      ((...a: unknown[]) => {
        w.dataLayer!.push(a);
      });
    gtag('consent', 'update', toConsentSignals({ analytics, marketing }));
  }

  function writeCookie(state: ConsentState) {
    const maxAge = 60 * 60 * 24 * 365; // 12 miesięcy
    const secure = location.protocol === 'https:' ? '; Secure' : '';
    document.cookie =
      CONSENT_COOKIE +
      '=' +
      serializeConsent(state) +
      '; Max-Age=' +
      maxAge +
      '; Path=/; SameSite=Lax' +
      secure;
  }

  function persist(analytics: boolean, marketing: boolean) {
    writeCookie({ v: CONSENT_VERSION, analytics, marketing, ts: Date.now() });
    gtagUpdate(analytics, marketing);
  }

  const root = () => document.querySelector<HTMLElement>('[data-cc]');
  const panel = () => document.querySelector<HTMLElement>('[data-cc-panel]');

  function showBar() {
    const r = root();
    if (r) r.hidden = false;
  }
  function hideAll() {
    const r = root();
    if (r) r.hidden = true;
    const p = panel();
    if (p) p.hidden = true;
  }
  function openPanel() {
    showBar();
    const p = panel();
    if (!p) return;
    const cur = parseConsentCookie(document.cookie);
    const a = p.querySelector<HTMLInputElement>('[data-consent-cat="analytics"]');
    const m = p.querySelector<HTMLInputElement>('[data-consent-cat="marketing"]');
    if (a) a.checked = cur?.analytics ?? false;
    if (m) m.checked = cur?.marketing ?? false;
    p.hidden = false;
    p.querySelector<HTMLInputElement>('input:not([disabled])')?.focus();
  }

  // Widoczność: uruchamiane na każdym wejściu/nawigacji (DOM re-render przy ClientRouter).
  function initVisibility() {
    if (parseConsentCookie(document.cookie)) hideAll();
    else showBar();
  }

  // Delegacja klików na document – przeżywa swapy ClientRouter.
  document.addEventListener('click', (e) => {
    const t = (e.target as HTMLElement)?.closest<HTMLElement>('[data-consent-action]');
    if (!t) return;
    const action = t.dataset.consentAction;
    if (action === 'accept') {
      persist(true, true);
      hideAll();
    } else if (action === 'reject') {
      persist(false, false);
      hideAll();
    } else if (action === 'settings') {
      openPanel();
    } else if (action === 'save') {
      const p = panel();
      const a = p?.querySelector<HTMLInputElement>('[data-consent-cat="analytics"]')?.checked ?? false;
      const m = p?.querySelector<HTMLInputElement>('[data-consent-cat="marketing"]')?.checked ?? false;
      persist(a, m);
      hideAll();
    }
  });

  // Re-open ze stopki.
  window.addEventListener('open-cookie-settings', openPanel);

  // ESC zamyka panel.
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const p = panel();
    if (p && !p.hidden) p.hidden = true;
  });

  document.addEventListener('astro:page-load', initVisibility);
  initVisibility(); // pokrycie wypadku, gdy astro:page-load już padł
</script>
```

- [ ] **Step 2: Lint i typecheck**

Run: `npm run lint`
Expected: brak błędów dla `CookieConsent.astro` (ostrzeżenia z innych, niedotykanych plików ignorujemy).

- [ ] **Step 3: Commit**

```bash
git add portals/widocznosc.ai/src/components/CookieConsent.astro
git commit -m "feat(widocznosc): komponent CookieConsent (pasek + panel, dual-theme)" \
           -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Wpięcie w `Layout.astro` (consent default + render)

**Files:**
- Modify: `portals/widocznosc.ai/src/layouts/Layout.astro` (import: po linii 10; head-skrypt: przed linią 47 `<!-- Google Tag Manager -->`; render: po `</main>`)

- [ ] **Step 1: Dodaj import komponentu w frontmatter**

Po linii `import { buildGraph, organizationNode, websiteNode, SITE_URL } from '../lib/schema';` dodaj:

```astro
import CookieConsent from '../components/CookieConsent.astro';
```

- [ ] **Step 2: Wstaw inline consent-default skrypt NAD snippetem GTM**

Bezpośrednio przed komentarzem `<!-- Google Tag Manager -->` (obecnie linia 47) wstaw:

```astro
    <!-- Consent Mode v2 default – MUSI być przed GTM. Domyślnie denied;
         powracający użytkownik → natychmiastowy update z cookie wai_consent.
         Wersja `s.v === 1` zsynchronizowana z CONSENT_VERSION w src/lib/consent.ts. -->
    <script is:inline>
      (function () {
        window.dataLayer = window.dataLayer || [];
        function gtag() {
          dataLayer.push(arguments);
        }
        window.gtag = gtag;
        gtag('consent', 'default', {
          ad_storage: 'denied',
          ad_user_data: 'denied',
          ad_personalization: 'denied',
          analytics_storage: 'denied',
          functionality_storage: 'granted',
          security_storage: 'granted',
          wait_for_update: 500,
        });
        gtag('set', 'ads_data_redaction', true);
        try {
          var m = /(?:^|; )wai_consent=([^;]+)/.exec(document.cookie);
          if (m) {
            var s = JSON.parse(decodeURIComponent(m[1]));
            if (s && s.v === 1) {
              gtag('consent', 'update', {
                analytics_storage: s.analytics ? 'granted' : 'denied',
                ad_storage: s.marketing ? 'granted' : 'denied',
                ad_user_data: s.marketing ? 'granted' : 'denied',
                ad_personalization: s.marketing ? 'granted' : 'denied',
              });
            }
          }
        } catch (e) {}
      })();
    </script>
```

- [ ] **Step 3: Wyrenderuj baner w body**

Zaraz po zamykającym `</main>` (obecnie linia 115) dodaj:

```astro
    <CookieConsent />
```

- [ ] **Step 4: Build – weryfikacja, że strona się składa**

Run: `npm run build`
Expected: build OK, brak błędów Astro/TS. (Sanity: w `dist/` snippet `gtag('consent', 'default'` pojawia się przed `googletagmanager.com/gtm.js`.)

Sprawdzenie kolejności: `grep -n "consent', 'default'\|gtm.js" dist/index.html | head` → linia z `consent default` ma niższy numer niż `gtm.js`.

- [ ] **Step 5: Commit**

```bash
git add portals/widocznosc.ai/src/layouts/Layout.astro
git commit -m "feat(widocznosc): consent default v2 przed GTM + render banera w Layout" \
           -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Link „Ustawienia cookies" w stopce

**Files:**
- Modify: `portals/widocznosc.ai/src/components/Footer.astro` (bottom bar ~linia 118; style ~przed `.footer-socials`)

- [ ] **Step 1: Dodaj przycisk w bottom barze**

W bloku `<div class="footer-bottom">` (linia 118), pomiędzy `<span class="footer-copy">…</span>` (linia 119) a `<div class="footer-socials">` (linia 120), wstaw:

```astro
      <button type="button" class="footer-cookie-btn" data-open-cookie-settings>
        Ustawienia cookies
      </button>
```

- [ ] **Step 2: Dodaj handler dispatchujący event (w istniejącym `<script>` stopki)**

W `<script>` stopki (linie 360–371), po linii `document.addEventListener('astro:page-load', syncFooterAccordion);`, dodaj:

```ts
  // „Ustawienia cookies" – delegacja na document (przeżywa swapy ClientRouter).
  document.addEventListener('click', (e) => {
    if ((e.target as HTMLElement)?.closest('[data-open-cookie-settings]')) {
      window.dispatchEvent(new Event('open-cookie-settings'));
    }
  });
```

- [ ] **Step 3: Dodaj styl przycisku**

W `<style>` stopki, przed regułą `.footer-socials {` (linia 318), dodaj:

```css
  .footer-cookie-btn {
    font-family: var(--font-sans);
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--ink-faint);
    background: none;
    border: 0;
    padding: 0;
    cursor: pointer;
    transition: color 0.15s ease;
  }

  .footer-cookie-btn:hover {
    color: var(--ink);
  }
```

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: build OK.

- [ ] **Step 5: Commit**

```bash
git add portals/widocznosc.ai/src/components/Footer.astro
git commit -m "feat(widocznosc): link 'Ustawienia cookies' w stopce (re-open banera)" \
           -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: `generate_lead` dla formularza raportu (`ReportLeadForm.astro`)

**Files:**
- Modify: `portals/widocznosc.ai/src/components/tools/ReportLeadForm.astro:154-155`

- [ ] **Step 1: Dodaj push eventu po sukcesie**

Aktualny fragment (linie 154–155):

```ts
        if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
        if (status) status.textContent = `Raport wysłany na ${email}. Sprawdź skrzynkę (i spam).`;
```

Zmień na (push między sukcesem a komunikatem; wzorzec identyczny jak w `kontakt.astro`):

```ts
        if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
        const w = window as any;
        w.dataLayer = w.dataLayer || [];
        w.dataLayer.push({
          event: 'generate_lead',
          form_id: 'narzedzia',
          lead_type: 'raport',
        });
        if (status) status.textContent = `Raport wysłany na ${email}. Sprawdź skrzynkę (i spam).`;
```

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: build OK.

- [ ] **Step 3: Commit**

```bash
git add portals/widocznosc.ai/src/components/tools/ReportLeadForm.astro
git commit -m "feat(widocznosc): generate_lead po wysyłce raportu (drugi formularz lead-gen)" \
           -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Instrukcja dla analityka

**Files:**
- Create: `docs/widocznosc-ai/analityka-handoff-2026-06-08.md` (ścieżka z roota repo)

- [ ] **Step 1: Utwórz dokument**

Plik `docs/widocznosc-ai/analityka-handoff-2026-06-08.md`:

```markdown
# widocznosc.ai – handoff dla analityka (2026-06-08)

## 1. Formularze (konwersje) – użyj `generate_lead`, nie natywnego Form Submission

Oba formularze lead-gen wysyłają dane AJAX-em (`fetch` + `preventDefault`), więc
natywny trigger GTM „Form Submission" albo ich nie łapie, albo łapie też nieudane
wysyłki (walidacja, 429, 500). Dlatego w kodzie strony jest dedykowany event
`dataLayer`, który leci **tylko po realnym sukcesie** (`res.ok`):

- Formularz `/kontakt/`: `{ event: 'generate_lead', form_id: 'kontakt', lead_type: <typ> }`
- Formularz „wyślij raport" (narzędzia): `{ event: 'generate_lead', form_id: 'narzedzia', lead_type: 'raport' }`

**Do zrobienia w GTM:**
1. Trigger: **Custom Event**, Event name = `generate_lead`.
2. Pod ten trigger podepnij tag konwersji (GA4 event `generate_lead` i/lub Google Ads
   Conversion). Rozróżnienie źródeł po zmiennej `form_id`.

To jest dokładniejsze niż natywny Form Submission – z definicji liczy tylko poprawne wysyłki.

## 2. Consent Mode v2 – wdrożone po stronie strony

Strona ustawia teraz `gtag('consent','default', …)` z wszystkimi sygnałami `denied`
JESZCZE PRZED załadowaniem GTM, a baner zgody robi `consent update` po wyborze
użytkownika. Sygnały: `analytics_storage` (kategoria Analityka) oraz `ad_storage` +
`ad_user_data` + `ad_personalization` (kategoria Marketing). Ustawione jest też
`ads_data_redaction: true`.

**Do zrobienia w GTM:**
- Włącz w kontenerze obsługę zgód (Admin → Container Settings → Enable consent overview).
- Tag GA4 Configuration domyślnie respektuje `analytics_storage`. Dla tagów
  marketingowych/Ads ustaw „Additional consent checks" na `ad_storage` itd.
- GTM ładuje się zawsze (Consent Mode robi gating + cookieless pings) – nie blokujemy kontenera.

## 3. Decyzja o `page_view` (do potwierdzenia przez Ciebie)

Strona to SPA (Astro ClientRouter / View Transitions). W `Layout.astro` jest ręczny
push `page_view` przy `astro:after-swap` (nawigacje wewnątrz SPA; pierwsze wejście
liczy `gtm.js`).

- Jeśli w GA4 **Enhanced Measurement → „Page changes based on browser history events"
  jest WŁĄCZONE** → GA4 sam łapie te nawigacje (History API/pushState) i nasz ręczny
  push **dubluje** → możemy go usunąć.
- Jeśli **WYŁĄCZONE** → nasz push jest jedynym źródłem pageview dla nawigacji SPA →
  zostawiamy i zmieniamy pola na `page_location`/`page_referrer` (zamiast `page_path`).

Daj znać, które ustawienie masz w GA4 – dostosujemy kod w 2 minuty.
```

- [ ] **Step 2: Commit**

```bash
git add docs/widocznosc-ai/analityka-handoff-2026-06-08.md
git commit -m "docs(widocznosc): handoff dla analityka (generate_lead, consent v2, page_view)" \
           -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Final: Pełna weryfikacja + manualny smoke test

- [ ] **Step 1: Cały zestaw testów + build**

Run: `npm test && npm run build`
Expected: testy zielone, build OK.

- [ ] **Step 2: Manualny smoke test** (`npm run dev`, w przeglądarce, DevTools → Application → Cookies + podgląd `window.dataLayer`)

1. Pierwsze wejście (usuń cookie `wai_consent`): pasek widoczny; `dataLayer` ma `consent default` z `denied`.
2. „Zaakceptuj wszystko": cookie `wai_consent` zapisane (`analytics:true, marketing:true`), `consent update` granted, pasek znika.
3. Reload: pasek się NIE pokazuje; `consent update` z cookie leci przed `gtm.js`.
4. „Odrzuć wszystko" (po wyczyszczeniu cookie): cookie `analytics:false, marketing:false`, sygnały denied.
5. „Ustawienia" → zaznacz tylko Analityka → „Zapisz wybór": `analytics_storage=granted`, `ad_*=denied`.
6. Stopka „Ustawienia cookies": panel otwiera się ponownie z checkboxami wg cookie.
7. Dark/light (przełącznik motywu): baner czytelny w obu.
8. Mobile (375px): pasek i przyciski układają się sensownie, nic nie wychodzi poza ekran.
9. Klawiatura: Tab po przyciskach (focus ring), ESC zamyka panel.
10. Nawigacja SPA (klik w menu, gdy brak cookie): pasek nadal widoczny po przejściu.

> Manualne kroki nie są blokujące dla commitów (kod już zacommitowany task-by-task), ale wykonaj je przed uznaniem pracy za skończoną i przed deployem.

---

## Self-Review (wypełnione przy pisaniu planu)

1. **Spec coverage:** §2 architektura → Task 1–4; §3 sygnały → Task 1 (`toConsentSignals`) + Task 3 (default); §4 UX → Task 2; §5 cookie → Task 1 + Task 2 (`writeCookie`); §6 a11y → Task 2 (role/aria/ESC/focus-visible); §8 testy → Task 1 (jednostkowe) + Final (manualne); §9 drobiazgi → Task 5 + Task 6. Brak luk.
2. **Placeholder scan:** brak TBD/TODO; każdy krok z kodem ma kod; komendy z oczekiwanym wynikiem.
3. **Type/identifier consistency:** `CONSENT_VERSION`, `CONSENT_COOKIE`, `ConsentState`, `parseConsentCookie`, `serializeConsent`, `toConsentSignals` użyte identycznie w Task 1, 2; nazwa cookie `wai_consent` i `s.v === 1` w head-skrypcie spójne z `CONSENT_VERSION=1`; atrybuty `data-consent-action`/`data-consent-cat`/`data-cc`/`data-cc-panel`/`data-open-cookie-settings` i event `open-cookie-settings` spójne między Task 2 i Task 4.
```
