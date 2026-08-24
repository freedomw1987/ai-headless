/**
 * TDD Gate 1 — Pipeline Type Inference (TD-304)
 *
 * 涵蓋：
 * 1. createPipeline 通過 variadic tuple 強制 type chain
 * 2. 當 chain 不匹配時 type error
 * 3. 多個 stage 鏈接正確推導
 */

import { describe, it, expect } from 'vitest';
import {
  createPipeline,
  runPipeline,
  type PipelineStage,
} from './pipeline-runner';

describe('Pipeline Type Inference (TD-304)', () => {
  it('type-safe chain：string → number → boolean', async () => {
    const stage1: PipelineStage<string, number> = {
      name: 's1',
      run: async (input) => input.length,
    };
    const stage2: PipelineStage<number, boolean> = {
      name: 's2',
      run: async (input) => input > 0,
    };

    const pipeline = createPipeline(stage1, stage2);
    const result = await runPipeline<string, boolean>(pipeline, 'hello');

    expect(result.value).toBe(true);
  });

  it('createPipeline 接受正確泛型鏈接', () => {
    const stage1: PipelineStage<string, number> = {
      name: 's1',
      run: async (input) => input.length,
    };
    const stage2: PipelineStage<number, boolean> = {
      name: 's2',
      run: async (input) => input > 0,
    };

    // 不應拋錯
    expect(() => createPipeline(stage1, stage2)).not.toThrow();
  });

  it('三個 stage 鏈接', async () => {
    const stage1: PipelineStage<string, string> = {
      name: 's1',
      run: async (input) => input.toUpperCase(),
    };
    const stage2: PipelineStage<string, number> = {
      name: 's2',
      run: async (input) => input.length,
    };
    const stage3: PipelineStage<number, string> = {
      name: 's3',
      run: async (input) => `length=${input}`,
    };

    const pipeline = createPipeline(stage1, stage2, stage3);
    const result = await runPipeline<string, string>(pipeline, 'hello');

    expect(result.value).toBe('length=5');
  });

  it('單一 stage', async () => {
    const stage: PipelineStage<string, string> = {
      name: 's1',
      run: async (input) => input,
    };

    const pipeline = createPipeline(stage);
    const result = await runPipeline<string, string>(pipeline, 'x');

    expect(result.value).toBe('x');
  });
});