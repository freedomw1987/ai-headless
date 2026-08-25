// Sprint 14 TECH-034 — Dynamic Detail Page
//
// 從 spec 動態組裝詳情頁 + workflow transition buttons。
// URL: /admin/crud/<spec>/<id>

import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth/config';
import { loadSpec } from '@/lib/runtime/spec-loader';
import { buildDetailUIConfig } from '@/lib/runtime/ui-config';
import { isExtensionEnabledByName } from '@/lib/extensions/extension-enabled';
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

  if (spec.requiresExtension) {
    const enabled = await isExtensionEnabledByName(spec.requiresExtension);
    if (!enabled) {
      return <div className="p-6">Extension 已停用</div>;
    }
  }

  const uiConfig = buildDetailUIConfig(spec);

  return (
    <DynamicDetailClient
      config={uiConfig}
      specName={specName}
      id={id}
    />
  );
}

export const dynamic = 'force-dynamic';