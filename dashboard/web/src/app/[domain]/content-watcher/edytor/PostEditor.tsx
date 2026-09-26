"use client";

/* Edytor wpisu Content Watchera: nagłówek, rozpoznanie SERP i treść
   konkurencji, belka pipeline'u z wytycznymi, dokument z propozycjami
   przebiegu, ocena treści z frazami, karty etapów końcowych i podgląd
   całości. Panele dzielą stan przez lib/cw-editor/store.ts, czyste funkcje
   są w lib/cw-editor/. Wpis wskazuje `?id=`. */
import { Status } from "@/components/kit";
import { Card } from "@/components/ui";
import { editorStore, useEditor } from "@/lib/cw-editor/store";
import type { Entry } from "@/lib/cw-editor/types";
import { fmtDate } from "@/lib/format";
import { api } from "@/lib/writer-client";
import { loadLatestJob, schedulePoll, stopPolling } from "@/lib/cw-editor/jobs";
import { ensureHighlights } from "@/lib/highlights";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { RivalsPanel, SerpPanel } from "./AnalysisPanels";
import DocPanel from "./DocPanel";
import EndCards from "./EndCards";
import PipelinePanel from "./PipelinePanel";
import PreviewDialog from "./PreviewDialog";
import ScorePanel from "./ScorePanel";

const pl = new Intl.NumberFormat("pl-PL");

export default function PostEditor({ domain }: { domain: string }) {
  const [state, setState] = useState<"loading" | "missing" | "error" | "ready">("loading");
  const [loadError, setLoadError] = useState("");
  const { entry } = useEditor();

  useEffect(() => {
    editorStore.reset();
    const contentId = new URLSearchParams(location.search).get("id") ?? "";
    api<{ items?: Entry[] }>(`/${domain}/content-watcher/catalog.json`)
      .then(({ data }) => {
        const found = (data.items ?? []).find((item) => item.id === contentId) ?? null;
        if (!found) return setState("missing");
        editorStore.set({ entry: found });
        setState("ready");
      })
      .catch((error) => {
        setLoadError(error instanceof Error ? error.message : "błąd");
        setState("error");
      });
  }, [domain]);

  // Ostatni przebieg wpisu i odpytywanie Workera, dopóki trwa. Po powrocie
  // na kartę odpytujemy od razu, z krótkim odstępem.
  useEffect(() => {
    if (state !== "ready" || !entry) return;
    ensureHighlights();
    loadLatestJob(domain, entry);
    const onVisible = () => document.visibilityState === "visible" && schedulePoll(true);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      stopPolling();
    };
  }, [state, entry, domain]);

  return (
    <>
      <Link href={`/${domain}/content-watcher/`} className="mb-4 inline-flex items-center gap-1.5 text-theme-sm text-gray-500 hover:text-brand-600 dark:text-gray-400">
        <ArrowLeft className="size-4" /> wróć do listy priorytetów
      </Link>

      {state === "loading" && <p className="text-theme-sm text-gray-500">wczytywanie wpisu…</p>}
      {state === "missing" && (
        <Card className="p-6 text-theme-sm text-gray-600 dark:text-gray-400">
          Nie wskazano wpisu. Wejdź tu z listy priorytetów, klikając „Edytor” przy wybranym artykule.
        </Card>
      )}
      {state === "error" && (
        <Card className="p-6">
          <h1 className="text-title-sm font-medium">Nie udało się wczytać katalogu wpisów</h1>
          <p className="mt-2 text-theme-sm text-error-600">{loadError}</p>
        </Card>
      )}

      {state === "ready" && entry && (
        <>
          <EntryHeader entry={entry} />
          <SerpPanel domain={domain} entry={entry} />
          <RivalsPanel domain={domain} entry={entry} />
          <div className="mt-6">
            <PipelinePanel domain={domain} />
          </div>
          {/* Na szerokim ekranie ocena z frazami i narzędzia końcowe jadą w
              przypiętej kolumnie obok dokumentu (ocenianie sekcji bez
              przewijania do góry); na węższym stoją nad dokumentem. */}
          <div className="mt-6 flex flex-col gap-6 min-[1500px]:flex-row-reverse min-[1500px]:items-start">
            <aside className="flex flex-col gap-4 min-[1500px]:sticky min-[1500px]:top-24 min-[1500px]:max-h-[calc(100vh-7rem)] min-[1500px]:w-[400px] min-[1500px]:shrink-0 min-[1500px]:overflow-y-auto">
              <ScorePanel />
              <EndCards domain={domain} />
            </aside>
            <div className="min-w-0 flex-1">
              <DocPanel domain={domain} />
            </div>
          </div>
          <PreviewDialog />
        </>
      )}
    </>
  );
}

function EntryHeader({ entry }: { entry: Entry }) {
  const { authorName } = useEditor();
  const path = (() => {
    try {
      return new URL(entry.url).pathname;
    } catch {
      return entry.url;
    }
  })();
  const meta: [string, string][] = [
    ["Publikacja", fmtDate(entry.published_at)],
    ["Zmiana treści", fmtDate(entry.updated_at)],
    ["Objętość", `${pl.format(entry.word_count ?? 0)} słów · ${pl.format(entry.headings ?? 0)} nagłówków`],
    // Po wdrożeniu z podmianą autora WordPress ma już nową osobę.
    ["Autor", authorName ?? entry.author ?? "–"],
  ];
  return (
    <header className="mb-8">
      {entry.pillar && (
        <div className="mb-2">
          <Status tone="mid">{entry.pillar}</Status>
        </div>
      )}
      <h1 className="text-title-sm font-medium text-gray-800 dark:text-white/90">{entry.title}</h1>
      <a className="mt-1 inline-block text-theme-sm text-gray-500 hover:text-brand-600 dark:text-gray-400" href={entry.url} target="_blank" rel="noopener">
        {path} ↗
      </a>
      <Card className="mt-4 grid grid-cols-2 gap-4 p-5 md:grid-cols-4">
        {meta.map(([label, value]) => (
          <div key={label} className="min-w-0">
            <dt className="text-theme-xs text-gray-500 dark:text-gray-400">{label}</dt>
            <dd className="mt-1 truncate text-theme-sm font-medium text-gray-800 dark:text-white/90">{value}</dd>
          </div>
        ))}
      </Card>
    </header>
  );
}
