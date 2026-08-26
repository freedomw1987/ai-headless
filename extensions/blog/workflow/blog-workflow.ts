/**
 * Blog Workflow — 文章生命週期
 *
 * 整合 StateMachine + Prisma 持久化
 *
 * States: draft → pending → published → archived
 * Events: submit, approve, publish, archive, reject
 */

import { db } from '@/lib/db';
import {
  createStateMachine,
  InvalidTransitionError,
  type StateMachineSchema,
} from '@/lib/state-machine/state-machine';

// ==============================================
// StateMachine Schema（文章生命週期）
// ==============================================

export const blogStateMachineSchema: StateMachineSchema = {
  id: 'blog-post',
  initial: 'draft',
  states: {
    draft: {
      on: {
        submit: 'pending',
        archive: 'archived',
      },
    },
    pending: {
      on: {
        approve: 'published',
        reject: 'draft',
        archive: 'archived',
      },
    },
    published: {
      on: {
        archive: 'archived',
      },
    },
    archived: {},
  },
};

// ==============================================
// Workflow Functions
// ==============================================

export type BlogState = 'draft' | 'pending' | 'published' | 'archived';
export type BlogEvent = 'submit' | 'approve' | 'reject' | 'publish' | 'archive';

export function getBlogStateMachine() {
  return createStateMachine(blogStateMachineSchema);
}

/**
 * 從 title 生成 URL-friendly slug
 */
function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

/**
 * 估算閱讀時間（中文 / 英文 都用 200 字/分鐘）
 */
function computeReadingTime(content: string): number {
  // 中文字符 + 英文單詞
  const chineseChars = (content.match(/[\u4e00-\u9fa5]/g) || []).length;
  const englishWords = (content.match(/[a-zA-Z]+/g) || []).length;
  const total = chineseChars + englishWords;
  return Math.max(1, Math.ceil(total / 200));
}

export async function listBlogPosts() {
  return db.blogPost.findMany({
    where: { deletedAt: null },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function getBlogPost(id: string) {
  return db.blogPost.findUniqueOrThrow({ where: { id } });
}

export async function createBlogPost(input: {
  title: string;
  content?: string;
  excerpt?: string;
}) {
  if (!input.title?.trim()) {
    throw new Error('title 必填');
  }
  // 自動生成 slug + readingTime（演示 hook + computed）
  const slug = `${slugify(input.title)}-${Date.now().toString(36)}`;
  const readingTime = computeReadingTime(input.content ?? '');
  return db.blogPost.create({
    data: {
      title: input.title.trim(),
      slug,
      content: input.content ?? '',
      excerpt: input.excerpt ?? null,
      status: 'draft',
      readingTime,
    },
  });
}

export async function updateBlogPost(
  id: string,
  input: {
    title?: string;
    content?: string;
    excerpt?: string;
  },
) {
  const update: Record<string, unknown> = {};
  if (input.title !== undefined) update.title = input.title.trim();
  if (input.content !== undefined) {
    update.content = input.content;
    update.readingTime = computeReadingTime(input.content);
  }
  if (input.excerpt !== undefined) update.excerpt = input.excerpt;
  return db.blogPost.update({ where: { id }, data: update });
}

export async function deleteBlogPost(id: string) {
  return db.blogPost.delete({ where: { id } });
}

export async function transitionBlogPost(
  id: string,
  event: BlogEvent,
  payload?: Record<string, unknown>,
) {
  // Sprint 29 commit 3: 改用 $transaction 確保 update + TransitionLog 原子性
  return db.$transaction(async (tx) => {
    const post = await tx.blogPost.findUniqueOrThrow({ where: { id } });
    const sm = createStateMachine(blogStateMachineSchema);
    sm.setState(post.status);

    if (!sm.canTransition(event)) {
      throw new InvalidTransitionError('blog-post', post.status, event);
    }

    sm.transition({ event, payload });

    const newState = sm.getState();
    const updateData: Record<string, unknown> = { status: newState };
    // published 時自動寫 publishedAt
    if (event === 'approve' || event === 'publish') {
      updateData.publishedAt = new Date();
    }

    const updated = await tx.blogPost.update({
      where: { id },
      data: updateData,
    });

    // Sprint 29 commit 3: 寫 TransitionLog (audit trail)
    await tx.transitionLog.create({
      data: {
        machineName: 'blog-post',
        entityType: 'BlogPost',
        entityId: id,
        fromState: post.status,
        toState: newState,
        userId: (payload?.userId as string) ?? null,
        reason: event,
      },
    });

    return updated;
  });
}