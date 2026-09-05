'use client';

import {
  ChevronDown,
  ClipboardPaste,
  CornerDownLeft,
  Terminal,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { parseCurl } from '@/lib/curl';
import { cn } from '@/lib/utils';
import type { CurlParseResult } from '@/types';

const EASE = [0.22, 1, 0.36, 1] as const;

const SAMPLE = `curl https://api.openai.com/v1/chat/completions \\
  -H "Authorization: Bearer sk-..." \\
  -d '{"model":"gpt-5","messages":[]}'`;

/**
 * Paste the curl command from any provider's docs and read the base URL,
 * key and model straight out of it.
 *
 * Shut until asked for. Open, it is the tallest thing in the card by
 * some margin — three mono rows and a result list ahead of the two
 * fields it fills in — and once a connection is wired up it is the part
 * you come back to least. Collapsed it is one line, and Base URL is the
 * first thing the card shows.
 */
export function CurlImport({
  onImport,
}: {
  onImport: (result: CurlParseResult) => void;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [result, setResult] = useState<CurlParseResult | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Opening it is a request to type in it, so put the caret there. The
  // frame's wait is for the height animation to have started, or the
  // focus scrolls the card to a box that is still 0px tall.
  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open]);

  const run = (input: string) => {
    const parsed = parseCurl(input);
    setResult(parsed);
    if (parsed.baseUrl) onImport(parsed);
  };

  const pasteFromClipboard = async () => {
    try {
      const clip = await navigator.clipboard.readText();
      if (!clip.trim()) return;
      setText(clip);
      run(clip);
    } catch {
      setResult({
        found: [],
        missing: ['Clipboard access — paste into the box instead'],
      });
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="curl-import"
        className={cn(
          'flex items-center gap-1.5 self-start text-[11px] font-bold',
          'tracking-[0.12em] uppercase transition-colors',
          open ? 'text-vellum' : 'text-ash hover:text-vellum',
        )}
      >
        <Terminal className="size-3 shrink-0" />
        Import from curl
        <motion.span
          aria-hidden
          className="grid place-items-center"
          initial={false}
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.24, ease: EASE }}
        >
          <ChevronDown className="size-3.5" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="box"
            id="curl-import"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.26, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={pasteFromClipboard}
                className="flex items-center gap-1 self-start text-[11.5px] font-semibold text-lilac transition-colors hover:text-vellum"
              >
                <ClipboardPaste className="size-3" />
                Paste clipboard
              </button>

              <div className="relative">
                <textarea
                  ref={inputRef}
                  id="curl-input"
                  aria-label="curl command"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onPaste={(e) => {
                    const pasted = e.clipboardData.getData('text');
                    if (pasted.trim()) {
                      e.preventDefault();
                      setText(pasted);
                      run(pasted);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      run(text);
                    }
                  }}
                  rows={3}
                  spellCheck={false}
                  placeholder={SAMPLE}
                  className={cn(
                    'w-full resize-none rounded-xl border border-white/12 bg-abyss/60 px-3 py-2.5 pr-20',
                    'font-mono text-[12px] leading-[1.6] text-vellum placeholder:text-ash/55',
                    'focus-visible:border-white/28 focus-visible:outline-none',
                    '[scrollbar-width:thin]',
                  )}
                />
                {text.trim() ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => run(text)}
                    className="absolute right-2 bottom-2 gap-1"
                  >
                    Read
                    <CornerDownLeft className="size-3" />
                  </Button>
                ) : null}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/*
        The read-out sits outside the collapsible rather than in it: two
        height-to-auto animations nested inside one another fight over
        the same measurement, and this way the box settles at its own
        height and the result grows below it. It still closes with the
        box, so collapsing puts the card back to one line.
      */}
      <AnimatePresence initial={false}>
        {open && result ? (
          <motion.div
            key="result"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: EASE }}
            className="overflow-hidden"
          >
            <ul className="flex flex-col gap-1 pt-0.5">
              {result.found.map((line) => (
                <li
                  key={line}
                  className="flex items-start gap-1.5 text-[12px] font-medium text-mist"
                >
                  <span aria-hidden className="mt-1.5 size-1 shrink-0 rounded-full bg-tide" />
                  <span className="min-w-0 flex-1 break-all">{line}</span>
                </li>
              ))}
              {result.missing.map((line) => (
                <li
                  key={line}
                  className="flex items-start gap-1.5 text-[12px] font-medium text-ash"
                >
                  <span aria-hidden className="mt-1.5 size-1 shrink-0 rounded-full bg-white/24" />
                  <span className="min-w-0 flex-1">Not in the command: {line}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
