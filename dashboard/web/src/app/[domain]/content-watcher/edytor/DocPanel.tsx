"use client";

/* Dokument edytora wpisu: treść z WordPressa z nałożonymi propozycjami
   przebiegu, pasek ze statystykami i decyzjami zbiorczymi. Układ sekcji
   liczy lib/cw-editor/doc.ts, pojedynczą sekcję renderuje DocSection.tsx.
   Klasy ed-doc-*, ed-sec-head i ed-faq-head nie niosą stylu – to znaczniki,
   po których migawka dokumentu (snapshot.ts) czyta treść. */
import { btnSmall } from "@/components/kit";
import { SectionHead } from "@/components/ui";
import { isSourcesTitle, layoutDoc, type SectionBlock } from "@/lib/cw-editor/doc";
import { activeExpert, sectionCopyText } from "@/lib/cw-editor/expert";
import { docSnapshot, countWords } from "@/lib/cw-editor/snapshot";
import { editorStore, showEditorError, useEditor } from "@/lib/cw-editor/store";
import type { Content, ImageRow, Job, StyleRow } from "@/lib/cw-editor/types";
import { api } from "@/lib/writer-client";
import { useEffect, useMemo, useState } from "react";
import DocSection, { Prose, SECTION_CLS } from "./DocSection";

const pl = new Intl.NumberFormat("pl-PL");

export default function DocPanel({ domain }: { domain: string }) {
  const { entry, content, contentError, job, modes } = useEditor();
  const [onlyChanged, setOnlyChanged] = useState(false);

  useEffect(() => {
    if (!entry) return;
    api<Content>(`/api/cw/content/${domain}/${entry.post_type ?? "posts"}/${entry.post_id}`)
      .then(({ data }) => editorStore.set({ content: data }))
      .catch((error) => editorStore.set({ contentError: error instanceof Error ? error.message : "błąd" }));
  }, [domain, entry]);

  const blocks = useMemo(() => layoutDoc(content, contentError, entry, job), [content, contentError, entry, job]);
  const sections = blocks.filter((block): block is SectionBlock => block.type === "section");
  const done = job?.status === "done";
  const proposals = job?.sections ?? [];

  /* Cytat eksperta: na końcu wskazanej sekcji, a bez wskazania – na końcu
     TREŚCI (nie w FAQ: odpowiedź ma zostać zwięzła, i nie w bibliografii). */
  const expert = activeExpert(job);
  const expertSlot = expert
    ? expert.slot
      ? sections.find((block) => block.slot === expert.slot && block.kind !== "faq")?.slot
      : sections.filter((block) => block.kind === "section" && !isSourcesTitle(block.section?.title_after || block.title)).at(-1)?.slot
    : undefined;

  const styleBySlot = new Map(((job?.style_sections ?? []) as StyleRow[]).map((row) => [row.slot, row]));
  const imageBySlot = new Map(((job?.images ?? []) as ImageRow[]).map((row) => [row.slot, row]));
  // Filtr „tylko zmienione" chowa sekcje bez propozycji – przy 20-sekcyjnym
  // wpisie inaczej trzeba by ich szukać wzrokiem.
  const hide = (block: SectionBlock | null) => onlyChanged && done && !block?.section;
  const faqVisible = sections.some((block) => block.kind === "faq" && !hide(block));

  // Po każdej zmianie układu dokumentu ocena i podświetlenia liczą się na nowo.
  useEffect(() => editorStore.touchDoc(), [blocks, modes, onlyChanged]);

  const faqCount = content?.faq?.items?.length ?? 0;
  const meta = proposals.length
    ? `${sections.length} sekcji · ${proposals.length} z propozycjami zmian`
    : content?.sections?.length
      ? `${content.sections.length} sekcji${faqCount ? ` + ${faqCount} pytań FAQ` : ""}${content.sources?.text ? " + Źródła" : ""} · pełna treść z WordPressa`
      : "treść z WordPressa";

  return (
    <>
      <SectionHead title="Dokument" meta={meta} />

      {/* Pasek dokumentu trzyma się górnej krawędzi – przy długim wpisie widać,
          ile propozycji jeszcze czeka na ocenę (top-19 = wysokość nagłówka aplikacji). */}
      <div className="sticky top-19 z-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-t-2xl border border-b-0 border-gray-200 bg-gray-50 px-4 py-2.5 max-md:static dark:border-gray-800 dark:bg-gray-900">
        <DocStats job={job} blocks={sections} />
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
          {done && proposals.length > 0 && <DecideAll job={job!} />}
          {done && proposals.length > 0 && (
            <label className="inline-flex cursor-pointer items-center gap-2 text-theme-xs text-gray-500 select-none dark:text-gray-400">
              <input className="m-0 accent-brand-500" type="checkbox" checked={onlyChanged} onChange={(e) => setOnlyChanged(e.target.checked)} />
              tylko zmienione sekcje
            </label>
          )}
          <button type="button" className={btnSmall} onClick={() => editorStore.set({ previewOpen: true })}>
            podgląd całości
          </button>
        </div>
      </div>

      <div className="rounded-b-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3" data-ed-doc>
        {!content && !contentError ? (
          <p className="px-5.5 py-4.5 text-theme-sm text-gray-500 dark:text-gray-400">wczytywanie treści…</p>
        ) : (
          blocks.map((block, index) => {
            if (block.type === "note")
              return (
                <p key={`note${index}`} className="px-5.5 py-4.5 text-theme-sm text-gray-500 dark:text-gray-400">
                  {block.text}
                </p>
              );
            if (block.type === "intro")
              return (
                <section key="intro" className={`ed-doc-section ed-doc-intro ${SECTION_CLS} bg-gray-50/60 dark:bg-white/2`} data-slot="0" hidden={onlyChanged && done}>
                  <div className="ed-sec-head mb-3.5">
                    <h1 data-block="h1" className="text-2xl/tight font-medium text-gray-800 dark:text-white/90">
                      {block.title}
                    </h1>
                  </div>
                  {block.lead && <Prose html={block.lead} />}
                </section>
              );
            if (block.type === "faqHead")
              return (
                <div
                  key="faqhead"
                  className="ed-faq-head doc-gutter flex flex-wrap items-baseline gap-x-3.5 gap-y-1.5 border-t border-gray-200 pt-6.5 pr-7 pl-19 max-md:px-4 dark:border-gray-800"
                  hidden={onlyChanged && done && !faqVisible}
                >
                  <h2 data-block="h2" className="text-xl font-medium text-gray-800 dark:text-white/90">
                    {block.title}
                  </h2>
                  <span className="text-theme-xs text-gray-500 dark:text-gray-400">{block.schema ? "blok FAQ · mikrodane FAQPage" : "blok FAQ · bez mikrodanych"}</span>
                </div>
              );
            return (
              <DocSection
                // Nowe zadanie = nowy dokument: stan edycji i szkiców startuje od zera.
                key={`${job?.id ?? "wp"}:${block.slot}`}
                block={block}
                domain={domain}
                postId={entry!.post_id}
                job={job}
                mode={modes[block.slot]}
                expert={expertSlot === block.slot ? expert : null}
                styleRow={styleBySlot.get(block.slot) ?? null}
                imageRow={imageBySlot.get(block.slot) ?? null}
                hidden={hide(block)}
              />
            );
          })
        )}
      </div>
    </>
  );
}

/** Statystyki z docelowej treści wpisu (migawka – patrz docSnapshot). */
function DocStats({ job, blocks }: { job: Job | null; blocks: SectionBlock[] }) {
  const { docVersion } = useEditor();
  const [stats, setStats] = useState<[string, string][]>([]);
  useEffect(() => {
    const snapshot = docSnapshot(job);
    const rows: [string, string][] = [
      [pl.format(countWords(snapshot.textContent ?? "")), "słów"],
      [pl.format(snapshot.querySelectorAll("h2, h3, h4").length), "nagłówków"],
      [pl.format(snapshot.querySelectorAll("p").length), "akapitów"],
      [pl.format(blocks.filter((block) => block.kind === "section").length), "sekcji"],
    ];
    const faq = blocks.filter((block) => block.kind === "faq").length;
    if (faq) rows.push([pl.format(faq), "pytań FAQ"]);
    if (job?.sections?.length) {
      const decided = job.sections.filter((section) => section.decision).length;
      rows.push([`${pl.format(decided)}/${pl.format(job.sections.length)}`, "ocenionych propozycji"]);
    }
    setStats(rows);
  }, [docVersion, job, blocks]);
  return (
    <div className="flex flex-wrap gap-x-5.5 gap-y-1.5">
      {stats.map(([value, label]) => (
        <div key={label} className="inline-flex items-baseline gap-1.5">
          <b className="text-theme-sm font-medium text-gray-800 tabular-nums dark:text-white/90">{value}</b>
          <span className="text-theme-xs text-gray-500 dark:text-gray-400">{label}</span>
        </div>
      ))}
    </div>
  );
}

/** Decyzje zbiorcze: licznik, „zatwierdź wszystkie” i „kopiuj zatwierdzone”
    (wszystkie przyjęte sekcje w jednym bloku do wklejenia w CMS-ie). */
function DecideAll({ job }: { job: Job }) {
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const sections = job.sections;
  const accepted = sections.filter((section) => section.decision === "accepted").length;
  const rejected = sections.filter((section) => section.decision === "rejected").length;
  const left = sections.length - accepted - rejected;

  const acceptAll = async () => {
    setBusy(true);
    for (const section of sections.filter((row) => !row.decision)) {
      try {
        await api(`/api/cw/jobs/${job.id}/sections/${section.slot}`, { method: "PATCH", body: { decision: "accepted" } });
        editorStore.patchSection(section.slot, { decision: "accepted", accepted: true });
      } catch (error) {
        showEditorError(error instanceof Error ? error.message : "Nie udało się zapisać decyzji.");
        break;
      }
    }
    setBusy(false);
  };
  const copyAll = async () => {
    const text = sections
      .filter((section) => section.decision === "accepted")
      .map((section) => `<h2>${section.title_after ?? ""}</h2>\n${sectionCopyText(section, job)}`)
      .join("\n\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="inline-flex flex-wrap items-center gap-2.5 text-theme-xs text-gray-600 dark:text-gray-300">
      <span>
        {left ? `${pl.format(left)} ${left === 1 ? "propozycja czeka" : "propozycji czeka"} na decyzję` : `wszystko ocenione · ${pl.format(accepted)} do wdrożenia`}
      </span>
      {left > 0 && (
        <button type="button" className={btnSmall} disabled={busy} onClick={acceptAll}>
          zatwierdź wszystkie
        </button>
      )}
      {accepted > 0 && (
        <button type="button" className={btnSmall} onClick={copyAll}>
          {copied ? "skopiowano" : "kopiuj zatwierdzone"}
        </button>
      )}
    </div>
  );
}
