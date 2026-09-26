"use client";

/* Ocena treści liczona na żywo z dokumentu: objętość, struktura, linkowanie,
   świeżość i pokrycie fraz, których szuka konkurencja. Dokument buduje
   (jeszcze) legacy/edytor-script.ts – po każdej zmianie podbija docVersion,
   a my czytamy migawkę z DOM-u i przeliczamy wynik oraz podświetlenia fraz. */
import { Card } from "@/components/ui";
import { cn } from "@/lib/cn";
import {
  focusKeyword,
  hasPhrase,
  highlightKeywords,
  KEYWORD_SOURCE_HINT,
  keywordTargets,
  normalize,
  phraseVariant,
  scoreParts,
  totalScore,
  type KeywordTarget,
  type ScorePart,
} from "@/lib/cw-editor/keywords";
import { docMetrics } from "@/lib/cw-editor/snapshot";
import { useEditor } from "@/lib/cw-editor/store";
import { useEffect, useState } from "react";

const pl = new Intl.NumberFormat("pl-PL");
const level = (ratio: number) => (ratio >= 0.75 ? "ok" : ratio >= 0.5 ? "warn" : "low");
const BAR: Record<string, string> = { ok: "bg-success-500", warn: "bg-warning-500", low: "bg-error-500" };
const DIAL: Record<string, string> = { ok: "#12b76a", warn: "#f79009", low: "#f04438" };

type Scored = { parts: ScorePart[]; score: number; targets: (KeywordTarget & { used: boolean; variant: string | null })[] };

export default function ScorePanel() {
  const { entry, job, serp, rivals, docVersion } = useEditor();
  const [scored, setScored] = useState<Scored | null>(null);

  useEffect(() => {
    if (!entry) return;
    const metrics = docMetrics(entry, job);
    const targets = keywordTargets(serp, job, entry);
    const parts = scoreParts(metrics, targets, rivals, entry);
    setScored({
      parts,
      score: totalScore(parts),
      targets: targets.map((row) => {
        const used = hasPhrase(metrics.text, row.keyword);
        // Fraza policzona przez odmianę/przyimek – pokazujemy, jak brzmi w tekście.
        const variant = used ? phraseVariant(metrics.text, row.keyword) : null;
        return { ...row, used, variant: variant && normalize(variant) !== normalize(row.keyword) ? variant : null };
      }),
    });
    // Przełączenie widoku sekcji podmienia węzły tekstowe – zakresy
    // podświetleń trzeba policzyć na nowo przy każdej zmianie dokumentu.
    highlightKeywords(targets, job);
  }, [entry, job, serp, rivals, docVersion]);

  if (!scored) return null;
  const { parts, score, targets } = scored;
  const usedCount = targets.filter((row) => row.used).length;
  const tone = level(score / 100);

  return (
    <Card className="p-5">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-medium text-gray-800 dark:text-white/90">Ocena treści</h2>
        <span className="text-theme-xs text-gray-500 dark:text-gray-400">liczona z aktualnej treści w edytorze</span>
      </div>

      <div className="flex items-start gap-5">
        <div
          className="relative grid size-24 shrink-0 place-items-center rounded-full [--dial-track:var(--color-gray-100)] dark:[--dial-track:rgb(255_255_255/0.08)]"
          style={{ background: `conic-gradient(${DIAL[tone]} ${score}%, var(--dial-track) 0)` }}
          role="img"
          aria-label={`Ocena ${score} na 100`}
        >
          {/* Środek w kolorze karty (dark: bg-white/3 na gray-950). */}
          <div className="absolute inset-2 rounded-full bg-white dark:bg-[#070c29]" />
          <div className="relative text-center leading-none">
            <b className="block text-title-sm font-medium text-gray-800 tabular-nums dark:text-white/90">{score}</b>
            <span className="text-theme-xs text-gray-500">na 100</span>
          </div>
        </div>
        <div className="grid min-w-0 flex-1 gap-2.5">
          {parts.map((part) => (
            <div key={part.label} className="min-w-0">
              <div className="flex items-baseline justify-between gap-2 text-theme-xs">
                <span className="text-gray-700 dark:text-gray-300">{part.label}</span>
                <span className="text-right text-gray-500 tabular-nums dark:text-gray-400">{part.detail}</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-white/5">
                <i className={cn("block h-full rounded-full", BAR[level(part.ratio)])} style={{ width: `${Math.round(part.ratio * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 border-t border-gray-100 pt-4 dark:border-gray-800">
        <div className="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h3 className="text-theme-sm font-medium text-gray-800 dark:text-white/90">Frazy do pokrycia</h3>
          <span className="text-theme-xs text-gray-500 dark:text-gray-400">
            {targets.length
              ? `${pl.format(usedCount)} z ${pl.format(targets.length)} użytych w treści · podświetlone w dokumencie`
              : serp
                ? "brak fraz do pokrycia – Senuto nie zna fraz tych konkurentów"
                : "uruchom „Sprawdź SERP”, żeby zobaczyć listę"}
          </span>
        </div>
        <ul className="grid gap-0.5">
          {targets.map((row) => (
            <KeywordRow key={row.keyword} row={row} />
          ))}
        </ul>
        <p className="mt-3 text-theme-xs leading-relaxed text-gray-500 dark:text-gray-400">
          W dokumencie zaznaczamy każde wystąpienie – także w nagłówku i w odmienionej formie.{" "}
          <span className="inline-block h-2.5 w-5 rounded-sm bg-[#f6704c]/35 align-middle" /> było w tekście{" "}
          <span className="inline-block h-2.5 w-5 rounded-sm bg-success-500/35 align-middle" /> dopisane w tym przebiegu
        </p>
      </div>
    </Card>
  );
}

function KeywordRow({ row }: { row: Scored["targets"][number] }) {
  // Znacznik mówi o TEKŚCIE (czy fraza w nim pada), opis po prawej – o WYNIKACH
  // w Google. „✓ · nie mamy" nie jest sprzecznością: fraza jest w treści, ale
  // wpis nie jest na nią widoczny. Brak to czerwony minus, nie plus: plus
  // czytało się jak „dodaj", a to jest stan braku.
  const content = (
    <>
      <span className={cn("font-bold", row.used ? "text-success-600" : "text-error-600")} title={row.used ? "fraza występuje w treści wpisu" : "brakuje jej w treści wpisu"}>
        {row.used ? "✓" : "−"}
      </span>
      <span className="min-w-0">
        <span className={cn("block truncate", row.used ? "text-gray-800 group-hover:underline dark:text-white/90" : "text-gray-600 dark:text-gray-400")}>{row.keyword}</span>
        {row.variant && <small className="block text-theme-xs text-gray-500 italic">w tekście: „{row.variant}"</small>}
      </span>
      <span className="text-right text-theme-xs whitespace-nowrap text-gray-500 tabular-nums" title={KEYWORD_SOURCE_HINT[row.source] ?? ""}>
        {[row.searches ? `${pl.format(row.searches)}/mies.` : null, row.note].filter(Boolean).join(" · ")}
      </span>
    </>
  );
  const grid = "grid w-full grid-cols-[16px_minmax(0,1fr)_auto] items-baseline gap-2 rounded px-1.5 py-1 text-left text-theme-sm";
  // Fraza obecna w tekście jest łączem do swojego miejsca w dokumencie –
  // inaczej trzeba jej szukać wzrokiem po podświetleniach.
  return (
    <li>
      {row.used ? (
        <button type="button" className={cn(grid, "group hover:bg-gray-50 dark:hover:bg-white/5")} title="przejdź do tej frazy w treści" onClick={() => focusKeyword(row.keyword)}>
          {content}
        </button>
      ) : (
        <div className={grid}>{content}</div>
      )}
    </li>
  );
}
