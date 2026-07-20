/* Build-time odczyt danych collectora: dashboard/domains.yaml + data/… /snapshots.jsonl.
   Działa wyłącznie w trakcie `astro build` (node:fs) – nic z tego nie trafia do bundle. */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse as parseYaml } from 'yaml';

// cwd builda = dashboard/app (lokalnie i na CF Pages z root dir) – import.meta.url
// nie nadaje się na kotwicę, bo prerender przenosi chunki do dist/.prerender/.
const DASHBOARD_DIR = resolve(process.cwd(), '..');
const DATA_DIR = resolve(DASHBOARD_DIR, 'data');

export type SourceStatus = 'ok' | 'error' | 'token_expired' | 'not_configured';

export interface SourceResult {
  status: SourceStatus;
  data?: Record<string, number | string | boolean | null>;
  error?: string;
}

export interface Snapshot {
  date: string;
  collected_at: string;
  sources: Record<string, SourceResult>;
}

export interface DomainConfig {
  id: string;
  name: string;
  [source: string]: unknown;
}

export function loadConfig(): { domains: DomainConfig[]; global: Record<string, unknown> } {
  const raw = parseYaml(readFileSync(resolve(DASHBOARD_DIR, 'domains.yaml'), 'utf8'));
  return { domains: raw.domains ?? [], global: raw.global ?? {} };
}

export function loadSnapshots(dirId: string): Snapshot[] {
  const path = resolve(DATA_DIR, dirId, 'snapshots.jsonl');
  if (!existsSync(path)) return [];
  return readFileSync(path, 'utf8')
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line) as Snapshot);
}

export function latestSnapshot(dirId: string): Snapshot | null {
  const snapshots = loadSnapshots(dirId);
  return snapshots.at(-1) ?? null;
}

/** Seria czasowa metryki: [uniksowe sekundy[], wartości[]] (null = brak odczytu). */
export function metricSeries(
  snapshots: Snapshot[],
  source: string,
  field: string,
): { timestamps: number[]; values: (number | null)[] } {
  return metricSeriesFrom(snapshots, [[source, field]]);
}

/** Ostatnia liczbowa wartość metryki + delta vs `days` dni wstecz (po datach snapshotów). */
export function latestWithDelta(
  snapshots: Snapshot[],
  source: string,
  field: string,
  days = 7,
): { value: number | null; delta: number | null } {
  return latestWithDeltaFrom(snapshots, [[source, field]], days);
}

/** Jak metricSeries, ale z listą [źródło, pole] – bierze pierwsze źródło ze
    statusem ok i liczbową wartością w danym snapshotcie (np. ahrefs → dataforseo). */
export function metricSeriesFrom(
  snapshots: Snapshot[],
  specs: [source: string, field: string][],
): { timestamps: number[]; values: (number | null)[] } {
  const timestamps: number[] = [];
  const values: (number | null)[] = [];
  for (const snap of snapshots) {
    timestamps.push(Math.floor(new Date(snap.date + 'T00:00:00Z').getTime() / 1000));
    let picked: number | null = null;
    for (const [source, field] of specs) {
      const src = snap.sources[source];
      const value = src?.status === 'ok' ? src.data?.[field] : null;
      if (typeof value === 'number') {
        picked = value;
        break;
      }
    }
    values.push(picked);
  }
  return { timestamps, values };
}

/** latestWithDelta na serii z koalescencją źródeł (metricSeriesFrom). */
export function latestWithDeltaFrom(
  snapshots: Snapshot[],
  specs: [source: string, field: string][],
  days = 7,
): { value: number | null; delta: number | null } {
  const { timestamps, values } = metricSeriesFrom(snapshots, specs);
  let lastIdx = -1;
  for (let i = values.length - 1; i >= 0; i--) {
    if (values[i] !== null) {
      lastIdx = i;
      break;
    }
  }
  if (lastIdx === -1) return { value: null, delta: null };
  const cutoff = timestamps[lastIdx]! - days * 86400;
  let refIdx = -1;
  for (let i = lastIdx - 1; i >= 0; i--) {
    if (values[i] !== null && timestamps[i]! <= cutoff) {
      refIdx = i;
      break;
    }
  }
  return {
    value: values[lastIdx]!,
    delta: refIdx === -1 ? null : values[lastIdx]! - values[refIdx]!,
  };
}

/** Statusy źródeł z ostatniego snapshotu (do bannerów i badge'y). */
export function sourceStatuses(snapshot: Snapshot | null): Record<string, SourceResult> {
  return snapshot?.sources ?? {};
}
