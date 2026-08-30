# Module: Sprint 31 — 用戶報 Bug + Admin RWD 健檢反省報告

> **Module 名稱**: Sprint 31 — 用戶報 Bug + Admin RWD 健檢
> **Module 描述**: TD-911（`*` wildcard bug）+ TD-911b（permission code 雙格式）+ Sprint 31-1（admin 頁面 RWD 守護測試）
> **反省日期**: 2026-08-30
> **參與者**: Agent（MiniMax-M3）+ 用戶
> **反省級別**: Module

---

## Module 總覽

| 項目 | 數據 |
|------|------|
| **包含 Items** | 3 個（TD-911、TD-911b、Sprint 31-1 RWD）|
| **計劃 SP** | ~3 SP |
| **實際完成** | 100% |
| **新增測試** | 12 個（4 unit + 3 unit + 5 E2E）|
| **最終測試基線** | **integration 849/849 + E2E 85/85** |

---

## 完成的 3 個項目

| # | ID | 主題 | 改動 | 測試 |
|---|---|---|---|---|
| 1 | TD-911 | `*` wildcard 過濾 | API GET filter + PATCH reject + 前端 filter | 4 unit |
| 2 | TD-911b | permission code 雙格式（`:` + `.`）| Zod regex 改用 `[:.]` | 3 unit |
| 3 | Sprint 31-1 | admin 頁面 mobile RWD | 5 E2E 守護測試（無 overflow）| 5 E2E |

---

## 反省結果總覽

| 檢查維度 | 結果 | 備註 |
|---------|------|------|
| **1. UX/UI 一致性** | ✅ | 矩陣頁面 3 層防禦後 `*` row 不再出現 |
| **2. RWD 響應式設計** | ✅ | dashboard / extensions / users / roles / matrix 5 頁 375px 全過 |
| **3. 技術債** | ✅ | 2 個用戶報 bug 全部修，加守護測試防回歸 |
| **4. 可維護性** | ✅ | 改動集中在 Zod regex + 2 個 API filter |
| **5. 測試覆蓋率** | ✅ | 12 個新測試（含 regression 守護）|
| **6. 需求對齊** | ✅ | 用戶報的 bug 全部修好 |

---

## TD-911 / TD-911b 細節

### TD-911 Bug 根因

`/api/admin/permissions` 從 DB 撈所有 permissions，**沒過濾 `*`（admin wildcard meta-permission）**。

用戶（或測試）點 `*` row → 存進 DB → 之後每次都顯示怪 row（resource=`*`, label=`*`, code=`*`）。

### 3 層防禦修法

1. **API GET filter**：`loadPermissionCodes()` 後過濾掉 `PermissionCode.ADMIN_WILDCARD`
2. **API PATCH reject**：`codes.includes('*')` 直接 return 400 with 明確錯誤訊息
3. **前端 defensive filter**：即使 API 漏 filter，前端再 filter 一次保險

### Zod regex 修正（TD-911b）

| 類型 | 格式 | 來源 |
|---|---|---|
| 內建權限 | `users:read` | Sprint 21 設計（colon 分隔）|
| Extension 權限 | `blog.create` | Phase 1 extension manifest（dot 分隔）|

舊 regex 只接受 `:`，導致 `blog.create` 點擊 400 驗證失敗。

新 regex：`^(\*|[a-z][a-z0-9_]*[:.][a-z][a-z0-9_]*)$` — 用 `[:.]` 同時接受兩種分隔符。

---

## Sprint 31-1 RWD 健檢結果

| 頁面 | 375px overflow | 1440px 布局 | 結論 |
|---|---|---|---|
| `/admin` (Dashboard) | ✅ | ✅ | OK |
| `/admin/extensions` | ✅ | ✅ | OK |
| `/admin/users` | ✅ | ✅ | OK |
| `/admin/roles` | ✅ | ✅ | OK |
| `/admin/roles/[id]/permissions` (matrix) | ✅ | ✅ | OK |

**Sprint 27 修 blog RWD 的時候，flex layout `min-w-0` fix 同時修復了所有 admin 頁面**。所以不需要再修任何 RWD bug，只需加守護測試防回歸。

---

## 跨 Sprint 觀察

### 觀察 1: 用戶報的 bug 多半是 3 層 root cause

TD-911 是 3 層（API / API / 前端）。只看一層修不夠。

**修法模式**：
- 找 root cause（不只是症狀）
- 評估每層的暴露面
- 在最接近 source 的層修（API），並在前端加 defensive check

### 觀察 2: Test fixture 應貼近真實資料

TD-911b 是因為測試 fixture 都用 `users:read`（colon 風格），沒測 dot 風格。Sprint 21 refactor 後忘了回頭測試 Phase 1 既有資料。

**經驗**：
- 重構後要保留「兩種格式都測」的測試
- 真實 DB 資料型態應該被測試覆蓋，不只是測試 fixture 假設的

### 觀察 3: Sprint 27 修的 RWD 同時修好所有頁面

| Sprint | 修的 bug | 同時修好 |
|---|---|---|
| Sprint 27 | blog mobile RWD | 所有 admin 頁面 |
| Sprint 31-1 | RWD 健檢（5 頁）| 0 個新 bug |

`flex container min-w-0` 是底層 fix，在 admin-shell 包了 sidebar 後，所有內部頁面自動受益。

**經驗**：底層 fix 投資報酬率高，不需要逐頁修。

### 觀察 4: Zod regex 容易變成隱形契約

| 風險 | 對策 |
|---|---|
| regex 寫死格式 | 寫測試覆蓋所有合法格式 |
| regex 不接受新格式 | 重構時確認現有資料覆蓋 |
| regex 沒有錯誤訊息 | 自訂 message 告訴用戶格式 |

---

## Action Items

### 已完成（本 module）

| Item | 狀態 |
|---|---|
| TD-911 `*` wildcard bug 修法（3 層）| ✅ |
| TD-911b permission code 雙格式 | ✅ |
| DB 清理（刪除已存在的 `*` permissions）| ✅ |
| Sprint 31-1 admin RWD 守護測試（5 E2E）| ✅ |

### 下個 Sprint 建議（Backlog items）

| ID | 標題 | SP | 來源 |
|---|---|---|---|
| TD-1001 | API/DB 一致性測試（測真實 schema，不只 fixture）| 1 | Sprint 31 教訓 |
| TD-1002 | 統一 permission code 格式（建議全轉 colon 或保留雙格式）| 1 | Sprint 31 教訓 |
| TD-1003 | User CRUD form RWD 健檢（/admin/users/new, /admin/users/[id]/edit）| 1 | Sprint 27 backlog 延續 |
| TD-1004 | CRUD form RWD 健檢（/admin/crud/[spec]/new, /[id]/edit）| 1 | Sprint 27 backlog 延續 |

---

## 結論

**Sprint 31 成功**。

| 指標 | 結果 |
|---|---|
| 用戶報 bug | 2/2 修好 |
| 新增測試 | 12（4 + 3 + 5）|
| RWD 健檢 | 5 個 admin 頁面全部通過 |
| 程式碼改動 | 最小（2 個檔案：API route + 矩陣 client）|

**教訓總結**：

1. **用戶報 bug 多半是 3 層 root cause** — 修最底層 + 多層 defensive check
2. **Test fixture 應貼近真實資料** — 覆蓋所有合法格式，不只是測試假設的
3. **底層 fix 投資報酬率高** — Sprint 27 的 min-w-0 自動修了所有 admin 頁面
4. **Zod regex 是隱形契約** — 重構時要確認所有合法格式都被測試覆蓋

---

## 最終 Gate

| Gate | 結果 |
|---|---|
| typecheck | ✅ 0 errors |
| integration | ✅ **849/849** |
| E2E | ✅ **85/85** |

---

下一步想做什麼？幾個方向：
- **A**：繼續清 Sprint 27 backlog（user CRUD form / crud form RWD）
- **B**：回 Sprint 28-29 backlog（extensions page / role 矩陣頁 RWD）
- **C**：開新 feature（例如 batch delete undo 或 keyboard shortcuts）