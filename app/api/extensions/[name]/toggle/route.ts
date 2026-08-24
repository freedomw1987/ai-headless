/**
 * POST /api/extensions/[name]/toggle
 *
 * 切換 Extension 啟用/停用狀態（TD-405: Prisma 持久化）
 */

import { toggleExtension } from '@/lib/extensions/extension-manager';

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;
  const newEnabled = await toggleExtension(name);

  if (newEnabled === null) {
    return Response.json(
      { status: 404, error: `Extension '${name}' not found` },
      { status: 404 },
    );
  }

  return Response.json({
    status: 200,
    data: { name, enabled: newEnabled },
    message: `Extension '${name}' ${newEnabled ? 'enabled' : 'disabled'}`,
  });
}
