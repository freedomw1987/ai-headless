/**
 * US-102 — Admin Layout (Server Component)
 * 包 sidebar + 內容區
 *
 * Sprint 12 TECH-023：Sidebar nav items 改從 manifest.nav 自動生成
 */

import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/auth';
import { AdminSidebar } from './admin-sidebar';
import { listEnabledExtensions } from '@/lib/extensions/extension-enabled';
import { listInstalledExtensions } from '@/lib/extensions/extension-manager';
import { getEnabledExtensionNavItems } from '@/lib/extensions/extension-nav';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/admin/login');
  }

  // 啟用的 extensions 名稱（從 DB，符合 extension-enabled 設計）
  const enabledNames = await listEnabledExtensions();

  // 完整 manifest list（含 nav metadata）
  const allManifests = await listInstalledExtensions();

  // 從 manifest.nav 自動生 nav items
  const extensionNavItems = getEnabledExtensionNavItems(allManifests);

  return (
    <div className="min-h-screen bg-muted/30 flex">
      <AdminSidebar
        user={user}
        enabledExtensions={enabledNames}
        extensionNavItems={extensionNavItems}
      />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}