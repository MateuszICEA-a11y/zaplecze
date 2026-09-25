// Podgląd statycznego eksportu (out/) bez zależności: `npm run preview` → http://127.0.0.1:4410
// Katalogi rozwiązuje na index.html jak Workers Assets; /api/* nie jest obsługiwane.
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..", "out");
const PORT = Number(process.env.PORT ?? 4410);
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url ?? "/", "http://x").pathname);
  let file = normalize(join(ROOT, path));
  if (!file.startsWith(ROOT)) return res.writeHead(403).end();
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
  if (!existsSync(file)) {
    res.writeHead(404, { "content-type": TYPES[".html"] });
    return createReadStream(join(ROOT, "404.html")).pipe(res);
  }
  res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" });
  createReadStream(file).pipe(res);
}).listen(PORT, "127.0.0.1", () => console.log(`Podgląd: http://127.0.0.1:${PORT}/`));
