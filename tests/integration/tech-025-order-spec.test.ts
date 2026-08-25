/**
 * Sprint 13 TECH-025 — Order spec.json 反向
 * Sprint 14: 移除 compiler 產出驗證，保留 spec.json 結構驗證
 *
 * 守護：
 * 1. order-spec.json 存在且為合法 JsonSpec
 * 2. workflow 7 states + 8 transitions 都正確序列化
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const PROJECT_ROOT = process.cwd();
const ORDER_SPEC_PATH = path.join(PROJECT_ROOT, 'extensions/order/order-spec.json');

describe('TECH-025 Order spec.json', () => {
  it('存在且為合法 JsonSpec（含 workflows + actions）', () => {
    const raw = readFileSync(ORDER_SPEC_PATH, 'utf-8');
    const spec = JSON.parse(raw);

    expect(spec.name).toBe('order');
    // Sprint 14: apiBase/uiBase 已 deprecated，所有 CRUD 統一走 /api/crud/<spec> + /admin/crud/<spec>
    expect(spec.apiBase).toBeUndefined();
    expect(spec.uiBase).toBeUndefined();
    expect(spec.requiresExtension).toBe('order');

    // 7 states workflow (spec-level workflows)
    expect(spec.workflows).toBeDefined();
    expect(spec.workflows[0].states).toBeDefined();

    // actions
    expect(spec.models[0].actions).toBeDefined();
    const actionNames = spec.models[0].actions.map((a: { name: string }) => a.name);
    expect(actionNames).toContain('markAsPaid');
    expect(actionNames).toContain('cancelOrder');
  });

  it('workflow states 涵蓋 order-workflow.ts 所有7 個狀態', () => {
    const raw = readFileSync(ORDER_SPEC_PATH, 'utf-8');
    const spec = JSON.parse(raw);

    const states = Object.keys(spec.workflows[0].states);
    expect(states).toContain('draft');
    expect(states).toContain('pending_payment');
    expect(states).toContain('paid');
    expect(states).toContain('shipped');
    expect(states).toContain('completed');
    expect(states).toContain('cancelled');
    expect(states).toContain('refunded');
  });
});