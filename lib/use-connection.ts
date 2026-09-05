'use client';

import { useCallback, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import {
  DEFAULT_CONNECTION,
  getServerSnapshot,
  getSnapshot,
  patchConnection,
  resetConnection,
  subscribe,
  updateConnection,
} from '@/lib/connection-store';
import { gatewayFor } from '@/lib/providers';
import type { Connection, ConnectionStatus, ModelInfo } from '@/types';

export { DEFAULT_CONNECTION };

/**
 * The live connection, plus the /models fetch that validates it.
 *
 * The connection itself is held in an external store backed by
 * localStorage (see connection-store.ts), so it is read here rather
 * than copied into component state.
 */
export function useConnection() {
  const connection = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const [models, setModels] = useState<ModelInfo[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  /** Whether a list has already been asked for, so we ask exactly once. */
  const requestedRef = useRef(false);

  const patch = useCallback((next: Partial<Connection>) => {
    patchConnection(next);
  }, []);

  /** Ask our proxy for /models. Returns the list so callers can chain. */
  const fetchModels = useCallback(
    async (override?: { baseUrl?: string; apiKey?: string }) => {
      const current = getSnapshot();
      const baseUrl = (override?.baseUrl ?? current.baseUrl).trim();
      const apiKey = (override?.apiKey ?? current.apiKey).trim();

      if (!baseUrl) {
        setStatus('error');
        setError('Add a base URL, or paste a curl command.');
        return [];
      }

      requestedRef.current = true;
      setStatus('checking');
      setError(null);

      try {
        const res = await fetch('/api/models', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ baseUrl, apiKey }),
        });
        const json = (await res.json()) as { models?: ModelInfo[]; error?: string };

        if (!res.ok || !json.models?.length) {
          setModels([]);
          setStatus('error');
          setError(json.error ?? `The endpoint returned ${res.status}.`);
          return [];
        }

        const found = json.models;
        setModels(found);
        setStatus('ready');

        // Keep the chosen model if the endpoint still offers it.
        updateConnection((prev) =>
          found.some((m) => m.id === prev.model)
            ? prev
            : { ...prev, model: found[0].id },
        );

        return found;
      } catch {
        setModels([]);
        setStatus('error');
        setError('The request failed before it reached the endpoint.');
        return [];
      }
    },
    [],
  );

  /**
   * Load the model list for a remembered connection, once.
   *
   * Called from the handler that opens Settings rather than from a mount
   * effect. Two reasons: the list is only ever read inside the Settings
   * panel, and a page load then makes no network call and sends the
   * stored key nowhere until the user asks for something.
   */
  const ensureModels = useCallback(() => {
    if (requestedRef.current) return;
    if (!getSnapshot().baseUrl) return;
    requestedRef.current = true;
    void fetchModels();
  }, [fetchModels]);

  const reset = useCallback(() => {
    requestedRef.current = false;
    resetConnection();
    setModels([]);
    setStatus('idle');
    setError(null);
  }, []);

  const gateway = useMemo(() => gatewayFor(connection.baseUrl), [connection.baseUrl]);
  const isReady = Boolean(connection.baseUrl && connection.model);

  return {
    connection,
    patch,
    models,
    status,
    error,
    fetchModels,
    ensureModels,
    reset,
    gateway,
    isReady,
  };
}

export type ConnectionController = ReturnType<typeof useConnection>;
