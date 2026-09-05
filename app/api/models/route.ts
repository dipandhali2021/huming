import { NextResponse } from 'next/server';
import { assertSafeUpstream, authHeaders, extractMessage } from '@/lib/upstream';
import type { ModelInfo } from '@/types';
import { providerFor } from '@/lib/providers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Body = { baseUrl?: string; apiKey?: string };

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'Send JSON.' }, { status: 400 });
  }

  const baseUrl = (body.baseUrl ?? '').trim().replace(/\/+$/, '');
  const apiKey = (body.apiKey ?? '').trim();

  if (!baseUrl) {
    return NextResponse.json({ error: 'Add a base URL first.' }, { status: 400 });
  }

  const guard = assertSafeUpstream(baseUrl);
  if (guard) return NextResponse.json({ error: guard }, { status: 400 });

  const target = `${baseUrl}/models`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);

  try {
    const res = await fetch(target, {
      headers: { Accept: 'application/json', ...authHeaders(apiKey, baseUrl) },
      signal: controller.signal,
      cache: 'no-store',
    });

    const raw = await res.text();

    if (!res.ok) {
      return NextResponse.json(
        { error: describeUpstream(res.status, raw) },
        { status: res.status === 401 || res.status === 403 ? res.status : 502 },
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json(
        { error: `${target} did not return JSON. Is this the right base URL?` },
        { status: 502 },
      );
    }

    const models = normalise(parsed);
    if (!models.length) {
      return NextResponse.json(
        { error: 'The endpoint answered but listed no models.' },
        { status: 502 },
      );
    }

    return NextResponse.json({ models });
  } catch (err) {
    const aborted = err instanceof Error && err.name === 'AbortError';
    return NextResponse.json(
      {
        error: aborted
          ? 'The endpoint took longer than 20s to answer.'
          : `Could not reach ${target}. Check the URL and that the service is running.`,
      },
      { status: 504 },
    );
  } finally {
    clearTimeout(timer);
  }
}

/** Accept the OpenAI shape, the Ollama native shape, or a bare array. */
function normalise(payload: unknown): ModelInfo[] {
  const rows = pickRows(payload);
  const seen = new Set<string>();
  const out: ModelInfo[] = [];

  for (const row of rows) {
    const id = readId(row);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push({
      id,
      label: id,
      providerId: providerFor(id).id,
      context: readContext(row),
      owned_by: readString(row, 'owned_by') ?? readString(row, 'organization'),
    });
  }

  return out.sort((a, b) => {
    if (a.providerId !== b.providerId) return a.providerId.localeCompare(b.providerId);
    return a.id.localeCompare(b.id);
  });
}

function pickRows(payload: unknown): Record<string, unknown>[] {
  const asObj = payload as Record<string, unknown> | null;
  const candidate =
    (Array.isArray(payload) && payload) ||
    (Array.isArray(asObj?.data) && asObj.data) ||
    (Array.isArray(asObj?.models) && asObj.models) ||
    [];
  return (candidate as unknown[]).filter(
    (r): r is Record<string, unknown> => typeof r === 'object' && r !== null,
  );
}

function readId(row: Record<string, unknown>) {
  for (const key of ['id', 'name', 'model', 'slug']) {
    const v = row[key];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return undefined;
}

function readString(row: Record<string, unknown>, key: string) {
  const v = row[key];
  return typeof v === 'string' && v.trim() ? v.trim() : undefined;
}

function readContext(row: Record<string, unknown>) {
  const direct = row['context_length'] ?? row['context_window'] ?? row['max_context_length'];
  if (typeof direct === 'number' && direct > 0) return direct;
  const top = row['top_provider'];
  if (top && typeof top === 'object') {
    const n = (top as Record<string, unknown>)['context_length'];
    if (typeof n === 'number' && n > 0) return n;
  }
  return undefined;
}

function describeUpstream(status: number, raw: string) {
  const detail = extractMessage(raw);
  if (status === 401) return detail ?? 'The API key was rejected (401).';
  if (status === 403) return detail ?? 'That key is not allowed to list models (403).';
  if (status === 404) return 'No /models endpoint at that base URL (404).';
  return detail ?? `The endpoint returned ${status}.`;
}

