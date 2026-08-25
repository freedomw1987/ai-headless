/**
 * TDD Gate 1 — AI Pipeline（Runtime 版）
 *
 * Sprint 14 改造：移除 compiler 依賴，改指向 runtime handlers。
 * Pipeline 變成「自然語言 → spec → 確認 runtime 已就緒」。
 */

import { describe, it, expect } from 'vitest';
import {
  createPipeline,
  runPipeline,
  schemaStage,
  apiStage,
  uiStage,
  rbacStage,
  type PipelineContext,
  type PipelineStage,
} from './pipeline-runner';
import type { JsonSpec } from '@/lib/specs/json-spec.types';

const todoSpec: JsonSpec = {
  name: 'todo',
  label: '待辦',
  models: [
    {
      name: 'Todo',
      fields: [
        { name: 'title', type: 'string', validation: { required: true } },
      ],
    },
  ],
};

function makeAIStage(returnSpec: JsonSpec): PipelineStage<string, { spec: JsonSpec }> {
  return {
    name: 'ai-spec',
    run: async (input) => ({ spec: returnSpec }),
  };
}

describe('Pipeline（Runtime 版）— Sprint 14', () => {
  it('schemaStage 回傳 { spec, message }', async () => {
    const pipeline = createPipeline(makeAIStage(todoSpec), schemaStage());
    const result = await runPipeline(pipeline, 'todo system');

    expect(result.error).toBeUndefined();
    expect(result.history).toHaveLength(2);

    const schemaHistory = result.history[1]!;
    expect(schemaHistory.stage).toBe('schema');
    expect((schemaHistory.output as { spec: JsonSpec }).spec.name).toBe('todo');
    // Runtime 不再生成 Prisma schema 字串（由 prisma/schema.prisma 手動維護）
    expect((schemaHistory.output as { message?: string }).message).toMatch(/runtime/i);
  });

  it('apiStage 指向 /api/crud/<spec>，runtime 已就緒', async () => {
    const pipeline = createPipeline(makeAIStage(todoSpec), schemaStage(), apiStage());
    const result = await runPipeline(pipeline, 'todo');

    expect(result.error).toBeUndefined();

    const apiHistory = result.history[2]!;
    const apiOutput = apiHistory.output as { endpoint: string; runtimeReady: boolean };
    expect(apiOutput.endpoint).toBe('/api/crud/todo');
    expect(apiOutput.runtimeReady).toBe(true);
  });

  it('uiStage 指向 /admin/crud/<spec>，runtime 已就緒', async () => {
    const pipeline = createPipeline(
      makeAIStage(todoSpec),
      schemaStage(),
      apiStage(),
      uiStage(),
    );
    const result = await runPipeline(pipeline, 'todo');

    expect(result.error).toBeUndefined();

    const uiHistory = result.history[3]!;
    const uiOutput = uiHistory.output as { path: string; runtimeReady: boolean };
    expect(uiOutput.path).toBe('/admin/crud/todo');
    expect(uiOutput.runtimeReady).toBe(true);
  });

  it('rbacStage 用 RBAC matrix 推導權限（不產 source code）', async () => {
    const pipeline = createPipeline(
      makeAIStage(todoSpec),
      schemaStage(),
      apiStage(),
      uiStage(),
      rbacStage(),
    );
    const result = await runPipeline(pipeline, 'todo');

    expect(result.error).toBeUndefined();

    const rbacHistory = result.history[4]!;
    const rbacOutput = rbacHistory.output as { permissions: string[]; runtimeReady: boolean };
    expect(rbacOutput.permissions).toContain('todo.create');
    expect(rbacOutput.permissions).toContain('todo.read');
    expect(rbacOutput.permissions).toContain('todo.update');
    expect(rbacOutput.permissions).toContain('todo.delete');
    expect(rbacOutput.runtimeReady).toBe(true);
  });

  it('完整 pipeline 5 stages 全部 success', async () => {
    const pipeline = createPipeline(
      makeAIStage(todoSpec),
      schemaStage(),
      apiStage(),
      uiStage(),
      rbacStage(),
    );
    const result = await runPipeline(pipeline, 'todo system');

    expect(result.error).toBeUndefined();
    expect(result.history).toHaveLength(5);
    expect(result.history.every((h) => h.error === undefined)).toBe(true);
  });

  it('Dry run 仍可執行', async () => {
    const ctx: PipelineContext = { dryRun: true, state: {} };
    let sideEffectRan = false;
    const stage: PipelineStage<string, string> = {
      name: 'test',
      run: async (input, c) => {
        if (!c.dryRun) sideEffectRan = true;
        return input + '-ok';
      },
    };

    const pipeline = createPipeline(stage);
    const result = await runPipeline(pipeline, 'test', ctx);

    expect(sideEffectRan).toBe(false);
    expect(result.value).toBe('test-ok');
  });
});