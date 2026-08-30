/**
 * Sprint E1 — MobileListView 卡片視圖元件測試
 *
 * 設計目標：mobile (< 768px) 上 CRUD 列表頁用卡片佈局，
 * 而不是擠壓的表格。
 *
 * Gate 1 TDD：先寫失敗測試 → 實作 → 通過
 *
 * 注意：用 vanilla DOM API（不用 @testing-library/jest-dom matchers）
 * 跟其他 integration test 一致
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MobileListView } from '@/app/admin/crud/[spec]/mobile-list-view';

type CellDisplay = {
  fieldName: string;
  value: string;
  isCheckbox: boolean;
  isDate: boolean;
};

const columns = [
  { name: 'title', label: '標題' },
  { name: 'completed', label: '已完成' },
  { name: 'priority', label: '優先級' },
  { name: 'dueDate', label: '截止日期' },
];

const rows = [
  {
    id: 'r1',
    cells: [
      { fieldName: 'title', value: '買牛奶', isCheckbox: false, isDate: false },
      { fieldName: 'completed', value: '', isCheckbox: true, isDate: false },
      { fieldName: 'priority', value: 'high', isCheckbox: false, isDate: false },
      { fieldName: 'dueDate', value: '2026-09-01', isCheckbox: false, isDate: true },
    ],
  },
  {
    id: 'r2',
    cells: [
      { fieldName: 'title', value: '寫週報', isCheckbox: false, isDate: false },
      { fieldName: 'completed', value: '✓', isCheckbox: true, isDate: false },
      { fieldName: 'priority', value: 'medium', isCheckbox: false, isDate: false },
      { fieldName: 'dueDate', value: '', isCheckbox: false, isDate: true },
    ],
  },
];

describe('MobileListView', () => {
  it('每個 row 渲染一張 card', () => {
    const { container } = render(
      <MobileListView
        columns={columns}
        rows={rows}
        selectedIds={new Set()}
        onSelectionChange={() => {}}
        renderActions={(id) => <button data-testid={`actions-${id}`}>...</button>}
        specName="todo"
      />,
    );

    expect(screen.getByTestId('mobile-list-view')).toBeTruthy();
    const cards = container.querySelectorAll('[data-testid^="mobile-card-"]:not([data-testid*="-title"]):not([data-testid*="-checkbox"]):not([data-testid*="-completed-mark"]):not([data-testid*="-meta"])');
    expect(cards.length).toBe(2);
  });

  it('primary 欄位顯示為大字體標題', () => {
    const { container } = render(
      <MobileListView
        columns={columns}
        rows={rows}
        selectedIds={new Set()}
        onSelectionChange={() => {}}
        renderActions={() => null}
        specName="todo"
      />,
    );

    const title1 = screen.getByTestId('mobile-card-r1-title');
    expect(title1.textContent).toBe('買牛奶');
    expect(title1.className).toContain('text-base');
    expect(title1.className).toContain('font-medium');
  });

  it('次要欄位顯示為小字 metadata', () => {
    render(
      <MobileListView
        columns={columns}
        rows={rows}
        selectedIds={new Set()}
        onSelectionChange={() => {}}
        renderActions={() => null}
        specName="todo"
      />,
    );

    const meta1 = screen.getByTestId('mobile-card-r1-meta');
    expect(meta1.textContent).toContain('high');
    expect(meta1.textContent).toContain('2026-09-01');
  });

  it('已完成 ✓ 用綠色顯示', () => {
    render(
      <MobileListView
        columns={columns}
        rows={rows}
        selectedIds={new Set()}
        onSelectionChange={() => {}}
        renderActions={() => null}
        specName="todo"
      />,
    );

    // r1 (completed=false) 不顯示 ✓
    expect(screen.queryByTestId('mobile-card-r1-completed-mark')).toBeNull();
    // r2 (completed=true) 顯示 ✓
    const mark = screen.getByTestId('mobile-card-r2-completed-mark');
    expect(mark.textContent).toContain('✓');
    expect(mark.className).toContain('text-green-600');
  });

  it('checkbox 點擊切換 selection', async () => {
    const onSelectionChange = vi.fn();
    const user = userEvent.setup();
    render(
      <MobileListView
        columns={columns}
        rows={rows}
        selectedIds={new Set()}
        onSelectionChange={onSelectionChange}
        renderActions={() => null}
        specName="todo"
      />,
    );

    await user.click(screen.getByTestId('mobile-card-r1-checkbox'));
    expect(onSelectionChange).toHaveBeenCalledWith(new Set(['r1']));
  });

  it('選取的 card 顯示選取樣式 (highlight)', () => {
    render(
      <MobileListView
        columns={columns}
        rows={rows}
        selectedIds={new Set(['r1'])}
        onSelectionChange={() => {}}
        renderActions={() => null}
        specName="todo"
      />,
    );

    const card1 = screen.getByTestId('mobile-card-r1');
    expect(card1.getAttribute('data-selected')).toBe('true');
    expect(card1.className).toMatch(/bg-muted|border-primary/);
  });

  it('操作按鈕透過 renderActions prop 渲染', () => {
    render(
      <MobileListView
        columns={columns}
        rows={rows}
        selectedIds={new Set()}
        onSelectionChange={() => {}}
        renderActions={(id) => <button data-testid={`actions-${id}`}>menu</button>}
        specName="todo"
      />,
    );

    expect(screen.getByTestId('actions-r1')).toBeTruthy();
    expect(screen.getByTestId('actions-r2')).toBeTruthy();
  });

  it('空 rows 時顯示空狀態訊息', () => {
    render(
      <MobileListView
        columns={columns}
        rows={[]}
        selectedIds={new Set()}
        onSelectionChange={() => {}}
        renderActions={() => null}
        specName="todo"
      />,
    );

    const empty = screen.getByTestId('mobile-empty-state');
    expect(empty).toBeTruthy();
    expect(empty.textContent).toMatch(/沒有符合條件|無資料/);
  });

  it('Card 預設包含 overflow-hidden, 防止子元素撐開父容器 (RWD)', () => {
    render(
      <MobileListView
        columns={columns}
        rows={rows}
        selectedIds={new Set()}
        onSelectionChange={() => {}}
        renderActions={() => null}
        specName="todo"
      />,
    );

    const card = screen.getByTestId('mobile-card-r1');
    expect(card.className).toContain('overflow-hidden');
  });

  it('長欄位值超過 maxLength 會被截斷 + 結尾 ... (RWD)', () => {
    const longRows = [
      {
        id: 'long1',
        cells: [
          { fieldName: 'title', value: '長文章標題', isCheckbox: false, isDate: false },
          { fieldName: 'content', value: 'A'.repeat(200), isCheckbox: false, isDate: false },
        ],
      },
    ];
    render(
      <MobileListView
        columns={[{ name: 'title', label: '標題' }, { name: 'content', label: '內容' }]}
        rows={longRows}
        selectedIds={new Set()}
        onSelectionChange={() => {}}
        renderActions={() => null}
        specName="blog"
        maxLength={50}
      />,
    );

    const meta = screen.getByTestId('mobile-card-long1-meta');
    // 200 個 A 應該被截斷成 50 + ...
    expect(meta.textContent).toContain('...');
    // 原始 200 個 A 不應完整出現
    expect(meta.textContent).not.toContain('A'.repeat(100));
  });

  it('短欄位值不截斷 (RWD)', () => {
    render(
      <MobileListView
        columns={[{ name: 'title', label: '標題' }, { name: 'slug', label: 'Slug' }]}
        rows={[{
          id: 'short1',
          cells: [
            { fieldName: 'title', value: '短', isCheckbox: false, isDate: false },
            { fieldName: 'slug', value: 'short-slug', isCheckbox: false, isDate: false },
          ],
        }]}
        selectedIds={new Set()}
        onSelectionChange={() => {}}
        renderActions={() => null}
        specName="blog"
        maxLength={50}
      />,
    );

    const meta = screen.getByTestId('mobile-card-short1-meta');
    expect(meta.textContent).not.toContain('...');
    expect(meta.textContent).toContain('short-slug');
  });

  it('metadata text span 含 min-w-0 + truncate, 可在窄螢幕截斷 (RWD)', () => {
    const { container } = render(
      <MobileListView
        columns={[{ name: 'title', label: '標題' }, { name: 'slug', label: 'Slug（URL 友善識別）' }]}
        rows={[{
          id: 't1',
          cells: [
            { fieldName: 'title', value: 't', isCheckbox: false, isDate: false },
            { fieldName: 'slug', value: 'test-mt7fmnas', isCheckbox: false, isDate: false },
          ],
        }]}
        selectedIds={new Set()}
        onSelectionChange={() => {}}
        renderActions={() => null}
        specName="blog"
      />,
    );

    // 只檢查值 span（含 data-testid），wrapper span 不需 truncate
    const valueSpans = container.querySelectorAll('[data-testid="mobile-card-t1-meta-slug"]');
    expect(valueSpans.length).toBe(1);
    const valueSpan = valueSpans[0] as HTMLElement;
    expect(valueSpan.className).toContain('min-w-0');
    expect(valueSpan.className).toContain('truncate');
  });
});