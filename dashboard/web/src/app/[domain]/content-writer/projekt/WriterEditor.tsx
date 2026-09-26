"use client";

/* Content Writer – pełnoekranowy edytor gotowego tekstu.
   Lewa część: dokument (H1, wstęp, sekcje H2, FAQ, Źródła) z paskiem narzędzi.
   Prawa: ocena na żywo i frazy z zakresem wystąpień wg czołówki SERP-a.

   Dokument jest złożony z bloków, bo tak leży w bazie: każda sekcja to slot
   ACF (job_sections), wstęp i tytuł to pola projektu. Blok zapisuje się sam
   ~1,5 s po ostatniej zmianie; każda akcja, która czyta treść z bazy (szkic
   WP, styl, CTA, infografika), najpierw woła flush().

   Pola edycyjne są niekontrolowane (contentEditable): React wypełnia je tylko
   przy zmianie treści z bazy i tylko wtedy, gdy blok nie czeka na zapis –
   inaczej każde przerysowanie przesuwałoby kursor w trakcie pisania. Stan
   bloków (tekst, tokeny, zapis) trzyma rejestr w refie, a panel boczny
   odświeża się licznikiem `version`. Klasy z dawnego modułu (legacy.css). */
import { matchTokens, phraseStems, tokens } from "@/lib/phrase-match.js";
import { api, fmtDateTime, fmtInt, sleep, type ApiError } from "@/lib/writer-client";
import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Any = Record<string, any>;

const CTA_MARKER = "kontakt/#cw-cta";
const FAQ_BASE = 100;
const SOURCES_SLOT = 200;
const SAVE_DELAY = 1500;
const STYLE_DEFAULT = "google/gemini-3.7-flash:online";
const kindOf = (slot: number) => (slot === SOURCES_SLOT ? "sources" : slot > FAQ_BASE ? "faq" : "section");
const strip = (html: string) =>
  String(html ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
const countWords = (text: string) => text.split(/\s+/).filter(Boolean).length;
const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const savedStyleModel = () => {
  try {
    return localStorage.getItem("cw-style-model") ?? "";
  } catch {
    return "";
  }
};

type BlockKind = "title" | "lead" | "head" | "text";
type Block = {
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
};
type TermState = "none" | "low" | "ok" | "over";
type Tab = "frazy" | "plan" | "dopracowanie" | "publikacja";

/** Węzły tekstowe jako jeden ciąg; między blokami (akapity, punkty) spacja,
    żeby koniec jednego akapitu nie sklejał się z początkiem następnego. */
function textMap(root: Element) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const parts: { node: Text; start: number }[] = [];
  let text = "";
  let lastBlock: Element | null = null;
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const block = (node.parentElement?.closest("p, li, h2, h3, h4, blockquote, td, th, div") ?? root) as Element;
    if (lastBlock && block !== lastBlock) text += " ";
    lastBlock = block;
    parts.push({ node: node as Text, start: text.length });
    text += node.textContent ?? "";
  }
  return { text, parts };
}

function retoken(block: Block) {
  block.text = textMap(block.el).text;
  block.hay = tokens(block.text);
}

/** Sekcje w kolejności dokumentu: treść, FAQ, Źródła. */
function ordered(job: Any): Any[] {
  const rank = (slot: number) => (kindOf(slot) === "section" ? 0 : kindOf(slot) === "faq" ? 1 : 2);
  return [...((job?.sections ?? []) as Any[])].sort((a, b) => rank(a.slot) - rank(b.slot) || a.slot - b.slot);
}

export type WriterEditorProps = {
  base: string;
  project: Any;
  job: Any;
  authors: Any[];
  categories: Any[];
  open: boolean;
  /** Wczytuje projekt od nowa (nowe obiekty project/job). */
  refresh(): Promise<void>;
  exit(): void;
};

/* ---------- kontekst bloków (przekazywany do pól edycyjnych) ---------- */

type BlockApi = {
  bind(key: string, kind: BlockKind, slot: number | null, el: HTMLElement | null): void;
  loaded(key: string): void;
  isDirty(key: string): boolean;
  onInput(key: string): void;
  onFocus(key: string): void;
  onBlur(key: string): void;
  onKey(event: React.KeyboardEvent, key: string): void;
};

/** Pole edycyjne bloku. Treść z bazy wpisujemy ręcznie – React nie ma dzieci
    do porównywania, więc nie dotknie tego, co redaktor pisze. */
const Editable = memo(function Editable({
  blockKey,
  kind,
  slot,
  value,
  rich,
  tag: Tag = "div",
  className,
  label,
  api: blockApi,
}: {
  blockKey: string;
  kind: BlockKind;
  slot: number | null;
  value: string;
  rich: boolean;
  tag?: "div" | "h1" | "h2" | "h3";
  className: string;
  label?: string;
  api: BlockApi;
}) {
  const ref = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    blockApi.bind(blockKey, kind, slot, el);
    return () => blockApi.bind(blockKey, kind, slot, null);
  }, [blockApi, blockKey, kind, slot]);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || blockApi.isDirty(blockKey)) return;
    if (rich) el.innerHTML = value;
    else el.textContent = value;
    blockApi.loaded(blockKey);
  }, [blockApi, blockKey, value, rich]);
  return (
    <Tag
      ref={ref as never}
      className={className}
      contentEditable={rich ? true : "plaintext-only"}
      suppressContentEditableWarning
      spellCheck
      data-block={kind}
      aria-label={label}
      onInput={() => blockApi.onInput(blockKey)}
      onFocus={() => blockApi.onFocus(blockKey)}
      onBlur={() => blockApi.onBlur(blockKey)}
      onKeyDown={(event) => blockApi.onKey(event, blockKey)}
      // Wklejanie jako czysty tekst – style z Docs czy Worda i tak zdejmie sanitizer.
      onPaste={
        rich
          ? (event) => {
              const text = event.clipboardData?.getData("text/plain");
              if (text === undefined) return;
              event.preventDefault();
              document.execCommand("insertText", false, text);
            }
          : undefined
      }
    />
  );
});

/* ---------- edytor ---------- */

export default function WriterEditor({ base, project, job, authors, categories, open, refresh, exit }: WriterEditorProps) {
  const blocks = useRef(new Map<string, Block>()).current;
  const [version, setVersion] = useState(0);
  const bump = useCallback(() => setVersion((v) => v + 1), []);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [barError, setBarError] = useState<string | null>(null);
  const [focusKind, setFocusKind] = useState<BlockKind | null>(null);
  const lastFocus = useRef<Block | null>(null);
  const recountTimer = useRef<number | null>(null);
  const [tab, setTab] = useState<Tab>("frazy");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [terms, setTerms] = useState<Any[]>([]);
  const [termsMeta, setTermsMeta] = useState<Any>({});
  const [termsLoaded, setTermsLoaded] = useState(false);
  const [termFilter, setTermFilter] = useState<"all" | "todo" | "over">("all");
  const [activeTerm, setActiveTerm] = useState<string | null>(null);
  const activeHit = useRef(-1);
  const [messages, setMessages] = useState<Record<string, { text: string; tone: string }>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const savedRange = useRef<Range | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  /* Zapisane teksty sekcji (po sanitizacji serwera) do następnego wczytania
     projektu – na nich opiera się rozpoznanie nieaktualnych propozycji stylu. */
  const savedText = useRef(new Map<number, string>());
  useEffect(() => savedText.current.clear(), [job]);

  const message = (name: string, text: string, tone = "") => setMessages((all) => ({ ...all, [name]: { text, tone } }));

  /* ---------- zapis ---------- */

  const payloadOf = (block: Block): { path: string; body: Any } => {
    if (block.kind === "title") return { path: base, body: { title: block.el.textContent?.replace(/\s+/g, " ").trim() ?? "" } };
    if (block.kind === "lead") return { path: base, body: { lead: block.el.innerHTML } };
    const path = `/api/cw/jobs/${job.id}/sections/${block.slot}`;
    if (block.kind === "head") return { path, body: { title_after: block.el.textContent?.replace(/\s+/g, " ").trim() ?? "" } };
    return { path, body: { text_after: block.el.innerHTML } };
  };

  const save = async (block: Block): Promise<void> => {
    if (block.timer) {
      clearTimeout(block.timer);
      block.timer = null;
    }
    if (block.saving) await block.saving;
    if (!block.dirty) return;
    block.dirty = false;
    const { path, body } = payloadOf(block);
    block.saving = api<Any>(path, { method: "PATCH", body })
      .then(({ data }) => {
        block.error = null;
        setLastSaved(new Date().toISOString());
        if (block.kind === "text" && block.slot !== null) savedText.current.set(block.slot, data.text_after ?? body.text_after);
      })
      .catch((error: Error) => {
        block.dirty = true;
        block.error = error.message;
      })
      .finally(() => {
        block.saving = null;
        bump();
      });
    bump();
    await block.saving;
  };

  /** Zapisuje wszystko, co czeka; rzuca, gdy któryś blok się nie zapisał. */
  const flush = async () => {
    await Promise.all([...blocks.values()].filter((block) => block.dirty || block.saving).map(save));
    const failed = [...blocks.values()].find((block) => block.error);
    if (failed) throw new Error(`Nie zapisałem zmian: ${failed.error}`);
  };
  const flushRef = useRef(flush);
  flushRef.current = flush;

  useEffect(() => {
    const onUnload = (event: BeforeUnloadEvent) => {
      if ([...blocks.values()].some((block) => block.dirty || block.saving)) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, [blocks]);

  /* Rejestr bloków dla pól edycyjnych – jeden obiekt na cały czas życia
     edytora, żeby memo pól nie przerysowywało ich przy każdej zmianie. */
  const handlers = useRef({ save, flush, bump });
  handlers.current = { save, flush, bump };
  const blockApi = useMemo<BlockApi>(
    () => ({
      bind(key, kind, slot, el) {
        if (!el) {
          const block = blocks.get(key);
          if (block?.timer) clearTimeout(block.timer);
          blocks.delete(key);
          return;
        }
        const block: Block = blocks.get(key) ?? { key, kind, slot, el, text: "", hay: [], dirty: false, timer: null, saving: null, error: null };
        block.el = el;
        blocks.set(key, block);
      },
      loaded(key) {
        const block = blocks.get(key);
        if (!block) return;
        retoken(block);
        handlers.current.bump();
      },
      isDirty: (key) => Boolean(blocks.get(key)?.dirty || blocks.get(key)?.saving),
      onInput(key) {
        const block = blocks.get(key);
        if (!block) return;
        block.dirty = true;
        block.error = null;
        if (block.timer) clearTimeout(block.timer);
        block.timer = window.setTimeout(() => handlers.current.save(block), SAVE_DELAY);
        if (recountTimer.current) clearTimeout(recountTimer.current);
        recountTimer.current = window.setTimeout(() => {
          retoken(block);
          handlers.current.bump();
        }, 300);
        handlers.current.bump();
      },
      onFocus(key) {
        const block = blocks.get(key) ?? null;
        lastFocus.current = block;
        setFocusKind(block?.kind ?? null);
      },
      onBlur(key) {
        const block = blocks.get(key);
        if (block?.dirty) handlers.current.save(block);
      },
      /** Enter w nagłówku przenosi do treści – nagłówek to jedna linia. */
      onKey(event, key) {
        const block = blocks.get(key);
        if (!block) return;
        if ((block.kind === "title" || block.kind === "head") && event.key === "Enter") {
          event.preventDefault();
          const next = block.kind === "title" ? blocks.get("lead") : blocks.get(`text:${block.slot}`);
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
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
          event.preventDefault();
          handlers.current.flush().catch((error) => setBarError((error as Error).message));
        }
      },
    }),
    [blocks],
  );

  /* ---------- frazy i ocena ---------- */

  useEffect(() => {
    api<Any>(`${base}/terms`)
      .then(({ data }) => {
        setTermsMeta(data);
        setTerms((data.terms ?? []).map((row: Any) => ({ ...row, stems: phraseStems(row.keyword) })));
      })
      .catch(() => setTerms([]))
      .finally(() => setTermsLoaded(true));
  }, [base]);

  const pool = () => [...blocks.values()];
  const termCount = (term: Any) => pool().reduce((sum, block) => sum + matchTokens(block.hay, term.stems).length, 0);
  /** Zakres frazy głównej bez danych konkurencji: ~1 raz na 250 słów. */
  const rangeOf = (term: Any) => {
    if (term.group === "main" && term.rivals_using === null) {
      const target = Number(termsMeta.target_words) || 1200;
      return { min: 2, max: Math.max(3, Math.round(target / 250)) };
    }
    return { min: term.min ?? 1, max: term.max ?? 2 };
  };
  const stateOf = (count: number, range: { min: number; max: number }): TermState =>
    !count ? "none" : count < range.min ? "low" : count > range.max ? "over" : "ok";
  const totalWords = () =>
    pool()
      .filter((block) => block.kind === "lead" || block.kind === "text")
      .reduce((sum, block) => sum + countWords(block.text), 0);
  const targetWords = () => {
    const write = (job.steps ?? []).find((step: Any) => step.step === "write")?.payload ?? {};
    return Number(project.brief?.target_words) || Number(write.target_words) || Number(termsMeta.target_words) || null;
  };

  /** Ocena 0–100: frazy 50, długość 25, nagłówki 20, tytuł 5. Frazy tylko
      z briefu i główna – luka SERP-a to podpowiedź, nie norma. */
  const score = () => {
    const scored = terms.filter((term) => term.group !== "gap");
    let weight = 0;
    let got = 0;
    for (const term of scored) {
      const range = rangeOf(term);
      const count = termCount(term);
      const w = term.group === "main" ? 3 : 1;
      const value = count >= range.min && count <= range.max ? 1 : count < range.min ? count / range.min : Math.max(0.5, 1 - ((count - range.max) / Math.max(range.max, 1)) * 0.5);
      weight += w;
      got += w * value;
    }
    const termsPart = weight ? got / weight : 0;
    const main = terms.find((term) => term.group === "main");
    const heads = pool().filter((block) => block.kind === "head");
    const outline = (project.brief?.outline ?? []) as Any[];
    const mainInHead = main ? heads.some((block) => matchTokens(block.hay, main.stems).length > 0) : false;
    const headCount = outline.length ? Math.min(1, heads.length / outline.length) : heads.length ? 1 : 0;
    const headsPart = (mainInHead ? 0.6 : 0) + 0.4 * headCount;
    const title = blocks.get("title");
    const titleText = title?.text.trim() ?? "";
    const titleHas = main && title ? matchTokens(title.hay, main.stems).length > 0 : false;
    const titleLen = titleText.length >= 30 && titleText.length <= 70 ? 1 : titleText.length ? 0.5 : 0;
    const titlePart = (titleHas ? 0.7 : 0) + 0.3 * titleLen;
    const words = totalWords();
    const target = targetWords();
    const ratio = target ? words / target : words >= 800 ? 1 : words / 800;
    const lengthPart = ratio >= 0.9 && ratio <= 1.25 ? 1 : ratio < 0.9 ? Math.max(0, ratio / 0.9) : Math.max(0.6, 1 - (ratio - 1.25));
    const total = Math.round(50 * termsPart + 25 * lengthPart + 20 * headsPart + 5 * titlePart);
    return { total, parts: { terms: termsPart, length: lengthPart, heads: headsPart, title: titlePart }, words, target, mainInHead, titleHas };
  };

  /* ---------- podświetlanie wystąpień ---------- */

  const termRanges = (term: Any) => {
    const ranges: Range[] = [];
    for (const block of pool()) {
      const map = textMap(block.el);
      for (const hit of matchTokens(tokens(map.text), term.stems)) {
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
        const range = document.createRange();
        const start = at(hit.start, false);
        const stop = at(hit.end, true);
        range.setStart(start.node, start.offset);
        range.setEnd(stop.node, stop.offset);
        ranges.push(range);
      }
    }
    return ranges;
  };

  const highlight = (keyword: string | null, jump: boolean) => {
    const registry = typeof CSS !== "undefined" && "highlights" in CSS ? (CSS as any).highlights : null;
    try {
      registry?.delete("we-term");
      registry?.delete("we-term-now");
      if (!keyword) return;
      const term = terms.find((row) => row.keyword === keyword);
      if (!term) return;
      const ranges = termRanges(term);
      if (!ranges.length) return;
      if (jump) activeHit.current = (activeHit.current + 1) % ranges.length;
      const current = ranges[Math.min(Math.max(activeHit.current, 0), ranges.length - 1)];
      const Ctor = (window as any).Highlight;
      if (registry && Ctor) {
        registry.set("we-term", new Ctor(...ranges));
        registry.set("we-term-now", new Ctor(current));
      }
      if (jump && scroller.current) {
        const rect = current.getBoundingClientRect();
        const box = scroller.current.getBoundingClientRect();
        scroller.current.scrollBy({ top: rect.top - box.top - box.height / 3, behavior: reducedMotion() ? "auto" : "smooth" });
      }
    } catch {
      // Drzewo DOM zmieniło się pod nami w trakcie pisania – następne
      // przeliczenie narysuje podświetlenie od nowa.
    }
  };
  // Po przeliczeniu tekstu podświetlenie aktywnej frazy idzie za treścią.
  useEffect(() => {
    if (activeTerm) highlight(activeTerm, false);
  }, [version, activeTerm]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------- akcje ---------- */

  /** Akcja czytająca treść z bazy: najpierw zapis, potem żądanie; przy błędzie
      świeży stan projektu i komunikat w panelu. */
  const guarded = async (name: string, label: string, run: () => Promise<void>) => {
    setBusy(label);
    try {
      await flush();
      await run();
    } catch (error) {
      await refresh().catch(() => undefined);
      message(name, (error as Error).message, "err");
    } finally {
      setBusy(null);
    }
  };

  const goTo = (anchor: string) => {
    const node = document.querySelector<HTMLElement>(anchor === "lead" ? '.we [data-block="lead"]' : `#we-${anchor}`);
    node?.scrollIntoView({ block: "start", behavior: reducedMotion() ? "auto" : "smooth" });
    if (window.matchMedia("(max-width: 1099px)").matches) setDrawerOpen(false);
  };

  const [author, setAuthor] = useState(String(project.author_id ?? ""));
  const [category, setCategory] = useState(String(project.category_id ?? ""));
  useEffect(() => {
    setAuthor(String(project.author_id ?? ""));
    setCategory(String(project.category_id ?? ""));
  }, [project.author_id, project.category_id]);

  const saveDraft = async () => {
    const authorId = Number.parseInt(author, 10);
    const categoryId = Number.parseInt(category, 10);
    if (!authorId || !categoryId) {
      setTab("publikacja");
      setDrawerOpen(true);
      message("wp", "Wybierz autora i kategorię – bez nich WordPress nie przyjmie szkicu.", "err");
      return;
    }
    await guarded("wp", "Zapisuję szkic…", async () => {
      await api(base, { method: "PATCH", body: { author_id: authorId, category_id: categoryId } });
      let saved;
      try {
        saved = await api<Any>(`${base}/wp-draft`, { method: "POST", body: {} });
      } catch (error) {
        const err = error as ApiError;
        if (err.code !== "edited_in_wp" || !confirm(`${err.message} Zapisać mimo to?`)) throw err;
        saved = await api<Any>(`${base}/wp-draft`, { method: "POST", body: { force: true } });
      }
      setTab("publikacja");
      await refresh();
      message("wp", `Szkic zapisany (ID ${saved.data.draft_id}).`, "ok");
    });
  };

  /** Akcje sekcji: CTA i pominięcie w szkicu (infografika ma własny panel). */
  const sectionAction = async (slot: number, action: string) => {
    try {
      await flush();
      if (action === "cta-insert" || action === "cta-drop") {
        await api(`/api/cw/jobs/${job.id}/cta/${slot}`, { method: "POST", body: { step: action === "cta-insert" ? "insert" : "drop" } });
      } else {
        await api(`/api/cw/jobs/${job.id}/sections/${slot}`, { method: "PATCH", body: { decision: action === "restore" ? null : "rejected" } });
      }
      await refresh();
    } catch (error) {
      setBarError((error as Error).message);
    }
  };

  /* ---------- pasek narzędzi ---------- */

  const runTool = (tool: string) => {
    const block = lastFocus.current;
    if (tool === "undo" || tool === "redo") {
      document.execCommand(tool);
      return;
    }
    if (!block || (block.kind !== "text" && block.kind !== "lead")) return;
    block.el.focus();
    if (tool === "h3") {
      const current = String(document.queryCommandValue("formatBlock")).toLowerCase();
      document.execCommand("formatBlock", false, current === "h3" ? "p" : "h3");
    } else if (tool === "link") {
      const selection = getSelection();
      if (!selection || selection.isCollapsed) {
        setBarError("Zaznacz tekst, który ma być linkiem.");
        return;
      }
      savedRange.current = selection.getRangeAt(0).cloneRange();
      setLink("https://");
      return;
    } else {
      document.execCommand(tool);
    }
    blockApi.onInput(block.key);
  };

  const applyLink = (url: string) => {
    setLink(null);
    const block = lastFocus.current;
    if (!block || !savedRange.current || !/^(https?:\/\/|mailto:)\S+$/i.test(url)) {
      savedRange.current = null;
      return;
    }
    block.el.focus();
    const selection = getSelection()!;
    selection.removeAllRanges();
    selection.addRange(savedRange.current);
    document.execCommand("createLink", false, url);
    savedRange.current = null;
    blockApi.onInput(block.key);
  };

  /* ---------- render ---------- */

  const result = score();
  const tone = result.total >= 75 ? "ok" : result.total >= 50 ? "mid" : "low";
  const failed = [...blocks.values()].find((block) => block.error);
  const saving = [...blocks.values()].some((block) => block.saving);
  const dirty = [...blocks.values()].some((block) => block.dirty);
  const saveState = barError
    ? { cls: "err", text: barError }
    : failed
      ? { cls: "err", text: `Nie zapisano – ${failed.error}` }
      : saving
        ? { cls: "busy", text: "Zapisuję…" }
        : dirty
          ? { cls: "busy", text: "Zmiany czekają na zapis" }
          : { cls: "ok", text: lastSaved ? `Zapisano ${fmtDateTime(lastSaved)}` : "Wszystko zapisane" };
  const rich = focusKind === "text" || focusKind === "lead";
  const expert = job.expert?.status === "done" ? job.expert : null;
  const images = new Map(((job.images ?? []) as Any[]).map((row) => [row.slot, row]));
  const rows = ordered(job);
  const faqStart = rows.find((row) => kindOf(row.slot) === "faq")?.slot;

  return (
    <div className={`we${drawerOpen ? " drawer-open" : ""}`} hidden={!open}>
      <header className="we-bar">
        <button
          type="button"
          className="we-back"
          onClick={async () => {
            try {
              await flush();
            } catch (error) {
              setBarError((error as Error).message);
              return;
            }
            exit();
          }}
        >
          Research i brief
        </button>
        <div className="we-id">
          <strong>{project.keyword}</strong>
          <span
            className={`we-save ${saveState.cls}`}
            aria-live="polite"
            role={failed ? "button" : undefined}
            tabIndex={failed ? 0 : undefined}
            onClick={() => {
              setBarError(null);
              flush().catch((error) => setBarError((error as Error).message));
            }}
          >
            {saveState.text}
          </span>
        </div>
        <div className="we-bar-actions">
          <button type="button" className="we-drawer-toggle" aria-expanded={drawerOpen} aria-controls="we-side" onClick={() => setDrawerOpen(!drawerOpen)}>
            Ocena <strong>{result.total}</strong>
          </button>
          {project.wp_draft_url && (
            <a className="wr-btn" href={project.wp_draft_url} target="_blank" rel="noopener">
              Podgląd szkicu
            </a>
          )}
          <button type="button" className="wr-btn primary" disabled={busy === "Zapisuję szkic…"} onClick={saveDraft}>
            {busy === "Zapisuję szkic…" ? busy : project.wp_post_id ? "Zapisz szkic ponownie" : "Zapisz szkic w WordPressie"}
          </button>
        </div>
      </header>

      <div className="we-body">
        <div className="we-main">
          <Toolbar rich={rich} onTool={runTool} words={result.words} link={link} setLink={setLink} applyLink={applyLink} cancelLink={() => ((savedRange.current = null), setLink(null))} />
          <div className="we-scroll" ref={scroller}>
            <article className="we-paper">
              <Editable blockKey="title" kind="title" slot={null} value={project.title || project.keyword || ""} rich={false} tag="h1" className="we-h1" label="Tytuł artykułu (H1)" api={blockApi} />
              <Editable blockKey="lead" kind="lead" slot={null} value={project.lead ?? ""} rich className="we-text we-lead" label="Wstęp" api={blockApi} />
              {rows.map((row) => {
                const kind = kindOf(row.slot);
                const hasCta = String(row.text_after ?? "").includes(CTA_MARKER);
                const rejected = row.decision === "rejected";
                return (
                  <SectionView
                    key={row.slot}
                    row={row}
                    kind={kind}
                    hasCta={hasCta}
                    rejected={rejected}
                    faqStart={row.slot === faqStart}
                    image={images.get(row.slot) ?? null}
                    expert={expert && expert.slot === row.slot ? expert : null}
                    jobId={job.id}
                    blockApi={blockApi}
                    onAction={(action) => sectionAction(row.slot, action)}
                    flush={() => flushRef.current()}
                    refresh={refresh}
                  />
                );
              })}
            </article>
          </div>
        </div>

        <aside className="we-side" id="we-side" aria-label="Ocena i frazy">
          <ScoreBox result={result} tone={tone} termsLoaded={termsLoaded} inNorm={terms.filter((t) => t.group !== "gap" && stateOf(termCount(t), rangeOf(t)) === "ok").length} scoredTerms={terms.filter((t) => t.group !== "gap").length} />
          <div className="we-tabs" role="tablist">
            {(
              [
                ["frazy", "Frazy"],
                ["plan", "Plan"],
                ["dopracowanie", "Dopracowanie"],
                ["publikacja", "Publikacja"],
              ] as [Tab, string][]
            ).map(([value, label]) => (
              <button key={value} type="button" role="tab" className={`we-tab${tab === value ? " on" : ""}`} aria-selected={tab === value} onClick={() => setTab(value)}>
                {label}
              </button>
            ))}
          </div>
          <div className="we-pane" role="tabpanel">
            {tab === "frazy" && (
              <TermsPane
                terms={terms}
                termsMeta={termsMeta}
                termsLoaded={termsLoaded}
                filter={termFilter}
                setFilter={setTermFilter}
                activeTerm={activeTerm}
                count={termCount}
                rangeOf={rangeOf}
                stateOf={stateOf}
                onTerm={(keyword) => {
                  if (activeTerm !== keyword) activeHit.current = -1;
                  setActiveTerm(keyword);
                  highlight(keyword, true);
                }}
              />
            )}
            {tab === "plan" && <PlanPane project={project} rows={rows} blocks={blocks} goTo={goTo} />}
            {tab === "dopracowanie" && (
              <RefinePane
                project={project}
                job={job}
                authors={authors}
                rows={rows}
                savedText={savedText.current}
                messages={messages}
                message={message}
                guarded={guarded}
                busy={busy}
                flush={flush}
                refresh={refresh}
                goTo={goTo}
              />
            )}
            {tab === "publikacja" && (
              <div className="we-block">
                <label className="wr-label">
                  Autor wpisu
                  <select className="wr-select" value={author} onChange={(e) => setAuthor(e.target.value)}>
                    <option value="">– wybierz –</option>
                    {authors.map((row) => (
                      <option key={row.id} value={row.id}>
                        {row.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="wr-label">
                  Kategoria
                  <select className="wr-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="">– wybierz –</option>
                    {categories.map((row) => (
                      <option key={row.id} value={row.id}>
                        {row.name}
                      </option>
                    ))}
                  </select>
                </label>
                <p className="we-foot">Tytuł wpisu to nagłówek H1 z dokumentu. Szkic zakładamy w WordPressie od nowa przy każdym zapisie – poprzedni zostaje w koszu.</p>
                <div className="we-row">
                  <button className="wr-btn primary" type="button" disabled={Boolean(busy)} onClick={saveDraft}>
                    {busy === "Zapisuję szkic…" ? busy : project.wp_post_id ? "Zapisz szkic ponownie" : "Zapisz szkic w WordPressie"}
                  </button>
                </div>
                {project.wp_draft_url && (
                  <p className="we-foot">
                    Ostatni zapis {fmtDateTime(project.wp_saved_at)} ·{" "}
                    <a href={project.wp_draft_url} target="_blank" rel="noopener">
                      podgląd szkicu
                    </a>
                  </p>
                )}
                <Msg value={messages.wp} role="status" />
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function Msg({ value, role }: { value?: { text: string; tone: string }; role?: string }) {
  return (
    <p className={`wr-msg ${value?.tone ?? ""}`.trim()} role={role}>
      {value?.text ?? ""}
    </p>
  );
}

/* ---------- pasek narzędzi ---------- */

const svgIcon = (d: React.ReactNode) => <svg viewBox="0 0 20 20">{d}</svg>;
const TOOLS: [string, string, React.ReactNode][] = [
  ["bold", "Pogrubienie (Ctrl+B)", <b key="b">B</b>],
  ["italic", "Kursywa (Ctrl+I)", <i key="i">I</i>],
  ["h3", "Śródtytuł H3", "H3"],
  [
    "insertUnorderedList",
    "Lista punktowana",
    svgIcon(
      <>
        <circle cx="4" cy="5" r="1.4" />
        <circle cx="4" cy="10" r="1.4" />
        <circle cx="4" cy="15" r="1.4" />
        <path d="M8 5h9M8 10h9M8 15h9" />
      </>,
    ),
  ],
  ["insertOrderedList", "Lista numerowana", svgIcon(<path d="M3 3.5h1.5V8M3 8h3M3 12.5c0-1 3-1 3 .3 0 1-3 1.6-3 3.2h3M9 5h8M9 10h8M9 15h8" />)],
  ["link", "Wstaw link", svgIcon(<path d="M8.5 11.5a3 3 0 0 0 4.2 0l3-3a3 3 0 0 0-4.2-4.2l-1 1M11.5 8.5a3 3 0 0 0-4.2 0l-3 3a3 3 0 0 0 4.2 4.2l1-1" />)],
  ["unlink", "Usuń link", svgIcon(<path d="M8.5 11.5a3 3 0 0 0 4.2 0l3-3a3 3 0 0 0-4.2-4.2M7.3 8.5l-3 3a3 3 0 0 0 4.2 4.2M3 3l14 14" />)],
  ["removeFormat", "Usuń formatowanie", svgIcon(<path d="M5 4h10M10 4l-3 12M4 16h6M13 12l4 4M17 12l-4 4" />)],
  ["undo", "Cofnij (Ctrl+Z)", svgIcon(<path d="M7 5 3 9l4 4M3 9h9a5 5 0 0 1 0 10h-2" />)],
  ["redo", "Ponów (Ctrl+Y)", svgIcon(<path d="m13 5 4 4-4 4M17 9H8a5 5 0 0 0 0 10h2" />)],
];

function Toolbar({
  rich,
  onTool,
  words,
  link,
  setLink,
  applyLink,
  cancelLink,
}: {
  rich: boolean;
  onTool: (tool: string) => void;
  words: number;
  link: string | null;
  setLink: (value: string) => void;
  applyLink: (url: string) => void;
  cancelLink: () => void;
}) {
  return (
    <div className="we-tools" role="toolbar" aria-label="Formatowanie">
      {TOOLS.map(([tool, label, icon], index) => (
        <span key={tool} style={{ display: "contents" }}>
          {[2, 5, 8].includes(index) && <span className="sep" />}
          <button
            type="button"
            data-tool={tool}
            title={label}
            aria-label={label}
            disabled={!rich && !["undo", "redo"].includes(tool)}
            // mousedown bez domyślnej akcji: klik w pasek nie zabiera zaznaczenia z tekstu.
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onTool(tool)}
          >
            {icon}
          </button>
        </span>
      ))}
      {link !== null && (
        <form
          className="we-link"
          onSubmit={(e) => {
            e.preventDefault();
            applyLink(link.trim());
          }}
        >
          <input type="url" aria-label="Adres linku" value={link} onChange={(e) => setLink(e.target.value)} autoFocus />
          <button type="submit" className="wr-btn small primary">
            Wstaw
          </button>
          <button type="button" className="wr-btn small" onClick={cancelLink}>
            Anuluj
          </button>
        </form>
      )}
      <span className="we-words">{fmtInt(words)} słów</span>
    </div>
  );
}

/* ---------- sekcja dokumentu ---------- */

const icon = (d: React.ReactNode) => (
  <svg viewBox="0 0 20 20" aria-hidden="true">
    {d}
  </svg>
);
const ICON = {
  image: icon(
    <>
      <rect x="3" y="4" width="14" height="12" rx="1.5" />
      <circle cx="7.5" cy="8.5" r="1.4" />
      <path d="m4 15 4.5-4.5 3 3 2-2L17 15" />
    </>,
  ),
  cta: icon(<path d="M3 8v4h3l5 4V4L6 8H3ZM14 7.5a3.5 3.5 0 0 1 0 5" />),
  skip: icon(
    <>
      <path d="M3 10s2.6-5 7-5 7 5 7 5-2.6 5-7 5-7-5-7-5Z" />
      <circle cx="10" cy="10" r="2" />
      <path d="M4 16 16 4" />
    </>,
  ),
  restore: icon(<path d="M4 9a6 6 0 1 1 1.5 5M4 4v5h5" />),
};

function SectionView({
  row,
  kind,
  hasCta,
  rejected,
  faqStart,
  image,
  expert,
  jobId,
  blockApi,
  onAction,
  flush,
  refresh,
}: {
  row: Any;
  kind: string;
  hasCta: boolean;
  rejected: boolean;
  faqStart: boolean;
  image: Any | null;
  expert: Any | null;
  jobId: string;
  blockApi: BlockApi;
  onAction: (action: string) => void;
  flush: () => Promise<void>;
  refresh: () => Promise<void>;
}) {
  const [imageOpen, setImageOpen] = useState(false);
  return (
    <>
      {faqStart && (
        <div className="we-divider">
          <span>Najczęstsze pytania</span>
        </div>
      )}
      {kind === "sources" && (
        <div className="we-divider">
          <span>Źródła – lista pod FAQ, bez edycji</span>
        </div>
      )}
      <section className={`we-sec ${kind}${rejected ? " rejected" : ""}`} id={`we-sec-${row.slot}`} data-slot={row.slot}>
        {kind !== "sources" && (
          <div className="we-sec-tools" role="group" aria-label="Akcje sekcji">
            {kind === "section" && (
              <>
                <button type="button" onClick={() => setImageOpen(!imageOpen)}>
                  {ICON.image}
                  {image ? "Infografika" : "Dodaj infografikę"}
                </button>
                <button type="button" className={hasCta ? "on" : undefined} onClick={() => onAction(hasCta ? "cta-drop" : "cta-insert")}>
                  {ICON.cta}
                  {hasCta ? "Usuń CTA" : "Wstaw CTA"}
                </button>
              </>
            )}
            <button type="button" className={rejected ? "on" : "quiet"} onClick={() => onAction(rejected ? "restore" : "reject")}>
              {rejected ? ICON.restore : ICON.skip}
              {rejected ? "Przywróć do szkicu" : "Pomiń w szkicu"}
            </button>
          </div>
        )}
        {rejected && <p className="we-flag">Pominięta – nie trafi do szkicu</p>}
        {kind !== "sources" && (
          <Editable blockKey={`head:${row.slot}`} kind="head" slot={row.slot} value={row.title_after ?? ""} rich={false} tag={kind === "faq" ? "h3" : "h2"} className="we-h" api={blockApi} />
        )}
        {kind === "sources" ? (
          <div className="we-text" data-block="sources" dangerouslySetInnerHTML={{ __html: row.text_after ?? "" }} />
        ) : (
          <Editable blockKey={`text:${row.slot}`} kind="text" slot={row.slot} value={row.text_after ?? ""} rich className="we-text" api={blockApi} />
        )}
        {expert && (
          <blockquote className="we-quote">
            „{expert.quote}”<footer>{`${expert.expert}, ${expert.role}`}</footer>
          </blockquote>
        )}
        {imageOpen && <ImagePanel jobId={jobId} slot={row.slot} flush={flush} refresh={refresh} />}
      </section>
    </>
  );
}

/** Infografika: opis → obraz (kie.ai, 30–180 s) → biblioteka mediów WP i blok w sekcji. */
function ImagePanel({ jobId, slot, flush, refresh }: { jobId: string; slot: number; flush: () => Promise<void>; refresh: () => Promise<void> }) {
  const path = `/api/cw/jobs/${jobId}/infographic/${slot}`;
  const [image, setImage] = useState<Any | null | undefined>(undefined);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ brief: "", alt: "", caption: "" });
  const alive = useRef(true);
  useEffect(() => () => void (alive.current = false), []);

  const show = (row: Any | null, text = "") => {
    setImage(row);
    setNote(text);
    if (row) setForm({ brief: row.brief ?? "", alt: row.alt ?? "", caption: row.caption ?? "" });
  };
  const poll = async () => {
    for (let attempt = 0; attempt < 40; attempt++) {
      await sleep(6000);
      if (!alive.current) return;
      const { data } = await api<Any>(path);
      if (data.image?.status !== "generating") return show(data.image);
    }
  };
  useEffect(() => {
    api<Any>(path)
      .then(({ data }) => {
        show(data.image ?? null);
        if (data.image?.status === "generating") poll();
      })
      .catch(() => show(null));
  }, [path]); // eslint-disable-line react-hooks/exhaustive-deps

  const act = async (step: string) => {
    const body: Any = step === "generate" ? { step, ...form } : { step };
    setBusy(true);
    try {
      await flush();
      const { data } = await api<Any>(path, { method: "POST", body });
      if (step === "insert" || step === "drop") {
        await refresh();
        const fresh = await api<Any>(path).catch(() => ({ data: { image: null } }));
        show(fresh.data.image ?? null);
        return;
      }
      show(data.image ?? null);
      if (data.image?.status === "generating") poll();
    } catch (error) {
      const fresh = await api<Any>(path).catch(() => ({ data: { image: null } }));
      show(fresh.data.image ?? null, (error as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (image === undefined) return <div className="we-image" />;
  if (!image)
    return (
      <div className="we-image">
        <p className="we-foot">Model zaproponuje opis grafiki na podstawie treści sekcji.</p>
        <div className="we-row">
          <button className="wr-btn small" type="button" disabled={busy} onClick={() => act("brief")}>
            Zaproponuj opis grafiki
          </button>
        </div>
        <p className="wr-msg">{note}</p>
      </div>
    );
  const editable = ["brief", "failed"].includes(image.status);
  return (
    <div className="we-image">
      <label className="wr-label">
        Opis grafiki
        <textarea className="wr-textarea" rows={4} disabled={!editable} value={form.brief} onChange={(e) => setForm({ ...form, brief: e.target.value })} />
      </label>
      <label className="wr-label">
        Tekst alternatywny
        <input className="wr-input" disabled={!editable} value={form.alt} onChange={(e) => setForm({ ...form, alt: e.target.value })} />
      </label>
      <label className="wr-label">
        Podpis
        <input className="wr-input" disabled={!editable} value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })} />
      </label>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {image.image_url && image.status !== "inserted" && <img className="we-image-preview" src={image.image_url} alt="" />}
      <div className="we-row">
        {editable && (
          <button className="wr-btn small primary" type="button" disabled={busy} onClick={() => act("generate")}>
            Generuj obraz
          </button>
        )}
        {image.status === "generating" && <span className="we-foot">Generuję obraz – to trwa do trzech minut…</span>}
        {image.status === "ready" && (
          <button className="wr-btn small primary" type="button" disabled={busy} onClick={() => act("insert")}>
            Wstaw do sekcji
          </button>
        )}
        {image.status === "inserted" && <span className="wr-status ok">w sekcji</span>}
        <button className="wr-btn small danger" type="button" disabled={busy} onClick={() => act("drop")}>
          Usuń
        </button>
      </div>
      <p className={`wr-msg${image.error ? " err" : ""}`}>{image.error ?? note}</p>
    </div>
  );
}

/* ---------- panel boczny ---------- */

/** Strefa wyniku 0–1: te same progi dla łuku, pasków i liczby. */
const zone = (value: number) => (value >= 0.75 ? "z-ok" : value >= 0.5 ? "z-mid" : "z-low");

/** Łuk z 41 kresek – przyrząd, nie wykres; zapalone kreski = ocena. */
function Gauge({ total }: { total: number }) {
  const ticks = 41;
  const lit = Math.round((total / 100) * ticks);
  return (
    <svg viewBox="0 0 160 124" className="we-gauge-svg" aria-hidden="true">
      {Array.from({ length: ticks }, (_, i) => {
        const angle = (-120 + (240 * i) / (ticks - 1)) * (Math.PI / 180);
        const r1 = i % 10 === 0 ? 58 : 61;
        return (
          <line
            key={i}
            x1={(80 + r1 * Math.sin(angle)).toFixed(1)}
            y1={(80 - r1 * Math.cos(angle)).toFixed(1)}
            x2={(80 + 70 * Math.sin(angle)).toFixed(1)}
            y2={(80 - 70 * Math.cos(angle)).toFixed(1)}
            className={i < lit ? `on ${zone(i / (ticks - 1))}` : ""}
          />
        );
      })}
    </svg>
  );
}

function ScoreBox({ result, tone, termsLoaded, inNorm, scoredTerms }: { result: Any; tone: string; termsLoaded: boolean; inNorm: number; scoredTerms: number }) {
  const bar = (label: string, value: number, hint: string) => (
    <div className={`we-part ${zone(value)}`}>
      <div className="we-part-head">
        <span>{label}</span>
        <span className="v">{Math.round(value * 100)}%</span>
      </div>
      <div className="we-part-bar">
        <span style={{ width: `${Math.round(value * 100)}%` }} />
      </div>
      <div className="we-part-hint">{hint}</div>
    </div>
  );
  return (
    <div className="we-score">
      <div className={`we-gauge ${tone}`}>
        <Gauge total={result.total} />
        <div className="we-gauge-num">
          <strong>{result.total}</strong>
          <span>ocena treści</span>
        </div>
      </div>
      <div className="we-parts">
        {bar("Frazy", result.parts.terms, termsLoaded ? `${inNorm} z ${scoredTerms} w normie` : "wczytuję…")}
        {bar("Długość", result.parts.length, `${fmtInt(result.words)} słów${result.target ? ` z ${fmtInt(result.target)}` : ""}`)}
        {bar("Nagłówki", result.parts.heads, result.mainInHead ? "fraza główna jest w śródtytule" : "fraza główna nie pada w żadnym H2")}
        {bar("Tytuł", result.parts.title, result.titleHas ? "tytuł zawiera frazę główną" : "tytuł bez frazy głównej")}
      </div>
    </div>
  );
}

function TermsPane({
  terms,
  termsMeta,
  termsLoaded,
  filter,
  setFilter,
  activeTerm,
  count,
  rangeOf,
  stateOf,
  onTerm,
}: {
  terms: Any[];
  termsMeta: Any;
  termsLoaded: boolean;
  filter: "all" | "todo" | "over";
  setFilter: (value: "all" | "todo" | "over") => void;
  activeTerm: string | null;
  count: (term: Any) => number;
  rangeOf: (term: Any) => { min: number; max: number };
  stateOf: (count: number, range: { min: number; max: number }) => TermState;
  onTerm: (keyword: string) => void;
}) {
  if (!termsLoaded) return <p className="we-empty">Wczytuję frazy…</p>;
  if (!terms.length) return <p className="we-empty">Brief nie wskazał fraz, a analiza wyników wyszukiwania nie była uruchamiana.</p>;
  const rows = terms.map((term) => {
    const range = rangeOf(term);
    const n = count(term);
    return { term, range, count: n, state: stateOf(n, range) };
  });
  const visible = rows.filter(
    (row) => filter === "all" || (filter === "todo" && (row.state === "none" || row.state === "low")) || (filter === "over" && row.state === "over"),
  );
  const todo = rows.filter((row) => row.state === "none" || row.state === "low").length;
  const over = rows.filter((row) => row.state === "over").length;
  const groups: [string, string, string][] = [
    ["main", "Fraza główna", ""],
    ["brief", "Z briefu", "wchodzą do oceny"],
    ["gap", "Luka w wynikach wyszukiwania", "podpowiedzi spoza briefu, bez wpływu na ocenę"],
  ];
  return (
    <>
      <div className="we-filter" role="group" aria-label="Filtr fraz">
        {(
          [
            ["all", `Wszystkie ${rows.length}`],
            ["todo", `Do dopisania ${todo}`],
            ["over", `Za często ${over}`],
          ] as ["all" | "todo" | "over", string][]
        ).map(([value, label]) => (
          <button key={value} type="button" className={filter === value ? "on" : undefined} onClick={() => setFilter(value)}>
            {label}
          </button>
        ))}
      </div>
      {groups.map(([group, label, note]) => {
        const list = visible.filter((row) => row.term.group === group);
        if (!list.length) return null;
        return (
          <div key={group} className="we-group">
            <div className="we-group-head">
              <span>{label}</span>
              {note && <small>{note}</small>}
            </div>
            <div className="we-chips">
              {list.map(({ term, range, count: n, state }) => {
                const title = [
                  term.where ? `Sekcja: ${term.where}` : "",
                  term.volume ? `${fmtInt(term.volume)} wyszukiwań/mies.` : "",
                  term.rivals_using !== null && term.rivals_using !== undefined ? `używa ${term.rivals_using} z ${termsMeta.rivals} konkurentów` : "",
                  "Kliknij, żeby pokazać wystąpienia w tekście",
                ]
                  .filter(Boolean)
                  .join(" · ");
                return (
                  <button key={term.keyword} type="button" className={`we-chip ${state}${activeTerm === term.keyword ? " active" : ""}`} title={title} onClick={() => onTerm(term.keyword)}>
                    <span className="we-chip-k">{term.keyword}</span>
                    <span className="we-chip-n">{`${n} / ${range.min === range.max ? range.min : `${range.min}–${range.max}`}`}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      {!visible.length && <p className="we-empty">Nic w tym filtrze.</p>}
      <p className="we-foot">
        {termsMeta.rivals
          ? `Zakres = typowa liczba wystąpień u ${termsMeta.rivals} konkurentów, przeliczona na długość tego tekstu.`
          : "Bez pobranych treści konkurentów – zakresy są orientacyjne. Pobierz je w widoku „Research i brief”."}
      </p>
    </>
  );
}

function PlanPane({ project, rows, blocks, goTo }: { project: Any; rows: Any[]; blocks: Map<string, Block>; goTo: (anchor: string) => void }) {
  const outline = (project.brief?.outline ?? []) as Any[];
  const sections = rows.filter((row) => kindOf(row.slot) === "section");
  const faq = rows.filter((row) => kindOf(row.slot) === "faq");
  const line = (key: string, label: string, words: number, target: number | null, anchor: string, muted = false) => {
    const ratio = target ? Math.min(1.5, words / target) : 0;
    const tone = !target ? "" : ratio < 0.7 ? "low" : ratio > 1.3 ? "over" : "ok";
    return (
      <li key={key}>
        <button type="button" className={`we-plan-row${muted ? " muted" : ""}`} onClick={() => goTo(anchor)}>
          <span className="t">{label}</span>
          <span className="w">
            {fmtInt(words)}
            {target ? ` / ${fmtInt(target)}` : ""}
          </span>
          {target && (
            <span className={`we-plan-bar ${tone}`}>
              <span style={{ width: `${Math.round((ratio / 1.5) * 100)}%` }} />
              <i style={{ left: `${Math.round((1 / 1.5) * 100)}%` }} />
            </span>
          )}
        </button>
      </li>
    );
  };
  return (
    <>
      <p className="we-foot">Słowa sekcji wobec planu z briefu. Kreska na pasku to cel.</p>
      <ol className="we-plan">
        {line("lead", "Wstęp", countWords(blocks.get("lead")?.text ?? ""), null, "lead")}
        {sections.map((row, index) =>
          line(
            String(row.slot),
            blocks.get(`head:${row.slot}`)?.text || row.title_after,
            countWords(blocks.get(`text:${row.slot}`)?.text ?? strip(row.text_after)),
            Number(outline[index]?.words) || null,
            `sec-${row.slot}`,
            row.decision === "rejected",
          ),
        )}
        {faq.length > 0 &&
          line(
            "faq",
            `FAQ – ${faq.length} pytań`,
            faq.reduce((sum, row) => sum + countWords(blocks.get(`text:${row.slot}`)?.text ?? ""), 0),
            null,
            `sec-${faq[0].slot}`,
          )}
      </ol>
    </>
  );
}

/* ---------- dopracowanie: styl i fleksja, ekspert ---------- */

function RefinePane({
  project,
  job,
  authors,
  rows,
  savedText,
  messages,
  message,
  guarded,
  busy,
  flush,
  refresh,
  goTo,
}: {
  project: Any;
  job: Any;
  authors: Any[];
  rows: Any[];
  savedText: Map<number, string>;
  messages: Record<string, { text: string; tone: string }>;
  message: (name: string, text: string, tone?: string) => void;
  guarded: (name: string, label: string, run: () => Promise<void>) => Promise<void>;
  busy: string | null;
  flush: () => Promise<void>;
  refresh: () => Promise<void>;
  goTo: (anchor: string) => void;
}) {
  const expert = job.expert as Any | null;
  const style = job.style as Any | null;
  const write = (job.steps ?? []).find((step: Any) => step.step === "write")?.payload ?? {};
  const unsupported = (write.unsupported ?? []) as string[];
  const current = new Map(rows.map((row) => [row.slot, savedText.get(row.slot) ?? row.text_after ?? ""]));
  const pendingStyle = ((job.style_sections ?? []) as Any[]).filter((row) => !row.decision);
  const isStale = (row: Any) => current.has(row.slot) && current.get(row.slot) !== (row.text_before ?? "");
  const staleCount = pendingStyle.filter(isStale).length;
  const candidates = authors.filter((row) => row.name !== project.author_name);
  const content = rows.filter((row) => kindOf(row.slot) === "section");

  /* Przejazd stylu idzie jednym żądaniem (do ~2 min). Trzymamy jego stan
     lokalnie, żeby panel pokazał „Zatrzymaj” i nie dał odpalić drugiego. */
  const [styleRun, setStyleRun] = useState<{ abort: AbortController; model: string } | null>(null);
  const [styleModel, setStyleModel] = useState(savedStyleModel);
  const [styleModels, setStyleModels] = useState<string[]>([]);
  const [expertName, setExpertName] = useState("");
  const [expertSlot, setExpertSlot] = useState("");
  const [bulk, setBulk] = useState<string | null>(null);

  useEffect(() => {
    fetch("https://openrouter.ai/api/v1/models")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => data && setStyleModels(((data?.data ?? []) as Any[]).map((row) => row?.id).filter(Boolean).sort()))
      .catch(() => {
        /* lista to tylko podpowiedź – ID można wpisać ręcznie */
      });
  }, []);

  // Przejazd trwa na serwerze, ale nie z tej karty (np. po przeładowaniu) –
  // odpytujemy, aż się skończy, żeby panel sam pokazał wynik.
  useEffect(() => {
    if (styleRun || style?.status !== "running") return;
    const timer = window.setTimeout(() => refresh().catch(() => undefined), 8000);
    return () => window.clearTimeout(timer);
  }, [styleRun, style?.status, job, refresh]);

  const runStyle = async () => {
    const model = styleModel.trim();
    try {
      localStorage.setItem("cw-style-model", model);
    } catch {
      /* bez pamięci wyboru */
    }
    try {
      await flush();
    } catch (error) {
      message("style", (error as Error).message, "err");
      return;
    }
    const abort = new AbortController();
    setStyleRun({ abort, model: model || STYLE_DEFAULT });
    try {
      const response = await fetch(`/api/cw/jobs/${job.id}/style`, {
        method: "POST",
        headers: { "X-CW-Request": "1", "Content-Type": "application/json" },
        body: JSON.stringify(model ? { model } : {}),
        signal: abort.signal,
      });
      const data = await response.json().catch(() => ({}));
      setStyleRun(null);
      await refresh();
      if (!response.ok && data?.code !== "style_cancelled") message("style", data?.error ?? `Błąd ${response.status}`, "err");
    } catch (error) {
      setStyleRun(null);
      // Przerwane przez „Zatrzymaj” – komunikat daje stopStyle.
      if ((error as Error).name !== "AbortError") {
        await refresh().catch(() => undefined);
        message("style", (error as Error).message, "err");
      }
    }
  };

  const stopStyle = async () => {
    styleRun?.abort.abort();
    setStyleRun(null);
    try {
      await api(`/api/cw/jobs/${job.id}/style`, { method: "DELETE" });
    } catch {
      /* przejazd mógł się właśnie skończyć – odświeżenie pokaże wynik */
    }
    await refresh().catch(() => undefined);
    message("style", "Przejazd zatrzymany. Poprzednie propozycje zostały bez zmian.", "ok");
  };

  /** Decyzja dla wszystkich propozycji po kolei. Przyjęcie pomija nieaktualne
      (sekcja zmieniona po propozycji) – te zostają do ręcznej decyzji. */
  const decideAll = async (decision: "accepted" | "rejected") => {
    const list = pendingStyle.filter((row) => decision === "rejected" || !isStale(row));
    if (!list.length) return;
    try {
      await flush();
    } catch (error) {
      message("style", (error as Error).message, "err");
      return;
    }
    let done = 0;
    const failedRows: string[] = [];
    for (const row of list) {
      setBulk(`${decision === "accepted" ? "Przyjmuję" : "Odrzucam"} ${done + 1} z ${list.length}…`);
      try {
        await api(`/api/cw/jobs/${job.id}/style/${row.slot}`, { method: "PATCH", body: { decision } });
        done += 1;
      } catch (error) {
        failedRows.push(`${row.title_after ?? row.title_before ?? `sekcja ${row.slot}`}: ${(error as Error).message}`);
      }
    }
    setBulk(null);
    await refresh().catch(() => undefined);
    const verb = decision === "accepted" ? "Przyjęto" : "Odrzucono";
    message(
      "style",
      failedRows.length ? `${verb} ${done} z ${list.length}. Nie udało się: ${failedRows.join("; ")}` : `${verb} ${done} ${done === 1 ? "propozycję" : "propozycji"}.`,
      failedRows.length ? "err" : "ok",
    );
  };

  const expertValue = expertName || candidates[0]?.name || "";
  const slotValue = expertSlot || String(expert?.slot ?? content[0]?.slot ?? "");
  const locked = Boolean(busy || bulk);

  return (
    <>
      {unsupported.length > 0 && (
        <div className="we-note warn">
          <strong>Model nie miał materiału na</strong>
          <ul>
            {unsupported.map((row, i) => (
              <li key={i}>{row}</li>
            ))}
          </ul>
          <span>Te miejsca uzupełnij z własnej wiedzy albo zostaw ogólnie.</span>
        </div>
      )}

      <div className="we-block">
        <h3>Styl i fleksja</h3>
        <p className="we-foot">Jeden przejazd redaktorski na cały tekst: odmiana fraz, powtórzenia, interpunkcja, fakty sprawdzane w sieci.</p>
        {styleRun || style?.status === "running" ? (
          <div className="we-running">
            <span className="we-spinner" aria-hidden="true" />
            <span>
              Model czyta cały tekst – to trwa do dwóch minut.<small>{styleRun?.model ?? style?.model ?? STYLE_DEFAULT}</small>
            </span>
            <button className="wr-btn small danger" type="button" onClick={stopStyle}>
              Zatrzymaj
            </button>
          </div>
        ) : (
          <>
            <label className="wr-label">
              Model
              <input className="wr-input" list="we-style-models" placeholder={STYLE_DEFAULT} value={styleModel} onChange={(e) => setStyleModel(e.target.value)} spellCheck={false} autoComplete="off" />
              <datalist id="we-style-models">
                {styleModels.map((id) => (
                  <option key={id} value={id} />
                ))}
              </datalist>
              <span className="we-foot">puste = domyślny {STYLE_DEFAULT}; dopisek :online włącza sprawdzanie faktów w sieci</span>
            </label>
            <div className="we-row">
              <button className="wr-btn" type="button" disabled={locked} onClick={runStyle}>
                {style?.status === "done" ? "Popraw styl ponownie" : "Popraw styl i fleksję"}
              </button>
              {style?.status === "done" && (
                <span className="we-foot">
                  ostatnio zmienione sekcje: {fmtInt(style.changed)} z {fmtInt(style.sections_total)}
                  {style.model ? `, ${style.model}` : ""}
                </span>
              )}
              {style?.status === "cancelled" && <span className="we-foot">ostatni przejazd przerwany</span>}
            </div>
          </>
        )}
        {pendingStyle.length > 0 && (
          <div className="we-bulk">
            <span>
              <strong>{pendingStyle.length}</strong> {pendingStyle.length === 1 ? "propozycja czeka" : "propozycji czeka"} na decyzję
              {staleCount ? `, ${staleCount} nieaktualnych` : ""}
            </span>
            <button className="wr-btn small primary" type="button" disabled={locked || pendingStyle.length === staleCount} onClick={() => decideAll("accepted")}>
              {bulk && bulk.startsWith("Przyjmuję") ? bulk : `Przyjmij wszystkie${staleCount ? " aktualne" : ""}`}
            </button>
            <button className="wr-btn small" type="button" disabled={locked} onClick={() => decideAll("rejected")}>
              {bulk && bulk.startsWith("Odrzucam") ? bulk : "Odrzuć wszystkie"}
            </button>
          </div>
        )}
        {pendingStyle.map((row) => {
          const stale = isStale(row);
          const decide = (decision: string) =>
            guarded("style", "Zapisuję…", async () => {
              await api(`/api/cw/jobs/${job.id}/style/${row.slot}`, { method: "PATCH", body: { decision } });
              await refresh();
            });
          return (
            <div key={row.slot} className={`we-diff${stale ? " stale" : ""}`}>
              <button type="button" className="we-diff-title" onClick={() => goTo(`sec-${row.slot}`)}>
                {row.title_after ?? row.title_before ?? `sekcja ${row.slot}`}
              </button>
              {(row.issues ?? []).length > 0 && (
                <ul>
                  {(row.issues as Any[]).map((issue, i) => (
                    <li key={i}>{typeof issue === "string" ? issue : (issue.note ?? issue.fix ?? JSON.stringify(issue))}</li>
                  ))}
                </ul>
              )}
              {(row.warnings ?? []).length > 0 && <p className="we-err">{(row.warnings as Any[]).map((w) => (typeof w === "string" ? w : JSON.stringify(w))).join(" · ")}</p>}
              <del>{strip(row.text_before).slice(0, 260)}</del>
              <ins>{strip(row.text_after).slice(0, 260)}</ins>
              {stale && <p className="we-err">Sekcja zmieniła się po tej propozycji – przyjęcie nadpisałoby Twoje poprawki. Odrzuć ją albo uruchom styl ponownie.</p>}
              <div className="we-row">
                {!stale && (
                  <button className="wr-btn small primary" type="button" disabled={locked} onClick={() => decide("accepted")}>
                    Przyjmij
                  </button>
                )}
                <button className="wr-btn small" type="button" disabled={locked} onClick={() => decide("rejected")}>
                  Odrzuć
                </button>
              </div>
            </div>
          );
        })}
        <Msg value={messages.style ?? (style?.status === "failed" ? { text: style.error, tone: "" } : undefined)} />
      </div>

      <div className="we-block">
        <h3>Wypowiedź eksperta</h3>
        {expert?.status === "done" && (
          <>
            <blockquote className="we-quote">
              „{expert.quote}”<footer>{`${expert.expert}, ${expert.role}`}</footer>
            </blockquote>
            <div className="we-row">
              <button
                className="wr-btn small danger"
                type="button"
                disabled={locked}
                onClick={() =>
                  guarded("expert", "Odrzucam…", async () => {
                    await api(`/api/cw/jobs/${job.id}/expert`, { method: "PATCH", body: { rejected: true } });
                    await refresh();
                  })
                }
              >
                {busy === "Odrzucam…" ? busy : "Odrzuć cytat"}
              </button>
            </div>
          </>
        )}
        <label className="wr-label">
          Ekspert (inna osoba niż autor)
          <select className="wr-select" value={expertValue} onChange={(e) => setExpertName(e.target.value)}>
            {candidates.map((row) => (
              <option key={row.name} value={row.name}>
                {row.name}
                {row.role ? ` – ${row.role}` : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="wr-label">
          Sekcja
          <select className="wr-select" value={slotValue} onChange={(e) => setExpertSlot(e.target.value)}>
            {content.map((row) => (
              <option key={row.slot} value={row.slot}>
                {row.title_after}
              </option>
            ))}
          </select>
        </label>
        <div className="we-row">
          <button
            className="wr-btn"
            type="button"
            disabled={!candidates.length || locked}
            onClick={() =>
              guarded("expert", "Generuję…", async () => {
                await api(`/api/cw/jobs/${job.id}/expert`, { method: "POST", body: { expert: expertValue, slot: Number.parseInt(slotValue, 10) } });
                await refresh();
              })
            }
          >
            {busy === "Generuję…" ? busy : expert?.status === "done" ? "Wygeneruj inny cytat" : "Wygeneruj cytat"}
          </button>
        </div>
        <Msg value={messages.expert ?? (expert?.status === "failed" ? { text: expert.error, tone: "" } : undefined)} />
      </div>
    </>
  );
}
