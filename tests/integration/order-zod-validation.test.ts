/**
 * TDD Gate 1 — Sprint 28 commit 2 (TD-520)
 * Order create 用 Zod 驗證測試 (確認 Sprint 19 Zod 機制對 Order spec 也生效)
 *
 * 對應 PRD: docs/specs/extension-spec.md (Order spec)
 * 對應 Backlog: TD-520
 *
 * 問題 (原本):
 * - createOrderDialog 手寫 if 驗證
 * - 但實際上 Order 用 dynamic UI (由 spec 自動生成)
 * - 動態 handler create 已在 Sprint 19 自動從 spec.fields 生成 Zod schema
 *
 * 本測試:
 * - 確認 Order create 確實用 Zod 驗證
 * - 缺少必填欄位 → 回 400
 * - 錯誤 type → 回 400
 * - 合法資料 → 建立成功
 *
 * 註: 與 tech-032 dynamic-handler.test.ts 既有測試互補
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createDynamicHandlers } from '@/lib/runtime/dynamic-handler';
import { loadSpec } from '@/lib/runtime/spec-loader';
import { db } from '@/lib/db';

vi.mock('@/lib/auth/dynamic-permission', () => ({
  hasDynamicPermission: vi.fn(async () => true),
  requireDynamicPermission: vi.fn(async () => undefined),
}));

describe('TD-520 — Order create Zod 驗證', () => {
  let createdOrder: any;

  beforeEach(() => {
    createdOrder = null;
    (db as any).order = {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      findFirst: vi.fn(),
      create: vi.fn(async ({ data }: any) => {
        createdOrder = { id: 'new-id', ...data };
        return createdOrder;
      }),
      update: vi.fn(),
      delete: vi.fn(),
    };
  });

  it('合法資料 → 建立成功', async () => {
    const spec = await loadSpec('order');
    const handlers = createDynamicHandlers(spec);

    const result = await handlers.create({
      user: { id: 'u1', role: 'admin' },
      body: {
        orderNumber: 'O-NEW-001',
        customer: 'Alice',
        amount: 1000,
        status: 'draft',
      },
    });

    expect(result.status).toBe(201);
    expect(createdOrder).toBeTruthy();
    expect(createdOrder.orderNumber).toBe('O-NEW-001');
  });

  it('缺少 orderNumber → 回 400 (Zod 拒絕)', async () => {
    const spec = await loadSpec('order');
    const handlers = createDynamicHandlers(spec);

    const result = await handlers.create({
      user: { id: 'u1', role: 'admin' },
      body: {
        // 故意省略 orderNumber
        customer: 'Bob',
        amount: 500,
        status: 'draft',
      },
    });

    expect(result.status).toBe(400);
    expect((result as any).error).toMatch(/orderNumber|required/i);
  });

  it('缺少 customer → 回 400 (Zod 拒絕)', async () => {
    const spec = await loadSpec('order');
    const handlers = createDynamicHandlers(spec);

    const result = await handlers.create({
      user: { id: 'u1', role: 'admin' },
      body: {
        orderNumber: 'O-999',
        amount: 100,
        status: 'draft',
      },
    });

    expect(result.status).toBe(400);
    expect((result as any).error).toMatch(/customer|required/i);
  });

  it('amount 型別錯誤 (string 而非 integer) → 回 400', async () => {
    const spec = await loadSpec('order');
    const handlers = createDynamicHandlers(spec);

    const result = await handlers.create({
      user: { id: 'u1', role: 'admin' },
      body: {
        orderNumber: 'O-999',
        customer: 'Charlie',
        amount: 'not-a-number', // 型別錯誤
        status: 'draft',
      },
    });

    expect(result.status).toBe(400);
    expect((result as any).error).toMatch(/amount|integer|number|expected/i);
  });

  it('status 不在 enum 範圍 → 回 400', async () => {
    const spec = await loadSpec('order');
    const handlers = createDynamicHandlers(spec);

    const result = await handlers.create({
      user: { id: 'u1', role: 'admin' },
      body: {
        orderNumber: 'O-999',
        customer: 'Dave',
        amount: 100,
        status: 'invalid-status', // 不在 enum 範圍
      },
    });

    expect(result.status).toBe(400);
  });

  it('空 body → 回 400 (所有必填欄位都缺)', async () => {
    const spec = await loadSpec('order');
    const handlers = createDynamicHandlers(spec);

    const result = await handlers.create({
      user: { id: 'u1', role: 'admin' },
      body: {},
    });

    expect(result.status).toBe(400);
  });
});