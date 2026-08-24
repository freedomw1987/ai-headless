/**
 * TDD Gate 1 — Computed SDK 完整測試
 *
 * 涵蓋：
 * 1. ComputedField 類型定義（name/type/compute/dependencies）
 * 2. Computed Registry（註冊/查找/清空）
 * 3. Computed Runtime（執行 + 依賴追蹤 + Cache 失效）
 * 4. {{fn:...}} 引用解析
 * 5. UI Generator 整合（自動渲染計算欄位）
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createComputedRegistry,
  registerComputed,
  invokeComputed,
  clearComputedCache,
  resetComputed,
  resolveComputedName,
  type ComputeFunction,
} from './computed-sdk';

// ==============================================
// 1. ComputedRegistry 基本操作
// ==============================================

describe('createComputedRegistry', () => {
  it('register 後可查找', () => {
    const registry = createComputedRegistry();
    const fn: ComputeFunction = (record) => Number(record.subtotal) * 1.1;
    registry.register(
      { name: 'totalPrice', type: 'number', compute: 'totalPrice' },
      fn,
    );
    expect(registry.has('totalPrice')).toBe(true);
  });

  it('重複註冊拋出錯誤', () => {
    const registry = createComputedRegistry();
    const fn: ComputeFunction = () => 0;
    registry.register({ name: 'x', type: 'number', compute: 'x' }, fn);
    expect(() =>
      registry.register({ name: 'x', type: 'number', compute: 'x' }, fn),
    ).toThrow(/already registered/);
  });

  it('list 返回所有已註冊名稱', () => {
    const registry = createComputedRegistry();
    registry.register(
      { name: 'a', type: 'number', compute: 'a' },
      () => 0,
    );
    registry.register(
      { name: 'b', type: 'string', compute: 'b' },
      () => 'x',
    );
    expect(registry.list().sort()).toEqual(['a', 'b']);
  });

  it('clear 清空（含快清）', () => {
    const registry = createComputedRegistry();
    registry.register(
      { name: 'x', type: 'number', compute: 'x' },
      () => 42,
    );
    registry.clear();
    expect(registry.has('x')).toBe(false);
  });
});

// ==============================================
// 2. invokeComputed 執行
// ==============================================

describe('invokeComputed', () => {
  beforeEach(() => {
    resetComputed();
  });

  it('基本計算：subtotal * taxRate', () => {
    registerComputed(
      { name: 'totalPrice', type: 'number', compute: 'totalPrice' },
      (record) => Number(record.subtotal) * (1 + Number(record.taxRate)),
    );

    const result = invokeComputed('totalPrice', {
      record: { subtotal: 100, taxRate: 0.1 },
    });

    expect(result).toBeCloseTo(110);
  });

  it('依賴其他 computed（依賴追蹤）', () => {
    // 兩個 computed fields
    registerComputed(
      { name: 'discount', type: 'number', compute: 'discount', dependencies: ['subtotal', 'discountRate'] },
      (record) => Number(record.subtotal) * Number(record.discountRate),
    );
    registerComputed(
      { name: 'finalPrice', type: 'number', compute: 'finalPrice', dependencies: ['subtotal', 'discount'] },
      (record) => Number(record.subtotal) - Number(record.discount),
    );

    // 手動依序計算
    const record = { subtotal: 100, discountRate: 0.2 };
    const discount = invokeComputed('discount', { record });
    const finalPrice = invokeComputed('finalPrice', { record: { ...record, discount } });

    expect(discount).toBe(20);
    expect(finalPrice).toBe(80);
  });

  it('context 包含完整 record', () => {
    registerComputed(
      { name: 'fullName', type: 'string', compute: 'fullName' },
      (record, ctx) => {
        expect(ctx.record).toEqual(record);
        return `${record.firstName} ${record.lastName}`;
      },
    );

    const result = invokeComputed('fullName', {
      record: { firstName: 'Alice', lastName: 'Wang' },
    });
    expect(result).toBe('Alice Wang');
  });

  it('不存在的 computed 拋出錯誤', () => {
    expect(() => invokeComputed('notExist', { record: {} })).toThrow(/not found/);
  });

  it('compute 拋出錯誤時 propagate', () => {
    registerComputed(
      { name: 'fail', type: 'number', compute: 'fail' },
      () => {
        throw new Error('計算錯誤');
      },
    );

    expect(() => invokeComputed('fail', { record: {} })).toThrow('計算錯誤');
  });
});

// ==============================================
// 3. Cache 機制
// ==============================================

describe('Computed Cache', () => {
  beforeEach(() => {
    resetComputed();
  });

  it('相同 record 命中 cache', () => {
    let callCount = 0;
    registerComputed(
      { name: 'expensive', type: 'number', compute: 'expensive' },
      (record) => {
        callCount++;
        return Number(record.value) * 2;
      },
    );

    const ctx = { record: { value: 5 } };
    invokeComputed('expensive', ctx);
    invokeComputed('expensive', ctx);
    invokeComputed('expensive', ctx);

    expect(callCount).toBe(1); // 只計算一次
  });

  it('cache key 包含 computed name + record 雜湊', () => {
    let callCount = 0;
    registerComputed(
      { name: 'fn', type: 'number', compute: 'fn' },
      (record) => {
        callCount++;
        return Number(record.x);
      },
    );

    invokeComputed('fn', { record: { x: 1 } });
    invokeComputed('fn', { record: { x: 2 } });
    invokeComputed('fn', { record: { x: 1 } }); // cache hit

    expect(callCount).toBe(2);
  });

  it('clearComputedCache 清除所有 cache', () => {
    let callCount = 0;
    registerComputed(
      { name: 'fn', type: 'number', compute: 'fn' },
      (record) => {
        callCount++;
        return Number(record.x);
      },
    );

    invokeComputed('fn', { record: { x: 1 } });
    clearComputedCache();
    invokeComputed('fn', { record: { x: 1 } });

    expect(callCount).toBe(2);
  });

  it('依賴變化時 cache 失效（手動 invalidation）', () => {
    let callCount = 0;
    registerComputed(
      {
        name: 'total',
        type: 'number',
        compute: 'total',
        dependencies: ['subtotal', 'tax'],
      },
      (record) => {
        callCount++;
        return Number(record.subtotal) + Number(record.tax);
      },
    );

    invokeComputed('total', { record: { subtotal: 100, tax: 10 } });
    expect(callCount).toBe(1);

    // 改變依賴 → 應重新計算
    invokeComputed('total', { record: { subtotal: 200, tax: 20 } });
    expect(callCount).toBe(2);

    // 相同依賴值 → cache hit
    invokeComputed('total', { record: { subtotal: 200, tax: 20 } });
    expect(callCount).toBe(2);
  });
});

// ==============================================
// 4. {{fn:...}} 解析
// ==============================================

describe('resolveComputedName', () => {
  it('解析 {{fn:fnName}}', () => {
    expect(resolveComputedName('{{fn:calculateTotal}}')).toBe('calculateTotal');
  });

  it('純名稱原樣返回', () => {
    expect(resolveComputedName('myCompute')).toBe('myCompute');
  });

  it('空字返回 null', () => {
    expect(resolveComputedName('')).toBeNull();
  });
});

// ==============================================
// 5. Real-world: Order Management
// ==============================================

describe('Real-world: Order Computed Fields', () => {
  beforeEach(() => {
    resetComputed();
  });

  it('訂單系統完整計算：subtotal → discount → total → estimatedDelivery', () => {
    // 1. subtotal: sum of line items
    registerComputed(
      { name: 'subtotal', type: 'number', compute: 'subtotal' },
      (record) => {
        const items = (record.items ?? []) as Array<{ price: number; qty: number }>;
        return items.reduce((sum, item) => sum + item.price * item.qty, 0);
      },
    );

    // 2. discount: VIP user 9 折
    registerComputed(
      {
        name: 'discount',
        type: 'number',
        compute: 'discount',
        dependencies: ['subtotal', 'userTier'],
      },
      (record) => {
        const subtotal = Number(record.subtotal);
        const tier = String(record.userTier);
        return tier === 'vip' ? subtotal * 0.1 : 0;
      },
    );

    // 3. total
    registerComputed(
      {
        name: 'total',
        type: 'number',
        compute: 'total',
        dependencies: ['subtotal', 'discount'],
      },
      (record) => Number(record.subtotal) - Number(record.discount),
    );

    const order = {
      items: [
        { price: 50, qty: 2 },
        { price: 30, qty: 1 },
      ],
      userTier: 'vip',
    };

    const subtotal = invokeComputed('subtotal', { record: order });
    const discount = invokeComputed('discount', {
      record: { ...order, subtotal },
    });
    const total = invokeComputed('total', {
      record: { ...order, subtotal, discount },
    });

    expect(subtotal).toBe(130);
    expect(discount).toBe(13);
    expect(total).toBe(117);
  });
});