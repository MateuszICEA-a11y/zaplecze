/* Znaczniki edytorów ze starego frontu (build time) – z podstawioną domeną. */
import "server-only";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export function legacyMarkup(name: "edytor" | "projekt", domain: string): string {
  const file = resolve(process.cwd(), "src", "legacy", `${name}.html`);
  return readFileSync(file, "utf8").replaceAll("__DOMAIN__", domain);
}
