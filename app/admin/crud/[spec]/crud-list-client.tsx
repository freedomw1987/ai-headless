// Sprint D 修補 (CRUD 列表頁增強 v1.1) — CrudListClient (整合版)
//
// Client component 包 Toolbar + Table + BatchDeleteDialog + InfiniteScrollTrigger
// - selectedIds state
// - 打 batch delete API
// - Toast 通知
// - 刪除後清空 selectedIds + router.refresh()
// - 整合 Sprint A InfiniteScrollTrigger
// - Sprint D: 整合 AdvancedFilterDialog
//
// 設計重點:
// - cells 是 server-side 序列化字串 (透過 buildDisplayRows)，不含 React elements
// - 保留 sortable header (透過 CrudListTable.renderHeader prop)
//
// Gate 1 TDD: 見 tests/integration/crud-list-batch-toolbar.test.tsx

'use client';

import { useState, useTransition, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trash2, Filter, Inbox } from 'lucide-react';
import { toast } from 'sonner';
import { CrudListTable } from '@/app/admin/crud/[spec]/crud-list-table';
import { MobileListView } from '@/app/admin/crud/[spec]/mobile-list-view';
import { BatchDeleteDialog } from '@/app/admin/crud/[spec]/batch-delete-dialog';
import { InfiniteScrollTrigger } from '@/app/admin/crud/[spec]/infinite-scroll-trigger';
import { ColumnTogglePopover } from '@/app/admin/crud/[spec]/column-toggle-popover';
import { AdvancedFilterDialog } from '@/app/admin/crud/[spec]/advanced-filter-dialog';
// Sprint 33: ViewRouter + ViewSelector (多 view 架構)
import { ViewRouter } from '@/app/admin/crud/[spec]/list-views';
import { ViewSelector } from '@/app/admin/crud/[spec]/list-views/view-selector';
import type { View, ViewType } from '@/lib/specs/json-spec.types';
import { SortableHeaderCell } from '@/components/admin/sortable-header-cell';
import { ListRowActions } from '@/components/admin/list-row-actions';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { loadColumnPrefs } from '@/lib/crud/column-prefs';
import { serializeListQuery, type Filter as FilterRule, type FilterableField } from '@/lib/crud/list-query';
import type { CellDisplay } from '@/lib/runtime/cell-display';

type Row = {
  id: string;
  cells: CellDisplay[];
};

type Column = {
  name: string;
  label: string;
};

type Props = {
  specName: string;
  rows: Row[];
  columns: Column[];
  total: number;
  page: number;
  totalPages: number;
  currentSort: string;
  currentOrder: 'asc' | 'desc';
  currentQuery: string;
  pageSize: number;
  /** Sprint C: 是否允許切換欄位 */
  allowColumnToggle?: boolean;
  /** Sprint C: spec 預設可見欄位名稱 (fallback 當 user 無 localStorage 設定) */
  defaultColumns?: string[];
  /** Sprint D: 可篩選欄位 (含 type + enumValues) */
  filterableFields?: FilterableField[];
  /** Sprint D: 初始 filters (從 URL 解析) */
  initialFilters?: FilterRule[];
  /** Sprint 28: 是否允許批次刪除。false 時不渲染批次刪除 button + BatchDeleteDialog */
  allowBatchDelete?: boolean;
  /** Sprint 28: 自訂每 row 的操作按鈕。不傳時預設使用 ListRowActions */
  renderActions?: (rowId: string) => React.ReactNode;
  /** Sprint 33: 可用 view 清單（從 buildListUIConfig.views 傳入） */
  views?: View[];
  /** Sprint 33: 初始 view type (從 URL ?view= 解析) */
  initialView?: ViewType;
  /** Sprint 36: spec name (KanbanView drag-and-drop 需要呼叫 PATCH API) */
  specNameForApi?: string;
};

export function CrudListClient({
  specName,
  rows,
  columns,
  total,
  page,
  totalPages,
  currentSort,
  currentOrder,
  currentQuery,
  pageSize,
  allowColumnToggle = false,
  defaultColumns,
  filterableFields = [],
  initialFilters = [],
  allowBatchDelete = true,
  renderActions: customRenderActions,
  views = [{ type: 'table', label: '表格' }],
  initialView,
  specNameForApi,
}: Props) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  // Sprint 33: 當前 view (table / todo-list / kanban)
  // Sprint 37-2: 初始化優先序 — URL ?view= > localStorage > spec.views[0]
  // (URL 最高優先權 — 讓 user 可以用 bookmark / share link 指定 view)
  const [activeView, setActiveView] = useState<ViewType>(
    initialView ?? views[0]?.type ?? 'table',
  );
  const [isDeleting, startDeleteTransition] = useTransition();

  // Sprint 37-2: 從 localStorage 讀 user 偏好
  // - 優先序: URL ?view= (initialView) > localStorage > spec.views[0]
  // - 用 useEffect 避免 SSR hydration mismatch
  // - 如果 localStorage 的 view 在新 spec 中不存在 → 忽略 (fallback 預設)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    // URL 有指定 → 不用 localStorage (URL 優先)
    if (initialView) return;
    const key = `crud-view-pref:${specName}`;
    const raw = localStorage.getItem(key);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { activeView?: ViewType };
      const saved = parsed?.activeView;
      if (saved && views.some((v) => v.type === saved)) {
        setActiveView(saved);
      }
    } catch {
      // 無效 JSON 忽略
    }
    // views/setActiveView 不列 deps (避免 init 重跑)
  }, [specName]);

  // Sprint D: 篩選 state
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterRule[]>(initialFilters);

  // Sprint C: 可見欄位 Set
  // 重要：避免 SSR hydration mismatch，初始 state 跟 server 一致（讀 defaultColumns），client mount 後才讀 localStorage
  const allColumnNames = useMemo(() => columns.map((c) => c.name), [columns]);
  const initialVisible = useMemo(() => {
    // server + client initial 一致：讀 defaultColumns（不讀 localStorage）
    if (defaultColumns && defaultColumns.length > 0) {
      return new Set(defaultColumns.filter((n) => allColumnNames.includes(n)));
    }
    return new Set(allColumnNames);
  }, [allColumnNames, defaultColumns]);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(initialVisible);

  // client mount 後才讀 localStorage（避免 SSR/CSR mismatch）
  useEffect(() => {
    const stored = loadColumnPrefs(specName);
    if (stored !== null) {
      // 只保留仍存在的欄位名稱（避免擴充後舊 prefs 引用了已刪除的欄位）
      const filtered = stored.filter((n) => allColumnNames.includes(n));
      if (filtered.length > 0) {
        setVisibleColumns(new Set(filtered));
      }
    }
    // allColumnNames/setVisibleColumns 不列 deps (避免 init 重跑)
  }, [specName]);

  // Sprint 33: 切換 view 時更新 URL (?view=...)
  // 只在 activeView 不是預設 (table) 時加 query param
  function handleViewChange(viewType: ViewType) {
    setActiveView(viewType);
    // Sprint 37-2: 寫入 localStorage (user 偏好持久化)
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          `crud-view-pref:${specName}`,
          JSON.stringify({ activeView: viewType }),
        );
      } catch {
        // localStorage 不可用 (private mode / quota exceeded) — silently ignore
      }
    }
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (viewType === 'table') {
      url.searchParams.delete('view');
    } else {
      url.searchParams.set('view', viewType);
    }
    // 用 replace 不新增 history entry
    router.replace(
      `${url.pathname}${url.search ? url.search : ''}`,
      { scroll: false },
    );
  }

  // Sprint 36: Kanban drag-and-drop handler
  // 樂觀更新：先在本地 rows 移動卡片，再 PATCH API
  // API 失敗時 rollback
  const [rowsOverride, setRowsOverride] = useState<typeof rows | null>(null);
  const displayRows = rowsOverride ?? rows;

  async function handleKanbanMove(sourceRowId: string, targetGroup: string) {
    if (!specNameForApi) return;
    // 找出 source row + groupByField
    const currentView = views.find((v) => v.type === activeView);
    const groupByField = currentView?.groupByField;
    if (!groupByField) return;

    // 樂觀更新
    const beforeRows = displayRows;
    const afterRows = displayRows.map((r) => {
      if (r.id !== sourceRowId) return r;
      return {
        ...r,
        cells: r.cells.map((c) =>
          c.fieldName === groupByField ? { ...c, value: targetGroup } : c,
        ),
      };
    });
    setRowsOverride(afterRows);

    try {
      const targetRow = beforeRows.find((r) => r.id === sourceRowId);
      if (!targetRow) return;
      const originalCell = targetRow.cells.find((c) => c.fieldName === groupByField);
      const originalValue = originalCell?.value ?? '';

      const res = await fetch(`/api/crud/${specNameForApi}?id=${sourceRowId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [groupByField]: targetGroup }),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      toast.success(`已移動到 ${targetGroup}`);
    } catch (err) {
      // rollback
      setRowsOverride(beforeRows);
      toast.error(err instanceof Error ? err.message : '移動失敗');
    }
  }

  // 過濾後的 columns / rows（根據 visibleColumns）
  const visibleColumnList = useMemo(
    () => columns.filter((c) => visibleColumns.has(c.name)),
    [columns, visibleColumns],
  );
  const tableRows = useMemo(
    () =>
      rows.map((row) => ({
        id: row.id,
        // 重要：只取可見欄位的 cells，並依可見欄位的順序。
        // 為什麼不是 row.cells.map()：因為 boolean=false 的 cell 也會被 map
        // 成空字串，而不能作為 "hidden" sentinel 使用。
        // 為什麼要用 visibleColumnList 的順序：避免 fields 順序跟 cells 順序不一致時錯位。
        cells: visibleColumnList.map((col) => {
          const cell = row.cells.find((rc) => rc.fieldName === col.name);
          if (!cell) return '';
          if (cell.isCheckbox) {
            return cell.value === '✓' ? <span className="text-green-600">✓</span> : '';
          }
          return cell.value;
        }),
      })),
    [rows, visibleColumnList],
  );

  function handleSelectionChange(newSet: Set<string>) {
    setSelectedIds(newSet);
  }

  // Sprint D: 套用 filters → push URL with ?filters=... → server side 重跑
  function handleApplyFilters(filters: FilterRule[]) {
    setActiveFilters(filters);
    const queryString = serializeListQuery({
      page: 1, // reset to page 1 when filter changes
      pageSize,
      sort: currentSort,
      order: currentOrder,
      q: currentQuery,
      filters,
    });
    setSelectedIds(new Set()); // 清空選取
    router.push(`/admin/crud/${specName}${queryString ? `?${queryString}` : ''}`);
  }

  function openDialog() {
    if (selectedIds.size === 0) return;
    setDialogOpen(true);
  }

  async function handleConfirmDelete() {
    const ids = Array.from(selectedIds);
    startDeleteTransition(async () => {
      try {
        const res = await fetch(`/api/crud/${specName}?batch=true`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids }),
        });

        if (res.status === 401) {
          toast.error('請先登入');
          return;
        }

        const json = (await res.json()) as {
          deleted?: number;
          failed?: Array<{ id: string; error: string }>;
          error?: string;
        };

        if (!res.ok) {
          toast.error(json.error ?? `刪除失敗 (HTTP ${res.status})`);
          return;
        }

        const deleted = json.deleted ?? 0;
        const failed = json.failed ?? [];

        if (failed.length === 0) {
          toast.success(`已刪除 ${deleted} 筆`);
        } else if (deleted > 0) {
          toast.error(`已刪除 ${deleted} 筆，${failed.length} 筆失敗`);
        } else {
          toast.error('刪除失敗，請重試');
        }

        setDialogOpen(false);
        setSelectedIds(new Set());
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : String(err));
      }
    });
  }

  function handleCancel() {
    if (isDeleting) return;
    setDialogOpen(false);
  }

  // sortable header
  const renderHeader = (col: Column) => (
    <SortableHeaderCell
      label={col.label}
      fieldName={col.name}
      currentSort={currentSort}
      currentOrder={currentOrder}
      q={currentQuery}
      pageSize={pageSize}
      specName={specName}
    />
  );

  // 構造 BatchDeleteDialog items
  const dialogItems = Array.from(selectedIds).map((id) => {
    const row = rows.find((r) => r.id === id);
    const firstCell = row?.cells[0];
    return {
      id,
      label: firstCell?.value ?? id,
    };
  });

  return (
    <>
      {/* Toolbar — Sprint D 修補：永遠渲染（含篩選 button）即使 rows=0 */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          {allowBatchDelete && selectedIds.size > 0 && (
            <>
              <Button
                variant="destructive"
                size="sm"
                onClick={openDialog}
                disabled={isDeleting}
                data-testid="batch-delete-button"
              >
                <Trash2 />
                批次刪除
              </Button>
              <span
                data-testid="selection-count"
                className="text-sm text-muted-foreground"
              >
                已選 {selectedIds.size} 筆
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {filterableFields.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilterDialogOpen(true)}
              data-testid="advanced-filter-button"
            >
              <Filter />
              篩選
              {activeFilters.length > 0 && (
                <span
                  data-testid="active-filter-count"
                  className="ml-1 text-xs bg-primary text-primary-foreground px-1.5 rounded-full"
                >
                  {activeFilters.length}
                </span>
              )}
            </Button>
          )}
          {allowColumnToggle && (
            <ColumnTogglePopover
              specName={specName}
              columns={columns}
              visible={visibleColumns}
              onChange={setVisibleColumns}
            />
          )}
          {/* Sprint 33: View 切換（多 view 支援）*/}
          {views.length > 1 && (
            <ViewSelector
              views={views}
              activeView={activeView}
              onChange={handleViewChange}
            />
          )}
          {/* 不渲染小「新增」按鈕：頁面 header 已有大按鈕 */}
        </div>
      </div>

      {/* Table — Sprint D 修補：rows=0 時顯示 Empty UI，但 toolbar 仍在上方 */}
      {rows.length === 0 ? (
        <Empty data-testid="empty-state">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Inbox />
            </EmptyMedia>
            <EmptyTitle>{currentQuery ? `找不到符合「${currentQuery}」的資料` : '尚無資料'}</EmptyTitle>
            <EmptyDescription>
              {currentQuery
                ? `試試其他關鍵字或清除搜尋條件`
                : `目前沒有任何資料，點擊右上角「新增」建立第一筆`}
            </EmptyDescription>
          </EmptyHeader>
          {currentQuery && (
            <EmptyContent>
              <Button asChild variant="outline" data-testid="empty-clear-search">
                <Link href={`/admin/crud/${specName}`}>清除搜尋</Link>
              </Button>
            </EmptyContent>
          )}
        </Empty>
      ) : (
        <>
          {/* Sprint 33: ViewRouter 切換 TableView / TodoListView / Kanban */}
          <ViewRouter
            activeView={activeView}
            rows={displayRows}
            columns={visibleColumnList}
            total={total}
            selectedIds={selectedIds}
            onSelectionChange={handleSelectionChange}
            renderActions={(rowId) =>
              customRenderActions
                ? customRenderActions(rowId)
                : <ListRowActions specName={specName} rowId={rowId} />
            }
            renderHeader={renderHeader}
            specName={specName}
            primaryField="title"
            views={views}
            onMove={activeView === 'kanban' ? handleKanbanMove : undefined}
            visibleColumns={visibleColumns}
          />
        </>
      )}

      {/* 分頁資訊 */}
      <div className="text-sm text-muted-foreground">
        共 {total} 筆資料，已載入 {rows.length} 筆
      </div>

      {/* Sprint A: Infinite scroll trigger */}
      <InfiniteScrollTrigger
        page={page}
        hasMore={page < totalPages}
        total={total}
        /** TD-805: 頁面上限守護, 防 self-DoS */
        maxPageCap={50}
      />

      {/* Dialog */}
      {allowBatchDelete && (
        <BatchDeleteDialog
          open={dialogOpen}
          items={dialogItems}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancel}
          isDeleting={isDeleting}
        />
      )}

      {/* Sprint D: AdvancedFilterDialog */}
      <AdvancedFilterDialog
        open={filterDialogOpen}
        onOpenChange={setFilterDialogOpen}
        fields={filterableFields}
        filters={activeFilters}
        onApply={handleApplyFilters}
      />
    </>
  );
}