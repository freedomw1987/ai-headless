// Sprint 14 TECH-034 — Dynamic List Page
//
// 從 spec 動態組裝 admin 列表頁。
// URL: /admin/crud/<spec>
// 例如：
//   /admin/crud/todo   → todo 列表
//   /admin/crud/order  → order 列表
//
// 80% 標準 CRUD 走這條；20% 自定義 UI 仍可寫手寫 page。

import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth/config';
import { hasPermission } from '@/lib/auth/rbac';
import { loadSpec, listAvailableSpecs } from '@/lib/runtime/spec-loader';
import { buildListUIConfig } from '@/lib/runtime/ui-config';
import { getRequiredExtension } from '@/lib/specs/extension-derive';
import { isExtensionEnabledByName } from '@/lib/extensions/extension-enabled';
import { DynamicListClient } from './dynamic-list-client';

type PageProps = {
  params: Promise<{ spec: string }>;
};

export default async function DynamicCrudPage({ params }: PageProps) {
  const { spec: specName } = await params;

  // 1. Session check（admin 才進）
  const session = await auth();
  if (!session?.user) {
    redirect(`/admin/login?callbackUrl=/admin/crud/${specName}`);
  }

  // 2. Permission check
  if (!hasPermission(session.user.role, 'user.manage')) {
    // viewer 也擋（admin only）
    return <div className="p-6">權限不足</div>;
  }

  // 3. Load spec
  let spec;
  try {
    spec = await loadSpec(specName);
  } catch {
    notFound();
  }

  // 4. Disable guard — Sprint 15 TECH-040：從 spec.name 推導
  const extName = getRequiredExtension(spec);
  const enabled = await isExtensionEnabledByName(extName);
  if (!enabled) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold mb-2">Extension 已停用</h1>
        <p className="text-gray-600">
          Extension &ldquo;{extName}&rdquo; 目前未啟用，無法訪問此頁面。
        </p>
      </div>
    );
  }

  const uiConfig = buildListUIConfig(spec);

  return <DynamicListClient config={uiConfig} specName={specName} />;
}

// 為了 static analysis — 不實際 export，但讓 Next.js 知道這個 page 是 dynamic
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// 提供給 Sidebar 用的可用 specs 列表
export async function getEnabledCrudPages() {
  const allSpecs = await listAvailableSpecs();
  const enabledPages: { path: string; label: string; order: number }[] = [];

  for (const specName of allSpecs) {
    const spec = await loadSpec(specName);
    const extName = getRequiredExtension(spec);
    const enabled = await isExtensionEnabledByName(extName);
    if (!enabled) continue;
    enabledPages.push({
      path: `/admin/crud/${specName}`,
      label: spec.label ?? specName,
      order: 100,
    });
  }

  return enabledPages;
}