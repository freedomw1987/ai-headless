/**
 * Event API — 列表 / 建立
 */

import { NextRequest, NextResponse } from 'next/server';
import { createEvent, listEvents } from '@/extensions/event/workflow/event-workflow';
import { guardExtensionApi } from '@/lib/extensions/api-guard';

export async function GET() {
  const guard = await guardExtensionApi('event');
  if (guard) return guard;
  const events = await listEvents();
  return NextResponse.json({ events });
}

export async function POST(req: NextRequest) {
  const guard = await guardExtensionApi('event');
  if (guard) return guard;
  try {
    const body = await req.json();
    const event = await createEvent(body);
    return NextResponse.json({ event }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: 'BadRequest', message: String(e instanceof Error ? e.message : e) },
      { status: 400 },
    );
  }
}