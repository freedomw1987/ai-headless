// Blog Extension 使用範例
//
// 展示如何在 Server Action / API route / Script 中呼叫 blog workflow
// 適用於：Sprint 9 Blog Module（US-201 — Blog 管理）
//
// API 摘要：
// - listBlogPosts()                         → BlogPost[]
// - getBlogPost(id)                         → BlogPost | null
// - createBlogPost(input)                   → BlogPost（含 state machine：draft）
// - updateBlogPost(id, data)                → BlogPost
// - deleteBlogPost(id)                      → 軟刪除
// - transitionBlogPost(id, event, payload?) → BlogPost
//
// State Machine: draft → pending → published → archived（見 blog-workflow.ts）

import {
  listBlogPosts,
  createBlogPost,
  transitionBlogPost,
  type BlogEvent,
} from '../workflow/blog-workflow';

export async function exampleListDrafts() {
  const posts = await listBlogPosts();
  return posts.filter((p) => p.status === 'draft');
}

export async function exampleCreateAndPublish() {
  // 1. 建立草稿
  const draft = await createBlogPost({
    title: '我的第一篇文章',
    content: '文章內容...',
    excerpt: '摘要',
  });

  // 2. 提交審核
  const pending = await transitionBlogPost(draft.id, 'submit');

  // 3. 審核通過
  const published = await transitionBlogPost(pending.id, 'approve');

  return published;
}

export async function exampleReject() {
  // 從 pending 直接退回 draft（不需要先 publish）
  const post = await transitionBlogPost('post-id', 'reject');
  return post;
}

export async function exampleBulkArchive(publishedIds: string[]) {
  // 批次封存已發布文章
  const archived = await Promise.all(
    publishedIds.map((id) => transitionBlogPost(id, 'archive')),
  );
  return archived;
}

// 直接呼叫 event 的範例（type-safe）
export function exampleGetAvailableEvents(currentStatus: string): BlogEvent[] {
  switch (currentStatus) {
    case 'draft':
      return ['submit'];
    case 'pending':
      return ['approve', 'reject'];
    case 'published':
      return ['archive'];
    case 'archived':
      return [];
    default:
      return [];
  }
}