/**
 * US-102 — 登入頁
 * 對應 PRD §2.1 FR-1.1
 * Sprint 56：包 Suspense 以支援 useSearchParams
 */

import { Suspense } from 'react';
import { LoginForm } from './login-form';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Suspense fallback={<div className="text-sm text-muted-foreground">Loading…</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
