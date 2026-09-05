'use client';

import { Eraser, Waves } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/** One wordmark, two places to put it — never drifting apart. */
const WORDMARK =
  'text-[15px] leading-none font-extrabold tracking-[-0.035em] text-vellum';

/**
 * The top rail: the wordmark, and Clear once there is something to clear.
 *
 * Who you are talking to, and the way to change it, both live in the
 * composer now — next to the box you type in, rather than diagonally
 * across the page from it.
 *
 * The wordmark sits beside the mark when there is width for it and
 * centred in the rail when there is not — a phone has room for the mark
 * on the left and nothing else, which left the middle of the rail empty.
 * Centred means centred on the rail, not on the gap between the mark and
 * Clear, so it is placed rather than laid out: Clear comes and goes with
 * the thread, and the wordmark must not shift when it does.
 */
export function StatusRail({
  onClear,
  canClear,
}: {
  onClear: () => void;
  canClear: boolean;
}) {
  return (
    <header className="relative flex shrink-0 items-center justify-between gap-3 px-4 pt-4 sm:px-7 sm:pt-5">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-white/14 bg-white/8 backdrop-blur-xl">
          <Waves className="size-4 text-flare" />
        </span>
        <span className={cn('hidden sm:block', WORDMARK)}>Huming</span>
      </div>

      {/* top-4 rather than inset-0: the rail's own top padding is not
          part of the row, and centring through it rides 8px high. */}
      <span
        className={cn(
          'pointer-events-none absolute top-4 right-0 bottom-0 left-0',
          'grid place-items-center sm:hidden',
          WORDMARK,
        )}
      >
        Huming
      </span>

      {canClear ? (
        <Button variant="outline" size="sm" onClick={onClear} className="gap-1.5">
          <Eraser className="size-3.5" />
          <span className="hidden sm:inline">Clear</span>
        </Button>
      ) : null}
    </header>
  );
}
