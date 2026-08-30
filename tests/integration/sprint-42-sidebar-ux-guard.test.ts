/**
 * Sprint 42 Commit C — Sidebar UX 守護 (TD-808/809/810 + TD-815 改寫)
 *
 * 修法:
 * - TD-808: 手機 sidebar Escape 鍵 listener
 * - TD-809: body scroll lock + route-change auto-close
 * - TD-810: backdrop <button> → <div role="presentation"> (避免 keyboard user 必須 Tab 才能關)
 * - TD-815: 改寫 sprint-41-sidebar-close.spec.ts 的強斷言守護真實功能
 *
 * Gate 1 TDD: source-code guard + behavior test 雙重守護
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const SIDEBAR_PATH = 'app/admin/admin-sidebar.tsx';
const E2E_SPEC_PATH = 'tests/e2e/sprint-41-sidebar-close.spec.ts';

describe('Sprint 42 Commit C — TD-808 Escape 鍵關閉 sidebar', () => {
  it('admin-sidebar.tsx 應有 Escape 鍵 listener', () => {
    const source = readFileSync(SIDEBAR_PATH, 'utf-8');
    // 應有 useEffect 內監聽 keydown event 並檢查 Escape 鍵
    const hasEscapeHandler = /addEventListener\(['"]keydown['"]/.test(source) ||
      /key\s*===?\s*['"]Escape['"]/.test(source);
    expect(hasEscapeHandler, 'admin-sidebar 沒處理 Escape 鍵').toBe(true);
  });

  it('admin-sidebar.tsx 應有 TD-808 標示註解', () => {
    const source = readFileSync(SIDEBAR_PATH, 'utf-8');
    expect(source, '缺 TD-808 標示').toMatch(/TD-808/);
  });
});

describe('Sprint 42 Commit C — TD-809 body scroll lock + route auto-close', () => {
  it('admin-sidebar.tsx 應有 body overflow 切換邏輯', () => {
    const source = readFileSync(SIDEBAR_PATH, 'utf-8');
    // 應有 document.body.style.overflow = 'hidden' 或類似 pattern
    const hasScrollLock = /document\.body\.style\.overflow/.test(source);
    expect(hasScrollLock, 'admin-sidebar 沒做 body scroll lock').toBe(true);
  });

  it('admin-sidebar.tsx 應有 route-change auto-close 邏輯', () => {
    const source = readFileSync(SIDEBAR_PATH, 'utf-8');
    // usePathname + useEffect 監聽 pathname 變化 → 關 sidebar
    // 標記: 應在 useEffect 內依賴 pathname 然後呼叫 onMobileOpenChange(false)
    const hasRouteClose = /pathname[\s\S]{0,300}onMobileOpenChange\s*\(\s*false\s*\)/m.test(source);
    expect(hasRouteClose, 'admin-sidebar 沒做 route-change auto-close').toBe(true);
  });

  it('admin-sidebar.tsx 應有 TD-809 標示註解', () => {
    const source = readFileSync(SIDEBAR_PATH, 'utf-8');
    expect(source, '缺 TD-809 標示').toMatch(/TD-809/);
  });
});

describe('Sprint 42 Commit C — TD-810 backdrop accessibility', () => {
  it('backdrop 應為 <div role="presentation"> 而非 <button>', () => {
    const source = readFileSync(SIDEBAR_PATH, 'utf-8');
    // 找 backdrop 區塊: data-testid="mobile-backdrop"
    const idx = source.indexOf('mobile-backdrop');
    expect(idx, '找不到 mobile-backdrop').toBeGreaterThan(-1);
    if (idx < 0) return;

    // 從 backdrop 往前找最近的 tag 開頭 (往回找最近的 <)
    const before = source.substring(0, idx);
    const lastOpen = before.lastIndexOf('<');
    if (lastOpen < 0) return;

    const tag = source.substring(lastOpen, lastOpen + 50);
    // 應為 <div (不是 <button)
    expect(tag.startsWith('<div'), `backdrop 應為 <div role="presentation">, 實際為 ${tag.substring(0, 20)}...`).toBe(true);
  });

  it('admin-sidebar.tsx 應有 TD-810 標示註解', () => {
    const source = readFileSync(SIDEBAR_PATH, 'utf-8');
    expect(source, '缺 TD-810 標示').toMatch(/TD-810/);
  });
});

describe('Sprint 42 Commit C — TD-815 改寫強斷言', () => {
  it('sprint-41-sidebar-close.spec.ts 應檢查 sidebar 真實關閉狀態（不只是 transform != none）', () => {
    const source = readFileSync(E2E_SPEC_PATH, 'utf-8');
    // 偽守護: expect(transform).not.toBe('none')
    // 強守護: 應檢查 isMobileOpen 內部狀態或 visibility / aria
    // 例如: expect(sidebar).not.toBeVisible() 或 expect(getComputedStyle(sidebar).transform).toMatch(/translate-x-full|translateX\(-100/)
    const hasWeakAssertion = /expect\(transform\)\.not\.toBe\(['"]none['"]\)/.test(source);
    expect(!hasWeakAssertion, 'E2E 還在用弱斷言 (transform != none), TD-815 沒改寫').toBe(true);
  });
});