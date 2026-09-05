'use client';

import { CloudOff, Eraser } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HumingMark } from '@/components/ui/huming-mark';
import { useOnline } from '@/lib/use-media';
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
  const online = useOnline();

  return (
    <header
      className={cn(
        'relative flex shrink-0 items-center justify-between gap-3',
        // Installed there is no browser chrome above this, so the top
        // inset is the status bar and the padding has to clear it. max()
        // rather than a sum: on everything else the inset is 0 and this
        // is the padding it always was.
        'pt-[max(1rem,env(safe-area-inset-top))] sm:pt-[max(1.25rem,env(safe-area-inset-top))]',
        'pl-[max(1rem,env(safe-area-inset-left))] sm:pl-[max(1.75rem,env(safe-area-inset-left))]',
        'pr-[max(1rem,env(safe-area-inset-right))] sm:pr-[max(1.75rem,env(safe-area-inset-right))]',
      )}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        {/* backdrop-blur is clipped by the element's own border-radius
            and knows nothing about the rounded rect inside the SVG, so
            rounded-xl has to be here as well as in the artwork. */}
        <HumingMark className="size-8 shrink-0 rounded-xl backdrop-blur-xl" />
        <span className={cn('hidden sm:block', WORDMARK)}>Huming</span>
      </div>

      {/* Offset by the rail's own top padding rather than inset-0: that
          padding is not part of the row, and centring through it rides
          8px high — or a status bar's worth, installed. */}
      <span
        className={cn(
          'pointer-events-none absolute right-0 bottom-0 left-0',
          'top-[max(1rem,env(safe-area-inset-top))]',
          'grid place-items-center sm:hidden',
          WORDMARK,
        )}
      >
        Huming
      </span>

      <div className="flex shrink-0 items-center gap-2.5">
        {/*
          Offline. Stated, not enforced: navigator.onLine describes an
          interface rather than a route to anywhere, and a composer
          disabled by a wrong guess is worse than a send that fails with
          a reason. Sending needs the network — the rail says so, and
          everything already loaded keeps working.
        */}
        {online ? null : (
          <span
            role="status"
            className="flex items-center gap-1.5 text-[12px] leading-none font-medium text-mist/75"
          >
            <CloudOff className="size-3.5 shrink-0" aria-hidden />
            Offline
          </span>
        )}

        {canClear ? (
          <Button variant="outline" size="sm" onClick={onClear} className="gap-1.5">
            <Eraser className="size-3.5" />
            <span className="hidden sm:inline">Clear</span>
          </Button>
        ) : null}
      </div>
    </header>
  );
}
