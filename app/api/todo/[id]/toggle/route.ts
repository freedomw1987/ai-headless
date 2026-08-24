/**
 * Todo API — toggle complete
 */

import { NextRequest, NextResponse } from 'next/server';
import { toggleTodo } from '@/extensions/todo/workflow/todo-workflow';

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const todo = await toggleTodo(id);
    return NextResponse.json({ todo });
  } catch {
    return NextResponse.json({ error: 'NotFound', todoId: id }, { status: 404 });
  }
}