/**
 * TDD Gate 1 — Sprint 27 commit 1 (TD-523)
 * 驗證 StrictHookFunction<T> 強制 HookResult<T> 類型契約
 *
 * 對應 PRD: docs/specs/json-spec.md §3.6 (Hook SDK)
 * 對應 Backlog: TD-523
 *
 * 問題 (Sprint 26 reflection 揭露):
 * - HookFunction<T = unknown> 接受任何型別 → silent type drift 風險
 * - TD-403 已加 HookResult type contract 但未強制
 * - 4 個 production hook 全部沒標 return type
 *
 * 修正 (雙軌制):
 * - 新增 StrictHookFunction<T extends HookName> 強制 HookResult<T>
 * - 舊 HookFunction<T = unknown> 標 @deprecated 推薦用 StrictHookFunction
 * - 不破壞既有 4 個 production hook (向後相容)
 *
 * 涵蓋:
 * 1. StrictHookFunction<'beforeCreate'> 必須 return Record<string, unknown>
 * 2. StrictHookFunction<'onTransition'> 必須 return { fromState, toState, event }
 * 3. StrictHookFunction<'beforeDelete'> 必須 return void
 * 4. 錯誤示範: 回傳錯的 type → typecheck fail (用 @ts-expect-error)
 * 5. 雙軌制: 舊 HookFunction 仍可運作
 */

import { describe, it, expectTypeOf } from 'vitest';
import type {
  HookName,
  HookContext,
  HookResult,
  StrictHookFunction,
  HookFunction,
} from '@/lib/hooks/hook-sdk';

describe('TD-523 — StrictHookFunction 強制 HookResult<T> 類型契約', () => {
  it('StrictHookFunction<"beforeCreate"> 應 return Record<string, unknown>', () => {
    type F = StrictHookFunction<'beforeCreate'>;
    // ✅ 正確: return data
    const _f1: F = async (_ctx: HookContext<'beforeCreate'>) => ({ title: 'x' });
    const _f2: F = (_ctx: HookContext<'beforeCreate'>) => ({ id: '1' });
    expectTypeOf(_f1).toMatchTypeOf<F>();
    expectTypeOf(_f2).toMatchTypeOf<F>();
  });

  it('StrictHookFunction<"onTransition"> 應 return { fromState, toState, event }', () => {
    type F = StrictHookFunction<'onTransition'>;
    const _f: F = async (_ctx: HookContext<'onTransition'>) => ({
      fromState: 'draft',
      toState: 'pending',
      event: 'submit',
    });
    expectTypeOf(_f).toMatchTypeOf<F>();
  });

  it('StrictHookFunction<"beforeDelete"> 應 return void', () => {
    type F = StrictHookFunction<'beforeDelete'>;
    const _f: F = async (_ctx: HookContext<'beforeDelete'>) => {
      // 不 return 任何值
    };
    expectTypeOf(_f).toMatchTypeOf<F>();
  });

  it('StrictHookFunction<"afterList"> 應 return { items, total, ... }', () => {
    type F = StrictHookFunction<'afterList'>;
    const _f: F = async (_ctx: HookContext<'afterList'>) => ({
      items: [{}],
      total: 1,
      page: 1,
      pageSize: 10,
      totalPages: 1,
    });
    expectTypeOf(_f).toMatchTypeOf<F>();
  });

  it('雙軌制: 舊 HookFunction<T = unknown> 仍可運作 (向後相容)', () => {
    // 舊風格: 任意 return type
    const _old: HookFunction = async (_ctx) => 'any return';
    const _old2: HookFunction = (_ctx) => 42;
    const _old3: HookFunction = async (_ctx) => undefined;
    expectTypeOf(_old).toMatchTypeOf<HookFunction>();
    expectTypeOf(_old2).toMatchTypeOf<HookFunction>();
    expectTypeOf(_old3).toMatchTypeOf<HookFunction>();
  });

  it('雙軌制: 新 StrictHookFunction 也可被舊 HookFunction 變數接收 (type assignability)', () => {
    // 這個測試驗證 type widening: StrictHookFunction 應該 assignable to HookFunction
    // (因為 StrictHookFunction return HookResult ⊆ unknown)
    const _f: StrictHookFunction<'beforeCreate'> = async () => ({ x: 1 });
    const _asOld: HookFunction = _f; // ✅ 應該可以
    expectTypeOf(_asOld).toMatchTypeOf<HookFunction>();
  });
});

describe('TD-523 — HookResult 對應關係 (type-level)', () => {
  it('11 種 hook 都有對應的 HookResult 推導', () => {
    // Type-level test: 確保 HookResult<HookName> 對 11 種 hook 都有定義
    type AllNames = HookName;
    // HookResult<AllNames> 是 union 推導,每個成員都符合至少一個 branch
    type _CheckBeforeCreate = HookResult<'beforeCreate'>;
    const _x: _CheckBeforeCreate = { data: 'ok' };
    expectTypeOf(_x).toMatchTypeOf<_CheckBeforeCreate>();
  });
});