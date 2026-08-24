/**
 * ==============================================
 *  Extension Runtime — Action Entry
 * ==============================================
 *
 * 框架 runtime 入口（API Generator 生成的代碼會 import 這裡）
 *
 * 對應：docs/specs/extension-spec.md §4.4
 */

export {
  invokeAction,
  registerAction,
  hasAction,
  resetActions,
  resolveActionHandler,
  isActionAvailable,
} from '@/lib/actions/action-sdk';

export type {
  Action,
  ActionContext,
  ActionResult,
  ActionHandler,
  ActionRegistry,
  ActionVariant,
  InvokeActionOptions,
} from '@/lib/actions/action-sdk';