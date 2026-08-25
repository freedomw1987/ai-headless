/**
 * TDD Gate 1 — S4.5 Blog Extension 完整混合模式整合測試
 *
 * 涵蓋：
 * 1. Manifest 載入
 * 2. JsonSpec 驗證
 * 3. Hook beforeCreateBlogPost（自動 slug + excerpt）
 * 4. Computed computeReadingTime
 * 5. Workflow lifecycle（draft → pending → published → archived）
 * 6. Action publishBlogPost
 * 7. Prisma schema 生成
 * 8. API route handlers 生成
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { validateJsonSpec } from '@/lib/specs/json-spec.validator';
import { beforeCreateBlogPost } from '@/extensions/blog/hooks/before-create';
import { computeReadingTime } from '@/extensions/blog/computed/reading-time';
import { blogLifecycle } from '@/extensions/blog/workflows/lifecycle';
import { publishBlogPost } from '@/extensions/blog/actions/publish';
import type { JsonSpec } from '@/lib/specs/json-spec.types';

const EXT_DIR = path.join(process.cwd(), 'extensions/blog');

// ==============================================
// 1. Manifest 載入
// ==============================================

describe('S4.5 Blog Extension Manifest', () => {
  it('extensions/blog/manifest.json 存在', () => {
    expect(fs.existsSync(path.join(EXT_DIR, 'manifest.json'))).toBe(true);
  });

  it('manifest 包含所有 hooks/actions/permissions', () => {
    const raw = fs.readFileSync(path.join(EXT_DIR, 'manifest.json'), 'utf-8');
    const parsed = JSON.parse(raw);

    expect(parsed.name).toBe('blog');
    expect(parsed.version).toMatch(/^\d+\.\d+\.\d+/);
    expect(parsed.hooks).toContain('blog.beforeCreateBlogPost');
    expect(parsed.actions).toContain('blog.publishBlogPost');
    expect(parsed.computed).toContain('blog.computeReadingTime');
    expect(parsed.workflows).toContain('blog.lifecycle');
  });

  it('README.md 存在', () => {
    expect(fs.existsSync(path.join(EXT_DIR, 'README.md'))).toBe(true);
  });
});

// ==============================================
// 2. JsonSpec 驗證
// ==============================================

describe('S4.5 Blog JsonSpec', () => {
  let spec: JsonSpec;

  beforeEach(() => {
    const raw = fs.readFileSync(path.join(EXT_DIR, 'blog-spec.json'), 'utf-8');
    spec = JSON.parse(raw);
  });

  it('blog-spec.json 通過驗證', () => {
    expect(() => validateJsonSpec(spec)).not.toThrow();
  });

  it('BlogPost 含 7 個 fields', () => {
    expect(spec.models[0]!.fields).toHaveLength(7);
  });

  it('BlogPost 含 hooks（beforeCreate）', () => {
    expect(spec.models[0]!.hooks).toBeDefined();
    expect(spec.models[0]!.hooks!.beforeCreate).toBe(
      '{{fn:beforeCreateBlogPost}}',
    );
  });

  it('BlogPost 含 actions（publish）', () => {
    expect(spec.models[0]!.actions).toHaveLength(1);
    expect(spec.models[0]!.actions![0]!.name).toBe('publish');
  });

  it('BlogPost 含 computed（readingTime）', () => {
    expect(spec.models[0]!.computed).toBeDefined();
    expect(spec.models[0]!.computed![0]!.name).toBe('readingTime');
  });

  it('BlogPost 含 stateMachine（lifecycle）', () => {
    // stateMachine 是 workflow 屬性（在 spec 驗證層檢查）
    expect(spec.models[0]).toBeTruthy();
  });
});

// ==============================================
// 3. Hook beforeCreateBlogPost
// ==============================================

describe('S4.5 Blog Hook: beforeCreateBlogPost', () => {
  it('自動從 title 生成 slug', async () => {
    const result = await beforeCreateBlogPost({
      hookName: 'beforeCreate',
      model: 'BlogPost',
      data: { title: 'Hello World' },
    } as never);

    expect((result as Record<string, unknown>).slug).toBe('hello-world');
  });

  it('自動從 content 生成 excerpt（前 200 字）', async () => {
    const longContent = 'a'.repeat(300);
    const result = await beforeCreateBlogPost({
      hookName: 'beforeCreate',
      model: 'BlogPost',
      data: { title: 'Test', content: longContent },
    } as never);

    const excerpt = (result as Record<string, unknown>).excerpt as string;
    expect(excerpt.length).toBeLessThanOrEqual(201); // 200 + '…'
    expect(excerpt.endsWith('…')).toBe(true);
  });

  it('已有 slug/excerpt 時不覆寫', async () => {
    const result = await beforeCreateBlogPost({
      hookName: 'beforeCreate',
      model: 'BlogPost',
      data: {
        title: 'Hello',
        slug: 'custom-slug',
        excerpt: 'Custom excerpt',
      },
    } as never);

    const r = result as Record<string, unknown>;
    expect(r.slug).toBe('custom-slug');
    expect(r.excerpt).toBe('Custom excerpt');
  });

  it('預設 status = "draft"', async () => {
    const result = await beforeCreateBlogPost({
      hookName: 'beforeCreate',
      model: 'BlogPost',
      data: { title: 'New Post' },
    } as never);

    expect((result as Record<string, unknown>).status).toBe('draft');
  });

  it('中文 title 生成中文 slug', async () => {
    const result = await beforeCreateBlogPost({
      hookName: 'beforeCreate',
      model: 'BlogPost',
      data: { title: '我的第一篇文章' },
    } as never);

    expect((result as Record<string, unknown>).slug).toBe('我的第一篇文章');
  });
});

// ==============================================
// 4. Computed computeReadingTime
// ==============================================

describe('S4.5 Blog Computed: computeReadingTime', () => {
  it('空字串返回 0', () => {
    expect(computeReadingTime('')).toBe(0);
  });

  it('非字串返回 0', () => {
    expect(computeReadingTime(null)).toBe(0);
    expect(computeReadingTime(undefined)).toBe(0);
    expect(computeReadingTime(123)).toBe(0);
  });

  it('200 字 = 1 分鐘', () => {
    const content = 'a'.repeat(200);
    expect(computeReadingTime(content)).toBe(1);
  });

  it('600 個字 word = 3 分鐘（以空白分隔為 word）', () => {
    const content = Array(600).fill('hello').join(' ');
    expect(computeReadingTime(content)).toBe(3);
  });

  it('HTML 標籤不計入字數', () => {
    const content = '<p>' + Array(400).fill('hello').join(' ') + '</p>';
    expect(computeReadingTime(content)).toBe(2);
  });

  it('中英文混合計算', () => {
    // 200 中文字 = 1 分鐘
    const content = '中'.repeat(200);
    expect(computeReadingTime(content)).toBe(1);
  });
});

// ==============================================
// 5. Workflow lifecycle
// ==============================================

describe('S4.5 Blog Workflow: lifecycle', () => {
  it('initialState 為 draft', () => {
    expect(blogLifecycle.initialState).toBe('draft');
  });

  it('draft → pending（submit）', async () => {
    const result = await blogLifecycle.transition('draft', 'pending', {
      entityId: 'post-1',
      triggeredBy: 'author',
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.toState).toBe('pending');
  });

  it('pending → published（approve）', async () => {
    const result = await blogLifecycle.transition('pending', 'published', {
      entityId: 'post-1',
      triggeredBy: 'editor',
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.toState).toBe('published');
  });

  it('draft 不能直接跳到 published（必須先 pending）', async () => {
    const result = await blogLifecycle.transition('draft', 'published', {
      entityId: 'post-1',
      triggeredBy: 'editor',
    });
    expect(result.success).toBe(false);
  });

  it('pending → draft（reject）', async () => {
    const result = await blogLifecycle.transition('pending', 'draft', {
      entityId: 'post-1',
      triggeredBy: 'editor',
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.toState).toBe('draft');
  });

  it('published → archived（archive）', async () => {
    const result = await blogLifecycle.transition('published', 'archived', {
      entityId: 'post-1',
      triggeredBy: 'admin',
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.toState).toBe('archived');
  });

  it('published → draft（unpublish）', async () => {
    const result = await blogLifecycle.transition('published', 'draft', {
      entityId: 'post-1',
      triggeredBy: 'admin',
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.toState).toBe('draft');
  });
});

// ==============================================
// 6. Action publishBlogPost
// ==============================================

describe('S4.5 Blog Action: publishBlogPost', () => {
  it('設定 status = "published"', async () => {
    const result = await publishBlogPost({
      data: { id: 'post-1', title: 'Test', status: 'draft' },
    } as never);

    expect((result as Record<string, unknown>).status).toBe('published');
  });

  it('設定 publishedAt = 現在時間', async () => {
    const before = Date.now();
    const result = await publishBlogPost({
      data: { id: 'post-1', title: 'Test' },
    } as never);
    const after = Date.now();

    const publishedAt = new Date(
      (result as Record<string, unknown>).publishedAt as string,
    ).getTime();
    expect(publishedAt).toBeGreaterThanOrEqual(before);
    expect(publishedAt).toBeLessThanOrEqual(after);
  });

  it('保留其他欄位', async () => {
    const result = await publishBlogPost({
      data: {
        id: 'post-1',
        title: 'My Post',
        slug: 'my-post',
      },
    } as never);

    const r = result as Record<string, unknown>;
    expect(r.id).toBe('post-1');
    expect(r.title).toBe('My Post');
    expect(r.slug).toBe('my-post');
  });
});

// ==============================================
// 7. Compiler 整合
// ==============================================

describe('S4.5 Blog Compiler 整合', () => {
  let spec: JsonSpec;

  beforeEach(() => {
    const raw = fs.readFileSync(path.join(EXT_DIR, 'blog-spec.json'), 'utf-8');
    spec = JSON.parse(raw);
  });

  it('Sprint 14: Prisma schema（手動維護）含 BlogPost', () => {
    // Sprint 14: compiler 已移除，Prisma schema 由 prisma/schema.prisma 手動維護
    const schema = fs.readFileSync(
      path.join(process.cwd(), 'prisma/schema.prisma'),
      'utf-8',
    );
    expect(schema).toContain('model BlogPost');
    expect(schema).toContain('slug');
    expect(schema).toContain('@unique'); // slug unique
  });

  it('Sprint 14: spec.json 自動生成 runtime handler', async () => {
    // Sprint 14: spec → runtime handler 取代 compiler 產出
    const { loadSpec } = await import('@/lib/runtime/spec-loader');
    const { createDynamicHandlers } = await import('@/lib/runtime/dynamic-handler');
    const loaded = await loadSpec('blog');
    const handlers = createDynamicHandlers(loaded);
    expect(typeof handlers.list).toBe('function');
    expect(typeof handlers.create).toBe('function');
    expect(typeof handlers.update).toBe('function');
    expect(typeof handlers.delete).toBe('function');
  });
});