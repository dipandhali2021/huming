'use client';

import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle, ChevronRight, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Markdown } from '@/components/ui/markdown';
import { iconUrl, providerFor } from '@/lib/providers';
import { cn } from '@/lib/utils';
import type { ChatMessage } from '@/types';

export function Message({
  message,
  model,
  streaming,
}: {
  message: ChatMessage;
  model: string;
  streaming: boolean;
}) {
  const isUser = message.role === 'user';
  const provider = providerFor(model);
  const empty = !message.content && !message.reasoning && !message.error;

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'group flex w-full items-end gap-2.5 py-3',
        isUser ? 'justify-end' : 'flex-row-reverse justify-end',
      )}
    >
      <div className="flex max-w-[min(84%,660px)] flex-col gap-1.5">
        {message.attachments?.length ? (
          <div className={cn('flex flex-wrap gap-1.5', isUser && 'justify-end')}>
            {message.attachments.map((a) => (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                key={a.url.slice(-24)}
                src={a.url}
                alt={a.name}
                className="size-20 rounded-xl border border-white/14 object-cover"
              />
            ))}
          </div>
        ) : null}

        {message.reasoning ? (
          <Reasoning text={message.reasoning} open={streaming && !message.content} />
        ) : null}

        {(message.content || empty) && (
          <div
            className={cn(
              'overflow-hidden rounded-2xl px-3.5 py-2.5 text-[14.5px] leading-[1.6] font-medium tracking-[-0.005em]',
              isUser
                ? 'rounded-br-md bg-vellum text-abyss'
                : 'rounded-bl-md border border-white/12 bg-ink/78 text-vellum backdrop-blur-xl',
            )}
          >
            {message.content ? (
              <Markdown>{message.content}</Markdown>
            ) : (
              <TypingDots />
            )}
          </div>
        )}

        {message.error ? (
          <div className="flex items-start gap-2 rounded-xl border border-flare/34 bg-flare/12 px-3 py-2 text-[13px] leading-snug font-medium text-vellum backdrop-blur-xl">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-flare" />
            <span>{message.error}</span>
          </div>
        ) : null}

        {!isUser && message.latencyMs && !streaming ? (
          <span className="px-1 font-mono text-[10px] tracking-[0.1em] text-ash uppercase opacity-0 transition-opacity group-hover:opacity-100">
            {provider.label} · first token {message.latencyMs}ms
          </span>
        ) : null}
      </div>

      <Avatar
        className={cn(
          'mb-0.5 size-8 ring-1',
          isUser ? 'bg-white/10 ring-white/16' : 'bg-abyss/80 ring-white/16 backdrop-blur-xl',
        )}
      >
        {isUser ? (
          <AvatarFallback className="bg-transparent text-[10px] text-vellum">
            YOU
          </AvatarFallback>
        ) : (
          <>
            <AvatarImage
              alt=""
              src={iconUrl(provider.slug)}
              className="scale-[0.62]"
            />
            <AvatarFallback className="bg-transparent">
              <Sparkles className="size-3.5 text-flare" />
            </AvatarFallback>
          </>
        )}
      </Avatar>
    </motion.div>
  );
}

/** Reasoning is collapsed by default and opens itself while it streams. */
function Reasoning({ text, open }: { text: string; open: boolean }) {
  const [manual, setManual] = useState<boolean | null>(null);
  const expanded = manual ?? open;

  return (
    <div className="overflow-hidden rounded-xl border border-lilac/24 bg-lilac/8 backdrop-blur-xl">
      <button
        type="button"
        onClick={() => setManual(!expanded)}
        className="flex w-full items-center gap-1.5 px-3 py-1.5 text-left"
      >
        <ChevronRight
          className={cn(
            'size-3 text-lilac transition-transform duration-200',
            expanded && 'rotate-90',
          )}
        />
        <span className="font-mono text-[10px] font-semibold tracking-[0.14em] text-lilac uppercase">
          Reasoning
        </span>
        <span className="ml-auto font-mono text-[10px] text-ash">
          {text.length.toLocaleString('en-US')} chars
        </span>
      </button>
      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="max-h-52 overflow-y-auto px-3 pb-2.5 text-[12.5px] leading-[1.65] whitespace-pre-wrap text-mist [scrollbar-width:thin]">
              {text}
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function TypingDots() {
  return (
    <span className="flex h-5 items-center gap-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="size-1.5 rounded-full bg-flare"
          animate={{ opacity: [0.25, 1, 0.25], y: [0, -2, 0] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.14 }}
        />
      ))}
    </span>
  );
}
