/* Matrix – port dashboard/app/src/pages/[domain]/matrix.astro: indeksacja
   z sitemapy (URL Inspection), segmenty serwisu, tabela adresów ze źródłami
   obok siebie (Senuto, GSC, GA4) i dekodowanie przyczyn spadków. */
import { PageTitle, Note, SectionHead, SourceState, StatCard, StatGrid, Card } from "@/components/ui";
import { cn } from "@/lib/cn";
import {
  isTemporarySourceFailure,
  latestSnapshot,
  loadDetails,
  loadSnapshots,
  sourceStatuses,
} from "@/lib/data";
import { fmtDate, fmtDateRange, fmtInt, fmtNum, fmtPct } from "@/lib/format";
import { lastOk, stripOrigin } from "@/lib/metrics";
import { domainParams, titleFor, type DomainProps } from "@/lib/pages";
import { C } from "@/lib/palette";
import MatrixDrops, { type DropRow } from "./MatrixDrops";
import MatrixSegments, { type SegmentCard } from "./MatrixSegments";
import MatrixTable, { type MatrixRow } from "./MatrixTable";

export const dynamicParams = false;
export const generateStaticParams = () => domainParams("indexing");
export const generateMetadata = titleFor("Matrix");

type Mode = "qoq" | "yoy";
const normPath = (p: string) => p.replace(/\/+$/, "") || "/";

/* Delta do pigułki: % dla liczników, p.p. dla CTR, pozycje dla pozycji. */
function deltaPill(cur: number | null, prev: number | null, kind: "pct" | "pp" | "pos") {
  if (cur === null || prev === null) return { tone: "flat" as const, text: "–" };
  if (kind === "pct") {
    if (prev === 0) return cur === 0 ? { tone: "flat" as const, text: "0%" } : { tone: "up" as const, text: "nowe" };
    const pct = Math.round(((cur - prev) / prev) * 100);
    return { tone: pct > 0 ? ("up" as const) : pct < 0 ? ("down" as const) : ("flat" as const), text: `${pct > 0 ? "+" : ""}${fmtInt(pct)}%` };
  }
  const d = Math.round((cur - prev) * 10) / 10 + 0;
  const sign = d > 0 ? "+" : "";
  if (kind === "pp") return { tone: d > 0 ? ("up" as const) : d < 0 ? ("down" as const) : ("flat" as const), text: `${sign}${fmtNum(d, 1)} p.p.` };
  return { tone: d < 0 ? ("up" as const) : d > 0 ? ("down" as const) : ("flat" as const), text: `${sign}${fmtNum(d, 1)}` };
}

export default async function MatrixPage({ params }: DomainProps) {
  const { domain } = await params;
  const snapshots = loadSnapshots(domain);
  const latest = latestSnapshot(domain);
  const details = loadDetails(domain);
  const indexing = sourceStatuses(latest).indexing;
  const idxLast = lastOk(snapshots, "indexing");
  const senutoLast = lastOk(snapshots, "senuto");
  const staleDate = isTemporarySourceFailure(indexing) && idxLast ? fmtDate(idxLast.date) : null;
  const summary = (indexing?.status === "ok" ? indexing.data : idxLast?.data) as Record<string, number | string | undefined> | undefined;
  const rows = details.sources.indexing?.rows ?? [];
  const gscWindow = details.sources.indexing?.window;
  const ga4Window = details.sources.ga4?.landing_pages?.window;

  // GA4 oddaje ścieżki bez końcowego slasha, sitemap z nim – normalizujemy obie
  // strony; duplikaty scalamy (suma sesji, engagement ważony sesjami).
  const ga4 = new Map<string, { sessions: number; engagement_rate: number | null }>();
  for (const r of details.sources.ga4?.landing_pages?.rows ?? []) {
    const key = normPath(r.path);
    const prev = ga4.get(key);
    if (!prev) ga4.set(key, { sessions: r.sessions, engagement_rate: r.engagement_rate ?? null });
    else {
      const sessions = prev.sessions + r.sessions;
      const weighted =
        prev.engagement_rate === null && r.engagement_rate == null
          ? null
          : ((prev.engagement_rate ?? 0) * prev.sessions + (r.engagement_rate ?? 0) * r.sessions) / (sessions || 1);
      ga4.set(key, { sessions, engagement_rate: weighted });
    }
  }
  // Senuto: adresy bez schematu i www – join po samej ścieżce.
  const senuto = new Map(
    (details.sources.senuto?.urls ?? []).map((u) => [normPath(u.url.replace(/^(https?:\/\/)?(www\.)?[^/]+/, "") || "/"), u]),
  );

  const joined: MatrixRow[] = rows.map((r) => {
    const path = normPath(stripOrigin(r.url));
    const g = ga4.get(path);
    const s = senuto.get(path);
    return {
      url: r.url,
      path: stripOrigin(r.url),
      indexed: r.indexed,
      coverage: r.coverage_state,
      lastCrawl: r.last_crawl,
      clicks: r.clicks,
      impressions: r.impressions,
      ctr: r.ctr,
      sessions: g?.sessions ?? null,
      engagement: g?.engagement_rate ?? null,
      senutoPosition: s?.best_position ?? null,
      senutoKeyword: s?.best_keyword ?? null,
      senutoKeywords: s?.keywords ?? null,
      senutoTop10: s?.top10 ?? null,
    };
  });

  // Segmenty: pierwszy poziom ścieżki; jednostronicowe → „pozostałe".
  const segmentOf = (path: string) => (path === "/" || path === "" ? "strona główna" : `/${path.split("/").filter(Boolean)[0]}/`);
  const groups = new Map<string, MatrixRow[]>();
  for (const r of joined) {
    const seg = segmentOf(normPath(r.path));
    groups.set(seg, [...(groups.get(seg) ?? []), r]);
  }
  const segRows: { segment: string; rows: MatrixRow[] }[] = [];
  const leftovers: MatrixRow[] = [];
  const leftoverKeys = new Set<string>();
  for (const [seg, rs] of groups) {
    if (seg === "strona główna" || rs.length >= 2) segRows.push({ segment: seg, rows: rs });
    else {
      leftovers.push(...rs);
      leftoverKeys.add(seg);
    }
  }
  if (leftovers.length) segRows.push({ segment: "pozostałe", rows: leftovers });

  const compare = details.sources.gsc?.compare;
  const modes = (["qoq", "yoy"] as const).filter((m) => compare?.[m]?.segments?.length);
  const segmentCompare = (mode: Mode, segment: string) => {
    const src = compare?.[mode]?.segments ?? [];
    const keys = segment === "strona główna" ? ["/"] : segment === "pozostałe" ? [...leftoverKeys] : [segment];
    const parts = src.filter((s) => keys.includes(s.key));
    const sum = (f: (s: (typeof parts)[number]) => number) => parts.reduce((a, s) => a + f(s), 0);
    const clicks = sum((s) => s.clicks);
    const prevClicks = sum((s) => s.prev_clicks);
    const impressions = sum((s) => s.impressions);
    const prevImpressions = sum((s) => s.prev_impressions);
    const position = impressions ? Math.round((sum((s) => (s.position ?? 0) * s.impressions) / impressions) * 10) / 10 : null;
    const prevPosition = prevImpressions
      ? Math.round((sum((s) => (s.prev_position ?? 0) * s.prev_impressions) / prevImpressions) * 10) / 10
      : null;
    const ctr = impressions ? Math.round((clicks / impressions) * 10000) / 100 : null;
    const prevCtr = prevImpressions ? Math.round((prevClicks / prevImpressions) * 10000) / 100 : null;
    return [
      { label: "Wyświetlenia", value: fmtInt(impressions), pill: deltaPill(impressions, prevImpressions, "pct") },
      { label: "Kliknięcia", value: fmtInt(clicks), pill: deltaPill(clicks, prevClicks, "pct") },
      { label: "Pozycja", value: position === null ? "–" : fmtNum(position, 1), pill: deltaPill(position, prevPosition, "pos") },
      { label: "CTR", value: fmtPct(ctr), pill: deltaPill(ctr, prevCtr, "pp") },
    ];
  };
  const PREFERRED = ["/blog/", "strona główna", "/oferta/", "/seo-newsy/", "pozostałe"];
  const segments: SegmentCard[] = segRows
    .map(({ segment, rows: rs }) => {
      const engWeight = rs.reduce((s, r) => s + (r.engagement !== null ? (r.sessions ?? 0) : 0), 0);
      const engSum = rs.reduce((s, r) => s + (r.engagement !== null ? r.engagement * (r.sessions ?? 0) : 0), 0);
      return {
        segment,
        pages: rs.length,
        indexed: rs.filter((r) => r.indexed).length,
        impressions: rs.reduce((s, r) => s + (r.impressions ?? 0), 0),
        views: {
          now: [
            { label: "Wyświetlenia", value: fmtInt(rs.reduce((s, r) => s + (r.impressions ?? 0), 0)) },
            { label: "Kliknięcia", value: fmtInt(rs.reduce((s, r) => s + (r.clicks ?? 0), 0)) },
            { label: "Engagement", value: fmtPct(engWeight > 0 ? engSum / engWeight : null) },
            { label: "Frazy TOP 10", value: fmtInt(rs.reduce((s, r) => s + (r.senutoTop10 ?? 0), 0)) },
          ],
          ...Object.fromEntries(modes.map((m) => [m, segmentCompare(m, segment)])),
        },
      };
    })
    .sort((a, b) => {
      const ai = PREFERRED.indexOf(a.segment);
      const bi = PREFERRED.indexOf(b.segment);
      if (ai !== -1 || bi !== -1) return (ai === -1 ? PREFERRED.length - 1 : ai) - (bi === -1 ? PREFERRED.length - 1 : bi);
      return b.pages - a.pages || b.impressions - a.impressions;
    });
  const range = (m: Mode) => (compare?.[m] ? `${fmtDateRange(compare.cur.start, compare.cur.end)} vs ${fmtDateRange(compare[m]!.prev.start, compare[m]!.prev.end)}` : "");

  // Priorytety: strony tracące kliknięcia (lub > 1 pozycję), największe straty najpierw.
  const declining = (mode: Mode): DropRow[] =>
    (compare?.[mode]?.pages ?? [])
      .map((p) => {
        const dClicks = p.clicks - p.prev_clicks;
        const dImpr = p.impressions - p.prev_impressions;
        const dPos =
          typeof p.position === "number" && typeof p.prev_position === "number"
            ? Math.round((p.position - p.prev_position) * 10) / 10
            : null;
        // Dekodowanie przyczyny: pierwszy pasujący warunek wygrywa.
        const cause =
          dImpr > 0 && dClicks < 0 ? "ctr" : (dPos ?? 0) > 1 ? "pos" : dImpr < 0 ? "demand" : "mixed";
        return {
          url: p.key,
          path: stripOrigin(p.key),
          cause,
          clicks: p.clicks,
          dClicks,
          impressions: p.impressions,
          dImpr,
          position: p.position,
          dPos,
          engagement: ga4.get(normPath(stripOrigin(p.key)))?.engagement_rate ?? null,
        } satisfies DropRow;
      })
      .filter((p) => p.dClicks < 0 || (p.dPos ?? 0) > 1)
      .sort((a, b) => a.dClicks - b.dClicks || (b.dPos ?? 0) - (a.dPos ?? 0))
      .slice(0, 50);
  const drops = { qoq: declining("qoq"), yoy: declining("yoy") };

  const indexed = Number(summary?.indexed ?? joined.filter((r) => r.indexed).length);
  const checked = Number(summary?.pages_checked ?? joined.length);
  const notIndexed = Number(summary?.not_indexed ?? checked - indexed);
  const sitemapUrls = Number(summary?.sitemap_urls ?? checked);
  const coverage = sitemapUrls ? Math.round((indexed / sitemapUrls) * 100) : 0;

  return (
    <>
      <PageTitle title="Matrix" meta="Te same adresy URL w indeksie, w Senuto, w GSC i w GA4" />
      <SourceState
        name="Indeksacja"
        status={indexing?.status}
        error={indexing?.error?.replace(/^indexing:\s*/i, "")}
        temporary={isTemporarySourceFailure(indexing)}
        lastDate={idxLast?.date}
      />
      {summary?.aborted && (
        <p className="mb-6 rounded border border-warning-200 bg-warning-50 px-4 py-3 text-theme-sm text-warning-800 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-warning-300">
          <b className="font-medium">Indeksacja:</b> przejazd częściowy ({checked} z {sitemapUrls} adresów) – {summary.aborted}; reszta
          dogra się kolejnym przebiegiem collectora.
        </p>
      )}
      <Note>
        Matrix zestawia te same adresy: indeksację, pozycje w <b>Senuto</b>, ruch z <b>GSC</b> i zaangażowanie w <b>GA4</b>.
        Segmenty serwisu są na kafelkach, a spadki trafiają do wspólnej tabeli z automatycznie wykrytą przyczyną. Ahrefs nie
        udostępnia linków na poziomie adresu, więc jego dane są tylko w profilu domeny.
      </Note>

      <SectionHead title="Indeksacja" meta="sitemap · GSC URL Inspection" />
      <StatGrid cols={4}>
        <StatCard label="Zaindeksowane" value={indexed} color={C.brand} staleDate={staleDate} hero>
          <div className="mt-3">
            <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-white/5">
              <i className="block h-full rounded-full bg-brand-500" style={{ width: `${coverage}%` }} />
            </div>
            <p className="mt-2 text-theme-xs text-gray-500 dark:text-gray-400">
              {coverage}% z {fmtInt(sitemapUrls)} adresów z sitemapy
            </p>
          </div>
        </StatCard>
        <StatCard label="Adresy w sitemapie" value={sitemapUrls} staleDate={staleDate} />
        <StatCard label="Niezaindeksowane" value={notIndexed} color={notIndexed ? C.orange : undefined} staleDate={staleDate} />
        <StatCard label="Sprawdzone" value={checked} staleDate={staleDate} />
      </StatGrid>

      {segments.length > 1 && (
        <MatrixSegments
          segments={segments}
          modes={[
            { value: "now", label: "30 dni", meta: "agregacja po pierwszym poziomie ścieżki · GSC 30 dni" },
            ...modes.map((m) => ({
              value: m,
              label: m === "qoq" ? "vs 3 mies." : "vs rok",
              meta: `GSC: ${range(m)}`,
            })),
          ]}
        />
      )}

      <SectionHead title="Matrix stron" meta="jeden adres – realne źródła obok siebie" />
      <Card className="mb-4 flex flex-wrap gap-x-5 gap-y-1.5 px-4 py-3 text-theme-sm text-gray-600 dark:text-gray-400">
        <b className="font-medium text-gray-800 dark:text-white/90">Zakres danych</b>
        <span>Senuto: stan z {fmtDate(senutoLast?.date)}</span>
        <span>GSC: {fmtDateRange(gscWindow?.start, gscWindow?.end)} · 30 dni</span>
        <span>GA4: {fmtDateRange(ga4Window?.start, ga4Window?.end)} · 28 dni</span>
        <span className={cn("xl:ms-auto", "text-gray-500")}>
          Indeksacja: pomiar z {fmtDate(idxLast?.date)} · {fmtInt(checked)} z {fmtInt(sitemapUrls)} adresów
        </span>
      </Card>
      <MatrixTable domain={domain} rows={joined} />

      {(drops.qoq.length > 0 || drops.yoy.length > 0) && (
        <MatrixDrops domain={domain} drops={drops} labels={{ qoq: range("qoq"), yoy: range("yoy") }} />
      )}
    </>
  );
}
