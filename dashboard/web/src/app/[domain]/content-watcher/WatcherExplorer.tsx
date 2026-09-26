"use client";

/* Część interaktywna Content Watchera: trzy niezależne wymiary filtra (wiek,
   pilność, stan pomiaru) składane iloczynem + filar, tabela wpisów i okno
   szczegółów z rozbiciem wyniku. */
import DataGrid from "@/components/grid/DataGrid";
import Segmented from "@/components/Segmented";
import { SectionHead, StatCard, StatGrid } from "@/components/ui";
import { cn } from "@/lib/cn";
import { fmtDate, fmtInt, fmtNum, fmtPct } from "@/lib/format";
import type { ScoredItem } from "@/lib/watcher-scoring";
import type { ColDef } from "ag-grid-community";
import { ExternalLink, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type Bucket = { key: string; label: string; hint: string; range: string; tone: string };
type PartText = { label: string; hint: string; formula: string };
type Dim = "age" | "urgency" | "state";

const URGENCY: Record<string, { label: string; cls: string; rank: number }> = {
  critical: { label: "krytyczny", cls: "bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400", rank: 4 },
  high: { label: "wysoki", cls: "bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300", rank: 3 },
  normal: { label: "normalny", cls: "bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400", rank: 2 },
  low: { label: "niski", cls: "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400", rank: 1 },
  none: { label: "brak oceny", cls: "bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400", rank: 0 },
};
const TONE: Record<string, string> = {
  ok: "#12b76a",
  mid: "#f79009",
  warn: "#f6704c",
  err: "#f04438",
  muted: "#9a9fb5",
};
const AGE_CHIP: Record<string, string> = {
  "m0-3": "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400",
  "m3-6": "bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400",
  "m6-12": "bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
  "m12+": "bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400",
};
const STATE: Record<string, string> = { measured: "w indeksie", "not-indexed": "poza indeksem", "no-data": "brak pomiaru" };

function Stacked({ top, bottom }: { top: React.ReactNode; bottom?: React.ReactNode }) {
  return (
    <span className="flex flex-col justify-center leading-tight">
      <span>{top}</span>
      {bottom && <small className="mt-1 text-theme-xs whitespace-nowrap text-gray-500 dark:text-gray-400">{bottom}</small>}
    </span>
  );
}

export default function WatcherExplorer({
  domain,
  editorBase,
  items,
  ageBuckets,
  byAge,
  byUrgency,
  notIndexed,
  noData,
  withTraffic,
  pillars,
  partTexts,
  medianClicks,
  medianImpressions,
  minAgeDays,
}: {
  domain: string;
  editorBase: string | null;
  items: ScoredItem[];
  ageBuckets: Bucket[];
  byAge: Record<string, number>;
  byUrgency: Record<string, number>;
  notIndexed: number;
  noData: number;
  withTraffic: number;
  pillars: string[];
  partTexts: Record<string, PartText>;
  medianClicks: number;
  medianImpressions: number;
  minAgeDays: number;
}) {
  const [active, setActive] = useState<Record<Dim, string>>({ age: "all", urgency: "all", state: "all" });
  const [pillar, setPillar] = useState("all");
  const [detail, setDetail] = useState<ScoredItem | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const weakCount = items.filter((i) => i.state === "measured" && i.weak_traffic).length;

  const toggle = (dim: Dim, value: string, scroll = false) => {
    setActive((cur) => (value === "all" ? { age: "all", urgency: "all", state: "all" } : { ...cur, [dim]: cur[dim] === value ? "all" : value }));
    if (scroll) tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const filter = useMemo(() => {
    const { age, urgency, state } = active;
    if (age === "all" && urgency === "all" && state === "all" && pillar === "all") return null;
    return (i: ScoredItem) =>
      (age === "all" || i.age_bucket === age) &&
      (urgency === "all" || i.urgency === urgency) &&
      (state === "all" ||
        (state === "traffic" ? (i.clicks ?? 0) > 0 || (i.impressions ?? 0) > 0 : state === "weak" ? i.state === "measured" && i.weak_traffic : i.state === state)) &&
      (pillar === "all" || i.pillar === pillar);
  }, [active, pillar]);

  const columns = useMemo<ColDef<ScoredItem>[]>(
    () => [
      {
        headerName: "Pilność",
        colId: "urgency",
        width: 112,
        valueGetter: ({ data }) => (data ? URGENCY[data.urgency].rank * 1000 + data.score : 0),
        sort: "desc",
        getQuickFilterText: ({ data }) => URGENCY[data?.urgency ?? "none"].label,
        cellRenderer: ({ data }: { data?: ScoredItem }) =>
          data && (
            <Stacked
              top={<span className={cn("rounded px-2 py-0.5 text-theme-xs font-medium", URGENCY[data.urgency].cls)}>{URGENCY[data.urgency].label}</span>}
              bottom={data.state === "measured" ? `wynik ${data.score}/100` : STATE[data.state]}
            />
          ),
      },
      {
        field: "title",
        headerName: "Treść",
        flex: 1,
        minWidth: 260,
        getQuickFilterText: ({ data }) => `${data?.title} ${data?.path} ${data?.pillar}`,
        cellRenderer: ({ data }: { data?: ScoredItem }) =>
          data && (
            <span className="flex min-w-0 flex-col justify-center leading-tight">
              <span className="flex min-w-0 items-center gap-2">
                <a href={data.url} target="_blank" rel="noopener" className="truncate font-medium text-gray-800 hover:text-brand-600 dark:text-white/90 dark:hover:text-brand-400">
                  {data.title}
                </a>
                <button
                  type="button"
                  onClick={() => setDetail(data)}
                  className="shrink-0 text-theme-xs text-gray-500 underline decoration-gray-300 underline-offset-2 hover:text-brand-600 dark:text-gray-400"
                >
                  Szczegóły
                </button>
                {editorBase && (
                  <a
                    href={`${editorBase}${data.id}`}
                    target="_blank"
                    rel="noopener"
                    className="inline-flex shrink-0 items-center gap-0.5 text-theme-xs text-gray-500 underline decoration-gray-300 underline-offset-2 hover:text-brand-600 dark:text-gray-400"
                    title="Edytor otwiera się w obecnym dashboardzie"
                  >
                    Edytor <ExternalLink className="size-3" />
                  </a>
                )}
              </span>
              <small className="mt-1 truncate text-theme-xs text-gray-500 dark:text-gray-400">
                {data.pillar} · {fmtInt(data.word_count)} słów · {fmtInt(data.headings)} nagłówków
              </small>
            </span>
          ),
      },
      {
        field: "published_at",
        headerName: "Publikacja",
        width: 108,
        getQuickFilterText: () => "",
        cellRenderer: ({ value }: { value: string }) => (
          <span className="rounded bg-gray-100 px-2 py-0.5 text-theme-xs tabular-nums dark:bg-white/5">{fmtDate(value)}</span>
        ),
      },
      {
        field: "effective_date",
        headerName: "Aktualizacja",
        width: 126,
        getQuickFilterText: () => "",
        cellRenderer: ({ data }: { data?: ScoredItem }) =>
          data && (
            <Stacked
              top={
                <span
                  className={cn("rounded px-2 py-0.5 text-theme-xs font-medium tabular-nums", AGE_CHIP[data.age_bucket])}
                  title={data.hash_baseline ? "Data systemowa – punkt odniesienia przed pierwszą weryfikacją zmian." : undefined}
                >
                  {fmtDate(data.updated_at ?? data.published_at)}
                  {data.hash_baseline ? " ≈" : ""}
                </span>
              }
              bottom={`${fmtInt(data.age_days)} dni temu`}
            />
          ),
      },
      {
        field: "impressions",
        headerName: "GSC · 30 dni",
        width: 150,
        type: "rightAligned",
        getQuickFilterText: () => "",
        cellRenderer: ({ data }: { data?: ScoredItem }) =>
          data && (
            <Stacked
              top={
                <>
                  <b className="font-medium">{fmtInt(data.clicks)}</b> klik.
                </>
              }
              bottom={`${fmtInt(data.impressions)} wyśw. · CTR ${fmtPct(data.ctr)}`}
            />
          ),
      },
      {
        field: "clicks_delta",
        headerName: "Zmiana · 90 dni",
        width: 128,
        type: "rightAligned",
        getQuickFilterText: () => "",
        cellRenderer: ({ data }: { data?: ScoredItem }) =>
          data && (
            <Stacked
              top={
                <span
                  className={cn(
                    (data.clicks_delta ?? 0) < 0 && "font-medium text-error-600 dark:text-error-400",
                    (data.clicks_delta ?? 0) > 0 && "font-medium text-success-600 dark:text-success-400",
                  )}
                >
                  {data.clicks_delta === null ? "–" : `${data.clicks_delta > 0 ? "+" : ""}${fmtInt(data.clicks_delta)} klik.`}
                </span>
              }
              bottom={data.position_delta === null ? "pozycja: –" : `pozycja ${data.position_delta > 0 ? "+" : ""}${fmtNum(data.position_delta, 1)}`}
            />
          ),
      },
      {
        field: "ga4_sessions",
        headerName: "GA4",
        width: 118,
        type: "rightAligned",
        getQuickFilterText: () => "",
        cellRenderer: ({ data }: { data?: ScoredItem }) =>
          data && (
            <Stacked
              top={
                <>
                  <b className="font-medium">{fmtInt(data.ga4_sessions)}</b> sesji
                </>
              }
              bottom={`zaangaż. ${fmtPct(data.engagement_rate)}`}
            />
          ),
      },
      {
        field: "state",
        headerName: "Status",
        width: 168,
        getQuickFilterText: ({ value }) => STATE[value as string],
        cellRenderer: ({ data }: { data?: ScoredItem }) =>
          data && (
            <Stacked
              top={
                <span
                  className={cn(
                    "rounded px-2 py-0.5 text-theme-xs font-medium",
                    data.state === "not-indexed" ? "bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400" : "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400",
                  )}
                >
                  {STATE[data.state]}
                </span>
              }
              bottom={`bez zmian ${ageBuckets.find((b) => b.key === data.age_bucket)?.range ?? ""}${data.state === "measured" ? (data.weak_traffic ? " · słabe wyniki" : " · dobre wyniki") : ""}`}
            />
          ),
      },
    ],
    [editorBase, ageBuckets],
  );

  const kpi = (dim: Dim, value: string, props: React.ComponentProps<typeof StatCard>, tone?: string) => (
    <button
      type="button"
      onClick={() => toggle(dim, value, true)}
      aria-pressed={value !== "all" && active[dim] === value}
      className={cn(
        "h-full rounded-2xl text-left transition focus-visible:outline-none",
        value !== "all" && active[dim] === value ? "ring-2 ring-brand-500" : "hover:ring-1 hover:ring-brand-300 dark:hover:ring-brand-500/40",
      )}
    >
      <StatCard {...props} color={tone ? TONE[tone] : props.color} />
    </button>
  );

  return (
    <>
      <SectionHead title="Stan treści" meta="wiek od ostatniej realnej zmiany" />
      <StatGrid cols={5}>
        {kpi("age", "all", { label: "Wszystkie publikacje", value: items.length, emptyDeltaLabel: "baza wiedzy", hero: true })}
        {ageBuckets.map((b) => kpi("age", b.key, { label: b.label, value: byAge[b.key] ?? 0, emptyDeltaLabel: b.hint }, b.tone))}
      </StatGrid>

      <SectionHead
        title="Pilność odświeżenia"
        meta={`wyniki × wiek · słabe wyniki = kliknięcia i wyświetlenia z 30 dni poniżej mediany domeny (${fmtInt(medianClicks)} klik. / ${fmtInt(medianImpressions)} wyśw.)`}
      />
      <StatGrid cols={5}>
        {kpi("urgency", "critical", { label: "Krytyczny", value: byUrgency.critical ?? 0, emptyDeltaLabel: "słabe wyniki, ponad 12 mies." }, "err")}
        {kpi("urgency", "high", { label: "Wysoki", value: byUrgency.high ?? 0, emptyDeltaLabel: "słabe wyniki, 6–12 mies." }, "warn")}
        {kpi("urgency", "normal", { label: "Normalny", value: byUrgency.normal ?? 0, emptyDeltaLabel: "słabe wyniki, 3–6 mies." }, "mid")}
        {kpi("urgency", "low", { label: "Niski", value: byUrgency.low ?? 0, emptyDeltaLabel: "świeże lub z ruchem" }, "ok")}
        {kpi("state", "not-indexed", { label: "Poza indeksem", value: notIndexed, emptyDeltaLabel: "wymaga osobnej diagnozy" }, "muted")}
      </StatGrid>

      <div ref={tableRef} className="scroll-mt-24">
        <SectionHead
          title="Priorytety optymalizacji"
          meta={`pilność: wyniki względem wieku · wynik 0–100 ustala kolejność w obrębie pilności · okres ochronny ${fmtInt(minAgeDays)} dni`}
        />
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <Segmented
            label="Stan pomiaru"
            value={active.state}
            onChange={(v) => toggle("state", v)}
            options={[
              { value: "all", label: `Wszystkie · ${items.length}` },
              { value: "traffic", label: `Z ruchem · ${withTraffic}` },
              { value: "weak", label: `Słabe wyniki · ${weakCount}` },
              { value: "not-indexed", label: `Poza indeksem · ${notIndexed}` },
              { value: "no-data", label: `Bez pomiaru · ${noData}` },
            ]}
          />
          <label className="flex items-center gap-2 text-theme-sm text-gray-500 dark:text-gray-400">
            Filar
            <select
              value={pillar}
              onChange={(e) => setPillar(e.target.value)}
              className="h-10 rounded border border-gray-200 bg-white px-3 text-theme-sm text-gray-800 dark:border-gray-800 dark:bg-gray-900 dark:text-white/90"
            >
              <option value="all">Wszystkie</option>
              {pillars.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
        </div>
        <DataGrid<ScoredItem>
          title="Artykuły"
          rows={items}
          columns={columns}
          filter
          filterPlaceholder="Szukaj tytułu lub adresu…"
          externalFilter={filter}
          rowKey={(i) => i.id}
          rowHeight={60}
          csvName={`${domain}-content-watcher`}
          empty="Nie znaleziono artykułów w skonfigurowanej kolekcji."
        />
      </div>

      <DetailDialog item={detail} partTexts={partTexts} onClose={() => setDetail(null)} />
    </>
  );
}

function DetailDialog({ item, partTexts, onClose }: { item: ScoredItem | null; partTexts: Record<string, PartText>; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (item && !ref.current?.open) ref.current?.showModal();
    if (!item && ref.current?.open) ref.current.close();
  }, [item]);

  const date = (v: string | null) => (v ? fmtDate(v) : "–");
  const facts: [string, React.ReactNode][] = item
    ? [
        ["Publikacja", date(item.published_at)],
        ["Aktualizacja", date(item.updated_at)],
        ["Wiek treści", `${fmtInt(item.age_days)} dni`],
        ["Indeksacja", item.indexed === null ? "brak pomiaru" : item.indexed ? `tak · crawl ${date(item.last_crawl)}` : "nie"],
        ["GSC", `${fmtInt(item.clicks ?? 0)} klik. · ${fmtInt(item.impressions ?? 0)} wyśw. · CTR ${fmtPct(item.ctr)}`],
        [
          "Zmiana 90 dni",
          item.clicks_delta === null
            ? "brak porównania"
            : `${item.clicks_delta > 0 ? "+" : ""}${fmtInt(item.clicks_delta)} klik. · pozycja ${item.position_delta === null ? "–" : `${item.position_delta > 0 ? "+" : ""}${fmtNum(item.position_delta, 1)}`}`,
        ],
        ["GA4", item.ga4_sessions === null ? "brak danych" : `${fmtInt(item.ga4_sessions)} sesji · zaangażowanie ${fmtPct(item.engagement_rate)}`],
        [
          "Senuto",
          item.senuto_position === null
            ? "brak dopasowanych fraz"
            : `poz. ${fmtNum(item.senuto_position, 1)} · ${fmtInt(item.senuto_keywords ?? 0)} fraz · ${fmtInt(item.senuto_top10 ?? 0)} TOP 10`,
        ],
        ["Struktura", `${fmtInt(item.word_count)} słów · ${fmtInt(item.headings)} nagłówków · ${fmtInt(item.internal_links)} linków wewn. · ${fmtInt(item.external_links)} zewn.`],
        ["Plik", <code key="p" className="text-theme-xs break-all">{item.content_path}</code>],
      ]
    : [];
  const rest = item ? (item.senuto_keywords ?? 0) - item.senuto_top_keywords.length : 0;

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-auto max-h-[calc(100vh-32px)] w-[min(1000px,calc(100vw-32px))] rounded-lg border border-gray-200 bg-white p-0 text-gray-800 backdrop:bg-gray-950/70 dark:border-gray-800 dark:bg-gray-900 dark:text-white/90"
    >
      {item && (
        <>
          <header className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5 dark:border-gray-800">
            <div className="min-w-0">
              <p className="text-theme-xs text-brand-600 dark:text-brand-400">{item.pillar}</p>
              <h2 className="mt-1 text-xl font-medium">{item.title}</h2>
              <a href={item.url} target="_blank" rel="noopener" className="text-theme-sm text-gray-500 hover:text-brand-600 dark:text-gray-400">
                {item.path}
              </a>
            </div>
            <button type="button" onClick={onClose} aria-label="Zamknij" className="flex size-9 shrink-0 items-center justify-center rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5">
              <X className="size-5" />
            </button>
          </header>
          <div className="grid gap-7 overflow-y-auto p-6 lg:grid-cols-[1.45fr_1fr]">
            <section>
              <h3 className="mb-3 text-theme-sm font-medium text-gray-500 dark:text-gray-400">Wyniki</h3>
              <dl className="grid gap-2 sm:grid-cols-2">
                {facts.map(([k, v]) => (
                  <div key={k} className="rounded bg-gray-50 px-3 py-2.5 dark:bg-white/3">
                    <dt className="text-theme-xs text-gray-500 dark:text-gray-400">{k}</dt>
                    <dd className="mt-1 text-theme-sm break-words">{v}</dd>
                  </div>
                ))}
              </dl>
              <h3 className="mt-6 mb-3 text-theme-sm font-medium text-gray-500 dark:text-gray-400">Dlaczego taki priorytet?</h3>
              <ul className="list-disc space-y-1 pl-5 text-theme-sm text-gray-600 dark:text-gray-300">
                {(item.reasons.length ? item.reasons : ["Brak wyraźnych wskazań do ponownej optymalizacji."]).map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
              <h3 className="mt-6 mb-3 text-theme-sm font-medium text-gray-500 dark:text-gray-400">Widoczność na frazy</h3>
              {item.senuto_top_keywords.length ? (
                <ul className="flex flex-col gap-px">
                  {item.senuto_top_keywords.map((k) => (
                    <li key={k.keyword} className="grid grid-cols-[1fr_auto_auto] items-baseline gap-3 bg-gray-50 px-3 py-2 text-theme-sm dark:bg-white/3">
                      <span className="truncate">{k.keyword}</span>
                      <b className={cn("text-theme-xs font-medium", k.position >= 11 && k.position <= 30 ? "text-orange-600 dark:text-orange-400" : "text-gray-500")}>
                        poz. {fmtNum(k.position, 1)}
                      </b>
                      <small className="min-w-24 text-right text-theme-xs text-gray-500">
                        {k.searches === null ? "brak wolumenu" : `${fmtInt(k.searches)} wysz./mies.`}
                      </small>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-theme-sm text-gray-500">Senuto nie widzi tego adresu w wynikach wyszukiwania.</p>
              )}
              {rest > 0 && <p className="mt-2 text-theme-xs text-gray-500">+ {fmtInt(rest)} kolejnych fraz w Senuto</p>}
            </section>
            <aside>
              <p className="flex items-baseline gap-1.5">
                <b className="text-title-lg font-medium">{item.score}</b>
                <span className="text-gray-500">/ 100</span>
              </p>
              <p className="mt-1 border-b border-gray-100 pb-4 text-theme-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
                Suma czterech składowych. Mianownik jest stały – brak danych w źródle nie podnosi wyniku, tylko odbiera jego maksimum.
              </p>
              <ul className="mt-4 flex flex-col gap-4">
                {item.parts.map((part) => {
                  const text = partTexts[part.key] ?? { label: part.key, hint: "", formula: "" };
                  return (
                    <li key={part.key} className={cn("text-theme-sm", !part.available && "opacity-50")} title={text.formula}>
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="font-medium">{text.label}</span>
                        <span className="text-theme-xs text-gray-500">{part.available ? `${fmtNum(part.points, 1)} / ${part.max} pkt` : "brak danych"}</span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-white/5">
                        <i className="block h-full rounded-full bg-brand-500" style={{ width: `${part.available ? Math.round((part.points / part.max) * 100) : 0}%` }} />
                      </div>
                      <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">{text.hint}</p>
                    </li>
                  );
                })}
              </ul>
            </aside>
          </div>
        </>
      )}
    </dialog>
  );
}
