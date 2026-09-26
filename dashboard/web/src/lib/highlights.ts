/* Podświetlenia fraz w edytorach (CSS Custom Highlight API): zakresy, nie
   elementy, więc nie da się ich ostylować klasami. Parser CSS Next.js nie zna
   ::highlight(), dlatego reguły idą przez <style> wstrzyknięty w przeglądarce.
   Kolory półprzezroczyste – czytelne na jasnym i ciemnym tle. */
const HIGHLIGHT_CSS = `
/* Edytor wpisu CW: „było w tekście” musi mieć INNY kolor niż „dopisane”, nie inny odcień. */
::highlight(cw-keyword) { background-color: rgb(246 112 76 / 0.32); }
::highlight(cw-keyword-new) { background-color: rgb(18 183 106 / 0.32); }
/* Wystąpienie, do którego przeskoczyliśmy z listy fraz – gaśnie samo po chwili. */
::highlight(cw-keyword-focus) { background-color: rgb(87 104 255 / 0.55); }
/* Edytor tekstu projektu CWr: frazy z listy i fraza wskazana w panelu. */
::highlight(we-term) { background-color: rgb(247 144 9 / 0.18); }
::highlight(we-term-now) { background-color: #5768ff; color: #000623; }
`;

/** Reguły ::highlight() – raz na stronę. */
export function ensureHighlights() {
  if (document.getElementById("editor-highlights")) return;
  document.head.append(Object.assign(document.createElement("style"), { id: "editor-highlights", textContent: HIGHLIGHT_CSS }));
}
