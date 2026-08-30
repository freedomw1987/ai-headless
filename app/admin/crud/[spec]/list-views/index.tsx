// Sprint 33 — View Router
// Sprint 41-3 (TD-904) — 改用 VIEW_REGISTRY 統一管理
//
// 從 registry 讀 view 元件 + icon + spec field
// 新增 view type 只改 registry.ts
//
// 為什麼需要 ViewRouter：
// - 統一 props 介面讓子元件容易切換
// - View 切換時保留 selection state
// - AI 開發可從 spec.views 選擇適合的顯示方式

'use client';

import type { CellDisplay } from '@/lib/runtime/cell-display';
import { VIEW_REGISTRY } from './registry';
import type { View, ViewType } from '@/lib/specs/json-spec.types';

type Column = {
  name: string;
  label: string;
};

type Props = {
  activeView: ViewType;
  rows: { id: string; cells: CellDisplay[] }[];
  columns: Column[];
  total: number;
  selectedIds: Set<string>;
  onSelectionChange: (newSelected: Set<string>) => void;
  renderActions: (rowId: string) => React.ReactNode;
  specName: string;
  primaryField?: string;
  /** View 配置（從 buildListUIConfig 來） */
  views: View[];
  /** Sortable header (從 CrudListClient 傳入） */
  renderHeader?: (col: Column) => React.ReactNode;
  /** Sprint 36: Kanban drag-and-drop callback */
  onMove?: (sourceRowId: string, targetGroup: string) => void;
  /** Sprint 40-5: 可見欄位 (column toggle) — 只對 TableView 有意義 */
  visibleColumns?: Set<string>;
};

export function ViewRouter(props: Props) {
  const { activeView, renderHeader, views, onMove, visibleColumns, ...rest } = props;

  // TD-904: 從 registry 拿 view meta (預設 fallback 為 table)
  const meta = VIEW_REGISTRY[activeView] ?? VIEW_REGISTRY['table'];
  const ViewComponent = meta.Component;

  // 找出當前 view 的專屬欄位
  const currentView = views.find((v) => v.type === activeView);
  const specFieldValue = currentView && meta.specField
    ? currentView[meta.specField]
    : undefined;

  // 根據 specField 決定傳什麼 prop
  const viewProps: Record<string, unknown> = { ...rest };
  if (meta.specField === 'groupByField') {
    viewProps.groupByField = specFieldValue;
    viewProps.onMove = onMove;
  } else if (meta.specField === 'dateField') {
    viewProps.dateField = specFieldValue;
  } else if (meta.specField === 'imageField') {
    viewProps.imageField = specFieldValue;
  }

  return <ViewComponent {...viewProps} renderHeader={renderHeader} visibleColumns={visibleColumns} />;
}
