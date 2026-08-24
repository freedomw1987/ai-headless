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

// ==============================================
// 1. AIProvider 抽象介面
// ==============================================

export interface AIProvider {
  readonly name: string;
  generateText(messages: AIMessage[]): Promise<string>;
  streamText(messages: AIMessage[]): AsyncIterable<string>;
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

  async *streamText(messages: AIMessage[]): AsyncIterable<string> {
    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
    const userText = lastUserMessage?.content ?? '';
    const fullResponse = `${MOCK_SYSTEM_PROMPT ? '' : ''}${mockResponse(userText)}`;

    // 模擬串流打字效果
    for (const char of fullResponse) {
      await new Promise((r) => setTimeout(r, 15));
      yield char;
    }
  }
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

  async *streamText(messages: AIMessage[]): AsyncIterable<string> {
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
): AsyncIterable<string> {
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
        if (delta) yield delta;
      } catch {
        // 跳過非 JSON 行
      }
    }
  }
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

  async *streamText(messages: AIMessage[]): AsyncIterable<string> {
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

    yield* parseAnthropicSSE(response.body);
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
): AsyncIterable<string> {
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
          if (text) yield text;
        }
      } catch {
        // 跳過非 JSON 行
      }
    }
  }
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