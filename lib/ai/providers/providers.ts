/**
 * ==============================================
 *  AI Providers — 真實串接 (S4.4)
 * ==============================================
 *
 * 對應：docs/prd/05-ai-config.md
 *
 * 設計：
 * - AIProvider 抽象介面：generateText / streamText
 * - 4 種實作：OpenAI / Anthropic / Mock / Factory
 * - 切換邏輯：依環境變數 AI_DEFAULT_PROVIDER
 * - Fallback：無 API key 時自動用 MockProvider
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
  baseUrl?: string;
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

  async generateText(messages: AIMessage[]): Promise<string> {
    await new Promise((r) => setTimeout(r, 100));
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

    // 模擬串流打字效果
    for (const char of fullResponse) {
      await new Promise((r) => setTimeout(r, 15));
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
// 5. Provider 工廠
// ==============================================

export function createProvider(env: EnvConfig): AIProvider {
  const provider = env.AI_DEFAULT_PROVIDER?.toLowerCase() ?? 'mock';

  // 明確 mock
  if (provider === 'mock') {
    return new MockProvider();
  }

  // OpenAI
  if (provider === 'openai') {
    if (!env.OPENAI_API_KEY) {
      console.warn(
        '[ai-headless] AI_DEFAULT_PROVIDER=openai but OPENAI_API_KEY is empty. Falling back to MockProvider.',
      );
      return new MockProvider();
    }
    return new OpenAIProvider({
      apiKey: env.OPENAI_API_KEY,
      model: env.OPENAI_MODEL,
    });
  }

  // Anthropic
  if (provider === 'anthropic') {
    if (!env.ANTHROPIC_API_KEY) {
      console.warn(
        '[ai-headless] AI_DEFAULT_PROVIDER=anthropic but ANTHROPIC_API_KEY is empty. Falling back to MockProvider.',
      );
      return new MockProvider();
    }
    return new AnthropicProvider({
      apiKey: env.ANTHROPIC_API_KEY,
      model: env.ANTHROPIC_MODEL,
    });
  }

  // Unknown → mock
  console.warn(
    `[ai-headless] Unknown AI_DEFAULT_PROVIDER='${provider}'. Falling back to MockProvider.`,
  );
  return new MockProvider();
}