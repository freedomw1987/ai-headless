/**
 * Blog API — 詳情 / 更新 / 刪除
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  deleteBlogPost,
  getBlogPost,
  updateBlogPost,
} from '@/extensions/blog/workflow/blog-workflow';
import { guardExtensionApi } from '@/lib/extensions/api-guard';

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await guardExtensionApi('blog');
  if (guard) return guard;
  const { id } = await ctx.params;
  try {
    const post = await getBlogPost(id);
    return NextResponse.json({ post });
  } catch {
    return NextResponse.json({ error: 'NotFound', postId: id }, { status: 404 });
  }
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await guardExtensionApi('blog');
  if (guard) return guard;
  const { id } = await ctx.params;
  try {
    const body = await req.json();
    const post = await updateBlogPost(id, body);
    return NextResponse.json({ post });
  } catch (e) {
    return NextResponse.json(
      { error: 'BadRequest', message: String(e instanceof Error ? e.message : e) },
      { status: 400 },
    );
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await guardExtensionApi('blog');
  if (guard) return guard;
  const { id } = await ctx.params;
  try {
    await deleteBlogPost(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'NotFound', postId: id }, { status: 404 });
  }
}