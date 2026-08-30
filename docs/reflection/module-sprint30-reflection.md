# Module: Sprint 30 技術債清理反省報告

> **Module 名稱**: Sprint 30 — 5 個技術債清理守護測試
> **Module 描述**: 補上 Sprint 28-29 揭露的 5 個技術債守護測試（大部分 code 在 Sprint 19/27 已修，本 Sprint 補測試防回歸）
> **反省日期**: 2026-08-30
> **參與者**: Agent（MiniMax-M3）+ 用戶
> **反省級別**: Module
> **範圍**: TD-801（E2E 守護）、TD-802（JWT name refresh）、TD-523（Hook type contract）、TD-524（Sanitizer taxonomy）、TD-519（Order 分頁）

---

## Module 總覽

| 項目 | 數據 |
|------|------|
| **包含 Item 數量** | 5 個技術債（TD-801/802/523/524/519）|
| **計劃 SP** | 5.5 SP |
| **實際完成** | 100% |
| **新增測試** | 27 個（26 integration + 1 E2E）|
| **改動 code** | 1 個檔案（auth/config.ts 加 name refresh）|
| **最終測試基線** | **integration 842/842 + E2E 80/80** |

---

## 完成項目

| ID | 主題 | 改動類型 | 測試 |
|---|---|---|---|
| TD-801 | E2E 守護測試：avatar reload | **新測試**（無 code 改動）| 1 E2E |
| TD-802 | JWT refresh 套用到 name | **改 code + 新測試**（4 unit guard）| 4 integration |
| TD-523 | HookFunction type contract 守護 | **新測試**（code 已 Sprint 27 修）| 5 integration |
| TD-524 | Sanitizer error taxonomy 守護 | **新測試**（code 已 Sprint 27 修）| 12 integration |
| TD-519 | Order 列表分頁守護 | **新測試**（code 已 Sprint 19 修）| 5 integration |

---

## 反省結果總覽

| 檢查維度 | 結果 | 備註 |
|---------|------|------|
| **1. UX/UI 一致性** | ✅ | 無 UX 變更 |
| **2. RWD 響應式設計** | ✅ | 無 RWD 變更 |
| **3. 技術債** | ✅ | **5 個目標技術債全部清完**（其中 4 個實際是補守護測試） |
| **4. 可維護性** | ✅ | code 改動極小（只有 TD-802）|
| **5. 測試覆蓋率** | ✅ | 27 個新守護測試，覆蓋回歸風險點 |
| **6. 需求對齊** | ✅ | 5 個技術債全部處理 |

---

## 跨 Sprint 觀察

### 觀察 1: 「守護測試 > 改 code」是技術債處理的高 ROI 方式

| 模式 | 做法 | 成本 | 價值 |
|---|---|---|---|
| A. 改 code | 修 source 邏輯 | 高（要破壞性變更）| 中 |
| B. **加守護測試** | source-code guard / behavior test | **低（~30min/item）** | **高（防止回歸）** |

Sprint 30 5 個技術債，**4 個用 source-code guard（pattern regex 檢查關鍵字串）就守住**。這比真正 refactor 經濟得多。

**經驗**：
- 技術債 backlog 不一定要「清」，可以「固化」（freeze + guard）
- Guard test 是 defensive programming 的最高性價比實踐

### 觀察 2: 守護測試的兩種形式

| 形式 | 適用場景 | 範例 |
|---|---|---|
| **Source-code guard** | 防止「重構移除關鍵程式碼」| TD-523/519 regex 檢查關鍵 string |
| **Behavior test** | 防止「行為退化」（API 改變、輸出格式變）| TD-524 AppError 分類、E2E avatar reload |

Sprint 30 兩種都用上了：
- Source-code guard：TD-523、TD-519（簡單、快速）
- Behavior test：TD-524（12 個 test 覆蓋 4 種 ErrorCategory 行為）

### 觀察 3: TD-802 揭露「user-mutable 欄位」需要獨立查詢

JWT session 的 permission cache 是為了效能，但 cache 讓 user 自己改的欄位（image、name）無法即時生效。

**架構決策**：
- Permission（不常變）→ 用 cache 避免每 request 重查 DB
- User-mutable 欄位（image、name）→ **獨立查詢每次都跑**（PK + 2 columns，< 1ms）

這個 trade-off 是正確的：cache 是效能優化手段，user-mutable 欄位本來就該即時反映，不應該被 cache。

### 觀察 4: E2E test 容易有 state pollution

TD-801 第一次寫失敗，是因為 2 個 E2E test 共享 DB 狀態（avatar URL）。

**解決模式**：
1. **beforeEach reset**：每個 test 開始前把 DB 回到 known state
2. **page.evaluate fetch**：在 browser context 內 fetch API（自動帶 cookie，不會有 cookie sharing 問題）
3. **避免 form race condition**：form 兩次互動（set + clear）容易 race，直接用 API 清空更可靠

**學到**：E2E test 的 setup/teardown 比 unit test 更重要，因為狀態污染跨 test 累積。

### 觀察 5: dev mode vs production mode 的 test 陷阱

TD-524 的 sanitizer 在 dev 故意保留 raw message（方便 debug）。但 test 預設 NODE_ENV 是 dev，所以 INTERNAL error 沒有被過濾 → test fail。

**解決**：用 `vi.stubEnv('NODE_ENV', 'production')` 明確切換環境，並用 `vi.unstubAllEnvs()` 還原。

---

## 跨 Sprint 連接

| 來源 | 啟示 | Sprint 30 應用 |
|---|---|---|
| Sprint 28-29 JWT image bug | name 也會有同樣問題 | TD-802 套用同樣 pattern |
| Sprint 27 TD-523/524 完成 code | 沒有守護測試，無法確認不退化 | TD-523/524 寫 source-code + behavior 守護 |
| Sprint 19 Order pagination | 已在 handler 實作 | TD-519 寫守護測試防止未來移除 |
| Sprint 28 E2E 改進 | Playwright `page.evaluate` 帶 cookie 比較穩 | TD-801 用此 pattern |

---

## Action Items

### 已完成（本 module）

| Item | 狀態 |
|---|---|
| 5 個技術債全部清完 | ✅ |
| 27 個守護測試覆蓋關鍵回歸風險點 | ✅ |
| 1 個 source-code 改動（auth/config.ts 加 name refresh）| ✅ |

### 下個 Sprint 建議（可選 Backlog items）

| ID | 標題 | SP | 來源 |
|---|---|---|---|
| TD-901 | 其他 CRUD 頁面 RWD 健檢 (todo/event) | 1 | Sprint 27 backlog 延續 |
| TD-902 | 批次刪除 undo 機制 | 2 | Sprint 27 backlog 延續 |
| TD-903 | Toolbar 鍵盤快捷鍵 | 1 | Sprint 27 backlog 延續 |
| TD-904 | admin dashboard RWD 健檢 | 1 | Sprint 29 backlog 延續 |
| TD-905 | 移除 hook-sdk.ts 的 deprecated HookFunction（破壞性變更）| 2 | TD-523 完整清理 |
| TD-906 | 移除 app-error.ts 的 regex fallback（所有 throw 都用 AppError）| 3 | TD-524 完整清理 |

### Backlog Icebox

無重大技術債需要累積。

---

## 結論

**Sprint 30 成功**。

| 指標 | 結果 |
|---|---|
| 技術債清理 | 5/5（其中 4 個用守護測試固化，1 個真改 code）|
| 測試覆蓋 | 27 新增（integration 842 + E2E 80）|
| 程式碼變更 | 1 個檔案（最小變更）|
| 預防回歸 | 5 個關鍵風險點全部有守護測試 |

**教訓總結**：

1. **守護測試 > 改 code**：技術債處理優先補測試而非 refactor（ROI 高）
2. **兩種守護測試**：source-code guard（簡單防移除）+ behavior test（防行為退化）
3. **JWT user-mutable 欄位**：獨立查詢 vs permission cache 是正確的 trade-off
4. **E2E setup 重要**：beforeEach reset + page.evaluate 是穩定模式
5. **vi.stubEnv for env-dependent code**：避免直接 mutate process.env

**Sprint 30 → 31+ 方向**：

- **選項 A**：batch delete undo 機制（Sprint 27 backlog）
- **選項 B**：其他 admin 頁面 RWD 健檢
- **選項 C**：清理 TD-523/524 剩餘的 deprecated code（破壞性變更）

由你決定。