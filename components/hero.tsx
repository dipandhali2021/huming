'use client';

import { motion, useReducedMotion } from 'motion/react';

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Two words a line, two lines, set in the wordmark's weight so the
 * heading and "Huming" in the rail read as one voice.
 *
 * The line break is authored, not wrapped: "Any endpoint." is the half
 * you bring, "Any model." is the half you get, and breaking between
 * them is the whole claim.
 */
const LINES = [
  ['Any', 'endpoint.'],
  ['Any', 'model.'],
];

// Word index continued across the break, so the reveal cascades once
// through both lines instead of restarting on the second.
const OFFSET = LINES.map((_, i) =>
  LINES.slice(0, i).reduce((n, line) => n + line.length, 0),
);

/**
 * The empty state, sitting directly above the composer.
 *
 * One claim and one action. The action names the curl command you
 * already have a working request for, which is the whole premise.
 *
 * The heading is bare: no scrim behind it and no shadow on it, both
 * asked for directly. Nothing stands between white type and the video,
 * so over the frame's brightest pixel (#fa84ba) it lands near 2:1 —
 * under AA at any size. Size is what it leans on instead. The link
 * below keeps the wide, soft shadow it always had, which never read as
 * a box and does carry it.
 */
export function Hero({ onOpenSettings }: { onOpenSettings: () => void }) {
  const reduced = useReducedMotion();

  return (
    <div className="flex flex-col items-center pt-5 pb-7 text-center">
      <h1
        className="font-extrabold tracking-[-0.042em] text-vellum"
        style={{
          fontSize: 'clamp(2.25rem, 7.2vw, 3.5rem)',
          lineHeight: 1.1,
        }}
      >
        {LINES.map((line, li) => (
          <span key={line.join('-')} className="block">
            {line.map((word, wi) => (
              // This mask is why there is no text-shadow above. It
              // clips whatever the glyphs paint, so a wide blur lands
              // as a hard-edged grey slab the size of this box rather
              // than a halo. Nothing past ~3px survives it.
              <span
                key={`${word}-${wi}`}
                className="inline-block overflow-hidden pb-[0.16em] mb-[-0.16em]"
              >
                <motion.span
                  className="inline-block"
                  initial={reduced ? false : { y: '125%' }}
                  animate={{ y: '0%' }}
                  transition={{
                    delay: reduced ? 0 : (OFFSET[li] + wi) * 0.06,
                    duration: 0.66,
                    ease: EASE,
                  }}
                >
                  {word}
                </motion.span>
                {wi < line.length - 1 ? <span>&nbsp;</span> : null}
              </span>
            ))}
          </span>
        ))}
      </h1>

      <motion.button
        type="button"
        onClick={onOpenSettings}
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: reduced ? 0 : 0.5, duration: 0.5, ease: EASE }}
        className="mt-4 text-[13.5px] font-medium text-vellum/88 underline decoration-white/30 decoration-1 underline-offset-[5px] transition-colors hover:text-vellum hover:decoration-white/60"
        style={{ textShadow: '0 1px 14px rgba(1,5,10,0.85)' }}
      >
        Paste a curl command
      </motion.button>
    </div>
  );
}
