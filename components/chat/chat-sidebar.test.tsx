/**
 * TDD Gate 1 — S4.1 TD-401 ChatSidebar RWD
 *
 * 涵蓋：
 * 1. 桌面 (>768px) 預設顯示 sidebar
 * 2. 漢堡按鈕切換 sidebar 顯示
 * 3. onClose 回調（給父組件用）
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatSidebar } from './chat-sidebar';

describe('S4.1 TD-401 ChatSidebar RWD', () => {
  it('渲染 sidebar + 漢堡按鈕', () => {
    const onClose = vi.fn();
    render(
      <ChatSidebar
        sessions={[]}
        activeId={null}
        onSelect={() => {}}
        onNew={() => {}}
        onClose={onClose}
      />,
    );

    expect(screen.getByTestId('chat-sidebar')).toBeTruthy();
    expect(screen.getByTestId('sidebar-close-button')).toBeTruthy();
  });

  it('點擊漢堡按鈕觸發 onClose', () => {
    const onClose = vi.fn();
    render(
      <ChatSidebar
        sessions={[]}
        activeId={null}
        onSelect={() => {}}
        onNew={() => {}}
        onClose={onClose}
      />,
    );

    fireEvent.click(screen.getByTestId('sidebar-close-button'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('沒 onClose 時不渲染漢堡按鈕', () => {
    render(
      <ChatSidebar
        sessions={[]}
        activeId={null}
        onSelect={() => {}}
        onNew={() => {}}
      />,
    );

    expect(screen.queryByTestId('sidebar-close-button')).toBeNull();
  });
});