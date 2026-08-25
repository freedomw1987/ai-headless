/**
 * Sprint 17 Stage 1.3 — form page UI 改進（用 shadcn/ui 元件）
 *
 * 🅓 設計：form 完全改用 shadcn/ui 元件
 * - Input / Textarea / Label / Button / Card / Select
 * - 移除純 HTML <input class="border rounded p-2">
 * - 標題區改 Card 包裝
 * - 錯誤訊息改 Card with destructive border
 *
 * 守護測試：
 * 1. import shadcn Input / Textarea / Label / Button / Card
 * 2. 不再用純 <input class="border rounded p-2">
 * 3. submit 按鈕用 shadcn Button（loading state via Loader2 icon）
 * 4. cancel 按鈕用 shadcn Button variant="outline"
 * 5. 標題區用 Card
 * 6. label 用 shadcn Label（含 required 紅色 *）
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = process.cwd();
const CLIENT_PATH = resolve(ROOT, 'app/admin/crud/[spec]/dynamic-form-client.tsx');

describe('Sprint 17 Stage 1.3 — shadcn form page UI', () => {
  describe('shadcn 元件 import', () => {
    it('import shadcn Input', () => {
      const content = readFileSync(CLIENT_PATH, 'utf-8');
      expect(content).toMatch(/from\s+['"]@\/components\/ui\/input['"]/);
    });

    it('import shadcn Textarea', () => {
      const content = readFileSync(CLIENT_PATH, 'utf-8');
      expect(content).toMatch(/from\s+['"]@\/components\/ui\/textarea['"]/);
    });

    it('import shadcn Label', () => {
      const content = readFileSync(CLIENT_PATH, 'utf-8');
      expect(content).toMatch(/from\s+['"]@\/components\/ui\/label['"]/);
    });

    it('import shadcn Button', () => {
      const content = readFileSync(CLIENT_PATH, 'utf-8');
      expect(content).toMatch(/from\s+['"]@\/components\/ui\/button['"]/);
    });

    it('import shadcn Card', () => {
      const content = readFileSync(CLIENT_PATH, 'utf-8');
      expect(content).toMatch(/from\s+['"]@\/components\/ui\/card['"]/);
    });

    it('import Lucide Loader2 + ArrowLeft icons', () => {
      const content = readFileSync(CLIENT_PATH, 'utf-8');
      expect(content).toMatch(/from\s+['"]lucide-react['"]/);
      expect(content).toMatch(/Loader2/);
    });
  });

  describe('不再用 raw inline Tailwind', () => {
    it('不再用純 border rounded p-2 input', () => {
      const content = readFileSync(CLIENT_PATH, 'utf-8');
      expect(content).not.toMatch(/className=["'][^"']*border rounded p-2["']/);
    });

    it('不再用純 bg-blue-600 hover:bg-blue-700 submit button', () => {
      const content = readFileSync(CLIENT_PATH, 'utf-8');
      expect(content).not.toMatch(/bg-blue-600[^"']*hover:bg-blue-700/);
    });

    it('不再用純 px-4 py-2 border cancel button', () => {
      const content = readFileSync(CLIENT_PATH, 'utf-8');
      expect(content).not.toMatch(/className=["'][^"']*px-4 py-2 border["']/);
    });
  });

  describe('UI 結構', () => {
    it('標題區用 Card（CardHeader + CardTitle）', () => {
      const content = readFileSync(CLIENT_PATH, 'utf-8');
      expect(content).toMatch(/<Card[\s>]/);
      expect(content).toMatch(/<CardHeader/);
      expect(content).toMatch(/<CardTitle/);
    });

    it('每個 field 用 div + Label + Input/Textarea/Select', () => {
      const content = readFileSync(CLIENT_PATH, 'utf-8');
      expect(content).toMatch(/<Label/);
      expect(content).toMatch(/<Input/);
    });

    it('textarea 用 shadcn Textarea', () => {
      const content = readFileSync(CLIENT_PATH, 'utf-8');
      expect(content).toMatch(/<Textarea/);
    });

    it('required 標示（Label + 紅色 *）', () => {
      const content = readFileSync(CLIENT_PATH, 'utf-8');
      // 使用 Label 內的 <span className="text-destructive"> 或類似
      expect(content).toMatch(/text-destructive|text-red-500/);
    });

    it('submit 按鈕含 loading state（Loader2 + disabled）', () => {
      const content = readFileSync(CLIENT_PATH, 'utf-8');
      expect(content).toMatch(/<Loader2/);
      expect(content).toMatch(/disabled=\{submitting\}/);
    });

    it('cancel 按鈕用 Button variant="outline" asChild + Link', () => {
      const content = readFileSync(CLIENT_PATH, 'utf-8');
      expect(content).toMatch(/variant=["']outline["']/);
      expect(content).toMatch(/asChild/);
    });
  });
});