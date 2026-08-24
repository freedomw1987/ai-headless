/**
 * ==============================================
 *  Extension Runtime — Hook Entry
 * ==============================================
 *
 * 框架 runtime 入口（API Generator 生成的代碼會 import 這裡）
 *
 * 對應：docs/specs/json-spec.md §3.6 + docs/specs/extension-spec.md §4.3
 *
 * 生成的代碼呼叫 `invokeHook('hookName', ctx)`，
 * 這裡負責查找 global registry 並執行 Extension 註冊的 hook 函數。
 */

export {
  invokeHook,
  registerHook,
  hasHook,
  resetHooks,
  parseHookReference,
  isHookReference,
  resolveHookName,
  HOOK_NAMES,
} from '@/lib/hooks/hook-sdk';

export type { HookContext, HookName, HookFunction, HookRegistry } from '@/lib/hooks/hook-sdk';
import { invokeHook as _invokeHook } from '@/lib/hooks/hook-sdk';
import type { HookContext, HookName } from '@/lib/hooks/hook-sdk';

/**
 * 鏈式執行多個 Hook（pipeline 模式）
 *
 * 順序執行多個 hook function，每個 hook 的輸出是下一個 hook 的輸入。
 * 任一 hook 拋出錯誤時立即中斷並 reject。
 */
export async function runHookChain<T extends HookContext<HookName>>(
  hookNames: string[],
  initialContext: T,
): Promise<T> {
  let ctx = initialContext;
  for (const name of hookNames) {
    if (!name) continue;
    ctx = await _invokeHook<T>(name, ctx);
  }
  return ctx;
}