/**
 * GET /api/admin/chat/sessions/[id] — 取得單 session + messages
 * DELETE /api/admin/chat/sessions/[id] — 刪除 session
 *
 * Sprint 44 Commit G2
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireUser, isAdmin } from '@/lib/auth/auth';
import { db } from '@/lib/db';

type Params = { params: Promise<{ id: string }> };

async function authorize() {
  const user = await requireUser().catch(() => null);
  if (!user) return { error: 'Unauthorized', status: 401 as const };
  if (!(await isAdmin())) return { error: 'Admin only', status: 403 as const };
  return { user };
}

export async function GET(_req: NextRequest, { params }: Params) {
  const auth = await authorize();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { id } = await params;

  const session = await db.chatSession.findFirst({
    where: { id, userId: auth.user.id },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
    },
  });

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }
  return NextResponse.json({ session });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const auth = await authorize();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { id } = await params;

  // 隔離: 只刪除自己的 session
  const result = await db.chatSession.deleteMany({
    where: { id, userId: auth.user.id },
  });
  if (result.count === 0) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

export const dynamic = 'force-dynamic';