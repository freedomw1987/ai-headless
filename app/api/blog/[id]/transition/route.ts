/**
 * Blog API — 狀態切換（lifecycle workflow）
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  transitionBlogPost,
  type BlogEvent,
} from '@/extensions/blog/workflow/blog-workflow';
import { InvalidTransitionError } from '@/lib/state-machine/state-machine';
import { guardExtensionApi } from '@/lib/extensions/api-guard';

const VALID_EVENTS: BlogEvent[] = ['submit', 'approve', 'reject', 'publish', 'archive'];

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await guardExtensionApi('blog');
  if (guard) return guard;
  const { id } = await ctx.params;
  try {
    const body = await req.json();
    if (!VALID_EVENTS.includes(body.event)) {
      return NextResponse.json(
        { error: 'BadRequest', message: `無效的 event：${body.event}` },
        { status: 400 },
      );
    }
    const post = await transitionBlogPost(id, body.event, body.payload);
    return NextResponse.json({ post, transition: { event: body.event } });
  } catch (e) {
    if (e instanceof InvalidTransitionError) {
      return NextResponse.json(
        {
          error: 'InvalidTransitionError',
          machineId: e.machineId,
          currentState: e.currentState,
          event: e.event,
        },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: 'NotFound', postId: id },
      { status: 404 },
    );
  }
}