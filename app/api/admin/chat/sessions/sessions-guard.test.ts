/**
 * Sprint 44 Commit G2 — Admin Chat Sessions API 守護測試
 *
 * 設計 (S44 Plan Gate Commit G2):
 * - GET /api/admin/chat/sessions — 列出 user 自己的 sessions (按 updatedAt DESC)
 * - POST /api/admin/chat/sessions — 建立新 session
 * - GET /api/admin/chat/sessions/[id] — 取得單 session + messages
 * - DELETE /api/admin/chat/sessions/[id] — 刪除 session
 * - admin-only (requireUser + isAdmin)
 * - session 隔離 (只能操作自己的)
 */

import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';

describe('S44-G2 — /api/admin/chat/sessions API', () => {
  describe('list sessions', () => {
    it('應有 /api/admin/chat/sessions/route.ts', () => {
      expect(
        existsSync('app/api/admin/chat/sessions/route.ts'),
        'sessions list route 不存在'
      ).toBe(true);
    });

    it('list route 應 export GET', () => {
      const source = readFileSync('app/api/admin/chat/sessions/route.ts', 'utf-8');
      expect(source, '應有 GET handler').toMatch(/export\s+(async\s+)?function\s+GET/);
    });

    it('list route 應有 admin-only auth check', () => {
      const source = readFileSync('app/api/admin/chat/sessions/route.ts', 'utf-8');
      expect(source, '應有 admin check').toMatch(/isAdmin|requireUser/);
    });

    it('list route 應 query ChatSession by userId + orderBy updatedAt', () => {
      const source = readFileSync('app/api/admin/chat/sessions/route.ts', 'utf-8');
      expect(source, '應用 userId 過濾').toMatch(/userId/);
      expect(source, '應按 updatedAt 排序').toMatch(/updatedAt/);
    });
  });

  describe('create / delete session', () => {
    it('list route 應 export POST', () => {
      const source = readFileSync('app/api/admin/chat/sessions/route.ts', 'utf-8');
      expect(source, '應有 POST handler').toMatch(/export\s+(async\s+)?function\s+POST/);
    });

    it('應有 /api/admin/chat/sessions/[id]/route.ts', () => {
      expect(
        existsSync('app/api/admin/chat/sessions/[id]/route.ts'),
        'session detail route 不存在'
      ).toBe(true);
    });

    it('detail route 應 export DELETE', () => {
      const source = readFileSync('app/api/admin/chat/sessions/[id]/route.ts', 'utf-8');
      expect(source, '應有 DELETE handler').toMatch(/export\s+(async\s+)?function\s+DELETE/);
    });
  });

  describe('UI 整合', () => {
    it('AdminChatDialog 應有「歷史對話」按鈕', () => {
      const source = readFileSync('app/admin/_components/admin-chat-dialog.tsx', 'utf-8');
      expect(source, '應有歷史對話 button').toMatch(/歷史對話|history/i);
    });

    it('AdminChatDialog 應有「新開對話」按鈕', () => {
      const source = readFileSync('app/admin/_components/admin-chat-dialog.tsx', 'utf-8');
      expect(source, '應有新開對話 button').toMatch(/新開對話|new.*chat|新.*對話/i);
    });

    it('AdminChatPanel 應支援 session 切換', () => {
      const source = readFileSync('app/admin/_components/admin-chat-panel.tsx', 'utf-8');
      // 應有 sessionId prop 或 onSessionChange
      const hasSession = /sessionId|onSessionChange|activeSession/i.test(source);
      expect(hasSession, 'Panel 應支援 session 切換').toBe(true);
    });
  });

  // ============================================
  // Sprint 54 Bug Fix — DELETE 500 修護守護測試
  // ============================================
  // 用戶反饋: DELETE /api/admin/chat/sessions/[id] 返回 500
  // 根因: Attachment schema 是 onDelete: NoAction, DELETE session 時 FK 違反
  // 修法: DELETE handler 先刪 attachment records + 檔案系統, 再刪 session
  describe('S54 Bug Fix — DELETE 應正確清除 attachments', () => {
    const detailRouteSource = readFileSync(
      'app/api/admin/chat/sessions/[id]/route.ts',
      'utf-8',
    );

    it('DELETE handler 應先 query session 含 attachments 關聯', () => {
      expect(
        detailRouteSource,
        'DELETE handler 應 query attachments (為清檔案系統)',
      ).toMatch(/attachments:\s*{\s*select:\s*{\s*storagePath:\s*true\s*}\s*}/);
    });

    it('DELETE handler 應呼叫 db.attachment.deleteMany', () => {
      expect(
        detailRouteSource,
        'DELETE handler 應先刪 attachment records (FK NoAction 防護)',
      ).toMatch(/db\.attachment\.deleteMany/);
    });

    it('DELETE handler 應從 fs/promises 刪 attachment 檔案', () => {
      // 接受 static import 或 dynamic import 兩種寫法
      const source = detailRouteSource;
      const hasRmImport =
        /import\s*{[^}]*\brm\b[^}]*}\s*from\s*['"]fs\/promises['"]/.test(source) ||
        /\{[^}]*\brm\b[^}]*\}\s*=\s*await\s+import\(['"]fs\/promises['"]\)/.test(source);
      expect(
        hasRmImport,
        'DELETE handler 應 (dynamic) import rm from fs/promises',
      ).toBe(true);
      // 應有 join(process.cwd(), storagePath) 解絕對路徑
      expect(
        source,
        'DELETE handler 應用 process.cwd() + join 解絕對路徑',
      ).toMatch(/join\(process\.cwd\(\),\s*att\.storagePath\)|join\(process\.cwd\(\)/);
    });

    it('DELETE handler 應先刪 attachments 再刪 session (順序)', () => {
      // db.attachment.deleteMany 應在 db.chatSession.deleteMany 之前
      const attachmentDeleteIdx = detailRouteSource.indexOf('db.attachment.deleteMany');
      const sessionDeleteIdx = detailRouteSource.indexOf('db.chatSession.deleteMany');
      expect(attachmentDeleteIdx, '應有 db.attachment.deleteMany').toBeGreaterThan(-1);
      expect(sessionDeleteIdx, '應有 db.chatSession.deleteMany').toBeGreaterThan(-1);
      expect(
        attachmentDeleteIdx < sessionDeleteIdx,
        '應先刪 attachments 再刪 session (避免 FK 違反)',
      ).toBe(true);
    });

    it('DELETE handler 應處理檔案系統錯誤但不 crash DB 刪除', () => {
      // 檔案系統 rm 失敗不應中斷 DB 刪除 (用 force=true + try/catch + console.error)
      expect(
        detailRouteSource,
        'DELETE handler 應對檔案清除錯誤有 console.error 但不 throw',
      ).toMatch(/force:\s*true/);
    });
  });
});