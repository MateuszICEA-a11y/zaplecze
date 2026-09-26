"use client";

/* Projekt artykułu Content Writera w React: etapy, przebieg w toku, research
   (SERP i teksty konkurencji), brief do akceptacji i wejście do edytora tekstu.
   Logika i kontrakty API 1:1 z dawnego projekt.astro. Pełnoekranowy edytor
   tekstu (legacy/writer-editor.ts) jest podpięty jako gotowy moduł – do
   przepisania osobno. */
import DataGrid from "@/components/grid/DataGrid";
import Segmented from "@/components/Segmented";
import { Card, SectionHead } from "@/components/ui";
import { ensureHighlights } from "@/legacy/LegacyHost";
import { createEditor } from "@/legacy/writer-editor";
import { cn } from "@/lib/cn";
import { fmtInt } from "@/lib/format";
import { phraseKey } from "@/lib/phrase-match.js";
import { api, fmtDateTime, sleep, STATUS_LABEL, STATUS_TONE } from "@/lib/writer-client";
import type { ColDef } from "ag-grid-community";
import { ArrowDown, ArrowLeft, ArrowUp, Check, Loader2, Plus, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "@/legacy/legacy.css";
import "@/legacy/tokens.css";

type Any = any; // eslint-disable-line @typescript-eslint/no-explicit-any
type Tone = "ok" | "mid" | "warn" | "err" | "idle";
const TONE_CLS: Record<Tone, string> = {
  ok: "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400",
  mid: "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300",
  warn: "bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400",
  err: "bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400",
  idle: "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400",
};
const btn =
  "inline-flex h-10 items-center gap-1.5 rounded border border-gray-300 px-3.5 text-theme-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:text-white/90 dark:hover:bg-white/5";
const btnPrimary = "inline-flex h-10 items-center gap-1.5 rounded bg-brand-500 px-4 text-theme-sm font-medium text-gray-950 hover:bg-brand-400 disabled:opacity-40";
const btnDanger = "inline-flex h-9 items-center rounded border border-error-300 px-3 text-theme-sm font-medium text-error-700 hover:bg-error-50 disabled:opacity-40 dark:border-error-500/40 dark:text-error-400";
const input =
  "w-full rounded border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-800 focus:border-brand-500 focus:outline-hidden disabled:opacity-70 dark:border-gray-700 dark:text-white/90";
const inlineLink = "text-gray-800 underline decoration-brand-500 underline-offset-2 hover:text-brand-600 dark:text-white/90 dark:hover:text-brand-400";

function Status({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return <span className={cn("inline-flex rounded px-2 py-0.5 text-theme-xs font-medium whitespace-nowrap", TONE_CLS[tone])}>{children}</span>;
}

/* Status frazy wobec nas – słowami, nie skrótami. */
const GAP_STATE: Record<string, { label: string; hint: string; tone: Tone }> = {
  missing: { label: "Nie ma nas", hint: "nie wyświetlamy się w wynikach", tone: "err" },
  weak: { label: "Poza TOP 10", hint: "za daleko, żeby dostawać ruch", tone: "warn" },
  covered: { label: "W TOP 10", hint: "już się wyświetlamy", tone: "ok" },
};
/** Długość tekstu wobec mediany czołówki: < 60% za krótko, 60–85% krócej, dalej w normie. */
const lengthTone = (words: number, median: number | null) => (!median ? "" : words / median < 0.6 ? "low" : words / median < 0.85 ? "mid" : "ok");
const LENGTH_BAR: Record<string, string> = { ok: "bg-success-500", mid: "bg-warning-500", low: "bg-error-500", "": "bg-brand-500" };
const shortUrl = (url: string) => String(url ?? "").replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
const countWords = (html: unknown) => String(html ?? "").replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
const lines = (value: string) => value.split("\n").map((l) => l.trim()).filter(Boolean);
const commaList = (value: string) => value.split(",").map((i) => i.trim()).filter(Boolean);

type OutlineDraft = { heading: string; words: string; points: string; keywords: string; prev: Any };
type BriefDraft = { title: string; angle: string; outline: OutlineDraft[]; faq: { question: string; prev: Any }[]; keywords: Any[] };

const toDraft = (project: Any): BriefDraft => {
  const brief = project.brief ?? {};
  return {
    title: project.title ?? brief.title ?? "",
    angle: brief.angle ?? "",
    outline: (brief.outline ?? []).map((row: Any) => ({
      heading: row.heading ?? "",
      words: row.words != null ? String(row.words) : "",
      points: (row.points ?? []).join("\n"),
      keywords: (row.keywords ?? []).join(", "),
      prev: row,
    })),
    faq: (brief.faq ?? []).map((row: Any) => ({ question: row.question ?? "", prev: row })),
    keywords: [...(brief.keywords_to_cover ?? [])],
  };
};
/** Stan formularza → obiekt w kontrakcie normalizeBrief (cw-writer.js). */
const fromDraft = (brief: Any, draft: BriefDraft): Any => ({
  ...brief,
  title: draft.title.trim(),
  angle: draft.angle.trim(),
  outline: draft.outline.map((row) => ({
    ...row.prev,
    heading: row.heading.trim(),
    words: Number.parseInt(row.words, 10) || null,
    points: lines(row.points),
    keywords: commaList(row.keywords),
  })),
  faq: draft.faq.map((row) => ({ ...row.prev, question: row.question.trim() })),
  keywords_to_cover: draft.keywords,
});

export default function ProjectWorkspace({ domain }: { domain: string }) {
  const [projectId, setProjectId] = useState<number | null>(null);
  const [project, setProject] = useState<Any | null>(null);
  const [briefJob, setBriefJob] = useState<Any | null>(null);
  const [writeJob, setWriteJob] = useState<Any | null>(null);
  const [research, setResearch] = useState<{ serp: Any | null; serpStatus: string; rivals: Any | null; rivalsStatus: string }>({
    serp: null,
    serpStatus: "idle",
    rivals: null,
    rivalsStatus: "idle",
  });
  const [publishing, setPublishing] = useState<{ authors: Any[]; categories: Any[] }>({ authors: [], categories: [] });
  const [ownKeywords, setOwnKeywords] = useState<Any[]>([]);
  const [message, setMessage] = useState<{ text: string; tone?: "err" | "ok" } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const base = projectId ? `/api/cw/writer/projects/${projectId}` : "";

  // Aktualny stan dla edytora (czyta go przez data() w chwili renderu).
  const live = useRef({ project, writeJob, ...publishing });
  live.current = { project, writeJob, ...publishing };

  const loadProject = useCallback(async (id: number) => {
    const { data } = await api<Any>(`/api/cw/writer/projects/${id}`);
    setProject(data.project);
    setBriefJob(data.brief_job);
    setWriteJob(data.write_job);
    return data;
  }, []);

  const refresh = useCallback(async () => {
    if (projectId) await loadProject(projectId);
  }, [projectId, loadProject]);

  useEffect(() => {
    const id = Number.parseInt(new URLSearchParams(location.search).get("id") ?? "", 10);
    if (!Number.isInteger(id) || id <= 0) {
      setLoadError("Adres nie wskazuje projektu – wróć do listy.");
      return;
    }
    setProjectId(id);
    const b = `/api/cw/writer/projects/${id}`;
    Promise.all([
      loadProject(id),
      Promise.all([api<Any>(`${b}/serp`).catch(() => ({ data: { status: "idle" } })), api<Any>(`${b}/rivals`).catch(() => ({ data: { status: "idle" } }))]).then(
        ([serp, rivals]) =>
          setResearch({ serp: serp.data.analysis ?? null, serpStatus: serp.data.status, rivals: rivals.data.analysis ?? null, rivalsStatus: rivals.data.status }),
      ),
      // Nasze frazy z katalogu (Senuto, build) – po nich luka SERP-a mówi, co już pokrywamy.
      fetch(`/${domain}/content-writer/data.json`)
        .then((r) => (r.ok ? r.json() : {}))
        .then((d: Any) => setOwnKeywords(d.own_keywords ?? []))
        .catch(() => setOwnKeywords([])),
      Promise.all([
        api<Any>(`/api/cw/authors/${domain}`).catch(() => ({ data: { authors: [] } })),
        api<Any>(`/api/cw/writer/categories/${domain}`).catch(() => ({ data: { categories: [] } })),
      ]).then(([a, c]) => setPublishing({ authors: a.data.authors ?? [], categories: c.data.categories ?? [] })),
    ]).catch((e) => setLoadError((e as Error).message));
  }, [domain, loadProject]);

  /* Przebieg w toku – odświeżanie co 8 s. */
  const running = project && ["brief_running", "writing"].includes(project.status);
  useEffect(() => {
    if (!running) return;
    const timer = setTimeout(() => refresh().catch((e) => setMessage({ text: (e as Error).message, tone: "err" })), 8000);
    return () => clearTimeout(timer);
  }, [running, project, refresh]);

  useEffect(() => {
    if (project?.status === "failed" && project.error) setMessage({ text: `Przebieg przerwany: ${project.error}`, tone: "err" });
  }, [project?.status, project?.error]);

  const startStage = async (stage: "brief" | "write") => {
    if (stage === "brief" && (project.brief || writeJob) && !confirm("Nowy brief zastąpi obecny razem z Twoimi poprawkami i tekstem, który z niego powstał. Kontynuować?")) return;
    if (stage === "write" && writeJob && !confirm("Nowy tekst zastąpi obecny razem z poprawkami z edytora. Kontynuować?")) return;
    setMessage({ text: stage === "brief" ? "Uruchamiam przygotowanie briefu…" : "Uruchamiam pisanie tekstu…" });
    try {
      await api(`${base}/${stage}`, { method: "POST", body: {} });
      setMessage(null);
      await refresh();
    } catch (e) {
      setMessage({ text: (e as Error).message, tone: "err" });
    }
  };

  const closeProject = async () => {
    if (!confirm("Zamknąć projekt? Fraza wróci do puli, szkic w WordPressie zostanie bez zmian.")) return;
    try {
      await api(base, { method: "PATCH", body: { cancel: true } });
      location.href = `/${domain}/content-writer/`;
    } catch (e) {
      setMessage({ text: (e as Error).message, tone: "err" });
    }
  };

  /* ---------- pełnoekranowy edytor tekstu (moduł z legacy/) ---------- */
  const editorRef = useRef<HTMLDivElement>(null);
  const editor = useRef<ReturnType<typeof createEditor> | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const textReady = project?.status === "written" && writeJob?.status === "done";

  useEffect(() => {
    if (!base || !editorRef.current || editor.current) return;
    ensureHighlights();
    editor.current = createEditor({
      base,
      domain,
      root: editorRef.current,
      data: () => ({ project: live.current.project, job: live.current.writeJob, authors: live.current.authors, categories: live.current.categories }),
      refresh: () => refresh(),
      exit: () => {
        history.replaceState(null, "", "#etapy");
        setEditorOpen(false);
      },
    });
  }, [base, domain, refresh]);

  // Gotowy tekst otwiera się od razu w edytorze, chyba że redaktor świadomie wrócił do etapów (#etapy).
  const autoOpened = useRef(false);
  useEffect(() => {
    if (textReady && !autoOpened.current && editor.current) {
      autoOpened.current = true;
      if (location.hash !== "#etapy") setEditorOpen(true);
    }
    if (!textReady) setEditorOpen(false);
  }, [textReady, editor.current]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    document.documentElement.classList.toggle("we-open", editorOpen);
    if (editorOpen) editor.current?.render().catch((e: Error) => setMessage({ text: e.message, tone: "err" }));
    return () => document.documentElement.classList.remove("we-open");
  }, [editorOpen, project, writeJob]);

  const openEditor = () => {
    history.replaceState(null, "", "#edytor");
    setEditorOpen(true);
  };

  return (
    <>
      <Link href={`/${domain}/content-writer/`} className="mb-4 inline-flex items-center gap-1.5 text-theme-sm text-gray-500 hover:text-brand-600 dark:text-gray-400">
        <ArrowLeft className="size-4" /> wszystkie projekty
      </Link>

      {loadError ? (
        <Card className="p-6">
          <h1 className="text-title-sm font-medium">{projectId ? "Nie udało się wczytać projektu" : "Brak projektu"}</h1>
          <p className="mt-2 text-theme-sm text-error-600">{loadError}</p>
        </Card>
      ) : !project ? (
        <p className="flex items-center gap-2 text-theme-sm text-gray-500">
          <Loader2 className="size-4 animate-spin" /> Wczytuję projekt…
        </p>
      ) : (
        <>
          <Header project={project} briefJob={briefJob} writeJob={writeJob} research={research} textReady={textReady} openEditor={openEditor} />
          {message && <p className={cn("mt-3 text-theme-sm", message.tone === "err" ? "text-error-600 dark:text-error-400" : "text-gray-600 dark:text-gray-400")}>{message.text}</p>}
          <Run project={project} job={project.status === "writing" ? writeJob : project.status === "brief_running" ? briefJob : null} refresh={refresh} onError={(t) => setMessage({ text: t, tone: "err" })} />
          <Research
            base={base}
            project={project}
            briefJob={briefJob}
            research={research}
            setResearch={setResearch}
            ownKeywords={ownKeywords}
            startBrief={() => startStage("brief")}
          />
          <Brief key={`${project.id}-${project.updated_at}`} base={base} project={project} setProject={setProject} startWrite={() => startStage("write")} />
          {textReady && (
            <section id="wr-text" className="scroll-mt-24">
              <SectionHead title="Tekst" />
              <Card className="p-5">
                <p className="font-medium text-gray-800 dark:text-white/90">{project.title || project.keyword}</p>
                <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
                  {(writeJob.sections ?? []).length} bloków treści
                  {project.wp_draft_url && ` · szkic w WordPressie z ${fmtDateTime(project.wp_saved_at)}`}
                </p>
                <button type="button" className={cn(btnPrimary, "mt-4")} onClick={openEditor}>
                  Otwórz edytor
                </button>
              </Card>
            </section>
          )}
          {!running && (
            <div className="mt-8">
              <button type="button" className={btnDanger} onClick={closeProject}>
                Zamknij projekt
              </button>
            </div>
          )}
        </>
      )}

      <div className="legacy">
        <div className="we" ref={editorRef} hidden={!editorOpen} />
      </div>
    </>
  );
}

/* ---------- nagłówek i kroki ---------- */

function stepIndex(project: Any, briefJob: Any, writeJob: Any) {
  const s = project.status;
  if (s === "research") return 0;
  if (s === "brief_running" || s === "brief_ready") return 1;
  if (s === "writing") return 2;
  if (s === "written") return project.wp_post_id ? 4 : 3;
  return writeJob ? 2 : briefJob ? 1 : 0;
}

function Header({
  project,
  briefJob,
  writeJob,
  research,
  textReady,
  openEditor,
}: {
  project: Any;
  briefJob: Any;
  writeJob: Any;
  research: Any;
  textReady: boolean;
  openEditor: () => void;
}) {
  const current = stepIndex(project, briefJob, writeJob);
  const brief = project.brief as Any | null;
  const queries = (research.serp?.queries ?? []) as Any[];
  const competitors = ((queries.find((r) => r.kind === "title") ?? queries[0])?.competitors ?? []).length;
  const gapCount = (research.serp?.gap ?? []).length;
  // Tak samo jak licznik edytora: wstęp + sekcje + FAQ, bez listy źródeł.
  const words = countWords(project.lead) + ((writeJob?.sections ?? []) as Any[]).filter((r) => r.slot < 200).reduce((sum, r) => sum + countWords(r.text_after), 0);
  const running = ["brief_running", "writing"].includes(project.status);

  const steps = [
    {
      title: "Konkurencja w wynikach",
      target: "wr-research",
      done: research.serp ? `${competitors} stron z czołówki, ${gapCount} fraz${research.rivals ? ", teksty przeczytane" : ""}` : "pominięty",
      todo: "sprawdź, kto jest w czołówce Google",
    },
    {
      title: "Brief",
      target: "wr-brief",
      done: brief
        ? `${(brief.outline ?? []).length} sekcji, ${(brief.faq ?? []).length} pytań FAQ${project.brief_accepted_at ? `, zatwierdzony ${fmtDateTime(project.brief_accepted_at)}` : ""}`
        : "",
      todo: project.status === "brief_running" ? "model przygotowuje plan…" : project.status === "brief_ready" ? "popraw plan i zatwierdź" : "plan sekcji i fraz",
    },
    { title: "Tekst", target: "text", done: `${fmtInt(words)} słów`, todo: project.status === "writing" ? "model pisze tekst…" : "powstaje z zatwierdzonego briefu" },
    {
      title: "Szkic w WordPressie",
      target: "text",
      done: project.wp_saved_at ? `zapisany ${fmtDateTime(project.wp_saved_at)}` : "",
      todo: "wybierz autora i kategorię, zapisz szkic",
    },
  ];

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-title-sm font-medium text-gray-800 dark:text-white/90">{project.keyword}</h1>
        <Status tone={(STATUS_TONE[project.status] ?? "idle") as Tone}>{STATUS_LABEL[project.status] ?? project.status}</Status>
      </div>
      <nav aria-label="Etapy" className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {steps.map((step, index) => {
          const stage = index < current ? "done" : index === current ? (running ? "running" : project.status === "failed" ? "failed" : "current") : "todo";
          const label = { done: "Gotowe", running: "W toku", current: "Teraz", failed: "Przerwany", todo: "Później" }[stage];
          const detail = stage === "done" ? step.done : step.todo;
          return (
            <button
              key={step.title}
              type="button"
              onClick={() => (step.target === "text" && textReady ? openEditor() : document.getElementById(step.target)?.scrollIntoView({ behavior: "smooth", block: "start" }))}
              className={cn(
                "flex items-start gap-3 rounded-2xl border bg-white p-4 text-left transition dark:bg-white/3",
                stage === "current" || stage === "running" ? "border-brand-500 ring-1 ring-brand-500" : stage === "failed" ? "border-error-400" : "border-gray-200 dark:border-gray-800",
              )}
            >
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-theme-xs font-medium",
                  stage === "done"
                    ? "bg-success-500 text-white"
                    : stage === "failed"
                      ? "bg-error-500 text-white"
                      : stage === "todo"
                        ? "bg-gray-100 text-gray-500 dark:bg-white/5"
                        : "bg-brand-500 text-gray-950",
                )}
              >
                {stage === "done" ? <Check className="size-4" /> : stage === "running" ? <Loader2 className="size-4 animate-spin" /> : stage === "failed" ? "!" : index + 1}
              </span>
              <span className="min-w-0">
                <span className="block text-theme-sm font-medium text-gray-800 dark:text-white/90">{step.title}</span>
                <span className="block text-theme-xs text-gray-500 dark:text-gray-400">
                  <b className="font-medium">{label}</b>
                  {detail && ` – ${detail}`}
                </span>
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
}

/* ---------- przebieg w toku ---------- */

function Run({ project, job, refresh, onError }: { project: Any; job: Any | null; refresh: () => Promise<void>; onError: (t: string) => void }) {
  const [busy, setBusy] = useState(false);
  if (!job) return null;
  const steps = (job.steps ?? []) as Any[];
  return (
    <section>
      <SectionHead
        title={project.status === "writing" ? "Piszę tekst" : "Przygotowuję brief"}
        meta={
          <>
            odświeżam co kilka sekund
            {job.run_url && (
              <>
                {" · "}
                <a className={inlineLink} href={job.run_url} target="_blank" rel="noopener">
                  log przebiegu
                </a>
              </>
            )}
          </>
        }
      />
      <Card className="p-5">
        {steps.length ? (
          <ul className="flex flex-col gap-2">
            {steps.map((step, i) => (
              <li key={i} className="flex flex-wrap items-center gap-2 text-theme-sm">
                <Status tone={step.status === "done" ? "ok" : step.status === "failed" ? "err" : step.status === "skipped" ? "idle" : "mid"}>{step.step}</Status>
                {step.error && <span className="text-gray-500">{step.error}</span>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-theme-sm text-gray-500">Czekam na start przebiegu w GitHub Actions…</p>
        )}
        <button
          type="button"
          className={cn(btnDanger, "mt-4")}
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await api(`/api/cw/jobs/${job.id}/cancel`, { method: "POST", body: {} });
              await refresh();
            } catch (e) {
              onError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          Zatrzymaj przebieg
        </button>
      </Card>
    </section>
  );
}

/* ---------- research ---------- */

function Research({
  base,
  project,
  briefJob,
  research,
  setResearch,
  ownKeywords,
  startBrief,
}: {
  base: string;
  project: Any;
  briefJob: Any;
  research: { serp: Any | null; serpStatus: string; rivals: Any | null; rivalsStatus: string };
  setResearch: React.Dispatch<React.SetStateAction<{ serp: Any | null; serpStatus: string; rivals: Any | null; rivalsStatus: string }>>;
  ownKeywords: Any[];
  startBrief: () => void;
}) {
  const [busy, setBusy] = useState<Set<string>>(new Set());
  const [msg, setMsg] = useState<{ text: string; err?: boolean } | null>(null);
  const [gapFilter, setGapFilter] = useState<"all" | "missing" | "weak" | "covered">("all");
  const { serp, rivals } = research;
  const queries = (serp?.queries ?? []) as Any[];
  const query = queries.find((r) => r.kind === "title") ?? queries[0];
  const competitors = (query?.competitors ?? []) as Any[];
  const ours = (query?.ours ?? null) as Any | null;
  const gap = (serp?.gap ?? []) as Any[];
  const facts = (rivals?.facts ?? []) as Any[];
  const pages = new Map(((rivals?.rivals ?? []) as Any[]).map((r) => [r.url, r]));
  const median = (rivals?.median_words ?? null) as number | null;
  const maxWords = Math.max(median ?? 0, ...[...pages.values()].map((r) => r.words ?? 0), 1);
  const briefKeys = useMemo(() => new Set(((project.brief?.keywords_to_cover ?? []) as Any[]).map((r) => phraseKey(r.keyword))), [project.brief]);
  const count = (status: string) => gap.filter((r) => r.status === status).length;
  const serpBusy = research.serpStatus === "running" || busy.has("serp");
  const rivalsBusy = research.rivalsStatus === "running" || busy.has("rivals");
  const canBrief = ["research", "brief_ready", "failed"].includes(project.status);

  /** Analiza idzie krokami (SerpData ~20 s na zapytanie) – ponawiamy POST, aż dojdzie do końca. */
  const run = async (kind: "serp" | "rivals") => {
    setBusy((b) => new Set(b).add(kind));
    setMsg(null);
    const body = kind === "serp" ? { own_keywords: ownKeywords } : { rivals: competitors.map((r) => r.url).slice(0, 5) };
    let force = Boolean(kind === "serp" ? serp : rivals);
    try {
      for (let attempt = 0; attempt < 40; attempt++) {
        const { status, data } = await api<Any>(`${base}/${kind}${force ? "?force=1" : ""}`, { method: "POST", body });
        force = false;
        if (data.status === "done") {
          setResearch((r) => (kind === "serp" ? { ...r, serp: data.analysis, serpStatus: "done" } : { ...r, rivals: data.analysis, rivalsStatus: "done" }));
          break;
        }
        if (status !== 202 && data.status !== "running") throw new Error(data.error ?? "Analiza nie doszła do końca.");
        setMsg({ text: data.stage_label ?? "Analiza w toku…" });
        await sleep(5000);
      }
      setMsg(null);
    } catch (e) {
      setMsg({ text: (e as Error).message, err: true });
    } finally {
      setBusy((b) => {
        const n = new Set(b);
        n.delete(kind);
        return n;
      });
    }
  };

  const maxSearches = Math.max(...gap.map((r) => r.searches ?? 0), 1);
  const gapColumns = useMemo<ColDef<Any>[]>(
    () => [
      { field: "keyword", headerName: "Fraza", flex: 1, minWidth: 200, cellClass: "font-medium" },
      {
        field: "searches",
        headerName: "Wyszukiwań / mies.",
        width: 180,
        type: "rightAligned",
        sort: "desc",
        cellRenderer: ({ value }: { value: number }) => (
          <span className="inline-flex w-full items-center justify-end gap-3 tabular-nums">
            {fmtInt(value)}
            <span className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-100 dark:bg-white/5">
              <i className="block h-full rounded-full bg-brand-500" style={{ width: `${Math.round(((value ?? 0) / maxSearches) * 100)}%` }} />
            </span>
          </span>
        ),
      },
      {
        headerName: "Najwyżej z konkurencji",
        colId: "rival",
        width: 210,
        valueGetter: ({ data }) => `${data?.rival_host ? `${data.rival_host}, ` : ""}${data?.rival_position ? `${data.rival_position}. miejsce` : "–"}`,
      },
      {
        field: "status",
        headerName: "Nasze miejsce",
        width: 220,
        autoHeight: true,
        cellRenderer: ({ data }: { data?: Any }) =>
          data && (
            <span className="flex flex-col py-2 leading-tight">
              <Status tone={GAP_STATE[data.status]?.tone ?? "idle"}>{GAP_STATE[data.status]?.label ?? data.status}</Status>
              <small className="mt-1 text-theme-xs text-gray-500">{data.our_position ? `jesteśmy na ${data.our_position}. miejscu` : (GAP_STATE[data.status]?.hint ?? "")}</small>
            </span>
          ),
      },
      ...(project.brief
        ? [
            {
              headerName: "W briefie",
              colId: "brief",
              width: 110,
              valueGetter: ({ data }: { data?: Any }) => (data && briefKeys.has(phraseKey(data.keyword)) ? "tak" : "nie"),
              cellRenderer: ({ value }: { value: string }) => <Status tone={value === "tak" ? "ok" : "idle"}>{value}</Status>,
            } as ColDef<Any>,
          ]
        : []),
    ],
    [maxSearches, project.brief, briefKeys],
  );

  const tile = (value: string, label: string, tone: "" | "ok" | "mid" | "low" = "") => (
    <Card className="p-4">
      <p className={cn("text-title-sm font-medium tabular-nums", tone === "ok" ? "text-success-600" : tone === "mid" ? "text-warning-600" : tone === "low" ? "text-error-600" : "text-gray-800 dark:text-white/90")}>
        {value}
      </p>
      <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">{label}</p>
    </Card>
  );

  return (
    <section id="wr-research" className="scroll-mt-24">
      <SectionHead title="Konkurencja w wynikach wyszukiwania" meta="dane z SerpData i Senuto, zapamiętane na tydzień" />
      <p className="-mt-2 mb-4 max-w-3xl text-theme-sm text-gray-600 dark:text-gray-400">
        Kto jest w czołówce Google na „{project.keyword}”, ile piszą i na jakie frazy się wyświetlają. Z tego powstaje brief: plan sekcji i frazy, które tekst ma pokryć.
      </p>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button type="button" className={btn} disabled={serpBusy} onClick={() => run("serp")}>
          {serpBusy && <Loader2 className="size-4 animate-spin" />}
          {serpBusy ? "Sprawdzam wyniki Google…" : serp ? "Sprawdź wyniki Google ponownie" : "Sprawdź wyniki Google"}
        </button>
        <button type="button" className={btn} disabled={!competitors.length || rivalsBusy} onClick={() => run("rivals")}>
          {rivalsBusy && <Loader2 className="size-4 animate-spin" />}
          {rivalsBusy ? "Czytam teksty konkurentów…" : rivals ? "Przeczytaj teksty ponownie" : "Przeczytaj teksty konkurentów"}
        </button>
        {canBrief && (
          <button type="button" className={btnPrimary} onClick={startBrief}>
            {project.brief || briefJob ? "Przygotuj brief od nowa" : "Przygotuj brief"}
          </button>
        )}
        {msg && <span className={cn("text-theme-sm", msg.err ? "text-error-600" : "text-gray-500")}>{msg.text}</span>}
      </div>

      {!serp ? (
        <p className="text-theme-sm text-gray-500">Research jest opcjonalny, ale bez niego brief nie zna fraz konkurencji, a edytor nie pokaże, ile razy użyć każdej frazy.</p>
      ) : (
        <div className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
          {tile(ours?.position ? `${ours.position}.` : "poza TOP 10", "nasza pozycja na tę frazę", ours?.position ? (ours.position <= 3 ? "ok" : "mid") : "low")}
          {tile(median ? fmtInt(median) : "–", median ? "słów ma typowy tekst z czołówki" : "długość poznasz po przeczytaniu tekstów")}
          {tile(String(count("missing")), "fraz konkurencji, na które nas nie ma", count("missing") ? "low" : "ok")}
          {tile(String(count("weak")), "fraz, na których jesteśmy poza TOP 10", count("weak") ? "mid" : "ok")}
        </div>
      )}

      {competitors.length > 0 && (
        <Card className="mb-5 p-5">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-base font-medium text-gray-800 dark:text-white/90">Czołówka wyników</h3>
            <span className="text-theme-xs text-gray-500">{pages.size ? "długość tekstu wobec typowej długości w czołówce" : "przeczytaj teksty, żeby zobaczyć ich długość"}</span>
          </div>
          {pages.size > 0 && median && (
            <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-theme-xs text-gray-500">
              <li className="flex items-center gap-1.5">
                <i className="size-2 rounded-full bg-success-500" />w normie – co najmniej 85% typowej długości
              </li>
              <li className="flex items-center gap-1.5">
                <i className="size-2 rounded-full bg-warning-500" />krótszy – 60–85%
              </li>
              <li className="flex items-center gap-1.5">
                <i className="size-2 rounded-full bg-error-500" />dużo krótszy – poniżej 60%
              </li>
              <li className="flex items-center gap-1.5">
                <i className="h-3 w-0.5 bg-gray-800 dark:bg-white" />typowa długość: {fmtInt(median)} słów
              </li>
            </ul>
          )}
          <ol className="divide-y divide-gray-100 dark:divide-gray-800">
            {competitors.map((row) => {
              const page = pages.get(row.url);
              const words = page?.words ?? null;
              return (
                <li key={row.url} className="grid grid-cols-[28px_minmax(0,1fr)_200px] items-center gap-3 py-2.5">
                  <span className="text-theme-sm font-medium text-gray-500 tabular-nums">{row.position ?? "–"}</span>
                  <span className="min-w-0">
                    <a className={cn(inlineLink, "block truncate text-theme-sm")} href={row.url} target="_blank" rel="noopener noreferrer">
                      {row.title || page?.title || row.host}
                    </a>
                    <span className="block truncate text-theme-xs text-gray-500">{shortUrl(row.url)}</span>
                  </span>
                  <span className="text-theme-xs text-gray-500">
                    {words ? (
                      <>
                        {fmtInt(words)} słów
                        <span className="relative mt-1 block h-1.5 rounded-full bg-gray-100 dark:bg-white/5">
                          <i className={cn("block h-full rounded-full", LENGTH_BAR[lengthTone(words, median)])} style={{ width: `${Math.round((words / maxWords) * 100)}%` }} />
                          {median && <i className="absolute -top-0.5 h-2.5 w-0.5 bg-gray-800 dark:bg-white" style={{ left: `${Math.round((median / maxWords) * 100)}%` }} />}
                        </span>
                      </>
                    ) : page?.error ? (
                      "nie udało się przeczytać"
                    ) : (
                      "–"
                    )}
                  </span>
                </li>
              );
            })}
            {ours && (
              <li className="grid grid-cols-[28px_minmax(0,1fr)_200px] items-center gap-3 bg-brand-25 py-2.5 dark:bg-brand-500/6">
                <span className="text-theme-sm font-medium tabular-nums">{ours.position}</span>
                <span className="min-w-0">
                  <a className={cn(inlineLink, "block truncate text-theme-sm")} href={ours.url} target="_blank" rel="noopener">
                    {ours.title || ours.host}
                  </a>
                  <span className="block truncate text-theme-xs text-gray-500">nasza strona: {shortUrl(ours.url)}</span>
                </span>
                <span />
              </li>
            )}
          </ol>
        </Card>
      )}

      {gap.length > 0 && (
        <div className="mb-5">
          <DataGrid<Any>
            key={gapFilter}
            title="Frazy, na które wyświetla się konkurencja"
            meta="frazy, na które strony z czołówki są wysoko w Google, i nasze miejsce na każdą z nich"
            rows={gap}
            columns={gapColumns}
            externalFilter={gapFilter === "all" ? null : (r: Any) => r.status === gapFilter}
            rowKey={(r) => r.keyword}
            fitContent
            pageSize={15}
            actions={
              <Segmented
                label="Filtr fraz"
                value={gapFilter}
                onChange={setGapFilter}
                options={[
                  { value: "all" as const, label: `Wszystkie · ${gap.length}` },
                  ...(["missing", "weak", "covered"] as const).map((s) => ({ value: s, label: `${GAP_STATE[s].label} · ${count(s)}` })),
                ]}
              />
            }
          />
        </div>
      )}

      {facts.length > 0 && (
        <Card className="p-5">
          <h3 className="text-base font-medium text-gray-800 dark:text-white/90">Konkrety z tekstów konkurencji</h3>
          <p className="mb-4 text-theme-xs text-gray-500">liczby i fakty z czołówki – brief przekazuje je modelowi, który pisze tekst</p>
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {facts.map((row, i) => (
              <li key={i} className="flex flex-col justify-between rounded border-l-4 border-brand-500 bg-gray-50 p-4 text-theme-sm dark:bg-white/3">
                <p className="text-gray-800 dark:text-white/90">{row.fact}</p>
                {row.source && (
                  <a className="mt-3 text-theme-xs text-gray-500 hover:text-brand-600" href={row.source} target="_blank" rel="noopener noreferrer">
                    źródło: {String(row.source).replace(/^https?:\/\/(www\.)?/, "").split("/")[0]}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </section>
  );
}

/* ---------- brief ---------- */

function Brief({ base, project, setProject, startWrite }: { base: string; project: Any; setProject: (p: Any) => void; startWrite: () => void }) {
  const brief = project.brief as Any | null;
  const [draft, setDraft] = useState<BriefDraft>(() => toDraft(project));
  const [msg, setMsg] = useState<{ text: string; err?: boolean } | null>(null);
  const [saving, setSaving] = useState(false);
  const [manual, setManual] = useState(false);
  if (!brief) return null;

  const editable = ["brief_ready", "failed", "written"].includes(project.status);
  const locked = !editable || project.status === "written";

  if (brief.skip && !manual) {
    return (
      <section id="wr-brief" className="scroll-mt-24">
        <SectionHead title="Brief" />
        <Card className="p-5">
          <p className="text-theme-sm">
            <b className="font-medium">Model nie przygotował planu.</b> {brief.reason || "Brak uzasadnienia."}
          </p>
          <button
            type="button"
            className={cn(btn, "mt-4")}
            onClick={() => {
              setDraft({ ...toDraft({ ...project, brief: { ...brief, skip: false } }), outline: [{ heading: "", words: "300", points: "", keywords: "", prev: { basis: "plan ręczny" } }] });
              setManual(true);
            }}
          >
            Uzupełnij plan ręcznie
          </button>
        </Card>
      </section>
    );
  }

  const set = (patch: Partial<BriefDraft>) => setDraft((d) => ({ ...d, ...patch }));
  const setRow = (i: number, patch: Partial<OutlineDraft>) => set({ outline: draft.outline.map((r, j) => (j === i ? { ...r, ...patch } : r)) });
  const move = (i: number, dir: number) => {
    const next = [...draft.outline];
    const [item] = next.splice(i, 1);
    next.splice(i + dir, 0, item);
    set({ outline: next });
  };

  const save = async () => {
    const next = fromDraft({ ...brief, skip: manual ? false : brief.skip, reason: manual ? "" : brief.reason }, draft);
    next.outline = next.outline.filter((r: Any) => r.heading);
    next.faq = next.faq.filter((r: Any) => r.question);
    if (!next.outline.length) {
      setMsg({ text: "Plan musi mieć co najmniej jedną sekcję z nagłówkiem.", err: true });
      return false;
    }
    setSaving(true);
    try {
      const body: Any = { brief: next };
      if (next.title) body.title = next.title;
      const { data } = await api<Any>(base, { method: "PATCH", body });
      setProject(data.project);
      setMsg({ text: "Zapisano." });
      return true;
    } catch (e) {
      setMsg({ text: (e as Error).message, err: true });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const content = (
    <>
      <Card className="p-5">
        <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
          Tytuł artykułu (H1)
          <input className={cn(input, "mt-1.5")} maxLength={200} value={draft.title} disabled={locked} onChange={(e) => set({ title: e.target.value })} />
        </label>
        <dl className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          {(
            [
              [brief.main_keyword || project.keyword, "fraza główna"],
              [fmtInt(brief.target_words), "docelowo słów"],
              [String(draft.outline.length), "sekcji"],
              [String(draft.faq.length), "pytań FAQ"],
            ] as const
          ).map(([v, l]) => (
            <div key={l} className="rounded bg-gray-50 px-3 py-2.5 dark:bg-white/3">
              <dd className="truncate font-medium text-gray-800 dark:text-white/90">{v}</dd>
              <dt className="text-theme-xs text-gray-500">{l}</dt>
            </div>
          ))}
        </dl>
        {brief.intent && (
          <p className="mt-3 text-theme-sm text-gray-600 dark:text-gray-400">
            <b className="font-medium text-gray-800 dark:text-white/90">Intencja:</b> {brief.intent}
          </p>
        )}
        <label className="mt-4 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
          Czym tekst ma się wyróżnić
          <textarea className={cn(input, "mt-1.5")} rows={2} value={draft.angle} disabled={locked} onChange={(e) => set({ angle: e.target.value })} />
        </label>
      </Card>

      <SectionHead title="Plan sekcji" meta="kolejność = kolejność w artykule" />
      <div className="flex flex-col gap-3">
        {draft.outline.map((row, i) => (
          <Card key={i} className="flex gap-3 p-4">
            <span className="mt-2 w-6 shrink-0 text-theme-sm font-medium text-gray-400 tabular-nums">{i + 1}</span>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="grid grid-cols-[minmax(0,1fr)_120px] gap-2">
                <input className={input} placeholder="Nagłówek H2" value={row.heading} disabled={locked} onChange={(e) => setRow(i, { heading: e.target.value })} />
                <input className={input} type="number" min={50} max={1500} step={50} aria-label="Liczba słów" value={row.words} disabled={locked} onChange={(e) => setRow(i, { words: e.target.value })} />
              </div>
              <textarea className={input} rows={2} placeholder="Co ma paść w sekcji – jeden punkt w wierszu" value={row.points} disabled={locked} onChange={(e) => setRow(i, { points: e.target.value })} />
              <input className={input} placeholder="Frazy w tej sekcji, po przecinku" value={row.keywords} disabled={locked} onChange={(e) => setRow(i, { keywords: e.target.value })} />
              {row.prev?.basis && <span className="text-theme-xs text-gray-500">Podstawa: {row.prev.basis}</span>}
            </div>
            {!locked && (
              <div className="flex shrink-0 flex-col gap-1">
                <button type="button" className={cn(btn, "h-8 px-2")} aria-label="W górę" disabled={i === 0} onClick={() => move(i, -1)}>
                  <ArrowUp className="size-4" />
                </button>
                <button type="button" className={cn(btn, "h-8 px-2")} aria-label="W dół" disabled={i === draft.outline.length - 1} onClick={() => move(i, 1)}>
                  <ArrowDown className="size-4" />
                </button>
                <button type="button" className={cn(btnDanger, "h-8 px-2")} aria-label="Usuń sekcję" onClick={() => set({ outline: draft.outline.filter((_, j) => j !== i) })}>
                  <X className="size-4" />
                </button>
              </div>
            )}
          </Card>
        ))}
      </div>
      {!locked && (
        <button
          type="button"
          className={cn(btn, "mt-3")}
          onClick={() => set({ outline: [...draft.outline, { heading: "", words: "300", points: "", keywords: "", prev: { basis: "dodane przez redaktora" } }] })}
        >
          <Plus className="size-4" /> Dodaj sekcję
        </button>
      )}

      <SectionHead title="Pytania FAQ" />
      <Card className="flex flex-col gap-2 p-4">
        {draft.faq.map((row, i) => (
          <div key={i} className="flex gap-2">
            <input
              className={input}
              value={row.question}
              disabled={locked}
              onChange={(e) => set({ faq: draft.faq.map((r, j) => (j === i ? { ...r, question: e.target.value } : r)) })}
            />
            {!locked && (
              <button type="button" className={cn(btnDanger, "h-10 px-2")} aria-label="Usuń pytanie" onClick={() => set({ faq: draft.faq.filter((_, j) => j !== i) })}>
                <X className="size-4" />
              </button>
            )}
          </div>
        ))}
        {!locked && (
          <button type="button" className={cn(btn, "self-start")} onClick={() => set({ faq: [...draft.faq, { question: "", prev: { basis: "dodane przez redaktora" } }] })}>
            <Plus className="size-4" /> Dodaj pytanie
          </button>
        )}
      </Card>

      <SectionHead title="Frazy do pokrycia" meta="po nich liczymy pokrycie gotowego tekstu" />
      <Card className="p-4">
        {draft.keywords.length ? (
          <table className="w-full text-theme-sm">
            <thead className="text-left text-theme-xs text-gray-500">
              <tr>
                <th className="py-2 font-medium">Fraza</th>
                <th className="py-2 text-right font-medium">Wyszukiwania</th>
                <th className="py-2 pl-4 font-medium">Gdzie</th>
                <th />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {draft.keywords.map((row, i) => (
                <tr key={`${row.keyword}-${i}`}>
                  <td className="py-2">{row.keyword}</td>
                  <td className="py-2 text-right tabular-nums">{fmtInt(row.volume)}</td>
                  <td className="py-2 pl-4 text-gray-500">{row.where}</td>
                  <td className="py-2 text-right">
                    {!locked && (
                      <button type="button" className={cn(btnDanger, "h-7 px-1.5")} aria-label="Usuń frazę" onClick={() => set({ keywords: draft.keywords.filter((_, j) => j !== i) })}>
                        <X className="size-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-theme-sm text-gray-500">Brief nie wskazał fraz.</p>
        )}
        {(brief.keywords_rejected ?? []).length > 0 && (
          <p className="mt-3 text-theme-sm text-gray-600 dark:text-gray-400">
            Odrzucone:{" "}
            {(brief.keywords_rejected as Any[]).map((row, i) => (
              <span key={i}>
                {i > 0 && ", "}
                {row.keyword} <span className="text-gray-400">({row.why})</span>
              </span>
            ))}
          </p>
        )}
        {(brief.facts_to_use ?? []).length > 0 && (
          <>
            <h4 className="mt-4 mb-2 text-theme-sm font-medium">Konkrety do wykorzystania</h4>
            <ul className="list-disc pl-5 text-theme-sm text-gray-600 dark:text-gray-400">
              {(brief.facts_to_use as Any[]).map((row, i) => (
                <li key={i}>{row.fact}</li>
              ))}
            </ul>
          </>
        )}
      </Card>

      {!locked && (
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button type="button" className={btn} disabled={saving} onClick={save}>
            Zapisz brief
          </button>
          <button
            type="button"
            className={btnPrimary}
            disabled={saving}
            onClick={async () => {
              if (await save()) startWrite();
            }}
          >
            Zatwierdź i napisz tekst
          </button>
          {msg && <span className={cn("text-theme-sm", msg.err ? "text-error-600" : "text-success-600")}>{msg.text}</span>}
        </div>
      )}
    </>
  );

  return (
    <section id="wr-brief" className="scroll-mt-24">
      <SectionHead title="Brief" meta={project.brief_accepted_at ? `zatwierdzony ${fmtDateTime(project.brief_accepted_at)}` : "popraw plan i zatwierdź – z tej wersji pisze model"} />
      {project.status === "written" ? (
        // Przy gotowym tekście brief to już tylko ślad decyzji – zwinięty, żeby pierwszy ekran należał do tekstu.
        <details className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/3">
          <summary className="cursor-pointer text-theme-sm font-medium text-gray-700 dark:text-gray-300">
            Brief, z którego powstał tekst · {draft.outline.length} sekcji, {draft.faq.length} pytań FAQ
          </summary>
          <div className="mt-4">{content}</div>
          <button type="button" className={cn(btn, "mt-4")} onClick={startWrite}>
            Napisz tekst od nowa z tego briefu
          </button>
        </details>
      ) : (
        content
      )}
    </section>
  );
}
