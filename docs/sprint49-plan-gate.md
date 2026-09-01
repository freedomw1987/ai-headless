# Sprint 49 Plan Gate

> **日期**: 2026-09-01
> **範圍**: Office Rest 守護強化 + UIMessage 切斷
> **SP 估算**: 1.0 SP / 3 commits / 3 days
> **前次 Sprint**: [Sprint 48 Reflection](reflection/sprint-48-reflection.md)

---

## §1 目的

Sprint 48 reflection 揭露 9 項問題（3 P0 + 6 P1/P2），P0 已 hotfix 修補，P1 部分帶下 Sprint 49。本 Sprint 49 聚焦：

1. **TD-S49-OfficeRestGuardTightening**: Sprint 48 mid-review audit 揭露的 P1 守護強化項目
2. **TD-S48-CutAISDKTypeDeps**: Sprint 48 reflection 揭露的 P1 技術債（UIMessage 系列切斷）

**不包含**:
- ~~US-S49-OfficeParserRest~~ — Sprint 48-5 已完成, 不在 Sprint 49 範圍
- SourcesList 完整版 — 仍待辦, 留 Sprint 50+ 評估 (從 Sprint 47 帶下第 2 次)
- CRUD List 增強 — backlog 既有, 留 Sprint 50+ 評估

---

## §2 範圍 — 3 Commits / 1.0 SP

| Stage | 內容 | SP | 性質 |
|---|---|---|---|
| **49-0** | spike UIMessage 切斷策略 | 0.2 | spike 評估 |
| **49-1** | TD-S49-OfficeRestGuardTightening (3 子項) | 0.3 | 技術債 |
| **49-2** | TD-S48-CutAISDKTypeDeps (UIMessage 切斷) | 0.5 | 技術債 |
| **總計** | | **1.0 SP** | 0 新功能 / 2 技術債 / 1 spike |

---

## §3 風險評估

### 風險 1: UIMessage 切斷策略評估不準
- **嚴重性**: 🟡 中
- **描述**: Sprint 49-2 假設「簡單替代 `UIMessage = ChatMessage[]`」可行，但實際 conversation.tsx / message.tsx 可能用到 UIMessage 細部欄位（如 `parts`, `experimental_attachments`），導致型別不齊
- **緩解**:
  - Sprint 49-0 先 spike 評估實際使用面
  - 若方案 1 失敗, fallback 為方案 3 (local interface, 最小範圍)
- **預估影響**: 最多延長 Sprint 49-2 1 天

### 風險 2: Office Rest Guard 強化破壞既有測試
- **嚴重性**: 🟢 低
- **描述**: Sprint 49-1 將「找不到就 skip」改為「必須裝」守護，可能在 CI 環境因為 lockfile 行為不同而失敗
- **緩解**:
  - Sprint 48-5 已正式列入 jszip + fast-xml-parser 為依賴
  - 守護測試只針對 `package.json` 檢查依賴存在, 不會被環境影響
- **預估影響**: 0

### 風險 3: Sprint 48-5 PPTX fixture 在 CI 環境差異
- **嚴重性**: 🟢 低
- **描述**: Sprint 49-1 守護會用到 PPTX fixture，若 CI 環境 JSZip 行為差異可能測試不穩定
- **緩解**: Sprint 48-5 已驗證 fixture 在本地能跑, CI 環境相同 Node.js

---

## §4 SP 估算明細

### Sprint 49-0: spike UIMessage 切斷策略 (0.2 SP)
- 讀 conversation.tsx + message.tsx 確認 UIMessage 使用面
- 評估 3 個替代方案 (簡單替代 / 完整型別 / local interface)
- 寫 `docs/spike/sprint49-uimessage.md` 記錄決策

### Sprint 49-1: Office Rest Guard 強化 (0.3 SP)
- a) `tests/office-rest-spike.test.ts` 改「必須裝」守護 (3 tests)
- b) fixture 路徑修正 (`mammoth-docx-fixture.docx` → `sample.docx`) (2 tests)
- c) 加 `pnpm why jszip` 守護, 或改為驗證 package.json 已正式列入 (1 test)

### Sprint 49-2: UIMessage 切斷實作 (0.5 SP)
- 自訂 `UIMessage` 替代型別到 `lib/ai/chat/chat-utils.ts`
- 修改 2 個檔 (`conversation.tsx` + `message.tsx`) 改 import 自 chat-utils
- 加守護測試確保全專案無 `from "ai" import UIMessage`

---

## §5 排程

| 日期 | 動作 | 預估時數 |
|---|---|---|
| Day 1 (今日) | Plan Gate ✅ (本文件) | 0.5h |
| Day 1 | Design Gate (擴充 PRD §2.11 FR-14 ~ FR-15) | 0.5h |
| Day 2 | Stage 49-0 spike UIMessage | 1h |
| Day 2 | Stage 49-1 Office Rest Guard | 1h |
| Day 3 | Stage 49-2 UIMessage 切斷 | 2h |
| Day 3 | Submit Gate (reflection + backlog) | 0.5h |
| **總計** | | **5.5h** |

---

## §6 決策記錄

### 決策 1: 範圍方案 A (Office Rest Guard + UIMessage 切斷)
- **日期**: 2026-09-01
- **決策**: Sprint 49 = 技術債清理 (0 新功能)
- **理由**: Sprint 48 reflection 揭露 6 項 P1/P2 需處理，全部都是技術債性質，無急迫新功能需求
- **用戶確認**: ✅ (2026-09-01 對話)

### 決策 2: 加 Sprint 49-0 spike UIMessage
- **日期**: 2026-09-01
- **決策**: 加 0.2 SP spike 評估 UIMessage 切斷策略
- **理由**:
  - UIMessage 是 AI SDK 核心型別，直接切斷風險較高
  - Sprint 48-2 ChatStatus 已有前例 (守護失效教訓)
  - 先 spike 再實作, 避免方案 1 假設失敗導致返工
- **用戶確認**: ✅ (2026-09-01 對話)

### 決策 3: UIMessage 自訂策略 — 方案 1 (簡單替代)
- **日期**: 2026-09-01
- **決策**: 自訂 `type UIMessage = ChatMessage[]` 作為 Sprint 49-2 起點
- **理由**:
  - 最契合 Sprint 45 「自訂 ChatMessage 而非用 SDK UIMessage」既定方向
  - 最小改動 (只動 2 個檔)
  - 若失敗, fallback 為方案 3 (local interface)
- **待 Sprint 49-0 spike 確認**: spike 後若發現需要更複雜型別, 改用方案 3
- **用戶確認**: ✅ (2026-09-01 對話, 暫定, 待 spike 驗證)

### 決策 4: 不做 SourcesList 完整版
- **日期**: 2026-09-01
- **決策**: SourcesList 仍待辦, 不在 Sprint 49 範圍
- **理由**:
  - 從 Sprint 47 帶下第 2 次, 仍未排入
  - 需要 agent-sdk sources metadata 評估, 屬於較大新功能
  - Sprint 49 範圍方案 A 聚焦技術債, 不擴張
- **Backlog**: `US-S49-SourcesList` 升級為 `US-S50-SourcesList`

---

## §7 對應文件

| 文件 | 連結 |
|---|---|
| Sprint 48 Reflection | [docs/reflection/sprint-48-reflection.md](reflection/sprint-48-reflection.md) |
| Sprint 48 mid-review audit | [docs/audit/sprint-48-mid-review.md](audit/sprint-48-mid-review.md) |
| Sprint 49 PRD 擴充 (Design Gate) | [docs/prd/11-chat-v2-completions.md §2.11](prd/11-chat-v2-completions.md) |
| Sprint 49 spike 文件 (Stage 49-0) | `docs/spike/sprint49-uimessage.md` (TBD) |

---

## §8 Backlog 更新

### Sprint 49 帶下 (本 Sprint 處理)
- ✅ TD-S49-OfficeRestGuardTightening (0.3 SP) — 本 Sprint 49-1
- ✅ TD-S48-CutAISDKTypeDeps (0.5 SP) — 本 Sprint 49-2

### Sprint 50+ backlog (帶下不處理)
- 📋 `US-S50-SourcesList` — Sprint 47 帶下第 3 次 (P1)
- 📋 `TD-S50-CRUDListEnhancements` — 5 SP 既有 (P2)

### Sprint 49 reflection 待揭露 (新)
- TBD — Sprint 49-1 / 49-2 過程中可能揭露新守護漏洞

---

**Plan Gate 結論**: Sprint 49 範圍明確（3 commits / 1.0 SP / 0 新功能），風險可控（spike 先驗證 UIMessage 切斷策略），可進入 Design Gate。