/**
 * ==============================================
 *  Hooks Registry — 集中註冊所有 Extension 的 hooks
 * ==============================================
 *
 * 為什麼需要這個檔？
 * - Sprint 20 P3.5（user 報 bug）：spec 用 `{{fn:beforeCreateEvent}}` 引用 hook，
 *   但 runtime 從未把 `beforeCreateEvent` 函數註冊到 global registry
 * - 結果：所有 extension hooks 從未執行，業務驗證全部失效
 *
 * 修法：
 * - 中央映射表列出「所有現有 hook function」
 * - `registerAllExtensions()` 函式對每個 hook 呼叫 `registerHook`
 * - route.ts setup() 內呼叫 `registerAllExtensions()`（保證 idempotent）
 *
 * 未來改進（記 P3）：
 * - 目前手動維護：加新 hook 要記得加這裡
 * - 理想方案：自動從 extensions 目錄下的 manifest.json 掃描 + 從 hooks/*.ts 動態 import
 *   （需要 filesystem 讀取 + 路徑推導，複雜度較高）
 */

import { registerHook } from '@/lib/hooks/hook-sdk';

// Event extension
import { beforeCreateEvent } from '@/extensions/event/hooks/before-create';
import { beforeRegister } from '@/extensions/event/hooks/before-register';

// Blog extension
import { beforeCreateBlogPost } from '@/extensions/blog/hooks/before-create';

// Todo extension
import { beforeCreateTodo } from '@/extensions/todo/hooks/before-create';

/**
 * 註冊所有 Extension 的 hooks 到 global registry
 *
 * Idempotent：重複呼叫安全（registerHook 內部 has() 檢查，第二次會跳過）
 * 用 try/catch 包每個 registerHook，容忍「already registered」錯誤（dev hot reload 場景）
 */
export function registerAllExtensions(): void {
  // Event hooks
  safeRegister('beforeCreateEvent', beforeCreateEvent);
  safeRegister('beforeRegister', beforeRegister);

  // Blog hooks
  safeRegister('beforeCreateBlogPost', beforeCreateBlogPost);

  // Todo hooks
  safeRegister('beforeCreateTodo', beforeCreateTodo);
}

/**
 * 安全註冊：容忍「already registered」錯誤
 * 其他錯誤（import 失敗、模組錯誤）仍會拋出
 */
function safeRegister(name: string, fn: unknown): void {
  try {
    registerHook(name, fn as Parameters<typeof registerHook>[1]);
  } catch (e) {
    if (e instanceof Error && e.message.includes('already registered')) {
      // dev hot reload 場景 — 已註冊過，跳過
      return;
    }
    throw e;
  }
}