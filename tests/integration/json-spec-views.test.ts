/**
 * Sprint 33-1 — JsonSpec.views 結構 + schema 守護測試
 *
 * 設計：每個 CRUD list 可定義多個 view 供 AI 開發選擇
 * - type: 'table' | 'todo-list' | 'kanban'
 * - label: 顯示名稱
 * - icon: lucide icon name (optional)
 * - primaryField: 主要顯示欄位 (e.g., title)
 * - secondaryFields: 次要顯示欄位 (e.g., status, createdAt)
 *
 * Gate 1 TDD：先寫失敗測試 → 實作 → 通過
 */

import { describe, it, expect } from 'vitest';
import { jsonSpecSchema } from '@/lib/specs/json-spec.schema';
import type { JsonSpec } from '@/lib/specs/json-spec.types';

describe('Sprint 33-1 — JsonSpec.views 結構', () => {
  it('type 層定義 views 欄位（list.views 可選）', () => {
    // type-level test：確保 JsonSpec 結構允許 views
    // 這個測試主要是 source-code 檢查（因為 TS type 在 runtime 消失）
    const source = require('node:fs').readFileSync(
      'lib/specs/json-spec.types.ts',
      'utf-8',
    );
    expect(source).toMatch(/views\?:\s*View\[\]/);
    // View type 必須定義
    expect(source).toContain('export type View');
  });

  describe('jsonSpecSchema.views 驗證', () => {
    const baseSpec: Partial<JsonSpec> = {
      name: 'test',
      label: 'Test',
      models: [
        {
          name: 'Todo',
          label: 'Todo',
          fields: [
            { name: 'title', label: 'Title', type: 'string' },
            { name: 'completed', label: 'Completed', type: 'boolean' },
          ],
        },
      ],
    };

    it('合法 views array（含 table + todo-list）應該通過', () => {
      const result = jsonSpecSchema.safeParse({
        ...baseSpec,
        ui: {
          pages: {
            list: {
              views: [
                { type: 'table', label: '表格' },
                { type: 'todo-list', label: '待辦清單', primaryField: 'title' },
              ],
            },
          },
        },
      });
      expect(result.success).toBe(true);
    });

    it('沒 views 時應該通過（向後相容 — 預設 TableView）', () => {
      const result = jsonSpecSchema.safeParse({
        ...baseSpec,
        ui: {
          pages: {
            list: {
              // 沒 views 欄位
            },
          },
        },
      });
      expect(result.success).toBe(true);
    });

    it('無效 view type 應該被拒絕', () => {
      const result = jsonSpecSchema.safeParse({
        ...baseSpec,
        ui: {
          pages: {
            list: {
              views: [{ type: 'invalid-view-type', label: 'X' }],
            },
          },
        },
      });
      expect(result.success).toBe(false);
    });

    it('View 必須有 type 跟 label', () => {
      const result = jsonSpecSchema.safeParse({
        ...baseSpec,
        ui: {
          pages: {
            list: {
              views: [{ type: 'table' }], // 缺 label
            },
          },
        },
      });
      expect(result.success).toBe(false);
    });

    it('todo-list view 應可有 primaryField', () => {
      const result = jsonSpecSchema.safeParse({
        ...baseSpec,
        ui: {
          pages: {
            list: {
              views: [
                {
                  type: 'todo-list',
                  label: '待辦清單',
                  primaryField: 'title',
                  secondaryFields: ['completed'],
                },
              ],
            },
          },
        },
      });
      expect(result.success).toBe(true);
    });

    it('kanban view 應需 groupByField', () => {
      const result = jsonSpecSchema.safeParse({
        ...baseSpec,
        ui: {
          pages: {
            list: {
              views: [{ type: 'kanban', label: '看板' }],
            },
          },
        },
      });
      expect(result.success).toBe(false);
    });
  });
});