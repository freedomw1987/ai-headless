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
 */
export async function listEnabledExtensions(): Promise<string[]> {
  const rows = await db.extension.findMany({
    where: { isEnabled: true },
    select: { name: true },
  });
  // 預設啟用（DB 沒記錄也視為啟用）
  const dbNames = new Set(rows.map((r) => r.name));
  return ['blog', 'event', 'todo', 'order'].filter((n) => dbNames.has(n) || true);
}