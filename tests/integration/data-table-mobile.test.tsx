/**
 * TDD Gate 1 — Sprint 32 commit 3
 * DataTable 手機 RWD (overflow-x-auto)
 *
 * 對應 PRD: docs/specs/extension-spec.md
 * 對應 Backlog: Sprint 32 Plan Gate
 *
 * 問題:
 * - DataTable 表格無 overflow-x-auto 包裹
 * - 手機 (< 640px) 表格寬度超過 viewport
 * - 表格欄被擠壓,字串截斷
 *
 * 修正:
 * - 在 Table 外層加 <div className="overflow-x-auto">
 * - 桌面不受影響 (overflow-x 預設 visible)
 * - 手機可橫向滑動
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DataTable } from '@/components/admin/data-table';

type Row = { id: string; name: string };

describe('Sprint 32 commit 3 — DataTable 手機 RWD', () => {
  it('DataTable 渲染時可橫向滑動 (shadcn Table 已含 overflow-auto 或自訂 wrapper)', () => {
    const data: Row[] = [
      { id: '1', name: 'Test' },
    ];
    render(
      <DataTable
        data={data}
        columns={[
          { key: 'id', header: 'ID' },
          { key: 'name', header: 'Name' },
        ]}
      />,
    );

    // 檢查 DataTable 結構 (Card → CardContent → 有 overflow class)
    const table = screen.getByRole('table');
    expect(table).toBeTruthy();

    // 找 table 的祖先鏈,確認有 overflow-auto 或 overflow-x-auto
    let el: HTMLElement | null = table.parentElement;
    let hasOverflow = false;
    while (el) {
      if (el.className && /overflow-(x-)?auto/.test(el.className)) {
        hasOverflow = true;
        break;
      }
      el = el.parentElement;
    }
    expect(hasOverflow).toBe(true);
  });
});