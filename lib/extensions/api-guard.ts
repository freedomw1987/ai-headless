/**
 * Extension API Guard — 共用 helper
 *
 * 用法：
 * ```ts
 * export async function POST(req: NextRequest) {
 *   const guard = await guardExtensionApi('blog');
 *   if (guard) return guard; // 403 response
 *   // ... continue
 * }
 * ```
 */

import { NextResponse } from 'next/server';
import { isExtensionEnabledByName } from '@/lib/extensions/extension-enabled';

/**
 * 檢查 extension 是否啟用，未啟用則回 403。
 * 如果回傳非 null，API route 應立即 return。
 */
export async function guardExtensionApi(
  name: string,
): Promise<NextResponse | null> {
  const enabled = await isExtensionEnabledByName(name);
  if (!enabled) {
    return NextResponse.json(
      {
        error: 'ExtensionDisabled',
        extension: name,
        message: `Extension '${name}' 已停用，無法執行此操作`,
      },
      { status: 403 },
    );
  }
  return null;
}