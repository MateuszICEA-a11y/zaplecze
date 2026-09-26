"use client";

/* AI Performance z Bing Webmaster Tools. Brak API – import CSV („AI Performance
   → Search queries") trafia przez Workera do KV DASHBOARD_IMPORTS; po wejściu na
   stronę nowszy import z KV zastępuje dane zaszyte w buildzie. */
import BarList from "@/components/BarList";
import DataGrid from "@/components/grid/DataGrid";
import { BarCell } from "@/components/grid/cells";
import Segmented from "@/components/Segmented";
import { Card, SectionHead } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { BingAiQueryRow } from "@/lib/data";
import { fmtDate, fmtInt, fmtNum } from "@/lib/format";
import type { ColDef } from "ag-grid-community";
import { Sparkles, Upload } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type AiData = { date: string; rows: BingAiQueryRow[]; filename?: string; imported_at?: string };
type Intent = "learn" | "info" | "cmp" | "other";

const INTENTS: Record<Intent, { label: string; color: string }> = {
  learn: { label: "Learn & Solve", color: "bg-brand-700" },
  info: { label: "Informational", color: "bg-brand-500" },
  cmp: { label: "Comparison", color: "bg-brand-300" },
  other: { label: "Inne", color: "bg-gray-400" },
};
const intentOf = (value: string): Intent =>
  /learn|solve/i.test(value) ? "learn" : /inform/i.test(value) ? "info" : /compar/i.test(value) ? "cmp" : "other";
const numeric = { type: "rightAligned", getQuickFilterText: () => "" } as const;

export default function BingAi({ domain, initial }: { domain: string; initial: AiData | null }) {
  const [data, setData] = useState<AiData | null>(initial);
  const [intent, setIntent] = useState<Intent | "all">("all");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState<{ text: string; tone: "idle" | "busy" | "ok" | "error" }>({
    text: "Obsługiwane kolumny: Grounding Query, Intent, Topic, Citations, Citation Share.",
    tone: "idle",
  });
  const input = useRef<HTMLInputElement>(null);
  const endpoint = `/api/imports/bing-ai/${encodeURIComponent(domain)}`;

  useEffect(() => {
    fetch(endpoint)
      .then(async (res) => {
        if (res.status === 404 || !res.headers.get("content-type")?.includes("json")) return null;
        const payload = (await res.json()) as { data?: AiData; error?: string };
        if (!res.ok) throw new Error(payload.error || "Nie udało się pobrać importu.");
        return payload.data ?? null;
      })
      .then((fresh) => fresh?.rows?.length && setData(fresh))
      .catch((error) => setStatus({ text: error instanceof Error ? error.message : "Nie udało się pobrać importu.", tone: "error" }));
  }, [endpoint]);

  const pick = (next: File | null) => {
    setFile(next);
    if (next) setStatus({ text: `Gotowy do importu: ${fmtNum(next.size / 1024, 1)} KB.`, tone: "idle" });
  };

  const send = async () => {
    if (!file) return;
    setStatus({ text: "Importuję i zapisuję dane…", tone: "busy" });
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch(endpoint, { method: "POST", body: form });
      const payload = (await res.json()) as { data?: AiData; message?: string; error?: string };
      if (!res.ok || !payload.data) throw new Error(payload.error || "Import nie powiódł się.");
      setData(payload.data);
      setStatus({ text: `${payload.message ?? "Zaimportowano."} Dane są już widoczne poniżej.`, tone: "ok" });
      pick(null);
      if (input.current) input.current.value = "";
    } catch (error) {
      setStatus({ text: error instanceof Error ? error.message : "Import nie powiódł się.", tone: "error" });
    }
  };

  const rows = useMemo(() => [...(data?.rows ?? [])].sort((a, b) => b.citations - a.citations), [data]);
  const total = rows.reduce((sum, r) => sum + r.citations, 0);
  const split = (Object.keys(INTENTS) as Intent[])
    .map((key) => ({ key, cit: rows.filter((r) => intentOf(r.intent) === key).reduce((s, r) => s + r.citations, 0) }))
    .filter((i) => i.cit > 0);
  const filter = useMemo(() => (intent === "all" ? null : (r: BingAiQueryRow) => intentOf(r.intent) === intent), [intent]);

  const columns = useMemo<ColDef<BingAiQueryRow>[]>(() => {
    const max = Math.max(0, ...rows.map((r) => r.citations));
    return [
      { field: "query", headerName: "Grounding query", flex: 1, minWidth: 240, cellClass: "font-medium" },
      {
        field: "intent",
        headerName: "Intencja",
        width: 160,
        cellRenderer: ({ value }: { value: string }) => (
          <span className="inline-flex items-center gap-1.5 text-theme-sm">
            <span className={cn("size-2 rounded-full", INTENTS[intentOf(value)].color)} />
            {value || INTENTS[intentOf(value)].label}
          </span>
        ),
      },
      { field: "topic", headerName: "Temat", width: 200 },
      {
        field: "citations",
        headerName: "Cytowania",
        width: 170,
        sort: "desc",
        ...numeric,
        cellRenderer: ({ value }: { value: number }) => <BarCell value={value} max={max} />,
      },
      {
        field: "citation_share",
        headerName: "Udział cytowań",
        width: 140,
        ...numeric,
        valueFormatter: ({ value }) => (typeof value === "number" ? `${fmtNum(value, 2)}%` : "–"),
      },
    ];
  }, [rows]);

  return (
    <>
      <SectionHead
        title="AI Performance"
        meta={data ? `cytowania w Copilot / Bing AI · import CSV z BWT · stan z ${fmtDate(data.date)}` : "cytowania w Copilot / Bing AI"}
      />

      <Card
        className={cn("mb-5 border-dashed p-5 transition", dragging && "border-brand-500 bg-brand-25 dark:bg-brand-500/6")}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          pick(e.dataTransfer.files?.[0] ?? null);
        }}
      >
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
            <Upload className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-medium text-gray-800 dark:text-white/90">Import danych Bing AI</h3>
            <p className="text-theme-sm text-gray-500 dark:text-gray-400">
              Wyeksportuj w BWT raport <b className="font-medium text-gray-700 dark:text-gray-300">AI Performance → Search queries</b> i
              przeciągnij tu plik CSV albo wybierz go z dysku.
            </p>
          </div>
          <input ref={input} type="file" accept=".csv,text/csv" hidden onChange={(e) => pick(e.target.files?.[0] ?? null)} />
          <button
            type="button"
            onClick={() => input.current?.click()}
            className="h-11 rounded border border-gray-300 px-4 text-theme-sm font-medium text-gray-800 hover:bg-gray-50 dark:border-gray-700 dark:text-white/90 dark:hover:bg-white/5"
          >
            {file ? file.name : "Wybierz CSV"}
          </button>
          <button
            type="button"
            onClick={send}
            disabled={!file || status.tone === "busy"}
            className="h-11 rounded bg-brand-500 px-4 text-theme-sm font-medium text-gray-950 hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Importuj dane
          </button>
        </div>
        <p
          role="status"
          aria-live="polite"
          className={cn(
            "mt-3 text-theme-xs",
            status.tone === "ok"
              ? "text-success-600 dark:text-success-400"
              : status.tone === "error"
                ? "text-error-600 dark:text-error-400"
                : status.tone === "busy"
                  ? "text-warning-600 dark:text-warning-400"
                  : "text-gray-500 dark:text-gray-400",
          )}
        >
          {status.text}
        </p>
      </Card>

      {rows.length > 0 && (
        <>
          <div className="mb-5 grid grid-cols-1 gap-4 md:gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            <Card className="bg-gray-950 p-5 text-gray-50 dark:bg-white/3">
              <span className="inline-flex items-center gap-2 text-theme-sm text-gray-300">
                <Sparkles className="size-4 text-brand-400" /> Cytowania AI
              </span>
              <p className="mt-3 text-title-md font-medium tabular-nums">{fmtInt(total)}</p>
              <p className="mt-1 text-theme-sm text-gray-300">
                w <b className="font-medium text-white">{fmtInt(rows.length)}</b> zapytaniach grounding – frazach, którymi AI
                sięgało po treść
              </p>
            </Card>
            <Card className="p-5">
              <h3 className="mb-4 text-base font-medium text-gray-800 dark:text-white/90">Podział intencji</h3>
              <BarList
                labelWidth="w-32"
                items={split.map((i) => ({
                  label: INTENTS[i.key].label,
                  value: i.cit,
                  color: INTENTS[i.key].color,
                  suffix: <span className="ms-2 font-normal text-gray-500">{total ? Math.round((i.cit / total) * 100) : 0}%</span>,
                }))}
              />
            </Card>
          </div>
          <DataGrid<BingAiQueryRow>
            title="Grounding queries"
            rows={rows}
            columns={columns}
            filter
            externalFilter={filter}
            csvName={`${domain}-bing-ai`}
            actions={
              <Segmented
                label="Intencja"
                value={intent}
                onChange={setIntent}
                options={[
                  { value: "all" as const, label: "Wszystkie" },
                  ...split.map((i) => ({ value: i.key, label: INTENTS[i.key].label })),
                ]}
              />
            }
          />
        </>
      )}
    </>
  );
}
