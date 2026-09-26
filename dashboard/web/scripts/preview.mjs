// Podgląd statycznego eksportu (out/): `npm run preview` → http://127.0.0.1:4410
// Katalogi rozwiązuje na index.html jak Workers Assets. Zapytania /api/* idą do
// produkcyjnego workera (dane i importy są prawdziwe!) z hasłem DASH_PASSWORD
// z .env w katalogu głównym repo – bez niego API w podglądzie zwraca 503.
import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..", "out");
const PORT = Number(process.env.PORT ?? 4410);
const API = process.env.API_URL ?? "https://zaplecze-dashboard.m-wisniewski.workers.dev";
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

function dashPassword() {
  if (process.env.DASH_PASSWORD) return process.env.DASH_PASSWORD;
  const envFile = resolve(import.meta.dirname, "..", "..", "..", ".env");
  if (!existsSync(envFile)) return null;
  const line = readFileSync(envFile, "utf8").split(/\r?\n/).find((l) => l.startsWith("DASH_PASSWORD="));
  return line ? line.slice("DASH_PASSWORD=".length).trim().replace(/^["']|["']$/g, "") : null;
}
const password = dashPassword();

async function proxy(req, res) {
  if (!password) {
    res.writeHead(503, { "content-type": TYPES[".json"] });
    return res.end(JSON.stringify({ error: "Podgląd bez DASH_PASSWORD – API niedostępne." }));
  }
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const headers = { Authorization: `Basic ${Buffer.from(`x:${password}`).toString("base64")}`, Origin: API };
  for (const name of ["content-type", "x-cw-request", "x-filename"]) {
    if (req.headers[name]) headers[name] = req.headers[name];
  }
  try {
    const upstream = await fetch(API + req.url, {
      method: req.method,
      headers,
      body: ["GET", "HEAD"].includes(req.method) ? undefined : Buffer.concat(chunks),
    });
    res.writeHead(upstream.status, { "content-type": upstream.headers.get("content-type") ?? TYPES[".json"] });
    res.end(Buffer.from(await upstream.arrayBuffer()));
  } catch (error) {
    res.writeHead(502, { "content-type": TYPES[".json"] });
    res.end(JSON.stringify({ error: `Proxy API: ${error.message}` }));
  }
}

createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url ?? "/", "http://x").pathname);
  if (path.startsWith("/api/")) return void proxy(req, res);
  let file = normalize(join(ROOT, path));
  if (!file.startsWith(ROOT)) return res.writeHead(403).end();
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
  if (!existsSync(file)) {
    res.writeHead(404, { "content-type": TYPES[".html"] });
    return createReadStream(join(ROOT, "404.html")).pipe(res);
  }
  res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" });
  createReadStream(file).pipe(res);
}).listen(PORT, "127.0.0.1", () =>
  console.log(`Podgląd: http://127.0.0.1:${PORT}/  (API → ${API}${password ? "" : ", brak DASH_PASSWORD"})`),
);
