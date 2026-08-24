/**
 * Edit Todo Dialog
 */

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export function EditTodoDialog({
  todoId,
  initialTitle,
  initialDescription,
  initialDueDate,
  initialPriority,
}: {
  todoId: string;
  initialTitle: string;
  initialDescription: string;
  initialDueDate: string | null;
  initialPriority: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [dueDate, setDueDate] = useState(
    initialDueDate ? initialDueDate.slice(0, 10) : '',
  );
  const [priority, setPriority] = useState(initialPriority);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) { setError('標題必填'); return; }

    startTransition(async () => {
      try {
        const res = await fetch(`/api/todo/${todoId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            description,
            dueDate: dueDate || null,
            priority,
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message ?? '更新失敗');
        }
        setOpen(false);
        router.refresh();
      } catch (e) {
        setError(String(e instanceof Error ? e.message : e));
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">編輯</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>編輯待辦</DialogTitle>
          <DialogDescription>修改待辦內容</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">標題</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required disabled={isPending} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">描述</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} disabled={isPending} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="dueDate">截止日期</Label>
              <Input id="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} disabled={isPending} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">優先級</Label>
              <Select value={priority} onValueChange={setPriority} disabled={isPending}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">低</SelectItem>
                  <SelectItem value="medium">中</SelectItem>
                  <SelectItem value="high">高</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>取消</Button>
            <Button type="submit" disabled={isPending}>{isPending ? '更新中...' : '更新'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}