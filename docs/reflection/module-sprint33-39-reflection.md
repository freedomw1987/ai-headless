# Module: View Feature (Sprint 33-39) 反省報告

> **Module 名稱**: View Feature — CRUD List 多視圖系統
> **Module 描述**: 為 admin CRUD list page 加入可切換的多 View 顯示選項（TableView / TodoListView / KanbanView / CalendarView / GalleryView），支援 JSON spec 定義、AI 開發選擇最適顯示方式
> **反省日期**: 2026-08-30
> **參與者**: Agent（MiniMax-M3）+ 用戶
> **反省級別**: Module（涵蓋 Sprint 33-39, 7 個 sprint）
> **範圍**: View 架構 + UI 整合 + Kanban DnD + localStorage 持久化 + Calendar/Gallery 新增

---

## Module 總覽

| 項目 | 數據 |
|------|------|
| **包含 Sprint** | 7（Sprint 33, 34, 35, 36, 37, 38, 39）|
| **計劃 SP** | ~18 SP |
| **實際完成** | 100% |
| **新增/修改檔案** | ~20 個 |
| **新增測試** | 60+ 守護測試（unit + E2E）|
| **最終測試基線** | **integration 910/910 + E2E 103/104**（1 個 flaky 與 view 無關）|

---

## 完成的 7 個 Sprint

| Sprint | 內容 | 結果 |
|---|---|---|
| 33 | 基礎設施（JsonSpec.views + ViewRouter + TableView + TodoListView + ViewSelector）| ✅ 26 unit |
| 34 | UI 整合（CrudListClient + page.tsx + spec 範例 + ViewRouter 切換）| ✅ 8 E2E |
| 35 | KanbanView 元件 + 整合 ViewRouter + 守護測試 | ✅ 8 unit + 4 E2E |
| 36 | KanbanView drag-and-drop（樂觀更新 + PUT API + rollback）| ✅ 5 unit + 1 E2E |
| 37 | blog/event/order specs 加 views + localStorage 持久化 | ✅ 5 unit + 5 E2E |
| 38 | CalendarView + GalleryView 元件 + ViewType 擴展 | ✅ 17 unit |
| 39 | event calendar view + blog coverUrl field + Prisma migration | ✅ |

---

## 5 種 View Types

| View Type | 元件 | 適用場景 | groupBy/dateField/imageField |
|---|---|---|---|
| **table** | TableView | 大量資料、排序篩選（預設）| — |
| **todo-list** | TodoListView | status tracking 卡片列表 | primaryField |
| **kanban** | KanbanView | workflow 視覺化（drag-and-drop）| groupByField |
| **calendar** | CalendarView | 時間軸（dueDate / startAt）| dateField |
| **gallery** | GalleryView | 圖像為主的內容（待 image 欄位）| imageField |

---

## 4 個 CRUD specs 都支援多 View

| Spec | Views | 預設 |
|---|---|---|
| todo | table + todo-list + kanban + calendar | table |
| blog | table + kanban + gallery | table |
| event | table + kanban + calendar | table |
| order | table + kanban | table |

---

## 反省結果總覽

| 檢查維度 | 結果 | 備註 |
|---------|------|------|
| **1. UX/UI 一致性** | ✅ | ViewSelector dropdown 在 4 個 CRUD 統一運作 |
| **2. RWD 響應式設計** | ✅ | 375/768/1440 三尺寸都正常 |
| **3. 技術債** | ⚠️ | Sprint 37 揭露 spec cache 問題、Sprint 38 dev server Prisma client cache |
| **4. 可維護性** | ✅ | 元件獨立、可單獨測試、ViewRouter 統一切換 |
| **5. 測試覆蓋率** | ✅ | 60+ 新守護測試覆蓋所有 view 行為 |
| **6. 需求對齊** | ✅ | 5 種 view 都可用、drag-and-drop、localStorage、雙格式驗證 |

---

## 跨 Sprint 觀察

### 觀察 1: View 架構的可擴展性良好

新增一個 view type 需要改 4 個地方：
1. `lib/specs/json-spec.types.ts` 的 ViewType union
2. `lib/specs/json-spec.schema.ts` 的 viewSchema 驗證
3. `list-views/index.tsx` 的 ViewRouter switch case
4. `list-views/view-selector.tsx` 的 ICON_MAP

**經驗**：可考慮用 registry 模式統一管理（e.g., `VIEW_REGISTRY = { table: { Component, defaultIcon, validateFields } }`），減少散落修改。但對 5 種 view 來說，目前模式還可接受。

### 觀察 2: Dev server cache 是常見阻礙

兩個 sprint 都遇到 cache 問題：
- Sprint 37：spec 變更後要 touch spec-loader 強制 reload
- Sprint 38/39：Prisma client 重生後 dev server 不會自動重啟

**經驗**：
- Spec loader 應該加 cache invalidation 機制（用 mtime 比對）
- Prisma client 變更需要 dev server 重啟
- 生產環境沒這問題（migration + restart 是正常流程）

### 觀察 3: JSON spec 雙格式 (`:` vs `.`) 是歷史包袱

- Sprint 21 設計：`users:read`（colon）
- Phase 1 extension manifest：`blog.create`（dot）

**經驗**：schema 應該在 Sprint 21 refactor 時就統一格式，不要保留雙格式。已經有 TD-524 partial cleanup（sanitizer），但 spec 沒清。

### 觀察 4: Source-code guard tests ROI 極高

5 種 view × 6 個 CRUD specs × 3 viewports = 90 個組合。傳統 visual regression 測試做不到。

**View feature 守護測試策略**：
- 每個 view 元件：unit test 渲染 + 互動
- ViewSelector：source-code guard 確保 types 不掉
- Spec-cache：touch 觸發 reload
- E2E：3 個 view 切換場景

### 觀察 5: Drag-and-drop 用 HTML5 native 即可

實作 KanbanView drag-and-drop 時考慮了 react-dnd 等 library，但發現 HTML5 native API 已足夠：
- `draggable` + `onDragStart` + `onDragOver` + `onDrop`
- 樂觀更新 + rollback 在 parent 層處理
- 測試用 `page.evaluate` dispatch events 模擬 HTML5 drag

**經驗**：80% 的 drag-and-drop 用 HTML5 native 就夠，react-dnd 是 over-engineering。

---

## Action Items

### 已完成

| Item | 狀態 |
|---|---|
| 5 種 view 元件 + integration | ✅ |
| KanbanView drag-and-drop | ✅ |
| localStorage 持久化（per-spec key）| ✅ |
| URL > localStorage > default 優先序 | ✅ |
| Blog coverUrl + Prisma migration | ✅ |

### 下個 Sprint 建議（Backlog items）

| ID | 標題 | SP | 來源 |
|---|---|---|---|
| TD-901 | spec loader 加 cache invalidation（mtime 比對）| 1 | Sprint 37 教訓 |
| TD-902 | 統一 permission code 格式（全轉 colon 或保留雙格式）| 1 | Sprint 38 教訓 |
| TD-903 | View feature 整合改進（拖曳順序、列寬設定、列隱藏）| 2 | 延伸功能 |
| TD-904 | View registry 重構（統一管理 view 元件 + icons + validation）| 1.5 | 觀察 1 |
| TD-905 | other CRUD 的 calendar 整合（blog 用 publishedAt、order 用 createdAt）| 1 | 延伸 |
| TD-906 | view 預設設定 UI（admin 可為每個 CRUD 設定 user 預設 view）| 1 | 延伸 |

---

## 結論

**View Feature (Sprint 33-39) 成功**。

| 指標 | 結果 |
|---|---|
| View types | 5（table / todo-list / kanban / calendar / gallery）|
| CRUD specs 支援 | 4 / 4（todo / blog / event / order）|
| 守護測試 | 60+ |
| 整合測試 | ✅ 910/910 + 103/104 E2E |
| 跨 sprint 連續性 | ✅ 7 sprints 連續交付無回歸 |

**教訓總結**：

1. **可擴展 view 架構**：新增 view type 改 4 處，仍可接受（< 5 種 view）
2. **Dev server cache**：spec-loader 跟 Prisma client 都要明確 reload 機制
3. **JSON spec 雙格式**：歷史包袱，TBD
4. **Source-code guard 高 ROI**：view 架構有 60+ 守護測試
5. **HTML5 native DnD**：80% 場景足夠，不需 react-dnd

**Sprint 40+ 方向**：

- **A**：TD-901 spec cache invalidation（dev server 改善）
- **B**：View registry 重構（TD-904）
- **C**：其他 CRUD calendar 整合（TD-905）
- **D**：繼續清 Sprint 27 backlog

由你決定。