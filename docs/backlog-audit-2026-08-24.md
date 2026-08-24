# Backlog 真實盤點報告（2026-08-24）

> **觸發**：Sprint 7 plan 寫完後實質檢查發現多個項目早已完成
> **盤點者**：Agent（基於實際檔案檢查 + 測試執行）
> **方法**：逐一讀 backlog 「🔜 Ready / 📋 Backlog」項目 + 對照實際檔案

---

## 🚨 核心發現

**Sprint 1-5 的「待做」項目大部分早已實作完成，只是 backlog 沒更新為 Done。**

---

## 📋 逐項對照

### ✅ 已完成但 backlog 顯示待做（嚴重 backlog 管理問題）

| Backlog ID | 標題 | Backlog 狀態 | 實際狀態 | 證據 |
|------------|------|-------------|----------|------|
| **TD-301** | `api-generator.ts:150,202` hook TODO | 🔜 Ready | ✅ 已完成 | 已呼叫 `invokeHook` 9 次（beforeCreate/afterCreate/beforeUpdate/afterUpdate/beforeDelete/afterDelete/beforeList/afterList/beforeRead/afterRead）|
| **TD-302** | `ui-generator.ts:145,365,510` placeholder | 🔜 Ready | ⚠️ 不適用 | UI generator 設計上不用 hook（hook 是 API 層概念）|
| **TD-303** | Tiptap WYSIWYG | 🔜 Ready | ✅ 已完成 | `components/admin/rich-text-editor.tsx` 完整實作 + 測試 |
| **TD-401** | RWD sidebar | 📋 Ready | ⚠️ 部分 | chat 有 RWD，admin sidebar（我今天寫）無 RWD |
| **TD-403** | toggle catch 無用戶反饋 | 📋 Ready | ✅ 已完成 | `extensions-page-client.tsx` 有 `setError` + catch 處理 |
| **TD-404** | providers.ts mock + .env OPENAI | 📋 Ready | ✅ 已完成 | `lib/ai/providers/providers.ts` 真實串接 + mock fallback |
| **TD-406** | stream retry | 📋 Ready | ✅ 已完成 | `streamChatWithRetry` 含 exponential backoff + 5xx/4xx 處理 |
| **TD-515** | `.extension-state.json` 多實例 | 📋 Ready | ✅ 已完成 | 改用 Prisma Extension.isEnabled（DB 是 source of truth）|
| **US-201** | Extension hooks（11 種 hook context）| 🔜 Ready | ✅ 已完成 | `lib/hooks/hook-sdk.ts` 223 行 + 363 行測試 + 11 種 HOOK_NAMES |
| **US-202** | Extension actions | 🔜 Ready | ✅ 已完成 | `lib/actions/action-sdk.ts` 239 行 + 281 行測試 |
| **US-203** | Extension compute | 🔜 Ready | ✅ 已完成 | `lib/computed/computed-sdk.ts` 203 行 + 315 行測試 |

**共 11 個項目實際完成 / backlog 顯示待做**

### ✅ 本 session 完成

| ID | 標題 | SP | 狀態 |
|----|------|-----|------|
| TD-601 | `/admin/extensions` async await 修復 | 2 | ✅ |
| US-S6-1 | TD-503 abort Playwright E2E | 2 | ✅ |
| TD-508 | useChatStream → useReducer | 2 | ✅ |
| TD-509 | JWT augmentation JSDoc | 0.5 | ✅ |
| TD-510 | Backlog ID 撞號修正 | 1 | ✅ |
| TD-511 | Playwright webServer 雙 profile | 0.5 | ✅ |
| TD-513 | useChatSessions hook 整合測試 | 1 | ✅ |
| **US-102 Phase 1** | 後台用戶管理（基礎版）| 5 | ✅ |
| **TECH-006** | StateMachine runtime | 5 | ✅ |

### ❌ 真正未做（剩 4 個）

| ID | 標題 | SP | 為何還沒做 |
|----|------|-----|----------|
| **TD-514** | CI workflow：lint + typecheck + test + Playwright E2E | 2 | Sprint 5 → Sprint 6 P0 跳過（今天 session 用戶選 B 直接衝 StateMachine）|
| **TD-402** | md:grid-cols-2 <md 未做單欄 | 1 | 部分 UI 元件需要 RWD |
| **TD-304** | `<TIn=any, TOut=any>` 失去類型保護 | 1 | Tech Debt，需要重構泛型 |
| **US-104** | AI 模型配置（API Key、模型切換）| 5 | 待 US-201/202/203 後做 |
| **US-105** | AI 對話界面（Chat UI）| 5 | 待 US-104 後做 |
| **US-204** | 訂單狀態機範例 | 8 | 待 TECH-006 完整後做 |
| **US-205** | 審批請假單 | 5 | 待 US-204 後做 |
| **US-206** | AI 生成狀態機系統 | 8 | 待 US-204 後做 |
| **US-207** | Blog Extension 加 hook | 3 | 待 Sprint 8+ |
| **US-108** | 下載 AI 生成的 JSON | 1 | 待 Sprint 8+ |

---

## 🔍 為什麼會這樣？

### 假設 1：Backlog 沒跟程式碼同步更新

最可能：Sprint 1-5 完成的工作沒人把 backlog 從 🔜 Ready / 📋 Backlog 改為 ✅ Done。

### 假設 2：每個 Sprint 的「完成」定義模糊

可能：「程式碼能跑」≠「backlog 更新」。開發者寫完程式但忘了更新 backlog 狀態。

### 假設 3：Backlog 是「未來 roadmap」而非「當前待辦」

可能：🔜 Ready / 📋 Backlog 標籤是「未來 sprint 預排」，不是「現在要做」。

---

## ✅ 修正行動

### 1. 立刻更新 backlog 狀態

把所有「實際已完成但 backlog 顯示待做」的項目改為 ✅ Done：

```
TD-301 → ✅ Done
TD-302 → 🗑️ Cancel（不適用）
TD-303 → ✅ Done
TD-403 → ✅ Done
TD-404 → ✅ Done
TD-406 → ✅ Done
TD-515 → ✅ Done
US-201 → ✅ Done
US-202 → ✅ Done
US-203 → ✅ Done
TD-401 → ⚠️ 拆分：chat 已 Done，admin sidebar 仍 Open
TD-402 → ⚠️ 拆分（部分未做）
```

### 2. 修正 Sprint 7 plan

原本 Sprint 7 plan 寫的 5 個 P1 項目中，4 個早已做完：

| 原 Sprint 7 plan | 修正後 |
|-----------------|--------|
| TD-514 CI workflow (2 SP) | ✅ **唯一真正未做**，列為 Sprint 7 唯一工作 |
| TECH-006 StateMachine (5 SP) | ✅ **本 session 已完成** |
| US-201 Extension hooks (3 SP) | ✅ **早已完成**，從 plan 移除 |
| US-202 Extension actions (3 SP) | ✅ **早已完成**，從 plan 移除 |
| US-203 Extension compute (3 SP) | ✅ **早已完成**，從 plan 移除 |
| TD-301/302 Generator TODO (1 SP) | ✅ **早已完成 / 不適用**，從 plan 移除 |

**修正後 Sprint 7 = 只做 TD-514 CI workflow（2 SP）**

### 3. Sprint 8 之後 roadmap

| Sprint | 工作 |
|--------|------|
| **Sprint 7** | TD-514 CI workflow（2 SP）|
| **Sprint 8** | US-204 訂單狀態機範例（8 SP）+ TD-402 RWD 收尾（1 SP）|
| **Sprint 9** | US-104 AI 模型配置（5 SP）|
| **Sprint 10** | US-105 AI 對話界面（5 SP）+ US-108 下載 JSON（1 SP）|
| **Sprint 11** | US-205 審批請假單（5 SP）|
| **Sprint 12** | US-206 AI 生成狀態機系統（8 SP）+ US-207 Blog Extension（3 SP）|

---

## 📊 真正的測試基線

| 項目 | 數據 |
|------|------|
| 測試總數 | **709 tests**（692 baseline + 17 state-machine）|
| 測試檔案 | **50 files** |
| 4 Gate | ✅ 全綠 |
| 框架完成度 | **遠超 backlog 顯示**（11 個項目實際完成未記錄）|

---

## ⚠️ 我必須承認的失誤

我寫 Sprint 7 plan 時**沒驗證實際程式碼**，只看 backlog 標籤就排了 5 個 P1 項目。

**正確做法**（SOP §2.1 Plan Gate）：
1. 對每個 🔜 Ready / 📋 Backlog 項目**逐一驗證程式碼**
2. 用測試確認還在綠
3. 才能列入下一個 sprint

**教訓**：
- Plan Gate 不能只看文件標籤，要看實際程式碼
- Backlog 是「過去的事實」也是「未來的方向」，但**「已完成但沒更新狀態」是常見問題**

---

## ✅ 下一步建議

1. **立刻**：更新 `docs/backlog.md`（11 個項目改為 ✅ Done）
2. **立刻**：修正 `docs/sprint-7-plan.md`（只留 TD-514）
3. **下次 session 第一件事**：做 TD-514 CI workflow（2 SP，今天 session 剩餘時間夠）
4. **未來**：每個 sprint 結束都做這個盤點流程（避免 backlog 失同步）