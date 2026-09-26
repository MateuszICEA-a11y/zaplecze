/* Wspólny stan edytora wpisu: panele React (nagłówek, ocena, SERP,
   konkurencja, podgląd) i moduł legacy/edytor-script.ts, który do czasu
   przepisania trzyma dokument, pipeline i akcje zapisujące.

   Legacy pisze tu zadanie (`job`) i sygnał zmiany dokumentu (`touchDoc`) –
   ocena treści i podświetlenia fraz liczą się po stronie React z DOM-u
   dokumentu. Każda zmiana podmienia obiekt stanu (useSyncExternalStore). */
import { useSyncExternalStore } from "react";
import type { Entry, Job, RivalsAnalysis, SerpAnalysis } from "./types";

export type EditorState = {
  entry: Entry | null;
  job: Job | null;
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
  job: null,
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
  reset() {
    state = INITIAL;
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export const useEditor = () => useSyncExternalStore(editorStore.subscribe, editorStore.get, () => INITIAL);
