'use client';

/**
 * US-102 + Sprint 56 P0-2 — 登入表單 Client Component
 * Sprint 56 新增：「忘記密碼」連結 + 「驗證成功」訊息
 */

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const verified = searchParams.get('verified') === '1';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });
      if (res?.error) {
        setError('Email 或密碼錯誤');
      } else {
        router.push('/admin');
        router.refresh();
      }
    });
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>登入</CardTitle>
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
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">密碼</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? '登入中…' : '登入'}
          </Button>
          <div className="text-xs text-center space-y-2">
            <Link
              href="/admin/register"
              className="text-muted-foreground hover:underline block"
            >
              建立新帳號
            </Link>
            <Link
              href="/admin/forgot-password"
              className="text-muted-foreground hover:underline block"
            >
              忘記密碼？
            </Link>
            {verified && (
              <p className="text-green-600">✓ Email 驗證成功，請登入</p>
            )}
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Demo 帳號：admin@ai-headless.local / admin123
          </p>
        </form>
      </CardContent>
    </Card>
  );
}