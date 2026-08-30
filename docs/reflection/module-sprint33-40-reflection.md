# Module: Sprint 33-40 — View Feature + Bug Fixes 反省報告

> **Module 名稱**: View Feature + Sprint 40 Bug Fixes
> **Module 描述**: CRUD list 多視圖系統（5 種 view）+ 修 mobile actions bug
> **反省日期**: 2026-08-30
> **參與者**: Agent（MiniMax-M3）+ 用戶
> **反省級別**: Module（涵蓋 Sprint 33-40, 8 個 sprint）
> **範圍**: View 架構 + 整合 + Kanban DnD + localStorage + Calendar/Gallery + bug 修復

---

## Module 總覽

| 項目 | 數據 |
|------|------|
| **包含 Sprint** | 8（Sprint 33-40）|
| **計劃 SP** | ~18 SP + 修 bug |
| **實際完成** | 100% |
| **新增/修改檔案** | ~25 個 |
| **新增測試** | 70+ 守護測試 |
| **最終測試基線** | **integration 919/919 + E2E 109/109** |

---

## 完成 Sprint 摘要

| Sprint | 重點 | 結果 |
|---|---|---|
| 33 | JsonSpec.views + ViewRouter + 5 view 元件 + ViewSelector | ✅ 26 unit |
| 34 | UI 整合 + 4 個 CRUD spec 加 views + E2E | ✅ 8 E2E |
| 35 | KanbanView + drag-and-drop 樂觀更新 + rollback | ✅ 8 unit + 4 E2E |
| 36 | KanbanView drag-and-drop + PUT API + 樂觀更新 | ✅ 5 unit + 1 E2E |
| 37 | blog/event/order specs + localStorage 持久化 | ✅ 5 unit + 5 E2E |
| 38 | CalendarView + GalleryView + ViewType 擴展 | ✅ 17 unit |
| 39 | event calendar + blog coverUrl + Prisma migration | ✅ |
| 40-1 | CalendarView 加 renderActions (bug 修復) | ✅ 2 unit |
| 40-2 | 其他 view audit renderActions 用法 | ✅ 5 unit |
| 40-3 | E2E hover menu 可訪問守護測試 | ✅ 5 E2E |
| 40-4 | mobile actions 修法 (hover-reveal → mobile-friendly) | ✅ 2 unit + 1 E2E |

---

## 反省結果總覽

| 檢查維度 | 結果 | 備註 |
|---------|------|------|
| **1. UX/UI 一致性** | ✅ | 4 個 CRUD 都用相同 View 架構 |
| **2. RWD 響應式設計** | ✅ | Sprint 40-4 修復 mobile actions |
| **3. 技術債** | ⚠️ | spec cache、Prisma client cache、coverUrl 雙格式、view registry 重構 |
| **4. 可維護性** | ✅ | 元件獨立、TypeScript strict |
| **5. 測試覆蓋率** | ✅ | 70+ 守護測試覆蓋所有關鍵行為 |
| **6. 需求對齊** | ✅ | 5 種 view 全部可用 + 修 bug |

---

## 跨 Sprint 觀察

### 觀察 1: 守護測試分層策略奏效

不同風險用不同層級的守護測試：
- **Source-code guard**（pattern regex）：防有人改回舊 pattern
- **Component unit test**：驗 props 傳遞、渲染、互動
- **E2E**：驗實際 user flow

Sprint 40-1 bug（CalendarView 沒呼叫 renderActions）就是 source-code guard 能抓住的類型。

### 觀察 2: hover-reveal 是 mobile UX 反模式

很多 admin 後台 UI 用 `opacity-0 group-hover:opacity-100`，但 mobile 沒 hover。

**修法**：用 responsive prefix `opacity-100 md:opacity-0 md:group-hover:opacity-100`：
- mobile：永遠可見
- desktop (md+)：hover 才顯示

未來所有這類 UI 都應該用這個 pattern。

### 觀察 3: Prisma migration 在 dev server 有 cache 問題

Sprint 39-2 加 coverUrl 後，DB 有 column 但 API response 沒回應這個欄位。需要重啟 dev server 才生效。

**生產環境沒這問題**（CI/CD 自動重啟）。

**修法建議**：
- dev 環境可加 hot reload 偵測 Prisma schema 變更
- 或用 watch mode 自動重啟

### 觀察 4: View feature 變更擴展成本

新增一個 view type 需要改 4 處：
1. JsonSpec.ViewType union
2. JsonSpec.viewSchema Zod
3. ViewRouter switch case
4. ViewSelector ICON_MAP

**觀察**：當 view 種類 ≤ 8 時還可接受，但若繼續擴展應考慮 registry 模式：
```ts
const VIEW_REGISTRY = {
  table: { Component: TableView, Icon: Table, defaultProps: {...} },
  calendar: { Component: CalendarView, Icon: CalendarDays, requires: ['dateField'] },
  ...
};
```

### 觀察 5: Spec JSON 雙格式是歷史包袱

- Sprint 21 設計：`users:read`（colon）
- Phase 1 extension：`blog.create`（dot）

雖然 Sprint 38 修好 schema regex 同時接受兩種，但 DB 裡 14 個 todo + 22 個 role 的 permission 都混用。統一格式需要 batch migration。

**修法建議（TD-902）**：
1. 確認內建 spec 用哪種（colon）
2. 寫 migration script 把所有 dot 格式轉 colon
3. 移除 schema 雙格式支援

### 觀察 6: Sprint 40 是「守護測試驅動 bug 修復」典範

用戶回報「Calendar 沒法編輯」後流程：
1. TDD 寫失敗測試（紅）
2. 實作修正（綠）
3. source-code guard 防回歸
4. E2E 守護測試

從單一 bug 衍生出 4 個守護測試（unit + guard + E2E desktop + E2E mobile），每次回歸都會被抓到。

---

## Action Items

### 已完成

| Item | 狀態 |
|---|---|
| 5 種 view 元件 + 整合 | ✅ |
| KanbanView drag-and-drop | ✅ |
| localStorage 持久化 | ✅ |
| Calendar + Gallery 新 view | ✅ |
| blog coverUrl + Prisma migration | ✅ |
| mobile actions 修法 | ✅ |
| 3 個守護測試（audit + mobile actions + actions accessible）| ✅ |

### 下個 Sprint 建議（Backlog items）

| ID | 標題 | SP | 來源 |
|---|---|---|---|
| TD-901 | spec loader cache invalidation（mtime 比對）| 1 | Sprint 37 教訓 |
| TD-902 | 統一 permission code 格式（colon 或保留雙格式）| 1 | Sprint 38 教訓 |
| TD-903 | view feature 整合改進（拖曳順序、列寬設定、列隱藏）| 2 | 延伸功能 |
| TD-904 | view registry 重構（統一管理 view 元件 + icons + validation）| 1.5 | 觀察 4 |
| TD-905 | dev server hot reload Prisma schema 變更 | 0.5 | Sprint 39 教訓 |
| TD-906 | hover-reveal pattern 全面審查（所有 admin UI 元件）| 1 | 觀察 2 |
| TD-907 | view 預設設定 UI（admin 可為每個 CRUD 設定 user 預設 view）| 1 | 延伸功能 |
| TD-908 | blog coverUrl 從 spec 動態生成（不是手動加 Prisma field）| 0.5 | 觀察 5 |

---

## 結論

**Sprint 33-40 View Feature + Bug Fixes 成功**。

| 指標 | 結果 |
|---|---|
| View types | 5（table / todo-list / kanban / calendar / gallery）|
| CRUD specs 支援 | 4 / 4（todo / blog / event / order）|
| 守護測試 | 70+（unit + E2E + source-code guard）|
| 整合測試 | ✅ 919/919 + E2E 109/109 |
| Bug 修復 | 3 個（CalendarView renderActions / mobile actions / coverUrl migration）|

**教訓總結**：

1. **守護測試分層**：source-code / unit / E2E 各司其職
2. **mobile-first**：hover-reveal 不友善，預設 mobile-friendly + desktop 加 hover
3. **Dev server cache**：spec loader + Prisma client 都有 cache 問題
4. **View registry 重構**：當 view > 8 種時考慮統一管理
5. **守護測試驅動 bug 修復**：用戶報 bug → TDD → 守護測試防回歸

**Sprint 41+ 方向**：

- **A**：TD-901 spec loader cache invalidation（dev server 改善）
- **B**：TD-904 view registry 重構
- **C**：TD-906 hover-reveal 全面審查
- **D**：清 Sprint 27 剩餘 backlog

由你決定。