/* Układ dokumentu edytora wpisu: treść z WordPressa (wstęp, sekcje ACF,
   FAQ, Źródła) z nałożonymi propozycjami przebiegu. Czysta funkcja – render
   robi DocPanel.tsx. Reguły wstawiania nowych sekcji 1:1 z dawnego
   applyJobToDoc (dawny edytor-script.ts). */
import type { Content, Entry, Job, Section } from "./types";

/** Sloty FAQ zaczynają się nad tą wartością (101+) – lustro FAQ_SLOT_BASE z config.py i cw-api.js. */
export const FAQ_SLOT_BASE = 100;
/** Blok „Źródła”: osobne pola ACF (page_sources_*), na stronie ZA blokiem FAQ
    (motyw od 2026-09-03). Pseudo-slot – lustro SOURCES_SLOT z config.py/cw-api.js. */
export const SOURCES_SLOT = 200;

export type DocKind = "section" | "faq" | "sources";
export const kindOfSlot = (slot: number): DocKind => (slot === SOURCES_SLOT ? "sources" : slot > FAQ_SLOT_BASE ? "faq" : "section");

/** Wiersz „Źródła” z przejazdu sprzed 2026-09-03 (bibliografia w slocie
    treści). Zapis do WP przenosi go do pól page_sources_* (lustro
    legacySourcesRow w cw-wp.js), więc w dokumencie też stoi na końcu. */
const legacySourcesRow = (section: Section) =>
  section.slot >= 1 && section.slot <= 30 && section.operation === "insert" && /^(źródła|zrodla|bibliografia)$/i.test((section.title_after ?? "").trim());
export const kindOfSection = (section: Section): DocKind => (legacySourcesRow(section) ? "sources" : kindOfSlot(section.slot));

/** Rozpoznanie bibliografii po tytule – dla starych wpisów, w których wciąż
    siedzi w slocie treści. Cytat eksperta i CTA mają trzymać się od niej z daleka. */
export const isSourcesTitle = (title: string | null | undefined) => /^(źródła|zrodla|bibliografia)$/i.test((title ?? "").trim());

export type SectionBlock = {
  type: "section";
  slot: number;
  kind: DocKind;
  /** Tytuł z WordPressa (albo nowy tytuł wstawionej sekcji). */
  title: string;
  /** Treść z WordPressa; null dla sekcji dodanej przebiegiem. */
  html: string | null;
  /** Wpis bez sekcji ACF – cała treść w jednym polu, bez nagłówka. */
  bare?: boolean;
  /** Propozycja przebiegu dla tego slotu. */
  section?: Section;
};

export type DocBlock = { type: "intro"; title: string; lead: string } | { type: "faqHead"; title: string; schema: boolean } | { type: "note"; text: string } | SectionBlock;

export function layoutDoc(content: Content | null, contentError: string | null, entry: Entry | null, job: Job | null): DocBlock[] {
  const blocks: DocBlock[] = [];
  if (contentError) {
    blocks.push({
      type: "note",
      text: `Nie udało się wczytać treści wpisu (${contentError}). Mimo to możesz rozpocząć optymalizację – w dokumencie pojawią się nowe propozycje.`,
    });
  } else if (content) {
    // Nagłówek dokumentu: tytuł wpisu (H1) i wstęp sprzed pierwszego H2. Wstęp
    // siedzi w polu `content` WordPressa, poza sekcjami ACF – pipeline go nie
    // rusza, ale bez niego dokument zaczynałby się w połowie zdania.
    if (content.title || content.lead || entry?.title) blocks.push({ type: "intro", title: content.title || entry?.title || "", lead: (content.lead ?? "").trim() });
    if (content.sections?.length) {
      blocks.push(...content.sections.map((row): SectionBlock => ({ type: "section", slot: row.slot, kind: "section", title: row.title, html: row.text })));
    } else if (content.no_section) {
      blocks.push({ type: "section", slot: 1, kind: "section", title: "", html: content.no_section, bare: true });
    } else {
      blocks.push({ type: "note", text: "Ten wpis nie ma standardowego podziału na sekcje – dokument zostanie wygenerowany na podstawie wyników optymalizacji." });
    }
    // Blok FAQ spod artykułu – osobna grupa pól ACF renderowana na stronie jako
    // schema.org/FAQPage; pytania wchodzą i do oceny treści, i do materiału dla modelu.
    if (content.faq?.items?.length) {
      blocks.push({ type: "faqHead", title: content.faq.title || "FAQ", schema: content.faq.schema });
      blocks.push(...content.faq.items.map((row): SectionBlock => ({ type: "section", slot: row.slot, kind: "faq", title: row.title, html: row.text })));
    }
    // Bibliografia z pól page_sources_* – na stronie za FAQ, więc i tu na końcu.
    if (content.sources?.text) {
      blocks.push({ type: "section", slot: content.sources.slot ?? SOURCES_SLOT, kind: "sources", title: content.sources.title, html: content.sources.text });
    }
  }

  for (const section of job?.sections ?? []) {
    const existing = blocks.find((block): block is SectionBlock => block.type === "section" && block.slot === section.slot);
    if (existing) {
      existing.section = section;
      continue;
    }
    // Nowa sekcja albo nowe pytanie FAQ (wolny slot). Kotwicy szukamy
    // WYŁĄCZNIE w tej samej przestrzeni slotów – inaczej nowa sekcja lądowała
    // pod nagłówkiem bloku FAQ i wyglądało to jak drugie, rozbite FAQ.
    const kind = kindOfSection(section);
    const block: SectionBlock = { type: "section", slot: section.slot, kind, title: section.title_after ?? "", html: null, section };
    const after = blocks
      .filter((b): b is SectionBlock => b.type === "section" && b.slot > section.slot && kindOfSlot(b.slot) === kind)
      .sort((a, b) => a.slot - b.slot)[0];
    // Sekcja bez następnika staje przed blokiem FAQ (FAQ na stronie stoi pod
    // całym artykułem), pytanie FAQ – przed Źródłami, a Źródła na samym końcu.
    const sources = blocks.find((b) => b.type === "section" && b.kind === "sources");
    const fallback = kind === "section" ? (blocks.find((b) => b.type === "faqHead") ?? sources) : kind === "faq" ? sources : undefined;
    const anchor = after ?? fallback;
    if (anchor) blocks.splice(blocks.indexOf(anchor), 0, block);
    else blocks.push(block);
  }
  return blocks;
}
