// Sprint 14 TECH-034 — Dynamic UI Config Builder
//
// 從 JsonSpec 推導 Server Component 用的 UI 配置：
// - buildListUIConfig: 列表頁（欄位、新增按鈕）
// - buildFormUIConfig: 新增/編輯表單（欄位、驗證）
// - buildDetailUIConfig: 詳情頁（欄位 + workflow transitions）
//
// 純函式，方便測試。

import type { JsonSpec, Field, FieldType } from '@/lib/specs/json-spec.types';

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
};

export function buildListUIConfig(spec: JsonSpec): ListUIConfig {
  const model = spec.models[0];
  if (!model) throw new Error(`Spec "${spec.name}" has no models`);

  const fields = model.fields
    .filter((f) => f.ui?.list !== false)
    .map<UIField>((f) => toUIField(f, true));

  return {
    title: model.label ?? spec.label ?? spec.name,
    fields,
    apiEndpoint: `/api/crud/${spec.name}`,
    createLink: `/admin/crud/${spec.name}/new`,
  };
}

export function buildFormUIConfig(spec: JsonSpec): FormUIConfig {
  const model = spec.models[0];
  if (!model) throw new Error(`Spec "${spec.name}" has no models`);

  const fields = model.fields
    .filter((f) => f.ui?.form !== false)
    .map<UIField>((f) => toUIField(f, false));

  return {
    title: `${model.label ?? spec.name} - 新增`,
    fields,
    submitUrl: `/api/crud/${spec.name}`,
  };
}

export function buildDetailUIConfig(spec: JsonSpec): DetailUIConfig {
  const model = spec.models[0];
  if (!model) throw new Error(`Spec "${spec.name}" has no models`);

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
    .map<UIField>((f) => toUIField(f, false));

  return {
    title: model.label ?? spec.name,
    fields,
    transitions,
  };
}

// ==============================================
// Internal
// ==============================================

function toUIField(field: Field, showInList: boolean): UIField {
  return {
    name: field.name,
    label: field.label ?? field.name,
    inputType: mapFieldToInputType(field.type),
    required: field.validation?.required ?? false,
    options: field.validation?.enum,
    showInList,
    placeholder: field.description ?? undefined,
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