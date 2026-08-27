/**
 * TDD Gate 1 — Sprint 31 commit 1
 * completeTodo action hook 加 transition log
 *
 * 對應 PRD: docs/specs/extension-spec.md (Todo)
 * 對應 Backlog: TD-新發現 E (Sprint 30 reflection 揭露)
 *
 * 問題:
 * - completeTodo 標記 Todo 為 completed
 * - 但沒有寫 TransitionLog → 對 Todo 狀態變更無 audit trail
 *
 * 修正:
 * - completeTodo 內部呼叫 db.transitionLog.create
 * - 記錄: machineName: 'todo', entityType: 'Todo', fromState: 'pending',
 *   toState: 'completed', userId: ctx.userId
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => {
  const todoMock: any = {
    findUnique: vi.fn(),
    findUniqueOrThrow: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
  const transitionLogMock: any = {
    create: vi.fn(),
  };
  return {
    db: {
      todo: todoMock,
      transitionLog: transitionLogMock,
    },
  };
});

import { db } from '@/lib/db';
import { completeTodo } from '@/extensions/todo/actions/complete';

describe('Sprint 31 commit 1 — completeTodo 加 transition log', () => {
  let capturedLog: any;

  beforeEach(() => {
    capturedLog = null;
    (db.todo as any).findUnique.mockReset();
    (db.todo as any).update.mockReset();
    (db.transitionLog as any).create.mockReset();

    // Default: findUnique 回傳 todo record (用於 log 讀取 fromState)
    (db.todo as any).findUnique.mockImplementation(
      async () => ({ id: 'todo-1', status: 'pending' }),
    );
    (db.transitionLog as any).create.mockImplementation(
      async ({ data }: any) => {
        capturedLog = data;
        return { id: 'log-1', ...data };
      },
    );
  });

  it('標記 Todo 為 completed → 寫 TransitionLog', async () => {
    const ctx = {
      data: { id: 'todo-1', title: 'Test Todo', completed: false },
      userId: 'u-user-1',
    };

    const result = await completeTodo({}, ctx as any);

    expect(result.completed).toBe(true);
    expect(capturedLog).not.toBeNull();
    expect(capturedLog.machineName).toBe('todo');
    expect(capturedLog.entityType).toBe('Todo');
    expect(capturedLog.entityId).toBe('todo-1');
    expect(capturedLog.fromState).toBe('pending');
    expect(capturedLog.toState).toBe('completed');
    expect(capturedLog.reason).toBe('complete');
    // userId 從 ctx.userId 取得 (Sprint 29 注入)
    expect(capturedLog.userId).toBe('u-user-1');
  });

  it('Todo 已 completed → 拋錯不寫 log', async () => {
    const ctx = {
      data: { id: 'todo-1', title: 'Test Todo', completed: true }, // 已完成
      userId: 'u-user-1',
    };

    await expect(completeTodo({}, ctx as any)).rejects.toThrow(
      /already completed/,
    );
    // log 不應被寫入
    expect(capturedLog).toBeNull();
  });

  it('context 無 data → 拋錯', async () => {
    const ctx = { userId: 'u-user-1' };
    await expect(completeTodo({}, ctx as any)).rejects.toThrow(
      /record not found/,
    );
    expect(capturedLog).toBeNull();
  });
});