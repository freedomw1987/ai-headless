/**
 * Sprint 28 — /admin/users 用戶列表頁（Server Component）
 *
 * US-102 — 用戶列表頁
 * 對應 PRD §2.2 FR-2.1
 *
 * 設計：使用 CRUD 列表頁模式（跟其他 CRUD 頁面體驗一致）：
 * - Server Component 直接查 DB（繞過 /api/users 避免 round-trip）
 * - 桌面（≥768px）：表格
 * - 手機（<768px）：MobileListView 卡片
 * - 批次刪除關閉（auth 模型不支援批次）
 * - 自訂每 row 動作：編輯 + 停用（透過 UserRowActions）
 */

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Plus } from 'lucide-react';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth/config';
import { hasUIPermission } from '@/lib/auth/ui-permissions';
import { Button } from '@/components/ui/button';
import { UsersListShell } from './users-list-shell';

export default async function UsersPage() {
  // auth check
  const session = await auth();
  if (!session?.user) redirect('/admin/login');

  // 載入用戶
  const users = await db.user.findMany({
    where: { isActive: true },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  // 轉換成 CrudListClient 期望的 rows/cells 格式
  const rows = users.map((u) => ({
    id: u.id,
    cells: [
      { fieldName: 'email', value: u.email, isCheckbox: false, isDate: false },
      { fieldName: 'name', value: u.name ?? '—', isCheckbox: false, isDate: false },
      { fieldName: 'role', value: u.role, isCheckbox: false, isDate: false },
      {
        fieldName: 'isActive',
        value: u.isActive ? '啟用' : '停用',
        isCheckbox: false,
        isDate: false,
      },
      {
        fieldName: 'createdAt',
        value: u.createdAt.toISOString(),
        isCheckbox: false,
        isDate: true,
      },
    ],
  }));

  const canCreate = hasUIPermission(session.user.permissions ?? [], 'users:write');

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">用戶管理</h1>
          <p className="text-sm text-muted-foreground">共 {users.length} 個啟用帳號</p>
        </div>
        {canCreate && (
          <Button asChild>
            <Link href="/admin/users/new">
              <Plus />
              新增用戶
            </Link>
          </Button>
        )}
      </div>

      {/* CRUD List (table on desktop / mobile card on < 768px) */}
      <UsersListShell rows={rows} />
    </div>
  );
}