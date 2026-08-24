/**
 * US-102 — 登入頁
 * 對應 PRD §2.1 FR-1.1
 */

import { LoginForm } from './login-form';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <LoginForm />
    </div>
  );
}