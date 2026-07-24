/* Build-time odczyt danych collectora: dashboard/domains.yaml + data/… /snapshots.jsonl.
   Działa wyłącznie w trakcie `astro build` (node:fs) – nic z tego nie trafia do bundle. */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
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

/** Błędy przejściowe zachowują ostatni udany pomiar zamiast udawać brak danych. */
export function isTemporarySourceFailure(result?: SourceResult): boolean {
  if (!result || result.status === 'ok' || result.status === 'not_configured') return false;
  if (result.status === 'token_expired') return true;
  return /(?:429|timeout|timed out|rate.?limit|too many requests|chwilow)/i.test(result.error ?? '');
}

/* ---------- details.json – listy (frazy, domeny linkujące, leady) ---------- */

export interface SenutoKeyword {
  keyword: string;
  position: number | null;
  previous: number | null;
  diff: number | null;
  searches: number | null;
  url: string | null;
  cpc: number | null;
  difficulty: number | null;
  snippets: string[];
}

export interface GscRow {
  key: string;
  clicks: number;
  impressions: number;
  ctr: number | null;
  position: number | null;
}

export interface RefDomain {
  domain: string;
  domain_rating: number | null;
  links: number | null;
  first_seen: string | null;
}

export interface ClarityDimensionRow {
  name: string;
  sessions: number | null;
  users: number | null;
}

export interface LeadRecord {
  id: string;
  kind: 'lead' | 'usage';
  source: string;
  ts: string;
  [field: string]: unknown;
}

export interface GscCompareRow {
  key: string;
  clicks: number;
  prev_clicks: number;
  impressions: number;
  prev_impressions: number;
  position: number | null;
  prev_position: number | null;
}

export interface GscComparePeriod {
  prev: { start: string; end: string };
  queries: GscCompareRow[];
  pages: GscCompareRow[];
}

export interface GscCompare {
  window_days: number;
  cur: { start: string; end: string };
  qoq?: GscComparePeriod;
  yoy?: GscComparePeriod;
}

export interface DomainDetails {
  date?: string;
  sources: {
    senuto?: {
      keywords: SenutoKeyword[];
      /** Agregacja fraz per URL (panel Matrix): pozycje z Senuto per adres. */
      urls?: {
        url: string;
        keywords: number;
        top3: number;
        top10: number;
        top50: number;
        best_position: number;
        best_keyword: string | null;
      }[];
    };
    gsc?: {
      window?: { start: string; end: string };
      queries: GscRow[];
      pages: GscRow[];
      /** Okna okresów dla przełącznika (7d/30d/3m/6m/12m/16m). */
      windows?: Record<string, { start: string; end: string; queries: GscRow[]; pages: GscRow[] }>;
      compare?: GscCompare;
      /** Dzienna historia fraz (14 dni) do sparkline'a w rozwijanym wierszu. */
      query_history?: {
        window: { start: string; end: string };
        series: Record<string, [string, number][]>;
      };
    };
    ahrefs?: { ref_domains: RefDomain[]; ref_domains_source?: 'ahrefs' | 'dataforseo' };
    clarity?: {
      dead_clicks?: number | null;
      rage_clicks?: number | null;
      quickback_clicks?: number | null;
      script_errors?: number | null;
      url?: ClarityDimensionRow[];
      referrer?: ClarityDimensionRow[];
      device?: ClarityDimensionRow[];
    };
    ga4?: {
      channels: { channel: string; sessions: number; users: number; pageviews: number }[];
      sources: { source: string; sessions: number; users: number }[];
      pages: { path: string; pageviews: number; users: number }[];
      landing_pages?: {
        window: { start: string; end: string };
        rows: {
          path: string;
          sessions: number;
          engagement_rate: number;
          avg_engagement_s: number;
          pages_per_session: number;
        }[];
      };
      daily?: {
        date: string;
        sessions: number;
        active_users: number;
        new_users: number;
        returning_users: number;
        pageviews: number;
        organic_sessions: number;
        engagement_rate: number;
        avg_engagement_s: number;
        engaged_sessions: number;
        engaged_per_user: number;
        pages_per_session: number;
      }[];
      monthly?: { month: string; sessions: number; users: number; new_users: number }[];
      channels_monthly?: { month: string; channel: string; sessions: number }[];
    };
    indexing?: {
      window?: { start: string; end: string };
      rows: {
        url: string;
        clicks: number;
        impressions: number;
        ctr: number | null;
        position: number | null;
        indexed: boolean;
        verdict: string | null;
        coverage_state: string | null;
        last_crawl: string | null;
      }[];
    };
    bing?: {
      traffic: { date: string; clicks: number; impressions: number }[];
      queries: { query: string; clicks: number; impressions: number; position: number | null }[];
      queries_windows?: Record<
        string,
        {
          start: string | null;
          end: string | null;
          queries: { query: string; clicks: number; impressions: number; position: number | null }[];
        }
      >;
    };
    cloudflare_ai?: {
      bots: { bot: string; requests: number }[];
      paths: { path: string; requests: number }[];
    };
    leads?: { leads: LeadRecord[]; usage: LeadRecord[] };
  };
}

export function loadDetails(dirId: string): DomainDetails {
  const path = resolve(DATA_DIR, dirId, 'details.json');
  if (!existsSync(path)) return { sources: {} };
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as DomainDetails;
  } catch {
    return { sources: {} };
  }
}

/* ---------- Content Watcher – katalog treści z repozytorium ---------- */

export interface ContentCatalogItem {
  id: string;
  url: string;
  content_path: string;
  title: string;
  pillar: string;
  author: string;
  tags: string[];
  published_at: string;
  updated_at: string | null;
  word_count: number;
  headings: number;
  internal_links: number;
  external_links: number;
}

const isoDate = (value: unknown): string | null => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const match = String(value).match(/^\d{4}-\d{2}-\d{2}/);
  return match?.[0] ?? null;
};

/** Czyta kolekcję Markdown wskazaną w `content_watcher.content_dir`.
    Funkcja działa wyłącznie w build time; treść artykułów nie trafia do bundle. */
export function loadContentCatalog(domain: DomainConfig): ContentCatalogItem[] {
  const cfg = domain.content_watcher as { enabled?: boolean; content_dir?: string; base_url?: string } | undefined;
  if (cfg?.enabled !== true || !cfg.content_dir) return [];
  const repoDir = resolve(DASHBOARD_DIR, '..');
  const root = resolve(repoDir, cfg.content_dir);
  if (!existsSync(root)) return [];

  const files = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const path = resolve(dir, entry.name);
      return entry.isDirectory() ? files(path) : entry.isFile() && entry.name.endsWith('.md') ? [path] : [];
    });

  return files(root)
    .flatMap((path): ContentCatalogItem[] => {
      const raw = readFileSync(path, 'utf8');
      const match = raw.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/);
      if (!match) return [];
      try {
        const frontmatter = parseYaml(match[1]) as Record<string, unknown>;
        const published = isoDate(frontmatter.date);
        if (!published || typeof frontmatter.title !== 'string') return [];
        const relativePath = path.slice(root.length + 1).replace(/\\/g, '/');
        const slug = relativePath.replace(/\.md$/, '');
        const body = raw.slice(match[0].length);
        const words = body
          .replace(/<!--[\s\S]*?-->/g, ' ')
          .replace(/<[^>]+>/g, ' ')
          .replace(/[`*_#[\]()>{}|~-]/g, ' ')
          .split(/\s+/)
          .filter(Boolean).length;
        const markdownLinks = [...body.matchAll(/\[[^\]]*]\(([^)]+)\)/g)].map((link) => link[1]?.trim() ?? '');
        const author = frontmatter.author as { name?: unknown } | undefined;
        return [{
          id: slug.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, ''),
          url: `${cfg.base_url?.replace(/\/$/, '') ?? ''}/${slug}/`.replace(/([^:]\/)\/+/g, '$1'),
          content_path: `${cfg.content_dir.replace(/\/$/, '')}/${relativePath}`,
          title: frontmatter.title,
          pillar: typeof frontmatter.pillar === 'string' ? frontmatter.pillar : slug.split('/')[0] ?? 'inne',
          author: typeof author?.name === 'string' ? author.name : '—',
          tags: Array.isArray(frontmatter.tags) ? frontmatter.tags.map(String) : [],
          published_at: published,
          updated_at: isoDate(frontmatter.updated),
          word_count: words,
          headings: (body.match(/^#{2,6}\s+/gm) ?? []).length,
          internal_links: markdownLinks.filter((href) => href.startsWith('/') || href.startsWith('.')).length,
          external_links: markdownLinks.filter((href) => /^https?:\/\//i.test(href)).length,
        }];
      } catch {
        return [];
      }
    })
    .sort((a, b) => a.title.localeCompare(b.title, 'pl'));
}

/* ---------- Import ręczny: Bing AI Performance (brak API – eksport CSV z BWT) ---------- */

export interface BingAiQueryRow {
  query: string;
  intent: string;
  topic: string;
  citations: number;
  citation_share: number | null; // %
}

/** Prosty parser CSV (cudzysłowy, przecinki w polach) – wystarczający dla eksportów BWT. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  const src = text.replace(/^﻿/, '');
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"' && src[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (field !== '' || row.length > 0) {
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
      }
      if (ch === '\r' && src[i + 1] === '\n') i++;
    } else {
      field += ch;
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/** Najnowszy eksport AI Performance (queries) dla domeny z dashboard/imports/bing-ai/<id>/.
    Data z nazwy pliku (…_DD.MM.YYYY.csv); brak plików → null. */
export function loadBingAiQueries(dirId: string): { date: string; rows: BingAiQueryRow[] } | null {
  const dir = resolve(DASHBOARD_DIR, 'imports', 'bing-ai', dirId);
  if (!existsSync(dir)) return null;
  const files = readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith('.csv'))
    .map((f) => {
      const m = f.match(/(\d{2})\.(\d{2})\.(\d{4})/);
      return { file: f, date: m ? `${m[3]}-${m[2]}-${m[1]}` : '0000-00-00' };
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  if (files.length === 0) return null;

  const raw = parseCsv(readFileSync(resolve(dir, files[0].file), 'utf8'));
  const num = (v: string | undefined): number => parseInt((v ?? '0').replace(/[\s  ]/g, ''), 10) || 0;
  const pct = (v: string | undefined): number | null => {
    const m = (v ?? '').replace(',', '.').match(/-?\d+(\.\d+)?/);
    return m ? parseFloat(m[0]) : null;
  };
  const rows = raw
    .slice(1) // nagłówek: Grounding Query, Intent, Topic, Citations, Citation Share
    .filter((r) => r.length >= 4 && r[0])
    .map((r) => ({
      query: r[0],
      intent: r[1] ?? '',
      topic: r[2] ?? '',
      citations: num(r[3]),
      citation_share: pct(r[4]),
    }))
    .sort((a, b) => b.citations - a.citations);
  return { date: files[0].date, rows };
}

/** Sekcje dashboardu domeny – jedno źródło prawdy dla nawigacji. */
export interface DomainSection {
  slug: string;
  label: string;
  source: string | null;
  config?: string;
}

export const DOMAIN_SECTIONS: readonly DomainSection[] = [
  { slug: '', label: 'Przegląd', source: null },
  { slug: 'senuto', label: 'Senuto', source: 'senuto' },
  { slug: 'gsc', label: 'GSC', source: 'gsc' },
  { slug: 'ga4', label: 'GA4', source: 'ga4' },
  { slug: 'bing', label: 'Bing', source: 'bing' },
  { slug: 'ahrefs', label: 'Ahrefs', source: 'ahrefs' },
  { slug: 'clarity', label: 'Clarity', source: 'clarity' },
  { slug: 'boty-ai', label: 'Boty AI', source: 'cloudflare_ai' },
  { slug: 'matrix', label: 'Matrix', source: 'indexing' },
  { slug: 'content-watcher', label: 'Content Watcher', source: null, config: 'content_watcher' },
  { slug: 'leady', label: 'Leady', source: 'leads' },
];

/** Sekcje widoczne dla domeny – źródło wyłączone w domains.yaml (enabled: false)
    znika z nawigacji, kart i buildu (np. Leady dla grupa-icea.pl). */
export function sectionsFor(domain: DomainConfig): DomainSection[] {
  return DOMAIN_SECTIONS.filter((s) => {
    if (s.config) {
      const feature = domain[s.config] as { enabled?: boolean } | undefined;
      return feature?.enabled === true;
    }
    if (!s.source) return true;
    const cfg = domain[s.source] as { enabled?: boolean } | undefined;
    return cfg?.enabled !== false;
  });
}

export function sectionEnabled(domain: DomainConfig, source: string): boolean {
  const cfg = domain[source] as { enabled?: boolean } | undefined;
  return cfg?.enabled !== false;
}
