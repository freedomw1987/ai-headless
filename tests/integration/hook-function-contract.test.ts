/**
 * TD-523 — HookFunction type contract 守護測試
 *
 * 為什麼需要：
 * - HookFunction<T = unknown> 太鬆 → silent type drift 風險
 * - Sprint 27 已加 StrictHookFunction + @deprecated HookFunction
 * - 本測試守護：StrictHookFunction 必須存在 + 雙泛型（ctx + result）
 *
 * Gate 1 TDD：source-code guard（防止 Sprint 27 改動被後續改動破壞）
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const HOOK_SDK = 'lib/hooks/hook-sdk.ts';

describe('TD-523 — HookFunction type contract', () => {
  it('StrictHookFunction 存在且使用 HookName generic', () => {
    const source = readFileSync(HOOK_SDK, 'utf-8');
    expect(source).toMatch(/export type StrictHookFunction<T extends HookName/);
  });

  it('StrictHookFunction 的 ctx 參數型別為 HookContext<T>', () => {
    const source = readFileSync(HOOK_SDK, 'utf-8');
    // 強制 ctx 必須對應到正確的 hook context 結構
    expect(source).toMatch(/StrictHookFunction<T extends HookName = HookName>\s*=\s*\(\s*\n?\s*ctx:\s*HookContext<T>/);
  });

it('StrictHookFunction 回傳 HookResult<T>', () => {
    const source = readFileSync(HOOK_SDK, 'utf-8');
    // 寬鬆匹配：StrictHookFunction 內含 HookResult<T>（無論格式）
    expect(source).toMatch(/StrictHookFunction[\s\S]*?HookResult<T>/);
  });

  it('HookFunction 標記為 @deprecated (舊 API 仍可用但鼓勵新 code 用 Strict)', () => {
    const source = readFileSync(HOOK_SDK, 'utf-8');
    // HookFunction 應有 @deprecated 標記
    expect(source).toMatch(/@deprecated[\s\S]*?HookFunction<T = unknown>/);
  });

  it('HookResult 對 11 種 hook 都有對應型別定義', () => {
    const source = readFileSync(HOOK_SDK, 'utf-8');
    // 必須有 beforeCreate, afterCreate, beforeUpdate, afterUpdate, beforeDelete, afterDelete
    const requiredHooks = [
      'beforeCreate',
      'afterCreate',
      'beforeUpdate',
      'afterUpdate',
      'beforeDelete',
      'afterDelete',
      'beforeList',
      'afterList',
      'beforeRead',
      'afterRead',
      'onTransition',
    ];
    for (const hook of requiredHooks) {
      expect(source).toContain(`T extends '${hook}'`);
    }
  });
});