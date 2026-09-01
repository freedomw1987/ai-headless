# Sprint 49-0: UIMessage 切斷策略 Spike

> **日期**: 2026-09-01
> **Sprint**: Sprint 49 Stage 49-0 (FR-16)
> **狀態**: ✅ 完成
> **決策**: **方案 1 + 刪除 dead code**

---

## §1 目的

Sprint 48 reflection #5 揭露 `UIMessage` 仍在 2 個檔從 `"ai"` import。Sprint 49-2 需切斷此依賴，但因 Sprint 48-2 ChatStatus 守護失效教訓，先 spike 評估再實作。

本 spike 評估:
1. 兩個檔案實際如何使用 `UIMessage`
2. 自訂替代方案的可行性
3. 是否需要 re-export SDK 型別

---

## §2 當前 UIMessage 使用面

### conversation.tsx

| 位置 | 使用方式 | 複雜度 |
|---|---|---|
| `getMessageText(message: UIMessage)` | 讀 `.parts` 陣列, filter type==='text', map `.text` | 🟡 中 (需要 parts 概念) |
| `ConversationDownloadProps.messages: UIMessage[]` | 型別簽名 | 🟢 低 |
| `defaultFormatMessage(message: UIMessage)` | 讀 `.role` + 呼叫 getMessageText | 🟢 低 |
| `messagesToMarkdown(messages: UIMessage[])` | 型別簽名 + 呼叫 formatMessage | 🟢 低 |

### message.tsx

| 位置 | 使用方式 | 複雜度 |
|---|---|---|
| `MessageProps.from: UIMessage["role"]` | 只用 `.role` 欄位型別 | 🟢 極低 |

---

## §3 ChatMessage vs UIMessage 欄位差異

| 欄位 | UIMessage | ChatMessage | 結論 |
|---|---|---|---|
| `id` | ✅ | ✅ | 相容 |
| `role` | ✅ (`'user'\|'assistant'\|'system'`) | ✅ `ChatMessageRole` | 相容 |
| `parts` | ✅ (Array, 多模態用) | ❌ (無此概念) | **不相容** |
| `content` | ❌ (UIMessage 不存, 透過 parts) | ✅ (string) | **不相容** |
| `experimental_attachments` | ✅ | ❌ | 沒用 |
| `metadata` | ✅ (各 provider 自訂) | ✅ `ChatMessageMetadata` | 需檢查 |

**核心問題**: UIMessage 是 AI SDK runtime streaming 用的多模態結構, ChatMessage 是我們自訂的純文字結構, 兩者哲學不同。

---

## §4 4 個替代方案評估

### 方案 1: `type UIMessage = ChatMessage` (Plan Gate 預設)
- **作法**: 把 UIMessage 直接 alias 為 ChatMessage
- **結果**: ❌ 不可行 — `getMessageText` 用 `.parts.filter(...).map(...)`, ChatMessage 沒 parts
- **失敗**: TypeScript 編譯錯誤

### 方案 1b: `type UIMessage = ChatMessage & { parts: ... }`
- **作法**: 加上 parts 但型別不精確
- **結果**: ⚠️ 牽強 — ChatMessage 用 `content`, UIMessage 用 `parts`, 兩者並存造成概念混淆
- **失敗**: 程式碼意圖不清, 維護成本高

### 方案 2: 完整自訂 UIMessage 型別
- **作法**: 自訂 `UIMessage<UIDataTypes>` 對應 AI SDK 介面
- **結果**: ⚠️ 過重 — AI SDK runtime (`useChat`, SSE streaming) 仍依賴, 完全自訂不切實際
- **失敗**: 維護成本過高, 容易與 SDK 升級脫節

### 方案 3: local interface 局部替代 (Plan Gate fallback)
- **作法**: 在 2 個檔案內定義 `interface UIMessageLocal { ... }`
- **結果**: ⚠️ 可行但需謹慎 — `messagesToMarkdown` 是 exported, 外部若 import 會壞
- **現實**: 檢查後確認沒有外部 import, 可以安全用 local interface
- **缺點**: 不全域自訂, 將來其他檔案想用 UIMessage 還是要從 "ai" import

---

## §5 意外發現: messagesToMarkdown / ConversationDownload 是 dead code

```bash
grep -rn "messagesToMarkdown\|ConversationDownload" app/ lib/ components/
# 只在 conversation.tsx 自己內部出現
```

外部沒人 import。**對 admin-chat-panel.tsx 檢查**: 只 import `Conversation, ConversationContent, ConversationEmptyState, ConversationScrollButton` — **沒有 `messagesToMarkdown` 或 `ConversationDownload`**。

Sprint 45 引入這兩個函式時, 規劃未完成就 commit 進來了，從 Sprint 46 ~ 48 都沒被任何 code path 呼叫。

### 對話決策: 直接刪除 dead code

**這是本 spike 的意外收穫**:
- 不需要自訂 UIMessage 型別替代 dead code
- 直接**刪除 `messagesToMarkdown` + `ConversationDownload`**
- `getMessageText` + `defaultFormatMessage` 是 dead code 的內部 helper, 一起刪
- `conversation.tsx` 移除 `UIMessage` import

---

## §6 採用方案: **方案 1 + 刪除 dead code**

### Sprint 49-2 行動清單

1. **`components/ai-elements/conversation.tsx`**:
   - 刪除 `getMessageText`
   - 刪除 `defaultFormatMessage`
   - 刪除 `messagesToMarkdown`
   - 刪除 `ConversationDownload`
   - 刪除 `import type { UIMessage } from "ai"`
   - 刪除 `ConversationDownloadProps` type

2. **`components/ai-elements/message.tsx`**:
   - 修改 `MessageProps.from: UIMessage["role"]` → `from: ChatMessageRole`
   - 修改 `MessageProps` 用 `ChatMessageRole` 而非 `UIMessage["role"]`
   - 刪除 `import type { UIMessage } from "ai"`
   - 從 `@/lib/ai/chat/chat-utils` import `ChatMessageRole`

3. **守護測試**:
   - 加 `tests/uimessage-deps-guard.test.ts`
   - 用 Node.js fs API 遞迴掃描 (Sprint 48-4.1 hotfix 改進)
   - regex: `/from\s+["']ai["']/i` + filter `/UIMessage/i`
   - 預期: 0 違規

### 範圍縮減

| 項目 | 原預估 | 實際 |
|---|---|---|
| 自訂 UIMessage 型別 | 0.2 SP | 0 SP (刪 dead code 不需) |
| 修改 2 個檔 | 0.2 SP | 0.2 SP (純刪除) |
| 守護測試 | 0.1 SP | 0.1 SP |
| **Sprint 49-2 實際** | **0.5 SP** | **0.3 SP** |

剩 0.2 SP 可挪到 Sprint 49-1 強化守護, 或留 Sprint 50+ backlog。

---

## §7 風險評估

### 風險 1: dead code 將來需要時又要重寫
- **嚴重性**: 🟢 極低
- **理由**:
  - Sprint 45 ~ Sprint 48 (4 個 sprint) 從來沒被用過
  - 即使將來需要, 基於當時真實需求重寫會比維護 dead code 好
- **緩解**: 留 commit message 說明刪除原因, 將來 git log 可追溯

### 風險 2: MessageProps.from 型別變動影響外部
- **嚴重性**: 🟢 低
- **理由**: `from: UIMessage["role"]` 等價於 `from: 'user' | 'assistant' | 'system'`
- **緩解**: `ChatMessageRole` 是 Sprint 47 既有型別, 結構完全一致

### 風險 3: ChatMessageRole 與 UIMessage role 結構未來可能分歧
- **嚴重性**: 🟡 中
- **理由**: AI SDK 未來若加新的 role (如 'tool', 'function'), 我們自訂 ChatMessageRole 不會自動跟上
- **緩解**:
  - 目前 role 集合穩定 (Sprint 45~48 都沒變)
  - 守護測試確保單一來源 (chat-utils.ts)
  - 若將來 SDK 新增 role, 我們有意識地決定是否跟進

---

## §8 結論

**採用方案 1 + 刪除 dead code**:
- Sprint 49-2 不需要自訂複雜 UIMessage 型別
- 直接刪除未被使用的 dead code 是最簡單的切斷路徑
- 守護測試確保將來不會重新從 "ai" import UIMessage

**意外好處**:
- 移除 ~80 行 dead code (包括未使用的 exports)
- Sprint 49-2 SP 從 0.5 降到 0.3 (省 0.2 SP)

**Sprint 49-2 預估**:
- 3 files changed
- -80 / +5 lines
- 8 tests passed (守護 + 既有 test 仍綠)
- ~0.3 SP

---

**Spike 完成時間**: 2026-09-01
**Spike 結論**: 方案 1 + 刪除 dead code 為 Sprint 49-2 最佳路徑