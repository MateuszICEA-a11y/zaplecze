/* Wspólny stan edytora wpisu – panele Reacta (PostEditor.tsx i spółka)
   i czyste funkcje z lib/cw-editor/. Zadanie (`job`) zmienia się tylko przez
   set() z nowym obiektem. Ocena treści i podświetlenia fraz liczą się z DOM-u
   dokumentu po sygnale touchDoc(). Każda zmiana podmienia obiekt stanu
   (useSyncExternalStore). */
import { useSyncExternalStore } from "react";
import type { Content, Entry, Job, RivalsAnalysis, SerpAnalysis, Section } from "./types";

/** Lustro DEFAULT_MODELS z cw-api.js / config.py. */
export const DEFAULT_MODELS = { research: "perplexity/sonar-pro", writer: "anthropic/claude-sonnet-5" };

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
  /** Komunikat błędu pod belką pipeline'u. */
  error: string | null;
  /** Modele przebiegu (OpenRouter) – belka pipeline'u i odczyt konkurencji. */
  models: { research: string; writer: string };
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
  error: null,
  models: DEFAULT_MODELS,
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

/** Komunikat błędu pod belką pipeline'u. */
export const showEditorError = (message: string) => editorStore.set({ error: message });
