/**
 * Todo API — 列表 / 建立
 */

import { NextRequest, NextResponse } from 'next/server';
import { createTodo, listTodos } from '@/extensions/todo/workflow/todo-workflow';
import { guardExtensionApi } from '@/lib/extensions/api-guard';

export async function GET() {
  const guard = await guardExtensionApi('todo');
  if (guard) return guard;
  const todos = await listTodos();
  return NextResponse.json({ todos });
}

export async function POST(req: NextRequest) {
  const guard = await guardExtensionApi('todo');
  if (guard) return guard;
  try {
    const body = await req.json();
    const todo = await createTodo(body);
    return NextResponse.json({ todo }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: 'BadRequest', message: String(e instanceof Error ? e.message : e) },
      { status: 400 },
    );
  }
}