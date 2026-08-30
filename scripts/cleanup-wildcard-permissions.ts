// TD-911 — 清理 DB 中已存在的 * wildcard permissions
// 用法: pnpm exec tsx scripts/cleanup-wildcard-permissions.ts
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  // 先列出
  const before = await db.permission.findMany({
    where: { code: '*' },
    select: { id: true, roleId: true },
  });
  console.log(`找到 ${before.length} 個 * wildcard permissions`);

  if (before.length === 0) {
    console.log('不需要清理');
    return;
  }

  // 刪除
  const result = await db.permission.deleteMany({
    where: { code: '*' },
  });
  console.log(`已刪除 ${result.count} 個 * wildcard permissions`);

  // 列出受影響的 roles（提示）
  const roleIds = [...new Set(before.map((p) => p.roleId))];
  for (const roleId of roleIds) {
    const role = await db.role.findUnique({
      where: { id: roleId },
      select: { name: true, displayName: true },
    });
    console.log(`  - ${role?.displayName ?? roleId}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());