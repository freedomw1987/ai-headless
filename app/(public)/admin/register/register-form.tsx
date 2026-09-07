'use client';

/**
 * Register Form (Sprint 58 P0-7)
 *
 * 註冊新用戶：
 * - email / password / name
 * - 必須勾選 ToS + Privacy
 * - 成功 → 顯示「請查收驗證信」
 */

import { useState, useTransition, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiFetch, ensureCsrfToken } from '@/lib/api-client';

export function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [acceptTos, setAcceptTos] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Sprint 57: 確保 csrf cookie 存在（Sprint 58 register 需要）
  useEffect(() => {
    void ensureCsrfToken();
  }, []);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!acceptTos || !acceptPrivacy) {
      setError('請勾選同意條款');
      return;
    }

    startTransition(async () => {
      const res = await apiFetch('/api/auth/register', {
        method: 'POST',
        body: {
          email,
          password,
          name: name || undefined,
          acceptTos,
          acceptPrivacy,
        },
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? '註冊失敗');
      }
    });
  }

  if (submitted) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>請查收驗證信</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            我們已寄出驗證信到 <strong>{email}</strong>。
          </p>
          <p className="text-sm text-muted-foreground">
            點擊信中的連結以啟用帳號。連結將在 24 小時後失效。
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
        <CardTitle>建立帳號</CardTitle>
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
            <Label htmlFor="name">姓名（選填）</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
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
              minLength={8}
              autoComplete="new-password"
            />
            <p className="text-xs text-muted-foreground">至少 8 字元</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="tos"
                checked={acceptTos}
                onCheckedChange={(checked) => setAcceptTos(checked === true)}
              />
              <label htmlFor="tos" className="text-xs text-muted-foreground">
                我已閱讀並同意{' '}
                <Link href="/legal/terms" target="_blank" className="underline">
                  服務條款
                </Link>
              </label>
            </div>
            <div className="flex items-start space-x-2">
              <Checkbox
                id="privacy"
                checked={acceptPrivacy}
                onCheckedChange={(checked) => setAcceptPrivacy(checked === true)}
              />
              <label htmlFor="privacy" className="text-xs text-muted-foreground">
                我已閱讀並同意{' '}
                <Link href="/legal/privacy" target="_blank" className="underline">
                  隱私權政策
                </Link>
              </label>
            </div>
          </div>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? '建立中…' : '建立帳號'}
          </Button>
          <Link
            href="/admin/login"
            className="text-xs text-muted-foreground hover:underline block text-center"
          >
            已有帳號？登入
          </Link>
        </form>
      </CardContent>
    </Card>
  );
}
