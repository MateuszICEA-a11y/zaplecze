// @ts-nocheck – kod przeniesiony bez zmian; typy sprawdzał kompilator Astro.
/* Edytor wpisu Content Watchera – część jeszcze nieprzepisana na React:
   belka pipeline'u, wytyczne, dokument (edycja, diff, decyzje), ekspert, styl,
   infografiki, CTA i zapis do WordPressa. Logika 1:1 ze <script> w
   dashboard/app/src/pages/[domain]/content-watcher/edytor.astro, opakowana
   w mount(). Uruchamia ją PostEditor.tsx po wstawieniu znaczników
   (edytor-*.html); stan dzielony z panelami React – lib/cw-editor/store.ts. */
import { isSourcesTitle } from '@/lib/cw-editor/doc';
import { activeExpert, expertBlockquote, expertShortcode } from '@/lib/cw-editor/expert';
import { sanitizeInto } from '@/lib/cw-editor/sanitize';
import { editorStore } from '@/lib/cw-editor/store';
import type { Entry } from '@/lib/cw-editor/types';

export async function mount(initialEntry: Entry): Promise<void> {
  type Section = {
    slot: number;
    title_field: string;
    text_field: string;
    operation: string;
    moved_from?: number | null;
    title_before: string | null;
    title_after: string | null;
    text_before: string | null;
    text_after: string | null;
    diff: {
      opcodes: { op: string; before: string; after: string }[];
      stats: { added: number; removed: number; shrunk?: boolean };
    } | null;
    accepted: boolean;
    decision: 'accepted' | 'rejected' | null;
    edited?: boolean;
  };
  type Step = { step: string; status: string; payload: any; cost: any; model: string | null;
    error: string | null; started_at?: string | null; finished_at?: string | null };
  /** Propozycja przejazdu redaktorskiego dla jednej sekcji (tabela job_style).
      Diff liczymy tutaj – Worker oddaje oba brzmienia, nie opcode'y. */
  type StyleRow = {
    slot: number;
    title_before: string | null;
    title_after: string | null;
    text_before: string | null;
    text_after: string | null;
    issues: string[];
    warnings: { kind: string; label: string }[];
    decision: 'accepted' | 'rejected' | null;
    applied_at?: string | null;
  };
  type Job = {
    id: string; status: string; error: string | null; cost: any; created_at: string;
    improvements: string[]; models: { research: string; writer: string } | null;
    expert: any; steps: Step[]; sections: Section[]; run_url?: string | null;
    style?: any; style_sections?: StyleRow[]; images?: any[];
    wp_draft_id?: number | null; wp_draft_url?: string | null; applied_at?: string | null;
  };

  // Lustro config.py (STEPS + OPTIONAL_STEPS) – przy zmianie kolejności kroków
  // pipeline'u zaktualizuj oba miejsca.
  const STEP_ORDER = ['fetch', 'keywords_own', 'serp', 'competitors', 'keywords_competitors',
    'brief', 'rewrite', 'coverage', 'expert', 'sources', 'internal_links', 'diff'];
  const OPTIONAL_STEP: Record<string, string> = {
    rewrite: 'gaps', coverage: 'gaps', expert: 'expert', sources: 'sources',
    internal_links: 'internal_links',
  };
  const STEP_LABELS: Record<string, string> = {
    fetch: 'Pobranie treści',
    keywords_own: 'Frazy własne',
    serp: 'Wyniki wyszukiwania',
    competitors: 'Treść konkurencji',
    keywords_competitors: 'Frazy konkurencji',
    brief: 'Wytyczne',
    rewrite: 'Redagowanie sekcji',
    coverage: 'Domknięcie fraz',
    expert: 'Porada eksperta',
    sources: 'Źródła',
    internal_links: 'Linki wewnętrzne',
    diff: 'Porównanie zmian',
  };
  const STATUS_LABEL: Record<string, string> = {
    queued: 'w kolejce', dispatching: 'uruchamianie', running: 'w toku', done: 'zakończone',
    failed: 'błąd', cancelled: 'anulowane', stale: 'utracono połączenie z procesem',
    budget_exceeded: 'przerwane – brak środków',
  };
  // Lustro DEFAULT_MODELS z cw-api.js / config.py.
  const DEFAULT_MODELS = { research: 'perplexity/sonar-pro', writer: 'anthropic/claude-sonnet-5' };
  const MODEL_ID = /^[a-z0-9-]+\/[a-z0-9.:_-]{1,60}$/i;

  const domain = location.pathname.split('/').filter(Boolean)[0] ?? '';
  const $ = <T extends HTMLElement>(selector: string) => document.querySelector<T>(selector);
  const pl = new Intl.NumberFormat('pl-PL');
  const fmtDate = (value: string | null) =>
    value ? new Date(`${value}T00:00:00Z`).toLocaleDateString('pl-PL', { timeZone: 'UTC' }) : '—';

  const api = async (path: string, options: RequestInit = {}) => {
    const response = await fetch(path, {
      ...options,
      headers: { 'X-CW-Request': '1', 'Content-Type': 'application/json', ...(options.headers ?? {}) },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      // Kod odmowy z Workera (np. 'cooldown') jedzie na błędzie – obsługa
      // może zareagować konkretnie, nie zgadywać z treści komunikatu.
      const error = new Error(data?.error ?? `Błąd ${response.status}`) as Error & { code?: string };
      error.code = typeof data?.code === 'string' ? data.code : undefined;
      throw error;
    }
    return data;
  };

  const showError = (message: string) => {
    const node = $('[data-ed-error]');
    if (!node) return;
    node.textContent = message;
    node.hidden = false;
  };

  /* ---------- stan strony ---------- */

  let entry: any = initialEntry;
  // Treść wpisu wczytuje DocPanel (React) – tu tylko autor do karty WP.
  const content = () => editorStore.get().content;
  // Blok „Źródła” (osobne pola ACF albo – w starych wpisach – slot treści
  // z takim tytułem): cytat eksperta ma się trzymać od niego z daleka.
  const isSourcesNode = (node: Element) =>
    node.classList.contains('ed-doc-sources')
    || isSourcesTitle(node.querySelector('.ed-sec-head h2, .ed-sec-head h3')?.textContent);
  let job: Job | null = null;
  let pollDelay = 3000;
  let pollTimer: number | undefined;
  let clockTimer: number | undefined;

  /* ---------- modele (OpenRouter) ---------- */

  let modelIds: string[] = [];

  /** Combobox nad polem tekstowym: lista filtruje się w trakcie pisania,
      strzałki i Enter wybierają, Esc zamyka. Wpisanie własnego ID dalej
      działa – lista tylko podpowiada. */
  function setupCombo(input: HTMLInputElement) {
    const box = input.closest('.ed-combo-box')!;
    const list = box.querySelector<HTMLUListElement>('.ed-combo-list')!;
    const toggle = box.querySelector<HTMLButtonElement>('.ed-combo-toggle')!;
    let active = -1;

    const items = () => [...list.querySelectorAll<HTMLLIElement>('li[data-id]')];
    const close = () => {
      list.hidden = true;
      input.setAttribute('aria-expanded', 'false');
      active = -1;
    };
    const highlight = (index: number) => {
      const rows = items();
      if (!rows.length) return;
      active = (index + rows.length) % rows.length;
      rows.forEach((row, i) => row.classList.toggle('active', i === active));
      rows[active].scrollIntoView({ block: 'nearest' });
    };
    const choose = (value: string) => {
      input.value = value;
      close();
      input.dispatchEvent(new Event('change', { bubbles: true }));
    };

    const paint = (filter = '') => {
      const needle = filter.trim().toLowerCase();
      const matches = (needle ? modelIds.filter((id) => id.toLowerCase().includes(needle)) : modelIds).slice(0, 200);
      list.replaceChildren(...matches.map((id) => {
        const item = document.createElement('li');
        item.dataset.id = id;
        item.textContent = id;
        if (id === input.value) item.classList.add('current');
        // mousedown, bo click po blurze inputa nie zdąży się wykonać.
        item.addEventListener('mousedown', (event) => {
          event.preventDefault();
          choose(id);
        });
        return item;
      }));
      if (!matches.length) {
        const empty = document.createElement('li');
        empty.className = 'empty';
        empty.textContent = modelIds.length ? 'brak modelu o takiej nazwie' : 'lista modeli niedostępna';
        list.append(empty);
      }
      list.hidden = false;
      input.setAttribute('aria-expanded', 'true');
      active = -1;
    };

    input.addEventListener('focus', () => paint(''));
    input.addEventListener('input', () => paint(input.value));
    toggle.addEventListener('mousedown', (event) => {
      event.preventDefault();
      if (list.hidden) { input.focus(); paint(''); } else close();
    });
    input.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        if (list.hidden) paint(input.value);
        highlight(active + (event.key === 'ArrowDown' ? 1 : -1));
        return;
      }
      if (event.key === 'Enter' && !list.hidden && active >= 0) {
        event.preventDefault();
        choose(items()[active].dataset.id!);
        return;
      }
      if (event.key === 'Escape') close();
    });
    input.addEventListener('blur', () => setTimeout(close, 120));
  }

  async function loadModels() {
    const research = $<HTMLInputElement>('[data-ed-model-research]')!;
    const writer = $<HTMLInputElement>('[data-ed-model-writer]')!;
    try {
      const saved = JSON.parse(localStorage.getItem('cw-models') ?? 'null');
      if (saved?.research) research.value = saved.research;
      if (saved?.writer) writer.value = saved.writer;
    } catch { /* zepsuty localStorage nie blokuje strony */ }
    setupCombo(research);
    setupCombo(writer);
    try {
      const response = await fetch('https://openrouter.ai/api/v1/models');
      if (!response.ok) throw new Error(String(response.status));
      const data = await response.json();
      modelIds = (data?.data ?? []).map((model: any) => model?.id).filter(Boolean).sort();
      $('[data-ed-models-note]')!.textContent = `modele z OpenRouter · ${pl.format(modelIds.length)} dostępnych`;
    } catch {
      $('[data-ed-models-note]')!.textContent = 'modele z OpenRouter · lista niedostępna, wpisz ID ręcznie';
    }
  }

  /* ---------- pasek postępu ---------- */

  function plannedSteps(current: Job) {
    return STEP_ORDER.filter((step) => {
      const improvement = OPTIONAL_STEP[step];
      return !improvement || (current.improvements ?? []).includes(improvement);
    });
  }

  function renderProgress(current: Job) {
    const running = ['queued', 'dispatching', 'running'].includes(current.status);
    $('[data-ed-setup]')!.hidden = running || current.status === 'done';
    $('[data-ed-progress]')!.hidden = !running;
    $('[data-ed-summary]')!.hidden = running;
    $('[data-ed-steps-details]')!.hidden = !current.steps?.length;

    const planned = plannedSteps(current);
    const byName = new Map(current.steps.map((step) => [step.step, step]));
    const finished = planned.filter((name) => ['done', 'skipped', 'failed'].includes(byName.get(name)?.status ?? ''));
    const active = planned.find((name) => byName.get(name)?.status === 'running');

    if (running) {
      const percent = Math.round((finished.length / planned.length) * 100);
      $('[data-ed-progress-fill]')!.style.width = `${Math.max(3, percent)}%`;
      $('[data-ed-progress-label]')!.textContent = active
        ? STEP_LABELS[active] ?? active
        : STATUS_LABEL[current.status] ?? current.status;
      $('[data-ed-progress-count]')!.textContent = `krok ${Math.min(finished.length + 1, planned.length)} z ${planned.length}`;
      startClock(current);
    } else {
      stopClock();
      const status = $('[data-ed-summary-status]')!;
      status.textContent = STATUS_LABEL[current.status] ?? current.status;
      status.className = `cw-status ${current.status === 'done' ? 'recent' : ['failed', 'stale', 'budget_exceeded'].includes(current.status) ? 'not-indexed' : ''}`;
      const tokens = (current.cost?.tokens_total ?? 0) || ((current.cost?.tokens_in ?? 0) + (current.cost?.tokens_out ?? 0));
      const parts = [
        current.models ? `analiza: ${current.models.research} · pisanie: ${current.models.writer}` : null,
        tokens ? `${pl.format(tokens)} tokenów` : null,
        current.cost?.serp_requests ? `${current.cost.serp_requests} zapytań do wyszukiwarki` : null,
      ].filter(Boolean);
      $('[data-ed-summary-cost]')!.textContent = parts.join(' · ');
      const failed = ['failed', 'stale', 'budget_exceeded'].includes(current.status);
      // Karta błędu niesie już status, krok i komunikat – pasek podsumowania
      // powtarzałby to samo dwa razy.
      $('[data-ed-summary]')!.hidden = failed;
      // Przy porażce ponowienie stoi w karcie błędu – dwa takie same przyciski
      // obok siebie tylko myliłyby. Po zakończonym przebiegu konfiguracja jest
      // schowana, więc bez tego przycisku nie dałoby się puścić wpisu ponownie.
      const rerun = $<HTMLButtonElement>('[data-ed-rerun]')!;
      rerun.hidden = failed || !['cancelled', 'done'].includes(current.status);
      rerun.textContent = current.status === 'done'
        ? 'uruchom ponownie (zmień modele i zakres)'
        : 'uruchom ponownie';
      renderFailure(current, failed);
    }
    renderSteps(current);
  }

  /** Karta błędu: który krok padł, z jakim komunikatem i gdzie zajrzeć dalej. */
  function renderFailure(current: Job, failed: boolean) {
    const card = $('[data-ed-fail]')!;
    card.hidden = !failed;
    if (!failed) return;
    const broken = current.steps?.find((step) => step.status === 'failed');
    $('[data-ed-fail-step]')!.textContent = broken
      ? `krok: ${STEP_LABELS[broken.step] ?? broken.step}`
      : STATUS_LABEL[current.status] ?? current.status;
    $('[data-ed-fail-msg]')!.textContent = broken?.error || current.error || 'Proces zakończył się bez podania przyczyny.';
    const log = $<HTMLAnchorElement>('[data-ed-fail-log]')!;
    log.hidden = !current.run_url;
    if (current.run_url) log.href = current.run_url;
  }

  function startClock(current: Job) {
    stopClock();
    const started = new Date(current.created_at).getTime();
    const tick = () => {
      const seconds = Math.max(0, Math.floor((Date.now() - started) / 1000));
      $('[data-ed-progress-time]')!.textContent =
        `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
    };
    tick();
    clockTimer = window.setInterval(tick, 1000);
  }
  function stopClock() {
    window.clearInterval(clockTimer);
  }

  /** Czas kroku – dla zakończonych ile trwał, dla trwającego ile już leci. */
  function stepDuration(step: Step | undefined) {
    if (!step?.started_at) return '';
    const start = Date.parse(step.started_at);
    const end = step.finished_at ? Date.parse(step.finished_at) : Date.now();
    if (!Number.isFinite(start) || !Number.isFinite(end)) return '';
    const seconds = Math.max(0, Math.round((end - start) / 1000));
    return seconds < 60 ? `${seconds} s` : `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  }

  /** Koszt kroku w jednej frazie – to, za co realnie zapłaciliśmy. */
  // Krok potrafi zjeść wielokrotność normy, gdy model z wyszukiwaniem w sieci
  // wciąga do kontekstu całe strony (grok-4.5 na „Źródłach": 537 tys. tokenów
  // przy 4 tys. na gemini-3-flash). Taki krok ma się rzucać w oczy na osi.
  const STEP_TOKENS_WARN = 150_000;

  function stepCost(step: Step | undefined) {
    const cost = step?.cost ?? {};
    const tokens = (cost.tokens_in ?? 0) + (cost.tokens_out ?? 0);
    return [
      cost.serp_requests ? `${cost.serp_requests} zapytań do wyszukiwarki` : null,
      cost.senuto_requests ? `${cost.senuto_requests} zap. Senuto` : null,
      tokens ? `${pl.format(tokens)} tokenów${tokens > STEP_TOKENS_WARN ? ' ⚠' : ''}` : null,
    ].filter(Boolean).join(' · ');
  }

  /** Oś przebiegu: znacznik stanu, nazwa kroku, czas i koszt. Krok w toku
      dostaje kręcące się kółko – widać, że coś się dzieje, a nie zawiesiło. */
  function renderSteps(current: Job) {
    const host = $('[data-ed-steps]')!;
    const byName = new Map(current.steps.map((step) => [step.step, step]));
    host.replaceChildren(...plannedSteps(current).map((name) => {
      const step = byName.get(name);
      const status = step?.status ?? 'pending';
      const li = document.createElement('li');
      li.className = `ed-step ${status}`;

      const mark = document.createElement('span');
      mark.className = 'ed-step-mark';
      mark.textContent = status === 'done' ? '✓' : status === 'failed' ? '✕' : status === 'skipped' ? '–' : '';
      li.append(mark);

      const body = document.createElement('div');
      body.className = 'ed-step-body';
      const label = document.createElement('span');
      label.className = 'ed-step-name';
      label.textContent = STEP_LABELS[name] ?? name;
      body.append(label);

      const meta = document.createElement('span');
      meta.className = 'ed-step-info';
      const duration = stepDuration(step);
      const cost = stepCost(step);
      meta.textContent = status === 'skipped'
        ? 'pominięty'
        : [duration, cost, step?.model].filter(Boolean).join(' · ');
      const spent = (step?.cost?.tokens_in ?? 0) + (step?.cost?.tokens_out ?? 0);
      if (spent > STEP_TOKENS_WARN) {
        meta.classList.add('is-costly');
        meta.title = 'Nietypowo drogi krok – zwykle to model, który przy wyszukiwaniu '
          + 'w sieci wciąga do kontekstu całe strony. Warto zmienić model analizy.';
      }
      body.append(meta);

      if (step?.error) {
        const error = document.createElement('span');
        error.className = 'ed-step-error';
        error.textContent = step.error;
        body.append(error);
      }
      li.append(body);
      return li;
    }));
  }

  /* ---------- wytyczne ---------- */

  function renderBrief(current: Job) {
    const brief = current.steps.find((step) => step.step === 'brief')?.payload;
    const details = $<HTMLDetailsElement>('[data-ed-brief-details]');
    const card = $('[data-ed-brief]');
    if (!brief || !details || !card) return;
    details.hidden = false;
    if (['queued', 'dispatching', 'running'].includes(current.status) && !details.dataset.touched) details.open = true;
    card.replaceChildren();

    const add = (title: string, body: Node) => {
      const wrap = document.createElement('div');
      wrap.className = 'ed-brief-block';
      const heading = document.createElement('h3');
      heading.textContent = title;
      wrap.append(heading, body);
      card.append(wrap);
    };
    if (brief.summary) {
      const p = document.createElement('p');
      p.textContent = brief.summary;
      add('Podsumowanie', p);
    }
    if (brief.content_truncated) {
      const p = document.createElement('p');
      p.className = 'ed-brief-warn';
      p.textContent = 'Uwaga: wpis jest bardzo obfity, dlatego analiza objęła tylko jego początek. '
        + 'Końcowe sekcje mogły zostać pominięte w wytycznych.';
      add('Zbyt długi tekst', p);
    }
    const list = (items: string[]) => {
      const ul = document.createElement('ul');
      for (const item of items) {
        const li = document.createElement('li');
        li.textContent = item;
        ul.append(li);
      }
      return ul;
    };
    if (brief.gaps?.length) add('Luki wobec konkurencji', list(brief.gaps.map((gap: any) => `${gap.topic} – ${gap.why}`)));
    if (brief.keywords_to_cover?.length) {
      add('Frazy do pokrycia', list(brief.keywords_to_cover.map((keyword: any) =>
        `${keyword.keyword}` +
        (keyword.volume ? ` · ${pl.format(keyword.volume)}/mies.` : '') +
        (keyword.current_position ? ` · obecnie ${keyword.current_position}` : ''))));
    }
    if (brief.factual_risks?.length) add('Do weryfikacji faktograficznej', list(brief.factual_risks));

    // Zalecenia nagłówków, których rewrite nie wykonał – lepiej pokazać je
    // redaktorowi, niż udawać, że generyczne H2 zostały z rozmysłem.
    const rewrite = current.steps.find((step) => step.step === 'rewrite')?.payload;
    // Gdzie stanęły nowe sekcje – „doklejone na końcu" wychodziło wcześniej
    // dopiero przy czytaniu gotowego wpisu.
    if (rewrite?.anchors && Object.keys(rewrite.anchors).length) {
      const titles = new Map((current.sections ?? []).map((row) =>
        [row.slot, row.title_after || row.title_before || `sekcja ${row.slot}`]));
      add('Miejsce nowych sekcji', list(Object.entries(rewrite.anchors).map(([slot, after]) =>
        `${titles.get(Number(slot)) ?? `sekcja ${slot}`} → po: ${titles.get(Number(after)) ?? `sekcja ${after}`}`)));
    }
    if (rewrite?.headings_missed?.length) {
      add('Pominięte zalecenia nagłówków', list(rewrite.headings_missed.map((row: any) =>
        `sekcja ${row.slot}: ${row.current || '(nowa)'} → ${row.recommended}`)));
    }

    // Ostrzeżenia kroków researchu – przejazd kończy się jako „done" nawet
    // wtedy, gdy warstwa fraz wypadła (SERP oddał same strony główne). Bez tego
    // wpisu wyglądałby na w pełni udany.
    for (const step of current.steps) {
      if (step.payload?.warning) add('Uwaga z przebiegu', list([step.payload.warning]));
    }

    // Bramka pokrycia: co pipeline domknął sam, a czego świadomie nie wplótł.
    // Fraza bez pokrycia i bez powodu to błąd przejazdu, nie decyzja redakcyjna.
    const coverage = current.steps.find((step) => step.step === 'coverage')?.payload;
    if (coverage?.rounds?.length) {
      const gained = coverage.rounds.flatMap((round: any) => round.gained ?? []);
      if (gained.length) add('Frazy domknięte po sprawdzeniu', list(gained));
    }
    // Fraza bez miejsca w akapitach kończy jako pytanie FAQ – to też domknięcie,
    // tyle że w innym bloku strony.
    const askedFaq = (coverage?.rounds ?? []).flatMap((round: any) => round.new_faq ?? []);
    if (askedFaq.length) {
      const titles = new Map((current.sections ?? []).map((row) => [row.slot, row.title_after || '']));
      add('Frazy domknięte pytaniem FAQ', list(askedFaq.map((slot: number) =>
        titles.get(slot) || `nowe pytanie ${slot - 100}`)));
    }
    if (coverage?.skipped?.length) {
      add('Frazy świadomie pominięte', list(coverage.skipped.map((row: any) =>
        `${row.keyword} – ${row.why}`)));
    }
    if (coverage?.missing?.length) {
      add('Frazy, których nie udało się wpleść', list(coverage.missing));
    }
  }

  /* Dokument (sekcje, diff, decyzje, korekta, infografiki, CTA, cytat
     eksperta w treści) – DocPanel.tsx i DocSection.tsx (React). */

  /* ---------- porada eksperta (etap finalny) ---------- */

  let expertBusy = false;
  let authors: Array<{ name: string; role: string }> = [];
  /* Pełna lista z id (także autor wpisu) – do podmiany autora w karcie WP. */
  let wpAuthorList: Array<{ id: number | null; name: string; role: string }> = [];

  /* Stanowiska do wyboru. WordPress ich nie niesie, a wpisywanie z ręki przy
     każdym cytacie kończyło się literówką w podpisie. Formy męskie i żeńskie
     osobno – podpis ma się zgadzać z osobą. Lista jest świadomie krótka;
     czego brakuje, redaktor doda przez „inne”. */
  const ROLE_OPTIONS = [
    'specjalista SEO',
    'specjalistka SEO',
    'ekspert SEO i AI Search',
    'ekspertka SEO i AI Search',
    'specjalista ds. treści',
    'specjalistka ds. treści',
    'specjalista ds. marketingu',
    'specjalistka ds. marketingu',
    'content manager',
    'content managerka',
    'head of SEO',
    'account manager',
    'account managerka',
  ];
  const ROLE_OTHER = '__other__';

  /* Autorzy portalu do wyboru. Lista idzie z WordPressa przez Workera (cache
     10 minut), więc nowa osoba w redakcji nie wymaga wdrożenia. Autora wpisu
     pomijamy – cytowanie samego siebie to reguła redakcyjna, nie kaprys UI. */
  async function loadAuthors() {
    const select = $<HTMLSelectElement>('[data-ed-expert-who]');
    if (!select) return;
    fillRoles();
    try {
      const data = await api(`/api/cw/authors/${domain}`);
      wpAuthorList = (data.authors ?? []).filter((row: any) => Number.isInteger(row.id));
      fillWpAuthors();
      authors = (data.authors ?? []).filter((row: any) => row.name !== entry.author);
    } catch {
      return; // brak listy = zostaje „dobierz automatycznie"
    }
    for (const row of authors) {
      const option = document.createElement('option');
      option.value = row.name;
      option.textContent = row.role ? `${row.name} – ${row.role}` : row.name;
      select.append(option);
    }
    select.addEventListener('change', () => {
      setRole(authors.find((row) => row.name === select.value)?.role ?? '');
    });
  }

  /** Wypełnia listę stanowisk i spina ją z polem tekstowym dla „inne”. */
  function fillRoles() {
    const select = $<HTMLSelectElement>('[data-ed-expert-role-select]');
    const input = $<HTMLInputElement>('[data-ed-expert-role]');
    if (!select || !input) return;
    for (const role of ROLE_OPTIONS) {
      const option = document.createElement('option');
      option.value = role;
      option.textContent = role;
      select.append(option);
    }
    const other = document.createElement('option');
    other.value = ROLE_OTHER;
    other.textContent = 'inne (wpisz…)';
    select.append(other);
    select.addEventListener('change', () => {
      const custom = select.value === ROLE_OTHER;
      input.hidden = !custom;
      if (custom) input.focus();
      else input.value = '';
    });
  }

  /** Rola z WordPressa/wyboru autora: trafia w opcję listy, a nietypowe
      brzmienie ląduje w polu „inne” zamiast przepaść. */
  function setRole(role: string) {
    const select = $<HTMLSelectElement>('[data-ed-expert-role-select]');
    const input = $<HTMLInputElement>('[data-ed-expert-role]');
    if (!select || !input) return;
    if (role && !ROLE_OPTIONS.includes(role)) {
      select.value = ROLE_OTHER;
      input.hidden = false;
      input.value = role;
      return;
    }
    select.value = role;
    input.hidden = true;
    input.value = '';
  }

  function expertChoice() {
    const name = $<HTMLSelectElement>('[data-ed-expert-who]')?.value.trim() ?? '';
    const slotRaw = $<HTMLSelectElement>('[data-ed-expert-slot]')?.value ?? '';
    const slot = slotRaw ? Number(slotRaw) : undefined;
    if (!name) return slot ? { slot } : undefined;
    const picked = $<HTMLSelectElement>('[data-ed-expert-role-select]')?.value ?? '';
    const role = picked === ROLE_OTHER
      ? ($<HTMLInputElement>('[data-ed-expert-role]')?.value.trim() ?? '')
      : picked;
    return { expert: name, role: role || undefined, slot };
  }

  /** Lista sekcji do wyboru miejsca cytatu – tytuły zamiast numerów slotów.
      Odświeżana przy każdym renderze eksperta (dokument bywa przebudowany). */
  function fillExpertSlots() {
    const select = $<HTMLSelectElement>('[data-ed-expert-slot]');
    if (!select) return;
    const prev = select.value;
    select.replaceChildren();
    const auto = document.createElement('option');
    auto.value = '';
    auto.textContent = 'koniec artykułu – model dobiera';
    select.append(auto);
    for (const node of document.querySelectorAll<HTMLElement>(
      '[data-ed-doc] .ed-doc-section:not(.ed-doc-faq):not(.ed-doc-intro)',
    )) {
      if (isSourcesNode(node)) continue;
      const slot = Number(node.dataset.slot);
      const title = node.querySelector('.ed-sec-head h2')?.textContent?.trim();
      if (!slot || !title) continue;
      const option = document.createElement('option');
      option.value = String(slot);
      option.textContent = `pod: ${title}`;
      select.append(option);
    }
    if (prev && [...select.options].some((option) => option.value === prev)) select.value = prev;
  }

  async function callExpert(method: string, body?: any) {
    if (!job || expertBusy) return;
    expertBusy = true;
    $('[data-ed-expert-error]')!.hidden = true;
    renderExpert(job);
    try {
      await api(`/api/cw/jobs/${job.id}/expert`, { method, body: body ? JSON.stringify(body) : undefined });
      const data = await api(`/api/cw/jobs/${job.id}`);
      expertBusy = false;
      render(data.job);
    } catch (error) {
      expertBusy = false;
      // Stan eksperta mógł się zmienić mimo błędu (np. failed z powodem).
      try {
        const data = await api(`/api/cw/jobs/${job!.id}`);
        job = data.job;
      } catch { /* zostajemy przy tym, co mamy */ }
      renderExpert(job!);
      const node = $('[data-ed-expert-error]')!;
      node.textContent = error instanceof Error ? error.message : 'Nie udało się wygenerować cytatu.';
      node.hidden = false;
    }
  }

  /** Blokada „running" bez żywego wywołania za sobą – Worker zabity w trakcie
      (np. zerwane połączenie) nie zdejmie jej sam. Backend po tym samym oknie
      pozwala przejąć etap, więc pokazujemy ponowną próbę zamiast wiecznego
      spinnera. */
  const RUNNING_STALE_MS = 3 * 60_000;
  const staleRunning = (state: any) => state?.status === 'running'
    && (!state.started_at || Date.now() - Date.parse(state.started_at) > RUNNING_STALE_MS);

  function renderExpert(current: Job) {
    const card = $('[data-ed-expert]')!;
    card.hidden = current.status !== 'done';
    if (card.hidden) return;
    fillExpertSlots();
    const actions = $('[data-ed-expert-actions]')!;
    actions.replaceChildren();

    const button = (label: string, onClick: () => void, primary = false) => {
      const node = document.createElement('button');
      node.type = 'button';
      node.className = primary ? 'ed-expert-run' : 'ed-expert-secondary';
      node.textContent = label;
      node.addEventListener('click', onClick);
      return node;
    };

    if (expertBusy || (current.expert?.status === 'running' && !staleRunning(current.expert))) {
      const wait = document.createElement('span');
      wait.className = 'ed-expert-wait';
      wait.textContent = 'generowanie cytatu… (model rozumujący, do dwóch minut)';
      actions.append(wait);
      return;
    }
    if (staleRunning(current.expert)) {
      const note = document.createElement('span');
      note.className = 'ed-expert-meta';
      note.textContent = 'poprzednia próba została przerwana i nie zwróciła cytatu';
      actions.append(note);
    }
    const expert = activeExpert(current);
    if (expert) {
      const quote = document.createElement('div');
      quote.className = 'prose ed-expert-preview';
      sanitizeInto(quote, expertBlockquote(expert));
      const meta = document.createElement('small');
      meta.className = 'ed-expert-meta';
      meta.textContent = [
        expert.slot ? `sekcja ${expert.slot}` : null,
        expert.placement || null,
        expert.model || null,
      ].filter(Boolean).join(' · ');
      // Na czym stoi cytat: pozycja z materiału przebiegu, którą wskazał model.
      // Bez tego nie da się sprawdzić, czy wypowiedź nazwiskiem realnej osoby
      // opiera się na danych, czy na wymyślonym wspomnieniu z projektu.
      const basis = document.createElement('small');
      basis.className = 'ed-expert-meta ed-expert-basis';
      basis.hidden = !expert.basis;
      if (expert.basis) basis.textContent = `podstawa: ${expert.basis}`;
      actions.append(quote, meta, basis,
        button('kopiuj cytat', async () => { await navigator.clipboard.writeText(expertShortcode(expert)); }),
        button('wygeneruj ponownie', () => callExpert('POST', expertChoice())),
        button('odrzuć', () => callExpert('PATCH', { rejected: true })));
      return;
    }
    if (current.expert?.status === 'failed' && current.expert?.error) {
      const err = document.createElement('span');
      err.className = 'ed-expert-meta';
      err.textContent = current.expert.error;
      actions.append(err);
    }
    // Po odrzuceniu „spróbuj ponownie" brzmiało jak obsługa błędu i przycisk
    // generowania robił się niewidzialny – nazywamy rzecz po imieniu.
    if (current.expert?.status === 'rejected') {
      const note = document.createElement('span');
      note.className = 'ed-expert-meta';
      note.textContent = 'poprzedni cytat odrzucony – wybierz miejsce i wygeneruj nowy';
      actions.append(note);
    }
    actions.append(button(current.expert ? 'wygeneruj nowy cytat' : 'Dodaj poradę eksperta',
      () => callExpert('POST', expertChoice()), true));
  }

  /* ---------- styl i fleksja (przejazd redaktorski) ----------
     Jedno wywołanie modelu na cały wpis, wynik jako propozycja per sekcja.
     Świadome odejście od czwartego trybu widoku („zmiany / wersja po /
     oryginał / styl"): propozycja stylu przychodzi też dla sekcji, których
     pipeline nie ruszał, a te nie mają w ogóle przełącznika trybów. Blok
     wpięty w sekcję działa w obu przypadkach tak samo. */

  let styleBusy = false;

  const styleRows = (current: Job | null) => current?.style_sections ?? [];

  async function callStyle(path: string, options: RequestInit) {
    if (!job || styleBusy) return;
    styleBusy = true;
    $('[data-ed-style-error]')!.hidden = true;
    renderStyle(job);
    try {
      const data = await api(path, options);
      styleBusy = false;
      if (data.job) render(data.job);
    } catch (error) {
      styleBusy = false;
      renderStyle(job!);
      const node = $('[data-ed-style-error]')!;
      node.textContent = error instanceof Error ? error.message : 'Nie udało się wykonać przejazdu.';
      node.hidden = false;
    }
  }

  function renderStyle(current: Job) {
    const card = $('[data-ed-style]')!;
    card.hidden = current.status !== 'done';
    if (card.hidden) return;
    const actions = $('[data-ed-style-actions]')!;
    actions.replaceChildren();
    const report = $('[data-ed-style-report]')!;
    report.replaceChildren();
    report.hidden = true;

    const button = (label: string, onClick: () => void, primary = false) => {
      const node = document.createElement('button');
      node.type = 'button';
      node.className = primary ? 'ed-expert-run' : 'ed-expert-secondary';
      node.textContent = label;
      node.addEventListener('click', onClick);
      return node;
    };

    if (styleBusy || (current.style?.status === 'running' && !staleRunning(current.style))) {
      const wait = document.createElement('span');
      wait.className = 'ed-expert-wait';
      wait.textContent = 'przejazd redaktorski… (weryfikacja faktów w sieci, do dwóch minut)';
      actions.append(wait);
      return;
    }
    if (staleRunning(current.style)) {
      const note = document.createElement('span');
      note.className = 'ed-expert-meta';
      note.textContent = 'poprzedni przejazd został przerwany – spróbuj ponownie';
      actions.append(note);
    }

    const style = current.style;
    if (style?.status === 'done') {
      const rows = styleRows(current);
      const decided = rows.filter((row) => row.decision).length;
      const meta = document.createElement('small');
      meta.className = 'ed-expert-meta';
      meta.textContent = [
        rows.length
          ? `${pl.format(rows.length)} ${rows.length === 1 ? 'sekcja z korektą' : 'sekcji z korektą'} na ${pl.format(style.sections_total ?? rows.length)}`
          : 'model nie miał zastrzeżeń do żadnej sekcji',
        rows.length ? `${pl.format(decided)} ocenionych` : null,
        style.model || null,
      ].filter(Boolean).join(' · ');
      actions.append(meta, button('przejedź ponownie', () => runStylePass()));
      renderStyleReport(report, style, rows);
      return;
    }
    if (style?.status === 'failed' && style?.error) {
      const err = document.createElement('span');
      err.className = 'ed-expert-meta';
      err.textContent = style.error;
      actions.append(err);
    }
    actions.append(button(style ? 'spróbuj ponownie' : 'Popraw styl i fleksję',
      () => runStylePass(), true));
  }

  const runStylePass = () => callStyle(`/api/cw/jobs/${job!.id}/style`, { method: 'POST' });

  /** Odnośnik do sekcji w dokumencie – z jej tytułem, bo sekcje w edytorze
      nie są numerowane i „sekcja 4" nic redaktorowi nie mówi. */
  function slotJump(slot: number) {
    const section = document.querySelector(`.ed-doc-section[data-slot="${slot}"]`);
    const title = section?.querySelector('.ed-sec-head h2, .ed-sec-head h3')?.textContent?.trim();
    const jump = document.createElement('a');
    jump.href = `#sekcja-${slot}`;
    jump.className = 'ed-style-jump';
    jump.textContent = `→ ${title || `sekcja ${slot}`}`;
    jump.addEventListener('click', (event) => {
      event.preventDefault();
      section?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    return jump;
  }

  /** Raport przejazdu: weryfikacja faktów i propozycje uzupełnień. Poprawki
      językowe stoją przy sekcjach, tu zostaje to, co dotyczy całego wpisu. */
  function renderStyleReport(host: HTMLElement, style: any, rows: StyleRow[]) {
    const facts = Array.isArray(style.facts) ? style.facts : [];
    const additions = Array.isArray(style.additions) ? style.additions : [];
    if (!facts.length && !additions.length && !rows.length) return;
    host.hidden = false;

    if (facts.length) {
      const head = document.createElement('h4');
      head.textContent = 'Fakty do sprawdzenia';
      const list = document.createElement('ul');
      list.className = 'ed-style-facts';
      for (const fact of facts) {
        const item = document.createElement('li');
        const status = document.createElement('span');
        status.className = `ed-sec-tag ${fact.status === 'potwierdzone' ? 'ok' : 'warn'}`;
        status.textContent = fact.status;
        const claim = document.createElement('b');
        claim.textContent = fact.claim;
        item.append(status, ' ', claim);
        if (fact.note) {
          const note = document.createElement('span');
          note.className = 'ed-style-note';
          note.textContent = ` – ${fact.note}`;
          item.append(note);
        }
        if (fact.slot) item.append(' ', slotJump(fact.slot));
        list.append(item);
      }
      host.append(head, list);
    }

    if (additions.length) {
      const head = document.createElement('h4');
      head.textContent = 'Proponowane uzupełnienia';
      const note = document.createElement('p');
      note.className = 'ed-style-note';
      note.textContent = 'Model nie wstawia ich sam – „wstaw do sekcji" tworzy propozycję z diffem do oceny przy sekcji.';
      const list = document.createElement('ul');
      list.className = 'ed-style-facts';
      for (const [index, row] of additions.entries()) {
        const item = document.createElement('li');
        item.textContent = row.fact;
        if (!row.certain) {
          const tag = document.createElement('span');
          tag.className = 'ed-sec-tag warn';
          tag.textContent = 'do weryfikacji';
          item.append(' ', tag);
        }
        if (row.slot) item.append(' ', slotJump(row.slot));
        if (row.inserted) {
          const tag = document.createElement('span');
          tag.className = 'ed-sec-tag ok';
          tag.textContent = 'wstawione – oceń przy sekcji';
          item.append(' ', tag);
        } else if (row.slot) {
          const insert = document.createElement('button');
          insert.type = 'button';
          insert.className = 'ed-style-btn ok';
          insert.textContent = 'wstaw do sekcji';
          insert.title = 'Model wplecie ten fakt w treść sekcji – zmiana czeka na Twoje ✓';
          insert.addEventListener('click', () => callStyle(
            `/api/cw/jobs/${job!.id}/style/addition`,
            { method: 'POST', body: JSON.stringify({ index }) },
          ));
          item.append(' ', insert);
        }
        list.append(item);
      }
      host.append(head, note, list);
    }
  }

  /* ---------- zapis do WordPressa (szkic + wdrożenie) ---------- */

  let wpBusy = false;
  /* Komunikat przy przyciskach WP. Pasek dokumentu bywa daleko od panelu
     błędów u góry strony, więc odpowiedź na klik musi stanąć obok klikniętego
     przycisku – inaczej odmowa WordPressa wygląda jak „nic się nie stało". */
  let wpMessage: { text: string; error: boolean } | null = null;

  function renderWpActions(current: Job | null) {
    const wrap = $('[data-ed-wp]');
    if (!wrap) return;
    wrap.hidden = current?.status !== 'done';
    if (wrap.hidden) return;
    const draftButton = $<HTMLButtonElement>('[data-ed-wp-draft]')!;
    const preview = $<HTMLAnchorElement>('[data-ed-wp-preview]')!;
    const applyButton = $<HTMLButtonElement>('[data-ed-wp-apply]')!;
    const note = $('[data-ed-wp-note]')!;

    const applied = Boolean(current?.applied_at);
    draftButton.disabled = wpBusy || applied;
    applyButton.disabled = wpBusy || applied;
    draftButton.textContent = wpBusy ? 'zapisuję w WP…'
      : current?.wp_draft_id ? 'odśwież szkic w WP' : 'szkic w WordPressie';
    preview.hidden = !current?.wp_draft_url;
    if (current?.wp_draft_url) preview.href = current.wp_draft_url;
    const text = wpMessage?.text ?? (applied ? `wdrożono ${fmtDate(current!.applied_at!.slice(0, 10))}` : '');
    note.textContent = text;
    note.hidden = !text;
    note.classList.toggle('is-error', Boolean(wpMessage?.error));
  }

  /* Select autora: bieżący autor z WP zaznaczony; wybór innej osoby jedzie
     jako author_id ze szkicem i wdrożeniem. Ten sam autor = bez pola. */
  function fillWpAuthors() {
    const select = $<HTMLSelectElement>('[data-ed-wp-author]');
    if (!select) return;
    const currentId = content()?.author_id ?? null;
    select.replaceChildren();
    if (!wpAuthorList.some((row) => row.id === currentId)) {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = entry.author ? `${entry.author} (bez zmian)` : 'bez zmian';
      select.append(option);
    }
    for (const row of wpAuthorList) {
      const option = document.createElement('option');
      option.value = String(row.id);
      option.textContent = row.role ? `${row.name} – ${row.role}` : row.name;
      if (row.id === currentId) option.selected = true;
      select.append(option);
    }
  }
  function wpAuthorBody() {
    const raw = $<HTMLSelectElement>('[data-ed-wp-author]')?.value ?? '';
    const picked = raw ? Number(raw) : null;
    return picked && picked !== (content()?.author_id ?? null) ? { author_id: picked } : {};
  }

  async function wpDraft() {
    if (!job || wpBusy) return;
    wpBusy = true;
    wpMessage = null;
    renderWpActions(job);
    try {
      const data = await api(`/api/cw/jobs/${job.id}/wp-draft`, { method: 'POST', body: JSON.stringify(wpAuthorBody()) });
      job.wp_draft_id = data.draft_id;
      job.wp_draft_url = data.preview_url;
      wpMessage = { text: 'szkic zapisany', error: false };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nie udało się zapisać szkicu.';
      wpMessage = { text: message, error: true };
      showError(message);
    } finally {
      wpBusy = false;
      renderWpActions(job);
    }
  }

  async function wpApply(force = false) {
    if (!job || wpBusy) return;
    if (!force && !window.confirm('Podmienić treść opublikowanego wpisu na wersję z edytora i skasować szkic?')) return;
    wpBusy = true;
    wpMessage = null;
    renderWpActions(job);
    try {
      const authorBody = wpAuthorBody();
      const data = await api(`/api/cw/jobs/${job.id}/wp-apply${force ? '?force=1' : ''}`, { method: 'POST', body: JSON.stringify(authorBody) });
      // Po wdrożeniu WP ma już nowego autora – nagłówek i select idą za tym.
      const loaded = content();
      if (authorBody.author_id && loaded) {
        editorStore.set({ content: { ...loaded, author_id: authorBody.author_id } });
        const who = wpAuthorList.find((row) => row.id === authorBody.author_id);
        if (who) editorStore.set({ authorName: who.name });
      }
      job.applied_at = data.applied_at;
      job.wp_draft_id = null;
      job.wp_draft_url = null;
    } catch (error) {
      const code = (error as Error & { code?: string }).code;
      // Rozjazd hashy = ktoś edytował wpis w CMS-ie po analizie – wdrożenie
      // nadpisałoby te poprawki, więc wymaga osobnego, świadomego potwierdzenia.
      if (code === 'content_changed'
        && window.confirm(`${(error as Error).message}\n\nWdrożyć mimo to? Zmiany z CMS-a w tych sekcjach zostaną nadpisane.`)) {
        wpBusy = false;
        await wpApply(true);
        return;
      }
      const message = error instanceof Error ? error.message : 'Nie udało się wdrożyć zmian.';
      wpMessage = { text: message, error: true };
      showError(message);
    } finally {
      wpBusy = false;
      renderWpActions(job);
    }
  }

  $('[data-ed-wp-draft]')?.addEventListener('click', () => wpDraft());
  $('[data-ed-wp-apply]')?.addEventListener('click', () => wpApply());

  /* ---------- cykl życia zadania ---------- */

  /* Zadanie zmienia się tylko przez wspólny stan: React renderuje dokument,
     a subskrypcja niżej odmalowuje panele tego modułu. */
  function render(current: Job) {
    editorStore.set({ job: current });
  }

  function renderPanels(current: Job) {
    renderProgress(current);
    renderBrief(current);
    renderExpert(current);
    renderStyle(current);
    renderWpActions(current);
    const running = ['queued', 'dispatching', 'running'].includes(current.status);
    $<HTMLButtonElement>('[data-ed-run]')?.toggleAttribute('disabled', running);
  }

  /* Zmiany z Reacta (decyzje, korekta, infografika, CTA) i z tego modułu idą
     jednym torem. Odmalowanie po cyklu zdarzeń – React musi najpierw
     przebudować dokument, bo karta eksperta czyta z niego listę sekcji. */
  let seenJob: Job | null = null;
  let seenContent: unknown = null;
  editorStore.subscribe(() => {
    const state = editorStore.get();
    if (state.content !== seenContent) {
      seenContent = state.content;
      // Lista autorów mogła przyjść przed treścią – dopiero teraz znamy author_id.
      fillWpAuthors();
      // Zadanie mogło przyjść przed treścią – lista miejsc cytatu czyta sekcje
      // z dokumentu, więc odświeżamy ją po jego zbudowaniu.
      setTimeout(() => { if (job) renderExpert(job); }, 0);
    }
    if (!state.job || state.job === seenJob) return;
    seenJob = state.job;
    job = state.job;
    const current = state.job;
    setTimeout(() => { if (job === current) renderPanels(current); }, 0);
  });

  /** Polling z narastającym odstępem, wstrzymywany przy ukrytej karcie
      i zatrzymywany w stanie końcowym – zadanie trwa minuty, nie sekundy. */
  function schedulePoll() {
    window.clearTimeout(pollTimer);
    if (!job || !['queued', 'dispatching', 'running'].includes(job.status)) return;
    pollTimer = window.setTimeout(async () => {
      if (document.visibilityState === 'hidden') { schedulePoll(); return; }
      try {
        const data = await api(`/api/cw/jobs/${job!.id}`);
        render(data.job);
      } catch {
        /* chwilowy błąd sieci nie przerywa pollingu */
      }
      pollDelay = Math.min(30000, Math.round(pollDelay * 1.6));
      schedulePoll();
    }, pollDelay);
  }

  async function loadLatestJob() {
    if (!entry?.post_id) return;
    try {
      const data = await api(`/api/cw/jobs?domain=${encodeURIComponent(domain)}&limit=100`);
      const mine = (data.jobs ?? []).find((row: any) => row.post_id === entry.post_id);
      if (!mine) return;
      const full = await api(`/api/cw/jobs/${mine.id}`);
      render(full.job);
      schedulePoll();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Nie udało się odczytać stanu zadań.');
    }
  }

  /** Zakończony przebieg blokuje wpis na COOLDOWN_DAYS (lustro cw-api.js).
      Świadome ponowienie z edytora omija tylko ten limit – dzienny i limit
      równoległych zadań zostają – więc pytamy wprost o zgodę. */
  const COOLDOWN_DAYS = 30;
  function cooldownActive() {
    if (!job || job.status !== 'done' || !job.created_at) return false;
    return Date.now() - new Date(job.created_at).getTime() < COOLDOWN_DAYS * 86_400_000;
  }

  async function runPipeline() {
    $('[data-ed-error]')!.hidden = true;
    const improvements = [...document.querySelectorAll<HTMLInputElement>('input[name="improvement"]:checked')]
      .map((input) => input.value);
    if (!improvements.length) return showError('Wybierz przynajmniej jeden element do optymalizacji.');

    const research = $<HTMLInputElement>('[data-ed-model-research]')!.value.trim() || DEFAULT_MODELS.research;
    const writer = $<HTMLInputElement>('[data-ed-model-writer]')!.value.trim() || DEFAULT_MODELS.writer;
    if (!MODEL_ID.test(research) || !MODEL_ID.test(writer)) {
      return showError('ID modelu musi mieć format „dostawca/model" (np. anthropic/claude-sonnet-5).');
    }
    localStorage.setItem('cw-models', JSON.stringify({ research, writer }));

    let force = false;
    if (cooldownActive()) {
      const stamp = new Date(job!.created_at).toLocaleDateString('pl-PL');
      const ok = window.confirm(
        `Ten wpis był optymalizowany ${stamp}, a limit wynosi jedną analizę na ${COOLDOWN_DAYS} dni.\n\n`
        + 'Uruchomić ponownie? Wymaga to ponownego zużycia limitów (wyszukiwarka, Senuto, tokeny). '
        + 'Obecny wynik w panelu zostanie zastąpiony nowym.',
      );
      if (!ok) return;
      force = true;
    }

    const submit = async () => {
      const data = await api(`/api/cw/jobs${force ? '?force=1' : ''}`, {
        method: 'POST',
        body: JSON.stringify({
          domain,
          post_id: entry.post_id,
          post_type: entry.post_type ?? 'posts',
          url: entry.url,
          title: entry.title,
          author: entry.author ?? '',
          improvements,
          models: { research, writer },
        }),
      });
      pollDelay = 3000;
      editorStore.set({ modes: {} });
      render(data.job);
      schedulePoll();
    };

    try {
      await submit();
    } catch (error) {
      // Lokalny cooldownActive() widzi tylko OSTATNI job – po nieudanym
      // przebiegu jest „failed", więc o wymuszenie nikt nie zapytał, a Worker
      // odrzuca przez wcześniejszy ukończony przejazd. Pytamy dopiero teraz
      // i ponawiamy z force=1.
      if (!force && (error as { code?: string })?.code === 'cooldown') {
        const ok = window.confirm(
          `${error instanceof Error ? error.message : ''}\n\n`
          + 'Uruchomić ponownie mimo limitu? Wymaga to ponownego zużycia limitów '
          + '(wyszukiwarka, Senuto, tokeny), a obecny wynik w panelu zostanie zastąpiony nowym.',
        );
        if (!ok) return;
        force = true;
        try {
          await submit();
        } catch (retryError) {
          showError(retryError instanceof Error ? retryError.message : 'Nie udało się dodać zadania do kolejki.');
        }
        return;
      }
      showError(error instanceof Error ? error.message : 'Nie udało się dodać zadania do kolejki.');
    }
  }

  $('[data-ed-run]')?.addEventListener('click', runPipeline);
  const backToSetup = () => {
    const setup = $('[data-ed-setup]')!;
    setup.hidden = false;
    $('[data-ed-summary]')!.hidden = true;
    $('[data-ed-fail]')!.hidden = true;
    // Przy długim wpisie podsumowanie bywa daleko od konfiguracji – bez tego
    // kliknięcie wygląda, jakby nic się nie stało.
    setup.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };
  $('[data-ed-rerun]')?.addEventListener('click', backToSetup);
  $('[data-ed-fail-rerun]')?.addEventListener('click', backToSetup);
  $('[data-ed-cancel]')?.addEventListener('click', async () => {
    if (!job) return;
    try {
      await api(`/api/cw/jobs/${job.id}/cancel`, { method: 'POST' });
      const data = await api(`/api/cw/jobs/${job.id}`);
      render(data.job);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Nie udało się anulować zadania.');
    }
  });

  $('[data-ed-brief-details]')?.addEventListener('toggle', (event) => {
    (event.currentTarget as HTMLElement).dataset.touched = '1';
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') { pollDelay = 3000; schedulePoll(); }
  });

  // Katalog wczytał już PostEditor (React) – wpis przychodzi w argumencie.
  loadModels();
  loadLatestJob();
  loadAuthors();
}
