/**
 * Blog API — 列表 / 建立
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createBlogPost,
  listBlogPosts,
} from '@/extensions/blog/workflow/blog-workflow';
import { guardExtensionApi } from '@/lib/extensions/api-guard';

export async function GET() {
  const guard = await guardExtensionApi('blog');
  if (guard) return guard;
  const posts = await listBlogPosts();
  return NextResponse.json({ posts });
}

export async function POST(req: NextRequest) {
  const guard = await guardExtensionApi('blog');
  if (guard) return guard;
  try {
    const body = await req.json();
    const post = await createBlogPost(body);
    return NextResponse.json({ post }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: 'BadRequest', message: String(e instanceof Error ? e.message : e) },
      { status: 400 },
    );
  }
}