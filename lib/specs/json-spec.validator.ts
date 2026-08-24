/**
 * ==============================================
 *  JSON Spec Validator
 * ==============================================
 *
 * 用途：校驗 JSON 規範、提供友好的錯誤信息
 * 對應：docs/specs/json-spec.md
 */

import type { ZodIssue } from 'zod';
import { jsonSpecSchema } from './json-spec.schema';
import type { JsonSpec } from './json-spec.types';

export type ValidationResult =
  | { success: true; data: JsonSpec }
  | { success: false; errors: ValidationError[] };

export type ValidationError = {
  path: string;
  message: string;
  code: string;
};

/**
 * 校驗 JSON 規範
 *
 * @param input - 待校驗的物件（通常是 AI 生成的 JSON.parse 結果）
 * @returns ValidationResult
 */
export function validateJsonSpec(input: unknown): ValidationResult {
  const result = jsonSpecSchema.safeParse(input);

  if (result.success) {
    return { success: true, data: result.data as JsonSpec };
  }

  const errors = result.error.issues.map(toValidationError);
  return { success: false, errors };
}

/**
 * 校驗並拋出錯誤（如果不合法）
 */
export function assertValidJsonSpec(input: unknown): JsonSpec {
  const result = validateJsonSpec(input);

  if (!result.success) {
    const messages = result.errors.map((e) => `  - [${e.path}] ${e.message}`).join('\n');
    throw new Error(`JSON 規範不合法：\n${messages}`);
  }

  return result.data;
}

/**
 * 轉換 Zod issue 為友好的錯誤信息
 */
function toValidationError(issue: ZodIssue): ValidationError {
  const path = issue.path.length > 0 ? issue.path.join('.') : '(root)';

  return {
    path,
    message: issue.message,
    code: String(issue.code),
  };
}

// ==============================================
// 輔助函數
// ==============================================

/**
 * 從 JSON 字串校驗
 */
export function validateJsonSpecFromString(json: string): ValidationResult {
  try {
    const parsed = JSON.parse(json);
    return validateJsonSpec(parsed);
  } catch (err) {
    return {
      success: false,
      errors: [
        {
          path: '(parse)',
          message: `JSON 解析失敗：${err instanceof Error ? err.message : String(err)}`,
          code: 'JSON_PARSE_ERROR',
        },
      ],
    };
  }
}

/**
 * 從 {{fn:xxx}} 提取函數名
 *
 * 用於解析 Extension Code 中的 hook 引用
 */
export function parseHookReference(reference: string): string | null {
  const match = reference.match(/^\{\{fn:([a-zA-Z_][a-zA-Z0-9_]*)\}\}$/);
  return match?.[1] ?? null;
}

/**
 * 收集 JSON Spec 中所有 {{fn:xxx}} 引用
 *
 * 用於檢查 Extension Code 是否覆蓋所有 hook
 */
export function collectHookReferences(spec: JsonSpec): string[] {
  const refs = new Set<string>();

  for (const model of spec.models) {
    // Hooks
    for (const hook of Object.values(model.hooks ?? {})) {
      const fn = parseHookReference(hook);
      if (fn) refs.add(fn);
    }

    // Actions
    for (const action of model.actions ?? []) {
      const fn = parseHookReference(action.implementation);
      if (fn) refs.add(fn);
    }

    // Computed
    for (const computed of model.computed ?? []) {
      const fn = parseHookReference(computed.compute);
      if (fn) refs.add(fn);
    }

    // Workflows
    for (const workflow of model.workflows ?? []) {
      for (const [, stateConfig] of Object.entries(workflow.states)) {
        if (stateConfig.onEnter) {
          const fn = parseHookReference(stateConfig.onEnter);
          if (fn) refs.add(fn);
        }
        if (stateConfig.onExit) {
          const fn = parseHookReference(stateConfig.onExit);
          if (fn) refs.add(fn);
        }
      }
      for (const transition of workflow.transitions) {
        if (transition.guard) {
          const fn = parseHookReference(transition.guard);
          if (fn) refs.add(fn);
        }
        if (transition.effect) {
          const fn = parseHookReference(transition.effect);
          if (fn) refs.add(fn);
        }
      }
    }
  }

  return Array.from(refs);
}
