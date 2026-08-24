# Backlog 盤點更新報告（2026-08-24 第二次完整盤點）

> **觸發**：用戶主動要求「check backlog.md 中有什麼是已經做好了」
> **方法**：對 22 個非 Done 項目逐一檢查實際程式碼

---

## 🎯 最終結果

**22 個項目中，再發現 7 個已完成（總共 18 個已完成但未更新狀態）**

---

## ✅ 本次新發現已完成的 7 個項目

| ID | 標題 | 證據 |
|----|------|------|
| **TD-511** | Playwright webServer 設定 | `playwright.config.ts` 有 `useWebServer` 邏輯（PLAYWRIGHT_WEBSERVER=auto）+ `test:e2e:ci` script |
| **TD-513** | use-chat-sessions 測試 | `app/chat/hooks/use-chat-sessions.test.ts` 16 個 case |
| **US-107** | 管理已安裝 Extension | `/admin/extensions` 頁面完整實作（列出 / 啟用 / 停用）|
| **US-207** | Blog Extension 加 hook | `extensions/blog/hooks/before-create.ts`（slug + excerpt + status）+ `actions/publish.ts` |
| **TECH-003** | Extension 開發規範 | `docs/specs/extension-spec.md` 存在 |
| **TECH-004** | 雙模型抽象層 | `lib/ai/providers/providers.ts` 含 OpenAI + Anthropic |
| **TECH-006** | Workflow Engine | `lib/state-machine/state-machine.ts` 本 session 完成 |

---

## 📊 累計盤點（兩次合計）

### 已完成但原本 backlog 顯示待做（18 個）

| 第一次盤點（commit `4d289bf`）| 第二次盤點（本 commit）|
|------------------------------|----------------------|
| TD-301 / TD-303 / TD-401 / TD-403 / TD-404 / TD-406 / TD-515 / US-201 / US-202 / US-203 / TD-302 (Cancel) | TD-511 / TD-513 / US-107 / US-207 / TECH-003 / TECH-004 / TECH-006 |

**兩次合計：17 個項目 Done + 1 個 Cancel = 18 個**

### 真實未做（仍待做）

| ID | 標題 | 證據 |
|----|------|------|
| TD-304 | Pipeline Stage 泛型 | `<TIn=any, TOut=any>` 在 pipeline-runner.ts:43 |
| TD-402 | Extension grid RWD | 沒有 RWD 處理 |
| TD-507 | pnpm 11 workaround | 沒有 .npmrc 設定 |
| TD-512 | E2E mock SW 相容性 | 沒有 SW 程式碼（可能是「未來風險預留」）|
| US-102-P2 | 動態 RBAC | 已記錄待做 |
| US-104 | AI 模型配置 UI | provider 存在但「配置 UI」未做 |
| US-105 | AI 對話界面 | chat UI 存在但「解析需求/生成 JSON」待驗證 |
| US-106 | AI 生成 Extension | 無此機制 |
| US-108 | 下載 JSON | 無此功能 |
| US-204 | 訂單狀態機範例 | extensions/order 不存在 |
| US-205 | 審批請假單 | extensions/leave 不存在 |
| US-206 | AI 生成狀態機 | 無此功能 |
| EN-301 | MVP 完成後改進 | Icebox（沒做）|

**13 個項目真實未做**

---

## 🤔 為什麼盤點 2 次才找全？

### 第一次盤點（commit `4d289bf`）

只盤點了**我自己寫進 Sprint 7 plan 的項目**（5 個項目），漏了其他 17 個項目。

### 第二次盤點（本 commit）

用戶要求做**完整盤點**（22 個非 Done 項目逐一檢查），才發現另外 7 個已完成。

### 教訓

> **盤點必須 100% 覆蓋所有非 Done 項目**，不能只盤點「正在 sprint 計畫中的項目」。

---

## 📝 更新行動

### 1. ✅ 完成：更新 backlog 7 個項目為 Done

| ID | 狀態變更 |
|----|----------|
| TD-511 | 📋 Ready → ✅ Done |
| TD-513 | 📋 Ready → ✅ Done |
| US-107 | 📋 Backlog → ✅ Done |
| US-207 | 📋 Backlog → ✅ Done |
| TECH-003 | 📋 Backlog → ✅ Done |
| TECH-004 | 📋 Ready → ✅ Done |
| TECH-006 | 🔜 Ready → ✅ Done |

### 2. 待評估：US-104 / US-105 「部分完成」狀態

需要更深入檢查才能確定是 Done 還是「部分」。這留給未來盤點。

### 3. 仍然待做的 13 個項目

| Sprint | 候選工作 |
|--------|---------|
| **Sprint 8** | US-204 訂單狀態機範例（8 SP）|
| **Sprint 9** | US-104 AI 模型配置 UI（5 SP，可能部分完成）|
| **Sprint 10** | US-105 AI 對話界面（5 SP，可能部分完成）|
| **Sprint 11** | US-205 審批請假單（5 SP）+ US-102-P2 動態 RBAC（5 SP）|
| **Sprint 12** | US-206 AI 生成狀態機（8 SP）+ US-106 AI 生成 Extension（8 SP）|
| **Tech Debt** | TD-304 / TD-402 / TD-507 / TD-512（~3 SP 合計）|
| **小任務** | US-108 下載 JSON（1 SP，可隨時做）|

---

## 🎓 最終學到的教訓

1. **Backlog 失同步是嚴重問題**：18 個項目早已完成未記錄，會誤導 roadmap 規劃
2. **盤點要 100% 覆蓋**：不能只盤點「sprint 計畫中」的項目
3. **每個 sprint 結束都要做盤點**：避免 backlog 累積失同步
4. **誠實面對問題**：用戶主動質疑「未做好」是有道理的（11 個項目不存在 + 7 個已完成未記錄）

---

## ✅ 下次盤點建議時機

- 每個 Sprint 結束 reflection 時（必須）
- 每次 sprint 計劃寫之前（必須）
- 任何時候用戶質疑 backlog 狀態時（建議）