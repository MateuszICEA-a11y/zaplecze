/* Microsoft Clarity – port dashboard/app/src/pages/[domain]/clarity.astro:
   zachowania użytkowników z 3 dni, scroll, zaangażowanie, sygnały frustracji,
   strony / źródła i urządzenia. Gdy API zwraca limit (429), widok trzyma
   ostatni udany pomiar z datą. */
import BarList from "@/components/BarList";
import { Card, EmptyState, Note, PageTitle, SectionHead, SourceState, StatCard, StatGrid } from "@/components/ui";
import { cn } from "@/lib/cn";
import {
  isTemporarySourceFailure,
  latestSnapshot,
  latestWithDelta,
  loadDetails,
  loadSnapshots,
  sourceStatuses,
} from "@/lib/data";
import { fmtDate, fmtDuration, fmtInt, fmtNum } from "@/lib/format";
import { lastOk } from "@/lib/metrics";
import { domainParams, titleFor, type DomainProps } from "@/lib/pages";
import { C } from "@/lib/palette";
import { CircleMinus, Rewind, TriangleAlert, Zap } from "lucide-react";
import ClarityTables from "./ClarityTables";

export const dynamicParams = false;
export const generateStaticParams = () => domainParams("clarity");
export const generateMetadata = titleFor("Clarity");

const num = (v: unknown): number | null => (v == null || v === "" || isNaN(Number(v)) ? null : Number(v));
const DEVICE_COLORS = ["bg-brand-500", "bg-brand-300", "bg-orange-500", "bg-gray-400"];

export default async function ClarityPage({ params }: DomainProps) {
  const { domain } = await params;
  const snapshots = loadSnapshots(domain);
  const latest = latestSnapshot(domain);
  const details = loadDetails(domain).sources.clarity;
  const clarity = sourceStatuses(latest).clarity;
  const configured = clarity != null && clarity.status !== "not_configured";
  const lastGood = lastOk(snapshots, "clarity");
  const isDown = configured && isTemporarySourceFailure(clarity);
  const staleDate = isDown && lastGood ? fmtDate(lastGood.date) : null;
  const measured = lastGood ? `pomiar ${fmtDate(lastGood.date)}` : "brak historii porównawczej";
  const okData = (lastGood?.data ?? {}) as Record<string, number>;

  const statSessions = latestWithDelta(snapshots, "clarity", "sessions");
  const statUsers = latestWithDelta(snapshots, "clarity", "users");
  const statScroll = latestWithDelta(snapshots, "clarity", "scroll_depth_avg");

  /* EngagementTime z Data Export API to już średnie na sesję (sekundy). */
  const active = okData.engagement_active_s ?? null;
  const totalTime = okData.engagement_total_s ?? null;
  const pagesPerSession = okData.pages_per_session ?? null;
  const activeShare =
    typeof active === "number" && typeof totalTime === "number" && totalTime > 0
      ? Math.round((active / totalTime) * 100)
      : null;

  const sessions = typeof statSessions.value === "number" ? statSessions.value : null;
  const rateOf = (v: number) => (sessions ? `${fmtNum((v / sessions) * 100, 1)}% sesji` : null);
  const frustration = [
    { label: "Rage clicks", value: num(details?.rage_clicks), desc: "wielokrotne kliknięcia w to samo miejsce", Icon: Zap },
    { label: "Dead clicks", value: num(details?.dead_clicks), desc: "kliknięcia w element bez reakcji", Icon: CircleMinus },
    { label: "Quick backs", value: num(details?.quickback_clicks), desc: "szybki powrót po wejściu na stronę", Icon: Rewind },
  ].filter((f): f is typeof f & { value: number } => f.value != null);
  const scriptErrors = num(details?.script_errors);

  /* Stare dane mogły mieć „?" zamiast etykiet (nieobsługiwany wymiar) – pomijamy. */
  const named = (row: { name: string }) => Boolean(row.name && row.name.trim() !== "?");
  const urlRows = (details?.url ?? []).filter(named);
  const refRows = (details?.referrer ?? [])
    .filter(named)
    .map((row) => ({ ...row, name: row.name.trim() || "Wejście bezpośrednie" }));

  const deviceRows = details?.device ?? [];
  const devTotal = deviceRows.reduce((sum, r) => sum + (r.sessions ?? 0), 0);
  const devices = deviceRows.slice(0, 4).map((r, i) => ({
    label: r.name,
    value: r.sessions ?? 0,
    color: DEVICE_COLORS[i],
    pct: devTotal ? Math.round(((r.sessions ?? 0) / devTotal) * 100) : 0,
  }));

  const ghost = isDown ? "opacity-70" : "";

  return (
    <>
      <PageTitle title="Microsoft Clarity" meta={`Zachowania użytkowników · okno: ostatnie 3 dni${staleDate ? ` · dane z ${staleDate}` : ""}`} />
      {configured && (
        <SourceState
          name="Clarity"
          status={clarity?.status}
          error={clarity?.error}
          temporary={isTemporarySourceFailure(clarity)}
          lastDate={lastGood?.date}
        />
      )}
      <Note>
        Clarity mierzy średnią głębokość przewijania, czas aktywności, liczbę stron w sesji i oznaki frustracji. Gdy API
        zgłosi limit zapytań (429), widok zachowuje ostatni udany pomiar i podaje jego datę.
      </Note>

      {!configured ? (
        <div className="mt-6">
          <EmptyState title="Clarity czeka na token Data Export API">
            Wygeneruj token w panelu Clarity (Settings → Data Export) i dodaj go w GitHub Secrets jako CLARITY_API_TOKEN.
            Sekcja zapełni się po najbliższym przebiegu collectora.
          </EmptyState>
        </div>
      ) : (
        <>
          <SectionHead title="Zachowania użytkowników" />
          <div className={ghost}>
            <StatGrid cols={5}>
              <StatCard label="Sesje" value={statSessions.value} delta={isDown ? null : statSessions.delta} emptyDeltaLabel={measured} color={C.brand} staleDate={staleDate} />
              <StatCard label="Użytkownicy" value={statUsers.value} delta={isDown ? null : statUsers.delta} emptyDeltaLabel={measured} staleDate={staleDate} />
              <StatCard label="Śr. scroll depth" value={statScroll.value} delta={isDown ? null : statScroll.delta} emptyDeltaLabel={measured} unit="%" precision={1} staleDate={staleDate} />
              <StatCard label="Aktywny czas / sesja" value={typeof active === "number" ? fmtDuration(active) : null} emptyDeltaLabel={measured} staleDate={staleDate} />
              <StatCard label="Strony / sesja" value={typeof pagesPerSession === "number" ? fmtNum(pagesPerSession, 1) : null} emptyDeltaLabel={measured} staleDate={staleDate} />
            </StatGrid>
          </div>

          <SectionHead title="Uwaga i zaangażowanie" />
          <div className={cn("grid grid-cols-1 gap-4 md:gap-5 xl:grid-cols-2", ghost)}>
            <Card className="p-5">
              <h3 className="text-base font-medium text-gray-800 dark:text-white/90">Głębokość scrolla</h3>
              <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">średnia z Data Export API</p>
              <div className="mt-5 flex items-center gap-5">
                <span className="text-title-md font-medium text-gray-800 tabular-nums dark:text-white/90">
                  {typeof statScroll.value === "number" ? `${fmtNum(statScroll.value, 0)}%` : "–"}
                </span>
                <span className="h-3 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-white/5">
                  <i
                    className="block h-full rounded-full bg-brand-500"
                    style={{ width: `${Math.min(100, Math.max(0, statScroll.value ?? 0))}%` }}
                  />
                </span>
              </div>
            </Card>
            <Card className="p-5">
              <h3 className="text-base font-medium text-gray-800 dark:text-white/90">Zaangażowanie</h3>
              <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">czas i aktywność w sesji</p>
              <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {(
                  [
                    ["Aktywny czas / sesja", fmtDuration(active)],
                    ["Całkowity czas / sesja", fmtDuration(totalTime)],
                    ["Strony / sesja", typeof pagesPerSession === "number" ? fmtNum(pagesPerSession, 1) : "–"],
                    ["Czas aktywny", activeShare !== null ? `${activeShare}%` : "–"],
                  ] as const
                ).map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-theme-xs text-gray-500 dark:text-gray-400">{label}</dt>
                    <dd className="mt-1 text-xl font-medium text-gray-800 tabular-nums dark:text-white/90">{value}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          </div>

          {frustration.length > 0 && (
            <>
              <SectionHead title="Sygnały frustracji" meta="gdzie użytkownicy się gubią">
                {typeof scriptErrors === "number" && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-theme-sm",
                      scriptErrors > 0
                        ? "bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400"
                        : "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400",
                    )}
                  >
                    {scriptErrors > 0 && <TriangleAlert className="size-3.5" />}
                    Błędy JS <b className="font-medium">{fmtInt(scriptErrors)}</b>
                  </span>
                )}
              </SectionHead>
              <div className={cn("grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5", ghost)}>
                {frustration.map(({ label, value, desc, Icon }) => (
                  <Card key={label} className="p-5">
                    <div className="flex items-center gap-3">
                      <span className="flex size-10 items-center justify-center rounded bg-orange-50 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400">
                        <Icon className="size-5" />
                      </span>
                      <span className="text-theme-sm font-medium text-gray-600 dark:text-gray-300">{label}</span>
                    </div>
                    <p className="mt-4 text-title-sm font-medium text-gray-800 tabular-nums dark:text-white/90">{fmtInt(value)}</p>
                    <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
                      {rateOf(value) && <b className="font-medium text-gray-800 dark:text-white/90">{rateOf(value)} · </b>}
                      {desc}
                    </p>
                  </Card>
                ))}
              </div>
            </>
          )}

          <SectionHead title="Strony i źródła" meta={staleDate ? `dane z ${staleDate}` : undefined} />
          <div className={ghost}>
            <ClarityTables
              domain={domain}
              urls={urlRows}
              referrers={refRows}
              urlsEmpty={
                (details?.url?.length ?? 0) > 0 && urlRows.length === 0
                  ? "Poprzedni odczyt nie zawierał etykiet URL. Poprawiony collector uzupełni je przy następnym pomiarze."
                  : "Brak danych w tym oknie."
              }
            />
          </div>

          {devices.length > 0 && (
            <>
              <SectionHead title="Urządzenia" meta="udział w sesjach" />
              <Card className={cn("p-5", ghost)}>
                <div className="mb-5 flex h-3 overflow-hidden rounded-full bg-gray-100 dark:bg-white/5">
                  {devices.map((d) => (
                    <i key={d.label} className={cn("block h-full", d.color)} style={{ width: `${d.pct}%` }} />
                  ))}
                </div>
                <BarList
                  items={devices.map((d) => ({
                    label: (
                      <span className="flex items-center gap-2">
                        <span className={cn("size-2 rounded-full", d.color)} />
                        {d.label}
                      </span>
                    ),
                    value: d.value,
                    color: d.color,
                    suffix: <span className="ms-2 font-normal text-gray-500">{d.pct}%</span>,
                  }))}
                  labelWidth="w-32"
                />
              </Card>
            </>
          )}
        </>
      )}
    </>
  );
}
