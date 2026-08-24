/**
 * Blog API — 列表 / 建立
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createBlogPost,
  listBlogPosts,
} from '@/extensions/blog/workflow/blog-workflow';

export async function GET() {
  const posts = await listBlogPosts();
  return NextResponse.json({ posts });
}

export async function POST(req: NextRequest) {
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