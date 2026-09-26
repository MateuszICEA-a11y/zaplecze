/* Frazy do pokrycia, ocena treści i podświetlanie fraz w dokumencie edytora
   wpisu. Dopasowanie z odmianą i przyimkami – lib/phrase-match.js (lustro
   pipeline/matching.py). */
import { findPhrase, hasPhrase } from "@/lib/phrase-match.js";
import { docBaselineText, type DocMetrics } from "./snapshot";
import type { Entry, Job, RivalsAnalysis, SerpAnalysis } from "./types";

const pl = new Intl.NumberFormat("pl-PL");

export const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ł/g, "l")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export { hasPhrase };

/** Odmiana frazy faktycznie użyta w tekście – pokazujemy ją na liście fraz. */
export function phraseVariant(text: string, phrase: string) {
  const hit = findPhrase(text, phrase)[0];
  return hit ? text.slice(hit.start, hit.end).replace(/\s+/g, " ").trim() : null;
}

export type KeywordTarget = { keyword: string; searches: number | null; note: string; source: string };

/** Skąd wzięła się fraza na liście – dymek przy opisie po prawej. */
export const KEYWORD_SOURCE_HINT: Record<string, string> = {
  missing: "Konkurent z czołówki jest na nią widoczny, nasz wpis wcale (dane Senuto).",
  weak: "Jesteśmy na nią widoczni, ale poza pierwszą dziesiątką (dane Senuto).",
  brief: "Fraza z wytycznych przygotowanych przez model na podstawie analizy.",
  own: "Nasza fraza z Senuto spoza podium – najtańszy zysk do wyciągnięcia.",
};

/** Frazy, które wpis powinien pokryć: luki wobec konkurencji z rozpoznania
    SERP i lista z wytycznych. Bez nich panel pokazuje samą strukturę. */
export function keywordTargets(serp: SerpAnalysis | null, job: Job | null, entry: Entry | null): KeywordTarget[] {
  const out = new Map<string, KeywordTarget>();
  for (const row of serp?.gap ?? []) {
    if (row.status === "covered") continue;
    out.set(normalize(row.keyword), {
      keyword: row.keyword,
      searches: row.searches,
      note: row.status === "missing" ? "nie mamy" : `poza TOP 10 (poz. ${row.our_position})`,
      source: row.status,
    });
  }
  const brief = job?.steps?.find((step) => step.step === "brief")?.payload;
  for (const row of brief?.keywords_to_cover ?? []) {
    const key = normalize(row.keyword ?? "");
    if (!key || out.has(key)) continue;
    out.set(key, { keyword: row.keyword, searches: row.volume ?? null, note: "z wytycznych", source: "brief" });
  }
  // Własne frazy spoza podium: wpis już jest na nie widoczny, więc dopracowanie
  // treści pod nie jest najtańszym zyskiem, jaki da się tu zobaczyć.
  for (const row of entry?.senuto_keywords ?? []) {
    const key = normalize(row.keyword ?? "");
    if (!key || out.has(key) || (row.position ?? 99) <= 3) continue;
    out.set(key, { keyword: row.keyword, searches: row.searches ?? null, note: `nasza poz. ${row.position}`, source: "own" });
  }
  return [...out.values()].slice(0, 24);
}

/* ---------- ocena treści ----------
   Wzorem narzędzi contentowych: kilka mierzalnych składowych zamiast jednej
   nieprzejrzystej liczby. Każda liczona z tego, co widać w edytorze, więc
   wynik rośnie w trakcie pisania. Składowe bez danych są pomijane – lepiej
   policzyć wynik z trzech rzeczy niż udawać, że brakujące dane to zero. */

const WORDS_FALLBACK = 1200; // gdy nie znamy jeszcze długości tekstów konkurencji

export type ScorePart = { label: string; detail: string; ratio: number };

export function scoreParts(metrics: DocMetrics, targets: KeywordTarget[], rivals: RivalsAnalysis | null, entry: Entry | null): ScorePart[] {
  // Cel objętości: mediana tekstów z czołówki, o ile je przeczytaliśmy.
  const target = rivals?.median_words || WORDS_FALLBACK;
  const parts: ScorePart[] = [];
  const clamp = (value: number) => Math.max(0, Math.min(1, value));

  parts.push({
    label: "Objętość",
    detail: rivals?.median_words
      ? `${pl.format(metrics.words)} z ${pl.format(target)} słów (mediana czołówki)`
      : `${pl.format(metrics.words)} z ~${pl.format(target)} słów`,
    ratio: clamp(metrics.words / target),
  });

  // Jeden nagłówek na ~250 słów – gęstsza siatka ułatwia skanowanie tekstu.
  const headingsTarget = Math.max(3, Math.round(metrics.words / 250));
  parts.push({
    label: "Nagłówki",
    detail: `${pl.format(metrics.headings)} z ~${pl.format(headingsTarget)}`,
    ratio: clamp(metrics.headings / headingsTarget),
  });

  parts.push({ label: "Linki wewnętrzne", detail: `${pl.format(metrics.internal)} z 3`, ratio: clamp(metrics.internal / 3) });

  if (targets.length) {
    const covered = targets.filter((row) => hasPhrase(metrics.text, row.keyword)).length;
    parts.push({
      label: "Pokrycie fraz",
      detail: `${pl.format(covered)} z ${pl.format(targets.length)}`,
      ratio: clamp(covered / targets.length),
    });
  }

  const updated = entry?.updated_at ? Date.parse(`${entry.updated_at}T00:00:00Z`) : NaN;
  if (Number.isFinite(updated)) {
    const days = Math.floor((Date.now() - updated) / 86_400_000);
    // Świeży wpis do pół roku; po półtora roku składowa schodzi do zera.
    parts.push({
      label: "Świeżość",
      detail: days <= 0 ? "dziś" : `${pl.format(days)} dni od zmiany treści`,
      ratio: clamp((540 - days) / 360),
    });
  }
  return parts;
}

export const totalScore = (parts: ScorePart[]) =>
  parts.length ? Math.round((parts.reduce((sum, part) => sum + part.ratio, 0) / parts.length) * 100) : 0;

/* ---------- podświetlanie fraz w dokumencie ----------
   Przez CSS Custom Highlight API, nie przez wstawianie <mark> – dokument
   jest edytowalny i zapisywany do zadania, więc jego HTML musi zostać
   nietknięty. Gdy przeglądarka API nie zna, po prostu nie ma podświetleń. */

const HIGHLIGHT_SCOPE = ".ed-doc-body, .ed-sec-head h1, .ed-sec-head h2, .ed-sec-head h3, .ed-diff";
const highlightsOn = () => typeof Highlight !== "undefined" && Boolean(CSS?.highlights);

/** Węzły tekstowe elementu jako jeden ciąg + mapa pozycji na węzły. */
function textMap(root: Element) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const parts: { node: Text; start: number }[] = [];
  let text = "";
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    parts.push({ node: node as Text, start: text.length });
    text += node.textContent ?? "";
  }
  return { text, parts };
}

function rangeFor(parts: { node: Text; start: number }[], start: number, end: number) {
  let from = null;
  let to = null;
  for (const part of parts) {
    if (part.start <= start) from = part;
    if (part.start <= end - 1) to = part;
  }
  if (!from || !to) return null;
  const range = document.createRange();
  range.setStart(from.node, start - from.start);
  range.setEnd(to.node, end - to.start);
  return range;
}

function scopes() {
  const doc = document.querySelector("[data-ed-doc]");
  return doc ? [...doc.querySelectorAll<HTMLElement>(HIGHLIGHT_SCOPE)] : [];
}

export function highlightKeywords(targets: KeywordTarget[], job: Job | null) {
  if (!highlightsOn()) return;
  CSS.highlights.delete("cw-keyword");
  CSS.highlights.delete("cw-keyword-new");
  if (!targets.length) return;
  const baseline = docBaselineText(job);
  const known: Range[] = [];
  const fresh: Range[] = [];
  for (const scope of scopes()) {
    const { text, parts } = textMap(scope);
    if (!text.trim()) continue;
    for (const target of targets) {
      // Fraza dopisana przebiegiem dostaje inny kolor niż ta, która była
      // w tekście od początku – widać, co realnie wniosła propozycja.
      const bucket = hasPhrase(baseline, target.keyword) ? known : fresh;
      for (const hit of findPhrase(text, target.keyword)) {
        const range = rangeFor(parts, hit.start, hit.end);
        if (range) bucket.push(range);
      }
    }
  }
  if (known.length) CSS.highlights.set("cw-keyword", new Highlight(...known));
  if (fresh.length) CSS.highlights.set("cw-keyword-new", new Highlight(...fresh));
}

/** Wszystkie zakresy tekstu z tą frazą w dokumencie. */
function keywordRanges(keyword: string) {
  const out: Range[] = [];
  for (const scope of scopes()) {
    const { text, parts } = textMap(scope);
    if (!text.trim()) continue;
    for (const hit of findPhrase(text, keyword)) {
      const range = rangeFor(parts, hit.start, hit.end);
      if (range) out.push(range);
    }
  }
  return out;
}

let focusTimer = 0;
const focusCursor = new Map<string, number>();

/** Przewinięcie do wystąpienia frazy w treści – kliknięcie w pozycję listy.
    Kolejne kliknięcia tej samej frazy idą do następnych wystąpień, bo przy
    frazie użytej kilka razy skok wciąż w to samo miejsce niczego nie mówi. */
export function focusKeyword(keyword: string) {
  const ranges = keywordRanges(keyword);
  if (!ranges.length) return false;
  const index = (focusCursor.get(keyword) ?? -1) + 1;
  const range = ranges[index % ranges.length];
  focusCursor.set(keyword, index);

  range.startContainer.parentElement?.scrollIntoView({ behavior: "smooth", block: "center" });
  if (highlightsOn()) {
    CSS.highlights.set("cw-keyword-focus", new Highlight(range));
    window.clearTimeout(focusTimer);
    focusTimer = window.setTimeout(() => CSS.highlights.delete("cw-keyword-focus"), 2600);
  }
  return true;
}
