/**
 * Parser odpowiedzi OpenAI Responses API (web_search).
 * Wyciąga fan-out queries (web_search_call.action) oraz cytowania (url_citation)
 * i agreguje cytowania per domena. Czyste funkcje, bez zależności od env.
 */

export type Citation = { title: string; url: string; domain: string };
export type CitedDomain = { domain: string; count: number; urls: string[] };
export type ParsedFanout = {
  searched: boolean;
  fanoutQueries: string[];
  citations: Citation[];
  citedDomains: CitedDomain[];
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
      continue;
    }

    if (item.type === 'message') {
      for (const rawContent of asArray(item.content)) {
        if (!rawContent || typeof rawContent !== 'object') continue;
        const content = rawContent as AnyRecord;
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

  return { searched, fanoutQueries, citations, citedDomains: aggregateDomains(citations) };
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
