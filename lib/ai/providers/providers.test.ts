/**
 * TDD Gate 1 — S4.4 AI Provider 真實串接
 *
 * 涵蓋：
 * 1. Provider 抽象介面（generateText + streamText）
 * 2. OpenAI Provider（HTTP 呼叫）
 * 3. Anthropic Provider（HTTP 呼叫）
 * 4. Provider 工廠（依 env 切換）
 * 5. Fallback 到 mock（無 API key 時）
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createProvider,
  OpenAIProvider,
  AnthropicProvider,
  MockProvider,
} from './providers';

// ==============================================
// 1. 抽象介面
// ==============================================

describe('S4.4 AIProvider 介面', () => {
  it('每個 provider 都有 name 屬性', () => {
    expect(new MockProvider().name).toBe('mock');
    expect(new OpenAIProvider({ apiKey: 'sk-test' }).name).toBe('openai');
    expect(new AnthropicProvider({ apiKey: 'sk-ant-test' }).name).toBe('anthropic');
  });

  it('generateText 回傳 Promise<string>', async () => {
    const provider = new MockProvider();
    const result = await provider.generateText([
      { role: 'user', content: 'hi' },
    ]);
    expect(typeof result).toBe('string');
  });

  it('streamText 回傳 AsyncIterable', async () => {
    const provider = new MockProvider();
    const chunks: string[] = [];
    for await (const chunk of provider.streamText([
      { role: 'user', content: 'hi' },
    ])) {
      chunks.push(chunk);
    }
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks.join('')).toBeTruthy();
  });
});

// ==============================================
// 2. OpenAI Provider
// ==============================================

describe('S4.4 OpenAIProvider', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('呼叫 OpenAI chat completions API', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'hello from openai' } }],
      }),
    });

    const provider = new OpenAIProvider({
      apiKey: 'sk-test',
      model: 'gpt-4o',
    });

    const result = await provider.generateText([
      { role: 'user', content: 'hi' },
    ]);

    expect(result).toBe('hello from openai');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.openai.com/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer sk-test',
        }),
      }),
    );
  });

  it('串流模式用 SSE 解析', async () => {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        controller.enqueue(
          encoder.encode('data: {"choices":[{"delta":{"content":"hello"}}]}\n\n'),
        );
        controller.enqueue(
          encoder.encode('data: {"choices":[{"delta":{"content":" world"}}]}\n\n'),
        );
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      body: stream,
    });

    const provider = new OpenAIProvider({ apiKey: 'sk-test' });
    const chunks: string[] = [];
    for await (const chunk of provider.streamText([
      { role: 'user', content: 'hi' },
    ])) {
      chunks.push(chunk);
    }

    expect(chunks.join('')).toBe('hello world');
  });

  it('API 錯誤拋出明確訊息', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({ error: { message: 'Invalid API key' } }),
    });

    const provider = new OpenAIProvider({ apiKey: 'bad-key' });

    await expect(
      provider.generateText([{ role: 'user', content: 'hi' }]),
    ).rejects.toThrow(/Invalid API key/);
  });
});

// ==============================================
// 3. Anthropic Provider
// ==============================================

describe('S4.4 AnthropicProvider', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('呼叫 Anthropic messages API', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        content: [{ type: 'text', text: 'hello from claude' }],
      }),
    });

    const provider = new AnthropicProvider({
      apiKey: 'sk-ant-test',
      model: 'claude-3-5-sonnet-20241022',
    });

    const result = await provider.generateText([
      { role: 'user', content: 'hi' },
    ]);

    expect(result).toBe('hello from claude');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.anthropic.com/v1/messages',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'x-api-key': 'sk-ant-test',
          'anthropic-version': '2023-06-01',
        }),
      }),
    );
  });

  it('system 訊息從 messages 中分離', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        content: [{ type: 'text', text: 'ok' }],
      }),
    });

    const provider = new AnthropicProvider({ apiKey: 'sk-ant-test' });

    await provider.generateText([
      { role: 'system', content: 'you are helpful' },
      { role: 'user', content: 'hi' },
    ]);

    const callArgs = mockFetch.mock.calls[0]![1] as { body: string };
    const body = JSON.parse(callArgs.body);
    expect(body.system).toBe('you are helpful');
    expect(body.messages).toEqual([{ role: 'user', content: 'hi' }]);
  });

  it('串流模式解析 Anthropic SSE 格式', async () => {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        controller.enqueue(
          encoder.encode('event: content_block_delta\ndata: {"type":"content_block_delta","delta":{"type":"text_delta","text":"hello"}}\n\n'),
        );
        controller.enqueue(
          encoder.encode('event: content_block_delta\ndata: {"type":"content_block_delta","delta":{"type":"text_delta","text":" claude"}}\n\n'),
        );
        controller.enqueue(
          encoder.encode('event: message_stop\ndata: {"type":"message_stop"}\n\n'),
        );
        controller.close();
      },
    });

    mockFetch.mockResolvedValueOnce({ ok: true, body: stream });

    const provider = new AnthropicProvider({ apiKey: 'sk-ant-test' });
    const chunks: string[] = [];
    for await (const chunk of provider.streamText([
      { role: 'user', content: 'hi' },
    ])) {
      chunks.push(chunk);
    }

    expect(chunks.join('')).toBe('hello claude');
  });
});

// ==============================================
// 4. 工廠函式
// ==============================================

describe('S4.4 createProvider', () => {
  it('AI_DEFAULT_PROVIDER=openai + 有 OPENAI_API_KEY → OpenAIProvider', () => {
    const provider = createProvider({
      AI_DEFAULT_PROVIDER: 'openai',
      OPENAI_API_KEY: 'sk-test',
      OPENAI_MODEL: 'gpt-4o',
      ANTHROPIC_API_KEY: '',
      ANTHROPIC_MODEL: '',
    });

    expect(provider.name).toBe('openai');
  });

  it('AI_DEFAULT_PROVIDER=anthropic + 有 ANTHROPIC_API_KEY → AnthropicProvider', () => {
    const provider = createProvider({
      AI_DEFAULT_PROVIDER: 'anthropic',
      OPENAI_API_KEY: '',
      OPENAI_MODEL: '',
      ANTHROPIC_API_KEY: 'sk-ant-test',
      ANTHROPIC_MODEL: 'claude-3-5-sonnet-20241022',
    });

    expect(provider.name).toBe('anthropic');
  });

  it('無 API key 時 fallback 到 MockProvider', () => {
    const provider = createProvider({
      AI_DEFAULT_PROVIDER: 'openai',
      OPENAI_API_KEY: '',
      OPENAI_MODEL: '',
      ANTHROPIC_API_KEY: '',
      ANTHROPIC_MODEL: '',
    });

    expect(provider.name).toBe('mock');
  });

  it('AI_DEFAULT_PROVIDER=mock 強制 mock', () => {
    const provider = createProvider({
      AI_DEFAULT_PROVIDER: 'mock',
      OPENAI_API_KEY: 'sk-test',
      OPENAI_MODEL: 'gpt-4o',
      ANTHROPIC_API_KEY: '',
      ANTHROPIC_MODEL: '',
    });

    expect(provider.name).toBe('mock');
  });
});

// ==============================================
// 5. MockProvider 行為
// ==============================================

describe('S4.4 MockProvider', () => {
  it('識別「待辦/todo」關鍵字生成對應 JsonSpec', async () => {
    const provider = new MockProvider();
    const result = await provider.generateText([
      { role: 'user', content: '幫我做個待辦清單' },
    ]);

    expect(result).toContain('```json');
    expect(result).toContain('todo');
  });

  it('識別「活動/event」關鍵字', async () => {
    const provider = new MockProvider();
    const result = await provider.generateText([
      { role: 'user', content: '建立活動管理' },
    ]);

    expect(result).toContain('event');
  });

  it('其他輸入回應引導式問題', async () => {
    const provider = new MockProvider();
    const result = await provider.generateText([
      { role: 'user', content: '想做個部落格' },
    ]);

    expect(result).toContain('？');
  });
});

// ==============================================
// 6. TD-505 Token Usage 追蹤
// ==============================================

import type { TokenUsage } from './providers';

describe('TD-505 Token Usage 追蹤', () => {
  describe('型別定義', () => {
    it('TokenUsage 包含 prompt/completion/total tokens', () => {
      const usage: TokenUsage = {
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30,
      };
      expect(usage.totalTokens).toBe(usage.promptTokens + usage.completionTokens);
    });
  });

  describe('MockProvider', () => {
    it('generateTextWithUsage 回傳 fake usage', async () => {
      const provider = new MockProvider();
      const result = await provider.generateTextWithUsage([
        { role: 'user', content: '幫我做個待辦' },
      ]);

      expect(result.text).toContain('```json');
      expect(result.usage).toBeDefined();
      expect(result.usage!.promptTokens).toBeGreaterThan(0);
      expect(result.usage!.completionTokens).toBeGreaterThan(0);
      expect(result.usage!.totalTokens).toBeGreaterThan(0);
    });

    it('streamChunks 在串流結束時 yield usage chunk', async () => {
      const provider = new MockProvider();
      const chunks: { content?: string; usage?: TokenUsage }[] = [];
      for await (const chunk of provider.streamChunks([
        { role: 'user', content: 'hi' },
      ])) {
        chunks.push(chunk);
      }

      // 最後一個 chunk 應帶 usage
      const last = chunks[chunks.length - 1]!;
      expect(last.usage).toBeDefined();
      expect(last.usage!.totalTokens).toBeGreaterThan(0);
    });
  });

  describe('OpenAIProvider', () => {
    let mockFetch: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      mockFetch = vi.fn();
      vi.stubGlobal('fetch', mockFetch);
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('generateTextWithUsage 解析 OpenAI usage 欄位', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'hi' } }],
          usage: {
            prompt_tokens: 8,
            completion_tokens: 12,
            total_tokens: 20,
          },
        }),
      });

      const provider = new OpenAIProvider({ apiKey: 'sk-test' });
      const result = await provider.generateTextWithUsage([
        { role: 'user', content: 'hi' },
      ]);

      expect(result.text).toBe('hi');
      expect(result.usage).toEqual({
        promptTokens: 8,
        completionTokens: 12,
        totalTokens: 20,
      });
    });

    it('streamChunks 從 SSE 最後一個 usage chunk 提取 usage', async () => {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          controller.enqueue(
            encoder.encode('data: {"choices":[{"delta":{"content":"hi"}}]}\n\n'),
          );
          // OpenAI 最後一個 chunk 通常只帶 usage、choices 為空
          controller.enqueue(
            encoder.encode('data: {"choices":[],"usage":{"prompt_tokens":5,"completion_tokens":3,"total_tokens":8}}\n\n'),
          );
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        },
      });

      mockFetch.mockResolvedValueOnce({ ok: true, body: stream });

      const provider = new OpenAIProvider({ apiKey: 'sk-test' });
      const chunks: { content?: string; usage?: TokenUsage }[] = [];
      for await (const chunk of provider.streamChunks([
        { role: 'user', content: 'hi' },
      ])) {
        chunks.push(chunk);
      }

      // 前面 chunk 有 content
      const contentChunks = chunks.filter((c) => c.content);
      expect(contentChunks.map((c) => c.content).join('')).toBe('hi');

      // 某 chunk 帶 usage
      const usageChunk = chunks.find((c) => c.usage);
      expect(usageChunk).toBeDefined();
      expect(usageChunk!.usage).toEqual({
        promptTokens: 5,
        completionTokens: 3,
        totalTokens: 8,
      });
    });

    it('streamChunks 缺 usage 時不報錯', async () => {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          controller.enqueue(
            encoder.encode('data: {"choices":[{"delta":{"content":"hi"}}]}\n\n'),
          );
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        },
      });

      mockFetch.mockResolvedValueOnce({ ok: true, body: stream });

      const provider = new OpenAIProvider({ apiKey: 'sk-test' });
      const chunks: { content?: string; usage?: TokenUsage }[] = [];
      for await (const chunk of provider.streamChunks([
        { role: 'user', content: 'hi' },
      ])) {
        chunks.push(chunk);
      }

      expect(chunks.some((c) => c.usage)).toBe(false);
    });
  });

  describe('AnthropicProvider', () => {
    let mockFetch: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      mockFetch = vi.fn();
      vi.stubGlobal('fetch', mockFetch);
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('generateTextWithUsage 解析 Anthropic usage 欄位', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: [{ type: 'text', text: 'hi' }],
          usage: { input_tokens: 7, output_tokens: 13 },
        }),
      });

      const provider = new AnthropicProvider({ apiKey: 'sk-ant-test' });
      const result = await provider.generateTextWithUsage([
        { role: 'user', content: 'hi' },
      ]);

      expect(result.text).toBe('hi');
      expect(result.usage).toEqual({
        promptTokens: 7,
        completionTokens: 13,
        totalTokens: 20,
      });
    });

    it('streamChunks 從 message_delta.usage 提取 usage', async () => {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          controller.enqueue(
            encoder.encode('event: content_block_delta\ndata: {"type":"content_block_delta","delta":{"type":"text_delta","text":"hi"}}\n\n'),
          );
          // Anthropic message_delta 含 usage
          controller.enqueue(
            encoder.encode('event: message_delta\ndata: {"type":"message_delta","delta":{"stop_reason":"end_turn"},"usage":{"input_tokens":4,"output_tokens":2}}\n\n'),
          );
          controller.enqueue(
            encoder.encode('event: message_stop\ndata: {"type":"message_stop"}\n\n'),
          );
          controller.close();
        },
      });

      mockFetch.mockResolvedValueOnce({ ok: true, body: stream });

      const provider = new AnthropicProvider({ apiKey: 'sk-ant-test' });
      const chunks: { content?: string; usage?: TokenUsage }[] = [];
      for await (const chunk of provider.streamChunks([
        { role: 'user', content: 'hi' },
      ])) {
        chunks.push(chunk);
      }

      const contentChunks = chunks.filter((c) => c.content);
      expect(contentChunks.map((c) => c.content).join('')).toBe('hi');

      const usageChunk = chunks.find((c) => c.usage);
      expect(usageChunk).toBeDefined();
      expect(usageChunk!.usage).toEqual({
        promptTokens: 4,
        completionTokens: 2,
        totalTokens: 6,
      });
    });
  });
});

// ==============================================
// 7. TD-504 Mock Stream 延遲優化
// ==============================================

describe('TD-504 Mock Stream 延遲優化', () => {
  beforeEach(() => {
    // 確保環境變數不污染測試
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('預設 (無 env) streamChunks 不延遲 — 100字回應 < 100ms 完成', async () => {
    const provider = new MockProvider();
    const start = Date.now();

    const chunks: string[] = [];
    for await (const chunk of provider.streamChunks([
      { role: 'user', content: '幫我做個待辦' }, // 約 90 字
    ])) {
      if (chunk.content) chunks.push(chunk.content);
    }

    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(100);
    expect(chunks.join('').length).toBeGreaterThan(0);
  });

  it('預設 generateText 不延遲 (< 50ms)', async () => {
    const provider = new MockProvider();
    const start = Date.now();

    const text = await provider.generateText([
      { role: 'user', content: '幫我做個待辦' },
    ]);

    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(50);
    expect(text).toContain('```json');
  });

  it('MOCK_STREAM_DELAY_MS=15 啟用字符延遲（給 demo UI）', async () => {
    vi.stubEnv('MOCK_STREAM_DELAY_MS', '15');
    const provider = new MockProvider();

    // 用「其他輸入」分支拿最短回應（不到 20 字，計算快一點）
    const start = Date.now();
    let count = 0;
    for await (const chunk of provider.streamChunks([
      { role: 'user', content: '想做個部落格' }, // mock 返回 ~50 字引導式回應
    ])) {
      if (chunk.content) count++;
    }
    const elapsed = Date.now() - start;

    // 即使很短回應也會多字符延遲
    expect(count).toBeGreaterThan(10);
    expect(elapsed).toBeGreaterThan(150);
  }, 10000);

  it('MOCK_STREAM_DELAY_MS=0 明確設為不延遲', async () => {
    vi.stubEnv('MOCK_STREAM_DELAY_MS', '0');
    const provider = new MockProvider();

    const start = Date.now();
    for await (const _ of provider.streamChunks([
      { role: 'user', content: '幫我做個待辦' },
    ])) {
      void _;
    }
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(100);
  });

  it('MOCK_GENERATE_DELAY_MS 控制 generateText 延遲', async () => {
    vi.stubEnv('MOCK_GENERATE_DELAY_MS', '50');
    const provider = new MockProvider();

    const start = Date.now();
    await provider.generateText([{ role: 'user', content: 'hi' }]);
    const elapsed = Date.now() - start;

    expect(elapsed).toBeGreaterThanOrEqual(40); // 給 10ms 寬鬆
  });

  it('MOCK_GENERATE_DELAY_MS=0 明確不延遲', async () => {
    vi.stubEnv('MOCK_GENERATE_DELAY_MS', '0');
    const provider = new MockProvider();

    const start = Date.now();
    await provider.generateText([{ role: 'user', content: 'hi' }]);
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(50);
  });
});