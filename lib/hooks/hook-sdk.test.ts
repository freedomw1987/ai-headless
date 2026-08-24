/**
 * TDD Gate 1 — Hook SDK 完整測試
 *
 * 涵蓋：
 * 1. 11 種 Hook 類型定義（beforeCreate/afterCreate/beforeUpdate/afterUpdate/
 *    beforeDelete/afterDelete/onTransition/beforeList/afterList/beforeRead/afterRead）
 * 2. Hook Context 結構（每種 hook 接收的參數）
 * 3. Hook Runtime（執行 hook + 處理 async + 修改返回值）
 * 4. Hook Registry（註冊/查詢/清空）
 * 5. {{fn:...}} 引用解析 + 自動調用（TD-301 整合）
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createHookRegistry,
  invokeHook,
  registerHook,
  hasHook,
  resetHooks,
  parseHookReference,
  isHookReference,
  HOOK_NAMES,
  type HookContext,
  type HookFunction,
} from './hook-sdk';

// ==============================================
// 1. HOOK_NAMES 常數
// ==============================================

describe('HOOK_NAMES', () => {
  it('包含 11 種 hook 名稱', () => {
    expect(HOOK_NAMES).toContain('beforeCreate');
    expect(HOOK_NAMES).toContain('afterCreate');
    expect(HOOK_NAMES).toContain('beforeUpdate');
    expect(HOOK_NAMES).toContain('afterUpdate');
    expect(HOOK_NAMES).toContain('beforeDelete');
    expect(HOOK_NAMES).toContain('afterDelete');
    expect(HOOK_NAMES).toContain('onTransition');
    expect(HOOK_NAMES).toContain('beforeList');
    expect(HOOK_NAMES).toContain('afterList');
    expect(HOOK_NAMES).toContain('beforeRead');
    expect(HOOK_NAMES).toContain('afterRead');
    expect(HOOK_NAMES.length).toBe(11);
  });
});

// ==============================================
// 2. HookRegistry 基本操作
// ==============================================

describe('createHookRegistry', () => {
  it('create 註冊後可查找', () => {
    const registry = createHookRegistry();
    const fn: HookFunction<HookContext<'beforeCreate'>> = async (ctx) => ctx;
    registry.register('myFn', fn);
    expect(registry.has('myFn')).toBe(true);
  });

  it('重複註冊同名函數拋出錯誤', () => {
    const registry = createHookRegistry();
    const fn: HookFunction<HookContext<'beforeCreate'>> = async (ctx) => ctx;
    registry.register('myFn', fn);
    expect(() => registry.register('myFn', fn)).toThrow(/already registered/);
  });

  it('未註冊的函數 has 返回 false', () => {
    const registry = createHookRegistry();
    expect(registry.has('notRegistered')).toBe(false);
  });

  it('clear 清空所有已註冊函數', () => {
    const registry = createHookRegistry();
    registry.register('fn1', async (ctx) => ctx);
    registry.clear();
    expect(registry.has('fn1')).toBe(false);
  });

  it('invoke 執行已註冊 hook 並回傳結果', async () => {
    const registry = createHookRegistry();
    registry.register<HookContext<'beforeCreate'>>('addTimestamp', async (ctx) => ({
      ...ctx,
      data: { ...ctx.data, createdAt: 12345 },
    }));

    const result = await registry.invoke<HookContext<'beforeCreate'>>('addTimestamp', {
      data: { name: 'test' },
    });

    expect(result.data).toEqual({ name: 'test', createdAt: 12345 });
  });

  it('invoke 不存在的函數拋出錯誤', async () => {
    const registry = createHookRegistry();
    await expect(registry.invoke('notExist', { data: {} })).rejects.toThrow(
      /Hook.*not found/,
    );
  });

  it('invoke 支援 async hook 函數', async () => {
    const registry = createHookRegistry();
    registry.register<HookContext<'afterCreate'>>('async', async (ctx) => {
      await new Promise((r) => setTimeout(r, 1));
      return { ...ctx, result: { ...ctx.result, status: 'async-done' } };
    });

    const result = await registry.invoke<HookContext<'afterCreate'>>('async', { result: { status: '' } });
    expect(result.result.status).toBe('async-done');
  });

  it('invoke 支援 sync hook 函數（不返回 Promise）', async () => {
    const registry = createHookRegistry();
    registry.register<HookContext<'beforeRead'>>('sync', (ctx) => ({
      ...ctx,
      id: 'modified-id',
    }));

    const result = await registry.invoke<HookContext<'beforeRead'>>('sync', { id: 'original' });
    expect(result.id).toBe('modified-id');
  });
});

// ==============================================
// 3. Global Hook Registry（模組級 singleton）
// ==============================================

describe('Global Hook Registry', () => {
  beforeEach(() => {
    resetHooks();
  });

  it('registerHook + hasHook 配對', () => {
    registerHook('globalFn', async (ctx) => ctx);
    expect(hasHook('globalFn')).toBe(true);
    expect(hasHook('notExist')).toBe(false);
  });

  it('invokeHook 執行 global hook', async () => {
    registerHook<HookContext<'beforeCreate'>>('uppercaseName', (ctx) => ({
      ...ctx,
      data: { ...ctx.data, name: String(ctx.data.name).toUpperCase() },
    }));

    const result = await invokeHook<HookContext<'beforeCreate'>>('uppercaseName', {
      data: { name: 'alice' },
    });

    expect(result.data.name).toBe('ALICE');
  });

  it('invokeHook 不存在拋出錯誤', async () => {
    await expect(invokeHook('notExist', {})).rejects.toThrow();
  });

  it('resetHooks 清空所有 global hooks', () => {
    registerHook('fn', async (ctx) => ctx);
    resetHooks();
    expect(hasHook('fn')).toBe(false);
  });
});

// ==============================================
// 4. Hook Reference Parser（TD-301 相關）
// ==============================================

describe('parseHookReference', () => {
  it('解析合法 {{fn:name}} 引用', () => {
    expect(parseHookReference('{{fn:generateSlug}}')).toBe('generateSlug');
  });

  it('解析 {{ fn: name }}（含空格）', () => {
    expect(parseHookReference('{{ fn: myHook }}')).toBe('myHook');
  });

  it('合法：純函數名不是 {{fn:...}}', () => {
    expect(parseHookReference('plainName')).toBeNull();
  });

  it('合法：{{fn:}} 空名稱返回 null', () => {
    expect(parseHookReference('{{fn:}}')).toBeNull();
  });

  it('合法：{{other:name}} 不是 hook 引用', () => {
    expect(parseHookReference('{{other:name}}')).toBeNull();
  });
});

describe('isHookReference', () => {
  it('合法引用返回 true', () => {
    expect(isHookReference('{{fn:myHook}}')).toBe(true);
    expect(isHookReference('{{ fn: myHook }}')).toBe(true);
  });

  it('非法引用返回 false', () => {
    expect(isHookReference('myHook')).toBe(false);
    expect(isHookReference('{{other:x}}')).toBe(false);
    expect(isHookReference('')).toBe(false);
  });
});

// ==============================================
// 5. 11 種 Hook 各自的 Context 驗證
// ==============================================

describe('Hook Contexts', () => {
  beforeEach(() => {
    resetHooks();
  });

  it('beforeCreate context 含 data', async () => {
    registerHook<HookContext<'beforeCreate'>>('test', (ctx) => {
      expect(ctx.data).toBeDefined();
      expect(ctx.model).toBeDefined();
      return ctx;
    });

    await invokeHook<HookContext<'beforeCreate'>>('test', {
      data: { x: 1 },
      model: 'Post',
    });
  });

  it('afterCreate context 含 result', async () => {
    registerHook<HookContext<'afterCreate'>>('test', (ctx) => {
      expect(ctx.result).toBeDefined();
      return ctx;
    });

    await invokeHook<HookContext<'afterCreate'>>('test', {
      result: { id: '1' },
    });
  });

  it('beforeUpdate context 含 id + data + existing', async () => {
    registerHook<HookContext<'beforeUpdate'>>('test', (ctx) => {
      expect(ctx.id).toBeDefined();
      expect(ctx.data).toBeDefined();
      expect(ctx.existing).toBeDefined();
      return ctx;
    });

    await invokeHook<HookContext<'beforeUpdate'>>('test', {
      id: '1',
      data: { name: 'new' },
      existing: { id: '1', name: 'old' },
    });
  });

  it('beforeDelete context 含 id + existing', async () => {
    registerHook<HookContext<'beforeDelete'>>('test', (ctx) => {
      expect(ctx.id).toBeDefined();
      expect(ctx.existing).toBeDefined();
      return ctx;
    });

    await invokeHook<HookContext<'beforeDelete'>>('test', {
      id: '1',
      existing: {},
    });
  });

  it('onTransition context 含 fromState + toState + data', async () => {
    registerHook<HookContext<'onTransition'>>('test', (ctx) => {
      expect(ctx.fromState).toBeDefined();
      expect(ctx.toState).toBeDefined();
      expect(ctx.data).toBeDefined();
      return ctx;
    });

    await invokeHook<HookContext<'onTransition'>>('test', {
      fromState: 'draft',
      toState: 'published',
      data: {},
    });
  });

  it('beforeList context 含 query', async () => {
    registerHook<HookContext<'beforeList'>>('test', (ctx) => {
      expect(ctx.query).toBeDefined();
      return ctx;
    });

    await invokeHook<HookContext<'beforeList'>>('test', { query: {} });
  });

  it('afterList context 含 result', async () => {
    registerHook<HookContext<'afterList'>>('test', (ctx) => {
      expect(ctx.result).toBeDefined();
      return ctx;
    });

    await invokeHook<HookContext<'afterList'>>('test', { result: [] });
  });

  it('beforeRead context 含 id', async () => {
    registerHook<HookContext<'beforeRead'>>('test', (ctx) => {
      expect(ctx.id).toBeDefined();
      return ctx;
    });

    await invokeHook<HookContext<'beforeRead'>>('test', { id: '1' });
  });

  it('afterRead context 含 data', async () => {
    registerHook<HookContext<'afterRead'>>('test', (ctx) => {
      expect(ctx.data).toBeDefined();
      return ctx;
    });

    await invokeHook<HookContext<'afterRead'>>('test', { data: {} });
  });
});

// ==============================================
// 6. 真實世界使用情境（TD-301 驗證）
// ==============================================

describe('Real-world: TD-301 Hook Runtime integration', () => {
  beforeEach(() => {
    resetHooks();
  });

  it('模擬 Extension 註冊 generateSlug hook → 框架自動調用', async () => {
    // 1. Extension 啟動時註冊 hook
    registerHook<HookContext<'beforeCreate'>>('generateSlug', (ctx) => {
      const title = String(ctx.data.title ?? '');
      const slug = title.toLowerCase().replace(/\s+/g, '-');
      return { ...ctx, data: { ...ctx.data, slug } };
    });

    // 2. 框架（API Generator 產生的代碼）呼叫 hook
    const input: HookContext<'beforeCreate'> = {
      data: { title: 'Hello World' },
      model: 'Post',
    };
    const result = await invokeHook<HookContext<'beforeCreate'>>('generateSlug', input);

    expect(result.data.slug).toBe('hello-world');
  });

  it('hook 拋出錯誤時 invokeHook 會 reject', async () => {
    registerHook<HookContext<'beforeCreate'>>('fail', () => {
      throw new Error('Validation failed');
    });

    await expect(invokeHook('fail', { data: {} })).rejects.toThrow('Validation failed');
  });

  it('多個 hook 串連執行（pipeline）', async () => {
    registerHook<HookContext<'beforeCreate'>>('step1', (ctx) => ({
      ...ctx,
      data: { ...ctx.data, step1: true },
    }));
    registerHook<HookContext<'beforeCreate'>>('step2', (ctx) => ({
      ...ctx,
      data: { ...ctx.data, step2: true },
    }));

    let result = await invokeHook<HookContext<'beforeCreate'>>('step1', { data: {} });
    result = await invokeHook<HookContext<'beforeCreate'>>('step2', result);

    expect(result.data).toEqual({ step1: true, step2: true });
  });
});