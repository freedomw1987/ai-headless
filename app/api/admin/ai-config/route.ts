// Sprint 43 v2.0 (S43-D Commit D): AI Config API
//
// GET /api/admin/ai-config → 讀 Global URL config
// PUT /api/admin/ai-config → 更新 Global URL config
//
// 認證: admin only
// 注意: Global URL (userId=null), 所有 user 共用

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { encrypt } from '@/lib/ai/providers/providers';

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const config = await db.aIConfig.findFirst({
    where: { userId: null },
    select: {
      type: true,
      provider: true,
      endpointUrl: true,
      model: true,
      // 不回傳 apiKeyEnc 明文
      updatedAt: true,
    },
  });

  if (!config) {
    return NextResponse.json({ config: null });
  }

  return NextResponse.json({ config });
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { type, endpointUrl: rawEndpointUrl, apiKey, model } = body;
  const endpointUrl: string | undefined =
    typeof rawEndpointUrl === 'string' && rawEndpointUrl.length > 0
      ? rawEndpointUrl
      : undefined;

  // 驗證 type (接受 dash 與 underscore 兩種格式)
  const validTypes = ['openai', 'claude', 'openai_compatible', 'anthropic_compatible'];
  const normalizedType = type?.replace?.(/-/g, '_') ?? type;
  if (!validTypes.includes(normalizedType)) {
    return NextResponse.json({ error: `Invalid type: ${type}` }, { status: 400 });
  }
  // 驗證 model
  if (!model || typeof model !== 'string') {
    return NextResponse.json({ error: 'model 必填' }, { status: 400 });
  }
  // 驗證 compatible type 必須有 endpointUrl
  if ((normalizedType === 'openai_compatible' || normalizedType === 'anthropic_compatible') && !endpointUrl) {
    return NextResponse.json({ error: 'Custom URL 必填' }, { status: 400 });
  }

  // 加密 API Key (S43-E 換真 AES)
  const apiKeyEnc = apiKey ? encrypt(apiKey) : undefined;

  // provider 欄位邏輯: openai / openai_compatible 都用 'openai' (ProviderConfig)
  const provider = normalizedType === 'claude' || normalizedType === 'anthropic_compatible' ? 'anthropic' : 'openai';

  // Find existing Global URL config (userId=null)
  const existing = await db.aIConfig.findFirst({
    where: { userId: null },
    select: { id: true },
  });

  const config = existing
    ? await db.aIConfig.update({
        where: { id: existing.id },
        data: {
          type: normalizedType,
          provider,
          ...(endpointUrl !== undefined ? { endpointUrl } : {}),
          ...(apiKeyEnc ? { apiKeyEnc } : {}),
          model,
        },
      })
    : await db.aIConfig.create({
        data: {
          userId: null,
          type: normalizedType,
          provider,
          endpointUrl: endpointUrl ?? null,
          apiKeyEnc: apiKeyEnc ?? null,
          model,
        },
      });

  return NextResponse.json({ success: true, id: config.id });
}