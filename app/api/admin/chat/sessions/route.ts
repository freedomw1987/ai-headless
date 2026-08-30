/**
 * GET /api/admin/chat/sessions — 列出 admin user 自己的 sessions (按 updatedAt DESC)
 * POST /api/admin/chat/sessions — 建立新 session
 *
 * Sprint 44 Commit G2
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireUser, isAdmin } from '@/lib/auth/auth';
import { db } from '@/lib/db';

export async function GET() {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  const sessions = await db.chatSession.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      title: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { messages: true } },
    },
    take: 100, // 上限 100 筆避免一次撈爆
  });

  return NextResponse.json({ sessions });
}

export async function POST(req: NextRequest) {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as { title?: string };
  const session = await db.chatSession.create({
    data: {
      userId: user.id,
      title: body.title ?? '新對話',
    },
  });

  return NextResponse.json({ session });
}

export const dynamic = 'force-dynamic';