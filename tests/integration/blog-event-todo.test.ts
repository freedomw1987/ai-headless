/**
 * Blog + Event + Todo Workflow 整合測試
 *
 * 涵蓋3 個 extension 的 CRUD + workflow
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// ===== Mock Prisma =====
vi.mock('@/lib/db', () => {
  const blogPostMock: any = {
    findMany: vi.fn(),
    findUniqueOrThrow: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
  const eventMock: any = {
    findMany: vi.fn(), findUniqueOrThrow: vi.fn(),
    create: vi.fn(), update: vi.fn(), delete: vi.fn(),
  };
  const todoMock: any = {
    findMany: vi.fn(), findUniqueOrThrow: vi.fn(),
    create: vi.fn(), update: vi.fn(), delete: vi.fn(),
  };
  const transitionLogMock: any = { create: vi.fn() };
  return {
    db: {
      blogPost: blogPostMock,
      event: eventMock,
      todo: todoMock,
      // Sprint 29 commit 3: transitionBlogPost 改用 $transaction + 寫 TransitionLog
      transitionLog: transitionLogMock,
      // $transaction 傳入 tx,讓 tx 內的 method 共用 mock
      $transaction: vi.fn(async (fn: any) =>
        fn({
          blogPost: blogPostMock,
          event: eventMock,
          todo: todoMock,
          transitionLog: transitionLogMock,
        }),
      ),
    },
  };
});

import { db } from '@/lib/db';
import * as blog from '@/extensions/blog/workflow/blog-workflow';
import * as event from '@/extensions/event/workflow/event-workflow';
import * as todo from '@/extensions/todo/workflow/todo-workflow';
import { InvalidTransitionError } from '@/lib/state-machine/state-machine';

describe('Blog Workflow', () => {
  beforeEach(() => vi.clearAllMocks());

  it('createBlogPost 自動產生 slug 和 readingTime', async () => {
    vi.mocked(db.blogPost.create).mockResolvedValue({
      id: 'p1', title: 'Hello World', slug: 'hello-world-xxx',
      readingTime: 1, status: 'draft', content: '短文', excerpt: '', author: 'Anonymous',
    } as never);

    const post = await blog.createBlogPost({ title: 'Hello World', content: '短文' });
    expect(post.slug).toMatch(/^hello-world-/);
    expect(post.readingTime).toBeGreaterThan(0);
  });

  it('createBlogPost 拒絕空標題', async () => {
    await expect(blog.createBlogPost({ title: '' })).rejects.toThrow(/title 必填/);
  });

  it('transitionBlogPost draft → pending', async () => {
    vi.mocked(db.blogPost.findUniqueOrThrow).mockResolvedValue({
      id: 'p2', status: 'draft',
    } as never);
    vi.mocked(db.blogPost.update).mockResolvedValue({
      id: 'p2', status: 'pending',
    } as never);

    const result = await blog.transitionBlogPost('p2', 'submit');
    expect(result.status).toBe('pending');
  });

  it('transitionBlogPost pending → published 自動寫 publishedAt', async () => {
    vi.mocked(db.blogPost.findUniqueOrThrow).mockResolvedValue({
      id: 'p3', status: 'pending',
    } as never);
    vi.mocked(db.blogPost.update).mockResolvedValue({
      id: 'p3', status: 'published',
    } as never);

    await blog.transitionBlogPost('p3', 'approve');
    expect(db.blogPost.update).toHaveBeenCalledWith({
      where: { id: 'p3' },
      data: expect.objectContaining({
        status: 'published',
        publishedAt: expect.any(Date),
      }),
    });
  });

  it('transitionBlogPost 無效 event 拋 InvalidTransitionError', async () => {
    vi.mocked(db.blogPost.findUniqueOrThrow).mockResolvedValue({
      id: 'p4', status: 'archived',
    } as never);

    await expect(blog.transitionBlogPost('p4', 'submit')).rejects.toThrow(
      InvalidTransitionError,
    );
  });

  it('archived 是終態', async () => {
    const sm = blog.getBlogStateMachine();
    sm.setState('archived');
    expect(sm.getAvailableEvents()).toHaveLength(0);
  });

  it('listBlogPosts 排除 deletedAt', async () => {
    vi.mocked(db.blogPost.findMany).mockResolvedValue([] as never);
    await blog.listBlogPosts();
    expect(db.blogPost.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { deletedAt: null } }),
    );
  });
});

describe('Event Workflow', () => {
  beforeEach(() => vi.clearAllMocks());

  it('createEvent 拒絕空標題', async () => {
    await expect(
      event.createEvent({ title: '', startAt: new Date(), endAt: new Date() }),
    ).rejects.toThrow(/title 必填/);
  });

  it('createEvent 拒絕 endAt 在 startAt 之前', async () => {
    const start = new Date('2026-01-02');
    const end = new Date('2026-01-01');
    await expect(
      event.createEvent({ title: 'Test', startAt: start, endAt: end }),
    ).rejects.toThrow(/endAt 必須在 startAt 之後/);
  });

  it('createEvent 建立 upcoming 狀態', async () => {
    vi.mocked(db.event.create).mockResolvedValue({
      id: 'e1', status: 'upcoming',
    } as never);

    const start = new Date('2030-01-01');
    const end = new Date('2030-01-02');
    await event.createEvent({ title: 'Test', startAt: start, endAt: end });
    expect(db.event.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'upcoming' }),
      }),
    );
  });

  it('listEvents 按 startAt asc 排序', async () => {
    vi.mocked(db.event.findMany).mockResolvedValue([] as never);
    await event.listEvents();
    expect(db.event.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { startAt: 'asc' } }),
    );
  });
});

describe('Todo Workflow', () => {
  beforeEach(() => vi.clearAllMocks());

  it('createTodo 拒絕空標題', async () => {
    await expect(todo.createTodo({ title: '' })).rejects.toThrow(/title 必填/);
  });

  it('createTodo 預設 priority=medium, completed=false', async () => {
    vi.mocked(db.todo.create).mockResolvedValue({ id: 't1' } as never);
    await todo.createTodo({ title: 'Test' });
    expect(db.todo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ priority: 'medium', completed: false }),
      }),
    );
  });

  it('toggleTodo 反轉 completed 狀態', async () => {
    vi.mocked(db.todo.findUniqueOrThrow).mockResolvedValue({
      id: 't2', completed: false,
    } as never);
    vi.mocked(db.todo.update).mockResolvedValue({ id: 't2', completed: true } as never);

    const result = await todo.toggleTodo('t2');
    expect(result.completed).toBe(true);
    expect(db.todo.update).toHaveBeenCalledWith({
      where: { id: 't2' },
      data: { completed: true },
    });
  });

  it('listTodos 未完成優先，按 dueDate asc', async () => {
    vi.mocked(db.todo.findMany).mockResolvedValue([] as never);
    await todo.listTodos();
    expect(db.todo.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ completed: 'asc' }, { dueDate: 'asc' }],
      }),
    );
  });
});