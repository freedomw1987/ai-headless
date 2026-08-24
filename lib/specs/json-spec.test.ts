/**
 * TDD Gate 1 — JsonSpec 校驗測試
 */

import { describe, it, expect } from 'vitest';
import {
  validateJsonSpec,
  validateJsonSpecFromString,
  parseHookReference,
  collectHookReferences,
  assertValidJsonSpec,
} from './json-spec.validator';

describe('validateJsonSpec', () => {
  describe('基本校驗', () => {
    it('接受合法的簡單 spec', () => {
      const spec = {
        name: 'todo-app',
        label: '待辦事項',
        models: [
          {
            name: 'Todo',
            fields: [{ name: 'title', type: 'string', validation: { required: true } }],
          },
        ],
      };

      const result = validateJsonSpec(spec);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('todo-app');
      }
    });

    it('拒絕缺少 models 的 spec', () => {
      const spec = {
        name: 'empty',
        label: '空',
      };

      const result = validateJsonSpec(spec);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.some((e) => e.code === 'invalid_type')).toBe(true);
      }
    });

    it('拒絕 model 名不符合 PascalCase', () => {
      const spec = {
        name: 'test',
        label: 'Test',
        models: [
          {
            name: 'todo',  // 應為 Todo
            fields: [{ name: 'title', type: 'string' }],
          },
        ],
      };

      const result = validateJsonSpec(spec);

      expect(result.success).toBe(false);
    });

    it('拒絕欄位名不符合 snake_case', () => {
      const spec = {
        name: 'test',
        label: 'Test',
        models: [
          {
            name: 'Todo',
            fields: [{ name: 'MyTitle', type: 'string' }],  // 應為 myTitle
          },
        ],
      };

      const result = validateJsonSpec(spec);

      expect(result.success).toBe(false);
    });
  });

  describe('進階校驗', () => {
    it('檢測重複的 model 名', () => {
      const spec = {
        name: 'test',
        label: 'Test',
        models: [
          {
            name: 'Todo',
            fields: [{ name: 'title', type: 'string' }],
          },
          {
            name: 'Todo',  // 重複
            fields: [{ name: 'name', type: 'string' }],
          },
        ],
      };

      const result = validateJsonSpec(spec);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.some((e) => e.message.includes('Model 名重複'))).toBe(true);
      }
    });

    it('檢測 model 內重複的 field 名', () => {
      const spec = {
        name: 'test',
        label: 'Test',
        models: [
          {
            name: 'Todo',
            fields: [
              { name: 'title', type: 'string' },
              { name: 'title', type: 'string' },  // 重複
            ],
          },
        ],
      };

      const result = validateJsonSpec(spec);

      expect(result.success).toBe(false);
    });

    it('檢測 relation 引用的 model 不存在', () => {
      const spec = {
        name: 'test',
        label: 'Test',
        models: [
          {
            name: 'Todo',
            fields: [{ name: 'title', type: 'string' }],
            relations: [{ type: 'belongsTo', model: 'User' }],  // User 不存在
          },
        ],
      };

      const result = validateJsonSpec(spec);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.errors.some((e) => e.message.includes('User') && e.message.includes('不存在')),
        ).toBe(true);
      }
    });

    it('檢測 workflow.initialState 未定義', () => {
      const spec = {
        name: 'test',
        label: 'Test',
        models: [
          {
            name: 'Order',
            fields: [{ name: 'total', type: 'number' }],
            workflows: [
              {
                name: 'orderStateMachine',
                initialState: 'draft',  // 未在 states 定義
                states: {
                  pending: { label: '待付款' },
                },
                transitions: [],
              },
            ],
          },
        ],
      };

      const result = validateJsonSpec(spec);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.some((e) => e.message.includes('initialState'))).toBe(true);
      }
    });

    it('檢測 workflow transition.to 未定義', () => {
      const spec = {
        name: 'test',
        label: 'Test',
        models: [
          {
            name: 'Order',
            fields: [{ name: 'total', type: 'number' }],
            workflows: [
              {
                name: 'orderStateMachine',
                initialState: 'draft',
                states: { draft: { label: '草稿' } },
                transitions: [{ from: 'draft', to: 'paid' }],  // paid 未定義
              },
            ],
          },
        ],
      };

      const result = validateJsonSpec(spec);

      expect(result.success).toBe(false);
    });
  });

  describe('完整 Blog 範例（從 json-spec.md §6）', () => {
    const blogSpec = {
      name: 'blog-post',
      label: 'Blog 文章',
      models: [
        {
          name: 'Post',
          fields: [
            { name: 'title', type: 'string', validation: { required: true } },
            { name: 'slug', type: 'string', validation: { unique: true, pattern: '^[a-z0-9-]+$' } },
            { name: 'content', type: 'richText' },
            { name: 'status', type: 'enum', validation: { enum: ['draft', 'published'] } },
          ],
          computed: [{ name: 'wordCount', type: 'integer', compute: '{{fn:countWords}}' }],
          hooks: {
            beforeCreate: '{{fn:generateSlug}}',
          },
          actions: [
            {
              name: 'publishPost',
              label: '發布',
              implementation: '{{fn:publishPost}}',
            },
          ],
          workflows: [
            {
              name: 'postStateMachine',
              initialState: 'draft',
              states: {
                draft: { label: '草稿' },
                published: { label: '已發布' },
              },
              transitions: [{ from: 'draft', to: 'published', effect: '{{fn:publishEffect}}' }],
            },
          ],
        },
      ],
    };

    it('完整 Blog 範例通過校驗', () => {
      const result = validateJsonSpec(blogSpec);
      expect(result.success).toBe(true);
    });
  });
});

describe('validateJsonSpecFromString', () => {
  it('校驗 JSON 字串', () => {
    const json = JSON.stringify({
      name: 'test',
      label: 'Test',
      models: [{ name: 'X', fields: [{ name: 'y', type: 'string' }] }],
    });

    const result = validateJsonSpecFromString(json);

    expect(result.success).toBe(true);
  });

  it('處理無效的 JSON 字串', () => {
    const result = validateJsonSpecFromString('{ invalid json');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0]?.code).toBe('JSON_PARSE_ERROR');
    }
  });
});

describe('parseHookReference', () => {
  it('解析有效的 hook 引用', () => {
    expect(parseHookReference('{{fn:generateSlug}}')).toBe('generateSlug');
    expect(parseHookReference('{{fn:onTransition}}')).toBe('onTransition');
  });

  it('處理無效的 hook 引用', () => {
    expect(parseHookReference('not-a-ref')).toBeNull();
    expect(parseHookReference('{{fn:}}')).toBeNull();
    expect(parseHookReference('{{fn:123}}')).toBeNull();  // 數字開頭
    expect(parseHookReference('')).toBeNull();
  });
});

describe('collectHookReferences', () => {
  it('收集 spec 中所有 hook 引用', () => {
    const spec = {
      name: 'blog',
      label: 'Blog',
      models: [
        {
          name: 'Post',
          fields: [{ name: 'title', type: 'string' }],
          computed: [{ name: 'wordCount', type: 'integer', compute: '{{fn:countWords}}' }],
          hooks: {
            beforeCreate: '{{fn:generateSlug}}',
            afterCreate: '{{fn:generateExcerpt}}',
          },
          actions: [
            { name: 'publish', label: '發布', implementation: '{{fn:publishPost}}' },
          ],
          workflows: [
            {
              name: 'sm',
              initialState: 'draft',
              states: {
                draft: { label: '草稿', onEnter: '{{fn:onDraftEnter}}' },
                published: { label: '已發布' },
              },
              transitions: [
                {
                  from: 'draft',
                  to: 'published',
                  guard: '{{fn:canPublish}}',
                  effect: '{{fn:onPublish}}',
                },
              ],
            },
          ],
        },
      ],
    };

    const refs = collectHookReferences(spec as Parameters<typeof collectHookReferences>[0]);

    expect(refs).toContain('countWords');
    expect(refs).toContain('generateSlug');
    expect(refs).toContain('generateExcerpt');
    expect(refs).toContain('publishPost');
    expect(refs).toContain('onDraftEnter');
    expect(refs).toContain('canPublish');
    expect(refs).toContain('onPublish');
    expect(refs.length).toBe(7);
  });

  it('空 spec 返回空陣列', () => {
    const spec = {
      name: 'empty',
      label: 'Empty',
      models: [{ name: 'X', fields: [{ name: 'y', type: 'string' }] }],
    };
    expect(collectHookReferences(spec as Parameters<typeof collectHookReferences>[0])).toEqual([]);
  });
});

describe('assertValidJsonSpec', () => {
  it('合法時返回 data', () => {
    const spec = {
      name: 'test',
      label: 'Test',
      models: [{ name: 'X', fields: [{ name: 'y', type: 'string' }] }],
    };

    const result = assertValidJsonSpec(spec);

    expect(result.name).toBe('test');
  });

  it('不合法時拋出錯誤', () => {
    const spec = { name: 'test', label: 'Test' };  // 缺 models

    expect(() => assertValidJsonSpec(spec)).toThrow(/JSON 規範不合法/);
  });
});
