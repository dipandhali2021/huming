'use client';

import { useCallback, useRef, useState } from 'react';
import type { Attachment, ChatMessage, Connection } from '@/types';

function id() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `m-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Chat state plus the NDJSON stream reader for /api/chat.
 * The whole transcript is held in memory only — reload starts fresh.
 */
export function useChat(connection: Connection) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
  }, []);

  const clear = useCallback(() => {
    stop();
    setMessages([]);
  }, [stop]);

  const send = useCallback(
    async (text: string, attachments: Attachment[] = []) => {
      const trimmed = text.trim();
      if (!trimmed && !attachments.length) return;

      const userMessage: ChatMessage = {
        id: id(),
        role: 'user',
        content: trimmed,
        attachments: attachments.length ? attachments : undefined,
      };
      const replyId = id();

      // Snapshot the history we send, so the request does not depend on
      // a state update having landed.
      let history: ChatMessage[] = [];
      setMessages((prev) => {
        history = [...prev, userMessage];
        return [...history, { id: replyId, role: 'assistant', content: '' }];
      });

      const controller = new AbortController();
      abortRef.current = controller;
      setIsStreaming(true);
      const started = performance.now();
      let firstToken = 0;

      const update = (patch: Partial<ChatMessage>) =>
        setMessages((prev) =>
          prev.map((m) => (m.id === replyId ? { ...m, ...patch } : m)),
        );

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            baseUrl: connection.baseUrl,
            apiKey: connection.apiKey,
            model: connection.model,
            temperature: connection.temperature,
            maxTokens: connection.maxTokens,
            messages: history.map((m) => ({
              role: m.role,
              content: m.content,
              attachments: m.attachments,
            })),
          }),
        });

        if (!res.body) {
          update({ error: 'The server sent no response body.' });
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let content = '';
        let reasoning = '';

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.trim()) continue;
            let event: { t?: string; r?: string; error?: string; done?: boolean };
            try {
              event = JSON.parse(line);
            } catch {
              continue;
            }

            if (event.error) {
              update({ error: event.error });
              continue;
            }
            if (event.r) {
              reasoning += event.r;
              if (!firstToken) firstToken = performance.now() - started;
              update({ reasoning, latencyMs: Math.round(firstToken) });
            }
            if (event.t) {
              content += event.t;
              if (!firstToken) firstToken = performance.now() - started;
              update({ content, latencyMs: Math.round(firstToken) });
            }
          }
        }

        // Empty and no error: say so rather than leaving a blank bubble.
        setMessages((prev) =>
          prev.map((m) =>
            m.id === replyId && !m.content && !m.reasoning && !m.error
              ? { ...m, error: 'The model returned an empty response.' }
              : m,
          ),
        );
      } catch (err) {
        const aborted = err instanceof Error && err.name === 'AbortError';
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id !== replyId) return m;
            if (aborted) {
              return m.content || m.reasoning
                ? { ...m, content: `${m.content}\n\n_Stopped._` }
                : { ...m, error: 'Stopped before the first token.' };
            }
            return { ...m, error: 'The connection dropped mid-stream.' };
          }),
        );
      } finally {
        abortRef.current = null;
        setIsStreaming(false);
      }
    },
    [connection],
  );

  return { messages, isStreaming, send, stop, clear };
}
