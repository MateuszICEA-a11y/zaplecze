# Łapanie leadów w narzędziach – Plan B2 (frontend) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pod wynikiem każdego z 4 narzędzi pokazać kartę „Wyślij raport na e-mail" (z opcjonalnym checkboxem zgody) + kontekstowe CTA, spinając ją z endpointem `/api/tools/send-report` z Planu B1.

**Architecture:** Jeden współdzielony komponent `ReportLeadForm.astro` (markup + scoped style + self-contained script z delegacją zdarzeń, odporny na ClientRouter). Każda strona narzędzia: import + umieszczenie komponentu pod kontenerem wyniku + 1 linia `dispatchEvent('tool:result', { query, result })` na ścieżce sukcesu. Komponent ujawnia się dopiero po evencie i POST-uje już policzony wynik (zero podwójnego kosztu LLM).

**Tech Stack:** Astro (komponent + inline script), Cloudflare Pages. Zależy od Planu B1 (endpoint send-report musi istnieć).

**Wymaga:** Plan B1 wdrożony (endpoint `/api/tools/send-report`).

---

## File Structure

- Create: `src/components/tools/ReportLeadForm.astro` – komponent (markup, style, script).
- Modify: `src/pages/narzedzia/brand-check.astro` – import + komponent po `#results` + dispatch po `renderResults(body)`.
- Modify: `src/pages/narzedzia/fanout.astro` – j.w. (`#fanout-results`).
- Modify: `src/pages/narzedzia/url-check.astro` – j.w. (`#results`).
- Modify: `src/pages/narzedzia/ai-bots-check.astro` – j.w. (`#results`).
- Modify: `src/pages/polityka-prywatnosci.astro` – sekcja o danych z narzędzi (jeśli brak).

Kontrakt eventu: `document.dispatchEvent(new CustomEvent('tool:result', { detail: { query: string, result: object } }))`. Komponent zna swoje `tool` z atrybutu `data-tool`.

---

### Task 1: Komponent ReportLeadForm.astro

**Files:**
- Create: `src/components/tools/ReportLeadForm.astro`

- [ ] **Step 1: Utwórz komponent**

```astro
---
// Karta lead-gen pod wynikiem narzędzia: „wyślij raport na e-mail" + opcjonalna
// zgoda na kontakt + kontekstowe CTA. Ukryta do czasu eventu `tool:result`.
// POST-uje już policzony wynik do /api/tools/send-report (Plan B1).
interface Props {
  tool: 'brand-check' | 'fanout' | 'url-check' | 'ai-bots-check';
  ctaLead: string; // zdanie kontekstowe nad przyciskiem CTA
  ctaButton: string; // etykieta przycisku CTA
  ctaHref?: string;
}
const { tool, ctaLead, ctaButton, ctaHref = '/kontakt/' } = Astro.props;
---

<section class="report-lead" data-report-lead data-tool={tool} hidden aria-live="polite">
  <div class="report-lead__card">
    <h3 class="report-lead__title">Wyślij sobie ten raport na e-mail</h3>
    <p class="report-lead__sub">Dostaniesz pełny wynik w czytelnej formie. Bez zobowiązań.</p>

    <form data-report-lead-form class="report-lead__form" novalidate>
      <div class="report-lead__row">
        <input
          type="email"
          name="email"
          required
          autocomplete="email"
          placeholder="twoj@email.pl"
          class="report-lead__input"
          aria-label="Adres e-mail"
        />
        <button type="submit" class="report-lead__btn">Wyślij raport</button>
      </div>

      <!-- honeypot: prawdziwy użytkownik zostawia puste -->
      <input type="text" name="website" tabindex="-1" autocomplete="off" class="report-lead__hp" aria-hidden="true" />

      <label class="report-lead__consent">
        <input type="checkbox" name="consent" />
        <span>Chcę porozmawiać z ekspertem ICEA o widoczności mojej marki w AI – zgadzam się na kontakt e-mailem lub telefonicznie. Zgodę mogę wycofać w każdej chwili.</span>
      </label>
      <p class="report-lead__note">Administratorem danych jest ICEA S.A. Szczegóły w <a href="/polityka-prywatnosci/">polityce prywatności</a>.</p>

      <p class="report-lead__status" data-status role="status"></p>
    </form>

    <div class="report-lead__cta">
      <p class="report-lead__cta-lead">{ctaLead}</p>
      <a class="report-lead__cta-btn" href={ctaHref}>{ctaButton}</a>
    </div>
  </div>
</section>

<style>
  .report-lead { margin-top: 1.5rem; }
  .report-lead__card {
    background: var(--surface, #fff);
    border: 1px solid var(--line, #e2e8f0);
    border-radius: 14px;
    padding: 1.5rem;
  }
  .report-lead__title { margin: 0; font-size: 1.15rem; color: var(--ink, #0f172a); }
  .report-lead__sub { margin: 0.25rem 0 1rem; font-size: 0.95rem; color: var(--ink-muted, #64748b); }
  .report-lead__row { display: flex; gap: 0.5rem; flex-wrap: wrap; }
  .report-lead__input {
    flex: 1 1 220px; min-width: 0; padding: 0.7rem 0.9rem;
    border: 1px solid var(--line, #e2e8f0); border-radius: 8px;
    font-size: 1rem; background: var(--bg, #fff); color: var(--ink, #0f172a);
  }
  .report-lead__btn {
    padding: 0.7rem 1.4rem; border: 0; border-radius: 8px; cursor: pointer;
    background: var(--accent, #0a9cff); color: #fff; font-weight: 600; font-size: 1rem;
  }
  .report-lead__btn[disabled] { opacity: 0.6; cursor: progress; }
  .report-lead__hp { position: absolute; left: -9999px; width: 1px; height: 1px; opacity: 0; }
  .report-lead__consent {
    display: flex; gap: 0.5rem; align-items: flex-start; margin-top: 0.9rem;
    font-size: 0.85rem; line-height: 1.5; color: var(--ink-muted, #64748b);
  }
  .report-lead__consent input { margin-top: 0.2rem; flex: 0 0 auto; }
  .report-lead__note { margin: 0.5rem 0 0; font-size: 0.75rem; color: var(--ink-muted, #64748b); }
  .report-lead__note a { color: var(--accent-dark, #0068cc); }
  .report-lead__status:empty { display: none; }
  .report-lead__status { margin: 0.75rem 0 0; font-size: 0.9rem; color: var(--ink, #0f172a); }
  .report-lead__cta {
    margin-top: 1.25rem; padding-top: 1.25rem; border-top: 1px solid var(--line, #e2e8f0);
  }
  .report-lead__cta-lead { margin: 0 0 0.75rem; font-size: 0.95rem; color: var(--ink, #0f172a); }
  .report-lead__cta-btn {
    display: inline-block; padding: 0.65rem 1.3rem; border-radius: 8px;
    background: var(--ink, #0f172a); color: #fff; text-decoration: none; font-weight: 600; font-size: 0.95rem;
  }
</style>

<script>
  // Delegacja na document → odporne na wymianę DOM przez ClientRouter; bindowane raz.
  (() => {
    const w = window as unknown as { __reportLeadInit?: boolean };
    if (w.__reportLeadInit) return;
    w.__reportLeadInit = true;

    let latest: { query: string; result: unknown } = { query: '', result: null };

    document.addEventListener('tool:result', (e) => {
      const detail = (e as CustomEvent).detail || {};
      latest = { query: String(detail.query || ''), result: detail.result ?? null };
      const section = document.querySelector<HTMLElement>('[data-report-lead]');
      if (section) section.hidden = false;
    });

    document.addEventListener('submit', async (e) => {
      const form = e.target as HTMLElement;
      if (!(form instanceof HTMLFormElement) || !('reportLeadForm' in form.dataset)) return;
      e.preventDefault();

      const section = form.closest<HTMLElement>('[data-report-lead]');
      const status = section?.querySelector<HTMLElement>('[data-status]');
      const btn = form.querySelector<HTMLButtonElement>('button[type="submit"]');
      const fd = new FormData(form);
      const email = String(fd.get('email') || '').trim();
      if (!email) { if (status) status.textContent = 'Podaj adres e-mail.'; return; }

      if (btn) btn.disabled = true;
      if (status) status.textContent = 'Wysyłam raport…';
      try {
        const res = await fetch('/api/tools/send-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tool: section?.getAttribute('data-tool') || '',
            email,
            consent: fd.get('consent') === 'on',
            query: latest.query,
            result: latest.result,
            website: String(fd.get('website') || ''),
          }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
        if (status) status.textContent = `Raport wysłany na ${email}. Sprawdź skrzynkę (i spam).`;
        form.reset();
      } catch (err) {
        if (status) status.textContent = err instanceof Error ? err.message : 'Nie udało się wysłać raportu.';
      } finally {
        if (btn) btn.disabled = false;
      }
    });
  })();
</script>
```

- [ ] **Step 2: Build sprawdza, że komponent się kompiluje**

Run: `cd portals/widocznosc.ai && npm run build`
Expected: build OK (komponent nieużywany jeszcze, ale musi się parsować).

- [ ] **Step 3: Commit**

```bash
git add src/components/tools/ReportLeadForm.astro
git commit -m "feat(widocznosc): komponent ReportLeadForm (raport na e-mail + zgoda + CTA)"
```

---

### Task 2: Wpięcie w brand-check.astro

**Files:**
- Modify: `src/pages/narzedzia/brand-check.astro`

- [ ] **Step 1: Dodaj import (po linii 5)**

Zamień:

```astro
import ScrollUpButton from '../../components/ScrollUpButton.astro';
```

na:

```astro
import ScrollUpButton from '../../components/ScrollUpButton.astro';
import ReportLeadForm from '../../components/tools/ReportLeadForm.astro';
```

- [ ] **Step 2: Umieść komponent po kontenerze wyniku (linia 110)**

Zamień:

```astro
        <section id="results" class="results-wrap hidden" aria-live="polite"></section>
```

na:

```astro
        <section id="results" class="results-wrap hidden" aria-live="polite"></section>
        <ReportLeadForm
          tool="brand-check"
          ctaLead="Twoja marka zasługuje na lepszą widoczność w AI. Umów bezpłatną konsultację z ekspertem ICEA."
          ctaButton="Umów konsultację"
        />
```

- [ ] **Step 3: Dodaj dispatch eventu po sukcesie (linia 1044)**

Zamień:

```javascript
        renderResults(body);
```

na:

```javascript
        renderResults(body);
        document.dispatchEvent(new CustomEvent('tool:result', { detail: { query: payload.brand, result: body } }));
```

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: OK.

- [ ] **Step 5: Commit**

```bash
git add src/pages/narzedzia/brand-check.astro
git commit -m "feat(widocznosc): brand-check – karta raport/lead pod wynikiem"
```

---

### Task 3: Wpięcie w fanout.astro

**Files:**
- Modify: `src/pages/narzedzia/fanout.astro`

- [ ] **Step 1: Dodaj import (po linii 5)**

Zamień:

```astro
import ScrollUpButton from '../../components/ScrollUpButton.astro';
```

na:

```astro
import ScrollUpButton from '../../components/ScrollUpButton.astro';
import ReportLeadForm from '../../components/tools/ReportLeadForm.astro';
```

- [ ] **Step 2: Umieść komponent po kontenerze wyniku (linia 93)**

Zamień:

```astro
        <div id="fanout-results" class="fanout-results hidden" aria-live="polite"></div>
```

na:

```astro
        <div id="fanout-results" class="fanout-results hidden" aria-live="polite"></div>
        <ReportLeadForm
          tool="fanout"
          ctaLead="Chcesz, żeby AI cytowało Twoje treści w odpowiedziach? Porozmawiaj z ekspertem ICEA o strategii GEO."
          ctaButton="Porozmawiaj o GEO"
        />
```

- [ ] **Step 3: Dodaj dispatch eventu po sukcesie (linia 773)**

Zamień:

```javascript
        renderResults(body);
```

na:

```javascript
        renderResults(body);
        document.dispatchEvent(new CustomEvent('tool:result', { detail: { query, result: body } }));
```

- [ ] **Step 4: Build + Commit**

```bash
npm run build
git add src/pages/narzedzia/fanout.astro
git commit -m "feat(widocznosc): fanout – karta raport/lead pod wynikiem"
```

---

### Task 4: Wpięcie w url-check.astro

**Files:**
- Modify: `src/pages/narzedzia/url-check.astro`

- [ ] **Step 1: Dodaj import (po linii 5)**

Zamień:

```astro
import ScrollUpButton from '../../components/ScrollUpButton.astro';
```

na:

```astro
import ScrollUpButton from '../../components/ScrollUpButton.astro';
import ReportLeadForm from '../../components/tools/ReportLeadForm.astro';
```

- [ ] **Step 2: Umieść komponent po kontenerze wyniku (linia 82)**

Zamień:

```astro
        <section id="results" class="mt-14 hidden" aria-live="polite"></section>
```

na:

```astro
        <section id="results" class="mt-14 hidden" aria-live="polite"></section>
        <ReportLeadForm
          tool="url-check"
          ctaLead="Chcesz podnieść ocenę AI-readiness swojej strony? Umów audyt z ekspertem ICEA."
          ctaButton="Umów audyt"
        />
```

- [ ] **Step 3: Dodaj dispatch eventu po sukcesie (linia 1069)**

Zamień:

```javascript
      const data = (await res.json()) as CheckResponse;
      resultsEl.innerHTML = renderResults(data);
```

na:

```javascript
      const data = (await res.json()) as CheckResponse;
      resultsEl.innerHTML = renderResults(data);
      document.dispatchEvent(new CustomEvent('tool:result', { detail: { query: url, result: data } }));
```

- [ ] **Step 4: Build + Commit**

```bash
npm run build
git add src/pages/narzedzia/url-check.astro
git commit -m "feat(widocznosc): url-check – karta raport/lead pod wynikiem"
```

---

### Task 5: Wpięcie w ai-bots-check.astro

**Files:**
- Modify: `src/pages/narzedzia/ai-bots-check.astro`

- [ ] **Step 1: Dodaj import (po linii 5)**

Zamień:

```astro
import ScrollUpButton from '../../components/ScrollUpButton.astro';
```

na:

```astro
import ScrollUpButton from '../../components/ScrollUpButton.astro';
import ReportLeadForm from '../../components/tools/ReportLeadForm.astro';
```

- [ ] **Step 2: Umieść komponent po kontenerze wyniku (linia 92)**

Zamień:

```astro
        <section id="results" class="mt-14 hidden" aria-live="polite"></section>
```

na:

```astro
        <section id="results" class="mt-14 hidden" aria-live="polite"></section>
        <ReportLeadForm
          tool="ai-bots-check"
          ctaLead="Boty AI nie widzą Twojej strony? Pomożemy to naprawić – umów konsultację z ICEA."
          ctaButton="Umów konsultację"
        />
```

- [ ] **Step 3: Dodaj dispatch eventu po sukcesie (linia 843)**

Zamień:

```javascript
        const data = (await response.json()) as CheckResponse;
        resultsEl.innerHTML = renderResults(data);
```

na:

```javascript
        const data = (await response.json()) as CheckResponse;
        resultsEl.innerHTML = renderResults(data);
        document.dispatchEvent(new CustomEvent('tool:result', { detail: { query: value, result: data } }));
```

- [ ] **Step 4: Build + Commit**

```bash
npm run build
git add src/pages/narzedzia/ai-bots-check.astro
git commit -m "feat(widocznosc): ai-bots-check – karta raport/lead pod wynikiem"
```

---

### Task 6: Polityka prywatności

**Files:**
- Modify: `src/pages/polityka-prywatnosci.astro`

- [ ] **Step 1: Sprawdź pokrycie**

Run: `grep -niE "narzędzi|e-mail|zgod|raport" src/pages/polityka-prywatnosci.astro`
Cel: ustalić, czy polityka już opisuje zbieranie e-maila w narzędziach + cel kontaktu handlowego + administratora ICEA S.A. + prawo wycofania zgody.

- [ ] **Step 2: Dodaj sekcję, jeśli brakuje**

Jeśli powyższe nie jest pokryte, dodaj akapit w odpowiednim miejscu treści (po sekcji o formularzu kontaktowym; dopasuj znaczniki do istniejącego wzorca strony – np. `<h2>` + `<p>`):

```html
<h2>Dane zbierane w narzędziach (Brand Check, Fan-out, URL Check, AI Bots Check)</h2>
<p>
  Jeśli poprosisz o wysłanie raportu z narzędzia na e-mail, przetwarzamy Twój adres
  e-mail wyłącznie w celu dostarczenia tego raportu (realizacja zamówionej usługi).
  Jeśli dodatkowo zaznaczysz zgodę na kontakt, użyjemy Twoich danych również, aby
  skontaktować się z Tobą w sprawie widoczności Twojej marki w AI (e-mailem lub
  telefonicznie). Zgodę możesz wycofać w każdej chwili, pisząc na
  <a href="mailto:biuro@grupa-icea.pl">biuro@grupa-icea.pl</a>. Administratorem danych
  jest ICEA S.A., ul. Szyperska 14, 61-754 Poznań.
</p>
```

Jeśli pokrycie już jest – pomiń krok, odnotuj w commicie „bez zmian (pokryte)".

- [ ] **Step 3: Build + Commit**

```bash
npm run build
git add src/pages/polityka-prywatnosci.astro
git commit -m "docs(widocznosc): polityka prywatności – dane z narzędzi + zgoda na kontakt"
```

---

### Task 7: Weryfikacja end-to-end

**Files:** brak zmian (weryfikacja).

- [ ] **Step 1: Build + testy**

Run: `npm test && npm run build`
Expected: testy PASS (bez regresji), build OK.

- [ ] **Step 2: E2E przez wrangler – karta ujawnia się i POST-uje**

```bash
printf 'RESEND_API_KEY=dummy\nOPENROUTER_API_KEY=dummy\n' > .dev.vars
npx wrangler pages dev dist --port 8792 --kv FANOUT_RL > /tmp/wr-b2.log 2>&1 &
for i in $(seq 1 25); do curl -s -o /dev/null http://localhost:8792/ && break; sleep 2; done
# Czy komponent jest w wyrenderowanej stronie (ukryty) + endpoint odpowiada:
echo "--- komponent obecny w HTML strony ---"
curl -s http://localhost:8792/narzedzia/brand-check/ | grep -c "data-report-lead"
echo "--- send-report walidacja (zły tool) → 400 ---"
curl -s -o /dev/null -w "%{http_code}\n" -X POST -H "Content-Type: application/json" \
  --data '{"tool":"x","email":"a@b.pl","result":{}}' http://localhost:8792/api/tools/send-report
pkill -f "wrangler pages dev"; rm -f .dev.vars
```

Expected: `data-report-lead` policzony ≥ 1 (komponent w HTML), send-report zły tool → 400.

- [ ] **Step 3: Weryfikacja wizualna (opcjonalna, jeśli dostępne Playwright/przeglądarka)**

Otwórz `/narzedzia/ai-bots-check/`, uruchom sprawdzenie realnej domeny, potwierdź że pod wynikiem pojawia się karta „Wyślij sobie ten raport na e-mail" z checkboxem zgody i przyciskiem CTA. (ai-bots-check jest darmowe → nie wymaga kluczy LLM, najłatwiejsze do wizualnej weryfikacji.)

---

## Self-Review

**Spec coverage:** Pokrywa frontendową część specu: pole „wyślij raport na e-mail" pod wynikiem (każde z 4 narzędzi), opcjonalny niezaznaczony checkbox zgody z finalną treścią + mikro-nota z linkiem do polityki, kontekstowe CTA per narzędzie, honeypot, brak gatingu wyniku (karta pod wynikiem, nie zamiast). Weryfikacja/uzupełnienie polityki prywatności (zadanie towarzyszące ze specu).

**Placeholder scan:** Brak TBD. Task 6 Step 2 jest warunkowy (zależny od istniejącej treści polityki), ale dostarcza dokładny tekst do wstawienia – nie placeholder.

**Type consistency:** Kontrakt eventu `tool:result` detail `{ query, result }` – spójny w 4 stronach i w komponencie. Komponent czyta `tool` z `data-tool`, POST do `/api/tools/send-report` z polami `{ tool, email, consent, query, result, website }` – zgodnymi z `ReportPayload` z Planu B1. `tool` w propsie ograniczony do 4 wartości zgodnych z `TOOLS` (B1). Honeypot pole `website` – jak w `/kontakt`.

## Uwagi do egzekucji

- Numery linii to stan na 2026-06-01; kotwicz po pokazanych fragmentach.
- Komponent działa tylko gdy endpoint `/api/tools/send-report` istnieje (Plan B1). Wykonuj B2 PO B1.
- `renderResults(body);` w brand-check i fanout to ten sam string, ale w różnych plikach – edytuj per plik.
- Karta pojawia się dopiero po `tool:result`; przy nieudanym sprawdzeniu (error) event nie leci, więc karta nie wyskakuje pod komunikatem błędu – zgodnie z intencją.
