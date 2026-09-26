"use client";

/* Część interaktywna Content Writera. Logika 1:1 z content-writer.astro
   i lib/writer-competitors.ts – rekomendacje i werdykty z Workera
   (embeddingi wpisów + ranking), a przy pustym indeksie kontrola po słowach. */
import DataGrid from "@/components/grid/DataGrid";
import Segmented from "@/components/Segmented";
import { Card, SectionHead } from "@/components/ui";
import { cn } from "@/lib/cn";
import { fmtInt } from "@/lib/format";
import { api, fmtDateTime, STATUS_LABEL, STATUS_TONE, type ApiError } from "@/lib/writer-client";
import { cannibalization, type GapSuggestion } from "@/lib/writer-gaps.js";
import type { ColDef } from "ag-grid-community";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Any = any; // eslint-disable-line @typescript-eslint/no-explicit-any
type Tone = "ok" | "mid" | "warn" | "err" | "idle";

const TONE_CLS: Record<Tone, string> = {
  ok: "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400",
  mid: "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300",
  warn: "bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400",
  err: "bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400",
  idle: "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400",
};
const REC_LABEL: Record<string, string> = { new: "Napisz nowy", refresh: "Odśwież", check: "Sprawdź" };
const REC_TONE: Record<string, Tone> = { new: "ok", refresh: "warn", check: "mid" };
const pct = (score: number | null | undefined) => (typeof score === "number" ? `${Math.round(score * 100)}%` : "–");
const btn =
  "inline-flex h-8 items-center rounded border border-gray-300 px-2.5 text-theme-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5";
const link = "text-gray-800 underline decoration-brand-500 underline-offset-2 hover:text-brand-600 dark:text-white/90 dark:hover:text-brand-400";

function Status({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return <span className={cn("inline-flex rounded px-2 py-0.5 text-theme-xs font-medium whitespace-nowrap", TONE_CLS[tone])}>{children}</span>;
}

export default function WriterWorkspace({
  domain,
  suggestions,
  measuredAt,
  base,
}: {
  domain: string;
  suggestions: GapSuggestion[];
  measuredAt: string | null;
  base: string;
}) {
  const [keyword, setKeyword] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const projectUrl = useCallback((id: number) => `${base}/content-writer/projekt/?id=${id}`, [base]);
  const editorUrl = useCallback((id: string) => `${base}/content-watcher/edytor/?id=${encodeURIComponent(id)}`, [base]);

  const pick = (phrase: string) => {
    setKeyword(phrase);
    inputRef.current?.focus();
    inputRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  };

  const classify = useCallback(
    async (phrases: string[]) => (await api<{ results: Any[] }>("/api/cw/writer/classify", { method: "POST", body: { domain, phrases } })).data.results ?? [],
    [domain],
  );

  const Target = useCallback(
    ({ target }: { target: Any }) =>
      target?.catalog_id ? (
        <a className={link} href={editorUrl(target.catalog_id)}>
          {target.title}
        </a>
      ) : target?.url ? (
        <a className={link} href={target.url} target="_blank" rel="noopener">
          {target.title ?? target.url}
        </a>
      ) : null,
    [editorUrl],
  );

  return (
    <>
      <NewProject
        domain={domain}
        keyword={keyword}
        setKeyword={setKeyword}
        inputRef={inputRef}
        classify={classify}
        projectUrl={projectUrl}
        editorUrl={editorUrl}
        Target={Target}
      />
      <Suggestions domain={domain} rows={suggestions} measuredAt={measuredAt} classify={classify} Target={Target} pick={pick} />
      <Competitors domain={domain} editorUrl={editorUrl} pick={pick} />
      <Projects domain={domain} projectUrl={projectUrl} />
    </>
  );
}

/* ---------- Nowy projekt + kontrola „odśwież czy nowy" ---------- */

function NewProject({
  domain,
  keyword,
  setKeyword,
  inputRef,
  classify,
  projectUrl,
  editorUrl,
  Target,
}: {
  domain: string;
  keyword: string;
  setKeyword: (v: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  classify: (p: string[]) => Promise<Any[]>;
  projectUrl: (id: number) => string;
  editorUrl: (id: string) => string;
  Target: React.ComponentType<{ target: Any }>;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<React.ReactNode>(null);
  const [check, setCheck] = useState<{ kind: "semantic" | "lexical"; result: Any } | null>(null);
  const seq = useRef(0);
  const writerData = useRef<Any>(null);

  useEffect(() => {
    const phrase = keyword.trim();
    const id = ++seq.current;
    if (phrase.length < 3) {
      setCheck(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const [result] = await classify([phrase]);
        if (id === seq.current && result) setCheck({ kind: "semantic", result });
      } catch {
        // Indeks znaczeniowy niedostępny – kontrola po słowach (tytuły wpisów i frazy w TOP 20).
        try {
          writerData.current ??= await (await fetch(`/${domain}/content-writer/data.json`)).json();
          const result = cannibalization(phrase, writerData.current);
          if (id === seq.current) setCheck(result.pages.length || result.rankings.length ? { kind: "lexical", result } : null);
        } catch {
          /* bez danych – brak podpowiedzi */
        }
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [keyword, classify, domain]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;
    setBusy(true);
    setMessage("Zakładam projekt…");
    try {
      const { data } = await api<{ project: { id: number } }>("/api/cw/writer/projects", { method: "POST", body: { domain, keyword: keyword.trim() } });
      window.location.href = projectUrl(data.project.id);
    } catch (error) {
      const err = error as ApiError;
      const projectId = (err.data as Any)?.project_id;
      setMessage(
        err.code === "duplicate" && projectId ? (
          <span className="text-error-600 dark:text-error-400">
            Ta fraza ma już projekt –{" "}
            <a className={link} href={projectUrl(projectId)}>
              otwórz go
            </a>
            .
          </span>
        ) : (
          <span className="text-error-600 dark:text-error-400">{err.message}</span>
        ),
      );
      setBusy(false);
    }
  };

  const r = check?.result;
  return (
    <>
      <SectionHead title="Nowy artykuł" />
      <Card className="p-5">
        <form onSubmit={submit} className="flex flex-wrap gap-3" autoComplete="off">
          <input
            ref={inputRef}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            maxLength={120}
            required
            placeholder="Fraza główna, np. audyt seo sklepu internetowego"
            aria-label="Fraza główna"
            className="h-11 min-w-64 flex-1 rounded border border-gray-300 bg-transparent px-3 text-sm text-gray-800 focus:border-brand-500 focus:outline-hidden dark:border-gray-700 dark:text-white/90"
          />
          <button type="submit" disabled={busy} className="h-11 rounded bg-brand-500 px-5 text-theme-sm font-medium text-gray-950 hover:bg-brand-400 disabled:opacity-40">
            Załóż projekt
          </button>
        </form>

        {check && (
          <div
            className={cn(
              "mt-4 rounded border px-4 py-3 text-theme-sm",
              check.kind === "semantic" && r.action === "new"
                ? "border-success-200 bg-success-50 text-success-800 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-300"
                : "border-warning-200 bg-warning-50 text-warning-900 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-warning-200",
            )}
          >
            {check.kind === "lexical" ? (
              <>
                <b className="font-medium">Ta fraza może mieć już swoją stronę.</b>
                <ul className="my-2 list-disc pl-5">
                  {r.pages.map((row: Any) => (
                    <li key={row.id ?? row.path}>
                      Wpis z tą frazą w tytule: {row.id ? <a className={link} href={editorUrl(row.id)}>{row.title}</a> : row.path}
                    </li>
                  ))}
                  {r.rankings.map((row: Any) => (
                    <li key={`${row.keyword}-${row.path}`}>
                      „{row.keyword}” – pozycja {row.position}: {row.id ? <a className={link} href={editorUrl(row.id)}>{row.title}</a> : row.path}
                    </li>
                  ))}
                </ul>
                <span>Kontrola po słowach – indeks znaczeniowy jest niedostępny. Nowy tekst na tę samą frazę będzie konkurował z istniejącym.</span>
              </>
            ) : r.action === "new" ? (
              <>
                <b className="font-medium">Nowy temat.</b> Na blogu nie ma wpisu bliskiego tej frazie
                {r.candidates?.[0] && ` – najbliżej jest „${r.candidates[0].title}” (${pct(r.candidates[0].score)})`}
                {r.ranking &&
                  `, a na frazę rankuje dziś ${r.ranking.score === null ? "strona spoza bloga" : "wpis o innym temacie"} (pozycja ${r.ranking.position})`}
                .{r.judge?.basis && <small className="mt-1 block opacity-80">{r.judge.basis}</small>}
              </>
            ) : (
              <>
                <b className="font-medium">
                  {r.action === "refresh" ? "Ten temat ma już wpis – odśwież go zamiast pisać od nowa." : "Jest wpis o pokrewnym temacie."}
                </b>
                <ul className="my-2 list-disc pl-5">
                  <li>
                    <Target target={r.target} /> – podobieństwo {pct(r.target?.score)}
                    {(String(r.reason ?? "").startsWith("ranking") || (r.ranking?.post_id && r.ranking.post_id === r.target?.post_id)) &&
                      `, rankuje na pozycji ${r.ranking?.position}`}
                  </li>
                  {(r.candidates ?? []).slice(1).map((row: Any) => (
                    <li key={row.url ?? row.catalog_id} className="opacity-80">
                      <Target target={row} /> – {pct(row.score)}
                    </li>
                  ))}
                </ul>
                <span>
                  {r.action === "refresh"
                    ? "Nowy tekst na ten sam temat będzie konkurował z istniejącym. Załóż projekt tylko, jeśli celujesz w inną intencję."
                    : "Sprawdź, czy wystarczy dopisać sekcję do istniejącego wpisu – jeśli intencja jest inna, pisz nowy."}
                </span>
                {r.judge?.basis && <small className="mt-1 block opacity-80">{r.judge.basis}</small>}
              </>
            )}
          </div>
        )}
        {message && <p className="mt-3 text-theme-sm text-gray-600 dark:text-gray-400">{message}</p>}
      </Card>
    </>
  );
}

/* ---------- Podpowiedzi z danych + rekomendacje ---------- */

function Suggestions({
  domain,
  rows,
  measuredAt,
  classify,
  Target,
  pick,
}: {
  domain: string;
  rows: GapSuggestion[];
  measuredAt: string | null;
  classify: (p: string[]) => Promise<Any[]>;
  Target: React.ComponentType<{ target: Any }>;
  pick: (phrase: string) => void;
}) {
  const [recs, setRecs] = useState<Record<string, Any>>({});
  const [state, setState] = useState("sprawdzam indeks wpisów…");
  const [filter, setFilter] = useState<"all" | "new" | "refresh" | "check">("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [reindexing, setReindexing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api<{ indexed: number; indexed_at: string | null }>(`/api/cw/writer/index/${domain}`);
      setState(
        data.indexed
          ? `porównano z ${data.indexed} wpisami bloga (indeks z ${fmtDateTime(data.indexed_at)})`
          : "indeks wpisów jest pusty – kliknij „Przelicz indeks”",
      );
      if (!data.indexed || !rows.length) return;
      const results = await classify(rows.map((r) => r.keyword));
      setRecs(Object.fromEntries(results.map((r) => [r.phrase, r])));
    } catch (error) {
      setState((error as Error).message);
    }
  }, [domain, rows, classify]);

  useEffect(() => {
    load();
  }, [load]);

  const reindex = async () => {
    setReindexing(true);
    setState("przeliczam indeks…");
    try {
      // Pierwsze pełne przeliczenie idzie porcjami – wołamy, aż nic nie zostanie.
      for (let round = 0; round < 5; round++) {
        const { data } = await api<{ remaining: number }>("/api/cw/writer/reindex", { method: "POST", body: { domain } });
        if (!data.remaining) break;
      }
      await load();
    } catch (error) {
      setState((error as Error).message);
    } finally {
      setReindexing(false);
    }
  };

  const verdict = useCallback(
    async (phrase: string, choice: "same" | "different" | "clear") => {
      const result = recs[phrase];
      const nearest = result?.target ?? result?.candidates?.[0] ?? null;
      setBusy(phrase);
      try {
        await api("/api/cw/writer/verdict", {
          method: "POST",
          body: { domain, phrase, verdict: choice === "clear" ? null : choice, target: choice === "same" ? nearest : undefined },
        });
        const [fresh] = await classify([phrase]);
        if (fresh) setRecs((cur) => ({ ...cur, [phrase]: fresh }));
      } catch (error) {
        setRecs((cur) => ({ ...cur, [phrase]: { ...cur[phrase], error: (error as Error).message } }));
      } finally {
        setBusy(null);
      }
    },
    [domain, recs, classify],
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = { new: 0, refresh: 0, check: 0 };
    for (const r of Object.values(recs)) if (r.action) c[r.action] = (c[r.action] ?? 0) + 1;
    return c;
  }, [recs]);

  const external = useMemo(() => (filter === "all" ? null : (row: GapSuggestion) => recs[row.keyword]?.action === filter), [filter, recs]);

  const columns = useMemo<ColDef<GapSuggestion>[]>(
    () => [
      { field: "keyword", headerName: "Fraza", width: 190, cellClass: "font-medium" },
      { field: "searches", headerName: "Wyszuk. / mies.", headerTooltip: "Wyszukiwań miesięcznie (Senuto)", width: 110, type: "rightAligned", valueFormatter: ({ value }) => (value !== null ? fmtInt(value) : "–") },
      { field: "impressions", headerName: "Wyśw. / 28 dni", headerTooltip: "Wyświetleń w Search Console w 28 dni", width: 110, type: "rightAligned", valueFormatter: ({ value }) => (value !== null ? fmtInt(value) : "–") },
      { field: "position", headerName: "Pozycja", headerTooltip: "Nasza pozycja", width: 90, type: "rightAligned" },
      {
        headerName: "Nasza strona na tę frazę",
        colId: "ranking",
        width: 200,
        valueGetter: ({ data }) => data?.ranking_title ?? data?.ranking_url ?? data?.sources.join(" + "),
        cellRenderer: ({ data }: { data?: GapSuggestion }) =>
          data &&
          (data.ranking_url ? (
            <a className={cn(link, "truncate")} href={data.ranking_url} target="_blank" rel="noopener">
              {data.ranking_title ?? (data.ranking_url.replace(/^https?:\/\/(www\.)?[^/]+/, "").replace(/^\/$/, "strona główna") || "strona główna")}
            </a>
          ) : (
            data.sources.join(" + ")
          )),
      },
      {
        headerName: "Rekomendacja",
        colId: "rec",
        flex: 1,
        minWidth: 300,
        autoHeight: true,
        wrapText: true,
        valueGetter: ({ data }) => (data ? (REC_LABEL[recs[data.keyword]?.action] ?? "") : ""),
        cellRenderer: ({ data }: { data?: GapSuggestion }) => {
          if (!data) return null;
          const r = recs[data.keyword];
          if (!r) return <span className="text-gray-400">{Object.keys(recs).length ? "–" : "…"}</span>;
          const nearest = r.target ?? r.candidates?.[0] ?? null;
          return (
            <div className="flex flex-col gap-1 py-2 leading-snug">
              <span>
                <Status tone={REC_TONE[r.action] ?? "idle"}>{REC_LABEL[r.action] ?? r.action}</Status>
              </span>
              <small className="text-theme-xs text-gray-600 dark:text-gray-400">
                {r.action === "new" ? (
                  <>
                    {r.editor
                      ? "uznany za osobny temat"
                      : r.ranking
                        ? `rankuje ${r.ranking.score === null ? "strona spoza bloga" : `wpis o innym temacie (${pct(r.ranking.score)})`}`
                        : "brak bliskiego wpisu"}
                    {!r.editor && r.candidates?.[0] && ` · najbliżej: ${r.candidates[0].title} (${pct(r.candidates[0].score)})`}
                  </>
                ) : (
                  <>
                    <Target target={r.target} />
                    {typeof r.target?.score === "number" && ` · ${pct(r.target.score)}`}
                    {String(r.reason ?? "").startsWith("ranking") && ` · rankuje #${r.target?.position}`}
                  </>
                )}
              </small>
              {r.judge?.basis && <small className="text-theme-xs text-gray-500 italic">{r.judge.basis}</small>}
              {r.editor ? (
                <small className="text-theme-xs text-gray-500">
                  Twoja decyzja z {fmtDateTime(r.editor.at)} ·{" "}
                  <button type="button" className="underline" disabled={busy === data.keyword} onClick={() => verdict(data.keyword, "clear")}>
                    cofnij
                  </button>
                </small>
              ) : (
                <>
                  {r.judge?.cached && <small className="text-theme-xs text-gray-500">ocena modelu z {fmtDateTime(r.judge.at)}</small>}
                  <span className="flex flex-wrap gap-1.5">
                    {nearest && r.action !== "refresh" && (
                      <button type="button" className={btn} disabled={busy === data.keyword} title={`Temat jest już na blogu: ${nearest.title}`} onClick={() => verdict(data.keyword, "same")}>
                        To ten sam temat
                      </button>
                    )}
                    {r.action !== "new" && (
                      <button type="button" className={btn} disabled={busy === data.keyword} title="Fraza zasługuje na własny tekst" onClick={() => verdict(data.keyword, "different")}>
                        To inny temat
                      </button>
                    )}
                  </span>
                </>
              )}
              {r.error && <small className="text-theme-xs text-error-600">{r.error}</small>}
            </div>
          );
        },
      },
      {
        headerName: "",
        colId: "pick",
        width: 95,
        sortable: false,
        cellRenderer: ({ data }: { data?: GapSuggestion }) =>
          data && (
            <button type="button" className={btn} onClick={() => pick(data.keyword)}>
              Wybierz
            </button>
          ),
      },
    ],
    [recs, busy, verdict, Target, pick],
  );

  return (
    <>
      <SectionHead title="Podpowiedzi z danych" meta={measuredAt ? `dane z ${measuredAt}` : undefined} />
      <p className="-mt-2 mb-4 max-w-4xl text-theme-sm text-gray-600 dark:text-gray-400">
        Frazy, na które {domain} wyświetla się w Google, ale dopiero na pozycjach 11–50 – bez realnego ruchu. Źródła: Senuto (co
        najmniej 30 wyszukiwań miesięcznie) i Search Console (pytania z co najmniej 100 wyświetleniami w 28 dni). Odpadają frazy
        z wpisem o tej frazie w tytule i frazy z nazwą marki.
      </p>
      <ul className="mb-4 flex flex-col gap-1.5 text-theme-sm text-gray-600 dark:text-gray-400">
        <li className="flex items-center gap-2">
          <Status tone="ok">Napisz nowy</Status> blog nie ma wpisu o tym temacie
        </li>
        <li className="flex items-center gap-2">
          <Status tone="warn">Odśwież</Status> jest wpis o tym samym temacie – rozbuduj go w Content Watcherze
        </li>
        <li className="flex items-center gap-2">
          <Status tone="mid">Sprawdź</Status> jest wpis pokrewny – model ocenił, czy to ten sam temat
        </li>
      </ul>
      <DataGrid<GapSuggestion>
        title="Podpowiedzi"
        meta={state}
        rows={rows}
        columns={columns}
        externalFilter={external}
        rowKey={(r) => r.keyword}
        fitContent
        filter
        csvName={`${domain}-content-writer-podpowiedzi`}
        empty="Brak podpowiedzi – w danych nie ma fraz z pozycją 11–50 bez własnego wpisu."
        actions={
          <>
            <Segmented
              label="Filtr rekomendacji"
              value={filter}
              onChange={setFilter}
              options={[
                { value: "all", label: "Wszystkie" },
                { value: "new", label: `Napisz nowy · ${counts.new}` },
                { value: "refresh", label: `Odśwież · ${counts.refresh}` },
                { value: "check", label: `Sprawdź · ${counts.check}` },
              ]}
            />
            <button
              type="button"
              className={cn(btn, "h-10")}
              disabled={reindexing}
              onClick={reindex}
              title="Tytuły wpisów zamieniane są na wektory (bge-m3) raz dziennie o 5:20 UTC. Przelicz, jeśli właśnie dodano wpisy."
            >
              Przelicz indeks
            </button>
          </>
        }
      />
    </>
  );
}

/* ---------- Konkurencja ---------- */

const COMP_REC: Record<string, { label: string; tone: Tone }> = {
  new: { label: "Nie mamy", tone: "err" },
  check: { label: "Mamy coś pokrewnego", tone: "warn" },
  refresh: { label: "Mamy", tone: "ok" },
};
const NEW_DAYS = 30;

function Competitors({ domain, editorUrl, pick }: { domain: string; editorUrl: (id: string) => string; pick: (p: string) => void }) {
  const [data, setData] = useState<Any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"new" | "gap" | "all">("new");
  const [host, setHost] = useState("all");
  const [sync, setSync] = useState<{ running: boolean; text: string; error?: boolean }>({ running: false, text: "" });
  const since = useMemo(() => new Date(Date.now() - NEW_DAYS * 86_400_000).toISOString().slice(0, 10), []);
  const isNew = useCallback((item: Any) => !item.baseline && String(item.first_seen ?? "") >= since, [since]);

  const load = useCallback(async () => {
    try {
      const fresh = (await api<Any>(`/api/cw/writer/competitors/${domain}`)).data;
      setData(fresh);
      // Bez nowych wpisów od startu śledzenia – od razu mapa tematów.
      if (!(fresh.items ?? []).some(isNew)) setView((v) => (v === "new" ? "gap" : v));
    } catch (e) {
      setError((e as Error).message);
    }
  }, [domain, isNew]);

  useEffect(() => {
    load();
  }, [load]);

  const runSync = async () => {
    setSync({ running: true, text: "Porównuję…" });
    try {
      let failures = 0;
      for (let round = 0; round < 80; round++) {
        let result: Any;
        try {
          result = (await api<Any>(`/api/cw/writer/competitors/${domain}/sync`, { method: "POST", body: {} })).data;
          failures = 0;
        } catch (e) {
          // Pojedyncza porcja potrafi przekroczyć limit CPU Workera – ponawiamy.
          if (++failures > 3) throw e;
          await new Promise((r) => setTimeout(r, 3000));
          continue;
        }
        setSync({ running: true, text: `porównano ${fmtInt(result.total - result.remaining)} z ${fmtInt(result.total)}` });
        if (!result.remaining) break;
      }
      setSync({ running: false, text: "" });
      await load();
    } catch (e) {
      setSync({ running: false, text: (e as Error).message, error: true });
    }
  };

  const items: Any[] = data?.items ?? [];
  const inHost = (item: Any) => host === "all" || item.host === host;
  const count = (fn: (item: Any) => boolean) => items.filter((i) => inHost(i) && fn(i)).length;
  const rows = useMemo(
    () =>
      items
        .filter(inHost)
        .filter((i) => view === "all" || (view === "new" ? isNew(i) : i.action === "new"))
        .sort((a, b) => String(b.first_seen ?? "").localeCompare(String(a.first_seen ?? "")) || String(b.lastmod ?? "").localeCompare(String(a.lastmod ?? ""))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, host, view, isNew],
  );

  const columns = useMemo<ColDef<Any>[]>(
    () => [
      {
        field: "title",
        headerName: "Temat u konkurencji",
        flex: 1,
        minWidth: 280,
        cellRenderer: ({ data: item }: { data?: Any }) =>
          item && (
            <span className="flex min-w-0 flex-col justify-center leading-tight">
              <a className={cn(link, "truncate")} href={item.url} target="_blank" rel="noopener noreferrer">
                {item.title}
              </a>
              {item.title_from === "slug" && <small className="text-theme-xs text-gray-500">tytuł z adresu</small>}
            </span>
          ),
      },
      { field: "host", headerName: "Konkurent", width: 150 },
      {
        field: "first_seen",
        headerName: "Pojawił się",
        width: 130,
        valueFormatter: ({ data: item }) => (item?.baseline ? "przed śledzeniem" : (item?.first_seen ?? "–")),
      },
      {
        field: "action",
        headerName: "Czy mamy",
        width: 170,
        cellRenderer: ({ value }: { value: string | null }) =>
          value && COMP_REC[value] ? <Status tone={COMP_REC[value].tone}>{COMP_REC[value].label}</Status> : <span className="text-gray-400">czeka na porównanie</span>,
      },
      {
        headerName: "Nasz najbliższy wpis",
        colId: "target",
        width: 260,
        valueGetter: ({ data: item }) => item?.target?.title ?? "",
        cellRenderer: ({ data: item }: { data?: Any }) =>
          item?.target ? (
            <span className="truncate">
              <a className={link} href={item.target.catalog_id ? editorUrl(item.target.catalog_id) : item.target.url} target={item.target.catalog_id ? undefined : "_blank"} rel="noopener">
                {item.target.title}
              </a>{" "}
              <small className="text-gray-500">{pct(item.score)}</small>
            </span>
          ) : (
            <span className="text-gray-400">–</span>
          ),
      },
      {
        headerName: "",
        colId: "pick",
        width: 90,
        sortable: false,
        cellRenderer: ({ data: item }: { data?: Any }) =>
          item && item.action !== "refresh" && (
            <button type="button" className={btn} onClick={() => pick(item.title)}>
              Napisz
            </button>
          ),
      },
    ],
    [editorUrl, pick],
  );

  return (
    <>
      <SectionHead title="Konkurencja" meta="sitemapy odczytywane codziennie rano" />
      <p className="-mt-2 mb-4 max-w-4xl text-theme-sm text-gray-600 dark:text-gray-400">
        Wpisy z sitemap konkurentów porównane z naszymi wpisami po znaczeniu tytułu (embeddingi, te same progi co wyżej). Kliknij
        konkurenta, żeby zawęzić listę.
      </p>
      {error ? (
        <p className="text-theme-sm text-error-600">{error}</p>
      ) : !data ? (
        <p className="text-theme-sm text-gray-500">Wczytuję wpisy konkurencji…</p>
      ) : !items.length ? (
        <p className="text-theme-sm text-gray-500">Brak danych – collector jeszcze nie pobrał sitemap konkurencji (źródło competitors w domains.yaml).</p>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
            {(data.sites ?? []).map((site: Any) => {
              const mine = items.filter((i) => i.host === site.host);
              return (
                <button
                  key={site.host}
                  type="button"
                  onClick={() => setHost((h) => (h === site.host ? "all" : site.host))}
                  className={cn(
                    "rounded-2xl border bg-white p-5 text-left transition dark:bg-white/3",
                    host === site.host ? "border-brand-500 ring-2 ring-brand-500" : "border-gray-200 hover:border-brand-300 dark:border-gray-800",
                  )}
                >
                  <span className="block text-theme-sm text-gray-500 dark:text-gray-400">{site.host}</span>
                  <span className="mt-2 block text-title-sm font-medium text-gray-800 tabular-nums dark:text-white/90">{fmtInt(mine.length)}</span>
                  <span className="mt-1 block text-theme-xs text-gray-500 dark:text-gray-400">
                    wpisów w sitemapie{site.status !== "ok" && ` – ostatni odczyt nie powiódł się: ${site.error ?? ""}`}
                  </span>
                  <span className="mt-1 block text-theme-xs text-gray-600 dark:text-gray-300">
                    <b className="font-medium">{fmtInt(mine.filter(isNew).length)}</b> nowych w {NEW_DAYS} dni ·{" "}
                    <b className="font-medium">{fmtInt(mine.filter((i) => i.action === "new").length)}</b> tematów, których nie mamy
                  </span>
                </button>
              );
            })}
          </div>
          {data.pending > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-3 rounded border border-warning-200 bg-warning-50 px-4 py-3 text-theme-sm text-warning-900 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-warning-200">
              <span>
                <b className="font-medium">{fmtInt(data.pending)} wpisów czeka na porównanie z naszymi.</b> Porównanie idzie samo codziennie rano; możesz je
                dokończyć teraz.
              </span>
              <button type="button" className="h-9 rounded bg-brand-500 px-3 text-theme-sm font-medium text-gray-950 disabled:opacity-40" disabled={sync.running} onClick={runSync}>
                {sync.running ? "Porównuję…" : "Porównaj teraz"}
              </button>
              {sync.text && <span className={sync.error ? "text-error-600" : undefined}>{sync.text}</span>}
            </div>
          )}
          <DataGrid<Any>
            key={`${view}-${host}`}
            title={host === "all" ? "Wpisy konkurencji" : `Wpisy: ${host}`}
            meta={
              view === "new"
                ? `Adresy, które pojawiły się w sitemapach w ostatnich ${NEW_DAYS} dniach. Pierwszy odczyt konkurenta to punkt odniesienia.`
                : view === "gap"
                  ? "Wpisy konkurencji bez bliskiego tematu u nas (podobieństwo tytułu poniżej 60%)."
                  : "Wszystkie wpisy z sitemap z oceną, czy mamy odpowiednik."
            }
            rows={rows}
            columns={columns}
            rowKey={(i) => i.url}
            filter
            filterPlaceholder="Szukaj w tytułach…"
            csvName={`${domain}-konkurencja-${view}`}
            empty={view === "new" ? `Od początku śledzenia (${data.generated_at ? fmtDateTime(data.generated_at) : "–"}) konkurenci nie dodali nowych wpisów.` : "Nic w tym widoku."}
            actions={
              <Segmented
                label="Widok"
                value={view}
                onChange={setView}
                options={[
                  { value: "new" as const, label: `Nowe u konkurencji · ${fmtInt(count(isNew))}` },
                  { value: "gap" as const, label: `Tematy, których nie mamy · ${fmtInt(count((i) => i.action === "new"))}` },
                  { value: "all" as const, label: `Wszystkie · ${fmtInt(count(() => true))}` },
                ]}
              />
            }
          />
        </>
      )}
    </>
  );
}

/* ---------- Projekty (D1) ---------- */

function Projects({ domain, projectUrl }: { domain: string; projectUrl: (id: number) => string }) {
  const [rows, setRows] = useState<Any[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ projects: Any[] }>(`/api/cw/writer/projects?domain=${encodeURIComponent(domain)}`)
      .then(({ data }) => setRows(data.projects ?? []))
      .catch((e) => setError((e as Error).message));
  }, [domain]);

  const columns = useMemo<ColDef<Any>[]>(
    () => [
      {
        field: "keyword",
        headerName: "Fraza",
        width: 260,
        cellRenderer: ({ data }: { data?: Any }) =>
          data && (
            <a className={cn(link, "font-medium")} href={projectUrl(data.id)}>
              {data.keyword}
            </a>
          ),
      },
      { field: "title", headerName: "Tytuł roboczy", flex: 1, minWidth: 240, valueFormatter: ({ value }) => value || "–" },
      {
        field: "status",
        headerName: "Stan",
        width: 190,
        getQuickFilterText: ({ value }) => STATUS_LABEL[value as string] ?? value,
        cellRenderer: ({ value }: { value: string }) => <Status tone={(STATUS_TONE[value] ?? "idle") as Tone}>{STATUS_LABEL[value] ?? value}</Status>,
      },
      {
        field: "wp_draft_url",
        headerName: "Szkic w WP",
        width: 120,
        cellRenderer: ({ value }: { value: string | null }) =>
          value ? (
            <a className={link} href={value} target="_blank" rel="noopener">
              podgląd
            </a>
          ) : (
            <span className="text-gray-400">–</span>
          ),
      },
      { field: "updated_at", headerName: "Ostatnia zmiana", width: 150, sort: "desc", type: "rightAligned", valueFormatter: ({ value }) => fmtDateTime(value) },
    ],
    [projectUrl],
  );

  return (
    <>
      <SectionHead title="Projekty" meta={rows?.length ? `${rows.length} w toku i gotowych` : undefined} />
      {error ? (
        <p className="text-theme-sm text-error-600">{error}</p>
      ) : (
        <DataGrid<Any>
          title="Projekty artykułów"
          rows={rows}
          columns={columns}
          rowKey={(r) => String(r.id)}
          filter
          pageSize={10}
          empty="Nie ma jeszcze projektów. Wpisz frazę powyżej."
        />
      )}
    </>
  );
}
