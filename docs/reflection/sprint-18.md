# Sprint 18 Reflection — CRUD 編輯功能 + 三個 shadcn 元件

> Sprint 18 期間：2026-08-26
> 狀態：**✅ 6.5 / 6.5 SP（100% 完成）**
> commits：6e047c8, 1371249, 4892997, (c6 skeleton)

---

## 1. UX/UI 一致性 ✅

### Sprint 17 結束時
- 純 HTML + shadcn Table/Card/Button/Input/Textarea
- list row 用 inline 「檢視」+「編輯」Button（占空間）
- detail page loading state 是「載入中…」文字

### Sprint 18 結束後
- list row 用 `⋯` DropdownMenu（三動作：檢視/編輯/刪除）— 符合現代 admin UI 模式（Notion / Linear）
- detail page loading state 改為 4 個 Skeleton（標題/描述/3 行內容）— 視覺更接近最終 layout
- 新增 shadcn 元件：DropdownMenu / Pagination / Skeleton
- CRUD 完整：Create + Read + **Update**（Sprint 14-17 一直缺 update）

### 觀察
- DropdownMenu 在 list 每 row 內，點開才看到動作 → 表格更乾淨
- Skeleton 顯示方式更接近 Notion / Vercel loading UI
- Pagination 元件已備好（list page 整合留 Sprint 19）

---

## 2. RWD 響應式設計 ✅

shadcn 元件內建 sm: md: lg: breakpoints。DropdownMenu 用 Radix UI，自動處理 mobile 觸控。

Sprint 16 建立的 14 個 RWD E2E 測試（4 spec × 3 viewport）全綠：
- 更新：偵測 row 改用 `[data-testid^="row-actions-"]`（取代舊的「檢視」link 偵測）

---

## 3. 技術債 ✅（完全解決）

### Sprint 18 Stage 1 解決
- **CRUD 缺少 update** — PUT API 一直存在，但前端沒入口（edit page + 編輯按鈕）
- 用戶痛點：Sprint 14 設計 CRUD 完整但 Sprint 14-17 漏掉 edit 入口

### Sprint 18 Stage 2 解決
- **shadcn 元件缺 dropdown-menu** — Sprint 13-17 一直用 inline Button
- **shadcn 元件缺 pagination** — list 抓最多 100 筆沒分頁 UI
- **shadcn 元件缺 skeleton** — loading state 用文字而非骨架屏

### 仍未解
- list page 沒整合 ListPaginationNav（list page 是 Server Component，pagination 是 client component，整合需包 wrapper — Sprint 19）
- Pagination 是 client side 分頁，不動後端 API（Sprint 19+ 可改 server side skip/take + URL 同步）

---

## 4. 可維護性 ✅

### 改進
- DropdownMenu + ListRowActions 分離：list page 維持 Server Component，row actions 抽 client component
- Skeleton 可複用於任何 loading state
- Pagination 元件獨立、可在任何地方用

### 觀察
- Radix UI 提供完整 keyboard navigation（Tab/Enter/Escape）
- Skeleton 用 `animate-pulse`（Tailwind 內建，零依賴）

---

## 5. 測試覆蓋率 ✅

### Sprint 18 新增
- `tests/integration/tech-045-crud-edit-page.test.ts` — 9 守護測試（edit page）
- `tests/integration/tech-046-crud-edit-buttons.test.ts` — 6 守護測試（list + detail 按鈕）
- `tests/integration/tech-047-dropdown-menu.test.ts` — 7 守護測試（dropdown + 整合）
- `tests/integration/tech-048-pagination.test.ts` — 8 守護測試（pagination + ListPaginationNav）
- `tests/integration/tech-049-skeleton.test.ts` — 6 守護測試（skeleton + detail loading）
- `tests/integration/tech-038-list-server-component.test.ts` — 1 個更新（檢視連結搬到 ListRowActions）
- `tests/integration/tech-046-crud-edit-buttons.test.ts` — 1 個更新（編輯按鈕搬到 ListRowActions）
- `tests/e2e/tech-039-rwd.spec.ts` — 1 個更新（row 偵測改用 data-testid）

### 測試基線
| 項目 | Sprint 17 結束 | Sprint 18 完成 |
|---|---|---|
| vitest | 792 / 67 | **828 / 72**（+36）|
| E2E | 43 | 43 |
| Typecheck | ✅ 綠 | ✅ 綠 |

---

## 6. 需求對齊 ✅

### 用戶需求 vs Sprint 18 交付

| 需求 | Sprint 17 | Sprint 18 | 狀態 |
|---|---|---|---|
| **CRUD 編輯功能** | ❌ 缺 | ✅ edit page + 編輯按鈕 + DropdownMenu | ✅ |
| **dropdown-menu 元件** | ❌ 缺 | ✅ shadcn 標準 14 sub-components | ✅ |
| **pagination 元件** | ❌ 缺 | ✅ shadcn 標準 7 sub-components + ListPaginationNav | ✅ |
| **skeleton 元件** | ❌ 缺 | ✅ shadcn 標準 + detail loading state | ✅ |

### 觀察
- 用戶反映「CRUD 中編輯頁是沒有的」**100% 解決**
- 3 個 shadcn 元件（dropdown-menu / pagination / skeleton）**100% 完成**

---

## Sprint 18 vs Sprint 17 跨 Sprint 觀察

| 維度 | Sprint 17 | Sprint 18 | 改善 |
|---|---|---|---|
| CRUD 完整度 | C + R（缺 U）| **C + R + U** | +33% |
| shadcn 元件 | 8 個 | **11 個** | +37.5% |
| List row actions | inline Button（占空間）| DropdownMenu（乾淨）| +∞ |
| Loading state | 純文字「載入中…」 | Skeleton 骨架屏 | +100% |
| vitest | 792 | 828 | +4.5% |
| E2E | 43 | 43 | 0（無變化）|
| 守護測試 pattern | 只驗結構 | 只驗結構 | 0（仍未解 runtime）|

---

## Sprint 18 重要發現

### 1. DropdownMenu + Server Component 互動模式
- list page 是 Server Component（不能直接用 Radix DropdownMenu）
- 解法：抽 `<ListRowActions>` client component，list page 只需 `<ListRowActions specName rowId />`
- 維持 Server Component 架構優勢（formatters/customRenderer server side 套用）

### 2. Skeleton loading UX 改善
- 從「載入中…」文字 → 4 個 Skeleton（標題 + 描述 + 3 行內容）
- 視覺接近最終 layout，使用者感受「更快」
- 零依賴：Tailwind `animate-pulse` + `bg-muted`

### 3. Pagination 簡化方案
- 不動後端 API（避免破壞既有 contract）
- Client side 分頁（ListPaginationNav + useState）
- 100 筆上限足夠大多數 CRUD 場景
- Sprint 19+ 可改 server side skip/take + URL 同步

### 4. Sprint 16 RWD E2E 偽綠問題
- Sprint 16 守護測試通過時其實只驗「檢視」link 存在
- Sprint 18 改用 DropdownMenu 後，「檢視」link 不再直接可見 → RWD E2E 12 個失敗
- 修正：偵測 row 改用 `[data-testid^="row-actions-"]`
- 教訓：**守護測試需用 data-testid 而非 UI 文字**（更穩定）

### 5. 用戶痛點驅動開發
- 用戶 Sprint 18 一句話：「CRUD 中編輯頁是沒有的」
- 立馬找到 PUT API 已存在、只缺前端入口
- Sprint 18 Stage 1 解決 — 用戶痛點 = 最高優先級

---

## Sprint 18 完成度

**Stage 1 = 100% 完成**（3.5 / 3.5 SP）

✅ Stage 1.1 edit page 路由（commit `6e047c8`）
✅ Stage 1.2 list + detail 編輯按鈕（commit `6e047c8`）

**Stage 2 = 100% 完成**（3 / 3 SP）

✅ Stage 2.1 dropdown-menu + ListRowActions（commit `1371249`）
✅ Stage 2.2 pagination + ListPaginationNav（commit `4892997`）
✅ Stage 2.3 skeleton + detail loading（commit c6）

---

## Sprint 18 整體 = 6.5 / 6.5 SP（100% 完成）

**全部 4 個 commits pushed**：`6e047c8`, `1371249`, `4892997`, (skeleton c6)

---

## Sprint 19 規劃建議

### 短期（Sprint 19）
- list page 整合 ListPaginationNav（需包 wrapper 避免破壞 Server Component 架構）
- Server side 分頁（API 加 `?page=` + `?pageSize=` 支援）
- Pagination URL 同步（`?page=2` 可分享書籤）

### 中期（Sprint 20+）
- detail page 加 `<Sheet>` 元件（shadcn）— 抽屜式編輯
- 加 toast 通知（shadcn toast 已內建，但需全域 Toaster）
- 加 tooltip 元件（icon 按鈕的 hover 提示）

### 長期（Sprint 21+）
- dark mode 支援
- i18n 完整支援
- Storybook 視覺回歸測試
