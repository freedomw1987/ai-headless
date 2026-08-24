/**
 * Extension Enabled Helper — Server / API 端判斷 Extension 是否啟用
 *
 * 用法：
 * - Server Component: import { isExtensionEnabledByName } 來 guard page
 * - API Route: 同上，guard API
 *
 * 與 lib/extensions/extension-manager.ts 的差別：
 * - 那個模組包含 filesystem scan + manifest 讀取（較重）
 * - 這裡只查 Prisma Extension table（輕量、適合 Server Component 重複呼叫）
 */

import { db } from '@/lib/db';

export async function isExtensionEnabledByName(name: string): Promise<boolean> {
  const row = await db.extension.findUnique({
    where: { name },
    select: { isEnabled: true },
  });
  return row?.isEnabled ?? true; // 預設啟用
}

/**
 * 取得所有啟用的 extensions（Sidebar 用）
 *
 * 設計：
 * - 只查 4 個已知的 extension（blog/event/todo/order）
 * - DB 有記錄且 isEnabled=true → 返回
 * - DB 有記錄且 isEnabled=false → 不返回（disabled）
 * - DB 沒記錄 → 不返回（沒安裝）
 *
 * 為什麼改設計：
 * - 之前「沒記錄 → 預設啟用」造成「Order 沒 manifest，但 sidebar 一直顯示」
 * - 「沒安裝」和「已啟用」是不同概念，沒安裝不應視為啟用
 *
 * 注意：
 * - 對應「剛建立的 extension（沒人按過 toggle）」的情境：
 *   extension-manager 的 toggleExtension() 會做 upsert，
 *   所以首次 toggle 後才會有記錄。但首次 toggle 之前，
 *   extension-manager.listInstalledExtensions() 仍會列出（filesystem 為 source of truth）。
 * - Sidebar 應該看 DB（manifest 必須存在才能被 toggle），確保一致性
 */
const KNOWN_EXTENSIONS = ['blog', 'event', 'todo', 'order'] as const;

export async function listEnabledExtensions(): Promise<string[]> {
  const rows = await db.extension.findMany({
    where: { name: { in: [...KNOWN_EXTENSIONS] } },
    select: { name: true, isEnabled: true },
  });
  // 只返回 DB 有記錄且 enabled 的
  return rows.filter((r) => r.isEnabled).map((r) => r.name);
}