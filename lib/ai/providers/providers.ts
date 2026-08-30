/**
 * ==============================================
 *  AI Providers — 真實串接 (S4.4)
 * Sprint 43 v2.0 (S43-A Commit A): 加入 4-type Provider 介面重構
 * Sprint 43 v2.0 (S43-B Commit B): 測試連線 utility + Factory Custom URL 支援
 * Sprint 43 v2.0 (S43-C Commit C): createProviderFromDB factory + decrypt utility placeholder
 * ==============================================
 *
 * 對應：docs/prd/05-ai-config.md
 *
 * 設計：
 * - AIProvider 抽象介面：generateText / streamText
 * - 4 種實作：OpenAI / Anthropic / Mock / Factory
 * - 切換邏輯：依環境變數 AI_DEFAULT_PROVIDER
 * - Fallback：無 API key 時自動用 MockProvider
 * - Sprint 43 v2.0 (S43-A): ProviderConfig 加 type 欄位 + baseUrl 保留為 Custom URL 入口
 * - Sprint 43 v2.0 (S43-B): testEndpoint utility + Factory 接受 type + baseUrl
 *   (不需要新增 class — 既有 OpenAIProvider/AnthropicProvider 已用 fetch + baseUrl)
 */

// ==============================================
// 0. 共用類型
// ==============================================

export type AIMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export type ProviderConfig = {
  apiKey: string;
  model?: string;
  /** Sprint 43 v2.0 (S43-A): Custom URL endpoint (openai-compatible / anthropic-compatible 用) */
  baseUrl?: string;
  /** Sprint 43 v2.0 (S43-A): Provider 類型判定, 影響 factory class 選擇 */
  type?: 'openai' | 'claude' | 'openai-compatible' | 'anthropic-compatible';
};

export type EnvConfig = {
  AI_DEFAULT_PROVIDER?: string;
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
  ANTHROPIC_API_KEY?: string;
  ANTHROPIC_MODEL?: string;
};

/** TD-505 Token usage 追蹤 */
export type TokenUsage = {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
};

/** Provider 串流輸出的 chunk（向後相容 content-only） */
export type ProviderChunk = {
  content?: string;
  usage?: TokenUsage;
};

/** generateTextWithUsage 回傳 */
export type GenerateTextResult = {
  text: string;
  usage?: TokenUsage;
};

// ==============================================
// 1. AIProvider 抽象介面
// ==============================================

export interface AIProvider {
  readonly name: string;
  generateText(messages: AIMessage[]): Promise<string>;
  generateTextWithUsage(messages: AIMessage[]): Promise<GenerateTextResult>;
  streamText(messages: AIMessage[]): AsyncIterable<string>;
  streamChunks(messages: AIMessage[]): AsyncIterable<ProviderChunk>;
}

// ==============================================
// 2. MockProvider（無 API key 時 fallback）
// ==============================================

const MOCK_SYSTEM_PROMPT = `你是 ai-headless 框架的 AI 助手。用戶會用自然語言描述需求。
當用戶需求明確後，回應一個 JsonSpec 包裹在 \`\`\`json fence 中。`;

export class MockProvider implements AIProvider {
  readonly name = 'mock';

  // TD-504: 預設不延遲 — 測試環境可加快。Demo UI 設 MOCK_STREAM_DELAY_MS=15 保留打字效果。
  private get streamDelayMs(): number {
    const env = process.env.MOCK_STREAM_DELAY_MS;
    if (env === undefined || env === '') return 0;
    const parsed = Number(env);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  }

  private get generateDelayMs(): number {
    const env = process.env.MOCK_GENERATE_DELAY_MS;
    if (env === undefined || env === '') return 0;
    const parsed = Number(env);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  }

  async generateText(messages: AIMessage[]): Promise<string> {
    const delay = this.generateDelayMs;
    if (delay > 0) {
      await new Promise((r) => setTimeout(r, delay));
    }
    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
    const userText = lastUserMessage?.content ?? '';
    return mockResponse(userText);
  }

  async generateTextWithUsage(messages: AIMessage[]): Promise<GenerateTextResult> {
    const text = await this.generateText(messages);
    return {
      text,
      usage: mockUsageEstimate(messages, text),
    };
  }

  async *streamText(messages: AIMessage[]): AsyncIterable<string> {
    for await (const chunk of this.streamChunks(messages)) {
      if (chunk.content) yield chunk.content;
    }
  }

  async *streamChunks(messages: AIMessage[]): AsyncIterable<ProviderChunk> {
    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
    const userText = lastUserMessage?.content ?? '';
    const fullResponse = `${MOCK_SYSTEM_PROMPT ? '' : ''}${mockResponse(userText)}`;

    const delay = this.streamDelayMs;

    // TD-504: 預設不延遲（加速測試）；MOCK_STREAM_DELAY_MS>0 時保留打字效果（demo UI）
    for (const char of fullResponse) {
      if (delay > 0) {
        await new Promise((r) => setTimeout(r, delay));
      }
      yield { content: char };
    }

    // TD-505: 結尾 yield usage chunk（mock 估算）
    yield { usage: mockUsageEstimate(messages, fullResponse) };
  }
}

/**
 * TD-505: MockProvider 的 token usage 估算（不計字准不准，只是佔位讓串流結尾有 usage）
 * 近似估算：1 token ~ 2 chars（中英文取均值）
 */
function mockUsageEstimate(messages: AIMessage[], response: string): TokenUsage {
  const promptChars = messages.reduce((sum, m) => sum + m.content.length, 0);
  const completionChars = response.length;
  const promptTokens = Math.ceil(promptChars / 2);
  const completionTokens = Math.ceil(completionChars / 2);
  return {
    promptTokens,
    completionTokens,
    totalTokens: promptTokens + completionTokens,
  };
}

function mockResponse(userInput: string): string {
  const text = userInput.toLowerCase();

  if (text.includes('待辦') || text.includes('todo')) {
    return `好的，我幫你建立待辦事項管理系統。

\`\`\`json
{
  "name": "todo",
  "label": "待辦事項",
  "models": [
    {
      "name": "Todo",
      "label": "待辦",
      "fields": [
        { "name": "title", "type": "string", "validation": { "required": true } },
        { "name": "completed", "type": "boolean" },
        { "name": "dueDate", "type": "datetime" }
      ]
    }
  ]
}
\`\`\`

這個 JsonSpec 定義了一個簡單的待辦系統。確認後我會幫你生成完整的 CRUD UI 和 API。`;
  }

  if (text.includes('活動') || text.includes('event')) {
    return `好的，建立活動管理系統。

\`\`\`json
{
  "name": "event",
  "label": "活動管理",
  "models": [
    {
      "name": "Event",
      "label": "活動",
      "fields": [
        { "name": "title", "type": "string", "validation": { "required": true } },
        { "name": "startAt", "type": "datetime" },
        { "name": "endAt", "type": "datetime" },
        { "name": "capacity", "type": "integer" }
      ]
    }
  ]
}
\`\`\``;
  }

  return `我理解了。請告訴我更具體的需求：
1. 你想做什麼類型的功能？（例如：待辦、活動、商品、Blog…）
2. 需要哪些欄位？
3. 有什麼特殊的業務規則嗎？`;
}

// ==============================================
// 3. OpenAIProvider
// ==============================================

const DEFAULT_OPENAI_MODEL = 'gpt-4o';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const SYSTEM_PROMPT = MOCK_SYSTEM_PROMPT;

export class OpenAIProvider implements AIProvider {
  readonly name = 'openai';
  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseUrl: string;

  constructor(config: ProviderConfig) {
    if (!config.apiKey) {
      throw new Error('OpenAIProvider: apiKey is required');
    }
    this.apiKey = config.apiKey;
    this.model = config.model ?? DEFAULT_OPENAI_MODEL;
    this.baseUrl = config.baseUrl ?? OPENAI_API_URL;
  }

  async generateText(messages: AIMessage[]): Promise<string> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: this.withSystemPrompt(messages),
      }),
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(
        `OpenAI API error ${response.status}: ${errBody?.error?.message ?? response.statusText}`,
      );
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content ?? '';
  }

  async generateTextWithUsage(messages: AIMessage[]): Promise<GenerateTextResult> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: this.withSystemPrompt(messages),
      }),
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(
        `OpenAI API error ${response.status}: ${errBody?.error?.message ?? response.statusText}`,
      );
    }

    const data = await response.json();
    return {
      text: data.choices?.[0]?.message?.content ?? '',
      usage: parseOpenAIUsage(data.usage),
    };
  }

  async *streamText(messages: AIMessage[]): AsyncIterable<string> {
    for await (const chunk of this.streamChunks(messages)) {
      if (chunk.content) yield chunk.content;
    }
  }

  async *streamChunks(messages: AIMessage[]): AsyncIterable<ProviderChunk> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: this.withSystemPrompt(messages),
        stream: true,
      }),
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(
        `OpenAI API error ${response.status}: ${errBody?.error?.message ?? response.statusText}`,
      );
    }

    if (!response.body) {
      throw new Error('OpenAI response has no body');
    }

    yield* parseOpenAISSE(response.body);
  }

  private withSystemPrompt(messages: AIMessage[]): AIMessage[] {
    if (messages.some((m) => m.role === 'system')) {
      return messages;
    }
    return [{ role: 'system', content: SYSTEM_PROMPT }, ...messages];
  }
}

async function* parseOpenAISSE(
  body: ReadableStream<Uint8Array>,
): AsyncIterable<ProviderChunk> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;

      const data = trimmed.slice(5).trim();
      if (data === '[DONE]') return;

      try {
        const parsed = JSON.parse(data);
        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta) yield { content: delta };

        // TD-505: OpenAI 通常在最後一個 chunk 包含 usage（choices 為空）
        const usage = parseOpenAIUsage(parsed.usage);
        if (usage) yield { usage };
      } catch {
        // 跳過非 JSON 行
      }
    }
  }
}

/**
 * TD-505: 解析 OpenAI `usage` 物件（snake_case → camelCase）
 */
function parseOpenAIUsage(usage: unknown): TokenUsage | undefined {
  if (!usage || typeof usage !== 'object') return undefined;
  const u = usage as Record<string, unknown>;
  if (
    typeof u.prompt_tokens !== 'number' ||
    typeof u.completion_tokens !== 'number' ||
    typeof u.total_tokens !== 'number'
  ) {
    return undefined;
  }
  return {
    promptTokens: u.prompt_tokens,
    completionTokens: u.completion_tokens,
    totalTokens: u.total_tokens,
  };
}

// ==============================================
// 4. AnthropicProvider
// ==============================================

const DEFAULT_ANTHROPIC_MODEL = 'claude-3-5-sonnet-20241022';
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

export class AnthropicProvider implements AIProvider {
  readonly name = 'anthropic';
  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseUrl: string;

  constructor(config: ProviderConfig) {
    if (!config.apiKey) {
      throw new Error('AnthropicProvider: apiKey is required');
    }
    this.apiKey = config.apiKey;
    this.model = config.model ?? DEFAULT_ANTHROPIC_MODEL;
    this.baseUrl = config.baseUrl ?? ANTHROPIC_API_URL;
  }

  async generateText(messages: AIMessage[]): Promise<string> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model: this.model,
        ...this.splitSystemPrompt(messages),
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(
        `Anthropic API error ${response.status}: ${errBody?.error?.message ?? response.statusText}`,
      );
    }

    const data = await response.json();
    return data.content?.[0]?.text ?? '';
  }

  async generateTextWithUsage(messages: AIMessage[]): Promise<GenerateTextResult> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model: this.model,
        ...this.splitSystemPrompt(messages),
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(
        `Anthropic API error ${response.status}: ${errBody?.error?.message ?? response.statusText}`,
      );
    }

    const data = await response.json();
    return {
      text: data.content?.[0]?.text ?? '',
      usage: parseAnthropicUsage(data.usage),
    };
  }

  async *streamText(messages: AIMessage[]): AsyncIterable<string> {
    for await (const chunk of this.streamChunks(messages)) {
      if (chunk.content) yield chunk.content;
    }
  }

  async *streamChunks(messages: AIMessage[]): AsyncIterable<ProviderChunk> {
    const body = await this.fetchAnthropicStream(messages);
    yield* parseAnthropicSSE(body);
  }

  /** 由 streamChunks 使用，避免重複 fetch邏輯。 */
  private async fetchAnthropicStream(
    messages: AIMessage[],
  ): Promise<ReadableStream<Uint8Array>> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
        Accept: 'text/event-stream',
      },
      body: JSON.stringify({
        model: this.model,
        ...this.splitSystemPrompt(messages),
        max_tokens: 4096,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(
        `Anthropic API error ${response.status}: ${errBody?.error?.message ?? response.statusText}`,
      );
    }

    if (!response.body) {
      throw new Error('Anthropic response has no body');
    }

    return response.body;
  }

  /**
   * Anthropic API：system 訊息獨立於 messages
   */
  private splitSystemPrompt(messages: AIMessage[]): {
    system: string;
    messages: AIMessage[];
  } {
    const systemMessages = messages.filter((m) => m.role === 'system');
    const nonSystemMessages = messages.filter((m) => m.role !== 'system');

    const system = systemMessages.length > 0
      ? systemMessages.map((m) => m.content).join('\n\n')
      : SYSTEM_PROMPT;

    return {
      system,
      messages: nonSystemMessages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    };
  }
}

async function* parseAnthropicSSE(
  body: ReadableStream<Uint8Array>,
): AsyncIterable<ProviderChunk> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;

      const data = trimmed.slice(5).trim();
      try {
        const parsed = JSON.parse(data);
        if (parsed.type === 'content_block_delta') {
          const text = parsed.delta?.text;
          if (text) yield { content: text };
        }

        // TD-505: Anthropic message_delta 含 usage（input_tokens + output_tokens）
        if (parsed.type === 'message_delta') {
          const usage = parseAnthropicUsage(parsed.usage);
          if (usage) yield { usage };
        }
      } catch {
        // 跳過非 JSON 行
      }
    }
  }
}

/**
 * TD-505: 解析 Anthropic `usage` 物件（input/output tokens）
 */
function parseAnthropicUsage(usage: unknown): TokenUsage | undefined {
  if (!usage || typeof usage !== 'object') return undefined;
  const u = usage as Record<string, unknown>;
  if (
    typeof u.input_tokens !== 'number' ||
    typeof u.output_tokens !== 'number'
  ) {
    return undefined;
  }
  return {
    promptTokens: u.input_tokens,
    completionTokens: u.output_tokens,
    totalTokens: u.input_tokens + u.output_tokens,
  };
}

// ==============================================
// 4.5 測試連線 utility (S43-B)
// ==============================================

/** Sprint 43 v2.0 (S43-B): 測試 Custom endpoint 連線結果 */
export type TestEndpointResult =
  | { success: true; latencyMs: number; models?: string[] }
  | { success: false; error: string; statusCode?: number };

/** Sprint 43 v2.0 (S43-B): 測試 Custom endpoint 連線
 *
 * 用途: 用戶設 Custom URL 後點「測試連線」按鈕驗證 URL + API Key 可用
 * 安全性: error message 絕不內插 apiKey 明文 (防 log 洩漏)
 */
export async function testEndpoint(params: {
  type: 'openai-compatible' | 'anthropic-compatible';
  endpointUrl: string;
  apiKey: string;
  /** Timeout in ms (default: 10000) */
  timeoutMs?: number;
}): Promise<TestEndpointResult> {
  const { type, endpointUrl, apiKey, timeoutMs = 10000 } = params;
  const start = Date.now();

  // 驗證 URL 格式
  let url: URL;
  try {
    url = new URL(endpointUrl);
  } catch {
    return { success: false, error: '無效的 URL 格式' };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    if (type === 'openai-compatible') {
      // OpenAI-compatible: GET /v1/models (最 lightweight 驗證)
      const testUrl = new URL('/v1/models', url).toString();
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: controller.signal,
      });
      const latencyMs = Date.now() - start;
      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status} ${response.statusText}`,
          statusCode: response.status,
        };
      }
      // 嘗試解析 models list (若有)
      const data = await response.json().catch(() => null);
      const models = Array.isArray(data?.data)
        ? data.data.slice(0, 5).map((m: { id?: string }) => m.id).filter(Boolean)
        : undefined;
      return { success: true, latencyMs, models };
    }

    // anthropic-compatible: POST /v1/messages 帶 minimal payload
    const testUrl = new URL('/v1/messages', url).toString();
    const response = await fetch(testUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model: 'test',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'hi' }],
      }),
      signal: controller.signal,
    });
    const latencyMs = Date.now() - start;
    if (!response.ok && response.status !== 400) {
      // 400 = request 格式不對但 server 回應 = 連線 OK
      return {
        success: false,
        error: `HTTP ${response.status} ${response.statusText}`,
        statusCode: response.status,
      };
    }
    return { success: true, latencyMs };
  } catch (err) {
    // 安全處理: 不內插 apiKey 明文到 error message
    const message = err instanceof Error ? err.message : 'Unknown error';
    const safeMessage = message.includes(apiKey) ? message.replace(apiKey, '[REDACTED]') : message;
    return {
      success: false,
      error: err instanceof Error && err.name === 'AbortError' ? '連線逾時' : safeMessage,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

// ==============================================
// 5. Provider 工廠
// ==============================================

export function createProvider(env: EnvConfig): AIProvider {
  // Sprint 43 v2.0 (S43-A/S43-B): 讀取 type 參數 (決定 factory class + baseUrl)
  // v2.0: factory 介面支援 4 種 type
  // - openai / claude: 走原生 class
  // - openai-compatible / anthropic-compatible: 走 OpenAIProvider/AnthropicProvider with baseUrl
  const envWithType = env as EnvConfig & {
    AI_PROVIDER_TYPE?: string;
    AI_ENDPOINT_URL?: string;
  };
  const type = envWithType.AI_PROVIDER_TYPE?.toLowerCase() ?? 'openai';
  const endpointUrl = envWithType.AI_ENDPOINT_URL;
  const provider = env.AI_DEFAULT_PROVIDER?.toLowerCase() ?? 'mock';

  // 明確 mock
  if (provider === 'mock') {
    return new MockProvider();
  }

  // OpenAI / openai-compatible
  if (provider === 'openai' || type === 'openai-compatible') {
    if (!env.OPENAI_API_KEY) {
      console.warn(
        '[ai-headless] AI_DEFAULT_PROVIDER=openai but OPENAI_API_KEY is empty. Falling back to MockProvider.',
      );
      return new MockProvider();
    }
    return new OpenAIProvider({
      apiKey: env.OPENAI_API_KEY,
      model: env.OPENAI_MODEL,
      baseUrl: endpointUrl,
      type: (type as ProviderConfig['type']),
    });
  }

  // Anthropic / anthropic-compatible
  if (provider === 'anthropic' || type === 'anthropic-compatible') {
    if (!env.ANTHROPIC_API_KEY) {
      console.warn(
        '[ai-headless] AI_DEFAULT_PROVIDER=anthropic but ANTHROPIC_API_KEY is empty. Falling back to MockProvider.',
      );
      return new MockProvider();
    }
    return new AnthropicProvider({
      apiKey: env.ANTHROPIC_API_KEY,
      model: env.ANTHROPIC_MODEL,
      baseUrl: endpointUrl,
      type: (type as ProviderConfig['type']),
    });
  }

  // Unknown → mock
  console.warn(
    `[ai-headless] Unknown AI_DEFAULT_PROVIDER='${provider}'. Falling back to MockProvider.`,
  );
  return new MockProvider();
}

// ==============================================
// 6. DB-based Factory (S43-C)
// ==============================================

/** S43-C: API Key 解密 (Commit E 會換成 AES-256-GCM, 現為 placeholder)
 *
 * 設計原則: 先有 interface, Commit E 才接真正 crypto
 * 目前是簡單反轉 (避免明文存, 僅供 development)
 */
export function decrypt(ciphertext: string): string {
  // S43-E TODO: 改用 AES-256-GCM
  return ciphertext.split('').reverse().join('');
}

/** S43-C: 從 Prisma AIConfig 建立 Provider
 *
 * 查找順序:
 * 1. userId 指定的 config (per-user 設定)
 * 2. userId = null 的 config (Global URL, 所有 user 共用)
 * 3. 都没有 → throw
 *
 * 設計: 使用 dynamic import 避免 PrismaClient 在不需要 DB 的測試中冷啟動加載
 */
export async function createProviderFromDB(params: {
  userId?: string;
}): Promise<AIProvider> {
  // dynamic import 避免 Pull PrismaClient (只在使用 DB factory 時才加載)
  const { db } = await import('@/lib/db');

  // 優先讀 user-specific, 沒有就讀 Global URL (userId=null)
  const config = await db.aIConfig.findFirst({
    where: params.userId ? { userId: params.userId } : { userId: null },
  });

  if (!config) {
    throw new Error(
      'No AI config found. Please configure AI provider at /admin/ai-config',
    );
  }

  // 解密 API Key (S43-E 換成真 AES)
  const apiKey = config.apiKeyEnc ? decrypt(config.apiKeyEnc) : '';

  const type = config.type;
  const endpointUrl = config.endpointUrl ?? undefined;

  // 根據 type 決定 class
  if (type === 'openai_compatible') {
    return new OpenAIProvider({
      apiKey,
      model: config.model,
      baseUrl: endpointUrl,
      type: 'openai-compatible',
    });
  }
  if (type === 'anthropic_compatible') {
    return new AnthropicProvider({
      apiKey,
      model: config.model,
      baseUrl: endpointUrl,
      type: 'anthropic-compatible',
    });
  }
  if (type === 'openai') {
    return new OpenAIProvider({
      apiKey,
      model: config.model,
      type: 'openai',
    });
  }
  if (type === 'claude') {
    return new AnthropicProvider({
      apiKey,
      model: config.model,
      type: 'claude',
    });
  }

  // Unknown type → mock
  console.warn(`[ai-headless] Unknown AI config type='${type}'. Falling back to MockProvider.`);
  return new MockProvider();
}