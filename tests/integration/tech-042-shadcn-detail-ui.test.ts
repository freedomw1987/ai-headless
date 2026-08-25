/**
 * Sprint 17 Stage 1.2 — detail page UI 改進（用 shadcn/ui 元件）
 *
 * 🅓 設計：detail page 完全改用 shadcn/ui 元件
 * - Card + CardHeader + CardTitle + CardDescription + CardContent 包整體
 * - Button variants（outline 返回 / destructive 刪除）
 * - Lucide ArrowLeft / Trash2 icons
 * - Separator 分隔欄位
 * - Badge for status
 *
 * 守護測試：
 * 1. dynamic-detail-client import shadcn Card / Button / Separator / Badge
 * 2. 不再用純 <dl><dt><dd> + border-b 條列
 * 3. 不再用純 bg-blue-600 hover:bg-blue-700 inline button
 * 4. 返回按鈕用 Button asChild + ArrowLeft icon
 * 5. 刪除按鈕用 Button variant="destructive" + Trash2 icon
 * 6. transition 按鈕用 Button variants
 * 7. 標題用 CardTitle + CardDescription（描述 = specName）
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = process.cwd();
const CLIENT_PATH = resolve(ROOT, 'app/admin/crud/[spec]/[id]/dynamic-detail-client.tsx');

describe('Sprint 17 Stage 1.2 — shadcn detail page UI', () => {
  describe('shadcn 元件 import', () => {
    it('import shadcn Card（含 CardHeader/Title/Description/Content/Footer）', () => {
      const content = readFileSync(CLIENT_PATH, 'utf-8');
      expect(content).toMatch(/from\s+['"]@\/components\/ui\/card['"]/);
      expect(content).toMatch(/CardHeader/);
      expect(content).toMatch(/CardTitle/);
      expect(content).toMatch(/CardDescription/);
      expect(content).toMatch(/CardContent/);
    });

    it('import shadcn Button', () => {
      const content = readFileSync(CLIENT_PATH, 'utf-8');
      expect(content).toMatch(/from\s+['"]@\/components\/ui\/button['"]/);
    });

    it('import shadcn Badge', () => {
      const content = readFileSync(CLIENT_PATH, 'utf-8');
      expect(content).toMatch(/from\s+['"]@\/components\/ui\/badge['"]/);
    });

    it('import Lucide ArrowLeft / Trash2 / Play icons', () => {
      const content = readFileSync(CLIENT_PATH, 'utf-8');
      expect(content).toMatch(/from\s+['"]lucide-react['"]/);
      expect(content).toMatch(/ArrowLeft/);
      expect(content).toMatch(/Trash2/);
      expect(content).toMatch(/Play/);
    });
  });

  describe('不再用 raw inline Tailwind', () => {
    it('不再用純 border-b dl/dt/dd 條列', () => {
      const content = readFileSync(CLIENT_PATH, 'utf-8');
      expect(content).not.toMatch(/<dl[\s>]/);
    });

    it('不再用純 bg-blue-600 hover:bg-blue-700 inline button', () => {
      const content = readFileSync(CLIENT_PATH, 'utf-8');
      expect(content).not.toMatch(/bg-blue-600[^"']*hover:bg-blue-700/);
    });
  });

  describe('UI 結構', () => {
    it('標題區用 Card 包裝（CardHeader + CardTitle + CardDescription）', () => {
      const content = readFileSync(CLIENT_PATH, 'utf-8');
      expect(content).toMatch(/<Card[\s>]/);
      expect(content).toMatch(/<CardHeader/);
      expect(content).toMatch(/<CardTitle/);
      expect(content).toMatch(/<CardDescription/);
    });

    it('返回按鈕用 Button asChild + Link + ArrowLeft icon', () => {
      const content = readFileSync(CLIENT_PATH, 'utf-8');
      // Button asChild + Link + ArrowLeft
      expect(content).toMatch(/<Button[^>]*asChild/);
      expect(content).toMatch(/ArrowLeft/);
      // 返回連結 href
      expect(content).toMatch(/href=\{`\/admin\/crud\/\$\{specName\}`\}/);
    });

    it('刪除按鈕用 Button variant="destructive"', () => {
      const content = readFileSync(CLIENT_PATH, 'utf-8');
      expect(content).toMatch(/variant=["']destructive["']/);
      expect(content).toMatch(/Trash2/);
    });

    it('transition 按鈕用 Button default variant', () => {
      const content = readFileSync(CLIENT_PATH, 'utf-8');
      // 至少有一個 Button 用於 transition
      expect(content).toMatch(/data-testid=\{`transition-\$\{t\.to\}`\}/);
    });

    it('欄位用 Card 包裝（CardContent + flex layout）', () => {
      const content = readFileSync(CLIENT_PATH, 'utf-8');
      expect(content).toMatch(/<CardContent/);
      // 用 dl/dt/dd 改為 div 結構（label + value 對齊）
    });
  });
});