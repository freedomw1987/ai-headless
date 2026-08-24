/**
 * Blog Transition Buttons
 */

'use client';

import { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { createStateMachine } from '@/lib/state-machine/state-machine';
import { blogStateMachineSchema, type BlogEvent } from '@/extensions/blog/workflow/blog-workflow';

const LABELS: Record<BlogEvent, string> = {
  submit: '提交審核',
  approve: '核准發布',
  reject: '退回草稿',
  publish: '發布',
  archive: '封存',
};

const VARIANTS: Record<BlogEvent, 'default' | 'destructive' | 'outline'> = {
  submit: 'default',
  approve: 'default',
  reject: 'outline',
  publish: 'default',
  archive: 'destructive',
};

export function BlogTransitionButtons({ postId, currentStatus }: { postId: string; currentStatus: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const sm = createStateMachine(blogStateMachineSchema);
  sm.setState(currentStatus);
  const events = sm.getAvailableEvents() as BlogEvent[];

  if (events.length === 0) {
    return <div className="text-sm text-muted-foreground">已封存（終態）</div>;
  }

  async function handleTransition(event: BlogEvent) {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/blog/${postId}/transition`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message ?? '操作失敗');
        }
        router.refresh();
      } catch (e) {
        setError(String(e instanceof Error ? e.message : e));
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {events.map((event) => (
          <Button
            key={event}
            variant={VARIANTS[event]}
            onClick={() => handleTransition(event)}
            disabled={isPending}
            size="sm"
          >
            {isPending ? '...' : LABELS[event]}
          </Button>
        ))}
      </div>
      {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>}
    </div>
  );
}