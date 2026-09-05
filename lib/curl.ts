import type { CurlParseResult } from '@/types';

/**
 * Pull a base URL, API key and model out of a pasted curl command.
 *
 * Handles the shapes people actually paste: multi-line with backslash
 * continuations, single or double quotes, `-H`/`--header`,
 * `-d`/`--data`/`--data-raw`, `-u user:pass`, and keys hiding in
 * `Authorization: Bearer`, `x-api-key`, `api-key` or a `?key=` query
 * param. Anything absent is reported in `missing` rather than guessed.
 */
export function parseCurl(input: string): CurlParseResult {
  const found: string[] = [];
  const missing: string[] = [];
  const text = input
    .replace(/\\\r?\n/g, ' ') // join continuations
    .replace(/[\u2018\u2019\u201c\u201d]/g, '"') // smart quotes
    .trim();

  const result: CurlParseResult = { found, missing };

  // ---- URL --------------------------------------------------------
  const urlMatch =
    text.match(/(?:--url\s+|curl\s+(?:-[a-zA-Z]+\s+)*)['"]?(https?:\/\/[^\s'"]+)/) ??
    text.match(/['"](https?:\/\/[^\s'"]+)['"]/) ??
    text.match(/(https?:\/\/[^\s'"\\]+)/);

  if (urlMatch) {
    const raw = urlMatch[1];
    const base = toBaseUrl(raw);
    if (base) {
      result.baseUrl = base;
      found.push(`Base URL ${base}`);
    }
    // Google-style ?key=... lives on the URL, not a header.
    const keyParam = raw.match(/[?&]key=([^&\s'"]+)/);
    if (keyParam) {
      result.apiKey = keyParam[1];
      found.push('API key from ?key= parameter');
    }
  } else {
    missing.push('Base URL');
  }

  // ---- key --------------------------------------------------------
  if (!result.apiKey) {
    const headerPatterns: [RegExp, string][] = [
      [/authorization:\s*bearer\s+([^\s'"\\]+)/i, 'Authorization: Bearer'],
      [/authorization:\s*([^\s'"\\]+)/i, 'Authorization'],
      [/x-api-key:\s*([^\s'"\\]+)/i, 'x-api-key'],
      [/api-key:\s*([^\s'"\\]+)/i, 'api-key'],
      [/x-goog-api-key:\s*([^\s'"\\]+)/i, 'x-goog-api-key'],
    ];
    for (const [re, name] of headerPatterns) {
      const m = text.match(re);
      if (m && !isPlaceholder(m[1])) {
        result.apiKey = m[1];
        found.push(`API key from ${name}`);
        break;
      }
    }
  }

  if (!result.apiKey) {
    // curl -u sk-xxx:  /  --user
    const basic = text.match(/(?:-u|--user)\s+['"]?([^\s'":]+)/);
    if (basic && !isPlaceholder(basic[1])) {
      result.apiKey = basic[1];
      found.push('API key from -u');
    }
  }

  if (!result.apiKey) missing.push('API key');

  // ---- model ------------------------------------------------------
  const body = extractBody(text);
  if (body) {
    const fromJson = readJsonString(body, 'model');
    if (fromJson) {
      result.model = fromJson;
      found.push(`Model ${fromJson}`);
    }
  }
  if (!result.model) {
    const loose = text.match(/["']model["']\s*:\s*["']([^"']+)["']/);
    if (loose) {
      result.model = loose[1];
      found.push(`Model ${loose[1]}`);
    }
  }
  if (!result.model) {
    // Azure and Google put the deployment/model in the path.
    const inPath = text.match(/\/(?:deployments|models)\/([^/:?\s'"]+)/);
    if (inPath) {
      result.model = inPath[1];
      found.push(`Model ${inPath[1]} from URL path`);
    }
  }
  if (!result.model) missing.push('Model (pick one after connecting)');

  return result;
}

/**
 * Normalise any endpoint URL down to the OpenAI-compatible root, so
 * ".../v1/chat/completions" and ".../v1/" both become ".../v1".
 */
export function toBaseUrl(raw: string): string | undefined {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return undefined;
  }
  u.search = '';
  u.hash = '';
  let path = u.pathname.replace(/\/+$/, '');
  path = path.replace(
    /\/(chat\/completions|completions|responses|messages|embeddings|models|generateContent|models\/[^/]+:[a-zA-Z]+)$/,
    '',
  );
  path = path.replace(/\/+$/, '');
  return `${u.origin}${path}`;
}

function extractBody(text: string) {
  const m = text.match(
    /(?:-d|--data|--data-raw|--data-binary)\s+(['"])([\s\S]*?)\1(?=\s|$)/,
  );
  return m?.[2];
}

/** Read one top-level string field without trusting the JSON to parse. */
function readJsonString(body: string, key: string) {
  try {
    const parsed = JSON.parse(body);
    const v = parsed?.[key];
    if (typeof v === 'string' && v.trim()) return v.trim();
  } catch {
    /* fall through to regex */
  }
  const m = body.match(new RegExp(`["']${key}["']\\s*:\\s*["']([^"']+)["']`));
  return m?.[1];
}

/** "$OPENAI_API_KEY", "<your-key>", "YOUR_KEY" are not real keys. */
function isPlaceholder(v: string) {
  return (
    /^\$/.test(v) ||
    /^\$\{/.test(v) ||
    /^[<[({]/.test(v) ||
    /^(your|my|api|token|key|insert|replace|xxx+|sk-xxx)/i.test(v) ||
    v.length < 8
  );
}
