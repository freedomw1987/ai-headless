// Sprint 43 v2.0 (S43-D Commit D) + Bug Fix (Sprint 46)
// AI Config 管理頁面
//
// 路徑: /admin/settings/ai-config
//
// Bug Fix: 原 page.tsx 直接渲染 <AIConfigForm /> 沒傳 props,
//          導致 useState 預設 'openai', 使用者儲存後重新整理看到 OpenAI (UI Bug)
// 修復: page.tsx 改為 server component, 從 DB 讀 Global URL config
//        將 initialConfig 傳給 AIConfigForm 作為初始 state
//
// AIConfigForm 內部使用 4-type radio: openai / claude / openai-compatible / anthropic-compatible

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/config';
import { db } from '@/lib/db';
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

  // Bug Fix: 從 DB 讀 Global URL config 作為 initialConfig
  const existing = await db.aIConfig.findFirst({
    where: { userId: null },
    select: {
      type: true,
      endpointUrl: true,
      model: true,
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AI 模型配置</h1>
        <p className="text-sm text-muted-foreground">
          設定全系統共用的 AI 模型 (Global URL)。支援 OpenAI、Claude、以及自訂 Custom URL（OpenRouter / Azure / Ollama / 自架 proxy）。
        </p>
      </div>
      <AIConfigForm initialConfig={existing} />
    </div>
  );
}