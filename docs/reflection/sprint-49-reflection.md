# Sprint 49 Reflection

> **Sprint**: Sprint 49 (技術債清理 sprint, 0 新功能)
> **日期**: 2026-09-01
> **狀態**: ✅ 完成
> **Plan Gate**: [docs/sprint49-plan-gate.md](../sprint49-plan-gate.md)
> **Audit**: 沿用 [Sprint 48 mid-review audit](../audit/sprint-48-mid-review.md) P0 ~ P1

---

## §1 Sprint 49 目標達成狀況

### Plan Gate 預估

| 項目 | 預估 | 實際 |
|---|---|---|
| Commits | 3 | 3 ✅ |
| FR | 9 | 9 ✅ |
| SP | 1.0 | 0.8 (49-2 從 0.5 降到 0.3) |
| 新功能 | 0 | 0 ✅ |

### Commit 序列

```
9645ac2 docs(sprint-49): Plan Gate (Office Rest Guard + UIMessage 切斷)
39a1852 docs(sprint-49): Design Gate (FR-14 ~ FR-16)
9645ac2 spike(sprint-49-0): UIMessage 切斷策略評估 (FR-16)
53d611b test(sprint-49-1): Office Rest Guard 強化 (FR-14)
5a870d4 refactor(sprint-49-2): UIMessage SDK 切斷 + 刪 dead code (FR-15)
```

### 測試基線演進

| Sprint | Files | Tests |
|---|---|---|
| Sprint 48-5 結尾 | 205 | 1938 |
| Sprint 49-0 | 206 | 1948 (+10) |
| Sprint 49-1 | 206 | 1952 (+4) |
| **Sprint 49-2 結尾** | **207** | **1956 (+18)** |

---

## §2 Stage 49-0 (Spike UIMessage 策略) 反思

### 達成

- 評估 conversation.tsx (4 處使用) + message.tsx (1 處使用) 的 UIMessage 實際面
- 列出 4 個替代方案評估
- **意外發現**: `messagesToMarkdown` + `ConversationDownload` 是 dead code (Sprint 45 ~ 48 從未被 import)
- 結論: 採用「方案 1 + 刪除 dead code」, 節省 0.2 SP

### 學習

- **spike 之前先 grep** 是必要的。Sprint 49-0 在 30 行內就揭露 dead code, 否則 Sprint 49-2 會花更多時間自訂複雜 UIMessage 型別
- 「想實作 UIMessage 替代」vs「刪除不需要的 UIMessage 使用」是兩條路, spike 證實後者更簡單

### 風險

- **risk**: 刪除 dead code 後, 若有人想用 `messagesToMarkdown` 從 markdown 輸出對話, 需重新實作
- **緩解**: Sprint 49-2 commit message 與本 reflection 都有記錄, git log 可追溯
- **機率**: 🟢 極低 (Sprint 45 ~ 48 = 4 個 sprint 未被用過)

---

## §3 Stage 49-1 (Office Rest Guard 強化) 反思

### 達成

- FR-14.1: 「必須裝」守護 — 7 個守護測試從 skip 模式改為 must-pass
- FR-14.2: fixture 路徑從不存在的 `mammoth-docx-fixture.docx` 修正為真實 `sample.docx`
- FR-14.3: 4 個 package.json 依賴守護 (jszip / fast-xml-parser / mammoth / xlsx)

### 學習

- **Sprint 48-4.1 hotfix 教訓延續**: 「console.warn + return」是守護失效的最常見模式, 必須改為 `throw new Error` 或 `expect(...).not.toBeNull()`
- **fixture 路徑檢查**: 即使 Sprint 48-5 已建立 `sample.docx`, 但測試內引用 `mammoth-docx-fixture.docx` 從未被發現 — 因為守護測試用 skip 模式, fixture 缺失被靜默跳過

### 對 Sprint 48 mid-review audit 的回應

| Audit # | 問題 | Sprint 49-1 回應 |
|---|---|---|
| #4 | 「必須裝」改為「找不到就 skip」 | ✅ 7 個測試改為 must-pass |
| #5 | fixture 路徑不一致 | ✅ 改為真實 `sample.docx` |
| #6 | jszip 是 transitive 未正式聲明 | ✅ Sprint 48-5 已正式列入 + Sprint 49-1 加守護 |

---

## §4 Stage 49-2 (UIMessage 切斷) 反思

### 達成

- 移除 conversation.tsx 中 ~75 行 dead code (UIMessage + DownloadIcon + helpers + exports)
- 修改 message.tsx: `MessageProps.from: UIMessage["role"]` → `from: ChatMessageRole`
- 全專案 source-code guard: 0 個 `from "ai" import UIMessage`
- Sprint 49-0 spike 守護測試從「spike 前快照」改為「Sprint 49-2 完成後快照」(自我驗證)

### 學習

- **spike 的價值**: 沒有 Sprint 49-0 spike, Sprint 49-2 會花時間自訂複雜 UIMessage 型別
- **守護測試的演進**: Sprint 49-0 的快照測試在 Sprint 49-2 完成後必須更新, 否則會失敗 — 這是「動態守護」的好範例, 不只是靜態斷言

### 影響範圍

| 檔案 | 變動 |
|---|---|
| `components/ai-elements/conversation.tsx` | -75 行 dead code |
| `components/ai-elements/message.tsx` | import 改路徑 + type 改用 ChatMessageRole |
| `tests/uimessage-deps-guard.test.ts` | 新增 (3 tests) |
| `tests/uimessage-spike-guard.test.ts` | 快照測試更新 |

---

## §5 Sprint 49 整體反思 — 6 個維度

### 5.1 範圍控制

- **好**: 嚴守「0 新功能」原則, 只做技術債清理
- **好**: 3 commits / 1.0 SP 全部按 Plan Gate 完成
- **待改**: 沒發現重大 scope creep

### 5.2 守護測試品質

- **好**: Sprint 49-1 守護從「skip 模式」改為「must-pass」, 確保未來不會退化
- **好**: Sprint 49-2 守護測試本身能被「Sprint 49-2 完成」驗證 (動態守護)
- **待改**: Sprint 49-2 守護只掃 `from "ai" import UIMessage`, 未來 Sprint 50+ 若要切斷其他型別, 需建立新守護

### 5.3 用戶體驗

- 無新增 user-facing 功能, 不影響 UX
- 守護測試失敗時 console.warn + return 已改為 throw new Error, 對 debug 更友善

### 5.4 程式碼品質

- **好**: 移除 ~75 行 dead code, 降低維護成本
- **好**: UIMessage 不再是「未使用但 exported」的迷惑介面
- **好**: ChatMessageRole 成為單一來源, 避免與 AI SDK 升級脫節

### 5.5 流程效率

- **好**: Sprint 49-0 spike 救了一個 SP (0.5 → 0.3)
- **待改**: Sprint 49-2 跑完整 1956 tests 用了 44 秒, 略長 (但還在合理範圍)

### 5.6 知識傳承

- **好**: 本 reflection 記錄 Sprint 49-0 spike 的 dead code 發現, Sprint 50+ 可參考
- **好**: Sprint 49-1 守護改為 must-pass 的方式, Sprint 50+ 類似守護可沿用
- **待改**: Sprint 49-2 中「守護測試自己也需要更新」的模式, 應在 SOP 補強

---

## §6 風險與緩解 (回顧)

### 風險 1: dead code 將來需要時又要重寫

- **嚴重性**: 🟢 極低 (4 個 sprint 未用過)
- **緩解**: commit message + reflection 記錄原因, git log 可追溯

### 風險 2: ChatMessageRole 與 UIMessage role 結構未來可能分歧

- **嚴重性**: 🟡 中
- **現況**: ChatMessageRole = `'user' | 'assistant' | 'system'` 與 AI SDK UIMessage role 一致
- **緩解**: Sprint 49-2 守護測試確保單一來源 (chat-utils.ts)

### 風險 3: Sprint 49-1 守護強化後, 依賴若被移除會 fail test

- **嚴重性**: 🟢 這是預期行為
- **理由**: 守護失敗是好事, 提醒開發者不可隨意移除依賴
- **緩解**: 若真有需要移除, 更新守護測試 + 確認無替代

---

## §7 Sprint 49 vs Sprint 48 對比

| 維度 | Sprint 48 | Sprint 49 |
|---|---|---|
| 主題 | 技術債清理 + Office Rest | 純技術債清理 |
| 新功能 | Office Rest 3 格式 (DOCX/XLSX/PPTX) | 0 |
| Commits | 5 (含 hotfix) | 3 |
| SP | 4.8 | 0.8 |
| 守護改進 | 3 個 P0 (audit 揭露) | 6 個 P1 (沿用 audit 揭露) |
| 範圍控制 | 略超 (audit 發現 3 P0) | 嚴守 (0 scope creep) |

---

## §8 Sprint 50+ 帶下項目

### 從 Sprint 47 ~ 48 ~ 49 累積待處理

| 來源 | 項目 | 優先 | 預估 SP |
|---|---|---|---|
| Sprint 47 | US-S50-SourcesList (SourcesList 升級新功能) | P2 | 2 SP |
| Sprint 48 | TD-S48-CRUDListEnhancements (CRUD List 增強) | P2 | 5 SP |
| Sprint 49 (新) | `UIMessage` 已切斷, 下一個 SDK type dep 為 `Message` (Sprint 50+ spike) | P3 | TBD |
| Sprint 49 (新) | Office Rest 三格式已有 spike, 可考慮加入 XLS 進階功能 (圖表解析等) | P3 | TBD |

### 排除項目（明確不做）

- Sprint 47-4 PDF parser 升級 (OCR)
- Sprint 45 訊息編輯功能
- Sprint 45 attachment 拖放

---

## §9 對 SOP 的反思

### SOP §2.3 4 Gate 表現

- **Gate 1 TDD**: Sprint 49-2 跑出 紅→綠 cycle, 證明守護測試先紅是真實發現違規, 非虛假綠燈
- **Gate 2 Lint+Typecheck**: 0 error (Sprint 49-2 改 MessageProps type, TypeScript 自動驗證相容)
- **Gate 3 Regression**: 1956 tests / 33 秒, 略長但可接受
- **Gate 4 Reviewer**: Sprint 49-0 spike 揭露 dead code 是 reviewer 視角的價值

### 對 SOP 的建議

1. **未來每個 sprint 開頭先跑 grep 找 dead code** — Sprint 49-0 spike 在 30 行內揭露 ~75 行 dead code, 應成為 SOP 標準動作
2. **spike 結論與實作 commit 應有明確參考** — Sprint 49-2 commit message 引用 Sprint 49-0 spike 文件, 讓 reviewer 容易追溯

---

## §10 Sprint 49 結論

### 成功

- ✅ 3 commits / 0.8 SP / 0 新功能 全部完成
- ✅ 3 個 FR (FR-14, FR-15, FR-16) 全部對應實作
- ✅ Sprint 48 mid-review audit #4-#6 全部回應
- ✅ ~75 行 dead code 移除 (意外好處)
- ✅ 全專案無 UIMessage 從 "ai" SDK import (技術債清除)

### 失敗

- 無

### 學習

- spike 在實作前先做, 是技術債清理 sprint 的關鍵紀律
- 「方案 1 + 刪 dead code」比「自訂複雜型別」更簡單可行
- 守護測試的「動態演進」(從 spike 前快照 → 完成後快照) 是新模式

### 為下一個 sprint 鋪墊

- Sprint 50 可考慮: SourcesList 升級 (P2, 2 SP) 或 CRUD List 增強 (P2, 5 SP)
- 或繼續技術債清理: 其他 SDK type dep 切斷

---

**Sprint 49 結束時間**: 2026-09-01
**Sprint 49 SP 完成率**: 100% (0.8 / 0.8)
**Sprint 49 commits**: 3
**下一個 sprint**: Sprint 50 (待 Plan Gate)