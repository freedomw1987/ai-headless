/**
 * Sprint 20 Stage 1 — Sheet 元件 + detail page 抽屜式編輯
 *
 * 🅓 設計：
 * - Sheet 元件：shadcn Sheet（基於 @radix-ui/react-dialog）
 * - detail page「編輯」按鈕改為 SheetTrigger（不再是 Link → /edit）
 * - SheetContent 內顯示 DynamicFormClient（mode='edit'）
 * - 編輯完成關閉 Sheet + 自動 refresh detail（router.refresh）
 * - /edit page 保留（向後相容，直接連結仍可用）
 *
 * 守護測試：
 * 1. Sheet 元件存在 + 從 @radix-ui/react-dialog 引入 DialogPrimitive
 * 2. Sheet 元件導出所有 sub-components（Sheet / SheetTrigger / SheetClose / SheetContent / SheetHeader / SheetFooter / SheetTitle / SheetDescription）
 * 3. detail page import Sheet + sub-components
 * 4. detail page「編輯」按鈕改用 SheetTrigger（不再是 Link）
 * 5. detail page SheetContent 內含 DynamicFormClient + mode='edit'
 * 6. detail page 編輯完成後關閉 Sheet + router.refresh
 * 7. /edit page 仍存在（向後相容）
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = process.cwd();
const SHEET_PATH = resolve(ROOT, 'components/ui/sheet.tsx');
const DETAIL_CLIENT_PATH = resolve(ROOT, 'app/admin/crud/[spec]/[id]/dynamic-detail-client.tsx');
const FORM_CLIENT_PATH = resolve(ROOT, 'app/admin/crud/[spec]/dynamic-form-client.tsx');
const UI_CONFIG_PATH = resolve(ROOT, 'lib/runtime/ui-config.ts');
const EDIT_PAGE_PATH = resolve(ROOT, 'app/admin/crud/[spec]/[id]/edit/page.tsx');

describe('Sprint 20 Stage 1 — Sheet 元件 + detail page 抽屜式編輯', () => {
  describe('Sheet 元件（shadcn 標準）', () => {
    it('Sheet 元件檔案存在', () => {
      expect(existsSync(SHEET_PATH)).toBe(true);
    });

    it('Sheet 元件從 @radix-ui/react-dialog 引入 DialogPrimitive', () => {
      const content = readFileSync(SHEET_PATH, 'utf-8');
      expect(content).toMatch(/import\s*\*\s*as\s*DialogPrimitive\s+from\s+['"]@radix-ui\/react-dialog['"]/);
    });

    it('Sheet 元件從 lucide-react 引入 X icon（close 按鈕）', () => {
      const content = readFileSync(SHEET_PATH, 'utf-8');
      expect(content).toMatch(/import\s*\{[^}]*\bX\b[^}]*\}\s*from\s+['"]lucide-react['"]/);
    });

    it('Sheet 元件導出所有必要 sub-components', () => {
      const content = readFileSync(SHEET_PATH, 'utf-8');
      // Sheet (root) — 通常 Dialog 或 Sheet
      expect(content).toMatch(/const\s+Sheet\s*=/);
      // SheetTrigger
      expect(content).toMatch(/const\s+SheetTrigger\s*=/);
      // SheetClose
      expect(content).toMatch(/const\s+SheetClose\s*=/);
      // SheetContent
      expect(content).toMatch(/const\s+SheetContent\s*=/);
      // SheetHeader
      expect(content).toMatch(/const\s+SheetHeader\s*=/);
      // SheetFooter
      expect(content).toMatch(/const\s+SheetFooter\s*=/);
      // SheetTitle
      expect(content).toMatch(/const\s+SheetTitle\s*=/);
      // SheetDescription
      expect(content).toMatch(/const\s+SheetDescription\s*=/);

      // 全部 export
      expect(content).toMatch(/export\s*\{[\s\S]*Sheet[\s\S]*SheetTrigger[\s\S]*SheetClose[\s\S]*SheetContent[\s\S]*SheetHeader[\s\S]*SheetFooter[\s\S]*SheetTitle[\s\S]*SheetDescription[\s\S]*\}/);
    });

    it('SheetContent 用 cva 支援 side prop（top/right/bottom/left）', () => {
      const content = readFileSync(SHEET_PATH, 'utf-8');
      expect(content).toMatch(/cva/);
      // side variants
      expect(content).toMatch(/top[\s\S]*right[\s\S]*bottom[\s\S]*left/);
    });
  });

  describe('detail page 抽屜式編輯整合', () => {
    it('detail page import Sheet + 必要 sub-components', () => {
      const content = readFileSync(DETAIL_CLIENT_PATH, 'utf-8');
      expect(content).toMatch(/import\s*\{[^}]*\bSheet\b[^}]*\}\s*from\s+['"]@\/components\/ui\/sheet['"]/);
      expect(content).toMatch(/\bSheetTrigger\b/);
      expect(content).toMatch(/\bSheetContent\b/);
      expect(content).toMatch(/\bSheetHeader\b/);
      expect(content).toMatch(/\bSheetTitle\b/);
    });

    it('detail page「編輯」按鈕改用 SheetTrigger（不再是 Link）', () => {
      const content = readFileSync(DETAIL_CLIENT_PATH, 'utf-8');
      // Sprint 18 是 Button asChild + Link href=/edit
      // Sprint 20 改為 SheetTrigger 包 Button
      expect(content).not.toMatch(/<Link\s+href=\{`\/admin\/crud\/\$\{specName\}\/\$\{id\}\/edit`\}>/);
      // SheetTrigger 取代 Link
      expect(content).toMatch(/<SheetTrigger/);
    });

    it('detail page SheetContent 內含 DynamicFormClient + mode="edit"', () => {
      const content = readFileSync(DETAIL_CLIENT_PATH, 'utf-8');
      // SheetContent 包 DynamicFormClient
      expect(content).toMatch(/<SheetContent[\s\S]*?<DynamicFormClient[\s\S]*?mode=['"]edit['"][\s\S]*?\/>[\s\S]*?<\/SheetContent>/);
    });

    it('detail page onSuccess → 關閉 Sheet（callback 設計）', () => {
      const content = readFileSync(DETAIL_CLIENT_PATH, 'utf-8');
      // Sheet open state 控制（useState + set...Open 或 onOpenChange）
      expect(content).toMatch(/useState.*[Oo]pen|onOpenChange/);
      // onSuccess callback 關閉 Sheet（setXxxOpen(false)）
      expect(content).toMatch(/onSuccess=\{?\(\)\s*=>\s*set\w*[Oo]pen\s*\(\s*false\s*\)/);
    });

    it('DynamicFormClient 儲存成功後 router.refresh()（refresh 在 form-client 內部）', () => {
      const content = readFileSync(FORM_CLIENT_PATH, 'utf-8');
      // onSuccess callback 被呼叫後（若有），仍 router.refresh
      expect(content).toMatch(/router\.refresh\(\)/);
      // 提交成功分支內 refresh
      expect(content).toMatch(/else\s*\{[\s\S]*?router\.refresh\(\)/);
    });

    it('buildFormUIConfig 依 mode 動態決定 title 後缀（避免「- 新增」出現在 Sheet 編輯模式）', () => {
      const content = readFileSync(UI_CONFIG_PATH, 'utf-8');
      // buildFormUIConfig 接受 mode 參數
      expect(content).toMatch(/buildFormUIConfig\([^)]*mode/);
      // 動態後缀（不用寫死「- 新增」）
      expect(content).toMatch(/mode\s*===\s*['"]create['"]/);
      // detail 場景傳 mode='edit'
      expect(content).toMatch(/buildFormUIConfig\(\s*spec\s*,\s*['"]edit['"]/);
    });
  });

  describe('向後相容（/edit page 保留）', () => {
    it('/edit page 仍存在', () => {
      expect(existsSync(EDIT_PAGE_PATH)).toBe(true);
    });
  });
});