/**
 * Provider identity for model ids.
 *
 * Icons come from @lobehub/icons-static-png over jsDelivr. The `dark/`
 * folder holds light-coloured marks (measured mean brightness 239/255),
 * which is what we want on this near-black UI.
 *
 * Every slug below was verified present in
 * @lobehub/icons-static-png@1.95.0 (903 icons in dark/).
 */
export const ICON_CDN =
  'https://cdn.jsdelivr.net/npm/@lobehub/icons-static-png@1.95.0/dark';

export function iconUrl(slug: string) {
  return `${ICON_CDN}/${slug}.png`;
}

export type Provider = {
  id: string;
  label: string;
  /** lobehub slug */
  slug: string;
  /** Tint used for the provider chip ring and label. */
  hue: string;
  /** Ordered patterns tested against the lowercased model id. */
  match: RegExp[];
};

/**
 * Order matters: the first provider whose pattern hits wins. More
 * specific families (kimi, glm) sit above their broad vendors.
 */
export const PROVIDERS: Provider[] = [
  { id: 'openai', label: 'OpenAI', slug: 'openai', hue: '#8fe8c8',
    match: [/^(gpt|o[1-4]|chatgpt|text-|davinci|codex|dall-e|whisper|tts-|omni)/, /gpt-?[0-9]/] },
  { id: 'anthropic', label: 'Anthropic', slug: 'claude', hue: '#ff9a6b',
    match: [/claude/, /^anthropic/] },
  { id: 'google', label: 'Google', slug: 'gemini', hue: '#7ba9ff',
    match: [/gemini/, /^google\//, /palm|bison/] },
  { id: 'gemma', label: 'Gemma', slug: 'gemma', hue: '#9fc6ff', match: [/gemma/] },
  { id: 'deepseek', label: 'DeepSeek', slug: 'deepseek', hue: '#6f8dff',
    match: [/deepseek/] },
  { id: 'kimi', label: 'Kimi', slug: 'kimi', hue: '#9d8bff',
    match: [/kimi/] },
  { id: 'moonshot', label: 'Moonshot', slug: 'moonshot', hue: '#a58bff',
    match: [/moonshot/] },
  { id: 'qwen', label: 'Qwen', slug: 'qwen', hue: '#b18bff',
    match: [/qwen|qwq|tongyi/] },
  { id: 'meta', label: 'Meta', slug: 'meta', hue: '#7fb2ff',
    match: [/llama|^meta[-/]/] },
  { id: 'mistral', label: 'Mistral', slug: 'mistral', hue: '#ffb066',
    match: [/mistral|mixtral|codestral|ministral|magistral|devstral|pixtral/] },
  { id: 'xai', label: 'xAI', slug: 'grok', hue: '#dbe3ee', match: [/grok|^xai/] },
  { id: 'cohere', label: 'Cohere', slug: 'cohere', hue: '#ff8fb8',
    match: [/^command|cohere|aya-/] },
  { id: 'zhipu', label: 'Zhipu', slug: 'chatglm', hue: '#8ec5ff',
    match: [/glm|chatglm|zhipu|codegeex/] },
  { id: 'zeroone', label: '01.AI', slug: 'zeroone', hue: '#8bd8c8',
    match: [/^yi-|zero-?one|01-ai/] },
  { id: 'minimax', label: 'MiniMax', slug: 'minimax', hue: '#ff9ac4',
    match: [/minimax|abab/] },
  { id: 'baichuan', label: 'Baichuan', slug: 'baichuan', hue: '#ffa98f',
    match: [/baichuan/] },
  { id: 'stepfun', label: 'StepFun', slug: 'stepfun', hue: '#8fbcff',
    match: [/^step-|stepfun/] },
  { id: 'internlm', label: 'InternLM', slug: 'internlm', hue: '#8fd0ff',
    match: [/internlm|intern-/] },
  { id: 'hunyuan', label: 'Hunyuan', slug: 'hunyuan', hue: '#7fc4ff',
    match: [/hunyuan/] },
  { id: 'doubao', label: 'Doubao', slug: 'doubao', hue: '#8fb8ff',
    match: [/doubao|^ep-|seed-/] },
  { id: 'baidu', label: 'Baidu', slug: 'wenxin', hue: '#7fa8ff',
    match: [/ernie|wenxin/] },
  { id: 'spark', label: 'Spark', slug: 'spark', hue: '#9ec8ff',
    match: [/spark/] },
  { id: 'nvidia', label: 'NVIDIA', slug: 'nvidia', hue: '#b6f28f',
    match: [/nemotron|^nvidia/] },
  { id: 'microsoft', label: 'Microsoft', slug: 'microsoft', hue: '#8fc8ff',
    match: [/^phi-|phi[0-9]|wizardlm/] },
  { id: 'dbrx', label: 'Databricks', slug: 'dbrx', hue: '#ff8f7f',
    match: [/dbrx|databricks/] },
  { id: 'ai21', label: 'AI21', slug: 'ai21', hue: '#c8a8ff',
    match: [/jamba|^j2-|ai21/] },
  { id: 'snowflake', label: 'Snowflake', slug: 'snowflake', hue: '#8fdcff',
    match: [/arctic|snowflake/] },
  { id: 'nous', label: 'Nous', slug: 'nousresearch', hue: '#cbb8ff',
    match: [/hermes|nous/] },
  { id: 'perplexity', label: 'Perplexity', slug: 'perplexity', hue: '#7fd8d0',
    match: [/sonar|perplexity/] },
  { id: 'jina', label: 'Jina', slug: 'jina', hue: '#ffc48f',
    match: [/^jina/] },
  { id: 'voyage', label: 'Voyage', slug: 'voyage', hue: '#a8b8ff',
    match: [/^voyage/] },
  { id: 'flux', label: 'FLUX', slug: 'flux', hue: '#e0e6f0',
    match: [/^flux|black-forest/] },
  { id: 'stability', label: 'Stability', slug: 'stability', hue: '#c8b0ff',
    match: [/stable-|^sd[0-9x]|stability/] },
];

/** Hosts that identify the gateway itself, for the connection chip. */
export const GATEWAY_HOSTS: { test: RegExp; label: string; slug: string }[] = [
  { test: /openrouter/, label: 'OpenRouter', slug: 'openrouter' },
  { test: /groq/, label: 'Groq', slug: 'groq' },
  { test: /together/, label: 'Together', slug: 'together' },
  { test: /fireworks/, label: 'Fireworks', slug: 'fireworks' },
  { test: /cerebras/, label: 'Cerebras', slug: 'cerebras' },
  { test: /deepinfra/, label: 'DeepInfra', slug: 'deepinfra' },
  { test: /hyperbolic/, label: 'Hyperbolic', slug: 'hyperbolic' },
  { test: /sambanova/, label: 'SambaNova', slug: 'sambanova' },
  { test: /nebius/, label: 'Nebius', slug: 'nebius' },
  { test: /novita/, label: 'Novita', slug: 'novita' },
  { test: /siliconflow|siliconcloud/, label: 'SiliconCloud', slug: 'siliconcloud' },
  { test: /localhost|127\.0\.0\.1|0\.0\.0\.0/, label: 'Local', slug: 'ollama' },
  { test: /11434|ollama/, label: 'Ollama', slug: 'ollama' },
  { test: /1234|lmstudio|lm-studio/, label: 'LM Studio', slug: 'lmstudio' },
  { test: /deepseek/, label: 'DeepSeek', slug: 'deepseek' },
  { test: /moonshot/, label: 'Moonshot', slug: 'moonshot' },
  { test: /dashscope|aliyun|alibaba/, label: 'DashScope', slug: 'alibaba' },
  { test: /bigmodel|zhipu/, label: 'Zhipu', slug: 'zhipu' },
  { test: /volces|volcengine/, label: 'Volcengine', slug: 'volcengine' },
  { test: /mistral/, label: 'Mistral', slug: 'mistral' },
  { test: /anthropic/, label: 'Anthropic', slug: 'claude' },
  { test: /x\.ai/, label: 'xAI', slug: 'grok' },
  { test: /googleapis|generativelanguage/, label: 'Google', slug: 'gemini' },
  { test: /azure/, label: 'Azure', slug: 'azure' },
  { test: /aihubmix/, label: 'AiHubMix', slug: 'aihubmix' },
  { test: /vercel|ai-gateway/, label: 'Vercel', slug: 'vercel' },
  { test: /openai/, label: 'OpenAI', slug: 'openai' },
];

export const UNKNOWN: Provider = {
  id: 'unknown', label: 'Custom', slug: 'huggingface', hue: '#b9b3c9', match: [],
};

/** Resolve a model id to its vendor. Never throws; falls back to Custom. */
export function providerFor(modelId: string): Provider {
  const id = (modelId || '').toLowerCase();
  for (const p of PROVIDERS) {
    if (p.match.some((re) => re.test(id))) return p;
  }
  return UNKNOWN;
}

export function gatewayFor(baseUrl: string) {
  const u = (baseUrl || '').toLowerCase();
  return GATEWAY_HOSTS.find((g) => g.test.test(u));
}

/**
 * Strip the routing prefix providers put on ids ("anthropic/claude-4",
 * "accounts/fireworks/models/x") so the visible label is the model name.
 */
export function prettyModel(id: string) {
  const tail = id.split('/').pop() ?? id;
  return tail.replace(/:free$/, ' (free)');
}
