export type Role = 'user' | 'assistant' | 'system';

export type Attachment = {
  name: string;
  type: string;
  /** data: URL — kept client-side and sent inline as an image_url part. */
  url: string;
};

export type ChatMessage = {
  id: string;
  role: Role;
  content: string;
  /** Chain-of-thought text from providers that stream `reasoning_content`. */
  reasoning?: string;
  attachments?: Attachment[];
  error?: string;
  /** Wall time of the first streamed token, ms. */
  latencyMs?: number;
};

export type ModelInfo = {
  id: string;
  label: string;
  providerId: string;
  /** Context window in tokens, when the endpoint reports it. */
  context?: number;
  owned_by?: string;
};

export type Connection = {
  baseUrl: string;
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
};

export type ConnectionStatus = 'idle' | 'checking' | 'ready' | 'error';

export type CurlParseResult = {
  baseUrl?: string;
  apiKey?: string;
  model?: string;
  /** Human-readable notes about what was and was not found. */
  found: string[];
  missing: string[];
};
