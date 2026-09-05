/**
 * Draws the home-screen icons from lib/mark.ts and writes them into
 * public/ and app/. Run it after changing anything in lib/mark.ts:
 *
 *   npm run icons
 *
 * The outputs are committed, so this is not part of the build — it is
 * the reason the committed PNGs are reproducible rather than a binary
 * someone once exported and nobody can regenerate.
 *
 * Two compositions, both on the same ground:
 *
 *   tile — the rail's glass tile, inset. What the app looks like.
 *   bare — just the waves, half the canvas wide. Everything important
 *          sits inside the middle 66%, which is what a maskable icon
 *          has to do: Android crops to a circle of the middle 80% and
 *          the tile's corners do not survive that. Same reason it is
 *          the favicon, where a 1px border and a 12% margin turn to
 *          porridge at 16px.
 */
import { execFileSync } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import {
  GLYPH_RATIO,
  GROUND,
  TILE_BORDER,
  TILE_BORDER_RATIO,
  TILE_FILL,
  TILE_RADIUS_RATIO,
  WAVE_BOX,
  WAVE_COLOR,
  WAVE_PATHS,
  WAVE_STROKE,
} from '../lib/mark.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Unit canvas. Every length below is a fraction of it. */
const BOX = 32;
/** Breathing room around the tile, so it reads as an object on a ground. */
const TILE_INSET = 4;

function waves(centre: number, glyph: number) {
  const offset = centre - glyph / 2;
  return `<g transform="translate(${offset} ${offset}) scale(${glyph / WAVE_BOX})" fill="none"
    stroke="${WAVE_COLOR}" stroke-width="${WAVE_STROKE}" stroke-linecap="round" stroke-linejoin="round">
    ${WAVE_PATHS.map((d) => `<path d="${d}"/>`).join('\n    ')}
  </g>`;
}

function svg(variant: 'tile' | 'bare', size: number) {
  const tile = BOX - TILE_INSET * 2;
  const border = tile * TILE_BORDER_RATIO;

  const body =
    variant === 'tile'
      ? `<rect x="${TILE_INSET + border / 2}" y="${TILE_INSET + border / 2}"
      width="${tile - border}" height="${tile - border}"
      rx="${tile * TILE_RADIUS_RATIO - border / 2}"
      fill="${TILE_FILL}" stroke="${TILE_BORDER}" stroke-width="${border}"/>
  ${waves(BOX / 2, tile * GLYPH_RATIO)}`
      : waves(BOX / 2, BOX * GLYPH_RATIO);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${BOX} ${BOX}">
  <defs>
    <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${GROUND[0]}"/>
      <stop offset="1" stop-color="${GROUND[1]}"/>
    </linearGradient>
  </defs>
  <rect width="${BOX}" height="${BOX}" fill="url(#ground)"/>
  ${body}
</svg>`;
}

const PNGS = [
  { out: 'public/icon-192.png', variant: 'tile', size: 192 },
  { out: 'public/icon-512.png', variant: 'tile', size: 512 },
  { out: 'public/icon-maskable-512.png', variant: 'bare', size: 512 },
  // app/, not public/: it is a Next file convention there, so the
  // <link rel="apple-touch-icon"> is emitted rather than left to
  // Safari's guess at /apple-touch-icon.png.
  { out: 'app/apple-icon.png', variant: 'tile', size: 180 },
] as const;

// Scalable copy for the manifest, and for anyone who wants the artwork.
await writeFile(join(ROOT, 'public/icon.svg'), `${svg('tile', BOX)}\n`);
console.log('public/icon.svg');

for (const { out, variant, size } of PNGS) {
  await sharp(Buffer.from(svg(variant, size)))
    // No alpha anywhere: the ground is opaque, and iOS composites a
    // transparent apple-touch-icon against black rather than the art.
    .flatten({ background: GROUND[0] })
    .png({ compressionLevel: 9 })
    .toFile(join(ROOT, out));
  console.log(out);
}

/**
 * The favicon stays a real .ico so /favicon.ico is a file rather than a
 * 404 that every browser asks for anyway. sharp cannot write the
 * format; ImageMagick can, and this script is only ever run by hand.
 */
const ico = join(ROOT, 'app/favicon.ico');
const source = await sharp(Buffer.from(svg('bare', 48)))
  .flatten({ background: GROUND[0] })
  .png()
  .toBuffer();
try {
  execFileSync('convert', ['png:-', '-define', 'icon:auto-resize=48,32,16', ico], {
    input: source,
  });
  console.log('app/favicon.ico');
} catch (err) {
  console.warn(
    `\napp/favicon.ico NOT regenerated — needs ImageMagick's \`convert\` on PATH.\n` +
      `Everything else is written. ${(err as Error).message}\n`,
  );
}
