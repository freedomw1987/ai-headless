/**
 * ==============================================
 *  Master Seed Entry Point
 * ==============================================
 *
 * 統一所有 seed 入口,搭配 `pnpm db:seed` 與 Prisma migrate deploy 流程
 *
 * 對應 PRD：docs/prd/09-rbac.md §5.3
 *
 * 執行流程:
 * 1. seed-users  → 建立/確認 admin/editor/viewer demo 帳號
 * 2. seed-rbac   → 建立內建 3 個 role + permissions
 * 3. seed-orders → 建立 3 個 demo orders (覆蓋 lifecycle)
 *
 * 注意: baseline migration (20260826120100_seed_baseline_rbac) 已建立
 * 內建 role/permission. 此處 seed-rbac 為 idempotent 重複執行保險.
 */

import { PrismaClient } from '@prisma/client';

import { hashPassword } from '../lib/auth/password';
import { seedRBAC } from './seed-rbac';
import { seedExtensionPermissions } from './seed-extension-permissions';

const db = new PrismaClient();

async function seedUsers(): Promise<void> {
  const users = [
    { email: 'admin@ai-headless.local', name: 'Default Admin', password: 'admin123', role: 'admin' },
    { email: 'editor@ai-headless.local', name: 'Demo Editor', password: 'editor123', role: 'editor' },
    { email: 'viewer@ai-headless.local', name: 'Demo Viewer', password: 'viewer123', role: 'viewer' },
  ];

  for (const u of users) {
    // 查找對應 role id (Phase 2 動態 RBAC)
    const roleRecord = await db.role.findUnique({ where: { name: u.role } });
    const roleId = roleRecord?.id;

    const existing = await db.user.findUnique({ where: { email: u.email } });
    if (existing) {
      // Backfill roleId 若為 null (Sprint 21 修正: TD-1)
      if (!existing.roleId && roleId) {
        await db.user.update({
          where: { email: u.email },
          data: { roleId },
        });
        console.log(`✅ ${u.email} 已 backfill roleId`);
      } else {
        console.log(`✅ ${u.email} 已存在 (role: ${existing.role}, roleId: ${existing.roleId ?? 'null'})`);
      }
      continue;
    }
    const passwordHash = await hashPassword(u.password);
    await db.user.create({
      data: {
        email: u.email,
        name: u.name,
        passwordHash,
        role: u.role,
        roleId,
        isActive: true,
      },
    });
    console.log(`✅ 建立了 ${u.email} (roleId: ${roleId})`);
  }
}

async function seedOrders(): Promise<void> {
  const orders = [
    { orderNumber: 'O-001', customer: 'Alice', amount: 1000, status: 'draft' },
    { orderNumber: 'O-002', customer: 'Bob', amount: 2500, status: 'pending_payment' },
    { orderNumber: 'O-003', customer: 'Carol', amount: 4200, status: 'paid' },
  ];

  await db.order.deleteMany({
    where: { orderNumber: { in: orders.map((o) => o.orderNumber) } },
  });

  for (const o of orders) {
    await db.order.create({ data: o });
  }
  console.log(`✅ 建立 ${orders.length} 個 demo orders`);
}

async function main(): Promise<void> {
  console.log('🌱 開始 seed...\n');
  await seedUsers();
  await seedRBAC(db);
  await seedExtensionPermissions(db);
  await seedOrders();
  console.log('\n✅ Seed 完成');
  console.log('   admin@ai-headless.local / admin123   (role: admin)');
  console.log('   editor@ai-headless.local / editor123  (role: editor)');
  console.log('   viewer@ai-headless.local / viewer123  (role: viewer)');
  console.log('\n⚠️  正式部署前務必修改這些預設密碼！');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });