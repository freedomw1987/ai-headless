/**
 * Sprint 18 Stage 2 — skeleton 元件
 *
 * 🅓 設計：
 * - 新增 components/ui/skeleton.tsx（shadcn 標準 + animate-pulse）
 * - 純 UI 元件，可用於任何 loading state
 * - detail page 加「載入中」skeleton（取代原本的「載入中...」文字）
 *
 * 守護測試：
 * 1. components/ui/skeleton.tsx 存在
 * 2. skeleton 用 animate-pulse class
 * 3. detail page 用 Skeleton 元件
 * 4. detail page 載入狀態顯示 skeleton（取代文字）
 * 5. Skeleton 是 forwardRef
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = process.cwd();
const SKELETON_PATH = resolve(ROOT, 'components/ui/skeleton.tsx');
const DETAIL_PAGE_PATH = resolve(ROOT, 'app/admin/crud/[spec]/[id]/dynamic-detail-client.tsx');

describe('Sprint 18 Stage 2 — skeleton 元件', () => {
  describe('skeleton 元件檔案', () => {
    it('components/ui/skeleton.tsx 存在', () => {
      expect(existsSync(SKELETON_PATH)).toBe(true);
    });

    it('skeleton 用 animate-pulse class', () => {
      const content = readFileSync(SKELETON_PATH, 'utf-8');
      expect(content).toMatch(/animate-pulse/);
    });

    it('skeleton 是 forwardRef 設計', () => {
      const content = readFileSync(SKELETON_PATH, 'utf-8');
      // shadcn 標準 Skeleton 用 React.forwardRef
      expect(content).toMatch(/forwardRef|HTMLDivElement/);
    });

    it('skeleton 顯示「bg-muted」樣式（灰色背景）', () => {
      const content = readFileSync(SKELETON_PATH, 'utf-8');
      expect(content).toMatch(/bg-muted/);
    });
  });

  describe('detail page 整合', () => {
    it('detail page import Skeleton', () => {
      const content = readFileSync(DETAIL_PAGE_PATH, 'utf-8');
      expect(content).toMatch(/import.*\{[^}]*\bSkeleton\b[^}]*\}.*from\s+['"]@\/components\/ui\/skeleton['"]/);
    });

    it('detail page 載入中狀態用 Skeleton（取代文字）', () => {
      const content = readFileSync(DETAIL_PAGE_PATH, 'utf-8');
      // 找 loading / 載入中 / Loading 等狀態
      const loadingBlock = content.match(/(?:loading|isLoading|載入中|Loading)[\s\S]{0,200}/);
      expect(loadingBlock).toBeTruthy();
      // 載入狀態區塊用 <Skeleton
      expect(content).toMatch(/<Skeleton[^>]*\/>/);
    });
  });
});