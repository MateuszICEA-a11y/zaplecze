/* System i limity – port dashboard/app/src/pages/system.astro: salda usług
   (OpenRouter, SMSAPI, Senuto, SerpData), alerty, kwoty API i zdrowie
   pipeline'u collectora. */
import { Card, Note, PageTitle, SectionHead } from "@/components/ui";
import { cn } from "@/lib/cn";
import { latestSnapshot, loadConfig, loadSnapshots, type Snapshot, type SourceStatus } from "@/lib/data";
import { fmtInt, fmtNum } from "@/lib/format";
import type { Metadata } from "next";
import SystemUsage from "./SystemUsage";
import { Pill, type Tone } from "./Pill";

export const metadata: Metadata = { title: "System i limity" };

const RANK: Record<SourceStatus, number> = { ok: 0, not_configured: 1, token_expired: 2, error: 3 };
const toneOf = (status: SourceStatus | null): Tone =>
  status === "ok" ? "ok" : status === "token_expired" ? "warn" : status === "error" ? "err" : "off";
const list = (value: unknown): string[] =>
  typeof value === "string" ? [value] : Array.isArray(value) ? value.map(String).filter(Boolean) : [];

function shortDateTime(ts: string | undefined) {
  if (!ts) return "brak";
  const d = new Date(ts);
  const day = (x: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Warsaw" }).format(x);
  const time = d.toLocaleTimeString("pl-PL", { timeZone: "Europe/Warsaw", hour: "2-digit", minute: "2-digit" });
  return day(d) === day(new Date())
    ? `dziś ${time}`
    : `${d.toLocaleDateString("pl-PL", { timeZone: "Europe/Warsaw", day: "2-digit", month: "2-digit" })} ${time}`;
}

const PIPELINE = [
  { key: "senuto", name: "Snapshot Senuto", frequency: "codziennie 06:30" },
  { key: "gsc", name: "Snapshot GSC", frequency: "codziennie 06:30" },
  { key: "ga4", name: "Snapshot GA4", frequency: "codziennie 06:30" },
  { key: "ahrefs", name: "Snapshot Ahrefs", frequency: "codziennie 06:30" },
  { key: "bing", name: "Snapshot Bing", frequency: "codziennie 06:30" },
  { key: "clarity", name: "Snapshot Clarity", frequency: "raz dziennie" },
  { key: "cloudflare_ai", name: "Crawl botów AI (CF)", frequency: "codziennie 06:30" },
  { key: "indexing", name: "Indeksacja (sitemap)", frequency: "co tydzień" },
];

export default function SystemPage() {
  const { domains, global } = loadConfig();
  const globalSnaps = loadSnapshots("_global");
  const globalLatest = latestSnapshot("_global");
  const alerts = (global.alerts ?? {}) as Record<string, unknown>;
  const orMin = typeof alerts.openrouter_min_usd === "number" ? alerts.openrouter_min_usd : 20;
  const smsMin = typeof alerts.sms_min === "number" ? alerts.sms_min : 20;
  const senutoDaysMin = typeof alerts.senuto_days_left_min === "number" ? alerts.senuto_days_left_min : null;
  const serpMin = typeof alerts.serpdata_min_left === "number" ? alerts.serpdata_min_left : null;
  const emails = list(alerts.emails).length ? list(alerts.emails) : list(alerts.email);
  const webhookEnvs = list(alerts.webhook_envs);
  const directWebhooks = list(alerts.webhook_urls);

  const or = globalLatest?.sources.openrouter?.data;
  const orRemaining = typeof or?.remaining === "number" ? or.remaining : null;
  const orCredits = typeof or?.total_credits === "number" ? or.total_credits : null;
  const orUsage = typeof or?.total_usage === "number" ? or.total_usage : null;
  const orPct = orCredits && orUsage !== null ? Math.min(100, Math.round((orUsage / orCredits) * 100)) : null;
  const usage = globalSnaps.map((s) => s.sources.openrouter?.data?.total_usage).filter((v): v is number => typeof v === "number");
  const orDaily = usage.length >= 2 ? (usage.at(-1)! - usage[0]) / (usage.length - 1) : null;
  const orTone: Tone = orRemaining === null ? "off" : orRemaining <= orMin ? "warn" : "ok";

  const sms = globalLatest?.sources.smsapi?.data;
  const smsPoints = typeof sms?.points === "number" ? sms.points : null;
  const smsRemaining = typeof sms?.sms_remaining === "number" ? sms.sms_remaining : null;
  const smsCost = typeof sms?.sms_cost === "number" ? sms.sms_cost : null;
  const smsTone: Tone = smsRemaining === null ? "off" : smsRemaining <= smsMin ? "warn" : "ok";

  const perDomain = domains.map((d) => ({ domain: d, snapshots: loadSnapshots(d.id), latest: latestSnapshot(d.id) }));
  const collectedAt = [globalLatest?.collected_at, ...perDomain.map((p) => p.latest?.collected_at)]
    .filter((v): v is string => Boolean(v))
    .sort()
    .at(-1);

  const state = (key: string) => {
    const states = perDomain.map((p) => p.latest?.sources[key]).filter((r) => r !== undefined);
    if (!states.length) return { status: null as SourceStatus | null, has429: false };
    const worst = states.reduce((a, b) => (RANK[b.status] > RANK[a.status] ? b : a));
    return { status: worst.status, has429: states.some((r) => r.error?.includes("429")) };
  };
  const clarity = state("clarity");
  const quotas: { name: string; pct: number | null; used: string; limit: string; reset: string; tone: Tone }[] = [
    { name: "Senuto", pct: null, used: "–", limit: "brak licznika", reset: "token ~31 dni", tone: toneOf(state("senuto").status) },
    { name: "Google Search Console", pct: null, used: "–", limit: "kwota API", reset: "dziennie", tone: toneOf(state("gsc").status) },
    { name: "Google Analytics 4", pct: null, used: "–", limit: "kwota API", reset: "dziennie", tone: toneOf(state("ga4").status) },
    { name: "Bing Webmaster", pct: null, used: "–", limit: "kwota API", reset: "dziennie", tone: toneOf(state("bing").status) },
    {
      name: "Microsoft Clarity",
      pct: clarity.has429 ? 100 : clarity.status === "ok" ? 40 : null,
      used: clarity.has429 ? "10+ / 10" : clarity.status === "ok" ? "4 / 10" : "–",
      limit: "wywołań / projekt",
      reset: clarity.has429 ? "przekroczono · 429" : "dziennie",
      tone: clarity.has429 ? "err" : toneOf(clarity.status),
    },
    { name: "Cloudflare (GraphQL)", pct: null, used: "–", limit: "brak licznika", reset: "godzinowo", tone: toneOf(state("cloudflare_ai").status) },
    {
      name: "OpenRouter (LLM)",
      pct: orPct,
      used: orUsage !== null ? `$${fmtNum(orUsage, 2)}` : "–",
      limit: orCredits !== null ? `$${fmtNum(orCredits, 0)}` : "brak danych",
      reset: "saldo $",
      tone: orTone,
    },
  ];

  const pipeline = PIPELINE.map((def) => {
    const results = perDomain
      .map((p) => ({
        result: p.latest?.sources[def.key],
        lastOk: [...p.snapshots].reverse().find((s) => s.sources[def.key]?.status === "ok") ?? null,
      }))
      .filter((e) => e.result !== undefined);
    if (!results.length) return { ...def, tone: "off" as Tone, label: "Brak danych", last: "brak" };
    const worst = results.reduce((a, b) => (RANK[b.result!.status] > RANK[a.result!.status] ? b : a)).result!;
    const has429 = results.some((e) => e.result?.error?.includes("429"));
    const lastOk = results
      .map((e) => e.lastOk)
      .filter((s): s is Snapshot => s !== null)
      .sort((a, b) => a.collected_at.localeCompare(b.collected_at))
      .at(-1);
    const label =
      worst.status === "ok" ? "OK" : has429 ? "Błąd 429" : worst.status === "token_expired" ? "Token wygasł" : worst.status === "error" ? "Błąd" : "Nieaktywne";
    return { ...def, tone: toneOf(worst.status), label, last: shortDateTime(lastOk?.collected_at) };
  });

  return (
    <>
      <PageTitle
        title="System i limity"
        meta={collectedAt ? `Ostatni przebieg collectora: ${shortDateTime(collectedAt)}` : undefined}
      />
      <Note>
        Salda usług zewnętrznych, wykorzystanie limitów API i stan procesów zbierania danych – żeby zareagować na brak
        środków albo niedostępne źródło, zanim odczuje to ktoś z zespołu.
      </Note>

      <SectionHead title="Salda usług" meta="płatne API" />
      <div className="grid grid-cols-1 gap-4 md:gap-5 xl:grid-cols-2">
        <Balance
          name="OpenRouter"
          tone={orTone}
          value={orRemaining !== null ? `$${fmtNum(orRemaining, 2)}` : "–"}
          unit="pozostało"
          pct={orPct}
          left={orUsage !== null && orCredits !== null ? `zużyto $${fmtNum(orUsage, 2)} / $${fmtNum(orCredits, 0)}` : "brak danych o saldzie"}
          right={orDaily !== null ? `~$${fmtNum(orDaily, 2)} / dzień` : `próg alertu $${fmtNum(orMin, 0)}`}
        />
        <Balance
          name="SMSAPI"
          tone={smsTone}
          value={smsPoints !== null ? fmtNum(smsPoints, 2) : "–"}
          unit="pkt"
          pct={null}
          left={smsRemaining !== null ? `≈ ${fmtInt(smsRemaining)} SMS-ów zostało` : "brak danych o saldzie"}
          right={smsCost !== null ? `${fmtNum(smsCost, 2)} zł / SMS` : `próg alertu ${fmtInt(smsMin)} SMS`}
        />
        <SystemUsage />
      </div>

      <SectionHead title="Alerty o limitach" meta="konfiguracja collectora" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 xl:grid-cols-3">
        <Card className="p-5">
          <h3 className="font-medium text-gray-800 dark:text-white/90">Resend · e-mail</h3>
          <p className="text-theme-xs text-gray-500 dark:text-gray-400">sekret RESEND_API_KEY w GitHub Actions</p>
          <ul className="my-4 flex flex-wrap gap-1.5">
            {emails.length ? emails.map((e) => <Tag key={e}>{e}</Tag>) : <Tag muted>brak odbiorców</Tag>}
          </ul>
          <p className="text-theme-sm text-gray-500 dark:text-gray-400">
            Wiadomość wychodzi, gdy saldo spadnie poniżej progu. Domena nadawcy widocznosc.ai musi być zweryfikowana w Resend.
          </p>
        </Card>
        <Card className="p-5">
          <h3 className="font-medium text-gray-800 dark:text-white/90">Webhooki · URL</h3>
          <p className="text-theme-xs text-gray-500 dark:text-gray-400">POST JSON do wskazanych systemów</p>
          <ul className="my-4 flex flex-wrap gap-1.5">
            {webhookEnvs.map((n) => (
              <Tag key={n}>sekret: {n}</Tag>
            ))}
            {directWebhooks.map((_, i) => (
              <Tag key={i}>URL bezpośredni #{i + 1}</Tag>
            ))}
            {!webhookEnvs.length && !directWebhooks.length && <Tag muted>brak webhooków</Tag>}
          </ul>
          <p className="text-theme-sm text-gray-500 dark:text-gray-400">
            Adres z tokenem dodaj jako sekret ALERT_WEBHOOK_URL. Publiczne endpointy można wpisać w global.alerts.webhook_urls.
          </p>
        </Card>
        <Card className="p-5">
          <h3 className="font-medium text-gray-800 dark:text-white/90">Progi wysyłki</h3>
          <p className="text-theme-xs text-gray-500 dark:text-gray-400">dashboard/domains.yaml</p>
          <dl className="my-4 grid grid-cols-2 gap-2">
            {(
              [
                ["OpenRouter", `$${fmtNum(orMin, 0)}`],
                ["SMSAPI", `${fmtInt(smsMin)} SMS`],
                ...(senutoDaysMin !== null ? [["Senuto · token", `${senutoDaysMin === 1 ? "1 dzień" : `${fmtInt(senutoDaysMin)} dni`} przed rotacją`]] : []),
                ...(serpMin !== null ? [["SerpData", `${fmtInt(serpMin)} zapytań`]] : []),
              ] as [string, string][]
            ).map(([k, v]) => (
              <div key={k} className="rounded bg-gray-50 px-3 py-2 dark:bg-white/3">
                <dt className="text-theme-xs text-gray-500 dark:text-gray-400">{k}</dt>
                <dd className="mt-0.5 text-theme-sm font-medium text-gray-800 dark:text-white/90">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="text-theme-sm text-gray-500 dark:text-gray-400">Zmiana w YAML obowiązuje od następnego przebiegu collectora.</p>
        </Card>
      </div>

      <SectionHead title="Kwoty API integracji" meta="zużycie w bieżącym oknie" />
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-theme-sm">
          <thead className="bg-gray-50 text-left text-theme-xs text-gray-500 dark:bg-white/3 dark:text-gray-400">
            <tr>
              <th className="px-5 py-3 font-medium">Usługa</th>
              <th className="w-[38%] px-5 py-3 font-medium">Zużycie kwoty</th>
              <th className="px-5 py-3 text-right font-medium">Zapytania / limit</th>
              <th className="px-5 py-3 font-medium">Reset</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {quotas.map((q) => (
              <tr key={q.name}>
                <td className="px-5 py-3 font-medium text-gray-800 dark:text-white/90">{q.name}</td>
                <td className="px-5 py-3">
                  <span className="flex items-center gap-3">
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-white/5">
                      {q.pct !== null && <i className={cn("block h-full rounded-full", BAR[q.tone])} style={{ width: `${q.pct}%` }} />}
                    </span>
                    <span className="w-10 text-right tabular-nums">{q.pct !== null ? `${q.pct}%` : "–"}</span>
                  </span>
                </td>
                <td className="px-5 py-3 text-right text-gray-600 tabular-nums dark:text-gray-400">
                  {q.used} <span className="text-gray-400">/ {q.limit}</span>
                </td>
                <td className={cn("px-5 py-3", q.tone === "err" ? "text-error-600 dark:text-error-400" : "text-gray-500 dark:text-gray-400")}>
                  {q.reset}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <SectionHead title="Zdrowie pipeline'u" meta="crony snapshotów · ostatnie udane uruchomienie" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {pipeline.map((p) => (
          <Card key={p.key} className="p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-theme-sm font-medium text-gray-800 dark:text-white/90">{p.name}</span>
              <Pill tone={p.tone}>{p.label}</Pill>
            </div>
            <p className="mt-2 text-theme-xs text-gray-500 dark:text-gray-400">
              ostatnio: <b className="font-medium text-gray-700 dark:text-gray-300">{p.last}</b> · {p.frequency}
            </p>
          </Card>
        ))}
      </div>
    </>
  );
}

const BAR: Record<Tone, string> = { ok: "bg-brand-500", warn: "bg-warning-500", err: "bg-error-500", off: "bg-gray-300" };

function Tag({ children, muted = false }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <li
      className={cn(
        "max-w-full truncate rounded border border-gray-200 px-2 py-0.5 text-theme-xs dark:border-gray-800",
        muted ? "text-gray-400" : "text-gray-700 dark:text-gray-300",
      )}
    >
      {children}
    </li>
  );
}

function Balance({
  name,
  tone,
  value,
  unit,
  pct,
  left,
  right,
  children,
}: {
  name: string;
  tone: Tone;
  value: string;
  unit: string;
  pct: number | null;
  left: string;
  right: string;
  children?: React.ReactNode;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-medium text-gray-800 dark:text-white/90">{name}</h3>
        <Pill tone={tone}>{tone === "ok" ? "OK" : tone === "warn" ? "Niski stan" : tone === "err" ? "Wyczerpane" : "Brak danych"}</Pill>
      </div>
      <p className="mt-4 text-title-sm font-medium text-gray-800 tabular-nums dark:text-white/90">
        {value} <span className="text-base font-normal text-gray-500">{unit}</span>
      </p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-white/5">
        {pct !== null && <i className={cn("block h-full rounded-full", BAR[tone])} style={{ width: `${pct}%` }} />}
      </div>
      <div className="mt-2 flex flex-wrap justify-between gap-2 text-theme-xs text-gray-500 tabular-nums dark:text-gray-400">
        <span>{left}</span>
        <span>{right}</span>
      </div>
      {children}
    </Card>
  );
}
