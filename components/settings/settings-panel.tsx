'use client';

import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  RotateCcw,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ProviderIcon } from '@/components/ui/provider-icon';
import { CurlImport } from '@/components/settings/curl-import';
import { ModelPicker } from '@/components/settings/model-picker';
import type { ConnectionController } from '@/lib/use-connection';
import { useMediaQuery } from '@/lib/use-media';
import { cn, hostOf } from '@/lib/utils';

const PANEL_EASE = [0.22, 1, 0.36, 1] as const;

/**
 * The card floats: the same inset on all four sides, so it reads as a
 * sheet laid over the scene rather than a wall bolted to the edge.
 */
export const PANEL_GAP = 36;
export const PANEL_WIDTH = 560;

/**
 * Width the docked card takes out of the page: its own, plus the inset
 * on its left. Not the inset on its right — that sits between the card
 * and the screen edge, so widening it pushes the card away from the
 * edge without pushing the page away from the card.
 *
 * The page's own gutter is then all that stands between the thread and
 * the card, which is the closest they can sit without the thread losing
 * the gutter it has everywhere else.
 */
export const PANEL_ROOM = PANEL_WIDTH + PANEL_GAP;

/**
 * The page's own gutter beside the thread, from app/page.tsx — needed
 * here only to work out when docking still leaves a usable column.
 */
const PAGE_GUTTER = 28 * 2;

/**
 * The narrowest the thread may be squeezed to. The composer's tool row
 * needs about 365px before the buttons start colliding; 420 leaves the
 * model name somewhere to truncate to.
 */
const MIN_COLUMN = 420;

/**
 * Above this the page has width to spare and gives some up (see
 * app/page.tsx). Below it there is none, so the card goes back to
 * covering the thread behind a scrim you can click away.
 *
 * Derived rather than written down, because it moves with the card: a
 * wider card has to dock later or it reflows the thread into something
 * too narrow to hold a composer.
 */
export const PANEL_DOCK_QUERY = `(min-width: ${PANEL_ROOM + PAGE_GUTTER + MIN_COLUMN}px)`;

/**
 * The right-hand settings card. It slides in over the scene, and the
 * scene keeps playing behind it — the card is translucent on purpose,
 * so the room stays visible while you wire it up.
 *
 * Docked, it takes no scrim and the thread beside it stays lit and
 * live: you can read the last answer, or keep typing, while you swap
 * the model that will handle the next one.
 */
export function SettingsPanel({
  open,
  onClose,
  controller,
}: {
  open: boolean;
  onClose: () => void;
  controller: ConnectionController;
}) {
  const { connection, patch, models, status, error, fetchModels, reset, gateway } =
    controller;
  const [showKey, setShowKey] = useState(false);
  const docked = useMediaQuery(PANEL_DOCK_QUERY);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <>
          {/* Nothing to dim when the thread has moved out of the way. */}
          {docked ? null : (
            <motion.button
              key="scrim"
              type="button"
              aria-label="Close settings"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.28 }}
              onClick={onClose}
              className="fixed inset-0 z-40 cursor-default bg-abyss/55 backdrop-blur-[3px]"
            />
          )}

          {/*
            110%, not 100%: the card has to clear its own gap to be
            fully off-screen, and a tenth of its width always beats the
            14px it sits in from the edge.
          */}
          <motion.aside
            key="panel"
            role="dialog"
            aria-label="Connection settings"
            initial={{ x: '110%' }}
            animate={{ x: 0 }}
            exit={{ x: '110%' }}
            transition={{ duration: 0.44, ease: PANEL_EASE }}
            style={{
              top: PANEL_GAP,
              right: PANEL_GAP,
              bottom: PANEL_GAP,
              width: `min(100vw - ${PANEL_GAP * 2}px, ${PANEL_WIDTH}px)`,
            }}
            className={cn(
              'fixed z-50 flex flex-col overflow-hidden rounded-[18px]',
              'border border-white/12 bg-ink/88 backdrop-blur-3xl',
              'shadow-[0_28px_80px_-24px_rgba(0,0,0,0.95)]',
            )}
          >
            <header className="flex shrink-0 items-start justify-between gap-3 border-b border-white/8 px-5 pt-5 pb-4">
              <div className="min-w-0">
                <h2 className="text-[19px] leading-none font-extrabold tracking-[-0.03em] text-vellum">
                  Connection
                </h2>
                <p className="mt-1.5 text-[12.5px] leading-snug font-medium text-ash">
                  Any OpenAI-compatible endpoint. Nothing leaves this browser
                  except the calls you make.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="grid size-8 shrink-0 place-items-center rounded-full text-ash transition-colors hover:bg-white/8 hover:text-vellum"
              >
                <X className="size-4" />
                <span className="sr-only">Close settings</span>
              </button>
            </header>

            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-4 [scrollbar-color:rgba(255,255,255,0.16)_transparent] [scrollbar-width:thin]">
              <CurlImport
                onImport={(parsed) => {
                  patch({
                    baseUrl: parsed.baseUrl ?? connection.baseUrl,
                    apiKey: parsed.apiKey ?? connection.apiKey,
                    ...(parsed.model ? { model: parsed.model } : {}),
                  });
                  if (parsed.baseUrl) {
                    void fetchModels({
                      baseUrl: parsed.baseUrl,
                      apiKey: parsed.apiKey ?? connection.apiKey,
                    });
                  }
                }}
              />

              <Divider />

              <Field label="Base URL" hint="Ends at /v1 — we add /models and /chat/completions">
                <div className="flex items-center gap-2 rounded-xl border border-white/12 bg-abyss/60 px-2.5 focus-within:border-white/28">
                  {gateway ? (
                    <ProviderIcon slug={gateway.slug} size={15} />
                  ) : null}
                  <input
                    value={connection.baseUrl}
                    onChange={(e) => patch({ baseUrl: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && void fetchModels()}
                    placeholder="https://api.openai.com/v1"
                    spellCheck={false}
                    autoComplete="off"
                    className="h-10 min-w-0 flex-1 border-none bg-transparent font-mono text-[12.5px] text-vellum placeholder:text-ash/60 focus-visible:outline-none"
                  />
                </div>
              </Field>

              <Field label="API key" hint="Stored in this browser only">
                <div className="flex items-center gap-2 rounded-xl border border-white/12 bg-abyss/60 px-2.5 focus-within:border-white/28">
                  <input
                    value={connection.apiKey}
                    onChange={(e) => patch({ apiKey: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && void fetchModels()}
                    type={showKey ? 'text' : 'password'}
                    placeholder="sk-…  (leave empty for local models)"
                    spellCheck={false}
                    autoComplete="off"
                    className="h-10 min-w-0 flex-1 border-none bg-transparent font-mono text-[12.5px] text-vellum placeholder:text-ash/60 focus-visible:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey((v) => !v)}
                    className="shrink-0 text-ash transition-colors hover:text-vellum"
                  >
                    {showKey ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                    <span className="sr-only">
                      {showKey ? 'Hide the key' : 'Show the key'}
                    </span>
                  </button>
                </div>
              </Field>

              <div className="flex items-center gap-2">
                <Button
                  variant="solid"
                  size="md"
                  onClick={() => void fetchModels()}
                  disabled={status === 'checking' || !connection.baseUrl.trim()}
                  className="flex-1"
                >
                  {status === 'checking' ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      Fetching models
                    </>
                  ) : (
                    'Fetch models'
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  onClick={reset}
                  className="px-3"
                  title="Forget this connection"
                >
                  <RotateCcw className="size-3.5" />
                  <span className="sr-only">Forget this connection</span>
                </Button>
              </div>

              <StatusLine status={status} error={error} count={models.length} url={connection.baseUrl} />

              {models.length ? (
                <>
                  <Divider />
                  <div className="flex min-h-[240px] flex-col gap-2">
                    <p className="text-[11px] font-bold tracking-[0.12em] text-ash uppercase">
                      Model
                    </p>
                    <ModelPicker
                      models={models}
                      selected={connection.model}
                      onSelect={(id) => patch({ model: id })}
                    />
                  </div>
                </>
              ) : null}

              <Divider />

              <div className="grid grid-cols-2 gap-3">
                <Slider
                  label="Temperature"
                  value={connection.temperature}
                  min={0}
                  max={2}
                  step={0.1}
                  display={connection.temperature.toFixed(1)}
                  onChange={(temperature) => patch({ temperature })}
                />
                <Slider
                  label="Max tokens"
                  value={connection.maxTokens}
                  min={256}
                  max={16384}
                  step={256}
                  display={connection.maxTokens.toLocaleString('en-US')}
                  onChange={(maxTokens) => patch({ maxTokens })}
                />
              </div>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function StatusLine({
  status,
  error,
  count,
  url,
}: {
  status: ConnectionController['status'];
  error: string | null;
  count: number;
  url: string;
}) {
  if (status === 'error' && error) {
    return (
      <p className="flex items-start gap-2 rounded-xl border border-flare/34 bg-flare/12 px-3 py-2 text-[12.5px] leading-snug font-medium text-vellum">
        <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-flare" />
        <span>{error}</span>
      </p>
    );
  }
  if (status === 'ready' && count) {
    return (
      <p className="flex items-start gap-2 rounded-xl border border-tide/40 bg-tide/12 px-3 py-2 text-[12.5px] leading-snug font-medium text-vellum">
        <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-tide" />
        <span>
          {count.toLocaleString('en-US')} models on {hostOf(url)}
        </span>
      </p>
    );
  }
  return null;
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] font-bold tracking-[0.12em] text-ash uppercase">
        {label}
      </span>
      {children}
      {hint ? <span className="text-[11.5px] font-medium text-ash/80">{hint}</span> : null}
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="flex items-baseline justify-between gap-2">
        <span className="text-[11px] font-bold tracking-[0.12em] text-ash uppercase">
          {label}
        </span>
        <span className="font-mono text-[12px] font-semibold text-vellum">{display}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={cn(
          'h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/14',
          '[&::-webkit-slider-thumb]:size-3.5 [&::-webkit-slider-thumb]:appearance-none',
          '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-vellum',
          '[&::-webkit-slider-thumb]:shadow-[0_0_0_4px_rgba(255,127,180,0.2)]',
          '[&::-moz-range-thumb]:size-3.5 [&::-moz-range-thumb]:rounded-full',
          '[&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:bg-vellum',
        )}
      />
    </label>
  );
}

function Divider() {
  return <span aria-hidden className="h-px w-full shrink-0 bg-white/8" />;
}
