// Sprint 29-3 — /admin/settings 頁面 (Server Component)
//
// 用戶的 profile / password 設定頁。

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/config';
import { SettingsForm } from './settings-form';

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/admin/login');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">設定</h1>
        <p className="text-sm text-muted-foreground">
          管理你的 profile 與密碼
        </p>
      </div>
      <SettingsForm
        user={{
          id: session.user.id,
          email: session.user.email ?? '',
          name: session.user.name ?? null,
          image: session.user.image ?? null,
          role: session.user.role,
          permissions: session.user.permissions,
        }}
      />
    </div>
  );
}