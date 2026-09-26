/* Typy dla writer-gaps.js (kopia 1:1 z dashboard/app – sam plik zostaje w JS,
   żeby obie wersje frontu dało się porównać diffem). */
type Any = any; // eslint-disable-line @typescript-eslint/no-explicit-any
export const GAP_MIN_POSITION: number;
export const GAP_MAX_POSITION: number;
export const GAP_MIN_SEARCHES: number;
export const GSC_MIN_IMPRESSIONS: number;
export const SUGGESTIONS_LIMIT: number;
export const CANNIBAL_POSITION_MAX: number;
export const TOPICAL_OVERLAP: number;
export function normPath(url: string): string;
export function pageIndex(items: Any[]): Any;
export function pagesWithPhrase(keyword: string, pages: Any[], limit?: number): Any[];
export function overlap(keyword: string, pageTokens: Any): number;
export interface GapSuggestion {
  keyword: string;
  searches: number | null;
  impressions: number | null;
  position: number;
  ranking_url: string | null;
  ranking_title: string | null;
  sources: string[];
}
export function suggestGaps(details: Any, options?: { limit?: number; excludePaths?: string[] }): GapSuggestion[];
export function writerData(details: Any, options?: { excludePaths?: string[] }): Any;
export function cannibalization(keyword: string, data: Any): { pages: Any[]; rankings: Any[] };
export function rankingsFor(keyword: string, rankings: Any[], maxPosition?: number): Any[];
