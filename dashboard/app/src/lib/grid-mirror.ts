/* „Lustro” zwykłej tabeli HTML w AG Grid. Oryginalna <table> zostaje w DOM
   (ukryta) jako model danych, siatka jest jej widokiem:
   - komórki mają HTML oryginalnych <td> (pigułki, paski, przyciski),
   - kliknięcie w siatce trafia do tego samego elementu w oryginale, więc
     skrypty stron (okno szczegółów, szuflada, werdykty) działają bez zmian,
   - zmiany w <tbody> (podmiana wierszy, szuflada, przemalowanie komórek,
     atrybut hidden) odświeżają siatkę,
   - wiersz z jedną komórką na całą szerokość = szuflada poprzedniego wiersza.
   Używają go TableCard (wszystkie zakładki) i Content Writer. */
import { createGrid } from './grid';

type Any = any;

/* Liczba z komórki: data-sort wygrywa (kolumny bez liczb, np. kropki
   „Potencjał”), inaczej parsowanie pl-PL z tekstu. */
const numFrom = (cell: HTMLTableCellElement | undefined): number | null => {
  if (!cell) return null;
  if (cell.dataset.sort !== undefined) {
    const v = parseFloat(cell.dataset.sort);
    return Number.isNaN(v) ? null : v;
  }
  const t = (cell.textContent ?? '').replace(/[\s  ]/g, '').replace(',', '.');
  const m = t.match(/-?\d+(?:\.\d+)?/);
  return m ? parseFloat(m[0]) : null;
};
export const textOf = (el: Element | undefined | null) => (el?.textContent ?? '').replace(/\s+/g, ' ').trim();

/* Nagłówek z kontrolką (np. ⓘ „Jak liczymy potencjał?”) – oryginalny HTML,
   klik poza kontrolką sortuje kolumnę. */
class RichHeader {
  gui!: HTMLElement;
  init(params: Any) {
    const gui = document.createElement('div');
    gui.className = `tc-head${params.numeric ? ' num' : ''}`;
    gui.innerHTML = `<span class="tc-head-label">${params.html}</span><span class="tc-sort" aria-hidden="true"></span>`;
    gui.addEventListener('click', (event) => {
      if ((event.target as HTMLElement).closest('button,a,input,select,summary,[data-no-sort]')) return;
      params.progressSort(event.shiftKey);
    });
    const caret = gui.querySelector<HTMLElement>('.tc-sort')!;
    const paint = () => {
      const sort = params.column.getSort();
      caret.textContent = sort === 'asc' ? '↑' : sort === 'desc' ? '↓' : '';
    };
    params.column.addEventListener('sortChanged', paint);
    paint();
    this.gui = gui;
  }
  getGui() { return this.gui; }
  refresh() { return false; }
}

export type MirrorOptions = {
  /* Klucz zapamiętanego układu kolumn (bez niego układ się nie zapisuje). */
  stateKey?: string;
  /* Wierszy na stronę; 0 = bez paginacji. */
  pageSize?: number;
  /* Dodatkowe opcje AG Grid (np. rowHeight). */
  gridOptions?: Any;
};

export function mirrorTable(table: HTMLTableElement, host: HTMLElement, { stateKey, pageSize = 10, gridOptions = {} }: MirrorOptions = {}) {
  const body = table.tBodies[0];
  if (!body) return null;

  /* Kontener siatki dziedziczy klasy i atrybuty tabeli (np. data-astro-cid),
     żeby style przypięte do tabeli (.data-table .cell-url, .q-table …) działały. */
  host.classList.add('tc-grid', ...Array.from(table.classList));
  for (const attr of Array.from(table.attributes)) {
    if (attr.name.startsWith('data-astro-cid')) host.setAttribute(attr.name, attr.value);
  }

  /* ---------- kolumny z <thead>: ostatni wiersz = kolumny, wcześniejszy = grupy ---------- */
  const headRows = Array.from(table.tHead?.rows ?? []);
  const columnRow = headRows[headRows.length - 1];
  const ths = Array.from(columnRow?.cells ?? []);
  const groupOf: { label: string; cls: string }[] = [];
  if (headRows.length > 1) {
    let index = 0;
    for (const th of Array.from(headRows[0].cells)) {
      for (let k = 0; k < th.colSpan; k += 1) groupOf[index++] = { label: textOf(th), cls: th.className };
    }
  }
  /* Szerokości z danych: kolumna z najdłuższym tekstem (albo td.grow) dostaje
     najwięcej miejsca, pozostałe minimum wg nagłówka i typowej treści. */
  const sample = Array.from(body.rows).filter((tr) => tr.cells.length === ths.length).slice(0, 40);
  const avgLen = ths.map((_, i) => sample.reduce((sum, tr) => sum + textOf(tr.cells[i]).length, 0) / Math.max(1, sample.length));
  const growIndex = (() => {
    // Strona może wskazać kolumnę wprost (<th data-grid-grow>) – np. gdy treść dopisuje skrypt.
    const declared = ths.findIndex((th) => th.hasAttribute('data-grid-grow'));
    if (declared >= 0) return declared;
    const marked = ths.findIndex((_, i) => sample[0]?.cells[i]?.classList.contains('grow'));
    if (marked >= 0) return marked;
    return avgLen.indexOf(Math.max(...avgLen));
  })();
  const columns = ths.map((th, i) => {
    const numeric = th.classList.contains('num');
    const rich = Boolean(th.querySelector('button,a,[popovertarget]'));
    const label = textOf(th);
    const def: Any = {
      colId: `c${i}`,
      headerName: label,
      headerTooltip: th.title || undefined,
      headerClass: numeric ? `${th.className} ag-right-aligned-header` : th.className,
      valueGetter: (p: Any) => {
        const td = p.data?.[`c${i}`];
        if (!td) return null;
        return numeric ? numFrom(td) : textOf(td);
      },
      getQuickFilterText: (p: Any) => textOf(p.data?.[`c${i}`]),
      filter: numeric ? 'agNumberColumnFilter' : 'agTextColumnFilter',
      comparator: numeric ? undefined : (a: string, b: string) => String(a ?? '').localeCompare(String(b ?? ''), 'pl'),
      cellRenderer: (p: Any) => {
        const td = p.data?.[`c${i}`] as HTMLTableCellElement | undefined;
        const wrap = document.createElement('div');
        wrap.className = `tc-c ${td?.className ?? ''}${numeric ? ' tc-num' : ''}`;
        if (td) {
          for (const attr of Array.from(td.attributes)) {
            if (attr.name !== 'class' && attr.name !== 'colspan') wrap.setAttribute(attr.name, attr.value);
          }
          wrap.innerHTML = td.innerHTML;
        }
        return wrap;
      },
      cellClass: numeric ? 'tc-cell tc-cell-num' : 'tc-cell',
      type: numeric ? 'rightAligned' : undefined,
      // Liczby jak w dawnej tabeli: pierwszy klik = od największej.
      sortingOrder: numeric ? ['desc', 'asc', null] : ['asc', 'desc', null],
      flex: i === growIndex ? 3 : 1,
      minWidth: i === growIndex ? 260 : Math.max(96, Math.min(240, Math.max(label.length * 8 + 56, avgLen[i] * 6.5 + 24))),
      // Wysokość wiersza wg treści – komórki bywają wielowierszowe (Content Watcher).
      autoHeight: true,
    };
    if (!label) Object.assign(def, { sortable: false, filter: false, resizable: false, minWidth: 90 });
    // Nadpisania szerokości z nagłówka: <th data-grid-min="360" data-grid-flex="2">.
    if (th.dataset.gridMin) def.minWidth = Number(th.dataset.gridMin);
    if (th.dataset.gridFlex) def.flex = Number(th.dataset.gridFlex);
    if (rich) {
      def.headerComponent = RichHeader;
      def.headerComponentParams = { html: th.innerHTML, numeric };
    }
    return def;
  });
  // Kolejne kolumny z tą samą grupą (Matrix: Senuto / GSC / GA4) → grupa kolumn.
  const columnDefs: Any[] = [];
  columns.forEach((def, i) => {
    const group = groupOf[i];
    if (!group?.label) {
      columnDefs.push(def);
      return;
    }
    const last = columnDefs[columnDefs.length - 1];
    if (last?.children && last.headerName === group.label) last.children.push(def);
    else columnDefs.push({ headerName: group.label, headerClass: `tc-group ${group.cls}`, children: [def] });
  });

  /* ---------- wiersze z <tbody> ---------- */
  const ids = new WeakMap<HTMLTableRowElement, string>();
  let seq = 0;
  const idOf = (tr: HTMLTableRowElement) => {
    let id = ids.get(tr);
    if (!id) {
      id = `r${(seq += 1)}`;
      ids.set(tr, id);
    }
    return id;
  };
  const readRows = () => {
    const rows: Any[] = [];
    let parent: Any = null;
    for (const tr of Array.from(body.rows)) {
      const full = tr.cells.length === 1 && tr.cells[0].colSpan > 1;
      if (full) {
        if (parent) rows.push({ _id: idOf(tr), _tr: tr, _full: true, _parent: parent });
        continue;
      }
      // Nowy obiekt przy każdym odczycie – AG Grid odświeża komórki, gdy strona
      // przemaluje zawartość wiersza (np. rekomendacja w Content Writerze).
      const row: Any = { _id: idOf(tr), _tr: tr };
      Array.from(tr.cells).forEach((td, i) => { row[`c${i}`] = td; });
      rows.push(row);
      parent = row;
    }
    return rows;
  };
  // Sonda z klasą wiersza źródłowego (np. .q-drawer) – style szuflady są do niej przypięte.
  const fullHeight = (td: HTMLTableCellElement) => {
    const probe = document.createElement('div');
    probe.className = `tc-full ${td.parentElement?.className ?? ''}`;
    probe.style.cssText = `position:absolute;visibility:hidden;left:0;top:0;height:auto;width:${host.clientWidth || 800}px`;
    probe.innerHTML = td.innerHTML;
    host.appendChild(probe);
    const height = probe.offsetHeight;
    probe.remove();
    return Math.max(46, height);
  };

  /* Zewnętrzny predykat wierszy (karty TOP 3/10/50, kafle Content Watchera). */
  let rowPredicate: ((row: HTMLTableRowElement) => boolean) | null = null;
  const passes = (tr: HTMLTableRowElement) => !tr.hidden && (!rowPredicate || rowPredicate(tr));

  const { grid, resetLayout, destroy } = createGrid(host, {
    columnDefs,
    rowData: readRows(),
    getRowId: (p: Any) => p.data._id,
    pagination: pageSize > 0,
    paginationPageSize: pageSize > 0 ? pageSize : 25,
    popupParent: document.body,
    isFullWidthRow: (p: Any) => Boolean(p.rowNode.data?._full),
    fullWidthCellRenderer: (p: Any) => {
      const wrap = document.createElement('div');
      wrap.className = 'tc-full';
      wrap.innerHTML = p.data._tr.cells[0].innerHTML;
      return wrap;
    },
    getRowHeight: (p: Any) => (p.data?._full ? fullHeight(p.data._tr.cells[0]) : undefined),
    getRowClass: (p: Any) => (p.data?._tr?.className ? `tc-row ${p.data._tr.className}` : 'tc-row'),
    // Szuflada zawsze tuż pod swoim wierszem, niezależnie od sortowania.
    postSortRows: (params: Any) => {
      const nodes = params.nodes as Any[];
      const drawers = nodes.filter((node) => node.data?._full);
      if (!drawers.length) return;
      const ordered: Any[] = [];
      for (const node of nodes) {
        if (node.data?._full) continue;
        ordered.push(node);
        for (const drawer of drawers) if (drawer.data._parent === node.data) ordered.push(drawer);
      }
      nodes.splice(0, nodes.length, ...ordered);
    },
    // Strona chowa wiersze atrybutem hidden (filtry Content Writera) albo predykatem.
    isExternalFilterPresent: () => true,
    doesExternalFilterPass: (node: Any) => passes(node.data._full ? node.data._parent._tr : node.data._tr),
    ...gridOptions,
  }, stateKey);

  table.closest<HTMLElement>('.table-scroll, .wr-table-wrap')?.setAttribute('hidden', '');
  table.hidden = true;
  host.hidden = false;

  /* Kliknięcie w siatce → ten sam element w oryginalnym wierszu. Linki natywnie. */
  host.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    if (target.closest('a[href],[popovertarget],.ag-header,.ag-paging-panel,.ag-floating-filter')) return;
    const rowEl = target.closest<HTMLElement>('.ag-row');
    const node = rowEl ? grid.getRowNode(rowEl.getAttribute('row-id')) : null;
    if (!node?.data) return;
    const root = target.closest<HTMLElement>('.tc-c, .tc-full');
    let origin: Element | undefined;
    if (root?.classList.contains('tc-full')) origin = node.data._tr.cells[0];
    else if (root) origin = node.data[target.closest('.ag-cell')?.getAttribute('col-id') ?? ''];
    origin ??= node.data._tr.cells[0] ?? node.data._tr;
    let hit: Element = origin!;
    if (root) {
      const path: number[] = [];
      for (let el: HTMLElement | null = target; el && el !== root; el = el.parentElement) {
        path.unshift(Array.prototype.indexOf.call(el.parentElement?.children ?? [], el));
      }
      for (const index of path) hit = hit.children[index] ?? hit;
    }
    hit.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  });

  /* Oryginał się zmienił → nowe dane; sam atrybut hidden → tylko filtr. */
  let queued = false;
  const observer = new MutationObserver((records) => {
    if (queued) return;
    queued = true;
    const onlyHidden = records.every((record) => record.type === 'attributes');
    queueMicrotask(() => {
      queued = false;
      if (onlyHidden) {
        grid.onFilterChanged();
        return;
      }
      grid.setGridOption('rowData', readRows());
      grid.resetRowHeights();
    });
  });
  observer.observe(body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['hidden'] });

  return {
    grid,
    resetLayout,
    destroy() {
      observer.disconnect();
      destroy();
    },
    refilter(predicate: ((row: HTMLTableRowElement) => boolean) | null) {
      rowPredicate = predicate;
      grid.onFilterChanged();
    },
    reload() {
      grid.setGridOption('rowData', readRows());
    },
    quickFilter(text: string) {
      grid.setGridOption('quickFilterText', text);
    },
    /* CSV: bieżący widok (filtry, sortowanie), wszystkie strony. ';' + BOM dla polskiego Excela. */
    exportCsv(name: string) {
      const cell = (text: string) => (/[";\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text);
      const shown = grid.getAllDisplayedColumns().filter((column: Any) => /^c\d+$/.test(column.getColId()));
      const header = shown.map((column: Any) => cell(textOf(ths[Number(column.getColId().slice(1))]))).join(';');
      const lines: string[] = [];
      grid.forEachNodeAfterFilterAndSort((node: Any) => {
        if (node.data?._full) return;
        lines.push(shown.map((column: Any) => cell(textOf(node.data[column.getColId()]))).join(';'));
      });
      const slug = name.toLowerCase().replace(/[^a-z0-9ąćęłńóśźż]+/gi, '-').replace(/^-|-$/g, '');
      const blob = new Blob(['﻿' + header + '\n' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${slug}-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
    },
  };
}
