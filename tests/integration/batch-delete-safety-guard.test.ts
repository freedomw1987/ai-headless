/**
 * Sprint 41-4 (D) — Batch delete safety 守護測試
 *
 * TD-806: batch delete 必須有 max batch size + TransitionLog
 * TD-812: batch delete 守護測試 (RBAC + TransitionLog)
 *
 * Gate 1 TDD：source-code guard
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const BATCH_DELETE_PATH = 'lib/runtime/batch-delete.ts';
const API_ROUTE_PATH = 'app/api/crud/[spec]/route.ts';

function load(path: string): string {
  return readFileSync(path, 'utf-8');
}

describe('Sprint 41-4 — TD-806 batch delete 安全', () => {
  it('batch-delete.ts 必須有 MAX_BATCH_SIZE 限制', () => {
    const source = load(BATCH_DELETE_PATH);
    expect(source).toMatch(/MAX_BATCH_SIZE/);
    expect(source).toMatch(/ids\.length\s*>\s*MAX_BATCH_SIZE/);
  });

  it('batch-delete.ts 必須寫 TransitionLog (audit trail)', () => {
    const source = load(BATCH_DELETE_PATH);
    expect(source).toMatch(/transitionLog/);
    expect(source).toMatch(/db\.transitionLog\.create/);
    // 必須有 machineName / entityType / entityId / fromState / toState
    expect(source).toMatch(/machineName/);
    expect(source).toMatch(/entityType/);
    expect(source).toMatch(/fromState/);
    expect(source).toMatch(/toState/);
  });

  it('batch-delete.ts 必須 catch transitionLog.create 失敗 (不阻擙刪除)', () => {
    const source = load(BATCH_DELETE_PATH);
    // transitionLog 寫入必須有 try/catch, 不要阻擙主流程
    const hasTryCatch = /transitionLog\.create[\s\S]{0,500}catch/.test(source);
    expect(hasTryCatch, 'transitionLog.create 沒有 try/catch 保護').toBe(true);
  });
});

describe('Sprint 41-4 — TD-812 batch delete RBAC 守護', () => {
  it('batch delete API route 應該有權限檢查 (非 admin 不能用)', () => {
    const source = load(API_ROUTE_PATH);
    // 通常 batch delete 應該 require admin 或特定 permission
    // 至少要有某種權限檢查
    const hasPermCheck = /requirePermission|admin|roles:write|users:assign/.test(source);
    expect(hasPermCheck, 'batch delete route 沒有權限檢查').toBe(true);
  });
});
