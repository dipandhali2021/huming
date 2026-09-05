/**
 * The Huming mark, as numbers.
 *
 * One geometry, three consumers: the tile in the top rail
 * (components/ui/huming-mark.tsx), the icons on a home screen
 * (scripts/make-icons.ts), and the favicon. Nothing here is a colour
 * or a length that also exists somewhere else — change it once and the
 * installed app, the browser tab and the rail move together.
 *
 * The waves are lucide's `waves-horizontal`, the icon the rail has
 * always used, at its native 24-unit box. Everything else is measured
 * off the tile in the rail: white/8 over the scene, a white/14
 * hairline, and a corner radius of 0.375 — which is `rounded-xl` at
 * `size-8`, so the rail can keep its Tailwind class and still match.
 */

/** lucide waves-horizontal, 24-unit box, three crests at y=5/12/19. */
export const WAVE_PATHS = [
  'M2 5q2.5 2 5 0t5 0 5 0 5 0',
  'M2 12q2.5 2 5 0t5 0 5 0 5 0',
  'M2 19q2.5 2 5 0t5 0 5 0 5 0',
] as const;

/** The box those paths are drawn in. */
export const WAVE_BOX = 24;

/**
 * Heavier than lucide's default 2. At the size a launcher actually
 * draws this — 48px, sometimes less — the default thins out to nothing,
 * and 2.4 is what the mark was mocked up at.
 */
export const WAVE_STROKE = 2.4;

/** --color-flare. The one warm point in the palette. */
export const WAVE_COLOR = '#ff7fb4';

/** Corner radius as a fraction of the tile. 0.375 === rounded-xl at 32px. */
export const TILE_RADIUS_RATIO = 0.375;

/** Border thickness as a fraction of the tile. 0.03125 === 1px at 32px. */
export const TILE_BORDER_RATIO = 0.03125;

/** The glass, over whatever is behind it. Same values as the rail. */
export const TILE_FILL = 'rgba(255,255,255,0.08)';
export const TILE_BORDER = 'rgba(255,255,255,0.14)';

/** The glyph fills half the tile, which is `size-4` inside `size-8`. */
export const GLYPH_RATIO = 0.5;

/**
 * The ground under a standalone icon, top to bottom. Sampled from the
 * scene the palette comes from, so an icon on a home screen reads as
 * the same object as the page behind the composer. The app's own
 * background is --color-abyss and stays that way: this is artwork, not
 * a surface, which is why it is not one of the @theme tokens.
 */
export const GROUND = ['#242b5e', '#313a7d'] as const;
