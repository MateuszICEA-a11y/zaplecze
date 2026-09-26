/* Kształty danych edytora wpisu Content Watchera – lustro odpowiedzi Workera
   (cw-api.js) i pozycji katalogu (catalog.json). */

export type Section = {
  slot: number;
  title_field: string;
  text_field: string;
  operation: string;
  moved_from?: number | null;
  title_before: string | null;
  title_after: string | null;
  text_before: string | null;
  text_after: string | null;
  diff: {
    opcodes: { op: string; before: string; after: string }[];
    stats: { added: number; removed: number; shrunk?: boolean };
  } | null;
  accepted: boolean;
  decision: "accepted" | "rejected" | null;
  edited?: boolean;
};

export type Step = {
  step: string;
  status: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cost: any;
  model: string | null;
  error: string | null;
  started_at?: string | null;
  finished_at?: string | null;
};

export type Job = {
  id: string;
  status: string;
  error: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cost: any;
  created_at: string;
  improvements: string[];
  models: { research: string; writer: string } | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  expert: any;
  steps: Step[];
  sections: Section[];
  run_url?: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  style?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  style_sections?: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  images?: any[];
  wp_draft_id?: number | null;
  wp_draft_url?: string | null;
  applied_at?: string | null;
};

/** Pozycja katalogu Content Watchera (catalog.json) – tyle, ile czyta edytor. */
export type Entry = {
  id: string;
  post_id: number;
  post_type?: string;
  url: string;
  title: string;
  pillar?: string | null;
  published_at: string | null;
  updated_at: string | null;
  word_count?: number | null;
  headings?: number | null;
  author?: string | null;
  senuto_keywords?: { keyword: string; position: number | null; searches: number | null }[];
};

export type SerpRow = { position: number; url: string; host: string; title: string | null };

export type SerpAnalysis = {
  queries: {
    kind: string;
    keyword: string;
    competitors: SerpRow[];
    /** Nasz wynik dla tej frazy (null = poza sprawdzonymi wynikami). */
    ours?: SerpRow | null;
    results_checked?: number;
  }[];
  drift: string[];
  gap: {
    keyword: string;
    searches: number | null;
    our_position: number | null;
    status: string;
    /** Pozycja rywala, na której fraza się „obroniła" – to ona decyduje o kolejności. */
    rival_position?: number | null;
    rival_host?: string | null;
  }[];
  gap_summary: { total: number; missing: number; weak: number; covered: number };
  keywords_scanned?: number;
  keywords_skipped_home?: number;
  own_keywords_total: number;
  generated_at: string;
  cached_at?: string;
};

export type RivalsAnalysis = {
  our_words: number | null;
  median_words: number | null;
  rivals: { url: string; host?: string; title?: string | null; words: number | null; error?: string | null }[];
  topics?: string[];
  facts?: { fact: string; kind?: string; why?: string; source?: string }[];
  model?: string | null;
  generated_at?: string;
};
