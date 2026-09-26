/* Wspólny stan edytora wpisu: panele React (nagłówek, analizy, ocena,
   dokument, podgląd) i moduł legacy/edytor-script.ts, który do czasu
   przepisania trzyma belkę pipeline'u i karty etapów końcowych.

   Zadanie (`job`) zmienia się tylko przez set() z nowym obiektem – legacy
   subskrybuje stan i odmalowuje swoje panele, React renderuje dokument.
   Ocena treści i podświetlenia fraz liczą się z DOM-u dokumentu po sygnale
   touchDoc(). Każda zmiana podmienia obiekt stanu (useSyncExternalStore). */
import { useSyncExternalStore } from "react";
import type { Content, Entry, Job, RivalsAnalysis, SerpAnalysis, Section } from "./types";

export type EditorState = {
  entry: Entry | null;
  /** Treść wpisu z WordPressa; contentError, gdy nie dało się jej wczytać. */
  content: Content | null;
  contentError: string | null;
  job: Job | null;
  /** Tryb widoku sekcji z propozycją (diff / after / before) – po slocie. */
  modes: Record<number, string>;
  serp: SerpAnalysis | null;
  rivals: RivalsAnalysis | null;
  /** Rośnie przy każdej zmianie treści dokumentu (edycja, przebudowa, tryb widoku). */
  docVersion: number;
  /** Autor po wdrożeniu z podmianą autora – nadpisuje ten z katalogu. */
  authorName: string | null;
  previewOpen: boolean;
};

const INITIAL: EditorState = {
  entry: null,
  content: null,
  contentError: null,
  job: null,
  modes: {},
  serp: null,
  rivals: null,
  docVersion: 0,
  authorName: null,
  previewOpen: false,
};

let state = INITIAL;
const listeners = new Set<() => void>();

export const editorStore = {
  get: () => state,
  set(patch: Partial<EditorState>) {
    state = { ...state, ...patch };
    listeners.forEach((listener) => listener());
  },
  touchDoc() {
    editorStore.set({ docVersion: state.docVersion + 1 });
  },
  /** Podmiana jednej sekcji zadania (decyzja, ręczna poprawka) – nowy obiekt zadania. */
  patchSection(slot: number, patch: Partial<Section>) {
    const job = state.job;
    if (!job) return;
    editorStore.set({ job: { ...job, sections: job.sections.map((row) => (row.slot === slot ? { ...row, ...patch } : row)) } });
  },
  setMode(slot: number, mode: string) {
    editorStore.set({ modes: { ...state.modes, [slot]: mode } });
  },
  reset() {
    state = INITIAL;
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export const useEditor = () => useSyncExternalStore(editorStore.subscribe, editorStore.get, () => INITIAL);

/** Komunikat błędu pod belką pipeline'u (znacznik legacy [data-ed-error],
    do czasu przepisania belki). */
export function showEditorError(message: string) {
  const node = document.querySelector<HTMLElement>("[data-ed-error]");
  if (!node) return;
  node.textContent = message;
  node.hidden = false;
}
