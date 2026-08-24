/**
 * TDD Gate 1 — S3.4 Chat UI 組件測試
 *
 * 涵蓋：
 * 1. ChatSidebar 渲染 + 新對話按鈕
 * 2. MessageBubble 顯示 user/assistant 不同樣式
 * 3. ChatInput 送出訊息 + Enter 鍵
 * 4. JsonSpec metadata badge 顯示
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatSidebar } from './chat-sidebar';
import { MessageBubble } from './message-bubble';
import { ChatInput } from './chat-input';
import type { ChatSession, ChatMessage } from '@/lib/ai/chat/chat-utils';

// ==============================================
// 1. ChatSidebar
// ==============================================

describe('S3.4 ChatSidebar', () => {
  it('渲染「+ 新對話」按鈕', () => {
    render(
      <ChatSidebar
        sessions={[]}
        activeId={null}
        onSelect={() => {}}
        onNew={() => {}}
      />,
    );

    expect(screen.getByTestId('new-chat-button')).toBeTruthy();
  });

  it('空 sessions 顯示提示', () => {
    render(
      <ChatSidebar
        sessions={[]}
        activeId={null}
        onSelect={() => {}}
        onNew={() => {}}
      />,
    );

    expect(screen.getByText('還沒有對話')).toBeTruthy();
  });

  it('顯示所有 sessions', () => {
    const sessions: ChatSession[] = [
      {
        id: 's1',
        title: '對話 1',
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 's2',
        title: '對話 2',
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    render(
      <ChatSidebar
        sessions={sessions}
        activeId="s1"
        onSelect={() => {}}
        onNew={() => {}}
      />,
    );

    expect(screen.getByText('對話 1')).toBeTruthy();
    expect(screen.getByText('對話 2')).toBeTruthy();
  });

  it('點擊「新對話」觸發 onNew', () => {
    const onNew = vi.fn();

    render(
      <ChatSidebar
        sessions={[]}
        activeId={null}
        onSelect={() => {}}
        onNew={onNew}
      />,
    );

    fireEvent.click(screen.getByTestId('new-chat-button'));
    expect(onNew).toHaveBeenCalledOnce();
  });
});

// ==============================================
// 2. MessageBubble
// ==============================================

describe('S3.4 MessageBubble', () => {
  it('user 訊息顯示純文字', () => {
    const msg: ChatMessage = {
      id: 'm1',
      role: 'user',
      content: '你好',
      createdAt: new Date().toISOString(),
    };

    render(<MessageBubble message={msg} />);

    expect(screen.getByText('你好')).toBeTruthy();
    expect(screen.getByTestId('message-user')).toBeTruthy();
  });

  it('assistant 訊息含 JsonSpec badge', () => {
    const msg: ChatMessage = {
      id: 'm2',
      role: 'assistant',
      content: '這是 spec',
      metadata: {
        jsonSpec: {
          name: 'todo',
          label: 'Todo',
          models: [],
        },
      },
      createdAt: new Date().toISOString(),
    };

    render(<MessageBubble message={msg} />);

    expect(screen.getByText(/已生成 JsonSpec/)).toBeTruthy();
    expect(screen.getByTestId('message-assistant')).toBeTruthy();
  });

  it('assistant 無 JsonSpec 不顯示 badge', () => {
    const msg: ChatMessage = {
      id: 'm3',
      role: 'assistant',
      content: '純文字回應',
      createdAt: new Date().toISOString(),
    };

    render(<MessageBubble message={msg} />);

    expect(screen.queryByText(/已生成 JsonSpec/)).toBeNull();
  });

  it('assistant Markdown 渲染（粗體）', () => {
    const msg: ChatMessage = {
      id: 'm4',
      role: 'assistant',
      content: '這是 **重要** 的訊息',
      createdAt: new Date().toISOString(),
    };

    const { container } = render(<MessageBubble message={msg} />);

    expect(container.innerHTML).toContain('<strong>重要</strong>');
  });
});

// ==============================================
// 3. ChatInput
// ==============================================

describe('S3.4 ChatInput', () => {
  it('點擊「送出」按鈕觸發 onSubmit', () => {
    const onSubmit = vi.fn();

    render(<ChatInput onSubmit={onSubmit} />);

    const textarea = screen.getByTestId('chat-input') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'hello' } });

    fireEvent.click(screen.getByTestId('chat-send-button'));
    expect(onSubmit).toHaveBeenCalledWith('hello');
  });

  it('Enter 鍵送出訊息', () => {
    const onSubmit = vi.fn();

    render(<ChatInput onSubmit={onSubmit} />);

    const textarea = screen.getByTestId('chat-input') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'enter msg' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });

    expect(onSubmit).toHaveBeenCalledWith('enter msg');
  });

  it('Shift+Enter 不送出（換行）', () => {
    const onSubmit = vi.fn();

    render(<ChatInput onSubmit={onSubmit} />);

    const textarea = screen.getByTestId('chat-input') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'line' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('空字串不觸發送出', () => {
    const onSubmit = vi.fn();

    render(<ChatInput onSubmit={onSubmit} />);

    fireEvent.click(screen.getByTestId('chat-send-button'));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('disabled 時按鈕不可點擊', () => {
    const onSubmit = vi.fn();

    render(<ChatInput onSubmit={onSubmit} disabled />);

    const textarea = screen.getByTestId('chat-input') as HTMLTextAreaElement;
    expect(textarea.disabled).toBe(true);
  });

  it('送出後清空 textarea', () => {
    const onSubmit = vi.fn();

    render(<ChatInput onSubmit={onSubmit} />);

    const textarea = screen.getByTestId('chat-input') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'first' } });
    fireEvent.click(screen.getByTestId('chat-send-button'));

    expect(textarea.value).toBe('');
  });
});