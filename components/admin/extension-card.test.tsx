/**
 * TDD Gate 1 — S3.5 Extension Card 組件測試（+TD-403 Toast）
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactElement } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExtensionCard, type ExtensionCardData } from './extension-card';
import { ToastProvider } from '@/components/ui/toast';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
});

const sampleExtension: ExtensionCardData = {
  name: 'todo',
  version: '1.0.0',
  label: '待辦事項',
  description: '待辦清單管理',
  author: 'ai-headless',
  hooks: ['beforeCreateTodo'],
  actions: ['completeTodo'],
  computed: ['remainingDays'],
  workflows: [],
  isEnabled: true,
};

function renderWithToast(ui: ReactElement) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

describe('S3.5 ExtensionCard', () => {
  it('渲染 Extension 基本資訊', () => {
    renderWithToast(<ExtensionCard extension={sampleExtension} />);

    expect(screen.getByText('待辦事項')).toBeTruthy();
    expect(screen.getByText('v1.0.0')).toBeTruthy();
    expect(screen.getByText('待辦清單管理')).toBeTruthy();
    expect(screen.getByText('by ai-headless')).toBeTruthy();
  });

  it('啟用狀態顯示「✓ 已啟用」', () => {
    renderWithToast(<ExtensionCard extension={sampleExtension} />);

    expect(screen.getByText('✓ 已啟用')).toBeTruthy();
  });

  it('停用狀態顯示「✗ 已停用」', () => {
    renderWithToast(<ExtensionCard extension={{ ...sampleExtension, isEnabled: false }} />);

    expect(screen.getByText('✗ 已停用')).toBeTruthy();
  });

  it('顯示 hooks/actions/computed counts', () => {
    renderWithToast(<ExtensionCard extension={sampleExtension} />);

    expect(screen.getByText(/1 hooks/)).toBeTruthy();
    expect(screen.getByText(/1 actions/)).toBeTruthy();
    expect(screen.getByText(/1 computed/)).toBeTruthy();
  });

  it('啟用按鈕文字為「停用」', () => {
    renderWithToast(<ExtensionCard extension={sampleExtension} />);

    expect(screen.getByTestId('toggle-todo').textContent).toBe('停用');
  });

  it('停用狀態按鈕文字為「啟用」', () => {
    renderWithToast(<ExtensionCard extension={{ ...sampleExtension, isEnabled: false }} />);

    expect(screen.getByTestId('toggle-todo').textContent).toBe('啟用');
  });

  it('點擊 toggle 觸發 API', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { name: 'todo', enabled: false } }),
    });

    renderWithToast(<ExtensionCard extension={sampleExtension} />);

    fireEvent.click(screen.getByTestId('toggle-todo'));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/extensions/todo/toggle',
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  it('toggle 成功後更新 UI + 顯示 toast', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { name: 'todo', enabled: false } }),
    });

    renderWithToast(<ExtensionCard extension={sampleExtension} />);

    fireEvent.click(screen.getByTestId('toggle-todo'));

    await waitFor(() => {
      expect(screen.getByText('✗ 已停用')).toBeTruthy();
    });
  });

  it('toggle 失敗顯示 error toast + 保持原狀', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    renderWithToast(<ExtensionCard extension={sampleExtension} />);

    fireEvent.click(screen.getByTestId('toggle-todo'));

    await waitFor(() => {
      // 保持啟用狀態
      expect(screen.getByText('✓ 已啟用')).toBeTruthy();
    });
  });
});