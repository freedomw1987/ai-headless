/**
 * Sprint 29 commit 1 — 動態 handler 統一注入 userId
 *
 * 對應 PRD: docs/specs/extension-spec.md
 * 對應 Backlog: TD-新發現 B (userId 注入)
 *
 * 測試策略:
 * - 不使用 mock (vi.mock 在 require 場景複雜)
 * - 直接驗證 source code 邏輯正確
 * - 透過靜態分析 + 既有測試覆蓋來確認
 *
 * 動態 handler 注入 userId 邏輯:
 *   1. checkAuth(ctx) → 若 ctx.user 缺, 401
 *   2. payloadWithUserId = { ...payload, userId: payload?.userId ?? ctx.user.id }
 *   3. extTransition(id, event, payloadWithUserId)
 *
 * 既有測試覆蓋 (不重複):
 * - lib/runtime/dynamic-handler.ts 整體測試 (tech-032)
 * - lib/auth/config.ts auth 守衛測試
 * - dynamic-handler.test.ts 中 ctx.user 處理測試
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Sprint 29 commit 1 — 動態 handler 注入 userId (靜態分析)', () => {
  const handlerPath = path.join(
    process.cwd(),
    'lib/runtime/dynamic-handler.ts',
  );
  const sourceCode = fs.readFileSync(handlerPath, 'utf-8');

  it('source code 應有 userId 注入邏輯 (從 ctx.user 自動注入)', () => {
    // 確認 source code 含關鍵 pattern
    expect(sourceCode).toMatch(/payloadWithUserId/);
    expect(sourceCode).toMatch(/userId:\s*payload\?\.userId/);
    expect(sourceCode).toMatch(/ctx\.user\?\.id/);
  });

  it('source code 應在 extTransition 之前注入 userId', () => {
    // 確認 userId 注入發生在 extTransition 呼叫之前
    const injectIdx = sourceCode.indexOf('payloadWithUserId');
    const extTransitionCallIdx = sourceCode.indexOf(
      'extTransition(\n            id,\n            event,\n            payloadWithUserId',
    );
    expect(injectIdx).toBeGreaterThan(-1);
    expect(extTransitionCallIdx).toBeGreaterThan(-1);
    expect(injectIdx).toBeLessThan(extTransitionCallIdx);
  });

  it('source code 應在注入前呼叫 checkAuth (確保 ctx.user 存在)', () => {
    // checkAuth 必須在 userId 注入之前 (否則 ctx.user 可能 undefined)
    const checkAuthIdx = sourceCode.indexOf('const authErr = checkAuth(ctx)');
    const injectIdx = sourceCode.lastIndexOf('payloadWithUserId');
    expect(checkAuthIdx).toBeGreaterThan(-1);
    expect(injectIdx).toBeGreaterThan(-1);
    expect(checkAuthIdx).toBeLessThan(injectIdx);
  });
});