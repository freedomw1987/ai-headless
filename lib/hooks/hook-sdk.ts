/**
 * ==============================================
 *  Hook SDK — 11 種 Hook + Runtime + Registry
 * ==============================================
 *
 * 對應：docs/specs/json-spec.md §3.6
 *
 * 11 種 Hook：
 * - 生命週期：beforeCreate / afterCreate / beforeUpdate / afterUpdate /
 *   beforeDelete / afterDelete
 * - 狀態機：onTransition
 * - 查詢：beforeList / afterList / beforeRead / afterRead
 *
 * Hook 引用語法：{{fn:函數名稱}}
 * 框架透過 parseHookReference() 解析並自動 invokeHook()
 */

// ==============================================
// 1. Hook 名稱常量
// ==============================================

export const HOOK_NAMES = [
  'beforeCreate',
  'afterCreate',
  'beforeUpdate',
  'afterUpdate',
  'beforeDelete',
  'afterDelete',
  'onTransition',
  'beforeList',
  'afterList',
  'beforeRead',
  'afterRead',
] as const;

export type HookName = (typeof HOOK_NAMES)[number];

// ==============================================
// 2. Hook Context（每種 hook 接收的參數）
// ==============================================

export type HookContext<T extends HookName> = T extends 'beforeCreate'
  ? { data: Record<string, unknown>; model?: string; ctx?: Record<string, unknown> }
  : T extends 'afterCreate'
    ? { result: Record<string, unknown>; model?: string; ctx?: Record<string, unknown> }
    : T extends 'beforeUpdate'
      ? {
          id: string;
          data: Record<string, unknown>;
          existing: Record<string, unknown>;
          model?: string;
          ctx?: Record<string, unknown>;
        }
      : T extends 'afterUpdate'
        ? {
            id: string;
            data: Record<string, unknown>;
            existing: Record<string, unknown>;
            model?: string;
            ctx?: Record<string, unknown>;
          }
        : T extends 'beforeDelete'
          ? {
              id: string;
              existing: Record<string, unknown>;
              model?: string;
              ctx?: Record<string, unknown>;
            }
          : T extends 'afterDelete'
            ? {
                id: string;
                existing: Record<string, unknown>;
                model?: string;
                ctx?: Record<string, unknown>;
              }
            : T extends 'onTransition'
              ? {
                  fromState: string;
                  toState: string;
                  data: Record<string, unknown>;
                  model?: string;
                  ctx?: Record<string, unknown>;
                }
              : T extends 'beforeList'
                ? {
                    query: Record<string, unknown>;
                    model?: string;
                    ctx?: Record<string, unknown>;
                  }
                : T extends 'afterList'
                  ? {
                      result: Record<string, unknown>[];
                      model?: string;
                      ctx?: Record<string, unknown>;
                    }
                  : T extends 'beforeRead'
                    ? { id: string; model?: string; ctx?: Record<string, unknown> }
                    : T extends 'afterRead'
                      ? {
                          data: Record<string, unknown>;
                          model?: string;
                          ctx?: Record<string, unknown>;
                        }
                      : never;

// ==============================================
// 3. HookFunction（同步或異步，返回修改後的 context）
// ==============================================

export type HookFunction<T = unknown> = (ctx: T) => Promise<T> | T;

// ==============================================
// 4. HookRegistry（實例級）
// ==============================================

export type HookRegistry = {
  register<T = unknown>(name: string, fn: HookFunction<T>): void;
  has(name: string): boolean;
  invoke<T = unknown>(name: string, context: T): Promise<T>;
  clear(): void;
  list(): string[];
};

export function createHookRegistry(): HookRegistry {
  const hooks = new Map<string, HookFunction>();

  return {
    register<T = unknown>(name: string, fn: HookFunction<T>): void {
      if (hooks.has(name)) {
        throw new Error(`Hook '${name}' is already registered`);
      }
      hooks.set(name, fn as HookFunction);
    },

    has(name: string): boolean {
      return hooks.has(name);
    },

    async invoke<T = unknown>(name: string, context: T): Promise<T> {
      const fn = hooks.get(name);
      if (!fn) {
        throw new Error(`Hook '${name}' not found in registry`);
      }
      return (await fn(context)) as T;
    },

    clear(): void {
      hooks.clear();
    },

    list(): string[] {
      return Array.from(hooks.keys());
    },
  };
}

// ==============================================
// 5. Global Hook Registry（模組級 singleton）
// ==============================================

let _globalRegistry: HookRegistry | null = null;

function getGlobalRegistry(): HookRegistry {
  if (!_globalRegistry) {
    _globalRegistry = createHookRegistry();
  }
  return _globalRegistry;
}

export function registerHook<T = unknown>(name: string, fn: HookFunction<T>): void {
  getGlobalRegistry().register(name, fn);
}

export function hasHook(name: string): boolean {
  return getGlobalRegistry().has(name);
}

export async function invokeHook<T = unknown>(name: string, context: T): Promise<T> {
  return getGlobalRegistry().invoke(name, context);
}

export function resetHooks(): void {
  if (_globalRegistry) {
    _globalRegistry.clear();
  }
}

// ==============================================
// 6. Hook Reference Parser（TD-301 整合）
// ==============================================

/**
 * 解析 {{fn:函數名稱}} 引用
 * - 合法：{{fn:myHook}} / {{ fn: myHook }}
 * - 非法：純函數名、{{fn:}}、{{other:x}}
 */
export function parseHookReference(value: string): string | null {
  if (!value || typeof value !== 'string') return null;

  // 匹配 {{ fn: name }} 或 {{fn:name}}（允許空格）
  const match = value.match(/^\{\{\s*fn\s*:\s*([^}]+?)\s*\}\}$/);
  if (!match) return null;

  const name = match[1]?.trim() ?? '';
  if (!name) return null;

  return name;
}

export function isHookReference(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  return parseHookReference(value) !== null;
}

/**
 * 從 JSON 規範的 hook 字段提取函數名
 * - 如果是 {{fn:...}} 格式，解析並返回函數名
 * - 否則原樣返回（直接作為函數名）
 */
export function resolveHookName(value: string | undefined | null): string | null {
  if (!value) return null;
  const parsed = parseHookReference(value);
  return parsed ?? value;
}