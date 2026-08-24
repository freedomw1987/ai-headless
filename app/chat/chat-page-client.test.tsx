/**
 * TDD Gate 1 — TD-501 ChatPageClient 重構前行為捕獲
 *
 * 這些測試描述目前 ChatPageClient 的可觀察行為：
 * - 渲染主結構（header、messages container、input）
 * - 空 session 顯示引導文字
 * - 「+ 新對話」按鈕建立 session
 * - 送出訊息觸發 streamChatWithRetry
 * - 串流過程中顯示「AI 正在輸入…」
 * - 完成時提取 JsonSpec 並標記到最後一條 assistant 訊息
 * - 錯誤訊息顯示在 assistant 訊息中
 *
 * 重構後這些測試必須仍全綠。
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChatPageClient } from './chat-page-client';

// ==============================================
// Mocks
// ==============================================

vi.mock('@/lib/ai/stream-client', () => ({
  streamChatWithRetry: vi.fn(),
}));

vi.mock('@/lib/ai/stream-controller', () => ({
  abortStream: vi.fn(),
  createStreamController: vi.fn(() => ({
    id: 'chat-test',
    signal: new AbortController().signal,
  })),
}));

import { streamChatWithRetry } from '@/lib/ai/stream-client';

// ==============================================
// 1. 結構渲染
// ==============================================

describe('TD-501 ChatPageClient 結構', () => {
  beforeEach(() => {
    // jsdom 不支援 scrollIntoView,充 test 環境
    HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  it('渲染 chat-page 主容器', () => {
    render(<ChatPageClient />);
    expect(screen.getByTestId('chat-page')).toBeTruthy();
  });

  it('渲染頁頭 AI Chat', () => {
    render(<ChatPageClient />);
    expect(screen.getByRole('heading', { name: 'AI Chat' })).toBeTruthy();
  });

  it('渲染 ChatInput', () => {
    render(<ChatPageClient />);
    expect(screen.getByPlaceholderText(/輸入訊息|傳送|message/i)).toBeTruthy();
  });

  it('空 session 顯示引導文字', () => {
    render(<ChatPageClient />);
    expect(screen.getByText(/你好/)).toBeTruthy();
    expect(screen.getByText(/待辦事項|活動管理/)).toBeTruthy();
  });
});

// ==============================================
// 2. Session 管理
// ==============================================

describe('TD-501 ChatPageClient Session 管理', () => {
  beforeEach(() => {
    HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  it('點 + 新對話 → 新增 session 並在 sidebar 出現', () => {
    render(<ChatPageClient />);

    // 點按鈕前：sidebar 裡不應有 session 項目（僅有 + 新對話 按鈕）
    const sidebar = screen.getByTestId('chat-sidebar');
    expect(sidebar.querySelectorAll('[data-testid^="session-"]')).toHaveLength(0);

    // 點 + 新對話
    const newButton = screen.getByRole('button', { name: /新對話/ });
    fireEvent.click(newButton);

    // 點後：sidebar 裡應有 session 項目、且標題為「新對話」
    const sessions = screen.getByTestId('chat-sidebar').querySelectorAll('[data-testid^="session-"]');
    expect(sessions).toHaveLength(1);
    expect(screen.getByText('新對話')).toBeTruthy();
  });
});

// ==============================================
// 3. 串流發送
// ==============================================

describe('TD-501 ChatPageClient 串流發送', () => {
  beforeEach(() => {
    vi.mocked(streamChatWithRetry).mockReset();
    HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('送出訊息 → 呼叫 streamChatWithRetry', async () => {
    // Mock 一個 async generator
    async function* mockStream() {
      yield 'hello';
      yield ' world';
    }
    vi.mocked(streamChatWithRetry).mockImplementation(mockStream);

    render(<ChatPageClient />);

    // 建立新 session
    const newButton = screen.getByRole('button', { name: /新對話/ });
    fireEvent.click(newButton);

    // 送出訊息 — ChatInput 用 button click 觸發,非 form submit
    const input = screen.getByPlaceholderText(/輸入訊息|傳送|message/i);
    fireEvent.change(input, { target: { value: '幫我做個待辦' } });
    fireEvent.click(screen.getByTestId('chat-send-button'));

    await waitFor(() => {
      expect(streamChatWithRetry).toHaveBeenCalled();
    });
  });

  it('串流進行中顯示「AI 正在輸入…」', async () => {
    // Mock 一個永不結束的 generator(保持 streaming 狀態)
    async function* mockStream() {
      yield 'hello';
      // 不結束,讓 streaming 維持
      await new Promise(() => {}); // 永遠 pending
    }
    vi.mocked(streamChatWithRetry).mockImplementation(mockStream);

    render(<ChatPageClient />);

    fireEvent.click(screen.getByRole('button', { name: /新對話/ }));
    const input = screen.getByPlaceholderText(/輸入訊息|傳送|message/i);
    fireEvent.change(input, { target: { value: 'hi' } });
    fireEvent.click(screen.getByTestId('chat-send-button'));

    await waitFor(() => {
      expect(screen.getByText(/AI 正在輸入/)).toBeTruthy();
    });
  });

  it('串流返回 ```json {...}``` → 提取 JsonSpec 標記到最後一條 assistant 訊息', async () => {
    // 串流返回包含 JsonSpec markdown code block（包含必須的 name + models）
    async function* mockStream() {
      yield '這是個活動管理';
      yield ` \n\`\`\`json
{"name":"event-management","models":[{"name":"Event","fields":[{"name":"title","type":"string"}]}]}
\`\`\``;
    }
    vi.mocked(streamChatWithRetry).mockImplementation(mockStream);

    render(<ChatPageClient />);

    fireEvent.click(screen.getByRole('button', { name: /新對話/ }));
    const input = screen.getByPlaceholderText(/輸入訊息|傳送|message/i);
    fireEvent.change(input, { target: { value: '建立活動管理' } });
    fireEvent.click(screen.getByTestId('chat-send-button'));

    // MessageBubble 應顯示 JsonSpec badge + ✨ 已生成 JsonSpec 文字
    await waitFor(
      () => {
        expect(screen.getByText(/已生成 JsonSpec/)).toBeTruthy();
      },
      { timeout: 3000 },
    );
    // event-management 是 spec 名稱
    await waitFor(
      () => {
        expect(screen.getByText('event-management')).toBeTruthy();
      },
      { timeout: 3000 },
    );
  });

  it('送出後 → 確認傳給 streamChatWithRetry 的 messages 包含 user 訊息（TD-501 P1-1 bug guard）', async () => {
    async function* mockStream() {
      yield 'ok';
    }
    vi.mocked(streamChatWithRetry).mockImplementation(mockStream);

    render(<ChatPageClient />);

    fireEvent.click(screen.getByRole('button', { name: /新對話/ }));
    const input = screen.getByPlaceholderText(/輸入訊息|傳送|message/i);
    fireEvent.change(input, { target: { value: '幫我做個待辦' } });
    fireEvent.click(screen.getByTestId('chat-send-button'));

    await waitFor(() => {
      expect(streamChatWithRetry).toHaveBeenCalled();
    });

    // 驗證第一個參數 messages 包含 user 訊息
    const callArgs = vi.mocked(streamChatWithRetry).mock.calls[0]![0] as Array<{ role: string; content: string }>;
    const hasUserMessage = callArgs.some(
      (m) => m.role === 'user' && m.content === '幫我做個待辦',
    );
    expect(hasUserMessage).toBe(true);
  });

  it('串流 throw → 錯誤訊息顯示在 assistant 訊息中', async () => {
    // Mock 一個馬上 throw 的 generator（沒有 yield,content 為空 → 應顯示錯誤訊息）
    async function* mockStream() {
      throw new Error('API failed');
    }
    vi.mocked(streamChatWithRetry).mockImplementation(mockStream);

    render(<ChatPageClient />);

    fireEvent.click(screen.getByRole('button', { name: /新對話/ }));
    const input = screen.getByPlaceholderText(/輸入訊息|傳送|message/i);
    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.click(screen.getByTestId('chat-send-button'));

    await waitFor(
      () => {
        // 錯誤訊息格式：「錯誤：<error string>」
        expect(screen.getByText(/錯誤：/)).toBeTruthy();
      },
      { timeout: 3000 },
    );
  });
});