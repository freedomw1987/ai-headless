/**
 * TDD Gate 1 — Sprint 26 commit 3 (TD-403)
 * Hook SDK type contract vs production hooks 不一致
 *
 * 對應 PRD: docs/prd/03-auth.md (Sprint 20 P2 揭露)
 * 對應 Backlog: TD-403
 *
 * 問題:
 * - hook-sdk.ts invokeHook<T>(name, context) return Promise<T>
 *   但實際上 hook 應 return 修改後的 data/result,而非整個 context
 * - 4 個 production hook (blog/event/todo) 全部 return data 而非 context
 * - TypeScript 推導時 type 對不起來 → silent type drift
 *
 * 修正方向 (本測試):
 * - 定義 HookResult<T>: hook 回傳的型別 (對應 hook 種類)
 * - invokeHook 改用 HookResult 而非泛型 T
 * - 保持 backward-compatible:舊 invokeHook<T> 仍可用
 */

import { describe, it, expect } from 'vitest';
import type { HookResult } from '@/lib/hooks/hook-sdk';

describe('TD-403 — Hook Result type contract', () => {
  it('beforeCreate HookResult 應為 Record<string, unknown> (data)', () => {
    type BeforeCreate = HookResult<'beforeCreate'>;
    const result: BeforeCreate = { title: 'Test' }; // ✅ 應通過 typecheck
    expect(result).toBeDefined();
  });

  it('afterCreate HookResult 應為 Record<string, unknown> (result)', () => {
    type AfterCreate = HookResult<'afterCreate'>;
    const result: AfterCreate = { id: 'u1', title: 'Test' };
    expect(result).toBeDefined();
  });

  it('beforeUpdate HookResult 應為 Record<string, unknown> (修改後 data)', () => {
    type BeforeUpdate = HookResult<'beforeUpdate'>;
    const result: BeforeUpdate = { status: 'published' };
    expect(result).toBeDefined();
  });

  it('afterUpdate HookResult 應為 Record<string, unknown> (result)', () => {
    type AfterUpdate = HookResult<'afterUpdate'>;
    const result: AfterUpdate = { id: 'u1' };
    expect(result).toBeDefined();
  });

  it('beforeDelete HookResult 應為 void (delete 通常無 return)', () => {
    type BeforeDelete = HookResult<'beforeDelete'>;
    const result: BeforeDelete = undefined;
    expect(result).toBeUndefined();
  });

  it('afterDelete HookResult 應為 void', () => {
    type AfterDelete = HookResult<'afterDelete'>;
    const result: AfterDelete = undefined;
    expect(result).toBeUndefined();
  });

  it('beforeList/afterList HookResult 應為 { items, total, ... }', () => {
    type AfterList = HookResult<'afterList'>;
    const result: AfterList = {
      items: [{ id: '1' }],
      total: 1,
      page: 1,
      pageSize: 10,
      totalPages: 1,
    };
    expect(result).toBeDefined();
  });

  it('beforeRead/afterRead HookResult 應為 Record<string, unknown>', () => {
    type AfterRead = HookResult<'afterRead'>;
    const result: AfterRead = { id: 'u1', title: 'Test' };
    expect(result).toBeDefined();
  });

  it('onTransition HookResult 應為 { fromState, toState, event }', () => {
    type OnTransition = HookResult<'onTransition'>;
    const result: OnTransition = {
      fromState: 'draft',
      toState: 'pending_payment',
      event: 'submit',
    };
    expect(result).toBeDefined();
  });
});

describe('TD-403 — HookResult type 應可被 production hook 使用', () => {
  it('HookResult<T> 應在 typecheck 中可用 (避免 import 錯誤)', () => {
    // 此測試驗證 HookResult 已被 export (紅階段此測試會在 typecheck 失敗)
    // 若已 export,此測試只是 runtime 簡單斷言
    const _check: HookResult<'beforeCreate'> = { data: 'ok' };
    expect(_check).toBeDefined();
  });
});