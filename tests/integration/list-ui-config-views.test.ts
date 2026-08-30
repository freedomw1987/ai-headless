/**
 * Sprint 33-2 — buildListUIConfig 支援多 view 守護測試
 *
 * 設計：
 * - spec.ui.pages.list.views 定義多個 view
 * - 沒定義時 fallback 為 [{type:'table'}]（向後相容）
 * - buildListUIConfig 把 views array 帶到 ListUIConfig.views
 *
 * Gate 1 TDD
 */

import { describe, it, expect } from 'vitest';
import { buildListUIConfig } from '@/lib/runtime/ui-config';
import type { JsonSpec } from '@/lib/specs/json-spec.types';

const baseSpec: JsonSpec = {
  name: 'todo',
  label: 'Todo',
  models: [
    {
      name: 'Todo',
      label: 'Todo',
      fields: [
        { name: 'title', label: '標題', type: 'string' },
        { name: 'completed', label: '完成', type: 'boolean' },
      ],
    },
  ],
};

describe('Sprint 33-2 — buildListUIConfig.views', () => {
  it('沒 views 定義時，預設為 [{type:"table", label:"表格"}]', () => {
    const config = buildListUIConfig(baseSpec);
    expect(config.views).toEqual([{ type: 'table', label: '表格' }]);
  });

  it('spec.views 定義時，傳遞到 config.views', () => {
    const spec: JsonSpec = {
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
    };
    const config = buildListUIConfig(spec);
    expect(config.views).toEqual([
      { type: 'table', label: '表格' },
      { type: 'todo-list', label: '待辦清單', primaryField: 'title' },
    ]);
  });

  it('default:true 仍傳遞', () => {
    const spec: JsonSpec = {
      ...baseSpec,
      ui: {
        pages: {
          list: {
            views: [
              { type: 'table', label: '表格' },
              { type: 'todo-list', label: '待辦', default: true },
            ],
          },
        },
      },
    };
    const config = buildListUIConfig(spec);
    expect(config.views?.[1]?.default).toBe(true);
  });

  it('kanban view 帶 groupByField', () => {
    const spec: JsonSpec = {
      ...baseSpec,
      ui: {
        pages: {
          list: {
            views: [
              { type: 'kanban', label: '看板', groupByField: 'completed' },
            ],
          },
        },
      },
    };
    const config = buildListUIConfig(spec);
    expect(config.views?.[0]).toMatchObject({
      type: 'kanban',
      groupByField: 'completed',
    });
  });
});