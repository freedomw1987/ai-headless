# CRUD 列表頁增強 — 功能增量計劃（精簡版 v1.1）

> 版本：v1.1 (2025-08-30 更新)
> 範圍：`app/admin/crud/[spec]/page.tsx` 及相關組件
> 策略：**精簡版**（不拆 Server/Client 架構，只加 client 元件）

---

## 1. 設計決策摘要（與用戶確認）

| # | 功能 | 決定 |
|---|---|---|
| 架構 | 不拆架構，純 server 加 client 元件 | **精簡版 Z** |
| Infinite | 重撈策略 | **Z**：每次 refresh 重撈 1~N 頁，URL 只有 `?page=N` |
| 篩選 | 進階篩選類型 | **A**：完整支援 string/number/enum/datetime/boolean |
| 批次刪除 | 確認流程 | **A**：確認 dialog + 必須打「DELETE」字樣 |
| 欄位顯示 | 持久化 | **A**：存 localStorage，提供重設按鈕 |
| Infinite | page size + 觸發 | **A + X**：20 筆 / 距底部 200px 觸發 |

---

## 2. 精簡版架構

### 為什麼不拆架構

- 現有 `page.tsx` 是 Server Component，用 `createDynamicHandlers(spec).list()` 從 spec 動態生成 query
- formatter 可能產出 React component（如 customRenderer）
- **拆架構會把整個 spec/formatters bundle 傳到 client，違背 SSR 初衷**
- **精簡版方案**：Server Component 還是整頁 server-render，**只在底部加一個 `<InfiniteScrollTrigger>` client 元件**負責觸發 `router.refresh()`

### 2.1 精簡版渲染流程

```
User scroll 到底部
  ↓
IntersectionObserver 觸發 (距離 200px)
  ↓
useTransition + router.push(`?page=N+1`)
  ↓
Next.js 重新執行 Server Component (page.tsx)
  ↓
Server side: 拿 page=1 到 page=N 的所有資料, render 整頁 HTML
  ↓
React diff: 只 patch 新 rows → append 到底部
  ↓
DOM 更新完成, scroll 位置保持
```

### 2.2 為什麼選 Z（重撈 1~N 頁）

- **不需改 spec handler**（沿用現有 offset-based pagination）
- URL 乾淨（只有 `?page=N`）
- Server side render 整頁時，一次把 page 1 到 page N 全部撈出來 render，client React diff 自然看到新 rows append 到底部
- 每次 refresh 都重撈（page 1 重複撈），但因為有 DB query cache + 資料量小（通常 < 100 筆/頁 × 5-10 頁），實務上沒問題
- 之後若需要可以升級為 cursor-based（X 方案），但**不影響 client 端 UI**

---

## 3. 5 個功能詳細設計

### 3.1 Infinite scroll pagination (Sprint A — 優先做)

**新增檔案**：`app/admin/crud/[spec]/infinite-scroll-trigger.tsx`

```tsx
'use client';
import { useTransition, useRef, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

export function InfiniteScrollTrigger({
  page,
  hasMore,
  total,
}: {
  page: number;
  hasMore: boolean;
  total: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isPending) {
          startTransition(() => {
            const params = new URLSearchParams(searchParams);
            params.set('page', String(page + 1));
            router.push(`${pathname}?${params.toString()}`);
          });
        }
      },
      { rootMargin: '200px' },
    );
    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, isPending, page, pathname, router, searchParams]);

  if (!hasMore) {
    return (
      <div className="text-center py-4 text-sm text-muted-foreground">
        已顯示全部 {total} 筆
      </div>
    );
  }
  return (
    <div ref={sentinelRef} className="text-center py-4 text-sm text-muted-foreground">
      {isPending ? '載入中...' : '捲動以載入更多'}
    </div>
  );
}
```

**修改檔案**：`app/admin/crud/[spec]/page.tsx`
- Server side 改成「撈 page=1 到 page=N 的所有資料」並 render
- 把現有 `<Pagination>` 移除，改放 `<InfiniteScrollTrigger>`
- URL 解析維持現有 `?page=N`

### 3.2 Checkbox + 批次刪除 (Sprint B)

**新增檔案**
- `app/admin/crud/[spec]/row-checkbox.tsx` (client)
- `app/admin/crud/[spec]/batch-delete-toolbar.tsx` (client)
- `app/admin/crud/[spec]/batch-delete-dialog.tsx` (client)
- `app/api/crud/[spec]/batch-delete/route.ts` (server API)

**確認流程**：兩段式（dialog + 必須打「DELETE」字樣）

### 3.3 顯示欄位設定 (Sprint C)

**JSON Spec 新增**：`docs/specs/json-spec.md`
```json
{
  "list": {
    "defaultColumns": ["customer", "amount", "status"],
    "allowColumnToggle": true
  },
  "fields": [{
    "name": "customer",
    "list": { "defaultVisible": true, "label": "客戶名稱" }
  }]
}
```

**新增檔案**
- `app/admin/crud/[spec]/column-toggle-popover.tsx` (client)
- `lib/crud/column-prefs.ts` (localStorage helper)

### 3.4 進階篩選 (Sprint D)

**支援類型與運算子**

| 類型 | 運算子 | UI |
|---|---|---|
| `string` | contains, equals, starts with | text input |
| `number` | >=, >, =, <, <=, between | select + 1~2 number inputs |
| `enum` | in, not in | multi-select |
| `datetime` | from / to | 2 datetime inputs |
| `boolean` | is true / is false | select |

**新增檔案**
- `app/admin/crud/[spec]/advanced-filter-dialog.tsx` (client)
- `lib/crud/list-query.ts` (URL ↔ filter parser)

### 3.5 Mobile list view (Sprint E)

**判斷方式**：`useMediaQuery('(min-width: 640px)')`
- < sm：list view (cards)
- ≥ sm：table view

**新增檔案**
- `app/admin/crud/[spec]/list-cards.tsx` (client)
- `lib/hooks/use-media-query.ts`

---

## 4. 影響範圍總覽

### 修改檔案 (1 個)
- `app/admin/crud/[spec]/page.tsx` — 加累積頁邏輯、移除 pagination、改放 InfiniteScrollTrigger

### 新增檔案 (約 13 個)

| Sprint | 檔案 | 類型 |
|---|---|---|
| A | `infinite-scroll-trigger.tsx` | client |
| B | `row-checkbox.tsx` | client |
| B | `batch-delete-toolbar.tsx` | client |
| B | `batch-delete-dialog.tsx` | client |
| B | `api/crud/[spec]/batch-delete/route.ts` | server |
| C | `column-toggle-popover.tsx` | client |
| C | `lib/crud/column-prefs.ts` | utils |
| D | `advanced-filter-dialog.tsx` | client |
| D | `lib/crud/list-query.ts` | utils |
| E | `list-cards.tsx` | client |
| E | `lib/hooks/use-media-query.ts` | hook |
| Test | `tests/integration/crud-list-*.test.tsx` (×5) | test |
| Test | `tests/e2e/admin-crud-list-rwd.spec.ts` | test |

### 修改文件
- `docs/specs/json-spec.md` — 加 `list.defaultColumns` / `list.allowColumnToggle` / `field.list.defaultVisible`

---

## 5. Sprint 規劃（精簡版）

### Sprint A — Infinite scroll (5 點)
- A1: InfiniteScrollTrigger client component + IntersectionObserver (2 點)
- A2: page.tsx 改成累積頁邏輯（拿 1~N 頁，render 整頁）(2 點)
- A3: 移除舊 Pagination 元件、整合 InfiniteScrollTrigger (1 點)

### Sprint B — Checkbox + 批次刪除 (8 點)
- B1: Checkbox state + 全選邏輯 (2 點)
- B2: Batch delete dialog (DELETE 確認) (2 點)
- B3: Batch delete API + 權限 (3 點)
- B4: Toolbar 整合 + Toast (1 點)

### Sprint C — 顯示欄位 (5 點)
- C1: JSON spec 擴充 (1 點)
- C2: ColumnTogglePopover + localStorage (2 點)
- C3: 欄位渲染邏輯整合 (2 點)

### Sprint D — 進階篩選 (8 點)
- D1: 5 種類型 UI components (5 點)
- D2: URL ↔ filter parser (2 點)
- D3: 整合到 toolbar + page.tsx (1 點)

### Sprint E — Mobile list view (3 點)
- E1: useMediaQuery hook + view 切換 (1 點)
- E2: Cards view component (2 點)

### Sprint F — 測試 + 文件 (5 點)
- F1: 5 個元件測試 (3 點)
- F2: E2E + 文件 (2 點)

**總計：34 點 ≈ 17 工作天 (3.5 週)**

比原 39 點省 5 點（不拆架構省 formatter bundle 處理）。

---

## 6. 不在 v1 範圍

- AND/OR 條件組合
- 多裝置同步（DB 存欄位設定）
- 批次編輯
- 欄位拖拽排序
- 自定義欄寬
- 匯出選中 rows

---

## 7. 待確認事項

- [x] **用戶確認精簡版 + Z 方案** ✓ (2025-08-30)
- [ ] 是否分多個 PR？（建議 A→B→C→D→E 順序）
- [ ] Sprint A 完成後要先 review 再繼續 Sprint B？
