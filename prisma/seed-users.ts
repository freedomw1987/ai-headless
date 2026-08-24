/**
 * ==============================================
 *  US-102 — User Seed Script
 * ==============================================
 *
 * 建立預設 admin 帳號：
 * - Email: admin@ai-headless.local
 * - Password: admin123
 * - Role: admin
 *
 * 用法：pnpm tsx prisma/seed-users.ts
 *
 * 注意：這是 dev/demo 用途。正式環境務必改密碼。
 */

import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../lib/auth/password';

const db = new PrismaClient();

async function main() {
  const adminEmail = 'admin@ai-headless.local';
  const adminPassword = 'admin123';

  // 檢查是否已存在
  const existing = await db.user.findUnique({ where: { email: adminEmail } });
  if (existing) {
    console.log(`✅ Admin user already exists: ${adminEmail}`);
    console.log(`   Role: ${existing.role}, isActive: ${existing.isActive}`);
    return;
  }

  const passwordHash = await hashPassword(adminPassword);

  const admin2 = await db.user.create({
    data: {
      email: adminEmail,
      name: 'Default Admin',
      passwordHash,
      role: 'admin',
      isActive: true,
    },
  });

  // 同時建一個 editor 和 viewer demo 帳號
  const editorHash = await hashPassword('editor123');
  await db.user.create({
    data: {
      email: 'editor@ai-headless.local',
      name: 'Demo Editor',
      passwordHash: editorHash,
      role: 'editor',
      isActive: true,
    },
  });

  const viewerHash = await hashPassword('viewer123');
  await db.user.create({
    data: {
      email: 'viewer@ai-headless.local',
      name: 'Demo Viewer',
      passwordHash: viewerHash,
      role: 'viewer',
      isActive: true,
    },
  });

  console.log('✅ Seeded users:');
  console.log(`   admin@ai-headless.local  / admin123   (role: admin)`);
  console.log(`   editor@ai-headless.local / editor123  (role: editor)`);
  console.log(`   viewer@ai-headless.local / viewer123  (role: viewer)`);
  console.log(`\n⚠️  正式部署前務必修改這些預設密碼！`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });