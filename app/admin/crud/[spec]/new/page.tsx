// Sprint 14 TECH-034 — Dynamic New Page
//
// 從 spec 動態組裝新增頁。
// URL: /admin/crud/<spec>/new

import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth/config';
import { loadSpec } from '@/lib/runtime/spec-loader';
import { buildFormUIConfig } from '@/lib/runtime/ui-config';
import { isExtensionEnabledByName } from '@/lib/extensions/extension-enabled';
import { DynamicFormClient } from '../dynamic-form-client';

type PageProps = {
  params: Promise<{ spec: string }>;
};

export default async function DynamicCrudNewPage({ params }: PageProps) {
  const { spec: specName } = await params;

  const session = await auth();
  if (!session?.user) {
    redirect(`/admin/login?callbackUrl=/admin/crud/${specName}/new`);
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

  const uiConfig = buildFormUIConfig(spec);

  return (
    <DynamicFormClient
      config={uiConfig}
      specName={specName}
      mode="create"
    />
  );
}

export const dynamic = 'force-dynamic';