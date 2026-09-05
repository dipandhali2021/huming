/**
 * Guards and headers for the two proxy routes.
 *
 * These routes take a URL from the browser and fetch it server-side, so
 * they are a server-side request forgery surface. A local model
 * playground has to be able to reach localhost (Ollama on :11434,
 * LM Studio on :1234), so we cannot block private ranges outright.
 * What we do block is the cloud metadata services, which are the
 * actual prize in an SSRF against a deployed instance.
 *
 * If you deploy this where untrusted people can use it, set
 * HUMING_ALLOW_PRIVATE=0 to refuse private and loopback hosts too.
 */

const METADATA_HOSTS = new Set([
  '169.254.169.254', // AWS / Azure / GCP / DigitalOcean IMDS
  'metadata.google.internal',
  'metadata.goog',
  'instance-data',
  '100.100.100.200', // Alibaba Cloud
  'fd00:ec2::254',
]);

const PRIVATE_V4 =
  /^(10\.|127\.|0\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.)/;

/** Returns an error string when the URL must not be fetched, else null. */
export function assertSafeUpstream(rawUrl: string): string | null {
  let u: URL;
  try {
    u = new URL(rawUrl);
  } catch {
    return 'That base URL is not a valid URL.';
  }

  if (u.protocol !== 'https:' && u.protocol !== 'http:') {
    return 'Base URL must start with http:// or https://.';
  }

  const host = u.hostname.toLowerCase().replace(/^\[|\]$/g, '');

  if (METADATA_HOSTS.has(host)) {
    return 'That host is blocked.';
  }

  const allowPrivate = process.env.HUMING_ALLOW_PRIVATE !== '0';
  if (!allowPrivate) {
    const isLoopback =
      host === 'localhost' || host === '::1' || host.endsWith('.localhost');
    if (isLoopback || PRIVATE_V4.test(host) || /^(fc|fd)/.test(host)) {
      return 'Private and loopback hosts are disabled on this instance.';
    }
  }

  return null;
}

/**
 * Send the key in the header the host expects. Most OpenAI-compatible
 * gateways take Bearer; Azure wants `api-key`; Anthropic wants
 * `x-api-key`; Google takes `x-goog-api-key`. Sending several is
 * harmless and saves the user from choosing.
 */
export function authHeaders(apiKey: string, baseUrl: string): HeadersInit {
  if (!apiKey) return {};
  const h: Record<string, string> = { Authorization: `Bearer ${apiKey}` };
  const url = baseUrl.toLowerCase();

  if (url.includes('azure')) h['api-key'] = apiKey;
  if (url.includes('anthropic')) {
    h['x-api-key'] = apiKey;
    h['anthropic-version'] = '2023-06-01';
  }
  if (url.includes('googleapis')) h['x-goog-api-key'] = apiKey;

  return h;
}

/**
 * Pull a human-readable message out of an upstream error body.
 *
 * Providers disagree on the shape: OpenAI nests `{error:{message}}`,
 * some return `{message}`, Ollama returns a bare string, and a
 * misconfigured proxy returns an HTML error page. Anything longer than
 * 300 chars is a page rather than a message, so it is dropped and the
 * caller falls back to describing the status code.
 */
export function extractMessage(raw: string): string | undefined {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const err = parsed.error ?? parsed;
    if (typeof err === 'string' && err.trim()) return err.trim().slice(0, 300);
    const message = (err as Record<string, unknown>)?.message;
    if (typeof message === 'string' && message.trim()) {
      return message.trim().slice(0, 300);
    }
  } catch {
    if (raw.trim() && raw.length < 300 && !raw.includes('<')) return raw.trim();
  }
  return undefined;
}
