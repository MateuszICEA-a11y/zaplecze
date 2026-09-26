// Składa legacy.css dla przeniesionych 1:1 edytorów: style ze starego frontu
// (src/legacy/css/*) z każdym selektorem zawężonym do kontenera `.legacy`,
// żeby nie dotykały reszty aplikacji. Tokeny kolorów – src/legacy/tokens.css.
// Uruchom po zmianie plików w src/legacy/css:  node scripts/build-legacy-css.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import postcss from "postcss";

const DIR = resolve(import.meta.dirname, "..", "src", "legacy");
const SCOPE = ".legacy";

/* theme.css: pomijamy @font-face, bloki tokenów (:root) i html/body – te daje
   nowy front i tokens.css; reszta to klasy komponentów używane w edytorach. */
const SKIP_SELECTOR = /^(:root|:root\[data-theme='light'\]|html|body)$/;
const SOURCES = ["theme.css", "writer.css", "writer-editor.css", "edytor-scoped.css", "edytor-global.css"];

function scopeSelector(selector) {
  return selector
    .split(",")
    .map((part) => {
      const s = part.trim().replace(/:global\(([^)]*)\)/g, "$1");
      if (!s) return s;
      // Stary motyw: ciemny domyślnie, jasny pod [data-theme='light'] – u nas odwrotnie (.dark).
      if (s.startsWith(":root[data-theme='light'] ")) return s.replace(":root[data-theme='light'] ", `html:not(.dark) ${SCOPE} `);
      // Stan całej strony (html.we-open – edytor na pełny ekran blokuje przewijanie) zostaje globalny.
      if (/^html[.:[]/.test(s)) return s;
      if (/^(html|body|:root)\b/.test(s)) return s.replace(/^(html|body|:root)(\[[^\]]*\])?/, SCOPE);
      if (s.startsWith("::backdrop") || s.startsWith("dialog::backdrop")) return s;
      return `${SCOPE} ${s}`;
    })
    .join(", ");
}

/* ::highlight() (CSS Custom Highlight API) jest globalne, a parser CSS Next.js
   go nie zna – takie reguły idą do highlights.ts i wstrzykuje je LegacyHost. */
const highlights = [];

const scope = () => ({
  postcssPlugin: "legacy-scope",
  Once(root) {
    root.walkAtRules("font-face", (rule) => rule.remove());
    root.walkRules((rule) => {
      if (rule.parent?.type === "atrule" && /keyframes/.test(rule.parent.name)) return;
      if (rule.selector.includes("::highlight(")) {
        highlights.push(rule.toString().replace(/:global\(([^)]*)\)/g, "$1").trim());
        rule.remove();
        return;
      }
      if (SKIP_SELECTOR.test(rule.selector.trim())) {
        rule.remove();
        return;
      }
      rule.selector = scopeSelector(rule.selector);
    });
  },
});
scope.postcss = true;

let out = `/* WYGENEROWANE przez scripts/build-legacy-css.mjs – nie edytuj ręcznie.\n   Źródła: src/legacy/css/*. */\n`;
for (const file of SOURCES) {
  const css = readFileSync(resolve(DIR, "css", file), "utf8");
  const result = await postcss([scope]).process(css, { from: file });
  out += `\n/* ===== ${file} ===== */\n${result.css}\n`;
}
writeFileSync(resolve(DIR, "legacy.css"), out);
writeFileSync(
  resolve(DIR, "highlights.ts"),
  "/* WYGENEROWANE przez scripts/build-legacy-css.mjs – reguły ::highlight() edytorów. */\n" +
    `export const HIGHLIGHT_CSS = ${JSON.stringify(highlights.join("\n"))};\n`,
);
console.log(`legacy.css: ${out.length} znaków z ${SOURCES.length} plików, ${highlights.length} reguł ::highlight`);
