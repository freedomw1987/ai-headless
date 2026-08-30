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
});