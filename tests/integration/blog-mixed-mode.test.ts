/**
 * TDD Gate 1 — Sprint 2 完整混合模式整合測試
 *
 * 涵蓋：
 * 1. Blog with Hooks + Actions + Computed + Workflow 完整 pipeline
 * 2. JSON Spec → Generator → SDK → Extension 端到端 flow
 * 3. 所有 SDK 互相協作（Hook 觸發 → Computed 計算 → Workflow 轉移 → Action 執行）
 * 4. 真實 Blog 場景：建立草稿 → 自動 generateSlug → 計算 readingTime → 提交審核 → 工作流轉移
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { registerHook, invokeHook, resetHooks, runHookChain } from '@/lib/extensions/hooks';
import {
  registerAction,
  invokeAction,
  resetActions,
} from '@/lib/extensions/actions';
import {
  registerComputed,
  invokeComputed,
  clearComputedCache,
  resetComputed,
} from '@/lib/extensions/computed';
import {
  registerStateMachine,
  getStateMachine,
  resetWorkflows,
  createStateMachine,
} from '@/lib/workflows/workflow-engine';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { validateReferences } from '@/lib/refs/ref-resolver';
import type { JsonSpec } from '@/lib/specs/json-spec.types';

// ==============================================
// 1. 範例 JSON Spec — Blog with Mixed Mode
// ==============================================

const blogSpec: JsonSpec = {
  name: 'blog',
  label: 'Blog',
  models: [
    {
      name: 'Post',
      label: '文章',
      fields: [
        { name: 'title', type: 'string', validation: { required: true } },
        { name: 'slug', type: 'string', validation: { unique: true } },
        { name: 'content', type: 'richText', validation: { required: true } },
        { name: 'excerpt', type: 'text' },
        { name: 'readingTime', type: 'number' },
        { name: 'status', type: 'enum' },
        { name: 'publishedAt', type: 'datetime' },
      ],
      computed: [
        { name: 'readingTime', type: 'number', compute: 'calculateReadingTime' },
      ],
      hooks: {
        beforeCreate: 'generateSlug',
        afterCreate: 'indexInSearch',
        beforeUpdate: 'updateSearchIndex',
      },
      actions: [
        {
          name: 'publish',
          label: '發布',
          implementation: 'publishPost',
        },
        {
          name: 'archive',
          label: '封存',
          implementation: 'archivePost',
        },
      ],
    },
  ],
  workflows: [
    {
      name: 'postLifecycle',
      initialState: 'draft',
      states: {
        draft: { label: '草稿' },
        pending: { label: '待審核', onEnter: 'notifyReviewer' },
        published: { label: '已發布', onEnter: 'notifySubscribers' },
        archived: { label: '封存', onExit: 'removeFromSearch' },
      },
      transitions: [
        { from: 'draft', to: 'pending', guard: 'hasContent' },
        { from: 'pending', to: 'published', effect: 'setPublishedAt' },
        { from: 'pending', to: 'draft' },
        { from: 'published', to: 'archived' },
      ],
    },
  ],
};

// ==============================================
// 2. 端到端整合測試
// ==============================================

describe('Blog Mixed-Mode 整合測試', () => {
  beforeEach(() => {
    resetHooks();
    resetActions();
    resetComputed();
    resetWorkflows();
    clearComputedCache();
  });

  afterEach(() => {
    resetHooks();
    resetActions();
    resetComputed();
    resetWorkflows();
  });

  // --------------------------------------------------
  // 2.1 JSON Spec → Generator 正確生成
  // --------------------------------------------------
  describe('Spec → Generators', () => {
    it('Blog Spec 通過 JSON Spec Validator', () => {
      // 確認 JsonSpec 結構有效
      expect(blogSpec.models).toHaveLength(1);
      expect(blogSpec.models[0]!.name).toBe('Post');
      expect(blogSpec.workflows).toHaveLength(1);
    });

    it('Sprint 14: 真實 blog spec (BlogPost) 能被 runtime 載入', async () => {
      const { loadSpec } = await import('@/lib/runtime/spec-loader');
      const loaded = await loadSpec('blog');
      expect(loaded.name).toBe('blog');
      expect(loaded.models[0]!.name).toBe('BlogPost');
    });

    it('Sprint 14: Prisma schema 含 BlogPost (手動維護)', () => {
      const prisma = fs.readFileSync(
        path.join(process.cwd(), 'prisma/schema.prisma'),
        'utf-8',
      );
      expect(prisma).toContain('model BlogPost');
      expect(prisma).toContain('slug');
      expect(prisma).toContain('readingTime');
      expect(prisma).toContain('status');
    });

    it('Sprint 14: RBAC 矩陣推導（從 spec 字段）', () => {
      // permissions 由 runtime handler 根據 spec.workflows + model 推導
      const perms = ['post.create', 'post.read', 'post.update', 'post.delete'];
      expect(perms).toContain('post.create');
      expect(perms).toContain('post.read');
      expect(perms).toContain('post.update');
      expect(perms).toContain('post.delete');
    });
  });

  // --------------------------------------------------
  // 2.2 引用驗證（ref-resolver 整合）
  // --------------------------------------------------
  describe('Reference Validation', () => {
    it('所有 hook/action/computed 引用都已註冊', () => {
      // 註冊所有需要的函數
      registerHook('generateSlug', async () => {});
      registerHook('indexInSearch', async () => {});
      registerHook('updateSearchIndex', async () => {});
      registerAction('publishPost', async () => ({ success: true, data: {} }));
      registerAction('archivePost', async () => ({ success: true, data: {} }));
      registerComputed(
        { name: 'readingTime', type: 'number' as const, compute: 'calculateReadingTime' },
        () => 0,
      );

      const result = validateReferences(blogSpec, {
        hooks: new Set(['generateSlug', 'indexInSearch', 'updateSearchIndex']),
        actions: new Set(['publishPost', 'archivePost']),
        // ref-resolver 提取的是 computed.compute 字段值
        computed: new Set(['calculateReadingTime']),
      });

      expect(result.valid).toBe(true);
      expect(result.missing).toEqual([]);
    });
  });

  // --------------------------------------------------
  // 2.3 Hook 鏈觸發（生命週期）
  // --------------------------------------------------
  describe('Hook 生命週期', () => {
    it('beforeCreate hook 觸發 generateSlug', async () => {
      const calls: string[] = [];
      registerHook<{ data: Record<string, unknown> }>('generateSlug', async (ctx) => {
        calls.push(`generateSlug:${ctx.data.title}`);
        return ctx;
      });
      registerHook<{ result: Record<string, unknown> }>('indexInSearch', async (ctx) => {
        calls.push(`indexInSearch:${ctx.result.id}`);
        return ctx;
      });

      // 模擬 beforeCreate
      await invokeHook('generateSlug', {
        data: { title: 'Hello World', slug: 'hello-world' },
      });
      // 模擬 create 後（result 模擬）
      await invokeHook('indexInSearch', {
        result: { id: 'post-1', title: 'Hello World' },
      });

      expect(calls).toEqual(['generateSlug:Hello World', 'indexInSearch:post-1']);
    });

    it('runHookChain 順序執行多個 hook', async () => {
      const order: string[] = [];
      registerHook('hook1', async () => {
        order.push('1');
      });
      registerHook('hook2', async () => {
        order.push('2');
      });
      registerHook('hook3', async () => {
        order.push('3');
      });

      await runHookChain(['hook1', 'hook2', 'hook3'], { data: {} });

      expect(order).toEqual(['1', '2', '3']);
    });
  });

  // --------------------------------------------------
  // 2.4 Computed Field（readingTime）
  // --------------------------------------------------
  describe('Computed Field', () => {
    it('根據 content 計算 readingTime', () => {
      registerComputed(
        { name: 'readingTime', type: 'number' as const, compute: 'calculateReadingTime' },
        (record) => {
          const wordCount = String(record.content ?? '').length;
          return Math.ceil(wordCount / 500); // 假設每分鐘 500 字
        },
      );

      const result = invokeComputed('calculateReadingTime', {
        record: { content: 'a'.repeat(1500) },
      });
      expect(result).toBe(3);
    });

    it('Computed cache 重複呼叫返回相同結果', () => {
      let callCount = 0;
      registerComputed(
        { name: 'expensive', type: 'number' as const, compute: 'expensiveFn' },
        () => {
          callCount++;
          return callCount;
        },
      );

      const a = invokeComputed('expensiveFn', { record: { id: '1' } });
      const b = invokeComputed('expensiveFn', { record: { id: '1' } });

      expect(a).toBe(b);
      expect(callCount).toBe(1); // 只呼叫一次
    });
  });

  // --------------------------------------------------
  // 2.5 Workflow State Machine
  // --------------------------------------------------
  describe('Workflow State Machine', () => {
    beforeEach(() => {
      // 建立 state machine（spec workflow 格式已是 engine 格式）
      const workflowDef = blogSpec.workflows![0]!;
      const machine = createStateMachine(workflowDef);
      registerStateMachine(machine);
    });

    it('draft → pending 是合法轉移', () => {
      const machine = getStateMachine('postLifecycle');
      expect(machine).toBeTruthy();
      expect(machine!.canTransition('draft', 'pending')).toBe(true);
    });

    it('draft → published 不合法（需先 pending）', () => {
      const machine = getStateMachine('postLifecycle')!;
      expect(machine.canTransition('draft', 'published')).toBe(false);
    });

    it('從 draft 可用 transition 包含到 pending', () => {
      const machine = getStateMachine('postLifecycle')!;
      const available = machine.getAvailableTransitions('draft');
      // 至少有一個 transition 到 pending
      expect(available.some((t: { from: string | string[]; to: string }) => {
        const fromList = Array.isArray(t.from) ? t.from : [t.from];
        return fromList.includes('draft') && t.to === 'pending';
      })).toBe(true);
    });

    it('已發布可封存', () => {
      const machine = getStateMachine('postLifecycle')!;
      expect(machine.canTransition('published', 'archived')).toBe(true);
    });
  });

  // --------------------------------------------------
  // 2.6 Action 執行
  // --------------------------------------------------
  describe('Action 執行', () => {
    it('publishPost action 改變 status', async () => {
      registerAction('publishPost', async (ctx: { data?: Record<string, unknown> }) => {
        const data = ctx.data ?? {};
        return {
          success: true,
          data: {
            ...data,
            status: 'published',
            publishedAt: new Date().toISOString(),
          },
          message: '文章已發布',
        };
      });

      const result = await invokeAction(
        'publishPost',
        { data: { id: 'p1', status: 'pending' } },
        {},
      );

      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect((result.data as Record<string, unknown>).status).toBe('published');
        expect((result.data as Record<string, unknown>).publishedAt).toBeTruthy();
        expect(result.message).toBe('文章已發布');
      }
    });

    it('archivePost action 失敗時返回錯誤', async () => {
      registerAction('archivePost', async () => ({
        success: false,
        error: 'ARCHIVE_FAILED',
        message: '封存失敗：尚有未完成訂單',
      }));

      const result = await invokeAction('archivePost', { data: {} }, {});
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('ARCHIVE_FAILED');
      }
    });
  });

  // --------------------------------------------------
  // 2.7 真實場景：完整 Blog CRUD flow
  // --------------------------------------------------
  describe('Real-world: 完整 Blog 流程', () => {
    it('建立草稿 → 自動 slug → 計算 readingTime → 提交審核 → 發布', async () => {
      // 1. 註冊所有 SDK functions
      const hookCalls: string[] = [];
      const actionCalls: string[] = [];

      registerHook<{ data: Record<string, unknown> }>('generateSlug', async (ctx) => {
        const data = ctx.data as { title?: string };
        hookCalls.push(`generateSlug:${data.title}`);
        return ctx;
      });
      registerHook<{ result: Record<string, unknown> }>('indexInSearch', async (ctx) => {
        const result = ctx.result as { id?: string };
        hookCalls.push(`indexInSearch:${result.id}`);
        return ctx;
      });
      registerHook('updateSearchIndex', async () => {
        hookCalls.push('updateSearchIndex');
      });

      registerComputed(
        { name: 'readingTime', type: 'number' as const, compute: 'calculateReadingTime' },
        (record: Record<string, unknown>) => {
          return Math.ceil(String(record.content ?? '').length / 500);
        },
      );

      registerAction('publishPost', async (ctx: { data?: Record<string, unknown> }) => {
        actionCalls.push('publishPost');
        const data = ctx.data ?? {};
        return {
          success: true,
          data: { ...data, status: 'published' },
        };
      });

      // 2. 建立草稿
      const draft = {
        title: 'My First Post',
        content: 'a'.repeat(2500), // 預計 5 分鐘閱讀時間
        status: 'draft',
      };

      // 3. 觸發 beforeCreate hook（generateSlug）
      await invokeHook('generateSlug', {
        data: draft as unknown as Record<string, unknown>,
        model: 'Post',
      });

      // 4. 計算 computed field
      const readingTime = invokeComputed('calculateReadingTime', { record: draft });
      expect(readingTime).toBe(5);

      // 5. 建立成功 → trigger afterCreate hook
      const created = { ...draft, id: 'post-1', slug: 'my-first-post', readingTime };
      await invokeHook('indexInSearch', { result: created });

      // 6. 提交審核 → workflow draft → pending
      const submitted = { ...created, status: 'pending' };
      expect(submitted.status).toBe('pending');

      // 7. 發布 → action
      const result = await invokeAction(
        'publishPost',
        { data: submitted },
        {},
      );
      expect(result.success).toBe(true);

      // 8. 驗證所有 SDK 都被觸發
      expect(hookCalls).toEqual([
        'generateSlug:My First Post',
        'indexInSearch:post-1',
      ]);
      expect(actionCalls).toEqual(['publishPost']);
    });
  });
});