'use client';

import {
  ArrowUp,
  Mic,
  Paperclip,
  Settings,
  Square,
  StopCircle,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ImageViewDialog } from '@/components/composer/image-view-dialog';
import { ModelMenu } from '@/components/composer/model-menu';
import { ModelPill } from '@/components/composer/model-pill';
import { VoiceRecorder } from '@/components/composer/voice-recorder';
import { cn } from '@/lib/utils';
import type { Attachment, ConnectionStatus, ModelInfo } from '@/types';

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_HEIGHT = 260;
const PLACEHOLDER = 'Ask the model something';

/** Shared by the two tool buttons beside the pill. */
const ICON_BUTTON = cn(
  'grid size-8 shrink-0 place-items-center rounded-full text-ash',
  'transition-colors hover:bg-white/8 hover:text-vellum',
  'disabled:pointer-events-none disabled:opacity-40',
);

export function PromptInput({
  onSend,
  onOpenSettings,
  onStop,
  isStreaming,
  model,
  endpoint,
  models,
  modelStatus,
  onSelectModel,
  onRequestModels,
  disabled,
  disabledHint,
  className,
}: {
  onSend: (text: string, files: Attachment[]) => void;
  onOpenSettings: () => void;
  onStop: () => void;
  isStreaming: boolean;
  /** The model in play, shown on the pill that opens the switcher. */
  model: string;
  /** Gateway label or host, the small mono line beside the model. */
  endpoint: string;
  /** Everything the endpoint offers, for the switcher on the pill. */
  models: ModelInfo[];
  modelStatus: ConnectionStatus;
  onSelectModel: (id: string) => void;
  /** Ask for the list, if nothing has asked for it yet. */
  onRequestModels: () => void;
  disabled?: boolean;
  disabledHint?: string;
  className?: string;
}) {
  const [value, setValue] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [preview, setPreview] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const modelRef = useRef<HTMLDivElement>(null);

  const hasContent = value.trim().length > 0 || attachments.length > 0;
  const locked = Boolean(disabled) || recording;

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
  }, [value]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 3200);
    return () => clearTimeout(t);
  }, [notice]);

  const accept = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setNotice(`${file.name} is not an image. Images only for now.`);
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setNotice(`${file.name} is over 10MB.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result;
      if (typeof url !== 'string') return;
      setAttachments((prev) => {
        const next = [...prev, { name: file.name, type: file.type, url }];
        return next.slice(-4);
      });
    };
    reader.onerror = () => setNotice(`Could not read ${file.name}.`);
    reader.readAsDataURL(file);
  }, []);

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const items = Array.from(e.clipboardData?.items ?? []);
      const images = items.filter((i) => i.type.startsWith('image/'));
      if (!images.length) return;
      e.preventDefault();
      for (const item of images) {
        const file = item.getAsFile();
        if (file) accept(file);
      }
    };
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  }, [accept]);

  // The switcher dismisses the way a popover should. pointerdown, not
  // click: a press that starts on the list and ends outside it — a drag
  // on the filter's scrollbar, say — is not an outside click. The pill
  // sits inside modelRef too, so pressing it falls through to its own
  // handler and toggles rather than closing and reopening.
  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!modelRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const submit = () => {
    if (!hasContent || locked) return;
    onSend(value.trim(), attachments);
    setValue('');
    setAttachments([]);
  };

  /** With no endpoint answering there is nothing to switch between. */
  const openModels = () => {
    if (disabled) return onOpenSettings();
    onRequestModels();
    setMenuOpen((v) => !v);
  };

  const primaryAction = () => {
    if (isStreaming) return onStop();
    if (recording) return setRecording(false);
    if (hasContent) return submit();
    setRecording(true);
  };

  return (
    <TooltipProvider delayDuration={340}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          Array.from(e.dataTransfer.files).forEach(accept);
        }}
        className={cn(
          'relative rounded-[18px] border bg-ink/78 p-2 backdrop-blur-2xl',
          'shadow-[0_24px_70px_-24px_rgba(0,0,0,0.92)]',
          'transition-[border-color,box-shadow] duration-300',
          dragging
            ? 'border-white/55 shadow-[0_0_0_4px_rgba(255,255,255,0.09)]'
            : recording
              ? 'border-white/40'
              : 'border-white/14 focus-within:border-white/30',
          className,
        )}
      >
        <AnimatePresence>
          {notice ? (
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className="absolute -top-9 left-1 rounded-lg border border-white/22 bg-abyss/92 px-2.5 py-1 text-[12px] font-medium text-vellum backdrop-blur-xl"
            >
              {notice}
            </motion.p>
          ) : null}
        </AnimatePresence>

        <AnimatePresence initial={false}>
          {attachments.length && !recording ? (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap gap-2 px-1 pt-1 pb-2">
                {attachments.map((file, index) => (
                  <div key={file.url.slice(-24)} className="group relative">
                    <button
                      type="button"
                      onClick={() => setPreview(file.url)}
                      className="block size-16 overflow-hidden rounded-xl border border-white/16"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={file.url}
                        alt={file.name}
                        className="size-full object-cover"
                      />
                    </button>
                    <button
                      type="button"
                      aria-label={`Remove ${file.name}`}
                      onClick={() =>
                        setAttachments((prev) => prev.filter((_, i) => i !== index))
                      }
                      className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full border border-white/20 bg-abyss text-mist transition-colors hover:text-vellum"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div
          className={cn(
            'transition-all duration-300',
            recording ? 'h-0 overflow-hidden opacity-0' : 'opacity-100',
          )}
        >
          <Textarea
            ref={textareaRef}
            value={value}
            disabled={locked}
            placeholder={disabled ? (disabledHint ?? '') : PLACEHOLDER}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            style={{ maxHeight: MAX_HEIGHT }}
          />
        </div>

        {recording ? (
          <VoiceRecorder
            onStop={(seconds) => {
              if (seconds > 0) onSend(`[Voice note — ${seconds}s]`, []);
            }}
          />
        ) : null}

        <div className="flex items-center justify-between gap-2 px-1 pt-1.5">
          <div
            className={cn(
              'flex min-w-0 items-center gap-0.5 transition-opacity duration-300',
              recording ? 'invisible h-0 opacity-0' : 'visible opacity-100',
            )}
          >
            <div ref={modelRef} className="relative min-w-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="min-w-0">
                    <ModelPill
                      model={model}
                      endpoint={endpoint}
                      connected={!disabled}
                      streaming={isStreaming}
                      onClick={openModels}
                    />
                  </div>
                </TooltipTrigger>
                {/* Out of the way while the list it opens is on screen. */}
                {menuOpen ? null : (
                  <TooltipContent>
                    {disabled ? 'Paste a curl command' : 'Switch model'}
                  </TooltipContent>
                )}
              </Tooltip>

              <ModelMenu
                open={menuOpen}
                models={models}
                status={modelStatus}
                selected={model}
                onSelect={onSelectModel}
                onClose={() => setMenuOpen(false)}
                onOpenSettings={onOpenSettings}
              />
            </div>

            <Divider />

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  disabled={locked}
                  onClick={() => fileRef.current?.click()}
                  className={ICON_BUTTON}
                >
                  <Paperclip className="size-4.5" />
                  <span className="sr-only">Attach an image</span>
                </button>
              </TooltipTrigger>
              <TooltipContent>Attach an image</TooltipContent>
            </Tooltip>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                Array.from(e.target.files ?? []).forEach(accept);
                e.target.value = '';
              }}
            />

            {/* Not disabled with the rest: a connection that needs
                fixing is exactly when this has to stay reachable. */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className={ICON_BUTTON}
                >
                  <Settings className="size-4.5" />
                  <span className="sr-only">Connection settings</span>
                </button>
              </TooltipTrigger>
              <TooltipContent>Connection settings</TooltipContent>
            </Tooltip>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 pl-1.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant={hasContent && !isStreaming ? 'accent' : 'ghost'}
                  onClick={primaryAction}
                  disabled={disabled && !isStreaming && !recording}
                  className={cn(
                    isStreaming && 'bg-white/10 text-vellum hover:bg-white/16',
                    recording && 'text-vellum hover:bg-white/16',
                  )}
                >
                  {isStreaming ? (
                    <Square className="size-3.5 fill-current" />
                  ) : recording ? (
                    <StopCircle className="size-4.5" />
                  ) : hasContent ? (
                    <ArrowUp className="size-4.5" />
                  ) : (
                    <Mic className="size-4.5" />
                  )}
                  <span className="sr-only">
                    {isStreaming
                      ? 'Stop generating'
                      : recording
                        ? 'Stop recording'
                        : hasContent
                          ? 'Send message'
                          : 'Record a voice note'}
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isStreaming
                  ? 'Stop generating'
                  : recording
                    ? 'Stop recording'
                    : hasContent
                      ? 'Send  ·  Enter'
                      : 'Record a voice note'}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>

      <ImageViewDialog url={preview} onClose={() => setPreview(null)} />
    </TooltipProvider>
  );
}

/**
 * The notched hairline between the pill and the tool buttons. The notch
 * is a clip-path rather than two elements, so it stays centred whatever
 * the rule's height.
 */
function Divider() {
  return (
    <span aria-hidden className="relative mx-0.5 h-6 w-[1.5px] shrink-0">
      <span
        className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent via-lilac/60 to-transparent"
        style={{
          clipPath:
            'polygon(0% 0%, 100% 0%, 100% 40%, 150% 50%, 100% 60%, 100% 100%, 0% 100%, 0% 60%, -50% 50%, 0% 40%)',
        }}
      />
    </span>
  );
}
