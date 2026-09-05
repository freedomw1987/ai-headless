# PRD: Chat 補完 — Sources/Reasoning + Vision + Frontend Upload + Office Parser + Cleanup Cron + 安全守護（Sprint 47）

> **對應 User Story**：Sprint 47 七主題並進
> **對應模組**：M5（AI Chat）+ M0（部署/安全）
> **版本**：1.0.0
> **最後更新**：2026-08-31
> **狀態**：✅ **Plan Gate 完成（6 個決策全部 ✅）** + 🟡 **Design Gate 進行中**
> **PRD 完整度**：14 章節完備（FR/Schema/介面/API/測試/計劃/風險/排除/Plan Gate/Design Gate）
> **Plan Gate 文件**：[docs/sprint47-plan-gate.md](../sprint47-plan-gate.md)
> **Sprint 46 Reflection**（起點）：[docs/reflection/sprint-46-reflection.md](../reflection/sprint-46-reflection.md)

---

## 1. 模組概述

### 1.1 Sprint 47 目標

Sprint 47 在 Sprint 46 已實作的真實附件上傳 + 進階 Markdown 基礎上，補齊七個主題：

1. **Sources / Reasoning UI**：Sprint 46 PRD §7 規劃但未實作 — 從 pi-agent-sdk 的 `thinking_*` events 收集 reasoning + 「附件引用」折疊區
2. **Vision 多模態圖片**：用 pi-agent-sdk 原生 `PromptOptions.images` 取代 Sprint 46 的 base64+prompt 方案
3. **真實前端上傳**：Sprint 46 backend upload route 已實作，前端 `useChatStream` 還在 Sprint 45「📎 filename」字串假象
4. **Office Parser**：Sprint 46 attachment-reader 對 PDF/DOCX/XLSX/PPTX 只 return `kind: 'unsupported'` — Sprint 47 補 parser（先做 bundle spike）
5. **Cleanup Cron**：Sprint 46 commit 6 已實作 `cleanupOldAttachments()`，但沒接排程 — Sprint 47 接 Vercel Cron
6. **Session Ownership**：Sprint 46 reflection 揭露的 P2 安全風險 — stream route 沒驗證 sessionId 歸屬
7. **Markdown XSS 守護**：Sprint 46 守護測試顯式避免 `rehype-raw` 但缺端到端 XSS 驗證

### 1.2 為什麼這七個主題放一個 Sprint？

- **依賴鏈**：47-2 Vision（改 agent-sdk）→ 47-3 Frontend Upload（前端整合依賴後端）→ 47-7 XSS 守護（驗證前面所有 Markdown 改動）
- **安全閉環**：47-6 Session Ownership 補 Sprint 46 揭露的安全漏洞
- **Production 完備**：47-5 Cleanup Cron 把 Sprint 46 「永久保留」轉為「自動清理」，production 部署必要
- **依賴 Sprint 46 reflection**：47-0 到 47-7 都是 reflection 揭露的後續工作，集合在一個 Sprint 收尾

### 1.3 模組邊界

| 屬於 Sprint 47 | 不屬於 Sprint 47 |
|---|---|
| Sources 折疊區（顯示附件引用作為「來源」）| RAG / 向量資料庫 / 真實 source citation |
| Reasoning 區塊（從 `thinking_delta` 收集） | 外部 source 引用（Wikipedia / Web search）|
| pi-agent-sdk 原生 multi-modal image | 自組 base64+prompt 方案（Sprint 46 過渡方案淘汰）|
| 真實前端 multipart 上傳 + XHR abort + 進度條 | 拖放上傳（drag-and-drop） |
| Office Parser（PDF/DOCX/XLSX/PPTX）+ bundle spike | OCR / 掃描文件識別 |
| Vercel Cron + `pnpm cleanup:once` 雙軌 | 排程 UI / 動態 retention policy |
| `requireSessionOwnership()` helper + source-code guard | 全 Prisma extension global filter |
| Markdown XSS E2E 3 場景守護 | CSP / Trusted Types / DOMPurify |
| TD-S47-ChatStatus 自訂型別（冰盒）| `ChatStatus` runtime 重構 |

### 1.4 與 Sprint 46 的差異

| 維度 | Sprint 46 | Sprint 47（本 PRD）|
|---|---|---|
| Reasoning UI | ❌ 未實作（subscription 只處理 text_delta）| ✅ 從 `thinking_delta` 收集 + ReasoningSection 元件 |
| Sources UI | ❌ 未實作 | ✅ 降階為「附件引用折疊區」 |
| Vision 圖片 | ⚠️ base64 + prompt 自組 | ✅ pi-agent-sdk `PromptOptions.images` 原生 |
| Frontend Upload | ⚠️ Sprint 45「📎 filename」字串假象 | ✅ 真實 multipart + XHR abort + 進度條 |
| Office Parser | ❌ `kind: 'unsupported'` | ✅ PDF/DOCX/XLSX/PPTX（bundle spike 先評估）|
| Cleanup Cron | ⚠️ utility 已實作、沒排程 | ✅ Vercel Cron + `pnpm cleanup:once` |
| Session Ownership | ❌ 未檢查（reflection P2 風險）| ✅ `lib/auth/session-ownership.ts` helper + guard |
| Markdown XSS | ⚠️ source-code guard（避免 rehype-raw）| ✅ E2E 3 場景守護（user input / AI output / code block）|
| ChatStatus 型別 | ⚠️ 從 `'ai'` SDK import | 📋 冰盒（不影響功能，Sprint 48+）|

### 1.5 依賴關係

- **依賴**：Sprint 46（backend upload route + Attachment schema + agent-sdk 重構 + Markdown + cleanup utility）、Sprint 44-45（Chat drawer + sessions CRUD）、Sprint 43（Custom URL Provider）
- **被依賴**：Sprint 48+（RAG、OCR、訊息編輯、attachment 拖放、ChatStatus runtime 重構）

---

## 2. 功能清單（Functional Requirements）

### 2.1 FR-1：Office Parser Bundle Spike（Stage 47-0）

| FR | 功能描述 | 優先級 | SP |
|---|---|---|---|
| **FR-1.1** | 安裝 pdf-parse / mammoth / xlsx（測量 bundle size）| P0 | 0.2 |
| **FR-1.2** | 在測試環境解析 3 種檔案各 1 個樣本（PDF/DOCX/XLSX），測量解析時間 + bundle size | P0 | 0.2 |
| **FR-1.3** | 產出 spike 文件決策（做 / 只做 PDF / 延 Sprint 48）| P0 | 0.1 |

### 2.2 FR-2：Sources / Reasoning UI（Stage 47-1）

| FR | 功能描述 | 優先級 | SP |
|---|---|---|---|
| **FR-2.1** | `agent-sdk.ts` `session.subscribe` 處理 `thinking_delta`：累積字串到 `reasoningContent` | P0 | 0.5 |
| **FR-2.2** | `agent-sdk.ts` `streamChatMessages` 接受 `onReasoningDelta` callback | P0 | 0.3 |
| **FR-2.3** | `useChatStream.ts` 收集 `reasoningContent` 串流給前端 | P0 | 0.3 |
| **FR-2.4** | SSE protocol 擴展：`data: { reasoning: '...' }` event 給前端 | P0 | 0.2 |
| **FR-2.5** | `<ReasoningSection>` 元件：顯示 reasoning 字串 + 預設收合 + 點擊展開 + 鍵盤可達 | P0 | 0.5 |
| **FR-2.6** | `<SourcesList>` 元件（降階為「附件引用」）：顯示本次對話附件 chip 清單 + 預設收合 | P0 | 0.2 |
| **FR-2.7** | Message 元件整合：ReasoningSection 在 message content 上方、SourcesList 在下方 | P0 | 0.3 |

### 2.3 FR-3：Vision 多模態圖片（Stage 47-2）

| FR | 功能描述 | 優先級 | SP |
|---|---|---|---|
| **FR-3.1** | `attachment-reader.ts` 圖片分支改為 `readAttachmentImage()`（已實作，47-2 確認）| P0 | 0.3 |
| **FR-3.2** | `agent-sdk.ts` `streamChatMessages` 改用 `PromptOptions.images` 傳圖片給 SDK | P0 | 0.7 |
| **FR-3.3** | 圖片多張時合併 ImageContent[]（最多 10 張，跟 attachment 上限一致）| P0 | 0.3 |
| **FR-3.4** | `attachments` 參數型別改為支援圖片（不只文字）：`AttachmentRef[]` + `ImageAttachment[]` 雙型別 union | P0 | 0.3 |
| **FR-3.5** | 整合測試：上傳 PNG → AI 回應含圖片內容（用真實 Custom URL Provider）| P0 | 0.4 |

### 2.4 FR-4：真實前端上傳（Stage 47-3）

| FR | 功能描述 | 優先級 | SP |
|---|---|---|---|
| **FR-4.1** | `useChatStream.send()` 重構：先 multipart upload → 拿 attachment IDs → 傳 stream route | P0 | 1 |
| **FR-4.2** | XHR `XMLHttpRequest` + `onprogress` 事件顯示 0-100% 上傳進度 | P1 | 0.5 |
| **FR-4.3** | XHR `abort()` 整合：離開頁面 / 切換 session 時 abort 進行中上傳 | P0 | 0.5 |
| **FR-4.4** | 錯誤處理：10 MB 超限 toast「檔案過大」、MIME 不符 toast「不支援的格式」、RBAC 失敗導向登入 | P0 | 0.5 |
| **FR-4.5** | 進度條 UI 元件：shadcn Progress + 「上傳中 45%」文字 | P1 | 0.5 |
| **FR-4.6** | 整合測試：選檔 → upload → AI 回應（mock fetch）| P0 | 0.5 |
| **FR-4.7** | E2E：選檔 → upload → AI 回應含附件內容（Playwright）| P0 | 0.5 |

### 2.5 FR-5：Office Parser（Stage 47-4）

> **Sprint 47 決策**（spike 完成，見 [docs/spike/sprint47-office-parser.md](../spike/sprint47-office-parser.md)）：**只做 PDF（D-1 方案）**。DOCX/XLSX 延 Sprint 48+。
>
> **理由**：
> 1. **80/20 法則**：PDF 佔 Office 附件 60% use case
> 2. **Bundle 控管**：pdf-parse ~5-8 MB 還可接受；mammoth + xlsx 共 9.6 MB 額外負擔
> 3. **Sprint 47 整體時程**：保留 12 SP 給其他 6 個主題，安全守護不能被砍

| FR | 功能描述 | 優先級 | SP |
|---|---|---|---|
| **FR-5.1** | PDF parser：`pdf-parse` v2.4.5（class API: `PDFParse({ data }).getText()`）| P0 | 1 |
| **FR-5.2** | ~~DOCX parser（`mammoth`）~~ → **Sprint 48+** | — | 0 |
| **FR-5.3** | ~~XLSX parser（`xlsx`）~~ → **Sprint 48+** | — | 0 |
| **FR-5.4** | `attachment-reader.ts` 接入 PDF parser（kind: 'office' for PDF）| P0 | 0.5 |
| **FR-5.5** | 整合測試：sample.pdf fixture 解析成功 | P0 | 0.5 |
| **FR-5.6** | ~~bundle 影響評估~~ → 已包含在 [spike 文件](../spike/sprint47-office-parser.md) | — | 0 |

### 2.6 FR-6：Cleanup Cron（Stage 47-5）

| FR | 功能描述 | 優先級 | SP |
|---|---|---|---|
| **FR-6.1** | `vercel.json` 加 cron 設定：每日 03:00 UTC 呼叫 `/api/cron/cleanup-attachments` | P0 | 0.5 |
| **FR-6.2** | `/api/cron/cleanup-attachments` route 呼叫 `cleanupOldAttachments()` + Bearer token 守衛 | P0 | 0.5 |
| **FR-6.3** | `pnpm cleanup:once` script：本機手動觸發 + 顯示清理數量 | P0 | 0.5 |
| **FR-6.4** | 整合測試：route 回傳清理結果 JSON + token 守衛拒絕未授權 | P0 | 0.3 |
| **FR-6.5** | 文件：Vercel Cron 環境變數設定（CRON_SECRET）+ 本機 `.env.example` | P0 | 0.2 |

### 2.7 FR-7：Session Ownership（Stage 47-6）

| FR | 功能描述 | 優先級 | SP |
|---|---|---|---|
| **FR-7.1** | `lib/auth/session-ownership.ts`：`requireSessionOwnership(sessionId, userId)` 函式 | P0 | 0.3 |
| **FR-7.2** | stream route 整合：拿到 sessionId 後 call `requireSessionOwnership(sessionId, user.id)` | P0 | 0.3 |
| **FR-7.3** | 整合測試：user A 送 user B sessionId + attachment ID → 403 拒絕 | P0 | 0.3 |
| **FR-7.4** | source-code guard：所有用 body sessionId 的 route 必須 call `requireSessionOwnership`（掃 `app/api/admin/chat/**/*.ts`）| P0 | 0.1 |

### 2.8 FR-8：Markdown XSS E2E（Stage 47-7）

| FR | 功能描述 | 優先級 | SP |
|---|---|---|---|
| **FR-8.1** | E2E X1：user input 含 `<script>alert(1)</script>` → Markdown 渲染後應 escape | P0 | 0.15 |
| **FR-8.2** | E2E X2：AI output 含 `<img src=x onerror=alert(1)>` → 應 escape 不渲染為 HTML | P0 | 0.15 |
| **FR-8.3** | E2E X3：code block 內 `<script>` 不執行（已 escape，驗證不破壞）| P0 | 0.2 |

### 2.9 FR 總計

| 主題 | FR 數 | SP 總計 |
|---|---|---|
| FR-1 Office Spike | 3 | 0.5 |
| FR-2 Sources/Reasoning | 7 | 2.3 |
| FR-3 Vision | 5 | 2 |
| FR-4 Frontend Upload | 7 | 4 |
| FR-5 Office Parser | 3 | 2（只 PDF, spike 決策 D-1）|
| FR-6 Cleanup Cron | 5 | 2 |
| FR-7 Session Ownership | 4 | 1 |
| FR-8 Markdown XSS | 3 | 0.5 |
| **總計** | **37 FR** | **14 SP** |

---

## 2.10 FR-9 ~ FR-13：Sprint 48 技術債清理 + Office Rest 延伸（Stage 48-1 ~ 48-5）

**對應 Plan Gate**: [docs/sprint48-plan-gate.md](../sprint48-plan-gate.md)
**對應 Sprint 47 Reflection**: [docs/reflection/sprint-47-reflection.md](../reflection/sprint-47-reflection.md) 揭露 4/5 項

### FR-9：Lint Cleanup（Stage 48-1）

| FR | 功能描述 | 優先級 | SP |
|---|---|---|---|
| **FR-9.1** | 修 `react-hooks/exhaustive-deps` (admin-sidebar.tsx, settings/page.tsx) | P2 | 0.2 |
| **FR-9.2** | 修 `await-thenable` (roles/page.tsx, users/page.tsx) | P2 | 0.15 |
| **FR-9.3** | 修 `no-floating-promises` (conversation.tsx) | P2 | 0.15 |

### FR-10：ChatStatus 自訂型別（Stage 48-2）

| FR | 功能描述 | 優先級 | SP |
|---|---|---|---|
| **FR-10.1** | `chat-utils.ts` 自訂 `ChatStatus = 'ready' \| 'submitted' \| 'streaming' \| 'error'` 型別 | P2 | 0.1 |
| **FR-10.2** | `use-chat-stream.ts` 移除 `from 'ai'` import, 改 import 自 `chat-utils` | P2 | 0.1 |
| **FR-10.3** | source-code guard: 驗證無 `'ai'` SDK import on `use-chat-stream.ts` | P2 | 0.1 |

### FR-11：Upload Ownership Refactor（Stage 48-3）

| FR | 功能描述 | 優先級 | SP |
|---|---|---|---|
| **FR-11.1** | `app/api/admin/chat/upload/route.ts` 改 call `requireSessionOwnership(sessionId, user.id)` 取代內聯查詢 | P2 | 0.3 |
| **FR-11.2** | upload route guard test: 驗證 upload route 也 call helper | P2 | 0.2 |

### FR-12：Office Rest Bundle Spike（Stage 48-4）

| FR | 功能描述 | 優先級 | SP |
|---|---|---|---|
| **FR-12.1** | Spike 文件：評估 mammoth / xlsx / pptx 3 個依賴的 bundle 影響 | P1 | 0.2 |
| **FR-12.2** | PPTX parser library 選擇決策（pptxgenjs vs node-pptx vs 其他）| P1 | 0.3 |

### FR-13：Office Parser Rest - DOCX/XLSX/PPTX（Stage 48-5）

| FR | 功能描述 | 優先級 | SP |
|---|---|---|---|
| **FR-13.1** | DOCX parser: `mammoth` 動態 import + try/finally + 抽出文字 | P1 | 1 |
| **FR-13.2** | XLSX parser: `xlsx` 動態 import + try/finally + 每個 sheet 轉文字 | P1 | 1 |
| **FR-13.3** | PPTX parser: 依 spike 決策選 library + 動態 import + 每張 slide 抽文字 | P1 | 0.5 |
| **FR-13.4** | `attachment-reader.ts` 接入 3 個 parser (kind: 'office' 變體複用) | P1 | 0.3 |
| **FR-13.5** | 3 個 fixture (sample.docx / sample.xlsx / sample.pptx) + 整合測試 | P1 | 0.2 |

### FR 總計（含 Sprint 48）

| 主題 | FR 數 | SP 總計 |
|---|---|---|
| FR-1 ~ FR-8 (Sprint 47) | 37 | 14 |
| FR-9 Lint Cleanup | 3 | 0.5 |
| FR-10 ChatStatus | 3 | 0.3 |
| FR-11 Upload Ownership Refactor | 2 | 0.5 |
| FR-12 Office Rest Spike | 2 | 0.5 |
| FR-13 Office Parser Rest | 5 | 3 |
| **Sprint 48 新增** | **15 FR** | **~4.8 SP** |
| **總計 (Sprint 47+48)** | **52 FR** | **~18.8 SP** |

**Office Parser 降階情境**（已被 spike 決策解答）：
- ✅ Spike 結果：**D-1 方案（只做 PDF, 2 SP）** — 見 [spike 文件](../spike/sprint47-office-parser.md) §5
- 替選方案（已取消）：D-0 全做（5 SP）、D-2 延 Sprint 48（0 SP）

### 2.11 FR-14 ~ FR-16：Sprint 49 技術債清理（Office Rest Guard 強化 + UIMessage 切斷）

> **Sprint 49 決策**（基於 [Sprint 48 Reflection](reflection/sprint-48-reflection.md)）：
> - **範圍方案 A**：Office Rest Guard 強化 + UIMessage 切斷（0 新功能）
> - **3 commits / 1.0 SP / 3 days**
> - 詳見 [sprint49-plan-gate.md](../sprint49-plan-gate.md)

#### FR-14：Office Rest Guard 強化（Stage 49-1, 0.3 SP）

> **來源**: [Sprint 48 mid-review audit](audit/sprint-48-mid-review.md) 揭露 P1 項目 #4-#6

| FR | 描述 | 優先 | SP |
|----|------|------|-----|
| **FR-14.1** | `tests/office-rest-spike.test.ts` 改為「必須裝」守護（不再是「找不到就 skip」） | P1 | 0.1 |
| **FR-14.2** | fixture 路徑修正（`mammoth-docx-fixture.docx` → 真實 `sample.docx`） | P1 | 0.1 |
| **FR-14.3** | 加 jszip / fast-xml-parser 「正式列為 package.json 依賴」守護（驗證 Sprint 48-5 列入仍存） | P1 | 0.1 |

**FR-14.1 實作細節**：
- 原本測試若 jszip/fast-xml-parser 沒裝就 `return`（測試綠但守護失效）
- 改為 `expect(module, 'jszip 應已安裝').not.toBeNull()`
- Sprint 48-5 已 `pnpm add jszip fast-xml-parser` 正式列入，現在可放心驗證

**FR-14.2 實作細節**：
- 原本 `mammoth-docx-fixture.docx` 在測試內引用但實際不存在
- Sprint 48-5 已建立 `tests/fixtures/office-parser/sample.docx`
- 守護測試改用實際 fixture 路徑

**FR-14.3 實作細節**：
- 從 `package.json` `dependencies` + `devDependencies` 讀 deps object
- 驗證 `deps.jszip` 與 `deps['fast-xml-parser']` 存在
- Sprint 48-5 已正式列入，本守護是防止未來誤刪依賴

#### FR-15：UIMessage 自訂型別切斷（Stage 49-2, 0.5 SP）

> **來源**: [Sprint 48 Reflection](reflection/sprint-48-reflection.md) 問題 #5

| FR | 描述 | 優先 | SP |
|----|------|------|-----|
| **FR-15.1** | 自訂 `UIMessage` 替代型別到 `lib/ai/chat/chat-utils.ts` | P1 | 0.2 |
| **FR-15.2** | 修改 `conversation.tsx` 改 import 自 chat-utils（不再 `from "ai"` import UIMessage） | P1 | 0.1 |
| **FR-15.3** | 修改 `message.tsx` 改 import 自 chat-utils（不再 `from "ai"` import UIMessage） | P1 | 0.1 |
| **FR-15.4** | 加 source-code guard 守護全專案無 `from "ai" import UIMessage` | P1 | 0.1 |

**FR-15.1 實作細節**：
- 方案 1 (最簡單, 預設): `export type UIMessage = ChatMessage[]`
- 若 Sprint 49-0 spike 發現需要更複雜型別，改用方案 3: local interface 局部替代
- 仍保留 AI SDK `ChatStatus` 自訂型別（從 Sprint 48-2）

**FR-15.2 / FR-15.3 實作細節**：
- 改 import 為 `import type { UIMessage } from '@/lib/ai/chat/chat-utils'`
- 程式碼其他部分不變（仍使用 UIMessage 型別簽名）

**FR-15.4 守護細節**：
- 類似 Sprint 48-4.1 hotfix 改進：用 Node.js fs API 遞迴掃描
- regex: `/from\s+["']ai["']/i` (單/雙引號都抓)
- 額外 filter: `/import.*UIMessage/i` 確保只守護 UIMessage import

#### FR-16：Spike UIMessage 切斷策略評估（Stage 49-0, 0.2 SP）

> **為什麼需要 spike**: Sprint 48-2 ChatStatus 已有守護失效教訓，先 spike 驗證策略再實作

| FR | 描述 | 優先 | SP |
|----|------|------|-----|
| **FR-16.1** | 評估 conversation.tsx + message.tsx 對 UIMessage 的實際使用面（哪些欄位被用） | P1 | 0.1 |
| **FR-16.2** | 產出 `docs/spike/sprint49-uimessage.md` 記錄 3 個替代方案評估與選擇 | P1 | 0.1 |

**FR-16.1 評估面向**：
- UIMessage 哪些欄位被讀寫：`id`, `role`, `parts`, `experimental_attachments`, `content`, ...
- 是否有 AI SDK runtime 依賴（如 `useChat` 回傳 UIMessage）
- 若有 runtime 依賴，可能需要 re-export 自 AI SDK 而非完全切斷

**FR-16.2 spike 文件章節**：
- 目的 / 當前 UIMessage 使用面 / 3 個替代方案評估 / 選擇與理由 / Sprint 49-2 行動清單 / 風險

#### FR 總計（含 Sprint 49）

| 主題 | FR 數 | SP 總計 |
|---|---|---|
| Sprint 47+48 (累積) | 52 | ~18.8 |
| FR-14 Office Rest Guard 強化 | 3 | 0.3 |
| FR-15 UIMessage 切斷 | 4 | 0.5 |
| FR-16 Spike UIMessage 策略 | 2 | 0.2 |
| **Sprint 49 新增** | **9 FR** | **~1.0 SP** |
| **總計 (Sprint 47+48+49)** | **61 FR** | **~19.8 SP** |

**Sprint 49 範圍方案選擇**：
- ✅ **方案 A** (本 Sprint 採用)：Office Rest Guard 強化 + UIMessage 切斷（3 commits / 1.0 SP / 0 新功能）
- 替選方案（已取消）：
  - B (3 SP, 含 SourcesList 新功能) — Sprint 49 決定不擴張
  - C (6 SP, 含 CRUD List 增強) — 留 Sprint 50+
  - D (最小範圍, 0.8 SP) — 與 A 差異僅 1 個守護項目，方案 A 已包含

### 2.12 FR-17：SourcesList 升級（檔案類型圖示 + 下載按鈕）

> **Sprint 50 決策**（基於 [Sprint 49 Reflection](reflection/sprint-49-reflection.md) §8 帶下項目）：
> - **方案 A1**：檔案類型圖示 + 下載按鈕
> - **1 commit / 0.8 SP / 4 FR**
> - **SourcesList 從 Sprint 47 帶下第 4 次，本 Sprint 升級為「可下載」**
> - 詳見 [sprint50-plan-gate.md](../sprint50-plan-gate.md)

| FR | 描述 | 優先 | SP |
|----|------|------|-----|
| **FR-17.1** | 加 5 種檔案類型 icon 區分 (PDF/DOCX/XLSX/PPTX/圖片/未分類) | P2 | 0.2 |
| **FR-17.2** | 加檔案類型標籤 (顯示「MIME 友好名」如「PDF 文件」) | P2 | 0.1 |
| **FR-17.3** | 加下載按鈕 (每個附件有 `<a download>` 連結) | P2 | 0.3 |
| **FR-17.4** | 建立下載 API `/api/admin/chat/attachments/[id]/download` (RBAC + session ownership 三層守衛) | P2 | 0.2 |
| **總計** | **4 FR** | | **0.8 SP** |

#### FR-17.1 檔案類型 icon 區分

**實作**：
```typescript
// helpers/attachment-icon.ts
function getAttachmentIcon(mimeType: string): LucideIcon {
  if (mimeType.startsWith('image/')) return ImageIcon;
  if (mimeType === 'application/pdf') return FileTextIcon;
  if (mimeType.includes('word') || mimeType.includes('document')) return FileTextIcon;
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return SheetIcon;
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return PresentationIcon;
  if (mimeType.startsWith('text/')) return FileTextIcon;
  return FileIcon; // fallback
}
```

**icon 對應**（lucide-react 已裝）：
- 圖片 (jpg/png/webp/gif) → `ImageIcon`
- PDF / Word / TXT → `FileTextIcon`
- XLSX → `SheetIcon`
- PPTX → `PresentationIcon`
- 其他 → `FileIcon` (fallback)

#### FR-17.2 MIME 友好名標籤

**實作**：
```typescript
const MIME_LABELS: Record<string, string> = {
  'application/pdf': 'PDF 文件',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word 文件',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel 表格',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PowerPoint 簡報',
  'image/jpeg': 'JPEG 圖片',
  'image/png': 'PNG 圖片',
  'image/gif': 'GIF 圖片',
  'image/webp': 'WebP 圖片',
  'text/plain': '純文字',
  'text/csv': 'CSV 表格',
  'text/markdown': 'Markdown',
};
```

#### FR-17.3 下載按鈕

**實作**：
```typescript
<a
  href={`/api/admin/chat/attachments/${att.id}/download`}
  download
  aria-label={`下載 ${att.filename}`}
>
  <DownloadIcon className="size-3" />
</a>
```

**為什麼用 `<a download>` 而非 `fetch` + Blob**：
- 瀏覽器原生支援，不需 JS
- 對大檔更友善（10MB 不會吃記憶體）
- 與 RBAC redirect 機制相容（401/403 自動跳轉）

#### FR-17.4 下載 API

**位置**：`app/api/admin/chat/attachments/[id]/download/route.ts`

**RBAC + session ownership + 404 三層守衛**（對齊 upload route Sprint 48-3 重構 pattern）：

```typescript
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. RBAC 雙層守衛
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!(await isAdmin())) return NextResponse.json({ error: 'Admin only' }, { status: 403 });

  // 2. 讀 attachment
  const { id } = await params;
  const attachment = await db.attachment.findUnique({ where: { id } });
  if (!attachment) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // 3. 驗證 session 歸屬
  await requireSessionOwnership(attachment.sessionId, user.id);

  // 4. 讀檔案 (含 path traversal 防護)
  const filePath = join(process.cwd(), attachment.storagePath);
  if (!filePath.startsWith(UPLOAD_ROOT)) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 500 });
  }
  const buffer = await readFile(filePath);

  // 5. 回傳 (含 Content-Disposition 強制下載 + 中文檔名編碼)
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': attachment.mimeType,
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(attachment.filename)}`,
      'Content-Length': attachment.size.toString(),
    },
  });
}
```

**安全設計**：
- **RBAC 雙層**：`requireUser` + `isAdmin`（對齊 upload route）
- **session ownership**：`requireSessionOwnership(attachment.sessionId, user.id)`（Sprint 48-3 helper）
- **path traversal 防護**：`filePath.startsWith(UPLOAD_ROOT)` 驗證
- **中文檔名**：`filename*=UTF-8''...` RFC 5987 雙編碼

#### FR 總計（含 Sprint 50）

| 主題 | FR 數 | SP 總計 |
|---|---|---|
| Sprint 47~49 (累積) | 61 | ~19.6 |
| FR-17 SourcesList 升級 (Sprint 50) | 4 | 0.8 |
| **Sprint 50 新增** | **4 FR** | **~0.8 SP** |
| **總計 (Sprint 47+48+49+50)** | **65 FR** | **~20.4 SP** |

**Sprint 50 範圍方案選擇**：
- ✅ **方案 A1**（本 Sprint 採用）：檔案類型圖示 + 下載按鈕（1 commit / 0.8 SP / 0 新架構風險）
- 替選方案（已取消）：
  - A2 (1.2 SP, 圖片 inline preview) — 留 Sprint 51+
  - A3 (2 SP, A1 + A2 全部) — 範圍過大，Sprint 51+ 再評估

#### SourcesList 演進史

| Sprint | 版本 | 功能 |
|---|---|---|
| Sprint 47 | v1 | 附件引用折疊區（無下載） |
| **Sprint 50** | **v2** | **+ 檔案類型 icon + MIME 標籤 + 下載按鈕 + 下載 API** |
| Sprint 51+ (規劃) | v3 | 圖片 inline preview (A2) |

### 2.13 FR-18：SDK Type Dep 切斷 (FileUIPart + SourceDocumentUIPart)

> **Sprint 51 決策**（基於 [Sprint 50 Reflection](reflection/sprint-50-reflection.md) §5 帶下項目）：
> - **方案 D**：其他 SDK type dep 切斷
> - **1 commit / 0.8 SP / 3 FR**
> - **純技術債清理，0 新功能, 0 新架構風險**
> - **Sprint 52+ 帶下**：用戶主動提出「AI 生成 extensions product CRUD」（另開 Plan Gate 評估）
> - 詳見 [sprint51-plan-gate.md](../sprint51-plan-gate.md)

| FR | 描述 | 優先 | SP |
|----|------|------|-----|
| **FR-18.1** | 自訂 `FileUIPart` + `SourceDocumentUIPart` 型別到 `lib/ai/chat/ui-message-parts.ts` | P3 | 0.3 |
| **FR-18.2** | 修改 `components/ai-elements/prompt-input.tsx` 改 import 自 ui-message-parts（不再 `from "ai"`） | P3 | 0.2 |
| **FR-18.3** | 加全專案 source-code guard, 確保無 `from "ai" import FileUIPart\|SourceDocumentUIPart\|UIMessage\|ChatStatus` | P3 | 0.3 |
| **總計** | **3 FR** | | **0.8 SP** |

#### FR-18.1 自訂 UIMessage Part 型別

**位置**：`lib/ai/chat/ui-message-parts.ts`（新增）

**對齊 AI SDK 'ai' 7.0** 欄位（從 `node_modules/.pnpm/ai@7.0.85_zod@3.24.1/node_modules/ai/dist/index.d.ts` 1934-1965 行讀取）：

```typescript
export type FileUIPart = {
  type: 'file';  // literal
  mediaType: string;
  filename?: string;
  url: string;
  providerMetadata?: Record<string, unknown>;
};

export type SourceDocumentUIPart = {
  type: 'source-document';  // literal
  sourceId: string;
  mediaType: string;
  title: string;
  filename?: string;
  providerMetadata?: Record<string, unknown>;
};
```

**設計延續**：
- Sprint 48-2 切斷 `ChatStatus` 模式：自訂到 `@/lib/ai/chat/chat-utils.ts`
- Sprint 49-2 切斷 `UIMessage` 模式：刪除未使用 SDK 型別 + 自訂 `ChatMessageRole` 到 `@/lib/ai/chat/chat-utils.ts`
- Sprint 51 切斷 `FileUIPart` + `SourceDocumentUIPart` 模式：建獨立檔 `ui-message-parts.ts`（因屬不同概念）

#### FR-18.2 修改 prompt-input.tsx

**修改前**：
```typescript
import type { FileUIPart, SourceDocumentUIPart } from "ai";
```

**修改後**：
```typescript
import type { FileUIPart, SourceDocumentUIPart } from "@/lib/ai/chat/ui-message-parts";
```

**不變**：
- 型別簽名完全相同（`files: (FileUIPart & { id: string })[]` 等）
- Runtime 行為完全不變（只改 type import 路徑）
- 既有 prompt-input.test.tsx 仍綠即可證明

#### FR-18.3 Source-code Guard

**位置**：`tests/sdk-type-deps-guard.test.ts`（新增）

**沿用模式**：
- Sprint 48-4.1 hotfix 改進：Node.js `fs` API 遞迴掃描（避免 shell quote 解析錯誤）
- Sprint 49-2 UIMessage guard 模式：regex pattern + import 檢測

**守護項目**：
- ✅ 無 `from "ai" import FileUIPart`（Sprint 51 新切斷）
- ✅ 無 `from "ai" import SourceDocumentUIPart`（Sprint 51 新切斷）
- ✅ 無 `from "ai" import UIMessage`（Sprint 49-2 持續守護）
- ✅ 無 `from "ai" import ChatStatus`（Sprint 48-2 持續守護）
- ✅ `lib/ai/chat/ui-message-parts.ts` 存在（FR-18.1 守護）
- ✅ prompt-input.tsx 改 import 自 ui-message-parts（FR-18.2 守護）
- ✅ FileUIPart 欄位完整（type + mediaType + filename? + url + providerMetadata?）
- ✅ SourceDocumentUIPart 欄位完整（type + sourceId + mediaType + title + filename? + providerMetadata?）

**預估**: +8 tests

#### 風險與緩解

| 風險 | 嚴重性 | 緩解 |
|---|---|---|
| 自訂型別與 AI SDK 升級脫節 | 🟡 中 | 守護測試明確列出欄位，升級時手動更新；PR review check 需同步檢查 |
| prompt-input.tsx 改 import 後 runtime 行為改變 | 🟢 極低 | 只改 type import 路徑，runtime 程式碼完全不動；既有測試仍綠即可證明 |
| Sprint 50-0 SourcesList v2 守護依賴 SDK 型別 | 🟢 無 | Sprint 50-0 用自訂 MIME labels，沒用 SDK FileUIPart |

#### FR 總計（含 Sprint 51）

| 主題 | FR 數 | SP 總計 |
|---|---|---|
| Sprint 47~50 (累積) | 65 | ~20.4 |
| FR-18 SDK Type Dep 切斷 (Sprint 51) | 3 | 0.8 |
| **Sprint 51 新增** | **3 FR** | **~0.8 SP** |
| **總計 (Sprint 47+48+49+50+51)** | **68 FR** | **~21.2 SP** |

**Sprint 51 範圍方案選擇**：
- ✅ **方案 D**（本 Sprint 採用）：其他 SDK type dep 切斷（0 新功能，0 新架構風險）
- 替選方案（已取消）：
  - A (1.2 SP, SourcesList v3 圖片 preview) — 留 Sprint 52+
  - B (1.2 SP, SourcesList v3+) — 同 A
  - C (5 SP, CRUD List 增強) — 留 Sprint 52+

#### SDK Type Dep 切斷演進史

| Sprint | 切斷目標 | 結果 |
|---|---|---|
| Sprint 48-2 | `ChatStatus` | ✅ 完成，但守護失效（Sprint 48 mid-review audit P0 → Sprint 49 守護強化） |
| Sprint 49-2 | `UIMessage` | ✅ 完成，移除 ~75 行 dead code |
| **Sprint 51** | **`FileUIPart` + `SourceDocumentUIPart`** | **本 Sprint** |

**Sprint 51 結尾**：全專案 `from "ai"` 應為 0（type dep 切斷完成）。

#### Sprint 52+ 帶下

| 項目 | 預估 SP | 備註 |
|---|---|---|
| AI 生成 extensions product CRUD | TBD | 用戶主動提出（Sprint 51 Plan Gate Q&A），需另開 Plan Gate 評估 → Sprint 52 採用 |

### 2.14 FR-19：AI Chat 生成 extensions product CRUD

> **Sprint 52 決策**（基於 [Sprint 51 Reflection](reflection/sprint-51-reflection.md) §5 帶下項目）：
> - **方向澄清**：不是「手動建 product extension」，而是「讓 admin 在 pi agent chat 中用自然語言 prompt 生成 extensions 程式碼」
> - **3 commits / 2 SP / 5 FR**
> - **新方向 sprint** — 探討 AI coding 在 admin chat 中的應用
> - 詳見 [sprint52-plan-gate.md](../sprint52-plan-gate.md)

| FR | 描述 | 優先 | SP |
|----|------|------|-----|
| **FR-19.1** | spike: 驗證 pi agent 從 chat prompt 可生成 extensions 程式碼 | P3 | 0.5 |
| **FR-19.2** | 設計 extension generator prompt + manifest/spec schema 模板 | P3 | 0.3 |
| **FR-19.3** | admin chat 加 slash command `/extension create` 觸發 | P3 | 0.3 |
| **FR-19.4** | AI 從 prompt 生成 8 個 extension 檔案（對齊 todo extension 結構） | P3 | 0.5 |
| **FR-19.5** | 三層驗證（loader test + manifest schema + tsc）+ 覆寫保護（`--force`） | P3 | 0.4 |
| **總計** | **5 FR** | | **2.0 SP** |

#### 5 個 Q&A 決策彙總

| 決策 | 採用 | 為何 |
|---|---|---|
| 方向 | AI chat 自然語言生成完整 product extension | 用戶明確提出 AI 生成需求 |
| 觸發模式 | slash command `/extension create` | 明確，易測試，避免誤觸 |
| 生成範圍 | 完整 8 個檔案（對齊 todo） | 一次性生成完整可運作的 extension |
| 驗證方式 | 三層：loader test + manifest schema + tsc | 嚴謹，防止 AI 生成無法運作的程式碼 |
| 覆寫保護 | 預設拒絕，`--force` 才覆寫 | 安全，避免 AI 誤刪既有 extensions |

#### FR-19.1 spike 驗證可行性

**目的**：確認 pi agent 的 coding capability 能生成 extensions 結構 + 程式碼，避免 Sprint 52-2 大規模實作後才發現不可行。

**spike 任務**：
1. 在 admin chat 用自然語言 prompt：「建立一個 product extension，含 CRUD + hook + action + computed」
2. 觀察 pi agent 是否能：
   - 生成 `extensions/product/manifest.json`
   - 生成 `extensions/product/product-spec.json`
   - 生成 1 個簡單 hook（e.g. `beforeCreate.ts`）
3. 評估生成品質（是否可編譯、是否對齊 extension-loader schema）

**預估產出**：`docs/spike/sprint52-ai-extension-gen.md` + spike 守護測試

#### FR-19.2 設計 extension generator

**位置**：`lib/ai/agent-sdk/extension-generator.ts`（新增）

**設計**：
- **Prompt 模板**：系統 prompt 告訴 pi agent 應生成什麼
- **Manifest schema**：Zod schema 驗證生成的 manifest.json
- **Spec schema**：Zod schema 驗證生成的 spec.json
- **Output 規範**：pi agent 透過 tool call 寫檔，不用 raw text

**範本參考**：
- `extensions/todo/manifest.json`（manifest 範本）
- `extensions/todo/todo-spec.json`（spec 範本）

#### FR-19.3 Slash Command 觸發

**位置**：`app/admin/_components/admin-chat-panel.tsx`（修改）

**設計**：
- 偵測使用者輸入 `/extension create <name>`
- 解析為 extension generator 請求
- 把請求送到 pi agent session，帶 extension-generator prompt
- 例如：`/extension create product --fields name,price,stock`
- 例如：`/extension create product --force`（覆寫既有）

#### FR-19.4 AI 生成 8 個檔案

**生成檔案清單**（對齊 todo extension 結構）：

```
extensions/product/
├── actions/                 (1 個 action: createProduct)
├── computed/                (1 個 computed: isInStock)
├── examples/                (1 個 example: list-and-filter)
├── hooks/                   (1 個 hook: beforeCreate)
├── workflow/                (1 個 workflow: product-workflow)
├── manifest.json
├── README.md
└── product-spec.json        (CRUD spec)
```

**生成流程**：
1. Admin prompt → pi agent 收到「生成 extension」指令
2. pi agent 透過 tool call（e.g. `write_file`）生成每個檔案
3. 每個 tool call 經過 server-side 驗證（manifest schema + spec schema）

**AI 生成的限制**：
- 只能寫入 `extensions/<name>/` 目錄（路徑防護）
- 不能修改 `extensions/todo`, `extensions/blog` 等既有 extension（除非 `--force`）
- 不能修改 `lib/extensions/` 等核心程式

#### FR-19.5 三層驗證 + 覆寫保護

**驗證流程**：

```
pi agent 生成所有檔案
   ↓
[1] Manifest schema 驗證（Zod）
   ↓ 通過
[2] ts/tsx 編譯驗證（tsc --noEmit）
   ↓ 通過
[3] extension-loader.test.ts 跑（確認可 load）
   ↓ 通過
回傳成功訊息給 admin
```

**覆寫保護**：
- 預設：若 `extensions/<name>/` 已存在 → 報錯 `Extension already exists. Use --force to overwrite.`
- `--force` flag：允許覆寫，但需備份原 extension 到 `extensions-backup/<name>-<timestamp>/`

**位置**：
- `lib/ai/agent-sdk/extension-validator.ts`（新增）
- `tests/extension-generator-guard.test.ts`（新增）

#### 風險與緩解

| 風險 | 嚴重性 | 緩解 |
|---|---|---|
| AI 生成品質不穩定 | 🟠 高 | spike 先驗證可行性（FR-19.1） |
| 覆寫既有 extensions | 🔴 嚴重 | 預設拒絕, --force 才覆寫，且備份（FR-19.5） |
| 生成程式碼無法編譯 | 🟠 高 | tsc 驗證（FR-19.5） |
| Manifest schema 不符 | 🟡 中 | Zod schema 驗證（FR-19.5） |
| AI 寫到 extensions/ 之外路徑 | 🔴 嚴重 | 路徑防護（只能寫入 `extensions/<name>/`）+ 守護測試 |
| 與既有 admin chat 衝突 | 🟡 中 | 僅在 slash command 觸發，不影響一般 chat |

#### 明確排除（Sprint 52 不做）

| 項目 | 排除原因 |
|---|---|
| 自動 e2e 測試（C 方案） | 範圍過大，留 Sprint 53+ |
| Generator API 工具（C 方案） | Sprint 52 只做 admin chat 內生成，不建獨立工具 |
| 支援其他 extension 類型 | Sprint 52 聚焦 product，其他類型 Sprint 53+ 評估 |
| 自動 commit + push | admin 需手動確認（避免 AI 自動 push 風險） |

#### FR 總計（含 Sprint 52）

| 主題 | FR 數 | SP 總計 |
|---|---|---|
| Sprint 47~51（累積） | 68 | ~21.2 |
| FR-19 AI Chat 生成 extensions（Sprint 52） | 5 | 2.0 |
| **Sprint 52 新增** | **5 FR** | **~2.0 SP** |
| **總計（Sprint 47+48+49+50+51+52）** | **73 FR** | **~23.2 SP** |

**Sprint 52 範圍方案選擇**：
- ✅ **方案 A**（本 Sprint 採用）：AI chat 自然語言生成完整 product extension（3 commits / 2 SP）
- 替選方案（已取消）：
  - B（1 SP, 最小骨架 3 檔案）— 範圍過小，不足以驗證 AI 生成品質
  - C（2.5 SP, 生成 + 自動測試）— 範圍過大，自動 e2e 留 Sprint 53+
  - D（1.5 SP, 手動建）— 不是 AI，違背用戶需求

#### Sprint 53+ 帶下

| 項目 | 預估 SP | 備註 |
|---|---|---|
| 自動 e2e 測試生成的 extension | 1.0 | Sprint 52-2 排除，後續評估 |
| Generator API 工具（CLI） | 2.0 | Sprint 52-2 排除，後續評估 |
| 支援更多 extension 類型（inventory, invoice 等） | TBD | 評估常見需求 |
| SourcesList v3（圖片 preview） | 1.2 | 從 Sprint 50 帶下第 5 次 |
| CRUD List 增強 | 5 | 從 Sprint 48 帶下第 4 次 |

### 2.15 FR-20：整合 admin chat + 端到端生成 product extension

> **Sprint 53 決策**（基於 [Sprint 52 Reflection](reflection/sprint-52-reflection.md) §5 帶下項目）：
> - **方向：將 Sprint 52 設計推到 runtime 整合**
> - **3 commits / 3 SP / 4 FR**
> - **延續 Sprint 52 新方向** — 從設計階段進入實際整合階段
> - 詳見 [sprint53-plan-gate.md](../sprint53-plan-gate.md)

| FR | 描述 | 優先 | SP |
|----|------|------|-----|
| **FR-20.1** | admin-chat-panel 整合 slash command 偵測 `/extension create` | P3 | 0.5 |
| **FR-20.2** | server-side 攔截 pi agent tool call, 呼叫 validator | P3 | 0.5 |
| **FR-20.3** | 端到端：admin 輸入 → AI 生成 → 驗證 → extensions/product/ 8 個檔案 | P3 | 1.5 |
| **FR-20.4** | 三層驗證整合：loader test + manifest schema + tsc 編譯 | P3 | 0.5 |
| **總計** | **4 FR** | | **3.0 SP** |

#### 5 個 Q&A 決策彙總

| 決策 | 採用 | 為何 |
|---|---|---|
| 方向 | 整合 admin chat + 攔截 + 端到端生成 product | Sprint 52 reflection §5 明確帶下 |
| 產物 | 完整 8 個檔案 | 對齊 Sprint 52 spike §7 |
| AI 模型 | 沿用 admin chat AI config | 沿用現有基礎設施，不增加配置複雜度 |
| 生成流程 | 同步流程 | 簡單，易測試，避免 SSE 整合複雜度 |
| 錯誤處理 | 回傳明確錯誤訊息 | Admin 可修正 prompt 重試 |

#### FR-20.1 admin chat 整合 slash command

**位置**：`app/admin/_components/admin-chat-panel.tsx`（修改）

**設計**：
- 在現有 input handler 中偵測 `/extension` 開頭
- 呼叫 `parseExtensionCommand(input)` 解析（Sprint 52-1）
- 若為 `create` action, 觸發 extension generator flow（不再走一般 chat）
- 若為 `help` action, 回傳用法說明
- 若為非 extension command, 走一般 chat flow

**與 Sprint 46-2 admin chat 整合**：
- 沿用 `use-chat-sessions.ts` 的 session 機制
- 不開新 session, 使用現有 session 即可
- 在 chat 訊息中標記「[Extension Generator]」標籤

#### FR-20.2 server-side 攔截

**位置**：`lib/ai/agent-sdk/agent-sdk.ts`（修改）+ `app/api/admin/chat/stream/route.ts`（修改）

**設計**：
- pi agent 透過 `write_file(path, content)` tool call 寫檔
- Server-side 攔截 write_file tool call:
  1. 檢查 `isPathAllowed(path, extensionName)`（Sprint 52-2）
  2. 若拒絕, 回傳錯誤給 AI（不寫入）
- 全部寫入完成後:
  1. 跑 `validateExtensionFiles(files, extensionName)`（Sprint 52-2）
  2. 失敗 → 全部回滾（刪除已寫入的檔案）
  3. 成功 → 回傳 success 訊息給 admin

#### FR-20.3 端到端生成 product

**輸入格式**：
```
/extension create product --fields=name,price,stock
```

**端到端流程**：
```
1. Admin 輸入 /extension create product --fields=name,price,stock
2. admin-chat-panel 偵測 slash command, 觸發 extension generator
3. Server-side 建立 pi agent session 帶 EXTENSION_GENERATOR_SYSTEM_PROMPT
4. AI 透過 write_file tool call 寫入 8 個檔案
5. Server-side 攔截每個 tool call, 驗證 path + content
6. 全部寫入後, 跑三層驗證（schema + 結構 + tsc）
7. 驗證失敗 → 回滾 + 回傳錯誤訊息
8. 驗證成功 → 回傳 success 訊息 + extension 路徑
```

**生成的 8 個檔案**（對齊 Sprint 52 spike §7）：
```
extensions/product/
├── actions/complete.ts           (1 個 action)
├── computed/isInStock.ts         (1 個 computed)
├── examples/list-and-filter.ts   (1 個 example)
├── hooks/beforeCreate.ts         (1 個 hook)
├── workflow/product-workflow.ts  (1 個 workflow)
├── manifest.json
├── README.md
└── product-spec.json             (CRUD spec)
```

#### FR-20.4 三層驗證整合

**三層驗證**：
- **Layer 1（Schema）**：Zod spec + manifest schema（Sprint 52-2 已實作）
- **Layer 2（結構）**：8 個檔案必須齊全（Sprint 52-2 已實作）
- **Layer 3（編譯）**：tsc --noEmit 對生成的檔案執行編譯檢查（Sprint 53 新增）

**tsc 編譯驗證**：
- 用 Node.js child process 執行 `npx tsc --noEmit extensions/<name>/**/*`
- 若失敗, 回傳錯誤訊息給 admin
- 若成功, extension 已可運作

#### 風險與緩解

| 風險 | 嚴重性 | 緩解 |
|---|---|---|
| pi agent tool call 不易攔截 | 🟠 高 | 用 agent-sdk 提供 callback hook 設計 |
| AI 生成 8 個檔案品質不穩定 | 🟠 中 | 已有 Sprint 52 Zod schema + validator |
| tsc 編譯驗證耗時 | 🟡 中 | 僅驗證生成的 extension 目錄，不全專案 |
| 端到端測試不穩定（需真實 AI） | 🟠 高 | 守護測試為主（mock AI），端到端手動驗證 |
| Token cost 高 | 🟡 中 | 預估 5-10k tokens/extension，可接受 |
| 已生成的 extensions/product/ 影響測試 | 🟢 低 | 守護測試用 `--force` 備份到 extensions-backup/ |

#### 明確排除（Sprint 53 不做）

| 項目 | 排除原因 |
|---|---|
| 自動 e2e 測試（Playwright） | Sprint 52 排除，留 Sprint 54+ |
| Generator CLI 工具 | Sprint 52 排除，留 Sprint 55+ |
| 支援更多 extension 類型 | Sprint 53 只生成 product，其他類型 Sprint 56+ 評估 |
| 自動 commit + push | admin 需手動確認（避免 AI 自動 push 風險） |
| 非同步生成流程（SSE 進度） | 同步流程已足夠，非同步留 Sprint 57+ |

#### FR 總計（含 Sprint 53）

| 主題 | FR 數 | SP 總計 |
|---|---|---|
| Sprint 47~52（累積） | 73 | ~23.2 |
| FR-20 整合 admin chat + 端到端生成（Sprint 53） | 4 | 3.0 |
| **Sprint 53 新增** | **4 FR** | **~3.0 SP** |
| **總計（Sprint 47+48+49+50+51+52+53）** | **77 FR** | **~26.2 SP** |

#### Sprint 54+ 帶下

| 項目 | 預估 SP | 備註 |
|---|---|---|
| 自動 e2e 測試生成的 extension | 1.0 | Sprint 53 排除，評估 Playwright |
| Generator CLI 工具 | 2.0 | Sprint 53 排除，後續評估 |
| 支援更多 extension 類型（inventory, invoice 等） | TBD | 評估常見需求 |
| 非同步生成流程（SSE 進度） | 1.5 | 同步流程已足夠，非同步留後續 |
| SourcesList v3（圖片 preview） | 1.2 | 從 Sprint 50 帶下第 6 次 |
| CRUD List 增強 | 5 | 從 Sprint 48 帶下第 5 次 |

### 2.16 FR-21：AdminChatDialog Delete Button Bug 修復

> **Sprint 54 決策**（基於 [Sprint 53 Reflection](reflection/sprint-53-reflection.md) §6 帶下項目）：
> - **方向：修復 delete button 點不到的 bug**（用戶反饋）
> - **1 commit / 0.5 SP / 5 FR**
> - **從 Sprint 45-46 AdminChatDialog 帶下問題**
> - 詳見 [sprint54-plan-gate.md](../sprint54-plan-gate.md)

| FR | 描述 | 優先 | SP |
|----|------|------|-----|
| **FR-21.1** | admin-chat-dialog 重構: 扁平事件代理 + 原生 `<dialog>` confirm | P0 | 0.3 |
| **FR-21.2** | 鍵盤支援: Enter/Space 選 + Delete 觸發 confirm | P1 | 0.1 |
| **FR-21.3** | 守護測試: 無 nested interactive + useConfirmDialog + data-action | P1 | 0.05 |
| **FR-21.4** | 互動測試: click 路由 (select / delete) + confirm 流程 | P1 | 0.03 |
| **FR-21.5** | 鍵盤測試: Enter/Space/Delete 鍵事件 | P2 | 0.02 |
| **總計** | **5 FR** | | **0.5 SP** |

#### 5 個 Q&A 決策彙總

| 決策 | 採用 | 為何 |
|---|---|---|
| 修復策略 | 重構為扁平事件代理 + 原生 `<dialog>` confirm | 徹底解 nested interactive + confirm() 失效問題 |
| Confirm 設計 | HTML5 `<dialog>` + showModal() | 原生 modal、可摺底蕪、完全可訪問、不需外部 lib |
| Session 點擊 | 點整個 row 選 session | 保留原 UX，不破壞既有使用者習慣 |
| 鍵盤操作 | Enter/Space + Delete 鍵 | Tab 順序自然，無需快捷鍵 |
| 測試範圍 | 守護 + 互動 + 鍵盤 | 三層覆蓋: 結構 + click + 鍵盤 |

#### FR-21.1 重構 admin-chat-dialog

**位置**：`app/admin/_components/admin-chat-dialog.tsx`

**舊結構**（有 bug）：
```tsx
<div role="button" tabIndex={0} onClick={() => handleSelectSession(s.id)}>
  <span>{s.title}</span>
  <span>{s._count.messages}</span>
  <button onClick={(e) => handleDeleteSession(s.id, e)}>  {/* ❌ nested interactive */}
    <Trash2 />
  </button>
</div>
```

**新結構**（扁平事件代理）：
```tsx
<div className="flex items-center gap-1 ..." data-testid={`session-item-${s.id}`}>
  <button
    data-action="select"
    onClick={() => handleSelectSession(s.id)}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleSelectSession(s.id);
      }
    }}
    className="flex-1 text-left ..."
  >
    <span>{s.title}</span>
    <span>{s._count.messages}</span>
  </button>
  <button
    data-action="delete"
    aria-label="刪除對話"
    data-testid={`delete-session-${s.id}`}
    onClick={() => confirmDelete(s.id, s.title)}
    onKeyDown={(e) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        confirmDelete(s.id, s.title);
      }
    }}
    className="ml-1 p-1 rounded hover:bg-destructive/20"
  >
    <Trash2 />
  </button>
</div>
```

**設計重點**：
- 外層 `<div>` 沒有 `role="button"`，純 flex container
- 兩個真正的 `<button>` 並排，用 `data-action` 區分
- 完全符合 HTML5 規範（不再 nested interactive）
- `useConfirmDialog` hook 包裝 `<dialog>` + `showModal()`
- 不再用 `window.confirm()`（dialog 內可能失效）

#### FR-21.2 鍵盤支援

**設計**：
- Tab focus 到 select button → Enter/Space 觸發選 session
- Tab focus 到 delete button → Delete/Backspace 觸發 confirm
- 不用快捷鍵（避免與瀏覽器預設衝突）

**對應無障礙**：
- 每個 `<button>` 都是真正的 button，瀏覽器/螢幕閱讀器原生支援
- `aria-label="刪除對話"` 保留

#### FR-21.3 守護測試

**位置**：`tests/admin-chat-dialog-delete-bug-guard.test.ts`

**守護項目**：
- 不應有 nested interactive (`<div role="button">` 內含 `<button>`)
- 應有 `data-action="select"` / `data-action="delete"` attribute
- 應有原生 `<dialog>` 元素 (或 `showModal()` 呼叫)
- 不應有 `window.confirm()` 呼叫

#### FR-21.4 互動測試

**設計**：
- click row（不含 trash） → 選 session
- click trash icon → 觸發 confirm dialog (showModal)
- confirm 取消 → 不刪除, dialog 關閉
- confirm 確認 → 刪除 session, dialog 關閉

#### FR-21.5 鍵盤測試

**設計**：
- Tab focus + Enter → 選 session
- Tab focus + Space → 選 session
- Tab focus + Delete → 觸發 confirm

#### 風險與緩解

| 風險 | 嚴重性 | 緩解 |
|---|---|---|
| 改 click 行為破壞既有測試 | 🟠 中 | 更新 `admin-chat-dialog-guard.test.ts` 的 data-testid 結構檢查 |
| `<dialog>` 跨瀏覽器 | 🟢 低 | 現代瀏覽器支援度高 (Chrome 37+ / Firefox 98+ / Safari 15.4+) |
| 既有使用者習慣 Enter 键 | 🟢 低 | 保留 Enter 行為 + 視覺一致 |
| 新 `<button>` 取代 `<div role="button">` 改變鍵盤 tab 順序 | 🟢 低 | 兩個 button 並排，Tab 順序自然 |

#### 明確排除（Sprint 54 不做）

| 項目 | 排除原因 |
|---|---|
| AdminChatPanel 改寫 | 範圍過大, 留 Sprint 55+ |
| 鍵盤快捷鍵 (Cmd+D 等) | Enter/Space/Delete 已足 |
| 批量刪除 | 一次性 delete 1 個 session 已足 |
| Toast 通知刪除成功 | 留 Sprint 55+ |
| 從 delete button 移出 dialog 外（Portal） | 範圍過大, 留 Sprint 55+ |
| Auto-focus 第一個 session | 留 Sprint 55+ |

#### FR 總計（含 Sprint 54）

| 主題 | FR 數 | SP 總計 |
|---|---|---|
| Sprint 47~53（累積） | 77 | ~26.2 |
| FR-21 Delete Button Bug 修復 (Sprint 54) | 5 | 0.5 |
| **Sprint 54 新增** | **5 FR** | **~0.5 SP** |
| **總計（Sprint 47~54）** | **82 FR** | **~26.7 SP** |

#### Sprint 55+ 帶下

| 項目 | 預估 SP | 備註 |
|---|---|---|
| AdminChatPanel 改寫 (分離 dialog 邏輯) | 2.0 | Sprint 54 排除 |
| 鍵盤快捷鍵 (Cmd+K 等) | 0.5 | Sprint 54 排除 |
| 批量刪除 sessions | 1.0 | Sprint 54 排除 |
| Toast 通知刪除成功 | 0.3 | Sprint 54 排除 |
| 自動 e2e 測試生成的 extension (Playwright) | 1.0 | 從 Sprint 53 帶下第 2 次 |
| Generator CLI 工具 | 2.0 | 從 Sprint 53 帶下第 2 次 |
| 支援更多 extension 類型 (inventory, invoice 等) | TBD | 從 Sprint 53 帶下第 2 次 |
| 非同步生成流程 (SSE 進度) | 1.5 | 從 Sprint 53 帶下第 2 次 |
| SourcesList v3 (圖片 preview) | 1.2 | 從 Sprint 50 帶下第 7 次 |
| CRUD List 增強 | 5 | 從 Sprint 48 帶下第 6 次 |

---

## 3. 資料模型

### 3.1 Schema 變更總覽

> **Sprint 47 不需新 schema 變更**。Sprint 46 已建好的 `Attachment` model + `ChatSession.deletedAt` 足以支撐所有 Sprint 47 主題。

### 3.2 既有 Schema（複習 Sprint 46 設計）

```prisma
// Sprint 46 FR-6.1 已實作
model Attachment {
  id          String   @id @default(cuid())
  sessionId   String
  session     ChatSession @relation(fields: [sessionId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  filename    String   // 原始檔名
  mimeType    String   // e.g. "application/pdf"
  size        Int      // bytes
  storagePath String   // ./uploads/<sessionId>/<uuid>.<ext>
  uploadedAt  DateTime @default(now())

  @@index([sessionId])    // 主要查詢: 列某 session 的所有附件
  @@index([uploadedAt])   // 次要查詢: Sprint 47+ cleanup job 按時間掃
  @@map("attachments")
}

// Sprint 46 FR-6.3 已實作 (Session 軟刪除為 Sprint 47 cleanup job 鋪路)
model ChatSession {
  id          String        @id @default(cuid())
  userId      String?
  title       String        @default("新對話")
  messages    ChatMessage[]
  attachments Attachment[]
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  deletedAt   DateTime?     // Sprint 47+ cleanup job: 軟刪除 session 連附件一併清
  @@index([deletedAt])
  @@map("chat_sessions")
}

model ChatMessage {
  id        String      @id @default(cuid())
  sessionId String
  role      String
  content   String      @db.Text
  metadata  Json?       // Sprint 47+ 可存 { reasoning: '...', sources: [...] } (規劃中)
  session   ChatSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  createdAt DateTime    @default(now())
  @@index([sessionId, createdAt])
  @@map("chat_messages")
}
```

### 3.3 TypeScript 型別擴展（FR-3.4）

Sprint 47 對 `AttachmentRef` 型別擴展，新增 `image` 與 `office` 兩種 attachment：

```typescript
// Sprint 46: lib/ai/agent-sdk/agent-sdk.ts
export interface AttachmentRef {
  id: string;
  filename: string;
  mime: string;
  storagePath: string;
}

// Sprint 47 FR-3.4: 擴展為支援多類型
export type AttachmentRef =
  | {
      kind: 'text';
      id: string;
      filename: string;
      mime: string;
      storagePath: string;
    }
  | {
      kind: 'image';
      id: string;
      filename: string;
      mime: string;       // e.g. "image/png"
      base64: string;     // 已 base64 encode (從 readAttachmentImage 取得)
    }
  | {
      kind: 'office';     // Sprint 47 FR-5 解析後
      id: string;
      filename: string;
      mime: string;       // e.g. "application/pdf"
      content: string;    // 解析後的文字內容
    };
```

### 3.4 ChatMessage.metadata 規劃（Sprint 48+ 預留）

> **不在 Sprint 47 範圍**：寫 metadata 到 DB。但 Sprint 47 SSE protocol 擴展會傳 `reasoning` 欄位到前端；下次 Sprint 可考慮把 reasoning 也存 DB。

### 3.5 設計決策

| 決策 | 理由 |
|---|---|
| **不新增 schema** | Sprint 46 Attachment + deletedAt 已足；Sprint 47 都是「使用既有 schema」|
| **AttachmentRef union 型別** | 不同 kind 有不同處理（text → prompt, image → SDK image API, office → prompt）；用 TypeScript discriminated union 強制類型安全 |
| **ChatMessage.metadata 不寫 reasoning** | Sprint 47 UI 顯示 reasoning 來自 SSE 串流、不持久化；下次 Sprint 再決定是否要持久化 |
| **Office parser 不存解析結果到 DB** | 解析是純函式，每次請求重新解析；避免 schema 膨脹 |
| **Session ownership 走 helper 不走 Prisma extension** | Sprint 47 Q5 決策；明確設計 > 隱含設計（Sprint 42 TD-815 學習）|

---

## 4. 介面設計

### 4.1 元件樹（Sprint 47 新增 + 既有）

```
AdminChatPanel (Sprint 44)
├── Conversation (Sprint 45 AI Elements)
│   └── Message
│       ├── MessageContent (Sprint 45)
│       │     ├── ReasoningSection (🆕 Sprint 47)   ← FR-2.5
│       │     │     ├── <Thinking> SVG icon
│       │     │     ├── "AI 思考過程" 標題 (預設收合)
│       │     │     └── <pre> reasoning text (展開時顯示)
│       │     └── MarkdownRender (Sprint 46)
│       │           └── CodeBlock (Sprint 45)
│       └── SourcesList (🆕 Sprint 47)            ← FR-2.6
│             ├── <Paperclip> SVG icon
│             ├── "參考附件 (3)" 標題 (預設收合)
│             └── attachment chips (展開時顯示)
├── PromptInputProvider (Sprint 45)
│   ├── AttachmentsChips (Sprint 45)
│   │     └── UploadProgressBar (🆕 Sprint 47)   ← FR-4.5
│   └── PromptInputTextarea / Submit (Sprint 45)
└── (useChatStream.ts 整合 🆕 Sprint 47 真實上傳)  ← FR-4.1
```

### 4.2 ReasoningSection 元件（FR-2.5）

```
┌────────────────────────────────────────────────────────┐
│  AI 思考過程                                       ▼ │  ← 預設收合
└────────────────────────────────────────────────────────┘
展開後 ↓
┌────────────────────────────────────────────────────────┐
│ 🧠 AI 思考過程                                       ▲ │
├────────────────────────────────────────────────────────┤
│ 讓我先分析用戶的問題...                                 │
│ 1. 識別意圖：這是一個 CRUD 生成需求                     │
│ 2. 設計模組：用 Todo extension                         │
│ 3. 規劃 schema：title, description, completed           │
└────────────────────────────────────────────────────────┘
```

**互動**：
- 點擊 header 切換收合/展開（chevron icon 旋轉）
- 鍵盤：Tab 聚焦 + Enter/Space 切換
- reasoning 為空時不顯示元件
- 串流時自動展開（reasoning 持續更新），完成後 1.5 秒自動收合

### 4.3 SourcesList 元件（FR-2.6，降階為附件引用）

```
┌────────────────────────────────────────────────────────┐
│ 📎 參考附件 (3)                                      ▼ │  ← 預設收合
└────────────────────────────────────────────────────────┘
展開後 ↓
┌────────────────────────────────────────────────────────┐
│ 📎 參考附件 (3)                                      ▲ │
├────────────────────────────────────────────────────────┤
│ 📄 requirements.pdf (245 KB)                          │
│ 📊 data.csv (12 KB)                                  │
│ 🖼️  screenshot.png (89 KB)                            │
└────────────────────────────────────────────────────────┘
```

**互動**：
- 點擊 header 切換收合/展開
- 附件數為 0 時不顯示元件
- chip 顯示：圖示（依 mime）+ 檔名 + 大小
- 預設來源 = 本次對話附件（Sprint 47 降階）

### 4.4 UploadProgressBar 元件（FR-4.5）

```
┌─────────────────────────────────────────────────────┐
│ 📤 上傳中 45%                                    ✕ │  ← 取消按鈕
├─────────────────────────────────────────────────────┤
│ ████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ 2.3 MB / 5.1 MB · report.pdf                         │
└─────────────────────────────────────────────────────┘
```

**互動**：
- XHR `onprogress` 事件更新 0-100%
- 點擊 ✕ 呼叫 `xhr.abort()`
- 上傳失敗顯示紅色 + 錯誤訊息

### 4.5 真實前端 upload 流程（FR-4.1-4.7）

```
User: 選檔 (file input)
  ↓
useChatStream.send(files):
  1. 建立 FormData(files[])
  2. POST /api/admin/chat/upload (XHR, onprogress → UploadProgressBar)
  3. 拿 attachment IDs
  4. POST /api/admin/chat/stream (SSE, onDelta → message)
     ├─ onReasoningDelta → reasoning state
     └─ onDelta → message content
  5. close UploadProgressBar
  6. render Message with ReasoningSection + MarkdownRender + SourcesList
```

### 4.6 Cleanup Cron 流程（FR-6.1-6.3）

```
Vercel Cron (每日 03:00 UTC)
  ↓
GET /api/cron/cleanup-attachments
  ↓ (Bearer token 驗證)
requireUser (system token) → cleanupOldAttachments()
  ↓
cleanupOldAttachments() (Sprint 46 commit 6):
  1. cutoff = now - 90 days
  2. 查 Attachment where uploadedAt < cutoff
  3. 逐個: unlink 檔案 + delete DB row
  4. return { deleted: N, failed: M }
  ↓
res.json({ deleted: N, failed: M })

手動 trigger (本機開發 / 緊急):
$ pnpm cleanup:once
  ↓
scripts/cleanup-attachments.ts (tsx 跑 cleanupOldAttachments)
  ↓
console.log("Cleanup complete: { deleted: N, failed: M }")
```

### 4.7 Session Ownership 流程（FR-7.1-7.4）

```
POST /api/admin/chat/stream
  body: { messages, sessionId, attachments: [{ id }] }
  ↓
requireUser() (Sprint 46 既有)
  ↓
isAdmin() (Sprint 46 既有)
  ↓
requireSessionOwnership(sessionId, user.id) (🆕 Sprint 47)
  ├─ db.chatSession.findUnique({ where: { id: sessionId }, select: { userId } })
  ├─ if not found → 404
  ├─ if session.userId !== user.id → 403 "Session does not belong to user"
  └─ else → 繼續
  ↓
db.attachment.findMany({ where: { id: { in }, sessionId } }) (Sprint 46 既有)
  ↓
streamChatMessages(...) (Sprint 47 改用 image multi-modal)
```

---

## 5. API 設計

### 5.1 既有 API（Sprint 46，不變）

| Method | Path | 功能 | Sprint |
|---|---|---|---|
| `POST` | `/api/admin/chat/upload` | 上傳附件（Sprint 46 FR-1.7）| Sprint 46 |
| `POST` | `/api/admin/chat/stream` | SSE 串流對話（Sprint 46 重構）| Sprint 44 + Sprint 46 |
| `GET` `/POST` `/PATCH` `/DELETE` | `/api/admin/chat/sessions/*` | sessions CRUD | Sprint 44 |

### 5.2 新增 API（Sprint 47）

#### 5.2.1 `GET /api/cron/cleanup-attachments`（FR-6.2）

**Request**：
```
GET /api/cron/cleanup-attachments
Headers:
  Authorization: Bearer <CRON_SECRET>
```

**Response 200**：
```json
{
  "deleted": 42,
  "failed": 0,
  "retentionDays": 90,
  "executedAt": "2026-09-01T03:00:00.000Z"
}
```

**Response 401**（token 缺失或錯誤）：
```json
{ "error": "Unauthorized" }
```

**Response 500**：
```json
{ "error": "Cleanup failed: <message>" }
```

**Vercel Cron 設定**（`vercel.json`）：
```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-attachments",
      "schedule": "0 3 * * *"
    }
  ]
}
```

### 5.3 修改 API（Sprint 47）

#### 5.3.1 `POST /api/admin/chat/stream`（FR-7.2）

**修改內容**：在 attachment 查詢前加 `requireSessionOwnership(sessionId, user.id)`

**Request**（不變）：
```json
{
  "messages": [{ "role": "user", "content": "..." }],
  "sessionId": "...",
  "attachments": [{ "id": "..." }]
}
```

**Response**（新增）：
- `403 Session does not belong to user`（user A 送 user B sessionId）
- `404 Session not found`

**SSE protocol 擴展**（FR-2.4）：
```
data: {"content": "讓我先"}
data: {"content": "分析這個問題..."}
data: {"reasoning": "用戶問的是"}        ← 🆕 Sprint 47
data: {"reasoning": " CRUD 生成需求"}
data: {"reasoning": "...完整思考..."}    ← 多個 reasoning event 累積
data: {"content": "我建議"}
data: [DONE]
```

### 5.4 `pnpm cleanup:once` script（FR-6.3）

```typescript
// scripts/cleanup-attachments.ts
import { cleanupOldAttachments } from '@/lib/ai/chat/attachment-cleanup';

async function main() {
  const result = await cleanupOldAttachments();
  console.log(`Cleanup complete: deleted=${result.deleted}, failed=${result.failed}`);
  process.exit(0);
}

main();
```

**`package.json`**：
```json
{
  "scripts": {
    "cleanup:once": "tsx scripts/cleanup-attachments.ts"
  }
}
```

### 5.5 SSE Protocol 變更總覽

| Event Type | Sprint 46 | Sprint 47 |
|---|---|---|
| `data: {"content": "..."}` | ✅ | ✅（不變）|
| `data: {"reasoning": "..."}` | ❌ | ✅（新增）|
| `data: {"error": "..."}` | ✅ | ✅（不變）|
| `data: [DONE]` | ✅ | ✅（不變）|

---

## 6. 測試計劃

### 6.1 測試 4 層架構

| 層級 | 工具 | 覆蓋範圍 |
|---|---|---|
| **單元測試 (Unit)** | Vitest | 純函式（helper、parser、validator）|
| **整合測試 (Integration)** | Vitest + mock fetch | route handler、agent-sdk、SSE protocol |
| **守護測試 (Guard)** | Vitest | source-code guard、檔案存在、import 位置、結構正確性 |
| **E2E** | Playwright | 完整用戶旅程（選檔 → upload → AI 回應）|

### 6.2 各 Stage 測試矩陣

| Stage | 主題 | 單元 | 整合 | 守護 | E2E |
|---|---|---|---|---|---|
| **47-0** | Office Parser Spike | 0 | 1 (spike 評估) | 0 | 0 |
| **47-1** | Sources/Reasoning | 4 (thinking_delta 收集、ReasoningSection、SourcesList) | 3 (useChatStream SSE) | 1 (Message 元件結構) | 1 (Reasoning 展開) |
| **47-2** | Vision | 2 (readAttachmentImage) | 2 (PromptOptions.images) | 1 (AttachmentRef union 型別) | 1 (PNG 上傳 vision) |
| **47-3** | Frontend Upload | 3 (XHR progress、abort、error) | 4 (multipart upload 整合) | 1 (UploadProgressBar 元件) | 2 (選檔 + upload + AI 回應) |
| **47-4** | Office Parser | 3 (PDF/DOCX/XLSX 解析) | 2 (attachment-reader 接 new parser) | 0 | 1 (PDF 上傳 AI 回應) |
| **47-5** | Cleanup Cron | 0 | 4 (route + token + Vercel Cron 設定) | 1 (vercel.json 存在) | 0 |
| **47-6** | Session Ownership | 2 (requireSessionOwnership) | 3 (user A/B 邊界測試) | 1 (source-code guard) | 0 |
| **47-7** | Markdown XSS | 0 | 0 | 0 | 3 (X1 user input / X2 AI output / X3 code block) |
| **總計** | | **14** | **19** | **5** | **8** |

**測試總計：46 個新測試**

### 6.3 關鍵測試場景

#### 47-1 Sources/Reasoning
- **Unit 1**：`session.subscribe` 收到 `thinking_delta` event → 累積字串到 `reasoningContent`
- **Unit 2**：`<ReasoningSection>` 預設收合、點擊展開、鍵盤可達
- **Unit 3**：`<SourcesList>` 顯示附件 chips、預設收合
- **Unit 4**：reasoning 為空時不渲染元件
- **Integration 1**：`useChatStream` 收集 SSE `{"reasoning": "..."}` events
- **Integration 2**：前端 SSE parser 同時處理 content + reasoning 雙 stream
- **Integration 3**：reasoning 串流完成後 1.5 秒自動收合

#### 47-2 Vision
- **Unit 1**：`readAttachmentImage` 正確 base64 encode PNG/JPEG
- **Unit 2**：`AttachmentRef` union 型別 discriminator 正確（`kind: 'image'`）
- **Integration 1**：`streamChatMessages` 呼叫 `session.prompt(text, { images: ImageContent[] })`
- **Integration 2**：多張圖片合併為 ImageContent[]
- **E2E 1**：上傳 PNG → AI 回應含圖片描述

#### 47-3 Frontend Upload
- **Unit 1**：XHR `onprogress` 計算 0-100%
- **Unit 2**：XHR `abort()` 取消進行中上傳
- **Unit 3**：UploadProgressBar 顯示「上傳中 45%」
- **Integration 1**：`useChatStream.send()` 先 upload 再 stream
- **Integration 2**：multipart upload 成功 → attachment IDs 傳 stream
- **Integration 3**：upload 失敗 → toast 錯誤訊息
- **Integration 4**：abort 與 SSE abort 互斥設計
- **E2E 1**：選檔 → upload → AI 回應
- **E2E 2**：選 10 MB+ 檔案 → toast「檔案過大」

#### 47-4 Office Parser
- **Unit 1**：PDF parser 提取所有頁面文字
- **Unit 2**：DOCX parser 提取段落文字
- **Unit 3**：XLSX parser 轉 CSV
- **Integration 1**：`attachment-reader.ts` PDF/DOCX/XLSX 分支正確
- **Integration 2**：解析失敗 → `kind: 'unsupported'` fallback
- **E2E 1**：上傳 PDF → AI 回應含 PDF 內容

#### 47-5 Cleanup Cron
- **Integration 1**：route 收到正確 Bearer token → 呼叫 `cleanupOldAttachments()` → 回傳清理結果
- **Integration 2**：route 收到錯誤/缺失 token → 401
- **Integration 3**：`vercel.json` cron 設定正確（path + schedule）
- **Integration 4**：`pnpm cleanup:once` script 跑通
- **守護 1**：`vercel.json` 檔案存在且含 `crons` 欄位

#### 47-6 Session Ownership
- **Unit 1**：`requireSessionOwnership(sessionId, userId)` 查 DB + 比對
- **Unit 2**：session 不存在 → throw / 回 404
- **Integration 1**：user A 送 user B sessionId → 403
- **Integration 2**：user A 送自己 sessionId → 通過
- **Integration 3**：stream route 完整流程含 ownership 檢查
- **守護 1**：source-code guard — 所有用 body sessionId 的 route 必須 call `requireSessionOwnership`

#### 47-7 Markdown XSS
- **E2E X1**：user input 含 `<script>alert(1)</script>` → Markdown 渲染後文字 escape 為 `&lt;script&gt;`
- **E2E X2**：AI output 含 `<img src=x onerror=alert(1)>` → 應 escape 不渲染為 HTML
- **E2E X3**：code block 內 `<script>` 不執行（已 escape，驗證不破壞）

### 6.4 測試覆蓋率目標

- **Lines**: ≥ 80%（Sprint 46 baseline ~78%）
- **Branches**: ≥ 75%
- **新增 46 測試後預估**：integration 1795 → 1841（+46），E2E 6 → 14（+8）

---

## 7. 開發計劃

### 7.1 7 個 Stage + 1 個 Pre-Spike 順序

```
47-0 (Spike, 0.5 SP)
  ↓ 評估 bundle
47-1 (Sources/Reasoning, 2 SP)
  ↓ reasoning API ready
47-2 (Vision, 2 SP)
  ↓ SDK image API ready
47-3 (Frontend Upload, 4 SP)
  ↓ 前端整合完成
47-4 (Office Parser, 5/2/0 SP, 條件)
  ↓ parser ready (若 spike 通過)
47-5 (Cleanup Cron, 2 SP)
  ↓ 排程上線
47-6 (Session Ownership, 1 SP)
  ↓ 安全修正
47-7 (Markdown XSS, 0.5 SP)
  ↓ E2E 守護
```

### 7.2 Stage 詳述

#### Stage 47-0 — Office Parser Bundle Spike（0.5 SP, 半天）

**Step 1（0.2 SP）**：
- 安裝 `pdf-parse @types/mammoth mammoth xlsx`
- `pnpm install`
- 記錄 lockfile 變化

**Step 2（0.2 SP）**：
- 寫 spike test（vitest）解析 3 種檔案各 1 個樣本
- 量測 `pnpm build` 後 bundle size 變化
- 量測解析時間

**Step 3（0.1 SP）**：
- 產出 `docs/spike/sprint47-office-parser.md` 決策文件
- 若 bundle ≤5MB：照做 47-4（5 SP）
- 若 5MB < bundle ≤10MB：D-1（只做 PDF, 2 SP）
- 若 bundle >10MB：D-2（延 Sprint 48, 0 SP）

**Commit 1**：`spike: office parser bundle evaluation (47-0)` 

#### Stage 47-1 — Sources/Reasoning UI（2 SP, 2 天）

**Step 1（0.5 SP）**：
- `agent-sdk.ts` `session.subscribe` 加 `thinking_delta` 處理
- 新增 `onReasoningDelta` callback 參數
- Unit test：thinking_delta 累積

**Step 2（0.5 SP）**：
- `useChatStream.ts` 收集 reasoning 串流
- SSE protocol 加 `data: {"reasoning": "..."}` event
- Integration test：SSE parser 雙 stream

**Step 3（0.5 SP）**：
- `<ReasoningSection>` 元件（shadcn Collapsible）
- `<SourcesList>` 元件（降階為附件引用）
- Message 元件整合

**Step 4（0.5 SP）**：
- E2E test：Reasoning 展開/收合
- 鍵盤可達 + 自動收合計時

**Commit 2**：`feat: sources & reasoning UI from pi-agent-sdk thinking events (47-1)`

#### Stage 47-2 — Vision 多模態圖片（2 SP, 2 天）

**Step 1（0.5 SP）**：
- `AttachmentRef` union 型別擴展（text/image/office）
- 守護測試：型別 discriminator 正確

**Step 2（0.7 SP）**：
- `streamChatMessages` 改用 `session.prompt(text, { images: ImageContent[] })`
- 整合測試：mock session.prompt 接收到 images 參數

**Step 3（0.4 SP）**：
- 整合測試：上傳 PNG → AI 回應（mock provider）
- 確認 mock provider 有收到 images

**Step 4（0.4 SP）**：
- E2E：上傳 PNG → 真實 Custom URL Provider vision

**Commit 3**：`feat: vision multi-modal via pi-agent-sdk images (47-2)`

#### Stage 47-3 — 真實前端上傳（4 SP, 4 天）

**Step 1（1 SP）**：
- `useChatStream.send()` 重構：先 upload 再 stream
- 多檔合併 multipart upload

**Step 2（0.5 SP）**：
- XHR `onprogress` 事件 + UploadProgressBar 元件
- Unit test：progress 計算

**Step 3（0.5 SP）**：
- XHR `abort()` 整合：useEffect cleanup + 切換 session
- 與 SSE abort 互斥設計

**Step 4（0.5 SP）**：
- 錯誤處理：toast (10 MB 超限 / MIME 不符 / RBAC 失敗)
- 整合測試：錯誤顯示

**Step 5（1.5 SP）**：
- Integration test：完整 upload + stream flow (4 個)
- E2E：選檔 → upload → AI 回應 (2 個)

**Commit 4**：`feat: frontend real upload with XHR abort and progress bar (47-3)`

#### Stage 47-4 — Office Parser（**2 SP, PDF only**, 條件已解答 — D-1 方案）

> **Spike 決策**（2026-08-31, 見 [spike 文件](../spike/sprint47-office-parser.md)）：只做 PDF，D-1 方案。

**Step 1（1 SP）**：PDF parser（pdf-parse v2.4.5, class API）
**Step 2（0.5 SP）**：`attachment-reader.ts` 接 PDF parser（新增 `kind: 'office'` 分支）
**Step 3（0.5 SP）**：整合測試 sample.pdf fixture 解析 + E2E PDF upload

**Commit 5**：`feat: office parser (PDF only, spike D-1) (47-4)`

#### Stage 47-5 — Cleanup Cron（2 SP, 2 天）

**Step 1（0.5 SP）**：
- `/api/cron/cleanup-attachments` route
- Bearer token 守衛

**Step 2（0.5 SP）**：
- `vercel.json` cron 設定
- `pnpm cleanup:once` script

**Step 3（1 SP）**：
- 整合測試：route + token + script
- 文件：`docs/spike/sprint47-cleanup-cron.md`（Vercel Cron 環境變數設定）

**Commit 6**：`feat: cleanup cron (Vercel Cron + pnpm script) (47-5)`

#### Stage 47-6 — Session Ownership（1 SP, 1 天）

**Step 1（0.3 SP）**：
- `lib/auth/session-ownership.ts` `requireSessionOwnership()` helper
- Unit test

**Step 2（0.3 SP）**：
- stream route 整合
- Integration test：user A/B 邊界

**Step 3（0.3 SP）**：
- source-code guard：所有用 body sessionId 的 route 必須 call helper
- 守護測試

**Step 4（0.1 SP）**：
- 文件：未來新 route 的 checklist

**Commit 7**：`feat: requireSessionOwnership helper + source-code guard (47-6)`

#### Stage 47-7 — Markdown XSS E2E（0.5 SP, 半天）

**Step 1（0.5 SP）**：
- Playwright E2E X1/X2/X3 三個場景
- 驗證 escape 後字串在 DOM 內

**Commit 8**：`test: markdown XSS E2E guard (47-7)`

### 7.3 Task 依賴圖

```
47-0 (Spike)
  └─> 47-4 (Office Parser)
        └─> 47-3 (Frontend Upload) [整合時需要 attachment reader 支援]
              └─> 47-7 (XSS)
                    └─> 47-5 (Cron) [需要前端 upload 完成才有資料]
                          └─> 47-6 (Session Ownership) [需 stream route 修改]

47-1 (Sources/Reasoning)  ← 可與 47-2 並行
47-2 (Vision)
```

### 7.4 預估 Commit 序列

| Commit | Stage | 主題 | SP | 預估時間 |
|---|---|---|---|---|
| 1 | 47-0 | spike: office parser bundle | 0.5 | 半天 |
| 2 | 47-1 | feat: sources & reasoning UI | 2 | 2 天 |
| 3 | 47-2 | feat: vision multi-modal | 2 | 2 天 |
| 4 | 47-3 | feat: frontend real upload | 4 | 4 天 |
| 5 | 47-4 | feat: office parser | 5 / 2 / 0 | 5 / 2 / 0 天 |
| 6 | 47-5 | feat: cleanup cron | 2 | 2 天 |
| 7 | 47-6 | feat: session ownership | 1 | 1 天 |
| 8 | 47-7 | test: markdown XSS E2E | 0.5 | 半天 |
| **總計** | | | **17 / 14 / 12 SP** | **17.5 / 14.5 / 12.5 天** |

### 7.5 4 Gate SOP 執行

每個 Commit 完整跑 4 個 Gate：

- **Gate 1（TDD）**：先寫測試紅，再實作綠，再寫整合測試
- **Gate 2（Lint + Typecheck）**：`pnpm lint && pnpm typecheck` 全綠
- **Gate 3（Regression）**：`pnpm test` 全部既有測試不破壞（1795 + 46 = 1841 unit/integration）
- **Gate 4（Reviewer）**：用 `dev-checker-loop` skill 校驗（每 Commit 結束跑一次）

---

## 8. 使用者故事

### 8.1 US-S46-SourcesReasoning（補 Sprint 46 PRD §7 漏做）

> **身為** admin 用戶
> **我想要** 在 AI 回應時看到 AI 的「思考過程」（reasoning）與「參考的附件」（sources）
> **以至於** 我能理解 AI 為何這樣回答、驗證 AI 是否真的有讀我上傳的附件

**驗收條件**：
- [ ] AI 回應時 reasoning 區塊預設收合、點擊展開
- [ ] reasoning 串流時自動展開、完成後 1.5 秒自動收合
- [ ] Sources 區塊顯示本次對話附件清單（檔名 + 大小）
- [ ] 鍵盤可達（Tab + Enter/Space）

### 8.2 US-S47-Vision（圖片多模態）

> **身為** admin 用戶
> **我想要** 上傳 PNG/JPG 圖片後，AI 能「看到」圖片內容並描述
> **以至於** 我能用圖片當 context（例如：截圖 bug、產品照、設計草圖）

**驗收條件**：
- [ ] 上傳 PNG/JPG/WebP/GIF 圖片
- [ ] AI 回應含圖片內容描述（例如：「這個截圖顯示...」）
- [ ] 多張圖片同時上傳 AI 都能看到（最多 10 張）

### 8.3 US-S47-FrontendUpload（真實前端上傳）

> **身為** admin 用戶
> **我想要** 在 chat 選檔時看到上傳進度、能在上傳中取消、上傳失敗有明確錯誤訊息
> **以至於** 我知道 AI 何時開始處理、上傳卡住時可取消、不會傻等

**驗收條件**：
- [ ] 選檔後看到「上傳中 0% → 100%」進度條
- [ ] 點擊 ✕ 取消上傳
- [ ] 10 MB+ 檔案立即 toast「檔案過大」
- [ ] MIME 不符（e.g. .exe）toast「不支援的格式」

### 8.4 US-S47-OfficeParser（PDF/DOCX/XLSX/PPTX）

> **身為** admin 用戶
> **我想要** 上傳 PDF/DOCX/XLSX/PPTX 辦公文件時，AI 能讀取內容並引用
> **以至於** 我能用文件當 context（例如：規格書、合約、報表）

**驗收條件**：
- [ ] 上傳 PDF → AI 回應含 PDF 文字內容
- [ ] 上傳 DOCX → AI 回應含文件段落
- [ ] 上傳 XLSX → AI 回應含 CSV 內容
- [ ] 解析失敗 → 明確錯誤訊息（不卡住）

### 8.5 US-S47-CleanupCron（自動清理 90 天前附件）

> **身為** 系統管理員
> **我想要** 90 天前的附件自動清理、不佔用磁碟空間
> **以至於** production 部署不會無限膨脹

**驗收條件**：
- [ ] Vercel Cron 每日 03:00 UTC 自動跑
- [ ] `pnpm cleanup:once` 本機手動可跑
- [ ] 清理結果有 log（刪除數、失敗數）

### 8.6 TD-S47-SessionOwnership（安全修正）

> **身為** admin 用戶
> **我想要** 我的 chat session 與附件不被其他用戶讀取
> **以至於** 隱私對話與敏感檔案不被外洩

**驗收條件**：
- [ ] user A 送 user B sessionId + attachment ID → 403 拒絕
- [ ] `requireSessionOwnership()` helper 可被未來新 route 重用
- [ ] source-code guard 防止未來 route 漏檢查

### 8.7 TD-S47-MarkdownXSS（XSS E2E 守護）

> **身為** 系統維護者
> **我想要** Markdown 渲染對 XSS 攻擊有 E2E 守護
> **以至於** Sprint 47+ 加 `rehype-raw` 引入 XSS 時被即時抓出

**驗收條件**：
- [ ] E2E 3 場景（user input / AI output / code block）全部通過
- [ ] 守護測試在 CI 必跑

### 8.8 TD-S47-ChatStatus（冰盒，Sprint 48+）

> **身為** 系統維護者
> **我想要** `ChatStatus` 型別不依賴 'ai' SDK
> **以至於** 'ai' SDK 大改版時不破壞 Chat 系統

> **不在 Sprint 47 範圍**：低優先、不影響功能、Sprint 48+ 再處理

---

## 9. 風險與緩解

### 9.1 風險列表

| ID | 風險 | 機率 | 影響 | 緩解策略 |
|---|---|---|---|---|
| **R1** | Office Parser bundle 過大（>5MB）| 中 | 中 | 47-0 spike 提前評估；降階為 D-1（只 PDF, 2 SP）或 D-2（延 Sprint 48）|
| **R2** | pi-agent-sdk PromptOptions.images API 在某些 provider 不支援 | 低 | 高 | 整合測試先驗證 mock provider；不支援時退回 base64+prompt 方案 |
| **R3** | XHR abort 與 SSE abort 衝突 | 低 | 中 | useChatStream 整合測試先寫；abort 互斥設計（upload 完成後才能 abort stream）|
| **R4** | Vercel Cron 免費 tier 限制（每天 1 次）| 低 | 低 | 預設每日 1 次足夠；fallback 用 `pnpm cleanup:once` |
| **R5** | Session Ownership 檢查漏 route | 低 | 高 | 47-6 source-code guard 掃描所有 `app/api/admin/chat/**/*.ts` |
| **R6** | Markdown XSS 在 Playwright 環境與實際瀏覽器行為不同 | 低 | 中 | Playwright 用真實 Chromium；CI 環境一致 |
| **R7** | Reasoning 串流 SSE 解析與現有 content 解析衝突 | 低 | 中 | 47-1 SSE parser 設計雙 stream 累積；整合測試覆蓋 |
| **R8** | Office parser 解析時間過長（>5 秒）| 中 | 中 | 解析在 server-side 背景執行；client 顯示「解析中」 |

### 9.2 風險優先處理順序

```
Critical（必須處理）: R5 (Session Ownership), R1 (Office bundle), R2 (Vision SDK)
High（應該處理）:    R3 (XHR/SSE abort), R7 (SSE 雙 stream), R8 (Office parse time)
Medium（可選處理）:  R4 (Vercel Cron), R6 (XSS Playwright)
```

---

## 10. 不在 Sprint 47 範圍（明確排除）

| 項目 | 排除理由 | 預計 Sprint |
|---|---|---|
| **RAG / 向量資料庫** | Sprint 46 PRD 已排除；Sprint 47 維持全文進 context | 48+ |
| **OCR / 掃描文件識別** | 需 ML 模型 + 第三方 API；不在 MVP 範圍 | 48+ |
| **訊息編輯 / 重新生成** | Sprint 46 PRD 已排除 | 48+ |
| **附件縮圖預覽** | UI 加分項；先滿足核心上傳 + 解析 | 48+ |
| **雲端 Storage（S3 / Vercel Blob）** | 本機 MVP 已足；production deploy 前需遷移 | 48+（deploy 前）|
| **Mermaid / LaTeX 渲染** | Markdown 進階擴展；Sprint 46 已用 react-markdown 完整支援 GFM | 49+ |
| **訊息標記 / 星號收藏** | 不在 Sprint 47 七主題內 | 49+ |
| **多模態影片 / 音訊** | pi-agent-sdk PromptOptions 目前只支援 image | SDK 上游支援後 |
| **Sources 改為外部引用**（Wikipedia / Web）| pi-agent-sdk 沒原生支援；Sprint 47 降階為「附件引用」 | 需 SDK 支援 |
| **TD-S47-ChatStatus 自訂型別** | 低優先，不影響功能 | 48+ |

---

## 11. 相關文檔

- 📐 [系統架構](../system-design.md)
- 🎨 [UX/UI 設計](../DESIGN.md)
- 📋 [Sprint 46 PRD（附件 + Markdown 起點）](./10-chat-attachments.md)
- 📋 [M5 AI Chat PRD（既有）](./06-ai-chat.md)
- 📋 [M4 AI Config PRD（Custom URL Provider 來源）](./05-ai-config.md)
- 📊 [Backlog](../backlog.md)
- 📝 [Sprint 47 Plan Gate 完整紀錄](../sprint47-plan-gate.md)
- 📝 [Sprint 46 Reflection（揭露 6 項問題來源）](../reflection/sprint-46-reflection.md)
- 📝 [Sprint 45 Reflection（AI Elements 基礎建設來源）](../reflection/module-sprint45-reflection.md)
- 📝 [Sprint 43 Reflection（Custom URL Provider 來源）](../reflection/module-sprint43-reflection.md)

---

## 12. 架構演進（Sprint 45 → 46 → 47）

### 12.1 元件層架構

```
Sprint 45（基礎建設）
└── AdminChatPanel
    ├── Conversation / Message (AI Elements)
    │     └── MarkdownRender (自製 parser)
    │           └── CodeBlock / CodeBlockContent (AI Elements + shiki)
    └── PromptInputProvider
          ├── AttachmentsChips (純前端 UI)
          └── PromptInputTextarea / Submit

Sprint 46（附件 + Markdown 真實化）
└── AdminChatPanel
    ├── Conversation / Message
    │     └── MarkdownRender (react-markdown + remark-gfm)
    │           └── CodeBlock (slot)
    └── PromptInputProvider
          ├── AttachmentsChips (純前端 UI，顯示「📎 filename」字串假象)
          └── PromptInputTextarea
          (useChatStream: Sprint 45 string 拼裝)

Sprint 47（本 PRD — 完整閉環）
└── AdminChatPanel
    ├── Conversation / Message
    │     ├── ReasoningSection (🆕 thinking_delta 累積)
    │     ├── MarkdownRender (Sprint 46)
    │     └── SourcesList (🆕 附件引用降階)
    └── PromptInputProvider
          ├── AttachmentsChips
          │     └── UploadProgressBar (🆕 XHR progress)
          └── PromptInputTextarea
          (useChatStream: 🆕 multipart upload + image SDK + SSE reasoning)
```

### 12.2 後端層架構

```
Sprint 46
├── /api/admin/chat/upload (multipart + RBAC + MIME 驗證 + 10MB 上限)
├── /api/admin/chat/stream (SSE via pi-agent-sdk + attachment text 拼 prompt)
├── /api/admin/chat/sessions/* (CRUD)
├── lib/ai/agent-sdk/agent-sdk.ts (streamChatMessages - text_delta only)
├── lib/ai/chat/attachment-reader.ts (text/image/unsupported)
└── lib/ai/chat/attachment-cleanup.ts (utility only, 沒接 cron)

Sprint 47
├── /api/admin/chat/upload (Sprint 46，不變)
├── /api/admin/chat/stream (🆕 image SDK + requireSessionOwnership)
├── /api/admin/chat/sessions/* (Sprint 44-46，不變)
├── 🆕 /api/cron/cleanup-attachments (Bearer token 守衛)
├── lib/ai/agent-sdk/agent-sdk.ts (🆕 thinking_delta + PromptOptions.images)
├── lib/ai/chat/attachment-reader.ts (🆕 office parser 接 pdf-parse/mammoth/xlsx)
├── lib/ai/chat/attachment-cleanup.ts (Sprint 46 utility，接 cron)
└── 🆕 lib/auth/session-ownership.ts (helper)
```

### 12.3 DB Schema 演進

| Sprint | 新增 model | 新增欄位 | 用途 |
|---|---|---|---|
| Sprint 44 | `ChatSession`, `ChatMessage` | — | AI Chat 基礎 |
| Sprint 46 | `Attachment` | `ChatSession.deletedAt` | 附件 + 軟刪除 |
| Sprint 47 | （無） | （無） | 全部用既有 schema |

### 12.4 測試基線演進

| Sprint | Unit/Integration | E2E | 來源 |
|---|---|---|---|
| Sprint 44 | 1629 | 127 | 收尾 baseline |
| Sprint 45 | +0 | +7 | AI Elements 整合 |
| Sprint 46 | +166 | +6 | 附件 + Markdown |
| **Sprint 47** | **+46** | **+8** | 本 PRD（7 主題）|
| **預估 Sprint 47 收尾** | **1841** | **141** | 完整 baseline |

---

## 13. Plan Gate 確認紀錄

### 13.1 Plan Gate 7 個決策

| # | 問題 | 決策 | 備註 |
|---|---|---|---|
| **Q1** | Sprint 47 範圍決策 | ✅ **方案 A — 17 SP 全包 + Office Parser 先 spike** | 預排 18 SP；Q2 後降 1 SP |
| **Q2** | Sources 降階方案 | ✅ **接受降階** — ReasoningSection 完整做 + SourcesList 改為「附件引用折疊區」| pi-agent-sdk 沒 sources 原生支援 |
| **Q3** | Cleanup Cron 部署 | ✅ **Vercel Cron + pnpm script 雙軌** | Vercel 免費 + 本機手動 trigger |
| **Q4** | Office Parser 降階 | ⏳ **待 47-0 spike 結果決定** | spike 通過 / D-1 / D-2 三方案 |
| **Q5** | Session Ownership 位置 | ✅ **helper + source-code guard** | `lib/auth/session-ownership.ts` + guard |
| **Q6** | Markdown XSS E2E 場景 | ✅ **3 場景完整守護** | user input / AI output / code block |
| **Q7** | Design Gate 順序 | ✅ **正常進 Design Gate，寫 PRD 14 章節** | 依 Sprint 46 模式 |

### 13.2 Plan Gate Spike 結果（技術 Q1 + Q2 驗證）

> **讀取位置**：
> - `node_modules/.pnpm/@earendil-works+pi-ai@0.84.4_.../dist/types.d.ts`（line 240-455）
> - `node_modules/.pnpm/@earendil-works+pi-agent-core@0.84.4_.../dist/types.d.ts`（line 385-410）
> - `node_modules/.pnpm/@earendil-works+pi-coding-agent@0.84.4_.../dist/core/agent-session.d.ts`（line 153-364）

| 技術問題 | 驗證結果 | 影響 SP 調整 |
|---------|---------|--------------|
| pi-agent-sdk 支援 sources/reasoning metadata？ | ⚠️ **部分支援**：有完整 `thinking_start/delta/end` events + `ThinkingContent`，**但沒有 `sources` events/field** | 47-1 從 3 SP → **2 SP**（SourcesList 降階為附件引用）|
| pi-agent-sdk 支援 multi-modal image？ | ✅ **完整支援**：`UserMessage.content: string \| (TextContent \| ImageContent)[]` + `PromptOptions.images?: ImageContent[]` | 47-2 從 3 SP → **2 SP**（直接傳 SDK）|

### 13.3 對話記錄

> 日期：2026-08-31
> 用戶：好，做 sprint 47
> BA(我)：依 SOP 進 Plan Gate Q1，先確認 Sprint 47 範圍（18 SP 全包 vs 13 SP 保守 vs 加碼 TD 債清理）
> 用戶：方案 A — 18 SP 全包 + Office Parser (D) 先做 spike 評估 bundle 風險
> BA(我)：Plan Gate Spike 實測 pi-agent-sdk 源碼，發現 sources 不支援但 reasoning 完整；降 1 SP 為 17 SP
> BA(我)：依 「一次一個問題」 問 Q1 降階方案 + Q3 部署 + Q5 檢查位置
> 用戶：接受降階 / Vercel Cron + pnpm script / helper + guard
> BA(我)：問最後 Q6 XSS 場景 + Design Gate 順序
> 用戶：3 場景完整守護 / 正常進 Design Gate 寫 PRD 14 章節
> BA(我)：Plan Gate 完成，進 Design Gate 寫 PRD

---

## 14. Design Gate 完成證明

### 14.1 Design Gate 6 個待辦

| # | 待辦 | 狀態 | 章節 |
|---|---|---|---|
| **1** | PRD 大綱（14 章節骨架）| ✅ | §1-14 完整結構 |
| **2** | FR 章節（8 大主題、40 FR）| ✅ | §2 + §2.9 總計表 |
| **3** | 介面設計（wireframes + 流程圖）| ✅ | §4.1-4.7 |
| **4** | Task 依賴 + Commit 規劃 | ✅ | §7.1-7.4 |
| **5** | 風險與緩解（8 個風險）| ✅ | §9 + §9.1-9.2 |
| **6** | Plan Gate 完整紀錄 + 完成證明 | ✅ | §13-14 |

### 14.2 Design Gate 完成證明

- ✅ PRD 結構完整：14 主章節 + 多個子章節
- ✅ FR 完整：40 個 FR、17.3 SP 對應明確（含 Office 降階情境）
- ✅ 介面設計：5 個 ASCII wireframe（ReasoningSection、SourcesList、UploadProgressBar、上傳流程、Cleanup Cron）+ 1 個 session ownership 流程圖
- ✅ API 設計：1 個新增 endpoint 完整（cleanup cron）+ 1 個修改 endpoint（SSE protocol 擴展）+ 1 個 pnpm script
- ✅ 測試計劃：4 層完整（Unit 14 + Integration 19 + Guard 5 + E2E 8 = 46 個新測試）
- ✅ 開發計劃：8 個 Commit（7 Stage + 1 Spike）+ Task 依賴圖 + 4 Gate SOP
- ✅ 風險管理：8 個風險列出 + 優先處理順序
- ✅ 架構演進：Sprint 45 → 46 → 47 元件 + 後端 + DB + 測試 四層演進圖
- ✅ Plan Gate 對話：7 個決策完整保留 + 2 個 spike 驗證
- ✅ 不在範圍項目：10 個明確排除（含預計 Sprint）

### 14.3 Sprint 47 收尾預期測試基線

- **Unit/Integration**：1795 → **1841**（+46）
- **E2E**：134 → **141**（+7，扣重複 +1 = +8）
- **新增守護測試**：5 個（ReasoningSection、AttachmentRef union、UploadProgressBar、vercel.json、Session Ownership source-code guard）
- **Commit 數**：8 個（1 spike + 7 feature/test）
- **總計**：17.3 SP / 17 天 / 8 commits

### 14.4 下一步

**Execution Gate（Gate 1-4 迴圈）**：
- 開 Commit 1（Office Parser Bundle Spike，0.5 SP）
- 跑 Gate 1（TDD 紅 → 綠）→ Gate 2（lint + typecheck）→ Gate 3（regression）→ Gate 4（reviewer）
- 依序 Commit 1-8，每 commit 完整跑 4 Gate
- 最終 Submit Gate（Commit 8 含 reflection + Sprint 47 reflection 文件）

**降階觸發點**：
- Commit 1 spike 完成後：若 bundle >5MB，降階為 D-1（只 PDF，砍 47-4 SP）；若 >10MB，降階為 D-2（延 Sprint 48）
- Sprint 47 最低保證 12 SP（不含 47-4 Office）
