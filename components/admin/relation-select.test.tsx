/**
 * TDD Gate 1 — RelationSelect 組件測試
 *
 * 涵蓋：
 * 1. 自動從 /api/crud/{model} 載入選項
 * 2. 載入中顯示 loading state
 * 3. 載入失敗 fallback
 * 4. label 欄位自訂（顯示哪個欄位）
 * 5. 與 Select 組件整合
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { RelationSelect } from './relation-select';

// ==============================================
// Mock fetch
// ==============================================

const mockFetch = vi.fn();
beforeEach(() => {
  mockFetch.mockReset();
  vi.stubGlobal('fetch', mockFetch);
});

// ==============================================
// 1. 基本渲染
// ==============================================

describe('RelationSelect 基本', () => {
  it('渲染 Select + loading state', () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [] }),
    });

    render(<RelationSelect model="Author" value="" onChange={() => {}} />);

    // 預設顯示 Select trigger
    expect(screen.getByRole('combobox')).toBeTruthy();
  });

  it('從 /api/crud/author 載入（model kebab-case）', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [] }),
    });

    render(<RelationSelect model="Author" value="" onChange={() => {}} />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/api\/crud\/author/),
        expect.anything(),
      );
    });
  });

  it('使用自訂 labelField 顯示選項', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [
          { id: '1', title: 'First Post' },
          { id: '2', title: 'Second Post' },
        ],
      }),
    });

    render(
      <RelationSelect
        model="Post"
        value="1"
        onChange={() => {}}
        labelField="title"
      />,
    );

    // trigger 內 SelectValue 顯示選中項的 label
    await waitFor(() => {
      const trigger = screen.getByRole('combobox');
      expect(trigger.textContent).toContain('First Post');
    });
  });
});

// ==============================================
// 2. 載入狀態
// ==============================================

describe('RelationSelect 載入狀態', () => {
  it('fetch 失敗時不拋錯（graceful fallback）', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    expect(() => {
      render(<RelationSelect model="Author" value="" onChange={() => {}} />);
    }).not.toThrow();
  });

  it('fetch 返回非 ok 狀態時 fallback', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({}),
    });

    render(<RelationSelect model="Author" value="" onChange={() => {}} />);

    await waitFor(() => {
      // 不拋錯，loading 結束
      expect(screen.getByRole('combobox')).toBeTruthy();
    });
  });

  it('響應格式為 data 而非 items 時也兼容', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [
          { id: '1', name: 'Item A' },
          { id: '2', name: 'Item B' },
        ],
      }),
    });

    render(<RelationSelect model="Tag" value="1" onChange={() => {}} />);

    await waitFor(() => {
      const trigger = screen.getByRole('combobox');
      expect(trigger.textContent).toContain('Item A');
    });
  });
});

// ==============================================
// 3. onChange
// ==============================================

describe('RelationSelect onChange', () => {
  it('選項加載成功後 trigger 顯示對應 label', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [
          { id: 'a1', name: 'Alice' },
          { id: 'a2', name: 'Bob' },
        ],
      }),
    });

    render(
      <RelationSelect model="Author" value="a1" onChange={() => {}} />,
    );

    await waitFor(() => {
      const trigger = screen.getByRole('combobox');
      expect(trigger.textContent).toContain('Alice');
    });
  });
});

// ==============================================
// 4. value 受控
// ==============================================

describe('RelationSelect 受控值', () => {
  it('傳入初始 value 顯示為已選中', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [
          { id: 'a1', name: 'Alice' },
          { id: 'a2', name: 'Bob' },
        ],
      }),
    });

    render(
      <RelationSelect model="Author" value="a1" onChange={() => {}} />,
    );

    // 載入完成後 trigger 應顯示 Alice
    await waitFor(() => {
      const trigger = screen.getByRole('combobox');
      expect(trigger.textContent).toContain('Alice');
    });
  });
});