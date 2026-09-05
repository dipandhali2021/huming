'use client';

import { Check, Copy } from 'lucide-react';
import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

type Block =
  | { kind: 'code'; lang: string; body: string }
  | { kind: 'text'; body: string };

/**
 * A small renderer for streamed model output. It handles the things
 * models actually emit — fenced code, inline code, bold, headings,
 * bullets — and leaves everything else as text. An unterminated fence
 * still renders, because mid-stream that is the normal state.
 */
export function Markdown({ children }: { children: string }) {
  const blocks = useMemo(() => splitFences(children), [children]);

  return (
    <div className="flex flex-col gap-3">
      {blocks.map((block, i) =>
        block.kind === 'code' ? (
          <CodeBlock key={i} lang={block.lang} body={block.body} />
        ) : (
          <Prose key={i} body={block.body} />
        ),
      )}
    </div>
  );
}

function splitFences(input: string): Block[] {
  const out: Block[] = [];
  const re = /```([\w+-]*)\n?([\s\S]*?)(?:```|$)/g;
  let last = 0;
  let m: RegExpExecArray | null;

  while ((m = re.exec(input))) {
    if (m.index > last) out.push({ kind: 'text', body: input.slice(last, m.index) });
    out.push({ kind: 'code', lang: m[1] || 'text', body: m[2].replace(/\n$/, '') });
    last = re.lastIndex;
  }
  if (last < input.length) out.push({ kind: 'text', body: input.slice(last) });
  return out.filter((b) => b.kind === 'code' || b.body.trim().length > 0);
}

function CodeBlock({ lang, body }: { lang: string; body: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(body);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard blocked — the text is selectable anyway */
    }
  };

  return (
    <figure className="overflow-hidden rounded-xl border border-white/12 bg-abyss/70">
      <figcaption className="flex items-center justify-between border-b border-white/8 px-3 py-1.5">
        <span className="font-mono text-[10px] font-semibold tracking-[0.14em] text-ash uppercase">
          {lang}
        </span>
        <button
          type="button"
          onClick={copy}
          className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-ash transition-colors hover:bg-white/8 hover:text-vellum"
        >
          {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </figcaption>
      <pre className="overflow-x-auto px-3 py-2.5 [scrollbar-width:thin]">
        <code className="font-mono text-[12.5px] leading-[1.65] text-vellum/92">
          {body}
        </code>
      </pre>
    </figure>
  );
}

function Prose({ body }: { body: string }) {
  const lines = body.replace(/\n{3,}/g, '\n\n').split('\n');

  return (
    <div className="flex flex-col gap-1.5">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <span key={i} className="h-1" />;

        const heading = trimmed.match(/^(#{1,4})\s+(.*)$/);
        if (heading) {
          return (
            <p
              key={i}
              className={cn(
                'font-bold tracking-tight text-vellum',
                heading[1].length <= 2 ? 'mt-1 text-[16px]' : 'text-[14px]',
              )}
            >
              <Inline text={heading[2]} />
            </p>
          );
        }

        const bullet = trimmed.match(/^[-*•]\s+(.*)$/);
        if (bullet) {
          return (
            <p key={i} className="flex gap-2 pl-0.5">
              <span aria-hidden className="mt-[7px] size-1 shrink-0 rounded-full bg-flare" />
              <span className="flex-1">
                <Inline text={bullet[1]} />
              </span>
            </p>
          );
        }

        const numbered = trimmed.match(/^(\d+)[.)]\s+(.*)$/);
        if (numbered) {
          return (
            <p key={i} className="flex gap-2">
              <span className="font-mono text-[12px] font-semibold text-flare">
                {numbered[1]}
              </span>
              <span className="flex-1">
                <Inline text={numbered[2]} />
              </span>
            </p>
          );
        }

        return (
          <p key={i}>
            <Inline text={trimmed} />
          </p>
        );
      })}
    </div>
  );
}

/** Inline code, bold, italic. Split on all three at once to keep order. */
function Inline({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|(?<!\*)\*[^*\n]+\*(?!\*))/g);

  return (
    <>
      {parts.map((part, i) => {
        if (!part) return null;
        if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
          return (
            <code
              key={i}
              className="rounded-[5px] bg-white/10 px-1 py-px font-mono text-[0.86em] text-lilac"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
          return (
            <strong key={i} className="font-bold text-vellum">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
          return (
            <em key={i} className="text-vellum/90 italic">
              {part.slice(1, -1)}
            </em>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}
