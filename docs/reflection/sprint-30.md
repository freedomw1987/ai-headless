# Sprint 30 Reflection — Event Workflow 動態化 + Order cancelEvent Log

> **Sprint**: 30
> **日期**: 2026-08-26
> **狀態**: ✅ **100% 收尾（1.5-2/1.5-2 SP）**
> **對應 Backlog**: TD-新發現 C, TD-新發現 D (Sprint 29 reflection 揭露)

---

## 🎯 Sprint 目標

依 Sprint 29 reflection 揭露的 2 個新 TD：

| ID | 描述 |
|---|---|
| TD-新發現 C | Event lifecycle workflow 應從 spec 動態讀取 |
| TD-新發現 D | Order cancelEvent 沒寫 TransitionLog |

---

## 📊 最終數據

| 項目 | 數據 |
|---|---|
| **總 SP** | **1.5-2 / 1.5-2**（100%）|
| **Commits** | 1 個 + 1 docs = 2 個 push |
| **新增檔案** | 1 個（測試）|
| **修改檔案** | 2 個（event-workflow + order-workflow）|
| **新增測試** | **5 個** |
| **測試基線** | 1104 → **1109 通過**（+5 新測試）|
| **4 Gate 全綠** | ✅ |

---

## 📅 Sprint 30 執行紀錄

| Day | 計劃 | 實際 | 狀態 |
|---|---|---|---|
| Day 1 | Plan Gate (Q1-Q4) | ✅ Q1: 修 Sprint 29 TD / Q2: 合併 1 commit / Q3: 2 describe / Q4: 1 commit 改 2 檔 | ✅ |
| Day 2 | commit 1 (event 動態化 + Order cancelEvent) | ✅ pushed `bd0e501` | ✅ |
| Day 3 | Sprint 30 reflection（本檔）| ✅ | ✅ |

---

## 🎯 Plan Gate 決議

| Q# | 問題 | 決策 |
|---|---|---|
| Q1 範圍 | Sprint 29 TD 修補 | ✅ A：修 2 個新 TD（~1.5-2 SP）|
| Q2 範圍精確度 | 2 個 TD 一起做還是分開 | ✅ B：合併 1 個 commit |
| Q3 測試方式 | 1 commit 內的測試結構 | ✅ A：2 個 describe blocks |
| Q4 commit 切法 | 改 2 檔怎麼切 | ✅ A：1 commit 改 2 檔 |

---

## 🏗️ commit 1 詳細成果

### TD-新發現 C：Event workflow 動態化

| 之前 | `transitionEvent` 把 transitions 寫死在 source code（硬編碼規則）|
| 修正 | `buildEventTransitions(fromState, event)` 從 `loadSpec('event').workflows[0].transitions` 動態讀取 |
| 設計 | Event spec 沒有 `event` 欄位（時間觸發）,改用「以 fromState 為 key,查所有 transition,根據 event 名對應 toState」|

### TD-新發現 D：Order cancelEvent 加 TransitionLog

| 之前 | `cancelEvent` 直接 `db.order.update`,沒寫 TransitionLog |
| 修正 | 新增 `cancelEvent(orderId, payload)` 函式,包 `$transaction` + 寫 TransitionLog（machineName: 'order'）|
| 一致性 | 與 `transitionOrder` 同一檔,符合 Sprint 28-29 建立的 pattern |

---

## 🎯 端到端驗證

| 場景 | 結果 |
|---|---|
| (A-1) upcoming → start → ongoing | ✅ |
| (A-2) ongoing → end → past | ✅ |
| (A-3) upcoming → cancel → cancelled | ✅ |
| (A-4) 無效 transition 拋錯不寫 log | ✅ |
| (B) cancelEvent 寫 TransitionLog | ✅ |
| **總計** | **1109/1109 全綠** |

---

## 🎓 關鍵學習

### L30：spec workflow 應動態讀而非 hard-code

**Sprint 14 設計理念**：dynamic-handler 從 spec 動態組裝 CRUD handler
**Sprint 30 應用**：transitionEvent 從 spec.workflows[0].transitions 動態推導
**收益**：
- 修改 spec.workflows 即可生效, 不需改 source code
- 設計師可以通過 spec 定義 lifecycle,developer 程式碼不需配合
- 統一性：spec 是 source of truth

**挑戰**：
- Event spec transition 沒有 `event` 欄位 (時間觸發)
- 需自行定義 event-to-toState 映射規則
- 但仍是動態,spec 修改仍生效

### L31：Order cancelEvent 之前被 Sprint 28 漏掉

**Sprint 28 TD-517 修 transitionOrder + 寫 TransitionLog,但 cancelEvent 是另一個函式,被漏掉**

**教訓**：
- 「Sprint 28 reflection TD-新發現 A: 6 個 non-Order transition」實際上應包含「同 Order 內其他 transition 函式」
- commit 3 (blog) 與 commit 4 (event) 修 2 個, 漏了同檔的 cancelEvent
- Sprint 30 補回

**SOP 改進**：
- 任何 workflow 檔內的 transition/cancel/approve 等函式, 統一 pattern
- Audit 應包含「同 workflow 內所有 transition 函式」, 不只「跨 spec」

### L32：動態讀 spec 適用於時間觸發但有固定 toState 的場景

**Event workflow 特性**：
- 時間觸發 (start/end) 而非 event-based
- 但 toState 固定 (upcoming → start → ongoing, ongoing → end → past)
- 動態讀仍可推導 toState

**設計**：
- 以 fromState 為 key 查所有 transitions
- 根據 event 名 (start/end/cancel) 對應 toState
- 避免 hard-code 「upcoming → start → ongoing」這種規則

**限制**：
- 若 spec 同 fromState 有多個 toState 對應同 event 名,邏輯會錯
- 現有 spec 沒有此情況,未來需更嚴謹

---

## 📈 累計成果（Sprint 21-30）

| 項目 | 累計 |
|---|---|
| **Sprints 完成** | 10 個 |
| **SP 累計** | 23.75 + 3-4 + 1.5-2 = **~28.5 SP** |
| **測試累計** | 923 → **1109**（+186 測試）|
| **TD 累計修正** | 16+ 個 |
| **新 SOP 規則** | 32 條（L1-L32 + R1-R2）|

---

## ⚠️ 揭露的後續 TD

### TD-新發現 E：需全面 audit 所有 workflow 函式是否都有 TransitionLog

**問題**：Sprint 30 揭露 Order cancelEvent 漏掉,可能還有其他 transition/cancel 函式漏

**建議**：Sprint 31+ 全面 audit：
- 列出所有 extension workflow 檔
- 列出每個檔的所有 transition 函式
- 對照是否都符合 $transaction + TransitionLog pattern

---

## 🏆 Sprint 30 收尾確認

- ✅ **1.5-2/1.5-2 SP**（100%）
- ✅ **1 commit pushed** (commit 1)
- ✅ **5 個新測試全綠**
- ✅ **1109/1109 tests 全綠**
- ✅ **4 Gate 全綠**
- ✅ **event workflow 動態化 + Order cancelEvent log 完成**

**Sprint 30 正式結束。**

---

**Reflection 作者**: AI Assistant
**Reviewer**: AI Assistant（Gate 4 self-check）
**日期**: 2026-08-26