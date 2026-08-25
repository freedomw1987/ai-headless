/**
 * Sprint 14 TECH-034 — Dynamic UI Page
 *
 * 守護：
 * 1. todo spec → 自動生成 list UI 配置
 * 2. todo spec → 自動生成 form UI 配置
 * 3. 有 workflow 的 spec → 自動生成 transition buttons
 * 4. 沒 workflow 的 spec → transitions = []
 * 5. todo spec → create dialog 配置包含必填驗證
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { invalidateSpecCache, loadSpec } from '@/lib/runtime/spec-loader';
import {
  buildListUIConfig,
  buildFormUIConfig,
  buildDetailUIConfig,
} from '@/lib/runtime/ui-config';

describe('TECH-034 — Dynamic UI Config Builder', () => {
  beforeAll(() => {
    invalidateSpecCache();
  });

  it('todo spec → 自動生成 list UI 配置', async () => {
    const spec = await loadSpec('todo');
    const uiConfig = buildListUIConfig(spec);

    expect(uiConfig.title).toBe('待辦');
    expect(uiConfig.fields).toBeDefined();
    const fieldNames = uiConfig.fields.map((f) => f.name);
    expect(fieldNames).toContain('title');
    expect(fieldNames).toContain('completed');
  });

  it('todo spec → 自動生成 form UI 配置（input 類型）', async () => {
    const spec = await loadSpec('todo');
    const uiConfig = buildFormUIConfig(spec);

    expect(uiConfig.fields).toBeDefined();
    const titleField = uiConfig.fields.find((f) => f.name === 'title');
    expect(titleField?.inputType).toBe('text');

    const completedField = uiConfig.fields.find((f) => f.name === 'completed');
    expect(completedField?.inputType).toBe('checkbox');

    const priorityField = uiConfig.fields.find((f) => f.name === 'priority');
    expect(priorityField?.inputType).toBe('select');
  });

  it('有 workflow 的 spec → 自動生成 transition buttons', async () => {
    const orderSpec = await loadSpec('order');
    const uiConfig = buildDetailUIConfig(orderSpec);

    expect(uiConfig.transitions).toBeDefined();
    expect(uiConfig.transitions.length).toBeGreaterThan(0);
    const submitTransition = uiConfig.transitions.find((t) => t.to === 'pending_payment');
    expect(submitTransition).toBeDefined();
  });

  it('沒 workflow 的 spec → transitions = []', async () => {
    const todoSpec = await loadSpec('todo');
    const uiConfig = buildDetailUIConfig(todoSpec);

    expect(uiConfig.transitions).toEqual([]);
  });

  it('todo spec → create dialog 配置包含必填驗證', async () => {
    const spec = await loadSpec('todo');
    const uiConfig = buildFormUIConfig(spec);

    const titleField = uiConfig.fields.find((f) => f.name === 'title');
    expect(titleField?.required).toBe(true);
  });
});