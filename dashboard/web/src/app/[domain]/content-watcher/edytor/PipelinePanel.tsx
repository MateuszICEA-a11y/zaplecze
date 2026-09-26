"use client";

/* Belka pipeline'u: konfiguracja (zakres, modele) → postęp → podsumowanie
   albo karta błędu, oś przebiegu i wytyczne z analizy. Znaczniki i klasy
   z dawnego edytora (style z legacy.css, kontener .legacy w PostEditor). */
import { Status } from "@/components/kit";
import { isRunning, schedulePoll } from "@/lib/cw-editor/jobs";
import { DEFAULT_MODELS, editorStore, showEditorError, useEditor } from "@/lib/cw-editor/store";
import type { Job, Step } from "@/lib/cw-editor/types";
import { api, type ApiError } from "@/lib/writer-client";
import { useEffect, useRef, useState } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */
const pl = new Intl.NumberFormat("pl-PL");

// Lustro config.py (STEPS + OPTIONAL_STEPS) – przy zmianie kolejności kroków
// pipeline'u zaktualizuj oba miejsca.
const STEP_ORDER = ["fetch", "keywords_own", "serp", "competitors", "keywords_competitors", "brief", "rewrite", "coverage", "expert", "sources", "internal_links", "diff"];
const OPTIONAL_STEP: Record<string, string> = { rewrite: "gaps", coverage: "gaps", expert: "expert", sources: "sources", internal_links: "internal_links" };
const STEP_LABELS: Record<string, string> = {
  fetch: "Pobranie treści",
  keywords_own: "Frazy własne",
  serp: "Wyniki wyszukiwania",
  competitors: "Treść konkurencji",
  keywords_competitors: "Frazy konkurencji",
  brief: "Wytyczne",
  rewrite: "Redagowanie sekcji",
  coverage: "Domknięcie fraz",
  expert: "Porada eksperta",
  sources: "Źródła",
  internal_links: "Linki wewnętrzne",
  diff: "Porównanie zmian",
};
const STATUS_LABEL: Record<string, string> = {
  queued: "w kolejce",
  dispatching: "uruchamianie",
  running: "w toku",
  done: "zakończone",
  failed: "błąd",
  cancelled: "anulowane",
  stale: "utracono połączenie z procesem",
  budget_exceeded: "przerwane – brak środków",
};
const FAILED = ["failed", "stale", "budget_exceeded"];
const MODEL_ID = /^[a-z0-9-]+\/[a-z0-9.:_-]{1,60}$/i;
const IMPROVEMENTS = [
  { value: "gaps", label: "Uzupełnienie braków w treści", title: "analiza wyników Google → wytyczne → przeredagowanie sekcji" },
  { value: "sources", label: "Źródła", title: "sekcja Źródła (nofollow) na końcu + jedna definicja z Wikipedii w treści" },
  { value: "internal_links", label: "Linki wewnętrzne", title: "dopasowanie z katalogu treści serwisu" },
];
/** Zakończony przebieg blokuje wpis na COOLDOWN_DAYS (lustro cw-api.js). */
const COOLDOWN_DAYS = 30;
/** Krok potrafi zjeść wielokrotność normy, gdy model z wyszukiwaniem w sieci
    wciąga do kontekstu całe strony – taki krok ma się rzucać w oczy na osi. */
const STEP_TOKENS_WARN = 150_000;

const plannedSteps = (job: Job) => STEP_ORDER.filter((step) => !OPTIONAL_STEP[step] || (job.improvements ?? []).includes(OPTIONAL_STEP[step]));
const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

export default function PipelinePanel({ domain }: { domain: string }) {
  const { job, entry, error } = useEditor();
  const running = isRunning(job);
  const failed = Boolean(job && FAILED.includes(job.status));
  // „Uruchom ponownie" wraca do konfiguracji – do czasu kolejnej zmiany zadania.
  const [setupOpen, setSetupOpen] = useState(false);
  useEffect(() => setSetupOpen(false), [job?.id, job?.status]);
  const setupRef = useRef<HTMLDivElement>(null);
  const showSetup = setupOpen || !job || (!running && job.status !== "done");
  const backToSetup = () => {
    setSetupOpen(true);
    // Przy długim wpisie podsumowanie bywa daleko od konfiguracji – bez tego
    // kliknięcie wygląda, jakby nic się nie stało.
    requestAnimationFrame(() => setupRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }));
  };

  return (
    <>
      <div className="ed-pipebar">
        {showSetup && <Setup domain={domain} setupRef={setupRef} />}
        {job && running && <Progress job={job} />}
        {job && !running && !failed && !setupOpen && <Summary job={job} onRerun={backToSetup} />}
        {job && failed && !setupOpen && <Failure job={job} onRerun={backToSetup} />}
        {job && job.steps?.length > 0 && (
          <div className="ed-timeline-wrap">
            <Steps job={job} />
          </div>
        )}
        {error && <p className="ed-error">{error}</p>}
      </div>
      {job && entry && <Brief job={job} />}
    </>
  );
}

/* ---------- konfiguracja ---------- */

function Setup({ domain, setupRef }: { domain: string; setupRef: React.RefObject<HTMLDivElement | null> }) {
  const { job, entry, models } = useEditor();
  const [improvements, setImprovements] = useState(() => new Set(IMPROVEMENTS.map((row) => row.value)));
  const [modelIds, setModelIds] = useState<string[] | null>(null);
  const [note, setNote] = useState("modele przez OpenRouter");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("cw-models") ?? "null");
      if (saved?.research || saved?.writer) editorStore.set({ models: { research: saved.research || DEFAULT_MODELS.research, writer: saved.writer || DEFAULT_MODELS.writer } });
    } catch {
      /* zepsuty localStorage nie blokuje strony */
    }
    fetch("https://openrouter.ai/api/v1/models")
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error(String(response.status)))))
      .then((data) => {
        const ids = ((data?.data ?? []) as any[]).map((model) => model?.id).filter(Boolean).sort();
        setModelIds(ids);
        setNote(`modele z OpenRouter · ${pl.format(ids.length)} dostępnych`);
      })
      .catch(() => {
        setModelIds([]);
        setNote("modele z OpenRouter · lista niedostępna, wpisz ID ręcznie");
      });
  }, []);

  const run = async () => {
    if (!entry) return;
    editorStore.set({ error: null });
    if (!improvements.size) return showEditorError("Wybierz przynajmniej jeden element do optymalizacji.");
    const research = models.research.trim() || DEFAULT_MODELS.research;
    const writer = models.writer.trim() || DEFAULT_MODELS.writer;
    if (!MODEL_ID.test(research) || !MODEL_ID.test(writer)) return showEditorError("ID modelu musi mieć format „dostawca/model” (np. anthropic/claude-sonnet-5).");
    localStorage.setItem("cw-models", JSON.stringify({ research, writer }));

    // Świadome ponowienie omija tylko limit 30 dni – dzienny i limit
    // równoległych zadań zostają – więc pytamy wprost o zgodę.
    let force = false;
    if (job?.status === "done" && job.created_at && Date.now() - new Date(job.created_at).getTime() < COOLDOWN_DAYS * 86_400_000) {
      const stamp = new Date(job.created_at).toLocaleDateString("pl-PL");
      const ok = window.confirm(
        `Ten wpis był optymalizowany ${stamp}, a limit wynosi jedną analizę na ${COOLDOWN_DAYS} dni.\n\n` +
          "Uruchomić ponownie? Wymaga to ponownego zużycia limitów (wyszukiwarka, Senuto, tokeny). Obecny wynik w panelu zostanie zastąpiony nowym.",
      );
      if (!ok) return;
      force = true;
    }

    const submit = async () => {
      const { data } = await api<{ job: Job }>(`/api/cw/jobs${force ? "?force=1" : ""}`, {
        method: "POST",
        body: {
          domain,
          post_id: entry.post_id,
          post_type: entry.post_type ?? "posts",
          url: entry.url,
          title: entry.title,
          author: entry.author ?? "",
          improvements: [...improvements],
          models: { research, writer },
        },
      });
      editorStore.set({ modes: {}, job: data.job });
      schedulePoll(true);
    };

    setBusy(true);
    try {
      await submit();
    } catch (error) {
      // Lokalny test limitu widzi tylko OSTATNIE zadanie – po nieudanym
      // przebiegu jest „failed", a Worker odrzuca przez wcześniejszy ukończony
      // przejazd. Pytamy dopiero teraz i ponawiamy z force=1.
      if (!force && (error as ApiError)?.code === "cooldown") {
        const ok = window.confirm(
          `${error instanceof Error ? error.message : ""}\n\n` +
            "Uruchomić ponownie mimo limitu? Wymaga to ponownego zużycia limitów (wyszukiwarka, Senuto, tokeny), a obecny wynik w panelu zostanie zastąpiony nowym.",
        );
        if (ok) {
          force = true;
          try {
            await submit();
          } catch (retryError) {
            showEditorError(retryError instanceof Error ? retryError.message : "Nie udało się dodać zadania do kolejki.");
          }
        }
      } else showEditorError(error instanceof Error ? error.message : "Nie udało się dodać zadania do kolejki.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div ref={setupRef}>
      <div className="ed-setup-row">
        <div className="ed-improvements" role="group" aria-label="Zakres optymalizacji">
          {IMPROVEMENTS.map((row) => (
            <label key={row.value} className="fchip ed-improvement" title={row.title}>
              <input
                type="checkbox"
                checked={improvements.has(row.value)}
                onChange={(e) => {
                  const next = new Set(improvements);
                  if (e.target.checked) next.add(row.value);
                  else next.delete(row.value);
                  setImprovements(next);
                }}
              />
              {row.label}
            </label>
          ))}
        </div>
        {/* Lista modeli z OpenRoutera ma kilkaset pozycji, więc zamiast
            natywnego datalisty stoi tu własny combobox z filtrowaniem. */}
        <div className="ed-models">
          <ModelCombo label="Model analizy" value={models.research} ids={modelIds} onChange={(research) => editorStore.set({ models: { ...editorStore.get().models, research } })} />
          <ModelCombo label="Model pisania" value={models.writer} ids={modelIds} onChange={(writer) => editorStore.set({ models: { ...editorStore.get().models, writer } })} />
          <small className="ed-models-note">{note}</small>
        </div>
      </div>
      <div className="ed-actions">
        <button type="button" className="ed-run" disabled={busy || isRunning(job)} onClick={run}>
          Rozpocznij optymalizację
        </button>
        <span className="ed-hint">
          Zużycie zasobów: zapytanie do wyszukiwarki (SerpData), pobranie fraz z Senuto i kilkadziesiąt tysięcy tokenów. Ten sam wpis maksymalnie raz na 30 dni. Wynik to
          propozycja – nic nie trafia do WordPressa automatycznie.
        </span>
      </div>
    </div>
  );
}

/** Combobox nad polem tekstowym: lista filtruje się w trakcie pisania,
    strzałki i Enter wybierają, Esc zamyka. Wpisanie własnego ID dalej
    działa – lista tylko podpowiada. */
function ModelCombo({ label, value, ids, onChange }: { label: string; value: string; ids: string[] | null; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const [active, setActive] = useState(-1);
  const list = useRef<HTMLUListElement>(null);
  const needle = filter.trim().toLowerCase();
  const matches = (needle ? (ids ?? []).filter((id) => id.toLowerCase().includes(needle)) : (ids ?? [])).slice(0, 200);

  const show = (text: string) => {
    setFilter(text);
    setOpen(true);
    setActive(-1);
  };
  const choose = (id: string) => {
    onChange(id);
    setOpen(false);
    setActive(-1);
  };
  useEffect(() => {
    if (active >= 0) list.current?.querySelectorAll("li[data-id]")[active]?.scrollIntoView({ block: "nearest" });
  }, [active]);

  return (
    <label className="ed-combo">
      <span>{label}</span>
      <div className="ed-combo-box">
        <input
          value={value}
          spellCheck={false}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          onFocus={() => show("")}
          onChange={(e) => {
            onChange(e.target.value);
            show(e.target.value);
          }}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
              e.preventDefault();
              if (!open) show(value);
              if (!matches.length) return;
              setActive((current) => (current + (e.key === "ArrowDown" ? 1 : -1) + matches.length) % matches.length);
            } else if (e.key === "Enter" && open && active >= 0 && matches[active]) {
              e.preventDefault();
              choose(matches[active]);
            } else if (e.key === "Escape") setOpen(false);
          }}
        />
        <button
          type="button"
          className="ed-combo-toggle"
          aria-label="Pokaż listę modeli"
          // mousedown, bo click po blurze inputa nie zdąży się wykonać.
          onMouseDown={(e) => {
            e.preventDefault();
            if (open) setOpen(false);
            else {
              (e.currentTarget.previousElementSibling as HTMLInputElement)?.focus();
              show("");
            }
          }}
        >
          ▾
        </button>
        {open && (
          <ul className="ed-combo-list" ref={list}>
            {matches.map((id, i) => (
              <li
                key={id}
                data-id={id}
                className={[id === value ? "current" : "", i === active ? "active" : ""].filter(Boolean).join(" ") || undefined}
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(id);
                }}
              >
                {id}
              </li>
            ))}
            {!matches.length && <li className="empty">{ids?.length ? "brak modelu o takiej nazwie" : "lista modeli niedostępna"}</li>}
          </ul>
        )}
      </div>
    </label>
  );
}

/* ---------- postęp, podsumowanie, błąd ---------- */

function Progress({ job }: { job: Job }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const planned = plannedSteps(job);
  const byName = new Map(job.steps.map((step) => [step.step, step]));
  const finished = planned.filter((name) => ["done", "skipped", "failed"].includes(byName.get(name)?.status ?? ""));
  const active = planned.find((name) => byName.get(name)?.status === "running");
  const percent = Math.round((finished.length / planned.length) * 100);
  const seconds = Math.max(0, Math.floor((now - new Date(job.created_at).getTime()) / 1000));

  const cancel = async () => {
    try {
      await api(`/api/cw/jobs/${job.id}/cancel`, { method: "POST" });
      const { data } = await api<{ job: Job }>(`/api/cw/jobs/${job.id}`);
      editorStore.set({ job: data.job });
    } catch (error) {
      showEditorError(error instanceof Error ? error.message : "Nie udało się anulować zadania.");
    }
  };

  return (
    <div>
      <div className="ed-progress-head">
        <span className="ed-progress-label">{active ? (STEP_LABELS[active] ?? active) : (STATUS_LABEL[job.status] ?? job.status)}</span>
        <span className="ed-progress-meta">
          <span>{`krok ${Math.min(finished.length + 1, planned.length)} z ${planned.length}`}</span>
          <span>{clock(seconds)}</span>
          <button type="button" className="ed-cancel" onClick={cancel}>
            anuluj
          </button>
        </span>
      </div>
      <div className="ed-progress">
        <i style={{ width: `${Math.max(3, percent)}%` }} />
      </div>
    </div>
  );
}

function Summary({ job, onRerun }: { job: Job; onRerun: () => void }) {
  const tokens = (job.cost?.tokens_total ?? 0) || (job.cost?.tokens_in ?? 0) + (job.cost?.tokens_out ?? 0);
  const cost = [
    job.models ? `analiza: ${job.models.research} · pisanie: ${job.models.writer}` : null,
    tokens ? `${pl.format(tokens)} tokenów` : null,
    job.cost?.serp_requests ? `${job.cost.serp_requests} zapytań do wyszukiwarki` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <div data-ed-summary>
      <Status tone={job.status === "done" ? "ok" : "idle"}>{STATUS_LABEL[job.status] ?? job.status}</Status>
      <span className="ed-summary-cost">{cost}</span>
      {/* Po zakończonym przebiegu konfiguracja jest schowana – bez tego
          przycisku nie dałoby się puścić wpisu ponownie. */}
      {["cancelled", "done"].includes(job.status) && (
        <button type="button" className="ed-rerun" onClick={onRerun}>
          {job.status === "done" ? "uruchom ponownie (zmień modele i zakres)" : "uruchom ponownie"}
        </button>
      )}
    </div>
  );
}

/** Karta błędu: który krok padł, z jakim komunikatem i gdzie zajrzeć dalej. */
function Failure({ job, onRerun }: { job: Job; onRerun: () => void }) {
  const broken = job.steps?.find((step) => step.status === "failed");
  return (
    <div className="ed-fail">
      <div className="ed-fail-head">
        <span className="ed-fail-badge">proces nieudany</span>
        <span>{broken ? `krok: ${STEP_LABELS[broken.step] ?? broken.step}` : (STATUS_LABEL[job.status] ?? job.status)}</span>
      </div>
      <p className="ed-fail-msg">{broken?.error || job.error || "Proces zakończył się bez podania przyczyny."}</p>
      <div className="ed-fail-actions">
        <button type="button" className="ed-rerun" onClick={onRerun}>
          uruchom ponownie
        </button>
        {job.run_url && (
          <a className="ed-fail-log" href={job.run_url} target="_blank" rel="noopener">
            szczegóły błędu ↗
          </a>
        )}
      </div>
    </div>
  );
}

/* ---------- oś przebiegu ---------- */

/** Czas kroku – dla zakończonych ile trwał, dla trwającego ile już leci. */
function stepDuration(step: Step | undefined) {
  if (!step?.started_at) return "";
  // Zakończony krok bez finished_at (starsze zadania) nie ma czasu – liczenie
  // do „teraz" dawało dziesiątki tysięcy minut.
  if (!step.finished_at && step.status !== "running") return "";
  const start = Date.parse(step.started_at);
  const end = step.finished_at ? Date.parse(step.finished_at) : Date.now();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return "";
  const seconds = Math.max(0, Math.round((end - start) / 1000));
  return seconds < 60 ? `${seconds} s` : clock(seconds);
}

/** Koszt kroku w jednej frazie – to, za co realnie zapłaciliśmy. */
function stepCost(step: Step | undefined) {
  const cost = step?.cost ?? {};
  const tokens = (cost.tokens_in ?? 0) + (cost.tokens_out ?? 0);
  return [
    cost.serp_requests ? `${cost.serp_requests} zapytań do wyszukiwarki` : null,
    cost.senuto_requests ? `${cost.senuto_requests} zap. Senuto` : null,
    tokens ? `${pl.format(tokens)} tokenów${tokens > STEP_TOKENS_WARN ? " ⚠" : ""}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

/** Oś: znacznik stanu, nazwa kroku, czas i koszt. Krok w toku dostaje kręcące
    się kółko – widać, że coś się dzieje, a nie zawiesiło. */
function Steps({ job }: { job: Job }) {
  const byName = new Map(job.steps.map((step) => [step.step, step]));
  return (
    <ol className="ed-steps">
      {plannedSteps(job).map((name) => {
        const step = byName.get(name);
        const status = step?.status ?? "pending";
        const spent = (step?.cost?.tokens_in ?? 0) + (step?.cost?.tokens_out ?? 0);
        return (
          <li key={name} className={`ed-step ${status}`}>
            <span className="ed-step-mark">{status === "done" ? "✓" : status === "failed" ? "✕" : status === "skipped" ? "–" : ""}</span>
            <div className="ed-step-body">
              <span className="ed-step-name">{STEP_LABELS[name] ?? name}</span>
              <span
                className={`ed-step-info${spent > STEP_TOKENS_WARN ? " is-costly" : ""}`}
                title={
                  spent > STEP_TOKENS_WARN
                    ? "Nietypowo drogi krok – zwykle to model, który przy wyszukiwaniu w sieci wciąga do kontekstu całe strony. Warto zmienić model analizy."
                    : undefined
                }
              >
                {status === "skipped" ? "pominięty" : [stepDuration(step), stepCost(step), step?.model].filter(Boolean).join(" · ")}
              </span>
              {step?.error && <span className="ed-step-error">{step.error}</span>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/* ---------- wytyczne ---------- */

function Brief({ job }: { job: Job }) {
  const brief = job.steps.find((step) => step.step === "brief")?.payload;
  const [open, setOpen] = useState(false);
  const touched = useRef(false);
  // W trakcie przebiegu wytyczne rozwijają się same – ręczny wybór ma pierwszeństwo.
  useEffect(() => {
    if (brief && isRunning(job) && !touched.current) setOpen(true);
  }, [brief, job]);
  if (!brief) return null;

  const blocks: [string, React.ReactNode][] = [];
  const list = (items: string[]) => (
    <ul>
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
  if (brief.summary) blocks.push(["Podsumowanie", <p key="s">{brief.summary}</p>]);
  if (brief.content_truncated)
    blocks.push([
      "Zbyt długi tekst",
      <p key="t" className="ed-brief-warn">
        Uwaga: wpis jest bardzo obfity, dlatego analiza objęła tylko jego początek. Końcowe sekcje mogły zostać pominięte w wytycznych.
      </p>,
    ]);
  if (brief.gaps?.length) blocks.push(["Luki wobec konkurencji", list(brief.gaps.map((gap: any) => `${gap.topic} – ${gap.why}`))]);
  if (brief.keywords_to_cover?.length)
    blocks.push([
      "Frazy do pokrycia",
      list(
        brief.keywords_to_cover.map(
          (keyword: any) => `${keyword.keyword}` + (keyword.volume ? ` · ${pl.format(keyword.volume)}/mies.` : "") + (keyword.current_position ? ` · obecnie ${keyword.current_position}` : ""),
        ),
      ),
    ]);
  if (brief.factual_risks?.length) blocks.push(["Do weryfikacji faktograficznej", list(brief.factual_risks)]);

  // Gdzie stanęły nowe sekcje i które zalecenia nagłówków rewrite pominął –
  // lepiej pokazać je redaktorowi, niż udawać, że generyczne H2 są z rozmysłem.
  const rewrite = job.steps.find((step) => step.step === "rewrite")?.payload;
  const titles = new Map((job.sections ?? []).map((row) => [row.slot, row.title_after || row.title_before || `sekcja ${row.slot}`]));
  if (rewrite?.anchors && Object.keys(rewrite.anchors).length)
    blocks.push([
      "Miejsce nowych sekcji",
      list(Object.entries(rewrite.anchors).map(([slot, after]) => `${titles.get(Number(slot)) ?? `sekcja ${slot}`} → po: ${titles.get(Number(after)) ?? `sekcja ${after}`}`)),
    ]);
  if (rewrite?.headings_missed?.length)
    blocks.push(["Pominięte zalecenia nagłówków", list(rewrite.headings_missed.map((row: any) => `sekcja ${row.slot}: ${row.current || "(nowa)"} → ${row.recommended}`))]);

  // Ostrzeżenia kroków researchu – przejazd kończy się jako „done" nawet
  // wtedy, gdy warstwa fraz wypadła; bez tego wyglądałby na w pełni udany.
  for (const step of job.steps) if (step.payload?.warning) blocks.push(["Uwaga z przebiegu", list([step.payload.warning])]);

  // Bramka pokrycia: co pipeline domknął sam, a czego świadomie nie wplótł.
  const coverage = job.steps.find((step) => step.step === "coverage")?.payload;
  const gained = (coverage?.rounds ?? []).flatMap((round: any) => round.gained ?? []);
  if (gained.length) blocks.push(["Frazy domknięte po sprawdzeniu", list(gained)]);
  // Fraza bez miejsca w akapitach kończy jako pytanie FAQ – to też domknięcie.
  const askedFaq = (coverage?.rounds ?? []).flatMap((round: any) => round.new_faq ?? []);
  if (askedFaq.length) {
    const faqTitles = new Map((job.sections ?? []).map((row) => [row.slot, row.title_after || ""]));
    blocks.push(["Frazy domknięte pytaniem FAQ", list(askedFaq.map((slot: number) => faqTitles.get(slot) || `nowe pytanie ${slot - 100}`))]);
  }
  if (coverage?.skipped?.length) blocks.push(["Frazy świadomie pominięte", list(coverage.skipped.map((row: any) => `${row.keyword} – ${row.why}`))]);
  if (coverage?.missing?.length) blocks.push(["Frazy, których nie udało się wpleść", list(coverage.missing)]);

  return (
    <details
      className="ed-brief"
      open={open}
      onToggle={(e) => {
        const next = (e.currentTarget as HTMLDetailsElement).open;
        if (next !== open) {
          touched.current = true;
          setOpen(next);
        }
      }}
    >
      <summary>
        Wytyczne z analizy <span className="section-meta">luki wobec konkurencji i frazy do pokrycia</span>
      </summary>
      <div>
        {blocks.map(([title, body], i) => (
          <div key={i} className="ed-brief-block">
            <h3>{title}</h3>
            {body}
          </div>
        ))}
      </div>
    </details>
  );
}
