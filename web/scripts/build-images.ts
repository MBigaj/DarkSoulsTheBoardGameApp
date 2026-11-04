/**
 * Card scans → WebP for the web app.
 *   <data>/images/{set}/{type}/{slug}.png  →  public/images/{set}/{type}/{slug}.webp      (≤ 571×850)
 *                                          →  public/images/{set}/{type}/{slug}-300.webp  (≤ 300 wide)
 * Transparency is kept. Runs before `dev` and `build`; only new or changed scans are converted.
 * Output is git-ignored: it's derived from the data store, which isn't in the repo yet.
 *   npm run build:images        DATA_DIR=/path/to/DSTBG_DATA npm run build:images
 */
import { mkdir, readdir, stat } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { resolveDataDir } from './data-paths.ts';
import { CARD_IMAGE } from '../src/shared/lib/card-image-sizes.ts';

const OUT_DIR = fileURLToPath(new URL('../public/images/', import.meta.url));

// Fit inside the printed card shape; never upscale (low-res scans stay as they are).
const VARIANTS = [
  { suffix: '', width: CARD_IMAGE.fullWidth, height: CARD_IMAGE.fullHeight },
  {
    suffix: `-${String(CARD_IMAGE.tileWidth)}`,
    width: CARD_IMAGE.tileWidth,
    height: Math.round((CARD_IMAGE.tileWidth * CARD_IMAGE.fullHeight) / CARD_IMAGE.fullWidth),
  },
] as const;

async function* pngs(dir: string): AsyncGenerator<string> {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return; // No images folder (e.g. the test fixtures): nothing to convert.
  }
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* pngs(path);
    else if (entry.name.toLowerCase().endsWith('.png')) yield path;
  }
}

async function isFresh(source: string, target: string): Promise<boolean> {
  try {
    return (await stat(target)).mtimeMs >= (await stat(source)).mtimeMs;
  } catch {
    return false;
  }
}

const sourceDir = join(resolveDataDir(), 'images');
let converted = 0;
let skipped = 0;

for await (const source of pngs(sourceDir)) {
  const base = join(OUT_DIR, relative(sourceDir, source)).replace(/\.png$/i, '');
  for (const { suffix, width, height } of VARIANTS) {
    const target = `${base}${suffix}.webp`;
    if (await isFresh(source, target)) {
      skipped++;
      continue;
    }
    await mkdir(dirname(target), { recursive: true });
    await sharp(source)
      .resize({ width, height, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82, alphaQuality: 90, effort: 5 })
      .toFile(target);
    converted++;
  }
}

console.log(
  `build-images: ${String(converted)} written, ${String(skipped)} up to date (${sourceDir} → public/images/)`,
);
