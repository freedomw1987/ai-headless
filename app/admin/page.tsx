/**
 * US-102 — /admin 總覽頁（登入後首頁）
 */

import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OnboardingBanner } from '@/components/admin/onboarding-banner';
import { db } from '@/lib/db';

export default async function AdminIndexPage() {
  const user = await getCurrentUser();

  // Sprint 58: 抓取 onboarding 狀態
  let onboardingStep = 99;
  let emailVerified: boolean | null = true;
  if (user?.id) {
    const u = await db.user.findUnique({
      where: { id: user.id },
      select: { onboardingStep: true, emailVerified: true },
    });
    if (u) {
      onboardingStep = u.onboardingStep;
      emailVerified = u.emailVerified !== null;
    }
  }

  return (
    <div className="space-y-6">
      <OnboardingBanner
        emailVerified={emailVerified}
        onboardingStep={onboardingStep}
      />
      <div>
        <h1 className="text-3xl font-bold">總覽</h1>
        <p className="text-muted-foreground">
          歡迎，{user?.name ?? user?.email}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/admin/users">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle>用戶管理</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                建立、編輯、停用帳號，分配角色
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/extensions">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle>Extensions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                管理已安裝的 Extension（啟用 / 停用）
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}