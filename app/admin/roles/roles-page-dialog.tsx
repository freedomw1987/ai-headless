// Sprint 28 — RolesPageDialog (新增 Role Dialog)
//
// 從原本的 roles-page-client.tsx 拆出來的「新增 Role」Dialog 元件。
// page.tsx 是 Server Component，需要 client component 才能用 form + state。

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog as UIDialog,
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

export function RolesPageDialog() {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // form state
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');

  function resetForm() {
    setName('');
    setDisplayName('');
    setDescription('');
    setFormError(null);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/roles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            displayName,
            description: description || undefined,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          setFormError(data.error ?? '建立失敗');
          return;
        }

        setDialogOpen(false);
        resetForm();
        router.refresh();
      } catch (err) {
        setFormError(err instanceof Error ? err.message : '建立失敗');
      }
    });
  }

  return (
    <UIDialog open={dialogOpen} onOpenChange={(open) => {
      setDialogOpen(open);
      if (!open) resetForm();
    }}>
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
            name 須符合 ^[a-z][a-z0-9_]{'{'}0,31{'}'}$，且不可為保留字 (admin / editor / viewer)
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
              data-testid="role-name-input"
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
              data-testid="role-displayname-input"
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
            <div className="text-sm text-destructive" data-testid="role-form-error">
              {formError}
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
            >
              取消
            </Button>
            <Button type="submit" disabled={!name || !displayName || isPending}>
              建立
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </UIDialog>
  );
}