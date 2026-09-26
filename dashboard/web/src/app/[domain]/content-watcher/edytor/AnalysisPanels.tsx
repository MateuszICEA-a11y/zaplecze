"use client";

/* Rozpoznanie przed pipeline'em: kto stoi w wynikach Google (SERP) i co mają
   w tekstach konkurenci (Jina Reader + model). Obie analizy idą krokami po
   stronie Workera – każde żądanie przesuwa je o etap, więc ponawiamy POST,
   aż wróci `done`. Shift przy kliknięciu wymusza świeży przejazd. */
import DataGrid from "@/components/grid/DataGrid";
import { btn, btnSmall, inlineLink, Status, type Tone } from "@/components/kit";
import { Card } from "@/components/ui";
import { cn } from "@/lib/cn";
import { editorStore, useEditor } from "@/lib/cw-editor/store";
import type { Entry, RivalsAnalysis, SerpAnalysis } from "@/lib/cw-editor/types";
import { api, sleep } from "@/lib/writer-client";
import type { ColDef } from "ag-grid-community";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

const pl = new Intl.NumberFormat("pl-PL");
const fmt = (value: number) => pl.format(value);
const stampOf = (iso: string | null | undefined) => (iso ? `sprawdzone ${new Date(iso).toLocaleString("pl-PL")}` : "");
const errorText = (error: unknown, fallback: string) => (error instanceof Error ? error.message : fallback);

/** Limit kroków analizy – przy ~3 s na krok to dwie minuty z okładem. */
const MAX_STEPS = 40;

/* Stan zwinięcia: po zakończonym przebiegu analizy zrobiły swoje – zwijamy
   je, żeby droga do dokumentu była krótka. Ręczny wybór ma pierwszeństwo. */
function useFold() {
  const { job } = useEditor();
  const [touched, setTouched] = useState<boolean | null>(null);
  const folded = touched ?? job?.status === "done";
  return [folded, () => setTouched(!folded)] as const;
}

function PanelHead({
  title,
  lead,
  stamp,
  folded,
  onFold,
  children,
}: {
  title: string;
  lead: string;
  stamp: string;
  folded: boolean;
  onFold: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="max-w-3xl min-w-0">
        <h2 className="text-lg font-medium text-gray-800 dark:text-white/90">{title}</h2>
        <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">{lead}</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {stamp && <span className="text-theme-xs text-gray-500 dark:text-gray-400">{stamp}</span>}
        {children}
        <button type="button" className={btnSmall} onClick={onFold} title="Zwiń / rozwiń sekcję" aria-expanded={!folded}>
          {folded ? "rozwiń" : "zwiń"}
        </button>
      </div>
    </div>
  );
}

const ErrorLine = ({ text }: { text: string | null }) =>
  text ? <p className="mt-3 text-theme-sm text-error-600 dark:text-error-400">{text}</p> : null;

/* ---------- SERP: kto zajmuje temat ---------- */

const GAP_STATE: Record<string, { label: string; tone: Tone }> = {
  missing: { label: "nie mamy", tone: "err" },
  weak: { label: "poza TOP 10", tone: "warn" },
  covered: { label: "mamy", tone: "ok" },
};
const QUERY_LABEL: Record<string, string> = {
  title: "Temat wpisu (z tytułu)",
  own: "Nasza najlepsza fraza dziś",
};
const SERP_STAGE: Record<string, string> = {
  serp_title: "sprawdzam, kto zajmuje temat…",
  serp_own: "sprawdzam naszą frazę…",
  keywords: "pobieram frazy konkurencji…",
};

type GapRow = SerpAnalysis["gap"][number];

export function SerpPanel({ domain, entry }: { domain: string; entry: Entry }) {
  const { serp } = useEditor();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [folded, toggleFold] = useFold();
  const url = `/api/cw/serp/${domain}/${entry.post_id}`;
  // Nasze frazy z pozycjami są już w katalogu (dane collectora) – wysyłamy je
  // zamiast płacić Senuto za drugie pobranie tego samego.
  const body = { title: entry.title, url: entry.url, own_keywords: entry.senuto_keywords ?? [] };

  /* Jedno zapytanie SerpData idzie ~20 s, a Worker ma ograniczony czas życia,
     więc analiza jest podzielona na etapy – ponawiamy, aż wróci `done`. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const follow = async (first: any) => {
    let data = first;
    for (let attempt = 0; data.status === "running"; attempt++) {
      if (attempt > MAX_STEPS) {
        setError("Analiza SERP trwa dłużej niż zwykle. Kliknij „Sprawdź SERP”, aby dokończyć.");
        return;
      }
      setBusy(SERP_STAGE[data.stage] ?? "sprawdzam SERP…");
      await sleep(3000);
      ({ data } = await api(url, { method: "POST", body }));
    }
    if (data.status === "error") {
      setError(data.error ?? "Analiza SERP nie powiodła się.");
      return;
    }
    editorStore.set({ serp: data.analysis ?? null });
  };

  const run = async (force: boolean) => {
    setError(null);
    setBusy("sprawdzam SERP…");
    try {
      const { data } = await api(`${url}${force ? "?force=1" : ""}`, { method: "POST", body });
      await follow(data);
    } catch (e) {
      setError(errorText(e, "Nie udało się sprawdzić SERP-a."));
    } finally {
      setBusy(null);
    }
  };

  const loaded = useRef(false);
  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    (async () => {
      try {
        const { data } = await api(url);
        if (data.status === "running") {
          setBusy("sprawdzam SERP…");
          try {
            await follow(data);
          } catch (e) {
            setError(errorText(e, "Nie udało się odczytać wyniku analizy."));
          } finally {
            setBusy(null);
          }
          return;
        }
        if (data.status === "error") setError(data.error ?? "Poprzednia analiza SERP zakończyła się błędem.");
        editorStore.set({ serp: data.analysis ?? null });
      } catch {
        // Brak zapisanej analizy nie jest błędem – przycisk i tak czeka.
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="mb-6">
      <PanelHead
        title="Konkurencja w wynikach wyszukiwania"
        lead="Dwa zapytania do Google – tytuł wpisu i nasza najlepsza fraza. Widać, kto stoi w czołówce i na której pozycji jesteśmy my."
        stamp={serp ? stampOf(serp.cached_at ?? serp.generated_at) : ""}
        folded={folded}
        onFold={toggleFold}
      >
        <button type="button" className={btn} disabled={Boolean(busy)} onClick={(e) => run(e.shiftKey)} title="Shift + klik – świeży przejazd mimo zapisanego wyniku">
          {busy && <Loader2 className="size-4 animate-spin" />}
          {busy ?? "Sprawdź SERP"}
        </button>
      </PanelHead>
      <ErrorLine text={error} />
      {serp && !folded && <SerpResult analysis={serp} />}
    </section>
  );
}

function SerpResult({ analysis }: { analysis: SerpAnalysis }) {
  const summary = analysis.gap_summary;
  const skipped = analysis.keywords_skipped_home ?? 0;
  const maxSearches = Math.max(...analysis.gap.map((row) => row.searches ?? 0), 1);
  const columns = useMemo<ColDef<GapRow>[]>(
    () => [
      { field: "keyword", headerName: "Fraza", flex: 1, minWidth: 200, cellClass: "font-medium" },
      {
        headerName: "Poz. konkurenta",
        colId: "rival",
        width: 210,
        valueGetter: ({ data }) => (data?.rival_position == null ? "–" : `${fmt(data.rival_position)}${data.rival_host ? ` · ${data.rival_host}` : ""}`),
      },
      {
        field: "searches",
        headerName: "Wyszukiwań / mies.",
        width: 180,
        type: "rightAligned",
        cellRenderer: ({ value }: { value: number | null }) =>
          value === null ? (
            "–"
          ) : (
            <span className="inline-flex w-full items-center justify-end gap-3 tabular-nums">
              {fmt(value)}
              <span className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-100 dark:bg-white/5">
                <i className="block h-full rounded-full bg-brand-500" style={{ width: `${Math.round((value / maxSearches) * 100)}%` }} />
              </span>
            </span>
          ),
      },
      {
        field: "our_position",
        headerName: "Nasza pozycja",
        width: 140,
        type: "rightAligned",
        valueFormatter: ({ value }) => (value === null || value === undefined ? "brak" : `poz. ${fmt(value)}`),
      },
      {
        field: "status",
        headerName: "Status",
        width: 130,
        cellRenderer: ({ value }: { value: string }) => <Status tone={GAP_STATE[value]?.tone ?? "idle"}>{GAP_STATE[value]?.label ?? value}</Status>,
      },
    ],
    [maxSearches],
  );

  return (
    <div className="mt-4 flex flex-col gap-4">
      {/* Dwa zapytania obok siebie – rozjazd między nimi widać dopiero
          w zestawieniu, nie na liście jedna pod drugą. */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {analysis.queries.map((query) => {
          // Nasz wynik wchodzi na listę razem z konkurentami, we właściwej
          // kolejności – inaczej nie widać, czy jesteśmy nad nimi, czy pod nimi.
          const rows = [...query.competitors.map((row) => ({ ...row, ours: false }))];
          if (query.ours) rows.push({ ...query.ours, ours: true });
          rows.sort((a, b) => (a.position ?? 99) - (b.position ?? 99));
          return (
            <Card key={query.kind} className="p-5">
              <p className="text-theme-xs text-gray-500 dark:text-gray-400">{QUERY_LABEL[query.kind] ?? query.kind}</p>
              <p className="mt-0.5 text-base font-medium text-gray-800 dark:text-white/90">{query.keyword}</p>
              <ol className="mt-3 divide-y divide-gray-100 dark:divide-gray-800">
                {rows.map((row) => (
                  <li key={`${row.position}-${row.url}`} className={cn("grid grid-cols-[28px_minmax(0,1fr)] gap-3 py-2", row.ours && "-mx-2 rounded bg-brand-25 px-2 dark:bg-brand-500/6")}>
                    <span className="text-theme-sm font-medium text-gray-500 tabular-nums">{row.position}</span>
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-2">
                        <a className={cn(inlineLink, "truncate text-theme-sm")} href={row.url} target="_blank" rel="noopener">
                          {row.host}
                        </a>
                        {row.ours && <Status tone="mid">nasz wpis</Status>}
                      </span>
                      {row.title && <span className="block truncate text-theme-xs text-gray-500 dark:text-gray-400">{row.title}</span>}
                    </span>
                  </li>
                ))}
                {!query.ours && (
                  <li className="py-2 text-theme-sm text-gray-500 italic">
                    {query.results_checked ? `nas nie ma w ${query.results_checked} sprawdzonych wynikach` : "naszego adresu nie ma w wynikach"}
                  </li>
                )}
                {!query.competitors.length && <li className="py-2 text-theme-sm text-gray-500 italic">brak wyników organicznych</li>}
              </ol>
            </Card>
          );
        })}
      </div>

      {/* Rozjazd to sedno tej analizy: konkurenci odpowiadają na temat wpisu,
          a my jesteśmy widoczni obok – na frazę, przy której ich nie ma. */}
      {analysis.drift.length > 0 && (
        <p className="rounded-xl border border-warning-200 bg-warning-50 px-4 py-3 text-theme-sm text-warning-800 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-warning-300">
          Mijamy się z tematem: {analysis.drift.join(", ")} {analysis.drift.length === 1 ? "odpowiada" : "odpowiadają"} na temat wpisu, ale nie{" "}
          {analysis.drift.length === 1 ? "pojawia" : "pojawiają"} się w wynikach dla naszej dzisiejszej frazy.
        </p>
      )}

      {/* Bez fraz konkurentów cztery zera obok „X fraz naszego wpisu" czytają
          się jak wynik analizy, a to zwykły brak danych w Senuto. */}
      <div className={cn("grid grid-cols-2 gap-3", summary.total ? "md:grid-cols-5" : "md:grid-cols-1 md:max-w-xs")}>
        {summary.total > 0 && (
          <>
            <Tile value={summary.total} label="trafnych fraz konkurentów" />
            <Tile value={summary.missing} label="nie mamy wcale" tone="low" />
            <Tile value={summary.weak} label="poza TOP 10" tone="mid" />
            <Tile value={summary.covered} label="mamy w TOP 10" tone="ok" />
          </>
        )}
        <Tile value={analysis.own_keywords_total} label="fraz, na które wpis jest widoczny" />
      </div>

      {analysis.gap.length ? (
        // Pełna lista potrafi mieć setki wierszy – siatka dzieli ją na strony.
        <DataGrid<GapRow>
          title="Frazy konkurentów"
          meta="kolejność jak w analizie – od pozycji, na której fraza obroniła się u rywala"
          rows={analysis.gap}
          columns={columns}
          rowKey={(row) => row.keyword}
          filter
          filterPlaceholder="Szukaj frazy…"
        />
      ) : (
        // Senuto zna tylko domeny ze swojej bazy widoczności – przy niszowych
        // konkurentach lista fraz bywa pusta i trzeba to powiedzieć wprost.
        <p className="text-theme-sm text-gray-500 dark:text-gray-400">
          {skipped && !(analysis.keywords_scanned ?? 0)
            ? `W czołówce stoją same strony główne (${skipped}) – rankują na cały biznes serwisu, nie na temat wpisu, więc ich fraz nie zbieramy. Zostaje lista wyników i rozjazd tematu.`
            : "Senuto nie zna fraz w TOP 20 dla podstron tych konkurentów, więc porównania fraz nie ma – zostaje lista wyników i rozjazd tematu. Dane o naszych frazach pochodzą z dziennego odczytu Senuto."}
        </p>
      )}
    </div>
  );
}

function Tile({ value, label, tone = "" }: { value: number; label: string; tone?: "" | "ok" | "mid" | "low" }) {
  return (
    <Card className="p-4">
      <p
        className={cn(
          "text-title-sm font-medium tabular-nums",
          tone === "ok" ? "text-success-600" : tone === "mid" ? "text-warning-600" : tone === "low" ? "text-error-600" : "text-gray-800 dark:text-white/90",
        )}
      >
        {fmt(value)}
      </p>
      <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">{label}</p>
    </Card>
  );
}

/* ---------- treść konkurencji (Jina Reader + model) ---------- */

const KIND_LABEL: Record<string, string> = {
  liczba: "liczba",
  definicja: "definicja",
  procedura: "procedura",
  przykład: "przykład",
  narzędzie: "narzędzie",
  ryzyko: "ryzyko",
};

/** Konkurenci z SERP-u tematu – to oni zajmują miejsce, o które gramy. */
function rivalUrls(serp: SerpAnalysis | null): string[] {
  const query = serp?.queries?.find((row) => row.kind === "title") ?? serp?.queries?.[0];
  return (query?.competitors ?? []).map((row) => row.url).filter(Boolean);
}

/** Model pisania z konfiguracji przebiegu (pole w belce pipeline'u – do
    czasu jej przepisania czytane wprost z DOM-u). */
const writerModel = () => document.querySelector<HTMLInputElement>("[data-ed-model-writer]")?.value.trim() || undefined;

export function RivalsPanel({ domain, entry }: { domain: string; entry: Entry }) {
  const { serp, rivals } = useEditor();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [folded, toggleFold] = useFold();
  const url = `/api/cw/rivals/${domain}/${entry.post_id}`;
  const urls = rivalUrls(serp);
  const body = () => ({ our_url: entry.url, rivals: rivalUrls(editorStore.get().serp), model: writerModel() });

  /* Każde żądanie przesuwa analizę o jeden krok (pobranie strony trwa
     kilkanaście sekund), więc ponawiamy aż do `done` – jak przy SERP-ie. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const follow = async (first: any) => {
    let data = first;
    for (let attempt = 0; data.status === "running"; attempt++) {
      if (attempt > MAX_STEPS) {
        setError("Pobieranie trwa dłużej niż zwykle. Kliknij „Pobierz treści konkurentów”, aby dokończyć.");
        return;
      }
      setBusy(data.stage_label ?? "pobieram treści…");
      await sleep(3000);
      ({ data } = await api(url, { method: "POST", body: body() }));
    }
    if (data.status === "error") {
      setError(data.error ?? "Odczyt nie powiódł się.");
      return;
    }
    editorStore.set({ rivals: data.analysis ?? null });
  };

  const run = async (force: boolean) => {
    if (!urls.length) {
      setError("Najpierw sprawdź SERP – stamtąd biorą się adresy konkurentów.");
      return;
    }
    setError(null);
    setBusy("pobieram treści…");
    try {
      const { data } = await api(`${url}${force ? "?force=1" : ""}`, { method: "POST", body: body() });
      await follow(data);
    } catch (e) {
      setError(errorText(e, "Nie udało się przeczytać stron konkurencji."));
    } finally {
      setBusy(null);
    }
  };

  const loaded = useRef(false);
  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    (async () => {
      try {
        const { data } = await api(url);
        if (data.status === "running") {
          setBusy(data.stage_label ?? "pobieram treści…");
          try {
            await follow(data);
          } catch (e) {
            setError(errorText(e, "Nie udało się odczytać wyniku."));
          } finally {
            setBusy(null);
          }
          return;
        }
        if (data.status === "error") setError(data.error ?? "Poprzedni odczyt zakończył się błędem.");
        editorStore.set({ rivals: data.analysis ?? null });
      } catch {
        /* brak zapisanego odczytu nie jest błędem */
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="mb-6">
      <PanelHead
        title="Co mają konkurenci"
        lead="Czytamy pięć tekstów z czołówki i nasz wpis, porównujemy długość i wypisujemy konkrety, których u nas brakuje."
        stamp={stampOf(rivals?.generated_at)}
        folded={folded}
        onFold={toggleFold}
      >
        <button
          type="button"
          className={btn}
          disabled={Boolean(busy) || !urls.length}
          onClick={(e) => run(e.shiftKey)}
          title={urls.length ? "Shift + klik – świeży odczyt mimo zapisanego wyniku" : "Najpierw sprawdź SERP"}
        >
          {busy && <Loader2 className="size-4 animate-spin" />}
          {busy ?? "Pobierz treści konkurentów"}
        </button>
      </PanelHead>
      <ErrorLine text={error} />
      {rivals && !folded && <RivalsResult analysis={rivals} />}
    </section>
  );
}

/** Długość tekstu wobec mediany czołówki: < 60% za krótko, 60–85% krócej, dalej w normie. */
const lengthBar = (words: number, median: number | null) =>
  !median ? "bg-brand-500" : words / median < 0.6 ? "bg-error-500" : words / median < 0.85 ? "bg-warning-500" : "bg-success-500";

function RivalsResult({ analysis }: { analysis: RivalsAnalysis }) {
  const median = analysis.median_words ?? null;
  const rows = [
    { key: "ours", label: "nasz wpis", words: analysis.our_words, note: "liczone tak samo jak u konkurencji", ours: true },
    ...(analysis.rivals ?? []).map((rival) => ({
      key: rival.url,
      label: rival.host || rival.url,
      words: rival.words,
      note: rival.error ? `nie udało się przeczytać: ${rival.error}` : (rival.title ?? ""),
      ours: false,
    })),
  ];
  const maxWords = Math.max(median ?? 0, ...rows.map((row) => row.words ?? 0), 1);
  const facts = analysis.facts ?? [];

  return (
    <div className="mt-4 flex flex-col gap-4">
      <Card className="p-5">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-base font-medium text-gray-800 dark:text-white/90">Długość tekstów</h3>
          {median && <span className="text-theme-xs text-gray-500">przeciętna u konkurencji: {fmt(median)} słów – cel objętości w ocenie treści</span>}
        </div>
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {rows.map((row) => (
            <li key={row.key} className={cn("grid grid-cols-1 items-center gap-x-4 gap-y-1 py-2.5 sm:grid-cols-[minmax(0,1fr)_220px]", row.ours && "-mx-2 rounded bg-brand-25 px-2 dark:bg-brand-500/6")}>
              <span className="min-w-0">
                <span className="block truncate text-theme-sm font-medium text-gray-800 dark:text-white/90">{row.label}</span>
                {row.note && <span className="block truncate text-theme-xs text-gray-500 dark:text-gray-400">{row.note}</span>}
              </span>
              <span className="text-theme-xs text-gray-500">
                {row.words === null ? (
                  "—"
                ) : (
                  <>
                    <span className="tabular-nums">{fmt(row.words)} słów</span>
                    <span className="relative mt-1 block h-1.5 rounded-full bg-gray-100 dark:bg-white/5">
                      <i className={cn("block h-full rounded-full", lengthBar(row.words, median))} style={{ width: `${Math.round((row.words / maxWords) * 100)}%` }} />
                      {median && <i className="absolute -top-0.5 h-2.5 w-0.5 bg-gray-800 dark:bg-white" style={{ left: `${Math.round((median / maxWords) * 100)}%` }} />}
                    </span>
                  </>
                )}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      {(analysis.topics?.length ?? 0) > 0 && (
        <p className="rounded-xl border border-warning-200 bg-warning-50 px-4 py-3 text-theme-sm text-warning-800 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-warning-300">
          Tematy, których nasz wpis w ogóle nie dotyka: {analysis.topics!.join(", ")}.
        </p>
      )}

      {facts.length > 0 ? (
        <Card className="p-5">
          <h3 className="text-base font-medium text-gray-800 dark:text-white/90">Konkrety, których u nas brakuje</h3>
          <p className="mb-4 text-theme-xs text-gray-500">
            Fakty pochodzą z cudzych stron – przed wklejeniem do wpisu zweryfikuj je u źródła.{analysis.model ? ` Model: ${analysis.model}.` : ""}
          </p>
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {facts.map((row, i) => (
              <li key={i} className="flex flex-col gap-2 rounded border-l-4 border-brand-500 bg-gray-50 p-4 text-theme-sm dark:bg-white/3">
                <p className="text-gray-800 dark:text-white/90">
                  {row.kind && (
                    <span className="mr-2 align-middle">
                      <Status tone="mid">{KIND_LABEL[row.kind] ?? row.kind}</Status>
                    </span>
                  )}
                  {row.fact}
                </p>
                {(row.why || /^https?:\/\//i.test(row.source ?? "")) && (
                  <p className="flex flex-wrap gap-x-3 text-theme-xs text-gray-500 dark:text-gray-400">
                    {row.why && <span>{row.why}</span>}
                    {/^https?:\/\//i.test(row.source ?? "") && (
                      <a className="hover:text-brand-600" href={row.source} target="_blank" rel="noopener nofollow">
                        źródło: {String(row.source).replace(/^https?:\/\/(www\.)?/, "").split("/")[0]}
                      </a>
                    )}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </Card>
      ) : (
        analysis.rivals?.some((row) => !row.error) && <p className="text-theme-sm text-gray-500">Model nie znalazł konkretów, których nie mielibyśmy w tekście.</p>
      )}
    </div>
  );
}
