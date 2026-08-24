/**
 * Create Blog Dialog
 */

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';

export function CreateBlogDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) { setError('標題必填'); return; }

    startTransition(async () => {
      try {
        const res = await fetch('/api/blog', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, content, excerpt }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message ?? '建立失敗');
        }
        setOpen(false);
        setTitle(''); setContent(''); setExcerpt('');
        router.refresh();
      } catch (e) {
        setError(String(e instanceof Error ? e.message : e));
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button>+ 寫文章</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>寫新文章</DialogTitle>
          <DialogDescription>slug 會自動從標題生成，閱讀時間會自動計算</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">標題</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required disabled={isPending} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="excerpt">摘要</Label>
            <Input id="excerpt" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} disabled={isPending} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">內容</Label>
            <Textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} rows={6} disabled={isPending} />
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