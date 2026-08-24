/**
 * Create Event Dialog
 */

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export function CreateEventDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '', description: '', location: '',
    startAt: '', endAt: '', capacity: '0',
  });

  function update<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.title.trim()) { setError('標題必填'); return; }
    if (!form.startAt || !form.endAt) { setError('開始 / 結束時間必填'); return; }
    if (new Date(form.endAt) <= new Date(form.startAt)) { setError('結束時間必須在開始時間之後'); return; }

    startTransition(async () => {
      try {
        const res = await fetch('/api/event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: form.title,
            description: form.description,
            location: form.location,
            startAt: new Date(form.startAt).toISOString(),
            endAt: new Date(form.endAt).toISOString(),
            capacity: Number(form.capacity) || 0,
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message ?? '建立失敗');
        }
        setOpen(false);
        setForm({ title: '', description: '', location: '', startAt: '', endAt: '', capacity: '0' });
        router.refresh();
      } catch (e) {
        setError(String(e instanceof Error ? e.message : e));
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button>+ 建立活動</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>建立活動</DialogTitle>
          <DialogDescription>活動狀態會自動依時間推算（upcoming / ongoing / past）</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">標題</Label>
            <Input id="title" value={form.title} onChange={(e) => update('title', e.target.value)} required disabled={isPending} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">描述</Label>
            <Textarea id="description" value={form.description} onChange={(e) => update('description', e.target.value)} rows={3} disabled={isPending} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="startAt">開始時間</Label>
              <Input id="startAt" type="datetime-local" value={form.startAt} onChange={(e) => update('startAt', e.target.value)} required disabled={isPending} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endAt">結束時間</Label>
              <Input id="endAt" type="datetime-local" value={form.endAt} onChange={(e) => update('endAt', e.target.value)} required disabled={isPending} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="location">地點</Label>
              <Input id="location" value={form.location} onChange={(e) => update('location', e.target.value)} disabled={isPending} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">容量</Label>
              <Input id="capacity" type="number" min="0" value={form.capacity} onChange={(e) => update('capacity', e.target.value)} disabled={isPending} />
            </div>
          </div>
          {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>取消</Button>
            <Button type="submit" disabled={isPending}>{isPending ? '建立中...' : '建立'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}