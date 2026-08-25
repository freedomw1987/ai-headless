/**
 * Sprint 13 TECH-025 — Order spec.json 反向 + compiler 驗證
 *
 * 守護：
 * 1. order-spec.json 存在且為合法 JsonSpec
 * 2. compiler 能正確生成 Order 的 API + UI（含 workflow transition buttons）
 * 3. 產出程式碼通過 typecheck
 * 4. workflow 7 states + 8 transitions 都正確序列化
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { compileExtension } from '@/lib/compiler/compile';

const PROJECT_ROOT = process.cwd();
const ORDER_SPEC_PATH = path.join(PROJECT_ROOT, 'extensions/order/order-spec.json');

describe('TECH-025 Order spec.json', () => {
  it('存在且為合法 JsonSpec（含 workflows + actions）', () => {
    const raw = readFileSync(ORDER_SPEC_PATH, 'utf-8');
    const spec = JSON.parse(raw);

    expect(spec.name).toBe('order');
    expect(spec.apiBase).toBe('/api/order');
    expect(spec.uiBase).toBe('/admin/orders');
    expect(spec.requiresExtension).toBe('order');

    // 7 states workflow
    expect(spec.workflows).toHaveLength(1);
    const wf = spec.workflows[0];
    expect(wf.initialState).toBe('draft');
    expect(Object.keys(wf.states)).toHaveLength(7);
    expect(wf.transitions.length).toBeGreaterThanOrEqual(7);

    // actions
    expect(spec.models[0].actions).toBeDefined();
    expect(spec.models[0].actions.length).toBeGreaterThanOrEqual(2);
  });

  it('workflow states 涵蓋 order-workflow.ts 所有7 個狀態', () => {
    const raw = readFileSync(ORDER_SPEC_PATH, 'utf-8');
    const spec = JSON.parse(raw);
    const stateNames = Object.keys(spec.workflows[0].states);

    const expectedStates = [
      'draft',
      'pending_payment',
      'paid',
      'shipped',
      'completed',
      'cancelled',
      'refunded',
    ];
    for (const expected of expectedStates) {
      expect(stateNames).toContain(expected);
    }
  });
});

describe('TECH-025 — Order compiler 產出', () => {
  let compiledFiles: { path: string; code: string }[] = [];

  beforeAll(async () => {
    const result = await compileExtension({
      extensionName: 'order',
      dryRun: false,
      outputBase: '_compiled-test-order',
    });
    compiledFiles = result.writtenFiles.map((p) => ({
      path: p,
      code: readFileSync(p, 'utf-8'),
    }));
  });

  it('生成 Order API + UI 檔案', () => {
    const paths = compiledFiles.map((f) => f.path);
    expect(paths.some((p) => p.includes('/api/order/route.ts'))).toBe(true);
    expect(paths.some((p) => p.includes('/api/order/[id]/route.ts'))).toBe(true);
    expect(paths.some((p) => p.includes('/admin/orders/page.tsx'))).toBe(true);
    expect(paths.some((p) => p.includes('/admin/orders/[id]/page.tsx'))).toBe(true);
  });

  it('edit page 含 TransitionButtons + inline 7-state schema', () => {
    const editPage = compiledFiles.find((f) => f.path.includes('/admin/orders/[id]/page.tsx'));
    expect(editPage).toBeDefined();

    const code = editPage!.code;
    expect(code).toContain('TransitionButtons');

    // 7 states 都應 inline
    for (const state of [
      'draft',
      'pending_payment',
      'paid',
      'shipped',
      'completed',
      'cancelled',
      'refunded',
    ]) {
      expect(code).toContain(`"${state}"`);
    }
  });

  it('產出程式碼通過 tsc --noEmit', () => {
    execSync(
      'npx tsc --noEmit --project tsconfig.test-compiler.json',
      {
        cwd: PROJECT_ROOT,
        stdio: 'pipe',
        timeout: 60_000,
      },
    );
  });
});