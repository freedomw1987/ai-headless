/**
 * Sprint 17 Stage 2 — customRenderer 客戶端動態渲染
 *
 * 🅓 設計：
 * - list page 看到 customRenderer field → 渲染 DynamicRendererCell（client component）
 * - DynamicRendererCell 用 dynamic import 載入 extensions/<specName>/custom-renderers/<rendererName>
 * - 載入完成前顯示 Skeleton / placeholder
 * - 載入失敗顯示 fallback
 *
 * 守護測試：
 * 1. DynamicRendererCell 是 'use client' component
 * 2. 用 dynamic import (next/dynamic) 載入 custom-renderer
 * 3. 載入前顯示 placeholder
 * 4. 接收 record / value props
 * 5. 處理載入錯誤
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = process.cwd();
const COMPONENT_PATH = resolve(ROOT, 'components/admin/dynamic-renderer-cell.tsx');
const LIST_PAGE_PATH = resolve(ROOT, 'app/admin/crud/[spec]/page.tsx');

describe('Sprint 17 Stage 2 — customRenderer 客戶端動態渲染', () => {
  describe('DynamicRendererCell 元件', () => {
    it('components/admin/dynamic-renderer-cell.tsx 存在', () => {
      expect(existsSync(COMPONENT_PATH)).toBe(true);
    });

    it('DynamicRendererCell 是 client component（use client directive）', () => {
      const content = readFileSync(COMPONENT_PATH, 'utf-8');
      expect(content).toMatch(/['"]use client['"]/);
    });

    it('DynamicRendererCell 使用 next/dynamic 動態載入', () => {
      const content = readFileSync(COMPONENT_PATH, 'utf-8');
      expect(content).toMatch(/from\s+['"]next\/dynamic['"]/);
      // 或用 import() + useEffect 載入
      const hasDynamic = /next\/dynamic|import\(|useEffect/.test(content);
      expect(hasDynamic).toBe(true);
    });

    it('DynamicRendererCell 接受 specName + rendererName + record props', () => {
      const content = readFileSync(COMPONENT_PATH, 'utf-8');
      expect(content).toMatch(/specName:\s*string/);
      expect(content).toMatch(/rendererName:\s*string/);
      expect(content).toMatch(/record:\s*Record<string,\s*unknown>/);
    });

    it('DynamicRendererCell 處理載入狀態（ssr: false + loading fallback）', () => {
      const content = readFileSync(COMPONENT_PATH, 'utf-8');
      // ssr: false 確保 client only
      expect(content).toMatch(/ssr:\s*false/);
      // 或 useState loading + placeholder
      const hasLoading = /loading|isLoading|placeholder/i.test(content);
      expect(hasLoading).toBe(true);
    });

    it('DynamicRendererCell 處理載入錯誤', () => {
      const content = readFileSync(COMPONENT_PATH, 'utf-8');
      // try/catch 或 error state
      const hasError = /error|catch|Error/i.test(content);
      expect(hasError).toBe(true);
    });
  });

  describe('list page 整合', () => {
    it('list page 用 DynamicRendererCell 渲染 customRenderer field', () => {
      const content = readFileSync(LIST_PAGE_PATH, 'utf-8');
      expect(content).toMatch(/DynamicRendererCell/);
    });

    it('list page 不再用 [capacityBar] placeholder 文字', () => {
      const content = readFileSync(LIST_PAGE_PATH, 'utf-8');
      // 不再有手寫 placeholder 邏輯（Stage 2 改用 DynamicRendererCell）
      expect(content).not.toMatch(/尚.*Sprint.*17.*Stage.*2/);
    });

    it('list page 用 DynamicRendererCell 包裝 customRenderer field', () => {
      const content = readFileSync(LIST_PAGE_PATH, 'utf-8');
      // 在 customRenderer 分支看到 DynamicRendererCell 用法
      expect(content).toMatch(/<DynamicRendererCell/);
    });
  });
});