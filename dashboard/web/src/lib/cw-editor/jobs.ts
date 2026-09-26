/* Zadanie optymalizacji: wczytanie ostatniego przebiegu wpisu i odpytywanie
   Workera, dopóki przebieg trwa. Polling z narastającym odstępem, wstrzymany
   przy ukrytej karcie i zatrzymany w stanie końcowym – zadanie trwa minuty. */
import { api } from "@/lib/writer-client";
import { editorStore, showEditorError } from "./store";
import type { Entry, Job } from "./types";

export const RUNNING = ["queued", "dispatching", "running"];
export const isRunning = (job: Job | null) => Boolean(job && RUNNING.includes(job.status));

let pollDelay = 3000;
let pollTimer = 0;

export function schedulePoll(reset = false) {
  if (reset) pollDelay = 3000;
  window.clearTimeout(pollTimer);
  if (!isRunning(editorStore.get().job)) return;
  pollTimer = window.setTimeout(async () => {
    if (document.visibilityState === "hidden") return schedulePoll();
    const job = editorStore.get().job;
    if (!job) return;
    try {
      const { data } = await api<{ job: Job }>(`/api/cw/jobs/${job.id}`);
      editorStore.set({ job: data.job });
    } catch {
      /* chwilowy błąd sieci nie przerywa pollingu */
    }
    pollDelay = Math.min(30000, Math.round(pollDelay * 1.6));
    schedulePoll();
  }, pollDelay);
}

export const stopPolling = () => window.clearTimeout(pollTimer);

/** Ostatni przebieg tego wpisu (lista zadań domeny, potem pełny rekord). */
export async function loadLatestJob(domain: string, entry: Entry) {
  try {
    const { data } = await api<{ jobs?: { id: string; post_id: number }[] }>(`/api/cw/jobs?domain=${encodeURIComponent(domain)}&limit=100`);
    const mine = (data.jobs ?? []).find((row) => row.post_id === entry.post_id);
    if (!mine) return;
    const full = await api<{ job: Job }>(`/api/cw/jobs/${mine.id}`);
    editorStore.set({ job: full.data.job });
    schedulePoll(true);
  } catch (error) {
    showEditorError(error instanceof Error ? error.message : "Nie udało się odczytać stanu zadań.");
  }
}

/** Świeży rekord zadania po akcji, która zmienia go po stronie Workera. */
export async function refreshJob(jobId: string) {
  const { data } = await api<{ job: Job }>(`/api/cw/jobs/${jobId}`);
  editorStore.set({ job: data.job });
  return data.job;
}
