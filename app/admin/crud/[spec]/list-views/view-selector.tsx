// Sprint 33-5 — ViewSelector 元件
//
// toolbar 上的 dropdown 讓 user 切換不同 view（table / todo-list / kanban）
// - 顯示當前 active view 的 label
// - 點擊打開 dropdown 列出所有 views
// - 點選切換 → onChange(type)
// - 當前 active view 在 dropdown 顯示為 selected
//
// Gate 1 TDD：見 tests/integration/list-view-selector.test.tsx

'use client';

import { ChevronDown, LayoutGrid, ListTodo, Table, CalendarDays, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { ViewType } from '@/lib/specs/json-spec.types';

type ViewItem = {
  type: ViewType;
  label: string;
};

type Props = {
  views: ViewItem[];
  activeView: ViewType;
  onChange: (type: ViewType) => void;
};

const ICON_MAP: Record<ViewType, React.ComponentType<{ className?: string }>> = {
  table: Table,
  'todo-list': ListTodo,
  kanban: LayoutGrid,
  calendar: CalendarDays,
  gallery: ImageIcon,
};

export function ViewSelector({ views, activeView, onChange }: Props) {
  const activeItem = views.find((v) => v.type === activeView) ?? views[0];
  const ActiveIcon = activeItem ? ICON_MAP[activeItem.type] : Table;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          data-testid="view-selector-trigger"
        >
          <ActiveIcon className="h-4 w-4 mr-1" />
          {activeItem?.label ?? '視圖'}
          <ChevronDown className="h-3 w-3 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>切換視圖</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {views.map((view) => {
          const Icon = ICON_MAP[view.type];
          const isActive = view.type === activeView;
          return (
            <DropdownMenuItem
              key={view.type}
              data-testid={`view-selector-item-${view.type}`}
              data-selected={isActive ? 'true' : 'false'}
              onClick={() => onChange(view.type)}
              className={cn(isActive && 'bg-accent font-medium')}
            >
              <Icon className="h-4 w-4 mr-2" />
              {view.label}
              {isActive && <span className="ml-auto">✓</span>}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}