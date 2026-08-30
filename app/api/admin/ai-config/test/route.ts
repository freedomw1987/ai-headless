// Sprint 43 v2.0 (S43-D Commit D): AI Config 測試連線 API
//
// POST /api/admin/ai-config/test → 呼叫 testEndpoint 驗證 URL + API Key
// 認證: admin only

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { testEndpoint } from '@/lib/ai/providers/providers';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { type, endpointUrl, apiKey } = body;

  // 只允許 compatible type
  if (type !== 'openai-compatible' && type !== 'anthropic-compatible') {
    return NextResponse.json(
      { success: false, error: '僅 Custom URL 需測試連線' },
      { status: 400 },
    );
  }
  if (!endpointUrl || !apiKey) {
    return NextResponse.json(
      { success: false, error: 'endpointUrl 與 apiKey 必填' },
      { status: 400 },
    );
  }

  const result = await testEndpoint({
    type,
    endpointUrl,
    apiKey,
  });

  return NextResponse.json(result);
}