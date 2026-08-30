// Sprint 28 — UsersListShell (client component wrapper)
//
// 為什麼需要這個殼層：
// - page.tsx 是 Server Component
// - CrudListClient 是 Client Component
// - Server Component 不能把 function (renderActions) 傳給 Client Component
//   （React error: "Functions cannot be passed directly to Client Components")
//
// 解法：建一個 client wrapper，內部呼叫 CrudListClient 並傳入 renderActions。
// page.tsx 只需傳「可序列化的資料」給這個 wrapper。

'use client';

import { CrudListClient } from '@/app/admin/crud/[spec]/crud-list-client';
import { UserRowActions } from './user-row-actions';
import type { CellDisplay } from '@/lib/runtime/cell-display';

type Props = {
  rows: { id: string; cells: CellDisplay[] }[];
};

export function UsersListShell({ rows }: Props) {
  return (
    <CrudListClient
      specName="user"
      rows={rows}
      columns={[
        { name: 'email', label: 'Email' },
        { name: 'name', label: '姓名' },
        { name: 'role', label: '角色' },
        { name: 'isActive', label: '狀態' },
        { name: 'createdAt', label: '建立時間' },
      ]}
      total={rows.length}
      page={1}
      totalPages={1}
      currentSort="createdAt"
      currentOrder="desc"
      currentQuery=""
      pageSize={rows.length || 20}
      allowBatchDelete={false}
      renderActions={(rowId) => <UserRowActions userId={rowId} />}
    />
  );
}