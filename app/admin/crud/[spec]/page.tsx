// Sprint 14 TECH-034 — Dynamic List Page（Server Component）
// Sprint 16 TECH-038a + 038b — list page 完整 Server Component + formatter + customRenderer
//
// 從 spec 動態組裝 admin 列表頁。
// URL: /admin/crud/<spec>
// 例如：
//   /admin/crud/todo   → todo 列表
//   /admin/crud/order  → order 列表
//
// 80% 標準 CRUD 走這條；20% 自定義 UI 仍可寫手寫 page。
//
// Sprint 16 架構改變：整個 list page 為 Server Component
// - server side fetch items via createDynamicHandlers
// - server side 套用 formatter（純函數）
// - server side 呼叫 customRenderer（React component，inline 渲染）
// - 沒有任何 client JS bundle（page 載入更快）

import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth/config';
import { hasPermission } from '@/lib/auth/rbac';
import { loadSpec, listAvailableSpecs } from '@/lib/runtime/spec-loader';
import { buildListUIConfig } from '@/lib/runtime/ui-config';
import { createDynamicHandlers } from '@/lib/runtime/dynamic-handler';
import { loadFormatters } from '@/lib/runtime/extension-loaders';
import { getRequiredExtension } from '@/lib/specs/extension-derive';
import { isExtensionEnabledByName } from '@/lib/extensions/extension-enabled';
import type { ListUIConfig } from '@/lib/runtime/ui-config';
import type { FormatterFn } from '@/lib/runtime/extension-loaders';

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

  // 5. Server side: 載入 UI config + formatters + customRenderers
  const uiConfig = buildListUIConfig(spec);
  const formatters = await loadFormatters(spec);

  // 6. Server side fetch items
  const handlers = createDynamicHandlers(spec);
  const listResult = await handlers.list({
    user: {
      id: session.user.id,
      role: session.user.role as 'admin' | 'editor' | 'viewer',
    },
  });
  const items = (listResult.data as { items?: unknown[] } | undefined)?.items ?? [];

  // 7. 預渲染每個 cell（formatter > 預設）
  const rows = items.map((raw) => {
    const item = raw as Record<string, unknown>;
    return {
      id: item.id as string,
      cells: uiConfig.fields.map((f) => renderCell(item, f, formatters)),
    };
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">{uiConfig.title}</h1>
        <Link
          href={`/admin/crud/${specName}/new`}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          新增
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="text-gray-500">尚無資料</div>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              {uiConfig.fields.map((f) => (
                <th key={f.name} className="border p-2 text-left text-sm font-medium">
                  {f.label}
                </th>
              ))}
              <th className="border p-2 text-left text-sm font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                {row.cells.map((cell, idx) => (
                  <td key={idx} className="border p-2">
                    {cell}
                  </td>
                ))}
                <td className="border p-2">
                  <Link
                    href={`/admin/crud/${specName}/${row.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    檢視
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ==============================================
// 渲染優先級（server side）：formatter > 預設
// customRenderer 是 React component，require() 不能解析 JSX
// 留待 Sprint 16 Stage 2（TECH-038a）以 client dynamic import 機制處理
// ==============================================
function renderCell(
  item: Record<string, unknown>,
  field: ListUIConfig['fields'][number],
  formatters: Record<string, FormatterFn>,
): React.ReactNode {
  // 1. formatter（field-level）— Sprint 16 TECH-038b：list page formatter 完整支援
  if (field.formatter) {
    const formatter = formatters[field.name];
    if (formatter) {
      return formatter(item[field.name], item);
    }
  }

  // 2. customRenderer — Sprint 16 Stage 2 才支援（Sprint 16 Stage 1 只完成 formatter）
  if (field.customRenderer) {
    return (
      <span
        className="text-xs text-gray-400 italic"
        title={`customRenderer "${field.customRenderer}" 尚未在 list page 套用（Sprint 16 Stage 2）`}
      >
        [{field.name}]
      </span>
    );
  }

  // 3. 預設
  return renderCellValue(item[field.name], field.inputType);
}

function renderCellValue(value: unknown, inputType: string): string {
  if (value === null || value === undefined) return '';
  switch (inputType) {
    case 'checkbox':
      return value ? '✓' : '';
    case 'date':
      return value ? new Date(value as string).toLocaleDateString('zh-TW') : '';
    default:
      return String(value);
  }
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