// Sprint 14 TECH-034 — Dynamic List Page（Server Component）
// Sprint 16 TECH-038a + 038b — list page 完整 Server Component + formatter + customRenderer
// Sprint 17 Stage 1.1 — list page UI 改進（用 shadcn/ui 元件）
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
// - 沒有任何 client JS bundle（page 載入更快）
//
// Sprint 17 UI 改進：
// - 改用 shadcn Table / Button / Badge / Card / Empty 元件
// - 標題區改 Card 包裝，表格加 hover 效果
// - 空狀態改 Empty 元件（含 icon + 說明）

import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Plus, ChevronRight, Inbox } from 'lucide-react';
import { auth } from '@/lib/auth/config';
import { hasPermission } from '@/lib/auth/rbac';
import { loadSpec, listAvailableSpecs } from '@/lib/runtime/spec-loader';
import { buildListUIConfig } from '@/lib/runtime/ui-config';
import { createDynamicHandlers } from '@/lib/runtime/dynamic-handler';
import { loadFormatters } from '@/lib/runtime/extension-loaders';
import { getRequiredExtension } from '@/lib/specs/extension-derive';
import { isExtensionEnabledByName } from '@/lib/extensions/extension-enabled';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from '@/components/ui/empty';
import type { ListUIConfig } from '@/lib/runtime/ui-config';
import type { FormatterFn } from '@/lib/runtime/extension-loaders';

type PageProps = {
  params: Promise<{ spec: string }>;
};

export default async function DynamicCrudPage({ params }: PageProps) {
  const { spec: specName } = await params;

  // 1. Session check
  const session = await auth();
  if (!session?.user) {
    redirect(`/admin/login?callbackUrl=/admin/crud/${specName}`);
  }

  // 2. Permission check
  if (!hasPermission(session.user.role, 'user.manage')) {
    return <div className="p-6">權限不足</div>;
  }

  // 3. Load spec
  let spec;
  try {
    spec = await loadSpec(specName);
  } catch {
    notFound();
  }

  // 4. Disable guard
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

  // 5. Server side: 載入 UI config + formatters
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

  // 7. 預渲染每個 cell
  const rows = items.map((raw) => {
    const item = raw as Record<string, unknown>;
    return {
      id: item.id as string,
      cells: uiConfig.fields.map((f) => renderCell(item, f, formatters)),
    };
  });

  return (
    <div className="space-y-6">
      {/* 頁面標題 + 操作區（h1 給 SEO/a11y） */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{uiConfig.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            共 {items.length} 筆資料
          </p>
        </div>
        <Button asChild>
          <Link href={`/admin/crud/${specName}/new`}>
            <Plus />
            新增
          </Link>
        </Button>
      </div>

      {/* 表格 / 空狀態 */}
      {items.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Inbox />
            </EmptyMedia>
            <EmptyTitle>尚無資料</EmptyTitle>
            <EmptyDescription>
              目前沒有任何{uiConfig.title}資料，點擊右上角「新增」建立第一筆
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild>
              <Link href={`/admin/crud/${specName}/new`}>
                <Plus />
                新增{uiConfig.title}
              </Link>
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                {uiConfig.fields.map((f) => (
                  <TableHead key={f.name}>{f.label}</TableHead>
                ))}
                <TableHead className="w-[100px] text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  {row.cells.map((cell, idx) => (
                    <TableCell key={idx}>{cell}</TableCell>
                  ))}
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/admin/crud/${specName}/${row.id}`}>
                        檢視
                        <ChevronRight />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

// ==============================================
// 渲染優先級（server side）：formatter > 預設
// customRenderer 留 Sprint 17 Stage 2 處理
// ==============================================
function renderCell(
  item: Record<string, unknown>,
  field: ListUIConfig['fields'][number],
  formatters: Record<string, FormatterFn>,
): React.ReactNode {
  // 1. formatter（field-level）
  if (field.formatter) {
    const formatter = formatters[field.name];
    if (formatter) {
      return formatter(item[field.name], item);
    }
  }

  // 2. customRenderer placeholder
  if (field.customRenderer) {
    return (
      <span
        className="text-xs text-muted-foreground italic"
        title={`customRenderer "${field.customRenderer}" 尚未在 list page 套用（Sprint 17 Stage 2）`}
      >
        [{field.name}]
      </span>
    );
  }

  // 3. 預設（含 status 自動用 Badge 渲染）
  const value = item[field.name];
  if (field.inputType === 'checkbox') {
    return value ? <Badge variant="default">✓</Badge> : null;
  }
  return renderCellValue(value, field.inputType);
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

// 為了 static analysis
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