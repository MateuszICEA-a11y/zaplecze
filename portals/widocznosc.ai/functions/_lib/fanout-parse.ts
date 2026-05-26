/**
 * Parser odpowiedzi OpenAI Responses API (web_search).
 * Wyciąga fan-out queries (web_search_call.action) oraz cytowania (url_citation)
 * i agreguje cytowania per domena. Czyste funkcje, bez zależności od env.
 */

export type Citation = { title: string; url: string; domain: string };
export type SearchSource = { url: string; domain: string };
export type CitedDomain = { domain: string; count: number; urls: string[] };
export type ParsedFanout = {
  searched: boolean;
  fanoutQueries: string[];
  answer: string;
  citations: Citation[];
  citedDomains: CitedDomain[];
  searchedSources: SearchSource[];
  searchedDomains: CitedDomain[];
};

type AnyRecord = Record<string, unknown>;

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function normalizeHost(rawUrl: string): string | null {
  try {
    return new URL(rawUrl).hostname.replace(/^www\./i, '').toLowerCase();
  } catch {
    return null;
  }
}

export function parseResponsesOutput(data: unknown): ParsedFanout {
  const root = (data && typeof data === 'object' ? data : {}) as AnyRecord;
  const output = asArray(root.output);

  const fanoutQueries: string[] = [];
  const citations: Citation[] = [];
  const searchedSources: SearchSource[] = [];
  const answerParts: string[] = [];
  let searched = false;

  for (const rawItem of output) {
    if (!rawItem || typeof rawItem !== 'object') continue;
    const item = rawItem as AnyRecord;

    if (item.type === 'web_search_call') {
      searched = true;
      const action = (item.action && typeof item.action === 'object' ? item.action : {}) as AnyRecord;
      if (typeof action.query === 'string' && action.query.trim()) {
        fanoutQueries.push(action.query.trim());
      }
      for (const q of asArray(action.queries)) {
        if (typeof q === 'string' && q.trim()) fanoutQueries.push(q.trim());
      }
      for (const rawSource of asArray(action.sources)) {
        if (!rawSource || typeof rawSource !== 'object') continue;
        const source = rawSource as AnyRecord;
        if (typeof source.url !== 'string') continue;
        const domain = normalizeHost(source.url);
        if (!domain) continue;
        searchedSources.push({ url: source.url, domain });
      }
      continue;
    }

    if (item.type === 'message') {
      for (const rawContent of asArray(item.content)) {
        if (!rawContent || typeof rawContent !== 'object') continue;
        const content = rawContent as AnyRecord;
        if (typeof content.text === 'string' && content.text.trim()) {
          answerParts.push(content.text.trim());
        }
        for (const rawAnn of asArray(content.annotations)) {
          if (!rawAnn || typeof rawAnn !== 'object') continue;
          const ann = rawAnn as AnyRecord;
          if (ann.type !== 'url_citation' || typeof ann.url !== 'string') continue;
          const domain = normalizeHost(ann.url);
          if (!domain) continue;
          citations.push({
            title: typeof ann.title === 'string' && ann.title.trim() ? ann.title.trim() : domain,
            url: ann.url,
            domain,
          });
        }
      }
    }
  }

  const dedupedQueries = Array.from(new Set(fanoutQueries));
  const dedupedSources = dedupeSources(searchedSources);

  return {
    searched,
    fanoutQueries: dedupedQueries,
    answer: answerParts.join('\n\n'),
    citations,
    citedDomains: aggregateDomains(citations),
    searchedSources: dedupedSources,
    searchedDomains: aggregateDomains(dedupedSources.map((source) => ({
      title: source.domain,
      url: source.url,
      domain: source.domain,
    }))),
  };
}

function aggregateDomains(citations: Citation[]): CitedDomain[] {
  const map = new Map<string, CitedDomain>();
  for (const c of citations) {
    const existing = map.get(c.domain);
    if (existing) {
      existing.count += 1;
      if (!existing.urls.includes(c.url)) existing.urls.push(c.url);
    } else {
      map.set(c.domain, { domain: c.domain, count: 1, urls: [c.url] });
    }
  }
  return Array.from(map.values()).sort(
    (a, b) => b.count - a.count || a.domain.localeCompare(b.domain, 'pl')
  );
}

function dedupeSources(sources: SearchSource[]): SearchSource[] {
  const seen = new Set<string>();
  const result: SearchSource[] = [];
  for (const source of sources) {
    if (seen.has(source.url)) continue;
    seen.add(source.url);
    result.push(source);
  }
  return result;
}
