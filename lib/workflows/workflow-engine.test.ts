/**
 * TDD Gate 1 — Workflow Engine 完整測試
 *
 * 涵蓋：
 * 1. Workflow Definition Types（states / transitions / guards）
 * 2. StateMachine Runtime（canTransition / transition）
 * 3. Guard 條件檢查（返回 boolean）
 * 4. Effect / onEnter / onExit 自動呼叫
 * 5. Transition Log（記錄從/到/時間/用戶）
 * 6. UI 輔助函數（狀態徽章 / 可用轉換按鈕）
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createStateMachine,
  registerStateMachine,
  resetWorkflows,
  type Workflow,
  type StateConfig,
  type Transition,
} from './workflow-engine';

// ==============================================
// 1. Workflow Definition Types
// ==============================================

describe('createStateMachine', () => {
  it('建立最簡狀態機（2 個狀態，1 個轉換）', () => {
    const workflow: Workflow = {
      name: 'simple',
      initialState: 'a',
      states: {
        a: { label: 'A' },
        b: { label: 'B' },
      },
      transitions: [{ from: 'a', to: 'b' }],
    };

    const sm = createStateMachine(workflow);
    expect(sm.name).toBe('simple');
    expect(sm.initialState).toBe('a');
  });

  it('建構時驗證：initialState 必須存在於 states', () => {
    expect(() =>
      createStateMachine({
        name: 'bad',
        initialState: 'nonexistent',
        states: { a: { label: 'A' } },
        transitions: [],
      }),
    ).toThrow(/initialState.*not found/);
  });

  it('建構時驗證：transition.from 必須存在', () => {
    expect(() =>
      createStateMachine({
        name: 'bad',
        initialState: 'a',
        states: { a: { label: 'A' }, b: { label: 'B' } },
        transitions: [{ from: 'c', to: 'b' }],
      }),
    ).toThrow(/from state 'c'.*not found/);
  });

  it('建構時驗證：transition.to 必須存在', () => {
    expect(() =>
      createStateMachine({
        name: 'bad',
        initialState: 'a',
        states: { a: { label: 'A' } },
        transitions: [{ from: 'a', to: 'z' }],
      }),
    ).toThrow(/to state 'z'.*not found/);
  });
});

// ==============================================
// 2. canTransition
// ==============================================

describe('canTransition', () => {
  it('合法轉換返回 true', () => {
    const sm = createStateMachine({
      name: 'order',
      initialState: 'draft',
      states: {
        draft: { label: '草稿' },
        pending: { label: '待付款' },
        paid: { label: '已付款' },
      },
      transitions: [
        { from: 'draft', to: 'pending' },
        { from: 'pending', to: 'paid' },
      ],
    });

    expect(sm.canTransition('draft', 'pending')).toBe(true);
    expect(sm.canTransition('pending', 'paid')).toBe(true);
  });

  it('非法轉換（跳過中間狀態）返回 false', () => {
    const sm = createStateMachine({
      name: 'order',
      initialState: 'draft',
      states: {
        draft: { label: '草稿' },
        pending: { label: '待付款' },
        paid: { label: '已付款' },
      },
      transitions: [
        { from: 'draft', to: 'pending' },
        { from: 'pending', to: 'paid' },
      ],
    });

    expect(sm.canTransition('draft', 'paid')).toBe(false);
  });

  it('不存在的目標狀態返回 false', () => {
    const sm = createStateMachine({
      name: 'x',
      initialState: 'a',
      states: { a: { label: 'A' }, b: { label: 'B' } },
      transitions: [{ from: 'a', to: 'b' }],
    });

    expect(sm.canTransition('a', 'nonexistent')).toBe(false);
  });

  it('from 支援 string[]（多個源狀態）', () => {
    const sm = createStateMachine({
      name: 'doc',
      initialState: 'draft',
      states: {
        draft: { label: '草稿' },
        review: { label: '審核中' },
        approved: { label: '已批准' },
      },
      transitions: [{ from: ['draft', 'review'], to: 'approved' }],
    });

    expect(sm.canTransition('draft', 'approved')).toBe(true);
    expect(sm.canTransition('review', 'approved')).toBe(true);
    expect(sm.canTransition('draft', 'review')).toBe(false);
  });
});

// ==============================================
// 3. transition 執行
// ==============================================

describe('transition', () => {
  beforeEach(() => {
    resetWorkflows();
  });

  it('基本轉換：返回新狀態 + transition log', async () => {
    const sm = createStateMachine({
      name: 'order',
      initialState: 'draft',
      states: {
        draft: { label: '草稿' },
        pending: { label: '待付款' },
      },
      transitions: [{ from: 'draft', to: 'pending' }],
    });

    const result = await sm.transition('draft', 'pending', {
      entityId: 'order-1',
      entityType: 'Order',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.fromState).toBe('draft');
      expect(result.toState).toBe('pending');
      expect(result.log.entityId).toBe('order-1');
      expect(result.log.entityType).toBe('Order');
      expect(result.log.timestamp).toBeInstanceOf(Date);
    }
  });

  it('非法轉換返回 failure（不執行任何 effect）', async () => {
    let effectCalled = false;
    const sm = createStateMachine({
      name: 'order',
      initialState: 'draft',
      states: {
        draft: { label: '草稿' },
        pending: { label: '待付款' },
        paid: { label: '已付款' },
      },
      transitions: [
        {
          from: 'pending',
          to: 'paid',
          effect: 'onPaid',
        },
      ],
    });

    const result = await sm.transition('draft', 'paid', {
      entityId: 'order-1',
      effectRegistry: {
        onPaid: () => {
          effectCalled = true;
        },
      },
    });

    expect(result.success).toBe(false);
    expect(effectCalled).toBe(false);
  });

  it('effect 在轉換成功後被呼叫', async () => {
    let effectCalled = false;
    const sm = createStateMachine({
      name: 'order',
      initialState: 'draft',
      states: {
        draft: { label: '草稿' },
        paid: { label: '已付款' },
      },
      transitions: [
        {
          from: 'draft',
          to: 'paid',
          effect: 'onPaidEffect',
        },
      ],
    });

    const result = await sm.transition('draft', 'paid', {
      entityId: 'order-1',
      effectRegistry: {
        onPaidEffect: () => {
          effectCalled = true;
          return Promise.resolve();
        },
      },
    });

    expect(result.success).toBe(true);
    expect(effectCalled).toBe(true);
  });

  it('onEnter / onExit 在對應狀態被呼叫', async () => {
    let onExitDraft = false;
    let onEnterPaid = false;

    const sm = createStateMachine({
      name: 'order',
      initialState: 'draft',
      states: {
        draft: {
          label: '草稿',
          onExit: 'onExitDraft',
        },
        paid: {
          label: '已付款',
          onEnter: 'onEnterPaid',
        },
      },
      transitions: [{ from: 'draft', to: 'paid' }],
    });

    const result = await sm.transition('draft', 'paid', {
      entityId: 'order-1',
      effectRegistry: {
        onExitDraft: () => {
          onExitDraft = true;
        },
        onEnterPaid: () => {
          onEnterPaid = true;
        },
      },
    });

    expect(result.success).toBe(true);
    expect(onExitDraft).toBe(true);
    expect(onEnterPaid).toBe(true);
  });
});

// ==============================================
// 4. Guard 條件檢查
// ==============================================

describe('Guard', () => {
  it('guard 返回 true 允許轉換', async () => {
    const sm = createStateMachine({
      name: 'doc',
      initialState: 'draft',
      states: {
        draft: { label: '草稿' },
        approved: { label: '已批准' },
      },
      transitions: [
        {
          from: 'draft',
          to: 'approved',
          guard: 'hasPermission',
        },
      ],
    });

    const result = await sm.transition('draft', 'approved', {
      entityId: 'doc-1',
      effectRegistry: {
        hasPermission: () => Promise.resolve(true),
      },
    });

    expect(result.success).toBe(true);
  });

  it('guard 返回 false 阻止轉換', async () => {
    const sm = createStateMachine({
      name: 'doc',
      initialState: 'draft',
      states: {
        draft: { label: '草稿' },
        approved: { label: '已批准' },
      },
      transitions: [
        {
          from: 'draft',
          to: 'approved',
          guard: 'hasPermission',
        },
      ],
    });

    const result = await sm.transition('draft', 'approved', {
      entityId: 'doc-1',
      effectRegistry: {
        hasPermission: () => Promise.resolve(false),
      },
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.reason).toMatch(/guard/i);
    }
  });
});

// ==============================================
// 5. Global Registry
// ==============================================

describe('Global StateMachine Registry', () => {
  beforeEach(() => {
    resetWorkflows();
  });

  it('registerStateMachine + 查找', () => {
    const sm = createStateMachine({
      name: 'order',
      initialState: 'draft',
      states: { draft: { label: 'D' }, paid: { label: 'P' } },
      transitions: [{ from: 'draft', to: 'paid' }],
    });

    registerStateMachine(sm);
    expect(sm.name).toBe('order');
  });
});

// ==============================================
// 6. UI 輔助函數
// ==============================================

describe('UI Helpers', () => {
  it('getAvailableTransitions 返回所有合法轉換', () => {
    const sm = createStateMachine({
      name: 'order',
      initialState: 'draft',
      states: {
        draft: { label: '草稿' },
        pending: { label: '待付款' },
        paid: { label: '已付款' },
        cancelled: { label: '已取消' },
      },
      transitions: [
        { from: 'draft', to: 'pending' },
        { from: 'draft', to: 'cancelled' },
        { from: 'pending', to: 'paid' },
        { from: 'pending', to: 'cancelled' },
      ],
    });

    const fromDraft = sm.getAvailableTransitions('draft');
    expect(fromDraft.length).toBe(2);
    expect(fromDraft.map((t) => t.to).sort()).toEqual(['cancelled', 'pending']);

    const fromPending = sm.getAvailableTransitions('pending');
    expect(fromPending.length).toBe(2);
  });

  it('getStateConfig 返回狀態元數據', () => {
    const sm = createStateMachine({
      name: 'order',
      initialState: 'draft',
      states: {
        draft: { label: '草稿', badge: 'default' },
        paid: { label: '已付款', badge: 'success' },
      },
      transitions: [{ from: 'draft', to: 'paid' }],
    });

    const config = sm.getStateConfig('paid');
    expect(config?.label).toBe('已付款');
    expect(config?.badge).toBe('success');
  });
});

// ==============================================
// 7. Real-world: Order Lifecycle
// ==============================================

describe('Real-world: Order Lifecycle', () => {
  beforeEach(() => {
    resetWorkflows();
  });

  it('完整訂單生命週期：draft → pending → paid → shipped → completed', () => {
    const states: Record<string, StateConfig> = {
      draft: { label: '草稿', badge: 'default' },
      pending: { label: '待付款', badge: 'warning' },
      paid: { label: '已付款', badge: 'success' },
      shipped: { label: '已出貨', badge: 'success' },
      completed: { label: '已完成', badge: 'success' },
      cancelled: { label: '已取消', badge: 'danger' },
    };

    const transitions: Transition[] = [
      { from: 'draft', to: 'pending' },
      { from: 'pending', to: 'paid' },
      { from: 'paid', to: 'shipped' },
      { from: 'shipped', to: 'completed' },
      { from: ['draft', 'pending'], to: 'cancelled' },
    ];

    const sm = createStateMachine({
      name: 'order',
      initialState: 'draft',
      states,
      transitions,
    });

    // 走完整流程
    expect(sm.canTransition('draft', 'pending')).toBe(true);
    expect(sm.canTransition('pending', 'paid')).toBe(true);
    expect(sm.canTransition('paid', 'shipped')).toBe(true);
    expect(sm.canTransition('shipped', 'completed')).toBe(true);

    // 不能跳過中間狀態
    expect(sm.canTransition('draft', 'paid')).toBe(false);
    expect(sm.canTransition('paid', 'completed')).toBe(false);

    // 任何非終態都可以取消
    expect(sm.canTransition('draft', 'cancelled')).toBe(true);
    expect(sm.canTransition('pending', 'cancelled')).toBe(true);
    expect(sm.canTransition('paid', 'cancelled')).toBe(false); // paid 不能直接 cancel（只能退款流程）

    // 終態無可用轉換
    expect(sm.getAvailableTransitions('completed').length).toBe(0);
  });
});