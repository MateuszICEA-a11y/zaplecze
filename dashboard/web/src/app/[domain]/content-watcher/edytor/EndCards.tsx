"use client";

/* Karty etapów końcowych w kolumnie bocznej: wypowiedź ekspercka, przejazd
   redaktorski (styl i fleksja) i zapis do WordPressa. Dostępne po
   zakończonym przebiegu. Klasy z dawnego edytora (legacy.css, kontener
   .legacy.ed-side-tools w PostEditor). */
import { isSourcesTitle, layoutDoc, type SectionBlock } from "@/lib/cw-editor/doc";
import { activeExpert, expertBlockquote, expertShortcode } from "@/lib/cw-editor/expert";
import { refreshJob } from "@/lib/cw-editor/jobs";
import { editorStore, showEditorError, useEditor } from "@/lib/cw-editor/store";
import type { Job, StyleRow } from "@/lib/cw-editor/types";
import { fmtDate } from "@/lib/format";
import { api, type ApiError } from "@/lib/writer-client";
import { useEffect, useMemo, useState } from "react";
import { Prose } from "./DocSection";

/* eslint-disable @typescript-eslint/no-explicit-any */
const pl = new Intl.NumberFormat("pl-PL");
const errorText = (error: unknown, fallback: string) => (error instanceof Error ? error.message : fallback);

type Author = { id: number | null; name: string; role: string };

/** Blokada „running" bez żywego wywołania za sobą – Worker zabity w trakcie
    nie zdejmie jej sam. Backend po tym samym oknie pozwala przejąć etap, więc
    pokazujemy ponowną próbę zamiast wiecznego spinnera. */
const RUNNING_STALE_MS = 3 * 60_000;
const staleRunning = (state: any) => state?.status === "running" && (!state.started_at || Date.now() - Date.parse(state.started_at) > RUNNING_STALE_MS);

const Button = ({ label, onClick, primary = false }: { label: string; onClick: () => void; primary?: boolean }) => (
  <button type="button" className={primary ? "ed-expert-run" : "ed-expert-secondary"} onClick={onClick}>
    {label}
  </button>
);

export default function EndCards({ domain }: { domain: string }) {
  const { job } = useEditor();
  // Autorzy portalu z WordPressa przez Workera (cache 10 minut) – nowa osoba
  // w redakcji nie wymaga wdrożenia. Wspólni dla eksperta i karty WP.
  const [authors, setAuthors] = useState<Author[]>([]);
  useEffect(() => {
    api<{ authors?: Author[] }>(`/api/cw/authors/${domain}`)
      .then(({ data }) => setAuthors(data.authors ?? []))
      .catch(() => {
        /* brak listy = zostaje „dobierz automatycznie" i „bez zmian" */
      });
  }, [domain]);
  if (job?.status !== "done") return null;
  return (
    <>
      <ExpertCard job={job} authors={authors} />
      <StyleCard job={job} />
      <WpCard job={job} authors={authors} />
    </>
  );
}

/* ---------- wypowiedź ekspercka ---------- */

/* Stanowiska do wyboru. WordPress ich nie niesie, a wpisywanie z ręki przy
   każdym cytacie kończyło się literówką w podpisie. Formy męskie i żeńskie
   osobno – podpis ma się zgadzać z osobą. Czego brakuje, redaktor doda przez „inne”. */
const ROLE_OPTIONS = [
  "specjalista SEO",
  "specjalistka SEO",
  "ekspert SEO i AI Search",
  "ekspertka SEO i AI Search",
  "specjalista ds. treści",
  "specjalistka ds. treści",
  "specjalista ds. marketingu",
  "specjalistka ds. marketingu",
  "content manager",
  "content managerka",
  "head of SEO",
  "account manager",
  "account managerka",
];
const ROLE_OTHER = "__other__";

/** Sekcje treści do wyboru miejsca cytatu – tytuły zamiast numerów slotów
    (bez wstępu, FAQ i bibliografii). */
function useQuoteSlots() {
  const { content, contentError, entry, job } = useEditor();
  return useMemo(
    () =>
      layoutDoc(content, contentError, entry, job)
        .filter((block): block is SectionBlock => block.type === "section" && block.kind === "section")
        .map((block) => ({ slot: block.slot, title: (block.section?.title_after || block.title || "").trim() }))
        .filter((row) => row.slot && row.title && !isSourcesTitle(row.title)),
    [content, contentError, entry, job],
  );
}

function ExpertCard({ job, authors }: { job: Job; authors: Author[] }) {
  const { entry } = useEditor();
  const slots = useQuoteSlots();
  const [who, setWho] = useState("");
  const [role, setRole] = useState("");
  const [customRole, setCustomRole] = useState("");
  const [slot, setSlot] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Autora wpisu pomijamy – cytowanie samego siebie to reguła redakcyjna.
  const experts = authors.filter((row) => row.name !== entry?.author);

  /** Rola z WordPressa/wyboru autora trafia w opcję listy, a nietypowe
      brzmienie ląduje w polu „inne” zamiast przepaść. */
  const pickRole = (value: string) => {
    if (value && !ROLE_OPTIONS.includes(value)) {
      setRole(ROLE_OTHER);
      setCustomRole(value);
    } else {
      setRole(value);
      setCustomRole("");
    }
  };
  const choice = () => {
    const picked = slot ? Number(slot) : undefined;
    if (!who) return picked ? { slot: picked } : undefined;
    const finalRole = role === ROLE_OTHER ? customRole.trim() : role;
    return { expert: who, role: finalRole || undefined, slot: picked };
  };

  const call = async (method: string, body?: unknown) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await api(`/api/cw/jobs/${job.id}/expert`, { method, body });
      await refreshJob(job.id);
    } catch (e) {
      // Stan eksperta mógł się zmienić mimo błędu (np. failed z powodem).
      await refreshJob(job.id).catch(() => undefined);
      setError(errorText(e, "Nie udało się wygenerować cytatu."));
    } finally {
      setBusy(false);
    }
  };

  const expert = activeExpert(job);
  const state = job.expert;
  let actions: React.ReactNode;
  if (busy || (state?.status === "running" && !staleRunning(state))) {
    actions = <span className="ed-expert-wait">generowanie cytatu… (model rozumujący, do dwóch minut)</span>;
  } else if (expert) {
    actions = (
      <>
        {staleRunning(state) && <span className="ed-expert-meta">poprzednia próba została przerwana i nie zwróciła cytatu</span>}
        <Prose html={expertBlockquote(expert)} className="ed-expert-preview" blocks={false} />
        <small className="ed-expert-meta">{[expert.slot ? `sekcja ${expert.slot}` : null, expert.placement || null, expert.model || null].filter(Boolean).join(" · ")}</small>
        {/* Na czym stoi cytat: pozycja z materiału przebiegu wskazana przez
            model – bez tego nie da się sprawdzić, czy wypowiedź nazwiskiem
            realnej osoby opiera się na danych. */}
        {expert.basis && <small className="ed-expert-meta ed-expert-basis">podstawa: {expert.basis}</small>}
        <Button label="kopiuj cytat" onClick={() => navigator.clipboard.writeText(expertShortcode(expert))} />
        <Button label="wygeneruj ponownie" onClick={() => call("POST", choice())} />
        <Button label="odrzuć" onClick={() => call("PATCH", { rejected: true })} />
      </>
    );
  } else {
    actions = (
      <>
        {staleRunning(state) && <span className="ed-expert-meta">poprzednia próba została przerwana i nie zwróciła cytatu</span>}
        {state?.status === "failed" && state?.error && <span className="ed-expert-meta">{state.error}</span>}
        {/* Po odrzuceniu „spróbuj ponownie" brzmiało jak obsługa błędu –
            nazywamy rzecz po imieniu. */}
        {state?.status === "rejected" && <span className="ed-expert-meta">poprzedni cytat odrzucony – wybierz miejsce i wygeneruj nowy</span>}
        <Button label={state ? "wygeneruj nowy cytat" : "Dodaj poradę eksperta"} onClick={() => call("POST", choice())} primary />
      </>
    );
  }

  return (
    <div className="ed-expert">
      <div className="ed-expert-head">
        <span className="ed-expert-label">Etap końcowy · wypowiedź ekspercka</span>
        <span className="ed-expert-note">komentarz budowany z materiału przebiegu (SERP, konkurenci, brief) – wymaga tych analiz</span>
      </div>
      {/* Kogo podpisujemy: autorzy portalu z WordPressa. Rola idzie z osobnej
          listy, bo WP stanowisk nie trzyma – dla znanych osób podstawia się sama. */}
      <div className="ed-expert-who">
        <label>
          <span>Ekspert</span>
          <select
            value={who}
            onChange={(e) => {
              setWho(e.target.value);
              pickRole(experts.find((row) => row.name === e.target.value)?.role ?? "");
            }}
          >
            <option value="">dobierz automatycznie</option>
            {experts.map((row) => (
              <option key={row.name} value={row.name}>
                {row.role ? `${row.name} – ${row.role}` : row.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Stanowisko</span>
          <select
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              if (e.target.value !== ROLE_OTHER) setCustomRole("");
            }}
          >
            <option value="">bez stanowiska</option>
            {ROLE_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
            <option value={ROLE_OTHER}>inne (wpisz…)</option>
          </select>
        </label>
        {role === ROLE_OTHER && <input type="text" value={customRole} onChange={(e) => setCustomRole(e.target.value)} placeholder="np. specjalistka SEO" maxLength={120} autoFocus />}
        <label>
          <span>Miejsce cytatu</span>
          <select value={slots.some((row) => String(row.slot) === slot) ? slot : ""} onChange={(e) => setSlot(e.target.value)}>
            <option value="">koniec artykułu – model dobiera</option>
            {slots.map((row) => (
              <option key={row.slot} value={row.slot}>
                pod: {row.title}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="ed-expert-actions">{actions}</div>
      {error && <p className="ed-error">{error}</p>}
    </div>
  );
}

/* ---------- styl i fleksja (przejazd redaktorski) ----------
   Jedno wywołanie modelu na cały wpis (prompt wymaga spójności terminologii),
   wynik jako propozycja per sekcja – bloki przy sekcjach rysuje DocSection. */

function StyleCard({ job }: { job: Job }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const call = async (path: string, body?: unknown) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const { data } = await api<any>(path, { method: "POST", body });
      if (data.job) editorStore.set({ job: data.job });
    } catch (e) {
      setError(errorText(e, "Nie udało się wykonać przejazdu."));
    } finally {
      setBusy(false);
    }
  };
  const runPass = () => call(`/api/cw/jobs/${job.id}/style`);
  const style = job.style;
  const rows = (job.style_sections ?? []) as StyleRow[];

  let actions: React.ReactNode;
  let report: React.ReactNode = null;
  if (busy || (style?.status === "running" && !staleRunning(style))) {
    actions = <span className="ed-expert-wait">przejazd redaktorski… (weryfikacja faktów w sieci, do dwóch minut)</span>;
  } else if (style?.status === "done") {
    const decided = rows.filter((row) => row.decision).length;
    actions = (
      <>
        {staleRunning(style) && <span className="ed-expert-meta">poprzedni przejazd został przerwany – spróbuj ponownie</span>}
        <small className="ed-expert-meta">
          {[
            rows.length
              ? `${pl.format(rows.length)} ${rows.length === 1 ? "sekcja z korektą" : "sekcji z korektą"} na ${pl.format(style.sections_total ?? rows.length)}`
              : "model nie miał zastrzeżeń do żadnej sekcji",
            rows.length ? `${pl.format(decided)} ocenionych` : null,
            style.model || null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </small>
        <Button label="przejedź ponownie" onClick={runPass} />
      </>
    );
    report = <StyleReport style={style} rows={rows} onInsert={(index) => call(`/api/cw/jobs/${job.id}/style/addition`, { index })} />;
  } else {
    actions = (
      <>
        {staleRunning(style) && <span className="ed-expert-meta">poprzedni przejazd został przerwany – spróbuj ponownie</span>}
        {style?.status === "failed" && style?.error && <span className="ed-expert-meta">{style.error}</span>}
        <Button label={style ? "spróbuj ponownie" : "Popraw styl i fleksję"} onClick={runPass} primary />
      </>
    );
  }

  return (
    <div className="ed-expert ed-style">
      <div className="ed-expert-head">
        <span className="ed-expert-label">Etap końcowy · styl i fleksja</span>
        <span className="ed-expert-note">kalki, żargon, odmiana nazw własnych i weryfikacja faktów w sieci</span>
      </div>
      <div className="ed-expert-actions">{actions}</div>
      {report}
      {error && <p className="ed-error">{error}</p>}
    </div>
  );
}

/** Odnośnik do sekcji w dokumencie – z jej tytułem, bo sekcje w edytorze
    nie są numerowane i „sekcja 4" nic redaktorowi nie mówi. */
function SlotJump({ slot }: { slot: number }) {
  const titles = useSlotTitles();
  return (
    <a
      href={`#sekcja-${slot}`}
      className="ed-style-jump"
      onClick={(event) => {
        event.preventDefault();
        document.querySelector(`.ed-doc-section[data-slot="${slot}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      }}
    >
      → {titles.get(slot) || `sekcja ${slot}`}
    </a>
  );
}

/** Tytuły sekcji dokumentu po slocie (z propozycją – nowy tytuł). */
function useSlotTitles() {
  const { content, contentError, entry, job } = useEditor();
  return useMemo(
    () =>
      new Map(
        layoutDoc(content, contentError, entry, job)
          .filter((block): block is SectionBlock => block.type === "section")
          .map((block) => [block.slot, (block.section?.title_after || block.title || "").trim()]),
      ),
    [content, contentError, entry, job],
  );
}

/** Raport przejazdu: weryfikacja faktów i propozycje uzupełnień. Poprawki
    językowe stoją przy sekcjach, tu zostaje to, co dotyczy całego wpisu. */
function StyleReport({ style, rows, onInsert }: { style: any; rows: StyleRow[]; onInsert: (index: number) => void }) {
  const facts = Array.isArray(style.facts) ? style.facts : [];
  const additions = Array.isArray(style.additions) ? style.additions : [];
  if (!facts.length && !additions.length && !rows.length) return null;
  return (
    <div className="ed-style-report">
      {facts.length > 0 && (
        <>
          <h4>Fakty do sprawdzenia</h4>
          <ul className="ed-style-facts">
            {facts.map((fact: any, i: number) => (
              <li key={i}>
                <span className={`ed-sec-tag ${fact.status === "potwierdzone" ? "ok" : "warn"}`}>{fact.status}</span> <b>{fact.claim}</b>
                {fact.note && <span className="ed-style-note"> – {fact.note}</span>}
                {fact.slot && (
                  <>
                    {" "}
                    <SlotJump slot={fact.slot} />
                  </>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
      {additions.length > 0 && (
        <>
          <h4>Proponowane uzupełnienia</h4>
          <p className="ed-style-note">Model nie wstawia ich sam – „wstaw do sekcji” tworzy propozycję z diffem do oceny przy sekcji.</p>
          <ul className="ed-style-facts">
            {additions.map((row: any, index: number) => (
              <li key={index}>
                {row.fact}
                {!row.certain && (
                  <>
                    {" "}
                    <span className="ed-sec-tag warn">do weryfikacji</span>
                  </>
                )}
                {row.slot && (
                  <>
                    {" "}
                    <SlotJump slot={row.slot} />
                  </>
                )}
                {row.inserted ? (
                  <>
                    {" "}
                    <span className="ed-sec-tag ok">wstawione – oceń przy sekcji</span>
                  </>
                ) : (
                  row.slot && (
                    <>
                      {" "}
                      <button type="button" className="ed-style-btn ok" title="Model wplecie ten fakt w treść sekcji – zmiana czeka na Twoje ✓" onClick={() => onInsert(index)}>
                        wstaw do sekcji
                      </button>
                    </>
                  )
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

/* ---------- zapis do WordPressa (szkic + wdrożenie) ----------
   Szkic to osobny wpis draft do podglądu na szablonie strony; wdrożenie
   podmienia treść oryginału i kasuje szkic. Hasło aplikacji zna wyłącznie
   Worker. Komunikat stoi obok przycisków – panel błędów u góry bywa daleko. */

function WpCard({ job, authors }: { job: Job; authors: Author[] }) {
  const { content, entry } = useEditor();
  const listed = authors.filter((row) => Number.isInteger(row.id));
  const currentId = content?.author_id ?? null;
  const [picked, setPicked] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  const applied = Boolean(job.applied_at);
  const known = listed.some((row) => row.id === currentId);
  const value = picked ?? (known ? String(currentId) : "");

  /* Autor wpisu: zaciągnięty z WP, do podmiany z listy redakcji. Ten sam
     autor = bez pola `author` w żądaniu. */
  const authorBody = () => {
    const id = value ? Number(value) : null;
    return id && id !== currentId ? { author_id: id } : {};
  };

  const draft = async () => {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const { data } = await api<any>(`/api/cw/jobs/${job.id}/wp-draft`, { method: "POST", body: authorBody() });
      editorStore.set({ job: { ...editorStore.get().job!, wp_draft_id: data.draft_id, wp_draft_url: data.preview_url } });
      setMessage({ text: "szkic zapisany", error: false });
    } catch (e) {
      const text = errorText(e, "Nie udało się zapisać szkicu.");
      setMessage({ text, error: true });
      showEditorError(text);
    } finally {
      setBusy(false);
    }
  };

  const apply = async (force = false): Promise<void> => {
    if (busy) return;
    if (!force && !window.confirm("Podmienić treść opublikowanego wpisu na wersję z edytora i skasować szkic?")) return;
    setBusy(true);
    setMessage(null);
    const body = authorBody();
    try {
      const { data } = await api<any>(`/api/cw/jobs/${job.id}/wp-apply${force ? "?force=1" : ""}`, { method: "POST", body });
      // Po wdrożeniu WP ma już nowego autora – nagłówek i lista idą za tym.
      if (body.author_id && content) {
        editorStore.set({ content: { ...content, author_id: body.author_id }, authorName: listed.find((row) => row.id === body.author_id)?.name ?? null });
        setPicked(null);
      }
      editorStore.set({ job: { ...editorStore.get().job!, applied_at: data.applied_at, wp_draft_id: null, wp_draft_url: null } });
    } catch (e) {
      // Rozjazd hashy = ktoś edytował wpis w CMS-ie po analizie – wdrożenie
      // nadpisałoby te poprawki, więc wymaga osobnego, świadomego potwierdzenia.
      if (
        (e as ApiError).code === "content_changed" &&
        window.confirm(`${(e as Error).message}\n\nWdrożyć mimo to? Zmiany z CMS-a w tych sekcjach zostaną nadpisane.`)
      ) {
        setBusy(false);
        return apply(true);
      }
      const text = errorText(e, "Nie udało się wdrożyć zmian.");
      setMessage({ text, error: true });
      showEditorError(text);
    } finally {
      setBusy(false);
    }
  };

  const note = message?.text ?? (applied ? `wdrożono ${fmtDate(job.applied_at!.slice(0, 10))}` : "");
  return (
    <div className="ed-expert ed-wp-card">
      <div className="ed-expert-head">
        <span className="ed-expert-label">Publikacja · WordPress</span>
        <span className="ed-expert-note">szkic do podglądu na szablonie strony; wdrożenie podmienia treść oryginału</span>
      </div>
      <div className="ed-wp">
        <label className="ed-wp-author">
          <span>Autor wpisu</span>
          <select value={value} onChange={(e) => setPicked(e.target.value)}>
            {!known && <option value="">{entry?.author ? `${entry.author} (bez zmian)` : "bez zmian"}</option>}
            {listed.map((row) => (
              <option key={row.id} value={String(row.id)}>
                {row.role ? `${row.name} – ${row.role}` : row.name}
              </option>
            ))}
          </select>
        </label>
        <button type="button" disabled={busy || applied} onClick={draft}>
          {busy ? "zapisuję w WP…" : job.wp_draft_id ? "odśwież szkic w WP" : "szkic w WordPressie"}
        </button>
        {job.wp_draft_url && (
          <a href={job.wp_draft_url} target="_blank" rel="noopener">
            otwórz szkic ↗
          </a>
        )}
        <button type="button" className="ed-wp-apply" disabled={busy || applied} onClick={() => apply()}>
          wdróż na stronie
        </button>
        {note && <span className={`ed-wp-note${message?.error ? " is-error" : ""}`}>{note}</span>}
      </div>
    </div>
  );
}
