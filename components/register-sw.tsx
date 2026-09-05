'use client';

import { useEffect } from 'react';

/**
 * Registers public/sw.js, which is what makes an installed Huming open
 * without a network. Renders nothing.
 *
 * Development is excluded on purpose. A worker holding a cache in front
 * of Turbopack's dev assets serves yesterday's chunks and turns every
 * edit into a debugging session about why the edit did not appear; the
 * offline behaviour is only meaningful against a real build anyway
 * (`next build && next start`).
 */
export function RegisterSW() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;

    void navigator.serviceWorker
      // updateViaCache: 'none' so the browser's HTTP cache can never be
      // the reason a new worker is not picked up. next.config.ts sends
      // no-store for the same file, from the other side.
      .register('/sw.js', { scope: '/', updateViaCache: 'none' })
      // A refused registration (private mode, an unsupported context)
      // costs the offline launch and nothing else. Nothing on the page
      // waits for this.
      .catch(() => undefined);
  }, []);

  return null;
}
