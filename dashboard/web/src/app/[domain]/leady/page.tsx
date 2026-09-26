/* Leady – port dashboard/app/src/pages/[domain]/leady.astro: kontakty
   z formularza i raportów narzędzi (z weryfikacją SMS i zgodą) oraz użycia
   narzędzi z konwersją na lead. Dane osobowe – strona tylko za hasłem. */
import BarList from "@/components/BarList";
import { Card, EmptyState, Note, PageTitle, SectionHead, SourceState, StatCard, StatGrid } from "@/components/ui";
import { cn } from "@/lib/cn";
import { isTemporarySourceFailure, latestSnapshot, loadDetails, loadSnapshots, sourceStatuses, type LeadRecord } from "@/lib/data";
import { fmtDate } from "@/lib/format";
import { lastOk } from "@/lib/metrics";
import { domainParams, titleFor, type DomainProps } from "@/lib/pages";
import { C } from "@/lib/palette";
import { Mail, Phone } from "lucide-react";

export const dynamicParams = false;
export const generateStaticParams = () => domainParams("leads");
export const generateMetadata = titleFor("Leady");

const SOURCE_LABELS: Record<string, string> = {
  kontakt: "Formularz kontaktowy",
  "raport-narzedzia": "Raport narzędzia",
  "sms-code": "SMS – kod wysłany",
  fanout: "Fan-out",
  "brand-check": "Brand check",
  "url-check": "Ocena URL",
  "ai-bots-check": "AI-boty",
};
const label = (s: string) => SOURCE_LABELS[s] ?? s;
const str = (r: LeadRecord, key: string) => (typeof r[key] === "string" ? (r[key] as string) : "");

function fmtPhone(phone: string) {
  const d = phone.replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("48")) return `+48 ${d.slice(2, 5)} ${d.slice(5, 8)} ${d.slice(8)}`;
  if (d.length === 9) return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
  return phone;
}

function fmtWhen(ts: string) {
  const d = new Date(ts);
  const time = d.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Warsaw" });
  const date = d.toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Warsaw" });
  return `${date}, ${time}`;
}

function Status({ value, yes, no, unknown }: { value: unknown; yes: string; no: string; unknown: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-theme-xs",
        value === true
          ? "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400"
          : value === false
            ? "bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400"
            : "bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400",
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {value === true ? yes : value === false ? no : unknown}
    </span>
  );
}

export default async function LeadsPage({ params }: DomainProps) {
  const { domain } = await params;
  const snapshots = loadSnapshots(domain);
  const latest = latestSnapshot(domain);
  const data = loadDetails(domain).sources.leads;
  const source = sourceStatuses(latest).leads;
  const configured = source != null && source.status !== "not_configured";
  const lastGood = lastOk(snapshots, "leads");
  const staleDate = isTemporarySourceFailure(source) && lastGood ? fmtDate(lastGood.date) : null;

  const leads = [...(data?.leads ?? [])].reverse(); // najnowsze pierwsze
  const usage = [...(data?.usage ?? [])].reverse();
  const weekAgo = Date.now() - 7 * 86400_000;
  const recent = leads.filter((r) => new Date(r.ts).getTime() >= weekAgo).length;
  const firstLead = data?.leads?.[0]?.ts?.slice(0, 10) ?? null;

  /* Użycia per narzędzie (bez kroku sms-code) + leady z tego narzędzia. */
  const realUsage = usage.filter((r) => r.source !== "sms-code");
  const tools = new Map<string, { uses: number; leads: number }>();
  for (const r of realUsage) {
    const key = str(r, "tool") || r.source;
    const entry = tools.get(key) ?? { uses: 0, leads: 0 };
    entry.uses += 1;
    tools.set(key, entry);
  }
  for (const r of leads) {
    const key = str(r, "tool");
    if (!key) continue;
    const entry = tools.get(key) ?? { uses: 0, leads: 0 };
    entry.leads += 1;
    tools.set(key, entry);
  }
  const toolRows = [...tools.entries()].sort((a, b) => b[1].uses - a[1].uses);
  const toolLeads = leads.filter((r) => Boolean(str(r, "tool"))).length;
  const conversion = realUsage.length > 0 ? Math.round((toolLeads / realUsage.length) * 100) : null;

  return (
    <>
      <PageTitle title="Leady" meta="Kontakty z formularzy i raportów narzędzi oraz użycia narzędzi" />
      {!configured ? (
        <EmptyState title="Zbieranie leadów czeka na konfigurację">
          Wygeneruj token (openssl rand -hex 24) i dodaj jako sekret LEADS_EXPORT_TOKEN w Cloudflare Pages i GitHub
          Actions. Od tego momentu leady i użycia narzędzi będą zbierane automatycznie.
        </EmptyState>
      ) : (
        <>
          <SourceState
            name="Leady"
            status={source?.status}
            error={source?.error}
            temporary={isTemporarySourceFailure(source)}
            lastDate={lastGood?.date}
          />
          <Note>
            Lead to osoba, która zostawiła kontakt w formularzu albo w raporcie narzędzia (z weryfikacją SMS). Po prawej
            widać, jak często używane są narzędzia i ile użyć kończy się leadem.
          </Note>

          <SectionHead title="Leady i użycia narzędzi" />
          <StatGrid cols={4}>
            <StatCard
              label="Leady łącznie"
              value={leads.length}
              color={C.orange}
              staleDate={staleDate}
              emptyDeltaLabel={firstLead ? `zbieramy od ${fmtDate(firstLead)}` : "zbieramy dane"}
              hero
            />
            <StatCard label="Leady · 7 dni" value={recent} staleDate={staleDate} emptyDeltaLabel={recent ? "w ostatnim tygodniu" : "brak nowych"} />
            <StatCard label="Użycia narzędzi" value={realUsage.length} staleDate={staleDate} emptyDeltaLabel="łącznie" />
            <StatCard
              label="Konwersja narzędzie → lead"
              value={conversion !== null ? `${conversion}%` : null}
              staleDate={staleDate}
              emptyDeltaLabel={conversion !== null ? `${toolLeads} z ${realUsage.length} użyć` : "brak danych"}
            />
          </StatGrid>

          <div className="mt-8 grid grid-cols-1 gap-4 md:gap-5 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <Card className="overflow-hidden">
              <header className="flex items-baseline justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
                <h3 className="text-base font-medium text-gray-800 dark:text-white/90">Ostatnie leady</h3>
                <span className="text-theme-sm text-gray-500 dark:text-gray-400">{leads.length} łącznie</span>
              </header>
              {leads.length === 0 ? (
                <p className="px-5 py-10 text-center text-theme-sm text-gray-500 dark:text-gray-400">
                  Jeszcze żadnego leada od wdrożenia zapisu.
                </p>
              ) : (
                <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                  {leads.map((r) => {
                    const name = [str(r, "firstName"), str(r, "lastName")].filter(Boolean).join(" ") || str(r, "email") || "Anonim";
                    const tool = str(r, "tool");
                    const email = str(r, "email");
                    const phone = str(r, "phone");
                    return (
                      <li key={r.id} className="flex gap-4 px-5 py-4">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded bg-gray-950 text-sm font-medium text-gray-50 uppercase dark:bg-brand-500 dark:text-gray-950">
                          {name.charAt(0)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                            <b className="font-medium text-gray-800 dark:text-white/90">{name}</b>
                            <span className="text-theme-xs text-gray-500 tabular-nums dark:text-gray-400">{fmtWhen(r.ts)}</span>
                          </div>
                          <p className="text-theme-sm text-gray-500 dark:text-gray-400">
                            {tool ? `Narzędzie · ${label(tool)}` : `Formularz · ${label(r.source)}`}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-theme-sm">
                            <span className="inline-flex min-w-0 items-center gap-1.5">
                              <Mail className="size-3.5 shrink-0 text-gray-400" />
                              {email ? (
                                <a href={`mailto:${email}`} className="truncate text-gray-800 underline decoration-brand-500 underline-offset-2 dark:text-white/90">
                                  {email}
                                </a>
                              ) : (
                                <span className="text-gray-400">brak</span>
                              )}
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <Phone className="size-3.5 shrink-0 text-gray-400" />
                              {phone ? (
                                <a href={`tel:${phone}`} className="text-gray-800 underline decoration-brand-500 underline-offset-2 dark:text-white/90">
                                  {fmtPhone(phone)}
                                </a>
                              ) : (
                                <span className="text-gray-400">brak</span>
                              )}
                            </span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <Status value={r.smsVerified} yes="SMS zweryfikowany" no="SMS niezweryfikowany" unknown="SMS – brak danych" />
                            <Status value={r.consent} yes="Zgoda udzielona" no="Zgody brak" unknown="Zgoda – brak danych" />
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>

            <Card className="p-5">
              <div className="mb-4 flex items-baseline justify-between">
                <h3 className="text-base font-medium text-gray-800 dark:text-white/90">Użycia narzędzi</h3>
                <span className="text-theme-sm text-gray-500 dark:text-gray-400">użycia · leady</span>
              </div>
              {toolRows.length === 0 ? (
                <p className="py-6 text-center text-theme-sm text-gray-500 dark:text-gray-400">Jeszcze żadnego użycia narzędzi.</p>
              ) : (
                <BarList
                  labelWidth="w-28"
                  items={toolRows.map(([key, t]) => ({
                    label: label(key),
                    value: t.uses,
                    suffix: (
                      <span className={cn("ms-2 font-normal", t.leads ? "text-orange-600 dark:text-orange-400" : "text-gray-400")}>
                        · {t.leads}
                      </span>
                    ),
                  }))}
                />
              )}
              {leads.length + realUsage.length < 10 && (
                <p className="mt-5 rounded bg-gray-50 px-3 py-2.5 text-theme-sm text-gray-600 dark:bg-white/3 dark:text-gray-400">
                  <b className="font-medium text-gray-800 dark:text-white/90">Zbiór dopiero startuje.</b> Wpisy zbieramy
                  {firstLead ? ` od ${fmtDate(firstLead)}` : " od niedawna"} – statystyki urosną z ruchem.
                </p>
              )}
            </Card>
          </div>
        </>
      )}
    </>
  );
}
