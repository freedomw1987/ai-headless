/**
 * ==============================================
 *  Action SDK — 自定義動作框架
 * ==============================================
 *
 * 對應：docs/specs/json-spec.md §3.7
 *
 * Action 是 Extension 提供給用戶的**手動操作按鈕**，例如：
 * - markAsPaid（標記為已付款）
 * - cancelOrder（取消訂單）
 * - approveRequest（批准申請）
 *
 * 與 Hook 不同：
 * - Hook = 自動觸發（生命週期事件）
 * - Action = 手動觸發（用戶點按鈕）
 *
 * Action 流程：
 *   UI 按鈕 → invokeAction(name, ctx, opts)
 *      → Zod schema 驗證 input
 *      → 查找 global registry 的 handler
 *      → 執行 handler（sync/async）
 *      → 返回 ActionResult
 */

import type { z } from 'zod';
import { parseHookReference } from '@/lib/hooks/hook-sdk';

// ==============================================
// 1. Action 類型（對應 JSON Spec §3.7）
// ==============================================

export type ActionVariant = 'default' | 'danger' | 'primary';

export type Action = {
  /** 動作唯一 ID（kebab-case） */
  name: string;
  /** 顯示文字 */
  label: string;
  /** 描述（hover tooltip） */
  description?: string;
  /** 引用 {{fn:函數名}} */
  implementation: string;
  /** 危險操作的確認訊息 */
  confirmation?: string;
  /** 觸發條件 */
  requires?: {
    state?: string[];
    permission?: string;
  };
  /** Lucide 圖標名 */
  icon?: string;
  /** 按鈕樣式 */
  variant?: ActionVariant;
};

// ==============================================
// 2. Action Handler 簽名
// ==============================================

export type ActionContext = {
  /** 當前操作的目標資料 */
  data: Record<string, unknown>;
  /** 用戶透過 UI 輸入的參數 */
  input?: Record<string, unknown>;
  /** 所屬 model 名 */
  model?: string;
  /** 框架級 context */
  ctx?: Record<string, unknown>;
};

export type ActionResult<T = Record<string, unknown>> =
  | {
      success: true;
      message?: string;
      data?: T;
      redirect?: string;
    }
  | {
      success: false;
      message?: string;
      error?: string;
    };

export type ActionHandler = (ctx: ActionContext) => Promise<ActionResult> | ActionResult;

// ==============================================
// 3. invokeAction 選項
// ==============================================

export type InvokeActionOptions = {
  /** 用戶輸入的 Zod schema 驗證 */
  inputSchema?: z.ZodSchema;
  /** 用戶輸入值 */
  input?: Record<string, unknown>;
};

// ==============================================
// 4. Action Registry（實例級）
// ==============================================

export type ActionRegistry = {
  register(name: string, handler: ActionHandler): void;
  has(name: string): boolean;
  invoke(
    name: string,
    context: ActionContext,
    options?: InvokeActionOptions,
  ): Promise<ActionResult>;
  clear(): void;
  list(): string[];
};

export function createActionRegistry(): ActionRegistry {
  const handlers = new Map<string, ActionHandler>();

  return {
    register(name: string, handler: ActionHandler): void {
      if (handlers.has(name)) {
        throw new Error(`Action '${name}' is already registered`);
      }
      handlers.set(name, handler);
    },

    has(name: string): boolean {
      return handlers.has(name);
    },

    async invoke(
      name: string,
      context: ActionContext,
      options: InvokeActionOptions = {},
    ): Promise<ActionResult> {
      const handler = handlers.get(name);
      if (!handler) {
        throw new Error(`Action '${name}' not found in registry`);
      }

      // Schema 驗證
      if (options.inputSchema && options.input) {
        const parsed = options.inputSchema.safeParse(options.input);
        if (!parsed.success) {
          throw new Error(
            `Validation failed: ${parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`,
          );
        }
      }

      const fullContext: ActionContext = {
        ...context,
        input: options.input ?? {},
      };

      return await handler(fullContext);
    },

    clear(): void {
      handlers.clear();
    },

    list(): string[] {
      return Array.from(handlers.keys());
    },
  };
}

// ==============================================
// 5. Global Action Registry
// ==============================================

let _globalActionRegistry: ActionRegistry | null = null;

function getGlobalActionRegistry(): ActionRegistry {
  if (!_globalActionRegistry) {
    _globalActionRegistry = createActionRegistry();
  }
  return _globalActionRegistry;
}

export function registerAction(name: string, handler: ActionHandler): void {
  getGlobalActionRegistry().register(name, handler);
}

export function hasAction(name: string): boolean {
  return getGlobalActionRegistry().has(name);
}

export async function invokeAction(
  name: string,
  context: ActionContext,
  options?: InvokeActionOptions,
): Promise<ActionResult> {
  return getGlobalActionRegistry().invoke(name, context, options);
}

export function resetActions(): void {
  if (_globalActionRegistry) {
    _globalActionRegistry.clear();
  }
}

// ==============================================
// 6. Action Definition 解析工具
// ==============================================

/**
 * 從 implementation 字段提取實際 handler 名稱
 *
 * - "{{fn:myHandler}}" → "myHandler"
 * - "myHandler" → "myHandler"
 */
export function resolveActionHandler(implementation: string): string | null {
  if (!implementation) return null;
  const parsed = parseHookReference(implementation);
  return parsed ?? implementation;
}

/**
 * 檢查 Action 是否在當前狀態下可用
 */
export function isActionAvailable(
  action: Action,
  context: { currentState?: string; userPermissions?: string[] },
): boolean {
  const requires = action.requires;
  if (!requires) return true;

  if (requires.state && requires.state.length > 0) {
    if (!context.currentState || !requires.state.includes(context.currentState)) {
      return false;
    }
  }

  if (requires.permission) {
    if (!context.userPermissions?.includes(requires.permission)) {
      return false;
    }
  }

  return true;
}