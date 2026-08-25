// Sprint 14 TECH-034 — Dynamic Detail Page
//
// 從 spec 動態組裝詳情頁 + workflow transition buttons。
// URL: /admin/crud/<spec>/<id>

import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth/config';
import { loadSpec } from '@/lib/runtime/spec-loader';
import { buildDetailUIConfig } from '@/lib/runtime/ui-config';
import { loadFormatters } from '@/lib/runtime/extension-loaders';
import { db } from '@/lib/db';
import { isExtensionEnabledByName } from '@/lib/extensions/extension-enabled';
import { getRequiredExtension } from '@/lib/specs/extension-derive';
import { DynamicDetailClient } from './dynamic-detail-client';

type PageProps = {
  params: Promise<{ spec: string; id: string }>;
};

export default async function DynamicCrudDetailPage({ params }: PageProps) {
  const { spec: specName, id } = await params;

  const session = await auth();
  if (!session?.user) {
    redirect(`/admin/login?callbackUrl=/admin/crud/${specName}/${id}`);
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

  const uiConfig = buildDetailUIConfig(spec);
  const formatters = await loadFormatters(spec);

  // Sprint 15 TECH-038：server side fetch item + 套用 formatter（避免把函數傳給 Client Component）
  let initialItem: Record<string, unknown> | null = null;
  let formattedValues: Record<string, string> = {};
  try {
    const model = spec.models[0];
    if (!model) throw new Error('No model in spec');
    const tableName = model.name.charAt(0).toLowerCase() + model.name.slice(1);
    const dbClient = db as unknown as Record<string, { findFirst: (args: unknown) => Promise<unknown> }>;
    const item = await dbClient[tableName]!.findFirst({
      where: model.softDelete ? { id, deletedAt: null } : { id },
    });
    if (item) {
      initialItem = item as Record<string, unknown>;
      // 套用 formatter 到每個有 formatter 的 field
      // Sprint 16 TECH-038：formatters map 的 key 是 fieldName（不是 fnName），
      // Sprint 15 Stage 3 這裡寫 formatters[field.formatter] 是 bug，剛好沒生效但 client fallback 補上
      for (const field of uiConfig.fields) {
        if (field.formatter) {
          const formatter = formatters[field.name];
          if (formatter) {
            formattedValues[field.name] = formatter(initialItem[field.name], initialItem);
          }
        }
      }
    }
  } catch (err) {
    // 拿不到 item 也不擋 detail page 顯示（client side 會重 fetch）
    console.warn('[detail page] failed to pre-fetch item:', err);
  }

  return (
    <DynamicDetailClient
      config={uiConfig}
      specName={specName}
      id={id}
      initialItem={initialItem}
      formattedValues={formattedValues}
    />
  );
}

export const dynamic = 'force-dynamic';