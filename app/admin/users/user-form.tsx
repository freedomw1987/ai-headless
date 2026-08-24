'use client';

/**
 * US-102 — 用戶新增/編輯表單
 * 對應 PRD §2.2 FR-2.2 / FR-2.3
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Initial = {
  id?: string;
  email?: string;
  name?: string | null;
  role?: 'admin' | 'editor' | 'viewer';
};

export function UserForm({ initial }: { initial?: Initial }) {
  const router = useRouter();
  const isEdit = Boolean(initial?.id);
  const [email, setEmail] = useState(initial?.email ?? '');
  const [name, setName] = useState(initial?.name ?? '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'editor' | 'viewer'>(
    initial?.role ?? 'viewer',
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const url = isEdit ? `/api/users/${initial!.id}` : '/api/users';
      const method = isEdit ? 'PATCH' : 'POST';
      const body: Record<string, unknown> = { email, name, role };
      if (!isEdit || password) body.password = password;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? `HTTP ${res.status}`);
        return;
      }
      router.push('/admin/users');
      router.refresh();
    });
  }

  return (
    <Card className="w-full max-w-xl mx-auto">
      <CardHeader>
        <CardTitle>{isEdit ? '編輯用戶' : '新增用戶'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">姓名</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">
              密碼 {isEdit && <span className="text-xs text-muted-foreground">(留空表示不修改)</span>}
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={isEdit ? undefined : 6}
              required={!isEdit}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">角色</Label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as 'admin' | 'editor' | 'viewer')}
              className="w-full rounded border px-3 py-2 bg-background"
            >
              <option value="viewer">viewer（唯讀）</option>
              <option value="editor">editor（可寫）</option>
              <option value="admin">admin（完整權限）</option>
            </select>
          </div>
          {error && (
            <p className="text-sm text-destructive" role="alert">{error}</p>
          )}
          <div className="flex gap-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? '儲存中…' : '儲存'}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              取消
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}