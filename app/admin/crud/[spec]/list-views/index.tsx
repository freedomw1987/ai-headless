// Sprint 33 — View Router
//
// 根據 activeView 切換不同 view 渲染。
// 目前支援：
// - table: TableView（包裝 Sprint A-E 的 CrudListTable + MobileListView）
// - todo-list: TodoListView（新元件，適合 status tracking 場景）
// - kanban: 待後續 Sprint 實作
//
// 為什麼需要 ViewRouter：
// - 統一 props 介面讓子元件容易切換
// - View 切換時保留 selection state（未來 Sprint）
// - AI 開發可從 spec.views 選擇適合的顯示方式

'use client';

import type { CellDisplay } from '@/lib/runtime/cell-display';
import { TableView } from './table-view';
import { TodoListView } from './todo-list-view';
import { KanbanView } from './kanban-view';
import { CalendarView } from './calendar-view';
import { GalleryView } from './gallery-view';
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

  // 找出當前 view 的專屬欄位
  const currentView = views.find((v) => v.type === activeView);
  const groupByField = currentView?.groupByField;
  const dateField = currentView?.dateField;
  const imageField = currentView?.imageField;

  switch (activeView) {
    case 'table':
      return <TableView {...rest} renderHeader={renderHeader} visibleColumns={visibleColumns} />;
    case 'todo-list':
      return <TodoListView {...rest} />;
    case 'kanban':
      return <KanbanView {...rest} groupByField={groupByField} onMove={onMove} />;
    case 'calendar':
      return <CalendarView {...rest} dateField={dateField} />;
    case 'gallery':
      return <GalleryView {...rest} imageField={imageField} />;
    default:
      return <TableView {...rest} renderHeader={renderHeader} visibleColumns={visibleColumns} />;
  }
}