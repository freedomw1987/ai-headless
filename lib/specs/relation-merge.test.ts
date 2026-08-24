/**
 * TDD Gate 1 — Relation 統一 (TD-305)
 *
 * 涵蓋：
 * 1. field.relation 自動合併到 model.relations
 * 2. field.relation + model.relations 共存不重複
 * 3. 沒有 field.relation 時不影響現有 model.relations
 */

import { describe, it, expect } from 'vitest';
import { mergeRelations } from './relation-merge';
import type { JsonSpec, Model } from './json-spec.types';

function makeModel(fields: Model['fields'], relations: Model['relations']): Model {
  return { name: 'Post', fields, relations };
}

describe('mergeRelations (TD-305)', () => {
  it('從 field.type=reference 自動推導 belongsTo', () => {
    const model = makeModel(
      [
        { name: 'authorId', type: 'reference' },
        { name: 'title', type: 'string' },
      ],
      undefined,
    );

    const merged = mergeRelations(model);
    expect(merged).toHaveLength(1);
    expect(merged![0]).toMatchObject({
      type: 'belongsTo',
      model: 'Author',
      foreignKey: 'authorId',
    });
  });

  it('field.relation 顯式指定 model 名稱', () => {
    const model = makeModel(
      [
        {
          name: 'categoryId',
          type: 'reference',
          relation: { type: 'belongsTo', model: 'Category' },
        },
      ],
      undefined,
    );

    const merged = mergeRelations(model);
    expect(merged![0]).toMatchObject({
      type: 'belongsTo',
      model: 'Category',
      foreignKey: 'categoryId',
    });
  });

  it('field.relation 與 model.relations 共存不重複', () => {
    const model = makeModel(
      [
        {
          name: 'authorId',
          type: 'reference',
        },
      ],
      [{ type: 'belongsTo', model: 'Author', foreignKey: 'authorId' }],
    );

    const merged = mergeRelations(model);
    // 只有一個 belongsTo（不重複）
    expect(merged).toHaveLength(1);
    expect(merged![0]!.foreignKey).toBe('authorId');
  });

  it('field.name 不以 Id 結尾時推斷的 model 為 field 名（首字母大寫）', () => {
    const model = makeModel(
      [{ name: 'parent', type: 'reference' }],
      undefined,
    );

    const merged = mergeRelations(model);
    expect(merged![0]).toMatchObject({
      model: 'Parent',
      foreignKey: 'parent',
    });
  });

  it('沒有 reference 欄位時返回 model.relations 原樣', () => {
    const model = makeModel(
      [{ name: 'title', type: 'string' }],
      [{ type: 'belongsTo', model: 'Author', foreignKey: 'authorId' }],
    );

    const merged = mergeRelations(model);
    expect(merged).toHaveLength(1);
    expect(merged![0]!.model).toBe('Author');
  });

  it('JsonSpec 級別應用：每個 model 都自動合併', () => {
    const spec: JsonSpec = {
      name: 'blog',
      label: 'Blog',
      models: [
        makeModel(
          [
            { name: 'authorId', type: 'reference' },
            { name: 'title', type: 'string' },
          ],
          undefined,
        ),
        makeModel(
          [{ name: 'name', type: 'string' }],
          undefined,
        ),
      ],
    };

    const mergedSpec = mergeRelationsInSpec(spec);
    expect(mergedSpec.models[0]!.relations).toHaveLength(1);
    expect(mergedSpec.models[1]!.relations ?? []).toHaveLength(0);
  });
});

/**
 * 應用 mergeRelations 到整個 JsonSpec
 */
import { mergeRelationsInSpec } from './relation-merge';