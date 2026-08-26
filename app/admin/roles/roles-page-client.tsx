'use client';

/**
 * /admin/roles Client Component — Sprint 21 Task 8
 *
 * 功能:
 * - 列出所有 role（內建 + 自定義）
 * - 內建 role 顯示「系統」 badge,無刪除按鈕
 * - 提供「建立 role」入口（Dialog）
 * - 提供「進入矩陣頁」入口
 */

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Settings2, Trash2 } from 'lucide-react';
import { DataTable } from '@/components/admin/data-table';

type RoleRow = {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  isSystem: boolean;
  _count: { users: number; permissions: number };
  createdAt: string;
};

export function RolesPageClient() {
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // form state
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/roles');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRoles(data.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : '載入失敗');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/roles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, displayName, description: description || undefined }),
        });

        if (!res.ok) {
          const data = await res.json();
          setFormError(data.error ?? '建立失敗');
          return;
        }

        setDialogOpen(false);
        setName('');
        setDisplayName('');
        setDescription('');
        void load();
      } catch (err) {
        setFormError(err instanceof Error ? err.message : '建立失敗');
      }
    });
  }

  async function handleDelete(role: RoleRow) {
    if (!confirm(`確定要刪除 role '${role.displayName}'?\n${role._count.users > 0 ? `⚠️ 此 role 有 ${role._count.users} 個用戶指派` : ''}`)) return;

    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/roles/${role.id}`, { method: 'DELETE' });
        if (!res.ok) {
          const data = await res.json();
          alert(data.error ?? '刪除失敗');
          return;
        }
        void load();
      } catch (err) {
        alert(err instanceof Error ? err.message : '刪除失敗');
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Roles 管理</h1>
          <p className="text-sm text-muted-foreground">共 {roles.length} 個 role</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              新增 Role
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新增自定義 Role</DialogTitle>
              <DialogDescription>
                name 須符合 ^[a-z][a-z0-9_]&#123;0,31&#125;$,且不可為保留字 (admin / editor / viewer)
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="content_moderator"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="displayName">顯示名稱 *</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="內容審核員"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">描述</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="此 role 的用途說明..."
                  rows={3}
                />
              </div>
              {formError && (
                <div className="text-sm text-destructive">{formError}</div>
              )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  取消
                </Button>
                <Button type="submit" disabled={!name || !displayName}>
                  建立
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Card>
          <CardContent className="p-4 text-destructive">錯誤:{error}</CardContent>
        </Card>
      )}

      {loading ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">載入中…</CardContent>
        </Card>
      ) : (
        <DataTable<RoleRow>
          data={roles}
          columns={[
            {
              key: 'name',
              header: 'Name',
              render: (r) => (
                <div className="flex items-center gap-2">
                  <span className="font-mono">{r.name}</span>
                  {r.isSystem && <Badge variant="secondary">系統</Badge>}
                </div>
              ),
            },
            { key: 'displayName', header: '顯示名稱' },
            { key: 'description', header: '描述', render: (r) => r.description ?? '—' },
            {
              key: 'permissions',
              header: '權限數',
              render: (r) => r._count.permissions,
            },
            {
              key: 'users',
              header: '用戶數',
              render: (r) => r._count.users,
            },
          ]}
          actions={(r) => (
            <div className="flex gap-2 justify-end">
              <Button asChild variant="outline" size="sm">
                <Link href={`/admin/roles/${r.id}/permissions`}>
                  <Settings2 className="mr-1 h-3 w-3" />
                  矩陣
                </Link>
              </Button>
              {!r.isSystem && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(r)}
                >
                  <Trash2 className="mr-1 h-3 w-3" />
                  刪除
                </Button>
              )}
            </div>
          )}
        />
      )}
    </div>
  );
}