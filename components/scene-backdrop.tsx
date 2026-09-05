'use client';

import { useEffect, useRef, useState } from 'react';
import { useSceneSource } from '@/lib/use-media';

/**
 * The playground scene, playing behind everything.
 *
 * The source clip was re-cut with a 1s tail-to-head crossfade so the
 * last frame equals the first and the loop has no visible seam. Two
 * encodes ship: 1024px for phones, 1920px above 900px wide. Under
 * prefers-reduced-motion neither loads and the poster stands in.
 *
 * Scrims: none over the video itself, so the scene plays at full
 * strength. Legibility is paid for locally instead — gradient bands
 * under the top rail and the composer, a light edge vignette, and the
 * hero's own radial behind the heading. Measured against the brightest
 * pixel in the frame (#fa84ba): rail chrome ~7:1, hero heading ~5:1,
 * and every message bubble carries its own fill.
 */
export function SceneBackdrop() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const src = useSceneSource();

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !src) return;

    // Autoplay can still be refused; the poster stays up if it is.
    const attempt = () => {
      void el.play().catch(() => undefined);
    };
    attempt();

    // Don't decode video for a tab nobody is looking at.
    const onVisibility = () => {
      if (document.visibilityState === 'visible') attempt();
      else el.pause();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [src]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/scene/poster.jpg"
        alt=""
        fetchPriority="high"
        className="absolute inset-0 size-full object-cover"
      />

      {src ? (
        <video
          ref={videoRef}
          src={src}
          poster="/scene/poster.jpg"
          muted
          loop
          playsInline
          preload="auto"
          onPlaying={() => setPlaying(true)}
          className={[
            'absolute inset-0 size-full object-cover',
            'transition-opacity duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)]',
            playing ? 'opacity-100' : 'opacity-0',
          ].join(' ')}
        />
      ) : null}

      {/* No flat wash over the video — the scene plays at full strength.
          Everything below is local to a piece of chrome. */}

      {/* Chrome bands: deeper at the top rail and the bottom composer. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, rgba(1,5,10,0.66) 0%, rgba(1,5,10,0.02) 24%, rgba(1,5,10,0.04) 60%, rgba(1,5,10,0.56) 100%)',
        }}
      />

      {/* Edge vignette, so the frame reads as a window rather than a fill. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(126% 96% at 50% 45%, transparent 56%, rgba(1,5,10,0.2) 100%)',
        }}
      />

      {/* One grain pass, which kills the banding the gradients would show. */}
      <div
        className="absolute inset-0 opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}
