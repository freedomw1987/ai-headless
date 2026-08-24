/**
 * TDD Gate 1 — UI Generator 測試
 *
 * UI Generator 將 JsonSpec 轉換為 Next.js App Router 的 React page 代碼
 * 對應：docs/prd/01-framework-core.md §2.3 FR-2.3
 */

import { describe, it, expect } from 'vitest';
import { generateUIPages } from './ui-generator';
import type { JsonSpec } from '@/lib/specs/json-spec.types';

describe('generateUIPages', () => {
  describe('基本頁面生成', () => {
    it('為每個 model 生成 3 個頁面（list / new / [id]）', () => {
      const spec: JsonSpec = {
        name: 'todo',
        label: '待辦',
        models: [{ name: 'Todo', fields: [{ name: 'title', type: 'string' }] }],
      };

      const pages = generateUIPages(spec);

      const paths = pages.map((p) => p.path);

      expect(paths).toContain('/admin/todo');
      expect(paths).toContain('/admin/todo/new');
      expect(paths).toContain('/admin/todo/[id]');
    });

    it('多 model 都生成對應頁面', () => {
      const spec: JsonSpec = {
        name: 'blog',
        label: 'Blog',
        models: [
          { name: 'Post', fields: [{ name: 'title', type: 'string' }] },
          { name: 'Category', fields: [{ name: 'name', type: 'string' }] },
        ],
      };

      const pages = generateUIPages(spec);

      expect(pages.some((p) => p.path.includes('/admin/post'))).toBe(true);
      expect(pages.some((p) => p.path.includes('/admin/category'))).toBe(true);
    });

    it('每個 page 包含 path, name, code, model, kind metadata', () => {
      const spec: JsonSpec = {
        name: 'todo',
        label: '待辦',
        models: [{ name: 'Todo', fields: [{ name: 'title', type: 'string' }] }],
      };

      const pages = generateUIPages(spec);
      const first = pages[0]!;

      expect(first).toHaveProperty('path');
      expect(first).toHaveProperty('name');
      expect(first).toHaveProperty('code');
      expect(first).toHaveProperty('model');
      expect(first).toHaveProperty('kind');
    });
  });

  describe('List Page', () => {
    it('生成的 list page 包含資料載入邏輯', () => {
      const spec: JsonSpec = {
        name: 'todo',
        label: '待辦',
        models: [{ name: 'Todo', fields: [{ name: 'title', type: 'string' }] }],
      };

      const pages = generateUIPages(spec);
      const listPage = pages.find((p) => p.path === '/admin/todo');

      expect(listPage?.code).toContain('fetch(');
      expect(listPage?.code).toContain('/api/crud/todo');
    });

    it('生成的 list page 包含表格（Table component）', () => {
      const spec: JsonSpec = {
        name: 'todo',
        label: '待辦',
        models: [{ name: 'Todo', fields: [{ name: 'title', type: 'string' }] }],
      };

      const pages = generateUIPages(spec);
      const listPage = pages.find((p) => p.path === '/admin/todo');

      expect(listPage?.code).toContain('Table');
      expect(listPage?.code).toContain('TableHeader');
      expect(listPage?.code).toContain('TableBody');
      expect(listPage?.code).toContain('TableRow');
    });

    it('只列出 listable 欄位', () => {
      const spec: JsonSpec = {
        name: 'todo',
        label: '待辦',
        models: [
          {
            name: 'Todo',
            fields: [
              { name: 'title', type: 'string', ui: { listable: true } },
              { name: 'description', type: 'text', ui: { listable: false } },
              { name: 'internalNote', type: 'text', ui: { hidden: true } },
            ],
          },
        ],
      };

      const pages = generateUIPages(spec);
      const listPage = pages.find((p) => p.path === '/admin/todo');

      expect(listPage?.code).toContain('title');
      expect(listPage?.code).not.toMatch(/item\.description/);
      expect(listPage?.code).not.toMatch(/item\.internalNote/);
    });

    it('生成新增按鈕指向 /new', () => {
      const spec: JsonSpec = {
        name: 'todo',
        label: '待辦',
        models: [{ name: 'Todo', fields: [{ name: 'title', type: 'string' }] }],
      };

      const pages = generateUIPages(spec);
      const listPage = pages.find((p) => p.path === '/admin/todo');

      expect(listPage?.code).toContain('/admin/todo/new');
      expect(listPage?.code).toContain('Button');
    });

    it('生成刪除按鈕（每行）', () => {
      const spec: JsonSpec = {
        name: 'todo',
        label: '待辦',
        models: [{ name: 'Todo', fields: [{ name: 'title', type: 'string' }] }],
      };

      const pages = generateUIPages(spec);
      const listPage = pages.find((p) => p.path === '/admin/todo');

      expect(listPage?.code).toContain('DELETE');
      expect(listPage?.code).toContain('handleDelete');
    });

    it('有 searchable 欄位時生成搜尋框', () => {
      const spec: JsonSpec = {
        name: 'todo',
        label: '待辦',
        models: [
          {
            name: 'Todo',
            fields: [
              { name: 'title', type: 'string', ui: { searchable: true } },
            ],
          },
        ],
      };

      const pages = generateUIPages(spec);
      const listPage = pages.find((p) => p.path === '/admin/todo');

      expect(listPage?.code).toContain('Input');
      expect(listPage?.code).toContain('search');
    });
  });

  describe('Form Page（new / edit）', () => {
    it('new page 包含表單 + 提交邏輯', () => {
      const spec: JsonSpec = {
        name: 'todo',
        label: '待辦',
        models: [{ name: 'Todo', fields: [{ name: 'title', type: 'string' }] }],
      };

      const pages = generateUIPages(spec);
      const newPage = pages.find((p) => p.path === '/admin/todo/new');

      expect(newPage?.code).toContain('POST');
      expect(newPage?.code).toContain('/api/crud/todo');
      expect(newPage?.code).toContain('Input');
      expect(newPage?.code).toContain('onSubmit');
    });

    it('edit page 包含 PUT 邏輯 + 載入現有資料', () => {
      const spec: JsonSpec = {
        name: 'todo',
        label: '待辦',
        models: [{ name: 'Todo', fields: [{ name: 'title', type: 'string' }] }],
      };

      const pages = generateUIPages(spec);
      const editPage = pages.find((p) => p.path === '/admin/todo/[id]');

      expect(editPage?.code).toContain('PUT');
      expect(editPage?.code).toContain('/api/crud/todo/');
    });

    it('boolean 欄位生成 Switch component', () => {
      const spec: JsonSpec = {
        name: 'todo',
        label: '待辦',
        models: [
          {
            name: 'Todo',
            fields: [
              { name: 'title', type: 'string' },
              { name: 'completed', type: 'boolean' },
            ],
          },
        ],
      };

      const pages = generateUIPages(spec);
      const newPage = pages.find((p) => p.path === '/admin/todo/new');

      expect(newPage?.code).toContain('Switch');
      expect(newPage?.code).toContain('completed');
    });

    it('enum 欄位生成 Select component', () => {
      const spec: JsonSpec = {
        name: 'todo',
        label: '待辦',
        models: [
          {
            name: 'Todo',
            fields: [
              {
                name: 'status',
                type: 'enum',
                validation: { enum: ['pending', 'done'] },
              },
            ],
          },
        ],
      };

      const pages = generateUIPages(spec);
      const newPage = pages.find((p) => p.path === '/admin/todo/new');

      expect(newPage?.code).toContain('Select');
      expect(newPage?.code).toContain('pending');
      expect(newPage?.code).toContain('done');
    });

    it('number 欄位生成 Input type="number"', () => {
      const spec: JsonSpec = {
        name: 'todo',
        label: '待辦',
        models: [
          {
            name: 'Todo',
            fields: [{ name: 'priority', type: 'integer' }],
          },
        ],
      };

      const pages = generateUIPages(spec);
      const newPage = pages.find((p) => p.path === '/admin/todo/new');

      expect(newPage?.code).toContain('number');
      expect(newPage?.code).toContain('priority');
    });

    it('date 欄位生成 Input type="date"', () => {
      const spec: JsonSpec = {
        name: 'todo',
        label: '待辦',
        models: [
          {
            name: 'Todo',
            fields: [{ name: 'dueDate', type: 'date' }],
          },
        ],
      };

      const pages = generateUIPages(spec);
      const newPage = pages.find((p) => p.path === '/admin/todo/new');

      expect(newPage?.code).toContain('date');
      expect(newPage?.code).toContain('dueDate');
    });

    it('text 欄位生成 Textarea', () => {
      const spec: JsonSpec = {
        name: 'todo',
        label: '待辦',
        models: [
          {
            name: 'Todo',
            fields: [{ name: 'description', type: 'text' }],
          },
        ],
      };

      const pages = generateUIPages(spec);
      const newPage = pages.find((p) => p.path === '/admin/todo/new');

      expect(newPage?.code).toContain('Textarea');
      expect(newPage?.code).toContain('description');
    });
  });

  describe('Action 按鈕', () => {
    it('生成的 list page 包含 model 的 action 按鈕', () => {
      const spec: JsonSpec = {
        name: 'order',
        label: 'Order',
        models: [
          {
            name: 'Order',
            fields: [{ name: 'total', type: 'number' }],
            actions: [
              {
                name: 'markPaid',
                label: '標記為已付款',
                implementation: '{{fn:markOrderAsPaid}}',
              },
            ],
          },
        ],
      };

      const pages = generateUIPages(spec);
      const listPage = pages.find((p) => p.path === '/admin/order');

      expect(listPage?.code).toContain('markPaid');
      expect(listPage?.code).toContain('標記為已付款');
    });
  });

  describe('Special Field UI', () => {
    it('richText 欄位使用 Tiptap editor（placeholder）', () => {
      const spec: JsonSpec = {
        name: 'blog',
        label: 'Blog',
        models: [
          {
            name: 'Post',
            fields: [{ name: 'content', type: 'richText' }],
          },
        ],
      };

      const pages = generateUIPages(spec);
      const newPage = pages.find((p) => p.path === '/admin/post/new');

      expect(newPage?.code).toMatch(/Tiptap|RichText|rich/i);
    });

    it('relation 欄位生成 Select 從 API 載入', () => {
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
          { name: 'Category', fields: [{ name: 'name', type: 'string' }] },
        ],
      };

      const pages = generateUIPages(spec);
      const newPage = pages.find((p) => p.path === '/admin/post/new');

      expect(newPage?.code).toContain('categoryId');
      expect(newPage?.code).toMatch(/Category|categories/);
    });
  });

  describe('Server Component vs Client Component', () => {
    it('list page 是 Client Component（需要 hooks）', () => {
      const spec: JsonSpec = {
        name: 'todo',
        label: '待辦',
        models: [{ name: 'Todo', fields: [{ name: 'title', type: 'string' }] }],
      };

      const pages = generateUIPages(spec);
      const listPage = pages.find((p) => p.path === '/admin/todo');

      expect(listPage?.code).toContain("'use client'");
    });

    it('form page 是 Client Component', () => {
      const spec: JsonSpec = {
        name: 'todo',
        label: '待辦',
        models: [{ name: 'Todo', fields: [{ name: 'title', type: 'string' }] }],
      };

      const pages = generateUIPages(spec);
      const newPage = pages.find((p) => p.path === '/admin/todo/new');

      expect(newPage?.code).toContain("'use client'");
    });
  });

  describe('shadcn UI 組件 import', () => {
    it('生成的代碼 import 必要的 UI 组件', () => {
      const spec: JsonSpec = {
        name: 'todo',
        label: '待辦',
        models: [
          {
            name: 'Todo',
            fields: [
              { name: 'title', type: 'string', ui: { searchable: true } },
              { name: 'completed', type: 'boolean' },
            ],
          },
        ],
      };

      const pages = generateUIPages(spec);
      const listPage = pages.find((p) => p.path === '/admin/todo');

      expect(listPage?.code).toContain('@/components/ui/button');
      expect(listPage?.code).toContain('@/components/ui/table');
      expect(listPage?.code).toContain('@/components/ui/input');
      expect(listPage?.code).toContain('@/components/ui/switch');
    });
  });
});