// Sprint 14 TECH-034 — Dynamic UI Config Builder
//
// 從 JsonSpec 推導 Server Component 用的 UI 配置：
// - buildListUIConfig: 列表頁（欄位、新增按鈕）
// - buildFormUIConfig: 新增/編輯表單（欄位、驗證）
// - buildDetailUIConfig: 詳情頁（欄位 + workflow transitions）
//
// 純函式，方便測試。

import type { JsonSpec, Field, FieldType } from '@/lib/specs/json-spec.types';
import { parseFnRef } from '@/lib/runtime/extension-loaders';

export type UIInputType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'checkbox'
  | 'select'
  | 'date'
  | 'hidden';

export type UIField = {
  name: string;
  label: string;
  inputType: UIInputType;
  required: boolean;
  options?: string[];
  showInList?: boolean;
  placeholder?: string;
  /** Sprint 15 TECH-038：formatter 名稱（從 model.formatters 推導）*/
  formatter?: string;
  /** Sprint 15 TECH-038：customRenderer 名稱（從 model.customRenderers 推導）*/
  customRenderer?: string;
};

export type ListUIConfig = {
  title: string;
  fields: UIField[];
  apiEndpoint: string;
  createLink: string;
};

export type FormUIConfig = {
  title: string;
  fields: UIField[];
  submitUrl: string;
};

export type TransitionUI = {
  to: string;
  label: string;
  event: string;
};

export type DetailUIConfig = {
  title: string;
  fields: UIField[];
  transitions: TransitionUI[];
  // Sprint 20 Stage 1 — 抽屜式編輯需要 form config（Sheet 內嵌 DynamicFormClient）
  formConfig: FormUIConfig;
};

export function buildListUIConfig(spec: JsonSpec): ListUIConfig {
  const model = spec.models[0];
  if (!model) throw new Error(`Spec "${spec.name}" has no models`);

  // Sprint 15 TECH-038：帶 formatters + customRenderers 到 UIField
  const formatters = model.formatters ?? {};
  const customRenderers = model.customRenderers ?? {};

  const fields = model.fields
    .filter((f) => f.ui?.list !== false)
    .map<UIField>((f) => toUIField(f, true, formatters, customRenderers));

  // Sprint 15 TECH-038：customRenderer 是「組合欄位」，加為虛擬 UIField
  // 用 name = customRenderer key，前端根據 customRenderer 渲染
  for (const [name, fnRef] of Object.entries(customRenderers)) {
    // Sprint 16 TECH-038：customRenderer 屬性要傳拆過的 fnName，不是 raw '{{fn:xxx}}'
    const fnName = parseFnRef(fnRef);
    fields.push({
      name,
      label: name,
      inputType: 'hidden',
      required: false,
      showInList: true,
      customRenderer: fnName ?? fnRef,
    });
  }

  return {
    title: model.label ?? spec.label ?? spec.name,
    fields,
    apiEndpoint: `/api/crud/${spec.name}`,
    createLink: `/admin/crud/${spec.name}/new`,
  };
}

export function buildFormUIConfig(
  spec: JsonSpec,
  mode: 'create' | 'edit' = 'create',
): FormUIConfig {
  const model = spec.models[0];
  if (!model) throw new Error(`Spec "${spec.name}" has no models`);

  // Sprint 15 TECH-038：form 用 formatters（雖然 form 通常用 inputType，但 formatter 提供 placeholder 預填）
  const formatters = model.formatters ?? {};

  const fields = model.fields
    .filter((f) => f.ui?.form !== false)
    .map<UIField>((f) => toUIField(f, false, formatters, {}));

  // Sprint 20 Stage 1：依 mode 動態決定 title 後綴（Sheet 編輯模式不應顯示「- 新增」）
  const titleSuffix = mode === 'create' ? ' - 新增' : ' - 編輯';

  return {
    title: `${model.label ?? spec.name}${titleSuffix}`,
    fields,
    submitUrl: `/api/crud/${spec.name}`,
  };
}

export function buildDetailUIConfig(spec: JsonSpec): DetailUIConfig {
  const model = spec.models[0];
  if (!model) throw new Error(`Spec "${spec.name}" has no models`);

  // Sprint 15 TECH-038：detail 用 formatters（不用 customRenderer，避免 SSR React component 複雜度）
  const formatters = model.formatters ?? {};

  // 支援 spec.workflows（Sprint 13+）或 model.workflows（早期規格）
  const workflow = spec.workflows?.[0] ?? model.workflows?.[0];

  const transitions: TransitionUI[] = workflow
    ? workflow.transitions.map((t) => ({
        to: t.to,
        label: t.to, // Transition 沒有 label 欄位，用 target state
        event: t.to,
      }))
    : [];

  const fields = model.fields
    .filter((f) => f.ui?.form !== false)
    .map<UIField>((f) => toUIField(f, false, formatters, {}));

  return {
    title: model.label ?? spec.name,
    fields,
    transitions,
    // Sprint 20 Stage 1：detail page 內嵌 Sheet 編輯時用（mode='edit' 表「- 編輯」後缀）
    formConfig: buildFormUIConfig(spec, 'edit'),
  };
}

// ==============================================
// Internal
// ==============================================

function toUIField(
  field: Field,
  showInList: boolean,
  formatters: Record<string, string>,
  customRenderers: Record<string, string>,
): UIField {
  return {
    name: field.name,
    label: field.label ?? field.name,
    inputType: mapFieldToInputType(field.type),
    required: field.validation?.required ?? false,
    options: field.validation?.enum,
    showInList,
    placeholder: field.description ?? undefined,
    // Sprint 16 TECH-038：拆 fnRef 出 fnName（之前直接傳 '{{fn:xxx}}' 字串是 bug）
    formatter: parseFnRef(formatters[field.name] ?? '') ?? undefined,
    customRenderer: parseFnRef(customRenderers[field.name] ?? '') ?? undefined,
  };
}

function mapFieldToInputType(fieldType: FieldType): UIInputType {
  switch (fieldType) {
    case 'text':
    case 'richText':
      return 'textarea';
    case 'string':
      return 'text';
    case 'number':
    case 'decimal':
    case 'integer':
      return 'number';
    case 'boolean':
      return 'checkbox';
    case 'enum':
      return 'select';
    case 'date':
    case 'datetime':
      return 'date';
    case 'json':
      return 'hidden';
    case 'image':
    case 'reference':
      return 'text';
    default:
      return 'text';
  }
}