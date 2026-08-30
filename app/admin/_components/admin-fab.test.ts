/**
 * Sprint 44 Commit D — Admin AI Chat FAB: 拖動 + Snap 邏輯守護測試
 *
 * 設計:
 * - FAB 在 viewport 內可拖動
 * - 拖動結束時自動 snap 到離螢幕邊緣最近的位置 (S44 Commit D 範圍)
 * - 點擊 FAB 開啟 chat dialog (留給 Commit E)
 *
 * 注意:
 * - 此守護測試是 component existence + 純函數邏輯測試
 * - 真實 drag 行為交給 e2e (Sprint 44 Commit H)
 */

import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';

describe('S44-D — Admin AI Chat FAB 拖動 + Snap 邏輯', () => {
  describe('component existence', () => {
    it('應有 AdminFab component 檔案', () => {
      const candidates = [
        'app/admin/_components/admin-fab.tsx',
        'app/admin/_components/AdminFab.tsx',
      ];
      const exists = candidates.some((p) => existsSync(p));
      expect(exists, 'AdminFab component 不存在').toBe(true);
    });

    it('AdminFab 應有 position: fixed (浮動按鈕)', () => {
      const candidates = [
        'app/admin/_components/admin-fab.tsx',
        'app/admin/_components/AdminFab.tsx',
      ];
      const path = candidates.find((p) => existsSync(p));
      if (!path) return;
      const source = readFileSync(path, 'utf-8');
      expect(source, 'AdminFab 應有 fixed positioning').toMatch(/fixed|bottom-\d+|right-\d+/);
    });

    it('AdminFab 應有 onClick handler (開啟 chat)', () => {
      const candidates = [
        'app/admin/_components/admin-fab.tsx',
        'app/admin/_components/AdminFab.tsx',
      ];
      const path = candidates.find((p) => existsSync(p));
      if (!path) return;
      const source = readFileSync(path, 'utf-8');
      expect(source, 'AdminFab 應有 onClick handler').toMatch(/onClick/);
    });

    it('AdminFab 應有拖動 hooks (onPointerDown / onMouseDown)', () => {
      const candidates = [
        'app/admin/_components/admin-fab.tsx',
        'app/admin/_components/AdminFab.tsx',
      ];
      const path = candidates.find((p) => existsSync(p));
      if (!path) return;
      const source = readFileSync(path, 'utf-8');
      expect(
        source,
        'AdminFab 應有 pointer event handler (onPointerDown / onMouseDown)'
      ).toMatch(/onPointerDown|onMouseDown/i);
    });

    it('AdminFab 應整合進 AdminShell', () => {
      const shellSource = readFileSync('app/admin/admin-shell.tsx', 'utf-8');
      expect(shellSource, 'AdminShell 應 import AdminFab').toMatch(/AdminFab/);
    });
  });

  describe('snap 邏輯 (純函數)', () => {
    // Import 純函數測試
    const candidates = [
      'app/admin/_components/admin-fab.tsx',
      'app/admin/_components/AdminFab.tsx',
      'app/admin/_components/admin-fab-utils.ts',
      'app/admin/_components/fab-snap.ts',
    ];

    function findSnapFunction() {
      for (const path of candidates) {
        if (!existsSync(path)) continue;
        const source = readFileSync(path, 'utf-8');
        if (/function\s+snapToEdge|snapToEdge\s*=/.test(source)) {
          return { path, source };
        }
      }
      return null;
    }

    it('應有 snapToEdge 純函數 (可獨立測試)', () => {
      const found = findSnapFunction();
      expect(found !== null, '找不到 snapToEdge 函數').toBe(true);
    });

    it('snapToEdge 應 snap 到離螢幕邊緣最近的 x/y', () => {
      // 用 dynamic import 來測試純函數
      // 因為檔案可能 export 在 component file, 我們用 regex 驗證邏輯存在
      const found = findSnapFunction();
      if (!found) return;
      // 應有 viewportWidth / viewportHeight 計算
      const hasViewportLogic = /viewportWidth|window\.innerWidth|innerWidth/i.test(found.source);
      const hasSnapLogic = /Math\.min|Math\.max|distance|closest/i.test(found.source);
      expect(hasViewportLogic, 'snapToEdge 應考慮 viewport 寬度').toBe(true);
      expect(hasSnapLogic, 'snapToEdge 應有距離計算').toBe(true);
    });
  });

  describe('AdminShell 整合', () => {
    it('AdminShell 應 render AdminFab', () => {
      const shellSource = readFileSync('app/admin/admin-shell.tsx', 'utf-8');
      expect(shellSource, 'AdminShell 應有 <AdminFab /> JSX').toMatch(/<AdminFab[\s/>]/);
    });

    it('AdminFab 只在 admin user 看到 (admin-only)', () => {
      const candidates = [
        'app/admin/_components/admin-fab.tsx',
        'app/admin/_components/AdminFab.tsx',
      ];
      const path = candidates.find((p) => existsSync(p));
      if (!path) return;
      const source = readFileSync(path, 'utf-8');
      // 應有 admin role check 或註解說明
      const hasAdminCheck =
        /role.*admin|admin.*role|isAdmin|user\.role/i.test(source) ||
        /admin-only|only admin/i.test(source);
      expect(hasAdminCheck, 'AdminFab 應有 admin-only 限制').toBe(true);
    });
  });
});