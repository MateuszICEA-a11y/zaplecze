"use client";

/* Tabela danych na AG Grid Community w karcie TailAdmina: szybki filtr,
   licznik wierszy, eksport CSV, stronicowanie, sortowanie po kolumnach.
   Motyw siatki idzie za motywem strony (jasny/ciemny). */
import { Card } from "@/components/ui";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/cn";
import { AG_GRID_LOCALE_PL } from "@ag-grid-community/locale";
import {
  AllCommunityModule,
  colorSchemeDarkBlue,
  colorSchemeLight,
  ModuleRegistry,
  themeQuartz,
  type ColDef,
  type ColGroupDef,
  type GridApi,
  type IRowNode,
  type RowClickedEvent,
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { Download, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

ModuleRegistry.registerModules([AllCommunityModule]);

const baseParams = {
  fontFamily: "inherit",
  fontSize: 13,
  headerFontSize: 12,
  headerFontWeight: 500,
  spacing: 7,
  wrapperBorder: false,
  wrapperBorderRadius: 0,
  columnBorder: false,
  cellHorizontalPadding: 14,
  accentColor: "#5768ff",
} as const;

const lightTheme = themeQuartz.withPart(colorSchemeLight).withParams({
  ...baseParams,
  backgroundColor: "#ffffff",
  foregroundColor: "#1b2143",
  headerBackgroundColor: "#f9f9f9",
  headerTextColor: "#666c8a",
  borderColor: "#f0f1f5",
  rowHoverColor: "#f9f9f9",
  selectedRowBackgroundColor: "#eff0ff",
});

const darkTheme = themeQuartz.withPart(colorSchemeDarkBlue).withParams({
  ...baseParams,
  backgroundColor: "#080e2c",
  foregroundColor: "#c9ccd9",
  headerBackgroundColor: "#0b1131",
  headerTextColor: "#9a9fb5",
  borderColor: "#1b2143",
  rowHoverColor: "#0f1638",
  selectedRowBackgroundColor: "#161b4a",
  chromeBackgroundColor: "#080e2c",
});

export interface DataGridProps<T> {
  title: string;
  meta?: React.ReactNode;
  rows: T[] | null;
  columns: (ColDef<T> | ColGroupDef<T>)[];
  /** Pole z szybkim filtrem tekstowym (po wszystkich kolumnach tekstowych). */
  filter?: boolean;
  filterPlaceholder?: string;
  /** Dodatkowe kontrolki w nagłówku karty (przełączniki, chipy). */
  actions?: React.ReactNode;
  /** Filtr zewnętrzny (np. TOP 3/10/50) – zmiana referencji odświeża siatkę. */
  externalFilter?: ((row: T) => boolean) | null;
  onRowClicked?: (row: T) => void;
  selectedKey?: string | null;
  rowKey?: (row: T) => string;
  pageSize?: number;
  rowHeight?: number;
  csvName?: string;
  empty?: string;
  className?: string;
}

export default function DataGrid<T>({
  title,
  meta,
  rows,
  columns,
  filter = false,
  filterPlaceholder = "Szukaj…",
  actions,
  externalFilter = null,
  onRowClicked,
  selectedKey,
  rowKey,
  pageSize = 25,
  rowHeight = 42,
  csvName,
  empty = "Brak danych.",
  className,
}: DataGridProps<T>) {
  const { theme } = useTheme();
  const apiRef = useRef<GridApi<T> | null>(null);
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState<number | null>(null);
  const filterRef = useRef(externalFilter);
  filterRef.current = externalFilter;

  const defaultColDef = useMemo<ColDef<T>>(
    () => ({ sortable: true, resizable: true, suppressMovable: true, unSortIcon: false, minWidth: 90 }),
    [],
  );

  const refreshCount = useCallback(() => {
    if (apiRef.current) setShown(apiRef.current.getDisplayedRowCount());
  }, []);

  useEffect(() => {
    apiRef.current?.onFilterChanged();
  }, [externalFilter]);

  useEffect(() => {
    if (!apiRef.current || !rowKey) return;
    apiRef.current.forEachNode((node) => {
      if (node.data) node.setSelected(rowKey(node.data) === selectedKey, false);
    });
  }, [selectedKey, rowKey]);

  const total = rows?.length ?? 0;
  const heightRows = Math.min(Math.max(total, 4), pageSize);
  const grouped = columns.some((c) => "children" in c);
  const gridHeight = (grouped ? 88 : 44) + heightRows * rowHeight + (total > pageSize ? 49 : 2);

  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800">
        <div className="min-w-0 flex-1">
          <h3 className="flex items-baseline gap-2 text-base font-medium text-gray-800 dark:text-white/90">
            {title}
            <span className="text-theme-sm font-normal text-gray-500 tabular-nums dark:text-gray-400">
              {shown !== null && shown !== total
                ? `${shown.toLocaleString("pl-PL")} z ${total.toLocaleString("pl-PL")}`
                : total.toLocaleString("pl-PL")}
            </span>
          </h3>
          {meta && <p className="mt-0.5 text-theme-xs text-gray-500 dark:text-gray-400">{meta}</p>}
        </div>
        {actions}
        {filter && (
          <label className="relative block w-full sm:w-64">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                apiRef.current?.setGridOption("quickFilterText", e.target.value);
              }}
              placeholder={filterPlaceholder}
              className="h-10 w-full rounded-lg border border-gray-200 bg-transparent py-2 pr-3 pl-9 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 focus:outline-hidden dark:border-gray-800 dark:text-white/90 dark:placeholder:text-white/30"
            />
          </label>
        )}
        {csvName && (
          <button
            type="button"
            onClick={() => apiRef.current?.exportDataAsCsv({ fileName: `${csvName}.csv`, columnSeparator: ";" })}
            className="flex h-10 items-center gap-2 rounded-lg border border-gray-200 px-3 text-theme-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-white/3"
            title="Pobierz widoczne wiersze jako CSV"
          >
            <Download className="size-4" /> CSV
          </button>
        )}
      </div>
      {rows !== null && total === 0 ? (
        <p className="px-5 py-10 text-center text-theme-sm text-gray-500 dark:text-gray-400">{empty}</p>
      ) : (
        <div style={{ height: gridHeight }}>
          <AgGridReact<T>
            theme={theme === "dark" ? darkTheme : lightTheme}
            rowData={rows ?? undefined}
            loading={rows === null}
            columnDefs={columns}
            defaultColDef={defaultColDef}
            localeText={AG_GRID_LOCALE_PL}
            pagination={total > pageSize}
            paginationPageSize={pageSize}
            paginationPageSizeSelector={[25, 50, 100, 500]}
            rowHeight={rowHeight}
            headerHeight={44}
            animateRows={false}
            suppressCellFocus
            rowSelection={onRowClicked ? { mode: "singleRow", checkboxes: false, enableClickSelection: false } : undefined}
            getRowId={rowKey ? (p) => rowKey(p.data) : undefined}
            isExternalFilterPresent={() => filterRef.current !== null}
            doesExternalFilterPass={(node: IRowNode<T>) => (node.data ? (filterRef.current?.(node.data) ?? true) : true)}
            onGridReady={(e) => {
              apiRef.current = e.api;
              refreshCount();
            }}
            onModelUpdated={refreshCount}
            onRowClicked={onRowClicked ? (e: RowClickedEvent<T>) => e.data && onRowClicked(e.data) : undefined}
            rowClass={onRowClicked ? "cursor-pointer" : undefined}
          />
        </div>
      )}
    </Card>
  );
}
