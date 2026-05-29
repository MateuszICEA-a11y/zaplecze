// Hero dla /geo/co-google-przemilcza – Google "G" w kanwie widocznosc.ai.
// Render SVG -> WebP 2048x1152 (16:9) przez sharp. Jednorazowy generator.
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dir, '../src/assets/images/blog-geo-co-google-przemilcza.webp');

const W = 2048;
const H = 1152;
const cx = W / 2;
const cy = H / 2;

// Oficjalne 4-kolorowe Google "G" (viewBox 48x48), wyskalowane i wyśrodkowane.
const gScale = 12; // 48 * 12 = 576 px
const gSize = 48 * gScale;
const gx = cx - gSize / 2;
const gy = cy - gSize / 2;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0a0d14"/>
      <stop offset="100%" stop-color="#07080b"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#2667ff" stop-opacity="0.55"/>
      <stop offset="45%" stop-color="#0a9cff" stop-opacity="0.28"/>
      <stop offset="100%" stop-color="#3ddc97" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="mint" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#3ddc97" stop-opacity="0.30"/>
      <stop offset="100%" stop-color="#3ddc97" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="disc" cx="50%" cy="38%" r="65%">
      <stop offset="0%" stop-color="#141a24"/>
      <stop offset="100%" stop-color="#0b0e15"/>
    </radialGradient>
    <radialGradient id="vignette" cx="50%" cy="50%" r="75%">
      <stop offset="60%" stop-color="#000000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.55"/>
    </radialGradient>
  </defs>

  <!-- tło kanwy -->
  <rect width="${W}" height="${H}" fill="url(#bg)"/>

  <!-- poświata: niebieska główna + mintowy offset -->
  <ellipse cx="${cx}" cy="${cy}" rx="760" ry="640" fill="url(#glow)"/>
  <ellipse cx="${cx + 180}" cy="${cy + 120}" rx="520" ry="460" fill="url(#mint)"/>

  <!-- okrąg "kanwy" pod logo -->
  <circle cx="${cx}" cy="${cy}" r="420" fill="url(#disc)" stroke="rgba(255,255,255,0.08)" stroke-width="2"/>
  <circle cx="${cx}" cy="${cy}" r="420" fill="none" stroke="rgba(10,156,255,0.25)" stroke-width="1"/>

  <!-- Google G -->
  <g transform="translate(${gx} ${gy}) scale(${gScale})">
    <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"/>
    <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"/>
    <path fill="#FBBC05" d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z"/>
    <path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"/>
  </g>

  <!-- winieta -->
  <rect width="${W}" height="${H}" fill="url(#vignette)"/>
</svg>`;

await sharp(Buffer.from(svg)).webp({ quality: 90 }).toFile(OUT);
console.log('Zapisano:', OUT);
