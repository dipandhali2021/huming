'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Hero } from '@/components/hero';
import { Message } from '@/components/message';
import { PromptInput } from '@/components/composer/prompt-input';
import { SceneBackdrop } from '@/components/scene-backdrop';
import {
  PANEL_DOCK_QUERY,
  PANEL_ROOM,
  SettingsPanel,
} from '@/components/settings/settings-panel';
import { StatusRail } from '@/components/status-rail';
import { useChat } from '@/lib/use-chat';
import { useKeyboardInset, useMediaQuery } from '@/lib/use-media';
import { cn, hostOf } from '@/lib/utils';
import { useConnection } from '@/lib/use-connection';

const EASE = [0.22, 1, 0.36, 1] as const;

export default function Playground() {
  const reduced = useReducedMotion();
  const controller = useConnection();
  const { connection, isReady } = controller;
  const { messages, isStreaming, send, stop, clear } = useChat(connection);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pinnedRef = useRef(true);

  // Wide enough to hand the card its own column instead of laying it
  // over the thread. Read unconditionally — && would short-circuit the
  // hook away on every render where Settings is shut.
  const dockable = useMediaQuery(PANEL_DOCK_QUERY);
  const makeRoom = settingsOpen && dockable;

  // What the keyboard is covering. 0 on every browser that resizes the
  // page for it, and on every desktop — see app/layout.tsx.
  const keyboard = useKeyboardInset();

  // Follow the stream, but stop following the moment the reader
  // scrolls up to re-read something.
  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    pinnedRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 90;
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !pinnedRef.current) return;
    el.scrollTo({ top: el.scrollHeight, behavior: isStreaming ? 'auto' : 'smooth' });
  }, [messages, isStreaming]);

  const pinToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el || !pinnedRef.current) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'auto' });
  }, []);

  // Both of these leave the thread holding an offset that no longer
  // points at the bottom: giving up the width rewraps every message a
  // line or two taller, and the keyboard takes height off the foot of
  // the scroller. Pinning here catches the near end of the padding
  // transition; onTransitionEnd below catches the far end.
  useEffect(pinToBottom, [makeRoom, keyboard, pinToBottom]);

  const openSettings = useCallback(() => {
    // Opening Settings is the first moment the model list is needed.
    controller.ensureModels();
    setSettingsOpen(true);
  }, [controller]);

  const hasThread = messages.length > 0;

  return (
    <main
      onTransitionEnd={(e) => {
        if (e.target === e.currentTarget) pinToBottom();
      }}
      style={{
        paddingRight: makeRoom ? PANEL_ROOM : 0,
        // Height rather than padding-bottom, which is on a 440ms
        // transition below for the docking card. The keyboard is
        // already sliding up; it cannot wait out a second animation.
        height: keyboard ? `calc(100dvh - ${keyboard}px)` : undefined,
      }}
      className={cn(
        'relative flex h-dvh flex-col overflow-hidden',
        // Everything inside re-centres in what is left; the scene is
        // fixed and stays full-bleed behind the card.
        'transition-[padding] duration-[440ms] ease-out-quint',
        'motion-reduce:transition-none',
      )}
    >
      <SceneBackdrop />

      <StatusRail
        onClear={() => {
          clear();
          pinnedRef.current = true;
        }}
        canClear={hasThread}
      />

      {/* The thread scrolls; the page never does. */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-color:rgba(255,255,255,0.16)_transparent] [scrollbar-width:thin]"
      >
        <div
          className={cn(
            'mx-auto flex min-h-full w-full max-w-[860px] flex-col justify-end',
            'pl-[max(1rem,env(safe-area-inset-left))] sm:pl-[max(1.75rem,env(safe-area-inset-left))]',
            'pr-[max(1rem,env(safe-area-inset-right))] sm:pr-[max(1.75rem,env(safe-area-inset-right))]',
            hasThread && 'pt-6 pb-2',
          )}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {messages.map((message) => (
              <Message
                key={message.id}
                message={message}
                model={connection.model}
                streaming={isStreaming && message.id === messages.at(-1)?.id}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/*
        The composer. Empty, it sits above the centre line with the
        heading over it — the spacer below grows faster than the thread
        above, which is what lifts it. The first message shrinks that
        spacer to nothing and the composer travels to the bottom — the
        one piece of motion here nobody asked for by clicking, and it
        exists to show where the composer went.
      */}
      {/*
        The safe-area insets are 0 in a browser tab and the padding below
        is the padding it always was. Installed, viewport-fit=cover
        (app/layout.tsx) hands the page the strips the chrome used to
        occupy, and the home indicator lives in the bottom one — so the
        composer clears it here rather than sitting under it.
      */}
      <div
        className={cn(
          'shrink-0',
          'pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:pb-[max(1.75rem,env(safe-area-inset-bottom))]',
          'pl-[max(1rem,env(safe-area-inset-left))] sm:pl-[max(1.75rem,env(safe-area-inset-left))]',
          'pr-[max(1rem,env(safe-area-inset-right))] sm:pr-[max(1.75rem,env(safe-area-inset-right))]',
        )}
      >
        <div className="mx-auto w-full max-w-[688px]">
          <AnimatePresence initial={false}>
            {hasThread ? null : (
              <motion.div
                key="hero"
                className="overflow-hidden"
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: reduced ? 0 : 0.4, ease: EASE }}
              >
                <Hero onOpenSettings={openSettings} />
              </motion.div>
            )}
          </AnimatePresence>

          <PromptInput
            onSend={(text, files) => {
              pinnedRef.current = true;
              void send(text, files);
            }}
            onOpenSettings={openSettings}
            onStop={stop}
            isStreaming={isStreaming}
            model={connection.model}
            endpoint={controller.gateway?.label ?? hostOf(connection.baseUrl)}
            models={controller.models}
            modelStatus={controller.status}
            onSelectModel={(id) => controller.patch({ model: id })}
            onRequestModels={controller.ensureModels}
            disabled={!isReady}
            disabledHint="Paste a curl command to start"
          />
        </div>
      </div>

      {/* Outgrows the thread above (1.7 : 1) to lift the empty-state
          composer above centre; drops to 0 to seat it at the bottom. */}
      <motion.div
        aria-hidden
        initial={false}
        animate={{ flexGrow: hasThread ? 0 : 1.7 }}
        transition={{ duration: reduced ? 0 : 0.44, ease: EASE }}
        className="min-h-0 shrink"
      />

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        controller={controller}
      />
    </main>
  );
}
