/**
 * Sprint 41-3 — View Registry (TD-904 重構)
 *
 * 統一管理所有 view type 的 metadata + 元件:
 * - Component
 * - Icon (lucide)
 * - requiredFields (dateField / imageField / groupByField)
 *
 * 新增 view type 只改 1 處 (registry entry)
 * ViewRouter / ViewSelector 都從 registry 讀
 */

import { ListTodo, LayoutGrid, Table, CalendarDays, ImageIcon, type LucideIcon } from 'lucide-react';
import type { ComponentType } from 'react';
import { TableView } from './table-view';
import { TodoListView } from './todo-list-view';
import { KanbanView } from './kanban-view';
import { CalendarView } from './calendar-view';
import { GalleryView } from './gallery-view';
import type { ViewType } from '@/lib/specs/json-spec.types';

export type ViewMeta = {
  /** View 元件 */
  Component: ComponentType<any>;
  /** Lucide icon */
  Icon: LucideIcon;
  /** 必填的 spec field (用於 ViewRouter 從 currentView 抓取) */
  specField?: 'groupByField' | 'dateField' | 'imageField';
  /** 預設 label (i18n 後續加) */
  defaultLabel: string;
};

/**
 * TD-904: View Registry
 * 新增 view type 只改這個 object
 */
export const VIEW_REGISTRY: Record<ViewType, ViewMeta> = {
  'table': {
    Component: TableView as ComponentType<any>,
    Icon: Table,
    defaultLabel: '表格',
  },
  'todo-list': {
    Component: TodoListView as ComponentType<any>,
    Icon: ListTodo,
    defaultLabel: '待辦清單',
  },
  'kanban': {
    Component: KanbanView as ComponentType<any>,
    Icon: LayoutGrid,
    specField: 'groupByField',
    defaultLabel: '看板',
  },
  'calendar': {
    Component: CalendarView as ComponentType<any>,
    Icon: CalendarDays,
    specField: 'dateField',
    defaultLabel: '月曆',
  },
  'gallery': {
    Component: GalleryView as ComponentType<any>,
    Icon: ImageIcon,
    specField: 'imageField',
    defaultLabel: '圖庫',
  },
};
