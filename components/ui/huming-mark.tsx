import {
  GLYPH_RATIO,
  TILE_BORDER,
  TILE_BORDER_RATIO,
  TILE_FILL,
  TILE_RADIUS_RATIO,
  WAVE_BOX,
  WAVE_COLOR,
  WAVE_PATHS,
  WAVE_STROKE,
} from '@/lib/mark';

/**
 * The tile drawn at the size the rail draws it, so one SVG unit is one
 * pixel there and the numbers below read as the lengths they are.
 */
const SIZE = 32;

const BORDER = SIZE * TILE_BORDER_RATIO;
const GLYPH = SIZE * GLYPH_RATIO;

/**
 * The mark: the glass tile and the three waves inside it, as one piece
 * of art shared with the icons on a home screen (scripts/make-icons.ts
 * draws it from the same constants in lib/mark.ts). It used to be a
 * bordered span with a lucide icon posted inside it, which meant the
 * thing on the home screen and the thing in the rail were two
 * drawings that happened to agree.
 *
 * The tile is painted here rather than by Tailwind, but the corner
 * radius has to be a class as well: `backdrop-filter` is clipped by
 * the element's border-radius and knows nothing about the rounded rect
 * in the SVG, so a blur without it would sit in a square behind round
 * corners. `rounded-xl` at `size-8` is 12/32 — TILE_RADIUS_RATIO. Pass
 * both or neither.
 */
export function HumingMark({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className={className}
      // Stroke widths are in user units, so they scale with the box.
      fill="none"
    >
      <rect
        x={BORDER / 2}
        y={BORDER / 2}
        width={SIZE - BORDER}
        height={SIZE - BORDER}
        rx={SIZE * TILE_RADIUS_RATIO - BORDER / 2}
        fill={TILE_FILL}
        stroke={TILE_BORDER}
        strokeWidth={BORDER}
      />
      <g
        transform={`translate(${(SIZE - GLYPH) / 2} ${(SIZE - GLYPH) / 2}) scale(${GLYPH / WAVE_BOX})`}
        stroke={WAVE_COLOR}
        strokeWidth={WAVE_STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {WAVE_PATHS.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
    </svg>
  );
}
