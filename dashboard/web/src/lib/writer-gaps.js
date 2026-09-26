/**
 * Content Writer – podpowiedzi tematów i kontrola kanibalizacji.
 *
 * Wyłącznie dane już zebrane przez collector (details.json): frazy Senuto
 * i zapytania GSC, na które domena stoi poza pierwszą dziesiątką, a dla
 * których nie ma wpisu z tą frazą w tytule. Taka fraza zwykle rankuje
 * „przy okazji" stroną poboczną – to kandydat na nowy artykuł. Fraza, która ma
 * już własny wpis, to robota dla Content Watchera (odświeżenie), nie pisanie
 * od zera. Zero wywołań API – liczone w buildzie.
 */
import { fold, matchTokens, phraseKey, phraseStems, tokens } from './phrase-match.js';

export const GAP_MIN_POSITION = 11; // w TOP 10 temat jest już obsłużony
export const GAP_MAX_POSITION = 50; // dalej Senuto/GSC to szum
export const GAP_MIN_SEARCHES = 30;
export const GSC_MIN_IMPRESSIONS = 100; // okno 28 dni z collectora
export const SUGGESTIONS_LIMIT = 30;
export const CANNIBAL_POSITION_MAX = 20;
// Strona, która rankuje na frazę i ma w tytule co najmniej tyle jej słów,
// już jest o tym temacie – fraza idzie do odświeżenia, nie do nowego tekstu.
export const TOPICAL_OVERLAP = 0.5;
const BRAND = /\bicea\b/i;

/** Ścieżka adresu bez hosta i ukośnika – Senuto podaje „grupa-icea.pl/blog/x/". */
export function normPath(url) {
  const raw = String(url ?? '').trim().toLowerCase().replace(/^https?:\/\//, '');
  const slash = raw.indexOf('/');
  const path = slash === -1 ? '/' : raw.slice(slash);
  return path.replace(/[?#].*$/, '').replace(/\/+$/, '') || '/';
}

/** Wpisy z katalogu WordPressa z tytułem i slugiem gotowymi do porównań. */
export function pageIndex(items) {
  return (items ?? [])
    .filter((item) => item?.url && item?.title)
    .map((item) => ({
      id: `${item.type ?? 'post'}-${item.id}`,
      url: item.url,
      title: String(item.title),
      path: normPath(item.url),
      tokens: tokens(`${item.title} ${String(item.slug ?? '').replace(/-/g, ' ')}`),
    }));
}

/** Wpisy, które mają tę frazę w tytule albo slugu (z odmianą). */
export function pagesWithPhrase(keyword, pages, limit = 5) {
  const needle = phraseStems(keyword);
  if (!needle.length) return [];
  return pages.filter((page) => matchTokens(page.tokens, needle).length > 0).slice(0, limit);
}

// Słowa pytające nie niosą tematu: „ctr co to" to temat „ctr".
const QUESTION_WORDS = new Set(['co', 'to', 'jest', 'czym', 'kim', 'jak', 'czy', 'znaczy', 'ile', 'kiedy', 'dlaczego', 'gdzie']);
// Intencja informacyjna – dopiero ona robi z frazy temat na bloga, gdy
// rankuje strona główna albo listing („seo firma" to fraza usługowa).
const INFORMATIONAL = /\b(co|jak|czym|kim|czy|dlaczego|ile|kiedy|gdzie|przyklad\w*|poradnik\w*|definicj\w*|znaczenie)\b/;

/**
 * Udział słów frazy obecnych w tytule strony. Rdzenie porównujemy też
 * przedrostkiem („rebrand" ~ „rebranding") i bez spacji („pagerank" ~
 * „Page Rank") – matcher fraz jest do tego za dokładny.
 */
export function overlap(keyword, pageTokens) {
  const words = [...new Set(phraseStems(keyword))].filter((word) => !QUESTION_WORDS.has(word));
  if (!words.length) return 0;
  const stems = pageTokens.map((token) => token.stem);
  const compact = stems.join('');
  const hit = (word) => stems.some((stem) => stem === word
    || (Math.min(stem.length, word.length) >= 4 && (stem.startsWith(word) || word.startsWith(stem))))
    || (word.length >= 5 && compact.includes(word));
  return words.filter(hit).length / words.length;
}

const informational = (keyword) => INFORMATIONAL.test(fold(keyword));

const excluded = (path, prefixes) => prefixes.some((prefix) => path.startsWith(prefix));

/**
 * `excludePaths` – prefiksy stron usługowych (np. /oferta/): fraza, na którą
 * stoi landing oferty („pozycjonowanie toruń"), nie jest tematem na bloga.
 */
export function suggestGaps(details, { limit = SUGGESTIONS_LIMIT, excludePaths = [] } = {}) {
  const sources = details?.sources ?? {};
  const pages = pageIndex(sources.wordpress?.items);
  const byPath = new Map(pages.map((page) => [page.path, page]));
  const found = new Map();
  const take = (row) => {
    const key = phraseKey(row.keyword);
    if (!key || BRAND.test(row.keyword)) return;
    const current = found.get(key);
    if (!current) {
      found.set(key, row);
      return;
    }
    // Ta sama fraza z Senuto i GSC – jeden wiersz z obiema miarami.
    found.set(key, {
      ...current,
      searches: current.searches ?? row.searches ?? null,
      impressions: current.impressions ?? row.impressions ?? null,
      position: Math.min(current.position ?? 999, row.position ?? 999),
      sources: [...new Set([...current.sources, ...row.sources])],
    });
  };

  for (const row of sources.senuto?.keywords ?? []) {
    const position = Number(row.position);
    if (!(position >= GAP_MIN_POSITION && position <= GAP_MAX_POSITION)) continue;
    if ((row.searches ?? 0) < GAP_MIN_SEARCHES) continue;
    const path = normPath(row.url);
    if (excluded(path, excludePaths)) continue;
    const ranking = byPath.get(path);
    if (ranking && overlap(row.keyword, ranking.tokens) >= TOPICAL_OVERLAP) continue;
    // Strona główna albo listing (/slownik, /blog) łapie frazy usługowe i cudze
    // marki – z nich na bloga nadają się tylko pytania informacyjne.
    if (!ranking && path.split('/').filter(Boolean).length <= 1 && !informational(row.keyword)) continue;
    take({
      keyword: row.keyword,
      searches: row.searches ?? null,
      impressions: null,
      position,
      ranking_url: row.url ? `https://${String(row.url).replace(/^https?:\/\//, '')}` : null,
      ranking_title: ranking?.title ?? null,
      sources: ['Senuto'],
    });
  }
  for (const row of sources.gsc?.queries ?? []) {
    const position = Number(row.position);
    if (!(position >= GAP_MIN_POSITION && position <= GAP_MAX_POSITION)) continue;
    if ((row.impressions ?? 0) < GSC_MIN_IMPRESSIONS) continue;
    // Zapytanie GSC bez strony docelowej – bierzemy tylko pytania informacyjne.
    if (!informational(row.key)) continue;
    take({
      keyword: row.key,
      searches: null,
      impressions: row.impressions,
      position,
      ranking_url: null,
      ranking_title: null,
      sources: ['GSC'],
    });
  }

  // Filtr kanibalizacji na końcu – tylko dla kandydatów, nie dla 3,5 tys. fraz.
  const score = (row) => row.searches ?? Math.round((row.impressions ?? 0) / 10);
  const rows = [...found.values()]
    .filter((row) => !pagesWithPhrase(row.keyword, pages, 1).length)
    .sort((a, b) => score(b) - score(a) || a.position - b.position);
  // Jedna podpowiedź na stronę, która dziś łapie frazy „przy okazji" –
  // warianty jednego tematu („ux designers", „ui ux designers") to jeden tekst.
  const seenPages = new Set();
  return rows
    .filter((row) => {
      if (!row.ranking_url) return true;
      const path = normPath(row.ranking_url);
      if (path === '/') return true;
      if (seenPages.has(path)) return false;
      seenPages.add(path);
      return true;
    })
    .slice(0, limit);
}

/** Dane do kontroli w przeglądarce: wpisy i frazy, na które już stoimy. */
export function writerData(details, { excludePaths = [] } = {}) {
  const sources = details?.sources ?? {};
  const keywords = sources.senuto?.keywords ?? [];
  return {
    // Do SERP-gapu: po nich luka mówi „mamy / słabo / brak".
    own_keywords: keywords.map((row) => ({ keyword: row.keyword, position: row.position })),
    pages: pageIndex(sources.wordpress?.items).map(({ id, url, title }) => ({ id, url, title })),
    rankings: keywords
      // Do TOP 50: decyzja „odśwież czy nowy" (Worker, cw-semantic) patrzy też
      // na strony, które łapią frazę daleko – kontrola kanibalizacji tnie do 20.
      .filter((row) => Number(row.position) <= GAP_MAX_POSITION && !excluded(normPath(row.url), excludePaths))
      .map((row) => ({ keyword: row.keyword, position: row.position, path: normPath(row.url) })),
  };
}

/**
 * Czy fraza ma już stronę: wpis z frazą w tytule albo adres, który na nią
 * (albo jej wariant) stoi w TOP 20. Wtedy zamiast pisać od zera – odświeżenie.
 */
export function cannibalization(keyword, data) {
  const needle = phraseStems(keyword);
  if (!needle.length) return { pages: [], rankings: [] };
  const pages = (data.pages ?? []).map((page) => ({ ...page, tokens: tokens(page.title), path: normPath(page.url) }));
  const byPath = new Map(pages.map((page) => [page.path, page]));
  const titled = pages.filter((page) => matchTokens(page.tokens, needle).length > 0).slice(0, 5);
  const rankings = rankingsFor(keyword, data.rankings ?? [], CANNIBAL_POSITION_MAX)
    .slice(0, 5)
    .map((row) => ({ ...row, page: byPath.get(row.path) ?? null }));
  return {
    pages: titled.map(({ id, url, title }) => ({ id, url, title })),
    rankings: rankings.map(({ keyword: phrase, position, path, page }) => ({
      keyword: phrase, position, path, id: page?.id ?? null, title: page?.title ?? null, url: page?.url ?? null,
    })),
  };
}

/** Wiersze rankingu dla frazy: ta sama fraza albo wariant z jednym słowem więcej. */
/* Wiersze rankingu z policzonymi raz tokenami. Bez tego każda fraza tokenizowała
   od nowa ~3200 wierszy – 30 fraz to było ~500 ms CPU i Worker padał (1102). */
const preparedRankings = new WeakMap();
function prepareRankings(rankings) {
  let prepared = preparedRankings.get(rankings);
  if (!prepared) {
    prepared = rankings.map((row) => ({
      row,
      key: phraseKey(row.keyword),
      stems: new Set(phraseStems(row.keyword)),
      hay: tokens(row.keyword),
    }));
    preparedRankings.set(rankings, prepared);
  }
  return prepared;
}

export function rankingsFor(keyword, rankings, maxPosition = GAP_MAX_POSITION) {
  const needle = phraseStems(keyword);
  if (!needle.length) return [];
  const key = phraseKey(keyword);
  const limit = new Set(needle).size + 1;
  return prepareRankings(rankings)
    .filter(({ row }) => Number(row.position) <= maxPosition)
    // Ta sama fraza albo wariant z jednym słowem więcej („audyt seo sklepu").
    .filter(({ key: rowKey, stems, hay }) => rowKey === key
      || (stems.has(needle[0]) && stems.size <= limit && matchTokens(hay, needle).length > 0))
    .map(({ row }) => row)
    .sort((a, b) => a.position - b.position);
}
