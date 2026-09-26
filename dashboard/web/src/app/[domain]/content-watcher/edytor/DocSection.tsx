"use client";

/* Sekcja dokumentu edytora wpisu: nagłówek, narzędzia, treść edytowalna
   w miejscu i – po przebiegu – nakładka propozycji: decyzja ✓/✕, tryby
   widoku (zmiany / wersja po / oryginał), raport linków, korekta
   redaktorska, infografika, CTA i cytat eksperta.

   Klasy ed-doc-section, ed-sec-head, ed-doc-body i ed-doc-expert nie niosą
   stylu – to znaczniki, po których migawka (snapshot.ts) czyta dokument dla
   oceny treści i podglądu. Typografia treści: .doc-prose (editor-content.css). */
import { btnSmall, btnSmallPrimary, input, Status, Waiting, type Tone } from "@/components/kit";
import { cn } from "@/lib/cn";
import { sanitizeInto, markBlocks } from "@/lib/cw-editor/sanitize";
import { changeRatio, sectionLinkDiff, wordDiff, type Opcode } from "@/lib/cw-editor/diff";
import type { SectionBlock } from "@/lib/cw-editor/doc";
import { expertBlockquote, sectionCopyText } from "@/lib/cw-editor/expert";
import { refreshJob } from "@/lib/cw-editor/jobs";
import { editorStore, showEditorError } from "@/lib/cw-editor/store";
import type { ImageRow, Job, Section, StyleRow } from "@/lib/cw-editor/types";
import { api } from "@/lib/writer-client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */
const pl = new Intl.NumberFormat("pl-PL");
const errorText = (error: unknown, fallback: string) => (error instanceof Error ? error.message : fallback);

/** Przeliczenie oceny po pisaniu – z opóźnieniem, żeby nie liczyć przy każdym znaku. */
let scoreTimer = 0;
export const scheduleScore = () => {
  window.clearTimeout(scoreTimer);
  scoreTimer = window.setTimeout(() => editorStore.touchDoc(), 400);
};

/* ---------- treść ---------- */

/** Blok treści (sanityzowany HTML + rynienka z typami bloków). Dzieci
    wypełniamy ręcznie i tylko przy zmianie `html` – React nie dotyka DOM-u
    edytowanego przez redaktora (contentEditable). */
export function Prose({
  html,
  editable = false,
  onInput,
  bodyRef,
  className = "ed-doc-body",
  blocks = true,
}: {
  html: string | null;
  editable?: boolean;
  onInput?: () => void;
  bodyRef?: React.RefObject<HTMLDivElement | null>;
  className?: string;
  blocks?: boolean;
}) {
  const own = useRef<HTMLDivElement>(null);
  const ref = bodyRef ?? own;
  useLayoutEffect(() => {
    if (!ref.current) return;
    sanitizeInto(ref.current, html);
    if (blocks) markBlocks(ref.current);
  }, [html, ref, blocks]);
  return (
    <div
      ref={ref}
      className={cn(
        "doc-prose",
        className,
        editable &&
          "-m-1.5 cursor-text rounded p-1.5 outline-none transition-colors hover:bg-brand-500/4 focus:bg-gray-50 focus:shadow-[inset_0_0_0_1px_var(--color-gray-200)] dark:focus:bg-white/3 dark:focus:shadow-[inset_0_0_0_1px_var(--color-gray-800)]",
      )}
      contentEditable={editable || undefined}
      suppressContentEditableWarning
      onInput={onInput}
    />
  );
}

/* Pasek formatowania działa na zaznaczeniu (execCommand – jedyne API
   contentEditable dostępne bez zewnętrznej biblioteki). */
const FORMAT_BUTTONS: { label: string; title: string; run: () => void; className?: string }[] = [
  { label: "B", title: "Pogrubienie (Ctrl+B)", className: "font-medium", run: () => document.execCommand("bold") },
  { label: "I", title: "Kursywa (Ctrl+I)", className: "italic", run: () => document.execCommand("italic") },
  { label: "H2", title: "Nagłówek H2", run: () => document.execCommand("formatBlock", false, "h2") },
  { label: "H3", title: "Nagłówek H3", run: () => document.execCommand("formatBlock", false, "h3") },
  { label: "¶", title: "Zwykły akapit", run: () => document.execCommand("formatBlock", false, "p") },
  { label: "• lista", title: "Lista punktowana", run: () => document.execCommand("insertUnorderedList") },
  { label: "1. lista", title: "Lista numerowana", run: () => document.execCommand("insertOrderedList") },
  {
    label: "link",
    title: "Wstaw odnośnik",
    run: () => {
      const href = window.prompt("Adres odnośnika (https://…)");
      if (href && /^https?:\/\//i.test(href)) document.execCommand("createLink", false, href);
    },
  },
  { label: "wyczyść", title: "Usuń formatowanie zaznaczenia", run: () => document.execCommand("removeFormat") },
];

/** Pasek pokazuje się dopiero przy edycji (fokus w treści sekcji) – dziewięć
    identycznych pasków nad sekcjami to szum, nie narzędzie. mousedown na
    przyciskach ma preventDefault, więc fokus zostaje w treści. */
function FormatBar() {
  return (
    <div className="mb-2.5 hidden flex-wrap gap-1 rounded border border-gray-200 bg-gray-50 px-1.5 py-1 group-focus-within/sec:flex dark:border-gray-800 dark:bg-white/3">
      {FORMAT_BUTTONS.map((item) => (
        <button
          key={item.label}
          type="button"
          className={cn("rounded px-2.5 py-1 text-theme-xs text-gray-600 hover:bg-gray-200/70 hover:text-gray-800 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-white/90", item.className)}
          title={item.title}
          // mousedown zamiast click – kliknięcie gubiłoby zaznaczenie w tekście.
          onMouseDown={(event) => {
            event.preventDefault();
            item.run();
          }}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

/** Diff renderowany wyłącznie jako tekst – w treści siedzą fragmenty obcych
    stron i HTML z modelu, traktujemy je jak dane, nie markup. */
function Opcodes({ opcodes, className }: { opcodes: Opcode[]; className?: string }) {
  // Dopisane na zielono, usunięte przekreślone i wyciszone: jedno spojrzenie
  // wystarcza, żeby zobaczyć, co model zrobił z akapitem.
  return (
    <div className={cn("max-w-(--doc-measure) text-base/[1.75] whitespace-pre-wrap text-gray-600 dark:text-gray-300", className)}>
      {opcodes.map((op, i) =>
        op.op === "equal" ? (
          <span key={i}>{op.before}</span>
        ) : (
          <span key={i}>
            {op.before && <del className="text-gray-400 decoration-1 opacity-75 dark:text-gray-500">{op.before}</del>}
            {op.after && (
              <ins className="rounded-sm bg-success-500/20 text-gray-800 no-underline shadow-[0_0_0_1px] shadow-success-500/20 box-decoration-clone dark:text-white/90">{op.after}</ins>
            )}
          </span>
        ),
      )}
    </div>
  );
}

function CopyButton({ label, value }: { label: string; value: () => string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={btnSmall}
      onClick={async () => {
        await navigator.clipboard.writeText(value());
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
    >
      {done ? "skopiowano" : label}
    </button>
  );
}

/* ---------- szkice w przeglądarce ----------
   Oryginalna treść z WordPressa poprawiana bez przebiegu zapisuje się
   lokalnie – zapis zwrotny do CMS-u idzie przez szkic/wdrożenie zadania. */

export const draftKey = (domain: string, postId: number, slot: number) => `cw-draft:${domain}:${postId}:${slot}`;
function readDraft(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/* ---------- sekcja ---------- */

export type SectionProps = {
  block: SectionBlock;
  domain: string;
  postId: number;
  job: Job | null;
  mode: string | undefined;
  expert: any | null;
  styleRow: StyleRow | null;
  imageRow: ImageRow | null;
  hidden: boolean;
};

export default function DocSection(props: SectionProps) {
  return props.block.section ? <ChangedSection {...props} section={props.block.section} /> : <PlainSection {...props} />;
}

const HEADING_FALLBACK = (block: SectionBlock) =>
  block.kind === "faq" ? `Pytanie ${block.slot - 100}` : block.kind === "sources" ? "Źródła" : `Sekcja ${block.slot}`;

/** Sekcja dokumentu: po lewej rynienka na typy bloków i przyciski decyzji,
    wszystko poza rynienką trzyma jedną miarę z tekstem (49rem ≈ 78 znaków) –
    pasek na całą szerokość nad wąskim łamem wyglądał jak drugi dokument. */
export const SECTION_CLS =
  "doc-gutter group/sec relative border-b border-gray-100 pt-6.5 pr-7 pb-7.5 pl-19 [--doc-measure:49rem] last:border-b-0 max-md:px-4 max-md:pt-5 max-md:pb-6 dark:border-gray-800 [&>:not([data-gutter])]:max-w-(--doc-measure)";

/* FAQ: węższe odstępy (pytania pod wspólnym nagłówkiem bloku); Źródła stoją
   na stronie za FAQ – odcięte kreską. Klasy ed-* to znaczniki dla snapshot.ts. */
function sectionClass(block: SectionBlock) {
  return cn(
    "ed-doc-section",
    SECTION_CLS,
    block.kind === "faq" && "ed-doc-faq pt-4.5 pb-5",
    block.kind === "sources" && "ed-doc-sources border-t border-t-gray-200 dark:border-t-gray-800",
  );
}

/** Kolorowa krawędź po lewej mówi, co się dzieje z sekcją po przebiegu. */
const edge = (color: string) => cn("after:absolute after:inset-y-0 after:left-0 after:w-[3px]", color);

const HEAD_CLS = "ed-sec-head mb-3.5 flex flex-wrap items-baseline gap-x-3.5 gap-y-1.5";
const TOOLS_CLS = "mb-3.5 flex flex-wrap items-center gap-x-2.5 gap-y-2 text-theme-xs text-gray-500 dark:text-gray-400";
const Spacer = () => <span className="flex-1" />;

/** Heading sekcji: pytanie FAQ to na stronie H3 pod wspólnym H2 bloku –
    renderujemy tak samo, żeby liczba nagłówków zgadzała się z tym, co widzi Google. */
function Heading({ block, text, className, title }: { block: SectionBlock; text: string; className?: string; title?: string }) {
  const H = block.kind === "faq" ? "h3" : "h2";
  return (
    <H
      data-block={H}
      className={cn("leading-tight font-medium text-gray-800 dark:text-white/90", H === "h3" ? "text-base" : "text-xl", className)}
      title={title}
    >
      {text || HEADING_FALLBACK(block)}
    </H>
  );
}

/** Bibliografia stoi na stronie pod FAQ, przed boksem autora – etykieta, żeby
    nikt nie szukał jej wśród sekcji treści. */
const SourcesTag = ({ block }: { block: SectionBlock }) =>
  block.kind === "sources" ? <Status tone="idle">blok za FAQ · page_sources_text</Status> : null;

/** Sekcja bez propozycji: treść z WordPressa (albo lokalny szkic) do poprawy w miejscu. */
function PlainSection({ block, domain, postId, job, expert, styleRow, imageRow, hidden }: SectionProps) {
  const key = draftKey(domain, postId, block.slot);
  // Szkic z poprzedniej sesji ma pierwszeństwo przed treścią z WordPressa –
  // inaczej odświeżenie strony po cichu kasowałoby pracę redaktora.
  const [draft, setDraft] = useState<string | null>(() => readDraft(key));
  const [editing, setEditing] = useState(false);
  const [dirty, setDirty] = useState(false);
  const body = useRef<HTMLDivElement>(null);
  // Sekcja bez propozycji po zakończonym przebiegu – wyciszona, z etykietą.
  const unchanged = job?.status === "done" && Boolean(job.sections?.length);

  useEffect(() => {
    if (editing) body.current?.focus();
  }, [editing]);

  const save = () => {
    const html = body.current?.innerHTML ?? "";
    try {
      localStorage.setItem(key, html);
    } catch {
      showEditorError("Nie udało się zapisać szkicu w przeglądarce (brak miejsca?).");
      return;
    }
    setDraft(html);
    setDirty(false);
  };
  // Powrót do treści z WordPressa – bez tego szkic zostaje na zawsze.
  const drop = () => {
    try {
      localStorage.removeItem(key);
    } catch {
      /* brak dostępu do localStorage nie blokuje strony */
    }
    setDraft(null);
    setDirty(false);
  };
  useEffect(() => editorStore.touchDoc(), [draft]);

  return (
    <section className={cn(sectionClass(block), unchanged && "opacity-72 hover:opacity-100")} data-slot={block.slot} data-kind={block.kind} data-dirty={dirty ? "1" : undefined} hidden={hidden}>
      {!block.bare && (
        <div className={HEAD_CLS}>
          <Heading block={block} text={block.title} />
          <SourcesTag block={block} />
          {draft !== null && <Status tone="warn">szkic roboczy</Status>}
          {/* Wyciszenie samą przezroczystością myliło się z odrzuconą
              propozycją – etykieta mówi wprost, czemu sekcja wygląda inaczej. */}
          {unchanged && <Status tone="idle">bez zmian</Status>}
        </div>
      )}
      {!block.bare && (
        <div className={TOOLS_CLS}>
          <Spacer />
          {dirty && (
            <button type="button" className={btnSmallPrimary} onClick={save}>
              zapisz szkic
            </button>
          )}
          {draft !== null && (
            <button type="button" className={btnSmall} onClick={drop}>
              odrzuć szkic
            </button>
          )}
          <button type="button" className={btnSmall} onClick={() => (editing ? body.current?.focus() : setEditing(true))}>
            edytuj tekst
          </button>
          {/* Infografika i CTA to narzędzia sekcji treści – w FAQ i w
              bibliografii Worker i tak je odrzuca (400). */}
          {block.kind === "section" && <SectionExtras job={job} slot={block.slot} imageRow={imageRow} />}
          <CopyButton label="kopiuj treść" value={() => body.current?.innerHTML ?? ""} />
        </div>
      )}
      <SectionPanels slot={block.slot} html={draft ?? block.html} />
      {editing && <FormatBar />}
      {styleRow && <StyleBlock row={styleRow} job={job!} />}
      <Prose
        html={draft ?? block.html}
        editable={editing}
        bodyRef={body}
        onInput={() => {
          setDirty(true);
          scheduleScore();
        }}
      />
      {expert && <ExpertQuote expert={expert} />}
    </section>
  );
}

/** Sekcja z propozycją przebiegu. */
function ChangedSection({ block, job, mode: storedMode, expert, styleRow, imageRow, hidden, section }: SectionProps & { section: Section }) {
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const body = useRef<HTMLDivElement>(null);
  // Sekcja bez opcode'ów (wstawka pipeline'u albo wiersz założony przy
  // akceptacji korekty stylu) nie ma czego pokazać w trybie „zmiany".
  const hasDiff = Boolean(section.diff?.opcodes?.length);
  const mode = storedMode ?? (section.operation === "insert" || !hasDiff || changeRatio(section) > 0.5 ? "after" : "diff");
  const modes: [string, string][] =
    section.operation === "insert"
      ? [["after", "podgląd"]]
      : hasDiff
        ? [
            ["diff", "zmiany"],
            ["after", "wersja po"],
            ["before", "oryginał"],
          ]
        : [
            ["after", "wersja po"],
            ["before", "oryginał"],
          ];
  const title = section.title_after || block.title;
  const retitled = Boolean(section.title_after && section.title_before && section.title_after !== section.title_before);

  // Przełączenie widoku podmienia węzły tekstowe – zakresy podświetleń fraz
  // trzeba policzyć na nowo.
  useEffect(() => editorStore.touchDoc(), [mode]);

  const saveEdits = async () => {
    const html = body.current?.innerHTML;
    if (html === undefined || !job) return;
    setSaving(true);
    try {
      const { data } = await api<any>(`/api/cw/jobs/${job.id}/sections/${section.slot}`, { method: "PATCH", body: { text_after: html } });
      // Serwer zwraca wersję po własnej sanityzacji – to ona jest prawdą.
      editorStore.patchSection(section.slot, { text_after: data.text_after ?? html, edited: true });
      setDirty(false);
    } catch (error) {
      showEditorError(errorText(error, "Nie udało się zapisać poprawek."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section
      className={cn(
        sectionClass(block),
        section.decision === "rejected"
          ? cn(edge("after:bg-gray-200 dark:after:bg-gray-700"), "opacity-50 hover:opacity-100")
          : edge(section.decision === "accepted" || section.operation === "insert" ? "after:bg-success-500" : "after:bg-brand-500"),
      )}
      data-slot={block.slot}
      data-kind={block.kind}
      data-decision={section.decision ?? ""}
      hidden={hidden}
    >
      {job && <DecideGutter section={section} job={job} />}
      <div className={HEAD_CLS}>
        {/* Rynienkę zajmują tu przyciski decyzji – etykieta nagłówka wpadłaby pod nie. */}
        <Heading
          block={block}
          text={title}
          className={cn(job && "before:hidden", retitled && "underline decoration-brand-500 underline-offset-5")}
          title={retitled ? `poprzednio: ${section.title_before}` : undefined}
        />
        <SourcesTag block={block} />
        <SectionTags section={section} kind={block.kind} />
      </div>
      <div className={TOOLS_CLS}>
        <span className="inline-flex">
          {modes.map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={cn(
                "-ml-px h-8 border border-gray-300 px-2.5 text-theme-xs font-medium text-gray-600 first:ml-0 first:rounded-l last:rounded-r hover:text-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:text-white/90",
                value === mode && "relative z-1 border-brand-500 bg-brand-50 text-gray-800 dark:border-brand-500 dark:bg-brand-500/15 dark:text-white/90",
              )}
              data-mode={value} onClick={() => editorStore.setMode(section.slot, value)}>
              {label}
            </button>
          ))}
        </span>
        <Spacer />
        {dirty && (
          <button type="button" className={btnSmallPrimary} disabled={saving} onClick={saveEdits}>
            zapisz poprawki
          </button>
        )}
        <SectionExtras job={job} slot={section.slot} imageRow={imageRow} />
        <CopyButton label="kopiuj nagłówek" value={() => section.title_after ?? ""} />
        <CopyButton label="kopiuj treść" value={() => sectionCopyText(section, job)} />
      </div>
      <SectionPanels slot={section.slot} html={section.text_after} />
      <LinkDiff section={section} />
      {styleRow && job && <StyleBlock row={styleRow} job={job} />}
      <div>
        {mode === "diff" ? (
          <Opcodes opcodes={section.diff?.opcodes ?? []} />
        ) : mode === "before" ? (
          <Prose key="before" html={section.text_before} />
        ) : (
          // Wersja „po" jest edytowalna razem z paskiem formatowania – poprawki
          // zapisują się do zadania, a „kopiuj treść" bierze tekst po edycji.
          <>
            <FormatBar />
            <Prose
              key="after"
              html={section.text_after}
              editable
              bodyRef={body}
              onInput={() => {
                setDirty(true);
                scheduleScore();
              }}
            />
          </>
        )}
      </div>
      {expert && <ExpertQuote expert={expert} />}
    </section>
  );
}

/** Cytat eksperta wpięty na końcu sekcji (sanityzowany jak reszta treści). */
function ExpertQuote({ expert }: { expert: any }) {
  return <Prose html={expertBlockquote(expert)} className="ed-doc-expert mt-3.5" blocks={false} />;
}

/* ---------- decyzje i etykiety ---------- */

/** Rynienka decyzji: ✓ zatwierdza propozycję, ✕ ją odrzuca. Klik w aktywny
    stan cofa decyzję – sekcja wraca do „nieocenionych". */
function DecideGutter({ section, job }: { section: Section; job: Job }) {
  const set = async (next: "accepted" | "rejected") => {
    const value = section.decision === next ? null : next;
    const previous = section.decision;
    editorStore.patchSection(section.slot, { decision: value, accepted: value === "accepted" });
    try {
      await api(`/api/cw/jobs/${job.id}/sections/${section.slot}`, { method: "PATCH", body: { decision: value } });
    } catch (error) {
      editorStore.patchSection(section.slot, { decision: previous, accepted: previous === "accepted" });
      showEditorError(errorText(error, "Nie udało się zapisać decyzji."));
    }
  };
  const button = (kind: "accepted" | "rejected", glyph: string, title: string) => (
    <button
      type="button"
      className={cn(
        "grid size-7.5 place-items-center rounded-full border border-gray-300 bg-white text-theme-sm leading-none text-gray-500 transition-colors hover:border-gray-500 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:text-white/90",
        section.decision === kind &&
          (kind === "accepted"
            ? "border-success-500 bg-success-500 text-white hover:border-success-500 hover:text-white dark:border-success-500 dark:bg-success-500 dark:text-gray-950"
            : "border-gray-500 bg-gray-100 text-gray-800 dark:bg-white/10 dark:text-white/90"),
      )}
      data-decision={kind}
      title={title}
      aria-label={title}
      onClick={() => set(kind)}
    >
      {glyph}
    </button>
  );
  return (
    <div data-gutter className="absolute top-6 left-4 grid gap-2 max-md:static max-md:mb-3 max-md:flex">
      {button("accepted", "✓", "Zatwierdź propozycję dla tej sekcji")}
      {button("rejected", "✕", "Odrzuć propozycję dla tej sekcji")}
    </div>
  );
}

/** Etykiety przy nagłówku: rozmiar zmiany, ostrzeżenia, stan decyzji. */
function SectionTags({ section, kind }: { section: Section; kind: string }) {
  const tags: [string, Tone][] = [];
  const stats = section.diff?.stats;
  const words = () => `+${pl.format(stats!.added)} / −${pl.format(stats!.removed)} słów`;
  // Nazywamy rzecz po imieniu: w bloku FAQ dochodzi pytanie, nie sekcja.
  if (section.operation === "insert") tags.push([kind === "sources" ? "nowy blok Źródła (za FAQ)" : kind === "faq" ? "nowe pytanie FAQ" : "nowa sekcja", "mid"]);
  else if (section.operation === "move") {
    // Renumeracja układu: treść przyszła z innego slotu. Diff liczony jest
    // względem źródła, więc statystyki pokazujemy tylko przy realnej zmianie.
    tags.push([`przesunięta z sekcji ${section.moved_from ?? "?"}`, "mid"]);
    if (stats && (stats.added || stats.removed)) tags.push([words(), "idle"]);
  } else if (stats) tags.push([words(), "idle"]);
  else tags.push(["aktualizacja", "idle"]);
  if (stats?.shrunk) tags.push(["model wyciął więcej, niż dopisał", "warn"]);
  const removed = sectionLinkDiff(section).removed.length;
  if (removed) tags.push([removed === 1 ? "zniknął 1 link" : `zniknęły ${removed} linki`, "warn"]);
  if (section.edited) tags.push(["ręcznie poprawiona", "idle"]);
  if (section.decision === "accepted") tags.push(["zatwierdzone", "ok"]);
  if (section.decision === "rejected") tags.push(["odrzucone", "idle"]);
  return (
    <span className="inline-flex flex-wrap gap-1.5">
      {tags.map(([text, tone]) => (
        <Status key={text} tone={tone}>
          {text}
        </Status>
      ))}
    </span>
  );
}

/** Raport linków: które adresy doszły, a które zniknęły w propozycji. */
function LinkDiff({ section }: { section: Section }) {
  const { added, removed } = sectionLinkDiff(section);
  if (!added.length && !removed.length) return null;
  const row = (sign: string, cls: "added" | "removed", link: { href: string; text: string }, i: number) => (
    <div key={`${cls}${i}`} className="flex min-w-0 flex-wrap items-baseline gap-1.5">
      <b className={cn("font-medium", cls === "added" ? "text-success-600 dark:text-success-400" : "text-error-600 dark:text-error-400")}>{sign}</b>
      <span className={cn(cls === "removed" && "text-gray-500 line-through dark:text-gray-400")}>{link.text ? `„${link.text}"` : "(bez anchora)"}</span>
      {" → "}
      <a className="text-gray-500 [overflow-wrap:anywhere] hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400" href={link.href} target="_blank" rel="noopener">
        {link.href}
      </a>
    </div>
  );
  return (
    <div className="mb-3 grid gap-1 rounded border border-gray-100 bg-gray-50 px-3 py-2 text-theme-xs text-gray-600 dark:border-gray-800 dark:bg-white/3 dark:text-gray-300">
      <span className="font-medium tracking-wide text-gray-600 uppercase dark:text-gray-300">{`Linki: ${added.length ? `+${added.length} ` : ""}${removed.length ? `−${removed.length} usunięte` : ""}`.trim()}</span>
      {removed.map((link, i) => row("−", "removed", link, i))}
      {added.map((link, i) => row("+", "added", link, i))}
    </div>
  );
}

/* ---------- korekta redaktorska (styl i fleksja) ---------- */

/** Propozycja korekty wpięta w sekcję: uwagi, diff słowny i decyzja. */
function StyleBlock({ row, job }: { row: StyleRow; job: Job }) {
  const [busy, setBusy] = useState(false);
  const decide = async (decision: "accepted" | "rejected" | null) => {
    // Po zatwierdzeniu korekty sekcja pokazuje docelowy tekst: diff pipeline'u
    // liczony jest względem oryginału i o poprawce redaktorskiej nie wie.
    if (decision === "accepted") editorStore.setMode(row.slot, "after");
    setBusy(true);
    try {
      const { data } = await api<any>(`/api/cw/jobs/${job.id}/style/${row.slot}`, { method: "PATCH", body: { decision } });
      if (data.job) editorStore.set({ job: data.job });
    } catch (error) {
      showEditorError(errorText(error, "Nie udało się wykonać przejazdu."));
    } finally {
      setBusy(false);
    }
  };
  const action = (label: string, decision: "accepted" | "rejected" | null, cls: string) => (
    <button type="button" className={cn(btnSmall, cls === "ok" && "hover:border-success-500 hover:text-success-700 dark:hover:text-success-400")} disabled={busy} onClick={() => decide(decision)}>
      {label}
    </button>
  );
  return (
    // Propozycja korekty to komentarz redakcyjny do tekstu – własna ramka, nie wygląd bloku treści.
    <div
      className={cn(
        CARD_CLS,
        row.decision === "accepted" ? "border-l-success-500" : row.decision === "rejected" ? "border-l-gray-300 opacity-60 dark:border-l-gray-700" : "border-l-brand-500",
      )}
      data-decision={row.decision ?? ""}
    >
      <div className={CARD_HEAD_CLS}>
        <span className={CARD_LABEL_CLS}>
          {row.decision === "accepted" ? "korekta redaktorska · zastosowana" : row.decision === "rejected" ? "korekta redaktorska · odrzucona" : "korekta redaktorska"}
        </span>
        {(row.warnings ?? []).map((warning) => (
          <Status key={warning.label} tone="warn">
            {warning.label}
          </Status>
        ))}
        <Spacer />
        {row.decision === "accepted" ? (
          action("cofnij", null, "undo")
        ) : row.decision === "rejected" ? (
          action("przywróć propozycję", null, "undo")
        ) : (
          <>
            {action("✓ zastosuj", "accepted", "ok")}
            {action("✕ odrzuć", "rejected", "no")}
          </>
        )}
      </div>
      {row.title_after && row.title_after !== row.title_before && (
        <p className="mb-2 text-theme-sm text-gray-600 dark:text-gray-300">
          nagłówek: <del className="text-gray-400 opacity-75">{row.title_before ?? ""}</del>{" "}
          <ins className="font-medium text-gray-800 no-underline dark:text-white/90">{row.title_after}</ins>
        </p>
      )}
      {row.issues?.length > 0 && (
        <ul className="mb-2 list-disc pl-4.5 text-theme-sm/relaxed text-gray-600 dark:text-gray-300">
          {row.issues.map((issue, i) => (
            <li key={i}>{issue}</li>
          ))}
        </ul>
      )}
      {/* Zatwierdzona korekta jest już treścią sekcji – diff zostaje zwinięty,
          żeby dokument nie zamienił się w ścianę przekreśleń. */}
      <details open={!row.decision}>
        <summary className="cursor-pointer text-theme-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">co się zmienia w treści</summary>
        <Opcodes className="mt-2" opcodes={wordDiff(row.text_before, row.text_after)} />
      </details>
    </div>
  );
}

/* ---------- infografika i CTA ----------
   Przyciski w pasku narzędzi otwierają panele pod paskiem. Stan paneli per
   slot trzymamy w module – przyciski i panele siedzą w różnych miejscach
   sekcji, a obie strony muszą go widzieć. */

/** Ramka paneli w sekcji (korekta, infografika, CTA) – kolor lewej krawędzi dokłada wywołujący. */
const CARD_CLS = "mb-4 rounded border border-l-3 border-y-gray-200 border-r-gray-200 bg-gray-50 px-3.5 py-3 dark:border-y-gray-800 dark:border-r-gray-800 dark:bg-white/3";
const CARD_HEAD_CLS = "mb-2 flex flex-wrap items-center gap-2";
const CARD_LABEL_CLS = "text-theme-xs font-medium tracking-wider text-gray-600 uppercase dark:text-gray-300";
const NOTE_CLS = "mt-1.5 text-theme-xs text-gray-500 dark:text-gray-400";
const ERROR_CLS = "mt-2.5 text-theme-sm text-error-600 dark:text-error-400";

type PanelState = { image: boolean; cta: boolean };
const panelListeners = new Map<number, Set<() => void>>();
const panelState = new Map<number, PanelState>();
const getPanels = (slot: number) => panelState.get(slot) ?? { image: false, cta: false };
function setPanels(slot: number, patch: Partial<PanelState>) {
  panelState.set(slot, { ...getPanels(slot), ...patch });
  panelListeners.get(slot)?.forEach((listener) => listener());
}
function usePanels(slot: number) {
  const [, force] = useState(0);
  useEffect(() => {
    const listener = () => force((n) => n + 1);
    const set = panelListeners.get(slot) ?? new Set();
    set.add(listener);
    panelListeners.set(slot, set);
    return () => void set.delete(listener);
  }, [slot]);
  return getPanels(slot);
}

// Treść sekcji z blokiem CTA (kotwica #cw-cta przeżywa obie sanityzacje) – bieżący + epizod 1.1.0.
const CTA_MARKERS = ["kontakt/#cw-cta", "mailto:biuro@grupa-icea.pl"];
const hasCta = (html: string | null) => Boolean(html && CTA_MARKERS.some((marker) => html.includes(marker)));

/** Przyciski „infografika” i „CTA” w pasku sekcji – dostępne po zakończonym przebiegu. */
function SectionExtras({ job, slot, imageRow }: { job: Job | null; slot: number; imageRow: ImageRow | null }) {
  const panels = usePanels(slot);
  // Wiersz infografiki z zadania otwiera panel sam – jak dawne applyImagesToDoc.
  useEffect(() => {
    if (imageRow) setPanels(slot, { image: true });
  }, [imageRow, slot]);
  if (job?.status !== "done") return null;
  return (
    <>
      <button type="button" className={btnSmall} title="Wygeneruj infografikę do tej sekcji" onClick={() => setPanels(slot, { image: !panels.image })}>
        infografika
      </button>
      <button type="button" className={btnSmall} title="Wstaw blok CTA na koniec tej sekcji" onClick={() => setPanels(slot, { cta: !panels.cta })}>
        CTA
      </button>
    </>
  );
}

/** Panele otwarte przyciskami z paska – stoją zaraz pod nim. */
function SectionPanels({ slot, html }: { slot: number; html: string | null }) {
  const panels = usePanels(slot);
  return (
    <>
      {panels.image && <ImagePanel slot={slot} />}
      {panels.cta && <CtaPanel slot={slot} inserted={hasCta(html)} />}
    </>
  );
}

/* Infografika: cztery kroki po stronie Workera (opis → zlecenie → obraz →
   wstawienie), bo kie.ai oddaje obraz po 30–180 s, czyli po końcu żądania. */
function ImagePanel({ slot }: { slot: number }) {
  const job = editorStore.get().job!;
  const fromJob = ((job?.images ?? []) as ImageRow[]).find((row) => row.slot === slot) ?? null;
  const [row, setRow] = useState<ImageRow | null>(fromJob);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ brief: fromJob?.brief ?? "", alt: fromJob?.alt ?? "", caption: fromJob?.caption ?? "" });
  useEffect(() => {
    setRow(fromJob);
    setForm({ brief: fromJob?.brief ?? "", alt: fromJob?.alt ?? "", caption: fromJob?.caption ?? "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(fromJob)]);

  const call = async (body: Record<string, unknown>) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const { data } = await api<any>(`/api/cw/jobs/${job.id}/infographic/${slot}`, { method: "POST", body });
      // Wstawienie i usunięcie zmieniają treść sekcji w bazie – dokument musi
      // zobaczyć nowy stan, inaczej obrazek pojawiłby się dopiero po F5.
      if (body.step === "insert" || body.step === "drop") await refreshJob(job.id);
      else setRow(data.image ?? null);
      if (data.image) setForm({ brief: data.image.brief ?? "", alt: data.image.alt ?? "", caption: data.image.caption ?? "" });
    } catch (e) {
      setError(errorText(e, "Nie udało się wykonać kroku."));
    } finally {
      setBusy(false);
    }
  };

  // Odpytywanie kie.ai przez Workera – obraz liczy się do trzech minut.
  useEffect(() => {
    if (row?.status !== "generating") return;
    let attempt = 0;
    let timer = 0;
    const tick = async () => {
      if (attempt++ > 30) return;
      if (!document.hidden) {
        try {
          const { data } = await api<any>(`/api/cw/jobs/${job.id}/infographic/${slot}`);
          if (data.image) setRow(data.image);
          if (data.image?.status !== "generating") return;
        } catch {
          /* spróbujemy przy następnym kroku */
        }
      }
      timer = window.setTimeout(tick, 8000);
    };
    timer = window.setTimeout(tick, 8000);
    return () => window.clearTimeout(timer);
  }, [row?.status, job.id, slot]);

  const button = (text: string, onClick: () => void, cls = "") => <PanelButton text={text} onClick={onClick} primary={cls === "ok"} />;
  const close = button("zwiń", () => setPanels(slot, { image: false }));
  const head = (children: React.ReactNode) => (
    <div className={cn(CARD_HEAD_CLS, "mb-0")}>
      <span className={CARD_LABEL_CLS}>infografika</span>
      <Spacer />
      {children}
    </div>
  );

  let content: React.ReactNode;
  if (busy) content = head(<Waiting>pracuję…</Waiting>);
  else if (!row)
    content = (
      <>
        {head(
          <>
            {button("zaproponuj opis grafiki", () => call({ step: "brief" }), "ok")}
            {close}
          </>,
        )}
        <p className={NOTE_CLS}>Model przeczyta tę sekcję i zaproponuje treść grafiki. Styl (paleta ICEA, format 16:9, polskie etykiety) jest stały i nie podlega edycji.</p>
      </>
    );
  else if (row.status === "inserted")
    content = (
      <>
        {head(
          <>
            {button("usuń z sekcji", () => call({ step: "drop" }))}
            {close}
          </>,
        )}
        <p className={NOTE_CLS}>
          Grafika stoi na końcu sekcji i jest w bibliotece mediów (ID {row.media_id ?? "?"}). Usunięcie zdejmuje ją z treści, plik w bibliotece zostaje.
        </p>
      </>
    );
  else if (row.status === "generating")
    content = head(
      <>
        <Waiting>obraz się generuje… (do trzech minut)</Waiting>
        {close}
      </>,
    );
  else if (row.status === "ready" && row.image_url)
    content = (
      <>
        {head(
          <>
            {button("wstaw do sekcji", () => call({ step: "insert" }), "ok")}
            {button("generuj ponownie", () => call({ step: "generate", brief: row.brief, alt: row.alt, caption: row.caption }))}
            {close}
          </>,
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="mt-2.5 mb-1.5 block h-auto w-full max-w-180 rounded border border-gray-200 dark:border-gray-800" src={row.image_url} alt={row.alt ?? ""} loading="lazy" />
        <p className={NOTE_CLS}>
          {[row.caption ? `Podpis: ${row.caption}` : null, row.credits ? `kredyty kie.ai: ${row.credits}` : null, 'Adres z kie.ai jest tymczasowy – „wstaw do sekcji” wgrywa plik do biblioteki mediów.']
            .filter(Boolean)
            .join(" · ")}
        </p>
      </>
    );
  else
    // status 'brief' albo 'failed' – opis do edycji i przycisk generowania.
    content = (
      <>
        {head(close)}
        <div className="mt-2.5 mb-1.5 flex flex-col gap-2">
          <textarea className={cn(input, "min-h-28 resize-y leading-relaxed")} rows={6} spellCheck={false} value={form.brief} onChange={(e) => setForm({ ...form, brief: e.target.value })} />
          <input className={input} type="text" placeholder="tekst alternatywny (alt)" maxLength={300} value={form.alt} onChange={(e) => setForm({ ...form, alt: e.target.value })} />
          <input className={input} type="text" placeholder="podpis pod grafiką" maxLength={300} value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })} />
          <span>{button("wygeneruj obraz", () => call({ step: "generate", ...form }), "ok")}</span>
        </div>
        <p className={NOTE_CLS}>Opis po angielsku, etykiety na grafice po polsku – model graficzny psuje napisy dłuższe niż cztery słowa.</p>
      </>
    );

  return (
    <div className={cn(CARD_CLS, "border-l-orange-500")}>
      {content}
      {(error || (!busy && row?.error && row.status === "failed")) && <p className={ERROR_CLS}>{error ?? row?.error}</p>}
    </div>
  );
}

/* Uniwersalne CTA: gotowa wstawka bez modelu (cw-cta.js) – wstaw/zdejmij na
   końcu sekcji. Świadomy duplikat szablonu z cw-cta.js (ctaHtml) – podgląd ma
   wyglądać jak blok na stronie; szablon jest nasz i statyczny, więc idzie
   wprost, bez sanityzacji (ta zdjęłaby style). */
const CTA_PREVIEW =
  '<div style="margin:28px 0;padding:26px 28px;background:#000623;border-radius:12px">' +
  '<p style="margin:0 0 6px;color:#ffffff;font-size:19px;font-weight:700;line-height:1.4">Chcesz, żeby klienci znajdowali Twoją firmę w Google i w wyszukiwarkach AI?</p>' +
  '<p style="margin:0 0 18px;color:#c7cbe0;font-size:15px;line-height:1.6">Przeanalizujemy Twoją stronę i pokażemy, co blokuje jej widoczność. Konsultacja jest bezpłatna i niezobowiązująca.</p>' +
  '<a href="https://www.grupa-icea.pl/kontakt/#cw-cta"><span style="display:inline-block;padding:12px 26px;background:#5768ff;color:#ffffff;border-radius:8px;font-weight:700;font-size:15px">Umów bezpłatną konsultację</span></a>' +
  "</div>";

function CtaPanel({ slot, inserted }: { slot: number; inserted: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const call = async (step: "insert" | "drop") => {
    const job = editorStore.get().job;
    if (!job || busy) return;
    setBusy(true);
    setError(null);
    try {
      await api(`/api/cw/jobs/${job.id}/cta/${slot}`, { method: "POST", body: { step } });
      setPanels(slot, { cta: false });
      await refreshJob(job.id);
    } catch (e) {
      setError(errorText(e, "Nie udało się wykonać kroku."));
    } finally {
      setBusy(false);
    }
  };
  const button = (text: string, onClick: () => void, cls = "") => <PanelButton text={text} onClick={onClick} primary={cls === "ok"} />;
  return (
    <div className={cn(CARD_CLS, "border-l-orange-500")}>
      <div className={CARD_HEAD_CLS}>
        <span className={CARD_LABEL_CLS}>CTA</span>
        <Spacer />
        {busy ? (
          <Waiting>zapisuję…</Waiting>
        ) : (
          <>
            {inserted ? button("usuń z sekcji", () => call("drop")) : button("wstaw na koniec sekcji", () => call("insert"), "ok")}
            {button("zwiń", () => setPanels(slot, { cta: false }))}
          </>
        )}
      </div>
      {!busy &&
        (inserted ? (
          <p className={NOTE_CLS}>Blok CTA stoi na końcu tej sekcji. Usunięcie zdejmuje go z treści.</p>
        ) : (
          <>
            <div dangerouslySetInnerHTML={{ __html: CTA_PREVIEW }} />
            <p className={NOTE_CLS}>Gotowa wstawka – ten sam blok na każdej stronie, przycisk prowadzi na /kontakt/.</p>
          </>
        ))}
      {error && <p className={ERROR_CLS}>{error}</p>}
    </div>
  );
}

function PanelButton({ text, onClick, primary }: { text: string; onClick: () => void; primary: boolean }) {
  return (
    <button type="button" className={primary ? btnSmallPrimary : btnSmall} onClick={onClick}>
      {text}
    </button>
  );
}

