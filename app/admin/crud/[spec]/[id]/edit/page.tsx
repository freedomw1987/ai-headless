// Sprint 18 Stage 1 — Dynamic Edit Page
//
// 從 spec 動態組裝編輯頁（PUT /api/crud/<spec>?id=<id>）。
// URL: /admin/crud/<spec>/<id>/edit
//
// 設計：
// - Server Component：loadSpec + fetch record + 傳給 DynamicFormClient
// - DynamicFormClient (mode='edit') 套既有 initialData
// - 提交走 DynamicFormClient 內建的 PUT 邏輯（已實作在 Sprint 14）
// - record 不存在 → notFound()
// - extension disabled → 顯示「Extension 已停用」
// - 未登入 → redirect to /admin/login

import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth/config';
import { loadSpec } from '@/lib/runtime/spec-loader';
import { buildFormUIConfig } from '@/lib/runtime/ui-config';
import { isExtensionEnabledByName } from '@/lib/extensions/extension-enabled';
import { getRequiredExtension } from '@/lib/specs/extension-derive';
import { db } from '@/lib/db';
import { DynamicFormClient } from '../../dynamic-form-client';

type PageProps = {
  params: Promise<{ spec: string; id: string }>;
};

export default async function DynamicCrudEditPage({ params }: PageProps) {
  const { spec: specName, id } = await params;

  const session = await auth();
  if (!session?.user) {
    redirect(`/admin/login?callbackUrl=/admin/crud/${specName}/${id}/edit`);
  }

  let spec;
  try {
    spec = await loadSpec(specName);
  } catch {
    notFound();
  }

  // Sprint 15 TECH-040：從 spec.name 推導 extension name
  const extName = getRequiredExtension(spec);
  const enabled = await isExtensionEnabledByName(extName);
  if (!enabled) {
    return <div className="p-6">Extension 已停用</div>;
  }

  // Sprint 18 Stage 1：載入既有 record（PUT 需要 initialData）
  let initialData: Record<string, unknown> | null = null;
  try {
    const model = spec.models[0];
    if (!model) throw new Error('No model in spec');
    const tableName = model.name.charAt(0).toLowerCase() + model.name.slice(1);
    const dbClient = db as unknown as Record<string, { findFirst: (args: unknown) => Promise<unknown> }>;
    const item = await dbClient[tableName]!.findFirst({
      where: model.softDelete ? { id, deletedAt: null } : { id },
    });
    if (!item) {
      notFound();
    }
    initialData = item as Record<string, unknown>;
  } catch (err) {
    console.warn('[edit page] failed to load record:', err);
    notFound();
  }

  const uiConfig = buildFormUIConfig(spec);

  return (
    <DynamicFormClient
      config={uiConfig}
      specName={specName}
      mode="edit"
      initialData={initialData ?? {}}
    />
  );
}

export const dynamic = 'force-dynamic';