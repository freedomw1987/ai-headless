// Sprint 12 TECH-023 — Extension Sidebar Nav Helper
//
// 從 extensions/*/manifest.json 的 nav 欄位產生 Sidebar nav items。
//
// 用法：
//   const manifests = await listInstalledExtensions();
//   const navItems = getEnabledExtensionNavItems(manifests);
//   <AdminSidebar user={user} enabledExtensions={...} extensionNavItems={navItems} />
//
// 設計：
// - 只回傳 isEnabled 且有 nav 欄位的 manifest
// - 排序：先按 nav.order，未設的排最後；order 重複時按 manifest 順序穩定排序
// - 沒 nav 的 extension（如系統內部用）→ 自動跳過，不污染 sidebar

import type { ExtensionManifestView } from '@/lib/extensions/extension-manager';

export type ExtensionNavItem = {
  href: string;
  label: string;
  requiresExtension: string;
};

export function getEnabledExtensionNavItems(
  manifests: ExtensionManifestView[],
): ExtensionNavItem[] {
  return manifests
    .filter((m) => m.isEnabled && m.nav)
    .map((m, idx) => ({
      href: m.nav!.path,
      label: m.nav!.label,
      requiresExtension: m.name,
      _originalIndex: idx,
      _order: m.nav!.order ?? null,
    }))
    .sort((a, b) => {
      const aOrder = a._order;
      const bOrder = b._order;

      if (aOrder !== null && bOrder !== null) {
        if (aOrder !== bOrder) return aOrder - bOrder;
      } else if (aOrder !== null) {
        return -1;
      } else if (bOrder !== null) {
        return 1;
      }
      return a._originalIndex - b._originalIndex;
    })
    .map(({ href, label, requiresExtension }) => ({
      href,
      label,
      requiresExtension,
    }));
}