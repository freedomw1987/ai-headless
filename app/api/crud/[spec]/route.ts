// Sprint 14 TECH-033 — Dynamic CRUD Route
//
// 單一檔案處理所有 extension 的 CRUD + workflow transition。
// URL pattern:
//   GET    /api/crud/<spec>           → list
//   GET    /api/crud/<spec>?id=<id>   → get one
//   POST   /api/crud/<spec>           → create
//   PUT    /api/crud/<spec>?id=<id>   → update
//   DELETE /api/crud/<spec>?id=<id>   → delete
//   GET    /api/crud/<spec>?id=<id>&event=<event> → transition
//   POST   /api/crud/<spec>?id=<id>&event=<event> → transition (body 方式)
//
// 設計理由：
// - Next.js App Router 禁止 `[...catchAll]` 後再有靜態/dynamic segment
// - 所以 catch-all 用 single `[spec]`，id 用 query param
// - 80% 標準 CRUD 走這條；20% 自定義走 /api/<spec>/<action>

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { loadSpec } from '@/lib/runtime/spec-loader';
import { createDynamicHandlers } from '@/lib/runtime/dynamic-handler';
import { batchDeleteSpecItems } from '@/lib/runtime/batch-delete';
import { registerAllExtensions } from '@/lib/extensions/hooks-registry';

type RouteContext = { params: Promise<{ spec: string }> };

async function setup(request: NextRequest, ctx: RouteContext) {
  // Sprint 20 P3.5：注冊所有 Extension hooks（idempotent）
  // 保證 spec 內 {{fn:hookName}} 能在 runtime 找到對應函數
  registerAllExtensions();

  const { spec: specName } = await ctx.params;
  if (!specName) {
    return { error: NextResponse.json({ error: 'spec name 必填' }, { status: 400 }) };
  }

  let spec;
  try {
    spec = await loadSpec(specName);
  } catch {
    return { error: NextResponse.json({ error: `Spec "${specName}" not found` }, { status: 404 }) };
  }

  const session = await auth();
  const user = session?.user
    ? { id: session.user.id, role: (session.user as { role: string }).role }
    : undefined;

  return { spec, handlers: createDynamicHandlers(spec), user };
}

export async function GET(request: NextRequest, ctx: RouteContext) {
  const r = await setup(request, ctx);
  if ('error' in r) return r.error;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id') ?? undefined;
  const event = searchParams.get('event') ?? undefined;

  // Transition (event query)
  if (event) {
    if (!id) return NextResponse.json({ error: 'id 必填' }, { status: 400 });
    if (!r.handlers.transition) {
      return NextResponse.json(
        { error: `Spec "${r.spec.name}" 沒有 workflow` },
        { status: 400 },
      );
    }
    const result = await r.handlers.transition({
      user: r.user,
      params: { id },
      body: { event },
    });
    return NextResponse.json(result.data ?? { error: result.error }, { status: result.status });
  }

  // Single get
  if (id) {
    const result = await r.handlers.get({ user: r.user, params: { id } });
    return NextResponse.json(result.data ?? { error: result.error }, { status: result.status });
  }

  // List（Sprint 19 Stage 1: server side 分頁 + Sprint 19 Stage 3: sort + filter）
  const page = searchParams.get('page') ?? undefined;
  const pageSize = searchParams.get('pageSize') ?? undefined;
  const sort = searchParams.get('sort') ?? undefined;
  const order = searchParams.get('order') ?? undefined;
  const q = searchParams.get('q') ?? undefined;
  const result = await r.handlers.list({
    user: r.user,
    query: { page, pageSize, sort, order, q },
  });
  return NextResponse.json(result.data ?? { error: result.error }, { status: result.status });
}

export async function POST(request: NextRequest, ctx: RouteContext) {
  const r = await setup(request, ctx);
  if ('error' in r) return r.error;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id') ?? undefined;
  const event = searchParams.get('event') ?? undefined;
  const batch = searchParams.get('batch') === 'true';

  const body = await request.json().catch(() => ({}));

  // Sprint B3: Batch delete (?batch=true)
  if (batch) {
    if (!r.user) {
      return NextResponse.json({ error: '請先登入' }, { status: 401 });
    }
    const ids = (body as { ids?: unknown }).ids;
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids 必填且不可為空' }, { status: 400 });
    }
    // 確保 ids 都是字串
    const stringIds = ids.filter((id): id is string => typeof id === 'string');
    if (stringIds.length === 0) {
      return NextResponse.json({ error: 'ids 必須都是字串' }, { status: 400 });
    }
    const result = await batchDeleteSpecItems(r.handlers, { user: r.user }, stringIds);
    return NextResponse.json(result, { status: 200 });
  }

  // Transition via POST
  if (event) {
    if (!id) return NextResponse.json({ error: 'id 必填' }, { status: 400 });
    if (!r.handlers.transition) {
      return NextResponse.json(
        { error: `Spec "${r.spec.name}" 沒有 workflow` },
        { status: 400 },
      );
    }
    const result = await r.handlers.transition({
      user: r.user,
      params: { id },
      body: { event, ...(body as Record<string, unknown>) },
    });
    return NextResponse.json(result.data ?? { error: result.error }, { status: result.status });
  }

  const result = await r.handlers.create({ user: r.user, body });
  return NextResponse.json(result.data ?? { error: result.error }, { status: result.status });
}

export async function PUT(request: NextRequest, ctx: RouteContext) {
  const r = await setup(request, ctx);
  if ('error' in r) return r.error;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id 必填' }, { status: 400 });

  const body = await request.json().catch(() => ({}));
  const result = await r.handlers.update({
    user: r.user,
    params: { id },
    body,
  });
  return NextResponse.json(result.data ?? { error: result.error }, { status: result.status });
}

export async function DELETE(request: NextRequest, ctx: RouteContext) {
  const r = await setup(request, ctx);
  if ('error' in r) return r.error;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id 必填' }, { status: 400 });

  const result = await r.handlers.delete({ user: r.user, params: { id } });
  if (result.status === 204) return new NextResponse(null, { status: 204 });
  return NextResponse.json(result.data ?? { error: result.error }, { status: result.status });
}