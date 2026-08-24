/**
 * Todo API — 列表 / 建立
 */

import { NextRequest, NextResponse } from 'next/server';
import { createTodo, listTodos } from '@/extensions/todo/workflow/todo-workflow';

export async function GET() {
  const todos = await listTodos();
  return NextResponse.json({ todos });
}

export async function POST(req: NextRequest) {
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