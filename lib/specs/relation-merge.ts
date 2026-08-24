/**
 * ==============================================
 *  Relation Merge — TD-305 二元性統一
 * ==============================================
 *
 * 統一 field.type=reference 與 model.relations 兩種表示方式：
 *
 * **優先順序**：
 * 1. field.relation（顯式元數據，最優先）
 * 2. field.type === 'reference'（隱式推導）
 * 3. model.relations（兜底）
 *
 * 用法：在 pipeline 第一步（normalize）時呼叫一次，後續 generator 只讀 model.relations。
 */

import type { JsonSpec, Model, Relation } from './json-spec.types';

/**
 * 將 Field 隱式/顯式 relation 合併到 Model.relations
 */
export function mergeRelations(model: Model): Relation[] | undefined {
  const explicit = model.relations ?? [];
  const fromFields: Relation[] = [];

  for (const field of model.fields) {
    // 顯式 field.relation 優先
    if (field.relation) {
      fromFields.push({
        ...field.relation,
        foreignKey: field.relation.foreignKey ?? field.name,
      });
      continue;
    }

    // 隱式推導：field.type === 'reference'
    if (field.type === 'reference') {
      const target = inferModelFromFieldName(field.name);
      fromFields.push({
        type: 'belongsTo',
        model: target,
        foreignKey: field.name,
      });
    }
  }

  if (fromFields.length === 0) {
    return explicit.length > 0 ? explicit : undefined;
  }

  // 合併：去重（以 foreignKey 為唯一標識）
  const merged: Relation[] = [...explicit];
  const seen = new Set(explicit.map((r) => r.foreignKey ?? r.model));

  for (const r of fromFields) {
    const key = r.foreignKey ?? r.model;
    if (!seen.has(key)) {
      merged.push(r);
      seen.add(key);
    }
  }

  return merged.length > 0 ? merged : undefined;
}

/**
 * 推斷 reference 欄位對應的 Model 名稱
 *
 * 規則：
 * - authorId → Author
 * - category_id → Category
 * - parent → Parent（首字母大寫）
 */
function inferModelFromFieldName(fieldName: string): string {
  // 移除 _id / Id 後綴
  const stripped = fieldName
    .replace(/_id$/i, '')
    .replace(/Id$/, '');

  // 首字母大寫
  return stripped.charAt(0).toUpperCase() + stripped.slice(1);
}

/**
 * 應用到整個 JsonSpec
 */
export function mergeRelationsInSpec(spec: JsonSpec): JsonSpec {
  return {
    ...spec,
    models: spec.models.map((model) => ({
      ...model,
      relations: mergeRelations(model),
    })),
  };
}