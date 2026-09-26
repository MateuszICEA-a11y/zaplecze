"use client";

/* Host przeniesionych 1:1 edytorów (edytor wpisu CW, projekt artykułu CWr):
   wstawia ich znaczniki w kontenerze .legacy i uruchamia oryginalną logikę
   (mount()). Style starego frontu są zawężone do .legacy (legacy.css), kolory
   idą z mostka tokenów (tokens.css).

   Ta logika zakłada, że żyje na osobnej stronie – nasłuchy na document, pętle
   odpytujące Workera. Dlatego wyjście z edytora nawigacją aplikacji kończy się
   pełnym przeładowaniem strony docelowej, a nie „miękką" podmianą widoku. */
import { useEffect, useRef } from "react";
import { HIGHLIGHT_CSS } from "./highlights";
import "./legacy.css";
import "./tokens.css";

const MODULES = {
  edytor: () => import("./edytor-script"),
  projekt: () => import("./projekt-script"),
} as const;

export default function LegacyHost({ html, module }: { html: string; module: keyof typeof MODULES }) {
  const mounted = useRef(false);

  useEffect(() => {
    const path = location.pathname;
    if (!mounted.current) {
      mounted.current = true;
      if (!document.getElementById("legacy-highlights")) {
        const style = Object.assign(document.createElement("style"), { id: "legacy-highlights", textContent: HIGHLIGHT_CSS });
        document.head.append(style);
      }
      MODULES[module]()
        .then((mod) => mod.mount())
        .catch((error) => console.error(`[legacy:${module}]`, error));
    }
    return () => {
      // W trybie dev React odpina i podpina efekt – przeładowujemy tylko przy
      // realnym opuszczeniu strony (inna ścieżka niż przy montowaniu).
      setTimeout(() => {
        if (location.pathname !== path) location.reload();
      }, 0);
    };
  }, [module]);

  return <div className="legacy" dangerouslySetInnerHTML={{ __html: html }} />;
}
