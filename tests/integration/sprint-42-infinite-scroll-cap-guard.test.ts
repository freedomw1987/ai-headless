/**
 * Sprint 42 Commit B — TD-805 Infinite scroll page cap 守護
 *
 * 守護 self-DoS 風險:
 * - user 不斷 scroll → page 變大 → server 每次 render 都 query page N
 * - 雖然現有架構是 server re-render (非 Promise.all), 但 page=100, 200 仍可拖慢系統
 *
 * 修法:
 * - lib/runtime/dynamic-handler.ts 加 MAX_PAGE = 50 server-side cap
 * - app/admin/crud/[spec]/infinite-scroll-trigger.tsx 加 client-side 顯示「已達上限」
 *
 * Gate 1 TDD: source-code guard + behavior test 雙重守護
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const HANDLER_PATH = 'lib/runtime/dynamic-handler.ts';
const TRIGGER_PATH = 'app/admin/crud/[spec]/infinite-scroll-trigger.tsx';

describe('Sprint 42 Commit B — TD-805 server-side page cap', () => {
  it('dynamic-handler.ts 應有 MAX_PAGE 守護常數', () => {
    const source = readFileSync(HANDLER_PATH, 'utf-8');
    expect(source, '找不到 MAX_PAGE 常數').toMatch(/MAX_PAGE\s*=\s*\d+/);
  });

  it('dynamic-handler.ts list handler 應 clamp page 超過 MAX_PAGE 的情況', () => {
    const source = readFileSync(HANDLER_PATH, 'utf-8');
    // 應有邏輯：當 page 超過 MAX_PAGE，clamp 或 return empty
    // 兩種合法 pattern:
    // (A) page = Math.min(page, MAX_PAGE)
    // (B) if (page > MAX_PAGE) return { items: [], total: 0, ... }
    const hasClampOrGuard =
      /page\s*=\s*Math\.min\(page\s*,\s*MAX_PAGE\)/.test(source) ||
      /page\s*>\s*MAX_PAGE/.test(source);
    expect(hasClampOrGuard, 'page 超過 MAX_PAGE 沒做 clamp 或 guard').toBe(true);
  });

  it('dynamic-handler.ts 應有 TD-805 標示註解', () => {
    const source = readFileSync(HANDLER_PATH, 'utf-8');
    expect(source, '缺 TD-805 守護標示').toMatch(/TD-805/);
  });
});

describe('Sprint 42 Commit B — TD-805 client-side UI 提示', () => {
  it('InfiniteScrollTrigger 應有「已達上限」UI 訊息', () => {
    const source = readFileSync(TRIGGER_PATH, 'utf-8');
    // 應有 prop 或內部邏輯處理 maxPageCap
    const hasCapAwareness =
      /maxPageCap/.test(source) ||
      /已達上限|已超過|上限/.test(source);
    expect(hasCapAwareness, 'InfiniteScrollTrigger 沒處理 page cap UI').toBe(true);
  });
});