# Sprint 27 Reflection — Clean Code 改進 (TD-523 + TD-524)

> **Sprint**: 27
> **日期**: 2026-08-26
> **狀態**: ✅ **100% 收尾（2.5/2.5 SP）**
> **對應 Backlog**: TD-523, TD-524 (Sprint 26 reflection 揭露)

---

## 🎯 Sprint 目標

依 Sprint 26 reflection 揭露的 2 個新 TD：

| ID | 描述 |
|---|---|
| TD-523 | Hook function type contract 太鬆 |
| TD-524 | Sanitizer 用 regex 而非 error taxonomy |

---

## 📊 最終數據

| 項目 | 數據 |
|---|---|
| **總 SP** | **2.5 / 2.5**（100%）|
| **Commits** | 2 個 + 1 docs = 3 個 push |
| **新增檔案** | 2 個（`app-error.ts` + `strict-hook-function.test.ts`）|
| **修改檔案** | 1 個（`hook-sdk.ts`）|
| **新增測試** | **21 個** |
| **測試基線** | 1054 → **1075 通過**（+21 新測試）|
| **4 Gate 全綠** | ✅ |

---

## 📅 Sprint 27 執行紀錄

| Day | 計劃 | 實際 | 狀態 |
|---|---|---|---|
| Day 1 | Plan Gate (Q1-Q4) | ✅ Q1: 2 TD / Q2: 分開 2 commits / Q3: 雙軌制 / Q4: class + enum | ✅ |
| Day 2 | commit 1 (TD-523) | ✅ pushed `d89dc53` | ✅ |
| Day 3 | commit 2 (TD-524) | ✅ pushed `2b33387` | ✅ |
| Day 4 | Sprint 27 reflection（本檔）| ✅ | ✅ |

---

## 🎯 Plan Gate 決議

| Q# | 問題 | 決策 |
|---|---|---|
| Q1 範圍 | TD-523 + TD-524 | ✅ A：一起做 (2.5 SP) |
| Q2 執行順序 | 兩個 TD 分開 | ✅ A：分開 2 commits，TD-523 先 |
| Q3 TD-523 測試 | 雙軌制 | ✅ A：新舊並存 + deprecated 註解 |
| Q4 TD-524 設計 | class + enum | ✅ A：class AppError + ErrorCategory enum + instanceof |

---

## 🏗️ 各 commit 詳細成果

### commit 1 — TD-523

| 檔案 | 改動 |
|---|---|
| `lib/hooks/hook-sdk.ts` | 新 `StrictHookFunction<T extends HookName>` 強制 `HookResult<T>` 類型契約；舊 `HookFunction<T = unknown>` 標 @deprecated |
| `lib/hooks/strict-hook-function.test.ts` | 🆕 7 個 type-level 測試 |

**關鍵設計**：
- 雙軌制：舊 `HookFunction` 保留（向後相容），新 `StrictHookFunction` 強制 type contract
- 4 個 production hook 不需改（繼續用 `HookFunction` 註冊）

### commit 2 — TD-524

| 檔案 | 改動 |
|---|---|
| `lib/runtime/app-error.ts` | 🆕 ErrorCategory enum (VALIDATION/BUSINESS_RULE/EXTENSION/INTERNAL) + AppError class + classifyError + sanitizeErrorMessageV2 |
| `tests/integration/app-error.test.ts` | 🆕 14 個測試（含 dev/production 雙環境）|

**關鍵設計**：
- Class-based：debug 友善（instanceof 檢查）
- 向後相容：舊 `throw new Error(...)` 仍走 regex fallback
- 雙軌制：sanitizeErrorMessageV2 與舊版並存

---

## 🎯 端到端驗證

| 場景 | 結果 |
|---|---|
| 既有 1054 個測試仍綠 | ✅ |
| TD-523 new tests | ✅ 7 個通過 |
| TD-524 new tests | ✅ 14 個通過 |
| **總計** | **1075/1075 全綠** |

---

## 🎓 關鍵學習

### L19：Class-based Error vs Regex-based 維護性比較

**Regex-based 問題**（舊）：
- 新錯誤訊息需手動加 regex
- 訊息變更時 regex 失效（silent regression）
- 無法在 IDE 看到所有「安全訊息」列舉
- 4 個 regex 補了，但結構性問題未解

**Class-based 優勢**（新）：
- `throw new AppError('msg', ErrorCategory.BUSINESS_RULE)` 顯式標記
- Sanitizer 改用 `instanceof AppError`（O(1) 比 regex O(n)）
- 4 種 category 在 enum 集中定義，IDE 自動提示
- 自動補完：寫 `new AppError('x', ErrorCategory.)` IDE 列出 4 個選項

### L20：雙軌制的演進模式（已建立 SOP）

**Sprint 25 + 27 雙軌制模式**：
1. 新增 strict/type-safe 版本
2. 舊版本標 @deprecated 但不刪
3. 既有 callers 不需立即 migrate
4. 漸進式：未來 sprint 可選擇性完全刪除舊版

**優點**：
- 零 breaking change
- 新 code 鼓勵用 strict 版本
- 舊 code 有時間 migrate（不強制時程）

**Sprint 25 案例**：`hasDynamicPermission`（新）+ `hasPermission` 標 @deprecated
**Sprint 27 案例**：`StrictHookFunction`（新）+ `HookFunction` 標 @deprecated + `AppError`（新）+ 舊 `throw new Error` 走 regex fallback

### L21：TypeScript Function Contravariance 與向後相容

**問題**：
- `HookFunction<T = unknown>` 的 ctx 是 `unknown`（向下相容）
- `StrictHookFunction<T extends HookName>` 的 ctx 是 `HookContext<T>`（嚴格）
- 兩者 assignable 關係: `HookFunction` (接受 unknown) 不能直接接 `HookContext` (更窄)

**解決**：
- `HookFunction<T = unknown>` 內部仍用 `T`（讓 `registerHook<T>` 能泛型化）
- 對外 contract：舊 hook 簽名 `(ctx: any)` → 改用 `unknown`（更 type-safe）
- 雙軌制：StrictHookFunction 需要 cast 才能 assignable to HookFunction（測試有 `as unknown as HookFunction`）

**設計選擇**：保留 `HookFunction<T = unknown>` 而非完全刪除，避免破壞既有 4 個 production hook

---

## 📈 Phase 2 RBAC + Sprint 20-27 累計

| 項目 | 累計 |
|---|---|
| **Sprints 完成** | Sprint 21-27（7 sprints）|
| **SP 累計** | 16.25 + 2.5 = **18.75 SP** |
| **測試累計** | 923 → **1075**（+152 測試）|
| **TD 累計修正** | TD-1 ~ TD-7 + TD-401 ~ TD-405 + TD-523 + TD-524 = **11 個 TD** |
| **新 SOP 規則** | 18 條（L1-L21）+ 2 條 refactor（R1-R2）|

---

## 🏆 Sprint 27 收尾確認

- ✅ **2.5/2.5 SP**（100%）
- ✅ **TD-523**（StrictHookFunction + 雙軌制）pushed
- ✅ **TD-524**（AppError + ErrorCategory）pushed
- ✅ **21 個新測試全綠**
- ✅ **1075/1075 tests 全綠**
- ✅ **4 Gate 全綠**

**Sprint 27 正式結束。Sprint 26 reflection 揭露的 2 個 clean code 改進 TD 全部完成。**

---

**Reflection 作者**: AI Assistant
**Reviewer**: AI Assistant（Gate 4 self-check）
**日期**: 2026-08-26