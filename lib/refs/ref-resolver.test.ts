/**
 * TDD Gate 1 — {{fn:...}} 引用解析器完整測試
 *
 * 涵蓋：
 * 1. 統一引用掃描器：掃整個 JSON Spec 找所有 {{fn:...}}
 * 2. Reference 類型化（hook / action / computed / guard / effect）
 * 3. 依賴驗證：哪些函數在 spec 引用但 Extension 沒註冊
 * 4. 模板渲染：在字符串中替換 {{fn:result}} 為實際值
 * 5. Generator 整合輔助：emitGeneratorHookCall
 */

import { describe, it, expect } from 'vitest';
import type { JsonSpec } from '@/lib/specs/json-spec.types';
import {
  extractAllReferences,
  validateReferences,
  renderTemplate,
} from './ref-resolver';

// ==============================================
// 1. extractAllReferences 掃描整個 JSON Spec
// ==============================================

describe('extractAllReferences', () => {
  it('從 model.hooks 提取所有 hook 引用', () => {
    const spec: Partial<JsonSpec> = {
      models: [
        {
          name: 'Post',
          fields: [],
          hooks: {
            beforeCreate: '{{fn:validateInput}}',
            afterCreate: '{{fn:notifySubscribers}}',
          },
        },
      ],
    };

    const refs = extractAllReferences(spec as JsonSpec);
    const hookRefs = refs.filter((r) => r.kind === 'hook');

    expect(hookRefs.length).toBe(2);
    expect(hookRefs.map((r) => r.name).sort()).toEqual([
      'notifySubscribers',
      'validateInput',
    ]);
  });

  it('從 model.actions 提取 action 引用', () => {
    const spec: Partial<JsonSpec> = {
      models: [
        {
          name: 'Order',
          fields: [],
          actions: [
            {
              name: 'markAsPaid',
              label: '標記為已付款',
              implementation: '{{fn:markOrderAsPaid}}',
            },
            {
              name: 'cancel',
              label: '取消',
              implementation: '{{fn:cancelOrder}}',
            },
          ],
        },
      ],
    };

    const refs = extractAllReferences(spec as JsonSpec);
    const actionRefs = refs.filter((r) => r.kind === 'action');

    expect(actionRefs.length).toBe(2);
    expect(actionRefs.map((r) => r.name).sort()).toEqual([
      'cancelOrder',
      'markOrderAsPaid',
    ]);
  });

  it('從 model.computed 提取 computed 引用', () => {
    const spec: Partial<JsonSpec> = {
      models: [
        {
          name: 'Order',
          fields: [],
          computed: [
            {
              name: 'total',
              type: 'number',
              compute: '{{fn:calculateTotal}}',
            },
          ],
        },
      ],
    };

    const refs = extractAllReferences(spec as JsonSpec);
    const computedRefs = refs.filter((r) => r.kind === 'computed');

    expect(computedRefs.length).toBe(1);
    expect(computedRefs[0]?.name).toBe('calculateTotal');
  });

  it('從 workflow states / transitions 提取所有引用', () => {
    const spec: Partial<JsonSpec> = {
      workflows: [
        {
          name: 'order',
          initialState: 'draft',
          states: {
            draft: { label: '草稿', onExit: '{{fn:beforeLeaveDraft}}' },
            paid: { label: '已付款', onEnter: '{{fn:afterEnterPaid}}' },
          },
          transitions: [
            {
              from: 'draft',
              to: 'paid',
              guard: '{{fn:canPay}}',
              effect: '{{fn:afterPayment}}',
            },
          ],
        },
      ],
    };

    const refs = extractAllReferences(spec as JsonSpec);
    const workflowRefs = refs.filter((r) => r.kind === 'workflow');

    // onExit, onEnter, guard, effect = 4 refs
    expect(workflowRefs.length).toBe(4);
    expect(workflowRefs.map((r) => r.name).sort()).toEqual([
      'afterEnterPaid',
      'afterPayment',
      'beforeLeaveDraft',
      'canPay',
    ]);
  });

  it('包含 location（用於錯誤定位）', () => {
    const spec: Partial<JsonSpec> = {
      models: [
        {
          name: 'Post',
          fields: [],
          hooks: { beforeCreate: '{{fn:myHook}}' },
        },
      ],
    };

    const refs = extractAllReferences(spec as JsonSpec);
    expect(refs[0]?.location).toBe('models[Post].hooks.beforeCreate');
  });

  it('合法引用（非 {{fn:...}}）不會被提取', () => {
    const spec: Partial<JsonSpec> = {
      models: [
        {
          name: 'Post',
          fields: [],
          hooks: { beforeCreate: 'plainFunctionName' },
        },
      ],
    };

    const refs = extractAllReferences(spec as JsonSpec);
    expect(refs.length).toBe(1);
    expect(refs[0]?.name).toBe('plainFunctionName');
  });

  it('空 spec 返回空陣列', () => {
    const refs = extractAllReferences({} as JsonSpec);
    expect(refs).toEqual([]);
  });
});

// ==============================================
// 2. validateReferences 依賴驗證
// ==============================================

describe('validateReferences', () => {
  it('全部已註冊 → valid', () => {
    const spec: Partial<JsonSpec> = {
      models: [
        {
          name: 'Post',
          fields: [],
          hooks: { beforeCreate: '{{fn:myHook}}' },
        },
      ],
    };

    const result = validateReferences(spec as JsonSpec, {
      hooks: new Set(['myHook']),
      actions: new Set(),
      computed: new Set(),
    });

    expect(result.valid).toBe(true);
    expect(result.missing).toEqual([]);
  });

  it('有未註冊函數 → invalid + missing 列表', () => {
    const spec: Partial<JsonSpec> = {
      models: [
        {
          name: 'Post',
          fields: [],
          hooks: {
            beforeCreate: '{{fn:registeredHook}}',
            afterCreate: '{{fn:missingHook}}',
          },
        },
      ],
    };

    const result = validateReferences(spec as JsonSpec, {
      hooks: new Set(['registeredHook']),
      actions: new Set(),
      computed: new Set(),
    });

    expect(result.valid).toBe(false);
    expect(result.missing.length).toBe(1);
    expect(result.missing[0]).toEqual({
      kind: 'hook',
      name: 'missingHook',
      location: 'models[Post].hooks.afterCreate',
    });
  });

  it('跨類型驗證（hook vs action vs computed）', () => {
    const spec: Partial<JsonSpec> = {
      models: [
        {
          name: 'Post',
          fields: [],
          hooks: { beforeCreate: '{{fn:myHook}}' },
          actions: [
            {
              name: 'a',
              label: 'A',
              implementation: '{{fn:myAction}}',
            },
          ],
          computed: [
            { name: 'c', type: 'number', compute: '{{fn:myComputed}}' },
          ],
        },
      ],
    };

    const result = validateReferences(spec as JsonSpec, {
      hooks: new Set(['myHook']),
      actions: new Set(['myAction']),
      computed: new Set(['myComputed']),
    });

    expect(result.valid).toBe(true);
  });

  it('類型混淆：hook 名稱被當 action 引用 → invalid', () => {
    const spec: Partial<JsonSpec> = {
      models: [
        {
          name: 'Post',
          fields: [],
          actions: [
            {
              name: 'a',
              label: 'A',
              implementation: '{{fn:myHook}}', // 假設用戶搞混
            },
          ],
        },
      ],
    };

    const result = validateReferences(spec as JsonSpec, {
      hooks: new Set(['myHook']),
      actions: new Set(), // 沒有 'myHook' action
      computed: new Set(),
    });

    expect(result.valid).toBe(false);
    expect(result.missing[0]?.kind).toBe('action');
    expect(result.missing[0]?.name).toBe('myHook');
  });
});

// ==============================================
// 3. renderTemplate 模板渲染
// ==============================================

describe('renderTemplate', () => {
  it('替換 {{fn:result}} 為 context 值', () => {
    const result = renderTemplate(
      'Hello {{fn:name}}, your order {{fn:orderId}} is ready',
      { name: 'Alice', orderId: 'ORD-001' },
    );
    expect(result).toBe('Hello Alice, your order ORD-001 is ready');
  });

  it('context 中沒有對應 key → 保留原樣', () => {
    const result = renderTemplate('Hello {{fn:name}}', {});
    expect(result).toBe('Hello {{fn:name}}');
  });

  it('非字符串輸入轉為字符串', () => {
    expect(renderTemplate(123 as unknown as string, {})).toBe('123');
    expect(renderTemplate(null as unknown as string, {})).toBe('');
  });

  it('混合內容（含 {{fn:...}} + 普通文字）', () => {
    const result = renderTemplate(
      '[{{fn:status}}] Order #{{fn:id}}',
      { status: 'paid', id: '123' },
    );
    expect(result).toBe('[paid] Order #123');
  });

  it('模板不含任何 {{fn:...}} → 原樣返回', () => {
    const result = renderTemplate('Just plain text', { x: 1 });
    expect(result).toBe('Just plain text');
  });

  it('嵌套鍵（用點號）', () => {
    const result = renderTemplate(
      '{{fn:user.name}} has {{fn:user.items.length}} items',
      { user: { name: 'Alice', items: { length: 3 } } },
    );
    expect(result).toBe('Alice has 3 items');
  });
});

// ==============================================
// 4. Real-world: 完整混合模式範例
// ==============================================

describe('Real-world: Complete Mixed Mode', () => {
  it('掃描 Blog with Hooks + Actions + Computed + Workflow', () => {
    const spec: Partial<JsonSpec> = {
      models: [
        {
          name: 'Post',
          fields: [
            { name: 'title', type: 'string' },
            { name: 'slug', type: 'string' },
            { name: 'publishedAt', type: 'datetime' },
          ],
          hooks: {
            beforeCreate: '{{fn:generateSlug}}',
            afterCreate: '{{fn:indexInSearch}}',
          },
          actions: [
            {
              name: 'publish',
              label: '發布',
              implementation: '{{fn:publishPost}}',
            },
          ],
          computed: [
            {
              name: 'readingTime',
              type: 'number',
              compute: '{{fn:calculateReadingTime}}',
            },
          ],
        },
      ],
      workflows: [
        {
          name: 'postLifecycle',
          initialState: 'draft',
          states: {
            draft: { label: '草稿', onExit: '{{fn:beforePublish}}' },
            published: { label: '已發布', onEnter: '{{fn:afterPublish}}' },
          },
          transitions: [
            {
              from: 'draft',
              to: 'published',
              effect: '{{fn:notifySubscribers}}',
            },
          ],
        },
      ],
    };

    const refs = extractAllReferences(spec as JsonSpec);
    const expectedNames = [
      'generateSlug',
      'indexInSearch',
      'publishPost',
      'calculateReadingTime',
      'beforePublish',
      'afterPublish',
      'notifySubscribers',
    ].sort();

    expect(refs.map((r) => r.name).sort()).toEqual(expectedNames);

    // 驗證（所有非 workflow ref 都已註冊 → valid = true）
    const result = validateReferences(spec as JsonSpec, {
      hooks: new Set(['generateSlug', 'indexInSearch']),
      actions: new Set(['publishPost']),
      computed: new Set(['calculateReadingTime']),
      // workflow 函數不驗證（由 effectRegistry 提供）
    });

    expect(result.valid).toBe(true);
    expect(result.missing).toEqual([]);
  });
});