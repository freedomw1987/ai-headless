/**
 * Event API — 列表 / 建立
 */

import { NextRequest, NextResponse } from 'next/server';
import { createEvent, listEvents } from '@/extensions/event/workflow/event-workflow';

export async function GET() {
  const events = await listEvents();
  return NextResponse.json({ events });
}

export async function POST(req: NextRequest) {
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