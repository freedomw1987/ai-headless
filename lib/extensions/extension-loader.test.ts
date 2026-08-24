/**
 * TDD Gate 1 — Extension Loader 測試
 *
 * Extension Loader 負責：
 * - 從 extensions/<name>/schema.json 載入 Extension Manifest
 * - 註冊到 Registry（內存）
 * - 啟用/停用 lifecycle
 * - 暴露 API：list / get / enable / disable
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ExtensionLoader,
  ExtensionRegistry,
  parseExtensionManifest,
  validateExtensionManifest,
  type ExtensionManifest,
} from './extension-loader';

const validManifest: ExtensionManifest = {
  name: 'blog',
  version: '1.0.0',
  label: 'Blog Extension',
  description: '部落格相關功能（slug、閱讀時間、發布）',
  author: 'ai-headless',
  hooks: ['generateSlugFromTitle', 'calculateReadingTime'],
  actions: ['publishPost'],
  computed: ['readingTime'],
  workflows: ['postPublishing'],
  permissions: ['post.read', 'post.create', 'post.update'],
};

describe('parseExtensionManifest', () => {
  it('解析合法 manifest', () => {
    const parsed = parseExtensionManifest(JSON.stringify(validManifest));
    expect(parsed.name).toBe('blog');
    expect(parsed.version).toBe('1.0.0');
  });

  it('拒絕無效 JSON', () => {
    expect(() => parseExtensionManifest('not-json')).toThrow();
  });

  it('拒絕缺少必填欄位的 manifest', () => {
    const invalid = { version: '1.0.0' }; // 缺 name
    expect(() => parseExtensionManifest(JSON.stringify(invalid))).toThrow();
  });
});

describe('validateExtensionManifest', () => {
  it('合法 manifest 不報錯', () => {
    expect(() => validateExtensionManifest(validManifest)).not.toThrow();
  });

  it('name 必須是 kebab-case', () => {
    expect(() =>
      validateExtensionManifest({ ...validManifest, name: 'BlogExtension' }),
    ).toThrow(/kebab-case/);
  });

  it('version 必須是 semver', () => {
    expect(() =>
      validateExtensionManifest({ ...validManifest, version: 'not-semver' }),
    ).toThrow(/semver/);
  });

  it('hooks/actions/computed 必須是 array of string', () => {
    expect(() =>
      validateExtensionManifest({ ...validManifest, hooks: [1, 2] }),
    ).toThrow();
  });
});

describe('ExtensionRegistry', () => {
  let registry: ExtensionRegistry;

  beforeEach(() => {
    registry = new ExtensionRegistry();
  });

  it('register 將 Extension 加入 registry', () => {
    registry.register(validManifest);
    expect(registry.list()).toHaveLength(1);
  });

  it('getByName 取得已註冊的 Extension', () => {
    registry.register(validManifest);
    const ext = registry.getByName('blog');
    expect(ext?.name).toBe('blog');
  });

  it('不存在的 Extension 返回 undefined', () => {
    expect(registry.getByName('not-exist')).toBeUndefined();
  });

  it('重複註冊同名 Extension 拋出錯誤', () => {
    registry.register(validManifest);
    expect(() => registry.register(validManifest)).toThrow(/already registered/);
  });

  it('list 包含所有已註冊 extensions', () => {
    registry.register(validManifest);
    registry.register({ ...validManifest, name: 'auth', version: '0.1.0' });
    expect(registry.list()).toHaveLength(2);
  });

  it('unregister 移除 Extension', () => {
    registry.register(validManifest);
    registry.unregister('blog');
    expect(registry.list()).toHaveLength(0);
  });

  it('getHooks 返回所有 hook 名稱', () => {
    registry.register(validManifest);
    const hooks = registry.getHooks();
    expect(hooks).toContain('generateSlugFromTitle');
    expect(hooks).toContain('calculateReadingTime');
  });

  it('getActions 返回所有 action 名稱', () => {
    registry.register(validManifest);
    const actions = registry.getActions();
    expect(actions).toContain('publishPost');
  });
});

describe('ExtensionLoader', () => {
  let loader: ExtensionLoader;

  beforeEach(() => {
    loader = new ExtensionLoader();
  });

  it('載入單一 Extension（從 JSON string）', async () => {
    const ext = await loader.loadFromJson(JSON.stringify(validManifest));
    expect(ext.name).toBe('blog');
    expect(loader.registry.getByName('blog')).toBeDefined();
  });

  it('batch load 從多個 JSON 載入', async () => {
    const ext1 = JSON.stringify(validManifest);
    const ext2 = JSON.stringify({ ...validManifest, name: 'auth', version: '0.1.0' });

    await loader.loadBatch([ext1, ext2]);
    expect(loader.registry.list()).toHaveLength(2);
  });

  it('載入時自動驗證 manifest', async () => {
    const invalid = JSON.stringify({ name: 'Bad' }); // 缺 version
    await expect(loader.loadFromJson(invalid)).rejects.toThrow();
  });

  it('isLoaded 檢查 Extension 是否已載入', async () => {
    await loader.loadFromJson(JSON.stringify(validManifest));
    expect(loader.isLoaded('blog')).toBe(true);
    expect(loader.isLoaded('not-exist')).toBe(false);
  });
});