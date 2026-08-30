/**
 * Sprint 36 — KanbanView Drag-and-Drop 守護測試
 *
 * 設計：
 * - 卡片可拖到其他 column
 * - onDrop 時呼叫 onMove 處理（傳 sourceId + targetGroup）
 * - 樂觀更新由 parent 處理（KanbanView 不直接管 API）
 * - API 失敗由 parent rollback（KanbanView 透過 optimistic update 支援）
 *
 * Gate 1 TDD
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { KanbanView } from '@/app/admin/crud/[spec]/list-views/kanban-view';

// jsdom 不支援 DataTransfer, mock 它供 drag/drop 事件用
class MockDataTransfer {
  data: Record<string, string> = {};
  dropEffect = 'none';
  effectAllowed = 'all';
  setData(type: string, value: string) {
    this.data[type] = value;
  }
  getData(type: string) {
    return this.data[type] ?? '';
  }
  clearData() {
    this.data = {};
  }
}
beforeEach(() => {
  // @ts-expect-error - mock global DataTransfer
  global.DataTransfer = MockDataTransfer;
});

const columns = [
  { name: 'title', label: '標題' },
  { name: 'priority', label: '優先級' },
];

const rows = [
  { id: 'r1', cells: [
    { fieldName: 'title', value: 'Task A', isCheckbox: false, isDate: false },
    { fieldName: 'priority', value: 'high', isCheckbox: false, isDate: false },
  ] },
  { id: 'r2', cells: [
    { fieldName: 'title', value: 'Task B', isCheckbox: false, isDate: false },
    { fieldName: 'priority', value: 'low', isCheckbox: false, isDate: false },
  ] },
];

describe('Sprint 36 — KanbanView drag-and-drop', () => {
  it('卡片標記 draggable=true', () => {
    const { container } = render(
      <KanbanView
        rows={rows}
        columns={columns}
        selectedIds={new Set()}
        onSelectionChange={() => {}}
        renderActions={() => null}
        groupByField="priority"
        primaryField="title"
        onMove={() => {}}
      />,
    );
    // 只 target 卡片本身（排除 -checkbox 等子元素）
    const cards = container.querySelectorAll('[data-testid^="kanban-card-"]');
    cards.forEach((card) => {
      // 只檢查 testid 完全等於 kanban-card-XXX 的元素（沒有 -checkbox 等後缀）
      const testid = card.getAttribute('data-testid') ?? '';
      if (testid.startsWith('kanban-card-') && !testid.slice('kanban-card-'.length).includes('-')) {
        expect(card.getAttribute('draggable')).toBe('true');
      }
    });
  });

  it('卡片有 draggable cursor 樣式', () => {
    const { container } = render(
      <KanbanView
        rows={rows}
        columns={columns}
        selectedIds={new Set()}
        onSelectionChange={() => {}}
        renderActions={() => null}
        groupByField="priority"
        primaryField="title"
        onMove={() => {}}
      />,
    );
    const card = container.querySelector('[data-testid="kanban-card-r1"]') as HTMLElement;
    expect(card.className).toContain('cursor-grab');
  });

  it('拖到新 column → 呼叫 onMove(rowId, targetGroup)', async () => {
    const onMove = vi.fn();
    const { container } = render(
      <KanbanView
        rows={rows}
        columns={columns}
        selectedIds={new Set()}
        onSelectionChange={() => {}}
        renderActions={() => null}
        groupByField="priority"
        primaryField="title"
        onMove={onMove}
      />,
    );

    const sourceCard = container.querySelector('[data-testid="kanban-card-r1"]') as HTMLElement;
    const targetColumn = container.querySelector('[data-testid="kanban-column-low"]') as HTMLElement;

    // 模擬拖曳: dragStart → dragOver → drop
    const dt = new MockDataTransfer();
    fireEvent.dragStart(sourceCard, { dataTransfer: dt });
    fireEvent.dragOver(targetColumn, { dataTransfer: dt });
    fireEvent.drop(targetColumn, { dataTransfer: dt });
    fireEvent.dragEnd(sourceCard);

    expect(onMove).toHaveBeenCalledWith('r1', 'low');
  });

  it('drop zone 有視覺提示 (dashed border)', () => {
    const { container } = render(
      <KanbanView
        rows={rows}
        columns={columns}
        selectedIds={new Set()}
        onSelectionChange={() => {}}
        renderActions={() => null}
        groupByField="priority"
        primaryField="title"
        onMove={() => {}}
      />,
    );
    const targetColumn = container.querySelector('[data-testid="kanban-column-low"]') as HTMLElement;
    // 確保有 drop zone class
    expect(targetColumn.getAttribute('data-droppable')).toBe('true');
  });

  it('column header 顯示筆數', () => {
    const { container } = render(
      <KanbanView
        rows={rows}
        columns={columns}
        selectedIds={new Set()}
        onSelectionChange={() => {}}
        renderActions={() => null}
        groupByField="priority"
        primaryField="title"
        onMove={() => {}}
      />,
    );
    // high: 1 筆, low: 1 筆
    expect(container.querySelector('[data-testid="kanban-column-header-high"]')?.textContent).toContain('1');
    expect(container.querySelector('[data-testid="kanban-column-header-low"]')?.textContent).toContain('1');
  });
});