import type { NextConfig } from "next";

// Statyczny eksport: `next build` → out/. Serwuje go istniejący worker
// (dashboard/app/worker.js) jako assets – bez serwera Node i bez Vercela.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  turbopack: { root: __dirname },
};

export default nextConfig;
