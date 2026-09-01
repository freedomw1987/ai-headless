/**
 * Sprint 50 Commit 1 (Stage 50-0) — 下載 API 守護測試 (FR-17.4)
 *
 * 對應 PRD: docs/prd/11-chat-v2-completions.md §2.12 (FR-17.4)
 * 對應 Plan Gate: docs/sprint50-plan-gate.md
 *
 * 設計:
 * - /api/admin/chat/attachments/[id]/download: 下載附件
 * - RBAC 雙層 (requireUser + isAdmin) 對齊 upload route
 * - session ownership: 跨 session → 403
 * - path traversal 防護: filePath.startsWith(UPLOAD_ROOT)
 * - 中文檔名: RFC 5987 雙編碼
 *
 * 注意:
 * - 由於 vitest glob 對 Next.js dynamic route [id] 處理限制,
 *   守護測試放在 tests/ 下, 與 office-parser-rest-guard 風格一致
 */

import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';

describe('S50 — 下載 API /api/admin/chat/attachments/[id]/download (FR-17.4)', () => {
  describe('FR-17.4.1: 檔案結構', () => {
    it('應有 route.ts 檔案', () => {
      expect(
        existsSync(
          'app/api/admin/chat/attachments/[id]/download/route.ts',
        ),
        '/api/admin/chat/attachments/[id]/download route 不存在',
      ).toBe(true);
    });

    it('route 應 export GET handler', () => {
      const source = readFileSync(
        'app/api/admin/chat/attachments/[id]/download/route.ts',
        'utf-8',
      );
      expect(
        source,
        '應有 export async function GET',
      ).toMatch(/export\s+(async\s+)?function\s+GET/);
    });
  });

  describe('FR-17.4.2: RBAC + session ownership 守衛', () => {
    it('route 應有 requireUser (未登入 → 401)', () => {
      const source = readFileSync(
        'app/api/admin/chat/attachments/[id]/download/route.ts',
        'utf-8',
      );
      expect(
        source,
        '應使用 requireUser 守衛未登入',
      ).toMatch(/requireUser/);
    });

    it('route 應有 isAdmin (非 admin → 403)', () => {
      const source = readFileSync(
        'app/api/admin/chat/attachments/[id]/download/route.ts',
        'utf-8',
      );
      expect(
        source,
        '應使用 isAdmin 守衛非 admin',
      ).toMatch(/isAdmin/);
    });

    it('route 應有 requireSessionOwnership (跨 session → 403)', () => {
      const source = readFileSync(
        'app/api/admin/chat/attachments/[id]/download/route.ts',
        'utf-8',
      );
      expect(
        source,
        '應使用 requireSessionOwnership 守衛 session ownership',
      ).toMatch(/requireSessionOwnership/);
    });

    it('route 應有 404 處理 (attachment 不存在)', () => {
      const source = readFileSync(
        'app/api/admin/chat/attachments/[id]/download/route.ts',
        'utf-8',
      );
      expect(
        source,
        '應有 404 Not found 處理',
      ).toMatch(/404/);
    });
  });

  describe('FR-17.4.3: 路徑安全', () => {
    it('route 應有 path traversal 防護 (filePath.startsWith(UPLOAD_ROOT))', () => {
      const source = readFileSync(
        'app/api/admin/chat/attachments/[id]/download/route.ts',
        'utf-8',
      );
      expect(
        source,
        '應有 path traversal 防護',
      ).toMatch(/startsWith\s*\(\s*UPLOAD_ROOT\s*\)/);
    });
  });

  describe('FR-17.4.4: 檔案回傳', () => {
    it('route 應回傳 Content-Disposition: attachment (強制下載)', () => {
      const source = readFileSync(
        'app/api/admin/chat/attachments/[id]/download/route.ts',
        'utf-8',
      );
      expect(
        source,
        '應有 Content-Disposition header',
      ).toMatch(/Content-Disposition/);
      expect(
        source,
        '應標記為 attachment (強制下載)',
      ).toMatch(/attachment/);
    });

    it('route 應支援中文檔名 (RFC 5987 編碼)', () => {
      const source = readFileSync(
        'app/api/admin/chat/attachments/[id]/download/route.ts',
        'utf-8',
      );
      expect(
        source,
        '應使用 RFC 5987 編碼',
      ).toMatch(/filename\*\s*=\s*UTF-8/);
    });

    it('route 應回傳 Content-Type 與 Content-Length', () => {
      const source = readFileSync(
        'app/api/admin/chat/attachments/[id]/download/route.ts',
        'utf-8',
      );
      expect(source, '應有 Content-Type').toMatch(/Content-Type/);
      expect(source, '應有 Content-Length').toMatch(/Content-Length/);
    });
  });
});