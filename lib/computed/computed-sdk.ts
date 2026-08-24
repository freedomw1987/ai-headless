/**
 * ==============================================
 *  Computed SDK — 動態計算欄位框架
 * ==============================================
 *
 * 對應：docs/specs/json-spec.md §3.9
 *
 * Computed Field 是根據其他欄位動態計算的虛擬欄位：
 * - totalPrice = subtotal * (1 + taxRate)
 * - discount = subtotal * discountRate
 * - fullName = firstName + lastName
 *
 * 與 Hook/Action 對比：
 * - Hook = 自動觸發（生命週期事件）
 * - Action = 手動觸發（按鈕）
 * - Computed = 派生欄位（讀取時計算，可快取）
 *
 * Computed 特點：
 * - 有依賴（dependencies）用於 cache invalidation
 * - 同一 record 重複讀取可命中 cache
 * - 支援多級 computed（A → B → C）
 */

import type { FieldType } from '@/lib/specs/json-spec.types';
import { parseHookReference } from '@/lib/hooks/hook-sdk';

// ==============================================
// 1. ComputedField 類型（對應 JSON Spec §3.9）
// ==============================================

export type ComputedField = {
  /** 欄位名 */
  name: string;
  /** 返回類型 */
  type: FieldType;
  /** 引用 {{fn:函數名}} */
  compute: string;
  /** 依賴的欄位（用於 cache 失效） */
  dependencies?: string[];
};

// ==============================================
// 2. ComputeFunction 簽名
// ==============================================

export type ComputedContext = {
  /** 整筆 record */
  record: Record<string, unknown>;
};

export type ComputeFunction<TReturn = unknown> = (
  record: Record<string, unknown>,
  ctx: ComputedContext,
) => TReturn;

// ==============================================
// 3. Computed Registry
// ==============================================

type RegistryEntry = {
  field: ComputedField;
  fn: ComputeFunction;
};

type CacheEntry = {
  value: unknown;
};

export type ComputedRegistry = {
  register(field: ComputedField, fn: ComputeFunction): void;
  has(name: string): boolean;
  invoke<TReturn = unknown>(name: string, ctx: ComputedContext): TReturn;
  clearCache(): void;
  clear(): void;
  list(): string[];
};

export function createComputedRegistry(): ComputedRegistry {
  const entries = new Map<string, RegistryEntry>();
  const cache = new Map<string, CacheEntry>();

  function hashRecord(record: Record<string, unknown>): string {
    // 簡單 JSON.stringify 雜湊（生產環境可換更高效能算法）
    return JSON.stringify(record, Object.keys(record).sort());
  }

  return {
    register(field: ComputedField, fn: ComputeFunction): void {
      // 用 compute 函數名作 key（與 ref-resolver 引用驗證一致）
      const key = field.compute;
      if (entries.has(key)) {
        throw new Error(`Computed '${key}' is already registered`);
      }
      entries.set(key, { field, fn });
    },

    has(name: string): boolean {
      return entries.has(name);
    },

    invoke<TReturn = unknown>(name: string, ctx: ComputedContext): TReturn {
      const entry = entries.get(name);
      if (!entry) {
        throw new Error(`Computed '${name}' not found in registry`);
      }

      // Cache key: name + record 雜湊
      const recordHash = hashRecord(ctx.record);
      const cacheKey = `${name}::${recordHash}`;

      const cached = cache.get(cacheKey);
      if (cached) {
        return cached.value as TReturn;
      }

      const value = entry.fn(ctx.record, ctx);
      cache.set(cacheKey, { value });
      return value as TReturn;
    },

    clearCache(): void {
      cache.clear();
    },

    clear(): void {
      entries.clear();
      cache.clear();
    },

    list(): string[] {
      return Array.from(entries.keys());
    },
  };
}

// ==============================================
// 4. Global Computed Registry
// ==============================================

let _globalComputedRegistry: ComputedRegistry | null = null;

function getGlobalComputedRegistry(): ComputedRegistry {
  if (!_globalComputedRegistry) {
    _globalComputedRegistry = createComputedRegistry();
  }
  return _globalComputedRegistry;
}

export function registerComputed(
  field: ComputedField,
  fn: ComputeFunction,
): void {
  getGlobalComputedRegistry().register(field, fn);
}

export function hasComputed(name: string): boolean {
  return getGlobalComputedRegistry().has(name);
}

export function invokeComputed<TReturn = unknown>(
  name: string,
  ctx: ComputedContext,
): TReturn {
  return getGlobalComputedRegistry().invoke<TReturn>(name, ctx);
}

export function clearComputedCache(): void {
  if (_globalComputedRegistry) {
    _globalComputedRegistry.clearCache();
  }
}

export function resetComputed(): void {
  if (_globalComputedRegistry) {
    _globalComputedRegistry.clear();
  }
}

// ==============================================
// 5. 解析工具
// ==============================================

/**
 * 從 compute 字段提取實際函數名
 *
 * - "{{fn:myCompute}}" → "myCompute"
 * - "myCompute" → "myCompute"
 */
export function resolveComputedName(compute: string): string | null {
  if (!compute) return null;
  const parsed = parseHookReference(compute);
  return parsed ?? compute;
}

/**
 * 檢查 record 是否包含某 computed field 的所有依賴
 */
export function hasDependencies(
  field: ComputedField,
  record: Record<string, unknown>,
): boolean {
  if (!field.dependencies || field.dependencies.length === 0) return true;
  return field.dependencies.every((dep) => dep in record);
}