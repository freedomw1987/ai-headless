/**
 * ==============================================
 *  Ref Resolver — {{fn:...}} 引用統一解析
 * ==============================================
 *
 * 對應：docs/specs/json-spec.md §3.6 Hook 引用語法
 *
 * 整個 ai-headless 框架用 `{{fn:函數名稱}}` 統一表示「呼叫 Extension 函數」。
 * 這個模組負責：
 *
 * 1. **extractAllReferences(spec)**
 *    掃描整個 JsonSpec，找出所有 {{fn:...}} 引用
 *    回傳類型化清單（含 kind / name / location）
 *
 * 2. **validateReferences(spec, registries)**
 *    比對 spec 引用 vs Extension 註冊的函數
 *    找出「spec 引用但 Extension 沒註冊」的不一致
 *
 * 3. **renderTemplate(template, context)**
 *    把字符串中的 {{fn:key}} 替換為 context[key]
 *    用於 email/message/UI label 等動態字串
 *
 * 設計原則：
 * - 單一來源（Single source of truth）：所有 JSON Spec 的引用都從這裡走
 * - 不區分 hook / action / computed — 統一 Reference 對象
 * - location 用「models[Post].hooks.beforeCreate」格式，便於錯誤定位
 */

import type { JsonSpec, Model, Workflow } from '@/lib/specs/json-spec.types';
import { parseHookReference } from '@/lib/hooks/hook-sdk';

// ==============================================
// 1. Reference 類型
// ==============================================

export type ReferenceKind = 'hook' | 'action' | 'computed' | 'workflow';

export type Reference = {
  /** 引用類型 */
  kind: ReferenceKind;
  /** 函數名稱 */
  name: string;
  /** 來源位置（如 'models[Post].hooks.beforeCreate'） */
  location: string;
};

// ==============================================
// 2. extractAllReferences 掃描
// ==============================================

/**
 * 掃描整個 JsonSpec，提取所有 {{fn:...}} 引用
 */
export function extractAllReferences(spec: JsonSpec): Reference[] {
  const refs: Reference[] = [];

  // 1. Models
  for (const model of spec.models ?? []) {
    refs.push(...extractModelReferences(model));
  }

  // 2. Workflows
  for (const workflow of spec.workflows ?? []) {
    refs.push(...extractWorkflowReferences(workflow));
  }

  return refs;
}

function extractModelReferences(model: Model): Reference[] {
  const refs: Reference[] = [];
  const mPrefix = `models[${model.name}]`;

  // hooks
  if (model.hooks) {
    const hookNames: Array<keyof typeof model.hooks> = [
      'beforeCreate',
      'afterCreate',
      'beforeUpdate',
      'afterUpdate',
      'beforeDelete',
      'afterDelete',
      'onTransition',
      'beforeList',
      'afterList',
      'beforeRead',
      'afterRead',
    ];
    for (const hookName of hookNames) {
      const hookRef = model.hooks[hookName];
      if (hookRef) {
        const name = parseHookReference(hookRef) ?? hookRef;
        refs.push({
          kind: 'hook',
          name,
          location: `${mPrefix}.hooks.${hookName}`,
        });
      }
    }
  }

  // actions
  for (const action of model.actions ?? []) {
    const name = parseHookReference(action.implementation) ?? action.implementation;
    refs.push({
      kind: 'action',
      name,
      location: `${mPrefix}.actions[${action.name}]`,
    });
  }

  // computed
  for (const computed of model.computed ?? []) {
    const name = parseHookReference(computed.compute) ?? computed.compute;
    refs.push({
      kind: 'computed',
      name,
      location: `${mPrefix}.computed[${computed.name}]`,
    });
  }

  return refs;
}

function extractWorkflowReferences(workflow: Workflow): Reference[] {
  const refs: Reference[] = [];
  const wPrefix = `workflows[${workflow.name}]`;

  // states.onEnter / onExit
  for (const [stateName, stateConfig] of Object.entries(workflow.states ?? {})) {
    if (stateConfig.onEnter) {
      const name = parseHookReference(stateConfig.onEnter) ?? stateConfig.onEnter;
      refs.push({
        kind: 'workflow',
        name,
        location: `${wPrefix}.states[${stateName}].onEnter`,
      });
    }
    if (stateConfig.onExit) {
      const name = parseHookReference(stateConfig.onExit) ?? stateConfig.onExit;
      refs.push({
        kind: 'workflow',
        name,
        location: `${wPrefix}.states[${stateName}].onExit`,
      });
    }
  }

  // transitions.guard / effect
  for (const transition of workflow.transitions ?? []) {
    if (transition.guard) {
      const name = parseHookReference(transition.guard) ?? transition.guard;
      refs.push({
        kind: 'workflow',
        name,
        location: `${wPrefix}.transitions[${transition.from}->${transition.to}].guard`,
      });
    }
    if (transition.effect) {
      const name = parseHookReference(transition.effect) ?? transition.effect;
      refs.push({
        kind: 'workflow',
        name,
        location: `${wPrefix}.transitions[${transition.from}->${transition.to}].effect`,
      });
    }
  }

  return refs;
}

// ==============================================
// 3. validateReferences 依賴驗證
// ==============================================

export type Registries = {
  hooks: Set<string>;
  actions: Set<string>;
  computed: Set<string>;
};

export type ValidationResult = {
  valid: boolean;
  /** 缺少的引用（spec 引用但 registry 沒有） */
  missing: Reference[];
};

/**
 * 驗證 JsonSpec 中的所有 {{fn:...}} 引用是否都已註冊
 */
export function validateReferences(spec: JsonSpec, registries: Registries): ValidationResult {
  const refs = extractAllReferences(spec);
  const missing: Reference[] = [];

  for (const ref of refs) {
    const registered =
      ref.kind === 'hook'
        ? registries.hooks.has(ref.name)
        : ref.kind === 'action'
          ? registries.actions.has(ref.name)
          : ref.kind === 'computed'
            ? registries.computed.has(ref.name)
            : true; // workflow 函數由 effectRegistry 提供，不單獨驗證

    if (!registered) {
      missing.push(ref);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

// ==============================================
// 4. renderTemplate 模板渲染
// ==============================================

/**
 * 把字符串中的 {{fn:key}} 或 {{ fn: key }} 替換為 context 中的值
 *
 * - 非字符串輸入原樣返回
 * - 找不到的 key 保留原樣
 * - 支援嵌套鍵（用 . 分隔）
 */
export function renderTemplate(
  template: unknown,
  context: Record<string, unknown>,
): string {
  if (typeof template !== 'string') {
    if (template === null || template === undefined) return '';
    return String(template);
  }

  return template.replace(/\{\{\s*fn\s*:\s*([^}]+?)\s*\}\}/g, (match, key: string) => {
    const trimmedKey = key.trim();
    const value = getNestedValue(context, trimmedKey);
    if (value === undefined || value === null) {
      return match; // 保留原樣
    }
    return String(value);
  });
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

// ==============================================
// 5. Generator 整合輔助
// ==============================================

/**
 * 為 generator 產生 invokeHook 呼叫代碼
 *
 * 用法：emitInvokeHookCall('myHook', 'data, { user }', 'beforeCreate')
 * 輸出：
 *   ({ data } = await invokeHook('myHook', { data, model: 'Post', ctx: { user } }));
 */
export function emitInvokeHookCall(
  fnName: string,
  variableNames: string,
  hookKind: string,
  modelName?: string,
): string {
  const modelRef = modelName ? `, model: '${modelName}'` : '';
  return `await invokeHook('${fnName}', { /* ${variableNames} */ ${modelRef} }); /* ${hookKind} */`;
}

/**
 * 為 generator 產生 invokeComputed 呼叫代碼
 */
export function emitInvokeComputedCall(
  fnName: string,
  recordVariable: string,
): string {
  return `invokeComputed('${fnName}', { record: ${recordVariable} })`;
}

/**
 * 為 generator 產生 invokeAction 呼叫代碼（含 schema 驗證）
 */
export function emitInvokeActionCall(
  fnName: string,
  dataVariable: string,
  schemaExpression?: string,
  inputVariable?: string,
): string {
  const opts = [];
  if (schemaExpression) opts.push(`inputSchema: ${schemaExpression}`);
  if (inputVariable) opts.push(`input: ${inputVariable}`);
  const optStr = opts.length > 0 ? `, { ${opts.join(', ')} }` : '';
  return `await invokeAction('${fnName}', { data: ${dataVariable} }${optStr})`;
}