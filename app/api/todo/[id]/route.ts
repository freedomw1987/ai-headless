/**
 * Todo API — 詳情 / 更新 / 刪除 / toggle
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  deleteTodo,
  getTodo,
  toggleTodo,
  updateTodo,
} from '@/extensions/todo/workflow/todo-workflow';
import { guardExtensionApi } from '@/lib/extensions/api-guard';

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await guardExtensionApi('todo');
  if (guard) return guard;
  const { id } = await ctx.params;
  try {
    const todo = await getTodo(id);
    return NextResponse.json({ todo });
  } catch {
    return NextResponse.json({ error: 'NotFound', todoId: id }, { status: 404 });
  }
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await guardExtensionApi('todo');
  if (guard) return guard;
  const { id } = await ctx.params;
  try {
    const body = await req.json();
    const todo = await updateTodo(id, body);
    return NextResponse.json({ todo });
  } catch (e) {
    return NextResponse.json(
      { error: 'BadRequest', message: String(e instanceof Error ? e.message : e) },
      { status: 400 },
    );
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await guardExtensionApi('todo');
  if (guard) return guard;
  const { id } = await ctx.params;
  try {
    await deleteTodo(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'NotFound', todoId: id }, { status: 404 });
  }
}