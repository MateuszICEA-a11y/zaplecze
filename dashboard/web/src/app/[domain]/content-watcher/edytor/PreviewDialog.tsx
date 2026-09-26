"use client";

/* Podgląd całości: docelowa treść wpisu jednym ciągiem, bez podziału na
   sekcje i bez interfejsu decyzji – do przeczytania i do zabrania. Wdrożenie
   i korekta odbywają się poza edytorem, więc schowek niesie HTML (Google Docs
   przy wklejeniu zachowuje nagłówki, listy i linki), a .doc otwiera się
   i w Wordzie, i przez „Otwórz w Dokumentach Google". */
import { btn } from "@/components/kit";
import { countWords, previewSnapshot } from "@/lib/cw-editor/snapshot";
import { editorStore, useEditor } from "@/lib/cw-editor/store";
import { useEffect, useRef, useState } from "react";

const pl = new Intl.NumberFormat("pl-PL");
const close = () => editorStore.set({ previewOpen: false });

export default function PreviewDialog() {
  const { previewOpen, job, entry } = useEditor();
  const body = useRef<HTMLDivElement>(null);
  const [note, setNote] = useState("");
  const [copyLabel, setCopyLabel] = useState("kopiuj do Google Docs");

  useEffect(() => {
    if (!previewOpen || !body.current) return;
    // Migawka w chwili otwarcia – dokument może się zmienić pod spodem.
    body.current.replaceChildren(...previewSnapshot(job).childNodes);
    const words = countWords(body.current.textContent ?? "");
    const rejected = job?.sections?.filter((section) => section.decision === "rejected").length ?? 0;
    setNote(
      `${pl.format(words)} słów · wersja po Twoich decyzjach` +
        (rejected ? ` · ${pl.format(rejected)} odrzuconych sekcji w dotychczasowym brzmieniu` : ""),
    );
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
    // Tylko przy otwarciu – job zmienia się w tle (polling), a podgląd ma być migawką.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewOpen]);

  if (!previewOpen) return null;

  const copy = async () => {
    const node = body.current!;
    const html = `<meta charset="utf-8">${node.innerHTML}`;
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([node.textContent ?? ""], { type: "text/plain" }),
        }),
      ]);
      setCopyLabel("skopiowano – wklej w docs.new");
    } catch {
      // Starsza przeglądarka bez ClipboardItem – zostaje czysty tekst.
      await navigator.clipboard.writeText(node.textContent ?? "");
      setCopyLabel("skopiowano jako tekst");
    }
    setTimeout(() => setCopyLabel("kopiuj do Google Docs"), 2500);
  };

  const download = () => {
    const title = (entry?.title ?? "artykuł").replace(/[<>&]/g, "");
    const slug =
      title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/ł/g, "l")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "artykul";
    const html = `<html><head><meta charset="utf-8"><title>${title}</title></head><body>${body.current!.innerHTML}</body></html>`;
    const blob = new Blob(["﻿", html], { type: "application/msword" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${slug}.doc`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 5000);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-950/60 p-4" onClick={(event) => event.target === event.currentTarget && close()}>
      <div role="dialog" aria-modal="true" aria-label="Podgląd całości wpisu" className="flex max-h-[92vh] w-[min(860px,100%)] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="text-lg font-medium text-gray-800 dark:text-white/90">Podgląd całości</h2>
            <span className="text-theme-xs text-gray-500 dark:text-gray-400">{note}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={btn} onClick={copy}>
              {copyLabel}
            </button>
            <button type="button" className={btn} onClick={download}>
              pobierz .doc
            </button>
            <button type="button" className={btn} onClick={close}>
              zamknij
            </button>
          </div>
        </header>
        <div ref={body} className="doc-prose min-h-0 max-w-none flex-1 overflow-y-auto px-7.5 pt-2 pb-9 [&_h1]:mt-4 [&_h1]:text-2xl" />
      </div>
    </div>
  );
}
