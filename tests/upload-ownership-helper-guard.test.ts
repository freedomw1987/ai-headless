/**
 * Sprint 48 Commit 3 (Stage 48-3) — Upload Ownership Helper Guard
 *
 * 對應 PRD: docs/prd/11-chat-v2-completions.md §2.10 (FR-11.1 ~ FR-11.2)
 *
 * 守護目的:
 * - 確保 upload route 改用 requireSessionOwnership helper (取代內聯查詢)
 * - 與 Sprint 47-6 stream route 風格一致
 * - 未來若 ownership 規則改變 (例如 admin 可代理 user), 只改 helper 一處
 *
 * 對應 Sprint 47 reflection P2:
 * - "Sprint 47-6 stream route 改用 helper，但 upload route 仍用內聯"
 * - source-code guard 已涵蓋兩種模式，但風格不一致
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';

describe('S48-3 — Upload Ownership Helper Guard (FR-11.1 ~ FR-11.2)', () => {
  describe('FR-11.1: upload route 應使用 requireSessionOwnership helper', () => {
    it('upload route 檔案應存在', () => {
      expect(existsSync('app/api/admin/chat/upload/route.ts')).toBe(true);
    });

    it('upload route 應 import requireSessionOwnership', () => {
      const source = readFileSync(
        'app/api/admin/chat/upload/route.ts',
        'utf-8',
      );
      expect(source, '應 import requireSessionOwnership').toMatch(
        /import\s+.*requireSessionOwnership.*from\s+['"]@?\/lib\/auth\/session-ownership['"]/,
      );
    });

    it('upload route 應 import SessionOwnershipError', () => {
      const source = readFileSync(
        'app/api/admin/chat/upload/route.ts',
        'utf-8',
      );
      expect(source, '應 import SessionOwnershipError').toMatch(
        /SessionOwnershipError/,
      );
    });

    it('upload route 應 call requireSessionOwnership(sessionId, user.id)', () => {
      const source = readFileSync(
        'app/api/admin/chat/upload/route.ts',
        'utf-8',
      );
      expect(
        source,
        '應 call requireSessionOwnership',
      ).toMatch(/requireSessionOwnership\s*\(/);
      // 驗證傳入 sessionId + user.id
      expect(source).toMatch(
        /requireSessionOwnership\s*\(\s*sessionId\s*,\s*user\.id\s*\)/,
      );
    });

    it('upload route 應 catch SessionOwnershipError 並回傳對應 status', () => {
      const source = readFileSync(
        'app/api/admin/chat/upload/route.ts',
        'utf-8',
      );
      expect(
        source,
        '應捕獲 SessionOwnershipError',
      ).toMatch(/instanceof\s+SessionOwnershipError/);
      // 驗證回傳 err.status
      expect(source).toMatch(/err\.status|error\.status/);
    });

    it('upload route 不應再有內聯 db.chatSession.findUnique + userId 比對', () => {
      const source = readFileSync(
        'app/api/admin/chat/upload/route.ts',
        'utf-8',
      );
      // 內聯模式的特徵: 直接呼叫 db.chatSession.findUnique + 手動比對 userId
      // 重構後應用 helper, 不再有這些
      const hasInlineFindUnique = /db\.chatSession\.findUnique/.test(source);
      const hasInlineUserIdCompare = /session\.userId\s*[!=]==?\s*user\.id/.test(
        source,
      );
      expect(
        hasInlineFindUnique,
        '不應再用內聯 db.chatSession.findUnique',
      ).toBe(false);
      expect(
        hasInlineUserIdCompare,
        '不應再用內聯 userId 比對',
      ).toBe(false);
    });
  });

  describe('FR-11.2: upload route guard test', () => {
    it('既有 upload route test 應仍可載入', () => {
      // 守護測試: 即使重構, upload route 既有測試仍存在
      // (驗證檔案存在即可, 不需跑既有測試內容)
      const uploadTestPaths = [
        'app/api/admin/chat/upload/route.test.ts',
        'app/api/admin/chat/upload/upload-route-guard.test.ts',
      ];
      const exists = uploadTestPaths.some((p) => existsSync(p));
      expect(
        exists,
        'upload route test 檔案應存在 (route.test.ts 或 upload-route-guard.test.ts)',
      ).toBe(true);
    });
  });

  describe('Helper 一致性 (跨 stream + upload)', () => {
    it('stream route 仍使用 requireSessionOwnership helper', () => {
      const source = readFileSync(
        'app/api/admin/chat/stream/route.ts',
        'utf-8',
      );
      expect(source, 'stream route 仍應 call helper').toMatch(
        /requireSessionOwnership\s*\(/,
      );
    });

    it('session-ownership helper 仍 export 必要函式', () => {
      const helperSource = readFileSync(
        'lib/auth/session-ownership.ts',
        'utf-8',
      );
      expect(helperSource).toMatch(
        /export\s+(async\s+)?function\s+requireSessionOwnership/,
      );
      expect(helperSource).toMatch(/export\s+class\s+SessionOwnershipError/);
    });
  });
});