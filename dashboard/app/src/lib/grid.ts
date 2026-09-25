/* AG Grid Community 36.2 – wspólne ustawienia dla wszystkich tabel dashboardu
   (TableCard, asystent treści). Biblioteka ładuje się globalnie z
   /vendor/ag-grid-community.min.js (Layout), ta sama kopia co w scrape300. */
type Any = any;
declare const agGrid: Any;

export const hasGrid = () => typeof (globalThis as Any).agGrid !== 'undefined';

export const GRID_LOCALE = {
  page: 'Strona', of: 'z', to: '–', more: 'więcej', pageSizeSelectorLabel: 'Wierszy:', noRowsToShow: 'Brak wierszy – zmień filtry',
  firstPage: 'Pierwsza strona', previousPage: 'Poprzednia strona', nextPage: 'Następna strona', lastPage: 'Ostatnia strona',
  filterOoo: 'Filtruj…', contains: 'Zawiera', notContains: 'Nie zawiera', equals: 'Równe', notEqual: 'Różne',
  startsWith: 'Zaczyna się', endsWith: 'Kończy się', blank: 'Puste', notBlank: 'Niepuste', lessThan: 'Mniej niż',
  greaterThan: 'Więcej niż', lessThanOrEqual: 'Najwyżej', greaterThanOrEqual: 'Co najmniej', inRange: 'W zakresie',
  inRangeStart: 'od', inRangeEnd: 'do', applyFilter: 'Zastosuj', resetFilter: 'Wyczyść', clearFilter: 'Wyczyść',
  thousandSeparator: ' ', decimalSeparator: ',',
  andCondition: 'ORAZ', orCondition: 'LUB', pinColumn: 'Przypnij kolumnę', pinLeft: 'Do lewej', pinRight: 'Do prawej', noPin: 'Odepnij',
  autosizeThisColumn: 'Dopasuj szerokość', autosizeAllColumns: 'Dopasuj wszystkie', resetColumns: 'Przywróć kolumny',
  sortAscending: 'Sortuj rosnąco', sortDescending: 'Sortuj malejąco', sortUnSort: 'Bez sortowania',
  columnFilter: 'Filtr kolumny', columnChooser: 'Wybierz kolumny', ariaFilterInput: 'Filtr',
};

/* Kolory z tokenów theme.css – przy zmianie motywu siatki dostają nowy motyw. */
export function gridTheme() {
  const css = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const coinbase = document.documentElement.dataset.skin === 'coinbase';
  const dark = !coinbase && document.documentElement.dataset.theme !== 'light';
  return agGrid.themeQuartz.withParams({
    accentColor: css('--accent-blue'), backgroundColor: css('--bg-surface-1'), foregroundColor: css('--ink'), textColor: css('--ink'),
    borderColor: css('--hairline'), chromeBackgroundColor: css('--bg-surface-2'), headerBackgroundColor: css('--bg-surface-2'),
    headerTextColor: css('--ink-muted'), headerColumnResizeHandleColor: css('--hairline'), headerColumnBorder: { color: css('--hairline') },
    rowHoverColor: css('--bg-surface-2'), selectedRowBackgroundColor: css('--accent-blue-soft'), oddRowBackgroundColor: css('--bg-surface-1'),
    inputBackgroundColor: css('--bg-surface-1'), checkboxCheckedBackgroundColor: css('--accent-blue'), checkboxCheckedBorderColor: css('--accent-blue'),
    checkboxCheckedShapeColor: css('--on-accent'), checkboxUncheckedBorderColor: css('--ink-faint'), checkboxBorderRadius: 2,
    inputBorderRadius: 3, borderRadius: 3, wrapperBorderRadius: 3, wrapperBorder: false,
    fontFamily: 'Roobert, Arial, sans-serif', fontSize: 13, headerFontSize: 12, headerFontWeight: 400, spacing: 7,
    browserColorScheme: dark ? 'dark' : 'light',
    // Skórka Coinbase: Inter, bez linii podziału (głębia z tła), nagłówek na bieli, wiersze Frost.
    ...(coinbase ? {
      fontFamily: "'Inter Variable', Inter, system-ui, sans-serif", fontSize: 14, headerFontSize: 13, headerFontWeight: 600,
      headerTextColor: css('--cb-slate'), headerBackgroundColor: css('--cb-frost'), backgroundColor: css('--cb-frost'),
      oddRowBackgroundColor: css('--cb-frost'), rowHoverColor: css('--cb-cloud'), chromeBackgroundColor: css('--cb-frost'),
      rowBorder: false, headerRowBorder: false, columnBorder: false, headerColumnBorder: false, wrapperBorder: false,
      inputBorderRadius: 8, borderRadius: 8, spacing: 8, browserColorScheme: 'light',
    } : {}),
  });
}

const live = new Set<Any>();
let observing = false;
function watchTheme() {
  if (observing) return;
  observing = true;
  new MutationObserver(() => live.forEach((grid) => { if (!grid.isDestroyed()) grid.setGridOption('theme', gridTheme()); }))
    .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-skin'] });
}

/* Siatka z ustawieniami domyślnymi dashboardu. `stateKey` = zapamiętany układ
   kolumn (kolejność, szerokości, przypięcie, sortowanie) w localStorage. */
export function createGrid(el: HTMLElement, options: Any, stateKey?: string) {
  watchTheme();
  // v2: zapisy sprzed poprawki zawierały szerokości z automatycznego dopasowania (flex).
  const key = stateKey ? `grid2:${stateKey}` : null;
  const save = () => {
    if (!key) return;
    try { localStorage.setItem(key, JSON.stringify(grid.getColumnState())); } catch { /* tryb prywatny */ }
  };
  const grid = agGrid.createGrid(el, {
    theme: gridTheme(),
    defaultColDef: { sortable: true, resizable: true, filter: 'agTextColumnFilter', floatingFilter: true, minWidth: 80 },
    rowHeight: 46, headerHeight: 40, floatingFiltersHeight: 34,
    pagination: true, paginationPageSize: 25, paginationPageSizeSelector: [10, 25, 50, 100],
    domLayout: 'autoHeight', enableCellTextSelection: true, ensureDomOrder: true, localeText: GRID_LOCALE,
    // Zapisujemy tylko to, co zmienił człowiek – siatka sama też „przesuwa” i „zmienia
    // szerokość” kolumn (flex, dopasowanie), a to nie jest układ do zapamiętania.
    onColumnMoved: (event: Any) => { if (event.finished && event.source?.startsWith('ui')) save(); },
    onSortChanged: (event: Any) => { if (event.source?.startsWith('ui')) save(); },
    onColumnPinned: (event: Any) => { if (event.source !== 'api' && event.source !== 'flex') save(); },
    onColumnVisible: (event: Any) => { if (event.source !== 'api') save(); },
    onColumnResized: (event: Any) => { if (event.finished && event.source?.startsWith('ui')) save(); },
    ...options,
  });
  if (key) {
    try {
      const saved = JSON.parse(localStorage.getItem(key) ?? 'null');
      if (Array.isArray(saved)) grid.applyColumnState({ state: saved, applyOrder: true });
    } catch { /* zepsuty zapis – zostaje układ domyślny */ }
  }
  live.add(grid);
  return {
    grid,
    resetLayout() {
      if (key) localStorage.removeItem(key);
      grid.resetColumnState();
    },
    destroy() {
      live.delete(grid);
      grid.destroy();
    },
  };
}
