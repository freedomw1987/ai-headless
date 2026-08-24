/**
 * Todo Workflow — 待辦事項
 *
 * 最簡單 CRUD + toggle complete
 * 沒有複雜狀態機
 */

import { db } from '@/lib/db';

export type TodoPriority = 'low' | 'medium' | 'high';

export async function listTodos() {
  return db.todo.findMany({
    where: { deletedAt: null },
    orderBy: [{ completed: 'asc' }, { dueDate: 'asc' }],
  });
}

export async function getTodo(id: string) {
  return db.todo.findUniqueOrThrow({ where: { id } });
}

export async function createTodo(input: {
  title: string;
  description?: string;
  dueDate?: string | Date | null;
  priority?: TodoPriority;
}) {
  if (!input.title?.trim()) throw new Error('title 必填');
  return db.todo.create({
    data: {
      title: input.title.trim(),
      description: input.description ?? '',
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      priority: input.priority ?? 'medium',
      completed: false,
    },
  });
}

export async function updateTodo(
  id: string,
  input: {
    title?: string;
    description?: string;
    dueDate?: string | Date | null;
    priority?: TodoPriority;
  },
) {
  const update: Record<string, unknown> = {};
  if (input.title !== undefined) update.title = input.title.trim();
  if (input.description !== undefined) update.description = input.description;
  if (input.dueDate !== undefined) {
    update.dueDate = input.dueDate ? new Date(input.dueDate) : null;
  }
  if (input.priority !== undefined) update.priority = input.priority;
  return db.todo.update({ where: { id }, data: update });
}

export async function deleteTodo(id: string) {
  return db.todo.delete({ where: { id } });
}

export async function toggleTodo(id: string) {
  const todo = await db.todo.findUniqueOrThrow({ where: { id } });
  return db.todo.update({
    where: { id },
    data: { completed: !todo.completed },
  });
}