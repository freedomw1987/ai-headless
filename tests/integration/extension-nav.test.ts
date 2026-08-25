/**
 * Sprint 12 TECH-023 — Extension Nav Helper 單元測試
 *
 * 對應：lib/extensions/extension-nav.ts
 *
 * 守護：Sidebar 必須能從 manifest.nav 自動生 nav items，
 *      並根據 isEnabled 過濾 disabled 的 extension
 *
 * 涵蓋：
 * 1. 全啟用 → 4 個 nav items（按 order 排序）
 * 2. 部分 disabled → 只顯示 enabled 的
 * 3. 全 disabled → 空陣列
 * 4. 沒 nav 欄位的 manifest → 跳過
 * 5. order 未設 → 按 manifest 讀取順序
 * 6. order 重複 → 仍穩定排序
 */

import { describe, it, expect } from 'vitest';
import { getEnabledExtensionNavItems } from '@/lib/extensions/extension-nav';
import type { ExtensionManifestView } from '@/lib/extensions/extension-manager';

function makeManifest(
  name: string,
  overrides: Partial<ExtensionManifestView> = {},
): ExtensionManifestView {
  return {
    name,
    version: '1.0.0',
    label: `${name}管理`,
    permissions: [],
    hooks: [],
    actions: [],
    computed: [],
    workflows: [],
    dependencies: [],
    isEnabled: true,
    ...overrides,
  };
}

describe('getEnabledExtensionNavItems — 從 manifest 生 nav items', () => {
  it('全啟用 → 4 個 nav items，按 order 排序', () => {
    const manifests: ExtensionManifestView[] = [
      makeManifest('blog', { nav: { path: '/admin/crud/blog', label: '部落格', order: 40 }, isEnabled: true }),
      makeManifest('order', { nav: { path: '/admin/crud/order', label: '訂單', order: 30 }, isEnabled: true }),
      makeManifest('event', { nav: { path: '/admin/crud/event', label: '活動', order: 50 }, isEnabled: true }),
      makeManifest('todo', { nav: { path: '/admin/crud/todo', label: '待辦', order: 60 }, isEnabled: true }),
    ];

    const items = getEnabledExtensionNavItems(manifests);

    expect(items).toEqual([
      { href: '/admin/crud/order', label: '訂單', requiresExtension: 'order' },
      { href: '/admin/crud/blog', label: '部落格', requiresExtension: 'blog' },
      { href: '/admin/crud/event', label: '活動', requiresExtension: 'event' },
      { href: '/admin/crud/todo', label: '待辦', requiresExtension: 'todo' },
    ]);
  });

  it('部分 disabled → 只顯示 enabled 的', () => {
    const manifests: ExtensionManifestView[] = [
      makeManifest('blog', { nav: { path: '/admin/crud/blog', label: '部落格', order: 40 }, isEnabled: false }),
      makeManifest('order', { nav: { path: '/admin/crud/order', label: '訂單', order: 30 }, isEnabled: true }),
      makeManifest('event', { nav: { path: '/admin/crud/event', label: '活動', order: 50 }, isEnabled: true }),
    ];

    const items = getEnabledExtensionNavItems(manifests);

    expect(items).toHaveLength(2);
    expect(items.map((i) => i.requiresExtension)).toEqual(['order', 'event']);
  });

  it('全 disabled → 空陣列', () => {
    const manifests: ExtensionManifestView[] = [
      makeManifest('blog', { nav: { path: '/admin/crud/blog', label: '部落格', order: 40 }, isEnabled: false }),
      makeManifest('order', { nav: { path: '/admin/crud/order', label: '訂單', order: 30 }, isEnabled: false }),
    ];

    expect(getEnabledExtensionNavItems(manifests)).toEqual([]);
  });

  it('沒 nav 欄位的 manifest → 跳過', () => {
    const manifests: ExtensionManifestView[] = [
      makeManifest('blog', { nav: { path: '/admin/crud/blog', label: '部落格', order: 40 }, isEnabled: true }),
      makeManifest('order', { isEnabled: true }), // 沒有 nav
    ];

    const items = getEnabledExtensionNavItems(manifests);

    expect(items).toHaveLength(1);
    expect(items[0]!.requiresExtension).toBe('blog');
  });

  it('order 未設 → 按 manifest 陣列順序', () => {
    const manifests: ExtensionManifestView[] = [
      makeManifest('blog', { nav: { path: '/admin/crud/blog', label: '部落格' }, isEnabled: true }),
      makeManifest('order', { nav: { path: '/admin/crud/order', label: '訂單' }, isEnabled: true }),
    ];

    const items = getEnabledExtensionNavItems(manifests);

    expect(items.map((i) => i.requiresExtension)).toEqual(['blog', 'order']);
  });

  it('order 重複 → 仍穩定排序（不丟失）', () => {
    const manifests: ExtensionManifestView[] = [
      makeManifest('blog', { nav: { path: '/admin/crud/blog', label: '部落格', order: 30 }, isEnabled: true }),
      makeManifest('order', { nav: { path: '/admin/crud/order', label: '訂單', order: 30 }, isEnabled: true }),
      makeManifest('event', { nav: { path: '/admin/crud/event', label: '活動', order: 50 }, isEnabled: true }),
    ];

    const items = getEnabledExtensionNavItems(manifests);

    expect(items.map((i) => i.requiresExtension)).toEqual(['blog', 'order', 'event']);
  });
});