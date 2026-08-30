// Sprint 43 v2.0 (S43-D Commit D): AI Config 管理頁面
//
// 路徑: /admin/settings/ai-config
// 位置: 系統設定 section (跟 users/roles 同區, 由 admin-sidebar.tsx 配置)
//
// 功能:
// - 4-type Provider radio (openai / claude / openai-compatible / anthropic-compatible)
// - 當 type 為 compatible 時, 顯示 Custom URL 輸入
// - 「測試連線」按鈕 (呼叫 testEndpoint)
// - API Key 加密輸入 + model 輸入
//
// Global URL: userId=null, 所有 admin user 共用同一設定

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/config';
import { AIConfigForm } from './ai-config-form';

export default async function AIConfigPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/admin/login');
  }
  // 僅 admin 可進入
  if (session.user.role !== 'admin') {
    redirect('/admin');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AI 模型配置</h1>
        <p className="text-sm text-muted-foreground">
          設定全系統共用的 AI 模型 (Global URL)。支援 OpenAI、Claude、以及自訂 Custom URL（OpenRouter / Azure / Ollama / 自架 proxy）。
        </p>
      </div>
      <AIConfigForm />
    </div>
  );
}