/**
 * Todo Row Actions — toggle + delete
 */

'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { EditTodoDialog } from './edit-todo-dialog';

export function TodoRowActions({
  todoId,
  completed,
  initialTitle,
  initialDescription,
  initialDueDate,
  initialPriority,
}: {
  todoId: string;
  completed: boolean;
  initialTitle: string;
  initialDescription: string;
  initialDueDate: string | null;
  initialPriority: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      await fetch(`/api/todo/${todoId}/toggle`, { method: 'POST' });
      router.refresh();
    });
  }

  function remove() {
    if (!confirm('確定刪除？')) return;
    startTransition(async () => {
      await fetch(`/api/todo/${todoId}`, { method: 'DELETE' });
      router.refresh();
    });
  }

  return (
    <div className="flex gap-2 justify-end">
      <EditTodoDialog
        todoId={todoId}
        initialTitle={initialTitle}
        initialDescription={initialDescription}
        initialDueDate={initialDueDate}
        initialPriority={initialPriority}
      />
      <Button variant="outline" size="sm" onClick={toggle} disabled={isPending}>
        {completed ? '取消完成' : '完成'}
      </Button>
      <Button variant="destructive" size="sm" onClick={remove} disabled={isPending}>
        刪除
      </Button>
    </div>
  );
}