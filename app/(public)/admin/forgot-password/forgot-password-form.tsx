'use client';

/**
 * Forgot Password Form (Sprint 56 P0-2)
 *
 * UX：永遠顯示「已寄信」（即使 email 不存在），避免 user enumeration
 */

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
      } catch {
        // ignore — always show success
      }
      setSubmitted(true);
    });
  }

  if (submitted) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>已寄出重設信</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            如果 <strong>{email}</strong> 對應的帳號存在，你將在幾分鐘內收到重設密碼的 email。
          </p>
          <p className="text-sm text-muted-foreground">
            連結將在 1 小時後失效。
          </p>
          <Link
            href="/admin/login"
            className="text-sm text-muted-foreground hover:underline block text-center"
          >
            ← 返回登入
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>忘記密碼</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <p className="text-xs text-muted-foreground">
              輸入你的 email，我們會寄重設連結給你。
            </p>
          </div>
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? '寄信中…' : '寄出重設連結'}
          </Button>
          <Link
            href="/admin/login"
            className="text-xs text-muted-foreground hover:underline block text-center"
          >
            ← 返回登入
          </Link>
        </form>
      </CardContent>
    </Card>
  );
}
