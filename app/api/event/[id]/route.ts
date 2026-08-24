/**
 * Event API — 詳情 / 更新 / 刪除
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  deleteEvent,
  getEvent,
  updateEvent,
} from '@/extensions/event/workflow/event-workflow';

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const event = await getEvent(id);
    return NextResponse.json({ event });
  } catch {
    return NextResponse.json({ error: 'NotFound', eventId: id }, { status: 404 });
  }
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const body = await req.json();
    const event = await updateEvent(id, body);
    return NextResponse.json({ event });
  } catch (e) {
    return NextResponse.json(
      { error: 'BadRequest', message: String(e instanceof Error ? e.message : e) },
      { status: 400 },
    );
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    await deleteEvent(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'NotFound', eventId: id }, { status: 404 });
  }
}