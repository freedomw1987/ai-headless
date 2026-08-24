/**
 * TDD Gate 1 — API Generator 測試
 *
 * API Generator 將 JsonSpec 轉換為 Next.js App Router 的 route handler 代碼
 */

import { describe, it, expect } from 'vitest';
import { generateRouteHandlers } from './api-generator';
import type { JsonSpec } from '@/lib/specs/json-spec.types';

describe('generateRouteHandlers', () => {
  describe('基本 CRUD 路由生成', () => {
    it('為每個 model 生成 5 個基本 endpoint（list/create/read/update/delete）', () => {
      const spec: JsonSpec = {
        name: 'todo',
        label: '待辦',
        models: [{ name: 'Todo', fields: [{ name: 'title', type: 'string' }] }],
      };

      const handlers = generateRouteHandlers(spec);

      // 應生成 5 條路由 + 1 條 list
      const operations = handlers.map((h) => `${h.method} ${h.path}`);

      expect(operations).toContain('GET /api/crud/todo');
      expect(operations).toContain('POST /api/crud/todo');
      expect(operations).toContain('GET /api/crud/todo/[id]');
      expect(operations).toContain('PATCH /api/crud/todo/[id]');
      expect(operations).toContain('DELETE /api/crud/todo/[id]');
    });

    it('生成的代碼包含 prisma 操作', () => {
      const spec: JsonSpec = {
        name: 'todo',
        label: '待辦',
        models: [{ name: 'Todo', fields: [{ name: 'title', type: 'string' }] }],
      };

      const handlers = generateRouteHandlers(spec);
      const listHandler = handlers.find(
        (h) => h.method === 'GET' && h.path === '/api/crud/todo',
      );

      expect(listHandler?.code).toContain('prisma.todo.findMany');
    });

    it('多 model 都生成對應路由', () => {
      const spec: JsonSpec = {
        name: 'blog',
        label: 'Blog',
        models: [
          { name: 'Post', fields: [{ name: 'title', type: 'string' }] },
          { name: 'Category', fields: [{ name: 'name', type: 'string' }] },
        ],
      };

      const handlers = generateRouteHandlers(spec);

      expect(handlers.some((h) => h.path.includes('/api/crud/post'))).toBe(true);
      expect(handlers.some((h) => h.path.includes('/api/crud/category'))).toBe(true);
    });
  });

  describe('RBAC 整合', () => {
    it('在每個 handler 開頭檢查 permission', () => {
      const spec: JsonSpec = {
        name: 'todo',
        label: '待辦',
        models: [{ name: 'Todo', fields: [{ name: 'title', type: 'string' }] }],
        permissions: [{ action: 'todo.create', roles: ['admin'] }],
      };

      const handlers = generateRouteHandlers(spec);
      const createHandler = handlers.find(
        (h) => h.method === 'POST' && h.path === '/api/crud/todo',
      );

      expect(createHandler?.code).toContain('checkPermission');
      expect(createHandler?.code).toContain("'todo.create'");
    });

    it('不同操作對應不同 permission', () => {
      const spec: JsonSpec = {
        name: 'todo',
        label: '待辦',
        models: [{ name: 'Todo', fields: [{ name: 'title', type: 'string' }] }],
        permissions: [
          { action: 'todo.read', roles: ['admin', 'viewer'] },
          { action: 'todo.create', roles: ['admin'] },
          { action: 'todo.update', roles: ['admin'] },
          { action: 'todo.delete', roles: ['admin'] },
        ],
      };

      const handlers = generateRouteHandlers(spec);
      const listHandler = handlers.find(
        (h) => h.method === 'GET' && h.path === '/api/crud/todo',
      );
      const deleteHandler = handlers.find(
        (h) => h.method === 'DELETE' && h.path === '/api/crud/todo/[id]',
      );

      expect(listHandler?.code).toContain("'todo.read'");
      expect(deleteHandler?.code).toContain("'todo.delete'");
    });
  });

  describe('Hook 自動調用', () => {
    it('create handler 自動呼叫 beforeCreate / afterCreate hook', () => {
      const spec: JsonSpec = {
        name: 'blog',
        label: 'Blog',
        models: [
          {
            name: 'Post',
            fields: [{ name: 'title', type: 'string' }],
            hooks: {
              beforeCreate: '{{fn:generateSlugFromTitle}}',
              afterCreate: '{{fn:onPostCreated}}',
            },
          },
        ],
      };

      const handlers = generateRouteHandlers(spec);
      const createHandler = handlers.find(
        (h) => h.method === 'POST' && h.path === '/api/crud/post',
      );

      expect(createHandler?.code).toContain('generateSlugFromTitle');
      expect(createHandler?.code).toContain('onPostCreated');
    });

    it('update handler 自動呼叫 beforeUpdate / afterUpdate hook', () => {
      const spec: JsonSpec = {
        name: 'blog',
        label: 'Blog',
        models: [
          {
            name: 'Post',
            fields: [{ name: 'title', type: 'string' }],
            hooks: {
              beforeUpdate: '{{fn:beforeUpdateHook}}',
              afterUpdate: '{{fn:afterUpdateHook}}',
            },
          },
        ],
      };

      const handlers = generateRouteHandlers(spec);
      const updateHandler = handlers.find(
        (h) => h.method === 'PATCH' && h.path === '/api/crud/post/[id]',
      );

      expect(updateHandler?.code).toContain('beforeUpdateHook');
      expect(updateHandler?.code).toContain('afterUpdateHook');
    });

    it('delete handler 自動呼叫 beforeDelete / afterDelete hook', () => {
      const spec: JsonSpec = {
        name: 'blog',
        label: 'Blog',
        models: [
          {
            name: 'Post',
            fields: [{ name: 'title', type: 'string' }],
            hooks: {
              beforeDelete: '{{fn:beforeDeleteHook}}',
            },
          },
        ],
      };

      const handlers = generateRouteHandlers(spec);
      const deleteHandler = handlers.find(
        (h) => h.method === 'DELETE' && h.path === '/api/crud/post/[id]',
      );

      expect(deleteHandler?.code).toContain('beforeDeleteHook');
    });
  });

  describe('Custom Actions', () => {
    it('為每個 action 生成獨立 endpoint', () => {
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
                requires: { permission: 'order.update' },
              },
            ],
          },
        ],
      };

      const handlers = generateRouteHandlers(spec);
      const actionHandler = handlers.find(
        (h) => h.method === 'POST' && h.path.includes('/actions/markPaid'),
      );

      expect(actionHandler).toBeDefined();
      expect(actionHandler?.code).toContain('markOrderAsPaid');
      expect(actionHandler?.code).toContain("'order.update'");
    });

    it('多個 action 各自有 endpoint', () => {
      const spec: JsonSpec = {
        name: 'order',
        label: 'Order',
        models: [
          {
            name: 'Order',
            fields: [{ name: 'total', type: 'number' }],
            actions: [
              { name: 'markPaid', label: '已付款', implementation: '{{fn:markPaid}}' },
              { name: 'cancel', label: '取消', implementation: '{{fn:cancel}}' },
              { name: 'refund', label: '退款', implementation: '{{fn:refund}}' },
            ],
          },
        ],
      };

      const handlers = generateRouteHandlers(spec);
      const actionPaths = handlers
        .filter((h) => h.path.includes('/actions/'))
        .map((h) => h.path);

      expect(actionPaths.some((p) => p.endsWith('/markPaid'))).toBe(true);
      expect(actionPaths.some((p) => p.endsWith('/cancel'))).toBe(true);
      expect(actionPaths.some((p) => p.endsWith('/refund'))).toBe(true);
    });
  });

  describe('特殊輸入', () => {
    it('list handler 支援分頁參數', () => {
      const spec: JsonSpec = {
        name: 'todo',
        label: '待辦',
        models: [{ name: 'Todo', fields: [{ name: 'title', type: 'string' }] }],
      };

      const handlers = generateRouteHandlers(spec);
      const listHandler = handlers.find(
        (h) => h.method === 'GET' && h.path === '/api/crud/todo',
      );

      expect(listHandler?.code).toContain('page');
      expect(listHandler?.code).toContain('pageSize');
      expect(listHandler?.code).toContain('skip');
      expect(listHandler?.code).toContain('take');
    });

    it('list handler 支援搜尋（searchable 欄位）', () => {
      const spec: JsonSpec = {
        name: 'todo',
        label: '待辦',
        models: [
          {
            name: 'Todo',
            fields: [
              { name: 'title', type: 'string', ui: { searchable: true } },
              { name: 'description', type: 'text', ui: { searchable: true } },
            ],
          },
        ],
      };

      const handlers = generateRouteHandlers(spec);
      const listHandler = handlers.find(
        (h) => h.method === 'GET' && h.path === '/api/crud/todo',
      );

      expect(listHandler?.code).toContain('search');
      expect(listHandler?.code).toContain('title');
      expect(listHandler?.code).toContain('description');
    });

    it('soft delete 的 model 在 read 時排除已刪除', () => {
      const spec: JsonSpec = {
        name: 'blog',
        label: 'Blog',
        models: [
          {
            name: 'Post',
            fields: [{ name: 'title', type: 'string' }],
            softDelete: true,
          },
        ],
      };

      const handlers = generateRouteHandlers(spec);
      const listHandler = handlers.find(
        (h) => h.method === 'GET' && h.path === '/api/crud/post',
      );

      expect(listHandler?.code).toContain('deletedAt: null');
    });

    it('soft delete 的 delete 改為 update（軟刪除）', () => {
      const spec: JsonSpec = {
        name: 'blog',
        label: 'Blog',
        models: [
          {
            name: 'Post',
            fields: [{ name: 'title', type: 'string' }],
            softDelete: true,
          },
        ],
      };

      const handlers = generateRouteHandlers(spec);
      const deleteHandler = handlers.find(
        (h) => h.method === 'DELETE' && h.path === '/api/crud/post/[id]',
      );

      expect(deleteHandler?.code).toContain('deletedAt');
      expect(deleteHandler?.code).not.toContain('.delete(');
    });
  });

  describe('Zod Validation', () => {
    it('create handler 包含 Zod 校驗', () => {
      const spec: JsonSpec = {
        name: 'todo',
        label: '待辦',
        models: [
          {
            name: 'Todo',
            fields: [
              { name: 'title', type: 'string', validation: { required: true } },
              { name: 'description', type: 'text' },
            ],
          },
        ],
      };

      const handlers = generateRouteHandlers(spec);
      const createHandler = handlers.find(
        (h) => h.method === 'POST' && h.path === '/api/crud/todo',
      );

      expect(createHandler?.code).toContain('z.object');
      expect(createHandler?.code).toContain('z.string()');
      expect(createHandler?.code).toContain('z.string().optional()');
    });
  });

  describe('返回的 metadata', () => {
    it('每個 handler 包含 path, method, code, model, operation', () => {
      const spec: JsonSpec = {
        name: 'todo',
        label: '待辦',
        models: [{ name: 'Todo', fields: [{ name: 'title', type: 'string' }] }],
      };

      const handlers = generateRouteHandlers(spec);
      const first = handlers[0]!;

      expect(first).toHaveProperty('path');
      expect(first).toHaveProperty('method');
      expect(first).toHaveProperty('code');
      expect(first).toHaveProperty('model');
      expect(first).toHaveProperty('operation');
    });
  });
});
