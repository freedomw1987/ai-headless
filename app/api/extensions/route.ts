/**
 * GET /api/extensions
 *
 * 列出所有已安裝的 Extensions
 */

import { listInstalledExtensions } from '@/lib/extensions/extension-manager';

export async function GET() {
  const extensions = listInstalledExtensions();

  return Response.json({
    status: 200,
    data: extensions,
  });
}