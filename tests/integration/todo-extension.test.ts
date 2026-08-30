/**
 * TDD Gate 1 — S3.1 Todo Extension 整合測試
 *
 * 涵蓋：
 * 1. Todo manifest 載入（ExtensionLoader）
 * 2. Todo JsonSpec 驗證（schema-generator + validator）
 * 3. Hook beforeCreate 自動 trim + 預設值
 * 4. Computed remainingDays 計算
 * 5. Action complete 標記完成
 * 6. 完整真實 CRUD Flow
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { loadSpec } from '@/lib/runtime/spec-loader';
import { validateJsonSpec } from '@/lib/specs/json-spec.validator';
import type { JsonSpec } from '@/lib/specs/json-spec.types';
import { db } from '@/lib/db';

// ==============================================
// 1. Manifest 載入
// ==============================================

describe('S3.1 Todo Extension Manifest', () => {
  it('extensions/todo/manifest.json 存在且可載入', () => {
    const manifestPath = path.join(
      process.cwd(),
      'extensions/todo/manifest.json',
    );
    expect(fs.existsSync(manifestPath)).toBe(true);

    const raw = fs.readFileSync(manifestPath, 'utf-8');
    const parsed = JSON.parse(raw);

    expect(parsed.name).toBe('todo');
    expect(parsed.version).toMatch(/^\d+\.\d+\.\d+/);
    expect(parsed.hooks).toContain('todo.beforeCreate');
    expect(parsed.actions).toContain('todo.complete');
    expect(parsed.computed).toContain('todo.remainingDays');
  });

  it('manifest 通過 ExtensionLoader 驗證', async () => {
    const { ExtensionLoader } = await import('@/lib/extensions/extension-loader');

    const raw = fs.readFileSync(
      path.join(process.cwd(), 'extensions/todo/manifest.json'),
      'utf-8',
    );

    const loader = new ExtensionLoader();
    const manifest = await loader.loadFromJson(raw);

    expect(manifest.name).toBe('todo');
    expect(manifest.hooks).toHaveLength(2);
  });
});

// ==============================================
// 2. JsonSpec 驗證
// ==============================================

describe('S3.1 Todo JsonSpec', () => {
  let todoSpec: JsonSpec;

  beforeEach(() => {
    const raw = fs.readFileSync(
      path.join(process.cwd(), 'extensions/todo/todo-spec.json'),
      'utf-8',
    );
    todoSpec = JSON.parse(raw);
  });

  it('todo-spec.json 通過 json-spec validator', () => {
    expect(() => validateJsonSpec(todoSpec)).not.toThrow();
  });

  it('Todo model 有完整欄位定義', () => {
    const todo = todoSpec.models[0]!;
    expect(todo.name).toBe('Todo');
    expect(todo.fields).toHaveLength(5);

    const fieldNames = todo.fields.map((f) => f.name);
    expect(fieldNames).toEqual(
      expect.arrayContaining(['title', 'description', 'completed', 'dueDate', 'priority']),
    );
  });

  it('Todo model 含 1 個 computed + 1 個 hook + 1 個 action', () => {
    const todo = todoSpec.models[0]!;
    expect(todo.computed).toHaveLength(1);
    expect(todo.computed![0]!.name).toBe('remainingDays');

    expect(todo.hooks?.beforeCreate).toBe('{{fn:beforeCreateTodo}}');
    expect(todo.actions).toHaveLength(1);
    expect(todo.actions![0]!.name).toBe('complete');
  });
});

// ==============================================
// 3. Prisma Schema 生成
// ==============================================

describe('S3.1 Todo → Runtime Loader', () => {
  it('Runtime loader 能讀取所有 Todo 欄位', async () => {
    const raw = fs.readFileSync(
      path.join(process.cwd(), 'extensions/todo/todo-spec.json'),
      'utf-8',
    );
    const spec: JsonSpec = JSON.parse(raw);

    // Sprint 14: runtime loader 取代 compiler
    const loaded = await loadSpec('todo');
    expect(loaded.models).toHaveLength(1);
    const model = loaded.models[0]!;
    expect(model.name).toBe('Todo');
    const fieldNames = model.fields.map((f) => f.name);
    expect(fieldNames).toContain('title');
    expect(fieldNames).toContain('description');
    expect(fieldNames).toContain('completed');
    expect(fieldNames).toContain('dueDate');
    expect(fieldNames).toContain('priority');
  });

  it('priority 欄位帶有預設值 "medium"', async () => {
    // Prisma schema 仍手動維護（在 prisma/schema.prisma）
    const prismaRaw = fs.readFileSync(
      path.join(process.cwd(), 'prisma/schema.prisma'),
      'utf-8',
    );
    expect(prismaRaw).toContain('priority');
    expect(prismaRaw).toMatch(/priority\s+String\s+@default\("medium"\)/);

    // spec 同步驗證
    const loaded = await loadSpec('todo');
    const priorityField = loaded.models[0]!.fields.find((f) => f.name === 'priority');
    expect(priorityField?.validation?.default).toBe('medium');
  });
});

// ==============================================
// 4. 真實 CRUD Flow（用 computed-sdk + action-sdk + hook-sdk）
// ==============================================

import { beforeCreateTodo } from '@/extensions/todo/hooks/before-create';
import { remainingDays } from '@/extensions/todo/computed/remaining-days';
import { completeTodo } from '@/extensions/todo/actions/complete';

describe('S3.1 Todo 真實 CRUD Flow', () => {
  it('beforeCreateHook：trim title + 預設 dueDate + priority', async () => {
    const ctx = {
      model: 'Todo',
      action: 'create' as const,
      data: {
        title: '  買牛奶  ',
        completed: false,
      },
    };

    const result = await beforeCreateTodo(ctx);
    const data = result as Record<string, unknown>;

    expect(data.title).toBe('買牛奶'); // trimmed
    expect(data.dueDate).toBeTruthy(); // 預設設定
    expect(data.priority).toBe('medium'); // 預設值
  });

  it('remainingDays computed：根據 dueDate 計算', () => {
    const future = new Date();
    future.setDate(future.getDate() + 5);

    const days = remainingDays({
      completed: false,
      dueDate: future.toISOString(),
    });

    expect(days).toBeGreaterThanOrEqual(4);
    expect(days).toBeLessThanOrEqual(5);
  });

  it('remainingDays：已完成 → 0', () => {
    expect(
      remainingDays({ completed: true, dueDate: new Date().toISOString() }),
    ).toBe(0);
  });

  it('remainingDays：無 dueDate → null', () => {
    expect(remainingDays({ completed: false })).toBe(null);
  });

  it('completeTodo action：標記為完成', async () => {
    const ctx = {
      action: 'complete' as const,
      data: {
        id: 'todo-1',
        title: 'Test',
        completed: false,
      },
    };

    const result = await completeTodo({}, ctx);

    expect(result.completed).toBe(true);
    expect(result.completedAt).toBeTruthy();
  });

  it('completeTodo action：已完成的 Todo 重複呼叫報錯', async () => {
    const ctx = {
      action: 'complete' as const,
      data: {
        id: 'todo-1',
        completed: true,
      },
    };

    await expect(completeTodo({}, ctx)).rejects.toThrow('already completed');
  });
});

// ==============================================
// 5. 跨 Extension 整合（Todo + Computed + Action）
// ==============================================

describe('S3.1 Todo 跨模組整合', () => {
  it('建立 → 計算剩餘天數 → 完成 → 剩餘天數變 0', async () => {
    // 1. 模擬 beforeCreate hook 的 defaults
    const createCtx = {
      model: 'Todo',
      action: 'create' as const,
      data: {
        title: '寫報告',
        completed: false,
      },
    };
    const hooked = (await beforeCreateTodo(createCtx)) as Record<string, unknown>;

    // 2. 實際寫入 DB 才能拿 id (completeTodo 需要 record.id 寫 TransitionLog)
    const created = await db.todo.create({
      data: {
        title: hooked.title as string,
        completed: hooked.completed as boolean,
        dueDate: hooked.dueDate as Date,
        priority: (hooked.priority as string) ?? 'medium',
      },
    });

    expect(created.title).toBe('寫報告');
    expect(created.completed).toBe(false);

    // 3. 計算剩餘天數
    const remaining = remainingDays({
      completed: created.completed,
      dueDate: created.dueDate!.toISOString(),
    });
    expect(remaining).toBeGreaterThan(0); // 預設 +7 天後

    // 4. 標記完成
    const completeCtx = {
      action: 'complete' as const,
      data: created,
    };
    const completed = await completeTodo({}, completeCtx);
    expect(completed.completed).toBe(true);

    // 5. 重新計算 → 應為 0
    const finalRemaining = remainingDays({
      completed: true,
      dueDate: completed.dueDate as string,
    });
    expect(finalRemaining).toBe(0);

    // 6. cleanup
    await db.transitionLog.deleteMany({ where: { entityId: created.id } });
    await db.todo.delete({ where: { id: created.id } });
  });
});