"use client";

/* Style starego frontu dla edytorów (edytor wpisu CW, edytor tekstu projektu
   CWr): klasy zawężone do .legacy (legacy.css), kolory z mostka tokenów
   (tokens.css), plus reguły ::highlight() dla podświetleń fraz. */
import { HIGHLIGHT_CSS } from "./highlights";
import "./legacy.css";
import "./tokens.css";

/** Reguły ::highlight() (podświetlenia fraz) – raz na stronę. Parser CSS
    Next.js ich nie zna, więc idą przez <style> wstrzyknięty w przeglądarce. */
export function ensureHighlights() {
  if (document.getElementById("legacy-highlights")) return;
  document.head.append(Object.assign(document.createElement("style"), { id: "legacy-highlights", textContent: HIGHLIGHT_CSS }));
}
