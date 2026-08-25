/**
 * TDD Gate 1 — AI Pipeline 測試
 *
 * AI Pipeline 骨架負責：
 * - 接收自然語言需求
 * - AI 生成 JsonSpec
 * - 編譯成 Prisma / API / UI / RBAC
 * - 寫入檔案系統
 * - 支援 pi agent 驅動（workflowScript）
 * - 支援 OpenAI / Anthropic 切換
 */

import { describe, it, expect } from 'vitest';
import {
  createPipeline,
  runPipeline,
  type PipelineStage,
  type PipelineContext,
} from './pipeline-runner';
import type { JsonSpec } from '@/lib/specs/json-spec.types';

// ==============================================
// Mock 工具：建立測試用的 Stage
// ==============================================

function makeMockStage<TIn, TOut>(
  name: string,
  transform: (input: TIn, ctx: PipelineContext) => Promise<TOut>,
): PipelineStage<TIn, TOut> {
  return {
    name,
    run: transform,
  };
}

function _makeMockStageArg<TIn>(_input: TIn) {
  // helper to satisfy unused-arg lint warnings
}

describe('createPipeline', () => {
  it('鏈接多個 Stage 為有序流程', async () => {
    const stage1 = makeMockStage<string, string>('s1', async (s) => s.toUpperCase());
    const stage2 = makeMockStage<string, number>('s2', async (s) => s.length);

    const pipeline = createPipeline(stage1, stage2);
    const result = await runPipeline(pipeline, 'hello');

    expect(result.value).toBe(5);
  });

  it('保留中間結果（每個 Stage 的產出）', async () => {
    const stage1 = makeMockStage<string, string>('s1', async (s) => s + '-1');
    const stage2 = makeMockStage<string, string>('s2', async (s) => s + '-2');
    const stage3 = makeMockStage<string, string>('s3', async (s) => s + '-3');

    const pipeline = createPipeline(stage1, stage2, stage3);
    const result = await runPipeline(pipeline, 'start');

    expect(result.value).toBe('start-1-2-3');
    expect(result.history).toHaveLength(3);
    expect(result.history[0]?.stage).toBe('s1');
    expect(result.history[1]?.stage).toBe('s2');
    expect(result.history[2]?.stage).toBe('s3');
    expect(result.history[0]?.value).toBe('start-1');
    expect(result.history[1]?.value).toBe('start-1-2');
    expect(result.history[2]?.value).toBe('start-1-2-3');
  });
});

describe('runPipeline 錯誤處理', () => {
  it('Stage 失敗時中斷並回傳錯誤', async () => {
    const stage1 = makeMockStage<string, string>('s1', async () => 'ok');
    const stage2 = makeMockStage<string, number>('s2', async () => {
      throw new Error('stage2 boom');
    });
    const stage3 = makeMockStage<number, string>('s3', async () => 'should-not-run');

    const pipeline = createPipeline(stage1, stage2, stage3);
    const result = await runPipeline(pipeline, 'input');

    expect(result.value).toBeNull();
    expect(result.error).toBeDefined();
    expect(result.error?.message).toBe('stage2 boom');
    expect(result.error?.stage).toBe('s2');
  });

  it('錯誤時保留到目前為止的 history', async () => {
    const stage1 = makeMockStage<string, string>('s1', async (s) => s + '-1');
    const stage2 = makeMockStage<string, never>('s2', async () => {
      throw new Error('failed');
    });

    const pipeline = createPipeline(stage1, stage2);
    const result = await runPipeline(pipeline, 'start');

    expect(result.history).toHaveLength(1);
    expect(result.history[0]?.stage).toBe('s1');
  });
});

describe('Pipeline Context', () => {
  it('傳遞 Context 到每個 Stage', async () => {
    const observed: PipelineContext[] = [];

    const stage1: PipelineStage<string, string> = {
      name: 's1',
      run: async (input, ctx) => {
        observed.push(ctx);
        return input;
      },
    };

    const pipeline = createPipeline(stage1);
    await runPipeline(pipeline, 'input', { userId: 'u-1', dryRun: true });

    expect(observed[0]?.userId).toBe('u-1');
    expect(observed[0]?.dryRun).toBe(true);
  });

  it('Context 累積狀態（可被下游 Stage 讀取）', async () => {
    const stage1: PipelineStage<string, string> = {
      name: 's1',
      run: async (input, ctx) => {
        ctx.state['token'] = 'abc';
        return input;
      },
    };

    let captured: string | undefined;
    const stage2: PipelineStage<string, string> = {
      name: 's2',
      run: async (input, ctx) => {
        captured = ctx.state['token'] as string | undefined;
        return input;
      },
    };

    const pipeline = createPipeline(stage1, stage2);
    await runPipeline(pipeline, 'in');

    expect(captured).toBe('abc');
  });
});

describe('Pipeline 實戰：自然語言 → JsonSpec → 編譯', () => {
  // 模擬一個 4-Stage pipeline：
  // 1. AI 生成 JsonSpec（mock）
  // 2. Schema Generator
  // 3. API Generator
  // 4. RBAC Generator

  it('執行自然語言 → JsonSpec → 編譯產物', async () => {
    const aiStage: PipelineStage<string, JsonSpec> = {
      name: 'ai-spec',
      run: async (_input) => {
        // Mock: 直接回傳固定 spec
        return {
          name: 'todo',
          label: '待辦',
          models: [
            {
              name: 'Todo',
              fields: [{ name: 'title', type: 'string', validation: { required: true } }],
            },
          ],
        };
      },
    };

    const schemaStage: PipelineStage<JsonSpec, { spec: JsonSpec; message: string }> = {
      name: 'schema',
      run: async (spec) => ({
        spec,
        message: 'mock schema stage',
      }),
    };

    const apiStage: PipelineStage<JsonSpec, { spec: JsonSpec; endpoint: string }> = {
      name: 'api',
      run: async (spec) => ({
        spec,
        endpoint: `/api/crud/${spec.name}`,
      }),
    };

    const rbacStage: PipelineStage<JsonSpec, { spec: JsonSpec; permissions: string[] }> = {
      name: 'rbac',
      run: async (spec) => ({
        spec,
        permissions: [],
      }),
    };

    const pipeline = createPipeline(aiStage, schemaStage, apiStage, rbacStage);
    const result = await runPipeline(pipeline, '我需要一個待辦事項系統');

    expect(result.error).toBeUndefined();
    expect(result.history).toHaveLength(4);
    expect(result.history[0]?.stage).toBe('ai-spec');
    expect(result.history[3]?.stage).toBe('rbac');
  });
});

describe('Dry Run 模式', () => {
  it('dry run 不執行寫檔，但生成結果', async () => {
    let sideEffectRan = false;
    const stage: PipelineStage<string, string> = {
      name: 's1',
      run: async (input, ctx) => {
        if (!ctx.dryRun) {
          sideEffectRan = true;
        }
        return input + '-processed';
      },
    };

    const pipeline = createPipeline(stage);
    const result = await runPipeline(pipeline, 'in', { dryRun: true });

    expect(sideEffectRan).toBe(false);
    expect(result.value).toBe('in-processed');
  });
});

describe('PipelineStage 介面', () => {
  it('每個 Stage 有 name 和 run 方法', () => {
    const stage: PipelineStage<string, string> = {
      name: 'test',
      run: async (s) => s,
    };

    expect(stage.name).toBe('test');
    expect(typeof stage.run).toBe('function');
  });

  it('支援可選的 shouldSkip（條件跳過）', () => {
    const stage: PipelineStage<string, string> = {
      name: 'conditional',
      run: async (s) => s + '-processed',
      shouldSkip: (input) => input === 'skip-me',
    };

    // 這只是型別檢查 — 實作見 shouldSkip 測試
    expect(stage.shouldSkip?.('skip-me', { state: {} })).toBe(true);
    expect(stage.shouldSkip?.('process-me', { state: {} })).toBe(false);
  });
});

describe('應該跳過的 Stage', () => {
  it('Stage 可根據 shouldSkip 跳過', async () => {
    const stage1: PipelineStage<string, string> = {
      name: 's1',
      run: async (s) => s + '-1',
      shouldSkip: () => true, // 永遠跳過
    };

    const stage2: PipelineStage<string, string> = {
      name: 's2',
      run: async (s) => s + '-2',
    };

    const pipeline = createPipeline(stage1, stage2);
    const result = await runPipeline(pipeline, 'in');

    expect(result.value).toBe('in-2'); // stage1 跳過，stage2 仍執行
  });
});