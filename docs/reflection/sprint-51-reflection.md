# Sprint 51 Reflection — SDK Type Dep 切斷 (FileUIPart + SourceDocumentUIPart)

> **Sprint**: Sprint 51
> **日期**: 2026-09-01
> **狀態**: ✅ 完成
> **Plan Gate**: [docs/sprint51-plan-gate.md](../sprint51-plan-gate.md)
> **主題**: 純技術債清理 (0 新功能, 0 新架構風險)

---

## §1 Sprint 51 目標達成狀況

### Plan Gate 預估 vs 實際

| 項目 | 預估 | 實際 |
|---|---|---|
| Commits | 1 | 1 ✅ |
| FR | 3 | 3 ✅ |
| SP | 0.8 | 0.8 ✅ |
| 新功能 | 0 | 0 ✅ |
| 守護測試 | +8 | +10 (超預期 +2) |
| 全專案 from "ai" | 0 | **0** ✅ (type dep 切斷完成) |

### Commit 序列

```
79e3759 docs(sprint-51): Plan Gate (FileUIPart + SourceDocumentUIPart 切斷)
25943d3 docs(sprint-51): Design Gate (FR-18.1 ~ FR-18.3)
dd13b96 feat(sprint-51-0): SDK Type Dep 切斷 (FileUIPart + SourceDocumentUIPart)
```

### 測試基線演進

| Sprint | Files | Tests |
|---|---|---|
| Sprint 50 結尾 | 209 | 1979 |
| **Sprint 51-0 結尾** | **210** | **1989 (+10)** |

### 全專案 from "ai" 掃描結果

| 切斷前 | 切斷後 |
|---|---|
| 1 個檔 (prompt-input.tsx) | 0 ✅ |
| 2 個 SDK 型別 (FileUIPart + SourceDocumentUIPart) | 0 ✅ |

---

## §2 Stage 51-0 (SDK Type Dep 切斷) 反思

### 達成

- FR-18.1: 自訂 FileUIPart + SourceDocumentUIPart 到 `lib/ai/chat/ui-message-parts.ts`
- FR-18.2: prompt-input.tsx 改 import 自 ui-message-parts
- FR-18.3: 全專案 source-code guard 4 項守護 (FileUIPart + SourceDocumentUIPart + UIMessage + ChatStatus)

### 學習

- **守護測試 regex 嚴格性**: 初版用寬鬆 regex (`from "ai"` && SDKType 各自獨立) 誤判了 chat-utils.ts 中的 ChatStatus 為違規。改用多行 regex `^import type {...SDKType...} from "ai"` (m flag) 才正確
- **自訂型別分檔策略**: 與 chat-utils.ts 分開建獨立檔 ui-message-parts.ts, 因屬不同概念 (UIMessage Part vs Chat Message Flow)。比塞到 chat-utils.ts 更清楚
- **既有 prompt-input 測試保留**: Sprint 51 沒有加新 prompt-input.test, 僅靠既有測試仍綠即可證明 runtime 不變

### 意外發現

- **守護測試數量超預期**: 預估 +8, 實際 +10 (+2)。原因是加了「自訂型別欄位完整」(FR-18.3.4) 兩個 test, 確保欄位對齊 AI SDK 100%
- **守護測試 regex bug 揭露**: 初版 ChatStatus 守護會誤判, 證明守護測試也要 TDD, 不能只 cover happy path
- **chat-utils.ts 也應該加入排除名單**: 守護測試不需排除 chat-utils.ts, 因它定義 ChatStatus 卻不 import, 但若將來 chat-utils.ts 改從 "ai" import, 守護會抓到

---

## §3 SDK Type Dep 切斷完整演進

| Sprint | 切斷目標 | 結果 | 守護狀態 |
|---|---|---|---|
| Sprint 48-2 | `ChatStatus` | ✅ 完成 | Sprint 48 mid-review audit P0 → Sprint 49 守護強化 → Sprint 51 持續守護 |
| Sprint 49-2 | `UIMessage` | ✅ 完成 | Sprint 49 守護 + Sprint 51 持續守護 |
| **Sprint 51** | **`FileUIPart` + `SourceDocumentUIPart`** | ✅ **完成** | **Sprint 51 新守護 (10 tests)** |

**Sprint 51 結尾**: 全專案 `from "ai"` 為 0 (type dep 切斷完成)。

### 守護測試演進

| Sprint | 守護測試名稱 | 測試數 |
|---|---|---|
| Sprint 48-2 | chat-status-guard.test.ts | 10 |
| Sprint 49-2 | uimessage-deps-guard.test.ts | 3 |
| Sprint 49-0 | uimessage-spike-guard.test.ts | 10 |
| Sprint 49-1 | office-rest-spike.test.ts | 16 |
| **Sprint 51** | **sdk-type-deps-guard.test.ts** | **10** |

### Source-code guard 模式統一

| Sprint | 守護方法 | 理由 |
|---|---|---|
| Sprint 48-2 | execSync(grep) | 初版, 但 shell quote 解析會吞錯誤 |
| Sprint 48-4.1 (hotfix) | Node.js fs 遞迴掃描 | ✅ 沿用至今 |
| Sprint 49-2 | Node.js fs + regex | ✅ 沿用 |
| Sprint 51 | Node.js fs + 嚴格多行 regex (m flag) | ✅ 改進 |

---

## §4 Sprint 50 vs Sprint 51 對比

| 維度 | Sprint 50 | Sprint 51 |
|---|---|---|
| 主題 | 新功能升級 | 純技術債清理 |
| 新功能 | 1 (SourcesList v2) | 0 |
| Commits | 1 | 1 |
| SP | 0.8 | 0.8 |
| 守護測試 | +23 | +10 |
| 風險 | 🟢 低 (RBAC + path traversal) | 🟢 極低 (只改 type import) |
| UI 改動 | 有 | 無 |
| Type dep 切斷 | N/A | ✅ 完成 (全專案 from "ai" = 0) |

---

## §5 Sprint 52+ 帶下項目

### 用戶主動提出 (Sprint 51 Plan Gate Q&A)

| 項目 | 預估 SP | 備註 |
|---|---|---|
| **AI 生成 extensions product CRUD** | TBD | 用戶主動提出, 需另開 Plan Gate 評估 |

### 從 Sprint 47~51 累積待處理

| 來源 | 項目 | 優先 | 預估 SP |
|---|---|---|---|
| Sprint 50 | SourcesList v3 (A2 圖片 inline preview) | P3 | 1.2 |
| Sprint 50 | SourcesList v3+ (A3 v2+v3 全做) | P3 | 2 |
| Sprint 48 | TD-S48-CRUDListEnhancements (CRUD List 增強) | P2 | 5 |
| Sprint 51+ (新) | **AI 生成 extensions product CRUD** | **TBD** | **TBD** |

### 排除項目（明確不做）

- ❌ 其他 SDK 型別切斷 (TextUIPart, ReasoningUIPart) — 全專案無引用
- ❌ runtime helper 切斷 (convertFileListToFileUIParts) — 全專案無引用
- ❌ AI SDK 升級 — 不在 Sprint 51 範圍

---

## §6 對 SOP 的反思

### SOP §2.3 4 Gate 表現

- **Gate 1 TDD**: Sprint 51-0 紅→綠 cycle 揭露 7 個違規, 證明守護測試是真實斷言
  - 額外揭露: 守護測試 regex bug (ChatStatus 誤判), 證明守護測試也要 TDD
- **Gate 2 Lint+Typecheck**: 0 error (型別對齊 100% AI SDK 7.0)
- **Gate 3 Regression**: 1989 tests / 27 秒, 略短於 Sprint 50 (因 sprint 範圍小)
- **Gate 4 Reviewer**: 守護測試不只驗證 happy path, 還驗證欄位完整

### 對 SOP 的建議

1. **守護測試 regex 嚴格性**: SOP 可加註解, 「from "ai" import SDKType」應用多行 regex + m flag, 避免誤判
2. **自訂型別分檔策略**: SOP 可加章節說明, 自訂 SDK 型別可分檔建 (與既有 chat-utils.ts 概念分開)
3. **守護測試預估可更精準**: Sprint 51 Plan Gate 預估 +8, 實際 +10。建議守護測試預估上修 1.2 ~ 1.5 倍

---

## §7 Sprint 51 結論

### 成功

- ✅ 1 commit / 0.8 SP / 3 FR 全部按 Plan Gate 完成
- ✅ 全專案 `from "ai"` 為 0 (type dep 切斷完成 🎉)
- ✅ 自訂型別對齊 AI SDK 7.0 100% (欄位完整守護)
- ✅ prompt-input.tsx 只改 1 行 import, runtime 不變
- ✅ 既有 prompt-input 測試仍綠 (向後相容)
- ✅ 10 個守護測試, 比預期 +2
- ✅ Sprint 48-2 + Sprint 49-2 切斷成果持續守護

### 失敗

- 無 (1 commit 一次過 4 Gate)

### 學習

- **守護測試 regex 嚴格性**: 多行 regex + m flag 才正確, 不要用寬鬆 AND
- **自訂型別分檔**: 概念分開 (UIMessage Part vs Chat Message Flow)
- **既有測試即證明**: 改 type import 路徑, 既有測試仍綠就是最佳證明

### 為下一個 sprint 鋪墊

- Sprint 52+ 用戶主動提出: AI 生成 extensions product CRUD
- 也可考慮: SourcesList v3 (圖片 preview) 或 CRUD List 增強 (P2)

---

## §8 統計

| 項目 | 數值 |
|---|---|
| Sprint 51 commits | 1 (Stage 51-0) + 2 docs (Plan + Design) = 3 |
| Sprint 51 SP | 0.8 |
| Sprint 51 守護測試 | +10 |
| Sprint 51 新增檔案 | 2 (ui-message-parts.ts + sdk-type-deps-guard.test.ts) |
| Sprint 51 修改檔案 | 1 (prompt-input.tsx, 1 行) |
| Sprint 51 行數變動 | +273 / -1 |
| Sprint 47~51 累積 FR | 68 |
| Sprint 47~51 累積 SP | ~21.2 |
| Sprint 47~51 累積 commits | ~50 |

---

## §9 Sprint 51 里程碑

### 技術債清理完成

- ✅ Sprint 48-2 ChatStatus
- ✅ Sprint 49-2 UIMessage
- ✅ Sprint 51 FileUIPart + SourceDocumentUIPart

**Sprint 51 結尾**: 全專案 type dep 切斷完成, 後續 sprint 可專注新功能。

---

**Sprint 51 結束時間**: 2026-09-01
**Sprint 51 SP 完成率**: 100% (0.8 / 0.8)
**Sprint 51 commits**: 1 (Stage 51-0) + 2 docs (Plan + Design) = 3
**下一個 sprint**: Sprint 52 (待 Plan Gate, 用戶主動提出 AI 生成 extensions product CRUD)