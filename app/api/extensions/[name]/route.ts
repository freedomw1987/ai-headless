/**
 * GET /api/extensions/[name]
 *
 * 取得單個 Extension 詳細資訊（TD-405: Prisma 持久化）
 */

import { getExtensionDetail } from '@/lib/extensions/extension-manager';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;
  const detail = await getExtensionDetail(name);

  if (!detail) {
    return Response.json(
      { status: 404, error: `Extension '${name}' not found` },
      { status: 404 },
    );
  }

  return Response.json({ status: 200, data: detail });
}
