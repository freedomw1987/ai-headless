/**
 * GET /api/extensions
 *
 * 列出所有已安裝的 Extensions
 */

import { listInstalledExtensions } from '@/lib/extensions/extension-manager';

export async function GET() {
  try {
    const extensions = await listInstalledExtensions();

    return Response.json({
      status: 200,
      data: extensions,
    });
  } catch (err) {
    return Response.json(
      {
        status: 500,
        error: err instanceof Error ? err.message : 'Unknown error',
        data: [],
      },
      { status: 500 },
    );
  }
}