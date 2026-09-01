# Sprint 51 Plan Gate — SDK Type Dep 切斷 (FileUIPart + SourceDocumentUIPart)

> **日期**: 2026-09-01
> **Sprint**: Sprint 51
> **狀態**: ✅ Plan Gate 完成
> **決策**: **純技術債清理, 切斷剩餘 1 個檔的 SDK 型別依賴** (0.8 SP, 1 commit)
> **範圍**: 0 新功能, 0 新架構風險
> **Sprint 52+ 帶下**: 用 AI 生成 extensions product CRUD

---

## §1 為什麼是 Sprint 51？

**SDK type dep 切斷歷史**:

| Sprint | 切斷目標 | 結果 |
|---|---|---|
| Sprint 48-2 | `ChatStatus` | ✅ 完成, 但守護失效 (audit P0) |
| Sprint 49-2 | `UIMessage` | ✅ 完成, 移除 ~75 行 dead code |
| **Sprint 51** | **`FileUIPart` + `SourceDocumentUIPart`** | **待執行** |

**Sprint 49 reflection §8 明確建議**: 「Sprint 50 可考慮其他 SDK type dep 切斷 (P3, TBD)」
**Sprint 50 reflection §5 帶下**: 「其他 SDK type dep 切斷 (P3, TBD)」

---

## §2 當前 SDK 依賴盤點

### 全專案掃描結果

```bash
grep -rn "from ['\"]ai['\"]" app/ lib/ components/ --include="*.ts" --include="*.tsx"
# 排除 node_modules / .test / .d.ts
```

| 檔案 | SDK 型別 | 使用次數 |
|---|---|---|
| `components/ai-elements/prompt-input.tsx` | `FileUIPart` | 5 |
| `components/ai-elements/prompt-input.tsx` | `SourceDocumentUIPart` | 4 |

**結論**: 全專案僅剩 1 個檔從 "ai" SDK import, 共 2 個型別。

### Runtime helper 依賴檢查

```bash
grep -rn "convertFileList\|isFileUIPart\|toUIMessage\|createUIMessage" app/ lib/ components/
# 0 results → 無 runtime helper 依賴
```

**結論**: 只有型別 import, 無 runtime 函式依賴, 切斷風險極低。

---

## §3 Sprint 51 範圍 (3 FR / 1 commit / 0.8 SP)

### FR-18: FileUIPart + SourceDocumentUIPart 自訂切斷 (Stage 51-0)

| FR | 描述 | 優先 | SP |
|----|------|------|-----|
| **FR-18.1** | 自訂 `FileUIPart` + `SourceDocumentUIPart` 型別到 `lib/ai/chat/ui-message-parts.ts` | P3 | 0.3 |
| **FR-18.2** | 修改 `prompt-input.tsx` 改 import 自 ui-message-parts (不再 `from "ai"`) | P3 | 0.2 |
| **FR-18.3** | 加全專案 source-code guard, 確保無 `from "ai" import FileUIPart\|SourceDocumentUIPart` | P3 | 0.3 |
| **總計** | **3 FR** | | **0.8 SP** |

### FR-18.1 實作細節: 自訂 SDK 型別

**位置**: `lib/ai/chat/ui-message-parts.ts`

```typescript
/**
 * Sprint 51 Stage 51-0 (FR-18.1): 自訂 UIMessage part 型別
 *
 * 對應 PRD: docs/prd/11-chat-v2-completions.md §2.13 (FR-18)
 * 對應 Plan Gate: docs/sprint51-plan-gate.md
 *
 * 自訂型別切斷 AI SDK 'ai' 依賴 (Sprint 48-2 ChatStatus / Sprint 49-2 UIMessage
 * 模式延續)
 *
 * 設計:
 * - 對齊 AI SDK 'ai' 7.0 FileUIPart + SourceDocumentUIPart 欄位
 * - 不 export SDK 型別, 而是 export 局部型別
 * - 將來若 SDK 升級, 需手動對齊 (Sprint 49-2 reflection 揭露的風險)
 */

/**
 * FR-18.1: 自訂 FileUIPart
 *
 * 對齊 AI SDK 'ai' FileUIPart:
 * - type: 'file' (literal)
 * - mediaType: IANA media type (full 或 top-level)
 * - filename?: optional
 * - url: file URL
 * - providerMetadata?: optional
 */
export type FileUIPart = {
  type: 'file';
  mediaType: string;
  filename?: string;
  url: string;
  providerMetadata?: Record<string, unknown>;
};

/**
 * FR-18.1: 自訂 SourceDocumentUIPart
 *
 * 對齊 AI SDK 'ai' SourceDocumentUIPart:
 * - type: 'source-document' (literal)
 * - sourceId: string
 * - mediaType: string
 * - title: string
 * - filename?: optional
 * - providerMetadata?: optional
 */
export type SourceDocumentUIPart = {
  type: 'source-document';
  sourceId: string;
  mediaType: string;
  title: string;
  filename?: string;
  providerMetadata?: Record<string, unknown>;
};
```

**對齊 AI SDK 欄位**: 從 `node_modules/.pnpm/ai@7.0.85_zod@3.24.1/node_modules/ai/dist/index.d.ts` 1934-1965 行讀取, 確保 100% 相容。

### FR-18.2 實作細節: prompt-input.tsx import 改路徑

**修改前**:
```typescript
import type { FileUIPart, SourceDocumentUIPart } from "ai";
```

**修改後**:
```typescript
import type { FileUIPart, SourceDocumentUIPart } from "@/lib/ai/chat/ui-message-parts";
```

**不變**: 型別簽名 (`files: (FileUIPart & { id: string })[]` 等) 完全相同, 程式碼其他部分不變。

### FR-18.3 實作細節: source-code guard

**位置**: `tests/sdk-type-deps-guard.test.ts`

```typescript
/**
 * Sprint 51 (FR-18.3): SDK type deps source-code guard
 *
 * 沿用 Sprint 48-4.1 hotfix 改進: Node.js fs API 遞迴掃描
 * 沿用 Sprint 49-2 UIMessage guard 模式
 *
 * 守護項目:
 * - 無 `from "ai" import FileUIPart`
 * - 無 `from "ai" import SourceDocumentUIPart`
 * - 無 `from "ai" import UIMessage` (Sprint 49-2 已切斷, 持續守護)
 * - 無 `from "ai" import ChatStatus` (Sprint 48-2 已切斷, 持續守護)
 */
```

---

## §4 守護測試計畫

### 新增守護測試 (Sprint 51, 預估 +8 tests)

| Test | 內容 |
|---|---|
| 無 FileUIPart 從 "ai" import | 全專案 source-code 掃描 |
| 無 SourceDocumentUIPart 從 "ai" import | 全專案 source-code 掃描 |
| 無 UIMessage 從 "ai" import | 持續守護 Sprint 49-2 成果 |
| 無 ChatStatus 從 "ai" import | 持續守護 Sprint 48-2 成果 |
| `lib/ai/chat/ui-message-parts.ts` 存在 | FR-18.1 守護 |
| prompt-input.tsx 改 import 自 ui-message-parts | FR-18.2 守護 |
| FileUIPart 欄位完整 (type + mediaType + filename? + url + providerMetadata?) | FR-18.1 細節守護 |
| SourceDocumentUIPart 欄位完整 (type + sourceId + mediaType + title + filename? + providerMetadata?) | FR-18.1 細節守護 |

---

## §5 4 Gate SOP 執行計畫

### Gate 1: TDD gate

- 先寫守護測試 (預估 8 tests)
- 跑測試 → 紅燈 (prompt-input.tsx 仍從 "ai" import)
- 實作 → 綠燈

### Gate 2: lint / syntax gate

- `pnpm lint` + `pnpm typecheck`
- 0 error

### Gate 3: regression gate

- `pnpm test` 全綠
- 預估 1979 → ~1987 tests (+8)

### Gate 4: reviewer gate

- 用 `dev-checker-loop` skill 校驗
- 重點檢查: 欄位對齊 AI SDK 100% / import 路徑正確 / 守護測試有效

---

## §6 明確排除 (Sprint 51 不做)

| 項目 | 排除原因 |
|---|---|
| 切斷其他 SDK 型別 (如 `TextUIPart`, `ReasoningUIPart`) | 全專案無引用, 不需切斷 |
| runtime helper (convertFileListToFileUIParts 等) | 全專案無引用 |
| AI SDK 升級 | 不在 Sprint 51 範圍 |

---

## §7 風險與緩解

### 風險 1: 自訂型別與 AI SDK 升級脫節

- **嚴重性**: 🟡 中
- **理由**: AI SDK 未來升級若改 `FileUIPart` 欄位, 我們自訂型別不會自動跟上
- **緩解**:
  - Sprint 51 守護測試明確列出所有欄位, 升級時手動更新
  - PR review check: 若升級 AI SDK, 需同步檢查 ui-message-parts.ts

### 風險 2: prompt-input.tsx 改 import 後 runtime 行為改變

- **嚴重性**: 🟢 極低
- **理由**: 只改 type import 路徑, runtime 程式碼完全不動
- **緩解**: 既有 prompt-input.test.tsx 仍綠即可證明

### 風險 3: Sprint 50-0 SourcesList v2 守護依賴 SDK 型別

- **嚴重性**: 🟢 無
- **理由**: Sprint 50-0 用自訂 MIME labels, 沒用 SDK FileUIPart

---

## §8 Sprint 累積表

| Sprint | FR 數 | SP | 累積 FR | 累積 SP |
|---|---|---|---|---|
| 47 | 37 | 14 | 37 | 14 |
| 48 | 15 | 4.8 | 52 | 18.8 |
| 49 | 9 | 0.8 | 61 | 19.6 |
| 50 | 4 | 0.8 | 65 | 20.4 |
| **51** | **3** | **0.8** | **68** | **21.2** |

---

## §9 Sprint 52+ 帶下

### 用戶備註 (Sprint 51 Plan Gate Q&A)

> 「之後要試試 AI 去生成一個 extensions product CRUD」

### Sprint 52+ 規劃

| 項目 | 預估 SP | 備註 |
|---|---|---|
| AI 生成 extensions product CRUD | TBD | 用戶主動提出, 需另開 Plan Gate 評估 |

**未列入 Sprint 51**: 純技術債清理 sprint, 不混新功能。

---

## §10 Plan Gate 決策記錄

### Q1: Sprint 51 主題?

- A. SourcesList v3 (A2 圖片 preview)
- B. SourcesList v3+ (A3)
- C. CRUD List 增強
- **D. 其他 SDK type dep 切斷** ← **採用**

### Q2: 範圍確認?

- **3 FR / 0.8 SP / 1 commit** (FR-18.1 ~ FR-18.3) ← **採用**

### Q3: Sprint 52+ 主題?

- **AI 生成 extensions product CRUD** (用戶主動提出) ← **記錄帶下**

---

## §11 下一步

1. ✅ Plan Gate 完成 (本文件)
2. → Design Gate: 擴充 PRD §2.13 FR-18
3. Stage 51-0: 實作 (1 commit)
4. Submit Gate: reflection + backlog

---

**Plan Gate 結束時間**: 2026-09-01
**Sprint 51 commits**: 1 (預估)
**Sprint 51 SP**: 0.8 (預估)
**下一個 gate**: Sprint 51 Design Gate