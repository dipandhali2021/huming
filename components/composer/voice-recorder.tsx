'use client';

import { motion } from 'motion/react';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

const BARS = 40;

/**
 * Records from the microphone and reports how long it ran.
 *
 * Mounted only while recording — the parent renders nothing otherwise —
 * so there is no state to reset on start, and the effect is a pure
 * subscription to the mic and the clock.
 *
 * The bars are driven by a real AnalyserNode, so the meter reflects the
 * room. If mic access is refused the timer still runs, because the
 * length of the note is the part the caller actually needs.
 */
export function VoiceRecorder({ onStop }: { onStop: (seconds: number) => void }) {
  const [seconds, setSeconds] = useState(0);
  const [levels, setLevels] = useState<number[]>(() => Array(BARS).fill(0.08));
  const [denied, setDenied] = useState(false);

  // Counted in a ref so the reported duration does not depend on a
  // state update having landed before teardown.
  const secondsRef = useRef(0);

  // An effect event, so the effect never re-runs — and so never
  // restarts the recording — when the parent re-renders with a new
  // onStop identity.
  const report = useEffectEvent((seconds: number) => onStop(seconds));

  useEffect(() => {
    let cancelled = false;
    let raf = 0;
    let ctx: AudioContext | null = null;
    let stream: MediaStream | null = null;

    const tick = setInterval(() => {
      secondsRef.current += 1;
      setSeconds(secondsRef.current);
    }, 1000);

    void (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        ctx = new AudioContext();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.7;
        ctx.createMediaStreamSource(stream).connect(analyser);

        const data = new Uint8Array(analyser.frequencyBinCount);
        const step = Math.max(1, Math.floor(data.length / BARS));

        const loop = () => {
          analyser.getByteFrequencyData(data);
          setLevels(
            Array.from({ length: BARS }, (_, i) => {
              let sum = 0;
              for (let k = 0; k < step; k++) sum += data[i * step + k] ?? 0;
              return Math.max(0.08, Math.min(1, sum / step / 150));
            }),
          );
          raf = requestAnimationFrame(loop);
        };
        loop();
      } catch {
        if (!cancelled) setDenied(true);
      }
    })();

    return () => {
      cancelled = true;
      clearInterval(tick);
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
      void ctx?.close();
      report(secondsRef.current);
    };
  }, []);

  return (
    <div className="flex w-full flex-col items-center justify-center gap-2 py-2.5">
      <div className="flex items-center gap-2">
        <motion.span
          className="size-2 rounded-full bg-lilac"
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
        <span className="font-mono text-[12px] font-semibold tracking-wide text-vellum">
          {String(Math.floor(seconds / 60)).padStart(2, '0')}:
          {String(seconds % 60).padStart(2, '0')}
        </span>
        {denied ? (
          <span className="text-[12px] font-medium text-ash">
            Microphone blocked — timing the note only
          </span>
        ) : null}
      </div>

      <div className="flex h-9 w-full items-center justify-center gap-[3px] px-4">
        {levels.map((level, i) => (
          <motion.span
            key={i}
            className={cn(
              'w-[3px] shrink-0 rounded-full',
              denied ? 'bg-white/22' : 'bg-gradient-to-t from-tide to-lilac',
            )}
            animate={{ height: `${Math.round(level * 100)}%` }}
            transition={{ duration: 0.09, ease: 'linear' }}
            style={{ minHeight: 3 }}
          />
        ))}
      </div>
    </div>
  );
}
