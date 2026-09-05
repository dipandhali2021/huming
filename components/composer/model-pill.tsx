'use client';

import { motion } from 'motion/react';
import { ProviderIcon } from '@/components/ui/provider-icon';
import { prettyModel, providerFor } from '@/lib/providers';
import { cn } from '@/lib/utils';

/**
 * Who you are talking to, sitting in the composer's tool row.
 *
 * It is the entry to Settings as well as the readout — the model is the
 * one thing you change often enough that it should be one click from the
 * box you type in, and there is no second gear competing with it.
 *
 * Unconnected, the same control says what to do instead of what is: the
 * empty state has one action, and this is it.
 */
export function ModelPill({
  model,
  endpoint,
  connected,
  streaming,
  onClick,
}: {
  model: string;
  endpoint: string;
  connected: boolean;
  streaming: boolean;
  onClick: () => void;
}) {
  const provider = connected ? providerFor(model) : undefined;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={false}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'flex min-w-0 shrink items-center gap-1.5 rounded-full border py-1 pr-2.5 pl-1',
        'transition-colors',
        connected
          ? 'border-white/12 bg-white/5 hover:border-white/26 hover:bg-white/10'
          : 'border-white/22 bg-white/8 hover:border-white/40 hover:bg-white/14',
      )}
    >
      {connected ? (
        <>
          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-white/8">
            <ProviderIcon model={model} size={13} />
          </span>
          <span className="min-w-0 truncate text-[12.5px] font-semibold tracking-tight text-vellum">
            {prettyModel(model)}
          </span>
          <span
            className="hidden shrink-0 font-mono text-[10px] tracking-wide text-ash sm:inline"
            title={endpoint}
          >
            {endpoint}
          </span>
          <span
            aria-hidden
            className={cn(
              'ml-0.5 size-1.5 shrink-0 rounded-full',
              streaming ? 'animate-pulse bg-flare' : 'bg-tide',
            )}
          />
          <span className="sr-only">
            {streaming ? 'Streaming from' : 'Connected to'} {provider?.label}{' '}
            {model}. Change the connection.
          </span>
        </>
      ) : (
        <span className="px-1.5 text-[12.5px] font-semibold tracking-tight text-vellum">
          Connect an endpoint
        </span>
      )}
    </motion.button>
  );
}
