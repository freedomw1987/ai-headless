'use client';

/**
 * Onboarding Banner (Sprint 58 P0-7)
 *
 * 顯示在 /admin 頂部：
 * - emailVerified === null → 「請驗證 email」
 * - onboardingStep < 99 → wizard 提示
 */

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function OnboardingBanner({
  emailVerified,
  onboardingStep,
}: {
  emailVerified: boolean | null;
  onboardingStep: number;
}) {
  if (!emailVerified) {
    return (
      <div className="border-b border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 px-4 py-3">
        <div className="container max-w-7xl flex items-center justify-between gap-4">
          <p className="text-sm text-amber-900 dark:text-amber-100">
            ⚠️ 請先驗證你的 email，才能使用完整功能。
          </p>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/login">重寄驗證信</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (onboardingStep < 99) {
    return (
      <div className="border-b border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/20 px-4 py-3">
        <div className="container max-w-7xl flex items-center justify-between gap-4">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            🎉 歡迎使用 ai-headless！完成 onboarding 快速上手。
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/onboarding">繼續</Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                void fetch('/api/user/onboarding', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ step: 0, action: 'skip' }),
                }).then(() => window.location.reload());
              }}
            >
              跳過
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}