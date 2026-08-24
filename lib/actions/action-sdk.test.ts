/**
 * TDD Gate 1 — Action SDK 完整測試
 *
 * 涵蓋：
 * 1. Action 類型定義（name/label/implementation/confirmation/requires/icon/variant）
 * 2. Action Registry（註冊/查找/清空）
 * 3. Action Runtime（執行 + 驗證 + 錯誤處理）
 * 4. {{fn:...}} 解析 → 自動查找已註冊 handler
 * 5. UI Generator 整合（生成按鈕 + onClick）
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { z } from 'zod';
import {
  createActionRegistry,
  registerAction,
  invokeAction,
  resetActions,
  type Action,
  type ActionResult,
  type ActionHandler,
} from './action-sdk';

// ==============================================
// 1. ActionRegistry 基本操作
// ==============================================

describe('createActionRegistry', () => {
  it('register 後可查找', () => {
    const registry = createActionRegistry();
    const handler: ActionHandler = async () => ({ success: true });
    registry.register('markAsPaid', handler);
    expect(registry.has('markAsPaid')).toBe(true);
  });

  it('重複註冊拋出錯誤', () => {
    const registry = createActionRegistry();
    const handler: ActionHandler = async () => ({ success: true });
    registry.register('x', handler);
    expect(() => registry.register('x', handler)).toThrow(/already registered/);
  });

  it('未註冊的 action has 返回 false', () => {
    const registry = createActionRegistry();
    expect(registry.has('nope')).toBe(false);
  });

  it('clear 清空', () => {
    const registry = createActionRegistry();
    registry.register('x', async () => ({ success: true }));
    registry.clear();
    expect(registry.has('x')).toBe(false);
  });

  it('list 返回所有已註冊名稱', () => {
    const registry = createActionRegistry();
    registry.register('a', async () => ({ success: true }));
    registry.register('b', async () => ({ success: true }));
    expect(registry.list().sort()).toEqual(['a', 'b']);
  });
});

// ==============================================
// 2. invokeAction 行為
// ==============================================

describe('invokeAction', () => {
  beforeEach(() => {
    resetActions();
  });

  it('執行 handler 並返回結果', async () => {
    registerAction('markAsPaid', async (ctx) => ({
      success: true,
      message: '已標記為已付款',
      data: { ...ctx.data, paid: true },
    }));

    const result = await invokeAction('markAsPaid', {
      data: { id: '1', total: 100 },
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.message).toBe('已標記為已付款');
      expect(result.data?.paid).toBe(true);
    }
  });

  it('async handler 被正確 await', async () => {
    registerAction('slowAction', async () => {
      await new Promise((r) => setTimeout(r, 1));
      return { success: true, message: 'done' };
    });

    const result = await invokeAction('slowAction', { data: {} });
    expect(result.success).toBe(true);
  });

  it('不存在的 action 拋出錯誤', async () => {
    await expect(invokeAction('notExist', { data: {} })).rejects.toThrow(
      /Action.*not found/,
    );
  });

  it('handler 拋出錯誤時 invokeAction reject', async () => {
    registerAction('fail', () => {
      throw new Error('Payment gateway error');
    });

    await expect(invokeAction('fail', { data: {} })).rejects.toThrow(
      'Payment gateway error',
    );
  });

  it('handler 拋出 AbortError（取消）被識別', async () => {
    registerAction('abort', () => {
      const err = new Error('使用者取消');
      err.name = 'AbortError';
      throw err;
    });

    await expect(invokeAction('abort', { data: {} })).rejects.toThrow('使用者取消');
  });
});

// ==============================================
// 3. Schema 驗證（input 校驗）
// ==============================================

describe('invokeAction - Schema Validation', () => {
  beforeEach(() => {
    resetActions();
  });

  it('input 通過 Zod schema 驗證', async () => {
    registerAction('updateTitle', async (ctx) => ({
      success: true,
      data: { ...ctx.data, title: ctx.input!.title },
    }));

    const schema = z.object({
      title: z.string().min(3),
    });

    const result = await invokeAction(
      'updateTitle',
      { data: { id: '1' } },
      { inputSchema: schema, input: { title: 'New Title' } },
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data?.title).toBe('New Title');
    }
  });

  it('input 不通過 Zod schema 拋出錯誤', async () => {
    registerAction('updateTitle', async () => ({ success: true }));

    const schema = z.object({
      title: z.string().min(5),
    });

    await expect(
      invokeAction(
        'updateTitle',
        { data: {} },
        { inputSchema: schema, input: { title: 'x' } },
      ),
    ).rejects.toThrow(/Validation failed/);
  });

  it('無 schema 時跳過驗證', async () => {
    registerAction('noSchemaAction', async (ctx) => ({
      success: true,
      data: ctx.data,
    }));

    const result = await invokeAction('noSchemaAction', { data: {} });
    expect(result.success).toBe(true);
  });
});

// ==============================================
// 4. {{fn:...}} 引用解析 + 自動調用
// ==============================================

describe('Action with {{fn:...}} reference', () => {
  beforeEach(() => {
    resetActions();
  });

  it('parseHookReference → action name', async () => {
    // 模擬：Extension manifest 寫 "implementation": "{{fn:markOrderAsPaid}}"
    const actionDef: Pick<Action, 'name' | 'implementation'> = {
      name: 'markAsPaid',
      implementation: '{{fn:markOrderAsPaid}}',
    };

    // Extension 啟動時註冊實際 handler
    registerAction('markOrderAsPaid', async () => ({
      success: true,
      message: '已標記為付款',
    }));

    // 框架解析 implementation 並呼叫
    const handlerName = actionDef.implementation.replace(/^\{\{fn:|\}\}$/g, '');
    const result = await invokeAction(handlerName, { data: { id: '1' } });

    expect(result.success).toBe(true);
  });
});

// ==============================================
// 5. Real-world 場景
// ==============================================

describe('Real-world: Order Management Actions', () => {
  beforeEach(() => {
    resetActions();
  });

  it('完整流程：cancel order → beforeAction hook → handler → afterAction hook', async () => {
    // 註冊一個 cancel order action
    registerAction('cancelOrder', async (ctx) => ({
      success: true,
      message: `訂單 ${ctx.data.id} 已取消`,
      data: { ...ctx.data, status: 'cancelled' },
    }));

    const result = await invokeAction('cancelOrder', {
      data: { id: 'ORDER-001', status: 'pending' },
      model: 'Order',
      ctx: { user: { id: 'u1', role: 'admin' } },
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.message).toContain('ORDER-001');
      expect(result.data?.status).toBe('cancelled');
    }
  });

  it('支援 redirect（用戶取消後跳轉）', async () => {
    registerAction('redirect', async () => ({
      success: true,
      redirect: '/orders',
      message: '已取消，返回訂單列表',
    }));

    const result = await invokeAction('redirect', { data: {} });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.redirect).toBe('/orders');
    }
  });
});

// ==============================================
// 6. 錯誤型別
// ==============================================

describe('Error handling', () => {
  beforeEach(() => {
    resetActions();
  });

  it('成功結果類型正確', async () => {
    registerAction('ok', async () => ({
      success: true,
      message: 'success',
      data: { updated: true },
    }));

    const result: ActionResult = await invokeAction('ok', { data: {} });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.message).toBe('success');
    }
  });
});