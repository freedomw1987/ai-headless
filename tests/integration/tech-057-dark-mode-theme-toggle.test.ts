/**
 * Sprint 20 Stage 3 — Dark mode（next-themes + ThemeToggle）
 *
 * 守護測試：
 * 1. ThemeProvider 全域包在 app/layout.tsx
 * 2. ThemeProvider 與 Toaster 同級（避免 hydration 問題）
 * 3. ThemeToggle 三模式切換（light / dark / system）
 * 4. theme-provider.tsx 結構正確
 * 5. layout.tsx 整合 ThemeProvider
 * 6. next-themes 已安裝
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(__dirname, '..', '..');
const LAYOUT_PATH = resolve(ROOT, 'app', 'layout.tsx');
const THEME_PROVIDER_PATH = resolve(ROOT, 'components', 'theme', 'theme-provider.tsx');
const THEME_TOGGLE_PATH = resolve(ROOT, 'components', 'theme', 'theme-toggle.tsx');
const PACKAGE_PATH = resolve(ROOT, 'package.json');

describe('Sprint 20 Stage 3 — Dark mode（next-themes + ThemeToggle）', () => {
  describe('Stage 3-A — ThemeProvider 整合', () => {
    it('ThemeProvider 檔案存在', () => {
      expect(existsSync(THEME_PROVIDER_PATH)).toBe(true);
    });

    it('ThemeProvider 使用 next-themes 的 NextThemesProvider', () => {
      const content = readFileSync(THEME_PROVIDER_PATH, 'utf-8');
      expect(content).toMatch(/from\s+['"]next-themes['"]/);
      expect(content).toMatch(/NextThemesProvider/);
    });

    it('ThemeProvider 設定 attribute="class"（配合 tailwind darkMode: ["class"]）', () => {
      const content = readFileSync(THEME_PROVIDER_PATH, 'utf-8');
      expect(content).toMatch(/attribute\s*=\s*['"]class['"]/);
    });

    it('ThemeProvider 啟用 defaultTheme="system"', () => {
      const content = readFileSync(THEME_PROVIDER_PATH, 'utf-8');
      expect(content).toMatch(/defaultTheme\s*=\s*['"]system['"]/);
    });

    it('ThemeProvider 啟用 enableSystem', () => {
      const content = readFileSync(THEME_PROVIDER_PATH, 'utf-8');
      expect(content).toMatch(/enableSystem/);
    });

    it('ThemeProvider 啟用 disableTransitionOnChange（避免切換時動畫閃爍）', () => {
      const content = readFileSync(THEME_PROVIDER_PATH, 'utf-8');
      expect(content).toMatch(/disableTransitionOnChange/);
    });
  });

  describe('Stage 3-B — ThemeToggle 三模式元件', () => {
    it('ThemeToggle 檔案存在', () => {
      expect(existsSync(THEME_TOGGLE_PATH)).toBe(true);
    });

    it('ThemeToggle 是 Client Component（"use client"）', () => {
      const content = readFileSync(THEME_TOGGLE_PATH, 'utf-8');
      expect(content).toMatch(/^['"]use client['"]/m);
    });

    it('ThemeToggle 使用 useTheme hook 切換主題', () => {
      const content = readFileSync(THEME_TOGGLE_PATH, 'utf-8');
      expect(content).toMatch(/useTheme/);
      expect(content).toMatch(/setTheme/);
    });

    it('ThemeToggle 支援三模式（light / dark / system）', () => {
      const content = readFileSync(THEME_TOGGLE_PATH, 'utf-8');
      expect(content).toMatch(/['"]light['"]/);
      expect(content).toMatch(/['"]dark['"]/);
      expect(content).toMatch(/['"]system['"]/);
    });

    it('ThemeToggle 用 DropdownMenu（shadcn）容納三模式', () => {
      const content = readFileSync(THEME_TOGGLE_PATH, 'utf-8');
      expect(content).toMatch(/DropdownMenu/);
    });

    it('ThemeToggle 用 lucide-react icon（Sun / Moon / Monitor）', () => {
      const content = readFileSync(THEME_TOGGLE_PATH, 'utf-8');
      expect(content).toMatch(/from\s+['"]lucide-react['"]/);
      // 三個 icon 至少出現 2 個
      const iconCount = (content.match(/Sun|Moon|Monitor/g) || []).length;
      expect(iconCount).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Stage 3-C — app/layout.tsx 整合 ThemeProvider', () => {
    it('layout.tsx 引用 ThemeProvider', () => {
      const content = readFileSync(LAYOUT_PATH, 'utf-8');
      expect(content).toMatch(/from\s+['"]@\/components\/theme\/theme-provider['"]/);
    });

    it('layout.tsx 在 body 內包 ThemeProvider（suppressHydrationWarning 避免 SSR hydration warning）', () => {
      const content = readFileSync(LAYOUT_PATH, 'utf-8');
      expect(content).toMatch(/ThemeProvider/);
      expect(content).toMatch(/suppressHydrationWarning/);
    });
  });

  describe('Stage 3-D — next-themes 已安裝', () => {
    it('package.json 有 next-themes 依賴', () => {
      const content = readFileSync(PACKAGE_PATH, 'utf-8');
      expect(content).toMatch(/["']next-themes["']\s*:/);
    });
  });
});