'use client';

import { Check, Loader2, Settings } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { ProviderIcon } from '@/components/ui/provider-icon';
import { prettyModel } from '@/lib/providers';
import { cn } from '@/lib/utils';
import type { ConnectionStatus, ModelInfo } from '@/types';

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * The model switcher, opening upward off the pill it belongs to.
 *
 * Switching model is the one connection setting you change mid-thread,
 * so it happens here rather than behind the Settings card: the same
 * models the card lists, in the place you were already looking.
 * Everything else about the connection — endpoint, key, sampling — stays
 * in the card, and so does the filtering. This is a menu, sized to the
 * names in it: w-max, capped, and only as tall as the list.
 *
 * Upward and left-aligned because the pill is in the bottom-left of the
 * composer, which is itself at the bottom of the page. There is no room
 * below it and no reason to look for any.
 */
export function ModelMenu({
  open,
  models,
  status,
  selected,
  onSelect,
  onClose,
  onOpenSettings,
}: {
  open: boolean;
  models: ModelInfo[];
  status: ConnectionStatus;
  selected: string;
  onSelect: (id: string) => void;
  onClose: () => void;
  onOpenSettings: () => void;
}) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="model-menu"
          role="dialog"
          aria-label="Switch model"
          initial={{ opacity: 0, y: 6, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.985 }}
          transition={{ duration: 0.18, ease: EASE }}
          style={{ transformOrigin: 'bottom left' }}
          className={cn(
            'absolute bottom-full left-0 z-30 mb-2 overflow-hidden',
            'w-max min-w-[12rem] max-w-[min(86vw,22rem)]',
            'rounded-[14px] border border-white/12 bg-ink/94 p-1.5 backdrop-blur-2xl',
            'shadow-[0_20px_60px_-18px_rgba(0,0,0,0.95)]',
          )}
        >
          {models.length ? (
            <ul
              className={cn(
                'flex max-h-[min(52vh,340px)] flex-col gap-0.5 overflow-y-auto',
                '[scrollbar-color:rgba(255,255,255,0.18)_transparent] [scrollbar-width:thin]',
              )}
            >
              {models.map((entry) => {
                const isSelected = entry.id === selected;
                return (
                  <li key={entry.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(entry.id);
                        onClose();
                      }}
                      title={entry.id}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-[10px] px-2 py-1.5',
                        'text-left transition-colors',
                        isSelected
                          ? 'bg-white/10 text-vellum'
                          : 'text-mist hover:bg-white/6 hover:text-vellum',
                      )}
                    >
                      <ProviderIcon model={entry.id} size={15} />
                      <span className="min-w-0 flex-1 truncate text-[13px] font-semibold tracking-tight">
                        {prettyModel(entry.id)}
                      </span>
                      {isSelected ? <Check className="size-3.5 shrink-0" /> : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : status === 'checking' ? (
            <p className="flex items-center gap-2 px-2 py-2.5 text-[12.5px] font-medium text-ash">
              <Loader2 className="size-3.5 shrink-0 animate-spin" />
              Reading the model list…
            </p>
          ) : (
            <div className="flex flex-col items-start gap-2 p-1.5">
              <p className="text-[12.5px] leading-snug font-medium text-ash">
                {status === 'error'
                  ? 'The endpoint returned no model list.'
                  : 'No models yet.'}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onOpenSettings();
                }}
                className="gap-1.5"
              >
                <Settings className="size-3" />
                Connection settings
              </Button>
            </div>
          )}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
