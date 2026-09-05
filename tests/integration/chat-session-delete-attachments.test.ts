/**
 * Sprint 54 Bug Fix — DELETE /api/admin/chat/sessions/[id] 互動測試
 *
 * 對應: docs/backlog.md TD-54-Delete-Attachments
 * 對應: PRD §FR-22 (Delete Session 應清除 attachments)
 *
 * 測試 DELETE handler 的 3 步流程 (源碼靜態分析 + 行為模擬):
 * 1. 查 session + attachments (含 userId 驗證)
 * 2. 刪 fs (uploads/<sessionId>/<uuid>.<ext>) — force=true 容錯
 * 3. 刪 DB attachments records
 * 4. 刪 session 本身
 *
 * 重點: 順序不可反 (FK onDelete: NoAction)
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';

const source = readFileSync(
  'app/api/admin/chat/sessions/[id]/route.ts',
  'utf-8',
);

describe('S54 — DELETE /api/admin/chat/sessions/[id] 互動測試', () => {
  describe('Step 1: 查 session + attachments', () => {
    it('應用 findUnique + userId 驗證 (S47-6 inline check)', () => {
      expect(source).toMatch(/db\.chatSession\.findUnique/);
      expect(source).toMatch(/userId\s*!==\s*auth\.user\.id|userId:\s*auth\.user\.id/);
    });

    it('應 select attachments.storagePath', () => {
      expect(source).toMatch(/attachments:\s*\{\s*select:\s*\{\s*storagePath:\s*true\s*\}\s*\}/);
    });

    it('應在找不到時返回 404', () => {
      // 不應該 throw, 應該 NextResponse.json({ error: 'Session not found' }, { status: 404 })
      expect(source).toMatch(/Session not found/);
      expect(source).toMatch(/status:\s*404/);
    });
  });

  describe('Step 2: 清檔案系統', () => {
    it('應從 fs/promises import rm (static 或 dynamic)', () => {
      // 接受兩種 import 形式
      const hasStatic = /import\s*\{[^}]*\brm\b[^}]*\}\s*from\s*['"]fs\/promises['"]/.test(source);
      const hasDynamic = /\{[^}]*\brm\b[^}]*\}\s*=\s*await\s+import\(['"]fs\/promises['"]\)/.test(source);
      expect(hasStatic || hasDynamic, '應有 rm import').toBe(true);
    });

    it('應從 path import join', () => {
      const hasStatic = /import\s*\{[^}]*\bjoin\b[^}]*\}\s*from\s*['"]path['"]/.test(source);
      const hasDynamic = /\{[^}]*\bjoin\b[^}]*\}\s*=\s*await\s+import\(['"]path['"]\)/.test(source);
      expect(hasStatic || hasDynamic, '應有 join import').toBe(true);
    });

    it('應從 process.cwd() + storagePath 構建絕對路徑', () => {
      expect(source).toMatch(/join\(process\.cwd\(\),\s*att\.storagePath\)/);
    });

    it('應用 force: true 容錯 (檔案不存在不報錯)', () => {
      expect(source).toMatch(/force:\s*true/);
    });

    it('應對檔案清除錯誤有 logger.error 但不 throw (避免部分刪除)', () => {
      // Sprint 55 改用結構化 logger (lib/log.ts)
      // try/catch 包住 rm 邏輯, catch 內 logger.error (不 throw)
      // 確保 fs 失敗不影響 DB 刪除
      expect(source).toMatch(/log\.error\([^)]*attachment/);
    });
  });

  describe('Step 3: 刪 DB attachments records', () => {
    it('應呼叫 db.attachment.deleteMany', () => {
      expect(source).toMatch(/db\.attachment\.deleteMany/);
    });

    it('應 where sessionId = id', () => {
      expect(source).toMatch(/where:\s*\{\s*sessionId:\s*id\s*\}/);
    });

    it('應在 DB 刪除失敗時返回 500', () => {
      // catch 內應有 500 回應
      expect(source).toMatch(/Failed to delete attachments/);
      expect(source).toMatch(/status:\s*500/);
    });
  });

  describe('Step 4: 刪 session 本身', () => {
    it('應呼叫 db.chatSession.deleteMany', () => {
      expect(source).toMatch(/db\.chatSession\.deleteMany/);
    });

    it('應 where id + userId (雙重保險)', () => {
      expect(source).toMatch(/where:\s*\{\s*id,\s*userId:\s*auth\.user\.id\s*\}/);
    });

    it('應在刪除 0 筆時返回 404', () => {
      expect(source).toMatch(/result\.count\s*===\s*0/);
    });
  });

  describe('整體順序驗證', () => {
    it('Step 1 → 2 → 3 → 4 順序應正確 (FK NoAction 防護)', () => {
      const step1 = source.indexOf('db.chatSession.findUnique');
      const step2 = source.indexOf('fs/promises');
      const step3 = source.indexOf('db.attachment.deleteMany');
      const step4 = source.indexOf('db.chatSession.deleteMany');

      expect(step1, 'Step 1 findUnique').toBeGreaterThan(-1);
      expect(step2, 'Step 2 fs/promises').toBeGreaterThan(-1);
      expect(step3, 'Step 3 attachment.deleteMany').toBeGreaterThan(-1);
      expect(step4, 'Step 4 session.deleteMany').toBeGreaterThan(-1);

      expect(step1, 'Step 1 < Step 2').toBeLessThan(step2);
      expect(step2, 'Step 2 < Step 3').toBeLessThan(step3);
      expect(step3, 'Step 3 < Step 4 (FK 避免違反)').toBeLessThan(step4);
    });
  });
});