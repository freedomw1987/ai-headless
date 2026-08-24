/**
 * Extension Page Guard — 共用元件
 *
 * 用法：
 * ```tsx
 * export default async function BlogPage() {
 *   const enabled = await guardExtensionOrRedirect('blog');
 *   // ... continue
 * }
 * ```
 */

import { redirect } from 'next/navigation';
import { isExtensionEnabledByName } from '@/lib/extensions/extension-enabled';

/**
 * 檢查 extension 是否啟用，未啟用則 redirect 到 /admin
 * 回傳 boolean（已保證為 true）
 */
export async function guardExtensionOrRedirect(name: string): Promise<true> {
  const enabled = await isExtensionEnabledByName(name);
  if (!enabled) {
    redirect('/admin');
  }
  return true;
}