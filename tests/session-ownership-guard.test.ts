/**
 * Sprint 47 Commit 7 (Stage 47-6) — Session Ownership Source Code Guard
 * Sprint 48 Commit 3 (Stage 48-3): 統一風格 - upload route 也改用 helper
 *
 * 對應 PRD: docs/prd/11-chat-v2-completions.md §2.7 (FR-7.4) + §2.10 (FR-11)
 *
 * 目的:
 * - 確保所有使用 body sessionId 的 admin chat route
 *   都有 session ownership 檢查機制（不管是 helper 或內聯實作）
 *
 * Sprint 48-3 重構後風格統一:
 * - stream route: requireSessionOwnership helper
 * - upload route: requireSessionOwnership helper (原內聯，已重構)
 *
 * 規則:
 * - 讀取 app/api/admin/chat 目錄下的 route.ts
 * - 若檔案有從 body 拿取 session id, 必須有下列之一:
 *   1. requireSessionOwnership 呼叫 (helper) ← Sprint 48-3 後為唯一風格
 *   2. 內聯 db.chatSession.findUnique + userId 比對 (後備, 不推薦)
 */

import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

function findRouteFiles(dir: string): string[] {
  const results: string[] = [];
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        results.push(...findRouteFiles(fullPath));
      } else if (entry === 'route.ts') {
        results.push(fullPath);
      }
    }
  } catch {
    // 目錄不存在, 略過
  }
  return results;
}

const ROUTES_DIR = 'app/api/admin/chat';

describe('S47-6 — Session Ownership Source Code Guard (FR-7.4)', () => {
  it('app/api/admin/chat/ 目錄應存在', () => {
    const routes = findRouteFiles(ROUTES_DIR);
    expect(routes.length, '應至少有 1 個 route').toBeGreaterThan(0);
  });

  // 動態測試: 對每個找到的 route 做檢查
  const routes = findRouteFiles(ROUTES_DIR);

  for (const routePath of routes) {
    const source = readFileSync(routePath, 'utf-8');
    const usesSessionIdInBody = /sessionId\s*[:?]/.test(source);

    if (usesSessionIdInBody) {
      it(`${routePath} 應有 session ownership 檢查`, () => {
        const usesHelper = /requireSessionOwnership\s*\(/.test(source);
        const usesInlineCheck =
          /chatSession\.findUnique/.test(source) && /userId/.test(source);

        expect(
          usesHelper || usesInlineCheck,
          `${routePath} 使用 body sessionId 卻沒有 session ownership 檢查`,
        ).toBe(true);
      });
    }
  }

  it('stream/route.ts 應使用 requireSessionOwnership helper', () => {
    const source = readFileSync('app/api/admin/chat/stream/route.ts', 'utf-8');
    expect(source, '應使用 helper').toMatch(/requireSessionOwnership\s*\(/);
  });

  // Sprint 48-3 (Stage 48-3): upload route 風格統一, 不再是內聯
  it('upload/route.ts 應使用 requireSessionOwnership helper (Sprint 48-3 重構)', () => {
    const source = readFileSync('app/api/admin/chat/upload/route.ts', 'utf-8');
    expect(source, '應使用 helper').toMatch(/requireSessionOwnership\s*\(/);
  });
});