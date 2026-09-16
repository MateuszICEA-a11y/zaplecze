// Buduje bookmarklet Fan-out Explorer z tools-src/fanout-explorer.js:
//   public/tools/fanout-explorer.js               – czytelne źródło (do przeglądania)
//   public/tools/fanout-explorer.min.js           – zminifikowany kod (do wklejenia w konsolę)
//   public/tools/fanout-explorer.bookmarklet.txt  – bookmarklet standalone (cały kod w jednym URL javascript:)
// Wersja „loader” (krótka zakładka dociągająca kod z widocznosc.ai) nie istnieje celowo:
// CSP chatgpt.com blokuje connect-src i script-src spoza własnych domen (sprawdzone 2026-09-16,
// dotyczy też cdn.jsdelivr.net), więc jedyną działającą drogą jest cały kod w zakładce.
// Uruchom: node scripts/build-fanout-bookmarklet.mjs
import { readFile, writeFile, mkdir, realpath } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { Buffer } from 'node:buffer';
import process from 'node:process';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
// esbuild siedzi w drzewie pnpm pod astro – rozwiązujemy go stamtąd, bez osobnej zależności
const astroDir = await realpath(path.join(root, 'node_modules', 'astro'));
const require = createRequire(path.join(astroDir, 'package.json'));
const esbuild = await import(pathToFileURL(require.resolve('esbuild')).href);

const SRC = path.join(root, 'tools-src', 'fanout-explorer.js');
const OUT = path.join(root, 'public', 'tools');

const source = await readFile(SRC, 'utf8');
const version = (source.match(/VERSION = '([^']+)'/) || [])[1] || '0.0.0';

const { code } = await esbuild.transform(source, {
  minify: true,
  target: 'es2018',
  charset: 'utf8',
  legalComments: 'none',
});
const min = code.trim().replace(/;$/, '');

// javascript: URL – wystarczy zakodować znaki, które łamią URL w pasku zakładek
const toBookmarklet = (js) =>
  'javascript:' +
  encodeURIComponent(js)
    .replace(/%20/g, ' ')
    .replace(/%3B/g, ';')
    .replace(/%2C/g, ',')
    .replace(/%3A/g, ':')
    .replace(/%2F/g, '/');

await mkdir(OUT, { recursive: true });
await writeFile(path.join(OUT, 'fanout-explorer.js'), source, 'utf8');
await writeFile(
  path.join(OUT, 'fanout-explorer.min.js'),
  `/* Fan-out Explorer v${version} – widocznosc.ai/narzedzia/fanout-explorer/ */\n` + min + '\n',
  'utf8'
);
await writeFile(path.join(OUT, 'fanout-explorer.bookmarklet.txt'), toBookmarklet(min), 'utf8');

const kb = (s) => (Buffer.byteLength(s, 'utf8') / 1024).toFixed(1) + ' KB';
process.stdout.write(
  `Fan-out Explorer v${version}: min ${kb(min)}, bookmarklet ${kb(toBookmarklet(min))}`
);
