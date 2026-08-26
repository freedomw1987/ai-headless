/**
 * Sprint 20 Stage 4 — Toast sonner 升級
 *
 * 守護測試：
 * 1. components/ui/toast.tsx 已刪除（徹底改寫，無兼容層）
 * 2. components/ui/toast.test.tsx 已刪除
 * 3. 使用 sonner Toaster（components/ui/sonner.tsx 或直接用 sonner）
 * 4. app/layout.tsx 引入 Toaster（與 ThemeProvider 同級）
 * 5. 所有呼叫端改用 sonner toast
 * 6. 無 useToast / ToastProvider 殘留
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = resolve(__dirname, '..', '..');
const TOAST_PATH = resolve(ROOT, 'components', 'ui', 'toast.tsx');
const TOAST_TEST_PATH = resolve(ROOT, 'components', 'ui', 'toast.test.tsx');
const SONNER_PATH = resolve(ROOT, 'components', 'ui', 'sonner.tsx');
const LAYOUT_PATH = resolve(ROOT, 'app', 'layout.tsx');
const PACKAGE_PATH = resolve(ROOT, 'package.json');
const EXTENSIONS_PAGE_PATH = resolve(ROOT, 'app', 'admin', 'extensions', 'extensions-page-client.tsx');
const EXTENSION_CARD_PATH = resolve(ROOT, 'components', 'admin', 'extension-card.tsx');

describe('Sprint 20 Stage 4 — Toast sonner 升級', () => {
  describe('Stage 4-A — 舊 toast.tsx 已刪除（徹底改寫，無兼容層）', () => {
    it('components/ui/toast.tsx 已刪除', () => {
      expect(existsSync(TOAST_PATH)).toBe(false);
    });

    it('components/ui/toast.test.tsx 已刪除', () => {
      expect(existsSync(TOAST_TEST_PATH)).toBe(false);
    });

    it('專案內無 useToast hook 殘留（grep）', () => {
      // 排除 tests/ 目錄（守護測試本身含字串）+ node_modules
      const result = execSync(
        `grep -rln "useToast\\|ToastProvider" ${ROOT}/app ${ROOT}/lib ${ROOT}/components --exclude-dir=node_modules 2>/dev/null | grep -v "${ROOT}/tests" | grep -v "${ROOT}/components/ui/sonner.tsx" | grep -v "${ROOT}/components/ui/toast.test.tsx" || true`,
        { encoding: 'utf-8' },
      );
      expect(result.trim()).toBe('');
    });

    it('專案內無 import from toast.tsx 殘留（grep）', () => {
      const result = execSync(
        `grep -rln "from ['\\"]@/components/ui/toast['\\"]" ${ROOT}/app ${ROOT}/lib ${ROOT}/components --exclude-dir=node_modules 2>/dev/null | grep -v "${ROOT}/tests" || true`,
        { encoding: 'utf-8' },
      );
      expect(result.trim()).toBe('');
    });
  });

  describe('Stage 4-B — sonner Toaster 整合', () => {
    it('components/ui/sonner.tsx 存在（包裝 sonner Toaster）', () => {
      expect(existsSync(SONNER_PATH)).toBe(true);
    });

    it('sonner.tsx 使用 sonner 的 Toaster', () => {
      const content = readFileSync(SONNER_PATH, 'utf-8');
      expect(content).toMatch(/from\s+['"]sonner['"]/);
      expect(content).toMatch(/Toaster/);
    });

    it('sonner.tsx 是 Client Component（"use client"）', () => {
      const content = readFileSync(SONNER_PATH, 'utf-8');
      expect(content).toMatch(/^['"]use client['"]/m);
    });

    it('app/layout.tsx 引入 Toaster（與 ThemeProvider 同級）', () => {
      const content = readFileSync(LAYOUT_PATH, 'utf-8');
      expect(content).toMatch(/from\s+['"]@\/components\/ui\/sonner['"]/);
      expect(content).toMatch(/<Toaster/);
    });

    it('Toaster 在 ThemeProvider 內（children 同級）', () => {
      const content = readFileSync(LAYOUT_PATH, 'utf-8');
      // Toaster 應在 ThemeProvider 開標籤後、children 之後
      const themeStart = content.indexOf('<ThemeProvider');
      const toasterIdx = content.indexOf('<Toaster');
      expect(themeStart).toBeGreaterThan(-1);
      expect(toasterIdx).toBeGreaterThan(themeStart);
    });

    // P1 — Reviewer 提：sonner 預設 theme="light"，dark mode 切換後 toast 仍淺色
    it('sonner.tsx 傳遞 theme prop 給 SonnerToaster（整合 next-themes）', () => {
      const content = readFileSync(SONNER_PATH, 'utf-8');
      expect(content).toMatch(/useTheme/);
      // theme prop 應動態帶入（不是 hardcoded）
      expect(content).toMatch(/theme\s*=\s*\{[^}]*theme/);
    });
  });

  describe('Stage 4-C — 呼叫端改用 sonner toast', () => {
    it('extension-card.tsx 使用 sonner 的 toast（不是 useToast）', () => {
      const content = readFileSync(EXTENSION_CARD_PATH, 'utf-8');
      expect(content).toMatch(/from\s+['"]sonner['"]/);
      expect(content).toMatch(/toast\.(success|error|info|warning|message)/);
      expect(content).not.toMatch(/useToast/);
    });

    it('extensions-page-client.tsx 不再 import ToastProvider', () => {
      const content = readFileSync(EXTENSIONS_PAGE_PATH, 'utf-8');
      expect(content).not.toMatch(/ToastProvider/);
      expect(content).not.toMatch(/@\/components\/ui\/toast/);
    });
  });

  describe('Stage 4-D — sonner 已安裝', () => {
    it('package.json 有 sonner 依賴', () => {
      const content = readFileSync(PACKAGE_PATH, 'utf-8');
      expect(content).toMatch(/["']sonner["']\s*:/);
    });
  });
});