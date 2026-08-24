/**
 * TDD Gate 1 — S3.4 AI Chat 完整 UI（核心邏輯）
 *
 * 涵蓋：
 * 1. ChatSession + ChatMessage 結構
 * 2. 訊息流（user/assistant 交替）
 * 3. Markdown 渲染（簡單正則處理）
 * 4. Streaming 訊息處理（SSE chunks）
 * 5. JsonSpec extraction from AI response
 */

import { describe, it, expect } from 'vitest';
import {
  createChatSession,
  addMessage,
  getMessages,
  extractJsonSpec,
  renderMarkdown,
  parseStreamChunk,
  type ChatMessage,
} from './chat-utils';

// ==============================================
// 1. ChatSession
// ==============================================

describe('S3.4 ChatSession', () => {
  it('建立 session 含預設 title', () => {
    const session = createChatSession({ userId: 'user-1' });

    expect(session.id).toBeTruthy();
    expect(session.title).toBe('新對話');
    expect(session.userId).toBe('user-1');
    expect(session.messages).toEqual([]);
    expect(session.createdAt).toBeTruthy();
  });

  it('自訂 title', () => {
    const session = createChatSession({
      userId: 'user-1',
      title: '建立待辦清單',
    });

    expect(session.title).toBe('建立待辦清單');
  });

  it('addMessage 附加到 session', () => {
    const session = createChatSession({ userId: 'user-1' });
    const updated = addMessage(session, {
      role: 'user',
      content: '你好',
    });

    expect(updated.messages).toHaveLength(1);
    expect(updated.messages[0]!.role).toBe('user');
    expect(updated.messages[0]!.content).toBe('你好');
  });

  it('getMessages 回傳所有訊息', () => {
    const session = createChatSession({ userId: 'user-1' });
    let s = addMessage(session, { role: 'user', content: 'msg-1' });
    s = addMessage(s, { role: 'assistant', content: 'msg-2' });

    const messages = getMessages(s);

    expect(messages).toHaveLength(2);
    expect(messages[0]!.content).toBe('msg-1');
    expect(messages[1]!.content).toBe('msg-2');
  });
});

// ==============================================
// 2. Markdown 渲染
// ==============================================

describe('S3.4 Markdown 渲染', () => {
  it('渲染粗體', () => {
    expect(renderMarkdown('**Hello**')).toContain('<strong>Hello</strong>');
  });

  it('渲染斜體', () => {
    expect(renderMarkdown('*Hello*')).toContain('<em>Hello</em>');
  });

  it('渲染 inline code', () => {
    expect(renderMarkdown('`code`')).toContain('<code>code</code>');
  });

  it('渲染 code block', () => {
    const md = '```js\nconst x = 1;\n```';
    const html = renderMarkdown(md);
    expect(html).toContain('<pre>');
    expect(html).toContain('<code');
    expect(html).toContain('const x = 1;');
  });

  it('渲染 heading', () => {
    const html = renderMarkdown('# Title');
    expect(html).toContain('<h1>Title</h1>');
  });

  it('渲染 unordered list', () => {
    const md = '- a\n- b\n- c';
    const html = renderMarkdown(md);
    expect(html).toContain('<ul>');
    expect(html).toContain('<li>a</li>');
  });

  it('渲染連結', () => {
    const html = renderMarkdown('[Link](https://example.com)');
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('Link</a>');
  });

  it('XSS 防護：轉義 <script>', () => {
    const html = renderMarkdown('<script>alert(1)</script>');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });
});

// ==============================================
// 3. JsonSpec extraction from AI response
// ==============================================

describe('S3.4 JsonSpec extraction', () => {
  it('從 markdown 包裹的 JSON 提取', () => {
    const response = `以下是 JsonSpec：

\`\`\`json
{
  "name": "todo",
  "label": "Todo",
  "models": []
}
\`\`\``;

    const spec = extractJsonSpec(response);

    expect(spec).not.toBeNull();
    expect(spec!.name).toBe('todo');
    expect(spec!.models).toEqual([]);
  });

  it('從 ```json fence 提取（無尾部換行）', () => {
    const response = '```json\n{"name":"x","label":"X","models":[]}\n```';

    const spec = extractJsonSpec(response);

    expect(spec).not.toBeNull();
    expect(spec!.name).toBe('x');
  });

  it('無 JSON 時返回 null', () => {
    expect(extractJsonSpec('純文字回應')).toBeNull();
  });

  it('JSON 解析失敗時返回 null', () => {
    expect(extractJsonSpec('```json\n{invalid json}\n```')).toBeNull();
  });
});

// ==============================================
// 4. Streaming chunks
// ==============================================

describe('S3.4 Streaming chunks', () => {
  it('解析 SSE chunk (data: prefix)', () => {
    const chunk = 'data: {"content":"hello"}\n\n';
    const parsed = parseStreamChunk(chunk);

    expect(parsed).not.toBeNull();
    expect(parsed!.content).toBe('hello');
  });

  it('空 chunk 返回 null', () => {
    expect(parseStreamChunk('')).toBeNull();
    expect(parseStreamChunk('\n\n')).toBeNull();
  });

  it('[DONE] sentinel 返回 done=true', () => {
    const result = parseStreamChunk('data: [DONE]\n\n');
    expect(result).not.toBeNull();
    expect(result!.done).toBe(true);
  });

  it('多行 SSE chunk 解析第一個', () => {
    const chunk = 'data: {"content":"a"}\n\ndata: {"content":"b"}\n\n';
    const parsed = parseStreamChunk(chunk);

    expect(parsed!.content).toBe('a');
  });
});

// ==============================================
// 5. ChatMessage types
// ==============================================

describe('S3.4 ChatMessage types', () => {
  it('user message', () => {
    const msg: ChatMessage = {
      id: 'msg-1',
      role: 'user',
      content: 'hi',
      createdAt: new Date().toISOString(),
    };

    expect(msg.role).toBe('user');
  });

  it('assistant message 含 JsonSpec metadata', () => {
    const msg: ChatMessage = {
      id: 'msg-2',
      role: 'assistant',
      content: '這是 spec',
      metadata: {
        jsonSpec: { name: 'test', label: 'Test', models: [] },
      },
      createdAt: new Date().toISOString(),
    };

    expect(msg.metadata?.jsonSpec?.name).toBe('test');
  });
});