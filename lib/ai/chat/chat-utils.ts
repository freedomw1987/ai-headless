/**
 * ==============================================
 *  AI Chat Utils — S3.4 Chat 核心邏輯
 * ==============================================
 *
 * 對應：docs/prd/06-ai-chat.md
 *
 * 提供：
 * 1. ChatSession + ChatMessage 資料結構
 * 2. 簡單 Markdown 渲染（不引入額外依賴）
 * 3. JsonSpec extraction from AI response
 * 4. SSE streaming chunk parsing
 */

import type { JsonSpec } from '@/lib/specs/json-spec.types';

// ==============================================
// 1. 類型
// ==============================================

export type ChatMessageRole = 'user' | 'assistant' | 'system';

export type ChatMessageMetadata = {
  jsonSpec?: JsonSpec;
  pipelineProgress?: {
    stage: string;
    status: 'pending' | 'running' | 'success' | 'error';
    message?: string;
  };
};

export type ChatMessage = {
  id: string;
  role: ChatMessageRole;
  content: string;
  /**
   * Sprint 47 Commit 2 (Stage 47-1): AI 思考過程 / reasoning
   * 從 pi-agent-sdk thinking_delta events 累積，不持久化到 DB
   */
  reasoning?: string;
  /**
   * Sprint 47 Commit 3 (Stage 47-3): 真實前端上傳 attachment 引用
   * 用於 SourcesList 降階方案（顯示本次對話附件）
   */
  attachments?: Array<{ id: string; filename: string; size?: number }>;
  metadata?: ChatMessageMetadata;
  createdAt: string;
};

export type ChatSession = {
  id: string;
  title: string;
  userId?: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
};

// ==============================================
// 2. Session utilities
// ==============================================

function generateId(): string {
  return `chat-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createChatSession(opts: {
  userId?: string;
  title?: string;
}): ChatSession {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    title: opts.title ?? '新對話',
    userId: opts.userId,
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function addMessage(
  session: ChatSession,
  msg: Omit<ChatMessage, 'id' | 'createdAt'>,
): ChatSession {
  const newMsg: ChatMessage = {
    id: generateId(),
    createdAt: new Date().toISOString(),
    ...msg,
  };

  return {
    ...session,
    messages: [...session.messages, newMsg],
    updatedAt: new Date().toISOString(),

    // 自動從第一條 user 訊息設定 title
    title:
      session.messages.length === 0 && msg.role === 'user'
        ? msg.content.slice(0, 30)
        : session.title,
  };
}

export function getMessages(session: ChatSession): ChatMessage[] {
  return session.messages;
}

// ==============================================
// 3. Markdown 渲染（簡單實作）
// ==============================================

/**
 * 簡單 Markdown → HTML 渲染
 *
 * 支援：
 * - **bold** / *italic*
 * - `inline code` / ```code block```
 * - # / ## / ### headings
 * - [link](url)
 * - - unordered list
 * - XSS 防護（自動 escape HTML）
 */
export function renderMarkdown(md: string): string {
  let html = md;

  // 1. Escape HTML（XSS 防護）
  html = escapeHtml(html);

  // 2. Code blocks（先處理，避免後續規則干擾）
  html = html.replace(
    /```(\w*)\n([\s\S]*?)```/g,
    (_, lang, code) =>
      `<pre><code class="language-${lang}">${code}</code></pre>`,
  );

  // 3. Inline code
  html = html.replace(/`([^`\n]+)`/g, '<code>$1</code>');

  // 4. Headings
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // 5. Bold / Italic
  html = html.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');

  // 6. Links
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener">$1</a>',
  );

  // 7. Unordered list（連續 - 開頭的行）
  html = html.replace(/(^- .+$\n?)+/gm, (match) => {
    const items = match.trim().split('\n').map((line) => {
      const text = line.replace(/^- /, '');
      return `<li>${text}</li>`;
    });
    return `<ul>${items.join('')}</ul>`;
  });

  // 8. 段落（雙換行 → <p>）
  html = html.replace(/\n\n+/g, '</p><p>');
  html = `<p>${html}</p>`;

  return html;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ==============================================
// 4. JsonSpec extraction
// ==============================================

/**
 * 從 AI 回應中提取 ```json 包裹的 JSON spec
 */
export function extractJsonSpec(response: string): JsonSpec | null {
  const match = response.match(/```json\s*([\s\S]+?)\s*```/);
  if (!match) return null;

  try {
    const parsed = JSON.parse(match[1]!);
    // 基本驗證
    if (typeof parsed !== 'object' || !parsed.name || !Array.isArray(parsed.models)) {
      return null;
    }
    return parsed as JsonSpec;
  } catch {
    return null;
  }
}

// ==============================================
// 5. SSE streaming chunk parsing
// ==============================================

export type StreamChunk = {
  content: string;
  done?: boolean;
  usage?: TokenUsage;
};

/** TD-505: token usage 類型 */
export type TokenUsage = {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
};

/**
 * 解析 SSE chunk（data: prefix）
 */
export function parseStreamChunk(chunk: string): StreamChunk | null {
  if (!chunk.trim()) return null;

  const lines = chunk.split('\n').filter((l) => l.trim());
  for (const line of lines) {
    if (!line.startsWith('data:')) continue;

    const data = line.slice(5).trim();

    if (data === '[DONE]') {
      return { content: '', done: true };
    }

    try {
      const parsed = JSON.parse(data);

      // TD-505: usage 事件（結尾）優先處理
      if (parsed.usage && typeof parsed.usage === 'object') {
        const u = parsed.usage;
        if (
          typeof u.promptTokens === 'number' &&
          typeof u.completionTokens === 'number' &&
          typeof u.totalTokens === 'number'
        ) {
          return {
            content: '',
            usage: {
              promptTokens: u.promptTokens,
              completionTokens: u.completionTokens,
              totalTokens: u.totalTokens,
            },
          };
        }
      }

      return {
        content: parsed.content ?? parsed.delta ?? '',
      };
    } catch {
      // 跳過非 JSON 行
      continue;
    }
  }

  return null;
}