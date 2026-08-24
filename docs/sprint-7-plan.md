# Sprint 7 計劃（US-102 Phase 2 + Sprint 1-6 漏網工作清理）

> **Sprint 範圍**: Sprint 7 — CI 基礎建設 + Extension 核心 + StateMachine 基礎
> **計劃日期**: 2026-08-24（基於本次 session 對齊）
> **參與者**: Agent + 用戶
> **計劃級別**: Sprint
> **觸發原因**: 用戶主動質疑「Sprint 1-5 都有工作未做好」，重新對齊優先順序

---

## Sprint 總覽

| 項目 | 數據 |
|------|------|
| 計劃完成 US | 5 個（見下方 US 列表） |
| 計劃 Story Points | 17 SP（2 + 5 + 3 + 3 + 3 + 1） |
| Sprint 開始狀態 | 692 tests / 49 files / 4 Gate 全綠；backlog 雜亂、未對齊優先順序 |
| Sprint 結束狀態 | ⏳ 待執行 |
| 預估測試增量 | +30~50 tests |
| 預估 E2E 增量 | +1~2 E2E 場景（如適用） |

---

## 🎯 計劃 US 列表

| 優先 | ID | 標題 | 計劃 SP | 為何排此處 |
|------|-----|------|---------|-----------|
| **P0** | **TD-514** | CI workflow：lint + typecheck + test + Playwright E2E | 2 | 沒 CI = 沒保護，所有 Sprint 1-6 漏的 bug 都會悄悄回歸。是 Sprint 6 reflection 自己列的 P0。 |
| **P1-A** | **TECH-006** | StateMachine + DSL + Runtime + API 基礎 | 5 | US-204 / US-205 的依賴。不做就無法做訂單狀態機範例。 |
| **P1-B** | **US-201** | Extension 提供 hook 函數（11 種 hook context），JSON 用 `{{fn:...}}` 引用 | 3 | Sprint 2 主軸，沒有 JSON 引用動態行為框架的價值大幅下降。 |
| **P1-C** | **US-202** | Extension 提供 action 函數（Zod 驗證），UI 自動以按鈕形式顯示 | 3 | Sprint 2 主軸，沒有 action 函數 JSON 動作按鈕不會跑。 |
| **P1-D** | **US-203** | Extension 提供 compute 函數，UI 自動渲染 + 快取 + dependency 追蹤 | 3 | Sprint 2 主軸，沒有 compute 衍生欄位不會自動算。 |
| **P2** | **TD-301 + TD-302** | api-generator.ts:150,202 hook 調用 TODO + ui-generator.ts:145,365,510 placeholder | 1 | US-201/202/203 會卡 generator，**做完 P1-B/C/D 必須順手做這個**。 |

**合計 17 SP**（約 1.5 個 sprint 容量）

---

## 📊 為何這樣排（依賴圖）

```
TD-514 (CI)
  ↓ 保護
TECH-006 (StateMachine 基礎)
  ↓ 解鎖
US-204 (訂單狀態機範例，8 SP) ← Sprint 7 不做，留 Sprint 8

US-201 ─┐
US-202 ─┼→ TD-301/302 → TD-303 (Tiptap) ← Sprint 7 不全做
US-203 ─┘

US-102 Phase 1 ✅ Done（本 session 完成）
US-102 Phase 2 (動態 RBAC) ← Sprint 7 不做，留 Sprint 8/9
```

---

## ⚠️ 為何以下**不**納入 Sprint 7

### US-102-P2（動態 RBAC，5 SP）
- **理由**：US-102 Phase 1 已提供 3 個寫死角色（admin/editor/viewer）+ 完整 CRUD UI
- **現狀可用**：用戶能在後台建立 admin/editor/viewer 帳號
- **延後理由**：動態 RBAC 需要先回答 4 個產品問題（見 backlog 末尾 checklist）才有 schema

### US-104 / US-105（AI 對話框架，10 SP）
- **理由**：依賴 US-201/202/203（Extension 核心）才有「有意義的 JSON 可生成」
- **延後理由**：現在做 AI 對話框架，生成的 JSON 沒 hook/action/compute，會是「死的 JSON」

### US-204（訂單狀態機範例，8 SP）
- **理由**：依賴 TECH-006（StateMachine 基礎）
- **延後理由**：做完 TECH-006 後 Sprint 8 可衝 US-204 + US-205

### TD-303（Tiptap WYSIWYG，2 SP）
- **理由**：純 UI 升級，不阻塞 Sprint 1-6 主軸
- **延後理由**：Sprint 8+ 再說

### TD-401 / TD-402 / TD-403 / TD-404 / TD-406 / TD-515（Sprint 4 Tech Debt）
- **理由**：這些是 Sprint 4 的 Tech Debt 清理 — 但 Sprint 4 沒被列為必做 Sprint
- **建議**：下次 reflection 重新評估是否要做 Sprint 4 集中清理

---

## 📋 Sprint 7 開工前必做（Housekeeping）

### 1. ✅ 完成：更新 `docs/backlog.md` 開頭

已從「Sprint 6 起步 4 Task 已完成」改成「Sprint 7（規劃中，待開工）」。

### 2. ✅ 完成：標記 Sprint 6 closure

已建立 `docs/reflection/sprint-6-closure.md` 簡短備註。

### 3. ✅ 完成：建立本檔案

`docs/sprint-7-plan.md` 已建立（本檔案）。

---

## 🎯 Sprint 7 成功標準（DoD）

| 項目 | 標準 |
|------|------|
| 測試 | +30 tests（總計 ~720+ tests） |
| 4 Gate | 全綠（lint + typecheck + regression + reviewer） |
| CI | TD-514 完成：push PR 自動跑 4 Gate |
| Extension 三大核心 | US-201/202/203 全 ✅（含 `{{fn:...}}` 引用 / action 按鈕 / compute 計算） |
| StateMachine | TECH-006 提供 runtime + DSL，能宣告訂單狀態定義 |
| Generator TODO | TD-301/302 完成（不再有 placeholder）|
| CHANGELOG | Sprint 7 條目完整 |
| Reflection | `docs/reflection/sprint-7-reflection.md` 必寫 |

---

## ⚠️ 已知風險

1. **TECH-006 範圍可能更大**：StateMachine 是大題目，5 SP 可能低估
   - 應變：Sprint 7 中期 reflection 重新估算，超出就只做 DSL + Runtime，API 留 Sprint 8
2. **US-201/202/203 互相耦合**：Extension 三大核心可能需要「一起設計」
   - 應變：開工前先做設計 spike（2-3 小時），確認三者的 hook 簽名一致
3. **CI 第一次跑可能 fail**：現有 E2E 環境敏感（需 DB + dev server）
   - 應變：CI 環境用 SQLite 或 mock，Playwright 用 webServer=auto 啟 dev server

---

## 📊 預估產出

| 類別 | 預估 |
|------|------|
| 新檔案 | 15-20 個（API routes + UI + tests） |
| 修改檔案 | 5-8 個（generator + state machine + CI yml）|
| 程式碼行數 | +1500 ~ +2500 行 |
| 測試檔案 | 5-8 個新檔案 |
| 測試案例 | +30 ~ +50 |
| 新技術 | GitHub Actions / State Machine DSL |

---

## 🔄 Sprint 7 之後（下個 Sprint 候選）

Sprint 7 完成後，下個 sprint 候選（**不**在本 sprint 計畫內）：

- **US-204 訂單狀態機範例**（8 SP）— 驗證 TECH-006 的真實用例
- **US-102-P2 動態 RBAC**（5 SP）— 解鎖「自定義角色」功能
- **TD-303 Tiptap WYSIWYG**（2 SP）— 富文本編輯器整合
- **Sprint 4 Tech Debt 集中清理**（TD-401/402/403/404/406/515，~6 SP）— 品質大掃除

---

> **最後更新**：2026-08-24（Sprint 7 計劃 session）
> **下次檢查時機**：Sprint 7 中期 reflection（建議 Sprint 7 過半時做一次中期 reflection）