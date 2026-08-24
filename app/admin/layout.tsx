/**
 * US-102 — Admin Layout (Server Component)
 * 包 sidebar + 內容區
 */

import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/auth';
import { AdminSidebar } from './admin-sidebar';
import { listEnabledExtensions } from '@/lib/extensions/extension-enabled';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/admin/login');
  }

  // 取得啟用的 extensions 名稱
  const enabledNames = await listEnabledExtensions();

  return (
    <div className="min-h-screen bg-muted/30 flex">
      <AdminSidebar user={user} enabledExtensions={enabledNames} />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}