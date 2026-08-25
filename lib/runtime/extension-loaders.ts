/**
 * Sprint 15 TECH-038 — Extension Formatter / CustomRenderer Loader
 *
 * 設計：
 * - formatters 是純函數（同步、SSR 安全）
 * - customRenderers 是 React component（client side only）
 * - 透過 require.resolve + require pattern 動態載入 extension 檔案
 *
 * 路徑約定：
 * - extensions/<name>/formatters/<fnName>.ts → 純函數 default export
 * - extensions/<name>/custom-renderers/<fnName>.tsx → React component default export
 *
 * 為何用 require 而不是 import？
 * - dynamic-handler 的 workflow loading 已用此 pattern
 * - 一致、易測試、可在 runtime 動態決定
 * - 缺點：失去 tree-shaking，但 formatter/renderer 是 optional，bundler 不會包全部
 */

import path from 'node:path';
import type { JsonSpec } from '@/lib/specs/json-spec.types';

/** Formatter 純函數簽名：value → string */
export type FormatterFn = (value: unknown, record?: unknown) => string;

/** CustomRenderer React component 簽名 */
export type CustomRendererComponent = (props: {
  value: unknown;
  record: Record<string, unknown>;
}) => React.ReactElement | null;

const PROJECT_ROOT = process.cwd();

/**
 * 載入 spec 內所有 formatters
 *
 * 規則：
 * - spec.models[].formatters 是 { fieldName: '{{fn:fnName}}' }
 * - 對每個 entry，嘗試載入 extensions/<spec.name>/formatters/<fnName>
 * - 找不到 → 跳過（fallback 到預設渲染）
 *
 * @returns Record<fieldName, formatterFn>
 */
export async function loadFormatters(
  spec: JsonSpec,
): Promise<Record<string, FormatterFn>> {
  const result: Record<string, FormatterFn> = {};
  const model = spec.models[0];
  if (!model?.formatters) return result;

  for (const [fieldName, fnRef] of Object.entries(model.formatters)) {
    const fnName = parseFnRef(fnRef);
    if (!fnName) continue;

    try {
      // 用絕對路徑而非 @/ alias（Vitest + Node 原生 require 都不支援 @/ alias）
      // 先試駝峰，再試 kebab-case（兩種檔名都支援）
      const candidates = [
        `extensions/${spec.name}/formatters/${fnName}.ts`,
        `extensions/${spec.name}/formatters/${toKebabCase(fnName)}.ts`,
      ];
      const extPath = resolveExistingPath(candidates);
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mod = require(/* webpackIgnore: true */ extPath) as { default?: FormatterFn; [k: string]: unknown };
      const fn: FormatterFn | undefined = mod.default ?? (mod[fnName] as FormatterFn | undefined);
      if (typeof fn === 'function') {
        result[fieldName] = fn;
      }
    } catch {
      // 找不到 formatter 檔案或檔案無對應 export → 跳過（fallback 預設渲染）
    }
  }

  return result;
}

/**
 * 載入 spec 內所有 customRenderers
 *
 * 規則：
 * - spec.models[].customRenderers 是 { rendererName: '{{fn:fnName}}' }
 * - 對每個 entry，嘗試載入 extensions/<spec.name>/custom-renderers/<fnName>.tsx
 *
 * @returns Record<rendererName, Component>
 */
export async function loadCustomRenderers(
  spec: JsonSpec,
): Promise<Record<string, CustomRendererComponent>> {
  const result: Record<string, CustomRendererComponent> = {};
  const model = spec.models[0];
  if (!model?.customRenderers) return result;

  for (const [rendererName, fnRef] of Object.entries(model.customRenderers)) {
    const fnName = parseFnRef(fnRef);
    if (!fnName) continue;

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const candidates = [
        `extensions/${spec.name}/custom-renderers/${fnName}.tsx`,
        `extensions/${spec.name}/custom-renderers/${fnName}.ts`,
        `extensions/${spec.name}/custom-renderers/${toKebabCase(fnName)}.tsx`,
      ];
      const extPath = resolveExistingPath(candidates);
      const mod = require(/* webpackIgnore: true */ extPath) as { default?: CustomRendererComponent; [k: string]: unknown };
      const Component: CustomRendererComponent | undefined = mod.default ?? mod[fnName] as CustomRendererComponent | undefined;
      if (typeof Component === 'function') {
        result[rendererName] = Component;
      }
    } catch {
      // 找不到 renderer 檔案 → 跳過
    }
  }

  return result;
}

/**
 * 解析 {{fn:fnName}} 引用
 * - "{{fn:formatEventTime}}" → "formatEventTime"
 * - "raw-fn-name"（無前綴）→ "raw-fn-name"（向後兼容）
 * - "" → null
 */
function parseFnRef(ref: string): string | null {
  if (!ref) return null;
  const match = ref.match(/^\{\{fn:([^}]+)\}\}$/);
  return match?.[1] ?? ref;
}

/** camelCase → kebab-case：formatEventTime → format-event-time */
function toKebabCase(s: string): string {
  return s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

/** 從候選路徑中選第一個存在的（用 fs.statSync） */
function resolveExistingPath(candidates: string[]): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('node:fs') as typeof import('node:fs');
  for (const rel of candidates) {
    const abs = path.resolve(PROJECT_ROOT, rel);
    try {
      if (fs.statSync(abs).isFile()) return abs;
    } catch {
      // 繼續試下一個
    }
  }
  // 找不到，回第一個（讓 require throw，觸發 catch）
  return path.resolve(PROJECT_ROOT, candidates[0] ?? '');
}
