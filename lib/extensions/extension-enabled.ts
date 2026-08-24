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
 * - DB 沒記錄 → 預設啟用
 * - DB 有記錄 isEnabled=false → 不返回（disabled）
 * - DB 有記錄 isEnabled=true → 返回
 */
const KNOWN_EXTENSIONS = ['blog', 'event', 'todo', 'order'] as const;

export async function listEnabledExtensions(): Promise<string[]> {
  // 查 DB 裡所有有記錄的 extension（不論 enabled）
  const rows = await db.extension.findMany({
    where: { name: { in: [...KNOWN_EXTENSIONS] } },
    select: { name: true, isEnabled: true },
  });
  const dbRecord = new Map(rows.map((r) => [r.name, r.isEnabled]));

  return KNOWN_EXTENSIONS.filter((name) => {
    const isEnabled = dbRecord.get(name);
    // 沒記錄（undefined）→ 預設啟用
    // 有記錄且 isEnabled=true → 啟用
    // 有記錄且 isEnabled=false → 不返回
    return isEnabled === undefined || isEnabled === true;
  });
}