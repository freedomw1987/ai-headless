/**
 * TDD Gate 1 — 整合測試
 *
 * 端到端驗證：
 * 1. JsonSpec → 各個 Generator → 產物正確性
 * 2. 完整 Pipeline → 鏈接所有 stages
 * 3. 真實世界 spec 範例（blog）
 */

import { describe, it, expect } from 'vitest';
import { generatePrismaSchema } from '@/lib/compiler/schema-generator';
import { generateRouteHandlers } from '@/lib/compiler/api-generator';
import { generateUIPages } from '@/lib/compiler/ui-generator';
import { generateRBACConfig, generateCheckPermissionSource } from '@/lib/compiler/permission-generator';
import {
  createPipeline,
  runPipeline,
  createDefaultPipeline,
  type PipelineContext,
} from '@/lib/ai/pipeline/pipeline-runner';
import type { JsonSpec } from '@/lib/specs/json-spec.types';

// ==============================================
// 1. 真實世界 Spec 範例
// ==============================================

const blogSpec: JsonSpec = {
  name: 'blog',
  label: '部落格',
  models: [
    {
      name: 'Post',
      label: '文章',
      softDelete: true,
      relations: [{ type: 'belongsTo', model: 'Category' }],
      fields: [
        { name: 'title', type: 'string', label: '標題', validation: { required: true } },
        { name: 'content', type: 'text', label: '內容' },
        { name: 'published', type: 'boolean', label: '已發布', validation: { default: false } },
        { name: 'viewCount', type: 'integer', label: '瀏覽次數', validation: { default: 0 } },
      ],
    },
    {
      name: 'Category',
      label: '分類',
      fields: [{ name: 'name', type: 'string', label: '名稱', validation: { required: true, unique: true } }],
    },
  ],
};

// ==============================================
// 2. Schema Generator 整合
// ==============================================

describe('Integration: Schema Generator', () => {
  it('生成完整 Prisma schema 含所有 model', () => {
    const result = generatePrismaSchema(blogSpec);

    expect(result).toContain('model Post');
    expect(result).toContain('model Category');
    expect(result).toContain('title');
    expect(result).toContain('content');
    expect(result).toContain('published');
    expect(result).toContain('viewCount');
  });

  it('處理 belongsTo relation 並生成 categoryId', () => {
    const result = generatePrismaSchema(blogSpec);

    expect(result).toContain('categoryId');
    expect(result).toContain('category  Category?');
  });

  it('unique 欄位加上 @unique', () => {
    const result = generatePrismaSchema(blogSpec);

    expect(result).toMatch(/name.*@unique/);
  });

  it('自動加 id/createdAt/updatedAt/deletedAt', () => {
    const result = generatePrismaSchema(blogSpec);

    expect(result).toContain('id');
    expect(result).toContain('createdAt');
    expect(result).toContain('updatedAt');
    expect(result).toContain('deletedAt');
  });
});

// ==============================================
// 3. API Generator 整合
// ==============================================

describe('Integration: API Generator', () => {
  it('為 Post 生成 5 CRUD endpoints', () => {
    const routes = generateRouteHandlers(blogSpec);

    const postRoutes = routes.filter((r) => r.model === 'Post');
    expect(postRoutes.length).toBeGreaterThanOrEqual(5);
    expect(postRoutes.find((r) => r.operation === 'list')).toBeDefined();
    expect(postRoutes.find((r) => r.operation === 'create')).toBeDefined();
    expect(postRoutes.find((r) => r.operation === 'update')).toBeDefined();
    expect(postRoutes.find((r) => r.operation === 'delete')).toBeDefined();
    expect(postRoutes.find((r) => r.operation === 'read')).toBeDefined();
  });

  it('為 Category 生成 5 CRUD endpoints', () => {
    const routes = generateRouteHandlers(blogSpec);

    const categoryRoutes = routes.filter((r) => r.model === 'Category');
    expect(categoryRoutes.length).toBeGreaterThanOrEqual(5);
  });

  it('每個 endpoint 代碼包含 RBAC 校驗', () => {
    const routes = generateRouteHandlers(blogSpec);

    const listRoute = routes.find((r) => r.model === 'Post' && r.operation === 'list');
    expect(listRoute?.code).toContain('auth()');
    expect(listRoute?.code).toContain('post.read');
  });

  it('路徑格式正確（不含 specName）', () => {
    const routes = generateRouteHandlers(blogSpec);

    expect(routes.find((r) => r.model === 'Post')?.path).toBe('/api/crud/post');
    expect(routes.find((r) => r.model === 'Post' && r.operation === 'read')?.path).toBe(
      '/api/crud/post/[id]',
    );
    expect(routes.find((r) => r.model === 'Post' && r.operation === 'list')?.method).toBe('GET');
    expect(routes.find((r) => r.model === 'Post' && r.operation === 'delete')?.method).toBe('DELETE');
  });
});

// ==============================================
// 4. UI Generator 整合
// ==============================================

describe('Integration: UI Generator', () => {
  it('為 Post 生成 3 個 pages', () => {
    const pages = generateUIPages(blogSpec);

    const postPages = pages.filter((p) => p.model === 'Post');
    expect(postPages.length).toBeGreaterThanOrEqual(3);
    expect(postPages.find((p) => p.kind === 'list')).toBeDefined();
    expect(postPages.find((p) => p.kind === 'create')).toBeDefined();
    expect(postPages.find((p) => p.kind === 'edit')).toBeDefined();
  });

  it('pages 都是 use client', () => {
    const pages = generateUIPages(blogSpec);

    pages.forEach((p) => {
      expect(p.code).toMatch(/['"]use client['"]/);
    });
  });

  it('Post 的 list page 顯示 title/published/viewCount', () => {
    const pages = generateUIPages(blogSpec);

    const postListPage = pages.find((p) => p.model === 'Post' && p.kind === 'list');
    expect(postListPage?.code).toContain('title');
    expect(postListPage?.code).toContain('published');
    expect(postListPage?.code).toContain('viewCount');
  });

  it('Post 的 form page 含 Create/Update 按鈕', () => {
    const pages = generateUIPages(blogSpec);

    const createPage = pages.find((p) => p.model === 'Post' && p.kind === 'create');
    expect(createPage?.code).toContain('建立');
    expect(createPage?.code).toContain('useRouter');
  });
});

// ==============================================
// 5. Permission Generator 整合
// ==============================================

describe('Integration: Permission Generator', () => {
  it('RBAC config 自動推導 read/create/update/delete', () => {
    const rbac = generateRBACConfig(blogSpec);

    expect(rbac.permissions.find((p) => p.action === 'post.read')).toBeDefined();
    expect(rbac.permissions.find((p) => p.action === 'post.create')).toBeDefined();
    expect(rbac.permissions.find((p) => p.action === 'post.update')).toBeDefined();
    expect(rbac.permissions.find((p) => p.action === 'post.delete')).toBeDefined();
  });

  it('預設角色：admin 萬能，editor 寫讀，viewer 唯讀', () => {
    const rbac = generateRBACConfig(blogSpec);

    const admin = rbac.roles.find((r) => r.name === 'admin');
    const editor = rbac.roles.find((r) => r.name === 'editor');
    const viewer = rbac.roles.find((r) => r.name === 'viewer');

    expect(admin).toBeDefined();
    expect(editor).toBeDefined();
    expect(viewer).toBeDefined();
    expect(admin?.permissions.length).toBeGreaterThan(0);
    expect(viewer?.permissions).toContain('post.read');
    expect(viewer?.permissions).not.toContain('post.delete');
  });

  it('生成可運行的 checkPermission source', () => {
    const source = generateCheckPermissionSource(blogSpec);

    expect(source).toContain('export');
    expect(source).toContain('RBAC_CONFIG');
    expect(source).toContain('admin');
    expect(source).toContain('post.read');
    expect(source).toMatch(/throw new Error/);
  });
});

// ==============================================
// 6. 完整 Pipeline 整合
// ==============================================

describe('Integration: Full Pipeline', () => {
  it('createDefaultPipeline 串接所有 stages 並完成', async () => {
    const ctxInit: PipelineContext = {
      userId: 'u-test',
      dryRun: false,
      state: {},
    };

    // Mock getSpec — 實際上由 AI 生成
    const pipeline = createDefaultPipeline(async () => blogSpec);
    const result = await runPipeline(pipeline, '建立一個 blog 系統', ctxInit);

    expect(result.error).toBeUndefined();
    expect(result.value).toBeDefined();
    // 至少應該有 prismaSchema + apiRoutes + uiPages + rbac + rbacSource
    const finalValue = result.value as Record<string, unknown>;
    expect(finalValue.spec).toBeDefined();
    expect(finalValue.prismaSchema).toContain('model Post');
    expect(finalValue.apiRoutes).toBeDefined();
    expect(finalValue.uiPages).toBeDefined();
    expect(finalValue.rbac).toBeDefined();
    expect(finalValue.rbacSource).toContain('RBAC_CONFIG');
  });

  it('pipeline.history 記錄所有 5 個 stages', async () => {
    const pipeline = createDefaultPipeline(async () => blogSpec);
    const result = await runPipeline(pipeline, '建立一個 blog 系統');

    expect(result.history.length).toBe(5);
    expect(result.history[0]?.stage).toBe('ai-spec');
    expect(result.history[1]?.stage).toBe('schema');
    expect(result.history[2]?.stage).toBe('api');
    expect(result.history[3]?.stage).toBe('ui');
    expect(result.history[4]?.stage).toBe('rbac');
  });

  it('任一 stage 失敗時 pipeline 中斷並回報錯誤', async () => {
    // 故意讓 schema stage 失敗
    const failingPipeline = createPipeline(
      {
        name: 'ok',
        run: async () => blogSpec,
      },
      {
        name: 'schema',
        run: async () => {
          throw new Error('Schema generation failed');
        },
      },
      {
        name: 'never-run',
        run: async () => {
          throw new Error('Should not reach here');
        },
      },
    );

    const result = await runPipeline(failingPipeline, 'test');

    expect(result.error).toBeDefined();
    expect(result.error?.message).toContain('Schema generation failed');
    expect(result.history.find((h) => h.stage === 'never-run')).toBeUndefined();
  });
});

// ==============================================
// 7. 完整 JsonSpec 編譯產物快照
// ==============================================

describe('Integration: Snapshot - Blog Spec → All Artifacts', () => {
  it('一次編譯得到所有產物且可使用', () => {
    const prismaSchema = generatePrismaSchema(blogSpec);
    const apiRoutes = generateRouteHandlers(blogSpec);
    const uiPages = generateUIPages(blogSpec);
    const rbac = generateRBACConfig(blogSpec);
    const rbacSource = generateCheckPermissionSource(blogSpec);

    // 5 個產物都應該非空
    expect(prismaSchema.length).toBeGreaterThan(100);
    expect(apiRoutes.length).toBeGreaterThan(0);
    expect(uiPages.length).toBeGreaterThan(0);
    expect(rbac.permissions.length).toBeGreaterThan(0);
    expect(rbacSource.length).toBeGreaterThan(100);

    // 交叉驗證：Post model 在每個產物中都有
    expect(prismaSchema).toContain('model Post');
    expect(apiRoutes.some((r) => r.model === 'Post')).toBe(true);
    expect(uiPages.some((p) => p.model === 'Post')).toBe(true);
    expect(rbac.permissions.some((p) => p.action.startsWith('post.'))).toBe(true);
  });
});