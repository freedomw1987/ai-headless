/**
 * Seed Orders — Demo 訂單
 *
 * 用法：pnpm tsx prisma/seed-orders.ts
 *
 * 建立 3 個 demo 訂單，覆蓋生命週期：
 * - O-001: draft（剛建立）
 * - O-002: pending_payment（已提交待付款）
 * - O-003: paid（已付款待出貨）
 */

import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  console.log('🌱 Seeding demo orders...');

  // 刪除舊 demo orders
  await db.order.deleteMany({
    where: {
      orderNumber: { in: ['O-001', 'O-002', 'O-003'] },
    },
  });

  // 建立 O-001: draft
  const o1 = await db.order.create({
    data: {
      orderNumber: 'O-001',
      customer: 'Alice',
      amount: 50000, // $500.00
      status: 'draft',
      stateData: {},
    },
  });
  console.log(`  ✅ ${o1.orderNumber}: draft`);

  // 建立 O-002: pending_payment
  const o2 = await db.order.create({
    data: {
      orderNumber: 'O-002',
      customer: 'Bob',
      amount: 120000, // $1,200.00
      status: 'pending_payment',
      stateData: { submittedAt: '2026-08-24T09:00:00Z' },
    },
  });
  console.log(`  ✅ ${o2.orderNumber}: pending_payment`);

  // 建立 O-003: paid
  const o3 = await db.order.create({
    data: {
      orderNumber: 'O-003',
      customer: 'Charlie',
      amount: 88000, // $880.00
      status: 'paid',
      stateData: {
        submittedAt: '2026-08-23T10:00:00Z',
        paidAt: '2026-08-23T10:30:00Z',
      },
    },
  });
  console.log(`  ✅ ${o3.orderNumber}: paid`);

  console.log(`\n🎉 Done! Created ${3} demo orders`);
  console.log('\n現在可以：');
  console.log('  1. 啟動 pnpm dev');
  console.log('  2. 登入 admin → /admin/crud/order');
  console.log('  3. 點任一訂單詳情 → 按狀態切換按鈕');
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });