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

// (within 已被移除 - 全部改用直接 DOM query)

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

// ==============================================
// TD-506 ChatSidebar close icon (visual consistency + a11y)
// ==============================================

describe('TD-506 ChatSidebar close icon', () => {
  it('關閉按鈕使用 lucide X icon 而非 emoji ✕', () => {
    render(
      <ChatSidebar
        sessions={[]}
        activeId={null}
        onSelect={() => {}}
        onNew={() => {}}
        onClose={() => {}}
      />,
    );

    const closeButton = screen.getByTestId('sidebar-close-button');

    // 應有 SVG (lucide icon 渲染為 <svg>)
    const svg = closeButton.querySelector('svg');
    expect(svg).not.toBeNull();

    // 不應有 emoji 文字內容
    expect(closeButton.textContent?.trim()).not.toContain('✕');
    expect(closeButton.textContent?.trim()).not.toContain('×');
  });

  it('icon 標記 aria-hidden（避免 screen reader 重複讀取）', () => {
    render(
      <ChatSidebar
        sessions={[]}
        activeId={null}
        onSelect={() => {}}
        onNew={() => {}}
        onClose={() => {}}
      />,
    );

    const closeButton = screen.getByTestId('sidebar-close-button');
    const svg = closeButton.querySelector('svg');

    expect(svg).not.toBeNull();
    // 圖標裝飾性，按鈕已有 aria-label
    expect(svg!.getAttribute('aria-hidden')).toBe('true');
  });

  it('aria-label 仍為「關閉側邊欄」', () => {
    render(
      <ChatSidebar
        sessions={[]}
        activeId={null}
        onSelect={() => {}}
        onNew={() => {}}
        onClose={() => {}}
      />,
    );

    expect(
      screen.getByRole('button', { name: '關閉側邊欄' }),
    ).toBeTruthy();
  });
});