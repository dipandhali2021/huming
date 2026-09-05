import { assertSafeUpstream, authHeaders, extractMessage } from '@/lib/upstream';
import type { Attachment, ChatMessage } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

type Body = {
  baseUrl?: string;
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  system?: string;
  messages?: ChatMessage[];
};

/**
 * Streams an OpenAI-compatible completion back to the browser as
 * newline-delimited JSON. Each line is one of:
 *   {"t":"…"}   text delta
 *   {"r":"…"}   reasoning delta (DeepSeek/Qwen `reasoning_content`)
 *   {"error":"…"}
 *   {"done":true}
 * NDJSON rather than raw SSE so the client parser stays about ten lines.
 */
export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return errorStream('Send JSON.', 400);
  }

  const baseUrl = (body.baseUrl ?? '').trim().replace(/\/+$/, '');
  const apiKey = (body.apiKey ?? '').trim();
  const model = (body.model ?? '').trim();
  const messages = Array.isArray(body.messages) ? body.messages : [];

  if (!baseUrl) return errorStream('No base URL set. Open Settings to connect.', 400);
  if (!model) return errorStream('No model selected. Open Settings to pick one.', 400);
  if (!messages.length) return errorStream('No messages to send.', 400);

  const guard = assertSafeUpstream(baseUrl);
  if (guard) return errorStream(guard, 400);

  const payload = {
    model,
    stream: true,
    temperature: clamp(body.temperature ?? 0.7, 0, 2),
    max_tokens: Math.round(clamp(body.maxTokens ?? 2048, 16, 128_000)),
    messages: [
      ...(body.system?.trim()
        ? [{ role: 'system' as const, content: body.system.trim() }]
        : []),
      ...messages.map(toUpstreamMessage),
    ],
  };

  const upstream = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      ...authHeaders(apiKey, baseUrl),
    },
    body: JSON.stringify(payload),
    signal: req.signal,
  }).catch((err: unknown) => err as Error);

  if (upstream instanceof Error) {
    return errorStream(
      `Could not reach ${baseUrl}/chat/completions. ${upstream.message}`,
      502,
    );
  }

  if (!upstream.ok || !upstream.body) {
    const raw = await upstream.text().catch(() => '');
    const detail = extractMessage(raw);
    return errorStream(
      detail ?? `The model endpoint returned ${upstream.status}.`,
      upstream.status === 401 || upstream.status === 403 ? upstream.status : 502,
    );
  }

  const stream = pipeSse(upstream.body);

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

/** Translate upstream SSE into our NDJSON, one delta per line. */
function pipeSse(source: ReadableStream<Uint8Array>) {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = '';

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: unknown) =>
        controller.enqueue(encoder.encode(`${JSON.stringify(obj)}\n`));
      const reader = source.getReader();

      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith(':')) continue;
            if (!trimmed.startsWith('data:')) continue;

            const data = trimmed.slice(5).trim();
            if (data === '[DONE]') continue;

            let chunk: Record<string, unknown>;
            try {
              chunk = JSON.parse(data) as Record<string, unknown>;
            } catch {
              continue;
            }

            if (chunk.error) {
              send({ error: extractMessage(data) ?? 'The model reported an error.' });
              continue;
            }

            const choice = (chunk.choices as Record<string, unknown>[] | undefined)?.[0];
            const delta = (choice?.delta ?? choice?.message) as
              | Record<string, unknown>
              | undefined;
            if (!delta) continue;

            const reasoning =
              str(delta.reasoning_content) ?? str(delta.reasoning) ?? undefined;
            if (reasoning) send({ r: reasoning });

            const text = str(delta.content);
            if (text) send({ t: text });
          }
        }
        send({ done: true });
      } catch (err) {
        send({
          error:
            err instanceof Error && err.name === 'AbortError'
              ? 'Stopped.'
              : 'The stream ended unexpectedly.',
        });
      } finally {
        controller.close();
        reader.releaseLock();
      }
    },
  });
}

function toUpstreamMessage(m: ChatMessage) {
  const images = (m.attachments ?? []).filter((a) => a.type.startsWith('image/'));
  if (m.role !== 'user' || !images.length) {
    return { role: m.role, content: m.content };
  }
  return {
    role: m.role,
    content: [
      ...(m.content ? [{ type: 'text' as const, text: m.content }] : []),
      ...images.map((a: Attachment) => ({
        type: 'image_url' as const,
        image_url: { url: a.url },
      })),
    ],
  };
}

function str(v: unknown) {
  return typeof v === 'string' && v.length ? v : undefined;
}

function clamp(n: number, lo: number, hi: number) {
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : lo;
}

/** Errors travel in-band so the client has exactly one parser. */
function errorStream(message: string, status: number) {
  return new Response(`${JSON.stringify({ error: message })}\n`, {
    status,
    headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8' },
  });
}
