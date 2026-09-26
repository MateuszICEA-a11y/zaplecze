"use client";

/* Klocki dla przeniesionych 1:1 modułów vanilla (edytor wpisu CW, edytor
   tekstu projektu CWr). Style starego frontu są zawężone do .legacy
   (legacy.css), kolory idą z mostka tokenów (tokens.css).

   Ta logika zakłada, że żyje na osobnej stronie – nasłuchy na document, pętle
   odpytujące Workera. Dlatego wyjście z takiej strony nawigacją aplikacji
   kończy się pełnym przeładowaniem strony docelowej (useReloadOnLeave). */
import { memo, useEffect } from "react";
import { HIGHLIGHT_CSS } from "./highlights";
import "./legacy.css";
import "./tokens.css";

/** Reguły ::highlight() (podświetlenia fraz) – raz na stronę. */
export function ensureHighlights() {
  if (document.getElementById("legacy-highlights")) return;
  document.head.append(Object.assign(document.createElement("style"), { id: "legacy-highlights", textContent: HIGHLIGHT_CSS }));
}

/** Pełne przeładowanie po opuszczeniu strony z modułem vanilla. W trybie dev
    React odpina i podpina efekt – przeładowujemy tylko przy realnym wyjściu
    (inna ścieżka niż przy montowaniu). */
export function useReloadOnLeave() {
  useEffect(() => {
    const path = location.pathname;
    return () => {
      setTimeout(() => {
        if (location.pathname !== path) location.reload();
      }, 0);
    };
  }, []);
}

/** Statyczny fragment znaczników dla modułu vanilla. memo pilnuje, żeby
    React nigdy nie nadpisał DOM-u, który moduł zdążył przebudować. */
export const LegacyChunk = memo(function LegacyChunk({ html, className = "" }: { html: string; className?: string }) {
  return <div className={`legacy ${className}`.trim()} dangerouslySetInnerHTML={{ __html: html }} />;
});
