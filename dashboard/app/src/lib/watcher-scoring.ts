/* Scoring i pilność wpisów Content Watchera – wspólne dla listy
   (/content-watcher/) i asystenta (/asystent/), żeby obie strony pokazywały
   te same „najpilniejsze” wpisy. Wydzielone 1:1 z content-watcher.astro. */
import type { DomainConfig, GscCompareRow, loadContentCatalog, loadDetails } from './data';
import { fmtInt, fmtNum, fmtPct } from './format';

export function scoreContent({ domainConfig, details, catalog, asOf }: {
  domainConfig: DomainConfig;
  details: ReturnType<typeof loadDetails>;
  catalog: ReturnType<typeof loadContentCatalog>;
  asOf: string;
}) {
const asOfTime = new Date(`${asOf}T00:00:00Z`).getTime();
const DAY = 86_400_000;

const normPath = (value: string): string => {
  const path = value.replace(/^https?:\/\/[^/]+/i, '').replace(/\/+$/, '');
  return path || '/';
};

const indexingByPath = new Map((details.sources.indexing?.rows ?? []).map((row) => [normPath(row.url), row]));
const senutoByPath = new Map(
  (details.sources.senuto?.urls ?? []).map((row) => [
    normPath(row.url.replace(/^(https?:\/\/)?(www\.)?[^/]+/i, '')),
    row,
  ]),
);
const ga4ByPath = new Map<string, {
  sessions: number;
  engagement_rate: number | null;
  avg_engagement_s: number | null;
}>();
for (const row of details.sources.ga4?.landing_pages?.rows ?? []) {
  const key = normPath(row.path);
  const previous = ga4ByPath.get(key);
  if (!previous) {
    ga4ByPath.set(key, {
      sessions: row.sessions,
      engagement_rate: row.engagement_rate ?? null,
      avg_engagement_s: row.avg_engagement_s ?? null,
    });
    continue;
  }
  const sessions = previous.sessions + row.sessions;
  ga4ByPath.set(key, {
    sessions,
    engagement_rate:
      previous.engagement_rate === null && row.engagement_rate == null
        ? null
        : ((previous.engagement_rate ?? 0) * previous.sessions + (row.engagement_rate ?? 0) * row.sessions) /
          (sessions || 1),
    avg_engagement_s:
      previous.avg_engagement_s === null && row.avg_engagement_s == null
        ? null
        : ((previous.avg_engagement_s ?? 0) * previous.sessions + (row.avg_engagement_s ?? 0) * row.sessions) /
          (sessions || 1),
  });
}
// Frazy Senuto per adres. Wpisów bywa po kilkadziesiąt na URL, więc do
// szczegółów trafia tylko krótka lista: najpierw frazy tuż pod progiem
// (11–30, czyli cel reoptymalizacji), potem najlepsze wolumenowo.
const senutoKeywordsByPath = new Map<string, { keyword: string; position: number; searches: number | null }[]>();
for (const row of details.sources.senuto?.keywords ?? []) {
  if (!row.url || typeof row.position !== 'number') continue;
  const key = normPath(row.url.replace(/^(https?:\/\/)?(www\.)?[^/]+/i, ''));
  const list = senutoKeywordsByPath.get(key) ?? [];
  list.push({ keyword: row.keyword, position: row.position, searches: row.searches });
  senutoKeywordsByPath.set(key, list);
}
const KEYWORDS_SHOWN = 6;
const keywordRank = (position: number): number => (position >= 11 && position <= 30 ? 0 : position <= 10 ? 1 : 2);

const gscCompare = details.sources.gsc?.compare?.qoq;
const compareByPath = new Map<string, GscCompareRow>(
  (gscCompare?.pages ?? []).map((row) => [normPath(row.key), row]),
);

type ScorePart = { key: string; points: number; max: number; available: boolean };

// Etykiety i opisy składowych są takie same dla każdego wpisu, więc jadą do
// przeglądarki raz, obok payloadu z liczbami. `hint` widać zawsze, `formula`
// siedzi w dymku „i".
const SCORE_PART_TEXTS: Record<string, { label: string; hint: string; formula: string }> = {
  loss: {
    label: 'Utrata ruchu',
    hint: 'Search Console: spadek kliknięć i pozycji względem poprzednich 90 dni',
    formula:
      'Ile kliknięć i pozycji wpis stracił przez ostatnie 90 dni. Im większy spadek, tym więcej punktów. ' +
      'Dane: Search Console. Brak danych = wpis nie miał wyświetleń w jednym z porównywanych okresów.',
  },
  potential: {
    label: 'Potencjał',
    hint: 'Search Console, 30 dni: wyświetlenia, pozycja 4–30, niskie CTR',
    formula:
      'Ile wpis może jeszcze zyskać. Punkty rosną, gdy strona ma dużo wyświetleń, stoi tuż za TOP 10 ' +
      'albo jest często pokazywana, a rzadko klikana. Dane: Search Console, ostatnie 30 dni.',
  },
  senuto: {
    label: 'Pokrycie fraz',
    hint: 'Senuto: frazy na pozycjach 11–30 i poza TOP 10',
    formula:
      'Ile fraz stoi tuż pod progiem widoczności – pozycje 11–30 i frazy poza TOP 10. ' +
      'Dane: Senuto. Zero punktów = adres jest widoczny na jakieś frazy, ale żadna nie jest tuż pod progiem. ' +
      'Brak danych = Senuto nie widzi tego adresu w wynikach wyszukiwania.',
  },
  engagement: {
    label: 'Zaangażowanie',
    hint: 'Wskaźnik zaangażowania (GA4) poniżej 60% (minimum 10 sesji)',
    formula:
      'Jak rzadko wpis angażuje czytelników – im niższy wskaźnik zaangażowania, tym więcej punktów. ' +
      'Dane: GA4, od 10 sesji.',
  },
};
const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

// Kalibracja per domena. Wiek NIE daje punktów – bramkuje wejście do kolejki
// i rozstrzyga remisy. Na dojrzałej domenie (458 wpisów grupa-icea.pl, 428
// starszych niż rok) świeżość jako składowa scoringu robiła z 82% treści
// „kandydatów", a wpis bez danych GSC wypadał wyżej niż wpis z danymi.
const watcherCfg = (domainConfig.content_watcher ?? {}) as { min_age_days?: number };
const minAgeDays = watcherCfg.min_age_days ?? 90;

// Przedziały wieku treści (dni od ostatniej realnej zmiany). Stałe dla obu
// domen – „3 / 6 / 12 miesięcy" to język, w którym rozmawia się o odświeżaniu.
// `label` nazywa akcję (nagłówek karty), `range` opisuje sam przedział i wraca
// w kolumnie Status przy każdym wpisie.
const AGE_BUCKETS = [
  { key: 'm0-3', label: 'Świeże treści', hint: 'aktualne (do 3 mies.)', range: 'do 3 mies.', tone: 'ok', from: 0, to: 90 },
  { key: 'm3-6', label: 'Do przeglądu', hint: 'starzejące się (3–6 mies.)', range: '3–6 mies.', tone: 'mid', from: 90, to: 180 },
  { key: 'm6-12', label: 'Zaplanuj aktualizację', hint: 'tracące wartość (6–12 mies.)', range: '6–12 mies.', tone: 'warn', from: 180, to: 365 },
  { key: 'm12+', label: 'Wymaga przebudowy', hint: 'krytyczne zaległości (powyżej 12 mies.)', range: 'ponad 12 mies.', tone: 'err', from: 365, to: Infinity },
] as const;
const ageBucket = (days: number): string =>
  AGE_BUCKETS.find((bucket) => days >= bucket.from && days < bucket.to)?.key ?? 'm12+';

const items = catalog
  .map((content) => {
    const path = normPath(content.url);
    const indexing = indexingByPath.get(path) ?? null;
    const senuto = senutoByPath.get(path) ?? null;
    const ga4 = ga4ByPath.get(path) ?? null;
    const compare = compareByPath.get(path) ?? null;
    const effectiveDate = content.updated_at ?? content.published_at;
    const ageDays = Math.max(0, Math.floor((asOfTime - new Date(`${effectiveDate}T00:00:00Z`).getTime()) / DAY));
    const clicksDelta = compare ? compare.clicks - compare.prev_clicks : null;
    const impressionsDelta = compare ? compare.impressions - compare.prev_impressions : null;
    const positionDelta =
      typeof compare?.position === 'number' && typeof compare.prev_position === 'number'
        ? Math.round((compare.position - compare.prev_position) * 10) / 10
        : null;

    const clickLoss = compare ? Math.max(0, compare.prev_clicks - compare.clicks) : 0;
    const clickLossPct = compare && compare.prev_clicks > 0 ? clickLoss / compare.prev_clicks : 0;
    const positionLoss = Math.max(0, positionDelta ?? 0);
    const lossPoints = Math.min(26, clickLoss * 1.5 + clickLossPct * 16) + Math.min(19, positionLoss * 3.8);

    const impressions = indexing?.impressions ?? 0;
    const bestPosition = indexing?.position ?? senuto?.best_position ?? null;
    const impressionPoints = Math.min(14, Math.log10(impressions + 1) * 4.7);
    const positionPoints =
      typeof bestPosition !== 'number'
        ? 0
        : bestPosition >= 4 && bestPosition <= 10
          ? 11
          : bestPosition <= 20
            ? 17
            : bestPosition <= 30
              ? 11
              : 0;
    const ctrPoints = impressions >= 100 && (indexing?.ctr ?? 100) < 2 ? 7 : 0;
    const potentialPoints = Math.min(35, impressionPoints + positionPoints + ctrPoints);
    const engagementAvailable = Boolean(ga4 && ga4.sessions >= 10 && ga4.engagement_rate !== null);
    const engagementPoints = engagementAvailable
      ? clamp((60 - (ga4?.engagement_rate ?? 60)) / 7.5, 0, 8)
      : 0;
    const senutoAvailable = Boolean(senuto);
    const senutoPoints = !senuto
      ? 0
      : Math.min(
          12,
          (senuto.best_position >= 11 && senuto.best_position <= 30 ? 8 : 0) +
            Math.min(4, Math.max(0, senuto.keywords - senuto.top10) * 0.6),
        );

    const parts: ScorePart[] = [
      { key: 'loss', points: lossPoints, max: 45, available: Boolean(compare) },
      { key: 'potential', points: potentialPoints, max: 35, available: Boolean(indexing) },
      { key: 'senuto', points: senutoPoints, max: 12, available: senutoAvailable },
      { key: 'engagement', points: engagementPoints, max: 8, available: engagementAvailable },
    ];
    // Bez pomiaru z GSC (indeksacja lub porównanie okien) nie ma czego ważyć –
    // taka treść wypada z rankingu zamiast dostawać wynik z resztek składowych.
    const measured = Boolean(indexing) || Boolean(compare);
    // Mianownik jest stały (45+35+12+8 = 100). Normalizacja do dostępnych
    // składowych dawała 100 pkt wpisom, o których wiemy najmniej – im mniej
    // danych, tym wyższy wynik. Brak składowej = brak punktów, nie ulga.
    const rawScore = parts.filter((part) => part.available).reduce((sum, part) => sum + part.points, 0);
    const score = measured ? Math.round(rawScore) : 0;

    const reasons: string[] = [];
    if (clickLoss > 0) reasons.push(`utrata ${fmtInt(clickLoss)} kliknięć`);
    if (positionLoss >= 1) reasons.push(`pozycja spadła o ${fmtNum(positionLoss, 1)}`);
    if (impressions >= 100 && typeof bestPosition === 'number' && bestPosition >= 4 && bestPosition <= 30) {
      reasons.push(`${fmtInt(impressions)} wyświetleń przy pozycji ${fmtNum(bestPosition, 1)}`);
    }
    if (impressions > 0 && typeof bestPosition === 'number' && bestPosition >= 11 && bestPosition <= 20) {
      reasons.push(`pozycja ${fmtNum(bestPosition, 1)} – blisko TOP 10`);
    }
    if (ctrPoints > 0) reasons.push(`CTR ${fmtPct(indexing?.ctr)} mimo ${fmtInt(impressions)} wyświetleń`);
    if (ageDays >= minAgeDays) reasons.push(`bez aktualizacji od ${fmtInt(ageDays)} dni`);
    if (engagementPoints >= 3) reasons.push(`zaangażowanie ${fmtPct(ga4?.engagement_rate)}`);

    const indexed = indexing?.indexed ?? null;
    // Stan pomiaru rozdzielony od pilności: wpis poza indeksem albo bez danych
    // GSC nie jest „mniej pilny" – po prostu nie ma czego ważyć, idzie na
    // osobną diagnozę.
    const state = indexed === false ? 'not-indexed' : !measured ? 'no-data' : 'measured';

    return {
      ...content,
      path,
      age_days: ageDays,
      age_bucket: ageBucket(ageDays),
      state,
      effective_date: effectiveDate,
      indexed,
      last_crawl: indexing?.last_crawl ?? null,
      clicks: indexing?.clicks ?? null,
      impressions: indexing?.impressions ?? null,
      ctr: indexing?.ctr ?? null,
      gsc_position: indexing?.position ?? null,
      clicks_delta: clicksDelta,
      impressions_delta: impressionsDelta,
      position_delta: positionDelta,
      ga4_sessions: ga4?.sessions ?? null,
      engagement_rate: ga4?.engagement_rate ?? null,
      avg_engagement_s: ga4?.avg_engagement_s ?? null,
      senuto_position: senuto?.best_position ?? null,
      senuto_keyword: senuto?.best_keyword ?? null,
      senuto_keywords: senuto?.keywords ?? null,
      senuto_top10: senuto?.top10 ?? null,
      senuto_top_keywords: [...(senutoKeywordsByPath.get(path) ?? [])]
        .sort(
          (a, b) =>
            keywordRank(a.position) - keywordRank(b.position) ||
            (b.searches ?? 0) - (a.searches ?? 0) ||
            a.position - b.position,
        )
        .slice(0, KEYWORDS_SHOWN),
      score,
      // Do payloadu idą tylko liczby – etykiety i opisy są stałe dla wszystkich
      // wpisów, więc powielone 604 razy rozdmuchiwały stronę do megabajtów.
      parts: parts.map((part) => ({
        key: part.key,
        points: Math.round(part.points * 10) / 10,
        max: part.max,
        available: part.available,
      })),
      reasons,
    };
  });

// „Niski ranking" liczymy z kliknięć i wyświetleń, nie ze średniej pozycji:
// pozycja jest średnią po frazach, więc wpis może być pierwszy na frazę bez
// popytu i wyglądać świetnie mimo zerowego ruchu. Próg to mediana domeny –
// bezwzględne liczby znaczą co innego na blogu 40-wpisowym i na 604 wpisach.
const median = (values: number[]): number => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};
// Mediana liczona z wpisów, które mają jakikolwiek ruch. Na całym katalogu
// wyszłaby zero (połowa treści nie ma ani jednego kliknięcia) i „ma 1 klik"
// znaczyłoby „wyniki OK". Punktem odniesienia jest typowy wpis, który działa.
const measuredItems = items.filter((item) => item.state === 'measured');
const medianClicks = median(measuredItems.map((item) => item.clicks ?? 0).filter((value) => value > 0));
const medianImpressions = median(measuredItems.map((item) => item.impressions ?? 0).filter((value) => value > 0));
const weakTraffic = (item: { clicks: number | null; impressions: number | null }): boolean =>
  (item.clicks ?? 0) < medianClicks && (item.impressions ?? 0) < medianImpressions;

// Macierz pilności: wyniki × wiek. Słabe wyniki eskalują z wiekiem (ponad rok
// bez zmian = krytyczny), dobre wyniki schodzą o jeden stopień – treść, która
// dowozi ruch, nie staje się pilna tylko dlatego, że się zestarzała.
const URGENCY_BY_AGE: Record<string, string> = { 'm12+': 'critical', 'm6-12': 'high', 'm3-6': 'normal', 'm0-3': 'low' };
const DOWNGRADE: Record<string, string> = { critical: 'normal', high: 'low', normal: 'low', low: 'low' };
const withUrgency = items.map((item) => {
  const weak = weakTraffic(item);
  const base = URGENCY_BY_AGE[item.age_bucket] ?? 'low';
  const urgency = item.state !== 'measured' ? 'none' : weak ? base : DOWNGRADE[base];
  return { ...item, weak_traffic: weak, urgency };
});

const URGENCY_RANK: Record<string, number> = { critical: 4, high: 3, normal: 2, low: 1, none: 0 };
const sortedItems = withUrgency.sort(
  (a, b) =>
    URGENCY_RANK[b.urgency] - URGENCY_RANK[a.urgency] ||
    b.score - a.score ||
    b.age_days - a.age_days ||
    a.title.localeCompare(b.title, 'pl'),
);

const byAge = Object.fromEntries(
  AGE_BUCKETS.map((bucket) => [bucket.key, sortedItems.filter((item) => item.age_bucket === bucket.key).length]),
);
const byUrgency = Object.fromEntries(
  ['critical', 'high', 'normal', 'low'].map((key) => [key, sortedItems.filter((item) => item.urgency === key).length]),
);
const notIndexed = sortedItems.filter((item) => item.state === 'not-indexed').length;
const noData = sortedItems.filter((item) => item.state === 'no-data').length;
const withTraffic = sortedItems.filter((item) => (item.clicks ?? 0) > 0 || (item.impressions ?? 0) > 0).length;
const pillars = [...new Set(sortedItems.map((item) => item.pillar))].sort((a, b) => a.localeCompare(b, 'pl'));
const detailPayload = Object.fromEntries(sortedItems.map((item) => [item.id, item]));

return {
  SCORE_PART_TEXTS, AGE_BUCKETS, URGENCY_RANK, minAgeDays, items, sortedItems,
  medianClicks, medianImpressions, byAge, byUrgency, notIndexed, noData, withTraffic, pillars, detailPayload,
};
}

export type ScoredItem = ReturnType<typeof scoreContent>['sortedItems'][number];
