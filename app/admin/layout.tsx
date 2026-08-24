/**
 * US-102 — Admin Layout (Server Component)
 * 包 sidebar + 內容區
 */

import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/auth';
import { AdminSidebar } from './admin-sidebar';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/admin/login');
  }

  return (
    <div className="min-h-screen bg-muted/30 flex">
      <AdminSidebar user={user} />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}