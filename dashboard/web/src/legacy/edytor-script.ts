// @ts-nocheck – kod przeniesiony bez zmian; typy sprawdzał kompilator Astro.
/* Edytor wpisu Content Watchera – część jeszcze nieprzepisana na React:
   belka pipeline'u, wytyczne, dokument (edycja, diff, decyzje), ekspert, styl,
   infografiki, CTA i zapis do WordPressa. Logika 1:1 ze <script> w
   dashboard/app/src/pages/[domain]/content-watcher/edytor.astro, opakowana
   w mount(). Uruchamia ją PostEditor.tsx po wstawieniu znaczników
   (edytor-*.html); stan dzielony z panelami React – lib/cw-editor/store.ts. */
import { docProse, markBlocks, sanitizeInto } from '@/lib/cw-editor/sanitize';
import { docSnapshot } from '@/lib/cw-editor/snapshot';
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

  // Sloty FAQ zaczynają się nad tą wartością (101+) – lustro FAQ_SLOT_BASE
  // z config.py i cw-api.js.
  const FAQ_SLOT_BASE = 100;
  // Blok „Źródła”: osobne pola ACF (page_sources_*), na stronie ZA blokiem FAQ
  // (motyw od 2026-09-03). Pseudo-slot – lustro SOURCES_SLOT z config.py/cw-api.js.
  const SOURCES_SLOT = 200;
  type DocKind = 'section' | 'faq' | 'sources';
  const kindOfSlot = (slot: number): DocKind =>
    slot === SOURCES_SLOT ? 'sources' : (slot > FAQ_SLOT_BASE ? 'faq' : 'section');
  /** Wiersz „Źródła” z przejazdu sprzed 2026-09-03 (bibliografia w slocie
      treści). Zapis do WP przenosi go do pól page_sources_* (lustro
      legacySourcesRow w cw-wp.js), więc w dokumencie też stoi na końcu. */
  const legacySourcesRow = (section: Section) =>
    section.slot >= 1 && section.slot <= 30 && section.operation === 'insert'
    && /^(źródła|zrodla|bibliografia)$/i.test((section.title_after ?? '').trim());
  const kindOfSection = (section: Section): DocKind => legacySourcesRow(section) ? 'sources' : kindOfSlot(section.slot);

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

  /* Sanityzacja HTML (sanitizeInto, docProse, markBlocks) – lib/cw-editor/sanitize.ts. */

  /* ---------- stan strony ---------- */

  let entry: any = initialEntry;
  let content: {
    title?: string;
    author_id?: number | null;
    lead?: string;
    no_section?: string;
    sections: { slot: number; title: string; text: string }[];
    faq?: { title: string; schema: boolean; items: { slot: number; title: string; text: string }[] };
    // Blok Źródeł z pól page_sources_* (null, gdy wpis go nie ma).
    sources?: { slot: number; title: string; text: string } | null;
  } | null = null;
  let job: Job | null = null;
  // Id zadania, którego propozycje są nałożone na dokument – ponowny przebieg
  // tworzy NOWE zadanie i bez przebudowy dokumentu jego wstawki (np. sekcja
  // „Źródła") dublowałyby się z tymi ze starego przebiegu.
  let appliedJobId: string | null = null;
  let pollDelay = 3000;
  let pollTimer: number | undefined;
  let clockTimer: number | undefined;
  const sectionMode = new Map<number, string>();

  /* ---------- katalog + treść ---------- */


  async function loadContent() {
    const host = $('[data-ed-doc]')!;
    try {
      content = await api(`/api/cw/content/${domain}/${entry.post_type ?? 'posts'}/${entry.post_id}`);
    } catch (error) {
      host.replaceChildren();
      const note = document.createElement('p');
      note.className = 'ed-doc-error';
      note.textContent = `Nie udało się wczytać treści wpisu (${error instanceof Error ? error.message : 'błąd'}). ` +
        'Mimo to możesz rozpocząć optymalizację – w dokumencie pojawią się nowe propozycje.';
      host.append(note);
      return;
    }
    renderDoc();
    // Lista autorów mogła przyjść przed treścią – dopiero teraz znamy author_id.
    fillWpAuthors();
    // Zadanie mogło wczytać się szybciej niż treść – nakładamy jego stan
    // (propozycje + cytat eksperta) na świeżo zbudowany dokument.
    if (job) {
      applyJobToDoc(job);
      applyExpertToDoc(job);
    }
  }


  /* ---------- edycja treści ----------
     Dokument jest edytowalny w miejscu: pasek formatowania działa na
     zaznaczeniu (execCommand – jedyne API contentEditable dostępne bez
     zewnętrznej biblioteki). Sekcje z propozycją zapisują się do zadania,
     oryginalna treść z WordPressa – lokalnie, bo wdrożenie i tak jest ręczne. */

  const draftKey = (slot: number) => `cw-draft:${domain}:${entry?.post_id}:${slot}`;

  const FORMAT_BUTTONS: { label: string; title: string; run: () => void; className?: string }[] = [
    { label: 'B', title: 'Pogrubienie (Ctrl+B)', className: 'bold', run: () => document.execCommand('bold') },
    { label: 'I', title: 'Kursywa (Ctrl+I)', className: 'italic', run: () => document.execCommand('italic') },
    { label: 'H2', title: 'Nagłówek H2', run: () => document.execCommand('formatBlock', false, 'h2') },
    { label: 'H3', title: 'Nagłówek H3', run: () => document.execCommand('formatBlock', false, 'h3') },
    { label: '¶', title: 'Zwykły akapit', run: () => document.execCommand('formatBlock', false, 'p') },
    { label: '• lista', title: 'Lista punktowana', run: () => document.execCommand('insertUnorderedList') },
    { label: '1. lista', title: 'Lista numerowana', run: () => document.execCommand('insertOrderedList') },
    {
      label: 'link',
      title: 'Wstaw odnośnik',
      run: () => {
        const href = window.prompt('Adres odnośnika (https://…)');
        if (href && /^https?:\/\//i.test(href)) document.execCommand('createLink', false, href);
      },
    },
    { label: 'wyczyść', title: 'Usuń formatowanie zaznaczenia', run: () => document.execCommand('removeFormat') },
  ];

  function formatToolbar() {
    const bar = document.createElement('div');
    bar.className = 'ed-format';
    for (const item of FORMAT_BUTTONS) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `ed-format-btn ${item.className ?? ''}`.trim();
      button.textContent = item.label;
      button.title = item.title;
      // mousedown zamiast click – kliknięcie gubiłoby zaznaczenie w tekście.
      button.addEventListener('mousedown', (event) => {
        event.preventDefault();
        item.run();
      });
      bar.append(button);
    }
    return bar;
  }

  /** Włącza edycję w miejscu: pasek formatowania nad treścią i przycisk
      zapisu, który budzi się przy pierwszej zmianie. */
  function enableEditing(section: HTMLElement, body: HTMLElement, save: HTMLButtonElement) {
    if (body.isContentEditable) { body.focus(); return; }
    body.contentEditable = 'true';
    body.classList.add('ed-editable');
    body.addEventListener('input', () => {
      save.hidden = false;
      section.dataset.dirty = '1';
      scheduleScore();
    });
    section.insertBefore(formatToolbar(), body);
    body.focus();
  }

  /** Sekcja dokumentu: nagłówek + treść + (po pipelinie) narzędzia i tryby. */
  function docSection(slot: number, title: string, html: string | null, kind: DocKind = 'section') {
    const faq = kind === 'faq';
    const section = document.createElement('section');
    section.className = faq ? 'ed-doc-section ed-doc-faq'
      : (kind === 'sources' ? 'ed-doc-section ed-doc-sources' : 'ed-doc-section');
    section.dataset.slot = String(slot);
    section.dataset.kind = kind;
    const head = document.createElement('div');
    head.className = 'ed-sec-head';
    // Pytanie FAQ to na stronie H3 pod wspólnym H2 bloku – renderujemy tak samo,
    // żeby liczba nagłówków w ocenie treści zgadzała się z tym, co widzi Google.
    const heading = document.createElement(faq ? 'h3' : 'h2');
    heading.dataset.block = faq ? 'h3' : 'h2';
    heading.textContent = title || (faq ? `Pytanie ${slot - 100}` : (kind === 'sources' ? 'Źródła' : `Sekcja ${slot}`));
    head.append(heading);
    if (kind === 'sources') {
      // Bibliografia stoi na stronie pod FAQ, przed boksem autora – etykieta,
      // żeby nikt nie szukał jej wśród sekcji treści.
      const where = document.createElement('span');
      where.className = 'ed-sec-tag';
      where.textContent = 'blok za FAQ · page_sources_text';
      head.append(where);
    }

    // Szkic z poprzedniej sesji ma pierwszeństwo przed treścią z WordPressa –
    // inaczej odświeżenie strony po cichu kasowałoby pracę redaktora.
    const draft = readDraft(slot);
    const body = docProse(draft ?? html);
    if (draft) {
      const tag = document.createElement('span');
      tag.className = 'ed-sec-tag warn';
      tag.textContent = 'szkic roboczy';
      head.append(tag);
    }

    const tools = document.createElement('div');
    tools.className = 'ed-sec-tools';
    const spacer = document.createElement('span');
    spacer.className = 'ed-sec-spacer';
    const save = document.createElement('button');
    save.type = 'button';
    save.className = 'ed-save';
    save.textContent = 'zapisz szkic';
    save.hidden = true;
    save.addEventListener('click', () => {
      writeDraft(slot, body.innerHTML);
      save.hidden = true;
      delete section.dataset.dirty;
      drop.hidden = false;
      if (!head.querySelector('.ed-sec-tag')) {
        const tag = document.createElement('span');
        tag.className = 'ed-sec-tag warn';
        tag.textContent = 'szkic roboczy';
        head.append(tag);
      }
    });
    const edit = document.createElement('button');
    edit.type = 'button';
    edit.textContent = 'edytuj tekst';
    edit.addEventListener('click', () => enableEditing(section, body, save));

    // Powrót do treści z WordPressa – bez tego szkic zostaje na zawsze.
    const drop = document.createElement('button');
    drop.type = 'button';
    drop.textContent = 'odrzuć szkic';
    drop.hidden = !draft;
    drop.addEventListener('click', () => {
      try {
        localStorage.removeItem(draftKey(slot));
      } catch { /* brak dostępu do localStorage nie blokuje strony */ }
      sanitizeInto(body, html);
      markBlocks(body);
      head.querySelector('.ed-sec-tag')?.remove();
      drop.hidden = true;
      renderScore();
    });
    const copy = document.createElement('button');
    copy.type = 'button';
    copy.textContent = 'kopiuj treść';
    copy.addEventListener('click', async () => {
      await navigator.clipboard.writeText(body.innerHTML);
      copy.textContent = 'skopiowano';
      setTimeout(() => (copy.textContent = 'kopiuj treść'), 1500);
    });
    // Infografika i CTA to narzędzia sekcji treści – w FAQ i w bibliografii
    // Worker i tak je odrzuca (400), więc przycisków tam nie pokazujemy.
    tools.append(spacer, save, drop, edit,
      ...(kind === 'section' ? [infographicButton(slot), ctaButton(slot)] : []), copy);

    section.append(head, tools, body);
    return section;
  }

  /* Szkice trzymamy w przeglądarce: wdrożenie do WordPressa i tak jest
     ręczne (kopiuj → wklej), a zapis zwrotny do CMS-u to osobny temat. */
  function readDraft(slot: number): string | null {
    try {
      return localStorage.getItem(draftKey(slot));
    } catch {
      return null;
    }
  }
  function writeDraft(slot: number, html: string) {
    try {
      localStorage.setItem(draftKey(slot), html);
    } catch {
      showError('Nie udało się zapisać szkicu w przeglądarce (brak miejsca?).');
    }
  }

  let scoreTimer: number | undefined;
  const scheduleScore = () => {
    window.clearTimeout(scoreTimer);
    scoreTimer = window.setTimeout(renderScore, 400);
  };

  /** Nagłówek dokumentu: tytuł wpisu (H1) i wstęp sprzed pierwszego H2.
      Wstęp siedzi w polu `content` WordPressa, poza sekcjami ACF – pipeline
      go nie rusza, ale bez niego dokument zaczynałby się w połowie zdania. */
  function docIntro() {
    const intro = document.createElement('section');
    intro.className = 'ed-doc-section ed-doc-intro';
    intro.dataset.slot = '0';
    const head = document.createElement('div');
    head.className = 'ed-sec-head';
    const heading = document.createElement('h1');
    heading.dataset.block = 'h1';
    heading.textContent = content?.title || entry?.title || '';
    head.append(heading);
    intro.append(head);
    const lead = (content?.lead ?? '').trim();
    if (lead) intro.append(docProse(lead));
    return intro;
  }

  // Blok „Źródła". Od 2026-09-03 to osobne pola ACF (page_sources_*), które motyw
  // renderuje ZA blokiem FAQ – w dokumencie stoi więc na końcu (.ed-doc-sources).
  // Rozpoznanie po tytule zostaje dla starych wpisów, w których bibliografia
  // wciąż siedzi w slocie treści; w obu przypadkach cytat eksperta i CTA mają
  // trzymać się od niej z daleka.
  const SOURCES_TITLE = /^(źródła|zrodla|bibliografia)$/i;
  const isSourcesTitle = (title: string | null | undefined) => SOURCES_TITLE.test((title ?? '').trim());
  const isSourcesNode = (node: Element) =>
    node.classList.contains('ed-doc-sources')
    || isSourcesTitle(node.querySelector('.ed-sec-head h2, .ed-sec-head h3')?.textContent);


  /** Statystyki dokumentu w pasku – z docelowej treści wpisu (patrz docSnapshot). */
  function renderDocStats() {
    const host = $('[data-ed-docstats]');
    if (!host) return;
    const doc = $('[data-ed-doc]')!;
    const snapshot = docSnapshot(job);
    const text = snapshot.textContent ?? '';
    const words = (text.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) ?? []).length;
    const headings = snapshot.querySelectorAll('h2, h3, h4').length;
    const paragraphs = snapshot.querySelectorAll('p').length;
    const sections = doc.querySelectorAll('.ed-doc-section:not(.ed-doc-intro):not(.ed-doc-faq):not(.ed-doc-sources)').length;
    const faq = doc.querySelectorAll('.ed-doc-section.ed-doc-faq').length;

    const stat = (value: string, label: string) => {
      const node = document.createElement('div');
      node.className = 'ed-docstat';
      const big = document.createElement('b');
      big.textContent = value;
      const small = document.createElement('span');
      small.textContent = label;
      node.append(big, small);
      return node;
    };
    const nodes = [
      stat(pl.format(words), 'słów'),
      stat(pl.format(headings), 'nagłówków'),
      stat(pl.format(paragraphs), 'akapitów'),
      stat(pl.format(sections), 'sekcji'),
    ];
    if (faq) nodes.push(stat(pl.format(faq), 'pytań FAQ'));
    if (job?.sections?.length) {
      const decided = job.sections.filter((section) => section.decision).length;
      nodes.push(stat(`${pl.format(decided)}/${pl.format(job.sections.length)}`, 'ocenionych propozycji'));
    }
    host.replaceChildren(...nodes);
  }

  /* Ocena treści, frazy do pokrycia i ich podświetlenia – ScorePanel.tsx
     (React). Liczy się z DOM-u dokumentu; stąd idzie tylko sygnał zmiany. */
  const renderScore = () => editorStore.touchDoc();

  function renderDoc() {
    const host = $('[data-ed-doc]')!;
    host.replaceChildren();
    const blocks: HTMLElement[] = [];
    if (content?.title || content?.lead || entry?.title) blocks.push(docIntro());

    if (content?.sections?.length) {
      blocks.push(...content.sections.map((section) => docSection(section.slot, section.title, section.text)));
    } else if (content?.no_section) {
      // Wpis bez sekcji ACF – cała treść stoi w jednym polu.
      const single = document.createElement('section');
      single.className = 'ed-doc-section';
      single.dataset.slot = '1';
      single.append(docProse(content.no_section));
      blocks.push(single);
    } else {
      const note = document.createElement('p');
      note.className = 'ed-doc-error';
      note.textContent = 'Ten wpis nie ma standardowego podziału na sekcje – dokument zostanie wygenerowany '
        + 'na podstawie wyników optymalizacji.';
      blocks.push(note);
    }
    // Blok FAQ spod artykułu – osobna grupa pól ACF renderowana na stronie jako
    // schema.org/FAQPage. Do 2026-08-06 w ogóle go nie widzieliśmy: dokument
    // urywał się na ostatniej sekcji, a pytania i odpowiedzi (zwykle 200–400
    // słów) nie wchodziły ani do oceny treści, ani do materiału dla modelu.
    if (content?.faq?.items?.length) {
      const head = document.createElement('div');
      head.className = 'ed-faq-head';
      const heading = document.createElement('h2');
      heading.dataset.block = 'h2';
      heading.textContent = content.faq.title || 'FAQ';
      const note = document.createElement('span');
      note.textContent = content.faq.schema
        ? 'blok FAQ · mikrodane FAQPage'
        : 'blok FAQ · bez mikrodanych';
      head.append(heading, note);
      blocks.push(head);
      blocks.push(...content.faq.items.map((row: any) =>
        docSection(row.slot, row.title, row.text, 'faq')));
    }
    // Bibliografia z pól page_sources_* – na stronie za FAQ, więc i tu na końcu.
    if (content?.sources?.text) {
      blocks.push(docSection(content.sources.slot ?? SOURCES_SLOT, content.sources.title, content.sources.text, 'sources'));
    }

    host.replaceChildren(...blocks);
    const faqCount = content?.faq?.items?.length ?? 0;
    $('[data-ed-doc-meta]')!.textContent = content?.sections?.length
      ? `${content.sections.length} sekcji${faqCount ? ` + ${faqCount} pytań FAQ` : ''}${content?.sources?.text ? ' + Źródła' : ''} · pełna treść z WordPressa`
      : 'treść z WordPressa';
    renderDocStats();
    renderScore();
  }

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

  /* ---------- diff inline w dokumencie ---------- */

  const plain = (html: string | null) =>
    (html ?? '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

  /** Ile treści sekcji objęła zmiana – przy gruntownym przepisaniu diff inline
      przestaje być czytelny i lepiej od razu pokazać wersję „po". */
  function changeRatio(section: Section) {
    const opcodes = section.diff?.opcodes ?? [];
    const changed = opcodes.filter((op) => op.op !== 'equal')
      .reduce((sum, op) => sum + Math.max(op.before.length, op.after.length), 0);
    const total = opcodes.reduce((sum, op) => sum + Math.max(op.before.length, op.after.length), 0);
    return total ? changed / total : 0;
  }

  /** Diff renderowany wyłącznie przez textContent – w treści siedzą fragmenty
      obcych stron i HTML z modelu, traktujemy je jak dane, nie markup. */
  function renderOpcodes(opcodes: { op: string; before: string; after: string }[]) {
    const wrap = document.createElement('div');
    wrap.className = 'ed-diff';
    for (const op of opcodes) {
      if (op.op === 'equal') {
        const span = document.createElement('span');
        span.textContent = op.before;
        wrap.append(span);
        continue;
      }
      if (op.before) {
        const del = document.createElement('del');
        del.textContent = op.before;
        wrap.append(del);
      }
      if (op.after) {
        const ins = document.createElement('ins');
        ins.textContent = op.after;
        wrap.append(ins);
      }
    }
    return wrap;
  }

  function renderInlineDiff(section: Section) {
    return renderOpcodes(section.diff?.opcodes ?? []);
  }

  /** Diff słowny liczony w przeglądarce – pipeline dostarcza opcode'y z difflib,
      ale przejazd redaktorski wraca z Workera jako dwa brzmienia tekstu.
      Porównujemy prozę (bez znaczników): korekta stylu zmienia słowa, nie HTML,
      a diff po tagach byłby nieczytelny. */
  const DIFF_TOKEN_LIMIT = 3000;

  function diffTokens(html: string | null) {
    const doc = new DOMParser().parseFromString(html ?? '', 'text/html');
    const text = (doc.body.textContent ?? '').replace(/\s+/g, ' ').trim();
    // Zachowujemy spacje przy słowach, żeby scalony tekst czytał się normalnie.
    return text ? text.split(/(?<=\s)/) : [];
  }

  function wordDiff(before: string | null, after: string | null) {
    const a = diffTokens(before);
    const b = diffTokens(after);
    if (!a.length && !b.length) return [];
    // Przy monstrualnej sekcji rezygnujemy z LCS (macierz rośnie kwadratowo)
    // i pokazujemy oba brzmienia jako jedną zmianę – bez cichego przycinania.
    if (a.length > DIFF_TOKEN_LIMIT || b.length > DIFF_TOKEN_LIMIT) {
      return [{ op: 'replace', before: a.join(''), after: b.join('') }];
    }

    // Najdłuższy wspólny podciąg – tabela długości, potem odczyt wstecz.
    const width = b.length + 1;
    const table = new Int32Array((a.length + 1) * width);
    for (let i = a.length - 1; i >= 0; i--) {
      for (let j = b.length - 1; j >= 0; j--) {
        table[i * width + j] = a[i] === b[j]
          ? table[(i + 1) * width + j + 1] + 1
          : Math.max(table[(i + 1) * width + j], table[i * width + j + 1]);
      }
    }

    const opcodes: { op: string; before: string; after: string }[] = [];
    const push = (op: string, before: string, after: string) => {
      const last = opcodes.at(-1);
      if (last && last.op === op) {
        last.before += before;
        last.after += after;
      } else opcodes.push({ op, before, after });
    };
    let i = 0;
    let j = 0;
    while (i < a.length && j < b.length) {
      if (a[i] === b[j]) {
        push('equal', a[i], b[j]);
        i++; j++;
      } else if (table[(i + 1) * width + j] >= table[i * width + j + 1]) {
        push('delete', a[i], '');
        i++;
      } else {
        push('insert', '', b[j]);
        j++;
      }
    }
    while (i < a.length) { push('delete', a[i], ''); i++; }
    while (j < b.length) { push('insert', '', b[j]); j++; }
    return opcodes;
  }

  /** Ten sam format bloku co step_expert w run.py i cw-expert.js. */
  /* Wygląd cytatu na stronie niosą style inline – do CSS motywu WordPressa nie
     mamy dostępu. Świadomy duplikat: EXPERT_STYLE w cw-wp.js; kopiowanie ręczne
     i zapis Workera muszą dawać ten sam HTML. W samym edytorze renderujemy
     wersję bez stylów (sanitizer i tak zdejmuje atrybuty, a blok ma tu własny,
     ciemny styl) – docelowy wygląd widać dopiero w szkicu WordPressa. */
  const EXPERT_STYLE = {
    quote: 'margin:28px 0;padding:24px 28px;background:#eef0ff;border:1px solid #dfe2fb;'
      + 'border-left:4px solid #5768ff;border-radius:12px;box-shadow:0 1px 2px #00062314',
    row: 'display:flex;gap:18px;align-items:flex-start',
    avatar: 'flex:0 0 56px;width:56px;height:56px;border-radius:50%;background:#5768ff;'
      + 'color:#ffffff;font-size:18px;font-weight:700;display:flex;align-items:center;'
      + 'justify-content:center',
    photo: 'flex:0 0 56px;width:56px;height:56px;border-radius:50%;object-fit:cover',
    body: 'flex:1 1 auto;min-width:0',
    label: 'display:block;margin-bottom:10px;color:#5768ff;font-size:12px;'
      + 'font-weight:700;letter-spacing:.08em;text-transform:uppercase',
    text: 'margin:0 0 14px;color:#000623;font-size:17px;line-height:1.7;font-style:italic',
    footer: 'margin:0;padding:0;border:0;background:transparent;color:#6e7181;'
      + 'font-size:14px;font-style:normal',
    name: 'color:#000623;font-weight:600',
  };

  /** Lustro shortcodeAttr / expertShortcode z cw-expert.js – „kopiuj cytat”
      i „kopiuj treść” dają dokładnie to, co zapis do WP. */
  function shortcodeAttr(value: string): string {
    return String(value ?? '').replace(/<[^>]*>/g, '').replace(/&quot;/g, '”').replace(/"/g, '”')
      .replace(/\[/g, '(').replace(/\]/g, ')').replace(/\s+/g, ' ').trim();
  }
  function expertShortcode(expert: any): string {
    const link = /^https:\/\//i.test(expert.link ?? '') ? String(expert.link).trim() : '';
    const attrs: [string, string][] = [
      ['text', shortcodeAttr(expert.quote ?? '')],
      ['author_name', shortcodeAttr(expert.expert ?? '')],
      ['author_pos', shortcodeAttr([expert.role, 'ICEA'].filter(Boolean).join(', '))],
      ['author_link', link],
      ['author_link_nofollow', link ? 'false' : ''],
      ['author_img', /^https:\/\//i.test(expert.photo ?? '') ? String(expert.photo).trim() : ''],
    ];
    return `[k_quote_box ${attrs.filter(([, value]) => value).map(([key, value]) => `${key}="${value}"`).join(' ')}]`;
  }

  /** Podgląd karty cytatu w edytorze (styled=true to archiwalny format
      zapisu sprzed shortcodów – zostaje dla starych wpisów). */
  function expertBlockquote(expert: any, styled = false) {
    const s = (key: keyof typeof EXPERT_STYLE) => (styled ? ` style="${EXPERT_STYLE[key]}"` : '');
    const name = String(expert.expert ?? '').trim();
    const initials = name.split(/\s+/).filter(Boolean).slice(0, 2)
      .map((word: string) => word[0].toUpperCase()).join('');
    const sign = [expert.role, 'ICEA'].filter(Boolean).join(', ');
    const face = expert.photo
      ? `<img src="${expert.photo}" alt="${name}"${s('photo')} />`
      : (initials ? `<div${s('avatar')}>${initials}</div>` : '');
    return `<blockquote class="expert"${s('quote')}>`
      + `<div${s('row')}>${face}<div${s('body')}>`
      + `<span${s('label')}>Zdaniem eksperta</span>`
      + `<p${s('text')}>${expert.quote}</p>`
      + `<footer${s('footer')}>`
      + (name ? `<span${s('name')}>${name}</span>` : '')
      + (name && sign ? ` · ${sign}` : sign)
      + '</footer></div></div></blockquote>';
  }

  function activeExpert(current: Job | null) {
    return current?.expert?.status === 'done' ? current.expert : null;
  }

  /** „Kopiuj treść" dokleja cytat eksperta do sekcji, w której ma stanąć –
      text_after w bazie zostaje czystym wynikiem pipeline'u. */
  function sectionCopyText(section: Section) {
    const expert = activeExpert(job);
    const base = section.text_after ?? '';
    return expert && expert.slot === section.slot ? `${base}\n${expertShortcode(expert)}` : base;
  }

  function renderSectionBody(host: HTMLElement, section: Section, mode: string, onDirty?: () => void) {
    if (mode === 'diff') {
      host.replaceChildren(renderInlineDiff(section));
    } else {
      const body = docProse(mode === 'before' ? section.text_before : section.text_after);
      // Wersja „po" jest edytowalna razem z paskiem formatowania – poprawki
      // zapisują się do zadania, a „kopiuj treść" bierze tekst po edycji.
      if (mode === 'after' && onDirty) {
        body.contentEditable = 'true';
        body.classList.add('ed-editable');
        body.addEventListener('input', () => { onDirty(); scheduleScore(); });
        host.replaceChildren(formatToolbar(), body);
        return;
      }
      host.replaceChildren(body);
    }
  }

  /** Rynienka decyzji przy sekcji: ✓ zatwierdza propozycję, ✕ ją odrzuca.
      Klik w aktywny stan cofa decyzję – sekcja wraca do „nieocenionych". */
  function sectionGutter(section: Section, jobId: string, onChange: () => void) {
    const gutter = document.createElement('div');
    gutter.className = 'ed-decide';

    const set = async (next: 'accepted' | 'rejected') => {
      const value = section.decision === next ? null : next;
      const previous = section.decision;
      section.decision = value;
      section.accepted = value === 'accepted';
      onChange();
      try {
        await api(`/api/cw/jobs/${jobId}/sections/${section.slot}`, {
          method: 'PATCH',
          body: JSON.stringify({ decision: value }),
        });
      } catch (error) {
        section.decision = previous;
        section.accepted = previous === 'accepted';
        onChange();
        showError(error instanceof Error ? error.message : 'Nie udało się zapisać decyzji.');
      }
    };

    const button = (kind: 'accepted' | 'rejected', glyph: string, title: string) => {
      const node = document.createElement('button');
      node.type = 'button';
      node.className = `ed-decide-btn ${kind === 'accepted' ? 'ok' : 'no'}`;
      node.dataset.decision = kind;
      node.title = title;
      node.setAttribute('aria-label', title);
      node.textContent = glyph;
      node.addEventListener('click', () => set(kind));
      return node;
    };
    gutter.append(
      button('accepted', '✓', 'Zatwierdź propozycję dla tej sekcji'),
      button('rejected', '✕', 'Odrzuć propozycję dla tej sekcji'),
    );
    return gutter;
  }

  function sectionTools(section: Section, onMode: (mode: string) => void,
    onSave?: (button: HTMLButtonElement) => void) {
    const tools = document.createElement('div');
    tools.className = 'ed-sec-tools';

    const seg = document.createElement('span');
    seg.className = 'ed-view-seg';
    const modes: [string, string][] = section.operation === 'insert'
      ? [['after', 'podgląd']]
      : (section.diff?.opcodes?.length
        ? [['diff', 'zmiany'], ['after', 'wersja po'], ['before', 'oryginał']]
        : [['after', 'wersja po'], ['before', 'oryginał']]);
    for (const [mode, label] of modes) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = label;
      button.dataset.mode = mode;
      button.addEventListener('click', () => onMode(mode));
      seg.append(button);
    }
    tools.append(seg);

    const spacer = document.createElement('span');
    spacer.className = 'ed-sec-spacer';
    tools.append(spacer);

    const copyButton = (label: string, value: () => string) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = label;
      button.addEventListener('click', async () => {
        await navigator.clipboard.writeText(value());
        button.textContent = 'skopiowano';
        setTimeout(() => (button.textContent = label), 1500);
      });
      return button;
    };
    if (onSave) {
      const save = document.createElement('button');
      save.type = 'button';
      save.className = 'ed-save';
      save.textContent = 'zapisz poprawki';
      save.hidden = true;
      save.dataset.save = '1';
      save.addEventListener('click', () => onSave(save));
      tools.append(save);
    }
    tools.append(infographicButton(section.slot), ctaButton(section.slot),
      copyButton('kopiuj nagłówek', () => section.title_after ?? ''),
      copyButton('kopiuj treść', () => sectionCopyText(section)));
    return tools;
  }

  /* ---------- raport linków w sekcji ----------
     Model przy przepisywaniu potrafi zgubić istniejące linki wewnętrzne –
     ta lista pokazuje wprost, które adresy doszły, a które zniknęły,
     żeby decyzja o sekcji nie wymagała porównywania HTML-a ręcznie. */

  function extractLinks(html: string | null) {
    const doc = new DOMParser().parseFromString(html ?? '', 'text/html');
    return [...doc.querySelectorAll<HTMLAnchorElement>('a[href]')].map((link) => ({
      href: link.getAttribute('href') ?? '',
      text: link.textContent?.trim() ?? '',
    }));
  }

  function sectionLinkDiff(section: Section) {
    const before = extractLinks(section.text_before);
    const after = extractLinks(section.text_after);
    const beforeSet = new Set(before.map((link) => link.href));
    const afterSet = new Set(after.map((link) => link.href));
    return {
      added: after.filter((link) => !beforeSet.has(link.href)),
      removed: before.filter((link) => !afterSet.has(link.href)),
    };
  }

  function linkDiffBlock(section: Section) {
    const { added, removed } = sectionLinkDiff(section);
    if (!added.length && !removed.length) return null;
    const block = document.createElement('div');
    block.className = 'ed-linkdiff';
    const row = (sign: string, className: string, link: { href: string; text: string }) => {
      const item = document.createElement('div');
      item.className = `ed-linkdiff-row ${className}`;
      const mark = document.createElement('b');
      mark.textContent = sign;
      const anchor = document.createElement('span');
      anchor.textContent = link.text ? `„${link.text}"` : '(bez anchora)';
      const target = document.createElement('a');
      target.href = link.href;
      target.target = '_blank';
      target.rel = 'noopener';
      target.textContent = link.href;
      item.append(mark, anchor, document.createTextNode(' → '), target);
      return item;
    };
    const head = document.createElement('span');
    head.className = 'ed-linkdiff-head';
    head.textContent = `Linki: ${added.length ? `+${added.length} ` : ''}${removed.length ? `−${removed.length} usunięte` : ''}`.trim();
    block.append(head);
    for (const link of removed) block.append(row('−', 'removed', link));
    for (const link of added) block.append(row('+', 'added', link));
    return block;
  }

  /** Etykiety przy nagłówku sekcji: rozmiar zmiany, ostrzeżenia, stan decyzji. */
  function sectionTags(section: Section) {
    const wrap = document.createElement('span');
    wrap.className = 'ed-sec-tags';
    const tag = (text: string, className = '') => {
      const node = document.createElement('span');
      node.className = `ed-sec-tag ${className}`.trim();
      node.textContent = text;
      wrap.append(node);
    };
    const stats = section.diff?.stats;
    // Nazywamy rzecz po imieniu: w bloku FAQ dochodzi pytanie, nie sekcja.
    if (section.operation === 'insert') {
      const kind = kindOfSection(section);
      tag(kind === 'sources' ? 'nowy blok Źródła (za FAQ)' : (kind === 'faq' ? 'nowe pytanie FAQ' : 'nowa sekcja'), 'new');
    }
    else if (section.operation === 'move') {
      // Renumeracja układu: treść przyszła z innego slotu. Diff liczony jest
      // względem źródła, więc statystyki pokazujemy tylko przy realnej zmianie.
      tag(`przesunięta z sekcji ${section.moved_from ?? '?'}`, 'new');
      if (stats && (stats.added || stats.removed)) {
        tag(`+${pl.format(stats.added)} / −${pl.format(stats.removed)} słów`);
      }
    } else if (stats) tag(`+${pl.format(stats.added)} / −${pl.format(stats.removed)} słów`);
    else tag('aktualizacja');
    if (stats?.shrunk) tag('model wyciął więcej, niż dopisał', 'warn');
    const links = sectionLinkDiff(section);
    if (links.removed.length) {
      tag(links.removed.length === 1 ? 'zniknął 1 link' : `zniknęły ${links.removed.length} linki`, 'warn');
    }
    if (section.edited) tag('ręcznie poprawiona');
    if (section.decision === 'accepted') tag('zatwierdzone', 'ok');
    if (section.decision === 'rejected') tag('odrzucone', 'no');
    return wrap;
  }

  function applyJobToDoc(current: Job) {
    if (!current.sections?.length) return;
    if (appliedJobId && appliedJobId !== current.id && content) renderDoc();
    appliedJobId = current.id;
    const host = $('[data-ed-doc]')!;
    const bySlot = new Map<number, HTMLElement>();
    host.querySelectorAll<HTMLElement>('.ed-doc-section:not(.ed-doc-intro)').forEach((node) => {
      bySlot.set(Number(node.dataset.slot), node);
    });

    for (const section of current.sections) {
      let node = bySlot.get(section.slot);
      if (!node) {
        // Nowa sekcja albo nowe pytanie FAQ (wolny slot). Kotwicy szukamy
        // WYŁĄCZNIE w tej samej przestrzeni slotów: dla sekcji poprzednio
        // pierwszym „wyższym" węzłem bywało pytanie FAQ, więc nowa sekcja
        // lądowała pod nagłówkiem bloku FAQ – w dokumencie wyglądało to jak
        // drugie, rozbite FAQ w środku artykułu.
        const kind = kindOfSection(section);
        node = docSection(section.slot, section.title_after ?? '', null, kind);
        const after = [...bySlot.entries()]
          .filter(([slot]) => slot > section.slot && kindOfSlot(slot) === kind)
          .sort((a, b) => a[0] - b[0])[0];
        // Sekcja bez następnika staje przed blokiem FAQ, nie za nim – FAQ na
        // stronie stoi pod całym artykułem. Pytanie FAQ bez następnika staje
        // przed blokiem Źródeł, a Źródła zawsze na samym końcu (motyw renderuje
        // je za FAQ, przed boksem autora).
        const fallback = kind === 'section'
          ? (host.querySelector('.ed-faq-head') ?? host.querySelector('.ed-doc-sources'))
          : (kind === 'faq' ? host.querySelector('.ed-doc-sources') : null);
        host.insertBefore(node, after?.[1] ?? fallback);
        bySlot.set(section.slot, node);
      }
      node.classList.add(section.operation === 'insert' ? 'is-new' : 'is-changed');

      const heading = node.querySelector('h2, h3');
      // Nagłówek węzła pokazuje NOWEGO lokatora slotu (po renumeracji węzeł może
      // dostać treść przesuniętą z innego miejsca), a „is-retitled" tylko realną
      // zmianę tytułu – nowa sekcja nie ma „poprzednio".
      if (heading && section.title_after) {
        if (heading.textContent !== section.title_after) heading.textContent = section.title_after;
        if (section.title_before && section.title_after !== section.title_before) {
          heading.classList.add('is-retitled');
          heading.title = `poprzednio: ${section.title_before}`;
        }
      }

      let toolsHost = node.querySelector<HTMLElement>('.ed-sec-tools');
      let bodyHost = node.querySelector<HTMLElement>('.ed-sec-body');
      if (!bodyHost) {
        bodyHost = document.createElement('div');
        bodyHost.className = 'ed-sec-body';
        node.querySelector('.ed-doc-body')?.replaceWith(bodyHost);
        node.appendChild(bodyHost);
      }

      // Stan decyzji siedzi na sekcji – stąd bierze go i CSS, i filtr paska.
      const paintDecision = () => {
        node!.dataset.decision = section.decision ?? '';
        node!.querySelectorAll<HTMLButtonElement>('.ed-decide-btn').forEach((button) => {
          button.classList.toggle('active', button.dataset.decision === section.decision);
        });
        node!.querySelector('.ed-sec-tags')?.replaceWith(sectionTags(section));
        renderDecideBar(current);
        renderDocStats();
      };
      node.querySelector('.ed-decide')?.remove();
      node.prepend(sectionGutter(section, current.id, paintDecision));
      node.querySelector('.ed-sec-tags')?.remove();
      node.querySelector('.ed-sec-head')?.append(sectionTags(section));
      // Sekcja bez opcode'ów (wstawka pipeline'u albo wiersz założony przy
      // akceptacji korekty stylu) nie ma czego pokazać w trybie „zmiany".
      const hasDiff = Boolean(section.diff?.opcodes?.length);
      const mode = sectionMode.get(section.slot)
        ?? (section.operation === 'insert' || !hasDiff || changeRatio(section) > 0.5 ? 'after' : 'diff');
      sectionMode.set(section.slot, mode);
      const onDirty = () => {
        const save = node!.querySelector<HTMLButtonElement>('[data-save]');
        if (save) save.hidden = false;
      };
      const onSave = async (button: HTMLButtonElement) => {
        const body = bodyHost!.querySelector('.prose');
        if (!body) return;
        button.disabled = true;
        try {
          const data = await api(`/api/cw/jobs/${current.id}/sections/${section.slot}`, {
            method: 'PATCH',
            body: JSON.stringify({ text_after: body.innerHTML }),
          });
          // Serwer zwraca wersję po własnej sanityzacji – to ona jest prawdą.
          section.text_after = data.text_after ?? body.innerHTML;
          section.edited = true;
          button.hidden = true;
          node!.querySelector('.ed-sec-tags')?.replaceWith(sectionTags(section));
          // Ręczna edycja mogła przywrócić albo dołożyć linki – raport liczymy na nowo.
          node!.querySelector('.ed-linkdiff')?.remove();
          const freshDiff = linkDiffBlock(section);
          if (freshDiff) node!.insertBefore(freshDiff, bodyHost!);
        } catch (error) {
          showError(error instanceof Error ? error.message : 'Nie udało się zapisać poprawek.');
        } finally {
          button.disabled = false;
        }
      };
      const paint = (nextMode: string) => {
        sectionMode.set(section.slot, nextMode);
        renderSectionBody(bodyHost!, section, nextMode, onDirty);
        node!.querySelectorAll<HTMLButtonElement>('.ed-view-seg button').forEach((button) => {
          button.classList.toggle('active', button.dataset.mode === nextMode);
        });
        // Przełączenie widoku podmienia węzły tekstowe – zaznaczenia fraz
        // trzymają zakresy w tych węzłach, więc trzeba je policzyć na nowo.
        scheduleScore();
      };
      const tools = sectionTools(section, paint, onSave);
      if (toolsHost) toolsHost.replaceWith(tools);
      else node.insertBefore(tools, bodyHost);
      node.querySelector('.ed-linkdiff')?.remove();
      const linkDiff = linkDiffBlock(section);
      if (linkDiff) node.insertBefore(linkDiff, bodyHost);
      paint(mode);
      paintDecision();
    }

    // Sekcje bez propozycji zostają w dokumencie – bez nich znika kontekst,
    // więc tylko je wyciszamy i dajemy filtr w pasku.
    const changed = new Set(current.sections.map((section) => section.slot));
    bySlot.forEach((node, slot) => {
      const unchanged = !changed.has(slot) && current.status === 'done';
      node.classList.toggle('is-unchanged', unchanged);
      // Wyciszenie samą przezroczystością myliło się z odrzuconą propozycją –
      // etykieta mówi wprost, czemu sekcja wygląda inaczej.
      node.querySelector('.ed-unchanged-tag')?.remove();
      if (unchanged) {
        const tag = document.createElement('span');
        tag.className = 'ed-sec-tag ed-unchanged-tag';
        tag.textContent = 'bez zmian';
        node.querySelector('.ed-sec-head')?.append(tag);
      }
    });
    $('[data-ed-doc-meta]')!.textContent =
      `${bySlot.size} sekcji · ${current.sections.length} z propozycjami zmian`;
    $('[data-ed-only-changed-wrap]')!.hidden = current.status !== 'done';
    applyOnlyChangedFilter();
    renderDecideBar(current);
    renderDocStats();
    renderScore();
  }

  /* ---------- pasek dokumentu: decyzje zbiorcze i filtr ---------- */

  function renderDecideBar(current: Job) {
    const bar = $('[data-ed-decide-all]')!;
    const sections = current.sections ?? [];
    bar.hidden = !sections.length || current.status !== 'done';
    if (bar.hidden) return;
    const accepted = sections.filter((section) => section.decision === 'accepted').length;
    const rejected = sections.filter((section) => section.decision === 'rejected').length;
    const left = sections.length - accepted - rejected;
    $('[data-ed-decide-count]')!.textContent = left
      ? `${pl.format(left)} ${left === 1 ? 'propozycja czeka' : 'propozycji czeka'} na decyzję`
      : `wszystko ocenione · ${pl.format(accepted)} do wdrożenia`;
    $<HTMLButtonElement>('[data-ed-accept-all]')!.hidden = left === 0;
    $<HTMLButtonElement>('[data-ed-copy-all]')!.hidden = accepted === 0;
  }

  /** Filtr „tylko zmienione" chowa sekcje bez propozycji – przy 20-sekcyjnym
      wpisie inaczej trzeba by ich szukać wzrokiem. */
  function applyOnlyChangedFilter() {
    const on = $<HTMLInputElement>('[data-ed-only-changed]')?.checked ?? false;
    document.querySelectorAll<HTMLElement>('.ed-doc-section').forEach((node) => {
      const keep = !on || node.classList.contains('is-changed') || node.classList.contains('is-new');
      node.hidden = !keep;
    });
    // Nagłówek bloku FAQ nie jest sekcją, więc filtr sam go nie ruszy –
    // zostawiony nad pustym miejscem wyglądał jak zgubione pytania.
    const faqHead = document.querySelector<HTMLElement>('.ed-faq-head');
    if (faqHead) {
      faqHead.hidden = on && ![...document.querySelectorAll<HTMLElement>('.ed-doc-section.ed-doc-faq')]
        .some((node) => !node.hidden);
    }
  }

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

  /** Cytat wpinamy też inline w dokument – na końcu wskazanej sekcji. */
  function applyExpertToDoc(current: Job) {
    document.querySelectorAll('.ed-doc-expert').forEach((node) => node.remove());
    const expert = activeExpert(current);
    if (!expert) return;
    const host = $('[data-ed-doc]')!;
    // Bez wskazanego slotu cytat idzie na koniec TREŚCI, nie do bloku FAQ –
    // odpowiedź FAQ ma zostać zwięzła i samodzielna (cytuje ją wyszukiwarka).
    // Bez sekcji Źródeł – cytat na końcu TREŚCI nie może wylądować w bibliografii.
    const contentSections = [...host.querySelectorAll('.ed-doc-section:not(.ed-doc-faq):not(.ed-doc-intro)')]
      .filter((node) => !isSourcesNode(node));
    const target = expert.slot
      ? host.querySelector(`.ed-doc-section[data-slot="${expert.slot}"]:not(.ed-doc-faq)`)
      : contentSections.at(-1);
    if (!target) return;
    const block = document.createElement('div');
    block.className = 'prose ed-doc-expert';
    sanitizeInto(block, expertBlockquote(expert));
    target.append(block);
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

  async function decideStyle(slot: number, decision: 'accepted' | 'rejected' | null) {
    // Po zatwierdzeniu korekty sekcja pokazuje docelowy tekst: diff pipeline'u
    // liczony jest względem oryginału i o poprawce redaktorskiej nie wie.
    if (decision === 'accepted') sectionMode.set(slot, 'after');
    await callStyle(`/api/cw/jobs/${job!.id}/style/${slot}`, {
      method: 'PATCH',
      body: JSON.stringify({ decision }),
    });
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

  /** Propozycja korekty wpięta w sekcję dokumentu: uwagi, diff słowny i decyzja. */
  function styleBlock(row: StyleRow) {
    const wrap = document.createElement('div');
    wrap.className = 'ed-style-prop';
    wrap.dataset.decision = row.decision ?? '';

    const head = document.createElement('div');
    head.className = 'ed-style-prop-head';
    const label = document.createElement('span');
    label.className = 'ed-style-prop-label';
    label.textContent = row.decision === 'accepted'
      ? 'korekta redaktorska · zastosowana'
      : (row.decision === 'rejected' ? 'korekta redaktorska · odrzucona' : 'korekta redaktorska');
    head.append(label);
    for (const warning of row.warnings ?? []) {
      const tag = document.createElement('span');
      tag.className = 'ed-sec-tag warn';
      tag.textContent = warning.label;
      head.append(tag);
    }
    const spacer = document.createElement('span');
    spacer.className = 'ed-sec-spacer';
    head.append(spacer);

    const action = (label: string, decision: 'accepted' | 'rejected' | null, className: string) => {
      const node = document.createElement('button');
      node.type = 'button';
      node.className = `ed-style-btn ${className}`;
      node.textContent = label;
      node.addEventListener('click', () => decideStyle(row.slot, decision));
      return node;
    };
    if (row.decision === 'accepted') head.append(action('cofnij', null, 'undo'));
    else if (row.decision === 'rejected') head.append(action('przywróć propozycję', null, 'undo'));
    else head.append(action('✓ zastosuj', 'accepted', 'ok'), action('✕ odrzuć', 'rejected', 'no'));
    wrap.append(head);

    if (row.title_after && row.title_after !== row.title_before) {
      const title = document.createElement('p');
      title.className = 'ed-style-titlediff';
      const del = document.createElement('del');
      del.textContent = row.title_before ?? '';
      const ins = document.createElement('ins');
      ins.textContent = row.title_after;
      title.append('nagłówek: ', del, ' ', ins);
      wrap.append(title);
    }

    if (row.issues?.length) {
      const list = document.createElement('ul');
      list.className = 'ed-style-issues';
      for (const issue of row.issues) {
        const item = document.createElement('li');
        item.textContent = issue;
        list.append(item);
      }
      wrap.append(list);
    }

    // Zatwierdzona korekta jest już treścią sekcji – diff zostaje zwinięty,
    // żeby dokument nie zamienił się w ścianę przekreśleń.
    const details = document.createElement('details');
    details.open = !row.decision;
    const summary = document.createElement('summary');
    summary.textContent = 'co się zmienia w treści';
    details.append(summary, renderOpcodes(wordDiff(row.text_before, row.text_after)));
    wrap.append(details);
    return wrap;
  }

  function applyStyleToDoc(current: Job) {
    document.querySelectorAll('.ed-style-prop').forEach((node) => node.remove());
    const host = $('[data-ed-doc]');
    if (!host) return;
    for (const row of styleRows(current)) {
      const node = host.querySelector(`.ed-doc-section[data-slot="${row.slot}"]`);
      if (!node) continue;
      const body = node.querySelector('.ed-sec-body, .ed-doc-body');
      const block = styleBlock(row);
      if (body) node.insertBefore(block, body);
      else node.append(block);
    }
  }

  /* ---------- infografika do sekcji ----------
     Cztery kroki po stronie Workera (opis → zlecenie → obraz → wstawienie),
     bo kie.ai oddaje obraz po 30–180 s, czyli po końcu żądania. Tutaj: panel
     w sekcji, który pokazuje stan i prowadzi przez te kroki. */

  type ImageRow = {
    slot: number; status: string; brief: string | null; alt: string | null;
    caption: string | null; image_url: string | null; media_id: number | null;
    media_url: string | null; credits: string | null; error: string | null;
  };

  const imageRows = new Map<number, ImageRow>();
  const imageBusy = new Set<number>();
  const imagePollTimers = new Map<number, number>();

  const canIllustrate = () => job?.status === 'done';

  function imageHost(slot: number, create = false) {
    const section = $(`[data-ed-doc] .ed-doc-section[data-slot="${slot}"]`);
    if (!section) return null;
    let host = section.querySelector<HTMLElement>('.ed-img');
    if (!host && create) {
      host = document.createElement('div');
      host.className = 'ed-img';
      const tools = section.querySelector('.ed-sec-tools');
      if (tools) tools.after(host);
      else section.append(host);
    }
    return host;
  }

  async function imageCall(slot: number, body: any) {
    if (imageBusy.has(slot)) return;
    imageBusy.add(slot);
    renderImagePanel(slot);
    try {
      const data = await api(`/api/cw/jobs/${job!.id}/infographic/${slot}`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      imageBusy.delete(slot);
      if (data.image) imageRows.set(slot, data.image);
      else imageRows.delete(slot);
      // Wstawienie i usunięcie zmieniają treść sekcji w bazie – dokument musi
      // zobaczyć nowy stan, inaczej obrazek pojawiłby się dopiero po F5.
      if (body.step === 'insert' || body.step === 'drop') {
        const fresh = await api(`/api/cw/jobs/${job!.id}`);
        render(fresh.job);
        return;
      }
      renderImagePanel(slot);
      if (imageRows.get(slot)?.status === 'generating') scheduleImagePoll(slot);
    } catch (error) {
      imageBusy.delete(slot);
      const row = imageRows.get(slot);
      if (row) row.error = error instanceof Error ? error.message : 'Nie udało się wykonać kroku.';
      renderImagePanel(slot, error instanceof Error ? error.message : 'Nie udało się wykonać kroku.');
    }
  }

  /** Odpytywanie kie.ai przez Workera – obraz liczy się do trzech minut. */
  function scheduleImagePoll(slot: number, attempt = 0) {
    window.clearTimeout(imagePollTimers.get(slot));
    if (attempt > 30) return;
    imagePollTimers.set(slot, window.setTimeout(async () => {
      if (document.hidden) return scheduleImagePoll(slot, attempt);
      try {
        const data = await api(`/api/cw/jobs/${job!.id}/infographic/${slot}`);
        if (data.image) imageRows.set(slot, data.image);
        renderImagePanel(slot);
        if (data.image?.status === 'generating') scheduleImagePoll(slot, attempt + 1);
      } catch {
        scheduleImagePoll(slot, attempt + 1);
      }
    }, 8000));
  }

  function renderImagePanel(slot: number, error: string | null = null) {
    const host = imageHost(slot, true);
    if (!host) return;
    host.replaceChildren();
    const row = imageRows.get(slot);

    const head = document.createElement('div');
    head.className = 'ed-img-head';
    const label = document.createElement('span');
    label.className = 'ed-img-label';
    label.textContent = 'infografika';
    head.append(label);
    const spacer = document.createElement('span');
    spacer.className = 'ed-sec-spacer';
    head.append(spacer);

    const button = (text: string, onClick: () => void, className = '') => {
      const node = document.createElement('button');
      node.type = 'button';
      node.className = `ed-style-btn ${className}`.trim();
      node.textContent = text;
      node.addEventListener('click', onClick);
      return node;
    };
    const close = button('zwiń', () => host.remove());

    if (imageBusy.has(slot)) {
      const wait = document.createElement('span');
      wait.className = 'ed-expert-wait';
      wait.textContent = 'pracuję…';
      head.append(wait);
      host.append(head);
      return;
    }

    if (!row) {
      head.append(button('zaproponuj opis grafiki', () => imageCall(slot, { step: 'brief' }), 'ok'), close);
      const note = document.createElement('p');
      note.className = 'ed-style-note';
      note.textContent = 'Model przeczyta tę sekcję i zaproponuje treść grafiki. '
        + 'Styl (paleta ICEA, format 16:9, polskie etykiety) jest stały i nie podlega edycji.';
      host.append(head, note);
      return;
    }

    if (row.status === 'inserted') {
      head.append(button('usuń z sekcji', () => imageCall(slot, { step: 'drop' })), close);
      const note = document.createElement('p');
      note.className = 'ed-style-note';
      note.textContent = `Grafika stoi na końcu sekcji i jest w bibliotece mediów (ID ${row.media_id ?? '?'}). `
        + 'Usunięcie zdejmuje ją z treści, plik w bibliotece zostaje.';
      host.append(head, note);
      return;
    }

    if (row.status === 'generating') {
      const wait = document.createElement('span');
      wait.className = 'ed-expert-wait';
      wait.textContent = 'obraz się generuje… (do trzech minut)';
      head.append(wait, close);
      host.append(head);
      scheduleImagePoll(slot);
      return;
    }

    if (row.status === 'ready' && row.image_url) {
      head.append(
        button('wstaw do sekcji', () => imageCall(slot, { step: 'insert' }), 'ok'),
        button('generuj ponownie', () => imageCall(slot, {
          step: 'generate', brief: row.brief, alt: row.alt, caption: row.caption,
        })),
        close,
      );
      const preview = document.createElement('img');
      preview.className = 'ed-img-preview';
      preview.src = row.image_url;
      preview.alt = row.alt ?? '';
      preview.loading = 'lazy';
      const note = document.createElement('p');
      note.className = 'ed-style-note';
      note.textContent = [
        row.caption ? `Podpis: ${row.caption}` : null,
        row.credits ? `kredyty kie.ai: ${row.credits}` : null,
        'Adres z kie.ai jest tymczasowy – „wstaw do sekcji" wgrywa plik do biblioteki mediów.',
      ].filter(Boolean).join(' · ');
      host.append(head, preview, note);
      return;
    }

    // status 'brief' albo 'failed' – opis do edycji i przycisk generowania.
    head.append(close);
    const form = document.createElement('div');
    form.className = 'ed-img-form';
    const brief = document.createElement('textarea');
    brief.className = 'ed-img-brief';
    brief.rows = 6;
    brief.value = row.brief ?? '';
    brief.spellcheck = false;
    const alt = document.createElement('input');
    alt.type = 'text';
    alt.placeholder = 'tekst alternatywny (alt)';
    alt.maxLength = 300;
    alt.value = row.alt ?? '';
    const caption = document.createElement('input');
    caption.type = 'text';
    caption.placeholder = 'podpis pod grafiką';
    caption.maxLength = 300;
    caption.value = row.caption ?? '';
    const run = button('wygeneruj obraz', () => imageCall(slot, {
      step: 'generate', brief: brief.value, alt: alt.value, caption: caption.value,
    }), 'ok');
    form.append(brief, alt, caption, run);

    const note = document.createElement('p');
    note.className = 'ed-style-note';
    note.textContent = 'Opis po angielsku, etykiety na grafice po polsku – model graficzny '
      + 'psuje napisy dłuższe niż cztery słowa.';
    host.append(head, form, note);
    if (error || row.error) {
      const err = document.createElement('p');
      err.className = 'ed-error';
      err.textContent = error ?? row.error ?? '';
      host.append(err);
    }
  }

  /** Przycisk otwierający panel – w sekcjach z propozycją i bez niej. */
  function infographicButton(slot: number) {
    const node = document.createElement('button');
    node.type = 'button';
    node.className = 'ed-img-open';
    node.textContent = 'infografika';
    node.title = 'Wygeneruj infografikę do tej sekcji';
    node.hidden = !canIllustrate();
    node.addEventListener('click', () => {
      const host = imageHost(slot);
      if (host) host.remove();
      else renderImagePanel(slot);
    });
    return node;
  }

  function applyImagesToDoc(current: Job) {
    imageRows.clear();
    for (const row of (current.images ?? []) as ImageRow[]) imageRows.set(row.slot, row);
    document.querySelectorAll('.ed-img').forEach((node) => node.remove());
    document.querySelectorAll<HTMLButtonElement>('.ed-img-open')
      .forEach((node) => { node.hidden = !canIllustrate(); });
    for (const slot of imageRows.keys()) renderImagePanel(slot);
  }

  /* ---------- uniwersalne CTA w sekcji ----------
     Gotowa wstawka bez modelu (cw-cta.js) – wstaw/zdejmij na końcu sekcji,
     tą samą ścieżką co infografika. Obecność wynika z samej treści: kotwica
     #cw-cta w adresie przycisku przeżywa obie sanityzacje. */

  const CTA_MARKERS = ['kontakt/#cw-cta', 'mailto:biuro@grupa-icea.pl']; // bieżący + epizod 1.1.0
  /* Świadomy duplikat szablonu z cw-cta.js (ctaHtml) – podgląd w panelu ma
     wyglądać jak blok na stronie, a sanitizeInto zdejmuje style inline. */
  const CTA_PREVIEW = '<div style="margin:28px 0;padding:26px 28px;background:#000623;border-radius:12px">'
    + '<p style="margin:0 0 6px;color:#ffffff;font-size:19px;font-weight:700;line-height:1.4">Chcesz, żeby klienci znajdowali Twoją firmę w Google i w wyszukiwarkach AI?</p>'
    + '<p style="margin:0 0 18px;color:#c7cbe0;font-size:15px;line-height:1.6">Przeanalizujemy Twoją stronę i pokażemy, co blokuje jej widoczność. Konsultacja jest bezpłatna i niezobowiązująca.</p>'
    + '<a href="https://www.grupa-icea.pl/kontakt/#cw-cta"><span style="display:inline-block;padding:12px 26px;background:#5768ff;color:#ffffff;border-radius:8px;font-weight:700;font-size:15px">Umów bezpłatną konsultację</span></a>'
    + '</div>';

  const ctaBusy = new Set<number>();

  function sectionHasCta(slot: number) {
    const body = $(`[data-ed-doc] .ed-doc-section[data-slot="${slot}"] .ed-doc-body`);
    return Boolean(body && CTA_MARKERS.some((marker) => body.innerHTML.includes(marker)));
  }

  function ctaHost(slot: number, create = false) {
    const section = $(`[data-ed-doc] .ed-doc-section[data-slot="${slot}"]`);
    if (!section) return null;
    let host = section.querySelector<HTMLElement>('.ed-cta');
    if (!host && create) {
      host = document.createElement('div');
      host.className = 'ed-cta';
      const tools = section.querySelector('.ed-sec-tools');
      if (tools) tools.after(host);
      else section.append(host);
    }
    return host;
  }

  async function ctaCall(slot: number, step: 'insert' | 'drop') {
    if (ctaBusy.has(slot)) return;
    ctaBusy.add(slot);
    renderCtaPanel(slot);
    try {
      await api(`/api/cw/jobs/${job!.id}/cta/${slot}`, {
        method: 'POST',
        body: JSON.stringify({ step }),
      });
      ctaBusy.delete(slot);
      // Wstawienie/zdjęcie zmienia treść sekcji w bazie – dokument musi
      // zobaczyć nowy stan (jak przy infografice).
      const fresh = await api(`/api/cw/jobs/${job!.id}`);
      ctaHost(slot)?.remove();
      render(fresh.job);
    } catch (error) {
      ctaBusy.delete(slot);
      renderCtaPanel(slot, error instanceof Error ? error.message : 'Nie udało się wykonać kroku.');
    }
  }

  function renderCtaPanel(slot: number, error: string | null = null) {
    const host = ctaHost(slot, true);
    if (!host) return;
    host.replaceChildren();

    const head = document.createElement('div');
    head.className = 'ed-img-head';
    const label = document.createElement('span');
    label.className = 'ed-img-label';
    label.textContent = 'CTA';
    head.append(label);
    const spacer = document.createElement('span');
    spacer.className = 'ed-sec-spacer';
    head.append(spacer);

    const button = (text: string, onClick: () => void, className = '') => {
      const node = document.createElement('button');
      node.type = 'button';
      node.className = `ed-style-btn ${className}`.trim();
      node.textContent = text;
      node.addEventListener('click', onClick);
      return node;
    };

    if (ctaBusy.has(slot)) {
      const wait = document.createElement('span');
      wait.className = 'ed-expert-wait';
      wait.textContent = 'zapisuję…';
      head.append(wait);
      host.append(head);
      return;
    }

    const inserted = sectionHasCta(slot);
    if (inserted) {
      head.append(button('usuń z sekcji', () => ctaCall(slot, 'drop')), button('zwiń', () => host.remove()));
      const note = document.createElement('p');
      note.className = 'ed-style-note';
      note.textContent = 'Blok CTA stoi na końcu tej sekcji. Usunięcie zdejmuje go z treści.';
      host.append(head, note);
    } else {
      head.append(button('wstaw na koniec sekcji', () => ctaCall(slot, 'insert'), 'ok'),
        button('zwiń', () => host.remove()));
      const preview = document.createElement('div');
      // Szablon jest nasz i statyczny (nie z modelu ani z CMS-u), więc podgląd
      // idzie wprost – sanitizeInto zdjęłaby style i podgląd nic by nie mówił.
      preview.innerHTML = CTA_PREVIEW;
      const note = document.createElement('p');
      note.className = 'ed-style-note';
      note.textContent = 'Gotowa wstawka – ten sam blok na każdej stronie, przycisk prowadzi na /kontakt/.';
      host.append(head, preview, note);
    }
    if (error) {
      const err = document.createElement('p');
      err.className = 'ed-error';
      err.textContent = error;
      host.append(err);
    }
  }

  /** Przycisk otwierający panel CTA – obok przycisku infografiki. */
  function ctaButton(slot: number) {
    const node = document.createElement('button');
    node.type = 'button';
    node.className = 'ed-img-open';
    node.textContent = 'CTA';
    node.title = 'Wstaw blok CTA na koniec tej sekcji';
    node.hidden = !canIllustrate();
    node.addEventListener('click', () => {
      const host = ctaHost(slot);
      if (host) host.remove();
      else renderCtaPanel(slot);
    });
    return node;
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
    const currentId = content?.author_id ?? null;
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
    return picked && picked !== (content?.author_id ?? null) ? { author_id: picked } : {};
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
      if (authorBody.author_id && content) {
        content.author_id = authorBody.author_id;
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

  function render(current: Job) {
    job = current;
    // Panele React (ocena, frazy z wytycznych, zwijanie analiz) czytają zadanie ze wspólnego stanu.
    editorStore.set({ job: current });
    renderProgress(current);
    renderBrief(current);
    applyJobToDoc(current);
    renderExpert(current);
    applyExpertToDoc(current);
    renderStyle(current);
    applyStyleToDoc(current);
    applyImagesToDoc(current);
    renderWpActions(current);
    const running = ['queued', 'dispatching', 'running'].includes(current.status);
    $<HTMLButtonElement>('[data-ed-run]')?.toggleAttribute('disabled', running);
  }


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
      sectionMode.clear();
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

  $('[data-ed-only-changed]')?.addEventListener('change', applyOnlyChangedFilter);

  $('[data-ed-accept-all]')?.addEventListener('click', async () => {
    if (!job?.sections?.length) return;
    const pending = job.sections.filter((section) => !section.decision);
    for (const section of pending) {
      try {
        await api(`/api/cw/jobs/${job.id}/sections/${section.slot}`, {
          method: 'PATCH',
          body: JSON.stringify({ decision: 'accepted' }),
        });
        section.decision = 'accepted';
        section.accepted = true;
      } catch (error) {
        showError(error instanceof Error ? error.message : 'Nie udało się zapisać decyzji.');
        break;
      }
    }
    applyJobToDoc(job);
  });

  /* Wdrożenie do WordPressa jest ręczne, więc „kopiuj zatwierdzone" składa
     wszystkie przyjęte sekcje w jeden blok do wklejenia w CMS-ie. */
  $('[data-ed-copy-all]')?.addEventListener('click', async (event) => {
    if (!job?.sections?.length) return;
    const button = event.currentTarget as HTMLButtonElement;
    const text = job.sections
      .filter((section) => section.decision === 'accepted')
      .map((section) => `<h2>${section.title_after ?? ''}</h2>\n${sectionCopyText(section)}`)
      .join('\n\n');
    await navigator.clipboard.writeText(text);
    button.textContent = 'skopiowano';
    setTimeout(() => (button.textContent = 'kopiuj zatwierdzone'), 1500);
  });

  /* Podgląd całości z eksportem – PreviewDialog.tsx (React); przycisk
     stoi jeszcze w pasku dokumentu. */
  $('[data-ed-preview-open]')?.addEventListener('click', () => editorStore.set({ previewOpen: true }));

  $('[data-ed-brief-details]')?.addEventListener('toggle', (event) => {
    (event.currentTarget as HTMLElement).dataset.touched = '1';
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') { pollDelay = 3000; schedulePoll(); }
  });

  // Katalog wczytał już PostEditor (React) – wpis przychodzi w argumencie.
  loadModels();
  loadContent();
  loadLatestJob();
  loadAuthors();
}
