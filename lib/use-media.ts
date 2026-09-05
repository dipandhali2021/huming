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
