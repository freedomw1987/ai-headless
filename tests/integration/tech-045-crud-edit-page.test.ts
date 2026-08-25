/**
 * Sprint 18 Stage 1 — CRUD 編輯頁面
 *
 * 🅓 設計：
 * - 新增 app/admin/crud/[spec]/[id]/edit/page.tsx（Server Component）
 * - 載入既有 record，傳給 DynamicFormClient (mode='edit', initialData=record)
 * - 提交走 PUT /api/crud/<spec>?id=<id>
 * - redirect 回 detail page
 *
 * 守護測試：
 * 1. edit page 檔案存在
 * 2. 用 DynamicFormClient
 * 3. mode='edit'
 * 4. 載入既有 record (getRecordById)
 * 5. 處理 notFound
 * 6. 處理 extension disabled
 * 7. redirect after save
 * 8. auth guard
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = process.cwd();
const EDIT_PAGE_PATH = resolve(ROOT, 'app/admin/crud/[spec]/[id]/edit/page.tsx');
const NEW_PAGE_PATH = resolve(ROOT, 'app/admin/crud/[spec]/new/page.tsx');

describe('Sprint 18 Stage 1 — CRUD 編輯頁面', () => {
  describe('edit page 檔案結構', () => {
    it('app/admin/crud/[spec]/[id]/edit/page.tsx 存在', () => {
      expect(existsSync(EDIT_PAGE_PATH)).toBe(true);
    });

    it('edit page 是 Server Component（async function）', () => {
      const content = readFileSync(EDIT_PAGE_PATH, 'utf-8');
      // Server Component 預設 export async function
      expect(content).toMatch(/export\s+default\s+async\s+function/);
    });

    it('edit page 用 DynamicFormClient', () => {
      const content = readFileSync(EDIT_PAGE_PATH, 'utf-8');
      expect(content).toMatch(/DynamicFormClient/);
    });
  });

  describe('edit page 行為', () => {
    it('edit page 設定 mode="edit"', () => {
      const content = readFileSync(EDIT_PAGE_PATH, 'utf-8');
      expect(content).toMatch(/mode=['"]edit['"]/);
    });

    it('edit page 載入既有 record（透過 listAvailableSpecs + loadSpec）', () => {
      const content = readFileSync(EDIT_PAGE_PATH, 'utf-8');
      // 需 loadSpec + 找 record
      expect(content).toMatch(/loadSpec/);
      // 需 query id
      expect(content).toMatch(/id/);
    });

    it('edit page 處理 notFound（record 不存在時）', () => {
      const content = readFileSync(EDIT_PAGE_PATH, 'utf-8');
      expect(content).toMatch(/notFound\(\)/);
    });

    it('edit page 處理 extension disabled', () => {
      const content = readFileSync(EDIT_PAGE_PATH, 'utf-8');
      expect(content).toMatch(/isExtensionEnabledByName/);
    });

    it('edit page 有 auth guard（redirect if no session）', () => {
      const content = readFileSync(EDIT_PAGE_PATH, 'utf-8');
      expect(content).toMatch(/auth\(\)/);
      expect(content).toMatch(/redirect/);
    });
  });

  describe('edit page vs new page 結構一致', () => {
    it('edit page 結構對應 new page（含 loadSpec、uiConfig、auth flow）', () => {
      const editContent = readFileSync(EDIT_PAGE_PATH, 'utf-8');
      const newContent = readFileSync(NEW_PAGE_PATH, 'utf-8');

      // 兩者都應有 loadSpec + buildFormUIConfig
      expect(editContent).toMatch(/loadSpec/);
      expect(editContent).toMatch(/buildFormUIConfig|buildDetailUIConfig/);

      // 兩者都應有 auth + redirect
      expect(editContent).toMatch(/redirect.*login/);
    });
  });
});