/**
 * Sprint 15 TECH-040 — Extension 名稱推導 helper
 *
 * 設計：
 * - 大多數 spec 的名稱 = extension 名稱（如 blog / event / order / todo）
 * - 允許 spec 顯式 override（requiresExtension 欄位）
 * - 預設 fallback: spec.name
 *
 * 為何不在 spec-loader 自動補上 requiresExtension？
 * - 保持 spec.json 乾淨（single source of truth 概念）
 * - helper 是純函數，無 side effect、易測試
 * - 如果 spec 載入後任何地方都要 requiresExtension 字段，會污染 spec-loader
 *
 * 用法：
 * - lib/runtime/dynamic-handler.ts checkDisabled
 * - app/admin/crud/[spec]/page.tsx（disable guard）
 * - app/admin/crud/[spec]/[id]/page.tsx
 * - app/admin/crud/[spec]/new/page.tsx
 */

import type { JsonSpec } from '@/lib/specs/json-spec.types';

/**
 * 取得 spec 對應的 extension 名稱
 *
 * 規則：
 * 1. spec.requiresExtension 顯式設定 → 用該值
 * 2. 否則 → fallback 到 spec.name
 *
 * @example
 * ```ts
 * getRequiredExtension({ name: 'blog' })
 * // => 'blog'
 *
 * getRequiredExtension({ name: 'blogPost', requiresExtension: 'blog' })
 * // => 'blog'（罕見：spec 名稱跟 extension 名稱不同）
 * ```
 */
export function getRequiredExtension(spec: JsonSpec): string {
  return spec.requiresExtension ?? spec.name;
}
