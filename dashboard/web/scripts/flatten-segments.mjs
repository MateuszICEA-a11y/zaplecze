// Po `next build` (output: export): Next 16 zapisuje pliki prefetchu segmentów
// w katalogach (`__next.$d$domain/__PAGE__.txt`), a klient pyta o płaską nazwę
// (`__next.$d$domain.__PAGE__.txt`). Bez serwera Node nikt tego nie przepisze,
// więc dokładamy kopie pod płaskimi nazwami – nawigacja nie sypie 404.
import { copyFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const OUT = resolve(import.meta.dirname, "..", "out");
let copied = 0;

function files(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (!statSync(path).isDirectory() || name === "_next") continue;
    if (name.startsWith("__next.")) {
      for (const file of files(path)) {
        const flat = `${name}.${relative(path, file).split(/[\\/]/).join(".")}`;
        copyFileSync(file, join(dir, flat));
        copied++;
      }
    } else {
      walk(path);
    }
  }
}

walk(OUT);
console.log(`flatten-segments: ${copied} plików prefetchu pod płaskimi nazwami`);
