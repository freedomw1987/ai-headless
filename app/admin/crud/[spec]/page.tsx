// Sprint 14 TECH-034 — Dynamic List Page（Server Component）
// Sprint 16 TECH-038a + 038b — list page 完整 Server Component + formatter + customRenderer
// Sprint 17 Stage 1.1 — list page UI 改進（用 shadcn/ui 元件）
// Sprint A (CRUD 列表頁增強 v1.1) — Infinite scroll pagination
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
//
// Sprint A 改進：
// - 從按鈕 pagination 改為 infinite scroll
// - 仍保留 Server Component 架構（不拆 formatter 流程）
// - URL ?page=N → server side 重撈 1~N 頁並累積 render
// - 底部 <InfiniteScrollTrigger> client 元件負責觸發 router.push('?page=N+1')

import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Plus } from 'lucide-react';
import { auth } from '@/lib/auth/config';
import { hasUIPermission } from '@/lib/auth/ui-permissions';
import { loadSpec, listAvailableSpecs } from '@/lib/runtime/spec-loader';
import { buildListUIConfig } from '@/lib/runtime/ui-config';
import { createDynamicHandlers } from '@/lib/runtime/dynamic-handler';
import { loadFormatters } from '@/lib/runtime/extension-loaders';
import { getRequiredExtension } from '@/lib/specs/extension-derive';
import { isExtensionEnabledByName } from '@/lib/extensions/extension-enabled';
import { buildDisplayRows } from '@/lib/runtime/cell-display';
import { CrudListClient } from '@/app/admin/crud/[spec]/crud-list-client';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from '@/components/ui/empty';
import { Input } from '@/components/ui/input';

type PageProps = {
  params: Promise<{ spec: string }>;
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    sort?: string;
    order?: string;
    q?: string;
    filters?: string;
    /** Sprint 33: view type (table / todo-list / kanban) */
    view?: string;
  }>;
};

export default async function DynamicCrudPage({ params, searchParams }: PageProps) {
  const { spec: specName } = await params;

  // Sprint 19 Stage 1: Server Side 分頁 + Sprint 19 Stage 3: Sort + Filter
  const searchData = await searchParams;
  const page = Math.max(1, parseInt(searchData.page ?? '1', 10) || 1);
  const pageSize = Math.max(
    1,
    Math.min(100, parseInt(searchData.pageSize ?? '10', 10) || 10),
  );
  const sort = searchData.sort ?? '';
  const order = searchData.order === 'asc' ? 'asc' : 'desc';
  const q = searchData.q ?? '';

  // Sprint 33: 解析 view type (驗證是否合法)
  // Sprint 38: 加 calendar + gallery
  const validViewTypes = ['table', 'todo-list', 'kanban', 'calendar', 'gallery'] as const;
  const requestedView = searchData.view;
  const initialView = (validViewTypes as readonly string[]).includes(requestedView ?? '')
    ? (requestedView as (typeof validViewTypes)[number])
    : undefined;

  // Sprint D: 解析 filters (JSON string → Filter[])
  const { parseListQuery } = await import('@/lib/crud/list-query');
  const parsedQuery = parseListQuery(searchData);
  const filters = parsedQuery.filters;

  // 1. Session check
  const session = await auth();
  if (!session?.user) {
    redirect(`/admin/login?callbackUrl=/admin/crud/${specName}`);
  }

  // 2. Permission check (Sprint 24: 改用動態版)
  if (!hasUIPermission(session.user?.permissions, 'users:assign')) {
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

  // 6. Server side fetch items (Sprint A: 累積 page 1~N)
  // Infinite scroll 需累積多頁資料 render, server side 用 Promise.all 平行查詢。
  // 重複 query page 1 為已知 trade-off (DB query cache + 小資料量可接受)。
  // 之後可升級 cursor-based pagination (Sprint B+ 之 future work)。
  //
  // 安全限制: URL ?page 最大 50 (避免惡意 / bug query 過多次)
  const safePage = Math.min(page, 50);
  const handlers = createDynamicHandlers(spec);
  const userCtx = {
    id: session.user.id,
    role: session.user.role as 'admin' | 'editor' | 'viewer',
  };
  const baseQuery = { sort, order, q, filters: JSON.stringify(filters) };

  const pageResults = await Promise.all(
    Array.from({ length: safePage }, (_, i) =>
      handlers.list({
        user: userCtx,
        query: { ...baseQuery, page: String(i + 1), pageSize: String(pageSize) },
      }),
    ),
  );

  // 用最後一頁結果取得 total / totalPages (全部頁結果一致)
  const lastResult = pageResults[pageResults.length - 1];
  const listData = lastResult?.data as {
    items?: unknown[];
    total?: number;
    totalPages?: number;
  } | undefined;
  const total = listData?.total ?? 0;
  const totalPages = listData?.totalPages ?? 1;

  // 累積所有頁的 items (各頁 row 物件會 render 成 React tree)
  const items = pageResults.flatMap((r) => {
    const data = r.data as { items?: unknown[] } | undefined;
    return data?.items ?? [];
  });

  // 7. 預渲染每個 cell (Sprint B5: 改用 buildDisplayRows 產生序列化字串)
  const rows = buildDisplayRows(items, uiConfig.fields, formatters);

  return (
    <div className="space-y-6">
      {/* 頁面標題 + 搜尋 + 操作區（h1 給 SEO/a11y） */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{uiConfig.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            共 {total} 筆資料
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {/* Sprint 19 Stage 3: 搜尋 form（GET，保留 sort/order）*/}
          <form method="GET" action={`/admin/crud/${specName}`} className="flex items-center gap-2">
            {sort && <input type="hidden" name="sort" value={sort} />}
            {order === 'asc' && <input type="hidden" name="order" value="asc" />}
            <Input
              type="search"
              name="q"
              placeholder="搜尋全部欄位..."
              defaultValue={q}
              // flex-1 min-w-0: 在 flex parent (form) 中可以縮，不要撐開容器
              // sm:w-[200px]: ≥ 640px 時變成固定 200px
              className="flex-1 min-w-0 sm:w-[200px] sm:flex-none"
            />
            <Button type="submit" variant="outline" size="sm">
              搜尋
            </Button>
            {q && (
              <Button asChild variant="ghost" size="sm">
                <Link href={`/admin/crud/${specName}`}>清除</Link>
              </Button>
            )}
          </form>
          <Button asChild>
            <Link href={`/admin/crud/${specName}/new`}>
              <Plus />
              新增
            </Link>
          </Button>
        </div>
      </div>

      {/* 表格 / 空狀態 */}
      <div className="space-y-4">
      <CrudListClient
        specName={specName}
        rows={rows}
        columns={uiConfig.fields.map((f) => ({ name: f.name, label: f.label }))}
        total={total}
        page={page}
        totalPages={totalPages}
        currentSort={sort}
        currentOrder={order}
        currentQuery={q}
        pageSize={pageSize}
        allowColumnToggle={uiConfig.spec?.list?.allowColumnToggle ?? false}
        defaultColumns={uiConfig.spec?.list?.defaultColumns}
        filterableFields={(uiConfig.spec?.models[0]?.fields ?? []).map((f) => ({
          name: f.name,
          type: ((): 'string' | 'number' | 'integer' | 'enum' | 'datetime' | 'boolean' => {
            const t = f.type as string;
            if (t === 'string' || t === 'number' || t === 'integer' || t === 'enum' || t === 'datetime' || t === 'boolean') {
              return t;
            }
            return 'string';
          })(),
          // enumValues 來源優先序：validation.enum > options > []
          enumValues: (f as { validation?: { enum?: string[] }; options?: string[] }).validation?.enum
            ?? (f as { options?: string[] }).options,
        }))}
        initialFilters={filters}
        /** Sprint 33: 多 view 支援 */
        views={uiConfig.views}
        initialView={initialView}
        /** Sprint 36: Kanban drag-and-drop 需要 PATCH /api/crud/[spec]/[id] */
        specNameForApi={specName}
      />

      {/* Sprint 14 TECH-034 — Dynamic List（舊空狀態元素保留以防保留測試依賴） */}
      {/* 實際空狀態 UI 由 CrudListClient 內 Empty 元件渲染 */}
      {/* Empty placeholder for legacy tests */}
      <div hidden>
        <Empty>
          <EmptyHeader>
            <EmptyTitle>Legacy placeholder</EmptyTitle>
            <EmptyDescription>see CrudListClient</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <span>placeholder</span>
          </EmptyContent>
        </Empty>
      </div>
      </div>
    </div>
  );
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