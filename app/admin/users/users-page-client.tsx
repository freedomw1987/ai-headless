'use client';

/**
 * US-102 — 用戶列表頁 Client Component
 * 對應 PRD §2.2 FR-2.1
 */

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DataTable } from '@/components/admin/data-table';

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
};

export function UsersPageClient() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setUsers(data.users);
      setTotal(data.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : '載入失敗');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm('確定要停用這個帳號？')) return;
    startTransition(async () => {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        void load();
      } else {
        const data = await res.json();
        alert(data.error ?? '刪除失敗');
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">用戶管理</h1>
          <p className="text-sm text-muted-foreground">共 {total} 個啟用帳號</p>
        </div>
        <Button asChild>
          <Link href="/admin/users/new">＋ 新增用戶</Link>
        </Button>
      </div>

      {error && (
        <Card>
          <CardContent className="p-4 text-destructive">錯誤：{error}</CardContent>
        </Card>
      )}

      {loading ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">載入中…</CardContent>
        </Card>
      ) : (
        <DataTable<UserRow>
          data={users}
          columns={[
            { key: 'email', header: 'Email' },
            { key: 'name', header: '姓名', render: (r) => r.name ?? '—' },
            {
              key: 'role',
              header: '角色',
              render: (r) => (
                <span className="px-2 py-1 rounded text-xs font-medium bg-muted">
                  {r.role}
                </span>
              ),
            },
            { key: 'isActive', header: '狀態', render: (r) => (r.isActive ? '啟用' : '停用') },
          ]}
          actions={(r) => (
            <div className="flex gap-2 justify-end">
              <Button asChild variant="outline" size="sm">
                <Link href={`/admin/users/${r.id}/edit`}>編輯</Link>
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(r.id)}
              >
                停用
              </Button>
            </div>
          )}
        />
      )}
    </div>
  );
}