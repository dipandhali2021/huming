'use client';

import type { Connection } from '@/types';

const STORAGE_KEY = 'huming.connection.v1';

export const DEFAULT_CONNECTION: Connection = Object.freeze({
  baseUrl: '',
  apiKey: '',
  model: '',
  temperature: 0.7,
  maxTokens: 2048,
});

/**
 * The connection as an external store, read through useSyncExternalStore.
 *
 * localStorage is an external system, so this is the API for reading it:
 * no effect, no cascading render on mount, and no hydration mismatch —
 * the server snapshot is the frozen default and the real value arrives
 * on the first client render. Subscribing to `storage` also keeps two
 * open tabs in step.
 *
 * The API key lives here and nowhere else. It is never sent to our own
 * server except on the request that needs it, and never persisted
 * server-side.
 */
let cache: Connection = DEFAULT_CONNECTION;
let loaded = false;
const listeners = new Set<() => void>();

function read(): Connection {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONNECTION;
    const saved = JSON.parse(raw) as Partial<Connection>;
    return { ...DEFAULT_CONNECTION, ...saved };
  } catch {
    return DEFAULT_CONNECTION; // absent, blocked, or corrupt
  }
}

function emit() {
  for (const listener of listeners) listener();
}

/** Must return a stable reference while nothing has changed. */
export function getSnapshot(): Connection {
  if (!loaded) {
    cache = read();
    loaded = true;
  }
  return cache;
}

export function getServerSnapshot(): Connection {
  return DEFAULT_CONNECTION;
}

export function subscribe(listener: () => void) {
  listeners.add(listener);

  const onStorage = (e: StorageEvent) => {
    if (e.key !== null && e.key !== STORAGE_KEY) return;
    cache = read();
    emit();
  };
  window.addEventListener('storage', onStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

export function patchConnection(patch: Partial<Connection>) {
  const next = { ...getSnapshot(), ...patch };
  if (isSame(cache, next)) return cache;
  cache = next;
  persist(next);
  emit();
  return next;
}

/** For updates that need the current value, e.g. "keep the model if it still exists". */
export function updateConnection(fn: (current: Connection) => Connection) {
  return patchConnection(fn(getSnapshot()));
}

export function resetConnection() {
  cache = DEFAULT_CONNECTION;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* nothing to clear */
  }
  emit();
}

function persist(value: Connection) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    /* private mode or quota — the session still works, it just won't persist */
  }
}

function isSame(a: Connection, b: Connection) {
  return (
    a.baseUrl === b.baseUrl &&
    a.apiKey === b.apiKey &&
    a.model === b.model &&
    a.temperature === b.temperature &&
    a.maxTokens === b.maxTokens
  );
}
