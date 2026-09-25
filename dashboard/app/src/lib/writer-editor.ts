/* Content Writer – pełnoekranowy edytor gotowego tekstu.
   Lewa część: dokument (H1, wstęp, sekcje H2, FAQ, Źródła) z paskiem narzędzi.
   Prawa: ocena na żywo i frazy z zakresem wystąpień wg czołówki SERP-a.

   Dokument jest złożony z bloków, bo tak leży w bazie: każda sekcja to slot
   ACF (job_sections), wstęp i tytuł to pola projektu. Blok zapisuje się sam
   ~1,5 s po ostatniej zmianie; każda akcja, która czyta treść z bazy (szkic
   WP, styl, CTA, infografika), najpierw woła flush(). */

import { api, esc, fmtDateTime, fmtInt, sleep } from './writer-client';
import { matchTokens, phraseStems, tokens } from './phrase-match.js';

type Any = Record<string, any>;

const CTA_MARKER = 'kontakt/#cw-cta';
const FAQ_BASE = 100;
const SOURCES_SLOT = 200;
const SAVE_DELAY = 1500;
const kindOf = (slot: number) => (slot === SOURCES_SLOT ? 'sources' : slot > FAQ_BASE ? 'faq' : 'section');
const strip = (html: string) => String(html ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const countWords = (text: string) => text.split(/\s+/).filter(Boolean).length;

export interface EditorHost {
  base: string;
  domain: string;
  root: HTMLElement;
  data(): { project: Any; job: Any; authors: Any[]; categories: Any[] };
  /** Wczytuje projekt od nowa i rysuje edytor (render). */
  refresh(): Promise<void>;
  exit(): void;
}

type BlockKind = 'title' | 'lead' | 'head' | 'text';
interface Block {
  key: string;
  kind: BlockKind;
  slot: number | null;
  el: HTMLElement;
  text: string;
  hay: ReturnType<typeof tokens>;
  dirty: boolean;
  timer: number | null;
  saving: Promise<void> | null;
  error: string | null;
}

type TermState = 'none' | 'low' | 'ok' | 'over';

export function createEditor(host: EditorHost) {
  const blocks = new Map<string, Block>();
  let terms: Any[] = [];
  let termsMeta: Any = {};
  let termsLoaded = false;
  let tab: 'frazy' | 'plan' | 'dopracowanie' | 'publikacja' = 'frazy';
  let termFilter: 'all' | 'todo' | 'over' = 'all';
  let activeTerm: string | null = null;
  let activeHit = -1;
  let lastSaved: string | null = null;
  let lastFocus: Block | null = null;
  let recountTimer: number | null = null;
  let savedRange: Range | null = null;
  let drawerOpen = false;

  const q = <T extends HTMLElement = HTMLElement>(selector: string) => host.root.querySelector<T>(selector);

  /* ---------- tekst bloku z pozycjami (liczenie fraz i podświetlenia) ---------- */

  /** Węzły tekstowe jako jeden ciąg; między blokami (akapity, punkty) spacja,
      żeby koniec jednego akapitu nie sklejał się z początkiem następnego. */
  function textMap(root: Element) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const parts: { node: Text; start: number }[] = [];
    let text = '';
    let lastBlock: Element | null = null;
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const block = (node.parentElement?.closest('p, li, h2, h3, h4, blockquote, td, th, div') ?? root) as Element;
      if (lastBlock && block !== lastBlock) text += ' ';
      lastBlock = block;
      parts.push({ node: node as Text, start: text.length });
      text += node.textContent ?? '';
    }
    return { text, parts };
  }

  function retoken(block: Block) {
    block.text = textMap(block.el).text;
    block.hay = tokens(block.text);
  }

  /* ---------- zapis ---------- */

  function payloadOf(block: Block): { path: string; body: Any } {
    const job = host.data().job;
    if (block.kind === 'title') return { path: host.base, body: { title: block.el.textContent?.replace(/\s+/g, ' ').trim() ?? '' } };
    if (block.kind === 'lead') return { path: host.base, body: { lead: block.el.innerHTML } };
    const path = `/api/cw/jobs/${job.id}/sections/${block.slot}`;
    if (block.kind === 'head') return { path, body: { title_after: block.el.textContent?.replace(/\s+/g, ' ').trim() ?? '' } };
    return { path, body: { text_after: block.el.innerHTML } };
  }

  async function save(block: Block): Promise<void> {
    if (block.timer) { clearTimeout(block.timer); block.timer = null; }
    if (block.saving) await block.saving;
    if (!block.dirty) return;
    block.dirty = false;
    const { path, body } = payloadOf(block);
    const { project, job } = host.data();
    block.saving = api<Any>(path, { method: 'PATCH', body })
      .then(({ data }) => {
        block.error = null;
        lastSaved = new Date().toISOString();
        // Stan lokalny = to, co leży w bazie (po sanitizacji serwera). Na nim
        // opiera się rozpoznanie nieaktualnych propozycji stylu.
        if (block.kind === 'title') project.title = body.title;
        if (block.kind === 'lead') { Object.assign(project, data.project ?? {}); }
        const row = (job.sections ?? []).find((item: Any) => item.slot === block.slot);
        if (row && block.kind === 'head') row.title_after = data.title_after ?? body.title_after;
        if (row && block.kind === 'text') row.text_after = data.text_after ?? body.text_after;
      })
      .catch((error: Error) => {
        block.dirty = true;
        block.error = error.message;
      })
      .finally(() => {
        block.saving = null;
        paintSaveState();
        if (block.kind === 'text' && tab === 'dopracowanie') paintPane();
      });
    paintSaveState();
    await block.saving;
  }

  /** Zapisuje wszystko, co czeka; rzuca, gdy któryś blok się nie zapisał. */
  async function flush() {
    await Promise.all([...blocks.values()].filter((block) => block.dirty || block.saving).map(save));
    const failed = [...blocks.values()].find((block) => block.error);
    if (failed) throw new Error(`Nie zapisałem zmian: ${failed.error}`);
  }

  const pending = () => [...blocks.values()].some((block) => block.dirty || block.saving);

  function paintSaveState() {
    const box = q('#we-save');
    if (!box) return;
    const failed = [...blocks.values()].find((block) => block.error);
    const saving = [...blocks.values()].some((block) => block.saving);
    const dirty = [...blocks.values()].some((block) => block.dirty);
    box.className = `we-save ${failed ? 'err' : saving || dirty ? 'busy' : 'ok'}`;
    box.textContent = failed
      ? `Nie zapisano – ${failed.error}`
      : saving ? 'Zapisuję…' : dirty ? 'Zmiany czekają na zapis' : lastSaved ? `Zapisano ${fmtDateTime(lastSaved)}` : 'Wszystko zapisane';
    if (failed) {
      box.setAttribute('role', 'button');
      box.tabIndex = 0;
    }
  }

  function onInput(block: Block) {
    block.dirty = true;
    block.error = null;
    if (block.timer) clearTimeout(block.timer);
    block.timer = window.setTimeout(() => { save(block); }, SAVE_DELAY);
    paintSaveState();
    if (recountTimer) clearTimeout(recountTimer);
    recountTimer = window.setTimeout(() => {
      retoken(block);
      paintScore();
      if (tab === 'frazy' || tab === 'plan') paintPane();
      if (activeTerm) highlight(activeTerm, false);
    }, 300);
  }

  window.addEventListener('beforeunload', (event) => {
    if (pending()) { event.preventDefault(); event.returnValue = ''; }
  });

  /* ---------- frazy i ocena ---------- */

  async function loadTerms() {
    try {
      const { data } = await api<Any>(`${host.base}/terms`);
      termsMeta = data;
      terms = (data.terms ?? []).map((row: Any) => ({ ...row, stems: phraseStems(row.keyword) }));
    } catch {
      terms = [];
    }
    termsLoaded = true;
  }

  const counted = () => [...blocks.values()];

  function termCount(term: Any, pool = counted()) {
    return pool.reduce((sum, block) => sum + matchTokens(block.hay, term.stems).length, 0);
  }

  /** Zakres frazy głównej bez danych konkurencji: ~1 raz na 250 słów. */
  function rangeOf(term: Any) {
    if (term.group === 'main' && term.rivals_using === null) {
      const target = Number(termsMeta.target_words) || 1200;
      return { min: 2, max: Math.max(3, Math.round(target / 250)) };
    }
    return { min: term.min ?? 1, max: term.max ?? 2 };
  }

  function stateOf(count: number, range: { min: number; max: number }): TermState {
    if (!count) return 'none';
    if (count < range.min) return 'low';
    if (count > range.max) return 'over';
    return 'ok';
  }

  function totalWords() {
    return counted().filter((block) => block.kind === 'lead' || block.kind === 'text')
      .reduce((sum, block) => sum + countWords(block.text), 0);
  }

  function targetWords() {
    const { project, job } = host.data();
    const write = (job.steps ?? []).find((step: Any) => step.step === 'write')?.payload ?? {};
    return Number(project.brief?.target_words) || Number(write.target_words) || Number(termsMeta.target_words) || null;
  }

  /** Ocena 0–100: frazy 50, długość 25, nagłówki 20, tytuł 5. Frazy tylko
      z briefu i główna – luka SERP-a to podpowiedź, nie norma. */
  function score() {
    const scored = terms.filter((term) => term.group !== 'gap');
    let weight = 0;
    let got = 0;
    for (const term of scored) {
      const range = rangeOf(term);
      const count = termCount(term);
      const w = term.group === 'main' ? 3 : 1;
      const value = count >= range.min && count <= range.max ? 1
        : count < range.min ? count / range.min
        : Math.max(0.5, 1 - ((count - range.max) / Math.max(range.max, 1)) * 0.5);
      weight += w;
      got += w * value;
    }
    const termsPart = weight ? got / weight : 0;

    const main = terms.find((term) => term.group === 'main');
    const heads = counted().filter((block) => block.kind === 'head');
    const outline = (host.data().project.brief?.outline ?? []) as Any[];
    const mainInHead = main ? heads.some((block) => matchTokens(block.hay, main.stems).length > 0) : false;
    const headCount = outline.length ? Math.min(1, heads.length / outline.length) : heads.length ? 1 : 0;
    const headsPart = (mainInHead ? 0.6 : 0) + 0.4 * headCount;

    const title = blocks.get('title');
    const titleText = title?.text.trim() ?? '';
    const titleHas = main && title ? matchTokens(title.hay, main.stems).length > 0 : false;
    const titleLen = titleText.length >= 30 && titleText.length <= 70 ? 1 : titleText.length ? 0.5 : 0;
    const titlePart = (titleHas ? 0.7 : 0) + 0.3 * titleLen;

    const words = totalWords();
    const target = targetWords();
    const ratio = target ? words / target : words >= 800 ? 1 : words / 800;
    const lengthPart = ratio >= 0.9 && ratio <= 1.25 ? 1
      : ratio < 0.9 ? Math.max(0, ratio / 0.9)
      : Math.max(0.6, 1 - (ratio - 1.25));

    const parts = { terms: termsPart, length: lengthPart, heads: headsPart, title: titlePart };
    const total = Math.round(50 * termsPart + 25 * lengthPart + 20 * headsPart + 5 * titlePart);
    return { total, parts, words, target, mainInHead, titleHas };
  }

  /** Łuk z 41 kresek – przyrząd, nie wykres; zapalone kreski = ocena. */
  function gauge(total: number) {
    const ticks = 41;
    const lit = Math.round((total / 100) * ticks);
    const lines: string[] = [];
    for (let i = 0; i < ticks; i++) {
      const angle = (-120 + (240 * i) / (ticks - 1)) * (Math.PI / 180);
      const long = i % 10 === 0;
      const r1 = long ? 58 : 61;
      const r2 = 70;
      const x1 = 80 + r1 * Math.sin(angle);
      const y1 = 80 - r1 * Math.cos(angle);
      const x2 = 80 + r2 * Math.sin(angle);
      const y2 = 80 - r2 * Math.cos(angle);
      lines.push(`<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" class="${i < lit ? 'on' : ''}" />`);
    }
    return `<svg viewBox="0 0 160 124" class="we-gauge-svg" aria-hidden="true">${lines.join('')}</svg>`;
  }

  function paintScore() {
    const box = q('#we-score');
    if (!box) return;
    const result = score();
    const tone = result.total >= 75 ? 'ok' : result.total >= 50 ? 'mid' : 'low';
    const bar = (label: string, value: number, hint: string) => `
      <div class="we-part">
        <div class="we-part-head"><span>${label}</span><span class="v">${Math.round(value * 100)}%</span></div>
        <div class="we-part-bar"><span style="width:${Math.round(value * 100)}%"></span></div>
        <div class="we-part-hint">${hint}</div>
      </div>`;
    box.innerHTML = `
      <div class="we-gauge ${tone}">
        ${gauge(result.total)}
        <div class="we-gauge-num"><strong>${result.total}</strong><span>ocena treści</span></div>
      </div>
      <div class="we-parts">
        ${bar('Frazy', result.parts.terms, termsLoaded ? `${terms.filter((t) => t.group !== 'gap' && stateOf(termCount(t), rangeOf(t)) === 'ok').length} z ${terms.filter((t) => t.group !== 'gap').length} w normie` : 'wczytuję…')}
        ${bar('Długość', result.parts.length, `${fmtInt(result.words)} słów${result.target ? ` z ${fmtInt(result.target)}` : ''}`)}
        ${bar('Nagłówki', result.parts.heads, result.mainInHead ? 'fraza główna jest w śródtytule' : 'fraza główna nie pada w żadnym H2')}
        ${bar('Tytuł', result.parts.title, result.titleHas ? 'tytuł zawiera frazę główną' : 'tytuł bez frazy głównej')}
      </div>`;
    const mini = q('#we-drawer-toggle strong');
    if (mini) mini.textContent = String(result.total);
    const words = q('#we-words');
    if (words) words.textContent = `${fmtInt(result.words)} słów`;
  }

  /* ---------- podświetlanie wystąpień ---------- */

  const highlightApi = () => (typeof CSS !== 'undefined' && 'highlights' in CSS ? (CSS as any).highlights as Map<string, unknown> : null);

  function termRanges(term: Any) {
    const ranges: Range[] = [];
    for (const block of counted()) {
      const map = textMap(block.el);
      const hay = tokens(map.text);
      for (const hit of matchTokens(hay, term.stems)) {
        const range = document.createRange();
        // Początek: ostatni węzeł zaczynający się przed pozycją lub na niej;
        // koniec: ostatni zaczynający się PRZED nią (koniec słowa na granicy węzłów).
        const at = (offset: number, end: boolean) => {
          let part = map.parts[0];
          for (const item of map.parts) {
            if (end ? item.start < offset : item.start <= offset) part = item;
            else break;
          }
          return { node: part.node, offset: Math.min(Math.max(0, offset - part.start), part.node.length) };
        };
        const start = at(hit.start, false);
        const end = at(hit.end, true);
        range.setStart(start.node, start.offset);
        range.setEnd(end.node, end.offset);
        ranges.push(range);
      }
    }
    return ranges;
  }

  function highlight(keyword: string | null, jump: boolean) {
    const registry = highlightApi();
    try {
      registry?.delete('we-term');
      registry?.delete('we-term-now');
      if (!keyword) return;
      const term = terms.find((row) => row.keyword === keyword);
      if (!term) return;
      const ranges = termRanges(term);
      if (!ranges.length) return;
      if (jump) activeHit = (activeHit + 1) % ranges.length;
      const current = ranges[Math.min(Math.max(activeHit, 0), ranges.length - 1)];
      const Ctor = (window as any).Highlight;
      if (registry && Ctor) {
        registry.set('we-term', new Ctor(...ranges));
        registry.set('we-term-now', new Ctor(current));
      }
      if (jump) {
        const scroller = q('.we-scroll')!;
        const rect = current.getBoundingClientRect();
        const box = scroller.getBoundingClientRect();
        scroller.scrollBy({ top: rect.top - box.top - box.height / 3, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      }
    } catch {
      // Drzewo DOM zmieniło się pod nami w trakcie pisania – następne
      // przeliczenie (po 300 ms) narysuje podświetlenie od nowa.
    }
  }

  /* ---------- zakładki panelu ---------- */

  function paneTerms() {
    if (!termsLoaded) return '<p class="we-empty">Wczytuję frazy…</p>';
    if (!terms.length) return '<p class="we-empty">Brief nie wskazał fraz, a analiza wyników wyszukiwania nie była uruchamiana.</p>';
    const rows = terms.map((term) => {
      const range = rangeOf(term);
      const count = termCount(term);
      return { term, range, count, state: stateOf(count, range) };
    });
    const visible = rows.filter((row) => termFilter === 'all'
      || (termFilter === 'todo' && (row.state === 'none' || row.state === 'low'))
      || (termFilter === 'over' && row.state === 'over'));
    const todo = rows.filter((row) => row.state === 'none' || row.state === 'low').length;
    const over = rows.filter((row) => row.state === 'over').length;
    const groups: [string, string, string][] = [
      ['main', 'Fraza główna', ''],
      ['brief', 'Z briefu', 'wchodzą do oceny'],
      ['gap', 'Luka w wynikach wyszukiwania', 'podpowiedzi spoza briefu, bez wpływu na ocenę'],
    ];
    const source = termsMeta.rivals
      ? `Zakres = typowa liczba wystąpień u ${termsMeta.rivals} konkurentów, przeliczona na długość tego tekstu.`
      : 'Bez pobranych treści konkurentów – zakresy są orientacyjne. Pobierz je w widoku „Research i brief”.';
    return `
      <div class="we-filter" role="group" aria-label="Filtr fraz">
        <button type="button" data-filter="all" class="${termFilter === 'all' ? 'on' : ''}">Wszystkie ${rows.length}</button>
        <button type="button" data-filter="todo" class="${termFilter === 'todo' ? 'on' : ''}">Do dopisania ${todo}</button>
        <button type="button" data-filter="over" class="${termFilter === 'over' ? 'on' : ''}">Za często ${over}</button>
      </div>
      ${groups.map(([group, label, note]) => {
        const list = visible.filter((row) => row.term.group === group);
        if (!list.length) return '';
        return `<div class="we-group">
          <div class="we-group-head"><span>${label}</span>${note ? `<small>${note}</small>` : ''}</div>
          <div class="we-chips">${list.map(({ term, range, count, state }) => {
            const title = [
              term.where ? `Sekcja: ${term.where}` : '',
              term.volume ? `${fmtInt(term.volume)} wyszukiwań/mies.` : '',
              term.rivals_using !== null && term.rivals_using !== undefined ? `używa ${term.rivals_using} z ${termsMeta.rivals} konkurentów` : '',
              'Kliknij, żeby pokazać wystąpienia w tekście',
            ].filter(Boolean).join(' · ');
            return `<button type="button" class="we-chip ${state} ${activeTerm === term.keyword ? 'active' : ''}" data-term="${esc(term.keyword)}" title="${esc(title)}">
              <span class="we-chip-k">${esc(term.keyword)}</span><span class="we-chip-n">${count} / ${range.min === range.max ? range.min : `${range.min}–${range.max}`}</span></button>`;
          }).join('')}</div></div>`;
      }).join('')}
      ${visible.length ? '' : '<p class="we-empty">Nic w tym filtrze.</p>'}
      <p class="we-foot">${source}</p>`;
  }

  function panePlan() {
    const { project, job } = host.data();
    const outline = (project.brief?.outline ?? []) as Any[];
    const sections = ordered(job).filter((row) => kindOf(row.slot) === 'section');
    const faq = ordered(job).filter((row) => kindOf(row.slot) === 'faq');
    const lead = blocks.get('lead');
    const line = (label: string, words: number, target: number | null, anchor: string, muted = false) => {
      const ratio = target ? Math.min(1.5, words / target) : 0;
      const tone = !target ? '' : ratio < 0.7 ? 'low' : ratio > 1.3 ? 'over' : 'ok';
      return `<li><button type="button" class="we-plan-row ${muted ? 'muted' : ''}" data-goto="${esc(anchor)}">
        <span class="t">${esc(label)}</span>
        <span class="w">${fmtInt(words)}${target ? ` / ${fmtInt(target)}` : ''}</span>
        ${target ? `<span class="we-plan-bar ${tone}"><span style="width:${Math.round((ratio / 1.5) * 100)}%"></span><i style="left:${Math.round((1 / 1.5) * 100)}%"></i></span>` : ''}
      </button></li>`;
    };
    return `
      <p class="we-foot">Słowa sekcji wobec planu z briefu. Kreska na pasku to cel.</p>
      <ol class="we-plan">
        ${line('Wstęp', countWords(lead?.text ?? ''), null, 'lead')}
        ${sections.map((row, index) => line(
          blocks.get(`head:${row.slot}`)?.text || row.title_after,
          countWords(blocks.get(`text:${row.slot}`)?.text ?? strip(row.text_after)),
          Number(outline[index]?.words) || null,
          `sec-${row.slot}`,
          row.decision === 'rejected',
        )).join('')}
        ${faq.length ? line(`FAQ – ${faq.length} pytań`, faq.reduce((sum, row) => sum + countWords(blocks.get(`text:${row.slot}`)?.text ?? ''), 0), null, `sec-${faq[0].slot}`) : ''}
      </ol>`;
  }

  function paneRefine() {
    const { project, job, authors } = host.data();
    const expert = job.expert as Any | null;
    const style = job.style as Any | null;
    const write = (job.steps ?? []).find((step: Any) => step.step === 'write')?.payload ?? {};
    const unsupported = (write.unsupported ?? []) as string[];
    const sections = ordered(job);
    const current = new Map(sections.map((row) => [row.slot, row.text_after ?? '']));
    const pendingStyle = ((job.style_sections ?? []) as Any[]).filter((row) => !row.decision);
    const candidates = authors.filter((row) => row.name !== project.author_name);
    const content = sections.filter((row) => kindOf(row.slot) === 'section');
    return `
      ${unsupported.length ? `<div class="we-note warn"><strong>Model nie miał materiału na</strong>
        <ul>${unsupported.map((row) => `<li>${esc(row)}</li>`).join('')}</ul>
        <span>Te miejsca uzupełnij z własnej wiedzy albo zostaw ogólnie.</span></div>` : ''}

      <div class="we-block">
        <h3>Styl i fleksja</h3>
        <p class="we-foot">Jeden przejazd redaktorski na cały tekst: odmiana fraz, powtórzenia, interpunkcja, fakty sprawdzane w sieci.</p>
        <div class="we-row"><button class="wr-btn" type="button" data-act="style">${style?.status === 'done' ? 'Popraw styl ponownie' : 'Popraw styl i fleksję'}</button>
          ${style?.status === 'done' ? `<span class="we-foot">zmienione sekcje: ${fmtInt(style.changed)} z ${fmtInt(style.sections_total)}</span>` : ''}</div>
        ${pendingStyle.map((row) => {
          const stale = current.has(row.slot) && current.get(row.slot) !== (row.text_before ?? '');
          return `<div class="we-diff ${stale ? 'stale' : ''}" data-style-slot="${row.slot}">
            <button type="button" class="we-diff-title" data-goto="sec-${row.slot}">${esc(row.title_after ?? row.title_before ?? `sekcja ${row.slot}`)}</button>
            ${(row.issues ?? []).length ? `<ul>${(row.issues as Any[]).map((issue) => `<li>${esc(typeof issue === 'string' ? issue : issue.note ?? issue.fix ?? JSON.stringify(issue))}</li>`).join('')}</ul>` : ''}
            ${(row.warnings ?? []).length ? `<p class="we-err">${(row.warnings as Any[]).map((w) => esc(typeof w === 'string' ? w : JSON.stringify(w))).join(' · ')}</p>` : ''}
            <del>${esc(strip(row.text_before).slice(0, 260))}</del>
            <ins>${esc(strip(row.text_after).slice(0, 260))}</ins>
            ${stale ? '<p class="we-err">Sekcja zmieniła się po tej propozycji – przyjęcie nadpisałoby Twoje poprawki. Odrzuć ją albo uruchom styl ponownie.</p>' : ''}
            <div class="we-row">
              ${stale ? '' : '<button class="wr-btn small primary" type="button" data-style="accepted">Przyjmij</button>'}
              <button class="wr-btn small" type="button" data-style="rejected">Odrzuć</button>
            </div></div>`;
        }).join('')}
        <p class="wr-msg" data-msg="style">${style?.status === 'failed' ? esc(style.error) : ''}</p>
      </div>

      <div class="we-block">
        <h3>Wypowiedź eksperta</h3>
        ${expert?.status === 'done' ? `<blockquote class="we-quote">„${esc(expert.quote)}”<footer>${esc(expert.expert)}, ${esc(expert.role)}</footer></blockquote>
          <div class="we-row"><button class="wr-btn small danger" type="button" data-act="expert-reject">Odrzuć cytat</button></div>` : ''}
        <label class="wr-label">Ekspert (inna osoba niż autor)
          <select class="wr-select" data-f="expert">${candidates.map((row) => `<option value="${esc(row.name)}">${esc(row.name)}${row.role ? ` – ${esc(row.role)}` : ''}</option>`).join('')}</select></label>
        <label class="wr-label">Sekcja
          <select class="wr-select" data-f="expert-slot">${content.map((row) => `<option value="${row.slot}" ${expert?.slot === row.slot ? 'selected' : ''}>${esc(row.title_after)}</option>`).join('')}</select></label>
        <div class="we-row"><button class="wr-btn" type="button" data-act="expert" ${candidates.length ? '' : 'disabled'}>${expert?.status === 'done' ? 'Wygeneruj inny cytat' : 'Wygeneruj cytat'}</button></div>
        <p class="wr-msg" data-msg="expert">${expert?.status === 'failed' ? esc(expert.error) : ''}</p>
      </div>`;
  }

  function panePublish() {
    const { project, authors, categories } = host.data();
    return `
      <div class="we-block">
        <label class="wr-label">Autor wpisu
          <select class="wr-select" data-f="author"><option value="">– wybierz –</option>
            ${authors.map((row) => `<option value="${row.id}" ${row.id === project.author_id ? 'selected' : ''}>${esc(row.name)}</option>`).join('')}
          </select></label>
        <label class="wr-label">Kategoria
          <select class="wr-select" data-f="category"><option value="">– wybierz –</option>
            ${categories.map((row) => `<option value="${row.id}" ${row.id === project.category_id ? 'selected' : ''}>${esc(row.name)}</option>`).join('')}
          </select></label>
        <p class="we-foot">Tytuł wpisu to nagłówek H1 z dokumentu. Szkic zakładamy w WordPressie od nowa przy każdym zapisie – poprzedni zostaje w koszu.</p>
        <div class="we-row"><button class="wr-btn primary" type="button" data-act="wp">${project.wp_post_id ? 'Zapisz szkic ponownie' : 'Zapisz szkic w WordPressie'}</button></div>
        ${project.wp_draft_url ? `<p class="we-foot">Ostatni zapis ${fmtDateTime(project.wp_saved_at)} · <a href="${esc(project.wp_draft_url)}" target="_blank" rel="noopener">podgląd szkicu</a></p>` : ''}
        <p class="wr-msg" data-msg="wp" role="status"></p>
      </div>`;
  }

  function paintPane() {
    const pane = q('#we-pane');
    if (!pane) return;
    // Nie przerysowuj pod otwartą listą wyboru – zamknęłaby się w pół kliknięcia.
    if (pane.contains(document.activeElement) && document.activeElement?.matches('select, input, textarea')) return;
    pane.innerHTML = tab === 'frazy' ? paneTerms() : tab === 'plan' ? panePlan() : tab === 'dopracowanie' ? paneRefine() : panePublish();
    host.root.querySelectorAll<HTMLElement>('.we-tab').forEach((button) => {
      const on = button.dataset.tab === tab;
      button.classList.toggle('on', on);
      button.setAttribute('aria-selected', String(on));
    });
  }

  /* ---------- akcje ---------- */

  function message(name: string, text: string, tone = '') {
    const box = host.root.querySelector<HTMLElement>(`[data-msg="${name}"]`);
    if (box) { box.className = `wr-msg ${tone}`; box.textContent = text; }
  }

  async function guarded(name: string, button: HTMLButtonElement | null, label: string, run: () => Promise<void>) {
    const original = button?.textContent ?? '';
    if (button) { button.disabled = true; button.textContent = label; }
    try {
      await flush();
      await run();
    } catch (error) {
      await host.refresh().catch(() => {});
      message(name, (error as Error).message, 'err');
      if (button && button.isConnected) { button.disabled = false; button.textContent = original; }
    }
  }

  async function saveDraft(button: HTMLButtonElement | null) {
    const { project } = host.data();
    const authorId = Number.parseInt(q<HTMLSelectElement>('[data-f="author"]')?.value ?? String(project.author_id ?? ''), 10);
    const categoryId = Number.parseInt(q<HTMLSelectElement>('[data-f="category"]')?.value ?? String(project.category_id ?? ''), 10);
    if (!authorId || !categoryId) {
      tab = 'publikacja';
      paintPane();
      openDrawer(true);
      message('wp', 'Wybierz autora i kategorię – bez nich WordPress nie przyjmie szkicu.', 'err');
      return;
    }
    const top = q<HTMLButtonElement>('#we-wp');
    await guarded('wp', button, 'Zapisuję szkic…', async () => {
      if (top) { top.disabled = true; top.textContent = 'Zapisuję szkic…'; }
      await api(host.base, { method: 'PATCH', body: { author_id: authorId, category_id: categoryId } });
      let saved;
      try {
        saved = await api<Any>(`${host.base}/wp-draft`, { method: 'POST', body: {} });
      } catch (error) {
        const err = error as Error & { code?: string };
        if (err.code !== 'edited_in_wp' || !confirm(`${err.message} Zapisać mimo to?`)) throw err;
        saved = await api<Any>(`${host.base}/wp-draft`, { method: 'POST', body: { force: true } });
      }
      tab = 'publikacja';
      await host.refresh();
      message('wp', `Szkic zapisany (ID ${saved.data.draft_id}).`, 'ok');
    });
  }

  async function onPaneClick(event: Event) {
    const target = (event.target as HTMLElement).closest<HTMLElement>('button');
    if (!target) return;
    const { job } = host.data();
    if (target.dataset.filter) { termFilter = target.dataset.filter as typeof termFilter; paintPane(); return; }
    if (target.dataset.term) {
      const keyword = target.dataset.term;
      if (activeTerm !== keyword) { activeTerm = keyword; activeHit = -1; }
      highlight(activeTerm, true);
      paintPane();
      return;
    }
    if (target.dataset.goto) { goTo(target.dataset.goto); return; }
    if (target.dataset.style) {
      const row = target.closest<HTMLElement>('[data-style-slot]')!;
      await guarded('style', target as HTMLButtonElement, 'Zapisuję…', async () => {
        await api(`/api/cw/jobs/${job.id}/style/${row.dataset.styleSlot}`, { method: 'PATCH', body: { decision: target.dataset.style } });
        await host.refresh();
      });
      return;
    }
    const act = target.dataset.act;
    if (act === 'style') {
      await guarded('style', target as HTMLButtonElement, 'Czytam cały tekst – do dwóch minut…', async () => {
        await api(`/api/cw/jobs/${job.id}/style`, { method: 'POST', body: {} });
        await host.refresh();
      });
    } else if (act === 'expert') {
      await guarded('expert', target as HTMLButtonElement, 'Generuję…', async () => {
        await api(`/api/cw/jobs/${job.id}/expert`, {
          method: 'POST',
          body: {
            expert: q<HTMLSelectElement>('[data-f="expert"]')!.value,
            slot: Number.parseInt(q<HTMLSelectElement>('[data-f="expert-slot"]')!.value, 10),
          },
        });
        await host.refresh();
      });
    } else if (act === 'expert-reject') {
      await guarded('expert', target as HTMLButtonElement, 'Odrzucam…', async () => {
        await api(`/api/cw/jobs/${job.id}/expert`, { method: 'PATCH', body: { rejected: true } });
        await host.refresh();
      });
    } else if (act === 'wp') {
      await saveDraft(target as HTMLButtonElement);
    }
  }

  function goTo(anchor: string) {
    const node = host.root.querySelector<HTMLElement>(anchor === 'lead' ? '[data-block="lead"]' : `#we-${anchor}`);
    node?.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    if (window.matchMedia('(max-width: 1099px)').matches) openDrawer(false);
  }

  function openDrawer(open: boolean) {
    drawerOpen = open;
    host.root.classList.toggle('drawer-open', open);
    q('#we-drawer-toggle')?.setAttribute('aria-expanded', String(open));
  }

  /* ---------- sekcje: CTA, pominięcie, infografika ---------- */

  async function sectionAction(section: HTMLElement, action: string) {
    const { job } = host.data();
    const slot = Number(section.dataset.slot);
    if (action === 'image') {
      const panel = section.querySelector<HTMLElement>('[data-image-panel]')!;
      panel.hidden = !panel.hidden;
      if (!panel.hidden) renderImagePanel(panel, slot);
      return;
    }
    try {
      await flush();
      if (action === 'cta-insert' || action === 'cta-drop') {
        await api(`/api/cw/jobs/${job.id}/cta/${slot}`, { method: 'POST', body: { step: action === 'cta-insert' ? 'insert' : 'drop' } });
      } else {
        await api(`/api/cw/jobs/${job.id}/sections/${slot}`, { method: 'PATCH', body: { decision: action === 'restore' ? null : 'rejected' } });
      }
      await host.refresh();
    } catch (error) {
      paintBarError((error as Error).message);
    }
  }

  function paintBarError(text: string) {
    const box = q('#we-save');
    if (box) { box.className = 'we-save err'; box.textContent = text; }
  }

  /** Infografika: opis → obraz (kie.ai, 30–180 s) → biblioteka mediów WP i blok w sekcji. */
  async function renderImagePanel(panel: HTMLElement, slot: number) {
    const { job } = host.data();
    const path = `/api/cw/jobs/${job.id}/infographic/${slot}`;
    const draw = (image: Any | null, note = '') => {
      panel.className = 'we-image';
      if (!image) {
        panel.innerHTML = `<p class="we-foot">Model zaproponuje opis grafiki na podstawie treści sekcji.</p>
          <div class="we-row"><button class="wr-btn small" type="button" data-step="brief">Zaproponuj opis grafiki</button></div>
          <p class="wr-msg">${esc(note)}</p>`;
      } else {
        const editable = ['brief', 'failed'].includes(image.status);
        panel.innerHTML = `
          <label class="wr-label">Opis grafiki<textarea class="wr-textarea" rows="4" data-brief ${editable ? '' : 'disabled'}>${esc(image.brief ?? '')}</textarea></label>
          <label class="wr-label">Tekst alternatywny<input class="wr-input" data-alt value="${esc(image.alt ?? '')}" ${editable ? '' : 'disabled'} /></label>
          <label class="wr-label">Podpis<input class="wr-input" data-caption value="${esc(image.caption ?? '')}" ${editable ? '' : 'disabled'} /></label>
          ${image.image_url && image.status !== 'inserted' ? `<img class="we-image-preview" src="${esc(image.image_url)}" alt="" />` : ''}
          <div class="we-row">
            ${editable ? '<button class="wr-btn small primary" type="button" data-step="generate">Generuj obraz</button>' : ''}
            ${image.status === 'generating' ? '<span class="we-foot">Generuję obraz – to trwa do trzech minut…</span>' : ''}
            ${image.status === 'ready' ? '<button class="wr-btn small primary" type="button" data-step="insert">Wstaw do sekcji</button>' : ''}
            ${image.status === 'inserted' ? '<span class="wr-status ok">w sekcji</span>' : ''}
            <button class="wr-btn small danger" type="button" data-step="drop">Usuń</button>
          </div>
          <p class="wr-msg ${image.error ? 'err' : ''}">${esc(image.error ?? note)}</p>`;
      }
      panel.querySelectorAll<HTMLButtonElement>('[data-step]').forEach((button) => button.addEventListener('click', () => act(button.dataset.step!)));
    };
    const act = async (step: string) => {
      const body: Any = { step };
      if (step === 'generate') {
        body.brief = panel.querySelector<HTMLTextAreaElement>('[data-brief]')?.value ?? '';
        body.alt = panel.querySelector<HTMLInputElement>('[data-alt]')?.value ?? '';
        body.caption = panel.querySelector<HTMLInputElement>('[data-caption]')?.value ?? '';
      }
      panel.querySelectorAll('button').forEach((button) => { button.disabled = true; });
      try {
        await flush();
        const { data } = await api<Any>(path, { method: 'POST', body });
        if (step === 'insert' || step === 'drop') { await host.refresh(); return; }
        draw(data.image ?? null);
        if (data.image?.status === 'generating') poll();
      } catch (error) {
        draw((await api<Any>(path).catch(() => ({ data: { image: null } }))).data.image, (error as Error).message);
      }
    };
    const poll = async () => {
      for (let attempt = 0; attempt < 40; attempt++) {
        await sleep(6000);
        if (panel.hidden || !panel.isConnected) return;
        const { data } = await api<Any>(path);
        if (data.image?.status !== 'generating') { draw(data.image); return; }
      }
    };
    const { data } = await api<Any>(path).catch(() => ({ data: { image: null } }));
    draw(data.image ?? null);
    if (data.image?.status === 'generating') poll();
  }

  /* ---------- pasek narzędzi ---------- */

  const TOOLS: [string, string, string][] = [
    ['bold', 'Pogrubienie (Ctrl+B)', '<b>B</b>'],
    ['italic', 'Kursywa (Ctrl+I)', '<i>I</i>'],
    ['h3', 'Śródtytuł H3', 'H3'],
    ['insertUnorderedList', 'Lista punktowana', '<svg viewBox="0 0 20 20"><circle cx="4" cy="5" r="1.4"/><circle cx="4" cy="10" r="1.4"/><circle cx="4" cy="15" r="1.4"/><path d="M8 5h9M8 10h9M8 15h9"/></svg>'],
    ['insertOrderedList', 'Lista numerowana', '<svg viewBox="0 0 20 20"><path d="M3 3.5h1.5V8M3 8h3M3 12.5c0-1 3-1 3 .3 0 1-3 1.6-3 3.2h3M9 5h8M9 10h8M9 15h8"/></svg>'],
    ['link', 'Wstaw link', '<svg viewBox="0 0 20 20"><path d="M8.5 11.5a3 3 0 0 0 4.2 0l3-3a3 3 0 0 0-4.2-4.2l-1 1M11.5 8.5a3 3 0 0 0-4.2 0l-3 3a3 3 0 0 0 4.2 4.2l1-1"/></svg>'],
    ['unlink', 'Usuń link', '<svg viewBox="0 0 20 20"><path d="M8.5 11.5a3 3 0 0 0 4.2 0l3-3a3 3 0 0 0-4.2-4.2M7.3 8.5l-3 3a3 3 0 0 0 4.2 4.2M3 3l14 14"/></svg>'],
    ['removeFormat', 'Usuń formatowanie', '<svg viewBox="0 0 20 20"><path d="M5 4h10M10 4l-3 12M4 16h6M13 12l4 4M17 12l-4 4"/></svg>'],
    ['undo', 'Cofnij (Ctrl+Z)', '<svg viewBox="0 0 20 20"><path d="M7 5 3 9l4 4M3 9h9a5 5 0 0 1 0 10h-2"/></svg>'],
    ['redo', 'Ponów (Ctrl+Y)', '<svg viewBox="0 0 20 20"><path d="m13 5 4 4-4 4M17 9H8a5 5 0 0 0 0 10h2"/></svg>'],
  ];

  function runTool(tool: string) {
    const block = lastFocus;
    const richText = block && (block.kind === 'text' || block.kind === 'lead');
    if (tool === 'undo' || tool === 'redo') { document.execCommand(tool); return; }
    if (!richText) return;
    block.el.focus();
    if (tool === 'h3') {
      const current = String(document.queryCommandValue('formatBlock')).toLowerCase();
      document.execCommand('formatBlock', false, current === 'h3' ? 'p' : 'h3');
    } else if (tool === 'link') {
      const selection = getSelection();
      if (!selection || selection.isCollapsed) { paintBarError('Zaznacz tekst, który ma być linkiem.'); return; }
      savedRange = selection.getRangeAt(0).cloneRange();
      const form = q<HTMLFormElement>('#we-link')!;
      form.hidden = false;
      form.querySelector<HTMLInputElement>('input')!.value = 'https://';
      form.querySelector<HTMLInputElement>('input')!.focus();
      return;
    } else {
      document.execCommand(tool);
    }
    onInput(block);
  }

  function applyLink(url: string) {
    const form = q<HTMLFormElement>('#we-link')!;
    form.hidden = true;
    const block = lastFocus;
    if (!block || !savedRange || !/^(https?:\/\/|mailto:)\S+$/i.test(url)) { savedRange = null; return; }
    block.el.focus();
    const selection = getSelection()!;
    selection.removeAllRanges();
    selection.addRange(savedRange);
    document.execCommand('createLink', false, url);
    savedRange = null;
    onInput(block);
  }

  /* ---------- dokument ---------- */

  function ordered(job: Any): Any[] {
    const rows = [...((job?.sections ?? []) as Any[])];
    const rank = (slot: number) => (kindOf(slot) === 'section' ? 0 : kindOf(slot) === 'faq' ? 1 : 2);
    return rows.sort((a, b) => rank(a.slot) - rank(b.slot) || a.slot - b.slot);
  }

  function documentHtml(project: Any, job: Any) {
    const expert = job.expert?.status === 'done' ? job.expert : null;
    const images = new Map(((job.images ?? []) as Any[]).map((row) => [row.slot, row]));
    const rows = ordered(job);
    const faqStart = rows.find((row) => kindOf(row.slot) === 'faq')?.slot;
    return `
      <h1 class="we-h1" contenteditable="plaintext-only" spellcheck="true" data-block="title" aria-label="Tytuł artykułu (H1)">${esc(project.title || project.keyword)}</h1>
      <div class="we-text we-lead" contenteditable="true" spellcheck="true" data-block="lead" aria-label="Wstęp">${project.lead ?? ''}</div>
      ${rows.map((row) => {
        const kind = kindOf(row.slot);
        const hasCta = String(row.text_after ?? '').includes(CTA_MARKER);
        const image = images.get(row.slot);
        const rejected = row.decision === 'rejected';
        const tools = kind === 'sources' ? '' : `<div class="we-sec-tools">
            ${kind === 'section' ? `<button type="button" data-sec="image">${image ? 'Infografika' : 'Dodaj infografikę'}</button>
            <button type="button" data-sec="${hasCta ? 'cta-drop' : 'cta-insert'}">${hasCta ? 'Usuń CTA' : 'Wstaw CTA'}</button>` : ''}
            <button type="button" data-sec="${rejected ? 'restore' : 'reject'}">${rejected ? 'Przywróć do szkicu' : 'Pomiń w szkicu'}</button>
          </div>`;
        return `
          ${row.slot === faqStart ? '<div class="we-divider"><span>Najczęstsze pytania</span></div>' : ''}
          ${kind === 'sources' ? '<div class="we-divider"><span>Źródła – lista pod FAQ, bez edycji</span></div>' : ''}
          <section class="we-sec ${kind} ${rejected ? 'rejected' : ''}" id="we-sec-${row.slot}" data-slot="${row.slot}">
            ${tools}
            ${rejected ? '<p class="we-flag">Pominięta – nie trafi do szkicu</p>' : ''}
            ${kind === 'sources' ? '' : `<${kind === 'faq' ? 'h3' : 'h2'} class="we-h" contenteditable="plaintext-only" spellcheck="true" data-block="head">${esc(row.title_after)}</${kind === 'faq' ? 'h3' : 'h2'}>`}
            <div class="we-text" ${kind === 'sources' ? '' : 'contenteditable="true" spellcheck="true"'} data-block="${kind === 'sources' ? 'sources' : 'text'}">${row.text_after ?? ''}</div>
            ${expert && expert.slot === row.slot ? `<blockquote class="we-quote">„${esc(expert.quote)}”<footer>${esc(expert.expert)}, ${esc(expert.role)}</footer></blockquote>` : ''}
            <div data-image-panel hidden></div>
          </section>`;
      }).join('')}`;
  }

  function registerBlocks() {
    blocks.clear();
    const add = (key: string, kind: BlockKind, slot: number | null, el: HTMLElement) => {
      const block: Block = { key, kind, slot, el, text: '', hay: [], dirty: false, timer: null, saving: null, error: null };
      retoken(block);
      blocks.set(key, block);
      el.addEventListener('input', () => onInput(block));
      el.addEventListener('focus', () => { lastFocus = block; paintTools(); });
      el.addEventListener('blur', () => { if (block.dirty) save(block); });
      el.addEventListener('keydown', (event) => onKey(event, block));
      if (kind === 'text' || kind === 'lead') el.addEventListener('paste', onPaste);
    };
    add('title', 'title', null, q('[data-block="title"]')!);
    add('lead', 'lead', null, q('[data-block="lead"]')!);
    host.root.querySelectorAll<HTMLElement>('.we-sec[data-slot]').forEach((section) => {
      const slot = Number(section.dataset.slot);
      const head = section.querySelector<HTMLElement>('[data-block="head"]');
      const text = section.querySelector<HTMLElement>('[data-block="text"]');
      if (head) add(`head:${slot}`, 'head', slot, head);
      if (text) add(`text:${slot}`, 'text', slot, text);
    });
  }

  /** Enter w nagłówku przenosi do treści – nagłówek to jedna linia. */
  function onKey(event: KeyboardEvent, block: Block) {
    if ((block.kind === 'title' || block.kind === 'head') && event.key === 'Enter') {
      event.preventDefault();
      const next = block.kind === 'title' ? blocks.get('lead') : blocks.get(`text:${block.slot}`);
      if (next) {
        next.el.focus();
        const range = document.createRange();
        range.selectNodeContents(next.el);
        range.collapse(true);
        const selection = getSelection()!;
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      flush().catch((error) => paintBarError((error as Error).message));
    }
  }

  /** Wklejanie jako czysty tekst – style z Docs czy Worda i tak zdejmie sanitizer. */
  function onPaste(event: ClipboardEvent) {
    const text = event.clipboardData?.getData('text/plain');
    if (text === undefined) return;
    event.preventDefault();
    document.execCommand('insertText', false, text);
  }

  function paintTools() {
    const rich = lastFocus && (lastFocus.kind === 'text' || lastFocus.kind === 'lead');
    host.root.querySelectorAll<HTMLButtonElement>('[data-tool]').forEach((button) => {
      button.disabled = !rich && !['undo', 'redo'].includes(button.dataset.tool!);
    });
  }

  /* ---------- szkielet ---------- */

  function shell(project: Any) {
    return `
      <header class="we-bar">
        <button type="button" class="we-back" data-exit>Research i brief</button>
        <div class="we-id">
          <strong>${esc(project.keyword)}</strong>
          <span id="we-save" class="we-save ok" aria-live="polite">Wszystko zapisane</span>
        </div>
        <div class="we-bar-actions">
          <button type="button" class="we-drawer-toggle" id="we-drawer-toggle" aria-expanded="false" aria-controls="we-side">Ocena <strong>–</strong></button>
          ${project.wp_draft_url ? `<a class="wr-btn" href="${esc(project.wp_draft_url)}" target="_blank" rel="noopener">Podgląd szkicu</a>` : ''}
          <button type="button" class="wr-btn primary" id="we-wp">${project.wp_post_id ? 'Zapisz szkic ponownie' : 'Zapisz szkic w WordPressie'}</button>
        </div>
      </header>
      <div class="we-body">
        <div class="we-main">
          <div class="we-tools" role="toolbar" aria-label="Formatowanie">
            ${TOOLS.map(([tool, label, icon], index) => `${[2, 5, 8].includes(index) ? '<span class="sep"></span>' : ''}<button type="button" data-tool="${tool}" title="${label}" aria-label="${label}">${icon}</button>`).join('')}
            <form id="we-link" class="we-link" hidden><input type="url" aria-label="Adres linku" /><button type="submit" class="wr-btn small primary">Wstaw</button><button type="button" class="wr-btn small" data-link-cancel>Anuluj</button></form>
            <span class="we-words" id="we-words"></span>
          </div>
          <div class="we-scroll"><article class="we-paper" id="we-paper"></article></div>
        </div>
        <aside class="we-side" id="we-side" aria-label="Ocena i frazy">
          <div class="we-score" id="we-score"></div>
          <div class="we-tabs" role="tablist">
            <button type="button" role="tab" class="we-tab" data-tab="frazy">Frazy</button>
            <button type="button" role="tab" class="we-tab" data-tab="plan">Plan</button>
            <button type="button" role="tab" class="we-tab" data-tab="dopracowanie">Dopracowanie</button>
            <button type="button" role="tab" class="we-tab" data-tab="publikacja">Publikacja</button>
          </div>
          <div class="we-pane" id="we-pane" role="tabpanel"></div>
        </aside>
      </div>`;
  }

  function bindShell() {
    q('[data-exit]')!.addEventListener('click', async () => {
      try { await flush(); } catch (error) { paintBarError((error as Error).message); return; }
      host.exit();
    });
    q('#we-wp')!.addEventListener('click', (event) => saveDraft(event.currentTarget as HTMLButtonElement));
    q('#we-drawer-toggle')!.addEventListener('click', () => openDrawer(!drawerOpen));
    q('#we-save')!.addEventListener('click', () => flush().catch((error) => paintBarError((error as Error).message)));
    const tools = q('.we-tools')!;
    // mousedown bez domyślnej akcji: klik w pasek nie zabiera zaznaczenia z tekstu.
    tools.addEventListener('mousedown', (event) => {
      if ((event.target as HTMLElement).closest('[data-tool]')) event.preventDefault();
    });
    tools.addEventListener('click', (event) => {
      const button = (event.target as HTMLElement).closest<HTMLElement>('[data-tool]');
      if (button) runTool(button.dataset.tool!);
    });
    const link = q<HTMLFormElement>('#we-link')!;
    link.addEventListener('submit', (event) => { event.preventDefault(); applyLink(link.querySelector('input')!.value.trim()); });
    link.querySelector('[data-link-cancel]')!.addEventListener('click', () => { link.hidden = true; savedRange = null; });
    host.root.querySelectorAll<HTMLElement>('.we-tab').forEach((button) => button.addEventListener('click', () => {
      tab = button.dataset.tab as typeof tab;
      paintPane();
    }));
    q('#we-pane')!.addEventListener('click', onPaneClick);
    q('#we-paper')!.addEventListener('click', (event) => {
      const button = (event.target as HTMLElement).closest<HTMLElement>('[data-sec]');
      if (button) sectionAction(button.closest<HTMLElement>('.we-sec')!, button.dataset.sec!);
    });
  }

  let built = false;

  /** Rysuje edytor od nowa (po akcjach, które zmieniają treść w bazie). */
  async function render() {
    const { project, job } = host.data();
    const scroller = q('.we-scroll');
    const scrollTop = scroller?.scrollTop ?? 0;
    if (!built) {
      host.root.innerHTML = shell(project);
      bindShell();
      built = true;
    }
    q('#we-paper')!.innerHTML = documentHtml(project, job);
    registerBlocks();
    lastFocus = null;
    paintTools();
    if (!termsLoaded) await loadTerms();
    paintScore();
    paintPane();
    paintSaveState();
    if (activeTerm) highlight(activeTerm, false);
    const next = q('.we-scroll');
    if (next) next.scrollTop = scrollTop;
  }

  return {
    render,
    flush,
    pending,
    reset() { built = false; termsLoaded = false; },
  };
}
