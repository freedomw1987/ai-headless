/**
 * TDD Gate 1 — Sprint 29 commit 3
 * Blog transition 整合 TransitionLog
 *
 * 對應 PRD: docs/specs/extension-spec.md (Blog)
 * 對應 Backlog: Sprint 28 reflection 揭露的 TD-新發現 A
 *
 * 問題:
 * - blog-workflow.ts transitionBlogPost 沒用 transaction
 * - 沒寫 TransitionLog → 對 blog post 狀態變更無 audit trail
 * - 對合規/除錯不利
 *
 * 修正 (此 commit):
 * - transitionBlogPost 改用 db.$transaction
 * - 在 transaction 內寫 TransitionLog (machineName: 'blog-post')
 * - 從 payload?.userId 讀取 userId (commit 1 注入)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => {
  const blogPostMock: any = {
    findUniqueOrThrow: vi.fn(),
    update: vi.fn(),
  };
  const transitionLogMock: any = {
    create: vi.fn(),
  };
  return {
    db: {
      blogPost: blogPostMock,
      transitionLog: transitionLogMock,
      $transaction: vi.fn(async (fn: any) =>
        fn({ blogPost: blogPostMock, transitionLog: transitionLogMock }),
      ),
    },
  };
});

import { db } from '@/lib/db';
import { transitionBlogPost } from '@/extensions/blog/workflow/blog-workflow';

describe('Sprint 29 commit 3 — Blog transition 整合 TransitionLog', () => {
  let currentStatus: string;
  let capturedLog: any;

  beforeEach(() => {
    currentStatus = 'draft';
    capturedLog = null;

    (db.blogPost as any).findUniqueOrThrow.mockReset();
    (db.blogPost as any).update.mockReset();
    (db.transitionLog as any).create.mockReset();
    (db.$transaction as any).mockReset();

    (db.blogPost as any).findUniqueOrThrow.mockImplementation(
      async () =>
        ({
          id: 'blog-1',
          status: currentStatus,
          title: 'Test Post',
        }) as any,
    );
    (db.blogPost as any).update.mockImplementation(
      async ({ where, data }: any) => {
        currentStatus = data.status;
        return { id: where.id, status: data.status } as any;
      },
    );
    (db.transitionLog as any).create.mockImplementation(
      async ({ data }: any) => {
        capturedLog = data;
        return { id: 'log-1', ...data } as any;
      },
    );
    (db.$transaction as any).mockImplementation(async (fn: any) =>
      fn({ blogPost: db.blogPost, transitionLog: db.transitionLog }),
    );
  });

  it('draft → submit → pending → 寫 TransitionLog', async () => {
    await transitionBlogPost('blog-1', 'submit', { userId: 'u-editor-1' });

    expect(capturedLog).not.toBeNull();
    expect(capturedLog.machineName).toBe('blog-post');
    expect(capturedLog.fromState).toBe('draft');
    expect(capturedLog.toState).toBe('pending');
    expect(capturedLog.entityType).toBe('BlogPost');
    expect(capturedLog.entityId).toBe('blog-1');
    expect(capturedLog.userId).toBe('u-editor-1');
    expect(capturedLog.reason).toBe('submit');
  });

  it('pending → approve → published → 寫 TransitionLog', async () => {
    currentStatus = 'pending';
    await transitionBlogPost('blog-1', 'approve', { userId: 'u-editor-2' });

    expect(capturedLog.fromState).toBe('pending');
    expect(capturedLog.toState).toBe('published');
  });

  it('無效 transition (draft → publish) → 拋 InvalidTransitionError, 不寫 log', async () => {
    await expect(
      transitionBlogPost('blog-1', 'publish', { userId: 'u-editor-1' }),
    ).rejects.toThrow(/拒絕 event/);
    // log 不應被寫入
    expect(capturedLog).toBeNull();
  });
});