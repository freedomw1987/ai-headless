/**
 * TDD Gate 1 — Schema Generator 測試
 *
 * Schema Generator 將 JsonSpec 轉換為 Prisma schema 字串
 */

import { describe, it, expect } from 'vitest';
import { generatePrismaSchema } from './schema-generator';
import type { FieldType, JsonSpec } from '@/lib/specs/json-spec.types';

describe('generatePrismaSchema', () => {
  describe('基本轉換', () => {
    it('生成包含 generator 和 datasource 的完整 schema', () => {
      const spec: JsonSpec = {
        name: 'todo',
        label: '待辦',
        models: [
          {
            name: 'Todo',
            fields: [{ name: 'title', type: 'string' }],
          },
        ],
      };

      const schema = generatePrismaSchema(spec);

      expect(schema).toContain('generator client');
      expect(schema).toContain('datasource db');
      expect(schema).toContain('provider = "prisma-client-js"');
      expect(schema).toContain('model Todo');
      expect(schema).toContain('title  String');
    });

    it('每個 model 都有 id @id @default(cuid())', () => {
      const spec: JsonSpec = {
        name: 'todo',
        label: '待辦',
        models: [{ name: 'Todo', fields: [{ name: 'title', type: 'string' }] }],
      };

      const schema = generatePrismaSchema(spec);

      expect(schema).toContain('id  String  @id @default(cuid())');
    });

    it('每個 model 都有 createdAt 和 updatedAt', () => {
      const spec: JsonSpec = {
        name: 'todo',
        label: '待辦',
        models: [{ name: 'Todo', fields: [{ name: 'title', type: 'string' }] }],
      };

      const schema = generatePrismaSchema(spec);

      expect(schema).toContain('createdAt  DateTime  @default(now())');
      expect(schema).toContain('updatedAt  DateTime  @updatedAt');
    });

    it('多個 model 都正確生成', () => {
      const spec: JsonSpec = {
        name: 'blog',
        label: 'Blog',
        models: [
          { name: 'Post', fields: [{ name: 'title', type: 'string' }] },
          { name: 'Category', fields: [{ name: 'name', type: 'string' }] },
        ],
      };

      const schema = generatePrismaSchema(spec);

      expect(schema).toContain('model Post');
      expect(schema).toContain('model Category');
    });
  });

  describe('欄位類型映射', () => {
    const typeCases: Array<{ type: FieldType; prismaType: string }> = [
      { type: 'string', prismaType: 'String' },
      { type: 'text', prismaType: 'String' },
      { type: 'richText', prismaType: 'String  @db.Text' },
      { type: 'number', prismaType: 'Float' },
      { type: 'integer', prismaType: 'Int' },
      { type: 'decimal', prismaType: 'Decimal' },
      { type: 'boolean', prismaType: 'Boolean' },
      { type: 'datetime', prismaType: 'DateTime' },
      { type: 'date', prismaType: 'DateTime  @db.Date' },
      { type: 'time', prismaType: 'String' },
      { type: 'enum', prismaType: 'String' },
      { type: 'json', prismaType: 'Json' },
      { type: 'file', prismaType: 'String' },
      { type: 'image', prismaType: 'String' },
      { type: 'reference', prismaType: 'String' },
    ];

    typeCases.forEach(({ type, prismaType }) => {
      it(`${type} → ${prismaType}`, () => {
        const spec: JsonSpec = {
          name: 'test',
          label: 'Test',
          models: [{ name: 'M', fields: [{ name: 'field', type }] }],
        };

        const schema = generatePrismaSchema(spec);
        expect(schema).toContain(`field  ${prismaType}`);
      });
    });
  });

  describe('修飾符（Modifiers）', () => {
    it('required 欄位不加 ?', () => {
      const spec: JsonSpec = {
        name: 'test',
        label: 'Test',
        models: [
          {
            name: 'Post',
            fields: [{ name: 'title', type: 'string', validation: { required: true } }],
          },
        ],
      };

      const schema = generatePrismaSchema(spec);

      expect(schema).toMatch(/title\s+String\b/); // 不含 ?
      expect(schema).not.toMatch(/title\s+String\?/);
    });

    it('非 required 欄位加 ?', () => {
      const spec: JsonSpec = {
        name: 'test',
        label: 'Test',
        models: [
          {
            name: 'Post',
            fields: [{ name: 'subtitle', type: 'string' }],
          },
        ],
      };

      const schema = generatePrismaSchema(spec);

      expect(schema).toContain('subtitle  String?');
    });

    it('unique 欄位加 @unique', () => {
      const spec: JsonSpec = {
        name: 'test',
        label: 'Test',
        models: [
          {
            name: 'Post',
            fields: [{ name: 'slug', type: 'string', validation: { unique: true } }],
          },
        ],
      };

      const schema = generatePrismaSchema(spec);

      expect(schema).toContain('slug  String  @unique');
    });

    it('default 值', () => {
      const spec: JsonSpec = {
        name: 'test',
        label: 'Test',
        models: [
          {
            name: 'Post',
            fields: [
              { name: 'viewCount', type: 'integer', validation: { default: 0 } },
              { name: 'status', type: 'enum', validation: { enum: ['draft', 'published'], default: 'draft' } },
            ],
          },
        ],
      };

      const schema = generatePrismaSchema(spec);

      expect(schema).toContain('viewCount  Int  @default(0)');
      expect(schema).toContain('status  String  @default("draft")');
    });

    it('default 為 boolean', () => {
      const spec: JsonSpec = {
        name: 'test',
        label: 'Test',
        models: [
          {
            name: 'Post',
            fields: [
              { name: 'isPublished', type: 'boolean', validation: { default: false } },
            ],
          },
        ],
      };

      const schema = generatePrismaSchema(spec);

      expect(schema).toContain('isPublished  Boolean  @default(false)');
    });
  });

  describe('Relation 處理', () => {
    it('belongsTo 關聯生成外鍵欄位 + @relation', () => {
      const spec: JsonSpec = {
        name: 'blog',
        label: 'Blog',
        models: [
          {
            name: 'Post',
            fields: [{ name: 'title', type: 'string' }],
            relations: [
              { type: 'belongsTo', model: 'Category', foreignKey: 'categoryId' },
            ],
          },
          {
            name: 'Category',
            fields: [{ name: 'name', type: 'string' }],
            relations: [{ type: 'hasMany', model: 'Post' }],
          },
        ],
      };

      const schema = generatePrismaSchema(spec);

      expect(schema).toContain('categoryId  String');
      expect(schema).toContain('category  Category?  @relation(fields: [categoryId], references: [id])');
      expect(schema).toContain('posts  Post[]');
    });

    it('hasMany 不生成外鍵', () => {
      const spec: JsonSpec = {
        name: 'blog',
        label: 'Blog',
        models: [
          { name: 'Author', fields: [{ name: 'name', type: 'string' }] },
          {
            name: 'Post',
            fields: [{ name: 'authorId', type: 'string' }],
            relations: [{ type: 'belongsTo', model: 'Author' }],
          },
        ],
      };

      const schema = generatePrismaSchema(spec);

      expect(schema).toMatch(/model Author[\s\S]+posts\s+Post\[\]/);
    });
  });

  describe('特殊選項', () => {
    it('softDelete: true 加入 deletedAt 欄位', () => {
      const spec: JsonSpec = {
        name: 'test',
        label: 'Test',
        models: [
          { name: 'Post', fields: [{ name: 'title', type: 'string' }], softDelete: true },
        ],
      };

      const schema = generatePrismaSchema(spec);

      expect(schema).toContain('deletedAt  DateTime?');
    });

    it('softDelete 預設為 true（自動生成 deletedAt）', () => {
      const spec: JsonSpec = {
        name: 'test',
        label: 'Test',
        models: [{ name: 'Post', fields: [{ name: 'title', type: 'string' }] }],
      };

      const schema = generatePrismaSchema(spec);

      expect(schema).toContain('deletedAt  DateTime?');
    });

    it('softDelete: false 不加入 deletedAt', () => {
      const spec: JsonSpec = {
        name: 'test',
        label: 'Test',
        models: [
          { name: 'Session', fields: [{ name: 'token', type: 'string' }], softDelete: false },
        ],
      };

      const schema = generatePrismaSchema(spec);
      expect(schema).not.toContain('deletedAt');
    });
  });

  describe('跳過 computed 欄位', () => {
    it('不為 computed 欄位生成 Prisma 欄位', () => {
      const spec: JsonSpec = {
        name: 'blog',
        label: 'Blog',
        models: [
          {
            name: 'Post',
            fields: [{ name: 'content', type: 'richText' }],
            computed: [{ name: 'wordCount', type: 'integer', compute: '{{fn:countWords}}' }],
          },
        ],
      };

      const schema = generatePrismaSchema(spec);

      expect(schema).toContain('content');
      expect(schema).not.toMatch(/wordCount\s+(Int|Float)/);
    });
  });

  describe('comment 註解', () => {
    it('頂部包含 AI 自動生成註解', () => {
      const spec: JsonSpec = {
        name: 'todo',
        label: '待辦',
        models: [{ name: 'Todo', fields: [{ name: 'title', type: 'string' }] }],
      };

      const schema = generatePrismaSchema(spec);

      expect(schema).toContain('// 此文件由 ai-headless 自動生成');
      expect(schema).toContain('// Spec: todo');
    });
  });

  describe('Workflow 狀態機字段', () => {
    it('包含 workflow 的 model 自動加入 status 欄位（如尚未定義）', () => {
      const spec: JsonSpec = {
        name: 'order',
        label: 'Order',
        models: [
          {
            name: 'Order',
            fields: [{ name: 'total', type: 'number' }],
            workflows: [
              {
                name: 'orderStateMachine',
                initialState: 'draft',
                states: {
                  draft: { label: '草稿' },
                  paid: { label: '已付款' },
                },
                transitions: [{ from: 'draft', to: 'paid' }],
              },
            ],
          },
        ],
      };

      const schema = generatePrismaSchema(spec);

      // 應自動產生 status 欄位
      expect(schema).toMatch(/status\s+String\?/);
    });

    it('已有 status 欄位時不重複加入', () => {
      const spec: JsonSpec = {
        name: 'order',
        label: 'Order',
        models: [
          {
            name: 'Order',
            fields: [
              { name: 'total', type: 'number' },
              { name: 'status', type: 'enum', validation: { enum: ['draft', 'paid'] } },
            ],
            workflows: [
              {
                name: 'sm',
                initialState: 'draft',
                states: {
                  draft: { label: '草稿' },
                  paid: { label: '已付款' },
                },
                transitions: [{ from: 'draft', to: 'paid' }],
              },
            ],
          },
        ],
      };

      const schema = generatePrismaSchema(spec);

      // 只應有一個 status 欄位（不含 2 個以上）
      const statusMatches = schema.match(/status\s+String/g);
      expect(statusMatches?.length).toBeLessThanOrEqual(1);
    });
  });
});
