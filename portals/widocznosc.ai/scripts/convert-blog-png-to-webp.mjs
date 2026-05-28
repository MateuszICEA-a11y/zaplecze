#!/usr/bin/env node
import sharp from 'sharp';
import { readdir, stat, unlink } from 'node:fs/promises';
import { join } from 'node:path';

const ASSETS_DIR = new URL('../src/assets/images/', import.meta.url).pathname;
const QUALITY = 85;

const files = (await readdir(ASSETS_DIR)).filter((f) => f.startsWith('blog-') && f.endsWith('.png'));

let totalBefore = 0;
let totalAfter = 0;
let converted = 0;
let skipped = 0;

for (const file of files) {
  const pngPath = join(ASSETS_DIR, file);
  const webpPath = pngPath.replace(/\.png$/, '.webp');

  const before = (await stat(pngPath)).size;
  totalBefore += before;

  try {
    await sharp(pngPath).webp({ quality: QUALITY, effort: 6 }).toFile(webpPath);
    const after = (await stat(webpPath)).size;
    totalAfter += after;
    await unlink(pngPath);
    converted++;
    const ratio = ((1 - after / before) * 100).toFixed(1);
    console.log(`✓ ${file} ${(before / 1024 / 1024).toFixed(2)}MB → ${(after / 1024).toFixed(0)}KB (-${ratio}%)`);
  } catch (err) {
    skipped++;
    console.error(`✗ ${file}: ${err.message}`);
  }
}

console.log(`\nDone: ${converted} converted, ${skipped} skipped`);
console.log(`Total: ${(totalBefore / 1024 / 1024).toFixed(1)}MB → ${(totalAfter / 1024 / 1024).toFixed(1)}MB (-${((1 - totalAfter / totalBefore) * 100).toFixed(1)}%)`);
