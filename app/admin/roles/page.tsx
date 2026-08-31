/**
 * Sprint 28 — /admin/roles Role 列表頁（Server Component）
 *
 * Sprint 21 Task 8 — FR-1
 * 對應 PRD：docs/prd/09-rbac.md §5.3
 *
 * 設計：使用 CRUD 列表頁模式（跟其他 CRUD 頁面體驗一致）：
 * - Server Component 直接查 DB
 * - 桌面（≥768px）：表格 / 手機（<768px）：MobileListView 卡片
 * - 批次刪除關閉（auth 模型不支援批次）
 * - 自訂每 row 動作：矩陣 + 刪除（內建 role 隱藏刪除）
 * - 保留「新增 Role」Dialog（沿用既有邏輯）
 */

import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth/config';
import { hasUIPermission } from '@/lib/auth/ui-permissions';
import { RolesListShell } from './roles-list-shell';
import { RolesPageDialog } from './roles-page-dialog';
import { Badge } from '@/components/ui/badge';

export default async function RolesPage() {
  // auth check
  const session = await auth();
  if (!session?.user) redirect('/admin/login');

  const roles = await db.role.findMany({
    include: {
      _count: {
        select: { users: true, permissions: true },
      },
    },
    orderBy: [{ isSystem: 'desc' }, { createdAt: 'asc' }],
  });

  // 轉換成 CrudListClient 期望的 rows/cells 格式
  // 注意：cells 順序跟 columns 必須對應
  const rows = roles.map((r) => ({
    id: r.id,
    cells: [
      {
        fieldName: 'name',
        // name + 系統 badge 合併
        value: r.isSystem ? `${r.name} [系統]` : r.name,
        isCheckbox: false,
        isDate: false,
      },
      { fieldName: 'displayName', value: r.displayName, isCheckbox: false, isDate: false },
      { fieldName: 'description', value: r.description ?? '—', isCheckbox: false, isDate: false },
      { fieldName: 'permissions', value: String(r._count.permissions), isCheckbox: false, isDate: false },
      { fieldName: 'users', value: String(r._count.users), isCheckbox: false, isDate: false },
    ],
  }));

  // renderActions 用的 metadata（id → displayName/isSystem/userCount）
  // 必須可序列化（不能傳 function），所以用 Record<string, T>
  const roleMeta: Record<string, { displayName: string; isSystem: boolean; userCount: number }> = {};
  for (const r of roles) {
    roleMeta[r.id] = {
      displayName: r.displayName,
      isSystem: r.isSystem,
      userCount: r._count.users,
    };
  }

  const canWrite = hasUIPermission(session.user.permissions ?? [], 'roles:write');

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Roles 管理</h1>
          <p className="text-sm text-muted-foreground">共 {roles.length} 個 role</p>
        </div>
        {canWrite && <RolesPageDialog />}
      </div>

      {/* 內建 role 數量標示 */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Badge variant="secondary">{roles.filter((r) => r.isSystem).length} 內建</Badge>
        <Badge variant="outline">{roles.filter((r) => !r.isSystem).length} 自定義</Badge>
      </div>

      {/* CRUD List (table on desktop / mobile card on < 768px) */}
      <RolesListShell rows={rows} roleMeta={roleMeta} />
    </div>
  );
}