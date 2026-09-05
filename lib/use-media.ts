'use client';

import { useCallback, useSyncExternalStore } from 'react';

/**
 * Read a media query as React state.
 *
 * useSyncExternalStore rather than useEffect + setState: matchMedia is
 * an external store, and this is the API built for subscribing to one.
 * It also means no cascading render on mount, and the query stays live
 * when the viewport or the OS motion preference changes.
 */
export function useMediaQuery(query: string, serverValue = false) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}

const SCENE_WIDE = '/scene/scene-1920.mp4';
const SCENE_NARROW = '/scene/scene-1024.mp4';

/**
 * Which scene encode to load, or '' for none.
 *
 * The server snapshot is '' so the markup React hydrates has no video
 * element at all. The real answer arrives on the first post-hydration
 * render, which means exactly one encode is ever fetched — picking the
 * size during hydration would download the narrow cut and then the
 * wide one on every desktop load.
 */
export function useSceneSource() {
  const subscribe = useCallback((onChange: () => void) => {
    const queries = [
      window.matchMedia('(min-width: 900px)'),
      window.matchMedia('(prefers-reduced-motion: reduce)'),
    ];
    queries.forEach((q) => q.addEventListener('change', onChange));
    return () => queries.forEach((q) => q.removeEventListener('change', onChange));
  }, []);

  return useSyncExternalStore(
    subscribe,
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return '';
      return window.matchMedia('(min-width: 900px)').matches ? SCENE_WIDE : SCENE_NARROW;
    },
    () => '',
  );
}

/**
 * Sub-pixel noise lands on every visual-viewport event, and a rounding
 * error is not a keyboard. Nothing worth reflowing for is 24px tall.
 */
const KEYBOARD_FLOOR = 24;

function readKeyboardInset() {
  const vv = window.visualViewport;
  if (!vv) return 0;
  // Pinch-zoom shrinks the visual viewport too. Reflowing the page
  // under someone's fingers while they zoom in to read is worse than
  // the bug this exists to fix, so a zoomed viewport reports nothing.
  if (vv.scale > 1.02) return 0;
  // Whatever is left of the layout viewport below the visible slice:
  // that slice starts at offsetTop and is vv.height tall, so anything
  // past its bottom edge is under the keyboard.
  const covered = window.innerHeight - vv.height - vv.offsetTop;
  return covered > KEYBOARD_FLOOR ? Math.round(covered) : 0;
}

/**
 * How much of the layout viewport the on-screen keyboard is standing on.
 *
 * `interactive-widget=resizes-content` (app/layout.tsx) is the real fix
 * on Chrome: the keyboard shrinks the layout viewport, 100dvh shrinks
 * with it, and a composer anchored to the foot of the shell rides up on
 * its own. Safari ignores the hint — there the layout viewport keeps its
 * full height and only the *visual* viewport shrinks, so the composer
 * stays exactly where it was, under the keys, with nowhere to scroll to
 * (html and body are overflow:hidden). This measures the difference so
 * the shell can give the height up itself.
 *
 * Where the browser does resize the page, innerHeight shrinks alongside
 * vv.height and this reads 0 — the two fixes cannot stack.
 */
export function useKeyboardInset() {
  const subscribe = useCallback((onChange: () => void) => {
    const vv = window.visualViewport;
    if (!vv) return () => {};
    // resize is the keyboard arriving; scroll is Safari sliding the
    // visual viewport around inside the layout one, which moves the
    // covered edge without changing how tall it is.
    vv.addEventListener('resize', onChange);
    vv.addEventListener('scroll', onChange);
    return () => {
      vv.removeEventListener('resize', onChange);
      vv.removeEventListener('scroll', onChange);
    };
  }, []);

  return useSyncExternalStore(subscribe, readKeyboardInset, () => 0);
}

/**
 * Whether the browser believes it has a network.
 *
 * Named after what it reads. `navigator.onLine` reports the state of the
 * network interface, not whether anything is reachable through it — it
 * says true on a café WiFi that has stopped forwarding packets. That is
 * why nothing is allowed to act on this: it colours a word in the top
 * rail, and a send that fails while this says true fails the way it
 * always did, through use-chat.ts's own error.
 *
 * Not `useOffline` from `next/offline`, which is a different thing with
 * a similar name: that one needs experimental.useOffline, and what it
 * buys is the framework retrying its own requests — navigations,
 * prefetches, Server Actions. Huming is one route with none of those,
 * and the chat request is a plain fetch from a client component, which
 * the framework leaves alone either way.
 *
 * The server snapshot is true. An offline pill that appears on every
 * cold load and disappears at hydration would be wrong far more often
 * than it was right.
 */
export function useOnline() {
  const subscribe = useCallback((onChange: () => void) => {
    window.addEventListener('online', onChange);
    window.addEventListener('offline', onChange);
    return () => {
      window.removeEventListener('online', onChange);
      window.removeEventListener('offline', onChange);
    };
  }, []);

  return useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );
}
