// Zrzuty ekranu wszystkich stron nowego frontu: jasny/ciemny × desktop/mobile.
// Wymaga działającego podglądu (npm run preview) i Chrome w systemie.
// Użycie: npm run screenshots  →  screenshots/<strona>-<motyw>-<ekran>.png
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "playwright-core";

const BASE = process.env.BASE_URL ?? "http://127.0.0.1:4410";
const OUT = resolve(import.meta.dirname, "..", "screenshots");
const PAGES = [
  ["domeny", "/"],
  ["przeglad", "/grupa-icea.pl/"],
  ["senuto", "/grupa-icea.pl/senuto/"],
  ["gsc", "/grupa-icea.pl/gsc/"],
  ["ga4", "/grupa-icea.pl/ga4/"],
  ["przeglad-widocznosc", "/widocznosc.ai/"],
];
const VIEWPORTS = [
  ["desktop", { width: 1440, height: 900 }],
  ["mobile", { width: 390, height: 844 }],
];

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });
for (const theme of ["jasny", "ciemny"]) {
  for (const [screen, viewport] of VIEWPORTS) {
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
    await context.addInitScript((t) => localStorage.setItem("dash-theme", t), theme === "ciemny" ? "dark" : "light");
    const page = await context.newPage();
    for (const [name, path] of PAGES) {
      await page.goto(BASE + path, { waitUntil: "networkidle" });
      await page.waitForTimeout(1200); // ApexCharts i AG Grid renderują się po hydratacji
      const file = resolve(OUT, `${name}-${theme}-${screen}.png`);
      await page.screenshot({ path: file, fullPage: true });
      console.log(file);
    }
    await context.close();
  }
}
await browser.close();
