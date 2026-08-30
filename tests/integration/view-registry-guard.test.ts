/**
 * Sprint 41-3 — View registry 重構守護測試
 *
 * TD-904: View 數量增加時, 改 4 處 (types / schema / ViewRouter / ViewSelector) 太散
 * 改用 registry 統一管理:
 * - VIEW_REGISTRY = { [ViewType]: { Component, Icon, requiredFields, defaultProps } }
 * - 新增 view type 只改 1 處 (registry.ts)
 *
 * Gate 1 TDD：source-code guard
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const FILES = {
  selector: 'app/admin/crud/[spec]/list-views/view-selector.tsx',
  router: 'app/admin/crud/[spec]/list-views/index.tsx',
  registry: 'app/admin/crud/[spec]/list-views/registry.ts',
};

function load(filePath: string): string {
  return readFileSync(filePath, 'utf-8');
}

describe('Sprint 41-3 — TD-904 view registry 重構', () => {
  it('view-selector.tsx 應該用 ICON_MAP 或 registry (不直接 hardcode 每個 view)', () => {
    const source = load(FILES.selector);
    const usesRegistry = /ICON_MAP|VIEW_REGISTRY/.test(source);
    expect(usesRegistry, 'view-selector 沒用 ICON_MAP / VIEW_REGISTRY').toBe(true);
  });

  it('view-selector.tsx 應該 import VIEW_REGISTRY 而非 hardcode 5 個 view type', () => {
    const source = load(FILES.selector);
    // 不再 hardcode 各個 view type 的 if/else
    const hasHardcodedChecks = source.includes("if (view.type === 'table')") ||
      source.includes("if (viewType === 'calendar')");
    expect(!hasHardcodedChecks, 'view-selector 還有 hardcode 檢查 view type').toBe(true);
  });

  it('ViewRouter (list-views/index.tsx) 應該有 ICON_MAP 或 registry 風格', () => {
    const source = load(FILES.router);
    const hasRegistry = /ICON_MAP|VIEW_REGISTRY/.test(source);
    expect(hasRegistry, 'ViewRouter 沒用 registry 風格').toBe(true);
  });

  it('ViewRouter 應該透過 registry 動態選擇 Component (不直接 import 5 個 view)', () => {
    const source = load(FILES.router);
    // 不再 import 5 個 view 元件
    const importCount = (source.match(/^import \{ \w+ \} from '\.\/table-view'/gm) || []).length +
      (source.match(/^import \{ \w+ \} from '\.\/todo-list-view'/gm) || []).length +
      (source.match(/^import \{ \w+ \} from '\.\/kanban-view'/gm) || []).length +
      (source.match(/^import \{ \w+ \} from '\.\/calendar-view'/gm) || []).length +
      (source.match(/^import \{ \w+ \} from '\.\/gallery-view'/gm) || []).length;
    expect(importCount, 'ViewRouter 直接 import view 元件太多 (應從 registry 讀)').toBeLessThanOrEqual(1);
  });

  it('registry.ts 應該有 5 種 view type (table/todo-list/kanban/calendar/gallery)', () => {
    const source = load(FILES.registry);
    for (const t of ['table', 'todo-list', 'kanban', 'calendar', 'gallery']) {
      const hasEntry = new RegExp(`['"]${t}['"]\\s*:`).test(source);
      expect(hasEntry, `registry 缺 '${t}' 條目`).toBe(true);
    }
  });
});
