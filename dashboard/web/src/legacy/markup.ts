/* Znaczniki przeniesionego edytora wpisu (build time) – z podstawioną domeną.
   Trzy części, bo między nimi stoją już panele React (edytor/PostEditor.tsx):
   belka pipeline'u, narzędzia w kolumnie bocznej i dokument. */
import "server-only";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export type EditorMarkup = { top: string; side: string; doc: string };

const read = (name: string, domain: string) =>
  readFileSync(resolve(process.cwd(), "src", "legacy", `${name}.html`), "utf8").replaceAll("__DOMAIN__", domain);

export function editorMarkup(domain: string): EditorMarkup {
  return { top: read("edytor-top", domain), side: read("edytor-side", domain), doc: read("edytor-doc", domain) };
}
