'use client';

/**
 * Onboarding Wizard (Sprint 58 P0-7)
 *
 * 4 步驟：
 * 1. 完成 profile (name)
 * 2. 建立第一個 Extension
 * 3. 建立第一個 AI Config
 * 4. 試用 Chat
 *
 * 可隨時跳過 → 直接標記為完成
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type Step = 1 | 2 | 3 | 4;

const STEPS: { key: Step; title: string; description: string; href: string }[] = [
  {
    key: 1,
    title: '完善個人資料',
    description: '設定你的顯示名稱與頭像',
    href: '/admin/profile',
  },
  {
    key: 2,
    title: '建立第一個 Extension',
    description: '從模板開始，或從零設計',
    href: '/admin/extensions/new',
  },
  {
    key: 3,
    title: '設定 AI Provider',
    description: '選擇 OpenAI 或 Anthropic，設定 API key',
    href: '/admin/ai-configs',
  },
  {
    key: 4,
    title: '試用 AI Chat',
    description: '用自然語言探索你的資料',
    href: '/chat',
  },
];

export function OnboardingWizard({
  initialStep,
  userName,
}: {
  initialStep: number;
  userName: string | null;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(
    Math.max(1, Math.min(4, initialStep)) as Step,
  );
  const [, startTransition] = useTransition();

  function advance() {
    void fetch('/api/user/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step, action: 'advance' }),
    });
    if (step < 4) {
      setStep((step + 1) as Step);
    } else {
      // 完成
      void fetch('/api/user/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 4, action: 'complete' }),
      });
      startTransition(() => router.push('/admin'));
    }
  }

  function skip() {
    void fetch('/api/user/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step: 0, action: 'skip' }),
    });
    startTransition(() => router.push('/admin'));
  }

  const current = STEPS[step - 1]!;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="text-sm text-muted-foreground">
          步驟 {step} / 4
        </div>
        <CardTitle>
          {userName ? `${userName}，` : ''}歡迎使用 ai-headless
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">{current.title}</h2>
          <p className="text-sm text-muted-foreground">{current.description}</p>
        </div>

        <div className="flex flex-wrap gap-1">
          {STEPS.map((s) => (
            <div
              key={s.key}
              className={`h-2 flex-1 rounded ${
                s.key <= step ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        <div className="flex justify-between">
          <Button variant="ghost" onClick={skip}>
            跳過 onboarding
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <a href={current.href}>前往</a>
            </Button>
            <Button onClick={advance}>
              {step < 4 ? '下一步' : '完成'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}