/**
 * Sprint 47 Commit 2 (Stage 47-1) — ReasoningSection 元件單元測試
 *
 * 對應 PRD: docs/prd/11-chat-v2-completions.md §2.2 (FR-2.5)
 *
 * 驗證:
 * - 預設收合，點擊展開
 * - reasoning 字串顯示
 * - reasoning 為空時不渲染元件
 * - 鍵盤可達 (Tab + Enter/Space 切換)
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ReasoningSection } from './reasoning-section';

describe('ReasoningSection — Sprint 47-1', () => {
  it('預設收合，點擊 header 展開/收合', () => {
    render(<ReasoningSection reasoning="test reasoning" />);

    // 預設應收合（內容不顯示）
    expect(screen.queryByText('test reasoning')).not.toBeInTheDocument();

    // 點擊 header
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(screen.getByText('test reasoning')).toBeInTheDocument();

    // 再點擊收合
    fireEvent.click(button);
    expect(screen.queryByText('test reasoning')).not.toBeInTheDocument();
  });

  it('reasoning 為空字串時不渲染元件', () => {
    const { container } = render(<ReasoningSection reasoning="" />);
    expect(container.firstChild).toBeNull();
  });

  it('reasoning 為 undefined 時不渲染元件', () => {
    const { container } = render(<ReasoningSection reasoning={undefined} />);
    expect(container.firstChild).toBeNull();
  });

  it('鍵盤 Enter 觸發展開', () => {
    render(<ReasoningSection reasoning="kb test" />);
    const button = screen.getByRole('button');
    expect(screen.queryByText('kb test')).not.toBeInTheDocument();

    fireEvent.keyDown(button, { key: 'Enter' });
    expect(screen.getByText('kb test')).toBeInTheDocument();
  });

  it('鍵盤 Space 觸發展開', () => {
    render(<ReasoningSection reasoning="space test" />);
    const button = screen.getByRole('button');

    fireEvent.keyDown(button, { key: ' ' });
    expect(screen.getByText('space test')).toBeInTheDocument();
  });

  it('自動收合計時：展開後 1.5 秒自動收合', async () => {
    vi.useFakeTimers();
    try {
      render(<ReasoningSection reasoning="auto collapse" autoCollapseMs={1500} />);
      const button = screen.getByRole('button');

      // 展開
      fireEvent.click(button);
      expect(screen.getByText('auto collapse')).toBeInTheDocument();

      // 1.5 秒後自動收合
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1500);
      });
      expect(screen.queryByText('auto collapse')).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});
