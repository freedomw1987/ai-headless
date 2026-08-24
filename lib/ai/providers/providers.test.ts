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