// Sprint 38-2 — GalleryView 元件
//
// 圖庫視圖，顯示 rows 為網格布局的卡片：
// - 響應式 grid: desktop sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4
// - 每個 card 顯示圖片 + title + 額外 metadata
// - 沒 image 時顯示 fallback icon
// - 支援 selection + actions
//
// Gate 1 TDD: 見 tests/integration/list-view-gallery.test.tsx

'use client';

import { ImageIcon } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import type { CellDisplay } from '@/lib/runtime/cell-display';

type Column = {
  name: string;
  label: string;
};

type Props = {
  rows: { id: string; cells: CellDisplay[] }[];
  columns: Column[];
  selectedIds: Set<string>;
  onSelectionChange: (newSelected: Set<string>) => void;
  renderActions: (rowId: string) => React.ReactNode;
  primaryField?: string;
  /** 必填: 圖片 URL 欄位名稱 (e.g., 'image', 'coverUrl') */
  imageField?: string;
};

function findCell(cells: CellDisplay[], fieldName: string): CellDisplay | undefined {
  return cells.find((c) => c.fieldName === fieldName);
}

export function GalleryView({
  rows,
  columns,
  selectedIds,
  onSelectionChange,
  renderActions,
  primaryField,
  imageField,
}: Props) {
  // 沒指定 imageField → 提示
  if (!imageField) {
    return (
      <div
        data-testid="gallery-no-image-field"
        className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground"
      >
        Gallery view 需指定 imageField (圖片 URL 欄位名稱, 例如 'image' 或 'coverUrl')
      </div>
    );
  }

  // 沒資料 → 空狀態
  if (rows.length === 0) {
    return (
      <div
        data-testid="gallery-empty"
        className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground"
      >
        目前沒有資料
      </div>
    );
  }

  // 預設 primary field
  const primary =
    primaryField
    ?? columns.find((c) => c.name === 'title')?.name
    ?? columns[0]?.name
    ?? '';

  function toggleRow(rowId: string) {
    const next = new Set(selectedIds);
    if (next.has(rowId)) next.delete(rowId);
    else next.add(rowId);
    onSelectionChange(next);
  }

  return (
    <div
      data-testid="gallery-view"
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
    >
      {rows.map((row) => {
        const primaryCell = findCell(row.cells, primary);
        const imageCell = findCell(row.cells, imageField);
        const imageUrl = imageCell?.value ?? '';
        const isSelected = selectedIds.has(row.id);
        return (
          <div
            key={row.id}
            data-testid={`gallery-card-${row.id}`}
            data-selected={isSelected ? 'true' : 'false'}
            className={cn(
              'group rounded-lg border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow',
              isSelected && 'ring-2 ring-primary',
            )}
          >
            {/* 圖片區 */}
            <div className="relative aspect-video bg-muted">
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt={primaryCell?.value ?? ''}
                  data-testid={`gallery-card-${row.id}-image`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  data-testid={`gallery-card-${row.id}-fallback`}
                  className="w-full h-full flex items-center justify-center text-muted-foreground"
                >
                  <ImageIcon className="h-12 w-12" />
                </div>
              )}
              {/* selection checkbox overlay */}
              <div className="absolute top-2 left-2">
                <Checkbox
                  data-testid={`gallery-card-${row.id}-checkbox`}
                  checked={isSelected}
                  onCheckedChange={() => toggleRow(row.id)}
                  aria-label={`選取 ${primaryCell?.value ?? row.id}`}
                  className="bg-white/90 shadow"
                />
              </div>
              {/* actions overlay - mobile 永遠顯示, desktop hover 才顯示 */}
              <div className="absolute top-2 right-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                {renderActions(row.id)}
              </div>
            </div>

            {/* 文字區 */}
            <div className="p-3">
              <div
                data-testid={`gallery-card-${row.id}-title`}
                className="text-sm font-medium truncate"
              >
                {primaryCell?.value ?? ''}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}