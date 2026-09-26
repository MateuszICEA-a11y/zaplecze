"use client";

/* Kreator Asystenta. Trasa w #hash („konkurencja/lista?h=delante.pl&co=new"),
   żeby przycisk Wstecz i linki działały jak w starej wersji. Logika 1:1
   z asystent.astro, ekrany jako komponenty React. */
import DataGrid from "@/components/grid/DataGrid";
import { Card } from "@/components/ui";
import { cn } from "@/lib/cn";
import { fmtInt } from "@/lib/format";
import { api, type ApiError } from "@/lib/writer-client";
import type { ColDef } from "ag-grid-community";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Any = any; // eslint-disable-line @typescript-eslint/no-explicit-any
type Post = { id: string; title: string; url: string; urgency: string; age_days: number; clicks: number | null; impressions: number | null; reasons: string[] };
type Idea = { keyword: string; searches: number | null; impressions: number | null; position: number; ranking_title: string | null };
type Route = { path: string; q: URLSearchParams };
type Tone = "nowy" | "odswiez" | "konkurencja";

const NEW_DAYS = 30;
const TONE: Record<Tone, { bar: string; badge: string }> = {
  nowy: { bar: "bg-brand-500", badge: "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300" },
  odswiez: { bar: "bg-orange-500", badge: "bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300" },
  konkurencja: { bar: "bg-gray-950 dark:bg-gray-300", badge: "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-200" },
};
const INTENT: Record<string, { label: string; tone: Tone }> = {
  nowy: { label: "Napisać nową treść", tone: "nowy" },
  odswiez: { label: "Odświeżyć wpis", tone: "odswiez" },
  konkurencja: { label: "Sprawdzić, czego brakuje", tone: "konkurencja" },
};
/* Typy stron konkurencji (klasyfikator LLM w collectorze). */
const TYPES = [
  { key: "poradnik", label: "Poradnik", content: true },
  { key: "slownik", label: "Słownik", content: true },
  { key: "news", label: "News", content: false },
  { key: "firmowe", label: "O agencji", content: false },
  { key: "case_study", label: "Case study", content: false },
  { key: "oferta", label: "Oferta", content: false },
  { key: "niepewne", label: "Niepewne", content: false },
];
const TYPE_LABEL = Object.fromEntries(TYPES.map((t) => [t.key, t.label]));
// Strona jeszcze bez oceny liczy się jak poradnik – lista nie może być pusta przed klasyfikacją.
const typeOf = (item: Any) => item.kind ?? "poradnik";
const isContent = (item: Any) => TYPES.find((t) => t.key === typeOf(item))?.content ?? true;
const URGENCY = [
  { key: "critical", label: "Krytyczny" },
  { key: "high", label: "Wysoki" },
  { key: "normal", label: "Normalny" },
  { key: "low", label: "Niski" },
  { key: "none", label: "Bez oceny" },
];
const URGENCY_LABEL = Object.fromEntries(URGENCY.map((u) => [u.key, u.label]));
const URGENCY_RANK: Record<string, number> = { critical: 4, high: 3, normal: 2, low: 1, none: 0 };
const URGENCY_CLS: Record<string, string> = {
  critical: "bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400",
  high: "bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
  normal: "bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400",
  low: "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400",
  none: "bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400",
};
const pct = (score: unknown) => (typeof score === "number" ? `${Math.round(score * 100)}%` : "–");
const link = (path: string, params: Record<string, string> = {}) => {
  const query = new URLSearchParams(params).toString();
  return `#${path}${query ? `?${query}` : ""}`;
};
const go = (path: string, params: Record<string, string> = {}) => {
  location.hash = link(path, params).slice(1);
};
const hostsOf = (q: URLSearchParams) => (q.get("h") && q.get("h") !== "all" ? q.get("h")!.split(",") : null);
const btnPrimary = "inline-flex h-11 items-center rounded bg-brand-500 px-4 text-theme-sm font-medium text-gray-950 hover:bg-brand-400 disabled:opacity-40";
const btnSecondary =
  "inline-flex h-11 items-center rounded border border-gray-300 px-4 text-theme-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:text-white/90 dark:hover:bg-white/5";
const btnSmall = "inline-flex h-8 items-center rounded px-2.5 text-theme-xs font-medium";
const inlineLink = "text-gray-800 underline decoration-brand-500 underline-offset-2 hover:text-brand-600 dark:text-white/90 dark:hover:text-brand-400";

function useHashRoute(): Route {
  const read = () => {
    const [path, query] = decodeURIComponent(location.hash.slice(1)).split("?");
    return { path: (path ?? "").replace(/^\/+|\/+$/g, ""), q: new URLSearchParams(query ?? "") };
  };
  const [route, setRoute] = useState<Route>({ path: "", q: new URLSearchParams() });
  useEffect(() => {
    const update = () => {
      setRoute(read());
      window.scrollTo({ top: 0 });
    };
    update();
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
  return route;
}

export default function Assistant({
  domain,
  legacyBase,
  competitorHosts,
  urgency,
  posts,
  ideas,
}: {
  domain: string;
  legacyBase: string;
  competitorHosts: string[];
  urgency: Record<string, number>;
  posts: Post[];
  ideas: Idea[];
}) {
  const route = useHashRoute();
  const editorUrl = useCallback((id: string) => `${legacyBase}/content-watcher/edytor/?id=${encodeURIComponent(id)}`, [legacyBase]);
  const projectUrl = useCallback((id: number) => `${legacyBase}/content-writer/projekt/?id=${id}`, [legacyBase]);
  const [freshCutoff] = useState(() => new Date(Date.now() - NEW_DAYS * 86_400_000).toISOString().slice(0, 10));
  const isFresh = useCallback((item: Any) => !item.baseline && String(item.first_seen ?? "") >= freshCutoff, [freshCutoff]);
  const SEEK = useMemo(
    () =>
      ({
        new: { label: "Tematy, których nie mamy", answer: "Tematów, których nie mamy", test: (i: Any) => i.action === "new", contentOnly: true },
        check: { label: "Tematy, które mamy tylko częściowo", answer: "Tematów pokrewnych", test: (i: Any) => i.action === "check", contentOnly: true },
        fresh: { label: "Nowości u konkurencji", answer: `Nowości z ${NEW_DAYS} dni`, test: isFresh, contentOnly: false },
      }) as Record<string, { label: string; answer: string; test: (i: Any) => boolean; contentOnly: boolean }>,
    [isFresh],
  );
  const inSeek = useCallback((seek: string, item: Any) => SEEK[seek].test(item) && (!SEEK[seek].contentOnly || isContent(item)), [SEEK]);

  /* Konkurencja: jedno pobranie na wizytę (Wymuszone po „Porównaj teraz"). */
  const [competitors, setCompetitors] = useState<Any | null>(null);
  const [compError, setCompError] = useState<string | null>(null);
  const loadCompetitors = useCallback(async () => {
    try {
      const res = await api<Any>(`/api/cw/writer/competitors/${domain}`);
      // Stare adresy z sitemapy przekierowują na ten sam wpis (ten sam tytuł) – jeden temat raz.
      const seen = new Set<string>();
      const items = (res.data.items ?? []).filter((item: Any) => {
        const key = `${item.host}|${String(item.title).toLowerCase()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      setCompetitors({ ...res.data, items });
    } catch (e) {
      setCompError((e as Error).message);
    }
  }, [domain]);
  useEffect(() => {
    loadCompetitors();
  }, [loadCompetitors]);

  /* Skróty: 1–9 wybierają kartę, Esc cofa o krok. */
  const screenRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const typing = (event.target as HTMLElement).closest("input, textarea, select, .ag-root-wrapper");
      if (typing || event.metaKey || event.ctrlKey || event.altKey) return;
      if (/^[1-9]$/.test(event.key)) screenRef.current?.querySelector<HTMLAnchorElement>(`a[data-key="${event.key}"]`)?.click();
      if (event.key === "Escape") screenRef.current?.querySelector<HTMLAnchorElement>("[data-back]")?.click();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const [intent, sub] = route.path.split("/");
  const tone = INTENT[intent]?.tone;
  const ctx = { domain, route, editorUrl, projectUrl, competitors, compError, loadCompetitors, inSeek, isFresh, SEEK, urgency, posts, ideas, competitorHosts };

  const screen = (() => {
    switch (route.path) {
      case "nowy":
        return <NewChoice {...ctx} />;
      case "nowy/fraza":
        return <PhraseScreen {...ctx} />;
      case "nowy/propozycje":
        return <IdeasScreen {...ctx} />;
      case "odswiez":
        return <RefreshChoice {...ctx} />;
      case "odswiez/pilne":
        return <PostsScreen {...ctx} search={false} />;
      case "odswiez/szukaj":
        return <PostsScreen {...ctx} search />;
      case "konkurencja":
        return <CompetitorsWho {...ctx} />;
      case "konkurencja/wybierz":
        return <CompetitorsPick {...ctx} />;
      case "konkurencja/co":
        return <CompetitorsWhat {...ctx} />;
      case "konkurencja/lista":
        return <CompetitorsList {...ctx} />;
      default:
        return <Home {...ctx} />;
    }
  })();

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
      <PathAside route={route} intent={intent} sub={sub} SEEK={SEEK} tone={tone} />
      <div ref={screenRef} className="min-w-0">
        {screen}
      </div>
    </div>
  );
}

type Ctx = {
  domain: string;
  route: Route;
  editorUrl: (id: string) => string;
  projectUrl: (id: number) => string;
  competitors: Any | null;
  compError: string | null;
  loadCompetitors: () => Promise<void>;
  inSeek: (seek: string, item: Any) => boolean;
  isFresh: (item: Any) => boolean;
  SEEK: Record<string, { label: string; answer: string; test: (i: Any) => boolean; contentOnly: boolean }>;
  urgency: Record<string, number>;
  posts: Post[];
  ideas: Idea[];
  competitorHosts: string[];
};

/* ---------- ścieżka decyzji (lewa kolumna) ---------- */

function PathAside({ route, intent, sub, SEEK, tone }: { route: Route; intent: string; sub?: string; SEEK: Ctx["SEEK"]; tone?: Tone }) {
  const { q } = route;
  const list: { q: string; a: string | null; href: string }[] = [{ q: "Co chcesz zrobić?", a: INTENT[intent]?.label ?? null, href: link("") }];
  if (intent === "nowy") {
    list.push({ q: "Masz już temat?", a: sub === "fraza" ? "Mam frazę" : sub === "propozycje" ? "Zaproponuj temat" : null, href: link("nowy") });
    if (sub === "propozycje") list.push({ q: "Który temat bierzemy?", a: null, href: "" });
    if (sub === "fraza") list.push({ q: "Jaka fraza?", a: q.get("q") && !q.get("z") ? `„${q.get("q")}”` : null, href: link("nowy/fraza", q.get("q") ? { q: q.get("q")! } : {}) });
    if (sub === "fraza" && q.get("q") && !q.get("z")) list.push({ q: "Co robimy?", a: null, href: "" });
  } else if (intent === "odswiez") {
    list.push({ q: "Który wpis?", a: sub === "pilne" ? "Najpilniejsze" : sub === "szukaj" ? "Konkretny wpis" : null, href: link("odswiez") });
    if (sub) list.push({ q: sub === "pilne" ? "Który z nich?" : "Znajdź po tytule", a: null, href: "" });
  } else if (intent === "konkurencja") {
    const hosts = hostsOf(q);
    const h = q.get("h") ?? "all";
    const who = sub === "co" || sub === "lista" ? (hosts ? hosts.join(", ") : "Wszyscy razem") : sub === "wybierz" ? "Wybrani" : null;
    list.push({ q: "Z kim się porównujemy?", a: who, href: link("konkurencja") });
    if (sub === "wybierz") list.push({ q: "Których konkurentów?", a: null, href: "" });
    if (sub === "co" || sub === "lista") {
      const seek = SEEK[q.get("co") ?? ""];
      list.push({ q: "Czego szukamy?", a: sub === "lista" && seek ? seek.answer : null, href: link("konkurencja/co", { h }) });
    }
    if (sub === "lista") list.push({ q: "Który temat?", a: null, href: "" });
  }
  return (
    <aside aria-label="Twoja ścieżka" className="lg:sticky lg:top-24 lg:self-start">
      <ol className="flex flex-col gap-1 border-l-2 border-gray-200 dark:border-gray-800">
        {list.map((step, i) => (
          <li key={i} className="-ml-0.5">
            {step.a ? (
              <a href={step.href} className="flex flex-col gap-0.5 border-l-2 border-transparent py-2 pr-2 pl-4 hover:border-gray-400">
                <span className="text-theme-xs text-gray-500 dark:text-gray-400">{step.q}</span>
                <span className="flex items-center gap-1.5 text-theme-sm font-medium text-gray-800 dark:text-white/90">
                  <Check className="size-3.5 text-success-500" />
                  {step.a}
                </span>
              </a>
            ) : (
              <span aria-current="step" className={cn("block border-l-2 py-2 pr-2 pl-4 text-theme-sm font-medium text-gray-800 dark:text-white/90", tone ? "border-brand-500" : "border-brand-500")}>
                {step.q}
              </span>
            )}
          </li>
        ))}
      </ol>
      <p className="mt-4 text-theme-xs text-gray-500 dark:text-gray-400">Klawisze 1–3 wybierają odpowiedź, Esc cofa o krok.</p>
    </aside>
  );
}

/* ---------- klocki ekranu ---------- */

function Question({ title, lede }: { title: string; lede?: string }) {
  return (
    <header className="mb-5">
      <h2 className="text-title-sm font-medium text-gray-800 dark:text-white/90">{title}</h2>
      {lede && <p className="mt-1.5 max-w-3xl text-theme-sm text-gray-600 dark:text-gray-400">{lede}</p>}
    </header>
  );
}

function Back({ href }: { href: string }) {
  return (
    <a href={href} data-back className="mb-4 inline-flex items-center gap-1.5 text-theme-sm text-gray-500 hover:text-brand-600 dark:text-gray-400">
      <ArrowLeft className="size-4" /> Wróć
    </a>
  );
}

type Choice = { href: string; title: string; desc: string; tone: Tone; badge?: string; meta?: React.ReactNode[] };
function Choices({ items }: { items: Choice[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item, i) => (
        <a
          key={item.title}
          href={item.href}
          data-key={i + 1}
          className="group relative flex flex-col gap-2 overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 pl-6 transition hover:border-brand-300 hover:shadow-theme-md dark:border-gray-800 dark:bg-white/3 dark:hover:border-brand-500/40"
        >
          <span className={cn("absolute inset-y-0 left-0 w-1", TONE[item.tone].bar)} />
          <span className="flex items-start justify-between gap-3">
            <strong className="text-base font-medium text-gray-800 dark:text-white/90">
              <span className="me-2 text-theme-xs text-gray-400">{i + 1}</span>
              {item.title}
            </strong>
            {item.badge !== undefined && <span className={cn("shrink-0 rounded px-2 py-0.5 text-theme-xs font-medium", TONE[item.tone].badge)}>{item.badge}</span>}
          </span>
          <span className="text-theme-sm text-gray-600 dark:text-gray-400">{item.desc}</span>
          {item.meta?.length ? (
            <span className="mt-1 flex flex-col gap-0.5 text-theme-xs text-gray-500 dark:text-gray-400">
              {item.meta.map((m, j) => (
                <span key={j}>{m}</span>
              ))}
            </span>
          ) : null}
        </a>
      ))}
    </div>
  );
}

function Loading({ text }: { text: string }) {
  return (
    <p className="flex items-center gap-2 text-theme-sm text-gray-500">
      <Loader2 className="size-4 animate-spin" /> {text}
    </p>
  );
}

function Favicon({ host }: { host: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=32`} alt="" width={14} height={14} loading="lazy" className="inline-block align-[-2px]" />;
}

/** Przełączniki nad siatką (typ treści, pilność) – filtr zewnętrzny. */
function Toggles({ items, active, onToggle }: { items: { key: string; label: string; count: number }[]; active: Set<string>; onToggle: (key: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items
        .filter((i) => i.count)
        .map((i) => (
          <button
            key={i.key}
            type="button"
            aria-pressed={active.has(i.key)}
            onClick={() => onToggle(i.key)}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded border px-2.5 text-theme-xs font-medium",
              active.has(i.key)
                ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"
                : "border-gray-200 text-gray-500 dark:border-gray-800 dark:text-gray-400",
            )}
          >
            {i.label}
            <b className="font-medium tabular-nums">{fmtInt(i.count)}</b>
          </button>
        ))}
    </div>
  );
}

function useToggleSet(initial: string[]) {
  const [set, setSet] = useState(() => new Set(initial));
  const toggle = (key: string) =>
    setSet((cur) => {
      const next = new Set(cur);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  return [set, toggle] as const;
}

/* ---------- ekrany ---------- */

function Home({ urgency, ideas, competitors, inSeek, competitorHosts, compError }: Ctx) {
  const urgent = (urgency.critical ?? 0) + (urgency.high ?? 0);
  const gaps = competitors ? (competitors.items ?? []).filter((i: Any) => inSeek("new", i)).length : null;
  return (
    <>
      <Question title="Co chcesz dziś zrobić?" lede="Wybierz jedną rzecz. Dalej poprowadzę Cię pytaniami aż do konkretnej decyzji." />
      <Choices
        items={[
          {
            href: link("nowy"),
            tone: "nowy",
            title: "Napisać nową treść",
            badge: `${fmtInt(ideas.length)} propozycji`,
            desc: "Od tematu do szkicu w WordPressie. Najpierw sprawdzimy, czy nie mamy już takiego wpisu.",
            meta: ["Propozycje: frazy z Senuto i Search Console na pozycjach 11–50", "Dalej: projekt w Content Writerze"],
          },
          {
            href: link("odswiez"),
            tone: "odswiez",
            title: "Odświeżyć istniejący wpis",
            badge: `${fmtInt(urgent)} pilnych`,
            desc: "Wpisy, które tracą ruch albo stoją tuż za TOP 10 – z powodem przy każdym.",
            meta: ["Kolejność: pilność z Content Watchera", "Dalej: edytor wpisu"],
          },
          {
            href: link("konkurencja"),
            tone: "konkurencja",
            title: "Sprawdzić, czego nam brakuje",
            badge: compError ? "brak danych" : gaps === null ? "liczę…" : `${fmtInt(gaps)} tematów`,
            desc: "Tematy z blogów konkurencji, których u nas nie ma.",
            meta: [`Konkurenci: ${competitorHosts.join(", ") || "–"}`, "Porównanie: tytuły wpisów, codziennie rano"],
          },
        ]}
      />
    </>
  );
}

function NewChoice({ ideas }: Ctx) {
  return (
    <>
      <Back href={link("")} />
      <Question title="Masz już temat?" lede="Jeśli tak, sprawdzimy, czy nie piszemy drugi raz o tym samym. Jeśli nie, zaproponuję tematy." />
      <Choices
        items={[
          { href: link("nowy/fraza"), tone: "nowy", title: "Tak, podam frazę", desc: "Frazę, pod którą tekst ma być widoczny w Google.", meta: ["Dalej: sprawdzenie, czy mamy już taki wpis"] },
          {
            href: link("nowy/propozycje"),
            tone: "nowy",
            title: "Nie, zaproponuj temat",
            badge: `${fmtInt(ideas.length)} propozycji`,
            desc: "Frazy, na które już się wyświetlamy, ale na pozycjach 11–50 – bez ruchu.",
            meta: ["Źródło: Senuto i Search Console"],
          },
          { href: link("konkurencja"), tone: "konkurencja", title: "Pokaż, co piszą konkurenci", desc: "Tematy z ich blogów, których u nas nie ma." },
        ]}
      />
    </>
  );
}

function PhraseScreen({ route, domain, editorUrl, projectUrl }: Ctx) {
  const phrase = route.q.get("q") ?? "";
  const from = route.q.get("z");
  const [value, setValue] = useState(phrase);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    setValue(phrase);
    if (!phrase || from) {
      input.current?.focus();
      if (from) input.current?.select(); // tytuł konkurenta najpierw do skrócenia
    }
  }, [phrase, from]);

  return (
    <>
      <Back href={link("nowy")} />
      <Question title="Jaka fraza?" lede="Jedna fraza główna – tak, jak wpisałby ją czytelnik w Google." />
      <form
        className="flex flex-wrap gap-3"
        autoComplete="off"
        onSubmit={(e) => {
          e.preventDefault();
          if (value.trim()) go("nowy/fraza", { q: value.trim() });
        }}
      >
        <input
          ref={input}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={120}
          required
          placeholder="np. audyt seo sklepu internetowego"
          aria-label="Fraza główna"
          className="h-11 min-w-64 flex-1 rounded border border-gray-300 bg-transparent px-3 text-sm text-gray-800 focus:border-brand-500 focus:outline-hidden dark:border-gray-700 dark:text-white/90"
        />
        <button type="submit" className={btnPrimary}>
          Sprawdź temat
        </button>
      </form>
      {from && (
        <p className="mt-3 text-theme-sm text-gray-500">
          To tytuł wpisu konkurenta (
          <a className={inlineLink} href={from} target="_blank" rel="noopener noreferrer">
            otwórz
          </a>
          ). Skróć go do frazy, pod którą chcesz być widoczny.
        </p>
      )}
      {phrase && !from && <Verdict key={phrase} phrase={phrase} domain={domain} editorUrl={editorUrl} projectUrl={projectUrl} />}
    </>
  );
}

/* „Odśwież czy nowy" dla frazy i jedna decyzja na końcu. */
function Verdict({ phrase, domain, editorUrl, projectUrl }: { phrase: string; domain: string; editorUrl: (id: string) => string; projectUrl: (id: number) => string }) {
  const [state, setState] = useState<{ loading: boolean; result: Any | null; error: string | null }>({ loading: true, result: null, error: null });
  const [creating, setCreating] = useState<string | null>(null);
  const [createMsg, setCreateMsg] = useState<React.ReactNode>(null);

  useEffect(() => {
    api<Any>("/api/cw/writer/classify", { method: "POST", body: { domain, phrases: [phrase] } })
      .then(({ data }) => setState({ loading: false, result: data.results?.[0] ?? null, error: null }))
      .catch((e) => setState({ loading: false, result: null, error: (e as Error).message }));
  }, [domain, phrase]);

  // Decyzja to pomoc na przyszłość – jej brak nie blokuje pracy.
  const saveVerdict = (choice: string, target: Any) =>
    api("/api/cw/writer/verdict", { method: "POST", body: { domain, phrase, verdict: choice, target: choice === "same" ? target : undefined } }).catch(() => null);

  const create = async (choice?: string) => {
    setCreating(choice ?? "create");
    if (choice) await saveVerdict(choice, null);
    try {
      const { data } = await api<{ project: { id: number } }>("/api/cw/writer/projects", { method: "POST", body: { domain, keyword: phrase } });
      location.href = projectUrl(data.project.id);
    } catch (error) {
      const err = error as ApiError;
      const id = (err.data as Any)?.project_id;
      setCreateMsg(
        err.code === "duplicate" && id ? (
          <>
            Ta fraza ma już projekt –{" "}
            <a className={inlineLink} href={projectUrl(id)}>
              otwórz go
            </a>
            .
          </>
        ) : (
          <span className="text-error-600">{err.message}</span>
        ),
      );
      setCreating(null);
    }
  };

  const Our = ({ post }: { post: Any }) =>
    post?.catalog_id ? (
      <a className={inlineLink} href={editorUrl(post.catalog_id)}>
        {post.title}
      </a>
    ) : (
      <a className={inlineLink} href={post?.url} target="_blank" rel="noopener">
        {post?.title ?? post?.url}
      </a>
    );

  const box = (tone: "ok" | "warn" | "mid", children: React.ReactNode) => (
    <Card
      className={cn(
        "mt-6 border-l-4 p-5",
        tone === "ok" ? "border-l-success-500" : tone === "warn" ? "border-l-orange-500" : "border-l-brand-500",
      )}
    >
      {children}
      {createMsg && <p className="mt-3 text-theme-sm">{createMsg}</p>}
    </Card>
  );

  if (state.loading)
    return (
      <div className="mt-6">
        <Loading text="Sprawdzam, czy mamy już wpis na ten temat…" />
      </div>
    );
  if (state.error)
    return box(
      "mid",
      <>
        <h3 className="text-lg font-medium">Nie udało się sprawdzić bloga</h3>
        <p className="mt-1 text-theme-sm text-gray-600 dark:text-gray-400">{state.error}</p>
        <div className="mt-4">
          <button type="button" className={btnPrimary} disabled={!!creating} onClick={() => create()}>
            Załóż projekt mimo to
          </button>
        </div>
      </>,
    );

  const result = state.result;
  const target = result?.target ?? null;
  const nearest = target ?? result?.candidates?.[0] ?? null;
  const basis = result?.judge?.basis ? <p className="mt-2 text-theme-sm text-gray-500 italic">{result.judge.basis}</p> : null;
  const action = result?.editor?.verdict === "different" ? "new" : (result?.action ?? "new");

  if (action === "new")
    return box(
      "ok",
      <>
        <h3 className="text-lg font-medium">Nie mamy wpisu na ten temat. Możesz pisać.</h3>
        <p className="mt-1 text-theme-sm text-gray-600 dark:text-gray-400">
          {nearest ? (
            <>
              Najbliżej jest <Our post={nearest} /> ({pct(nearest.score)} podobieństwa) – to inny temat.
            </>
          ) : (
            "Na blogu nie ma nic bliskiego."
          )}
        </p>
        {basis}
        <div className="mt-4">
          <button type="button" className={btnPrimary} disabled={!!creating} onClick={() => create()}>
            {creating ? "Zakładam projekt…" : `Załóż projekt „${phrase}”`}
          </button>
        </div>
        <p className="mt-2 text-theme-xs text-gray-500">Dalej: analiza wyników Google i brief do akceptacji w Content Writerze.</p>
      </>,
    );

  if (action === "refresh")
    return box(
      "warn",
      <>
        <h3 className="text-lg font-medium">Ten temat już mamy</h3>
        <p className="mt-1 text-theme-sm text-gray-600 dark:text-gray-400">
          <Our post={target} />
          {typeof target?.score === "number" && ` – ${pct(target.score)} podobieństwa`}
          {target?.position && `, rankuje na #${target.position}`}
        </p>
        {basis}
        <p className="mt-2 text-theme-sm text-gray-600 dark:text-gray-400">Drugi tekst o tym samym konkurowałby z pierwszym o tę samą frazę. Lepiej rozbudować istniejący.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          {target?.catalog_id && (
            <a className={btnPrimary} href={editorUrl(target.catalog_id)}>
              Rozbuduj istniejący wpis
            </a>
          )}
          <button type="button" className={btnSecondary} disabled={!!creating} onClick={() => create("different")}>
            {creating ? "Zakładam projekt…" : "To jednak inny temat – napisz nowy"}
          </button>
        </div>
      </>,
    );

  return box(
    "mid",
    <>
      <h3 className="text-lg font-medium">Mamy wpis pokrewny. To ten sam temat?</h3>
      <p className="mt-1 text-theme-sm text-gray-600 dark:text-gray-400">
        <Our post={nearest} />
        {typeof nearest?.score === "number" && ` – ${pct(nearest.score)} podobieństwa`}
      </p>
      {basis}
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          className={btnPrimary}
          disabled={!!creating}
          onClick={async () => {
            setCreating("same");
            await saveVerdict("same", nearest);
            location.href = nearest?.catalog_id ? editorUrl(nearest.catalog_id) : nearest?.url;
          }}
        >
          Tak, rozbuduję istniejący
        </button>
        <button type="button" className={btnSecondary} disabled={!!creating} onClick={() => create("different")}>
          {creating === "different" ? "Zakładam projekt…" : "Nie, napiszę nowy"}
        </button>
      </div>
      <p className="mt-2 text-theme-xs text-gray-500">Zapamiętam odpowiedź dla tej frazy.</p>
    </>,
  );
}

function IdeasScreen({ domain, ideas }: Ctx) {
  const columns = useMemo<ColDef<Idea>[]>(
    () => [
      { field: "keyword", headerName: "Fraza", flex: 2, minWidth: 220, cellClass: "font-medium" },
      { field: "searches", headerName: "Wyszukiwania / mies.", width: 160, sort: "desc", type: "rightAligned", valueFormatter: ({ value }) => (value == null ? "–" : fmtInt(value)) },
      { field: "impressions", headerName: "Wyświetlenia (28 dni)", width: 170, type: "rightAligned", valueFormatter: ({ value }) => (value == null ? "–" : fmtInt(value)) },
      { field: "position", headerName: "Pozycja", width: 100, type: "rightAligned", valueFormatter: ({ value }) => String(Math.round(value)) },
      { field: "ranking_title", headerName: "Dziś rankuje wpis", flex: 1.5, minWidth: 200, valueFormatter: ({ value }) => value ?? "–" },
      {
        headerName: "",
        colId: "act",
        width: 130,
        sortable: false,
        pinned: "right",
        cellRenderer: ({ data }: { data?: Idea }) =>
          data && (
            <a href={link("nowy/fraza", { q: data.keyword })} className={cn(btnSmall, "bg-brand-500 text-gray-950 hover:bg-brand-400")}>
              Wybieram
            </a>
          ),
      },
    ],
    [],
  );
  return (
    <>
      <Back href={link("nowy")} />
      <Question title="Który temat bierzemy?" lede="Na te frazy Google pokazuje już nasze strony, ale na pozycjach 11–50. Osobny tekst ma szansę wejść do TOP 10." />
      <DataGrid<Idea> title="Propozycje" rows={ideas} columns={columns} filter rowKey={(i) => i.keyword} rowHeight={48} csvName={`${domain}-asystent-propozycje`} />
    </>
  );
}

function RefreshChoice({ urgency, posts }: Ctx) {
  return (
    <>
      <Back href={link("")} />
      <Question title="Który wpis odświeżamy?" />
      <Choices
        items={[
          {
            href: link("odswiez/pilne"),
            tone: "odswiez",
            title: "Pokaż najpilniejsze",
            badge: `${fmtInt(urgency.critical ?? 0)} krytycznych`,
            desc: "Słaby ruch, dawno bez zmian albo tuż za TOP 10 – od najpilniejszego.",
            meta: ["Pilność: wyniki z GSC × wiek treści"],
          },
          { href: link("odswiez/szukaj"), tone: "odswiez", title: "Mam konkretny wpis", badge: `${fmtInt(posts.length)} wpisów`, desc: "Znajdziesz go po tytule w tabeli wszystkich wpisów." },
        ]}
      />
    </>
  );
}

/* Wpisy do odświeżenia – jedna siatka dla „najpilniejsze" i „konkretny wpis". */
function PostsScreen({ domain, posts, editorUrl, search }: Ctx & { search: boolean }) {
  const storageKey = `as-skip:${domain}`;
  const [skipped, setSkipped] = useState<Set<string>>(() => new Set());
  useEffect(() => {
    setSkipped(new Set(JSON.parse(localStorage.getItem(storageKey) ?? "[]")));
  }, [storageKey]);
  const [active, toggle] = useToggleSet(search ? URGENCY.map((u) => u.key) : ["critical", "high", "normal"]);
  const [showSkipped, setShowSkipped] = useState(false);

  const flipSkip = useCallback(
    (id: string) =>
      setSkipped((cur) => {
        const next = new Set(cur);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        localStorage.setItem(storageKey, JSON.stringify([...next]));
        return next;
      }),
    [storageKey],
  );

  const filter = useMemo(() => (p: Post) => active.has(p.urgency) && skipped.has(p.id) === showSkipped, [active, skipped, showSkipped]);
  const columns = useMemo<ColDef<Post>[]>(
    () => [
      {
        headerName: "Pilność",
        colId: "urgency",
        width: 120,
        sort: "desc",
        valueGetter: ({ data }) => URGENCY_RANK[data?.urgency ?? "none"] ?? 0,
        cellRenderer: ({ data }: { data?: Post }) =>
          data && <span className={cn("rounded px-2 py-0.5 text-theme-xs font-medium", URGENCY_CLS[data.urgency])}>{URGENCY_LABEL[data.urgency] ?? data.urgency}</span>,
      },
      {
        field: "title",
        headerName: "Wpis",
        flex: 2,
        minWidth: 240,
        cellRenderer: ({ data }: { data?: Post }) =>
          data && (
            <a className={cn(inlineLink, "truncate font-medium")} href={data.url} target="_blank" rel="noopener">
              {data.title}
            </a>
          ),
      },
      {
        headerName: "Dlaczego",
        colId: "reasons",
        flex: 1.6,
        minWidth: 220,
        valueGetter: ({ data }) => data?.reasons.join(", ") || "–",
        tooltipValueGetter: ({ data }) => data?.reasons.join("\n"),
        cellClass: "text-gray-500 dark:text-gray-400",
      },
      { field: "clicks", headerName: "Kliknięcia (30 dni)", width: 140, type: "rightAligned", valueFormatter: ({ value }) => (value == null ? "–" : fmtInt(value)) },
      { field: "impressions", headerName: "Wyświetlenia", width: 120, type: "rightAligned", valueFormatter: ({ value }) => (value == null ? "–" : fmtInt(value)) },
      { field: "age_days", headerName: "Bez zmian (dni)", width: 130, type: "rightAligned", valueFormatter: ({ value }) => fmtInt(value) },
      {
        headerName: "",
        colId: "act",
        width: 250,
        pinned: "right",
        sortable: false,
        cellRenderer: ({ data }: { data?: Post }) =>
          data && (
            <span className="flex gap-1.5">
              <a href={editorUrl(data.id)} className={cn(btnSmall, "bg-brand-500 text-gray-950 hover:bg-brand-400")}>
                Odśwież w edytorze
              </a>
              <button type="button" onClick={() => flipSkip(data.id)} className={cn(btnSmall, "border border-gray-300 text-gray-700 dark:border-gray-700 dark:text-gray-300")}>
                {skipped.has(data.id) ? "Przywróć" : "Nie teraz"}
              </button>
            </span>
          ),
      },
    ],
    [editorUrl, flipSkip, skipped],
  );

  return (
    <>
      <Back href={link("odswiez")} />
      <Question
        title={search ? "Który wpis?" : "Te wpisy odśwież najpierw"}
        lede={search ? "Wpisz słowo w wyszukiwarce nad tabelą." : "Kolejność z Content Watchera: pilność (wyniki × wiek), potem wynik. Przy każdym powód."}
      />
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Toggles items={URGENCY.map((u) => ({ ...u, count: posts.filter((p) => p.urgency === u.key).length }))} active={active} onToggle={toggle} />
        <button
          type="button"
          aria-pressed={showSkipped}
          onClick={() => setShowSkipped((v) => !v)}
          className={cn(
            "inline-flex h-8 items-center gap-1.5 rounded border px-2.5 text-theme-xs font-medium",
            showSkipped ? "border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300" : "border-gray-200 text-gray-500 dark:border-gray-800",
          )}
        >
          Odłożone <b className="font-medium">{fmtInt(skipped.size)}</b>
        </button>
      </div>
      <DataGrid<Post>
        title="Wpisy"
        rows={posts}
        columns={columns}
        filter
        filterPlaceholder="Szukaj tytułu…"
        externalFilter={filter}
        rowKey={(p) => p.id}
        rowHeight={48}
        csvName={`${domain}-asystent-wpisy`}
      />
    </>
  );
}

function PendingNote({ domain, competitors, loadCompetitors }: Ctx) {
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const pending = (competitors?.items ?? []).filter((i: Any) => !i.action).length;
  if (!pending) return null;
  const sync = async () => {
    setBusy(true);
    try {
      for (let round = 0; round < 60; round += 1) {
        const { data } = await api<Any>(`/api/cw/writer/competitors/${domain}/sync`, { method: "POST", body: {} });
        setMsg(data.remaining ? `zostało ${fmtInt(data.remaining)}…` : "gotowe");
        if (!data.remaining) break;
      }
      await loadCompetitors();
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <p className="mt-5 flex flex-wrap items-center gap-3 rounded border border-gray-200 px-4 py-3 text-theme-sm text-gray-600 dark:border-gray-800 dark:text-gray-400">
      {fmtInt(pending)} wpisów czeka na porównanie z naszymi (robi się samo co rano).
      <button type="button" className={cn(btnSmall, "border border-gray-300 dark:border-gray-700")} disabled={busy} onClick={sync}>
        Porównaj teraz
      </button>
      <span>{msg}</span>
    </p>
  );
}

function CompetitorsWho(ctx: Ctx) {
  const { competitors, compError, inSeek } = ctx;
  if (compError) return <p className="text-theme-sm text-error-600">{compError}</p>;
  if (!competitors) return <Loading text="Wczytuję wpisy konkurencji…" />;
  const sites = competitors.sites ?? [];
  const gaps = (competitors.items ?? []).filter((i: Any) => inSeek("new", i)).length;
  return (
    <>
      <Back href={link("")} />
      <Question title="Z kim się porównujemy?" lede="Wpisy z blogów konkurencji zestawione z naszymi po tytułach." />
      <Choices
        items={[
          {
            href: link("konkurencja/co", { h: "all" }),
            tone: "konkurencja",
            title: "Ze wszystkimi naraz",
            badge: `${fmtInt(gaps)} tematów`,
            desc: "Jedna lista ze wszystkich śledzonych blogów.",
            meta: sites.map((s: Any) => (
              <span key={s.host}>
                <Favicon host={s.host} /> {s.host}: {fmtInt(s.count)} wpisów
              </span>
            )),
          },
          { href: link("konkurencja/wybierz"), tone: "konkurencja", title: "Z wybranymi", badge: `${fmtInt(sites.length)} do wyboru`, desc: "Zaznaczysz konkretnych konkurentów." },
        ]}
      />
      <PendingNote {...ctx} />
    </>
  );
}

function CompetitorsPick({ competitors, compError, inSeek, isFresh, route }: Ctx) {
  const [picked, setPicked] = useState<Set<string>>(() => new Set(hostsOf(route.q) ?? []));
  if (compError) return <p className="text-theme-sm text-error-600">{compError}</p>;
  if (!competitors) return <Loading text="Wczytuję…" />;
  const rows = (competitors.sites ?? []).map((site: Any) => {
    const items = (competitors.items ?? []).filter((i: Any) => i.host === site.host);
    return { host: site.host, total: items.length, gaps: items.filter((i: Any) => inSeek("new", i)).length, fresh: items.filter(isFresh).length };
  });
  return (
    <>
      <Back href={link("konkurencja")} />
      <Question title="Których konkurentów?" lede="Zaznacz jednego albo kilku." />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          go("konkurencja/co", { h: [...picked].join(",") });
        }}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {rows.map((row: Any) => (
            <label
              key={row.host}
              className={cn(
                "flex cursor-pointer flex-col gap-2 rounded-2xl border bg-white p-5 dark:bg-white/3",
                picked.has(row.host) ? "border-brand-500 ring-2 ring-brand-500" : "border-gray-200 dark:border-gray-800",
              )}
            >
              <span className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 font-medium">
                  <input
                    type="checkbox"
                    checked={picked.has(row.host)}
                    onChange={() =>
                      setPicked((cur) => {
                        const next = new Set(cur);
                        if (next.has(row.host)) next.delete(row.host);
                        else next.add(row.host);
                        return next;
                      })
                    }
                    className="size-4 accent-brand-500"
                  />
                  <Favicon host={row.host} />
                  {row.host}
                </span>
                <span className={cn("rounded px-2 py-0.5 text-theme-xs font-medium", TONE.konkurencja.badge)}>{fmtInt(row.gaps)} tematów</span>
              </span>
              <span className="text-theme-xs text-gray-500">
                Wpisów w sitemapie: {fmtInt(row.total)}
                {row.fresh ? ` · nowych w ${NEW_DAYS} dni: ${fmtInt(row.fresh)}` : ""}
              </span>
            </label>
          ))}
        </div>
        <div className="mt-5">
          <button type="submit" className={btnPrimary} disabled={!picked.size}>
            Dalej
          </button>
        </div>
      </form>
    </>
  );
}

function CompetitorsWhat(ctx: Ctx) {
  const { competitors, compError, inSeek, route } = ctx;
  const hosts = hostsOf(route.q);
  const backHref = hosts ? link("konkurencja/wybierz", { h: hosts.join(",") }) : link("konkurencja");
  if (compError) return <p className="text-theme-sm text-error-600">{compError}</p>;
  if (!competitors) return <Loading text="Liczę…" />;
  const items = (competitors.items ?? []).filter((i: Any) => !hosts || hosts.includes(i.host));
  const count = (seek: string) => fmtInt(items.filter((i: Any) => inSeek(seek, i)).length);
  const h = route.q.get("h") ?? "all";
  return (
    <>
      <Back href={backHref} />
      <Question title="Czego szukamy?" />
      <Choices
        items={[
          {
            href: link("konkurencja/lista", { h, co: "new" }),
            tone: "konkurencja",
            title: "Tematów, których nie mamy",
            badge: `${count("new")} tematów`,
            desc: "Konkurent ma poradnik albo hasło, a my nic bliskiego.",
            meta: ["Dalej: temat do nowego tekstu"],
          },
          {
            href: link("konkurencja/lista", { h, co: "check" }),
            tone: "odswiez",
            title: "Tematów, które mamy tylko częściowo",
            badge: `${count("check")} tematów`,
            desc: "Mamy wpis pokrewny. Zdecydujesz: rozbudować nasz czy napisać osobny.",
            meta: ["Dalej: edytor naszego wpisu albo nowy tekst"],
          },
          {
            href: link("konkurencja/lista", { h, co: "fresh" }),
            tone: "nowy",
            title: "Co nowego u konkurencji",
            badge: `${count("fresh")} wpisów`,
            desc: `Wszystko, co pojawiło się w ich sitemapach w ostatnich ${NEW_DAYS} dniach.`,
          },
        ]}
      />
      <PendingNote {...ctx} />
    </>
  );
}

function CompetitorsList({ domain, competitors, compError, route, SEEK, editorUrl }: Ctx) {
  const hosts = hostsOf(route.q);
  const seek = SEEK[route.q.get("co") ?? ""] ? route.q.get("co")! : "new";
  const h = route.q.get("h") ?? "all";
  // Filtr typów: domyślnie poradnik + słownik przy lukach, wszystko przy nowościach.
  const [active, toggle] = useToggleSet(SEEK[seek].contentOnly ? TYPES.filter((t) => t.content).map((t) => t.key) : TYPES.map((t) => t.key));
  const rows = useMemo(
    () => (competitors?.items ?? []).filter((i: Any) => (!hosts || hosts.includes(i.host)) && SEEK[seek].test(i)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [competitors, h, seek, SEEK],
  );
  const filter = useMemo(() => (i: Any) => active.has(typeOf(i)), [active]);
  const columns = useMemo<ColDef<Any>[]>(
    () => [
      {
        headerName: "Typ",
        colId: "kind",
        width: 120,
        valueGetter: ({ data }) => TYPE_LABEL[typeOf(data)],
        tooltipValueGetter: ({ data }) => data?.kind_basis,
        cellRenderer: ({ value }: { value: string }) => <span className="rounded bg-gray-100 px-2 py-0.5 text-theme-xs dark:bg-white/5">{value}</span>,
      },
      {
        field: "title",
        headerName: "Temat u konkurencji",
        flex: 2,
        minWidth: 260,
        cellRenderer: ({ data }: { data?: Any }) =>
          data && (
            <span className="truncate">
              <a className={cn(inlineLink, "font-medium")} href={data.url} target="_blank" rel="noopener noreferrer">
                {data.title}
              </a>
              {data.title_from === "slug" && <small className="text-gray-500"> z adresu</small>}
            </span>
          ),
      },
      {
        field: "host",
        headerName: "Konkurent",
        width: 170,
        cellRenderer: ({ value }: { value: string }) => (
          <span>
            <Favicon host={value} /> {value}
          </span>
        ),
      },
      {
        headerName: "W sitemapie od",
        colId: "seen",
        width: 140,
        valueGetter: ({ data }) => (data?.baseline ? "" : (data?.first_seen ?? "")),
        valueFormatter: ({ value }) => value || "przed śledzeniem",
        sort: seek === "fresh" ? "desc" : undefined,
      },
      {
        headerName: "Nasz najbliższy wpis",
        colId: "ours",
        flex: 1.5,
        minWidth: 200,
        hide: seek === "new",
        valueGetter: ({ data }) => (data?.action !== "new" ? (data?.target?.title ?? "") : ""),
        cellRenderer: ({ data, value }: { data?: Any; value: string }) =>
          value ? (
            <a className={inlineLink} href={data.target.catalog_id ? editorUrl(data.target.catalog_id) : data.target.url}>
              {value}
            </a>
          ) : (
            <span className="text-gray-400">–</span>
          ),
      },
      { field: "score", headerName: "Podobieństwo", width: 120, hide: seek === "new", type: "rightAligned", sort: seek === "check" ? "desc" : undefined, valueFormatter: ({ value }) => pct(value) },
      {
        headerName: "",
        colId: "act",
        pinned: "right",
        width: seek === "new" ? 170 : 290,
        sortable: false,
        cellRenderer: ({ data }: { data?: Any }) => {
          if (!data) return null;
          const write = (primary: boolean) => (
            <a
              key="w"
              href={link("nowy/fraza", { q: data.title, z: data.url })}
              className={cn(btnSmall, primary ? "bg-brand-500 text-gray-950 hover:bg-brand-400" : "border border-gray-300 text-gray-700 dark:border-gray-700 dark:text-gray-300")}
            >
              Napisz nasz tekst
            </a>
          );
          const refresh = (primary: boolean) =>
            data.target?.catalog_id && data.action !== "new" ? (
              <a
                key="r"
                href={editorUrl(data.target.catalog_id)}
                className={cn(btnSmall, primary ? "bg-brand-500 text-gray-950 hover:bg-brand-400" : "border border-gray-300 text-gray-700 dark:border-gray-700 dark:text-gray-300")}
              >
                Rozbuduj nasz
              </a>
            ) : null;
          return <span className="flex gap-1.5">{data.action === "refresh" ? [refresh(true), write(false)] : [write(true), refresh(false)]}</span>;
        },
      },
    ],
    [seek, editorUrl],
  );
  const lede = {
    new: "Wybierz temat, który napiszemy u nas. Na następnym kroku skrócisz tytuł do frazy i sprawdzimy go jeszcze raz.",
    check: "Przy każdym temacie nasz najbliższy wpis. Zdecyduj: rozbudować go czy napisać osobny tekst.",
    fresh: "Świeże wpisy konkurencji i ocena, czy mamy odpowiednik.",
  }[seek];

  if (compError) return <p className="text-theme-sm text-error-600">{compError}</p>;
  if (!competitors) return <Loading text="Wczytuję…" />;
  return (
    <>
      <Back href={link("konkurencja/co", { h })} />
      <Question title={SEEK[seek].label} lede={lede} />
      <div className="mb-3">
        <Toggles items={TYPES.map((t) => ({ key: t.key, label: t.label, count: rows.filter((i: Any) => typeOf(i) === t.key).length }))} active={active} onToggle={toggle} />
      </div>
      <DataGrid<Any>
        key={seek}
        title="Tematy"
        rows={rows}
        columns={columns}
        externalFilter={filter}
        filter
        rowKey={(i) => i.url}
        rowHeight={48}
        csvName={`${domain}-asystent-konkurencja-${seek}`}
      />
    </>
  );
}
