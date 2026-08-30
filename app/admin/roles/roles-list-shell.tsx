// Sprint 28 — RolesListShell (client component wrapper)
//
// 為什麼需要這個殼層：
// - page.tsx 是 Server Component
// - CrudListClient 是 Client Component
// - Server Component 不能把 function (renderActions) 傳給 Client Component
//
// 解法：建一個 client wrapper，內部呼叫 CrudListClient 並傳入 renderActions。

'use client';

import { CrudListClient } from '@/app/admin/crud/[spec]/crud-list-client';
import { RoleRowActions } from './role-row-actions';
import type { CellDisplay } from '@/lib/runtime/cell-display';

type RoleWithCount = {
  id: string;
  displayName: string;
  isSystem: boolean;
  userCount: number;
};

type Props = {
  rows: { id: string; cells: CellDisplay[] }[];
  /** 用於 renderActions 的 role metadata (id → displayName/isSystem/userCount) */
  roleMeta: Record<string, Pick<RoleWithCount, 'displayName' | 'isSystem' | 'userCount'>>;
};

export function RolesListShell({ rows, roleMeta }: Props) {
  return (
    <CrudListClient
      specName="role"
      rows={rows}
      columns={[
        { name: 'name', label: 'Name' },
        { name: 'displayName', label: '顯示名稱' },
        { name: 'description', label: '描述' },
        { name: 'permissions', label: '權限數' },
        { name: 'users', label: '用戶數' },
      ]}
      total={rows.length}
      page={1}
      totalPages={1}
      currentSort="createdAt"
      currentOrder="asc"
      currentQuery=""
      pageSize={rows.length || 20}
      allowBatchDelete={false}
      renderActions={(rowId) => {
        const meta = roleMeta[rowId];
        if (!meta) return null;
        return (
          <RoleRowActions
            roleId={rowId}
            displayName={meta.displayName}
            isSystem={meta.isSystem}
            userCount={meta.userCount}
          />
        );
      }}
    />
  );
}